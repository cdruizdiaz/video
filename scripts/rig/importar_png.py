#!/usr/bin/env python
# Importa un personaje desde hojas PNG con transparencia (kit pintado o hecho con IA) a la biblioteca de rigs.
# Es el equivalente de extraer_rig.py para personajes que no vienen en .ai: las piezas son imágenes.
#
#   python scripts/rig/importar_png.py <nombre>        (lee src/personajes/<nombre>/mapa_png.json)
#
# Hojas (ver mapa_png.json):
#   cuerpo  : el personaje armado + sus piezas sueltas (cabeza con cuello, torso, brazos, antebrazos, manos,
#             piernas, pies, accesorios). Cada pieza se busca dentro del armado (escala, giro y espejo) y ahí queda.
#   cabezas : la cabeza completa con cada expresión (grilla), incluida una "sin boca" y una con los ojos cerrados.
#   bocas   : bocas sueltas A–F (visemas para hablar), en ese orden de izquierda a derecha.
#   manos   : manos de gestos (variantes de la mano: señalar, pulgar…), de izquierda a derecha.
# Salida: public/personajes/<nombre>/piezas/*.png, piezas.json, rig.json (si no existe; si no, rig.propuesto.json)
# y hojas de revisión en out/personajes/<nombre>/ (armado contra reconstrucción, pivotes, caras y bocas).
import argparse
import json
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MARGEN = 120  # px alrededor del armado (las piezas tienen partes ocultas que se salen)
ALFA_MIN = 40  # umbral de alfa para separar piezas
AREA_MIN = 800  # px: menos que esto es una mota
FACTOR_GRUESO = 0.35  # escala de la búsqueda gruesa
PIEL_H = (78, 99)  # tono (0–180 de OpenCV) de la piel turquesa (el celeste de las rayas, ~103, queda afuera)
PIEL_S, PIEL_V = 90, 90


# ---------------------------------------------------------------- utilidades
def leer(ruta):
    return np.array(Image.open(ruta).convert("RGBA"))  # cv2 no abre rutas con tildes


def guardar(im, ruta):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    Image.fromarray(im).save(ruta, optimize=True)


def rgb_negro(im):
    return im[:, :, :3].astype(np.float32) * (im[:, :, 3:4].astype(np.float32) / 255.0)


