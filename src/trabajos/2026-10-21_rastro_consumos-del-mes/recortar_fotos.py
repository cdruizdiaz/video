# Fotos de Evan Peters y Yolanda Reyes recortadas: solo la persona, sin fondo (pedido 2026-10-23: "sacale ese círculo
# rojo, poné solo su imagen"; "a la imagen de Yolanda hacé lo mismo"). MediaPipe selfie_multiclass, como
# scripts/mascaras.py pero sobre una foto: confianza de "no fondo", borde suavizado, recortada a la persona.
# Yolanda sale de la foto original del cliente (más resolución que la cara recortada de 500 px).
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-21_rastro_consumos-del-mes/recortar_fotos.py
import json
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision

RAIZ = Path(__file__).resolve().parents[3]
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
MODELO = Path(HERR["modeloCaras"]).parent / "selfie_multiclass_256x256.tflite"
ID = "2026-10-21_rastro_consumos-del-mes"
IMG = RAIZ / f"public/trabajos/{ID}/img"
CRUDOS = Path(HERR["carpetaCrudos"]) / ID
FOTOS = [  # (origen, salida)
    (IMG / "evan_peters.jpg", IMG / "evan_recorte.png"),
    (CRUDOS / "yolanda_cliente.jpg", IMG / "yolanda_recorte.png"),
]
UMBRAL = 0.5  # confianza mínima de persona
BORDE = 1.5  # px de desenfoque del borde de la máscara (en la escala de la foto, por cada 1000 px)
MARGEN = 0.03  # aire alrededor del recorte (fracción del lado mayor)


def recortar(origen: Path, salida: Path, seg) -> None:
    bgr = cv2.imdecode(np.fromfile(str(origen), dtype=np.uint8), cv2.IMREAD_COLOR)  # rutas con tildes
    alto, ancho = bgr.shape[:2]
    imagen = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    # categorías de selfie_multiclass: 0 fondo, 1 pelo, 2 piel del cuerpo, 3 piel de la cara, 4 ropa, 5 otros
    # (accesorios y objetos: la botella de agua de la foto de Evan): solo 1–4
    m = seg.segment(imagen).confidence_masks
    persona = sum(m[k].numpy_view() for k in range(1, 5))
    persona = cv2.resize(persona, (ancho, alto), interpolation=cv2.INTER_LINEAR)
    persona = np.clip((persona - UMBRAL) / (1 - UMBRAL) * 2.5, 0, 1)
    # solo la figura más grande (sin restos sueltos)
    n, etiquetas, datos, _ = cv2.connectedComponentsWithStats((persona > 0.5).astype(np.uint8))
    if n > 2:
        mayor = 1 + int(np.argmax(datos[1:, cv2.CC_STAT_AREA]))
        figura = cv2.dilate((etiquetas == mayor).astype(np.uint8), np.ones((9, 9), np.uint8))
        persona = persona * figura
    sigma = max(0.8, BORDE * max(alto, ancho) / 1000)
    persona = cv2.GaussianBlur(persona, (0, 0), sigma)
    alfa = (persona * 255).astype(np.uint8)
    ys, xs = np.where(alfa > 20)
    aire = int(MARGEN * max(alto, ancho))
    x0, x1 = max(0, xs.min() - aire), min(ancho, xs.max() + aire)
    y0, y1 = max(0, ys.min() - aire), min(alto, ys.max() + 1)  # abajo, hasta el borde de la persona (sin aire)
    rgba = np.dstack([bgr, alfa])[y0:y1, x0:x1]
    ok, buf = cv2.imencode(".png", rgba)
    buf.tofile(str(salida))
    print(f"{salida.name}: {x1 - x0}×{y1 - y0} (de {ancho}×{alto})")


def main() -> None:
    seg = vision.ImageSegmenter.create_from_options(
        vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=str(MODELO)),
            running_mode=vision.RunningMode.IMAGE,
            output_confidence_masks=True,
            output_category_mask=False,
        )
    )
    for origen, salida in FOTOS:
        recortar(origen, salida, seg)


main()
