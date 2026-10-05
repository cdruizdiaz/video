// Plantilla "ManifiestoRastros": manifiesto de marca 16:9 construido con huellas.
// Un solo plano continuo, sin escenas ni transiciones: cada elemento crea el siguiente.
// punto → línea → camino → pisadas → patrón → ruido → (goma) → pisada → cápsula → aro → logo
// Tiempos en frames a 30 fps (constantes T). La música (musica_manifiesto.py) usa los mismos tiempos.
import { loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { conAlfa } from "../../marcas/tipos";
import { rastro } from "../../marcas/rastro/marca";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "500", "600", "700", "900"],
  subsets: ["latin"],
});

// ---------- Marca ----------
const PAPEL = rastro.colores.fondo;
const TINTA = rastro.colores.tinta;
const SUAVE = rastro.colores.tintaSuave;
const EASE = rastro.ease;
const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const IN = Easing.bezier(0.55, 0, 1, 0.45);

// ---------- Tiempos (frames) ----------
export const DURACION_MANIFIESTO = 1350; // 45 s
const T = {
  // A — el gesto
  caida: 14,
  impacto: 30,
  gestoIn: 44,
  gestoOut: 118,
  // B — punto, línea, camino
  punto: 150,
  puntoOut: 196,
  linea: 200,
  lineaFin: 250,
  lineaOut: 262,
  camino: 268,
  caminoFin: 310,
  caminoTexto: 305,
  caminoTextoOut: 362,
  // C — pisadas
  paso: 375,
  pasoFin: 505,
  patron: 515,
  // D — ruido
  ruido: 570,
  frase: 590,
  ruidoLleno: 735,
  // E — menos ruido, más historias
  goma: 750,
  gomaFin: 795,
  menos: 805,
  giro: 855,
  capsula: 872,
  capsulaFin: 902,
  mas: 885,
  // F — con intención
  pliegue: 960,
  aro: 978,
  rueda: 1000,
  ruedaFin: 1095,
  disenamos: 1020,
  contamos: 1055,
  intencion: 1090,
  fantasmas: 1120,
  // G — para que algo pase… y algo quede. Rastro.
  memoria: 1140,
  pase: 1150,
  paseSale: 1205,
  quede: 1220,
  converge: 1245,
  marca: 1262,
  marcaFin: 1312,
};

// ---------- Utilidades ----------
const p = (f: number, a: number, b: number, easing: (t: number) => number = EASE) =>
  interpolate(f, [a, b], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type Pt = [number, number];
const cubic = (q: Pt[], t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * q[0][0] + b * q[1][0] + c * q[2][0] + d * q[3][0], a * q[0][1] + b * q[1][1] + c * q[2][1] + d * q[3][1]];
};
const dCubic = (q: Pt[]) => `M${q[0]} C${q[1]} ${q[2]} ${q[3]}`;
const lerpPts = (a: Pt[], b: Pt[], t: number): Pt[] => a.map((pa, i) => [mix(pa[0], b[i][0], t), mix(pa[1], b[i][1], t)]);

