"""Hoja de fotogramas de fragmentos candidatos, para mirarlos ANTES de proponerlos.

Por cada fragmento saca 3 fotogramas (inicio, medio y fin) del proxy, mide nitidez, brillo y
caras (MediaPipe), y arma una hoja de contactos con las alertas escritas en cada fila.

Uso (desde la raíz del proyecto, con el Python del .venv):
  C:/Videos/_herramientas/.venv/Scripts/python.exe scripts/hoja_fragmentos.py <ID> [archivo.json]

  archivo.json: por defecto public/trabajos/<ID>/datos/candidatos.json (o clips.json si no existe).
  Formato (el mismo que clips.json):
    {"tomas": [{"clip": "IMG_2819", "desdeMs": 640, "hastaMs": 4100, "nota": "texto dicho"}, ...]}
  "clip" es el nombre del proxy en public/trabajos/<ID>/crudos/ (con o sin extensión).

Salida: out/<ID>/revision/fragmentos[_N].png (hasta 10 fragmentos por hoja) y un resumen por consola.
Leer primero el resumen; abrir la hoja solo para confirmar los fragmentos con alertas o elegir entre parecidos.

Alertas (relativas al propio material, porque cada cámara y luz dan valores distintos):
  DESENFOQUE  nitidez < 45 % de la mediana de la hoja
  OSCURO / QUEMADO  brillo medio < 55 o > 215 (0-255)
  SIN CARA  MediaPipe no encontró ninguna cara
  CARA CORTADA  la cara toca el borde del cuadro
"""
import json
import os
import statistics
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

os.environ.setdefault("GLOG_minloglevel", "2")  # silencia los avisos de MediaPipe/TFLite
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
sys.stdout.reconfigure(encoding="utf-8")

RAIZ = Path.cwd()
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
ALTO_MINI = 320  # alto de cada miniatura en la hoja
POR_HOJA = 10
UMBRAL_NITIDEZ = 0.45
BRILLO_MIN, BRILLO_MAX = 55, 215
MARGEN_CARA = 0.01  # fracción del cuadro que cuenta como "toca el borde"


def fotograma(video: Path, seg: float) -> Image.Image:
    salida = subprocess.run(
        [HERR["ffmpeg"], "-v", "error", "-ss", f"{seg:.3f}", "-i", str(video), "-frames:v", "1",
         "-f", "image2pipe", "-vcodec", "png", "-"],
        capture_output=True, check=True,
    ).stdout
    from io import BytesIO
    return Image.open(BytesIO(salida)).convert("RGB")


def nitidez(img: Image.Image) -> float:
    # Varianza del laplaciano sobre gris a 540 px de ancho (más alta = más nítido).
    g = img.convert("L")
    g = g.resize((540, round(540 * g.height / g.width)))
    a = np.asarray(g, dtype=np.float32)
    lap = a[1:-1, :-2] + a[1:-1, 2:] + a[:-2, 1:-1] + a[2:, 1:-1] - 4 * a[1:-1, 1:-1]
    return float(lap.var())


def detector_caras():
    try:
        from mediapipe.tasks.python import BaseOptions, vision
        opciones = vision.FaceDetectorOptions(
            base_options=BaseOptions(model_asset_path=HERR["modeloCaras"]), min_detection_confidence=0.5
        )
        return vision.FaceDetector.create_from_options(opciones)
    except Exception as e:  # sin MediaPipe la hoja igual sirve
        print(f"(MediaPipe no disponible: {e}; se omite la detección de caras)")
        return None


def caras(det, img: Image.Image):
    if det is None:
        return None
    import mediapipe as mp
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(img)))
    w, h = img.size
    res = []
    for d in r.detections:
        b = d.bounding_box
        cortada = (b.origin_x < w * MARGEN_CARA or b.origin_y < h * MARGEN_CARA
                   or b.origin_x + b.width > w * (1 - MARGEN_CARA) or b.origin_y + b.height > h * (1 - MARGEN_CARA))
        res.append({"cx": (b.origin_x + b.width / 2) / w, "cortada": cortada,
                    "caja": (b.origin_x, b.origin_y, b.width, b.height)})
    return res


def buscar_video(id_: str, clip: str) -> Path:
    carpeta = RAIZ / "public/trabajos" / id_ / "crudos"
    exacto = carpeta / clip
    if exacto.is_file():
        return exacto
    for f in sorted(carpeta.glob(f"{clip}.*")):
        return f
    sys.exit(f"No encuentro el proxy de '{clip}' en {carpeta}")


