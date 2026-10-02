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
