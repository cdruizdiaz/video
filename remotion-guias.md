# 🎬 Guía de Buenas Prácticas: Claude Code + Remotion

Este documento establece las reglas fundamentales para programar animaciones en Remotion utilizando asistentes de IA. El objetivo es minimizar el consumo de tokens (evitando bucles de corrección) y lograr animaciones deterministas y de alta calidad desde el primer intento.

---

## 0. Configuración Inicial (una sola vez)

### `CLAUDE.md` en la raíz del proyecto
Claude Code lee este archivo automáticamente al inicio de cada sesión (y sobrevive a `/clear`). Úsalo para no repetir las mismas convenciones en cada prompt.

```markdown
# Proyecto Remotion
- Composición principal: 1920x1080, 30 fps.
- Componentes en `src/components/`, uno por archivo.
- Valores de animación (frames, escalas, damping) como constantes al inicio de cada archivo.
- Usa `spring` para movimientos físicos e `interpolate` para opacidad/colores.
- Siempre `extrapolateLeft/Right: 'clamp'` en `interpolate`.
- Para verificar: `npx remotion still src/index.ts <Composicion> out/check.png --frame=<N>`.
- NUNCA hagas un render completo del video salvo que te lo pida explícitamente.
- Material en `public/trabajos/<ID>/` (crudos/, audio/, img/, datos/). Referéncialo con `staticFile("trabajos/<ID>/crudos/x.mp4")`.
- NUNCA abras ni leas archivos binarios de `public/` (videos, audio, imágenes): usa solo sus nombres.
```

> 💡 **Plantilla completa:** el `CLAUDE.md` de `mi-video` es la versión completa y probada (formatos, rutas de herramientas, rendimiento de Whisper, tabla de herramientas). Cópialo como punto de partida en cada proyecto nuevo, junto con `scripts/herramientas.json`.

### ffmpeg completo (no el de Remotion)
Remotion trae su propio ffmpeg (`npx remotion ffmpeg`), pero es recortado: no incluye `ebur128` (medir LUFS) y sus `filter_complex` se rompen desde Git Bash. Instala el build completo una vez por PC:

```powershell
winget install --id Gyan.FFmpeg -e
```

- En **PowerShell** queda disponible como `ffmpeg` / `ffprobe`. **Git Bash no ve los alias de winget**: guarda la ruta completa en `scripts/herramientas.json` y úsala desde ahí.
- Incluye Intel Quick Sync (`h264_qsv`): en una notebook sin GPU dedicada codifica unas 4-5 veces más rápido que `libx264`. Úsalo para proxies y borradores; para la entrega final, `libx264 -crf 18`.
- Comandos útiles:
  ```bash
  ffmpeg -i x.wav -af ebur128=peak=true -f null -          # medir volumen (LUFS)
  ffmpeg -i x.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 y.wav  # normalizar para redes
  ffmpeg -i crudo.mp4 -vf scale=-2:1080,fps=30 -c:v h264_qsv -global_quality 23 -c:a aac proxy.mp4
  ```

### Música y efectos: Mixkit (Envato)
Banco gratuito de música y efectos de sonido. **Licencia:** uso comercial permitido (redes, YouTube monetizado, anuncios), **sin atribución obligatoria**. No se puede revender el tema suelto ni registrarlo o reclamarlo como propio (Content ID).

Se integra con el script `scripts/mixkit.mjs` (copia maestra en `C:\Videos\_herramientas\mixkit.mjs`), sin dependencias:

```bash
node scripts/mixkit.mjs buscar mood:uplifting        # también genero:corporate, tag:motivational o texto libre
node scripts/mixkit.mjs buscar --sfx whoosh          # efectos de sonido
node scripts/mixkit.mjs bajar 1167                   # descarga UN tema → public/biblioteca/musica/mixkit/
node scripts/mixkit.mjs bajar 1492 --sfx             # descarga UN efecto → public/biblioteca/sfx/mixkit/
```

