// Trabajo 2026-10-23_rastro_affinity-dia-01 — "Día 1/20 probando Affinity", video orgánico para las redes de RASTRO:
// Pau prueba Affinity haciendo la portada del reel y lo cuenta; mientras muestra, las grabaciones de pantalla como
// insertos (GraficosAffinity.tsx). HablaSubtitulada (CRITERIOS_REEL.md) + placa de cierre de RASTRO.
// Arranca con "Día 1 de 20 probando Affinity" de IMG_8270 (pedido 2026-10-23).
import transcripcion from "../../../public/trabajos/2026-10-23_rastro_affinity-dia-01/datos/transcripcion.json";
import { paletaRastro } from "../../marcas/rastro/marca";
import type {
  HablaSubtituladaProps,
  PalabraFuente,
  Toma,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import type { ComposicionTrabajo } from "../tipos";
import type { Recorte, TramoPantalla } from "./GraficosAffinity";
import {
  duracionReelAffinity,
  type Inserto,
  ReelAffinity,
  type ReelAffinityProps,
} from "./ReelAffinity";

const ID = "2026-10-23_rastro_affinity-dia-01";
const CRUDOS = `trabajos/${ID}/crudos`;
const AUDIO = `trabajos/${ID}/audio`;
const TR = transcripcion as Record<string, PalabraFuente[]>;

// ---------- Planos ----------
// Cámara fija sobre la mesa (8270–8273): abierto 1,08 anclado abajo y cerrado 1,5 sobre la cara (x 590, y 700 del
// cuadro). IMG_8277 es una selfie: tal cual.
const ABIERTO = { zoom: 1.08, origen: "50% 92%" };
const CERRADO = { zoom: 1.5, origen: "55% 36%", fijo: true };
const SELFIE = { zoom: 1 };

// ---------- Tomas ----------
// ms de cada clip, cortadas en los valles de energía de la voz limpia. Un cambio de plano en cada corte.
const toma = (
  clip: string,
  desdeMs: number,
  hastaMs: number,
  plano: { zoom: number; origen?: string; fijo?: boolean },
): Toma => ({ clip, desdeMs, hastaMs, planos: [{ desdeMs, ...plano }] });
const tomas: Toma[] = [
  /* 0 */ toma("IMG_8270", 1950, 2950, CERRADO), // "Día 1"
  /* 1 */ toma("IMG_8270", 3620, 5140, ABIERTO), // "de 20 probando Affinity."
  /* 2 */ toma("IMG_8271", 4310, 12170, CERRADO), // "Bueno, todo arranca… odio Adobe… existía Affinity."
  /* 3 */ toma("IMG_8271", 18190, 26880, ABIERTO), // "Pero acá estoy… la portada de este reel."
  /* 4 */ toma("IMG_8271", 37420, 43230, CERRADO), // "Lo básico ya lo hice… lo abrí y arranqué a usarlo."
  /* 5 */ toma("IMG_8271", 43230, 49530, ABIERTO), // "La primera parte de usabilidad… cositas extras…"
  /* 6 */ toma("IMG_8271", 49530, 56310, CERRADO), // "…el sangrado, los márgenes, si querés que tenga reglas o no."
  /* 7 */ toma("IMG_8271", 62110, 64350, ABIERTO), // "Eso me pareció un dios."
  /* 8 */ toma("IMG_8271", 64350, 72230, CERRADO), // "Y ahora ya adentro me puse a jugar… Cosas random."
  /* 9 */ toma("IMG_8272", 13820, 14930, ABIERTO), // "Puse un fondo,"
  /* 10 */ toma("IMG_8272", 20460, 22830, CERRADO), // "Acá encontré todas estas formas,"
  /* 11 */ toma("IMG_8272", 28390, 31340, ABIERTO), // "y tiene un gatito,"
  /* 12 */ toma("IMG_8272", 35310, 37060, CERRADO), // "bueno, pero el gatito no lo vamos a usar"
  /* 13 */ toma("IMG_8272", 38670, 47900, ABIERTO), // "Y arriba puse una imagen… Illustrator con la de Photoshop"
  /* 14 */ toma("IMG_8272", 59340, 63780, CERRADO), // "elegí como modo de capa multiplicar… textura"
  /* 15 */ toma("IMG_8272", 64900, 66490, ABIERTO), // "Y vamos a poner texto,"
  /* 16 */ toma("IMG_8272", 73280, 78720, CERRADO), // "Está bueno porque arrastrás el texto… con los puntos"
  /* 17 */ toma("IMG_8272", 79330, 84100, ABIERTO), // "Entonces vamos a poner: Día 1 de 20"
  /* 18 */ toma("IMG_8272", 91520, 92510, CERRADO), // "probando,"
  /* 19 */ toma("IMG_8272", 94450, 99140, ABIERTO), // "Affinity. No se escribe así, creo. Pero bueno, no importa."
  /* 20 */ toma("IMG_8273", 160650, 165730, CERRADO), // "¿Se podrá sacar fondo acá? A ver."
  /* 21 */ toma("IMG_8273", 189730, 201800, ABIERTO), // "Tiene como 3 o 4… modalidades de trabajo… en Pixel, en diseño,"
  /* 22 */ toma("IMG_8273", 304500, 312360, CERRADO), // "Borrar papel blanco. Eso estuvo genial. Wow."
  /* 23 */ toma("IMG_8273", 330840, 336550, ABIERTO), // "Muestras. Ahí podría poner las muestras de RASTRO."
  /* 24 */ toma("IMG_8277", 2610, 18520, SELFIE), // "Cuando lo vas a exportar… tiene cosas, tiene cositas."
];

// ms del clip en que empieza una palabra (la primera que empieza con `texto` desde `desdeMs`)
const en = (clip: string, texto: string, desdeMs = 0) => {
  const w = TR[clip].find(
    (p) => p.startMs >= desdeMs && p.text.toLowerCase().startsWith(texto),
  );
  if (!w) throw new Error(`${clip}: no está "${texto}"`);
  return w.startMs;
};

// ---------- Grabaciones de pantalla ----------
// Sincronía con la grabación de 17:05:36 (sincronizar.py, GCC-PHAT; la grabación corre un 0,1 % más rápido):
// segundo de la grabación en que se dice lo que está a `ms` del clip
const SINCRO: Record<string, { desfase: number; deriva: number }> = {
  IMG_8272: { desfase: 69.624, deriva: 0.00118 },
  IMG_8273: { desfase: 324.599, deriva: 0.00071 },
};
const enPantalla = (clip: string, ms: number) => {
  const t = ms / 1000;
  const s = SINCRO[clip];
  return t + s.desfase + (t - 2) * s.deriva;
};
// recortes (px de la grabación 1920×1020)
const UI: Recorte = [0, 0, 1440, 1020]; // la interfaz sin los paneles de la derecha
const MESA: Recorte = [380, 100, 860, 920]; // la mesa de trabajo vertical de la portada
const CAPAS: Recorte = [1450, 380, 470, 400]; // el panel de capas (modo de fusión)
const PERSONAS: Recorte = [0, 0, 760, 330]; // los modos de trabajo (Vector / Pixel / Diseño) arriba a la izquierda
const MESA_CHICA: Recorte = [520, 300, 600, 600]; // la mesa de trabajo con el zoom lejos (formas, gatito)
const PORTADA: Recorte = [330, 150, 960, 870]; // la portada terminada, grande
// lo que se ve mientras lo dice: la grabación de 17:05:36, sincronizada
const sincronizada = (
  clip: string,
  ms: number,
  recorte: Recorte,
): TramoPantalla[] => [
  {
    grabacion: "affinity_170536",
    desdeS: enPantalla(clip, ms),
    cuadros: 1,
    recorte,
  },
];
// "me puse a jugar con un montón de cosas… Cosas random": las pruebas de antes (16:35 y 16:37), cortitas y rápidas
const RANDOM: [string, number][] = [
  ["affinity_163507", 8],
  ["affinity_163507", 30],
  ["affinity_163507", 92],
  ["affinity_163507", 100],
  ["affinity_163712", 12],
  ["affinity_163712", 30],
  ["affinity_163712", 50],
  ["affinity_163712", 75],
  ["affinity_163712", 120],
];
const CUADROS_RANDOM = 12;
// la portada que se va armando (17:29–17:37), mientras cuenta cómo se exporta
const ARMADO: [string, number][] = [
  ["affinity_172916", 40],
  ["affinity_172916", 70],
  ["affinity_173322", 60],
  ["affinity_173322", 100],
  ["affinity_173700", 40],
  ["affinity_173322", 150],
  ["affinity_173700", 300],
];
const CUADROS_ARMADO = 18;

const s = (n: string) => `${AUDIO}/${n}.wav`;
// gráficos sobre Pau: borde de abajo 80 px arriba del pelo (pelo de IMG_8271 en y≈486 del cuadro; en el abierto, 384)
const PILDORAS_Y = 300;

const insertos: Inserto[] = [
  // "lo abrí y arranqué a usarlo": Affinity vacío y se abre el primer archivo (15:17)
  {
    toma: 4,
    ms: en("IMG_8271", "abrí"),
    grafico: {
      tipo: "pantalla",
      tramos: [
        { grabacion: "affinity_151755", desdeS: 23.5, cuadros: 1, recorte: UI },
      ],
    },
    sonidos: [],
  },
  // "La primera parte de usabilidad es muy parecida a Adobe…": recorre ese archivo (16:26)
  {
    toma: 5,
    ms: tomas[5].desdeMs,
    grafico: {
      tipo: "pantalla",
      tramos: [
        {
          grabacion: "affinity_162612",
          desdeS: 6,
          cuadros: 1,
          velocidad: 2,
          recorte: UI,
        },
      ],
    },
    sonidos: [],
  },
  // el sangrado, los márgenes, las reglas (el diálogo del documento nuevo no quedó en la grabación)
  {
    toma: 6,
    ms: en("IMG_8271", "sangrado"),
    grafico: {
      tipo: "pildoras",
      y: PILDORAS_Y,
      textos: ["Sangrado", "Márgenes", "Reglas"],
      beatsMs: [
        en("IMG_8271", "sangrado"),
        en("IMG_8271", "márgenes"),
        en("IMG_8271", "reglas"),
      ],
    },
    sonidos: ["sangrado", "márgenes", "reglas"].map((p, k) => ({
      ms: en("IMG_8271", p),
      src: s(`pop_${k}`),
    })),
  },
  {
    toma: 8,
    ms: en("IMG_8271", "aparecer"),
    grafico: {
      tipo: "pantalla",
      tramos: RANDOM.map(([grabacion, desdeS]) => ({
        grabacion,
        desdeS,
        cuadros: CUADROS_RANDOM,
        velocidad: 2,
        recorte: UI,
      })),
    },
    sonidos: [],
  },
  // de acá en adelante, la grabación de 17:05:36 sincronizada con lo que dice
  {
    toma: 9,
    ms: tomas[9].desdeMs,
    grafico: {
      tipo: "pantalla",
      tramos: sincronizada("IMG_8272", tomas[9].desdeMs, MESA),
    },
    sonidos: [],
  },
  {
    toma: 10,
    ms: tomas[10].desdeMs,
    grafico: {
      tipo: "pantalla",
      // cuenta las formas un poco antes de dibujarlas: el rectángulo negro aparece a los 95 s de la grabación
      tramos: [
        {
          grabacion: "affinity_170536",
          desdeS: 94.5,
          cuadros: 1,
          recorte: MESA_CHICA,
        },
      ],
    },
    sonidos: [],
  },
  {
    toma: 11,
    ms: tomas[11].desdeMs,
    grafico: {
      tipo: "pantalla",
      // el gatito aparece a los 101 s
      tramos: [
        {
          grabacion: "affinity_170536",
          desdeS: 100.8,
          cuadros: 1,
          recorte: MESA_CHICA,
        },
      ],
    },
    sonidos: [],
  },
  {
    toma: 14,
    ms: en("IMG_8272", "multiplicar"),
    grafico: {
      tipo: "pantalla",
      tramos: sincronizada("IMG_8272", en("IMG_8272", "multiplicar"), CAPAS),
    },
    sonidos: [],
  },
  {
    toma: 16,
    ms: tomas[16].desdeMs,
    grafico: {
      tipo: "pantalla",
      tramos: sincronizada("IMG_8272", tomas[16].desdeMs, MESA),
    },
    sonidos: [],
  },
  {
    toma: 17,
    ms: en("IMG_8272", "día", 80000),
    grafico: {
      tipo: "pantalla",
      tramos: sincronizada("IMG_8272", en("IMG_8272", "día", 80000), MESA),
    },
    sonidos: [],
  },
  {
    toma: 18,
    ms: tomas[18].desdeMs,
    grafico: {
      tipo: "pantalla",
      tramos: sincronizada("IMG_8272", tomas[18].desdeMs, MESA),
    },
    sonidos: [],
  },
  // "Affinity. No se escribe así, creo." (escribió "Afinnity"); "pero bueno, no importa", en cámara
  {
    toma: 19,
    ms: tomas[19].desdeMs,
    hastaMs: en("IMG_8272", "pero", 97000),
    grafico: {
      tipo: "pantalla",
      tramos: sincronizada("IMG_8272", tomas[19].desdeMs, MESA),
    },
    sonidos: [],
  },
  {
    toma: 20,
    ms: tomas[20].desdeMs,
    grafico: {
      tipo: "pantalla",
      tramos: sincronizada("IMG_8273", tomas[20].desdeMs, MESA),
    },
    sonidos: [],
  },
  {
    toma: 21,
    ms: en("IMG_8273", "entonces", 196000),
    grafico: {
      tipo: "pantalla",
      tramos: sincronizada(
        "IMG_8273",
        en("IMG_8273", "entonces", 196000),
        PERSONAS,
      ),
    },
    sonidos: [],
  },
  // "Muestras… las muestras de RASTRO": cambia los colores de la portada (17:29)
  {
    toma: 23,
    ms: tomas[23].desdeMs,
    grafico: {
      tipo: "pantalla",
      tramos: [
        { grabacion: "affinity_172916", desdeS: 58, cuadros: 1, recorte: MESA },
      ],
    },
    sonidos: [],
  },
  // "…o directamente exportarlo a Canva…": la portada que se arma, rápido
  {
    toma: 24,
    ms: en("IMG_8277", "exportarlo"),
    hastaMs: en("IMG_8277", "bueno"),
    grafico: {
      tipo: "pantalla",
      tramos: ARMADO.map(([grabacion, desdeS]) => ({
        grabacion,
        desdeS,
        cuadros: CUADROS_ARMADO,
        velocidad: 3,
        recorte: MESA,
      })),
    },
    sonidos: [],
  },
  // "…tiene cosas, tiene cositas.": la portada terminada
  {
    toma: 24,
    ms: en("IMG_8277", "tiene", 15000),
    grafico: {
      tipo: "pantalla",
      tramos: [
        {
          grabacion: "affinity_173700",
          desdeS: 4,
          cuadros: 1,
          velocidad: 0.5,
          recorte: PORTADA,
        },
      ],
    },
    sonidos: [],
  },
];

const reel: ReelAffinityProps = {
  marca: "rastro",
  carpetaVideos: CRUDOS,
  cruceAudio: 1,
  // voz: DeepFilterNet + nivelada por palabra, cada clip a -19 LUFS (preparar_voz.sh)
  audios: Object.fromEntries(
    ["IMG_8270", "IMG_8271", "IMG_8272", "IMG_8273", "IMG_8277"].map((c) => [
      c,
      `${AUDIO}/voz/${c}.wav`,
    ]),
  ),
  tomas,
  transcripcion: transcripcion as HablaSubtituladaProps["transcripcion"],
  velocidad: 1,
  logoSuperior: false,
  insertos,
  efectosVolumen: 0.35,
  subtitulos: {
    estilo: "reel",
    tamano: 64, // como los otros reels de RASTRO: Inter 500, 64 px, sin trazo
    peso: 500,
    sinBorde: true,
    seco: true,
  },
  // placa de cierre en bordó: sigue el rojo de la portada
  placa: {
    fondo: paletaRastro.bordo,
    tinta: "#ffffff",
    logoClaro: true,
    entrada: "dibuja",
  },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "rastro-affinity-dia-01-reel",
    component: ReelAffinity,
    durationInFrames: duracionReelAffinity(reel),
    defaultProps: reel,
    salida: "affinity-dia-01_9x16",
  },
];
