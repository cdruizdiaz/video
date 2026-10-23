# 2026-10-06_claudio_bloomie-plantado

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (demo) · personaje Bloomie (`src/marcas/bloomie`) |
| Pieza | bloomie-plantado (Bloomie cuenta un chiste en inglés: "I got stood up… I'm planted!") |
| Estado | 🟡 En curso |
| Abierto | 2026-10-06 |
| Cerrado | — |

## Brief
- **Objetivo:** Bloomie cuenta un chiste corto en inglés, en el mismo escenario de `2026-10-06_claudio_bloomie-toma-vida`, con voz, labios sincronizados y subtítulos. Demostración de calidad 3D + actuación.
- **Chiste:** "I waited for my date for hours… and I got stood up!" (pausa: intenta irse y no puede, los pies no se mueven) "And I can't even leave… I'm planted!" (dejado plantado + literalmente plantado).
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** 3D (Blender Eevee, mismo modelo, luces y escala que toma-vida; cara del kit como textura con lip sync)
- **Luz de la escena:** sin material real. Igual que toma-vida: reflector ámbar desde arriba a la izquierda (125°, altura 45°) + contraluz celeste desde atrás a la derecha; ya encendido desde el primer cuadro.
- **Duración:** 8,5 s (255 cuadros)
- **Tono / estilo:** comedia tierna con timing de stand-up; en inglés; público familiar.
- **Textos obligatorios:** subtítulos de las tres frases (palabra por palabra) y la firma "Bloomie" al cierre.
- **Llamado a la acción:** — (pieza de demostración)
- **Superposiciones (requisito):** las reglas del guion (orden de profundidad fijo, manos 3D siempre delante del cuerpo y nunca delante de los ojos, ojos centrados en los aros de los anteojos con margen, bocas sin tocar el aro, pies que no se mueven, subtítulos y firma debajo de la sombra). Verificación con cuadros clave (`render.mjs --solo`) y `revisar.mjs` antes del render.
- **Entrega:** `out/2026-10-06_claudio_bloomie-plantado/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-06_claudio_bloomie-plantado/` (fuera del proyecto)
  - `kit_expresiones_v2.png` (1670×941, hoja de ChatGPT a partir de `Bloomie.ai`, corregida: anteojos con la distancia entre aros igual a la de los ojos): 8 caras (normal, parpadeo, mirando a un costado, triste, asombro, esfuerzo, resignado, alegría), 8 bocas de habla (cerrada, M, entreabierta, E, A, U, F, L), anteojos, pétalo naranja, pétalo turquesa, destello. Fondo negro sólido (no transparente).
  - `kit_expresiones_v1.png`: primera versión (anteojos más anchos que los ojos), no se usa.
- **Proxies y material de trabajo:** `public/trabajos/2026-10-06_claudio_bloomie-plantado/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/bloomie/`; modelo 3D `C:/Videos/personajes/bloomie/bloomie_3d.blend` (corregido el 2026-10-06 en toma-vida)
- **Reutiliza de `2026-10-06_claudio_bloomie-toma-vida`:** `BloomieTomaVida.tsx` (escenario, reflejo, sombra, partículas, firma), `armar_escena.mjs`, `caras.py`, `recortar_kit.py`, `preparar_audio.mjs`.

## Guiones
- `guion_bloomie-plantado.md` (generar con `/guion 2026-10-06_claudio_bloomie-plantado`; aplicar cambios con `/aplicar-guion 2026-10-06_claudio_bloomie-plantado`)

