# Rig vectorial de personajes (cut-out)

Anima personajes **por piezas vectoriales** sacadas de su `.ai`, sin IA generativa ni sprites: el personaje es siempre el mismo dibujo (no se deforma entre cuadros), funciona sin internet y las animaciones se escriben en texto (barato en tokens).

```
.ai ──extraer_rig.py──▶ piezas.json + rig.json ──▶ Remotion (PersonajeRig) ──exportar.mjs──▶ .mov alfa / PNG / .mp4
          │                    ▲                          ▲
     mapa.json (correcciones)  └── editor del Studio      └── pistas: respirar, hablar, saludar, secuencias…
```

**Comando:** `/rig-personaje <archivo.ai> <nombre>` suma un personaje a la biblioteca (ver `.claude/commands/rig-personaje.md`).
**Para el diseñador:** [`GUIA_DISENADOR.md`](GUIA_DISENADOR.md) (mínimo: una hoja como `Bloomie.ai`; óptimo: capas con nombre).

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Original `.ai` | `C:/Videos/personajes/<nombre>/` (`carpetaPersonajes` de `scripts/herramientas.json`) |
| Piezas y rig (lo que usa Remotion) | `public/personajes/<nombre>/piezas.json`, `rig.json` |
| Correcciones de la extracción | `src/personajes/<nombre>/mapa.json` |
| Registro de la biblioteca | `src/personajes/index.ts` (+ `composiciones.ts`: editores y muestrarios) |
| Revisión (hojas chicas, informe) | `out/personajes/<nombre>/` |
| Motor | `src/rig/`: `tipos.ts` (zod), `pose.ts`, `Rig.tsx`, `animaciones.ts`, `secuencia.ts`, `lipsync.ts`, `EditorRig.tsx` |
| Plantilla | `src/plantillas/PersonajeRig/` (`PersonajeRig.tsx` + `calculos.ts`) |
| Scripts | `scripts/rig/`: `extraer_rig.py`, `vector_ai.py`, `hoja_animacion.mjs`, `exportar.mjs`, pruebas |

Las secuencias y transcripciones de cada trabajo van en `public/trabajos/<ID>/datos/` (como siempre).

## 1. Extraer las piezas

```
C:/Videos/_herramientas/.venv/Scripts/python.exe scripts/rig/extraer_rig.py <archivo.ai> <nombre> [--sinteticas todas|ninguna|visemas,pie_atras,mano_atras]
```

- **Sin capas con nombre** (como Bloomie): separa la hoja en bloques (fila de arriba = vistas: frente con 2 ojos, perfil con 1, espalda sin cara; abajo = caras y accesorios). Dentro de cada vista arma piezas (relleno + contorno + sombra semitransparente = una pieza) y las nombra por geometría y color: cabeza (la que tiene los rasgos), pétalos/pelo (tocan la cabeza y tienen color propio), cuerpo, manos, pies. Piezas unidas en un trazado (dos manos, dos pies) se separan con un recorte. Las caras se alinean a la cabeza del frente y se separan en ojos, cejas, boca, anteojos y tocado; lo que sobresale es accesorio.
- **Con capas con nombre** (`cabeza`, `brazo_izq`, `boca_A`…): usa los nombres; la adivinanza queda para lo que no tenga nombre.
- **Faltantes**: avisa y propone. Con `--sinteticas` los genera: visemas (escalas de la boca abierta + una boca cerrada M/B/P), pie y mano de atrás en el perfil (copias más oscuras). Quedan marcados `sintetica: true`.
- Si `rig.json` ya existe (con tus ajustes) no se pisa: lo nuevo va a `rig.propuesto.json`.
- Revisión: `hoja_bloques.png` (números de bloque), `hoja_vistas.png` (piezas con nombre), `hoja_rostros.png` (cada cara armada, bocas y accesorios), `informe.md` (alertas y propuestas).

### Personajes en PNG (kit pintado o hecho con IA, sin `.ai`)

```
C:/Videos/_herramientas/.venv/Scripts/python.exe scripts/rig/importar_png.py <nombre>
```

