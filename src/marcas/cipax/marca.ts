import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadDmSans } from "@remotion/google-fonts/DMSans";
import { Easing } from "remotion";
import type { Marca } from "../tipos";
import LOGO from "./logo.json";

// Identidad de Cipax Digital Solutions (rebranding 2025). Fuente: Manual de marca_.pdf del cliente
// (Clientes/Cipax/Identidad Visual). Paleta principal: oscuro #212529, azul #2667FF, blanco; secundarios:
// gris #343A40 y acentos violeta #B517FF, turquesa #00CFC1 y menta #10FFCB (solo para detalles, nunca en el logo).
// Tipografías: Montserrat Bold (títulos), Montserrat Medium (subtítulos / 2ª jerarquía), DM Sans Regular (texto).
// Logo vectorizado en logo.json con src/marcas/cipax/extraer_logo.py (isotipo de 3 piezas + letras + rombo azul).
// Recursos: degradados azul↔oscuro, trama de isotipos (trama.png) y la "figura de isotipo a gran escala" (el tilde).
const { fontFamily: montserrat } = loadMontserrat("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});
const { fontFamily: dmSans } = loadDmSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const CIPAX_MONTSERRAT = montserrat;
export const CIPAX_DMSANS = dmSans;

export const CIPAX_OSCURO = "#212529";
export const CIPAX_AZUL = "#2667FF";
export const CIPAX_BLANCO = "#FFFFFF";
export const CIPAX_GRIS = "#343A40";
export const CIPAX_VIOLETA = "#B517FF";
export const CIPAX_TURQUESA = "#00CFC1";
export const CIPAX_MENTA = "#10FFCB";
export const CIPAX_AZUL_PROFUNDO = "#0B1E5B"; // sombra del degradado azul→oscuro del manual (tapa y fondos)

export type LogoCipax = {
  ancho: number;
  alto: number;
  desplaza: [number, number];
  isotipo: { d: string; azul: boolean; caja: number[] }[]; // cuadrado, trazo oscuro, trazo azul
  letras: { d: string; caja: number[] }[]; // C, I, P, A, X (abajo), X (arriba)
  rombo: { d: string; caja: number[] };
};
export const LOGO_CIPAX = LOGO as unknown as LogoCipax;

// Curva de movimiento de la marca: expo in-out, como las referencias de transiciones (arranque y llegada suaves, medio rápido)
export const CIPAX_EASE = Easing.bezier(0.83, 0, 0.17, 1);
export const CIPAX_SALIDA = Easing.bezier(0.16, 1, 0.3, 1); // expo out: entradas que frenan suave

export const cipax: Marca = {
  id: "cipax",
  firma: "CIPAX",
  fuente: dmSans,
  fuenteTitulos: montserrat,
  colores: {
    fondo: CIPAX_BLANCO,
    tinta: CIPAX_OSCURO,
    tintaSuave: CIPAX_GRIS,
    oscuro: CIPAX_OSCURO,
    claro: CIPAX_BLANCO,
    acento: CIPAX_AZUL,
    acentoSuave: CIPAX_MENTA,
  },
  ease: CIPAX_SALIDA,
  margen: 90,
  logo: "marcas/cipax/logo-oscuro.png",
  logoFiltroSobreClaro: "none",
  logoFiltroSobreOscuro: "brightness(0) invert(1)",
};
