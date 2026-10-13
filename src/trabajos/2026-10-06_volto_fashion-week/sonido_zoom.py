# Sonido de zoom corto (empuje en "sí o sí"), compuesto por código (sin licencias): un barrido de tono que sube
# rápido con un soplido de aire filtrado que crece y se corta en seco al llegar (0,3 s).
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-06_volto_fashion-week/sonido_zoom.py <salida.wav>
import sys
import wave

import numpy as np

SR = 48000
DURA = 0.30  # s (el empuje dura 0,45 s: el sonido llega antes)
TONO_DESDE, TONO_HASTA = 180.0, 900.0  # Hz
AIRE = 0.55  # proporción del soplido
CORTE = 0.012  # s de salida (casi seco)
PICO = 10 ** (-3 / 20)

n = int(DURA * SR)
t = np.arange(n) / SR
p = t / DURA
f = TONO_DESDE * (TONO_HASTA / TONO_DESDE) ** (p ** 1.5)
fase = 2 * np.pi * np.cumsum(f) / SR
tono = np.sin(fase) + 0.3 * np.sin(2 * fase)
rng = np.random.default_rng(7)
ruido = rng.standard_normal(n)
# soplido: ruido pasado por un filtro de un polo que se abre con el tiempo (más brillante al final)
aire = np.zeros(n)
y = 0.0
for i in range(n):
    a = 0.02 + 0.5 * p[i] ** 2
    y += a * (ruido[i] - y)
    aire[i] = y
aire /= np.abs(aire).max()
env = p ** 2 * np.clip((DURA - t) / CORTE, 0, 1)
x = (tono * (1 - AIRE) + aire * AIRE) * env
x *= PICO / np.abs(x).max()
estereo = (np.repeat(x[:, None], 2, axis=1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(estereo.tobytes())
print("->", sys.argv[1])
