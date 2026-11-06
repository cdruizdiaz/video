# Ubica el cartel del país arriba de las cabezas: mide con MediaPipe (FaceDetector) dónde empieza la cabeza (con pelo,
# gorro, cuernos) en cada toma del plan y agrega `y` (px, 1080x1920) a cada cartel de plan_ninos.json.
# Uso: python ubicar_carteles.py   (después de armar_plan_ninos.py y retoques_ninos.py)
import json, os, subprocess
import cv2, numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ID = "2026-10-29_cei_halloween"
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
MODELO = json.load(open(os.path.join(RAIZ, "scripts/herramientas.json"), encoding="utf-8"))["modeloCaras"]
PLAN = os.path.join(RAIZ, "src/trabajos", ID, "plan_ninos.json")
ALTO_CARTEL = 90  # px (letra 54 + relleno)
MARGEN = 30  # px de aire entre el cartel y la cabeza
PELO = 0.45  # alto de pelo sobre la cara detectada, en alturas de cara
PELO_ALTO = {"IMG_4590": 0.9, "IMG_4655": 0.95}  # sombrero de ala ancha y cuernos
Y_MAX, Y_MIN = 700, 130  # el cartel va pegado arriba de la cabeza (sin aire de más) pero nunca sobre ella

det = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(
    base_options=mpp.BaseOptions(model_asset_path=MODELO), min_detection_confidence=0.4))
plan = json.load(open(PLAN, encoding="utf-8"))


def cabeza_arriba(clip, t):
    r = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", os.path.join(RAIZ, "public/trabajos", ID, "crudos", clip + ".mp4"),
                        "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    img = cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_COLOR)
    if img is None: return None
    h = img.shape[0]
    res = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))
    pelo = PELO_ALTO.get(clip, PELO)
    tops = [b.bounding_box.origin_y - pelo * b.bounding_box.height for b in res.detections]
    return min(tops) * 1920 / h if tops else None


# arranques en pantalla de cada toma
t, tomas = plan["titulo"], []
for v in plan["video"]:
    tomas.append((t, t + v["dur"], v))
    t += v["dur"]
nuevos = []
for tag in plan["tags"]:
    for a, b, v in tomas:
        if a >= tag["desde"] - 0.01 and b <= tag["hasta"] + 0.01:
            tops = [x for x in (cabeza_arriba(v["clip"], v["ini"] + v["dur"] * f) for f in (0.1, 0.3, 0.5, 0.7, 0.9)) if x is not None]
            tope = min(tops) if tops else 9999
            y = int(max(Y_MIN, min(Y_MAX, tope - MARGEN - ALTO_CARTEL)))
            # un cartel por toma, cada uno a su altura (si dos tomas seguidas del mismo país dan casi lo mismo, se unen)
            if nuevos and nuevos[-1]["t"] == tag["t"] and abs(nuevos[-1]["y"] - y) < 12:
                nuevos[-1]["hasta"] = round(b, 3)
                nuevos[-1]["y"] = min(nuevos[-1]["y"], y)
            else:
                nuevos.append({"t": tag["t"], "desde": round(a, 3), "hasta": round(b, 3), "y": y})
            print(tag["t"], v["clip"], "cabeza más alta", int(tope), "-> cartel y", y)
# TODOS los carteles a la misma altura: la del cartel de la toma de China 2 (IMG_4568), la que pidió la cliente
y_fijo = next(x["y"] for x in nuevos if x["t"] == "CHINA" and x["desde"] > 3.5)
y_fijo -= 17  # el cartel grande (2026-10-30) es más alto: se sube para que su borde inferior quede igual
for x in nuevos: x["y"] = y_fijo
print("altura única de los carteles:", y_fijo)
plan["tags"] = nuevos
json.dump(plan, open(PLAN, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
