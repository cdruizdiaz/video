VIDEO: Bloomie — Planted
Duración: 8,5 segundos (255 cuadros a 30 fps).
Formato: Vertical 9:16, 1080 × 1920.
Estética: el mismo escenario de "Bloomie toma vida": fondo negro, piso oscuro con reflejo suave, reflector cálido (ámbar #ffd59a) desde arriba a la izquierda con polvo en el haz, charco de luz en el piso, contraluz celeste desde atrás a la derecha, viñeta. Bloomie con su paleta exacta (cara #ef913c, pétalos #dc7b26 / #ea8021, contorno #bc7208, tinta #150b09), anteojos celestes y caras del kit nuevo (hoja de expresiones de ChatGPT corregida, se pasa como link/ruta y se guarda en C:/Videos/crudos/<ID>/). Subtítulos en Fredoka 700 blanca con borde #2a1a12, abajo (líneas en y≈1470 y y≈1560), la palabra que se dice en naranja #ef913c. Firma “Bloomie” en Fredoka naranja con borde crema al cierre (y≈1500). Contenido importante entre y=250 y y=1580.
Tono: comedia tierna con timing de stand-up; en inglés; público familiar.
Audio: voz de Bloomie con Piper (en_US-hfc_female-medium, --nene) en tres audios: A “I waited for my date for hours…” (1,58 s de habla), B “and I got stood up!” (0,96 s), C “And I can't even leave… I'm planted!” (1,80 s, con la pausa de Piper después de “leave”). Labios con Rhubarb → bocas del kit (Cerrada, M, Entreabierta, E, A, U, F, L). Efectos de Mixkit (a elegir en la búsqueda): tic-tac de reloj suave, trombón triste “womp womp”, estirón elástico, boing (2894, ya en la biblioteca), redoblante “ba-dum-tss”, destello (3062, ya en la biblioteca). Mezcla a -14 LUFS medidos con ebur128; los efectos 6–10 dB por debajo de la voz.
Transiciones: sin cortes (un solo plano). Los subtítulos entran palabra por palabra con la voz y se borran 0,15 s después de cada frase.
Modo de animación: 3D (Blender Eevee, mismo modelo, luces y escala que "toma vida": pies en x=540, y=1330, escala 1,95). Profundidad: giros de ¾ (rotY hasta ±0,35, nunca perfil), luces que siguen el giro, sombra de contacto y reflejo fijos en los pies, squash & stretch en el tirón, acercamiento de cámara en el remate.
Reglas de superposición (valen para TODAS las escenas):
•    Orden de profundidad fijo, de atrás hacia adelante: fondo → haz y polvo → pétalos de la nuca → cuerpo → cabeza/cara → brazos y manos → partículas de adelante → subtítulos y firma.
•    Las manos son geometría 3D: siempre delante del cuerpo (huesosExtra z: +46 pt brazos cruzados, +20 pt al encoger los hombros) y nunca delante de los ojos. Con los brazos cruzados, una mano 6 pt más adelante que la otra (no se atraviesan). Al encoger los hombros, por fuera del contorno de la cabeza.
•    Los ojos de cada cara quedan centrados en su aro de los anteojos, con margen (verificado con la cara de ojos más grandes, “Asombro”). Ninguna boca, ni de habla ni de expresión, toca el aro (margen automático de caras.py).
•    Los PIES NO SE MUEVEN en todo el video (es el chiste): huesos pie_* y raiz sin desplazamiento; solo el pie derecho golpetea en la escena 1 (sube 6 pt y vuelve, sin despegarse del lugar). La sombra y el reflejo no se corren.
•    Los pétalos siguen los movimientos con retardo, sin atravesar la cabeza.
•    Subtítulos debajo de los pies y de la sombra (y 1450 a 1600): nunca tapan el cuerpo ni la firma; la firma entra cuando ya se borró el último subtítulo.
•    Verificación obligatoria antes del render completo: hoja de cuadros clave (render.mjs --solo) en 12, 40, 70, 100, 114, 126, 136, 147, 160, 175, 205, 230 y revisar.mjs sobre el video compuesto.

Escena 1 — La espera
Tiempo: 00:00 a 00:00,8 (cuadros 0–24)
Imagen: el reflector ya encendido; Bloomie de pie en el centro, de frente. Mira a la izquierda (00:00 a 00:00,4) y a la derecha (00:00,4 a 00:00,8) como buscando a alguien; golpetea el piso con el pie derecho en 00:00,15, 00:00,45 y 00:00,75.
Profundidad: rotY 0 → -0,2 → +0,2 (siempre ¾ suave), la cabeza acompaña el giro con 3 cuadros de retardo.
Elementos y textos:
•    Ojos de “Mirando a un costado” (espejados cuando mira al otro lado), boca “Cerrada”
•    Parpadeo en 00:00,4 (cara “Parpadeo”, 3 cuadros)
•    Tic-tac de reloj suave, de 00:00 a 00:02,3
Intención: plantear la situación sin palabras: está esperando a alguien que no llega.

Escena 2 — “For hours…”
Tiempo: 00:00,8 a 00:02,8 (cuadros 24–84)
Imagen: vuelve de frente a cámara (rotY 0 en 00:00,8 a 00:01,0) y cruza los brazos delante del pecho (00:00,8 a 00:01,1); lo cuenta con fastidio. De 00:02,34 a 00:02,8, medio segundo de silencio: suspira (el cuerpo baja 3 % y vuelve) y mira de reojo a un costado.
Profundidad: manos delante del pecho, por debajo de la cara (z +46 y +40 pt).
Elementos y textos:
•    Ojos de “Parpadeo” (cansado) con las bocas de Rhubarb mientras habla
•    Voz A desde 00:00,8; palabras: “I” 00:00,81 · “waited” 00:00,86 · “for” 00:01,31 · “my” 00:01,44 · “date” 00:01,58 · “for” 00:01,89 · “hours…” 00:02,02 a 00:02,38
•    Subtítulo palabra por palabra (dos líneas):
“I waited for my date”
“for hours…”
•    En el suspiro: ojos de “Mirando a un costado”, boca “Cerrada”; el subtítulo se borra en 00:02,5
Intención: armar la expectativa; la pausa prepara el primer remate.

Escena 3 — “Stood up!”
Tiempo: 00:02,8 a 00:03,8 (cuadros 84–114)
Imagen: descruza los brazos; se le caen los hombros (cuerpo sy 0,96), la cabeza baja (y +6 pt, cabeceo +8°) y los pétalos se caen (+8°).
Elementos y textos:
•    Ojos de “Triste” con las bocas de Rhubarb; al terminar, cara “Triste” completa
•    Voz B desde 00:02,84; palabras: “and” 00:02,86 · “I” 00:03,04 · “got” 00:03,12 · “stood” 00:03,40 · “up!” 00:03,64 a 00:03,8
•    Subtítulo:
“and I got stood up!”
•    Trombón triste “womp womp” en 00:03,66 (bajo)
•    El subtítulo se borra en 00:03,95
Intención: el remate “falso”, la parte que todos ven venir.

Escena 4 — El tirón
Tiempo: 00:03,8 a 00:05,3 (cuadros 114–159)
Imagen: ofendido, levanta el mentón y gira hacia la derecha para irse.
1.    Primer tirón (00:03,8 a 00:04,4): gira (rotY 0 → 0,35), se inclina hacia la salida (cuerpo rot +12°) y se estira como goma (cuerpo sy 1,12; cabeza y -8 pt) con los pies clavados; en 00:04,2 vuelve de golpe con rebote (sy 0,92 → 1,0).
2.    Segundo tirón, más fuerte (00:04,5 a 00:05,05): inclinación +18°, estirón sy 1,16; vuelve de golpe en 00:04,92 con rebote más grande (sy 0,88 → 1,03 → 1,0).
3.    00:05,05 a 00:05,3: se queda quieto y se mira los pies (cabeceo +12°).
Profundidad: rotY se queda en 0,35 durante los tirones (¾, sin perfil); la sombra y los pies no se mueven; los pétalos latiguean con retardo en cada rebote.
Elementos y textos:
•    Cara “Esfuerzo” en cada tirón (00:03,85 a 00:04,2 y 00:04,5 a 00:04,92)
•    Cara “Asombro” después de cada rebote y al mirarse los pies
•    Estirón elástico en 00:03,85 y 00:04,5; boing en 00:04,2 y 00:04,92
•    Sin subtítulo (el chiste es visual)
Intención: mostrar con el cuerpo que está plantado antes de decirlo.

Escena 5 — “I'm planted!”
Tiempo: 00:05,3 a 00:07,25 (cuadros 159–218)
Imagen: vuelve a mirar a cámara (rotY 0,35 → 0 en 00:05,3 a 00:05,6) y encoge los hombros (manos arriba a los costados, abiertas, por fuera de la cara: mano rot ±60°, z +20 pt; cuerpo sy 1,03); lo dice con resignación divertida. En “planted!” la cámara se acerca un poco (dolly 1,00 → 1,04 en 00:06,7 a 00:07,03, después se queda).
Elementos y textos:
•    Ojos de “Normal” con las bocas de Rhubarb en “And I can't even leave…”
•    Ojos de “Resignado” con las bocas de Rhubarb en “I'm planted!”
•    Voz C desde 00:05,3; palabras: “And” 00:05,33 · “I” 00:05,44 · “can't” 00:05,48 · “even” 00:05,71 · “leave…” 00:05,90 a 00:06,14 · (pausa) · “I'm” 00:06,57 · “planted!” 00:06,70 a 00:07,04
•    Subtítulo palabra por palabra:
“And I can't even leave…”
“I'm planted!”
(“planted!” en naranja y 1,2 veces más grande)
•    El subtítulo se borra en 00:07,25
Intención: el remate verdadero: lo dejaron plantado y está literalmente plantado.

Escena 6 — Ba-dum-tss
Tiempo: 00:07,25 a 00:08,5 (cuadros 218–255)
Imagen: Bloomie sonríe a cámara con los hombros todavía arriba, hace un mini rebote en el lugar (cuerpo sy 0,94 → 1,04 → 1,0 en 00:07,3 a 00:07,7, sin despegar los pies) y baja los brazos; caen unos pétalos del kit (naranja y turquesa) y destellos.
Profundidad: partículas en dos planos (las de atrás desenfocadas); las de adelante esquivan el óvalo de la cara y se apagan antes de la zona de la firma.
Evolución visual y textos:
1.    00:07,25 redoblante “ba-dum-tss”; cara “Alegría”
2.    00:07,3 empiezan a caer las partículas; destello en 00:07,3
3.    00:07,5 aparece abajo la firma con un rebote chico:
“Bloomie”
4.    00:08,2 a 00:08,5 el reflector baja un 20 % y los efectos se apagan con un fundido
Cierre: Bloomie sonriendo, plantado, con la firma abajo.
Intención: rematar con el clásico de stand-up y dejar la marca.
