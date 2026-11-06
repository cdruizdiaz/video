// Trabajo 2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion — reel del CTPSFPC: "¿Qué pasa con tu traducción cuando la
// llevás a legalizar al Colegio?": los cuatro pasos de la legalización, qué certifica el Colegio y dónde consultar.
// Plantilla ReelCtpsfpc con los criterios del cliente (src/marcas/ctpsfpc/CRITERIOS.md), copiada de
// 2026-10-25_ctpsfpc_varios-idiomas: tomas en el orden de los archivos, cada una desde que empieza a hablar; las
// uniones por movimiento de cámara, como un solo barrido; placa final con la web; sin música. En este reel, en vez de
// placas de explicación, símbolos sobre el video (números e íconos) con la host siempre a la vista (pedido 2026-10-25).
import transcripcion from "../../../public/trabajos/2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion/datos/transcripcion.json";
import type { HablaSubtituladaProps, Toma } from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import { PALETA_CTPSFPC as P } from "../../marcas/ctpsfpc/marca";
import {
  duracionReelCtpsfpc,
  ReelCtpsfpc,
  type ReelCtpsfpcProps,
  type SimboloEnToma,
} from "../../plantillas/ReelCtpsfpc/ReelCtpsfpc";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion";
const CRUDOS = `trabajos/${ID}/crudos`;
const AUDIO = `trabajos/${ID}/audio`;
const CLIPS = ["IMG_8443", "IMG_8447", "IMG_8456", "IMG_8479", "IMG_8481", "IMG_8488", "IMG_8497", "IMG_8500"];

// ---------- Tomas (ms de cada clip; inicios y finales medidos con la energía de la voz) ----------
// Borrador A (con placas a pantalla completa): 8447 1450–4280 · 8456 1000–3880 · 8479 1050–4220 · 8497 950–6680 ·
// 8500 1000–7400 (las tomas tapadas por su placa terminaban antes del barrido). Sin placas, la host se ve siempre y
// vuelven las uniones en un solo barrido.
const tomas: Toma[] = [
  // "¿Qué pasa con tu traducción… al Colegio?" (habla desde 2,2 s; entra con el acercamiento de cámara)
  { clip: "IMG_8443", desdeMs: 2150, hastaMs: 5350 },
  // "1. Verificamos… esté vigente." Paneo a la izquierda desde 4,3 s: corte a 119 px/c →
  { clip: "IMG_8447", desdeMs: 1450, hastaMs: 4433 },
  // → entra en el paneo frenando (115 px/c). "2. Comparamos… nuestro registro" (fin de voz 3,7 s). Paneo desde 3,85 s:
  // sigue hasta el punto más rápido del barrido (4,13 s, 284 px/c) para que no quede tan cortada después de
  // "registro" (pedido 2026-10-25 sobre la v1; antes hasta 3967, a 36 px/c) →
  { clip: "IMG_8456", desdeMs: 700, hastaMs: 4133 },
  // → entra en el paneo (lento: máximo 54 px/c) ya en su máximo y frenando: un solo barrido que acelera y frena (v1:
  // desde 533, acelerando). "3. Realizamos… de legalización". Termina antes de "y verificamos" (retoma: lo dice entero
  // en IMG_8481)
  { clip: "IMG_8479", desdeMs: 733, hastaMs: 4220 },
  // "y verificamos… electrónicos habilitados." Después se da vuelta y sale caminando por la derecha: la toma sigue
  // hasta que termina de salir de cuadro (5,07 s) y la siguiente arranca justo antes de que entre por la izquierda,
  // como si siguiera caminando (pedido 2026-10-25, borrador C; antes cortaba en 4,6 s con ella todavía en cuadro)
  { clip: "IMG_8481", desdeMs: 1080, hastaMs: 5070 },
  // → entra caminando por la izquierda (la mano asoma en 1,0 s). "4. Vinculamos… a realizar el trámite." (borrador C:
  // desde 1,25 s, con ella ya entrando)
  { clip: "IMG_8488", desdeMs: 950, hastaMs: 7600 },
  // "Importante: el Colegio certifica… del documento." Paneo desde 6,7 s: corte a 65 px/c →
  { clip: "IMG_8497", desdeMs: 950, hastaMs: 6833 },
  // → entra en el paneo acelerando (65 px/c). "¿Tenés que legalizar…? Consultá horarios y requisitos en www…"
  { clip: "IMG_8500", desdeMs: 633, hastaMs: 7400 },
];

