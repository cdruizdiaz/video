# Mide qué tan "gelatinosa" o temblorosa es cada toma de inserts: movimiento global cuadro a cuadro (correlación de fase)
# menos su media móvil = temblor de alta frecuencia. Reporta la mejor ventana de cada largo por toma.
import cv2, subprocess, sys, json, numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
R = "C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara"
CLIPS = {"Comida": ["0048","0050","0045","0046","0126","0127","0128","0144","0061","0062","0063","0064","0065","0098","0089","0076","0077","0078","0079","0080","0081","0099","0129","0131","0132","0114"]}
W, H, FPS = 270, 480, 24
res = {}
for dirn, lst in CLIPS.items():
    for c in lst:
        vf = ("crop=ih*9/16:ih," if c == "0114" else "transpose=2,") + f"scale={W}:{H},format=gray,fps={FPS}"
        raw = subprocess.run([FF, "-v", "error", "-t", "20", "-i", f"{R}/{dirn}/C{c}.MP4", "-vf", vf, "-f", "rawvideo", "-"], capture_output=True).stdout
        n = len(raw) // (W * H)
        fr = np.frombuffer(raw, np.uint8)[: n * W * H].reshape(n, H, W).astype(np.float32)
        win = cv2.createHanningWindow((W, H), cv2.CV_32F)
        d = [(0.0, 0.0)]
        for i in range(1, n):
            (dx, dy), _ = cv2.phaseCorrelate(fr[i - 1], fr[i], win)
            d.append((dx, dy))
        d = np.array(d)
        k = 5
        sm = np.stack([np.convolve(d[:, j], np.ones(k) / k, mode="same") for j in range(2)], 1)
        hf = np.hypot(*(d - sm).T)  # px por cuadro de temblor
        L = int(1.3 * FPS)
        best = min(range(0, max(1, n - L)), key=lambda s: hf[s:s + L].mean()) if n > L else 0
        res[c] = {"dur": round(n / FPS, 1), "jitter_medio": round(float(hf.mean()), 3), "mejor_desde_s": round(best / FPS, 2),
                  "jitter_mejor": round(float(hf[best:best + L].mean()), 3)}
        print(c, res[c], flush=True)
json.dump(res, open(f"public/trabajos/{ID if False else '2026-10-27_docba_r1-nov'}/datos/jitter.json", "w"), indent=1)
