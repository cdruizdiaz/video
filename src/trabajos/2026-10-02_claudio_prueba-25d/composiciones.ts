// Trabajo 2026-10-02_claudio_prueba-25d — Bloomie hace pesas (prueba 2,5D, 5 s, 9:16).
// Composición en PesasBloomie.tsx. Fondo de croma verde (para superponer) y versión con transparencia.
import type { ComposicionTrabajo } from "../tipos";
import { CROMA, DURACION, PesasBloomie, type PesasBloomieProps } from "./PesasBloomie";

const SFX = "biblioteca/sfx/mixkit";
// Mixkit 2116 "Metal gym plate" (la barra despega del piso y en el empujón) y 2894 "Boing" (la barra se curva)
const efectos: PesasBloomieProps["efectos"] = [
  { archivo: `${SFX}/mixkit-2116.wav`, desde: 9, volumen: 0.8 },
  { archivo: `${SFX}/mixkit-2116.wav`, desde: 126, volumen: 0.6 },
  { archivo: `${SFX}/mixkit-2894-boing-hit-sound.wav`, desde: 131, volumen: 0.7 },
];
const croma: PesasBloomieProps = { fondo: CROMA, efectos };
const alfa: PesasBloomieProps = { ...croma, fondo: null };

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-prueba-25d-pesas", component: PesasBloomie, durationInFrames: DURACION, defaultProps: croma, salida: "pesas-croma_9x16" },
  { id: "claudio-prueba-25d-pesas-alfa", component: PesasBloomie, durationInFrames: DURACION, defaultProps: alfa, salida: "pesas-alfa_9x16" },
];
