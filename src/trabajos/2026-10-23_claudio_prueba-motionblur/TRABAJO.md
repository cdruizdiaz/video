# 2026-10-23_claudio_prueba-motionblur

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (prueba interna de la suite, sin kit de marca) |
| Pieza | prueba-motionblur |
| Estado | 🟡 En curso |
| Abierto | 2026-10-23 |
| Cerrado | — |

## Brief
- **Objetivo:** probar el desenfoque de movimiento (motion blur) que se suma a la suite (plan `motion-blur.txt` en la raíz del repo) y armar una muestra comparativa para Lucía.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** plano (2D, rig vectorial de Bloomie)
- **Luz de la escena:** — (sin material real)
- **Duración:** corta (~3–4 s por variante)
- **Tono / estilo:** Bloomie (rig) salta y cruza la pantalla en ~1 s, más un título que entra de golpe.
- **Variantes:** `-sin` (sin blur), `-camara` (`CameraMotionBlur`), `-estela` (`Trail`), y la comparativa con las tres lado a lado.
- **Textos obligatorios:** — (título de prueba)
- **Llamado a la acción:** —
- **Entrega:** `out/2026-10-23_claudio_prueba-motionblur/final/comparativa_9x16_v1.mp4`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-23_claudio_prueba-motionblur/` (vacía: sin crudos)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-23_claudio_prueba-motionblur/` (crudos/, audio/, img/, datos/)
- **Marca:** — (prueba interna)

## Guiones
- No lleva guion (prueba técnica).

## Decisiones
- **Plantilla:** `PersonajeRig` (prop `desenfoque`) + título con `DesenfoqueMovimiento`.
- **Música:** —
- **Otras:**
  - ID con la fecha del día en que se abrió (2026-10-23); el plan, escrito el 2026-10-20, proponía `2026-10-20_…`.
  - El plan pedía hacerlo en la Ryzen; se hizo en la notebook i3 (Intel UHD). Los tiempos medidos son de la i3.
  - `@remotion/motion-blur` ya estaba instalado en 4.0.529 (= remotion; vino con el merge de la otra PC): no se reinstaló. `verificar-suite` controla que coincidan.
  - **Modo "cámara" propio, no `<CameraMotionBlur>`:** se probó el del paquete y tiene dos problemas: (1) suma N copias con opacidad 1/N y cada una se redondea a 8 bits igual → el color queda posterizado en múltiplos de ~N niveles (bandas muy visibles en los degradés de Bloomie 3D, `revision/bandas_3d.png`); (2) toma las muestras entre f+0,5 y f+1 (adelanta ~¾ de cuadro: el objeto salta al entrar/salir del tramo con blur). `instantesMuestras` (tramosDesenfoque.ts): mismo método (Freeze + plus-lighter) con pesos levemente distintos que suman 1 (rompen el redondeo sistemático), muestras dentro del tramo activo (nunca cruzan un corte) y obturador que **abre en el cuadro** (f … f+½). Primero se centró en f, pero las muestras de f−¼ caían en el cuadro anterior y fundían los cambios discretos (en la prueba de poses Sofi quedó con dos poses superpuestas en el cuadro 110): abriendo en f, lo discreto (pose entera, boca, parpadeo, vista) queda siempre en su cuadro. La estela sí es `<Trail>` del paquete.
  - El blur congela a los hijos en sub-cuadros (`<Freeze>`): solo mueve lo que calcula su cuadro adentro. Por eso `PersonajeRig` dibuja en un `Cuadro` interno, `PersonajePosesAnimado` recibe el estado como función del cuadro, `Reveal`/`Aparece` tienen una pieza interna que se mueve y hay `<PorCuadro dibujar>` para piezas propias.
  - `poseEn` evalúa la pose con decimales cuando `pasos` es 1 (antes redondeaba hacia abajo: el salto no se barría, solo el trayecto).
  - Carteles: en `ExplicacionGeometrica` los subtítulos solo hacían fundido (el blur no tiene qué barrer); con `desenfoqueEntrada` además suben 36 px al entrar. `HistoriaMarca` usa la capa "bloque" (dentro del flujo del texto, grilla apilada) porque sus textos no son AbsoluteFill.
  - 3D: cada muestra es otro lienzo WebGL; con `--gl=angle` 10 lienzos andan bien en la i3 (Muestra3D, Logo3D armado).
  - Blender: `--motion-blur [grados]` → motion blur de Eevee (obturador centrado, 2 pasos) con claves lineales en huesos y cámara; lo que se prende y apaga queda constante. `render.py` ahora también lee las curvas de las acciones por capas de Blender 4.4+ (antes, en 5.2, el paso a CONSTANT no encontraba las curvas): cambia la huella y las capas en caché se regeneran una vez.
  - Escena de prueba: el primer intento usaba `trayecto` con `arco` y la sombra subía con el personaje; quedó `saltar` (altura 300) + `trayecto` recto, y el aterrizaje se corrió a x 840 (con 890 se cortaban los pétalos contra el borde).
  - `ExplicacionGeometrica` con poses se probó con los personajes y tiempos de Pitágoras en `claudio-prueba-motionblur-poses` (la composición de Pitágoras no recibe props).

