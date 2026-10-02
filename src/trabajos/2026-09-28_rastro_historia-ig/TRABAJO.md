# 2026-09-28_rastro_historia-ig

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) |
| Pieza | Historia de Instagram de presentación de marca |
| Estado | 🟢 Cerrado (sin crudos: todo el material es de la marca) |
| Abierto | 2026-09-28 |
| Cerrado | 2026-10-02 |

## Brief
- **Objetivo:** presentar RASTRO, sus servicios y su equipo, e invitar a contactar.
- **Formato:** 9:16 1080×1920 · 30 fps · historia de Instagram.
- **Duración:** 30 s (guion de 6 escenas) y versión de 15 s con el mismo contenido.
- **Tono / estilo:** cercano, creativo y profesional; voseo; mercado argentino. Identidad de somosrastro.com.ar: crema, negro, Inter, títulos grandes, márgenes amplios, logo original.
- **Transiciones:** cortes directos; textos que suben suavemente; acercamiento lento en imágenes.
- **Audio:** base instrumental suave, entrada y salida graduales, sin voz en off.
- **Llamado a la acción:** "¿Tenés una idea? Dejemos rastro." · HABLEMOS · somosrastro.com.ar · @somos_rastro.

## Materiales
- Imágenes: `public/marcas/rastro/` (portada, equipo, piezas del sitio).
- Audio: `public/trabajos/2026-09-28_rastro_historia-ig/audio/`.

## Guiones
- `guion_historia-30s.md` (guion original del cliente) y `guion_historia-15s.md` (misma estructura, tiempos comprimidos y música de Mixkit). `guion_servicios-15s.md`: propuesta de historia de servicios de 15 s que quedó sin hacer al cerrar (sin composición); si se pide, abrir un trabajo nuevo reutilizando `HistoriaMarca`. Para cambiar el video: editar el guion y usar `/aplicar-guion 2026-09-28_rastro_historia-ig`.

## Decisiones
- **Plantilla:** `HistoriaMarca` (escenas portada → equipo → 3 piezas → contacto). Contenido en `composiciones.ts`.
- **Composiciones:** `rastro-historia-ig-30s` y `rastro-historia-ig-15s` (misma escena, `ritmo` 0,45 en la de 15 s).
- **Música 30 s:** compuesta por código (`musica_rastro.py … 30`), Fa mayor, 120 BPM, -15,5 LUFS.
- **Música 15 s:** Mixkit "Happy Home" de Michael Ramir C. (id 801 · sha256 `76b82159ba1d`; licencia libre de Mixkit: uso comercial, sin atribución; original archivado en `C:/Videos/archivo/2026-09-28_rastro_historia-ig/biblioteca/`), tramo 93,7–108,7 s: último estribillo + cierre real del tema (golpe final a los 14,3 s, sobre la escena de contacto). `preparar_musica_15s.sh`. -16,5 LUFS.
- **Volumen final (2026-10-02, al cerrar):** las entregas habían quedado en -15,5 (30 s) y -16,5 LUFS (15 s); se normalizaron a -14 LUFS con `loudnorm` en dos pasadas, copiando el video sin recodificar: `historia-30s_9x16_v2.mp4` -14,0 LUFS (pico -1,5 dBFS) y `historia-15s_9x16_v3.mp4` -13,7 LUFS (pico -2,6 dBFS).

## Entregas
| Archivo (`out/2026-09-28_rastro_historia-ig/final/`) | Fecha | Cambios |
|---|---|---|
| `historia-15s_9x16_v1.mp4` | 2026-09-28 | Primera versión de 15 s (guion propio, música house compuesta por código) — código reemplazado |
| `historia-30s_9x16_v1.mp4` | 2026-09-28 | Guion de 6 escenas, 30 s, música suave compuesta por código |
| `historia-15s_9x16_v2.mp4` | 2026-09-28 | Guion de 6 escenas comprimido a 15 s, música de Mixkit "Happy Home" |
| `historia-30s_9x16_v2.mp4` | 2026-10-02 | Mismo video que la v1; audio normalizado de -15,5 a -14,0 LUFS (pico -1,5 dBFS) |
| `historia-15s_9x16_v3.mp4` | 2026-10-02 | Mismo video que la v2; audio normalizado de -16,5 a -13,7 LUFS (pico -2,6 dBFS) |

## Cómo rehacerlo
1. Restaurar los audios: copiar `C:/Videos/archivo/2026-09-28_rastro_historia-ig/public/` sobre `public/trabajos/2026-09-28_rastro_historia-ig/` (si falta el tema de Mixkit en `public/biblioteca/`, copiarlo desde `…/biblioteca/` y verificar con `node scripts/mixkit.mjs verificar`). O regenerarlos:
```bash
python src/trabajos/2026-09-28_rastro_historia-ig/musica_rastro.py tmp/raw30.wav 30   # + loudnorm → audio/rastro-base.wav
bash src/trabajos/2026-09-28_rastro_historia-ig/preparar_musica_15s.sh
```
2. Render:
```bash
npx remotion render src/index.ts rastro-historia-ig-30s out/2026-09-28_rastro_historia-ig/final/historia-30s_9x16_vN.mp4 --crf=18
npx remotion render src/index.ts rastro-historia-ig-15s out/2026-09-28_rastro_historia-ig/final/historia-15s_9x16_vN.mp4 --crf=18
```
3. Normalizar el audio del render a -14 LUFS (el render queda más bajo): medir con `loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json` y aplicar la segunda pasada con los valores medidos y `linear=true`, con `-c:v copy -c:a aac -b:a 320k`; verificar con `ebur128`.
