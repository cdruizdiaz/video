"""Textura animada de la cara de Bloomie para el render 3D (Blender), con las caras del kit rock:
cada cuadro elige la cara de la coreografía (datos/coreografia.json → "caras"), le saca el naranja de la piel (así
queda solo lo dibujado: ojos, anteojos, boca, cejas) y la ubica sobre la caja de la cabeza con la misma convención que
src/rig/CaraTextura.tsx (cuadrado de la cabeza de frente + 6 % de margen). Al cambiar de cara hay un "pop".
Uso: python src/trabajos/2026-10-04_claudio_bloomie-rock/caras_rock.py → public/trabajos/<ID>/img/cara/f000.png…
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ID = "2026-10-04_claudio_bloomie-rock"
RAIZ = Path(__file__).resolve().parents[3]
IMG = RAIZ / "public/trabajos" / ID / "img"
LADO = 512
MARGEN = 0.06
POP = {"cuadros": 5, "escala": 0.14}  # al cambiar de cara: se agranda un 14 % y vuelve
TOL_PIEL = 34  # distancia de color (Lab) hasta la que un píxel es "piel" y se vuelve transparente
BORDE_FUERA = (0.98, 0.86)  # se descarta el contorno dibujado de la cabeza (fuera de esta elipse: ancho, alto)


def cargar(nombre):
    return cv2.imread(str(IMG / f"{nombre}.png"), cv2.IMREAD_UNCHANGED)


def sin_piel(img):
    """Quita la piel naranja y el contorno de la cabeza dibujada: queda solo la cara (con alfa)."""
    h, w = img.shape[:2]
    bgr, a = img[:, :, :3], img[:, :, 3].astype(np.float32) / 255
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    # color de piel = el más común entre los píxeles opacos de la mitad de abajo, fuera del centro
    zona = lab[int(h * 0.75):int(h * 0.88), int(w * 0.1):int(w * 0.3)].reshape(-1, 3)
    piel = np.median(zona, axis=0)
    d = np.linalg.norm(lab - piel, axis=2)
    alfa = np.clip((d - TOL_PIEL * 0.6) / (TOL_PIEL * 0.8), 0, 1)
    yy, xx = np.mgrid[0:h, 0:w]
    dentro = ((xx - w / 2) / (w / 2 * BORDE_FUERA[0])) ** 2 + ((yy - h / 2) / (h / 2 * BORDE_FUERA[1])) ** 2 < 1
    alfa = alfa * a * dentro
    return np.dstack([bgr, (cv2.GaussianBlur(alfa, (0, 0), 0.7) * 255).astype(np.uint8)])


def pegar(base, pieza, x0, y0, w, h):
    """Pega `pieza` (BGRA) escalada a w×h en (x0, y0) sobre `base` (BGRA), con alfa."""
    w, h = max(1, int(round(w))), max(1, int(round(h)))
    p = cv2.resize(pieza, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    x0, y0 = int(round(x0)), int(round(y0))
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(LADO, x0 + w), min(LADO, y0 + h)
    if xa >= xb or ya >= yb:
        return
    p = p[ya - y0:yb - y0, xa - x0:xb - x0]
    b = base[ya:yb, xa:xb].astype(np.float32) / 255
    ap, ab = p[:, :, 3:4], b[:, :, 3:4]
    ao = ap + ab * (1 - ap)
    rgb = (p[:, :, :3] * ap + b[:, :, :3] * ab * (1 - ap)) / np.maximum(ao, 1e-6)
    base[ya:yb, xa:xb] = (np.dstack([rgb, ao]) * 255).astype(np.uint8)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    coreo = json.loads((RAIZ / "public/trabajos" / ID / "datos/coreografia.json").read_text(encoding="utf-8"))
    piezas = json.loads((RAIZ / "public/personajes/bloomie/piezas.json").read_text(encoding="utf-8"))
    c = piezas["vistas"]["frente"]["cabeza"]["caja"]
    lado_pt = max(c[2] - c[0], c[3] - c[1]) * (1 + 2 * MARGEN)
    e = LADO / lado_pt
    cx, cy = (c[0] + c[2]) / 2, (c[1] + c[3]) / 2
    caja = ((c[0] - (cx - lado_pt / 2)) * e, (c[1] - (cy - lado_pt / 2)) * e, (c[2] - c[0]) * e, (c[3] - c[1]) * e)  # x, y, w, h px
    caras = {n: sin_piel(cargar(f"cara_{n}")) for n in {t["cara"] for t in coreo["caras"]}}
    anteojos = cargar("anteojos_rock")
    sal = IMG / "cara"
    sal.mkdir(parents=True, exist_ok=True)
    for f in sal.glob("*.png"):
        f.unlink()
    for k in range(coreo["duracion"]):
        tramo = next(t for t in coreo["caras"] if t["desde"] <= k < t["hasta"])
        local = k - tramo["desde"]
        s = 1 + POP["escala"] * max(0.0, 1 - local / POP["cuadros"]) * np.sin(min(1.0, local / POP["cuadros"]) * np.pi) if local < POP["cuadros"] else 1
        base = np.zeros((LADO, LADO, 4), np.uint8)
        x, y, w, h = caja
        pegar(base, caras[tramo["cara"]], x + w * (1 - s) / 2, y + h * (1 - s) / 2, w * s, h * s)
        if tramo.get("anteojos"):
            # anteojos de sol sobre los anteojos dibujados (97 % del ancho de la cara, a la altura de los ojos)
            aw = w * 0.97 * s
            ah = aw * anteojos.shape[0] / anteojos.shape[1]
            pegar(base, anteojos, x + w / 2 - aw / 2, y + h * 0.41 - ah / 2, aw, ah)
        cv2.imwrite(str(sal / f"f{k:03d}.png"), base)
    print(f"OK {coreo['duracion']} cuadros de cara → {sal.relative_to(RAIZ)} · caras {sorted(caras)}")


if __name__ == "__main__":
    main()
