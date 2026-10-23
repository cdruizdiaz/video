import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { Easing } from "remotion";
import type { Marca } from "../tipos";

// Identidad de La Encina Taller de Filosofía (@laencina.taller). No hay manual de marca: la paleta y las
// tipografías son las que el cliente fijó en el brief de "Eros y Filosofía" (2026-10-13); el logo es la hoja
// de encina del perfil de Instagram (dibujo de línea, public/marcas/laencina/hoja-original.jpeg).
// Pesos de Cormorant: Medium/SemiBold (los finos pierden legibilidad sobre video).
const { fontFamily: cormorant } = loadCormorant("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
loadCormorant("italic", { weights: ["500", "600"], subsets: ["latin"] });
const { fontFamily: montserrat } = loadMontserrat("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const LAENCINA_ORO = "#806936"; // dorado/ocre: detalles, líneas, inglés
export const LAENCINA_OLIVA = "#4E5229"; // verde oliva: fondos secundarios, placas

export const laencina: Marca = {
  id: "laencina",
  firma: "La Encina · Taller de Filosofía",
  fuente: montserrat, // textos de apoyo, inglés, @usuario, fecha
  fuenteTitulos: cormorant, // español y títulos del cierre
  colores: {
    fondo: "#EEE8DA", // crema
    tinta: "#1A1812", // negro cálido
    tintaSuave: LAENCINA_ORO,
    oscuro: "#1A1812",
    claro: "#EEE8DA",
    acento: "#EF382D", // rojo: escaso (fecha, resaltado del @)
    acentoSuave: LAENCINA_OLIVA,
  },
  ease: Easing.bezier(0.33, 1, 0.68, 1), // suave, sin rebote
  margen: 90,
  logo: "marcas/laencina/logo.png", // hoja de encina, crema sobre transparente
  logoFiltroSobreClaro: "brightness(0.1)", // crema -> casi negro cálido
  logoFiltroSobreOscuro: "none",
};
