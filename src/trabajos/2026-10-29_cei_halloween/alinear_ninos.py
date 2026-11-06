# (inglés: scripts/alinear_en.py; español: scripts/alinear.py; correr con el Python del .venv)
# Alinea cada segmento de segmentos_ninos.json con scripts/alinear.py (voz de los proxies) -> datos/al_<id>.json
import json, subprocess, sys, os
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ID = "2026-10-29_cei_halloween"
cfg = json.load(open(os.path.join(RAIZ, "src/trabajos", ID, "segmentos_ninos.json"), encoding="utf-8"))
for s in cfg["segmentos"]:
    salida = os.path.join(RAIZ, "public/trabajos", ID, "datos", f"aln_{s['id']}.json")
    if os.path.exists(salida): continue
    texto = " ".join(x for x in [s.get("previo", ""), " ".join(c["t"] for c in s["chunks"]), s.get("posterior", "")] if x)
    video = os.path.join(RAIZ, "public/trabajos", ID, "crudos", s["clip"] + ".mp4")
    r = subprocess.run([sys.executable, os.path.join(RAIZ, "scripts/alinear_en.py" if s.get("lengua") == "en" else "scripts/alinear.py"), video, texto,
                        "--desde", str(s["ventana"][0]), "--hasta", str(s["ventana"][1]), "--json", salida])
    print(s["id"], "ok" if r.returncode == 0 else "FALLO")
