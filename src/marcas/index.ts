import { animana } from "./animana/marca";
import { bloomie } from "./bloomie/marca";
import { cei } from "./cei/marca";
import { laencina } from "./laencina/marca";
import { rastro } from "./rastro/marca";
import { volto } from "./volto/marca";
import type { Marca } from "./tipos";

// Registro de marcas disponibles. Para sumar un cliente: crear src/marcas/<id>/marca.ts,
// poner sus archivos en public/marcas/<id>/ y agregarlo acá.
export const MARCAS: Record<string, Marca> = { animana, bloomie, cei, laencina, rastro, volto };

export type { Marca } from "./tipos";
export { conAlfa } from "./tipos";
