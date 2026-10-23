# 2026-10-21_rastro_pau-mascota

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) |
| Pieza | pau-mascota |
| Estado | 🟡 En curso |
| Abierto | 2026-10-21 |
| Cerrado | — |

## Brief
- **Objetivo:** reel para las redes de RASTRO: Pau cuenta cómo pasamos "de esto a esto" y presenta a Bloomie (la mascota del CEI). Seguir la narrativa de los clips de `pau/`, **cortar las partes donde se ríe** y dejar todo lo necesario para que se entienda.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** plano. Desde el borrador E, Bloomie son los videos animados del cliente sin el fondo blanco (`bloomie_hola_v2.mp4` en la palma, `bloomie_entrada_hola_v3.mp4` en el hombro y en la tarjeta de las etapas): "el Bloomie que vos hiciste tiene el brazo cortado". Hasta el D, rig 2D. El 3D de Blender del borrador A se descartó: "se ve muy robótico" (2026-10-21).
- **Luz de la escena:** suave y cálida, casi frontal, desde arriba a la derecha (`revision/luz_9053.png`, `luz_9054.png`). En plano no se usa; la sombra de Bloomie es una elipse gris plana, como en el GIF.
- **Duración:** 52 s (1560 cuadros: 50 s de montaje + 2 s de placa).
- **Tono / estilo:** dinámico y entretenido; acercamientos donde hagan falta (criterios de `CRITERIOS_REEL.md`).
- **Bloomie:**
  - En "cómo pasamos de esto a esto", Pau levanta la palma: Bloomie **saludando parado sobre la palma**, del tamaño y en el lugar de la mancha azul de `img/ref_palma.png` (≈ x 105–165, y 315–420 sobre 432×767 → ~ x 260–410, y 790–1050 en 1080×1920).
  - En "este es Bloomie": Bloomie **parado donde empieza su hombro izquierdo** (derecha de la imagen; sobre la costura negra de la remera; hasta el C, sentado) durante todo el plano. Referencia `img/ref_hombro.png` (≈ x 285–330, y 350–425 sobre 432×767 → ~ x 710–825, y 875–1065).
- **Tablet:** de "Arrancamos con el ideario" a "ganó la flor": motion graphic con la identidad del CEI que muestra lo que dice (manual de marca en `Clientes/CEI`); de "De ahí la puesta en marcha" a "o Navidad": las grabaciones de Illustrator, **centradas**, con Halloween y Navidad de la grabación 13-48-09. De "Pasamos del papel" a "la animación": motion graphic de las etapas con capturas de las grabaciones. Voz de Pau en off.
- **Textos obligatorios:** subtítulos con la tipografía de RASTRO, **Inter** (desde el borrador B: 500, 64 px, sin trazo negro).
- **Llamado a la acción:** la pregunta final de Pau ("¿Y tu marca? ¿Qué mascota tendría?") + placa RASTRO "Mascotas para marcas · somosrastro.com.ar" (propuesta, a confirmar).
- **Entrega:** `out/2026-10-21_rastro_pau-mascota/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-21_rastro_pau-mascota/` (fuera del proyecto; copia verificada, 1 586 153 792 bytes)
  - `pau/IMG_9053, 9054, 9055, 9059, 9060, 9061, 9064.MOV`: iPhone HEVC 3840×2160 rotado −90° (vertical), 29,97 fps, **rango completo** (`yuvj420p`, `pc`), SDR bt709.
  - `grab pantalla/…11-58-24.mp4` (1920×1020, 30 fps, 6 min 39 s) y `…11-25-27.mp4` (1920×1020, 60 fps, 16 min 1 s): grabaciones del diseño en Photoshop, sin audio útil.
  - `grab pantalla/…13-48-09.mp4` (1920×1020, 60 fps, 6 min 21 s, sumada el 2026-10-21): disfraces de Halloween y Navidad.
  - `img/`: referencias de posición de Bloomie (copiadas como `public/…/img/ref_palma.png` y `ref_hombro.png`).
