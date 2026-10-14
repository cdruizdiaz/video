"""Borra a una persona (y lo que tiene en las manos) de un video y rellena el hueco con el fondo, para reemplazarla
por un personaje sin que asome nada del original.

Cómo (nivel 1, rápido y local):
  1. Máscara de la persona en cada cuadro: el esqueleto (scripts/rig/esqueleto.py) marca dónde está seguro el cuerpo
     y, alrededor, la segmentación de personas de MediaPipe afina el borde (solo cerca del esqueleto: los que cruzan
     por detrás no se borran). Con --guitarra suma la guitarra (entre las dos manos, como Robot3D).
  2. Fondo limpio UNA vez: un cuadro de referencia con la persona borrada y el hueco rellenado con LaMa
     (modeloLama de herramientas.json, onnxruntime en CPU, Apache-2.0).
  3. Cada cuadro: el fondo limpio movido con la cámara (scripts/seguimiento.py, sin --caja) y pegado SOLO dentro de
     la máscara, con bordes suaves. Todo lo demás es el video original (las plantas siguen moviéndose).
  El relleno queda quieto: sirve cuando un personaje tapa casi todo el hueco (lo que se ve son franjas finas).

Nivel 1,5 (--nivel 1.5): el mismo fondo fijo, pero con el movimiento de las plantas vecinas. En cada cuadro se mide
el flujo óptico (DIS de OpenCV) entre el fondo fijo ya movido con la cámara y el cuadro real, en un anillo alrededor
de la máscara (ahí se ve el fondo de verdad: hojas que se mecen). Ese movimiento se extiende hacia adentro del hueco
y deforma el fondo fijo: las hojas rellenadas se mecen como las de al lado (y el borde del parche calza mejor).
No inventa detalles nuevos. ~2× lo que tarda el nivel 1.

Nivel 2 (--nivel 2): en vez del fondo fijo, ProPainter (carpeta `propainter` de herramientas.json; relleno de video
con flujo óptico: usa lo que se ve del fondo en otros cuadros y sigue el movimiento, así las plantas rellenadas
también se mueven). LICENCIA NO COMERCIAL (S-Lab 1.0): solo para trabajos personales. Se procesa un recorte
alrededor de la persona a --escala (0,5) en tramos de --tramo cuadros que se solapan y se funden. Lento en CPU:
probar antes con --hasta 60. Los tramos hechos se reusan si se corta (carpeta tmp/limpiar_<nombre>/).

Uso (Python del .venv):
  python scripts/limpiar_persona.py <video> <esqueleto.json> <seguimiento.json> <salida.mp4>
         [--guitarra derecha|izquierda] [--referencia 0] [--control salida.png] [--fondo fondo.png]
         [--nivel 1.5] [--nivel 2 [--escala 0.5] [--tramo 120]] [--hasta N]
"""
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
import onnxruntime as ort
from mediapipe.tasks.python import BaseOptions, vision

RAIZ = Path(__file__).resolve().parents[1]
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
MODELO_SEG = Path(HERR["modeloCaras"]).parent / "selfie_multiclass_256x256.tflite"

# ---------- Valores (fracciones del ancho de hombros S) ----------
SEGURO = {"miembro": 0.17, "tronco": 0.12, "cabeza": 0.32}  # se borra siempre (el cuerpo está ahí sí o sí)
ZONA = {"miembro": 0.4, "tronco": 0.45, "cabeza": 0.6}  # dentro de esto manda la segmentación
GUITARRA = {"mastil": 0.27, "adelante": 0.05, "abajo": 0.12, "cuerpo": (0.75, 0.62), "hombro": (0.55, 0.48),
            "largo": 3.0, "ancho_mastil": 0.28}
DILATAR = 15  # px de margen alrededor de la máscara
SUAVE = 11  # px de borde suave
LAMA = 512  # lado de la imagen del modelo
ESCALA_RELLENO = 0.5  # el relleno se calcula a media resolución (queda detrás del personaje)

MECER = {"escala": 0.5, "anillo": 140, "suave": 18, "max": 14}  # nivel 1,5: px (del cuadro completo) y tope del flujo
PP = {"solape": 12, "margen": 64, "vecinos": 10, "referencias": 10, "raft": 20}  # nivel 2 (ProPainter)

MIEMBROS = [(11, 13), (13, 15), (12, 14), (14, 16), (15, 19), (16, 20), (23, 25), (25, 27), (24, 26), (26, 28),
            (27, 31), (28, 32), (27, 29), (28, 30)]


