# 2026-10-04_claudio_bloomie-rock

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (prueba) · personaje Bloomie (`src/marcas/bloomie`) |
| Pieza | Bloomie bailando rock |
| Estado | 🟢 Cerrado (2026-10-06) |
| Abierto | 2026-10-04 |
| Cerrado | 2026-10-06 |

## Brief
- **Objetivo:** video de prueba de Bloomie en 3D bailando rock, con el kit rock del diseñador.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** 3D (Blender Eevee, modelo desde el rig: `/personaje-3d`)
- **Luz de la escena:** escenario, luz de arriba apenas desde la izquierda (115°)
- **Duración:** 8 s (240 cuadros = 16 pulsos a 120 bpm)
- **Tono / estilo:** divertido, infantil, rockero
- **Entrega:** `out/2026-10-04_claudio_bloomie-rock/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-04_claudio_bloomie-rock/kit_rock.png` (hoja "BLOOMIE · KIT ROCK" del diseñador: guitarra frente/perfil, correa, anteojos, manos cuernos, pañuelo, 4 caras)
- **Recortes:** `public/trabajos/<ID>/img/*.png` (`recortar_kit.py`; posiciones de las cruces de apoyo en `datos/kit.json`) y la cara animada `img/cara/f000…f239.png` (`caras_rock.py`)
- **Música:** `audio/rock_8s.wav` (`preparar_musica.sh`)

## Guiones
- `guion_bloomie-rock.md`

## Decisiones
- **Plantilla:** propia (`BloomieRock.tsx`: escenario + capa de Blender + música).
- **Música:** Mixkit 49 "Rock the Game" (Ahjay Stelino), Mixkit Stock Music Free License (uso comercial, sin atribución), sha256 `6ee768f33c21…` (`LICENCIAS-mixkit.json`; original archivado en `C:/Videos/archivo/<ID>/biblioteca/`); tramo 64,157–72,157 s (el de más energía, empieza en compás), -13,9 LUFS.
- **Coreografía:** `datos/coreografia.json` es la fuente de los tiempos (caras, baile, cuernos, salto, accesorios) → `armar_escena.mjs`.
- **Kit:** la guitarra, el pañuelo y la mano de cuernos van como "tarjetas" (planos con la imagen) pegadas a los huesos dentro de la escena 3D (`tarjetas` en `scripts/blender/render.py`). Las caras del kit se usan como textura de la cabeza, sin el naranja de la piel. La correa (dibujada en "M") y la guitarra de perfil no se usaron: no hay vista de perfil en este plano.
- **Arreglos del kit:** las cruces magenta de apoyo se borraron (mástil: copia de un tramo vecino; micrófono: relleno de los trazos finos; queda tapado por la mano que rasguea).

- **Volumen medido (cierre, ebur128 sobre `bloomie-rock_9x16_v1.mp4`):** -13,9 LUFS integrados, LRA 0,6 LU, pico real -6,8 dBFS.

## Entregas
| Archivo (`out/2026-10-04_claudio_bloomie-rock/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `bloomie-rock_9x16_v1.mp4` | 2026-10-04 | Primera versión (8,04 s, 1080×1920, h264 crf 18, -13,9 LUFS). Blender 240 cuadros en 10 min (2,5 s/cuadro con 12 muestras); render de Remotion 1 min. |

## Cómo rehacerlo
0. Restaurar el material archivado: copiar `C:/Videos/archivo/<ID>/public/` sobre `public/trabajos/<ID>/` (trae `img/`, `audio/` y la capa de Blender en `cache3d/`, que evita los ~10 min de Blender si no cambió la huella). Si falta el tema de Mixkit en la biblioteca: copiar `C:/Videos/archivo/<ID>/biblioteca/` sobre `public/biblioteca/` (o `node scripts/mixkit.mjs bajar 49` y comparar el sha256).
1. `python src/trabajos/<ID>/recortar_kit.py` · `bash src/trabajos/<ID>/preparar_musica.sh`
2. `node src/trabajos/<ID>/armar_escena.mjs` · `python src/trabajos/<ID>/caras_rock.py`
3. `node scripts/blender/render.mjs <ID> bloomie-rock public/trabajos/<ID>/datos/animacion.json 240 --cara-png public/trabajos/<ID>/img/cara --extra public/trabajos/<ID>/datos/escena_extra.json --muestras 12` (~7 min)
4. `npx remotion render src/index.ts claudio-bloomie-rock-9x16 out/<ID>/final/bloomie-rock_9x16_v<N>.mp4 --crf=18`
