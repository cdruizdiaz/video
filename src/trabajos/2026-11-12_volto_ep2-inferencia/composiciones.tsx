// Trabajo 2026-11-12_volto_ep2-inferencia — "Quién es quién en el mundo de la IA", ep. 2 (proveedores de inferencia).
// El preview que llegó (preview_ep2_solo-cortes_9x16.mp4) sale del MISMO original que el ep. 1 (IMG_7203): dos tramos
// (mapear_referencia.py): preview 0–3,77 s = original 71,53 s; preview 3,77–55,9 s = original 79,169 s + t. Desde la
// v. B se arma sobre el original (recortado en T65.mp4 = IMG_7203 desde 65 s), con planos propios: el preview recortaba
// tanto desde el s 4 que él salía de cuadro (2026-11-12).
// Mismos criterios que el ep. 1 (2026-11-06_volto_ep1-laboratorios-ia, v5):
//  - subtítulos con alineación forzada (alinear_ep2.py → datos/al1-2.json, en tiempo del preview), cotejados con la voz;
//  - voz con DeepFilterNet suave (preparar_voz.sh), sin música (la pone el usuario);
//  - apertura con la ruleta que frena en INFERENCIA; gráficos apoyados sobre la cabeza;
//  - placa de degradé que sube, logo centrado + "PRÓXIMO EPISODIO" con la ruleta frenando en HARNESS.
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import {
  duracionHablaSubtitulada,
  HablaSubtitulada,
  type HablaSubtituladaProps,
  type PalabraFuente,
  type Toma,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import {
  centroSeguido,
  framesTomaSalida,
  origenSeguimiento,
  type Plano,
} from "../../plantillas/HablaSubtitulada/calculos";
import {
  ProximoEpisodio,
  PROXIMO_PARADA,
  RULETA_DEMORA,
  RULETA_GIRO,
  RULETA_ITEMS,
  type Modelo,
} from "../2026-11-06_volto_ep1-laboratorios-ia/GraficosEp1";
import { GraficosEp2, PROVEEDOR_ALTO_TOTAL, type GraficosEp2Props } from "./GraficosEp2";
import al1 from "../../../public/trabajos/2026-11-12_volto_ep2-inferencia/datos/al1.json";
import al2 from "../../../public/trabajos/2026-11-12_volto_ep2-inferencia/datos/al2.json";
import seguimiento from "../../../public/trabajos/2026-11-12_volto_ep2-inferencia/datos/seguimiento_T65.json";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-11-12_volto_ep2-inferencia";
const CLIP = "T65"; // IMG_7203 desde el s 65 (tiempos de las tomas = original − 65 s)
const FPS = 30;
// Preview → T65 (mapear_referencia.py)
const CORTE_PREVIEW = 3.766; // s del preview donde salta del 1er al 2º tramo
const DESFASE_1 = 6.53;
const DESFASE_2 = 14.169;
const aT65 = (p: number) => p + (p < CORTE_PREVIEW ? DESFASE_1 : DESFASE_2);
// Audio
const VOZ_GANANCIA_DB = 8; // como el ep. 1 (loudnorm a -14 al final)
const POP_VOLUMEN = 0.5;
// Planos
const SIGUE = 1.25; // plano que acompaña la cara (pedido 2026-11-12: "seguimiento de cámara"), hasta el s 11
const CERCA = 1.3; // plano cerrado quieto (como el ep. 1)
// Subtítulos
const SUB_TAMANO = 66;
// Gráficos sobre la cabeza
const AIRE = 25; // px entre el gráfico y el pelo (50 en la v. A: "que no haya tanto aire", 2026-11-12)
const PELO = 0.55; // del alto de la cara: cuánto sube el pelo sobre la caja de MediaPipe
const TOPE_SUPERIOR = 150; // nunca más arriba (zona segura de Reels)
const PERCENTIL_CABEZA = 0.05; // la cabeza más alta del tramo, sin los picos sueltos del detector
const PERCENTIL_HARDWARE = 0.5;
// Placa
const CIERRE = 5 * FPS;
const CIERRE_SUBE = 14; // = CIERRE_SUBE de HablaSubtitulada
const PROXIMO_BASE = 720;
const PROXIMO = RULETA_ITEMS.indexOf("HARNESS"); // pedido del usuario (2026-11-12)

// ---------- Tomas (ms de T65) ----------
const abierto = (desdeMs: number): Plano => ({ desdeMs, zoom: 1, fijo: true });
// plano cerrado QUIETO (corte seco) anclado en la posición media de la cara en ese tramo, como en el ep. 1
const quieto = (desdeMs: number, zoom: number, cx: number, cy: number): Plano => ({
  desdeMs,
  zoom,
  origen: `${Math.round(cx * 100)}% ${Math.round(cy * 100)}%`,
  fijo: true,
});
const sigue = (desdeMs: number, zoom = SIGUE): Plano => ({ desdeMs, zoom, seguir: true, fijo: true });

const TOMAS: Toma[] = [
  // "Lo que yo llamo los proveedores de inferencia, que este es un gran player."
  // abierto: está contra el borde izquierdo del original (cara en x 0,15–0,4): cualquier zoom lo corta
  { clip: CLIP, desdeMs: 6530, hastaMs: 10297, planos: [abierto(6530)] },
  // "No necesariamente hacen modelos… memoria RAM, en" — acompaña la cara (el preview lo perdía de cuadro) y empuja
  // leve en "inferencia" (s 12 del preview); abierto desde donde el preview pasaba al abierto (s 18,73)
  {
    clip: CLIP,
    desdeMs: 17935,
    hastaMs: 57770, // tras el primer "en" (sin "en… en…": 2026-11-12)
    planos: [
      abierto(17935), // cara en x 0,08–0,16 del original hasta el s 21: abierto (con zoom quedaba cortado)
      sigue(Math.round(aT65(6.98) * 1000)), // en la pausa antes de "Algunos puede ser que sí", ya más al centro
      // sin movimiento de cámara desde el s 11 (2026-11-12): ni seguimiento ni el empuje de "inferencia"; abierto,
      // cortando en la pausa entre "ofrecen" y "es inferencia"
      abierto(Math.round(aT65(11.75) * 1000)),
      // corte a un plano más cerca en "pero su servicio en esta industria" (2026-11-12), quieto como los del ep. 1,
      // hasta "De hecho,"; vuelve al abierto antes de la fila RAM/GPU/SSD/CPU
      quieto(Math.round(aT65(32.4) * 1000), CERCA, 0.35, 0.35),
      abierto(Math.round(aT65(40.7) * 1000)),
    ],
  },
  // "placa de video y también en" — mismo plano abierto: entre tomas de la misma frase se corta solo el silencio
  // (criterio del ep. 1); con zoom la cabeza subía y la fila RAM/GPU/SSD/CPU quedaba lejos
  { clip: CLIP, desdeMs: 59370, hastaMs: 60810, planos: [abierto(59370)] },
  // "almacenamiento, en todo… en el mercado." (sin el segundo "en")
  {
    clip: CLIP,
    desdeMs: 61730,
    hastaMs: 70000,
    pausaMs: 400, // la placa sube en esta pausa, sin tapar "mercado" (la imagen sigue)
    ambienteMs: 48810, // silencio entre "es" y "proveedor"
    planos: [abierto(61730)],
  },
].map((t) => ({ ...t, gananciaDb: VOZ_GANANCIA_DB, rampaAudio: 1 }));

// ---------- Palabras alineadas (tiempo del preview → T65) con la ortografía de pantalla ----------
type Alineada = { palabra: string; ini: number; fin: number };
// por segundo de inicio en el preview: texto nuevo, o [inicio, fin] nuevos
const CORREGIR: Record<number, string> = {
  35.1: "proveedor", // "es proveedor inferencia" (lo dictó el usuario, 2026-11-12)
};
const RETIMAR: Record<number, [number, number]> = {
  // el "en" que queda de "también en… en almacenamiento" es el primero (46,48–46,62), que la alineación pegó a
  // "también"; el segundo (47,14) cae en el corte
  47.14: [46.48, 46.62],
  46.26: [46.26, 46.46], // "también"
  43.44: [43.4, 43.58], // el "en" que queda tras "memoria RAM" es el primero de "en… en… en…" (la alineación lo estiraba)
};
const palabras: PalabraFuente[] = [...(al1 as Alineada[]), ...(al2 as Alineada[])].map((w) => {
  const [ini, fin] = RETIMAR[w.ini] ?? [w.ini, w.fin];
  return { text: CORREGIR[w.ini] ?? w.palabra, startMs: aT65(ini) * 1000, endMs: aT65(fin) * 1000 };
});

// ---------- Tiempos de salida ----------
const iniciosTomas = (() => {
  let acc = 0;
  return TOMAS.map((t) => {
    const ini = acc;
    acc += framesTomaSalida(t, 1, FPS);
    return ini;
  });
})();
const aSalidaT65 = (ms: number) => {
  const i = TOMAS.findIndex((t) => ms >= t.desdeMs && ms <= t.hastaMs);
  if (i < 0) throw new Error(`${ms} ms no está en ninguna toma`);
  return iniciosTomas[i] + Math.round(((ms - TOMAS[i].desdeMs) / 1000) * FPS);
};
const f = (p: number) => aSalidaT65(Math.round(aT65(p) * 1000)); // segundo del preview → frame de salida

// y en pantalla del punto más alto de la cabeza en el frame de salida `fr`, con el zoom y el seguimiento del plano
const SEG = seguimiento as number[][];
const cabezaEnPantalla = (fr: number): number | null => {
  let i = 0;
  while (i + 1 < iniciosTomas.length && iniciosTomas[i + 1] <= fr) i++;
  const t = TOMAS[i];
  const s = t.desdeMs / 1000 + (fr - iniciosTomas[i]) / FPS;
  const pl = [...(t.planos ?? [])].reverse().find((p) => p.desdeMs <= s * 1000) ?? { desdeMs: 0, zoom: 1 };
  const punto = SEG.reduce((a, b) => (Math.abs(b[0] - s) < Math.abs(a[0] - s) ? b : a));
  if (Math.abs(punto[0] - s) > 0.3) return null;
  const [, , cy, h] = punto;
  const y = (cy - h / 2 - h * PELO) * 1920;
  const z = Math.max(pl.zoom ?? 1, pl.zoomDesde ?? 0);
  if (z <= 1) return y;
  if (!pl.seguir) {
    const oy = (parseFloat((pl.origen ?? "50% 50%").split(" ")[1]) / 100) * 1920;
    return oy + (y - oy) * z;
  }
  const c = centroSeguido(SEG, s);
  if (!c) return y;
  const oy = origenSeguimiento(c[0], c[1], z)[1] * 1920;
  return oy + (y - oy) * z;
};
const sobreCabeza = (desde: number, hasta: number, alto: number, percentil = PERCENTIL_CABEZA) => {
  const ys: number[] = [];
  for (let fr = desde; fr < hasta; fr++) {
    const y = cabezaEnPantalla(fr);
    if (y !== null) ys.push(y);
  }
  ys.sort((a, b) => a - b);
  const cabeza = ys[Math.floor(ys.length * percentil)];
  return Math.round(Math.max(cabeza - AIRE, TOPE_SUPERIOR + alto));
};
// desde/hasta en segundos del preview
const tramo = (desde: number, hasta: number, alto: number, percentil?: number) => {
  const d = f(desde);
  const h = f(hasta);
  return { desde: d, hasta: h, base: sobreCabeza(d, h, alto, percentil) };
};

const MODELOS: Modelo[] = [
  { nombre: "OpenAI", icono: `trabajos/${ID}/img/openai.svg`, color: "#111111" },
  { nombre: "Anthropic", icono: `trabajos/${ID}/img/anthropic.svg`, color: "#141413" },
];
const LOGOS_S = [8.42, 8.9]; // "OpenAI", "Anthropic"
const HARDWARE = ["RAM", "GPU", "SSD", "CPU"]; // memoria RAM, placa de video, almacenamiento, CPU
const HARDWARE_S = [42.84, 45.24, 47.58, 49.04];

const graficos: GraficosEp2Props = {
  apertura: { ...tramo(0, 3.7, 330), ganador: RULETA_ITEMS.indexOf("INFERENCIA") }, // termina con la 1ª toma
  logos: { ...tramo(8.3, 10.9, 200), entradas: LOGOS_S.map(f), modelos: MODELOS },
  servicio: tramo(12.96, 17.9, 200), // "es inferencia como servicio… racks… placas gráficas" (tarjeta de la v. A)
  token: tramo(24.6, 27.6, 180), // "a un precio por token, te lo venden por token"
  proveedor: { ...tramo(34.95, 37.7, PROVEEDOR_ALTO_TOTAL), texto: "PROVEEDOR INFERENCIA" }, // resaltar (2026-11-12)
  // altura habitual de la cabeza (mediana), no la más alta: "bajalos, que no haya tanto aire" (2026-11-12)
  hardware: { ...tramo(42.4, 50.6, 90, PERCENTIL_HARDWARE), items: HARDWARE, entradas: HARDWARE_S.map(f) },
};
const POPS = [
  RULETA_DEMORA + RULETA_GIRO, // la ruleta frena
  ...graficos.logos.entradas,
  graficos.servicio.desde,
  graficos.token.desde,
  graficos.proveedor.desde + 3,
  ...graficos.hardware.entradas,
];

const sobreVideo = (
  <>
    <GraficosEp2 {...graficos} />
    {POPS.map((p, i) => (
      <Sequence key={i} from={p} durationInFrames={20} layout="none">
        <Audio src={staticFile(`trabajos/${ID}/audio/pop.wav`)} volume={POP_VOLUMEN} />
      </Sequence>
    ))}
  </>
);

const sobreCierre = (
  <>
    <ProximoEpisodio dur={CIERRE - CIERRE_SUBE} base={PROXIMO_BASE} ganador={PROXIMO} />
    <Sequence from={PROXIMO_PARADA} durationInFrames={20} layout="none">
      <Audio src={staticFile(`trabajos/${ID}/audio/pop.wav`)} volume={POP_VOLUMEN} />
    </Sequence>
  </>
);

const ep2: HablaSubtituladaProps = {
  marca: "volto",
  carpetaVideos: `trabajos/${ID}/crudos`,
  audios: { [CLIP]: `trabajos/${ID}/audio/voz.wav` },
  cruceAudio: 1,
  tomas: TOMAS,
  transcripcion: { [CLIP]: palabras },
  velocidad: 1,
  logoSuperior: false,
  zoomLento: false,
  seguimiento: { [CLIP]: SEG },
  subtitulos: {
    estilo: "reel",
    tamano: SUB_TAMANO,
    seco: true,
    grupos: [
      "Lo que yo llamo",
      "los proveedores",
      "de inferencia,",
      "que este es",
      "un gran player.",
      "No necesariamente",
      "hacen modelos",
      "de inteligencia artificial.",
      "Algunos puede ser que sí,",
      "como OpenAI",
      "y Anthropic,", // Whisper: "Atropi"
      "pero lo que sí o sí",
      "te ofrecen",
      "es inferencia,",
      "es inferencia",
      "como servicio,",
      "que básicamente son",
      "racks enormes,",
      "edificios enormes",
      "de placas gráficas",
      "que te hostean",
      "un modelo propio",
      "o un modelo",
      "de un third party,",
      "y te lo ofrecen a vos",
      "a un precio por token,",
      "te lo venden por token.",
      "Pueden tener",
      "diferentes modelos",
      "de pricing,",
      "te pueden hacer ahorro",
      "por comprar masivamente,",
      "etc.,",
      "-etc.,", // un solo "etc." en pantalla (2026-11-12)
      "pero su servicio",
      "en esta industria",
      "es proveedor inferencia.", // lo dictó el usuario (2026-11-12; Whisper: "es memoria inferencia")
      "Este te diría que es",
      "hoy en día",
      "uno de los más sólidos",
      "en todo este esquema",
      "de la industria,",
      "porque está clarísimo.",
      "De hecho,",
      "por eso todos los aumentos",
      "en memoria RAM,",
      "en placa de video",
      "y también",
      "en almacenamiento,",
      "en todo,",
      "en la CPU",
      "y lo que sea,",
      "porque estos",
      "grandes proveedores",
      "están ganando,",
      "todos le están",
      "poniendo plata ahí",
      "y están invirtiendo",
      "en tener su lugar",
      "en el mercado.",
    ],
  },
  cierre: { frase: "", sitio: "", duracion: CIERRE, estilo: "degrade", corte: true, sube: true },
};

// los gráficos van como hijo (JSX), no en las props: Remotion serializa las props a JSON
const Ep2: React.FC<HablaSubtituladaProps> = (p) => (
  <HablaSubtitulada {...p} sobreVideo={sobreVideo} sobreCierre={sobreCierre} />
);

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "volto-ep2-inferencia",
    component: Ep2 as ComposicionTrabajo["component"],
    durationInFrames: duracionHablaSubtitulada(ep2),
    defaultProps: ep2,
    salida: "ep2-inferencia_9x16",
  },
];
