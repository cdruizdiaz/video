// Trabajo 2026-10-02_lucia_bloomie-volando-escoba-realista — Bloomie de bruja cruza volando en escoba la parte
// de arriba de la pantalla como un auto de carreras (plantilla SpriteCorriendo en modo `volando`, sprites del
// kit: public/marcas/bloomie/sprites-escoba). Capa con fondo transparente, 5 s, una sola pasada.
import { SpriteCorriendo, type SpriteCorriendoProps } from "../../plantillas/SpriteCorriendo/SpriteCorriendo";
import type { ComposicionTrabajo } from "../tipos";

const DURACION = 150; // 5 s
const SPRITES = Array.from({ length: 24 }, (_, i) => `marcas/bloomie/sprites-escoba/f${String(i + 1).padStart(2, "0")}.png`);

const volando: SpriteCorriendoProps = {
  sprites: SPRITES,
  anchoSprite: 315,
  altoSprite: 259,
  pieY: 259, // referencia vertical: el borde de abajo del sprite
  escala: 1.4,
  piso: 640, // arriba, por debajo de la zona de la interfaz de Instagram
  entra: 30, // 1 s oyéndolo llegar fuera de cuadro
  sale: 105, // cruza en 2,5 s; después el humo se deshace
  cuadrosPorFrame: 1 / 3, // la hoja es una actuación de 24 dibujos: se pasa una vez durante el cruce
  unaVez: true,
  tierra: false,
  volando: { flota: 12, humoDesde: { x: 0.13, y: 0.8 } }, // humo desde las cerdas de la escoba
  // Auto que pasa con Doppler (Mixkit 1538), calzado con el cruce: preparar_sonido.sh
  efectos: [{ desde: 0, archivo: "trabajos/2026-10-02_lucia_bloomie-volando-escoba-realista/audio/auto_doppler.wav", volumen: 1 }],
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "lucia-bloomie-volando-escoba",
    component: SpriteCorriendo,
    durationInFrames: DURACION,
    defaultProps: volando,
    salida: "bloomie-volando-escoba_9x16",
  },
];
