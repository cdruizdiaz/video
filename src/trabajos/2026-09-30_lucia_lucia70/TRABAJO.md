# 2026-09-30_lucia_lucia70

| Campo | Valor |
|---|---|
| Cliente / marca | Lucia (personal; sin kit de marca: no hizo falta) |
| Pieza | Lucia70 (reel de los 70 años de Lucía: la niña de la guitarra) |
| Estado | 🟢 Cerrado (2026-09-30) |
| Abierto | 2026-09-30 |
| Cerrado | 2026-09-30 |

## Brief
- **Pedido:** `/nuevo-trabajo Lucia Lucia70 "C:\Users\CLAUDIO\Downloads\Lucia 70 años"` (sin más datos).
- **Pedido (2026-09-30):** "un video para redes sociales en formato vertical 9:16 de 15 segundos donde se luzca en primer plano la niña tocando la guitarra".
- **Objetivo:** reel para redes que luce a la niña que toca la guitarra en la fiesta.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Duración:** 15 s
- **Tono / estilo:** cálido, familiar, festivo (decisión propia); la niña siempre en primer plano
- **Música:** el audio original (la canción que tocan en la fiesta), sin música agregada (decisión propia; quedó así al cierre)
- **Textos obligatorios:** ninguno pedido; se usaron "Lucía / 70 años" y "¡Feliz cumpleaños!" (quedaron así al cierre, sin confirmación explícita; sin el nombre de la niña)
- **Llamado a la acción:** ninguno
- **Entrega:** `out/2026-09-30_lucia_lucia70/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-09-30_lucia_lucia70/` (fuera del proyecto; copiados de `C:\Users\CLAUDIO\Downloads\Lucia 70 años`)
- **Proxies y material de trabajo:** archivados en `C:/Videos/archivo/2026-09-30_lucia_lucia70/public/` (en el repo queda solo `public/trabajos/2026-09-30_lucia_lucia70/datos/`)
- **Marca:** — (sin kit)
- **Crudos:**

| Clip (proxy) | Original | Dur. | Original | Proxy | Contenido |
|---|---|---|---|---|---|
| `lucia-70-anos.mp4` | `lucia 70 años.MP4` (75,4 MB) | 5:30,1 | 640×480 (4:3), 15 fps, h264, AAC mono 44,1 kHz | 1440×1080, 30 fps constantes, h264_qsv, AAC mono 48 kHz (224,5 MB) | fiesta en un salón con puerta de madera y globos: un hombre de camisa blanca y una niña de remera roja tocan la guitarra; una mujer de vestido blanco canta al micrófono (30–60 s); dos mujeres y un nene junto a la mesa. La niña toca de corrido de 165 a 295 s y de 303 a 328 s; de 314 a 322 s la cámara la tiene más cerca. 295–302 s: paneo a los invitados |

  El original es de baja resolución (640×480) y 15 fps: el proxy está reescalado a 1080 de alto (lanczos) y con los cuadros duplicados a 30 fps. No admite mucho zoom (máximo usado: 1,6).

  Hojas de contacto: `out/…/revision/contacto_0.jpg`, `contacto_1.jpg` (un cuadro cada 5 s) y `contacto_296-330.jpg` (uno por segundo). Sin transcripción (es una canción). Datos: `datos/clips.json` (tomas y zoom de cada plano) → `datos/encuadre.json` (`encuadre.py`: sigue a la niña por su remera roja; MediaPipe no encuentra su cara, chica y a contraluz).

## Guiones
- `guion_guitarra-15s.md` — reel de 15 s, 9:16 (aplicar cambios con `/aplicar-guion 2026-09-30_lucia_lucia70`)

## Decisiones
- **Plantilla:** `MontajeMusical`, apariencia "sutil". Composición `lucia-lucia70-guitarra15`. Se le agregaron dos opciones: `anchoFuente` por toma (recorrer entero un crudo que no es 9:16; acá 2560 para el 4:3) y `filtroVideo` (acá `brightness(1.18) saturate(1.12)`, por el contraluz).
- **Montaje (v1):** 15 s seguidos del crudo (307,0–322,0 s) en 4 planos con zoom 1,15 → 1,45 → 1,6 → 1,5; la canción no se corta. Sin whoosh.
- **Música:** sin música agregada ni material de Mixkit: audio original del crudo, normalizado a -14 LUFS.
- **Otras:** sin exportación a Premiere por ahora: `premiere.ts` de la plantilla todavía no contempla `anchoFuente`.
- **Finales (cierre 2026-09-30):**
  - Entrega vigente: `guitarra-15s_9x16_v1.mp4` (15,1 s, 1080×1920, 30 fps, h264 + AAC, 16,9 MB). Única versión.
  - Plantilla: `MontajeMusical`, apariencia "sutil" (Poppins). Composición `lucia-lucia70-guitarra15`.
  - Música: ninguna agregada; audio original del crudo. Sin material de Mixkit ni de terceros (nada que registrar en licencias).
  - Volumen medido al cierre (`ebur128`): -13,9 LUFS, LRA 0,3 LU, pico -3,5 dBFS.
  - Sin confirmación explícita sobre textos y audio: se cerró con lo usado en v1.

## Entregas
| Archivo (`out/2026-09-30_lucia_lucia70/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `guitarra-15s_9x16_v1.mp4` (15,1 s · 16,9 MB) | 2026-09-30 | Primera versión: 15 s, 1080×1920, 4 planos de la niña con la guitarra (307–322 s del crudo), audio original, título "Lucía · 70 años" y cierre "¡Feliz cumpleaños!". -13,9 LUFS, pico -3,5 dBFS |

## Cómo rehacerlo
1. Restaurar el proxy: `cp -r "C:/Videos/archivo/2026-09-30_lucia_lucia70/public/." "public/trabajos/2026-09-30_lucia_lucia70/"`. Originales en `C:/Videos/crudos/2026-09-30_lucia_lucia70/`.
2. Proxy (solo si no se restaura del archivo): `ffmpeg -i "C:/Videos/crudos/2026-09-30_lucia_lucia70/lucia 70 años.MP4" -vf "scale=-2:1080:flags=lanczos,fps=30,format=nv12" -c:v h264_qsv -global_quality 23 -g 30 -c:a aac -ar 48000 -b:a 160k public/trabajos/2026-09-30_lucia_lucia70/crudos/lucia-70-anos.mp4`
3. Si cambian las tomas de `datos/clips.json`: `C:/Videos/_herramientas/.venv/Scripts/python.exe src/trabajos/2026-09-30_lucia_lucia70/encuadre.py` (con `--seguir <desdeS> <hastaS>` solo imprime el seguimiento de un tramo).
4. Render: `npx remotion render src/index.ts lucia-lucia70-guitarra15 out/2026-09-30_lucia_lucia70/revision/guitarra-15s_9x16_vN_premix.mp4 --crf=18`
5. Audio a -14 LUFS (loudnorm en dos pasadas, video copiado): medir con `ffmpeg -i …_premix.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null -` y aplicar con `-c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=…:measured_TP=…:measured_LRA=…:measured_thresh=…:offset=…:linear=true -ar 48000 -c:a aac -b:a 192k` → `out/2026-09-30_lucia_lucia70/final/guitarra-15s_9x16_vN.mp4`.
6. Verificar: `ffmpeg -i out/2026-09-30_lucia_lucia70/final/guitarra-15s_9x16_vN.mp4 -af ebur128=peak=true -f null -`
