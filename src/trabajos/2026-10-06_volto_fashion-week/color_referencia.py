# Color de la cám. A (iPhone 16, HDR HLG) = el original tal como lo ve el cliente.
# El tonemap a SDR de preparar_crudos.sh (mobius) no da el mismo look: se busca en el clip el cuadro de
# una captura de referencia del cliente y se ajusta, píxel a píxel, una regresión polinómica de grado 2
# en RGB (proxy sin corregir -> captura). Se guarda como LUT 3D (33³) que preparar_crudos.sh aplica a
# todos los clips de A después del tonemap.
# (Primero se probó igualar A al color de la cám. B: el cliente lo rechazó, "cambiaste el color".)
# Uso (raíz del proyecto, Python del .venv):
#   python src/trabajos/2026-10-06_volto_fashion-week/color_referencia.py <captura.png> <proxy A SIN LUT.mp4>
# Salida: public/trabajos/<ID>/datos/color_camA.cube + out/<ID>/revision/color_camA.jpg
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ID = "2026-10-06_volto_fashion-week"
TAM_LUT = 33
BUSQUEDA_FPS = 30
DESENFOQUE = 2  # px: tolera compresión y medio píxel de desalineado
H = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))

captura, proxy = sys.argv[1], sys.argv[2]
ref = Image.open(captura).convert("RGB")
W, Hh = ref.size


def cuadros(fps, escala):
    r = subprocess.run([H["ffmpeg"], "-v", "error", "-i", proxy, "-vf", f"fps={fps},scale={escala[0]}:{escala[1]}",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(r, np.uint8).reshape(-1, escala[1], escala[0], 3)


# 1) el cuadro del clip que es la captura (correlación de grises, chico)
chico = (54, 96)
g = lambda a: (lambda x: (x - x.mean()) / (x.std() + 1e-6))(a.astype(np.float32).mean(axis=-1))
rg = g(np.asarray(ref.resize(chico)))
fr = cuadros(BUSQUEDA_FPS, chico)
puntajes = [float((g(f) * rg).mean()) for f in fr]
i = int(np.argmax(puntajes))
t = i / BUSQUEDA_FPS
print(f"cuadro de la captura: {t:.3f} s (correlación {puntajes[i]:.3f})")

# 2) ese cuadro a la resolución de la captura, ambos un poco desenfocados
src = subprocess.run([H["ffmpeg"], "-v", "error", "-ss", f"{t:.3f}", "-i", proxy, "-frames:v", "1",
                      "-vf", f"scale={W}:{Hh}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
fuente = Image.fromarray(np.frombuffer(src, np.uint8).reshape(Hh, W, 3))
X = np.asarray(fuente.filter(ImageFilter.GaussianBlur(DESENFOQUE)), np.float32).reshape(-1, 3) / 255
Y = np.asarray(ref.filter(ImageFilter.GaussianBlur(DESENFOQUE)), np.float32).reshape(-1, 3) / 255


def terminos(x):  # grado 2 con cruces: 1, r, g, b, r², g², b², rg, rb, gb
    r, gg, b = x[:, 0], x[:, 1], x[:, 2]
    return np.stack([np.ones_like(r), r, gg, b, r * r, gg * gg, b * b, r * gg, r * b, gg * b], axis=1)


M, *_ = np.linalg.lstsq(terminos(X), Y, rcond=None)
err_antes = np.abs(X - Y).mean() * 255
err_despues = np.abs(np.clip(terminos(X) @ M, 0, 1) - Y).mean() * 255
print(f"error medio por canal: {err_antes:.1f} -> {err_despues:.1f} (de 255)")

# 3) LUT .cube (R varía más rápido)
gr = np.linspace(0, 1, TAM_LUT, dtype=np.float32)
b, gg, r = np.meshgrid(gr, gr, gr, indexing="ij")
rgb = np.stack([r.ravel(), gg.ravel(), b.ravel()], axis=1)
out = np.clip(terminos(rgb) @ M, 0, 1)
destino = Path("public/trabajos") / ID / "datos" / "color_camA.cube"
with open(destino, "w", encoding="ascii") as f:
    f.write(f'TITLE "color_camA"\nLUT_3D_SIZE {TAM_LUT}\n')
    for v in out:
        f.write(f"{v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")

# 4) control: proxy sin corregir | corregido | captura
corr = Image.fromarray((np.clip(terminos(np.asarray(fuente, np.float32).reshape(-1, 3) / 255) @ M, 0, 1)
                        .reshape(Hh, W, 3) * 255).astype(np.uint8))
hoja = Image.new("RGB", (W * 3, Hh))
for k, im in enumerate((fuente, corr, ref)):
    hoja.paste(im, (k * W, 0))
control = Path("out") / ID / "revision" / "color_camA.jpg"
hoja.save(control, quality=90)
print("->", destino, "|", control)
