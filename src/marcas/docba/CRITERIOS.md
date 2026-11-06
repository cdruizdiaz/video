# DOCBA — criterios del cliente (se suman con cada corrección)

Cliente con varios reels. Leer esto de entrada en cada trabajo nuevo y sumar cada instrucción o corrección.
**Al terminar cada video de DOCBA (entrega final): repasar las correcciones de ese trabajo, pasarlas a la lista de control de abajo (sin duplicar ni contradecir) y avisarle a la usuaria.**

## Lista de control de arranque (resumen vigente; el detalle por tanda está más abajo)
1. **Subtítulos:** IBM Plex Sans Condensed Medium 66 px, blancos, márgenes 170 px, en seco (sin fundido), frases cortas (1–3 palabras) al ritmo de la voz, sin superponerse ni cruzar cortes de plano, sin puntos suspensivos (coma), puntuación completa y voseo. Cada uno entra **en el cuadro donde arranca la voz, nunca antes**: tiempos medidos con `arranques.py` (huecos y valles de sílaba), verificados con `verificar_sync.py`; no confiar en el DTW de Whisper. Si hay silencio dentro de una frase, el texto espera.
2. **Color:** una sola receta para todos los planos de la host (curva global tipo IMG_9332: `curves=all='0/0 0.1/0.14 0.3/0.37 0.55/0.60 0.85/0.87 1/1',eq=saturation=1.06,colorbalance=rm=0.01:bm=-0.01`); sin amarillos ni grises. Subir luz solo a ella con máscara únicamente en planos fijos sin manos/mangas oscuras (si no, titila). Comida: natural, cercana al crudo (sat ≈1,03, amarillo −0,12, sin tintes), nunca apagada ni saturada; "que den ganas de comerse la pantalla".
3. **Inserts de comida:** `Inserts cámara/Comida`, vienen verticales (`transpose=2`); uno por plato en la palabra que lo nombra; motivo centrado, enderezado, sin gelatina (elegir ventana con `jitter4.py`, < 0,2; vidstab `smoothing=12:zoom=4:optzoom=0` o directamente sin estabilizar si la toma es firme; el zoom adaptativo `optzoom=1` aleja el plano). Movimientos de cámara digitales (acercar/alejar): mínimos y suaves (≈3,5 % con ease); dos inserts seguidos del mismo plato: uno acerca y el otro aleja. Cámara lenta con RIFE solo si hay un gesto que lo pide. Cortar planos largos agregando una toma complementaria (ej. matcha: mano que revuelve C0049 desde 0:16 + caída).
4. **Copas/noche:** look de noche (sombras frías, luz media baja, viñeta); horizonte de la mesa recto; no cambiar la iluminación que ya aprobó; tomas horizontales (C0114): recortar en vertical.
5. **Planos de la host:** cerrar levemente (zoom ≈1,065 anclado abajo) para sacar el techo sucio sin cortar el cartel DOCBA; arrancar sin el "va"/claqueta; si sale del cuadro, dejar correr el plano hasta que salga (hace de transición); planos de entrada con seguimiento continuo, sin frenar la acción de ella entrando.
6. **Cortes:** sin aire entre frases, el corte cae donde la usuaria lo marca (R1 NOV: "En DOCBA…" en 0:07 y unos ms); la placa entra apenas termina "DOCBA".
7. **Sonido:** voces a −19 LUFS, voz en off limpia (DeepFilterNet); ciudad caótica en el plano de la calle; música de a poco, el beat fuerte (volumen normal) justo al terminar la frase clave y hasta que habla el plano siguiente, recién ahí baja a fondo (~0,06) y **sube en la placa, siempre** (en R2 editado se olvidó y la usuaria lo pidió: si la música viene mezclada en el video de ella, se ubica la misma pista con correlación cruzada sobre un tramo sin voz y se suma en fase; ~0,33 para que quede en el nivel de la voz). Final a −14 LUFS con `terminar_audio.sh`.
8. **Gráficos:** la carta digital como la web real (capturas en `C:/Users/LUCIA/Pictures/Screenshots/`), entra como hoja que sube con filo naranja, scroll sin espacio en blanco; placa final con logotipo del manual armándose en motion graphic.
10. **Subtítulos, sincronía (R3):** tiempos con `python scripts/alinear.py <audio> "texto" --desde s --hasta s` (alineación forzada, 20 ms por palabra; los valles de energía y el DTW de Whisper dejaron textos atrasados hasta 0,6 s), cada trozo entra en su primera palabra (−0,03 s). Trozos cortos y con sentido (1–3 palabras, pronombre con su verbo: "te lo resolvemos"); gramática: mayúscula al empezar oración, punto al final, coma y minúscula si la oración sigue ("con tu equipo," → "acompañado de…").
11. **Audio (R3):** el video solo lleva la voz de la chica, la música y, si ella lo pide, efectos; **inserts siempre sin sonido**. Revisar que las voces en off no traigan charla de fondo antes de la primera palabra (R3: 1,7 s) y cortarla; ruido de tráfico fuera. Los sonidos de notificación los pone la usuaria después. La VO arranca pegada al final de la frase de la host.
12. **Inserts (R3):** no estabilizar por defecto (clips cortos); si hay un tirón, estabilización leve (vidstab smoothing ~5; el alto se ve robótico) y RIFE ×2 sobre el 24p. Color de comida natural y cercano al original, solo realzado un poco (un realce "artificial" se rechaza); tomas oscuras (pizarrón, brindis) con más luz y sombras levantadas; un insert de detalle puede ir con zoom ~1,2. No repetir tomas en un mismo reel.
13. **Apertura con gráfico de mensajes (R3):** si la usuaria entrega la placa en .ai usarla tal cual (descomponer con PyMuPDF: `extraer_placa.py`), animación súper limpia (globo que se infla + texto que se revela), pantalla completa como celular (el teclado toca los márgenes), conversación con sentido y un nombre por emisor, tipografía clásica de mensajes (no la de DOCBA), y **corte en seco** al video sobre la acción (ella apagando el celular). Hay dos placas de la usuaria (`MSJwppFondonaranja.ai` y `MSJwppFondoblanco.ai`, fondo blanco con globos naranjas): `extraer_placa.py [naranja|blanco]` las descompone y `PlacaChat` tiene la prop `diseno` (R3 final v2 usa la blanca). En cualquier plantilla de Remotion las imágenes van con `<Img>` (no `<img>`): con `<img>` un globo parpadeó 2 cuadros en el render.
14. **Placa final alternada:** R1 fondo naranja + logo hueso; R3 invertida (fondo hueso + logo naranja). Texto de R3: "Reservá tu fin de año en DOCBA" (sin WhatsApp). Frases del guion que la usuaria confirma que no existen se descartan.
15. **Estabilizar (R2 editado, 2026-10-29): por defecto NO.** vidstab dejó "MUY gelatinosos" los inserts de mano/gente trabajando/brindis (0:06, 0:08, 0:09–0:10). Si el movimiento que va a quedar tras estabilizar no se ve natural, el insert queda con su forma original. Solo se toca un insert con un tirón evidente, y se mira el resultado en movimiento (no alcanza la métrica de jitter: sube con el movimiento propio de manos y copas). Y no afirmar que un insert está estabilizado sin verificarlo en el archivo.
16. **Video de la usuaria rehecho en otro programa:** se usa tal cual (color e inserts son de ella) y solo se suman subtítulos (alineación forzada sobre su audio), placa y lo que pida. Revisar si el archivo trae cuadros negros al final: el de R2 quedaba negro desde 0:21,8.
17. **Placa final sobre el video (R2 editado):** la placa es siempre la del manual (panel naranja que sube + logo hueso). "Sobre la chica" significa que el panel barre encima de la imagen de ella, no sobre un cuadro negro: el video tiene que seguir corriendo debajo hasta que el panel lo cubre (si el video de la usuaria termina antes, estirar el último cuadro con `empuje`: `crudos/r2_cola.mp4`). La variante translúcida `sobreVideo` de `PlacaDocba` se probó y **se descartó**.
18. **Primer plano sin texto (R1 NOV v2, 2026-10-30):** el plano de apertura de la host va **sin subtítulos ni textos**. Se probó texto en Gabriella Heavy sobre su cabeza (fijo, naranja, sin sombra, una línea por frase, en seco; prop `rotulos` de `ReelDocba` + `cabeza.py`) y la usuaria lo sacó: no repetirlo salvo pedido. El resto del reel sigue con subtítulos Plex Condensed blancos.
19. **Transición con flash:** la de los reels del CEI (`src/plantillas/comunes/flashLuz.tsx`, prop `flashes` de `ReelDocba`: segundos de los cortes) en los cortes que la usuaria marque (R1 NOV: 7,05 s —corte a "En DOCBA…"— y 18,57 s —corte de las copas a la host, antes de que vuelva a hablar—).
20. **Placa final sin efecto de sonido (R1 NOV v3, 2026-10-30):** se probó un whoosh al entrar la placa (prop `placa.sfx` de `ReelDocba`, Mixkit 1492) y la usuaria lo sacó: no ponerlo salvo pedido. Sigue valiendo que la música sube en la placa.
21. **Antes de entregar cualquier reel, controlar los empalmes entre videos** (cuadros negros, duplicados, saltos de escala o de brillo que no estén en el original; en R2: comparación cuadro a cuadro contra el video de la usuaria) además de `detectar_glitches.py`.
22. **R2 editado (2026-10-30):** primer plano sin subtítulos; acercamiento de plano gradual durante todo el 2.º plano (`push: 0,16`) y todo el último ("Reservá…", `push: 0,15`, origen arriba para no cortar el cartel) — el "leve" 5 % no alcanzó; flash en el corte 2.º→3.º y **también flash** (no el destello de banda cálida, que se descartó) en el corte al último; el acercamiento del último plano va **centrado** (origen 50 % 50 % + compensación horizontal de la cámara en mano con `centrar_ultimo.py`) y **limitado a 10 %**: el rectángulo naranja del edificio (87 % del ancho) tiene que seguir entero en el cuadro, sin tocar los bordes (a 15 % se cortaba); se parte el clip de la usuaria en sus cortes (detectar_glitches.py los lista); ruido de fondo de la voz en off: DeepFilterNet 12 dB con 15 % del original (no más: suena a robot) y fundidos.
23. **Flash corto (referencia R1_VFinal, s 57,6):** `flashesCortos` de `ReelDocba`: 2 cuadros de sobreexposición con bloom justo antes de un corte en seco; se usa cuando la usuaria pide un flash "distinto al que venimos usando". R4 NOV: corte de 8,6 s; el flash normal en 12,9 s; acercamiento de la host de 10 % ("ni leve ni grande").
24. **Textos del primer plano (R2 editado, 2026-11-04, V1 de la usuaria):** en R2 sí van rótulos en el primer plano (pedido explícito): Gabriella Heavy naranja, grandes (~107 px, "¿Necesitás" ocupa ~85 % del ancho), fijos sobre la cabeza, 1–2 renglones por frase, en seco y en la palabra; la virgulilla de la ñ de Gabriella es un hilo: engrosarla (opción `ene` de `RotuloDocba`). Efectos de sonido en los flashes y en la placa (los puso ella en su V1). Si ella manda un video "final" con cambios propios, compararlo con la última entrega (restando audio y con hojas de contacto) para copiar exactamente lo que agregó.
25. **Inserts oscuros del loft (R2 v7→v8, 2026-11-04):** subir solo la luz con gamma los deja "grises": además de la gamma, curva con negros firmes, saturación ~1,2 y vibrance (y un toque cálido si la toma es de cemento gris). Si la usuaria pide estabilizar, vidstab en dos pasadas con zoom fijo (`inserts_casa.sh` de R2).
9. **Proceso:** cada ronda = borrador `_<letra>` en `revision/` + `detectar_glitches.py`; recién con el "dame el final" → `final/<pieza>_9x16_v<N>.mp4`. Probar una alternativa que la usuaria descarta (ej. IMG_9330 de costado en R1 NOV): volver a la versión anterior sin discutir. Si una instrucción es ambigua (ej. "deja el de la versión anterior"), aplicar la lectura más probable y decir cuál se eligió.

