# Arma plan.json (cortes, audios, subtítulos) desde segmentos.json + datos/al_<id>.json (alinear.py)
# y recorta la voz de cada toma a public/trabajos/<ID>/audio/voz/<id>_<k>.wav (ganancia medida con ebur128).
# Solo hablan las teachers; los chicos aparecen en inserts SIN sonido (la composición los reproduce muted).
# Uso: python armar_plan.py
import json, os, re, subprocess

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ID = "2026-10-29_cei_halloween"
PUB = os.path.join(RAIZ, "public/trabajos", ID)
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
FP = "C:/Videos/_herramientas/ffmpeg/bin/ffprobe.exe"
PAD_IN, PAD_OUT = 0.35, 0.28  # PAD_IN largo: la teacher aparece y el flash de luz se va antes de que empiece a hablar  # s antes de la primera palabra / después de la última
PAD_SUB = 0.03  # el subtítulo entra un poco antes de la primera palabra
LUFS_VOZ = -17.0  # nivel de cada voz antes de la mezcla final
FUNDIDO_TRANSICION = 0  # frames de cruce con la teacher 1 (0 = corte directo después del "Welcome")
FADE_CORTE = 2  # frames de fundido de audio en las uniones de una muletilla sacada

# Apertura: los chicos gritando "Welcome" (insert sin sonido) y transición a la teacher 1
APERTURA = ("IMG_4544", 2.0, 1.5)  # con su sonido: arranca justo antes del "Welcome" y termina cuando la palabra termina; la música arranca con la teacher 1

# Inserts (clip, ini en s, peso). Siempre sin sonido, sobre la voz de las teachers o con la música sola.
INS = {  # todos distintos entre sí (clips y escenas), a pedido: nada repetido
    "hook": [("IMG_4611", 6.0, 1), ("IMG_4612", 12.0, 1), ("IMG_4615", 0.5, 1), ("IMG_4613", 1.0, 1),
             ("IMG_4559", 0.3, 1)],
    "china": [("IMG_4618", 0.2, 1), ("IMG_4576", 0.2, 1), ("IMG_4584", 0.5, 1), ("IMG_4634", 10.0, 1)],
    "pausa": [("IMG_4606", 0.3, 1), ("IMG_4622", 3.0, 1)],  # 2 inserts: cada uno dura 1,3 s o más
    "idea": [("IMG_4638", 0.5, 2.0), ("IMG_4560", 0.0, 1.3)],
    "finito": [("IMG_4582", 2.0, 1), ("IMG_4583", 0.8, 1), ("IMG_4578", 1.5, 1)],
    "cola": [("IMG_4562", 0.2, 1), ("IMG_4573", 2.0, 1)],
}
COLA_S = 3.4  # inserts de los chicos con la música sola, después de la teacher 3 y antes de la placa
TEACHER3_EN = 30.0  # la teacher 3 arranca en este segundo (pedido); la pausa de inserts con música sola se ajusta
PAUSA_MIN = 2.0
NIVEL_PAUSA = 0.4  # volumen de la música en cada tramo sin voz
# Cobertura con inserts: (índice del subtítulo donde empiezan, donde terminan (None = hasta el final))
COBERTURA = {"hook": (1, None), "china": (1, None), "idea": (2, None), "finito": (1, 3)}
ORDEN = ["hook", "china", "pausa", "idea", "finito"]

cfg = json.load(open(os.path.join(RAIZ, "src/trabajos", ID, "segmentos.json"), encoding="utf-8"))["segmentos"]
S = {s["id"]: s for s in cfg}


def dur_clip(clip):
    r = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                        os.path.join(PUB, "crudos", clip + ".mp4")], capture_output=True, text=True)
    return float(r.stdout.strip())


