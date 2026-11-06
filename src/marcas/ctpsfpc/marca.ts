import { Easing } from "remotion";
import type { Marca } from "../tipos";
import { ALMARAI, BE_VIETNAM, cargarFuentesCtpsfpc } from "./fuentes";

// Identidad del Colegio de Traductores de la Provincia de Santa Fe — Primera Circunscripción (CTPSFPC),
// tomada del "Brand & Social Media Playbook 2026" (Anexo 1, guía visual), 2026-10-25.
// Paleta y proporción de uso: Space Indigo 60 % (dominante / institucional), Chili Spice 20 % (acento cálido),
// Wisteria Blue 10 % (secundario / contraste), Dim Grey 7 % (neutro de apoyo), Ivory Mist 3 % (fondo claro).
// Estilo gráfico: Bento Grid + Bauhaus (formas geométricas simples —círculos, medios y cuartos de círculo—,
// colores planos, sin adornos). Ortografía y puntuación: RAE (comillas latinas « », signos de apertura).
cargarFuentesCtpsfpc();

export const PALETA_CTPSFPC = {
  indigo: "#202c5a",
  chili: "#b43232",
  wisteria: "#96bdfe",
  gris: "#706c61",
  marfil: "#f8f4e3",
};

export const ctpsfpc: Marca = {
  id: "ctpsfpc",
  firma: "CTPSFPC",
  fuente: `"${BE_VIETNAM}", sans-serif`,
  fuenteTitulos: `"${ALMARAI}", sans-serif`,
  colores: {
    fondo: PALETA_CTPSFPC.marfil,
    tinta: PALETA_CTPSFPC.indigo,
    tintaSuave: PALETA_CTPSFPC.gris,
    oscuro: PALETA_CTPSFPC.indigo,
    claro: PALETA_CTPSFPC.marfil,
    acento: PALETA_CTPSFPC.chili,
    acentoSuave: PALETA_CTPSFPC.wisteria,
  },
  ease: Easing.bezier(0.33, 1, 0.68, 1),
  margen: 90,
  logo: "marcas/ctpsfpc/logo-azul.svg", // globo + "CTPSFPC" en Space Indigo; versión blanca: logo-blanco.svg
  logoFiltroSobreClaro: "none",
  logoFiltroSobreOscuro: "brightness(0) invert(1)",
};
