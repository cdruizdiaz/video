# 2026-10-13_laencina_eros-filosofia

| Campo | Valor |
|---|---|
| Cliente / marca | La Encina Taller (`src/marcas/laencina`) |
| Pieza | eros-filosofia (extracto "Eros y Filosofía") |
| Estado | 🟡 En curso |
| Abierto | 2026-10-13 |
| Cerrado | — |

## Brief
- **Objetivo:** video corto (máx. 60 s) con un extracto de un filósofo hablando sobre el amor, para promocionar el taller "Eros y Filosofía" de La Encina Taller.
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Modo de animación:** plano (no lleva personaje animado)
- **Luz de la escena:** no aplica
- **Duración:** máx. 60 s incluyendo el cierre. Extracto + cierre; **tramo exacto del extracto: pendiente** (el crudo dura 58,2 s)
- **Tono / estilo:** sobrio y elegante, filosofía y cultura; sin efectos recargados; transiciones suaves; protagonismo de la palabra. Música de fondo opcional, muy baja, libre de derechos.
- **Textos obligatorios:**
  - Cierre: "¿Te animás a discutir sobre el amor?" / "Te esperamos en el taller Eros y Filosofía." / "En la ciudad de Santa Fe arrancamos el 3 de noviembre." / "Inscribite desde el link en bio o por DM."
  - Perfil: @laencina.taller
- **Llamado a la acción:** inscribirse desde el link en bio o por DM.
- **Entrega:** `out/2026-10-13_laencina_eros-filosofia/final/`
  - MP4 9:16 ≤ 60 s
  - (opcional) versión sin subtítulos quemados
  - (opcional) SRT bilingüe EN/ES

### Identidad visual (únicos permitidos)
- **Tipografías:** Cormorant Garamond (subtítulos ES y títulos del cierre; peso Medium o SemiBold) · Montserrat (subtítulos EN, @usuario, fecha, apoyo).
- **Paleta:** #EEE8DA crema (texto principal, ES) · #1A1812 negro cálido (fondos, placas, sombras) · #4E5229 verde oliva (fondos secundarios, placas) · #806936 dorado/ocre (detalles, líneas, EN) · #EF382D rojo (acento escaso: "3 de noviembre", resaltado del @).
- **Logo:** discreto durante el video, protagonista en el cierre; respetar espacio de resguardo, sin deformar. Es la hoja de encina del perfil (`public/marcas/laencina/logo.png` crema, `logo-oscuro.png` negro cálido, ambos con transparencia; original en `hoja-original.jpeg`).

### Subtítulos bilingües
- Todo el extracto en inglés (original) y español (traducción rioplatense neutro, natural y fiel).
- ES protagonista: Cormorant Garamond, tamaño mayor, #EEE8DA, en primer lugar visual.
- EN secundario: Montserrat, menor, #806936 o #EEE8DA con menos opacidad, debajo (o arriba).
- Legibilidad: sombra suave o placa semitransparente #1A1812. Máx. 2 líneas por idioma, frases cortas sincronizadas. Dentro de las zonas seguras de Instagram.

### Cierre
- Fondo #1A1812 (o #4E5229), entrada suave, jerarquía clara.
- Pregunta en Cormorant Garamond grande #EEE8DA; "Eros y Filosofía" destacado (dorado #806936 o cursiva); "3 de noviembre" en #EF382D; info secundaria en Montserrat; logo visible.
- **Motion graphic del perfil:** lleva la mirada al perfil de Instagram `@laencina.taller` tal como se ve hoy, siguiendo la captura de referencia (zoom, desplazamiento, resaltado del @ y del link en bio). Termina con @laencina.taller legible y sostenido unos segundos.

## Materiales
- **Originales:** `C:/Videos/crudos/2026-10-13_laencina_eros-filosofia/` (fuera del proyecto)
  - `krishnamurti_amor.mp4` — "Why can't we love? | Krishnamurti", 360×360, 29,97 fps, 58,2 s, h264 + aac
  - `perfil_instagram.jpeg` — hoja de encina (logo), 739×1190
  - `perfil_instagram_captura.png` — captura del perfil (1366×768 aprox.)
