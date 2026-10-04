# Proyecto Remotion — Suite de producción

## Regla principal
Todo pedido de video se resuelve primero con la suite instalada en este proyecto (Remotion, ffmpeg, whisper.cpp, DeepFilterNet, MediaPipe, Google Fonts, Mixkit), eligiendo la herramienta según la tabla "Qué herramienta usar". Remotion es el eje de la composición, pero no la única opción: cada tarea va con la herramienta que mejor la resuelve. Servicios externos (ChatCut, generación con IA, etc.) solo si la suite no puede hacerlo, y preguntando antes.

## Formatos
- Composición principal: 30 fps.
- Formatos: 1920x1080 (16:9) y 1080x1920 (9:16).

## Trabajos (cómo se organiza cada pedido)
Cada pedido es un **trabajo** con ID `AAAA-MM-DD_cliente_pieza` (minúsculas, sin tildes). El mismo ID se usa en todas las carpetas:

| Dónde | Qué va |
|---|---|
| `<carpetaCrudos>/<ID>/` (fuera del proyecto, ver `herramientas.json`) | Originales tal cual llegaron (4K, etc.). Nunca se modifican |
| `public/trabajos/<ID>/crudos/` | Proxies livianos (1080p, 30 fps constantes) hechos con ffmpeg |
| `public/trabajos/<ID>/audio/` | Música preparada para este trabajo, voz limpia, efectos elegidos |
| `public/trabajos/<ID>/img/` | Imágenes propias de este trabajo |
| `public/trabajos/<ID>/datos/` | `transcripcion.json`, `clips.json`, `encuadre.json`… (se versionan) |
| `src/trabajos/<ID>/` | `TRABAJO.md` (brief, decisiones, entregas), `guion_<pieza>.md` (guion con tiempos), `composiciones.ts`, scripts propios del trabajo |
| `out/<ID>/revision/` | Hojas de contacto, stills, borradores rápidos |
| `out/<ID>/final/` | Entregas: `<pieza>_<formato>_v<N>.mp4` (p. ej. `clip-01_9x16_v2.mp4`) |
| `out/<ID>/premiere/` | Exportación a Premiere: `<pieza>_<formato>_v<N>.xml`, capa `graficos_<huella>.mov`, `medios/` |

Compartido entre trabajos:
- `public/marcas/<cliente>/` + `src/marcas/<cliente>/marca.ts`: kit de marca (logo, fotos institucionales, colores, tipografía, curvas).
- `public/biblioteca/`: música y efectos de Mixkit ya bajados (reutilizables).
- `src/plantillas/`: plantillas reutilizables (`HistoriaMarca`, …) + `comunes/piezas.tsx`.
- `public/personajes/<nombre>/` + `src/personajes/`: biblioteca de personajes animables con rig (piezas, rig, correcciones); el `.ai` original en `carpetaPersonajes` (`C:/Videos/personajes/`). Ver `src/rig/README.md`.

Reglas:
- Comandos: **`/nuevo-trabajo <cliente> <pieza> [crudos] [brief]`** abre un trabajo; **`/cerrar-trabajo <ID>`** lo cierra y archiva. **`/estado [todos]`** lista los trabajos abiertos con su última entrega y lo que falta (`node scripts/estado.mjs`). **`/a-premiere <ID>`** exporta la última versión a Premiere. **`/rig-personaje <archivo.ai> <nombre>`** suma un personaje a la biblioteca de rigs.
- **Guion audiovisual = fuente de verdad** de cada pieza: `src/trabajos/<ID>/guion_<pieza>.md` (formato en `src/trabajos/_plantilla/GUION.md`). **`/guion <ID|descripción>`** lo genera; cuando el usuario lo edita o pega una versión nueva, **`/aplicar-guion <ID>`** aplica SOLO lo que cambió (vía `git diff` del guion) y renderiza una `_vN` nueva. Si se cambia el video por otro pedido, actualizar también el guion para que siga describiendo el video real.
- Si el pedido del usuario no nombra un trabajo, preguntar si es uno nuevo o la continuación de uno existente.
- **Nunca sobrescribir un archivo de `out/<ID>/final/`**: cada cambio es una versión nueva `_vN+1`. Anotar cada entrega en `TRABAJO.md`.
- Un trabajo parecido a otro anterior se hace reutilizando su plantilla y cambiando solo los datos (textos, imágenes, duraciones, música).
- Remotion copia TODO `public/` en cada render: mantener solo trabajos activos; al terminar, `/cerrar-trabajo` mueve el material pesado a `<carpetaArchivo>/<ID>/`.
- IDs de composición: solo letras, números y guiones (`<cliente>-<pieza>-<variante>`); se registran en `src/trabajos/index.ts`.

