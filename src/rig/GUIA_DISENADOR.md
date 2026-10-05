# Guía para el diseñador — personajes animables (rig)

Los personajes se animan **por piezas** (como un títere de recorte): cabeza, cuerpo, manos, pies, ojos y bocas se mueven y se cambian por código, sin redibujar nada. Todo sale del `.ai`: cuanto mejor separadas estén las piezas, mejor se mueve el personaje.

Hay dos niveles. Con el **mínimo** ya funciona; el **óptimo** da mejores resultados y menos correcciones.

## Mínimo (como `Bloomie.ai`)

Una sola mesa de trabajo, una sola capa, con:

1. **Vistas del personaje completo en la fila de arriba**, alineadas sobre el mismo piso: frente (obligatoria), perfil y espalda (opcionales). El perfil mirando hacia **un** lado; el otro se espeja.
2. **Caras sueltas debajo** (una por expresión: normal, feliz, triste, enojado…), del **mismo tamaño** que la cabeza del frente. Disfraces y accesorios de temporada (sombrero, escoba, cuernos…) dibujados junto a su cara.
3. Separación clara entre vistas y caras: que no se toquen.
4. Cada pieza dibujada como relleno + contorno + sombra **una encima de la otra** (así se reconocen como una sola pieza).
5. Ojos con blanco y pupila, y la boca en tinta oscura (se reconocen por color).

Lo que falte se resuelve por código y se avisa: bocas para hablar, pie o mano de atrás en el perfil, piezas unidas (las dos manos o los dos pies en un solo trazado se separan con un corte).

## Óptimo (lo que mejora el resultado)

Todo lo del mínimo, más:

1. **Una capa de primer nivel por pieza, con su nombre** (Illustrator → panel Capas; las subcapas no sirven: hay que usar capas de primer nivel). Si una pieza aparece en varias vistas y caras, va en la **misma** capa (la posición en la hoja dice de qué vista es).

   | Capa | Qué tiene |
   |---|---|
   | `cabeza` | la forma de la cabeza (sin rasgos) |
   | `cuerpo` | el torso |
   | `brazo_izq`, `antebrazo_izq`, `mano_izq` (y `_der`) | cada tramo del brazo por separado |
   | `pierna_izq`, `pie_izq` (y `_der`) | cada tramo de la pierna |
   | `ojo_izq`, `pupila_izq`, `ceja_izq` (y `_der`) | rasgos (sobre la cabeza) |
   | `boca` | la boca de cada cara |
   | `anteojos`, `tocado` (sombrero, gorro, corona) | sobre la cara |
   | `petalo_sup`, `pelo_izq`, `oreja_der`… | lo que rodea la cabeza y se mece |
   | `cola`, `capa`… | otras piezas pegadas al cuerpo |
   | `accesorio_escoba`, `accesorio_varita`… | objetos que se agarran o se ponen: **sueltos en la hoja**, fuera del personaje |

   *izq/der = como se ve en pantalla.*

2. **Bocas para hablar**, sueltas en la hoja, del tamaño de la boca normal, en capas `boca_A` … `boca_F`:
   - `boca_A` cerrada (M, B, P) · `boca_B` dientes / consonantes · `boca_C` E / I · `boca_D` A bien abierta · `boca_E` O redonda · `boca_F` U / W chiquita.
3. **Piezas completas debajo de las uniones**: el hombro redondeado que sigue por debajo del torso, la cadera debajo del cuerpo, el cuello debajo de la cabeza. Al girar no quedan huecos.
4. **Brazos y piernas en dos tramos** (brazo + antebrazo, pierna + pie) si el personaje los tiene: se doblan en el codo y la rodilla.
5. **Vista ¾** (opcional): giros más suaves entre frente y perfil.

## Para 2,5D (volumen y giros)

Lo mínimo ya se puede animar en 2,5D (el giro ¾ y la luz se simulan por código), pero esto lo mejora mucho:

1. **Vista ¾** (frente girado hacia cada lado, o hacia uno y se espeja): es lo que más suma; los giros dejan de ser simulados.
2. **Pupilas en su propia capa** (`pupila_izq`, `pupila_der`), separadas del blanco del ojo, con su **brillo** aparte: la mirada y los "ojos de cachorro" quedan más naturales.
3. **Sombras y brillos de cada pieza en capas aparte** (`sombra_cabeza`, `brillo_cabeza`, `sombra_cuerpo`…), en vez de pegados a la pieza: así se puede mover la luz según la escena.
4. **Accesorios y disfraces sueltos**, cada uno en su capa (`tocado_gorro`, `accesorio_escoba`, `nariz_reno`…), no unidos a los anteojos ni a la cara.
5. **Algunas expresiones de perfil** (feliz, triste, enojado): hoy el perfil tiene una sola cara.
6. **Manos con más forma** (tipo mitón) si se van a saludar o juntar.

## Qué no hacer

- No expandir apariencia ni rasterizar: todo vectorial (trazados con relleno).
- No usar máscaras de recorte para formar las piezas (el contorno de la pieza tiene que ser su propio trazado).
- No agrupar piezas distintas en un solo trazado compuesto (por ejemplo, las dos manos).
- No usar efectos de Illustrator (sombras paralelas, desenfoques): las sombras como trazados semitransparentes sí funcionan.

Guardar como `.ai` con **"Crear archivo compatible con PDF"** activado (viene por defecto).
