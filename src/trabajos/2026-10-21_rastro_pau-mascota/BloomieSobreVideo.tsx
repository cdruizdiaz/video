// Un clip de Pau con Bloomie encima, anclado a un punto de su palma o de su hombro (`seguimiento` de
// datos/bloomie_<x>.json, de seguir_puntos.py + armar_bloomie.mjs: posición, giro y escala/pop por cuadro).
// Desde el borrador E, Bloomie es el video animado del cliente sin el fondo blanco (crudos/bloomie_<x>.webm, de
// recortar_bloomie.py; trae su propia sombra gris en los pies): "el Bloomie que vos hiciste tiene el brazo cortado".
// Hasta el D era el rig 2D (PersonajeRig) con una sombra plana dibujada aparte.
// En el hombro lleva además una sombra proyectada suave: su silueta achatada que cae hacia abajo a la izquierda sobre
// la remera (la luz viene de arriba a la derecha). Se renderiza mudo como proxy derivado (crudos/<clip>b.mp4) y el
// montaje usa ese archivo con la voz del clip original (opción `audios`): así los zooms del reel mueven a Pau y a
// Bloomie juntos.
import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  lugarEn,
  type PersonajeRigProps,
} from "../../plantillas/PersonajeRig/calculos";

// ---------- Constantes ----------
// sombra proyectada (silueta en negro): achatada, invertida hacia abajo y sesgada, desde los pies.
// Borrador D: "la sombra muy grotesca, disminuila y difuminala" (antes -0,42, 32°, 0,5 y 6 px)
const PROYECTADA_ACHATADO = -0.22; // escala vertical (negativa: cae debajo de los pies, sobre el hombro)
const PROYECTADA_SESGO = 24; // grados: se corre hacia la izquierda
const PROYECTADA_OPACIDAD = 0.22;
const PROYECTADA_DESENFOQUE = 16; // px

export type VideoBloomie = {
  src: string; // webm con alfa dentro de public/
  ancho: number; // px del webm
  alto: number;
  pies: number[]; // [x, y] centro de los pies en el webm
  alto_personaje: number; // px del personaje en el webm (sin la sombra)
};

export type BloomieSobreVideoProps = {
  video: string; // clip de Pau, dentro de public/
  rig: PersonajeRigProps; // solo su lugar: x, y, escala y seguimiento
  desde: number; // cuadro del clip en que empieza el seguimiento (índice 0 del ancla)
  bloomie: VideoBloomie;
  bloomieDesde: number; // cuadro del clip en que arranca el video de Bloomie
  altura: number; // px de alto de Bloomie en pantalla (sin pop)
  escalaBase: number; // escala del rig que corresponde a `altura` (la del ancla sin pop: armar_bloomie.mjs)
  proyectada?: boolean; // sombra proyectada de la silueta (en el hombro)
};

const Bloomie: React.FC<{
  b: VideoBloomie;
  x: number;
  y: number;
  s: number;
  rot: number;
}> = ({ b, x, y, s, rot }) => (
  <OffthreadVideo
    src={staticFile(b.src)}
    transparent
    muted
    style={{
      position: "absolute",
      left: x - b.pies[0] * s,
      top: y - b.pies[1] * s,
      width: b.ancho * s,
      height: b.alto * s,
      transformOrigin: `${b.pies[0] * s}px ${b.pies[1] * s}px`,
      transform: `rotate(${rot}deg)`,
    }}
  />
);

export const BloomieSobreVideo: React.FC<BloomieSobreVideoProps> = ({
  video,
  rig,
  desde,
  bloomie,
  bloomieDesde,
  altura,
  escalaBase,
  proyectada = false,
}) => {
  const f = useCurrentFrame();
  const l = lugarEn(rig, f - desde);
  const s = (l.escala / escalaBase) * (altura / bloomie.alto_personaje);
  const lugar = { b: bloomie, x: l.x, y: l.y, s, rot: l.rot };
  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile(video)} muted />
      <Sequence from={bloomieDesde} name="Bloomie">
        {proyectada && (
          <AbsoluteFill
            style={{
              transformOrigin: `${l.x}px ${l.y}px`,
              transform: `skewX(${PROYECTADA_SESGO}deg) scaleY(${PROYECTADA_ACHATADO})`,
              filter: `brightness(0) blur(${PROYECTADA_DESENFOQUE}px)`,
              opacity: PROYECTADA_OPACIDAD,
            }}
          >
            <Bloomie {...lugar} />
          </AbsoluteFill>
        )}
        <Bloomie {...lugar} />
      </Sequence>
    </AbsoluteFill>
  );
};
