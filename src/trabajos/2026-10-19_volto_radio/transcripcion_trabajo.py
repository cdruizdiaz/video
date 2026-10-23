# Transcripción por palabra de la pieza "trabajo" (IMG_7180-002, 1638–1747 s), corregida, para los subtítulos.
# Fuente: datos/transcripciones_whisper/IMG_7180-002_1638.json (scripts/transcribir.mjs sobre ese tramo, con
# --prompt "Volto, agente de IA, IA con foco humano, coworker"; tiempos relativos al segundo 1638).
#   fin de palabra    = t_dtw de su último token
#   inicio de palabra = fin de la anterior, o el final de una pausa real entre ambas (energía de la voz limpia
#                       por debajo de UMBRAL_DB durante PAUSA_MIN_MS o más)
# Salida (datos/transcripcion.json):
#   "IMG_7180-002": ms del clip (voz de Nacho)
#   "conductor":    ms de audio/voz_conductor/conductor_1638.wav (empieza en el segundo 1638 del clip)
# Uso (raíz del proyecto): <python del .venv> src/trabajos/2026-10-19_volto_radio/transcripcion_trabajo.py
import json

import numpy as np
import soundfile as sf

ID = "2026-10-19_volto_radio"
DATOS = f"public/trabajos/{ID}/datos"
AUDIO = f"public/trabajos/{ID}/audio"
DESDE_MS = 1638000
FIN_CONDUCTOR = 18  # índices 0–17: el conductor ("Te hago la pregunta… al vendedor")
UMBRAL_DB = -40  # voz limpia de Nacho
UMBRAL_CONDUCTOR_DB = -42  # su voz, ya subida y limpia (fondo ≈ -55)
PAUSA_MIN_MS = 150
VENTANA_MS = 10

# Correcciones de texto por índice de palabra (lista en el orden de Whisper)
TEXTO = {
    42: "Volto",  # Whisper: "Vuelto"
    47: "humano.",
    # "lo primero que nos dicen los vendedores es: «uh, pará esto…»" (lo que dice, según el usuario, 2026-10-22;
    # Whisper: "nos hizo el vendedor es, Uy, para esto")
    143: "dicen",
    144: "los",
    145: "vendedores",
    146: "es:",
    147: "Uh,",
    148: "pará",
    # ⚠️ Whisper (las dos cámaras) entiende "la gente"; por el sentido es "el agente" (a confirmar con el cliente)
    166: "todo",
    167: "el",
    168: "agente,",
    186: "el",
    187: "agente",
    226: "el",
    227: "agente",
    255: "ocho",  # RAE: en letras los números que se escriben en una palabra
    261: "siete",
    276: "ocho",
    327: "sí",  # afirmativo: "no va a reemplazar…, sí es superproductivo"
}
# Palabras que se escriben juntas (RAE: el prefijo "súper" va unido al adjetivo): índice de la primera; la
# palabra unida va desde el inicio de la primera hasta el fin de la segunda
UNIR = {222: "supercontentos", 329: "superproductivo"}


def energia(ruta: str) -> tuple[np.ndarray, int]:
    x, sr = sf.read(ruta)
    if x.ndim > 1:
        x = x.mean(axis=1)
    n = int(sr * VENTANA_MS / 1000)
    m = len(x) // n
    rms = np.sqrt((x[: m * n].reshape(m, n) ** 2).mean(axis=1))
    return 20 * np.log10(rms + 1e-9), n


def fin_de_pausa(db: np.ndarray, a_ms: float, b_ms: float, umbral: float) -> float | None:
    """Final de la última pausa (≥ PAUSA_MIN_MS bajo el umbral) entre a_ms y b_ms, o None."""
    i0, i1 = int(a_ms / VENTANA_MS), int(b_ms / VENTANA_MS)
    bajo = db[i0:i1] < umbral
    fin, largo = None, 0
    for k, b in enumerate(bajo):
        largo = largo + 1 if b else 0
        if b and largo * VENTANA_MS >= PAUSA_MIN_MS:
            fin = (i0 + k + 1) * VENTANA_MS
    return fin


def palabras(j: dict) -> list[dict]:
    ps = []
    for t in j["tokens"]:
        if t["text"].strip().startswith("["):
            continue
        if t["text"].startswith(" ") or not ps:
            ps.append({"text": t["text"].strip(), "fin": t["dtwMs"]})
        else:
            ps[-1]["text"] += t["text"]
            ps[-1]["fin"] = t["dtwMs"]
    return ps


def main() -> None:
    j = json.load(open(f"{DATOS}/transcripciones_whisper/IMG_7180-002_1638.json", encoding="utf-8"))
    ps = palabras(j)
    for i, t in TEXTO.items():
        ps[i]["text"] = t
    # voz limpia de Nacho (ms del clip) y la del conductor (ms desde 1638)
    db_nacho, _ = energia(f"{AUDIO}/voz_limpia/IMG_7180-002.wav")
    db_cond, _ = energia(f"{AUDIO}/voz_conductor/conductor_1638.wav")
    for i in sorted(UNIR, reverse=True):
        ps[i] = {"text": UNIR[i], "fin": ps[i + 1]["fin"]}
        del ps[i + 1]
    salida = {"IMG_7180-002": [], "conductor": []}
    previo = 0.0
    for i, p in enumerate(ps):
        cond = i < FIN_CONDUCTOR
        fin = p["fin"] + (0 if cond else DESDE_MS)
        ini = previo if i not in (0, FIN_CONDUCTOR) else fin - 300
        db, umbral = (db_cond, UMBRAL_CONDUCTOR_DB) if cond else (db_nacho, UMBRAL_DB)
        pausa = fin_de_pausa(db, ini, fin, umbral)
        if pausa is not None and pausa < fin - 40:
            ini = pausa
        salida["conductor" if cond else "IMG_7180-002"].append(
            {"text": p["text"], "startMs": round(ini), "endMs": round(fin)}
        )
        previo = fin
    json.dump(salida, open(f"{DATOS}/transcripcion.json", "w", encoding="utf-8"), ensure_ascii=False)
    print({k: len(v) for k, v in salida.items()})


main()
