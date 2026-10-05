# Extrae las piezas de un personaje desde su .ai (compatible con PDF) para animarlo con el rig de src/rig/.
#
# Funciona con dos clases de archivo:
#  - .ai mínimo (una sola capa, sin nombres, como Bloomie.ai): separa la hoja en bloques por posición
#    (vistas de la fila de arriba; caras y accesorios abajo) y reconoce las piezas por color, tamaño, posición
#    y orden de dibujo (relleno + contorno + sombra = una pieza).
#  - .ai óptimo (capas de primer nivel con nombre: cabeza, ojo_izq, mano_der, boca_A…, ver
#    src/rig/GUIA_DISENADOR.md): usa los nombres de capa y la adivinanza solo para lo que quede sin nombre.
# Lo que la adivinanza no acierta se corrige en texto con src/personajes/<nombre>/mapa.json (ver README).
#
# Uso: python scripts/rig/extraer_rig.py <archivo.ai> <nombre> [--sinteticas todas|ninguna|lista]
#        [--mapa ruta] [--salida carpeta] [--revision carpeta] [--sin-copia]
# Salidas: public/personajes/<nombre>/piezas.json, rig.json (solo si no existe: si existe, rig.propuesto.json)
#          out/personajes/<nombre>/hoja_bloques.png, hoja_vistas.png (hojas chicas numeradas), informe.md
import argparse
import json
import math
import shutil
import sys
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vector_ai import (  # noqa: E402
    area_relleno,
    caja_d,
    contiene,
    hexa,
    leer,
    luminancia,
    oscurecer,
    saturacion,
    tono,
    transformar_d,
    trazo,
)

RAIZ = Path(__file__).resolve().parents[2]
VERSION = 1

# ---------- Umbrales de la adivinanza ----------
SOLAPE_BLOQUE = 0.10  # dos dibujos son del mismo bloque si se tapan en ≥ 10 % del más chico
CONTENIDO_DECORADO = 0.75  # contorno o sombra: ≥ 75 % de su caja dentro de la base…
AREA_DECORADO = 0.35  # …y al menos 35 % del área de la base
OPACIDAD_SOMBRA = 0.6  # por debajo: sombra o brillo de la pieza de abajo
OSCURO = 0.2  # luminancia de ojos, cejas y boca
BLANCO = 0.88  # luminancia del blanco de los ojos
RASGO_MAX = 0.15  # un rasgo de la cara ocupa menos del 15 % de la caja de la cabeza
ZONA_BOCA = 0.62  # rasgos por debajo de esta altura relativa de la cabeza = boca
FINO = 0.6  # alto/ancho por debajo: ceja (o ojo cerrado)
ZONA_OJOS = (0.15, 0.85, 0.18, 0.75)  # x0, x1, y0, y1 relativos a la cabeza donde puede haber ojos y cejas
COLOR_IGUAL = 10  # diferencia máxima por canal (0-255) para considerar dos colores iguales
PISO = 0.04  # piezas que tocan el 4 % de abajo del bloque = pies
MANO_ADENTRO = 0.2  # manos unidas: cada una se corta a 20 % del ancho del cuerpo hacia adentro de su borde
DIVIDIR_LADO = 0.3  # una pieza que cruza el centro con ≥ 30 % de cada lado se divide en izq/der
VISEMAS = ["A", "B", "C", "D", "E", "F"]  # X = boca de la expresión (reposo)
# Escala de cada visema respecto de la boca abierta de referencia (ancho, alto)
VISEMA_ESCALA = {"B": (0.95, 0.38), "C": (1.08, 0.62), "D": (1.0, 1.0), "E": (0.72, 0.92), "F": (0.5, 0.62)}
ANCHO_HABLA = 1.25  # ancho de la boca abierta respecto de la boca neutra
COLORES_SOMBRA_ATRAS = 0.78  # oscurecido de las piezas sintéticas del lado de atrás


# =====================================================================================================
# Utilidades
# =====================================================================================================


def rect_l(r):
    return [r.x0, r.y0, r.x1, r.y1]


def area(c):
    return max(0.0, c[2] - c[0]) * max(0.0, c[3] - c[1])


def inter(a, b):
    return [max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])]


def union(a, b):
    return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]


def centro(c):
    return ((c[0] + c[2]) / 2, (c[1] + c[3]) / 2)


def dentro(p, c, m=0.0):
    return c[0] - m <= p[0] <= c[2] + m and c[1] - m <= p[1] <= c[3] + m


def redondear(c, n=1):
    return [round(v, n) for v in c]


def color_base(d):
    return hexa(d.get("fill")) if d.get("fill") is not None else hexa(d.get("color"))


class Pieza:
    """Una pieza: dibujos que se mueven juntos (relleno, contorno, sombra…), en orden de dibujo."""

    def __init__(self, base):
        self.dibs = [base]
        self.base = base
        self.nombre = None
        self.rol = None
        self.capa = base["capa"]
        self.sintetica = False
        self.clip = None  # recorte propio (piezas divididas), en coordenadas de la página
        self.de = "auto"

    @property
    def caja(self):
        c = rect_l(self.dibs[0]["rect"])
        for d in self.dibs[1:]:
            c = union(c, rect_l(d["rect"]))
        if self.clip:
            c = inter(c, caja_d(self.clip))
        return c

    @property
    def caja_base(self):
        return rect_l(self.base["rect"])

    @property
    def z(self):
        return self.base["i"]

    @property
    def color(self):
        return color_base(self.base)

    @property
    def lum(self):
        return luminancia(self.color) if self.color else 0.5


# =====================================================================================================
# 1. Bloques (vistas, caras y accesorios de la hoja)
# =====================================================================================================


def bloques(dibs):
    padre = list(range(len(dibs)))

    def raiz(a):
        while padre[a] != a:
            padre[a] = padre[padre[a]]
            a = padre[a]
        return a

    cajas = [rect_l(d["rect"]) for d in dibs]
    orden = sorted(range(len(dibs)), key=lambda k: cajas[k][0])
    for ii, a in enumerate(orden):
        for b in orden[ii + 1 :]:
            if cajas[b][0] > cajas[a][2]:
                break
            i = inter(cajas[a], cajas[b])
            # Piezas con nombre de capa que se tocan (aunque casi no se superpongan): mismo bloque
            if capa_con_nombre(dibs[a]["capa"]) and capa_con_nombre(dibs[b]["capa"]) and i[2] - i[0] >= -2 and i[3] - i[1] >= -2:
                padre[raiz(a)] = raiz(b)
                continue
            if area(i) <= 0:
                continue
            chico = max(1e-6, min(area(cajas[a]), area(cajas[b])))
            if area(i) / chico >= SOLAPE_BLOQUE:
                padre[raiz(a)] = raiz(b)
    grupos = {}
    for k in range(len(dibs)):
        grupos.setdefault(raiz(k), []).append(dibs[k])
    lista = [sorted(g, key=lambda d: d["i"]) for g in grupos.values()]
    # Pedacitos sueltos (< 3 dibujos y chicos) se pegan al bloque más cercano
    grandes = [g for g in lista if len(g) >= 3]
    for g in lista:
        if len(g) >= 3 or not grandes:
            continue
        c = centro(caja_g(g))
        mejor = min(grandes, key=lambda h: dist_caja(c, caja_g(h)))
        if dist_caja(c, caja_g(mejor)) < 40:
            mejor.extend(g)
            mejor.sort(key=lambda d: d["i"])
        else:
            grandes.append(g)
    # Orden de lectura: por filas (solape vertical) y de izquierda a derecha
    grandes.sort(key=lambda g: caja_g(g)[1])
    filas = []
    for g in grandes:
        c = caja_g(g)
        for f in filas:
            fc = f["caja"]
            sol = min(c[3], fc[3]) - max(c[1], fc[1])
            if sol > 0.5 * min(c[3] - c[1], fc[3] - fc[1]):
                f["bloques"].append(g)
                f["caja"] = union(fc, c)
                break
        else:
            filas.append({"caja": c, "bloques": [g]})
    salida = []
    for nf, f in enumerate(filas):
        for g in sorted(f["bloques"], key=lambda g: caja_g(g)[0]):
            salida.append({"n": len(salida), "fila": nf, "dibs": g, "caja": caja_g(g)})
    return salida


def caja_g(g):
    c = rect_l(g[0]["rect"])
    for d in g[1:]:
        c = union(c, rect_l(d["rect"]))
    return c


def dist_caja(p, c):
    dx = max(c[0] - p[0], 0, p[0] - c[2])
    dy = max(c[1] - p[1], 0, p[1] - c[3])
    return math.hypot(dx, dy)


