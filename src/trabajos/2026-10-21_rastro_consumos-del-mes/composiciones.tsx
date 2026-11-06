// Trabajo 2026-10-21_rastro_consumos-del-mes — reel de RASTRO: Pau cuenta qué consume en el mes (un libro, una
// serie, un programa, un disco y un audiolibro). HablaSubtitulada (CRITERIOS_REEL.md) + un gráfico por cosa que
// nombra, cada uno con la estética de eso que nombra (GraficosConsumos.tsx), en el aire de arriba de la cabeza. Sin
// música ni placa: termina con el pedido de comentarios (pedido 2026-10-21).
import transcripcion from "../../../public/trabajos/2026-10-21_rastro_consumos-del-mes/datos/transcripcion.json";
import {
  duracionHablaSubtitulada,
  type HablaSubtituladaProps,
  type PalabraFuente,
  type Toma,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import type { ComposicionTrabajo } from "../tipos";
import {
  type Inserto,
  ReelConsumos,
  type ReelConsumosProps,
} from "./ReelConsumos";

const ID = "2026-10-21_rastro_consumos-del-mes";
const CRUDOS = `trabajos/${ID}/crudos`;
const AUDIO = `trabajos/${ID}/audio`;
const TR = transcripcion as Record<string, PalabraFuente[]>;

// ---------- Tomas ----------
// ms de cada clip, cortadas en los silencios (energía de la voz). IMG_9092: solo la segunda toma (la primera se corta en
// "el audiolibro"). Planos (CRITERIOS_REEL): abierto 1,08 anclado abajo; cerrado 1,45 anclado más arriba (60 %) para
// que quede aire sobre la cabeza: ahí van todos los gráficos (pedido 2026-10-21: "no la tapes"). Un cambio de plano
// en cada corte. "dar tiempo": recorte seco a un plano más cercano, en lugar de gráfico.
const ABIERTO = { zoom: 1.08, origen: "50% 92%" };
const CERRADO = { zoom: 1.45, origen: "50% 60%", fijo: true };
const MUY_CERRADO = { zoom: 1.7, origen: "50% 47%", fijo: true };
const tomas: Toma[] = [
  // 0 "Buenas, buenas, acá Pau… cuando no está en redes."
  {
    clip: "IMG_9085",
    desdeMs: 1080,
    hastaMs: 6350,
    planos: [{ desdeMs: 1080, ...CERRADO }],
  },
  // 1 "Música de mierda, de Carl Wilson,"
  {
    clip: "IMG_9086",
    desdeMs: 1400,
    hastaMs: 3200,
    planos: [{ desdeMs: 1400, ...ABIERTO }],
  },
  // 2 "que habla sobre… guilty pleasure."
  {
    clip: "IMG_9086",
    desdeMs: 3400,
    hastaMs: 7250,
    planos: [{ desdeMs: 3400, ...CERRADO }],
  },
  // 3 "American Horror Story, temporada 13"
  {
    clip: "IMG_9088",
    desdeMs: 1900,
    hastaMs: 3700,
    planos: [{ desdeMs: 1900, ...ABIERTO }],
  },
  // 4 "Tiene vestuarios… impecable / Y está Evan Peters… para el ojo" (entre "impecable" e "Y" no hay silencio:
  //   cambio de plano sin corte)
  {
    clip: "IMG_9088",
    desdeMs: 3950,
    hastaMs: 9600,
    planos: [
      { desdeMs: 3950, ...CERRADO },
      { desdeMs: 6480, ...ABIERTO },
    ],
  },
  // 5 "El programa de La Fábrica, no te cases ni te embarques,"
  {
    clip: "IMG_9089",
    desdeMs: 4850,
    hastaMs: 7200,
    planos: [{ desdeMs: 4850, ...CERRADO }],
  },
  // 6 "Juli y Catona… que te dejan pensando."
  {
    clip: "IMG_9089",
    desdeMs: 7450,
    hastaMs: 12650,
    planos: [{ desdeMs: 7450, ...ABIERTO }],
  },
  // 7 "Amo escucharlas cuando estoy ahí full metida en Photoshop."
  {
    clip: "IMG_9089",
    desdeMs: 13220,
    hastaMs: 15650,
    planos: [{ desdeMs: 13220, ...CERRADO }],
  },
  // 8 "No vayas a atender cuando el demonio llama, de Lali"
  {
    clip: "IMG_9091",
    desdeMs: 1250,
    hastaMs: 3750,
    planos: [{ desdeMs: 1250, ...ABIERTO }],
  },
  // 9 "un must, por Dios… alguien tenía que diseñar"
  {
    clip: "IMG_9091",
    desdeMs: 4220,
    hastaMs: 8850,
    planos: [{ desdeMs: 4220, ...CERRADO }],
  },
  // 10 "Y por último… Dar de leer a los niños, de Yolanda Reyes"
  {
    clip: "IMG_9092",
    desdeMs: 8660,
    hastaMs: 14420,
    planos: [{ desdeMs: 8660, ...ABIERTO }],
  },
  // 11 "porque bueno… Día de la Madre… / y este audiolibro… / dar tiempo." (respira 0,4 s al final)
  {
    clip: "IMG_9093",
    desdeMs: 1200,
    hastaMs: 8480,
    pausaMs: 400,
    ambienteMs: 8700,
    planos: [
      { desdeMs: 1200, ...CERRADO },
      { desdeMs: 4380, ...ABIERTO },
      { desdeMs: 7860, ...MUY_CERRADO }, // "dar tiempo"
    ],
  },
  // 12 "y ahora en esta comunidad creativa… en los comentarios."
  {
    clip: "IMG_9094",
    desdeMs: 1080,
    hastaMs: 7050,
    pausaMs: 300,
    ambienteMs: 300,
    planos: [{ desdeMs: 1080, ...CERRADO }],
  },
];

// ms del clip en que empieza una palabra (la primera que empieza con `texto` desde `desdeMs`)
const en = (clip: string, texto: string, desdeMs = 0) => {
  const w = TR[clip].find(
    (p) => p.startMs >= desdeMs && p.text.toLowerCase().startsWith(texto),
  );
  if (!w) throw new Error(`${clip}: no está "${texto}"`);
  return w.startMs;
};

// ---------- Gráficos ----------
const s = (n: string) => `${AUDIO}/${n}.wav`;
// Todos a la misma distancia de la cabeza (pedido 2026-10-21): `y` es el borde de abajo del gráfico, AIRE px arriba
// del pelo, medido en un cuadro de cada gráfico (out/<ID>/revision/graficos_d.png).
const AIRE = 80;
const sobre = (pelo: number) => pelo - AIRE;
const insertos: Inserto[] = [
  // "qué consume su diseñadora": libros, series, podcasts y música (RASTRO), uno tras otro; pops más bajos (pedido)
  {
    toma: 0,
    ms: en("IMG_9085", "consume"),
    grafico: { tipo: "iconos", y: sobre(380), paso: 4, escala: 0.8 },
    sonidos: [0, 1, 2, 3].map((k) => ({
      ms: en("IMG_9085", "consume") + k * 133,
      src: s(`pop_${k}`),
      volumen: 0.45,
    })),
  },
  // "Música de mierda": sin gráfico (Pau muestra el libro y lo señala)
  {
    toma: 2,
    ms: en("IMG_9086", "guilty"),
    grafico: { tipo: "stickerGuilty", y: sobre(490) },
    sonidos: [{ ms: en("IMG_9086", "guilty"), src: s("pop_2") }],
  },
  {
    toma: 3,
    ms: en("IMG_9088", "american"),
    grafico: { tipo: "posterAHS", y: sobre(585) },
    sonidos: [{ ms: en("IMG_9088", "american"), src: s("seco_1") }],
  },
  // vestuario / música / edición, cada una en su palabra (hasta el cambio de plano)
  {
    toma: 4,
    ms: en("IMG_9088", "vestuarios"),
    hastaMs: 6480,
    grafico: {
      tipo: "etiquetasAHS",
      y: sobre(530),
      beatsMs: [
        en("IMG_9088", "vestuarios"),
        en("IMG_9088", "música"),
        en("IMG_9088", "edición"),
      ],
    },
    sonidos: ["vestuarios", "música", "edición"].map((p, k) => ({
      ms: en("IMG_9088", p),
      src: s(`pop_${k}`),
    })),
  },
  {
    toma: 4,
    ms: en("IMG_9088", "evan"),
    grafico: { tipo: "fotoEvan", y: sobre(630) },
    sonidos: [{ ms: en("IMG_9088", "evan"), src: s("seco_2") }],
  },
  // "La Fábrica" se tacha y aparece "*la Factoria"; la tarjeta de "No te cases" (miniaturas del cliente), en la toma
  // siguiente ("Juli y Catona…"): en el cerrado no entran las dos centradas. Sin sonidos en esta parte (pedido).
  {
    toma: 5,
    ms: en("IMG_9089", "la"),
    grafico: { tipo: "factoria", y: sobre(420) },
    sonidos: [],
  },
  {
    toma: 6,
    ms: tomas[6].desdeMs,
    grafico: { tipo: "noTeCases", y: sobre(580), cada: 30 },
    sonidos: [],
  },
  {
    toma: 7,
    ms: en("IMG_9089", "full"),
    grafico: { tipo: "ventanaDiseno", y: sobre(400), escala: 0.62 },
    sonidos: [{ ms: en("IMG_9089", "full"), src: s("clic") }],
  },
  {
    toma: 8,
    ms: en("IMG_9091", "no"),
    grafico: { tipo: "discoLali", y: sobre(520) },
    sonidos: [{ ms: en("IMG_9091", "no"), src: s("seco_1") }],
  },
  // "Dar de leer a los niños": la tarjeta de Spotify; "de Yolanda Reyes": su cara en un círculo, sobre la esquina
  {
    toma: 10,
    ms: en("IMG_9092", "dar", 8000),
    grafico: { tipo: "tapaAudiolibro", y: sobre(560) },
    sonidos: [{ ms: en("IMG_9092", "dar", 8000), src: s("seco_2") }],
  },
  {
    toma: 10,
    ms: en("IMG_9092", "yolanda", 8000),
    grafico: { tipo: "fotoYolanda", x: 840, y: sobre(560) + 40 }, // sobre la esquina de la tarjeta
    sonidos: [{ ms: en("IMG_9092", "yolanda", 8000), src: s("pop_4") }],
  },
  {
    toma: 12,
    ms: en("IMG_9094", "consumiendo"),
    grafico: { tipo: "comentario", y: sobre(400) },
    sonidos: [{ ms: en("IMG_9094", "consumiendo"), src: s("pop_5") }],
  },
];

const reel: ReelConsumosProps = {
  marca: "rastro",
  carpetaVideos: CRUDOS,
  cruceAudio: 1,
  // voz: DeepFilterNet + nivelada por palabra, cada clip a -19 LUFS (preparar_voz.sh)
  audios: Object.fromEntries(
    [
      "IMG_9085",
      "IMG_9086",
      "IMG_9088",
      "IMG_9089",
      "IMG_9091",
      "IMG_9092",
      "IMG_9093",
      "IMG_9094",
    ].map((c) => [c, `${AUDIO}/voz/${c}.wav`]),
  ),
  // sin música (pedido 2026-10-21; antes Mixkit 738 "Hip Hop 02", preparar_musica.sh)
  tomas,
  transcripcion: transcripcion as HablaSubtituladaProps["transcripcion"],
  velocidad: 1,
  logoSuperior: false,
  insertos,
  efectosVolumen: 0.35,
  subtitulos: {
    estilo: "reel",
    tamano: 64, // como pau-mascota: Inter 500, 64 px, sin trazo
    peso: 500,
    sinBorde: true,
    seco: true,
    grupos: [
      "Buenas, buenas,",
      "acá Pau,",
      "su creatipa de confianza,",
      "viene a contarles",
      "qué consume su diseñadora",
      "cuando no está en redes.",
      "Música de mierda,",
      "de Carl Wilson,",
      "que habla sobre",
      "por qué nos gusta",
      "lo que nos gusta",
      "y por qué nos da vergüenza",
      "nuestro guilty pleasure.",
      "American Horror Story,",
      "temporada 13.",
      "Tiene vestuarios,",
      "tiene música,",
      "tiene una edición impecable.",
      "Y está Evan Peters,",
      "hot horror,",
      "me sirve para el ojo.",
      "El programa de La Factoria,",
      "No te cases",
      "ni te embarques,",
      "Juli y Catona",
      "hablando como si fueran",
      "tus mejores amigas,",
      "diciendo cosas muy graciosas",
      "pero a la vez",
      "que te dejan pensando.",
      "Amo escucharlas",
      "cuando estoy ahí",
      "full metida en Photoshop.",
      "No vayas a atender",
      "cuando el demonio llama,",
      "de Lali.",
      "Un must.",
      "Por Dios, Lali, te amo",
      "y me arrepiento",
      "de no haber ido a River,",
      "pero alguien tenía que diseñar.",
      "Y por último,",
      "pero no menos importante,",
      "cada tanto vuelvo a escuchar",
      "el audiolibro",
      "Dar de leer a los niños,",
      "de Yolanda Reyes,",
      "porque, bueno,",
      "en este mes",
      "del día de la madre",
      "me puse melancólica,",
      "y este audiolibro habla",
      "del acto de amor más grande",
      "que hay,",
      "que es dar tiempo.",
      "Y ahora,",
      "en esta comunidad de~creatipas,",
      "me interesaría saber",
      "¿qué están leyendo ustedes?,",
      "¿qué están consumiendo?",
      "Me lo dejan en los comentarios.",
    ],
  },
  // sin placa de cierre: termina en "Me lo dejan en los comentarios" (pedido 2026-10-21)
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "rastro-consumos-del-mes-reel",
    component: ReelConsumos,
    durationInFrames: duracionHablaSubtitulada(reel),
    defaultProps: reel,
    salida: "consumos-del-mes_9x16",
  },
];
