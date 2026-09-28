import { loadFont } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";

// Identidad tomada de somosrastro.com.ar (variables CSS del sitio)
export const PAPEL = "#f7f4ea";
export const PAPEL_2 = "#efece1";
export const TINTA = "#0d0d0d";
export const OSCURO = "#0c0c0c";
export const TINTA_SUAVE = "#6f6b62";

// --ease del sitio: cubic-bezier(.16,1,.3,1)
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const { fontFamily: INTER } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// Márgenes laterales amplios, como el sitio
export const MARGEN = 90;

// Zonas seguras de historias de Instagram (1080x1920): el contenido va
// entre y=250 y y=1580 (la barra superior y la caja de respuesta tapan el resto)
