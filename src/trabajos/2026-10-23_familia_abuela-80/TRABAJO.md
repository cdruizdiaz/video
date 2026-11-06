# 2026-10-23_familia_abuela-80

| Campo | Valor |
|---|---|
| Cliente / marca | familia (sin kit de marca: video personal) |
| Pieza | abuela-80 |
| Estado | 🟡 En curso |
| Abierto | 2026-10-23 |
| Cerrado | — |

## Brief
- **Objetivo:** video largo para YouTube del cumpleaños 80 de la abuela, con todo el material del 18/10/2026.
- **Formato(s):** 16:9 1920×1080 · 30 fps
- **Modo de animación:** — (sin personajes animados)
- **Duración:** 25–35 min (material bruto: ~90 min en 94 clips)
- **Tono / estilo:** dinámico; cortar los tramos donde no pasa nada, pero conservar el humor y la esencia de los videos.
- **Audio:** mejorarlo sin robotizar ni que suene embotellado → reducción de ruido **suave** (DeepFilterNet con atenuación limitada, mezclado con algo del original), nada de limpieza total.
- **Textos obligatorios:** ninguno (sin título, capítulos ni subtítulos).
- **Música:** ninguna, solo el sonido real.
- **Llamado a la acción:** —
- **Entrega:** `out/2026-10-23_familia_abuela-80/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-23_familia_abuela-80/` (copia de `C:/Users/LUCIA/Documents/abuela 80/abuela mp4`)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-23_familia_abuela-80/` (crudos/, audio/, img/, datos/)
- 94 clips `00387`–`00480`, todos 1920×1080 a 29,97 fps. Proxies a 30 fps constantes (`preparar_proxies.sh`).
- **Orden cronológico = numeración** `00387` → `00480` (corregido el 2026-10-24): las horas de los mp4 son de la conversión desde los MTS, no de la grabación. Por el contenido: víspera (387–391), mañana (392–397), básquet (398–412), preparativos (413–420), llegada (421–426), comida (429–432), canción y torta (439–441), show (443–451), premios (452–467), bingo (469–476), karaoke y cierre (478–480). Clips largos: `00441` (9:48), `00439` (6:21), `00390` (4:26).
- Whisper inventa texto en los tramos con música ("¡Suscríbete!", "Gracias"): esos se eligen mirando hojas de cuadros (`out/<ID>/revision/hojas/`).

## Guiones
- `guion_abuela-80.md` (generar con `/guion 2026-10-23_familia_abuela-80`)

## Decisiones
- **Plantilla:** ninguna de Remotion: sin gráficos ni música, el montaje es solo cortes → ffmpeg desde los originales con una lista de tramos (`datos/clips.json`). Más rápido que un render de Remotion de 30 min.
- **Música:** ninguna (pedido del usuario).
- **Audio (2026-10-24):** elegida la muestra **B_suave** de `out/<ID>/revision/prueba_audio/` (DeepFilterNet con atenuación limitada, mezclado con el original). Receta (reproducida y comparada con la muestra: diferencia nula): `deepFilter --atten-lim 10` + `highpass=f=70,acompressor=threshold=-22dB:ratio=2:attack=15:release=250:makeup=2`; loudnorm -14 LUFS en dos pasadas sobre el video entero (sin el adelanto de 42,7 ms de `terminar_audio.sh`: ese relleno es de los AAC de Remotion).
- **Montaje (2026-10-24):** `montaje.py cortes` ajusta cada tramo de `candidatos.json` al borde de las frases de Whisper (salvo los tramos con música) → `datos/clips.json`; `montaje.py armar` corta desde los originales a 30 fps, cortes directos dentro de cada bloque, fundido a negro de 0,4 s entre bloques y de 1 s en las puntas, micro-fundido de audio de 20 ms en cada corte. Video libx264 crf 18 slow.
- **Noche en el auto (00387, 00388, 00416, 00421):** `curves=all='0/0 0.06/0.10 0.25/0.42 1/1',eq=saturation=1.15,hqdn3d` (con `eq=gamma` quedaba gris y lavado). Partes de 00387 y el arranque de 00388 son negro puro en el original: ahí solo se oye la charla.
- **Otras:** selección de tramos leyendo las transcripciones de Whisper (risas y reacciones detectadas por los huecos y el volumen), en orden cronológico.

## Entregas
| Archivo (`out/2026-10-23_familia_abuela-80/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `abuela-80_16x9_v1.mp4` | 2026-10-24 | Primera versión: 69 tramos, 36:50, -14,0 LUFS. Glitches: solo fundidos de bloque, negro original del auto y movimientos de cámara en mano (revisado en `revision/glitches_v1.png`). |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-23_familia_abuela-80/` desde `C:/Videos/archivo/2026-10-23_familia_abuela-80/` (si el trabajo está cerrado).
2. `bash src/trabajos/2026-10-23_familia_abuela-80/preparar_proxies.sh` y los scripts de audio del trabajo.
3. `node src/trabajos/2026-10-23_familia_abuela-80/seleccion.mjs` → `python src/trabajos/2026-10-23_familia_abuela-80/montaje.py cortes` → `python src/trabajos/2026-10-23_familia_abuela-80/montaje.py armar out/2026-10-23_familia_abuela-80/final/abuela-80_16x9_vN.mp4` (borrar antes `out/<ID>/revision/v1_partes/` si cambian los tramos: las partes se reusan por número).
