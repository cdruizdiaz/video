# Criterios para reels de entrevista o persona hablando

Instrucciones para aplicar **de entrada**, desde el primer borrador, en cualquier reel 9:16 de persona hablando (`HablaSubtitulada`, o `EntrevistaRadio` para el montaje con insertos y sonidos). Salen de las correcciones del cliente, una por una, en `2026-10-06_volto_fashion-week`:
- pieza 6, entrevista de radio, una cámara (2026-10-08);
- pieza 1, "¿Tenés una marca de ropa?", dos cámaras (2026-10-09, borradores `_d` a `_j`);
- pieza 5, "Vení, seguime", una cámara en mano caminando (2026-10-13/19, previews v1–v5, borradores B–J, entregas v1–v3).

Si un brief dice otra cosa, manda el brief. Si un trabajo enseña un criterio nuevo, se suma acá.

Ejemplos completos en `src/trabajos/2026-10-06_volto_fashion-week/`:
- `composiciones.ts`: `marcaRopa` (dos cámaras) y `entrevistaRadio` (una cámara);
- `EntrevistaRadio.tsx`: insertos, sonidos y música del final.

## Al arrancar (lista de control)
1. **Material.** Con `ffprobe`, revisar cada original: `color_range`, HDR (`arib-std-b67`), fps y orientación (ver Color).
2. **Sincronía.** Si hay dos cámaras, sincronizar con `sincronizar.py` (GCC-PHAT). El audio sale siempre de la cámara con micrófono.
3. **Voz.**
   - `preparar_voz_entrevista.sh <clip> 15`: voz suave para el montaje.
   - Voz limpia solo para medir.
   - Transcripción corregida en `corregir_transcripcion.mjs`.
   - **Medir el nivel de cada persona que habla,** no solo el del clip: un entrevistador lejos del micrófono puede quedar 26 dB abajo y DeepFilterNet lo borra (ver Audio).
   - **Palabras dudosas:** retranscribir el tramo con `--prompt` (nombres: "Volto, agente de IA") y comparar con la transcripción del audio de la 2ª cámara. Si las dos dicen lo mismo pero el sentido pide otra cosa ("la gente" / "el agente"), subtitular lo que tiene sentido, marcarlo ⚠️ en `TRABAJO.md` y preguntarlo en la entrega. Si el usuario dicta lo que se dice, eso manda ("nos hizo el vendedor" → "nos dicen los vendedores").
4. **Preview.** Solo cortes y planos, sin subtítulos ni gráficos; el cliente aprueba los cortes.
5. **Guion de subtítulos como tabla** (`#`, tiempo, texto). El cliente marca uniones y cortes por número; después se escriben a mano en `subtitulos.grupos`.
6. **Primer borrador completo,** con todo lo de abajo ya aplicado.
7. **Revisión antes de entregar cada borrador:**
   - hoja de cuadros clave: cada inserto, cada cambio de plano y cada zoom; mirar los gráficos en un cuadro **después** de que terminaron de entrar y **antes** de su desvanecido (en los últimos 6 cuadros se ven a medias);
   - `scripts/detectar_glitches.py` sobre el borrador (cuadros vacíos, congelados, flashes);
   - control de audio (ver Audio);
   - `npm test` y `npm run lint`.
8. **Borradores siempre a resolución completa:** 1080×1920, `--crf=20`, en `revision/borrador_<pieza>_9x16_<letra>.mp4`, con el audio pasado por `scripts/terminar_audio.sh`. Los de 540×960 se ven borrosos. Para verlo en el celular, una copia liviana aparte (ver `CLAUDE.md` → Render).
9. **Cada pedido del cliente va también a `guion_<pieza>.md` y a `TRABAJO.md`,** con el valor anterior y el nuevo (sirve para no volver atrás).

## Cómo trabajar con el cliente
Errores de proceso de la pieza 1 de Volto (2026-10-09): 11 borradores (`_d` a `_n`) para un reel de 48 s. Para no repetirlos:

