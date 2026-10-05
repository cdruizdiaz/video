# 2026-10-02_claudio_prueba-25d

| Campo | Valor |
|---|---|
| Cliente / marca | Claudio · marca Bloomie (`src/marcas/bloomie`; personaje de la biblioteca `personajes/bloomie`) |
| Pieza | prueba-25d (Bloomie hace pesas) |
| Estado | 🟡 En curso |
| Abierto | 2026-10-02 |
| Cerrado | — |

## Brief
- **Objetivo:** prueba de animación 2,5D: Bloomie hace pesas y dice (en inglés británico) la idea de "Me tengo que poner fuerte para la salida en Redes", con un globo/sticker de historieta cuyo texto acompaña a las palabras a medida que las dice.
- **Formato(s):** 9:16 1080×1920 · 30 fps · **fondo de croma verde #00B140** (para superponer en un montaje)
- **Duración:** 5 s
- **Modo de animación:** 2,5D (volumen de luz por pieza, giros ¾, pesas también en 2,5D)
- **Luz de la escena:** no hay material real: luz de arriba a la izquierda (la misma de las pruebas anteriores); sobre croma, sin sombra proyectada en el piso (ver Decisiones)
- **Tono / estilo:** gracioso, esfuerzo exagerado de dibujito animado
- **Textos obligatorios:** "I've got to get strong for my social media debut!" en un globo de historieta, palabra por palabra
- **Llamado a la acción:** —
- **Audio:** voz Piper en_GB (jenny_dioco ×1,35, la voz de Bloomie) + efectos de Mixkit (a elegir entre opciones)
- **Entrega:** `out/2026-10-02_claudio_prueba-25d/final/`: MP4 1080×1920 con fondo de croma

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-02_claudio_prueba-25d/` (vacía: no hay material crudo)
- **Personaje:** biblioteca `public/personajes/bloomie/` (rig con profundidades 2,5D)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-02_claudio_prueba-25d/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/bloomie/`

## Guiones
- `guion_pesas.md` (3 escenas, 5 s). Generar otros con `/guion 2026-10-02_claudio_prueba-25d`; aplicar cambios con `/aplicar-guion 2026-10-02_claudio_prueba-25d`)

## Decisiones
- **Plantilla:** rig de Bloomie (`poseEn`, `luz`, `yaw`) + historieta (`src/plantillas/comunes/historieta.tsx`); barra con discos en 2,5D (pieza nueva reutilizable)
- **Composición:** `PesasBloomie.tsx` (`claudio-prueba-25d-pesas` con croma y `-alfa` transparente). Bloomie a ×2,15 con los pies en y 1640; barra `Barra25D` (960 px, discos de 120 px) por delante del cuerpo y las manos dibujadas encima (segunda pasada del rig); gotas de sudor `GotaSudor`; globo con `giro3d` 50.
- **Tiempos (frames):** agachado 0–8, barra a la cintura 8–28 y al pecho 28–40, frase 40–124 (con temblor y gotas en 58 y 92), empujón 126–142 (curva máxima 134), contento y guiño desde 138.
- **Voz:** Piper `en_GB-jenny_dioco-medium` ×1,35 (`preparar_voz.sh` + `separar_frases.mjs` → `datos/frases.json`), 2,77 s.
- **Música:** —. **Efectos (Mixkit):** "Metal gym plate" 2116 · `0b7a020316d3` en 9 y 126; "Boing hit sound" 2894 · `9d0611005031` en 131. Las voces de esfuerzo de Mixkit son de adulto: se descartaron.
- **Otras:** sin sombra en el piso (sobre croma la ensucian); la versión `-alfa` sirve si se quiere agregar sombra en el montaje. Borrador: `revision/borrador_v1.mp4` (540×960, -17,1 LUFS sin normalizar). **Borrador v2:** la barra nunca pierde el contacto con las manos: pasa siempre por la punta de cada manito (agarre calculado con los huesos del rig en cada cuadro), con los brazos en diagonal (la barra los cruza en la punta, no queda a lo largo del brazo); el levantamiento lo hace el cuerpo al pararse desde la sentadilla y los brazos acompañan (`revision/borrador_v2.mp4`).

## Entregas
| Archivo (`out/2026-10-02_claudio_prueba-25d/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. (a completar: voz, render)
