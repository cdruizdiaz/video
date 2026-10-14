#!/usr/bin/env python
# Importa un personaje "por poses" (stop motion): una hoja PNG con transparencia y N poses de cuerpo entero a la
# misma escala (sin piezas ni articulaciones). Cada pose se recorta y se alinea por los pies; se le saca la boca
# dibujada (versión "sin boca") para hablar con las bocas A–F del kit del personaje; se guarda la caja de la cabeza
# (para que los carteles no la pisen) y el tamaño de la boca (para escalar las bocas).
#
#   python scripts/rig/importar_poses.py <nombre>      (lee src/personajes/<nombre>/poses.json)
#
# poses.json: {"hojas": [{"hoja": "C:/…/<nombre>_poses.png", "filas": 3, "nombres": ["neutra", …]}, …],
#              "referencia": "neutra"}   (nombres en orden de lectura; una sola hoja también vale como antes)
# Las poses se alinean por el centro de los pies (así el personaje no salta al cambiar de pose). Con
# "igualarEscala": true se llevan al tamaño de la referencia midiendo el ancho de la cara (solo si la IA cambió mucho
# la escala entre hojas: la medición tiene ~1,5 % de ruido).
# Salida: public/personajes/<nombre>/poses/<pose>.png y <pose>_sinboca.png, public/personajes/<nombre>/poses.json
# (datos para src/rig/Poses.tsx) y out/personajes/<nombre>/hoja_poses.png (revisión: boca detectada y cajas).
import json
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from importar_png import ALFA_MIN, RAIZ, caja, centroide, es_piel, leer  # noqa: E402

AREA_PIEZA = 5000  # px: lo que es menos se pega a la pose más cercana (dedos, aros sueltos)
PIES = 0.05  # franja de abajo (fracción del alto) para ubicar el centro de los pies


