// Tipografías de Animaná (archivos del cliente, copiados de Clientes/Animaná/Contenido el 2026-10-14):
//  - Gotham Book: textos, nombres, especificaciones (el manual pide Gotham; solo está la Book).
//  - Didot / Didot Italic: el logo y las citas especiales (el manual: Didot Italic para citas).
// Se cargan con FontFace y el render espera a que estén listas.
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";

export const ANIMANA_GOTHAM = "Gotham Book Animana";
export const ANIMANA_DIDOT = "Didot Animana";
export const ANIMANA_DIDOT_ITALIC = "Didot Italic Animana";

const ARCHIVOS: { familia: string; archivo: string; estilo?: string }[] = [
  { familia: ANIMANA_GOTHAM, archivo: "Gotham-Book.otf" },
  { familia: ANIMANA_DIDOT, archivo: "Didot-Regular.otf" },
  { familia: ANIMANA_DIDOT_ITALIC, archivo: "Didot-Italic.otf", estilo: "italic" },
];

let cargadas = false;
export const cargarFuentesAnimana = () => {
  if (cargadas || typeof document === "undefined") return;
  cargadas = true;
  const espera = delayRender("fuentes de Animaná");
  Promise.all(
    ARCHIVOS.map(async ({ familia, archivo, estilo }) => {
      const f = new FontFace(
        familia,
        `url("${staticFile(`marcas/animana/fuentes/${archivo}`)}")`,
        estilo ? { style: estilo } : undefined,
      );
      await f.load();
      document.fonts.add(f);
    }),
  )
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
};
