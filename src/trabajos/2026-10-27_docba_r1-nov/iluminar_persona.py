# Sube la luz de la persona (no del fondo) en un proxy: máscara de MediaPipe (selfie_multiclass) suavizada en el tiempo,
# gamma + ganancia solo sobre ella (afecta más a las sombras, así la cara se abre sin quemar), un toque tibio y borde con
# difuminado amplio para que parezca luz natural. Uso: python iluminar_persona.py <entrada.mp4> <salida.mp4> [--fuerza 1.0]
import json, subprocess, sys
from pathlib import Path
import cv2, numpy as np, mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision
RAIZ = Path(__file__).resolve().parents[3]
H_ = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
MODELO = Path(H_["modeloCaras"]).parent / "selfie_multiclass_256x256.tflite"
import os
GAMMA, GANANCIA, TIBIO = float(os.environ.get("GAMMA", 0.80)), float(os.environ.get("GANANCIA", 1.07)), (0.985, 1.0, 1.02)  # (b, g, r) multiplicadores
ent, sal = sys.argv[1], sys.argv[2]
k = float(sys.argv[sys.argv.index("--fuerza") + 1]) if "--fuerza" in sys.argv else 1.0
cap = cv2.VideoCapture(ent)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=str(MODELO)), running_mode=vision.RunningMode.VIDEO,
    output_confidence_masks=True, output_category_mask=False))
enc = subprocess.Popen([H_["ffmpeg"], "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", f"{fps}", "-i", "-",
    "-an", "-c:v", "libx264", "-crf", "14", "-preset", "veryfast", "-g", "30", "-pix_fmt", "yuv420p",
    "-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709", sal], stdin=subprocess.PIPE)
ant, n = None, 0
while True:
    ok, fr = cap.read()
    if not ok: break
    chico = cv2.resize(fr, (360, int(360 * H / W)))
    r = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(chico, cv2.COLOR_BGR2RGB)), int(n * 1000 / fps))
    m = 1.0 - r.confidence_masks[0].numpy_view()
    m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.5)
    if ant is not None: m = m * 0.35 + ant * 0.65  # suavizado en el tiempo: la máscara no parpadea
    ant = m
    m = cv2.resize(np.clip((m - 0.45) / 0.35, 0, 1).astype(np.float32), (W, H))
    # el borde se mete 9 px hacia adentro de la persona (si no, la luz se derrama sobre el fondo y queda un halo "fantasma") y
    # cae despacio hacia el borde
    m = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))
    m = cv2.GaussianBlur(m, (0, 0), 9)[..., None] * k
    x = fr.astype(np.float32) / 255
    lev = np.clip(x ** GAMMA * GANANCIA * np.array(TIBIO, np.float32), 0, 1)
    lev = lev / (1 + 0.15 * np.clip(lev - 0.85, 0, 1) * 4)  # no empuja las altas luces
    out = x * (1 - m) + lev * m
    enc.stdin.write((np.clip(out, 0, 1) * 255).astype(np.uint8).tobytes())
    n += 1
enc.stdin.close(); enc.wait()
print("OK", sal, n, "cuadros")
