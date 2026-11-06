# 2026-10-23_rastro_affinity-dia-01

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) |
| Pieza | affinity-dia-01 |
| Estado | 🟡 En curso |
| Abierto | 2026-10-23 |
| Cerrado | — |

## Brief
- **Objetivo:** primer video de la sección **"Día 1/20 probando Affinity"** para las redes de RASTRO. Es un video **orgánico** que muestra cómo funciona Affinity mientras Pau arma la portada del reel.
  - Arranca con IMG_8270, solo la parte en que dice "día 1/20 probando Affinity".
  - Las otras tomas: "interpretalos y fijate qué grabación de pantalla usar para poner como insert mientras ella va mostrando".
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** no lleva personaje animado.
- **Duración:** 2 min 14 s en el borrador A (131 s + 3 s de placa). Es largo para un reel; hay propuestas de recorte en la entrega.
- **Textos obligatorios:** subtítulos como en los reels de RASTRO (Inter 500, 64 px, blancos sin trazo, secos). Arriba a la izquierda, durante todo el video, la etiqueta de la serie "Día 1/20 · probando Affinity".
- **Llamado a la acción:** placa de cierre de RASTRO (bordó, sigue el rojo de la portada).
- **Entrega:** `out/2026-10-23_rastro_affinity-dia-01/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-23_rastro_affinity-dia-01/` (copia verificada, 3 859 748 051 bytes), de `Documents/RASTRO/Contenido RASTRO/pau affinity/`.
  - **Cámara:** iPhone HEVC 3840×2160, vertical, rango completo (`yuvj420p`). Hora de inicio según `creationdate`:

    | Toma | Duración | Inicio |
    |---|---|---|
    | IMG_8270 | 25 s | 17:03:35 |
    | IMG_8271 | 88 s | 17:04:06 |
    | IMG_8272 | 212 s | 17:06:45 |
    | IMG_8273 | 429 s | 17:10:59 |
    | IMG_8277 (selfie, rotada +90, 30 fps justos) | 19 s | 17:43:39 |

  - **Grabaciones de pantalla**, en `pantalla/affinity_<hora>.mp4` (el nombre original era "Affinity 2026-10-20 HH-MM-SS.mp4"). Todas son de 1920×1020 a 60 fps, con el micrófono de la compu:

    | Hora | Duración | Qué muestra |
    |---|---|---|
    | 15:17 | 29 s | Affinity vacío; abre el archivo de muestra "MAKKA MARY" |
    | 16:26 | 100 s | recorre ese archivo |
    | 16:33 | 33 s | documento nuevo vertical |
    | 16:34 | 20 s | capas |
    | 16:35 | 107 s | mesas de trabajo, recursos (íconos), Pexels |
    | 16:37 | 169 s | cuadrícula, texto "Hola", pluma, QR, elipse, degradé |
    | 16:42 | 188 s | documento con fondo gris, Pixel |
    | 17:05 | 537 s | la portada: fondo de papel, formas, imagen en multiplicar, texto "Día 1/20 probando Afinnity", texto curvo, la imagen verde |
    | 17:29 | 179 s | fondo bordó, etiqueta "probando" y logo de Affinity en verde |
    | 17:33 | 200 s | ajusta la portada |
    | 17:37 | 308 s | el gato con anteojos recortado como sticker |
- **Proxies** (`proxies.sh`): cámara a 1080×1920 y 30 fps, de rango completo a estándar; grabaciones a 30 fps en `crudos/pantalla/`.
- **Sincronía** (`sincronizar.py`, GCC-PHAT sobre el audio, que en la grabación de pantalla tiene la voz de Pau): IMG_8272 → grabación de 17:05:36 a +69,62 s; IMG_8273 → +324,60 s. La grabación corre un 0,1 % más rápido (está en `SINCRO` de `composiciones.ts`). IMG_8271 y 8277 no tienen grabación en simultáneo.
- **Audio:** `audio/voz/<clip>.wav` (`preparar_voz.sh` + `nivelar_voz.py`); `pop_0–2` copiados de newsletter-animana.

## Guiones
- `guion_affinity-dia-01.md`

