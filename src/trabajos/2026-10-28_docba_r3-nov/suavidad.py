# Mide la suavidad de una toma de Inserts cámara: aceleración del movimiento global (diferencia segunda de la traslación por
# correlación de fase) y "gelatina" (flujo óptico residual). Imprime las mejores ventanas de L s y guarda una hoja con 4 cuadros de cada una.
# Uso: python suavidad.py <Carpeta> <toma> [L] [hasta_s]
import cv2, subprocess, sys, numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
BASE = "C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara"
carpeta, toma = sys.argv[1], sys.argv[2]
L = float(sys.argv[3]) if len(sys.argv) > 3 else 1.6
hasta = sys.argv[4] if len(sys.argv) > 4 else "30"
src = f"{BASE}/{carpeta}/{toma}.MP4"
W, H, FPS = 135, 240, 24
raw = subprocess.run([FF, "-v", "error", "-t", hasta, "-i", src, "-vf", f"transpose=2,scale={W}:{H},format=gray,fps={FPS}", "-f", "rawvideo", "-"], capture_output=True).stdout
n = len(raw) // (W * H); fr = np.frombuffer(raw, np.uint8)[: n * W * H].reshape(n, H, W)
win = cv2.createHanningWindow((W, H), cv2.CV_32F); tr = [(0., 0.)]; wob = [0.]; prev = None
for i in range(1, n):
    (dx, dy), _ = cv2.phaseCorrelate(fr[i - 1].astype(np.float32), fr[i].astype(np.float32), win); tr.append((dx, dy))
    fl = cv2.calcOpticalFlowFarneback(fr[i - 1], fr[i], None, .5, 2, 15, 2, 5, 1.1, 0); res = fl - fl.reshape(-1, 2).mean(0)
    wob.append(0. if prev is None else float(np.abs(res - prev).mean())); prev = res
tr = np.array(tr); acc = np.hypot(*np.diff(tr, 2, axis=0).T); acc = np.concatenate([[0, 0], acc]); w = int(L * FPS)
r = sorted((float(acc[s + 3:s + w - 3].mean() + 2 * np.mean(wob[s + 3:s + w - 3])), round(s / FPS, 2)) for s in range(0, max(1, n - w), 2))[:4]
print(toma, [(round(a, 2), t) for a, t in r])
