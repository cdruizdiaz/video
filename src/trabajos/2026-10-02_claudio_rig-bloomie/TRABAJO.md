# 2026-10-02_claudio_rig-bloomie

| Campo | Valor |
|---|---|
| Cliente / marca | claudio (`src/marcas/bloomie`, personaje de la biblioteca `personajes/bloomie`) |
| Pieza | rig-bloomie |
| Estado | 🟢 Cerrado |
| Abierto | 2026-10-02 |
| Cerrado | 2026-10-02 |

## Brief
- **Objetivo:** prueba del sistema de rig vectorial (cut-out) de personajes. Bloomie vestido de bruja volando en escoba de izquierda a derecha, 24 posiciones frenéticas (se echa para atrás y para adelante, tiembla por el movimiento). Reemplazo del pedido de sprites a ChatGPT.
- **Formato(s):** personaje solo con transparencia, recortado a su caja · 30 fps
- **Duración:** ciclo de 24 cuadros en el lugar; cruce de 5 s; habla de 4,8 s
- **Tono / estilo:** frenético, cómico
- **Textos obligatorios:** —
- **Llamado a la acción:** —
- **Entrega:** `out/2026-10-02_claudio_rig-bloomie/final/` — `.mov` ProRes 4444 con alfa + secuencia PNG (ciclo y cruce); `.mp4` (habla)
- **Comparar con:** trabajo cerrado `2026-10-02_lucia_bloomie-volando-escoba-realista` (sprites de ChatGPT)

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-02_claudio_rig-bloomie/` (fuera del proyecto) — el `.ai` vive en la biblioteca de personajes
- **Proxies y material de trabajo:** `public/trabajos/2026-10-02_claudio_rig-bloomie/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/bloomie/`

## Guiones
- `guion_escoba.md` (ciclo, cruce y habla)
- `guion_<pieza>.md` (generar con `/guion 2026-10-02_claudio_rig-bloomie`; aplicar cambios con `/aplicar-guion 2026-10-02_claudio_rig-bloomie`)

## Decisiones
- **Plantilla:** `PersonajeRig` (nueva, sistema de rig `src/rig/`); personaje de la biblioteca `personajes/bloomie` (extraído de Bloomie.ai sin capas, corregido con `src/personajes/bloomie/mapa.json`).
- **Música:** ninguna (no se usaron temas de Mixkit). **LUFS medidos al cerrar:** habla_9x16_v1.mp4 -14,7 LUFS (pico -4,5 dBFS); piezas de escoba sin audio. · **Voz (habla):** `voz_bloomie_en.wav` del trabajo 2026-10-01_claudio_bloomie (Piper), normalizada a -14 LUFS → `voz_bloomie_en_14lufs.wav` (entrega medida: -14,7 LUFS).
- **Secuencia:** 24 poses clave escritas en `datos/secuencia_escoba.json` (interpolación suave, cíclica) + pista `temblor`. Escoba = accesorio de la cara de bruja, colgado de `raiz`, girado 67° a horizontal; manos delante (orden 100).
- **Otras:** bocas para hablar sintéticas (derivadas de la boca feliz) — el diseñador puede dibujarlas (`src/rig/GUIA_DISENADOR.md`).

## Entregas
| Archivo (`out/2026-10-02_claudio_rig-bloomie/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `escoba-ciclo_alfa_v1.mov` · `escoba-ciclo_alfa_v1_png/ (24 PNG)` | 2026-10-02 | Primera versión: 24 posiciones frenéticas en el lugar (rig vectorial) (claudio-rig-bloomie-escoba-ciclo, 552×604, 24 cuadros a 30 fps) |
| `escoba-cruce_9x16_v1.mov` · `escoba-cruce_9x16_v1_png/ (150 PNG)` | 2026-10-02 | Primera versión: cruce de izquierda a derecha con la secuencia de 24 posiciones y temblor (claudio-rig-bloomie-escoba-cruce, 1080×1920, 150 cuadros a 30 fps) |
| `habla_9x16_v1.mp4` | 2026-10-02 | Primera versión: lip sync automático desde Whisper (inglés) (claudio-rig-bloomie-habla, 1080×1920, 146 cuadros a 30 fps) |

## Cómo rehacerlo
1. Restaurar el material: copiar `C:/Videos/archivo/2026-10-02_claudio_rig-bloomie/public/` a `public/trabajos/2026-10-02_claudio_rig-bloomie/` (audios; `datos/` queda en el repo). Las entregas archivadas están en `C:/Videos/archivo/2026-10-02_claudio_rig-bloomie/final/`.
   - Requiere el personaje `public/personajes/bloomie/` (biblioteca, queda en el repo) y registrar de nuevo el trabajo en `src/trabajos/index.ts` si se sacó.
2. Ciclo: `node scripts/rig/exportar.mjs claudio-rig-bloomie-escoba-ciclo 2026-10-02_claudio_rig-bloomie escoba-ciclo_alfa --mov --png`
3. Cruce: `node scripts/rig/exportar.mjs claudio-rig-bloomie-escoba-cruce 2026-10-02_claudio_rig-bloomie escoba-cruce_9x16 --mov --png`
4. Habla: `node scripts/rig/exportar.mjs claudio-rig-bloomie-habla 2026-10-02_claudio_rig-bloomie habla_9x16 --mp4`

| `escoba-ciclo_alfa_v2.mov` · `escoba-ciclo_alfa_v2_png/ (24 PNG)` | 2026-10-02 | Escoba más grande (×1,75) y pegada al cuerpo; 6° más de inclinación de vuelo; pies recogidos (claudio-rig-bloomie-escoba-ciclo, 562×664, 24 cuadros a 30 fps) |

| `escoba-cruce_9x16_v2.mov` · `escoba-cruce_9x16_v2_png/ (150 PNG)` | 2026-10-02 | Escoba más grande y más inclinación (secuencia v2) (claudio-rig-bloomie-escoba-cruce, 1080×1920, 150 cuadros a 30 fps) |
