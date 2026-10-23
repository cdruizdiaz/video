# 2026-10-20_claudio_motion-graphic-prueba

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (prueba interna) · promo de **HiperPrecios** (sin kit de marca) · personaje Bloomie (`personajes/bloomie`) |
| Pieza | motion-graphic-prueba (promo HiperPrecios) |
| Estado | 🟡 En curso (falta el video de fondo real) |
| Abierto | 2026-10-20 |
| Cerrado | — |

## Brief
- **Objetivo:** pieza de motion graphics para redes promocionando HiperPrecios (comparador de precios). Prueba de la suite completa al ritmo de la música: librosa, ffmpeg, Piper + Whisper, Rhubarb, PersonajeRig, profundidad, títulos con máscara y blur, camera punch y CTA con resorte. Plantilla nueva `MotionGraphicRitmo`.
- **Formato(s):** 9:16 1080×1920 · 30 fps (el pedido original decía 1080×1080; vale lo que indicó Claudio: vertical)
- **Modo de animación:** plano (2D)
- **Luz de la escena:** ⏳ medir cuando llegue el video de fondo
- **Duración:** 15 s (450 cuadros)
- **Tono / estilo:** tech, enérgico, al compás
- **Guion de la voz (exacto):** "¿Cansado de pagar de más? Encontrá el mejor precio al instante con HiperPrecios. Inteligencia aplicada a tu bolsillo. Probalo gratis en hiperprecios.ar"
- **Llamado a la acción:** "Probalo gratis" + botón "hiperprecios.ar"
- **Entrega:** `out/2026-10-20_claudio_motion-graphic-prueba/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-20_claudio_motion-graphic-prueba/` — vacío: el video `assets/video/super_base_01.mp4` del pedido no existe en esta PC
- **Música:** `audio/musica_15s.wav` (`preparar_musica.sh`) · pulsos en `datos/pulsos.json`
- **Voz:** `audio/voz_1..4.wav` (una por frase) · Whisper `datos/voz_N.json` · bocas `datos/voz_N_rhubarb.json`

## Decisiones
- **Plantilla:** `MotionGraphicRitmo` (nueva, `src/plantillas/MotionGraphicRitmo/`): títulos por bloques con `TituloMascara` (`comunes/`: máscara + Easy Ease `bezier(0.33,0,0.67,1)` + blur solo vertical con filtro SVG, proporcional a la velocidad), camera punch 1 → 1,025 en cada compás, brazos de Bloomie que cambian de pose en cada compás (el derecho 2 cuadros después), boca con Rhubarb, botón del CTA con `spring` en el último compás y latido en los pulsos siguientes, ducking de la música (-8 dB mientras habla). La zona de los títulos se calcula por bloque con las cajas de Bloomie mientras se ve el bloque (`pisoLibre`).
- **Música:** "Coffee or Tea" — Michael Ramir C. (Mixkit, id 1168, sha256 `af5eb4518d45`), elegida por mí (pedido: búsqueda autónoma; electrónica positiva y futurista, 103,4 bpm). Tramo 27,609–42,609 s (arranca en un compás, zona de más energía), fundido de salida 0,6 s, **-18,1 LUFS** como pidió el brief.
- **Pulsos (librosa):** `datos/pulsos.json` en vez de `public/beats.json` (estructura de trabajos): 25 pulsos, 6 compases (1,44 · 3,715 · 6,014 · 8,29 · 10,565 · 12,864 s), 11 golpes, energía.
- **Voz:** Piper `es_AR-daniela-high`, velocidad 0,92. Una frase por archivo: con todo junto, Whisper se salteaba "¿Cansado de pagar de más?". Cada frase arranca en un pulso: 1,44 · 3,715 · 7,152 · 10,008 s. "hiperprecios.ar" se le dio a Piper como "hiperprecios punto ar" (el texto en pantalla es el exacto).
- **Palabras clave al pulso:** cada línea entra en el pulso más cercano (±0,3 s) a su palabra en Whisper (tiempo DTW): Cansado, pagar, mejor, instante, HiperPrecios, Inteligencia, aplicada, bolsillo, Probalo.
- **Fondo:** como no hay video, una **góndola dibujada por código** (`MotionGraphicRitmo/Gondola.tsx`): estantes con productos desenfocados (profundidad de campo) detrás y el mueble con etiquetas de precio delante; Bloomie va entre las dos capas (queda detrás del primer plano) y el frente lleva el rótulo "HiperPrecios".
- **Cuando llegue `super_base_01.mp4`:** copiarlo a `crudos/` (original) → proxy → `python scripts/profundidad.py <proxy> revision/prof.mp4 --recorte public/trabajos/<ID>/crudos/super_cerca.webm --punto x,y` (x,y = donde pisa Bloomie; el recorte es la "luma matte" de la profundidad: todo lo más cercano que ese punto) → en `composiciones.ts`: `fondo: { tipo: "video", video, recorte }` (la plantilla usa `DetrasDePersona`). Medir la luz de la escena y ajustar `personaje.x/y/escala`.
- **Bloomie:** escala 1,9, pies en (540, 1650) detrás del mueble (borde en y = 1520). Sus manos son bolitas con el pivote encima, así que rotarlas casi no se ve: las poses de brazos también las mueven (x ±105 pt, afuera de los pétalos, y hasta -235 pt) y las pasan delante de la cabeza. Caras: preocupado → feliz → guiño → feliz; salto al aparecer el botón.

## Entregas
| Archivo (`out/2026-10-20_claudio_motion-graphic-prueba/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `hiperprecios-promo_9x16_v1.mp4` | 2026-10-20 | Primera versión (15 s, 1080×1920, h264 crf 18, 4,7 MB; -14,2 LUFS, pico -1,3 dBFS). Fondo provisional: góndola dibujada. Render en la i3: 1 min 37 s. |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-20_claudio_motion-graphic-prueba/` desde `C:/Videos/archivo/2026-10-20_claudio_motion-graphic-prueba/` (si el trabajo está cerrado).
2. Música y pulsos: `bash src/trabajos/2026-10-20_claudio_motion-graphic-prueba/preparar_musica.sh`.
3. Voz: `node scripts/voz.mjs "<frase N>" public/trabajos/<ID>/audio/voz_N.wav --datos public/trabajos/<ID>/datos --velocidad 0.92` (las 4 frases de arriba).
4. `npx remotion render src/index.ts claudio-hiperprecios-promo out/<ID>/revision/render_vN.mp4 --crf=18` → `ffmpeg -i … -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k out/<ID>/final/hiperprecios-promo_9x16_vN.mp4` → verificar con `ebur128`.
