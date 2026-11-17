# 2026-11-12_volto_ep2-inferencia

| Campo | Valor |
|---|---|
| Cliente / marca | VOLTO (`src/marcas/volto`) |
| Pieza | Serie "Quién es quién en el mundo de la IA" — episodio 2: inferencia |
| Estado | 🟢 Entregado v1 (2026-11-12) |
| Abierto | 2026-11-12 |
| Cerrado | — |

## Brief
- **Pedido:** editar el ep. 2 "con los mismos criterios" que el ep. 1 (`2026-11-06_volto_ep1-laboratorios-ia`, v5). El material llega **ya cortado** (`preview_ep2_solo-cortes_9x16.mp4`): no se recortan tomas, salvo muletillas.
- **Objetivo:** reels para las redes de Volto; serie educativa sobre los actores de la industria de la IA (AI Labs, inferencia, harness, tools).
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** — (sin personajes)
- **Luz de la escena:** —
- **Duración:** la del preview (55,9 s) + placa.
- **Tono / estilo:** criterios de Volto (`src/marcas/volto/CRITERIOS.md`) y lo del ep. 1:
  - subtítulos New Black 66 px, en seco, con alineación forzada (`scripts/alinear.py`) y cotejados con la voz; números en letras si así se dicen; sin muletillas;
  - voz limpia sin robotizar (DeepFilterNet 12 dB + 15 % del original + pasa-altos 70 Hz);
  - apertura: "QUIÉN ES QUIÉN / EN EL MUNDO DE LA IA" + ruleta que frena en **INFERENCIA**;
  - gráficos apoyados sobre la cabeza con aire (seguimiento de la cara), vidrio oscuro, un pop por gráfico;
  - placa de degradé que sube desde abajo, logo centrado + "PRÓXIMO EPISODIO" con la ruleta (sombra suave, chip elegido en naranja Volto).
- **Textos obligatorios:** "Quién es quién en el mundo de la IA".
- **Llamado a la acción:** — (la placa lleva solo el logo + próximo episodio).
- **Música:** ninguna (la pone el usuario).
- **Próximo episodio:** HARNESS (lo eligió el usuario, 2026-11-12).
- **Entrega:** `out/2026-11-12_volto_ep2-inferencia/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-11-12_volto_ep2-inferencia/preview_ep2_solo-cortes_9x16.mp4` (1080×1920, 30 fps, BT.709, H.264 + AAC, 55,9 s, 213 MB).
- **El preview sale del mismo original que el ep. 1** (`C:/Videos/crudos/2026-11-06_volto_ep1-laboratorios-ia/IMG_7203.MOV`), en dos tramos (`mapear_referencia.py` del ep. 1 → `datos/mapa_preview.json`): preview 0–3,77 s = original 71,53 s; preview 3,77–55,9 s = original t + 79,169 s (continuo; el "corte" del s 18,73 es solo un cambio de recorte).
- **Proxies y material de trabajo:** `public/trabajos/2026-11-12_volto_ep2-inferencia/` → `crudos/T65.mp4` (proxy del ep. 1 desde el s 65, 80 s), `audio/T65_original.wav`, `audio/voz.wav` (de T65), `audio/EP2_original.wav` (audio del preview: la alineación de subtítulos está en tiempo del preview y se pasa a T65 en `composiciones.tsx`).
- **Marca:** `public/marcas/volto/`

## Guiones
- `guion_ep2-inferencia.md` (pendiente)

## Decisiones
- **Plantilla:** `HablaSubtitulada` (composición `volto-ep2-inferencia`) + `GraficosEp2.tsx`, que reusa de `GraficosEp1.tsx` la ruleta (`Apertura`, `ProximoEpisodio`), los logos y el estilo vidrio.
- **Tomas (desde la v. B, sobre el original T65; la v. A usaba el preview tal cual):**
  1. 6,53–10,30 s "Lo que yo llamo… un gran player." — abierto (él contra el borde izquierdo: cualquier zoom lo corta).
  2. 17,94–57,77 s — abierto hasta la pausa antes de "Algunos…"; después el plano **acompaña la cara** (zoom 1,25 con `seguir`; el preview lo perdía de cuadro desde el s 4) hasta el s 11,75; desde ahí **abierto, sin movimiento de cámara** (pedido 2026-11-12: en la v. B había empuje en "inferencia" y seguimiento hasta el s 18,7). **Corte a plano cerrado quieto** (1,3, anclado en x 0,35 y 0,35, como el ep. 1) en "pero su servicio en esta industria" (pausa del s 32,4 del preview) hasta "De hecho," (s 40,7): vuelve al abierto antes de RAM/GPU/SSD/CPU. Termina tras "memoria RAM, en".
  3. 59,37–60,81 s "placa de video y también en" — sin "en… en…" (corte en la pausa, mismo plano abierto).
  4. 61,73–70,00 s "almacenamiento… en el mercado." — sin el segundo "en"; pausa de 0,4 s con ambiente para que suba la placa.
