// Tipografías propias de Volto (archivos del cliente en public/marcas/volto/fuentes/, 2026-10-06).
// No están en Google Fonts: se cargan con FontFace y el render espera a que estén listas.
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const NEW_BLACK = "New Black";
export const NOSTALGIC = "Nostalgic Memories";

const ARCHIVOS: { familia: string; archivo: string; peso: string }[] = [
  { familia: NEW_BLACK, archivo: "NewBlackTypeface-Regular.woff2", peso: "400" },
  { familia: NEW_BLACK, archivo: "NewBlackTypeface-Medium.woff2", peso: "500" },
  { familia: NEW_BLACK, archivo: "NewBlackTypeface-SemiBold.woff2", peso: "600" },
  { familia: NEW_BLACK, archivo: "NewBlackTypeface-Bold.woff2", peso: "700" },
  { familia: NEW_BLACK, archivo: "NewBlackTypeface-ExtraBold.woff2", peso: "800" },
  { familia: NOSTALGIC, archivo: "Nostalgic Memories Regular 1.ttf", peso: "400" },
];

let cargadas = false;
export const cargarFuentesVolto = () => {
  if (cargadas || typeof document === "undefined") return;
  cargadas = true;
  const espera = delayRender("fuentes de Volto");
  Promise.all(
    ARCHIVOS.map(async ({ familia, archivo, peso }) => {
      const f = new FontFace(familia, `url("${staticFile(`marcas/volto/fuentes/${archivo}`)}")`, { weight: peso });
      await f.load();
      document.fonts.add(f);
    }),
  )
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
};
