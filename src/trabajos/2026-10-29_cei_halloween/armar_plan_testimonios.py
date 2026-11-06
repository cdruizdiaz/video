# Arma plan_testimonios.json (alumnas, alumna y padres que cuentan qué les pareció la actividad) desde segmentos_testimonios.json.
# Por clip: alinea el texto (pregunta + respuesta) con alinear_en.py, se queda solo con las partes donde hablan
# (salta silencios y muletillas: huecos de más de GAP_MIN s entre palabras), limpia la voz de cada tramo con
# DeepFilterNet (public/trabajos/<ID>/audio/voz/t_<id>_<k>.wav) y arma subtítulos simples (español, grupos cortos).
# Uso: python armar_plan_entrevistas.py   (Python del .venv)  y después  python retoques_ninos.py plan_testimonios.json
import json, os, re, subprocess, sys
import numpy as np

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ID = "2026-10-29_cei_halloween"
PUB = os.path.join(RAIZ, "public/trabajos", ID)
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
FP = "C:/Videos/_herramientas/ffmpeg/bin/ffprobe.exe"
DF = "C:/Videos/_herramientas/.venv/Scripts/deepFilter.exe"
PAD_IN, PAD_OUT = 0.04, 0.06  # aire pegado al habla (se afina con la energía del audio)
PAD_SUB = 0.03
GAP_MIN = 0.3  # hueco entre palabras que se corta (silencio o muletilla)
GAP_PAD_OUT, GAP_PAD_IN = 0.10, 0.08
SALTO_MIN = 0.15  # hueco recortado mínimo para que valga un corte
LUFS_VOZ = -17.0
ATENUACION = 12
Y_CARTEL = 270  # todos los carteles de país a la misma altura (criterio CEI)

cfg = json.load(open(os.path.join(RAIZ, "src/trabajos", ID, "segmentos_testimonios.json"), encoding="utf-8"))


def dur_clip(clip):
    r = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                        os.path.join(PUB, "crudos", clip + ".mp4")], capture_output=True, text=True)
    return float(r.stdout.strip())