- **Subtítulos:** alineación forzada con `alinear_ep2.py` (texto revisado → `datos/al1-2.json`). Correcciones a Whisper: "Atropi" → **Anthropic**; "es memoria inferencia" → **"es proveedor inferencia"** (lo dictó el usuario, 2026-11-12, tal cual; en la v. A decía "pura"). Un solo "etc." en pantalla (el segundo se omite). "sí o sí te ofrecen" confirmado (sin "lo que" extra). Sin muletillas audibles: los huecos con voz no tienen habla fuera del texto (decodificación de wav2vec2 por hueco).
- **Voz:** `preparar_voz.sh` (igual que el ep. 1), +8 dB en el montaje.
- **Gráficos** (sobre la cabeza con 50 px de aire, `seguir_cara.py`; un pop por elemento):
  - 0–3,7 s: título + ruleta que frena en **INFERENCIA** (termina antes del corte del s 3,77);
  - 8,3–10,9 s: logos **OpenAI** y **Anthropic** (Simple Icons CC0; Anthropic de simple-icons@13.21.0), uno por nombre;
  - 12,96–17,9 s: tarjeta **INFERENCIA / COMO SERVICIO** de dos renglones con un rack que se arma y titila (la de la v. A: "me gustaba más"; en la B fue una píldora de un renglón);
  - 24,6–27,6 s: **PRECIO POR TOKEN**: "inferencia" se parte en tokens (in·fer·en·cia) y cada uno recibe su "$";
  - 34,95–37,7 s: **PROVEEDOR INFERENCIA** sola (sin "SU SERVICIO", v. C) en la píldora naranja de la ruleta; entrada animada: un punto cae con resorte, la píldora se estira con rebote, las palabras suben una por una con desenfoque y la cruza un brillo;
  - 42,4–50,6 s: **RAM ↑ GPU ↑ SSD ↑ CPU ↑**, una píldora por palabra, apoyada sobre la altura **habitual** de la cabeza (mediana), no la más alta ("bajalos, que no haya tanto aire").
  - Aire sobre la cabeza: 25 px (50 en la v. A). Los segundos son del preview.
- **Placa:** degradé que sube (pausa de 0,33 s tras "mercado": el preview termina ahí y queda el último cuadro bajo la placa), logo centrado + "PRÓXIMO EPISODIO" con la ruleta frenando en **HARNESS**, 5 s.
- **Música:** ninguna (la pone el usuario).

## Entregas
| Archivo (`out/2026-11-12_volto_ep2-inferencia/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `ep2-inferencia_9x16_v1.mp4` | 2026-11-12 | **Entrega.** Lo del borrador C + corte a plano cerrado quieto en "pero su servicio en esta industria" hasta "De hecho,". 58,7 s |
| `revision/borrador_ep2_9x16_C.mp4` (borrador) | 2026-11-12 | Sin movimiento de cámara desde el s 11 (ni seguimiento ni empuje; abierto); vuelve la tarjeta "INFERENCIA / COMO SERVICIO" de la v. A; "PROVEEDOR INFERENCIA" sola y con más animación de entrada. 58,7 s |
| `revision/borrador_ep2_9x16_B.mp4` (borrador) | 2026-11-12 | Sobre el original (no el preview): plano que acompaña la cara donde el preview lo perdía, empuje leve en "inferencia", sin "en… en… en" tras "memoria RAM" ni el "en" repetido antes de "almacenamiento", un solo "etc.", "proveedor inferencia" con su gráfico, gráficos más cerca de la cabeza. 58,7 s |
| `revision/borrador_ep2_9x16_A.mp4` (borrador) | 2026-11-12 | Primer borrador sobre el preview tal cual. 61,2 s, -14,0 LUFS, sin glitches |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-11-12_volto_ep2-inferencia/` desde `C:/Videos/archivo/2026-11-12_volto_ep2-inferencia/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/2026-11-12_volto_ep2-inferencia/`.
3. `npx remotion render src/index.ts volto-ep2-inferencia <tmp>.mp4 --crf=18` + `bash scripts/terminar_audio.sh`.
