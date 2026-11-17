# 2026-11-06_volto_ep1-laboratorios-ia

| Campo | Valor |
|---|---|
| Cliente / marca | VOLTO (`src/marcas/volto`) |
| Pieza | Serie "Quién es quién en el mundo de la IA" — episodio 1: laboratorios de IA |
| Estado | 🟢 Entregado v5 (2026-11-12) |
| Abierto | 2026-11-06 |
| Cerrado | — |

## Brief
- **Pedido:** replicar el reel de referencia `ep1-laboratorios-ia_9x16_v2.mp4` (armado en la otra PC; su trabajo no llegó al repo porque la PC se quedaba sin batería) desde el original `IMG_7203.MOV`, con estas correcciones:
  1. subtítulos que no dicen lo mismo que la voz → corregirlos;
  2. audio mejorado **sin que suene robótico**;
  3. gráficos arriba de la cabeza con un **leve aire** (en la v2 algunos quedan pegados al margen de arriba);
  4. "Quién es quién en el mundo de la IA" en **dos renglones y más grande** (no se lee);
  5. el primer gráfico (chips que se desplazan) tiene que ser una **ruleta**: los ítems giran hasta frenar en el elegido (AI Labs) y queda solo ese en pantalla;
  6. placa final **solo con el logo**.
- **Objetivo:** reels para las redes de Volto; serie educativa sobre los actores de la industria de la IA (AI Labs, inferencia, harness, tools).
- **Formato(s):** 9:16 1080×1920 · 30 fps.
- **Modo de animación:** — (sin personajes)
- **Duración:** como la referencia (48,9 s con la placa).
- **Tono / estilo:** criterios de Volto (`src/marcas/volto/CRITERIOS.md`) + el diseño de la referencia (chips, tarjeta "Objetivo", logos de los modelos, curvas "Benchmark").
- **Textos obligatorios:** "Quién es quién en el mundo de la IA".
- **Llamado a la acción:** — (la placa lleva solo el logo).
- **Entrega:** `out/2026-11-06_volto_ep1-laboratorios-ia/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-11-06_volto_ep1-laboratorios-ia/` → `IMG_7203.MOV` (iPhone vertical, 1080×1920 con rotación, 60 fps, BT.709 SDR, 7:09,6) y la referencia `ep1-laboratorios-ia_9x16_v2.mp4` (1080×1920, 30 fps, 48,9 s).
- **Proxies y material de trabajo:** `public/trabajos/2026-11-06_volto_ep1-laboratorios-ia/` (crudos/IMG_7203.mp4 a 30 fps; audio/IMG_7203_original.wav).
- **Marca:** `public/marcas/volto/`

## Estructura de la referencia (v2 de la otra PC)
| Salida | Contenido |
|---|---|
| 0–~2 s | Título "Quién es quién en el mundo de la IA" (chico, un renglón) + chips Harness / Tools / AI Labs / Inferencia que se desplazan; termina con AI Labs en naranja |
| ~25–29 s | Tarjeta oscura "OBJETIVO / CONSTRUIR MODELOS" con ícono de red neuronal (pegada arriba) |
| ~31–35 s | Logos Gemini, GPT, Claude, Kimi, uno por nombre |
| ~36–42 s | "BENCHMARK: LA CARRERA POR LA CIMA": curvas con los cuatro logos compitiendo |
| ~44–49 s | Placa de degradé: "Próximo capítulo", chips, logo, "Proveedores de inferencia", @volto.ai → **ahora solo el logo** |

## Guiones
- `guion_ep1-laboratorios-ia.md`

## Decisiones
- **Plantilla:** `HablaSubtitulada` (composición `volto-ep1-laboratorios-ia`, `composiciones.tsx`) + gráficos propios en `GraficosEp1.tsx` (van como hijo del componente `Ep1`, no en las props: Remotion las serializa).
- **Cortes:** los 4 tramos de la v2 (`mapear_referencia.py`, correlación de audio) cortados en los huecos de la voz: 0,98–6,00 + 6,40–10,45 (sin el "ehh", v5) / 26,95–31,56 / 32,30–36,73 / 38,95–64,10 s del original (dice dos veces "que son estas marcas": se usa la segunda, como la v2).
- **Subtítulos:** alineación forzada (`scripts/alinear.py` → `datos/al1-3.json`), New Black 66 px, en seco. Corregido: "no trabajan tanto a nivel de **ofrecer** inferencia" (la v2 decía "a nivel de inferencia"). Gemini/GPT/Claude/Kimi también con subtítulo (pedido del usuario en la v2, aunque estén los logos). ⚠️ A confirmar: "y estoy pensando bastante tiempo" (¿"estuve"?) y "ofrecer inferencia" (Whisper oye "ofrección e inferencia").
- **Voz:** `preparar_voz.sh` (DeepFilterNet 12 dB con la entrada a -6 dB + 15 % del original + pasa-altos 70 Hz), +8 dB en el montaje.
- **Gráficos:** apoyados sobre la cabeza con 50 px de aire (seguimiento de la cara, `seguir_cara.py`; pelo = 0,55 del alto de la cara), en el plano abierto. Título en dos renglones (66 px). Ruleta: 4 vueltas en 50 cuadros con ease-out y desenfoque según la velocidad, frena en AI LABS (naranja, pop) y los demás se desvanecen. Logos de Simple Icons (CC0; OpenAI de la v13).
- **Música:** Deep Techno Ambience (Mixkit 134, como la radio), -25 dB bajo la voz y -6 dB en la placa (`preparar_musica.sh`).
- **Placa:** degradé con el logo centrado y, desde la v3 (2026-11-12), "Próximo episodio" + ruleta que frena en INFERENCIA arriba (`ProximoEpisodio`, `PROXIMO_BASE` 720), 5 s; antes solo el logo, 4 s, que **sube animada** desde abajo (14 cuadros) sobre el último plano; la última toma tiene `pausaMs` 470 con ambiente de 62,35 s para que no tape "publicarlo".
- **Planos (pedido del usuario):** pocos cambios de tamaño; planos cerrados quietos, sin seguir la cara ni empujes; entre tomas de la misma frase se corta solo el silencio, en el mismo plano.
- **Música:** ninguna en la entrega (2026-11-06: "después la pongo yo"); `preparar_musica.sh` queda sin uso.

