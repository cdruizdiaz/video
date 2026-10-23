// Título que entra desde abajo por una máscara (overflow: hidden) con curva Easy Ease y desenfoque SOLO vertical
// mientras se desplaza (proporcional a la velocidad: en 0 cuando el texto se detiene). Sale hacia arriba igual.
// El blur vertical es un filtro SVG (feGaussianBlur "0 N"): el blur() de CSS borronea parejo en las dos direcciones.
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

const ENTRADA = 12; // frames
const SALIDA = 10;
const RECORRIDO = 115; // % del alto de la máscara
const BLUR_MAX = 16; // px a la velocidad máxima
const EASY_EASE = Easing.bezier(0.33, 0, 0.67, 1); // "Easy Ease" de After Effects
const VEL_MAX = 1.5; // derivada máxima de la curva (normaliza el blur)
const RELLENO_MARCA = 0.16; // × tamaño: aire alrededor del texto en el estilo "marca"

const avance = (f: number, desde: number, dura: number) =>
  interpolate(f, [desde, desde + dura], [0, 1], { easing: EASY_EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const TituloMascara: React.FC<{
  id: string; // único en el cuadro (filtro SVG)
  texto: string;
  entra: number; // frame
  sale: number | null;
  tam: number; // px
  interlinea: number;
  fuente: string;
  color: string;
  caja?: { fondo: string; color: string } | null; // estilo "marca": texto sobre una caja de color
}> = ({ id, texto, entra, sale, tam, interlinea, fuente, color, caja }) => {
  const f = useCurrentFrame();
  if (f < entra) return null;
  const pe = avance(f, entra, ENTRADA);
  const ps = sale === null ? 0 : avance(f, sale, SALIDA);
  if (ps >= 1) return null;
  const y = (1 - pe) * RECORRIDO - ps * RECORRIDO;
  // velocidad del frame (derivada discreta), normalizada
  const ve = (pe - avance(f - 1, entra, ENTRADA)) * ENTRADA;
  const vs = sale === null ? 0 : (ps - avance(f - 1, sale, SALIDA)) * SALIDA;
  const blur = BLUR_MAX * Math.min(1, Math.max(ve, vs) / VEL_MAX);
  const relleno = caja ? tam * RELLENO_MARCA : 0;
  const alto = tam * interlinea + 2 * relleno;
  return (
    <div style={{ height: alto, overflow: "hidden", display: "flex", justifyContent: "center" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-5%" y="-60%" width="110%" height="220%">
          <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
        </filter>
      </svg>
      <div
        style={{
          transform: `translateY(${y}%)`,
          filter: blur > 0.05 ? `url(#${id})` : undefined,
          fontFamily: fuente,
          fontWeight: 800,
          fontSize: tam,
          lineHeight: interlinea,
          letterSpacing: -tam * 0.02,
          whiteSpace: "nowrap",
          color: caja ? caja.color : color,
          backgroundColor: caja ? caja.fondo : undefined,
          padding: caja ? `${relleno}px ${relleno * 1.6}px` : undefined,
          borderRadius: caja ? relleno : undefined,
        }}
      >
        {texto}
      </div>
    </div>
  );
};
