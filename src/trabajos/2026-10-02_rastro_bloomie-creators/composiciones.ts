// Trabajo 2026-10-02_rastro_bloomie-creators — Bloomie presenta a las creadoras de RASTRO (≤ 10 s, 9:16).
// Composición en BloomieCreators.tsx: video original (tramo 61–71 s) + Bloomie con el rig + globos.
// Risa: Mixkit 739 "Small cartoon character laughing" (la misma de Bloomie en Halloween).
import type { ComposicionTrabajo } from "../tipos";
import { BloomieCreators, type BloomieCreatorsProps, DURACION } from "./BloomieCreators";

const completo: BloomieCreatorsProps = {
  soloPersonaje: false,
  risa: { archivo: "biblioteca/sfx/mixkit/mixkit-739-small-cartoon-character-laughing.wav", volumen: 1 },
  bajaVideo: 0.45, // el audio original baja ≈ 7 dB mientras habla Bloomie
};
const alfa: BloomieCreatorsProps = { ...completo, soloPersonaje: true };
// Versión 2,5D (volumen de luz, giros ¾, sombra proyectada, entrada en perspectiva, globos y sticker con profundidad)
const completo25d: BloomieCreatorsProps = { ...completo, modo25d: true };
const alfa25d: BloomieCreatorsProps = { ...alfa, modo25d: true };
// Versión 3D (borrador): modelo 3D construido por código + sombra real; render con --gl=angle
const completo3d: BloomieCreatorsProps = { ...completo, modo3d: true };

export const composiciones: ComposicionTrabajo[] = [
  { id: "rastro-bloomie-creators-10s", component: BloomieCreators, durationInFrames: DURACION, defaultProps: completo, salida: "bloomie-creators_9x16" },
  { id: "rastro-bloomie-creators-alfa", component: BloomieCreators, durationInFrames: DURACION, defaultProps: alfa, salida: "bloomie-creators-alfa_9x16" },
  { id: "rastro-bloomie-creators-25d", component: BloomieCreators, durationInFrames: DURACION, defaultProps: completo25d, salida: "bloomie-creators-25d_9x16" },
  { id: "rastro-bloomie-creators-3d", component: BloomieCreators, durationInFrames: DURACION, defaultProps: completo3d, salida: "bloomie-creators-3d_9x16" },
  { id: "rastro-bloomie-creators-25d-alfa", component: BloomieCreators, durationInFrames: DURACION, defaultProps: alfa25d, salida: "bloomie-creators-25d-alfa_9x16" },
];
