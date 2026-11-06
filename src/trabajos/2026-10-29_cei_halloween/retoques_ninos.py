# (chicos) Endereza las tomas: mide la inclinación (líneas casi verticales/horizontales, Hough) y la luz media de
# cada tramo y agrega al plan.json  rot (grados), esc (escala para que no asomen bordes) y luz (brillo CSS).
# Uso: python retoques_ninos.py [plan_ninos.json | plan_entrevistas.json]   (después de armar_plan_*.py)
import json, math, os, subprocess
import cv2, numpy as np

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ID = "2026-10-29_cei_halloween"
PUB = os.path.join(RAIZ, "public/trabajos", ID, "crudos")
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
import sys
PLAN = os.path.join(RAIZ, "src/trabajos", ID, sys.argv[1] if len(sys.argv) > 1 else "plan_ninos.json")
CARAS = {"IMG_4655", "IMG_4562", "IMG_4621", "IMG_4680", "IMG_4699", "IMG_4586", "IMG_4581", "IMG_4616", "IMG_4624"}  # la medición da el tope (5°) por las líneas del grabado y no es una inclinación real: no se toca
ROT_MAX = 5.0  # grados
ROT_MIN = 0.6  # menos que esto no se corrige
LUZ_OBJETIVO = 112  # luma media (0-255) a la que se lleva lo oscuro
LUZ_MAX = 1.55
RATIO = 1920 / 1080


def cuadro(clip, t):
    r = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", os.path.join(PUB, clip + ".mp4"), "-frames:v", "1",
                        "-vf", "scale=540:960", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    return cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_COLOR)


def inclinacion(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    e = cv2.Canny(cv2.GaussianBlur(g, (5, 5), 0), 60, 160)
    ls = cv2.HoughLinesP(e, 1, np.pi / 360, threshold=60, minLineLength=140, maxLineGap=12)
    est, pesos = [], []
    if ls is None: return None
    for x1, y1, x2, y2 in ls[:, 0]:
        dx, dy = x2 - x1, y2 - y1
        largo = math.hypot(dx, dy)
        a = math.degrees(math.atan2(dx, dy))  # respecto de la vertical
        a = (a + 90) % 180 - 90
        if abs(a) < 10: est.append(a); pesos.append(largo)  # vertical inclinada: rotar +a
        h = math.degrees(math.atan2(dy, dx))
        h = (h + 90) % 180 - 90
        if abs(h) < 10: est.append(-h); pesos.append(largo * 0.7)  # horizontal inclinada: rotar -h
    if len(est) < 3: return None
    o = np.argsort(est); est = np.array(est)[o]; pesos = np.array(pesos)[o]
    c = np.cumsum(pesos)
    return float(est[np.searchsorted(c, c[-1] / 2)])  # mediana ponderada


plan = json.load(open(PLAN, encoding="utf-8"))
medidas = {}  # misma toma, misma inclinación (varios tramos del mismo clip)
for v in plan["video"] + plan.get("inserts", []):
    for k in ("rot", "esc", "luz"): v.pop(k, None)
    if v["clip"] not in medidas:
        ts = [v["ini"] + v["dur"] * f for f in (0.15, 0.5, 0.85)]
        ests = [x for x in (inclinacion(cuadro(v["clip"], t)) for t in ts) if x is not None]
        rot = float(np.median(ests)) if ests else 0.0
        medidas[v["clip"]] = 0.0 if v["clip"] in CARAS else max(-ROT_MAX, min(ROT_MAX, rot))
    rot = medidas[v["clip"]]
    if abs(rot) >= ROT_MIN:
        th = math.radians(abs(rot))
        v["rot"] = round(rot, 2)
        v["esc"] = round(math.cos(th) + math.sin(th) * RATIO + 0.01, 3)
for c, r_ in medidas.items(): print(c, "rot", round(r_, 2))
json.dump(plan, open(PLAN, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
