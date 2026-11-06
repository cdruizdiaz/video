// Banderas simples en SVG (3:2) de los seis países del Museo del Umbral, para el cartel de cada respuesta.
import React from "react";

const estrella = (cx: number, cy: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.382;
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  });
  return pts.join(" ");
};

const DIBUJOS: Record<string, React.ReactNode> = {
  CHINA: (
    <>
      <rect width="60" height="40" fill="#de2910" />
      <polygon points={estrella(10, 10, 6)} fill="#ffde00" />
      {[
        [20, 4],
        [24, 8],
        [24, 14],
        [20, 18],
      ].map(([x, y]) => (
        <polygon key={`${x}-${y}`} points={estrella(x, y, 2)} fill="#ffde00" />
      ))}
    </>
  ),
  NORWAY: (
    <>
      <rect width="60" height="40" fill="#ba0c2f" />
      <rect x="16" width="10" height="40" fill="#fff" />
      <rect y="15" width="60" height="10" fill="#fff" />
      <rect x="19" width="4" height="40" fill="#00205b" />
      <rect y="18" width="60" height="4" fill="#00205b" />
    </>
  ),
  MEXICO: (
    <>
      <rect width="20" height="40" fill="#006847" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#ce1126" />
      <circle cx="30" cy="20" r="6" fill="#8c5a2b" />
      <path d="M24 22 Q30 28 36 22" fill="none" stroke="#006847" strokeWidth="2" />
    </>
  ),
  INDONESIA: (
    <>
      <rect width="60" height="20" fill="#e70011" />
      <rect y="20" width="60" height="20" fill="#fff" />
    </>
  ),
  MADAGASCAR: (
    <>
      <rect width="60" height="40" fill="#fc3d32" />
      <rect y="20" x="20" width="40" height="20" fill="#007e3a" />
      <rect width="20" height="40" fill="#fff" />
    </>
  ),
  GHANA: (
    <>
      <rect width="60" height="14" fill="#ce1126" />
      <rect y="13" width="60" height="14" fill="#fcd116" />
      <rect y="26" width="60" height="14" fill="#006b3f" />
      <polygon points={estrella(30, 20.5, 7)} fill="#000" />
    </>
  ),
};

export const Bandera: React.FC<{ pais: string; ancho: number }> = ({ pais, ancho }) => {
  const dibujo = DIBUJOS[pais];
  if (!dibujo) return null;
  return (
    <svg
      width={ancho}
      height={(ancho * 2) / 3}
      viewBox="0 0 60 40"
      style={{ display: "block", borderRadius: ancho * 0.1, boxShadow: "0 0 0 2px rgba(255,237,225,0.9)" }}
    >
      <clipPath id={`bandera-${pais}`}>
        <rect width="60" height="40" rx="5" />
      </clipPath>
      <g clipPath={`url(#bandera-${pais})`}>{dibujo}</g>
    </svg>
  );
};
