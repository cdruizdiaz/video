// Trabajo 2026-11-16_cei_book-of-wishes-placas: placas de cierre de los 4 episodios de "The book of wishes" (CEI).
import type { ComposicionTrabajo } from "../tipos";
import { DURACION, PlacaLibroDeseos, type PropsPlaca } from "./PlacaLibroDeseos";

const EPISODIOS: PropsPlaca[] = [
  { episodio: 1, nombre: "The beginning", siguiente: "Building a dream" },
  { episodio: 2, nombre: "Building a dream", siguiente: "Dear future" },
  { episodio: 3, nombre: "Dear future", siguiente: "The story continues" },
  { episodio: 4, nombre: "The story continues" }, // último: cierra con "The End…"
];

export const composiciones: ComposicionTrabajo[] = EPISODIOS.map((p) => ({
  id: `cei-book-of-wishes-ep${p.episodio}`,
  component: PlacaLibroDeseos,
  durationInFrames: DURACION,
  defaultProps: p,
  salida: `placa-ep${p.episodio}_9x16`,
}));