- Los resultados quedan en `tmp/mixkit-busqueda.json`: Claude lee ese JSON (texto barato), no el HTML del sitio.
- Lo bajado queda en la **biblioteca compartida** (`public/biblioteca/`) para reutilizarlo; para un trabajo se prepara una copia recortada y normalizada en `public/trabajos/<ID>/audio/`.
- Cada descarga se anota en `public/biblioteca/LICENCIAS-mixkit.json` (título, autor, fuente, licencia y fecha). Ese archivo **sí** se versiona en git.
- ⚠️ Los términos de Mixkit **prohíben descargas masivas con scripts**. El script solo permite 1 búsqueda o 1 descarga por ejecución, siempre de temas elegidos.
- Pedido típico: *"buscá en Mixkit 3 opciones de música alegre y corporativa de menos de 2 minutos para la historia; proponémelas antes de bajar"*.

### Tabla "qué herramienta usar" (va dentro de `CLAUDE.md`)
Así Claude decide solo con qué hacer cada tarea, sin preguntar ni explorar. Va en `CLAUDE.md` (no en un archivo aparte) porque se carga automáticamente; mantenla corta, porque se carga en **todas** las sesiones.

```markdown
## Regla principal
Todo pedido de video se resuelve primero con la suite instalada en este proyecto (Remotion, ffmpeg, whisper.cpp, DeepFilterNet, MediaPipe, Google Fonts, Mixkit), eligiendo la herramienta según la tabla "Qué herramienta usar". Remotion es el eje de la composición, pero no la única opción: cada tarea va con la herramienta que mejor la resuelve. Servicios externos (ChatCut, generación con IA, etc.) solo si la suite no puede hacerlo, y preguntando antes.

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
| Reencuadre, subtítulos, títulos, gráficos, transiciones, ducking, render | Remotion |
| Tipografías | `@remotion/google-fonts` |
| Música de fondo | 1º Mixkit (`scripts/mixkit.mjs` → biblioteca → preparada en `public/trabajos/<ID>/audio/`); 2º música compuesta por código |
| Efectos de sonido (whoosh, click, pop, transiciones) | Mixkit `--sfx` → `public/biblioteca/sfx/mixkit/` |
| Recortar música a la duración del video, fundidos | Remotion `<Audio trimBefore volume>` o ffmpeg `atrim`/`afade` + `loudnorm` |
| Voz IA, avatar, doblaje, música generada, stock | ChatCut (preguntar antes: consume créditos) |
| Duda entre dos opciones | la más rápida y barata en tokens; si afecta la calidad final, preguntar |
```

### Organización por trabajos: `public/`, `out/` y `src/`
Remotion compone el video en el navegador, que **no puede acceder a rutas absolutas del disco** (`C:\Videos\...`): todo lo que usa el video va dentro de `public/`. Para repetir trabajos parecidos sin mezclar material, cada pedido es un **trabajo** con ID `AAAA-MM-DD_cliente_pieza`, y ese ID se repite en todas las carpetas:

```
C:\Videos\crudos\<ID>\          ← originales (4K, etc.), FUERA del proyecto, nunca se tocan
C:\Videos\archivo\<ID>\         ← material de trabajos cerrados

public/
├── marcas/<cliente>/           ← kit de marca: logo, fotos institucionales, tipografías (se reutiliza)
├── biblioteca/                 ← música y efectos de Mixkit ya bajados (se reutiliza)
└── trabajos/<ID>/
    ├── crudos/                 ← proxies livianos (1080p, 30 fps) hechos con ffmpeg
    ├── audio/                  ← música preparada, voz limpia, efectos
    ├── img/                    ← imágenes propias del trabajo
    └── datos/                  ← transcripcion.json, clips.json, encuadre.json

out/<ID>/
├── revision/                   ← hojas de contacto, stills, borradores rápidos
└── final/                      ← entregas: <pieza>_<formato>_v<N>.mp4 (nunca se sobrescriben)

src/
├── marcas/<cliente>/marca.ts   ← colores, tipografía, curvas, logo
├── plantillas/                 ← HistoriaMarca, … + comunes/piezas.tsx
└── trabajos/<ID>/              ← TRABAJO.md (brief, decisiones, entregas) + composiciones.ts
```

