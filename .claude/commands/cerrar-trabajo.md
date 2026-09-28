---
description: Cierra un trabajo de video (verifica entregas, actualiza TRABAJO.md y archiva el material pesado fuera de public/)
argument-hint: <ID del trabajo>
---

Cerrá el trabajo: $ARGUMENTS

Si no me diste el ID, listá las carpetas de `public/trabajos/` y preguntame cuál.

1. **Verificar entregas.** Listá `out/<ID>/final/` con tamaño y duración de cada archivo (ffprobe). Medí el volumen de la última versión de cada pieza con `ebur128` (ffmpeg completo, ruta en `scripts/herramientas.json`). Si `final/` está vacía, avisame y no sigas.

2. **Actualizar `src/trabajos/<ID>/TRABAJO.md`:**
   - Estado: 🟢 Cerrado, con la fecha de hoy.
   - Tabla de entregas completa (archivo, fecha, cambios).
   - Decisiones finales (plantilla, música con su licencia, LUFS medidos).
   - Sección "Cómo rehacerlo" con los comandos reales.

3. **Archivar** (mostrame qué se va a mover y cuánto pesa, y pedime confirmación ANTES de mover):
   - Mové `public/trabajos/<ID>/` a `<carpetaArchivo>/<ID>/public/` (ruta en `herramientas.json`).
   - Copiá `out/<ID>/final/` a `<carpetaArchivo>/<ID>/final/`.
   - Los originales de `<carpetaCrudos>/<ID>/` no se tocan: decime cuánto ocupan por si quiero borrarlos yo.
   - Dejá en `public/trabajos/<ID>/` solo la carpeta `datos/` (JSON chicos) y un `ARCHIVADO.txt` que diga dónde está el resto y cómo restaurarlo.
   - El código (`src/trabajos/<ID>/`) queda en el repo: permite rehacer o repetir el trabajo.

4. **Resumen.** Mostrame lo archivado, el espacio liberado en `public/` y ofrecé hacer commit y push de `TRABAJO.md` y los datos.