## Marca (Brand Guidelines 2025)
- Colores: naranja `#EF6C00`, azul petróleo `#303C43`, hueso `#EDE4CD`.
- Logotipo: aplicación principal (naranja sobre hueso), invertida (naranja sobre azul), secundaria (hueso sobre naranja). Vector por letra en `logo.json`. Campo de protección: 2A (A = módulo).
- Tipografía: Gabriella Heavy (titulares y nombre DOCBA; archivo entregado el 2026-10-30: `Clientes/DOCBA/Fuentes/fonnts.com-Gabriella_Heavy.otf`, en `public/marcas/docba/fuentes/Gabriella-Heavy.otf`, `DOCBA_GABRIELLA`) + IBM Plex Sans (secundaria: todo el resto de los textos, incluidas las leyendas de la placa). El nombre DOCBA de la placa es el logotipo vectorial del manual (Gabriella Heavy).
- Tono (estrategia 10/2026): anfitriona, curiosa, cálida con criterio, ingeniosa. "Todo pasa bajo un mismo techo": la mesa, los encuentros, el trabajo, la copa.
- Voseo cordobés/rioplatense en los textos ("tenés", "podés", "encontrás").

## Instrucciones de la usuaria
- Subtítulos: color blanco, IBM Plex Sans de `Clientes/DOCBA/Fuentes/static` (peso final: Condensed Medium; ver lista de control).
- Reels verticales 9:16 para redes.
- Los inserts de `Producciones/Inserts cámara/<tema>` vienen rotados: voltearlos al usarlos.
- Cuando la voz en off nombra platos, usar el insert de cada plato.
- Placa final: logo según el manual, en motion graphic.

