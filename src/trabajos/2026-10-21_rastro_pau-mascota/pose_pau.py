# Pose de Pau cuadro a cuadro (MediaPipe PoseLandmarker, modo video) en los clips donde aparece Bloomie:
#   IMG_9053 (Bloomie parado en la palma de su mano derecha, a la izquierda de la imagen)
#   IMG_9054 (Bloomie sentado en su hombro izquierdo, a la derecha de la imagen)
# Salida: public/trabajos/<ID>/datos/pose_<clip>.json -> { fps, puntos: { "<n>": [[x, y, vis] | null, ...] } }
# en px del proxy 1080×1920. Puntos: 0 nariz, 11/12 hombros izq/der, 16 muñeca der, 18 meñique der, 20 índice der.
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-21_rastro_pau-mascota/pose_pau.py
import json
import subprocess
from pathlib import Path

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision

ID = "2026-10-21_rastro_pau-mascota"
CLIPS = ["IMG_9053", "IMG_9054"]
PUNTOS = [0, 11, 12, 16, 18, 20]
ANCHO, ALTO = 540, 960  # análisis a la mitad
FPS = 30

HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
MODELO = Path(HERR["modeloCaras"]).parent / "pose_landmarker_full.task"

for clip in CLIPS:
    crudo = subprocess.run(
        [HERR["ffmpeg"], "-v", "error", "-i", str(Path("public/trabajos") / ID / "crudos" / f"{clip}.mp4"),
         "-vf", f"scale={ANCHO}:{ALTO}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True,
    ).stdout
    cuadros = np.frombuffer(crudo, np.uint8).reshape(-1, ALTO, ANCHO, 3)
    det = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODELO)), running_mode=vision.RunningMode.VIDEO, num_poses=1))
    salida = {str(p): [] for p in PUNTOS}
    for i, c in enumerate(cuadros):
        r = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(c)), int(i * 1000 / FPS))
        for p in PUNTOS:
            if r.pose_landmarks:
                l = r.pose_landmarks[0][p]
                salida[str(p)].append([round(l.x * 1080, 1), round(l.y * 1920, 1), round(l.visibility, 2)])
            else:
                salida[str(p)].append(None)
    det.close()
    destino = Path("public/trabajos") / ID / "datos" / f"pose_{clip}.json"
    destino.write_text(json.dumps({"fps": FPS, "puntos": salida}), encoding="utf-8")
    print(f"OK {destino} · {len(cuadros)} cuadros")
