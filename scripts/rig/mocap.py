"""Captura de movimiento desde un video común → secuencia de poses clave para el rig (sin trajes ni sensores).

Grabás la actuación con el celular (de frente, cuerpo entero si se quiere mover piernas, buena luz) y este script
saca con MediaPipe el cuerpo (Pose Landmarker) y la cara (Face Landmarker con blendshapes) cuadro a cuadro, lo
convierte en movimientos de los huesos del personaje y lo guarda como una secuencia JSON (formato zSecuencia de
src/rig/secuencia.ts) que se usa con la pista "secuencia" de PersonajeRig. El JSON es editable a mano: se reduce
a poses clave (solo donde el movimiento cambia) con interpolación lineal.

Uso (Python del .venv):
  python scripts/rig/mocap.py <video> <personaje> <salida.json> [opciones]
    --desde s --hasta s     tramo del video
    --fps 30                cuadros por segundo de la composición
    --suavizado 1.5         sigma (cuadros) del suavizado gaussiano (sin retraso: el video ya está grabado)
    --tolerancia 2.5        grados de error permitido al reducir a poses clave (más = menos poses)
    --espejo                el lado izquierdo de la pantalla del actor mueve el lado derecho del personaje
    --mover 1               multiplica el desplazamiento del cuerpo (0 = queda en el lugar)
    --sin-cara | --sin-cuerpo | --sin-boca | --sin-expresion
    --control salida.png    hoja con el esqueleto detectado sobre algunos cuadros (para revisar)

Qué se mueve (vista frente; usa solo los huesos que el personaje tenga):
  raiz (x, y: desplazamiento y saltos) · cuerpo (inclinación) · cabeza (giro lateral) · mano_*/brazo_* (ángulo
  hombro→muñeca) · pie_* (levantar el pie) · parpado / guino · mirada · yaw 2,5D (giro de la cara) ·
  visema (boca desde la mandíbula y los labios) · expresion (feliz / enojado / triste si el personaje las tiene).
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
MODELO_POSE = MODELOS / "pose_landmarker_full.task"
MODELO_CARA = MODELOS / "face_landmarker.task"

# ---------- Valores ----------
ANCHO_ANALISIS = 640  # px: se achica el video para analizar (más rápido, igual de preciso para pose)
CARA_PX = 320  # px del recorte de la cabeza para el detector de cara
VISIBLE = 0.5  # visibilidad mínima de un punto del cuerpo
HUECO_MAX = 20  # cuadros sin detección que se rellenan interpolando (más: se mantiene el último valor)
LIMITES = {  # grados o puntos: lo que el rig aguanta sin romperse
    "cuerpo.rot": 28, "cabeza.rot": 30, "mano.rot": 165, "pie.rot": 20, "pie.y": 35, "raiz.x": 160, "raiz.y": 120,
}
MAX_SEPARACION = 15  # cuadros máximos entre poses clave
TOL = {"x": 1.5, "y": 1.5, "parpado": 0.12, "guino": 0.12, "yaw": 0.06, "mx": 0.12, "my": 0.12}  # además de grados
YAW_MAX = 0.65  # más se nota que el personaje es plano (receta 2,5D)
EXPRESIONES = {  # blendshape → cara del personaje (con histéresis y duración mínima)
    "feliz": lambda b: (b["mouthSmileLeft"] + b["mouthSmileRight"]) / 2 > 0.5,
    "enojado": lambda b: (b["browDownLeft"] + b["browDownRight"]) / 2 > 0.6,
    "triste": lambda b: (b["mouthFrownLeft"] + b["mouthFrownRight"]) / 2 > 0.35,
}
MIN_EXPRESION = 12  # cuadros

# Puntos de Pose Landmarker
NARIZ, OREJA_I, OREJA_D = 0, 7, 8
HOMBRO_I, HOMBRO_D, CODO_I, CODO_D, MUNECA_I, MUNECA_D = 11, 12, 13, 14, 15, 16
CADERA_I, CADERA_D, RODILLA_I, RODILLA_D, TOBILLO_I, TOBILLO_D = 23, 24, 25, 26, 27, 28
# Puntos de Face Landmarker
OJO_EXT_PANT_I, OJO_EXT_PANT_D, NARIZ_CARA, MEJILLA_PANT_I, MEJILLA_PANT_D = 33, 263, 1, 234, 454


def opcion(args, nombre, defecto=None, tipo=float):
    if nombre in args:
        i = args.index(nombre)
        return tipo(args[i + 1])
    return defecto


def angulo(a, b):
    """Ángulo en grados de a→b en pantalla (y hacia abajo: + = horario)."""
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def envolver(g):
    return (g + 180) % 360 - 180


def suavizar(serie, sigma):
    """Gaussiano centrado (sin retraso) sobre una serie con NaN rellenados."""
    if sigma <= 0 or len(serie) < 3:
        return serie
    r = int(math.ceil(sigma * 3))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    pad = np.pad(serie, r, mode="edge")
    return np.convolve(pad, k, mode="valid")


def rellenar(serie):
    """Rellena NaN: interpola huecos cortos, mantiene el último valor en los largos, 0 si nunca hubo dato."""
    s = np.array(serie, dtype=float)
    ok = ~np.isnan(s)
    if not ok.any():
        return np.zeros_like(s), False
    idx = np.arange(len(s))
    interp = np.interp(idx, idx[ok], s[ok])
    # huecos largos: mantener (no inventar un movimiento lento de varios segundos)
    i = 0
    while i < len(s):
        if not ok[i]:
            j = i
            while j < len(s) and not ok[j]:
                j += 1
            if j - i > HUECO_MAX:
                antes = s[i - 1] if i > 0 else interp[i]
                interp[i:j] = antes
            i = j
        else:
            i += 1
    return interp, True


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and not (i > 0 and args[i - 1] in
           ("--desde", "--hasta", "--fps", "--suavizado", "--tolerancia", "--mover", "--control"))]
    if len(pos) < 3:
        print(__doc__)
        sys.exit(1)
    video, personaje, salida = pos[0], pos[1], pos[2]
    desde = opcion(args, "--desde", 0.0)
    hasta = opcion(args, "--hasta", None)
    fps_salida = opcion(args, "--fps", 30.0)
    sigma = opcion(args, "--suavizado", 1.5)
    tol_grados = opcion(args, "--tolerancia", 2.5)
    mover = opcion(args, "--mover", 1.0)
    espejo = "--espejo" in args
    usar_cara = "--sin-cara" not in args
    usar_cuerpo = "--sin-cuerpo" not in args
    usar_boca = "--sin-boca" not in args
    usar_expr = "--sin-expresion" not in args
    control = opcion(args, "--control", None, str)

    # ---------- Personaje ----------
    rig = json.loads((RAIZ / f"public/personajes/{personaje}/rig.json").read_text(encoding="utf-8"))
    piezas = json.loads((RAIZ / f"public/personajes/{personaje}/piezas.json").read_text(encoding="utf-8"))
    rv = rig["vistas"]["frente"]
    huesos = {h["id"]: h for h in rv["huesos"]}
    rostros = set(piezas.get("rostros", {}).keys())
    # Brazos: el hueso más alto de la cadena (brazo_* si existe; si no, mano_*). Lado de pantalla por el pivote.
    def lado_pantalla(hid):
        return -1 if huesos[hid]["pivote"][0] < 0 else 1
    brazos = {}
    for pref in ("brazo", "mano"):
        for hid in huesos:
            if hid.startswith(pref + "_") and lado_pantalla(hid) not in brazos:
                brazos[lado_pantalla(hid)] = hid
    pies = {lado_pantalla(h): h for h in huesos if h.startswith("pie_")}
    # Escala persona → personaje: largo del tronco (cadera→hombros) contra raiz→cabeza del personaje
    tronco_pj = abs(huesos.get("cabeza", {"pivote": [0, -100]})["pivote"][1] - huesos.get("cuerpo", {"pivote": [0, 0]})["pivote"][1]) + 40

    # ---------- Video ----------
    cap = cv2.VideoCapture(video)
    fps_video = cap.get(cv2.CAP_PROP_FPS) or 30
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    ini = int(round(desde * fps_video))
    fin = int(round(hasta * fps_video)) if hasta else total
    cap.set(cv2.CAP_PROP_POS_FRAMES, ini)
    n_salida = int(math.floor((fin - ini) / fps_video * fps_salida))

    pose_det = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODELO_POSE)), running_mode=vision.RunningMode.VIDEO, num_poses=1)) if usar_cuerpo else None
    cara_det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODELO_CARA)), running_mode=vision.RunningMode.VIDEO, num_faces=1,
        output_face_blendshapes=True)) if usar_cara else None

    canales = {}  # nombre → lista por cuadro de salida (NaN = sin dato)
    discretos = {"visema": [], "expresion_cruda": []}
    def poner(nombre, k, v):
        canales.setdefault(nombre, [math.nan] * n_salida)[k] = v

    controles = []  # cuadros para la hoja de control
    k_control = set(np.linspace(0, max(0, n_salida - 1), 12).astype(int).tolist()) if control else set()
    leidos = ini
    cuadro = None
    for k in range(n_salida):
        # cuadro del video que corresponde a este cuadro de salida
        objetivo = ini + int(round(k / fps_salida * fps_video))
        while leidos <= objetivo:
            ok, cuadro = cap.read()
            leidos += 1
            if not ok:
                cuadro = None
                break
        if cuadro is None:
            break
        h0, w0 = cuadro.shape[:2]
        esc = ANCHO_ANALISIS / w0 if w0 > ANCHO_ANALISIS else 1
        chico = cv2.resize(cuadro, (int(w0 * esc), int(h0 * esc))) if esc != 1 else cuadro
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(chico, cv2.COLOR_BGR2RGB))
        ms = k * 1000 // int(fps_salida) * 2  # ×2: deja lugar a un reintento con ms + 1
        W, H = chico.shape[1], chico.shape[0]
        P = None
        visema = None
        expr = None
        if pose_det:
            r = pose_det.detect_for_video(img, ms)
            if r.pose_landmarks:
                lm = r.pose_landmarks[0]
                P = [(p.x * W, p.y * H, p.visibility) for p in lm]
                # visible y dentro del cuadro (MediaPipe "estima" caderas y pies fuera de cuadro en primeros planos)
                vis = lambda i: P[i][2] >= VISIBLE and 0 <= P[i][0] <= W and 0 <= P[i][1] <= H
                xy = lambda i: (P[i][0], P[i][1])
                # Lados de pantalla: en un actor de frente, su hombro derecho (12) queda a la izquierda
                hi, hd = (HOMBRO_D, HOMBRO_I)
                if vis(HOMBRO_I) and vis(HOMBRO_D):
                    hombros = angulo(xy(hi), xy(hd))
                    m_h = ((P[hi][0] + P[hd][0]) / 2, (P[hi][1] + P[hd][1]) / 2)
                    inclina = hombros
                    if vis(CADERA_I) and vis(CADERA_D):
                        m_c = ((P[CADERA_I][0] + P[CADERA_D][0]) / 2, (P[CADERA_I][1] + P[CADERA_D][1]) / 2)
                        columna = envolver(angulo(m_c, m_h) + 90)
                        inclina = (hombros + columna) / 2
                        # Posición de la cadera y largo del tronco en px (se normaliza después con la mediana
                        # del largo: dividir cuadro a cuadro amplifica el temblor de la detección)
                        poner("_largo", k, math.dist(m_c, m_h))
                        poner("_cx", k, m_c[0])
                        poner("_cy", k, m_c[1])
                        # Pies: cuánto más arriba está cada tobillo que el otro (el más bajo es el apoyado)
                        if vis(TOBILLO_D) and vis(TOBILLO_I):
                            for idx_t, idx_o, idx_r in ((TOBILLO_D, TOBILLO_I, RODILLA_D), (TOBILLO_I, TOBILLO_D, RODILLA_I)):
                                lado = -1 if P[idx_t][0] < m_c[0] else 1
                                poner(f"_pie{lado}", k, max(0.0, P[idx_o][1] - P[idx_t][1]))
                                if vis(idx_r):
                                    poner(f"_pierot{lado}", k, envolver(angulo(xy(idx_r), xy(idx_t)) - 90))
                    poner("cuerpo.rot", k, inclina)
                    # Brazos: hombro → muñeca (o codo si la muñeca no se ve); reposo = colgando (90°)
                    for hom, cod, mun in ((HOMBRO_D, CODO_D, MUNECA_D), (HOMBRO_I, CODO_I, MUNECA_I)):
                        destino = mun if vis(mun) else cod if vis(cod) else None
                        if destino is None:
                            continue
                        lado = -1 if P[hom][0] < m_h[0] else 1
                        poner(f"_brazo{lado}", k, envolver(angulo(xy(hom), xy(destino)) - 90))
                    if vis(OREJA_I) and vis(OREJA_D):
                        poner("_cabeza_orejas", k, angulo(xy(OREJA_D), xy(OREJA_I)))
        if cara_det:
            # Si se ve el cuerpo, la cara se busca en un recorte alrededor de la cabeza a resolución completa
            # (en un plano general la cara mide pocos píxeles y el detector no la encuentra)
            img_cara, Wc, Hc = img, W, H
            if P is not None and P[NARIZ][2] >= VISIBLE and P[HOMBRO_I][2] >= VISIBLE and P[HOMBRO_D][2] >= VISIBLE:
                lado_px = max(96.0, 1.3 * math.dist(P[HOMBRO_I][:2], P[HOMBRO_D][:2])) / esc
                cx0, cy0 = P[NARIZ][0] / esc, P[NARIZ][1] / esc
                x0, y0 = int(max(0, cx0 - lado_px / 2)), int(max(0, cy0 - lado_px / 2))
                x1, y1 = int(min(w0, cx0 + lado_px / 2)), int(min(h0, cy0 + lado_px / 2))
                if x1 - x0 > 32 and y1 - y0 > 32:
                    rec = cv2.resize(cuadro[y0:y1, x0:x1], (CARA_PX, int(CARA_PX * (y1 - y0) / (x1 - x0))))
                    img_cara = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(rec, cv2.COLOR_BGR2RGB))
                    Wc, Hc = rec.shape[1], rec.shape[0]
            r = cara_det.detect_for_video(img_cara, ms)
            if not r.face_landmarks and img_cara is not img:
                # el recorte falló (primer plano: la cara es más grande que los hombros): cuadro entero
                ms += 1  # el detector en modo VIDEO exige tiempos crecientes
                r = cara_det.detect_for_video(img, ms)
                Wc, Hc = W, H
            if r.face_landmarks:
                L = [(p.x * Wc, p.y * Hc) for p in r.face_landmarks[0]]
                b = {c.category_name: c.score for c in r.face_blendshapes[0]}
                poner("_cabeza_ojos", k, angulo(L[OJO_EXT_PANT_I], L[OJO_EXT_PANT_D]))
                ancho = L[MEJILLA_PANT_D][0] - L[MEJILLA_PANT_I][0]
                if ancho > 1:
                    poner("yaw", k, max(-YAW_MAX, min(YAW_MAX, ((L[NARIZ_CARA][0] - L[MEJILLA_PANT_I][0]) / ancho - 0.5) * 2.2)))
                # Ojos: "Left" de MediaPipe es el ojo izquierdo del actor = derecha de la pantalla
                cierre = lambda v: max(0.0, min(1.0, (v - 0.3) / 0.4))
                ojo_pant_d, ojo_pant_i = cierre(b["eyeBlinkLeft"]), cierre(b["eyeBlinkRight"])
                if abs(ojo_pant_d - ojo_pant_i) > 0.5:
                    poner("parpado", k, 0.0)
                    poner("guino", k, ojo_pant_d if ojo_pant_d > ojo_pant_i else 0.0)
                else:
                    poner("parpado", k, (ojo_pant_d + ojo_pant_i) / 2)
                    poner("guino", k, 0.0)
                mx = ((b["eyeLookOutLeft"] + b["eyeLookInRight"]) - (b["eyeLookInLeft"] + b["eyeLookOutRight"])) / 2
                my = ((b["eyeLookDownLeft"] + b["eyeLookDownRight"]) - (b["eyeLookUpLeft"] + b["eyeLookUpRight"])) / 2
                poner("mx", k, max(-1, min(1, mx * 1.6)))
                poner("my", k, max(-1, min(1, my * 1.6)))
                if usar_boca:
                    abre = b["jawOpen"]
                    redonda = max(b["mouthFunnel"], b["mouthPucker"])
                    if redonda > 0.45:
                        visema = "E" if abre > 0.22 else "F"
                    elif abre > 0.45:
                        visema = "D"
                    elif abre > 0.2:
                        visema = "C"
                    elif abre > 0.09:
                        visema = "B"
                if usar_expr:
                    expr = next((n for n, f in EXPRESIONES.items() if n in rostros and f(b)), None)
        discretos["visema"].append(visema)
        discretos["expresion_cruda"].append(expr)
        if k in k_control and P is not None:
            dib = chico.copy()
            for a, c in ((11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (11, 23), (12, 24), (23, 24), (23, 25), (25, 27), (24, 26), (26, 28)):
                if P[a][2] >= VISIBLE and P[c][2] >= VISIBLE:
                    cv2.line(dib, (int(P[a][0]), int(P[a][1])), (int(P[c][0]), int(P[c][1])), (40, 220, 255), 3)
            cv2.putText(dib, str(k), (8, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            controles.append(dib)
    cap.release()
    n = len(discretos["visema"])
    if n == 0:
        print("No se pudo leer ningún cuadro")
        sys.exit(1)

    # ---------- Canales del rig ----------
    def serie(nombre):
        s, hubo = rellenar(canales.get(nombre, [math.nan] * n)[:n])
        return suavizar(s, sigma), hubo

    out = {}
    lim = lambda v, m: max(-m, min(m, v))
    largos = [v for v in canales.get("_largo", []) if not math.isnan(v)]
    largo_med = float(np.median(largos)) if largos else 1.0
    cuerpo, hay_cuerpo = serie("cuerpo.rot")
    if hay_cuerpo and "cuerpo" in huesos:
        out["cuerpo.rot"] = [lim(v, LIMITES["cuerpo.rot"]) for v in cuerpo]
    cab, hay_cab = serie("_cabeza_ojos")
    if not hay_cab:
        cab, hay_cab = serie("_cabeza_orejas")
    if hay_cab and "cabeza" in huesos:
        base = out.get("cuerpo.rot", [0] * n)
        out["cabeza.rot"] = [lim(envolver(c - b), LIMITES["cabeza.rot"]) for c, b in zip(cab, base)]
    for lado in (-1, 1):
        s, hubo = serie(f"_brazo{lado}")
        destino = brazos.get(-lado if espejo else lado)
        if hubo and destino:
            base = out.get("cuerpo.rot", [0] * n)
            out[f"{destino}.rot"] = [lim(envolver(v - b), LIMITES["mano.rot"]) for v, b in zip(s, base)]
        s, hubo = serie(f"_pie{lado}")
        destino = pies.get(-lado if espejo else lado)
        if hubo and destino:
            # menos de un 8 % del tronco es ruido de la detección (los dos pies apoyados)
            out[f"{destino}.y"] = [-lim(max(0.0, v / largo_med - 0.08) * tronco_pj, LIMITES["pie.y"]) for v in s]
            r, hubo_r = serie(f"_pierot{lado}")
            if hubo_r:
                out[f"{destino}.rot"] = [lim(v, LIMITES["pie.rot"]) for v in r]
    cx, hay_cx = serie("_cx")
    cy, _ = serie("_cy")
    # La raíz solo se mueve si se vio el cuerpo entero casi siempre (con la cadera cortada, la altura es ruido)
    cuerpo_entero = sum(1 for v in canales.get("_pie-1", []) if not math.isnan(v)) >= 0.7 * n
    if not cuerpo_entero:
        for lado in (-1, 1):
            destino = pies.get(lado)
            out.pop(f"{destino}.y", None)
            out.pop(f"{destino}.rot", None)
    if hay_cx and cuerpo_entero and "raiz" in huesos and mover > 0:
        x0, y0 = np.median(cx), np.percentile(cy, 90)  # el piso es lo más bajo que estuvo la cadera
        f = tronco_pj / largo_med * mover
        out["raiz.x"] = [lim((v - x0) * f * (-1 if espejo else 1), LIMITES["raiz.x"]) for v in cx]
        # solo se sube (saltos); menos de un 6 % del tronco es balanceo
        out["raiz.y"] = [-lim(max(0.0, (y0 - v) / largo_med - 0.06) * tronco_pj * mover, LIMITES["raiz.y"]) for v in cy]
    for nombre in ("parpado", "guino", "yaw", "mx", "my"):
        s, hubo = serie(nombre)
        if hubo:
            out[nombre] = [float(v) * (-1 if espejo and nombre in ("yaw", "mx") else 1) for v in s]
    if espejo and "guino" in out:
        out.pop("guino")  # el guiño es siempre del ojo de la derecha de la pantalla

    # Expresión: histéresis (dura al menos MIN_EXPRESION cuadros)
    expr = []
    actual, desde_k = None, 0
    for k, e in enumerate(discretos["expresion_cruda"]):
        if e != actual and k - desde_k >= MIN_EXPRESION:
            actual, desde_k = e, k
        expr.append(actual)
    # Visemas: se ignoran bocas de 1 cuadro (parpadeos de la detección)
    vis_l = list(discretos["visema"])
    for k in range(1, n - 1):
        if vis_l[k] != vis_l[k - 1] and vis_l[k] != vis_l[k + 1]:
            vis_l[k] = vis_l[k - 1]

    # ---------- Reducción a poses clave ----------
    tol = lambda nombre: TOL.get(nombre.split(".")[-1] if "." in nombre else nombre, tol_grados) if not nombre.endswith(".rot") else tol_grados
    nombres = list(out.keys())
    claves = [0]
    i = 0
    while i < n - 1:
        j = i + 1
        while j < n - 1 and j - i < MAX_SEPARACION:
            cand = j + 1
            # un cambio de boca o de cara obliga a poner una clave
            if vis_l[cand] != vis_l[i] or expr[cand] != expr[i]:
                break
            bien = True
            for nom in nombres:
                s = out[nom]
                for m in range(i + 1, cand):
                    t = (m - i) / (cand - i)
                    if abs(s[i] + (s[cand] - s[i]) * t - s[m]) > tol(nom):
                        bien = False
                        break
                if not bien:
                    break
            if not bien:
                break
            j = cand
        claves.append(j)
        i = j
    if claves[-1] != n - 1:
        claves.append(n - 1)

    poses = []
    r1 = lambda v: round(float(v), 1)
    r2 = lambda v: round(float(v), 2)
    for idx, k in enumerate(claves):
        hs = {}
        for nom in nombres:
            if "." in nom:
                hueso, canal = nom.split(".")
                hs.setdefault(hueso, {})[canal] = r1(out[nom][k])
        pose = {"huesos": hs, "dura": (claves[idx + 1] - k) if idx + 1 < len(claves) else 1}
        for nom in ("parpado", "guino", "yaw"):
            if nom in out:
                pose[nom] = r2(out[nom][k])
        if "mx" in out:
            pose["mirada"] = [r2(out["mx"][k]), r2(out.get("my", [0] * n)[k])]
        if vis_l[k]:
            pose["visema"] = vis_l[k]
        if usar_expr and usar_cara:
            pose["expresion"] = expr[k] or "base"
        poses.append(pose)

    sec = {
        "nombre": Path(salida).stem,
        "descripcion": f"mocap de {Path(video).name} ({desde:.1f}–{(desde + n / fps_salida):.1f} s), {n} cuadros a {fps_salida:g} fps"
        + (", espejo" if espejo else ""),
        "ciclo": False,
        "interpolacion": "lineal",
        "duracionCuadros": n,
        "poses": poses,
    }
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    # Una pose por línea: se lee y se corrige a mano
    cuerpo_json = ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in poses)
    cab = {k: v for k, v in sec.items() if k != "poses"}
    Path(salida).write_text(json.dumps(cab, ensure_ascii=False)[:-1] + ',"poses":[\n' + cuerpo_json + "\n]}\n", encoding="utf-8")
    detectado = lambda nom: sum(1 for v in canales.get(nom, []) if not math.isnan(v))
    print(f"OK {salida} · {n} cuadros → {len(poses)} poses clave · canales: {', '.join(nombres)}")
    print(f"   detección: cuerpo {detectado('cuerpo.rot')}/{n} · cara {detectado('parpado')}/{n} · bocas {sum(1 for v in vis_l if v)} · "
          f"expresiones {sorted(set(e for e in expr if e))}")

    if control and controles:
        h = 240
        tiras = [cv2.resize(c, (int(c.shape[1] * h / c.shape[0]), h)) for c in controles]
        cols = 6
        filas = [np.hstack(tiras[i:i + cols] + [np.zeros_like(tiras[0])] * (cols - len(tiras[i:i + cols]))) for i in range(0, len(tiras), cols)]
        Path(control).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(control, np.vstack(filas))
        print(f"   control: {control}")


if __name__ == "__main__":
    main()
