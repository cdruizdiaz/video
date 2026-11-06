// Góndola de supermercado dibujada por código, en dos capas: `fondo` (estantes con productos, desenfocados por
// profundidad) y `frente` (el borde de la góndola con etiquetas de precio, nítido). El personaje va entre las dos,
// así queda detrás del primer plano sin video ni mapa de profundidad. Se usa mientras no hay video de fondo.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

const ANCHO = 1080;
const PARED = ["#0E1630", "#16234A"]; // degradé de la pared del fondo
const ESTANTES = [330, 640, 950, 1260]; // y del borde de cada estante (px)
const ALTO_ESTANTE = 26;
const COLORES = ["#E63946", "#F4A261", "#2A9D8F", "#E9C46A", "#457B9D", "#8AB17D", "#F1FAEE", "#B5179E", "#FF7F11"];
const DESENFOQUE_FONDO = 4; // px: profundidad de campo
const OSCURECER_FONDO = 0.38; // velo oscuro sobre los productos (contraste con los títulos)
const DERIVA = { px: 10, periodo: 150 }; // movimiento lento del fondo (paralaje)
const BORDE_FRENTE = 70; // alto del borde de precios del mueble de adelante
const ETIQUETAS = [
  { x: 70, precio: "$ 1.299" },
  { x: 330, precio: "$ 849" },
  { x: 590, precio: "$ 2.150" },
  { x: 850, precio: "$ 399" },
];

// Pseudoaleatorio fijo (mismos productos en cada cuadro)
const azar = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const productos = ESTANTES.flatMap((y, e) => {
  const out: { x: number; y: number; w: number; h: number; color: string; botella: boolean }[] = [];
  let x = -20 + azar(e) * 30;
  let i = 0;
  while (x < ANCHO + 20) {
    const w = 70 + azar(e * 50 + i) * 70;
    const h = 120 + azar(e * 70 + i + 3) * 120;
    out.push({ x, y: y - h, w, h, color: COLORES[Math.floor(azar(e * 90 + i + 7) * COLORES.length)], botella: azar(e * 30 + i + 11) > 0.65 });
    x += w + 8 + azar(e * 20 + i) * 10;
    i++;
  }
  return out;
});

export const Gondola: React.FC<{ capa: "fondo" | "frente"; frente: number }> = ({ capa, frente }) => {
  const f = useCurrentFrame();
  if (capa === "fondo") {
    const dx = Math.sin((f / DERIVA.periodo) * 2 * Math.PI) * DERIVA.px;
    return (
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${PARED[0]}, ${PARED[1]})` }}>
        <svg width={ANCHO} height={1920} style={{ filter: `blur(${DESENFOQUE_FONDO}px)`, transform: `translateX(${dx}px)` }}>
          {productos.map((p, i) =>
            p.botella ? (
              <g key={i}>
                <rect x={p.x + p.w * 0.3} y={p.y} width={p.w * 0.4} height={p.h * 0.25} rx={6} fill={p.color} />
                <rect x={p.x + p.w * 0.1} y={p.y + p.h * 0.2} width={p.w * 0.8} height={p.h * 0.8} rx={18} fill={p.color} />
                <rect x={p.x + p.w * 0.1} y={p.y + p.h * 0.5} width={p.w * 0.8} height={p.h * 0.18} fill="#ffffff" opacity={0.55} />
              </g>
            ) : (
              <g key={i}>
                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={6} fill={p.color} />
                <rect x={p.x + 8} y={p.y + p.h * 0.3} width={p.w - 16} height={p.h * 0.22} rx={4} fill="#ffffff" opacity={0.5} />
              </g>
            ),
          )}
          {ESTANTES.map((y) => (
            <g key={y}>
              <rect x={-40} y={y} width={ANCHO + 80} height={ALTO_ESTANTE} fill="#C9D1E0" />
              <rect x={-40} y={y + ALTO_ESTANTE} width={ANCHO + 80} height={10} fill="#5B6680" />
            </g>
          ))}
        </svg>
        <AbsoluteFill style={{ backgroundColor: `rgba(8, 12, 30, ${OSCURECER_FONDO})` }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <svg width={ANCHO} height={1920}>
        <defs>
          <linearGradient id="gondola-frente" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2B3A67" />
            <stop offset="1" stopColor="#0B1124" />
          </linearGradient>
        </defs>
        <rect x={0} y={frente} width={ANCHO} height={1920 - frente} fill="url(#gondola-frente)" />
        <rect x={0} y={frente} width={ANCHO} height={BORDE_FRENTE} fill="#E3E8F2" />
        <rect x={0} y={frente + BORDE_FRENTE} width={ANCHO} height={8} fill="#8C97B0" />
        {ETIQUETAS.map((e) => (
          <g key={e.x} transform={`translate(${e.x}, ${frente + 8})`}>
            <rect width={160} height={BORDE_FRENTE - 16} rx={8} fill="#FFD60A" />
            <text x={80} y={(BORDE_FRENTE - 16) / 2 + 12} textAnchor="middle" fontFamily="Arial Black, Arial" fontWeight={900} fontSize={32} fill="#C1121F">
              {e.precio}
            </text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
