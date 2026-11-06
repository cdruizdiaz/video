# Tiempos por palabra de cada tramo hablado: DTW de Whisper corregido con la energía de la voz (10 ms), para que el
# subtítulo entre en el cuadro donde se oye la palabra y no antes. Sale a datos/palabras.json (tiempos del proxy, s).
import json, subprocess, sys, numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
ID = "2026-10-27_docba_r1-nov"
B = f"public/trabajos/{ID}"
# (clave, audio del tramo, json de Whisper del tramo, segundo del proxy donde empieza el tramo)
TRAMOS = [
    ("IMG_9324", "tmp/seg/IMG_9324_3.0.wav", "tmp/seg/IMG_9324_3.0.json", 3.0),
    ("IMG_9332", "tmp/seg/IMG_9332_2.6.wav", "tmp/seg/IMG_9332_2.6.json", 2.6),
    ("IMG_9347", "tmp/seg/IMG_9347_0.wav", "tmp/seg/IMG_9347_0.json", 0.0),
    ("IMG_9395", "tmp/seg/IMG_9395_6.2.wav", "tmp/seg/IMG_9395_6.2.json", 6.2),
    ("IMG_9398", "tmp/seg/IMG_9398_0.6.wav", "tmp/seg/IMG_9398_0.6.json", 0.6),
    ("voz_1", f"{B}/audio/voz_1.wav", f"{B}/datos/t_voz_1.json", 0.0),
]

def energia(wav):
    raw = subprocess.run([FF, "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(float)
    h, w = 160, 320
    return np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + w] ** 2)) + 1) for i in range(0, len(x) - w, h)])

def palabras(js):
    d = json.load(open(js, encoding="utf-8"))
    ws = []
    for t in d["tokens"]:
        if t["text"].startswith("["):
            continue
        if t["text"].startswith(" ") or not ws:
            ws.append([t["text"].strip(), t["fromMs"] / 1000, t["toMs"] / 1000])
        else:
            ws[-1][0] += t["text"]; ws[-1][2] = t["toMs"] / 1000
    return ws

salida = {}
for clave, wav, js, off in TRAMOS:
    e = energia(wav)
    voz = e[e > np.percentile(e, 60)]
    thr = np.median(voz) - 13
    res = []
    for pal, s, f_ in palabras(js):
        a = int(max(0, (s - 0.10) * 100)); b = int(min(len(e) - 1, (s + 0.30) * 100))
        s2 = s
        if e[a] < thr:  # había silencio antes: el inicio real es la primera subida de energía
            for k in range(a, b):
                if e[k] > thr and e[min(k + 2, len(e) - 1)] > thr:
                    s2 = k / 100; break
        a = int(max(0, (f_ - 0.30) * 100)); b = int(min(len(e) - 1, (f_ + 0.15) * 100))
        f2 = None
        for k in range(b, int(s2 * 100), -1):  # último cuadro con voz antes del fin del DTW (+0,15 s)
            if e[k] > thr:
                f2 = (k + 2) / 100; break
        if f2 is None:
            f2 = f_
        res.append({"p": pal, "dtw": [round(s + off, 2), round(f_ + off, 2)], "t": [round(s2 + off, 2), round(f2 + off, 2)]})
    salida[clave] = res
    print(clave, "umbral %.0f dB" % thr)
    print("  " + " ".join("%s[%.2f-%.2f|dtw %.2f-%.2f]" % (r["p"], *r["t"], *r["dtw"]) for r in res))
json.dump(salida, open(f"{B}/datos/palabras.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
