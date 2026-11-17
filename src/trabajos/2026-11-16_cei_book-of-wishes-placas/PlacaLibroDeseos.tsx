// Trabajo 2026-11-16_cei_book-of-wishes-placas: placa de cierre de cada episodio de "The book of wishes" (CEI).
// Estética del libro (tapa azul terciopelo, marco y esquinas doradas, medallón dorado que gira, anillo de enredadera)
// con la paleta y las tipografías del CEI (New Spirit + Filson Pro). Medallón y esquina: recortes del diseño del
// libro (recortar_libro.py + Real-ESRGAN x2). Entra como una tapa de libro que se cierra sobre la pantalla.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FILSON, NEW_SPIRIT } from "../../marcas/cei/fuentes";
import { PALETA_CEI } from "../../marcas/cei/marca";

const ID = "2026-11-16_cei_book-of-wishes-placas";

// ---------- Constantes ----------
export const DURACION = 195; // 6,5 s
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SUAVE = Easing.bezier(0.22, 1, 0.36, 1);

const TAPA_FRAMES = 22; // la tapa gira y se cierra sobre la pantalla
const MARCO_DESDE = 8;
const MARCO_FRAMES = 30;
const ESQUINAS_DESDE = 16;
const TITULO1_DESDE = 18; // "The Book"
const TITULO2_DESDE = 30; // "of Wishes"
const LETRA_CADA = 2;
const DIVISOR_DESDE = 56;
const EPISODIO_DESDE = 64;
const NOMBRE_DESDE = 74;
const PROXIMO_DESDE = 98;
const BRILLO_CADA = 70; // un barrido de brillo sobre los dorados cada N frames

const ORO = {
  claro: "#fff3dc",
  medio: "#f6c97a",
  fuerte: PALETA_CEI.agosto,
  oscuro: PALETA_CEI.canela,
  linea: "#d9a55a",
};
const FONDO_CENTRO = "#164a7c"; // royal del CEI, un poco más claro al centro
const FONDO_MEDIO = PALETA_CEI.royal;
const FONDO_BORDE = "#0a2540"; // royal oscurecido en los rincones
const VINO = PALETA_CEI.vino; // fuera del marco y en la cartela

export type PropsPlaca = {
  episodio: number;
  nombre: string;
  siguiente?: string; // sin "siguiente": último episodio, cierra con "The End…"
};

const MARGEN = 56;

// ---------- Piezas ----------
const textoDorado = (frame: number, desde: number): React.CSSProperties => {
  const ciclo = ((frame - desde) % BRILLO_CADA) / BRILLO_CADA;
  const pos = interpolate(ciclo, [0, 0.45], [130, -30], clamp);
  return {
    backgroundImage: `linear-gradient(100deg, ${ORO.oscuro} 0%, ${ORO.fuerte} 25%, ${ORO.medio} 40%, ${ORO.claro} 48%, ${ORO.medio} 56%, ${ORO.fuerte} 75%, ${ORO.oscuro} 100%)`,
    backgroundSize: "250% 100%",
    backgroundPosition: `${pos}% 0`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    filter: `drop-shadow(0 0 2px rgba(60,20,0,0.6)) drop-shadow(0 0 14px rgba(239,145,60,0.5))`,
  };
};

// Palabra que entra letra por letra (sube, se enfoca, aparece)
const LetrasQueEntran: React.FC<{ texto: string; desde: number; estilo: React.CSSProperties }> = ({ texto, desde, estilo }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", justifyContent: "center", ...estilo, background: "none", filter: "none" }}>
      {texto.split("").map((l, i) => {
        const t = interpolate(frame, [desde + i * LETRA_CADA, desde + i * LETRA_CADA + 14], [0, 1], { ...clamp, easing: SUAVE });
        return (
          <span
            key={i}
            style={{
              ...estilo,
              display: "inline-block",
              whiteSpace: "pre",
              opacity: t,
              transform: `translateY(${(1 - t) * 40}px) scale(${0.8 + 0.2 * t})`,
              filter: `blur(${(1 - t) * 10}px) ${estilo.filter ?? ""}`,
            }}
          >
            {l}
          </span>
        );
      })}
    </div>
  );
};

const Fondo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: VINO }}>
    <div
      style={{
        position: "absolute",
        left: MARGEN + 7,
        top: MARGEN + 7,
        right: MARGEN + 7,
        bottom: MARGEN + 7,
        background: `radial-gradient(ellipse 80% 60% at 50% 48%, ${FONDO_CENTRO} 0%, ${FONDO_MEDIO} 60%, ${FONDO_BORDE} 100%)`,
      }}
    />
    {/* textura de terciopelo */}
    <svg width={1080} height={1920} style={{ position: "absolute", mixBlendMode: "overlay", opacity: 0.3 }}>
      <filter id="terciopelo">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={4} seed={7} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={1080} height={1920} filter="url(#terciopelo)" />
    </svg>
    <svg width={1080} height={1920} style={{ position: "absolute", mixBlendMode: "soft-light", opacity: 0.25 }}>
      <filter id="grano">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={1080} height={1920} filter="url(#grano)" />
    </svg>
  </AbsoluteFill>
);

