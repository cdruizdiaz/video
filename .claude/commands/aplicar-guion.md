---
description: Adecua el video de un trabajo a una versión nueva de su guion audiovisual (pegada o editada en el archivo) y renderiza una versión _vN nueva
argument-hint: <ID de trabajo> [pieza] (+ guion pegado debajo, opcional)
---

Aplicá la versión nueva del guion al video. Datos y, si lo pegué, el guion: $ARGUMENTS

1. **Ubicar el guion.**
   - Identificá el trabajo y la pieza (si hay varias `guion_*.md` en `src/trabajos/<ID>/` y no lo aclaré, preguntame cuál).
   - Si pegué un guion, guardalo sobre `src/trabajos/<ID>/guion_<pieza>.md` ANTES de hacer nada más.
   - Si el guion es para una pieza que todavía no existe (p. ej. una versión de otra duración), creá el archivo nuevo y una composición nueva en `composiciones.ts`.

2. **Detectar qué cambió.** Compará con la versión anterior con `git diff -- src/trabajos/<ID>/guion_<pieza>.md` (o, si no hay versión previa en git, contra lo que hoy hace `composiciones.ts`). Listame los cambios en una tabla: escena | campo | antes | ahora | cómo lo aplico. Tocá SOLO lo que cambió.

3. **Aplicar cada cambio donde corresponde:**
   - **Textos, imágenes, número de escena, pies** → datos en `src/trabajos/<ID>/composiciones.ts`.
   - **Tiempos** → `dura` de cada escena (segundos × 30 = frames). Si la duración total cambia, se recalcula sola. Si las escenas quedan muy cortas, ajustá `ritmo` (referencia: 1 para escenas de 4-5 s; 0,45 para escenas de 2 s) para que los textos alcancen a leerse.
   - **Movimiento: "motion blur" / "estela"** → prop `desenfoque` de lo que se mueve (`PersonajeRig`, personajes de `ExplicacionGeometrica`, `Logo3D`, `Muestra3D`: `true` o `{ modo: "estela" }`) o `desenfoqueEntrada` para los carteles (`HistoriaMarca`, `MontajeMusical`, `ExplicacionGeometrica`); en piezas propias del trabajo, `<ConDesenfoque>` + `<PorCuadro>` de `src/plantillas/comunes/Desenfoque.tsx`. Solo en los tramos rápidos (los calcula `tramosRapidos`), nunca sobre el fondo, el video ni el audio, y sin cruzar cortes. Si se saca del guion, sacar la prop.
   - **Imágenes nuevas** → buscalas en `public/marcas/<cliente>/` o `public/trabajos/<ID>/img/`; si no existen, pedímelas (o proponé de dónde sacarlas) y no inventes.
   - **Audio** → si cambia el carácter de la música, proponé 2-3 opciones de Mixkit (`scripts/mixkit.mjs`) antes de bajar; prepará el tramo en `public/trabajos/<ID>/audio/` (recorte, fundidos, loudnorm) con un script en `src/trabajos/<ID>/` y medí con `ebur128`.
   - **Algo que la plantilla no sabe hacer** (escena de otro tipo, otra animación, otra transición) → primero proponé cómo resolverlo. Cambios en `src/plantillas/` afectan a TODOS los trabajos que la usan: preferí agregar una opción nueva (que por defecto se comporte como antes) en lugar de cambiar el comportamiento existente.
   - **Estética / tono / marca** → si implica cambiar el kit de marca, preguntame antes.

4. **Revisar.** `npx tsc --noEmit`. Renderizá una secuencia a `--scale=0.25` de la composición y armá una hoja de contactos en `out/<ID>/revision/` con un frame por escena (cerca del final de cada una, con todo visible). Miralá y verificá: textos completos y sin cortes, dentro de las zonas seguras (y 250–1580), tiempos según el guion. Si algo no entra, corregilo (tamaño o corte de línea) y avisame.

5. **Entregar.** Renderizá la versión final como `out/<ID>/final/<salida>_v<N+1>.mp4` (`--crf=18`, nunca sobrescribir), medí el volumen con `ebur128` y agregala a la tabla de entregas de `TRABAJO.md` con un resumen de los cambios. Si la composición tiene `premiere` en `composiciones.ts`, exportá también esa versión a Premiere con `node scripts/a-premiere.mjs <ID>` (en segundo plano; reutiliza la capa de gráficos si no cambió).

6. **Informe.** Mostrame: la tabla de cambios aplicados, cualquier punto del guion que no se pudo seguir al pie de la letra (y por qué), la hoja de contactos y la ruta del video nuevo. Ofrecé hacer commit y push (guion + código + TRABAJO.md).
