import { rastro } from "./rastro/marca";
import type { Marca } from "./tipos";

// Registro de marcas disponibles. Para sumar un cliente: crear src/marcas/<id>/marca.ts,
// poner sus archivos en public/marcas/<id>/ y agregarlo acá.
export const MARCAS: Record<string, Marca> = { rastro };

export type { Marca } from "./tipos";
export { conAlfa } from "./tipos";
