// Trabajo 2026-10-23_rastro_newsletter-animana — reel de RASTRO: Pau cuenta cómo medir si funcionó un newsletter,
// con el caso animaná (sus reportes de EmailOctopus y su newsletter en Figma). HablaSubtitulada (CRITERIOS_REEL.md)
// + gráficos con la identidad de RASTRO (GraficosNewsletter.tsx) + placa de cierre de RASTRO.
// Narrativa (pedido 2026-10-23: "acomodá la narrativa"): la pregunta → cómo lo arman (3 pasos) → las métricas
// (aperturas, CTR, CTOR, UTM con Google Analytics) → "¿Querés que te armemos el tuyo?". Fuera: el "Segundo," (no
// hay un "primero" grabado), el CTOR deletreado de IMG_9080 antes de la frase, y el repaso "los clics si les
// interesó" de IMG_9083 (ya se dijo con el CTR).
import transcripcion from "../../../public/trabajos/2026-10-23_rastro_newsletter-animana/datos/transcripcion.json";
import { paletaRastro } from "../../marcas/rastro/marca";
import type {
  HablaSubtituladaProps,
  PalabraFuente,
  Toma,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import type { ComposicionTrabajo } from "../tipos";
import {
  duracionReelNewsletter,
  type Inserto,
  ReelNewsletter,
  type ReelNewsletterProps,
} from "./ReelNewsletter";

const ID = "2026-10-23_rastro_newsletter-animana";
const CRUDOS = `trabajos/${ID}/crudos`;
const AUDIO = `trabajos/${ID}/audio`;
const TR = transcripcion as Record<string, PalabraFuente[]>;

// ---------- Planos ----------
// Una cámara, dos planos (CRITERIOS_REEL): abierto 1,08 y cerrado 1,45. Pau está cerca y con la cabeza alta en el
// cuadro: los dos se anclan arriba (25 %) para que quede aire sobre la cabeza para los gráficos. Un cambio de plano
// en cada corte.
const ANCLA_Y = 480; // 25 % de 1920
const ABIERTO = { zoom: 1.08, origen: "50% 25%" };
const CERRADO = { zoom: 1.45, origen: "50% 25%", fijo: true };

// ---------- Tomas ----------
// ms de cada clip, cortadas en los silencios (energía de la voz limpia).
const tomas: Toma[] = [
  // 0 "¿Cómo saber si funcionó tu campaña de email marketing o newsletter?"
  {
    clip: "IMG_9072",
    desdeMs: 9980,
    hastaMs: 13250,
    planos: [{ desdeMs: 9980, ...CERRADO }],
  },
  // 1 "Nosotras lo armamos en tres pasos: un objetivo único por envío, un CTA claro… que haga la persona"
  {
    clip: "IMG_9074",
    desdeMs: 1550,
    hastaMs: 7250,
    planos: [{ desdeMs: 1550, ...ABIERTO }],
  },
  // 2 "y un diseño que se lee en menos de 10 segundos." → placa con el newsletter en Figma
  {
    clip: "IMG_9074",
    desdeMs: 9800,
    hastaMs: 12520,
    planos: [{ desdeMs: 9800, ...CERRADO }],
  },
  // 3 "Aperturas dicen si te leyeron,"
  {
    clip: "IMG_9083",
    desdeMs: 2340,
    hastaMs: 4470,
    planos: [{ desdeMs: 2340, ...ABIERTO }],
  },
  // 4 "el CTR, el clic sobre los enviados. Te dice si el botón funcionó y convence." (sin el "Segundo,")
  {
    clip: "IMG_9078",
    desdeMs: 3410,
    hastaMs: 7640,
    planos: [{ desdeMs: 3410, ...CERRADO }],
  },
  // 5 "Y si me dice sobre los que abrieron, se llama CTOR y es más bonito." (⚠️ ver TRABAJO.md)
  {
    clip: "IMG_9080",
    desdeMs: 4960,
    hastaMs: 8640,
    planos: [{ desdeMs: 4960, ...ABIERTO }],
  },
  // 6 "el UTM, si le sirve a tu negocio," → placa con el link
  {
    clip: "IMG_9083",
    desdeMs: 4830,
    hastaMs: 6400,
    planos: [{ desdeMs: 4830, ...CERRADO }],
  },
  // 7 "Así, en Google Analytics ves quién llegó desde ese mail y qué hizo después: compró, tocó un botón o se fue."
  {
    clip: "IMG_9082",
    desdeMs: 1220,
    hastaMs: 6900,
    planos: [{ desdeMs: 1220, ...CERRADO }],
  },
  // 8 "¿Querés que te armemos el tuyo?" (respira antes de la placa)
  {
    clip: "IMG_9083",
    desdeMs: 8490,
    hastaMs: 9950,
    planos: [{ desdeMs: 8490, ...ABIERTO }],
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
// Todos a la misma distancia de la cabeza: `y` es el borde de abajo del gráfico, AIRE px arriba del pelo. Pelo de
// cada clip en el cuadro original (grilla de out/<ID>/revision/grilla_clips.png), pasado al plano de la toma.
const AIRE = 80;
const PELO: Record<string, number> = {
  IMG_9072: 535,
  IMG_9074: 560,
  IMG_9078: 460,
  IMG_9080: 460,
  IMG_9082: 680,
  IMG_9083: 630,
};
const sobre = (toma: number) => {
  const t = tomas[toma];
  const zoom = t.planos?.[0]?.zoom ?? 1;
  return Math.round(ANCLA_Y + (PELO[t.clip] - ANCLA_Y) * zoom - AIRE);
};
const insertos: Inserto[] = [
  // la pregunta: un sobre, y el "?" se traza en "funcionó"
  {
    toma: 0,
    ms: tomas[0].desdeMs,
    grafico: {
      tipo: "sobre",
      y: sobre(0),
      preguntaMs: en("IMG_9072", "funcionó"),
    },
    sonidos: [{ ms: tomas[0].desdeMs, src: s("seco_0") }],
  },
  // los pasos 1 y 2, cada uno en su palabra (el 3 es la placa de Figma)
  {
    toma: 1,
    ms: en("IMG_9074", "objetivo"),
    grafico: {
      tipo: "pasos",
      y: sobre(1),
      beatsMs: [en("IMG_9074", "objetivo"), en("IMG_9074", "cta")],
    },
    sonidos: ["objetivo", "cta"].map((p, k) => ({
      ms: en("IMG_9074", p),
      src: s(`pop_${k}`),
    })),
  },
  {
    toma: 2,
    ms: tomas[2].desdeMs,
    grafico: { tipo: "placaFigma", menosMs: en("IMG_9074", "menos") },
    sonidos: [{ ms: tomas[2].desdeMs, src: s("seco_1") }],
  },
  // el reporte real; "Opened" se marca en "leyeron"
  {
    toma: 3,
    ms: tomas[3].desdeMs,
    grafico: {
      tipo: "reporte",
      y: sobre(3),
      marcaMs: en("IMG_9083", "leyeron"),
    },
    sonidos: [{ ms: tomas[3].desdeMs, src: s("seco_2") }],
  },
  // CTR hasta "botón"; ahí, el botón que se toca
  {
    toma: 4,
    ms: en("IMG_9078", "ctr"),
    hastaMs: en("IMG_9078", "botón"),
    grafico: { tipo: "formula", y: sobre(4), formula: "ctr", cambiaMs: 0 },
    sonidos: [{ ms: en("IMG_9078", "ctr"), src: s("pop_2") }],
  },
  {
    toma: 4,
    ms: en("IMG_9078", "botón"),
    grafico: { tipo: "boton", y: sobre(4), tocaMs: en("IMG_9078", "funcionó") },
    sonidos: [{ ms: en("IMG_9078", "funcionó"), src: s("clic") }],
  },
  // CTOR: la misma cuenta; "enviados" se tacha y entra "aperturas" en "abrieron"
  {
    toma: 5,
    ms: tomas[5].desdeMs,
    grafico: {
      tipo: "formula",
      y: sobre(5),
      formula: "ctor",
      cambiaMs: en("IMG_9080", "abrieron"),
    },
    sonidos: [{ ms: en("IMG_9080", "abrieron"), src: s("pop_3") }],
  },
  {
    toma: 6,
    ms: tomas[6].desdeMs,
    grafico: { tipo: "placaUtm", resaltaMs: en("IMG_9083", "utm") + 100 },
    sonidos: [{ ms: tomas[6].desdeMs, src: s("seco_3") }],
  },
  {
    toma: 7,
    ms: en("IMG_9082", "google"),
    grafico: {
      tipo: "analytics",
      y: sobre(7),
      llegaMs: en("IMG_9082", "llegó"),
      accionesMs: [
        en("IMG_9082", "compró"),
        en("IMG_9082", "tocó"),
        en("IMG_9082", "se", 6000),
      ],
    },
    sonidos: [
      { ms: en("IMG_9082", "google"), src: s("seco_1") },
      ...["compró", "tocó"].map((p, k) => ({
        ms: en("IMG_9082", p),
        src: s(`pop_${k + 3}`),
      })),
      { ms: en("IMG_9082", "se", 6000), src: s("pop_5") },
    ],
  },
  {
    toma: 8,
    ms: en("IMG_9083", "¿querés"),
    grafico: { tipo: "usuario", y: sobre(8) },
    sonidos: [{ ms: en("IMG_9083", "¿querés"), src: s("pop_4") }],
  },
];

const reel: ReelNewsletterProps = {
  marca: "rastro",
  carpetaVideos: CRUDOS,
  cruceAudio: 1,
  // voz: DeepFilterNet + nivelada por palabra, cada clip a -19 LUFS (preparar_voz.sh)
  audios: Object.fromEntries(
    [
      "IMG_9072",
      "IMG_9074",
      "IMG_9078",
      "IMG_9080",
      "IMG_9082",
      "IMG_9083",
    ].map((c) => [c, `${AUDIO}/voz/${c}.wav`]),
  ),
  // sin música en el borrador A (como consumos-del-mes): se ofrece
  tomas,
  transcripcion: transcripcion as HablaSubtituladaProps["transcripcion"],
  velocidad: 1,
  logoSuperior: false,
  insertos,
  efectosVolumen: 0.35,
  subtitulos: {
    estilo: "reel",
    tamano: 64, // como consumos-del-mes: Inter 500, 64 px, sin trazo
    peso: 500,
    sinBorde: true,
    seco: true,
    grupos: [
      "¿Cómo saber si funcionó",
      "tu campaña de email marketing",
      "o newsletter?",
      "Nosotras lo armamos",
      "en tres pasos:",
      "un objetivo único",
      "por envío,",
      "un CTA claro",
      "de lo que queremos",
      "que haga la persona",
      "y un diseño",
      "que se lee",
      "en menos de 10 segundos.",
      "Aperturas",
      "dicen si te leyeron,",
      "el CTR,",
      "el clic sobre los enviados.",
      "Te dice si el botón",
      "funcionó y convence.",
      "Y si me dice",
      "sobre los que abrieron,",
      "se llama CTOR",
      "y es más bonito.",
      "el UTM,",
      "si le sirve a tu negocio,",
      "Así, en Google Analytics",
      "ves quién llegó",
      "desde ese mail",
      "y qué hizo después:",
      "compró,",
      "tocó un botón",
      "o se fue.",
      "¿Querés que te armemos",
      "el tuyo?",
    ],
  },
  // placa de cierre de RASTRO en negro (como las placas del medio, en tinta)
  placa: {
    fondo: paletaRastro.tinta,
    tinta: "#ffffff",
    logoClaro: true,
    entrada: "dibuja",
  },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "rastro-newsletter-animana-reel",
    component: ReelNewsletter,
    durationInFrames: duracionReelNewsletter(reel),
    defaultProps: reel,
    salida: "newsletter-animana_9x16",
  },
];