def poses_de(hoja, filas):
    a = (hoja[:, :, 3] > ALFA_MIN).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(a, 8)
    grandes = [i for i in range(1, n) if st[i][4] >= AREA_PIEZA]
    # Las motas se suman a la pose grande más cercana
    asignar = {i: i for i in grandes}
    for i in range(1, n):
        if i in asignar:
            continue
        asignar[i] = min(grandes, key=lambda g: (cen[g][0] - cen[i][0]) ** 2 + (cen[g][1] - cen[i][1]) ** 2)
    alto = hoja.shape[0]
    orden = sorted(grandes, key=lambda g: (int(cen[g][1] // (alto / filas)), cen[g][0]))
    salida = []
    for g in orden:
        m = np.isin(lab, [i for i, d in asignar.items() if d == g])
        m = cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        im = hoja.copy()
        im[~m] = 0
        x0, y0, x1, y1 = caja(im, 3)
        salida.append(im[y0:y1, x0:x1].copy())
    return salida


def boca_y_cabeza(im):
    """Cara (la mancha de piel más grande arriba), boca (hueco oscuro o rojo en la mitad de abajo de la cara) y caja de
    la cabeza (todo lo que está desde arriba hasta el mentón, cerca de la cara)."""
    h, w = im.shape[:2]
    piel = es_piel(im)
    arriba = np.zeros_like(piel)
    arriba[: int(0.42 * h)] = True
    n, lab, st, cen = cv2.connectedComponentsWithStats((piel & arriba).astype(np.uint8), 8)
    if n < 2:
        return None, None, None
    cara = 1 + int(np.argmax(st[1:, 4]))
    fx, fy, fw, fh, _ = st[cara]
    mcara = (lab == cara).astype(np.uint8)
    # El cuello sigue la piel de la cara: el mentón es el renglón donde la piel se angosta (debajo de lo más ancho)
    anchos = mcara.sum(axis=1)
    r_max = int(np.argmax(anchos))
    debajo = np.nonzero(anchos[r_max:] < 0.55 * anchos[r_max])[0]
    if len(debajo):
        fh = int(r_max + debajo[0] - fy)
        mcara[fy + fh:] = 0
    # Boca: el trazo más oscuro que la piel (o rojo) más ancho de la mitad de abajo de la cara, sin tocar el contorno
    # de la mandíbula (la sonrisa es una línea fina: no siempre queda encerrada por la piel)
    cerrada = cv2.morphologyEx(mcara, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    interior = cv2.erode(cerrada, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))) > 0
    hsv = cv2.cvtColor(np.ascontiguousarray(im[:, :, :3]), cv2.COLOR_RGB2HSV)
    v_piel = float(np.median(hsv[:, :, 2][mcara > 0]))
    rojo = ((hsv[:, :, 0] < 12) | (hsv[:, :, 0] > 160)) & (hsv[:, :, 1] > 80)
    oscuro = hsv[:, :, 2] < 0.72 * v_piel
    banda = np.zeros_like(interior)
    banda[int(fy + 0.52 * fh):int(fy + 0.95 * fh)] = True
    cand = (interior & banda & (oscuro | rojo) & (im[:, :, 3] > 200)).astype(np.uint8)
    nb, lb, sb, cb = cv2.connectedComponentsWithStats(cand, 8)
    mejor = None
    for i in range(1, nb):
        bx, by, bw, bh, ba = sb[i]
        if ba < 8 or bw < 0.07 * fw or bh > 0.35 * fh:
            continue
        if mejor is None or bw > mejor[0]:
            mejor = (bw, i)
    boca = None
    if mejor:
        i = mejor[1]
        bx, by, bw, bh, _ = sb[i]
        boca = {"mask": lb == i, "c": (float(cb[i][0]), float(cb[i][1])), "w": float(bw), "h": float(bh)}
    # Cabeza: de arriba hasta el mentón, en un ancho alrededor de la cara (pelo y gorro incluidos)
    y_menton = fy + fh
    x_a, x_b = max(0, int(fx - 0.7 * fw)), min(w, int(fx + fw + 0.7 * fw))
    banda = np.zeros_like(piel)
    banda[:y_menton, x_a:x_b] = im[:y_menton, x_a:x_b, 3] > 120
    cab = caja(np.dstack([im[:, :, :3], (banda * 255).astype(np.uint8)]), 3) if banda.any() else (fx, fy, fx + fw, fy + fh)
    return boca, cab, float(fw)


def sin_boca(im, boca):
    """La boca dibujada se pinta con el color de la piel de alrededor."""
    out = im.copy()
    m = cv2.dilate(boca["mask"].astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    anillo = (cv2.dilate(m.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0) & ~m & es_piel(im)
    if anillo.sum() < 5:
        return out
    color = np.median(im[anillo, :3], axis=0)
    suave = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.2)[:, :, None]
    out[:, :, :3] = (out[:, :, :3] * (1 - suave) + color * suave).astype(np.uint8)
    return out


def main():
    nombre = sys.argv[1]
    conf = json.load(open(os.path.join(RAIZ, "src", "personajes", nombre, "poses.json"), encoding="utf-8"))
    hojas = conf.get("hojas") or [{"hoja": conf["hoja"], "filas": conf.get("filas", 3), "nombres": conf["nombres"]}]
    poses, nombres = [], []
    for h in hojas:
        ps = poses_de(leer(h["hoja"]), h.get("filas", 3))
        if len(ps) != len(h["nombres"]):
            print(f"{os.path.basename(h['hoja'])}: tiene {len(ps)} poses y el mapa nombra {len(h['nombres'])}.", file=sys.stderr)
            sys.exit(1)
        poses += ps
        nombres += h["nombres"]
    # Escala común: ancho de la cara de la pose de referencia
    caras = [boca_y_cabeza(im)[2] for im in poses]
    ref = caras[nombres.index(conf.get("referencia", "neutra"))] if conf.get("referencia", "neutra") in nombres else caras[0]
    escalas = {}
    for i, (n, fw) in enumerate(zip(nombres, caras)):
        # Apagado por defecto: en las hojas de ChatGPT medir la cara da más ruido (~1,5 %) que la diferencia real (~1 %)
        k = ref / fw if fw and conf.get("igualarEscala", False) else 1.0
        if abs(k - 1) > 0.15:  # una diferencia tan grande es un error de medición (mano tapando la cara…)
            k = 1.0
        escalas[n] = round(k, 3)
        if abs(k - 1) > 0.01:
            poses[i] = cv2.resize(poses[i], None, fx=k, fy=k, interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_CUBIC)
    dir_pub = os.path.join(RAIZ, "public", "personajes", nombre)
    os.makedirs(os.path.join(dir_pub, "poses"), exist_ok=True)
    dir_rev = os.path.join(RAIZ, "out", "personajes", nombre)
    os.makedirs(dir_rev, exist_ok=True)
    # Bocas del kit (piezas.json del importador de piezas): para escalarlas a cada pose
    piezas = json.load(open(os.path.join(dir_pub, "piezas.json"), encoding="utf-8"))
    ancho_visema = piezas["visemas"]["A"]["w"] if "A" in piezas["visemas"] else None
    datos = {"version": 1, "personaje": nombre, "fuente": ", ".join(os.path.basename(h["hoja"]) for h in hojas), "poses": {}, "alertas": []}
    revision = []
    for n, im in zip(nombres, poses):
        h, w = im.shape[:2]
        pies = np.zeros(im.shape[:2], bool)
        pies[int((1 - PIES) * h):] = im[int((1 - PIES) * h):, :, 3] > 120
        ox = centroide(pies)[0]
        oy = float(h)
        boca, cab, _ = boca_y_cabeza(im)
        ruta = f"personajes/{nombre}/poses/{n}.png"
        Image.fromarray(im).save(os.path.join(RAIZ, "public", ruta), optimize=True)
        d = {
            "img": ruta,
            "x": round(-ox, 1),
            "y": round(-oy, 1),
            "w": w,
            "h": h,
            "cabeza": [round(cab[0] - ox, 1), round(cab[1] - oy, 1), round(cab[2] - ox, 1), round(cab[3] - oy, 1)],
        }
        if boca:
            sb = sin_boca(im, boca)
            ruta_sb = f"personajes/{nombre}/poses/{n}_sinboca.png"
            Image.fromarray(sb).save(os.path.join(RAIZ, "public", ruta_sb), optimize=True)
            d["sinBoca"] = ruta_sb
            d["boca"] = {"c": [round(boca["c"][0] - ox, 1), round(boca["c"][1] - oy, 1)], "w": round(boca["w"], 1)}
            if ancho_visema:
                d["boca"]["escala"] = round(boca["w"] / ancho_visema, 4)
        else:
            datos["alertas"].append(f"{n}: no encontré la boca (no va a hablar en esta pose).")
        datos["poses"][n] = d
        # Revisión: la pose con la caja de la cabeza (verde) y la boca (rojo)
        rv = Image.alpha_composite(Image.new("RGBA", (w, h), (230, 230, 230, 255)), Image.fromarray(sb if boca else im))
        dr = ImageDraw.Draw(rv)
        dr.rectangle(cab, outline=(0, 160, 0, 255), width=3)
        if boca:
            cx, cy = boca["c"]
            dr.ellipse([cx - boca["w"] / 2, cy - 6, cx + boca["w"] / 2, cy + 6], outline=(220, 0, 0, 255), width=2)
        dr.text((6, 6), n, fill=(0, 0, 0, 255))
        revision.append(rv)
    with open(os.path.join(dir_pub, "poses.json"), "w", encoding="utf-8") as fh:
        json.dump(datos, fh, ensure_ascii=False, indent=1)
    W = max(r.width for r in revision)
    H = max(r.height for r in revision)
    cols = 5
    hoja_r = Image.new("RGB", (W * cols, H * math.ceil(len(revision) / cols)), "white")
    for i, r in enumerate(revision):
        hoja_r.paste(r.convert("RGB"), ((i % cols) * W, (i // cols) * H))
    hoja_r.thumbnail((1500, 1500))
    hoja_r.save(os.path.join(dir_rev, "hoja_poses.png"))
    print(f"Listo: {len(poses)} poses de {nombre}. Escalas: " + ", ".join(f"{n} {k}" for n, k in escalas.items() if k != 1.0) + " " + " ".join(datos["alertas"]))


if __name__ == "__main__":
    main()
