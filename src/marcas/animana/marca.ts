import { Easing } from "remotion";
import type { Marca } from "../tipos";
import {
  ANIMANA_DIDOT,
  ANIMANA_GOTHAM,
  cargarFuentesAnimana,
} from "./fuentes";

// Identidad de animaná (marca de ropa de fibras naturales de la Patagonia y los Andes). Fuente: Brand Manual
// de Tenere (2026-10-14). Colores: taupe Pantone 404 U (principal oscuro), marrón Pantone 7554 C (secundario
// oscuro, cuando el taupe no se lee) y blanco; el logo solo va en taupe o blanco. El "hueso" es el fondo del
// cierre que pidió el cliente (no está en el manual).
cargarFuentesAnimana();

export const ANIMANA_TAUPE = "#8c8070";
export const ANIMANA_MARRON = "#3d2b12";
export const ANIMANA_HUESO = "#efe9dc";

export const animana: Marca = {
  id: "animana",
  firma: "animaná",
  fuente: ANIMANA_GOTHAM,
  fuenteTitulos: ANIMANA_DIDOT,
  colores: {
    fondo: ANIMANA_HUESO,
    tinta: ANIMANA_MARRON,
    tintaSuave: ANIMANA_TAUPE,
    oscuro: ANIMANA_MARRON,
    claro: "#ffffff",
    acento: ANIMANA_TAUPE,
  },
  ease: Easing.bezier(0.33, 1, 0.68, 1),
  margen: 90,
  logo: "marcas/animana/logo-taupe.png", // "animaná" con sol y luna, taupe sobre transparente
  logoFiltroSobreClaro: "none",
  logoFiltroSobreOscuro: "brightness(0) invert(1)", // blanco sobre fondo oscuro
};