## Carpetas del cliente
- `Clientes/DOCBA/Producciones/<n>. <reel>` = crudos de cada reel; `Inserts cámara/{Comida,Cowork,Loft,Reuniones,Cava}` = tomas de cámara compartidas.

## Criterios de montaje aplicados en R1 NOV (2026-10-27)
- Plantilla `src/plantillas/ReelDocba/` + `armado` en `composiciones.ts`. Placa final: panel naranja que sube, logotipo en hueso sobre naranja (aplicación secundaria) armándose letra por letra, "Denominación de Origen Córdoba" y dirección (Buenos Aires 864 · Nueva Córdoba).
- Subtítulos: IBM Plex Sans SemiBold, blancos, 64 px, sin borde, sombra suave, a ~430 px del borde inferior. En la voz en off, cada plato se subtitula en la palabra que lo nombra, sobre su insert.
- Tomas habladas: sacar las pausas largas con corte seco (decidido por la energía de la voz); voces a −19 LUFS; música entra 0,5 s después de la primera frase y queda ~21 dB bajo la voz, sube en la placa.
- Los MOV del iPhone vienen en rango completo: convertir al hacer el proxy. Los inserts Sony están filmados en vertical: `transpose=2`.

## Correcciones de la usuaria (borrador A de R1 NOV, 2026-10-27) — aplicar de entrada
- **Subtítulos:** IBM Plex Sans **Condensed Medium**, blancos. Tienen que entrar **exactamente cuando se dice** cada palabra (nunca antes de la voz): medir con `tiempos.py` (DTW + energía), no confiar en el DTW solo.
- **Voz en off sobre comida:** cada plato en su palabra; los inserts de cámara se **estabilizan** (vidstab) y no deben verse "gelatinosos": medir el temblor con `jitter.py`, usar la ventana más firme o cortar/cambiar de toma. Color: más luz y apetito, **sin exagerar** ("que den ganas de comerse la pantalla").
- Si una frase nombra "la carta", mostrar la **carta digital animada** (`MenuDigital`) o algo que muestre todas las opciones.
- Tomas habladas: arrancar sin el "va"/claqueta; mostrar a la persona en acción desde antes si el brief lo pide (apuro, estrés).
- **Sonido:** ciudad caótica de fondo en el plano de la calle (sin tapar la voz); **la música entra de a poco** en la transición a DOCBA y reemplaza a la ciudad ("vibras cool"); la música siempre suave y sin tapar la voz, **sube en la placa final**. La voz de la persona, pareja en nivel entre tomas.
- La música la elige la usuaria (carpeta `Clientes/DOCBA/Música/`); si no manda, proponer.
- Para el cierre, empezar el audio en la primera palabra ("Te esperamos…"), sin muletillas.

