// Piezas navideñas reutilizables, en el estilo de Bloomie (contorno marrón grueso, colores planos con una sombra):
// fondo de noche nevada, nieve que cae, arbolito (con o sin estrella) y destello. Todo en SVG, en px del cuadro,
// y determinístico (la nieve y las estrellitas dependen solo del frame y de la semilla).
import React from "react";
import { random } from "remotion";

const TINTA = "#3b2418";
const TRAZO = 6;

// ---------- Colores ----------
export const NAVIDAD = {
  cieloArriba: "#0c1838",
  cieloAbajo: "#2c4f8f",
  luna: "#fff4cf",
  lunaSombra: "#f1dfa6",
  estrellita: "#fff8e1",
  lomaLejos: "#b9cbe6",
  lomaCerca: "#dde8f6",
  nieve: "#f6f9ff",
  nieveSombra: "#c9d8ee",
  pino: "#1b3462",
  verde: "#2f8f4e",
  verdeOscuro: "#1f6b3a",
  tronco: "#7a4a2a",
  rojo: "#e6292a",
  dorado: "#ffc93c",
  celeste: "#5fb7ce",
  violeta: "#9b5de5",
};

// ---------- Fondo: noche nevada ----------
const ESTRELLITAS = 70; // estrellitas del cielo
const PINOS = 9; // pinos lejanos

export const FondoNocheNevada: React.FC<{ ancho: number; alto: number; suelo: number; f: number; semilla?: number }> = ({
  ancho,
  alto,
  suelo,
  f,
  semilla = 1,
}) => {
  const r = (k: string) => random(`noche-${semilla}-${k}`);
  return (
    <g>
      <defs>
        <linearGradient id={`cielo-${semilla}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={NAVIDAD.cieloArriba} />
          <stop offset="1" stopColor={NAVIDAD.cieloAbajo} />
        </linearGradient>
        <radialGradient id={`halo-${semilla}`}>
          <stop offset="0" stopColor={NAVIDAD.luna} stopOpacity={0.45} />
          <stop offset="1" stopColor={NAVIDAD.luna} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={ancho} height={alto} fill={`url(#cielo-${semilla})`} />
      {/* Estrellitas que titilan */}
      {Array.from({ length: ESTRELLITAS }, (_, i) => {
        const x = r(`ex${i}`) * ancho;
        const y = r(`ey${i}`) * suelo * 0.75;
        const tam = 1.5 + r(`et${i}`) * 3;
        const brillo = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(f * (0.05 + r(`ev${i}`) * 0.08) + r(`ef${i}`) * 6.28));
        return <circle key={i} cx={x} cy={y} r={tam} fill={NAVIDAD.estrellita} opacity={brillo} />;
      })}
      {/* Luna con halo */}
      <circle cx={ancho * 0.8} cy={alto * 0.12} r={190} fill={`url(#halo-${semilla})`} />
      <circle cx={ancho * 0.8} cy={alto * 0.12} r={80} fill={NAVIDAD.luna} />
      <circle cx={ancho * 0.8 - 22} cy={alto * 0.12 - 14} r={14} fill={NAVIDAD.lunaSombra} />
      <circle cx={ancho * 0.8 + 26} cy={alto * 0.12 + 22} r={10} fill={NAVIDAD.lunaSombra} />
      {/* Lomas nevadas y pinos lejanos */}
      <path
        d={`M0 ${suelo - 170}Q${ancho * 0.25} ${suelo - 290} ${ancho * 0.55} ${suelo - 190}T${ancho} ${suelo - 230}V${suelo}H0Z`}
        fill={NAVIDAD.lomaLejos}
      />
      {Array.from({ length: PINOS }, (_, i) => {
        const x = (i + 0.3 + r(`px${i}`) * 0.4) * (ancho / PINOS);
        const h = 90 + r(`ph${i}`) * 90;
        const base = suelo - 150 - r(`py${i}`) * 40;
        return <path key={i} d={`M${x} ${base - h}L${x + h * 0.3} ${base}H${x - h * 0.3}Z`} fill={NAVIDAD.pino} opacity={0.8} />;
      })}
      <path d={`M0 ${suelo - 70}Q${ancho * 0.4} ${suelo - 150} ${ancho} ${suelo - 80}V${alto}H0Z`} fill={NAVIDAD.lomaCerca} />
      {/* Suelo de nieve */}
      <path d={`M0 ${suelo}Q${ancho * 0.5} ${suelo - 30} ${ancho} ${suelo}V${alto}H0Z`} fill={NAVIDAD.nieve} />
      <path d={`M0 ${suelo + 40}Q${ancho * 0.5} ${suelo + 15} ${ancho} ${suelo + 40}`} stroke={NAVIDAD.nieveSombra} strokeWidth={10} fill="none" opacity={0.6} />
    </g>
  );
};

// ---------- Nieve que cae ----------
// capa "atras" (copos chicos y lentos) o "adelante" (más grandes, más rápidos, pocos)
export const Nieve: React.FC<{ ancho: number; alto: number; f: number; capa?: "atras" | "adelante"; cantidad?: number; semilla?: number }> = ({
  ancho,
  alto,
  f,
  capa = "atras",
  cantidad,
  semilla = 1,
}) => {
  const adelante = capa === "adelante";
  const n = cantidad ?? (adelante ? 28 : 90);
  const r = (k: string) => random(`nieve-${capa}-${semilla}-${k}`);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const tam = adelante ? 7 + r(`t${i}`) * 7 : 2.5 + r(`t${i}`) * 4;
        const vel = adelante ? 3 + r(`v${i}`) * 2 : 1.2 + r(`v${i}`) * 1.4; // px por frame
        const y = ((r(`y${i}`) * (alto + 60) + f * vel) % (alto + 60)) - 30;
        const x = r(`x${i}`) * ancho + Math.sin(f * 0.03 + r(`f${i}`) * 6.28) * (adelante ? 30 : 16);
        return <circle key={i} cx={x} cy={y} r={tam} fill="#ffffff" opacity={adelante ? 0.95 : 0.75} />;
      })}
    </g>
  );
};

