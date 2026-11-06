# VOLTO — criterios del cliente (se suman con cada corrección)

Cliente con varias series de reels de entrevista (agentes de IA para marcas de ropa). **Leer esto de entrada en cada trabajo nuevo de Volto** y aplicar todo desde el primer borrador, sin que el cliente lo vuelva a pedir.
**Al terminar cada video de Volto (entrega final): repasar las correcciones de ese trabajo, pasarlas a la lista de abajo (sin duplicar ni contradecir) y, si sirven para cualquier reel, también a `src/plantillas/HablaSubtitulada/CRITERIOS_REEL.md`.**

## Antes del primer borrador, leer
1. `src/plantillas/HablaSubtitulada/CRITERIOS_REEL.md` completo (salió de las correcciones de Volto): lista de control de arranque, piezas 6, 1 y 5, sección **"Gráficos de vidrio"** (look aprobado de "Vení, seguime") y "Cómo trabajar con el cliente".
2. `src/trabajos/2026-10-06_volto_fashion-week/TRABAJO.md`: brief de marca (New Black + Nostalgic Memories, paleta, subtítulos de referencia), Decisiones e historia de las correcciones; y su `guion_veni-seguime.md` (tanda por tanda, valor anterior → nuevo).
3. `src/trabajos/2026-10-19_volto_radio/TRABAJO.md`: pieza "trabajo" (7 tandas de correcciones, borradores A–G) y `guion_trabajo.md`.
4. Kit de marca: `src/marcas/volto/marca.ts` y `fuentes.ts`.

## Lista de control de arranque (resumen vigente)
1. **Material:** proxies de la cámara B (iPhone) a rango estándar (los iPhone graban en rango completo: revisarlo antes). **Color original, sin corregirlo a mano** (dos intentos rechazados); si el cliente retoca un archivo, se usa ese.
2. **Voz:** DeepFilterNet a 15 dB en ambientes ruidosos. Medir el nivel de **cada persona** que habla: un entrevistador lejos del micrófono se sube primero (+20 dB, limitador, pasa-altos 70 Hz) y recién ahí DeepFilterNet 24 dB (si no, lo borra entero).
3. **Subtítulos:** a mano, New Black con borde, en seco, en pirámide; blancos salvo el amarillo que elija el cliente. Tamaño: 74 px en la fashion week; **66 px desde la radio** (2026-10-23, pedido del cliente): usar 66 salvo que pida otra cosa. Si un gráfico ya muestra la frase, se omite ese subtítulo.
4. **Textos:** revisar **contra la RAE** todo texto en pantalla ("a basto" → "abasto" llegó a la v3; prefijos unidos: "supercontentos", "superproductivo"; "sí es" con tilde; números chicos en letras). "Vuelto" de Whisper → "Volto". Citas entre **comillas angulares « »** (en New Black las inglesas y las rectas cierran mal). Si el usuario dicta lo que se dice, eso manda.
5. **Gráficos:** **vidrio translúcido** (`src/plantillas/comunes/InsertosPro.tsx`), sin títulos ni chips, **arriba de la cabeza** sin tocarla y sin tanto aire (~80 px sobre el pelo), **solo la paleta de Volto** (#262626, #f5f5ed, #a0c9cb, #ebdbb7 y el degradé #f97d55 → #95a8a0 → #406162), un pop por gráfico (o sonido de cuenta si la cifra se carga), desvanecido de 6 cuadros por elemento. Sobre un fondo blanco (cartel de la radio) la letra blanca no se lee: mover el gráfico o usar tinta oscura.
6. **No repetir recursos de una pieza a la siguiente** (2026-10-22): nada de reusar el anillo del 80 %, las píldoras ni la palabra sola de "Vení, seguime"; tampoco lo ya usado en la radio (`ProLema`, `ProReparto`, `ProEtiquetas`, `ProIgual`, `ProFrase`, `ProTextos`, `ProVelocimetro`, `ProReloj8`, `ProHoras`). Un gráfico nuevo por idea, dentro del look de vidrio. Antes del primer borrador, listar qué gráficos usaron las piezas recientes.
7. **Planos y zoom:** manda el plano que mira a cámara; cambios de plano al inicio de la frase, nunca antes de que termine la última palabra. Sobre todo **cortes secos a planos quietos** (1,1 / 1,2 / 1,3, o 1,35–1,5× en cámara en mano con seguimiento de cara); **movimiento solo en 2-3 frases** a destacar (empuje rápido de 1,3× en ~200 ms, anclado hacia la persona). Los zooms no llevan sonido. En cada corte, ≥ 0,3 de diferencia de escala.
8. **Música:** en la fashion week, solo bajo la placa final. En la radio (entrevista en estudio) rechazó Digital Clouds ("no me gusta", muy corporativa) y eligió **Deep Techno Ambience** (Mixkit 134): electrónica tecnológica, relajada, no corporativa, de fondo todo el video a ~21 dB bajo la voz (-25 dB; a -30, ~26 dB, "casi ni se notaba"; "que NO tape la voz, pero no te zarpes") y sube en la placa (-6 dB). Preguntar en cada serie nueva si lleva música de fondo.
9. **Placa final:** en la radio eligió la de **degradé** (la colorida), entrando por corte **apenas termina la última palabra** (sin pausa). Cierre "Escribinos": rótulo-píldora "@volto.ai" con el recuadro al 50 %, sin flecha. Logos con pop (nunca whoosh); el del evento va detrás de la persona.
10. **Duración:** ~1 minuto por reel; máximo 60 s salvo para no cortar el final.
11. **Palabras dudosas:** si Whisper oye algo que no tiene sentido ("la gente" / "el agente"), subtitular lo que tiene sentido, marcarlo ⚠️ en `TRABAJO.md` y preguntarlo en la entrega.

## Cómo trabajar con este cliente
- Corrige mucho, tanda por tanda (11 borradores en la pieza 1, 9 en la pieza 5, 7 en la radio): anotar cada tanda en el `TRABAJO.md` con el valor anterior → el nuevo.
- **Pedidos de "solo eso":** cuando el usuario dice "solo eso, NADA MÁS", hacer únicamente ese cambio y avisar de los relacionados sin tocarlos.
- Diagnosticar antes de corregir, repetir la interpretación de un pedido ambiguo, ofrecer variantes lado a lado para las intensidades y arrancar mínimo (detalle en `CRITERIOS_REEL.md`).

## Materiales
- Originales del cliente: `C:/Users/LUCIA/Documents/RASTRO/Clientes/Volto.ia/` (en otra PC, la misma carpeta de clientes; copia de crudos en `C:/Videos/crudos/<ID>/`).
- Trabajos anteriores para reutilizar composiciones: `2026-09-28_volto_ia2026`, `2026-10-06_volto_fashion-week`, `2026-10-19_volto_radio`.
