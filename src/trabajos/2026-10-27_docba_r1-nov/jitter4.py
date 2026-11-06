# Ventana más firme de cualquier toma de Comida: python jitter4.py <toma, p. ej. 0131> [filtro de giro]
import cv2, subprocess, numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
import sys
W, H, FPS, L = 135, 240, 24, 1.9
TOMA, GIRO = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "transpose=2")
raw = subprocess.run([FF, "-v", "error", "-t", "21", "-i", f"C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara/Comida/C{TOMA}.MP4", "-vf", f"{GIRO},scale={W}:{H},format=gray,fps={FPS}", "-f", "rawvideo", "-"], capture_output=True).stdout
n = len(raw) // (W * H); fr = np.frombuffer(raw, np.uint8)[: n * W * H].reshape(n, H, W)
win = cv2.createHanningWindow((W, H), cv2.CV_32F); tr = [(0., 0.)]; wob = [0.]; prev = None
for i in range(1, n):
    (dx, dy), _ = cv2.phaseCorrelate(fr[i-1].astype(np.float32), fr[i].astype(np.float32), win); tr.append((dx, dy))
    fl = cv2.calcOpticalFlowFarneback(fr[i-1], fr[i], None, .5, 2, 15, 2, 5, 1.1, 0); res = fl - fl.reshape(-1, 2).mean(0)
    wob.append(0. if prev is None else float(np.abs(res - prev).mean())); prev = res
tr = np.array(tr); sm = np.stack([np.convolve(tr[:, j], np.ones(5)/5, mode="same") for j in range(2)], 1)
sc = np.hypot(*(tr - sm).T) + 2 * np.array(wob); w = int(L * FPS)
r = sorted((float(sc[s+7:s+w-7].mean()), round(s/FPS, 2)) for s in range(0, n - w, 3))[:5]
print(r)
