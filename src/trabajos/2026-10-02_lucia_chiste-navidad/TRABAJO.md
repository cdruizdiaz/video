# 2026-10-02_lucia_chiste-navidad

| Campo | Valor |
|---|---|
| Cliente / marca | Lucía · marca Bloomie (`src/marcas/bloomie`; personaje de la biblioteca `personajes/bloomie`) |
| Pieza | chiste-navidad ("Bloomie busca papel en Navidad") |
| Estado | 🟢 Cerrado |
| Abierto | 2026-10-02 |
| Cerrado | 2026-10-02 |

## Brief
- **Objetivo:** chiste animado de Navidad con Bloomie, hecho con el sistema de rig (`src/rig/`). Bloomie quiere ser parte de la Navidad: prueba ser Father Christmas (no tiene panza suficiente), prueba ser reno (se cae: "Reindeer don't have petals") y termina siendo la estrella del arbolito. Remate: "I'm a bloomin' star!" (juego de palabras con *bloomin'* / bloom / Bloomie).
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Duración:** 40 s (los tiempos del guion se ajustan al audio real)
- **Idioma:** solo inglés británico (sin versión en castellano: el remate *bloomin'* no se traduce)
- **Tono / estilo:** chiste tierno; estilo de Bloomie. Fondo: noche nevada ilustrada (cielo azul noche, luna, estrellitas, piso nevado, nieve cayendo).
- **Textos obligatorios:** las 5 frases de Bloomie, en globos de historieta con las palabras apareciendo al decirlas (Whisper + `@remotion/captions`), Fredoka, globo con "pop", contorno grueso y colita que sigue la boca; sin tapar cara ni accesorios. Onomatopeya "PLOP!" en un sticker de historieta aparte.
- **Llamado a la acción:** —
- **Audio:** voz Piper en_GB (jenny_dioco, elegida por Lucía entre alba, jenny_dioco y cori) con el tono subido (voz de nene, como en 2026-10-01_claudio_bloomie); música navideña de Mixkit con ducking bajo la voz; efectos de Mixkit (whoosh, plop, pasitos, destello); mezcla final -14 LUFS.
- **Agregar:** bocas para lip sync (el rig ya tiene 6 sintéticas; mostrar hoja antes de usarlas); arbolito, estrella/destello y nieve como piezas reutilizables.
- **Entrega:** `out/2026-10-02_lucia_chiste-navidad/final/`: MP4 final + ProRes 4444 con transparencia (solo Bloomie y los globos) para Premiere y CapCut.
- **Proceso pedido:** revisar el rig, preguntar, presentar plan + hoja de contacto con un cuadro clave por escena y esperar aprobación antes de renderizar.

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-02_lucia_chiste-navidad/` (vacía: no hay material crudo)
- **Personaje:** biblioteca `public/personajes/bloomie/` (piezas.json + rig.json, de `C:/Videos/personajes/bloomie/Bloomie.ai`)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-02_lucia_chiste-navidad/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/bloomie/`

## Guiones
- `guion_chiste-navidad.md` (5 escenas, 40 s; guion de Lucía). Aplicar cambios con `/aplicar-guion 2026-10-02_lucia_chiste-navidad`.

## Decisiones
- **Composición:** `ChisteNavidad.tsx` (rig de Bloomie con `poseEn` de la plantilla `PersonajeRig` + piezas nuevas reutilizables: `src/plantillas/Navidad/escena.tsx` — noche nevada, nieve, arbolito, estrella, destello — y `src/plantillas/comunes/historieta.tsx` — globo con `@remotion/captions` y sticker de onomatopeya). Composiciones `lucia-chiste-navidad-40s` y `lucia-chiste-navidad-alfa` (`soloPersonaje`: Bloomie, globos, sticker PLOP y destello sobre transparente, con el audio completo).
- **Rig (mejoras generales hechas para este trabajo):** disfraz sobre cualquier expresión (`disfraz`, `disfrazY`: gorro de Navidad corrido 16 pt para que tape un poco los ojos; reno = anteojos con astas + nariz), mirada (pupilas), `puntoPersonaje` (boca/ojos en pantalla para la colita del globo y el destello), nariz y lágrima separadas de la boca en la extracción.
- **Voz:** Piper `en_GB-jenny_dioco-medium`, tono ×1,35 (rubberband), una frase por archivo a -14 LUFS (`preparar_voz.sh`); Whisper sobre las 6 frases juntas (`voz_todas.wav`) y `separar_frases.mjs` → `datos/frases.json` (tiempos por palabra desde `dtwMs`: en esta pista `fromMs/toMs` venían corridos). Lip sync con las 6 bocas sintéticas (hoja `revision/hoja_bocas.png`, aprobada).
- **Tiempos reales (frames a 30 fps):** frases en 24, 262, 462, 604, 782 y 1052; giros 150, 420 y 694; despega 535 y PLOP 562; arbolito entra 720–760; camina 850–922; sube a la punta 924–968; destello 1034; risa 1165.
- **Música:** Mixkit "Christmas Jokes" (id 1021, Michael Ramir C., sha256 `80fe58869520`; licencia libre de Mixkit: uso comercial, sin atribución), tramo 27,0–67,0 s (el cierre real cae al final), fundido de entrada 1 s (`preparar_audio.sh`); ducking en Remotion: 0,45 de fondo y ×0,3 mientras habla (≈ 17 dB bajo la voz).
- **Efectos (Mixkit)** (id · sha256): whoosh 1492 · `02b8cd40b376` (giros, arbolito, salto a la punta); cartoon falling whistle 395 · `e7d5268140d1` (caída); soft quick punch 2151 · `d77ec3d56eab` ("plop"); footsteps on the snow 539 · `61a47a33b151` (pasitos); magic wand sparkle 3062 · `6b7938d7c408` (destello); magic festive melody 2986 · `490ec437ca00` (acento final). Al registro de licencias le faltan algunos títulos (bajados sin búsqueda previa).
- **Mezcla:** ganancia general 0,6 en Remotion para que la suma no sature (el borrador pegaba en 0 dBFS); el render (-21,8 LUFS) se normaliza con `loudnorm` en dos pasadas y el mismo audio va a las dos entregas (video copiado sin recodificar).

## Entregas
| Archivo (`out/2026-10-02_lucia_chiste-navidad/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `chiste-navidad_9x16_v1.mp4` | 2026-10-02 | Primera versión según `guion_chiste-navidad.md`: 40 s, 1080×1920, 30 fps, -14,0 LUFS (pico -1,4 dBFS). Borrador previo aprobado (`revision/borrador_v1.mp4`) |
| `chiste-navidad-alfa_9x16_v1.mov` | 2026-10-02 | ProRes 4444 con transparencia (Bloomie, globos, PLOP y destello) para Premiere / CapCut, con el mismo audio: -13,9 LUFS (pico -1,5 dBFS) |

## Cómo rehacerlo
1. Restaurar el audio: copiar `C:/Videos/archivo/2026-10-02_lucia_chiste-navidad/public/` sobre `public/trabajos/2026-10-02_lucia_chiste-navidad/` (frases, `voz_todas.wav`, `musica_40s.wav`; `datos/` queda en el repo). Originales de Mixkit en `…/biblioteca/` (verificar con `node scripts/mixkit.mjs verificar`). Entregas en `…/final/`. O regenerar:
   - Voz: `bash src/trabajos/2026-10-02_lucia_chiste-navidad/preparar_voz.sh` (Piper + Whisper + `separar_frases.mjs`; si cambian las duraciones, revisar `INICIO_FRASE` en `ChisteNavidad.tsx`).
   - Música: `bash src/trabajos/2026-10-02_lucia_chiste-navidad/preparar_audio.sh`.
2. Render:
   - `npx remotion render src/index.ts lucia-chiste-navidad-40s out/2026-10-02_lucia_chiste-navidad/revision/tmp_40s.mp4 --crf=18`
   - `npx remotion render src/index.ts lucia-chiste-navidad-alfa out/2026-10-02_lucia_chiste-navidad/revision/tmp_alfa.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png`
3. Mezcla a -14 LUFS: medir `tmp_40s.mp4` con `loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json`, segunda pasada con los valores medidos y `linear=true` a `mezcla_14lufs.wav`, y muxear ese audio en las dos (`-c:v copy`; AAC 320k en el `.mp4`, PCM en el `.mov`) como `_vN` en `final/`. Verificar con `ebur128`.