# =====================================================================================================
# 2. Piezas de un bloque
# =====================================================================================================


def agrupar_piezas(dibs, forzadas):
    """Agrupa los dibujos en piezas. Con capas nombradas: una pieza por capa. Sin nombre: base + decorados."""
    piezas = []
    por_capa = {}
    pendientes = []  # sombras que esperan a la pieza de arriba
    for d in dibs:
        nombre_capa = forzadas.get(d["i"]) or (d["capa"] if capa_con_nombre(d["capa"]) else None)
        if nombre_capa:
            p = por_capa.get(nombre_capa)
            if p is None:
                p = Pieza(d)
                p.nombre = nombre_capa
                p.de = "mapa" if d["i"] in forzadas else "capa"
                por_capa[nombre_capa] = p
                piezas.append(p)
            else:
                p.dibs.append(d)
            continue
        c = rect_l(d["rect"])
        if d["op"] < OPACIDAD_SOMBRA:
            ctr = centro(c)
            duena = next((p for p in reversed(piezas) if p.nombre is None and dentro(ctr, p.caja_base)), None)
            if duena:
                duena.dibs.append(d)
            else:
                pendientes.append(d)
            continue
        duena = None
        for p in reversed(piezas[-3:]):
            if p.nombre is not None:
                continue
            b = p.caja_base
            if area(c) > 0 and area(inter(c, b)) / area(c) >= CONTENIDO_DECORADO and area(c) / max(1e-6, area(b)) >= AREA_DECORADO:
                duena = p
                break
        if duena:
            duena.dibs.append(d)
            continue
        p = Pieza(d)
        # Sombras pendientes que caen sobre esta pieza: van debajo de ella
        for s in list(pendientes):
            if dentro(centro(rect_l(s["rect"])), p.caja_base):
                p.dibs.insert(0, s)
                pendientes.remove(s)
        piezas.append(p)
    # Sombras huérfanas: a la pieza más cercana
    for s in pendientes:
        if piezas:
            ctr = centro(rect_l(s["rect"]))
            min(piezas, key=lambda p: dist_caja(ctr, p.caja)).dibs.append(s)
    # Pedacitos de color dentro de la caja de una pieza vecina posterior del mismo tono (bisagras de anteojos…)
    total = area(caja_g(dibs))
    for p in list(piezas):
        if p.nombre or not p.color or p.lum < OSCURO or p.lum > BLANCO or area(p.caja) > 0.005 * total:
            continue
        k = piezas.index(p)
        for q in piezas[k + 1 : k + 4]:
            if q.nombre or not q.color or q.lum < OSCURO or q.lum > BLANCO:
                continue
            if dentro((p.caja[0], p.caja[1]), q.caja, 2) and dentro((p.caja[2], p.caja[3]), q.caja, 2):
                if abs(tono(p.color) - tono(q.color)) < 25:
                    q.dibs = p.dibs + q.dibs
                    piezas.remove(p)
                    break
    for p in piezas:
        p.dibs.sort(key=lambda d: d["i"])
    return piezas


def capa_con_nombre(capa):
    c = (capa or "").strip().lower()
    return bool(c) and not c.startswith("capa ") and not c.startswith("layer ") and c not in ("capa", "layer")


# =====================================================================================================
# 3. Análisis de un bloque: cabeza, rasgos, cuerpo, manos, pies, corona
# =====================================================================================================


# Rol de una pieza nombrada, por el prefijo de su nombre de capa
ROLES_NOMBRE = {
    "cabeza": "cabeza", "cuerpo": "cuerpo", "torso": "cuerpo", "brazo": "brazo", "antebrazo": "antebrazo",
    "mano": "mano", "pierna": "pierna", "pie": "pie", "petalo": "corona", "pelo": "corona", "oreja": "corona",
    "cola": "detalle", "accesorio": "detalle",
}
RASGOS_NOMBRE = {"ojo": "ojos", "pupila": "ojos", "parpado": "ojos", "ceja": "cejas", "boca": "boca",
                 "anteojos": "anteojos", "lentes": "anteojos", "tocado": "tocado", "sombrero": "tocado", "gorro": "tocado",
                 "nariz": "extras", "mejilla": "extras"}


def prefijo(nombre):
    return (nombre or "").lower().split("_")[0].split(".")[0]


def es_rasgo_color(p):
    return p.lum is not None and (p.lum < OSCURO or p.lum > BLANCO)


def buscar_cabeza(piezas):
    """La cabeza es la pieza dibujada antes de los rasgos (oscuros o blancos chicos) que más rasgos contiene."""
    nombrada = next((p for p in piezas if (p.nombre or "").lower() == "cabeza"), None)
    if nombrada:
        return nombrada
    candidatos = []
    for h in piezas:
        if es_rasgo_color(h):
            continue
        ch = h.caja_base
        rasgos = [
            p
            for p in piezas
            if p is not h and p.z > h.z and es_rasgo_color(p) and area(p.caja) < RASGO_MAX * area(ch) and dentro(centro(p.caja), ch)
        ]
        if len(rasgos) >= 2:
            candidatos.append((len(rasgos), area(ch), h))
    if not candidatos:
        return None
    candidatos.sort(key=lambda t: (-t[0], -t[1]))
    return candidatos[0][2]


def analizar_rostro(piezas, cabeza, perfil=False):
    """Separa lo que está sobre la cabeza: ojos, cejas, boca, anteojos, tocado y accesorios."""
    ch = cabeza.caja_base
    hw, hh = ch[2] - ch[0], ch[3] - ch[1]
    r = {"ojos": [], "cejas": [], "boca": [], "anteojos": [], "tocado": [], "extras": [], "accesorios": [], "corona": []}
    for p in piezas:
        if p is cabeza:
            continue
        c = p.caja
        ctr = centro(c)
        if p.nombre:  # con nombre de capa: rasgos al rostro, el resto se respeta
            k = RASGOS_NOMBRE.get(prefijo(p.nombre))
            if k and not (k == "boca" and "_" in p.nombre):  # boca_A… son visemas, no la boca de la cara
                r[k].append(p)
            continue
        if p.z > cabeza.z and dentro(ctr, ch) and area(c) < RASGO_MAX * area(ch):
            rel = (ctr[1] - ch[1]) / hh
            relx = (ctr[0] - ch[0]) / hw
            alto_rel = (c[3] - c[1]) / max(1e-6, c[2] - c[0])
            zx0, zx1, zy0, zy1 = ZONA_OJOS
            if rel > ZONA_BOCA and rel < 0.95 and (perfil or abs(relx - 0.5) < 0.22):
                r["boca"].append(p)
            elif not (zy0 <= rel <= zy1 and (perfil or zx0 <= relx <= zx1)):
                # Fuera de la zona de los rasgos: ceja alta, parte de un sombrero (arriba) o de un accesorio
                if rel < zy0 and c[1] > ch[1] + 0.05 * hh and es_rasgo_color(p):
                    r["cejas"].append(p)
                else:
                    r["tocado" if rel < 0.25 else "accesorios"].append(p)
            elif alto_rel < FINO:
                r["cejas"].append(p)
            else:
                r["ojos"].append(p)
        elif p.z > cabeza.z and dentro(ctr, ch):
            r["anteojos"].append(p)  # se confirma abajo: tiene que rodear a un ojo
        elif area(inter(c, ch)) > 0 and ctr[1] < ch[1] + 0.15 * hh and p.z > cabeza.z:
            r["tocado"].append(p)
        elif area(inter(c, ch)) > 0 and not es_rasgo_color(p):
            r["corona"].append(p)  # candidatos: analizar_vista se queda con los de color propio
        else:
            r["accesorios"].append(p)
    # Lentes rellenos que contienen un ojo (anteojos de la bruja): no son ojos
    for p in list(r["ojos"]):
        if not es_rasgo_color(p):
            otros = [o for o in r["ojos"] if o is not p and es_rasgo_color(o) and dentro(centro(o.caja), p.caja) and area(o.caja) < area(p.caja)]
            if otros:
                r["ojos"].remove(p)
                r["anteojos"].append(p)
    # Piezas de color en la zona de la boca que no tocan la boca oscura (nariz roja, rubor): van a extras, así la
    # boca queda solo con lo que se mueve al hablar (la lengua sí queda: está dentro de la boca)
    oscuras = [p for p in r["boca"] if p.lum < OSCURO]
    for p in list(r["boca"]):
        if p.lum >= OSCURO and oscuras and not any(area(inter(p.caja, q.caja)) > 0 for q in oscuras):
            r["boca"].remove(p)
            r["extras"].append(p)
    # Ojos: un grupo por ojo (blanco + pupila + brillo…), unidos por solape
    r["ojos"] = agrupar_ojos(r["ojos"])
    # Anteojos: solo lo que rodea a un ojo; lo demás es sombrero (arriba) o un detalle de la cara
    centros_ojos = [centro(caja_ps(g)) for g in r["ojos"]]
    for p in list(r["anteojos"]):
        if not any(dentro(co, p.caja) for co in centros_ojos):
            r["anteojos"].remove(p)
            rel = (centro(p.caja)[1] - ch[1]) / hh
            (r["tocado"] if rel < 0.3 else r["extras"]).append(p)
    # Accesorios: piezas que se tocan forman un solo accesorio; lo que toca el tocado es parte del tocado
    grupos = racimos(r["accesorios"])
    r["accesorios"] = []
    for g in grupos:
        if r["tocado"] and any(toca(p.caja, q.caja) for p in g for q in r["tocado"]):
            r["tocado"] += g
        else:
            r["accesorios"].append(g)
    return r


