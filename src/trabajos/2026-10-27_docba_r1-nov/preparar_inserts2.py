# Correcciones de los borradores E y F (2026-10-28): (1) matcha = C0049 (cae el matcha, ~0:42-0:43), estabilizado, con color y a media velocidad con RIFE;
# (2) copa de vino en dos planos, los dos con look de noche: vino_a = C0114 (ventana firme de jitter3.py) + vino_b = C0129 (el de antes).
# Salidas en public/trabajos/<ID>/crudos/: ins_matcha2.mp4, ins_vino_a.mp4, ins_vino_b.mp4 (1080x1920, 30 fps, sin audio).
import math, os, subprocess, sys
import numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
ID = "2026-10-27_docba_r1-nov"
B = f"public/trabajos/{ID}/crudos"
R = "C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara/Comida"
TMP = "tmp/stab"
# comida: más contraste (curva en S suave) y color vivo pero natural (vibrance protege los tonos de piel y los ya saturados)
COLOR = "eq=contrast=1.07:saturation=1.07:gamma={g:.3f},curves=all='0/0 0.2/0.17 0.5/0.5 0.8/0.84 1/1',vibrance=intensity=0.35,colorbalance=rs=0.02:gs=0.005:bs=-0.02:rm=0.012:bm=-0.012,unsharp=5:5:0.45:5:5:0"
# platos (croissant, guacamole, tostón): natural. G quedó amarillo y saturado: la salsa y la madera ya vienen muy amarillas de cámara, así que se
# baja el componente amarillo (selectivecolor), un poco de azul en sombras/medios y saturación 0,95; contraste suave con curva en S
NATURAL = "eq=contrast=1.04:saturation=1.03:gamma={g:.3f},curves=all='0/0 0.25/0.23 0.5/0.5 0.75/0.77 1/1',unsharp=5:5:0.4:5:5:0,selectivecolor=yellows=0 0 -0.12 0:correction_method=relative,colorbalance=rm=0.01:bm=-0.005"
VERDES = ",selectivecolor=greens=0.18 -0.05 0.18 -0.05:correction_method=relative"  # el matcha y el guacamole resaltan
INCLINACION = -4.0  # grados (antihorario): el matcha venía con el vaso y el nivel de la leche torcidos
# de noche: luz media baja, sombras frías (azul petróleo), altas luces tibias, viñeta suave
NOCHE_LUZ = 0.34
NOCHE_LUZ_B = NOCHE_LUZ  # copas con la tabla: menos oscuro
INCLINACION_VINO = 3.7  # grados horarios
NOCHE = "eq=contrast=1.10:saturation=1.02:gamma={g:.3f},colorbalance=rs=-0.05:gs=-0.01:bs=0.07:rm=-0.02:bm=0.04:rh=0.03:bh=-0.02,vignette=angle=PI/4.2,unsharp=5:5:0.4:5:5:0"
TAGS = ["-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709"]
run = lambda a: subprocess.run([FF, "-y", "-v", "error", *a], check=True)

def luz(path):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-vf", "fps=4,scale=48:84,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return float(np.frombuffer(raw, np.uint8).mean()) / 255

def estabilizar(src, ss, t, slot, fps=None, giro="transpose=2", suave=30):
    pre, trf, est = f"{TMP}/{slot}_pre.mp4", f"{TMP}/{slot}.trf", f"{TMP}/{slot}_est.mp4"
    run(["-ss", str(ss), "-t", str(t), "-i", src, "-an", "-vf", giro + ",scale=1080:1920,fps=" + (fps or "30") + ",format=yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", pre])
    run(["-i", pre, "-vf", f"vidstabdetect=shakiness=6:accuracy=15:result={trf}", "-f", "null", "-"])
    zoomopt = "optzoom=1" if suave >= 30 else "zoom=4:optzoom=0"
    run(["-i", pre, "-vf", f"vidstabtransform=input={trf}:smoothing={suave}:{zoomopt}:maxangle=0:interpol=bicubic,format=yuv420p", "-an", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", est])
    return est

def graduar(est, out, plantilla, objetivo, extra=""):
    m = luz(est); g = math.log(m) / math.log(objetivo)
    run(["-i", est, "-vf", plantilla.format(g=g) + extra + ",fps=30,format=yuv420p", "-an", "-c:v", "libx264", "-crf", "17", "-preset", "veryfast", "-g", "30", *TAGS, out])
    print(os.path.basename(out), f"luz {m:.2f} -> {luz(out):.2f}")


what = sys.argv[1:] or ["matcha", "vino_a", "vino_b", "croissant", "guacamole", "toston"]
os.makedirs(TMP, exist_ok=True)
if "matcha" in what:
    # 1,15 s de la toma (42,30-43,45) a media velocidad = 2,3 s: 0,3 s de colchón + 1,74 s de "Encontrás productos como matcha latte" + resto
    est = estabilizar(f"{R}/C0049.MP4", 42.70, 1.17, "matcha2", fps="24000/1001")
    lento = f"{TMP}/matcha2_lento.mp4"
    subprocess.run(["node", "scripts/camara_lenta.mjs", est, lento, "--factor", "2"], check=True)
    # enderezar: se agranda 12 % y se gira para no dejar bordes negros
    recto = f"{TMP}/matcha2_recto.mp4"
    run(["-i", lento, "-vf", f"scale=1210:2150,rotate={INCLINACION}*PI/180:ow=1080:oh=1920:c=black,format=yuv420p", "-an", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", recto])
    graduar(recto, f"{B}/ins_matcha2.mp4", COLOR, min(max(luz(recto) * 1.22, 0.44), 0.58), VERDES)
if "vino_a" in what:  # brindis de C0114 (copas en mano): smoothing bajo = menos "gelatina" que el vidstab por defecto
    graduar(estabilizar(f"{R}/C0114.MP4", 17.25, 1.9, "vino_a", giro="crop=1215:2160:1270:0", suave=12), f"{B}/ins_vino_a.mp4", NOCHE, NOCHE_LUZ)
if "vino_b" in what:  # cuatro copas con la tabla (C0131): el borde de la mesa subía 3,7° hacia la derecha -> se endereza (giro horario) y se agranda 11,5 %
    # sin vidstab (el original ya es la ventana más firme, 0,17): el estabilizador era lo que le daba "gelatina"
    recto = f"{TMP}/vino_b_recto.mp4"
    run(["-ss", "2.12", "-t", "1.9", "-i", f"{R}/C0131.MP4", "-an", "-vf", f"transpose=2,scale=1242:2208,fps=30,rotate={INCLINACION_VINO}*PI/180:ow=1242:oh=2208:c=black,crop=1080:1920:81:50,format=yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", recto])
    graduar(recto, f"{B}/ins_vino_b.mp4", NOCHE, NOCHE_LUZ_B)
if "mezcla" in what:  # C0048: la mano revuelve el matcha (antes de que caiga el líquido de C0049)
    est = estabilizar(f"{R}/C0049.MP4", 16.0, 1.5, "mezcla", suave=12)  # C0049 desde el 0:16 (la mano revuelve)
    graduar(est, f"{B}/ins_matcha_mezcla.mp4", COLOR, min(max(luz(est) * 1.5, 0.48), 0.6), VERDES)
for slot in ("croissant", "guacamole", "toston"):
    if slot in what:  # mismos inserts estabilizados del borrador E con el color nuevo
        est = f"{TMP}/{slot}_est.mp4"
        graduar(est, f"{B}/ins_{slot}.mp4", NATURAL, min(max(luz(est) * 1.2, 0.46), 0.58))
