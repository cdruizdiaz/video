import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { Easing } from "remotion";
import type { Marca } from "../tipos";
import { cargarFuentesCei, FILSON } from "./fuentes";

// Identidad tomada del Manual de Marca del CEI (Centro de Enseñanza de Inglés, Mariana G. Puygros), 2026-10-15.
// Paleta: Royal Blue #0d3053 · Sky blue #5fb7ce · Charcoal #071b2b · Bone #ffede1 · Wine #6d1414 ·
// Pumpkin #dc7b26 · August #ef913c · Cinnamon #bc7208. Mascota: Bloomie (flor naranja con anteojos).
// Tipografías del manual: New Spirit (títulos serif) y Filson Pro (texto). New Spirit no está entre los archivos
// que mandó el cliente: para los títulos se usa Fraunces (serif cálida de Google Fonts) hasta que la manden.
const { fontFamily: fraunces } = loadFraunces("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
cargarFuentesCei();

export const PALETA_CEI = {
  royal: "#0d3053",
  cielo: "#5fb7ce",
  carbon: "#071b2b",
  hueso: "#ffede1",
  vino: "#6d1414",
  calabaza: "#dc7b26",
  agosto: "#ef913c",
  canela: "#bc7208",
};

export const cei: Marca = {
  id: "cei",
  firma: "CEI",
  fuente: `"${FILSON}", sans-serif`,
  fuenteTitulos: `${fraunces}, serif`,
  colores: {
    fondo: PALETA_CEI.hueso,
    tinta: PALETA_CEI.vino,
    tintaSuave: PALETA_CEI.royal,
    oscuro: PALETA_CEI.vino,
    claro: PALETA_CEI.hueso,
    acento: PALETA_CEI.calabaza,
    acentoSuave: PALETA_CEI.agosto,
  },
  ease: Easing.bezier(0.33, 1, 0.68, 1),
  margen: 90,
  logo: "marcas/cei/logo.png", // logo principal (torre + flor + "Centro de Enseñanza de Inglés"), a color, sobre transparente
  logoFiltroSobreClaro: "none",
  logoFiltroSobreOscuro: "none",
};
