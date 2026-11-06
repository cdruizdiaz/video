// Trabajo 2026-10-23_rastro_placa-cierre — placa de cierre de los reels de RASTRO (plantilla PlacaRastro):
// el logo se dibuja, la figurita de la "A" asoma y asiente, y entra "Menos ruido. Más historias.". Muda, 3 s,
// 9:16. Una composición por combinación de colores (fondo / logo), con la paleta de la marca.
import { paletaRastro } from "../../marcas/rastro/marca";
import {
  DURACION_PLACA,
  PlacaRastro,
  type PlacaRastroProps,
} from "../../plantillas/PlacaRastro/PlacaRastro";
import type { ComposicionTrabajo } from "../tipos";

// [variante, props] — para sumar un color, agregar una fila
// Entrada elegida el 2026-10-23: "dibuja" (el logo se dibuja entero a la vez; el eslogan, en dos tiempos).
// "sube" y "revela" siguen en la plantilla.
// fondos claros: logo negro y figurita en positivo; fondos oscuros o de color: logo y eslogan todo blancos
// (2026-10-23: "para las que el fondo te permita, usá el logo todo blanco")
const BLANCO = "#ffffff";
const claro = (fondo: string): PlacaRastroProps => ({
  fondo,
  tinta: paletaRastro.tinta,
  logoClaro: false,
  entrada: "dibuja",
});
const oscuro = (fondo: string): PlacaRastroProps => ({
  fondo,
  tinta: BLANCO,
  logoClaro: true,
  entrada: "dibuja",
});
const VARIANTES: [string, PlacaRastroProps][] = [
  ["papel", claro(paletaRastro.papel)],
  ["crema", claro(paletaRastro.crema)],
  ["negro", oscuro(paletaRastro.tinta)],
  ["petroleo", oscuro(paletaRastro.petroleo)],
  ["bordo", oscuro(paletaRastro.bordo)],
  ["turquesa", oscuro(paletaRastro.turquesa)],
];

export const composiciones: ComposicionTrabajo[] = VARIANTES.map(
  ([variante, props]): ComposicionTrabajo => ({
    id: `rastro-placa-cierre-${variante}`,
    component: PlacaRastro,
    durationInFrames: DURACION_PLACA,
    defaultProps: props,
    salida: `placa-cierre-${variante}_9x16`,
  }),
);
