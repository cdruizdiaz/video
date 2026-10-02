// Hoja de revisión del kit Bloomie — carrera: las 8 poses clave del ciclo (con su sombra en el piso),
// las mismas con el disfraz de bruja y la escoba, y una tira con los 16 dibujos del ciclo uno tras otro
// (separados, de izquierda a derecha).
import React from "react";
import { AbsoluteFill } from "remotion";
import { poseCarrera } from "../../plantillas/PersonajeAnimado/Carrera";
import { BloomieCorriendo } from "./BloomieCorriendo";
import { CICLO_CARRERA_BLOOMIE, POSES_CARRERA_BLOOMIE } from "./carrera";
import { bloomie } from "./marca";

const COLUMNAS = 4;
const CELDA = { ancho: 270, alto: 330 };
const ESCALA = 0.55;
const TIRA = { y: 1800, escala: 0.34, x0: 70, paso: 62 };

const Piso: React.FC<{ ancho: number }> = ({ ancho }) => (
  <line x1={-ancho / 2} x2={ancho / 2} y1={0} y2={0} stroke={bloomie.colores.tintaSuave} strokeWidth={3} strokeDasharray="10 8" />
);

const Fila: React.FC<{ y0: number; disfraz: "ninguno" | "bruja" }> = ({ y0, disfraz }) => (
  <>
    {POSES_CARRERA_BLOOMIE.map((p, i) => {
      const x = (i % COLUMNAS) * CELDA.ancho + CELDA.ancho / 2;
      const y = y0 + Math.floor(i / COLUMNAS) * CELDA.alto;
      return (
        <g key={i} transform={`translate(${x} ${y})`}>
          <Piso ancho={230} />
          <g transform={`scale(${ESCALA})`}>
            <BloomieCorriendo pose={p} disfraz={disfraz} escoba={disfraz === "bruja"} />
          </g>
          <text y={40} textAnchor="middle" fontFamily={bloomie.fuente} fontWeight={600} fontSize={26} fill={bloomie.colores.tinta}>
            {i + 1}. {p.nombre}
          </text>
        </g>
      );
    })}
  </>
);

export const HojaCarreraBloomie: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: bloomie.colores.fondo }}>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <text x={540} y={70} textAnchor="middle" fontFamily={bloomie.fuente} fontWeight={700} fontSize={44} fill={bloomie.colores.tinta}>
        Bloomie corre — poses clave
      </text>
      <Fila y0={330} disfraz="ninguno" />
      <Fila y0={1010} disfraz="bruja" />
      <text x={540} y={TIRA.y - 190} textAnchor="middle" fontFamily={bloomie.fuente} fontWeight={600} fontSize={30} fill={bloomie.colores.tintaSuave}>
        ciclo completo: {CICLO_CARRERA_BLOOMIE} dibujos (un frame cada uno)
      </text>
      <line x1={0} x2={1080} y1={TIRA.y} y2={TIRA.y} stroke={bloomie.colores.tintaSuave} strokeWidth={3} />
      {Array.from({ length: CICLO_CARRERA_BLOOMIE }, (_, f) => (
        <g key={f} transform={`translate(${TIRA.x0 + f * TIRA.paso} ${TIRA.y}) scale(${TIRA.escala})`} opacity={f % 2 === 0 ? 1 : 0.6}>
          <BloomieCorriendo pose={poseCarrera(POSES_CARRERA_BLOOMIE, f / CICLO_CARRERA_BLOOMIE)} />
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);
