# Figurita de la "A" de RASTRO (short logo del manual de marca) con fondo transparente, para la placa de cierre.
# El logo.png de la marca tiene la "A" chica (125 px) y oscura: con el filtro de color quedaba como una mancha
# sin contraste (2026-10-23: "fijate que el logo debe contrastar"). Se usa el short logo en alta (366 px de "A"):
#  - positivo (contorno y vetas negras, madera clara): para fondos claros. Del JPG del manual.
#  - negativo (contorno y vetas claras sobre negro): del PNG que mandó el usuario (ya no se usa en la placa).
#  - blanca (2026-10-23: "para las que el fondo te permita, usá el logo todo blanco"): contorno y vetas en blanco
#    y lo claro de la madera transparente, para fondos oscuros o de color. Del JPG: la opacidad es lo oscuro.
# Se borra el fondo conectado al borde de la imagen y el hueco del arco (cerrado por el contorno); lo claro de
# adentro de la madera queda. En el positivo, los blancos se tiñen del color papel de la marca (#f7f4ea).
# Originales copiados en C:/Videos/crudos/2026-10-23_rastro_placa-cierre/.
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-23_rastro_placa-cierre/preparar_logo.py
from collections import deque

import numpy as np
from PIL import Image

CRUDOS = "C:/Videos/crudos/2026-10-23_rastro_placa-cierre"
SALIDA = "public/marcas/rastro"
PAPEL = np.array([0xF7, 0xF4, 0xEA], dtype=np.float32)
HUECO_ARCO = (315, 260)  # un punto dentro del hueco del arco (coordenadas del short logo, 577×641)
UMBRAL = 200  # brillo del fondo (positivo: > UMBRAL; negativo: < 255 - UMBRAL)


def fondo_conectado(es_fondo: np.ndarray, semillas: list[tuple[int, int]]) -> np.ndarray:
    """Píxeles de fondo conectados (4 vecinos) a las semillas (x, y)."""
    alto, ancho = es_fondo.shape
    visto = np.zeros_like(es_fondo)
    cola = deque((y, x) for x, y in semillas if es_fondo[y, x])
    for y, x in cola:
        visto[y, x] = True
    while cola:
        y, x = cola.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < alto and 0 <= nx < ancho and es_fondo[ny, nx] and not visto[ny, nx]:
                visto[ny, nx] = True
                cola.append((ny, nx))
    return visto


def recortar(rgb: np.ndarray, claro_es_fondo: bool) -> np.ndarray:
    gris = rgb.mean(axis=2)
    es_fondo = gris > UMBRAL if claro_es_fondo else gris < 255 - UMBRAL
    alto, ancho = gris.shape
    borde = [(x, 0) for x in range(ancho)] + [(x, alto - 1) for x in range(ancho)]
    borde += [(0, y) for y in range(alto)] + [(ancho - 1, y) for y in range(alto)]
    fondo = fondo_conectado(es_fondo, borde + [HUECO_ARCO])
    alfa = np.where(fondo, 0, 255).astype(np.uint8)
    return np.dstack([rgb.astype(np.uint8), alfa])


def main() -> None:
    pos = np.array(Image.open(f"{CRUDOS}/short-logo-negro.jpg").convert("RGB"), dtype=np.float32)
    pos = pos / 255.0 * PAPEL  # los blancos pasan a papel; los negros quedan negros
    Image.fromarray(recortar(pos, claro_es_fondo=True)).save(f"{SALIDA}/figurita-positivo.png")
    neg = np.array(Image.open(f"{CRUDOS}/short-logo-negativo.png").convert("RGB"), dtype=np.float32)
    Image.fromarray(recortar(neg, claro_es_fondo=False)).save(f"{SALIDA}/figurita-negativo.png")
    gris = np.array(Image.open(f"{CRUDOS}/short-logo-negro.jpg").convert("L"), dtype=np.float32)
    alfa = np.clip((255 - gris) * 1.15, 0, 255).astype(np.uint8)  # 1,15: los grises de las vetas, más firmes
    blanca = np.dstack([np.full_like(alfa, 255)] * 3 + [alfa])
    Image.fromarray(blanca).save(f"{SALIDA}/figurita-blanca.png")
    print("listo: figurita-positivo.png, figurita-negativo.png, figurita-blanca.png")


main()
