# 2026-10-28_docba_r2-nov

| Campo | Valor |
|---|---|
| Cliente / marca | DOCBA (`src/marcas/docba`) |
| Pieza | r2-nov (Reel 2 NOV: cierres de año de equipos) |
| Estado | 🟡 En curso |
| Abierto | 2026-10-28 |
| Cerrado | — |

## Brief
- **Objetivo:** Reel 2 (pilar: loft social, experiencias y eventos). Dar a conocer los espacios para celebrar los cierres de año de equipos: ambiente cuidado + propuesta gastronómica variada. Host: equipo RASTRO (Lucía R o Lucía C). Guion original: `guion_original_r2.md` (copia de `Downloads/R2 NOV.md`).
- **Aclaración (2026-10-28):** la usuaria pegó el guion del Reel 4 (`guion_reel4_referencia.md`) pero la carpeta `1. R2 NOV` trae el material del Reel 2 (las voces dicen las frases del guion R2). Se confirmó: se arma el **Reel 2**. El material del Reel 4 está en `1. R4 NOV` (queda para otro trabajo; algunos planos de brindis de esa carpeta sirven de insert acá, "usar todo el contenido de Producciones").
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** no hay personaje animado (íconos de motion graphics en el segundo tramo).
- **Duración:** ~28 s + placa
- **Tono / estilo:** DOCBA (anfitriona, cálida, cómplice). Criterios: `src/marcas/docba/CRITERIOS.md` (lista de control de arranque).
- **Entrega:** `out/2026-10-28_docba_r2-nov/final/`

