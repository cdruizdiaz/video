"""Música del manifiesto de RASTRO (45 s), compuesta por código y sincronizada con la animación.

Síntesis 100 % propia con numpy (sin samples ni licencias de terceros).
Los momentos salen de las constantes T de src/plantillas/ManifiestoRastros/ManifiestoRastros.tsx
(frames a 30 fps). "Menos ruido, más historias": mucho silencio, pocas notas, cada marca suena.

  0-5 s    gota: golpe suave + campana con eco (el punto cae)
  5-12 s   punto (nota grave), línea (un tono que se estira), camino (arpegio que fluye)
  12-19 s  pisadas: un golpe de madera + una nota por paso; el patrón, ticks más rápidos
  19-25 s  ruido: racimos de notas al azar y textura que crece hasta cortar en seco
  25-32 s  goma (barrido de aire) → silencio → "Menos ruido." acorde grave → "Más historias." entra el colchón
  32-38 s  el aro rueda: arpegio con pulso suave
  38-45 s  "Para que algo pase…" / "y algo quede." / el punto cae otra vez y suena el acorde final

Uso: python src/trabajos/2026-10-01_rastro_manifiesto/musica_manifiesto.py <salida.wav>
     luego loudnorm I=-14 a public/trabajos/2026-10-01_rastro_manifiesto/audio/manifiesto-musica.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 45.0
N = int(SR * DUR)
rng = np.random.default_rng(23)
L = np.zeros(N)
R = np.zeros(N)


def fr(frame):
    return frame / 30.0


# Tiempos (frames) iguales a T en la plantilla
T = dict(impacto=30, gestoIn=44, punto=150, linea=200, lineaFin=250, camino=268, paso=375, pasoFin=505,
         patron=515, ruido=570, ruidoLleno=735, goma=750, gomaFin=795, menos=805, capsula=872, mas=885,
         pliegue=960, aro=978, rueda=1000, ruedaFin=1095, disenamos=1020, contamos=1055, intencion=1090,
         memoria=1140, pase=1150, quede=1220, converge=1245, marca=1262, marcaFin=1312)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * np.sqrt((1 - pan) / 2)
    R[i : i + len(sig)] += sig * gain * np.sqrt((1 + pan) / 2)


def _fft_filter(x, resp):
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(np.fft.rfft(x) * resp(f), len(x))


def highpass(x, fc):
    return _fft_filter(x, lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4))


def lowpass(x, fc):
    return _fft_filter(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** 4))


# ---------- instrumentos ----------
def piano(note, dur=2.5, brillo=1.0):
    """Piano suave (tipo felt): fundamental + armónicos que se apagan pronto."""
    t = tt(dur)
    f = midi(note)
    s = (
        np.sin(2 * np.pi * f * t)
        + 0.35 * brillo * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 4)
        + 0.12 * brillo * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 8)
        + 0.05 * brillo * np.sin(2 * np.pi * 4.02 * f * t) * np.exp(-t * 16)
    )
    golpe = highpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 300) * 0.08
    env = np.minimum(1, t / 0.004) * np.exp(-t * 1.6) * np.minimum(1, (dur - t) / 0.1)
    return (s + golpe) * env


def campana(note, dur=3.0):
    t = tt(dur)
    f = midi(note)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 3) + 0.25 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 6)
    return s * np.minimum(1, t / 0.002) * np.exp(-t * 1.4) * np.minimum(1, (dur - t) / 0.1)


def gota(dur=0.6, grave=55):
    """El punto que cae: golpe grave y redondo, como tinta sobre papel."""
    t = tt(dur)
    f = grave + 70 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    clic = lowpass(rng.standard_normal(len(t)), 1800) * np.exp(-t * 120) * 0.3
    return s + clic


def madera(pitch=900):
    """Pisada: golpe seco de madera."""
    t = tt(0.15)
    s = np.sin(2 * np.pi * pitch * t) * np.exp(-t * 60) + 0.5 * np.sin(2 * np.pi * pitch * 2.3 * t) * np.exp(-t * 90)
    n = lowpass(highpass(rng.standard_normal(len(t)), 400), 3000) * np.exp(-t * 80) * 0.4
    return s + n


def tono_estirado(n0, n1, dur):
    t = tt(dur)
    f = midi(n0) * (midi(n1) / midi(n0)) ** (t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.2 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 0.6)


def colchon(notes, dur, ataque=1.2):
    t = tt(dur)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.06, 0.0, 0.06):
            f = midi(n + det)
            for k in range(1, int(min(8, 2200 / f)) + 1):
                out += (1 / k**1.5) * np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6.28))
    env = np.minimum(1, t / ataque) * np.minimum(1, (dur - t) / 1.2)
    return lowpass(out * env / (len(notes) * 3), 2500)


def sub(note, dur=2.0):
    t = tt(dur)
    s = np.sin(2 * np.pi * midi(note) * t)
    return s * np.minimum(1, t / 0.02) * np.exp(-t * 1.2) * np.minimum(1, (dur - t) / 0.1)


def aire(dur, f0, f1):
    """Barrido de aire (la goma): ruido filtrado que se mueve de f0 a f1."""
    t = tt(dur)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    trozos = 24
    largo = len(n) // trozos
    for i in range(trozos):
        fc = f0 * (f1 / f0) ** (i / trozos)
        seg = n[i * largo : (i + 1) * largo + 2000]
        y = lowpass(highpass(seg, fc * 0.5), fc * 1.6)
        ven = np.hanning(len(y))
        out[i * largo : i * largo + len(y)] += (y * ven)[: len(out) - i * largo]
    return out * np.sin(np.pi * t / dur) ** 1.5


# Re mayor: D F# A C# E (escala mayor y pentatónica)
PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83]

# ---------- A: el gesto ----------
add(gota(), fr(T["impacto"]), 0.9)
for d, g in [(0, 0.35), (0.42, 0.16), (0.84, 0.07)]:  # eco, como el aro que se expande
    add(campana(86), fr(T["impacto"]) + d, g, pan=(-0.3, 0.3, 0)[int(d / 0.42)])
for i, n in enumerate([74, 78, 81]):  # el texto se escribe
    add(piano(n, 2.0, 0.6), fr(T["gestoIn"]) + 0.15 + i * 0.55, 0.12, pan=-0.2 + i * 0.2)

# ---------- B: punto, línea, camino ----------
add(sub(38, 2.5), fr(T["punto"]), 0.55)
add(piano(62, 3.0), fr(T["punto"]), 0.28)
add(tono_estirado(69, 74, fr(T["lineaFin"] - T["linea"]) + 0.8), fr(T["linea"]), 0.10)
add(piano(66, 2.5, 0.7), fr(T["linea"]), 0.14, pan=0.3)
for i, n in enumerate([62, 66, 69, 73, 76, 78, 81]):  # el camino fluye
    add(piano(n, 2.2, 0.8), fr(T["camino"]) + 0.25 + i * 0.2, 0.11, pan=np.sin(i) * 0.5)

# ---------- C: pisadas ----------
for k in range(14):
    t = fr(T["paso"] + (k + 0.5) / 14 * (T["pasoFin"] - T["paso"]))
    add(madera(820 if k % 2 else 980), t, 0.16, pan=(-0.35, 0.35)[k % 2])
    add(piano(PENTA[k % len(PENTA)] + (0 if k < 10 else 12), 1.6, 0.7), t, 0.085, pan=(-0.25, 0.25)[k % 2])
add(sub(43, 3.0), fr(T["paso"]), 0.25)
for c in range(1, 5):  # el patrón: las mismas pisadas, más rápido
    for k in range(0, 14, 2):
        add(madera(1100 + c * 60), fr(T["patron"] + (c - 1) * 7 + k * 1.2), 0.06, pan=rng.uniform(-0.7, 0.7))

# ---------- D: ruido ----------
t0, t1 = fr(T["ruido"]), fr(T["ruidoLleno"] + 14)
ts = t0 + (t1 - t0) * np.sqrt(np.sort(rng.uniform(0, 1, 260)))
for t in ts:
    u = (t - t0) / (t1 - t0)
    n = int(rng.integers(48, 96)) + rng.uniform(-0.3, 0.3)
    add(piano(n, 0.6, 1.4), t, 0.03 + 0.07 * u, pan=rng.uniform(-0.9, 0.9))
    if rng.uniform() < 0.3:
        add(madera(rng.uniform(500, 2500)), t, 0.05 * u, pan=rng.uniform(-0.9, 0.9))
dur_ruido = t1 - t0
tr = tt(dur_ruido)
textura = highpass(rng.standard_normal(len(tr)), 900) * (tr / dur_ruido) ** 2.5
add(textura, t0, 0.10)
add(colchon([49, 50, 56, 57], dur_ruido, ataque=dur_ruido * 0.8) * (tr / dur_ruido) ** 1.5, t0, 0.5)
# corte en seco: todo lo anterior se calla justo antes de la goma
corte = int(fr(T["goma"]) * SR)
rampa = int(0.03 * SR)
for ch in (L, R):
    ch[corte : corte + rampa] *= np.linspace(1, 0, rampa)
    ch[corte + rampa : corte + int(1.0 * SR)] = 0

# ---------- E: goma, menos ruido, más historias ----------
add(aire(fr(T["gomaFin"] - T["goma"]) + 0.3, 3500, 500), fr(T["goma"]), 0.22)
add(sub(38, 3.0), fr(T["menos"]), 0.4)
for n in (50, 57, 62):
    add(piano(n, 3.5, 0.6), fr(T["menos"]), 0.13)
add(piano(69, 3.0), fr(T["capsula"]), 0.12, pan=-0.2)
add(colchon([62, 66, 69, 76], fr(T["pliegue"] - T["mas"]) + 1.6), fr(T["mas"]), 0.45)
for i, n in enumerate([74, 78, 76, 81]):
    add(piano(n, 2.4, 0.8), fr(T["mas"]) + 0.2 + i * 0.35, 0.12, pan=0.25)

# ---------- F: el aro rueda — Re · Si m · Sol · La ----------
add(madera(700), fr(T["aro"]), 0.12)
ACORDES = [(38, [62, 66, 69, 73]), (35, [59, 62, 66, 69]), (31, [59, 62, 66, 71]), (33, [61, 64, 69, 73])]
paso_rueda = (fr(T["ruedaFin"]) - fr(T["rueda"])) / 16
for i in range(16):
    raiz, notas = ACORDES[i // 4]
    t = fr(T["rueda"]) + i * paso_rueda
    add(piano(notas[[0, 2, 1, 3][i % 4]] + 12, 1.8, 0.7), t, 0.10, pan=(-0.3, 0.3)[i % 2])
    if i % 4 == 0:
        add(colchon(notas, paso_rueda * 4 + 0.8, ataque=0.4), t, 0.35)
        add(sub(raiz, 2.0), t, 0.32)
for clave in ("disenamos", "contamos"):
    add(piano(81, 2.0), fr(T[clave]), 0.10, pan=0.3)
add(piano(86, 2.5), fr(T["intencion"]), 0.13)
add(sub(33, 2.5), fr(T["intencion"]), 0.4)

# ---------- G: para que algo pase… y algo quede. Rastro. ----------
add(colchon([57, 62, 64, 69], fr(T["marca"] - T["memoria"]) + 0.6, ataque=1.5), fr(T["memoria"]), 0.35)
for i, n in enumerate([69, 71, 74]):
    add(piano(n, 2.0, 0.6), fr(T["pase"]) + i * 0.3, 0.10, pan=0.4 - i * 0.4)
add(aire(1.0, 800, 3000), fr(T["pase"]) + 1.6, 0.06)
for n in (57, 64, 69):
    add(piano(n, 3.0), fr(T["quede"]), 0.12)
add(aire(fr(T["marca"] - T["converge"]) + 0.2, 400, 4000), fr(T["converge"]), 0.07)  # convergen los rastros
# el punto cae otra vez: mismo golpe y misma campana que el comienzo
add(gota(), fr(T["marca"]), 0.95)
for d, g in [(0, 0.38), (0.42, 0.17), (0.84, 0.08)]:
    add(campana(86), fr(T["marca"]) + d, g, pan=(-0.3, 0.3, 0)[int(d / 0.42)])
cola = DUR - fr(T["marca"])
add(colchon([50, 57, 62, 66, 69, 76], cola, ataque=0.3), fr(T["marca"]), 0.55)
add(sub(38, cola), fr(T["marca"]), 0.5)
for i, n in enumerate([62, 66, 69, 74, 78]):  # las letras se dibujan
    add(piano(n, 2.8, 0.7), fr(T["marca"] + 4 + i * 6), 0.10, pan=-0.4 + i * 0.2)
add(piano(74, 3.0), fr(T["marcaFin"]), 0.12)


# ---------- mezcla ----------
def reverb(x, secs=3.0):
    n_ir = int(secs * SR)
    ir = lowpass(rng.standard_normal(n_ir) * np.exp(-np.arange(n_ir) / SR * 2.2), 4500)
    n = len(x) + n_ir
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
    return y / np.max(np.abs(y)) * np.max(np.abs(x))


mezcla = np.stack([L + 0.35 * reverb(L), R + 0.35 * reverb(R)])
mezcla = np.stack([lowpass(highpass(ch, 30), 14000) for ch in mezcla])
mezcla = np.tanh(mezcla / np.max(np.abs(mezcla)) * 1.1) * 0.85
tiempo = np.arange(N) / SR
mezcla *= np.clip((DUR - tiempo) / 1.2, 0, 1) ** 1.5  # cola: se apaga en el último segundo

out = (mezcla.T * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print("OK", sys.argv[1])
