# Elige la ventana más firme de cada insert: temblor de traslación (correlación de fase) + "gelatina" (cambio cuadro a
# cuadro del flujo óptico residual, una vez restado el movimiento global). Menor puntaje = más firme.
import cv2, subprocess, json, numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
R = "C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara/Comida"
W, H, FPS = 135, 240, 24
# slot: (largo necesario s, tomas candidatas)
SLOTS = {
    "matcha": (1.74, ["0050"]),  # "matcha latte": un solo plano del vaso (steady)
    "croissant": (0.94, ["0126", "0128", "0127"]),
    "guacamole": (0.70, ["0062", "0098", "0065", "0061", "0063", "0089", "0064"]),
    "toston": (1.67, ["0076", "0077", "0078"]),
    "vino": (2.52, ["0129", "0132"]),  # "y cuando se acerca la noche, aparece la copa de vino": un plano continuo
}
def serie(c):
    vf = f"transpose=2,scale={W}:{H},format=gray,fps={FPS}"
    raw = subprocess.run([FF, "-v", "error", "-t", "20", "-i", f"{R}/C{c}.MP4", "-vf", vf, "-f", "rawvideo", "-"], capture_output=True).stdout
    n = len(raw) // (W * H)
    fr = np.frombuffer(raw, np.uint8)[: n * W * H].reshape(n, H, W)
    win = cv2.createHanningWindow((W, H), cv2.CV_32F)
    tr = [(0.0, 0.0)]; wob = [0.0]; prev_res = None
    for i in range(1, n):
        (dx, dy), _ = cv2.phaseCorrelate(fr[i - 1].astype(np.float32), fr[i].astype(np.float32), win)
        tr.append((dx, dy))
        fl = cv2.calcOpticalFlowFarneback(fr[i - 1], fr[i], None, 0.5, 2, 15, 2, 5, 1.1, 0)
        res = fl - fl.reshape(-1, 2).mean(0)
        wob.append(0.0 if prev_res is None else float(np.abs(res - prev_res).mean()))
        prev_res = res
    tr = np.array(tr)
    sm = np.stack([np.convolve(tr[:, j], np.ones(5) / 5, mode="same") for j in range(2)], 1)
    return np.hypot(*(tr - sm).T), np.array(wob), n
cache = {}
out = {}
for slot, (L, cands) in SLOTS.items():
    best = None
    for c in cands:
        if c not in cache: cache[c] = serie(c)
        hf, wob, n = cache[c]
        w = int((L + 0.6) * FPS)
        if n <= w: continue
        score = hf + 2.0 * wob
        for s in range(0, n - w):
            sc = float(score[s + int(0.3 * FPS): s + w - int(0.3 * FPS)].mean())
            if best is None or sc < best[0]:
                best = (sc, c, round(s / FPS, 2), float(hf[s:s + w].mean()), float(wob[s:s + w].mean()))
    out[slot] = {"toma": best[1], "desde": best[2], "largo": round(L + 0.6, 2), "score": round(best[0], 3), "hf": round(best[3], 3), "gelatina": round(best[4], 3)}
    print(slot, out[slot], flush=True)
json.dump(out, open("public/trabajos/2026-10-27_docba_r1-nov/datos/inserts_elegidos.json", "w"), indent=1)
