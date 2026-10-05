# 2026-10-04_claudio_prueba-3d

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (pruebas internas) |
| Pieza | prueba de la fase 4 del plan de mejoras (3D dentro de Remotion) |
| Estado | 🟡 En curso (prueba) |
| Abierto | 2026-10-04 |
| Cerrado | — |

## Brief
- **Objetivo:** probar lienzo 3D recortado, capa 3D en caché, sombreado toon, plantilla Logo3D y modelos .glb animados.
- **Formato(s):** 9:16 1080×1920 (Rastro: 16:9 1920×1080) · 30 fps
- **Modo de animación:** 3D (`--gl=angle`)
- **Entrega:** ninguna (revisión en `out/2026-10-04_claudio_prueba-3d/revision/`)

## Composiciones
| ID | Qué prueba |
|---|---|
| `claudio-prueba-3d-completo` / `-recortado` | Bloomie 3D camina, salta y saluda; lienzo de todo el cuadro vs. recortado (misma imagen: difieren 0,001 % de los píxeles) |
| `claudio-prueba-3d-capa` | la misma escena solo-3D, transparente: la que guarda `scripts/capa3d.mjs` |
| `claudio-prueba-3d-final` | fondo + capa en caché (sin WebGL) |
| `claudio-prueba-3d-toon` | estilo toon (3 tonos) |
| `claudio-prueba-3d-logo-volto` | Logo3D "armado" con textura del logo y texto (marca Volto) |
| `claudio-prueba-3d-logo-rastro` | Logo3D "giro", 16:9, frente color tinta (marca Rastro) |
| `claudio-prueba-3d-robot` | `.glb` RobotExpressive (CC0): Idle → Wave → Dance con fundidos |

## Decisiones
- Velocidad medida en la i3: Bloomie 3D ~0,09 s/cuadro con lienzo completo o recortado (ANGLE usa la Intel UHD); la capa VP9 con alfa 0,24 s/cuadro; la final desde la caché tardó lo mismo que en vivo (decodificar VP9 con alfa cuesta). La caché sirve para escenas pesadas, PCs sin WebGL rápido y revisiones repetidas, no para acelerar esta escena simple.
- Logos: los kits tienen PNG → `scripts/vectorizar_logo.py` (silueta con agujeros) + PNG como textura del frente.

## Entregas
| Archivo | Fecha | Cambios |
|---|---|---|

## Cómo rehacerlo
1. `python scripts/vectorizar_logo.py public/marcas/<m>/logo.png public/trabajos/<ID>/img/logo_<m>.svg` y copiar `logo.png` a `img/logo_<m>.png` (volto y rastro).
2. `node scripts/capa3d.mjs claudio-prueba-3d-capa <ID>` (antes de `claudio-prueba-3d-final`).
3. Revisar con `node scripts/revisar.mjs <comp> <ID> --gl angle`.
