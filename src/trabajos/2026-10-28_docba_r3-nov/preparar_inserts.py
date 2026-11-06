# Proxies de los inserts de Inserts cámara elegidos para R3 NOV (verticales: transpose=2, 1080x1920, 30 fps, sin audio).
# Para cada toma busca la ventana más firme (temblor + "gelatina" por flujo óptico, como jitter4.py) de la duración pedida; si el
# temblor pasa de 0,2 la estabiliza suave (vidstab smoothing=12, zoom fijo, sin rotación). Color natural (curva en S suave, luz objetivo).
# Uso: python preparar_inserts.py [slot ...]    Salidas: public/trabajos/<ID>/crudos/ins_<slot>.mp4
import math, os, subprocess, sys
import cv2, numpy as np
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
ID = "2026-10-28_docba_r3-nov"
B = f"public/trabajos/{ID}/crudos"
BASE = "C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara"
TMP = "tmp/r3"
TAGS = ["-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709"]
# slot: (carpeta, toma, duración de la ventana, desde-hasta donde buscar (s) | None = primeros 30 s, luz objetivo)
TOMAS = {
    # slot: (carpeta, toma, duración de la ventana, rango de búsqueda (s) | None = primeros 30 s, luz objetivo, opciones)
    # opciones: ss = segundo fijo; giro = filtro de giro/recorte (por defecto transpose=2); estab = estabilizar siempre (suave y natural);
    #           fluido = RIFE ×2 sobre el 24p original para que el movimiento no se trabe al pasar a 30 fps
    "mesa":      ("Comida", "C0092", 1.8, (4.3, 4.8), 0.50, {"fluido": True, "suave": True, "estab": 5, "color": "jamon"}),  # tostón: estabilización leve (smoothing 5) para sacar el tirón (aceleración 0,17 → 0,03) sin que se vea robótico
    "platos":    ("Comida", "C0100", 2.0, (0.0, 0.4), 0.50, {"fluido": True, "suave": True}),  # huevo centrado: sin estabilización
    "copas":     ("Comida", "C0115", 1.9, (4.0, 24.0), 0.50, {"giro": "crop=1215:2160:1300:0", "estab": 15, "color": "copas"}),  # brindis de dos personas (horizontal: recorte vertical)
    "reunion":   ("Reuniones", "C0041", 2.0, None, 0.60, {"ss": 5.0, "color": "claro"}),  # pizarrón, desde el 0:05: más luz sin perder calidad
}
run = lambda a: subprocess.run([FF, "-y", "-v", "error", *a], check=True)

def luz(path):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-vf", "fps=4,scale=48:84,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return float(np.frombuffer(raw, np.uint8).mean()) / 255

def ventana(src, L, rango, giro="transpose=2"):
    W, H, FPS = 135, 240, 24
    raw = subprocess.run([FF, "-v", "error", "-t", "30", "-i", src, "-vf", f"{giro},scale={W}:{H},format=gray,fps={FPS}", "-f", "rawvideo", "-"], capture_output=True).stdout
    n = len(raw) // (W * H); fr = np.frombuffer(raw, np.uint8)[: n * W * H].reshape(n, H, W)
    win = cv2.createHanningWindow((W, H), cv2.CV_32F); tr = [(0., 0.)]; wob = [0.]; prev = None
    for i in range(1, n):
        (dx, dy), _ = cv2.phaseCorrelate(fr[i - 1].astype(np.float32), fr[i].astype(np.float32), win); tr.append((dx, dy))
        fl = cv2.calcOpticalFlowFarneback(fr[i - 1], fr[i], None, .5, 2, 15, 2, 5, 1.1, 0); res = fl - fl.reshape(-1, 2).mean(0)
        wob.append(0. if prev is None else float(np.abs(res - prev).mean())); prev = res
    tr = np.array(tr); sm = np.stack([np.convolve(tr[:, j], np.ones(5) / 5, mode="same") for j in range(2)], 1)
    sc = np.hypot(*(tr - sm).T) + 2 * np.array(wob); w = int(L * FPS)
    cand = [(float(sc[s + 4:s + w - 4].mean()), round(s / FPS, 2)) for s in range(0, max(1, n - w), 2) if rango is None or rango[0] <= s / FPS <= rango[1]]
    return min(cand) if cand else (9.0, 0.0)

