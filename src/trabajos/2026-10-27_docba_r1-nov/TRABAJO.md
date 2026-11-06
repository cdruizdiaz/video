# 2026-10-27_docba_r1-nov

| Campo | Valor |
|---|---|
| Cliente / marca | DOCBA (`src/marcas/docba`) |
| Pieza | R1 NOV (primer reel de noviembre) |
| Estado | 🟡 En curso |
| Abierto | 2026-10-27 |
| Cerrado | — |

## Brief
- **Objetivo:** reel de Instagram: presentar DOCBA (loft social en Nueva Córdoba: cafetería, cowork, eventos y cava) como un lugar donde quedarse ("todo pasa bajo un mismo techo"). Pilar de contenido: gastronomía + loft.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** no lleva personajes animados.
- **Luz de la escena:** —
- **Duración:** por definir según el guion (~30–40 s).
- **Tono / estilo:** cálido con criterio, ingenioso, anfitriona (ver `src/marcas/docba/CRITERIOS.md`). Subtítulos en blanco, IBM Plex Sans.
- **Textos obligatorios:** en pantalla, "También, si sos de nuestros clientes gluten free, encontrás productos sin TACC".
- **Llamado a la acción:** "Te esperamos en DOCBA".
- **Entrega:** `out/2026-10-27_docba_r1-nov/final/`

### Guion (orden dado por la usuaria)
1. Host (agitada, apurada, a cámara): "¿Por qué andar con un café en la mano de un lado para otro, si podés entrar y…"
2. Transición: ruido de la calle → ruido ambiente de DOCBA.
3. (respira y mira a cámara) "…dejar que pasen las horas." Medio segundo de silencio y entra la música.
4. Host: "En DOCBA, tenés espacio de sobra para estar cómodo y una carta que no se parece a ninguna."
5. VO (con inserts de cada plato, carpeta `Inserts cámara/Comida`): "Encontrás productos como matcha latte, croissant de poché y guacamole, tostón proteico de masa madre… y cuando se acerca la noche, aparece la copa de vino."
6. Texto: "También, si sos de nuestros clientes gluten free, encontrás productos sin TACC."
7. Host: "Podés elegir lo que más te guste, y no hace falta que estés a las corridas. Te esperamos en DOCBA."
8. Placa final: logo DOCBA según manual, en motion graphic.

