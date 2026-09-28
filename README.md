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
   - whisper.cpp + modelo `large-v3-turbo` (~1,6 GB);
   - Python 3.11 con DeepFilterNet y MediaPipe (versiones fijadas en `setup/herramientas/requirements.txt`);
   - reescribe `scripts/herramientas.json` con las rutas de esa PC;
   - regenera la música y vuelve a bajar los temas de Mixkit (no se versionan).
4. **Paso manual opcional:** instalar [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) (gratis) para crear el LUT de color.

Las herramientas pesadas se instalan una sola vez por PC en `C:\Videos\_herramientas` y las comparten todos los proyectos (~3 GB).

## Uso

```bash
npm run dev                       # Remotion Studio (vista previa)
npx remotion render src/index.ts HistoriaRastro   out/historia-rastro-30s.mp4 --crf=18
npx remotion render src/index.ts HistoriaRastro15 out/historia-rastro-15s.mp4 --crf=18
node scripts/mixkit.mjs buscar mood:uplifting     # música gratis (Mixkit)
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
public/            material (video/, audio/, img/, fonts/, datos/) — los videos y audios no se versionan
scripts/           mixkit.mjs, musica_rastro.py, herramientas.json (rutas de la PC)
setup/             prompt_instalacion.txt + herramientas/ (instalar-whisper.mjs, requirements.txt, READMEs)
src/Rastro/        historias de Instagram de RASTRO (30 s y 15 s)
out/               renders (no se versiona)
```

## Licencias de recursos

- Imágenes de `public/img/rastro/`: propiedad de RASTRO (somosrastro.com.ar).
- Música de Mixkit: *Mixkit Stock Music Free License*; cada tema bajado queda registrado en `public/audio/LICENCIAS-mixkit.json`.
- Música de RASTRO: compuesta por código (`scripts/musica_rastro.py`), sin material de terceros.
- Remotion: gratis para individuos y empresas de hasta 3 personas ([licencia](https://www.remotion.dev/license)).
