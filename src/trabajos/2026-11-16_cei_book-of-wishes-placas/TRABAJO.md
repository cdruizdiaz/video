# 2026-11-16_cei_book-of-wishes-placas

| Campo | Valor |
|---|---|
| Cliente / marca | CEI (`src/marcas/cei`) |
| Pieza | Placas de cierre de la serie "The book of wishes" (4 episodios) |
| Estado | 🟡 En curso |
| Abierto | 2026-11-16 |
| Cerrado | — |

## Brief
- **Objetivo:** placa gráfica de cierre, tipo motion graphic, para cada reel de la serie "The book of wishes": título de la serie + "Episode N: <nombre>" + "Next episode: <siguiente>".
- **Episodios:** 1 The beginning · 2 Building a dream · 3 Dear future · 4 The story continues.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Duración:** 6,5 s (195 cuadros) cada una.
- **Tono / estilo (v3):** azul royal + vino del CEI, sin flor central ni efecto galaxia. Original (v1–v2): estética del CEI (Filson Pro + New Spirit, paleta naranja/canela/vino/royal) llevada al diseño del libro que mandó la cliente (`C:/Videos/crudos/<ID>/The book of wishes.png`): tapa azul terciopelo con bordes vino, marco doble y esquinas doradas, medallón dorado en espiral, anillo de enredadera con rosas, letras doradas con brillo.
- **Textos obligatorios:** "The Book of Wishes", "Episode N", nombre del episodio, "Next episode" + siguiente.
- **Entrega:** `out/2026-11-16_cei_book-of-wishes-placas/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-11-16_cei_book-of-wishes-placas/The book of wishes.png`
- **img/:** `medallon.png` y `esquina.png`, recortados del diseño del libro (`recortar_libro.py`: medallón circular; esquina con fondo quitado por (R−B) y sin las líneas del marco) y subidos x2 con Real-ESRGAN.

## Decisiones
- **Plantilla:** propia del trabajo (`PlacaLibroDeseos.tsx`), props `episodio`, `nombre`, `siguiente`.
- **Animación:** la placa entra como una tapa de libro que se cierra sobre la pantalla (giro sobre el lomo izquierdo); el marco se dibuja, las esquinas aparecen con desenfoque, el medallón entra con resorte y gira lento todo el tiempo con su resplandor, el anillo de enredadera se dibuja y florece, el título entra letra por letra, divisor + episodio + nombre, y la cartela "Next episode" sube con resorte. Barridos de brillo sobre los dorados y chispas que flotan.
- **Episodio 4:** no hay siguiente → en lugar de la cartela, "The End…" (como la contratapa del libro). A confirmar con la cliente.
- **Audio:** sin audio (`--muted`): la placa va al final de cada reel, con la música del reel.
- **Sin logo del CEI** en la placa (a confirmar).

## Entregas
| Archivo (`out/2026-11-16_cei_book-of-wishes-placas/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `placa-ep1_9x16_v1.mp4` … `placa-ep4_9x16_v1.mp4` | 2026-11-16 | Primera versión (interna, no entregada) |
| `placa-ep1_9x16_v2.mp4` … `placa-ep4_9x16_v2.mp4` | 2026-11-16 | La tapa arranca ya entreabierta (−72° en vez de −95°), sin cuadros de canto. `detectar_glitches` marca los cuadros 2–3 como "vacíos": falso positivo (tapa oscura entrando, revisado en `revision/primeros_v2.png`) |

## Cómo rehacerlo
1. `npx remotion render src/index.ts cei-book-of-wishes-ep<N> out/2026-11-16_cei_book-of-wishes-placas/final/placa-ep<N>_9x16_vN.mp4 --crf=18 --muted`
