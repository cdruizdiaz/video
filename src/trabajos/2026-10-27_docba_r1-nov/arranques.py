# Arranques de voz de un audio (tiempos del propio archivo): energía de 10 ms; imprime cada tramo con voz [inicio-fin] (huecos de
# ≥ 40 ms separan tramos) y, dentro de cada tramo, los valles (caídas ≥ 4 dB) que marcan el cambio de sílaba/palabra.
# Uso: python arranques.py <audio.wav> [desde hasta]
import os, subprocess, sys, numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
wav = sys.argv[1]; d = float(sys.argv[2]) if len(sys.argv) > 2 else 0; h = float(sys.argv[3]) if len(sys.argv) > 3 else 1e9
raw = subprocess.run([FF, "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-af", "highpass=f=200", "-f", "s16le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(float); H, W = 160, 320
e = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + W] ** 2)) + 1) for i in range(0, len(x) - W, H)])  # 10 ms
VALLE = float(os.environ.get("VALLE", 4))
t = np.arange(len(e)) * 0.01
import os
thr = np.percentile(e, 95) - float(os.environ.get("UMBRAL", 20))
v = e > thr
tr = []; i = 0
while i < len(v):
    if v[i]:
        j = i
        while j < len(v) and (v[j] or (j + 4 < len(v) and v[j:j + 5].any())): j += 1
        tr.append((i, j)); i = j
    else: i += 1
for a, b in tr:
    if t[b - 1] < d or t[a] > h: continue
    val = []
    for k in range(a + 3, b - 3):
        if e[k] == e[k - 3:k + 4].min() and e[k - 3:k].max() - e[k] >= VALLE and e[k + 1:k + 4].max() - e[k] >= VALLE: val.append(round(t[k], 2))
    print("voz %.2f - %.2f  valles %s" % (t[a], t[b - 1], val))