1. **Diagnosticar antes de corregir.** Si algo se ve o suena mal, primero buscar la causa en el material: rango de color, fps, sincronía, un error de la transcripción. Solo después decidir si hace falta corregirlo. El color se intentó arreglar dos veces con curvas antes de ver que el MOV era de rango completo.
2. **Repetir la interpretación cuando el pedido es ambiguo,** en una línea, antes de renderizar. Ejemplos que confundieron:
   - "corte con zoom" eran cortes secos a planos más cerrados, no empujes;
   - "2:30" eran 2,30 s;
   - "video 1 / video 2" eran la cámara de frente y la de costado.

   Si la duda cambia mucho el resultado, preguntar. Si no, aplicar lo más probable y decir cómo se interpretó.
3. **Ofrecer variantes para las intensidades.** En una hoja de cuadros, 2 o 3 valores lado a lado (suave, medio, fuerte), así se elige en una vuelta. Aplica a zooms, tamaños, posiciones y colores. El zoom de "sí o sí" pasó por 1,08 → 1,2 → 1,5 → 1,3 y los planos de "Tenés que contestar" por 1,12 → 1,18 → 1,55 → 1,1.
4. **Arrancar mínimo y sumar si lo piden.** No agregar sonidos, sombras, nodos ni elementos que nadie pidió. El whoosh del logo, el sonido del zoom, el asterisco de la conexión y la sombra del logo se sacaron después. Punto de partida: un pop por gráfico y nada más.
5. **Gráficos con aire de sobra desde el principio** (bajarlos si piden "más cerca"). Casi todos se tuvieron que subir porque tocaban la cabeza.
6. **Verificar fino los cortes y subtítulos del gancho y del remate.** Son los que más se notan, y la energía engaña: el final de una palabra, una oclusiva del medio, una cola que el DTW le pasa a la palabra siguiente. Ante la duda, una hoja cuadro a cuadro alrededor del corte.
7. **Borrador completo solo cuando hace falta.**
   - Ajustes de posición, tamaño o color: cuadros sueltos o una hoja de contactos en `revision/`.
   - Render completo: cambios de tiempo, cortes o audio, o cuando se juntaron varios pedidos.
   - Si el cliente manda pedidos de a uno, sugerirle que los junte.
8. **Cuidado con las herramientas:**
   - formatear con prettier solo los archivos que se tocaron, y sin reformatear archivos enteros que no estaban formateados;
   - escribir los scripts largos a un archivo del scratchpad, no pegarlos inline en la terminal;
   - prettier sobre un archivo **nuevo sin versión en git** también reformatea lo que ya estaba (no hay forma de ver la diferencia): formatear solo lo que se escribió, o avisar.

## Color y material
- **Primero, el original bien convertido; nada de corregir el color a mano.** Dos intentos de igualar cámaras con curvas y LUT fueron rechazados ("difuso", "muy feo"): el cliente quiere el color original de cada cámara.
- **iPhone en rango completo** (`yuvj420p`, `color_range=pc`): si se copia tal cual al proxy, se ve mal. Convertir a rango estándar:
  - filtro `scale=in_range=full:out_range=limited,format=yuv420p`;
  - etiquetas `-color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709`.
- **HDR HLG:** bajarlo a SDR (tonemap mobius, `preparar_crudos.sh`).
- **Si el cliente manda un archivo con el color retocado:**
  - copiarlo a `C:/Videos/crudos/<ID>/<clip>_retocado.mov` y verificar la copia con `cmp`;
  - sincronizarlo con el original por correlación del audio en varias ventanas (puede durar más o venir a otros fps);
  - si viene vertical y encuadrado, usarlo sin `encuadre`;
  - rehacer con ese archivo los recortes de persona.
- **Proxies derivados en archivos aparte** (`<clip>r.mp4`, `<clip>n.mp4`). Borrar de `public/` los que dejan de usarse.

## Planos y montaje
- **Dos cámaras: manda la que mira a cámara** (para el cliente es el plano más lindo). Lleva el gancho, el remate y la mayor parte del tiempo; la de costado queda para las explicaciones.
- **Una cámara: como máximo tres planos.**
  - El original apenas recortado arriba (1,08 anclado abajo, `origen: "50% 92%"`).
  - Un cerrado sobre cada persona (1,6). Va sobre **quien habla** cuando presenta o pregunta.
  - No usar plano medio.
