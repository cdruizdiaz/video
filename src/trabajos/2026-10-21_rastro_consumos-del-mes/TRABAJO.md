# 2026-10-21_rastro_consumos-del-mes

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) |
| Pieza | consumos-del-mes |
| Estado | 🟡 En curso |
| Abierto | 2026-10-21 |
| Cerrado | — |

## Brief
- **Objetivo:** reel para las redes de RASTRO: Pau cuenta sus consumos del mes (series, libros, música, etc.). Armarlo **dinámico** y con la **narrativa más clara** posible (ordenar y recortar las tomas para que se entienda).
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** no lleva personaje animado.
- **Luz de la escena:** no aplica (sin personaje 2,5D/3D).
- **Duración:** 55,2 s (1657 cuadros), sin placa: termina en "Me lo dejan en los comentarios" (pedido 2026-10-21; antes 57,1 s con 2 s de placa).
- **Tono / estilo:** dinámico y entretenido; acercamientos y cambios de plano según `CRITERIOS_REEL.md`.
- **Gráficos de referencia:** a medida que habla, imágenes o gráficos de lo que menciona:
  - obras conocidas (p. ej. **American Horror Story**): la **portada o póster real**, sacada de internet;
  - el resto: gráficos hechos por nosotros (motion graphics con la identidad de RASTRO).
  - **Cada gráfico/imagen con la estética de lo que nombra** (pedido 2026-10-21): el libro en papel crema, serif azul marino y filetes (tapa de Blackie Books); *AHS 13* en blanco/negro con encaje y rojo; Lali en jean, strass/cadenas y la estrella de la hebilla; etc.
  - Referencias (de la transcripción): 9085 intro → título "Consumos del mes"; 9086 *Música de mierda* (Carl Wilson) + "guilty pleasure"; 9088 *American Horror Story* temp. 13 + vestuario/música/edición + **foto de Evan Peters** (pedido); 9089 programa **"No te cases"** del canal **Factoria** (Pau dice "La Fábrica": se equivoca; pedido del cliente: asterisco cómico con el texto correcto resaltado, "*la Factoria") + miniaturas del cliente + Photoshop (ventana genérica, sin logo); 9091 *No vayas a atender cuando el demonio llama* (Lali) + "no haber ido a River"; 9092–9093 audiolibro *Dar de leer a los niños*, de Yolanda Reyes (Audiolibros Por qué leer, Spotify; confirmado por el cliente con capturas) + Día de la Madre + "dar tiempo"; 9094 pregunta a la comunidad → comentarios.
- **Textos obligatorios:** subtítulos como en `2026-10-21_rastro_pau-mascota`: Inter 500, 64 px, blancos sin trazo, sombra difusa, estilo "reel", secos.
- **Llamado a la acción:** la pregunta final de Pau ("¿qué están leyendo, qué están consumiendo? Déjenlo en los comentarios"). Sin placa (se sacó en la revisión del B).
- **Música:** no ("sacale la música", revisión del B). Antes: Mixkit 738 "Hip Hop 02".
- **Entrega:** `out/2026-10-21_rastro_consumos-del-mes/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-21_rastro_consumos-del-mes/` (fuera del proyecto; copia verificada, 247 001 207 bytes), de `Documents/RASTRO/Contenido RASTRO/pau consumos del mes/`:
  - `IMG_9085, 9086, 9088, 9089, 9091, 9092, 9093, 9094.MOV`: iPhone HEVC 3840×2160 rotado −90° (vertical), 29,97 fps, rango completo (`yuvj420p`, `pc`).
- **Imágenes de internet** (`img/`, uso de referencia/comentario):
  - `musica_de_mierda.jpg`: tapa de Blackie Books (Casa del Libro, ISBN 9788416290482, 1636×2549 → 900 px).
  - `ahs13.png`: póster de *AHS 13* (FX), de Wikipedia (282×353) subido ×4 con Real-ESRGAN.
  - `lali_nvaacedl.jpg`: tapa del álbum (Sony Music Argentina, 2025), de Apple Music/iTunes, 1500×1500.
  - `notecases_1..4.jpg`: miniaturas de YouTube de "No te cases" (Factoria), capturas del cliente (`IMAGENES/` de la carpeta del cliente; originales en `carpetaCrudos/<ID>/IMAGENES/`), recortadas a 16:9 sin la interfaz → 1120×630.
  - `dar_de_leer_spotify.jpg`: la tarjeta de Spotify del audiolibro, recortada de la captura del cliente (`audiolibri/`; copia en `carpetaCrudos/<ID>/audiolibri/`) → 922×440. (`dar_de_leer.png`, la tapa sola, ya no se usa.)
  - `yolanda_reyes.jpg`: cara de Yolanda Reyes recortada a 500×500 de la foto del cliente (`yolanda.jpg`; original en `carpetaCrudos/<ID>/yolanda_cliente.jpg`). La de Wikimedia (borrador C) quedó en `yolanda_reyes_commons.jpg`, sin usar.
  - `evan_peters.jpg`: foto de Gage Skidmore, Wikimedia Commons, **CC BY-SA 4.0: lleva crédito** ("Foto: Gage Skidmore / CC BY-SA 4.0").
