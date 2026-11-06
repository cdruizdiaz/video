// Trabajo 2026-10-25_ctpsfpc_varios-idiomas — reel del CTPSFPC: "Un traductor matriculado no solo firma
// traducciones": qué más puede firmar (traducción, ratificación, dictamen) y la legalización del Colegio.
// Plantilla ReelCtpsfpc (HablaSubtitulada + placa Bauhaus con el logo). Tomas en el orden de los archivos
// (IMG_8365 → IMG_8422); cada una arranca cuando ella empieza a hablar, salvo las que enganchan con la anterior por
// un movimiento de cámara (paneo o tilt, en la misma dirección en las dos): para que parezca UN solo movimiento
// (pedido 2026-10-25, borrador A), la anterior se corta apenas acelera el barrido y la siguiente entra ya en
// movimiento, a una velocidad parecida, sin su arranque lento. Velocidades medidas cuadro a cuadro (correlación de
// fase, px por cuadro a 30 fps) — en cada toma, "corte a N px/c".
import transcripcion from "../../../public/trabajos/2026-10-25_ctpsfpc_varios-idiomas/datos/transcripcion.json";
import type { HablaSubtituladaProps, Toma } from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import { PALETA_CTPSFPC as P } from "../../marcas/ctpsfpc/marca";
import {
  duracionReelCtpsfpc,
  type Explicacion,
  ReelCtpsfpc,
  type ReelCtpsfpcProps,
} from "../../plantillas/ReelCtpsfpc/ReelCtpsfpc";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-10-25_ctpsfpc_varios-idiomas";
const CRUDOS = `trabajos/${ID}/crudos`;
const AUDIO = `trabajos/${ID}/audio`;
const CLIPS = ["IMG_8365", "IMG_8369", "IMG_8378", "IMG_8384", "IMG_8387", "IMG_8389", "IMG_8412", "IMG_8418", "IMG_8422"];

// ---------- Tomas (ms de cada clip; inicios y finales medidos con la energía de la voz) ----------
// Borrador A (antes de juntar los movimientos): 8365 4050–9070 · 8369 0–2398 · 8378 200–9850 · 8384 1650–3833 ·
// 8387 0–7150 · 8389 1480–3483 · 8412 0–10400 · 8418 2480–7650 · 8422 0–5552
const tomas: Toma[] = [
  // "Un traductor matriculado… qué más puede firmar." Antes dice "Avisame si no estoy presentable" (afuera).
  // Paneo a la derecha desde 8,2 s ("firmar" termina 8,10): corte a 223 px/c →
  { clip: "IMG_8365", desdeMs: 4050, hastaMs: 8470 },
  // → entra en el paneo ya frenando (220 px/c). "Primero, una traducción." Tilt hacia arriba desde 1,63 s, pero
  // "traducción" termina 1,88: corte justo después (489 px/c) →
  { clip: "IMG_8369", desdeMs: 530, hastaMs: 1900 },
  // → entra en el tilt en su máximo (167 px/c; antes de 0,2 s se ve el pie de quien filma).
  // "Con su firma y sello… en su par de idiomas." (fin de voz 9,42 s)
  { clip: "IMG_8378", desdeMs: 330, hastaMs: 9850 },
  // "Segundo, una ratificación." (habla desde 1,70 s). Paneo desde 3,1 s ("ratificación" termina 3,24): corte a
  // 350 px/c →
  { clip: "IMG_8384", desdeMs: 1650, hastaMs: 3270 },
  // → entra en el paneo frenando (403 px/c). "Con su firma y sello… en su mismo par de idiomas." (fin de voz 6,74 s)
  { clip: "IMG_8387", desdeMs: 420, hastaMs: 7150 },
  // "Y tercero, un dictamen." (habla desde 1,54 s). Tilt hacia arriba desde 2,7 s ("dictamen" termina 2,84):
  // corte a 303 px/c →
  { clip: "IMG_8389", desdeMs: 1480, hastaMs: 2870 },
  // → entra en el tilt en su máximo (148 px/c). "Con su firma y sello… conocimientos específicos."
  { clip: "IMG_8412", desdeMs: 300, hastaMs: 10400 },
  // "En los tres casos… del traductor." (habla desde 2,54 s). Tilt a las columnas desde 7,0 s: corte a 354 px/c →
  { clip: "IMG_8418", desdeMs: 2480, hastaMs: 7170 },
  // → entra en el tilt en su máximo (222 px/c). "¿Necesitás un profesional matriculado? Encontralos…"
  { clip: "IMG_8422", desdeMs: 630, hastaMs: 5552 },
];

