# 2026-10-02_rastro_bloomie-creators

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) · personaje Bloomie (biblioteca `personajes/bloomie`) |
| Pieza | bloomie-creators (Bloomie presenta a las creadoras de RASTRO sobre un video real) |
| Estado | 🟢 Cerrado como prueba de concepto (sin versión final) |
| Abierto | 2026-10-02 |
| Cerrado | 2026-10-02 |

## Brief
- **Objetivo:** sumar a Bloomie, animado con el rig de personajes, encima de un video real filmado por el equipo de RASTRO. Bloomie entra caminando, saluda ("Hi, I'm Bloomie."), mira a las creadoras con admiración y pide que las contraten ("These are my creators. They work really hard. HIRE THEM PLEEEEEASEEEE!"); termina con una carcajada exagerada.
- **Formato(s):** 9:16 1080×1920 · 30 fps · **10 s como máximo**
- **Reglas:** NO modificar el video (fondo, personas, cámara, objetos; sin corrección de color ni retoque). Bloomie se agrega encima con sus piezas vectoriales (.ai + rig); lo que falte (bocas, mano para saludar, súplica…) se genera con sus colores y se muestra antes de usarlo. Visible pero sin tapar a las creadoras ni la cámara del trípode. Animación fluida tipo motion graphics (anticipación, follow-through, easing, rebotes sutiles). Sombra de contacto suave en el piso (en la capa de Bloomie). Seguimiento de un punto del piso si la cámara se mueve.
- **Ubicación:** abajo a la derecha, zona aprox. x 390–1050, y 770–1830 (captura de referencia `C:/Videos/crudos/<ID>/referencia_zona.jpeg`: las marcas verdes NO van en el resultado).
- **Guion:** ver `guion_bloomie-creators.md` (6 momentos; tiempos orientativos, se ajustan al audio real; si pasa de 10 s se acortan la caminata y las pausas, no las frases).
- **Voz:** inglés británico, voz de nene: Piper en_GB con el tono subido. "PLEEEEEASEEEE" estirado y suplicante; carcajada exagerada (si Piper no logra una risa creíble, alternativa de Mixkit con licencia, a decidir).
- **Globos:** de historieta, contorno grueso, colita a la boca que la sigue; palabras de a una con Whisper + `@remotion/captions`; un globo por bloque ("Hi, I'm Bloomie." / "These are my creators." / "They work really hard." / "HIRE THEM PLEEEEEASEEEE!"), con pop; el último más grande, en mayúsculas, con temblor y letras estiradas que se van sumando. Fredoka. Sin tapar caras, la estructura ni la cámara.
- **Audio:** se mantiene el audio original del video, más bajo mientras habla Bloomie; mezcla final -14 LUFS.
- **Entrega:** `out/2026-10-02_rastro_bloomie-creators/final/`: MP4 1080×1920 (≤ 10 s) + ProRes 4444 con transparencia (Bloomie, sombra y globos, mismos tiempos).
- **Proceso pedido:** analizar el video y confirmar zona y escala; preguntar; hoja de contacto con 5 cuadros clave (entrada caminando, saludo con globo, mirada a las creadoras, "PLEEEASE" y carcajada) y esperar aprobación antes de renderizar.
- **Definido (2026-10-02):** tramo 61–71 s (tres creadoras), Bloomie mediano (~720 px), risa Mixkit 739, sticker "HA HA HA!", voz jenny_dioco.

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-02_rastro_bloomie-creators/` (fuera del proyecto)
  - `IMG_6838.MOV` (148 MB): iPhone, HEVC 1920×1080 rotado -90° → vertical 1080×1920, 98,2 s, 60 fps con frecuencia levemente variable (prom. 59,97), **SDR bt709 (no HDR)**, audio AAC estéreo 48 kHz (+ pista espacial APAC, no se usa).
  - `referencia_zona.jpeg`: captura de WhatsApp con la zona de Bloomie marcada en verde (solo referencia).
- **Análisis (2026-10-02):** cámara fija salvo un paneo de ~154 px en el primer segundo y un sacudón fuerte entre 50 y 60 s → con un tramo desde 1 s no hace falta seguimiento. Personas: 0–8 s una creadora (remera blanca); desde ~8 s dos (más campera bordó); desde ~35 s una tercera sentada con laptop. Abajo a la derecha hay una planta en primer plano (Bloomie queda delante). Hojas: `out/<ID>/revision/hoja_video_cada5s.png`, `zona_y_tamanos.png`.
- **Proxy:** `public/trabajos/2026-10-02_rastro_bloomie-creators/crudos/IMG_6838_proxy.mp4` (1080×1920, 30 fps constantes, h264_qsv, AAC 48 kHz, 98,2 s).
- **Marca:** `public/marcas/rastro/` · personaje `public/personajes/bloomie/`

## Guiones
- `guion_bloomie-creators.md` (guion de RASTRO). Aplicar cambios con `/aplicar-guion 2026-10-02_rastro_bloomie-creators`.

## Decisiones
- **Composición:** `BloomieCreators.tsx` (composiciones `rastro-bloomie-creators-10s` y `-alfa`): tramo 61–71 s del original (`crudos/tramo_61-71.mov`: libx264 crf 14, solo rotación y 30 fps, sin tocar el color) + Bloomie con el rig (`poseEn`) + sombra de contacto (elipse con desenfoque, se achica si se despega del piso) + globos (`historieta.tsx`) + sticker. Cámara fija en el tramo: sin seguimiento.
- **Ubicación:** pies en y 1895, x final 790, alto ~720 px; entra caminando de perfil desde x -380. Globos y sticker sobre el piso, abajo a la izquierda (x ≈ 300, y ≈ 1560–1590), sin tapar caras, reflector ni cámara.
- **Tiempos (frames, desde la v2 de los borradores):** camina 0–40, gira 40–50, frases en 54, 110, 156 y 209 ("please" estirado desde 235), mira a las creadoras 90–108, carcajada 270–300.
- **Voz:** Piper `en_GB-jenny_dioco-medium` ×1,35 (`preparar_voz.sh` + `separar_frases.mjs` → `datos/frases.json`). El "please" del ruego: Piper con `--length-scale 4.5` (~1,6 s; Whisper lo entiende); escribir "pleeeease" hacía deletrear las letras y estirarlo con rubberband sonaba artificial. Vibrato leve en esa frase.
- **Rig (mejoras generales):** ojos agrandados (`ojos`, pista `ojos`) con brillos de "ojos de cachorro"; globo con `letraPorLetra` (palabras estiradas) y `temblor`; `queda` configurable. Primer plano de las caras nuevas: `revision/caras_nuevas.png`, `suplica.png`.
- **Música:** — (audio original del video, baja ≈ 7 dB mientras habla Bloomie). **Risa:** Mixkit 739 "Small cartoon character laughing" (sha256 `7559e62e952f`; licencia libre de Mixkit: uso comercial, sin atribución; original archivado en `C:/Videos/archivo/2026-10-02_rastro_bloomie-creators/biblioteca/`).
- **LUFS medidos al cerrar:** los cuatro borradores -19,5 LUFS (sin normalizar: la versión final se llevaría a -14).
- **Borrador:** `out/2026-10-02_rastro_bloomie-creators/revision/borrador_v1.mp4` (540×960, crf 26, 10 s, -19,5 LUFS sin normalizar) para mostrar al equipo.
- **Versión 2,5D (2026-10-02, prueba de concepto):** composiciones `rastro-bloomie-creators-25d` y `-25d-alfa` (`modo25d`). Los recursos que daría el diseñador se generaron por código: giro ¾ por profundidad de pieza (`yaw`: el rostro se corre y se angosta, los pétalos de atrás van al revés), volumen de luz por pieza (degradé de luz en `screen` y de sombra en `multiply`, recortados a la forma; luz de arriba a la izquierda como en el video, `angulo -140`), sombra proyectada (silueta del rig achatada e inclinada hacia atrás a la derecha, desenfocada), entrada en perspectiva (llega desde y 1790 a ×0,84 y crece hasta su lugar), globos que entran con giro en perspectiva y sticker extruido. Muestras: `revision/recursos_25d.png` (plano vs 2,5D), `cuadros_clave_25d.png`, `detalle_25d.png`, `detalle_sombra.png`. Borrador: `revision/borrador_25d_v1.mp4` (540×960). **v2 (2026-10-02):** los globos ya no se pisan: cada uno termina de irse antes de que aparezca el siguiente (`QUEDA` calculado por frase) y se separaron las frases 2–4 (mirada 90–108, frase 2 en 110, pausa de 11 cuadros antes de "Hire them"; carcajada de 1 s): `revision/borrador_25d_v2.mp4`.
- **Versión 3D (2026-10-02, borrador):** composición `rastro-bloomie-creators-3d` (`modo3d`). Se instaló `@remotion/three` 4.0.529 + `three` 0.186 + `@react-three/fiber` 9 (npm, una vez). Bloomie 3D construido por código (`src/personajes/bloomie/Bloomie3D.tsx`): cabeza y cuerpo elipsoidales con las medidas de piezas.json, pétalos extruidos desde sus contornos del .ai (bisel redondeado, inclinados hacia atrás), manos y pies redondeados, contorno de casco invertido; se mueve con los huesos del rig 2D. La cara (expresiones, ojos de cachorro, lip sync, anteojos) es la 2D del rig apoyada sobre la cabeza 3D y girando con ella. Gira de verdad: entra de perfil (rotY π/2), pasa por ¾ y queda de frente; gira el cuerpo hacia las creadoras; se balancea al reírse. Cámara ortográfica en píxeles, luz de arriba a la izquierda, sombra real sobre un plano de piso invisible (`ShadowMaterial`). Render con `--gl=angle`: ~18 s por cuadro completo, borrador a media resolución en ~8 min. Cuadros: `revision/cuadros_clave_3d.png`. Borrador: `revision/borrador_3d_v1.mp4` (540×960).

## Entregas
| Archivo (`out/2026-10-02_rastro_bloomie-creators/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| — (sin versión final: prueba de concepto) | | Los borradores de revisión quedaron archivados en `C:/Videos/archivo/2026-10-02_rastro_bloomie-creators/borradores/`: |
| `borrador_v1.mp4` | 2026-10-02 | Plano (2D), 540×960, 10 s |
| `borrador_25d_v1.mp4` | 2026-10-02 | 2,5D: volumen de luz, giros ¾, sombra proyectada, entrada en perspectiva, globos y sticker con profundidad |
| `borrador_25d_v2.mp4` | 2026-10-02 | 2,5D: los globos ya no se pisan (frases 2–4 separadas) |
| `borrador_3d_v1.mp4` | 2026-10-02 | 3D: Bloomie construido por código con Three.js, sombra real (con los tiempos de la v1) |

