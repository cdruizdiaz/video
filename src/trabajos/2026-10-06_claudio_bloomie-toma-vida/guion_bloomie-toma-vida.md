VIDEO: Bloomie toma vida
Duración: 5 segundos.
Formato: Vertical 9:16, 1080 × 1920.
Estética: escenario negro con piso gris muy oscuro y reflejo suave; un reflector cálido (ámbar) desde arriba a la izquierda; Bloomie con su paleta exacta (cara #ef913c, pétalos #dc7b26 / #ea8021, contorno #bc7208, ojos y boca #150b09); tipografía Fredoka (kit Bloomie); firma “Bloomie” en Fredoka naranja con borde crema al cierre. Kit del personaje: se usa la imagen del kit que se pasa como link/ruta al abrir el trabajo (kit_bloomie_3d.png en C:/Videos/crudos/2026-10-06_claudio_bloomie-toma-vida/: hoja de caras sin piel, bocas sueltas, vistas de frente, perfil y espaldas, partículas, paleta). Contenido importante entre y=250 y y=1580.
Tono: mágico y tierno, demostración de calidad; sin textos salvo la firma “Bloomie”; voseo si se agrega alguno.
Audio: sin música; efectos de Mixkit en una sola mezcla (preparar_audio.mjs, -14 LUFS medidos con ebur128): interruptor del reflector 2579 (00:00,2), melodía mágica 2986 de colchón desde que despierta (00:01 a 00:05, con fundido), whoosh suave 1492 en la órbita (00:01,1) y en el despegue (00:02,9), pop 731 al asombrarse (00:02,2), boing 2894 al aterrizar (00:03,33), destello 3062 en el saludo (00:03,53).
Transiciones: sin cortes (un solo plano continuo de 150 cuadros). Todo aparece por luz y movimiento, nada por fundido de imagen salvo la firma.
Modo de animación: 3D (Blender Eevee, modelo de Bloomie desde el rig, cara del kit como textura; la órbita es el personaje girando con sus luces, así se ve como si la cámara lo rodeara; haz, polvo, piso, reflejo, profundidad de campo y partículas van en Remotion). Luz principal desde arriba a la izquierda (125°, altura 55°) + luz de recorte detrás a la derecha que dibuja el borde de los pétalos. Profundidad: órbita de cámara de ~30°, sombra de contacto que cambia con el salto, desenfoque de fondo y partículas en dos planos (detrás y delante).
Reglas de superposición (valen para TODAS las escenas):
•    Orden de profundidad fijo de atrás hacia adelante: fondo → partículas de atrás → pétalos de la nuca → cuerpo → cabeza/cara → brazos y manos → partículas de adelante. Las manos van SIEMPRE delante del cuerpo; nada pasa por delante de los ojos.
•    Nada que toque las manos va como "tarjeta" plana: las manos y todo lo que interactúa con ellas son geometría 3D real, así Blender resuelve quién tapa a quién (en bloomie-rock la guitarra plana tapaba la mano que rasgueaba).
•    Contacto sin atravesar: las manos no se meten dentro del cuerpo ni de la cabeza (separación mínima visible de ~1 cm); los pies apoyan en el piso sin hundirse; los pétalos no atraviesan la cabeza al girar.
•    Las partículas de adelante esquivan la zona de la cara (óvalo de ojos y boca) y nunca pasan sobre la firma; la firma nunca tapa a Bloomie.
•    En la cara, la boca nunca toca el aro de los anteojos (margen mínimo automático en caras.py).
•    Verificación obligatoria: node scripts/revisar.mjs en los cuadros 30, 54, 66, 84, 87, 99, 105, 120 y 149 (contactos, despegue, caída, saludo); cualquier cuadro en que algo atraviese o tape mal se corrige antes del render.

Escena 1 — Se enciende la luz
Tiempo: 00:00 a 00:01
Imagen: negro total; a los 00:00,2 se enciende el reflector cálido de golpe con un parpadeo corto y revela a Bloomie de pie, dormido, en giro ¾, con la cabeza caída hacia un costado y los pétalos caídos. Polvo en suspensión dentro del haz y charco de luz en el piso.
Profundidad: cámara fija a la altura de Bloomie; sombra de contacto ovalada bajo el cuerpo; reflector que se enciende y contraluz (luces por cuadro en render.py); haz y polvo en Remotion.
Elementos y textos:
•    Cara "dormido" (ojos cerrados) del kit
•    Respiración lenta (el cuerpo sube y baja un 2 %)
Intención: crear expectativa y mostrar desde el primer cuadro que la luz es real sobre un volumen.

Escena 2 — Despierta y gira
Tiempo: 00:01 a 00:02,2
Imagen: Bloomie abre los ojos (despertando → parpadeo → abiertos), se estira con los dos brazos arriba y se endereza mientras gira hacia la cámara; al mismo tiempo la cámara orbita ~30° de izquierda a derecha y termina de frente.
Profundidad: órbita (giro del personaje con las luces + paralaje del fondo); la luz de recorte aparece en el borde de los pétalos a medida que gira; los brazos al estirarse pasan por detrás de los pétalos de arriba sin atravesarlos.
Elementos y textos:
•    Caras "despertando" → "parpadeo" → "normal" del kit
•    Órbita de ¾ a frente (±30°): no llega a mostrar perfil ni espalda
Intención: mostrar el volumen desde distintos ángulos: lo que el 2D no puede hacer.

Escena 3 — Se mira las manos
Tiempo: 00:02,2 a 00:02,9
Imagen: Bloomie levanta las dos manos delante del pecho, palmas hacia él, y las mira con asombro; leve acercamiento de cámara (dolly in del 5 %).
Profundidad: las manos quedan delante del cuerpo y POR DEBAJO de la línea de los ojos (no tapan la cara); separación visible entre manos y pecho.
Elementos y textos:
•    Cara "asombro" (ojos grandes, boca "O") del kit
Intención: el momento de "¡soy 3D!", que da sentido a la pieza.

Escena 4 — Salto
Tiempo: 00:02,9 a 00:03,5
Imagen: se agacha (squash: aplastado 12 %), salta (stretch: estirado 10 %) hasta ~1/4 de su altura y cae con un rebote corto que lo aplasta y lo devuelve a su forma.
Profundidad: la sombra de contacto se achica y se aclara en el aire y vuelve a crecer al caer; los pétalos van con retardo (siguen el movimiento un instante después) sin atravesar la cabeza; los pies tocan el piso justo en 00:03,3.
Elementos y textos:
•    Cara "alegría" desde el despegue
Intención: mostrar animación con peso y física creíble.

Escena 5 — Saludo y firma
Tiempo: 00:03,5 a 00:05
Imagen: de frente, Bloomie saluda con la mano derecha (tres vaivenes) y sonrisa grande; caen pétalos/destellos de la marca; fondo levemente desenfocado.
Profundidad: profundidad de campo con foco en Bloomie (el fondo se desenfoca en Remotion); partículas en dos planos (las de atrás desenfocadas en la capa de fondo, las de adelante en la capa superior de Remotion, fuera del óvalo de la cara); la mano que saluda va delante de la cabeza en el lado libre, sin cruzar los ojos.
Evolución visual y textos:
1.    00:03,5 empieza el saludo y la lluvia de partículas
2.    00:04,2 aparece abajo (y≈1500, debajo de la sombra) la firma con un rebote chico:
“Bloomie”
3.    00:04,6 Bloomie queda en pose final sonriendo, el saludo termina
Cierre: Bloomie quieto respirando con la firma abajo; el reflector baja un 20 % en los últimos 0,3 s; los efectos se apagan con un fundido.
Intención: cerrar con simpatía y firma de marca, dejando la imagen "de póster".
