// Trabajo 2026-11-03_cei_visita-cementerio: historia de IG (montaje musical de la visita al cementerio).
import type { ComposicionTrabajo } from "../tipos";
import { DURACION, VisitaCementerio } from "./VisitaCementerio";

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "cei-visita-cementerio-historia",
    component: VisitaCementerio,
    durationInFrames: DURACION,
    defaultProps: {},
    salida: "historia_9x16",
  },
];
