# Criterios de Cipax (Cipax Digital Solutions)

Leer **de entrada** en cada reel de Cipax, junto con `src/plantillas/HablaSubtitulada/CRITERIOS_REEL.md` (lo general de persona hablando). Si algo de acá choca con aquel, manda esto. Cada corrección del cliente se suma acá con fecha.

Plantilla: `src/plantillas/ReelCipax/` (`ReelCipax`, transiciones en `Transiciones.tsx`, placa en `PlacaCipax.tsx`). Primer trabajo: `2026-11-13_cipax_r0`.

## Marca (manual: `Clientes/Cipax/Identidad Visual/Manual de Marca/Manual de marca_.pdf`)
- **Colores** (`src/marcas/cipax/marca.ts`):
  - principales: oscuro `#212529`, azul `#2667FF`, blanco;
  - secundarios: gris `#343A40`; acentos violeta `#B517FF`, turquesa `#00CFC1`, menta `#10FFCB`.
  - El azul manda en transiciones y gráficos; los acentos solo en detalles chicos (un brillo, una línea), nunca en el logo.
  - Degradados del manual: azul → oscuro (diagonal, con una mancha oscura en una esquina).
- **Tipografías:** Montserrat Bold (títulos, 1ª jerarquía), Montserrat Medium (2ª jerarquía), DM Sans Regular (texto chico). Las tres de Google Fonts (`@remotion/google-fonts`).
- **Logo:** vectorizado en `logo.json` (`extraer_logo.py`, desde `Logo_oscuro.pdf`): isotipo de 3 piezas (cuadrado, trazo oscuro, trazo azul), letras C I P A X y el rombo azul de la A. Sobre oscuro o azul: letras y piezas oscuras en blanco, el azul queda azul (sobre fondo azul, el trazo azul pasa a blanco: "variables de logo" del manual). **No deformar ni cambiar colores** (usos incorrectos del manual).
- **Recursos:** trama de isotipos (`public/marcas/cipax/trama.png`), fondos verticales con degradado y trama (`fondo-vertical*.png`), y la "figura de isotipo a gran escala" (el tilde azul).

## Dos tipos de material
| | **Celular (orgánico)** | **Cámara profesional** |
|---|---|---|
| Ejemplo | R0 (iPhone 4K HEVC, vertical, en la calle) | (próximos reels) |
| Color | El original, solo convertido bien: iPhone `yuvj420p` → rango estándar (`in_range=full:out_range=limited`); si es HLG, tonemap a SDR. Sin LUT ni curvas | Si viene en log (S-Log, C-Log…), LUT de conversión a Rec.709 de `C:/Videos/_herramientas/luts` y nada más; si ya viene en 709, tal cual. Probar en una hoja de cuadros antes de aplicar |
| Encuadre | Vertical nativo, a pantalla completa. Los movimientos de cámara en mano se aprovechan como transiciones (no se estabiliza salvo temblor evidente) | Suele ser 16:9: reencuadre a 9:16 con MediaPipe (`encuadre.json`). Planos más cerrados (1,3×) para remarcar, con cortes secos, porque la imagen aguanta el zoom |
| Ritmo | Más suelto: cortes pegados a la voz, transiciones de motion graphic en los cambios de idea | Más prolijo: menos transiciones vistosas (1 cada 2-3 cortes), más gráficos sobre la imagen limpia |
| Audio | Micrófono del celular: medir el fondo; DeepFilterNet solo si hay ruido de calle fuerte | Micrófono corbatero/externo: sincronizar con la cámara si viene aparte (`sincronizar.py`) |
| Gráficos | Pocos y grandes: el material ya es "vivo" | Pueden ser más (ideas nombradas), siempre en el aire libre del encuadre |

Lo que **no** cambia entre los dos: subtítulos, paleta, tipografías, lenguaje de las transiciones y la placa final.

## Subtítulos (iguales en celular y cámara)
- **Montserrat Bold (700), 60 px, blanco**, sombra suave (sin trazo negro), 1 o 2 renglones cortos, en pirámide; nunca una palabra corta sola en un renglón.
- **Palabras clave** (pocas, 1 por frase como máximo): mismo texto en blanco sobre una **píldora azul `#2667FF`** (radio 14). Es la misma forma de píldora de las transiciones.
- Entran con una **máscara que sube** (4 cuadros, como el contador de la referencia) y salen en seco.
- **Zonas seguras de redes (1080×1920):**
  - arriba: nada importante por encima de **y = 220** (encabezado de Reels/TikTok);
  - abajo: el bloque de subtítulos termina en **y = 1400** (por encima de los 520 px de abajo, donde van el texto de la publicación y los botones);
  - derecha: nada a la derecha de **x = 930** entre y = 900 y 1750 (columna de íconos: me gusta, comentarios, compartir);
  - ancho máximo del subtítulo: 760 px, centrado.
