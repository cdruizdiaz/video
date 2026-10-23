# Prompts para ChatGPT: kit en PNG de Benja y Sofi

Cómo usarlos:
- Un chat nuevo por personaje. En cada mensaje, adjuntar la imagen de referencia (`personajes_fila.png`).
- Desde el prompt 2, adjuntar también la hoja del prompt 1 de ese personaje, para que mantenga el tamaño y el dibujo.
- Si sale con fondo blanco o a cuadros, pedir: "Volvé a generarla con fondo transparente real (PNG con canal alfa)".
- Descargar cada hoja en PNG y guardarla como `benja_1_cuerpo.png`, `benja_2_cabezas.png`, `benja_3_bocas.png`, `benja_4_manos.png` (y lo mismo para `sofi_…`).

Para simplificar con IA, cada expresión es una **cabeza completa** (con pelo y gorra o piluso) que se cambia entera. Las bocas van aparte para hablar.

---

## Prompt 1: cuerpo desarmado (vista ¾)

> Te adjunto una imagen con seis personajes. Quiero trabajar solo con **BENJA**, el primero de la izquierda (gorra azul al revés, pelo castaño con rulos, camiseta de rayas celestes y blancas, jean azul ancho, zapatillas blancas).
>
> Generá UNA imagen PNG con **fondo transparente real**, de 2048×2048 px, que sea una **hoja de piezas recortables para animación de recorte (cut-out, tipo títere)**. Mismo estilo, colores y proporciones que la referencia. Con iluminación pareja y sin sombra en el piso.
>
> Cambio de vestuario: la camiseta es **celeste y blanca genérica, sin escudo, sin estrellas, sin logos y sin tiras en los hombros**.
>
> Vista: **¾ mirando hacia la derecha** de la imagen.
>
> Distribución (todas las piezas a la MISMA escala, separadas entre sí por al menos 40 px de transparente, sin tocarse y sin superponerse, sin textos ni etiquetas):
> - **Columna izquierda:** Benja **armado completo**, de pie, en pose neutra, con los brazos colgando relajados al costado. Es la referencia de cómo encajan las piezas.
> - **Fila 1 (a la derecha):** la **cabeza** completa (con pelo, gorra, orejas y cuello largo que siga hacia abajo como un cilindro) y el **torso** con la camiseta, sin brazos, sin cabeza y sin piernas. En los hombros, círculos completos y la cadera dibujada entera por debajo de la camiseta.
> - **Fila 2:** el **brazo** del lado izquierdo y el del lado derecho, cada uno partido en dos piezas: **brazo superior** (hombro a codo, con los extremos redondeados) y **antebrazo** (codo a muñeca, con los extremos redondeados). Las dos **manos** abiertas y relajadas, sueltas.
> - **Fila 3:** las dos **piernas** (pantalón de la cintura al tobillo, cada una suelta) y las dos **zapatillas**, sueltas.
>
> Las piezas tienen que estar enteras: las partes que en el personaje armado quedan tapadas (hombros, cuello, cadera, la parte de arriba de las piernas) también se dibujan completas y con bordes redondeados, porque se van a rotar en las articulaciones. Bordes limpios, sin halo ni contorno blanco alrededor.

## Prompt 2: cabezas con expresiones

> Usando la hoja de piezas que te adjunto, generá otra imagen PNG con **fondo transparente real**, 2048×2048 px, con la **cabeza de BENJA** (con pelo, gorra, orejas y el mismo cuello largo) **exactamente del mismo tamaño, ángulo (¾ mirando hacia la derecha) y posición del cuello** que la cabeza de la hoja. Solo cambia la cara.
>
> Una grilla de 3 columnas × 3 filas, cada cabeza separada por al menos 60 px de transparente, sin textos. En este orden, de izquierda a derecha y de arriba abajo:
> 1. normal (boca cerrada, tranquila)
> 2. feliz (sonrisa abierta)
> 3. duda (una ceja levantada, boca torcida hacia un costado)
> 4. confundido (cejas fruncidas hacia arriba, boca ondulada)
> 5. sorprendido (ojos muy abiertos, boca en "O")
> 6. ojos cerrados (para parpadear; boca normal)
> 7. mirando hacia arriba, pensando (pupilas arriba)
> 8. "¡ahhh, ahora entiendo!" (ojos brillantes, boca muy abierta y contenta)
> 9. normal, pero **sin boca** (piel lisa donde va la boca; sirve de base para hablar)

## Prompt 3: bocas para hablar

