// Trabajo 2026-09-29_claudio_musica — reel "Música en familia" (plantilla MontajeMusical).
import {
  duracionMontajeMusical,
  MontajeMusical,
  type MontajeMusicalProps,
  type TomaMusical,
} from "../../plantillas/MontajeMusical/MontajeMusical";
import { lineaMontajeMusical } from "../../plantillas/MontajeMusical/premiere";
import montaje from "../../../public/trabajos/2026-09-29_claudio_musica/datos/clips.json";
import encuadre from "../../../public/trabajos/2026-09-29_claudio_musica/datos/encuadre.json";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-09-29_claudio_musica";

// clips.json: tramos, ganancias y años; encuadre.json: zoom y centro sobre las caras (encuadre.py)
const tomas: TomaMusical[] = (montaje.tomas as (typeof montaje.tomas[number] & { etiqueta?: string })[]).map((t) => ({
  clip: t.clip,
  desdeMs: t.desdeMs,
  hastaMs: t.hastaMs,
  gananciaDb: t.gananciaDb,
  etiqueta: t.etiqueta,
  encuadre: (encuadre as Record<string, TomaMusical["encuadre"]>)[`${t.clip}@${t.desdeMs}`],
}));

const reel30: MontajeMusicalProps = {
  carpetaVideos: `trabajos/${ID}/crudos`,
  tomas,
  titulo: ["Música", "en familia"],
  // v4: sin años (los videos de WhatsApp no tienen fecha); v3: subtexto "2023 · 2024"
  cierre: { texto: "La música nos une", duracion: 80 },
  apariencia: "sutil", // v3+: títulos y notas sutiles (v1-v2: "sticker")
  whoosh: "biblioteca/sfx/mixkit/mixkit-1492-cinematic-whoosh-fast-transition.wav",
  whooshDb: -20,
  estilo: { primario: "#FFD23F", secundario: "#FF6B8B", tinta: "#1B1B2F", claro: "#FFFFFF" },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "claudio-musica-reel30", // desde v4 dura 40 s; se mantiene el ID para no romper el historial
    component: MontajeMusical,
    durationInFrames: duracionMontajeMusical(reel30),
    defaultProps: reel30,
    salida: "reel-40s_9x16", // v1-v3: "reel-30s_9x16"
    premiere: lineaMontajeMusical,
  },
];
