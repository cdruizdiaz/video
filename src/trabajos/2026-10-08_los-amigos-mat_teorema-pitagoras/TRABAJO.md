# 2026-10-08_los-amigos-mat_teorema-pitagoras

| Campo | Valor |
|---|---|
| Cliente / marca | Los Amigos Mat (`src/marcas/los-amigos-mat` — **falta crear el kit**) |
| Pieza | Teorema de Pitágoras |
| Estado | 🟢 Entregada v9 (falta el logo oficial del canal) |
| Abierto | 2026-10-08 |
| Cerrado | — |

## Brief
- **Objetivo:** **video demo (MVP)** del nuevo canal de YouTube "Los Amigos Mat" (matemática para 1º a 5º año de la secundaria argentina). Animación educativa: dos o más personajes de Los Amigos Mat explican el teorema de Pitágoras con una **demostración geométrica**, en la que se ve que el cuadrado construido sobre la hipotenusa es igual a la suma de los cuadrados construidos sobre los catetos.
- **Formato(s):** 9:16 1080×1920 · 30 fps (Shorts; geometría arriba y personajes en el tercio de abajo)
- **Modo de animación:** plano (2D)
- **Luz de la escena:** no aplica (no hay material filmado)
- **Duración:** 115 s (voces Piper más pausadas y pausas ampliadas para la pizarra)
- **Tono / estilo:** charla entre amigos, con humor liviano; los personajes son adolescentes argentinos con onda urbana
- **Personajes:** de la fila (izq. a der.): Benja, Sofi, Nico, Juli, Santi, Cami. En este video: **Sofi** explica y mueve las piezas; **Benja** duda y hace las preguntas del espectador.
- **Contenido:** gancho de la plaza (3 + 4 cuadras contra la diagonal) → triángulo rectángulo (catetos a, b; hipotenusa c) → contar cuadraditos 3-4-5 (9 + 16 = 25) → demostración por reacomodo de 4 triángulos en un cuadrado de lado a+b → contraejemplo sin ángulo recto → cierre con c² = a² + b² y la diagonal de 5 cuadras
- **Voces:** ElevenLabs desde la v5 (plan Starter del usuario: uso comercial sin atribución): Sofi = Malena (`p7AwDmKvTdoHTBuueGvP`), Benja = Facundo (`qnvusyIjzlSoWYJ0C2Nm`), elegidas por el usuario en una comparación con Edge (`out/<ID>/revision/voces_comparacion/`). Clave en la variable de usuario `ELEVENLABS_API_KEY` (no en el repo). Antes: Edge TTS desde la v3 (pedido del usuario; gratis, con internet): Sofi = `es-AR-ElenaNeural` (velocidad 1,0); Benja = `es-AR-TomasNeural` (velocidad 1,06, tono +12 Hz). Antes: Piper (`es_AR-daniela-high` / `es_MX-claude-high`). Ojo: Edge TTS es un servicio no oficial para uso comercial
- **Textos obligatorios:** _a completar_
- **Llamado a la acción:** _a completar_
- **Entrega:** `out/2026-10-08_los-amigos-mat_teorema-pitagoras/final/`

