"""Recorta las piezas de la hoja "BLOOMIE · KIT ROCK" (C:/Videos/crudos/<ID>/kit_rock.png, imagen del diseñador)
en PNG con transparencia, una por pieza, en public/trabajos/<ID>/img/. Fondo blanco → transparente (silueta exterior
rellena, así los blancos de adentro —ojos, brillos— se conservan). Las cruces magenta de la guitarra (apoyo de las
manos) se borran del dibujo y sus posiciones quedan en datos/kit.json (fracciones de la pieza).
Uso: python src/trabajos/2026-10-04_claudio_bloomie-rock/recortar_kit.py
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ID = "2026-10-04_claudio_bloomie-rock"
RAIZ = Path(__file__).resolve().parents[3]
HOJA = Path("C:/Videos/crudos") / ID / "kit_rock.png"
IMG = RAIZ / "public/trabajos" / ID / "img"
DATOS = RAIZ / "public/trabajos" / ID / "datos"
# Cajas (x, y, ancho, alto) en la hoja, de las manchas detectadas (componentes conexos sobre blanco)
PIEZAS = {
    "guitarra_frente": (159, 25, 192, 430),
    "guitarra_perfil": (522, 82, 34, 372),
    "correa_guitarra": (714, 179, 316, 255),
    "anteojos_rock": (1111, 262, 335, 142),
    "mano_cuernos_izq": (306, 512, 174, 179),
    "mano_cuernos_der": (678, 511, 171, 180),
    "panuelo_rock": (1032, 521, 320, 170),
    "cara_grito": (135, 748, 227, 197),
    "cara_lengua": (486, 749, 224, 196),
    "cara_extasis": (826, 749, 220, 194),
    "cara_rockero": (1172, 750, 225, 193),
}
MARGEN = 6
BLANCO = 235  # gris por encima del cual es fondo


def tapar_con_parche(img, mascara, cruda):
    """Tapa cada cruz copiando un tramo de la misma pieza corrido en vertical (el mástil y los micrófonos se
    repiten hacia arriba/abajo): se elige el corrimiento que mejor empalma con el borde de alrededor."""
    salida = img.copy()
    n, lab, st, _ = cv2.connectedComponentsWithStats(mascara)
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 40:
            continue
        m = (lab == i).astype(np.uint8)
        anillo = cv2.dilate(m, np.ones((7, 7), np.uint8)) - m
        mejor = None
        if y > img.shape[0] / 2:
            # En el cuerpo no hay tramo repetido del alto de la cruz (micrófonos a ~35 px, mástil y puente de otro
            # color): ahí se rellenan solo los trazos finos de la cruz desde los píxeles vecinos.
            fino = cv2.dilate(((lab == i) & (cruda > 0)).astype(np.uint8) * 255, np.ones((3, 3), np.uint8))
            salida = cv2.inpaint(salida, fino, 3, cv2.INPAINT_NS)
            continue
        for dy in [d for d in range(-(h + 60), h + 61) if abs(d) >= h + 2]:
            if y + dy < 0 or y + h + dy > img.shape[0]:
                continue
            fuente = np.roll(img, -dy, axis=0)
            if (np.roll(mascara, -dy, axis=0)[m > 0] > 0).any():
                continue  # el parche no puede venir de otra cruz
            err = np.mean((fuente[anillo > 0].astype(int) - img[anillo > 0].astype(int)) ** 2)
            if mejor is None or err < mejor[0]:
                mejor = (err, fuente)
        if mejor is not None:
            suave = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.2)[..., None]
            suave = np.maximum(suave, m[..., None].astype(np.float32))
            salida = (salida * (1 - suave) + mejor[1] * suave).astype(np.uint8)
    return salida


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    hoja = cv2.imread(str(HOJA), cv2.IMREAD_UNCHANGED)[:, :, :3]
    IMG.mkdir(parents=True, exist_ok=True)
    kit = {}
    for nombre, (x, y, w, h) in PIEZAS.items():
        x0, y0 = max(0, x - MARGEN), max(0, y - MARGEN)
        rec = hoja[y0:y + h + MARGEN, x0:x + w + MARGEN].copy()
        # Cruces magenta (solo en la guitarra): posición y borrado
        b, g, r = [rec[:, :, i].astype(int) for i in range(3)]
        magenta = ((r > 150) & (r - g > 60) & (b - g > 30)).astype(np.uint8) * 255  # cruz + su borde suavizado
        if nombre == "guitarra_frente" and magenta.any():  # el rosa de la lengua no es una cruz
            cruda = magenta.copy()  # sin engordar: los trazos finos de la cruz
            magenta = cv2.dilate(magenta, np.ones((9, 9), np.uint8))
            n, lab, st, cen = cv2.connectedComponentsWithStats(magenta)
            apoyos = [[round(cen[i][0] / rec.shape[1], 4), round(cen[i][1] / rec.shape[0], 4)] for i in range(1, n) if st[i][4] > 40]
            kit.setdefault(nombre, {})["apoyos"] = sorted(apoyos, key=lambda p: p[1])  # de arriba (mástil) a abajo (cuerpo)
            rec = tapar_con_parche(rec, magenta, cruda)
        # Silueta: lo que no es blanco, cerrada y con los huecos internos rellenos
        gris = cv2.cvtColor(rec, cv2.COLOR_BGR2GRAY)
        m = (gris < BLANCO).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        cont, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        lleno = np.zeros_like(m)
        cv2.drawContours(lleno, [c for c in cont if cv2.contourArea(c) > 200], -1, 255, -1)
        # La correa tiene agujeros reales (la M): ahí se respeta el blanco
        alfa = m if nombre == "correa_guitarra" else lleno
        alfa = cv2.GaussianBlur(alfa, (0, 0), 0.8)
        bgra = np.dstack([rec, alfa])
        cv2.imwrite(str(IMG / f"{nombre}.png"), bgra)
        kit.setdefault(nombre, {})["tam"] = [rec.shape[1], rec.shape[0]]
    DATOS.mkdir(parents=True, exist_ok=True)
    (DATOS / "kit.json").write_text(json.dumps(kit, indent=1), encoding="utf-8")
    print(f"OK {len(PIEZAS)} piezas → {IMG.relative_to(RAIZ)} · apoyos guitarra: {kit['guitarra_frente'].get('apoyos')}")


if __name__ == "__main__":
    main()