## Cómo rehacerlo
0. Restaurar el material: copiar `C:/Videos/archivo/2026-10-02_rastro_bloomie-creators/public/` sobre `public/trabajos/2026-10-02_rastro_bloomie-creators/` (tramo, proxy y audios; `datos/` queda en el repo). Originales en `C:/Videos/crudos/2026-10-02_rastro_bloomie-creators/`.
1. Proxy: `ffmpeg -i C:/Videos/crudos/2026-10-02_rastro_bloomie-creators/IMG_6838.MOV -map 0:v:0 -map 0:a:0 -vf "scale=1080:1920:flags=lanczos,fps=30" -c:v h264_qsv -global_quality 23 -g 30 -c:a aac -b:a 192k -ar 48000 public/trabajos/2026-10-02_rastro_bloomie-creators/crudos/IMG_6838_proxy.mp4`
2. Voz: `bash src/trabajos/2026-10-02_rastro_bloomie-creators/preparar_voz.sh`. Tramo: `ffmpeg -ss 61 -i IMG_6838.MOV -t 10 -vf "scale=1080:1920:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 14 -c:a pcm_s16le crudos/tramo_61-71.mov`.
3. Para hacer la versión final (no se hizo): render de `rastro-bloomie-creators-10s` (`--crf=18`) y `rastro-bloomie-creators-alfa` (`--codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png`), mezcla a -14 LUFS con `loudnorm` en dos pasadas y muxeo en las dos (igual que en 2026-10-02_lucia_chiste-navidad).
