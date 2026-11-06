# Uso: python hoja_inserts.py <Cava|Cowork|Loft|Reuniones>
# Hoja de contactos de todos los inserts de Inserts cámara/<carpeta>: 4 cuadros por toma (15/40/65/90 %), girados 90° como
# se usan (transpose=2; las horizontales, como C0114, se ven de costado), con el nombre de la toma escrito con Pillow.
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
FF, FP = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe", "C:/Videos/_herramientas/ffmpeg/bin/ffprobe.exe"
BASE = Path("C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara")
O = Path("out/2026-10-28_docba_r3-nov/revision")
W, H = 90, 160
def dur(p): return float(subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)
def cuadro(args):
    p, t = args
    raw = subprocess.run([FF, "-v", "error", "-ss", f"{t:.2f}", "-i", str(p), "-frames:v", "1", "-vf", f"transpose=2,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3) if len(raw) == W * H * 3 else np.zeros((H, W, 3), np.uint8)
CARPETA = sys.argv[1]
D = BASE / CARPETA
tomas = sorted(D.glob("*.MP4"))
filas = []
with ThreadPoolExecutor(8) as ex:
    for p in tomas:
        d = dur(p); ts = [d * f for f in (.15, .4, .65, .9)]
        fr = list(ex.map(cuadro, [(p, t) for t in ts]))
        im = Image.fromarray(np.hstack(fr)); ImageDraw.Draw(im).text((3, 3), f"{p.stem} {d:.0f}s", fill=(255, 255, 0))
        filas.append(im)
POR, COLS = 40, 5
for n in range(0, len(filas), POR):
    lote = filas[n:n + POR]; rows = -(-len(lote) // COLS)
    hoja = Image.new("RGB", (COLS * (W * 4 + 6), rows * (H + 6)))
    for i, im in enumerate(lote): hoja.paste(im, ((i % COLS) * (W * 4 + 6), (i // COLS) * (H + 6)))
    hoja.save(O / f"inserts_{CARPETA.lower()}_{n // POR + 1}.png"); print("OK", n // POR + 1, len(lote))
