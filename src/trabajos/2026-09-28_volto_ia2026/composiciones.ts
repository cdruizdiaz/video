// Trabajo 2026-09-28_volto_ia2026 — "¿Qué hace realmente un agente de IA en 2026?" (plantilla HablaSubtitulada).
import {
  duracionHablaSubtitulada,
  HablaSubtitulada,
  type HablaSubtituladaProps,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import montaje from "../../../public/trabajos/2026-09-28_volto_ia2026/datos/clips.json";
import transcripcion from "../../../public/trabajos/2026-09-28_volto_ia2026/datos/transcripcion.json";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-09-28_volto_ia2026";
const DURACION_TOTAL = 40 * 30; // 40 s: el cierre ocupa lo que dejan las tomas

const base: Omit<HablaSubtituladaProps, "cierre"> = {
  marca: "volto",
  carpetaVideos: `trabajos/${ID}/crudos`,
  tomas: montaje.tomas, // datos/clips.json: orden, tramos, ganancias y zooms
  transcripcion, // datos/transcripcion.json (corregir_transcripcion.mjs)
  velocidad: 1.055, // 41 s de habla -> 38,8 s; imperceptible y deja lugar al cierre
  // Mixkit "Digital Clouds" (id 175), tramo 0–40 s: preparar_musica.sh
  musica: `trabajos/${ID}/audio/musica-40s.wav`,
  musicaBajoVozDb: -21, // música a -14 LUFS -> ~-35 bajo una voz de -18: ~17 dB por debajo
  musicaCierreDb: -8,
};

const ia2026: HablaSubtituladaProps = {
  ...base,
  cierre: {
    frase: "IA con foco humano",
    sitio: "volto.dev",
    duracion: DURACION_TOTAL - duracionHablaSubtitulada({ ...base, cierre: { frase: "", sitio: "", duracion: 0 } }),
  },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "volto-ia2026-40s",
    component: HablaSubtitulada,
    durationInFrames: duracionHablaSubtitulada(ia2026),
    defaultProps: ia2026,
    salida: "ia2026-40s_9x16",
  },
];
