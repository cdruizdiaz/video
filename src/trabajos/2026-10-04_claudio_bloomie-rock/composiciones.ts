// Trabajo 2026-10-04_claudio_bloomie-rock — Bloomie 3D bailando rock, 8 s, 9:16.
// Kit rock del diseñador (C:/Videos/crudos/<ID>/kit_rock.png → recortar_kit.py), coreografía en
// datos/coreografia.json (→ armar_escena.mjs → animacion.json + escena_extra.json), cara (caras_rock.py), Blender
// (scripts/blender/render.mjs → capa en cache3d/) y escenario + música en BloomieRock.tsx.
import animacion from "../../../public/trabajos/2026-10-04_claudio_bloomie-rock/datos/animacion.json";
import cache3d from "../../../public/trabajos/2026-10-04_claudio_bloomie-rock/datos/cache3d.json";
import coreografia from "../../../public/trabajos/2026-10-04_claudio_bloomie-rock/datos/coreografia.json";
import type { PersonajeRigProps } from "../../plantillas/PersonajeRig/PersonajeRig";
import type { ComposicionTrabajo } from "../tipos";
import { BloomieRock, type BloomieRockProps } from "./BloomieRock";

const ID = "2026-10-04_claudio_bloomie-rock";
const rock: BloomieRockProps = {
  capa: (cache3d as Record<string, string>)["bloomie-rock"] ?? "",
  musica: `trabajos/${ID}/audio/rock_8s.wav`,
  rig: animacion as PersonajeRigProps,
  pulso: coreografia.pulso,
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-bloomie-rock-9x16", component: BloomieRock, durationInFrames: coreografia.duracion, defaultProps: rock, salida: "bloomie-rock_9x16" },
];