## Archivos
- Todo lo que usa Remotion va dentro de `public/` y se referencia con `staticFile("trabajos/<ID>/…")`, `staticFile("marcas/<cliente>/…")`, etc.
- NUNCA abrir ni leer binarios de `public/` (videos, audio, imágenes): usar solo sus nombres.
- Rutas de las herramientas externas y de las carpetas de crudos/archivo: leer `scripts/herramientas.json` (igual en todas las PC: todo cuelga de `C:/Videos/`).
- Datos propios de cada PC (códec de borradores, hilos de Whisper, rendimiento): leer `C:/Videos/_herramientas/equipo.json` (fuera del repo).

## Código
- Valores de animación como constantes al inicio de cada archivo.
- `interpolate` siempre con `extrapolateLeft/Right: 'clamp'`.
- Tests: `npm test` (vitest, `src/**/__tests__/`). Al tocar `src/rig/` o funciones puras de plantillas, sumar o ajustar sus tests; `npm run lint` (eslint + tsc) tiene que quedar limpio.

## Render
- NUNCA hacer un render completo salvo pedido explícito. Para verificar: `npx remotion still src/index.ts <comp> out/<ID>/revision/f<N>.png --frame=N`, o una secuencia a `--scale=0.25` y una hoja de contactos en `out/<ID>/revision/`.
- **Revisión automática:** `node scripts/revisar.mjs <comp> [ID] [--desde N --hasta M] [--gl angle]` renderiza un borrador mudo chico, detecta los cuadros donde algo cambia de golpe (cortes, globos, poses, disfraces) y arma `out/<ID>/revision/revisar_<comp>.png` (en rojo los cambios bruscos). Usarlo después de cada cambio visible en vez de elegir cuadros a mano. Necesita que estén los audios/crudos de la composición en `public/`.
- Render final: `npx remotion render src/index.ts <comp> out/<ID>/final/<pieza>_<formato>_v<N>.mp4 --crf=18`.
- Audio final normalizado a -14 LUFS (`loudnorm`) y verificado con `ebur128`.
- Premiere: después de cada render final, si la composición tiene `premiere` en `composiciones.ts`, correr **`/a-premiere <ID>`** (`node scripts/a-premiere.mjs <ID>`, en segundo plano). Genera el XML de esa `_vN` (cortes con los originales, reencuadre como keyframes, audio con niveles y fundidos) y la capa de gráficos con transparencia, que solo se vuelve a renderizar si cambió (huella de los datos gráficos + código de `src/plantillas/`). Plantillas con exportación: `MontajeMusical`. Para agregarla a otra: `src/plantillas/<X>/premiere.ts` con el formato de `src/plantillas/comunes/premiere.ts` y opción `soloGraficos` en la plantilla.

