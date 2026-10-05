// Comparación de la captura de movimiento: arriba el video del actor, abajo el personaje moviéndose con la
// secuencia que sacó scripts/rig/mocap.py de ese mismo video (9:16).
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, staticFile } from "remotion";
import { PersonajeRig, type PersonajeRigProps } from "../../plantillas/PersonajeRig/PersonajeRig";
import type { Secuencia } from "../../rig/secuencia";

const MITAD = 960; // px de alto de cada mitad
const FONDO = "#efe9df";
const PIE_Y = 1840; // pies del personaje
const ESCALA = 1.9;

export type MocapCompararProps = {
  video: string; // dentro de public/
  personaje: string;
  secuencia: Secuencia;
  duracion: number; // cuadros
  extras?: PersonajeRigProps["pistas"]; // pistas que se suman (p. ej. hablar con Rhubarb)
};

export const MocapComparar: React.FC<MocapCompararProps> = ({ video, personaje, secuencia, duracion, extras = [] }) => {
  const rig: PersonajeRigProps = {
    personaje,
    x: 540,
    y: PIE_Y,
    escala: ESCALA,
    fondo: null,
    sombra: true,
    pistas: [{ tipo: "secuencia", secuencia, duracion, veces: 1 }, ...extras],
  };
  return (
    <AbsoluteFill style={{ backgroundColor: FONDO }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: MITAD, backgroundColor: "#000" }}>
        <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <PersonajeRig {...rig} />
    </AbsoluteFill>
  );
};

// Lip sync lado a lado con la misma voz: izquierda reglas por letras (Whisper), derecha Rhubarb (sonido)
export type HablaCompararProps = {
  audio: string;
  whisper: { tokens: { text: string; fromMs: number; toMs: number }[] };
  rhubarb: { mouthCues: { start: number; end: number; value: string }[] };
};
const HABLA = { y: 1500, escala: 1.25, xs: [290, 790] };
export const HablaComparar: React.FC<HablaCompararProps> = ({ audio, whisper, rhubarb }) => {
  const base = (x: number, hablar: PersonajeRigProps["pistas"][number]): PersonajeRigProps => ({
    personaje: "bloomie",
    x,
    y: HABLA.y,
    escala: HABLA.escala,
    fondo: null,
    sombra: true,
    pistas: [{ tipo: "respirar" }, { tipo: "parpadear" }, hablar],
  });
  return (
    <AbsoluteFill style={{ backgroundColor: FONDO }}>
      <PersonajeRig {...base(HABLA.xs[0], { tipo: "hablar", inicio: 0, transcripcion: whisper, idioma: "es" })} />
      <PersonajeRig {...base(HABLA.xs[1], { tipo: "hablar", inicio: 0, rhubarb })} />
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
