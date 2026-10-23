# Segmentos de voz de cada alumno (tramos con energía entre pausas), en segundos del VIDEO, medidos sobre la voz
# limpia. Los tiempos por palabra de Whisper se corren hasta ±0,5 s (sobre todo al final de las frases), así que los
# cortes y los subtítulos se apoyan en estas pausas reales.
# Salida: datos/segmentos.json -> { "<alumno>": [[desde, hasta], ...] } y, con --ver, la lista por consola.
# Uso (raíz del proyecto): python src/trabajos/2026-10-15_cei_dia-de-la-madre/voz_segmentos.py [--ver]
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ID = "2026-10-15_cei_dia-de-la-madre"
SR = 16000
HOP = 0.02  # s
VENTANA = 0.04
UMBRAL_DB = 24  # dB por debajo del nivel alto de la toma: lo de abajo es pausa
PAUSA_MIN = 0.12  # s: una pausa más corta no corta el segmento
SEGMENTO_MIN = 0.08  # s
HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
base = Path("public/trabajos") / ID
sync = json.loads((base / "datos" / "sincronia.json").read_text(encoding="utf-8"))


def envolvente(n):
    raw = subprocess.run([HERR["ffmpeg"], "-v", "error", "-i", str(base / "audio" / "voz" / f"{n}.wav"), "-ac", "1",
                          "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    paso, vent = int(HOP * SR), int(VENTANA * SR)
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + vent] ** 2)) + 1e-6) for i in range(0, len(x) - vent, paso)])
    return db


def segmentos(db):
    nivel = np.percentile(db, 90)
    voz = db > nivel - UMBRAL_DB
    segs, ini = [], None
    for i, v in enumerate(voz):
        if v and ini is None:
            ini = i
        if not v and ini is not None:
            segs.append([ini, i])
            ini = None
    if ini is not None:
        segs.append([ini, len(voz)])
    # une pausas cortas y descarta soplidos
    uni = []
    for s in segs:
        if uni and (s[0] - uni[-1][1]) * HOP < PAUSA_MIN:
            uni[-1][1] = s[1]
        else:
            uni.append(s)
    return [[a * HOP, b * HOP] for a, b in uni if (b - a) * HOP >= SEGMENTO_MIN]


if __name__ == "__main__":
    salida = {}
    for wav in sorted((base / "audio" / "voz").glob("*.wav")):
        n = wav.stem
        off = sync[n]["desfaseMs"] / 1000
        segs = segmentos(envolvente(n))
        salida[n] = [[round(a - off, 2), round(b - off, 2)] for a, b in segs]
        if "--ver" in sys.argv:
            print(n, " ".join(f"[{a:.2f}-{b:.2f}]" for a, b in salida[n]))
    (base / "datos" / "segmentos.json").write_text(json.dumps(salida), encoding="utf-8")
