# 2026-10-02_lucia_bloomie-corriendo

| Campo | Valor |
|---|---|
| Cliente / marca | Lucía · marca Bloomie (`src/marcas/bloomie`) |
| Pieza | bloomie-corriendo (Bloomie cruza corriendo la parte de abajo de la pantalla) |
| Estado | 🟢 Cerrado (2026-10-02) |
| Abierto | 2026-10-02 |
| Cerrado | 2026-10-02 |

## Brief
- **Objetivo:** Bloomie corre de izquierda a derecha por la parte de **abajo** de la pantalla, como un auto de carreras: se lo escucha acercarse y alejarse con efecto Doppler bien marcado, y detrás va quedando una estela de tierra levantada por la velocidad.
- **Formato(s):** capa con **fondo transparente** 9:16 1080×1920 · 30 fps
- **Duración:** **5 s, una sola pasada** (Lucía pidió 15 s; el 2026-10-02 se bajó a 4-5 s con una sola pasada). Reparto: 0–1 s se lo oye llegar fuera de cuadro, 1–3,5 s cruza, 3,5–5 s se aleja y la tierra se asienta
- **Tono / estilo:** velocidad y humor de dibujo animado: una florcita que suena como un auto de carreras
- **Textos obligatorios:** — (⚠️ confirmar)
- **Llamado a la acción:** —
- **Sonido:** auto de carreras que se acerca y se aleja, con Doppler (subida y bajada de tono + paneo de izquierda a derecha). 1º Mixkit `--sfx` (un “race car pass by”); si no alcanza, Doppler armado con ffmpeg sobre un motor (`asetrate`/`rubberband` + `volume` + paneo). `.wav` aparte además del que va dentro del `.mov`
- **Entrega:** `out/2026-10-02_lucia_bloomie-corriendo/final/`: `.mov` ProRes 4444 con alfa + respaldo croma magenta `.mp4` + `.wav` del sonido

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-02_lucia_bloomie-corriendo/bloomie_carrera_sprites.png`: hoja de sprites de 6×4 (1536×1024, fondo negro opaco), 24 cuadros del ciclo de carrera de Bloomie de 3/4 mirando a la derecha (anteojos, gotita de sudor, ceño decidido). La pasó Lucía el 2026-10-02 como kit del personaje
- **Proxies y material de trabajo:** `public/trabajos/2026-10-02_lucia_bloomie-corriendo/` (crudos/, audio/, img/, datos/). Sin video crudo
- **Marca:** `public/marcas/bloomie/`. **Kit — carrera en sprites (2026-10-02):** `src/marcas/bloomie/cortar_sprites_carrera.py` corta la hoja en `public/marcas/bloomie/sprites-carrera/f01.png … f24.png` (213×234, transparencia, misma caja para todos; fondo quitado por relleno desde el borde, así quedan las pupilas negras). Hoja de revisión: `out/2026-10-02_lucia_bloomie-corriendo/revision/sprites_carrera.png`
  - ⚠️ Los cuadros son chicos (213×234): a más de ~1,5× se van a ver blandos. Si Lucía tiene la hoja en mayor resolución, conviene usarla (mismo script)
  - Los pies varían entre y=221 y y=232 según el cuadro: es el rebote del ciclo, se respeta

## Guiones
- `guion_corriendo.md` (generar con `/guion 2026-10-02_lucia_bloomie-corriendo`; aplicar cambios con `/aplicar-guion 2026-10-02_lucia_bloomie-corriendo`)

## Decisiones
- **Plantilla:** nueva `src/plantillas/SpriteCorriendo/SpriteCorriendo.tsx` (2026-10-02): ciclo de sprites en bucle + cruce a velocidad constante + inclinación y temblor por la velocidad + tierra levantada (nubes desenfocadas que quedan donde nacieron, suben, se agrandan y se asientan) + piedritas + sombra. Reutilizable para cualquier personaje en sprites. `CarreraBloomie` no servía: arma el personaje con vectores de perfil. Composición: `lucia-bloomie-corriendo` (piso y=1640, escala 1,5, entra f30, sale f105, 1 sprite por frame)
- **Música:** — (sin música)
- **Sonido:** Fast car drive by (Mixkit 1538, sha256 `bd28537a22bc`, licencia libre de Mixkit registrada en `public/biblioteca/LICENCIAS-mixkit.json`). `preparar_sonido.sh` → `public/trabajos/2026-10-02_lucia_bloomie-corriendo/audio/auto_doppler.wav`: estirado ×1,55 con rubberband (mismo tono, el Doppler dura más), pico corrido a ~2,1 s (Bloomie en el centro), paneo de izquierda a derecha siguiendo su posición, 5 s con fundidos, -13,9 LUFS / -2,2 dBTP
- **Tierra:** bocanadas en cada pisada (cada 12 cuadros del ciclo) + polvo fino continuo; cada nube vive 45 frames, así la última se deshace justo en f150 y el cuadro termina vacío
- **Otras:** la capa sale con transparencia: render con `--codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png`. Croma magenta `#ff00ff` (Bloomie es naranja; el verde también serviría)

## Entregas
| Archivo (`out/2026-10-02_lucia_bloomie-corriendo/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `bloomie-corriendo_9x16_v1.mov` + `bloomie-corriendo-croma_9x16_v1.mp4` + `bloomie-corriendo-sonido_v1.wav` | 2026-10-02 | Primera versión: ProRes 4444 con transparencia, 1080×1920, 30 fps, 5 s, una pasada abajo de izquierda a derecha con tierra levantada; croma magenta de respaldo; auto con Doppler a -13,9 LUFS, pico -2,2 dBTP |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-02_lucia_bloomie-corriendo/` desde `C:/Videos/archivo/2026-10-02_lucia_bloomie-corriendo/` (si el trabajo está cerrado).
2. Sprites (ya están en el kit `public/marcas/bloomie/sprites-carrera/`; solo si hay que regenerarlos): `python src/marcas/bloomie/cortar_sprites_carrera.py` (Python del `.venv`). Si Mixkit cambió el 1538, usar la copia de `C:/Videos/archivo/2026-10-02_lucia_bloomie-corriendo/biblioteca/`.
3. Sonido: `bash src/trabajos/2026-10-02_lucia_bloomie-corriendo/preparar_sonido.sh` → `audio/auto_doppler.wav` (-13,9 LUFS).
4. `npx remotion render src/index.ts lucia-bloomie-corriendo out/2026-10-02_lucia_bloomie-corriendo/revision/tmp.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --audio-codec=pcm-16`
5. Con el ffmpeg completo: `cp public/trabajos/2026-10-02_lucia_bloomie-corriendo/audio/auto_doppler.wav out/.../final/bloomie-corriendo-sonido_vN.wav`; `ffmpeg -i tmp.mov -i bloomie-corriendo-sonido_vN.wav -map 0:v -map 1:a -c:v copy -c:a pcm_s16le bloomie-corriendo_9x16_vN.mov`; croma: `ffmpeg -f lavfi -i color=c=0xff00ff:s=1080x1920:r=30 -i bloomie-corriendo_9x16_vN.mov -filter_complex "[0][1:v]overlay=shortest=1,format=yuv420p" -map 1:a -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 192k bloomie-corriendo-croma_9x16_vN.mp4`.
