# Envolvente de energía (dB cada 50 ms, en segundos del VIDEO) de la voz de un alumno en un rango, para ver dónde
# hay pausas y poner los cortes justo en el silencio entre palabras (los tiempos por palabra de Whisper
# se corren ±0,3 s).  Uso: python envolvente.py <alumno> <desde_s> <hasta_s>
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ID = "2026-10-15_cei_dia-de-la-madre"
HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
base = Path("public/trabajos") / ID
n, d, h = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
off = json.loads((base / "datos" / "sincronia.json").read_text(encoding="utf-8"))[n]["desfaseMs"] / 1000
SR = 16000
raw = subprocess.run([HERR["ffmpeg"], "-v", "error", "-i", str(base / "audio" / "voz" / f"{n}.wav"), "-ac", "1",
                      "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
paso = int(0.1 * SR)
t = d
fila = []
while t < h:
    a = int((t + off) * SR)
    seg = x[max(0, a):max(0, a) + paso]
    db = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-6) if len(seg) else -99
    fila.append((t, db))
    t += 0.1
mx = max(v for _, v in fila)
print(f"{n} (video {d}–{h} s, nivel máx {mx:.0f} dB)")
for t, v in fila:
    print(f"{t:5.1f} {v:5.0f} " + "#" * int(max(0, (v + 55) / 2)))
