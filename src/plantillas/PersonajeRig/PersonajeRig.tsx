// Plantilla PersonajeRig: anima un personaje de la biblioteca (src/personajes/) con su rig vectorial, sin
// sprites ni IA: pistas de animación (respirar, parpadear, expresión, hablar, saludar, saltar, caminar, correr,
// girar, temblor, vaivén, secuencias de poses clave…) que se suman, un trayecto por el cuadro y audio opcional.
// Con `fondo: null` el fondo es transparente: se exporta como .mov ProRes 4444 o secuencia PNG
// (scripts/rig/exportar.mjs). Esquema de props y cálculos en ./calculos.ts; formato en src/rig/README.md.
// `desenfoque` (motion blur) envuelve solo el dibujo del personaje: fondo, audio y sonidos quedan afuera.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EnEscena, PersonajeRig as Dibujo } from "../../rig/Rig";
import { efectosDePistas } from "../../rig/sonidos";
import { DesenfoqueMovimiento, opcionesDe } from "../comunes/Desenfoque";
import { lugarEn, poseEn, type PersonajeRigProps, tramosDelRig } from "./calculos";

export { zPersonajeRig, type PersonajeRigProps } from "./calculos";

const SOMBRA = { ancho: 120, alto: 16, opacidad: 0.18, achique: 0.004 }; // pt · pt · · por pt de altura

// El dibujo calcula su cuadro adentro (useCurrentFrame): así el desenfoque lo recalcula en cada muestra
const Cuadro: React.FC<{ props: PersonajeRigProps }> = ({ props }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pose = poseEn(props, f, fps);
  const lugar = lugarEn(props, f);
  const alto = Math.max(0, -(pose.huesos.raiz?.y ?? 0));
  return (
    <svg width="100%" height="100%" style={{ overflow: "visible", position: "absolute" }}>
      {props.sombra && (
        <ellipse
          cx={lugar.x}
          cy={lugar.y}
          rx={SOMBRA.ancho * lugar.escala * Math.max(0.4, 1 - alto * SOMBRA.achique)}
          ry={SOMBRA.alto * lugar.escala}
          fill="#000000"
          opacity={SOMBRA.opacidad}
        />
      )}
      <EnEscena x={lugar.x} y={lugar.y} escala={lugar.escala} rot={lugar.rot}>
        <Dibujo personaje={props.personaje} pose={pose} luz={props.luz ?? undefined} />
      </EnEscena>
    </svg>
  );
};

export const PersonajeRig: React.FC<PersonajeRigProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const d = opcionesDe(props.desenfoque);
  return (
    <AbsoluteFill style={{ backgroundColor: props.fondo ?? "transparent" }}>
      {d ? (
        <DesenfoqueMovimiento {...d} tramos={d.tramos ?? tramosDelRig(props, durationInFrames, fps, d.umbral)}>
          <Cuadro props={props} />
        </DesenfoqueMovimiento>
      ) : (
        <Cuadro props={props} />
      )}
      {props.sonidos !== undefined &&
        props.sonidos !== false &&
        efectosDePistas(props.pistas, { volumen: props.sonidos === true ? 1 : props.sonidos }).map((e, i) => (
          <Sequence key={`sfx-${i}`} from={e.desde} layout="none" name={`sfx ${e.tipo}`}>
            <Audio src={staticFile(e.archivo)} volume={() => e.volumen} />
          </Sequence>
        ))}
      {props.audio && (
        <Sequence from={props.audio.desde ?? 0} layout="none">
          <Audio src={staticFile(props.audio.archivo)} volume={() => props.audio?.volumen ?? 1} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
