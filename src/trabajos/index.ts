// Registro de trabajos. /nuevo-trabajo agrega aquí cada trabajo nuevo.
import { composiciones as rastroHistoriaIg } from "./2026-09-28_rastro_historia-ig/composiciones";
import { composiciones as rastroManifiesto } from "./2026-10-01_rastro_manifiesto/composiciones";
import { composiciones as voltoIa2026 } from "./2026-09-28_volto_ia2026/composiciones";
import type { Trabajo } from "./tipos";

export const TRABAJOS: Trabajo[] = [
  { id: "2026-09-28_rastro_historia-ig", composiciones: rastroHistoriaIg },
  { id: "2026-09-28_volto_ia2026", composiciones: voltoIa2026 },
  { id: "2026-10-01_rastro_manifiesto", composiciones: rastroManifiesto },
];
