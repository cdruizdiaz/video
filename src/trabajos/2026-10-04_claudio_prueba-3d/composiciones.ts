// Trabajo 2026-10-04_claudio_prueba-3d — prueba de la fase 4 del plan de mejoras (3D dentro de Remotion):
// lienzo 3D recortado al personaje, capa 3D en caché (scripts/capa3d.mjs), sombreado toon, Logo3D y modelos .glb.
import cache3d from "../../../public/trabajos/2026-10-04_claudio_prueba-3d/datos/cache3d.json";
import { volto } from "../../marcas/volto/marca";
import { rastro } from "../../marcas/rastro/marca";
import { Logo3D, type Logo3DProps, zLogo3D } from "../../plantillas/Logo3D/Logo3D";
import type { ComposicionTrabajo } from "../tipos";
import { Robot } from "./Robot";
import { DURACION, Escena3D, type Escena3DProps } from "./Escena3D";

const completo: Escena3DProps = { recortar: false, fondo: "#f4efe6" };
const recortado: Escena3DProps = { recortar: true, fondo: "#f4efe6" };
const capa: Escena3DProps = { recortar: true, fondo: null };
// La final monta la capa en caché (antes: node scripts/capa3d.mjs claudio-prueba-3d-capa 2026-10-04_claudio_prueba-3d)
const final: Escena3DProps = { recortar: true, fondo: "#f4efe6", capa: cache3d["claudio-prueba-3d-capa"] };

// Logo3D con los logos de los kits de marca (contorno: scripts/vectorizar_logo.py)
const IMG = "trabajos/2026-10-04_claudio_prueba-3d/img";
const logoVolto: Logo3DProps = {
  svg: `${IMG}/logo_volto.svg`,
  textura: `${IMG}/logo_volto.png`,
  colorCostado: volto.colores.acentoSuave!,
  fondo: volto.colores.oscuro,
  animacion: "armado",
  texto: "IA 2026",
  subtexto: "Jornada de innovación",
  colorTexto: volto.colores.claro,
  fuente: volto.fuente,
};
const logoRastro: Logo3DProps = {
  svg: `${IMG}/logo_rastro.svg`,
  textura: null,
  colorFrente: rastro.colores.tinta,
  colorCostado: "#3a3a3a",
  fondo: rastro.colores.fondo,
  animacion: "giro",
  profundidad: 0.18,
  texto: "ESTUDIO DE DISEÑO",
  colorTexto: rastro.colores.tinta,
  fuente: rastro.fuente,
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-prueba-3d-completo", component: Escena3D, durationInFrames: DURACION, defaultProps: completo, salida: "bloomie3d-completo_9x16" },
  { id: "claudio-prueba-3d-recortado", component: Escena3D, durationInFrames: DURACION, defaultProps: recortado, salida: "bloomie3d-recortado_9x16" },
  { id: "claudio-prueba-3d-capa", component: Escena3D, durationInFrames: DURACION, defaultProps: capa, salida: "bloomie3d-capa_9x16" },
  { id: "claudio-prueba-3d-final", component: Escena3D, durationInFrames: DURACION, defaultProps: final, salida: "bloomie3d_9x16" },
  { id: "claudio-prueba-3d-toon", component: Escena3D, durationInFrames: DURACION, defaultProps: { ...recortado, estilo: "toon" }, salida: "bloomie3d-toon_9x16" },
  { id: "claudio-prueba-3d-logo-volto", component: Logo3D, durationInFrames: 120, defaultProps: logoVolto, schema: zLogo3D, salida: "logo3d-volto_9x16" },
  { id: "claudio-prueba-3d-logo-rastro", component: Logo3D, durationInFrames: 120, defaultProps: logoRastro, schema: zLogo3D, width: 1920, height: 1080, salida: "logo3d-rastro_16x9" },
  { id: "claudio-prueba-3d-robot", component: Robot, durationInFrames: 120, defaultProps: {}, salida: "robot-glb_9x16" },
];