## 2.ª tanda de correcciones (borrador C de R1 NOV, 2026-10-27) — aplicar de entrada
- **Subtítulos:** chicos (66 px en 1080), con margen generoso a los lados, **en dos filas** cuando son largos (líneas balanceadas, sin palabra sola), y **en seco** (sin fundido ni desplazamiento al entrar/salir). Cambios rápidos si hace falta.
- **Gramática:** puntuación completa y correcta en cada subtítulo (¿?, comas de enumeración, puntos finales, mayúscula tras punto/interrogación, puntos suspensivos donde la frase queda abierta). Revisar contra lo que dice el guion.
- **Sincronía:** el DTW de Whisper no alcanza (estira palabras sobre pausas y puede venir corrido). Tiempos = energía de la voz (pausas, valles entre palabras, conteo de sílabas) y verificación con `verificar_sync.py` sobre el render.
- **Cortes sin silencios:** una frase pega con la siguiente (remate: "…corridas." → "Te esperamos en DOCBA." sin aire); la placa final entra apenas termina de decir "DOCBA"; la voz en off entra al toque de la frase anterior.
- **La carta digital va como la web real** (capturas en `C:/Users/LUCIA/Pictures/Screenshots/`: cabecera con logo, buscador, categorías con íconos, tarjetas de 2 columnas, precios). Nada de "inventos" de UI.
- **Voz en off limpia:** sin ruido de fondo (DeepFilterNet); el video solo lleva la voz de la chica y la música (más la ciudad en el plano de la calle).
- **Música:** el beat más movido arranca justo al terminar una frase clave; siempre suave; sube en la placa.
- **Inserts de comida:** estabilizados sin "gelatina" (vidstab con zoom fijo y sin rotación; elegir ventana por `jitter2.py`; mejor menos cortes y planos continuos); luz media 0,44–0,58 según la toma, tibios, saturación +14 %.
- Corte a un plano más cercano (zoom 1,18) en una frase clave de la persona, arrancando directo en la palabra (sacando pausas).

