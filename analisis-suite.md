# Análisis de la suite de producción de video

*Guardado el 2026-09-28 para retomarlo después. Resume lo analizado en la sesión con Claude Code.*

---

## 1. Decisión tomada

**Suite principal:** Remotion + ffmpeg + whisper.cpp, con MediaPipe, DeepFilterNet, DaVinci Resolve (gratis), Google Fonts y **Mixkit** (música y efectos con licencia libre, integrado el 2026-09-28).
**Complemento opcional:** ChatCut en el plan gratis, solo para IA generativa (voz, avatar, doblaje, música generada) o material de stock.

**Motivo:** costo bajo ($0 más el uso de Claude), calidad profesional repetible, todo el control en código (versionable en git) y bajo consumo de tokens una vez montado el flujo.

**Regla vigente (en `CLAUDE.md`):** todo pedido de video se resuelve primero con la suite instalada, eligiendo la herramienta según la tabla "Qué herramienta usar". Remotion es el eje, pero no la única opción. Los servicios externos se usan solo si la suite no puede hacerlo, y preguntando antes.

---

## 2. Comparativa: suite completa vs ChatCut

Leyenda: 🎬 Remotion · 🔧 ffmpeg · 🎙️ whisper.cpp · 👤 MediaPipe · 🔊 DeepFilterNet · 🎨 DaVinci Resolve · 🔤 Google Fonts · 🎵 Música con licencia · 🤖 Claude

| Funcionalidad | Suite completa (con cuál conviene) | ChatCut | Conviene |
|---|---|---|---|
| Preparar el crudo (formato, fps, proxies) | 🔧 ffmpeg | ⚠️ Interno, sin control | Suite |
| Corrección de color | 🎨 Resolve crea el LUT → 🔧 ffmpeg `lut3d` | ⚠️ Solo LUTs predefinidos | Suite |
| Limpiar ruido de voz | 🔊 DeepFilterNet | ✅ Aislar voz | Empate |
| Normalizar volumen (-14 LUFS) | 🔧 ffmpeg `loudnorm` | ⚠️ Sin control del estándar | Suite |
| Transcripción | 🎙️ whisper.cpp + 🤖 corrección | ✅ Automática | Empate (Suite en precisión) |
| Quitar silencios | 🎙️ huecos entre palabras → 🎬 corta | ✅ Un comando | Empate |
| Quitar muletillas | 🎙️ ubica → 🤖 decide → 🎬 corta | ✅ Automático (lista fija) | Empate |
| Elegir fragmentos | 🎙️ → 🤖 → 🎬 | ✅ Tachando el guion | ChatCut (1 video) / Suite (muchos) |
| Cortar clips | 🔧 ffmpeg o 🎬 Remotion | ✅ | Empate |
| Reencuadre fijo 16:9 → 9:16 | 🔧 ffmpeg `crop` | ✅ | Empate |
| Reencuadre siguiendo al sujeto | 👤 MediaPipe → 🎬 Remotion | ⚠️ Manual | Suite |
| Reencuadre según quién habla | 👤 + 🎙️ (experimental) → 🎬 | ⚠️ Manual | Suite |
| Subtítulos animados | 🎙️ + 🔤 + 🎬 `@remotion/captions` | ✅ | Suite (estilo propio) |
| Subtítulos .srt | 🎙️ exporta directo | ✅ | Empate |
| Traducir subtítulos | 🤖 traduce → 🎬 | ✅ + doblaje (créditos) | Empate / ChatCut (doblaje) |
| Títulos y gráficos | 🎬 + 🔤 | ✅ JSX + plantillas | Suite |
| Gráficos sincronizados con la voz | 🎙️ → 🎬 | ✅ | Empate |
| Títulos y capítulos automáticos | 🎙️ → 🤖 | ⚠️ | Suite |
| Transiciones | 🎬 `@remotion/transitions` | ✅ Biblioteca | Empate |
| Música de fondo | 🎵 Mixkit (`scripts/mixkit.mjs`), o compuesta con código | ✅ IA (créditos) | Suite (costo) |
| Efectos de sonido | 🎵 Mixkit `--sfx` | ✅ Biblioteca / IA | Empate |
| Ducking | 🎙️ tramos con voz → 🎬 | ✅ Automático | Empate |
| Voz IA / avatar / doblaje | ❌ | ✅ (créditos) | ChatCut |
| Material de stock | ❌ | ✅ | ChatCut |
| Vista previa y ajustes manuales | 🎬 Remotion Studio | ✅ Editor completo | ChatCut |
| Plantillas / series de videos | 🎬 | ⚠️ | Suite |
| Procesamiento en lote | 🔧 + 🎙️ + 🔊 con scripts | ⚠️ | Suite |
| Velocidad | ⚠️ Lenta en esta PC (sin GPU) | ✅ Nube / Desktop | ChatCut |
| Control y versionado | ✅ Código y JSON en git | ⚠️ En su plataforma | Suite |
| Curva de aprendizaje | ⚠️ Media-alta al montarlo | ✅ Baja | ChatCut |
| Tokens de Claude | ✅ Bajo al reutilizar | ⚠️ Medio | Suite |
| Costo | ✅ $0 | ✅ Gratis para editar; créditos para IA | Empate |

