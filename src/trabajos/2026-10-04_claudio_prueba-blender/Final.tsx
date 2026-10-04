// Capa de Blender (webm con alfa de scripts/blender/render.mjs) sobre el fondo, con una sombra de contacto que
// sigue a los pies con el mismo cálculo del rig 2D (Eevee no tiene "atrapa sombras" para el piso).
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { lugarEn, poseEn, type PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";

const SOMBRA = { ancho: 120, alto: 16, opacidad: 0.2, achique: 0.004 };

export const FinalBlender: React.FC<{ capa: string; rig: PersonajeRigProps; fondo: string }> = ({ capa, rig, fondo }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const lugar = lugarEn(rig, f);
  const alto = Math.max(0, -(poseEn(rig, f, fps).huesos.raiz?.y ?? 0));
  return (
    <AbsoluteFill style={{ backgroundColor: fondo }}>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <ellipse
          cx={lugar.x}
          cy={lugar.y}
          rx={SOMBRA.ancho * lugar.escala * Math.max(0.4, 1 - alto * SOMBRA.achique)}
          ry={SOMBRA.alto * lugar.escala}
          fill="#000"
          opacity={SOMBRA.opacidad}
        />
      </svg>
      {capa && (
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(capa)} transparent muted />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// Sobre video real: el guitarrista (proxy de 2026-10-04_claudio_prueba-25d-video), Bloomie de Blender caminando
// por detrás (oclusión por profundidad de la fase 3) con el sol de la escena (arriba a la izquierda).
export const BlenderSobreVideo: React.FC<{ capa: string; rig: PersonajeRigProps; video: string; cerca: string }> = ({ capa, rig, video, cerca }) => {
  const f = useCurrentFrame();
  const lugar = lugarEn(rig, f);
  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(video)} muted />
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {/* sombra hacia la derecha y atrás (contraria al sol) */}
        <ellipse cx={lugar.x + 40 * lugar.escala} cy={lugar.y - 4} rx={95 * lugar.escala} ry={14 * lugar.escala} fill="#1d2a10" opacity={0.35} />
      </svg>
      {capa && (
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(capa)} transparent muted />
        </AbsoluteFill>
      )}
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(cerca)} transparent muted />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
