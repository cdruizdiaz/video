// Trabajo 2026-10-06_claudio_cantando-como-robot: el músico del crudo reemplazado por un robot 3D (armadura roja y
// dorada) que copia sus movimientos; audio original sin cambios.
import cache3d from "../../../public/trabajos/2026-10-06_claudio_cantando-como-robot/datos/cache3d.json";
import type { ComposicionTrabajo } from "../tipos";
import { DURACION, RobotCantando, type RobotCantandoProps } from "./RobotCantando";

const borrador: RobotCantandoProps = {};
// Capa del robot con alfa para la caché (node scripts/capa3d.mjs claudio-cantando-robot-capa <ID>)
const capa: RobotCantandoProps = { soloRobot: true };
// La final monta la capa en caché (sin WebGL en el render)
const final: RobotCantandoProps = { capa: (cache3d as Record<string, string | null>)["claudio-cantando-robot-capa"] };

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-cantando-robot-borrador", component: RobotCantando, durationInFrames: DURACION, defaultProps: borrador, salida: "cantando-como-robot-borrador_9x16" },
  { id: "claudio-cantando-robot-capa", component: RobotCantando, durationInFrames: DURACION, defaultProps: capa, salida: "cantando-como-robot-capa_9x16" },
  { id: "claudio-cantando-robot-final", component: RobotCantando, durationInFrames: DURACION, defaultProps: final, salida: "cantando-como-robot_9x16" },
];