def procesar(s):
    al = json.load(open(os.path.join(PUB, "datos", f"al_{s['id']}.json"), encoding="utf-8"))
    n_prev = len(s["previo"].split()) if s["previo"] else 0
    cuentas = [len(c.split()) for c in s["chunks"]]
    n_use = sum(cuentas)
    usadas = al[n_prev:n_prev + n_use]
    assert len(usadas) == n_use, f"{s['id']}: alinear devolvió {len(al)} palabras, se esperaban {n_prev + n_use}+"
    ini = usadas[0]["ini"] - PAD_IN
    fin = usadas[-1]["fin"] + PAD_OUT
    if n_prev: ini = max(ini, al[n_prev - 1]["fin"] + 0.02)
    ini = max(ini, s["ventana"][0])
    if len(al) > n_prev + n_use: fin = min(fin, al[n_prev + n_use]["ini"] - 0.02)
    fin = min(fin, dur_clip(s["clip"]) - 0.02)
    subs, k = [], 0
    for c, n in zip(s["chunks"], cuentas):
        subs.append({"t": c, "ini": usadas[k]["ini"] - PAD_SUB, "fin": usadas[k + n - 1]["fin"], "pal": usadas[k:k + n]})
        k += n
    return ini, fin, subs


def ganancia(wav):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", wav, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return LUFS_VOZ - float(m[-1]) if m else 0.0


DF = "C:/Videos/_herramientas/.venv/Scripts/deepFilter.exe"
ATENUACION = 12  # dB como máximo: saca el ruido de fondo sin robotizar la voz


def limpiar_voz(clip, a, d, salida):
    """Tramo [a, a+d] del clip con pasa-altos 70 Hz + DeepFilterNet (atten-lim 12)."""
    carpeta = os.path.join(PUB, "audio", "voz", "_df")
    os.makedirs(carpeta, exist_ok=True)
    crudo = os.path.join(carpeta, "seg.wav")
    subprocess.run([FF, "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i",
                    os.path.join(PUB, "crudos", clip + ".mp4"), "-vn", "-ac", "1", "-ar", "48000",
                    "-af", "highpass=f=70", crudo], check=True)
    subprocess.run([DF, crudo, "--atten-lim", str(ATENUACION), "-o", carpeta], check=True, capture_output=True)
    os.replace(os.path.join(carpeta, "seg_DeepFilterNet3.wav"), salida)
    os.remove(crudo)
    os.rmdir(carpeta)


def cortar_wav(clip, a, d, wav):
    subprocess.run([FF, "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i",
                    os.path.join(PUB, "crudos", clip + ".mp4"), "-vn", "-ac", "1", "-ar", "48000", wav], check=True)


def repartir(clip_ins, dur):
    """Inserts en cadena que cubren `dur` s (pesos iguales); el ini se acota para que no pase del final del clip."""
    peso = sum(w for _, _, w in clip_ins)
    out = []
    for clip, c0, w in clip_ins:
        d = w * dur / peso
        c0 = max(0.0, min(c0, dur_clip(clip) - d - 0.1))
        out.append({"clip": clip, "ini": round(c0, 3), "dur": round(d, 3)})
    return out


os.makedirs(os.path.join(PUB, "audio", "voz"), exist_ok=True)
for f in os.listdir(os.path.join(PUB, "audio", "voz")):
    os.remove(os.path.join(PUB, "audio", "voz", f))

W = APERTURA[2]
t = W
video = [{"clip": APERTURA[0], "ini": APERTURA[1], "dur": W}]
audio, subs, musica_sola = [], [], []
_w = os.path.join(PUB, "audio", "voz", "apertura_0.wav")
cortar_wav(APERTURA[0], APERTURA[1], W, _w)
audio.append({"id": "apertura_0", "desde": 0.0, "dur": W, "gananciaDb": round(ganancia(_w), 2), "fade": 2})

