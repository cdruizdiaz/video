// Hoja de revisión del kit Bloomie: las 12 caras (parpadeo y boca de hablar en la primera fila) y la escoba.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Accesorio, Personaje } from "../../plantillas/PersonajeAnimado/Personaje";
import { bloomie, CARAS_BLOOMIE, PERSONAJE_BLOOMIE } from "./marca";

const COLUMNAS = 3;
const CELDA = { ancho: 360, alto: 400 };
const ESCALA = 0.62;

export const HojaBloomie: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: bloomie.colores.fondo }}>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      {CARAS_BLOOMIE.map((cara, i) => {
        const x = (i % COLUMNAS) * CELDA.ancho + CELDA.ancho / 2;
        const y = Math.floor(i / COLUMNAS) * CELDA.alto + 330;
        return (
          <g key={cara} transform={`translate(${x} ${y})`}>
            <g transform={`scale(${ESCALA})`}>
              <Personaje datos={PERSONAJE_BLOOMIE} cara={cara} />
              {cara === "bruja" && <Accesorio datos={PERSONAJE_BLOOMIE} nombre="escoba" />}
            </g>
            <text y={45} textAnchor="middle" fontFamily={bloomie.fuente} fontWeight={600} fontSize={34} fill={bloomie.colores.tinta}>
              {cara}
            </text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
