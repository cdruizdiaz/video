// Trabajo 2026-10-23_claudio_prueba-motionblur — prueba del desenfoque de movimiento de la suite (motion-blur.txt):
// Bloomie salta y cruza la pantalla + título que entra de golpe, en tres variantes y la comparativa 2×2;
// además el blur en 3D (giro de Bloomie 3D y entrada de Logo3D; render con --gl=angle).
import { volto } from "../../marcas/volto/marca";
import { DURACION_3D, Muestra3D } from "../../personajes/bloomie/Muestra3D";
import { Logo3D, type Logo3DProps, zLogo3D } from "../../plantillas/Logo3D/Logo3D";
import type { ComposicionTrabajo } from "../tipos";
import { PersonajeRig } from "../../plantillas/PersonajeRig/PersonajeRig";
import { DURACION_POSES, PosesConBlur } from "./PosesConBlur";
import { ComparativaMotionBlur, DURACION, PruebaMotionBlur, rig } from "./PruebaMotionBlur";

// Logo de volto del trabajo de prueba 3D (2026-10-04_claudio_prueba-3d), entrada "armado"
const IMG_3D = "trabajos/2026-10-04_claudio_prueba-3d/img";
const logo: Logo3DProps = {
  svg: `${IMG_3D}/logo_volto.svg`,
  textura: `${IMG_3D}/logo_volto.png`,
  colorCostado: volto.colores.acentoSuave!,
  fondo: volto.colores.oscuro,
  animacion: "armado",
  texto: "IA 2026",
  colorTexto: volto.colores.claro,
  fuente: volto.fuente,
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-prueba-motionblur-sin", component: PruebaMotionBlur, durationInFrames: DURACION, defaultProps: { variante: "sin" }, salida: "sin_9x16" },
  { id: "claudio-prueba-motionblur-camara", component: PruebaMotionBlur, durationInFrames: DURACION, defaultProps: { variante: "camara" }, salida: "camara_9x16" },
  { id: "claudio-prueba-motionblur-estela", component: PruebaMotionBlur, durationInFrames: DURACION, defaultProps: { variante: "estela" }, salida: "estela_9x16" },
  { id: "claudio-prueba-motionblur-comparativa", component: ComparativaMotionBlur, durationInFrames: DURACION, defaultProps: {}, salida: "comparativa_9x16" },
  // Solo el salto, con estela y fondo transparente: para revisar los bordes del alfa (scripts/rig/exportar.mjs --mov)
  { id: "claudio-prueba-motionblur-estela-alfa", component: PersonajeRig, durationInFrames: 50, defaultProps: { ...rig("estela", false), fondo: null }, salida: "estela-alfa_9x16" },
  // ExplicacionGeometrica con los personajes por poses de Pitágoras: subtítulos y pop de pose con blur
  { id: "claudio-prueba-motionblur-poses", component: PosesConBlur, durationInFrames: DURACION_POSES, defaultProps: {}, salida: "poses_9x16" },
  { id: "claudio-prueba-motionblur-3d", component: Muestra3D, durationInFrames: DURACION_3D, defaultProps: { desenfoque: true }, width: 1080, height: 1080, salida: "bloomie3d_1x1" },
  { id: "claudio-prueba-motionblur-logo", component: Logo3D, durationInFrames: 90, defaultProps: { ...logo, desenfoque: true }, schema: zLogo3D, salida: "logo3d_9x16" },
];