## 3.ª tanda de correcciones (borrador E de R1 NOV, 2026-10-28) — aplicar de entrada
- **Subtítulos:** sin superposición ni parpadeo entre uno y otro (ver `tramosSubtitulos`); prueba con IBM Plex Sans **Regular** (60 px) en lugar de Condensed Medium. Sin puntos suspensivos en enumeraciones: coma.
- **Transiciones:** si la persona sale del cuadro, dejar correr el plano hasta que salga (sirve de transición al siguiente).
- **Carta digital:** el scroll nunca deja espacio en blanco al final; más lento mejor que pasarse.
- **Inserts:** buscar los mejores por plato (carpeta `Inserts cámara/Comida`); cámara lenta con RIFE cuando se aprecia un gesto (caída del matcha); la copa de vino con dos planos y look de noche. Tomas nuevas pueden venir horizontales (C0114): recortar en vertical en vez de girar.
- **Luz de la persona:** si se ve muy oscura, subirla solo a ella con máscara (`iluminar_persona.py`), natural, sin tocar el fondo.

## 4.ª tanda de correcciones (borrador F de R1 NOV, 2026-10-28) — aplicar de entrada
- **Subtítulos:** IBM Plex Sans **Condensed Medium** (la Regular no gustó). Frases cortas (1–3 palabras) que cambian al ritmo de la voz: dinamismo. Nunca dejar un subtítulo sobre el clip siguiente.
- **Luz de la persona:** natural, sin halo en el contorno (máscara metida hacia adentro y suave) y sin parpadeos (máscara suavizada en el tiempo).
- **Música:** el beat fuerte apenas termina la frase clave ("las horas"); después baja a fondo cuando vuelve la voz.
- **Gráficos (carta digital):** entrada suave con la vibra de DOCBA (hoja que sube con filo naranja), no en seco.
- **Inserts de comida:** enderezar (línea del horizonte/nivel del líquido), arrancar con la acción ya en marcha, color con contraste y vida pero natural, motivo centrado (sin mucho aire abajo; zoom con origen arriba), sin gelatina (cambiar de toma si el jitter es alto: <0,2).

## 5.ª tanda de correcciones (borrador G de R1 NOV, 2026-10-28) — aplicar de entrada
- **Subtítulos exactos con la voz:** nunca antes. Medir arranques en el audio (`arranques.py`: huecos y valles de sílaba) y verificar con `verificar_sync.py` sobre el render; no partir frases "a ojo" ni proporcionalmente. Si hay un silencio dentro de una frase, el texto espera a que ella siga. Separar "Te esperamos" / "en DOCBA.".
- **Nada de máscara de persona para subir la luz si hay manos o mangas oscuras que entran al cuadro** (titilan): usar curva global. La máscara solo en planos fijos de la persona.
- **Comida natural:** la salsa amarilla y la madera ya vienen muy amarillas de cámara: no agregar tibio ni vibrance fuerte; bajar el amarillo (selectivecolor) y saturación ≤ 1,0. Verlo en contraste con el crudo.
- **Planos habladas "grises":** subir saturación (~1,12) y vibrance suave, sin pasar de natural.
- **Vidstab agresivo = gelatina** en tomas con rolling shutter: `smoothing=12:zoom=4:optzoom=0` mantiene la firmeza sin deformar.
- La transición por salida de cuadro dura lo justo para que el plano siguiente arranque en el segundo marcado por la usuaria (R1 NOV: 0:08).

