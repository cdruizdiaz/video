// Pizarra del video "Teorema de Pitágoras" (guion_teorema-pitagoras.md): las 6 escenas de la explicación,
// sincronizadas con las líneas del diálogo (t.linea("l06").desde…). Coordenadas de la pizarra: 1000 × 1050.
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FUENTE } from "../../plantillas/ExplicacionGeometrica/ExplicacionGeometrica";
import type { Tiempos } from "../../plantillas/ExplicacionGeometrica/calculos";

// ---------- Estilo ----------
const W = 1000;
const H = 1050;
const TINTA = "#1f2340";
export const COLOR_A = "#2fa7e8"; // cateto a (celeste)
export const COLOR_B = "#ff8a1f"; // cateto b (naranja)
export const COLOR_C = "#e3197c"; // hipotenusa (fucsia)
const TURQUESA = "#19c9c9";
const VERDE = "#8fd694";
const ROJO = "#e23b3b";
const TRAZO = 9;
const FUNDIDO = 10; // frames de entrada/salida de cada escena

// ---------- Utilidades ----------
const suave = Easing.bezier(0.45, 0, 0.25, 1);
// 0 → 1 entre los frames a y b (con easing)
const avance = (f: number, a: number, b: number) => interpolate(f, [a, Math.max(a + 1, b)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
const mezcla = (a: number, b: number, k: number) => a + (b - a) * k;
type P = [number, number];
const sumar = (p: P, q: P, k = 1): P => [p[0] + q[0] * k, p[1] + q[1] * k];
const dist = (p: P, q: P) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const poli = (pts: P[]) => pts.map((p) => p.join(",")).join(" ");

// Fracción de una línea del diálogo (0 = cuando empieza, 1 = cuando termina)
const en = (t: Tiempos, id: string, k = 0) => {
  const l = t.linea(id);
  return Math.round(l.desde + (l.hasta - l.desde) * k);
};

// Segmento que se dibuja de a poco
const Trazo: React.FC<{ a: P; b: P; k: number; color: string; ancho?: number; guiones?: string }> = ({ a, b, k, color, ancho = TRAZO, guiones }) => {
  if (k <= 0) return null;
  const fin = sumar(a, [b[0] - a[0], b[1] - a[1]], k);
  return <line x1={a[0]} y1={a[1]} x2={fin[0]} y2={fin[1]} stroke={color} strokeWidth={ancho} strokeLinecap="round" strokeDasharray={guiones} />;
};

// Etiqueta que aparece con un "pop" (crece un poco más y vuelve)
const Etiqueta: React.FC<{ x: number; y: number; k: number; children: React.ReactNode; color?: string; tam?: number; giro?: number; fondo?: boolean }> = ({
  x,
  y,
  k,
  children,
  color = TINTA,
  tam = 44,
  giro = 0,
  fondo = true,
}) => {
  if (k <= 0) return null;
  const s = k < 1 ? interpolate(k, [0, 0.7, 1], [0.3, 1.12, 1]) : 1;
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`} opacity={Math.min(1, k * 2)}>
      {fondo && <rect x={-tam * 0.35 * String(children).length * 0.62 - 18} y={-tam * 0.75} width={tam * 0.7 * String(children).length * 0.62 + 36} height={tam * 1.35} rx={tam * 0.4} fill="#ffffff" opacity={0.9} />}
      <text textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={tam} fill={color}>
        {children}
      </text>
    </g>
  );
};

// Escena que entra y sale con un fundido (como si se borrara la pizarra)
const Escena: React.FC<{ t: Tiempos; n: number; children: (f: number) => React.ReactNode }> = ({ t, n, children }) => {
  const f = useCurrentFrame();
  const e = t.escenas[n];
  if (!e || f < e.desde || f >= e.hasta) return null;
  const op = interpolate(f, [e.desde, e.desde + FUNDIDO, e.hasta - FUNDIDO, e.hasta], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <g opacity={n === 1 ? Math.min(op, 1) : op}>{children(f)}</g>;
};

// Cuadrado construido hacia afuera de un lado PQ (alejándose del punto R)
const cuadradoSobre = (p: P, q: P, r: P): P[] => {
  const v: P = [q[0] - p[0], q[1] - p[1]];
  let n: P = [-v[1], v[0]];
  const m: P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  if ((r[0] - m[0]) * n[0] + (r[1] - m[1]) * n[1] > 0) n = [-n[0], -n[1]];
  return [p, q, sumar(q, n), sumar(p, n)];
};

// ---------- Escena 1: la carrera al kiosco ----------
const CUADRA = 150;
const ESQ_A: P = [200, 760]; // salida (abajo a la izquierda)
const ESQ_C: P = [200 + 4 * CUADRA, 760]; // esquina del ángulo recto
const ESQ_B: P = [200 + 4 * CUADRA, 760 - 3 * CUADRA]; // kiosco
const COLOR_BENJA = "#23295e";
const COLOR_SOFI = "#e0177a";

const Parque: React.FC<{ t: Tiempos; f: number }> = ({ t, f }) => {
  const largada = t.linea("l02").hasta + 2;
  const fin = t.linea("l03").desde - 4;
  const u = avance(f, largada, fin); // la carrera (Benja recorre 7 cuadras en ese tiempo)
  const lin = (k: number) => k; // misma velocidad para los dos
  const recB = 7 * CUADRA * lin(u);
  const posB: P = recB <= 4 * CUADRA ? [ESQ_A[0] + recB, ESQ_A[1]] : [ESQ_C[0], ESQ_C[1] - (recB - 4 * CUADRA)];
  const recS = Math.min(5 * CUADRA, 7 * CUADRA * lin(u));
  const kS = recS / (5 * CUADRA);
  const posS = sumar(ESQ_A, [ESQ_B[0] - ESQ_A[0], ESQ_B[1] - ESQ_A[1]], kS);
  const entra = avance(f, 0, 18);
  const arboles: P[] = [
    [290, 400],
    [380, 640],
    [520, 420],
    [640, 660],
    [700, 360],
    [300, 560],
    [560, 560],
  ];
  return (
    <g opacity={entra}>
      <Etiqueta x={500} y={120} k={avance(f, 4, 16)} tam={54}>
        ¿Quién llega primero al kiosco?
      </Etiqueta>
      {/* Parque y veredas */}
      <rect x={ESQ_A[0] - 22} y={ESQ_B[1] - 22} width={4 * CUADRA + 44} height={3 * CUADRA + 44} rx={18} fill="#dfe3e8" />
      <rect x={ESQ_A[0]} y={ESQ_B[1]} width={4 * CUADRA} height={3 * CUADRA} rx={10} fill={VERDE} stroke="#5fae66" strokeWidth={5} />
      {arboles.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={30} fill="#4fa457" opacity={0.85} />
      ))}
      {/* Kiosco */}
      <g transform={`translate(${ESQ_B[0] + 18} ${ESQ_B[1] - 22})`}>
        <rect x={0} y={-70} width={120} height={70} rx={8} fill="#ffd166" stroke={TINTA} strokeWidth={4} />
        <path d="M -10 -70 L 60 -110 L 130 -70 Z" fill={COLOR_SOFI} stroke={TINTA} strokeWidth={4} />
        <text x={60} y={-28} textAnchor="middle" fontFamily={FUENTE} fontWeight={700} fontSize={26} fill={TINTA}>
          KIOSCO
        </text>
      </g>
      {/* Recorridos */}
      <polyline points={poli(recB <= 4 * CUADRA ? [ESQ_A, posB] : [ESQ_A, ESQ_C, posB])} fill="none" stroke={COLOR_BENJA} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 22" />
      <line x1={ESQ_A[0]} y1={ESQ_A[1]} x2={posS[0]} y2={posS[1]} stroke={COLOR_SOFI} strokeWidth={10} strokeLinecap="round" strokeDasharray="2 22" />
      {/* Corredores */}
      <circle cx={posB[0]} cy={posB[1]} r={26} fill={COLOR_BENJA} stroke="#fff" strokeWidth={5} />
      <text x={posB[0]} y={posB[1] + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={28} fill="#fff">
        B
      </text>
      <circle cx={posS[0]} cy={posS[1]} r={26} fill={COLOR_SOFI} stroke="#fff" strokeWidth={5} />
      <text x={posS[0]} y={posS[1] + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={28} fill="#fff">
        S
      </text>
      {/* Contadores de cuadras */}
      <Etiqueta x={ESQ_C[0] - 60} y={ESQ_A[1] + 80} k={avance(f, largada, largada + 8)} color={COLOR_BENJA} tam={40}>
        {`Benja: ${Math.min(7, Math.floor(recB / CUADRA + 0.001))} cuadras`}
      </Etiqueta>
      <Etiqueta x={430} y={300} k={avance(f, largada, largada + 8)} color={COLOR_SOFI} tam={40}>
        {`Sofi: ${Math.min(5, Math.floor(recS / CUADRA + 0.001))} cuadras`}
      </Etiqueta>
    </g>
  );
};

// ---------- Escena 2: el triángulo rectángulo ----------
const Triangulo: React.FC<{ t: Tiempos; f: number }> = ({ t, f }) => {
  const e = t.escenas[2].desde;
  const kParque = 1 - avance(f, e, e + 20);
  const kAC = avance(f, e + 6, e + 24);
  const kCB = avance(f, e + 18, e + 36);
  const kAB = avance(f, e + 30, e + 50);
  const kRecto = avance(f, en(t, "l06", 0.75), en(t, "l06", 0.9));
  const kCatetos = avance(f, en(t, "l07", 0.15), en(t, "l07", 0.3));
  const kHip = avance(f, en(t, "l07", 0.7), en(t, "l07", 0.85));
  const ang = (Math.atan2(ESQ_B[1] - ESQ_A[1], ESQ_B[0] - ESQ_A[0]) * 180) / Math.PI;
  const L = 46; // lado del cuadradito del ángulo recto
  return (
    <g>
      <rect x={ESQ_A[0]} y={ESQ_B[1]} width={4 * CUADRA} height={3 * CUADRA} rx={10} fill={VERDE} opacity={0.5 * kParque} />
      <polygon points={poli([ESQ_A, ESQ_C, ESQ_B])} fill={TURQUESA} opacity={0.18 * kAB} />
      <Trazo a={ESQ_A} b={ESQ_C} k={kAC} color={COLOR_B} />
      <Trazo a={ESQ_C} b={ESQ_B} k={kCB} color={COLOR_A} />
      <Trazo a={ESQ_A} b={ESQ_B} k={kAB} color={COLOR_C} />
      {kRecto > 0 && (
        <g opacity={kRecto}>
          <polyline points={poli([[ESQ_C[0] - L, ESQ_C[1]], [ESQ_C[0] - L, ESQ_C[1] - L], [ESQ_C[0], ESQ_C[1] - L]])} fill="none" stroke={TINTA} strokeWidth={5} />
          <circle cx={ESQ_C[0] - L / 2} cy={ESQ_C[1] - L / 2} r={5} fill={TINTA} />
        </g>
      )}
      <Etiqueta x={ESQ_C[0] - 110} y={ESQ_C[1] - 110} k={kRecto} tam={46}>
        90°
      </Etiqueta>
      <Etiqueta x={ESQ_C[0] + 10} y={(ESQ_C[1] + ESQ_B[1]) / 2} k={kCatetos} color={COLOR_A} tam={42} giro={-90}>
        cateto a = 3
      </Etiqueta>
      <Etiqueta x={(ESQ_A[0] + ESQ_C[0]) / 2} y={ESQ_C[1] + 60} k={kCatetos} color={COLOR_B} tam={42}>
        cateto b = 4
      </Etiqueta>
      <Etiqueta x={(ESQ_A[0] + ESQ_B[0]) / 2 - 50} y={(ESQ_A[1] + ESQ_B[1]) / 2 - 60} k={kHip} color={COLOR_C} tam={44} giro={ang}>
        hipotenusa c = ?
      </Etiqueta>
    </g>
  );
};

// ---------- Escena 3: contar cuadraditos ----------
const U = 86;
const C3: P = [676, 650]; // ángulo recto
const A3: P = [C3[0] - 4 * U, C3[1]];
const B3: P = [C3[0], C3[1] - 3 * U];
const E1: P = [0.8 * U, -0.6 * U]; // ejes de la cuadrícula del cuadrado de la hipotenusa
const E2: P = [-0.6 * U, -0.8 * U];
const GIRO_HIP = (Math.atan2(-0.6, 0.8) * 180) / Math.PI;

const celdaA = (i: number): P => [C3[0] + (i % 3) * U, C3[1] - 3 * U + Math.floor(i / 3) * U]; // esquina sup. izq.
const celdaB = (i: number): P => [C3[0] - 4 * U + (i % 4) * U, C3[1] + Math.floor(i / 4) * U];
const celdaC = (k: number): P => sumar(sumar(A3, E1, k % 5), E2, Math.floor(k / 5)); // esquina "de abajo"

const Cuadraditos: React.FC<{ t: Tiempos; f: number }> = ({ t, f }) => {
  const kA = avance(f, en(t, "l08", 0.2), en(t, "l08", 0.5));
  const kB = avance(f, en(t, "l08", 0.4), en(t, "l08", 0.7));
  const kC = avance(f, en(t, "l08", 0.6), en(t, "l08", 0.95));
  const kGrilla = avance(f, en(t, "l10", 0.1), en(t, "l10", 0.8));
  // Conteo: 9 celdas en la primera mitad de l11, 16 en la segunda
  const l11 = t.linea("l11");
  const cuenta = (i: number, total: number, desde: number, hasta: number) => avance(f, desde + ((hasta - desde) * i) / total, desde + ((hasta - desde) * i) / total + 5);
  const vuelo = (k: number) => {
    const a = en(t, "l12", 0.05) + k * 1.6;
    return avance(f, a, a + 22);
  };
  const ladoA = cuadradoSobre(C3, B3, A3);
  const ladoB = cuadradoSobre(A3, C3, B3);
  const ladoC = cuadradoSobre(A3, B3, C3);
  const crecer = (pts: P[], base: [P, P], k: number) => pts.map((p, i) => (i < 2 ? p : sumar(base[i === 2 ? 1 : 0], [p[0] - base[i === 2 ? 1 : 0][0], p[1] - base[i === 2 ? 1 : 0][1]], k)));
  const kIgual = avance(f, en(t, "l12", 0.75), en(t, "l12", 0.95));
  const kCinco = avance(f, en(t, "l13", 0.55), en(t, "l13", 0.8));
  const grilla = (pts: P[], n: number, color: string) => {
    const [p0, p1, , p3] = pts;
    const lineas = [];
    for (let i = 1; i < n; i++) {
      const a = sumar(p0, [(p1[0] - p0[0]) / n, (p1[1] - p0[1]) / n], i);
      const b = sumar(p3, [(p1[0] - p0[0]) / n, (p1[1] - p0[1]) / n], i);
      const c = sumar(p0, [(p3[0] - p0[0]) / n, (p3[1] - p0[1]) / n], i);
      const d = sumar(p1, [(p3[0] - p0[0]) / n, (p3[1] - p0[1]) / n], i);
      lineas.push(<line key={`h${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={3} opacity={kGrilla} />);
      lineas.push(<line key={`v${i}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} stroke={color} strokeWidth={3} opacity={kGrilla} />);
    }
    return lineas;
  };
  const celdas = [];
  for (let i = 0; i < 25; i++) {
    const deA = i < 9;
    const orig = deA ? celdaA(i) : celdaB(i - 9);
    const ap = deA ? cuenta(i, 9, l11.desde, l11.desde + (l11.hasta - l11.desde) * 0.45) : cuenta(i - 9, 16, l11.desde + (l11.hasta - l11.desde) * 0.5, l11.hasta);
    if (ap <= 0) continue;
    const v = vuelo(i);
    // Destino: celda de la cuadrícula de la hipotenusa (esquina + giro)
    const dest = celdaC(i);
    const x = mezcla(orig[0], dest[0], v);
    const y = mezcla(orig[1], dest[1], v);
    // Las celdas de origen tienen la esquina arriba a la izquierda; las de destino, la esquina A girada
    const giro = GIRO_HIP * v;
    const s = interpolate(ap, [0, 0.7, 1], [0.2, 1.1, 1]) * 0.86;
    // En el cuadrado de la hipotenusa la celda va del lado de E2 (en coordenadas giradas: hacia arriba)
    celdas.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${giro})`}>
        <rect
          x={(U * (1 - s)) / 2}
          y={-U * v + (U * (1 - s)) / 2}
          width={U * s}
          height={U * s}
          rx={8}
          fill={deA ? COLOR_A : COLOR_B}
          opacity={0.9}
        />
      </g>,
    );
  }
  return (
    <g>
      <polygon points={poli([A3, C3, B3])} fill={TURQUESA} opacity={0.25} stroke={TINTA} strokeWidth={4} />
      <polygon points={poli(crecer(ladoA, [C3, B3], kA))} fill={COLOR_A} fillOpacity={0.12} stroke={COLOR_A} strokeWidth={TRAZO} strokeLinejoin="round" opacity={kA > 0 ? 1 : 0} />
      <polygon points={poli(crecer(ladoB, [A3, C3], kB))} fill={COLOR_B} fillOpacity={0.12} stroke={COLOR_B} strokeWidth={TRAZO} strokeLinejoin="round" opacity={kB > 0 ? 1 : 0} />
      <polygon points={poli(crecer(ladoC, [A3, B3], kC))} fill={COLOR_C} fillOpacity={0.08} stroke={COLOR_C} strokeWidth={TRAZO} strokeLinejoin="round" opacity={kC > 0 ? 1 : 0} />
      {kGrilla > 0 && grilla(ladoA, 3, COLOR_A)}
      {kGrilla > 0 && grilla(ladoB, 4, COLOR_B)}
      {kGrilla > 0 && grilla(ladoC, 5, COLOR_C)}
      {celdas}
      <Etiqueta x={C3[0] + 1.5 * U} y={C3[1] - 1.5 * U} k={avance(f, l11.desde + (l11.hasta - l11.desde) * 0.45, l11.desde + (l11.hasta - l11.desde) * 0.5)} color={COLOR_A} tam={60}>
        9
      </Etiqueta>
      <Etiqueta x={C3[0] - 2 * U} y={C3[1] + 2 * U} k={avance(f, l11.hasta - 4, l11.hasta + 2)} color={COLOR_B} tam={60}>
        16
      </Etiqueta>
      <Etiqueta x={830} y={130} k={kIgual} tam={56}>
        9 + 16 = 25
      </Etiqueta>
      <Etiqueta x={830} y={240} k={kCinco} color={COLOR_C} tam={62}>
        c = 5
      </Etiqueta>
    </g>
  );
};

// ---------- Escena 4: la demostración (reacomodar 4 triángulos) ----------
const LA = 2; // cateto a (unidades)
const LB = 3; // cateto b
const S4 = LA + LB;
const U4 = 118;
const O4: P = [500 - (S4 * U4) / 2, 120];
// Cada triángulo: vértices (en unidades) en la configuración 1 y su corrimiento hacia la 2
const TRIS: { pts: P[]; mover: P }[] = [
  { pts: [[0, 0], [LB, 0], [0, LA]], mover: [LA, 0] }, // arriba a la izquierda
  { pts: [[S4, 0], [LB, 0], [S4, LB]], mover: [-LB, LA] }, // arriba a la derecha
  { pts: [[S4, S4], [S4, LB], [LA, S4]], mover: [0, -LB] }, // abajo a la derecha
  { pts: [[0, S4], [LA, S4], [0, LA]], mover: [0, 0] }, // abajo a la izquierda
];

const Cuadro: React.FC<{ kMover: number; kEntrar: number[]; kC: number; kAB: number; mostrarC?: boolean }> = ({ kMover, kEntrar, kC, kAB, mostrarC = true }) => {
  const pu = (p: P): P => [p[0] * U4, p[1] * U4];
  const interior: P[] = [pu([LB, 0]), pu([S4, LB]), pu([LA, S4]), pu([0, LA])];
  return (
    <g>
      <rect x={0} y={0} width={S4 * U4} height={S4 * U4} fill="#ffffff" stroke={TINTA} strokeWidth={8} rx={4} />
      {mostrarC && <polygon points={poli(interior)} fill={COLOR_C} opacity={0.35 * kC * (1 - kMover)} />}
      {kAB > 0 && (
        <g opacity={kAB}>
          <rect x={0} y={0} width={LA * U4} height={LA * U4} fill={COLOR_A} opacity={0.4} />
          <rect x={LA * U4} y={LA * U4} width={LB * U4} height={LB * U4} fill={COLOR_B} opacity={0.4} />
        </g>
      )}
      {TRIS.map((tr, i) => {
        const e = kEntrar[i];
        if (e <= 0) return null;
        const fuera: P = [(tr.pts[0][0] < S4 / 2 ? -1 : 1) * 2.5, (tr.pts[0][1] < S4 / 2 ? -1 : 1) * 2.5];
        const dx = (1 - e) * fuera[0] + kMover * tr.mover[0];
        const dy = (1 - e) * fuera[1] + kMover * tr.mover[1];
        return <polygon key={i} points={poli(tr.pts.map((p) => pu([p[0] + dx, p[1] + dy])))} fill={TURQUESA} stroke={TINTA} strokeWidth={6} strokeLinejoin="round" opacity={Math.min(1, e * 1.5)} />;
      })}
    </g>
  );
};

const Demostracion: React.FC<{ t: Tiempos; f: number }> = ({ t, f }) => {
  const e = t.escenas[4].desde;
  const kCuadro = avance(f, e + 4, e + 16);
  const kEntrar = TRIS.map((_, i) => avance(f, en(t, "l16", 0.05 + i * 0.09), en(t, "l16", 0.12 + i * 0.09)));
  const kC = avance(f, en(t, "l16", 0.7), en(t, "l16", 0.85));
  const mov0 = t.linea("l17").hasta + 2;
  const kMover = avance(f, mov0, mov0 + 40);
  const kAB = avance(f, en(t, "l18", 0.45), en(t, "l18", 0.75));
  // Al final: las dos configuraciones lado a lado y la fórmula
  const kLado = avance(f, en(t, "l19", 0), en(t, "l19", 0.35));
  const kFormula = avance(f, en(t, "l20", 0.6), en(t, "l20", 1));
  const esc = mezcla(1, 0.62, kLado);
  const xDer = mezcla(O4[0], 1000 - 40 - S4 * U4 * 0.62, kLado);
  const xIzq = 40;
  const lado = S4 * U4;
  return (
    <g opacity={kCuadro}>
      {kLado > 0 && (
        <g transform={`translate(${xIzq} ${O4[1] + 60 * kLado}) scale(0.62)`} opacity={kLado}>
          <Cuadro kMover={0} kEntrar={[1, 1, 1, 1]} kC={1} kAB={0} />
          <text x={lado / 2} y={lado / 2} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={84} fill={COLOR_C}>
            c²
          </text>
        </g>
      )}
      <g transform={`translate(${xDer} ${O4[1] + 60 * kLado}) scale(${esc})`}>
        <Cuadro kMover={kMover} kEntrar={kEntrar} kC={kC} kAB={kAB} />
        {kC > 0 && kMover < 0.5 && (
          <text x={lado / 2} y={lado / 2} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={84} fill={COLOR_C} opacity={kC * (1 - kMover * 2)}>
            c²
          </text>
        )}
        {kAB > 0 && (
          <g opacity={kAB}>
            <text x={(LA * U4) / 2} y={(LA * U4) / 2} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={76} fill={COLOR_A}>
              a²
            </text>
            <text x={(LA + LB / 2) * U4} y={(LA + LB / 2) * U4} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={84} fill={COLOR_B}>
              b²
            </text>
          </g>
        )}
      </g>
      {kLado > 0 && (
        <text x={500} y={O4[1] + 60 + (lado * 0.62) / 2} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={110} fill={TINTA} opacity={kLado}>
          =
        </text>
      )}
      <Etiqueta x={500} y={860} k={kFormula} tam={110}>
        c² = a² + b²
      </Etiqueta>
      <Etiqueta x={500} y={990} k={avance(f, en(t, "l16", 0.15), en(t, "l16", 0.3)) * (1 - kLado)} tam={34} fondo={false}>
        Mismo cuadrado · mismos 4 triángulos
      </Etiqueta>
    </g>
  );
};

// ---------- Escena 5: si el ángulo no es recto ----------
const Contraejemplo: React.FC<{ t: Tiempos; f: number }> = ({ t, f }) => {
  const e = t.escenas[5].desde;
  const kEntra = avance(f, e + 4, e + 18);
  const kAbre = avance(f, en(t, "l22", 0.6), en(t, "l23", 0.35));
  const theta = ((90 + 35 * kAbre) * Math.PI) / 180;
  const u = 62;
  const a = 3 * u;
  const b = 4 * u;
  const C: P = [560, 520];
  const A: P = [C[0] - b, C[1]];
  const B: P = [C[0] - a * Math.cos(theta), C[1] - a * Math.sin(theta)]; // el cateto a gira alrededor de C
  const c2 = (dist(A, B) / u) ** 2;
  const sA = cuadradoSobre(C, B, A);
  const sB = cuadradoSobre(A, C, B);
  const sC = cuadradoSobre(A, B, C);
  const kBarras = avance(f, en(t, "l23", 0.3), en(t, "l23", 0.6));
  const kNo = avance(f, en(t, "l23", 0.6), en(t, "l23", 0.8));
  const anchoU = 14; // px por unidad² en las barras
  return (
    <g opacity={kEntra}>
      <polygon points={poli(sA)} fill={COLOR_A} fillOpacity={0.25} stroke={COLOR_A} strokeWidth={6} />
      <polygon points={poli(sB)} fill={COLOR_B} fillOpacity={0.25} stroke={COLOR_B} strokeWidth={6} />
      <polygon points={poli(sC)} fill={COLOR_C} fillOpacity={0.18} stroke={COLOR_C} strokeWidth={6} />
      <polygon points={poli([A, C, B])} fill={TURQUESA} fillOpacity={0.4} stroke={TINTA} strokeWidth={6} strokeLinejoin="round" />
      <Etiqueta x={C[0] + 70} y={C[1] - 30} k={kEntra} tam={40} color={kAbre > 0.05 ? ROJO : TINTA}>
        {`${Math.round(90 + 35 * kAbre)}°`}
      </Etiqueta>
      {/* Barras: a² + b² contra c² */}
      <g transform="translate(120 850)" opacity={kBarras}>
        <rect x={0} y={0} width={9 * anchoU} height={50} fill={COLOR_A} />
        <rect x={9 * anchoU} y={0} width={16 * anchoU} height={50} fill={COLOR_B} />
        <text x={-14} y={25} textAnchor="end" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={40} fill={TINTA}>
          a²+b²
        </text>
        <rect x={0} y={80} width={c2 * anchoU} height={50} fill={COLOR_C} />
        <text x={-14} y={105} textAnchor="end" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={40} fill={TINTA}>
          c²
        </text>
        {kNo > 0 && <rect x={25 * anchoU} y={74} width={Math.max(0, c2 - 25) * anchoU} height={62} fill="none" stroke={ROJO} strokeWidth={6} strokeDasharray="10 8" opacity={kNo} />}
      </g>
      <Etiqueta x={500} y={760} k={kNo} color={ROJO} tam={56}>
        a² + b² ≠ c²
      </Etiqueta>
      <Etiqueta x={500} y={1010} k={avance(f, en(t, "l23", 0.85), en(t, "l23", 1))} tam={46}>
        Solo en triángulos rectángulos
      </Etiqueta>
    </g>
  );
};

// ---------- Escena 6: cierre ----------
const Cierre: React.FC<{ t: Tiempos; f: number }> = ({ t, f }) => {
  const e = t.escenas[6].desde;
  const kTri = avance(f, e + 4, e + 22);
  const kFormula = avance(f, en(t, "l24", 0.2), en(t, "l24", 0.4));
  const kLogo = avance(f, t.linea("l25").hasta + 6, t.linea("l25").hasta + 24);
  const C: P = [640, 520];
  const A: P = [C[0] - 4 * 70, C[1]];
  const B: P = [C[0], C[1] - 3 * 70];
  return (
    <g>
      <g opacity={kTri}>
        <polygon points={poli([A, C, B])} fill={TURQUESA} fillOpacity={0.3} />
        <Trazo a={A} b={C} k={kTri} color={COLOR_B} />
        <Trazo a={C} b={B} k={kTri} color={COLOR_A} />
        <Trazo a={A} b={B} k={kTri} color={COLOR_C} />
        <text x={C[0] + 34} y={(B[1] + C[1]) / 2} dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={56} fill={COLOR_A}>
          a
        </text>
        <text x={(A[0] + C[0]) / 2} y={C[1] + 52} textAnchor="middle" fontFamily={FUENTE} fontWeight={700} fontSize={56} fill={COLOR_B}>
          b
        </text>
        <text x={(A[0] + B[0]) / 2 - 40} y={(A[1] + B[1]) / 2 - 30} textAnchor="middle" fontFamily={FUENTE} fontWeight={700} fontSize={56} fill={COLOR_C}>
          c
        </text>
      </g>
      <Etiqueta x={500} y={140} k={avance(f, e + 2, e + 16)} tam={58}>
        Teorema de Pitágoras
      </Etiqueta>
      <Etiqueta x={500} y={655} k={kFormula} tam={128}>
        c² = a² + b²
      </Etiqueta>
      {kLogo > 0 && <Logo k={kLogo} />}
    </g>
  );
};

// Logo provisorio del canal (hasta tener el kit de marca): escudo con "LOS AMIGOS" y "MAT" + triángulo y ², y la
// llamada a la acción debajo
const Logo: React.FC<{ k: number }> = ({ k }) => {
  const s = interpolate(k, [0, 0.7, 1], [0.4, 1.08, 1]);
  return (
    <g transform={`translate(500 870) scale(${s})`} opacity={k}>
      <rect x={-300} y={-110} width={600} height={200} rx={56} fill={TINTA} />
      <rect x={-288} y={-98} width={576} height={176} rx={46} fill="none" stroke={TURQUESA} strokeWidth={6} />
      <text x={-20} y={-52} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={40} letterSpacing={8} fill="#ffffff">
        LOS AMIGOS
      </text>
      <text x={-80} y={22} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={104} fill={COLOR_C}>
        MAT
      </text>
      <text x={62} y={-14} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={50} fill={COLOR_B}>
        ²
      </text>
      <g transform="translate(150 -22)">
        <polygon points="0,70 90,70 90,0" fill={TURQUESA} opacity={0.35} />
        <line x1={0} y1={70} x2={90} y2={70} stroke={COLOR_B} strokeWidth={9} strokeLinecap="round" />
        <line x1={90} y1={70} x2={90} y2={0} stroke={COLOR_A} strokeWidth={9} strokeLinecap="round" />
        <line x1={0} y1={70} x2={90} y2={0} stroke={COLOR_C} strokeWidth={9} strokeLinecap="round" />
      </g>
      <g transform="translate(0 150)">
        <rect x={-370} y={-34} width={740} height={68} rx={34} fill={COLOR_C} />
        <text x={0} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={30} fill="#ffffff">
          ¡Suscribite para más matemática con amigos!
        </text>
      </g>
    </g>
  );
};

export const Pizarra: React.FC<{ t: Tiempos }> = ({ t }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
    <Escena t={t} n={1}>{(f) => <Parque t={t} f={f} />}</Escena>
    <Escena t={t} n={2}>{(f) => <Triangulo t={t} f={f} />}</Escena>
    <Escena t={t} n={3}>{(f) => <Cuadraditos t={t} f={f} />}</Escena>
    <Escena t={t} n={4}>{(f) => <Demostracion t={t} f={f} />}</Escena>
    <Escena t={t} n={5}>{(f) => <Contraejemplo t={t} f={f} />}</Escena>
    <Escena t={t} n={6}>{(f) => <Cierre t={t} f={f} />}</Escena>
  </svg>
);

// ---------- Efectos de sonido, en los mismos momentos que la pizarra ----------
const SFX = "biblioteca/sfx/mixkit";
const S = {
  pop: { archivo: `${SFX}/mixkit-731-cartoon-bubble-pop.wav`, volumen: 0.35 },
  tic: { archivo: `${SFX}/mixkit-2579-light-switch-sound.wav`, volumen: 0.45 },
  whoosh: { archivo: `${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, volumen: 0.22 },
  ding: { archivo: `${SFX}/mixkit-600-achievement-bell.wav`, volumen: 0.32 },
  pasos: { archivo: `${SFX}/mixkit-37-cartoon-insect-running-fast.wav`, volumen: 0.35 },
};
type Efecto = { archivo: string; desde: number; volumen: number };

export const efectosPizarra = (t: Tiempos): Efecto[] => {
  const ef: Efecto[] = [];
  const poner = (s: { archivo: string; volumen: number }, desde: number, vol = 1) => ef.push({ archivo: s.archivo, desde: Math.max(0, Math.round(desde)), volumen: s.volumen * vol });
  // Escena 1: pasos durante la carrera y ding cuando Sofi llega al kiosco
  const largada = t.linea("l02").hasta + 2;
  const fin = t.linea("l03").desde - 4;
  for (let f = largada; f < fin; f += 46) poner(S.pasos, f);
  let llega = fin;
  for (let f = largada; f <= fin; f++) {
    if (7 * avance(f, largada, fin) >= 5) {
      llega = f;
      break;
    }
  }
  poner(S.ding, llega);
  poner(S.pop, 4);
  // Escena 2: etiquetas
  poner(S.pop, en(t, "l06", 0.75));
  poner(S.pop, en(t, "l07", 0.15));
  poner(S.pop, en(t, "l07", 0.7));
  // Escena 3: cuadrados, conteo (tic por cuadradito), vuelo y resultados
  poner(S.whoosh, en(t, "l08", 0.2), 0.7);
  const l11 = t.linea("l11");
  for (let i = 0; i < 9; i++) poner(S.tic, l11.desde + ((l11.hasta - l11.desde) * 0.45 * i) / 9);
  for (let i = 0; i < 16; i++) poner(S.tic, l11.desde + (l11.hasta - l11.desde) * 0.5 + ((l11.hasta - l11.desde) * 0.5 * i) / 16);
  poner(S.whoosh, en(t, "l12", 0.05));
  poner(S.ding, en(t, "l12", 0.75));
  poner(S.ding, en(t, "l13", 0.55));
  // Escena 4: entran los 4 triángulos, se deslizan, c², a² y b², la fórmula
  for (let i = 0; i < 4; i++) poner(S.whoosh, en(t, "l16", 0.05 + i * 0.09), 0.6);
  poner(S.pop, en(t, "l16", 0.7));
  poner(S.whoosh, t.linea("l17").hasta + 2, 1.2);
  poner(S.pop, en(t, "l18", 0.45));
  poner(S.whoosh, en(t, "l19", 0), 0.6);
  poner(S.ding, en(t, "l20", 0.6));
  // Escena 5: el ángulo se abre, ≠ y el cartel
  poner(S.whoosh, en(t, "l22", 0.6), 0.6);
  poner(S.pop, en(t, "l23", 0.6));
  poner(S.pop, en(t, "l23", 0.85));
  // Escena 6: título, fórmula y logo
  poner(S.pop, t.escenas[6].desde + 2);
  poner(S.ding, en(t, "l24", 0.2));
  poner(S.ding, t.linea("l25").hasta + 6, 1.1);
  return ef;
};
