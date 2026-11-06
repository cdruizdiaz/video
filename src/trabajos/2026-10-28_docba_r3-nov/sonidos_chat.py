# Sonidos de mensaje de texto compuestos por código (Mixkit devolvió 403 al bajar "Message pop alert"): un "pop" de entrada
# (msg_in.wav, dos notas cortas) con 3 variantes de tono para que no suenen idénticos, y un "ping" de notificación (msg_ping.wav).
# Salidas en public/trabajos/<ID>/audio/ a 48 kHz mono.
import numpy as np, wave
SR = 48000
OUT = "public/trabajos/2026-10-28_docba_r3-nov/audio"
def nota(f0, f1, dur, vol=1.0, ataque=0.003):
    t = np.arange(int(SR * dur)) / SR
    f = f0 + (f1 - f0) * np.minimum(t / (dur * 0.5), 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(t / ataque, 1) * np.exp(-t * (5.0 / dur))
    return vol * env * (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph))
def mezcla(partes, largo):
    x = np.zeros(int(SR * largo))
    for ini, s in partes:
        i = int(SR * ini); x[i:i + len(s)] += s[: len(x) - i]
    x /= max(1e-6, np.abs(x).max()) / 0.7
    return x
def guardar(n, x):
    with wave.open(f"{OUT}/{n}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
for k, base in enumerate([880, 988, 784]):
    guardar(f"msg_in_{k + 1}", mezcla([(0, nota(base, base * 1.03, 0.09)), (0.07, nota(base * 1.5, base * 1.5, 0.22, 0.8))], 0.4))
guardar("msg_ping", mezcla([(0, nota(1319, 1319, 0.35)), (0.12, nota(1760, 1760, 0.5, 0.9))], 0.7))
print("ok")
