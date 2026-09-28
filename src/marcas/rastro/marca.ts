import { loadFont } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";
import type { Marca } from "../tipos";

// Identidad tomada de somosrastro.com.ar (variables CSS del sitio)
const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const rastro: Marca = {
  id: "rastro",
  firma: "RASTRO®",
  fuente: fontFamily,
  colores: {
    fondo: "#f7f4ea", // --paper
    tinta: "#0d0d0d", // --ink
    tintaSuave: "#6f6b62", // --ink-soft
    oscuro: "#0c0c0c", // --dark
    claro: "#f7f4ea",
  },
  ease: Easing.bezier(0.16, 1, 0.3, 1), // --ease: cubic-bezier(.16,1,.3,1)
  margen: 90,
  logo: "marcas/rastro/logo.png",
  logoFiltroSobreClaro: "brightness(0.35)",
  logoFiltroSobreOscuro: "invert(1) brightness(2.2)",
};
