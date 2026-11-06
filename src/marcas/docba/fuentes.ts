// Tipografías de DOCBA (archivos del cliente, copiados de Clientes/DOCBA/Fuentes/static el 2026-10-27).
// El manual define Gabriella Heavy (titulares; entregada el 2026-10-30) e IBM Plex Sans
// (secundaria, todas sus variantes). Subtítulos de los reels: IBM Plex Sans SemiBold en blanco.
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";

export const DOCBA_PLEX = "IBM Plex Sans Docba";
export const DOCBA_GABRIELLA = "Gabriella Heavy Docba"; // titulares y nombre DOCBA (Gabriella Heavy, del cliente, 2026-10-30)
export const DOCBA_PLEX_COND = "IBM Plex Sans Condensed Docba"; // subtítulos: Condensed Medium (pedido del cliente, 2026-10-27)

const ARCHIVOS: { archivo: string; peso: number }[] = [
  { archivo: "IBMPlexSans-Regular.ttf", peso: 400 },
  { archivo: "IBMPlexSans-Medium.ttf", peso: 500 },
  { archivo: "IBMPlexSans-SemiBold.ttf", peso: 600 },
  { archivo: "IBMPlexSans-Bold.ttf", peso: 700 },
];

let cargadas = false;
export const cargarFuentesDocba = () => {
  if (cargadas || typeof document === "undefined") return;
  cargadas = true;
  const espera = delayRender("fuentes de DOCBA");
  Promise.all(
    [
      ...ARCHIVOS.map((a) => ({ ...a, familia: DOCBA_PLEX })),
      { familia: DOCBA_PLEX_COND, archivo: "IBMPlexSans_Condensed-Medium.ttf", peso: 500 },
      { familia: DOCBA_GABRIELLA, archivo: "Gabriella-Heavy.otf", peso: 400 },
    ].map(async ({ archivo, peso, familia }) => {
      const f = new FontFace(
        familia,
        `url("${staticFile(`marcas/docba/fuentes/${archivo}`)}")`,
        { weight: String(peso) },
      );
      await f.load();
      document.fonts.add(f);
    }),
  )
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
};