Lee `src/personajes/<nombre>/mapa_png.json` (ejemplos: `benja`, `sofi`) con 4 hojas PNG con transparencia: **cuerpo** (el personaje armado + sus piezas sueltas), **cabezas** (grilla de expresiones, incluida una *sin boca* y una con *ojos cerrados*), **bocas** (A–F) y **manos** (gestos). Los prompts para pedírselas a ChatGPT están en `src/trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/PROMPTS_CHATGPT.md`.

- El cuerpo se arma **como un títere, uniendo las articulaciones dibujadas** (bolas de hombro y cadera y cuello del torso; cilindros de codo, muñeca y tobillo); el armado de la hoja es solo referencia (la IA no lo dibuja con las mismas proporciones). En el mapa: el centro aproximado de cada pieza en la hoja (`c`), su `rol`, `_1`/`_2` para los pares (izq/der salen de la posición), `orden` de capas y opciones de limpieza: `recortarMangas`, `pintarBolaHombro`, `borrarPielTorso`, `codoTela`, `borrarCaderas`; `solape` por rol y `dx`/`dy` por pieza para ajustar a mano. Piezas sueltas (aros, capucha): `{"a": "cabeza" | "cuello", "en": [fx, fy], "hueso": …}`.
- Cada expresión es la **cabeza entera** (imagen), alineada a la del cuerpo; se genera su versión **sin boca** (para hablar con las bocas A–F encima) y un **parche de ojos cerrados** (parpadeo). Bocas del tamaño de la boca normal.
- Las manos de gestos son **variantes** de `mano_izq`/`mano_der` (`"muneca"` = de qué lado está la muñeca en la hoja): se cambian con `variantes: { mano_der: "senala" }` en una pose (pista `pose` o secuencia).
- Las piezas son trazos con `img` (+ `x, y, w, h`); `Rig.tsx` las dibuja con `<image>` y espera a que carguen (`delayRender`).
- Revisión: `out/personajes/<nombre>/hoja_armado.png` (armado de la hoja contra la reconstrucción, con pivotes) y `hoja_rostros.png` (cada cara y su versión hablando). La búsqueda de las cabezas se guarda en `cache_ubicaciones.json`.
- Límites: no hay 2,5D (sin `luz` ni giro por profundidades: las piezas son pintadas); las costuras de hombros y cintura dependen de cómo vino el kit.

- Vestuario: `mangaLarga` pinta de tela la piel de brazos y antebrazos (conserva luces y sombras); `brazoSinManga` + `anclaMunon` hacen salir el brazo de abajo de la manga corta del torso (gira desde ahí); `borrarPielTorso` saca bolas y muñones del torso y rellena el hueco de los hombros copiando la tela de abajo (las rayas siguen).
- Cajas de una pose (`src/rig/cajas.ts`, `cajasEnPose`): cuerpo y cabeza en coordenadas del personaje, para ubicar carteles sin pisarlos.

### Personajes por poses (stop motion, sin articulaciones)

`python scripts/rig/importar_poses.py <nombre>` con `src/personajes/<nombre>/poses.json` (`hoja`, `filas`, `nombres` en orden de lectura): cada pose de cuerpo entero se recorta, se alinea por el centro de los pies, se le saca la boca dibujada (`<pose>_sinboca.png`, para hablar con las bocas A–F de `piezas.json` escaladas al ancho de esa boca) y se guarda la caja de la cabeza. Datos en `public/personajes/<nombre>/poses.json` (registrados en `DATOS_POSES` de `src/personajes/index.ts`); dibujo en `src/rig/PersonajePoses.tsx`; cajas en `src/rig/poses.ts` (`cajasDePose`). Sin parpadeo ni cambio de cara: la expresión es la de cada pose.

### mapa.json (correcciones en texto)