// ---------- Símbolos sobre el video (pedido 2026-10-25, borrador A) ----------
// "No hagas las placas gráficas, sino que en todo momento aparezca la host y poné los motion graphics en símbolos sobre
// ella": el número de cada paso en un círculo Chili y un ícono de la marca por idea, cada uno en la palabra que lo
// nombra (ms del clip), en el aire alrededor de ella, medido con una grilla en cada toma: arriba de la cabeza en los
// planos abiertos (fila en y = 250–380 según la toma, columnas x = 200 / 540 / 870) y a los costados de la cara en
// los cerrados (8443 y 8497: x = 190–200 y 880–890, y = 360–380).
const D = 230; // diámetro de las insignias
const N = 240; // diámetro de los números
const COL = [200, 540, 870];
// Pedidos sobre el borrador B (2026-10-25):
//  - la primera toma (8443) va sin gráficos;
//  - "todos los motion graphics deben terminar de animarse antes de que se haga el movimiento de cámara": en las tomas
//    que terminan con un barrido (8447 desde 4,23 s, 8456 desde 3,85, 8497 desde 6,7) los símbolos salen
//    (se encogen, 6 cuadros) y terminan antes de que arranque (`hastaMs`); en las que empiezan con uno, entran con la
//    cámara ya quieta;
//  - en la última toma, sin "horarios y requisitos": la web va como gráfico (píldora arriba de la cabeza, más angosta
//    que el subtítulo para que no quede cerca de los márgenes) y sin subtítulo.
const FIN_8447 = 4200;
const FIN_8456 = 3830;
const FIN_8497 = 6650;
const simbolos: SimboloEnToma[] = [
  // 8447 (picado, piso arriba): "1. Verificamos que la matrícula del traductor esté vigente."
  { clip: "IMG_8447", ms: 1640, hastaMs: FIN_8447, x: COL[0], y: 250, d: N, tipo: "numero", numero: "1", fondo: P.chili },
  { clip: "IMG_8447", ms: 2700, hastaMs: FIN_8447, x: COL[1], y: 250, d: D, tipo: "icono", icono: "matricula", fondo: P.wisteria },
  // "esté vigente" (3,6 s; antes en 3,76, pero tiene que alcanzar a verse y salir antes del paneo)
  { clip: "IMG_8447", ms: 3600, hastaMs: FIN_8447, x: COL[2], y: 250, d: D, tipo: "icono", icono: "vigente", fondo: P.indigo },
  // 8456 (fachada arriba): "2. Comparamos su firma y su sello con los que obran en nuestro registro"
  { clip: "IMG_8456", ms: 1280, hastaMs: FIN_8456, x: COL[0], y: 300, d: N, tipo: "numero", numero: "2", fondo: P.chili },
  { clip: "IMG_8456", ms: 2140, hastaMs: FIN_8456, x: COL[1], y: 300, d: D, tipo: "icono", icono: "documento-sello", fondo: P.indigo },
  { clip: "IMG_8456", ms: 3160, hastaMs: FIN_8456, x: COL[2], y: 300, d: D, tipo: "icono", icono: "registro", fondo: P.gris },
  // 8479 (árboles): "3. Realizamos el control formal de los requisitos de legalización"
  { clip: "IMG_8479", ms: 1250, x: COL[0], y: 380, d: N, tipo: "numero", numero: "3", fondo: P.chili },
  { clip: "IMG_8479", ms: 2320, x: COL[1], y: 380, d: D, tipo: "icono", icono: "requisitos", fondo: P.wisteria },
  // 8481 (el paso 3 sigue: el número ya estaba): "y verificamos que se haya realizado el pago…"
  // salen cuando ella se da vuelta para irse caminando (4,6 s), así no quedan sobre la salida de cuadro
  { clip: "IMG_8481", ms: 1080, hastaMs: 4600, x: COL[0], y: 250, d: N, tipo: "numero", numero: "3", fondo: P.chili, sinEntrada: true },
  { clip: "IMG_8481", ms: 2680, hastaMs: 4600, x: COL[1], y: 250, d: D, tipo: "icono", icono: "pago", fondo: P.indigo },
  // 8488 (cielo arriba): "4. Vinculamos la hoja de legalización y le devolvemos la traducción legalizada…"
  { clip: "IMG_8488", ms: 1440, x: COL[0], y: 380, d: N, tipo: "numero", numero: "4", fondo: P.chili },
  { clip: "IMG_8488", ms: 2800, x: COL[1], y: 380, d: D, tipo: "icono", icono: "hojas-unidas", fondo: P.gris },
  { clip: "IMG_8488", ms: 4360, x: COL[2], y: 380, d: D, tipo: "icono", icono: "documento-colega", fondo: P.indigo },
  // 8497 (cerrado): "Importante: el Colegio certifica la firma y el sello… No se expide sobre el contenido…"
  { clip: "IMG_8497", ms: 1320, hastaMs: 4700, x: 190, y: 380, d: N, tipo: "numero", numero: "!", fondo: P.chili },
  { clip: "IMG_8497", ms: 2640, hastaMs: FIN_8497, x: 890, y: 380, d: D, tipo: "icono", icono: "certifica", fondo: P.marfil },
  { clip: "IMG_8497", ms: 4780, hastaMs: FIN_8497, x: 190, y: 380, d: D, tipo: "icono", icono: "contenido-no", fondo: P.indigo },
  // 8500 (edificio arriba): "¿Tenés que legalizar una traducción? Consultá horarios y requisitos en www…"
  { clip: "IMG_8500", ms: 1340, hastaMs: 3300, x: COL[1], y: 260, d: D, tipo: "icono", icono: "consulta", fondo: P.marfil },
  // la web: entra en "en" (4,4 s) y se escribe mientras la dice; 760 px de ancho (el subtítulo ocupaba 960)
  {
    clip: "IMG_8500",
    ms: 4400,
    x: 540,
    y: 300,
    d: 90,
    tipo: "web",
    texto: "www.traductoresantafe.org.ar",
    ancho: 760,
    fondo: P.indigo,
  },
];

