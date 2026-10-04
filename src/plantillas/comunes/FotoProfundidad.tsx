// Foto fija con movimiento de cámara 2,5D (paralaje): con el mapa de profundidad de la foto
// (python scripts/profundidad.py foto.jpg foto_prof.png) lo cercano se corre más que lo lejano, como si la cámara
// se moviera. Es un filtro SVG feDisplacementMap: cada píxel se desplaza según su profundidad (blanco = cerca).
// El punto medio de profundidad queda quieto; lo cercano va hacia un lado y el fondo hacia el otro.
// Movimientos chicos (desplazamiento ≤ 3 % del ancho) se ven naturales; más, se estiran los bordes de los objetos.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const ZOOM_BASE = 1.06; // margen para que no se vean los bordes al desplazar

export type FotoProfundidadProps = {
  foto: string; // dentro de public/
  profundidad: string; // PNG en escala de grises del mismo tamaño (blanco = cerca)
  desplazamiento?: number; // px máximos de corrimiento entre lo más cerca y lo más lejos (default 3 % del ancho)
  angulo?: number; // dirección del movimiento en grados (0 = de izquierda a derecha, 90 = de arriba a abajo)
  zoom?: [number, number]; // acercamiento al principio y al final (1 = nada, además del margen)
  ancho?: number; // tamaño de la foto (px de la composición); por defecto llena el cuadro (cover)
  alto?: number;
};

export const FotoProfundidad: React.FC<FotoProfundidadProps> = ({ foto, profundidad, desplazamiento, angulo = 0, zoom = [1, 1.06] }) => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  // El mapa de profundidad se carga antes de dibujar (feImage no avisa cuando terminó)
  const [listo] = useState(() => delayRender("mapa de profundidad"));
  useEffect(() => {
    let vivas = 2;
    const fin = () => --vivas === 0 && continueRender(listo);
    for (const src of [foto, profundidad]) {
      const i = new Image();
      i.onload = fin;
      i.onerror = () => cancelRender(new Error(`No se pudo cargar ${src}`));
      i.src = staticFile(src);
    }
  }, [foto, profundidad, listo]);

  const t = interpolate(f, [0, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const suave = t * t * (3 - 2 * t);
  const maximo = desplazamiento ?? width * 0.03;
  const escala = maximo * (suave * 2 - 1); // de -max a +max
  const a = (angulo * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const z = ZOOM_BASE * interpolate(suave, [0, 1], zoom);
  const id = "prof-" + foto.replace(/[^a-z0-9]/gi, "");
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ transform: `scale(${z})` }}>
        <defs>
          <filter id={id} filterUnits="userSpaceOnUse" x={0} y={0} width={width} height={height} colorInterpolationFilters="sRGB">
            <feImage href={staticFile(profundidad)} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid slice" result="p" />
            {/* R y G llevan la profundidad proyectada en la dirección del movimiento (0,5 = sin corrimiento) */}
            <feColorMatrix
              in="p"
              type="matrix"
              values={`${c} 0 0 0 ${0.5 - 0.5 * c}  ${s} 0 0 0 ${0.5 - 0.5 * s}  0 0 0 0 0  0 0 0 0 1`}
              result="d"
            />
            <feDisplacementMap in="SourceGraphic" in2="d" scale={escala} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <image href={staticFile(foto)} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid slice" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};
