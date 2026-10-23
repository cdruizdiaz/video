# 2026-10-15_cei_dia-de-la-madre

| Campo | Valor |
|---|---|
| Cliente / marca | CEI — Centro de Enseñanza de Inglés (`src/marcas/cei`, **por crear**) |
| Pieza | Día de la Madre: cada alumno agradece a su mamá por algo |
| Estado | 🟢 Cerrado el 2026-10-15 (a pedido del cliente, **sin entrega final**: `final/` vacía; el último material aprobado para revisión es el montaje de `revision/`) |
| Abierto | 2026-10-15 |
| Cerrado | 2026-10-15 |

## Brief
- **Objetivo:** video del CEI para el Día de la Madre. Suena el teléfono y cada alumno (15) agradece a su mamá por algo. Abre con la mejor toma (elegida con las transcripciones) y un efecto de sonido de reloj; cortes dinámicos para que no sea repetitivo (todos empiezan agarrando el teléfono).
- **Formato(s):** 9:16 1080×1920 · 30 fps (los crudos son verticales 4K a 24 fps)
- **Modo de animación:** plano (sin personajes animados; Bloomie es la mascota del CEI, no se pidió)
- **Luz de la escena:** —
- **Duración:** a definir (⚠️ no indicada; los 15 clips suman ~3 min de crudo)
- **Tono / estilo:** cálido y cercano (manual de marca: "cercanía real", "humor con método"). Paleta del manual: Royal Blue #0d3053 · Sky blue #5fb7ce · Charcoal #071b2b · **Bone #ffede1** · Wine #6d1414 · **Pumpkin #dc7b26** · August #ef913c · Cinnamon #bc7208. Tipografías: New Spirit (títulos) y **Filson Pro** (texto).
- **Subtítulos (pedido del cliente):** Filson Pro **Medium**, tamaño 12, fondo bone #ffede1 (el pedido decía "#ede1": es el Bone del manual) con esquinas redondeadas, opacidad 80 %, relleno 5 de ancho y alto; letras naranja **#dc7b26**. ⚠️ El tamaño "12" y el "5" no tienen unidad: a confirmar cómo traducirlos a 1080×1920.
- **Textos obligatorios:** placa final "Happy Mother's Day" con la estética CEI, y después el logo.
- **Música:** — (no pedida)
- **Llamado a la acción:** —
- **Entrega:** `out/2026-10-15_cei_dia-de-la-madre/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-15_cei_dia-de-la-madre/` (copia de `C:/Users/LUCIA/Documents/RASTRO/Clientes/CEI/MOthers day/`, 30 archivos, 571 851 547 bytes verificados contra el origen).
- **Video por alumno (15 .MOV/.mov, 4K HEVC 24 fps, rotación -90 = vertical):** cada uno con un audio externo `.m4a` grabado aparte para que suene mejor. Pareo de nombres (los de las dos columnas no siempre coinciden):

  | Alumno (video) | Audio externo |
  |---|---|
  | Aglieri Olivia | Aglieri Olivia |
  | Alvarez Lola | Álvarez Lola |
  | Azanza Amparo | Azanza Amparo |
  | Bautista Rosario | Bautista Rosario |
  | Benuzzi Dante | Dante - High Junior |
  | Ciorciari Santiago | Santiago Ciorciari- 1 Año |
  | Gauna Alfonsina | Gauna Alfonsina |
  | Macagno Sofia | Sofi Macagno- Low Junior |
  | Mastropaolo Ricardo | Ricky Mastropaolo - 6to Año |
  | Mellis Silvero | Mellis Silvero - High Junior |
  | Meresman Mateo | Meresman Mateo |
  | Perello Clara | Perello Clara |
  | Pilar Di Gerolamo | Di Gerolamo Pilar |
  | Rodrigo Antonia | **Rodrigo Rosario** (⚠️ el nombre no coincide: confirmar por sincronía y transcripción) |
  | Sartore Naiara | Naiara Sartore - 5to |

