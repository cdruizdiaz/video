// Tipografías del CTPSFPC (archivos del cliente en public/marcas/ctpsfpc/fuentes/, 2026-10-25).
// Según el Social Media Playbook 2026: titulares Almarai ExtraBold 800, subtítulos Be Vietnam Pro SemiBold,
// cuerpo Be Vietnam Pro Regular. Se cargan con FontFace y el render espera a que estén listas.
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const BE_VIETNAM = "Be Vietnam Pro CTPSFPC";
export const ALMARAI = "Almarai CTPSFPC";

const ARCHIVOS: { familia: string; archivo: string; peso: string }[] = [
  { familia: BE_VIETNAM, archivo: "BeVietnamPro-Regular.ttf", peso: "400" },
  { familia: BE_VIETNAM, archivo: "BeVietnamPro-Medium.ttf", peso: "500" },
  { familia: BE_VIETNAM, archivo: "BeVietnamPro-SemiBold.ttf", peso: "600" },
  { familia: BE_VIETNAM, archivo: "BeVietnamPro-Bold.ttf", peso: "700" },
  { familia: ALMARAI, archivo: "Almarai-Regular.ttf", peso: "400" },
  { familia: ALMARAI, archivo: "Almarai-Bold.ttf", peso: "700" },
  { familia: ALMARAI, archivo: "Almarai-ExtraBold.ttf", peso: "800" },
];

let cargadas = false;
export const cargarFuentesCtpsfpc = () => {
  if (cargadas || typeof document === "undefined") return;
  cargadas = true;
  const espera = delayRender("fuentes del CTPSFPC");
  Promise.all(
    ARCHIVOS.map(async ({ familia, archivo, peso }) => {
      const f = new FontFace(familia, `url("${staticFile(`marcas/ctpsfpc/fuentes/${archivo}`)}")`, { weight: peso });
      await f.load();
      document.fonts.add(f);
    }),
  )
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
};
