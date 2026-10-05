# Suite de producción de video — Remotion + Claude Code

Proyecto de video programático con [Remotion](https://www.remotion.dev/), pensado para trabajar con Claude Code. Incluye la suite completa (ffmpeg, whisper.cpp, DeepFilterNet, MediaPipe, Mixkit), las reglas de trabajo y las historias de Instagram de RASTRO.

## Replicar en otra PC (Windows 11)

1. **Requisitos:** [Git](https://git-scm.com/), [Node.js 22+](https://nodejs.org/) y [Claude Code](https://claude.com/claude-code).
2. **Clonar:**
   ```powershell
   git clone https://github.com/cdruizdiaz/video.git
   cd video
   ```
3. **Instalar la suite:** abrí Claude Code en la carpeta del repo y pegá el contenido de [`setup/prompt_instalacion.txt`](setup/prompt_instalacion.txt).
   Claude instala y verifica todo (pide permiso antes de instalar software de sistema):
   - dependencias de Node (`npm install`);
   - ffmpeg completo (winget, Gyan.FFmpeg);
   - whisper.cpp + modelo `large-v3-turbo-q8_0` (~870 MB);
   - Python 3.11 con DeepFilterNet y MediaPipe (versiones fijadas en `setup/herramientas/requirements.txt`);
   - crea el acceso fijo `C:/Videos/_herramientas/ffmpeg` y el archivo `equipo.json` con los datos de esa PC (`scripts/herramientas.json` es igual en todas las PC y no se toca);
   - regenera la música y vuelve a bajar los temas de Mixkit (no se versionan).
4. **Paso manual opcional:** instalar [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) (gratis) para crear el LUT de color.

Las herramientas pesadas se instalan una sola vez por PC en `C:\Videos\_herramientas` y las comparten todos los proyectos (~3 GB).

### PC donde la suite ya estaba instalada (antes del commit `db5fe60`)

Desde ese commit, `scripts/herramientas.json` usa rutas iguales en todas las PC. En la PC original, **después de hacer `git pull`, hay que crear una sola vez el acceso fijo a ffmpeg y el archivo `equipo.json`**. Si no, los scripts no van a encontrar ffmpeg.

1. Acceso fijo a ffmpeg (PowerShell, no requiere admin):
   ```powershell
   New-Item -ItemType Junction -Path C:\Videos\_herramientas\ffmpeg -Target (Split-Path (Split-Path (Get-Command ffmpeg).Source))
   C:\Videos\_herramientas\ffmpeg\bin\ffmpeg.exe -version
   ```
2. Crear `C:\Videos\_herramientas\equipo.json` con los datos de esa PC. Ejemplo para la notebook Intel i3 (4 hilos, con Quick Sync):
   ```json
   {
     "cpu": "Intel i3-10110U (4 hilos)",
     "ffmpegVersion": "9.0.2-full_build",
     "codecBorrador": "-c:v h264_qsv -global_quality 23",
     "hilosWhisper": 4,
     "whisperVelocidad": "~10x el tiempo real"
   }
   ```

Otra opción es volver a correr `setup/prompt_instalacion.txt`: detecta lo que ya está instalado y solo hace estos dos pasos.

### Después de las mejoras del 2026-09-29 (modelo de Whisper cuantizado)

`herramientas.json` ahora usa el modelo `large-v3-turbo-q8_0`. En cada PC que ya tenía la suite, una sola vez:

```powershell
Copy-Item setup/herramientas/instalar-whisper.mjs C:\Videos\_herramientas\ -Force
node C:/Videos/_herramientas/instalar-whisper.mjs     # baja el q8_0 (~870 MB); whisper.cpp ya instalado no se toca
node scripts/verificar-suite.mjs                      # todo en ✅ (velocidad de Whisper: paso 3c del prompt de instalación)
node scripts/mixkit.mjs verificar                     # agrega el sha256 de los temas que se bajaron en esa PC
```

El modelo anterior (`ggml-large-v3-turbo.bin`, 1,6 GB) se puede borrar después de verificar.

## Uso

Cada pedido es un **trabajo** con ID `AAAA-MM-DD_cliente_pieza`. En Claude Code:

```
/nuevo-trabajo rastro clips-charla C:\Videos\crudos\charla "3 clips 9:16 de 30-45 s con subtítulos"
... (Claude arma proxies, transcribe, propone fragmentos, compone, muestra revisiones) ...
/cerrar-trabajo 2026-10-02_rastro_clips-charla
```

**Guion audiovisual con tiempos** (cada pieza tiene uno en `src/trabajos/<ID>/guion_<pieza>.md`):

```
/guion 2026-09-28_rastro_historia-ig          → genera o describe el guion (mismo formato siempre)
... editás el guion (en el archivo o copiándolo) ...
/aplicar-guion 2026-09-28_rastro_historia-ig  → aplica solo lo que cambiaste y renderiza una versión _vN nueva
```

Comandos directos:

```bash
npm run dev                                          # Remotion Studio (una carpeta por trabajo)
npx remotion render src/index.ts rastro-historia-ig-15s out/2026-09-28_rastro_historia-ig/final/historia-15s_9x16_v3.mp4 --crf=18
node scripts/mixkit.mjs buscar mood:uplifting        # música gratis (Mixkit)
```

## Documentación

| Archivo | Para qué |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Reglas que Claude Code lee en cada sesión: regla principal, qué herramienta usar para cada tarea, rutas y convenciones |
| [`remotion-guias.md`](remotion-guias.md) | Guía de buenas prácticas (prompts, tokens, estructura) para reutilizar en otros proyectos |
| [`analisis-suite.md`](analisis-suite.md) | Análisis y decisión de la suite: comparativa con ChatCut, costos, rendimiento medido, pendientes |
| [`setup/`](setup/) | Prompt de instalación y archivos de apoyo de las herramientas compartidas |

## Estructura

```
public/marcas/<cliente>/       kit de marca (logo, fotos, tipografías)
public/biblioteca/             música y efectos de Mixkit (+ LICENCIAS-mixkit.json)
public/trabajos/<ID>/          crudos/ (proxies), audio/, img/, datos/ — solo datos/ se versiona
src/marcas/<cliente>/          colores, tipografía, curvas y logo de cada marca
src/plantillas/                plantillas reutilizables (HistoriaMarca, …) + piezas comunes
src/trabajos/<ID>/             TRABAJO.md (brief, decisiones, entregas) + composiciones.ts
out/<ID>/revision|final/       renders (no se versiona); finales como <pieza>_<formato>_v<N>.mp4
scripts/                       mixkit.mjs, herramientas.json (rutas, iguales en todas las PC)
setup/                         prompt_instalacion.txt + herramientas/
.claude/commands/              /nuevo-trabajo, /cerrar-trabajo, /guion, /aplicar-guion
```

Originales fuera del proyecto en `C:\Videos\crudos\<ID>\`; trabajos cerrados en `C:\Videos\archivo\<ID>\`.

## Licencias de recursos

- Imágenes de `public/marcas/rastro/`: propiedad de RASTRO (somosrastro.com.ar).
- Música de Mixkit: *Mixkit Stock Music Free License*; cada tema bajado queda registrado en `public/biblioteca/LICENCIAS-mixkit.json`.
- Música de la historia de 30 s de RASTRO: compuesta por código (`src/trabajos/2026-09-28_rastro_historia-ig/musica_rastro.py`), sin material de terceros.
- Remotion: gratis para individuos y empresas de hasta 3 personas ([licencia](https://www.remotion.dev/license)).
