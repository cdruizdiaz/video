"""Mapea el reel de referencia (v2 de la otra PC) sobre el original IMG_7203: para cada ventana corta del audio
de la referencia busca, por correlación cruzada, en qué segundo del original está. Los saltos del desfase son los
cortes del montaje. Salida: lista de tramos (ref_desde, ref_hasta, src_desde) en JSON.

Uso: python mapear_referencia.py <ref.wav> <original.wav> <salida.json>
"""
import json
import subprocess
import sys

import numpy as np

SR = 8000
VENTANA = 0.5  # s
PASO = 0.1  # s
TOLERANCIA = 0.03  # s: desfases dentro de esto son el mismo tramo


def leer(ruta: str) -> np.ndarray:
    ff = json.load(open("scripts/herramientas.json", encoding="utf-8"))["ffmpeg"]
    crudo = subprocess.run(
        [ff, "-v", "error", "-i", ruta, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(crudo, dtype=np.float32).copy()


_CACHE: dict = {}


def correlacion(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Correlación normalizada de la ventana a sobre toda la señal b (FFT; el espectro de b se calcula una vez)."""
    n = len(a) + len(b)
    n2 = 1 << (n - 1).bit_length()
    if "fb" not in _CACHE:
        _CACHE["fb"] = np.fft.rfft(b, n2)
        cs = np.cumsum(np.concatenate([[0], b * b]))
        _CACHE["eb"] = np.sqrt(np.maximum(cs[len(a) :] - cs[: -len(a)], 1e-9))
    a0 = a - a.mean()
    fa = np.fft.rfft(a0[::-1], n2)
    c = np.fft.irfft(fa * _CACHE["fb"], n2)[len(a) - 1 : len(b)]
    return c / (np.linalg.norm(a0) * _CACHE["eb"] + 1e-9)


def main() -> None:
    ref, src, salida = sys.argv[1:4]
    r = leer(ref)
    s = leer(src)
    w = int(VENTANA * SR)
    puntos = []
    t = 0.0
    while (t + VENTANA) * SR <= len(r):
        a = r[int(t * SR) : int(t * SR) + w]
        if np.sqrt(np.mean(a * a)) > 0.003:  # ventanas con sonido
            c = correlacion(a, s)
            k = int(np.argmax(c))
            puntos.append((round(t, 2), round(k / SR - t, 3), round(float(c[k]), 3)))
        t += PASO
    # agrupar en tramos de desfase constante (solo correlaciones buenas)
    tramos = []
    for t, d, q in puntos:
        if q < 0.6:
            continue
        if tramos and abs(tramos[-1]["desfase"] - d) < TOLERANCIA:
            tramos[-1]["hasta"] = round(t + VENTANA, 2)
            tramos[-1]["n"] += 1
        else:
            tramos.append({"desde": t, "hasta": round(t + VENTANA, 2), "desfase": d, "n": 1})
    tramos = [x for x in tramos if x["n"] >= 3]
    for x in tramos:
        x["srcDesde"] = round(x["desde"] + x["desfase"], 3)
        print(f"ref {x['desde']:6.2f}-{x['hasta']:6.2f}  ->  src {x['srcDesde']:8.3f}  (desfase {x['desfase']:8.3f}, {x['n']} ventanas)")
    json.dump({"puntos": puntos, "tramos": tramos}, open(salida, "w", encoding="utf-8"), indent=1)


if __name__ == "__main__":
    main()