- **Cada corte del montaje cae en un cambio de plano.** Excepción: si la frase sigue (una pregunta partida), mismo plano antes y después.
- **Dónde cambiar de plano:**
  - en el **inicio de la frase** que marca el cliente ("porque todas las marcas…" → ahí ya está el otro plano);
  - nunca antes de que **termine la última palabra** de la frase anterior: medir el final con la energía de la voz limpia;
  - el plano del gancho dura hasta que la palabra final se oye entera, con un poco de margen ("acá": el cliente lo quiso hasta el segundo 2,30).
- **"Hasta el segundo 2:30" = 2,30 s.**
- **El primer plano de una toma arranca con la toma** (2026-10-22): si se marca unos ms después del inicio, esos cuadros salían vacíos (un "glitch" de 1–8 cuadros). Ya lo corrige `tramosDePlanos`; igual, revisar cada borrador con una detección de cuadros vacíos o repetidos.
- **Cortes pegados a la voz:**
  - sin silencios entre tomas, cortando en valles de energía y nunca dentro de una palabra;
  - **sacar la pausa después de un remate** ("…más rápido.") y entrar con el otro plano ya hablando;
  - sacar presentaciones redundantes si el cliente quiere ir al grano.
- **No dejar flashes:** un plano de menos de ~1 s entre dos iguales se ve como un salto.
- **Dejar respirar el final de una frase** ("Vení, seguime", "resolver eso"): unos 0,5 s después de la última palabra. Si la siguiente viene pegada, `pausaMs` (la imagen sigue, la voz corta) con `ambienteMs` (ambiente de un tramo sin voz del mismo clip). Antes de cortar una palabra larga, verificar dónde termina de verdad (en "canti-dad" el valle de la "d" parecía el final; se confirmó con la boca cuadro a cuadro).
- **La persona siempre en cuadro.** Si en el original sale de cuadro (cámara en mano), plano agrandado y quieto anclado al borde por donde se fue. **Nada de cuadros congelados:** el cliente los vio "trabados" (`congelarMs` existe, pero no usarlo en estos reels).
- **Final:** frase completa y clara. La claridad manda sobre el máximo de 60 s.
- **Sin títulos de apertura,** salvo pedido.

## Zoom
- **Empuje para remarcar una palabra** ("sí o sí"):
  - rápido: **~200 ms** (450 ms se sentía lento);
  - **1,3×** (1,08 y 1,2 no se notaban; 1,5 era demasiado);
  - anclado hacia el lado de la persona (`origen` en su borde, p. ej. `"0% 28%"`) para que quede más centrada y sin aire de un costado.
- **Empuje para una frase explicativa** ("Eso significa que…"): **1,3×** en ~450 ms, anclado hacia la persona (1,15 "no se notaba").
- **Empuje leve** (1,1) cuando acompaña un gráfico ("si tiene una pregunta").
- **Frase que sube de intensidad** ("Tenés que contestar / las preguntas / más rápido"):
  - **cortes secos** a planos cada vez más cerrados y **quietos** (`fijo: true`, sin el acercamiento lento), uno en el inicio de cada tramo;
  - escalones **1,1 / 1,2 / 1,3** (1,12 casi no se notaba; 1,55 dejaba "la cabeza gigante");
  - no son empujes animados.
- **Si el cliente duda de dónde cae un corte,** verificarlo antes de mover nada: hoja cuadro a cuadro alrededor del corte, comparada con el cuadro en que entra cada palabra.
- **Persona caminando con cámara en mano** (2026-10-13): planos cerrados con `seguir: true` (prop `seguimiento`, de `seguir_cara.py` del trabajo `2026-10-06_volto_fashion-week`: MediaPipe, 10 cuadros/s) para que quede encuadrada aunque camine. **Sobre todo cortes secos** entre el original y planos quietos más cerrados (1,35–1,5×, `fijo: true`); **movimiento de cámara solo en 2-3 frases a destacar** (`zoomDesde` + `rampaMs`, ease in-out, hasta ~1,4–1,65×): "no lo uses siempre, solo para resaltar a veces". En cada corte, ≥ 0,3 de diferencia de escala.
- **Los zooms no llevan sonido.**
- **Cuidar la calidad:** un plano que ya viene recortado de uno horizontal (608 px de ancho) se ablanda rápido con el zoom.

