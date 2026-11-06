# R2 editado v6: "Como en casa, pero sin lavar un plato." pasa a voz en off pegada a "comodidades" (se saca el silencio de 0,83 s).
# La música de la mezcla de la usuaria es musica_full.wav × 0,077 (desfase 1,167 s − 16 muestras; residuo −60 dB en tramos sin voz):
# se separa la voz restando la música y, después del corte, se vuelve a sumar la música continua (sin salto de compás).
# También extrae los 3 efectos de sonido del "R2 NOV DOCBA V1.mp4" de la usuaria (= v5 + efectos): diferencia contra la v5.
# Uso: python audio_vo_casa.py <dl48.wav> <v5_48.wav>
import sys, numpy as np, soundfile as sf
A = "public/trabajos/2026-10-28_docba_r2-nov/audio/"
a, sr = sf.read(A + "r2_editado_dn.wav"); m, _ = sf.read(A + "musica_full.wav")
O = int(1.167 * sr) - 16
C1 = 16.03            # después de "comodidades" (la voz termina en 15,98)
DELTA = 25 / 30       # 25 cuadros: "Como" (16,90) queda en 16,07
w = int(0.1 * sr)
# ganancia de la música por ventanas de 0,1 s (mínimos cuadrados), suavizada
gs = []
for i in range(0, len(a), w):
    x = a[i:i + w]; y = m[O + i:O + i + len(x)]
    gs.append((x * y).sum() / max((y * y).sum(), 1e-12))
gs = np.convolve(np.pad(gs, 5, mode="edge"), np.ones(11) / 11, mode="valid")
g = np.repeat(gs, w)[:len(a)][:, None]
voz = a - g * m[O:O + len(a)]
n = len(a) - int(DELTA * sr)
out = np.zeros((n, 2))
c1 = int(C1 * sr); d = int(round(DELTA * sr))
out[:c1] = a[:c1]
idx = np.arange(c1, n)
out[c1:] = voz[idx + d] + g[idx + d] * m[O + idx]
sf.write(A + "r2_editado_v6.wav", out, sr, subtype="PCM_24")
print("ganancia música min/max tras el corte", float(gs[int(C1*10):].min()), float(gs[int(C1*10):].max()))
# efectos de sonido
dl, _ = sf.read(sys.argv[1]); v5, _ = sf.read(sys.argv[2])
k = min(len(dl), len(v5)); dif = dl[:k] - 0.9953 * v5[:k]
for nombre, t0, t1 in [("sfx_flash1", 4.15, 4.42), ("sfx_flash2", 18.35, 18.64), ("sfx_placa", 21.3, 23.0)]:
    s = dif[int(t0 * sr):int(t1 * sr)].copy()
    f = int(0.04 * sr); s[-f:] *= np.linspace(1, 0, f)[:, None]; s[:int(0.01*sr)] *= np.linspace(0, 1, int(0.01*sr))[:, None]
    sf.write(A + nombre + ".wav", s, sr, subtype="PCM_24"); print(nombre, t0)
