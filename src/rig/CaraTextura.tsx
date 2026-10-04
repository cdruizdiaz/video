// Cara del personaje sola, cuadrada y transparente, para usarla como TEXTURA de la cabeza de un modelo 3D (Blender:
// scripts/blender/). La anima el mismo rig 2D (expresiones, parpadeo, mirada, lip sync con Rhubarb o Whisper),
// así el cuerpo lo mueve Blender y la cara sale idéntica a la del dibujo. El cuadro cubre la caja de la cabeza
// de frente (piezas.json → vistas.frente.cabeza.caja) con un margen: la misma convención usa la calcomanía en Blender.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { poseEn, type PersonajeRigProps } from "../plantillas/PersonajeRig/calculos";
import { cargarPersonaje } from "./personajes";
import { RostroPersonaje } from "./Rig";

export const MARGEN_CARA = 0.06; // fracción de la caja de la cabeza que se agrega alrededor

// Caja (pt del .ai) que cubre la textura: la de la cabeza de frente, cuadrada y con margen
export const cajaCara = (personaje: string): [number, number, number, number] => {
  const dv = cargarPersonaje(personaje).piezas.vistas.frente;
  const c = dv.cabeza?.caja ?? dv.caja;
  const lado = Math.max(c[2] - c[0], c[3] - c[1]) * (1 + 2 * MARGEN_CARA);
  const cx = (c[0] + c[2]) / 2;
  const cy = (c[1] + c[3]) / 2;
  return [cx - lado / 2, cy - lado / 2, cx + lado / 2, cy + lado / 2];
};

export const CaraTextura: React.FC<{ rig: PersonajeRigProps }> = ({ rig }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const pose = poseEn(rig, f, fps);
  const c = cajaCara(rig.personaje);
  const e = width / (c[2] - c[0]);
  return (
    <AbsoluteFill>
      <svg width={width} height={width}>
        <g transform={`scale(${e}) translate(${-c[0]} ${-c[1]})`}>
          <RostroPersonaje personaje={rig.personaje} pose={pose} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
