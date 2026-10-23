# Arma los subtítulos de cada toma ("subs" en plan.json) a partir de las frases de "texto", de lo que Whisper entendió
# (datos/palabras.json) y de las pausas reales de la voz (datos/segmentos.json).
# Los tiempos por palabra de Whisper se corren hasta medio segundo (sobre todo al final de la frase) y el reparto
# proporcional por letras salía adelantado, así que se hace en tres pasos:
#   1. cada palabra del subtítulo se empareja con la palabra de Whisper que dice lo mismo (difflib) y eso decide
#      en QUÉ tramo de voz (entre pausas) está;
#   2. dentro de cada tramo, las palabras se reparten en proporción a sus sílabas sobre la duración real del tramo
#      (la voz de un chico es casi pareja entre dos pausas);
#   3. cada frase entra con su primera palabra y sale cuando termina su última (o al arrancar la siguiente, si
#      no hay pausa de por medio).
#   (el inicio de cada palabra decide el tramo si cae dentro de uno, si no el punto medio; un tramo muy corto no carga con más sílabas de las que caben)
# Uso (raíz del proyecto): voz_segmentos.py → palabras.py → armar_subs.py (en src/trabajos/<ID>/)
import difflib
import json
import re
import unicodedata
from pathlib import Path

ID = "2026-10-15_cei_dia-de-la-madre"
RESPIRO = 0.12  # s que se queda un subtítulo después de su última palabra
PAUSA_LARGA = 0.45  # s: si entre una frase y la siguiente hay más que esto, la frase sale al terminar
ANTICIPO = 0.0  # s que entra antes de la primera palabra
base = Path("public/trabajos") / ID / "datos"
RAIZ = Path("src/trabajos") / ID / "plan.json"
plan = json.loads(RAIZ.read_text(encoding="utf-8"))
segmentos = json.loads((base / "segmentos.json").read_text(encoding="utf-8"))
palabras = json.loads((base / "palabras.json").read_text(encoding="utf-8"))


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-zñ0-9]", "", w)


def silabas(w):
    n = len(re.findall(r"[aeiouáéíóúü]+", w.lower()))
    return max(1, n)


for t in plan["tomas"]:
    ini, fin = t["ini"], t["fin"]
    segs = [[max(a, ini), min(b, fin)] for a, b in segmentos[t["clip"]] if b > ini + 0.05 and a < fin - 0.05]
    segs = [s for s in segs if s[1] - s[0] > 0.08] or [[ini, fin]]
    # palabras del subtítulo
    mias = []  # (palabra, frase)
    for fi, frase in enumerate(t["texto"]):
        for w in frase.replace("\n", " ").split():
            mias.append((w, fi))
    ws = [w for w in palabras[t["clip"]] if ini - 1.5 <= w["d"] <= fin + 1.5]
    a = [norm(w) for w, _ in mias]
    b = [norm(w["t"]) for w in ws]
    anclas = [None] * len(mias)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                anclas[i1 + k] = (ws[j1 + k]["d"], (ws[j1 + k]["d"] + ws[j1 + k]["h"]) / 2)
    # tramo de cada palabra: el que contiene (o está más cerca de) su ancla; las que no tienen ancla heredan
    def tramo_de(anc):
        d, medio = anc
        for i, (sa, sb) in enumerate(segs):  # si el inicio de la palabra cae dentro de un tramo, es ese
            if sa <= d <= sb:
                return i
        # si no, el tramo más cercano al punto medio (el medio se corre menos que el inicio)
        # (un poco de preferencia por el tramo que viene: las palabras sueltas como "y" suelen abrir frase)
        return min(range(len(segs)), key=lambda i: 0 if segs[i][0] <= medio <= segs[i][1] else min(abs(medio - segs[i][0]) - 0.08, abs(medio - segs[i][1])))

    asig = [tramo_de(x) if x is not None else None for x in anclas]
    ultimo = 0
    for i, s in enumerate(asig):
        if s is None:
            asig[i] = ultimo
        else:
            s = max(s, ultimo)  # nunca retrocede
            asig[i] = s
            ultimo = s
    # capacidad: un tramo corto no puede cargar con más sílabas de las que caben (≥ 0,085 s cada una); lo que sobra
    # pasa al tramo siguiente
    for si in range(len(segs) - 1):
        idx = [i for i, s_ in enumerate(asig) if s_ == si]
        cap = max(1, int((segs[si][1] - segs[si][0]) / 0.085))
        while idx and sum(silabas(mias[i][0]) for i in idx) > cap and len(idx) > 1:
            asig[idx.pop()] = si + 1
    # reparto dentro de cada tramo por sílabas
    inicio = [0.0] * len(mias)
    final = [0.0] * len(mias)
    for si, (sa, sb) in enumerate(segs):
        idx = [i for i, s in enumerate(asig) if s == si]
        if not idx:
            continue
        pesos = [silabas(mias[i][0]) for i in idx]
        tot = sum(pesos)
        acum = 0
        for i, p in zip(idx, pesos):
            inicio[i] = sa + (sb - sa) * acum / tot
            acum += p
            final[i] = sa + (sb - sa) * acum / tot
    subs = []
    nf = len(t["texto"])
    for fi in range(nf):
        idx = [i for i, (_, f) in enumerate(mias) if f == fi]
        d = inicio[idx[0]] - ANTICIPO
        h = final[idx[-1]]
        subs.append([t["texto"][fi], d, h])
    # una frase que arranca justo antes de un tramo de voz (a menos de 0,45 s) arranca con él
    onsets = [sa for sa, _ in segs]
    for fi in range(1, nf):
        d = subs[fi][1]
        sig = [o for o in onsets if o >= d - 1e-6 and o - d <= 0.45]
        if sig and sig[0] > d + 0.02 and sig[0] > subs[fi - 1][1] + 0.3:
            subs[fi][1] = sig[0]
    # continuidad: una frase se queda hasta que arranca la siguiente si no hubo pausa larga entre ambas
    for fi in range(nf):
        d, h = subs[fi][1], subs[fi][2]
        if fi + 1 < nf:
            sig = subs[fi + 1][1]
            h = sig if sig - h < PAUSA_LARGA else h + RESPIRO
        else:
            h = min(h + RESPIRO, fin)
        subs[fi][1], subs[fi][2] = round(d, 2), round(max(h, d + 0.3), 2)
    t["subs"] = subs
    print(f"\n{t['clip']} [{ini}-{fin}] voz: {' '.join(f'[{a:.2f}-{b:.2f}]' for a, b in segs)}")
    for s in subs:
        print(f"   {s[1]:5.2f}-{s[2]:5.2f}  {s[0]!r}")

RAIZ.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
