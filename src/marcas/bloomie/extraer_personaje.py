# Kit de marca Bloomie: extrae las piezas animables del personaje desde el .ai (PDF compatible) a un JSON
# de trazos SVG, y el logo (Bloomie de frente) a PNG con transparencia.
# Uso: C:/Videos/_herramientas/.venv/Scripts/python.exe src/marcas/bloomie/extraer_personaje.py
# Salida: public/marcas/bloomie/personaje.json y public/marcas/bloomie/logo.png
#
# El .ai trae una sola capa con la hoja de personaje: las piezas se reconocen por su índice en el orden de
# dibujo. Coordenadas: origen en el centro de los pies de cada vista, y hacia abajo.
import json
import sys
from pathlib import Path

import pymupdf

# Lectura de trazos compartida con los rigs de personajes (scripts/rig/vector_ai.py)
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts" / "rig"))
from vector_ai import caja, hexa, trazo  # noqa: E402

KIT = Path(__file__).resolve().parents[3] / "public" / "marcas" / "bloomie"
AI = KIT / "Bloomie.ai"  # copia del original de C:/Videos/crudos/2026-10-01_claudio_bloomie/
SALIDA = KIT / "personaje.json"
LOGO = KIT / "logo.png"
LOGO_ZONA = (60, 80, 440, 500)  # Bloomie de frente en la hoja (puntos del PDF)
LOGO_ESCALA = 2

# Vista de frente: cuerpo (piernas, cuerpo, pétalos, sombra de la cabeza) y la cara normal que trae dibujada
FRENTE_CUERPO = range(0, 20)
ORIGEN_FRENTE = (248.0, 488.0)
CABEZA_FRENTE = (127.0, 198.0)  # esquina de la cabeza del cuerpo de frente (trazo 20)
# Vista de perfil (mira a la derecha)
PERFIL = range(32, 53)
ORIGEN_PERFIL = (525.0, 488.0)
# Partes del perfil para articularlo (correr): índices dentro de la lista "perfil", en orden de dibujo
PERFIL_PARTES = {
    "pie": [0, 1, 2],
    "cuerpo": [3, 7],
    "hoja": [4, 5],  # hoja de abajo, delante de la panza
    "mano": [6, 8, 9],
    "cabeza": list(range(10, 19)),  # cabeza, ojo, anteojos, boca y ceja
    "petalos": [19, 20],
    "ojo": [13, 14],  # blanco y pupila (se achican al parpadear)
    "lentes": [17, 18],  # lente y marco de los anteojos (para recolorear con un disfraz)
}
# Caras de la hoja: (índices, esquina de su cabeza, ojos [un grupo de índices por ojo], índices de la boca).
# Las de temporada traen su accesorio (sombrero, gorro, cuernos, alas) como parte de la cara.
c = lambda *rs: [i for r in rs for i in (r if isinstance(r, range) else [r])]
CARAS = {
    "normal": (range(65, 77), (116.0, 633.0), [[67, 68], [69, 70]], [72]),
    "feliz": (range(77, 88), (370.0, 617.0), [], [83, 84]),
    "preocupado": (range(88, 100), (638.0, 619.0), [[90, 91], [92, 93]], [94]),
    "guino": (range(114, 125), (101.0, 850.0), [[116, 117]], [119]),
    "enojado": (range(125, 139), (356.0, 850.0), [], [133]),
    "triste": (range(100, 114), (611.0, 850.0), [[102, 103], [104, 105]], [106]),
    "enamorado": (range(155, 166), (361.0, 1148.0), [], [159, 160]),
    "birrete": (range(139, 155), (98.0, 1153.0), [[141, 142], [143, 144]], [146]),
    "navidad": (c(range(166, 178), range(188, 198), 187), (627.0, 1144.0), [[168, 169], [170, 171]], [173]),
    "reno": (c(range(178, 187), range(208, 212)), (693.0, 1400.0), [[180, 181], [182, 183]], [185]),
    "murcielago": (range(198, 208), (398.0, 1400.0), [[200, 201], [202, 203]], [205]),
    "bruja": (c(range(212, 221), range(239, 276)), (64.0, 1417.0), [[273, 274, 275], [269, 270, 271]], [219]),
}
# Párpados: caras cuyos lentes tienen un hueco en la pupila (al cerrar el ojo se tapa con el color del lente).
# (índices de los lentes, en el mismo orden que los ojos)
PARPADOS = {"bruja": [272, 268]}
# Accesorios sueltos, en coordenadas del personaje (donde quedan junto a la cara de la que salen)
ACCESORIOS = {"escoba": (range(221, 239), "bruja"), "sombrero": (range(239, 267), "bruja")}