// ---------- Arbolito ----------
// Origen en la base del tronco (sobre el piso). `alto` = del piso a la punta. Sin estrella: la punta queda libre
// (para que un personaje haga de estrella; ver puntaArbolito).
const ARBOL_PISOS = 3;
const ARBOL_TRONCO = 0.09; // fracción del alto
// Altura de la punta de las ramas (y, hacia arriba negativo) respecto del piso
export const puntaArbolito = (alto: number) => {
  const tronco = alto * ARBOL_TRONCO;
  return -tronco - (alto - tronco) * (0.42 + ((ARBOL_PISOS - 1) / ARBOL_PISOS) * 0.58);
};

export const Arbolito: React.FC<{ alto: number; estrella?: boolean; brillo?: number; f?: number }> = ({ alto, estrella = false, brillo = 0, f = 0 }) => {
  const tronco = alto * ARBOL_TRONCO;
  const pisos = ARBOL_PISOS;
  const verdeAlto = alto - tronco;
  const ancho = alto * 0.62;
  const capas = Array.from({ length: pisos }, (_, i) => {
    // De abajo hacia arriba: cada piso más chico y superpuesto con el de abajo
    const fr = i / pisos;
    const base = -tronco - verdeAlto * fr * 0.78;
    const arriba = -tronco - verdeAlto * (0.42 + fr * 0.58);
    const w = ancho * (1 - fr * 0.33) * 0.5;
    return { base, arriba, w };
  });
  const bolitas = [
    [-0.22, 0.2, NAVIDAD.rojo],
    [0.18, 0.26, NAVIDAD.dorado],
    [-0.05, 0.36, NAVIDAD.celeste],
    [0.26, 0.12, NAVIDAD.violeta],
    [-0.3, 0.09, NAVIDAD.dorado],
    [0.1, 0.5, NAVIDAD.rojo],
    [-0.14, 0.58, NAVIDAD.dorado],
    [0.06, 0.7, NAVIDAD.celeste],
  ] as const;
  return (
    <g>
      {/* Tronco */}
      <rect x={-tronco * 0.55} y={-tronco - 6} width={tronco * 1.1} height={tronco + 6} rx={6} fill={NAVIDAD.tronco} stroke={TINTA} strokeWidth={TRAZO} />
      {/* Pisos de ramas (con su sombra a la derecha) */}
      {capas.map((c, i) => (
        <g key={i}>
          <path
            d={`M0 ${c.arriba}C${c.w * 0.3} ${c.arriba + (c.base - c.arriba) * 0.35} ${c.w * 0.75} ${c.base - 40} ${c.w} ${c.base - 6}Q${c.w * 0.5} ${c.base + 22} 0 ${c.base + 6}Q${-c.w * 0.5} ${c.base + 22} ${-c.w} ${c.base - 6}C${-c.w * 0.75} ${c.base - 40} ${-c.w * 0.3} ${c.arriba + (c.base - c.arriba) * 0.35} 0 ${c.arriba}Z`}
            fill={NAVIDAD.verde}
            stroke={TINTA}
            strokeWidth={TRAZO}
            strokeLinejoin="round"
          />
          <path
            d={`M0 ${c.arriba + 10}C${c.w * 0.3} ${c.arriba + (c.base - c.arriba) * 0.35} ${c.w * 0.72} ${c.base - 40} ${c.w * 0.92} ${c.base - 10}Q${c.w * 0.5} ${c.base + 12} ${c.w * 0.2} ${c.base}Z`}
            fill={NAVIDAD.verdeOscuro}
            opacity={0.55}
          />
        </g>
      ))}
      {/* Guirnalda dorada */}
      {[0.25, 0.48].map((h, i) => {
        const y = -tronco - verdeAlto * h;
        const w = ancho * 0.5 * (1 - h * 0.85);
        return <path key={i} d={`M${-w} ${y - 20}Q0 ${y + 30} ${w} ${y - 40}`} stroke={NAVIDAD.dorado} strokeWidth={7} fill="none" strokeDasharray="2 14" strokeLinecap="round" />;
      })}
      {/* Bolitas */}
      {bolitas.map(([x, h, color], i) => {
        const cy = -tronco - verdeAlto * h;
        const cx = x * ancho * (1 - h * 0.8);
        const titila = 0.75 + 0.25 * Math.sin(f * 0.15 + i);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={alto * 0.024} fill={color} stroke={TINTA} strokeWidth={4} />
            <circle cx={cx - alto * 0.008} cy={cy - alto * 0.008} r={alto * 0.007} fill="#ffffff" opacity={titila} />
          </g>
        );
      })}
      {estrella && <Estrella x={0} y={puntaArbolito(alto) - alto * 0.05} radio={alto * 0.08} />}
      {brillo > 0 && <circle cx={0} cy={puntaArbolito(alto)} r={alto * 0.25} fill={NAVIDAD.dorado} opacity={0.25 * brillo} />}
    </g>
  );
};