- **Proxies y material de trabajo:** `public/trabajos/2026-10-21_rastro_consumos-del-mes/` (crudos/, audio/, img/, datos/). Proxies con `proxies.sh`: 1080×1920, 30 fps, rango completo → estándar.
- **Audio:** `audio/voz/<clip>.wav` (`preparar_voz.sh`), `audio/musica.wav` (`preparar_musica.sh`), `audio/pop_*`, `seco_*`, `boing`, `clic`, `sello` (`preparar_sonidos.sh`).
- **Marca:** `public/marcas/rastro/`

## Guiones
- `guion_consumos-del-mes.md` (generar con `/guion 2026-10-21_rastro_consumos-del-mes`; aplicar cambios con `/aplicar-guion 2026-10-21_rastro_consumos-del-mes`)

## Decisiones
- **Plantilla:** `HablaSubtitulada` (reel de persona hablando; aplicar `CRITERIOS_REEL.md` de entrada), con coberturas/insertos de imágenes y gráficos como `ReelPau` de pau-mascota.
- **Música:** Mixkit 738 "Hip Hop 02" (Lily J, sha256 `4b7bc45aedd3`), 0–57,2 s del tema, fundidos, −14 LUFS (`preparar_musica.sh`); bajo la voz −27 dB, −12 dB en la placa.
- **Componentes:** `ReelConsumos.tsx` (HablaSubtitulada + capa de gráficos anclados al ms de su palabra, salen en seco con su toma o en `hastaMs`) y `GraficosConsumos.tsx` (un gráfico por cosa nombrada, cada uno con su estética). Composición `rastro-consumos-del-mes-reel`.
- **Montaje:** 13 tomas cortadas en los silencios (energía de la voz); IMG_9092 solo la segunda toma (8,66–14,42 s; la primera se corta en "el audiolibro"). Planos: abierto 1,08 con el gráfico arriba de la cabeza ↔ cerrado 1,45 con el gráfico a la altura del pecho; en IMG_9088 el cambio de plano entre "impecable" y "Y está Evan Peters" va sin corte (no hay silencio).
- **Transcripción** (`armar_transcripcion.mjs`): Whisper sin VAD; IMG_9092 retranscripto desde 8,5 s (Whisper había apretado la segunda toma en 12,5–14,3 s). Correcciones: "guin de pleasure" → "guilty pleasure", "un river" → "a River"; "Catona" y "La Fábrica" como los dice Pau (confirmado por el cliente). Finales medidos con la energía: "embarques," 7,10 s y "pensando." 12,62 s (el DTW los estiraba sobre la pausa).
- **Voz:** `preparar_voz.sh` + `nivelar_voz.py` (copiados de pau-mascota): DeepFilterNet `--atten-lim 24`, palabras comidas recuperadas de la original ("El programa de La" en IMG_9089), cada palabra a la mediana, −19 LUFS por toma.
- **Efectos** (`preparar_sonidos.sh`): pops de la biblioteca (Mixkit 2357 y 2356) en escalera, "boing" (2894) en "*la Factoria", clic (1114) en la ventana de diseño, sello.
- **Placa:** RASTRO oscura por corte, "@somos_rastro · somosrastro.com.ar" (pedido 2026-10-21; en A, frase propuesta "Contenido con criterio").
- **Revisión del borrador B (2026-10-21, pedido del cliente):**
  - sin música y sin placa: termina en "los comentarios";
  - subtítulos "su creatipa de confianza" y "en esta comunidad de creatipas" (término de RASTRO; Whisper oía "creativa" y no oyó el "de"; corregido en `armar_transcripcion.mjs`);
  - **todos los gráficos en el aire de arriba de la cabeza**: el cerrado 1,45 pasó a anclarse al 60 % (antes 72 %) para dejar aire; `ARRIBA_Y` 290 (abierto), `ARRIBA_CERRADO_Y` 230 (cerrado);
  - fuera: la tapa de *Música de mierda* (Pau ya muestra el libro), la entrada de River con "ME LO PERDÍ", "Día de la Madre" y "dar tiempo"; en "dar tiempo", recorte seco a un plano 1,7;
  - vestuario/música/edición en Cinzel raspada (las letras de AHS son propias de FX; Cinzel es la libre más parecida);
  - Evan Peters y las miniaturas de Factoria en círculos, sin textos; "La Fábrica" se tacha y aparece "*la Factoria";
  - el audiolibro con la tarjeta de Spotify del cliente y la cara de Yolanda Reyes en un círculo en "Yolanda";
  - los pops de "qué consume" al 45 %.