NATURAL = "eq=contrast=1.05:saturation=1.04:gamma={g:.3f},curves=all='0/0 0.25/0.23 0.5/0.5 0.75/0.77 1/1',unsharp=5:5:0.4:5:5:0"
# color "suave": solo realza un poco (sin cambiar la luz de la toma): saturación +7 %, contraste +3 %, vibrance leve
SUAVE = "eq=contrast=1.03:saturation=1.07,vibrance=intensity=0.12,unsharp=5:5:0.3:5:5:0"
COLORES = {
    # tostón con jamón: casi el color original (el realce anterior se veía artificial): saturación −3 %, menos amarillo neón, rojos más calmos
    "jamon": "eq=saturation=0.97:contrast=1.0,selectivecolor=yellows=0 0 -0.22 0:correction_method=relative,selectivecolor=reds=-0.04 0 0.02 0:correction_method=relative,colorbalance=rm=-0.01:bm=0.012:bs=0.01",
    # brindis: contraste con curva en S, saturación +14 %, vibrance, un toque cálido
    "copas": "eq=contrast=1.06:saturation=1.14:gamma={g:.3f},curves=all='0/0 0.2/0.17 0.5/0.52 0.8/0.84 1/1',vibrance=intensity=0.2,colorbalance=rm=0.02:bm=-0.015:rs=0.01,unsharp=5:5:0.35:5:5:0",
    # pizarrón oscuro: sube la luz (gamma al objetivo) con las sombras levantadas, sin curva en S que las aplaste
    "claro": "eq=contrast=1.0:saturation=1.06:gamma={g:.3f},curves=all='0/0 0.12/0.17 0.5/0.56 0.85/0.88 1/1',unsharp=5:5:0.3:5:5:0",
}
os.makedirs(TMP, exist_ok=True)
for slot in (sys.argv[1:] or list(TOMAS)):
    carpeta, toma, L, rango, obj, op = TOMAS[slot]
    giro = op.get("giro", "transpose=2")
    src = f"{BASE}/{carpeta}/{toma}.MP4"
    sc, ss = ventana(src, L, rango, giro)
    if "ss" in op: ss = op["ss"]
    pre = f"{TMP}/{slot}_pre.mp4"
    fps_pre = "24000/1001" if op.get("fluido") else "30"
    run(["-ss", str(ss), "-t", str(L + 0.1), "-i", src, "-an", "-vf", f"{giro},scale=1080:1920,fps={fps_pre},format=yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", pre])
    est = pre
    if op.get("estab"):  # solo si se pide (el valor es el smoothing: bajo = movimiento natural, alto = robótico): los clips cortos casi nunca necesitan estabilización (la usuaria pidió sacarla)
        trf = f"{TMP}/{slot}.trf"; est = f"{TMP}/{slot}_est.mp4"
        run(["-i", pre, "-vf", f"vidstabdetect=shakiness=5:accuracy=15:result={trf}", "-f", "null", "-"])
        run(["-i", pre, "-vf", f"vidstabtransform=input={trf}:smoothing={op['estab']}:zoom=3:optzoom=0:maxangle=0:interpol=bicubic,format=yuv420p", "-an", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", est])
    if op.get("fluido"):
        rife = f"{TMP}/{slot}_rife.mp4"
        subprocess.run(["node", "scripts/camara_lenta.mjs", est, rife, "--factor", "2", "--modo", "fluido"], check=True)
        est = rife
    m = luz(est); g = 1.0 if op.get("suave") else (math.log(m) / math.log(obj) if abs(m - obj) > 1e-3 else 1.0)
    out = f"{B}/ins_{slot}.mp4"
    run(["-i", est, "-vf", (COLORES[op["color"]].format(g=g) if op.get("color") else SUAVE if op.get("suave") else NATURAL.format(g=g)) + ",fps=30,format=yuv420p", "-an", "-c:v", "libx264", "-crf", "17", "-preset", "veryfast", "-g", "30", *TAGS, out])
    print(f"ins_{slot}: {toma} desde {ss}s ({L}s) temblor {sc:.2f}{' estabilizado' if est != pre else ''}{' RIFE' if op.get('fluido') else ''} luz {m:.2f} -> {luz(out):.2f}")