Notas de la usuaria: hay dos opciones de arranque (elegir la mejor por duración) y dos para el segundo clip (de frente o por el costado; elegir por narrativa). Los inserts vienen rotados y hay que voltearlos a medida que se usan.

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-27_docba_r1-nov/` (8 .MOV iPhone 4K + 2 .m4a; copiados de `Clientes/DOCBA/Producciones/1. R1 NOV`). Inserts de cámara (Sony, MP4 grandes): se usan directo de `Clientes/DOCBA/Producciones/Inserts cámara/{Comida,Cowork,Loft,Reuniones,Cava}`; solo los elegidos se copian y se hacen proxy.
- **Proxies y material de trabajo:** `public/trabajos/2026-10-27_docba_r1-nov/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/docba/` (logo SVG por letra en `src/marcas/docba/logo.json`, fuentes IBM Plex)

### Crudos (ffprobe)
Todos 3840×2160 con rotación −90° (vertical), 29,97 fps → proxies 1080×1920 30 fps.
| Archivo | Duración |
|---|---|
| IMG_9324 | 7,54 s |
| IMG_9326 | 8,91 s |
| IMG_9330 | 7,77 s |
| IMG_9332 | 7,27 s |
| IMG_9338 | 6,40 s |
| IMG_9347 | 6,04 s |
| IMG_9395 | 10,14 s |
| IMG_9398 | 3,77 s |
| R1 NOV. 1.m4a | 9,02 s (→ `audio/voz_1.wav`) |
| R1 NOV. 2.m4a | 5,87 s (→ `audio/voz_2.wav`) |

## Guiones
- `guion_r1-nov.md` (generar con `/guion 2026-10-27_docba_r1-nov`; aplicar cambios con `/aplicar-guion`)

## Decisiones
- **Plantilla:** `ReelDocba`.
- **Música:** ver "Decisiones (2026-10-27)".
- **Otras:** el manual pide Gabriella Heavy para titulares (no entregada; el logo va vectorizado). Subtítulos: blancos, IBM Plex Sans.

## Entregas
| Archivo (`out/2026-10-27_docba_r1-nov/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-27_docba_r1-nov/` desde `C:/Videos/archivo/2026-10-27_docba_r1-nov/` (si el trabajo está cerrado).
2. `npx remotion render src/index.ts <id-composición> out/2026-10-27_docba_r1-nov/final/<salida>_vN.mp4 --crf=18`

## Qué hay en cada crudo (Whisper, 2026-10-27; transcripciones en `datos/t_*.json`)
| Crudo | Contenido |
|---|---|
| IMG_9324 (7,5 s) | Arranque A: "¿Por qué andar con tu café de un lado para el otro si podés entrar?" (voz 0,6–5,5 s) |
| IMG_9326 (8,9 s) | Arranque B: misma frase (voz 0,8–7,3 s) → más lenta; **A es la más corta** |
| IMG_9330 (7,8 s) | "…y dejar que pasen las horas." (3,9–5,4 s) — segundo clip, opción 1 |
| IMG_9332 (7,3 s) | "…y dejar que pasen las horas." (2,7–4,5 s) — segundo clip, opción 2 |
| IMG_9338 (6,4 s) | "En DOCBA tenés espacio de sobra…" (1,1–5,8 s), dicho bien |
| IMG_9347 (6,0 s) | Misma frase, Whisper oyó "En Dogma" (¿pronunciación?) → revisar antes de usar |
| IMG_9395 (10,1 s) | "Podés elegir lo que más te guste y no hace falta que estés a las corridas" (con una falsa partida al inicio) |
| IMG_9398 (3,8 s) | "…y te esperamos en DOCBA." (0,7–2,1 s) |
| voz_1.wav (9,0 s) | VO: matcha latte, croissant de poché y guacamole, tostón proteico de masa madre (0–5,3 s) + "cuando se acerca la noche aparece la copa de vino" (5,3–9,0 s) |
| voz_2.wav (5,9 s) | VO: "También, si sos de nuestros clientes gluten free, encontrás productos sin TACC" |

## Inserts elegidos (Sony, 3840×2160 a 24p, filmados en vertical → se voltean con `transpose=2`; proxies `crudos/ins_C<nnnn>.mp4` de una ventana de cada toma, sin audio)
| Palabra de la VO | Toma | Ventana (s del original) |
|---|---|---|
| matcha | Comida/C0049 (batiendo el matcha) | 8–13 |
| latte | Comida/C0050 (café + matcha helado) | 0,5–5,5 |
| croissant de poché | Comida/C0126 (tenedor abre el huevo poché) | 0,5–6,5 |
| guacamole | Comida/C0064 (croissant con guacamole) | 0,3–5,3 |
| tostón proteico de masa madre | Comida/C0079 (tostón de pollo con parmesano) ⚠️ confirmar que es el "tostón proteico" (también hay uno de jamón crudo: C0066–C0070) | 0,5–5,5 |
| cuando se acerca la noche | Loft/C0136 (cartel DOCBA encendido) + Cava/C0161 | 0,5–5,5 / 1–7 |
| la copa de vino | Comida/C0129 (copas de rosado con tabla) | 0,5–5,5 |
| sin TACC (texto) | Comida/C0100 (mesa con varios platos) | 3–9 |

## Decisiones (2026-10-27)
- **Plantilla nueva:** `src/plantillas/ReelDocba/` (clips + pistas de audio + subtítulos + placa `PlacaDocba`), reutilizable en los próximos reels del cliente; se arma con las listas de `composiciones.ts`. Composiciones: `docba-r1-nov` (completa) y `docba-r1-nov-cortes` (sin subtítulos).
- **Arranque:** IMG_9324 (la más corta). **Segundo clip:** IMG_9332 (de frente, mira a cámara con la taza; el guion dice "respira y mira a cámara"), no IMG_9330 (por el costado).
- **Pausas sacadas con corte seco (por la energía de la voz):** 2,2 s entre "¿Por qué" y "andar" (IMG_9324) y 1 s antes de "carta" (IMG_9338). ⚠️ Confirmar que la usuaria quiere los dos saltos.
- **Colores:** los MOV del iPhone son de rango completo (`yuvj420p`): proxies rehechos con `scale=in_range=full:out_range=limited`. Los inserts Sony van volteados con `transpose=2` (90° antihorario).
- **Audio:** voces a −19 LUFS (`preparar_voces.py`), fundidos de 2 cuadros en cada corte, fundido de 0,3 s calle→ambiente; loudnorm −14 con `terminar_audio.sh`.
- **Música:** Mixkit «Happy Home» (id 801, Michael Ramir C.), ya en la biblioteca; PRUEBA. Otras en la biblioteca: Gummies (1142), My Little Star (1037), We'll Be Okay (1081), Motivating Mornings (33). La búsqueda en Mixkit `mood:happy genero:lofi` dio 0 resultados (no combina filtros).
- ⚠️ Texto del arranque: Whisper oyó "con tu café… para el otro" en las dos tomas (el guion decía "un café… para otro"); el subtítulo dice lo que ella dice.
- ⚠️ "Tostón proteico": usé el tostón de pollo con parmesano (C0079); también hay uno de jamón crudo.

## Entregas
| Archivo | Fecha | Cambios |
|---|---|---|
| `out/2026-10-27_docba_r1-nov/revision/borrador_r1-nov_9x16_A.mp4` | 2026-10-27 | Primer borrador sin música; 1 cuadro negro en el corte guacamole→tostón (redondeo de cuadros) |
| `out/2026-10-27_docba_r1-nov/revision/borrador_r1-nov_9x16_B.mp4` | 2026-10-27 | A corregido + música de prueba; 34,3 s, −14,6 LUFS; detectar_glitches sin avisos |
| `out/2026-10-27_docba_r1-nov/revision/borrador_r1-nov_9x16_C.mp4` | 2026-10-27 | Correcciones al borrador A (ver abajo); 30,7 s, −14,3 LUFS. El detector marca 2 "destellos" en el cuadro 83/94: es el poste naranja de la puerta cruzando el cuadro, no un error |

### Correcciones de la usuaria al borrador A → C (2026-10-27)
1. **Arranque:** sin el "va" (la voz arranca recién en 3,20 s del proxy; Whisper había oído "¿Por qué" en el "va"), con ella caminando desde antes (se ve desde 1,05 s). Ruido de ciudad caótica de fondo sin tapar la voz (compuesto por código en `ciudad.py`, −31 LUFS).
2. **Segundo plano** (IMG_9332): arranca cuando abre más la puerta, casi entrando (2,75 s). Acá empieza de a poco la música `paulyudin-hip-hop-relax-boombap-310241.mp3` (Clientes/DOCBA/Música); la ciudad se va. Música suave, ~23 dB bajo la voz; sube en la placa.
3. **Tercer plano:** IMG_9347 (en vez de la 9338; no tiene la pausa de 1 s). En "una carta que no se parece a ninguna": carta digital animada (`MenuDigital.tsx`, textos de la carta real sin precios).
4. **Inserts:** estabilizados (vidstab, ventanas elegidas por `jitter.py` = las más firmes de cada toma, y tomas alternativas donde la original temblaba) y con color apetitoso sin exagerar (`preparar_inserts.py`: contraste +6 %, saturación +15 %, tibio leve, nitidez). Glitch croissant→tostón: era un cuadro negro por redondeo (arreglado en B).
5. "Cuando se acerca la noche": copas de vino directo (reemplaza el cartel de afuera).
6. Se elimina la parte de gluten free.
7. Remate: arranca directo en "te esperamos" (sin la "y").
8. **Tipografía de subtítulos:** IBM Plex Sans **Condensed Medium**, blanca (80 px). **Sincronía:** el texto entra exacto cuando se dice (antes entraba antes que la voz): tiempos de `tiempos.py` = DTW de Whisper corregido con la energía de la voz.
9. **Audio:** voz de ella pareja entre tomas (−19 LUFS + compresión suave, `preparar_voces.py`), música suave que no tape la voz y que **sube en la placa**.
| `out/2026-10-27_docba_r1-nov/revision/borrador_r1-nov_9x16_E.mp4` | 2026-10-27 | Correcciones al borrador D/C (abajo); 26,2 s, −14,3 LUFS, detectar_glitches sin avisos |

### Correcciones de la usuaria (2.ª tanda, sobre C) → E (2026-10-27)
1. **Subtítulos:** más chicos (80 → 66 px) y con 170 px de margen a cada lado; las frases largas van en dos filas balanceadas; entran y salen **en seco** (sin fundido ni desplazamiento).
2. **Carta digital:** rehecha como la web real (capturas de la usuaria): cabecera con logo y dirección, buscador, categorías con íconos, tarjetas en dos columnas con nombre, descripción y precio; la barra queda fija, corre la página y cambia la categoría activa (`MenuDigital.tsx`).
3. **Plano más cercano:** tras "para estar cómodo" corte a IMG_9347 con zoom 1,18 que arranca directo en "y una carta" (se sacó la pausa de 0,7 s); en "que no se parece a ninguna" corre la carta.
4. **Voz en off sin ruido de fondo:** DeepFilterNet (`--atten-lim 22`) sobre `voz_1`; el video queda solo con la voz de ella, la música (y la ciudad en el 1.er plano). La voz en off entra al toque de "ninguna".
5. **Remate sin silencios:** IMG_9395 corta apenas termina "corridas" (9,14 s del proxy) y IMG_9398 arranca en el hueco entre la "y" y "te" (1,005 s); la placa entra apenas termina "DOCBA" (2,17 s).
6. **Puntuación:** "¿Por qué andar con tu café de un lado para el otro? / Si podés entrar…"; "Encontrás productos como matcha latte, croissant de poché y guacamole, tostón proteico de masa madre… y cuando se acerca la noche, aparece la copa de vino." (cada fragmento con su coma/punto); "Te esperamos en DOCBA."
7. **Color:** cada insert se levanta según lo oscuro que sea (luz media final 0,44–0,58) con saturación +14 % y un toque tibio.
8. **Estabilización:** vidstab con zoom fijo y sin rotación; ventanas elegidas con `jitter2.py` (temblor + "gelatina" por flujo óptico); la copa de vino pasó a **un solo plano** continuo de C0129 y el matcha/latte a un solo plano de C0050 (menos cortes = menos riesgo de gelatina).
9. **Música:** el beat más movido arranca justo al terminar "las horas" (el groove del tema está a 1,5 s del archivo; el intro suave entra de a poco desde el plano 2).
10. **Sincronía de subtítulos:** la causa de que salieran antes/después era el DTW de Whisper (estira las palabras sobre las pausas y en `voz_1` estaba corrido ~0,6 s). Ahora los tiempos salen de la energía de la voz (pausas y valles entre palabras), con 1 cuadro de adelanto, y se verifican contra el audio del render con `verificar_sync.py` (desvíos ≤ 75 ms en los arranques con hueco previo).
| `out/2026-10-27_docba_r1-nov/revision/borrador_r1-nov_9x16_F.mp4` | 2026-10-28 | Correcciones al borrador E (abajo); 27,7 s, −14,3 LUFS. Glitches: solo el cierre de la placa (congelado final intencional) |

### Correcciones de la usuaria (3.ª tanda, sobre E) → F (2026-10-28)
1. **"…que pasen las horas":** IMG_9332 sigue hasta que ella sale del cuadro (6,45 s del proxy, +1,5 s) y hace de transición al plano siguiente.
2. **Carta digital:** el scroll se detiene cuando el final de la lista toca el borde inferior (antes pasaba de largo y dejaba ~1000 px en blanco), por lo que corre más lento.
3. **Matcha latte:** C0049 (cae el matcha, 42,3–43,45 s de la toma; en la hoja la caída está en 42–45 s, no en 0:41), estabilizado, con color y **cámara lenta 0,5×** con RIFE (`preparar_inserts2.py matcha` → `ins_matcha2.mp4`).
4. **"masa madre…"** → "masa madre,".
5. **Copa de vino en dos planos:** C0114 (toma horizontal: recorte vertical centrado en las copas, ventana 19,0 s por `jitter3.py`) para "cuando se acerca la noche" + C0129 (el de antes) para "aparece la copa de vino". Look de noche en los dos: luz media más baja, sombras frías, altas luces tibias, viñeta suave.
6. **Luz de la chica** en IMG_9332, IMG_9395 e IMG_9398: `iluminar_persona.py` (máscara de persona de MediaPipe suavizada, gamma + ganancia solo sobre ella, toque tibio; 9332 está a contraluz y lleva más: `GAMMA=0.66 GANANCIA=1.12`). Archivos `crudos/IMG_*_luz.mp4`; los originales de proxy quedan.
7. **Subtítulos:** el "glitch" era que cada subtítulo entraba 1 cuadro antes de que terminara el anterior (se veían dos textos encimados) y que entre algunos quedaba 1 cuadro vacío. Ahora `tramosSubtitulos` (ReelDocba) los deja sin superposición y cierra los huecos ≤ 4 cuadros. Tipografía **IBM Plex Sans Regular** 60 px (márgenes 150 px) en vez de Condensed Medium; si no convence, volver a Condensed Medium (`DOCBA_PLEX_COND`, 66 px, peso 500).
| `out/2026-10-27_docba_r1-nov/revision/borrador_r1-nov_9x16_G.mp4` | 2026-10-28 | Correcciones al borrador F (abajo); 27,7 s, −14,3 LUFS. El detector marca un "flash" falso en 2,07 s (cámara en mano caminando; los cuadros son continuos) y el congelado final de la placa |

### Correcciones de la usuaria (4.ª tanda, sobre F) → G (2026-10-28)
1. **Subtítulos:** vuelve IBM Plex Sans Condensed Medium 66 px (la Regular se descartó). Frases partidas en trozos de 1–3 palabras que cambian a medida que habla (33 subtítulos en vez de 20). Los tiempos de los trozos son la partición de los grupos ya medidos (palabras.json para las tomas habladas; proporcional en la voz en off): conviene correr `verificar_sync.py` si se nota alguno corrido. Al cerrar huecos, el texto nunca pasa un corte de plano.
2. **Parpadeos:** no había ninguno medible en el original de "Si podés entrar…" (IMG_9324, sin tocar: los saltos de brillo son el movimiento de la cámara en mano). Lo que sí podía parpadear era la luz que agregué en IMG_9332: `iluminar_persona.py` ahora suaviza la máscara en el tiempo (EMA 0,65). Si sigue viéndose raro, dejar IMG_9332 sin luz (`crudo("IMG_9332")`).
3. **Contorno "fantasma":** la luz se derramaba sobre el fondo; la máscara ahora se mete 9 px hacia adentro y cae despacio (erosión + desenfoque 9 px). 9332 con `GAMMA=0.68 GANANCIA=1.10`.
4. **Música:** el beat entra apenas termina "las horas" a 0,22 (antes 0,07), sigue fuerte mientras ella sale del cuadro y baja a 0,06 (fondo) 0,5 s antes de que vuelva a hablar.
5. **Carta digital:** entra como una hoja que sube 14 cuadros con un filo naranja DOCBA (como el barrido de la placa), esquinas redondeadas arriba; después corre.
6. **Matcha:** enderezado (−4°, zoom 12 %) y la ventana arranca con el líquido verde ya cayendo (42,7 s); color con realce de verdes. **Todos los inserts de comida:** más contraste (curva en S suave), vibrance 0,35 y saturación +7 %, tibio leve (`COLOR` de `preparar_inserts2.py`, que ahora rehace matcha, croissant, guacamole y tostón desde los estabilizados).
7. **Croissant:** zoom 1,08 y 1,22 con origen arriba (`origen: "50% 0%"`): baja el plato y recorta el aire de abajo. Apliqué los dos planos de croissant (el del tenedor con poché y el de guacamole; el de guacamole era el que más aire tenía).
8. **"Cuando se acerca la noche":** C0114 salía gelatinosa (jitter 0,50); se cambió por C0131 (cuatro copas, jitter 0,17), mismo look de noche (`jitter4.py <toma>` mide cualquier toma).
| `out/2026-10-27_docba_r1-nov/revision/borrador_r1-nov_9x16_H.mp4` | 2026-10-28 | Correcciones al borrador G (abajo); 27,3 s, −14,3 LUFS; detectar_glitches: solo el congelado final de la placa |

### Correcciones de la usuaria (5.ª tanda, sobre G) → H (2026-10-28)
1. **Mangas oscuras que titilan (IMG_9332):** la máscara de persona las incluía/excluía cuadro a cuadro. Se sacó la máscara en ese clip: ahora una curva global (abre sombras y medios) en `crudos/IMG_9332_luz.mp4`; sin parpadeo. (La versión con máscara quedó en `tmp/IMG_9332_mascara.mp4`.)
2. **"En DOCBA…" arranca en el segundo 8,0:** el arranque empieza 0,35 s después (A_DESDE 1,40) y el plano de la puerta dura 3,65 s (ella ya salió del cuadro en 6,4 s del proxy).
3. **Croissant (los dos) y tostón:** estaban amarillos y saturados (la salsa y la madera ya vienen muy amarillas de cámara, y mi vibrance/tibio lo empeoraba). Color `NATURAL` en `preparar_inserts2.py`: sin tibio, saturación 0,95, componente amarillo −35 % (selectivecolor), un toque de azul en sombras y medios, curva en S suave.
4. **Copas:** primero C0114 (brindis, copas en mano) y después C0131 (cuatro copas con la tabla); C0129 sale. C0114 se estabiliza con smoothing 12 y zoom fijo 4 %: el vidstab por defecto le agregaba la "gelatina" (medida con `jitter4.py`-style: 0,31–0,36 vs 0,29 del original).
5. **Color gris de los últimos clips** (IMG_9395 e IMG_9398): luz de la chica con máscara (como antes) + saturación 1,12, vibrance 0,25 y un toque tibio (`crudos/*_col.mp4`).
6. **Subtítulos exactos:** ya no hay adelanto (ADELANTO 0) y cada entrada sale de un arranque o valle de sílaba medido en el audio (`arranques.py`), no de una partición proporcional. Corregido: "que pasen" (hay 0,5 s de silencio después de "dejar"), "las horas.", "espacio de sobra", "la noche,", "lo que más te guste,", "que estés". `verificar_sync.py` sobre el render: todos los que arrancan tras un hueco quedan a ≤ 50 ms (texto 1 cuadro después de la voz). "Te esperamos" y "en DOCBA." ahora son dos subtítulos.

## Borrador I (6.ª tanda, 2026-10-28)
- Subtítulo "Si podés entrar" sin puntos suspensivos.
- Plano de la puerta (IMG_9332) corta en 7,05 s (B_DUR 2,7); beat a volumen normal (BEAT_FUERTE 0,3) hasta que arranca la voz de "En DOCBA…", recién ahí baja a FONDO_MUSICA.
- Inserts croissant/guacamole/tostón: NATURAL más liviano (sat 1,03, amarillo −0,12, sin azul extra, luz objetivo ×1,2); el croissant 2 se reestabilizó con zoom fijo (optzoom=0) para que no se aleje.
- IMG_9395/IMG_9398: mismo color que IMG_9332 (curva global, sin máscara) en `*_col.mp4`.

## Borrador J (7.ª tanda, 2026-10-28)
- Segundo plano = IMG_9330 (seguimiento de costado, sin frenar: arranca a 3,35 s del proxy cuando asoma la mano con el vaso; corta en 7,05 s del reel). `crudos/IMG_9330_luz.mp4` (misma curva global), `audio/hab_IMG_9330.wav`. Subtítulos: "y dejar" 4,13 / "que pasen" 4,77 / "las horas." 5,19 (tramos medidos con arranques.py). Beat en el fin de "las horas".
- Matcha: C0048 (la mano revuelve, `ins_matcha_mezcla`) 0,85 s + C0049 (cae el matcha) 0,92 s.
- Croissant 2 (`ins_guacamole`): `alejar: true` (PUSH_ALEJAR 0,12) en vez de acercamiento.
- Copas 2 (`ins_vino_b`): enderezadas 3,7° horarios (horizonte de la mesa) con zoom 11,5 %, luz objetivo 0,53 (antes 0,34).
- Últimos dos clips de ella: `ZOOM_TECHO` (zoom 1,065, origen abajo): sin el techo sucio, el cartel se ve completo.

## Borrador K (8.ª tanda, 2026-10-28)
- Segundo plano: vuelve IMG_9332 (el de I). IMG_9330 se descartó.
- Mano que revuelve: C0049 desde 0:16 (`ins_matcha_mezcla`, estabilizado suave=12, color COLOR+VERDES, luz 0,48).
- Alejamiento del croissant 2: PUSH_ALEJAR 0,035 con ease sinusoidal (antes 0,12, "muy digital").
- "copa de vino" (`ins_vino_b`, C0131): luz igual a la versión I (objetivo 0,34), horizonte recto (3,7°), sin vidstab (la ventana 2,12 s ya es la más firme, jitter 0,17; el estabilizador daba la gelatina).

## Entrega
| Versión | Archivo | Notas |
|---|---|---|
| v1 | `out/2026-10-27_docba_r1-nov/final/r1-nov_9x16_v1.mp4` | 1080×1920, 30 fps, 26,4 s, −14,3 LUFS, CRF 18. Igual al borrador K. Único aviso del detector: congelado final de la placa (intencional). |

## Borrador L (9.ª tanda, 2026-10-30)
- **Primer plano (IMG_9324) sin subtítulos:** el texto va grande, naranja y en **Gabriella Heavy** (`fonnts.com-Gabriella_Heavy.otf` de `Clientes/DOCBA/Fuentes`, copiada a `public/marcas/docba/fuentes/Gabriella-Heavy.otf`; `DOCBA_GABRIELLA` en `fuentes.ts`) **arriba de la cabeza de ella**, frase por frase ("¿Por qué andar / con tu café / de un lado / para el otro? / Si podés entrar"), en dos renglones con la letra más grande que entre (hasta 190 px; Gabriella es muy ancha), con un "pop" corto en el cuadro donde arranca la voz. La posición sale del seguimiento de la cabeza (`cabeza.py` con MediaPipe → `cabeza_9324.json`, promedio móvil de 9 cuadros para que flote sin temblar). `ReelDocba` ahora acepta `rotulos` + `cabeza`.
- **Transición con flash** (la de los reels del CEI, `src/plantillas/comunes/flashLuz.tsx`) en el corte a "En DOCBA tenés…" (7,05 s) y entre las dos copas (17,32 s): prop `flashes` de `ReelDocba`.
- **Placa final:** efecto de sonido al aparecer (whoosh de Mixkit 1492, vol 1,0: crece durante 1 s y llega al pico justo cuando el panel naranja cubre la pantalla, por eso entra 0,45 s antes de la placa; prop `placa.sfx`). Tipografías: leyendas en IBM Plex Sans (SemiBold/Medium); el nombre DOCBA es el logotipo vectorial del manual, que es Gabriella Heavy.

## Borrador M (10.ª tanda, 2026-10-30, sobre L)
- **Textos del primer plano:** fijos (no siguen a la cabeza dentro de cada frase; cada uno tiene su posición fija sobre ella), entran y salen en seco, **una línea**, siete tramos: "¿Por qué" / "andar" / "con tu café" / "de un lado" / "para el otro?" / "Si podés" / "entrar" (cortes de "andar" 3,38 y "entrar" 5,22 por alineación forzada). Gabriella Heavy **naranja**, **sin sombra**, al 62 % del tamaño que haría entrar la frase más larga en una línea (`ROTULO_ESCALA`). (Se probó hueso, por pedido, y la usuaria volvió al naranja.)
- **Segundo flash:** no era entre las copas sino **al volver la host a cámara** (corte de las copas a IMG_9395, 18,57 s); el primero sigue en 7,05 s. `flashes: [inicioC1, d1]`.
- ⚠ Sin sombra, el naranja se pierde donde pasa sobre la columna naranja de la puerta ("de un lado", "para el otro?"): si molesta, mover esas frases a la derecha o ponerles un contorno fino.

| v2 | `out/2026-10-27_docba_r1-nov/final/r1-nov_9x16_v2.mp4` | 1080×1920, 30 fps, 26,4 s, −14,2 LUFS, CRF 18. Igual al borrador M pero **sin ningún texto en el primer plano** (sin subtítulos ni rótulos, pedido de la usuaria). Flash en 7,05 s y 18,57 s, whoosh al entrar la placa. Único aviso del detector: congelado final de la placa (intencional). |

| v3 | `out/2026-10-27_docba_r1-nov/final/r1-nov_9x16_v3.mp4` | 2026-10-30. Igual a la v2 pero **sin el efecto de sonido de la placa final** (se quitó `placa.sfx`; la música sube en la placa como siempre). 1080×1920, 30 fps, 26,4 s, −14,3 LUFS, CRF 18. |
