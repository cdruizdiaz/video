# Bloomie de los videos animados del cliente (fondo blanco) con transparencia, para ponerlo sobre Pau (borrador E,
# pedido 2026-10-21: "utilizá este video pero sacale el fondo blanco, porque el Bloomie que vos hiciste tiene el brazo
# cortado"):
#   palma   bloomie_hola_v2.mp4 (1080×1080, 60 fps): saluda desde el primer cuadro
#   hombro  bloomie_entrada_hola_v3.mp4 (1920×1080, 60 fps): desde 1,6 s (ya entró desde la izquierda y se acomodó)
#           hasta el final, y después en reversa 5,0 → 3,45 s para cubrir los 4,95 s del plano sin congelar
# El fondo es lo claro y sin color conectado al borde, más los huecos blancos encerrados (entre el brazo y el cuerpo)
# que no tocan negro: los blancos de los ojos, con la pupila o el párpado al lado, quedan. La sombra gris de
# los pies pasa a negro semitransparente; el borde del personaje se "desmezcla" del blanco (sin halo claro).
# Salida: crudos/bloomie_<x>.webm (VP9 con alfa, 30 fps, recortado al personaje) + datos/bloomie_<x>_video.json
#   { ancho, alto, cuadros, pies: [x, y] (centro de los pies, px del webm), alto_personaje (px, sin la sombra) }
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-21_rastro_pau-mascota/recortar_bloomie.py
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ID = "2026-10-21_rastro_pau-mascota"
ORIGEN = Path("C:/Videos/crudos") / ID / "otros"
CRUDOS = Path("public/trabajos") / ID / "crudos"
DATOS = Path("public/trabajos") / ID / "datos"
HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
FF = HERR["ffmpeg"]

# ---------- Constantes ----------
FPS = 30
VIDEOS = {
    "palma": {"src": "bloomie_hola_v2.mp4", "tramos": [(0.0, 2.4)]},
    "hombro": {"src": "bloomie_entrada_hola_v3.mp4", "tramos": [(1.6, 5.0), (4.99, 3.45)]},  # (desde, hasta): al revés = reversa
}
SAT_FONDO = 40  # saturación máx. (0–255) del fondo y la sombra
VAL_FONDO = 140  # brillo mín. del fondo y la sombra
BLANCO = 246  # desde acá, transparente del todo
SOMBRA_ALFA = 0.6  # alfa de la sombra más oscura
BANDA = 3  # px del borde del personaje que se desmezclan del blanco
MARGEN = 12  # px alrededor del recorte
OSCURO = 70  # brillo máx. de pupilas y párpados (lo que distingue un ojo de un hueco blanco)


def leer(src, desde, hasta):
    a, b = sorted((desde, hasta))
    crudo = subprocess.run([FF, "-v", "error", "-ss", str(a), "-to", str(b), "-i", str(src), "-vf", f"fps={FPS}",
                            "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True, check=True).stdout
    w, h = [int(v) for v in subprocess.run([HERR["ffprobe"], "-v", "error", "-select_streams", "v:0", "-show_entries",
                                            "stream=width,height", "-of", "csv=p=0", str(src)],
                                           capture_output=True, text=True, check=True).stdout.strip().split(",")]
    c = list(np.frombuffer(crudo, np.uint8).reshape(-1, h, w, 3))
    return c[::-1] if desde > hasta else c


def recortar(bgr):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    claro = ((hsv[..., 1] <= SAT_FONDO) & (hsv[..., 2] >= VAL_FONDO)).astype(np.uint8)
    n, etiquetas = cv2.connectedComponents(claro, connectivity=4)
    borde = np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))
    fondo = np.isin(etiquetas, borde[borde > 0])
    oscuro = cv2.dilate((hsv[..., 2] < OSCURO).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    for k in set(range(1, n)) - set(borde.tolist()):
        hueco = etiquetas == k
        if not (hueco & oscuro).any():
            fondo |= hueco
    v = hsv[..., 2].astype(np.float32)
    alfa = np.where(fondo, np.clip((BLANCO - v) / (BLANCO - VAL_FONDO), 0, 1) * SOMBRA_ALFA, 1.0)
    color = np.where(fondo[..., None], 0, bgr.astype(np.float32))
    # borde del personaje: desmezclar del blanco (alfa por el canal más oscuro respecto del interior)
    pj = (~fondo).astype(np.uint8)
    banda = (pj > 0) & (cv2.erode(pj, np.ones((2 * BANDA + 1,) * 2, np.uint8)) == 0)
    interior_min = 40.0  # canal más bajo del naranja (B)
    m = bgr.min(axis=2).astype(np.float32)
    a_borde = np.clip((255 - m) / (255 - interior_min), 0, 1)
    a_borde = np.maximum(a_borde, 0.02)
    sin_blanco = np.clip((bgr.astype(np.float32) - 255 * (1 - a_borde[..., None])) / a_borde[..., None], 0, 255)
    alfa = np.where(banda, np.minimum(a_borde, 1), alfa)
    color = np.where(banda[..., None], sin_blanco, color)
    return np.dstack([color, alfa * 255]).astype(np.uint8), ~fondo


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    for nombre, v in VIDEOS.items():
        cuadros = [c for d, h in v["tramos"] for c in leer(ORIGEN / v["src"], d, h)]
        rgba, pjs = zip(*(recortar(c) for c in cuadros))
        # caja común (personaje + sombra) de todo el tramo
        ocupado = np.any([r[..., 3] > 8 for r in rgba], axis=0)
        ys, xs = np.nonzero(ocupado)
        x0, x1 = max(0, xs.min() - MARGEN), min(ocupado.shape[1], xs.max() + MARGEN)
        y0, y1 = max(0, ys.min() - MARGEN), min(ocupado.shape[0], ys.max() + MARGEN)
        x1 -= (x1 - x0) % 2
        y1 -= (y1 - y0) % 2
        # pies: fila más baja del personaje (sin la sombra), en un cuadro del medio (quieto)
        pyy, pxx = np.nonzero(pjs[len(pjs) // 2])
        abajo = pyy.max()
        pies = [float(np.mean(pxx[pyy >= abajo - 6]) - x0), float(abajo - y0)]
        alto_pj = float(abajo - pyy.min())
        salida = CRUDOS / f"bloomie_{nombre}.webm"
        enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{x1 - x0}x{y1 - y0}",
                                "-r", str(FPS), "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0",
                                "-crf", "20", "-auto-alt-ref", "0", "-row-mt", "1", str(salida)], stdin=subprocess.PIPE)
        for r in rgba:
            enc.stdin.write(np.ascontiguousarray(r[y0:y1, x0:x1]).tobytes())
        enc.stdin.close()
        enc.wait()
        info = {"ancho": int(x1 - x0), "alto": int(y1 - y0), "cuadros": len(rgba), "pies": [round(pies[0], 1), round(pies[1], 1)],
                "alto_personaje": alto_pj}
        (DATOS / f"bloomie_{nombre}_video.json").write_text(json.dumps(info), encoding="utf-8")
        # control: tres cuadros sobre gris medio
        muestra = []
        for k in (0, len(rgba) // 2, len(rgba) - 1):
            r = rgba[k][y0:y1, x0:x1].astype(np.float32)
            a = r[..., 3:] / 255
            muestra.append((r[..., :3] * a + 128 * (1 - a)).astype(np.uint8))
        cv2.imwrite(str(Path("out") / ID / "revision" / f"recorte_{nombre}.png"), np.hstack(muestra))
        print(f"OK {salida} · {info}")


if __name__ == "__main__":
    main()
