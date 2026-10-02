# 2026-10-02_lucia_bloomie-volando-escoba-realista

| Campo | Valor |
|---|---|
| Cliente / marca | Lucía · marca Bloomie (`src/marcas/bloomie`) |
| Pieza | bloomie-volando-escoba-realista (Bloomie de bruja cruza volando en escoba la parte de arriba de la pantalla) |
| Estado | 🟢 Cerrado (2026-10-02) |
| Abierto | 2026-10-02 |
| Cerrado | 2026-10-02 |

## Brief
- **Objetivo:** Bloomie vestido de bruja vuela en su escoba de izquierda a derecha por la parte de **arriba** de la pantalla, como un auto de carreras: se lo escucha acercarse y alejarse con efecto Doppler bien marcado, y detrás va quedando una estela de humo levantada por la velocidad. Es la pareja de `2026-10-02_lucia_bloomie-corriendo` (misma idea, abajo y corriendo).
- **Formato(s):** capa con **fondo transparente** 9:16 1080×1920 · 30 fps
- **Duración:** 5 s, una sola pasada: 0–1 s se lo oye llegar fuera de cuadro, 1–3,5 s cruza, 3,5–5 s se aleja y el humo se deshace
- **Tono / estilo:** velocidad y humor de dibujo animado, Halloween
- **Textos obligatorios:** ninguno (confirmado el 2026-10-02)
- **Llamado a la acción:** —
- **Sonido:** auto de carreras que se acerca y se aleja con Doppler (mismo que la versión corriendo)
- **Entrega:** `out/2026-10-02_lucia_bloomie-volando-escoba-realista/final/`: `.mov` ProRes 4444 con alfa + respaldo croma `.mp4` + `.wav` del sonido

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-02_lucia_bloomie-volando-escoba-realista/bloomie_escoba_sprites.png`: hoja de sprites de 6×4 (1536×1024, fondo negro opaco), 24 dibujos de Bloomie de bruja (sombrero, capa violeta, anteojos) en la escoba. La pasó Lucía el 2026-10-02 como kit del personaje. No es un ciclo sino una actuación: vuela tranquilo, se recuesta y mira para arriba (6), se agacha aerodinámico (15-17) y vuelve
- **Proxies y material de trabajo:** `public/trabajos/2026-10-02_lucia_bloomie-volando-escoba-realista/` (crudos/, audio/, img/, datos/). Sin video crudo
- **Marca:** `public/marcas/bloomie/`. **Kit — escoba en sprites (2026-10-02):** `public/marcas/bloomie/sprites-escoba/f01.png … f24.png` (315×259, transparencia), cortados con el script genérico `scripts/cortar_sprites.py`: separa cada sprite por mancha conectada (las escobas se salen de su celda de la grilla, así que no se puede cortar en cuadros fijos), rellena los huecos negros (pupilas) y conserva la posición de cada dibujo dentro de su celda. Umbral de fondo 25 y borde opaco desde 60 (el sombrero es casi negro, ~RGB 52,37,57). Hoja de revisión: `out/2026-10-02_lucia_bloomie-volando-escoba-realista/revision/sprites_escoba.png`

## Guiones
- `guion_volando-escoba.md` (generar con `/guion 2026-10-02_lucia_bloomie-volando-escoba-realista`; aplicar cambios con `/aplicar-guion 2026-10-02_lucia_bloomie-volando-escoba-realista`)

## Decisiones
- **Plantilla:** `src/plantillas/SpriteCorriendo/SpriteCorriendo.tsx`, que ganó (2026-10-02) el modo `volando` (sin sombra ni inclinación, flota ±12 px cada 40 frames, estela de humo desde `humoDesde` = cerdas de la escoba) y `unaVez` (la hoja se pasa una sola vez durante el cruce, a 1 dibujo cada 3 frames). Los props nuevos son opcionales: `lucia-bloomie-corriendo` queda igual. Composición: `lucia-bloomie-volando-escoba` (borde de abajo del sprite en y=640, escala 1,4, entra f30, sale f105)
- **Humo:** 3 bocanadas por frame desde las cerdas, nacen visibles y pegadas a la escoba, crecen ×4, suben y ondulan; cada una vive 45 frames, así la última se deshace al final
- **Música:** — (sin música)
- **Sonido:** Fast car drive by (Mixkit 1538, sha256 `bd28537a22bc`, licencia en `public/biblioteca/LICENCIAS-mixkit.json`). `preparar_sonido.sh` (mismo calce que la versión corriendo: el cruce tiene los mismos tiempos) → `public/trabajos/2026-10-02_lucia_bloomie-volando-escoba-realista/audio/auto_doppler.wav`: estirado ×1,55 con rubberband, pico a ~2,1 s con Bloomie en el centro, paneo de izquierda a derecha, 5 s, -13,9 LUFS / -2,2 dBTP
- **Otras:** la capa sale con transparencia: render con `--codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png`. Croma de respaldo: azul `#0000ff` (el magenta choca con la capa violeta y el verde con los anteojos)

## Entregas
| Archivo (`out/2026-10-02_lucia_bloomie-volando-escoba-realista/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `bloomie-volando-escoba_9x16_v1.mov` + `bloomie-volando-escoba-croma_9x16_v1.mp4` + `bloomie-volando-escoba-sonido_v1.wav` | 2026-10-02 | Primera versión: ProRes 4444 con transparencia, 1080×1920, 30 fps, 5 s, una pasada arriba de izquierda a derecha con estela de humo; croma azul `#0000ff` de respaldo; auto con Doppler a -13,9 LUFS, pico -2,2 dBTP |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-02_lucia_bloomie-volando-escoba-realista/` desde `C:/Videos/archivo/2026-10-02_lucia_bloomie-volando-escoba-realista/` (si el trabajo está cerrado).
2. Sprites: `python scripts/cortar_sprites.py C:/Videos/crudos/2026-10-02_lucia_bloomie-volando-escoba-realista/bloomie_escoba_sprites.png public/marcas/bloomie/sprites-escoba out/2026-10-02_lucia_bloomie-volando-escoba-realista/revision/sprites_escoba.png` (Python del `.venv`).
3. Sonido: `bash src/trabajos/2026-10-02_lucia_bloomie-volando-escoba-realista/preparar_sonido.sh` (-13,9 LUFS). Si Mixkit cambió el 1538, usar la copia de `C:/Videos/archivo/2026-10-02_lucia_bloomie-volando-escoba-realista/biblioteca/`.
4. `npx remotion render src/index.ts lucia-bloomie-volando-escoba out/2026-10-02_lucia_bloomie-volando-escoba-realista/revision/tmp.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --audio-codec=pcm-16`, después muxear el `.wav` (`-c:v copy`) y el croma (`overlay` sobre `color=c=0x0000ff` → `libx264 -crf 18 -preset slow`).
