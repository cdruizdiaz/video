# Sincroniza las tomas de cámara (iPhone) con la grabación de pantalla de Affinity que corre a la vez (copiado de
# 2026-10-06_volto_fashion-week). GCC-PHAT sobre el audio a 8 kHz (el de la grabación de pantalla tiene el micrófono
# de la compu: se oye a Pau) en 3 ventanas de 20 s, buscando ±5 s alrededor del desfase que da la hora de grabación
# (creationdate de los .MOV y la hora del nombre de cada grabación).
# Salida: datos/sincronia.json -> { "IMG_8272": { "pantalla": "affinity_170536", "desfaseMs": 69000, ... } }
#   desfaseMs = segundo de la grabación de pantalla en el que empieza la toma (tPantalla = tToma + desfase).
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-23_rastro_affinity-dia-01/sincronizar.py
import json
import subprocess
from pathlib import Path

import numpy as np

ID = "2026-10-23_rastro_affinity-dia-01"
SR = 8000
VENTANA_S = 20
BUSCA_S = 5
# (toma, grabación de pantalla, desfase esperado en s según la hora): 8272 17:06:45 y 8273 17:10:59; la grabación
# empieza a las 17:05:36
PARES = [("IMG_8272", "pantalla/affinity_170536", 69), ("IMG_8273", "pantalla/affinity_170536", 323)]

HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
crudos = Path("public/trabajos") / ID / "crudos"


def audio(clip):
    crudo = subprocess.run([HERR["ffmpeg"], "-v", "error", "-i", str(crudos / f"{clip}.mp4"), "-map", "0:a:0",
                            "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(crudo, np.int16).astype(np.float32) / 32768


def gcc_phat(xb, xa, esperado, desde_a):
    sa = xa[desde_a * SR:(desde_a + VENTANA_S) * SR]
    c0 = max(0, int((desde_a + esperado - BUSCA_S) * SR))
    sb = xb[c0:c0 + (VENTANA_S + 2 * BUSCA_S) * SR]
    n = 1 << int(np.ceil(np.log2(len(sb) + len(sa))))
    x = np.fft.rfft(sb, n) * np.conj(np.fft.rfft(sa, n))
    r = np.fft.irfft(x / (np.abs(x) + 1e-9), n)[:2 * BUSCA_S * SR]
    k = int(np.argmax(r))
    return (c0 + k) / SR - desde_a, float((r[k] - r.mean()) / r.std())


salida = {}
for a, b, esperado in PARES:
    xa, xb = audio(a), audio(b)
    largo = len(xa) / SR
    medidas = [gcc_phat(xb, xa, esperado, s) for s in (2, 60, 150) if s + VENTANA_S <= largo] or \
              [gcc_phat(xb, xa, esperado, 0)]
    print("   ", [(round(o, 3), round(z, 1)) for o, z in medidas])
    mejor = max(medidas, key=lambda m: m[1])
    acuerdan = sum(abs(o - mejor[0]) < 0.01 for o, _ in medidas)
    salida[a] = {"pantalla": b.split("/")[-1], "desfaseMs": round(mejor[0] * 1000, 1), "z": round(mejor[1], 1),
                 "ventanasDeAcuerdo": f"{acuerdan}/{len(medidas)}"}
    print(f"{a} -> {b}: {mejor[0]:.4f} s  z={mejor[1]:.1f}  ({acuerdan}/{len(medidas)} ventanas)")

destino = Path("public/trabajos") / ID / "datos" / "sincronia.json"
destino.write_text(json.dumps(salida, indent=2, ensure_ascii=False), encoding="utf-8")
print("->", destino)
