---
description: Exporta la edición de un trabajo a Adobe Premiere (XML con cortes, reencuadre, audio y capa de gráficos)
argument-hint: <ID del trabajo> [composición] [vN]
---

Exportá a Premiere: $ARGUMENTS

Si no me diste el ID, listá los trabajos abiertos (`node scripts/estado.mjs`) y preguntame cuál.

1. **Comprobar que se puede.** La composición tiene que tener `premiere` en `src/trabajos/<ID>/composiciones.ts` (hoy lo tiene la plantilla `MontajeMusical`). Si la plantilla no lo tiene, proponé cómo escribir su `premiere.ts` (formato en `src/plantillas/comunes/premiere.ts`) antes de hacerlo.

2. **Exportar** (en segundo plano: si cambiaron los gráficos, renderiza la capa ProRes 4444, que tarda unos minutos):
   `node scripts/a-premiere.mjs <ID> [composición] [--version N]`
   - Sin `--version`, usa la última `_vN` de `out/<ID>/final/`. No sobrescribe un XML existente salvo con `--forzar`.
   - `--sin-graficos`: sin capa V2. `--forzar-graficos`: la vuelve a renderizar aunque no haya cambiado.

3. **Informe.** Mostrame la ruta del XML, qué medio usa cada toma (original o copia de 30 fps constantes) y si la capa de gráficos es nueva o reutilizada. Recordame los pasos de importación (`out/<ID>/premiere/LEEME.txt`).

4. **Anotar** en `TRABAJO.md`, en la fila de la entrega, que tiene XML de Premiere.