// Recorrido por longitud de arco (para que las pisadas queden parejas)
const tablaArco = (q: Pt[]) => {
  const n = 400;
  const pts: Pt[] = [];
  const largos: number[] = [0];
  for (let i = 0; i <= n; i++) pts.push(cubic(q, i / n));
  for (let i = 1; i <= n; i++) largos.push(largos[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = largos[n];
  return (s: number) => {
    const objetivo = Math.min(Math.max(s, 0), 1) * total;
    let i = 1;
    while (i < n && largos[i] < objetivo) i++;
    const k = (objetivo - largos[i - 1]) / (largos[i] - largos[i - 1] || 1);
    const x = mix(pts[i - 1][0], pts[i][0], k);
    const y = mix(pts[i - 1][1], pts[i][1], k);
    const ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    return { x, y, ang };
  };
};

// ---------- Geometría ----------
const PUNTO: Pt = [1180, 540]; // donde cae el punto (es el punto final de cada frase)
const R_PUNTO = 14;
const LINEA: Pt[] = [[300, 540], [766, 540], [1233, 540], [1700, 540]];
const CAMINO: Pt[] = [[120, 820], [700, 240], [1200, 920], [1800, 300]];
const enCamino = tablaArco(CAMINO);
const N_PASOS = 14;
const COPIAS: Pt[] = [[0, 0], [-40, -330], [40, 330], [-80, -660], [80, 660]];
const PALABRAS_PASO: Record<number, string> = { 1: "Cada", 4: "paso", 7: "deja", 10: "algo." };

type Pisada = { x: number; y: number; rot: number; ang: number; k: number; c: number; nace: number };
const PISADAS: Pisada[] = COPIAS.flatMap(([dx, dy], c) =>
  Array.from({ length: N_PASOS }, (_, k) => {
    const s = (k + 0.5) / N_PASOS;
    const { x, y, ang } = enCamino(s);
    const lado = k % 2 === 0 ? -1 : 1;
    const nace = c === 0 ? T.paso + s * (T.pasoFin - T.paso) : T.patron + (c - 1) * 7 + k * 1.2;
    return {
      x: x - Math.sin(ang) * 24 * lado + dx,
      y: y + Math.cos(ang) * 24 * lado + dy,
      rot: (ang * 180) / Math.PI + 90,
      ang,
      k,
      c,
      nace,
    };
  }),
);

const RUIDO = [
  "contenido", "likes", "urgente", "tendencia", "más", "ahora", "viral", "algoritmo", "engagement",
  "post", "reel", "oferta", "¡ya!", "scroll", "seguidores", "nuevo", "trending", "story", "clic",
  "alcance", "promo", "hoy", "¡último!", "notificación", "views", "descuento", "boost", "#hashtag",
  "más más", "impresiones", "feed", "sorteo", "¡mirá!", "envío gratis", "2x1", "ads", "KPI", "FOMO",
  "swipe", "link en bio",
];
const PESOS = [300, 400, 500, 600, 700, 900];
const N_EXTRA = 120;
const EXTRA = Array.from({ length: N_EXTRA }, (_, j) => {
  const u = j / N_EXTRA;
  const ultimo = j >= N_EXTRA - 15;
  return {
    texto: RUIDO[Math.floor(random(`w${j}`) * RUIDO.length)],
    x: random(`x${j}`) * 1920,
    y: random(`y${j}`) * 1080,
    tam: 30 + Math.pow(u, 2.2) * 520,
    peso: ultimo ? 900 : PESOS[Math.floor(random(`p${j}`) * PESOS.length)],
    rot: random(`g${j}`) < 0.15 ? 90 : (random(`r${j}`) - 0.5) * 24,
    color: ultimo ? SUAVE : random(`c${j}`) < 0.18 ? SUAVE : TINTA,
    nace: T.frase + (T.ruidoLleno - 5 - T.frase) * Math.sqrt(u),
    ultimo,
  };
});
const SOBREVIVE: Pt = [960, 640]; // la única pisada que queda después de la goma
const RESTOS = Array.from({ length: 10 }, (_, i) => ({
  texto: RUIDO[(i * 7 + 3) % RUIDO.length],
  x: 260 + random(`rx${i}`) * 1400,
  y: 180 + random(`ry${i}`) * 760,
  peso: PESOS[i % PESOS.length],
}));
const MENOS: Pt = [960, 420];

// Cápsula / aro
const CAPSULA_W = 1150;
const CAPSULA_H = 170;
const CAPSULA_IZQ = SOBREVIVE[0] - CAPSULA_W / 2;
const ARO_D = 120;
const ARO_X0 = CAPSULA_IZQ + ARO_D / 2;
const ARO_X1 = 1600;
const SUELO = SOBREVIVE[1] + ARO_D / 2 + 2;

// Logo (681×213) centrado
const LOGO_W = 1000;
const LOGO_K = LOGO_W / 681;
const LOGO_X = 460;
const LOGO_Y = 404;
const CABEZA_LOGO: Pt = [170, 35]; // cabeza de la figurita sobre la "A"
const CABEZA: Pt = [LOGO_X + CABEZA_LOGO[0] * LOGO_K, LOGO_Y + CABEZA_LOGO[1] * LOGO_K];
// Trazos que dibujan cada letra (coordenadas del logo original)
const TRAZOS_LOGO = [
  { d: "M10,172 L10,76 C40,74 70,76 76,98 C80,118 50,124 14,122 M42,122 L78,172", nace: 4 },
  { d: "M332,86 C320,70 296,66 280,72 C258,82 260,108 290,120 C320,130 338,140 334,160 C328,178 284,182 262,160", nace: 10 },
  { d: "M356,74 L440,75 M398,75 L398,174", nace: 16 },
  { d: "M478,173 L478,77 C510,74 548,78 552,102 C556,124 520,130 482,128 M514,128 L552,173", nace: 20 },
  { d: "M630,72 C670,72 676,100 676,122 C676,150 662,173 628,173 C594,173 582,150 582,122 C582,96 596,72 630,72", nace: 26 },
];

// Transformación del "mundo" en el final: alejamiento lento y convergencia hacia la cabeza del logo
const mundo = (f: number) => {
  const s = 1 - 0.05 * p(f, T.memoria, T.converge, IN_OUT);
  const c = p(f, T.converge, T.converge + 40, IN);
  return { s, c, k: 1 - 0.85 * c };
};
const aPantalla = (f: number, [x, y]: Pt): Pt => {
  const { s, k } = mundo(f);
  const qx = 960 + (x - 960) * s;
  const qy = 540 + (y - 540) * s;
  return [CABEZA[0] + (qx - CABEZA[0]) * k, CABEZA[1] + (qy - CABEZA[1]) * k];
};

// ---------- Piezas ----------
const base: React.CSSProperties = { position: "absolute", lineHeight: 1, whiteSpace: "pre", fontFamily };
const BASELINE = 0.864; // con lineHeight 1, la línea de base de Inter cae a 0,864 em del borde superior

// Texto letra por letra. "fantasma" lo convierte en contorno: lo que queda después de decirlo.
const Letras: React.FC<{
  texto: string;
  f: number;
  nace: number;
  paso?: number;
  dur?: number;
  desde?: number; // desplazamiento vertical inicial
  fantasma?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ texto, f, nace, paso = 2, dur = 14, desde = 24, fantasma = 0, color = TINTA, style }) => (
  <div style={{ ...base, ...style }}>
    {[...texto].map((ch, i) => {
      const t = p(f, nace + i * paso, nace + i * paso + dur);
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: t,
            transform: `translateY(${(1 - t) * desde}px)`,
            color: conAlfa(color, 1 - fantasma),
            WebkitTextStroke: fantasma > 0 ? `1.5px ${conAlfa(SUAVE, fantasma)}` : undefined,
          }}
        >
          {ch}
        </span>
      );
    })}
  </div>
);

