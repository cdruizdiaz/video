# Descompone la placa de inicio de la usuaria (MSJwppFondonaranja.ai: PDF compatible, 1125x2099) en capas para animarla:
#   placa.png        = todo menos los globos, sus textos y "Delivered" (fondo degradado + barra de estado + cabecera + teclado)
#   globo<i>.png     = cada globo SIN texto, con transparencia (alfa recuperado por diferencia de render contra el fondo)
#   texto<i>.png     = el contenido del globo (texto/emoji sobre el color del globo, opaco: se revela con una máscara sobre el globo)
#   delivered.png    = "Delivered" con transparencia
#   placa.json       = posición (en unidades de página) de cada pieza
# Uso: python extraer_placa.py [naranja|blanco]
import json, sys
import pymupdf as fitz  # PyMuPDF
import numpy as np
from PIL import Image
DISENO = sys.argv[1] if len(sys.argv) > 1 else "naranja"  # "naranja" (MSJwppFondonaranja.ai) | "blanco" (MSJwppFondoblanco.ai: 710x1350, sin barra de estado)
SC = 1.5  # resolución de los renders respecto de la página
GRIS, NARANJA_G, AZUL_G = (0.898, 0.898, 0.918), (0.937, 0.424, 0.0), (0.231, 0.282, 0.314)
if DISENO == "naranja":
    AI = "C:/Users/LUCIA/Downloads/MSJwppFondonaranja.ai"
    OUT = "public/trabajos/2026-10-28_docba_r3-nov/img/placa"
    # globos: (rect del globo, color del globo, rect(s) del contenido, rect del emoji o None)
    GLOBOS = [
        ((129, 475, 750, 639), GRIS, [(170, 497, 676, 620)], None),
        ((447, 669, 996, 768), AZUL_G, [(478, 686, 905, 752)], None),
        ((129, 817, 668, 917), GRIS, [(178, 836, 598, 902)], None),
        ((505, 947, 996, 1046), (0.188, 0.235, 0.263), [(534, 964, 942, 1030)], (886, 968, 940, 1024)),
    ]
    DELIVERED, DELIV_COLOR = (838, 1052, 978, 1104), (255, 255, 255)
else:
    AI = "C:/Users/LUCIA/Downloads/MSJwppFondoblanco.ai"
    OUT = "public/trabajos/2026-10-28_docba_r3-nov/img/placa_blanco"
    GLOBOS = [
        ((38.1, 309.8, 485.9, 427.5), GRIS, [(62, 322, 440, 418)], None),
        ((268, 449.3, 663.5, 521.2), NARANJA_G, [(284, 458, 606, 512)], None),
        ((38.1, 556, 427, 627.9), GRIS, [(68, 566, 386, 620)], None),
        ((309.4, 649.7, 663.5, 721.6), NARANJA_G, [(324, 658, 616, 714)], (570, 666, 607, 704)),
    ]
    DELIVERED, DELIV_COLOR = (548, 726, 652, 764), (142, 142, 147)
import os; os.makedirs(OUT, exist_ok=True)
PAD = 6
FLAGS = fitz.Pixmap  # (solo para que el import no se quite)

def abrir():
    return fitz.open(AI)[0] if False else fitz.open(AI)

def render(doc, clip=None):
    p = doc[0]
    pix = p.get_pixmap(matrix=fitz.Matrix(SC, SC), clip=fitz.Rect(*clip) if clip else None, alpha=False)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3).astype(np.float32)

def redactar(doc, rects, graficos, texto):
    p = doc[0]
    for r in rects: p.add_redact_annot(fitz.Rect(*r), fill=False)
    p.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=graficos, text=texto)

# documentos: completo, sin globos (todo), y con globos pero sin texto/emoji/Delivered
d_full = fitz.open(AI)
d_no = fitz.open(AI)
redactar(d_no, [g[0] for g in GLOBOS] + [DELIVERED], fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED, fitz.PDF_REDACT_TEXT_REMOVE)
d_nt = fitz.open(AI)
redactar(d_nt, [c for g in GLOBOS for c in g[2]] + [DELIVERED], fitz.PDF_REDACT_LINE_ART_NONE, fitz.PDF_REDACT_TEXT_REMOVE)
redactar(d_nt, [g[3] for g in GLOBOS if g[3]], fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED, fitz.PDF_REDACT_TEXT_NONE)

page = d_full[0].rect
Image.fromarray(render(d_no).astype(np.uint8)).save(f"{OUT}/placa.png")
piezas = {"pagina": [page.width, page.height], "globos": []}

def alfa(a, b, c):
    """alfa por mínimos cuadrados: a = alfa*c + (1-alfa)*b"""
    num = ((a - b) * (c - b)).sum(-1); den = ((c - b) ** 2).sum(-1) + 1e-6
    return np.clip(num / den, 0, 1)

for i, (rect, color, contenidos, emoji) in enumerate(GLOBOS, 1):
    clip = (rect[0] - PAD, rect[1] - PAD, rect[2] + PAD, rect[3] + PAD)
    a, b = render(d_nt, clip), render(d_no, clip)
    c = np.array(color, np.float32) * 255
    al = alfa(a, b, c)
    rgba = np.dstack([np.broadcast_to(c, a.shape), al * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(f"{OUT}/globo{i}.png")
    cc = contenidos[0]
    Image.fromarray(render(d_full, cc).astype(np.uint8)).save(f"{OUT}/texto{i}.png")
    piezas["globos"].append({"i": i, "globo": list(clip), "texto": list(cc)})
a, b = render(d_full, DELIVERED), render(d_no, DELIVERED)
al = alfa(a, b, np.array(DELIV_COLOR, np.float32))
Image.fromarray(np.dstack([np.broadcast_to(np.array(DELIV_COLOR, np.uint8), a.shape), (al * 255).astype(np.uint8)]), "RGBA").save(f"{OUT}/delivered.png")
piezas["delivered"] = list(DELIVERED)
json.dump(piezas, open(f"{OUT}/placa.json", "w"), indent=1)
print("ok", piezas)
