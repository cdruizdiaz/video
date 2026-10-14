"""Recorta el kit de expresiones de Bloomie (hoja de ChatGPT sobre fondo NEGRO, subida x4 con Real-ESRGAN) en piezas
sueltas con transparencia.
Entrada: public/trabajos/<ID>/img/kit_x4.png
  (node scripts/subir_resolucion.mjs C:/Videos/crudos/<ID>/kit_expresiones_v2.png public/trabajos/<ID>/img/kit_x4.png --x 4 --anime)
Fondo: la hoja no es transparente. El fondo es negro puro y la tinta es marrón muy oscura (#160807 aprox.): el alfa sale
del canal más brillante (negro = 0, tinta o más claro = opaco) y los bordes semitransparentes toman el color de la tinta.
Salida: public/trabajos/<ID>/img/cara_<nombre>.png, boca_<nombre>.png, anteojos.png, particula_<nombre>.png y
        datos/kit.json (centros de los ojos de cada cara y de los aros de los anteojos, px del recorte).
Control: out/<ID>/revision/kit_recortes.png
Uso: python src/trabajos/2026-10-06_claudio_bloomie-plantado/recortar_kit.py
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ID = "2026-10-06_claudio_bloomie-plantado"
RAIZ = Path(__file__).resolve().parents[3]
IMG = RAIZ / "public/trabajos" / ID / "img"
DATOS = RAIZ / "public/trabajos" / ID / "datos"
REV = RAIZ / "out" / ID / "revision"
X = 4  # factor de la subida de resolución
TINTA = (7, 8, 22)  # BGR de la tinta (#160807)
FONDO = {"negro": 5, "tinta": 20}  # canal máximo: hasta 5 es fondo, desde 20 es opaco (en el medio, borde)

# Cajas en px de la hoja ORIGINAL (1670×941): x0, y0, x1, y1 (sin los rótulos)
CARAS = {
    "normal": (120, 30, 420, 218),
    "parpadeo": (500, 30, 810, 218),
    "mirando": (875, 30, 1175, 218),
    "triste": (1255, 30, 1555, 218),
    "asombro": (115, 275, 425, 492),
    "esfuerzo": (520, 285, 785, 490),
    "resignado": (870, 280, 1185, 490),
    "alegria": (1250, 280, 1555, 495),
}
BOCAS = {
    "cerrada": (90, 570, 210, 640),
    "m": (265, 585, 390, 630),
    "entreabierta": (445, 570, 605, 645),
    "e": (650, 560, 800, 648),
    "a": (850, 560, 1010, 650),
    "u": (1080, 565, 1165, 640),
    "f": (1245, 570, 1405, 635),
    "l": (1455, 560, 1585, 650),
}
PARTICULAS = {"petalo_naranja": (620, 690, 840, 885), "petalo_turquesa": (975, 690, 1195, 885), "destello": (1320, 690, 1540, 885)}
ANTEOJOS = (140, 700, 530, 885)


def con_alfa(bgr):
    """Fondo negro → transparente; borde con la tinta y alfa proporcional al brillo."""
    m = bgr.max(axis=2).astype(np.float32)
    a = np.clip((m - FONDO["negro"]) / (FONDO["tinta"] - FONDO["negro"]), 0, 1)
    out = np.dstack([bgr, (a * 255).astype(np.uint8)])
    borde = (a > 0) & (a < 1)
    out[borde, :3] = TINTA
    return out


def solo_grandes(mascara, fraccion):
    """Deja solo las manchas de al menos `fraccion` del área de la más grande (saca restos sueltos)."""
    n, et, est, _ = cv2.connectedComponentsWithStats(mascara.astype(np.uint8), 8)
    if n <= 1:
        return mascara
    areas = est[1:, cv2.CC_STAT_AREA]
    return np.isin(et, 1 + np.nonzero(areas >= areas.max() * fraccion)[0])


def recorte(kit, caja, fraccion=0.004):
    x0, y0, x1, y1 = (v * X for v in caja)
    r = con_alfa(kit[y0:y1, x0:x1])
    r[~solo_grandes(r[:, :, 3] > 30, fraccion)] = 0  # sin puntitos ni pedazos de rótulos
    ys, xs = np.nonzero(r[:, :, 3])
    return r[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def ojos(cara):
    """Centros de los dos ojos: la mancha más grande de cada mitad, fuera del centro (la boca) y sin las cejas."""
    h, w = cara.shape[:2]
    n, et, est, cen = cv2.connectedComponentsWithStats((cara[:, :, 3] > 128).astype(np.uint8), 8)
    centros = []
    for lado in (0, 1):
        cand = [k for k in range(1, n) if (cen[k][0] < w / 2) == (lado == 0) and abs(cen[k][0] - w / 2) > w * 0.12]
        k = max(cand, key=lambda k: est[k][cv2.CC_STAT_AREA])
        x, y, ww, hh = est[k][:4]
        centros.append([float(x + ww / 2), float(y + hh / 2)])
    return centros


def aros(img):
    """Centros y radio interior de los dos aros de los anteojos (los huecos cerrados más grandes)."""
    lleno = (img[:, :, 3] > 128).astype(np.uint8)
    n, et, est, cen = cv2.connectedComponentsWithStats(1 - lleno, 4)
    h, w = lleno.shape
    huecos = [k for k in range(1, n) if est[k][0] > 0 and est[k][1] > 0 and est[k][0] + est[k][2] < w and est[k][1] + est[k][3] < h]
    a, b = sorted(sorted(huecos, key=lambda k: -est[k][cv2.CC_STAT_AREA])[:2], key=lambda k: cen[k][0])
    return [[float(cen[k][0]), float(cen[k][1])] for k in (a, b)], float(min(est[a][2], est[a][3], est[b][2], est[b][3]) / 2)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    kit = cv2.imread(str(IMG / "kit_x4.png"), cv2.IMREAD_COLOR)
    datos = {"nota": "px de cada recorte (kit x4)", "caras": {}, "bocas": {}}
    hoja, nombres = [], []
    for nombre, caja in CARAS.items():
        c = recorte(kit, caja)
        cv2.imwrite(str(IMG / f"cara_{nombre}.png"), c)
        datos["caras"][nombre] = {"tam": [c.shape[1], c.shape[0]], "ojos": ojos(c)}
        hoja.append(c)
        nombres.append(nombre)
    for nombre, caja in BOCAS.items():
        c = recorte(kit, caja, 0.05)
        cv2.imwrite(str(IMG / f"boca_{nombre}.png"), c)
        datos["bocas"][nombre] = {"tam": [c.shape[1], c.shape[0]]}
        hoja.append(c)
        nombres.append(f"boca {nombre}")
    for nombre, caja in PARTICULAS.items():
        c = recorte(kit, caja, 1.0)
        cv2.imwrite(str(IMG / f"particula_{nombre}.png"), c)
        hoja.append(c)
        nombres.append(nombre)
    a = recorte(kit, ANTEOJOS, 0.2)
    cv2.imwrite(str(IMG / "anteojos.png"), a)
    centros, radio = aros(a)
    datos["anteojos"] = {"tam": [a.shape[1], a.shape[0]], "aros": centros, "radioInterior": radio}
    hoja.append(a)
    nombres.append("anteojos")
    DATOS.mkdir(parents=True, exist_ok=True)
    (DATOS / "kit.json").write_text(json.dumps(datos, indent=1), encoding="utf-8")

    # Hoja de control: cada recorte sobre gris, con los centros de los ojos (y de los aros) marcados
    REV.mkdir(parents=True, exist_ok=True)
    celdas = []
    for c, nombre in zip(hoja, nombres):
        s = 300 / max(c.shape[:2])
        c2 = cv2.resize(c, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        fondo = np.full((320, 320, 3), 150, np.uint8)
        y0, x0 = (320 - c2.shape[0]) // 2, (320 - c2.shape[1]) // 2
        al = c2[:, :, 3:4] / 255
        zona = fondo[y0:y0 + c2.shape[0], x0:x0 + c2.shape[1]]
        fondo[y0:y0 + c2.shape[0], x0:x0 + c2.shape[1]] = (c2[:, :, :3] * al + zona * (1 - al)).astype(np.uint8)
        marcas = datos["caras"].get(nombre, {}).get("ojos") or (centros if nombre == "anteojos" else [])
        for ox, oy in marcas:
            cv2.circle(fondo, (int(x0 + ox * s), int(y0 + oy * s)), 6, (0, 0, 255), 2)
        cv2.putText(fondo, nombre, (6, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        celdas.append(fondo)
    while len(celdas) % 5:
        celdas.append(np.full((320, 320, 3), 150, np.uint8))
    cv2.imwrite(str(REV / "kit_recortes.png"), np.vstack([np.hstack(celdas[i:i + 5]) for i in range(0, len(celdas), 5)]))
    print(f"OK {len(hoja)} recortes → {IMG.relative_to(RAIZ)} · datos/kit.json · revision/kit_recortes.png")


if __name__ == "__main__":
    main()
