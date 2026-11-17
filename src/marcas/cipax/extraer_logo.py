"""Vectoriza el logo de Cipax (Logo_oscuro.pdf del cliente) en src/marcas/cipax/logo.json: una pieza por forma
(isotipo: cuadrado, trazo oscuro, trazo azul; letras C I P A X y el rombo azul de la A), en el orden en que se animan.
Uso: python -I src/marcas/cipax/extraer_logo.py"""
import json, pathlib, pymupdf

PDF = r"C:/Users/LUCIA/Documents/RASTRO/Clientes/Cipax/Identidad Visual/Logo/Logo_oscuro.pdf"
SALIDA = pathlib.Path(__file__).with_name("logo.json")

def ruta(dr):
    d, ultimo = [], None
    f = lambda p: f"{p.x:.2f} {p.y:.2f}"
    for it in dr["items"]:
        if it[0] == "re":
            r = it[1]; d.append(f"M{r.x0:.2f} {r.y0:.2f}H{r.x1:.2f}V{r.y1:.2f}H{r.x0:.2f}Z"); ultimo = None; continue
        if it[0] == "qu":
            q = it[1]; d.append(f"M{f(q.ul)}L{f(q.ur)}L{f(q.lr)}L{f(q.ll)}Z"); ultimo = None; continue
        a = it[1]
        if ultimo is None or abs(ultimo.x - a.x) > 0.01 or abs(ultimo.y - a.y) > 0.01:
            d.append(f"M{f(a)}")
        if it[0] == "l": d.append(f"L{f(it[2])}"); ultimo = it[2]
        elif it[0] == "c": d.append(f"C{f(it[2])} {f(it[3])} {f(it[4])}"); ultimo = it[4]
    if dr.get("closePath"): d.append("Z")
    return "".join(d)

pag = pymupdf.open(PDF)[0]
piezas = []
for dr in pag.get_drawings():
    azul = dr["fill"][2] > 0.9
    r = dr["rect"]
    piezas.append({"d": ruta(dr), "azul": azul, "x0": r.x0, "x1": r.x1, "y0": r.y0, "y1": r.y1})
# isotipo = lo que está a la izquierda de x 230; letras ordenadas de izquierda a derecha
iso = sorted([p for p in piezas if p["x1"] < 230], key=lambda p: p["x0"] + (0 if p["x1"] - p["x0"] < 60 else 100))
letras = sorted([p for p in piezas if p["x1"] >= 230 and not p["azul"]], key=lambda p: (p["x0"], p["y0"]))
rombo = [p for p in piezas if p["x1"] >= 230 and p["azul"]]
x0 = min(p["x0"] for p in piezas); y0 = min(p["y0"] for p in piezas)
x1 = max(p["x1"] for p in piezas); y1 = max(p["y1"] for p in piezas)
M = 2
out = {
    "ancho": round(x1 - x0 + 2 * M, 2), "alto": round(y1 - y0 + 2 * M, 2),
    "desplaza": [round(-x0 + M, 2), round(-y0 + M, 2)],
    "isotipo": [{"d": p["d"], "azul": p["azul"], "caja": [p["x0"], p["y0"], p["x1"], p["y1"]]} for p in iso],
    "letras": [{"d": p["d"], "caja": [p["x0"], p["y0"], p["x1"], p["y1"]]} for p in letras],
    "rombo": {"d": rombo[0]["d"], "caja": [rombo[0]["x0"], rombo[0]["y0"], rombo[0]["x1"], rombo[0]["y1"]]},
}
SALIDA.write_text(json.dumps(out, indent=1), encoding="utf-8")
print(out["ancho"], out["alto"], len(iso), len(letras), [round(l["caja"][0]) for l in out["letras"]])