## Personajes animados (rig vectorial)
- Animar un personaje = **rig por piezas** (`src/rig/`, plantilla `PersonajeRig`), no sprites de IA: el personaje se arma con las piezas vectoriales de su `.ai` y se anima con pistas (respirar, parpadear, expresión, hablar, saludar, saltar, caminar, correr, girar, temblor, vaivén, trayecto) y **secuencias de poses clave en JSON** (`public/trabajos/<ID>/datos/`). Todo en `src/rig/README.md`.
- Personaje nuevo: `/rig-personaje`. Revisar con las hojas chicas de `out/personajes/<nombre>/` (nunca abrir el `.ai`); corregir con `src/personajes/<nombre>/mapa.json`; ajustar pivotes en el Studio (`personaje-<nombre>-editor-<vista>` → "Guardar en rig.json").
- Lip sync: **Rhubarb** (bocas desde el sonido) → pista `hablar` con `rhubarb`; `scripts/voz.mjs ... --datos public/trabajos/<ID>/datos` ya lo genera junto con la transcripción. Respaldo: transcripción de Whisper → `hablar` con `transcripcion` (reglas de letras es/en).
- **Mocap:** para que un personaje copie a una persona (gestos, cantar, bailar en el lugar), grabarla de frente y `python scripts/rig/mocap.py <video> <personaje> public/trabajos/<ID>/datos/mocap.json --control out/<ID>/revision/control.png` → pista `secuencia` (cuerpo, brazos, cabeza, ojos, mirada, giro 2,5D, boca y caras). Revisar con la hoja de control y `revisar.mjs`. Detalle en `src/rig/README.md` → Captura de movimiento.
- Efectos de sonido del personaje: `sonidos: true` en PersonajeRig (saltos, cambios de cara/disfraz, giros; `src/rig/sonidos.ts`).
- Exportar: `node scripts/rig/exportar.mjs <comp> <ID> <pieza_formato> [--mov] [--png] [--mp4]` (ProRes 4444 con alfa para Premiere/CapCut, secuencia PNG, o MP4 con fondo); versiona `_vN` y anota en `TRABAJO.md`.
- Revisar animaciones: `node scripts/rig/hoja_animacion.mjs <comp> <salida.png> --cada N` (hoja de contactos chica).
- **Modo de animación** (se define al abrir el trabajo, como el formato; queda en el brief de `TRABAJO.md`): **plano** (2D, por defecto), **2,5D** o **3D** (Three.js: `@remotion/three`; Bloomie 3D construido por código en `src/personajes/bloomie/Bloomie3D.tsx`; render con `--gl=angle`, lento sin GPU: solo si se pide y avisando el tiempo de render).
- **Receta 2,5D** (sin software extra; detalle en `src/rig/README.md` → 2,5D):
  1. Si hay material real, medir primero la **dirección de la luz** con un recorte chico de la escena (sombras de muebles, lado iluminado de las caras) y anotarla en el brief.
  2. Volumen: `luz` por pieza con ese ángulo (intensidad ~0,85). Giros: `yaw` hasta **±0,65** (más se nota que es plano); para mirar a alguien, `yaw` + `mirada`.
  3. Integración: sombra de contacto + sombra proyectada (silueta achatada hacia el lado contrario a la luz) y entrada en perspectiva (más chico y más arriba en el piso cuanto más lejos).
  4. Gráficos: globos con `giro3d` y stickers con `volumen`.
  5. Sobre **video real**: no se mueve la cámara ni se hace zoom (no se modifica el video): la profundidad la pone el personaje.
  6. Revisar con una hoja de cuadros clave antes del borrador; comparar con la muestra `personaje-<nombre>-muestra-25d`.
- **Globos de diálogo** (`src/plantillas/comunes/historieta.tsx`), reglas aprendidas:
  - Un globo termina de irse **antes** de que aparezca el siguiente (calcular `queda` por frase con `duracionGlobo`); si dos frases van pegadas y no da el tiempo, se separan las frases, nunca se encima un globo con otro.
  - La colita apunta a la boca sin cruzar ojos ni cara: el globo va a la altura de la boca, del lado libre.
  - Nunca tapar caras, la cámara ni lo que las personas estén armando: verificarlo en la hoja de cuadros clave (incluidos los cuadros de cambio de globo).
- Si se pide "una secuencia de N posiciones" de un personaje de la biblioteca: escribir las poses clave en JSON (no pedir imágenes a una IA); para usarla como sprites, composición de N cuadros + `--png`.

