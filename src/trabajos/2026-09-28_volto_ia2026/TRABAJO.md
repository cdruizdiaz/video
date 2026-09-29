# 2026-09-28_volto_ia2026

| Campo | Valor |
|---|---|
| Cliente / marca | VOLTO (`src/marcas/volto`) |
| Pieza | IA2026 (comercial "¿Qué hace realmente un agente de IA en 2026?") |
| Estado | 🟢 Cerrado |
| Abierto | 2026-09-28 |
| Cerrado | 2026-09-28 |

## Brief
- **Pedido:** abierto como "CEI Niños"; renombrado a Volto / IA2026 al ver el material (2026-09-28).
- **Cliente:** VOLTO — "IA para empresas que potencia personas" (⚠️ sitio web a completar)
- **Objetivo:** explicar qué hace un agente de IA y posicionar a VOLTO como quien lo integra a los procesos de la empresa (inferido del guion hablado; confirmar)
- **Formato(s):** 9:16 1080×1920 · 30 fps (el material es vertical)
- **Duración:** ~48 s si se usan las 8 tomas (⚠️ confirmar; ¿también un corte de 15-30 s?)
- **Tono / estilo:** ⚠️ a completar (¿subtítulos palabra a palabra, gráficos, música?)
- **Textos obligatorios:** ⚠️ a completar
- **Llamado a la acción:** "Seguinos para ver cómo" (dicho en el clip 2839)
- **Material:** 8 tomas de iPhone (IMG_2819…2839), un presentador a cámara con corbatero, ~48 s de habla.
- **Kit de marca:** `src/marcas/volto/marca.ts` + `public/marcas/volto/` (logo.png, estrella.svg), deducido de volto.dev el 2026-09-28.
- **Entrega:** `out/2026-09-28_volto_ia2026/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-09-28_volto_ia2026/` (fuera del proyecto)
- **Proxies y material de trabajo:** `public/trabajos/2026-09-28_volto_ia2026/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/volto/`
- **Crudos** (proxies 1080×1920, 30 fps, libx264). Transcripción: `transcribir.mjs` → `datos/transcripcion_whisper.json` (cruda) → `corregir_transcripcion.mjs` → `datos/transcripcion.json` (palabras corregidas):

| Clip | Dur. | Texto (corregido) | Ubicación |
|---|---|---|---|
| IMG_2819 | 4,6 s | ¿Qué hace realmente un agente de IA en 2026? | exterior, fachada vidriada |
| IMG_2822 | 5,4 s | La mayoría usa IA para generar textos, respuestas, imágenes. | contraluz, sol detrás |
| IMG_2826 | 7,1 s | Pero un agente de IA puede resolver consultas, puede buscar información, ejecutar tareas y actualizar sistemas. | caminando por vereda, edificio y cielo |
| IMG_2833 | 6,0 s | Después lo conectamos con la información que necesita: clientes, productos, stock, historial. | subiendo escalera, entrada |
| IMG_2834 | 6,0 s | Definimos qué tiene que hacer, cómo tiene que responder y cuándo tiene que pedir ayuda. | subiendo escalera interior |
| IMG_2835 | 8,3 s | Y lo integramos con las herramientas que tu empresa ya usa, como Odoo, Tango, tu correo electrónico y WhatsApp. | oficina |
| IMG_2836 | 7,4 s | Así, el agente puede atender, vender, resolver tareas y derivar a una persona solamente cuando hace falta. | oficina, pared amarilla |
| IMG_2839 | 6,2 s | En Volto conectamos agentes de IA con los procesos de tu empresa. Seguinos para ver cómo. | banner VOLTO |

  Correcciones aplicadas (en `corregir_transcripcion.mjs`): "guía" → "IA" (2822, confirmado re-transcribiendo con vocabulario); "UDU" → "Odoo" (2835) y "la gente" → "el agente" (2836) por contexto ⚠️ confirmar escuchando; tiempos de "Seguinos…" (2839) y arranques de 2819/2822 ajustados con silencedetect.
  Orden lógico sugerido: 2819 · 2822 · 2826 · 2834 · 2833 · 2835 · 2836 · 2839 (2833 empieza con "Después", va tras 2834).

## Guiones
- `guion_ia2026-40s.md` — video de 40 s, 9:16 (aplicar cambios con `/aplicar-guion 2026-09-28_volto_ia2026`)

## Decisiones
- **Plantilla:** `HablaSubtitulada` (nueva, reutilizable): montaje por tomas desde `datos/clips.json`, subtítulos por palabra desde `datos/transcripcion.json` (palabra dicha en naranja, cápsula petróleo), zoom 1,12 en cortes dentro del mismo plano, logo arriba y cierre de marca. Composición `volto-ia2026-40s`.
- **Montaje:** orden lógico 2819 · 2822 · 2826 · 2834 · 2833 · 2835 · 2836 · 2839. Para llegar a 40 s: se quitaron “tu correo electrónico” (2835) y “solamente” (2836), se acortó la pausa de 2835 y el habla va a velocidad 1,055 (mantiene el tono). Cierre de 1,2 s.
- **Música:** Mixkit “Digital Clouds” (Alejandro Magaña, id 175), tramo 0–40 s, fundido de salida 2,5 s, preparada a -14 LUFS con `preparar_musica.sh`; en el mix, -21 dB (≈17 dB bajo la voz), sube en el cierre. Licencia en `public/biblioteca/LICENCIAS-mixkit.json` (Mixkit Stock Music Free License).
- **Voz:** cada toma nivelada a -18,3 LUFS (gananciaDb en `clips.json`); sin DeepFilterNet (ruido de fondo ~30 dB bajo la voz, limpio).
- **Mix final:** loudnorm en dos pasadas → -14,0 LUFS integrado, pico -1,5 dBFS (medido con ebur128).
- **Otras:** tipografías Geist (texto y títulos) y Dancing Script (manuscrita) en lugar de New Black / Nostalgic Memories del sitio (no están en Google Fonts).

## Entregas
| Archivo (`out/2026-09-28_volto_ia2026/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `ia2026-40s_9x16_v1.mp4` | 2026-09-28 | Primera versión: 40 s, 1080×1920, subtítulos, música suave, cierre con logo. -14,0 LUFS |

## Cómo rehacerlo
1. Restaurar el material: copiar `C:/Videos/archivo/2026-09-28_volto_ia2026/public/{crudos,audio,img}` a `public/trabajos/2026-09-28_volto_ia2026/` (ver `ARCHIVADO.txt`). Originales en `C:/Videos/crudos/2026-09-28_volto_ia2026/`.
2. Transcripción (solo si cambia el material): extraer WAV 16 kHz mono de cada crudo a `tmp/volto_ia2026/`, luego `node src/trabajos/2026-09-28_volto_ia2026/transcribir.mjs` y `node src/trabajos/2026-09-28_volto_ia2026/corregir_transcripcion.mjs`.
3. Música: `bash src/trabajos/2026-09-28_volto_ia2026/preparar_musica.sh`.
4. Render: `npx remotion render src/index.ts volto-ia2026-40s out/2026-09-28_volto_ia2026/revision/ia2026-40s_9x16_vN_premix.mp4 --crf=18`
5. Audio a -14 LUFS (loudnorm en dos pasadas, video copiado) → `out/2026-09-28_volto_ia2026/final/ia2026-40s_9x16_vN.mp4`; verificar con `ebur128`.
