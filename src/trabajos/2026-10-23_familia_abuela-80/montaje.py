# Montaje del video largo con ffmpeg desde los originales (sin Remotion: son solo cortes).
# Uso (Python del .venv, raíz del proyecto):
#   python src/trabajos/2026-10-23_familia_abuela-80/montaje.py cortes          → datos/clips.json (cortes al borde de las frases)
#   python src/trabajos/2026-10-23_familia_abuela-80/montaje.py armar <salida>  → video entero (retomable: las partes hechas no se rehacen)
# Audio = muestra B_suave elegida: DeepFilterNet --atten-lim 10 + highpass 70 Hz + compresión 2:1; al final loudnorm -14 LUFS
# en dos pasadas sobre todo el video. No lleva el adelanto de 42,7 ms de terminar_audio.sh (ese relleno es de los AAC de Remotion).
import json, subprocess, sys, os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ID = "2026-10-23_familia_abuela-80"
HERR = json.load(open("scripts/herramientas.json", encoding="utf8"))
FF, FFPROBE = HERR["ffmpeg"], HERR["ffprobe"]
DEEPFILTER = "C:/Videos/_herramientas/.venv/Scripts/deepFilter.exe"
CRUDOS = Path(f"C:/Videos/crudos/{ID}")
DATOS = Path(f"public/trabajos/{ID}/datos")
PARTES = Path(f"out/{ID}/revision/v1_partes")

FPS = 30
ANTES_FRASE_MS = 150      # aire antes de la primera frase si el corte caía en el medio
ANTES_SILENCIO_MS = 300   # aire antes de la primera frase si el tramo arrancaba en silencio
DESPUES_FRASE_MS = 300    # aire después de la última frase
FUNDIDO_BLOQUE_S = 0.4    # fundido a negro entre bloques
FUNDIDO_PUNTAS_S = 1.0    # entrada y salida del video
FUNDIDO_CORTE_S = 0.02    # micro-fundido de audio en cada corte (sin clics)
AUDIO_B = "highpass=f=70,acompressor=threshold=-22dB:ratio=2:attack=15:release=250:makeup=2"
# Tramos de noche (dentro del auto): aclarar.
NOCHE = {"00387", "00388", "00416", "00421"}
ACLARAR = "curves=all='0/0 0.06/0.10 0.25/0.42 1/1',eq=saturation=1.15,hqdn3d=3:3:6:6"  # levanta medios sin lavar el negro
# Tramos con música: Whisper inventa frases ahí, no se ajustan.
SIN_AJUSTE = {("00439", 124000), ("00439", 269000), ("00441", 8000), ("00441", 462000), ("00443", 0), ("00449", 8000)}


def ajustar(t, segs, dur_ms):
    a, b = t["desdeMs"], t["hastaMs"]
    if (t["clip"], a) in SIN_AJUSTE:
        return a, b
    dentro = [s for s in segs if s["hastaMs"] > a and s["desdeMs"] < b]
    if dentro:
        p, u = dentro[0], dentro[-1]
        a = p["desdeMs"] - ANTES_FRASE_MS if p["desdeMs"] < a else max(a, p["desdeMs"] - ANTES_SILENCIO_MS)
        b = u["hastaMs"] + DESPUES_FRASE_MS if u["hastaMs"] > b else min(b, u["hastaMs"] + DESPUES_FRASE_MS)
    return max(0, a), min(b, dur_ms - 100)


