# Ganancia (dB) que lleva la voz de cada alumno a ~-33 LUFS (el loudnorm final la sube a -14) en el tramo que se usa, para que no salte el volumen
# entre tomas (el loudnorm final lleva todo a -14). Mide la voz limpia (audio/voz) con ebur128, sin tocar los archivos.
# Salida: datos/ganancias.json -> { "<alumno>": { "lufs": -27.1, "gananciaDb": 7.1 } }
# Uso (raíz del proyecto): python src/trabajos/2026-10-15_cei_dia-de-la-madre/ganancias.py
import json
import re
import subprocess
from pathlib import Path

ID = "2026-10-15_cei_dia-de-la-madre"
OBJETIVO = -33.0  # por debajo de la toma más baja (Rosario, -33): así todas las ganancias son <= 0 (Remotion limita el volumen a 1)
HERR = json.loads(Path("scripts/herramientas.json").read_text(encoding="utf-8"))
base = Path("public/trabajos") / ID
plan = json.loads((Path("src/trabajos") / ID / "plan.json").read_text(encoding="utf-8"))
sync = json.loads((base / "datos" / "sincronia.json").read_text(encoding="utf-8"))

salida = {}
for t in plan["tomas"]:
    n = t["clip"]
    off = sync[n]["desfaseMs"] / 1000
    d = max(0.0, t["ini"] + off)
    h = t["fin"] + off
    r = subprocess.run([HERR["ffmpeg"], "-hide_banner", "-ss", f"{d:.3f}", "-t", f"{h - d:.3f}",
                        "-i", str(base / "audio" / "voz" / f"{n}.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?\d+\.\d+) LUFS", r.stderr)
    lufs = float(m[-1])
    g = max(-24.0, min(0.0, OBJETIVO - lufs))
    salida[n] = {"lufs": lufs, "gananciaDb": round(g, 1)}
    print(f"{n:22s} {lufs:6.1f} LUFS -> {g:+.1f} dB")
(base / "datos" / "ganancias.json").write_text(json.dumps(salida, indent=2), encoding="utf-8")
