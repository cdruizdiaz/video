# Mide dónde está el rectángulo naranja del edificio (plano de "Reservá…", 18,57–21,8 s del video de la usuaria) y calcula el
# desplazamiento horizontal (px, en 1080) que lo mantiene centrado mientras se acerca el plano (la cámara en mano se corre ~2 % a
# la izquierda). Uso: python centrar_ultimo.py <zoom_final>   -> centro_ultimo.json {dx: [px por cuadro], zoom}
import json, os, subprocess, sys
import cv2, numpy as np
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
Z = float(sys.argv[1]) if len(sys.argv) > 1 else 0.10
DESDE, FIN = 18.5667, 21.8
r = subprocess.run([FF, "-v", "error", "-ss", str(DESDE), "-t", str(FIN - DESDE), "-i", os.path.join(RAIZ, "public/trabajos/2026-10-28_docba_r2-nov/crudos/r2_editado.mp4"),
                    "-vf", "fps=30,scale=540:960", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True)
fr = np.frombuffer(r.stdout, np.uint8).reshape(-1, 960, 540, 3)
c = []
for im in fr:
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    m = (hsv[..., 0] >= 3) & (hsv[..., 0] <= 18) & (hsv[..., 1] > 130) & (hsv[..., 2] > 150)
    x = np.where(m[int(0.12 * 960)])[0]
    c.append((x.min() + x.max()) / 2 / 540 if len(x) else np.nan)
c = np.array(c)
ok = ~np.isnan(c)
c[~ok] = np.interp(np.where(~ok)[0], np.where(ok)[0], c[ok])
k = np.ones(15) / 15
cs = np.convolve(np.pad(c, (7, 7), mode="edge"), k, mode="valid")  # promedio móvil: sin temblor
n = len(cs)
kz = 1 + Z * np.arange(n) / n  # escala del acercamiento en cada cuadro (la misma fórmula de Clip)
dx = (0.5 - cs) * kz * 1080  # px: deja el centro del rectángulo en el centro de la pantalla
json.dump({"zoom": Z, "n": n, "dx": [round(float(v), 1) for v in dx]}, open(os.path.join(os.path.dirname(__file__), "centro_ultimo.json"), "w"))
print("cuadros", n, "centro %.3f -> %.3f" % (cs[0], cs[-1]), "dx %.0f .. %.0f px" % (dx.min(), dx.max()))
