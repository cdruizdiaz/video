---
description: Suma un personaje a la biblioteca de rigs a partir de su .ai (piezas, rig, editor y muestrario) para animarlo sin IA generativa
argument-hint: <archivo.ai> <nombre> [notas]
---

Armá el rig del personaje: $ARGUMENTS

Seguí `src/rig/README.md`. Gastá pocos tokens: no abras el .ai ni imágenes grandes; solo las hojas chicas de revisión (≤ 900 px). Pasos:

1. **Datos.** Si falta el archivo o el nombre, preguntámelos. Nombre: minúsculas, sin tildes ni espacios (guiones). Si ya existe `public/personajes/<nombre>/`, avisame: se reextrae sin pisar `rig.json` (lo nuevo queda en `rig.propuesto.json`).

2. **Extraer.** `C:/Videos/_herramientas/.venv/Scripts/python.exe scripts/rig/extraer_rig.py <archivo.ai> <nombre> --sinteticas ninguna`
   Copia el original a `carpetaPersonajes` (`scripts/herramientas.json`) y escribe `public/personajes/<nombre>/piezas.json`, `rig.json` y, en `out/personajes/<nombre>/`, `hoja_bloques.png`, `hoja_vistas.png`, `hoja_rostros.png` e `informe.md`.

3. **Revisar (yo, no el usuario).** Leé `informe.md` y mirá las tres hojas chicas. Corregí lo que esté mal con `src/personajes/<nombre>/mapa.json` (formato en el README: tipos y nombres de bloques, `renombrar`, `prefijoCorona`, `piezas` para forzar dibujos a una pieza) y volvé a extraer hasta que esté bien. Nombrá las caras por lo que muestran (normal, feliz, triste…) y los accesorios (escoba, sombrero…).

4. **Faltantes.** Mostrame las alertas del informe con su propuesta (bocas para hablar, pie o mano de atrás, piezas unidas que se separaron) y preguntame cuáles genero por código. Volvé a extraer con `--sinteticas <lista>` (visemas, pie_atras, mano_atras) o `todas`.

5. **Registrar.** Agregá el personaje a `src/personajes/index.ts` (import de `piezas.json` y `rig.json`). Aparecen solos en el Studio, carpeta `personajes`: `personaje-<nombre>-editor-<vista>` y `personaje-<nombre>-muestrario`.

6. **Probar.** `npx tsc` y una hoja del muestrario: `node scripts/rig/hoja_animacion.mjs personaje-<nombre>-muestrario out/personajes/<nombre>/hoja_muestrario.png --cada 24 --columnas 8 --escala 0.18`. Si algún pivote se ve mal (pétalos o manos que giran desde un lugar raro), corregilo en `rig.json` o decime que lo ajuste en el editor. Revisá también el 2,5D: `node scripts/rig/hoja_animacion.mjs personaje-<nombre>-muestra-25d out/personajes/<nombre>/hoja_25d.png --frames 15,75,45 --columnas 3 --escala 0.3` (giro ¾ a cada lado y frente, con luz): si alguna pieza se corre mal al girar, ajustá `vistas.frente.profundidad` en `rig.json` (+ adelante, - atrás).

7. **Resumen.** Vistas y piezas, caras, accesorios, bocas (cuáles son sintéticas), alertas pendientes y qué conviene pedirle al diseñador (`src/rig/GUIA_DISENADOR.md`). Recordame que puedo ajustar pivotes en `personaje-<nombre>-editor-<vista>` (panel de props → "Guardar en rig.json"). No renderices videos.