def toca(a, b, tol=4):
    return a[0] - tol <= b[2] and b[0] - tol <= a[2] and a[1] - tol <= b[3] and b[1] - tol <= a[3]


def racimos(piezas):
    """Agrupa piezas que se tocan (cadena de contactos)."""
    grupos = []
    for p in sorted(piezas, key=lambda p: p.z):
        juntos = [g for g in grupos if any(toca(p.caja, q.caja) for q in g)]
        nuevo = [p] + [q for g in juntos for q in g]
        grupos = [g for g in grupos if g not in juntos] + [sorted(nuevo, key=lambda q: q.z)]
    return grupos


def agrupar_ojos(piezas):
    grupos = []
    for p in sorted(piezas, key=lambda p: p.z):
        for g in grupos:
            if any(area(inter(p.caja, q.caja)) > 0 for q in g):
                g.append(p)
                break
        else:
            grupos.append([p])
    return sorted(grupos, key=lambda g: centro(caja_ps(g))[0])


def caja_ps(ps):
    c = ps[0].caja
    for p in ps[1:]:
        c = union(c, p.caja)
    return c


def analizar_vista(piezas, bloque, tipo):
    """Nombra las piezas de una vista completa (frente, perfil o espalda)."""
    alertas = []
    caja_b = bloque["caja"]
    alto_b = caja_b[3] - caja_b[1]
    cabeza = buscar_cabeza(piezas)
    nombradas = {p.nombre for p in piezas if p.nombre}
    rostro = None
    if cabeza is None and "cabeza" in nombradas:
        cabeza = next(p for p in piezas if p.nombre == "cabeza")
    if cabeza is None:
        # De espaldas: la pieza más grande de la mitad de arriba
        arriba = [p for p in piezas if not p.nombre and centro(p.caja)[1] < (caja_b[1] + caja_b[3]) / 2]
        if arriba:
            cabeza = max(arriba, key=lambda p: area(p.caja_base))
    if cabeza is not None:
        cabeza.nombre = cabeza.nombre or "cabeza"
        cabeza.rol = "cabeza"
        rostro = analizar_rostro(piezas, cabeza, perfil=(tipo == "perfil"))
        for k in ("ojos",):
            for g in rostro[k]:
                for p in g:
                    p.rol = "rostro"
        for k in ("cejas", "boca", "anteojos", "tocado", "extras"):
            for p in rostro[k]:
                p.rol = "rostro"
    for p in piezas:
        if p.nombre and p.rol is None:
            p.rol = ROLES_NOMBRE.get(prefijo(p.nombre), "detalle")
    restantes = [p for p in piezas if p.rol is None and not p.nombre]
    # Corona (pétalos, pelo): tocan la cabeza y tienen un color propio, distinto del de la cabeza. Semillas: las
    # que quedan arriba; después se suman las del mismo color (pétalos de abajo). Sin rostro (espalda) no hay.
    if cabeza is not None and rostro and (rostro["ojos"] or cabeza.nombre == "cabeza" and cabeza.de != "auto"):
        ch = cabeza.caja_base
        cands = [p for p in rostro["corona"] if p in restantes and not mismo_color(p.color, cabeza.color)]
        semillas = [p for p in cands if centro(p.caja)[1] < ch[3] - 0.15 * (ch[3] - ch[1])]
        corona = semillas + [p for p in cands if p not in semillas and any(mismo_color(p.color, q.color) for q in semillas)]
        for p in corona:
            p.rol = "corona"
            restantes.remove(p)
    # Pies: tocan el piso del bloque
    pies = [p for p in restantes if p.caja[3] >= caja_b[3] - PISO * alto_b]
    for p in pies:
        restantes.remove(p)
    # Cuerpo: la pieza más grande no muy apaisada, debajo del centro de la cabeza
    cy_cab = centro(cabeza.caja)[1] if cabeza else caja_b[1]
    abajo = [p for p in restantes if centro(p.caja)[1] > cy_cab]
    cuerpo = None
    if "cuerpo" not in nombradas and abajo:
        no_apaisadas = [p for p in abajo if (p.caja[2] - p.caja[0]) < 2.0 * (p.caja[3] - p.caja[1])]
        cuerpo = max(no_apaisadas or abajo, key=lambda p: area(p.caja_base))
        cuerpo.nombre, cuerpo.rol = "cuerpo", "cuerpo"
        restantes.remove(cuerpo)
    elif "cuerpo" in nombradas:
        cuerpo = next(p for p in piezas if p.nombre == "cuerpo")
    nuevas = []
    # Manos
    if cuerpo is not None:
        cc = cuerpo.caja
        bw = cc[2] - cc[0]
        bx = (cc[0] + cc[2]) / 2
        for p in list(restantes):
            c = p.caja
            if area(inter(c, [cc[0] - 0.15 * bw, cc[1], cc[2] + 0.15 * bw, cc[3]])) <= 0:
                continue
            if c[0] < cc[0] and c[2] > cc[2]:
                # Las dos manos son un solo trazado que pasa detrás del cuerpo: se divide
                # Cada mano se corta cerca del borde del cuerpo: lo que pasa por detrás no se ve al levantarla
                izq, der = dividir(p, bx, "mano", cc[0] + MANO_ADENTRO * bw, cc[2] - MANO_ADENTRO * bw)
                nuevas += [izq, der]
                restantes.remove(p)
                alertas.append(alerta("info", f"{tipo}: las dos manos son un solo trazado; las separé con un recorte en el centro del cuerpo.", "Para mejor resultado, pedir mano_izq y mano_der en capas separadas."))
                continue
            if area(c) < 0.25 * area(cc):
                dx = centro(c)[0] - bx
                if tipo == "perfil":
                    p.nombre, p.rol = "mano", "mano"
                elif abs(dx) > 0.15 * bw:
                    p.nombre, p.rol = ("mano_izq" if dx < 0 else "mano_der"), "mano"
                else:
                    continue
                restantes.remove(p)
    # Pies: uno por lado; uno solo que cruza el centro se divide
    cx_pies = centro(caja_ps(pies))[0] if pies else (caja_b[0] + caja_b[2]) / 2
    if len(pies) == 1 and tipo != "perfil":
        p = pies[0]
        c = p.caja
        w = c[2] - c[0]
        if (cx_pies - c[0]) > DIVIDIR_LADO * w and (c[2] - cx_pies) > DIVIDIR_LADO * w:
            izq, der = dividir(p, cx_pies, "pie")
            nuevas += [izq, der]
            alertas.append(alerta("info", f"{tipo}: los dos pies son un solo trazado; los separé con un recorte en el centro.", "Para caminar mejor, pedir pie_izq y pie_der (o pierna_izq/pierna_der) en capas separadas."))
            pies = []
    for p in pies:
        dx = centro(p.caja)[0] - cx_pies
        if len(pies) == 1:
            p.nombre = "pie"
        elif tipo == "perfil":
            p.nombre = "pie" if p is max(pies, key=lambda q: q.z) else "pie_atras"
        else:
            p.nombre = "pie_izq" if dx < 0 else "pie_der"
        p.rol = "pie"
    # Nombres de la corona según la dirección desde el centro de la cabeza
    if cabeza is not None:
        ccab = centro(cabeza.caja_base)
        for p in [p for p in piezas if p.rol == "corona"]:
            ang = math.degrees(math.atan2(centro(p.caja)[1] - ccab[1], centro(p.caja)[0] - ccab[0]))
            p.nombre = "pelo_" + direccion(ang)
    # Lo que queda: detalles pegados a la pieza que más tapan
    for p in restantes:
        if p.rol is None and not p.nombre:
            p.rol = "detalle"
            p.nombre = "detalle"
    piezas = [p for p in piezas if p.rol != "rostro"] + nuevas
    # Quitar las piezas divididas (reemplazadas por sus mitades)
    divididas = {id(n.original) for n in nuevas}
    piezas = [p for p in piezas if id(p) not in divididas]
    nombres_unicos(piezas)
    piezas.sort(key=lambda p: (p.z, 0 if p.clip is None else (0 if "izq" in (p.nombre or "") else 1)))
    return piezas, cabeza, rostro, alertas