// ---------- Placas de explicación (pedido 2026-10-25, borrador B) ----------
// Después de "Primero / Segundo / Tercero", la explicación de cada caso va en una placa a pantalla completa (en las
// tomas de la explicación no hay aire sobre la cabeza para graficar encima: 280–550 px). Ella se ve diciendo
// "Con su firma y sello" y la placa entra después; cada módulo entra cuando nombra lo que muestra (ms del clip).
// Grilla bento: margen 60, separación 24, módulos de 468 × 486 (filas en y = 380 y 890; anchos de 960); la franja
// de los subtítulos empieza en y = 1400.
const COL = [60, 552];
const FILA = [380, 890];
const CHICO = { w: 468, h: 486 };
const ANCHO = { w: 960, h: 486 };
const explicaciones: Explicacion[] = [
  {
    clip: "IMG_8378",
    desdeMs: 1480, // después de "Con su firma y sello"
    numero: "01",
    titulo: "Traducción",
    bajada: "Hecha por el propio matriculado",
    modulos: [
      // "en las traducciones ológrafas"
      { x: COL[0], y: FILA[0], ...CHICO, fondo: P.wisteria, tinta: P.indigo, icono: "documento-sello", titulo: "Ológrafa", texto: "Firma y sello", ms: 2060 },
      // "o solo con su firma en las traducciones digitales"
      { x: COL[1], y: FILA[0], ...CHICO, fondo: P.indigo, tinta: P.marfil, icono: "pantalla-firma", titulo: "Digital", texto: "Solo su firma", ms: 3880 },
      // "el matriculado asume la responsabilidad de una traducción que él mismo realizó"
      { x: COL[0], y: FILA[1], ...CHICO, fondo: P.gris, tinta: P.marfil, icono: "responsabilidad", titulo: "Responsabilidad", texto: "Sobre su propia traducción", ms: 5740 },
      // "en su par de idiomas"
      { x: COL[1], y: FILA[1], ...CHICO, fondo: P.wisteria, tinta: P.indigo, icono: "par-idiomas", titulo: "Su par de idiomas", ms: 8780 },
    ],
  },
  {
    clip: "IMG_8387",
    desdeMs: 1480, // después de "Con su firma y sello,"
    numero: "02",
    titulo: "Ratificación",
    bajada: "De la traducción de un colega",
    modulos: [
      // "el matriculado asume la responsabilidad"
      { x: COL[0], y: FILA[0], ...CHICO, fondo: P.gris, tinta: P.marfil, icono: "responsabilidad", titulo: "Responsabilidad", texto: "Con su firma y sello", ms: 2610 },
      // "de una traducción realizada por otro traductor matriculado"
      { x: COL[1], y: FILA[0], ...CHICO, fondo: P.wisteria, tinta: P.indigo, icono: "documento-colega", titulo: "Traducción de otro", texto: "Traductor matriculado", ms: 3820 },
      // "en su mismo par de idiomas"
      { x: COL[0], y: FILA[1], ...ANCHO, fondo: P.indigo, tinta: P.marfil, icono: "par-idiomas", titulo: "Mismo par de idiomas", horizontal: true, ms: 5840 },
    ],
  },
  {
    clip: "IMG_8412",
    desdeMs: 1640, // después de "Con su firma y sello,"
    numero: "03",
    titulo: "Dictamen",
    bajada: "Su opinión profesional, por escrito",
    modulos: [
      // "de un informe técnico"
      { x: COL[0], y: FILA[0], ...CHICO, fondo: P.indigo, tinta: P.marfil, icono: "informe", titulo: "Informe técnico", ms: 3520 },
      // "en el que expresa una posición"
      { x: COL[1], y: FILA[0], ...CHICO, fondo: P.chili, tinta: P.marfil, icono: "posicion", titulo: "Una posición", ms: 4920 },
      // "o responde a una consulta de un tercero"
      { x: COL[0], y: FILA[1], ...CHICO, fondo: P.wisteria, tinta: P.indigo, icono: "consulta", titulo: "Una consulta", texto: "De un tercero", ms: 6500 },
      // "a partir de sus conocimientos específicos"
      { x: COL[1], y: FILA[1], ...CHICO, fondo: P.gris, tinta: P.marfil, icono: "conocimiento", titulo: "Conocimientos específicos", ms: 8760 },
    ],
  },
];

