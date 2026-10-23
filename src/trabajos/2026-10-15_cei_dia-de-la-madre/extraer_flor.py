# Extrae la flor del logo del CEI (la de pétalos naranja del logo principal, p. 10 del manual) como vectores:
# cada pétalo y el centro son contornos que salen de la imagen del PDF (render a 8×), no un dibujo nuevo.
# Salida: src/trabajos/<ID>/flor.json -> { "ancho": w, "alto": h, "petalos": ["M... Z", ...], "silueta": "M... Z" }
#   silueta = contorno exterior de la flor (el borde vino que la rodea en el logo), por si se quiere dibujar debajo.
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-15_cei_dia-de-la-madre/extraer_flor.py
import json
import sys
from pathlib import Path

import cv2
import fitz
import numpy as np

ID = "2026-10-15_cei_dia-de-la-madre"
PDF = r"C:/Users/LUCIA/Documents/RASTRO/Clientes/CEI/CEI - Manual de Marca_beta_compressed (1).pdf"
ESC = 8
# zona de la flor en la página 10 (1920×1080 pt): debajo de la torre, a la izquierda del logo principal
REGION = (150, 550, 410, 790)

doc = fitz.open(PDF)
pix = doc[9].get_pixmap(matrix=fitz.Matrix(ESC, ESC), clip=fitz.Rect(*REGION))
img = cv2.imdecode(np.frombuffer(pix.tobytes("png"), np.uint8), cv2.IMREAD_COLOR)
cv2.imwrite(str(Path("tmp") / "flor_region.png"), img)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
# naranja del logo: matiz ~10-20 (OpenCV 0-180), saturación alta
mask = cv2.inRange(hsv, (6, 120, 150), (24, 255, 255))
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
cs = [c for c in cs if cv2.contourArea(c) > 4000]
print("contornos naranja:", len(cs), [int(cv2.contourArea(c)) for c in cs])
if not cs:
    sys.exit("no encontré la flor: ajustar REGION")
todos = np.vstack(cs)
x, y, w, h = cv2.boundingRect(todos)
print("caja de la flor (px):", x, y, w, h)


def a_path(c, eps=1.2):
    c = cv2.approxPolyDP(c, eps, True)
    pts = [(float(p[0][0] - x), float(p[0][1] - y)) for p in c]
    return "M" + " L".join(f"{px:.1f} {py:.1f}" for px, py in pts) + " Z"


# silueta: unión de los pétalos dilatada (el borde vino del logo)
union = np.zeros(mask.shape, np.uint8)
for c in cs:
    cv2.drawContours(union, [c], -1, 255, -1)
union = cv2.dilate(union, np.ones((41, 41), np.uint8))
sil, _ = cv2.findContours(union, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
sil = max(sil, key=cv2.contourArea)
salida = {
    "ancho": w,
    "alto": h,
    "petalos": [a_path(c) for c in sorted(cs, key=lambda c: -cv2.contourArea(c))],
    "silueta": a_path(sil, 2.0),
    "colorPetalo": "#%02x%02x%02x" % tuple(int(v) for v in img[mask > 0].mean(axis=0)[::-1]),
    "colorBorde": "#%02x%02x%02x" % tuple(int(v) for v in img[(union > 0) & (mask == 0)].mean(axis=0)[::-1]),
}
Path(f"src/trabajos/{ID}/flor.json").write_text(json.dumps(salida), encoding="utf-8")
# vista previa
vis = np.full((h + 160, w + 160, 3), 255, np.uint8)
cv2.drawContours(vis, [sil - np.array([x - 80, y - 80])], -1, (20, 20, 109), -1)
for c in cs:
    cv2.drawContours(vis, [c - np.array([x - 80, y - 80])], -1, (38, 123, 220), -1)
cv2.imwrite(str(Path("tmp") / "flor_vista.png"), vis)
print("ok")
