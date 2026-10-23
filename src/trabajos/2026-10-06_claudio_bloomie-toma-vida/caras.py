"""Textura animada de la cara de Bloomie para el render 3D (Blender), con las caras del kit del diseñador.
Cada cuadro elige la cara de la coreografía (datos/coreografia.json → "caras"), la escala para que la distancia entre
los ojos sea la del rig y la centra en los ojos del rig (piezas.json → vistas.frente.rostro.ojos); encima van los
anteojos de la vista de frente del kit, alineados con los mismos ojos. Mismo cuadro que src/rig/CaraTextura.tsx
(cuadrado de la cabeza de frente + 6 % de margen). Al cambiar a una cara con "pop" se agranda un instante.
Uso: python src/trabajos/2026-10-06_claudio_bloomie-toma-vida/caras.py → public/trabajos/<ID>/img/cara/f000.png…
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ID = "2026-10-06_claudio_bloomie-toma-vida"
RAIZ = Path(__file__).resolve().parents[3]
IMG = RAIZ / "public/trabajos" / ID / "img"
DATOS = RAIZ / "public/trabajos" / ID / "datos"
REV = RAIZ / "out" / ID / "revision"
LADO = 1024
MARGEN = 0.06
POP = {"cuadros": 6, "escala": 0.12}
MARGEN_BOCA = 10  # px de textura libres, como mínimo, entre la boca y el aro de los anteojos
SUBIR_OJOS = 4  # pt: los ojos del kit van apenas más arriba que los del rig (dejan lugar a la boca)


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


def separar_boca(img):
    """Divide una cara del kit en (rasgos sin boca, boca, centro de la boca): la boca es la mancha central más baja."""
    h, w = img.shape[:2]
    n, et, est, cen = cv2.connectedComponentsWithStats((img[:, :, 3] > 100).astype(np.uint8), 8)
    centrales = [k for k in range(1, n) if abs(cen[k][0] - w / 2) < w * 0.15]
    k = max(centrales, key=lambda k: cen[k][1])
    m = cv2.dilate((et == k).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    boca, resto = img.copy(), img.copy()
    boca[~m] = 0
    resto[m] = 0
    return resto, boca, (float(cen[k][0]), float(cen[k][1]))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    coreo = json.loads((DATOS / "coreografia.json").read_text(encoding="utf-8"))
    kit = json.loads((DATOS / "kit.json").read_text(encoding="utf-8"))
    frente = json.loads((RAIZ / "public/personajes/bloomie/piezas.json").read_text(encoding="utf-8"))["vistas"]["frente"]
    c = frente["cabeza"]["caja"]
    lado_pt = max(c[2] - c[0], c[3] - c[1]) * (1 + 2 * MARGEN)
    e = LADO / lado_pt  # px de textura por pt
    x_pt, y_pt = (c[0] + c[2]) / 2 - lado_pt / 2, (c[1] + c[3]) / 2 - lado_pt / 2
    oj = frente["rostro"]["ojos"]
    dist_rig = abs(oj[1]["c"][0] - oj[0]["c"][0]) * e
    centro = ((oj[0]["c"][0] + oj[1]["c"][0]) / 2 - x_pt) * e, ((oj[0]["c"][1] + oj[1]["c"][1]) / 2 - SUBIR_OJOS - y_pt) * e

    def colocar(base, img, ojos, s_extra=1.0, bajar=0.0):
        """Pega una pieza del kit con sus ojos sobre los del rig (escala = distancia entre ojos); `bajar` en px."""
        d = abs(ojos[1][0] - ojos[0][0])
        s = dist_rig / d * s_extra
        mx, my = (ojos[0][0] + ojos[1][0]) / 2, (ojos[0][1] + ojos[1][1]) / 2
        pegar(base, img, centro[0] - mx * s, centro[1] - my * s + bajar, img.shape[1] * s, img.shape[0] * s)
        return s, mx, my

    # La boca de cada cara va a la altura de la boca de la cara normal (bajo los anteojos): en la hoja de caras las
    # bocas están más cerca de los ojos y se encimarían con el aro de abajo.
    def alto_boca(nombre):
        img = cv2.imread(str(IMG / f"cara_{nombre}.png"), cv2.IMREAD_UNCHANGED)
        _, _, (bx, by) = separar_boca(img)
        o = kit["caras"][nombre]["ojos"]
        return (by - (o[0][1] + o[1][1]) / 2) * dist_rig / abs(o[1][0] - o[0][0])  # px bajo los ojos
    boca_normal = alto_boca("normal")

    nombres = {t["cara"] for t in coreo["caras"]}
    caras = {n: cv2.imread(str(IMG / f"cara_{n}.png"), cv2.IMREAD_UNCHANGED) for n in nombres}
    partes = {n: separar_boca(img) for n, img in caras.items()}
    altos = {n: alto_boca(n) for n in nombres}
    anteojos = cv2.imread(str(IMG / "anteojos.png"), cv2.IMREAD_UNCHANGED)
    # los anteojos se escalan como la cara normal (de la misma vista de frente): sus ojos caen en los del rig
    oa = kit["anteojos"]["ojosEnAnteojos"]
    # Regla de no superposición: si la boca toca el aro, baja hasta dejar MARGEN_BOCA libres
    capa_a = np.zeros((LADO, LADO, 4), np.uint8)
    colocar(capa_a, anteojos, oa)
    aro = cv2.dilate((capa_a[:, :, 3] > 60).astype(np.uint8), np.ones((2 * MARGEN_BOCA + 1,) * 2, np.uint8)) > 0
    for n in nombres:
        while True:
            prueba = np.zeros((LADO, LADO, 4), np.uint8)
            colocar(prueba, partes[n][1], kit["caras"][n]["ojos"], 1 + POP["escala"], boca_normal - altos[n])
            if not (aro & (prueba[:, :, 3] > 60)).any():
                break
            altos[n] -= 2
    sal = IMG / "cara"
    sal.mkdir(parents=True, exist_ok=True)
    for f in sal.glob("*.png"):
        f.unlink()
    muestras = {}
    for k in range(coreo["duracion"]):
        t = next(t for t in coreo["caras"] if t["desde"] <= k < t["hasta"])
        local = k - t["desde"]
        s = 1 + POP["escala"] * np.sin(min(1.0, local / POP["cuadros"]) * np.pi) if t.get("pop") and local < POP["cuadros"] else 1
        base = np.zeros((LADO, LADO, 4), np.uint8)
        resto, boca, _ = partes[t["cara"]]
        colocar(base, resto, kit["caras"][t["cara"]]["ojos"], s)
        colocar(base, boca, kit["caras"][t["cara"]]["ojos"], s, (boca_normal - altos[t["cara"]]) * s)
        colocar(base, anteojos, oa)
        cv2.imwrite(str(sal / f"f{k:03d}.png"), base)
        muestras.setdefault(t["cara"], base)
    # Control: cada cara sobre un disco naranja del tamaño de la cabeza
    REV.mkdir(parents=True, exist_ok=True)
    celdas = []
    for n, b in muestras.items():
        fondo = np.full((LADO, LADO, 3), 60, np.uint8)
        cx, cy = ((c[0] + c[2]) / 2 - x_pt) * e, ((c[1] + c[3]) / 2 - y_pt) * e
        cv2.ellipse(fondo, (int(cx), int(cy)), (int((c[2] - c[0]) / 2 * e), int((c[3] - c[1]) / 2 * e)), 0, 0, 360, (60, 145, 239), -1)
        a = b[:, :, 3:4] / 255
        fondo = (b[:, :, :3] * a + fondo * (1 - a)).astype(np.uint8)
        cv2.putText(fondo, n, (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.8, (255, 255, 255), 3)
        celdas.append(cv2.resize(fondo, (384, 384), interpolation=cv2.INTER_AREA))
    cv2.imwrite(str(REV / "caras.png"), np.hstack(celdas))
    print(f"OK {coreo['duracion']} cuadros de cara → {sal.relative_to(RAIZ)} · caras {sorted(nombres)} · revision/caras.png")


if __name__ == "__main__":
    main()
