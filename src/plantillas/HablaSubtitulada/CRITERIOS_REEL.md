# Criterios para reels de entrevista o persona hablando

Instrucciones para aplicar **de entrada**, desde el primer borrador, en cualquier reel 9:16 de persona hablando (`HablaSubtitulada`, o `EntrevistaRadio` para el montaje con insertos y sonidos). Salen de las correcciones del cliente, una por una, en `2026-10-06_volto_fashion-week`:
- pieza 6, entrevista de radio, una cámara (2026-10-08);
- pieza 1, "¿Tenés una marca de ropa?", dos cámaras (2026-10-09, borradores `_d` a `_j`).

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
4. **Preview.** Solo cortes y planos, sin subtítulos ni gráficos; el cliente aprueba los cortes.
5. **Guion de subtítulos como tabla** (`#`, tiempo, texto). El cliente marca uniones y cortes por número; después se escriben a mano en `subtitulos.grupos`.
6. **Primer borrador completo,** con todo lo de abajo ya aplicado.
7. **Revisión antes de entregar cada borrador:**
   - hoja de cuadros clave: cada inserto, cada cambio de plano y cada zoom;
   - control de audio (ver Audio);
   - `npm test` y `npm run lint`.
8. **Borradores siempre a resolución completa:** 1080×1920, `--crf=20`, en `revision/borrador_<pieza>_9x16_<letra>.mp4`. Los de 540×960 se ven borrosos.
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
   - escribir los scripts largos a un archivo del scratchpad, no pegarlos inline en la terminal.

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
- **Números dichos como aproximación, en letras:** "tres, cuatro páginas", no "3 o 4". Se corrige en `TEXTO`.
- **Amarillo (#efc512) solo en las palabras que elige el cliente.** Proponer pocas.
- **Si un gráfico ya muestra la frase** ("En Volto resolvemos"), se omite ese subtítulo.

## Gráficos (insertos)
Sin música el video queda plano: **graficar lo que se nombra**, cada gráfico con un sonido corto (`src/plantillas/comunes/Insertos.tsx`).

**Dónde van**
- En el aire de arriba de la cabeza, centrados, **sin tocarla:** dejar aire entre el gráfico y el pelo en cada plano. Revisar cada uno en un cuadro.
- Nunca tapar caras.
- El cliente pidió "subilos para que no lo tapen" para todos: arrancar arriba, no pegados a la cabeza.
- Excepción: un título de marca puede ir **cerca** de la persona, más abajo que el resto, pero sin tocarla.

**Cómo se mueven**
- Entrada con un rebote corto.
- **Salida en seco en el cambio de plano o de toma.**
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
- **Placa final:** entra por corte, solo se anima el logo (`cierre.corte`).

## Audio
- **Voz con menos ruido, sin robotizar:**
  - DeepFilterNet con `--atten-lim 15` en ferias o desfiles ruidosos (10 dB "no alcanzaba"); no más, para que no quede robotizada;
  - **entrada 6 dB más baja** (si no, satura y deja chasquidos).
  - `preparar_voz_entrevista.sh <clip> <dB>` → opción `audios`.
- **Tomas a -19 LUFS** (ebur128 por tramo); `loudnorm` a -14 en el render final, verificado con ebur128.
- **`cruceAudio: 1`:** un cuadro de fundido cruzado entre tomas. Sin él, cada corte deja ~20 ms de silencio.
- **Control en cada borrador:**
  - energía cada 10 ms alrededor de cada corte, sin caídas a silencio;
  - saltos de muestra solo en los efectos puestos a propósito;
  - pico por debajo de 0 dBFS.
- **Música:**
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
