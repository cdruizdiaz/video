# Criterios del CTPSFPC para reels

Colegio de Traductores de la Provincia de Santa Fe — Primera Circunscripción (CTPSFPC).
Leer y aplicar **de entrada** en cada reel nuevo del cliente, junto con `src/plantillas/HablaSubtitulada/CRITERIOS_REEL.md` (si algo choca, manda este archivo).
Cada instrucción o corrección nueva del cliente se suma acá, con la fecha y el trabajo.

## Material del cliente
- Carpeta: `C:/Users/LUCIA/Documents/RASTRO/Clientes/CTPSF/`.
  - Playbook: `FINAL_CDTSF Social Media Playbook.pdf`.
  - Logos: `CTPSFPC Azul.svg` y `CTPSFPC Blanco.svg`.
  - Tipografías: `Tipografías/`.
  - Reel de referencia: `Reel idóneo.mov`.
- Kit en el proyecto: `src/marcas/ctpsfpc/marca.ts` (paleta `PALETA_CTPSFPC`), `public/marcas/ctpsfpc/` (logos y fuentes).
- Plantilla: **`ReelCtpsfpc`** (`src/plantillas/ReelCtpsfpc/`). Es `HablaSubtitulada` con la placa `PlacaCtpsfpc`. Para un reel nuevo, copiar `composiciones.ts` de `2026-10-25_ctpsfpc_varios-idiomas` y cambiar solo tomas, grupos y música.

## Identidad (Playbook 2026, anexo 1)
- **Paleta y proporción de uso:**

  | Color | Hex | Rol | Uso |
  |---|---|---|---|
  | Space Indigo | #202c5a | institucional | 60 % |
  | Chili Spice | #b43232 | acento | 20 % |
  | Wisteria Blue | #96bdfe | secundario | 10 % |
  | Dim Grey | #706c61 | neutro | 7 % |
  | Ivory Mist | #f8f4e3 | fondo claro | 3 % |

  En una página del PDF aparece "#62acfe" y en otra "#96bdfea": el color que se ve es #96bdfe.
- **Tipografías:**
  - titulares: Almarai ExtraBold 800;
  - subtítulos: Be Vietnam Pro SemiBold;
  - cuerpo: Be Vietnam Pro Regular.
- **Estilo gráfico:** "Bento Grid + Bauhaus". Módulos con formas geométricas simples (círculos, medios y cuartos de círculo) en colores planos, sin adornos.
- **Tono:** profesional, cercano, claro, institucional, accesible y formal.
- **Ortografía:** RAE en todo texto en pantalla.
  - Signos de apertura siempre: ¿…? y ¡…!
  - Comillas latinas « » primero.
  - Para incisos, raya (—), nunca guion.
  - Puntos suspensivos sin espacio antes.
  - Voseo bien acentuado: "¿Necesitás…?", "Encontralos".
  - **"Ológrafa/ológrafas", sin h** (firma o traducción hecha a mano), nunca "hológrafa", aunque la voz o Whisper lo digan así (corrección del cliente, 2026-10-25, varios-idiomas v2).
- **Accesibilidad:** los videos llevan subtítulos siempre.

