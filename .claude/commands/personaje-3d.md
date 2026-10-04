---
description: Arma en Blender el modelo 3D de un personaje de la biblioteca de rigs (mismos huesos y poses que el 2D), con hoja de giro para revisar y .glb para Remotion
argument-hint: <nombre> [--estilo toon] [notas]
---

Armá el modelo 3D del personaje: $ARGUMENTS

El personaje ya tiene que estar en la biblioteca de rigs (`public/personajes/<nombre>/piezas.json` y `rig.json`; si no, primero `/rig-personaje`). Todo local: Blender portable en `blender` de `scripts/herramientas.json`. Detalle en `src/rig/README.md` → 3D con Blender. Pasos:

1. **Cara.** Renderizá un cuadro de la cara de frente (composición con `CaraTextura` de `src/rig/CaraTextura.tsx`; si el trabajo no tiene una, usá la de `src/trabajos/2026-10-04_claudio_prueba-blender/` como modelo) a `out/personajes/<nombre>/cara.png`:
   `npx remotion still src/index.ts <comp-cara> out/personajes/<nombre>/cara.png --frame=0`

2. **Construir.** `C:/Videos/_herramientas/blender/blender.exe -b --factory-startup --python-exit-code 1 -P scripts/blender/personaje_desde_rig.py -- <nombre> --cara out/personajes/<nombre>/cara.png`
   Deja `C:/Videos/personajes/<nombre>/<nombre>_3d.blend` (lo usa el render) y `public/personajes/<nombre>/<nombre>.glb` (para `Modelo3D` en Remotion). Cabeza y cuerpo = elipsoides; manos y pies = elipsoides chicos; pétalos/pelo/resto = el contorno de la pieza extruido con bisel (la corona inclinada hacia atrás); contorno de dibujo animado; cara = calcomanía sobre la cabeza.

3. **Revisar (yo, no el usuario).** `node scripts/blender/hoja_giro.mjs <nombre> [--estilo toon]` → `out/personajes/<nombre>/giro_3d.png` (8 ángulos). Mirá la hoja chica: que la cara quede sobre la cabeza en los 3/4, que no haya piezas negras (material del SVG) ni flotando, que la corona no atraviese la cabeza. Si un personaje no se parece a esas formas (no es "cabeza + cuerpo + extremidades"), decímelo: puede convenir un modelo hecho por un modelador (`.glb` con `Modelo3D`).

4. **Probar la animación.** En un trabajo, con un `animacion.json` (PersonajeRigProps: las mismas pistas que el 2D) y la composición de cara del trabajo:
   `node scripts/blender/render.mjs <ID> <nombre-capa> public/trabajos/<ID>/datos/animacion.json <duración> --cara <comp-cara> [--rotY 0.35] [--luz 135] [--estilo toon]`
   Deja la capa con alfa en `public/trabajos/<ID>/cache3d/` (+ `datos/cache3d.json`; se reusa si nada cambió). Eevee tarda ~1,5–2 s por cuadro 1080×1920 en la i3: avisá el tiempo antes de lanzar algo largo y correlo en segundo plano. Revisá con `node scripts/revisar.mjs <comp-final> <ID>`.

5. **Registrar.** Anotá en `src/rig/README.md` (sección del personaje) lo que hubo que ajustar y agregá el modelo a la tabla de personajes 3D.
