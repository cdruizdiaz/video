# 2026-10-23_rastro_placa-cierre

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) |
| Pieza | Placa de cierre de los reels |
| Estado | 🟢 Entregado: papel v2, crema v1, negro v3, petróleo, bordó y turquesa v2 |
| Abierto | 2026-10-23 |
| Cerrado | — |

## Brief
- **Objetivo:** placa gráfica para poner **siempre al final de los reels de RASTRO**: logo animado y abajo el eslogan. Varias versiones en los colores de la marca, para elegir la que combine con cada reel.
- **Formato(s):** 9:16 1080×1920 · 30 fps (solo 9:16, decidido el 2026-10-23).
- **Modo de animación:** plano (la figurita de la "A" es parte del logo: se anima como imagen, sin rig).
- **Luz de la escena:** — (sin material real)
- **Duración:** ~3 s; quieta el último segundo.
- **Tono / estilo:** "algo propio de un estudio creativo pero a la vez sutil, porque es solo para el cierre del video". Animación elegida (2026-10-23, entre tres propuestas: "La figurita asoma", "El rastro", "Del ruido al silencio"): **La figurita asoma**:
  1. 0,2 s: las letras R·STRO se dibujan con su propio trazo a mano, rápido y en orden;
  2. 1,0 s: la figurita de la "A" asoma desde abajo;
  3. 1,3 s: se asienta con un rebote mínimo y hace un gesto chiquito con la cabeza (asiente);
  4. 1,6 s "Menos ruido." / 1,9 s "Más historias.";
  5. 2,2–3,0 s: quieta.
