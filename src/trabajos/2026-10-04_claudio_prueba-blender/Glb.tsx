// El .glb que exporta personaje_desde_rig.py, cargado en Remotion con Modelo3D (sin animaciones: solo el modelo)
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Modelo3D } from "../../plantillas/comunes/Modelo3D";

export const BloomieGlb: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#e9e4dc" }}>
      <Modelo3D src="personajes/bloomie/bloomie.glb" x={540} y={1400} alto={760} rotY={(f / 60) * Math.PI} />
    </AbsoluteFill>
  );
};
