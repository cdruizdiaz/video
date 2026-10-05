// Trabajo 2026-10-01_claudio_bloomie — "Bloomie se va a la escuela" (guion_bus-40s.md, plantilla PersonajeAnimado).
import type { ComposicionTrabajo } from "../tipos";
import { BloomieEscuela, DURACION_BLOOMIE, PROPS_BLOOMIE } from "./BloomieEscuela";

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "claudio-bloomie-bus40",
    component: BloomieEscuela,
    durationInFrames: DURACION_BLOOMIE,
    defaultProps: PROPS_BLOOMIE,
    salida: "bus-40s_9x16",
  },
];