En el código se usa siempre `staticFile()` con ruta relativa a `public/`:
```tsx
<OffthreadVideo src={staticFile("trabajos/2026-10-02_rastro_clips-charla/crudos/charla.mp4")} />
<Img src={staticFile("marcas/rastro/logo.png")} />
```

- **Comandos de Claude Code** (en `.claude/commands/`): `/nuevo-trabajo <cliente> <pieza> [crudos] [brief]` crea todo lo anterior, la ficha `TRABAJO.md` y los proxies; `/cerrar-trabajo <ID>` verifica las entregas, completa la ficha y archiva el material pesado.
- ⚠️ **Remotion copia TODO `public/` en cada render**: si se acumulan crudos de muchos trabajos, cada render se vuelve más lento. Por eso los originales viven fuera del proyecto y los trabajos cerrados se archivan.
- **Trabajos repetidos:** se reutiliza la plantilla y solo cambian los datos (textos, imágenes, duraciones, música). Ver `src/trabajos/2026-09-28_rastro_historia-ig/composiciones.ts` como ejemplo.
- **Al pedirle algo a Claude**, nombrá el trabajo y el archivo exacto ("en `2026-10-02_rastro_clips-charla`, usá `crudos/charla.mp4` desde el segundo 3").

### `.gitignore`: no versionar el material pesado
Se versionan el código, los datos JSON, las marcas y el registro de licencias; no los crudos, audios ni renders:

```gitignore
out
tmp/
public/trabajos/*/crudos/*
public/trabajos/*/audio/*
public/trabajos/*/img/*
!public/trabajos/*/*/.gitkeep
public/biblioteca/**/*.*
!public/biblioteca/**/.gitkeep
!public/biblioteca/LICENCIAS-mixkit.json
```

Si necesitas versionar esos archivos, usa **Git LFS** en lugar de subirlos directamente al repositorio.

### Skills oficiales de Remotion
Remotion publica skills para agentes de IA que le enseñan a Claude las APIs correctas y evitan errores de uso. Consulta la documentación de Remotion (sección de IA / Claude Code) para el comando de instalación vigente.

---

## 1. El Lenguaje de la Animación: Matemáticas vs. Adjetivos

"Hazlo más dinámico" o "que se vea bonito" son instrucciones ambiguas que generan varias rondas de corrección. Las instrucciones deben traducirse a **tiempo (frames)** y **espacio (píxeles, escalas, opacidad)** utilizando las funciones de Remotion (`interpolate`, `spring`, `Easing`).

### ❌ Ejemplos de Prompts Genéricos (Qué NO hacer)
* "Haz que el texto aparezca suavemente al principio."
* "Que el logo entre rebotando de forma dinámica."
* "Mueve la caja a la derecha después de un rato."
* "Haz que la salida del video sea más rápida."

### ✅ Ejemplos de Prompts Matemáticos (Qué SÍ hacer)
* **Aparición suave:** "Interpola la opacidad del texto de 0 a 1 entre el frame 0 y el frame 30, con `extrapolateRight: 'clamp'`."
* **Rebote del logo:** "Aplica `spring({ frame: frame - 15, fps, config: { mass: 0.5, damping: 10 } })` y úsalo como `transform: scale` del logo."
* **Movimiento retrasado:** "Mueve el contenedor (`translateX`) de -200px a 0px entre los frames 45 y 75 usando `interpolate(frame, [45, 75], [-200, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })`."
* **Salida controlada:** "En los últimos 20 frames de la composición (usa `useVideoConfig().durationInFrames`), interpola el `scale` de 1 a 0 con `Easing.out(Easing.exp)` y clamp en ambos extremos."

