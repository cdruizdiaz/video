"""Mapa de profundidad de una imagen o un video (Depth Anything V2 Small, ONNX en CPU, Apache-2.0).

Para qué:
  - Oclusión en video real: lo que está MÁS CERCA que el lugar donde está parado el personaje lo tapa
    (--recorte + --punto): sale un webm con transparencia que va encima del personaje (DetrasDePersona).
  - Fotos con movimiento 2,5D (paralaje): mapa de una foto → src/plantillas/comunes/FotoProfundidad.tsx.

Uso (Python del .venv):
  python scripts/profundidad.py <imagen> <salida.png>
  python scripts/profundidad.py <video> <salida_profundidad.mp4> [--cada 3] [--desde s --hasta s]
         [--recorte salida_cerca.webm (--punto x,y [--margen 0.01] | --umbral 0.6)] [--borde 2] [--tam 518]

  Salida: escala de grises, BLANCO = CERCA (normalizada con los percentiles 2–98 de todo el tramo: no parpadea).
  --cada N     calcula 1 de cada N cuadros e interpola (tomas fijas o lentas: 3 alcanza; la i3 tarda ~0,6 s/cuadro)
  --punto x,y  px del video donde apoya el personaje: todo lo más cercano que ese punto (+ margen) va al recorte
  --umbral u   en lugar de --punto: profundidad normalizada (0 lejos … 1 cerca) a partir de la cual va al recorte
"""
import json
import subprocess
import sys
import time
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

RAIZ = Path(__file__).resolve().parents[1]
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
MEDIA = np.array([0.485, 0.456, 0.406], dtype=np.float32)
DESVIO = np.array([0.229, 0.224, 0.225], dtype=np.float32)
PERCENTILES = (2, 98)
TRANSICION = 0.02  # ancho (en profundidad normalizada) del paso de "detrás" a "delante": el piso cambia poco entre filas


def opcion(args, n, d=None, tipo=float):
    return tipo(args[args.index(n) + 1]) if n in args else d


class Profundidad:
    def __init__(self, tam):
        self.tam = tam
        opciones = ort.SessionOptions()
        self.s = ort.InferenceSession(HERR["modeloProfundidad"], opciones, providers=["CPUExecutionProvider"])
        self.entrada = self.s.get_inputs()[0].name

    def __call__(self, bgr):
        h, w = bgr.shape[:2]
        # lado corto = tam, los dos múltiplos de 14 (lo que espera el modelo)
        e = self.tam / min(h, w)
        nh, nw = max(14, int(round(h * e / 14)) * 14), max(14, int(round(w * e / 14)) * 14)
        x = cv2.resize(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), (nw, nh), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
        x = ((x - MEDIA) / DESVIO).transpose(2, 0, 1)[None]
        return self.s.run(None, {self.entrada: x})[0][0]  # profundidad inversa relativa: más = más cerca


