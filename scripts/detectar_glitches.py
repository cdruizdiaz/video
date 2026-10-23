# Busca glitches en un render: cuadros vacíos (un solo color, p. ej. el fondo de la composición cuando un plano no
# cubre la toma), cuadros repetidos (congelados) y saltos bruscos de imagen (cortes, zooms rápidos, flashes).
# Un salto aislado es un corte; dos saltos pegados (≤ 3 cuadros) son un FLASH: casi siempre un glitch.
# Uso (Python del .venv, raíz del proyecto):
#   python scripts/detectar_glitches.py <video.mp4> [--hasta-s 58.1] [--repetidos 4]
#     --hasta-s     ignora lo que viene después (p. ej. la placa final, que es quieta a propósito)
#     --repetidos   cantidad mínima de cuadros idénticos seguidos para avisar (default 4)
# Salida: lista de alertas con cuadro y segundo; código de salida 1 si hay vacíos, flashes o congelados.
# Aprendido en 2026-10-19_volto_radio (2026-10-22): la preview v1 tenía 1–8 cuadros vacíos en tres cortes.
import argparse
import sys

import cv2
import numpy as np

ESCALA = (135, 240)  # se compara en chico: rápido y sin ruido de compresión
UMBRAL_REPETIDO = 0.02  # diferencia media (0–255) por debajo de la cual dos cuadros son iguales
UMBRAL_VACIO = 2.0  # desvío estándar por debajo del cual un cuadro es de un solo color
FACTOR_SALTO = 6  # salto = diferencia > FACTOR_SALTO × mediana (y > SALTO_MINIMO)
SALTO_MINIMO = 8.0
FLASH_CUADROS = 3


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")  # la consola de Windows no imprime ⚠ ni tildes en cp1252
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--hasta-s", type=float, default=None)
    ap.add_argument("--repetidos", type=int, default=4)
    a = ap.parse_args()

    cap = cv2.VideoCapture(a.video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    prev, difs, vacios = None, [], []
    i = 0
    while True:
        ok, f = cap.read()
        if not ok or (a.hasta_s is not None and i / fps > a.hasta_s):
            break
        g = cv2.cvtColor(cv2.resize(f, ESCALA), cv2.COLOR_BGR2GRAY).astype(np.float32)
        if g.std() < UMBRAL_VACIO:
            vacios.append(i)
        difs.append(float(np.abs(g - prev).mean()) if prev is not None else 0.0)
        prev, i = g, i + 1
    d = np.array(difs)
    med = float(np.median(d[1:])) if len(d) > 1 else 0.0
    saltos = [k for k in range(1, len(d)) if d[k] > max(SALTO_MINIMO, med * FACTOR_SALTO)]

    alertas = []
    for k in vacios:
        alertas.append((k, "VACÍO (un solo color)"))
    # rachas de saltos: 3 o más cuadros seguidos cambiando fuerte = movimiento rápido (zoom, empuje), no glitch;
    # dos saltos a ≤ FLASH_CUADROS cuadros fuera de una racha = algo que aparece y se va (flash)
    rachas, actual = [], [saltos[0]] if saltos else []
    for k in saltos[1:]:
        if k - actual[-1] == 1:
            actual.append(k)
        else:
            rachas.append(actual)
            actual = [k]
    if actual:
        rachas.append(actual)
    movimientos = [r for r in rachas if len(r) >= 3]
    sueltos = [r[0] for r in rachas if len(r) < 3] + [r[-1] for r in rachas if len(r) == 2]
    sueltos = sorted(set(sueltos))
    for x, y in zip(sueltos, sueltos[1:]):
        if y - x <= FLASH_CUADROS:
            alertas.append((x, f"FLASH de {y - x} cuadro(s)"))
    # congelados: cuadros idénticos seguidos
    k = 1
    while k < len(d):
        if d[k] < UMBRAL_REPETIDO:
            j = k
            while j < len(d) and d[j] < UMBRAL_REPETIDO:
                j += 1
            if j - k >= a.repetidos:
                alertas.append((k, f"CONGELADO {j - k} cuadros"))
            k = j
        else:
            k += 1

    print(f"{a.video}: {i} cuadros a {fps:g} fps, mediana de cambio {med:.2f}")
    print("cortes:", " ".join(f"{r[0]}({r[0] / fps:.2f}s)" for r in rachas if len(r) < 3))
    print("movimientos rápidos:", " ".join(f"{r[0]}–{r[-1]}({r[0] / fps:.2f}s)" for r in movimientos) or "—")
    for k, txt in sorted(alertas):
        print(f"  ⚠ cuadro {k} ({k / fps:.2f} s): {txt}")
    if not alertas:
        print("  sin glitches")
    return 1 if alertas else 0


if __name__ == "__main__":
    sys.exit(main())
