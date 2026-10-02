# Corta una hoja de sprites con fondo negro opaco en PNG sueltos con transparencia.
# Cada sprite es una mancha conectada (sirve aunque se salga de su celda de la grilla, como las escobas);
# los huecos internos negros (pupilas) se rellenan, y el borde antialiasado se des-multiplica del negro para
# que no quede halo. Todos los PNG comparten el mismo lienzo, relativo a su celda: se conserva el registro
# que dibujó el autor entre cuadros.
# Uso: python scripts/cortar_sprites.py <hoja.png> <carpeta_salida> <hoja_revision.png>
#        [--columnas 6] [--filas 4] [--umbral 25] [--pleno 60]
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

MINIMO = 300  # px: manchas más chicas son pedacitos sueltos (se asignan al sprite más cercano)
BORDE = 2  # px de franja des-multiplicada


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("hoja")
    ap.add_argument("salida")
    ap.add_argument("revision")
    ap.add_argument("--columnas", type=int, default=6)
    ap.add_argument("--filas", type=int, default=4)
    ap.add_argument("--umbral", type=int, default=25, help="canal más alto por debajo = fondo negro")
    ap.add_argument("--pleno", type=int, default=60, help="canal más alto desde el que el borde es opaco")
    a = ap.parse_args()

    rgb = np.array(Image.open(a.hoja).convert("RGB"))
    alto, ancho = rgb.shape[:2]
    cw, ch = ancho // a.columnas, alto // a.filas
    maxc = rgb.max(axis=2)
    solido = (maxc >= a.umbral).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(solido, 8)

    grandes = [i for i in range(1, n) if st[i][4] >= MINIMO]
    esperados = a.columnas * a.filas
    if len(grandes) != esperados:
        raise SystemExit(f"Encontré {len(grandes)} sprites y esperaba {esperados}: revisar --umbral")
    # Celda de cada sprite por su centro
    celda = {i: (int(cen[i][1] // ch), int(cen[i][0] // cw)) for i in grandes}
    orden = sorted(grandes, key=lambda i: celda[i])
    if len({celda[i] for i in grandes}) != esperados:
        raise SystemExit("Dos sprites caen en la misma celda: la hoja no sigue la grilla")
    # Pedacitos sueltos → al sprite grande más cercano (por centro)
    dueno = {i: i for i in grandes}
    for i in range(1, n):
        if i not in dueno:
            dueno[i] = min(grandes, key=lambda g: (cen[g][0] - cen[i][0]) ** 2 + (cen[g][1] - cen[i][1]) ** 2)

    mascaras = []
    for g in orden:
        ids = [i for i, d in dueno.items() if d == g]
        m = np.isin(lab, ids).astype(np.uint8)
        # Rellenar huecos: lo que no se alcanza desde afuera es parte del sprite
        relleno = np.pad(1 - m, 1, constant_values=1).copy()
        cv2.floodFill(relleno, None, (0, 0), 2)
        m = np.where(relleno[1:-1, 1:-1] == 2, 0, 1).astype(np.uint8)
        mascaras.append(m)

    # Lienzo común relativo a la celda
    cajas = []
    for g, m in zip(orden, mascaras):
        fila, col = celda[g]
        ys, xs = np.nonzero(m)
        cajas.append((xs.min() - col * cw, ys.min() - fila * ch, xs.max() + 1 - col * cw, ys.max() + 1 - fila * ch))
    x0 = min(c[0] for c in cajas) - BORDE
    y0 = min(c[1] for c in cajas) - BORDE
    x1 = max(c[2] for c in cajas) + BORDE
    y1 = max(c[3] for c in cajas) + BORDE
    lw, lh = x1 - x0, y1 - y0

    salida = Path(a.salida)
    salida.mkdir(parents=True, exist_ok=True)
    cuadros = []
    nucleo = np.ones((2 * BORDE + 1, 2 * BORDE + 1), np.uint8)
    for k, (g, m) in enumerate(zip(orden, mascaras)):
        fila, col = celda[g]
        ox, oy = col * cw + x0, fila * ch + y0
        lienzo = np.zeros((lh, lw, 4), np.uint8)
        # Recorte de la hoja (puede salirse de la imagen en los bordes)
        sx0, sy0 = max(0, ox), max(0, oy)
        sx1, sy1 = min(ancho, ox + lw), min(alto, oy + lh)
        c = rgb[sy0:sy1, sx0:sx1].astype(np.float32)
        mm = m[sy0:sy1, sx0:sx1]
        franja = mm & (1 - cv2.erode(mm, nucleo))  # borde interno del sprite
        alfa = np.where(mm == 1, 1.0, 0.0)
        alfa = np.where(franja == 1, np.clip(c.max(axis=2) / a.pleno, 0, 1), alfa)
        color = np.where(franja[..., None] == 1, np.clip(c / np.maximum(alfa[..., None], 1e-3), 0, 255), c)
        bloque = np.dstack([color, alfa * 255]).round().astype(np.uint8)
        lienzo[sy0 - oy:sy1 - oy, sx0 - ox:sx1 - ox] = bloque
        img = Image.fromarray(lienzo, "RGBA")
        img.save(salida / f"f{k + 1:02d}.png")
        cuadros.append(img)

    print(f"{len(cuadros)} sprites {lw}x{lh} -> {salida}")
    # Hoja de revisión sobre gris, numerada
    rev = Image.new("RGB", (lw * a.columnas, lh * a.filas), (90, 105, 120))
    d = ImageDraw.Draw(rev)
    for k, img in enumerate(cuadros):
        f, c = divmod(k, a.columnas)
        rev.paste(img, (c * lw, f * lh), img)
        d.text((c * lw + 4, f * lh + 2), str(k + 1), fill=(255, 255, 255))
    Path(a.revision).parent.mkdir(parents=True, exist_ok=True)
    rev.save(a.revision)


if __name__ == "__main__":
    main()
