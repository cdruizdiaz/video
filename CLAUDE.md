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

Compartido entre trabajos:
- `public/marcas/<cliente>/` + `src/marcas/<cliente>/marca.ts`: kit de marca (logo, fotos institucionales, colores, tipografía, curvas).
- `public/biblioteca/`: música y efectos de Mixkit ya bajados (reutilizables).
- `src/plantillas/`: plantillas reutilizables (`HistoriaMarca`, …) + `comunes/piezas.tsx`.

Reglas:
- Comandos: **`/nuevo-trabajo <cliente> <pieza> [crudos] [brief]`** abre un trabajo; **`/cerrar-trabajo <ID>`** lo cierra y archiva.
- **Guion audiovisual = fuente de verdad** de cada pieza: `src/trabajos/<ID>/guion_<pieza>.md` (formato en `src/trabajos/_plantilla/GUION.md`). **`/guion <ID|descripción>`** lo genera; cuando el usuario lo edita o pega una versión nueva, **`/aplicar-guion <ID>`** aplica SOLO lo que cambió (vía `git diff` del guion) y renderiza una `_vN` nueva. Si se cambia el video por otro pedido, actualizar también el guion para que siga describiendo el video real.
- Si el pedido del usuario no nombra un trabajo, preguntar si es uno nuevo o la continuación de uno existente.
- **Nunca sobrescribir un archivo de `out/<ID>/final/`**: cada cambio es una versión nueva `_vN+1`. Anotar cada entrega en `TRABAJO.md`.
- Un trabajo parecido a otro anterior se hace reutilizando su plantilla y cambiando solo los datos (textos, imágenes, duraciones, música).
- Remotion copia TODO `public/` en cada render: mantener solo trabajos activos; al terminar, `/cerrar-trabajo` mueve el material pesado a `<carpetaArchivo>/<ID>/`.
- IDs de composición: solo letras, números y guiones (`<cliente>-<pieza>-<variante>`); se registran en `src/trabajos/index.ts`.

## Archivos
- Todo lo que usa Remotion va dentro de `public/` y se referencia con `staticFile("trabajos/<ID>/…")`, `staticFile("marcas/<cliente>/…")`, etc.
- NUNCA abrir ni leer binarios de `public/` (videos, audio, imágenes): usar solo sus nombres.
- Rutas de las herramientas externas y de las carpetas de crudos/archivo: leer `scripts/herramientas.json`.

## Código
- Valores de animación como constantes al inicio de cada archivo.
- `interpolate` siempre con `extrapolateLeft/Right: 'clamp'`.

## Render
- NUNCA hacer un render completo salvo pedido explícito. Para verificar: `npx remotion still src/index.ts <comp> out/<ID>/revision/f<N>.png --frame=N`, o una secuencia a `--scale=0.25` y una hoja de contactos en `out/<ID>/revision/`.
- Render final: `npx remotion render src/index.ts <comp> out/<ID>/final/<pieza>_<formato>_v<N>.mp4 --crf=18`.
- Audio final normalizado a -14 LUFS (`loudnorm`) y verificado con `ebur128`.

## Herramientas
- ffmpeg: build **completo** del sistema (Gyan.FFmpeg 9.0.2 full, instalado con winget). Rutas en `scripts/herramientas.json` (`ffmpeg`, `ffprobe`).
  - PowerShell: `ffmpeg` / `ffprobe` funcionan directo. **Git Bash no ve los alias de winget**: usar la ruta completa de `herramientas.json` o anteponer su carpeta al PATH.
  - Tiene todos los filtros: `ebur128` (medir LUFS), `loudnorm`, `lut3d`, `silencedetect`, `sidechaincompress`, `xfade`, `drawtext`, `subtitles`, `arnndn`, `filter_complex`.
  - Proxies y borradores: `-c:v h264_qsv -global_quality 23` (Intel Quick Sync, ~4,5x más rápido que libx264). Entregas finales: `-c:v libx264 -crf 18 -preset slow`.
  - Medir volumen: `ffmpeg -i x.wav -af ebur128=peak=true -f null -`. Normalizar: `-af loudnorm=I=-14:TP=-1.5:LRA=11`.
  - `npx remotion ffmpeg` queda solo como respaldo: le faltan filtros (`ebur128`) y rompe los `filter_complex` desde Git Bash.
- Whisper: modelo `large-v3-turbo`, idioma `es`, con marcas de tiempo por palabra (`tokenLevelTimestamps: true`). Entrada: WAV 16 kHz mono. Pasar `additionalArgs: [["-t", "4"]]` (usa los 4 hilos del CPU). Es lento (~10x el tiempo real en este equipo): correrlo en segundo plano.
  - Nota: el ejecutable está en `build/bin/whisper-cli.exe` (se reubicó desde `Release/` del zip oficial para que `@remotion/install-whisper-cpp` lo encuentre).