def mismo_color(a, b):
    if not a or not b:
        return False
    return all(abs(int(a[i : i + 2], 16) - int(b[i : i + 2], 16)) <= COLOR_IGUAL for i in (1, 3, 5))


def direccion(ang):
    nombres = ["der", "inf_der", "inf", "inf_izq", "izq", "sup_izq", "sup", "sup_der"]
    k = round(((ang % 360) / 45)) % 8
    return nombres[k]


def dividir(p, x, prefijo, x_izq=None, x_der=None):
    """Divide una pieza en dos con recortes verticales: la izquierda hasta x_izq y la derecha desde x_der
    (por defecto, las dos en x). Izquierda / derecha de la pantalla."""
    c = p.caja
    m = 4
    x_izq = x if x_izq is None else x_izq
    x_der = x if x_der is None else x_der
    izq = Pieza(p.base)
    izq.dibs = list(p.dibs)
    izq.clip = f"M{c[0] - m:.2f} {c[1] - m:.2f}L{x_izq:.2f} {c[1] - m:.2f}L{x_izq:.2f} {c[3] + m:.2f}L{c[0] - m:.2f} {c[3] + m:.2f}Z"
    izq.nombre, izq.rol, izq.original, izq.dividida = f"{prefijo}_izq", prefijo, p, True
    der = Pieza(p.base)
    der.dibs = list(p.dibs)
    der.clip = f"M{x_der:.2f} {c[1] - m:.2f}L{c[2] + m:.2f} {c[1] - m:.2f}L{c[2] + m:.2f} {c[3] + m:.2f}L{x_der:.2f} {c[3] + m:.2f}Z"
    der.nombre, der.rol, der.original, der.dividida = f"{prefijo}_der", prefijo, p, True
    return izq, der


def nombres_unicos(piezas):
    vistos = Counter()
    for p in piezas:
        vistos[p.nombre] += 1
    usados = Counter()
    for p in piezas:
        if vistos[p.nombre] > 1:
            usados[p.nombre] += 1
            p.nombre = f"{p.nombre}_{usados[p.nombre]}"


def alerta(nivel, texto, propuesta=None):
    a = {"nivel": nivel, "texto": texto}
    if propuesta:
        a["propuesta"] = propuesta
    return a


# =====================================================================================================
# 4. Salida: trazos SVG relativos al origen
# =====================================================================================================


def trazos_de(p_or_dibs, dx, dy, fn=None):
    dibs = p_or_dibs.dibs if isinstance(p_or_dibs, Pieza) else p_or_dibs
    salida = []
    for d in dibs:
        t = trazo(d, dx, dy)
        if d["op"] < 0.999:
            t["op"] = d["op"]
        if d.get("clip"):
            t["clip"] = transformar_d(d["clip"], lambda x, y: (x + dx, y + dy))
        if fn:
            t["d"] = transformar_d(t["d"], fn)
            if "clip" in t:
                t["clip"] = transformar_d(t["clip"], fn)
            if "sw" in t:
                t["sw"] = round(t["sw"] * escala_fn(fn), 2)
        salida.append(t)
    return salida


def escala_fn(fn):
    a = fn(0, 0)
    b = fn(1, 0)
    return math.hypot(b[0] - a[0], b[1] - a[1])


def mover(c, dx, dy):
    return redondear([c[0] + dx, c[1] + dy, c[2] + dx, c[3] + dy])


def color_bajo(punto, dibs_bajo):
    """Color del dibujo más alto (último) que cubre el punto, entre los dados."""
    for d in reversed(dibs_bajo):
        if d.get("fill") is None or d["op"] < OPACIDAD_SOMBRA:
            continue
        if dentro(punto, rect_l(d["rect"])) and contiene(d, *punto):
            return hexa(d["fill"])
    return None


def datos_ojos(grupos, dibs_bajo, fn, dx, dy):
    """Centro, tamaño y color de tapa (lo que se ve detrás del ojo cerrado) de cada ojo."""
    ojos = []
    ids_ojo = {id(d) for g in grupos for p in g for d in p.dibs}
    bajo = [d for d in dibs_bajo if id(d) not in ids_ojo]
    for g in grupos:
        c = caja_ps(g)
        w, h = c[2] - c[0], c[3] - c[1]
        cx, cy = centro(c)
        # La tapa: lo que hay justo afuera del ojo (cara o lente relleno)
        muestras = [(c[0] - 0.08 * w, cy), (c[2] + 0.08 * w, cy), (cx, c[1] - 0.08 * h), (cx, c[3] + 0.08 * h)]
        colores = [color_bajo(m, bajo) for m in muestras]
        colores = [k for k in colores if k]
        tapa = Counter(colores).most_common(1)[0][0] if colores else None
        p0 = fn(cx + dx, cy + dy) if fn else (cx + dx, cy + dy)
        s = escala_fn(fn) if fn else 1
        abierto = any(p.lum > BLANCO for p in g) or (h / max(1e-6, w)) >= FINO
        ojos.append(
            {
                "c": [round(p0[0], 1), round(p0[1], 1)],
                "w": round(w * s, 1),
                "h": round(h * s, 1),
                "tapa": tapa,
                "abierto": abierto,
                "trazos": [t for p in g for t in trazos_de(p, dx, dy, fn)],
            }
        )
    return ojos


def boca_datos(ps, dx, dy, fn=None):
    if not ps:
        return None
    c = caja_ps(ps)
    tr = [t for p in ps for t in trazos_de(p, dx, dy, fn)]
    if fn:
        a = fn(c[0] + dx, c[1] + dy)
        b = fn(c[2] + dx, c[3] + dy)
        cc = [a[0], a[1], b[0], b[1]]
    else:
        cc = [c[0] + dx, c[1] + dy, c[2] + dx, c[3] + dy]
    return {"trazos": tr, "caja": redondear(cc), "c": [round((cc[0] + cc[2]) / 2, 1), round((cc[1] + cc[3]) / 2, 1)]}


def grupo_trazos(ps, dx, dy, fn=None):
    if not ps:
        return None
    return {"trazos": [t for p in sorted(ps, key=lambda p: p.z) for t in trazos_de(p, dx, dy, fn)]}