- **Proxies:** `public/trabajos/2026-10-21_rastro_pau-mascota/crudos/` (`proxies.sh`): `IMG_90xx.mp4` 1080×1920 30 fps, rango completo → estándar; `IMG_9053p.mp4` recorte 1080×1920 del 4K sobre la hoja de bocetos; `pantalla1.mp4` = 11-58-24, `pantalla2.mp4` = 11-25-27, `pantalla3.mp4` = 13-48-09 (1920×1020 30 fps, sin audio); derivados: `IMG_9053b/9054b.mp4` (con Bloomie, mudos), `pantalla_diseno.mp4`.
- **Gráficos del CEI:** `img/flor.png` e `img/bigben.png` (blancos con alfa, sacados de la pág. 9 del manual a 216 ppp); paleta y fuentes de `src/marcas/cei/marca.ts`.
- **Audio:** `audio/voz/<clip>.wav` (`preparar_voz.sh`), `audio/musica.wav` (`preparar_musica.sh`), `audio/pop_*.wav`, `sello_*.wav` (`preparar_sonidos.sh`).
- **Marca:** `public/marcas/rastro/`

## Guiones
- `guion_pau-mascota.md` (generar con `/guion 2026-10-21_rastro_pau-mascota`; aplicar cambios con `/aplicar-guion 2026-10-21_rastro_pau-mascota`)

## Decisiones
- **Plantilla:** `HablaSubtitulada` envuelta en `ReelPau.tsx` (coberturas sobre las tomas de la tablet y efectos sueltos). La plantilla ganó `sobreVideo` (capa sobre el video y debajo de logo y subtítulos) y, en subtítulos "reel", `peso` y `sinBorde`. Composición `rastro-pau-mascota-reel`.
- **Bloomie (borrador E):** `recortar_bloomie.py` saca el fondo blanco de los videos del cliente (lo claro y sin color conectado al borde, más los huecos blancos encerrados que no tocan negro: los ojos quedan; la sombra gris pasa a negro semitransparente; borde desmezclado del blanco) → `crudos/bloomie_palma.webm` (v2, 0–2,4 s) y `bloomie_hombro.webm` (v3 1,6→5,0 s, ya acomodado, + reversa 5,0→3,45 s para cubrir los 4,95 s del plano), VP9 con alfa, y `datos/bloomie_<x>_video.json` (pies, alto). `BloomieSobreVideo` los pone con `<OffthreadVideo transparent>` en el ancla: palma 210 px de alto desde el cuadro 100 (con el pop de escala); hombro 175 px desde el cuadro 39 (el reel usa IMG_9054 desde 1,3 s), con la sombra proyectada suave. Control: `revision/recorte_palma.png`, `recorte_hombro.png`, `e_bloomie.png`.
  - Palma, borrador E: "más arriba, en la zona más clara de la palma": ancla (312, 1072) en el cuadro 120, sobre la base de los dedos (en D, (335, 1098), en el centro).
