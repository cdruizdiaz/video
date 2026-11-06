// Íconos animados para "nacieron / obstáculos / fin" (Reel 2 de DOCBA): una insignia circular de vidrio esmerilado (translúcida, borde fino)
// con un ícono de trazo simple dentro, que entra con un pop suave arriba del cuadro y se va con un fundido. Paleta de DOCBA.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { DOCBA_AZUL, DOCBA_HUESO, DOCBA_NARANJA } from "../../marcas/docba/marca";

// ---------- Constantes de animación ----------
const DIAM = 330; // px de la insignia
const Y = 430; // centro vertical
const ENTRA = 10; // cuadros del pop de entrada
const SALE = 8; // cuadros del fundido de salida
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = Easing.out(Easing.back(1.8));

export type TipoIcono = "ideas" | "obstaculo" | "fin" | "espacio" | "calendario" | "equipo";
export type IconoProyecto = { tipo: TipoIcono; inicioS: number; durS: number };

const Trazo = { stroke: DOCBA_HUESO, strokeWidth: 7, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

// post-its que "nacen" sobre un pizarrón, uno tras otro
const Ideas: React.FC<{ f: number }> = ({ f }) => {
  const nota = (i: number, x: number, y: number, c: string, r: number) => {
    const p = pop(interpolate(f, [4 + i * 6, 12 + i * 6], [0, 1], clamp));
    return <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${p})`} opacity={p}><rect x={-34} y={-34} width={68} height={68} rx={6} fill={c} /><path d="M-20 -10 H20 M-20 4 H8" stroke={DOCBA_AZUL} strokeWidth={5} strokeLinecap="round" opacity={0.6} /></g>;
  };
  return (
    <g>
      <rect x={-92} y={-70} width={184} height={140} rx={14} {...Trazo} />
      {nota(0, -44, -22, DOCBA_NARANJA, -6)}
      {nota(1, 34, -30, DOCBA_HUESO, 5)}
      {nota(2, -4, 30, "#F6B26B", -3)}
    </g>
  );
};
// persona frustrada frente a la compu: laptop con carita triste y rayito
const Obstaculo: React.FC<{ f: number }> = ({ f }) => {
  const t = interpolate(f, [4, 14], [0, 1], clamp);
  const tiembla = Math.sin(f * 1.8) * 2.5 * t;
  return (
    <g transform={`translate(${tiembla} 0)`}>
      <rect x={-86} y={-62} width={172} height={108} rx={12} {...Trazo} />
      <path d="M-110 60 H110" {...Trazo} />
      <g opacity={t}>
        <circle cx={-26} cy={-22} r={6} fill={DOCBA_HUESO} />
        <circle cx={26} cy={-22} r={6} fill={DOCBA_HUESO} />
        <path d="M-26 22 Q0 0 26 22" {...Trazo} />
      </g>
      <path d="M64 -92 L48 -66 H66 L52 -42" stroke={DOCBA_NARANJA} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={t} />
    </g>
  );
};
// aplauso: dos manos que se juntan con rayitas
const Fin: React.FC<{ f: number }> = ({ f }) => {
  const s = (Math.sin(f * 0.9) + 1) / 2;
  const sep = 26 - 22 * s;
  const rayo = interpolate(f, [4, 12], [0, 1], clamp);
  const mano = (sg: number) => <g transform={`translate(${sg * sep} 8) rotate(${sg * 18})`}><rect x={-22} y={-62} width={44} height={110} rx={22} fill={sg < 0 ? DOCBA_HUESO : DOCBA_NARANJA} /></g>;
  return (
    <g>
      {mano(-1)}
      {mano(1)}
      {[[-66, -70, -84, -92], [0, -92, 0, -118], [66, -70, 84, -92], [-96, -30, -122, -36], [96, -30, 122, -36]].map(([a, b, c, d], i) => (
        <path key={i} d={`M${a} ${b} L${c} ${d}`} {...Trazo} opacity={rayo * (0.4 + 0.6 * s)} />
      ))}
    </g>
  );
};

// trazo que se dibuja de a poco (pathLength = 1)
const dibuja = (f: number, desde: number, dur: number) => 1 - interpolate(f, [desde, desde + dur], [0, 1], clamp);
// "un espacio": un ambiente amplio en perspectiva (pared del fondo, piso, ventanal y una planta)
const Espacio: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <path d="M-96 -78 H96 V78 H-96 Z" {...Trazo} pathLength={1} strokeDasharray={1} strokeDashoffset={dibuja(f, 2, 12)} />
    <path d="M-52 -40 H52 V34 H-52 Z" {...Trazo} pathLength={1} strokeDasharray={1} strokeDashoffset={dibuja(f, 6, 12)} />
    {[[-96, -78, -52, -40], [96, -78, 52, -40], [-96, 78, -52, 34], [96, 78, 52, 34]].map(([a, b, c, d], i) => (
      <path key={i} d={`M${a} ${b} L${c} ${d}`} {...Trazo} pathLength={1} strokeDasharray={1} strokeDashoffset={dibuja(f, 10, 12)} />
    ))}
    <path d="M-16 -40 V34 M16 -40 V34 M-52 -3 H52" stroke={DOCBA_HUESO} strokeWidth={4} opacity={0.55 * interpolate(f, [16, 24], [0, 1], clamp)} fill="none" />
    <circle cx={0} cy={56} r={9} fill={DOCBA_NARANJA} opacity={interpolate(f, [20, 28], [0, 1], clamp)} />
  </g>
);
// "cerrar el año": una hoja de calendario con la grilla del mes; el último día se marca con un tilde
const Calendario: React.FC<{ f: number }> = ({ f }) => {
  const celda = (i: number, j: number) => {
    const ultima = i === 3 && j === 2;
    const p = pop(interpolate(f, [4 + (i + j) * 1.5, 10 + (i + j) * 1.5], [0, 1], clamp));
    return <rect key={`${i}${j}`} x={-62 + i * 34} y={-8 + j * 30} width={22} height={18} rx={4} fill={ultima ? DOCBA_NARANJA : DOCBA_HUESO} opacity={(ultima ? 1 : 0.55) * p} />;
  };
  const tilde = dibuja(f, 18, 8);
  return (
    <g>
      <rect x={-84} y={-76} width={168} height={152} rx={16} {...Trazo} />
      <path d="M-84 -34 H84" {...Trazo} />
      <path d="M-48 -92 V-62 M48 -92 V-62" {...Trazo} />
      {[0, 1, 2, 3].flatMap((i) => [0, 1, 2].map((j) => celda(i, j)))}
      <path d="M44 42 L54 52 L72 28" stroke={DOCBA_AZUL} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={tilde} />
    </g>
  );
};
// "con tu equipo": tres personas, la del medio un poco más grande, unidas por un arco
const Equipo: React.FC<{ f: number }> = ({ f }) => {
  const persona = (x: number, y: number, k: number, c: string, i: number) => {
    const p = pop(interpolate(f, [2 + i * 5, 10 + i * 5], [0, 1], clamp));
    return (
      <g key={i} transform={`translate(${x} ${y}) scale(${k * p})`} opacity={p}>
        <circle cx={0} cy={-34} r={20} fill={c} />
        <path d="M-34 36 Q-34 -6 0 -6 Q34 -6 34 36 Z" fill={c} />
      </g>
    );
  };
  return (
    <g>
      <path d="M-86 66 Q0 98 86 66" {...Trazo} pathLength={1} strokeDasharray={1} strokeDashoffset={dibuja(f, 14, 12)} />
      {persona(-62, 18, 0.82, DOCBA_HUESO, 0)}
      {persona(62, 18, 0.82, DOCBA_HUESO, 1)}
      {persona(0, 8, 1, DOCBA_NARANJA, 2)}
    </g>
  );
};

export const IconosProyecto: React.FC<{ iconos: IconoProyecto[]; fps?: number }> = ({ iconos, fps = 30 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {iconos.map((ic, i) => {
        const f = frame - Math.round(ic.inicioS * fps);
        const dur = Math.round(ic.durS * fps);
        if (f < 0 || f > dur) return null;
        const e = pop(interpolate(f, [0, ENTRA], [0, 1], clamp));
        const sal = interpolate(f, [dur - SALE, dur], [0, 1], clamp);
        return (
          <div key={i} style={{ position: "absolute", left: 540 - DIAM / 2, top: Y - DIAM / 2, width: DIAM, height: DIAM, borderRadius: DIAM / 2, opacity: Math.min(1, e * 2) * (1 - sal), transform: `scale(${0.6 + 0.4 * e - 0.08 * sal})`, background: "linear-gradient(145deg, rgba(48,60,67,0.55), rgba(48,60,67,0.30))", backdropFilter: "blur(22px) saturate(1.4)", border: "1.6px solid rgba(255,255,255,0.45)", boxShadow: "0 22px 60px rgba(10,14,18,0.35), inset 0 1.5px 0 rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={DIAM} height={DIAM} viewBox="-118 -118 236 236">
              {ic.tipo === "ideas" ? <Ideas f={f} /> : ic.tipo === "obstaculo" ? <Obstaculo f={f} /> : ic.tipo === "espacio" ? <Espacio f={f} /> : ic.tipo === "calendario" ? <Calendario f={f} /> : ic.tipo === "equipo" ? <Equipo f={f} /> : <Fin f={f} />}
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
