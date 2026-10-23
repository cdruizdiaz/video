"""Esqueleto de una persona filmada, cuadro a cuadro, en píxeles del video → para personajes 3D humanoides por código.

A diferencia de mocap.py (que traduce el movimiento a los huesos de un rig 2D con otras proporciones), acá se guardan
los puntos del cuerpo tal cual están en el cuadro: un personaje 3D armado con esos puntos queda encima de la persona
(la tapa) y la sigue aunque la cámara se mueva. Ejemplo: src/personajes/robot/Robot3D.tsx.

Uso (Python del .venv):
  python scripts/rig/esqueleto.py <video> <salida.json> [--suavizado 2] [--control salida.png]

Salida JSON:
  { fps, ancho, alto, cuadros,
    puntos: [ [[x,y,z,vis] × 33] | null, … ]   (Pose Landmarker; x,y en px del video; z en px, + = más lejos)
    cabeza: [ {yaw, pitch, roll, boca} | null, … ]  (radianes; boca 0–1 = jawOpen de Face Landmarker) }
Si hay varias personas, sigue a la más grande del primer cuadro y después a la más cercana a la anterior
(las que cruzan por detrás no la reemplazan).
"""
import json
import math
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision

RAIZ = Path(__file__).resolve().parents[2]
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
MODELOS = Path(HERR["modeloCaras"]).parent

# ---------- Valores ----------
ANCHO_ANALISIS = 720  # px
CARA_PX = 320  # px del recorte de la cabeza para el detector de cara
PERSONAS = 3
HUECO_MAX = 20  # cuadros sin detección que se rellenan interpolando
ATIPICO = {"ventana": 30, "ancho": 0.12, "corrida": 0.2}  # cuadros a cada lado · fracción del ancho de hombros
NARIZ, HOMBRO_I, HOMBRO_D, CADERA_I, CADERA_D = 0, 11, 12, 23, 24


def opcion(args, n, d=None, tipo=float):
    return tipo(args[args.index(n) + 1]) if n in args else d


def suavizar(s, sigma):
    """Gaussiano centrado sobre una serie (rellena NaN interpolando; huecos largos mantienen el último valor)."""
    s = np.array(s, dtype=float)
    ok = ~np.isnan(s)
    if not ok.any():
        return s
    idx = np.arange(len(s))
    r = np.interp(idx, idx[ok], s[ok])
    if sigma > 0 and len(s) > 3:
        k = int(math.ceil(sigma * 3))
        n = np.exp(-0.5 * (np.arange(-k, k + 1) / sigma) ** 2)
        r = np.convolve(np.pad(r, k, mode="edge"), n / n.sum(), mode="valid")
    return r


