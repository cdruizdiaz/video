"""Recorta el kit de Bloomie 3D (hoja del diseñador, subida x4 con Real-ESRGAN) en piezas sueltas con transparencia.
Entrada: public/trabajos/<ID>/img/kit_x4.png
  (node scripts/subir_resolucion.mjs C:/Videos/crudos/<ID>/kit_bloomie_3d.png public/trabajos/<ID>/img/kit_x4.png --x 4 --anime)
Salida:  public/trabajos/<ID>/img/cara_<nombre>.png (solo los rasgos), anteojos.png (de la vista de frente),
         particula_<nombre>.png, y datos/kit.json con los centros de los ojos de cada cara (px del recorte).
Control: out/<ID>/revision/kit_recortes.png
Uso: python src/trabajos/2026-10-06_claudio_bloomie-toma-vida/recortar_kit.py
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
X = 4  # factor de la subida de resolución
ALFA_MIN = 40  # el halo suave de la hoja (alfa < 40) se descarta

# Cajas en px de la hoja ORIGINAL (1536×1024): x0, y0, x1, y1 (sin los rótulos)
CARAS = {
    "dormido": (55, 60, 275, 200),
    "despertando": (345, 60, 560, 200),
    "parpadeo": (660, 60, 870, 200),
    "asombro": (970, 60, 1170, 205),
    "alegria": (1260, 60, 1470, 210),
}
PARTICULAS = {"petalo_naranja": (380, 850, 530, 970), "petalo_turquesa": (695, 850, 840, 970), "destello": (1010, 845, 1155, 980)}
FRENTE = (985, 400, 1385, 810)  # vista de frente (de ahí salen los anteojos y la cara "normal")


def recorte(img, caja):
    x0, y0, x1, y1 = (v * X for v in caja)
    r = img[y0:y1, x0:x1].copy()
    r[r[:, :, 3] < ALFA_MIN] = 0
    ys, xs = np.nonzero(r[:, :, 3])
    return r[ys.min():ys.max() + 1, xs.min():xs.max() + 1], (x0 + xs.min(), y0 + ys.min())


def solo_grandes(mascara, fraccion):
    """Deja solo las manchas de al menos `fraccion` del área de la más grande (saca restos sueltos)."""
    n, et, est, _ = cv2.connectedComponentsWithStats(mascara.astype(np.uint8), 8)
    if n <= 1:
        return mascara
    areas = est[1:, cv2.CC_STAT_AREA]
    return np.isin(et, 1 + np.nonzero(areas >= areas.max() * fraccion)[0])


def ojos(cara):
    """Centros de los dos ojos: las manchas más grandes de cada mitad, sin las cejas (arriba) ni la boca (centro abajo)."""
    h, w = cara.shape[:2]
    n, et, est, cen = cv2.connectedComponentsWithStats((cara[:, :, 3] > 128).astype(np.uint8), 8)
    centros = []
    for lado in (0, 1):
        cand = [k for k in range(1, n) if (cen[k][0] < w / 2) == (lado == 0) and abs(cen[k][0] - w / 2) > w * 0.12]
        k = max(cand, key=lambda k: est[k][cv2.CC_STAT_AREA])
        x, y, ww, hh = est[k][:4]
        centros.append([float(x + ww / 2), float(y + hh / 2)])
    return centros


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    kit = cv2.imread(str(IMG / "kit_x4.png"), cv2.IMREAD_UNCHANGED)
    datos = {"nota": "px de cada recorte (kit x4)", "caras": {}}
    hoja = []
    for nombre, caja in CARAS.items():
        c, _ = recorte(kit, caja)
        cv2.imwrite(str(IMG / f"cara_{nombre}.png"), c)
        datos["caras"][nombre] = {"tam": [c.shape[1], c.shape[0]], "ojos": ojos(c)}
        hoja.append(c)
    for nombre, caja in PARTICULAS.items():
        c, _ = recorte(kit, caja)
        c[~solo_grandes(c[:, :, 3] > 0, 1.0)] = 0  # una sola forma (sin restos del rótulo)
        ys, xs = np.nonzero(c[:, :, 3])
        c = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        cv2.imwrite(str(IMG / f"particula_{nombre}.png"), c)
        hoja.append(c)

    # Vista de frente: anteojos (celeste) y cara "normal" (rasgos oscuros y blancos de los ojos dentro de la cabeza)
    fr, _ = recorte(kit, FRENTE)
    hsv = cv2.cvtColor(fr[:, :, :3], cv2.COLOR_BGR2HSV)
    opaco = fr[:, :, 3] > 128
    celeste = opaco & (hsv[:, :, 0] > 80) & (hsv[:, :, 0] < 110) & (hsv[:, :, 1] > 90)
    celeste = cv2.dilate(celeste.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0  # el borde fino del aro
    celeste &= opaco & ~((hsv[:, :, 1] > 120) & (hsv[:, :, 0] < 30))  # sin la piel naranja
    celeste &= (hsv[:, :, 0] > 70) | (hsv[:, :, 2] > 90)  # el borde, pero no la tinta oscura de cejas y boca
    celeste = solo_grandes(celeste, 0.2)
    rasgos = opaco & ((hsv[:, :, 2] < 105) | ((hsv[:, :, 1] < 40) & (hsv[:, :, 2] > 200))) & ~celeste  # tinta oscura + blanco de los ojos
    ys, xs = np.nonzero(celeste)
    caja_a = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)

    def capa(mascara):
        out = fr.copy()
        out[:, :, 3] = np.where(mascara, fr[:, :, 3], 0)
        return out

    anteojos = capa(celeste)[caja_a[1]:caja_a[3], caja_a[0]:caja_a[2]]
    cv2.imwrite(str(IMG / "anteojos.png"), anteojos)
    # cara normal: rasgos en la zona de la cabeza (alrededor de los anteojos, sin las manos ni el cuerpo)
    m = np.zeros_like(rasgos)
    alto_a = caja_a[3] - caja_a[1]
    m[max(0, caja_a[1] - alto_a // 2):caja_a[3] + alto_a // 2, caja_a[0]:caja_a[2]] = True
    normal = capa(solo_grandes(rasgos & m, 0.02))
    ys, xs = np.nonzero(normal[:, :, 3])
    normal = normal[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    cv2.imwrite(str(IMG / "cara_normal.png"), normal)
    datos["caras"]["normal"] = {"tam": [normal.shape[1], normal.shape[0]], "ojos": ojos(normal)}
    # Posición de los anteojos respecto de los ojos de la cara normal (para ponerlos igual en todas las caras)
    o = datos["caras"]["normal"]["ojos"]
    dx, dy = xs.min(), ys.min()  # origen del recorte de la cara normal dentro de la vista de frente
    datos["anteojos"] = {
        "tam": [anteojos.shape[1], anteojos.shape[0]],
        "ojosEnAnteojos": [[o[0][0] + dx - caja_a[0], o[0][1] + dy - caja_a[1]], [o[1][0] + dx - caja_a[0], o[1][1] + dy - caja_a[1]]],
    }
    hoja += [normal, anteojos]
    DATOS.mkdir(parents=True, exist_ok=True)
    (DATOS / "kit.json").write_text(json.dumps(datos, indent=1), encoding="utf-8")

    # Hoja de control: cada recorte sobre gris, con los centros de los ojos marcados
    REV.mkdir(parents=True, exist_ok=True)
    celdas = []
    for k, c in enumerate(hoja):
        s = 300 / max(c.shape[:2])
        c2 = cv2.resize(c, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        fondo = np.full((320, 320, 3), 150, np.uint8)
        y0, x0 = (320 - c2.shape[0]) // 2, (320 - c2.shape[1]) // 2
        a = c2[:, :, 3:4] / 255
        fondo[y0:y0 + c2.shape[0], x0:x0 + c2.shape[1]] = (c2[:, :, :3] * a + fondo[y0:y0 + c2.shape[0], x0:x0 + c2.shape[1]] * (1 - a)).astype(np.uint8)
        nombres = list(CARAS) + list(PARTICULAS) + ["normal", "anteojos"]
        if nombres[k] in datos["caras"]:
            for ox, oy in datos["caras"][nombres[k]]["ojos"]:
                cv2.circle(fondo, (int(x0 + ox * s), int(y0 + oy * s)), 6, (0, 0, 255), 2)
        cv2.putText(fondo, nombres[k], (6, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        celdas.append(fondo)
    while len(celdas) % 5:
        celdas.append(np.full((320, 320, 3), 150, np.uint8))
    filas = [np.hstack(celdas[i:i + 5]) for i in range(0, len(celdas), 5)]
    cv2.imwrite(str(REV / "kit_recortes.png"), np.vstack(filas))
    print(f"OK {len(hoja)} recortes → {IMG.relative_to(RAIZ)} · datos/kit.json · revision/kit_recortes.png")


if __name__ == "__main__":
    main()
