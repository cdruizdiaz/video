# 2026-10-06_claudio_bloomie-toma-vida

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (demo) · personaje Bloomie (`src/marcas/bloomie`) |
| Pieza | bloomie-toma-vida (Bloomie despierta, se descubre 3D, salta y saluda) |
| Estado | 🟡 En curso |
| Abierto | 2026-10-06 |
| Cerrado | — |

## Brief
- **Objetivo:** animación 3D simple pero de buena calidad para demostrar el potencial de la suite (luz real sobre el volumen, órbita de cámara, squash & stretch, profundidad de campo).
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** 3D (Blender Eevee, modelo de Bloomie desde el rig: `/personaje-3d`; cara del kit como textura)
- **Luz de la escena:** sin material real. Reflector cálido (ámbar) desde arriba a la izquierda (125°, altura 55°) + luz de recorte detrás a la derecha.
- **Duración:** 5 s (150 cuadros)
- **Tono / estilo:** mágico y tierno; escenario negro con reflector; paleta exacta de Bloomie; tipografía Fredoka.
- **Textos obligatorios:** ninguno (solo la firma “Bloomie” al cierre).
- **Llamado a la acción:** — (pieza de demostración)
- **Superposiciones (requisito):** nada de superposiciones antinaturales: orden de profundidad fijo (fondo → partículas de atrás → pétalos de la nuca → cuerpo → cabeza/cara → brazos y manos → partículas de adelante); manos y todo lo que toquen como geometría 3D real, nunca "tarjetas" planas (en bloomie-rock la guitarra plana tapaba la mano que rasgueaba); revisión con `revisar.mjs` en los cuadros de contacto antes del render. Detalle en el guion.
- **Entrega:** `out/2026-10-06_claudio_bloomie-toma-vida/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-06_claudio_bloomie-toma-vida/` (fuera del proyecto)
  - `kit_bloomie_3d.png` (1536×1024, con transparencia; copia de `Downloads/bloomie/Hoja de personaje y expresiones Bloomie.png`): caras dormido / despertando / parpadeo / asombro / alegría, 4 bocas sueltas, vistas espalda / perfil derecho / frente, pétalo naranja, pétalo turquesa y destello. No trajo la paleta en texto: se usa `PALETA_BLOOMIE` del kit de marca.
- **Proxies y material de trabajo:** `public/trabajos/2026-10-06_claudio_bloomie-toma-vida/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/bloomie/` (`Bloomie.ai`, `logo.png`); modelo 3D en `public/personajes/bloomie/bloomie.glb`

## Guiones
- `guion_bloomie-toma-vida.md` (generar con `/guion 2026-10-06_claudio_bloomie-toma-vida`; aplicar cambios con `/aplicar-guion 2026-10-06_claudio_bloomie-toma-vida`)