## Montaje (pedido 2026-10-25)
- **Orden de las tomas:** el de los nombres de archivo, del número más chico al más grande.
- **Cada toma arranca apenas la persona empieza a hablar.** El inicio se mide con la energía de la voz, ~50 ms antes de la primera palabra. Se descarta lo anterior (pruebas, "avisame si…").
- **Tomas enganchadas con un movimiento de cámara** (paneo o tilt al final de una toma y al principio de la siguiente): tienen que parecer **un solo movimiento** (corrección 2026-10-25, borrador A).
  - La anterior se corta **apenas acelera** el barrido, no al final.
  - La siguiente entra **ya en movimiento**, sin su arranque lento, a una velocidad parecida (en su máximo o frenando).
  - Ejemplo del cliente: "el primer video cortarlo en el segundo 0:04 y el que sigue empezarlo ya en el movimiento".
  - Cómo medirlo: velocidad de cámara cuadro a cuadro con correlación de fase de OpenCV (px por cuadro), en los últimos ~1,2 s de la anterior y los primeros ~1,2 s de la siguiente. Cortar la anterior hacia 200–350 px/c y entrar en la siguiente a una velocidad parecida.
  - Nunca cortar antes de que termine la última palabra: si el barrido empieza mientras habla, se corta justo después de la palabra.
  - **Que la toma no quede "tan cortada" después de la última palabra** (2026-10-25, "…en nuestro registro"). Si entre el final de la voz y el barrido hay muy poco (~0,15 s), la toma sigue dentro del barrido hasta su punto más rápido y la siguiente entra en el suyo ya en su máximo o frenando: se ve un barrido que acelera y frena. Cortar apenas acelera (36 px/c) se sintió abrupto.
  - En el borrador A se había dejado el barrido entero de las dos tomas: se veían dos movimientos seguidos.
  - **Excepción: si la toma de salida termina tapada por una placa de explicación,** su barrido no se ve y no hay unión posible (2026-10-25, "¿Qué pasa con tu traducción?"). Si la siguiente entra a mitad de barrido después de la placa, parece un salto.
    - La toma de salida termina con la voz, antes de su barrido.
    - La siguiente entra con la cámara ya quieta, justo antes de que hable.
- **Uniones por la persona caminando** (sale de cuadro en una toma y entra en la siguiente): la anterior sigue **hasta que termina de salir de cuadro** y la siguiente arranca **justo antes de que entre**, "como si siguiera caminando" (2026-10-25, "¿Qué pasa con tu traducción?").
  - Verificarlo con una tira cuadro a cuadro de la salida y de la entrada; queda bien si sale por un lado y entra por el opuesto (sale por la derecha, entra por la izquierda).
  - Los símbolos de esa toma salen cuando la persona se da vuelta para irse, no sobre la caminata.
- **Retomas:** si una toma termina empezando una frase que la siguiente repite entera ("…de legalización y verificamos" / "y verificamos que…"), cortar la primera antes de la frase repetida.
- **iPhone en rango completo** (`yuvj420p`, `color_range=pc`): los proxies se convierten a rango estándar (`scale=in_range=full:out_range=limited`, bt709). Pasó con el segundo lote del cliente.
- **Ojo con el arranque de esos movimientos:** pueden asomar los pies de quien filma (IMG_8378: los primeros 6 cuadros). Revisar los primeros cuadros de cada toma que empieza desde el piso.
- **Planos:** sin zoom lento ni logo arriba; el plano original del celular, como en la referencia.

## Subtítulos (valores del cliente en CapCut, 2026-10-25)
- Be Vietnam Pro **SemiBold** (600), blanco, sin trazo.
- Sombra negra difusa: `0 3px 18px rgba(0,0,0,0.45)`.
  - El cliente pidió (2026-10-25) "un poco más notorio y difuminado, pero no tanto".
  - Antes era la de CapCut, al 25 % (`0 4px 14px`): se veía poco.
- **Tamaño:** "15" en CapCut equivale a 72 px en 1080 de ancho (medido contra "Reel idóneo.mov": ~38 px por carácter).
- **Posición:** a la altura de la cintura, centro en y ≈ 1500.
- **Grupos cortos:** 2 a 4 palabras, como máximo dos renglones en pirámide, escritos a mano. Entran y salen en seco.
- Sin palabras resaltadas en color, salvo pedido.
- **Webs dichas en voz:** desde el borrador C de "¿Qué pasa con tu traducción?" van como gráfico (ver "Símbolos sobre el video") y sin subtítulo. Si alguna vez una web o una palabra larga va como subtítulo y no entra en el ancho (máximo 960 px), la plantilla achica solo ese grupo.
- **Cada grupo sale apenas termina su última palabra** (`colaMs: 0`, 2026-10-25): con la cola de 350 ms, en los barridos de cámara al cielo o al piso la letra blanca quedaba sobre las nubes y se leía mal.
- Voseo en los subtítulos aunque Whisper escriba tuteo ("¿Necesitás…?"), confirmado 2026-10-25.
- **Números dichos de una enumeración, en palabras en los subtítulos** (2026-10-25, "¿Qué pasa con tu traducción?" v3: "los subtítulos de 1, 2, 3 y 4 tendrían que ser en palabras").
  - Se escriben **con dos puntos, no punto**: "Uno: verificamos", "Dos: comparamos"…, con minúscula después de los dos puntos (v4: "es sin punto… a dos puntos"; en la v3 se había hecho "Uno. Verificamos").
  - Whisper los da en cifras y se corrigen en `armar_transcripcion.mjs` (`EN_LETRAS`).
  - Todos en un renglón ("=") para que se vean iguales.
  - En los gráficos (círculos de los símbolos, placas) el número va en cifra.

