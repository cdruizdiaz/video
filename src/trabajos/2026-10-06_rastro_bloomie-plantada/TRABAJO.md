# 2026-10-06_rastro_bloomie-plantada

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) |
| Pieza | bloomie-plantada |
| Estado | 🟢 Cerrado |
| Abierto | 2026-10-06 |
| Cerrado | 2026-10-06 |

## Brief
- **Objetivo:** chiste corto de Bloomie: lo dejaron plantado en una cita y además está literalmente plantado (no puede irse). Guion: `guion_bloomie-plantada.md`.
- **Formato(s):** 9:16 1080×1920 · 30 fps (255 cuadros)
- **Modo de animación:** 3D (Blender Eevee, mismo modelo, luces y escala que "toma vida": pies en x=540, y=1330, escala 1,95; giros ¾ hasta rotY ±0,35)
- **Luz de la escena:** sin material real. Reflector ámbar #ffd59a desde arriba a la izquierda + contraluz celeste desde atrás a la derecha.
- **Duración:** 8,5 s
- **Tono / estilo:** comedia tierna con timing de stand-up; en inglés; público familiar. Escenario de "toma vida" (fondo negro, piso con reflejo, polvo en el haz, viñeta).
- **Textos obligatorios:** subtítulos de la voz (Fredoka 700, palabra dicha en #ef913c) y firma "Bloomie" al cierre.
- **Llamado a la acción:** ninguno (cierra con la firma).
- **Entrega:** `out/2026-10-06_rastro_bloomie-plantada/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/<ID>/kit_plantada.png` (hoja de expresiones de ChatGPT, 2000×1000: 8 caras, 8 sin boca, 9 bocas, 4 pétalos, 2 destellos) y `kit_plantada_x4.png` (Real-ESRGAN anime x4)
- **Recortes:** `img/kit/*.png` (`recortar_kit.py`) · cara por cuadro `img/cara/f000…f254.png` (`caras.py`)
- **Voces:** `audio/voz_a/b/c.wav` (Piper `en_US-hfc_female-medium --nene`, velocidad 1,06 / 1,16 / 1,03) · mezcla `audio/mezcla.wav` (`preparar_audio.mjs`)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-06_rastro_bloomie-plantada/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/rastro/`

## Guiones
- `guion_<pieza>.md` (generar con `/guion 2026-10-06_rastro_bloomie-plantada`; aplicar cambios con `/aplicar-guion 2026-10-06_rastro_bloomie-plantada`)

## Decisiones
- **Plantilla:** propia (`BloomiePlantada.tsx`: escenario con reflector, capa 3D de Blender, reflejo, partículas, subtítulos y firma). Composición `rastro-bloomie-plantada-9x16`.
- **Escenario "toma vida":** no estaba en esta PC (ni en el repo): se armó desde la descripción del guion. Modelo 3D de Bloomie construido acá (`C:/Videos/personajes/bloomie/bloomie_3d.blend`).
- **Tiempos:** `armar_escena.mjs` es la fuente (claves de animación, caras, efectos); palabras y bocas salen de las voces reales. Diferencias con el guion: "for" 1,31 s (no 1,29), "hours…" 2,02–2,38, "and" 2,86, "I" 3,04, "got" 3,12, "stood" 3,40, "up!" 3,64–3,80, "And" 5,33, "leave…" 5,90–6,14, "planted!" 6,70–7,04. Womp womp en 3,66 s (con "up!").
- **Kit (ajustes automáticos en `caras.py`):** ojos achicados dentro de cada aro hasta el 84 % del radio interior (Cansado, Triste, Esfuerzo, Resignado y Alegría ~0,85; Normal y Asombro ~0,95); bocas de habla a 0,46 de su tamaño en la hoja (medida de la boca de Normal) y 15 px más abajo para no tocar el aro; boca de Esfuerzo y de Alegría bajadas 9 y 14 px. Se agregó la boca "O" (Rhubarb E). Rhubarb X = boca de la propia expresión.
- **Efectos (Mixkit, Mixkit Sound Effects Free License, uso comercial sin atribución):** id · sha256 (12) del registro `LICENCIAS-mixkit.json`:
  - 1060 "Wall clock tick tock" · `66efe4ce5e0b` — tic-tac 0–2,3 s
  - 744 "Trombone disappoint" · `5f8ef1f18907` — womp womp en 3,66 s (472 "Slow sad trombone fail" se bajó pero no se usó: dura 5 s)
  - 616 "Cartoon toy whistle" · `b4b3a111a8c4` — estirones en 3,85 y 4,5 s (acelerado ×2,4 y ×2,1)
  - 2894 "Boing hit sound" · `9d0611005031` — 4,2 y 4,92 s
  - 578 "Joke drums" · `13737226f757` — ba-dum-tss 7,25 s
  - 3062 (destello) · `6b7938d7c408` — 7,3 s
  - Entre 6 y 10 dB por debajo de la voz (medidos con ebur128). Mezcla -13,8 LUFS; **entrega v1 medida: -13,9 LUFS, pico -2,8 dBFS**.
- **Música:** no lleva (solo voz y efectos).
- **3D:** `render.py` ganó `huesosExtra` (z de las manos, cabeceo y giro de la cabeza por cuadro), contraluz celeste y cuadros sueltos (`render.mjs --solo`). Eevee 0,49 s/cuadro en la Ryzen (255 cuadros en 2 min).
- **Revisión:** `out/<ID>/revision/solo_bloomie-plantada.png` (cuadros clave del guion) y `revisar_rastro-bloomie-plantada-9x16.png`; se corrigieron el reflejo (máscara invertida) y el espacio antes de "planted!".

## Entregas
| Archivo (`out/2026-10-06_rastro_bloomie-plantada/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `bloomie-plantada_9x16_v1.mp4` | 2026-10-06 | Primera versión (8,55 s, 1080×1920, 255 cuadros, h264 crf 18, -13,9 LUFS, pico -2,8 dBFS). Blender 2 min + Remotion 40 s. Borrador previo en `revision/borrador_bloomie-plantada.mp4`. |

## Cómo rehacerlo
0. `python src/trabajos/<ID>/recortar_kit.py` · voces con `node scripts/voz.mjs` (texto y velocidades arriba) · `node src/trabajos/<ID>/armar_escena.mjs` · `python src/trabajos/<ID>/caras.py` · `node src/trabajos/<ID>/preparar_audio.mjs` · `node scripts/blender/render.mjs <ID> bloomie-plantada public/trabajos/<ID>/datos/animacion.json 255 --cara-png public/trabajos/<ID>/img/cara --extra public/trabajos/<ID>/datos/escena_extra.json --muestras 16`
1. Restaurar `public/trabajos/2026-10-06_rastro_bloomie-plantada/` desde `C:/Videos/archivo/2026-10-06_rastro_bloomie-plantada/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/2026-10-06_rastro_bloomie-plantada/` (si los hay).
3. `npx remotion render src/index.ts <id-composición> out/2026-10-06_rastro_bloomie-plantada/final/<salida>_vN.mp4 --crf=18`
