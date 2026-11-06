// Transición de luz ("flash") del CEI/DOCBA: la imagen se sobreexpone con un brillo suave, el corte cae en el pico y la luz
// se apaga sola. Mismos valores que la de los reels del CEI (src/trabajos/2026-10-29_cei_halloween/MuseoUmbral.tsx).
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FLASH_SUBE = 6; // cuadros hasta el pico
const FLASH_BAJA = 11; // cuadros de decaimiento
const FLASH_BLANCO = 0.72; // opacidad máxima del velo claro
export const FLASH_BRILLO = 0.9; // brillo extra de la imagen en el pico
export const FLASH_DESENFOQUE = 5; // px de desenfoque en el pico (el brillo "sangra")
export const FLASH_ZOOM = 0.06; // la imagen se agranda un poco en el pico (así el desenfoque no deja bordes)

// Intensidad (0-1) del flash en el cuadro f para un corte en el cuadro c: sube hasta el corte y se apaga después
export const intensidadFlash = (f: number, c: number) =>
  f < c
    ? interpolate(f, [c - FLASH_SUBE, c], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })
    : interpolate(f, [c, c + FLASH_BAJA], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

// Estilo que se le pone a la capa de video para que "sangre" la luz
export const estiloFlash = (e: number): React.CSSProperties =>
  e > 0
    ? {
        filter: `blur(${e * FLASH_DESENFOQUE}px) brightness(${1 + e * FLASH_BRILLO}) contrast(${1 - e * 0.2})`,
        transform: `scale(${1 + e * FLASH_ZOOM})`,
      }
    : {};

export const VeloLuz: React.FC<{ e: number }> = ({ e }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 80% 60% at 50% 38%, rgba(255,253,246,${e * FLASH_BLANCO}) 0%, rgba(255,250,238,${e * FLASH_BLANCO * 0.8}) 100%)`,
    }}
  />
);

// ---------- Destello (parecido al flash, no igual) ----------
// En vez del brillo con desenfoque y velo blanco del flash: una banda de luz cálida (blanco-naranja) cruza la imagen de izquierda a
// derecha justo en el corte, con una exposición suave (sin desenfoque ni zoom). Mismo ritmo que el flash (sube hasta el corte y se apaga).
const DESTELLO_ANTES = 6; // cuadros antes del corte en que entra la banda por la izquierda
const DESTELLO_DURA = 20; // cuadros que tarda en cruzar
const DESTELLO_BRILLO = 0.35; // exposición extra en el pico

export const progresoDestello = (f: number, c: number) =>
  Math.max(0, Math.min(1, (f - (c - DESTELLO_ANTES)) / DESTELLO_DURA));

// Exposición suave de la capa de video durante el destello (pico cuando la banda pasa por el centro)
export const estiloDestello = (p: number): React.CSSProperties => {
  const e = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
  return e > 0 ? { filter: `brightness(${1 + e * DESTELLO_BRILLO}) saturate(${1 + e * 0.12})` } : {};
};

export const BarridoLuz: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0 || p >= 1) return null;
  const centro = -25 + p * 150; // % del ancho: de fuera por la izquierda a fuera por la derecha
  const e = Math.sin(Math.PI * p);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(100deg, rgba(255,200,130,0) ${centro - 28}%, rgba(255,214,160,${0.55 * e}) ${centro - 8}%, rgba(255,252,240,${0.9 * e}) ${centro}%, rgba(255,214,160,${0.55 * e}) ${centro + 8}%, rgba(255,200,130,0) ${centro + 28}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

// ---------- Flash corto (el de R1_VFinal de DOCBA, s 57,6 de Referencias/R1_VFinal.mov) ----------
// Medido a 60 cuadros por segundo: el plano que sale se sobreexpone en 2 cuadros (brillo medio 112 → 142 → 175, blancos quemados, nitidez
// a 1/3 por el "bloom") y en el cuadro siguiente ya está el plano nuevo, normal y sin luz que se apague después. Es un parpadeo seco antes
// de un corte en seco, no la subida y bajada del flash de los reels del CEI (FLASH_SUBE 6 + FLASH_BAJA 11, con desenfoque y zoom).
// A 30 cuadros por segundo: dos cuadros antes del corte (0,5 y 1,0) y nada después.
const CORTO_PASOS = [0.5, 1]; // intensidad en los cuadros c-2 y c-1
export const intensidadFlashCorto = (f: number, c: number) => {
  const i = f - (c - CORTO_PASOS.length);
  return i >= 0 && i < CORTO_PASOS.length ? CORTO_PASOS[i] : 0;
};
export const estiloFlashCorto = (e: number): React.CSSProperties =>
  e > 0 ? { filter: `blur(${e * 3}px) brightness(${1 + e * 0.75}) contrast(${1 - e * 0.28}) saturate(${1 - e * 0.15})` } : {};
// Brillo que "sangra" (bloom): velo claro sobre toda la imagen, más fuerte arriba (donde suele estar la luz de las ventanas)
export const VeloBloom: React.FC<{ e: number }> = ({ e }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 90% 70% at 50% 30%, rgba(255,252,240,${e * 0.5}) 0%, rgba(255,250,236,${e * 0.3}) 100%)`,
      mixBlendMode: "screen",
    }}
  />
);