### Guion original (resumen)
| Tiempo | Imagen | Audio |
|---|---|---|
| 0–3" | Primer plano, host a cámara, tono cómplice | "¿Necesitás un espacio para cerrar el año con tu equipo? DOCBA es el lugar indicado" |
| 3–9" | Plano de seguimiento caminando; aparecen íconos: post-its (nacen), frustrada frente a la compu (obstáculos), equipo aplaudiendo (fin) | VO: "Hay proyectos que nacieron, otros que tuvieron obstáculos y otros que llegaron a su fin." |
| 9–11" | Brindis grupal en cámara lenta | VO: "Todos merecen una celebración." |
| 11–20" | Recorrido por los espacios; se sienta al terminar la frase; gira la cabeza para enganchar el plano siguiente | "En DOCBA tenemos espacios amplios, variedad gastronómica y un servicio con todas las comodidades…" |
| 20–24" | Short zoom. Host en la mesa servida | "Como en casa, pero sin lavar un plato." |
| 24–28" | Plano en la entrada, termina con zoom al cartel DOCBA | "Reservá tu fin de año en DOCBA, o simplemente pasen a brindar." |

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-28_docba_r2-nov/` (9 .MOV iPhone 4K + 2 .m4a; copiados de `Clientes/DOCBA/Producciones/1. R2 NOV`, tamaños verificados).
- **Proxies y material de trabajo:** `public/trabajos/2026-10-28_docba_r2-nov/` (crudos/, audio/, datos/). Los MOV de iPhone son de rango completo → `scale=in_range=full:out_range=limited`; los de 60/120 fps se pasaron a 30 fps a velocidad real.
- **Inserts:** `Clientes/DOCBA/Producciones/Inserts cámara/{Cava,Comida,Cowork,Loft,Reuniones}` y las carpetas de otros reels (`1. R4 NOV`: brindis a 120 fps para la cámara lenta).

### Crudos (voz medida con `scripts/alinear.py`)
| Archivo | Dur. | Contenido |
|---|---|---|
| IMG_9353 | 3,6 s (60 fps) | camina hacia cámara en el loft: "¿Necesitás un espacio para cerrar el año con tu equipo?" (1,02–3,26 s) |
| IMG_9356 | 2,75 s (60 fps) | cartel de neón DOCBA (sin voz útil) |
| IMG_9358 | 3,5 s | junto al neón: "DOCBA es el lugar indicado" (1,26–2,54 s) |
| IMG_9364 | 6,5 s | baja por la escalera caminando: "En DOCBA tenemos espacios amplios, variedad gastronómica y un servicio con todas las comodidades" (0,98–5,34 s) |
| IMG_9366 | 6,2 s (60 fps) | plano general bajando la escalera, misma frase (otra toma) |
| IMG_9368 / 9369 / 9370 | 3,9 / 5,5 / 3,7 s | frente a las estanterías: "Como en casa, pero sin lavar un plato" (9368: 1,28–2,88 s) |
| IMG_9394 | 5,2 s (120 fps) | frente a la fachada: "Reservá tu fin de año en DOCBA o simplemente pasen a brindar" (1,68–4,30 s) |
| `R2 NOV. 1.m4a` (VO) | 5,95 s | "Hay proyectos que nacieron, otros que tuvieron obstáculos y otros que llegaron a su fin." (0,76–5,00 s) |
| `R2 NOV. 2.m4a` (VO) | 3,8 s | "Todos merecen una celebración." (0,78–2,44 s) |

## Decisiones
- **Plantilla:** `ReelDocba` (+ íconos animados nuevos para "nacieron / obstáculos / fin").
- **Música:** pendiente (la elige la usuaria; no se pone hasta que la pase).
- **Otras:** no hay plano de "se sienta" en el material; el brindis grupal en cámara lenta sale de `1. R4 NOV` (IMG_9449/9450, 120 fps).

## Entregas
| Archivo (`out/2026-10-28_docba_r2-nov/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-28_docba_r2-nov/` desde `C:/Videos/archivo/2026-10-28_docba_r2-nov/` (si el trabajo está cerrado).
2. Regenerar audios con `preparar_voces.py` y los inserts con sus scripts.
3. `npx remotion render src/index.ts docba-r2-nov out/2026-10-28_docba_r2-nov/final/<salida>_vN.mp4 --crf=18`

## Borrador B (1.ª tanda, 2026-10-28) — 21,8 s sin placa final de 3,8 s → total ≈ 23,4 s
- **Estructura:** IMG_9353 ("¿Necesitás un espacio para cerrar el año con tu equipo?") → IMG_9358 ("DOCBA es el lugar indicado.") → VO 1 sobre IMG_9366 (seguimiento bajando la escalera) con tres íconos animados (`IconosProyecto.tsx`: post-its que nacen, laptop con carita triste, aplauso) en insignias de vidrio esmerilado → VO 2 "Todos merecen una celebración." sobre el brindis en cámara lenta (IMG_9450 de `1. R4 NOV`, 120 fps → 4× más lento, 2,4 s) → recorrido con IMG_9364 (ella bajando la escalera hablando) y cutaways de inserts durante su voz (loft C0171, mural C0172, mesa C0092, platos C0100, baristas C0141; sin sonido) → IMG_9368 "Como en casa, pero sin lavar un plato." con zoom corto → IMG_9394 con zoom suave al cartel DOCBA (hecho desde el 4K) → placa naranja "Reservá tu fin de año en DOCBA".
- **Sin música** (la usuaria no la pasó todavía). Subtítulos cortos con alineación forzada (`scripts/alinear.py`), verificados con `verificar_sync.py` (los que arrancan tras un hueco, ≤ 75 ms).
- **No hay en el material:** el plano en que se sienta al terminar la frase ni el giro de cabeza que engancha el plano siguiente (el guion los pedía); los íconos son motion graphics propios.

## Borrador C (2.ª tanda, 2026-10-28) — 24,3 s, −14,0 LUFS
Correcciones sobre el B:
1. **Después de "indicado" arranca la música sola con inserts (1 s)** y recién ahí entra "Hay proyectos…". Música nueva: `Clientes/DOCBA/Música/momotmusic-coffee-time-393723.mp3` (103 bpm; el primer pulso fuerte cae en el corte al pizarrón; baja a fondo bajo las voces y sube en la placa).
2. **De "Hay proyectos" a "celebración" todo con inserts arriba:** loft (C0162) → pizarrón (C0039, "nacieron") → frente a la compu (C0014, "obstáculos") → festejo (C0042, "su fin") → brindis en cámara lenta (R4). Los íconos siguen encima.
3. **Recorrido:** 3 inserts más largos (1,2–1,3 s) hasta "comodidades": loft amplio (C0171), croissant con palta y huevo (C0126, nuevo: ya no se repiten C0092/C0100 de R3), baristas (C0141). Se sacaron mural, mesa y platos.
4. **Color:** loft con receta "vivo" (contraste y negros reales; el "claro" levantaba las sombras y lo dejaba nuboso) + clips de la host con `_col` (curva global + contraste +4 %, saturación +16 %, vibrance suave). Script: `preparar_inserts2.py`.
5. **Último plano (entrada) sin zoom** (`IMG_9394_col`).

## Borrador D (3.ª tanda, 2026-10-28) — 24,3 s, −14,0 LUFS
Correcciones sobre el C:
1. **Motion graphics de apertura** (`IconosProyecto.tsx`: `espacio`, `calendario`, `equipo`; insignias de vidrio) sobre "un espacio / cerrar el año / con tu equipo". Se sacaron los íconos de nacieron/obstáculos/fin (desde el 0:05).
2. **Color de inserts natural** (`preparar_inserts2.py`, receta "suave", sin subir la luz: la luz levantada se veía granulada): loft de apertura (0:04), pizarrón (0:06, **sin estabilizar**: se veía gelatinoso), baristas (0:15, ya no sepia).
3. **Tomas elegidas por la usuaria:** 0:07 → Cowork C0004; "un espacio amplio" → Loft C0119 desde el 0:02 (subtítulo corregido: "un espacio amplio,"); "variedad gastronómica" → Comida C0083 desde el 0:02.
4. **"Como en casa…":** `IMG_9368_luz.mp4` rehecho desde el 4K (reducción de ruido leve + curva que sube medios, sin granito).

## Borrador E (2026-10-28)
Corrección de criterio: **no tocar el color si se pide "original"**. Inserts (loft, pizarrón, compu, loft amplio, comida, baristas) y clips de la host sin ningún filtro de color (solo giro/escala/fps; RIFE en la comida); `IMG_9368_luz` solo con una curva que sube un poco los medios y reducción de ruido leve. Se sacaron los motion graphics del principio. Pendiente: la usuaria subió un video horizontal para girar a vertical (no se encontró el archivo).

## Borrador F (2026-10-28)
Antes del loft de apertura va C0021 (Cowork, desde el 0:03, 1 s; la música sola dura ahora ~2 s); el pizarrón se reemplazó por C0035 y el festejo ("su fin") por C0007; sin motion graphics del inicio; "Como en casa…" con más luz (curva de medios 0,5→0,63, desde el 4K con reducción de ruido leve). Pendiente: video horizontal que la usuaria subió (no se encontró el archivo).

## Borrador G (2026-10-28)
La voz "Hay proyectos…" arranca apenas termina el primer insert (C0021, que queda solo con la música); se sacó el insert de teclado C0004 (C0007 cubre "obstáculos… su fin"); loft "un espacio amplio" (C0119) en horizontal escalado a 1080 de ancho con fondo desenfocado de la misma toma y algo más de luz; baristas con más luz (curva de medios, desde el 4K, reducción de ruido leve). Script: `preparar_inserts3.py`.

## Borrador H (2026-10-28)
Música desde el primer cuadro (bajita bajo la host, sube con el primer insert y baja bajo las voces; compás alineado al corte al segundo insert). Inserts entre el 0:04 y el 0:09 parejos (~1,15 / 1,34 / 1,4 / 1,56 s; la voz arranca al terminar el primero). C0021 enderezado (~1,5°) y recortado 6 %. Loft "un espacio amplio" (C0119) grande: recorte 9:16 del alto completo del 4K, sin fondo desenfocado. Script: `preparar_inserts3.py`.

## Borrador I (2026-10-28)
"Como en casa, pero sin lavar un plato." pasó a dos inserts de Producciones (color original): C0084 (mesa servida) y C0127 (tostón con jamón), con la voz de IMG_9368. Primeros inserts (C0021, C0162, C0035) y el tostón: RIFE sobre el 24p + estabilización leve (vidstab smoothing 5) por "trabados"; el C0127 tiene temblor alto (0,47) aun en su mejor ventana.

## R2 editado por la usuaria (2026-10-29)
La usuaria rehízo el montaje en otro programa (color e inserts propios: `Clientes/DOCBA/Reels finales/r2.mp4`, 25 s). Sobre ese video: subtítulos (alineación forzada sobre su audio, `datos/alin_r2.json`), y la placa desde el 21,37 s (apenas termina "brindar", 21,26 s). Audio de ella (voz + música) normalizado a −14 LUFS. Composición `docba-r2-nov-editado`; base `crudos/r2_base.mp4`.

| Archivo (`out/2026-10-28_docba_r2-nov/final/`) | Fecha | Cambios |
|---|---|---|
| `r2-nov-editado_9x16_v1.mp4` | 2026-10-29 | Subtítulos + estabilización leve + placa; sin glitches, −14,1 LUFS |
| `r2-nov-editado_9x16_v2.mp4` | 2026-10-29 | **Sin estabilización** (la v1 dejó gelatinosos los inserts de 0:06, 0:08, 0:09 y 0:10; además la v1 estabilizaba 4,33/6,43/8,43/9,73 s, no 14,10/14,67 como se dijo). Placa sobre la chica (variante `sobreVideo`: velo azul petróleo + logo hueso), con el último cuadro estirado y empuje lento porque el video de la usuaria queda negro desde 0:21,8. −14,1 LUFS, sin glitches |
| `r2-nov-editado_9x16_v3.mp4` | 2026-10-29 | Placa de la v1 (panel naranja que sube, logo hueso) pero con el video de ella debajo (último cuadro estirado con empuje): el panel barre sobre la imagen, sin rectángulo negro. Sin estabilización |
| `r2-nov-editado_9x16_v4.mp4` | 2026-10-29 | La música sube cuando sube la placa (en su mezcla quedaba a −36 LUFS): se suma `musica_full.wav` en fase con la de ella (desfase 1,167 s, correlación 0,987), volumen 0,33 desde el 21,2 s y fundido al final. Resto igual que la v3 |

## R2 editado — correcciones de la 2026-10-30 → borrador J (`revision/borrador_r2-nov_9x16_J.mp4`, 25 s, −14,1 LUFS)
1. **Sin subtítulos en el primer plano** (0–2,6 s: "¿Necesitás un espacio para cerrar el año con tu equipo?"). Los cortes del video de la usuaria están en 2,60 / 4,33 / … / 18,57 / 21,8 s.
2. **Zoom in leve en el 2.º plano** ("DOCBA es el lugar indicado.", 2,60–4,33 s) durante toda su duración: el clip base se parte en los cortes y ese tramo lleva `empuje` con `push: ZOOM_LEVE` (0,05 = 5 % al final del plano; nueva opción `push` de `ClipDocba`).
3. **Voz en off sin ruido de fondo (4,3–11,8 s):** DeepFilterNet con tope de 12 dB sobre ese tramo del audio de la usuaria (`audio/r2_editado_dn.wav`), 85 % procesado + 15 % original y fundidos de 0,15 s, para que la voz no suene a robot. Piso de ruido entre palabras medido en el render final: −24,4 → −31,8 dB (7,4 dB menos), picos de la voz iguales. Si queda ruido, subir a 18 dB (probado: −46,8 dB en el audio crudo, más agresivo).
4. **Zoom in leve en el último plano** ("Reservá tu fin de año…", 18,57–21,8 s) durante toda su duración (mismo `ZOOM_LEVE`); la cola de la placa (`r2_cola`) sigue desde 1,05 con otros 5 % para que no haya salto de escala.

## R2 editado — 2.ª tanda del 2026-10-30 → borrador K (`revision/borrador_r2-nov_9x16_K.mp4`, 25 s, −14,1 LUFS)
1. **2.º video** (2,60–4,33 s): acercamiento de plano más marcado, 16 % al final del plano (antes 5 %), hacia la cara de ella (origen 50 % 30 %).
2. **Flash** (el del CEI, `flashes`) en el corte del 2.º al 3.er video, 4,33 s. ⚠ Interpretación: la usuaria dijo "entre el segundo 3 y 4" y en el video no hay ningún corte entre 3 y 4 (los cortes son 2,60 y 4,33); su cuenta va ~0,3–1 s atrasada respecto de la mía (en R1 "6 a 7" era el corte de 7,05 s y "17 a 18" el de 18,57 s), así que se usó el corte de 4,33 s.
3. **Efecto "parecido al flash, pero no igual"** (`destellos`, `BarridoLuz` en `flashLuz.tsx`) en el corte al último video, 18,57 s: una banda de luz cálida (blanco-naranja) cruza la imagen de izquierda a derecha con una exposición suave, sin desenfoque ni zoom ni velo (el flash sí los lleva).
4. **Último video** (18,57–21,8 s): acercamiento notorio y gradual, 15 % durante todo el plano (antes 5 %), con origen arriba (50 % 25 %) para que el cartel DOCBA no se corte; la cola bajo la placa sigue desde ese zoom.

## R2 editado — 3.ª tanda del 2026-10-30 → borrador L (`revision/borrador_r2-nov_9x16_L.mp4`, 25 s, −14,1 LUFS)
1. El corte al último video usa el **flash normal** (`flashes: [4,3333, 18,5667]`); el destello de banda cálida se probó y se descartó (el código queda en `flashLuz.tsx`).
2. **Acercamiento del último video bien centrado** (origen 50 % 50 %, 15 % al final): la línea naranja superior del edificio se va hacia arriba y sale del cuadro; la cola bajo la placa sigue con el mismo origen.
3. **Control de empalmes** (pedido de la usuaria: "que no haya glitch entre video y video"): `tmp/seams.py` compara cuadro a cuadro el render con el video de ella; sin cuadros negros, sin cuadros duplicados y sin saltos nuevos salvo los picos de los dos flashes (cuadros 129 y 556, a propósito) y el barrido de la placa (653, igual que en la v4). Los cortes partidos para el zoom (2,60 / 4,33 / 18,57 s) caen en los cortes originales y cada tramo arranca en escala 1,0 (o en 1,15 la cola, que continúa el último plano), así que no hay saltos de escala. Cuadros de los dos flashes revisados uno por uno (suben, el corte cae en el pico, bajan).

## R2 editado — 4.ª tanda del 2026-10-30 → borrador M (`revision/borrador_r2-nov_9x16_M.mp4`, 25 s, −14,1 LUFS)
1. **Zoom del último video centrado y con el rectángulo naranja entero:** en el borrador L el zoom del 15 % cortaba el rectángulo del edificio (ocupa 87 % del ancho: a 1,15× ya pasaba el borde) y, como la cámara en mano se corre ~2 % a la izquierda, se pegaba al borde izquierdo ("muy a la izquierda"). Ahora el acercamiento llega al 10 % (el máximo con el que el rectángulo queda entero, márgenes de ~2,5 %) y `centrar_ultimo.py` mide el centro del rectángulo cuadro a cuadro y lo mantiene en el centro de la pantalla con un desplazamiento horizontal (`desplazaX` de `ClipDocba`, hasta 23 px). La línea superior naranja sube en el cuadro a medida que se acerca. El tramo bajo la placa queda en 1,10 sin más acercamiento.
2. **Empalmes entre planos controlados otra vez** (`tmp/seams.py` contra el video de la usuaria): sin cuadros negros ni duplicados; saltos solo en los dos flashes (a propósito) y en el barrido de la placa. El detector marca además "flash" en 1,10 s, que también está en el original (movimiento de cámara).
| `r2-nov-editado_9x16_v5.mp4` | 2026-10-30 | **Entrega v5** (1080×1920, 30 fps, 25 s, −14,1 LUFS, CRF 18). Igual al borrador M: 1.er plano sin subtítulos; 2.º plano con acercamiento de plano del 16 % hacia la cara; flash en los cortes de 4,33 s y 18,57 s; último plano con acercamiento centrado del 10 % (rectángulo naranja entero); voz en off de 4,3 a 11,8 s sin ruido de fondo (DeepFilterNet 12 dB, 85 % procesado). Empalmes controlados contra el video de ella: sin negros ni duplicados. |

## R2 editado — correcciones del 2026-11-04 → borrador N (`revision/borrador_r2-nov_9x16_N.mp4`, 24,17 s, −14,1 LUFS, sin glitches)
Composición nueva `docba-r2-nov-editado6` (la v5 queda reproducible con `docba-r2-nov-editado`). Referencia de la usuaria: `Downloads/R2 NOV DOCBA V1.mp4` (= v5 + textos del primer plano + 3 efectos de sonido).
1. **"Como en casa, pero sin lavar un plato." como voz en off, pegada a "comodidades":** se sacan 25 cuadros (0,83 s) de silencio. La música de su mezcla es `musica_full.wav` × 0,077 (desfase 1,167 s − 16 muestras, residuo −60 dB): `audio_vo_casa.py` separa la voz, corta el silencio y vuelve a sumar la música continua (sin salto de compás) → `audio/r2_editado_v6.wav`. Todo lo que sigue se adelanta 0,83 s (último plano 17,73 s, placa 20,54 s).
2. **Sin la chica en ese tramo:** C0165 (pareja charlando junto a la ventana, "Como en casa,", 15,90–16,67) y C0164 (barra con la barista, "pero sin lavar un plato.", 16,67–17,73), de `Inserts cámara/Loft`, girados (`transpose=2`), color original, sin sonido. Se fueron también el insert del mural y el plano de ella.
3. **Textos del primer plano como en su V1:** Gabriella Heavy naranja, 107 px, fijos (centro a 590 px), en seco, 1 o 2 renglones ("para / cerrar", "con tu / equipo?"); nuevas opciones `centroY`, `tam`, `interlineado` y renglones con salto de línea en `RotuloDocba`.
4. **Efectos de sonido de su V1:** extraídos restando la v5 (`audio/sfx_flash1.wav`, `sfx_flash2.wav`, `sfx_placa.wav`): antes del flash de 4,33 s, antes del flash del último plano y al entrar la placa.

| `r2-nov-editado_9x16_v6.mp4` | 2026-11-04 | **Entrega v6** (1080×1920, 30 fps, 24,17 s, −14,1 LUFS, CRF 18, sin glitches). Igual al borrador N + la virgulilla de la ñ de "el año" más gruesa (copia de la ñ con trazo de 7 px recortada a la franja de arriba: opción `ene` de `RotuloDocba`). Composición `docba-r2-nov-editado6`. |
| `r2-nov-editado_9x16_v7.mp4` | 2026-11-04 | **Entrega v7** (24,17 s, −14,1 LUFS, sin glitches). Igual a la v6, con los dos inserts del loft (C0165 "Como en casa," y C0164 "pero sin lavar un plato.") con más luz: rehechos desde el 4K con gamma 1,45 / 1,6, saturación +4 % y reducción de ruido leve (`crudos/ins_c0165_luz`, `ins_c0164_luz`); luz media en el render 80 → 108 y 67 → 109, al nivel de los inserts vecinos. |
| `r2-nov-editado_9x16_v8.mp4` | 2026-11-04 | **Entrega v8** (24,17 s, −14,1 LUFS, sin glitches). Los dos inserts del loft (C0165, C0164) "no tan grises y estabilizados": `inserts_casa.sh` desde el 4K → vidstab en dos pasadas (smoothing 12, zoom fijo 4 %, optzoom 0; temblor 0,28 → 0,04 y 1,17 → 0,11, el paneo de C0164 se conserva) + gamma 1,35 / 1,55, curva con negros firmes, saturación 1,2 / 1,28 y vibrance; a C0164 (cemento gris) un toque cálido. Reducción de ruido leve. |
