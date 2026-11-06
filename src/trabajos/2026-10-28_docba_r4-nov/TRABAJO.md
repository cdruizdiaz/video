# Trabajo 2026-10-28_docba_r4-nov — Reel 4 NOV de DOCBA

## Brief
- **Cliente / pieza:** DOCBA (loft social, Córdoba) · Reel 4 de noviembre · 9:16, 30 fps · plantilla `ReelDocba`, criterios en `src/marcas/docba/CRITERIOS.md`.
- **Pilar / objetivo:** Loft social, experiencia y eventos · comunicar un resumen de lo que ofrece DOCBA (diferenciales, curiosidades, espacios…). Host: equipo RASTRO.
- **Guion original:** `guion_original_r4.md` (copia de `Downloads/R4 NOV.md`). Voz en off: A DOCBA no hace falta venir con un plan · Venís, te sentás, comés algo rico mientras te tomás un café… · …y si se te activa el laburo, el espacio te acompaña · …o te quedás, porque cuando cae la noche, también podés disfrutar de una copita · Y entre medio, un montón de detalles para descubrir · host a cámara "Vení como quieras, quedate lo que quieras. Te esperamos en DOCBA." · placa con horario y dirección.
- **Material:** `Clientes/DOCBA/Producciones/1. R4 NOV` (9 .MOV 4K) + inserts de `Producciones/Inserts cámara`.

## Crudos (originales en `C:/Videos/crudos/<ID>/`, proxies 1080×1920 30 fps en `public/trabajos/<ID>/crudos/`)
| Clip | Dur. | Qué tiene |
|---|---|---|
| IMG_8580 | 17,4 s | **La voz en off completa** (5 frases, 0,72–16,0 s); la imagen no se usa (solo el audio) |
| IMG_9443 / 9444 | 9,8 / 5,8 s | la host entra por la puerta de vidrio (9444: abre y entra en 2,4–4,2 s; dice "gracias", sin usar) |
| IMG_9448 | 51,9 s | la host en la mesa: cartera (2 s), carta/QR (10 s), llama al mozo (19 s), llega el plato (31 s), café (46 s), compu (39–51 s) |
| IMG_9449 / 9450 / 9451 | 20,6 / 11,8 / 23,3 s | en el sillón: llega la amiga, brindis y sorbos (120/60 fps) |
| IMG_9452 / 9453 | 12,5 / 7,4 s | la host a cámara (9453 habla de 2,90 a 5,94 s; 9452 trae un "¿cómo irás?" de más) |

## Estructura del borrador A (22,7 s, −14,3 LUFS, música "paulyudin-hip-hop-relax-boombap" desde el primer cuadro)
IMG_9444 (entra) → montaje de IMG_9448 en las frases 1–3 → IMG_9449/9450 (amiga y brindis) en la frase 4 → 5 inserts de 0,52 s (menú C0137, comida C0126, baristas C0169, mural C0145, gente C0152; `preparar_inserts.py`, color original + RIFE) en la frase 5 → IMG_9453 a cámara → placa naranja "LUNES A SÁBADO · 8:30 A 21 HS" / "BUENOS AIRES 864 · NUEVA CÓRDOBA". Voz alineada con `alinear.py` (`datos/alin_voz.json`, `alin_9453.json`); sin audio propio en los clips ni inserts. Detector de glitches: solo el congelado de la placa (intencional).

## Borrador B (2026-10-29) — 19,0 s + placa, −14,3 LUFS (`revision/borrador_r4-nov_9x16_B.mp4`)
Correcciones de la usuaria sobre el A (tiempos con el reloj truncado: "0:05" = 5,9 s, "0:12" = 12,9 s):
1. **Primer clip (IMG_9444, la host entra a contraluz):** se ilumina solo a ella con la máscara de personas (`retocar_luz.py` → `luz_9444.mp4`); el fondo no cambia.
2. **0:05 (celular y carta en la mano)** reemplazado por ella agarrando y abriendo la compu (IMG_9448 desde 39,5 s, un solo plano de 1,6 s).
3. **0:09 y 0:10 (IMG_9449, brindis en el sillón):** look de noche real: fondo/pared más oscuro con gradiente desde arriba, tono frío y viñeta; las dos personas más iluminadas y cálidas (`noche_a/noche_b`).
4. **"una copita":** el primer plano de la copa (IMG_9450) se cambió por `IMG_9451` desde 4,0 s (choque de copas).
5. **Insert del 0:12 (el menú, C0137):** venía sobreexpuesto y verdoso; se bajaron los blancos y se neutralizó el color.
6. **Croissant con palta (C0126, ya usado en R2 y R3)** → bowl con huevo frito C0058 (no se usó en ningún reel).
7. **Placa final con colores invertidos** (fondo hueso, logotipo naranja).