## 6.ª a 8.ª tanda (borradores I, J y K de R1 NOV, 2026-10-28) — aplicar de entrada
- Platos: corregir color sin apagarlos ni saturarlos; parecidos al original, look natural de cafetería (no bajar el amarillo ni sumar azul de más).
- Estabilizar inserts con zoom fijo (`optzoom=0`): el zoom adaptativo de vidstab hace que el plano se aleje.
- Todos los planos de la host llevan el mismo color (curva global de IMG_9332); sin tonos amarillos.
- Después de "las horas" no dejar silencio: el plano corta ~1 s después; el beat suena a volumen normal hasta que habla el siguiente plano.
- Subtítulos sin puntos suspensivos.
- (7.ª) Planos de entrada: seguimiento de costado continuo, sin frenar la acción de ella entrando. Inserts consecutivos del mismo plato: uno acerca y el otro aleja (contraste). Copas/mesa: horizonte recto. Planos de la host: cerrar un poco para sacar el techo, sin cortar el cartel.
- (8.ª) Movimientos de cámara digitales (zoom out/in): mínimos y suavizados, no notorios. Copas: sin estabilizador si la toma ya es firme (vidstab = gelatina).

## Historial de entregas
- R2 NOV editado (`2026-10-28_docba_r2-nov`): final `r2-nov-editado_9x16_v6.mp4` (24,2 s, −14,1 LUFS), 2026-11-04. "Como en casa…" como voz en off pegada a "comodidades" sobre los inserts C0165/C0164, rótulos naranjas en el primer plano y efectos de sonido de su V1.
- R3 NOV (`2026-10-28_docba_r3-nov`): final `r3-nov_9x16_v2.mp4` (25,2 s, −14,2 LUFS), 2026-10-28. Misma edición que la v1 con la placa de inicio de fondo blanco (`MSJwppFondoblanco.ai`) y sin el parpadeo del globo "Yo no puedo ese mes" (imágenes con `<Img>`). Reemplaza a la v1.
- R3 NOV (`2026-10-28_docba_r3-nov`): final `r3-nov_9x16_v1.mp4` (25,2 s), 2026-10-28. Placa inicial del .ai de la usuaria, música "alex-morgan-soul-jazz-coffee-shop" con el beat en "nosotros te lo resolvemos", placa final invertida.
- R1 NOV (`2026-10-27_docba_r1-nov`): final `r1-nov_9x16_v1.mp4` (26,4 s), 2026-10-28. Segundo plano: IMG_9332; IMG_9330 (de costado) se probó y se descartó.

