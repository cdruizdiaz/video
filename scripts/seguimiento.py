"""Seguimiento de un punto (o de un plano, como el piso) en un video con cámara en mano (OpenCV, sin IA).

Para "anclar" un personaje o un gráfico a la escena real cuando la cámara se mueve: el personaje queda pegado al
piso (o a una mesa, una pared) en vez de flotar quieto sobre el cuadro.

Uso (Python del .venv):
  python scripts/seguimiento.py <video> <salida.json> --punto x,y [--caja 240] [--desde s --hasta s] [--control png]

  --punto x,y  px del video (del primer cuadro) donde se ancla: p. ej. donde apoyan los pies del personaje
  (sin --caja) movimiento de la CÁMARA: rasgos de todo el cuadro y RANSAC (las personas que se mueven quedan
               afuera como valores atípicos). Es lo que hace falta para anclar algo al piso o a la escena.
  --caja 240   en cambio, seguir un OBJETO que se mueve distinto que la cámara: rasgos solo en esa zona alrededor
               del punto (px de lado).
Salida JSON: { fps, ancho, alto, punto, cuadros, puntos: [[x,y],…], escala: […], rot: […] }
  (puntos en px del video; escala y rot relativas al primer cuadro: acercamientos y giros de la cámara)
En PersonajeRig: prop `seguimiento: { puntos, escala, rot, factor }` (factor = px de la composición por px del video).
"""
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np

MAX_RASGOS = 200
MIN_RASGOS = 40  # por debajo se vuelven a buscar rasgos
ANCHO_ANALISIS = 960


def opcion(args, n, d=None, tipo=float):
    return tipo(args[args.index(n) + 1]) if n in args else d


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    con_valor = ("--punto", "--caja", "--desde", "--hasta", "--control")
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and not (i > 0 and args[i - 1] in con_valor)]
    if len(pos) < 2 or "--punto" not in args:
        print(__doc__)
        sys.exit(1)
    video, salida = pos[0], pos[1]
    px, py = [float(v) for v in opcion(args, "--punto", None, str).split(",")]
    caja = opcion(args, "--caja", None)
    desde, hasta = opcion(args, "--desde", 0.0), opcion(args, "--hasta", None)
    control = opcion(args, "--control", None, str)

    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    e = ANCHO_ANALISIS / W if W > ANCHO_ANALISIS else 1.0
    ini = int(round(desde * fps))
    fin = int(round(hasta * fps)) if hasta else int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.set(cv2.CAP_PROP_POS_FRAMES, ini)

    def gris(c):
        return cv2.cvtColor(cv2.resize(c, (int(W * e), int(H * e))) if e != 1 else c, cv2.COLOR_BGR2GRAY)

    def rasgos(g, cx, cy):
        if caja is None:
            return cv2.goodFeaturesToTrack(g, MAX_RASGOS * 2, 0.01, 12)
        m = np.zeros_like(g)
        lado = caja * e / 2
        cv2.rectangle(m, (int(cx - lado), int(cy - lado)), (int(cx + lado), int(cy + lado)), 255, -1)
        return cv2.goodFeaturesToTrack(g, MAX_RASGOS, 0.01, 6, mask=m)

    ok, c0 = cap.read()
    if not ok:
        print("No se pudo leer el video")
        sys.exit(1)
    prev = gris(c0)
    # Transformación acumulada (similitud 2×3) del primer cuadro al actual, en px de análisis
    T = np.eye(3)
    p = np.array([px * e, py * e])
    pts = rasgos(prev, *p)
    puntos, escalas, rots = [[px, py]], [1.0], [0.0]
    perdidos = 0
    controles = [(c0.copy(), (px, py))] if control else []
    k = 1
    while ini + k < fin:
        ok, c = cap.read()
        if not ok:
            break
        g = gris(c)
        M = None
        if pts is not None and len(pts) >= 6:
            nuevos, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, pts, None, winSize=(21, 21), maxLevel=3)
            buenos = st.ravel() == 1
            a, b = pts[buenos].reshape(-1, 2), nuevos[buenos].reshape(-1, 2)
            if len(a) >= 6:
                M, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=2.0)
                if M is not None:
                    b = b[inl.ravel() == 1]
            pts = b.reshape(-1, 1, 2) if len(b) else None
        if M is None:
            perdidos += 1
            M = np.array([[1, 0, 0], [0, 1, 0]], dtype=float)
        T = np.vstack([M, [0, 0, 1]]) @ T
        q = T @ np.array([p[0], p[1], 1.0])
        s = math.hypot(T[0, 0], T[1, 0])
        r = math.degrees(math.atan2(T[1, 0], T[0, 0]))
        puntos.append([round(q[0] / e, 1), round(q[1] / e, 1)])
        escalas.append(round(s, 4))
        rots.append(round(r, 2))
        if pts is None or len(pts) < MIN_RASGOS:
            nuevos = rasgos(g, q[0], q[1])
            if nuevos is not None:
                pts = nuevos if pts is None else np.vstack([pts, nuevos])
        if control and k % max(1, int(fps)) == 0:
            controles.append((c.copy(), (q[0] / e, q[1] / e)))
        prev = g
        k += 1
    cap.release()

    datos = {"fps": fps, "ancho": W, "alto": H, "punto": [px, py], "cuadros": len(puntos), "puntos": puntos, "escala": escalas, "rot": rots}
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    Path(salida).write_text(json.dumps(datos, separators=(",", ":")), encoding="utf-8")
    xs = [q[0] for q in puntos]
    ys = [q[1] for q in puntos]
    print(f"OK {salida} · {len(puntos)} cuadros · recorrido x {min(xs):.0f}…{max(xs):.0f}, y {min(ys):.0f}…{max(ys):.0f} px · "
          f"escala {min(escalas):.3f}…{max(escalas):.3f} · cuadros sin seguimiento {perdidos}")
    if control and controles:
        tiras = []
        for img, (x, y) in controles[:12]:
            cv2.drawMarker(img, (int(x), int(y)), (0, 0, 255), cv2.MARKER_CROSS, 80, 8)
            tiras.append(cv2.resize(img, (int(img.shape[1] * 200 / img.shape[0]), 200)))
        filas = [np.hstack(tiras[i:i + 6] + [np.zeros_like(tiras[0])] * (6 - len(tiras[i:i + 6]))) for i in range(0, len(tiras), 6)]
        cv2.imwrite(control, np.vstack(filas))


if __name__ == "__main__":
    main()
