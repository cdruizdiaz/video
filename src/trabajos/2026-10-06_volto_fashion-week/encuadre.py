# Posición de la cara de Ignacio en los planos horizontales de la cám. B, para recortarlos a 9:16.
# Un cuadro por segundo, MediaPipe FaceDetector; se queda con la detección de más confianza
# (no la más grande: en 6972 hay un falso positivo fijo en x≈0,80, más grande que la cara).
# El modelo de corto alcance trabaja a 128×128: sobre el cuadro 16:9 entero la cara queda chica y
# no la encuentra (6966) o confunde otra cosa (6972); por eso se analiza en 3 recortes cuadrados.
# Salida: public/trabajos/<ID>/datos/encuadre.json -> { "IMG_6966": [[seg, cx, cy, alto], ...] }
#   cx, cy, alto en fracciones del cuadro (0-1). Sin cara: el segundo no aparece.
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-06_volto_fashion-week/encuadre.py
import json
import subprocess
from pathlib import Path

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision

ID = "2026-10-06_volto_fashion-week"
CLIPS = ["IMG_6966", "IMG_6969", "IMG_6972", "IMG_6980", "IMG_6981", "IMG_6982", "IMG_6983", "IMG_6987", "IMG_6988"]
ANCHO, ALTO = 1920, 1080
RECORTES = [0, 420, 840]  # x de cada recorte cuadrado de ALTO×ALTO (se superponen)

HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
crudos = Path("public/trabajos") / ID / "crudos"
det = vision.FaceDetector.create_from_options(
    vision.FaceDetectorOptions(base_options=BaseOptions(model_asset_path=HERR["modeloCaras"]), min_detection_confidence=0.5)
)

salida = {}
for clip in CLIPS:
    crudo = subprocess.run(
        [HERR["ffmpeg"], "-v", "error", "-i", str(crudos / f"{clip}.mp4"), "-vf", f"fps=1,scale={ANCHO}:{ALTO}",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True,
    ).stdout
    cuadros = np.frombuffer(crudo, np.uint8).reshape(-1, ALTO, ANCHO, 3)
    puntos = []
    for s, c in enumerate(cuadros):
        cajas = []
        for x0 in RECORTES:
            r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(c[:, x0:x0 + ALTO])))
            cajas += [(d.categories[0].score, x0 + d.bounding_box.origin_x, d.bounding_box.origin_y, d.bounding_box.width, d.bounding_box.height)
                      for d in r.detections]
        if not cajas:
            continue
        _, x, y, w, h = max(cajas)
        puntos.append([s, round((x + w / 2) / ANCHO, 3), round((y + h / 2) / ALTO, 3), round(h / ALTO, 3)])
    salida[clip] = puntos
    xs = [p[1] for p in puntos]
    print(f"{clip}: {len(puntos)}/{len(cuadros)} s con cara, cx mediana {np.median(xs):.3f} (min {min(xs):.2f}, max {max(xs):.2f})")

destino = Path("public/trabajos") / ID / "datos" / "encuadre.json"
destino.write_text(json.dumps(salida, separators=(",", ":")), encoding="utf-8")
print("->", destino)
