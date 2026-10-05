# Kit de marca Bloomie — carrera en sprites: corta la hoja de 6×4 cuadros (fondo negro opaco) en 24 PNG con
# transparencia. El fondo se quita por relleno desde el borde de cada cuadro (las pupilas negras quedan) y el
# borde antialiasado se des-multiplica del negro para que no quede un halo oscuro.
# Uso: python src/marcas/bloomie/cortar_sprites_carrera.py [hoja.png]
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parents[3]
HOJA = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
    "C:/Videos/crudos/2026-10-02_lucia_bloomie-corriendo/bloomie_carrera_sprites.png")
SALIDA = RAIZ / "public" / "marcas" / "bloomie" / "sprites-carrera"
REVISION = RAIZ / "out" / "2026-10-02_lucia_bloomie-corriendo" / "revision" / "sprites_carrera.png"

COLUMNAS, FILAS = 6, 4
UMBRAL_FONDO = 40  # canal más alto por debajo de esto = negro de fondo (si toca el borde)
BRILLO_PLENO = 150  # en el borde, canal más alto con el que el píxel ya es opaco


def recortar(celda: Image.Image) -> Image.Image:
    rgb = celda.convert("RGB")
    w, h = rgb.size
    # Máscara de fondo: oscuro y conectado al borde del cuadro
    px = rgb.load()
    fondo = Image.new("L", (w, h), 0)
    marca = fondo.load()
    pila = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    while pila:
        x, y = pila.pop()
        if marca[x, y] or max(px[x, y]) >= UMBRAL_FONDO:
            continue
        marca[x, y] = 255
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not marca[nx, ny]:
                pila.append((nx, ny))
    # Franja de borde: 2 px alrededor del fondo, alfa según el brillo (des-multiplicado del negro)
    borde = fondo.filter(ImageFilter.MaxFilter(5))
    bpx = borde.load()
    out = Image.new("RGBA", (w, h))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            if marca[x, y]:
                opx[x, y] = (0, 0, 0, 0)
            elif bpx[x, y]:
                a = min(1.0, max(c) / BRILLO_PLENO)
                if a <= 0:
                    opx[x, y] = (0, 0, 0, 0)
                else:
                    opx[x, y] = tuple(min(255, round(v / a)) for v in c) + (round(a * 255),)
            else:
                opx[x, y] = c + (255,)
    return out


def main() -> None:
    hoja = Image.open(HOJA).convert("RGB")
    cw, ch = hoja.width // COLUMNAS, hoja.height // FILAS
    SALIDA.mkdir(parents=True, exist_ok=True)
    cuadros = []
    for i in range(COLUMNAS * FILAS):
        f, c = divmod(i, COLUMNAS)
        cuadros.append(recortar(hoja.crop((c * cw, f * ch, (c + 1) * cw, (f + 1) * ch))))
    # Recorte común (misma caja para todos, así el registro entre cuadros no cambia)
    cajas = [q.getchannel("A").getbbox() for q in cuadros]
    caja = (min(b[0] for b in cajas) - 2, min(b[1] for b in cajas) - 2,
            max(b[2] for b in cajas) + 2, max(b[3] for b in cajas) + 2)
    caja = (max(0, caja[0]), max(0, caja[1]), min(cw, caja[2]), min(ch, caja[3]))
    for i, q in enumerate(cuadros):
        q.crop(caja).save(SALIDA / f"f{i + 1:02d}.png")
    # Pies de cada cuadro (fila más baja con alfa) para revisar el rebote
    pies = [b[3] - caja[1] for b in cajas]
    print(f"{len(cuadros)} cuadros {caja[2] - caja[0]}x{caja[3] - caja[1]} -> {SALIDA}")
    print("pies (y):", pies)
    # Hoja de revisión sobre gris
    qw, qh = caja[2] - caja[0], caja[3] - caja[1]
    rev = Image.new("RGB", (qw * COLUMNAS, qh * FILAS), (90, 105, 120))
    d = ImageDraw.Draw(rev)
    for i in range(len(cuadros)):
        f, c = divmod(i, COLUMNAS)
        rev.paste(Image.open(SALIDA / f"f{i + 1:02d}.png"), (c * qw, f * qh), Image.open(SALIDA / f"f{i + 1:02d}.png"))
        d.text((c * qw + 4, f * qh + 2), str(i + 1), fill=(255, 255, 255))
    REVISION.parent.mkdir(parents=True, exist_ok=True)
    rev.save(REVISION)


if __name__ == "__main__":
    main()
