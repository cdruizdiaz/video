# Palabras de cada alumno con su tiempo (s del VIDEO), a partir de la transcripción de la voz limpia (Whisper, DTW).
# Salida: datos/palabras.json -> { "<alumno>": [ { "i": 0, "t": "Hola", "d": 1.31, "h": 1.62 }, ... ] }
# Con --ver imprime las palabras de cada toma del plan con su índice (para escribir los subtítulos en plan.json).
# Uso (raíz del proyecto): python src/trabajos/2026-10-15_cei_dia-de-la-madre/palabras.py [--ver]
import json
import sys
from pathlib import Path

ID = "2026-10-15_cei_dia-de-la-madre"
base = Path("public/trabajos") / ID / "datos"
sync = json.loads((base / "sincronia.json").read_text(encoding="utf-8"))
plan = json.loads((Path("src/trabajos") / ID / "plan.json").read_text(encoding="utf-8"))
salida = {}
for f in sorted((base / "transcripciones_voz").glob("*.json")):
    n = f.stem
    off = sync[n]["desfaseMs"]
    pal = []
    for tk in json.loads(f.read_text(encoding="utf-8"))["tokens"]:
        tx = tk["text"]
        if not tx.strip() or tx.strip().startswith("["):
            continue
        d, h = tk["fromMs"], tk["toMs"]
        if tx.startswith(" ") or not pal:
            pal.append({"t": tx.strip(), "d": d, "h": h})
        else:
            pal[-1]["t"] += tx
            pal[-1]["h"] = h
    salida[n] = [{"i": i, "t": p["t"], "d": round((p["d"] - off) / 1000, 2), "h": round((p["h"] - off) / 1000, 2)}
                 for i, p in enumerate(pal)]
(base / "palabras.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1), encoding="utf-8")
if "--ver" in sys.argv:
    for t in plan["tomas"]:
        ws = [w for w in salida[t["clip"]] if t["ini"] - 1.0 <= w["d"] <= t["fin"] + 1.0]
        print(f"\n{t['clip']}  [{t['ini']}–{t['fin']}]")
        print("  " + "  ".join(f"{w['i']}:{w['t']}@{w['d']:.2f}-{w['h']:.2f}" for w in ws))
