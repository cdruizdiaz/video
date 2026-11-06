# Inserts del reel: ventana de cada toma (la más firme según jitter2.py) -> voltear 90° -> estabilizar (vidstab, 2 pasadas,
# zoom fijo y sin rotación para que no se vea gelatinoso) -> luz y color (más luz según lo oscura que sea cada toma, apetito
# sin exagerar) -> proxy 1080x1920 a 30 fps sin audio en crudos/ins_<slot>.mp4.
import json, math, subprocess, sys, os
import numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
ID = "2026-10-27_docba_r1-nov"
B = f"public/trabajos/{ID}/crudos"
R = "C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara/Comida"
TMP = "tmp/stab"
os.makedirs(TMP, exist_ok=True)
ELEGIDOS = json.load(open(f"public/trabajos/{ID}/datos/inserts_elegidos.json"))  # jitter2.py
SUBE = 1.22  # cuánto se levanta la luz media de cada toma
PISO, TECHO = 0.44, 0.58  # luz media final (0-1) mínima y máxima
COLOR = "eq=contrast=1.05:saturation=1.14:gamma={g:.3f},colorbalance=rs=0.02:gs=0.005:bs=-0.025:rm=0.015:bm=-0.015,unsharp=5:5:0.4:5:5:0"

def luz_media(path):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-vf", "fps=4,scale=48:84,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return float(np.frombuffer(raw, np.uint8).mean()) / 255

sel = sys.argv[1:] or list(ELEGIDOS)
for slot in sel:
    e = ELEGIDOS[slot]
    src = f"{R}/C{e['toma']}.MP4"
    pre = f"{TMP}/{slot}_pre.mp4"
    subprocess.run([FF, "-y", "-v", "error", "-ss", str(e["desde"]), "-t", str(e["largo"]), "-i", src, "-an",
                    "-vf", "transpose=2,scale=1080:1920,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", pre], check=True)
    trf = f"{TMP}/{slot}.trf"
    subprocess.run([FF, "-y", "-v", "error", "-i", pre, "-vf", f"vidstabdetect=shakiness=6:accuracy=15:result={trf}", "-f", "null", "-"], check=True)
    est = f"{TMP}/{slot}_est.mp4"
    subprocess.run([FF, "-y", "-v", "error", "-i", pre, "-vf", f"vidstabtransform=input={trf}:smoothing=30:optzoom=1:maxangle=0:interpol=bicubic,format=yuv420p",
                    "-an", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", est], check=True)
    m = luz_media(est)
    objetivo = min(max(m * SUBE, PISO), TECHO)
    g = math.log(m) / math.log(objetivo)
    out = f"{B}/ins_{slot}.mp4"
    subprocess.run([FF, "-y", "-v", "error", "-i", est, "-vf", COLOR.format(g=g) + ",format=yuv420p", "-an", "-c:v", "libx264", "-crf", "17", "-preset", "veryfast", "-g", "30",
                    "-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709", out], check=True)
    print(slot, f"luz {m:.2f} -> {objetivo:.2f} (gamma {g:.2f})", "->", luz_media(out) and f"{luz_media(out):.2f}")