def angulos(m):
    """yaw, pitch, roll (rad) de la matriz de transformación facial de MediaPipe (4×4)."""
    R = np.array(m)[:3, :3]
    yaw = math.atan2(-R[2, 0], math.hypot(R[2, 1], R[2, 2]))
    pitch = math.atan2(R[2, 1], R[2, 2])
    roll = math.atan2(R[1, 0], R[0, 0])
    return yaw, pitch, roll


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    con_valor = ("--suavizado", "--control")
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and not (i > 0 and args[i - 1] in con_valor)]
    if len(pos) < 2:
        print(__doc__)
        sys.exit(1)
    video, salida = pos
    sigma = opcion(args, "--suavizado", 2.0)
    control = opcion(args, "--control", None, str)

    pose_det = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODELOS / "pose_landmarker_full.task")),
        running_mode=vision.RunningMode.VIDEO, num_poses=PERSONAS))
    cara_det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODELOS / "face_landmarker.task")),
        running_mode=vision.RunningMode.VIDEO, num_faces=1, output_face_blendshapes=True,
        output_facial_transformation_matrixes=True))

    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W0, H0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    esc = min(1.0, ANCHO_ANALISIS / W0)
    crudos, cabezas, controles = [], [], []
    previo = None  # centro de la cadera/hombros de la persona seguida
    k = 0
    while True:
        ok, cuadro = cap.read()
        if not ok:
            break
        chico = cv2.resize(cuadro, (int(W0 * esc), int(H0 * esc))) if esc != 1 else cuadro
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(chico, cv2.COLOR_BGR2RGB))
        ms = int(k * 1000 / fps) * 2
        r = pose_det.detect_for_video(img, ms)
        P = None
        if r.pose_landmarks:
            cand = []
            for lm in r.pose_landmarks:
                pts = [(p.x * W0, p.y * H0, p.z * W0, p.visibility) for p in lm]
                ys = [p[1] for p in pts if p[3] > 0.5] or [0]
                centro = np.mean([pts[i][:2] for i in (HOMBRO_I, HOMBRO_D, CADERA_I, CADERA_D)], axis=0)
                cand.append((pts, max(ys) - min(ys), centro))
            if previo is None:
                elegido = max(cand, key=lambda c: c[1])
            else:
                elegido = min(cand, key=lambda c: np.linalg.norm(c[2] - previo))
                if np.linalg.norm(elegido[2] - previo) > 0.25 * W0:
                    elegido = None  # saltó a otra persona: mejor un hueco
            if elegido:
                P, previo = elegido[0], elegido[2]
        crudos.append(P)
        # Cara en un recorte alrededor de la cabeza (a resolución completa)
        cab = None
        if P is not None:
            lado = max(96.0, 1.4 * math.dist(P[HOMBRO_I][:2], P[HOMBRO_D][:2]))
            cx, cy = P[NARIZ][:2]
            x0, y0 = int(max(0, cx - lado / 2)), int(max(0, cy - lado / 2))
            x1, y1 = int(min(W0, cx + lado / 2)), int(min(H0, cy + lado / 2))
            if x1 - x0 > 32 and y1 - y0 > 32:
                rec = cv2.resize(cuadro[y0:y1, x0:x1], (CARA_PX, int(CARA_PX * (y1 - y0) / (x1 - x0))))
                rc = cara_det.detect_for_video(
                    mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(rec, cv2.COLOR_BGR2RGB)), ms)
                if rc.face_landmarks and rc.facial_transformation_matrixes:
                    yaw, pitch, roll = angulos(rc.facial_transformation_matrixes[0])
                    b = {c.category_name: c.score for c in rc.face_blendshapes[0]}
                    cab = {"yaw": yaw, "pitch": pitch, "roll": roll, "boca": b["jawOpen"]}
        cabezas.append(cab)
        if control and k % 30 == 0 and P is not None:
            dib = chico.copy()
            for a, c in ((11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (11, 23), (12, 24), (23, 24), (23, 25),
                         (25, 27), (24, 26), (26, 28), (15, 19), (16, 20), (27, 31), (28, 32)):
                pa = (int(P[a][0] * esc), int(P[a][1] * esc))
                pc = (int(P[c][0] * esc), int(P[c][1] * esc))
                cv2.line(dib, pa, pc, (40, 220, 255) if min(P[a][3], P[c][3]) > 0.5 else (60, 60, 255), 3)
            cv2.putText(dib, str(k), (8, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            controles.append(dib)
        k += 1
    cap.release()
    n = len(crudos)
    if not any(crudos):
        print("No se detectó a nadie")
        sys.exit(1)

    # ---------- Cuadros atípicos ----------
    # Cuando alguien cruza cerca, el detector mezcla puntos de las dos personas unos pocos cuadros (el tronco se
    # achica o se corre). Se descartan los que se apartan de la mediana móvil y después se rellenan interpolando.
    nan = float("nan")
    med = lambda p: (math.dist(p[HOMBRO_I][:2], p[HOMBRO_D][:2]),
                     np.mean([p[i][0] for i in (HOMBRO_I, HOMBRO_D, CADERA_I, CADERA_D)]),
                     np.mean([p[i][1] for i in (HOMBRO_I, HOMBRO_D, CADERA_I, CADERA_D)]))
    M = np.array([med(p) if p else (nan, nan, nan) for p in crudos])
    descartados = 0
    for t in range(n):
        if crudos[t] is None:
            continue
        v = M[max(0, t - ATIPICO["ventana"]): t + ATIPICO["ventana"] + 1]
        s_med, x_med, y_med = np.nanmedian(v, axis=0)
        s, x, y = M[t]
        if abs(s - s_med) > ATIPICO["ancho"] * s_med or math.hypot(x - x_med, y - y_med) > ATIPICO["corrida"] * s_med:
            crudos[t] = None
            descartados += 1
    print(f"   cuadros atípicos descartados: {descartados}")

    # ---------- Suavizado por canal ----------
    canal = lambda i, j: suavizar([p[i][j] if p else nan for p in crudos], sigma)
    serie = np.zeros((n, 33, 4))
    for i in range(33):
        for j in range(4):
            serie[:, i, j] = canal(i, j) if j < 3 else [p[i][3] if p else 0 for p in crudos]
    hay = [p is not None for p in crudos]
    # huecos largos: sin datos (el personaje se mantiene en la última pose en el componente)
    puntos = []
    hueco = 0
    for t in range(n):
        hueco = 0 if hay[t] else hueco + 1
        puntos.append(None if hueco > HUECO_MAX else [[round(float(v), 1) for v in serie[t, i, :3]] + [round(float(serie[t, i, 3]), 2)] for i in range(33)])
    cab_s = {c: suavizar([h[c] if h else nan for h in cabezas], sigma) for c in ("yaw", "pitch", "roll", "boca")}
    hay_c = any(cabezas)
    cabeza = [({c: round(float(cab_s[c][t]), 3) for c in cab_s} if hay_c else None) for t in range(n)]

    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    datos = {"fps": fps, "ancho": W0, "alto": H0, "cuadros": n}
    cuerpo = ",\n".join(json.dumps(p, separators=(",", ":")) for p in puntos)
    cabj = ",\n".join(json.dumps(c, separators=(",", ":")) for c in cabeza)
    Path(salida).write_text(json.dumps(datos)[:-1] + ',"puntos":[\n' + cuerpo + '\n],"cabeza":[\n' + cabj + "\n]}\n",
                            encoding="utf-8")
    print(f"OK {salida} · {n} cuadros · cuerpo {sum(hay)}/{n} · cara {sum(1 for c in cabezas if c)}/{n}")

    if control and controles:
        h = 320
        tiras = [cv2.resize(c, (int(c.shape[1] * h / c.shape[0]), h)) for c in controles]
        cols = 7
        filas = [np.hstack(tiras[i:i + cols] + [np.zeros_like(tiras[0])] * (cols - len(tiras[i:i + cols])))
                 for i in range(0, len(tiras), cols)]
        Path(control).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(control, np.vstack(filas))
        print(f"   control: {control}")


if __name__ == "__main__":
    main()
