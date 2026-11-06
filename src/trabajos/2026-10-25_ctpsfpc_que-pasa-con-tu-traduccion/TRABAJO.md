# 2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion

| Campo | Valor |
|---|---|
| Cliente / marca | Colegio de Traductores de la Provincia de Santa Fe — 1.ª Circunscripción (`src/marcas/ctpsfpc`) |
| Pieza | que-pasa-con-tu-traduccion: "¿Qué pasa con tu traducción?" |
| Estado | 🟡 Entregado v4, esperando aprobación del cliente (sin música: la pone el cliente). Cerrar con `/cerrar-trabajo` cuando aprueben |
| Abierto | 2026-10-25 |
| Cerrado | — |

## Brief
- **Objetivo:** reel informativo del Colegio: qué pasa con una traducción cuando se lleva a legalizar.
  - Los cuatro pasos: matrícula vigente; firma y sello contra el registro; control formal y pago electrónico; vinculación de la hoja y entrega.
  - Qué certifica el Colegio (firma y sello, no el contenido).
  - Dónde consultar horarios y requisitos (la web).
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** — (sin personajes)
- **Duración:** 40,4 s (36,4 s de tomas + 4 s de placa)
- **Tono / estilo:** el de los reels del cliente, aplicando de entrada `src/marcas/ctpsfpc/CRITERIOS.md` (pedido 2026-10-25: "usá los criterios que quedaste para este cliente"):
  - tomas en el orden de los nombres de archivo; cada una arranca cuando la persona empieza a hablar;
  - uniones por movimiento de cámara en un solo movimiento;
  - subtítulos Be Vietnam Pro SemiBold 72 px, blancos, con sombra difusa al 45 %, y = 1500, que salen al terminar la palabra;
  - placas de explicación (bento + Bauhaus, Almarai + Be Vietnam) si hay una enumeración o una explicación que se pueda graficar;
  - placa final con el logo y "www.traductoresantafe.org.ar";
  - sin música (la pone el cliente).
- **Textos obligatorios:** —
- **Llamado a la acción:** el que diga la persona.
- **Entrega:** `out/2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion/` (8 MOV de iPhone, de IMG_8443 a IMG_8500), fuera del proyecto.
  - Verticales (1920×1080 rotados).
  - 29,97 fps (IMG_8500: 30).
  - HEVC en **rango completo** (`yuvj420p`, `color_range=pc`).
- **Proxies:** `public/trabajos/<ID>/crudos/`. 1080×1920 a 30 fps, convertidos a rango estándar (`scale=in_range=full:out_range=limited`, bt709), libx264 crf 20.
- **Marca:** `public/marcas/ctpsfpc/`.

## Guiones
- `guion_que-pasa-con-tu-traduccion.md`

## Decisiones
- **Plantilla:** `ReelCtpsfpc` (copiada de `2026-10-25_ctpsfpc_varios-idiomas`, cambiando tomas, subtítulos y placas).
- **Música:** ninguna (criterio del cliente: la pone él).
- **Gráficos: símbolos sobre el video, sin placas** (pedido 2026-10-25 sobre el borrador A: "no hagas las placas gráficas, sino que en todo momento aparezca la host y poné los motion graphics en símbolos sobre ella… queda más atractivo"). Componente `SimbolosVideo`; detalle en `composiciones.ts` (`simbolos`).

  | Toma | Símbolos (ms del clip) |
  |---|---|
  | 8443 | sin gráficos (borrador C; en el B: documento y sello) |
  | 8447 | "1" 1640 · matrícula 2700 · calendario "vigente" 3600; todos salen en 4200, antes del paneo |
  | 8456 | "2" 1280 · documento con firma y sello 2140 · registro 3160; salen en 3830, antes del paneo |
  | 8479 | "3" 1250 · lista de requisitos 2320 |
  | 8481 | "3" (quieto) · pago 2680; salen en 4600, cuando se va caminando |
  | 8488 | "4" 1440 · hojas unidas 2800 · traducción entregada 4360 |
  | 8497 | "!" 1320–4700 · certifica 2640 (der.) · documento tachado 4780 (izq.); salen en 6650, antes del paneo |
  | 8500 | consulta 1340–3300 · web en píldora índigo desde 4400 (se escribe; sin subtítulo). En el borrador B: calendario "horarios" 3460 y lista "requisitos" 3980, sacados en el C |

