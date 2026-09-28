"""Base instrumental suave para la historia de RASTRO (120 BPM, Fa mayor).

Síntesis 100 % propia con numpy (sin samples ni licencias de terceros).
Dos versiones, alineadas con los cortes del video (1 pulso = 0,5 s = 15 frames):
  30 s: intro 0-4 s, ritmo desde 4 s, escena oscura 18-23 s sin kick, fade desde 26,5 s
  15 s: intro 0-2,5 s, ritmo desde 2,5 s, escena oscura 9-11 s sin kick, fade desde 12,5 s

Uso: python src/trabajos/2026-09-28_rastro_historia-ig/musica_rastro.py <salida.wav> [30|15]
     (luego normalizar con ffmpeg loudnorm=I=-16 a public/trabajos/2026-09-28_rastro_historia-ig/audio/rastro-base.wav)
"""
import sys
import wave

import numpy as np

SR = 44100
BEAT = 0.5
VERSIONES = {
    30: dict(fade_in=2.5, fade_out_desde=26.5, ritmo_desde=4.0, oscuro=(18.0, 23.0), melodias=(8.0, 16.0, 24.0)),
    15: dict(fade_in=1.2, fade_out_desde=12.5, ritmo_desde=2.5, oscuro=(9.0, 11.0), melodias=(5.0,)),
}
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 30.0
CFG = VERSIONES[int(DUR)]
N = int(SR * DUR)
FADE_IN = CFG["fade_in"]
FADE_OUT_DESDE = CFG["fade_out_desde"]
rng = np.random.default_rng(11)

L = np.zeros(N)
R = np.zeros(N)
drums = np.zeros(N)
side = np.ones(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def add(buf, sig, t, gain=1.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    buf[i : i + len(sig)] += sig * gain


def add_st(sig, t, gain=1.0, pan=0.0):
    add(L, sig, t, gain * np.sqrt((1 - pan) / 2))
    add(R, sig, t, gain * np.sqrt((1 + pan) / 2))


def _fft_filter(x, resp):
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(np.fft.rfft(x) * resp(fr), len(x))


def highpass(x, fc):
    return _fft_filter(x, lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4))


def lowpass(x, fc):
    return _fft_filter(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** 4))


# ---------- instrumentos ----------
def epiano(note, dur=1.6):
    """Piano eléctrico tipo Rhodes: fundamental + armónicos que se apagan rápido."""
    t = tt(dur)
    f = midi(note)
    s = (
        np.sin(2 * np.pi * f * t)
        + 0.32 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 5)
        + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 9)
        + 0.06 * np.sin(2 * np.pi * 4.02 * f * t) * np.exp(-t * 22)
    )
    env = np.minimum(1, t / 0.006) * np.exp(-t * 2.4) * np.minimum(1, (dur - t) / 0.08)
    return s * env


def pad(notes, dur):
    t = tt(dur)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.07, 0.0, 0.07):
            f = midi(n + det)
            kmax = int(min(10, 2500 / f))
            for k in range(1, kmax + 1):
                out += (1 / k**1.4) * np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6.28))
    env = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return out * env / (len(notes) * 3)


def sub(note, dur=0.9):
    t = tt(dur)
    s = np.sin(2 * np.pi * midi(note) * t) + 0.15 * np.sin(2 * np.pi * 2 * midi(note) * t)
    env = np.minimum(1, t / 0.02) * np.exp(-t * 2.2) * np.minimum(1, (dur - t) / 0.05)
    return s * env


def kick():
    t = tt(0.4)
    f = 42 + 60 * np.exp(-t * 22)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)


def shaker():
    t = tt(0.09)
    n = highpass(rng.standard_normal(len(t)), 6000)
    return n * np.minimum(1, t / 0.012) * np.exp(-t * 45)


def rim():
    t = tt(0.12)
    n = highpass(rng.standard_normal(len(t)), 1800)
    tone = np.sin(2 * np.pi * 820 * t)
    return (n * 0.6 + tone * 0.4) * np.exp(-t * 55)


def kick_at(t, g):
    add(drums, kick(), t, g)
    i = int(t * SR)
    d = tt(0.4)
    duck = 1 - 0.3 * np.exp(-d * 9)
    seg = side[i : i + len(d)]
    seg[:] = np.minimum(seg, duck[: len(seg)])


# ---------- armonía: Fmaj7 - Am7 - Dm7 - Bbmaj7 (2 s cada acorde) ----------
ACORDES = [
    (29, [65, 69, 72, 76]),  # Fmaj7
    (33, [64, 67, 69, 72]),  # Am7
    (26, [62, 65, 69, 72]),  # Dm7
    (34, [62, 65, 69, 70]),  # Bbmaj7
]
# arpegio del piano en corcheas (índices sobre las notas del acorde)
ARPEGIO = [0, 2, 1, 3, 2, 1, 3, 2]
# pequeña melodía
MELODIA = [(0.0, 81), (0.75, 79), (1.5, 77), (2.5, 76), (3.0, 77), (3.5, 72)]

for c in range(int(DUR / 2)):
    t0 = c * 2.0
    raiz, notas = ACORDES[c % 4]
    add_st(pad(notas, 2.1), t0, 0.55)
    for k, idx in enumerate(ARPEGIO):
        add_st(epiano(notas[idx], 1.2), t0 + k * 0.25, 0.10 + 0.03 * (k % 2 == 0), pan=(-0.35, 0.35)[k % 2])
    if t0 >= CFG["ritmo_desde"]:
        add_st(sub(raiz + 12, 0.95), t0, 0.5)
        add_st(sub(raiz + 12, 0.45), t0 + 1.5, 0.35)

for base in CFG["melodias"]:
    for dt, n in MELODIA:
        add_st(epiano(n, 1.4), base + dt, 0.12, pan=0.2)

b = 0
t = CFG["ritmo_desde"]
while t < DUR - 1.0:
    en_ritmo = not (CFG["oscuro"][0] <= t < CFG["oscuro"][1])
    pos = b % 4
    if en_ritmo:
        if pos in (0, 2):
            kick_at(t, 0.55)
        if pos == 2:
            add(drums, rim(), t, 0.12)
        for s in (0, 0.25):
            add(drums, shaker(), t + s, 0.05 if s == 0 else 0.08)
    else:
        add(drums, shaker(), t + 0.25, 0.04)
    b += 1
    t += BEAT


# ---------- mezcla ----------
def reverb(x, secs=2.2):
    n_ir = int(secs * SR)
    ir = lowpass(rng.standard_normal(n_ir) * np.exp(-np.arange(n_ir) / SR * 3.0), 5000)
    n = len(x) + n_ir
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
    return y / np.max(np.abs(y)) * np.max(np.abs(x))


ml, mr = L * side, R * side
mix = np.stack([ml + 0.3 * reverb(ml) + drums, mr + 0.3 * reverb(mr) + drums])
mix = np.stack([lowpass(highpass(ch, 35), 12000) for ch in mix])
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.2) * 0.85

tiempo = np.arange(N) / SR
envolvente = np.minimum(1, tiempo / FADE_IN) * np.clip((DUR - tiempo) / (DUR - FADE_OUT_DESDE), 0, 1)
mix *= envolvente**1.5

out = (mix.T * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print("OK", sys.argv[1])
