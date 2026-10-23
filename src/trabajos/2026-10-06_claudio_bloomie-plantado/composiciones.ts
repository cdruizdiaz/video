// Trabajo 2026-10-06_claudio_bloomie-plantado — Bloomie 3D cuenta un chiste en inglés ("I'm planted!"), 8,5 s, 9:16.
// Reusa el escenario de 2026-10-06_claudio_bloomie-toma-vida (BloomieTomaVida.tsx, con subtítulos). Kit de
// expresiones de ChatGPT (C:/Videos/crudos/<ID>/kit_expresiones_v2.png → recortar_kit.py), voces Piper + Rhubarb
// (scripts/voz.mjs), tiempos en datos/coreografia.json (→ armar_escena.mjs; caras.py; preparar_audio.mjs) y Blender
// (scripts/blender/render.mjs → capa en cache3d/).
import animacion from "../../../public/trabajos/2026-10-06_claudio_bloomie-plantado/datos/animacion.json";
import cache3d from "../../../public/trabajos/2026-10-06_claudio_bloomie-plantado/datos/cache3d.json";
import coreografia from "../../../public/trabajos/2026-10-06_claudio_bloomie-plantado/datos/coreografia.json";
import escena from "../../../public/trabajos/2026-10-06_claudio_bloomie-plantado/datos/escena_extra.json";
import subtitulos from "../../../public/trabajos/2026-10-06_claudio_bloomie-plantado/datos/subtitulos.json";
import type { PersonajeRigProps } from "../../plantillas/PersonajeRig/PersonajeRig";
import { BloomieTomaVida, type BloomieTomaVidaProps } from "../2026-10-06_claudio_bloomie-toma-vida/BloomieTomaVida";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-10-06_claudio_bloomie-plantado";
const IMG = `trabajos/${ID}/img`;
const props: BloomieTomaVidaProps = {
  capa: (cache3d as Record<string, string>)["plantado"] ?? "",
  audio: `trabajos/${ID}/audio/mezcla.wav`,
  rig: animacion as PersonajeRigProps,
  coreo: { ...coreografia, giro: { inicio: 0, fin: 0, tramo: [0, 1] } },
  brillo: escena.luz.intensidad.map((v: number) => v / coreografia.luz.intensidad),
  rotY: escena.rotY,
  imagenes: {
    petalo_naranja: `${IMG}/particula_petalo_naranja.png`,
    petalo_turquesa: `${IMG}/particula_petalo_turquesa.png`,
    destello: `${IMG}/particula_destello.png`,
  },
  subtitulos,
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-bloomie-plantado-9x16", component: BloomieTomaVida, durationInFrames: coreografia.duracion, defaultProps: props, salida: "bloomie-plantado_9x16" },
];