## Decisiones
- **Plantilla:** `HablaSubtitulada` (CRITERIOS_REEL) con `ReelAffinity.tsx`, como `ReelNewsletter`: insertos anclados al ms de la palabra, más la etiqueta de la serie y `PlacaRastro` al final. Composición `rastro-affinity-dia-01-reel`.
- **Narrativa** (de 13 minutos de cámara):
  1. "Día 1 de 20 probando Affinity" (8270);
  2. por qué: odia Adobe, le llegó un mail, le da una segunda oportunidad, "me acompañan a probarlo haciendo la portada" (8271);
  3. lo básico: es muy parecido a Adobe, pero desde cero elegís el sangrado, los márgenes y las reglas, "eso me pareció un dios";
  4. "me puse a jugar con un montón de cosas": montaje rápido de las pruebas;
  5. la portada, con la pantalla sincronizada (8272): el fondo, las formas y el gatito, "mezcla la interfaz de Illustrator con la de Photoshop", la capa en multiplicar, el texto que se arrastra, "Día 1 de 20 probando Afinnity — no se escribe así, creo";
  6. sacar el fondo (8273): "¿se podrá sacar fondo acá?", los modos de trabajo (vector, pixel, diseño), "borrar papel blanco… eso estuvo genial, wow", las muestras de color de RASTRO;
  7. cierre en selfie (8277): exportar a la compu o directo a Canva, "tiene cosas, tiene cositas", con la portada armándose y terminada.
- **Lo que quedó afuera:**
  - la primera intro de IMG_8273 ("Todo arrancó porque odio Adobe Illustrator… Canva creó Affinity… pero gratis"): repetía la de 8271, y "Canva creó Affinity" no es exacto (Canva lo compró);
  - "me llegó hace bastante tiempo… me rendí";
  - "long story short";
  - los comentarios de la luz y del café;
  - las fuentes ("¿cómo funcionará el tema de Adobe Fonts?");
  - lo que lee de cómo quitar el fondo;
  - los tramos en silencio.
- **Insertos:** la pantalla a pantalla completa sobre el gris de Affinity, recortada a lo que importa (`UI`, `MESA`, `CAPAS`, `PERSONAS`, `PORTADA` en `composiciones.ts`). Cuando la grabación es simultánea, se ve justo lo que está haciendo mientras lo dice. Los insertos no llevan sonido, por ser un video orgánico; solo hay pops en las píldoras.
- **Planos:** abierto 1,08 y cerrado 1,5 sobre la cara, con un cambio en cada corte. La selfie va tal cual.
- **Transcripción** (`armar_transcripcion.mjs`): "me llevo un mail" → "me llegó"; "Nadobe" → "Adobe"; "esta reel" → "este reel"; voseo ("arrastrás", "controlás", "podés"); "repro" → "re pro".
- ⚠️ **IMG_8277, a confirmar:** Whisper oye "te deja el gel ubicado / el eje lo ubicaste en una computadora". Subtitulado: "te deja elegir: lo ubicás en una computadora". "Como he hecho en Canva" quedó como "Como re hecho en Canva".
- **Sin música** en el borrador A (se ofrece).
- **Insertos que no van sincronizados:** Pau nombra las formas y el gatito un poco antes de dibujarlos. Esos insertos arrancan cuando aparecen en la grabación (95 s y 101 s), con el recorte `MESA_CHICA`.
- **Glitches:** el detector marca cuadros "congelados" en los insertos (la pantalla está quieta mientras ella habla) y dos "flashes" a los 56,2 s y 120,9 s. Revisados cuadro por cuadro: son movimientos rápidos de manos, no cortes.
- **Borradores:**
  - `revision/borrador_affinity-dia-01_9x16_a.mp4` (2026-10-23, 134 s, −14,2 LUFS, pico −1,3 dBFS). Hoja: `revision/hoja_a.png`.

## Entregas
| Archivo (`out/2026-10-23_rastro_affinity-dia-01/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Si el trabajo está cerrado, restaurar `public/trabajos/2026-10-23_rastro_affinity-dia-01/` desde `C:/Videos/archivo/2026-10-23_rastro_affinity-dia-01/`.
2. Preparar el material:
   - `bash …/proxies.sh`;
   - `node scripts/transcribir.mjs <original> datos/tr/<clip>.json --sin-vad --prompt "Affinity, Canva, Illustrator, RASTRO, capas, vectores, pinceles"` por toma, y después `node …/armar_transcripcion.mjs`;
   - `bash …/preparar_voz.sh`;
   - `python …/sincronizar.py`.
3. `npx remotion render src/index.ts rastro-affinity-dia-01-reel <tmp>.mp4 --crf=18`, y después `bash scripts/terminar_audio.sh <tmp>.mp4 out/2026-10-23_rastro_affinity-dia-01/final/affinity-dia-01_9x16_vN.mp4`.
