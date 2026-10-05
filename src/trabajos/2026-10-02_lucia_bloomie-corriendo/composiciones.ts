// Trabajo 2026-10-02_lucia_bloomie-corriendo — Bloomie cruza corriendo la parte de abajo de la pantalla
// como un auto de carreras (plantilla SpriteCorriendo, sprites del kit: public/marcas/bloomie/sprites-carrera).
// Capa con fondo transparente, 5 s, una sola pasada.
import { SpriteCorriendo, type SpriteCorriendoProps } from "../../plantillas/SpriteCorriendo/SpriteCorriendo";
import type { ComposicionTrabajo } from "../tipos";

const DURACION = 150; // 5 s
const SPRITES = Array.from({ length: 24 }, (_, i) => `marcas/bloomie/sprites-carrera/f${String(i + 1).padStart(2, "0")}.png`);

const corriendo: SpriteCorriendoProps = {
  sprites: SPRITES,
  anchoSprite: 213,
  altoSprite: 234,
  pieY: 230,
  escala: 1.5,
  piso: 1640, // abajo, por encima de la zona de la interfaz de Instagram
  entra: 30, // 1 s oyéndolo llegar fuera de cuadro
  sale: 105, // cruza en 2,5 s; después la tierra se asienta
  cuadrosPorFrame: 1,
  tierra: true,
  // Auto que pasa con Doppler (Mixkit 1538), ya calzado con el cruce: preparar_sonido.sh
  efectos: [{ desde: 0, archivo: "trabajos/2026-10-02_lucia_bloomie-corriendo/audio/auto_doppler.wav", volumen: 1 }],
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "lucia-bloomie-corriendo",
    component: SpriteCorriendo,
    durationInFrames: DURACION,
    defaultProps: corriendo,
    salida: "bloomie-corriendo_9x16",
  },
];