## Música
- **Por ahora, los reels se entregan SIN música: la pone el cliente** (2026-10-25, borrador B: "elimina la música, no me gusta, después yo le pongo"). Si en otro reel la piden, lo que se probó:
  - Mixkit 440 "Infinity" (piano, relajada) se descartó: "media tétrica".
  - Se pasó a Mixkit 33 "Motivating Mornings" (corporativa, con empuje, 123 bpm).
- **La música va en todo el video y sube al final con la placa** (2026-10-25).
  - Bajo la voz, ~16 dB por debajo (`musicaBajoVozDb: -21`); a -27 (~22 dB por debajo) casi no se oía.
  - En la placa, `musicaCierreDb: -4`.
  - Arrancar el tema en un compás elegido para que su final propio coincida con el final de la placa (`scripts/pulsos.py`).

## Gráficos: dos opciones, se elige por reel
1. **Placas de explicación a pantalla completa** (abajo): las aprobó el cliente en "varios idiomas", con explicaciones largas (~8 s por caso).
2. **Símbolos sobre el video, con la host siempre a la vista** (`simbolos` de `ReelCtpsfpc`, componente `SimbolosVideo`). En "¿Qué pasa con tu traducción?", con pasos cortos (~3 s), el cliente las pidió en lugar de las placas (2026-10-25): "en este caso no hagas las placas gráficas, sino que en todo momento aparezca la host y poné los motion graphics en símbolos sobre ella… queda más atractivo".
- Ante la duda, preguntar cuál; con pasos cortos, arrancar con los símbolos.

## Símbolos sobre el video (2026-10-25)
- **Números de los pasos:** el número en Almarai ExtraBold, en un círculo Chili (240 px), con un cuarto de círculo Wisteria detrás que gira al entrar. "Importante" lleva "!".
  - Entran en la palabra del número.
  - Quedan toda la toma; si el paso sigue en la toma siguiente, el número aparece quieto (`sinEntrada`).
- **Íconos:** los mismos de las placas (matrícula, calendario, sello, registro, lista, pago, hojas unidas, documento tachado, consulta…), en insignias redondas de 230 px con los colores de la paleta, uno por idea, cada uno en la palabra que lo nombra.
- **Dónde van:** en el aire alrededor de la persona, medido con una grilla en cada toma.
  - Planos abiertos: una fila arriba de la cabeza (y ≈ 250–380, columnas x = 200 / 540 / 870).
  - Planos cerrados: a los costados de la cara (x ≈ 190 y 880).
  - Nunca sobre la cara.
- **Movimiento:**
  - entran con un pop (tamaño real, no `scale`) y una sombra difusa suave;
  - flotan apenas (6 px);
  - salen con el corte de la toma, o se encogen si les sigue otro símbolo en el mismo lugar.
- Con la host siempre a la vista, las **uniones por movimiento de cámara vuelven a ser en un solo barrido**.
- **Los motion graphics terminan de animarse antes del movimiento de cámara** (2026-10-25, borrador B: "todos los motion graphics deben terminar de animarse antes de que se haga el movimiento de cámara").
  - En una toma que termina con un barrido, los símbolos salen (se encogen) y terminan unos cuadros antes de que arranque: `hastaMs` = inicio del barrido (medido con la velocidad cuadro a cuadro) menos ~30 ms.
  - En una toma que empieza con un barrido, entran con la cámara ya quieta.
  - Si un ícono queda muy corto por eso, adelantarlo a la palabra anterior ("esté vigente").