```json
{
  "rostroVista": "base",                       // nombre de la cara que trae dibujada el frente
  "prefijoCorona": "petalo",                   // pelo_* → petalo_*
  "bloques": { "3": "cara:feliz", "7": "vista:frente", "15": "ignorar" },   // números de hoja_bloques.png
  "renombrar": { "bruja.accesorio1": "escoba", "perfil.detalle": "hoja" },  // <vista o cara>.<nombre>
  "piezas": { "42": "mano_der" }               // fuerza el dibujo Nº 42 a la pieza mano_der
}
```

## 2. El rig

`rig.json` tiene, por vista, los **huesos** (`id`, `padre`, `pivote` en coordenadas del personaje: origen en el piso entre los pies, y hacia abajo, en puntos del `.ai`), qué hueso mueve cada **pieza**, el hueso del **rostro** y cambios de **orden** de capas. Jerarquía típica: `raiz → cuerpo → cabeza → petalo_*`; `cuerpo → brazo → antebrazo → mano`; `raiz → pierna → pie`.

**Editor:** en el Studio, carpeta `personajes` → `personaje-<nombre>-editor-<vista>`. Muestra esqueleto, pivotes y nombres; en el panel de props se cambian pivotes (`huesos[].x/y`), padres, hueso de cada pieza y su orden (`z`); "Probar hueso" hace oscilar uno para ver si gira bien. **Guardar en rig.json** (botón arriba a la derecha, solo en el Studio) escribe el archivo.

## 3. Animar: plantilla PersonajeRig

Props (validadas con zod, editables en el Studio): `personaje`, `vista`, `expresion`, `espejo`, `x`/`y` (pies en el cuadro, px), `escala`, `rot`, `pasos` (2 = cambia de pose cada 2 cuadros, look de recorte), `fondo` (`null` = transparente), `sombra`, `audio` y **`pistas`**. Cada pista tiene `inicio`, `fin` (frames, opcional) y `pasos` (opcional); las pistas se **suman**.

| Pista | Parámetros | Qué hace |
|---|---|---|
| `respirar` | `velocidad`, `intensidad` | reposo: cuerpo, cabeza, pétalos y manos se mecen |
| `parpadear` | `cada` (s), `semilla` | parpadeo automático irregular (a veces doble) |
| `expresion` | `nombre` | cambia de cara (de `piezas.json → rostros`) con un rebote |
| `hablar` | `transcripcion` (Whisper), `idioma` es/en, `intensidad` | lip sync automático + leve cabeceo |
| `saludar` | `duracion`, `mano`, `veces`, `intensidad` | levanta la mano (la pasa adelante), la agita y la baja |
| `saltar` | `duracion`, `altura`, `intensidad` | anticipación, vuelo estirado, aterrizaje aplastado |
| `caminar` / `correr` | `velocidad`, `intensidad` | ciclo en el lugar (de frente o de perfil) |
| `girar` | `de`, `a`, `duracion`, `espejoDe`, `espejoA` | cambio de vista con aplastado |
| `temblor` | `intensidad`, `cada`, `semilla` | sacudidas (velocidad, nervios) |
| `vaiven` | `amplitud`, `periodo`, `inclina` | se echa para atrás y para adelante |
| `mirar` | `angulo`, `duracion` | gira la cabeza un rato |
| `pose` | `pose` (pose clave) | pose fija: vista, accesorios, orden… |
| `secuencia` | `secuencia`, `duracion` (frames por pasada), `veces` | poses clave interpoladas (ver abajo) |
| `trayecto` | `de`, `a` (px), `duracion`, `suave`, `arco` | lleva al personaje por el cuadro |

Las funciones están en `animaciones.ts` (buscan los huesos por nombre y usan los que el personaje tenga; valores por defecto como constantes al inicio).

### Secuencias de poses clave (el reemplazo de "haceme 24 posiciones")

Un JSON en `public/trabajos/<ID>/datos/` validado con `zSecuencia` (`secuencia.ts`):