## Herramientas
- ffmpeg: build **completo** del sistema (Gyan.FFmpeg full, instalado con winget; versión en `equipo.json`). Se usa por el acceso fijo `C:/Videos/_herramientas/ffmpeg/bin/` (junction a la carpeta de winget), así la ruta de `herramientas.json` (`ffmpeg`, `ffprobe`) no depende del usuario ni de la versión.
  - PowerShell: `ffmpeg` / `ffprobe` funcionan directo. **Git Bash no ve los alias de winget**: usar la ruta de `herramientas.json` o anteponer su carpeta al PATH.
  - Tras `winget upgrade --id Gyan.FFmpeg` la carpeta de winget cambia: rehacer el junction (ver `C:/Videos/_herramientas/README.txt`).
  - Tiene todos los filtros: `ebur128` (medir LUFS), `loudnorm`, `lut3d`, `silencedetect`, `sidechaincompress`, `xfade`, `drawtext`, `subtitles`, `arnndn`, `filter_complex`.
  - Proxies y borradores: el códec de `codecBorrador` en `equipo.json` (depende de la PC: `h264_qsv -global_quality 23` en la notebook Intel con Quick Sync; `libx264 -preset veryfast -crf 20` en la PC AMD Ryzen de 16 hilos, igual de rápido que AMF y con archivos más chicos). Entregas finales: `-c:v libx264 -crf 18 -preset slow`.
  - Medir volumen: `ffmpeg -i x.wav -af ebur128=peak=true -f null -`. Normalizar: `-af loudnorm=I=-14:TP=-1.5:LRA=11`.
  - `npx remotion ffmpeg` queda solo como respaldo: le faltan filtros (`ebur128`) y rompe los `filter_complex` desde Git Bash.
- Whisper: **`node scripts/transcribir.mjs <audio|video> <salida.json> [--prompt "Odoo, Tango"]`**. Usa el modelo `modeloWhisper` de `herramientas.json` (`large-v3-turbo-q8_0`), idioma `es` (otro con `--idioma en`), tiempos por palabra con DTW y todos los hilos (`hilosWhisper` de `equipo.json`). Salta los silencios largos con ffmpeg y devuelve cada palabra a su tiempo real: en crudos con pausas tarda la mitad. Velocidad: ~2,8x el tiempo real en la i3 con pausas (antes ~10x); en la Ryzen 7, menos de 1x. Si el audio es largo, correrlo en segundo plano.
  - NO usar el `--vad` de whisper-cli: los tiempos por palabra quedan en la línea de tiempo sin silencios (desfasados).
  - Whisper omite muletillas ("eh", "este"): para detectarlas, mirar los huecos entre palabras, no el texto.
  - No hay GPU NVIDIA en ninguna notebook (2026-09-29): whisper.cpp corre en CPU con el binario oficial.
  - Nota: el ejecutable está en `build/bin/whisper-cli.exe` (se reubicó desde `Release/` del zip oficial para que `@remotion/install-whisper-cpp` lo encuentre).
- Piper TTS (voz sintética local, gratis, sin internet): `python -m piper -m C:/Videos/_herramientas/modelos-piper/<voz>.onnx -f salida.wav` (texto por stdin; Python del `.venv`). Voces bajadas: `en_US-hfc_female-medium`, `en_US-amy-medium`, `en_US-kristin-medium`; otras con `python -m piper.download_voices --data-dir C:/Videos/_herramientas/modelos-piper <voz>`. Voz de nene: subir el tono con ffmpeg `rubberband=pitch=1.35:formant=shifted`. Ejemplo: `src/trabajos/2026-10-01_claudio_bloomie/preparar_voz.sh` (voz + Whisper `--idioma en` para sincronizar boca y texto).
  - **Atajo: `node scripts/voz.mjs "texto" <salida.wav> [--voz es_MX-claude-high] [--nene] [--velocidad 1.1]`** → Piper + recorte de silencios + -14 LUFS (medido con ebur128) + tiempos por palabra con Whisper en `<salida>.json`. Voces en español: `es_AR-daniela-high` (default, `vozPiperEs`), `es_MX-claude-high`. Piper no lee bien `¡¿` (el script los saca) y a veces acentúa mal el voseo ("alcanzás"): escuchar y, si hace falta, reescribir la palabra.