## Subtítulos
- **Con marca de tipografía fina** (RASTRO, Inter): `peso: 500`, `tamano: 64`, `sinBorde: true` (2026-10-21: "muy gruesos… sacale el trazo negro"). El estilo Volto (New Black con borde) no es para todos los clientes.
- **Escritos a mano** (`subtitulos.grupos`).
  - Nunca partir un nombre propio ni dejar un renglón colgando en preposición o artículo.
  - Lo que dice otra persona sin aportar va sin subtítulo (`"-Exactamente."`).
- **Estilo:** `{ estilo: "reel", tamano: 74, seco: true }`.
  - New Black blanco con borde negro.
  - Sombra paralela negra sólida (3 px a la derecha, 7 px abajo) y una leve sombra difusa.
  - Entran y salen en seco.
- **Renglones:**
  - cortos, hasta ~680 px; si no entra, dos renglones en pirámide;
  - nunca una palabra corta sola en un renglón;
  - si el cliente quiere dos palabras juntas en un renglón ("probablemente abre"): `=` al principio del grupo.
- **Duración mínima 0,5 s.** En enumeraciones rápidas, juntar de a dos.
- **Sincronía exacta:**
  - verificar los inicios y finales dudosos con la energía de la voz limpia;
  - el DTW de Whisper se corre hasta ~0,4 s: estira palabras sobre las pausas ("rápido" hasta 18,53 cuando terminaba en 17,80) y le pasa la cola de una palabra a la siguiente (el "-po" de "tiempo" como "Y");
  - **un valle de energía no siempre es el final de una palabra:** las oclusivas del medio ("a-**c**á", "ti**em**po") hacen un silencio corto de 30–60 ms. Antes de tomar un valle como final, mirar que después no siga la misma palabra; el final real es donde la energía cae y queda abajo.
  - **un subtítulo dura hasta que la palabra termina de oírse**, aunque cruce el cambio de plano ("tu marca acá?");
  - corregir en `TIEMPOS` (inicios) y `FINES` (finales) de `corregir_transcripcion.mjs`, y comparar la transcripción antes y después: solo deben cambiar esas palabras.