const reel: ReelCtpsfpcProps = {
  marca: "ctpsfpc",
  carpetaVideos: CRUDOS,
  cruceAudio: 1,
  // voz: pasa-altos + DeepFilterNet 12 dB, cada clip a -19 LUFS (preparar_voz.sh)
  audios: Object.fromEntries(CLIPS.map((c) => [c, `${AUDIO}/voz/${c}.wav`])),
  // sin música (pedido 2026-10-25, borrador B: "elimina la música, no me gusta, después yo le pongo"). Antes: Mixkit 33
  // "Motivating Mornings" (borrador B) y 440 "Infinity" (borrador A); preparar_musica.sh queda por si se retoma
  tomas,
  transcripcion: transcripcion as HablaSubtituladaProps["transcripcion"],
  velocidad: 1,
  logoSuperior: false,
  zoomLento: false,
  subtitulos: {
    estilo: "reel",
    // valores del cliente en CapCut: Be Vietnam Pro SemiBold, tamaño 15, blanco, sombra negra difusa al 25 %
    fuente: `"Be Vietnam Pro CTPSFPC", sans-serif`,
    peso: 600,
    tamano: 72,
    sinBorde: true,
    // sombra un poco más notoria y difuminada, "pero no tanto" (pedido 2026-10-25; borrador A: 0 4px 14px al 25 %)
    sombra: "0 3px 18px rgba(0, 0, 0, 0.45)",
    y: 1500, // a la altura de la cintura, como "Reel idóneo.mov"
    seco: true,
    // cada grupo sale apenas termina su última palabra (antes quedaba 350 ms y en los barridos al cielo o al piso
    // la letra blanca se leía mal, pedido 2026-10-25)
    colaMs: 0,
    grupos: [
      "Un traductor matriculado",
      "no solo firma traducciones.",
      "Te contamos",
      "qué más puede firmar.",
      "Primero,",
      "una traducción.",
      "Con su firma y sello",
      "en las traducciones ológrafas,",
      "o solo con su firma",
      "en las traducciones digitales,",
      "el matriculado asume",
      "la responsabilidad",
      "de una traducción",
      "que él mismo realizó",
      "en su par de idiomas.",
      "Segundo,",
      "una ratificación.",
      "Con su firma y sello,",
      "el matriculado asume",
      "la responsabilidad",
      "de una traducción",
      "realizada por otro",
      "traductor matriculado",
      "en su mismo par de idiomas.",
      "Y tercero,",
      "un dictamen.",
      "Con su firma y sello,",
      "el matriculado asume",
      "la responsabilidad",
      "de un informe técnico",
      "en el que expresa",
      "una posición",
      "o responde a una consulta",
      "de un tercero",
      "a partir de sus",
      "conocimientos específicos.",
      "En los tres casos,",
      "cuando el organismo",
      "así lo exige,",
      "el Colegio legaliza",
      "la firma y el sello",
      "del traductor.",
      "¿Necesitás un profesional",
      "matriculado?",
      "Encontralos en nuestro",
      "buscador de traductores",
      "e intérpretes.",
    ],
  },
  placa: 120, // 4 s (borrador A: 3,5 s), para que la música suba y cierre con su final propio
  sitio: "www.traductoresantafe.org.ar", // debajo del logo (pedido 2026-10-25)
  explicaciones,
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "ctpsfpc-varios-idiomas-reel",
    component: ReelCtpsfpc,
    durationInFrames: duracionReelCtpsfpc(reel),
    defaultProps: reel,
    salida: "varios-idiomas_9x16",
  },
];
