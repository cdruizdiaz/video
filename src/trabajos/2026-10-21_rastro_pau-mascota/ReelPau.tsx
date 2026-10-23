// El reel: HablaSubtitulada + lo que tapa las tomas de la tablet (voz de Pau en off, subtítulos encima):
//   - "ideario": motion graphic con la identidad del CEI (IdearioCei.tsx), de "Arrancamos con el ideario" a "ganó la flor";
//   - "etapas": motion graphic de papel → Illustrator → animación con capturas de las grabaciones (EtapasBloomie.tsx);
//   - "video": timelapse de las grabaciones de Illustrator en una tarjeta centrada, sobre la misma grabación
//     agrandada y desenfocada (llena el 9:16 sin barras).
// Además, efectos de sonido sueltos (el pop de Bloomie en la palma), en ms del clip de su toma.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
} from "remotion";
import { MARCAS } from "../../marcas";
import { framesTomaSalida } from "../../plantillas/HablaSubtitulada/calculos";
import {
  HablaSubtitulada,
  type HablaSubtituladaProps,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import { type BeatsEtapas, EtapasBloomie } from "./EtapasBloomie";
import { type BeatsIdeario, IdearioCei } from "./IdearioCei";

// ---------- Constantes ----------
const FPS = 30;
const TARJETA_ANCHO = 1000;
const TARJETA_ASPECTO = 1530 / 890; // recorte de preparar_pantallas.sh
const TARJETA_Y = 960; // centrada (pedido 2026-10-21)
const TARJETA_RADIO = 28;
const TARJETA_SOMBRA = "0 24px 60px rgba(0, 0, 0, 0.45)";
const FONDO_DESENFOQUE = 40; // px
const FONDO_ESCALA = 2.4; // la grabación de fondo, agrandada para llenar el alto
const FONDO_OSCURO = 0.35;

export type Cobertura =
  | { toma: number; tipo: "video"; video: string; extra?: number } // video dentro de public/; extra: cuadros que sigue sobre la toma siguiente
  | { toma: number; tipo: "ideario"; beats: BeatsIdeario }
  | { toma: number; tipo: "etapas"; beats: BeatsEtapas };

export type ReelPauProps = HablaSubtituladaProps & {
  coberturas: Cobertura[];
  efectos: { toma: number; ms: number; src: string; volumen: number }[]; // ms del clip de la toma
};

const Pantalla: React.FC<{ video: string }> = ({ video }) => {
  const alto = TARJETA_ANCHO / TARJETA_ASPECTO;
  return (
    <AbsoluteFill
      style={{ background: MARCAS.rastro.colores.oscuro, overflow: "hidden" }}
    >
      <OffthreadVideo
        src={staticFile(video)}
        muted
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${FONDO_ESCALA})`,
          filter: `blur(${FONDO_DESENFOQUE}px) brightness(${1 - FONDO_OSCURO})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (1080 - TARJETA_ANCHO) / 2,
          top: TARJETA_Y - alto / 2,
          width: TARJETA_ANCHO,
          height: alto,
          borderRadius: TARJETA_RADIO,
          overflow: "hidden",
          boxShadow: TARJETA_SOMBRA,
        }}
      >
        <OffthreadVideo
          src={staticFile(video)}
          muted
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const ReelPau: React.FC<ReelPauProps> = ({
  coberturas,
  efectos,
  ...p
}) => {
  const inicios: number[] = [];
  p.tomas.reduce((acc, t) => {
    inicios.push(acc);
    return acc + framesTomaSalida(t, p.velocidad, FPS);
  }, 0);
  const capa = (
    <AbsoluteFill>
      {coberturas.map((c, i) => (
        <Sequence
          key={i}
          from={inicios[c.toma]}
          durationInFrames={
            framesTomaSalida(p.tomas[c.toma], p.velocidad, FPS) +
            (c.tipo === "video" ? (c.extra ?? 0) : 0)
          }
          name={c.tipo === "video" ? `pantalla ${c.video}` : c.tipo}
        >
          {c.tipo === "video" ? (
            <Pantalla video={c.video} />
          ) : c.tipo === "ideario" ? (
            <IdearioCei beats={c.beats} />
          ) : (
            <EtapasBloomie beats={c.beats} />
          )}
        </Sequence>
      ))}
      {efectos.map((e, i) => (
        <Sequence
          key={`efecto${i}`}
          from={
            inicios[e.toma] +
            Math.round(
              (((e.ms - p.tomas[e.toma].desdeMs) / 1000) * FPS) / p.velocidad,
            )
          }
          name={`efecto ${e.src}`}
        >
          <Audio src={staticFile(e.src)} volume={() => e.volumen} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
  return <HablaSubtitulada {...p} sobreVideo={capa} />;
};
