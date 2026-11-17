# 2026-11-13_cipax_r0

| Campo | Valor |
|---|---|
| Cliente / marca | Cipax Digital Solutions (`src/marcas/cipax`) |
| Pieza | R0 — "¿Tenés una PyME?" (primer reel de la serie) |
| Estado | 🟡 En curso |
| Abierto | 2026-11-13 |
| Cerrado | — |

## Brief
- **Objetivo:** primer reel de una serie para redes de Cipax. Usar las partes narrativamente claras de los crudos.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** plano (motion graphics, sin personajes)
- **Luz de la escena:** — (no hay personajes animados)
- **Duración:** ~30 s (25,5 de video + 4 de placa)
- **Tono / estilo:** transiciones y motion graphics "copados" con la estética de las referencias (`Clientes/Cipax/Refes transiciones`), siempre con colores y tipografías del manual.
- **Material:** la serie mezcla reels de celular (orgánicos) y de cámara profesional; los criterios distinguen los dos (`src/marcas/cipax/CRITERIOS.md`). R0 = celular (iPhone 4K HEVC, rango completo).
- **Pedidos puntuales:**
  - subtítulos iguales para los dos tipos de material, con una tipografía de la marca, respetando zonas seguras de redes → Montserrat Bold;
  - una toma termina con movimiento de cámara y la siguiente arranca con otro: transición clara y smooth → 9597 → 9599 (transición `camara`);
  - placa final con el logo animado de forma creativa y tecnológica.
- **Textos obligatorios:** —
- **Llamado a la acción:** — (placa con logo y "DIGITAL SOLUTIONS"; ⚠️ falta confirmar si va usuario de redes, web o WhatsApp)
- **Entrega:** `out/2026-11-13_cipax_r0/final/`

## Materiales
- **Originales:** `C:/Users/LUCIA/Documents/RASTRO/Clientes/Cipax/R0/` → copiados (tamaños verificados) a `C:/Videos/crudos/2026-11-13_cipax_r0/`
- **Identidad:** `Clientes/Cipax/Identidad Visual/` (manual PDF, logos, recursos gráficos) → kit en `src/marcas/cipax/` + `public/marcas/cipax/`
- **Proxies:** `public/trabajos/2026-11-13_cipax_r0/crudos/` (`hacer_proxies.sh`: 1080×1920, 30 fps, rango completo → estándar)
- **Audio:** `audio/voz_*.wav` (voz de cada toma nivelada, `preparar_audio.sh`), `audio/musica.wav`
- **Datos:** `datos/transcripciones/*.json` (Whisper), `datos/alin_*.json` (alineación forzada por palabra), `datos/pulsos.json` (música, 123 bpm)

| Crudo | Duración | Resolución | fps | Contenido | Uso |
|---|---|---|---|---|---|
| IMG_9589 | 7,1 s | 3840×2160 (rot. −90 → 1080×1920) | 29,97 | "¿Tenés una PyME…?" | ✅ escena 1 |
| IMG_9590 | 13,5 s | ídem | 29,97 | 1ª toma cortada ("voy de vuelta") + 2ª toma de los dolores | ✅ 2ª toma (7,48–12,40) |
| IMG_9592 | 7,4 s | ídem | 29,97 | "No es que no te lleves bien con la tecnología…" | ✅ hasta "trabaja" |
| IMG_9593 | 2,8 s | ídem | 29,97 | "tu organización" de perfil | ❌ (9595 la incluye con el giro) |
| IMG_9594 | 15,1 s | ídem | 29,97 | perfil + cámara al piso + "Para eso está Cipax" | ❌ (larga, con la cámara al piso) |
| IMG_9595 | 7,1 s | ídem | 29,97 | "Ay, perdón" + "Tu organización. Para eso está Cipax." con giro | ✅ 3,86–7,00 |
| IMG_9597 | 5,9 s | ídem | 29,97 | "Construimos soluciones a medida…" + paneo a los árboles | ✅ escena 5 |
| IMG_9599 | 4,7 s | ídem | 29,97 | paneo desde el piso + "Pensado para hacerte más fácil el día a día." | ✅ escena 6 |

## Guiones
- `guion_r0.md` (generar con `/guion 2026-11-13_cipax_r0`; aplicar cambios con `/aplicar-guion 2026-11-13_cipax_r0`)

## Decisiones
- **Plantilla:** `ReelCipax` (nueva, `src/plantillas/ReelCipax/`): transiciones de marca (`Transiciones.tsx`), logo por piezas (`LogoCipax.tsx`, de `src/marcas/cipax/logo.json`), placa (`PlacaCipax.tsx`).
- **Subtítulos:** Montserrat Bold 60 px blancos, palabra clave en píldora azul; base en y = 1400, ancho 760 (zonas seguras en CRITERIOS.md).
- **Música:** Mixkit 130 "Tech House vibes" (biblioteca; 123 bpm), 0–40 s, -14 LUFS, a 0,055 bajo la voz y 0,5 en la placa.
- **Sonidos:** Mixkit 3005 (whoosh-pop liviano), 2356/2357 (pops), 1492 (whoosh rápido), 2574 (software start).
- **Empalme de cámara:** 9597 corta en el pico del paneo hacia arriba (5,53 s, flujo óptico ~110 px/cuadro) y 9599 entra en su paneo hacia arriba desde el piso (0,47 s); mismo sentido de movimiento.
- **Otras:**
  - ⚠️ "realmente necesitás": Whisper escribió "necesitas"; se subtituló con voseo (escuchar y confirmar).
  - Transcripción de "consideración bancaria" (Whisper) corregida a "conciliación bancaria" (re-transcripción con prompt + sentido).

## Borradores (`out/2026-11-13_cipax_r0/revision/`)
- `borrador_r0_9x16_a.mp4` (2026-11-13): primer armado completo. Detector: 2 cuadros azules lisos y un flash en la transición isotipo; el isotipo cruzaba la cara.
- `borrador_r0_9x16_b.mp4` (2026-11-13): logo entra en "está" y queda armado al decir "Cipax"; el isotipo se agranda desde arriba de la cabeza; azul lleno con degradé. 29,5 s, −13,9 LUFS, pico −1,0 dBFS, sin glitches.

## Entregas
| Archivo (`out/2026-11-13_cipax_r0/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-11-13_cipax_r0/` desde `C:/Videos/archivo/2026-11-13_cipax_r0/` (si el trabajo está cerrado).
2. `bash src/trabajos/2026-11-13_cipax_r0/hacer_proxies.sh` y `bash src/trabajos/2026-11-13_cipax_r0/preparar_audio.sh`.
3. `npx remotion render src/index.ts cipax-r0 <tmp>.mp4 --crf=18` y `bash scripts/terminar_audio.sh <tmp>.mp4 out/2026-11-13_cipax_r0/final/r0_9x16_vN.mp4`