> Generá una imagen PNG con **fondo transparente real**, 2048×1024 px, con **solo bocas de BENJA** (labios, interior y dientes; sin la piel de alrededor), en el mismo estilo y del **tamaño exacto** que tendrían sobre su cabeza en ¾ de la hoja adjunta. 6 bocas en una fila, separadas por al menos 80 px, sin textos, en este orden:
> 1. cerrada, labios juntos (M, B, P)
> 2. apenas abierta, mostrando los dientes (consonantes S, T, D)
> 3. ancha y estirada (E, I)
> 4. bien abierta (A)
> 5. redonda (O)
> 6. chiquita y redondeada hacia adelante (U)

## Prompt 4: manos (gestos)

> Generá una imagen PNG con **fondo transparente real**, 2048×1024 px, con **manos sueltas de BENJA** (con la muñeca incluida y un poco de puño de la piel; sin manga), del **mismo tamaño** que las manos de la hoja adjunta y con el mismo tono de piel turquesa. 6 manos en una fila, separadas por al menos 60 px, sin textos, en este orden:
> 1. abierta con la palma hacia arriba (gesto de "¿y?")
> 2. señalando con el índice hacia el costado
> 3. dedo índice hacia arriba ("¡tengo una idea!")
> 4. pulgar arriba
> 5. puño cerrado (festejo)
> 6. mano rascándose (dedos doblados como rascando la nuca)
>
> Si lleva la pulserita de hilo en la referencia, que esté en la mano izquierda de la 1.

---

## Para Sofi

Los mismos 4 prompts, cambiando estas partes:

- **Prompt 1:**
  - "**SOFI**, la segunda desde la izquierda (piluso fucsia, pelo negro largo con rulos, aros de argolla dorados, buzo gris con capucha, jean azul ancho, zapatillas negras)".
  - "Vista ¾ mirando hacia la **izquierda** de la imagen".
  - "**Sin el texto ni el dibujo del buzo**": buzo gris liso (o con un dibujo propio sin letras).
  - "Las dos manos **fuera del bolsillo**".
  - Sumar a la fila 1: "los dos **aros** sueltos y la **capucha** suelta".
  - Vestuario: no aplica el cambio de la camiseta.
- **Prompt 2**, con estas 9 caras:
  1. normal
  2. feliz
  3. explicando (cejas arriba, segura, boca entreabierta)
  4. pícara (media sonrisa, "mirá esto")
  5. sorprendida (ojos muy abiertos, boca en "O")
  6. ojos cerrados
  7. mirando hacia un costado, señalando con la mirada
  8. orgullosa (ojos entrecerrados, sonrisa)
  9. normal sin boca
- **Prompt 3:** igual, con las bocas de Sofi.
- **Prompt 4:**
  1. abierta explicando
  2. **señalando con el índice** (la más importante)
  3. dedo índice hacia arriba
  4. pulgar arriba
  5. mano en el bolsillo, solo como referencia
  6. mano mostrando "tres" con los dedos

## Qué revisar antes de pasármelas
- Que el fondo sea transparente de verdad (al abrirla en el navegador no se ve blanco).
- Que ninguna pieza toque a otra.
- Que la cabeza de las expresiones tenga el mismo tamaño que la de la hoja 1. Si sale distinta, pedir: "La cabeza tiene que medir exactamente lo mismo que en la hoja adjunta".
- Que no aparezcan textos, logos ni escudos.

Dejarlas en `C:/Videos/crudos/2026-10-08_los-amigos-mat_teorema-pitagoras/kit/` y avisarme: yo las recorto, las ubico y armo el rig.

---

## Prompt único (todo junto)

Adjuntar `personajes_fila.png`. Si ChatGPT se detiene después de una imagen, escribir "seguí con la siguiente". Si una hoja sale mal, pedir solo esa: "rehacé la imagen 3".