- **Textos obligatorios:** "Menos ruido. Más historias." (eslogan de RASTRO).
- **Llamado a la acción:** ninguno: solo el eslogan (decidido el 2026-10-23).
- **Colores (2026-10-23, "dame en más colores"):** seis versiones con la paleta de `paletaRastro`: fondos claros (papel, crema) con logo y eslogan negros y la figurita en positivo; fondos oscuros o de color (negro, petróleo, bordó, turquesa) con **el logo todo blanco** ("para las que el fondo te permita, usá el logo todo blanco"): letras blancas y la figurita en blanco (contorno y vetas blancas, lo claro de la madera transparente: `figurita-blanca.png`), y el eslogan también blanco (antes: papel y la figurita en negativo, con la madera negra). Otra más: una fila en `VARIANTES` de `composiciones.ts` (`claro(…)` u `oscuro(…)`).
- **Sonido:** muda: la música del reel sigue debajo (decidido el 2026-10-23).
- **Entrega:** `out/2026-10-23_rastro_placa-cierre/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-23_rastro_placa-cierre/` (fuera del proyecto; sin material: todo sale del kit de marca)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-23_rastro_placa-cierre/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/rastro/` (logo.png, fuentes/), trazos del logo en `src/plantillas/ManifiestoRastros/ManifiestoRastros.tsx` (`TRAZOS_LOGO`).

## Guiones
- `guion_placa-cierre.md` (generar con `/guion 2026-10-23_rastro_placa-cierre`; aplicar cambios con `/aplicar-guion 2026-10-23_rastro_placa-cierre`)

## Decisiones
- **Plantilla:** nueva, `PlacaRastro` (ninguna de `src/plantillas/` anima el logo así); reutiliza los trazos del logo del manifiesto.
- **Música:** —
- **Otras:**
  - Composición `rastro-placa-cierre-<variante>` (90 cuadros). Tiempos: letras 0,2–1,1 s; la figurita asoma 0,93–1,37 s; asiente 1,47–1,87 s; "Menos ruido." 1,6 s; "Más historias." 1,9 s; quieta desde ~2,2 s.
  - Logo de 760 px de ancho centrado en y 860; eslogan Inter 500 de 54 px (46 quedaba chico).
  - La figurita se separa del logo con recortes: la "A" (x 100–244 del logo) asoma desde detrás del renglón (y 176) y la cabeza es un círculo de radio 21 alrededor de la cabeza de la figurita (una caja recta dejaba una muesca en los hombros al asentir).
  - **Contraste del logo (2026-10-23, "fijate que el logo debe contrastar"):** la "A" de `logo.png` es chica (125 px) y con el filtro de la marca quedaba como una mancha gris → la figurita es ahora el **short logo del manual de marca** en alta (`Rastro Manual de Marca_Short Logo negro.jpg`), con fondo transparente (`preparar_logo.py` → `public/marcas/rastro/figurita-positivo.png`, madera teñida de papel) en el mismo lugar y tamaño; las letras R·STRO, en negro puro (`brightness(0)`) en vez de gris. Para fondos oscuros, el negativo que mandó el usuario (`image (2).png` → `figurita-negativo.png`) con letras blancas (`logoClaro: true`). Originales copiados en `C:/Videos/crudos/2026-10-23_rastro_placa-cierre/`.
  - **2ª tanda (2026-10-23, borrador C):** "no me gusta mucho la animación de RASTRO… se ve muy dura. No quiero que el logo sea aparte, sino que esté todo unido… más movimiento smooth" (el eslogan sí gustó). Letras dibujadas + figurita que asoma y asiente por separado → **el logo entero como una sola pieza**, con la curva de la marca, y todo el bloque (logo + eslogan) asentándose junto con una deriva lenta; el eslogan se encadena antes (0,8 y 1,1 s). Dos entradas para elegir: `sube` (sube 40 px, aparece y se enfoca: desenfoque 14 → 0) y `revela` (barrido de borde suave de izquierda a derecha, sube 22 px). Comparación: `revision/comparar_sube_revela_C.mp4`.
  - **3ª tanda (2026-10-23, borrador D):** "¿y si probamos que se dibuje todo a la vez? incluido el logo" → entrada `dibuja`: desde 0,13 s, en ~1,1 s y casi juntos (1,5 cuadros entre trazo y trazo), las letras con su trazo a mano (`TRAZOS_LOGO` del manifiesto), la figurita con tres pinceladas que siguen su forma (patas y arco, travesaño, cabeza: `TRAZOS_FIGURA`) y el eslogan con el contorno de cada letra; después todo se llena (las formas llenas aparecen encima de lo dibujado: cruzar las dos capas con opacidad dejaba el logo gris a mitad de camino). Quieta desde ~1,7 s.
  - **Elegida (2026-10-23):** "me gusta, que sea solo RASTRO así; el menos ruido más historias dejalo como antes" → el logo con la entrada `dibuja` y el eslogan con la del borrador B (1,6 y 1,9 s, 14 cuadros, sube 14 px), no dibujado. Versiones: **papel** (fondo papel, logo negro, la elegida) y **negro** (fondo tinta, letras blancas y la figurita en negativo, "para más variedades"). Otras de `paletaRastro`: una fila más en `VARIANTES`.
  - **5ª tanda (2026-10-23):** "el menos ruido y más historias que entre al toque RASTRO está listo" → "Menos ruido." 1,6 → 1,33 s y "Más historias." 1,9 → 1,53 s; quieta desde ~1,8 s.
  - (1ª tanda, descartada) Los trazos del logo se reusaban del manifiesto (`TRAZOS_LOGO`, exportados de `ManifiestoRastros.tsx`). Un trazo de largo 0 igual dibuja la punta redonda: no se dibuja hasta que empieza.

## Entregas
| Archivo (`out/2026-10-23_rastro_placa-cierre/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `revision/borrador_placa-cierre-papel_9x16_A.mp4` (borrador) | 2026-10-23 | Primera versión, papel / tinta, muda |
| `revision/borrador_placa-cierre-papel_9x16_B.mp4` (borrador) | 2026-10-23 | Figurita del short logo en alta (contraste) y letras en negro puro |
| `revision/borrador_placa-cierre-papel-sube_9x16_C.mp4` y `…-revela_9x16_C.mp4` (borradores) | 2026-10-23 | El logo entra entero y suave (dos variantes); el eslogan, encadenado |
| `revision/borrador_placa-cierre-papel-dibuja_9x16_D.mp4` (borrador) | 2026-10-23 | Todo se dibuja a la vez: letras, figurita y eslogan |
| `revision/borrador_placa-cierre-papel-dibuja_9x16_E.mp4` (borrador) | 2026-10-23 | Solo el logo se dibuja; el eslogan, como en el B |
| `placa-cierre-papel_9x16_v1.mp4` | 2026-10-23 | **Entrega.** Fondo papel, logo negro; 3 s, muda |
| `placa-cierre-negro_9x16_v1.mp4` | 2026-10-23 | **Entrega.** Fondo negro, letras blancas y figurita en negativo; 3 s, muda |
| `placa-cierre-papel_9x16_v2.mp4` y `placa-cierre-negro_9x16_v2.mp4` | 2026-10-23 | **Entrega.** El eslogan entra apenas el logo está listo (1,33 y 1,53 s) |
| `placa-cierre-crema_9x16_v1.mp4`, `-petroleo_`, `-bordo_`, `-turquesa_9x16_v1.mp4` | 2026-10-23 | **Entrega.** Colores nuevos, con los tiempos de la v2 |
| `placa-cierre-negro_9x16_v3.mp4`, `-petroleo_`, `-bordo_`, `-turquesa_9x16_v2.mp4` | 2026-10-23 | **Entrega.** Logo todo blanco (figurita blanca) y eslogan blanco |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-23_rastro_placa-cierre/` desde `C:/Videos/archivo/2026-10-23_rastro_placa-cierre/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/2026-10-23_rastro_placa-cierre/` (si los hay).
3. `npx remotion render src/index.ts <id-composición> out/2026-10-23_rastro_placa-cierre/final/<salida>_vN.mp4 --crf=18`