const Marco: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [MARCO_DESDE, MARCO_DESDE + MARCO_FRAMES], [0, 1], { ...clamp, easing: SUAVE });
  const rect = (m: number, ancho: number) => {
    const w = 1080 - 2 * m;
    const h = 1920 - 2 * m;
    const per = 2 * (w + h);
    return (
      <rect
        x={m}
        y={m}
        width={w}
        height={h}
        fill="none"
        stroke="url(#oroLinea)"
        strokeWidth={ancho}
        strokeDasharray={per}
        strokeDashoffset={per * (1 - t)}
      />
    );
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", filter: "drop-shadow(0 0 6px rgba(239,145,60,0.45))" }}>
      <defs>
        <linearGradient id="oroLinea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ORO.medio} />
          <stop offset="0.5" stopColor={ORO.oscuro} />
          <stop offset="1" stopColor={ORO.medio} />
        </linearGradient>
      </defs>
      {rect(MARGEN, 4)}
      {rect(MARGEN + 14, 1.6)}
    </svg>
  );
};

const ESQUINA = 290;
const Esquinas: React.FC = () => {
  const frame = useCurrentFrame();
  const posiciones: { left?: number; right?: number; top?: number; bottom?: number; sx: number; sy: number }[] = [
    { left: MARGEN - 6, top: MARGEN - 6, sx: 1, sy: 1 },
    { right: MARGEN - 6, top: MARGEN - 6, sx: -1, sy: 1 },
    { left: MARGEN - 6, bottom: MARGEN - 6, sx: 1, sy: -1 },
    { right: MARGEN - 6, bottom: MARGEN - 6, sx: -1, sy: -1 },
  ];
  return (
    <>
      {posiciones.map((p, i) => {
        const t = interpolate(frame, [ESQUINAS_DESDE + i * 3, ESQUINAS_DESDE + i * 3 + 18], [0, 1], { ...clamp, easing: SUAVE });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.left,
              right: p.right,
              top: p.top,
              bottom: p.bottom,
              width: ESQUINA,
              height: ESQUINA,
              opacity: t,
              transformOrigin: `${p.sx > 0 ? "0" : "100%"} ${p.sy > 0 ? "0" : "100%"}`,
              transform: `scale(${0.6 + 0.4 * t})`,
              filter: `blur(${(1 - t) * 6}px) drop-shadow(0 0 8px rgba(239,145,60,0.4))`,
            }}
          >
            <Img
              src={staticFile(`trabajos/${ID}/img/esquina.png`)}
              style={{ width: ESQUINA, height: ESQUINA, transform: `scale(${p.sx}, ${p.sy})` }}
            />
          </div>
        );
      })}
    </>
  );
};

const Divisor: React.FC<{ y: number; desde: number }> = ({ y, desde }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [desde, desde + 20], [0, 1], { ...clamp, easing: SUAVE });
  return (
    <svg width={1080} height={40} style={{ position: "absolute", top: y - 20, filter: "drop-shadow(0 0 5px rgba(239,145,60,0.6))" }}>
      <line x1={540 - 40 - 200 * t} y1={20} x2={540 - 40} y2={20} stroke={ORO.linea} strokeWidth={2} />
      <line x1={540 + 40} y1={20} x2={540 + 40 + 200 * t} y2={20} stroke={ORO.linea} strokeWidth={2} />
      <g opacity={t} transform={`rotate(${45 + (1 - t) * 90} 540 20)`}>
        <rect x={530} y={10} width={20} height={20} fill="none" stroke={ORO.medio} strokeWidth={2} />
        <rect x={536} y={16} width={8} height={8} fill={ORO.medio} />
      </g>
      <circle cx={540 - 52} cy={20} r={3} fill={ORO.medio} opacity={t} />
      <circle cx={540 + 52} cy={20} r={3} fill={ORO.medio} opacity={t} />
    </svg>
  );
};

