# Arma plan_ninos.json (respuestas de los chicos) desde segmentos_ninos.json + datos/aln_<id>.json
# y recorta/limpia la voz de cada respuesta a public/trabajos/<ID>/audio/voz/n_<id>.wav (DeepFilterNet 12 dB + ganancia).
# Uso: python armar_plan_ninos.py   (después de alinear_ninos.py)
import json, os, re, subprocess
import numpy as np

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ID = "2026-10-29_cei_halloween"
PUB = os.path.join(RAIZ, "public/trabajos", ID)
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
FP = "C:/Videos/_herramientas/ffmpeg/bin/ffprobe.exe"
DF = "C:/Videos/_herramientas/.venv/Scripts/deepFilter.exe"
PAD_IN, PAD_OUT = 0.04, 0.06  # el corte cae pegado al habla (se afina con la energía del audio)
PAD_SUB = 0.03
GAP_MIN = 0.3  # (sinPausas) hueco entre palabras que se corta
GAP_PAD_OUT, GAP_PAD_IN = 0.10, 0.08  # lo que se deja de aire antes/después del corte
LUFS_VOZ = -17.0
ATENUACION = 12
TITULO_S = 2.0  # placa de la pregunta (los chicos hablan desde el s 2)
NIVEL_TITULO = 0.26  # música sobre la placa (sin voces; musica_ninos.wav está a -14 LUFS)

cfg = json.load(open(os.path.join(RAIZ, "src/trabajos", ID, "segmentos_ninos.json"), encoding="utf-8"))["segmentos"]


def dur_clip(clip):
    r = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                        os.path.join(PUB, "crudos", clip + ".mp4")], capture_output=True, text=True)
    return float(r.stdout.strip())