- **Lugar de Bloomie:** `seguir_puntos.py` (flujo óptico de OpenCV sobre un punto preciso, desde un cuadro nítido hacia adelante y atrás; desde el borrador D) → `armar_bloomie.mjs` → `BloomieSobreVideo` (PersonajeRig 2D + sombra plana) renderizado mudo como `crudos/IMG_9053b.mp4` / `IMG_9054b.mp4`: los zooms del reel mueven a Pau y Bloomie juntos.
  - Borrador D ("se sigue moviendo mucho… busca un punto preciso… que no se mueva de allí"; "sin ese movimiento de intento de seguimiento raro"): se abandona la pose de MediaPipe (no marca un punto de la piel ni de la tela: Bloomie patinaba). Anclas `datos/ancla_palma.json` (centro de la palma, (335, 1098) en el cuadro 120) y `ancla_hombro.json` (inicio del hombro sobre la costura, (700, 1057) en el cuadro 39): rasgos solo en una zona de textura (palma; tela y cuello acanalado, sin fondo), similitud por cuadro con RANSAC, giro al 50/60 %, suavizado σ 1. Control: `revision/ancla_palma.png`, `ancla_hombro.png`.
  - Hasta el C: pose de MediaPipe con suavizado gaussiano (temblor del hombro de 2,3 a 0,1 px/cuadro²).
  - Palma: ancla de la palma (hasta el C: media de muñeca/meñique/índice der. + (−8, −42) px), escala 0,52, desde el cuadro 100 (palma ya arriba) con pop rápido (10 cuadros), patas abiertas 10 pt, cara "feliz", saluda; pop de sonido en 3,38 s.
  - Hombro (D): parado sobre el ancla del hombro, escala 0,42, patas abiertas 8 pt, cara "feliz", parpadea y saluda tranquilo todo el plano; sombra de contacto y sombra proyectada más chica y difuminada (achatado −0,22, sesgo 24°, opacidad 0,22, desenfoque 16 px; en C −0,42, 32°, 0,5, 6 px: "muy grotesca").
  - Hombro hasta el C: sentado, punto 11 + (−55, −60) px, escala 0,44, sigue el cuerpo (σ 9 cuadros) y la mitad del giro del hombro; "chill": cara "feliz", saluda tranquilo todo el plano, pies colgando con un balanceo lento (44 cuadros); sombra de contacto y sombra proyectada (su silueta achatada hacia abajo a la izquierda, sobre la remera). Antes (B): miraba a Pau, vaivén y saludo solo en "Este es Bloomie".
- **Montaje** (borrador B; los cambios pedidos el 2026-10-21 con el valor anterior):
  - 9053: general 0–1,78 s; en "esto" corte a la hoja de bocetos (`IMG_9053p`, 4K) mientras está nítida, hasta 2,42 s; se saca la hoja borrosa que baja; general desde 3,36 s (antes: general 0–4,8 s con empuje 1,3× a la palma).
  - 9053, borrador C: empieza en 0,6 s (se oía el final de "acción" en 0,09–0,18 s) y el general de "a esto" corta en 3,93 s, apenas termina la frase (antes 4,8 s).
  - 9053, borrador D ("dejalo unos segundos más porque no se llega a ver el personaje"): la voz sigue hasta 4,85 s (antes de "Ahí quedo") y la imagen 0,45 s más (`pausaMs`, ambiente de 4,0 s), hasta el final del clip: Bloomie ~1,9 s en pantalla.
  - 9055: cerrado 1,45× desde "cuatro" (5,17 s; antes 4,12 s, en "nos dimos cuenta").
  - Afuera: "Ahí quedo" (9053), el primer intento de 9059, las tomas fallidas y risas de 9060 (12–17 s y 28–51 s) y de 9061 (0–8,7 s), la risa final de 9055.
- **Etapas (EtapasBloomie.tsx, borrador C):** mismo lenguaje que el ideario; tres tarjetas en zigzag unidas por una línea punteada, cada una con un pop en su palabra: 1 · Papel (la hoja, `img/etapa_papel.png`), 2 · Illustrator (vectorizado `etapa_vector.png` → a color `etapa_color.png` en el segundo "Illustrator"), 3 · Animación. Capturas: `capturas_etapas.sh`.
  - Borrador D: la tarjeta 1 entra en "Pasamos" (antes en "papel": quedaba ~1 s de fondo vacío) y la grabación de Navidad sigue encima hasta ahí (cobertura `video` con `extra`, dibujada después de las etapas; el tramo del reno pasó de 20 a 24 cuadros). La 3 usa el video `bloomie_entrada_hola_v3.mp4` (copiado a `crudos/bloomie_hola_v3.mp4`; original en `carpetaCrudos/…/otros/`) desde 1,8 s (ya entró y saluda), "que no tiene cortado el brazo" (antes el rig 2D saltando). `pausaMs: 1000` (antes 500), ambiente de 7,5 s.
