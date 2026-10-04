"""Silueta vectorial de un logo en PNG (OpenCV): para extruirlo en 3D con la plantilla Logo3D (la cara de adelante
lleva el PNG original como textura, así que alcanza con el contorno; no hace falta un vector perfecto).

Uso (Python del .venv):
  python scripts/vectorizar_logo.py <logo.png> <salida.svg> [--modo auto|alfa|oscuro|claro] [--umbral 128]
         [--min 0.0004] [--suavizar 1.0] [--cerrar 0]

  --modo      qué es "logo": alfa (lo opaco), oscuro (sobre fondo claro), claro (sobre fondo oscuro);
              auto = alfa si el PNG tiene transparencia, si no oscuro/claro según el borde de la imagen
  --min       descarta manchas más chicas que esta fracción del área de la imagen
  --suavizar  tolerancia (px) para simplificar los contornos
  --cerrar N  une partes separadas por menos de N px (logos con trazos finos o letras sueltas que conviene juntar)
Salida: SVG con un solo path (fill-rule evenodd: los agujeros de las letras quedan huecos) del mismo tamaño del PNG.
"""
import sys
from pathlib import Path

import cv2
import numpy as np


def opcion(args, n, d=None, tipo=float):
    return tipo(args[args.index(n) + 1]) if n in args else d


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    con_valor = ("--modo", "--umbral", "--min", "--suavizar", "--cerrar")
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and not (i > 0 and args[i - 1] in con_valor)]
    if len(pos) < 2:
        print(__doc__)
        sys.exit(1)
    entrada, salida = pos
    modo = opcion(args, "--modo", "auto", str)
    umbral = int(opcion(args, "--umbral", 128))
    minimo = opcion(args, "--min", 0.0004)
    suav = opcion(args, "--suavizar", 1.0)
    cerrar = int(opcion(args, "--cerrar", 0))

    img = cv2.imdecode(np.fromfile(entrada, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGRA)
    elif img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    H, W = img.shape[:2]
    alfa = img[:, :, 3]
    gris = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
    if modo == "auto":
        if (alfa < 250).mean() > 0.02:
            modo = "alfa"
        else:
            borde = np.concatenate([gris[0], gris[-1], gris[:, 0], gris[:, -1]])
            modo = "oscuro" if borde.mean() > 127 else "claro"
    if modo == "alfa":
        m = alfa >= umbral
    elif modo == "oscuro":
        m = (gris < umbral) & (alfa >= 128)
    else:
        m = (gris >= umbral) & (alfa >= 128)
    m = m.astype(np.uint8) * 255
    if cerrar > 0:
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (cerrar, cerrar)))

    contornos, jer = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    area_min = minimo * W * H
    partes, piezas, agujeros = [], 0, 0
    if jer is not None:
        jer = jer[0]
        for i, c in enumerate(contornos):
            es_agujero = jer[i][3] != -1
            padre_chico = es_agujero and cv2.contourArea(contornos[jer[i][3]]) < area_min
            if cv2.contourArea(c) < (area_min * 0.25 if es_agujero else area_min) or padre_chico:
                continue
            a = cv2.approxPolyDP(c, suav, True).reshape(-1, 2)
            if len(a) < 3:
                continue
            partes.append("M" + "L".join(f"{x} {y}" for x, y in a) + "Z")
            agujeros += es_agujero
            piezas += not es_agujero
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    Path(salida).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        f'<path fill="#000" fill-rule="evenodd" d="{"".join(partes)}"/></svg>\n',
        encoding="utf-8",
    )
    print(f"OK {salida} · {W}×{H} · modo {modo} · {piezas} piezas, {agujeros} agujeros")


if __name__ == "__main__":
    main()