## Proceso acordado
1. Discutir el contenido didáctico (la demostración geométrica) y la participación de los personajes.
2. Después, pedir el kit de cada personaje que se use (piezas para el rig).
3. Guion (`/guion`) → composición → revisiones.

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-08_los-amigos-mat_teorema-pitagoras/` (fuera del proyecto): `personajes_fila.png` (1774×887, RGBA, los 6 personajes en fila; es una imagen raster, no un SVG con piezas separadas).
- **Proxies y material de trabajo:** `public/trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/` (crudos/, audio/, img/, datos/). `img/personajes_fila.png` es una copia de referencia.
- **Marca:** `public/marcas/los-amigos-mat/` (falta)

## Guiones
- `guion_teorema-pitagoras.md` (generar con `/guion 2026-10-08_los-amigos-mat_teorema-pitagoras`; aplicar cambios con `/aplicar-guion`)

## Decisiones
- **Poses intermedias (v5):** 12 por personaje (`*_intermedias*.png`): pasos hacia cada pose (neutra B y C quedan sin usar: el temblor de espera se veía a los saltos y se sacó en la v6); caminos en `Pitagoras.tsx` (`MOVIMIENTO`). Sofi viene dibujada mirando a la izquierda (sin espejo).
- **Personajes (desde v4):** por poses de cuerpo entero, pedido del usuario: prohibido el rig por extremidades. Tabla gesto → pose en `Pitagoras.tsx` (`POSE_DE_GESTO`); gestos por línea en `datos/lineas.json`.
- **Plantilla:** nueva `ExplicacionGeometrica` (`src/plantillas/ExplicacionGeometrica/`): hoja cuadriculada, pizarra arriba (`pizarra(t)` del trabajo), Benja y Sofi abajo con `PersonajeRig`, subtítulos, voces línea por línea y música con ducking. La línea de tiempo sale de la duración real de las voces (`armarTiempos`). Composición: `amigos-mat-pitagoras-9x16` (`Pitagoras.tsx` + `Pizarra.tsx`).
- **Voces:** `preparar_voces.mjs` lee `datos/lineas.json` (texto, quién, pausa antes, cara y gesto por línea) → Piper + Rhubarb (sin Whisper: tardaba >2 min por línea) → `datos/dialogo.json`.
- **Música:** "Happy Home" (Mixkit 801, Michael Ramir C.; sha256 76b82159ba1d), tema entero en loop con fundidos, normalizado a -13,4 LUFS (`preparar_musica.sh`); ducking en la plantilla (×0,35 bajo la voz, volumen 0,45)
- **Otras:**
  - 2026-10-08: **voces Piper con tildes rotas**: en Windows Python leía el texto de stdin como cp1252 y Piper recibía "Ã¡" en vez de "á" (leía cualquier cosa en vocales acentuadas y eñes). Arreglado en `scripts/voz.mjs` (PYTHONUTF8=1): afecta a todas las voces Piper hechas antes en otros trabajos. Límite que queda: la voz `es_AR-daniela-high` dice "ángulo" suelto como "ámbulo" (probado con Whisper: ni con otra escritura, ni con fonemas forzados, ni más lento); "triángulo" y "rectángulo" salen bien. A Sofi se le sacó la variación de entonación (`expresion`/`ritmo`), que le empastaba las consonantes.
  - 2026-10-08: el diseñador no entrega `.ai`, así que el kit va en **PNG sin fondo** (un PNG por pieza en su lugar, o un PSD con capas; si no, una hoja con las piezas sueltas). Pedido detallado en `KIT_PERSONAJES.md`. Las piezas se generan con ChatGPT a partir de la referencia (pedido del usuario): prompts en `PROMPTS_CHATGPT.md`, en 4 hojas por personaje (cuerpo desarmado, cabezas por expresión, bocas, manos), que van a `C:/Videos/crudos/<ID>/kit/`. Hay que sumar al rig **piezas raster** (hoy solo hay trazados SVG) y un importador de PNG/PSD.
  - 2026-10-08: kit completo (11 hojas en `C:/Videos/crudos/<ID>/kit/`, copiadas a `C:/Videos/personajes/{benja,sofi}/`). Para Benja se usó la hoja `_alt` (sin tiras en el armado) y para Sofi, la hoja de cabezas más grande. Hecho: piezas de imagen en el motor (`src/rig/`), `scripts/rig/importar_png.py` (arma el títere uniendo articulaciones) y los personajes `benja` y `sofi` en la biblioteca (9 caras, bocas A–F, parpadeo y 6 gestos de mano cada uno). Sofi va espejada (`espejo: true`) para quedar enfrentada a Benja. Detalles a pulir: costuras en hombros y cintura.
  - 2026-10-08: regla del usuario: **la ropa siempre tapa las articulaciones**. Sofi ya cumple (buzo y pantalón; mano dentro del puño). Benja: la térmica de manga larga se pinta en el importador (`mangaLarga` en `mapa_png.json`: la piel de brazos y antebrazos pasa a azul marino conservando luces y sombras); los brazos salen de debajo de las mangas cortas de la camiseta (`anclaMunon`, `brazoSinManga`, `borrarPielTorso`).
  - 2026-10-08 (pedido de ajustes): efectos de sonido sincronizados con la pizarra (`efectosPizarra` en `Pizarra.tsx`: pasos y ding en la carrera, pop en etiquetas, tic por cuadradito, whoosh en triángulos y transiciones, ding en resultados; Mixkit 37, 731, 2579, 1492 y 600 "Achievement bell", bajado para este trabajo), saludo final a cámara y logo provisorio diseñado (falta el oficial). Voces: el usuario eligió seguir con Piper; se sumaron `--expresion`, `--ritmo` y `--pausa-oracion` a `scripts/voz.mjs` y un campo `tts` por línea para corregir lecturas sin tocar los subtítulos.

## Entregas
| Archivo (`out/2026-10-08_los-amigos-mat_teorema-pitagoras/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `teorema-pitagoras_9x16_v9.mp4` | 2026-10-09 | 115,1 s, -13,7 LUFS, pico -1,3 dBTP. Resaltado pegado a la boca: el comienzo de cada palabra se ajusta al cambio de boca de Rhubarb más cercano (≤120 ms; 206 de 251 palabras, corrimiento medio 34 ms). Se descartó una tabla de tiempos externa: no coincidía con el audio (desvíos de -1,1 a +0,7 s, varias marcas caían en otra palabra). |
| `teorema-pitagoras_9x16_v8.mp4` | 2026-10-09 | 115,1 s, -13,7 LUFS, pico -1,3 dBTP. Subtítulos resaltados palabra por palabra (marcador amarillo en la que se dice, las que faltan más claras), con tiempos de Whisper alineados al guion (`tiempos_palabras.mjs`: 251 de 256 palabras con tiempo propio). Palabras clave del color de su lado: hipotenusa fucsia, catetos celeste→naranja, nueve/dieciséis/veinticinco del color de su cuadrado, Pitágoras con los tres. Cada parte de una línea larga entra justo cuando se dice su primera palabra. |
| `teorema-pitagoras_9x16_v7.mp4` | 2026-10-08 | 115,1 s, -13,7 LUFS, pico -1,3 dBTP. Vaivén de espera continuo (`src/rig/vaiven.ts`): la misma imagen se balancea 1,6° sobre los pies, corre el peso ±11 px y respira 1,8 %, cada personaje con su fase (la primera prueba, 0,55°/5 px, casi no se notaba). Subtítulos con holgura extra sobre las cabezas por el vaivén. Copia liviana `_whatsapp` (720p). Render con `render_final.sh 7`. |
| `teorema-pitagoras_9x16_v6.mp4` | 2026-10-08 | 115,1 s, -13,7 LUFS, pico -1,3 dBTP. Sin el temblor de espera de la v5 (los personajes saltaban de pose 5 veces por segundo): en espera quedan en la neutra respirando. Medido en una pausa de 2 s: 0 saltos (v5: 10). |
| `teorema-pitagoras_9x16_v5.mp4` | 2026-10-08 | 115,1 s, -13,7 LUFS, pico -1,3 dBTP. Voces ElevenLabs (Malena / Facundo). Poses intermedias: cada gesto entra y sale por sus pasos (3 cuadros por imagen), temblor de espera con neutra B/C, saludo final con la mano que va y viene. Sofi sin espejo (hojas mirando a la izquierda). |
| `teorema-pitagoras_9x16_v4.mp4` | 2026-10-08 | 115,4 s, -13,8 LUFS, pico -1,4 dBTP. Personajes por poses de cuerpo entero (stop motion, sin articulaciones): kit de 9 poses por personaje generado con ChatGPT (`benja_poses.png`, `sofi_poses.png`), importado con `scripts/rig/importar_poses.py`; cada línea muestra la pose de su gesto con "pop" y las bocas A–F encima. Subtítulos con zona segura sobre cada pose. |
| `teorema-pitagoras_9x16_v3.mp4` | 2026-10-08 | 115,4 s, -13,8 LUFS, pico -1,4 dBTP. Voces Edge TTS (es-AR-ElenaNeural / es-AR-TomasNeural); transcripción con Whisper idéntica al guion (tildes, voseo y "ángulo" bien). Pausas ×0,65 para mantener 115 s. |
| `teorema-pitagoras_9x16_v2.mp4` | 2026-10-08 | 115,1 s, -13,7 LUFS, pico -1,5 dBTP. Benja: hombros del torso reconstruidos (sin bolas ni huecos; el celeste de las rayas ya no se confunde con piel), brazos con térmica que salen de abajo de la manga corta en todas las posturas. Subtítulos con zona segura automática (nunca pisan cabezas, pelo ni gorros; máximo 2 renglones, frases largas en partes). Personajes a 600 px. Voces Piper más lentas (Sofi 1,0; Benja 1,05) y pausas ×1,79 para llegar a 115 s. |
| `teorema-pitagoras_9x16_v1.mp4` | 2026-10-08 | Primera entrega: 1080×1920, 30 fps, 98,6 s, CRF 18; audio con loudnorm → -13,8 LUFS, pico -1,5 dBTP. Benja con térmica de manga larga, efectos de sonido, saludo final y logo provisorio. Voces Piper. |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/` desde `C:/Videos/archivo/2026-10-08_los-amigos-mat_teorema-pitagoras/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/` (si los hay).
3. `npx remotion render src/index.ts <id-composición> out/2026-10-08_los-amigos-mat_teorema-pitagoras/final/<salida>_vN.mp4 --crf=18`