- Rhubarb Lip Sync (`rhubarb` en `herramientas.json`): **`node scripts/lipsync_rhubarb.mjs <audio> <salida.json> [--texto "frase"|archivo] [--ingles]`** → bocas A–H/X desde el sonido (reconocedor `phonetic`, sirve para español). ~2 s para 4 s de voz.
- RIFE (`rife`, Vulkan): **`node scripts/camara_lenta.mjs <video> <salida> --factor 2|4 [--desde s --hasta s] [--modo lento|fluido] [--escala 0.5]`** inventa cuadros intermedios (cámara lenta suave o 30→60 fps). Lento en la i3 (~1,2 s por cuadro 1080p): recortar al tramo que se usa.
- Real-ESRGAN (`realesrgan`, Vulkan): **`node scripts/subir_resolucion.mjs <imagen|video> <salida> [--x 2|4] [--anime] [--ancho 1920]`** para fotos viejas, logos chicos o 720p. Video ~2 s por cuadro en la i3: solo tramos cortos.
- Pulsos de la música (librosa del `.venv`): **`python scripts/pulsos.py <audio> public/trabajos/<ID>/datos/pulsos.json`** → bpm, `pulsos`, `compases`, `golpes`, `energia`. Para cortar al ritmo en `MontajeMusical`: `ajustarAlPulso(tomas, pulsos.compases)` de `calculos.ts` en `composiciones.ts` (también vale para Premiere).
- DeepFilterNet: `deepFilter.exe <entrada.wav> -o <carpeta>` (Python 3.11 del `.venv` compartido).
- MediaPipe: Tasks API (`FaceDetector`) con el modelo `blaze_face_short_range.tflite`.
- Color: LUTs `.cube` en `C:/Videos/_herramientas/luts`, aplicar con `-vf lut3d=archivo.cube`.
- Mixkit (música y efectos gratis, de Envato): `node scripts/mixkit.mjs`.
  - Buscar: `buscar <términos>` · `buscar mood:<estado>` · `buscar genero:<género>` · `buscar tag:<etiqueta>` · `buscar --sfx <términos>`. Leer `tmp/mixkit-busqueda.json` (id, título, autor, etiquetas, duración) y proponer 2-3 opciones con su razón antes de bajar.
  - Descargar: `bajar <id>` (música → `public/biblioteca/musica/mixkit/`) o `bajar <id> --sfx` (efectos → `public/biblioteca/sfx/mixkit/`). Registra la licencia y el `sha256` en `public/biblioteca/LICENCIAS-mixkit.json`; una re-descarga compara el hash y avisa si Mixkit cambió el archivo.
  - Verificar la biblioteca local contra los hashes (sin red): `node scripts/mixkit.mjs verificar`.
  - Para usar un tema en un trabajo: recortarlo, darle fundidos y normalizarlo con ffmpeg a `public/trabajos/<ID>/audio/` (ejemplo: `src/trabajos/2026-09-28_rastro_historia-ig/preparar_musica_15s.sh`).
  - Los términos de Mixkit PROHÍBEN descargas masivas con scripts: solo 1 búsqueda o 1 descarga por ejecución, de temas elegidos; nunca bajar en lote ni en bucle.
  - Estados de ánimo útiles (mood:): uplifting, happy, relaxing, dreamy, epic, energetic, romantic, sad. Géneros (genero:): corporate, ambient, hip-hop, jazz, funk, pop, rock, electronica, cinematic, lofi.

