// Trabajo 2026-10-08_los-amigos-mat_teorema-pitagoras — "Teorema de Pitágoras" (guion_teorema-pitagoras.md),
// plantilla ExplicacionGeometrica. Demo (MVP) del canal "Los Amigos Mat".
import type { ComposicionTrabajo } from "../tipos";
import { DURACION, FPS, Pitagoras } from "./Pitagoras";

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "amigos-mat-pitagoras-9x16",
    component: Pitagoras,
    durationInFrames: DURACION,
    fps: FPS,
    defaultProps: {},
    salida: "teorema-pitagoras_9x16",
  },
];
