# Ajusta cada corte al valle de energía de la voz más cercano (para no cortar dentro de una palabra).
# Energía RMS cada 10 ms (ventana de 30 ms) sobre el audio del proxy; busca el mínimo a ±RADIO_S.
# Uso (raíz del proyecto, Python del .venv):
#   python src/trabajos/2026-10-19_volto_radio/valles.py <clip> <t1> <t2> ...   (tiempos en s)
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ID = "2026-10-19_volto_radio"
SR = 16000
PASO = 160  # 10 ms
VENTANA = 480  # 30 ms
RADIO_S = 0.35

HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
clip, tiempos = sys.argv[1], [float(t) for t in sys.argv[2:]]
crudo = subprocess.run(
    [HERR["ffmpeg"], "-v", "error", "-i", f"public/trabajos/{ID}/crudos/{clip}.mp4", "-map", "0:a:0",
     "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(crudo, np.int16).astype(np.float32) / 32768
n = (len(x) - VENTANA) // PASO
rms = np.sqrt(np.array([np.mean(x[i * PASO:i * PASO + VENTANA] ** 2) for i in range(n)]) + 1e-12)
db = 20 * np.log10(rms)
voz = np.percentile(db, 90)

for t in tiempos:
    c = int(t * 100)
    a, b = max(0, c - int(RADIO_S * 100)), min(n, c + int(RADIO_S * 100))
    k = a + int(np.argmin(db[a:b]))
    print(f"{t:.2f} -> {k / 100:.2f}  ({db[k] - voz:+.0f} dB vs voz)")