def opcion(args, n, d=None, tipo=str):
    return tipo(args[args.index(n) + 1]) if n in args else d


def capsula(m, a, b, r):
    cv2.line(m, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), 255, max(1, int(2 * r)), cv2.LINE_AA)
    cv2.circle(m, (int(a[0]), int(a[1])), int(r), 255, -1, cv2.LINE_AA)
    cv2.circle(m, (int(b[0]), int(b[1])), int(r), 255, -1, cv2.LINE_AA)


def silueta(p, H, W, f):
    """Máscara del cuerpo a partir del esqueleto, con radios f (× S)."""
    m = np.zeros((H, W), np.uint8)
    S = math.dist(p[11][:2], p[12][:2])
    for a, b in MIEMBROS:
        capsula(m, p[a], p[b], f["miembro"] * S)
    tronco = np.array([p[i][:2] for i in (11, 12, 24, 23)], np.int32)
    cv2.fillPoly(m, [tronco], 255)
    m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=max(1, int(f["tronco"] * S)))
    cx, cy = (p[7][0] + p[8][0]) / 2, (p[7][1] + p[8][1]) / 2 - 0.1 * S
    cv2.circle(m, (int(cx), int(cy)), int(f["cabeza"] * S), 255, -1, cv2.LINE_AA)
    capsula(m, (cx, cy), ((p[11][0] + p[12][0]) / 2, (p[11][1] + p[12][1]) / 2), f["cabeza"] * S * 0.6)
    return m


def guitarra(p, H, W, lado):
    m = np.zeros((H, W), np.uint8)
    S = math.dist(p[11][:2], p[12][:2])
    ras, pis = (np.array(p[16][:2]), np.array(p[15][:2])) if lado == "derecha" else (np.array(p[15][:2]), np.array(p[16][:2]))
    u = pis - ras
    u = u / (np.linalg.norm(u) or 1)
    a = -math.copysign(GUITARRA["mastil"], u[0] or 1)
    u = np.array([u[0] * math.cos(a) - u[1] * math.sin(a), u[0] * math.sin(a) + u[1] * math.cos(a)])
    v = np.array([-u[1], u[0]])
    if v[1] < 0:
        v = -v
    o = ras + u * GUITARRA["adelante"] * S + v * GUITARRA["abajo"] * S
    ang = math.degrees(math.atan2(u[1], u[0]))
    for x, (rx, ry) in ((-0.3, GUITARRA["cuerpo"]), (0.32, GUITARRA["hombro"])):
        c = o + u * x * S
        cv2.ellipse(m, (int(c[0]), int(c[1])), (int(rx * S), int(ry * S)), ang, 0, 360, 255, -1, cv2.LINE_AA)
    w = GUITARRA["ancho_mastil"] * S
    a0, a1 = o + u * 0.4 * S, o + u * GUITARRA["largo"] * S
    pol = np.array([a0 + v * w, a1 + v * w, a1 - v * w, a0 - v * w], np.int32)
    cv2.fillPoly(m, [pol], 255)
    return m