def energia(clip, a, b):
    """RMS cada 10 ms del audio del proxy entre a y b (s): (inicio, valores)."""
    r = subprocess.run([FF, "-v", "error", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", os.path.join(PUB, "crudos", clip + ".mp4"),
                        "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True)
    x = np.frombuffer(r.stdout, np.float32)
    h = 160
    return np.array([float(np.sqrt((x[i:i + h] ** 2).mean())) for i in range(0, len(x) - h, h)])


def umbral(e):
    return max(0.02, 0.08 * float(np.percentile(e, 95))) if len(e) else 0.02


def inicio_habla(clip, lo, primera):
    """Primer instante con voz de la primera palabra: tras la última pausa (≥ 80 ms) anterior a ella, para no arrancar
    en la cola de la pregunta del entrevistador; si no hay pausa, el primer instante con voz."""
    a = max(lo, primera - 0.6)
    e = energia(clip, a, primera + 0.15)
    u = umbral(e)
    k = len(e) - 1
    quieto = 0
    while k >= 0:
        quieto = quieto + 1 if e[k] < u else 0
        if quieto >= 8:
            sig = np.where(e[k + 8:] > u)[0]
            if len(sig): return a + (k + 8 + sig[0]) * 0.01
            break
        k -= 1
    arriba = np.where(e > u)[0]
    return a + arriba[0] * 0.01 if len(arriba) else primera


def fin_habla(clip, ultima, tope):
    """Último instante con voz después del fin alineado de la última palabra."""
    a = ultima - 0.1
    e = energia(clip, a, min(ultima + 0.5, tope))
    arriba = np.where(e > umbral(e))[0]
    return a + (arriba[-1] + 1) * 0.01 if len(arriba) else ultima


def ganancia(wav):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", wav, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return LUFS_VOZ - float(m[-1]) if m else 0.0


def limpiar_voz(clip, a, d, salida):
    carpeta = os.path.join(PUB, "audio", "voz", "_df")
    os.makedirs(carpeta, exist_ok=True)
    crudo = os.path.join(carpeta, "seg.wav")
    subprocess.run([FF, "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", os.path.join(PUB, "crudos", clip + ".mp4"),
                    "-vn", "-ac", "1", "-ar", "48000", "-af", "highpass=f=70", crudo], check=True)
    subprocess.run([DF, crudo, "--atten-lim", str(ATENUACION), "-o", carpeta], check=True, capture_output=True)
    os.replace(os.path.join(carpeta, "seg_DeepFilterNet3.wav"), salida)
    os.remove(crudo)
    os.rmdir(carpeta)


os.makedirs(os.path.join(PUB, "audio", "voz"), exist_ok=True)
for f in os.listdir(os.path.join(PUB, "audio", "voz")):
    if f.startswith("n_"): os.remove(os.path.join(PUB, "audio", "voz", f))

t = TITULO_S
video, audio, subs, tags = [], [], [], []
for k, s in enumerate(cfg):
    al = json.load(open(os.path.join(PUB, "datos", f"aln_{s['id']}.json"), encoding="utf-8"))
    n_prev = len(s.get("previo", "").split()) if s.get("previo") else 0
    cuentas = [len(c["t"].split()) for c in s["chunks"]]
    usadas = al[n_prev:n_prev + sum(cuentas)]
    assert len(usadas) == sum(cuentas), f"{s['id']}: {len(al)} palabras alineadas, se esperaban {n_prev + sum(cuentas)}+"
    if s.get("primera") is not None: usadas[0]["ini"] = s["primera"]
    lo = max(s["ventana"][0], al[n_prev - 1]["fin"] + 0.02) if n_prev else s["ventana"][0]
    ini = max(inicio_habla(s["clip"], lo, usadas[0]["ini"]) - PAD_IN, lo)
    tope = min(dur_clip(s["clip"]) - 0.02, s["ventana"][1] + 0.3)
    if len(al) > n_prev + len(usadas): tope = min(tope, al[n_prev + len(usadas)]["ini"] - 0.02)
    fin = min(fin_habla(s["clip"], usadas[-1]["fin"], tope) + PAD_OUT, tope)
    # piezas: un solo tramo, o (sinPausas) se saltan los silencios y muletillas entre palabras (> GAP_MIN s)
    piezas = [[ini, fin]]
    if s.get("sinPausas"):
        piezas = [[ini, None]]
        for a, b in zip(usadas, usadas[1:]):
            if b["ini"] - a["fin"] > GAP_MIN:
                piezas[-1][1] = a["fin"] + GAP_PAD_OUT
                piezas.append([b["ini"] - GAP_PAD_IN, None])
        piezas[-1][1] = fin
    dur = sum(b - a for a, b in piezas)
    arranques = []  # (inicio en el video, inicio en pantalla, fin en el video)
    tt = t
    for q, (a, b) in enumerate(piezas):
        nombre = f"n_{s['id']}" + (f"_{q}" if len(piezas) > 1 else "")
        wav = os.path.join(PUB, "audio", "voz", nombre + ".wav")
        limpiar_voz(s["clip"], a, b - a, wav)
        audio.append({"id": nombre, "desde": round(tt, 3), "dur": round(b - a, 3), "gananciaDb": round(ganancia(wav), 2), "fade": 3})
        v = {"clip": s["clip"], "ini": round(a, 3), "dur": round(b - a, 3)}
        if k == 0 and q == 0: v["flash"] = True  # flash de luz al pasar de la placa a la primera respuesta
        video.append(v)
        arranques.append((a, tt, b))
        tt += b - a

    def pant(tau):
        """Tiempo del video -> tiempo en pantalla (lo que cae en un hueco recortado pasa al inicio del tramo siguiente)."""
        for a, ti, b in arranques:
            if tau <= b: return ti + max(0.0, tau - a)
        return t + dur

    # un subtítulo por chunk (≤ 3 palabras; el chunk trae `es` si el chico habla inglés: doble subtítulo)
    finos, i = [], 0
    for c, n in zip(s["chunks"], cuentas):
        pal = usadas[i:i + n]
        i += n
        if c.get("es"):  # inglés: el chunk ya viene armado con su traducción
            finos.append({"t": c["t"], "es": c["es"], "ini": pal[0]["ini"] - PAD_SUB, "fin": pal[-1]["fin"]})
            continue
        # español: grupos de hasta 3 palabras y 21 letras (a 72 px entran en una línea)
        grupos, cur = [], []
        for w in pal:
            if cur and (len(cur) >= 3 or cur[-1]["palabra"].endswith(",") or len(" ".join(x["palabra"] for x in cur + [w])) > 21):
                grupos.append(cur)
                cur = []
            cur.append(w)
        if cur: grupos.append(cur)
        for tr in grupos:
            finos.append({"t": " ".join(w["palabra"] for w in tr), "ini": tr[0]["ini"] - PAD_SUB, "fin": tr[-1]["fin"]})
    if s.get("mayus"): finos[0]["t"] = finos[0]["t"][0].upper() + finos[0]["t"][1:]
    for q, x in enumerate(finos):
        sig = finos[q + 1]["ini"] if q + 1 < len(finos) else None
        # entran y salen en seco: cada uno dura hasta que empieza el siguiente; el último, hasta el corte
        if sig is None: hasta = t + dur
        else: hasta = pant(sig) if sig - x["fin"] < 0.6 else pant(x["fin"]) + 0.15
        d = {"t": x["t"], "desde": round(max(pant(x["ini"]), t), 3), "hasta": round(hasta, 3)}
        if x.get("es"): d["es"] = x["es"]
        subs.append(d)
    # cartel del país: se mantiene entre respuestas del mismo país
    if tags and tags[-1]["t"] == s["pais"]:
        tags[-1]["hasta"] = round(t + dur, 3)
    else:
        tags.append({"t": s["pais"], "desde": round(t, 3), "hasta": round(t + dur, 3)})
    t += dur

print("total", round(t, 2), "s;", len(video), "respuestas")
plan = {"video": video, "audio": audio, "subs": subs, "tags": tags,
        "musicaSola": [{"desde": 0.0, "hasta": TITULO_S, "nivel": NIVEL_TITULO}], "titulo": TITULO_S, "finTomas": round(t, 3)}
json.dump(plan, open(os.path.join(RAIZ, "src/trabajos", ID, "plan_ninos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