def componentes(im):
    a = (im[:, :, 3] > ALFA_MIN).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(a, 8)
    out = []
    for i in range(1, n):
        x, y, w, h, area = st[i]
        if area < AREA_MIN:
            continue
        # La pieza con su borde suave (alfa bajo) pero sin pedazos de otras piezas
        m = cv2.dilate((lab == i).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        x0, y0 = max(0, x - 3), max(0, y - 3)
        x1, y1 = min(im.shape[1], x + w + 3), min(im.shape[0], y + h + 3)
        crop = im[y0:y1, x0:x1].copy()
        crop[~m[y0:y1, x0:x1]] = 0
        out.append({"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0), "c": (x + w / 2, y + h / 2), "img": crop, "area": int(area)})
    return out


def transformar(img, s, r, flip):
    """Escala s y gira r grados (horario) la pieza; devuelve la imagen recortada y la matriz pieza→imagen."""
    if flip:
        img = img[:, ::-1]
    h, w = img.shape[:2]
    lado = int(math.ceil(math.hypot(w, h) * s)) + 6
    M = cv2.getRotationMatrix2D((w / 2, h / 2), -r, s)
    M[0, 2] += lado / 2 - w / 2
    M[1, 2] += lado / 2 - h / 2
    out = cv2.warpAffine(img, M, (lado, lado), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    ys, xs = np.nonzero(out[:, :, 3] > 10)
    if not len(ys):
        return None, None
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    M[0, 2] -= x0
    M[1, 2] -= y0
    if flip:  # componer con el espejo: x' = w-1-x
        F = np.array([[-1, 0, w - 1], [0, 1, 0], [0, 0, 1]], np.float64)
        M = (np.vstack([M, [0, 0, 1]]) @ F)[:2]
    return out[y0:y1, x0:x1], M


def comparar(Argb, T):
    m = (T[:, :, 3] > 200).astype(np.uint8)
    m = cv2.erode(m, np.ones((3, 3), np.uint8))
    n = int(m.sum())
    if n < 30 or T.shape[0] >= Argb.shape[0] or T.shape[1] >= Argb.shape[1]:
        return None
    res = cv2.matchTemplate(Argb, rgb_negro(T), cv2.TM_SQDIFF, mask=np.dstack([m] * 3).astype(np.float32))
    res = np.nan_to_num(res, nan=1e18, posinf=1e18)
    mn, _, loc, _ = cv2.minMaxLoc(res)
    return mn / (n * 3), loc


CACHE = {}


def ubicar(A, P, escalas, giros, espejos):
    """Busca la pieza P dentro de A (con caché por contenido). Devuelve (error, matriz pieza→A, escala, giro, espejo)."""
    import hashlib
    k = hashlib.sha1(A.tobytes()[::97] + P.tobytes() + repr((list(escalas), list(giros), espejos)).encode()).hexdigest()
    if k in CACHE:
        e, M, s, r, f = CACHE[k]
        return e, np.array(M), s, r, f
    res = _ubicar(A, P, escalas, giros, espejos)
    if res:
        CACHE[k] = [float(res[0]), res[1].tolist(), float(res[2]), float(res[3]), bool(res[4])]
    return res


def _ubicar(A, P, escalas, giros, espejos):
    # 1) Grueso, a media resolución
    As = cv2.resize(A, None, fx=FACTOR_GRUESO, fy=FACTOR_GRUESO, interpolation=cv2.INTER_AREA)
    Argb = rgb_negro(As)
    mejor = None
    for f in espejos:
        for s in escalas:
            for r in giros:
                T, M = transformar(P, s * FACTOR_GRUESO, r, f)
                if T is None:
                    continue
                c = comparar(Argb, T)
                if c and (mejor is None or c[0] < mejor[0]):
                    mejor = (c[0], s, r, f, c[1])
    if mejor is None:
        return None
    _, s0, r0, f0, loc = mejor
    # 2) Fino, a resolución completa y en una ventana alrededor
    T0, _ = transformar(P, s0, r0, f0)
    cx, cy = loc[0] / FACTOR_GRUESO, loc[1] / FACTOR_GRUESO
    pad = 30
    x0, y0 = int(max(0, cx - pad)), int(max(0, cy - pad))
    x1, y1 = int(min(A.shape[1], cx + T0.shape[1] + pad)), int(min(A.shape[0], cy + T0.shape[0] + pad))
    sub = rgb_negro(A[y0:y1, x0:x1])
    fino = None
    for s in np.arange(s0 - 0.03, s0 + 0.031, 0.01):
        for r in np.arange(r0 - 3, r0 + 3.1, 1):
            T, M = transformar(P, s, r, f0)
            if T is None:
                continue
            c = comparar(sub, T)
            if c and (fino is None or c[0] < fino[0]):
                M = M.copy()
                M[0, 2] += x0 + c[1][0]
                M[1, 2] += y0 + c[1][1]
                fino = (c[0], M, s, r, f0)
    return fino


def colocar(P, M, forma):
    return cv2.warpAffine(P, M, (forma[1], forma[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))


def caja(im, umbral=10):
    ys, xs = np.nonzero(im[:, :, 3] > umbral)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1) if len(ys) else None


def centroide(mask):
    ys, xs = np.nonzero(mask)
    return (float(xs.mean()), float(ys.mean())) if len(ys) else None


def franja(im, desde, hasta):
    """Centroide de la franja vertical [desde, hasta] (fracciones del alto) de la pieza."""
    x0, y0, x1, y1 = caja(im, 120)
    h = y1 - y0
    m = np.zeros(im.shape[:2], bool)
    a, b = int(y0 + desde * h), int(y0 + hasta * h) + 1
    m[a:b] = im[a:b, :, 3] > 120
    return centroide(m)


def extremo(im, d, frac=0.1):
    """Centroide de la punta de la pieza en la dirección d (vector unitario)."""
    ys, xs = np.nonzero(im[:, :, 3] > 120)
    p = xs * d[0] + ys * d[1]
    lim = p.max() - frac * (p.max() - p.min())
    sel = p >= lim
    return float(xs[sel].mean()), float(ys[sel].mean())


def es_piel(im):
    hsv = cv2.cvtColor(np.ascontiguousarray(im[:, :, :3]), cv2.COLOR_RGB2HSV)
    return (hsv[:, :, 0] >= PIEL_H[0]) & (hsv[:, :, 0] <= PIEL_H[1]) & (hsv[:, :, 1] >= PIEL_S) & (hsv[:, :, 2] >= PIEL_V) & (im[:, :, 3] > 200)


def es_cian(im):
    """Turquesa en sentido amplio (piel con brillos y sombras): para separar la tela de los cilindros de unión."""
    hsv = cv2.cvtColor(np.ascontiguousarray(im[:, :, :3]), cv2.COLOR_RGB2HSV)
    return (hsv[:, :, 0] >= PIEL_H[0] - 4) & (hsv[:, :, 0] <= PIEL_H[1] + 1) & (hsv[:, :, 1] >= 45) & (im[:, :, 3] > 30)


def recortar_trazo(im, origen, ruta_pub, archivo):
    """Guarda la parte visible de im (en coords del lienzo) y devuelve el trazo de imagen en coords del personaje."""
    b = caja(im, 3)
    x0, y0, x1, y1 = b
    guardar(im[y0:y1, x0:x1], os.path.join(RAIZ, "public", ruta_pub, archivo))
    t = {"d": "", "img": f"{ruta_pub}/{archivo}", "x": round(x0 - origen[0], 1), "y": round(y0 - origen[1], 1), "w": x1 - x0, "h": y1 - y0}
    return t, [t["x"], t["y"], t["x"] + t["w"], t["y"] + t["h"]]


def grilla(comps, filas):
    alto = max(c["y"] + c["h"] for c in comps)
    return sorted(comps, key=lambda c: (int(c["c"][1] // (alto / filas + 1)), c["c"][0]))


def gris(im):
    return Image.alpha_composite(Image.new("RGBA", (im.shape[1], im.shape[0]), (225, 225, 225, 255)), Image.fromarray(im))


def redondear(im, P, d, retro=0.0):
    """Corta la punta de una extremidad (la "tapa" del cilindro de unión) y la reemplaza por media circunferencia
    del color de la pieza, sin contorno: dos piezas redondeadas del mismo color se superponen sin que se note el
    corte. P = la articulación; d = dirección (unitaria) desde el cuerpo de la pieza hacia P; el corte va a
    retro × ancho antes de P."""
    a = im[:, :, 3] > 120
    ys, xs = np.nonzero(a)
    if not len(ys):
        return
    proy = (xs - P[0]) * d[0] + (ys - P[1]) * d[1]
    perp = (xs - P[0]) * -d[1] + (ys - P[1]) * d[0]
    banda = (proy > -6) & (proy < 2)
    if banda.sum() < 5:
        return
    ancho = float(perp[banda].max() - perp[banda].min())
    corte = -retro * ancho
    banda = (proy > corte - 6) & (proy < corte + 2)  # el ancho y el eje, medidos en el corte
    if banda.sum() < 5:
        return
    ancho = float(perp[banda].max() - perp[banda].min())
    medio = float((perp[banda].max() + perp[banda].min()) / 2)
    # Color: mediana de una franja bien adentro (lejos de la tapa sombreada), cerca del eje (sin el contorno)
    cerca = (proy > corte - 1.6 * ancho) & (proy < corte - 0.7 * ancho) & (np.abs(perp - medio) < 0.25 * ancho)
    if cerca.sum() < 5:
        return
    color = np.median(im[ys[cerca], xs[cerca], :3], axis=0)
    # Borrar lo que queda más allá del corte
    H, W = a.shape
    YY, XX = np.mgrid[0:H, 0:W]
    pr = (XX - P[0]) * d[0] + (YY - P[1]) * d[1]
    pe = (XX - P[0]) * -d[1] + (YY - P[1]) * d[0]
    im[pr > corte] = 0
    # Media circunferencia (con borde suave) del lado de afuera
    r = ancho / 2 * 0.98
    dist = np.sqrt((pr - corte) ** 2 + (pe - medio) ** 2)
    disco = np.clip(r + 0.5 - dist, 0, 1) * (pr > corte - 1)
    sel = disco > 0
    im[sel, :3] = color.astype(np.uint8)
    im[sel, 3] = np.maximum(im[sel, 3], (disco[sel] * 255).astype(np.uint8))


def hoja_armado(A, final, zs, huesos, origen, cabeza, ruta):
    """El armado original (izquierda) contra la reconstrucción con las piezas y los pivotes (derecha)."""
    from PIL import ImageDraw
    rec = np.zeros_like(A)
    for k in sorted(final, key=lambda k: zs[k]):
        im = cabeza if k == "cabeza" else final[k]["img"]
        a = im[:, :, 3:4].astype(np.float32) / 255
        rec = (rec.astype(np.float32) * (1 - a) + im.astype(np.float32) * a).astype(np.uint8)
        rec[:, :, 3] = np.maximum(rec[:, :, 3], im[:, :, 3])
    hoja = Image.new("RGBA", (A.shape[1] * 2, A.shape[0]), (255, 255, 255, 255))
    hoja.paste(gris(A), (0, 0))
    r2 = gris(rec)
    dr = ImageDraw.Draw(r2)
    for h in huesos:
        x, y = h["pivote"][0] + origen[0], h["pivote"][1] + origen[1]
        dr.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(255, 0, 0, 255))
        dr.text((x + 8, y - 6), h["id"], fill=(160, 0, 0, 255))
    hoja.paste(r2, (A.shape[1], 0))
    ys, xs = np.nonzero((np.array(gris(A))[:, :, :3] != 225).any(axis=2) | (rec[:, :, 3] > 0))
    if len(ys):
        y0, y1, x0, x1 = max(0, ys.min() - 40), ys.max() + 40, max(0, xs.min() - 40), xs.max() + 40
        izq = hoja.crop((x0, y0, x1, y1))
        der = hoja.crop((A.shape[1] + x0, y0, A.shape[1] + x1, y1))
        hoja = Image.new("RGBA", (izq.width * 2, izq.height), (255, 255, 255, 255))
        hoja.paste(izq, (0, 0))
        hoja.paste(der, (izq.width, 0))
    hoja.thumbnail((900, 900))
    hoja.convert("RGB").save(ruta)


# ---------------------------------------------------------------- principal
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("nombre")
    args = ap.parse_args()
    nombre = args.nombre
    mapa = json.load(open(os.path.join(RAIZ, "src", "personajes", nombre, "mapa_png.json"), encoding="utf-8"))
    hojas = mapa["hojas"]
    ruta_pub = f"personajes/{nombre}/piezas"
    dir_pub = os.path.join(RAIZ, "public", "personajes", nombre)
    dir_rev = os.path.join(RAIZ, "out", "personajes", nombre)
    os.makedirs(dir_rev, exist_ok=True)
    ruta_cache = os.path.join(dir_rev, "cache_ubicaciones.json")
    if os.path.exists(ruta_cache):
        CACHE.update(json.load(open(ruta_cache)))
    alertas = []

    # ---- 1. Cuerpo: se arma como un títere, uniendo las articulaciones que traen dibujadas las piezas
    # (bolas de hombro y cadera y cuello en el torso; cilindros en codo, muñeca y tobillo). El armado de la hoja
    # queda solo como referencia (hoja_armado.png): la IA no lo dibuja con las mismas proporciones que las piezas.
    hoja = leer(hojas["cuerpo"])
    comps = componentes(hoja)

    def cerca(c):
        return min(comps, key=lambda k: (k["c"][0] - c[0]) ** 2 + (k["c"][1] - c[1]) ** 2)

    armado = cerca(mapa["cuerpo"]["armado"])
    sueltas = {pid: (cerca(conf["c"]), conf) for pid, conf in mapa["cuerpo"]["piezas"].items()}
    # _1/_2 → izq/der según la posición en la hoja (izq = a la izquierda de la pantalla)
    nombradas = {}
    grupos = {}
    for pid in sueltas:
        base = pid.rsplit("_", 1)[0] if pid[-2:] in ("_1", "_2") else pid
        grupos.setdefault(base, []).append(pid)
    for base, ids in grupos.items():
        if len(ids) == 2 and base in ("brazo", "antebrazo", "mano", "pierna", "pie"):
            ids.sort(key=lambda k: sueltas[k][0]["c"][0])
            nombradas[f"{base}_izq"], nombradas[f"{base}_der"] = sueltas[ids[0]], sueltas[ids[1]]
        else:
            for k in ids:
                nombradas[k] = sueltas[k]
    for k, (comp, conf) in nombradas.items():
        img = comp["img"]
        if conf.get("espejar"):
            img = img[:, ::-1].copy()
        if conf.get("escala", 1) != 1:
            img = cv2.resize(img, None, fx=conf["escala"], fy=conf["escala"], interpolation=cv2.INTER_AREA)
        comp["img"] = img

    W, H = 2400, 2400
    A = np.zeros((H, W, 4), np.uint8)  # lienzo
    pos = {}

    def img_de(k):
        return nombradas[k][0]["img"]

    def punto(k, desde, hasta):  # centroide de una franja de la pieza, en coords del lienzo
        c = franja(img_de(k), desde, hasta)
        return (c[0] + pos[k][0], c[1] + pos[k][1])

    def alto(k):
        b = caja(img_de(k), 120)
        return b[3] - b[1]

    def poner(k, ancla_local, destino):
        dx, dy = nombradas[k][1].get("dx", 0), nombradas[k][1].get("dy", 0)
        pos[k] = (int(round(destino[0] - ancla_local[0] + dx)), int(round(destino[1] - ancla_local[1] + dy)))

    solape = {"cabeza": 0.15, "antebrazo": 0.06, "mano": 0.06, "pierna": 0.2, "pie": 0.22, **mapa.get("solape", {})}
    # Torso en el centro del lienzo y sus uniones (manchas de piel)
    T = img_de("cuerpo")
    tx0, ty0, tx1, ty1 = caja(T, 120)
    tw, th, tcx = tx1 - tx0, ty1 - ty0, (tx0 + tx1) / 2
    pos["cuerpo"] = (W // 2 - int(tcx), 700 - ty0)
    piel = cv2.morphologyEx(es_piel(T).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(piel, 8)
    manchas = [(i, cen[i], st[i]) for i in range(1, n) if st[i][4] > 0.002 * tw * th]
    arriba = [m for m in manchas if m[1][1] < ty0 + 0.45 * th]
    cuello = min(arriba, key=lambda m: abs(m[1][0] - tcx) + 0.3 * (m[1][1] - ty0))
    costados = [m for m in arriba if m is not cuello and abs(m[1][0] - tcx) > 0.2 * tw]
    # Hombro de cada lado: la bola de más arriba (debajo de las mangas del torso suele haber otros muñones)
    hombros = [min(g, key=lambda m: m[1][1]) for g in ([m for m in costados if m[1][0] < tcx], [m for m in costados if m[1][0] >= tcx]) if g]
    caderas = sorted([m for m in manchas if m[1][1] > ty0 + 0.7 * th], key=lambda m: -m[2][4])[:2]
    if len(hombros) < 2:
        hombros = [(None, (tx0 + 0.1 * tw, ty0 + 0.15 * th), (0, 0, 0, int(0.1 * th), 0)), (None, (tx1 - 0.1 * tw, ty0 + 0.15 * th), (0, 0, 0, int(0.1 * th), 0))]
        alertas.append({"nivel": "aviso", "texto": "No encontré las bolas de los hombros en el torso: los ubiqué a ojo."})
    else:
        hombros = [hombros[0], hombros[-1]]
    if len(caderas) == 2:
        pcad = sorted([(c[1][0], c[1][1]) for c in caderas])
    elif len(caderas) == 1:
        c = caderas[0]
        pcad = [(c[1][0] - 0.25 * c[2][2], c[1][1]), (c[1][0] + 0.25 * c[2][2], c[1][1])]
    else:
        pcad = [(tcx - 0.22 * tw, ty1 - 0.05 * th), (tcx + 0.22 * tw, ty1 - 0.05 * th)]
        alertas.append({"nivel": "aviso", "texto": "No encontré las caderas en el torso: las ubiqué a ojo."})
    if mapa["cuerpo"].get("borrarCaderas", True):
        # Lo que el torso tiene debajo del ruedo (bolas de la cadera, el "fondo" claro) quedaría a la vista sobre el
        # pantalón: en cada columna se borra todo lo que está debajo de la tela más baja
        hsv = cv2.cvtColor(np.ascontiguousarray(T[:, :, :3]), cv2.COLOR_RGB2HSV)
        cian = (hsv[:, :, 0] >= PIEL_H[0]) & (hsv[:, :, 0] <= PIEL_H[1]) & (hsv[:, :, 1] >= 60)
        tela = (T[:, :, 3] > 120) & ~cian
        tela[: int(ty0 + 0.5 * th)] = False
        tela = cv2.morphologyEx(tela.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
        # el ruedo: la fila más baja donde la tela ocupa al menos la mitad del ancho de la remera
        filas = np.nonzero(tela.sum(axis=1) > 0.5 * tw)[0]
        if len(filas):
            T[filas.max() + 2:] = 0
    ids_hombros = {h[0] for h in hombros if h[0] is not None}
    munones = [m for m in manchas if m is not cuello and m[0] not in ids_hombros and ty0 + 0.2 * th < m[1][1] < ty0 + 0.7 * th and abs(m[1][0] - tcx) > 0.2 * tw]
    munon = {}
    for lado_, sel_ in (("izq", [m for m in munones if m[1][0] < tcx]), ("der", [m for m in munones if m[1][0] >= tcx])):
        if sel_:
            m_ = max(sel_, key=lambda m: m[2][4])
            munon[lado_] = (float(m_[1][0]), float(m_[2][1]))  # centro en x, borde de arriba
    if mapa["cuerpo"].get("borrarPielTorso", False):
        # Bolas de los hombros y muñones debajo de las mangas: los brazos salen de abajo de la manga del torso
        borradas = np.zeros(T.shape[:2], bool)
        for m in manchas:
            if m is not cuello and m[1][1] < ty0 + 0.7 * th:
                es_bola = m[0] in ids_hombros
                z_ = cv2.dilate((lab == m[0]).astype(np.uint8), np.ones((13, 13) if es_bola else (5, 5), np.uint8)) > 0
                T[z_] = 0
                if es_bola:  # solo el hueco de las bolas se rellena; el de los muñones queda abierto (ahí sale el brazo)
                    borradas |= z_
        # El hueco que queda dentro de la silueta de la prenda se rellena con la tela (inpaint)
        tela_t = ((T[:, :, 3] > 120) & ~es_cian(T)).astype(np.uint8)
        casco = np.zeros_like(tela_t)
        cnts, _ = cv2.findContours(tela_t, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            cv2.fillPoly(casco, [cv2.convexHull(np.vstack(cnts))], 1)
        hueco = borradas & (casco > 0)
        if hueco.any():
            # Se rellena copiando, columna por columna, la primera tela clara que hay debajo del hueco: las rayas y los
            # pliegues verticales siguen solos (un color liso dejaba un parche)
            v = cv2.cvtColor(np.ascontiguousarray(T[:, :, :3]), cv2.COLOR_RGB2HSV)[:, :, 2]
            fuente = (T[:, :, 3] > 200) & (tela_t > 0) & (v > 90) & ~hueco
            ys_h, xs_h = np.nonzero(hueco)
            for x in np.unique(xs_h):
                col = ys_h[xs_h == x]
                abajo = np.nonzero(fuente[col.max() + 1:, x])[0]
                if not len(abajo):
                    continue
                y_f = col.max() + 1 + abajo[0] + 3  # un poco más adentro (lejos del borde)
                y_f = min(y_f, T.shape[0] - 1)
                T[col, x, :3] = T[y_f, x, :3]
                T[col, x, 3] = 255
    if mapa["cuerpo"].get("recortarMangas", False):
        # Las mangas cortas del torso se superponen con las de los brazos: queda solo el ancho de la remera
        bx = caja(T, 120)
        y_a, y_b = int(bx[1] + 0.5 * (bx[3] - bx[1])), int(bx[1] + 0.85 * (bx[3] - bx[1]))
        fil = (T[y_a:y_b, :, 3] > 120) & ~es_piel(T[y_a:y_b])  # el ancho de la remera debajo de las mangas
        xs = np.nonzero(fil.mean(axis=0) > 0.5)[0]
        mg = int(mapa["cuerpo"].get("margenMangas", 0.05) * tw)
        T[:, : max(0, xs.min() - mg)] = 0
        T[:, xs.max() + mg:] = 0
    ruedo = caja(T, 120)[3]  # borde de abajo de la remera
    L = lambda p: (p[0] + pos["cuerpo"][0], p[1] + pos["cuerpo"][1])  # torso → lienzo
    p_cuello = L(cuello[1])
    p_hombro = {"izq": L(hombros[0][1]), "der": L(hombros[1][1])}
    alto_bola = {"izq": hombros[0][2][3], "der": hombros[1][2][3]}
    p_cadera = {"izq": L(pcad[0]), "der": L(pcad[1])}
    p_munon = {k: L(v) for k, v in munon.items()}

    # Cabeza: el cuello entra en el del torso
    poner("cabeza", franja(img_de("cabeza"), 0.94, 1.0), (p_cuello[0], p_cuello[1] + solape["cabeza"] * alto("cabeza")))
    for lado in ("izq", "der"):
        b, ab, m, pi, pie = (f"{x}_{lado}" for x in ("brazo", "antebrazo", "mano", "pierna", "pie"))
        if b in nombradas:
            ib = img_de(b)
            bb = caja(ib, 120)
            arriba_b = np.zeros(ib.shape[:2], bool)
            arriba_b[bb[1]:int(bb[1] + 0.25 * (bb[3] - bb[1]))] = True
            bola = es_piel(ib) & arriba_b
            if bola.sum() > 50:  # la bola del hombro del brazo va sobre la del torso, y después se borra
                poner(b, centroide(bola), p_hombro[lado])
                if mapa["cuerpo"].get("brazoSinManga", False):
                    # Solo la piel que sale de abajo de la manga (la manga es la del torso)
                    hsv = cv2.cvtColor(np.ascontiguousarray(ib[:, :, :3]), cv2.COLOR_RGB2HSV)
                    cian = (hsv[:, :, 0] >= PIEL_H[0]) & (hsv[:, :, 0] <= PIEL_H[1]) & (hsv[:, :, 1] >= 60)
                    tela = (ib[:, :, 3] > 120) & ~cian
                    tela[int(bb[1] + 0.7 * (bb[3] - bb[1])):] = False
                    filas = np.nonzero(tela.sum(axis=1) > 3)[0]
                    if len(filas):
                        ib[: filas.max() + 3] = 0
                    if mapa["cuerpo"].get("anclaMunon", False) and lado in p_munon:
                        # El brazo sale de donde el torso tenía el muñón (debajo de su manga), un poco metido adentro
                        dest = p_munon[lado]
                        poner(b, franja(ib, 0.0, 0.05), (dest[0], dest[1] - mapa["cuerpo"].get("metidoMunon", 0.03) * alto(b)))
                if mapa["cuerpo"].get("pintarBolaHombro", False):
                    # La bola del hombro se borra; el hueco que deja dentro de la silueta de la manga se rellena con la tela
                    zona = cv2.dilate(bola.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
                    hsv = cv2.cvtColor(np.ascontiguousarray(ib[:, :, :3]), cv2.COLOR_RGB2HSV)
                    cian = (hsv[:, :, 0] >= PIEL_H[0]) & (hsv[:, :, 0] <= PIEL_H[1]) & (hsv[:, :, 1] >= 60)
                    tela = ((ib[:, :, 3] > 120) & ~cian & ~zona & arriba_b).astype(np.uint8)
                    casco = np.zeros_like(tela)
                    cnts, _ = cv2.findContours(tela, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    if cnts:
                        cv2.fillPoly(casco, [cv2.convexHull(np.vstack(cnts))], 1)
                    hueco = (zona & (casco > 0)).astype(np.uint8)
                    rgb = cv2.inpaint(np.ascontiguousarray(ib[:, :, :3]), hueco, 5, cv2.INPAINT_TELEA)
                    fuera = zona & (casco == 0)
                    ib[fuera] = 0
                    ib[hueco > 0, :3] = rgb[hueco > 0]
                    ib[hueco > 0, 3] = 255
            else:
                poner(b, franja(ib, 0.0, 0.08), (p_hombro[lado][0], p_hombro[lado][1] - 0.45 * alto_bola[lado]))
            if ab in nombradas and mapa["cuerpo"].get("codoTela", False):
                # Mangas largas: el codo es tela con tela (se borran los cilindros de piel del codo)
                tramos = [(b, 0.6, 1.0), (ab, 0.0, 0.4)]
                if mapa["cuerpo"].get("munecaTela", False):
                    tramos.append((ab, 0.6, 1.0))  # el puño de la manga tapa la muñeca: fuera el cilindro de piel
                for k_, desde, hasta in tramos:
                    im_ = img_de(k_)
                    c_ = caja(im_, 120)
                    sel = np.zeros(im_.shape[:2], bool)
                    sel[int(c_[1] + desde * (c_[3] - c_[1])):int(c_[1] + hasta * (c_[3] - c_[1])) + 1] = True
                    im_[cv2.dilate((es_piel(im_) & sel).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0] = 0
            if ab in nombradas:
                fin = punto(b, 0.93, 1.0)
                poner(ab, franja(img_de(ab), 0.0, 0.08), (fin[0], fin[1] - solape["antebrazo"] * alto(ab)))
                if m in nombradas:
                    fin = punto(ab, 0.93, 1.0)
                    poner(m, franja(img_de(m), 0.0, 0.08), (fin[0], fin[1] - solape["mano"] * alto(m)))
        if pi in nombradas:
            ip = img_de(pi)
            tela = (ip[:, :, 3] > 120) & ~es_cian(ip)  # el pantalón sin el cilindro de la cadera
            tela = cv2.morphologyEx(tela.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
            ys_t = np.nonzero(tela.any(axis=1))[0]
            y_cint = ys_t.min() if len(ys_t) else caja(ip, 120)[1]
            banda = np.zeros_like(tela)
            banda[y_cint:y_cint + 12] = tela[y_cint:y_cint + 12]
            cx_cint = centroide(banda)[0] if banda.any() else franja(ip, 0, 0.06)[0]
            ip[: max(0, y_cint - 2)] = 0  # el cilindro de la cadera no hace falta
            poner(pi, (cx_cint, y_cint), (p_cadera[lado][0], pos["cuerpo"][1] + ruedo - solape["pierna"] * alto(pi)))
            if pie in nombradas:
                fin = punto(pi, 0.95, 1.0)
                poner(pie, franja(img_de(pie), 0.0, 0.08), (fin[0], fin[1] - solape["pie"] * alto(pie)))
    # Piezas sueltas con unión explícita en el mapa: {"a": "cuello" | <pieza>, "en": [fx, fy] de la caja de destino,
    # "ancla": [fx, fy] de la caja propia}
    for k, (comp, conf) in nombradas.items():
        if k in pos or "a" not in conf:
            continue
        if conf["a"] == "cuello":
            dest = p_cuello
        else:
            cx0, cy0, cx1, cy1 = caja(img_de(conf["a"]), 120)
            ox, oy = pos[conf["a"]]
            fx, fy = conf.get("en", [0.5, 0.5])
            dest = (ox + cx0 + fx * (cx1 - cx0), oy + cy0 + fy * (cy1 - cy0))
        fa = conf.get("ancla", [0.5, 0.0])
        ax0, ay0, ax1, ay1 = caja(comp["img"], 120)
        poner(k, (ax0 + fa[0] * (ax1 - ax0), ay0 + fa[1] * (ay1 - ay0)), dest)
    final = {}
    for k, (comp, conf) in nombradas.items():
        if k not in pos:
            alertas.append({"nivel": "error", "texto": f"{k}: no sé dónde va (falta su unión en el mapa)."})
            continue
        M = np.array([[1, 0, pos[k][0]], [0, 1, pos[k][1]]], np.float64)
        final[k] = {"img": colocar(comp["img"], M, A.shape), "err": 0, "s": conf.get("escala", 1), "rot": 0, "espejo": bool(conf.get("espejar")), "rol": conf["rol"], "hueso": conf.get("hueso")}
    ml = mapa["cuerpo"].get("mangaLarga")
    if ml:
        color = np.array([int(ml["color"][i:i + 2], 16) for i in (1, 3, 5)], np.float32)
        for k, d in final.items():
            if d["rol"] not in ml.get("roles", ["brazo", "antebrazo"]):
                continue
            im = d["img"]
            m = es_cian(im) & (im[:, :, 3] > 0)
            if not m.any():
                continue
            v = cv2.cvtColor(np.ascontiguousarray(im[:, :, :3]), cv2.COLOR_RGB2HSV)[:, :, 2].astype(np.float32)
            k_ = np.clip(v / max(1.0, float(np.median(v[m]))), 0.45, 1.5)[:, :, None]
            im[m, :3] = np.clip(color * k_[m], 0, 255).astype(np.uint8)
    orden = mapa["cuerpo"]["orden"]
    faltan = [k for k in final if k not in orden]
    if faltan:
        alertas.append({"nivel": "aviso", "texto": f"Sin orden de capas (van adelante): {', '.join(faltan)}."})
    zs = {k: i * 2 for i, k in enumerate([k for k in orden if k in final] + faltan)}
    # Referencia para la hoja de revisión: el armado de la hoja, con los pies a la altura de los de la reconstrucción
    REF = np.zeros_like(A)
    ah, aw = armado["img"].shape[:2]
    piso_rec = max(caja(final[k]["img"], 120)[3] for k in final if final[k]["rol"] == "pie")
    y0r = max(0, piso_rec - ah)
    REF[y0r:y0r + ah, W // 2 - aw // 2:W // 2 - aw // 2 + aw] = armado["img"][: H - y0r]

    # Origen: en el piso, entre los pies
    pies = [final[k]["img"] for k in final if final[k]["rol"] == "pie"]
    piso = max(caja(p, 120)[3] for p in pies)
    origen = (float(np.mean([centroide(p[:, :, 3] > 120)[0] for p in pies])), float(piso))

    def pc(p):
        return [round(p[0] - origen[0], 1), round(p[1] - origen[1], 1)]

    # Huesos: pivotes en las uniones
    huesos = [{"id": "raiz", "padre": None, "pivote": [0, 0]}]
    huesos.append({"id": "cuerpo", "padre": "raiz", "pivote": pc(((p_cadera["izq"][0] + p_cadera["der"][0]) / 2, (p_cadera["izq"][1] + p_cadera["der"][1]) / 2))})
    huesos.append({"id": "cabeza", "padre": "cuerpo", "pivote": pc(p_cuello)})

    def tope(k, f):  # punto en el eje de la pieza, a f de su alto desde arriba
        c = franja(final[k]["img"], 0.0, 0.08)
        b = caja(final[k]["img"], 120)
        return (c[0], b[1] + f * (b[3] - b[1]))

    for lado in ("izq", "der"):
        b, ab, m, pi, pie = (f"{x}_{lado}" for x in ("brazo", "antebrazo", "mano", "pierna", "pie"))
        if b in final:
            # Con el brazo anclado al muñón, gira desde ahí (la boca de la manga), no desde la bola del hombro
            piv_b = p_munon[lado] if mapa["cuerpo"].get("anclaMunon", False) and lado in p_munon else p_hombro[lado]
            huesos.append({"id": b, "padre": "cuerpo", "pivote": pc(piv_b)})
            if ab in final:
                huesos.append({"id": ab, "padre": b, "pivote": pc(tope(ab, 0.07))})
                if m in final:
                    huesos.append({"id": m, "padre": ab, "pivote": pc(tope(m, 0.07))})
        if pi in final:
            huesos.append({"id": pi, "padre": "raiz", "pivote": pc(tope(pi, 0.04))})
            if pie in final:
                huesos.append({"id": pie, "padre": pi, "pivote": pc(tope(pie, 0.12))})
    hueso_de = {}
    for k, d in final.items():
        if any(h["id"] == k for h in huesos):
            hueso_de[k] = k
        else:
            hueso_de[k] = d.get("hueso") or "cuerpo"

    with open(ruta_cache, "w") as fh:
        json.dump(CACHE, fh)
    hoja_armado(REF, final, zs, huesos, origen, final["cabeza"]["img"], os.path.join(dir_rev, "hoja_armado.png"))

    # Codos y muñecas: puntas redondeadas del color de la pieza (sin las tapas de los cilindros)
    piv = {h["id"]: (h["pivote"][0] + origen[0], h["pivote"][1] + origen[1]) for h in huesos}
    for lado in ("izq", "der"):
        for padre, hijo in ((f"brazo_{lado}", f"antebrazo_{lado}"), (f"antebrazo_{lado}", f"mano_{lado}")):
            if padre not in final or hijo not in final or hijo not in piv:
                continue
            P = piv[hijo]
            if (padre.startswith("brazo") and "codo" not in mapa["cuerpo"].get("redondear", ["codo", "muneca"])) or (
                padre.startswith("antebrazo") and "muneca" not in mapa["cuerpo"].get("redondear", ["codo", "muneca"])
            ):
                continue
            for k, retro in ((padre, mapa["cuerpo"].get("retroPadre", 0.2)), (hijo, mapa["cuerpo"].get("retroHijo", 0.6))):
                c = centroide(final[k]["img"][:, :, 3] > 120)
                d = np.array(P) - np.array(c)
                d /= np.linalg.norm(d) + 1e-9
                redondear(final[k]["img"], P, d, retro)

    # Piezas (la cabeza se dibuja con el rostro: su pieza queda vacía, solo con la caja)
    piezas = []
    for k, d in final.items():
        if k == "cabeza":
            continue
        t, cj = recortar_trazo(d["img"], origen, ruta_pub, f"{k}.png")
        piezas.append({"id": k, "rol": d["rol"], "z": zs[k], "caja": cj, "dibujos": [], "de": "png", "trazos": [t]})

    # ---- 2. Cabezas (expresiones), alineadas a la cabeza del armado
    nombres = mapa["cabezas"]["nombres"]
    ch = grilla(componentes(leer(hojas["cabezas"])), mapa["cabezas"].get("filas", 3))
    if len(ch) != len(nombres):
        alertas.append({"nivel": "error", "texto": f"La hoja de cabezas tiene {len(ch)} cabezas y el mapa nombra {len(nombres)}."})
    # Se busca cada cabeza en un recorte alrededor de la cabeza del cuerpo (más rápido que en todo el lienzo)
    bx0, by0, bx1, by1 = caja(final["cabeza"]["img"], 3)
    rx0, ry0 = max(0, bx0 - 150), max(0, by0 - 150)
    cab_ref = final["cabeza"]["img"][ry0:by1 + 150, rx0:bx1 + 150]
    cabezas = {}
    for n, c in zip(nombres, ch):
        r = ubicar(cab_ref, c["img"], np.arange(0.8, 1.31, 0.03), [-4, -2, 0, 2, 4], [False])
        err, M = r[0], r[1].copy()
        M[0, 2] += rx0
        M[1, 2] += ry0
        cabezas[n] = colocar(c["img"], M, A.shape)
        print(f"  cabeza {n:14s} error {err:7.1f}  escala {r[2]:.2f}")
    sin = cabezas[mapa["cabezas"]["sinBoca"]]
    piel_sin = cv2.erode(es_piel(sin).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    normal = cabezas[mapa["cabezas"]["normal"]]
    hx0, hy0, hx1, hy1 = caja(normal, 120)
    hw = hx1 - hx0

    def boca_de(im, cerca_de=None):
        m = piel_sin & ~es_piel(im) & (im[:, :, 3] > 200)
        m = m.astype(np.uint8)
        n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
        sel = np.zeros_like(m, bool)
        for i in range(1, n):
            if st[i][4] < 12:
                continue
            if cerca_de is None or math.hypot(cen[i][0] - cerca_de[0], cen[i][1] - cerca_de[1]) < 0.16 * hw:
                sel |= lab == i
        return sel

    # La boca de la expresión normal: la mancha más grande de la mitad de abajo de la cara
    mb = boca_de(normal)
    n_, lab_, st_, cen_ = cv2.connectedComponentsWithStats(mb.astype(np.uint8), 8)
    cands = [i for i in range(1, n_) if cen_[i][1] > hy0 + 0.45 * (hy1 - hy0)]
    if not cands:
        print("No encontré la boca de la expresión normal.", file=sys.stderr)
        sys.exit(1)
    ib = max(cands, key=lambda i: st_[i][4])
    c_boca = (float(cen_[ib][0]), float(cen_[ib][1]))
    ancho_boca = float(st_[ib][2])

    rostros = {}
    pluma = mapa["cabezas"].get("pluma", 5)
    for n, im in cabezas.items():
        if n == mapa["cabezas"]["sinBoca"]:
            continue
        mk = boca_de(im, c_boca)
        cb = centroide(mk) or c_boca
        mk = cv2.dilate(mk.astype(np.uint8), np.ones((9, 9), np.uint8))
        suave = cv2.GaussianBlur(mk.astype(np.float32), (0, 0), pluma)[:, :, None]
        sb = (im.astype(np.float32) * (1 - suave) + sin.astype(np.float32) * suave).astype(np.uint8)
        t, cj = recortar_trazo(im, origen, ruta_pub, f"cabeza_{n}.png")
        ts, _ = recortar_trazo(sb, origen, ruta_pub, f"cabeza_{n}_sinboca.png")
        bw = max(8.0, ancho_boca)
        rostros[n] = {
            "ojos": [],
            "boca": {"trazos": [], "caja": [round(cb[0] - origen[0] - bw / 2, 1), round(cb[1] - origen[1] - bw / 4, 1), round(cb[0] - origen[0] + bw / 2, 1), round(cb[1] - origen[1] + bw / 4, 1)], "c": pc(cb)},
            "extras": {"trazos": [t]},
            "sinBoca": {"trazos": [ts]},
            "de": "png",
        }
        if n == mapa["cabezas"]["normal"]:
            caja_cabeza = cj
    # Parpadeo: parche de ojos cerrados (la zona de los ojos de la cabeza con los ojos cerrados)
    cer = cabezas[mapa["cabezas"]["cerrados"]]
    zona = np.zeros(cer.shape[:2], bool)
    zona[int(hy0 + 0.15 * (hy1 - hy0)):int(c_boca[1] - 0.1 * (hy1 - hy0)), hx0:hx1] = True
    pn, pc_ = es_piel(normal), es_piel(cer)
    mo = ((pn != pc_) & zona & (normal[:, :, 3] > 200) & (cer[:, :, 3] > 200)).astype(np.uint8)
    mo = cv2.morphologyEx(mo, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    mo = cv2.dilate(mo, np.ones((11, 11), np.uint8))
    suave = cv2.GaussianBlur(mo.astype(np.float32), (0, 0), pluma)
    parche = cer.copy()
    parche[:, :, 3] = (parche[:, :, 3].astype(np.float32) * suave).astype(np.uint8)
    if caja(parche, 3):
        tp, _ = recortar_trazo(parche, origen, ruta_pub, "ojos_cerrados.png")
        for r in rostros.values():
            r["cerrados"] = {"trazos": [tp]}
    else:
        alertas.append({"nivel": "aviso", "texto": "No pude armar el parche de ojos cerrados: no hay parpadeo."})
    rostros["base"] = rostros[mapa["cabezas"]["normal"]]

    # ---- 3. Bocas (visemas), del tamaño de la boca normal
    visemas = {}
    if "bocas" in hojas:
        bocas = sorted(componentes(leer(hojas["bocas"])), key=lambda c: c["c"][0])
        letras = mapa.get("bocas", ["A", "B", "C", "D", "E", "F"])
        cerrada = bocas[letras.index("A")] if "A" in letras else bocas[0]
        esc = ancho_boca / cerrada["w"] * mapa.get("escalaBocas", 1.0)
        for L, b in zip(letras, bocas):
            im = cv2.resize(b["img"], None, fx=esc, fy=esc, interpolation=cv2.INTER_AREA)
            x0, y0, x1, y1 = caja(im, 3)
            im = im[y0:y1, x0:x1]
            guardar(im, os.path.join(RAIZ, "public", ruta_pub, f"boca_{L}.png"))
            w, h = im.shape[1], im.shape[0]
            visemas[L] = {"trazos": [{"d": "", "img": f"{ruta_pub}/boca_{L}.png", "x": -w / 2, "y": -h / 2, "w": w, "h": h}], "w": w, "h": h, "de": "png"}

    # ---- 4. Manos de gestos (variantes de mano_izq / mano_der)
    variantes = {}
    if "manos" in hojas:
        dirs = {"izq": (-1, 0), "der": (1, 0), "abajo": (0, 1), "arriba": (0, -1), "abajo-izq": (-0.7, 0.7), "abajo-der": (0.7, 0.7), "arriba-izq": (-0.7, -0.7), "arriba-der": (0.7, -0.7)}
        manos = sorted(componentes(leer(hojas["manos"])), key=lambda c: c["c"][0])
        conf_m = mapa["manos"]
        ref = next((m for m, c in zip(manos, conf_m) if c.get("referencia")), manos[0])
        for lado in ("izq", "der"):
            mid = f"mano_{lado}"
            if mid not in final:
                continue
            mp = final[mid]["img"]
            muneca = next(h["pivote"] for h in huesos if h["id"] == mid)
            w_m = (muneca[0] + origen[0], muneca[1] + origen[1])
            cm = centroide(mp[:, :, 3] > 120)
            d_p = np.array(cm) - np.array(w_m)
            d_p /= np.linalg.norm(d_p) + 1e-9
            punta_p = extremo(mp, -d_p, 0.06)  # punta del cilindro de la muñeca
            esc = math.sqrt((mp[:, :, 3] > 120).sum() / max(1, ref["area"]))
            for m, c in zip(manos, conf_m):
                g = m["img"]
                dg = np.array(dirs[c["muneca"]], float)
                dg /= np.linalg.norm(dg)
                wg = extremo(g, dg, 0.06)
                cg = centroide(g[:, :, 3] > 120)
                v = np.array(cg) - np.array(wg)
                ang = math.degrees(math.atan2(d_p[1], d_p[0]) - math.atan2(v[1], v[0]))
                M = cv2.getRotationMatrix2D(wg, -ang, esc)
                M[0, 2] += punta_p[0] - wg[0]
                M[1, 2] += punta_p[1] - wg[1]
                im = colocar(g, M, A.shape)
                cg2 = centroide(im[:, :, 3] > 120)
                dv = np.array(w_m) - np.array(cg2)
                redondear(im, w_m, dv / (np.linalg.norm(dv) + 1e-9), mapa["cuerpo"].get("retroHijo", 0.6))
                t, cj = recortar_trazo(im, origen, ruta_pub, f"{mid}_{c['nombre']}.png")
                variantes[f"{mid}:{c['nombre']}"] = {"trazos": [t], "caja": cj}

    # ---- 5. Escribir
    ys = [p["caja"] for p in piezas] + [caja_cabeza]
    caja_vista = [min(c[0] for c in ys), min(c[1] for c in ys), max(c[2] for c in ys), max(c[3] for c in ys)]
    z_cabeza = zs.get("cabeza", max(zs.values()) + 2)
    piezas.append({"id": "cabeza", "rol": "cabeza", "z": z_cabeza, "caja": caja_cabeza, "dibujos": [], "de": "png", "trazos": []})
    piezas.sort(key=lambda p: p["z"])
    datos = {
        "version": 1,
        "nombre": nombre,
        "fuente": os.path.basename(hojas["cuerpo"]),
        "unidad": "px",
        "bloques": [],
        "vistas": {"frente": {"caja": caja_vista, "origenPagina": [round(origen[0] - MARGEN + armado["x"], 1), round(origen[1] - MARGEN + armado["y"], 1)], "piezas": piezas, "cabeza": {"id": "cabeza", "caja": caja_cabeza, "z": z_cabeza}, "rostro": rostros["base"], "variantes": variantes}},
        "rostros": rostros,
        "visemas": visemas,
        "accesorios": {},
        "alertas": alertas,
    }
    with open(os.path.join(dir_pub, "piezas.json"), "w", encoding="utf-8") as fh:
        json.dump(datos, fh, ensure_ascii=False, indent=1)
    rig = {"version": 1, "personaje": nombre, "vistas": {"frente": {"huesos": huesos, "piezas": {p["id"]: hueso_de.get(p["id"], "cuerpo") for p in piezas}, "rostro": {"hueso": "cabeza"}, "mano": "mano_der"}}}
    ruta_rig = os.path.join(dir_pub, "rig.json")
    if os.path.exists(ruta_rig):
        ruta_rig = os.path.join(dir_pub, "rig.propuesto.json")
    with open(ruta_rig, "w", encoding="utf-8") as fh:
        json.dump(rig, fh, ensure_ascii=False, indent=1)

    with open(ruta_cache, "w") as fh:
        json.dump(CACHE, fh)
    # ---- 6. Hojas de revisión
    hoja_armado(REF, final, zs, huesos, origen, cabezas[mapa["cabezas"]["normal"]], os.path.join(dir_rev, "hoja_armado.png"))
    # Caras: cada expresión, su versión sin boca con la boca D, y el parpadeo
    tiles = []
    for n in rostros:
        if n == "base":
            continue
        x0, y0, x1, y1 = caja(cabezas[n], 3)
        t1 = gris(cabezas[n][y0:y1, x0:x1])
        sb = np.array(Image.open(os.path.join(RAIZ, "public", ruta_pub, f"cabeza_{n}_sinboca.png")))
        t2 = Image.fromarray(np.zeros((y1 - y0, x1 - x0, 4), np.uint8))
        bx, by = rostros[n]["extras"]["trazos"][0]["x"], rostros[n]["extras"]["trazos"][0]["y"]
        sx, sy = rostros[n]["sinBoca"]["trazos"][0]["x"], rostros[n]["sinBoca"]["trazos"][0]["y"]
        t2.alpha_composite(Image.fromarray(sb), (int(sx - bx), int(sy - by)))
        if "D" in visemas:
            bd = Image.open(os.path.join(RAIZ, "public", ruta_pub, "boca_D.png"))
            cx, cy = rostros[n]["boca"]["c"]
            t2.alpha_composite(bd, (int(cx - bx - bd.width / 2), int(cy - by - bd.height / 2)))
        t2 = gris(np.array(t2))
        fila = Image.new("RGBA", (t1.width * 2, t1.height), (255, 255, 255, 255))
        fila.paste(t1, (0, 0))
        fila.paste(t2, (t1.width, 0))
        tiles.append(fila)
    if tiles:
        W = max(t.width for t in tiles)
        H = max(t.height for t in tiles)
        cols = 4
        hoja_c = Image.new("RGBA", (W * cols, H * math.ceil(len(tiles) / cols)), (255, 255, 255, 255))
        for i, t in enumerate(tiles):
            hoja_c.paste(t, ((i % cols) * W, (i // cols) * H))
        hoja_c.thumbnail((900, 900))
        hoja_c.convert("RGB").save(os.path.join(dir_rev, "hoja_rostros.png"))
    with open(os.path.join(dir_rev, "informe.md"), "w", encoding="utf-8") as fh:
        fh.write(f"# {nombre} (importado de PNG)\n\n")
        for k in sorted(final, key=lambda k: zs[k]):
            d = final[k]
            fh.write(f"- {k}: z {zs[k]}, error {d['err']:.0f}, escala {d['s']:.2f}, giro {d['rot']:+.0f}, espejo {d['espejo']}\n")
        fh.write(f"\nRostros: {', '.join(rostros)}\nVisemas: {', '.join(visemas)}\nVariantes: {', '.join(variantes)}\n\n")
        for a in alertas:
            fh.write(f"- **{a['nivel']}**: {a['texto']} {a.get('propuesta', '')}\n")
    print(f"Listo: {len(piezas)} piezas, {len(rostros)} rostros, {len(visemas)} bocas, {len(variantes)} variantes. Rig en {os.path.basename(ruta_rig)}.")
    for a in alertas:
        print(f"  [{a['nivel']}] {a['texto']}")


if __name__ == "__main__":
    main()
