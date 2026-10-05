// Objetos 2,5D reutilizables, en el estilo de Bloomie (contorno marrón grueso, volumen con degradés de luz):
//  - Barra25D: barra de pesas con discos con espesor (caras en perspectiva + canto extruido), que se curva con el peso
//  - GotaSudor: gota de sudor con brillo que salta y cae
// Coordenadas en px del cuadro. `luz` = ángulo de donde viene la luz (grados, -90 arriba, -135 arriba a la izquierda).
import React from "react";

const TINTA = "#3b2418";
const TRAZO = 6;

// ---------- Barra con discos ----------
const BARRA = {
  grosor: 14, // px a escala 1
  metal: ["#f4f6f8", "#9aa3ad", "#5a6370"], // claro, medio, oscuro
  disco: ["#4a4f58", "#2a2d33", "#15171a"],
  franja: "#e6292a", // franja de color en la cara del disco
  espesor: 9, // capas de canto (2,5D)
  perspectiva: 0.34, // ancho aparente de la cara del disco respecto de su alto
};

export const Barra25D: React.FC<{
  x: number; // centro de la barra
  y: number;
  largo: number; // px de punta a punta
  radioDisco: number; // px
  curva?: number; // 0 recta … 1 bien curvada (las puntas caen por el peso)
  inclina?: number; // grados (la barra se ladea)
  luz?: number;
  id?: string;
}> = ({ x, y, largo, radioDisco, curva = 0, inclina = 0, luz = -135, id = "barra" }) => {
  const L = largo / 2;
  const caida = curva * radioDisco * 0.55; // cuánto bajan las puntas
  const g = BARRA.grosor;
  // Lado hacia el que se ve el canto de los discos (contrario a la luz)
  const r = (luz * Math.PI) / 180;
  const ladoCanto = Math.cos(r) < 0 ? 1 : -1;
  const disco = (lado: number) => {
    const cx = lado * (L - radioDisco * 0.55);
    const cy = caida * 0.92;
    const ang = (lado * Math.atan2(caida, L) * 180) / Math.PI; // el disco sigue la curva de la barra
    const rx = radioDisco * BARRA.perspectiva;
    return (
      <g key={lado} transform={`translate(${cx} ${cy}) rotate(${ang})`}>
        {/* Canto: copias corridas hacia el lado de la sombra */}
        {Array.from({ length: BARRA.espesor }, (_, k) => BARRA.espesor - k).map((k) => (
          <ellipse key={k} cx={ladoCanto * k * 2.4} cy={0} rx={rx} ry={radioDisco} fill={BARRA.disco[2]} stroke={TINTA} strokeWidth={k === BARRA.espesor ? TRAZO : 0} />
        ))}
        {/* Cara del disco */}
        <ellipse cx={0} cy={0} rx={rx} ry={radioDisco} fill={`url(#${id}-disco)`} stroke={TINTA} strokeWidth={TRAZO} />
        <ellipse cx={0} cy={0} rx={rx * 0.78} ry={radioDisco * 0.78} fill="none" stroke={BARRA.franja} strokeWidth={radioDisco * 0.08} />
        <ellipse cx={0} cy={0} rx={rx * 0.26} ry={radioDisco * 0.26} fill={`url(#${id}-metal)`} stroke={TINTA} strokeWidth={3} />
        {/* Brillo del lado de la luz */}
        <path
          d={`M${-rx * 0.55} ${-radioDisco * 0.62}Q${-rx * 0.85} 0 ${-rx * 0.55} ${radioDisco * 0.62}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth={radioDisco * 0.06}
          strokeLinecap="round"
          opacity={0.35}
        />
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${inclina})`}>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BARRA.metal[0]} />
          <stop offset="0.45" stopColor={BARRA.metal[1]} />
          <stop offset="1" stopColor={BARRA.metal[2]} />
        </linearGradient>
        <linearGradient id={`${id}-disco`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BARRA.disco[0]} />
          <stop offset="0.6" stopColor={BARRA.disco[1]} />
          <stop offset="1" stopColor={BARRA.disco[2]} />
        </linearGradient>
      </defs>
      {/* Barra (curva por el peso): contorno y metal con brillo */}
      <path d={`M${-L} ${caida}Q0 ${-caida * 0.9} ${L} ${caida}`} fill="none" stroke={TINTA} strokeWidth={g + TRAZO * 2} strokeLinecap="round" />
      <path d={`M${-L} ${caida}Q0 ${-caida * 0.9} ${L} ${caida}`} fill="none" stroke={BARRA.metal[1]} strokeWidth={g} strokeLinecap="round" />
      <path d={`M${-L} ${caida - g * 0.22}Q0 ${-caida * 0.9 - g * 0.22} ${L} ${caida - g * 0.22}`} fill="none" stroke={BARRA.metal[0]} strokeWidth={g * 0.3} strokeLinecap="round" opacity={0.9} />
      {disco(-1)}
      {disco(1)}
    </g>
  );
};

// ---------- Gota de sudor ----------
// t: 0…1 (sale de la cabeza hacia `lado`, sube un poco y cae)
export const GotaSudor: React.FC<{ x: number; y: number; t: number; lado: number; tamano?: number }> = ({ x, y, t, lado, tamano = 26 }) => {
  if (t <= 0 || t >= 1) return null;
  const dx = lado * 90 * t;
  const dy = -60 * t + 220 * t * t;
  const op = t < 0.8 ? 1 : (1 - t) / 0.2;
  const s = tamano;
  return (
    <g transform={`translate(${x + dx} ${y + dy}) rotate(${lado * 25 * t})`} opacity={op}>
      <path d={`M0 ${-s}C${s * 0.55} ${-s * 0.2} ${s * 0.65} ${s * 0.35} 0 ${s * 0.6}C${-s * 0.65} ${s * 0.35} ${-s * 0.55} ${-s * 0.2} 0 ${-s}Z`} fill="#7fd0f0" stroke={TINTA} strokeWidth={4} />
      <ellipse cx={-s * 0.18} cy={s * 0.05} rx={s * 0.12} ry={s * 0.2} fill="#ffffff" opacity={0.8} />
    </g>
  );
};
