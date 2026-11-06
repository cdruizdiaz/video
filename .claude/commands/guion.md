---
description: Genera un guion audiovisual con tiempos (formato de guion del estudio) para un trabajo nuevo o para describir un video existente
argument-hint: <ID de trabajo | composición | descripción del video a proponer>
---

Generá un guion audiovisual con tiempos para: $ARGUMENTS

**Formato:** seguí EXACTAMENTE la estructura de `src/trabajos/_plantilla/GUION.md` (y como ejemplo real, `src/trabajos/2026-09-28_rastro_historia-ig/guion_historia-30s.md`):
- Encabezado: `VIDEO:`, `Duración:`, `Formato:`, `Estética:`, `Tono:`, `Audio:`, `Transiciones:`.
- Un bloque por escena: `Escena N — nombre`, `Tiempo: 00:00 a 00:04` (decimales con coma: `00:02,5`), `Imagen:`, y según corresponda `Elementos y textos:` (viñetas •), `Título:` / `Texto inferior:` (una línea por renglón, entre comillas “ ”), `Evolución visual:`, `Pie de escena:`, `Cierre:` y siempre `Intención:`.
- Si una toma lleva desenfoque de movimiento, una línea `Movimiento: motion blur …` o `Movimiento: estela …` diciendo sobre qué (personaje al saltar o correr, título al entrar/salir, logo 3D al girar). En un video existente, escribila solo si el código usa `desenfoque` / `desenfoqueEntrada`.
- Todos los textos que se ven en pantalla van entre comillas “ ”, exactamente como deben aparecer (mayúsculas incluidas). Voseo si la marca lo usa.
- Los tiempos de todas las escenas deben sumar la duración total, sin huecos ni superposiciones.

**Casos:**
1. **El video ya existe** (me diste un ID de trabajo o de composición): leé `src/trabajos/<ID>/composiciones.ts`, la plantilla que usa y `TRABAJO.md`, y describí lo que el video hace HOY (textos, imágenes, tiempos reales a partir de las duraciones en frames ÷ 30, animaciones, música). No inventes nada que no esté en el código.
2. **Video nuevo** (me diste una descripción o un trabajo sin composición): proponé el guion a partir del brief de `TRABAJO.md`, el kit de marca (`src/marcas/<cliente>/`) y el material disponible en `public/marcas/<cliente>/` y `public/trabajos/<ID>/` (usá solo nombres de archivo, no abras binarios). Tené en cuenta lo que las plantillas de `src/plantillas/` ya saben hacer y marcá con [NUEVO] lo que requeriría programar algo nuevo.
   - Zonas seguras de historias de Instagram: el contenido importante entre y=250 y y=1580.
   - Escenas de menos de ~2 s solo con textos muy cortos.

**Guardado:** escribí el guion en `src/trabajos/<ID>/guion_<pieza>.md` (`<pieza>` = el nombre de salida de la composición sin el formato, p. ej. `guion_historia-30s.md`). Si ya existe, no lo pises: mostrame las diferencias y preguntá. Si no hay trabajo todavía, sugerí correr `/nuevo-trabajo` primero.

**Respuesta:** mostrame el guion completo en el chat (para que pueda copiarlo y editarlo) y la ruta del archivo. Recordame que, cuando lo modifique, uso `/aplicar-guion <ID>` (pegándolo o editando el archivo).
