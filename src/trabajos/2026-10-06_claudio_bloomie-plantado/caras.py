"""Textura animada de la cara de Bloomie (Blender) con el kit de expresiones y lip sync de Rhubarb.
Cada cuadro = OJOS de una cara del kit (sin su boca) + una BOCA: la propia de esa cara o, mientras habla, la boca del
kit que corresponde a la forma de Rhubarb (A–H, X) de la voz que suena. Encima, los anteojos.
Alineación (misma convención que src/rig/CaraTextura.tsx: cuadrado de la cabeza de frente + 6 % de margen):
  - ojos: cada cara se escala por la distancia entre sus ojos y se ancla en el BLANCO del ojo (centro en x, borde de
    abajo en y: la línea fija del ojo, también en las caras de ojos a medio cerrar); las caras sin blanco (esfuerzo,
    alegría) se anclan en el centro de la mancha del ojo. Todo cae sobre los ojos del rig.
  - anteojos: cada aro centrado en su ojo (la distancia entre aros = la de los ojos).
  - bocas de habla: el labio de arriba a la altura del de la cara normal (se abren hacia abajo, como una mandíbula).
Reglas de no superposición (guion): en este kit los ojos son más grandes que el hueco de los aros, así que cada OJO
(con su ceja) se achica sobre su propio centro, de a 2 %, hasta dejar MARGEN_OJO libres (los ojos siguen centrados en
los aros); si una boca toca el aro, baja hasta dejar MARGEN_BOCA libres.
Uso: python src/trabajos/2026-10-06_claudio_bloomie-plantado/caras.py → public/trabajos/<ID>/img/cara/f000.png…
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
LADO = 1024
MARGEN = 0.06
FPS = 30
POP = {"cuadros": 5, "escala": 0.1}
MARGEN_OJO = 8  # px de textura libres entre el ojo y el aro
MARGEN_BOCA = 10  # px de textura libres entre la boca y el aro
MENTON = 14  # px de textura libres entre la boca más alta y el borde de abajo de la cabeza
SUBIR_OJOS = 14  # pt: los ojos del kit van apenas más arriba que los del rig (dejan lugar a la boca)
# Rhubarb → bocas del kit (A = M/B/P, B = consonantes, C = E, D = A, E = O/ER, F = U/W, G = F/V, H = L, X = reposo)
RHUBARB = {"A": "m", "B": "entreabierta", "C": "e", "D": "a", "E": "u", "F": "u", "G": "f", "H": "l", "X": "cerrada"}


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
    """(rasgos sin boca, boca): la boca es la mancha central más baja."""
    h, w = img.shape[:2]
    n, et, est, cen = cv2.connectedComponentsWithStats((img[:, :, 3] > 100).astype(np.uint8), 8)
    centrales = [k for k in range(1, n) if abs(cen[k][0] - w / 2) < w * 0.2]
    k = max(centrales, key=lambda k: cen[k][1])
    m = cv2.dilate((et == k).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    boca, resto = img.copy(), img.copy()
    boca[~m] = 0
    resto[m] = 0
    return resto, boca


def anclas(img):
    """Ancla de cada ojo: (centro x, borde de abajo) del blanco; sin blanco, el centro de la mancha. + si tiene blanco."""
    h, w = img.shape[:2]
    blanco = ((img[:, :, :3].min(axis=2) > 200) & (img[:, :, 3] > 200)).astype(np.uint8)
    n, et, est, cen = cv2.connectedComponentsWithStats(blanco, 8)
    grandes = [k for k in range(1, n) if est[k][cv2.CC_STAT_AREA] > 0.004 * h * w and abs(cen[k][0] - w / 2) > w * 0.12]
    if len([k for k in grandes if cen[k][0] < w / 2]) and len([k for k in grandes if cen[k][0] >= w / 2]):
        res = []
        for lado in (0, 1):
            k = max((k for k in grandes if (cen[k][0] < w / 2) == (lado == 0)), key=lambda k: est[k][cv2.CC_STAT_AREA])
            x, y, ww, hh = est[k][:4]
            res.append([x + ww / 2, y + hh])
        return res, True
    n, et, est, cen = cv2.connectedComponentsWithStats((img[:, :, 3] > 128).astype(np.uint8), 8)
    res = []
    for lado in (0, 1):
        cand = [k for k in range(1, n) if (cen[k][0] < w / 2) == (lado == 0) and abs(cen[k][0] - w / 2) > w * 0.12]
        k = max(cand, key=lambda k: est[k][cv2.CC_STAT_AREA])
        x, y, ww, hh = est[k][:4]
        res.append([x + ww / 2, y + hh / 2])
    return res, False


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    coreo = json.loads((DATOS / "coreografia.json").read_text(encoding="utf-8"))
    kit = json.loads((DATOS / "kit.json").read_text(encoding="utf-8"))
    frente = json.loads((RAIZ / "public/personajes/bloomie/piezas.json").read_text(encoding="utf-8"))["vistas"]["frente"]
    c = frente["cabeza"]["caja"]
    lado_pt = max(c[2] - c[0], c[3] - c[1]) * (1 + 2 * MARGEN)
    e = LADO / lado_pt
    x_pt, y_pt = (c[0] + c[2]) / 2 - lado_pt / 2, (c[1] + c[3]) / 2 - lado_pt / 2
    oj = frente["rostro"]["ojos"]
    dist_rig = abs(oj[1]["c"][0] - oj[0]["c"][0]) * e
    centro = ((oj[0]["c"][0] + oj[1]["c"][0]) / 2 - x_pt) * e, ((oj[0]["c"][1] + oj[1]["c"][1]) / 2 - SUBIR_OJOS - y_pt) * e

    leer = lambda n: cv2.imread(str(IMG / f"{n}.png"), cv2.IMREAD_UNCHANGED)
    caras = {n: leer(f"cara_{n}") for n in kit["caras"]}
    caras["mirando_izq"] = cv2.flip(caras["mirando"], 1)  # la del kit mira a la derecha de la imagen
    partes = {n: separar_boca(img) for n, img in caras.items()}
    bocas = {n: leer(f"boca_{n}") for n in kit["bocas"]}

    # Referencia: la cara normal. Sus ojos (centro del blanco) caen en los del rig; su escala es la de toda la hoja.
    a_n, _ = anclas(caras["normal"])
    blanco_n = ((caras["normal"][:, :, :3].min(axis=2) > 200) & (caras["normal"][:, :, 3] > 200)).astype(np.uint8)
    n_, et_, est_, cen_ = cv2.connectedComponentsWithStats(blanco_n, 8)
    centros_n = sorted([cen_[k] for k in range(1, n_) if est_[k][cv2.CC_STAT_AREA] > 0.004 * blanco_n.size], key=lambda p: p[0])[:2]
    s_n = dist_rig / (a_n[1][0] - a_n[0][0])
    # en la cara normal, del ancla (borde de abajo del blanco) al centro del ojo
    baja_n = ((a_n[0][1] - centros_n[0][1]) + (a_n[1][1] - centros_n[1][1])) / 2 * s_n
    ancla_rig = (centro[0], centro[1] + baja_n)  # donde va el ancla "borde de abajo" de cualquier cara con blanco

    def transformacion(nombre, extra=1.0):
        a, con_blanco = anclas(caras[nombre])
        s = dist_rig / (a[1][0] - a[0][0]) * extra
        mx, my = (a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2
        dx, dy = (ancla_rig if con_blanco else centro)
        return s, dx - mx * s, dy - my * s

    def pegar_ojos(base, nombre, k=1.0, pop=1.0):
        """Pega los rasgos sin boca de una cara: cada mitad (ojo + ceja) a escala s·k sobre el ancla de su ojo."""
        resto = partes[nombre][0]
        a, con_blanco = anclas(caras[nombre])
        s, _, _ = transformacion(nombre)
        s *= pop
        corte = int((a[0][0] + a[1][0]) / 2)
        for lado, (x0, x1) in enumerate(((0, corte), (corte, resto.shape[1]))):
            mitad = resto[:, x0:x1]
            ax, ay = a[lado][0] - x0, a[lado][1]
            sk = s * k
            dx = centro[0] + (-1 if lado == 0 else 1) * dist_rig / 2  # el pop agranda, no separa los ojos
            # el ojo se achica sobre su centro: el ancla "borde de abajo" se acerca al centro en la misma proporción
            dy = centro[1] + (baja_n * k * pop if con_blanco else 0)
            pegar(base, mitad, dx - ax * sk, dy - ay * sk, mitad.shape[1] * sk, mitad.shape[0] * sk)

    # anteojos: cada aro centrado en su ojo
    an = cv2.imread(str(IMG / "anteojos.png"), cv2.IMREAD_UNCHANGED)
    aros = kit["anteojos"]["aros"]
    s_a = dist_rig / (aros[1][0] - aros[0][0])
    capa_a = np.zeros((LADO, LADO, 4), np.uint8)
    pegar(capa_a, an, centro[0] - (aros[0][0] + aros[1][0]) / 2 * s_a, centro[1] - (aros[0][1] + aros[1][1]) / 2 * s_a, an.shape[1] * s_a, an.shape[0] * s_a)
    aro = capa_a[:, :, 3] > 60
    cerca = lambda margen: cv2.dilate(aro.astype(np.uint8), np.ones((2 * margen + 1,) * 2, np.uint8)) > 0

    # Regla 1: los ojos no tocan el aro (cada ojo se achica sobre su centro)
    extra = {}
    alto_ojo = centro[1] - 0.9 * (dist_rig * 0.35)  # por encima de esta línea están las cejas (pueden cruzar el aro)
    for n in partes:
        k = 1.0
        while k > 0.5:
            prueba = np.zeros((LADO, LADO, 4), np.uint8)
            pegar_ojos(prueba, n, k, 1 + POP["escala"])
            ojos_m = prueba[:, :, 3] > 60
            ojos_m[: int(max(0, alto_ojo))] = False
            if not (cerca(MARGEN_OJO) & ojos_m).any():
                break
            k -= 0.02
        extra[n] = k

    # Regla 2: las bocas (de habla y propias) van todas a una misma escala, con el labio de arriba MARGEN_BOCA por
    # debajo del aro, y la más alta tiene que entrar antes del mentón (borde de abajo de la cabeza)
    def recortada(img):
        ys, xs = np.nonzero(img[:, :, 3] > 30)
        return img[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    todas = {**{n: recortada(i) for n, i in bocas.items()}, **{f"propia_{n}": recortada(v[1]) for n, v in partes.items()}}
    ys_a = np.nonzero(aro[:, int(centro[0] - dist_rig / 2)])[0]  # columna del centro del aro izquierdo
    techo = ys_a.max() + MARGEN_BOCA
    menton = (c[3] - y_pt) * e - MENTON
    km = min(1.0, (menton - techo) / max(i.shape[0] * s_n for i in todas.values()))

    def pegar_boca(base, img, pop=1.0):
        sb = s_n * km * pop
        pegar(base, img, centro[0] - img.shape[1] * sb / 2, techo, img.shape[1] * sb, img.shape[0] * sb)

    # Voces: forma de Rhubarb por cuadro
    voces = []
    for v in coreo["voces"]:
        r = json.loads((DATOS / f"{Path(v['archivo']).stem}_rhubarb.json").read_text(encoding="utf-8"))
        voces.append((v["cuadro"], r["mouthCues"]))

    def forma(k):
        for inicio, cues in voces:
            t = (k - inicio) / FPS
            for q in cues:
                if q["start"] <= t < q["end"]:
                    return RHUBARB[q["value"]]
        return None

    sal = IMG / "cara"
    sal.mkdir(parents=True, exist_ok=True)
    for f in sal.glob("*.png"):
        f.unlink()
    muestras = {}
    for k in range(coreo["duracion"]):
        t = next(t for t in coreo["caras"] if t["desde"] <= k < t["hasta"])
        n = t["ojos"]
        local = k - t["desde"]
        pop = 1 + POP["escala"] * np.sin(min(1.0, local / POP["cuadros"]) * np.pi) if t.get("pop") and local < POP["cuadros"] else 1
        base = np.zeros((LADO, LADO, 4), np.uint8)
        pegar_ojos(base, n, extra[n], pop)
        b = forma(k) if t.get("habla") else None
        if b is None and t.get("boca"):
            b = t["boca"]
        pegar_boca(base, todas[b] if b else todas[f"propia_{n}"], pop)
        a = base.copy()
        pegar(a, capa_a, 0, 0, LADO, LADO)
        cv2.imwrite(str(sal / f"f{k:03d}.png"), a)
        muestras.setdefault(f"{n}{'·' + b if b else ''}", a)
    # Control: cada combinación sobre un disco naranja del tamaño de la cabeza
    REV.mkdir(parents=True, exist_ok=True)
    celdas = []
    cx, cy = ((c[0] + c[2]) / 2 - x_pt) * e, ((c[1] + c[3]) / 2 - y_pt) * e
    for nombre, b in list(muestras.items())[:24]:
        fondo = np.full((LADO, LADO, 3), 60, np.uint8)
        cv2.ellipse(fondo, (int(cx), int(cy)), (int((c[2] - c[0]) / 2 * e), int((c[3] - c[1]) / 2 * e)), 0, 0, 360, (60, 145, 239), -1)
        al = b[:, :, 3:4] / 255
        fondo = (b[:, :, :3] * al + fondo * (1 - al)).astype(np.uint8)
        cv2.putText(fondo, nombre, (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 3)
        celdas.append(cv2.resize(fondo, (300, 300), interpolation=cv2.INTER_AREA))
    while len(celdas) % 6:
        celdas.append(np.full((300, 300, 3), 60, np.uint8))
    cv2.imwrite(str(REV / "caras.png"), np.vstack([np.hstack(celdas[i:i + 6]) for i in range(0, len(celdas), 6)]))
    chicas = {n: round(v, 2) for n, v in extra.items() if v < 1}
    print(f"OK {coreo['duracion']} cuadros de cara → {sal.relative_to(RAIZ)} · {len(muestras)} combinaciones · ojos achicados {chicas} · bocas al {km:.0%}")


if __name__ == "__main__":
    main()
