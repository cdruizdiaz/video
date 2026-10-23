# Nivel de cada palabra de la voz (RMS en dBFS, con los tiempos de la transcripción), para ver si hay palabras que
# "se apagan" (borrador E, pedido 2026-10-21: "la voz en algunas palabras se apaga, tiene que estar toda al mismo
# nivel"). Solo los tramos que usa el reel. Muestra por clip la mediana, el desvío y las palabras más bajas.
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-21_rastro_pau-mascota/medir_palabras.py [carpeta_voz]
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ID = "2026-10-21_rastro_pau-mascota"
VOZ = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/trabajos") / ID / "audio" / "voz"
FF = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))["ffmpeg"]
TRANS = json.loads((Path("public/trabajos") / ID / "datos" / "transcripcion.json").read_text(encoding="utf-8"))
# tramos del reel (ms), como en composiciones.ts
TRAMOS = {"IMG_9053": [(600, 2420), (3360, 4850)], "IMG_9054": [(1300, 6250)], "IMG_9055": [(2100, 7650)],
          "IMG_9059": [(6350, 14000)], "IMG_9060": [(650, 11250), (17050, 27750)], "IMG_9061": [(8750, 12150)],
          "IMG_9064": [(800, 3100)]}
SR = 16000

sys.stdout.reconfigure(encoding="utf-8")
todas = []
for clip, tramos in TRAMOS.items():
    crudo = subprocess.run([FF, "-v", "error", "-i", str(VOZ / f"{clip}.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                           capture_output=True, check=True).stdout
    x = np.frombuffer(crudo, np.float32)
    palabras = TRANS.get(clip) or TRANS.get(clip + "b")
    niveles = []
    for p in palabras:
        if not any(a <= p["startMs"] < b for a, b in tramos):
            continue
        seg = x[int(p["startMs"] * SR / 1000):int(p["endMs"] * SR / 1000)]
        if len(seg) < SR // 50:
            continue
        # el 30 % más fuerte de la palabra en ventanas de 20 ms (el cuerpo de la palabra, no su silencio)
        v = seg[: len(seg) // 320 * 320].reshape(-1, 320)
        rms = np.sqrt((v ** 2).mean(axis=1) + 1e-12)
        db = 20 * np.log10(np.mean(np.sort(rms)[-max(1, len(rms) * 3 // 10):]))
        niveles.append((db, p["text"], p["startMs"]))
    d = np.array([n[0] for n in niveles])
    todas += list(d)
    bajas = sorted(niveles)[:3]
    print(f"{clip}: mediana {np.median(d):.1f} dB, desvío {d.std():.1f}, rango {d.min():.1f}…{d.max():.1f} · más bajas: "
          + ", ".join(f"{t} ({n:.1f} @ {ms / 1000:.2f}s)" for n, t, ms in bajas))
t = np.array(todas)
print(f"TOTAL: mediana {np.median(t):.1f} dB, desvío {t.std():.1f}, palabras a más de 8 dB debajo de la mediana: "
      f"{int((t < np.median(t) - 8).sum())} de {len(t)}")