```json
{
  "nombre": "escoba-frenetica", "ciclo": true, "interpolacion": "suave",
  "poses": [
    { "nota": "arranca", "expresion": "bruja",
      "huesos": { "raiz": { "x": 0, "y": 0, "rot": 8 }, "cabeza": { "rot": -4 }, "petalo_*": { "rot": -10 } },
      "accesorios": { "escoba": { "hueso": "raiz", "x": 0, "y": -46, "rot": 67, "escala": 1.3, "z": 18.5 } },
      "orden": { "mano_izq": 100 } }
  ]
}
```

- `huesos`: `rot` (grados, + = horario), `x`, `y` (puntos), `sx`, `sy`; las claves aceptan comodines (`petalo_*`, `mano_*`).
- También por pose: `expresion`, `visema`, `parpado`, `guino`, `vista`, `espejo`, `accesorios` (dónde va el centro del accesorio, en coordenadas del hueso), `orden`, `dura` (duración relativa).
- `interpolacion`: `suave` (Catmull-Rom), `lineal` o `paso` (sin interpolar, como sprites).
- Para "N posiciones como sprites": composición de N cuadros con la secuencia de duración N (un cuadro = una pose). Ejemplo completo: `src/trabajos/2026-10-02_claudio_rig-bloomie/`.

### Lip sync

`node scripts/transcribir.mjs voz.wav public/trabajos/<ID>/datos/voz.json` (Whisper, tiempos por palabra) → pista `hablar` con esa transcripción. Las palabras se convierten en bocas con reglas de letras para español e inglés (`lipsync.ts`), repartidas en el tiempo de cada palabra (las vocales duran más) y con la boca en reposo en las pausas. Bocas: `A` M/B/P · `B` consonantes · `C` E/I · `D` A · `E` O · `F` U/W; `X` = la boca de la expresión. Se dibujan sobre la boca de la cara activa.

**Mejor: Rhubarb (bocas desde el sonido).** `node scripts/voz.mjs "texto" public/trabajos/<ID>/audio/voz.wav --datos public/trabajos/<ID>/datos` deja la voz, la transcripción de Whisper (para globos y subtítulos) y `voz_rhubarb.json`; con una voz grabada: `node scripts/lipsync_rhubarb.mjs voz.wav datos/voz_rhubarb.json --texto "lo que dice"`. Pista: `{ tipo: "hablar", rhubarb: vozRhubarb }` (en lugar de `transcripcion`). Rhubarb cierra la boca en M/B/P y sigue el ritmo real; las reglas por letras reparten la palabra pareja y, cuando Whisper da tiempos gruesos, dejan una vocal abierta larga (comparación: composición `claudio-prueba-mocap-habla`). Formas extra de Rhubarb: G (F/V) → B, H (L) → C.

### Captura de movimiento (mocap) desde un video

```
python scripts/rig/mocap.py <video> <personaje> public/trabajos/<ID>/datos/mocap.json [--desde s --hasta s] [--espejo] [--control out/<ID>/revision/control.png]
```

MediaPipe saca el cuerpo y la cara cuadro a cuadro y lo pasa a los huesos del personaje (vista frente): `cuerpo` (inclinación), `cabeza` (giro lateral, de la línea de los ojos), `mano_*`/`brazo_*` (ángulo hombro→muñeca; reposo = colgando), `pie_*` (cuánto sube cada pie respecto del otro), `raiz` (desplazamiento y saltos), `parpado`/`guino`, `mirada`, `yaw` 2,5D (giro de la cara, hasta ±0,65), `visema` (mandíbula y labios: canta o habla sin audio) y `expresion` (feliz / enojado / triste si el personaje las tiene). Suavizado gaussiano centrado (sin retraso) y reducción a poses clave con interpolación lineal (≈1 pose cada 3 cuadros, editable a mano). Se usa como `{ tipo: "secuencia", secuencia, duracion: datos.duracionCuadros, veces: 1 }` (ejemplo: `src/trabajos/2026-10-04_claudio_prueba-mocap/`).

