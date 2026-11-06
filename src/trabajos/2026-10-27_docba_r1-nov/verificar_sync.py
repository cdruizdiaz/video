# Verifica que cada subtítulo entre a la par de la voz: saca del audio del render los arranques de voz (energía que sube tras
# un hueco de >= 70 ms) y compara cada inicio de subtítulo con el arranque más cercano (±0,45 s).
# delta = arranque de voz - entrada del texto (en ms): > 0 el texto sale ANTES que la voz; < 0 DESPUÉS.
# Uso: python verificar_sync.py <render.mp4> <subs.json>
import json, subprocess, sys, numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
mp4, js = sys.argv[1], sys.argv[2]
subs = json.load(open(js))["subs"]
raw = subprocess.run([FF, "-v", "error", "-i", mp4, "-ac", "1", "-ar", "16000", "-af", "highpass=f=250", "-f", "s16le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(float)
h, w = 80, 240
e = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + w] ** 2)) + 1) for i in range(0, len(x) - w, h)])  # 5 ms
thr = np.percentile(e, 92) - 18
voz = e > thr
on = []
quiet = 0
for i, v in enumerate(voz):
    if v and quiet >= 14:
        on.append(i * 0.005)
    quiet = 0 if v else quiet + 1
on = np.array(on)
for s in subs:
    a = s["inicioS"] + 0.03
    k = on[np.abs(on - a) < 0.45]
    txt = s["texto"].replace("\n", " | ")
    if len(k) == 0:
        print("%6.2f %-34s (empieza con la voz ya en marcha)" % (a, txt))
    else:
        j = k[np.argmin(np.abs(k - a))]
        print("%6.2f %-34s voz entra %6.2f   delta = %+4.0f ms" % (a, txt, j, (j - a) * 1000))