- **Proxies y material de trabajo:** `public/trabajos/2026-10-15_cei_dia-de-la-madre/` (`crudos/<alumno>.mp4` 1080×1920 30 fps; `audio/externo/<alumno>.wav` mono 48 kHz). Se regeneran con `preparar_crudos.sh`.
- **Marca:** manual `C:/Users/LUCIA/Documents/RASTRO/Clientes/CEI/CEI - Manual de Marca_beta_compressed (1).pdf` (22 páginas; logo principal con la torre y la flor; paleta y tipografías en las pp. 9–15); tipografías `C:/Users/LUCIA/Documents/RASTRO/Clientes/CEI/Tipografías/Filson pro/` (.otf, todos los pesos); fotos del cliente en `.../CEI/Fotos/`. **Kit de marca `src/marcas/cei` y `public/marcas/cei/` por crear.**

## Guiones
- `guion_dia-de-la-madre.md` (generar con `/guion 2026-10-15_cei_dia-de-la-madre`; aplicar cambios con `/aplicar-guion 2026-10-15_cei_dia-de-la-madre`)

## Decisiones
- **Plantilla:** propia del trabajo, `DiaDeLaMadre.tsx` (composición `cei-dia-de-la-madre`, `composiciones.ts`): montaje de tomas cortas con la voz del audio externo, subtítulos del cliente y placa + logo finales. Se hizo aparte porque `HablaSubtitulada` está pensada para un solo hablante con subtítulos "reel" de Volto. El montaje (tramos, zoom, subtítulos) está en `plan.json`.
- **Kit de marca:** `src/marcas/cei/` (marca.ts, fuentes.ts) y `public/marcas/cei/` (logo.png principal, logo-circular.png secundario, fuentes Filson Pro Book/Regular/Medium/Bold). Logos recortados del PDF del manual (vectorial → render a 4× y fondo transparente), no son los archivos originales del cliente: pedirlos si se quiere máxima calidad.
- **Sincronía:** `sincronizar.py` (GCC-PHAT entre el audio externo y el audio del video, desfases entre -6,8 y +1,5 s, z 14–77; el audio "Rodrigo Rosario" corresponde al video "Rodrigo Antonia", z 41). Pilar: la voz empieza 6,8 s después del cuadro 0. Rosario: el audio dura 0,6 s más que el video (se congela el último cuadro).
- **Transcripción:** Whisper (`transcribir.mjs`, `datos/transcripciones/`); los textos de los subtítulos están corregidos a mano en `plan.json`.
- **Ganancias:** `ganancias.py` lleva la voz de cada toma a -29 LUFS (la más baja) para que no salte el volumen; el `loudnorm` final la sube a -14.
- **Encuadre:** `encuadre.py` (MediaPipe) da la posición de la cara en cada tramo; los acercamientos la acomodan en el tercio superior. Proxies de 1620×2880 (`*_hd.mp4`) para los acercamientos de hasta 1,55×.
- **Cortes:** cada alumno arranca donde empieza el agradecimiento (sin el gesto de agarrar el teléfono, salvo la toma de apertura de Olivia); zoom y empuje distintos por toma; el audio entra 5 cuadros antes que la imagen (corte en J).
- **Subtítulos:** Filson Pro Medium 54 px, naranja #dc7b26 sobre píldora #ffede1 al 80 %, radio 30 px, relleno 14/30 px; a 1080×1920. ⚠️ "12" y "5" del pedido no tenían unidad: son interpretaciones a confirmar.
- **Reloj:** pedido en el brief, pero el cliente lo sacó en la 1ª ronda de correcciones (2026-10-15): el borrador no lleva ningún efecto de sonido.
- **Música:** Mixkit 1037 "My Little Star" (Michael Ramir C.; sha256 `8efc36df9024…`, verificado con `node scripts/mixkit.mjs verificar`), normalizada a -27,4 LUFS en `audio/musica.wav`, ~16 dB bajo las voces y sube en la placa. Reemplazó a "We'll Be Okay" (Mixkit 1081, sha256 `a07e945508eb…`), que al cliente le pareció deprimente. Sonido de reloj: Mixkit 1060 (sha256 `66efe4ce5e0b…`), usado solo en el 1er borrador y sacado a pedido.
- **Audio:** `preparar_voz.sh` (DeepFilterNet --atten-lim 18, pasa-altos, presencia y compresión suave) → `audio/voz/`; `ganancias.py` nivela a -33 LUFS antes del loudnorm final. Voz y video unidos por `sincronizar.py` (el desvío medido en el borrador renderizado es de ~40 ms).
- **Subtítulos (2ª ronda):** tiempos desde las pausas reales de la voz (`voz_segmentos.py`, `palabras.py`, `armar_subs.py`), un solo rectángulo con hasta 2 líneas, siempre dentro de márgenes de 110 px.
- **Flor final:** contornos extraídos del logo del manual (`extraer_flor.py` → `flor.json`), con sombra difuminada.
- **Placa (retomada 2026-10-16):** fondo vino #6d1414 parejo (sin la trama de flores, que lo teñía y lo recargaba), luz cálida suave detrás de la flor, viñeta, flores grandes desenfocadas que flotan, grano fino; flor con degradé de luz, "Happy" en Fraunces itálica agosto + "Mother's Day" 500 hueso, filete fino con punto; entrada con desenfoque y acercamiento lento. Revisión: `revision/placa/` (`hoja_placa_v2.png`, `placa_v2.mp4`).
- **Placa:** serif cálida Fraunces (Google Fonts) en lugar de New Spirit (no vino entre las tipografías del cliente).
- **Música:** —
- **Otras:** sincronizar audio externo ↔ audio de cámara (GCC-PHAT como en `volto_fashion-week`); transcribir los 15 audios con Whisper para elegir la toma de apertura y cortar sin repetir el gesto de agarrar el teléfono.