- **Ideario (IdearioCei.tsx):** fondo Royal Blue con flores en relieve; "Ideario" en Fraunces con subrayado; dos tarjetas: la flor gira y entra en "flor", el Big Ben sube en "Big Ben"; dudan en "por descarte"; en "trillado" se estampan copias del Big Ben (pops en escalera) y se tacha; en "patriotas" entra la bandera (tres franjas iguales de 370 px, la blanca centrada en la flor: queda como el sol; borrador C), detrás de la flor y **por encima de la tarjeta del Big Ben**: tapa el rectángulo, el Big Ben y el tachado naranja (borrador D; en C la tarjeta del Big Ben era opaca y tapaba la bandera: "dejala como estaba antes con la línea de puntos"); las copias del Big Ben quedan fuera de las tarjetas y se van con la bandera; en "ganó la flor" se va el Big Ben y la flor crece al centro (×1,15, dentro de la franja blanca) con papelitos. Tiempos de la transcripción (`beats` en `composiciones.ts`).
- **Pantallas:** `preparar_pantallas.sh`: un solo timelapse (321 cuadros) en tramos que siguen el audio: formas → color → cara → anteojos de telaraña ("fechas especiales") → murciélago ("Halloween") → reno ("Navidad"). Tarjeta centrada (y = 960).
- **Subtítulos:** `armar_transcripcion.mjs` (Bloomy→Bloomie, ilustrator→Illustrator, fin de "flor." medido); grupos a mano en `composiciones.ts`, sin amarillo. Desde B: Inter 500, 64 px, sin trazo, sombra difusa (antes 700, 74 px, borde negro y sombra paralela).
- **Audio:**
  - Voz, borrador E ("en algunas palabras se apaga, tiene que estar toda al mismo nivel"): medido con `medir_palabras.py` (nivel de cada palabra con los tiempos de la transcripción): DeepFilterNet se comía palabras suaves ("En el" de IMG_9055: −40 dB contra −16 en la original); la puerta del D no cambiaba nada y se sacó. `nivelar_voz.py` (lo llama `preparar_voz.sh`): las palabras que el filtro bajó más de 9 dB respecto de la original vuelven de la original, y cada palabra va a la mediana del clip (−6…+12 dB, rampas de 30 ms; las pausas no suben). Desvío entre palabras de 5,0 a 3,2 dB, pausas a −61 dB como antes. Quedan bajos "Este" (Whisper lo marca corrido; la palabra real está a nivel) y un "y" soplado de IMG_9060 (24,1 s) que en la original casi no se dice.
  - Voz, borrador D ("el ruido sigue medio flojo, pero si esto te hace cambiar la voz olvidate, dejá el original"): el filtro de la voz no se toca; una puerta suave (sacada en E) (`agate`, umbral −45 dBFS, −14 dB, suelta 350 ms) baja el fondo solo en las pausas: de −62 a −67/−73 dB; la voz medida queda igual (−19,2 LUFS).
  - Voz (borrador C: "el ruido de fondo sigue estando"): pasa-altos 70 Hz + DeepFilterNet `--atten-lim 24`, cada toma a −19 LUFS con limitador solo en los picos. El micrófono grabó muy bajo (−40 LUFS) y la voz se sube ~21 dB: con `--atten-lim 10` el fondo quedaba a −40 dB; con 24, a −58/−63 dB. **Sin bajar la entrada 6 dB** (truco de Volto): con la voz tan baja, DeepFilterNet la confundía con ruido y el tramo del ideario perdía 20 dB (el borrador B lo tenía más bajo que el resto).
  - **Desfase del borrador A:** cada render de Remotion atrasa el audio 42,7 ms (relleno del AAC) y el primer clip pasó por dos renders: la voz iba 85 ms tarde ("se mueve la boca antes que el audio"). Desde B: los clips con Bloomie son mudos, la voz sale de `audio/voz/` y `terminar_audio.sh` adelanta el audio 42,7 ms. Verificado por correlación: 0 ms.