# =====================================================================================================
# 5. Programa
# =====================================================================================================


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("ai")
    ap.add_argument("nombre")
    ap.add_argument("--sinteticas", default="todas", help="todas | ninguna | lista separada por comas (visemas,pie_atras,mano_atras)")
    ap.add_argument("--mapa", default=None)
    ap.add_argument("--salida", default=None)
    ap.add_argument("--revision", default=None)
    ap.add_argument("--sin-copia", action="store_true", help="no copiar el original a carpetaPersonajes")
    a = ap.parse_args()

    nombre = a.nombre
    ai = Path(a.ai)
    salida = Path(a.salida) if a.salida else RAIZ / "public" / "personajes" / nombre
    revision = Path(a.revision) if a.revision else RAIZ / "out" / "personajes" / nombre
    ruta_mapa = Path(a.mapa) if a.mapa else RAIZ / "src" / "personajes" / nombre / "mapa.json"
    mapa = json.loads(ruta_mapa.read_text(encoding="utf8")) if ruta_mapa.exists() else {}
    sinteticas = set(VISEMAS_SINT) if a.sinteticas == "todas" else set() if a.sinteticas == "ninguna" else set(a.sinteticas.split(","))
    salida.mkdir(parents=True, exist_ok=True)
    revision.mkdir(parents=True, exist_ok=True)

    # Copia del original a la biblioteca de personajes (fuera de public/)
    fuente = str(ai).replace("\\", "/")
    if not a.sin_copia:
        herr = json.loads((RAIZ / "scripts" / "herramientas.json").read_text(encoding="utf8"))
        carpeta = Path(herr.get("carpetaPersonajes", "C:/Videos/personajes")) / nombre
        carpeta.mkdir(parents=True, exist_ok=True)
        destino = carpeta / ai.name
        if not destino.exists() or destino.stat().st_size != ai.stat().st_size:
            shutil.copy2(ai, destino)
        fuente = str(destino).replace("\\", "/")

    pag, dibs = leer(ai)
    capas = Counter(d["capa"] for d in dibs)
    con_nombre = [c for c in capas if capa_con_nombre(c)]
    forzadas = {int(k): v for k, v in (mapa.get("piezas") or {}).items()}
    bls = bloques(dibs)
    alertas = []
    if con_nombre:
        alertas.append(alerta("info", f"Capas con nombre: {len(con_nombre)} ({', '.join(sorted(con_nombre)[:12])}{'…' if len(con_nombre) > 12 else ''})."))
    else:
        alertas.append(alerta("info", "El .ai no tiene capas con nombre: piezas deducidas por posición, color y orden de dibujo.", "Revisar hoja_vistas.png; corregir con mapa.json o pedir capas con nombre (GUIA_DISENADOR.md)."))

    # ---- Clasificación de bloques ----
    tipos_mapa = {int(k): v for k, v in (mapa.get("bloques") or {}).items()}
    analisis = []
    for b in bls:
        piezas = agrupar_piezas(b["dibs"], forzadas)
        cab = buscar_cabeza(piezas)
        if cab is None and any(p.nombre == "cabeza" for p in piezas):
            cab = next(p for p in piezas if p.nombre == "cabeza")
        ojos = analizar_rostro(piezas, cab)["ojos"] if cab else []
        blancos = [g for g in ojos if any(p.lum > BLANCO for p in g)]
        analisis.append({"b": b, "piezas": piezas, "cabeza": cab, "nojos": len(blancos or ojos)})
    # Vistas: fila de arriba (salvo que el mapa diga otra cosa)
    fila0 = [x for x in analisis if x["b"]["fila"] == 0]
    altura_vista = max((x["b"]["caja"][3] - x["b"]["caja"][1]) for x in fila0) if fila0 else 0
    for x in analisis:
        n = x["b"]["n"]
        if n in tipos_mapa:
            t = tipos_mapa[n]
            x["tipo"], _, x["nombre"] = t.partition(":")
            continue
        if x["b"]["fila"] == 0 and (x["b"]["caja"][3] - x["b"]["caja"][1]) > 0.6 * altura_vista:
            x["tipo"] = "vista"
            x["nombre"] = "frente" if x["nojos"] >= 2 else "perfil" if x["nojos"] == 1 else "espalda"
        elif x["cabeza"] is not None:
            x["tipo"], x["nombre"] = "cara", None
        else:
            x["tipo"], x["nombre"] = "suelto", None
    # Nombres únicos
    usados = Counter()
    ncara = 0
    for x in analisis:
        if x["tipo"] == "vista":
            usados[x["nombre"]] += 1
            if usados[x["nombre"]] > 1:
                x["nombre"] = f"{x['nombre']}{usados[x['nombre']]}"
        elif x["tipo"] == "cara" and not x["nombre"]:
            ncara += 1
            x["nombre"] = f"cara{ncara}"
        elif x["tipo"] == "suelto" and not x["nombre"]:
            x["nombre"] = f"suelto{x['b']['n']}"

    vistas = {}
    rostros = {}
    accesorios = {}
    visemas_capa = {}
    frente_ref = None  # (cabeza caja, origen) de la vista de frente, para alinear las caras
    renombrar = mapa.get("renombrar") or {}
    prefijo_corona = mapa.get("prefijoCorona", "pelo")

    # ---- Vistas ----
    for x in [x for x in analisis if x["tipo"] == "vista"]:
        nombre_v = x["nombre"]
        tipo_v = "perfil" if nombre_v.startswith("perfil") else "espalda" if nombre_v.startswith("espalda") else "frente"
        piezas, cabeza, rostro, al = analizar_vista(x["piezas"], x["b"], tipo_v)
        alertas += al
        for p in piezas:
            if p.rol == "corona" and p.nombre.startswith("pelo_"):
                p.nombre = prefijo_corona + p.nombre[4:]
            p.nombre = renombrar.get(f"{nombre_v}.{p.nombre}", p.nombre)
        nombres_unicos(piezas)
        cb = x["b"]["caja"]
        pies = [p for p in piezas if p.rol == "pie"]
        ox = centro(caja_ps(pies))[0] if pies else (cb[0] + cb[2]) / 2
        oy = max(p.caja[3] for p in pies) if pies else cb[3]
        if tipo_v == "perfil" and pies:
            ox = centro(caja_ps(pies))[0]
        dx, dy = -ox, -oy
        v = {"caja": mover(cb, dx, dy), "origenPagina": [round(ox, 1), round(oy, 1)], "piezas": []}
        for p in piezas:
            pz = {
                "id": p.nombre,
                "rol": p.rol or "detalle",
                "z": p.z,
                "caja": mover(p.caja, dx, dy),
                "dibujos": [d["i"] for d in p.dibs],
                "de": p.de,
                "trazos": trazos_de(p, dx, dy),
            }
            if p.clip:
                pz["clip"] = transformar_d(p.clip, lambda X, Y: (X + dx, Y + dy))
            v["piezas"].append(pz)
        if cabeza is not None:
            v["cabeza"] = {"id": cabeza.nombre, "caja": mover(cabeza.caja_base, dx, dy), "z": cabeza.z}
        if rostro and (rostro["ojos"] or rostro["boca"]):
            dibs_bajo = [d for p in x["piezas"] for d in p.dibs]
            r = rostro_salida(rostro, dibs_bajo, dx, dy, None, cabeza.z)
            v["rostro"] = r
            if tipo_v == "frente" and frente_ref is None:
                frente_ref = (cabeza.caja_base, (dx, dy), nombre_v)
                rostros[mapa.get("rostroVista", "vista")] = dict(r, de=nombre_v)
        # Faltantes por vista
        if tipo_v == "perfil":
            if len([p for p in piezas if p.rol == "pie"]) == 1:
                alertas.append(alerta("aviso", "perfil: hay un solo pie dibujado; para caminar o correr hace falta el de atrás.", "Generarlo (sintético): copia del pie, más oscura y detrás del cuerpo. [pie_atras]"))
                if "pie_atras" in sinteticas:
                    v["piezas"].insert(0, copia_atras(v["piezas"], "pie", "pie_atras", dx=-0.35))
            if len([p for p in piezas if p.rol == "mano"]) == 1:
                alertas.append(alerta("aviso", "perfil: hay una sola mano dibujada.", "Generar la de atrás (sintética): copia más oscura detrás del cuerpo. [mano_atras]"))
                if "mano_atras" in sinteticas:
                    v["piezas"].insert(0, copia_atras(v["piezas"], "mano", "mano_atras", dx=0.25))
        vistas[nombre_v] = v

    if frente_ref is None:
        alertas.append(alerta("error", "No encontré una vista de frente con cara (2 ojos).", "Indicar en mapa.json qué bloque es el frente: {\"bloques\": {\"0\": \"vista:frente\"}}"))

    # ---- Caras (expresiones) alineadas a la cabeza del frente ----
    for x in [x for x in analisis if x["tipo"] == "cara"]:
        nombre_c = x["nombre"]
        cab = x["cabeza"]
        if frente_ref is None or cab is None:
            continue
        ref, (fdx, fdy), _ = frente_ref
        cc = cab.caja_base
        s = (ref[2] - ref[0]) / max(1e-6, cc[2] - cc[0])
        rc, ccc = centro(ref), centro(cc)

        def fn(X, Y, s=s, rc=rc, ccc=ccc, fdx=fdx, fdy=fdy):
            return ((X - ccc[0]) * s + rc[0] + fdx, (Y - ccc[1]) * s + rc[1] + fdy)

        rostro = analizar_rostro(x["piezas"], cab)
        dibs_bajo = [d for p in x["piezas"] for d in p.dibs]
        r = rostro_salida(rostro, dibs_bajo, 0, 0, fn, cab.z)
        r["de"] = f"bloque {x['b']['n']}"
        rostros[nombre_c] = r
        # Accesorios sueltos de la cara (escoba, alas…): en coordenadas del frente
        sueltas = [p for g in rostro["accesorios"] for p in g] + rostro["corona"]
        grupos_acc = []
        for g in racimos(sueltas):
            chico = area(caja_ps(g)) < 0.01 * area(cab.caja_base)
            if rostro["tocado"] and any(toca(p.caja, q.caja, 12 if chico else 4) for p in g for q in rostro["tocado"]) and centro(caja_ps(g))[1] < centro(cab.caja_base)[1]:
                rostro["tocado"] += g
            else:
                grupos_acc.append(g)
        r["tocado"] = grupo_trazos(rostro["tocado"], 0, 0, fn) if rostro["tocado"] else r.get("tocado")
        if not r.get("tocado"):
            r.pop("tocado", None)
        grupos_acc.sort(key=lambda g: (centro(caja_ps(g))[1], centro(caja_ps(g))[0]))
        for k, g in enumerate(grupos_acc):
            nombre_a = renombrar.get(f"{nombre_c}.accesorio{k + 1}", f"{nombre_c}_accesorio{k + 1}")
            tr = [t for p in g for t in trazos_de(p, 0, 0, fn)]
            c = caja_ps(g)
            a0, a1 = fn(c[0], c[1]), fn(c[2], c[3])
            accesorios[nombre_a] = {"trazos": tr, "caja": redondear([a0[0], a0[1], a1[0], a1[1]]), "de": nombre_c, "detras": min(p.z for p in g) < cab.z}

    # ---- Bloques sueltos: accesorios o bocas con nombre (boca_A…) ----
    for x in [x for x in analisis if x["tipo"] == "suelto"]:
        for p in x["piezas"]:
            if p.nombre and p.nombre.lower().startswith("boca_"):
                v = p.nombre.split("_", 1)[1].upper()
                c = p.caja
                cx, cy = centro(c)
                visemas_capa[v] = {"trazos": trazos_de(p, -cx, -cy), "w": round(c[2] - c[0], 1), "h": round(c[3] - c[1], 1), "de": "capa"}
        resto = [p for p in x["piezas"] if not (p.nombre and p.nombre.lower().startswith("boca_"))]
        if resto:
            # Accesorio suelto en su capa (accesorio_escoba → «escoba»); si no, el nombre del bloque
            capas_resto = {p.nombre for p in resto if p.nombre}
            nombre_s = x["nombre"]
            if len(capas_resto) == 1 and len(resto) == sum(1 for p in resto if p.nombre):
                nombre_s = next(iter(capas_resto)).removeprefix("accesorio_")
            c = caja_ps(resto)
            cx, cy = centro(c)
            accesorios[nombre_s] = {"trazos": [t for p in sorted(resto, key=lambda p: p.z) for t in trazos_de(p, -cx, -cy)], "caja": redondear([c[0] - cx, c[1] - cy, c[2] - cx, c[3] - cy]), "de": "suelto"}

    # ---- Visemas para hablar ----
    visemas = dict(visemas_capa)
    faltan = [v for v in VISEMAS if v not in visemas]
    if faltan:
        ref_boca = boca_abierta(rostros)
        neutra = rostros.get(mapa.get("rostroVista", "vista"), {}).get("boca")
        alertas.append(
            alerta(
                "aviso",
                f"Faltan bocas para hablar: {', '.join(faltan)}.",
                f"Generarlas (sintéticas) a partir de la boca abierta de «{ref_boca[0] if ref_boca else '—'}» y una boca cerrada M/B/P dibujada por código. [visemas]",
            )
        )
        if "visemas" in sinteticas and ref_boca and neutra:
            visemas.update(sintetizar_visemas(ref_boca[1], neutra, faltan))
        elif "visemas" in sinteticas:
            alertas.append(alerta("error", "No hay una boca abierta ni una neutra para derivar los visemas.", "Pedir bocas A–F al diseñador (GUIA_DISENADOR.md)."))

    # Alertas por rostro: ojos cerrados que no se pueden tapar
    for n, r in rostros.items():
        for o in r.get("ojos", []):
            if o["abierto"] and not o["tapa"]:
                alertas.append(alerta("aviso", f"cara {n}: no encontré el color detrás de un ojo para el parpadeo.", "Se tapa con el color de la cabeza."))

    datos = {
        "version": VERSION,
        "nombre": nombre,
        "fuente": fuente,
        "unidad": "pt",
        "bloques": [
            {"n": x["b"]["n"], "tipo": x["tipo"], "nombre": x["nombre"], "caja": redondear(x["b"]["caja"]), "dibujos": [x["b"]["dibs"][0]["i"], x["b"]["dibs"][-1]["i"]]}
            for x in analisis
        ],
        "vistas": vistas,
        "rostros": rostros,
        "visemas": visemas,
        "accesorios": accesorios,
        "alertas": alertas,
    }
    ruta = salida / "piezas.json"
    ruta.write_text(json.dumps(datos, ensure_ascii=False), encoding="utf8")

    # ---- Rig propuesto ----
    rig = proponer_rig(datos)
    ruta_rig = salida / "rig.json"
    if ruta_rig.exists():
        actual = json.loads(ruta_rig.read_text(encoding="utf8"))
        rig = completar_rig(actual, rig)
        if rig != actual:
            (salida / "rig.propuesto.json").write_text(json.dumps(rig, ensure_ascii=False, indent=1), encoding="utf8")
            alertas.append(alerta("info", "rig.json ya existía (con tus ajustes): las piezas nuevas quedaron en rig.propuesto.json.", "Revisar y copiar lo que haga falta."))
    else:
        ruta_rig.write_text(json.dumps(rig, ensure_ascii=False, indent=1), encoding="utf8")

    # ---- Revisión: hojas chicas y informe ----
    hojas(pag, analisis, vistas, revision)
    hoja_rostros(datos, revision)
    informe(datos, revision / "informe.md", ruta, ruta_rig)
    print(f"OK {ruta} ({ruta.stat().st_size // 1024} KB)")
    print("   vistas: " + ", ".join(f"{k} ({len(v['piezas'])} piezas)" for k, v in vistas.items()))
    print(f"   rostros: {', '.join(rostros)}")
    print(f"   accesorios: {', '.join(accesorios) or '—'}  ·  visemas: {', '.join(sorted(visemas)) or '—'}")
    for al in alertas:
        print(f"   [{al['nivel']}] {al['texto']}" + (f" → {al['propuesta']}" if al.get("propuesta") else ""))
    print(f"   revisión: {revision}")


