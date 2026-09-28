# 2026-09-28_rastro_historia-ig

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) |
| Pieza | Historia de Instagram de presentación de marca |
| Estado | 🟢 Entregado (sin crudos: todo el material es de la marca) |
| Abierto | 2026-09-28 |
| Cerrado | — |

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
- `guion_historia-30s.md` (guion original del cliente) y `guion_historia-15s.md` (misma estructura, tiempos comprimidos y música de Mixkit). Para cambiar el video: editar el guion y usar `/aplicar-guion 2026-09-28_rastro_historia-ig`.

## Decisiones
- **Plantilla:** `HistoriaMarca` (escenas portada → equipo → 3 piezas → contacto). Contenido en `composiciones.ts`.
- **Composiciones:** `rastro-historia-ig-30s` y `rastro-historia-ig-15s` (misma escena, `ritmo` 0,45 en la de 15 s).
- **Música 30 s:** compuesta por código (`musica_rastro.py … 30`), Fa mayor, 120 BPM, -15,5 LUFS.
- **Música 15 s:** Mixkit "Happy Home" de Michael Ramir C. (id 801), tramo 93,7–108,7 s: último estribillo + cierre real del tema (golpe final a los 14,3 s, sobre la escena de contacto). `preparar_musica_15s.sh`. -16,5 LUFS.

## Entregas
| Archivo (`out/2026-09-28_rastro_historia-ig/final/`) | Fecha | Cambios |
|---|---|---|
| `historia-15s_9x16_v1.mp4` | 2026-09-28 | Primera versión de 15 s (guion propio, música house compuesta por código) — código reemplazado |
| `historia-30s_9x16_v1.mp4` | 2026-09-28 | Guion de 6 escenas, 30 s, música suave compuesta por código |
| `historia-15s_9x16_v2.mp4` | 2026-09-28 | Guion de 6 escenas comprimido a 15 s, música de Mixkit "Happy Home" |

## Cómo rehacerlo
```bash
python src/trabajos/2026-09-28_rastro_historia-ig/musica_rastro.py tmp/raw30.wav 30   # + loudnorm → audio/rastro-base.wav
bash src/trabajos/2026-09-28_rastro_historia-ig/preparar_musica_15s.sh
npx remotion render src/index.ts rastro-historia-ig-30s out/2026-09-28_rastro_historia-ig/final/historia-30s_9x16_vN.mp4 --crf=18
npx remotion render src/index.ts rastro-historia-ig-15s out/2026-09-28_rastro_historia-ig/final/historia-15s_9x16_vN.mp4 --crf=18
```
