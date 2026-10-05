"""Recorte de personas de un video (MediaPipe Image Segmenter, selfie_multiclass): para poner texto, gráficos o un
personaje DETRÁS de la persona (efecto "texto detrás", personaje que pasa por detrás de alguien).

Uso (Python del .venv):
  python scripts/mascaras.py <video> <salida_persona.webm> [--mascara salida_mascara.mp4] [--borde 2] [--umbral 0.5]
         [--desde s --hasta s] [--suavizado 0.35] [--ancho 720]

Salida:
  <salida_persona.webm>  la persona sola con transparencia (VP9 con alfa): en Remotion va ENCIMA de la capa que
                         tiene que quedar detrás (<OffthreadVideo transparent>, ver src/plantillas/comunes/DetrasDePersona.tsx).
  --mascara              además, la máscara en blanco y negro (blanco = persona), por si se quiere usar en ffmpeg.
Opciones:
  --borde 2      px de desenfoque del borde (más suave: pelo, ropa con movimiento)
  --umbral 0.5   confianza mínima de "persona" (más alto = recorte más ajustado)
  --suavizado    mezcla con la máscara del cuadro anterior (0 = nada; quita el parpadeo del borde)
  --ancho 720    ancho al que se analiza (la máscara se escala al tamaño del video)
"""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision

RAIZ = Path(__file__).resolve().parents[1]
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
MODELO = Path(HERR["modeloCaras"]).parent / "selfie_multiclass_256x256.tflite"


def opcion(args, n, d=None, tipo=float):
    return tipo(args[args.index(n) + 1]) if n in args else d


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    con_valor = ("--mascara", "--borde", "--umbral", "--desde", "--hasta", "--suavizado", "--ancho")
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and not (i > 0 and args[i - 1] in con_valor)]
    if len(pos) < 2:
        print(__doc__)
        sys.exit(1)
    video, salida = pos[0], pos[1]
    mascara_sal = opcion(args, "--mascara", None, str)
    borde = opcion(args, "--borde", 2.0)
    umbral = opcion(args, "--umbral", 0.5)
    desde = opcion(args, "--desde", 0.0)
    hasta = opcion(args, "--hasta", None)
    suav = opcion(args, "--suavizado", 0.35)
    ancho_an = int(opcion(args, "--ancho", 720))

    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    ini = int(round(desde * fps))
    fin = int(round(hasta * fps)) if hasta else int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.set(cv2.CAP_PROP_POS_FRAMES, ini)

    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=BaseOptions(model_asset_path=str(MODELO)), running_mode=vision.RunningMode.VIDEO,
        output_confidence_masks=True, output_category_mask=False))

    # ffmpeg recibe los cuadros RGBA por un pipe y escribe el VP9 con alfa (y la máscara si se pide)
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    cmd = [HERR["ffmpeg"], "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", f"{fps}", "-i", "-",
           "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "8",
           "-auto-alt-ref", "0", salida]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    enc_m = None
    if mascara_sal:
        enc_m = subprocess.Popen([HERR["ffmpeg"], "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", f"{fps}",
                                  "-i", "-", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", mascara_sal], stdin=subprocess.PIPE)

    anterior = None
    n = 0
    cobertura = []
    k = ini
    while k < fin:
        ok, cuadro = cap.read()
        if not ok:
            break
        esc = ancho_an / W if W > ancho_an else 1
        chico = cv2.resize(cuadro, (int(W * esc), int(H * esc))) if esc != 1 else cuadro
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(chico, cv2.COLOR_BGR2RGB))
        r = seg.segment_for_video(img, int(n * 1000 / fps))
        fondo = r.confidence_masks[0].numpy_view()  # categoría 0 = fondo
        persona = 1.0 - fondo
        if anterior is not None and suav > 0:
            persona = persona * (1 - suav) + anterior * suav
        anterior = persona
        # umbral suave alrededor de --umbral (borde de ~0,15 de confianza) + desenfoque del borde
        m = np.clip((persona - (umbral - 0.075)) / 0.15, 0, 1)
        m = cv2.resize(m.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)
        if borde > 0:
            m = cv2.GaussianBlur(m, (0, 0), borde)
        a = (m * 255).astype(np.uint8)
        cobertura.append(float(a.mean()) / 255)
        bgra = np.dstack([cuadro, a])
        enc.stdin.write(bgra.tobytes())
        if enc_m:
            enc_m.stdin.write(a.tobytes())
        n += 1
        k += 1
    cap.release()
    enc.stdin.close()
    enc.wait()
    if enc_m:
        enc_m.stdin.close()
        enc_m.wait()
    c = np.array(cobertura) if cobertura else np.zeros(1)
    print(f"OK {salida} · {n} cuadros {W}×{H} · persona {c.mean() * 100:.0f} % del cuadro (mín {c.min() * 100:.0f} %, máx {c.max() * 100:.0f} %)"
          + (f" · máscara {mascara_sal}" if mascara_sal else ""))


if __name__ == "__main__":
    main()
