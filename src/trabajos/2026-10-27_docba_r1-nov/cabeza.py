# Sigue la cabeza de la chica en un clip (MediaPipe FaceDetector) para ubicar un texto arriba de ella.
# Uso: python cabeza.py <clip_proxy.mp4> <desde_s> <dur_s> <salida.json>
# Salida: {desdeS, fps, x: [px], top: [px]} en 1080x1920, un valor por cuadro; top = alto de la cabeza con pelo.
import json, subprocess, sys, os
import cv2, numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
MODELO = json.load(open(os.path.join(RAIZ, "scripts/herramientas.json"), encoding="utf-8"))["modeloCaras"]
PELO = 0.55  # alto de pelo sobre la cara detectada, en alturas de cara
VENTANA = 9  # cuadros del promedio móvil (el texto flota cerca de la cabeza, sin temblar con el paso)
clip, desde, dur, salida = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
w, h = 540, 960
r = subprocess.run([FF, "-v", "error", "-ss", str(desde), "-t", str(dur), "-i", clip, "-vf", f"fps=30,scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
cuadros = np.frombuffer(r.stdout, np.uint8).reshape(-1, h, w, 3)
det = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(base_options=mpp.BaseOptions(model_asset_path=MODELO), min_detection_confidence=0.35))
xs, tops = [], []
for c in cuadros:
    res = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(c)))
    if res.detections:
        b = max(res.detections, key=lambda d: d.bounding_box.width).bounding_box
        xs.append((b.origin_x + b.width / 2) * 2)
        tops.append((b.origin_y - PELO * b.height) * 2)
    else:
        xs.append(np.nan); tops.append(np.nan)
xs, tops = np.array(xs), np.array(tops)
print("cuadros", len(cuadros), "sin cara", int(np.isnan(xs).sum()))
idx = np.arange(len(xs))
for a in (xs, tops):
    ok = ~np.isnan(a)
    a[~ok] = np.interp(idx[~ok], idx[ok], a[ok])
def suave(a):
    k = np.ones(VENTANA) / VENTANA
    p = np.pad(a, (VENTANA // 2, VENTANA // 2), mode="edge")
    return np.convolve(p, k, mode="valid")
xs, tops = suave(xs), suave(tops)
json.dump({"desdeS": desde, "fps": 30, "x": [round(float(v), 1) for v in xs], "top": [round(float(v), 1) for v in tops]}, open(salida, "w"))
print("x", int(xs.min()), int(xs.max()), "top", int(tops.min()), int(tops.max()))
