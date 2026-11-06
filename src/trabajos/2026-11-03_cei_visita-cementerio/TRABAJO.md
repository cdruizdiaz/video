# 2026-11-03_cei_visita-cementerio

| Campo | Valor |
|---|---|
| Cliente / marca | CEI (`src/marcas/cei`) |
| Pieza | Visita al cementerio (historia de IG) |
| Estado | 🟡 En curso |
| Abierto | 2026-11-03 |
| Cerrado | — |

## Brief
- **Objetivo:** historia de IG dinámica con los videos de la visita al cementerio; música divertida / de niños. No hace falta usar todos los videos.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Duración:** ~31 s
- **Tono / estilo:** alegre y dinámico (criterios CEI: Filson Pro / New Spirit, nada fúnebre, cierre con nombre de la actividad + logo)
- **Entrega:** `out/2026-11-03_cei_visita-cementerio/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-11-03_cei_visita-cementerio/` (18 videos de WhatsApp, 576×1024, 30 fps; mapa c01–c18 en `datos/mapa_crudos.txt`)
- **Proxies:** `public/trabajos/2026-11-03_cei_visita-cementerio/crudos/` (escalados a 1080×1920)

## Decisiones
- **Plantilla:** componente propio `VisitaCementerio.tsx` (montaje musical sin voces; MontajeMusical usa Fredoka y audio original).
- **Música:** "Smile" (Michael Ramir C.), Mixkit 1076, sha256 0f582b05625f…, 0–36 s, -14 LUFS (`preparar_musica.sh`); cortes en los compases (`datos/pulsos.json`, 152 bpm).
- **Tomas:** colectivo → bajan → entrada → recorrido, monumentos y galería → vuelven al colectivo. Sin audio original. Descartada c02 (contraluz lavado).
- **Gráficos:** apertura con stickers "Field trip!" (New Spirit, cielo/royal) + "Visita al cementerio" (Filson, hueso/calabaza); placa final nueva: persianas royal/cielo que bajan, "Nuestra visita al cementerio" y logo sobre hueso.

## Entregas
| Archivo (`out/2026-11-03_cei_visita-cementerio/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `historia_9x16_v1.mp4` | 2026-11-03 | Primera versión (27 s de tomas + placa; -14,1 LUFS; sin glitches) |
| `historia_9x16_v2.mp4` | 2026-11-03 | Más corta (16,5 s): 9 tomas, una por momento (colectivo, bajada, entrada, recorrido, monumento, relieve, galería, cruces, vuelta), sin repetidas; **sin placa final** (cierra con fundido a negro). -14,0 LUFS; sin glitches |