export const Estrella: React.FC<{ x: number; y: number; radio: number; color?: string }> = ({ x, y, radio, color = NAVIDAD.dorado }) => {
  const puntos = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? radio * 0.45 : radio;
    return `${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`;
  });
  return <path d={`M${puntos.join("L")}Z`} fill={color} stroke={TINTA} strokeWidth={TRAZO} strokeLinejoin="round" />;
};

// ---------- Destello (brillo de 4 puntas) ----------
// t: 0…1 (crece, gira y se apaga)
export const Destello: React.FC<{ x: number; y: number; t: number; tamano?: number; color?: string }> = ({ x, y, t, tamano = 70, color = "#ffffff" }) => {
  if (t <= 0 || t >= 1) return null;
  const s = Math.sin(t * Math.PI);
  const r = tamano * s;
  const fino = r * 0.16;
  const estrella = `M0 ${-r}Q${fino} ${-fino} ${r} 0Q${fino} ${fino} 0 ${r}Q${-fino} ${fino} ${-r} 0Q${-fino} ${-fino} 0 ${-r}Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${t * 90})`}>
      <circle r={r * 0.9} fill={color} opacity={0.25 * s} />
      <path d={estrella} fill={color} />
      <path d={estrella} fill={color} transform="rotate(45) scale(0.5)" opacity={0.8} />
    </g>
  );
};
