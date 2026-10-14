"""Textura animada de la cara de Bloomie para el render 3D (Blender), con el kit nuevo (img/kit, de recortar_kit.py).

Cada cuadro combina unos ojos del kit ("ojos_<cara>", sin boca) con una boca de habla (Rhubarb) o usa la cara completa
("cara_<cara>") cuando no habla; opcionalmente espejada. Tabla por cuadro: datos/caras_cuadros.json (armar_escena.mjs).

Arreglos automáticos del kit (márgenes):
  · ojos: lo que está dentro de cada aro de los anteojos se achica alrededor del centro del aro hasta quedar a
    MARGEN_OJO del radio interior (así ningún ojo toca el aro, ni el de "Asombro").
  · bocas: las de habla se escalan a la medida de la boca de "Normal"; toda boca (de habla o de expresión) que quede a
    menos de MARGEN_BOCA del aro se baja lo justo (las de habla, todas lo mismo, para que no salten).
La cara se saca de la piel naranja y del contorno (queda lo dibujado) y se ubica sobre la caja de la cabeza con la misma
convención que la calcomanía de scripts/blender/personaje_desde_rig.py (cuadrado de la cabeza + 12 %).

Uso: python src/trabajos/2026-10-06_rastro_bloomie-plantada/caras.py [--revisar]
  → public/trabajos/<ID>/img/cara/f000.png… (--revisar: además out/<ID>/revision/caras_kit.png con todas las combinaciones)
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ID = "2026-10-06_rastro_bloomie-plantada"
RAIZ = Path(__file__).resolve().parents[3]
KIT = RAIZ / "public/trabajos" / ID / "img/kit"
SAL = RAIZ / "public/trabajos" / ID / "img/cara"
REV = RAIZ / "out" / ID / "revision"
LADO = 768  # px de la textura
CALCO = 1.12  # la calcomanía mide el lado mayor de la cabeza + 12 % (personaje_desde_rig.py)
MARGEN_OJO = 0.84  # los ojos ocupan como mucho este radio del aro (radio interior = 1)
MARGEN_BOCA = 0.035  # separación mínima boca–aro, en fracción del alto de la cabeza
ESCALA_HABLA = 1.05  # boca "cerrada" de habla = este factor × ancho de la boca de "Normal"
BORDE = 0.93  # fuera de esta elipse (fracción de la caja de la cabeza) no hay rasgos: es el contorno
MOTA = 60  # px: manchitas sueltas que se descartan
POP = {"cuadros": 4, "escala": 0.06}  # al cambiar de ojos: la cara se agranda un 6 % y vuelve
CARAS = ["normal", "costado", "cansado", "triste", "esfuerzo", "asombro", "resignado", "alegria"]
RHUBARB = {"X": None, "A": "mbp", "B": "entreabierta", "C": "e", "D": "a", "E": "o", "F": "u", "G": "f", "H": "l"}


def leer(ruta):
    return cv2.imdecode(np.fromfile(str(ruta), np.uint8), cv2.IMREAD_UNCHANGED)


def guardar(ruta, img):
    ok, buf = cv2.imencode(".png", img)
    assert ok, ruta
    buf.tofile(str(ruta))


def caja_cabeza():
    """Caja de la cabeza (px de la textura): x, y, ancho, alto — la misma pieza que usa el modelo 3D."""
    piezas = json.loads((RAIZ / "public/personajes/bloomie/piezas.json").read_text(encoding="utf-8"))
    c = next(p for p in piezas["vistas"]["frente"]["piezas"] if p["id"] == "cabeza")["caja"]
    w, h = c[2] - c[0], c[3] - c[1]
    e = LADO / (max(w, h) * CALCO)
    return (LADO - w * e) / 2, (LADO - h * e) / 2, w * e, h * e


def mascaras(img):
    hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0].astype(int), hsv[:, :, 1].astype(int), hsv[:, :, 2].astype(int)
    piel = (h >= 4) & (h <= 26) & (s > 100) & (v > 80)  # naranja de la piel y el contorno
    cian = (h >= 78) & (h <= 108) & (s > 50) & (v > 70)
    return piel, cian


def sin_piel(img):
    """Deja solo lo dibujado: sin piel, sin el contorno de la cabeza (fuera de la elipse BORDE) y sin motas sueltas."""
    piel, _ = mascaras(img)
    H, W = img.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    dentro = ((xx - W / 2) / (W / 2 * BORDE)) ** 2 + ((yy - H / 2) / (H / 2 * BORDE)) ** 2 < 1
    a = img[:, :, 3].astype(np.float32) * (~piel) * dentro
    n, lab, est, _ = cv2.connectedComponentsWithStats((a > 100).astype(np.uint8), connectivity=8)
    for k in range(1, n):
        if est[k, cv2.CC_STAT_AREA] < MOTA:
            a[lab == k] = 0
    out = img.copy()
    out[:, :, 3] = cv2.GaussianBlur(a, (0, 0), 0.8).astype(np.uint8)
    return out


def bajar(img, dy):
    """Corre una capa dy px hacia abajo (sin dar la vuelta, a diferencia de np.roll)."""
    if dy <= 0:
        return img
    out = np.zeros_like(img)
    out[dy:] = img[:-dy]
    return out


def ajustar_circulo(pts):
    """Círculo por mínimos cuadrados (Kasa) con descarte de puntos lejanos (patillas, puente)."""
    sel = pts
    for _ in range(4):
        x, y = sel[:, 0].astype(float), sel[:, 1].astype(float)
        A = np.c_[2 * x, 2 * y, np.ones_like(x)]
        cx, cy, c = np.linalg.lstsq(A, x * x + y * y, rcond=None)[0]
        r = np.sqrt(c + cx * cx + cy * cy)
        d = np.hypot(pts[:, 0] - cx, pts[:, 1] - cy)
        sel = pts[np.abs(d - r) < 0.18 * r]
    return cx, cy, r


def aros(img):
    """Los dos aros de los anteojos: [(cx, cy, r_interior, r_exterior)] izquierdo y derecho."""
    _, cian = mascaras(img)
    cian &= img[:, :, 3] > 128
    H, W = cian.shape
    ys, xs = np.nonzero(cian)
    res = []
    for lado in (xs < W * 0.46, xs > W * 0.54):
        pts = np.c_[xs[lado], ys[lado]]
        cx, cy, r = ajustar_circulo(pts)
        d = np.hypot(pts[:, 0] - cx, pts[:, 1] - cy)
        anillo = d[np.abs(d - r) < 0.18 * r]
        res.append((cx, cy, np.percentile(anillo, 2), np.percentile(anillo, 98)))
    return res


def achicar_ojos(img):
    """Achica lo que hay dentro de cada aro (ojos, párpados) alrededor del centro del aro → margen con el aro."""
    out = img.copy()
    _, cian = mascaras(img)
    H, W = img.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    escalas = []
    for cx, cy, ri, _ in aros(img):
        d = np.hypot(xx - cx, yy - cy)
        dentro = (d < ri) & ~cian & (img[:, :, 3] > 100)
        piel, _ = mascaras(img)
        ojo = dentro & ~piel
        if ojo.sum() < 50:
            escalas.append(1.0)
            continue
        dmax = np.percentile(d[ojo], 99.5)
        s = min(1.0, MARGEN_OJO * ri / dmax)
        escalas.append(s)
        if s >= 0.999:
            continue
        # recorte del interior del aro (sin el aro), escalado alrededor del centro
        capa = img.copy()
        capa[:, :, 3] = np.where(d < ri * 0.995, capa[:, :, 3], 0) * (~cian)
        M = np.float32([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]])
        chica = cv2.warpAffine(capa, M, (W, H), flags=cv2.INTER_AREA, borderValue=(0, 0, 0, 0))
        # el interior se vacía (queda la piel de la cabeza 3D) y se pega lo achicado
        hueco = (d < ri * 0.995) & ~cian
        out[:, :, 3] = np.where(hueco, 0, out[:, :, 3])
        a = chica[:, :, 3:4].astype(np.float32) / 255
        out[:, :, :3] = (chica[:, :, :3] * a + out[:, :, :3] * (1 - a)).astype(np.uint8)
        out[:, :, 3] = np.maximum(out[:, :, 3], chica[:, :, 3])
    return out, escalas


def capa_boca(img, ar):
    """Máscara de la boca dibujada de una cara completa (componentes debajo de los aros, en el centro)."""
    piel, cian = mascaras(img)
    H, W = img.shape[:2]
    trazo = (img[:, :, 3] > 100) & ~piel & ~cian & ~mascara_aros(img.shape, ar, 4)
    n, lab, est, cen = cv2.connectedComponentsWithStats(trazo.astype(np.uint8), connectivity=8)
    abajo = max(cy + ro * 0.55 for cx, cy, ri, ro in ar)
    m = np.zeros_like(trazo)
    for k in range(1, n):
        if cen[k][1] > abajo and abs(cen[k][0] - W / 2) < W * 0.2 and est[k, cv2.CC_STAT_AREA] > 30:
            m |= lab == k
    return m


def mascara_aros(shape, ar, margen):
    H, W = shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    m = np.zeros((H, W), bool)
    for cx, cy, ri, ro in ar:
        m |= np.hypot(xx - cx, yy - cy) < ro + margen
    return m


def bajar_hasta_librar(alfa_boca, ar, margen, max_px):
    """Cuántos px hay que bajar una boca (máscara) para que no toque los aros (+ margen)."""
    prohibido = mascara_aros(alfa_boca.shape, ar, margen)
    for dy in range(0, int(max_px) + 1):
        if not (bajar(alfa_boca, dy) & prohibido).any():
            return dy
    return int(max_px)


def pegar(base, pieza, x0, y0):
    h, w = pieza.shape[:2]
    x0, y0 = int(round(x0)), int(round(y0))
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(base.shape[1], x0 + w), min(base.shape[0], y0 + h)
    if xa >= xb or ya >= yb:
        return
    p = pieza[ya - y0:yb - y0, xa - x0:xb - x0].astype(np.float32) / 255
    b = base[ya:yb, xa:xb].astype(np.float32) / 255
    ap, ab = p[:, :, 3:4], b[:, :, 3:4]
    ao = ap + ab * (1 - ap)
    rgb = (p[:, :, :3] * ap + b[:, :, :3] * ab * (1 - ap)) / np.maximum(ao, 1e-6)
    base[ya:yb, xa:xb] = (np.dstack([rgb, ao]) * 255).astype(np.uint8)


def preparar():
    """Capas listas al tamaño de la caja de la cabeza: ojos/caras (con márgenes) y bocas de habla ubicadas."""
    x, y, w, h = caja_cabeza()
    W, H = int(round(w)), int(round(h))
    tam = lambda im: cv2.resize(im, (W, H), interpolation=cv2.INTER_AREA)
    informe = {}
    ojos, caras = {}, {}
    for n in CARAS:
        o, so = achicar_ojos(tam(leer(KIT / f"ojos_{n}.png")))
        c, sc = achicar_ojos(tam(leer(KIT / f"cara_{n}.png")))
        ar = aros(c)
        # boca de la expresión: si toca el aro, se baja
        mb = capa_boca(c, ar)
        dy = bajar_hasta_librar(mb, ar, MARGEN_BOCA * H, 0.1 * H) if mb.any() else 0
        if dy:
            boca = c.copy()
            boca[:, :, 3] = np.where(mb, boca[:, :, 3], 0)
            c[:, :, 3] = np.where(mb, 0, c[:, :, 3])
            pegar(c, bajar(boca, dy), 0, 0)
        ojos[n], caras[n] = sin_piel(o), sin_piel(c)
        informe[n] = {"ojos_escala": [round(v, 3) for v in so], "cara_escala": [round(v, 3) for v in sc], "boca_baja_px": dy}
    # bocas de habla: escala por la boca de "Normal"; arriba alineadas con la "cerrada"
    cn = tam(leer(KIT / "cara_normal.png"))
    arn = aros(cn)
    mn = capa_boca(cn, arn)
    ys, xs = np.nonzero(mn)
    ancho_n, cx_n, cy_n = xs.max() - xs.min(), (xs.max() + xs.min()) / 2, (ys.max() + ys.min()) / 2
    cerrada = leer(KIT / "boca_cerrada.png")
    k = ESCALA_HABLA * ancho_n / (cerrada.shape[1] * 0.93)  # 0,93: el recorte tiene margen
    tope = cy_n - cerrada.shape[0] * k / 2
    bocas = {}
    for n in [b for b in RHUBARB.values() if b] + ["cerrada"]:
        im = leer(KIT / f"boca_{n}.png")
        im = cv2.resize(im, (max(1, int(im.shape[1] * k)), max(1, int(im.shape[0] * k))), interpolation=cv2.INTER_AREA)
        capa = np.zeros((H, W, 4), np.uint8)
        pegar(capa, im, cx_n - im.shape[1] / 2, tope)
        bocas[n] = capa
    # todas las de habla bajan lo mismo: lo que necesite la que más se acerque al aro
    dy = max(bajar_hasta_librar(b[:, :, 3] > 60, arn, MARGEN_BOCA * H, 0.12 * H) for b in bocas.values())
    bocas = {n: bajar(b, dy) for n, b in bocas.items()}
    informe["bocas_habla"] = {"escala": round(k, 3), "baja_px": dy, "alto_cabeza_px": H}
    return (x, y, W, H), ojos, caras, bocas, informe


def componer(capas, cuadro, pop=1.0):
    (x, y, W, H), ojos, caras, bocas = capas
    cara = (caras[cuadro["ojos"]] if cuadro.get("boca") is None else ojos[cuadro["ojos"]]).copy()
    if cuadro.get("boca") is not None:
        pegar(cara, bocas[cuadro["boca"]], 0, 0)
    if cuadro.get("espejo"):
        cara = cara[:, ::-1].copy()
    base = np.zeros((LADO, LADO, 4), np.uint8)
    if pop != 1.0:
        cara = cv2.resize(cara, (int(W * pop), int(H * pop)), interpolation=cv2.INTER_AREA)
    pegar(base, cara, x + (W - cara.shape[1]) / 2, y + (H - cara.shape[0]) / 2)
    return base


def hoja_revision(capas):
    """Todas las caras completas y cada juego de ojos con todas las bocas, sobre piel naranja con los aros."""
    (x, y, W, H), ojos, caras, bocas = capas
    T = 150
    filas = [[{"ojos": n} for n in CARAS]] + [[{"ojos": n, "boca": b} for b in bocas] for n in ("normal", "cansado", "triste", "resignado")]
    cols = max(len(f) for f in filas)
    hoja = np.full((len(filas) * T, cols * T, 3), 40, np.uint8)
    for i, fila in enumerate(filas):
        for j, c in enumerate(fila):
            t = componer(capas, c)
            fondo = np.zeros((LADO, LADO, 3), np.uint8)
            cv2.ellipse(fondo, (int(x + W / 2), int(y + H / 2)), (int(W / 2), int(H / 2)), 0, 0, 360, (60, 145, 239), -1)
            a = t[:, :, 3:4] / 255
            img = (t[:, :, :3] * a + fondo * (1 - a)).astype(np.uint8)
            hoja[i * T:(i + 1) * T, j * T:(j + 1) * T] = cv2.resize(img, (T, T), interpolation=cv2.INTER_AREA)
            cv2.putText(hoja, (c["ojos"][:5] + ("+" + c["boca"] if c.get("boca") else ""))[:16], (j * T + 3, i * T + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
    REV.mkdir(parents=True, exist_ok=True)
    guardar(REV / "caras_kit.png", hoja)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    caja, ojos, caras, bocas, informe = preparar()
    capas = (caja, ojos, caras, bocas)
    print(json.dumps(informe, ensure_ascii=False))
    if "--revisar" in sys.argv:
        hoja_revision(capas)
        print(f"hoja → {(REV / 'caras_kit.png').relative_to(RAIZ)}")
    tabla = RAIZ / "public/trabajos" / ID / "datos/caras_cuadros.json"
    if not tabla.exists():
        return
    cuadros = json.loads(tabla.read_text(encoding="utf-8"))
    SAL.mkdir(parents=True, exist_ok=True)
    for f in SAL.glob("*.png"):
        f.unlink()
    desde = 0
    for k, c in enumerate(cuadros):
        if k and (c["ojos"], c.get("espejo")) != (cuadros[k - 1]["ojos"], cuadros[k - 1].get("espejo")):
            desde = k
        local = k - desde
        pop = 1 + POP["escala"] * np.sin(np.pi * local / POP["cuadros"]) if 0 < local < POP["cuadros"] and k > 0 else 1.0
        guardar(SAL / f"f{k:03d}.png", componer(capas, c, pop))
    print(f"OK {len(cuadros)} cuadros de cara → {SAL.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
