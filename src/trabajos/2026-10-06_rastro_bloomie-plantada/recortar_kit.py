"""Recorta el kit de expresiones de Bloomie (hoja de ChatGPT, subida x4 con Real-ESRGAN) en piezas PNG con alfa.

Hoja original: C:/Videos/crudos/<ID>/kit_plantada.png (2000×1000), grilla de 8 columnas:
  fila 1: 8 caras completas · fila 2: las mismas sin boca · fila 3: 8 bocas · fila 4: boca L, 4 pétalos, 2 destellos.
El fondo blanco se quita con un relleno desde el borde de cada celda (así el blanco de los ojos y los dientes queda),
con borde suave y los colores "des-mezclados" del blanco.
Uso: python src/trabajos/2026-10-06_rastro_bloomie-plantada/recortar_kit.py → public/trabajos/<ID>/img/kit/*.png
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ID = "2026-10-06_rastro_bloomie-plantada"
RAIZ = Path(__file__).resolve().parents[3]
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
HOJA = Path(HERR["carpetaCrudos"]) / ID / "kit_plantada_x4.png"
SAL = RAIZ / "public/trabajos" / ID / "img/kit"
X = 4  # escala de la hoja subida respecto de la original
COLUMNA = 249.5  # px de la hoja original
FILAS = {  # (desde, hasta) en y de la hoja original, sin los rótulos
    "caras": (55, 258),
    "ojos": (315, 515),
    "bocas": (595, 700),
    "extras": (755, 930),
}
CARAS = ["normal", "costado", "cansado", "triste", "esfuerzo", "asombro", "resignado", "alegria"]
BOCAS = ["cerrada", "mbp", "entreabierta", "e", "a", "o", "u", "f"]
EXTRAS = ["boca_l", "petalo_naranja_1", "petalo_naranja_2", "petalo_turquesa_1", "petalo_turquesa_2", "destello_1", "destello_2"]
TOL_FONDO = 38  # distancia al blanco (RGB) hasta la que un píxel es fondo
BORDE = 70  # distancia al blanco a partir de la cual el píxel es opaco
MARGEN = 10  # px alrededor del recorte


def guardar(ruta, img):
    """cv2.imwrite no acepta rutas con tildes ("Edición") en Windows: se codifica en memoria."""
    ok, buf = cv2.imencode(".png", img)
    if not ok:
        raise RuntimeError(f"no se pudo codificar {ruta}")
    buf.tofile(str(ruta))


def recortar(celda):
    bgr = celda.astype(np.float32)
    blanco = np.median(np.concatenate([bgr[0], bgr[-1], bgr[:, 0], bgr[:, -1]]), axis=0)
    dist = np.linalg.norm(bgr - blanco, axis=2)
    # fondo = lo casi blanco conectado con el borde de la celda
    casi = (dist < TOL_FONDO).astype(np.uint8)
    n, lab = cv2.connectedComponents(casi, connectivity=4)
    bordes = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fondo = np.isin(lab, list(bordes))
    alfa = np.where(fondo, np.clip((dist - TOL_FONDO * 0.4) / (BORDE - TOL_FONDO * 0.4), 0, 1), 1.0)
    # sacar motas sueltas (ruido de la subida de resolución)
    vis = (alfa > 0.5).astype(np.uint8)
    n, lab, est, _ = cv2.connectedComponentsWithStats(vis, connectivity=8)
    if n > 1:
        grande = est[1:, cv2.CC_STAT_AREA].max()
        for k in range(1, n):
            if est[k, cv2.CC_STAT_AREA] < grande * 0.004:
                alfa[lab == k] = 0
    a = alfa[..., None]
    color = np.where(a > 0.02, (bgr - (1 - a) * blanco) / np.maximum(a, 0.02), bgr)
    rgba = np.dstack([np.clip(color, 0, 255), alfa * 255]).astype(np.uint8)
    ys, xs = np.nonzero(alfa > 0.02)
    y0, y1 = max(0, ys.min() - MARGEN), min(rgba.shape[0], ys.max() + MARGEN + 1)
    x0, x1 = max(0, xs.min() - MARGEN), min(rgba.shape[1], xs.max() + MARGEN + 1)
    return rgba[y0:y1, x0:x1]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    hoja = cv2.imread(str(HOJA), cv2.IMREAD_COLOR)
    SAL.mkdir(parents=True, exist_ok=True)
    filas = {"caras": [f"cara_{n}" for n in CARAS], "ojos": [f"ojos_{n}" for n in CARAS], "bocas": [f"boca_{n}" for n in BOCAS], "extras": EXTRAS}
    for fila, nombres in filas.items():
        y0, y1 = FILAS[fila]
        for i, nombre in enumerate(nombres):
            x0, x1 = int(i * COLUMNA * X), int((i + 1) * COLUMNA * X)
            pieza = recortar(hoja[y0 * X:y1 * X, x0:x1])
            guardar(SAL / f"{nombre}.png", pieza)
            print(f"{nombre:20s} {pieza.shape[1]}×{pieza.shape[0]}")
    print(f"OK → {SAL.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