## R3 NOV (2026-10-28) — correcciones del borrador D
- **Los inserts van siempre sin sonido** (salvo que la usuaria diga lo contrario): proxies con `-an`, nada de ambiente de inserts bajo la voz.
- **Apertura con motion graphic:** si el guion arranca con una pantalla de celular/chat, va directamente el gráfico (no la host) y con estética natural-tecnológica-orgánica: celular sobre madera, tarjetas de vidrio esmerilado en perspectiva, bokeh del local, paleta DOCBA (referencias en `Clientes/DOCBA/Referencias`). Nada de interfaz oscura tipo app.
- **La VO sigue sin aire a la frase de la host** ("equipo" → "Acompañado…"): cortar el plano apenas termina la voz y arrancar la VO sin su silencio inicial.
- **Inserts que "se traban":** elegir la ventana más suave (`suavidad.py`: aceleración del movimiento, no solo temblor), estabilización suave con zoom fijo y RIFE ×2 sobre el 24p. Un insert por plato nuevo, sin repetir toma.
- **Placas alternadas entre reels:** R1 fondo naranja con logo hueso; R3 invertida (fondo hueso, logo naranja) para ir cambiando.
- **El tramo de la host que sigue a la VO** entra directo en la toma completa (R3: IMG_9491 desde que dice "merecen un brindis") y la placa entra apenas termina la frase.
- **(R3, 3.ª tanda) Sincronía de subtítulos:** usar `python scripts/alinear.py <audio> "texto" --desde s --hasta s` (alineación forzada, 20 ms por palabra) y, si hace falta, verificar con el mix decodificado. Es mucho más fiable que mirar valles de energía (en R3 los valles dejaron subtítulos atrasados hasta 0,6 s). Para frases con pausas, alinear por tramos entre silencios. Cada trozo entra en la primera palabra (−0,03 s).
- **Revisar el arranque de las voces en off:** pueden traer charla de fondo antes de la primera palabra (R3: 1,7 s). Cortar donde empieza la palabra y no usar el atten-lim de DeepFilterNet si queda ruido. Silenciar también la charla de otros en los clips de la host.
- **Chat/mensajes de apertura:** minimalista (fondo de la paleta, tarjetas limpias), pocos mensajes, ~0,9 s entre mensajes para poder leerlos.
- **Clips que "empiezan cuando pasa X"** (choque de copas, primera palabra): ubicar el instante cuadro a cuadro y arrancar ahí; el clip de la host entra siempre en movimiento, no quieta.
- **(R3, 4.ª tanda) Subtítulos:** cada trozo tiene que ser una unidad con sentido (no cortar "nosotros te lo / resolvemos"; los pronombres van con su verbo: "te lo resolvemos"). Gramática: mayúscula al empezar oración, punto al final de oración, coma y minúscula si la oración sigue en el trozo siguiente ("con tu equipo," → "acompañado de…"). No usar dos puntos del guion si la usuaria pide punto.
- **Estabilización:** los clips cortos casi nunca la necesitan; no estabilizar salvo que el movimiento sea evidente (vidstab puede dejar un movimiento raro). Probar primero sin.
- **Color de comida:** natural y parecido al original, solo realzado un poco (saturación ≤ +7 %, sin cambiar la luz de la toma); un insert "re saturado" no se acepta.
- **Gráficos de mensajes (chat):** globos de texto reales con colita (hueso / azul petróleo) sobre naranja liso de la paleta, como **capa con fondo transparente** (se exporta ProRes 4444 con alfa para reutilizar). Sin tráfico de fondo: en la apertura solo los sonidos de mensaje.
- **Clips de la host (color):** corregir un poco (no un cambio total); en R3 se usó `col2` (contraste +4 %, saturación +10 %).
- **(R3, 5.ª tanda) Aperturas con gráficos:** tienen que verse profesionales, innovadoras y tecnológicas (aunque sea una cafetería): tarjetas de vidrio esmerilado (translúcidas, difuminadas, borde fino, brillo) sobre video del local, como los gráficos de Volto; esqueleto → texto; destello. Conversaciones con sentido, un solo nombre por emisor.
- **Subtítulos dinámicos y cortos** (1–3 palabras, hasta ~0,5–1 s): partir también las frases largas ("un espacio" / "para hacer"; "acompañado" / "de un montón"), siempre con sentido gramatical.
- **Placa final:** "Reservá tu fin de año en DOCBA" (sin mencionar WhatsApp por las dudas). Si el pedido dice "reservá por WhatsApp" confirmar antes.
- **Movimiento estabilizado "natural":** si un insert tiene un tirón, estabilización leve (vidstab smoothing ~5, zoom 3 %); smoothing alto = robótico. Medir con aceleración del movimiento (no solo temblor).
- **Inserts oscuros** (pizarrón, brindis): subir luz con gamma y sombras levantadas (sin curva en S), apuntando a luz media ~0,6, sin perder calidad.
- **(R3, 6.ª tanda) Texto de chat/mensajes:** tipografía clásica de mensajes de texto (Inter/Helvetica), **no la de DOCBA**; mismo interlineado en todos los textos; el texto se lee directo (sin barritas ni esqueletos).
- **Transición gráfico → video (aperturas):** el primer cuadro del primer video se congela y desenfoca de fondo; los gráficos se van con una salida profesional (escalonada) y el video se descongela desde ese cuadro, se enfoca con un zoom rápido leve (`foco` en `ClipDocba`).
- **Color de comida artificial:** si el realce se ve "artificial" (amarillos neón, rojos fuertes), volver casi al original: saturación ≤ 1,0 y bajar el amarillo con selectivecolor; sin afilado extra.
- **Inserts de detalle (huevo, etc.):** a veces conviene un plano más cercano (zoom ~1,2) para que se vea el detalle.
- **(R3, 7.ª tanda) Placas/gráficos que entrega la usuaria en .ai:** usarlos tal cual (descomponer con PyMuPDF en capas y animar, no rediseñar). Animación súper limpia: globo que se infla + texto que se revela, sin extras. **No agregar sonidos de notificación**: los pone ella después.
- **(R3, 8.ª tanda) Pantallas de celular en pantalla completa:** ajustar la captura para que el teclado/contenido toque los márgenes del cuadro (como ver la pantalla del celu); si sobra alto, achicar huecos vacíos con tajadas en vez de dejar márgenes. La transición de la placa al video ocurre con el video ya corriendo debajo (sin congelar ni desenfocar): el video arranca con la acción que corresponde (ella bloqueando el celular).
- **(R3, 9.ª tanda) Cortes:** de la placa de mensajes al video, corte en seco (sin disolver ni animar la salida), sobre la acción que sigue (ella apagando el celular).

