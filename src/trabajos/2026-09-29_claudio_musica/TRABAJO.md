# 2026-09-29_claudio_musica

| Campo | Valor |
|---|---|
| Cliente / marca | Claudio (personal; sin kit de marca: no hizo falta) |
| Pieza | Música (reel "Música en familia" con fragmentos de videos familiares tocando y cantando) |
| Estado | 🟢 Cerrado (2026-09-30) |
| Abierto | 2026-09-29 |
| Cerrado | 2026-09-30 |

## Brief
- **Pedido:** `/nuevo-trabajo Claudio Musica C:\Users\CLAUDIO\Downloads\VideosFamilia` (sin más datos).
- **Pedido (2026-09-29):** "video vertical 9:16 para redes, divertido, para mostrar la música en familia; 30 s para un reel; distintos fragmentos de los videos; siempre en primer plano los personajes".
- **Objetivo:** reel divertido que muestra a la familia haciendo música (2022–2024).
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Duración:** 40 s desde v4 (pedido 2026-09-29: +10 s); v1–v3: 30 s
- **Tono / estilo:** divertido, alegre, familiar; personajes siempre en primer plano
- **Música:** el audio original de cada fragmento (decisión propia: la música de la familia es el tema; quedó así al cierre, sin objeciones en v1–v4)
- **Textos obligatorios:** ninguno pedido; se usaron "Música en familia", años y "¡La música nos une!" (quedaron así al cierre; sin nombres)
- **Llamado a la acción:** ninguno
- **Entrega:** `out/2026-09-29_claudio_musica/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-09-29_claudio_musica/` (fuera del proyecto; copiados de `C:\Users\CLAUDIO\Downloads\VideosFamilia`)
- **Proxies y material de trabajo:** archivados en `C:/Videos/archivo/2026-09-29_claudio_musica/public/` (en el repo queda solo `public/trabajos/2026-09-29_claudio_musica/datos/`)
- **Marca:** — (sin kit)
- **Crudos** (originales 1080×1920, 30 fps, audio AAC 44,1 kHz; proxies 1080×1920, 30 fps constantes, h264_qsv, AAC 48 kHz):

| Clip | Fecha (del nombre) | Dur. | Contenido |
|---|---|---|---|
| 20220424_144340 | 2022-04-24 | 1:16,2 | cantante con guitarra en el jardín (0–32 s); luego la cámara recorre batería (38–44 s), parlantes y público (paneos) |
| 20220424_144522 | 2022-04-24 | 0:19,4 | el mismo cantante, plano estable y abierto |
| 20230618_191002 | 2023-06-18 | 0:28,7 | ella canta con guitarra, él en teclado (interior); desde 14 s la cámara se mueve |
| 20240709_203849 | 2024-07-09 | 2:24,1 | dúo en el sillón (guitarra y ukelele), se ríen; plano fijo |
| 20240803_134458 | 2024-08-03 | 0:57,8 | ella canta con guitarra, de perfil y cerca |
| wa_111300 | sin fecha (WhatsApp) | 1:30,3 | chica de pelo rizado con guitarra, primer plano, muy expresiva. Original 848×480 rotado |
| wa_111351 | sin fecha (WhatsApp) | 0:28,1 | hombre con gorra y buzo rojo, ukelele, se ríe. Original 368×576 |
| wa_111505 | sin fecha (WhatsApp) | 0:13,5 | chica canta al micrófono con guitarra, de cerca. Original 480×1068 |
| wa_111602 | sin fecha (WhatsApp) | 1:25,3 | chico canta con micrófono en el living (poca luz); a los ~9 s aparece una mujer con guitarra. Original 464×832 |

  Los 4 de WhatsApp (agregados 2026-09-29, v4) están en los crudos con su nombre original ("WhatsApp Video 2026-09-29 at 11.13.00 AM.mp4", etc.); los proxies se llaman `wa_<hora>`. Son de baja resolución y fps variable: proxies reescalados a 1080 de ancho (lanczos) y 30 fps constantes; zoom máximo 1,1–1,15 (`zoomMax` en `clips.json`).

  Datos: `datos/caras.json` (`detectar_caras.py`, MediaPipe a 2 fps con mosaicos para caras chicas), `datos/candidatos.json` → hoja `out/…/revision/fragmentos.png` → `datos/clips.json` (tomas elegidas, ganancias) → `datos/encuadre.json` (`encuadre.py`). Hojas de contacto por clip en `out/…/revision/contacto_*.jpg`.
  Transcripción: se intentó con Whisper (`datos/transcripciones/`) pero con música continua tardaba ~8x el tiempo real en la i3; se cortó y los cortes se eligieron por nivel de audio (mínimos de RMS cerca de cada corte).

## Guiones
- `guion_reel-30s.md` — reel de 30 s, 9:16 (aplicar cambios con `/aplicar-guion 2026-09-29_claudio_musica`)

