// Prueba de la fase 4: Bloomie 3D en 9:16 cruzando el cuadro con un salto y un giro, con lienzo completo o
// recortado al personaje (para medir), con o sin fondo (la capa transparente es la que se guarda en caché).
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { caraEnEscena, EscenaBloomie3D } from "../../personajes/bloomie/Bloomie3D";
import { lugarEn, poseEn, type PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";
import { RostroPersonaje } from "../../rig/Rig";

export const DURACION = 120;
const ESCALA = 1.5;
const SALTO = 90; // pt (altura del salto de la pista)
const RIG: PersonajeRigProps = {
  personaje: "bloomie",
  expresion: "feliz",
  x: 0,
  y: 0,
  pistas: [
    { tipo: "respirar" },
    { tipo: "parpadear", semilla: 4 },
    { tipo: "caminar", fin: 40 },
    { tipo: "trayecto", de: [260, 1500], a: [820, 1500], duracion: 70, suave: true },
    { tipo: "saltar", inicio: 45, duracion: 30, altura: SALTO },
    { tipo: "saludar", inicio: 85, duracion: 34 },
  ],
};

export type Escena3DProps = { recortar: boolean; fondo: string | null; capa?: string | null; estilo?: "suave" | "toon" };

export const Escena3D: React.FC<Escena3DProps> = ({ recortar, fondo, capa, estilo }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pose = poseEn(RIG, f, fps);
  const lugar = lugarEn(RIG, f);
  // gira 3/4 hacia donde camina y vuelve de frente para saludar
  const rotY = f < 75 ? 0.6 * Math.min(1, f / 10) : 0.6 * Math.max(0, 1 - (f - 75) / 10);
  const cara = caraEnEscena(pose, rotY);
  return (
    <AbsoluteFill style={{ backgroundColor: fondo ?? "transparent" }}>
      {capa ? (
        // capa 3D ya renderizada (scripts/capa3d.mjs, con la cara incluida): sin WebGL en el render final
        <OffthreadVideo src={staticFile(capa)} transparent muted />
      ) : (
        <EscenaBloomie3D pose={pose} rotY={rotY} x={lugar.x} yPies={lugar.y} escala={ESCALA} ancho={width} alto={height} recortar={recortar} saltoMax={SALTO} estilo={estilo} />
      )}
      {!capa && (
        <svg width={width} height={height} style={{ position: "absolute" }}>
          <g transform={`translate(${lugar.x} ${lugar.y}) scale(${ESCALA}) matrix(${cara.matriz.join(" ")})`}>
            <RostroPersonaje personaje="bloomie" pose={pose} />
          </g>
        </svg>
      )}
    </AbsoluteFill>
  );
};
