# 2026-10-28_docba_r3-nov

| Campo | Valor |
|---|---|
| Cliente / marca | DOCBA (`src/marcas/docba`) |
| Pieza | r3-nov (Reel 3 NOV) |
| Estado | 🟢 Entregado (v1) |
| Abierto | 2026-10-28 |
| Cerrado | — |

## Brief
- **Objetivo:** Reel 3 (pilar: loft social, experiencias y eventos). Mostrar a DOCBA como un lugar diferente, donde reunirse con el equipo de trabajo, motivando el encuentro de fin de año. Introducir de a poco las fechas de cierre de año. Host: equipo RASTRO (Lucía R o Lucía C). Guion técnico: `planificacion_nov.md` (copia de `Downloads/Nov. Planificación.md`).
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** no aplica (sin personajes animados)
- **Luz de la escena:** —
- **Duración:** ~35–38 s (placa incluida)
- **Tono / estilo:** el de DOCBA (anfitriona, cálida, ingeniosa; voseo). Criterios del cliente: `src/marcas/docba/CRITERIOS.md` (lista de control de arranque).
- **Textos obligatorios:** placa final: "Reservá tu fin de año por WhatsApp." + DOCBA · Buenos Aires 864 · Nueva Córdoba
- **Llamado a la acción:** reservar por WhatsApp
- **Entrega:** `out/2026-10-28_docba_r3-nov/final/`

### Guion técnico (resumen)
| Tiempo | Imagen | Audio / texto |
|---|---|---|
| 0–4" | Detalle de ojos de la host mirando el celular + insert de pantalla con grupo de WhatsApp ("¿dónde hacemos lo de fin de año?", "¿y si mejor en enero?", "yo no puedo ese día") | Calle, mensajes |
| 4–6" | Bloquea el celular, mira a cámara y sonríe | "Nosotros te lo resolvemos." |
| 6–12" | Seguimiento hacia el área con reserva: mesa grande armada con equipo | "En DOCBA podés reservar un espacio para hacer el cierre de año con tu equipo…" |
| 12–17" | Inserts de opciones de la carta | "…acompañado de un montón de opciones en carta para compartir." |
| 17–22" | Montaje rápido: alguien explicando con entusiasmo, equipo riéndose, choque de manos | VO: "Porque todos los proyectos merecen un brindis." |
| 22–30" | Equipo reunido, cierran las compus, llega el vino, se ríen | "Y cuando llega la hora del after office, se piden una copita, y siguen disfrutando: todo bajo el mismo techo." |
| 30–35" | Host en la cava con copa a cámara; de fondo el equipo | "Vos traé al equipo, nosotros nos ocupamos del resto. Te esperamos en DOCBA." |
| 35–38" | Placa final con logo | Texto de la placa |

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-28_docba_r3-nov/` (4 .MOV iPhone + `R3 NOV. 1.m4a`; copiados de `Clientes/DOCBA/Producciones/1. R3 NOV`, tamaños verificados)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-28_docba_r3-nov/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/docba/`
- **Inserts de cámara:** `Clientes/DOCBA/Producciones/Inserts cámara/{Cava,Comida,Cowork,Loft,Reuniones}` (se usan directo; solo los elegidos se copian y hacen proxy)

### Crudos (proxies 1080×1920, 30 fps; los MOV de iPhone son de rango completo → `scale=in_range=full:out_range=limited`)
| Archivo | Duración |
|---|---|
| IMG_9480 | 16,33 s |
| IMG_9483 | 12,77 s |
| IMG_9485 | 4,57 s |
| IMG_9491 | 7,50 s |
| `R3 NOV. 1.m4a` (voz en off, `audio/voz_1.wav`) | 8,53 s |

## Guiones
- `planificacion_nov.md` (guion técnico de la usuaria). Falta `guion_r3-nov.md` con tiempos reales (generar con `/guion`).

## Decisiones
- **Plantilla:** `ReelDocba` (pendiente de confirmar según el material: este reel tiene la voz de la host, la voz en off y montaje de inserts de equipo/reuniones/cava).
- **Música:** pendiente (la elige la usuaria desde `Clientes/DOCBA/Música/`; si no manda, proponer).
- **Otras:** pendiente analizar qué dice y muestra cada crudo (transcribir) y elegir inserts de Cowork/Reuniones/Loft/Cava para el montaje; el insert de WhatsApp (pantalla del celular) hay que armarlo o recibirlo.

