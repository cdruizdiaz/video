---
description: Abre un trabajo de video nuevo (carpetas, ficha TRABAJO.md, proxies y registro en Remotion)
argument-hint: <cliente> <pieza> [carpeta de crudos] [brief libre]
---

Abrí un trabajo nuevo con estos datos: $ARGUMENTS

Seguí la estructura de trabajos de CLAUDE.md. Pasos:

1. **ID.** Armalo como `AAAA-MM-DD_<cliente>_<pieza>` con la fecha de hoy, todo en minúsculas, sin tildes ni espacios (guiones dentro de cada parte). Si falta el cliente o la pieza, preguntámelos antes de seguir. Si ya existe un trabajo con ese ID, avisame y no pises nada.

2. **Marca.** Verificá si existe `src/marcas/<cliente>/marca.ts`. Si no existe, avisame: hay que crear el kit de marca (colores, tipografía, logo en `public/marcas/<cliente>/`) antes de diseñar; ofrecé armarlo a partir del sitio web o del material del cliente.

3. **Carpetas** (con `.gitkeep` en cada una):
   - `public/trabajos/<ID>/crudos`, `audio`, `img`, `datos`
   - `out/<ID>/revision`, `out/<ID>/final`
   - `src/trabajos/<ID>/`
   - Originales: `<carpetaCrudos>/<ID>/` (ruta en `scripts/herramientas.json`), fuera del proyecto.

4. **Ficha.** Copiá `src/trabajos/_plantilla/TRABAJO.md` a `src/trabajos/<ID>/TRABAJO.md` y completá los campos `{{...}}`. Pasá al brief todo lo que te di; lo que falte dejalo marcado para completar. Si el trabajo lleva un personaje animado y el brief no dice el **modo de animación** (plano, 2,5D o 3D), preguntámelo; en 2,5D/3D sobre material real, anotá también la dirección de la luz de la escena (medida en un recorte chico).

5. **Crudos** (solo si me pasaste una carpeta con material):
   - Copiá los originales a `<carpetaCrudos>/<ID>/` (no los muevas: copiá y verificá tamaños).
   - Generá proxies en `public/trabajos/<ID>/crudos/` con el ffmpeg completo (ruta en `herramientas.json`): 1080p del lado corto, 30 fps constantes, el códec de `codecBorrador` (en `C:/Videos/_herramientas/equipo.json`) + `-g 30`, audio AAC 48 kHz. Si ese códec falla, usá `libx264 -preset veryfast -crf 20`. Corrélo en segundo plano si son varios o largos.
   - Listame cada crudo con duración, resolución y fps (ffprobe). No abras ni leas los videos.

6. **Registro en Remotion.** No crees la composición todavía si el brief no está claro. Cuando lo esté:
   - elegí una plantilla de `src/plantillas/` (o proponé una nueva si ninguna sirve);
   - creá `src/trabajos/<ID>/composiciones.ts` (ver el trabajo de ejemplo `2026-09-28_rastro_historia-ig`);
   - registralo en `src/trabajos/index.ts`.
   - IDs de composición: solo letras, números y guiones (`<cliente>-<pieza>-<variante>`).

7. **Resumen.** Mostrame el ID, las carpetas creadas, qué falta del brief y el próximo paso sugerido. No renderices nada.
