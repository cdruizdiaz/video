// Trabajo 2026-10-27_animana_manta-dalma-bdw — reel de animaná: manta Dalma en la Barcelona Design Week (~31 s, 9:16).
// Tomas de iPhone (proxies 1080x1920) + fotos, cortadas al pulso de "musica dalma" (90 bpm).
import type { ComposicionTrabajo } from "../tipos";
import {
  duracionReelDalma,
  ReelDalma,
  type ReelDalmaProps,
  type Toma,
} from "./ReelDalma";

const ID = "2026-10-27_animana_manta-dalma-bdw";
const v = (
  n: number,
  desdeS: number,
  pulsos: number,
  extra: Partial<Toma> = {},
): Toma => ({
  tipo: "video",
  src: `trabajos/${ID}/crudos/IMG_${n}.mp4`,
  desdeS,
  pulsos,
  ...extra,
});
const f = (n: number, pulsos: number, extra: Partial<Toma> = {}): Toma => ({
  tipo: "foto",
  src: `trabajos/${ID}/img/IMG_${n}.jpg`,
  pulsos,
  ...extra,
});

const tomas: Toma[] = [
  v(3543, 5.0, 3, { texto: { lineas: ["Hilada a rueca."] } }), // macro de la trama con la etiqueta
  v(3545, 0.4, 3, { texto: { lineas: ["Tejida a mano."] } }), // la mano sobre la trama
  v(3544, 12.5, 3), // el macro que se abre hasta la silla
  v(3534, 5.2, 3), // la silla de Gaudí
  v(3532, 1.0, 4, {
    texto: { lineas: ["Elegida para la", "Barcelona Design Week."], cursiva: 1 },
  }),
  f(3558, 2, { origen: "50% 40%" }), // consulado
  v(3555, 8.0, 3),
  v(3531, 3.2, 3), // folletos del Sello (el texto ya se lee en la imagen)
  f(3556, 2, { empuja: "fuera" }),
  f(3536, 1),
  f(3537, 1, { empuja: "fuera" }),
  f(3538, 1),
  f(3539, 1, { empuja: "fuera" }),
  f(3540, 1),
  f(3547, 2),
  f(3548, 2, { empuja: "fuera" }),
  v(3559, 79.8, 3), // cartel "Manta Dalma" de la muestra
  v(3543, 8.5, 4),
];

const reel: ReelDalmaProps = {
  tomas,
  pulsosCierre: 5,
  musica: `trabajos/${ID}/audio/musica.wav`,
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "animana-manta-dalma-reel",
    component: ReelDalma,
    durationInFrames: duracionReelDalma(reel),
    defaultProps: reel,
    salida: "manta-dalma_9x16",
  },
];