### ⚠️ Errores conceptuales comunes (evítalos en tus prompts)
* `extrapolateRight: 'clamp'` es una opción de **`interpolate`**, no de `spring`.
* Un `spring` **no termina en un frame concreto** por sí solo: se asienta según su física. Si necesitas que dure exactamente N frames, pásale `durationInFrames: N`.
* Para retrasar un `spring`, desplaza el frame: `frame: frame - 15` (o envuelve el componente en `<Sequence from={15}>`).
* Para animar varias propiedades con un mismo `spring`, genera un valor de 0 a 1 y mapéalo con `interpolate(s, [0, 1], [desde, hasta])`.

---

## 2. Aislamiento de Contexto

Claude Code no carga todo el proyecto en cada mensaje: lee archivos según los necesita. Si no le dices cuál es, **gastará tokens buscando** (listar carpetas, buscar texto, leer varios archivos candidatos).

* **Incorrecto:** "Arregla el texto del video."
* **Correcto:** "En `src/components/Titulo.tsx`, cambia el rango del `interpolate` de opacidad a [10, 40]."

---

## 3. Gestión de Memoria y Tokens

Cada mensaje nuevo reenvía el historial de la conversación: cuanto más larga, más cara es cada respuesta y peor su calidad.

### Ciclo recomendado
1. Trabaja en **un solo componente** a la vez.
2. **Agrupa los cambios** en un único mensaje ("cambia A, B y C") en lugar de tres mensajes separados.
3. Cuando el componente esté terminado, ejecuta **`/clear`** y pasa al siguiente con el historial limpio.

### `/clear` vs `/compact`
| Comando | Qué hace | Coste | Cuándo usarlo |
|---|---|---|---|
| `/clear` | Borra todo el historial | Ninguno | Al pasar a un componente o tarea independiente |
| `/compact` | Resume el historial y continúa | Consume tokens para generar el resumen | Cuando necesitas mantener la continuidad de una tarea larga |

### Los micro-ajustes, hazlos tú
Pedirle a Claude "cambia el frame 10 por 15" es la forma más cara de editar un número.
* Pide que los valores de animación queden como **constantes al inicio del archivo** (o como props del componente).
* Ajústalos tú a mano en el editor o en el panel de props de **Remotion Studio** (`npx remotion studio`): coste cero en tokens y vista previa instantánea.

### Verificación visual barata
Claude Code puede leer imágenes. En lugar de describir lo que ves o renderizar el video completo:
* Pide: "Genera un still del frame 30 con `npx remotion still ...` y revisa que el logo esté centrado."
* Un still de un frame concreto es mucho más barato que un render completo o que varias rondas de corrección a ciegas.
* Evita que Claude lea logs largos de render; pide solo las líneas de error.

### Elige el modelo adecuado
* Estructura inicial y animaciones complejas: modelo más potente.
* Ajustes pequeños y cambios mecánicos: un modelo más ligero (cámbialo con `/model`).

---

## 4. Plantilla de Prompt Ideal para Remotion

Cuando pidas un componente nuevo o una animación desde cero, utiliza esta estructura:

> **Archivo a modificar:** `[Ruta del archivo]`
> **Estado inicial:** `[Ej. Fuera de pantalla, scale 0, opacidad 0]`
> **Rango de tiempo:** `[Ej. Entre el frame 10 y el 30]`
> **Física/Interpolación:** `[Ej. spring con damping 12, o interpolate con Easing.out]`
> **Estado final:** `[Ej. Centro de pantalla, scale 1, opacidad 1]`
> **Verificación:** `[Ej. Still del frame 30]`

**Ejemplo listo para usar:**
> "Crea `src/components/LogoRebote.tsx`. Usa `useCurrentFrame` y `useVideoConfig` (30 fps). Define al inicio las constantes `INICIO = 15`, `DURACION = 30`, `DAMPING = 12`. Calcula `const s = spring({ frame: frame - INICIO, fps, durationInFrames: DURACION, config: { damping: DAMPING } })`. Aplica opacidad = `interpolate(s, [0, 1], [0, 1])` y scale = `interpolate(s, [0, 1], [0.8, 1])`. Al terminar, genera un still del frame 45 y verifica que el logo se vea completo y centrado."
