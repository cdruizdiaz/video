# Radio (2026-10-19): sincroniza la 2ª cámara (iPhone 16 Pro, IMG_7327–7330) con la toma larga IMG_7180-002
# (iPhone 17 Pro Max). Adaptado de 2026-10-06_volto_fashion-week/sincronizar.py.
# GCC-PHAT sobre el audio a 8 kHz en 3 ventanas de 20 s, buscando ±1 s alrededor del desfase que da
# la hora de grabación (creationdate de los .mov). La correlación de envolventes falló por el eco de A
# (4216 daba 43 s; la hora y las palabras dicen ~109,6 s; GCC-PHAT: 109,378 s, z≈22-30).
# Salida: datos/sincronia.json -> { "IMG_4216": { "conAudioDe": "IMG_6972", "desfaseMs": 109378, ... } }
#   desfaseMs = segundo de B en el que empieza A (tiempoB = tiempoA + desfase).
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-06_volto_fashion-week/sincronizar.py
import json
import subprocess
from pathlib import Path

import numpy as np

ID = "2026-10-19_volto_radio"
SR = 8000
VENTANA_S = 20
# (A, B, desfase esperado en s según la hora de grabación)

# (2ª cám., toma larga, desfase esperado en s: hora de grabación; 7327 por el texto)
PARES = [("IMG_7328", "IMG_7180-002", 343), ("IMG_7329", "IMG_7180-002", 354),
         ("IMG_7330", "IMG_7180-002", 1629), ("IMG_7327", "IMG_7180-002", 209)]

HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
crudos = Path("public/trabajos") / ID / "crudos"


def audio(clip):
    crudo = subprocess.run([HERR["ffmpeg"], "-v", "error", "-i", str(crudos / f"{clip}.mp4"), "-map", "0:a:0",
                            "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(crudo, np.int16).astype(np.float32) / 32768


def gcc_phat(xb, xa, esperado, desde_a):
    sa = xa[desde_a * SR:(desde_a + VENTANA_S) * SR]
    c0 = max(0, int((desde_a + esperado - 1) * SR))
    sb = xb[c0:c0 + (VENTANA_S + 2) * SR]
    n = 1 << int(np.ceil(np.log2(len(sb) + len(sa))))
    x = np.fft.rfft(sb, n) * np.conj(np.fft.rfft(sa, n))
    r = np.fft.irfft(x / (np.abs(x) + 1e-9), n)[:2 * SR]
    k = int(np.argmax(r))
    return (c0 + k) / SR - desde_a, float((r[k] - r.mean()) / r.std())


salida = {}
for a, b, esperado in PARES:
    xa, xb = audio(a), audio(b)
    largo = len(xa) / SR
    medidas = [gcc_phat(xb, xa, esperado, s) for s in (2, 15, 30) if s + VENTANA_S <= largo] or \
              [gcc_phat(xb, xa, esperado, 0)]
    mejor = max(medidas, key=lambda m: m[1])
    acuerdan = sum(abs(o - mejor[0]) < 0.01 for o, _ in medidas)
    salida[a] = {"conAudioDe": b, "desfaseMs": round(mejor[0] * 1000, 1), "z": round(mejor[1], 1),
                 "ventanasDeAcuerdo": f"{acuerdan}/{len(medidas)}"}
    print(f"{a} -> {b}: {mejor[0]:.4f} s  z={mejor[1]:.1f}  ({acuerdan}/{len(medidas)} ventanas)")

destino = Path("public/trabajos") / ID / "datos" / "sincronia.json"
destino.write_text(json.dumps(salida, indent=2, ensure_ascii=False), encoding="utf-8")
print("->", destino)