- **Música:** **sin música desde el borrador D** ("elimina la música, no me gusta, después la haré yo"). Hasta el C: Mixkit 1142 "Gummies" (Michael Ramir C., sha256 `28a4219e2b0c`), elegida por el cliente entre Gummies, Owies Ukulele y Okay; 0–51,2 s del tema, fundidos, −14 LUFS; bajo la voz −27 dB (≈22 dB debajo de la voz; −19 en B era "extremadamente alta") y −12 dB en la placa.
- **Efectos:** pops de la biblioteca (Mixkit 2357 y 2356, ya bajados): Bloomie en la palma, flor, Big Ben, cuatro sellos en escalera de tono, "ganó", tres etapas en escalera.
- **Revisión:** `revision/revisar_rastro-pau-mascota-reel.png`, `bloomie2d_palma.png`, `bloomie2d_hombro.png`, `ideario.png`, `papel_4k.png`.
- **Borradores:**
  - `revision/borrador_pau-mascota_9x16_a.mp4` (2026-10-21, 52,1 s, −14,3 LUFS): Bloomie 3D, grabaciones en toda la parte de la tablet, sin música.
  - `revision/borrador_pau-mascota_9x16_b.mp4` (2026-10-21, 51,2 s, −14,5 LUFS, pico −1,3 dBFS): todos los pedidos de la primera revisión.
  - `revision/borrador_pau-mascota_9x16_c.mp4` (2026-10-21, 50,1 s, −14,2 LUFS, pico −1,2 dBFS, sincronía 0 ms): sin "acción", corte en "a esto", Bloomie sin vibración y con sombra, bandera y sellos acomodados, motion graphic de las etapas, música más baja, menos ruido.
  - `revision/borrador_pau-mascota_9x16_d.mp4` (2026-10-21, 52 s, −14,2 LUFS, pico −1,3 dBFS): sin música, puerta en las pausas de la voz, "a esto" 1,4 s más, Bloomie anclado a un punto fijo de la palma y del hombro (parado, sombra suave), tarjeta del Big Ben con línea punteada y tapada por la bandera, Navidad hasta "Pasamos", tarjeta 3 con el video `bloomie_entrada_hola_v3`.
  - `revision/borrador_pau-mascota_9x16_e.mp4` (2026-10-21, 52 s, −14,1 LUFS, pico −1,2 dBFS): Bloomie de los videos del cliente sin fondo (palma: v2, más arriba en la zona clara; hombro: v3), voz nivelada palabra por palabra y sin palabras comidas por el filtro.

## Entregas
| Archivo (`out/2026-10-21_rastro_pau-mascota/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-21_rastro_pau-mascota/` desde `C:/Videos/archivo/2026-10-21_rastro_pau-mascota/` (si el trabajo está cerrado).
2. `bash …/proxies.sh`, `bash …/preparar_pantallas.sh`, `bash …/preparar_voz.sh`, `bash …/preparar_sonidos.sh`; copiar `bloomie_entrada_hola_v3.mp4` a `crudos/bloomie_hola_v3.mp4`; `python …/recortar_bloomie.py` (lee los videos de `carpetaCrudos/<ID>/otros/`); `python …/seguir_puntos.py`; `node …/armar_bloomie.mjs`; `node …/armar_transcripcion.mjs`; clips con Bloomie: `npx remotion render src/index.ts rastro-pau-mascota-bloomie-palma public/trabajos/<ID>/crudos/IMG_9053b.mp4 --crf=16 --muted` (ídem hombro → IMG_9054b).
3. `npx remotion render src/index.ts rastro-pau-mascota-reel <tmp>.mp4 --crf=18` y `bash scripts/terminar_audio.sh <tmp>.mp4 out/<ID>/final/pau-mascota_9x16_vN.mp4` (corrige el atraso del AAC y deja −14 LUFS).
