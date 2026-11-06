// Tipografías del CEI (archivos del cliente en public/marcas/cei/fuentes/, 2026-10-15).
// Filson Pro no está en Google Fonts: se carga con FontFace y el render espera a que estén listas.
// New Spirit (la de títulos del manual, serif) llegó el 2026-10-30: pesos Light a Heavy.
// REGLA CEI: las tipografías de los gráficos son siempre Filson Pro o New Spirit.
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const FILSON = "Filson Pro";
export const NEW_SPIRIT = "New Spirit";

const ARCHIVOS: { archivo: string; peso: string; estilo?: string }[] = [
  { archivo: "FilsonProBook.otf", peso: "300" },
  { archivo: "FilsonProRegular.otf", peso: "400" },
  { archivo: "FilsonProMedium.otf", peso: "500" },
  { archivo: "FilsonProBold.otf", peso: "700" },
  { archivo: "FilsonProRegularItalic.otf", peso: "400", estilo: "italic" },
];
const ARCHIVOS_NEW_SPIRIT: { archivo: string; peso: string }[] = [
  { archivo: "NewSpiritLight.otf", peso: "300" },
  { archivo: "NewSpiritRegular.otf", peso: "400" },
  { archivo: "NewSpiritMedium.otf", peso: "500" },
  { archivo: "NewSpiritSemiBold.otf", peso: "600" },
  { archivo: "NewSpiritBold.otf", peso: "700" },
  { archivo: "NewSpiritHeavy.otf", peso: "900" },
];

let cargadas = false;
export const cargarFuentesCei = () => {
  if (cargadas || typeof document === "undefined") return;
  cargadas = true;
  const espera = delayRender("fuentes del CEI");
  Promise.all(
    [...ARCHIVOS.map((a) => ({ ...a, familia: FILSON })), ...ARCHIVOS_NEW_SPIRIT.map((a) => ({ ...a, estilo: undefined as string | undefined, familia: NEW_SPIRIT }))].map(async ({ archivo, peso, estilo, familia }) => {
      const f = new FontFace(familia, `url("${staticFile(`marcas/cei/fuentes/${archivo}`)}")`, { weight: peso, style: estilo ?? "normal" });
      await f.load();
      document.fonts.add(f);
    }),
  )
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
};
