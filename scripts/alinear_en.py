# Alineación forzada de un texto con una voz (tiempos por palabra con resolución de 20 ms): wav2vec2 CTC en INGLÉS
# (facebook/wav2vec2-base-960h, se baja una vez a ~/.cache/huggingface) + Viterbi CTC propio.
# Es lo que hay que usar para sincronizar subtítulos con la voz (el DTW de Whisper estira palabras sobre pausas).
# Uso: python scripts/alinear.py <audio.wav|mp4> "texto de lo que se dice" [--desde s --hasta s] [--json salida.json]
#   Los tiempos salen en segundos del archivo original (se suma --desde).
import argparse, json, re, subprocess, sys, unicodedata
import numpy as np, torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
MODELO = "facebook/wav2vec2-base-960h"
ap = argparse.ArgumentParser(); ap.add_argument("audio"); ap.add_argument("texto")
ap.add_argument("--desde", type=float, default=0); ap.add_argument("--hasta", type=float, default=None); ap.add_argument("--json")
a = ap.parse_args()
cmd = [FF, "-v", "error", "-ss", str(a.desde)] + (["-t", str(a.hasta - a.desde)] if a.hasta else []) + ["-i", a.audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"]
x = np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32).copy()
proc = Wav2Vec2Processor.from_pretrained(MODELO); model = Wav2Vec2ForCTC.from_pretrained(MODELO).eval()
inp = proc(x, sampling_rate=16000, return_tensors="pt")
with torch.no_grad(): lp = torch.log_softmax(model(inp.input_values).logits[0], -1).numpy()  # (T, V), 20 ms por paso
vocab = proc.tokenizer.get_vocab(); blank = vocab.get("<pad>", 0); sep = vocab.get("|")
def limpiar(w):
    return "".join(c for c in w.upper() if c in vocab)
palabras = [(w, limpiar(w)) for w in a.texto.split()]; palabras = [(w, l) for w, l in palabras if l]
tokens, dueno = [], []
for i, (_, l) in enumerate(palabras):
    for c in l: tokens.append(vocab[c]); dueno.append(i)
    if i < len(palabras) - 1 and sep is not None: tokens.append(sep); dueno.append(-1)
# Viterbi CTC (trellis con blank entre símbolos)
S = 2 * len(tokens) + 1; T = lp.shape[0]; ext = [blank] * S
for k, t in enumerate(tokens): ext[2 * k + 1] = t
NEG = -1e30; dp = np.full((T, S), NEG); bp = np.zeros((T, S), np.int8)
dp[0, 0] = lp[0, blank]
if S > 1: dp[0, 1] = lp[0, ext[1]]
for t in range(1, T):
    for s in range(S):
        c = [dp[t - 1, s]]; 
        if s >= 1: c.append(dp[t - 1, s - 1])
        if s >= 2 and ext[s] != blank and ext[s] != ext[s - 2]: c.append(dp[t - 1, s - 2])
        j = int(np.argmax(c)); dp[t, s] = c[j] + lp[t, ext[s]]; bp[t, s] = j
s = S - 1 if dp[T - 1, S - 1] > dp[T - 1, S - 2] else S - 2; ruta = []
for t in range(T - 1, -1, -1):
    ruta.append(s); s -= int(bp[t, s]) if bp[t, s] <= 1 else 2
ruta = ruta[::-1]
ini = {}; fin = {}
for t, s in enumerate(ruta):
    if s % 2 == 1:
        d = dueno[(s - 1) // 2]
        if d >= 0: ini.setdefault(d, t); fin[d] = t
salida = []
for i, (w, _) in enumerate(palabras):
    if i in ini: salida.append({"palabra": w, "ini": round(a.desde + ini[i] * 0.02, 3), "fin": round(a.desde + (fin[i] + 1) * 0.02, 3)})
for p in salida: print(f"{p['ini']:7.2f} - {p['fin']:6.2f}  {p['palabra']}")
if a.json: json.dump(salida, open(a.json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
