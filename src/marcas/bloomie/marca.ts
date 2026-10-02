import { loadFont } from "@remotion/google-fonts/Fredoka";
import { Easing } from "remotion";
import type { DatosPersonaje } from "../../plantillas/PersonajeAnimado/Personaje";
import personaje from "../../../public/marcas/bloomie/personaje.json";
import type { Marca } from "../tipos";

// Identidad tomada de la hoja de personaje Bloomie.ai (public/marcas/bloomie/Bloomie.ai).
// Personaje animable: src/marcas/bloomie/extraer_personaje.py → public/marcas/bloomie/personaje.json
const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

// Paleta del personaje (colores exactos de los trazos del .ai)
export const PALETA_BLOOMIE = {
  naranja: "#ef913c", // cara
  petalo: "#dc7b26", // pétalos
  petaloClaro: "#ea8021",
  borde: "#bc7208", // contorno naranja oscuro
  bordeOscuro: "#b55c1a",
  anteojos: "#5fb7ce", // celeste de los anteojos
  tinta: "#150b09", // ojos y boca
  rosa: "#ffa1eb", // corazones (cara enamorada)
  verdeBruja: "#9be565",
  violetaBruja: "#6b3180",
  rojoNavidad: "#e6292a",
};

// Caras disponibles en personaje.json (las de temporada traen su accesorio puesto)
export const CARAS_BLOOMIE = [
  "normal",
  "feliz",
  "preocupado",
  "guino",
  "enojado",
  "triste",
  "enamorado",
  "birrete",
  "navidad",
  "reno",
  "murcielago",
  "bruja",
] as const;
export type CaraBloomie = (typeof CARAS_BLOOMIE)[number];

export const PERSONAJE_BLOOMIE = personaje as unknown as DatosPersonaje;

export const bloomie: Marca = {
  id: "bloomie",
  firma: "Bloomie",
  fuente: fontFamily,
  colores: {
    fondo: "#fff6ea", // crema cálido
    tinta: "#3b2418", // marrón de los textos y globos de la plantilla PersonajeAnimado
    tintaSuave: "#8a6a55",
    oscuro: "#2a1a12",
    claro: "#fff6ea",
    acento: PALETA_BLOOMIE.naranja,
    acentoSuave: PALETA_BLOOMIE.anteojos,
  },
  ease: Easing.bezier(0.34, 1.56, 0.64, 1), // con rebote, como se mueve el personaje
  margen: 80,
  logo: "marcas/bloomie/logo.png",
  logoFiltroSobreClaro: "none",
  logoFiltroSobreOscuro: "none",
};
