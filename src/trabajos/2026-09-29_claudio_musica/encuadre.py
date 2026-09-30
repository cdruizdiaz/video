"""Calcula el encuadre de cada toma de datos/clips.json a partir de datos/caras.json (detectar_caras.py).

Por toma: un zoom fijo y un centro (cx, cy) que sigue a las caras, suavizado, con un punto cada 0,5 s.
  sujeto "grupo": encuadra a todas las caras grandes (dúo); "uno": sigue a la cara principal.
  zoomMax (opcional, por toma): tope de zoom para material de baja resolución (videos de WhatsApp).
Los proxies que no son 9:16 se muestran con object-fit: cover en 1080×1920: las caras se pasan a
fracciones de ese cuadro visible, que es el que usa la plantilla.

Uso: C:/Videos/_herramientas/.venv/Scripts/python.exe src/trabajos/2026-09-29_claudio_musica/encuadre.py
Salida: public/trabajos/<ID>/datos/encuadre.json  {"<clip>@<desdeMs>": {"zoom", "puntos": [{ms, cx, cy}]}}
"""
import json
from pathlib import Path

import numpy as np

ID = "2026-09-29_claudio_musica"
DATOS = Path("public/trabajos") / ID / "datos"
CONFIANZA = 0.75
CARA_MIN = 0.05  # ancho mínimo de cara (fracción) para contarla
CARA_OBJETIVO = 0.19  # ancho que debería ocupar una cara en la salida
ANCHO_GRUPO = 0.66  # el grupo de caras ocupa como mucho esta fracción del ancho de salida
ZOOM_MIN, ZOOM_MAX = 1.1, 1.7  # 1,7 como máximo: el material es 1080 p y más zoom se ve blando
PASO_MS = 500
SUAVIZADO = 5  # muestras (a 2 por segundo) de la mediana móvil
MARGEN_MS = 1000  # caras de un poco antes y después de la toma, para suavizar los bordes


SALIDA_ANCHO, SALIDA_ALTO = 1080, 1920


def a_cuadro_visible(c, ancho, alto):
    """Fracciones del proxy -> fracciones del cuadro 1080×1920 que muestra object-fit: cover."""
    escala = max(SALIDA_ANCHO / ancho, SALIDA_ALTO / alto)
    dx, dy = (ancho * escala - SALIDA_ANCHO) / 2, (alto * escala - SALIDA_ALTO) / 2
    fx, fy = ancho * escala / SALIDA_ANCHO, alto * escala / SALIDA_ALTO
    return {**c, "x": c["x"] * fx - dx / SALIDA_ANCHO, "y": c["y"] * fy - dy / SALIDA_ALTO, "w": c["w"] * fx, "h": c["h"] * fy}


def caras_validas(m):
    return [c for c in m["caras"] if c["p"] >= CONFIANZA and c["w"] >= CARA_MIN]


def main():
    caras = json.loads((DATOS / "caras.json").read_text(encoding="utf-8"))
    tomas = json.loads((DATOS / "clips.json").read_text(encoding="utf-8"))["tomas"]
    res = {}
    for t in tomas:
        clip = caras[t["clip"]]
        muestras = [{"t": m["t"], "caras": [a_cuadro_visible(c, clip["ancho"], clip["alto"]) for c in m["caras"]]}
                    for m in clip["muestras"] if t["desdeMs"] - MARGEN_MS <= m["t"] * 1000 <= t["hastaMs"] + MARGEN_MS]
        # cara principal de referencia: la mediana de las más grandes de toda la toma
        grandes = [max(caras_validas(m), key=lambda c: c["w"]) for m in muestras if caras_validas(m)]
        ref = (np.median([c["x"] + c["w"] / 2 for c in grandes]), np.median([c["y"] + c["h"] / 2 for c in grandes]))
        ts, cxs, cys, anchos, spans = [], [], [], [], []
        for m in muestras:
            cs = caras_validas(m)
            if not cs:
                continue
            if t.get("sujeto") == "grupo":
                wmax = max(c["w"] for c in cs)
                cs = [c for c in cs if c["w"] >= 0.7 * wmax]
            else:  # la más cercana a la referencia (evita saltar a gente del fondo)
                cs = [min(cs, key=lambda c: (c["x"] + c["w"] / 2 - ref[0]) ** 2 + (c["y"] + c["h"] / 2 - ref[1]) ** 2)]
            izq, der = min(c["x"] for c in cs), max(c["x"] + c["w"] for c in cs)
            ts.append(m["t"] * 1000)
            cxs.append((izq + der) / 2)
            cys.append(np.mean([c["y"] + c["h"] / 2 for c in cs]))
            anchos.append(np.mean([c["w"] for c in cs]))
            spans.append(der - izq)
        zoom = min(CARA_OBJETIVO / np.median(anchos), ANCHO_GRUPO / np.max(spans) if t.get("sujeto") == "grupo" else 99)
        tope = t.get("zoomMax", ZOOM_MAX)
        zoom = float(np.clip(zoom, min(ZOOM_MIN, tope), tope))
        k = SUAVIZADO // 2
        med = lambda v: [float(np.median(v[max(0, i - k): i + k + 1])) for i in range(len(v))]
        cxs, cys = med(cxs), med(cys)
        puntos = []
        for ms in range(t["desdeMs"], t["hastaMs"] + PASO_MS, PASO_MS):
            puntos.append({"ms": ms, "cx": round(float(np.interp(ms, ts, cxs)), 4), "cy": round(float(np.interp(ms, ts, cys)), 4)})
        clave = f'{t["clip"]}@{t["desdeMs"]}'
        res[clave] = {"zoom": round(zoom, 3), "puntos": puntos}
        print(f"{clave}: zoom {zoom:.2f} · cx {min(p['cx'] for p in puntos):.2f}-{max(p['cx'] for p in puntos):.2f} · cy {min(p['cy'] for p in puntos):.2f}-{max(p['cy'] for p in puntos):.2f} · {len(ts)} muestras")
    (DATOS / "encuadre.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