```
Te adjunto una imagen con seis personajes. Vamos a usar dos: BENJA (el primero de la izquierda: gorra azul al revés, pelo castaño con rulos, camiseta de rayas celestes y blancas, jean azul ancho, zapatillas blancas) y SOFI (la segunda: piluso fucsia, pelo negro largo con rulos, aros de argolla dorados, buzo gris con capucha, jean azul ancho, zapatillas negras).

Necesito un KIT DE PIEZAS PARA ANIMACIÓN DE RECORTE (cut-out, tipo títere): las piezas se van a recortar y mover por separado en las articulaciones. Generá 8 imágenes, de a una, en el orden de abajo, sin esperar a que te confirme entre una y otra.

REGLAS PARA LAS 8 IMÁGENES
- PNG con FONDO TRANSPARENTE REAL (canal alfa). Nada de fondo blanco ni a cuadros.
- Mismo estilo, colores, proporciones y tono de piel turquesa que la referencia. Iluminación pareja, sin sombra en el piso.
- Piezas separadas entre sí por al menos 40 px de transparente: ninguna se toca ni se superpone.
- Sin textos, números, etiquetas, logos ni escudos.
- Bordes limpios, sin halo ni contorno blanco alrededor.
- Todas las imágenes de un mismo personaje a la MISMA escala: una cabeza, una mano o una boca miden lo mismo en todas las hojas.
- Las partes que en el personaje armado quedan tapadas (hombros, cuello, cadera, la parte de arriba de las piernas) se dibujan completas y con extremos redondeados, porque se van a rotar.
- Vestuario: la camiseta de Benja es celeste y blanca genérica (sin escudo, sin estrellas, sin tiras en los hombros). El buzo de Sofi es gris liso, sin texto ni dibujo. Sofi tiene las dos manos fuera del bolsillo.
- Vista: Benja en ¾ mirando hacia la DERECHA de la imagen; Sofi en ¾ mirando hacia la IZQUIERDA.

IMAGEN 1: BENJA, CUERPO DESARMADO (2048×2048)
- Columna izquierda: Benja armado completo, de pie, pose neutra, con los brazos colgando relajados (referencia de cómo encajan las piezas).
- Fila 1: la cabeza completa (con pelo, gorra, orejas y un cuello largo que siga hacia abajo) y el torso con la camiseta, sin brazos, sin cabeza y sin piernas, con los hombros como círculos completos y la cadera entera por debajo.
- Fila 2: los dos brazos, cada uno en dos piezas (brazo superior de hombro a codo; antebrazo de codo a muñeca) y las dos manos abiertas y relajadas.
- Fila 3: las dos piernas (pantalón de la cintura al tobillo, cada una suelta) y las dos zapatillas.

IMAGEN 2: BENJA, CABEZAS (2048×2048)
La misma cabeza de la imagen 1 (con pelo, gorra, orejas y cuello), exactamente del mismo tamaño, ángulo y posición del cuello; solo cambia la cara. Grilla de 3×3, en este orden (de izquierda a derecha y de arriba abajo):
1 normal, boca cerrada · 2 feliz, sonrisa abierta · 3 duda (una ceja levantada, boca torcida) · 4 confundido · 5 sorprendido (ojos muy abiertos, boca en O) · 6 ojos cerrados · 7 mirando hacia arriba, pensando · 8 "¡ahhh, ahora entiendo!" (boca muy abierta y contenta) · 9 normal pero SIN boca (piel lisa donde va la boca).

IMAGEN 3: BENJA, BOCAS PARA HABLAR (2048×1024)
Solo bocas (labios, interior y dientes, sin la piel de alrededor), del tamaño exacto que tienen sobre su cabeza. 6 en una fila:
1 cerrada, labios juntos (M, B, P) · 2 apenas abierta, mostrando los dientes (S, T, D) · 3 ancha y estirada (E, I) · 4 bien abierta (A) · 5 redonda (O) · 6 chiquita y redondeada (U).

IMAGEN 4: BENJA, MANOS (2048×1024)
Manos sueltas con la muñeca incluida, sin manga, del mismo tamaño que en la imagen 1. 6 en una fila:
1 abierta con la palma hacia arriba ("¿y?") · 2 señalando con el índice hacia el costado · 3 índice hacia arriba · 4 pulgar arriba · 5 puño cerrado (festejo) · 6 rascándose la nuca.

IMAGEN 5: SOFI, CUERPO DESARMADO (2048×2048)
Igual que la imagen 1, pero con Sofi. Su cabeza incluye pelo, piluso, orejas y cuello largo. Sumá a la fila 1 los dos aros de argolla sueltos y la capucha del buzo suelta.

IMAGEN 6: SOFI, CABEZAS (2048×2048)
Igual que la imagen 2, con estas caras:
1 normal · 2 feliz · 3 explicando (cejas arriba, segura, boca entreabierta) · 4 pícara (media sonrisa) · 5 sorprendida (boca en O) · 6 ojos cerrados · 7 mirando hacia un costado · 8 orgullosa (ojos entrecerrados, sonrisa) · 9 normal pero SIN boca.

IMAGEN 7: SOFI, BOCAS PARA HABLAR (2048×1024)
Las mismas 6 bocas que la imagen 3, con la boca de Sofi.

IMAGEN 8: SOFI, MANOS (2048×1024)
1 abierta explicando · 2 señalando con el índice hacia el costado (la más importante) · 3 índice hacia arriba ("¡tengo una idea!") · 4 pulgar arriba · 5 mano en el bolsillo · 6 mostrando "tres" con los dedos.
```

Guardar como `benja_1_cuerpo.png`, `benja_2_cabezas.png`, `benja_3_bocas.png`, `benja_4_manos.png`, `sofi_1_cuerpo.png`, `sofi_2_cabezas.png`, `sofi_3_bocas.png`, `sofi_4_manos.png` en `C:/Videos/crudos/2026-10-08_los-amigos-mat_teorema-pitagoras/kit/`.