def fuente(tam: int):
    for f in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        if Path(f).exists():
            return ImageFont.truetype(f, tam)
    return ImageFont.load_default()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    id_ = sys.argv[1]
    datos = RAIZ / "public/trabajos" / id_ / "datos"
    entrada = Path(sys.argv[2]) if len(sys.argv) > 2 else (
        datos / "candidatos.json" if (datos / "candidatos.json").exists() else datos / "clips.json")
    tomas = json.loads(entrada.read_text(encoding="utf-8"))["tomas"]
    det = detector_caras()

    filas = []
    for i, t in enumerate(tomas, 1):
        video = buscar_video(id_, t["clip"])
        desde, hasta = t["desdeMs"] / 1000, t["hastaMs"] / 1000
        tiempos = [desde + 0.05, (desde + hasta) / 2, max(desde + 0.05, hasta - 0.1)]
        cuadros = []
        for s in tiempos:
            img = fotograma(video, s)
            cuadros.append({"s": s, "img": img, "nitidez": nitidez(img),
                            "brillo": float(np.asarray(img.convert("L")).mean()), "caras": caras(det, img)})
        filas.append({"n": i, "toma": t, "cuadros": cuadros})

    mediana = statistics.median(c["nitidez"] for f in filas for c in f["cuadros"]) or 1.0
    for f in filas:
        conteo = {}
        for c in f["cuadros"]:
            c["rel"] = c["nitidez"] / mediana
            a = []
            if c["rel"] < UMBRAL_NITIDEZ:
                a.append("DESENFOQUE")
            if c["brillo"] < BRILLO_MIN:
                a.append("OSCURO")
            if c["brillo"] > BRILLO_MAX:
                a.append("QUEMADO")
            if c["caras"] is not None:
                if not c["caras"]:
                    a.append("SIN CARA")
                elif any(x["cortada"] for x in c["caras"]):
                    a.append("CARA CORTADA")
            c["alertas"] = a
            for x in a:
                conteo[x] = conteo.get(x, 0) + 1
        n = len(f["cuadros"])
        f["alertas"] = [f"{x} {k}/{n}" for x, k in conteo.items()]

    # Resumen por consola (lo primero que hay que leer).
    print(f"{len(filas)} fragmentos de {entrada.relative_to(RAIZ) if entrada.is_relative_to(RAIZ) else entrada}"
          f" · nitidez relativa a la mediana ({mediana:.0f})")
    for f in filas:
        t = f["toma"]
        cx = [round(x["cx"], 2) for c in f["cuadros"] for x in (c["caras"] or [])[:1]]
        pos = f" · cara x={cx}" if cx else ""
        estado = "; ".join(f["alertas"]) if f["alertas"] else "OK"
        nit = "/".join(f"{c['rel']:.2f}" for c in f["cuadros"])
        bri = "/".join(f"{c['brillo']:.0f}" for c in f["cuadros"])
        print(f"  {f['n']:>2}. {t['clip']} {t['desdeMs'] / 1000:.1f}-{t['hastaMs'] / 1000:.1f}s · nitidez {nit}"
              f" · brillo {bri}{pos} · {estado}")

    # Hojas de contactos.
    revision = RAIZ / "out" / id_ / "revision"
    revision.mkdir(parents=True, exist_ok=True)
    f_tit, f_txt = fuente(22), fuente(18)
    for h in range(0, len(filas), POR_HOJA):
        grupo = filas[h:h + POR_HOJA]
        minis = [[c["img"].resize((round(c["img"].width * ALTO_MINI / c["img"].height), ALTO_MINI)) for c in f["cuadros"]]
                 for f in grupo]
        ancho_fila = sum(m.width for m in minis[0]) + 4 * 10
        alto_fila = ALTO_MINI + 70
        hoja = Image.new("RGB", (ancho_fila, alto_fila * len(grupo)), (24, 24, 24))
        dib = ImageDraw.Draw(hoja)
        for k, (f, fila) in enumerate(zip(grupo, minis)):
            y = k * alto_fila
            t = f["toma"]
            color = (255, 120, 90) if f["alertas"] else (140, 220, 140)
            dib.text((10, y + 6), f"{f['n']}. {t['clip']}  {t['desdeMs'] / 1000:.1f}-{t['hastaMs'] / 1000:.1f}s  "
                     f"{(t.get('nota') or '')[:70]}", fill=(235, 235, 235), font=f_tit)
            dib.text((10, y + 36), "; ".join(f["alertas"]) or "OK", fill=color, font=f_txt)
            x = 10
            for c, m in zip(f["cuadros"], fila):
                hoja.paste(m, (x, y + 64))
                esc = ALTO_MINI / c["img"].height
                for cara in c["caras"] or []:
                    bx, by, bw, bh = (v * esc for v in cara["caja"])
                    dib.rectangle([x + bx, y + 64 + by, x + bx + bw, y + 64 + by + bh],
                                  outline=(255, 80, 60) if cara["cortada"] else (80, 200, 255), width=2)
                etiqueta = f"{c['s']:.1f}s  n{c['rel']:.2f}"
                dib.rectangle(dib.textbbox((x + 6, y + 68), etiqueta, font=f_txt), fill=(0, 0, 0))
                dib.text((x + 6, y + 68), etiqueta, fill=(255, 255, 0), font=f_txt)
                x += m.width + 10
        nombre = "fragmentos.png" if len(filas) <= POR_HOJA else f"fragmentos_{h // POR_HOJA + 1}.png"
        hoja.save(revision / nombre)
        print(f"Hoja: out/{id_}/revision/{nombre}")


if __name__ == "__main__":
    main()