const FormaPisada: React.FC<{ x: number; y: number; rot: number; esc?: number; op?: number; color?: string }> = ({
  x, y, rot, esc = 1, op = 1, color = TINTA,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${esc * 1.25})`} opacity={op} fill={color}>
    <ellipse cx={0} cy={-9} rx={15} ry={23} />
    <ellipse cx={0} cy={25} rx={11} ry={11} />
  </g>
);

const FiltroTinta: React.FC = () => (
  <defs>
    <filter id="tinta" filterUnits="userSpaceOnUse" x={-100} y={-100} width={2120} height={1280}>
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={7} />
      <feDisplacementMap in="SourceGraphic" scale={3.5} />
    </filter>
  </defs>
);

// ---------- A–C: punto, línea, camino, pisadas, patrón ----------
const Huellas: React.FC<{ f: number }> = ({ f }) => {
  if (f >= T.ruido + 40) return null;
  // Punto: cae, se imprime y deja un eco
  const caida = p(f, T.caida, T.impacto, IN);
  const aplasta = interpolate(f, [T.impacto, T.impacto + 4, T.impacto + 12], [1, 1.35, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const ecos = [0, 7].map((d, i) => {
    const t = p(f, T.impacto + d, T.impacto + d + 55, Easing.out(Easing.cubic));
    return t > 0 && t < 1 ? (
      <circle key={i} cx={PUNTO[0]} cy={PUNTO[1]} r={R_PUNTO + t * (i ? 150 : 240)} fill="none"
        stroke={TINTA} strokeWidth={3 * (1 - t) + 0.5} opacity={(1 - t) * 0.6} />
    ) : null;
  });

  // Línea: el punto se estira hacia los dos lados y se afina
  const estira = p(f, T.linea, T.lineaFin, IN_OUT);
  const morf = p(f, T.camino, T.caminoFin, IN_OUT);
  const grosor = mix(R_PUNTO * 2, 6, p(f, T.linea, T.linea + 30));
  const lineaVisible = f >= T.linea && f < T.paso;

  // Caminante: recorre el camino, lo borra y deja pisadas
  const sCam = interpolate(f, [T.paso, T.pasoFin], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cam = enCamino(sCam);
  const camEsc = p(f, T.paso - 10, T.paso) * (1 - p(f, T.pasoFin, T.pasoFin + 10));
  const textoCamino = p(f, T.caminoTexto, T.caminoTexto + 50, IN_OUT);

  // Pisadas → palabras (fase D)
  const aRuido = (q: Pisada, i: number) => p(f, T.ruido + i * 0.5, T.ruido + i * 0.5 + 8);

  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <FiltroTinta />
        <g filter="url(#tinta)">
          {ecos}
          {f >= T.caida && f < T.linea + 4 && (
            <ellipse
              cx={PUNTO[0]}
              cy={PUNTO[1] - (1 - caida) * 70}
              rx={R_PUNTO * aplasta}
              ry={R_PUNTO / aplasta}
              fill={TINTA}
              opacity={Math.min(1, caida * 3)}
            />
          )}
          {lineaVisible && morf === 0 && (
            <line x1={mix(PUNTO[0], LINEA[0][0], estira)} y1={540} x2={mix(PUNTO[0], LINEA[3][0], estira)} y2={540}
              stroke={TINTA} strokeWidth={grosor} strokeLinecap="round" />
          )}
          {lineaVisible && morf > 0 && (
            <path d={dCubic(lerpPts(LINEA, CAMINO, morf))} fill="none" stroke={TINTA} strokeWidth={6}
              strokeLinecap="round" pathLength={1}
              strokeDasharray={f >= T.paso - 1 ? `0 ${sCam} ${1 - sCam + 0.001} 2` : undefined} />
          )}
          {f >= T.paso - 1 && f < T.pasoFin + 2 && (
            <path d={dCubic(CAMINO)} fill="none" stroke={TINTA} strokeWidth={6} strokeLinecap="round"
              pathLength={1} strokeDasharray={`0 ${sCam} ${1 - sCam + 0.001} 2`} />
          )}
          {camEsc > 0 && <circle cx={cam.x} cy={cam.y} r={R_PUNTO * camEsc} fill={TINTA} />}
          {PISADAS.map((q, i) => {
            const t = p(f, q.nace, q.nace + 6, Easing.out(Easing.back(2)));
            const r = aRuido(q, i);
            if (t <= 0 || r >= 1) return null;
            return <FormaPisada key={i} x={q.x} y={q.y} rot={q.rot} esc={mix(1.4, 1, t) * (1 - r * 0.6)} op={Math.min(1, t * 2) * (1 - r)} />;
          })}
        </g>
        {/* "Un camino." viaja sobre el trazo */}
        <path id="camino" d={dCubic(CAMINO)} fill="none" />
        {f >= T.caminoTexto && f < T.caminoTextoOut + 20 && (
          <text fontFamily={fontFamily} fontWeight={600} fontSize={64} fill={TINTA}
            opacity={p(f, T.caminoTexto, T.caminoTexto + 10) * (1 - p(f, T.caminoTextoOut, T.caminoTextoOut + 16))}>
            <textPath href="#camino" startOffset={`${mix(2, 30, textoCamino)}%`} dy={-26}>
              Un camino.
            </textPath>
          </text>
        )}
      </svg>

      {/* Pisadas convertidas en palabras: el patrón se vuelve tipografía */}
      {f >= T.ruido &&
        PISADAS.map((q, i) => {
          const r = aRuido(q, i);
          if (r <= 0) return null;
          return (
            <div key={i} style={{
              ...base, left: q.x, top: q.y, fontSize: 24 + (i % 5) * 5, fontWeight: PESOS[i % PESOS.length],
              color: i % 6 === 0 ? SUAVE : TINTA, opacity: r,
              transform: `translate(-50%,-50%) rotate(${i % 3 === 0 ? q.rot - 90 : 0}deg) scale(${mix(0.4, 1, r)})`,
            }}>
              {RUIDO[(i * 3) % RUIDO.length]}
            </div>
          );
        })}

      {/* A: "Todo empieza con un gesto" — el punto que cayó es su punto final */}
      {f < T.punto && (
        <Letras texto="Todo empieza con un gesto" f={f} nace={T.gestoIn} paso={2} dur={16} desde={10}
          fantasma={0}
          style={{
            right: 1920 - (PUNTO[0] - R_PUNTO - 8), top: PUNTO[1] + R_PUNTO - BASELINE * 60,
            fontSize: 60, fontWeight: 300, letterSpacing: "-0.01em",
            opacity: 1 - p(f, T.gestoOut, T.gestoOut + 26, IN_OUT),
          }} />
      )}
      {/* B: "Un punto" — mismo punto final */}
      {f >= T.punto && f < T.lineaFin && (
        <Letras texto="Un punto" f={f} nace={T.punto} paso={2} dur={14} desde={40}
          fantasma={p(f, T.puntoOut, T.puntoOut + 14)}
          style={{
            right: 1920 - (PUNTO[0] - R_PUNTO - 10), top: PUNTO[1] + R_PUNTO - BASELINE * 150,
            fontSize: 150, fontWeight: 900, letterSpacing: "-0.03em",
            opacity: 1 - p(f, T.puntoOut + 14, T.lineaFin - 6),
          }} />
      )}
      {/* "Una línea." se abre junto con el trazo */}
      {f >= T.linea && f < T.camino + 20 && (
        <div style={{
          ...base, left: 40, width: 1920, top: 590, textAlign: "center", fontSize: 80, fontWeight: 500,
          letterSpacing: `${mix(-0.02, 0.38, estira)}em`,
          opacity: p(f, T.linea + 4, T.linea + 18) * (1 - p(f, T.lineaOut, T.camino + 14)), color: TINTA,
        }}>
          Una línea.
        </div>
      )}
      {/* C: "Cada paso deja algo." — una palabra por pisada */}
      {f >= T.paso && f < T.ruido &&
        PISADAS.filter((q) => q.c === 0 && PALABRAS_PASO[q.k]).map((q) => {
          const t = p(f, q.nace + 2, q.nace + 16);
          const lado = q.k % 2 === 0 ? -1 : 1;
          return (
            <div key={q.k} style={{
              ...base, left: q.x + Math.sin(q.ang) * 90 * lado, top: q.y - Math.cos(q.ang) * 90 * lado,
              fontSize: 54, fontWeight: 600, color: TINTA,
              opacity: t * (1 - p(f, T.patron + 10, T.patron + 34)),
              transform: `translate(-50%,-50%) translateY(${(1 - t) * 16}px)`,
            }}>
              {PALABRAS_PASO[q.k]}
            </div>
          );
        })}
    </>
  );
};

// ---------- D–E: ruido, goma, menos ruido ----------
const Ruido: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.frase || f > T.gomaFin + 60) return null;
  const goma = p(f, T.goma, T.gomaFin, IN_OUT);
  const tiembla = (j: number) => (f < T.goma ? (random(`t${j}-${Math.floor(f / 2)}`) - 0.5) * 3 : 0);
  const palabra = (w: (typeof EXTRA)[number], j: number) => {
    const t = p(f, w.nace, w.nace + 5, Easing.out(Easing.cubic));
    if (t <= 0) return null;
    return (
      <div key={j} style={{
        ...base, left: w.x + tiembla(j), top: w.y + tiembla(j + 99), fontSize: w.tam, fontWeight: w.peso,
        color: w.color, opacity: Math.min(1, t * 2), letterSpacing: "-0.03em",
        transform: `translate(-50%,-50%) rotate(${w.rot}deg) scale(${mix(1.25, 1, t)})`,
      }}>
        {w.texto}
      </div>
    );
  };
  const corte = Math.floor(N_EXTRA * 0.38);
  return (
    <>
      {f <= T.gomaFin + 1 && (
        <>
          {EXTRA.slice(0, corte).map((w, j) => palabra(w, j))}
          <div style={{
            ...base, left: 0, width: 1920, top: 540 - 35, textAlign: "center", fontSize: 70, fontWeight: 400,
            color: SUAVE, opacity: p(f, T.frase, T.frase + 18), letterSpacing: "-0.01em",
          }}>
            Hay mucho ruido.
          </div>
          {EXTRA.slice(corte, N_EXTRA - 15).map((w, j) => palabra(w, j + corte))}
          <AbsoluteFill style={{ background: TINTA, opacity: p(f, T.ruidoLleno - 13, T.ruidoLleno + 8, IN) }} />
          {EXTRA.slice(N_EXTRA - 15).map((w, j) => palabra(w, j + N_EXTRA - 15))}
          {/* La goma: un trazo de papel que barre todo */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path d="M-300,80 L2200,80 L-300,380 L2200,380 L-300,680 L2200,680 L-300,980 L2200,980"
              fill="none" stroke={PAPEL} strokeWidth={380} strokeLinecap="round" strokeLinejoin="round"
              pathLength={1} strokeDasharray={`${goma} 2`} />
          </svg>
        </>
      )}
      {/* Restos del ruido que se disuelven hacia "Menos ruido." */}
      {RESTOS.map((r, i) => {
        const t = p(f, T.gomaFin - 4 + i * 2, T.menos + 30 + i * 2, IN_OUT);
        if (f < T.gomaFin - 8 || t >= 1) return null;
        return (
          <div key={i} style={{
            ...base, left: mix(r.x, MENOS[0], t), top: mix(r.y, MENOS[1], t), fontSize: 30, fontWeight: r.peso,
            color: SUAVE, opacity: p(f, T.gomaFin - 8, T.gomaFin) * (1 - t),
            transform: `translate(-50%,-50%) scale(${mix(1, 0.3, t)})`,
          }}>
            {r.texto}
          </div>
        );
      })}
    </>
  );
};

// ---------- E–G: la pisada que sobrevive → cápsula → aro ----------
const Sobreviviente: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.ruidoLleno + 5) return null;
  const aparece = p(f, T.ruidoLleno + 5, T.ruidoLleno + 12);
  // negativo (papel sobre negro) hasta que la goma pasa por encima; después, tinta sobre papel
  const color = p(f, T.goma, T.gomaFin, IN_OUT) < 0.645 ? PAPEL : TINTA;
  const giro = p(f, T.giro, T.capsula, IN_OUT);
  const abre = p(f, T.capsula, T.capsulaFin, EASE);
  const pliega = p(f, T.pliegue + 6, T.aro, IN_OUT);
  const anillo = p(f, T.aro, T.rueda, IN_OUT);
  const rodar = p(f, T.rueda, T.ruedaFin, Easing.bezier(0.45, 0, 0.2, 1));
  const ROT0 = -28;

  // Forma base: la suela de la pisada (elipse) que crece hasta ser cápsula
  let w = mix(30, 48, giro);
  let h = mix(46, 30, giro);
  w = mix(w, CAPSULA_W, abre);
  h = mix(h, CAPSULA_H, abre);
  let cx = SOBREVIVE[0];
  let cy = SOBREVIVE[1];
  // se pliega hacia su extremo izquierdo
  w = mix(w, CAPSULA_H, pliega);
  cx = mix(cx, CAPSULA_IZQ + CAPSULA_H / 2, pliega);
  // y se vuelve aro
  const d = mix(CAPSULA_H, ARO_D, anillo);
  if (anillo > 0) {
    w = d;
    h = d;
    cx = mix(CAPSULA_IZQ + CAPSULA_H / 2, ARO_X0, anillo);
  }
  const x = mix(cx, ARO_X1, rodar);
  const giroAro = ((x - ARO_X0) / (ARO_D / 2)) * (180 / Math.PI);

  // Final: el aro vuela a la cabeza de la "A" y se cierra en un punto
  let [sx, sy] = aPantalla(f, [x, cy]);
  let sd = w * mundo(f).s * mundo(f).k;
  const vuela = p(f, T.converge, T.marca, IN_OUT);
  sx = mix(sx, CABEZA[0], vuela);
  sy = mix(sy, CABEZA[1], vuela);
  const dFinal = R_PUNTO * 2 * 1.3;
  sd = mix(anillo > 0 ? d * mundo(f).s : sd, dFinal, vuela);
  const relleno = Math.max(1 - anillo, p(f, T.marca - 8, T.marca));
  const borde = anillo > 0 ? mix(4, 12, anillo) * (1 - vuela) + 3 : 0;
  const se_va = 1 - p(f, T.marca + 4, T.marca + 18);
  if (se_va <= 0) return null;

  const sh = anillo > 0 || vuela > 0 ? sd : h;
  const sw = anillo > 0 || vuela > 0 ? sd : w;
  const golpe = interpolate(f, [T.marca, T.marca + 4, T.marca + 12], [1, 1.3, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // texto dentro de la cápsula
  const cae = p(f, T.pliegue, T.pliegue + 16, IN);
  return (
    <>
      {/* talón de la pisada: se funde en la suela al girar */}
      {f < T.capsula + 4 && (
        <div style={{
          position: "absolute", left: SOBREVIVE[0], top: SOBREVIVE[1], width: 22, height: 22, borderRadius: "50%",
          background: color, opacity: aparece * (1 - giro),
          transform: `translate(-50%,-50%) rotate(${ROT0 * (1 - giro)}deg) translateY(${mix(34, 0, giro)}px)`,
          transformOrigin: "50% 50%",
        }} />
      )}
      <div style={{
        position: "absolute", left: sx, top: sy, width: sw, height: sh, borderRadius: 999, boxSizing: "border-box",
        background: conAlfa(color, relleno), border: borde ? `${borde}px solid ${TINTA}` : undefined,
        opacity: aparece * se_va, overflow: "hidden",
        transform: `translate(-50%,-50%) rotate(${anillo > 0 ? giroAro : ROT0 * (1 - giro)}deg) scale(${f >= T.marca ? golpe : 1}, ${f >= T.marca ? 1 / golpe : 1})`,
      }}>
        {f >= T.mas && f < T.aro && (
          <div style={{ ...base, left: 0, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", fontSize: 108, fontWeight: 900, letterSpacing: "-0.03em", color: PAPEL }}>
              {[..."Más historias."].map((ch, i) => {
                const t = p(f, T.mas + i * 1.5, T.mas + i * 1.5 + 18);
                const c = p(f, T.pliegue + i, T.pliegue + i + 14, IN);
                return (
                  <span key={i} style={{
                    display: "inline-block", whiteSpace: "pre",
                    transform: `translateY(${(1 - t) * 120 + c * 140}px)`, opacity: 1 - cae * 0.0,
                  }}>
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {/* marca en el aro para que se lea el giro */}
        {anillo > 0.6 && vuela < 0.5 && (
          <div style={{
            position: "absolute", left: "50%", top: 6, width: 12, height: 12, borderRadius: "50%",
            background: TINTA, transform: "translateX(-50%)",
          }} />
        )}
      </div>
    </>
  );
};

// ---------- E–G: frases que quedan como fantasmas ----------
const Frases: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.menos) return null;
  const rodar = p(f, T.rueda, T.ruedaFin, Easing.bezier(0.45, 0, 0.2, 1));
  const aroX = mix(ARO_X0, ARO_X1, rodar);
  const fant = (a: number) => p(f, a, a + 18);
  const atenua = 1 - 0.65 * p(f, T.memoria, T.memoria + 30);
  return (
    <>
      <Letras texto="Menos ruido." f={f} nace={T.menos} paso={2} dur={16} desde={30} fantasma={fant(T.pliegue - 5)}
        style={{
          left: 0, width: 1920, top: MENOS[1] - 65, fontSize: 130, fontWeight: 700, letterSpacing: "-0.03em",
          textAlign: "center", opacity: atenua,
          transform: `translateY(${-24 * p(f, T.pliegue - 5, T.pliegue + 40)}px)`,
        }} />
      {/* el trazo que deja el aro al rodar */}
      {f >= T.rueda && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g filter="url(#tinta2)">
            <defs>
              <filter id="tinta2" filterUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
                <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={4} />
                <feDisplacementMap in="SourceGraphic" scale={3} />
              </filter>
            </defs>
            <line x1={ARO_X0} y1={SUELO} x2={aroX} y2={SUELO} stroke={TINTA} strokeWidth={4} strokeLinecap="round"
              opacity={1 - 0.6 * p(f, T.memoria, T.memoria + 30)} />
          </g>
        </svg>
      )}
      {/* Palabras que brotan del trazo (recortadas por la línea) */}
      {[
        { t: "Diseñamos.", x: 520, nace: T.disenamos, peso: 500 },
        { t: "Contamos.", x: 1085, nace: T.contamos, peso: 600 },
      ].map((w) => {
        const t = p(f, w.nace, w.nace + 20);
        if (f < w.nace) return null;
        return (
          <div key={w.t} style={{ position: "absolute", left: w.x, top: SUELO - 110, height: 106, overflow: "hidden", opacity: atenua }}>
            <Letras texto={w.t} f={f} nace={w.nace} paso={0} dur={1} desde={0} fantasma={fant(T.fantasmas)}
              style={{ position: "relative", fontSize: 92, fontWeight: w.peso, letterSpacing: "-0.02em", top: 24 + (1 - t) * 100 }} />
          </div>
        );
      })}
      {f >= T.intencion && (
        <div style={{ position: "absolute", left: 0, width: 1920, top: SUELO + 4, height: 200, overflow: "hidden", opacity: atenua }}>
          <Letras texto="Con intención." f={f} nace={T.intencion} paso={0} dur={1} desde={0} fantasma={fant(T.memoria)}
            style={{
              position: "relative", left: (ARO_X0 + ARO_X1) / 2 - 960, width: 1920, textAlign: "center",
              fontSize: 150, fontWeight: 900, letterSpacing: "-0.035em",
              top: 10 - (1 - p(f, T.intencion, T.intencion + 24)) * 190,
            }} />
        </div>
      )}
    </>
  );
};

// ---------- G: la memoria de todos los rastros ----------
const Memoria: React.FC<{ f: number }> = ({ f }) => {
  const t = p(f, T.memoria, T.memoria + 45, IN_OUT);
  if (t <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.24 * t }}>
      <path d={dCubic(CAMINO)} fill="none" stroke={SUAVE} strokeWidth={3} pathLength={1} strokeDasharray={`${t} 2`} />
      {PISADAS.filter((q) => q.c < 3).map((q, i) => (
        <FormaPisada key={i} x={q.x} y={q.y} rot={q.rot} esc={0.8} color={SUAVE} op={p(f, T.memoria + i * 0.6, T.memoria + i * 0.6 + 12)} />
      ))}
      {[240, 150, 60].map((r) => (
        <circle key={r} cx={PUNTO[0]} cy={PUNTO[1]} r={r * t} fill="none" stroke={SUAVE} strokeWidth={2} />
      ))}
      <line x1={LINEA[0][0]} y1={540} x2={mix(LINEA[0][0], LINEA[3][0], t)} y2={540} stroke={SUAVE} strokeWidth={2} />
    </svg>
  );
};

// ---------- G: "Para que algo pase… y algo quede." ----------
const Cierre: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.pase) return null;
  const entra = p(f, T.pase, T.pase + 26);
  const sale = p(f, T.paseSale, T.paseSale + 24, IN);
  const xPase = (g: number) => mix(560, 0, p(g, T.pase, T.pase + 26)) + mix(0, -1500, p(g, T.paseSale, T.paseSale + 24, IN));
  const estiloPase: React.CSSProperties = {
    ...base, left: 0, width: 1920, top: 540 - 50, textAlign: "center", fontSize: 100, fontWeight: 400, letterSpacing: "-0.02em",
  };
  const quede = p(f, T.quede, T.quede + 22);
  const converge = p(f, T.converge + 4, T.marca + 6, IN);
  return (
    <>
      {/* ecos: la frase deja contornos detrás al irse */}
      {[4, 8, 12, 16].map((d, i) =>
        f >= T.paseSale && f < T.quede + 8 ? (
          <div key={d} style={{
            ...estiloPase, color: "transparent", WebkitTextStroke: `1.5px ${SUAVE}`,
            transform: `translateX(${xPase(f - d)}px)`,
            opacity: (0.55 - i * 0.1) * (1 - p(f, T.paseSale + 16, T.quede + 6)),
          }}>
            Para que algo pase…
          </div>
        ) : null,
      )}
      {sale < 1 && (
        <div style={{ ...estiloPase, color: TINTA, opacity: entra * (1 - sale), transform: `translateX(${xPase(f)}px)` }}>
          Para que algo pase…
        </div>
      )}
      {f >= T.quede && converge < 1 && (
        <div style={{
          ...base, left: 0, width: 1920, top: 540 - 55, textAlign: "center", fontSize: 116, fontWeight: 700,
          letterSpacing: `${mix(0.45, -0.03, quede)}em`, color: TINTA, opacity: quede * (1 - converge),
          transformOrigin: `${CABEZA[0]}px ${CABEZA[1] - 485}px`, transform: `scale(${1 - 0.8 * converge})`,
        }}>
          y algo quede.
        </div>
      )}
    </>
  );
};

// ---------- G: el logo, dibujado por los rastros ----------
const Logo: React.FC<{ f: number; logo: string }> = ({ f, logo }) => {
  if (f < T.marca) return null;
  const src = staticFile(logo);
  const radioA = p(f, T.marca, T.marca + 30, EASE) * 200;
  const completo = p(f, T.marcaFin - 8, T.marcaFin + 6);
  const eco = p(f, T.marca, T.marca + 60, Easing.out(Easing.cubic));
  const eco2 = p(f, T.marcaFin - 4, T.marcaFin + 36, Easing.out(Easing.cubic));
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[eco, eco2].map((t, i) =>
          t > 0 && t < 1 ? (
            <circle key={i} cx={CABEZA[0]} cy={CABEZA[1]} r={20 + t * (i ? 900 : 380)} fill="none" stroke={TINTA}
              strokeWidth={3 * (1 - t) + 0.5} opacity={(1 - t) * (i ? 0.25 : 0.55)} />
          ) : null,
        )}
      </svg>
      <svg viewBox="0 0 681 213" width={LOGO_W} height={213 * LOGO_K}
        style={{ position: "absolute", left: LOGO_X, top: LOGO_Y, filter: rastro.logoFiltroSobreClaro }}>
        <defs>
          <mask id="dibujo" maskUnits="userSpaceOnUse" x={0} y={0} width={681} height={213}>
            <circle cx={CABEZA_LOGO[0]} cy={CABEZA_LOGO[1]} r={radioA} fill="white" />
            {/* el círculo solo revela la "A"; el resto de las letras lo dibujan los trazos */}
            <rect x={0} y={0} width={100} height={213} fill="black" />
            <rect x={244} y={0} width={437} height={213} fill="black" />
            {TRAZOS_LOGO.map((tr, i) => (
              <path key={i} d={tr.d} fill="none" stroke="white" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round"
                pathLength={1} strokeDasharray={`${p(f, T.marca + tr.nace, T.marca + tr.nace + 24, IN_OUT)} 2`} />
            ))}
          </mask>
        </defs>
        <image href={src} width={681} height={213} mask="url(#dibujo)" opacity={1 - completo} />
        <image href={src} width={681} height={213} opacity={completo} />
      </svg>
    </>
  );
};

// ---------- Composición ----------
export type ManifiestoRastrosProps = { musica?: string; logo: string };

export const ManifiestoRastros: React.FC<ManifiestoRastrosProps> = ({ musica, logo }) => {
  const f = useCurrentFrame();
  const { s, c, k } = mundo(f);
  return (
    <AbsoluteFill style={{ background: PAPEL, fontFamily, overflow: "hidden" }}>
      {musica && <Audio src={staticFile(musica)} />}
      <AbsoluteFill style={{ transformOrigin: `${CABEZA[0]}px ${CABEZA[1]}px`, transform: `scale(${k})`, opacity: 1 - c }}>
        <AbsoluteFill style={{ transform: `scale(${s})` }}>
          <Memoria f={f} />
          <Huellas f={f} />
          <Ruido f={f} />
          <Frases f={f} />
        </AbsoluteFill>
      </AbsoluteFill>
      <Cierre f={f} />
      <Sobreviviente f={f} />
      <Logo f={f} logo={logo} />
    </AbsoluteFill>
  );
};
