// Trabajo 2026-10-19_volto_radio — previews de cortes de las 20 narrativas de NARRATIVAS.md (plantilla HablaSubtitulada),
// como las previews de 2026-10-06_volto_fashion-week: solo cortes y planos, sin subtítulos, gráficos, música ni placa.
// Cortes en datos/tomas.json (ajustar_cortes.py los lleva al valle de la voz desde tomas_aprox.json).
// Material vertical (1080×1920): la toma larga IMG_7180-002 es un plano general fijo (conductor a la izquierda,
// Nacho a la derecha) → general / cerrado de él / cerrado del conductor, como la entrevista de radio de la fashion
// week; las tomas sueltas IMG_71xx son con cámara en mano → original / cerrado que sigue la cara (seguir_cara.py);
// la 2ª cámara (IMG_7328–7330, sincronizar.py) entra donde existe. Audio siempre del clip de la toma.
import {
  duracionHablaSubtitulada,
  HablaSubtitulada,
  type HablaSubtituladaProps,
  type Toma,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import type { Plano } from "../../plantillas/HablaSubtitulada/calculos";
import {
  EntrevistaRadio,
  type EntrevistaRadioProps,
} from "../2026-10-06_volto_fashion-week/EntrevistaRadio";
import transcripcion from "../../../public/trabajos/2026-10-19_volto_radio/datos/transcripcion.json";
import sincronia from "../../../public/trabajos/2026-10-19_volto_radio/datos/sincronia.json";
import tomasJson from "../../../public/trabajos/2026-10-19_volto_radio/datos/tomas.json";
import seg7170 from "../../../public/trabajos/2026-10-19_volto_radio/datos/seguimiento_IMG_7170.json";
import seg7171 from "../../../public/trabajos/2026-10-19_volto_radio/datos/seguimiento_IMG_7171.json";
import seg7172 from "../../../public/trabajos/2026-10-19_volto_radio/datos/seguimiento_IMG_7172.json";
import seg7175 from "../../../public/trabajos/2026-10-19_volto_radio/datos/seguimiento_IMG_7175.json";
import seg7176 from "../../../public/trabajos/2026-10-19_volto_radio/datos/seguimiento_IMG_7176.json";
import seg7177 from "../../../public/trabajos/2026-10-19_volto_radio/datos/seguimiento_IMG_7177.json";
import seg7330 from "../../../public/trabajos/2026-10-19_volto_radio/datos/seguimiento_IMG_7330.json";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-10-19_volto_radio";
// Plano general fijo (IMG_7180-002): caras medidas en la hoja de material (Nacho ≈ 0,64 / 0,51; conductor ≈ 0,30 / 0,48)
const GENERAL_ZOOM = 1;
const ACERCA = 1.6; // cerrado sobre una persona del general (como la entrevista de radio de la fashion week)
const SOBRE_NACHO = "87% 66%"; // deja su cara en ≈ (50 %, 42 %) de la pantalla
const SOBRE_CONDUCTOR = "0% 58%";
// Cámara en mano: corte seco a un plano quieto más cerrado que sigue la cara
const CERCA = 1.3;
// Voz: cada clip a -19 LUFS (ebur128 del clip entero, 2026-10-19: -13,5 a -15,4 LUFS); loudnorm a -14 al final
const GANANCIA_DB: Record<string, number> = {
  IMG_7170: -4.1,
  IMG_7171: -5.5,
  IMG_7172: -4.4,
  IMG_7175: -3.6,
  IMG_7176: -4.6,
  IMG_7177: -4.6,
  "IMG_7180-002": -4.4,
};

const plano = (ms: number, tipo: string): Plano => {
  if (tipo === "general")
    return { desdeMs: ms, zoom: GENERAL_ZOOM, fijo: true };
  if (tipo === "el")
    return { desdeMs: ms, zoom: ACERCA, origen: SOBRE_NACHO, fijo: true };
  if (tipo === "conductor")
    return { desdeMs: ms, zoom: ACERCA, origen: SOBRE_CONDUCTOR, fijo: true };
  if (tipo === "abierto") return { desdeMs: ms, zoom: 1, fijo: true };
  if (tipo === "cerca")
    return { desdeMs: ms, zoom: CERCA, fijo: true, seguir: true };
  if (tipo.startsWith("b:")) {
    const clip = tipo.slice(2) as keyof typeof sincronia;
    return {
      desdeMs: ms,
      clip,
      desfaseMs: sincronia[clip].desfaseMs,
      zoom: 1,
      fijo: true,
    };
  }
  throw new Error(`plano desconocido: ${tipo}`);
};

type TomaJson = {
  clip: string;
  desdeMs: number;
  hastaMs: number;
  planos: [number, string][];
};

const preview = (tomas: TomaJson[]): HablaSubtituladaProps => ({
  marca: "volto",
  carpetaVideos: `trabajos/${ID}/crudos`,
  transcripcion: {},
  velocidad: 1,
  logoSuperior: false,
  zoomLento: false,
  cruceAudio: 1, // un cuadro de fundido cruzado entre tomas (sin él, cada corte cae a silencio ~20 ms)
  seguimiento: {
    IMG_7170: seg7170,
    IMG_7171: seg7171,
    IMG_7172: seg7172,
    IMG_7175: seg7175,
    IMG_7176: seg7176,
    IMG_7177: seg7177,
    IMG_7330: seg7330,
  },
  tomas: tomas.map(
    (t): Toma => ({
      clip: t.clip,
      desdeMs: t.desdeMs,
      hastaMs: t.hastaMs,
      gananciaDb: GANANCIA_DB[t.clip],
      planos: t.planos.map(([ms, tipo]) => plano(ms, tipo)),
    }),
  ),
});

const PIEZAS = tomasJson as unknown as Record<string, TomaJson[]>;

// ---------- Pieza "trabajo" completa: los cortes de la preview v1 + CRITERIOS_REEL.md de Volto ----------
// "¿La IA te va a quitar el trabajo?" (NARRATIVAS.md, idea 15; guion_trabajo.md). Borrador A el 2026-10-22;
// 2ª tanda del mismo día (borrador B):
//  - arranca en "Nosotros, el eslogan…" (sale la pregunta del conductor);
//  - "IA con foco humano" entra entera, como un bloque (no palabra por palabra);
//  - zoom rápido a un plano más cerrado en "una empresa que tiene vendedores";
//  - "lo primero que nos dicen los vendedores es: «Uh, pará esto me va a quitar el laburo»";
//  - sin el gráfico "sin laburo";
//  - para no repetir recursos de las piezas anteriores: el 90 % como cifra grande con una barra (no el anillo),
//    la enumeración como textos que se revelan (no píldoras), un velocímetro en "con ese 10 % se vuelven más
//    productivos" (sin los anillos del 10 %) y un reloj de ocho porciones para el relato de las ocho horas;
//  - música suave de fondo todo el video (~22 dB bajo la voz), que sube en la placa.
// 3ª tanda (2026-10-23, borrador C):
//  - sin música ("no me gusta"), tampoco bajo la placa;
//  - "IA con foco humano" a la izquierda y más grande: "IA" sola y grande, "con foco" / "humano" resaltados;
//  - 90 %: tarjeta centrada (cifra, barra y "de las consultas") y en "son las más aburridas" una flecha hasta una
//    cara que bosteza con "zzz";
//  - la enumeración vuelve a chips, de otra forma (etiquetas blancas), centrados y más abajo sin tapar a nadie;
//  - 10 %: tarjeta blanca centrada desde el primer "10%" que se ensancha, empuja la cifra y escribe "= más
//    productivos" (sale el velocímetro);
//  - subtítulos un poco más chicos (74 → 66 px);
//  - placa de degradé (la colorida) apenas termina "competir" (sin la pausa de 0,4 s).
// 6ª tanda (2026-10-23, borrador F): música de fondo "no tan corpo, pero tecnológica" (Deep Techno Ambience,
// Mixkit 134), ~25 dB bajo la voz, que sube en la placa.
// 4ª tanda (2026-10-23, borrador D): "IA con foco humano" sin sonido, más abajo y más cerca de él; sin la
// flecha ni la cara que bosteza: la tarjeta del 90 % sale cuando arranca la lista y las etiquetas ocupan su
// lugar; el 10 % se carga de 1 a 10 (con el sonido de cuenta).
// Voz de Nacho con menos ruido (voz_suave, DeepFilterNet 15 dB), cada toma a -19 LUFS; subtítulos a mano
// (New Black 74 px, en seco, blancos); gráficos de vidrio; empuje rápido en "no va a reemplazar a los humanos".
const MUSICA_BAJO_VOZ_DB = -25; // música a -14 LUFS y voz a -19: ~21 dB por debajo (-30 "casi ni se notaba", 2026-10-23)
const MUSICA_PLACA_DB = -6; // sube en la placa
const EFECTOS_DB = -5;
const POP_VOLUMEN = 0.6;
const CUENTA_VOLUMEN = 0.45;
const ACIERTO_VOLUMEN = 0.45;
const SUB_TAMANO = 66; // 74 se veía grande (2026-10-23)
const CIERRE = 3 * 30; // frames
const EMPUJE_ZOOM = 1.3; // como "sí o sí" de la pieza 1: rápido, 1,3×, anclado hacia él
const EMPUJE_MS = 200;
const EMPUJE_ORIGEN_B = "62% 38%"; // su cara en la 2ª cámara
const EMPUJE_ORIGEN_GENERAL = "64% 45%"; // su cara en el general (queda quieta mientras crece)
const GANANCIA_TRABAJO_DB = [4.8, 3.9, 4.0, 4.7, 2.8, 4.5]; // por toma, a -19 LUFS (ebur128 sobre voz_suave)
const sonido = (ms: number, archivo: string, volumen: number) => ({
  clip: "IMG_7180-002",
  ms,
  src: `trabajos/${ID}/audio/${archivo}.wav`,
  volumen,
});
// sin la primera toma de la preview (la pregunta del conductor)
const tomasTrabajo = (PIEZAS.trabajo ?? []).slice(1).map(
  (t, i): Toma => ({
    clip: t.clip,
    desdeMs: t.desdeMs,
    hastaMs: t.hastaMs,
    gananciaDb: GANANCIA_TRABAJO_DB[i],
    planos: t.planos.map(([ms, tipo]) => plano(ms, tipo)),
  }),
);
// empuje rápido a 1,3× dentro de una toma, desde el plano que está en ese momento
const conEmpuje = (
  t: Toma,
  ms: number,
  tipo: string,
  origen: string,
): Toma => ({
  ...t,
  planos: [
    ...(t.planos ?? []).filter((p) => p.desdeMs < ms),
    {
      ...plano(ms, tipo),
      zoom: EMPUJE_ZOOM,
      zoomDesde: 1,
      rampaMs: EMPUJE_MS,
      origen,
    },
    ...(t.planos ?? []).filter((p) => p.desdeMs > ms),
  ],
});
const trabajo: EntrevistaRadioProps = {
  ...preview(PIEZAS.trabajo ?? []),
  transcripcion,
  audios: {
    "IMG_7180-002": `trabajos/${ID}/audio/voz_suave/IMG_7180-002.wav`,
  },
  efectosDb: EFECTOS_DB,
  musica: `trabajos/${ID}/audio/musica-fondo-trabajo.wav`, // preparar_musica.sh (Mixkit 134)
  musicaBajoVozDb: MUSICA_BAJO_VOZ_DB,
  musicaCierreDb: MUSICA_PLACA_DB,
  tomas: [
    tomasTrabajo[0],
    // "una empresa que tiene vendedores": zoom rápido del general a un plano más cerrado
    conEmpuje(tomasTrabajo[1], 1682220, "general", EMPUJE_ORIGEN_GENERAL),
    ...tomasTrabajo.slice(2, 5),
    // "…no va a reemplazar a los humanos": empuje rápido en la 2ª cámara; la placa entra apenas termina
    // "competir" (fin de la toma, 1744,89)
    conEmpuje(tomasTrabajo[5], 1734200, "b:IMG_7330", EMPUJE_ORIGEN_B),
  ],
  sonidos: [
    sonido(1694920, "cuenta", CUENTA_VOLUMEN), // 90 %
    sonido(1708520, "cuenta", CUENTA_VOLUMEN), // 10 %: se carga de 1 a 10
    sonido(1710900, "dia-1", POP_VOLUMEN), // empuja la cifra: "= más productivos"
    sonido(1714340, "pop", POP_VOLUMEN), // el reloj de la jornada
    sonido(1716640, "dia-1", POP_VOLUMEN), // "una hora buena"
    sonido(1718460, "acierto-1", ACIERTO_VOLUMEN), // "las ocho horas buenas"
  ],
  insertos: [
    // "IA con foco humano": a la izquierda, "IA" grande y "con foco" / "humano" resaltados en naranja; reemplaza
    // al subtítulo (x, y = esquina de arriba a la izquierda; el cartel blanco de la radio empieza en x ≈ 580)
    {
      tipo: "proLema",
      clip: "IMG_7180-002",
      desdeMs: 1655500,
      hastaMs: 1656680,
      x: 170, // más cerca de él (pedido 2026-10-23)
      y: 270,
      renglones: [
        { texto: "IA", tamano: 220 },
        { texto: "con foco", tamano: 100, resaltado: true },
        { texto: "humano", tamano: 100, resaltado: true },
      ],
    },
    // "el 90 % de las consultas": tarjeta centrada (cifra que cuenta, barra y etiqueta)
    {
      tipo: "proReparto",
      clip: "IMG_7180-002",
      desdeMs: 1694920,
      hastaMs: 1698280, // sale cuando arranca la lista, que ocupa su lugar
      x: 540,
      y: 520, // ~80 px sobre el pelo (2026-10-23: "que no haya tanto aire")
      valor: 90,
      etiqueta: "de las consultas",
    },
    // "las más aburridas… no calificados… siempre lo mismo": etiquetas blancas centradas, en el lugar de la
    // tarjeta del 90 % (en el general las cabezas empiezan en y ≈ 820)
    {
      tipo: "proEtiquetas",
      clip: "IMG_7180-002",
      desdeMs: 1698280,
      hastaMs: 1703350,
      x: 540,
      y: 520, // en el lugar de la tarjeta; la última termina ~80 px sobre las cabezas (820)
      items: [
        { texto: "las más aburridas", ms: 1698280 },
        { texto: "no calificados", ms: 1699840 },
        { texto: "siempre lo mismo", ms: 1702080 },
      ],
    },
    // "ese 10 %… con ese 10 % se vuelven más productivos": tarjeta con "10%" que se ensancha en "vuelven"
    {
      tipo: "proIgual",
      clip: "IMG_7180-002",
      desdeMs: 1708520,
      hastaMs: 1713400, // sigue en el comienzo del general (hasta "Entonces,"): si no, la frase completa duraba 5 cuadros
      x: 540,
      y: 380,
      cifra: "10%",
      texto: "= más productivos",
      empujaMs: 1710900, // apenas termina el segundo "10%"
    },
    // "de las ocho horas de trabajo, antes tenías siete horas feas y una hora buena… ahora tenés las ocho horas
    // buenas": la aguja recorre las siete feas (gris) y la buena (naranja); con "las ocho" se encienden todas
    {
      tipo: "proReloj8",
      clip: "IMG_7180-002",
      desdeMs: 1714340,
      hastaMs: 1719120,
      x: 540,
      y: 300,
      feasMs: 1715520,
      feasHastaMs: 1716420,
      buenaMs: 1716640,
      todasMs: 1718460,
    },
  ],
  subtitulos: {
    estilo: "reel",
    tamano: SUB_TAMANO,
    seco: true,
    grupos: [
      "Nosotros,",
      "el eslogan o el lema",
      "que tenemos",
      "dentro de Volto es:",
      "-IA con foco humano.", // lo muestra el gráfico
      "Siempre nos pasa de que",
      "cuando empezamos a trabajar",
      "para un agente",
      "de un equipo comercial,",
      "una empresa",
      "que tiene vendedores,",
      "lo primero que nos dicen",
      "los vendedores es:",
      "«Uh, pará esto", // comillas angulares (RAE): en New Black las rectas y las inglesas cierran mal
      "me va a quitar el laburo.",
      "O sea, yo acá",
      "me quedo sin laburo.",
      "Si hace todo el agente,",
      "¿qué voy a hacer yo?»", // la cita del vendedor va de "Uh" hasta acá (2026-10-23)
      "Y en realidad después,",
      "se dan cuenta",
      "de que lo que hace",
      "el agente es tomar",
      "-el 90% de las consultas", // lo muestra la cifra
      "que ellos no quieren tomar,",
      "porque son",
      "las más aburridas,",
      "porque son los prospectos",
      "que no están calificados,",
      "la gente que siempre",
      "pregunta lo mismo.",
      "Entonces, están",
      "supercontentos",
      "de que el agente",
      "pueda hacer ese trabajo,",
      "porque ahora ellos",
      "se pueden centrar",
      "en ese 10%",
      "que es importante.",
      "Y con ese 10%",
      "se vuelven más productivos.",
      "Entonces,",
      "de las ocho horas",
      "de trabajo,",
      "antes tenías",
      "siete horas feas",
      "y una hora buena,",
      "porque justo",
      "hablaba con uno,",
      "ahora tenés",
      "las ocho horas buenas.",
      "Entonces,",
      "mi posición final es:",
      "no va a reemplazar",
      "a los humanos,",
      "sí es superproductivo",
      "y si tenemos que ponernos",
      "todos como desafío,",
      "tenemos que estar",
      "a la altura,",
      "tenés que estar",
      "en ese 10%",
      "y hacerlo bien.",
      "Porque ahí es donde",
      "vamos a competir.",
    ],
  },
  // placa de degradé (la colorida) por corte, solo el logo animado
  cierre: {
    frase: "",
    sitio: "@volto.ai",
    duracion: CIERRE,
    estilo: "degrade",
    corte: true,
  },
};

export const composiciones: ComposicionTrabajo[] = Object.entries(PIEZAS)
  .map(([nombre, tomas]): ComposicionTrabajo => {
    const props = preview(tomas);
    return {
      id: `volto-radio-preview-${nombre}`,
      component: HablaSubtitulada,
      durationInFrames: duracionHablaSubtitulada(props),
      defaultProps: props,
      salida: `preview-${nombre}_9x16`,
    };
  })
  .concat([
    {
      id: "volto-radio-trabajo",
      component: EntrevistaRadio,
      durationInFrames: duracionHablaSubtitulada(trabajo),
      defaultProps: trabajo,
      salida: "trabajo_9x16",
    },
  ]);
