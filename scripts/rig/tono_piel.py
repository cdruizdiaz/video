#!/usr/bin/env python
# Cambia el color de piel de un personaje por poses (la piel turquesa del kit) por otro tono, manteniendo las luces
# y sombras del dibujo: en Lab, la luminosidad de cada píxel se corre igual que en el original respecto de la piel
# media y el color (a, b) pasa a ser el del tono pedido. Los bordes contra el contorno (mezcla turquesa + negro) se
# cambian en proporción a cuánto turquesa tienen, así no queda un halo.
#
#   python scripts/rig/tono_piel.py <nombre> <#rrggbb> <sufijo>          → public/personajes/<nombre>/poses_<sufijo>/
#   python scripts/rig/tono_piel.py <nombre> <#rrggbb> <sufijo> --muestra <salida.png> [--pose neutra]
#
# Los originales (poses/) no se tocan. PersonajePoses usa la carpeta nueva con la prop `piel="<sufijo>"`.
import glob
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from importar_png import PIEL_H, RAIZ, guardar, leer  # noqa: E402

S_MIN, S_LLENO = 45, 140  # saturación desde la que empieza a contar como piel y desde la que cuenta entera
CONTRASTE = 0.85  # las sombras del turquesa son muy marcadas: en un tono de piel se ven mejor un poco más suaves


def a_lab(rgb):
    return cv2.cvtColor(rgb.astype(np.float32) / 255.0, cv2.COLOR_RGB2LAB)


def mascara(im):
    hsv = cv2.cvtColor(np.ascontiguousarray(im[:, :, :3]), cv2.COLOR_RGB2HSV)
    tono = (hsv[:, :, 0] >= PIEL_H[0] - 4) & (hsv[:, :, 0] <= PIEL_H[1] + 1)
    peso = np.clip((hsv[:, :, 1].astype(np.float32) - S_MIN) / (S_LLENO - S_MIN), 0, 1)
    return np.where(tono & (im[:, :, 3] > 0), peso, 0).astype(np.float32)


def recolorear(im, destino, l_media):
    w = mascara(im)
    if not w.any():
        return im
    lab = a_lab(im[:, :, :3])
    t = a_lab(np.array([[destino]], dtype=np.uint8))[0, 0]
    nuevo = lab.copy()
    nuevo[:, :, 0] = np.clip(t[0] + (lab[:, :, 0] - l_media) * CONTRASTE, 0, 100)
    nuevo[:, :, 1] = t[1]
    nuevo[:, :, 2] = t[2]
    rgb = np.clip(cv2.cvtColor(nuevo, cv2.COLOR_LAB2RGB) * 255, 0, 255)
    out = im.copy()
    out[:, :, :3] = (im[:, :, :3] * (1 - w[:, :, None]) + rgb * w[:, :, None]).round().astype(np.uint8)
    return out


def l_media_de(nombre):
    """Luminosidad media de la piel llena en la pose de referencia (la misma para todas las poses: no parpadea)."""
    im = leer(os.path.join(RAIZ, "public", "personajes", nombre, "poses", "neutra.png"))
    return float(np.median(a_lab(im[:, :, :3])[mascara(im) >= 1][:, 0]))


def main():
    nombre, color, sufijo = sys.argv[1:4]
    destino = tuple(int(color.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))
    l_media = l_media_de(nombre)
    origen = os.path.join(RAIZ, "public", "personajes", nombre, "poses")
    if "--muestra" in sys.argv:
        pose = sys.argv[sys.argv.index("--pose") + 1] if "--pose" in sys.argv else "neutra"
        salida = sys.argv[sys.argv.index("--muestra") + 1]
        Image.fromarray(recolorear(leer(os.path.join(origen, f"{pose}.png")), destino, l_media)).save(salida)
        return
    carpeta = os.path.join(RAIZ, "public", "personajes", nombre, f"poses_{sufijo}")
    archivos = sorted(glob.glob(os.path.join(origen, "*.png")))
    for f in archivos:
        guardar(recolorear(leer(f), destino, l_media), os.path.join(carpeta, os.path.basename(f)))
    print(f"{nombre}: {len(archivos)} imágenes con piel {color} en {os.path.relpath(carpeta, RAIZ)}")


if __name__ == "__main__":
    main()
