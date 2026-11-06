# Extrae el logotipo vectorial de DOCBA (p. 12 del manual) y la X de marca (p. 1): una ruta por letra.
import json, sys, pymupdf
PDF = "C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Brand Guidelines Docba.pdf"
d = pymupdf.open(PDF)

def ruta(dr, ox, oy):
    s = []
    cur = None
    def desde(p1):
        # empieza un subtrazo nuevo si no continúa donde terminó el anterior
        if cur is None or abs(cur.x - p1.x) > 0.01 or abs(cur.y - p1.y) > 0.01:
            if s and not s[-1].endswith("Z"): s.append("Z")
            s.append(f"M{p1.x-ox:.2f} {p1.y-oy:.2f}")
    for it in dr["items"]:
        k = it[0]
        if k == "l":
            p1, p2 = it[1], it[2]
            desde(p1); cur = p2
            s.append(f"L{p2.x-ox:.2f} {p2.y-oy:.2f}")
        elif k == "c":
            p1, c1, c2, p2 = it[1:5]
            desde(p1); cur = p2
            s.append(f"C{c1.x-ox:.2f} {c1.y-oy:.2f} {c2.x-ox:.2f} {c2.y-oy:.2f} {p2.x-ox:.2f} {p2.y-oy:.2f}")
        elif k == "re":
            r = it[1]
            if s and not s[-1].endswith("Z"): s.append("Z")
            s.append(f"M{r.x0-ox:.2f} {r.y0-oy:.2f}H{r.x1-ox:.2f}V{r.y1-oy:.2f}H{r.x0-ox:.2f}Z"); cur = None
        elif k == "qu":
            q = it[1]
            pts = [q.ul, q.ur, q.lr, q.ll]
            s.append("M" + "L".join(f"{p.x-ox:.2f} {p.y-oy:.2f}" for p in pts) + "Z")
    if dr.get("closePath", True) and s and not s[-1].endswith("Z"):
        s.append("Z")
    return "".join(s)

def sacar(pn):
    return [dr for dr in d[pn - 1].get_drawings() if dr["fill"] and dr["rect"].width < 1000]

L = sacar(12)
x0 = min(dr["rect"].x0 for dr in L); y0 = min(dr["rect"].y0 for dr in L)
x1 = max(dr["rect"].x1 for dr in L); y1 = max(dr["rect"].y1 for dr in L)
letras = [ruta(dr, x0, y0) for dr in L]
X = sacar(1)
rx = X[0]["rect"]
cruz = [ruta(dr, rx.x0, rx.y0) for dr in X]
datos = {"ancho": round(x1 - x0, 2), "alto": round(y1 - y0, 2), "letras": letras,
         "cruz": {"ancho": round(rx.width, 2), "alto": round(rx.height, 2), "rutas": cruz}}
open("src/marcas/docba/logo.json", "w", encoding="utf-8").write(json.dumps(datos, indent=1))
open("src/marcas/docba/logo.ts", "w", encoding="utf-8").write("// Generado por extraer_logo.py a partir del manual de marca (p. 12 y 1). No editar a mano.\nexport const LOGO_DOCBA = " + json.dumps(datos) + " as const;\n")
for nombre, color in [("naranja", "#EF6C00"), ("hueso", "#EDE4CD"), ("azul", "#303C43")]:
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {datos["ancho"]} {datos["alto"]}" width="{datos["ancho"]}" height="{datos["alto"]}">' + "".join(f'<path fill="{color}" fill-rule="evenodd" d="{p}"/>' for p in letras) + "</svg>"
    open(f"public/marcas/docba/logo-{nombre}.svg", "w", encoding="utf-8").write(svg)
print(datos["ancho"], datos["alto"], len(letras), len(cruz))
