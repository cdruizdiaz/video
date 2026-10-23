# Sincroniza el audio externo (.m4a grabado aparte) de cada alumno con el audio de su video.
# GCC-PHAT sobre el clip entero (≤ 22 s) a 16 kHz, buscando ±12 s (Pilar arranca 6,8 s después del video). También sirve para confirmar el pareo de
# nombres (p. ej. el video "Rodrigo Antonia" con el audio "Rodrigo Rosario"): un z alto = es el mismo registro.
# Salida: datos/sincronia.json -> { "<alumno>": { "desfaseMs": ..., "z": ... } }
#   desfaseMs = segundo del audio externo en el que está el cuadro 0 del video (tExterno = tVideo + desfase;
#   negativo = el externo empezó después del video).
# Uso (raíz del proyecto): python src/trabajos/2026-10-15_cei_dia-de-la-madre/sincronizar.py
import json
import subprocess
from pathlib import Path

import numpy as np

ID = "2026-10-15_cei_dia-de-la-madre"
SR = 16000
BUSCA_S = 12
HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
base = Path("public/trabajos") / ID


def leer(ruta):
    crudo = subprocess.run([HERR["ffmpeg"], "-v", "error", "-i", str(ruta), "-map", "0:a:0", "-ac", "1",
                            "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(crudo, np.int16).astype(np.float32) / 32768


def gcc_phat(ext, cam):
    n = 1 << int(np.ceil(np.log2(len(ext) + len(cam))))
    x = np.fft.rfft(ext, n) * np.conj(np.fft.rfft(cam, n))
    r = np.fft.irfft(x / (np.abs(x) + 1e-9), n)
    # lags: positivo = el externo va "después" de la cámara; negativo envuelve al final del vector
    lags = np.concatenate([np.arange(0, BUSCA_S * SR), np.arange(-BUSCA_S * SR, 0)])
    idx = np.concatenate([np.arange(0, BUSCA_S * SR), np.arange(n - BUSCA_S * SR, n)])
    vals = r[idx]
    z = (vals - vals.mean()) / vals.std()
    # solo desfases físicamente posibles: el externo y el video tienen que solaparse en al menos el 70 % del más corto
    # (sin esto, un pico espurio con apenas 1 s de solape le ganaba al verdadero)
    ini = -lags  # momento del video (en muestras) donde empieza el externo
    solape = np.minimum(len(cam), ini + len(ext)) - np.maximum(0, ini)
    z = np.where(solape >= 0.7 * min(len(cam), len(ext)), z, -np.inf)
    k = int(np.argmax(z))
    return lags[k] / SR, float(z[k])


salida = {}
for wav in sorted((base / "audio" / "externo").glob("*.wav")):
    nombre = wav.stem
    cam = leer(base / "crudos" / f"{nombre}.mp4")
    ext = leer(wav)
    d, z = gcc_phat(ext, cam)
    salida[nombre] = {"desfaseMs": round(d * 1000, 1), "z": round(z, 1),
                      "duracionVideoMs": round(len(cam) / SR * 1000), "duracionExternoMs": round(len(ext) / SR * 1000)}
    print(f"{nombre:22s} desfase {d:+.3f} s  z={z:5.1f}  video {len(cam)/SR:5.2f} s  externo {len(ext)/SR:5.2f} s")

destino = base / "datos" / "sincronia.json"
destino.write_text(json.dumps(salida, indent=2, ensure_ascii=False), encoding="utf-8")
print("->", destino)
