# 2026-10-23_rastro_newsletter-animana

| Campo | Valor |
|---|---|
| Cliente / marca | RASTRO (`src/marcas/rastro`), caso: animaná |
| Pieza | newsletter-animana |
| Estado | 🟡 En curso |
| Abierto | 2026-10-23 |
| Cerrado | — |

## Brief
- **Objetivo:** reel para las redes de RASTRO. Pau explica cómo saber si funcionó una campaña de email marketing o un newsletter, con el caso del cliente **animaná**. Pedido: "Transcribilos y acomodá la narrativa". Usar las grabaciones de pantalla como insertos mientras habla y, donde no alcancen, placas con motion graphics para que sea dinámico.
- **Estética:** la de **RASTRO** (el video es para sus redes), no la de animaná. De animaná solo aparece material real (Figma, reportes) y su logo en la etiqueta "caso".
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** no lleva personaje animado.
- **Duración:** 33,4 s (30,4 s de Pau + 3 s de placa de cierre).
- **Textos obligatorios:** subtítulos como en consumos-del-mes: Inter 500, 64 px, blancos sin trazo, secos.
- **Llamado a la acción:** "¿Querés que te armemos el tuyo?" + @somos_rastro + placa de cierre de RASTRO.
- **Entrega:** `out/2026-10-23_rastro_newsletter-animana/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-23_rastro_newsletter-animana/` (copia verificada, 286 871 560 bytes), de `Documents/RASTRO/Contenido RASTRO/pau newsletter/`:
  - `IMG_9072, 9074, 9078, 9080, 9082, 9083.MOV`: iPhone HEVC 3840×2160 rotado −90° (vertical), 29,97 fps, rango completo (`yuvj420p`).
  - `grab_pantalla/`, renombradas:
    - `automation_report.mp4` ("Automation report - EmailOctopus…"): 960×1024, 60 fps, 124,7 s;
    - `campaign_report.mp4` ("Campaign report…"): 1920×1020, 60 fps, 44,8 s;
    - `figma_newsletter.mp4` ("Newsletter Josefina Laurent - Figma…"): 1920×1020, 60 fps, 61,4 s.
- **Proxies** (`proxies.sh`): 1080×1920, 30 fps, de rango completo a estándar. Las grabaciones, a 30 fps en `crudos/pantalla/`.
- **Derivados de las grabaciones, sin datos de suscriptores** (quedan afuera las columnas de actividad y las tablas de mails):
  - `crudos/pantalla/figma_skim.mp4`: la columna del newsletter (recorte de 750×890 en 540,50), de 14 a 36 s, a 8× (dura 2,77 s).
  - `img/reporte_campana.png`: `campaign_report` en el segundo 1, recorte de 710×330 en 250,200 (título, enviados, aperturas, clics).
  - `img/link_utm.png`: `automation_report` en el segundo 62, recorte de 930×345 (el link con los `utm_`), sin el cursor.
- **Audio:**
  - `audio/voz/<clip>.wav`: `preparar_voz.sh` + `nivelar_voz.py`, copiados de consumos-del-mes;
  - `audio/pop_*`, `seco_*`, `clic`: `preparar_sonidos.sh`.

## Guiones
- `guion_newsletter-animana.md`

## Decisiones
- **Plantilla:** `HablaSubtitulada` (CRITERIOS_REEL), con `ReelNewsletter.tsx`: como `ReelConsumos`, cada gráfico se ancla al ms de su palabra. Al final va `PlacaRastro` (entrada "dibuja", fondo tinta, logo blanco). Composición `rastro-newsletter-animana-reel`.
- **Narrativa** (lo grabado no trae un "primero"):
  1. la pregunta (9072);
  2. "lo armamos en tres pasos" (9074); el tercer paso va en placa;
  3. "Aperturas dicen si te leyeron" (del repaso de 9083);
  4. CTR (9078), **sin "Segundo,"**;
  5. CTOR (9080), sin el "C-T-O-R, ok" del principio;
  6. "el UTM, si le sirve a tu negocio" (9083);
  7. Google Analytics (9082);
  8. "¿Querés que te armemos el tuyo?" (9083).

  Quedó afuera "los clics si les interesó": ya se dijo con el CTR.
- **Planos:** abierto 1,08 y cerrado 1,45, los dos anclados al 25 %. Pau está cerca y con la cabeza alta en el cuadro: así queda aire arriba. Cada corte cambia de plano.
- **Gráficos:**
  - un sobre con "?";
  - los pasos 1 y 2;
  - la placa del newsletter en Figma, con una barra "< 10 s";
  - el reporte real, con "Opened" marcado;
  - la cuenta del CTR (13 ÷ 373 = 3,5 %), después un botón que se toca;
  - la cuenta del CTOR: se tacha "enviados" y entra "aperturas" (13 ÷ 163 = 8 %). Las cifras son las del reporte que se muestra;
  - la placa del UTM, con el link real resaltado;
  - Google Analytics: del mail al sitio, y "compró", "tocó un botón", "se fue";
  - @somos_rastro.

  No repiten recursos de consumos-del-mes (íconos, comentario).
- **Transcripción** (`armar_transcripcion.mjs`): "click" → "clic"; "quieres" → "¿Querés"; "les sirve a tu negocio" → "le sirve". Los inicios y finales se midieron con la energía de la voz.
- ⚠️ **IMG_9080, a confirmar con el cliente:** Whisper se probó sobre la original y sobre la voz limpia, con y sin `--prompt`. Siempre oye "y si me dice sobre los **cabrieros** se **llaman** C-T-O-R y es más **bonito/bueno**". Subtitulado: "Y si me dice / sobre los que abrieron, / se llama CTOR / y es más bonito."
- **Sin música** en el borrador A (se ofrece).
- **Glitches:** el detector marca 4–5 cuadros congelados en la placa de Figma (9,8 y 11,0 s). Son momentos en que la propia grabación está quieta. La placa del UTM se acerca apenas para no verse trabada.
- **Borradores:**
  - `revision/borrador_newsletter-animana_9x16_a.mp4` (2026-10-23, 33,4 s, −14,0 LUFS, pico −1,4 dBFS). Hoja: `revision/graficos_a.png`.

## Entregas
| Archivo (`out/2026-10-23_rastro_newsletter-animana/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Si el trabajo está cerrado, restaurar `public/trabajos/2026-10-23_rastro_newsletter-animana/` desde `C:/Videos/archivo/2026-10-23_rastro_newsletter-animana/`.
2. Preparar el material:
   - `bash …/proxies.sh` y los derivados de las grabaciones (recortes en Materiales);
   - `node scripts/transcribir.mjs` por clip (`--sin-vad --prompt "animaná, newsletter, EmailOctopus, Figma, RASTRO, creatipa"`) a `datos/tr/`, y después `node …/armar_transcripcion.mjs`;
   - `bash …/preparar_voz.sh` y `bash …/preparar_sonidos.sh`.
3. `npx remotion render src/index.ts rastro-newsletter-animana-reel <tmp>.mp4 --crf=18`, y después `bash scripts/terminar_audio.sh <tmp>.mp4 out/2026-10-23_rastro_newsletter-animana/final/newsletter-animana_9x16_vN.mp4`.