const reel: ReelCtpsfpcProps = {
  marca: "ctpsfpc",
  carpetaVideos: CRUDOS,
  cruceAudio: 1,
  // voz: pasa-altos + DeepFilterNet 12 dB, cada clip a -19 LUFS (preparar_voz.sh)
  audios: Object.fromEntries(CLIPS.map((c) => [c, `${AUDIO}/voz/${c}.wav`])),
  // sin música: la pone el cliente (CRITERIOS.md)
  tomas,
  transcripcion: transcripcion as HablaSubtituladaProps["transcripcion"],
  velocidad: 1,
  logoSuperior: false,
  zoomLento: false,
  subtitulos: {
    estilo: "reel",
    fuente: `"Be Vietnam Pro CTPSFPC", sans-serif`,
    peso: 600,
    tamano: 72,
    sinBorde: true,
    sombra: "0 3px 18px rgba(0, 0, 0, 0.45)",
    y: 1500,
    seco: true,
    colaMs: 0,
    // los números de los pasos, en palabras y con dos puntos (pedidos 2026-10-25 sobre la v2 y la v3: "1. Verificamos" →
    // "Uno. Verificamos" → "Uno: verificamos", minúscula después de los dos puntos), los cuatro en un solo renglón ("=")
    grupos: [
      "¿Qué pasa con tu traducción",
      "cuando la llevás a legalizar",
      "al Colegio?",
      "=Uno: verificamos",
      "que la matrícula",
      "del traductor",
      "esté vigente.",
      "=Dos: comparamos",
      "su firma y su sello",
      "con los que obran",
      "en nuestro registro.",
      "=Tres: realizamos",
      "el control formal",
      "de los requisitos",
      "de legalización",
      "y verificamos",
      "que se haya realizado",
      "el pago",
      "por los medios",
      "electrónicos habilitados.",
      "=Cuatro: vinculamos",
      "la hoja de legalización",
      "y le devolvemos",
      "la traducción legalizada",
      "a la persona",
      "que haya concurrido",
      "a realizar el trámite.",
      "Importante:",
      "el Colegio certifica",
      "la firma y el sello",
      "del traductor.",
      "No se expide",
      "sobre el contenido",
      "del documento.",
      "¿Tenés que legalizar",
      "una traducción?",
      "Consultá horarios",
      "y requisitos en",
      "-www.traductoresantafe.org.ar", // sin subtítulo: la web va como gráfico arriba de la cabeza (pedido 2026-10-25)
    ],
  },
  placa: 120,
  sitio: "www.traductoresantafe.org.ar",
  simbolos,
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "ctpsfpc-que-pasa-con-tu-traduccion-reel",
    component: ReelCtpsfpc,
    durationInFrames: duracionReelCtpsfpc(reel),
    defaultProps: reel,
    salida: "que-pasa-con-tu-traduccion_9x16",
  },
];