def cortes():
    tomas = json.load(open(DATOS / "candidatos.json", encoding="utf8"))["tomas"]
    clips, total0, total = [], 0, 0
    for t in tomas:
        tr = json.load(open(DATOS / "transcripciones" / f"{t['clip']}.json", encoding="utf8"))
        a, b = ajustar(t, tr["segmentos"], tr["duracionMs"])
        cuadros = round((b - a) * FPS / 1000)
        clips.append({**t, "desdeMs": a, "hastaMs": a + round(cuadros * 1000 / FPS), "cuadros": cuadros,
                      "aclarar": t["clip"] in NOCHE})
        total0 += t["hastaMs"] - t["desdeMs"]
        total += cuadros / FPS
    json.dump({"fps": FPS, "clips": clips}, open(DATOS / "clips.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(f"{len(clips)} tramos: {total0 / 60000:.1f} min -> {total / 60:.1f} min")


def correr(args):
    subprocess.run([str(x) for x in args], check=True)


def armar(salida):
    clips = json.load(open(DATOS / "clips.json", encoding="utf8"))["clips"]
    PARTES.mkdir(parents=True, exist_ok=True)
    n = len(clips)

    def fundidos(i):
        c = clips[i]
        ent = FUNDIDO_PUNTAS_S if i == 0 else FUNDIDO_BLOQUE_S if clips[i - 1]["bloque"] != c["bloque"] else 0
        sal = FUNDIDO_PUNTAS_S if i == n - 1 else FUNDIDO_BLOQUE_S if clips[i + 1]["bloque"] != c["bloque"] else 0
        return ent, sal

    # 1) audio crudo de cada tramo → DeepFilterNet en una sola pasada (carga el modelo una vez)
    crudo, limpio = PARTES / "audio_crudo", PARTES / "audio_df"
    crudo.mkdir(exist_ok=True); limpio.mkdir(exist_ok=True)
    pendientes = []
    for i, c in enumerate(clips):
        w = crudo / f"{i:03d}.wav"
        if not (limpio / f"{i:03d}_DeepFilterNet3.wav").exists():
            if not w.exists():
                correr([FF, "-v", "error", "-y", "-ss", c["desdeMs"] / 1000, "-i", CRUDOS / f"{c['clip']}.mp4",
                        "-t", c["cuadros"] / FPS, "-vn", "-ac", 2, "-ar", 48000, w])
            pendientes.append(w)
    if pendientes:
        print(f"DeepFilterNet: {len(pendientes)} tramos")
        correr([DEEPFILTER, "--atten-lim", 10, "-o", limpio, *pendientes])

    # 2) cada tramo: video (sin audio) + audio terminado, con la duración exacta en cuadros
    def parte(i):
        c = clips[i]
        v, a = PARTES / f"{i:03d}.mp4", PARTES / f"{i:03d}.wav"
        dur = c["cuadros"] / FPS
        ent, sal = fundidos(i)
        if not v.exists():
            fv = ["fps=30", "scale=1920:1080", "setsar=1"] + ([ACLARAR] if c["aclarar"] else [])
            if ent: fv.append(f"fade=in:st=0:d={ent}")
            if sal: fv.append(f"fade=out:st={dur - sal:.3f}:d={sal}")
            tmp = v.with_suffix(".tmp.mp4")
            correr([FF, "-v", "error", "-y", "-ss", c["desdeMs"] / 1000, "-i", CRUDOS / f"{c['clip']}.mp4", "-an",
                    "-vf", ",".join(fv), "-frames:v", c["cuadros"], "-r", FPS, "-c:v", "libx264", "-crf", 18,
                    "-preset", "slow", "-pix_fmt", "yuv420p", "-threads", 6, tmp])
            os.replace(tmp, v)
        if not a.exists():
            fa = [AUDIO_B, f"afade=in:st=0:d={max(ent, FUNDIDO_CORTE_S)}",
                  f"apad,atrim=0:{dur:.6f}", f"afade=out:st={dur - max(sal, FUNDIDO_CORTE_S):.6f}:d={max(sal, FUNDIDO_CORTE_S)}"]
            correr([FF, "-v", "error", "-y", "-i", PARTES / "audio_df" / f"{i:03d}_DeepFilterNet3.wav",
                    "-af", ",".join(fa), "-ac", 2, "-ar", 48000, "-c:a", "pcm_s16le", a])
        return i

    with ThreadPoolExecutor(3) as ex:
        for i in ex.map(parte, range(n)):
            print(f"parte {i + 1}/{n}", flush=True)

    # 3) unir sin recodificar el video; audio entero con loudnorm en dos pasadas
    for ext in ("mp4", "wav"):
        (PARTES / f"lista_{ext}.txt").write_text("".join(f"file '{i:03d}.{ext}'\n" for i in range(n)), encoding="utf8")
    correr([FF, "-v", "error", "-y", "-f", "concat", "-safe", 0, "-i", PARTES / "lista_mp4.txt", "-c", "copy", PARTES / "video.mp4"])
    correr([FF, "-v", "error", "-y", "-f", "concat", "-safe", 0, "-i", PARTES / "lista_wav.txt", "-c", "copy", PARTES / "audio.wav"])
    med = subprocess.run([FF, "-i", PARTES / "audio.wav", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True, encoding="utf8", errors="replace").stderr
    m = json.loads(med[med.rindex("{"):med.rindex("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    correr([FF, "-v", "error", "-y", "-i", PARTES / "video.mp4", "-i", PARTES / "audio.wav", "-map", "0:v", "-map", "1:a",
            "-c:v", "copy", "-af", ln, "-ar", 48000, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", salida])
    print("listo:", salida)


if __name__ == "__main__":
    {"cortes": lambda: cortes(), "armar": lambda: armar(sys.argv[2])}[sys.argv[1]]()