## Entregas
| Archivo (`out/2026-10-28_docba_r3-nov/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `r3-nov_9x16_v1.mp4` | 2026-10-28 | Primera entrega = borrador M procesado a calidad final (CRF 18, −14,2 LUFS, 25,2 s, 1080×1920, 30 fps). Único aviso del detector: congelado final de la placa (intencional). |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-28_docba_r3-nov/` desde `C:/Videos/archivo/2026-10-28_docba_r3-nov/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/2026-10-28_docba_r3-nov/` (si los hay).
3. `npx remotion render src/index.ts docba-r3-nov out/2026-10-28_docba_r3-nov/final/<salida>_vN.mp4 --crf=18`

## Borrador D (1.ª tanda, 2026-10-28) — `out/<ID>/revision/borrador_r3-nov_9x16_D.mp4` (26,7 s, −14,0 LUFS)
- **Apertura (0–4 s):** 0,6 s de primer plano de los ojos (recorte del 4K de IMG_9480, `crudos/ojos_9480.mp4`) y el insert del chat de grupo (`ChatGrupo.tsx` en la plantilla ReelDocba: hoja que sube con filo naranja, mensajes cada vez más seguidos, contador de no leídos, "escribiendo…") con sonidos de mensaje (`sonidos_chat.py`: Mixkit devolvió 403 al bajar "Message pop alert", se compusieron por código) y calle (`ciudad.wav` de R1). Sin música.
- **Música:** `alex-morgan-soul-jazz-coffee-shop` (Clientes/DOCBA/Música), 99,4 bpm; arranca desde el principio del archivo justo en "Nosotros te lo resolvemos" (4,2 s) y los cortes del montaje caen sobre sus pulsos (`pulsos.json`).
- **Planos:** IMG_9480 (nosotros te lo resolvemos + ella entra a DOCBA), IMG_9485 ("En DOCBA podés reservar un espacio…" caminando por el loft), VO con inserts de Comida/Cava (mesa, platos, tenedores, tabla), Reuniones/Cowork (risa, equipo, brindis) y IMG_9491 (copa, "todo bajo un mismo techo").
- **Voces:** audios de los crudos a −19 LUFS, VO limpia con DeepFilterNet (`preparar_voces.py`). Subtítulos medidos con `arranques.py` y verificados con `verificar_sync.py` (los que arrancan tras un hueco ≤ 50 ms).
- **Falta / a revisar:** (1) la frase final del guion ("Vos traé al equipo… Te esperamos en DOCBA") no existe ni se va a grabar (confirmado por la usuaria, 2026-10-28): la placa entra después de "todo bajo un mismo techo"; (2) en IMG_9485 Whisper oyó "puedes" y "dos equipos": los subtítulos siguen el guion ("podés", "con tu equipo") — confirmar a oído; (3) IMG_9480/9483 traen charla de set ("¿Voy? – Dale"), no se usa; (4) el "Tranqui," de IMG_9480 quedó afuera (el guion dice "Nosotros te lo resolvemos").

## Borrador F (2.ª tanda, 2026-10-28) — 28,6 s, −13,9 LUFS
Correcciones de la usuaria sobre el D:
1. **Apertura = directamente el motion graphic** (sin la host). Estética nueva a partir de las referencias (`Clientes/DOCBA/Referencias`): celular apoyado en una mesa de madera, tarjetas de notificación de vidrio esmerilado flotando en perspectiva, fondo de bokeh natural (C0170 desenfocado) y paleta DOCBA (hueso, azul petróleo, naranja). `NotificacionesChat.tsx` reemplaza a `ChatGrupo.tsx` (borrado).
2. **Segundo plano:** IMG_9483 del 0:06 al 0:10 (mira a cámara, "Nosotros te lo resolvemos", se va a la puerta) y después arranca directo IMG_9485 ("En DOCBA…"); el beat entra en "nosotros" (5,27 s). Se sacó el plano de IMG_9480.
3. **Sin sonido en los inserts** (siempre, salvo que se pida lo contrario): los proxies van sin audio (`-an`) y el reel solo suena con voces, ambiente de los clips de la host, música y efectos.
4. **"Acompañado…" al toque de "equipo":** el plano de IMG_9485 corta en 4,17 s y la VO arranca sin su silencio inicial (`VO_DESDE` 0,06).
5. **Primer insert (0:11):** C0092 en la ventana más suave (temblor 0,11, `suavidad.py`), estabilización suave y natural (vidstab smoothing 15, zoom fijo) y RIFE ×2 sobre el 24p para que no se trabe; el segundo plato pasó a C0100 con el mismo tratamiento.
6. **Insert del 0:14:** C0115 (brindis de dos personas; toma horizontal, recorte vertical) en lugar de los tenedores.
7. **Insert del 0:16:** C0042 desde el 0:09.
8. **"Merecen un brindis":** entra directo IMG_9491 (sin inserts) hasta "todo bajo un mismo techo" y ahí la placa con colores invertidos (fondo hueso, logotipo naranja).

## Borrador G (3.ª tanda, 2026-10-28) — 26,0 s, −14,0 LUFS
Correcciones de la usuaria sobre el F:
1. **Motion graphic de apertura rehecho, minimalista:** sin celular, mesa ni bokeh; fondo azul petróleo de DOCBA con luces suaves que derivan, y mensajes de chat como tarjetas hueso (estética de las referencias, limpia). Solo 4 mensajes (cada uno entra con ~0,9 s de diferencia y se queda quieto: se alcanzan a leer) + "escribiendo…". `NotificacionesChat.tsx`.
2. **IMG_9485 ("En DOCBA…") arranca con ella ya en movimiento:** entra 0,07 s antes de la primera palabra (0,83 s del proxy).
3. **Voces/ruido raro en el insert 0:12:** la grabación de la VO (`R3 NOV. 1.m4a`) trae 1,7 s de charla de fondo antes de "acompañado" (la voz real arranca en 1,74 s); estaba sonando justo después de "equipo". Se recorta (`VO_DESDE` 1,68) y la VO se limpió sin límite de atenuación de DeepFilterNet. También se silencia la charla del equipo que trae IMG_9491 antes de que hable ella: el video solo tiene la voz de la chica y la música (+ efectos de mensaje y calle en la apertura).
4. **"Acompañado…" pegado a "equipo"** (consecuencia del punto anterior: antes había un hueco de 1,7 s con charla).
5. **IMG_9491 arranca justo en el choque de copas** (1,55 s del proxy, medido cuadro a cuadro) y ese choque cae en "brindis".
6. **Subtítulos a la par de la voz:** alineación forzada nueva (`scripts/alinear.py`, wav2vec2 CTC en español, 20 ms por palabra). Descubrió que los subtítulos del borrador F estaban atrasados 0,3–0,6 s en "para hacer / el cierre de año / con tu equipo" y que en IMG_9483 ella dice "Tranqui, nosotros te lo resolvemos" (el texto arrancaba en "Tranqui"). Cada trozo entra en la primera palabra (−0,03 s). Verificado con el render (greedy CTC sobre el mix).
7. El beat entra en "nosotros" (5,85 s); el resto de los cortes de inserts siguen las palabras de la VO.

## Borrador H (4.ª tanda, 2026-10-28) — 24,9 s
Correcciones sobre el G (se conserva la duración de los textos del chat):
1. **Chat rediseñado:** sin nombre de grupo, fondo naranja liso de DOCBA y mensajes como globos de texto reales con colita (referencia `Referencias/bc9bdc259a47d95f2413da4a6daf5f73.jpg`): hueso a la izquierda, azul petróleo a la derecha, nombre chiquito arriba y "escribiendo…" antes de cada mensaje. **Capa de gráficos con fondo transparente** (`ChatMensajes.tsx`), montada sobre el naranja en el reel y exportable: `out/<ID>/revision/chat_r3_alfa.mov` (ProRes 4444 con alfa, composición `docba-r3-nov-chat-alfa`). Sin tráfico de fondo: solo suenan los mensajes.
2. **IMG_9483 arranca en 7,05 s** (ya mirando a cámara, antes de "Tranqui"): se ganó 0,95 s; el beat sigue en "nosotros".
3. **Tostón (C0092) y huevo centrado (C0100):** color "suave" (solo realza: saturación +7 %, contraste +3 %, sin cambiar la luz de la toma) y **sin estabilización** (la del huevo hacía un movimiento raro); se mantiene RIFE para el 24p. Regla: los clips cortos casi nunca necesitan estabilizar.
4. **Se sacó el clip de la cava (tabla con copas, 0:14) y se estiró el anterior** (brindis C0115, ahora 1,6 s).
5. **"Porque todos los proyectos":** C0041 desde el 0:05 (sin estabilizar) en lugar de C0042.
6. **Color de los clips 2 y 3** (IMG_9483, IMG_9485): mejora leve sobre la curva anterior (`*_col2.mp4`: contraste +4 %, saturación +10 %, vibrance suave, un poco más de calidez).
7. **Subtítulos con sentido y gramática:** "Tranqui," / "nosotros" / "te lo resolvemos." · "En DOCBA" / "podés reservar" / "un espacio para hacer" / "el cierre de año" / "con tu equipo," · "acompañado de un montón" / "de opciones de carta" / "para compartir." (es una sola oración: coma y minúscula) · "Porque todos los proyectos" / "merecen un brindis." · "Y cuando llega la hora" / "del after office," / "siguen disfrutando." / "Todo bajo un mismo techo." Tiempos recalculados con la alineación forzada.

## Borrador I (5.ª tanda, 2026-10-28) — 24,6 s, −14,0 LUFS
1. **Apertura rediseñada** (cool/tecnológica, tipo Volto): tarjetas de vidrio esmerilado translúcidas y difuminadas flotando sobre un video real del loft (C0171, oscurecido y con luz naranja), con tarjeta "esqueleto" (barritas que brillan, como en la referencia `Pictures/Screenshots/Captura de pantalla 2026-10-28 140144.png`), destello y revelado del texto. `ChatVidrio.tsx` (reemplaza a `ChatMensajes.tsx`). **Conversación con sentido y un solo nombre por lado:** Maru (izquierda, vidrio blanco) y Nico (derecha, vidrio con tinte naranja): "¿Dónde hacemos lo de fin de año?" / "¿Y si mejor en enero?" / "Yo no puedo ese día" / "¿Y quién reserva? 😅". Capa transparente exportable: `chat_r3_alfa.mov` (ProRes 4444, sin el difuminado porque no hay fondo).
2. **Insert del 0:10 (tostón C0092):** tenía un tirón (aceleración del movimiento 0,17, pico 0,74); ahora estabilización leve (vidstab smoothing 5, zoom 3 %) + RIFE: aceleración 0,02, sin que se vea robótico.
3. **"Para compartir" (C0115):** corrección de color (contraste en S, saturación +14 %, vibrance, calidez) y más luz (0,26 → 0,49).
4. **Pizarrón (C0041):** estaba oscuro (el pipeline lo bajaba a 0,45); ahora luz 0,65 con sombras levantadas, sin curva en S ni retoques que degraden.
5. **Subtítulos cortos y dinámicos:** "un espacio" / "para hacer" · "el cierre" / "de año" · "acompañado" / "de un montón" / "de opciones" / "de carta" / "para compartir." · "Porque todos" / "los proyectos" / "merecen" / "un brindis." · "Todo bajo" / "un mismo techo."
6. **Placa:** "RESERVÁ TU FIN DE AÑO EN DOCBA" (sin WhatsApp).

## Borrador J (6.ª tanda, 2026-10-28) — 25,0 s
1. **Apertura sobre el primer cuadro de la host:** el primer cuadro de IMG_9483_col2 (7,05 s) se congela y se desenfoca (28 px, oscurecido) y sobre él llegan los mensajes; al final las tarjetas se van con una salida escalonada (blur + escala + fade) y el video se descongela desde ese mismo cuadro: arranca con el mismo desenfoque/brillo (empalme sin salto), se enfoca en 14 cuadros con un zoom rápido (1,05 → 1,10) que se acomoda solo a 1,0 en ~1,2 s, y ella empieza a hablar. Nuevas props: `foco` en `ClipDocba` y `fondo`/`salidaDesde` en el chat (`ChatVidrio.tsx`, constantes `FONDO_*` compartidas con `ReelDocba.tsx`). El chat pasó a 4,6 s.
2. **Textos directos** (sin las dos barritas), tipografía clásica de mensajes de texto (Inter, vía @remotion/google-fonts; no la de DOCBA) y el mismo interlineado en todos (nombre 30/36 px, texto 50/62 px).
3. **Conversación:** "¿Dónde hacemos lo de fin de año?" / "¿Y si mejor en enero?" / "Yo no puedo ese mes" / "¿Qué hacemos? 😅".
4. **Insert del jamón (C0092):** color casi del original (saturación −3 %, menos amarillo neón, rojos más calmos, sin afilado extra); conserva la estabilización leve y RIFE.
5. **Insert del huevo (C0100):** plano más cercano (zoom 1,22, origen en el centro del plato) para ver el detalle.

## Borrador K (7.ª tanda, 2026-10-28)
- **Placa de inicio = la de la usuaria** (`Downloads/MSJwppFondonaranja.ai`, conversación estilo iMessage sobre degradado naranja), animada de forma limpia: se descompuso en capas con `extraer_placa.py` (PyMuPDF: placa sin globos, globo×4 sin texto con alfa recuperado por diferencia de render, texto×4, "Delivered"; en `public/.../img/placa/`). Cada globo se infla desde su colita (11 cuadros) y su texto se revela de izquierda a derecha, renglón por renglón; "Delivered" aparece al final; deriva muy leve. Salida: los globos se van escalonados y la placa se disuelve sobre el primer cuadro de la host (congelado y desenfocado), que se enfoca con zoom rápido. `PlacaChat.tsx` (reemplaza a `ChatVidrio.tsx`). Textos del .ai: "¿Dónde hacemos lo de fin de año?" / "¿Y si mejor en enero?" / "Yo no puedo ese mes" / "¿Qué hacemos? 😅".
- **Sin sonidos de notificación** (pedido de la usuaria: los agrega ella después). La apertura queda sin audio hasta "Tranqui,".

## Borrador L (8.ª tanda, 2026-10-28)
1. **Placa ajustada como pantalla de celular:** el teclado toca los márgenes izquierdo, derecho e inferior (escala 1,103 sobre el ancho del teclado). Como entonces la placa es más alta que el cuadro, se achican dos huecos vacíos (entre cabecera y línea: 65 u.; entre "Delivered" y la barra de escribir: ~234 u.) con tres tajadas de la placa; los globos se animan en esas coordenadas compactadas. `PlacaChat.tsx`.
2. **Sin cuadro congelado ni desenfoque:** el video de la host (IMG_9483 desde 6,5 s) ya corre debajo mientras la placa se disuelve (16 cuadros de solape): ella todavía usa el celular, lo bloquea y lo baja justo cuando la placa termina de irse; después "Tranqui, nosotros te lo resolvemos". Se quitó el `foco` del clip (queda disponible en la plantilla).

## Borrador M (9.ª tanda, 2026-10-28)
- **Sin transición de salida:** los globos no se van ni la placa se disuelve; la placa queda completa (con "Delivered") y **corta en seco** a ella apagando el celular (IMG_9483 desde 6,75 s, cuando lo bloquea y lo baja). Placa de 4,3 s; el beat sigue en "nosotros" (5,4 s).

## Borrador N (2026-10-28) — placa de inicio con el diseño de fondo blanco
La usuaria pidió cambiar el gráfico del inicio por `Downloads/MSJwppFondoblanco.ai` (mismo chat, fondo blanco, globos naranjas, sin barra de estado; página 710×1350). `extraer_placa.py [naranja|blanco]` descompone cada diseño (el blanco sale a `img/placa_blanco/`); `PlacaChat` ahora tiene la prop `diseno` con la geometría de cada placa (el blanco recorta 20 u. arriba y comprime el hueco entre "Delivered" y la barra de escribir). La placa naranja sigue disponible (`diseno: "naranja"`). El final `r3-nov_9x16_v1.mp4` no se tocó; si se aprueba se entrega como `_v2`.

## Entrega v2 (2026-10-28) — `out/2026-10-28_docba_r3-nov/final/r3-nov_9x16_v2.mp4`
25,2 s, −14,2 LUFS (pico −1,5 dBFS). Igual que la v1 salvo la placa de inicio (diseño de fondo blanco, `MSJwppFondoblanco.ai`). Glitch corregido: el globo "Yo no puedo ese mes" desaparecía en 2 cuadros (75 y 76) porque las imágenes del chat eran `<img>` y no alcanzaban a cargar en el render; ahora son `<Img>` de Remotion (espera la carga). Verificado en el final cuadro por cuadro. Detector: solo el congelado de la placa final (intencional). Criterios de DOCBA actualizados.