- Grabar **de frente**, buena luz; cuerpo entero si se quieren mover pies y raíz (con la cadera cortada solo se mueven tronco, brazos y cara).
- Por defecto el lado izquierdo de la pantalla del actor mueve el lado izquierdo de la pantalla del personaje (como un espejo); `--espejo` lo invierte.
- Anteojos de sol o la cara de perfil: la mirada y los párpados salen mal → `--sin-cara` o corregir esas claves.
- La cara se busca en un recorte alrededor de la cabeza (planos generales) y, si falla, en el cuadro entero (primeros planos).
- Modelos: `pose_landmarker_full.task` y `face_landmarker.task` en `C:/Videos/_herramientas/modelos-mediapipe/`. 10 s de video ≈ 15 s en la i3.

### Efectos de sonido automáticos

`sonidos: true` (o un número = volumen) en PersonajeRig suma efectos de la biblioteca de Mixkit según las pistas: whoosh al despegar y boing al aterrizar en `saltar`, pop al cambiar de `expresion` o ponerse un `disfraz`, whoosh suave al `girar`; en las `secuencia` (mocap incluido) detecta cambios de cara y saltos de la raíz. Lista y volúmenes en `src/rig/sonidos.ts` (`efectosDePistas`, función pura: se puede llamar desde un trabajo y editar la lista).

### Globos de diálogo (reglas)

- Un globo termina de irse antes de que aparezca el siguiente: `queda` por frase = mínimo entre 24 cuadros y lo que deja el hueco hasta la frase siguiente (`duracionGlobo(palabras, fps, 0)` da pop + palabras + salida). Si no alcanza, separar las frases (pausa), nunca encimar globos.
- La colita apunta a la boca (`puntoPersonaje(..., "boca")` o la cara 3D) y no debe cruzar ojos: ubicar el globo a la altura de la boca, del lado libre.
- Nada de tapar caras, cámaras ni lo que se esté armando en la escena: revisar los cuadros de cambio de globo en la hoja de cuadros clave.
- Palabras estiradas ("PLEEEASE"): `letraPorLetra`; ruego o susto: `temblor`.

### 2,5D (sin modelo 3D)

- **Giro ¾ por profundidad:** pista `yaw` (-1…1) o `yaw` en una pose clave. Cada pieza se corre según su profundidad (`rig.vistas.frente.profundidad`, o por rol: rostro +1, cabeza +0,45, cuerpo +0,25, pétalos/pelo -0,55) y el rostro se angosta: parece girar sin una vista ¾ dibujada.
- **Volumen con luz:** prop `luz: { angulo, intensidad }` del personaje (`angulo` = de dónde viene la luz: -90 arriba, -135 arriba a la izquierda). Cada pieza recibe un degradé de luz y de sombra recortado a su forma.
- **Sombra proyectada:** dibujar el personaje con `silueta` dentro de una transformación que lo achata sobre el piso y un filtro que lo oscurece y desenfoca (ejemplo en `src/trabajos/2026-10-02_rastro_bloomie-creators/BloomieCreators.tsx`).
- **Globos y stickers con profundidad:** `giro3d` en `GloboHistorieta` y `volumen` en `StickerOnomatopeya`.
- Muestra: composición `personaje-<nombre>-muestra-25d`.
- Profundidades de Bloomie: explícitas en `public/personajes/bloomie/rig.json` → `vistas.frente.profundidad` (se pueden ajustar ahí; el editor del Studio las conserva al guardar).
- Valores probados: luz de la escena con `intensidad` 0,85; `yaw` ±0,65 como máximo; sombra proyectada inclinada -0,6 y achatada 0,3, opacidad 0,5, desenfoque 8 (ver `BloomieCreators.tsx`).

### 3D con Blender (escenas pesadas, más calidad; comando `/personaje-3d`)

```
blender -b --factory-startup --python-exit-code 1 -P scripts/blender/personaje_desde_rig.py -- <nombre> --cara cara.png
node scripts/blender/hoja_giro.mjs <nombre>                         # out/personajes/<nombre>/giro_3d.png
node scripts/blender/render.mjs <ID> <capa> datos/animacion.json <duración> --cara <comp-cara> [--rotY 0.35] [--estilo toon]
```

