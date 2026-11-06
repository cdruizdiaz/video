# Arma plan_entrevistas.json (chicos que se entrevistan entre ellos, Halloween día 2) desde segmentos_entrevistas.json.
# Por clip: alinea el texto (pregunta + respuesta) con alinear_en.py, se queda solo con las partes donde hablan
# (salta silencios y muletillas: huecos de más de GAP_MIN s entre palabras), limpia la voz de cada tramo con
# DeepFilterNet (public/trabajos/<ID>/audio/voz/e_<id>_<k>.wav) y arma subtítulos dobles (inglés + español).
# Uso: python armar_plan_entrevistas.py   (Python del .venv)  y después  python retoques_ninos.py plan_entrevistas.json
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

cfg = json.load(open(os.path.join(RAIZ, "src/trabajos", ID, "segmentos_entrevistas.json"), encoding="utf-8"))


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
    if s.get("palabras"):  # tiempos a mano
        return [{"palabra": w, "ini": a, "fin": b} for w, a, b in s["palabras"]]
    salida = os.path.join(PUB, "datos", f"aln_ent_{s['id']}.json")
    if not os.path.exists(salida):
        texto = " ".join(c["t"] for c in s["chunks"])
        subprocess.run([sys.executable, os.path.join(RAIZ, "scripts/alinear_en.py"), os.path.join(PUB, "crudos", s["clip"] + ".mp4"), texto,
                        "--desde", "0", "--hasta", str(s["fin"]), "--json", salida], check=True, capture_output=True)
    return json.load(open(salida, encoding="utf-8"))


os.makedirs(os.path.join(PUB, "audio", "voz"), exist_ok=True)
for f in os.listdir(os.path.join(PUB, "audio", "voz")):
    if f.startswith("e_"): os.remove(os.path.join(PUB, "audio", "voz", f))

t = 0.0
video, audio, subs, tags = [], [], [], []
for k, s in enumerate(cfg["segmentos"]):
    al = alinear(s)
    cuentas = [len(c["t"].split()) for c in s["chunks"]]
    assert len(al) == sum(cuentas), f"{s['id']}: {len(al)} palabras alineadas, se esperaban {sum(cuentas)}"
    if s.get("primera") is not None:  # tiempo manual de la primera palabra (si la alineación lo ubica mal)
        al[0]["ini"], al[0]["fin"] = s["primera"], s["primera"] + 0.3
    tope = min(dur_clip(s["clip"]) - 0.02, s["fin"] + 0.3)
    # tramos: se cortan los huecos de más de GAP_MIN entre palabras (silencios y muletillas)
    if s.get("tramos"):  # tramos a mano (s del clip)
        piezas = [list(x) for x in s["tramos"]]
    else:
        ini0 = max(inicio_habla(s["clip"], 0.0, al[0]["ini"]) - PAD_IN, 0.0)
        piezas = [[ini0, None]]
        for a, b in zip(al, al[1:]):
            if b["ini"] - a["fin"] > GAP_MIN:
                piezas[-1][1] = min(fin_habla(s["clip"], a["fin"], b["ini"] - 0.05) + PAD_OUT, b["ini"] - 0.05)
                sig = max(inicio_habla(s["clip"], piezas[-1][1] + 0.02, b["ini"]) - PAD_IN, piezas[-1][1] + 0.02)
                piezas.append([sig, None])
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
    dur = sum(b - a for a, b in piezas)
    arranques, tt, gan = [], t, []
    for q, (a, b) in enumerate(piezas):
        nombre = f"e_{s['id']}_{q}"
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
    for c, n in zip(s["chunks"], cuentas):
        pal = al[i:i + n]
        i += n
        finos.append({"t": c["t"], "es": c["es"], "ini": pal[0]["ini"] - PAD_SUB, "fin": pal[-1]["fin"]})
    for q, x in enumerate(finos):
        sig = finos[q + 1]["ini"] if q + 1 < len(finos) else None
        # entran y salen en seco: cada uno dura hasta que empieza el siguiente; el último, hasta el corte
        if sig is None: hasta = t + dur + s.get("subExtra", 0.0)  # (subExtra: sigue unos segundos sobre la cola del clip)
        else: hasta = pant(sig) if sig - x["fin"] < 0.6 else min(pant(x["fin"]) + 0.15, pant(sig))  # nunca se pisa con el siguiente
        subs.append({"t": x["t"], "es": x["es"], "desde": round(max(pant(x["ini"]), t), 3), "hasta": round(hasta, 3)})
    if s.get("cola"):  # el clip sigue unos segundos más, sin voz (a veces en cámara lenta) para enganchar con lo que viene
        c = s["cola"]
        rate = c.get("rate", 1.0)
        dc = (c["hastaPantalla"] - (t + dur)) if "hastaPantalla" in c else (c["fin"] - c["ini"]) / rate
        video.append({"clip": s["clip"], "ini": c["ini"], "dur": round(dc, 3), "rate": rate})
        cola_dur = dc
    else:
        cola_dur = 0.0
    if tags and tags[-1]["t"] == s["pais"]:
        tags[-1]["hasta"] = round(t + dur + cola_dur, 3)
    else:
        tags.append({"t": s["pais"], "desde": round(t, 3), "hasta": round(t + dur + cola_dur, 3), "y": Y_CARTEL})
    print(s["id"], "tramos", [(round(a, 2), round(b, 2)) for a, b in piezas], "dur", round(dur, 2))
    fin_habla_ult = t + dur  # fin de la voz de esta entrevista (el último se usa para subir la música)
    t += dur + cola_dur

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
json.dump(plan, open(os.path.join(RAIZ, "src/trabajos", ID, "plan_entrevistas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