## Entregas
Sin archivos en `out/2026-10-15_cei_dia-de-la-madre/final/`: el cliente cerró el trabajo en revisión. Lo producido (todo en `revision/`, 9:16, 30 fps):

| Archivo (`out/2026-10-15_cei_dia-de-la-madre/revision/`) | Duración | Qué es | LUFS (ebur128) |
|---|---|---|---|
| `borrador_dia-de-la-madre_9x16_b.mp4` | 76,2 s | 1ª ronda de correcciones, música "We'll Be Okay" (Mixkit 1081), 540×960 | -13,7 |
| `borrador_dia-de-la-madre_9x16_c.mp4` | 76,7 s | 2ª ronda: subtítulos recalculados con las pausas de la voz, música "My Little Star" (Mixkit 1037), flor con sombra, 540×960 | -13,9 |
| `montaje_dia-de-la-madre_9x16_a.mp4` | 76,7 s | solo tomas + voz + placa y logo, con estabilización (vidstab), 1080×1920 | -14,1 |
| `montaje_dia-de-la-madre_9x16_b.mp4` | 76,7 s | igual que `_a` pero **sin estabilizar** (último pedido) | -14,1 |

Pendiente si se retoma: render a resolución completa del video con subtítulos y música (composición `cei-dia-de-la-madre`) → `final/dia-de-la-madre_9x16_v1.mp4`.

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-15_cei_dia-de-la-madre/` desde `C:/Videos/archivo/2026-10-15_cei_dia-de-la-madre/public/` (ver `ARCHIVADO.txt`) y los originales están en `C:/Videos/crudos/2026-10-15_cei_dia-de-la-madre/` (copia del origen `…/Clientes/CEI/MOthers day/`).
2. Proxies y audios externos: `bash src/trabajos/2026-10-15_cei_dia-de-la-madre/preparar_crudos.sh` (1080×1920 y `_hd` 1620×2880, WAV mono 48 kHz por alumno).
3. Voz limpia: `bash src/trabajos/2026-10-15_cei_dia-de-la-madre/preparar_voz.sh` (DeepFilterNet → `audio/voz/`).
4. Sincronía y datos (Python del `.venv`, desde la raíz del proyecto): `sincronizar.py`, `voz_segmentos.py`, `palabras.py` (después de transcribir `audio/voz/*.wav` con `node scripts/transcribir.mjs <wav> datos/transcripciones_voz/<n>.json --sin-vad`), `armar_subs.py`, `ganancias.py`. Estabilizar (opcional): `bash src/trabajos/2026-10-15_cei_dia-de-la-madre/estabilizar.sh`.
5. Música: `public/biblioteca/musica/mixkit/mixkit-1037-my-little-star.mp3` → `ffmpeg -i … -af "loudnorm=I=-28.5:TP=-3:LRA=7,afade=t=in:st=0:d=1.0" -ar 48000 -ac 2 audio/musica.wav`.
6. Render: `npx remotion render src/index.ts cei-dia-de-la-madre out/2026-10-15_cei_dia-de-la-madre/final/dia-de-la-madre_9x16_v1.mp4 --crf=18` (o `cei-dia-de-la-madre-montaje` para el montaje sin subtítulos ni música); después `ffmpeg -i <render> -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 256k -ar 48000 <salida>` y verificar con `ebur128`.