- Blender 5.2 LTS portable en `C:/Videos/_herramientas/blender/` (`blender` en `herramientas.json`; sin instalador ni permisos de administrador).
- **Modelo** (`personaje_desde_rig.py`): los mismos huesos y pivotes que `rig.json` (roll 0, apuntando hacia arriba); cabeza/cuerpo elipsoides, manos/pies elipsoides chicos, el resto el contorno de la pieza extruido con bisel y rehecho con remesh por vóxeles + suavizado (sin las rayas del relleno del SVG; la corona inclinada 0,22 rad hacia atrás: más se ve el canto como una tabla); contorno de dibujo animado (Solidify invertido); cara = calcomanía (grilla con shrinkwrap sobre la cabeza) con textura. Guarda `C:/Videos/personajes/<nombre>/<nombre>_3d.blend` y `public/personajes/<nombre>/<nombre>.glb` (sirve para `Modelo3D` en Remotion).
- **Animación = el rig 2D**: `scripts/blender/poses.ts` (con `npx vite-node`) evalúa las pistas de un `animacion.json` (PersonajeRigProps) cuadro a cuadro con el mismo motor de Remotion, y `render.py` las aplica a los huesos (rot del rig → giro sobre −Z local; x, y → location; los trayectos mueven la cámara). La **cara** es una secuencia PNG de la composición `CaraTextura` (`src/rig/CaraTextura.tsx`): expresiones, parpadeo, mirada y lip sync del 2D sobre la cabeza 3D.
- **Render** (`render.mjs`): Eevee con fondo transparente, cámara ortográfica en px (1 pt = `escala` px, pies en `x, y`), sol desde el ángulo de pantalla `--luz` (como la receta 2,5D), `--estilo toon` (3 tonos). Capa VP9 con alfa en `cache3d/` con huella (se reusa). ~1,5–2 s por cuadro 1080×1920 en la i3 (+20 s de arranque). Eevee no tiene "atrapa sombras": la sombra de contacto la pone Remotion (ejemplo `src/trabajos/2026-10-04_claudio_prueba-blender/Final.tsx`).
- **Escenas con luz y "cámara"** (`--extra escena.json`, ejemplo `src/trabajos/2026-10-06_claudio_bloomie-toma-vida/armar_escena.mjs`): `luz.intensidad`/`luz.ambiente` por cuadro (un reflector que se enciende), `luz.color`, `recorte` (contraluz desde atrás), `luzSigueGiro` (las luces giran con `rotY`: se ve como una órbita de cámara alrededor del personaje), `huesosExtra` (`z` hacia la cámara y `rx` de cabeceo por cuadro: lo que el rig 2D no tiene; sirve para que las manos pasen DELANTE del cuerpo y no lo atraviesen). Revisar antes del render completo con `--solo 0,30,66 --png out/<ID>/revision/blender` (solo esos cuadros, sin caché).
- **Superposiciones:** nada que toque las manos como tarjeta plana (la profundidad de una tarjeta es fija: en bloomie-rock la guitarra tapaba la mano que rasgueaba); las manos se llevan hacia la cámara con `huesosExtra.z` y se verifican los cuadros de contacto.
- **Nombres equivalentes** (de la otra PC, también valen): `contraluz` = `recorte` (con `atras` como altura), `huesosExtra` por cuadro (`z` en pt hacia la cámara para que las manos queden delante del cuerpo, `cabeceo` = `rx` en grados, `yaw` en radianes para que la cabeza acompañe el giro con retardo) y `--solo` arma además la hoja `out/<ID>/revision/solo_<capa>.png`. Ejemplo: `src/trabajos/2026-10-06_rastro_bloomie-plantada/armar_escena.mjs`.
- Rutas: Blender toma las rutas relativas desde el .blend → los scripts usan rutas absolutas. `--python-exit-code 1` para que un error de Python corte el proceso.

### 3D (Three.js, sin modelo de diseñador)

