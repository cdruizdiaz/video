# Kit de personajes — Sofi y Benja (Los Amigos Mat)

Para el video demo "Teorema de Pitágoras" (9:16, animación plana 2D), en **PNG sin fondo**. Los personajes se animan **por piezas**, como un títere de recorte: cada parte se mueve y se reemplaza por código, sin redibujar nada.

## Formato de entrega (PNG sin fondo)

El diseñador no trabaja en `.ai`, así que el kit va en **PNG con transparencia**. Lo que importa es que cada pieza venga **por separado y en su lugar**:

- **Opción 1 (la mejor): un PNG por pieza, todos del mismo tamaño de lienzo**, exportados "en su lugar". Si se apilan todos, se arma el personaje entero. Es lo que sale al exportar las capas en Photoshop, Procreate, Krita o Clip Studio ("exportar capas a archivos", sin recortar). Un **PSD con capas nombradas** vale igual (lo leo directamente).
- **Opción 2 (si no puede la 1): una hoja PNG** con las piezas separadas, sin tocarse (al menos 20 px de aire), con **el personaje armado al lado** como referencia y una lista que diga qué es cada pieza. Funciona, pero tengo que ubicar cada pieza a mano: tarda más y puede quedar algún desfase.

Para las dos opciones:
- **Nombre de cada archivo o capa = el de las tablas de abajo** (`brazo_izq.png`, `boca_D.png`…). *izq/der = como se ve en pantalla.*
- **Tamaño:** el personaje entero de **unos 2000 px de alto** (en el video ocupa ~800 px y así queda margen para acercar la cámara).
- PNG de 32 bits con alfa, **bordes limpios** (sin halo blanco ni negro alrededor) y sin sombra en el piso.
- **Las partes que quedan tapadas también se dibujan:** el hombro sigue por debajo del torso, la cadera por debajo de la remera y el cuello por debajo del cuello de la ropa. Si no, al girar un brazo o la cabeza aparece un agujero transparente.
- Las mismas proporciones y la misma luz en todas las piezas; los dos personajes en la misma escala.

## Vistas (fila de arriba, sobre el mismo piso, sin tocarse)

| Vista | Para qué | ¿Hace falta? |
|---|---|---|
| **¾ mirando hacia el centro** (Benja mira a la derecha, Sofi a la izquierda) | Es la vista principal: se hablan entre ellos y miran la pizarra | **Sí** |
| Frente | Cuando le hablan a cámara (gancho y cierre) | **Sí** |
| Perfil caminando | El gag de la plaza | Opcional (si no está, se resuelve con el ¾) |
| Espalda | — | No |

## Piezas de cada vista (capas)

| Capa | Notas |
|---|---|
| `cabeza` | Solo la forma, sin rasgos. Con el **cuello completo por debajo** del cuello de la ropa |
| `cuerpo` | Torso con la ropa |
| `cuello` | Si no viene dentro de `cabeza` |
| `brazo_izq`, `antebrazo_izq`, `mano_izq` (y `_der`) | En **dos tramos** (se doblan en el codo). Hombro redondeado que siga por debajo del torso |
| `pierna_izq`, `pie_izq` (y `_der`) | Pierna (pantalón ancho) y zapatilla por separado. La cadera sigue por debajo del cuerpo |
| `ojo_izq`, `pupila_izq`, `ceja_izq` (y `_der`) | Blanco del ojo, pupila con su brillo, ceja: cada uno aparte |
| `parpado_izq`, `parpado_der` | Ojo cerrado, para parpadear |
| `boca` | La boca neutra |
| `nariz`, `oreja_izq`/`oreja_der` (si se ven) | |
| `pelo_atras`, `pelo_frente`, `pelo_izq`, `pelo_der` | Separado en mechones grandes, así se mece |

**Sofi, además:**

| Capa | Notas |
|---|---|
| `tocado_piluso` | El piluso fucsia, aparte de la cabeza |
| `aro_izq`, `aro_der` | Las argollas, aparte (se balancean) |
| `capucha` | La capucha del buzo, detrás de la cabeza |
| Manos | Con las **dos manos afuera**. La pose de la referencia con la mano en el bolsillo va como variante: `mano_bolsillo_der` |

**Benja, además:**

| Capa | Notas |
|---|---|
| `tocado_gorra` | La gorra al revés, aparte de la cabeza |
| `pulsera` | La pulserita de hilo (puede ir dentro de `mano_izq`) |
| Camiseta | **Celeste y blanca genérica**: sin escudo de la AFA, sin estrellas y sin las 3 tiras (las rayas de los hombros), porque son marcas registradas y el canal es público. Lo mismo para el buzo de Santi y la campera de Cami cuando aparezcan |

## Manos (una pieza cada una, en el mismo lugar que la mano normal)

| Capa | Quién | Para qué |
|---|---|---|
| `mano_abierta` | los dos | Explicar, el "¿y?" de Benja |
| `mano_senala` | **Sofi** (imprescindible); Benja (deseable) | Señalar la pizarra y las piezas |
| `mano_dedo_arriba` | Sofi | "¡Tengo una idea!" (la pose de la referencia) |
| `mano_pulgar` | los dos | Cierre |
| `mano_puno` | Benja | Festejo "¡ahhh, ahora sí!" |
| `mano_rasca` (o la mano en la nuca) | Benja | "No entiendo" |

## Caras / expresiones

Cada cara es **una capa con ojos, cejas y boca juntos** (sin la cabeza), en el mismo lugar que los rasgos de la vista ¾: se cambia la cara entera encima de la cabeza.

| Cara | Sofi | Benja |
|---|---|---|
| `normal` | ✔ | ✔ |
| `feliz` | ✔ | ✔ |
| `explicando` (cejas arriba, segura) | ✔ | — |
| `picara` (media sonrisa, "mirá esto") | ✔ | — |
| `duda` (una ceja arriba, boca de costado) | — | ✔ |
| `confundido` | — | ✔ |
| `sorprendido` (ojos grandes, boca en O) | ✔ | ✔ |

Lo mínimo es tenerlas en la vista ¾. En el frente alcanza con `normal` y `feliz`.

## Bocas para hablar (en el lugar de la boca, en la vista ¾)

| Capa | Forma |
|---|---|
| `boca_A` | cerrada (M, B, P) |
| `boca_B` | dientes apenas abiertos (consonantes) |
| `boca_C` | E / I (ancha) |
| `boca_D` | A (bien abierta) |
| `boca_E` | O (redonda) |
| `boca_F` | U (chiquita) |

Si no llegan, se generan por código a partir de la boca neutra (sale más pobre, pero sirve para el MVP).

## Qué no hacer
- No dejar ninguna pieza "pegada" al cuerpo en el mismo PNG: las dos manos, los dos ojos o el pelo con la cabeza van separados.
- No recortar los PNG de la opción 1 (todos con el lienzo completo).
- No poner fondo, sombra paralela ni brillo exterior alrededor de las piezas.

## Prioridad para el MVP
1. Vista ¾ completa con piezas, párpados y `mano_senala` (Sofi), `mano_abierta` (los dos).
2. Bocas A–F en ¾.
3. Caras de la tabla.
4. Frente.
5. Resto de las manos y el perfil.
