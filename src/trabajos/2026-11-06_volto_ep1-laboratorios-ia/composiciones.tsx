// Trabajo 2026-11-06_volto_ep1-laboratorios-ia — "Quién es quién en el mundo de la IA", ep. 1 (laboratorios de IA).
// Réplica de la v2 de la otra PC (ep1-laboratorios-ia_9x16_v2.mp4) desde el original IMG_7203, con los mismos 4 tramos
// (mapear_referencia.py) y las correcciones del 2026-11-06 (ver TRABAJO.md):
//  - subtítulos con alineación forzada (scripts/alinear.py, datos/al*.json) y texto revisado contra la voz
//    ("a nivel de ofrecer inferencia": la v2 decía "a nivel de inferencia");
//  - voz con DeepFilterNet suave (preparar_voz.sh: 12 dB + 15 % del original, sin robotizar);
//  - gráficos apoyados sobre la cabeza con un aire leve (seguimiento de la cara), no pegados al margen;
//  - título en dos renglones y grande; la fila de chips es una ruleta que frena en AI Labs;
//  - placa final de degradé solo con el logo.
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import {
  duracionHablaSubtitulada,
  HablaSubtitulada,
  type HablaSubtituladaProps,
  type PalabraFuente,
  type Toma,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import { framesTomaSalida, type Plano } from "../../plantillas/HablaSubtitulada/calculos";
import { GraficosEp1, ProximoEpisodio, PROXIMO_PARADA, type GraficosEp1Props, type Modelo } from "./GraficosEp1";
import al1 from "../../../public/trabajos/2026-11-06_volto_ep1-laboratorios-ia/datos/al1.json";
import al2 from "../../../public/trabajos/2026-11-06_volto_ep1-laboratorios-ia/datos/al2.json";
import al3 from "../../../public/trabajos/2026-11-06_volto_ep1-laboratorios-ia/datos/al3.json";
import seguimiento from "../../../public/trabajos/2026-11-06_volto_ep1-laboratorios-ia/datos/seguimiento_IMG_7203.json";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-11-06_volto_ep1-laboratorios-ia";
const CLIP = "IMG_7203";
const FPS = 30;
// Audio
const VOZ_GANANCIA_DB = 8; // voz.wav ≈ -27,5 LUFS → ~-19 (loudnorm a -14 al final)
const POP_VOLUMEN = 0.5;
// Planos
const CERCA = 1.3;
// Subtítulos
const SUB_TAMANO = 66; // Volto desde la radio
// Gráficos sobre la cabeza
const AIRE = 50; // px entre el borde de abajo del gráfico y el pelo
const PELO = 0.55; // del alto de la cara: cuánto sube el pelo sobre la caja de MediaPipe
const TOPE_SUPERIOR = 150; // nunca más arriba (zona segura de Reels)
const CIERRE = 5 * FPS; // 4 s → 5 s con "Próximo episodio" (2026-11-12): que se lea tras frenar la ruleta
const PROXIMO_BASE = 720; // borde de abajo de la ruleta en la placa: tercio superior, ~160 px sobre el logo (centrado)
const CIERRE_SUBE = 14; // = CIERRE_SUBE de HablaSubtitulada: la capa de la placa arranca cuando terminó de subir

// ---------- Tomas (ms del original; los 4 tramos de la v2, cortados en los huecos de la voz) ----------
const fijo = (desdeMs: number, zoom = 1): Plano => ({ desdeMs, zoom, fijo: true });
// plano cerrado QUIETO (corte seco), anclado en la posición media de la cara en ese tramo (seguimiento de
// MediaPipe). No sigue la cara: con `seguir` el encuadre se deslizaba mientras él se movía y en el s 17 quedaba
// raro (2026-11-06); tampoco hay empujes con rampa.
const quieto = (desdeMs: number, zoom: number, cx: number, cy: number): Plano => ({
  desdeMs,
  zoom,
  origen: `${Math.round(cx * 100)}% ${Math.round(cy * 100)}%`,
  fijo: true,
});

const TOMAS: Toma[] = [
  // "Hoy en día, la industria… los nuevos agentes de la industria."
  // sin el corte de vuelta al abierto en el s 8 (2026-11-06: "hay muchos cortes"). Partida en dos para sacar la
  // muletilla "ehh" de después de "dos mil" (6,00–6,40 s, 2026-11-12); el corte cae en el cambio al plano cerrado
  { clip: CLIP, desdeMs: 980, hastaMs: 6000, planos: [fijo(980)] },
  { clip: CLIP, desdeMs: 6400, hastaMs: 10450, planos: [quieto(6400, CERCA, 0.351, 0.387)] },
  // "Hoy en día se está empezando a aclarar el panorama y yo tengo una idea más o menos de cómo se va armando."
  { clip: CLIP, desdeMs: 26950, hastaMs: 31560, planos: [quieto(26950, CERCA, 0.239, 0.355), fijo(29580)] },
  // "Por un lado, una de las patas… que está en los laboratorios de IA," — un solo plano cerrado (sin el corte al
  // abierto del s 14,8 ni el de "laboratorios"); termina cuando se apaga "IA" (36,85 s; antes 36,73 la cortaba)
  { clip: CLIP, desdeMs: 32300, hastaMs: 36860, planos: [quieto(32300, CERCA, 0.36, 0.376)] },
  // "que son estas marcas que… y poder publicarlo." (la 2ª vez que dice "que son estas marcas")
  {
    clip: CLIP,
    desdeMs: 39090, // la voz arranca al toque (39,11 s)
    hastaMs: 64100,
    pausaMs: 470, // la placa sube en esta pausa, sin tapar "publicarlo" (imagen sigue, ambiente sin voz)
    ambienteMs: 62350, // silencio entre "modelo" y "y poder publicarlo"
    planos: [
      quieto(39090, CERCA, 0.36, 0.376), // el mismo plano que la toma anterior: solo se corta el silencio
      fijo(43250), // "es crear modelos" (tarjeta, logos y benchmark van en el plano abierto)
      quieto(56200, CERCA, 0.352, 0.373), // "que no trabajan tanto…"
      fijo(58640), // "no trabajan tanto a nivel de ofrecer inferencia."
      quieto(60500, CERCA, 0.337, 0.375), // "Trabajan particularmente…"
    ],
  },
].map((t) => ({ ...t, gananciaDb: VOZ_GANANCIA_DB, rampaAudio: 1 }));

// ---------- Palabras alineadas (alinear.py) con la ortografía de pantalla ----------
type Alineada = { palabra: string; ini: number; fin: number };
const UNIR: [string[], string][] = [
  [["i", "a"], "IA"],
  [["ge", "pe", "te"], "GPT"],
];
const MAYUS: Record<string, string> = { gemini: "Gemini", claude: "Claude", kimi: "Kimi" };
// correcciones del usuario (2026-11-12), por segundo de inicio en el original: texto nuevo, o null = no se dice
const CORREGIR: Record<number, string | null> = {
  2.98: "reorganizando", // "se está reorganizando" (la alineación forzada usaba el texto de Whisper)
  35.14: null, // "está en los laboratorios" (sin "que", como lo oye Whisper)
};
const palabras = (() => {
  const todas = [...(al1 as Alineada[]), ...(al2 as Alineada[]), ...(al3 as Alineada[])];
  const out: PalabraFuente[] = [];
  for (let i = 0; i < todas.length; i++) {
    const u = UNIR.find(([ws]) => ws.every((w, k) => todas[i + k]?.palabra === w));
    if (u) {
      const n = u[0].length;
      out.push({ text: u[1], startMs: todas[i].ini * 1000, endMs: todas[i + n - 1].fin * 1000 });
      i += n - 1;
      continue;
    }
    const w = todas[i];
    const c = CORREGIR[w.ini];
    if (c === null) continue;
    if (c !== undefined) {
      out.push({ text: c, startMs: w.ini * 1000, endMs: w.fin * 1000 });
      continue;
    }
    out.push({ text: MAYUS[w.palabra] ?? w.palabra, startMs: w.ini * 1000, endMs: w.fin * 1000 });
  }
  return out;
})();

// ---------- Tiempos de salida ----------
const iniciosTomas = (() => {
  let acc = 0;
  return TOMAS.map((t) => {
    const ini = acc;
    acc += framesTomaSalida(t, 1, FPS);
    return ini;
  });
})();
const aSalida = (ms: number) => {
  const i = TOMAS.findIndex((t) => ms >= t.desdeMs && ms <= t.hastaMs);
  if (i < 0) throw new Error(`${ms} ms no está en ninguna toma`);
  return iniciosTomas[i] + Math.round(((ms - TOMAS[i].desdeMs) / 1000) * FPS);
};

// borde de abajo de un gráfico: AIRE px sobre el punto más alto de la cabeza (plano abierto) en ese tramo
const sobreCabeza = (desdeMs: number, hastaMs: number, altoGrafico: number) => {
  const tramo = (seguimiento as number[][]).filter(([s]) => s * 1000 >= desdeMs && s * 1000 <= hastaMs);
  const cabeza = Math.min(...tramo.map(([, , cy, h]) => (cy - h / 2 - h * PELO) * 1920));
  return Math.round(Math.max(cabeza - AIRE, TOPE_SUPERIOR + altoGrafico));
};

const MODELOS: Modelo[] = [
  { nombre: "Gemini", icono: `trabajos/${ID}/img/googlegemini.svg`, color: "#3c7bf4" },
  { nombre: "GPT", icono: `trabajos/${ID}/img/openai.svg`, color: "#111111" },
  { nombre: "Claude", icono: `trabajos/${ID}/img/claude.svg`, color: "#d97757" },
  { nombre: "Kimi", icono: `trabajos/${ID}/img/kimi.svg`, color: "#111111" },
];
const LOGOS_MS = [47280, 47820, 48840, 49800];

const graficos: GraficosEp1Props = {
  apertura: { desde: 0, hasta: aSalida(5990), base: sobreCabeza(980, 5990, 330) },
  objetivo: { desde: aSalida(43250), hasta: aSalida(46560), base: sobreCabeza(43250, 46560, 200) },
  logos: {
    desde: aSalida(47200),
    hasta: aSalida(50750),
    base: sobreCabeza(47200, 50750, 200),
    entradas: LOGOS_MS.map(aSalida),
  },
  benchmark: { desde: aSalida(50780), hasta: aSalida(56150), base: sobreCabeza(50780, 56150, 280) },
  modelos: MODELOS,
};
// la ruleta frena 60 cuadros después de entrar (RULETA_DEMORA + RULETA_GIRO de GraficosEp1)
const POPS = [60, graficos.objetivo.desde, ...graficos.logos.entradas]; // sin pop en el benchmark (s 30, 2026-11-06)

const sobreVideo = (
  <>
    <GraficosEp1 {...graficos} />
    {POPS.map((f, i) => (
      <Sequence key={i} from={f} durationInFrames={20} layout="none">
        <Audio src={staticFile(`trabajos/${ID}/audio/pop.wav`)} volume={POP_VOLUMEN} />
      </Sequence>
    ))}
  </>
);

const ep1: HablaSubtituladaProps = {
  marca: "volto",
  carpetaVideos: `trabajos/${ID}/crudos`,
  audios: { [CLIP]: `trabajos/${ID}/audio/voz.wav` },
  cruceAudio: 1,
  tomas: TOMAS,
  transcripcion: { [CLIP]: palabras },
  velocidad: 1,
  logoSuperior: false,
  zoomLento: false,
  seguimiento: { [CLIP]: seguimiento as number[][] },
  // sin música: la pone el usuario después (2026-11-06)
  subtitulos: {
    estilo: "reel",
    tamano: SUB_TAMANO,
    seco: true,
    grupos: [
      "Hoy en día,",
      "la industria",
      "se está reorganizando", // lo corrigió el usuario (2026-11-12)
      "con la inteligencia artificial,",
      "un poco como",
      "pasó con los dos mil,", // en letras (2026-11-12)
      "estuve pensando", // "estuve" lo confirmó el usuario (2026-11-06); el "y… ehh" es la muletilla cortada
      "bastante tiempo",
      "en cómo se están organizando",
      "los nuevos agentes",
      "de la industria.",
      "Hoy en día",
      "se está empezando",
      "a aclarar el panorama",
      "y yo tengo una idea",
      "más o menos",
      "de cómo se va armando.",
      "Por un lado,",
      "una de las patas",
      "de la nueva industria",
      "de la inteligencia artificial",
      "está en los", // sin "que" (2026-11-12)
      "laboratorios de IA,",
      "que son estas marcas",
      "que, de alguna manera,",
      "lo que se dedican a hacer",
      "es crear modelos.",
      "Específicamente",
      "crear modelos,",
      "la creación de modelos.",
      "Por ejemplo:",
      "Gemini, GPT,", // con subtítulo aunque estén los logos (2026-11-06)
      "Claude, Kimi.",
      "Esto es muy claro",
      "y muy evidente",
      "en algunas marcas,",
      "sobre todo",
      "las marcas chinas", // lo que dice (sin "en")
      "o en laboratorios", // lo que dice (sin "los")
      "más chicos,",
      "que no trabajan tanto",
      "en~el nivel de producto,", // lo que dice ("tanto en el… nivel de producto")
      "no trabajan tanto",
      "a nivel de ofrecer", // la v2 decía "a nivel de inferencia" (faltaba "ofrecer")
      "inferencia.",
      "Trabajan particularmente",
      "con ofrecer un modelo",
      "y poder publicarlo.",
    ],
  },
  // placa de degradé solo con el logo (2026-11-06: "nada más"), que sube animada desde abajo
  cierre: { frase: "", sitio: "", duracion: CIERRE, estilo: "degrade", corte: true, sube: true },
};

// placa: "Próximo episodio" con la ruleta de la apertura, que frena en INFERENCIA, arriba del logo centrado
const sobreCierre = (
  <>
    <ProximoEpisodio dur={CIERRE - CIERRE_SUBE} base={PROXIMO_BASE} />
    <Sequence from={PROXIMO_PARADA} durationInFrames={20} layout="none">
      <Audio src={staticFile(`trabajos/${ID}/audio/pop.wav`)} volume={POP_VOLUMEN} />
    </Sequence>
  </>
);

// los gráficos van como hijo (JSX), no en las props: Remotion serializa las props a JSON
const Ep1: React.FC<HablaSubtituladaProps> = (p) => (
  <HablaSubtitulada {...p} sobreVideo={sobreVideo} sobreCierre={sobreCierre} />
);

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "volto-ep1-laboratorios-ia",
    component: Ep1 as ComposicionTrabajo["component"],
    durationInFrames: duracionHablaSubtitulada(ep1),
    defaultProps: ep1,
    salida: "ep1-laboratorios-ia_9x16",
  },
];