- Dependencias: `@remotion/three`, `three`, `@react-three/fiber` (instaladas). Render y stills con **`--gl=angle`** (ANGLE usa la gráfica integrada por D3D11: ~0,1–0,25 s por cuadro 1080×1920 en la i3, medido el 2026-10-04); `hoja_animacion.mjs`, `revisar.mjs` y `exportar.mjs` aceptan `--gl angle`.
- `EscenaBloomie3D`: `estilo: "toon"` (3 tonos planos, más parecido al 2D), `recortar` (lienzo solo alrededor del personaje: igual imagen, para PCs donde WebGL va por software) y `saltoMax`.
- Capa en caché: una composición solo-3D transparente → `node scripts/capa3d.mjs <comp> <ID>` → `datos/cache3d.json` → la final la monta con `<OffthreadVideo transparent>` (ejemplo: `src/trabajos/2026-10-04_claudio_prueba-3d/`). Se re-renderiza sola si cambian las props, el código del rig/personajes/trabajo o piezas/rig.json.
- Cámaras de `ThreeCanvas`: pasar siempre `rotation: [0, 0, 0]` con `position`; si no, R3F la apunta al origen y la escena sale torcida y corrida.
- Bloomie 3D: `src/personajes/bloomie/Bloomie3D.tsx` construye el modelo por código desde piezas.json (volúmenes elipsoidales + pétalos extruidos de los contornos del .ai + contorno) y lo mueve con los huesos del rig. `EscenaBloomie3D` arma el canvas (cámara ortográfica en px, luz, piso que recibe la sombra) y `caraEnEscena` da la transformación para dibujar la cara 2D (`RostroPersonaje`) sobre la cabeza girada.
- Muestra: composición `personaje-bloomie-3d` (gira, saluda y habla); ejemplo sobre video: `rastro-bloomie-creators-3d`.
- Para otro personaje: copiar Bloomie3D.tsx y ajustar las formas, o (mejor) un `.glb` con huesos y animaciones (de un modelador, de Blender o de una biblioteca libre) con `Modelo3D` (`src/plantillas/comunes/`): `clips: [{ nombre: "Wave", desde: 30, hasta: 75 }, …]` con fundidos. Biblioteca: `public/biblioteca/modelos3d/` (licencias en `LICENCIAS.md` de esa carpeta).

## 4. Exportar

```
node scripts/rig/exportar.mjs <composición> <ID> <pieza_formato> [--mov] [--png] [--mp4] [--nota "cambios"]
```

- `--mov` ProRes 4444 con transparencia (Premiere y CapCut) · `--png` secuencia PNG transparente (respaldo universal y "sprites") · `--mp4` H.264 crf 18 para composiciones con fondo.
- Nunca sobrescribe (`_vN` siguiente), verifica alfa, cantidad de cuadros y que nada quede cortado en el borde, y anota la entrega en `TRABAJO.md`.
- Lienzo recortado al personaje: `encuadreRecortado(props, duración, fps)` de `calculos.ts` mide la caja que ocupa en toda la animación (ver el ciclo de la escoba).

## 5. Revisar sin gastar tokens

`node scripts/rig/hoja_animacion.mjs <composición> <salida.png> [--cada 15 | --frames a,b,c] [--columnas 8] [--escala 0.2]` arma una hoja de contactos chica (empaqueta una vez, numera cada cuadro).

## 6. Pruebas

- `node scripts/verificar-suite.mjs` incluye: extracción de Bloomie (tiene que dar lo mismo que la biblioteca), `.ai` sintético con capas nombradas (`scripts/rig/prueba_capas.py`), lip sync y poses (`node --experimental-strip-types scripts/rig/probar_rig.mjs`) y un render del muestrario.

## Límites conocidos

- Piezas rígidas (rotan, se mueven, se escalan y se reemplazan; no se deforman como una malla).
- Las expresiones del `.ai` son de frente; el perfil y la espalda usan los rasgos que traen dibujados.
- La adivinanza está pensada para hojas como la de Bloomie; con otro estilo de hoja puede necesitar `mapa.json` o capas con nombre.
- Lip sync por reglas de letras: bueno para animación; para precisión de doblaje, sumar Rhubarb Lip Sync (opcional, no instalado).