**Balance:**
- **Gana la suite:** color, seguimiento del sujeto, estilo propio, plantillas, lotes, control y costo.
- **Empate:** todo lo basado en el habla, gracias a whisper.cpp.
- **Gana ChatCut:** IA generativa, stock, editor visual, velocidad y facilidad.

---

## 3. Costos y licencias

| Herramienta | Costo | Notas |
|---|---|---|
| ffmpeg | Gratis | LGPL/GPL |
| Remotion | Gratis | Individuos y empresas de hasta 3 empleados; de 4 en adelante requiere licencia de empresa. Remotion Lambda (render en la nube) paga AWS |
| whisper.cpp | Gratis | Local |
| MediaPipe | Gratis | Apache 2.0 |
| DeepFilterNet | Gratis | MIT/Apache 2.0 |
| DaVinci Resolve | Gratis | Studio cuesta alrededor de US$295 (no hace falta) |
| Google Fonts | Gratis | OFL/Apache |
| Mixkit (Envato) | Gratis | Música y efectos: uso comercial, sin atribución obligatoria. No revender el tema suelto ni reclamarlo como propio. Los términos prohíben descargas masivas con scripts (el script baja de a 1) |
| Otra música con licencia | Gratis | YouTube Audio Library / Pixabay: algunas pistas exigen atribución; Pixabay puede generar reclamos de Content ID |
| ChatCut | Plan gratis | 20 créditos iniciales. Editar, transcribir, subtitular y exportar no consume créditos; la IA generativa sí. 60 min de exportación en la nube de por vida (sin límite desde Desktop). Pro: según reseñas, alrededor de US$25/mes por 100 créditos (a confirmar en la cuenta) |
| Claude Code | Suscripción o API | Con Pro/Max, ahorrar tokens retrasa el límite; con la API, ahorra dinero directamente |

---

## 4. Estado de la instalación (verificada el 2026-09-28)

