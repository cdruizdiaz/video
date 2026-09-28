# Proyecto Remotion — Suite de producción

## Regla principal
Todo pedido de video se resuelve primero con la suite instalada en este proyecto (Remotion, ffmpeg, whisper.cpp, DeepFilterNet, MediaPipe, Google Fonts, Mixkit), eligiendo la herramienta según la tabla "Qué herramienta usar". Remotion es el eje de la composición, pero no la única opción: cada tarea va con la herramienta que mejor la resuelve. Servicios externos (ChatCut, generación con IA, etc.) solo si la suite no puede hacerlo, y preguntando antes.

## Formatos
- Composición principal: 30 fps.
- Formatos: 1920x1080 (16:9) y 1080x1920 (9:16).

## Archivos
- Material crudo en `public/` (`video/`, `audio/`, `audio/musica/`, `img/`, `fonts/`); datos JSON en `public/datos/`. Usar siempre `staticFile()`.
- NUNCA abrir ni leer binarios de `public/` (videos, audio, imágenes): usar solo sus nombres.
- Rutas de las herramientas externas: leer `scripts/herramientas.json`.

## Código
- Valores de animación como constantes al inicio de cada archivo.
- `interpolate` siempre con `extrapolateLeft/Right: 'clamp'`.

## Render
- NUNCA hacer un render completo salvo pedido explícito. Para verificar: `npx remotion still <entry> <Comp> out/check.png --frame=N`.
- Render final: `--crf 18`. Audio final normalizado a -14 LUFS (`loudnorm`).

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
  - Buscar: `buscar <términos>` · `buscar mood:<estado>` · `buscar genero:<género>` · `buscar tag:<etiqueta>` · `buscar --sfx <términos>`. Leer `public/datos/mixkit-busqueda.json` (id, título, autor, etiquetas, duración) y proponer 2-3 opciones con su razón antes de bajar.
  - Descargar: `bajar <id>` (música → `public/audio/musica/mixkit/`) o `bajar <id> --sfx` (efectos → `public/audio/sfx/mixkit/`). Registra la licencia en `public/audio/LICENCIAS-mixkit.json`.
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
| Elegir fragmentos | leer la transcripción (texto, nunca el video) → `public/datos/clips.json` |
| Posición del sujeto para 9:16 | MediaPipe → `public/datos/encuadre.json` |
| Reencuadre, subtítulos, títulos, gráficos, transiciones, ducking, render | Remotion |
| Tipografías | `@remotion/google-fonts` |
| Música de fondo | 1º Mixkit (`scripts/mixkit.mjs`); 2º música compuesta por código; siempre en `public/audio/musica/` |
| Efectos de sonido (whoosh, click, pop, transiciones) | Mixkit `--sfx` → `public/audio/sfx/mixkit/` |
| Recortar música a la duración del video, fundidos | Remotion `<Audio trimBefore volume>` o ffmpeg `atrim`/`afade` + `loudnorm` |
| Voz IA, avatar, doblaje, música generada, stock | ChatCut (preguntar antes: consume créditos) |
| Duda entre dos opciones | la más rápida y barata en tokens; si afecta la calidad final, preguntar |

## Música
- Fuente principal: Mixkit (licencia libre para uso comercial, sin atribución obligatoria; no se puede revender el tema suelto ni reclamarlo como propio). Cada descarga queda en `public/audio/LICENCIAS-mixkit.json`.
- Alternativa: música compuesta por código (sin licencias de terceros), como `scripts/musica_rastro.py`.
- Otras fuentes con licencia (YouTube Audio Library, Pixabay): revisar si exigen atribución.
- Mezcla: música de fondo a -14 LUFS si va sola; si hay voz, la música ~12-18 dB por debajo (ducking en Remotion). Verificar con `ebur128`.