- **La primera toma (el gancho) va sin gráficos** (2026-10-25, "en el primer video no pongas gráficos").
- **Webs dichas en voz: van como gráfico, no como subtítulo** (2026-10-25): píldora Space Indigo arriba de la cabeza.
  - Lleva un globo en un círculo Chili y la dirección en Be Vietnam SemiBold marfil, que se escribe de izquierda a derecha mientras la dice (`tipo: "web"`).
  - Más angosta que un subtítulo, con aire a los costados: 760 × 90 px, letra 38 px.
  - Su subtítulo se omite (grupo con "-").
  - Los íconos que acompañaban esa frase ("horarios y requisitos") se sacaron: la web es lo que se destaca.

## Placas de explicación (2026-10-25)
- Cuando la persona enumera ("Primero… / Segundo… / Tercero…"), cada explicación lleva una **placa gráfica con motion graphics** que refleja lo que dice. Componente `PlacaExplicacion`, prop `explicaciones` de `ReelCtpsfpc`.
- **A pantalla completa** con su voz encima: en estas tomas, de cuerpo entero, no hay aire sobre la cabeza para graficar (280–550 px). La persona se ve diciendo el comienzo ("Con su firma y sello") y después entra la placa, hasta el final de la toma (sale con el corte).
- **Estética del playbook:**
  - fondo Ivory Mist;
  - encabezado con el número en un círculo Chili ("01") y el título en **Almarai ExtraBold**, con una bajada en **Be Vietnam Pro Medium** gris;
  - grilla **bento** de módulos redondeados (margen 60, separación 24, 468 × 486) en Indigo, Wisteria, Chili y Dim Grey, cada uno con un ícono hecho de formas geométricas planas (Bauhaus) y su título en Almarai.
- **Animación:**
  - la placa se abre con un círculo desde el número;
  - cada módulo entra (escala desde su esquina) en la palabra que nombra lo que muestra;
  - el ícono se arma por partes: renglones, firma que se dibuja, sello que aparece.
- **Subtítulos encima de la placa:** una franja Indigo abajo (desde y = 1400, con un cuarto de círculo Wisteria y un medio círculo Chili en los bordes), así la letra blanca se lee.
- Textos de los módulos cortos (2–4 palabras) y fieles a lo que dice; nada inventado.
- **Pasos cortos** (~2–3 s, uno por toma, como en "¿Qué pasa con tu traducción?"): dos módulos anchos (960 × 486), con el ícono a la izquierda.
  - Ella se ve diciendo el número y el verbo ("1. Verificamos", al menos ~0,9 s, para que no sea un flash) y después entra la placa.
  - Si el paso sigue en la toma siguiente, la placa la cruza (`hastaClip`).
- **"Importante" o aclaraciones:** también llevan placa, con "!" en el círculo del número.
- **El título del encabezado va en un solo renglón** (máximo ~770 px a 100 px de Almarai). Si no entra, se acorta y el resto pasa a la bajada ("Requisitos y pago" → "Requisitos" + "Control formal y pago del trámite").

## Placa final (2026-10-25)
- `PlacaCtpsfpc`, 4 s, entra por corte.
- **Debajo del logo, la web: "www.traductoresantafe.org.ar"** (prop `sitio`).
  - Be Vietnam Pro Medium, 40 px, en Space Indigo.
  - El conjunto logo + web va centrado entre las dos bandas, medido sobre lo que se ve del logo: el SVG trae ~12 % de aire arriba y abajo.
- Fondo Ivory Mist; arriba y abajo, dos bandas de módulos Bauhaus con la paleta que se arman en cascada.
- En el medio, el logo azul (globo + CTPSFPC).
- La referencia anterior era más simple: fondo claro con el logo chico, sin animar.
