# Seguimiento de la cara de Ignacio en IMG_6977n (vertical 9:16, camina por la pasarela con cámara en mano),
# para que los planos cerrados y los zooms lo acompañen como un operador de cámara (pieza 5, "Vení, seguime").
# 10 cuadros por segundo, MediaPipe FaceDetector en 3 recortes cuadrados (el modelo trabaja a 128×128),
# se queda con la detección de más confianza.
# Salida: public/trabajos/<ID>/datos/seguimiento_IMG_6977n.json -> [[seg, cx, cy, alto], ...] (fracciones del cuadro)
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-06_volto_fashion-week/seguir_cara.py
import json
import subprocess
from pathlib import Path

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision

ID = "2026-10-06_volto_fashion-week"
CLIP = "IMG_6977n"
FPS = 10
ANCHO, ALTO = 540, 960  # mitad de 1080×1920
RECORTES = [0, 210, 420]  # y de cada recorte cuadrado de ANCHO×ANCHO (se superponen)

HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
det = vision.FaceDetector.create_from_options(
    vision.FaceDetectorOptions(base_options=BaseOptions(model_asset_path=HERR["modeloCaras"]), min_detection_confidence=0.5)
)
crudo = subprocess.run(
    [HERR["ffmpeg"], "-v", "error", "-i", str(Path("public/trabajos") / ID / "crudos" / f"{CLIP}.mp4"),
     "-vf", f"fps={FPS},scale={ANCHO}:{ALTO}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    capture_output=True, check=True,
).stdout
cuadros = np.frombuffer(crudo, np.uint8).reshape(-1, ALTO, ANCHO, 3)
puntos = []
for i, c in enumerate(cuadros):
    cajas = []
    for y0 in RECORTES:
        r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(c[y0:y0 + ANCHO])))
        cajas += [(d.categories[0].score, d.bounding_box.origin_x, y0 + d.bounding_box.origin_y, d.bounding_box.width, d.bounding_box.height)
                  for d in r.detections]
    if not cajas:
        continue
    _, x, y, w, h = max(cajas)
    puntos.append([round(i / FPS, 2), round((x + w / 2) / ANCHO, 3), round((y + h / 2) / ALTO, 3), round(h / ALTO, 3)])

print(f"{CLIP}: {len(puntos)}/{len(cuadros)} cuadros con cara")
destino = Path("public/trabajos") / ID / "datos" / f"seguimiento_{CLIP}.json"
destino.write_text(json.dumps(puntos, separators=(",", ":")), encoding="utf-8")
print("->", destino)
