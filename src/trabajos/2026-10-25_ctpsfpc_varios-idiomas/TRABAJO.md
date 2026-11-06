# 2026-10-25_ctpsfpc_varios-idiomas

| Campo | Valor |
|---|---|
| Cliente / marca | Colegio de Traductores de la Provincia de Santa Fe — 1.ª Circunscripción (`src/marcas/ctpsfpc`) |
| Pieza | varios-idiomas: "Un traductor matriculado no solo firma traducciones" (traducción, ratificación, dictamen) |
| Estado | 🟡 Entregado v2, esperando aprobación del cliente (sin música: la pone el cliente). Cerrar con `/cerrar-trabajo` cuando aprueben |
| Abierto | 2026-10-25 |
| Cerrado | — |

## Brief
- **Objetivo:** reel informativo. Qué más puede firmar un traductor matriculado:
  - traducción, ratificación y dictamen;
  - la legalización del Colegio;
  - llamado al buscador de traductores e intérpretes.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** — (sin personajes)
- **Duración:** ~53 s (49,8 s de tomas + 3,5 s de placa)
- **Tono / estilo:** como los reels que se vienen publicando ("Reel idóneo.mov"):
  - cortes secos y planos del celular sin zoom;
  - uniones con el movimiento de cámara;
  - subtítulos chicos a la altura de la cintura.
- **Pedidos del cliente (2026-10-25):**
  - las tomas en el orden de los nombres de archivo (IMG_8365 → IMG_8422);
  - cada toma arranca apenas la persona empieza a hablar;
  - las que empiezan o terminan con un movimiento de cámara se unen para que la transición se vea limpia;
  - subtítulos en Be Vietnam Pro SemiBold "15", blancos, con sombra negra difusa al 25 % (valores de CapCut);
  - música entre institucional y corporativa;
  - placa final animada con el logo y los colores del Social Media Playbook.
- **Textos obligatorios:** —
- **Llamado a la acción:** "¿Necesitás un profesional matriculado? Encontralos en nuestro buscador…" (lo dice ella).
- **Entrega:** `out/2026-10-25_ctpsfpc_varios-idiomas/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-25_ctpsfpc_varios-idiomas/`, fuera del proyecto.
  - 9 MOV de iPhone: HEVC 1920×1080 rotados (vertical), 60 fps, SDR bt709 rango estándar.
  - Más `referencia_reel-idoneo.mov`.
- **Proxies y material de trabajo:** `public/trabajos/2026-10-25_ctpsfpc_varios-idiomas/`.
  - Proxies 1080×1920, 30 fps, libx264 crf 20.
  - Voz en `audio/voz/`, música en `audio/musica.wav`.
  - Transcripción en `datos/`.
- **Marca:** `public/marcas/ctpsfpc/` (logos SVG, fuentes Be Vietnam Pro y Almarai). Criterios del cliente: `src/marcas/ctpsfpc/CRITERIOS.md`.

| Clip | Duración | Uso | Unión |
|---|---|---|---|
| IMG_8365 | 9,07 s | 4,05–9,07 | termina con paneo a la calle → |
| IMG_8369 | 2,40 s | 0–2,40 | → paneo; termina con tilt al cielo → |
| IMG_8378 | 11,02 s | 0,20–9,85 | → tilt desde el piso (sin el pie de quien filma) |
| IMG_8384 | 3,83 s | 1,65–3,83 | termina con paneo → |
| IMG_8387 | 7,89 s | 0–7,15 | → paneo |
| IMG_8389 | 3,48 s | 1,48–3,48 | termina con tilt hacia arriba → |
| IMG_8412 | 10,42 s | 0–10,40 | → tilt desde el piso |
| IMG_8418 | 7,65 s | 2,48–7,65 | termina con tilt a las columnas → |
| IMG_8422 | 5,55 s | 0–5,55 | → tilt desde el piso |

## Guiones
- `guion_varios-idiomas.md` (generar o actualizar con `/guion 2026-10-25_ctpsfpc_varios-idiomas`; aplicar cambios con `/aplicar-guion`)

## Decisiones
- **Plantilla:** `ReelCtpsfpc` (nueva, reutilizable para el cliente) = `HablaSubtitulada` + `PlacaCtpsfpc`.
  - Se sumaron a `HablaSubtitulada` las opciones `subtitulos.fuente`, `subtitulos.sombra` y `subtitulos.y`.
- **Música:** ninguna (desde el borrador C la pone el cliente). En el borrador B: Mixkit 33 "Motivating Mornings" (`preparar_musica.sh`).
  - Desde 43,65 s, 48,9 s, −14 LUFS.
  - −21 dB bajo la voz y −4 dB en la placa.
  - Antes: 440 "Infinity" (descartada: "media tétrica").