## Borrador C (2026-10-29) — correcciones sobre el B
1. Primer clip (host entrando): la corrección había quedado rosada → curva más suave, rojo −3 %, saturación −4 %.
2. Subtítulo "Y si se activa" (sin "te").
3. Brindis en el sillón (0:09 y 0:10): se volvió al video original con la luz apenas corregida (curvas suaves, sin fondo oscuro ni tinte frío ni viñeta: el look "de noche" del B quedó "de terror").
4. Insert del 0:12 → Loft C0170 (elegido por la usuaria). Insert del 0:13 (bowl con huevo) → Comida C0151, vasos de café DOCBA (elegido por la usuaria). Color original + RIFE.

## Borrador D (2026-10-29)
Primer clip (host entrando): más luz pero natural: gamma 1,42 sobre ella (con la máscara) y gamma 1,07 en el fondo para que no se note el parche; rojo −1,5 %, sin saltos de color. Resto igual que el C.

## Entregas
| Archivo (`out/2026-10-28_docba_r4-nov/final/`) | Fecha | Cambios |
|---|---|---|
| `r4-nov_9x16_v1.mp4` | 2026-10-29 | Final = borrador D (22,7 s, −14,3 LUFS, sin glitches): host con luz corregida, brindis original con luz suave, inserts C0170 y C0151, bowl→café, placa invertida, subtítulo "Y si se activa" |

