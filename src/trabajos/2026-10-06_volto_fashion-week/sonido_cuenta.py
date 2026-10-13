# Sonido de cifra que sube ("un millón y medio de seguidores"), compuesto por código (sin licencias):
# golpecitos cada vez más seguidos y más agudos durante la cuenta (0,8 s, como CIFRA_CUENTA) y un "ding" al llegar.
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-06_volto_fashion-week/sonido_cuenta.py <salida.wav>
import sys
import wave

import numpy as np

SR = 48000
CUENTA = 0.8  # s
GOLPES = 16
TONO_DESDE, TONO_HASTA = 700.0, 1900.0  # Hz
GOLPE = 0.035  # s de cada golpecito
DING = (2349.0, 0.45)  # Hz (re), s
PICO = 10 ** (-3 / 20)

largo = int((CUENTA + DING[1] + 0.05) * SR)
x = np.zeros(largo)
for i in range(GOLPES):
    p = i / (GOLPES - 1)
    t0 = CUENTA * (1 - (1 - p) ** 1.6)  # cada vez más seguidos (sigue el easing de la cifra)
    f = TONO_DESDE * (TONO_HASTA / TONO_DESDE) ** p
    n = int(GOLPE * SR)
    t = np.arange(n) / SR
    g = np.sin(2 * np.pi * f * t) * np.exp(-t / (GOLPE / 4)) * (0.5 + 0.5 * p)
    a = int(t0 * SR)
    x[a:a + n] += g
t = np.arange(int(DING[1] * SR)) / SR
ding = (np.sin(2 * np.pi * DING[0] * t) + 0.35 * np.sin(2 * np.pi * 2 * DING[0] * t)) * np.exp(-t / 0.12)
a = int(CUENTA * SR)
x[a:a + len(ding)] += ding
x *= PICO / np.abs(x).max()
estereo = (np.repeat(x[:, None], 2, axis=1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(estereo.tobytes())
print("->", sys.argv[1])