def energia(clip, a, b):
    """RMS cada 10 ms del audio del proxy entre a y b (s)."""
    r = subprocess.run([FF, "-v", "error", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", os.path.join(PUB, "crudos", clip + ".mp4"),
                        "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True)
    x = np.frombuffer(r.stdout, np.float32)
    h = 160
    return np.array([float(np.sqrt((x[i:i + h] ** 2).mean())) for i in range(0, len(x) - h, h)])


def umbral(e):
    return max(0.02, 0.08 * float(np.percentile(e, 95))) if len(e) else 0.02


def inicio_habla(clip, lo, primera):
    """Primer instante con voz de la primera palabra: tras la última pausa (≥ 80 ms) anterior a ella."""
    a = max(lo, primera - 0.6)
    e = energia(clip, a, primera + 0.15)
    u = umbral(e)
    k, quieto = len(e) - 1, 0
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
    e = energia(clip, a, max(a + 0.05, min(ultima + 0.5, tope)))
    arriba = np.where(e > umbral(e))[0]
    return a + (arriba[-1] + 1) * 0.01 if len(arriba) else ultima


def ganancia(wav):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", wav, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    if not m or float(m[-1]) < -50: return None
    return LUFS_VOZ - float(m[-1])


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


def alinear(s):
    salida = os.path.join(PUB, "datos", f"aln_tes_{s['id']}.json")
    if not os.path.exists(salida):
        texto = " ".join(c["t"] for c in s["chunks"])
        subprocess.run([sys.executable, os.path.join(RAIZ, "scripts/alinear.py"), os.path.join(PUB, "crudos", s["clip"] + ".mp4"), texto,
                        "--desde", str(s.get("desde", 0)), "--hasta", str(s["fin"]), "--json", salida], check=True, capture_output=True)
    return json.load(open(salida, encoding="utf-8"))


os.makedirs(os.path.join(PUB, "audio", "voz"), exist_ok=True)
for f in os.listdir(os.path.join(PUB, "audio", "voz")):
    if f.startswith("t_"): os.remove(os.path.join(PUB, "audio", "voz", f))

t = 0.0
video, audio, subs, tags = [], [], [], []
for k, s in enumerate(cfg["segmentos"]):
    al_todas = alinear(s)
    cuentas = [len(c["t"].split()) for c in s["chunks"]]
    assert len(al_todas) == sum(cuentas), f"{s['id']}: {len(al_todas)} palabras alineadas, se esperaban {sum(cuentas)}"
    # los chunks "omitir" se alinean (para ubicar bien el resto) pero se cortan del video
    al, pos = [], 0
    chunks_usados, cuentas_usadas = [], []
    for c, n in zip(s["chunks"], cuentas):
        if not c.get("omitir"):
            al += al_todas[pos:pos + n]
            chunks_usados.append(c)
            cuentas_usadas.append(n)
        pos += n
    s_chunks, s_cuentas = chunks_usados, cuentas_usadas
    # límites: el tramo no arranca antes del fin de lo omitido que lo precede ni termina después del inicio de lo omitido que lo sigue
    idx0 = al_todas.index(al[0])
    idx1 = al_todas.index(al[-1])
    lo_min = al_todas[idx0 - 1]["fin"] + 0.04 if idx0 > 0 else s.get("desde", 0.0)
    hi_max = al_todas[idx1 + 1]["ini"] - 0.03 if idx1 + 1 < len(al_todas) else None
    if s.get("primera") is not None:  # tiempo manual de la primera palabra (si la alineación lo ubica mal)
        al[0]["ini"], al[0]["fin"] = s["primera"], s["primera"] + 0.3
    tope = min(dur_clip(s["clip"]) - 0.02, s["fin"] + 0.3)
    # tramos: se cortan los huecos de más de GAP_MIN entre palabras (silencios y muletillas)
    if s.get("tramos"):  # tramos a mano (s del clip)
        piezas = [list(x) for x in s["tramos"]]
    else:
        ini0 = max(inicio_habla(s["clip"], max(lo_min, s.get("desde", 0.0)), al[0]["ini"]) - PAD_IN, lo_min)
        piezas = [[ini0, None]]
        for a, b in zip(al, al[1:]):
            if b["ini"] - a["fin"] > GAP_MIN:
                piezas[-1][1] = min(fin_habla(s["clip"], a["fin"], b["ini"] - 0.05) + PAD_OUT, b["ini"] - 0.05)
                sig = max(inicio_habla(s["clip"], piezas[-1][1] + 0.02, b["ini"]) - PAD_IN, piezas[-1][1] + 0.02)
                piezas.append([sig, None])
        if hi_max is not None: tope = min(tope, hi_max)
    piezas[-1][1] = min(fin_habla(s["clip"], al[-1]["fin"], tope) + PAD_OUT, tope)
    # si el hueco que queda recortado es casi nada (< SALTO_MIN s), no vale un corte: se unen los tramos
    unidas = [piezas[0]]
    for a, b in piezas[1:]:
        if a - unidas[-1][1] < SALTO_MIN: unidas[-1][1] = b
        else: unidas.append([a, b])
    piezas = unidas
    # rangos que se sacan a mano (muletillas que no se detectan por las palabras, p. ej. un "ehhh" antes de contestar)
    for qa, qb in s.get("quitar", []):
        nuevas = []
        for a, b in piezas:
            if qb <= a or qa >= b: nuevas.append([a, b]); continue
            if qa - a > 0.05: nuevas.append([a, qa])
            if b - qb > 0.05: nuevas.append([qb, b])
        piezas = nuevas
    if s.get("finExacto"): piezas[-1][1] = s["finExacto"]  # fin del último tramo a mano (s del clip)
    dur = sum(b - a for a, b in piezas)
    arranques, tt, gan = [], t, []
    for q, (a, b) in enumerate(piezas):
        nombre = f"t_{s['id']}_{q}"
        wav = os.path.join(PUB, "audio", "voz", nombre + ".wav")
        limpiar_voz(s["clip"], a, b - a, wav)
        gan.append(ganancia(wav))
        audio.append({"id": nombre, "desde": round(tt, 3), "dur": round(b - a, 3), "gananciaDb": None, "fade": 3})
        video.append({"clip": s["clip"], "ini": round(a, 3), "dur": round(b - a, 3)})
        arranques.append((a, tt, b))
        tt += b - a
    ok = [g for g in gan if g is not None]
    base = float(np.median(ok)) if ok else 0.0
    for q in range(len(piezas)):
        audio[len(audio) - len(piezas) + q]["gananciaDb"] = round(gan[q] if gan[q] is not None else base, 2)

    def pant(tau):
        for a, ti, b in arranques:
            if tau <= b: return ti + max(0.0, tau - a)
        return t + dur

    i = 0
    finos = []
    for c, n in zip(s_chunks, s_cuentas):
        pal = al[i:i + n]
        i += n
        # grupos de hasta 3 palabras y 21 letras (a 72 px entran en una línea); se corta también después de una coma
        grupos, cur = [], []
        if c.get("frases"):  # frases lógicas escritas a mano (cuentan las mismas palabras que el texto)
            k = 0
            for fr in c["frases"]:
                m = len(fr.split())
                grupos.append(pal[k:k + m])
                k += m
            assert k == len(pal), f"{s['id']}: las frases suman {k} palabras, el texto tiene {len(pal)}"
            pal = []
        for w in pal:
            if cur and (len(cur) >= 3 or cur[-1]["palabra"][-1] in ".?!" or (len(cur) >= 2 and cur[-1]["palabra"][-1] in ",;:") or len(" ".join(x["palabra"] for x in cur + [w])) > 21):
                grupos.append(cur)
                cur = []
            cur.append(w)
        if cur: grupos.append(cur)
        for tr in grupos:
            finos.append({"t": " ".join(w["palabra"] for w in tr), "ini": tr[0]["ini"] - PAD_SUB, "fin": tr[-1]["fin"]})
        finos[-len(grupos)]["t"] = finos[-len(grupos)]["t"][0].upper() + finos[-len(grupos)]["t"][1:]  # cada frase arranca con mayúscula
    for q, x in enumerate(finos):
        sig = finos[q + 1]["ini"] if q + 1 < len(finos) else None
        # entran y salen en seco: cada uno dura hasta que empieza el siguiente; el último, hasta el corte
        if sig is None: hasta = t + dur + s.get("subExtra", 0.0)  # (subExtra: sigue unos segundos sobre la cola del clip)
        else: hasta = pant(sig) if sig - x["fin"] < 0.6 else min(pant(x["fin"]) + 0.15, pant(sig))  # nunca se pisa con el siguiente
        subs.append({"t": x["t"], "desde": round(max(pant(x["ini"]), t), 3), "hasta": round(hasta, 3)})
    if s.get("cola"):  # el clip sigue unos segundos más, sin voz (a veces en cámara lenta) para enganchar con lo que viene
        c = s["cola"]
        rate = c.get("rate", 1.0)
        dc = (c["hastaPantalla"] - (t + dur)) if "hastaPantalla" in c else (c["fin"] - c["ini"]) / rate
        video.append({"clip": s["clip"], "ini": c["ini"], "dur": round(dc, 3), "rate": rate})
        cola_dur = dc
    else:
        cola_dur = 0.0
    print(s["id"], "tramos", [(round(a, 2), round(b, 2)) for a, b in piezas], "dur", round(dur, 2))
    fin_habla_ult = t + dur  # fin de la voz de esta entrevista (el último se usa para subir la música)
    t += dur + cola_dur

# subtítulos pegados a los cortes de video: si un subtítulo cambia a menos de SNAP s de un corte, cambia justo en el corte
# (si no, un cuadro queda con el subtítulo viejo/ausente sobre la toma nueva); y los huecos de ≤ HUECO_MAX s entre subtítulos se cierran
SNAP, HUECO_MAX = 0.2, 0.12
cortes, acc = [], 0.0
for v in video:
    acc += v["dur"]
    cortes.append(acc)
def al_corte(x):
    c = min(cortes, key=lambda k: abs(k - x))
    return round(c, 3) if abs(c - x) <= SNAP else x
for q, sb in enumerate(subs):
    sb["desde"] = al_corte(sb["desde"])
    sb["hasta"] = al_corte(sb["hasta"])
for a, b in zip(subs, subs[1:]):
    if 0 < b["desde"] - a["hasta"] <= HUECO_MAX: a["hasta"] = b["desde"]

fin_ent = t
inserts = []
for k, x in enumerate(cfg["inserts"]):
    v = dict(x)
    if k == 0: v["flash"] = True  # flash de luz al pasar de las preguntas a la actividad
    inserts.append(v)
fin_ins = fin_ent + sum(x["dur"] for x in inserts)
print("entrevistas", round(fin_ent, 2), "s; inserts hasta", round(fin_ins, 2), "s")
plan = {"video": video, "audio": audio, "subs": subs, "tags": tags, "inserts": inserts,
        "finEntrevistas": round(fin_ent, 3), "finHabla": round(fin_habla_ult, 3), "finInserts": round(fin_ins, 3)}
# voz en UN solo archivo: Remotion aplica el volumen cuadro a cuadro (escalones) y los fundidos de 3 cuadros de cada tramo
# metían un chasquido en cada corte. Acá cada tramo lleva su ganancia y un fundido suave (qsin, FUNDIDO_S) hecho por ffmpeg.
FUNDIDO_S = 0.05
entradas, filtros, mezcla = [], [], []
for k, a in enumerate(audio):
    entradas += ["-i", os.path.join(PUB, "audio", "voz", a["id"] + ".wav")]
    ms = round(round(a["desde"] * 30) / 30 * 1000)
    filtros.append(f"[{k}:a]volume={a['gananciaDb']}dB,afade=t=in:d={FUNDIDO_S}:curve=qsin,afade=t=out:st={a['dur'] - FUNDIDO_S:.3f}:d={FUNDIDO_S}:curve=qsin,adelay={ms}|{ms}[v{k}]")
    mezcla.append(f"[v{k}]")
filtros.append("".join(mezcla) + f"amix=inputs={len(audio)}:normalize=0:dropout_transition=0[o]")
guion_f = os.path.join(PUB, "audio", "voz", "_mezcla.txt")
open(guion_f, "w").write(";".join(filtros))
subprocess.run([FF, "-v", "error", "-y", *entradas, "-/filter_complex", guion_f, "-map", "[o]", "-ar", "48000", "-ac", "1",
                os.path.join(PUB, "audio", "voz_testimonios.wav")], check=True)
os.remove(guion_f)
plan["audio"] = [{"id": "../voz_testimonios", "desde": 0, "dur": round(fin_ent, 3), "gananciaDb": 0, "fade": 1}]
json.dump(plan, open(os.path.join(RAIZ, "src/trabajos", ID, "plan_testimonios.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
