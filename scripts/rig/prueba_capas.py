# Prueba del extractor con un .ai "óptimo" (capas de primer nivel con nombre), sin depender de un archivo real:
# dibuja con PyMuPDF un personaje humano simple en una hoja tipo Bloomie (frente arriba; una cara y las bocas
# A–F abajo), cada pieza en su capa (OCG) con el nombre de la guía, lo extrae y verifica piezas, huesos y visemas.
# Uso: python scripts/rig/prueba_capas.py   (sale con código 1 si algo falla)
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pymupdf

AQUI = Path(__file__).resolve().parent
PIEL, ROPA, PANTALON, TINTA, BLANCO, PELO = (1, 0.8, 0.65), (0.2, 0.5, 0.85), (0.25, 0.25, 0.35), (0.08, 0.05, 0.04), (1, 1, 1), (0.35, 0.2, 0.1)


def hoja(ruta):
    doc = pymupdf.open()
    pag = doc.new_page(width=800, height=1000)
    capas = {}

    def capa(nombre):
        if nombre not in capas:
            capas[nombre] = doc.add_ocg(nombre, on=True)
        return capas[nombre]

    def rect(nombre, r, color):
        s = pag.new_shape()
        s.draw_rect(pymupdf.Rect(*r))
        s.finish(fill=color, color=None, oc=capa(nombre))
        s.commit()

    def circ(nombre, c, radio, color):
        s = pag.new_shape()
        s.draw_circle(pymupdf.Point(*c), radio)
        s.finish(fill=color, color=None, oc=capa(nombre))
        s.commit()

    def elipse(nombre, r, color):
        s = pag.new_shape()
        s.draw_oval(pymupdf.Rect(*r))
        s.finish(fill=color, color=None, oc=capa(nombre))
        s.commit()

    # Frente (orden de dibujo = orden de capas): piernas, brazos de atrás, cuerpo, cabeza, rasgos
    for lado, x in (("izq", 170), ("der", 215)):
        rect(f"pierna_{lado}", (x, 300, x + 30, 380), PANTALON)
        elipse(f"pie_{lado}", (x - 8, 372, x + 38, 392), TINTA)
    for lado, x0, x1 in (("izq", 120, 150), ("der", 265, 295)):
        rect(f"brazo_{lado}", (x0, 200, x1, 255), ROPA)
        rect(f"antebrazo_{lado}", (x0, 250, x1, 300), PIEL)
        circ(f"mano_{lado}", ((x0 + x1) / 2, 308), 14, PIEL)
    rect("cuerpo", (150, 190, 265, 310), ROPA)
    elipse("pelo_sup", (140, 60, 275, 120), PELO)
    elipse("cabeza", (150, 80, 265, 195), PIEL)
    for lado, x in (("izq", 185), ("der", 230)):
        elipse(f"ojo_{lado}", (x - 12, 115, x + 12, 145), BLANCO)
        circ(f"pupila_{lado}", (x, 132), 7, TINTA)
        rect(f"ceja_{lado}", (x - 13, 104, x + 13, 108), TINTA)
    elipse("boca", (192, 162, 222, 172), TINTA)
    # Cara feliz (otra expresión), abajo
    elipse("cabeza", (150, 480, 265, 595), PIEL)
    for lado, x in (("izq", 185), ("der", 230)):
        rect(f"ojo_{lado}", (x - 12, 528, x + 12, 533), TINTA)
    elipse("boca", (185, 555, 230, 580), TINTA)
    # Bocas para hablar, sueltas
    for k, (v, w, h) in enumerate([("A", 30, 4), ("B", 30, 10), ("C", 34, 14), ("D", 32, 24), ("E", 22, 22), ("F", 14, 14)]):
        cx = 380 + k * 60
        elipse(f"boca_{v}", (cx - w / 2, 700 - h / 2, cx + w / 2, 700 + h / 2), TINTA)
    # Accesorio suelto en su capa
    rect("accesorio_baston", (650, 300, 660, 450), PELO)
    doc.save(ruta)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    tmp = Path(tempfile.mkdtemp(prefix="rig-capas-"))
    ai = tmp / "humano.ai"
    hoja(ai)
    mapa = tmp / "mapa.json"
    mapa.write_text("{}", encoding="utf8")
    r = subprocess.run(
        [sys.executable, str(AQUI / "extraer_rig.py"), str(ai), "prueba", "--salida", str(tmp / "pub"), "--revision", str(tmp / "rev"), "--sin-copia", "--mapa", str(mapa)],
        capture_output=True, text=True, encoding="utf-8",
    )
    if r.returncode != 0:
        print(r.stdout, r.stderr)
        sys.exit(1)
    datos = json.loads((tmp / "pub" / "piezas.json").read_text(encoding="utf8"))
    rig = json.loads((tmp / "pub" / "rig.json").read_text(encoding="utf8"))
    fallas = 0

    def igual(nombre, real, esperado):
        nonlocal fallas
        ok = real == esperado
        fallas += 0 if ok else 1
        print(("ok   " if ok else "FALLA") + f" {nombre}: {real}" + ("" if ok else f" (esperaba {esperado})"))

    frente = datos["vistas"].get("frente", {})
    piezas = sorted(p["id"] for p in frente.get("piezas", []))
    igual(
        "piezas del frente (por nombre de capa)",
        piezas,
        sorted(["pierna_izq", "pierna_der", "pie_izq", "pie_der", "brazo_izq", "brazo_der", "antebrazo_izq", "antebrazo_der", "mano_izq", "mano_der", "cuerpo", "pelo_sup", "cabeza"]),
    )
    igual("rostro del frente: 2 ojos", len(frente.get("rostro", {}).get("ojos", [])), 2)
    igual("rostro del frente: cejas", "cejas" in frente.get("rostro", {}), True)
    igual("visemas de capa", sorted(k for k, v in datos["visemas"].items() if v["de"] == "capa"), ["A", "B", "C", "D", "E", "F"])
    igual("expresiones", sorted(datos["rostros"]), ["base", "cara1"] if "base" in datos["rostros"] else ["cara1", "vista"])
    igual("accesorio con nombre de capa", "baston" in datos["accesorios"], True)
    padres = {h["id"]: h["padre"] for h in rig["vistas"]["frente"]["huesos"]}
    igual("cadena del brazo", [padres.get("mano_izq"), padres.get("antebrazo_izq"), padres.get("brazo_izq")], ["antebrazo_izq", "brazo_izq", "cuerpo"])
    igual("cadena de la pierna", [padres.get("pie_der"), padres.get("pierna_der")], ["pierna_der", "raiz"])
    igual("cabeza sobre el cuerpo", padres.get("cabeza"), "cuerpo")
    print("\nTodas las pruebas pasaron" if not fallas else f"\n{fallas} prueba(s) fallaron  (archivos en {tmp})")
    sys.exit(1 if fallas else 0)


if __name__ == "__main__":
    main()