VISEMAS_SINT = ["visemas", "pie_atras", "mano_atras"]


def rostro_salida(rostro, dibs_bajo, dx, dy, fn, z_cabeza):
    r = {"ojos": datos_ojos(rostro["ojos"], dibs_bajo, fn, dx, dy)}
    b = boca_datos(rostro["boca"], dx, dy, fn)
    if b:
        r["boca"] = b
    for k in ("cejas", "anteojos", "tocado", "extras"):
        g = grupo_trazos(rostro[k], dx, dy, fn)
        if g:
            r[k] = g
    return r


def copia_atras(piezas_v, rol, nuevo, dx):
    """Pieza sintética del lado de atrás: copia oscurecida de la primera pieza del rol, corrida dx·ancho."""
    base = next(p for p in piezas_v if p["rol"] == rol)
    c = base["caja"]
    corr = dx * (c[2] - c[0])
    tr = []
    for t in base["trazos"]:
        t2 = dict(t)
        t2["d"] = transformar_d(t["d"], lambda X, Y: (X + corr, Y))
        if "clip" in t2:
            t2["clip"] = transformar_d(t["clip"], lambda X, Y: (X + corr, Y))
        if t2.get("fill"):
            t2["fill"] = oscurecer(t2["fill"], COLORES_SOMBRA_ATRAS)
        if t2.get("stroke"):
            t2["stroke"] = oscurecer(t2["stroke"], COLORES_SOMBRA_ATRAS)
        tr.append(t2)
    return {
        "id": nuevo,
        "rol": rol,
        "z": -1,
        "caja": redondear([c[0] + corr, c[1], c[2] + corr, c[3]]),
        "dibujos": [],
        "de": "sintetica",
        "sintetica": True,
        "trazos": tr,
    }


def boca_abierta(rostros):
    """La boca más abierta (alto/ancho) de todas las caras: referencia para hablar."""
    mejor = None
    for n, r in rostros.items():
        b = r.get("boca")
        if not b:
            continue
        c = b["caja"]
        w, h = c[2] - c[0], c[3] - c[1]
        if w <= 0:
            continue
        rel = h / w
        # La boca abierta de referencia: su trazo más grande es oscuro (no una nariz roja ni un rubor)
        mayor = max(b["trazos"], key=lambda t: area(caja_d(t["d"])))
        oscura = luminancia(mayor.get("fill") or mayor.get("stroke") or "#ffffff") < OSCURO
        if oscura and rel > 0.3 and (mejor is None or rel * w > mejor[2]):
            mejor = (n, b, rel * w)
    return mejor


