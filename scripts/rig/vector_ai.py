# Lectura de dibujos vectoriales de Illustrator (.ai compatible con PDF) con PyMuPDF.
# Compartido por src/marcas/bloomie/extraer_personaje.py (kit Bloomie) y scripts/rig/extraer_rig.py (rigs).
# Coordenadas del PDF: origen arriba a la izquierda, y hacia abajo, en puntos.
import math
import re

import pymupdf


def hexa(c):
    return "#%02x%02x%02x" % tuple(round(v * 255) for v in c) if c else None


def trazo(dib, dx, dy):
    """Convierte un dibujo de PyMuPDF en un path SVG desplazado (dx, dy)."""
    partes = []
    actual = None

    def pt(p):
        return f"{p.x + dx:.2f} {p.y + dy:.2f}"

    for it in dib["items"]:
        tipo = it[0]
        if tipo == "l":
            a, b = it[1], it[2]
            if actual is None or abs(actual.x - a.x) > 0.01 or abs(actual.y - a.y) > 0.01:
                partes.append(f"M{pt(a)}")
            partes.append(f"L{pt(b)}")
            actual = b
        elif tipo == "c":
            a, c1, c2, b = it[1], it[2], it[3], it[4]
            if actual is None or abs(actual.x - a.x) > 0.01 or abs(actual.y - a.y) > 0.01:
                partes.append(f"M{pt(a)}")
            partes.append(f"C{pt(c1)} {pt(c2)} {pt(b)}")
            actual = b
        elif tipo == "re":
            r = it[1]
            partes.append(f"M{r.x0 + dx:.2f} {r.y0 + dy:.2f}H{r.x1 + dx:.2f}V{r.y1 + dy:.2f}H{r.x0 + dx:.2f}Z")
            actual = None
        elif tipo == "qu":
            q = it[1]
            partes.append(f"M{pt(q.ul)}L{pt(q.ur)}L{pt(q.lr)}L{pt(q.ll)}Z")
            actual = None
    if dib.get("closePath"):
        partes.append("Z")
    t = {"d": "".join(partes)}
    if dib.get("fill") is not None:
        t["fill"] = hexa(dib["fill"])
    if dib.get("color") is not None and "s" in dib["type"]:
        t["stroke"] = hexa(dib["color"])
        t["sw"] = round(dib.get("width") or 1, 2)
    if dib.get("even_odd"):
        t["evenodd"] = True
    return t


def caja(dibs):
    x0 = min(d["rect"].x0 for d in dibs)
    y0 = min(d["rect"].y0 for d in dibs)
    x1 = max(d["rect"].x1 for d in dibs)
    y1 = max(d["rect"].y1 for d in dibs)
    return [round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)]


# ---------- Lectura extendida (para rigs): grupos con opacidad, recortes y capas ----------


def leer(ruta, pagina=0):
    """Dibujos pintados de la página, en orden, con la opacidad de sus grupos, su recorte y su capa.
    Cada uno es el dict de PyMuPDF más: i (índice de pintado), op (opacidad total), clip (path SVG o None),
    capa (nombre de la capa de Illustrator o "")."""
    pag = pymupdf.open(ruta)[pagina]
    pila = []  # (nivel, tipo, dato)
    dibs = []
    for x in pag.get_drawings(extended=True):
        nivel = x.get("level", 0)
        while pila and pila[-1][0] >= nivel:
            pila.pop()
        if x["type"] == "group":
            pila.append((nivel, "group", x.get("opacity", 1.0)))
            continue
        if x["type"] == "clip":
            r = x.get("scissor")
            d = trazo(x, 0, 0)["d"] if x.get("items") else None
            pila.append((nivel, "clip", (d, r, x.get("even_odd", False))))
            continue
        op = 1.0
        clip = None
        for _, tipo, dato in pila:
            if tipo == "group":
                op *= dato
            elif tipo == "clip" and dato[0]:
                d, r, _eo = dato
                # Los recortes del tamaño de la página no recortan nada
                if r is not None and (r.width >= pag.rect.width - 1 and r.height >= pag.rect.height - 1):
                    continue
                if not es_rectangulo_que_contiene(d, x["rect"]):
                    clip = d
        x["op"] = round(op * (x.get("fill_opacity") or 1.0), 3)
        x["clip"] = clip
        x["capa"] = x.get("layer") or ""
        x["i"] = len(dibs)
        dibs.append(x)
    return pag, dibs


def es_rectangulo_que_contiene(d, rect):
    """True si el path d es un rectángulo que ya contiene a rect (recorte inútil)."""
    nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", d)]
    if len(nums) < 4 or len(nums) > 12:
        return False
    xs, ys = nums[0::2], nums[1::2]
    return min(xs) <= rect.x0 + 0.5 and max(xs) >= rect.x1 - 0.5 and min(ys) <= rect.y0 + 0.5 and max(ys) >= rect.y1 - 0.5


# ---------- Geometría ----------