def normalizar(d, lo, hi):
    return np.clip((d - lo) / max(1e-6, hi - lo), 0, 1)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    con_valor = ("--cada", "--desde", "--hasta", "--recorte", "--punto", "--margen", "--umbral", "--borde", "--tam")
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and not (i > 0 and args[i - 1] in con_valor)]
    if len(pos) < 2:
        print(__doc__)
        sys.exit(1)
    entrada, salida = pos[0], pos[1]
    tam = int(opcion(args, "--tam", 518))
    modelo = Profundidad(tam)
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    t0 = time.time()

    # ---------- Imagen ----------
    if Path(entrada).suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".bmp"):
        img = cv2.imdecode(np.fromfile(entrada, dtype=np.uint8), cv2.IMREAD_COLOR)
        d = modelo(img)
        lo, hi = np.percentile(d, PERCENTILES)
        g = cv2.resize(normalizar(d, lo, hi), (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)
        cv2.imencode(".png", (np.clip(g, 0, 1) * 255).astype(np.uint8))[1].tofile(salida)
        print(f"OK {salida} · {img.shape[1]}×{img.shape[0]} · {time.time() - t0:.1f} s")
        return

    # ---------- Video ----------
    cada = int(opcion(args, "--cada", 3))
    desde, hasta = opcion(args, "--desde", 0.0), opcion(args, "--hasta", None)
    recorte = opcion(args, "--recorte", None, str)
    punto = opcion(args, "--punto", None, str)
    margen = opcion(args, "--margen", 0.01)
    umbral = opcion(args, "--umbral", None)
    borde = opcion(args, "--borde", 2.0)
    cap = cv2.VideoCapture(entrada)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    ini = int(round(desde * fps))
    fin = int(round(hasta * fps)) if hasta else int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.set(cv2.CAP_PROP_POS_FRAMES, ini)
    cuadros, claves = [], {}
    for k in range(fin - ini):
        ok, c = cap.read()
        if not ok:
            break
        if recorte:
            cuadros.append(c)  # hacen falta los colores para el recorte
        if k % cada == 0:
            claves[k] = modelo(c)
    cap.release()
    n = (max(claves) + 1) if not cuadros else len(cuadros)
    n = max(n, max(claves) + 1)
    if (n - 1) not in claves and n - 1 > 0:
        # el último cuadro siempre calculado (para interpolar hasta el final)
        cap = cv2.VideoCapture(entrada)
        cap.set(cv2.CAP_PROP_POS_FRAMES, ini + n - 1)
        ok, c = cap.read()
        cap.release()
        if ok:
            claves[n - 1] = modelo(c)
    todas = np.concatenate([v.ravel()[::7] for v in claves.values()])
    lo, hi = np.percentile(todas, PERCENTILES)
    ks = sorted(claves)

    def prof(k):
        """Profundidad normalizada del cuadro k (interpolada entre los calculados), al tamaño del video."""
        if k in claves:
            d = normalizar(claves[k], lo, hi)
        else:
            a = max(x for x in ks if x <= k)
            b = min(x for x in ks if x >= k)
            t = (k - a) / (b - a)
            d = normalizar(claves[a] * (1 - t) + claves[b] * t, lo, hi)
        return cv2.resize(d.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)

    enc = subprocess.Popen([HERR["ffmpeg"], "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", f"{fps}", "-i", "-",
                            "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", salida], stdin=subprocess.PIPE)
    enc_r = None
    if recorte:
        Path(recorte).parent.mkdir(parents=True, exist_ok=True)
        enc_r = subprocess.Popen([HERR["ffmpeg"], "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", f"{fps}", "-i", "-",
                                  "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-row-mt", "1", "-deadline", "realtime",
                                  "-cpu-used", "8", "-auto-alt-ref", "0", recorte], stdin=subprocess.PIPE)
    px = [int(v) for v in punto.split(",")] if punto else None
    usados = []
    for k in range(n):
        g = prof(k)
        enc.stdin.write((g * 255).astype(np.uint8).tobytes())
        if enc_r and k < len(cuadros):
            if px:
                x, y = min(W - 1, max(0, px[0])), min(H - 1, max(0, px[1]))
                ventana = g[max(0, y - 6):y + 7, max(0, x - 6):x + 7]
                u = float(np.median(ventana)) + margen
            else:
                u = umbral if umbral is not None else 0.6
            usados.append(u)
            m = np.clip((g - u) / TRANSICION, 0, 1)
            if borde > 0:
                m = cv2.GaussianBlur(m, (0, 0), borde)
            enc_r.stdin.write(np.dstack([cuadros[k], (m * 255).astype(np.uint8)]).tobytes())
    enc.stdin.close()
    enc.wait()
    if enc_r:
        enc_r.stdin.close()
        enc_r.wait()
    seg = time.time() - t0
    extra = f" · recorte {recorte} (umbral {np.mean(usados):.2f})" if recorte else ""
    print(f"OK {salida} · {n} cuadros ({len(claves)} calculados, cada {cada}) · {seg:.0f} s ({seg / max(1, len(claves)):.2f} s/cuadro){extra}")


if __name__ == "__main__":
    main()