## Borrador E (2026-10-30, sobre la v1) — `revision/borrador_r4-nov_9x16_E.mp4`, 22,7 s, −14,3 LUFS
1. Sin subtítulos en "A DOCBA no hace falta venir con un plan." y sin el "en DOCBA." del final.
2. **Corte de 8,6 s** (compu → brindis en el sillón): flash **corto de R1_VFinal** (Referencias/R1_VFinal.mov, s 57,6; medido a 60 fps: el plano que sale se sobreexpone en 2 cuadros con bloom, brillo 112→142→175, y en el cuadro siguiente ya está el plano nuevo, sin luz que se apague). A 30 fps: 2 cuadros (intensidad 0,5 y 1,0) justo antes del corte; `flashesCortos` + `intensidadFlashCorto` en `flashLuz.tsx`. Distinto del flash de los reels del CEI/DOCBA (sube 6 cuadros y baja 11, con desenfoque y zoom).
3. **Corte de 12,9 s** (brindis → inserts): flash de siempre (`flashes`).
4. **"Vení como quieras…"** (IMG_9453): acercamiento gradual del 10 % durante todo el plano (`push 0,10`, hacia la cara, origen 50 % 35 %).
- **Borrador F:** el subtítulo final queda **"Te esperamos en"** (4,94–5,94 s de la toma), sin la palabra "DOCBA" (antes se habían sacado los dos: "Te esperamos" y "en DOCBA.").
| `r4-nov_9x16_v2.mp4` | 2026-10-30 | **Entrega v2** (1080×1920, 22,7 s, −14,3 LUFS, CRF 18). Sin subtítulos en "A DOCBA no hace falta venir con un plan."; subtítulo final "Te esperamos en" (sin "DOCBA"); flash corto de R1_VFinal en 8,6 s y flash normal en 12,9 s; acercamiento de 10 % en "Vení como quieras". **Voz "mientras te tomás" arreglada:** DeepFilterNet (atten-lim 22) había borrado la "s" de "mientras" (5,10 s del audio de voz: banda alta −42 dB vs −18 dB del original) y dejaba un clic en 8,98 s; `voz_limpia.wav` ahora mezcla 75 % del audio original en 5,03–5,27 s (y el original en 8,95–9,02) con fundidos de 20 ms; `voz_n19.wav` rehecho (copias: `voz_limpia_dn22.wav`, `voz_n19_v1.wav`). |
| `r4-nov_9x16_v3.mp4` | 2026-10-30 | **Entrega v3** (1080×1920, 22,7 s, −14,3 LUFS). Igual a la v2, pero el **primer plano (host entrando) dura hasta que termina "plan"** (1,97 s del reel, antes 1,8 s). `luz_9444` rehecho a 2,3 s (`retocar_luz.py luz_9444`, máscara nueva `tmp/r4/m_a2.mp4`; copia anterior `luz_9444_v1.mp4`); el plano de la cartera se acortó 0,17 s (2,37 s del clip, 0,53 s) para que todo lo demás siga sincronizado con la voz y la música. |
| `r4-nov_9x16_v4.mp4` | 2026-10-30 | **Entrega v4** (1080×1920, 23,7 s, −14,2 LUFS). El **primer plano dura 1 s más** (2,97 s: 1 s más de ella entrando, `luz_9444` rehecho desde 1,4 s de IMG_9444, 3,3 s; máscara `m_a3`) y la voz, los subtítulos y la música se corrieron 1 s (`OFF` en composiciones.ts), así que todo lo demás queda sincronizado y el corte del primer plano sigue cayendo justo cuando termina "plan"… ⚠ ver nota: con el corrimiento, "plan" termina en 1,97 s + 1 = 2,97 s. Copias: `luz_9444_v1.mp4`, `luz_9444_v2.mp4`. |
| `r4-nov_9x16_v5.mp4` | 2026-10-30 | **Entrega v5** (23,7 s, −14,2 LUFS). Reemplaza el criterio de la v4: el primer plano **arranca donde siempre** (2,4 s de IMG_9444) y **sigue corriendo 1 s más** (2,97 s; `luz_9444` rehecho a 3,0 s con `m_a3` desde 1,1). "A DOCBA no hace falta venir con un plan." suena igual que antes; la voz de "Venís…" en adelante (partida en el silencio de 2,85 s del archivo), los subtítulos, los planos siguientes y la música (compás en "Venís") se corrieron 1 s. La v4 (que alargaba por el principio) queda como descartada. |
| `r4-nov_9x16_v6.mp4` | 2026-10-30 | **Entrega v6** (23,03 s, −14,3 LUFS). El primer plano **termina en 2:09** (interpretado como 2 s y 9 cuadros = 2,3 s; corte en el cuadro 69); mismo arranque, y la voz de "Venís…" en adelante, subtítulos, planos y música corridos 0,33 s respecto de la versión original (`OFF = 0.333`). ⚠ Si la usuaria quiso decir 2,9 s u otro valor, cambiar `OFF` (= fin − 1,97). |
| `r4-nov_9x16_v7.mp4` | 2026-11-05 | **Entrega v7** (23,03 s, 691 cuadros, −14,3 LUFS, sin glitches). Base = la V3 de la usuaria (`Downloads/R4 NOV DOCBA V3.mp4`: nuestra v6 + sus títulos de Premiere "A DOCBA no hace…" y "DOCBA" naranja), con su audio tal cual (música y sonido aprobados). **La host no puede aparecer desde 0:16:** sus cuadros 0–474 quedan como en la V3 y desde 15,83 s se renderizó un tramo nuevo (`HOST_A_CAMARA = false` en composiciones.ts) donde "Vení como quieras… Te esperamos en DOCBA" queda como voz en off sobre inserts elegidos por la usuaria (`preparar_inserts.py fin_*`, color original + RIFE, temblor 0,06–0,13, sin estabilizar): C0133 cartel de la fachada · C0033 cowork · C0147 mural · C0017 se toma un café (desde 0:07). La **placa entra apenas termina "DOCBA"** (19,07 s, antes 19,23); la música no cambió (`MUSICA_PLACA`). Se pierde el título "DOCBA" naranja que ella había puesto sobre la host. |