- DeepFilterNet: `deepFilter.exe <entrada.wav> -o <carpeta>` (Python 3.11 del `.venv` compartido).
- MediaPipe: Tasks API (`FaceDetector`) con el modelo `blaze_face_short_range.tflite`.
- Color: LUTs `.cube` en `C:/Videos/_herramientas/luts`, aplicar con `-vf lut3d=archivo.cube`.
- Mixkit (música y efectos gratis, de Envato): `node scripts/mixkit.mjs`.
  - Buscar: `buscar <términos>` · `buscar mood:<estado>` · `buscar genero:<género>` · `buscar tag:<etiqueta>` · `buscar --sfx <términos>`. Leer `tmp/mixkit-busqueda.json` (id, título, autor, etiquetas, duración) y proponer 2-3 opciones con su razón antes de bajar.
  - Descargar: `bajar <id>` (música → `public/biblioteca/musica/mixkit/`) o `bajar <id> --sfx` (efectos → `public/biblioteca/sfx/mixkit/`). Registra la licencia en `public/biblioteca/LICENCIAS-mixkit.json`.
  - Para usar un tema en un trabajo: recortarlo, darle fundidos y normalizarlo con ffmpeg a `public/trabajos/<ID>/audio/` (ejemplo: `src/trabajos/2026-09-28_rastro_historia-ig/preparar_musica_15s.sh`).
  - Los términos de Mixkit PROHÍBEN descargas masivas con scripts: solo 1 búsqueda o 1 descarga por ejecución, de temas elegidos; nunca bajar en lote ni en bucle.
  - Estados de ánimo útiles (mood:): uplifting, happy, relaxing, dreamy, epic, energetic, romantic, sad. Géneros (genero:): corporate, ambient, hip-hop, jazz, funk, pop, rock, electronica, cinematic, lofi.

## Qué herramienta usar
| Tarea | Herramienta |
|---|---|
| Convertir formato, fps constante, cortar sin gráficos | ffmpeg |
| Proxies / borradores rápidos | ffmpeg `h264_qsv` |
| Aplicar color (LUT) | ffmpeg `lut3d` |
| Normalizar volumen (-14 LUFS) / medirlo | ffmpeg `loudnorm` / `ebur128` |
| Hojas de contacto, revisar frames | ffmpeg `filter_complex` (tile/hstack) o Pillow del `.venv` |
| Limpiar ruido de voz | DeepFilterNet |
| Transcribir, tiempos por palabra | whisper.cpp |
| Silencios y muletillas | whisper.cpp (huecos entre palabras) → Remotion corta |
| Elegir fragmentos | leer la transcripción (texto, nunca el video) → `public/trabajos/<ID>/datos/clips.json` |
| Posición del sujeto para 9:16 | MediaPipe → `public/trabajos/<ID>/datos/encuadre.json` |
| Reencuadre, subtítulos, títulos, gráficos, transiciones, ducking, render | Remotion (plantillas de `src/plantillas/`) |
| Tipografías | `@remotion/google-fonts` |
| Música de fondo | 1º Mixkit (`scripts/mixkit.mjs` → biblioteca → preparada en `public/trabajos/<ID>/audio/`); 2º música compuesta por código |
| Efectos de sonido (whoosh, click, pop, transiciones) | Mixkit `--sfx` → `public/biblioteca/sfx/mixkit/` |
| Recortar música a la duración del video, fundidos | Remotion `<Audio trimBefore volume>` o ffmpeg `atrim`/`afade` + `loudnorm` |
| Voz IA, avatar, doblaje, música generada, stock | ChatCut (preguntar antes: consume créditos) |
| Duda entre dos opciones | la más rápida y barata en tokens; si afecta la calidad final, preguntar |

## Música
- Fuente principal: Mixkit (licencia libre para uso comercial, sin atribución obligatoria; no se puede revender el tema suelto ni reclamarlo como propio). Cada descarga queda en `public/biblioteca/LICENCIAS-mixkit.json`.
- Alternativa: música compuesta por código (sin licencias de terceros), como `src/trabajos/2026-09-28_rastro_historia-ig/musica_rastro.py`.
- Otras fuentes con licencia (YouTube Audio Library, Pixabay): revisar si exigen atribución.
- Mezcla: música de fondo a -14 LUFS si va sola; si hay voz, la música ~12-18 dB por debajo (ducking en Remotion). Verificar con `ebur128`.
