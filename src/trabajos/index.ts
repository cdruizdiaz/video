// Registro de trabajos. /nuevo-trabajo agrega aquí cada trabajo nuevo.
import { composiciones as rastroHistoriaIg } from "./2026-09-28_rastro_historia-ig/composiciones";
import { composiciones as voltoIa2026 } from "./2026-09-28_volto_ia2026/composiciones";
import { composiciones as claudioMusica } from "./2026-09-29_claudio_musica/composiciones";
import { composiciones as luciaLucia70 } from "./2026-09-30_lucia_lucia70/composiciones";
import type { Trabajo } from "./tipos";

export const TRABAJOS: Trabajo[] = [
  { id: "2026-09-28_rastro_historia-ig", composiciones: rastroHistoriaIg },
  { id: "2026-09-28_volto_ia2026", composiciones: voltoIa2026 },
  { id: "2026-09-29_claudio_musica", composiciones: claudioMusica },
  { id: "2026-09-30_lucia_lucia70", composiciones: luciaLucia70 },
];
