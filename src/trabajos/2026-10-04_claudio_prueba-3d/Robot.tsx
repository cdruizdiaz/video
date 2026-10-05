// Prueba 4.4: modelo .glb con animaciones (RobotExpressive, CC0, public/biblioteca/modelos3d/) encadenando clips
// con fundidos, sincronizados con el cuadro.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Modelo3D } from "../../plantillas/comunes/Modelo3D";

export const Robot: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#e9e4dc" }}>
    <Modelo3D
      src="biblioteca/modelos3d/RobotExpressive.glb"
      x={540}
      y={1450}
      alto={900}
      rotY={0.35}
      clips={[
        { nombre: "Idle", desde: 0, hasta: 30 },
        { nombre: "Wave", desde: 30, hasta: 75 },
        { nombre: "Dance", desde: 75 },
      ]}
    />
  </AbsoluteFill>
);
