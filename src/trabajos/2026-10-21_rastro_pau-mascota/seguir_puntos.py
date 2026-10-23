# Seguimiento de un punto preciso de Pau (OpenCV, flujo óptico; sin la pose de MediaPipe) para anclar a Bloomie
# (borrador D, pedido 2026-10-21: "busca un punto preciso en la palma… que no se mueva de allí"; "la línea negra de
# la remera apenas comienza el hombro… sin ese movimiento de intento de seguimiento raro").
# Parte de un cuadro nítido (REF) y sigue hacia adelante y hacia atrás: rasgos solo en una ZONA de textura (la palma;
# la remera y el cuello acanalado, sin el fondo) y una similitud (traslado, giro, escala) por cuadro con RANSAC. El
# ancla se lleva con esa transformación: queda pegada a la piel o a la tela.
# Salida: datos/ancla_<nombre>.json -> { desde, puntos: [[x,y]…], rot: […], escala: […] } (cuadros desde..hasta-1)
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-21_rastro_pau-mascota/seguir_puntos.py [--control]
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np

ID = "2026-10-21_rastro_pau-mascota"
CRUDOS = Path("public/trabajos") / ID / "crudos"
DATOS = Path("public/trabajos") / ID / "datos"
REVISION = Path("out") / ID / "revision"

# ---------- Constantes ----------
ANCLAS = {
    # zona más clara de la palma, sobre la base de los dedos (borrador E: "más arriba, en la zona más clara"; en D,
    # (335, 1098), en el centro, más oscuro), cuadro 120: mano quieta y nítida
    "palma": {"clip": "IMG_9053", "desde": 100, "hasta": 160, "ref": 120,
              "punto": (312, 1072), "zona": (310, 1110), "caja": (230, 130)},
    # donde empieza el hombro izquierdo (derecha de la imagen), sobre la costura negra; la zona es tela y cuello
    # acanalado, debajo del borde (el fondo y el pelo quedan afuera)
    "hombro": {"clip": "IMG_9054", "desde": 0, "hasta": 209, "ref": 39,
               "punto": (700, 1057), "zona": (690, 1110), "caja": (200, 110)},
}
MAX_RASGOS = 150


def leer(clip):
    cap = cv2.VideoCapture(str(CRUDOS / f"{clip}.mp4"))
    cuadros = []
    while True:
        ok, c = cap.read()
        if not ok:
            break
        cuadros.append(c)
    cap.release()
    return cuadros


def rasgos(g, cx, cy, caja):
    m = np.zeros_like(g)
    cv2.rectangle(m, (int(cx - caja[0] / 2), int(cy - caja[1] / 2)), (int(cx + caja[0] / 2), int(cy + caja[1] / 2)), 255, -1)
    return cv2.goodFeaturesToTrack(g, MAX_RASGOS, 0.005, 5, mask=m)


def seguir(grises, orden, a):
    """Transformaciones acumuladas (3×3) del cuadro REF a cada cuadro de `orden` (empieza en REF)."""
    T = np.eye(3)
    salida = {orden[0]: T.copy()}
    pts = rasgos(grises[orden[0]], *a["zona"], a["caja"])
    for i0, i1 in zip(orden, orden[1:]):
        M = None
        if pts is not None and len(pts) >= 6:
            nuevos, st, _ = cv2.calcOpticalFlowPyrLK(grises[i0], grises[i1], pts, None, winSize=(31, 31), maxLevel=4)
            ok = st.ravel() == 1
            p0, p1 = pts[ok].reshape(-1, 2), nuevos[ok].reshape(-1, 2)
            if len(p0) >= 6:
                M, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=1.5)
                if M is not None:
                    p1 = p1[inl.ravel() == 1]
            pts = p1.reshape(-1, 1, 2) if len(p1) else None
        if M is None:
            M = np.array([[1, 0, 0], [0, 1, 0]], dtype=float)
        T = np.vstack([M, [0, 0, 1]]) @ T
        salida[i1] = T.copy()
        # se renuevan los rasgos dentro de la zona ya transformada
        if pts is None or len(pts) < 40:
            z = T @ np.array([*a["zona"], 1.0])
            n = rasgos(grises[i1], z[0], z[1], a["caja"])
            if n is not None:
                pts = n if pts is None else np.vstack([pts, n])
    return salida


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    control = "--control" in sys.argv
    for nombre, a in ANCLAS.items():
        cuadros = leer(a["clip"])
        grises = [cv2.cvtColor(c, cv2.COLOR_BGR2GRAY) for c in cuadros]
        hasta = min(a["hasta"], len(grises))
        T = seguir(grises, list(range(a["ref"], hasta)), a)
        T.update(seguir(grises, list(range(a["ref"], a["desde"] - 1, -1)), a))
        puntos, rot, escala = [], [], []
        for f in range(a["desde"], hasta):
            q = T[f] @ np.array([*a["punto"], 1.0])
            puntos.append([round(q[0], 1), round(q[1], 1)])
            rot.append(round(math.degrees(math.atan2(T[f][1, 0], T[f][0, 0])), 2))
            escala.append(round(math.hypot(T[f][0, 0], T[f][1, 0]), 4))
        DATOS.mkdir(parents=True, exist_ok=True)
        (DATOS / f"ancla_{nombre}.json").write_text(
            json.dumps({"desde": a["desde"], "puntos": puntos, "rot": rot, "escala": escala}, separators=(",", ":")),
            encoding="utf-8")
        xs, ys = [p[0] for p in puntos], [p[1] for p in puntos]
        print(f"OK ancla_{nombre}.json · {len(puntos)} cuadros · x {min(xs):.0f}…{max(xs):.0f}, y {min(ys):.0f}…{max(ys):.0f}"
              f" · giro {min(rot):.1f}…{max(rot):.1f}° · escala {min(escala):.3f}…{max(escala):.3f}")
        if control:
            tiras = []
            for f in range(a["desde"], hasta, max(1, (hasta - a["desde"]) // 10)):
                img = cuadros[f].copy()
                x, y = puntos[f - a["desde"]]
                cv2.drawMarker(img, (int(x), int(y)), (0, 0, 255), cv2.MARKER_CROSS, 60, 4)
                cx, cy = int(x), int(y)
                rec = img[max(0, cy - 250):cy + 250, max(0, cx - 250):cx + 250]
                cv2.putText(rec, str(f), (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
                tiras.append(cv2.resize(rec, (250, 250)))
            filas = [np.hstack(tiras[i:i + 6] + [np.zeros_like(tiras[0])] * (6 - len(tiras[i:i + 6])))
                     for i in range(0, len(tiras), 6)]
            REVISION.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(REVISION / f"ancla_{nombre}.png"), np.vstack(filas))


if __name__ == "__main__":
    main()
