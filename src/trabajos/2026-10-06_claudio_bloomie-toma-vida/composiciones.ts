// Trabajo 2026-10-06_claudio_bloomie-toma-vida — Bloomie 3D "toma vida", 5 s, 9:16 (demo de calidad 3D).
// Kit del diseñador (C:/Videos/crudos/<ID>/kit_bloomie_3d.png → recortar_kit.py), tiempos en datos/coreografia.json
// (→ armar_escena.mjs → animacion.json + escena_extra.json; caras.py; preparar_audio.mjs), Blender
// (scripts/blender/render.mjs → capa en cache3d/) y escenario, reflejo, partículas y logo en BloomieTomaVida.tsx.
import animacion from "../../../public/trabajos/2026-10-06_claudio_bloomie-toma-vida/datos/animacion.json";
import cache3d from "../../../public/trabajos/2026-10-06_claudio_bloomie-toma-vida/datos/cache3d.json";
import coreografia from "../../../public/trabajos/2026-10-06_claudio_bloomie-toma-vida/datos/coreografia.json";
import escena from "../../../public/trabajos/2026-10-06_claudio_bloomie-toma-vida/datos/escena_extra.json";
import type { PersonajeRigProps } from "../../plantillas/PersonajeRig/PersonajeRig";
import type { ComposicionTrabajo } from "../tipos";
import { BloomieTomaVida, type BloomieTomaVidaProps } from "./BloomieTomaVida";

const ID = "2026-10-06_claudio_bloomie-toma-vida";
const IMG = `trabajos/${ID}/img`;
const props: BloomieTomaVidaProps = {
  capa: (cache3d as Record<string, string>)["toma-vida"] ?? "",
  audio: `trabajos/${ID}/audio/mezcla.wav`,
  rig: animacion as PersonajeRigProps,
  coreo: coreografia,
  brillo: escena.luz.intensidad.map((v: number) => v / coreografia.luz.intensidad),
  rotY: escena.rotY,
  imagenes: {
    petalo_naranja: `${IMG}/particula_petalo_naranja.png`,
    petalo_turquesa: `${IMG}/particula_petalo_turquesa.png`,
    destello: `${IMG}/particula_destello.png`,
  },
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-bloomie-toma-vida-9x16", component: BloomieTomaVida, durationInFrames: coreografia.duracion, defaultProps: props, salida: "bloomie-toma-vida_9x16" },
];
