"""Detecta caras en los proxies del trabajo (MediaPipe FaceDetector, blaze_face_short_range).

El modelo de corto alcance no ve caras chicas a cuadro completo (planos abiertos del jardín), así que
además del cuadro entero se pasa por mosaicos solapados y se unen las detecciones (NMS).

Uso (desde la raíz del proyecto):
  C:/Videos/_herramientas/.venv/Scripts/python.exe src/trabajos/2026-09-29_claudio_musica/detectar_caras.py [clip ...]
  Sin clips procesa todos los proxies; con clips (nombres sin extensión) procesa solo esos y los suma a caras.json.

Salida: public/trabajos/<ID>/datos/caras.json
  {"<clip>": {"ancho": 1080, "alto": 1920, "muestras": [{"t": 0.0, "caras": [{"x","y","w","h","p"}]}]}}
  x, y, w, h en fracciones del cuadro (x, y = esquina superior izquierda).
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np

os.environ.setdefault("GLOG_minloglevel", "2")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
sys.stdout.reconfigure(encoding="utf-8")

ID = "2026-09-29_claudio_musica"
FPS_MUESTRA = 2
ANCHO_ANALISIS = 540  # se analiza a la mitad de resolución
LADO_MOSAICO = 270  # mosaicos cuadrados de 270 px con 50 % de solape
CONFIANZA = 0.55
IOU_UNION = 0.3

RAIZ = Path.cwd()
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
CRUDOS = RAIZ / "public/trabajos" / ID / "crudos"
SALIDA = RAIZ / "public/trabajos" / ID / "datos/caras.json"


def detector():
    from mediapipe.tasks.python import BaseOptions, vision
    op = vision.FaceDetectorOptions(
        base_options=BaseOptions(model_asset_path=HERR["modeloCaras"]), min_detection_confidence=CONFIANZA
    )
    return vision.FaceDetector.create_from_options(op)


def cuadros(video: Path, alto: int):
    """Genera (t, imagen RGB uint8) a FPS_MUESTRA, escalado a ANCHO_ANALISIS."""
    cmd = [HERR["ffmpeg"], "-v", "error", "-i", str(video), "-vf",
           f"fps={FPS_MUESTRA},scale={ANCHO_ANALISIS}:{alto}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    tam = ANCHO_ANALISIS * alto * 3
    i = 0
    while True:
        b = p.stdout.read(tam)
        if len(b) < tam:
            break
        yield i / FPS_MUESTRA, np.frombuffer(b, np.uint8).reshape(alto, ANCHO_ANALISIS, 3)
        i += 1
    p.wait()


def detectar(det, img):
    import mediapipe as mp
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img)))
    return [(d.bounding_box.origin_x, d.bounding_box.origin_y, d.bounding_box.width, d.bounding_box.height,
             d.categories[0].score) for d in r.detections]


def iou(a, b):
    ax2, ay2, bx2, by2 = a[0] + a[2], a[1] + a[3], b[0] + b[2], b[1] + b[3]
    iw, ih = max(0, min(ax2, bx2) - max(a[0], b[0])), max(0, min(ay2, by2) - max(a[1], b[1]))
    inter = iw * ih
    return inter / (a[2] * a[3] + b[2] * b[3] - inter + 1e-9)


def caras_en(det, img):
    h, w = img.shape[:2]
    todas = detectar(det, img)
    paso = LADO_MOSAICO // 2
    for y0 in range(0, h - LADO_MOSAICO + 1, paso):
        for x0 in range(0, w - LADO_MOSAICO + 1, paso):
            for x, y, cw, ch, p in detectar(det, img[y0:y0 + LADO_MOSAICO, x0:x0 + LADO_MOSAICO]):
                todas.append((x + x0, y + y0, cw, ch, p))
    todas.sort(key=lambda c: -c[4])
    finales = []
    for c in todas:
        if all(iou(c, f) < IOU_UNION for f in finales):
            finales.append(c)
    return [{"x": round(x / w, 4), "y": round(y / h, 4), "w": round(cw / w, 4), "h": round(ch / h, 4),
             "p": round(p, 3)} for x, y, cw, ch, p in finales]


def main():
    det = detector()
    elegidos = set(sys.argv[1:])
    res = json.loads(SALIDA.read_text(encoding="utf-8")) if elegidos and SALIDA.exists() else {}
    for video in sorted(CRUDOS.glob("*.mp4")):
        if elegidos and video.stem not in elegidos:
            continue
        info = json.loads(subprocess.run(
            [HERR["ffprobe"], "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
             "-of", "json", str(video)], capture_output=True, check=True).stdout)["streams"][0]
        alto = round(ANCHO_ANALISIS * info["height"] / info["width"] / 2) * 2
        muestras = [{"t": t, "caras": caras_en(det, img)} for t, img in cuadros(video, alto)]
        con = sum(1 for m in muestras if m["caras"])
        print(f"{video.stem}: {len(muestras)} muestras, {con} con caras")
        res[video.stem] = {"ancho": info["width"], "alto": info["height"], "muestras": muestras}
    SALIDA.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
    print(f"-> {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
