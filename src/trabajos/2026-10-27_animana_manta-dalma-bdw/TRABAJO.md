# 2026-10-27_animana_manta-dalma-bdw

| Campo | Valor |
|---|---|
| Cliente / marca | animaná (`src/marcas/animana`) |
| Pieza | manta-dalma (Reel 2 "Elegida para Barcelona") |
| Estado | 🟢 Cerrado (2026-11-17) |
| Abierto | 2026-10-27 |
| Cerrado | 2026-11-17 |

## Brief
Reel ~30 s para redes (también animaná world), sobre la manta Dalma en la Barcelona Design Week (exhibición oficial en el consulado, sobre una silla de Gaudí). Música de pasarela pero chill (trabajan con artesanos). Textos: "Hilada a rueca." · "Tejida a mano." · "Elegida para la Barcelona Design Week." · "Sello de Buen Diseño." · "Manta Dalma."
Formato 9:16 · 30 fps · sin personaje.

## Materiales
Originales en `C:/Videos/crudos/<ID>/` (copia de `Clientes/Animaná/Dalma`: 11 .mov 4K iPhone + 17 fotos). Proxies 1080x1920 en `public/trabajos/<ID>/crudos/`, fotos a 1600 px en `img/`.
Pendiente: planos de banco de imágenes (rueca girando, fibra torciéndose, inserts de Barcelona) — no se usaron; en su lugar, macros de la trama.

## Entregas
- `out/<ID>/final/manta-dalma_9x16_v1.mp4` — 31,6 s, -14 LUFS. Música: Mixkit "Cat Walk" (129 bpm), cortes al pulso. Los últimos 35 cuadros congelados son la placa de cierre (a propósito).
- `manta-dalma_9x16_v2.mp4` — 31,9 s. Textos en Gotham Book más chicos y centrados en el cuadro (con velo suave detrás); "Barcelona Design Week." queda en Didot cursiva, también chico y centrado; se quitó el texto "Sello de Buen Diseño." (ya se lee en la imagen). Placa final: nombre y sello en una sola línea, chicos, todo centrado. Música nueva: "Coffee Chill Out" (romanbelov, 88 bpm, de Descargas), cortes reajustados a su pulso.
- `manta-dalma_9x16_v3.mp4` — más luz en las imágenes: curva gamma 0,78 (levanta sombras y medios tonos sin quemar blancos) y saturación +4 %, sin el tinte sepia. Resto igual a v2.
- `manta-dalma_9x16_v4.mp4` — 31,3 s, −14,0 LUFS. **Música nueva:** la del cliente (`Clientes/Animaná/Dalma/musica dalma.mp4`, audio extraído: 60 s, 90,0 bpm medidos con `pulsos.py`; no es la misma pista que "Coffee Chill Out"). Se usa desde su primer pulso fuerte (1,088 s del archivo) para que el cuadro 0 caiga en el beat, con fundido de salida de 2,2 s; los cortes siguen al pulso (`BPM` 90,0 en `ReelDalma.tsx`, 20 cuadros por pulso; antes 88,22), así que el reel quedó 0,6 s más corto. Imágenes y textos igual que v3. La música anterior quedó en `audio/musica_coffee_chill_v2v3.wav`.

| Archivo (`out/2026-10-27_animana_manta-dalma-bdw/final/`) | Fecha | Cambios |
|---|---|---|
| `manta-dalma_9x16_v1.mp4` | 2026-10-27 | Primera versión (31,6 s), música Mixkit "Cat Walk" |
| `manta-dalma_9x16_v2.mp4` | 2026-10-27 | Textos Gotham chicos y centrados, sin "Sello de Buen Diseño.", placa en una línea, música "Coffee Chill Out" (32,0 s) |
| `manta-dalma_9x16_v3.mp4` | 2026-10-27 | Más luz (gamma 0,78, saturación +4 %, sin sepia) |
| `manta-dalma_9x16_v4.mp4` | 2026-10-28 | **Última.** Música del cliente (90 bpm), cortes al pulso (31,3 s) |

## Decisiones finales
- **Plantilla / composición:** `ReelDalma.tsx`, composición `animana-manta-dalma-reel` (cortes al pulso: `BPM` 90,0, 20 cuadros por pulso).
- **Música de la entrega (v4):** la del cliente (`Clientes/Animaná/Dalma/musica dalma.mp4`, audio extraído), provista por él: la licencia es suya. Anteriores: Mixkit 371 "Cat Walk" de Arulo (v1; sha256 `e241cba000ce`, licencia libre de Mixkit) y "Coffee Chill Out" de romanbelov (v2–v3, archivo de Descargas; ⚠️ licencia no registrada).
- **Medición final (2026-11-17, ebur128 sobre la v4):** −14,0 LUFS integrado, pico verdadero −1,3 dBFS.

## Cómo rehacerlo
1. Trabajo cerrado y archivado el 2026-11-17: restaurar `public/trabajos/2026-10-27_animana_manta-dalma-bdw/` desde `C:/Videos/archivo/2026-10-27_animana_manta-dalma-bdw/public/` (ver `ARCHIVADO.txt`). Incluye los proxies (no hay script de proxies en el repo: se hicieron a mano desde los .mov 4K de `C:/Videos/crudos/<ID>/`, 1080×1920 a 30 fps) y las fotos a 1600 px.
2. Mixkit 371 original: `C:/Videos/archivo/2026-10-27_animana_manta-dalma-bdw/biblioteca/`.
3. `npx remotion render src/index.ts animana-manta-dalma-reel <tmp>.mp4 --crf=18` → `bash scripts/terminar_audio.sh <tmp>.mp4 out/2026-10-27_animana_manta-dalma-bdw/final/manta-dalma_9x16_v<N>.mp4`.