- **Proxies y material de trabajo:** `public/trabajos/2026-10-13_laencina_eros-filosofia/` (crudos/, audio/, img/, datos/)
  - `crudos/krishnamurti_amor.mp4` — proxy 360×360 a 30 fps constantes (sin subir resolución)
  - `img/perfil_instagram.jpeg` — en realidad es la hoja (logo), no la captura
  - `img/perfil_instagram_captura.png` — captura real del perfil (referencia del motion graphic)
- **Marca:** `public/marcas/laencina/` (kit creado el 2026-10-13 con la paleta y tipografías del brief)

## Pendientes del brief
- [x] Logo (hoja de encina) y kit de marca.
- [x] Tramo del extracto: 0–45,9 s.
- [ ] SRT bilingüe (se genera de `frases` al entregar).
- [ ] Revisión de la traducción por el cliente.

## Referencia del perfil (captura 2026-10-13)
- Foto de perfil: hoja de encina verde sobre círculo crema. Bio: "Taller de Filosofía · 1 de mayo 1372, Santa Fe · Martes 16:00 a 17:30 hs · Inscripciones abiertas por MD o Whatsapp · wa.me/5493425307080". 6 publicaciones, 21 seguidores.
- Destacadas: CRONOGRAMA, QUIÉNES SOMOS, TALLER. Grilla: fondo terracota/beige/foto en B/N, títulos en serif de alto contraste con una palabra en rojo ("taller", "amor", "La Encina").
- Motion graphic: acercar al @ (laencina.taller) y a la línea del link en bio.

## Guiones
- `guion_eros-filosofia.md` (generar con `/guion 2026-10-13_laencina_eros-filosofia`; aplicar cambios con `/aplicar-guion 2026-10-13_laencina_eros-filosofia`)

## Decisiones
- **Plantilla:** nueva `src/plantillas/ExtractoBilingue/` (extracto + subtítulos ES/EN + cierre con perfil). `HablaSubtitulada` está pensada para hablantes en español y un solo idioma.
- **Composiciones:** `laencina-eros-filosofia-9x16` y `laencina-eros-filosofia-sinsubs-9x16` (59 s, sin renderizar todavía).
- **Cambios v2 (feedback del cliente):** más aire entre hoja y video; subtítulos piramidales; voz cortada en "dolor" y cierre inmediato; emblema animado (círculo + hoja + filetes); línea de lugar "📍 Santa Fe, capital | 03/11" sin rojo; textos del cierre reordenados.
- **Cambios v3 (cliente):** fondo del extracto #EEE8DA; subtítulos #1A1812 más grandes con "amor" en #EF382D; logo en la esquina inferior izquierda (provisorio: la hoja; **falta el logo que mandó el cliente**); cierre sobre #1A1812 con "Eros y Filosofía" en #EF382D y dirección "Santa Fe, 1 de mayo 1372 · Inicio 3/11".
- **Corte del extracto:** 0–45,7 s ("Division implies sorrow."); el resto (hasta 53,5 s) no entra por el límite de 60 s con el cierre.
- **Encuadre:** video cuadrado 880×880 sobre #1A1812 (el crudo es de 360 px); sin Real-ESRGAN.
- **Música:** sin música (la palabra es la protagonista).
- **Traducción:** hecha por Claude, a revisar con el cliente (guion_eros-filosofia.md).
- **Material fuente:** el video es cuadrado y de baja resolución (360×360). En 9:16 a pantalla completa quedaría muy blando. Opciones: (a) cuadrado centrado sobre fondo #1A1812/#4E5229 con subtítulos abajo; (b) Real-ESRGAN `--x 2/4` solo al tramo usado; (c) recorte a 9:16 con zoom (peor).
- **Música:** (sin definir)
- **Subtítulos:** transcripción EN con whisper.cpp (`--idioma en`); traducción ES a revisar con el cliente.
- **Otras:**

## Entregas
| Archivo (`out/2026-10-13_laencina_eros-filosofia/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `eros-filosofia_9x16_v1.mp4` | 2026-10-13 | Primera versión en calidad final (1080×1920, CRF 18, -14,0 LUFS). Cambios v3 del cliente aplicados; logo de la esquina provisorio (hoja). |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-13_laencina_eros-filosofia/` desde `C:/Videos/archivo/2026-10-13_laencina_eros-filosofia/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/2026-10-13_laencina_eros-filosofia/` (si los hay).
3. `npx remotion render src/index.ts <id-composición> out/2026-10-13_laencina_eros-filosofia/final/<salida>_vN.mp4 --crf=18`