def poligonos(dib, paso=6):
    """Subtrazados del dibujo aplanados a polígonos (listas de (x, y)); las curvas en `paso` segmentos."""
    polis = []
    actual = []
    ultimo = None
    for it in dib["items"]:
        tipo = it[0]
        if tipo in ("l", "c"):
            a = it[1]
            if ultimo is None or abs(ultimo.x - a.x) > 0.01 or abs(ultimo.y - a.y) > 0.01:
                if len(actual) > 2:
                    polis.append(actual)
                actual = [(a.x, a.y)]
            if tipo == "l":
                actual.append((it[2].x, it[2].y))
            else:
                p0, p1, p2, p3 = it[1], it[2], it[3], it[4]
                for k in range(1, paso + 1):
                    t = k / paso
                    u = 1 - t
                    actual.append(
                        (
                            u**3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t**3 * p3.x,
                            u**3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t**3 * p3.y,
                        )
                    )
            ultimo = it[-1]
        elif tipo == "re":
            r = it[1]
            if len(actual) > 2:
                polis.append(actual)
            polis.append([(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)])
            actual, ultimo = [], None
        elif tipo == "qu":
            q = it[1]
            if len(actual) > 2:
                polis.append(actual)
            polis.append([(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.lr.x, q.lr.y), (q.ll.x, q.ll.y)])
            actual, ultimo = [], None
    if len(actual) > 2:
        polis.append(actual)
    return polis


def contiene(dib, x, y):
    """¿El relleno del dibujo cubre el punto? Respeta la regla par-impar o la de bobinado."""
    vueltas = 0
    cruces = 0
    for poli in poligonos(dib):
        n = len(poli)
        for k in range(n):
            x0, y0 = poli[k]
            x1, y1 = poli[(k + 1) % n]
            if (y0 <= y) != (y1 <= y):
                xc = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
                if xc > x:
                    cruces += 1
                    vueltas += 1 if y1 > y0 else -1
    return cruces % 2 == 1 if dib.get("even_odd") else vueltas != 0


def area_relleno(dib):
    """Área aproximada del relleno (suma de áreas de los subtrazados con signo, en valor absoluto)."""
    total = 0.0
    for poli in poligonos(dib):
        s = 0.0
        n = len(poli)
        for k in range(n):
            x0, y0 = poli[k]
            x1, y1 = poli[(k + 1) % n]
            s += x0 * y1 - x1 * y0
        total += s / 2
    return abs(total)


def luminancia(hexcolor):
    if not hexcolor:
        return None
    r, g, b = (int(hexcolor[i : i + 2], 16) / 255 for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def saturacion(hexcolor):
    r, g, b = (int(hexcolor[i : i + 2], 16) / 255 for i in (1, 3, 5))
    mx, mn = max(r, g, b), min(r, g, b)
    return 0 if mx == 0 else (mx - mn) / mx


def tono(hexcolor):
    r, g, b = (int(hexcolor[i : i + 2], 16) / 255 for i in (1, 3, 5))
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return 0.0
    if mx == r:
        h = ((g - b) / (mx - mn)) % 6
    elif mx == g:
        h = (b - r) / (mx - mn) + 2
    else:
        h = (r - g) / (mx - mn) + 4
    return h * 60


def oscurecer(hexcolor, f):
    if not hexcolor:
        return hexcolor
    r, g, b = (int(hexcolor[i : i + 2], 16) for i in (1, 3, 5))
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v * f))) for v in (r, g, b))


_NUM = re.compile(r"-?\d+(?:\.\d+)?")


def transformar_d(d, fn):
    """Aplica fn(x, y) -> (x, y) a todos los puntos de un path de trazo() (comandos absolutos M L C H V Z)."""
    salida = []
    for cmd, args in re.findall(r"([MLCHVZ])([^MLCHVZ]*)", d):
        nums = [float(n) for n in _NUM.findall(args)]
        if cmd in "MLC":
            pts = []
            for k in range(0, len(nums), 2):
                x, y = fn(nums[k], nums[k + 1])
                pts.append(f"{x:.2f} {y:.2f}")
            salida.append(cmd + " ".join(pts))
        elif cmd == "H":
            # H/V solo aparecen en rectángulos: se convierten a L con la otra coordenada del punto anterior
            salida.append(("H", nums[0]))
        elif cmd == "V":
            salida.append(("V", nums[0]))
        else:
            salida.append("Z")
    # Rectángulos (M x y H x1 V y1 H x0 Z): reconstruir con puntos completos
    if any(isinstance(s, tuple) for s in salida):
        return _rect_transformado(d, fn)
    return "".join(salida)


def _rect_transformado(d, fn):
    nums = [float(n) for n in _NUM.findall(d)]
    x0, y0, x1, y1, _x0b = nums[0], nums[1], nums[2], nums[3], nums[4]
    pts = [fn(x0, y0), fn(x1, y0), fn(x1, y1), fn(x0, y1)]
    return "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z"


def caja_d(d):
    """Caja [x0, y0, x1, y1] de los puntos de un path (incluye puntos de control: aproximada por exceso)."""
    nums = [float(n) for n in _NUM.findall(d)]
    xs, ys = nums[0::2], nums[1::2]
    if not xs:
        return [0, 0, 0, 0]
    return [min(xs), min(ys), max(xs), max(ys)]


def distancia(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])
