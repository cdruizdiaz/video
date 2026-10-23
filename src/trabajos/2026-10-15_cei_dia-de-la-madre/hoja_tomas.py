"""Hoja de contacto de las 15 tomas: 8 cuadros de cada una (0, 0,5, 1, 1,5, 2, 3, 5 y 8 s) para ver el gesto
de agarrar el teléfono y elegir la toma de apertura.  Uso: python hoja_tomas.py"""
import subprocess, glob, os
from PIL import Image, ImageDraw

FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
ID = "2026-10-15_cei_dia-de-la-madre"
RAIZ = "C:/Users/LUCIA/Documents/RASTRO/Edición IA/video/"
CRUDOS = RAIZ + f"public/trabajos/{ID}/crudos/"
SALIDA = RAIZ + f"out/{ID}/revision/hoja_tomas.png"
TS = [0, 0.5, 1, 1.5, 2, 3, 5, 8]
W, H = 135, 240

tmp = RAIZ + "tmp/hoja_tomas/"
os.makedirs(tmp, exist_ok=True)
videos = sorted(glob.glob(CRUDOS + "*.mp4"))
hoja = Image.new("RGB", (len(TS) * W + 150, len(videos) * H), "white")
d = ImageDraw.Draw(hoja)
for r, v in enumerate(videos):
    nombre = os.path.basename(v)[:-4]
    d.text((6, r * H + 6), nombre, fill="black")
    for c, t in enumerate(TS):
        out = f"{tmp}{nombre}_{c}.png"
        subprocess.run([FF, "-y", "-loglevel", "error", "-ss", str(t), "-i", v, "-frames:v", "1",
                        "-vf", f"scale={W}:{H}", out], check=True)
        try:
            hoja.paste(Image.open(out), (150 + c * W, r * H))
        except Exception:
            pass
hoja.save(SALIDA)
print(SALIDA, hoja.size)