def sintetizar_visemas(abierta, neutra, faltan):
    """Visemas derivados: escalas de la boca abierta (B–F) y una boca cerrada M/B/P (A) dibujada por código.
    Quedan centrados en (0, 0); el rig los ubica en el centro de la boca de cada expresión."""
    salida = {}
    ca = abierta["caja"]
    cn = neutra["caja"]
    acx, acy = centro(ca)
    wa = ca[2] - ca[0]
    w_obj = ANCHO_HABLA * (cn[2] - cn[0])
    s0 = w_obj / max(1e-6, wa)
    for v in faltan:
        if v == "A":
            continue
        sx, sy = VISEMA_ESCALA[v]

        def fn(X, Y, sx=sx, sy=sy):
            return ((X - acx) * s0 * sx, (Y - acy) * s0 * sy)

        tr = []
        for t in abierta["trazos"]:
            t2 = dict(t)
            t2["d"] = transformar_d(t["d"], fn)
            if "clip" in t2:
                t2["clip"] = transformar_d(t["clip"], fn)
            tr.append(t2)
        salida[v] = {"trazos": tr, "w": round(wa * s0 * sx, 1), "h": round((ca[3] - ca[1]) * s0 * sy, 1), "de": "sintetica", "sintetica": True}
    if "A" in faltan:
        # Cerrada M/B/P: línea gruesa apenas curva con el color de la boca neutra
        color = next((t.get("fill") or t.get("stroke") for t in neutra["trazos"] if (t.get("fill") or t.get("stroke"))), "#150b09")
        w = 0.75 * (cn[2] - cn[0])
        g = max(2.0, 0.14 * w)
        hw = w / 2
        d = (
            f"M{-hw:.2f} {-g / 2:.2f}Q0 {g * 0.6:.2f} {hw:.2f} {-g / 2:.2f}"
            f"Q{hw + g / 2:.2f} 0 {hw:.2f} {g / 2:.2f}Q0 {g * 1.6:.2f} {-hw:.2f} {g / 2:.2f}Q{-hw - g / 2:.2f} 0 {-hw:.2f} {-g / 2:.2f}Z"
        )
        salida["A"] = {"trazos": [{"d": d, "fill": color}], "w": round(w, 1), "h": round(g * 2, 1), "de": "sintetica", "sintetica": True}
    return salida


# =====================================================================================================
# 6. Rig propuesto (huesos y pivotes estimados)
# =====================================================================================================

PADRES = {
    "cuerpo": "raiz",
    "cabeza": "cuerpo",
    "brazo": "cuerpo",
    "antebrazo": "brazo",
    "mano": "antebrazo",
    "pierna": "raiz",
    "pie": "pierna",
    "corona": "cabeza",
    "tocado": "cabeza",
}


def proponer_rig(datos):
    rig = {"version": VERSION, "personaje": datos["nombre"], "vistas": {}}
    for nv, v in datos["vistas"].items():
        piezas = {p["id"]: p for p in v["piezas"]}
        huesos = [{"id": "raiz", "padre": None, "pivote": [0, 0]}]
        asignacion = {}
        cuerpo = next((p for p in v["piezas"] if p["rol"] == "cuerpo"), None)
        cabeza = piezas.get(v.get("cabeza", {}).get("id")) if v.get("cabeza") else None
        if cuerpo:
            c = cuerpo["caja"]
            huesos.append({"id": "cuerpo", "padre": "raiz", "pivote": [round((c[0] + c[2]) / 2, 1), round(c[3] - 0.1 * (c[3] - c[1]), 1)]})
        padre_cab = "cuerpo" if cuerpo else "raiz"
        if cabeza:
            h = cabeza["caja"]
            if cuerpo:
                b = cuerpo["caja"]
                y0, y1 = max(h[1], b[1]), min(h[3], b[3])
                py = (y0 + y1) / 2 if y1 > y0 else (h[3] + b[1]) / 2
            else:
                py = h[3]
            huesos.append({"id": "cabeza", "padre": padre_cab, "pivote": [round((h[0] + h[2]) / 2, 1), round(py, 1)]})
        nombres = {h["id"] for h in huesos}
        for p in v["piezas"]:
            pid, rol, c = p["id"], p["rol"], p["caja"]
            if pid in ("cuerpo",) and cuerpo:
                asignacion[pid] = "cuerpo"
                continue
            if cabeza and pid == cabeza["id"]:
                asignacion[pid] = "cabeza"
                continue
            if rol == "corona" and cabeza:
                # Raíz del pétalo/mechón: donde la recta del centro de la cabeza al de la pieza cruza el borde de la
                # cabeza (elipse inscripta en su caja), un poco hacia adentro
                h = cabeza["caja"]
                hc = centro(h)
                pc = centro(c)
                ux, uy = pc[0] - hc[0], pc[1] - hc[1]
                n = math.hypot(ux, uy) or 1
                ux, uy = ux / n, uy / n
                rx, ry = (h[2] - h[0]) / 2, (h[3] - h[1]) / 2
                borde = 1 / math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2)
                piv = [hc[0] + ux * borde * 0.85, hc[1] + uy * borde * 0.85]
                huesos.append({"id": pid, "padre": "cabeza", "pivote": redondear(piv)})
                asignacion[pid] = pid
            elif rol == "mano":
                padre = next((h for h in (pid.replace("mano", "antebrazo"), pid.replace("mano", "brazo")) if h in nombres), "cuerpo" if cuerpo else "raiz")
                if cuerpo and nv != "perfil" and pid != "mano":
                    b = cuerpo["caja"]
                    borde = b[0] if "izq" in pid else b[2]
                    piv = [min(max(borde, c[0]), c[2]), c[1] + 0.35 * (c[3] - c[1])]
                else:
                    piv = [(c[0] + c[2]) / 2, c[1] + 0.15 * (c[3] - c[1])]
                huesos.append({"id": pid, "padre": padre, "pivote": redondear(piv)})
                asignacion[pid] = pid
            elif rol == "pie":
                padre = next((h for h in (pid.replace("pie", "pierna"),) if h in nombres), "raiz")
                huesos.append({"id": pid, "padre": padre, "pivote": redondear([(c[0] + c[2]) / 2, c[1] + 0.25 * (c[3] - c[1])])})
                asignacion[pid] = pid
            elif rol in ("brazo", "antebrazo", "pierna"):
                lado = pid.split("_", 1)[1] if "_" in pid else ""
                padre = {"brazo": "cuerpo", "antebrazo": f"brazo_{lado}" if lado else "brazo", "pierna": "raiz"}[rol]
                huesos.append({"id": pid, "padre": padre if padre in nombres or padre in ("cuerpo", "raiz") else "cuerpo", "pivote": redondear([(c[0] + c[2]) / 2, c[1] + 0.1 * (c[3] - c[1])])})
                asignacion[pid] = pid
            else:
                # Detalle o pieza nombrada sin hueso conocido: se pega a la pieza que más tapa (cuerpo o cabeza)
                if cabeza and area(inter(c, cabeza["caja"])) > area(inter(c, cuerpo["caja"] if cuerpo else [0, 0, 0, 0])):
                    asignacion[pid] = "cabeza"
                else:
                    asignacion[pid] = "cuerpo" if cuerpo else "raiz"
            nombres = {h["id"] for h in huesos}
        rig["vistas"][nv] = {
            "huesos": huesos,
            "piezas": asignacion,
            "rostro": {"hueso": "cabeza" if cabeza else "raiz"},
            "mano": next((h["id"] for h in huesos if h["id"] in ("mano_der", "mano")), None),
        }
    return rig


def completar_rig(actual, propuesto):
    """Agrega al rig existente (con ajustes del usuario) solo lo que falte; no toca lo ajustado."""
    rig = json.loads(json.dumps(actual))
    for nv, vp in propuesto["vistas"].items():
        va = rig["vistas"].setdefault(nv, vp)
        if va is vp:
            continue
        ids = {h["id"] for h in va["huesos"]}
        for h in vp["huesos"]:
            if h["id"] not in ids:
                va["huesos"].append(h)
        for k, v in vp["piezas"].items():
            va["piezas"].setdefault(k, v)
    return rig


# =====================================================================================================
# 7. Revisión: hojas chicas numeradas e informe
# =====================================================================================================

ANCHO_HOJA = 900  # px: las hojas de revisión se mantienen chicas (pocos tokens)


