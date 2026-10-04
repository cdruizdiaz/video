// Trabajo 2026-10-04_claudio_prueba-blender — prueba de la fase 5 del plan de mejoras: Bloomie construido en
// Blender desde su rig (scripts/blender/personaje_desde_rig.py) y renderizado con Eevee con las MISMAS poses del
// rig 2D (datos/animacion.json → scripts/blender/render.mjs). La cara es la textura animada de CaraTextura.
import animacionVideo from "../../../public/trabajos/2026-10-04_claudio_prueba-blender/datos/animacion_video.json";
import animacion from "../../../public/trabajos/2026-10-04_claudio_prueba-blender/datos/animacion.json";
import cache3d from "../../../public/trabajos/2026-10-04_claudio_prueba-blender/datos/cache3d.json";
import { PersonajeRig, type PersonajeRigProps } from "../../plantillas/PersonajeRig/PersonajeRig";
import { CaraTextura } from "../../rig/CaraTextura";
import type { ComposicionTrabajo } from "../tipos";
import { BlenderSobreVideo, FinalBlender } from "./Final";
import { BloomieGlb } from "./Glb";

const DURACION = 130;
const RIG = animacion as PersonajeRigProps;
const FONDO = "#e9e4dc";
const capa = (cache3d as Record<string, string>)["claudio-prueba-blender"] ?? "";

export const composiciones: ComposicionTrabajo[] = [
  // textura de la cara para Blender (512×512, transparente): la anima el rig 2D
  { id: "claudio-prueba-blender-cara", component: CaraTextura, durationInFrames: DURACION, defaultProps: { rig: RIG }, width: 512, height: 512, salida: "cara-textura" },
  // el rig 2D con la misma animación (para comparar)
  { id: "claudio-prueba-blender-2d", component: PersonajeRig, durationInFrames: DURACION, defaultProps: { ...RIG, fondo: FONDO, sombra: true }, salida: "bloomie-2d_9x16" },
  { id: "claudio-prueba-blender-final", component: FinalBlender, durationInFrames: DURACION, defaultProps: { capa, rig: RIG, fondo: FONDO }, salida: "bloomie-blender_9x16" },
  { id: "claudio-prueba-blender-glb", component: BloomieGlb, durationInFrames: 120, defaultProps: {}, salida: "bloomie-glb_9x16" },
  {
    id: "claudio-prueba-blender-video",
    component: BlenderSobreVideo,
    durationInFrames: 110,
    defaultProps: {
      capa: (cache3d as Record<string, string>)["claudio-prueba-blender-video"] ?? "",
      rig: animacionVideo as PersonajeRigProps,
      video: "trabajos/2026-10-04_claudio_prueba-25d-video/crudos/guitarra.mp4",
      cerca: "trabajos/2026-10-04_claudio_prueba-25d-video/crudos/guitarra_cerca.webm",
    },
    salida: "bloomie-blender-video_9x16",
  },
];
