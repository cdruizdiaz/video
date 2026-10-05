# 2026-10-01_rastro_manifiesto

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`) |
| Pieza | Manifiesto de marca animado — "Algo pasa, algo queda" |
| Estado | 🟡 En curso — borrador de revisión listo, falta render final |
| Abierto | 2026-10-01 |
| Cerrado | — |

## Brief
- **Objetivo:** pieza de identidad que presente a Rastro como estudio creativo e interdisciplinario; que el logo se sienta creado por los rastros de toda la animación.
- **Formato(s):** 16:9 1920×1080 · 30 fps
- **Duración:** ~45 s
- **Tono / estilo:** "Menos ruido, más historias". Diseño editorial + motion experimental + tipografía cinética + animación táctil. Sofisticado pero lúdico, mínimo pero no vacío. Principio central: acción → rastro → transformación (cada elemento crea el siguiente; nada de escena → transición → escena).
- **Tipografía:** Inter, de Light a Black, tratada como elemento gráfico y físico (no como subtítulo).
- **Color:** solo los de la marca (`marca.ts`). La marca no tiene acento: contraste por escala, peso y espacio negativo.
- **Evitar:** animación corporativa genérica, stock, 3D, partículas al azar, degradados, brillos, cámara en movimiento constante.
- **Voz:** sin voz en off; la narración es texto en pantalla (escrita por Claude, a aprobar).
- **Textos obligatorios:** "Para que algo pase… y algo quede." · "Rastro."
- **Entrega:** `out/2026-10-01_rastro_manifiesto/final/`

## Materiales
- **Marca:** `public/marcas/rastro/` (logo.png 681×213).
- **Audio:** `public/trabajos/2026-10-01_rastro_manifiesto/audio/manifiesto-musica.wav` (compuesta por código).

## Guiones
- `guion_manifiesto-45s.md` (aplicar cambios con `/aplicar-guion 2026-10-01_rastro_manifiesto`)

## Decisiones
- **Narración:** aprobada por el cliente el 2026-10-01 (escrita por Claude).
- **Plantilla:** nueva `src/plantillas/ManifiestoRastros/` (plano continuo, tiempos en la constante `T`). Composición `rastro-manifiesto-16x9`.
- **Logo:** el círculo que nace de la cabeza de la figurita (sobre la "A") revela la A; las demás letras se revelan con trazos (`TRAZOS_LOGO`) que siguen el dibujo original. El punto del comienzo es esa cabeza.
- **Fuente:** Inter 300–900 cargada en la plantilla (el kit de marca solo carga 400–700).
- **Música:** compuesta por código (`musica_manifiesto.py`), Re mayor, sincronizada con `T`; loudnorm → -14,3 LUFS.
- **Revisión:** `out/2026-10-01_rastro_manifiesto/revision/borrador.mp4` (media resolución, con audio) y hojas de contacto.

## Entregas
| Archivo (`out/2026-10-01_rastro_manifiesto/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
```bash
python src/trabajos/2026-10-01_rastro_manifiesto/musica_manifiesto.py tmp/manifiesto_raw.wav
ffmpeg -i tmp/manifiesto_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 public/trabajos/2026-10-01_rastro_manifiesto/audio/manifiesto-musica.wav
npx remotion render src/index.ts rastro-manifiesto-16x9 out/2026-10-01_rastro_manifiesto/final/manifiesto-45s_16x9_vN.mp4 --crf=18
```
