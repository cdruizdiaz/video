# 2026-10-04_claudio_prueba-blender

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (pruebas internas) |
| Pieza | prueba de la fase 5 del plan de mejoras (Blender sin interfaz) |
| Estado | 🟡 En curso (prueba) |
| Abierto | 2026-10-04 |
| Cerrado | — |

## Brief
- **Objetivo:** Bloomie modelado en Blender desde su rig, animado con las mismas pistas que el 2D (camina, salta, saluda) y con la cara del rig como textura animada; capa con alfa para Remotion.
- **Formato:** 9:16 1080×1920 · 30 fps · 130 cuadros
- **Modo de animación:** 3D (Blender Eevee)
- **Luz:** sol a 135° (arriba a la izquierda), 45° de altura
- **Entrega:** ninguna (revisión en `out/2026-10-04_claudio_prueba-blender/revision/`, hoja de giro en `out/personajes/bloomie/giro_3d.png`)

## Datos
- `datos/animacion.json`: PersonajeRigProps (respirar, parpadear, caminar con trayecto, saltar, saludar; cara feliz). La usan la composición 2D, la cara y Blender.
- `datos/cache3d.json`: capa de Blender en `cache3d/` (no se versiona; se regenera con render.mjs).

## Composiciones
| ID | Qué es |
|---|---|
| `claudio-prueba-blender-cara` | textura de la cara (512×512, transparente) que usa Blender |
| `claudio-prueba-blender-2d` | la misma animación con el rig 2D (para comparar) |
| `claudio-prueba-blender-final` | fondo + sombra de contacto + capa de Blender |
| `claudio-prueba-blender-glb` | `bloomie.glb` exportado, girando con `Modelo3D` (`--gl=angle`) |

## Decisiones
- Blender portable (el MSI de winget se quedaba esperando permisos de administrador).
- Las poses las calcula el motor TS del rig (`poses.ts` con vite-node): Blender anima exactamente igual que el 2D.
- La sombra de contacto la pone Remotion (Eevee no atrapa sombras sobre un piso invisible).
- Tiempos (i3): Blender 1,5–2 s/cuadro; 130 cuadros ≈ 4 min en total.

## Entregas
| Archivo | Fecha | Cambios |
|---|---|---|

## Cómo rehacerlo
1. `npx remotion still src/index.ts claudio-prueba-blender-cara out/<ID>/revision/cara_f100.png --frame=100`
2. `C:/Videos/_herramientas/blender/blender.exe -b --factory-startup --python-exit-code 1 -P scripts/blender/personaje_desde_rig.py -- bloomie --cara out/<ID>/revision/cara_f100.png`
3. `node scripts/blender/render.mjs <ID> claudio-prueba-blender public/trabajos/<ID>/datos/animacion.json 130 --cara claudio-prueba-blender-cara --rotY 0.35 --muestras 8`
4. `node scripts/blender/hoja_giro.mjs bloomie`

## Sobre video real (`claudio-prueba-blender-video`)
- `datos/animacion_video.json`: camina de x 1180 a 380 sobre y 1150 (escala 0,85), `--rotY -0.9`, `--luz 135`.
- Fondo y oclusión: `guitarra.mp4` y `guitarra_cerca.webm` de `2026-10-04_claudio_prueba-25d-video` (fase 3).
- `node scripts/blender/render.mjs <ID> claudio-prueba-blender-video public/trabajos/<ID>/datos/animacion_video.json 110 --cara claudio-prueba-blender-cara --rotY -0.9 --luz 135 --muestras 8` (3 min).