## R2 editado por la usuaria (2026-10-29) — correcciones
- Los inserts de 0:06, 0:08, 0:09 y 0:10 quedaron "MUY gelatinosos" con vidstab: se rehízo sin ninguna estabilización (v2). Regla: si va a quedar ese movimiento, no se estabiliza.
- La placa final es la naranja de siempre, pero tiene que animarse sobre la imagen de la chica y no sobre un rectángulo negro (la variante con velo translúcido no le gustó): ver ítem 17.
- Mejoras que se propusieron para próximas ediciones (a confirmar con ella): partir con un insert corto el tramo de ~2 s de ella bajando la escalera; no repetir tres planos parecidos de la copa; alternar planos abiertos entre los inserts de gente trabajando; un solo color para comida, loft y la host (los de comida salen más cálidos); cortes de inserts sobre los pulsos de la música (`pulsos.py` + `ajustarAlPulso`); música que sube en la placa.

## R4 NOV (borrador B, 2026-10-29) — correcciones
- **Contraluz (host entrando):** subir la luz solo a ella con la máscara de personas (`scripts/mascaras.py` → `maskedmerge` en ffmpeg; ver `src/trabajos/2026-10-28_docba_r4-nov/retocar_luz.py`), nunca a todo el cuadro. Máscara erosionada y desenfocada (sigma 7) para que no quede halo.
- **Look de noche (CORREGIDO en el borrador C):** el fondo oscuro con gradiente, tono frío y viñeta en el brindis quedó "de terror" y la usuaria lo rechazó. En tomas de brindis/sillón dejar el video original y **solo corregir un poco la iluminación** (curvas suaves; personas apenas más claras que el fondo). Nada de fondos negros ni viñetas.
- **Contraluz y color de piel:** subir la luz con gamma (≈1,4 sobre la persona, 1,07 al fondo; las curvas en sombras tiran a rosa o quedan oscuras) y cuidar que no tire a rosa (rojo −3 %, saturación ≤ 1,0); revisar el cuadro en pantalla antes de entregar.
- **Inserts de papel/menú blanco:** se sobreexponen y quedan con tinte; bajar blancos y neutralizar el color (medir el promedio RGB del papel).
- **No repetir tomas entre reels:** antes de elegir un insert, buscar su código (C0xxx) en todos los trabajos de DOCBA (`grep -r C0xxx src/trabajos`). C0126 (croissant) ya estaba en R2 y R3. En Comida hay muchas sin usar (C0043–C0107 casi todas, C0121–C0124, C0142–C0144, C0151, C0166–C0168).
- **Subtítulos:** el texto sigue lo que ella dice/pide, no el guion literal: en R4 es "Y si se activa" (no "se te activa").
- **Placa:** alternada; R4 con colores invertidos (fondo hueso, logo naranja), como R3.
- **Tiempos de la usuaria:** el reloj trunca ("0:05" = 5,0–5,99 s). Mapear sus segundos contra el borrador con una hoja de contactos a 2 cuadros/s antes de tocar nada.
