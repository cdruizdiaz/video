# Perfil de energía de la voz alrededor de un instante (para ubicar a mano el final real de una palabra).
# Imprime dB respecto de la voz (p90) cada 20 ms entre t-RADIO y t+RADIO; '#' por cada 3 dB sobre -45.
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-19_volto_radio/perfil.py <clip> <t_s> [...]
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ID = "2026-10-19_volto_radio"
SR = 16000
PASO_S = 0.02
RADIO_S = 0.6
HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
clip = sys.argv[1]
x = np.frombuffer(subprocess.run(
    [HERR["ffmpeg"], "-v", "error", "-i", f"public/trabajos/{ID}/crudos/{clip}.mp4", "-map", "0:a:0", "-ac", "1",
     "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768


def db(t):
    a = int(t * SR)
    return 10 * np.log10(np.mean(x[a:a + int(PASO_S * SR)] ** 2) + 1e-12)


voz = np.percentile([db(t) for t in np.arange(0, len(x) / SR - 1, 0.5)], 90)
for t0 in map(float, sys.argv[2:]):
    print(f"--- {clip} @ {t0}")
    for t in np.arange(t0 - RADIO_S, t0 + RADIO_S, PASO_S):
        d = db(t) - voz
        print(f"{t:8.2f} {d:+4.0f} {'#' * max(0, int((d + 45) / 3))}")
