// Tipografías del CEI (archivos del cliente en public/marcas/cei/fuentes/, 2026-10-15).
// Filson Pro no está en Google Fonts: se carga con FontFace y el render espera a que estén listas.
// New Spirit (la de títulos del manual) no vino en la carpeta del cliente: ver `TITULOS_CEI` en marca.ts.
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const FILSON = "Filson Pro";

const ARCHIVOS: { archivo: string; peso: string }[] = [
  { archivo: "FilsonProBook.otf", peso: "300" },
  { archivo: "FilsonProRegular.otf", peso: "400" },
  { archivo: "FilsonProMedium.otf", peso: "500" },
  { archivo: "FilsonProBold.otf", peso: "700" },
];

let cargadas = false;
export const cargarFuentesCei = () => {
  if (cargadas || typeof document === "undefined") return;
  cargadas = true;
  const espera = delayRender("fuentes del CEI");
  Promise.all(
    ARCHIVOS.map(async ({ archivo, peso }) => {
      const f = new FontFace(FILSON, `url("${staticFile(`marcas/cei/fuentes/${archivo}`)}")`, { weight: peso });
      await f.load();
      document.fonts.add(f);
    }),
  )
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
};
