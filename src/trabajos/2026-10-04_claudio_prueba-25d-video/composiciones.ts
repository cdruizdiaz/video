// Trabajo 2026-10-04_claudio_prueba-25d-video — prueba de la fase 3 del plan de mejoras (video real 2,5D):
// recorte de personas (scripts/mascaras.py), profundidad (scripts/profundidad.py) y seguimiento (scripts/seguimiento.py).
// Material: proxies de 2026-10-04_claudio_prueba-mocap (crudos archivados de 2026-09-29_claudio_musica).
import { FotoProfundidad, type FotoProfundidadProps } from "../../plantillas/comunes/FotoProfundidad";
import type { ComposicionTrabajo } from "../tipos";
import seguimientoPiso from "../../../public/trabajos/2026-10-04_claudio_prueba-25d-video/datos/seguimiento_piso.json";
import { AncladoCamara, DetrasGuitarra, DetrasNene } from "./Detras";

const foto: FotoProfundidadProps = {
  foto: "trabajos/2026-10-04_claudio_prueba-25d-video/img/foto_guitarra.jpg",
  profundidad: "trabajos/2026-10-04_claudio_prueba-25d-video/img/foto_guitarra_prof.png",
  angulo: 0,
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-prueba-25d-video-detras", component: DetrasNene, durationInFrames: 135, defaultProps: {}, height: 1936, salida: "detras_9x16" },
  { id: "claudio-prueba-25d-video-oclusion", component: DetrasGuitarra, durationInFrames: 120, defaultProps: {}, salida: "oclusion_9x16" },
  { id: "claudio-prueba-25d-video-foto", component: FotoProfundidad, durationInFrames: 120, defaultProps: foto, salida: "foto-paralaje_9x16" },
  { id: "claudio-prueba-25d-video-anclado", component: AncladoCamara, durationInFrames: 180, defaultProps: { seguimiento: seguimientoPiso }, width: 1440, height: 1080, salida: "anclado_4x3" },
];