## Qué herramienta usar
| Tarea | Herramienta |
|---|---|
| Convertir formato, fps constante, cortar sin gráficos | ffmpeg |
| Cámara lenta suave / subir fps | RIFE (`scripts/camara_lenta.mjs`) |
| Subir resolución (fotos viejas, logos chicos, 720p) | Real-ESRGAN (`scripts/subir_resolucion.mjs`) |
| Cortes o animaciones al ritmo de la música | librosa (`scripts/pulsos.py`) → `ajustarAlPulso` |
| Proxies / borradores rápidos | ffmpeg con `codecBorrador` de `equipo.json` |
| Aplicar color (LUT) | ffmpeg `lut3d` |
| Normalizar volumen (-14 LUFS) / medirlo | ffmpeg `loudnorm` / `ebur128` |
| Hojas de contacto, revisar frames | ffmpeg `filter_complex` (tile/hstack) o Pillow del `.venv` |
| Limpiar ruido de voz | DeepFilterNet |
| Transcribir, tiempos por palabra | whisper.cpp |
| Silencios y muletillas | whisper.cpp (huecos entre palabras) → Remotion corta |
| Elegir fragmentos | leer la transcripción (texto, nunca el video) → candidatos en `public/trabajos/<ID>/datos/candidatos.json` → **`scripts/hoja_fragmentos.py <ID>`** (Python del `.venv`): alertas de desenfoque, brillo y caras + hoja en `out/<ID>/revision/`; descartar los que tengan alertas y recién ahí proponer → `clips.json` |
| Verificar que la suite funcione (tras instalar o actualizar) | `node scripts/verificar-suite.mjs [--rapido]` |
| Posición del sujeto para 9:16 | MediaPipe → `public/trabajos/<ID>/datos/encuadre.json` |
| Reencuadre, subtítulos, títulos, gráficos, transiciones, ducking, render | Remotion (plantillas de `src/plantillas/`) |
| Pasar la edición a Adobe Premiere | `/a-premiere` (`scripts/a-premiere.mjs`: XML de Final Cut 7 + capa ProRes 4444) |
| Animar un personaje (moverlo, hablar, secuencias de poses) | rig vectorial: `src/rig/` + plantilla `PersonajeRig`; personaje nuevo con `/rig-personaje` |
| Que el personaje copie los movimientos de una persona filmada | `scripts/rig/mocap.py` (MediaPipe) → pista `secuencia` |
| Boca del personaje sincronizada con una voz | Rhubarb (`scripts/lipsync_rhubarb.mjs` o `scripts/voz.mjs`) → pista `hablar` con `rhubarb` |
| Animación 2,5D (volumen, giros ¾, sombras, perspectiva) | rig + `luz` / `yaw` / sombra proyectada / `giro3d` (receta en "Personajes animados" y `src/rig/README.md`) |
| Animación 3D | `@remotion/three` + modelo por código (`Bloomie3D.tsx`) o `.glb` de un modelador; render `--gl=angle` (lento: preguntar antes) |
| Separar las piezas de un personaje del `.ai` | `scripts/rig/extraer_rig.py` (PyMuPDF) |
| Personaje con transparencia para CapCut / Premiere | `scripts/rig/exportar.mjs --mov` (ProRes 4444) o `--png` |
| Tipografías | `@remotion/google-fonts` |
| Música de fondo | 1º Mixkit (`scripts/mixkit.mjs` → biblioteca → preparada en `public/trabajos/<ID>/audio/`); 2º música compuesta por código |
| Efectos de sonido (whoosh, click, pop, transiciones) | Mixkit `--sfx` → `public/biblioteca/sfx/mixkit/` |
| Recortar música a la duración del video, fundidos | Remotion `<Audio trimBefore volume>` o ffmpeg `atrim`/`afade` + `loudnorm` |
| Voz de personaje / locución sintética | Piper TTS local con `scripts/voz.mjs` (1º, español rioplatense incluido); ChatCut si hace falta más naturalidad (preguntar antes: consume créditos) |
| Sprites o poses de un personaje con IA generativa | solo si el rig no puede (pose imposible con piezas rígidas); preguntar antes |
| Avatar, doblaje, música generada, stock | ChatCut (preguntar antes: consume créditos) |
| Duda entre dos opciones | la más rápida y barata en tokens; si afecta la calidad final, preguntar |

## Música
- Fuente principal: Mixkit (licencia libre para uso comercial, sin atribución obligatoria; no se puede revender el tema suelto ni reclamarlo como propio). Cada descarga queda en `public/biblioteca/LICENCIAS-mixkit.json`.
- Alternativa: música compuesta por código (sin licencias de terceros), como `src/trabajos/2026-09-28_rastro_historia-ig/musica_rastro.py`.
- Otras fuentes con licencia (YouTube Audio Library, Pixabay): revisar si exigen atribución.
- Mezcla: música de fondo a -14 LUFS si va sola; si hay voz, la música ~12-18 dB por debajo (ducking en Remotion). Verificar con `ebur128`.