- **Voz:** micrófono corbatero, −13 a −16 LUFS en el original. Pasa-altos 70 Hz + DeepFilterNet 12 dB, cada clip a −19 LUFS (`preparar_voz.sh`).
- **Subtítulos:** Be Vietnam Pro SemiBold, 72 px (≈ "15" de CapCut, medido en la referencia), centro y = 1500, sombra `0 4px 14px rgba(0,0,0,.25)`, en seco, escritos a mano.
- **Confirmado por el cliente (2026-10-25):**
  - "¿Necesitás" con voseo: OK. "Hológrafas" → **"ológrafas"**, sin h (corrección del 2026-10-25, v2).
  - El contenido es el correcto (el reel habla de lo que firma un matriculado).
  - Subtítulos: cada grupo sale apenas termina su última palabra (`colaMs: 0`; antes 350 ms, que en los barridos al cielo dejaban la letra sobre las nubes).

## Pedidos sobre el borrador A (2026-10-25) → borrador B
- **Uniones por movimiento de cámara: un solo movimiento.** La anterior se corta apenas acelera y la siguiente entra ya en movimiento (velocidades medidas cuadro a cuadro).

  | Toma | Antes (ms) | Ahora (ms) |
  |---|---|---|
  | 8365 | 4050–9070 | 4050–8470 |
  | 8369 | 0–2398 | 530–1900 |
  | 8378 | 200–9850 | 330–9850 |
  | 8384 | 1650–3833 | 1650–3270 |
  | 8387 | 0–7150 | 420–7150 |
  | 8389 | 1480–3483 | 1480–2870 |
  | 8412 | 0–10400 | 300–10400 |
  | 8418 | 2480–7650 | 2480–7170 |
  | 8422 | 0–5552 | 630–5552 |

  Duración: 53,1 → 48,8 s.
- **Música.**
  - En todo el video, más presente bajo la voz: −27 → −21 dB.
  - Sube con la placa: −6 → −4 dB.
  - Más energía: 440 "Infinity" → 33 "Motivating Mornings", desde 43,65 s (un compás), así el final del tema cae con el de la placa.
- **Placa.**
  - Suma "www.traductoresantafe.org.ar" debajo del logo; el conjunto va centrado.
  - Dura 3,5 → 4 s.
- **Sombra de los subtítulos** un poco más notoria y difusa: `0 4px 14px` al 25 % → `0 3px 18px` al 45 %.

## Pedidos sobre el borrador B (2026-10-25) → borrador C
- **Cortes nuevos:** "están perfectos".
- **Sin música:** la pone el cliente después.
  - Antes, en el borrador B: Mixkit 33.
  - `preparar_musica.sh` queda por si se retoma.
- **Placas de explicación con motion graphics** después de "Primero / Segundo / Tercero" (`PlacaExplicacion`): pantalla completa, bento + Bauhaus, Almarai en los titulares y Be Vietnam en los textos.

  | Placa | Clip, desde | Módulos (ms del clip en que entra cada uno) |
  |---|---|---|
  | 01 Traducción | IMG_8378, 1,48 s | Ológrafa 2060 · Digital 3880 · Responsabilidad 5740 · Su par de idiomas 8780 |
  | 02 Ratificación | IMG_8387, 1,48 s | Responsabilidad 2610 · Traducción de otro 3820 · Mismo par de idiomas 5840 (ancho) |
  | 03 Dictamen | IMG_8412, 1,64 s | Informe técnico 3520 · Una posición 4920 · Una consulta 6500 · Conocimientos específicos 8760 |

## Entregas
| Archivo (`out/2026-10-25_ctpsfpc_varios-idiomas/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `varios-idiomas_9x16_v1.mp4` | 2026-10-25 | Primera entrega, aprobada sobre el borrador C ("está perfecto"): cortes con uniones en un solo movimiento, placas de explicación 01–03, placa final con la web, sin música. 48,8 s, 1080×1920, 30 fps, crf 18, −14,1 LUFS, pico −1,5 dBFS |
| `varios-idiomas_9x16_v2.mp4` | 2026-10-25 | "Hológrafa(s)" → **"ológrafa(s)"**, sin h (RAE), en el módulo de la placa 01 y en el subtítulo; corrección en `armar_transcripcion.mjs` (`CORREGIR`). Resto igual a la v1. −14,1 LUFS, pico −1,5 dBFS; detectar_glitches: los mismos avisos que la v1 (placas fijas), ninguno nuevo |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-25_ctpsfpc_varios-idiomas/` desde `C:/Videos/archivo/2026-10-25_ctpsfpc_varios-idiomas/` (si el trabajo está cerrado).
2. Regenerar los audios preparados con los scripts de este trabajo:
   - `bash src/trabajos/2026-10-25_ctpsfpc_varios-idiomas/preparar_voz.sh`
   - `bash src/trabajos/2026-10-25_ctpsfpc_varios-idiomas/preparar_musica.sh`
   - `node src/trabajos/2026-10-25_ctpsfpc_varios-idiomas/armar_transcripcion.mjs`
3. `npx remotion render src/index.ts ctpsfpc-varios-idiomas-reel <tmp>.mp4 --crf=18`
4. `bash scripts/terminar_audio.sh <tmp>.mp4 out/2026-10-25_ctpsfpc_varios-idiomas/final/varios-idiomas_9x16_vN.mp4`
