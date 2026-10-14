# 2026-10-06_claudio_cantando-como-robot

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (sin kit de marca: pieza personal, como los otros trabajos de claudio) |
| Pieza | cantando como robot |
| Estado | 🟡 En curso |
| Abierto | 2026-10-06 |
| Cerrado | — |

## Brief
- **Objetivo:** reemplazar al músico que canta con la guitarra por un robot, **sin cambiar el audio** (va el sonido original del crudo, sin procesar).
- **Formato(s):** 9:16 1080×1920 · 30 fps (igual que el crudo)
- **Modo de animación:** 3D (robot armado por código en Three.js / `@remotion/three`, metálico con reflejos). Render con `--gl=angle`.
- **Cómo se reemplaza:** el robot va **encima** del video original y lo tapa (la suite no puede borrar a la persona y rellenar el fondo). Copia el movimiento cuadro a cuadro desde el esqueleto de la persona. Tiene que ser del tamaño de la persona o un poco más grande, para que no asomen bordes (gorra, codos, guitarra). Decidido por el usuario el 2026-10-06.
- **Luz de la escena:** exterior de día, en un parque. Sol alto desde atrás y a la izquierda del cuadro (contraluz suave: las palmeras del fondo brillan). El músico está en sombra parcial y la luz es dispareja. Las sombras caen hacia adelante y a la derecha. Medido en `out/2026-10-06_claudio_cantando-como-robot/revision/luz_recorte.png` (cuadro de los 6 s).
- **Atención en la escena:** el pie de micrófono está **delante** del músico (resuelto: el micro real va encima del robot). Hay un teclado a la derecha y personas que cruzan por detrás. Cerca del cuadro 358 un nene cruza por delante.
- **Duración:** 19,4 s (el crudo completo, 579 cuadros).
- **Tono / estilo:** armadura estilo Tony Stark: roja y dorada, metálica, con máscara dorada, ojos y reactor en el pecho que brillan, y una boca que se ilumina al cantar. Es un diseño propio "inspirado en", no una copia del traje de Marvel.
- **Textos obligatorios:** ninguno
- **Llamado a la acción:** ninguno
- **Entrega:** `out/2026-10-06_claudio_cantando-como-robot/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-06_claudio_cantando-como-robot/` (fuera del proyecto), copiado desde `C:/Users/CLAUDIO/Downloads/Cantando/`
  - `20220424_144522.mp4`: 19,37 s · 1080×1920 · 30 fps · h264 + AAC 44,1 kHz estéreo (18,5 MB)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-06_claudio_cantando-como-robot/` (crudos/, audio/, img/, datos/)
  - `crudos/20220424_144522.mp4`: 1080×1920 · 30 fps · h264_qsv `-global_quality 23 -g 30` · AAC 48 kHz
  - `datos/esqueleto.json`: `python scripts/rig/esqueleto.py crudos/20220424_144522.mp4 datos/esqueleto.json` (~55 s)
  - `datos/seguimiento_micro.json`: `python scripts/seguimiento.py crudos/20220424_144522.mp4 datos/seguimiento_micro.json --punto 480,466` (~18 s)
- **Marca:** no tiene (`claudio`)

## Guiones
- `guion_cantando-como-robot.md` (generar con `/guion 2026-10-06_claudio_cantando-como-robot`; aplicar cambios con `/aplicar-guion 2026-10-06_claudio_cantando-como-robot`)

## Decisiones
- **Plantilla:** ninguna de las existentes servía (el rig 2D y `Bloomie3D` tienen proporciones de dibujo animado y no tapan a una persona real). Se armaron:
  - **`src/personajes/robot/Robot3D.tsx`**: robot 3D por código que se construye directamente sobre los 33 puntos de MediaPipe de la persona, en px del cuadro. Cada segmento va de un punto al otro, así que tapa a la persona aunque la cámara se mueva. Los grosores son una fracción del ancho de hombros (S). La guitarra 3D va entre las dos manos, con el mástil levantado 0,27 rad y unas 3 S de largo, como la real; las manos siempre quedan delante de la guitarra. Los reflejos del metal salen de un `RoomEnvironment` hecho por código (sin HDR). La cámara del `ThreeCanvas` necesita `rotation: [0,0,0]`: si no, react-three-fiber hace `lookAt(0,0,0)` y la escena se corre medio cuadro.
  - **`scripts/rig/esqueleto.py`**: esqueleto cuadro a cuadro (pose, más cabeza: yaw, pitch, roll y jawOpen). Sigue a la persona más grande y descarta los cuadros atípicos con una mediana móvil de ±30 cuadros (ancho de hombros ±12 %, corrimiento del tronco > 0,2 S). Así no salta a quien cruza cerca: se descartaron 11 cuadros (en 189–199, 263–272 y 402–412) y se rellenaron interpolando. Cuerpo en 556 de 579 cuadros, cara en 534.
  - **`RobotCantando.tsx`**: tres capas. Abajo el video original con su audio; en el medio el robot (`EscenaRobot3D`, o la capa en caché); arriba el **micrófono real**, recortado del mismo video con `clip-path`: la cabeza, la pinza, el caño y la abrazadera, medidos en `revision/micro_grilla.png`. Va anclado con `datos/seguimiento_micro.json` (movimiento de la cámara; ojo, `rot` viene en grados).
- **Borrar al músico (v2, "nivel 1"):** `scripts/limpiar_persona.py` arma una máscara por cuadro: lo seguro del esqueleto, más la segmentación de personas de MediaPipe solo cerca del esqueleto (los que cruzan por detrás no se borran), más la guitarra entre las manos. Hace un fondo limpio una sola vez, sobre el cuadro 0 con LaMa a media resolución, y lo mueve con la cámara (`seguimiento_micro.json`), pegándolo solo dentro de la máscara. Fuera de la máscara todo es el video original, así que las plantas se siguen moviendo; dentro, el relleno queda quieto, pero casi todo lo tapa el robot. Tarda ~6 min en la i3. Hoja: `revision/control_limpieza.png`. 
- **Nivel 1,5 (v3):** `--nivel 1.5`. Mismo fondo fijo, deformado en cada cuadro con el flujo óptico (DIS) del fondo real en un anillo de 140 px alrededor de la máscara, extendido hacia adentro (convolución normalizada, sigma 18 px). ~13 min en la i3. Hoja: `revision/control_limpieza15.png`.
- **Nivel 2 (ProPainter), probado y descartado en la i3:** quedó instalado en `C:/Videos/_herramientas/propainter` (con `torchvision 0.15.2+cpu`, `av`, `einops`, `imageio` y `tqdm` en el `.venv`) y en el script como `--nivel 2`. La prueba de 40 cuadros (recorte 544×760) seguía sin terminar a los 20 min, así que el video completo llevaría horas. Licencia no comercial. Si se retoma, probar en la Ryzen.
- **Composiciones:** `claudio-cantando-robot-borrador` (todo junto, con WebGL) y `claudio-cantando-robot-capa` (solo el robot con alfa, para `node scripts/capa3d.mjs claudio-cantando-robot-capa 2026-10-06_claudio_cantando-como-robot`).
- **Revisión:** `revision/revisar_claudio-cantando-robot-borrador.png` (`node scripts/revisar.mjs claudio-cantando-robot-borrador <ID> --gl angle`). El borrador mudo con WebGL tarda ~6 min en la i3.
- **Música:** ninguna. Va el audio original del crudo.
- **Pendiente conocido:** cerca del cuadro 358 el nene que cruza por delante puede quedar un poco tapado por las piernas del robot.

## Entregas
| Archivo (`out/2026-10-06_claudio_cantando-como-robot/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `cantando-como-robot_9x16_v1.mp4` | 2026-10-06 | Primera entrega. 19,35 s · 579 cuadros · 1080×1920 · 30 fps · crf 18 · 55,9 MB. Capa del robot desde la caché (`cache3d/claudio-cantando-robot-capa_9c18f091e8a0.webm`). Audio original **sin normalizar**, por pedido de no cambiar el audio: -15,1 LUFS integrado, igual que el crudo (la regla de -14 LUFS queda sin aplicar a propósito). |
| `cantando-como-robot_9x16_v2.mp4` | 2026-10-06 | **Sin el músico ni la guitarra real:** la base es `crudos/20220424_144522_limpio.mp4` (`scripts/limpiar_persona.py`, fondo rellenado con LaMa). Franja del micrófono más angosta (caño ±6 px, pinza ±8 px). Capa `cache3d/claudio-cantando-robot-capa_e59978a625dc.webm`. 579 cuadros · 51,1 MB · audio original, -15,1 LUFS. (Para rehacerla: prop `limpio: 1`.) |
| `cantando-como-robot_9x16_v3.mp4` | 2026-10-06 | **Limpieza nivel 1,5:** base `crudos/20220424_144522_limpio15.mp4`. Las plantas rellenadas se mecen con el movimiento de las vecinas (flujo óptico DIS). En la franja visible junto al robot el relleno se mueve un 28 % más que en v2 (3,34 contra 2,61 de cambio medio por cuadro; las hojas reales, 5,16). Capa `cache3d/claudio-cantando-robot-capa_169cb9f9a591.webm`. 579 cuadros · 51,7 MB · -15,1 LUFS. |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-06_claudio_cantando-como-robot/` desde `C:/Videos/archivo/2026-10-06_claudio_cantando-como-robot/` (si el trabajo está cerrado).
2. Regenerar `datos/` con los dos comandos de Materiales (si faltan) y el video limpio: `python scripts/limpiar_persona.py C:/Videos/crudos/<ID>/20220424_144522.mp4 public/trabajos/<ID>/datos/esqueleto.json public/trabajos/<ID>/datos/seguimiento_micro.json public/trabajos/<ID>/crudos/20220424_144522_limpio.mp4 --guitarra derecha --control out/<ID>/revision/control_limpieza.png`
3. Capa 3D: `node scripts/capa3d.mjs claudio-cantando-robot-capa 2026-10-06_claudio_cantando-como-robot`, y la final la monta con `capa`.
4. `npx remotion render src/index.ts <id-composición> out/2026-10-06_claudio_cantando-como-robot/final/<salida>_vN.mp4 --crf=18 --gl=angle`
