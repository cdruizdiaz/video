// Trabajo 2026-10-15_cei_dia-de-la-madre: video del Día de la Madre del CEI (15 alumnos agradecen a su mamá).
// El montaje (qué tramo de cada alumno y sus subtítulos) vive en plan.json; la sincronía del audio externo y las
// ganancias salen de los scripts de esta carpeta (datos/).
import ganancias from "../../../public/trabajos/2026-10-15_cei_dia-de-la-madre/datos/ganancias.json";
import sincronia from "../../../public/trabajos/2026-10-15_cei_dia-de-la-madre/datos/sincronia.json";
import type { ComposicionTrabajo } from "../tipos";
import { DiaDeLaMadre, duracionDiaDeLaMadre } from "./DiaDeLaMadre";
import type { DiaDeLaMadreProps, TomaPlan } from "./DiaDeLaMadre";
import plan from "./plan.json";

const props: DiaDeLaMadreProps = {
  tomas: plan.tomas as unknown as TomaPlan[],
  sincronia,
  ganancias,
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "cei-dia-de-la-madre",
    component: DiaDeLaMadre,
    durationInFrames: duracionDiaDeLaMadre(props),
    defaultProps: props as unknown as Record<string, unknown>,
    salida: "dia-de-la-madre_9x16",
  },
  {
    // las tomas con su voz y el cierre (placa + logo), sin subtítulos, música ni estabilización (el cliente pidió verlo sin estabilizar): para revisar cortes o armar en Premiere
    id: "cei-dia-de-la-madre-montaje",
    component: DiaDeLaMadre,
    durationInFrames: duracionDiaDeLaMadre(props),
    defaultProps: { ...props, sinSubsNiMusica: true, sinEstabilizar: true } as unknown as Record<string, unknown>,
    salida: "dia-de-la-madre-montaje_9x16",
  },
];
