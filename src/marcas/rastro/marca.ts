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

// Paleta del feed de Instagram (@somos_rastro, portadas medidas el 2026-10-16). Va aparte de `colores`
// para no cambiar las plantillas que ya usan `colores.acento` con esta marca.
export const paletaRastro = {
  papel: "#f7f4ea", // base clara (= colores.fondo)
  crema: "#dbd1bf", // papel kraft / crema de fondos
  tinta: "#0d0d0d", // negro de fondos y texto
  petroleo: "#045e5a", // verde petróleo: fondos completos (Welcome Luco, Marca Personal)
  bordo: "#750d0e", // bordó: fondos, recuadros de palabras, estrellas
  turquesa: "#0f9c9a", // turquesa de los trazos a mano y estrellas: acento chico
} as const;
