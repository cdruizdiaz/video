# 2026-10-01_lucia_bloomie-halloween

| Campo | Valor |
|---|---|
| Cliente / marca | Lucía · marca Bloomie (`src/marcas/bloomie`) |
| Pieza | bloomie-halloween (aparición de Bloomie para la sección de Halloween) |
| Estado | 🟢 Cerrado |
| Abierto | 2026-10-01 |
| Cerrado | 2026-10-02 |

## Brief
- **Objetivo:** Bloomie como identidad de un pilar de contenido (una sección fija) en los reels: una animación cortita que aparece en una esquina de arriba del reel y se va. Primera: **Halloween**. Bloomie, con la cara de bruja, entra volando en la escoba por una esquina de arriba, saluda o guiña y se va. Pedido de Lucía por WhatsApp el 2026-10-01: “puedo hacer que entre a la pantalla en una escoba voladora y se vaya, animación cortita por el momento”.
- **Formato(s):** capa con transparencia 1080×1920 · 30 fps, para poner encima de los reels. Dos versiones: esquina **izquierda** y **derecha**.
- **Duración:** 4 s volando · 3,6 s corriendo (entregado así; la duración no quedó confirmada con Lucía)
- **Tono / estilo:** alegre y travieso de Halloween, en el estilo de Bloomie. Estela de estrellitas (la plantilla también hace murcielaguitos o brillos)
- **Textos obligatorios:** — (ninguno)
- **Llamado a la acción:** —
- **Sonido:** efectos de Mixkit (whoosh + risita) en un `.wav` aparte, sincronizado con la animación, para que lo use o no
- **Entrega:** `out/2026-10-01_lucia_bloomie-halloween/final/`: `.mov` ProRes 4444 con alfa (Premiere / CapCut PC) + `.wav` de efectos

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-01_lucia_bloomie-halloween/` (fuera del proyecto). El personaje sale de `C:/Videos/crudos/2026-10-01_claudio_bloomie/Bloomie.ai`
- **Proxies y material de trabajo:** `public/trabajos/2026-10-01_lucia_bloomie-halloween/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/bloomie/` (kit creado el 2026-10-01): `Bloomie.ai` (copia del original), `personaje.json` (cuerpo de frente y de perfil, 12 caras: normal, feliz, preocupado, guiño, enojado, triste, enamorado, birrete, Navidad, reno, murciélago, bruja; boca para hablar; escoba suelta) y `logo.png` (Bloomie de frente con transparencia). Código: `src/marcas/bloomie/marca.ts` (paleta, Fredoka, lista de caras) y `extraer_personaje.py` para regenerarlo. Hoja de revisión: composición `lucia-bloomie-kit-hoja` → `out/2026-10-01_lucia_bloomie-halloween/revision/kit_hoja.png`
- **Kit — carrera (2026-10-01):** el perfil de `personaje.json` ahora trae sus partes separadas (`perfilPartes`: pie, cuerpo, hoja, mano, cabeza, ojo, pétalos, lentes) y el sombrero de bruja suelto (`accesorios.sombrero`). `src/marcas/bloomie/carrera.ts`: articulaciones y **8 poses clave** del ciclo de carrera (contacto → bajada → impulso → vuelo, con cada pierna), ciclo de 18 frames, disfraz de bruja de perfil (lentes verdes + sombrero) y escoba en la mano. `BloomieCorriendo.tsx` lo dibuja. Hoja de revisión: composición `lucia-bloomie-kit-carrera` → `out/2026-10-01_lucia_bloomie-halloween/revision/kit_carrera.png` (poses normal y bruja + los 18 dibujos del ciclo)

## Guiones
- `guion_halloween.md` (3 escenas, 4 s): versión volando, esquinas izquierda/derecha.
- `guion_halloween-corre.md` (3 escenas, 3,6 s): versión corriendo de izquierda a derecha. Otros: generar con `/guion 2026-10-01_lucia_bloomie-halloween`; aplicar cambios con `/aplicar-guion 2026-10-01_lucia_bloomie-halloween`)

## Decisiones
- **Plantilla:** nueva `src/plantillas/AparicionBloomie/AparicionBloomie.tsx` sobre `PersonajeAnimado`. Props: `lado` (izquierda/derecha, espejo), `cara` (cualquiera del kit), `escoba`, `estela` (estrellas/murcielagos/brillos/ninguna) y `efectos`. Para otra ocasión se cambia solo eso (p. ej. Navidad: `cara: "navidad"`, `escoba: false`, `estela: "brillos"`). Composiciones: `lucia-bloomie-halloween-izq` / `-der`.
- **Plantilla corriendo (2026-10-01):** nueva `src/plantillas/CarreraBloomie/CarreraBloomie.tsx` sobre el rig genérico `PersonajeAnimado/Carrera.tsx` (`PersonajeCorriendo` + `poseCarrera`, Catmull-Rom cíclico entre poses clave). La fase del ciclo sale de la distancia recorrida y el pie apoyado se mueve en línea recta: no patina. Realismo: tronco que sube/baja, aplastado al pisar y estirado al impulsarse, inclinación hacia adelante, pétalos con atraso, brazos opuestos a las piernas, lado de atrás sombreado, polvito en cada pisada, sombra que se achica en el vuelo, líneas de velocidad. Props: `disfraz`, `escoba`, `estela`, `piso`, `efectos` (con `duracion` se repiten en bucle). Composición: `lucia-bloomie-halloween-corre`.
- **Guiño:** `Personaje` ganó `guino` (cierra solo el ojo derecho). Los anteojos de la bruja tienen un hueco en la pupila: al cerrar se tapa con un párpado verde (`parpados` en `personaje.json`).
- **Música:** — (sin música)
- **Efectos (Mixkit)** (id · sha256): cinematic whoosh fast transition (1492 · `02b8cd40b376`) al entrar y al salir, small cartoon character laughing (739 · `7559e62e952f`) al saludar. Versión corriendo: cartoon insect running fast (37 · `677a82c5aeb4`) en bucle + la risita (739). Licencia libre de Mixkit (uso comercial, sin atribución); registro en `public/biblioteca/LICENCIAS-mixkit.json`; originales archivados en `C:/Videos/archivo/2026-10-01_lucia_bloomie-halloween/biblioteca/`.
- **LUFS medidos al cerrar (ebur128):** volando `.mov` izq/der -13,9 (pico -1,1 dBFS), croma izq/der -13,9, efectos -13,8; corriendo `.mov` -14,2 (pico -1,8 dBFS), croma -14,3, efectos -14,2.
- **Otras:** la capa sale con transparencia: render con `--codec=prores --prores-profile=4444 --pixel-format=yuva444p10le` y fondo transparente.

## Entregas
| Archivo (`out/2026-10-01_lucia_bloomie-halloween/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `halloween-izq_9x16_v1.mov` / `halloween-der_9x16_v1.mov` | 2026-10-01 | Primera versión según `guion_halloween.md`. ProRes 4444 con transparencia, 1080×1920, 30 fps, 4 s, con los efectos (-13,8 LUFS) |
| `halloween-izq-croma_9x16_v1.mp4` / `halloween-der-croma_9x16_v1.mp4` | 2026-10-01 | Respaldo para editores sin transparencia (CapCut celular, Instagram): fondo magenta `#ff00ff` para quitar con croma (no verde: los anteojos de la bruja son verdes) |
| `halloween-efectos_v1.wav` | 2026-10-01 | Solo los efectos (whoosh + risita + whoosh), -13,8 LUFS, sincronizados con la animación |
| `halloween-corre_9x16_v1.mov` + `halloween-corre-croma_9x16_v1.mp4` + `halloween-corre-efectos_v1.wav` | 2026-10-02 | Primera versión corriendo según `guion_halloween-corre.md`: ProRes 4444 con transparencia, 1080×1920, 30 fps, 3,6 s; croma magenta de respaldo; efectos (pasitos + risita) a -14,2 LUFS, pico -1,8 dBTP |