- **Citas** (lo que dijo otro): entre comillas angulares « » de principio a fin de la cita, aunque cruce varios subtítulos (2026-10-23). En New Black, las comillas inglesas ” y las rectas cierran mal (salen como de apertura).
- **Prefijos unidos (RAE):** "súper" delante de un adjetivo va pegado ("supercontentos", "superproductivo"). Como los subtítulos a mano emparejan palabra por palabra con la transcripción, las dos palabras de Whisper se unen en la transcripción (`UNIR` de `2026-10-19_volto_radio/transcripcion_trabajo.py`).
- **Números dichos como aproximación, en letras:** "tres, cuatro páginas", no "3 o 4". Se corrige en `TEXTO`.
- **Amarillo (#efc512) solo en las palabras que elige el cliente.** Proponer pocas.
- **Partes sin la persona** (lee de una tablet, voz en off): mostrar **lo que dice**, con la identidad del cliente de la historia (2026-10-21: "cuando dice el icónico Big Ben… quiero que lo que diga se refleje en lo que se ve"): motion graphic con los recursos del manual de marca, un gráfico por idea nombrada, cada uno en la palabra. Grabaciones de pantalla solo donde acompañan lo que se dice, **centradas**, y en tramos elegidos para cada frase (p. ej. el disfraz de Halloween cuando dice "Halloween").
- **Si un gráfico ya muestra la frase** ("En Volto resolvemos"), se omite ese subtítulo.

## Gráficos (insertos)
Sin música el video queda plano: **graficar lo que se nombra**, cada gráfico con un sonido corto (`src/plantillas/comunes/Insertos.tsx`).

**Dónde van**
- En el aire de arriba de la cabeza, centrados, **sin tocarla:** dejar aire entre el gráfico y el pelo en cada plano. Revisar cada uno en un cuadro.
- Nunca tapar caras.
- El cliente pidió "subilos para que no lo tapen" para todos: arrancar arriba, no pegados a la cabeza.
- Excepción: un título de marca puede ir **cerca** de la persona, más abajo que el resto, pero sin tocarla.
- **Con un cerrado, dejar el aire en el encuadre** (2026-10-21, consumos-del-mes: "no la tapes, usá el aire de arriba"): anclar el cerrado más arriba (1,45 con `origen: "50% 60%"` en vez de 72 %) para que quede lugar sobre la cabeza; nunca bajar el gráfico al pecho.
- **No graficar lo que la persona ya muestra a cámara** (el libro en la mano que señala).
- **Personas nombradas: la cara en un círculo, sin el nombre ni texto debajo** (el subtítulo ya lo dice). Si la foto es CC BY-SA, avisar que pide crédito y proponer ponerlo en el texto de la publicación.
- **Todos los gráficos a la misma distancia de la cabeza** (2026-10-21): anclarlos por el borde de abajo, ~80 px arriba del pelo medido en un cuadro de cada uno; los textos, centrados.
- **Textos de los gráficos con la tipografía de la marca** (RASTRO: Inter), aunque el gráfico copie la estética de otra cosa (colores, formas): "cambiá la tipografía pero dejale su estética".
- **Si se equivoca un nombre,** el texto como lo dijo se tacha y aparece el correcto ("La Fábrica" → "*la Factoria").

- **Tiempos de un inserto:** `hastaMs` igual al fin exacto de la toma da error ("cae fuera del montaje"): usar 10 ms antes. Un inserto puede seguir en la toma siguiente si es contigua en el montaje (el "= más productivos" siguió 1 s en el plano general).
- **Medir antes de ubicar:** cuadros de cada plano con una grilla cada 200 px (`drawgrid`, ver `CLAUDE.md` → ffmpeg) para saber dónde empieza el pelo en cada uno; los gráficos van ~80 px arriba. El cliente prefiere poco aire ("bajalo mucho más, que no haya tanto aire"), no el gráfico pegado al techo.

**Cómo se mueven**
- Entrada con un rebote corto.
- **Salida en seco en el cambio de plano o de toma** (piezas 1 y 6). Con los gráficos de vidrio de la pieza 5, en cambio, desvanecido corto de 6 cuadros (ver "Gráficos de vidrio").
- Animar con `zoom` o tamaños reales, nunca con `transform: scale` (sale pixelado).

**Estética**
- Planos, con la **paleta de la marca** y nada más (Volto: #262626, #f5f5ed, #a0c9cb, #ebdbb7 y el degradé #f97d55 → #95a8a0 → #406162).
- El amarillo de los subtítulos no es color de marca: no va en los gráficos.
- Que no parezca "hecho con IA": nada de glitch, HUD, texto que se decodifica, puntitos que viajan ni nodos.

**Qué gráfico para cada cosa**
- **Logo del evento al principio:**
  - en su **tarjeta blanca**, grande (~800 px), **detrás de la persona** (recorte con `scripts/mascaras.py` → `detras` del inserto);
  - la cabeza tapa solo una parte y la palabra importante se lee ("FASHION");
  - entra con un **pop**, nunca con barrido o whoosh.
- **Otros logos de marcas** (Tienda Nube): en su tarjeta blanca original, centrados, cerca de la persona sin tocarla. Pedir el archivo al cliente; agrandar los chicos con Real-ESRGAN.
- **Marca nombrada en una frase** ("En Volto resolvemos"): título animado `InsertoMarcaTexto`.
  - "En" + logo (con pop) y, pegada debajo (interlineado chico), la palabra clave sobre un **trazo de resaltador** inclinado que la cruza de izquierda a derecha.
  - Resaltador en un color de la marca (naranja #f97d55) con tinta oscura (#262626).
  - Cerca de la persona; reemplaza al subtítulo.
- **Ilustraciones de referencia del cliente:** recrearlas en vector con la paleta de la marca, sin fondo y en un tamaño moderado (~440 px). Ejemplo: `InsertoTiendaOnline`, celular con brazo y bolsas.
- **"3 o 4 páginas"** y parecidos: ventanas de navegador **sutiles** (`InsertoVentanas`).
  - Translúcidas, sin rebote, entran subiendo apenas, en cascada, una por golpe.
  - Tamaño ×1,4.
- **Preguntas:** globos de chat planos con "?", grandes y **sin sombra** (`InsertoPregunta`).
  - Uno grande blanco y dos chicos celestes.
  - **Un pop por globo** (en escalera de tono); salen en seco.
- **Canales** ("dentro de tu WhatsApp, dentro de tu Instagram y conectados al catálogo"):
  - íconos que entran cuando se nombran y, en "conectados a…", el ícono central unido con **líneas lisas** que se dibujan una vez (`InsertoConexion`);
  - sin nodos ni el asterisco de la marca si no se nombra.
- **Cifras** ("un millón y medio de seguidores"): número grande (~150 px) que cuenta hasta su valor (`InsertoCifra`), cerca de la persona, con un **sonido que sube**.
- **Conceptos:**
  - 24/7: `InsertoReloj`;
  - "robotizar": `InsertoRobot`;
  - enumeraciones ✕/✓: `InsertoLista`;
  - usuario de redes: `RotuloUsuario`.
- **No repetir seguido los recursos de las piezas anteriores** (2026-10-22, Volto radio: "la idea es intentar no repetir tan seguido los recursos"): el anillo del 80 %, las píldoras y la palabra sola de "Vení, seguime" no se reusan en la pieza siguiente. Para cada idea, un gráfico nuevo dentro del mismo look (vidrio + tipografía de la marca): cifra grande con barra (`ProReparto`), textos que se revelan (`ProTextos`), frase en bloque (`ProFrase`), velocímetro (`ProVelocimetro`), reloj por porciones para un relato de horas (`ProReloj8`), lema con resaltador (`ProLema`), flecha a una cara que bosteza (`ProSueno`), etiquetas blancas (`ProEtiquetas`), cifra que se corre y escribe lo que significa (`ProIgual`). Antes del primer borrador, listar qué gráficos usaron las piezas recientes del cliente.
- **Sobre un fondo claro** (cartel blanco detrás), la letra blanca no se lee: tarjeta de vidrio con letra oscura o chip blanco (2026-10-23).
- **Un gráfico que termina de armarse al final de la toma** se ve apenas unos cuadros: adelantar la animación o dejarlo seguir un poco en el plano siguiente (el "= más productivos" duraba 5 cuadros).
- **Variar el lenguaje gráfico entre piezas del mismo cliente** (2026-10-14, "Vení, seguime"): si dos reels ya usan tarjetas e íconos, el siguiente va con otro estilo para que no parezca "todo lo mismo". ⚠️ En Volto, el trazo gustó en el borrador B pero el cliente lo cambió enseguida por el **look profesional de vidrio** (ver "Gráficos de vidrio" abajo): para Volto, arrancar directamente con el vidrio. Familia de trazo (`src/plantillas/comunes/InsertosTrazo.tsx`: `TrazoVentas`, `TrazoEmbudo`, `TrazoMensajes`, `TrazoEnchufe`, `TrazoChat`, `TrazoTilde`, `TrazoBarras`, `TrazoFlecha`): dibujos de línea que se trazan con lo que se dice, línea clara con sombra paralela, acento naranja, sin tarjetas ni rebote.
  - Con la persona en plano cerrado (1,45×) hay que subirlos (`y` 250–290): a 330 rozaban el pelo.
  - Un gráfico por idea nombrada, aunque la frase sea corta: tomarse los tiempos de las palabras de `transcripcion.json`.
- **Placa final:** entra por corte, solo se anima el logo (`cierre.corte`).

### Gráficos de vidrio (pieza 5 de Volto, "Vení, seguime", borradores C–J y entregas v1–v3, 2026-10-14/19)
Look "profesional" que el cliente eligió y aprobó (`src/plantillas/comunes/InsertosPro.tsx`). Para el próximo reel de Volto, arrancar con esto:
- **Tarjetas de vidrio translúcido flotando:** fondo translúcido con desenfoque (`backdrop-filter`) y sombra negra difusa (nunca la paralela dura). **Sin títulos ni chips** ("Crecimiento de ventas", "Estancado", "No convierte" se sacaron): solo la cifra y el dibujo.
- **Una idea, un gráfico, y simple.** Se sacaron: la percha, el círculo con tilde, las barras de "las marcas que más venden", los globos de mensajes de "no doy abasto", las barras y flechas de "resultados" (cuatro flechas probadas y descartadas).
- **Cerrar con un eco del principio:** "resultados increíbles" es la **misma tarjeta de ventas del inicio, ahora en alza** (curva naranja con área degradé, sin cifra), que llega arriba con la palabra clave.
- **Cifras:** la cifra cuenta con sonido de cuenta; el porcentaje grande ("80 %") como indicador circular de vidrio con el anillo en degradé de la marca, **sin sombra**; si la persona sale de cuadro, la cifra ocupa el espacio vacío y sube antes de que vuelva.
- **Frase clave del dolor** ("no doy abasto"): **una palabra a la vez** sobre la persona, cada una cuando se dice (`ProPalabraSola`), New Black **blanca** con sombra suave y **subrayado naranja**, un pop por palabra (palabras en naranja o celeste: descartadas). Sin globos ni otro gráfico encima.
- **Conexión agente → sistemas:** entra primero "Agente de IA" solo; al nombrar los sistemas se corre, se traza la línea fijada a las dos tarjetas y "Tus sistemas" se enciende.
- **Chat que responde:** globos de vidrio sutiles (opacidad baja, borde fino), tres puntos al escribir y el asterisco de la marca en la respuesta.
- **Enumeraciones** (stock / talle / cantidad): píldoras de vidrio alineadas cerca del margen izquierdo, **sin sonido**.
- **Íconos de redes** con numerito de notificaciones (24, 99+), no pegados arriba: cerca de la persona sin tocarla.
- **Logo del evento** sale apenas termina de nombrarse ("…Fashion Week").
- **Cierre "Escribinos":** rótulo-píldora "@volto.ai" con el recuadro al 50 %, sin flecha.
- **Salidas:** cada gráfico se **desvanece en sus últimos 6 cuadros** (no en seco a mitad de plano) y termina en el último cuadro de su toma (ni un cuadro vacío antes del corte). El desvanecido va **en cada elemento de vidrio, no en el contenedor**: un `opacity` en el padre hace que `backdrop-filter` pierda el desenfoque de golpe y parpadea (`SalidaCtx`). Revisar las salidas cuadro a cuadro.
- **Subtítulos de esta pieza en blanco** (el amarillo de "no doy abasto" se sacó en la 4ª tanda) y palabras que el cliente quiere separadas en grupos distintos ("resultados" / "increíbles", que entra cuando se dice).
- **Ortografía:** revisar contra la RAE cada texto en pantalla, subtítulos y gráficos. "a basto" quedó así en cuatro borradores y dos entregas hasta que el cliente pidió "abasto" (v3). Whisper lo había escrito bien: no separar palabras a mano sin verificarlo.

## Audio
- **Voz con menos ruido, sin robotizar:**
  - DeepFilterNet con `--atten-lim 15` en ferias o desfiles ruidosos (10 dB "no alcanzaba"); no más, para que no quede robotizada;
  - **entrada 6 dB más baja** (si no, satura y deja chasquidos).
  - `preparar_voz_entrevista.sh <clip> <dB>` → opción `audios`.
- **Tomas a -19 LUFS** (ebur128 por tramo); `loudnorm` a -14 en el render final, verificado con ebur128.
- **`cruceAudio: 1`:** un cuadro de fundido cruzado entre tomas. Sin él, cada corte deja ~20 ms de silencio.
- **Micrófono muy bajo** (2026-10-21, `2026-10-21_rastro_pau-mascota`, voz a −40 LUFS que hay que subir ~21 dB): el ruido sube con ella. DeepFilterNet con `--atten-lim 24` y pasa-altos 70 Hz, **sin** la entrada 6 dB más baja (con la voz tan suave la confunde con ruido y la borra: un tramo perdió 20 dB). Medir el fondo en una pausa **después** de llevar la voz a −19 (tiene que quedar ≲ −55 dB) y el nivel de cada tramo usado.
- **Entrevistador lejos del micrófono** (2026-10-22, `2026-10-19_volto_radio`: el conductor 26 dB por debajo del invitado): DeepFilterNet sobre el original lo borra entero (lo toma por ruido). Subirlo primero (+20 dB, limitador, pasa-altos 70 Hz) y recién ahí DeepFilterNet 24 dB; su voz va como audio aparte de su toma (`preparar_voz_conductor.sh` del trabajo). Medir el nivel de **cada persona** que habla, no solo el del clip.
- **Palabras que "se apagan"** (2026-10-21, mismo trabajo: "tiene que estar toda al mismo nivel"): con mucha atenuación, DeepFilterNet se come palabras suaves enteras ("En el": −40 dB contra −16 en la original). Medir el nivel **por palabra** con los tiempos de la transcripción (`src/trabajos/2026-10-21_rastro_pau-mascota/medir_palabras.py`) y nivelar con `nivelar_voz.py` del mismo trabajo: la palabra comida vuelve de la original y cada palabra va a la mediana (rampas cortas, las pausas no suben). Nada de `dynaudnorm` ni compresión fuerte sobre todo el clip: igualan las palabras pero suben el ruido de las pausas (quedaba 10 dB debajo de la voz). Una puerta de ruido en las pausas no cambia las palabras: no hace falta.
- **Música de fondo bajo la voz** (mismo trabajo): ~22 dB por debajo (`musicaBajoVozDb: -27` con la música a −14 y la voz a −19); a 14 dB fue "extremadamente alta".
- **Ruidos antes de la primera palabra** ("acción", claqueta): al subir la voz se oyen aunque en el original casi no se noten. Mirar la energía de los primeros cuadros y arrancar justo antes de la primera palabra.
- **Atraso del AAC de Remotion** (2026-10-21, `2026-10-21_rastro_pau-mascota`: "se mueve la boca antes que el audio"): cada render de Remotion deja el audio 42,7 ms tarde (relleno del AAC sin marcar), y se acumula si un clip se renderiza dos veces (un proxy derivado con gráficos + el reel = 85 ms). Los proxies derivados van **mudos** (`--muted`) y la voz sale del original (`audios`); el render final se corrige con `scripts/terminar_audio.sh` (adelanta 42,7 ms + loudnorm). Verificar con correlación contra el proxy: 0 ms.
- **Control en cada borrador:**
  - energía cada 10 ms alrededor de cada corte, sin caídas a silencio;
  - saltos de muestra solo en los efectos puestos a propósito;
  - pico por debajo de 0 dBFS.
- **Música:**
  - Volto, entrevista en estudio (2026-10-22/23): pidió música suave de fondo, la escuchó (Digital Clouds, ~22 dB bajo la voz) y la sacó ("no me gusta"); después pidió una "no tan corpo, pero sí tecnológica" y eligió **Deep Techno Ambience** (Mixkit 134) a -25 dB bajo la voz (~21 dB por debajo: a -30, ~26 dB, "casi ni se notaba"; "que NO tape la voz, pero no te zarpes") y -6 dB en la placa. Electrónica relajada e hipnótica sí; corporativa o "positiva" (Digital Clouds) no;
  - con ambiente ruidoso, nada bajo la voz;
  - música suave **solo al final**: entra en la última frase y queda sola bajo la placa;
  - si alguien sigue hablando después, la placa va sin ambiente.

## Efectos de sonido
- **Sutiles:** `efectosDb: -5`.
- **Pop cuando aparece un logo o un cartel.** Sin barridos (whoosh) ni sonido en los zooms.
- **No repetir:**
  - un sonido por logo (las redes comparten la notificación);
  - lo que suena seguido, en escalera de tono (ventanas, globos, días, aciertos).
- **Clic o barra espaciadora** en algunos cambios de plano que remarcan una idea, no en todos.
- **Cada efecto suena entero:** su `<Sequence>` dura hasta el final del video.
- **Si la biblioteca no tiene el sonido justo,** se puede componer por código, sin licencias. Ejemplos: `sonido_cuenta.py` (cifra que sube) y `sonido_zoom.py`.
- **Para bajar de Mixkit,** proponer 2 o 3 opciones antes (regla de `CLAUDE.md`).
