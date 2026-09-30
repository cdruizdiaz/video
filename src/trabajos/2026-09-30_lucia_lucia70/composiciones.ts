// Trabajo 2026-09-30_lucia_lucia70 — reel "Lucía · 70 años": la niña de la guitarra (plantilla MontajeMusical).
import {
  duracionMontajeMusical,
  MontajeMusical,
  type MontajeMusicalProps,
  type TomaMusical,
} from "../../plantillas/MontajeMusical/MontajeMusical";
import montaje from "../../../public/trabajos/2026-09-30_lucia_lucia70/datos/clips.json";
import encuadre from "../../../public/trabajos/2026-09-30_lucia_lucia70/datos/encuadre.json";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-09-30_lucia_lucia70";
const ANCHO_FUENTE = 2560; // el crudo es 4:3: a 1920 de alto mide 2560 de ancho y el encuadre lo recorre entero

// clips.json: tramos (seguidos, para no cortar la canción) y zoom de cada plano;
// encuadre.json: centro que sigue a la niña por su remera roja (encuadre.py)
const tomas: TomaMusical[] = montaje.tomas.map((t) => ({
  clip: t.clip,
  desdeMs: t.desdeMs,
  hastaMs: t.hastaMs,
  gananciaDb: t.gananciaDb,
  anchoFuente: ANCHO_FUENTE,
  encuadre: (encuadre as Record<string, TomaMusical["encuadre"]>)[`${t.clip}@${t.desdeMs}`],
}));

const guitarra15: MontajeMusicalProps = {
  carpetaVideos: `trabajos/${ID}/crudos`,
  tomas,
  titulo: ["Lucía", "70 años"],
  cierre: { texto: "¡Feliz cumpleaños!", duracion: 75 },
  apariencia: "sutil",
  filtroVideo: "brightness(1.18) saturate(1.12)", // la niña está a contraluz
  // sin whoosh: los cortes son cambios de plano sobre la misma toma y la canción sigue de corrido
  estilo: { primario: "#FFD23F", secundario: "#FF6B8B", tinta: "#1B1B2F", claro: "#FFFFFF" },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "lucia-lucia70-guitarra15",
    component: MontajeMusical,
    durationInFrames: duracionMontajeMusical(guitarra15),
    defaultProps: guitarra15,
    salida: "guitarra-15s_9x16",
    // sin `premiere`: la exportación todavía no contempla anchoFuente (crudo 4:3 recorrido entero)
  },
];