def hojas(pag, analisis, vistas, carpeta):
    import pymupdf

    # Hoja de bloques: la página entera con el número y tipo de cada bloque
    esc = min(ANCHO_HOJA / pag.rect.width, 900 / pag.rect.height)
    pix = pag.get_pixmap(matrix=pymupdf.Matrix(esc, esc))
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    dib = ImageDraw.Draw(im)
    for x in analisis:
        c = [v * esc for v in x["b"]["caja"]]
        color = {"vista": (220, 30, 30), "cara": (30, 120, 220), "suelto": (30, 160, 60)}.get(x["tipo"], (0, 0, 0))
        dib.rectangle(c, outline=color, width=2)
        dib.text((c[0] + 3, c[1] + 2), f"{x['b']['n']} {x['nombre']}", fill=color)
    im.save(carpeta / "hoja_bloques.png")
    # Hoja de vistas: cada vista ampliada con las cajas y nombres de sus piezas
    fila = [x for x in analisis if x["tipo"] == "vista"]
    if not fila:
        return
    zona = fila[0]["b"]["caja"]
    for x in fila[1:]:
        zona = union(zona, x["b"]["caja"])
    zona = [zona[0] - 10, zona[1] - 10, zona[2] + 10, zona[3] + 10]
    esc = ANCHO_HOJA / (zona[2] - zona[0])
    pix = pag.get_pixmap(matrix=pymupdf.Matrix(esc, esc), clip=pymupdf.Rect(*zona))
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    im = Image.blend(im, Image.new("RGB", im.size, (255, 255, 255)), 0.45)
    dib = ImageDraw.Draw(im)
    paleta = [(214, 39, 40), (31, 119, 180), (44, 160, 44), (148, 103, 189), (255, 127, 14), (23, 190, 207), (140, 86, 75), (227, 119, 194)]
    for nv, v in vistas.items():
        ox, oy = v["origenPagina"]
        for k, p in enumerate(v["piezas"]):
            c = p["caja"]
            r = [(c[0] + ox - zona[0]) * esc, (c[1] + oy - zona[1]) * esc, (c[2] + ox - zona[0]) * esc, (c[3] + oy - zona[1]) * esc]
            col = paleta[k % len(paleta)]
            dib.rectangle(r, outline=col, width=1)
            dib.text((r[0] + 2, r[1] + 1 + (k % 3) * 9), p["id"] + ("*" if p.get("sintetica") else ""), fill=col)
        o = ((ox - zona[0]) * esc, (oy - zona[1]) * esc)
        dib.line([o[0] - 6, o[1], o[0] + 6, o[1]], fill=(0, 0, 0), width=2)
        dib.text((o[0] - 15, o[1] + 3), nv, fill=(0, 0, 0))
    im.save(carpeta / "hoja_vistas.png")


def svg_trazos(trazos, ids):
    """Trazos a SVG (con recortes como clipPath). ids: contador compartido para los ids de los recortes."""
    salida = []
    for t in trazos:
        attrs = f'd="{t["d"]}" fill="{t.get("fill") or "none"}"'
        if t.get("stroke"):
            attrs += f' stroke="{t["stroke"]}" stroke-width="{t.get("sw", 1)}"'
        if t.get("evenodd"):
            attrs += ' fill-rule="evenodd"'
        if t.get("op") is not None:
            attrs += f' opacity="{t["op"]}"'
        if t.get("clip"):
            ids[0] += 1
            salida.append(f'<clipPath id="k{ids[0]}"><path d="{t["clip"]}"/></clipPath>')
            attrs += f' clip-path="url(#k{ids[0]})"'
        salida.append(f"<path {attrs}/>")
    return "".join(salida)


def svg_vista(datos, nv, rostro=None, ids=None):
    """Una vista armada en reposo (sin rig): piezas en orden de dibujo y el rostro sobre la cabeza."""
    ids = ids or [0]
    v = datos["vistas"][nv]
    r = rostro if rostro is not None else v.get("rostro")
    cab = v.get("cabeza", {}).get("id")
    partes = []
    for p in sorted(v["piezas"], key=lambda p: p["z"]):
        g = svg_trazos(p["trazos"], ids)
        if p.get("clip"):
            ids[0] += 1
            g = f'<clipPath id="k{ids[0]}"><path d="{p["clip"]}"/></clipPath><g clip-path="url(#k{ids[0]})">{g}</g>'
        partes.append(g)
        if p["id"] == cab and r:
            for k in ("cejas",):
                if r.get(k):
                    partes.append(svg_trazos(r[k]["trazos"], ids))
            for o in r.get("ojos", []):
                partes.append(svg_trazos(o["trazos"], ids))
            if r.get("boca"):
                partes.append(svg_trazos(r["boca"]["trazos"], ids))
            for k in ("extras", "anteojos", "tocado"):
                if r.get(k):
                    partes.append(svg_trazos(r[k]["trazos"], ids))
    return "".join(partes)


def hoja_rostros(datos, carpeta):
    """Hoja chica: el frente con cada expresión, los visemas y los accesorios (render SVG con PyMuPDF)."""
    import pymupdf

    if "frente" not in datos["vistas"]:
        return
    v = datos["vistas"]["frente"]
    c = v["caja"]
    w, h = c[2] - c[0], c[3] - c[1]
    celdas = [(n, svg_vista(datos, "frente", r)) for n, r in datos["rostros"].items()]
    # Visemas sobre la boca de la vista
    boca = (v.get("rostro") or {}).get("boca")
    if boca:
        sin_boca = dict(v.get("rostro") or {})
        sin_boca.pop("boca", None)
        for k, vis in sorted(datos["visemas"].items()):
            bx, by = boca["c"]
            g = svg_vista(datos, "frente", sin_boca) + f'<g transform="translate({bx} {by})">{svg_trazos(vis["trazos"], [900 + len(celdas)])}</g>'
            celdas.append((f"boca {k}" + ("*" if vis.get("sintetica") else ""), g))
    for n, a in datos["accesorios"].items():
        celdas.append((n, svg_trazos(a["trazos"], [500 + len(celdas)])))
    cols = 6
    filas = math.ceil(len(celdas) / cols)
    cw, chh = w * 1.15, h * 1.15 + 30
    partes = []
    for k, (n, g) in enumerate(celdas):
        x = (k % cols) * cw - c[0] + 0.07 * w
        y = (k // cols) * chh - c[1] + 0.07 * h
        partes.append(f'<g transform="translate({x:.1f} {y:.1f})">{g}</g>')
        partes.append(f'<text x="{(k % cols) * cw + 6:.1f}" y="{(k // cols) * chh + chh - 8:.1f}" font-size="22" font-family="Arial">{n}</text>')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{cols * cw:.0f}" height="{filas * chh:.0f}"><rect width="100%" height="100%" fill="#ffffff"/>{"".join(partes)}</svg>'
    (carpeta / "hoja_rostros.svg").write_text(svg, encoding="utf8")
    doc = pymupdf.open(stream=svg.encode("utf8"), filetype="svg")
    pag = doc[0]
    esc = ANCHO_HOJA / pag.rect.width
    pag.get_pixmap(matrix=pymupdf.Matrix(esc, esc)).save(carpeta / "hoja_rostros.png")


def informe(datos, ruta, ruta_piezas, ruta_rig):
    L = [f"# Informe de extracción — {datos['nombre']}", "", f"- Fuente: `{datos['fuente']}`", f"- Piezas: `{ruta_piezas}`", f"- Rig: `{ruta_rig}`", ""]
    L += ["## Bloques de la hoja", "", "| N | Tipo | Nombre | Dibujos |", "|---|---|---|---|"]
    for b in datos["bloques"]:
        L.append(f"| {b['n']} | {b['tipo']} | {b['nombre']} | {b['dibujos'][0]}–{b['dibujos'][1]} |")
    L += ["", "## Vistas", ""]
    for nv, v in datos["vistas"].items():
        L.append(f"- **{nv}**: " + ", ".join(f"{p['id']}{' (sintética)' if p.get('sintetica') else ''}" for p in v["piezas"]))
    L += ["", "## Caras (expresiones)", "", "- " + ", ".join(datos["rostros"]), "", "## Accesorios", "", "- " + (", ".join(datos["accesorios"]) or "—")]
    L += ["", "## Bocas para hablar", "", "- " + ", ".join(f"{k}{' (sintética)' if v.get('sintetica') else ''}" for k, v in sorted(datos["visemas"].items()))]
    L += ["", "## Alertas y propuestas", ""]
    for a in datos["alertas"]:
        L.append(f"- **{a['nivel']}** — {a['texto']}" + (f" → *{a['propuesta']}*" if a.get("propuesta") else ""))
    ruta.write_text("\n".join(L) + "\n", encoding="utf8")


if __name__ == "__main__":
    main()
