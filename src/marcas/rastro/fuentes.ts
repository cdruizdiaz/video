// Tipografías propias de RASTRO (archivos del estudio en public/marcas/rastro/fuentes/, copiados de
// Documents/RASTRO/Tipografía rastro el 2026-10-13):
//  - Rastro Regular: la palabra "RASTRO" (A–Z, a–z y algunas vocales con tilde).
//  - Inter Black: las palabras grandes de las piezas animadas. Se carga el archivo local (no el de Google Fonts)
//    para que las medidas de cada letra coincidan con las del archivo del estudio.
// El resto de los textos va en Inter de Google Fonts (`rastro.fuente`). Se cargan con FontFace y el render
// espera a que estén listas.
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";

export const RASTRO_FUENTE = "Rastro";
export const INTER_BLACK = "Inter Black RASTRO";

const ARCHIVOS: { familia: string; archivo: string; peso: string }[] = [
  { familia: RASTRO_FUENTE, archivo: "Rastro-Regular.ttf", peso: "400" },
  { familia: INTER_BLACK, archivo: "Inter-Black.ttf", peso: "900" },
];

let cargadas = false;
export const cargarFuenteRastro = () => {
  if (cargadas || typeof document === "undefined") return;
  cargadas = true;
  const espera = delayRender("fuentes de RASTRO");
  Promise.all(
    ARCHIVOS.map(async ({ familia, archivo, peso }) => {
      const f = new FontFace(
        familia,
        `url("${staticFile(`marcas/rastro/fuentes/${archivo}`)}")`,
        { weight: peso },
      );
      await f.load();
      document.fonts.add(f);
    }),
  )
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
};
