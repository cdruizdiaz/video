# Posición de la cara de cada alumno (MediaPipe FaceDetector) en el tramo que se usa, para centrar los zooms.
# Salida: datos/encuadre.json -> { "<alumno>": { "cx": 0-1, "cy": 0-1, "alto": 0-1 } } (mediana de 5 cuadros)
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-15_cei_dia-de-la-madre/encuadre.py
import json
import subprocess
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision

ID = "2026-10-15_cei_dia-de-la-madre"
HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
base = Path("public/trabajos") / ID
# tramo usado de cada toma (s de video), de plan.json
PLAN = json.loads((Path("src/trabajos") / ID / "plan.json").read_text(encoding="utf-8"))
TRAMOS = {t["clip"]: (t["ini"], t["fin"]) for t in PLAN["tomas"]}

det = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(
    base_options=mpp.BaseOptions(model_asset_path=HERR["modeloCaras"]), min_detection_confidence=0.4))
salida = {}
for nombre, (ini, fin) in TRAMOS.items():
    cs = []
    for k in range(5):
        t = ini + (fin - ini) * (k + 0.5) / 5
        png = subprocess.run([HERR["ffmpeg"], "-v", "error", "-ss", f"{t:.2f}", "-i", str(base / "crudos" / f"{nombre}.mp4"),
                              "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        if not png:  # el tramo pasa del final del video (p. ej. Rosario: el audio dura más)
            continue
        img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            continue
        h, w = img.shape[:2]
        r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))
        caras = sorted(r.detections, key=lambda d: -d.bounding_box.width * d.bounding_box.height)
        if caras:
            b = caras[0].bounding_box
            cs.append(((b.origin_x + b.width / 2) / w, (b.origin_y + b.height / 2) / h, b.height / h))
    if cs:
        m = np.median(np.array(cs), axis=0)
        salida[nombre] = {"cx": round(float(m[0]), 3), "cy": round(float(m[1]), 3), "alto": round(float(m[2]), 3)}
    print(nombre, salida.get(nombre), f"({len(cs)}/5 cuadros)")
(base / "datos" / "encuadre.json").write_text(json.dumps(salida, indent=2), encoding="utf-8")
