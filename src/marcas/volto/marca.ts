import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadDancing } from "@remotion/google-fonts/DancingScript";
import { Easing } from "remotion";
import type { Marca } from "../tipos";

// Identidad tomada de volto.dev (variables CSS del sitio, 2026-09-28).
// Tipografías del sitio: "New Black" (títulos, comercial, no está en Google Fonts),
// Geist (texto) y "Nostalgic Memories" (manuscrita, p. ej. "personas." del banner).
// Acá: Geist para todo (títulos en 800) y Dancing Script, que es el reemplazo que
// el propio sitio declara para la manuscrita.
const { fontFamily: geist } = loadGeist("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
const { fontFamily: dancing } = loadDancing("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export const volto: Marca = {
  id: "volto",
  firma: "VOLTO",
  fuente: geist,
  fuenteTitulos: geist,
  fuenteManuscrita: dancing,
  colores: {
    fondo: "#faf8f5", // --background
    tinta: "#1e1c19", // --foreground
    tintaSuave: "#7d7870", // --conversation-customer-general-fg
    oscuro: "#0e2224", // .dark --background (verde petróleo casi negro)
    claro: "#f5f5ed", // --text-light (mismo tono que el logo)
    acento: "#f97d55", // --accent-orange
    acentoSuave: "#406162", // --primary (verde petróleo)
  },
  ease: Easing.bezier(0.33, 1, 0.68, 1), // curva de las animaciones del sitio
  margen: 90,
  logo: "marcas/volto/logo.png", // asterisco + VOLTO, claro sobre transparente
  logoFiltroSobreClaro: "brightness(0.12)",
  logoFiltroSobreOscuro: "none",
};
