# Alineación forzada del ep. 2 (scripts/alinear.py, wav2vec2) con el texto revisado contra la voz.
# Cada palabra es "pantalla" o "pantalla=fonética" (cómo suena en castellano, para el modelo).
# Revisado (2026-11-12): "Atropi" de Whisper → "Anthropic"; "es memoria inferencia" → "es pura inferencia"
# (cotejo CTC de wav2vec2 en 33,6–36 s: pura 51,8 · plena 52,8 · mera 60,7 · memoria 75,5; suena "p(u)ra (u)n") ⚠️ a confirmar.
# Salida: public/trabajos/<ID>/datos/al1.json, al2.json ([{palabra, ini, fin}], segundos del preview)
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-11-12_volto_ep2-inferencia/alinear_ep2.py
import json, subprocess, sys
from pathlib import Path

ID = "2026-11-12_volto_ep2-inferencia"
AUDIO = f"public/trabajos/{ID}/audio/EP2_original.wav"
DATOS = Path(f"public/trabajos/{ID}/datos")
PARTES = [
    (0.0, 26.45, """lo que yo llamo los proveedores de inferencia que este es un gran player=pleier no necesariamente
     hacen modelos de inteligencia artificial algunos puede ser que sí como OpenAI=openai y Anthropic=antropic pero lo
     que sí o sí te ofrecen es inferencia es inferencia como servicio que básicamente son racks=raks enormes edificios
     enormes de placas gráficas que te hostean=jostean un modelo propio o un modelo de un third=terd party=pari y te lo
     ofrecen a vos a un precio por token te lo venden por token"""),
    (26.4, 55.9, """pueden tener diferentes modelos de pricing=praisin te pueden hacer ahorro por comprar masivamente
     etc.=etcétera etc.=etcétera pero su servicio en esta industria es pura inferencia este te diría que es hoy en día
     uno de los más sólidos en todo este esquema de la industria porque está clarísimo de hecho por eso todos los
     aumentos en memoria RAM=ram en placa de video y también en almacenamiento en todo en la CPU=sepeu y lo que sea
     porque estos grandes proveedores están ganando todos le están poniendo plata ahí y están invirtiendo en tener su
     lugar en el mercado"""),
]
PY = sys.executable
for n, (desde, hasta, texto) in enumerate(PARTES, 1):
    pares = [(w.split("=")[0], w.split("=")[-1]) for w in texto.split()]
    salida = DATOS / f"al{n}.json"
    subprocess.run([PY, "scripts/alinear.py", AUDIO, " ".join(f for _, f in pares), "--desde", str(desde), "--hasta",
                    str(hasta), "--json", str(salida)], check=True, stdout=subprocess.DEVNULL)
    al = json.loads(salida.read_text(encoding="utf-8"))
    assert len(al) == len(pares), (len(al), len(pares))
    for p, (pantalla, _) in zip(al, pares):
        p["palabra"] = pantalla
    salida.write_text(json.dumps(al, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{salida}: {len(al)} palabras")