## Revisión
- `revision/hoja_comparativa.png`: filas sin / cámara / estela, columnas cuadros 28 (salto), 52 (entra el título), 94 (se va).
- `revision/revisar_claudio-prueba-motionblur-*.png` (revisar.mjs), `revision/estela_alfa_bordes.png` (alfa de la estela sobre oscuro y claro: bordes limpios), `revision/bandas_3d.png` (3D sin blur vs con blur, ya sin bandas), `revision/hoja_3d.png`, `revision/blender_comparar.png` (Eevee sin / con `--motion-blur`, cuadros 62-70-80), `revision/plantillas_entrada.png` (HistoriaMarca y MontajeMusical con `desenfoqueEntrada`).

## Tiempos (i3, `scripts/medir_render.mjs`, por cuadro dentro del tramo con blur)
| Variante | 2D rig 1080×1920 | 3D `--gl=angle` 1080×1080 |
|---|---|---|
| sin blur | 0,20 s | 0,18 s |
| cámara, borrador (5 muestras) | 0,25 s | 0,21 s |
| cámara, final (10 muestras) | 0,49 s | 0,30 s |
| estela | 0,22 s | — |
| Logo3D armado, final | — | 0,28 s (1080×1920) |

Blender `--motion-blur`: sin costo apreciable (73 s vs 74 s para 3 cuadros con arranque). Fuera de los tramos el blur no cuesta nada.

## Entregas
| Archivo (`out/2026-10-23_claudio_prueba-motionblur/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `comparativa_9x16_v1.mp4` | 2026-10-23 | Primera comparativa (sin / cámara / estela, 105 cuadros, -13,8 LUFS, sin glitches). Muestreo centrado: reemplazada por la v2 |
| `comparativa_9x16_v2.mp4` | 2026-10-23 | **Muestra para Lucía.** Obturador que abre en el cuadro (sin fantasmas en cambios discretos). -13,8 LUFS (ebur128), pico -2,1 dBFS, 105 cuadros, `detectar_glitches` sin avisos |
| `estela-alfa_9x16_v1.mov` | 2026-10-23 | Revisión de bordes de la estela con alfa (solo el salto) (claudio-prueba-motionblur-estela-alfa, 1080×1920, 50 cuadros a 30 fps) |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-23_claudio_prueba-motionblur/` desde `C:/Videos/archivo/2026-10-23_claudio_prueba-motionblur/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/2026-10-23_claudio_prueba-motionblur/` (si los hay).
3. `npx remotion render src/index.ts <id-composición> <tmp>.mp4 --crf=18` y `bash scripts/terminar_audio.sh <tmp>.mp4 out/2026-10-23_claudio_prueba-motionblur/final/<salida>_vN.mp4`