## Entregas
| Archivo (`out/2026-11-06_volto_ep1-laboratorios-ia/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `ep1-laboratorios-ia_9x16_v5.mp4` | 2026-11-12 | Subtítulos: "se está **reorganizando**", "pasó con los **dos mil**" (en letras), "**está en los** laboratorios" (sin "que"). Sin la muletilla "y… ehh" después de "dos mil" (6,00–6,40 s del original; la toma 1 se parte y el corte cae en el cambio al plano cerrado): "estuve pensando". 48,7 s |
| `ep1-laboratorios-ia_9x16_v4.mp4` | 2026-11-12 | Placa: sombras de la ruleta y del título mucho más suaves (`sombraSuave`); el chip elegido (INFERENCIA) en el **naranja de Volto**, como en la apertura |
| `ep1-laboratorios-ia_9x16_v3.mp4` | 2026-11-12 | Placa final con "PRÓXIMO EPISODIO" + la ruleta de la apertura (frena en INFERENCIA, pop al frenar) en el tercio superior, logo centrado. Placa de 4 → 5 s. Capa nueva `sobreCierre` en HablaSubtitulada. 49,1 s, -14,0 LUFS, pico -1,5 dBFS, sin glitches |
| `ep1-laboratorios-ia_9x16_v2.mp4` | 2026-11-06 | **Entrega.** "Gemini, GPT, / Claude, Kimi." con subtítulos (en la v1 no tenían porque estaban los logos). 48,1 s, -14,0 LUFS, sin glitches |
| `ep1-laboratorios-ia_9x16_v1.mp4` | 2026-11-06 | **Entrega.** Lo del borrador C + la placa (solo el logo) sube animada desde abajo sobre el último plano (`cierre.sube` de HablaSubtitulada, nuevo), en una pausa de 0,47 s con ambiente tras "publicarlo". Sin música (la pone el usuario). 48,1 s, -14,0 LUFS, pico -1,5 dBFS, sin glitches |
| `revision/borrador_ep1_9x16_C.mp4` (borrador) | 2026-11-06 | Pedidos del usuario: "y **estuve** pensando"; "**que está en los** laboratorios de IA"; menos cambios de tamaño de plano (sin el corte al abierto del s 8 ni el del s 14,8 ni el de "laboratorios"); la toma 3 llega hasta que se apaga "IA" (36,73 → 36,86 s) y la 4 sigue en el mismo plano, con la voz desde el primer cuadro (38,95 → 39,09 s); sin el pop del benchmark (s 30). -14,0 LUFS, sin glitches |
| `revision/borrador_ep1_9x16_B.mp4` (borrador) | 2026-11-06 | Subtítulos tal cual lo dice (cotejo CTC de wav2vec2 entre variantes): "está en nuevos laboratorios", "sobre todo las marcas chinas", "o en laboratorios más chicos", "tanto en el nivel de producto"; planos cerrados quietos (sin `seguir`: en el s 17 el encuadre se deslizaba) y corte seco en "laboratorios de IA" en vez del empuje; sin música (la pone el usuario). -14,0 LUFS, sin glitches |
| `revision/borrador_ep1_9x16_A.mp4` (borrador) | 2026-11-06 | Réplica de la v2 con las 6 correcciones del brief. 43,6 s + placa de 4 s, -14,0 LUFS, pico -1,4 dBFS, sin glitches |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-11-06_volto_ep1-laboratorios-ia/` desde `C:/Videos/archivo/2026-11-06_volto_ep1-laboratorios-ia/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/2026-11-06_volto_ep1-laboratorios-ia/`.
3. `npx remotion render src/index.ts <id-composición> <tmp>.mp4 --crf=18` + `bash scripts/terminar_audio.sh`.