- Tiempos con `scripts/alinear.py`; cada grupo entra en su primera palabra (−0,03 s).

## Movimiento (análisis de las referencias `Clientes/Cipax/Refes transiciones`, 2026-11-13)
Las 4 referencias comparten:
1. **Formas de marca que hacen de máscara:** una píldora que se abre entre dos palabras y muestra el video adentro, y crece hasta la pantalla completa (ref. "Sexual wellness"); un punto que rebota, se agranda a círculo y cubre todo (ref. "maxterz").
2. **Color plano de marca** como fondo de transición (azul saturado, blanco), sin texturas.
3. **Texto que entra por máscara** (palabra por palabra, o números que ruedan hacia arriba con desenfoque vertical: ref. "795 million").
4. **Curvas expo in-out**: arrancan y llegan suave, el medio es rápido. Nada lineal, nada de rebotes exagerados (solo el punto).
5. **Brillos y degradados desenfocados** de fondo en las placas (ref. verde "Ready to grow?"), anillos y formas que enmarcan el video.

Por eso, en Cipax:
- **Transiciones** (`Transiciones.tsx`), una distinta en cada cambio de idea, sin repetir seguido:
  - `pildora`: píldora azul con el plano siguiente adentro que crece hasta la pantalla completa;
  - `circulo`: punto azul que rebota y se abre en círculo; del azul sale el plano siguiente en otro círculo;
  - `bandas`: bandas verticales azules que suben escalonadas, tapan y destapan;
  - `isotipo`: el isotipo del logo (que entró al nombrar "Cipax") vuela al centro y se hace gigante: el trazo azul llena la pantalla y se va hacia arriba;
  - `camara`: cuando una toma termina con un movimiento de cámara y la siguiente arranca con otro en la misma dirección, se empalman en el punto más rápido con un fundido de 4 cuadros y desenfoque vertical (no se tapa con gráficos: el movimiento real es la transición);
  - `placa`: panel azul con borde curvo que sube y se convierte en el fondo de la placa.
- **Curva de la marca:** `CIPAX_EASE` (expo in-out) para todo lo que cruza la pantalla; `CIPAX_SALIDA` (expo out) para entradas.
- **Sonido de transiciones:** whoosh liviano y corto, sutil (−8 dB respecto de la voz); en `camara`, el whoosh rápido. Sin sonido en los zooms.
- **Nada de glitch, HUD ni texto que se decodifica** (criterio general: que no parezca "hecho con IA"). Lo "tecnológico" sale del movimiento preciso, la grilla, las líneas que escanean y los brillos de marca.

## Gráficos sobre el video
- Arriba de la cabeza, con aire, dentro de la zona segura (y ≥ 220).
- **Píldoras oscuras de vidrio** (`#212529` translúcido, borde fino blanco 15 %) con un ícono azul y texto en Montserrat SemiBold, para enumerar problemas o servicios: una a la vez, la nueva empuja a la anterior hacia arriba.
- **Logo cuando se nombra "Cipax"**: versión blanca, se arma con las piezas (pop + máscara), y puede encadenar la transición `isotipo`.

## Placa final
- Fondo con el degradado azul → oscuro del manual, brillos desenfocados que se mueven lento y la trama de isotipos muy tenue.
- **Logo animado "tecnológico"**: un punto azul (el rombo) aparece y rebota; se estira en una línea que escanea y dibuja una grilla fina; las 3 piezas del isotipo entran desde fuera y encastran; las letras suben por máscara una por una; el rombo cae último en la A; un brillo cruza el logo. Debajo, "DIGITAL SOLUTIONS" en Montserrat Medium espaciada.
- Música sube en la placa; sonido "software start" en el armado del logo.
- **Variar** en cada reel (criterio general): la placa del próximo cambia fondo/animación dentro de la marca.

## Música
- Electrónica / tech house con pulso, bajo la voz ~22 dB por debajo; sube en la placa. R0: Mixkit 130 "Tech House vibes" (123 bpm).