const Entra: React.FC<{ desde: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ desde, children, style }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [desde, desde + 18], [0, 1], { ...clamp, easing: SUAVE });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: t,
        transform: `translateY(${(1 - t) * 36}px)`,
        filter: `blur(${(1 - t) * 12}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------- Placa ----------
export const PlacaLibroDeseos: React.FC<PropsPlaca> = ({ episodio, nombre, siguiente }) => {
  const frame = useCurrentFrame();
  // La tapa del libro gira sobre el lomo (izquierda) y se cierra sobre la pantalla
  const tapa = interpolate(frame, [0, TAPA_FRAMES], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.9, 0.3, 1) });
  const sombraTapa = interpolate(tapa, [0, 1], [0.7, 0], clamp);

  const titulo: React.CSSProperties = {
    fontFamily: `"${NEW_SPIRIT}", serif`,
    fontWeight: 600,
    fontSize: 158,
    lineHeight: 1,
    letterSpacing: "0.01em",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: PALETA_CEI.carbon, perspective: 2200 }}>
      <AbsoluteFill
        style={{
          transformOrigin: "0% 50%",
          transform: `rotateY(${(1 - tapa) * -72}deg)`,
          backfaceVisibility: "hidden",
        }}
      >
        <Fondo />
        <Marco />
        <Esquinas />

        {/* Título partido arriba y abajo del medallón, como en la tapa */}
        <div style={{ position: "absolute", top: 470, left: 0, right: 0 }}>
          <LetrasQueEntran texto="The Book" desde={TITULO1_DESDE} estilo={{ ...titulo, ...textoDorado(frame, TITULO1_DESDE) }} />
        </div>
        <div style={{ position: "absolute", top: 655, left: 0, right: 0 }}>
          <LetrasQueEntran texto="of Wishes" desde={TITULO2_DESDE} estilo={{ ...titulo, ...textoDorado(frame, TITULO2_DESDE + 20) }} />
        </div>

        <Divisor y={905} desde={DIVISOR_DESDE} />

        <Entra desde={EPISODIO_DESDE} style={{ top: 955 }}>
          <span style={{ fontFamily: `"${FILSON}", sans-serif`, fontWeight: 500, fontSize: 46, letterSpacing: "0.32em", color: PALETA_CEI.hueso }}>
            EPISODE {episodio}
          </span>
        </Entra>
        <Entra desde={NOMBRE_DESDE} style={{ top: 1045 }}>
          <span style={{ ...titulo, fontSize: nombre.length > 15 ? 78 : 96, display: "inline-block", ...textoDorado(frame, NOMBRE_DESDE + 10) }}>{nombre}</span>
        </Entra>

        <Proximo desde={PROXIMO_DESDE} siguiente={siguiente} />

        {/* sombra que se va mientras la tapa termina de cerrarse */}
        <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${sombraTapa})` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// "Next episode" en una cartela dorada; en el último episodio, "The End…"
const Proximo: React.FC<{ desde: number; siguiente?: string }> = ({ desde, siguiente }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - desde, fps, config: { damping: 15, stiffness: 90 } });
  const t = interpolate(frame, [desde, desde + 16], [0, 1], { ...clamp, easing: SUAVE });
  const ANCHO = 800;
  const ALTO = 220;
  const TOP = 1240;
  if (!siguiente) {
    return (
      <Entra desde={desde} style={{ top: TOP + 10 }}>
        <span style={{ fontFamily: `"${NEW_SPIRIT}", serif`, fontWeight: 400, fontSize: 150, display: "inline-block", ...textoDorado(frame, desde + 10) }}>
          The End…
        </span>
      </Entra>
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - ANCHO / 2,
        top: TOP,
        width: ANCHO,
        height: ALTO,
        opacity: t,
        transform: `translateY(${(1 - s) * 80}px) scale(${0.92 + 0.08 * s})`,
        filter: `blur(${(1 - t) * 10}px)`,
      }}
    >
      {/* cartela: borde doble dorado con muescas en las esquinas */}
      <svg width={ANCHO} height={ALTO} style={{ position: "absolute", inset: 0, overflow: "visible", filter: "drop-shadow(0 0 10px rgba(239,145,60,0.45))" }}>
        <path
          d={`M28,4 H${ANCHO - 28} Q${ANCHO - 28},28 ${ANCHO - 4},28 V${ALTO - 28} Q${ANCHO - 28},${ALTO - 28} ${ANCHO - 28},${ALTO - 4} H28 Q28,${ALTO - 28} 4,${ALTO - 28} V28 Q28,28 28,4 Z`}
          fill={VINO}
          stroke={ORO.medio}
          strokeWidth={3}
        />
        <rect x={20} y={20} width={ANCHO - 40} height={ALTO - 40} fill="none" stroke={ORO.oscuro} strokeWidth={1.4} />
      </svg>
      <div style={{ position: "absolute", top: 46, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: `"${FILSON}", sans-serif`, fontWeight: 500, fontSize: 36, letterSpacing: "0.3em", color: PALETA_CEI.agosto }}>
          NEXT EPISODE
        </span>
      </div>
      <div style={{ position: "absolute", top: 98, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: `"${NEW_SPIRIT}", serif`, fontWeight: 500, fontSize: siguiente.length > 15 ? 62 : 74, color: PALETA_CEI.hueso, textShadow: "0 0 18px rgba(239,145,60,0.6)" }}>
          {siguiente}
        </span>
      </div>
    </div>
  );
};
