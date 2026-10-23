# Seguimiento de la cara de Nacho en las tomas con cámara en mano (IMG_7170–7177, IMG_7330), para que los planos
# cerrados (`seguir: true`) lo dejen encuadrado aunque la cámara se mueva. Adaptado de
# 2026-10-06_volto_fashion-week/seguir_cara.py: lee el video cuadro a cuadro (no todo a memoria: 7330 dura 5 min)
# y se queda con la cara MÁS GRANDE (el conductor también entra en cuadro, más lejos).
# 10 cuadros por segundo, MediaPipe FaceDetector en 3 recortes cuadrados (el modelo trabaja a 128×128).
# Salida: public/trabajos/<ID>/datos/seguimiento_<clip>.json -> [[seg, cx, cy, alto], ...] (fracciones del cuadro)
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-19_volto_radio/seguir_cara.py <clip> [...]
import json
import subprocess
import sys
from pathlib import Path

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision

ID = "2026-10-19_volto_radio"
FPS = 10
ANCHO, ALTO = 540, 960  # mitad de 1080×1920
RECORTES = [0, 210, 420]  # y de cada recorte cuadrado de ANCHO×ANCHO (se superponen)

HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
det = vision.FaceDetector.create_from_options(
    vision.FaceDetectorOptions(base_options=BaseOptions(model_asset_path=HERR["modeloCaras"]), min_detection_confidence=0.5)
)

for clip in sys.argv[1:]:
    proc = subprocess.Popen(
        [HERR["ffmpeg"], "-v", "error", "-i", str(Path("public/trabajos") / ID / "crudos" / f"{clip}.mp4"),
         "-vf", f"fps={FPS},scale={ANCHO}:{ALTO}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE,
    )
    puntos, i = [], 0
    while True:
        b = proc.stdout.read(ANCHO * ALTO * 3)
        if len(b) < ANCHO * ALTO * 3:
            break
        c = np.frombuffer(b, np.uint8).reshape(ALTO, ANCHO, 3)
        cajas = []
        for y0 in RECORTES:
            r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(c[y0:y0 + ANCHO])))
            cajas += [(d.bounding_box.height, d.bounding_box.origin_x, y0 + d.bounding_box.origin_y,
                       d.bounding_box.width) for d in r.detections]
        if cajas:
            h, x, y, w = max(cajas)
            puntos.append([round(i / FPS, 2), round((x + w / 2) / ANCHO, 3), round((y + h / 2) / ALTO, 3), round(h / ALTO, 3)])
        i += 1
    proc.wait()
    destino = Path("public/trabajos") / ID / "datos" / f"seguimiento_{clip}.json"
    destino.write_text(json.dumps(puntos, separators=(",", ":")), encoding="utf-8")
    print(f"{clip}: {len(puntos)}/{i} cuadros con cara -> {destino}")
