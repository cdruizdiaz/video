# 2026-10-27_animana_manta-dalma-bdw

| Campo | Valor |
|---|---|
| Cliente / marca | animaná (`src/marcas/animana`) |
| Pieza | manta-dalma (Reel 2 "Elegida para Barcelona") |
| Estado | 🟡 En curso (v1 entregada) |
| Abierto | 2026-10-27 |

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
