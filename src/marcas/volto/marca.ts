import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadDancing } from "@remotion/google-fonts/DancingScript";
import { Easing } from "remotion";
import type { Marca } from "../tipos";
import { cargarFuentesVolto, NEW_BLACK, NOSTALGIC } from "./fuentes";

// Identidad tomada de volto.dev (variables CSS del sitio, 2026-09-28).
// Tipografías del sitio: "New Black" (títulos, comercial, no está en Google Fonts),
// Geist (texto) y "Nostalgic Memories" (manuscrita, p. ej. "personas." del banner).
// Desde 2026-10-06 el cliente pasó New Black y Nostalgic Memories (public/marcas/volto/fuentes/):
// títulos y subtítulos en New Black, acentos en Nostalgic Memories; Geist queda para texto corrido.
// (Antes: Geist en 800 para títulos y Dancing Script como reemplazo de la manuscrita.)
const { fontFamily: geist } = loadGeist("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
loadDancing("normal", { weights: ["600", "700"], subsets: ["latin"] }); // respaldo de la manuscrita
const dancing = "Dancing Script";
cargarFuentesVolto();

export const volto: Marca = {
  id: "volto",
  firma: "VOLTO",
  fuente: geist,
  fuenteTitulos: `"${NEW_BLACK}", ${geist}`,
  fuenteManuscrita: `"${NOSTALGIC}", "${dancing}"`,
  colores: {
    fondo: "#faf8f5", // --background
    tinta: "#1e1c19", // --foreground (la paleta del cliente dice #262626)
    tintaSuave: "#7d7870", // --conversation-customer-general-fg
    oscuro: "#0e2224", // .dark --background (verde petróleo casi negro)
    claro: "#f5f5ed", // --text-light (mismo tono que el logo)
    acento: "#f97d55", // --accent-orange
    acentoSuave: "#406162", // --primary (verde petróleo)
  },
  // Paleta enviada por el cliente (2026-10-06): #262626 #f5f5ed #a0c9cb #ebdbb7 #3a412f #382a0a y el
  // degradé #f5f5ed → #f97d55 → #95a8a0 → #406162 → #262626 (lo usa el cierre "degradé" de HablaSubtitulada).
  ease: Easing.bezier(0.33, 1, 0.68, 1), // curva de las animaciones del sitio
  margen: 90,
  logo: "marcas/volto/logo.png", // asterisco + VOLTO, claro sobre transparente
  logoFiltroSobreClaro: "brightness(0.12)",
  logoFiltroSobreOscuro: "none",
};