## Cómo rehacerlo
1. Este trabajo no tiene material propio en `public/` (usa el kit `public/marcas/bloomie/` y los efectos de `public/biblioteca/sfx/mixkit/`). Si faltan efectos, copiarlos desde `C:/Videos/archivo/2026-10-01_lucia_bloomie-halloween/biblioteca/` y verificar con `node scripts/mixkit.mjs verificar`. Entregas archivadas en `C:/Videos/archivo/2026-10-01_lucia_bloomie-halloween/final/`.
2. Personaje: `C:/Videos/_herramientas/.venv/Scripts/python.exe src/marcas/bloomie/extraer_personaje.py` → `public/marcas/bloomie/personaje.json` (ya está en el kit).
3. Video con alfa (composiciones `lucia-bloomie-halloween-izq`, `-der`, `-corre`):
   `npx remotion render src/index.ts lucia-bloomie-halloween-<izq|der|corre> out/2026-10-01_lucia_bloomie-halloween/revision/tmp_<pieza>.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --audio-codec=pcm-16`
4. Audio: `loudnorm=I=-14:TP=-1.5:LRA=11` a `halloween-efectos_vN.wav` (en la versión corriendo, 3,6 s, `loudnorm` se queda en -19 LUFS: usar `acompressor=threshold=-24dB:ratio=4:attack=2:release=60,volume=17dB,aresample=192000,alimiter=limit=0.78:level=false:attack=0.5:release=30,aresample=48000`) y volver a muxearlo en el `.mov` (`-c:v copy`). Verificar con `ebur128`.
5. Croma de respaldo: `overlay` del `.mov` sobre `color=c=0xff00ff:s=1080x1920` → `libx264 -crf 18 -preset slow` (+ el `.wav` en AAC).
