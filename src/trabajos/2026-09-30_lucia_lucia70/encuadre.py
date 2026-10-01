"""Calcula el encuadre de cada toma de datos/clips.json siguiendo a la niña de la guitarra por su remera roja.

La niña está a contraluz y su cara es muy chica (original 640×480): MediaPipe no la encuentra, así que
se siguen los píxeles rojos de la remera. Por toma: un zoom fijo y un centro
(cx, cy) que sigue a la remera, suavizado, con un punto cada 0,2 s (la cámara se mueve a pulso).
  zoom (por toma, en clips.json): lo elige el montaje (plano abierto o cercano); por defecto ZOOM_POR_DEFECTO.
cx, cy son fracciones del cuadro 4:3 completo: la plantilla MontajeMusical lo recorre entero con
anchoFuente = 2560 (composiciones.ts) y deja cy a 0,36 del alto de salida (ANCLA_Y).

Uso (desde la raíz del proyecto):
  C:/Videos/_herramientas/.venv/Scripts/python.exe src/trabajos/2026-09-30_lucia_lucia70/encuadre.py [--seguir <desdeS> <hastaS>]
  --seguir: solo imprime el seguimiento de ese tramo del clip (para elegir las tomas), sin escribir nada.
Salida: public/trabajos/<ID>/datos/encuadre.json  {"<clip>@<desdeMs>": {"zoom", "puntos": [{ms, cx, cy}]}}
"""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

ID = "2026-09-30_lucia_lucia70"
RAIZ = Path.cwd()
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
CRUDOS = RAIZ / "public/trabajos" / ID / "crudos"
DATOS = RAIZ / "public/trabajos" / ID / "datos"

FPS_MUESTRA = 5
AN, AL = 320, 240  # tamaño de análisis (el original es 640×480)
# remera roja en HSV de OpenCV (tono 0-180): rojo puro y saturado (la puerta de madera es naranja, tono ~12)
TONO_ROJO, SATURACION_MIN, VALOR_MIN = 6, 150, 90
ZONA_BAJA = 0.85  # por debajo de esta altura no se busca
PIXELES_MIN = 12  # px de análisis
VENTANA = 36  # px de análisis alrededor de la posición anterior
ZOOM_POR_DEFECTO = 1.4  # si la toma no trae "zoom"; más de ~1,7 sobre 640×480 se ve demasiado blando
SUBE_CENTRO = 0.0  # corrimiento del centro respecto de la remera, en altos de remera (positivo = hacia la cara)
PASO_MS = 200
SUAVIZADO = 5  # muestras (a 5 por segundo) de la media móvil
MARGEN_MS = 600


def cuadros(video: Path, desde_s: float, hasta_s: float):
    cmd = [HERR["ffmpeg"], "-v", "error", "-ss", f"{desde_s:.3f}", "-t", f"{hasta_s - desde_s:.3f}", "-i", str(video),
           "-vf", f"fps={FPS_MUESTRA},scale={AN}:{AL}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    tam, i = AN * AL * 3, 0
    while True:
        b = p.stdout.read(tam)
        if len(b) < tam:
            break
        yield desde_s + i / FPS_MUESTRA, np.frombuffer(b, np.uint8).reshape(AL, AN, 3)
        i += 1
    p.wait()


def remera(img, previa):
    """Caja (x, y, w, h en fracciones del cuadro) de la remera: los píxeles rojos alrededor de la posición anterior."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    h, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    mascara = ((h < TONO_ROJO) | (h > 180 - TONO_ROJO)) & (sat > SATURACION_MIN) & (val > VALOR_MIN)
    mascara[int(AL * ZONA_BAJA):] = False  # abajo está el mantel rosa de la mesa
    ys, xs = np.nonzero(mascara)
    if len(xs) < PIXELES_MIN:
        return None
    if previa is None:
        cx, cy = np.median(xs), np.median(ys)
    else:
        cx, cy = (previa[0] + previa[2] / 2) * AN, (previa[1] + previa[3] / 2) * AL
    for _ in range(4):  # la ventana se va centrando en la mancha
        cerca = (np.abs(xs - cx) < VENTANA) & (np.abs(ys - cy) < VENTANA)
        if cerca.sum() < PIXELES_MIN:
            return None if previa is None else previa
        cx, cy = xs[cerca].mean(), ys[cerca].mean()
    x0, x1 = np.percentile(xs[cerca], [5, 95])
    y0, y1 = np.percentile(ys[cerca], [5, 95])
    return (x0 / AN, y0 / AL, (x1 - x0) / AN, (y1 - y0) / AL)


def seguir(video: Path, desde_s: float, hasta_s: float):
    previa, res = None, []
    for t, img in cuadros(video, desde_s, hasta_s):
        caja = remera(img, previa)
        if caja:
            previa = caja
            res.append((t, caja))
    return res


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--seguir":
        video = sorted(CRUDOS.glob("*.mp4"))[0]
        for t, (x, y, w, h) in seguir(video, float(sys.argv[2]), float(sys.argv[3])):
            print(f"{t:7.1f}s  centro {x + w / 2:.3f},{y + h / 2:.3f}  remera {w:.3f}×{h:.3f}")
        return

    tomas = json.loads((DATOS / "clips.json").read_text(encoding="utf-8"))["tomas"]
    res = {}
    for t in tomas:
        video = CRUDOS / f'{t["clip"]}.mp4'
        pista = seguir(video, max(0, (t["desdeMs"] - MARGEN_MS) / 1000), (t["hastaMs"] + MARGEN_MS) / 1000)
        ts, cxs, cys, anchos = [], [], [], []
        for seg, (x, y, w, h) in pista:
            ts.append(seg * 1000)
            cxs.append(x + w / 2)
            cys.append(y + h / 2 - SUBE_CENTRO * h)
            anchos.append(w)
        zoom = t.get("zoom", ZOOM_POR_DEFECTO)
        k = SUAVIZADO // 2
        media = lambda v: [float(np.mean(v[max(0, i - k): i + k + 1])) for i in range(len(v))]
        cxs, cys = media(cxs), media(cys)
        puntos = [{"ms": ms, "cx": round(float(np.interp(ms, ts, cxs)), 4), "cy": round(float(np.interp(ms, ts, cys)), 4)}
                  for ms in range(t["desdeMs"], t["hastaMs"] + PASO_MS, PASO_MS)]
        clave = f'{t["clip"]}@{t["desdeMs"]}'
        res[clave] = {"zoom": round(zoom, 3), "puntos": puntos}
        print(f"{clave}: zoom {zoom:.2f} · remera {np.median(anchos):.2f} del ancho · "
              f"cx {min(p['cx'] for p in puntos):.2f}-{max(p['cx'] for p in puntos):.2f} · "
              f"cy {min(p['cy'] for p in puntos):.2f}-{max(p['cy'] for p in puntos):.2f} · {len(ts)} muestras")
    (DATOS / "encuadre.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