## Decisiones
- **Plantilla:** propia, `BloomieTomaVida.tsx` (como `BloomieRock.tsx`): escenario, haz del reflector con polvo, piso con charco de luz, reflejo de la capa 3D, sombra de contacto, partículas en dos planos, profundidad de campo (desenfoque del fondo), acercamiento y paralaje de "cámara", firma “Bloomie” en Fredoka.
- **Kit:** subido x4 con Real-ESRGAN (`--anime`) y recortado con `recortar_kit.py` (cajas fijas en la hoja + manchas; hoja de control `out/<ID>/revision/kit_recortes.png`). Los anteojos y la cara "normal" salen de la vista de frente. Las vistas de espalda y perfil no se usan: la órbita va de ¾ a frente (±30°).
- **Cara 3D** (`caras.py`): cada cara se escala por la distancia entre ojos y se centra en los ojos del rig; los anteojos van encima, alineados igual. **Regla de no superposición:** la boca se separa y va a la altura de la boca de la cara normal y, si toca el aro, baja hasta dejar 10 px libres (en la hoja de caras las bocas están más cerca de los ojos y se encimaban con el aro).
- **Modelo 3D de Bloomie** (`scripts/blender/personaje_desde_rig.py`, compartido): la corona se veía como una tabla con rayas y con un hueco entre el pétalo de arriba y la cabeza. Ahora: inclinación de la corona 0,42 → 0,22 rad y pétalos con remesh por vóxeles + suavizado (superficie pareja, "acolchada"). Respaldo del modelo anterior: `C:/Videos/personajes/bloomie/bloomie_3d_antes-2026-10-06.blend`.
- **Render en Blender** (`scripts/blender/render.py`, nuevo y compatible con lo anterior): luces por cuadro (el reflector se enciende con parpadeo y baja al final), color de luz, contraluz desde atrás, `luzSigueGiro` (las luces giran con el personaje: se ve como una órbita de cámara), `huesosExtra` (manos hacia la cámara y cabeceo de la cabeza, que el rig 2D no tiene), sombras finas y suaves (`shadow_maximum_resolution`, jitter) y `--solo` en `render.mjs` para renderizar solo cuadros clave. 32 muestras (con 16 se veía grano).
- **Superposiciones (verificadas en cuadros clave):** manos SIEMPRE delante del cuerpo (z +46 pt al mirarse las manos, +22 al saludar, +10 al estirarse) y por debajo de la cara (al mirarlas se bajaron de -24 a -6 pt porque rozaban el borde de la cara); partículas de adelante corridas fuera del óvalo de la cara y apagadas antes de la zona de la firma; la firma va debajo de la sombra (y 1500; los pies en 1330).
- **Audio** (`preparar_audio.mjs`, sin música): Mixkit 2579 "Light switch sound" (sha256 `a24aae3ccf08`), 2986 "Magic festive melody" (`490ec437ca00`), 1492 "Cinematic whoosh fast transition" (`02b8cd40b376`), 731 "Cartoon bubble pop" (`7e540b926df4`), 2894 "Boing hit sound" (`9d0611005031`), 3062 "Magic wand sparkle" (`6b7938d7c408`); licencia Mixkit Free License. Mezcla en dos pasadas: -14,0 LUFS, pico -2,4 dBFS (loudnorm de una pasada daba -11,6 en un clip de 5 s).
- **Otras:** el logo de `public/marcas/bloomie/logo.png` es el personaje: al cierre va la firma en texto. Bloomie duerme de pie (el rig no se sienta).

## Entregas
| Archivo (`out/2026-10-06_claudio_bloomie-toma-vida/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `bloomie-toma-vida_9x16_v1.mp4` | 2026-10-06 | Primera versión (5,06 s, 150 cuadros, 1080×1920, h264 crf 18, 2,0 MB; -14,0 LUFS, pico -2,4 dBFS, LRA 4,1). Capa de Blender `toma-vida_83b7100c860b` (32 muestras, 4,6 s/cuadro, 11 min); render de Remotion 2 min. |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-06_claudio_bloomie-toma-vida/` desde `C:/Videos/archivo/2026-10-06_claudio_bloomie-toma-vida/` (si el trabajo está cerrado).
2. `node scripts/subir_resolucion.mjs C:/Videos/crudos/<ID>/kit_bloomie_3d.png public/trabajos/<ID>/img/kit_x4.png --x 4 --anime` (~2 min) · `python src/trabajos/<ID>/recortar_kit.py`
3. `node src/trabajos/<ID>/armar_escena.mjs` · `python src/trabajos/<ID>/caras.py` · `node src/trabajos/<ID>/preparar_audio.mjs`
4. Revisar cuadros clave: `node scripts/blender/render.mjs <ID> toma-vida public/trabajos/<ID>/datos/animacion.json 150 --cara-png public/trabajos/<ID>/img/cara --extra public/trabajos/<ID>/datos/escena_extra.json --muestras 32 --solo 0,20,48,56,66,78,92,100,126,140`
5. El mismo comando sin `--solo` → capa en `cache3d/` (se reusa mientras no cambie la huella)
6. `npx remotion render src/index.ts claudio-bloomie-toma-vida-9x16 out/<ID>/final/bloomie-toma-vida_9x16_v<N>.mp4 --crf=18`