- **Revisión del borrador C (2026-10-21, pedido del cliente):**
  - textos en **Inter** con los colores de cada estética (guilty pleasure, vestuario/música/edición, No te cases, Factoria), **centrados**;
  - todos los gráficos a la **misma distancia de la cabeza**: `y` = borde de abajo, 80 px arriba del pelo medido en un cuadro de cada uno (`sobre()` en `composiciones.ts`; hoja `graficos_d.png`);
  - Evan Peters más abajo y más grande, sin crédito (pedido del cliente, avisado: la licencia CC BY-SA pide crédito; sugerido ponerlo en el texto de la publicación);
  - "hot horror" junto y sin coma; "El programa de La Factoria" en el subtítulo; "del día de la madre" en minúsculas;
  - **audio de "El programa de La"**: DeepFilterNet lo borraba (−24 dB) y `nivelar_voz.py` lo traía de la original con su ruido. Ahora `preparar_voz.sh` filtra IMG_9089 también desde los 4 s y usa esa pasada hasta los 6 s; no vuelve nada de la original;
  - sin efectos de sonido en "La Fábrica" / "No te cases";
  - "No te cases" otra vez como tarjeta (degradé, etiqueta, miniaturas), en la toma de "Juli y Catona" (en el cerrado de "La Fábrica" no entraban los dos centrados);
  - Yolanda Reyes con la foto del cliente (`yolanda.jpg`; original en `carpetaCrudos/<ID>/yolanda_cliente.jpg`).
- **Revisión:** `revision/revisar_rastro-consumos-del-mes-reel.png`, `graficos_a.png` (cada gráfico en su punto), `clips.png`.
- **Borradores:**
  - `revision/borrador_consumos-del-mes_9x16_a.mp4` (2026-10-21, 57,2 s, −14 LUFS, pico −1,3 dBFS): primer borrador completo.
  - `revision/borrador_consumos-del-mes_9x16_b.mp4` (2026-10-21, 57,2 s, −14 LUFS, pico −1,3 dBFS): placa con "@somos_rastro".
  - `revision/borrador_consumos-del-mes_9x16_c.mp4` (2026-10-21, 55,2 s, −14 LUFS, pico −1,4 dBFS): la revisión del B (arriba). Hojas: `revisar_rastro-consumos-del-mes-reel.png`, `graficos_c.png`.
  - `revision/borrador_consumos-del-mes_9x16_d.mp4` (2026-10-21, 55,2 s, −14 LUFS, pico −1,4 dBFS): la revisión del C (arriba). Hoja: `graficos_d.png`.

## Entregas
| Archivo (`out/2026-10-21_rastro_consumos-del-mes/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-21_rastro_consumos-del-mes/` desde `C:/Videos/archivo/2026-10-21_rastro_consumos-del-mes/` (si el trabajo está cerrado).
2. `bash …/proxies.sh`; `node scripts/transcribir.mjs` por clip (`--sin-vad`) y la segunda pasada de IMG_9092 desde 8,5 s; `node …/armar_transcripcion.mjs`; `bash …/preparar_voz.sh`, `bash …/preparar_sonidos.sh` (`preparar_musica.sh` ya no hace falta: va sin música).
3. `npx remotion render src/index.ts rastro-consumos-del-mes-reel <tmp>.mp4 --crf=18` y `bash scripts/terminar_audio.sh <tmp>.mp4 out/2026-10-21_rastro_consumos-del-mes/final/consumos-del-mes_9x16_vN.mp4` (corrige el atraso del AAC y deja −14 LUFS).
