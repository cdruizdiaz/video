# 2026-10-01_claudio_bloomie

| Campo | Valor |
|---|---|
| Cliente / marca | Claudio · marca Bloomie (`src/marcas/bloomie`) |
| Pieza | Bloomie (video de animación a partir de un personaje dibujado en Illustrator) |
| Estado | 🟢 Cerrado |
| Abierto | 2026-10-01 |
| Cerrado | 2026-10-02 |

## Brief
- **Objetivo:** mini historia animada: Bloomie sale de su casa, saluda a su mamá y se va en el autobús escolar.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Duración:** 40 s
- **Tono / estilo:** escena alegre y familiar (escenario a criterio nuestro: casa, vereda, parada del autobús). Bloomie parpadea, saluda, rebota, camina y habla.
- **Textos obligatorios:** al final, mientras saluda, Bloomie lo dice y se muestra en el globo (en inglés, cambio del 2026-10-01): “Bye, Mom! Don't forget to bake my favorite cake for when I get back from school!”
- **Llamado a la acción:** — (no hay)
- **Audio:** música Happy Home (Mixkit) + efectos de Mixkit + voz de Bloomie (Piper); ver Decisiones.
- **Mamá, casa y autobús:** no están en el `.ai`; se dibujan en SVG con el mismo estilo y la misma paleta que Bloomie (decisión del 2026-10-01).
- **Entrega:** `out/2026-10-01_claudio_bloomie/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-01_claudio_bloomie/` (fuera del proyecto)
  - `Bloomie.ai` (2,8 MB): Illustrator con PDF compatible (`%PDF-1.6`). Es vectorial: no es un video, así que no lleva proxy.
  - Contenido (una mesa de trabajo 1080×1920, una sola capa "Capa 1"): **hoja de personaje**. Bloomie es una flor naranja con anteojos redondos celestes. Trae el cuerpo de frente, de perfil y de espaldas, y 12 caras: normal, feliz con la boca abierta, preocupado, guiño, enojado, triste con lágrima, con birrete, enamorado, con gorro de Navidad, de bruja con escoba, de murciélago y de reno.
  - Convertido con PyMuPDF a `out/2026-10-01_claudio_bloomie/revision/bloomie_p0.svg` (+ vista previa `.png`). Las partes no vienen en capas: se separan por posición en el código.
- **Proxies y material de trabajo:** `public/trabajos/2026-10-01_claudio_bloomie/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/bloomie/` (kit creado el 2026-10-01)

## Preparar el personaje
- Se convierte el `.ai` con PyMuPDF (instalado en el `.venv` el 2026-10-01 y fijado en `setup/herramientas/requirements.txt`).
- La extracción del personaje pasó al kit de marca (2026-10-01): `src/marcas/bloomie/extraer_personaje.py` → `public/marcas/bloomie/personaje.json` (cuerpo de frente, perfil, 12 caras, boca abierta y la escoba). Parpadeo, boca que habla y ojos de sorpresa se arman en el código sobre esas piezas.

## Guiones
- `guion_bus-40s.md` (7 escenas, 40 s). Generar otros con `/guion 2026-10-01_claudio_bloomie`; aplicar cambios con `/aplicar-guion 2026-10-01_claudio_bloomie`)

## Decisiones
- **Plantilla:** nueva `src/plantillas/PersonajeAnimado/`: `Personaje.tsx` (personaje extraído de un vectorial, con caras, parpadeo, habla y sorpresa), `escenario.tsx` (cielo, sol, nubes, casa con puerta, autobús escolar, vereda, cerca, árboles, mamá flor, mochila, globo de diálogo, corazones, humo) y `util.ts` (tramos con clamp, arcos, rebotes, cámara). La historia está en `BloomieEscuela.tsx` (7 escenas, frames en `ESCENAS`).
- **Música:** Happy Home (Mixkit 801, Michael Ramir C., licencia libre de Mixkit), sha256 `76b82159ba1d`, 0–40 s con fundidos (`preparar_musica.sh`), -18 LUFS antes de la mezcla.
- **Efectos (Mixkit)** (id · sha256): creaky door open (195 · `7ce4a2dc95f3`), boing hit sound (2894 · `9d0611005031`), little cute kiss (2192 · `703757df682e`), old bus arrival (3033 · `17f84f1c0dd1`), car double horn (719 · `15c3836597e2`), hydraulic bus door (2709 · `3b56f308ac28`), city bus departure (3034 · `5100b3fb52fa`). Licencia libre de Mixkit (uso comercial, sin atribución); registro en `public/biblioteca/LICENCIAS-mixkit.json`. Originales archivados en `C:/Videos/archivo/2026-10-01_claudio_bloomie/biblioteca/`.
- **LUFS medidos al cerrar (ebur128):** `bus-40s_9x16_v1.mp4` -14,1 LUFS · `bus-40s_9x16_v2.mp4` -13,9 LUFS (pico -1,1 dBFS).
- **Voz (2026-10-01):** Piper TTS local (`piper-tts` en el `.venv`, voces en `C:/Videos/_herramientas/modelos-piper/`), voz `en_US-hfc_female-medium` subida de tono ×1,35 con `rubberband` para que suene a nene (elegida entre hfc_female, amy y kristin). `preparar_voz.sh` la genera a -14 LUFS en `audio/voz_bloomie_en.wav` y la transcribe con Whisper (`--idioma en`) a `datos/voz_bloomie_en.json`: de ahí salen los tiempos de cada palabra para el globo y la boca. La música baja a 0,35 (~-9 dB) mientras habla.
- **Otras:** la mamá, la casa y el autobús están dibujados por código en el estilo de Bloomie. La escena 7 es un contraplano: el autobús mira a la derecha para salir por ese lado.

## Entregas
| Archivo (`out/2026-10-01_claudio_bloomie/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `bus-40s_9x16_v1.mp4` | 2026-10-01 | Primera versión según `guion_bus-40s.md`. 1080×1920, 30 fps, 40 s, -14,1 LUFS |
| `bus-40s_9x16_v2.mp4` | 2026-10-01 | Frase final en inglés, dicha por Bloomie (voz Piper) y en el globo palabra por palabra; boca sincronizada con la voz; música baja ~9 dB mientras habla. -13,9 LUFS |

## Cómo rehacerlo
1. Restaurar el material: copiar `C:/Videos/archivo/2026-10-01_claudio_bloomie/public/` sobre `public/trabajos/2026-10-01_claudio_bloomie/` (`audio/musica_40s.wav`, `audio/voz_bloomie_en.wav`; `datos/` queda en el repo). Los originales de Mixkit están en `C:/Videos/archivo/2026-10-01_claudio_bloomie/biblioteca/` (copiarlos a `public/biblioteca/` si faltan; `node scripts/mixkit.mjs verificar` compara los sha256).
2. O regenerar los audios: `bash src/trabajos/2026-10-01_claudio_bloomie/preparar_musica.sh` (música 40 s con fundidos) y `bash src/trabajos/2026-10-01_claudio_bloomie/preparar_voz.sh` (voz Piper -14 LUFS + transcripción Whisper a `datos/voz_bloomie_en.json`).
3. Personaje: `C:/Videos/_herramientas/.venv/Scripts/python.exe src/marcas/bloomie/extraer_personaje.py` → `public/marcas/bloomie/personaje.json` (ya está en el kit de marca).
4. `npx remotion render src/index.ts claudio-bloomie-bus40 out/2026-10-01_claudio_bloomie/final/bus-40s_9x16_vN.mp4 --crf=18`