## Decisiones
- **Plantilla:** `MontajeMusical` (nueva, reutilizable): tomas con reencuadre sobre caras (zoom fijo por toma + centro que sigue a las caras), audio original con fundido cruzado, destello + whoosh en cada corte, título, etiquetas de año, notas flotando y cierre en stickers (Fredoka). Composición `claudio-musica-reel30`.
- **Montaje (v4, 40 s, 10 tomas):** dúo (gancho) → ukelele (wa_111351) → cantante de pie (191002) → guitarra y teclado (191002, recortada a 0,2–4,0 s) → pelo rizado (wa_111300) → dúo 92 s → chico (wa_111602) → solista (134458, recortada a 34,0–37,9 s) → micrófono (wa_111505) → dúo de cierre (recortado a 18,8–24,5 s). Historial: v2 quitó al baterista; v3 quitó al cantante de remera blanca (144340) por el dúo de 92 s.
- **Apariencia (v3):** "sutil" a pedido (títulos minimalistas, poco color; notas más sutiles): textos blancos en Poppins con sombra y degradado oscuro leve; año con línea fina; 2 notas blancas al 32 %. v4: notas con más presencia a pedido (4 notas, 68 px, 60 %, sombra marcada, leve balanceo); sin años en pantalla porque los videos de WhatsApp no tienen fecha; cierre sin subtexto. v1–v2: "sticker" (Fredoka, cápsulas amarillo/rosa).
- **Música:** sin música agregada: audio original de los clips, cada tramo nivelado a -18,5 LUFS (gananciaDb en `clips.json`, recalculadas en v4). SFX: Mixkit "Cinematic whoosh fast transition" (id 1492, ya estaba en la biblioteca) a -20 dB en cada corte.
- **Finales (cierre 2026-09-30):**
  - Entrega vigente: `reel-40s_9x16_v4.mp4` (40,1 s, 1080×1920, 30 fps, h264 + AAC, 36,0 MB). Queda también `reel-30s_9x16_v3.mp4` como última versión de 30 s.
  - Plantilla: `MontajeMusical`, apariencia "sutil" (Poppins). Composición `claudio-musica-reel30`.
  - Música: ninguna agregada (audio original de los clips). Único material de terceros: SFX Mixkit id **1492** "Cinematic whoosh fast transition", Mixkit Sound Effects Free License, descargado 2026-09-28, sha256 `02b8cd40b376…` (registro en `public/biblioteca/LICENCIAS-mixkit.json`). Copia del original en `C:/Videos/archivo/2026-09-29_claudio_musica/biblioteca/`.
  - Volumen medido al cierre (`ebur128`): v4 = -14,0 LUFS, LRA 1,8 LU, pico -1,4 dBFS · v3 = -14,0 LUFS, LRA 2,0 LU, pico -1,5 dBFS.
  - Sin confirmación explícita del cliente sobre música y textos: se cerró con lo usado en v4.

## Entregas
| Archivo (`out/2026-09-29_claudio_musica/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `reel-30s_9x16_v1.mp4` (30,1 s · 33,9 MB) | 2026-09-29 | Primera versión: 30 s, 1080×1920, 6 tomas (2022–2024) con reencuadre sobre caras, audio original, stickers. -14,0 LUFS, pico -1,4 dBFS |
| `reel-30s_9x16_v2.mp4` (30,1 s · 31,0 MB) | 2026-09-29 | Sin el baterista: la 3ª toma pasa a ser la cantante de 2023 de pie (191002, 24,5–28,05 s), con etiqueta "2023". Misma duración. -14,0 LUFS, pico -1,4 dBFS |
| `reel-30s_9x16_v3.mp4` (30,1 s · 25,6 MB) | 2026-09-29 | Sin el cantante de remera blanca (2022): entra el dúo del sillón (203849, 92,0–96,35 s, "2024") y se reordena; títulos, año y notas en apariencia "sutil" (blanco, Poppins, sin color); cierre "La música nos une · 2023 · 2024". -14,0 LUFS, pico -1,5 dBFS |
| `reel-40s_9x16_v4.mp4` (40,1 s · 36,0 MB) | 2026-09-29 | 40 s (+10 s) y 10 tomas: se suman los 4 videos de WhatsApp (ukelele, pelo rizado, chico, micrófono); se recortan 191002, 134458 y el dúo de cierre; notas con más presencia; sin años. -14,0 LUFS, pico -1,4 dBFS. Premiere: `out/…/premiere/reel-40s_9x16_v4.xml` + capa `graficos_65cb06cdb0.mov` (/a-premiere) |

## Cómo rehacerlo
1. Restaurar el material de trabajo (proxies):
   `cp -r "C:/Videos/archivo/2026-09-29_claudio_musica/public/." "public/trabajos/2026-09-29_claudio_musica/"`
   Si falta el whoosh en la biblioteca: `cp "C:/Videos/archivo/2026-09-29_claudio_musica/biblioteca/sfx/mixkit/mixkit-1492-cinematic-whoosh-fast-transition.wav" public/biblioteca/sfx/mixkit/` (o `node scripts/mixkit.mjs bajar 1492 --sfx`, que compara el sha256).
   Originales en `C:/Videos/crudos/2026-09-29_claudio_musica/`.
2. Caras (solo si cambian los proxies): `C:/Videos/_herramientas/.venv/Scripts/python.exe src/trabajos/2026-09-29_claudio_musica/detectar_caras.py` (~8 min en la i3).
3. Si cambian las tomas de `datos/clips.json`: `C:/Videos/_herramientas/.venv/Scripts/python.exe src/trabajos/2026-09-29_claudio_musica/encuadre.py`.
4. Render: `npx remotion render src/index.ts claudio-musica-reel30 out/2026-09-29_claudio_musica/revision/reel-40s_9x16_vN_premix.mp4 --crf=18`
5. Audio a -14 LUFS (loudnorm en dos pasadas, video copiado): medir con
   `ffmpeg -i …_premix.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null -`
   y aplicar con los valores medidos:
   `ffmpeg -i …_premix.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=…:measured_TP=…:measured_LRA=…:measured_thresh=…:offset=…:linear=true -c:a aac -b:a 192k out/2026-09-29_claudio_musica/final/reel-40s_9x16_vN.mp4`
6. Verificar: `ffmpeg -i out/2026-09-29_claudio_musica/final/reel-40s_9x16_vN.mp4 -af ebur128=peak=true -f null -`
7. Premiere: `node scripts/a-premiere.mjs 2026-09-29_claudio_musica`
