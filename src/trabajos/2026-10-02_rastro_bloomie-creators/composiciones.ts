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

export const composiciones: ComposicionTrabajo[] = [
  { id: "rastro-bloomie-creators-10s", component: BloomieCreators, durationInFrames: DURACION, defaultProps: completo, salida: "bloomie-creators_9x16" },
  { id: "rastro-bloomie-creators-alfa", component: BloomieCreators, durationInFrames: DURACION, defaultProps: alfa, salida: "bloomie-creators-alfa_9x16" },
];
