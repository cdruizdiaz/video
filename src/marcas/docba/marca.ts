import { Easing } from "remotion";
import type { Marca } from "../tipos";
import { DOCBA_PLEX, cargarFuentesDocba } from "./fuentes";

// Identidad de DOCBA (loft social de Nueva Córdoba: cafetería, cowork, eventos y cava; "Denominación de Origen
// Córdoba"). Fuente: Brand Guidelines 2025. Paleta principal: naranja Pantone Orange 021 C, azul petróleo Process
// Cyan C y hueso. Logotipo: aplicación principal (naranja sobre hueso), invertida (naranja sobre azul) y
// secundaria (hueso sobre naranja). Vectorizado en logo.json con src/marcas/docba/extraer_logo.py.
cargarFuentesDocba();

export const DOCBA_NARANJA = "#EF6C00";
export const DOCBA_AZUL = "#303C43";
export const DOCBA_HUESO = "#EDE4CD";

export const docba: Marca = {
  id: "docba",
  firma: "DOCBA",
  fuente: DOCBA_PLEX,
  colores: {
    fondo: DOCBA_HUESO,
    tinta: DOCBA_AZUL,
    tintaSuave: DOCBA_AZUL,
    oscuro: DOCBA_AZUL,
    claro: DOCBA_HUESO,
    acento: DOCBA_NARANJA,
  },
  ease: Easing.bezier(0.33, 1, 0.68, 1),
  margen: 90,
  logo: "marcas/docba/logo-naranja.svg",
  logoFiltroSobreClaro: "none",
  logoFiltroSobreOscuro: "none", // el naranja se lee igual sobre el azul petróleo
};
