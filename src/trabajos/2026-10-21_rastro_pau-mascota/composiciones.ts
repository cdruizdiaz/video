// Trabajo 2026-10-21_rastro_pau-mascota — reel de RASTRO: Pau cuenta cómo hicimos a Bloomie (mascota del CEI).
// 1) Bloomie sobre dos clips: parado en la palma (IMG_9053) y en el hombro (IMG_9054). Desde el borrador E son los
//    videos animados del cliente sin fondo (recortar_bloomie.py), anclados con seguir_puntos.py + armar_bloomie.mjs
//    (hasta el D, el rig 2D: "tiene el brazo cortado"). Los clips con Bloomie se renderizan mudos como
//    proxies derivados (crudos/<clip>b.mp4) con "-bloomie-<x>"; la voz sale de audio/voz/ (opción `audios`).
// 2) El reel (ReelPau: HablaSubtitulada + motion graphic del CEI y grabaciones de pantalla en la parte de la tablet).
import bloomieHombro from "../../../public/trabajos/2026-10-21_rastro_pau-mascota/datos/bloomie_hombro.json";
import videoHombro from "../../../public/trabajos/2026-10-21_rastro_pau-mascota/datos/bloomie_hombro_video.json";
import bloomiePalma from "../../../public/trabajos/2026-10-21_rastro_pau-mascota/datos/bloomie_palma.json";
import videoPalma from "../../../public/trabajos/2026-10-21_rastro_pau-mascota/datos/bloomie_palma_video.json";
import transcripcion from "../../../public/trabajos/2026-10-21_rastro_pau-mascota/datos/transcripcion.json";
import {
  duracionHablaSubtitulada,
  type HablaSubtituladaProps,
  type PalabraFuente,
  type Toma,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import type { PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";
import type { ComposicionTrabajo } from "../tipos";
import { BloomieSobreVideo } from "./BloomieSobreVideo";
import type { BeatsEtapas } from "./EtapasBloomie";
import type { BeatsIdeario } from "./IdearioCei";
import { ReelPau, type ReelPauProps } from "./ReelPau";

const ID = "2026-10-21_rastro_pau-mascota";
const CRUDOS = `trabajos/${ID}/crudos`;
const AUDIO = `trabajos/${ID}/audio`;
const PALMA = bloomiePalma as PersonajeRigProps;
const HOMBRO = bloomieHombro as PersonajeRigProps;
const PALMA_DESDE = 100; // cuadro de IMG_9053 (armar_bloomie.mjs)
const HOMBRO_CUADROS = 209;
const HOMBRO_VIDEO_DESDE = 39; // el reel usa IMG_9054 desde 1,3 s: ahí arranca el video de Bloomie (4,95 s)

export const composiciones: ComposicionTrabajo[] = [
  // clips con Bloomie (proxies derivados, mudos: renderizar con --muted)
  {
    id: "rastro-pau-mascota-bloomie-palma",
    component: BloomieSobreVideo,
    durationInFrames: 160,
    defaultProps: {
      video: `${CRUDOS}/IMG_9053.mp4`,
      rig: PALMA,
      desde: PALMA_DESDE,
      bloomie: { src: `${CRUDOS}/bloomie_palma.webm`, ...videoPalma }, // bloomie_hola_v2.mp4 sin fondo
      bloomieDesde: PALMA_DESDE,
      altura: 210, // px, como el rig del borrador D (~200 px)
      escalaBase: 0.52, // PALMA.escala de armar_bloomie.mjs
    },
    salida: "IMG_9053b",
  },
  {
    id: "rastro-pau-mascota-bloomie-hombro",
    component: BloomieSobreVideo,
    durationInFrames: HOMBRO_CUADROS,
    defaultProps: {
      video: `${CRUDOS}/IMG_9054.mp4`,
      rig: HOMBRO,
      desde: 0,
      bloomie: { src: `${CRUDOS}/bloomie_hombro.webm`, ...videoHombro }, // bloomie_entrada_hola_v3.mp4 sin fondo
      bloomieDesde: HOMBRO_VIDEO_DESDE,
      altura: 175, // px (parado sobre el hombro; borrador D)
      escalaBase: 0.42, // HOMBRO.escala de armar_bloomie.mjs
      proyectada: true,
    },
    salida: "IMG_9054b",
  },
];

// ---------- El reel ----------
// Tomas en ms de cada clip, medidas con la energía de la voz (cortes en los silencios, sin las risas ni las
// tomas fallidas). Planos (CRITERIOS_REEL.md): abierto 1,08 anclado abajo, cerrado ~1,4–1,45 con la cara en el
// tercio de arriba; un cambio de plano en cada corte. Las tomas 5 y 6 (la tablet) y la 7 (papel → animación) van
// tapadas por motion graphics y grabaciones (coberturas), con la voz en off.
const ABIERTO = { zoom: 1.08, origen: "50% 92%" };
const CERRADO = { zoom: 1.45, origen: "50% 72%", fijo: true };
const tomas: Toma[] = [
  // "¿Cómo pasamos de esto…" — en "esto" corte a la hoja de bocetos (recorte del 4K, IMG_9053p) mientras está nítida
  // (1,78–2,42 s); se saca la hoja desenfocada que baja y vuelve al general cuando levanta la mano (pedido 2026-10-21).
  // Empieza en 0,6 s: antes se oía el final de "acción" (0,09–0,18 s; borrador C)
  {
    clip: "IMG_9053b",
    desdeMs: 600,
    hastaMs: 2420,
    planos: [
      { desdeMs: 600, ...ABIERTO },
      { desdeMs: 1780, clip: "IMG_9053p", zoom: 1, fijo: true },
    ],
  },
  // "…a esto?" — plano general; Bloomie aparece en la palma con un pop. Borrador D: "dejalo unos segundos más porque
  // no se llega a ver el personaje": la voz corta antes de "Ahí quedo" (4,92 s) y la imagen sigue hasta el final del
  // clip (5,3 s) con el ambiente de 4,0 s; Bloomie queda 1,9 s en pantalla (en C cortaba en 3,93 s; en B, 4,8 s)
  {
    clip: "IMG_9053b",
    desdeMs: 3360,
    hastaMs: 4850,
    pausaMs: 450,
    ambienteMs: 4000,
    planos: [{ desdeMs: 3360, ...ABIERTO }],
  },
  // "Este es Bloomie, del inglés bloom y del castellano… amo hacer mascotas para marcas" — Bloomie en el hombro
  {
    clip: "IMG_9054b",
    desdeMs: 1300,
    hastaMs: 6250,
    planos: [
      { desdeMs: 1300, ...ABIERTO },
      { desdeMs: 4450, zoom: 1.4, origen: "62% 70%", fijo: true },
    ],
  },
  {
    clip: "IMG_9055",
    desdeMs: 2100,
    hastaMs: 7650,
    planos: [
      { desdeMs: 2100, ...ABIERTO },
      { desdeMs: 5170, ...CERRADO }, // en "cuatro" (pedido 2026-10-21; antes en "nos dimos cuenta")
    ],
  },
  {
    clip: "IMG_9059",
    desdeMs: 6350,
    hastaMs: 14000,
    planos: [
      { desdeMs: 6350, ...ABIERTO },
      { desdeMs: 10070, ...CERRADO, origen: "53% 72%" },
    ],
  },
  // la tablet: tapada (motion graphic del CEI y grabaciones), con la voz en off
  {
    clip: "IMG_9060",
    desdeMs: 650,
    hastaMs: 11250,
    planos: [{ desdeMs: 650, ...ABIERTO }],
  },
  {
    clip: "IMG_9060",
    desdeMs: 17050,
    hastaMs: 27750,
    planos: [{ desdeMs: 17050, ...ABIERTO }],
  },
  // "Pasamos del papel… a la animación" — tapado por EtapasBloomie; un segundo más de imagen (con el ambiente del
  // clip, 7,5–8,5 s) para que se vea a Bloomie saludar en la tarjeta "Animación" (borrador D; antes 0,5 s)
  {
    clip: "IMG_9061",
    desdeMs: 8750,
    hastaMs: 12150,
    pausaMs: 1000,
    ambienteMs: 7500,
    planos: [{ desdeMs: 8750, ...ABIERTO }],
  },
  {
    clip: "IMG_9064",
    desdeMs: 800,
    hastaMs: 3100,
    planos: [{ desdeMs: 800, ...CERRADO }],
  },
];

// Cuadros desde el inicio de una toma en que empieza cada palabra (de la transcripción)
const TOMA_IDEARIO = 5;
const TOMA_ETAPAS = 7;
const palabraEn = (toma: number, texto: string, desdeMs = 0) => {
  const t = tomas[toma];
  const w = (transcripcion as Record<string, PalabraFuente[]>)[t.clip].find(
    (p) =>
      p.startMs >= Math.max(desdeMs, t.desdeMs) &&
      p.text.toLowerCase().startsWith(texto),
  );
  if (!w) throw new Error(`toma ${toma}: no está "${texto}"`);
  return Math.round(((w.startMs - t.desdeMs) / 1000) * 30);
};
const beats: BeatsIdeario = {
  ideario: palabraEn(TOMA_IDEARIO, "ideario"),
  elementos: palabraEn(TOMA_IDEARIO, "elementos"),
  flor: palabraEn(TOMA_IDEARIO, "flor"),
  bigben: palabraEn(TOMA_IDEARIO, "big"),
  descarte: palabraEn(TOMA_IDEARIO, "descarte"),
  bigben2: palabraEn(TOMA_IDEARIO, "big", 7000),
  trillado: palabraEn(TOMA_IDEARIO, "trillado"),
  patriotas: palabraEn(TOMA_IDEARIO, "patriotas"),
  gano: palabraEn(TOMA_IDEARIO, "ganó"),
};
const beatsEtapas: BeatsEtapas = {
  // la primera tarjeta entra en "Pasamos", apenas termina la grabación de Navidad: sin fondo vacío (borrador D)
  papel: palabraEn(TOMA_ETAPAS, "pasamos"),
  illustrator: palabraEn(TOMA_ETAPAS, "illustrator"),
  illustrator2: palabraEn(TOMA_ETAPAS, "illustrator", 10300),
  animacion: palabraEn(TOMA_ETAPAS, "animación"),
};

const reel: ReelPauProps = {
  marca: "rastro",
  carpetaVideos: CRUDOS,
  cruceAudio: 1,
  // voz con menos ruido (preparar_voz.sh: DeepFilterNet suave, cada toma a -19 LUFS)
  audios: Object.fromEntries(
    [
      ["IMG_9053b", "IMG_9053"],
      ["IMG_9054b", "IMG_9054"],
      ...["IMG_9055", "IMG_9059", "IMG_9060", "IMG_9061", "IMG_9064"].map(
        (c) => [c, c],
      ),
    ].map(([clip, voz]) => [clip, `${AUDIO}/voz/${voz}.wav`]),
  ),
  // sin música desde el borrador D ("elimina la música, después la haré yo"); hasta el C, Mixkit 1142 "Gummies"
  // (preparar_musica.sh) a -27 dB bajo la voz y -12 dB en la placa
  tomas,
  transcripcion: transcripcion as HablaSubtituladaProps["transcripcion"],
  velocidad: 1,
  logoSuperior: false,
  coberturas: [
    { toma: TOMA_IDEARIO, tipo: "ideario", beats },
    { toma: TOMA_ETAPAS, tipo: "etapas", beats: beatsEtapas },
    // después de las etapas: Navidad sigue encima hasta "Pasamos" (borrador D: "sino hay una parte que queda vacía")
    {
      toma: TOMA_IDEARIO + 1,
      tipo: "video",
      video: `${CRUDOS}/pantalla_diseno.mp4`,
      extra: beatsEtapas.papel,
    },
  ],
  efectos: [
    { toma: 1, ms: 3380, src: `${AUDIO}/pop_bloomie.wav`, volumen: 0.35 },
  ], // Bloomie aparece en la palma
  subtitulos: {
    estilo: "reel",
    tamano: 64, // más chico, Inter 500 y sin trazo negro (pedido 2026-10-21; antes 74, 700, con borde)
    peso: 500,
    sinBorde: true,
    seco: true,
    grupos: [
      "¿Cómo pasamos",
      "de esto",
      "a esto?",
      "Este es Bloomie,",
      "del inglés bloom",
      "y del castellano…",
      "¡Amo hacer mascotas",
      "para marcas!",
      "En el diagnóstico",
      "que le hicimos",
      "a nuestro cliente",
      "nos dimos cuenta",
      "que tenía cuatro públicos",
      "y que no le estaba",
      "hablando a ninguno.",
      "El problema más grande:",
      "no poder separar",
      "el contenido de adultos",
      "del de niños.",
      "La solución:",
      "una mascota",
      "que acompaña a los niños",
      "en su viaje de aprendizaje.",
      "Arrancamos con el ideario.",
      "¿Qué elementos icónicos",
      "tenía el cliente?",
      "Dos: una flor",
      "y el Big Ben.",
      "Y por descarte,",
      "porque el Big Ben",
      "está bastante trillado",
      "y somos patriotas,",
      "ganó la flor.",
      "De ahí, la puesta en marcha:",
      "el diseño del personaje.",
      "Queríamos que fuera",
      "amigable, tierno,",
      "divertido,",
      "regordete y estudioso,",
      "y que nos permitiera",
      "jugar en fechas especiales",
      "como Halloween",
      "o Navidad.",
      "Pasamos del papel,",
      "Illustrator",
      "y de Illustrator",
      "a la animación.",
      "¿Y tu marca?",
      "¿Qué mascota tendría?",
    ],
  },
  cierre: {
    frase: "Mascotas para marcas",
    sitio: "somosrastro.com.ar",
    duracion: 60,
    estilo: "oscuro",
    corte: true,
  },
};

composiciones.push({
  id: "rastro-pau-mascota-reel",
  component: ReelPau,
  durationInFrames: duracionHablaSubtitulada(reel),
  defaultProps: reel,
  salida: "pau-mascota_9x16",
});
