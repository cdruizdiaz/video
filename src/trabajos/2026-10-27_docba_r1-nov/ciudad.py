# Ruido de ciudad caótica compuesto por código (sin licencias de terceros): rumor de tránsito, autos que pasan,
# bocinas, una sirena lejana, murmullo y un frenazo. 8 s, mono 48 kHz; después ffmpeg le baja la banda de la voz y lo
# deja a ~-31 LUFS (bajo la voz). Salida: public/trabajos/<ID>/audio/ciudad.wav
import subprocess, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
SR, DUR = 48000, 8.0
rng = np.random.default_rng(27)
n = int(SR * DUR)
t = np.arange(n) / SR

def filtro(x, tipo, f):
    return sosfilt(butter(4, f, btype=tipo, fs=SR, output="sos"), x)

def ruido(): return rng.standard_normal(n)
def gauss(c, w): return np.exp(-0.5 * ((t - c) / w) ** 2)

# rumor de tránsito
rumor = filtro(np.cumsum(ruido()), "highpass", 40); rumor = filtro(rumor, "lowpass", 700); rumor /= np.abs(rumor).max()
mezcla = 0.55 * rumor * (0.8 + 0.2 * np.sin(2 * np.pi * 0.35 * t))

# autos y colectivos que pasan: ruido de banda que sube y baja
for c, w, f0, g in [(0.9, 0.55, 500, 0.7), (2.2, 0.45, 800, 0.6), (3.3, 0.7, 350, 0.9), (4.6, 0.5, 900, 0.6), (6.0, 0.6, 450, 0.8)]:
    x = filtro(filtro(ruido(), "highpass", f0 * 0.5), "lowpass", f0 * 2.2)
    mezcla += g * 0.9 * x / np.abs(x).max() * gauss(c, w)

# bocinas (dos tonos, pulsadas)
def bocina(t0, f, pulsos, largo=0.28, pausa=0.12, g=0.35):
    out = np.zeros(n)
    for k in range(pulsos):
        a = t0 + k * (largo + pausa)
        m = (t >= a) & (t < a + largo)
        env = np.clip((t - a) / 0.01, 0, 1) * np.clip((a + largo - t) / 0.02, 0, 1)
        s = sum(np.sin(2 * np.pi * f * h * t + 0.3 * h) / h for h in (1, 2, 3)) + sum(np.sin(2 * np.pi * f * 1.26 * h * t) / h for h in (1, 2))
        out += np.where(m, s * env, 0)
    return g * filtro(out, "lowpass", 3500)
mezcla += bocina(0.55, 410, 2) + bocina(2.0, 360, 1, 0.5, 0, 0.3) + bocina(2.9, 450, 3, 0.2, 0.08, 0.3) + bocina(4.4, 390, 2, 0.35, 0.1, 0.3) + bocina(6.3, 430, 1, 0.6, 0, 0.25)

# sirena lejana
fs = 700 + 220 * np.sign(np.sin(2 * np.pi * 0.9 * t))
sirena = np.sin(2 * np.pi * np.cumsum(fs) / SR) * gauss(5.6, 1.6)
mezcla += 0.12 * filtro(sirena, "lowpass", 2500)

# murmullo de gente
mur = filtro(filtro(ruido(), "highpass", 300), "lowpass", 1800) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3.1 * t + rng.random() * 6)))
mezcla += 0.16 * mur / np.abs(mur).max()

# frenazo
fren = filtro(ruido(), "highpass", 2800) * gauss(3.95, 0.12)
mezcla += 0.08 * fren / np.abs(fren).max()

mezcla /= np.abs(mezcla).max()
tmp = "tmp/ciudad_cruda.wav"
wavfile.write(tmp, SR, (mezcla * 0.8 * 32767).astype(np.int16))
subprocess.run(["C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe", "-y", "-v", "error", "-i", tmp, "-af",
                "equalizer=f=2200:t=q:w=1.2:g=-7,loudnorm=I=-31:TP=-6:LRA=7,aformat=sample_rates=48000:channel_layouts=mono",
                "public/trabajos/2026-10-27_docba_r1-nov/audio/ciudad.wav"], check=True)
print("ok")
