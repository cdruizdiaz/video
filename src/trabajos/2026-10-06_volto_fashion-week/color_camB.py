# Color de la cám. B (iPhone 17, de frente) igualado a la cám. A (iPhone 16, el color que aprobó el cliente).
# Pedido 2026-10-09 (pieza 1): el plano de frente de B se ve oscuro; las dos cámaras tienen que parecerse.
# Los encuadres no coinciden (B abierto, A cerrado de costado), así que no se compara píxel a píxel: se
# segmenta la persona con MediaPipe (selfie_multiclass: pelo, piel de la cara, piel del cuerpo, ropa) en
# cuadros de los dos clips y se igualan los cuantiles de cada clase, canal por canal. La curva por canal
# (monótona, suavizada) se guarda como LUT 3D (33³) y se aplica al proxy de B en un archivo aparte
# (`<clip>c.mp4`): el proxy original queda igual.
# Uso (raíz del proyecto, Python del .venv):
#   python src/trabajos/2026-10-06_volto_fashion-week/color_camB.py IMG_6982 IMG_4219 [desde_s hasta_s]
# Salida: datos/color_camB_<clip>.cube, crudos/<clip>c.mp4 y revision/color_camB_<clip>.jpg
import json
import subprocess
import sys
from pathlib import Path

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision
from PIL import Image

ID = "2026-10-06_volto_fashion-week"
TAM_LUT = 33
CUADROS = 16  # cuadros de cada cámara repartidos en el tramo
CONFIANZA = 0.7  # píxel de la clase si la máscara supera esto
CLASES = {1: "pelo", 2: "piel cuerpo", 3: "piel cara", 4: "ropa"}
CUANTILES = np.linspace(0.05, 0.95, 19)
INTENSIDAD = 1.0  # 1 = igual a A; menos, parte del camino
SUAVE = 12  # suavizado de la curva (de 256 pasos)
# Pedido 2026-10-09 (2ª tanda): "quedó muy difuso, más contraste y quizás más saturación": al menos esto
CONTRASTE_MIN, CONTRASTE_MAX = 1.12, 1.4
SATURACION_MIN, SATURACION_MAX = 1.05, 1.5  # con 1,12 los brazos quedaban naranjas
NITIDEZ = "unsharp=5:5:0.5"  # el plano de B se recorta a 9:16 y se agranda: un poco de nitidez
H = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
MODELO = Path(H["modeloCaras"]).parent / "selfie_multiclass_256x256.tflite"
CARPETA = Path("public/trabajos") / ID

clip_b, clip_a = sys.argv[1], sys.argv[2]
desde, hasta = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) > 4 else (4.0, 53.0)
desfase = json.loads((CARPETA / "datos/sincronia.json").read_text())[clip_a]["desfaseMs"] / 1000


def cuadro(clip, t):
    r = subprocess.run([H["ffmpeg"], "-v", "error", "-ss", f"{t:.3f}", "-i", str(CARPETA / "crudos" / f"{clip}.mp4"),
                        "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True, check=True)
    import io
    return np.asarray(Image.open(io.BytesIO(r.stdout)).convert("RGB"))


seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=str(MODELO)), output_confidence_masks=True, output_category_mask=False))


def pixeles(clip, tiempos):
    por_clase = {c: [] for c in CLASES}
    ejemplo = None
    for t in tiempos:
        im = cuadro(clip, t)
        ejemplo = ejemplo if ejemplo is not None else im
        r = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(im)))
        for c in CLASES:
            m = np.squeeze(r.confidence_masks[c].numpy_view()) > CONFIANZA
            por_clase[c].append(im[m].astype(np.float32) / 255)
    return {c: np.concatenate(v) for c, v in por_clase.items()}, ejemplo


tiempos = np.linspace(desde, hasta, CUADROS)
pb, ej_b = pixeles(clip_b, tiempos)
pa, ej_a = pixeles(clip_a, tiempos - desfase)