def main():
    dibs = pymupdf.open(AI)[0].get_drawings()
    ox, oy = ORIGEN_FRENTE
    datos = {
        "fuente": "public/marcas/bloomie/Bloomie.ai",
        "frente": [trazo(dibs[i], -ox, -oy) for i in FRENTE_CUERPO],
        "caras": {},
    }
    for nombre, (indices, cabeza, ojos, boca) in CARAS.items():
        dx = CABEZA_FRENTE[0] - cabeza[0] - ox
        dy = CABEZA_FRENTE[1] - cabeza[1] - oy
        piezas = []
        todos_ojos = [i for g in ojos for i in g]
        for i in indices:
            t = trazo(dibs[i], dx, dy)
            t["rol"] = "ojo" if i in todos_ojos else "boca" if i in boca else "cara"
            piezas.append(t)
        datos["caras"][nombre] = {
            "trazos": piezas,
            # centros de los ojos (para el parpadeo), en coordenadas del personaje
            "ojos": [
                [round((r[0] + r[2]) / 2 + dx, 1), round((r[1] + r[3]) / 2 + dy, 1)]
                for r in (caja([dibs[i] for i in g]) for g in ojos)
            ],
            "boca": [
                round(v + (dx if k % 2 == 0 else dy), 1) for k, v in enumerate(caja([dibs[i] for i in boca]))
            ],
        }
    for nombre, lentes in PARPADOS.items():
        cab = CARAS[nombre][1]
        dx = CABEZA_FRENTE[0] - cab[0] - ox
        dy = CABEZA_FRENTE[1] - cab[1] - oy
        datos["caras"][nombre]["parpados"] = [
            {
                "x": round((dibs[i]["rect"].x0 + dibs[i]["rect"].x1) / 2 + dx, 1),
                "y": round((dibs[i]["rect"].y0 + dibs[i]["rect"].y1) / 2 + dy, 1),
                "r": round((dibs[i]["rect"].x1 - dibs[i]["rect"].x0) / 2 - 2, 1),
                "color": hexa(dibs[i]["fill"]),
            }
            for i in lentes
        ]
    # Boca abierta (de la cara feliz), para hablar: ubicada respecto de la cabeza como en la cara feliz
    _, cab_feliz, _, boca_feliz = CARAS["feliz"]
    dx = CABEZA_FRENTE[0] - cab_feliz[0] - ox
    dy = CABEZA_FRENTE[1] - cab_feliz[1] - oy
    datos["bocaAbierta"] = [trazo(dibs[i], dx, dy) for i in boca_feliz]
    px, py = ORIGEN_PERFIL
    datos["perfil"] = [trazo(dibs[i], -px, -py) for i in PERFIL]
    datos["perfilPartes"] = PERFIL_PARTES
    datos["cajas"] = {
        "frente": [round(v - (ox if k % 2 == 0 else oy), 1) for k, v in enumerate(caja([dibs[i] for i in FRENTE_CUERPO]))],
        "perfil": [round(v - (px if k % 2 == 0 else py), 1) for k, v in enumerate(caja([dibs[i] for i in PERFIL]))],
    }
    datos["accesorios"] = {}
    for nombre, (indices, de_cara) in ACCESORIOS.items():
        cab = CARAS[de_cara][1]
        dx = CABEZA_FRENTE[0] - cab[0] - ox
        dy = CABEZA_FRENTE[1] - cab[1] - oy
        datos["accesorios"][nombre] = {
            "trazos": [trazo(dibs[i], dx, dy) for i in indices],
            "caja": [round(v + (dx if k % 2 == 0 else dy), 1) for k, v in enumerate(caja([dibs[i] for i in indices]))],
        }
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(datos, ensure_ascii=False), encoding="utf8")
    print(f"OK {SALIDA} ({SALIDA.stat().st_size // 1024} KB)")
    print("cajas:", datos["cajas"])
    for n, cara in datos["caras"].items():
        print(n, "ojos", cara["ojos"], "boca", cara["boca"])
    for n, a in datos["accesorios"].items():
        print("accesorio", n, "caja", a["caja"])
    pagina = pymupdf.open(AI)[0]
    pix = pagina.get_pixmap(clip=pymupdf.Rect(*LOGO_ZONA), matrix=pymupdf.Matrix(LOGO_ESCALA, LOGO_ESCALA), alpha=True)
    pix.save(LOGO)
    print(f"OK {LOGO} ({pix.width}x{pix.height})")


if __name__ == "__main__":
    main()
