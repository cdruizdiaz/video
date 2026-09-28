Herramientas compartidas de la suite de video
=============================================
Instaladas el 2026-09-28. Las usan todos los proyectos Remotion (cada proyecto
las referencia desde scripts/herramientas.json).

ffmpeg (instalado a nivel de sistema, fuera de esta carpeta)
-----------------------------------------------------------
Gyan.FFmpeg 9.0.2 full build (winget install --id Gyan.FFmpeg -e), agregado el 2026-09-28.
  C:\Users\CLAUDIO\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\
  - PowerShell/cmd: "ffmpeg" y "ffprobe" funcionan directo (alias de winget).
  - Git Bash NO ve esos alias: usar la ruta completa (está en scripts/herramientas.json de cada proyecto).
  - Incluye ebur128, loudnorm, lut3d, silencedetect, sidechaincompress, xfade, drawtext, subtitles, arnndn,
    libx264, libx265, SVT-AV1 e Intel Quick Sync (h264_qsv / hevc_qsv).
  - Medido: 30 s de video 1080x1920 -> h264_qsv 13 s vs libx264 medium 59 s.
  - Actualizar: winget upgrade --id Gyan.FFmpeg  (cambia la carpeta de versión: actualizar herramientas.json)

Contenido
---------
whisper.cpp\build\bin\whisper-cli.exe   whisper.cpp 1.9.2 (binario oficial x64, CPU)
  Nota: el zip oficial trae la carpeta "Release\"; se renombró a "build\bin\"
  porque @remotion/install-whisper-cpp (>=1.7.4) busca el ejecutable ahí.
modelos-whisper\ggml-large-v3-turbo.bin  Modelo de transcripción (~1,6 GB)
modelos-mediapipe\blaze_face_short_range.tflite   Detector de caras (MediaPipe Tasks)
.venv\                                   Python 3.11.9 con:
    torch 2.0.1+cpu, torchaudio 2.0.2+cpu, soundfile  (backend de audio en Windows)
    DeepFilterNet 0.5.6, mediapipe 1.0.1, numpy 1.26.4
    (versiones exactas en requirements.txt)
luts\                                    LUTs .cube exportados desde DaVinci Resolve
mixkit.mjs                               Copia maestra del script de Mixkit (música y efectos gratis).
                                         Copiarlo a <proyecto>\scripts\ y ejecutar desde la raíz del proyecto:
                                         node scripts/mixkit.mjs buscar mood:uplifting | bajar <id> [--sfx]
                                         (1 búsqueda o 1 descarga por ejecución: los términos de Mixkit
                                         prohíben descargas masivas con scripts)
instalar-whisper.mjs                     Reinstala whisper.cpp + modelo
                                         (ejecutar desde la raíz de un proyecto Remotion)

Uso rápido
----------
Limpiar voz:     .venv\Scripts\deepFilter.exe entrada.wav -o carpeta_salida
Transcribir:     transcribe() de @remotion/install-whisper-cpp con
                 whisperPath = C:/Videos/_herramientas/whisper.cpp, whisperCppVersion = "1.9.2",
                 model = "large-v3-turbo", modelFolder = C:/Videos/_herramientas/modelos-whisper
                 (entrada: WAV 16 kHz mono)
Color:           npx remotion ffmpeg -i in.mp4 -vf lut3d=C:/Videos/_herramientas/luts/x.cube out.mp4

Rendimiento medido (Intel i3-10110U, 4 hilos, sin GPU)
------------------------------------------------------
whisper large-v3-turbo: ~118 s para 11 s de audio (~10x el tiempo real) usando "-t 4".
DeepFilterNet: ~29 s para 11 s de audio (incluye la carga inicial del modelo).

Reinstalar Python desde cero
----------------------------
py -3.11 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu
