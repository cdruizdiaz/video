# 2026-10-04_claudio_prueba-25d-video

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (pruebas internas) |
| Pieza | prueba de la fase 3 del plan de mejoras (video real 2,5D) |
| Estado | 🟡 En curso (prueba) |
| Abierto | 2026-10-04 |
| Cerrado | — |

## Brief
- **Objetivo:** probar recorte de personas, oclusión por profundidad, foto con paralaje y anclaje con cámara en mano.
- **Formato(s):** 9:16 (1080×1936 y 1080×1920) y 4:3 1440×1080 (el tramo de cámara en mano) · 30 fps
- **Modo de animación:** 2,5D sobre video real (Bloomie)
- **Entrega:** ninguna (revisión en `out/2026-10-04_claudio_prueba-25d-video/revision/`)

## Materiales
- `crudos/nene.mp4`, `crudos/guitarra.mp4`: proxies de `2026-10-04_claudio_prueba-mocap` (crudos archivados de `2026-09-29_claudio_musica`).
- `crudos/camara.mp4`: `lucia-70-anos.mp4` (archivo de `2026-09-30_lucia_lucia70`) de 7 a 13 s, cámara en mano.
- Generados: `crudos/nene_persona.webm` (mascaras.py, desde 5,5 s), `crudos/guitarra_cerca.webm` (profundidad.py --punto 800,1150, 4 s), `img/foto_guitarra.jpg` + `img/foto_guitarra_prof.png`, `datos/seguimiento_piso.json` (--punto 540,930).

## Composiciones
| ID | Qué prueba |
|---|---|
| `claudio-prueba-25d-video-detras` | texto "CANTÁ" y Bloomie detrás del nene (recorte de personas) |
| `claudio-prueba-25d-video-oclusion` | Bloomie camina detrás del guitarrista y del teclado (recorte por profundidad) |
| `claudio-prueba-25d-video-foto` | foto fija con movimiento de cámara 2,5D (FotoProfundidad) |
| `claudio-prueba-25d-video-anclado` | Bloomie anclado al piso con la cámara en mano (seguimiento) |

## Decisiones
- Oclusión por profundidad: margen 0,01 y transición 0,02 (con 0,04 las piernas del guitarrista, a la misma profundidad que el piso donde pisa Bloomie, quedaban detrás).
- Seguimiento: por defecto el movimiento de la cámara (todo el cuadro + RANSAC); con `--caja` solo una zona (objetos). Los dos dieron el mismo recorrido en este tramo (505–778 px).

## Entregas
| Archivo | Fecha | Cambios |
|---|---|---|

## Cómo rehacerlo
1. Copiar los proxies de `2026-10-04_claudio_prueba-mocap/crudos/` y cortar `camara.mp4` (`-ss 7 -t 6`, sin audio).
2. `python scripts/mascaras.py public/trabajos/<ID>/crudos/nene.mp4 public/trabajos/<ID>/crudos/nene_persona.webm --desde 5.5`
3. `python scripts/profundidad.py public/trabajos/<ID>/crudos/guitarra.mp4 out/<ID>/revision/guitarra_prof.mp4 --cada 6 --hasta 4 --recorte public/trabajos/<ID>/crudos/guitarra_cerca.webm --punto 800,1150`
4. `python scripts/profundidad.py public/trabajos/<ID>/img/foto_guitarra.jpg public/trabajos/<ID>/img/foto_guitarra_prof.png`
5. `python scripts/seguimiento.py public/trabajos/<ID>/crudos/camara.mp4 public/trabajos/<ID>/datos/seguimiento_piso.json --punto 540,930`