# pares (B, A) de cuantiles por clase y canal. Curva por canal: mapeo de cuantiles monótono anclado en el
# negro y en el blanco (un polinomio se pasaba y quemaba las altas luces). Con el pelo como ancla de las sombras
# las sombras quedan en su lugar (la curva gamma de la 1ª versión las levantaba: se veía lavado, "difuso").
curvas = []
g = np.linspace(0, 1, 256)
for k in range(3):
    xs, ys, ws = [0.0, 1.0], [0.0, 1.0], [20.0, 20.0]
    for c, nombre in CLASES.items():
        if len(pb[c]) < 500 or len(pa[c]) < 500:
            print(f"  sin píxeles suficientes de {nombre}")
            continue
        xs += list(np.quantile(pb[c][:, k], CUANTILES))
        ys += list(np.quantile(pa[c][:, k], CUANTILES))
        ws += [1.0] * len(CUANTILES)
    # mapeo de cuantiles monótono (regresión isotónica, PAV) entre el negro y el blanco, suavizado
    orden = np.argsort(xs)
    xo, yo, wo = np.array(xs)[orden], np.array(ys)[orden], np.array(ws)[orden]
    bloques = []  # [suma y*w, suma w, x medio]
    for xv, yv, wv in zip(xo, yo, wo):
        bloques.append([yv * wv, wv, [xv]])
        while len(bloques) > 1 and bloques[-2][0] / bloques[-2][1] > bloques[-1][0] / bloques[-1][1]:
            b2 = bloques.pop()
            bloques[-1][0] += b2[0]; bloques[-1][1] += b2[1]; bloques[-1][2] += b2[2]
    bx = np.array([np.mean(b[2]) for b in bloques])
    by = np.array([b[0] / b[1] for b in bloques])
    y = np.interp(g, bx, by)
    y = np.convolve(np.pad(y, SUAVE, mode="edge"), np.ones(2 * SUAVE + 1) / (2 * SUAVE + 1), "valid")
    y = np.maximum.accumulate(np.clip(y, 0, 1))
    curvas.append(g + INTENSIDAD * (y - g))
    print("RGB"[k], "B->A:", " ".join(f"{np.interp(v, g, curvas[k]):.2f}" for v in (0.1, 0.3, 0.5, 0.7, 0.9)))

LUMA = np.array([0.2126, 0.7152, 0.0722])
curva = lambda px: np.stack([np.interp(px[..., k], g, curvas[k]) for k in range(3)], -1)
croma = lambda px: (px.max(-1) - px.min(-1)).mean()
# contraste y saturación: después de la curva, se igualan el desvío de la luminancia y el croma de la piel
# y la ropa (dentro de cada clase: lo que da el modelado de la luz, no la mezcla de clases)
ratios_c, ratios_s = [], []
for c in (2, 3, 4):
    bb, aa = curva(pb[c]), pa[c]
    ratios_c.append((aa @ LUMA).std() / (bb @ LUMA).std())
    ratios_s.append(croma(aa) / croma(bb))
CONTRASTE = float(np.clip(np.median(ratios_c), CONTRASTE_MIN, CONTRASTE_MAX))
SATURACION = float(np.clip(np.median(ratios_s), SATURACION_MIN, SATURACION_MAX))
PIVOTE = float((curva(np.concatenate([pb[c] for c in (2, 3, 4)])) @ LUMA).mean())
print(f"contraste {CONTRASTE:.2f} (medido {np.median(ratios_c):.2f}) · saturación {SATURACION:.2f} "
      f"(medida {np.median(ratios_s):.2f}) · pivote {PIVOTE:.2f}")


def corregir(px):  # px en 0..1, (..., 3)
    c = curva(px)
    yl = c @ LUMA
    c = yl[..., None] + SATURACION * (c - yl[..., None])
    return np.clip(PIVOTE + CONTRASTE * (c - PIVOTE), 0, 1)


for c, nombre in CLASES.items():
    print(f"{nombre:12s} B {pb[c].mean(0).round(3)} -> {corregir(pb[c]).mean(0).round(3)}  A {pa[c].mean(0).round(3)}")

gr = np.linspace(0, 1, TAM_LUT)
bq, gq, rq = np.meshgrid(gr, gr, gr, indexing="ij")
lut = corregir(np.stack([rq.ravel(), gq.ravel(), bq.ravel()], -1))
destino = CARPETA / "datos" / f"color_camB_{clip_b}.cube"
with open(destino, "w", encoding="ascii") as f:
    f.write(f'TITLE "color_camB_{clip_b}"\nLUT_3D_SIZE {TAM_LUT}\n')
    for v in lut:
        f.write(f"{v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")

# proxy de B con el color corregido (archivo aparte)
salida = CARPETA / "crudos" / f"{clip_b}c.mp4"
subprocess.run([H["ffmpeg"], "-hide_banner", "-loglevel", "error", "-y", "-i", str(CARPETA / "crudos" / f"{clip_b}.mp4"),
                "-vf", f"lut3d=file={destino.as_posix()},{NITIDEZ}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-g", "30",
                "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", str(salida)], check=True)

# control: B antes | B después | A
aplicar = lambda im: corregir(im.astype(np.float32) / 255)
alto = 540
a_png = lambda im: Image.fromarray(im).resize((round(im.shape[1] * alto / im.shape[0]), alto))
partes = [a_png(ej_b), a_png((aplicar(ej_b) * 255).astype(np.uint8)), a_png(ej_a)]
hoja = Image.new("RGB", (sum(p.width for p in partes), alto))
x = 0
for p in partes:
    hoja.paste(p, (x, 0))
    x += p.width
control = Path("out") / ID / "revision" / f"color_camB_{clip_b}.jpg"
hoja.save(control, quality=90)
print("->", destino, "|", salida, "|", control)
