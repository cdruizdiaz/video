# Criterios CEI (correcciones de la cliente; sumar acá cada una nueva)

## Tipografías
- **Gráficos (placas, títulos, carteles): siempre Filson Pro o New Spirit** (`src/marcas/cei/fuentes.ts`: `FILSON`, `NEW_SPIRIT`; archivos en `public/marcas/cei/fuentes/`). Nada de Fraunces ni otras.
- New Spirit (serif) para palabras que se destacan en títulos ("country?") y nombres de actividad; Filson para el resto.

## Subtítulos (`Subtitulo` en `MuseoUmbral.tsx`)
- Filson Pro Medium 72 px ("15" de CapCut), frases de 2–3 palabras, fondo hueso, letras naranja.
- **Entran y salen en seco** (prop `seco`), sin animación.
- **Si el chico habla inglés: doble subtítulo.** Inglés arriba con colores invertidos (fondo naranja, letras blancas, 72 px) y debajo el español en 44 px ("9" de CapCut), fondo hueso y letras naranja. Referencia: `Downloads/copy_1F0E1B42-….mov`. Si habla español, subtítulo normal. Detectar el idioma con `whisper-cli -l auto -dl` (forzar `en` traduce el español y engaña).
- Alineación de palabras: `scripts/alinear.py` (es) y `scripts/alinear_en.py` (en).

## Cortes de chicos hablando
- Cortar **pegado al habla**: el clip arranca apenas empieza a hablar y termina apenas dice la última palabra (se afina con la energía del audio; `armar_plan_ninos.py`).
- Respuestas de un chico: empezar en la frase que corresponde (p. ej. Ghana desde "suelen ser…").

## Carteles de país
- Un poco más abajo (y = 340 en 1920) y con la bandera del país (`Banderas.tsx`).

## Gráficos
- **No repetir diseño ni colores entre placas de una misma pieza ni entre piezas**: cada pedido gráfico cambia color de fondo, composición y animación (p. ej. placa de la pregunta azul con flor de borde blanco; placa final naranja con flor hueso que gira y anillos).
- Placa de pregunta: fondo azul simple (sin brillos ni flores desenfocadas), flor con borde blanco.

## Material
- Crudos de iPhone: HDR (HLG) → proxies con tonemap a SDR BT.709 (`hacer_proxies.sh`).
- Halloween día 2 (`Clientes/CEI/Halloween 2`): chicos que se entrevistan entre ellos → pieza aparte, no se mezcla con "Los chicos".

## Placas y audio (2026-10-30)
- **La música sube en la placa final** (sin voces): de `MUSICA_BAJO_VOZ` a `MUSICA_PLACA`, empezando un poco antes de que termine la última toma (`MUSICA_ANTICIPO`). Mantenerlo en todo video del CEI.
- Placa final del nombre de la actividad **corta** (~1,8 s) para que el logo del CEI entre enseguida.
- Placa de apertura: la flor entra **lenta** y cada cosa que aparece lleva efecto de sonido (Mixkit: whoosh en la flor, pop por palabra, pop más marcado en la palabra destacada).

## Tomas de chicos
- **Enderezar** las tomas chuecas (`retoques_ninos.py`: mide la inclinación y agrega `rot`/`esc` al plan). Verificar con grilla antes/después: si da el tope (±5°) por líneas del fondo (grabados, dibujos), no se aplica.
- El chico que titubea: sacar silencios y muletillas (`sinPausas` en `segmentos_ninos.json`: salta huecos de más de 0,3 s entre palabras).
- El arranque se busca tras la última pausa antes de la primera palabra, para no meter la cola de la pregunta del entrevistador.

## Correcciones 2026-10-30 (3)
- Placa de apertura: la flor **gira lenta sobre su eje desde el primer cuadro, sin animación de entrada** (solo las palabras entran).
- **Carteles de país: no pisan cabezas** (pelo, sombrero, cuernos) ni se superponen entre sí: aparecen en seco en el cuadro del corte, a la altura que da `ubicar_carteles.py` (MediaPipe → `y` por cartel; tope 340 px, mínimo 130).
- **Música en la placa final: sube fuerte, como de cierre** (queda por encima de las voces, ≈ −15 dB de media contra −18 de las voces) y baja con el fundido final. Con música hecha a −14 LUFS: bajo voces 0,07 → placa 0,9.
- Subtítulos: respetar lo que dice la cliente aunque Whisper/alineación lo escriba distinto ("le sacan la tela", "si por ejemplo" sin coma); partir los subtítulos en las comas.