for sid in ORDEN:
    if sid == "pausa":
        pausa = max(PAUSA_MIN, TEACHER3_EN - t)
        print("pausa de inserts", round(pausa, 2), "s; teacher 3 arranca en", round(t + pausa, 2))
        video += repartir(INS["pausa"], pausa)
        musica_sola.append({"desde": round(t, 3), "hasta": round(t + pausa, 3), "nivel": NIVEL_PAUSA})
        t += pausa
        continue
    s = S[sid]
    ini, fin, ss = procesar(s)
    cortes = [[max(a, ini), min(b, fin)] for a, b in s.get("cortes", [])]

    def m(tc):  # s del clip -> s de la línea de tiempo (descontando lo que se saca)
        return t + (tc - ini) - sum(min(max(tc - a, 0), b - a) for a, b in cortes)

    def tramos(c0, c1):  # [c0, c1] del clip sin las muletillas sacadas
        out, cur = [], c0
        for a, b in sorted(cortes):
            if b <= cur or a >= c1: continue
            if a > cur: out.append((cur, a))
            cur = max(cur, b)
        if cur < c1: out.append((cur, c1))
        return out

    dur = (fin - ini) - sum(b - a for a, b in cortes)
    tmp = os.path.join(PUB, "audio", "voz", "_tmp.wav")
    if s.get("limpiar"): limpiar_voz(s["clip"], ini, fin - ini, tmp)
    else: cortar_wav(s["clip"], ini, fin - ini, tmp)
    g = round(ganancia(tmp), 2)
    for k, (a, b) in enumerate(tramos(ini, fin)):
        wav = os.path.join(PUB, "audio", "voz", f"{sid}_{k}.wav")
        subprocess.run([FF, "-v", "error", "-y", "-ss", f"{a - ini:.3f}", "-t", f"{b - a:.3f}", "-i", tmp, "-c:a", "pcm_s16le", wav], check=True)
    os.remove(tmp)
    for k, (a, b) in enumerate(tramos(ini, fin)):
        audio.append({"id": f"{sid}_{k}", "desde": round(m(a), 3), "dur": round(b - a, 3), "gananciaDb": g,
                      "fade": FADE_CORTE if cortes else 3})
    # subtítulos cortos (hasta 3 palabras, repartidas parejo); cada uno dura hasta que empieza el siguiente
    finos = []
    for x in ss:
        pal = x["pal"]
        n_g = -(-len(pal) // 3)
        base, extra = divmod(len(pal), n_g)
        k = 0
        for j in range(n_g):
            n = base + (1 if j < extra else 0)
            trozo = pal[k:k + n]
            finos.append({"t": " ".join(w["palabra"] for w in trozo), "ini": trozo[0]["ini"] - PAD_SUB, "fin": trozo[-1]["fin"]})
            k += n
    if s.get("mayus"):
        finos[0]["t"] = finos[0]["t"][0].upper() + finos[0]["t"][1:]
    for i, x in enumerate(finos):
        sig = finos[i + 1]["ini"] if i + 1 < len(finos) else None
        hasta = sig if sig is not None and sig - x["fin"] < 0.5 else x["fin"] + 0.3
        subs.append({"t": x["t"], "desde": round(m(x["ini"]), 3), "hasta": round(m(hasta), 3)})
    # video: la teacher a cámara y, donde corresponde, inserts encima (sin sonido)
    i0, i1 = COBERTURA[sid]
    ca = ss[i0]["ini"]
    cb = ss[i1]["ini"] if i1 is not None else fin
    primero = True
    for a, b in tramos(ini, ca):
        v = {"clip": s["clip"], "ini": round(a, 3), "dur": round(b - a, 3)}
        if primero: v["flash"] = True  # transición de luz (flash de cámara) al entrar cada teacher
        if sid == "hook" and primero and FUNDIDO_TRANSICION: v["fundido"] = FUNDIDO_TRANSICION
        video.append(v)
        primero = False
    video += repartir(INS[sid], m(cb) - m(ca))
    for a, b in tramos(cb, fin):
        video.append({"clip": s["clip"], "ini": round(a, 3), "dur": round(b - a, 3)})
    t += dur

# (sin inserts de cola: la placa entra apenas termina de hablar la teacher)
suma = sum(v["dur"] for v in video)
video[-1]["dur"] = round(video[-1]["dur"] + (t - suma), 3)
print("voces+inserts", round(t, 2), "video", round(sum(v["dur"] for v in video), 2))
plan = {"video": video, "audio": audio, "subs": subs, "tags": [], "musicaSola": musica_sola, "musicaDesde": round(W, 3), "finTomas": round(t, 3)}
json.dump(plan, open(os.path.join(RAIZ, "src/trabajos", ID, "plan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
