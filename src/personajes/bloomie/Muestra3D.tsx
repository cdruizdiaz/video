// Muestra 3D de Bloomie (biblioteca de personajes): el modelo construido por código girando, saludando y hablando
// sobre fondo crema, con la cara 2D del rig encima. Sirve de prueba del render WebGL (verificar-suite) y de ejemplo
// para usar EscenaBloomie3D en otros trabajos. Render con --gl=angle.
import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ConDesenfoque, type Desenfoque, opcionesDe, PorCuadro } from "../../plantillas/comunes/Desenfoque";
import { poseEn, type PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";
import { RostroPersonaje } from "../../rig/Rig";
import { caraEnEscena, EscenaBloomie3D, tramosDeGiro3D } from "./Bloomie3D";

const LADO = 1080;
const ESCALA = 1.6;
const PIES = { x: 540, y: 900 };
export const DURACION_3D = 120;

const RIG: PersonajeRigProps = {
  personaje: "bloomie",
  vista: "frente",
  expresion: "feliz",
  x: 0,
  y: 0,
  pistas: [
    { tipo: "respirar" },
    { tipo: "parpadear", semilla: 2 },
    { tipo: "saludar", inicio: 50, duracion: 40, veces: 2 },
    { tipo: "hablar", inicio: 50, fin: 90, transcripcion: { tokens: [{ text: " hello", fromMs: 0, toMs: 600 }, { text: " friends", fromMs: 700, toMs: 1300 }] }, idioma: "en" },
  ],
};

const GIRO = 50; // frames de la vuelta y media inicial
const rotYEn = (f: number) => (f < GIRO ? (1 - f / GIRO) * Math.PI * 1.5 : 0);

const Cuadro: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const pose = poseEn(RIG, f, fps);
  // Da una vuelta y media en los primeros 50 frames y queda de frente
  const rotY = rotYEn(f);
  const cara = caraEnEscena(pose, rotY);
  const atras = Math.cos(rotY) < -0.1; // de espaldas: sin cara
  return (
    <AbsoluteFill>
      <EscenaBloomie3D pose={pose} rotY={rotY} x={PIES.x} yPies={PIES.y} escala={ESCALA} ancho={LADO} alto={LADO} sombra={0.3} />
      {!atras && (
        <svg width={LADO} height={LADO} style={{ position: "absolute" }}>
          <g transform={`translate(${PIES.x} ${PIES.y}) scale(${ESCALA}) matrix(${cara.matriz.join(" ")})`}>
            <RostroPersonaje personaje="bloomie" pose={pose} />
          </g>
        </svg>
      )}
    </AbsoluteFill>
  );
};

// desenfoque: motion blur en el giro (el cuerpo 3D y la cara 2D juntos; el fondo queda afuera)
export const Muestra3D: React.FC<{ desenfoque?: Desenfoque }> = ({ desenfoque }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const d = opcionesDe(desenfoque);
  const tramos = useMemo(
    () =>
      d && !d.tramos
        ? tramosDeGiro3D(
            Array.from({ length: durationInFrames }, (_, f) => rotYEn(f)),
            Array.from({ length: durationInFrames }, (): [number, number] => [PIES.x, PIES.y]),
            ESCALA,
            d.umbral,
          )
        : [],
    [d, durationInFrames],
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#f4efe6" }}>
      <ConDesenfoque desenfoque={desenfoque} tramos={tramos}>
        <PorCuadro dibujar={(f) => <Cuadro f={f} fps={fps} />} />
      </ConDesenfoque>
    </AbsoluteFill>
  );
};
