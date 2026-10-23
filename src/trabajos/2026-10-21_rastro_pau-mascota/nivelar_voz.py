# Voz de Pau toda al mismo nivel, palabra por palabra (borrador E, pedido 2026-10-21: "la voz de ella en algunas palabras
# se apaga, tiene que estar toda al mismo nivel"). Con los tiempos de la transcripción:
#   1) palabras que DeepFilterNet se comió (las confundió con ruido: "En el" de IMG_9055 bajaba 24 dB): si en la voz
#      filtrada la palabra está más de COMIDA dB por debajo que en la original, esa palabra vuelve de la original (con
#      fundidos cortos; trae su poco de ruido, pero se oye);
#   2) cada palabra se lleva a la mediana del clip (entre -BAJAR y +SUBIR dB) con rampas cortas; entre palabras separadas
#      la ganancia vuelve a 0 dB: las pausas (el ruido) no suben. Una "palabra" que en la original no tiene voz
#      (tiempo de Whisper corrido) no se toca.
# No cambia el timbre de la voz: solo volumen por palabra.
# Uso (lo llama preparar_voz.sh): python nivelar_voz.py <filtrada.wav> <original.wav> <clip> <salida.wav>
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ID = "2026-10-21_rastro_pau-mascota"
FF = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))["ffmpeg"]
TRANS = json.loads((Path("public/trabajos") / ID / "datos" / "transcripcion.json").read_text(encoding="utf-8"))

# ---------- Constantes ----------
SR = 48000
VENTANA = 0.02  # s, para medir
COMIDA = 9  # dB: palabra que el filtro bajó más que esto respecto de la original
SUBIR = 12  # dB máx. para subir una palabra
BAJAR = 6  # dB máx. para bajar una palabra
SIN_VOZ = 18  # dB: en la original, más de esto debajo de la mediana = no hay voz ahí (el "y" soplado de IMG_9060 está a 16)
RAMPA = 0.03  # s, rampas de ganancia y fundidos
UNIR = 0.18  # s: entre palabras más juntas que esto, la ganancia pasa de una a otra sin volver a 0 dB
MARGEN = 0.04  # s antes y después de cada palabra (Whisper corta justo)


def leer(ruta):
    crudo = subprocess.run([FF, "-v", "error", "-i", str(ruta), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                           capture_output=True, check=True).stdout
    return np.frombuffer(crudo, np.float32).copy()


def nivel(x):
    n = int(VENTANA * SR)
    v = x[: len(x) // n * n].reshape(-1, n)
    if not len(v):
        return -120.0
    rms = np.sqrt((v ** 2).mean(axis=1) + 1e-12)
    return float(20 * np.log10(np.mean(np.sort(rms)[-max(1, len(rms) * 3 // 10):])))


def rampa_a(g, a, b, valor):
    """Ganancia `valor` (lineal) entre las muestras a y b, con rampas de RAMPA s hacia y desde lo que había."""
    r = int(RAMPA * SR)
    g[a:b] = valor
    g[max(0, a - r):a] = np.linspace(g[max(0, a - r)], valor, a - max(0, a - r))
    g[b:b + r] = np.linspace(valor, g[min(len(g) - 1, b + r)], len(g[b:b + r]))


def main():
    filtrada, original, clip, salida = sys.argv[1:5]
    df, cr = leer(filtrada), leer(original)
    n = min(len(df), len(cr))
    df, cr = df[:n], cr[:n]
    palabras = TRANS.get(clip) or TRANS.get(clip + "b") or []
    tramos = [(max(0, int((p["startMs"] / 1000 - MARGEN) * SR)), min(n, int((p["endMs"] / 1000 + MARGEN) * SR)), p["text"])
              for p in palabras]
    tramos = [t for t in tramos if t[1] - t[0] > VENTANA * SR]
    if not tramos:
        Path(salida).write_bytes(Path(filtrada).read_bytes())
        return
    l_df = np.array([nivel(df[a:b]) for a, b, _ in tramos])
    l_cr = np.array([nivel(cr[a:b]) for a, b, _ in tramos])
    # la original a la escala de la filtrada (mismas medianas)
    ajuste = np.median(l_df) - np.median(l_cr)
    cr = cr * 10 ** (ajuste / 20)
    l_cr = l_cr + ajuste
    med = float(np.median(l_df))
    # 1) palabras comidas por el filtro → de la original
    voz = df.copy()
    comidas = []
    mezcla = np.zeros(n, np.float32)
    for (a, b, t), d, c in zip(tramos, l_df, l_cr):
        if c - d > COMIDA and c > med - SIN_VOZ:
            rampa_a(mezcla, a, b, 1.0)
            comidas.append(t)
    voz = df * (1 - mezcla) + cr * mezcla
    # 2) cada palabra a la mediana
    g = np.ones(n, np.float32)
    cambios = []
    previo = None
    for (a, b, t), c in zip(tramos, l_cr):
        lv = nivel(voz[a:b])
        if c < med - SIN_VOZ:  # sin voz en la original: no se toca
            previo = None
            continue
        db = float(np.clip(med - lv, -BAJAR, SUBIR))
        valor = 10 ** (db / 20)
        if previo is not None and 0 < (a - previo[0]) < UNIR * SR:
            g[previo[0]:a] = np.linspace(previo[1], valor, a - previo[0])  # de una palabra a la otra sin pasar por 0 dB
        rampa_a(g, a, b, valor)
        previo = (b, valor)
        if abs(db) >= 3:
            cambios.append(f"{t} {db:+.0f}")
    out = np.clip(voz * g, -1, 1)
    subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le", salida],
                   input=out.astype(np.float32).tobytes(), check=True)
    print(f"{clip}: {len(tramos)} palabras · recuperadas de la original: {', '.join(comidas) or '—'} · niveladas (dB): "
          f"{', '.join(cambios) or '—'}")


if __name__ == "__main__":
    main()