- **Tomas (ms del clip):**

  | Clip | Tramo |
  |---|---|
  | 8443 | 2150–5350 |
  | 8447 | 1450–4433 |
  | 8456 | 700–4133 (v1: 700–3967) |
  | 8479 | 733–4220 (v1: 533–4220) |
  | 8481 | 1080–5070 |
  | 8488 | 950–7600 |
  | 8497 | 950–6833 |
  | 8500 | 633–7400 |

  - Las uniones 8447→8456, 8456→8479 y 8497→8500 van en un solo barrido.
  - En el borrador A, con placas, esas tomas terminaban antes del barrido porque quedaba tapado.
  - 8479 corta antes de "y verificamos" (retoma).
  - 8481→8488: como si siguiera caminando (pedido sobre el borrador C).
    - La 8481 sigue hasta que ella termina de salir por la derecha (5,07 s; antes cortaba en 4,6 s).
    - La 8488 arranca justo antes de que entre por la izquierda (0,95 s; antes 1,25 s).
    - El "3" y el ícono del pago salen cuando se da vuelta (4,6 s).
- **Transcripción:**
  - IMG_8500 transcrita con `--sin-vad`: con el salto de silencios se perdía "Consultá horarios…".
  - "¿Qué" de IMG_8443 con el inicio medido (2,18 s).
- **Subtítulos:**
  - en voseo: "llevás", "Consultá";
  - "Colegio" con mayúscula;
  - "Importante:" con dos puntos;
  - los números de los pasos en palabras y con dos puntos ("Uno: verificamos"…), cada uno en un renglón (v4; en la v3 iban con punto);
  - la web en un grupo propio, que la plantilla achica para que entre.

## Borradores
- **A** (2026-10-25): placas de explicación a pantalla completa en cada paso. El cliente pidió símbolos sobre la host en su lugar.
- **B** (2026-10-25): símbolos sobre el video y la host siempre a la vista. Dura 39,7 s.
- **D** (2026-10-25): la 8481 sigue hasta que ella sale de cuadro caminando y la 8488 arranca justo antes de que entre, como si siguiera caminando. Dura 40,4 s.
- **C** (2026-10-25): la primera toma sin gráficos; los símbolos terminan de salir antes de cada barrido de cámara; en la última toma, la web como gráfico arriba de la cabeza, sin subtítulo, y sin los íconos de "horarios y requisitos".

## Entregas
| Archivo (`out/2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `que-pasa-con-tu-traduccion_9x16_v4.mp4` | 2026-10-25 | Los números de los pasos con dos puntos, no punto: "Uno: verificamos", "Dos: comparamos", "Tres: realizamos", "Cuatro: vinculamos" (minúscula después de los dos puntos). 40,4 s, −14,1 LUFS, pico −1,4 dBFS |
| `que-pasa-con-tu-traduccion_9x16_v3.mp4` | 2026-10-25 | Los números de los pasos en palabras en los subtítulos ("Uno. Verificamos", "Dos. Comparamos", "Tres. Realizamos", "Cuatro. Vinculamos"), los cuatro en un renglón; los círculos de los símbolos siguen con la cifra. "Último cambio" del cliente. 40,4 s, −14,1 LUFS, pico −1,4 dBFS |
| `que-pasa-con-tu-traduccion_9x16_v2.mp4` | 2026-10-25 | La toma de "…en nuestro registro" (8456) dura un poco más: sigue hasta el punto más rápido de su paneo (4,13 s), y la 8479 entra en el suyo ya frenando (0,73 s), así no queda tan cortada y engancha como un solo barrido (pedido sobre la v1). 40,4 s, −14,1 LUFS, pico −1,4 dBFS |
| `que-pasa-con-tu-traduccion_9x16_v1.mp4` | 2026-10-25 | Primera entrega, aprobada sobre el borrador D ("perfecto"). Lleva símbolos sobre la host, la web como gráfico, uniones en un solo barrido y la caminata enganchada; va sin música. 40,4 s, 1080×1920, 30 fps, crf 18, −14,1 LUFS, pico −1,4 dBFS |

## Cómo rehacerlo
1. Restaurar `public/trabajos/<ID>/` desde `C:/Videos/archivo/<ID>/` (si el trabajo está cerrado).
2. `bash src/trabajos/2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion/preparar_voz.sh` y `node src/trabajos/2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion/armar_transcripcion.mjs`
3. `npx remotion render src/index.ts ctpsfpc-que-pasa-con-tu-traduccion-reel <tmp>.mp4 --crf=18` y `bash scripts/terminar_audio.sh <tmp>.mp4 out/<ID>/final/que-pasa-con-tu-traduccion_9x16_vN.mp4`
