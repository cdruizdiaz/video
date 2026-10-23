# Lleva el principio y el final de cada toma de datos/tomas_aprox.json al valle de energía de la voz más cercano
# (±RADIO_S) para no cortar dentro de una palabra, y mide el nivel de cada toma (ebur128 no: RMS de la voz, solo
# para la preview). Los cambios de plano quedan como están. Salida: datos/tomas.json (ms).
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-19_volto_radio/ajustar_cortes.py
import json
import subprocess
from pathlib import Path

import numpy as np

ID = "2026-10-19_volto_radio"
SR = 16000
PASO = 160  # 10 ms
VENTANA = 480  # 30 ms
RADIO_S = 0.3
DATOS = Path("public/trabajos") / ID / "datos"
HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))

_energia = {}


def energia(clip):
    if clip not in _energia:
        # sobre la voz limpia (DeepFilterNet, preparar_voz.sh): el estudio tiene mucho ruido de fondo y en el audio
        # crudo los valles entre palabras casi no se distinguen
        limpia = Path("public/trabajos") / ID / "audio" / "voz_limpia" / f"{clip}.wav"
        fuente = str(limpia) if limpia.exists() else f"public/trabajos/{ID}/crudos/{clip}.mp4"
        crudo = subprocess.run(
            [HERR["ffmpeg"], "-v", "error", "-i", fuente, "-map", "0:a:0",
             "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
        x = np.frombuffer(crudo, np.int16).astype(np.float32) / 32768
        n = (len(x) - VENTANA) // PASO
        cuad = np.lib.stride_tricks.sliding_window_view(x, VENTANA)[::PASO][:n] ** 2
        _energia[clip] = 10 * np.log10(cuad.mean(axis=1) + 1e-12)
    return _energia[clip]


PAUSA_DB = -35  # respecto de la voz (p90): por debajo, silencio entre palabras
PAUSA_MIN = 5  # cuadros de 10 ms: una pausa real dura al menos 50 ms
BUSCA_S = 0.6  # se busca la pausa más cercana a ±0,6 s
MARGEN = 8  # 80 ms de aire después del final de la palabra / antes de la siguiente


def valle(clip, t, lado):
    # lado "fin": corta MARGEN después de que termina la palabra; "inicio": MARGEN antes de que empiece la siguiente.
    # Si no hay una pausa real cerca, el mínimo de energía a ±RADIO_S (queda con alerta).
    db = energia(clip)
    voz = np.percentile(db, 90)
    c = int(round(t * 100))
    a, b = max(0, c - int(BUSCA_S * 100)), min(len(db), c + int(BUSCA_S * 100) + 1)
    bajo = db[a:b] < voz + PAUSA_DB
    tramos, k = [], 0
    while k < len(bajo):
        if bajo[k]:
            j = k
            while j < len(bajo) and bajo[j]:
                j += 1
            if j - k >= PAUSA_MIN:
                tramos.append((a + k, a + j))
            k = j
        else:
            k += 1
    if tramos:
        ini, fin = min(tramos, key=lambda r: abs((r[0] + r[1]) / 2 - c))
        k = min(fin - 1, ini + MARGEN) if lado == "fin" else max(ini, fin - MARGEN)
        return k * 10
    a, b = max(0, c - int(RADIO_S * 100)), min(len(db), c + int(RADIO_S * 100) + 1)
    return (a + int(np.argmin(db[a:b]))) * 10  # ms


def sobre_voz(clip, ms):
    # nivel en el corte respecto de la voz (p90 del clip): más de ALERTA_DB = el corte cae sobre una palabra
    db = energia(clip)
    k = ms // 10
    return float(db[max(0, k - 2):k + 3].max() - np.percentile(db, 90))


ALERTA_DB = -25

aprox = json.loads((DATOS / "tomas_aprox.json").read_text(encoding="utf-8"))
salida = {}
for pieza, tomas in aprox.items():
    if pieza.startswith("_"):
        continue
    salida[pieza] = []
    alertas = []
    for i, (clip, desde, hasta, planos) in enumerate(tomas):
        exacto = lambda v: round(float(v[1:]) * 1000) if isinstance(v, str) else None  # "=s": elegido a mano
        d = exacto(desde) if exacto(desde) is not None else valle(clip, desde, "inicio")
        h = exacto(hasta) if exacto(hasta) is not None else valle(clip, hasta, "fin")
        pl = [[max(d, round(s * 1000)), tipo] for s, tipo in planos]
        salida[pieza].append({"clip": clip, "desdeMs": d, "hastaMs": h, "planos": pl})
        for nombre, ms in (("inicio", d), ("fin", h)):
            nivel = sobre_voz(clip, ms)
            manual = isinstance(desde if nombre == "inicio" else hasta, str)
            if nivel > ALERTA_DB and not (nombre == "inicio" and i == 0) and not manual:
                alertas.append(f"toma {i + 1} {nombre} {ms / 1000:.2f} ({nivel:+.0f} dB)")
    dur = sum(t["hastaMs"] - t["desdeMs"] for t in salida[pieza]) / 1000
    print(f"{pieza:15s} {len(tomas):2d} tomas  {dur:5.1f} s  " + ("ALERTA " + "; ".join(alertas) if alertas else "ok"))

(DATOS / "tomas.json").write_text(json.dumps(salida, indent=1, ensure_ascii=False), encoding="utf-8")
print("->", DATOS / "tomas.json")