| Componente | Versión | Ubicación |
|---|---|---|
| ffmpeg | 9.0.2 full build (Gyan, vía winget), con Intel Quick Sync | Sistema; ruta en `scripts/herramientas.json` (Git Bash no ve el alias). `npx remotion ffmpeg` 7.1 queda como respaldo |
| whisper.cpp | 1.9.2 | `C:\Videos\_herramientas\whisper.cpp\build\bin\` (se renombró `Release\` a `build\bin\`) |
| Modelo Whisper | large-v3-turbo | `C:\Videos\_herramientas\modelos-whisper\` |
| Python | 3.11.9 (convive con 3.13) | `.venv` en `C:\Videos\_herramientas\` |
| PyTorch | 2.0.1+cpu / torchaudio 2.0.2+cpu + soundfile | `.venv` |
| DeepFilterNet | 0.5.6 | `.venv` |
| MediaPipe | 1.0.1 (numpy 1.26.4) + `blaze_face_short_range.tflite` | `.venv` + `modelos-mediapipe\` |
| Mixkit | Script propio `scripts/mixkit.mjs` (sin dependencias; usa ffprobe para la duración) | `mi-video/scripts/` + copia maestra en `C:\Videos\_herramientas\mixkit.mjs` |
| Paquetes Remotion | 4.0.529 (captions, google-fonts, transitions, media-utils, install-whisper-cpp) | `mi-video` |

Espacio usado en `C:\Videos\_herramientas`: 2,9 GB. Los detalles están en `C:\Videos\_herramientas\README.txt`.

**Rendimiento medido (Intel i3-10110U, 4 hilos, sin GPU):**
- whisper large-v3-turbo: ~118 s por cada 11 s de audio (unas 10 veces el tiempo real). Un video de 30 min tardaría unas 5 h.
- DeepFilterNet: ~29 s por cada 11 s de audio.
- Render de Remotion: 30 s de video 1080×1920 en unos 2–3 min.
- ffmpeg, recodificar 30 s de 1080×1920: `h264_qsv` 13 s vs `libx264 medium` 59 s. Usar Quick Sync para proxies y borradores.

---

## 5. Lecciones aprendidas

- `npx remotion ffmpeg` no incluye el filtro `ebur128`, y los filtros complejos (`filter_complex` con paréntesis) se rompen al pasarlos desde Git Bash. **Resuelto:** se instaló el ffmpeg completo del sistema (2026-09-28), donde ambos funcionan.
- Git Bash no ve los alias que crea winget (`ffmpeg`, `ffprobe`): usar la ruta completa de `herramientas.json`.
- Volumen medido de la música de RASTRO: -15,5 LUFS (30 s) y -15,2 LUFS (15 s).
- Tailwind convierte las `<img>` en bloques: para centrar una imagen usar `display: flex; justifyContent: center`, no `textAlign`.
- La forma más barata de revisar un video: renderizar una secuencia en baja resolución (`--sequence --scale=0.25`) y armar una hoja de contactos con Python.
- Grabar en 4K si después se van a sacar clips verticales de tomas 16:9.

---

## 6. Pendientes / próximos pasos

- [ ] Decidir el modelo de Whisper: mantener `large-v3-turbo` (máxima calidad, lento) o probar `small` (más rápido). Se puede medir en esta PC.
- [ ] Instalar DaVinci Resolve (gratis), crear el LUT de la cámara y guardarlo en `C:\Videos\_herramientas\luts\`.
- [x] Fuente de música con licencia: Mixkit integrado (2026-09-28). De prueba se bajaron "Close Up" (id 1167, corporativo positivo, 1:35) y el efecto "Cinematic whoosh fast transition" (id 1492).
- [ ] Montar el flujo "crudo 16:9 → clips 9:16": transcribir → quitar silencios y muletillas → elegir fragmentos → reencuadre con MediaPipe → subtítulos → render.
- [ ] Evaluar si conviene una GPU NVIDIA (es la inversión con más impacto en velocidad).

---

## 7. Trabajo realizado: historia de Instagram de RASTRO

- **Versión 1 (15 s):** `out/historia-rastro.mp4`. Música house a 120 BPM. El código de esta versión fue reemplazado por la versión 2.
- **Versión 2 (30 s, según el guion de 6 escenas):** `out/historia-rastro-30s.mp4`.
  - Código: `src/Rastro/` (`HistoriaRastro.tsx`, `piezas.tsx`, `tema.ts`). Composición `HistoriaRastro`.
  - Música: `scripts/musica_rastro.py`, que genera `public/audio/musica/rastro-base.wav` (base suave, Fa mayor, 120 BPM, normalizada a -16 LUFS, con entrada y salida graduales).
  - Imágenes tomadas de somosrastro.com.ar, en `public/img/rastro/`.
  - Identidad: papel `#f7f4ea`, tinta `#0d0d0d`, gris `#6f6b62`, Inter y la curva de animación `cubic-bezier(.16,1,.3,1)`.
- **Versión 3 (15 s, mismo guion comprimido):** `out/historia-rastro-15s.mp4`. Composición `HistoriaRastro15`: el mismo código con `version: "15s"`, donde el factor `ritmo` (0,45) acelera todas las apariciones. Música: `python scripts/musica_rastro.py <salida> 15`, que genera `rastro-base-15s.wav`.
