// Trabajo 2026-10-01_lucia_bloomie-halloween — aparición de Bloomie para la sección de Halloween
// (plantilla AparicionBloomie): capa transparente para poner encima de los reels, esquina izquierda o derecha.
import { HojaBloomie } from "../../marcas/bloomie/HojaBloomie";
import { HojaCarreraBloomie } from "../../marcas/bloomie/HojaCarreraBloomie";
import {
  AparicionBloomie,
  type AparicionBloomieProps,
  DURACION_APARICION,
} from "../../plantillas/AparicionBloomie/AparicionBloomie";
import { CarreraBloomie, type CarreraBloomieProps, DURACION_CARRERA } from "../../plantillas/CarreraBloomie/CarreraBloomie";
import type { ComposicionTrabajo } from "../tipos";

const SFX = "biblioteca/sfx/mixkit";
const halloween = (lado: AparicionBloomieProps["lado"]): AparicionBloomieProps => ({
  lado,
  cara: "bruja",
  escoba: true,
  estela: "estrellas",
  efectos: [
    { desde: 0, archivo: `${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, volumen: 0.6 },
    { desde: 44, archivo: `${SFX}/mixkit-739-small-cartoon-character-laughing.wav`, volumen: 0.8 },
    { desde: 86, archivo: `${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, volumen: 0.6 },
  ],
});

// Versión corriendo: cruza la pantalla de izquierda a derecha con la escoba en la mano (pedido del 2026-10-01)
const halloweenCorre: CarreraBloomieProps = {
  disfraz: "bruja",
  escoba: true,
  estela: "estrellas",
  piso: 440,
  efectos: [
    { desde: 0, duracion: 96, archivo: `${SFX}/mixkit-37-cartoon-insect-running-fast.wav`, volumen: 0.7 },
    { desde: 38, archivo: `${SFX}/mixkit-739-small-cartoon-character-laughing.wav`, volumen: 0.8 },
  ],
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "lucia-bloomie-halloween-izq",
    component: AparicionBloomie,
    durationInFrames: DURACION_APARICION,
    defaultProps: halloween("izquierda"),
    salida: "halloween-izq_9x16",
  },
  {
    id: "lucia-bloomie-halloween-der",
    component: AparicionBloomie,
    durationInFrames: DURACION_APARICION,
    defaultProps: halloween("derecha"),
    salida: "halloween-der_9x16",
  },
  {
    id: "lucia-bloomie-halloween-corre",
    component: CarreraBloomie,
    durationInFrames: DURACION_CARRERA,
    defaultProps: halloweenCorre,
    salida: "halloween-corre_9x16",
  },
  {
    id: "lucia-bloomie-kit-hoja",
    component: HojaBloomie,
    durationInFrames: 1,
    defaultProps: {},
    salida: "kit-hoja_9x16",
  },
  {
    id: "lucia-bloomie-kit-carrera",
    component: HojaCarreraBloomie,
    durationInFrames: 1,
    defaultProps: {},
    salida: "kit-carrera_9x16",
  },
];
