# Hoja chica con las bocas para hablar (visemas) de un personaje, sobre su cara de frente y ampliadas, para
# revisarlas antes de usarlas en un lip sync. Marca con * las sintéticas (generadas por código).
# Uso: python scripts/rig/hoja_visemas.py <nombre> [salida.png] [--rostro base]
import json
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from extraer_rig import svg_trazos, svg_vista  # noqa: E402

RAIZ = Path(__file__).resolve().parents[2]
ANCHO = 900  # px de la hoja
QUE_BOCA = {"X": "reposo (la de la cara)", "A": "M / B / P", "B": "consonantes", "C": "E / I", "D": "A", "E": "O", "F": "U / W"}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    nombre = args[0]
    salida = Path(args[1]) if len(args) > 1 else RAIZ / "out" / "personajes" / nombre / "hoja_visemas.png"
    rostro_n = sys.argv[sys.argv.index("--rostro") + 1] if "--rostro" in sys.argv else "base"
    datos = json.loads((RAIZ / "public" / "personajes" / nombre / "piezas.json").read_text(encoding="utf8"))
    rostro = datos["rostros"].get(rostro_n) or datos["vistas"]["frente"]["rostro"]
    cab = datos["vistas"]["frente"]["cabeza"]["caja"]
    boca = rostro["boca"]
    # Recorte: la mitad de abajo de la cabeza, centrado en la boca
    w = (cab[2] - cab[0]) * 0.7
    h = w * 0.62
    x0, y0 = boca["c"][0] - w / 2, boca["c"][1] - h * 0.62
    celdas = [("X", svg_vista(datos, "frente", rostro))]
    sin_boca = {k: v for k, v in rostro.items() if k != "boca"}
    for k in sorted(datos["visemas"]):
        vis = datos["visemas"][k]
        g = svg_vista(datos, "frente", sin_boca) + f'<g transform="translate({boca["c"][0]} {boca["c"][1]})">{svg_trazos(vis["trazos"], [700])}</g>'
        celdas.append((k + ("*" if vis.get("sintetica") else ""), g))
    # Cada boca se renderiza como un SVG propio (el viewBox de primer nivel recorta bien en PyMuPDF) y se arman en
    # grilla con Pillow
    cols = 4
    lado = ANCHO // cols
    alto_celda = round(lado * h / w)
    pie = 30
    filas = (len(celdas) + cols - 1) // cols
    hoja = Image.new("RGB", (cols * lado, filas * (alto_celda + pie)), "white")
    dib = ImageDraw.Draw(hoja)
    for i, (k, g) in enumerate(celdas):
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{lado}" height="{alto_celda}" viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}">{g}</svg>'
        pix = pymupdf.open(stream=svg.encode("utf8"), filetype="svg")[0].get_pixmap()
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        cx, cy = (i % cols) * lado, (i // cols) * (alto_celda + pie)
        hoja.paste(im.resize((lado, alto_celda)), (cx, cy))
        dib.rectangle([cx, cy, cx + lado - 1, cy + alto_celda - 1], outline=(200, 200, 200))
        dib.text((cx + 8, cy + alto_celda + 8), f"{k} - {QUE_BOCA.get(k[0], '')}", fill=(0, 0, 0))
    salida.parent.mkdir(parents=True, exist_ok=True)
    hoja.save(salida)
    print(f"OK {salida} ({len(celdas)} bocas; * = sintética)")


if __name__ == "__main__":
    main()