def rellenar(img, mascara, sesion):
    """Rellena con LaMa lo que marca la máscara (a ESCALA_RELLENO, en ventanas de 512 con contexto)."""
    h, w = img.shape[:2]
    chico = cv2.resize(img, (int(w * ESCALA_RELLENO), int(h * ESCALA_RELLENO)), interpolation=cv2.INTER_AREA)
    falta = cv2.resize(mascara, (chico.shape[1], chico.shape[0])) > 127
    hc, wc = falta.shape
    trabajo = chico.copy()
    ys, xs = np.where(falta)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    paso = LAMA * 3 // 4
    cy = max(0, min(y0 - LAMA // 6, hc - LAMA))
    while True:
        cx = max(0, min((x0 + x1) // 2 - LAMA // 2, wc - LAMA))
        for cxx in sorted({cx, max(0, min(x0 - LAMA // 6, wc - LAMA)), max(0, min(x1 - LAMA + LAMA // 6, wc - LAMA))}):
            m = falta[cy:cy + LAMA, cxx:cxx + LAMA]
            if m.any():
                t = trabajo[cy:cy + LAMA, cxx:cxx + LAMA]
                im = cv2.cvtColor(t, cv2.COLOR_BGR2RGB).astype(np.float32).transpose(2, 0, 1)[None] / 255
                out = sesion.run(None, {"image": im, "mask": m.astype(np.float32)[None, None]})[0][0]
                out = out.transpose(1, 2, 0)
                if out.max() <= 2:
                    out = out * 255
                out = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
                t[m] = out[m]
                falta[cy:cy + LAMA, cxx:cxx + LAMA] = False
        if cy + LAMA >= min(hc, y1 + LAMA // 6) or cy + LAMA >= hc:
            break
        cy = min(cy + paso, hc - LAMA)
    grande = cv2.resize(trabajo, (w, h), interpolation=cv2.INTER_CUBIC)
    res = img.copy()
    res[mascara > 127] = grande[mascara > 127]
    return res


_dis = None


def mecer(fondo_t, cuadro, m):
    """Nivel 1,5: deforma el fondo fijo (ya movido con la cámara) con el movimiento que tiene el fondo real en un
    anillo alrededor de la máscara, extendido hacia adentro del hueco."""
    global _dis
    if _dis is None:
        _dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    H, W = m.shape
    ys, xs = np.where(m > 127)
    if not len(xs):
        return fondo_t
    a = MECER["anillo"]
    x0, y0, x1, y1 = max(0, xs.min() - a), max(0, ys.min() - a), min(W, xs.max() + a), min(H, ys.max() + a)
    e = MECER["escala"]
    tam = (int((x1 - x0) * e), int((y1 - y0) * e))
    gris = lambda im: cv2.cvtColor(cv2.resize(im[y0:y1, x0:x1], tam, interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    # flujo del cuadro real al fondo fijo: cuadro(x) ≈ fondo(x + F(x))
    F = _dis.calc(gris(cuadro), gris(fondo_t), None)
    mc = cv2.resize(m[y0:y1, x0:x1], tam) > 127
    hueco = cv2.dilate(mc.astype(np.uint8), np.ones((5, 5), np.uint8))
    anillo = cv2.dilate(hueco, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(a * e) * 2 + 1,) * 2)) - hueco
    mag = np.linalg.norm(F, axis=2)
    valido = ((anillo > 0) & (mag < MECER["max"] * e)).astype(np.float32)  # sin gente que cruza ni saltos raros
    # extender hacia adentro: convolución normalizada (promedio pesado de lo medido alrededor)
    s = MECER["suave"] * e
    peso = cv2.GaussianBlur(valido, (0, 0), s) + 1e-4
    Fs = np.dstack([cv2.GaussianBlur(F[..., i] * valido, (0, 0), s) / peso for i in range(2)])
    # donde se midió, el flujo real; adentro del hueco, el extendido
    Fx = np.where(valido[..., None] > 0, F, Fs) / e
    Fx = cv2.resize(Fx, (x1 - x0, y1 - y0), interpolation=cv2.INTER_LINEAR)
    gx, gy = np.meshgrid(np.arange(x0, x1, dtype=np.float32), np.arange(y0, y1, dtype=np.float32))
    res = fondo_t.copy()
    res[y0:y1, x0:x1] = cv2.remap(fondo_t, gx + Fx[..., 0], gy + Fx[..., 1], cv2.INTER_LINEAR,
                                  borderMode=cv2.BORDER_REPLICATE)
    return res


def relleno_video(cap, n, W, H, mascara, esc, tramo, nombre):
    """Nivel 2: ProPainter sobre un recorte alrededor de la persona, en tramos solapados.
    Devuelve f(t, cuadro) -> (máscara del cuadro, cuadro con el hueco rellenado)."""
    tmp = RAIZ / "tmp" / f"limpiar_{nombre}"
    d_masc = tmp / "mascaras_full"
    d_masc.mkdir(parents=True, exist_ok=True)
    # 1) máscaras de todos los cuadros (se guardan) y caja que las contiene a todas
    caja = [W, H, 0, 0]
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    for t in range(n):
        ok, c = cap.read()
        if not ok:
            break
        f_m = d_masc / f"{t:05d}.png"
        if f_m.exists():
            m = cv2.imread(str(f_m), cv2.IMREAD_GRAYSCALE)
        else:
            m = mascara(c, t)
            cv2.imwrite(str(f_m), m)
        ys, xs = np.where(m > 127)
        if len(xs):
            caja = [min(caja[0], xs.min()), min(caja[1], ys.min()), max(caja[2], xs.max()), max(caja[3], ys.max())]
    x0, y0 = max(0, caja[0] - PP["margen"]), max(0, caja[1] - PP["margen"])
    x1, y1 = min(W, caja[2] + PP["margen"]), min(H, caja[3] + PP["margen"])
    w2, h2 = int(round((x1 - x0) * esc / 8)) * 8, int(round((y1 - y0) * esc / 8)) * 8
    print(f"   recorte {x0},{y0}–{x1},{y1} → {w2}×{h2} para ProPainter", flush=True)
    # 2) tramos solapados
    pp = Path(HERR["propainter"])
    inicios = list(range(0, max(1, n - PP["solape"]), tramo - PP["solape"]))
    tramos = [(a, min(n, a + tramo)) for a in inicios]
    salida_tramo = lambda k: tmp / f"tramo_{k:02d}" / "res" / "cuadros" / "frames"
    for k, (a, b) in enumerate(tramos):
        if salida_tramo(k).exists() and len(list(salida_tramo(k).glob("*.png"))) == b - a:
            print(f"   tramo {k + 1}/{len(tramos)} ({a}–{b}) ya estaba")
            continue
        base = tmp / f"tramo_{k:02d}"
        shutil.rmtree(base, ignore_errors=True)
        d_c, d_m = base / "cuadros", base / "mascaras"
        d_c.mkdir(parents=True)
        d_m.mkdir(parents=True)
        cap.set(cv2.CAP_PROP_POS_FRAMES, a)
        for t in range(a, b):
            ok, c = cap.read()
            cv2.imwrite(str(d_c / f"{t - a:05d}.png"), cv2.resize(c[y0:y1, x0:x1], (w2, h2), interpolation=cv2.INTER_AREA))
            m = cv2.imread(str(d_masc / f"{t:05d}.png"), cv2.IMREAD_GRAYSCALE)[y0:y1, x0:x1]
            cv2.imwrite(str(d_m / f"{t - a:05d}.png"), (cv2.resize(m, (w2, h2)) > 127).astype(np.uint8) * 255)
        print(f"   tramo {k + 1}/{len(tramos)} ({a}–{b}): ProPainter…", flush=True)
        r = subprocess.run([sys.executable, "inference_propainter.py", "-i", str(d_c), "-m", str(d_m),
                            "-o", str(base / "res"), "--width", str(w2), "--height", str(h2),
                            "--neighbor_length", str(PP["vecinos"]), "--ref_stride", str(PP["referencias"]),
                            "--raft_iter", str(PP["raft"]), "--subvideo_length", str(tramo), "--save_frames"],
                           cwd=pp, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode != 0:
            print(r.stdout[-2000:], r.stderr[-3000:])
            sys.exit(1)

    def relleno(t, cuadro):
        m = cv2.imread(str(d_masc / f"{t:05d}.png"), cv2.IMREAD_GRAYSCALE)
        acc, peso = None, 0.0
        for k, (a, b) in enumerate(tramos):
            if a <= t < b:
                # en el solape se funde de un tramo al siguiente
                w = 1.0
                if k > 0 and t < a + PP["solape"]:
                    w = (t - a + 1) / (PP["solape"] + 1)
                if k + 1 < len(tramos) and t >= tramos[k + 1][0]:
                    w = 1 - (t - tramos[k + 1][0] + 1) / (PP["solape"] + 1)
                img = cv2.imread(str(salida_tramo(k) / f"{t - a:04d}.png")).astype(np.float32) * w
                acc = img if acc is None else acc + img
                peso += w
        f_t = cuadro.copy()
        f_t[y0:y1, x0:x1] = cv2.resize((acc / peso).astype(np.uint8), (x1 - x0, y1 - y0), interpolation=cv2.INTER_CUBIC)
        return m, f_t

    return relleno


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    con_valor = ("--guitarra", "--referencia", "--control", "--fondo", "--nivel", "--escala", "--tramo", "--hasta")
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and not (i > 0 and args[i - 1] in con_valor)]
    if len(pos) < 4:
        print(__doc__)
        sys.exit(1)
    video, f_esq, f_seg, salida = pos
    lado = opcion(args, "--guitarra")
    ref = opcion(args, "--referencia", 0, int)
    control = opcion(args, "--control")
    f_fondo = opcion(args, "--fondo")
    nivel = opcion(args, "--nivel", 1.0, float)
    esc_pp = opcion(args, "--escala", 0.5, float)
    tramo = opcion(args, "--tramo", 120, int)
    hasta = opcion(args, "--hasta", None, int)
    esq = json.loads(Path(f_esq).read_text(encoding="utf-8"))
    seg = json.loads(Path(f_seg).read_text(encoding="utf-8"))
    puntos = esq["puntos"]

    def esqueleto(t):
        for d in range(len(puntos)):
            for k in (t - d, t + d):
                if 0 <= k < len(puntos) and puntos[k]:
                    return puntos[k]
        return None

    def camara(t):
        """Afín de px del cuadro de referencia a px del cuadro t (seguimiento: punto, escala y rot en grados)."""
        def de0(k):
            c0 = np.array(seg["puntos"][0], float)
            ck = np.array(seg["puntos"][min(k, len(seg["puntos"]) - 1)], float)
            s = seg["escala"][min(k, len(seg["escala"]) - 1)]
            r = math.radians(seg["rot"][min(k, len(seg["rot"]) - 1)])
            A = s * np.array([[math.cos(r), -math.sin(r)], [math.sin(r), math.cos(r)]])
            return A, ck - A @ c0  # p_k = A p0 + b
        At, bt = de0(t)
        Ar, br = de0(ref)
        Ari = np.linalg.inv(Ar)
        A = At @ Ari
        return np.hstack([A, (bt - A @ br)[:, None]])

    segm = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=BaseOptions(model_asset_path=str(MODELO_SEG)), running_mode=vision.RunningMode.IMAGE,
        output_category_mask=True))

    def mascara(cuadro, t):
        H, W = cuadro.shape[:2]
        p = esqueleto(t)
        if p is None:
            return np.zeros((H, W), np.uint8)
        r = segm.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(cuadro, cv2.COLOR_BGR2RGB)))
        persona = (r.category_mask.numpy_view() > 0).astype(np.uint8) * 255
        persona = cv2.resize(persona, (W, H), interpolation=cv2.INTER_LINEAR)
        m = np.maximum(silueta(p, H, W, SEGURO), cv2.bitwise_and(persona, silueta(p, H, W, ZONA)))
        if lado:
            m = np.maximum(m, guitarra(p, H, W, lado))
        return cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * DILATAR + 1, 2 * DILATAR + 1)))

    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if hasta:
        n = min(n, hasta)
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if nivel == 2:
        relleno = relleno_video(cap, n, W, H, mascara, esc_pp, tramo, Path(salida).stem)
    else:
        # ---------- Fondo limpio (una vez) ----------
        cap.set(cv2.CAP_PROP_POS_FRAMES, ref)
        ok, c_ref = cap.read()
        m_ref = mascara(c_ref, ref)
        sesion = ort.InferenceSession(HERR["modeloLama"], providers=["CPUExecutionProvider"])
        fondo = rellenar(c_ref, m_ref, sesion)
        if f_fondo:
            Path(f_fondo).parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(f_fondo, fondo)
        print(f"fondo limpio listo (cuadro {ref})")

    # ---------- Cada cuadro ----------
    ff = subprocess.Popen([HERR["ffmpeg"], "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                           "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-g", "30",
                           "-pix_fmt", "yuv420p", salida], stdin=subprocess.PIPE)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    controles = []
    t = -1
    for t in range(n):
        ok, cuadro = cap.read()
        if not ok:
            break
        if nivel == 2:
            m, f_t = relleno(t, cuadro)
        else:
            m = mascara(cuadro, t)
            # el fondo de referencia, movido con la cámara
            f_t = cv2.warpAffine(fondo, camara(t), (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            if nivel == 1.5:
                f_t = mecer(f_t, cuadro, m)
        alfa = cv2.GaussianBlur(m, (0, 0), SUAVE / 2).astype(np.float32)[..., None] / 255
        limpio = (f_t * alfa + cuadro * (1 - alfa)).astype(np.uint8)
        ff.stdin.write(limpio.tobytes())
        if control and t % 60 == 0:
            ver = cuadro.copy()
            ver[m > 127] = (ver[m > 127] * 0.4 + np.array([0, 0, 255]) * 0.6).astype(np.uint8)
            controles.append(np.hstack([cv2.resize(ver, (W // 4, H // 4)), cv2.resize(limpio, (W // 4, H // 4))]))
    cap.release()
    ff.stdin.close()
    ff.wait()
    print(f"OK {salida} · {t + 1} cuadros")
    if control and controles:
        cols = 5
        filas = [np.hstack(controles[i:i + cols] + [np.zeros_like(controles[0])] * (cols - len(controles[i:i + cols])))
                 for i in range(0, len(controles), cols)]
        Path(control).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(control, np.vstack(filas))
        print(f"   control: {control}")


if __name__ == "__main__":
    main()
