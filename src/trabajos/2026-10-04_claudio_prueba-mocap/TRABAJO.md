# 2026-10-04_claudio_prueba-mocap

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (pruebas internas) |
| Pieza | prueba de la fase 2 del plan de mejoras |
| Estado | 🟡 En curso (prueba) |
| Abierto | 2026-10-04 |
| Cerrado | — |

## Brief
- **Objetivo:** probar la captura de movimiento desde video (`scripts/rig/mocap.py`), el lip sync con Rhubarb y los efectos de sonido automáticos del rig, con material que ya teníamos.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** plano (Bloomie, vista frente)
- **Duración:** 10 s (mocap) · 5 s (habla, sonidos)
- **Entrega:** ninguna (solo revisión en `out/2026-10-04_claudio_prueba-mocap/revision/`)

## Materiales
- **Originales:** crudos archivados de `2026-09-29_claudio_musica` (`C:/Videos/archivo/2026-09-29_claudio_musica/public/crudos/`): `20220424_144340.mp4` (guitarrista de cuerpo entero, 5–15 s) y `wa_111602.mp4` (nene cantando, 8–18 s; la cámara pasa por otras personas entre los cuadros 40 y 160).
- **Proxies:** `public/trabajos/2026-10-04_claudio_prueba-mocap/crudos/guitarra.mp4`, `nene.mp4` (10 s, 30 fps, h264_qsv).
- **Voz:** `audio/voz_bloomie.wav` (Piper `es_AR-daniela-high`, -14 LUFS) con `datos/voz_bloomie_whisper.json` y `datos/voz_bloomie_rhubarb.json`.

## Composiciones
| ID | Qué muestra |
|---|---|
| `claudio-prueba-mocap-guitarra` | arriba el video, abajo Bloomie con `datos/mocap_guitarra.json` (cuerpo entero: brazos, tronco, cabeza, pies, raíz, cara) |
| `claudio-prueba-mocap-nene` | ídem con `datos/mocap_nene.json` (primer plano: tronco, brazos, cara, ojos cerrados al cantar, boca) |
| `claudio-prueba-mocap-habla` | misma voz, izquierda reglas por letras (Whisper), derecha Rhubarb |
| `claudio-prueba-mocap-sonidos` | salto, cambio de cara, disfraz y giro con `sonidos: true` |

## Decisiones
- **Mocap:** se queda la secuencia lineal reducida (≈1 pose clave cada 3 cuadros). Con la cadera fuera de cuadro no se mueven raíz ni pies (primeros planos sentados hacían "volar" a Bloomie). Umbral de `enojado` subido a 0,6 (cantando, las cejas bajan sin enojo).
- **Lip sync:** Rhubarb articula mejor (cierra en M/B/P, sigue el ritmo); las reglas por letras quedan de respaldo.
- **Efectos:** pop de Mixkit 731 ("Cartoon bubble pop", bajado el 2026-10-04) + whoosh 1492 y boing 2894 de la biblioteca.

## Entregas
| Archivo (`out/2026-10-04_claudio_prueba-mocap/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Proxies: `ffmpeg -ss 5 -t 10 -i <archivo>/20220424_144340.mp4 … crudos/guitarra.mp4` y `-ss 8 -t 10 … wa_111602.mp4 … crudos/nene.mp4`.
2. `python scripts/rig/mocap.py public/trabajos/<ID>/crudos/<n>.mp4 bloomie public/trabajos/<ID>/datos/mocap_<n>.json --control out/<ID>/revision/control_<n>.png`
3. `node scripts/voz.mjs "¡Hola! Soy Bloomie. Hoy vamos a plantar una semilla en el jardín, ¿me ayudás?" public/trabajos/<ID>/audio/voz_bloomie.wav --datos public/trabajos/<ID>/datos` (renombrar `voz_bloomie.json` → `voz_bloomie_whisper.json`).
4. `node scripts/revisar.mjs <comp> <ID>`