## Decisiones
- **Plantilla:** la de toma-vida (`src/trabajos/2026-10-06_claudio_bloomie-toma-vida/BloomieTomaVida.tsx`) con subtítulos palabra por palabra (prop nueva `subtitulos`; la palabra que se dice en naranja, "planted!" destacada con tamaño real en el renglón), sin el encendido del reflector.
- **Kit** (`recortar_kit.py`): subido x4 con Real-ESRGAN; el fondo negro se separa por brillo (negro = transparente, la tinta #160807 = opaca, borde semitransparente con el color de la tinta). Centros de ojos y de aros en `datos/kit.json`; hoja de control `out/<ID>/revision/kit_recortes.png`.
- **Cara 3D** (`caras.py`): ojos de una cara + boca propia o, mientras habla, la boca del kit para la forma de Rhubarb (A→M, B→entreabierta, C→E, D→A, E/F→U, G→F, H→L, X→cerrada). Ancla de cada ojo en el blanco (centro en x, borde de abajo en y; las caras sin blanco en la mancha). **No superposición:** en este kit los ojos son más grandes que el hueco de los aros → cada ojo se achica sobre su propio centro (66 % en general, 56 % "triste") hasta dejar 8 px libres; todas las bocas a una misma escala (77 % de la hoja), con el labio de arriba 10 px por debajo del aro y la más alta dentro de la cabeza. Ojos y anteojos 14 pt más arriba que los del rig para dar lugar a la boca.
- **Voz:** Piper `en_US-hfc_female-medium --nene` (`scripts/voz.mjs`) en tres audios (A 1,86 s, B 1,39 s, C 1,94 s); Whisper da los tiempos por palabra (subtítulos) y Rhubarb las bocas. Piper no hace la pausa después de "hours…": por eso la frase va partida.
- **Actuación** (`armar_escena.mjs`, 26 poses clave): espera con golpeteo del pie y miradas de ¾, brazos cruzados (manos delante del pecho, z +46/+40 pt, por debajo de la cara), suspiro, hombros caídos con cabeceo, dos tirones con squash & stretch (cuerpo inclinado 12° y 18°, estirón 1,12 y 1,16; los pies y la raíz no se mueven), mirada a los pies, hombros encogidos (manos a ±85°, z +22), mini rebote final.
- **Audio** (`preparar_audio.mjs`, sin música): voces + Mixkit 1070 "Big old clock ticking" (sha256 `03da1e576efa`), 471 "Sad game over trombone" (`304676ea4cc8`), 1009 "Rubber squeaking" (`1f02542f26a5`), 2894 "Boing hit sound" (`9d0611005031`), 578 "Joke drums" (`13737226f757`), 3062 "Magic wand sparkle" (`6b7938d7c408`); Mixkit Free License. Efectos 5–7 dB por debajo de la voz (medido con ebur128 momentáneo). Mezcla en dos pasadas: -14,0 LUFS, pico -2,8 dBFS.
- **Otras:** escena 3 y tirón reajustados a los tiempos reales de la voz B (más larga que la prueba): escena 3 2,8–4,07 s, tirón 4,07–5,3 s; la duración total sigue en 8,5 s.

## Entregas
| Archivo (`out/2026-10-06_claudio_bloomie-plantado/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-06_claudio_bloomie-plantado/` desde `C:/Videos/archivo/2026-10-06_claudio_bloomie-plantado/` (si el trabajo está cerrado).
2. `node scripts/subir_resolucion.mjs C:/Videos/crudos/<ID>/kit_expresiones_v2.png public/trabajos/<ID>/img/kit_x4.png --x 4 --anime` · `python src/trabajos/<ID>/recortar_kit.py`
3. Voces (si se rehacen): `node scripts/voz.mjs "<frase>" public/trabajos/<ID>/audio/voz_a.wav --voz en_US-hfc_female-medium --nene` (idem `voz_b`, `voz_c`; ver frases en el guion) y mover `voz_*.json` y `voz_*_rhubarb.json` a `datos/`.
4. `node src/trabajos/<ID>/armar_escena.mjs` · `python src/trabajos/<ID>/caras.py` · `node src/trabajos/<ID>/preparar_audio.mjs`
5. Cuadros clave: `node scripts/blender/render.mjs <ID> plantado public/trabajos/<ID>/datos/animacion.json 255 --cara-png public/trabajos/<ID>/img/cara --extra public/trabajos/<ID>/datos/escena_extra.json --muestras 32 --solo 12,40,70,100,126,147,160,205,222 --png out/<ID>/revision/blender`
6. El mismo comando sin `--solo` → capa en `cache3d/` (~20 min) · `node scripts/revisar.mjs claudio-bloomie-plantado-9x16 <ID>`
7. `npx remotion render src/index.ts claudio-bloomie-plantado-9x16 out/<ID>/final/bloomie-plantado_9x16_v<N>.mp4 --crf=18`