## Correcciones 2026-10-30 (4)
- **Placa de apertura sin efectos de sonido.**
- **Carteles de país pegados arriba de cada cabeza** (sin aire de más y sin pisar pelo/sombrero/cuernos): un cartel por toma, con su propia altura (`ubicar_carteles.py`, de 130 a 700 px).
- Cada cartel va en su propio `<Sequence>` (con un `find` por cuadro el cartel de Indonesia quedaba pegado en el render completo, aunque en un still se veía bien: **siempre verificar con un render desde el cuadro 0, no solo con stills**).
- **Placa final entra con un barrido** (franja naranja de izquierda a derecha sobre la última toma, con borde claro; el texto entra deslizando con desenfoque), sutil y animada, no corte seco.
- En Filson Pro la "I" mayúscula se parece a la "l": "It's" ya va con mayúscula.

## Correcciones 2026-10-30 (5)
- **Todos los carteles de país a la misma altura** (la del cartel de China 2, y = 287 en 1920; `ubicar_carteles.py` la fija para todos). Reemplaza a la regla de un cartel por cabeza.
- **Placa de apertura sin flor**: solo el texto "What did you learn about your country?" centrado.

## Entrevistas entre chicos (2026-10-30)
- Pieza aparte de "Los chicos": preguntas y respuestas en inglés, doble subtítulo para todas, solo las partes donde hablan, sin silencios ni muletillas; después de las preguntas, inserts de la actividad y la música sube; placa final **de diseño distinto** a las anteriores (azul/naranja/etc. ya usados): paneles que se abren sobre cielo.

- Cartel de país con bandera GRANDE (letra 72 px, bandera 112 px, y = 270): la cliente pidió que sea más notorio (2026-10-30).
- Entrevistas: ordenar para que se entienda (primero la que nombra el país, después las respuestas de ese país); el cartel de país sigue a la sala/fondo, no al clip (4675 = Ghana). La última entrevista se deja unos segundos más para enganchar con los inserts. Los inserts no deben repetir los de las otras piezas.
- La música sube **apenas el último chico termina de hablar** (no recién en los inserts) y los inserts arrancan al toque. Muletillas "ehhh": se detectan como vocales sostenidas de tono estable (≥ 0,4 s) que la alineación y Whisper no marcan; cortarlas a mano con `tramos`.

## Testimonios (2026-10-30)
- Mismo estilo que las entrevistas: solo las partes donde hablan, sin silencios ni muletillas, subtítulo en seco; en español el subtítulo es simple (sin traducción). Después, inserts nuevos con la música que sube, y una placa final con diseño distinto a las anteriores (iris vino).
- Se omiten (se cortan) las frases de relleno ("Bueno, la verdad que…", "ahora vamos a seguir…") con `omitir` en `segmentos_testimonios.json`.
- **Subtítulos con gramática correcta**: mayúscula al empezar cada frase, comas y puntos, palabras completas (revisar el texto de Whisper contra el audio ya recortado). Inserts: tomas bien iluminadas y compuestas (altares, chicos disfrazados, fachada), nada de nucas ni multitudes de espaldas. Las placas finales entran con una transición clara (barras, paneles), sin aros decorativos.
- **Subtítulos en frases lógicas** (testimonios, 2026-10-31): no cortar por cantidad de palabras sino por sentido (comas, puntos, frases con su complemento), hasta 2 renglones. `frases` por chunk en `segmentos_testimonios.json`. Cortar el final de una toma **antes** de la "y" o conector que arranca la frase siguiente (la alineación suele ubicarla pegada).
- **Subtítulos pegados a los cortes** (2026-10-31): un subtítulo nunca cambia un cuadro antes o después del corte de video (deja un cuadro con el texto viejo o sin texto = glitch). `armar_plan_testimonios.py` los ajusta al corte; revisar con hoja de cuadros n-1, n de cada corte.
- **Audio de voz sin chasquidos entre tomas** (2026-10-31): no usar fundidos por `volume` de Remotion en cada tramo de voz (el volumen cambia por cuadro, en escalones, y suena un "ruidito" en cada corte). Hornear la voz en un solo wav con fundidos suaves de ffmpeg (ver `armar_plan_testimonios.py`); si otra pieza del CEI tiene el ruidito, aplicar lo mismo.

## Historias de IG (montaje musical, 2026-11-03, visita al cementerio)
- **Cortas (~15 s)** y **sin tomas repetitivas**: una sola toma por momento (no dos del colectivo, no varios grupos parecidos entre tumbas).
- **Sin placa gráfica final**: cierra con la última toma y fundido a negro (el título de apertura sí va).

## Placas de serie "The book of wishes" (2026-11-16)
- **Colores del CEI sin irse del azul royal y el vino**: nada de degradés índigo/violeta ni chispas que la hagan parecer "una galaxia".
- **Sin el medallón/flor dorada del libro** en el centro ("me parece horrible"): título + episodio + "Next episode" sobre el azul, con marco y esquinas doradas.
- Le gustó la entrada como **tapa de libro que se cierra** sobre la pantalla.
