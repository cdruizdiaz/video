// Trabajo 2026-10-06_rastro_bloomie-plantada — "Bloomie — Planted", 8,5 s, 9:16 (guion_bloomie-plantada.md).
// Kit de caras de ChatGPT (C:/Videos/crudos/<ID>/kit_plantada.png → recortar_kit.py), voces Piper (voz.mjs), tiempos y
// poses (armar_escena.mjs → datos/*.json), cara cuadro a cuadro (caras.py), Blender (scripts/blender/render.mjs → capa
// en cache3d/), mezcla (preparar_audio.mjs) y escenario + subtítulos + firma en BloomiePlantada.tsx.
import cache3d from "../../../public/trabajos/2026-10-06_rastro_bloomie-plantada/datos/cache3d.json";
import plan from "../../../public/trabajos/2026-10-06_rastro_bloomie-plantada/datos/plantada.json";
import type { ComposicionTrabajo } from "../tipos";
import { BloomiePlantada, type BloomiePlantadaProps } from "./BloomiePlantada";

const ID = "2026-10-06_rastro_bloomie-plantada";
const props: BloomiePlantadaProps = {
  capa: (cache3d as Record<string, string>)["bloomie-plantada"] ?? "",
  audio: `trabajos/${ID}/audio/mezcla.wav`,
  pies: plan.pies,
  subtitulos: plan.subtitulos,
  kit: `trabajos/${ID}/img/kit`,
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "rastro-bloomie-plantada-9x16", component: BloomiePlantada, durationInFrames: plan.duracion, defaultProps: props, salida: "bloomie-plantada_9x16" },
];
