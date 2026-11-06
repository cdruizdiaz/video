// Placa de explicación del CTPSFPC: pantalla completa con la voz de la persona encima (sus subtítulos siguen, sobre
// la franja índigo de abajo). Estética del Social Media Playbook 2026: "Bento Grid + Bauhaus" — módulos de esquinas
// redondeadas en colores planos de la paleta, íconos hechos de formas geométricas simples, titulares en Almarai
// ExtraBold y textos en Be Vietnam Pro. Entra con un círculo que se abre desde el número; cada módulo entra (escala
// desde su esquina) cuando se nombra lo que muestra. Sale en seco con el corte de la toma.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ALMARAI, BE_VIETNAM } from "../../marcas/ctpsfpc/fuentes";
import { PALETA_CTPSFPC as P } from "../../marcas/ctpsfpc/marca";

// ---------- Constantes de animación ----------
const APERTURA = 12; // frames del círculo que se abre
const NUMERO = { x: 140, y: 230, d: 160 }; // círculo del número (centro y diámetro)
const TITULO_X = 250;
const TITULO_TAMANO = 100;
const BAJADA_TAMANO = 34;
const ENCABEZADO_DEMORA = 4; // frames tras la apertura
const MODULO_DURA = 16; // frames de la entrada de cada módulo
const CONTENIDO_DEMORA = 5; // frames hasta que entra el contenido del módulo
const RADIO = 44; // esquinas de los módulos
const FRANJA_Y = 1400; // franja índigo de los subtítulos
const MODULO_TITULO = 46;
const MODULO_TITULO_ANCHO = 64; // en los módulos horizontales (anchos)
const ICONO = 230; // px del ícono (dibujado en 200)
const MODULO_TEXTO = 30;
const ease = Easing.bezier(0.33, 1, 0.68, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Icono =
  | "documento-sello"
  | "pantalla-firma"
  | "par-idiomas"
  | "responsabilidad"
  | "documento-colega"
  | "informe"
  | "posicion"
  | "consulta"
  | "conocimiento"
  | "matricula"
  | "vigente"
  | "registro"
  | "requisitos"
  | "pago"
  | "hojas-unidas"
  | "certifica"
  | "contenido-no";

export type Modulo = {
  x: number;
  y: number;
  w: number;
  h: number;
  fondo: string;
  tinta: string;
  icono: Icono;
  titulo: string;
  texto?: string;
  entra: number; // frame (relativo a la placa) en que entra
  horizontal?: boolean; // ícono a la izquierda y textos a la derecha (módulos anchos y bajos)
};

export type PlacaExplicacionProps = {
  numero: string; // "01"
  titulo: string;
  bajada: string;
  modulos: Modulo[];
};

// ---------- Íconos (formas geométricas planas, 200×200) ----------
const Firma: React.FC<{ t: number; color: string; d?: string }> = ({
  t,
  color,
  d = "M20 40 C 40 0, 55 70, 75 30 S 110 10, 120 45 S 150 60, 175 25",
}) => (
  <path
    d={d}
    fill="none"
    stroke={color}
    strokeWidth={7}
    strokeLinecap="round"
    pathLength={1}
    strokeDasharray={1}
    strokeDashoffset={1 - t}
  />
);

const Renglones: React.FC<{ x: number; y: number; w: number; n: number; color: string; t: number }> = ({
  x,
  y,
  w,
  n,
  color,
  t,
}) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <rect
        key={i}
        x={x}
        y={y + i * 20}
        width={(i === n - 1 ? w * 0.6 : w) * interpolate(t, [i * 0.12, i * 0.12 + 0.5], [0, 1], clamp)}
        height={8}
        rx={4}
        fill={color}
        opacity={0.35}
      />
    ))}
  </>
);

export const IconoSvg: React.FC<{ icono: Icono; t: number; tinta: string; fondo: string; tamano?: number }> = ({
  icono,
  t,
  tinta,
  fondo,
  tamano = ICONO,
}) => {
  // t: 0→1 a lo largo de ~1 s desde que entra el contenido
  const a = (desde: number, hasta: number) => ease(interpolate(t, [desde, hasta], [0, 1], clamp));
  const papel = fondo === P.marfil ? "#ffffff" : P.marfil;
  const marco = fondo === P.indigo ? P.wisteria : P.indigo; // marco del monitor
  let cuerpo: React.ReactNode = null;
  switch (icono) {
    case "documento-sello":
      cuerpo = (
        <>
          <rect x={30} y={10} width={130} height={175} rx={14} fill={papel} />
          <Renglones x={50} y={36} w={90} n={4} color={P.indigo} t={a(0, 0.5)} />
          <g transform="translate(0 95) scale(0.7)">
            <Firma t={a(0.3, 0.8)} color={P.indigo} d="M70 40 C 90 0, 105 70, 125 30 S 160 10, 170 45" />
          </g>
          <g transform={`translate(150 150) scale(${a(0.65, 0.95)})`}>
            <circle r={44} fill={P.chili} />
            <circle r={30} fill="none" stroke={P.marfil} strokeWidth={5} />
            <circle r={9} fill={P.marfil} />
          </g>
        </>
      );
      break;
    case "pantalla-firma":
      cuerpo = (
        <>
          <rect x={10} y={20} width={180} height={130} rx={16} fill={marco} />
          <rect x={24} y={34} width={152} height={102} rx={8} fill={papel} />
          <Renglones x={40} y={48} w={120} n={2} color={P.indigo} t={a(0, 0.4)} />
          <g transform="translate(18 72) scale(0.8)">
            <Firma t={a(0.3, 0.85)} color={P.chili} />
          </g>
          <rect x={80} y={150} width={40} height={20} fill={marco} />
          <rect x={55} y={168} width={90} height={12} rx={6} fill={marco} />
        </>
      );
      break;
    case "par-idiomas": {
      const s = a(0, 0.5);
      return (
        <svg viewBox="0 0 320 200" width={(320 * tamano) / 200} height={tamano} style={{ overflow: "visible" }}>
          <g transform={`translate(70 100) scale(${s})`}>
            <circle r={66} fill={fondo === P.indigo ? P.wisteria : P.indigo} />
            <text
              textAnchor="middle"
              y={26}
              fontFamily={`"${ALMARAI}"`}
              fontWeight={800}
              fontSize={76}
              fill={fondo === P.indigo ? P.indigo : P.marfil}
            >
              A
            </text>
          </g>
          <g transform={`translate(250 100) scale(${a(0.15, 0.65)})`}>
            <circle r={66} fill={P.chili} />
            <text textAnchor="middle" y={26} fontFamily={`"${ALMARAI}"`} fontWeight={800} fontSize={76} fill={P.marfil}>
              B
            </text>
          </g>
          <g opacity={a(0.45, 0.8)} stroke={tinta} strokeWidth={8} strokeLinecap="round" fill="none">
            <path d={`M140 82 H ${140 + 40 * a(0.45, 0.8)}`} />
            <path d="M172 70 L184 82 L172 94" opacity={a(0.7, 0.8)} />
            <path d={`M180 118 H ${180 - 40 * a(0.45, 0.8)}`} />
            <path d="M148 106 L136 118 L148 130" opacity={a(0.7, 0.8)} />
          </g>
        </svg>
      );
    }
    case "responsabilidad":
      // persona (Bauhaus: círculo + medio círculo) con el sello de la firma
      cuerpo = (
        <>
          <g transform={`translate(85 190) scale(${a(0, 0.45)}) translate(0 -190)`}>
            <circle cx={0} cy={62} r={38} fill={tinta} />
            <path d="M-75 190 A 75 75 0 0 1 75 190 Z" fill={tinta} />
          </g>
          <g transform={`translate(160 140) scale(${a(0.4, 0.75)})`}>
            <circle r={40} fill={P.chili} />
            <path d="M-18 0 L-5 14 L19 -12" fill="none" stroke={P.marfil} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </>
      );
      break;
    case "documento-colega":
      cuerpo = (
        <>
          <rect x={20} y={10} width={120} height={165} rx={14} fill={papel} />
          <Renglones x={38} y={36} w={84} n={5} color={P.indigo} t={a(0, 0.5)} />
          <g transform={`translate(150 135) scale(${a(0.4, 0.8)})`}>
            <circle r={52} fill={P.chili} />
            <circle cx={0} cy={-14} r={16} fill={P.marfil} />
            <path d="M-28 30 A 28 28 0 0 1 28 30 Z" fill={P.marfil} />
          </g>
        </>
      );
      break;
    case "informe":
      cuerpo = (
        <>
          <rect x={25} y={5} width={150} height={190} rx={14} fill={papel} />
          <Renglones x={45} y={28} w={110} n={2} color={P.indigo} t={a(0, 0.4)} />
          {[0, 1, 2].map((i) => {
            const alto = [50, 80, 64][i] * a(0.2 + i * 0.12, 0.6 + i * 0.12);
            return (
              <rect
                key={i}
                x={52 + i * 36}
                y={170 - alto}
                width={24}
                height={alto}
                rx={4}
                fill={[P.wisteria, P.chili, P.indigo][i]}
              />
            );
          })}
        </>
      );
      break;
    case "posicion":
      // globo (cuarto de círculo invertido) con comillas latinas
      cuerpo = (
        <g transform={`translate(100 100) scale(${a(0, 0.5)})`}>
          <path
            d="M-80 -70 H 50 A 30 30 0 0 1 80 -40 V 50 H 10 L -30 88 V 50 H -80 Z"
            fill={fondo === P.chili ? P.marfil : P.chili}
          />
          <text
            textAnchor="middle"
            x={0}
            y={32}
            fontFamily={`"${ALMARAI}"`}
            fontWeight={800}
            fontSize={110}
            fill={fondo === P.chili ? P.chili : P.marfil}
            opacity={a(0.4, 0.7)}
          >
            «»
          </text>
        </g>
      );
      break;
    case "consulta":
      cuerpo = (
        <>
          <g transform={`translate(55 120) scale(${a(0, 0.45)})`}>
            <circle cx={0} cy={-28} r={26} fill={tinta} />
            <path d="M-50 70 A 50 50 0 0 1 50 70 Z" fill={tinta} />
          </g>
          <g transform={`translate(140 70) scale(${a(0.3, 0.7)})`}>
            <circle r={56} fill={fondo === P.wisteria ? P.marfil : P.wisteria} />
            <path d="M-30 40 L-46 64 L-6 52 Z" fill={fondo === P.wisteria ? P.marfil : P.wisteria} />
            <text textAnchor="middle" y={28} fontFamily={`"${ALMARAI}"`} fontWeight={800} fontSize={84} fill={P.indigo}>
              ?
            </text>
          </g>
        </>
      );
      break;
    case "conocimiento":
      // blanco Bauhaus: anillos concéntricos que se arman de afuera hacia adentro
      cuerpo = (
        <g transform="translate(100 100)">
          <circle r={90 * a(0, 0.4)} fill={P.wisteria} />
          <circle r={64 * a(0.15, 0.55)} fill={P.indigo} />
          <circle r={40 * a(0.3, 0.7)} fill={P.marfil} />
          <circle r={18 * a(0.45, 0.85)} fill={P.chili} />
        </g>
      );
      break;
    case "matricula":
      // credencial: foto en círculo, renglones y franja de color arriba
      cuerpo = (
        <g transform={`translate(100 100) scale(${a(0, 0.4)}) translate(-100 -100)`}>
          <rect x={5} y={40} width={190} height={125} rx={14} fill={papel} />
          <path d="M5 54 A 14 14 0 0 1 19 40 H 181 A 14 14 0 0 1 195 54 V 62 H 5 Z" fill={P.chili} />
          <circle cx={52} cy={110} r={30} fill={P.wisteria} />
          <circle cx={52} cy={102} r={11} fill={P.indigo} />
          <path d="M33 132 A 19 19 0 0 1 71 132 Z" fill={P.indigo} />
          <Renglones x={96} y={88} w={80} n={3} color={P.indigo} t={a(0.3, 0.8)} />
        </g>
      );
      break;
    case "vigente":
      // calendario con tilde
      cuerpo = (
        <>
          <g transform={`translate(90 100) scale(${a(0, 0.4)}) translate(-90 -100)`}>
            <rect x={10} y={30} width={160} height={150} rx={16} fill={papel} />
            <path d="M10 46 A 16 16 0 0 1 26 30 H 154 A 16 16 0 0 1 170 46 V 70 H 10 Z" fill={P.indigo} />
            <rect x={45} y={16} width={12} height={30} rx={6} fill={P.chili} />
            <rect x={123} y={16} width={12} height={30} rx={6} fill={P.chili} />
            {[0, 1, 2].map((f) =>
              [0, 1, 2, 3].map((c) => (
                <circle key={`${f}${c}`} cx={40 + c * 33} cy={95 + f * 28} r={7} fill={P.indigo} opacity={0.3} />
              )),
            )}
          </g>
          <g transform={`translate(160 155) scale(${a(0.45, 0.8)})`}>
            <circle r={40} fill={P.chili} />
            <path
              d="M-18 0 L-5 14 L19 -12"
              fill="none"
              stroke={P.marfil}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      );
      break;
    case "registro":
      // fichero: tres carpetas con solapas que entran de a una, y una firma encima
      cuerpo = (
        <>
          {[P.wisteria, P.chili, papel].map((c, i) => (
            <g
              key={i}
              transform={`translate(0 ${(1 - a(i * 0.15, 0.4 + i * 0.15)) * 30})`}
              opacity={a(i * 0.15, 0.3 + i * 0.15)}
            >
              <path
                d={`M${15 + i * 8} ${70 + i * 30} h 50 l 10 -14 h 40 l 10 14 h ${55 - i * 16} v 90 h -${165 - i * 16} Z`}
                fill={c}
              />
            </g>
          ))}
          <g transform="translate(40 128) scale(0.6)">
            <Firma t={a(0.5, 0.9)} color={P.indigo} />
          </g>
        </>
      );
      break;
    case "requisitos":
      // lista con casillas que se van tildando
      cuerpo = (
        <>
          <rect x={30} y={5} width={140} height={190} rx={14} fill={papel} />
          {[0, 1, 2].map((i) => {
            const v = a(0.15 + i * 0.22, 0.35 + i * 0.22);
            return (
              <g key={i} transform={`translate(52 ${45 + i * 50})`}>
                <rect
                  x={0}
                  y={-14}
                  width={28}
                  height={28}
                  rx={7}
                  fill={v > 0.5 ? P.chili : "none"}
                  stroke={P.chili}
                  strokeWidth={4}
                />
                <path
                  d="M6 0 L12 7 L22 -6"
                  fill="none"
                  stroke={P.marfil}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={v}
                />
                <rect
                  x={42}
                  y={-4}
                  width={56 * a(0.1 + i * 0.22, 0.4 + i * 0.22)}
                  height={8}
                  rx={4}
                  fill={P.indigo}
                  opacity={0.35}
                />
              </g>
            );
          })}
        </>
      );
      break;
    case "pago":
      // celular con una tarjeta y la tilde del pago
      cuerpo = (
        <>
          <rect x={50} y={0} width={100} height={195} rx={20} fill={marco} />
          <rect x={60} y={20} width={80} height={150} rx={8} fill={papel} />
          <g transform={`translate(100 70) scale(${a(0.1, 0.45)})`}>
            <rect x={-32} y={-20} width={64} height={40} rx={7} fill={P.chili} />
            <rect x={-32} y={-10} width={64} height={8} fill={P.indigo} />
          </g>
          <g transform={`translate(100 130) scale(${a(0.5, 0.85)})`}>
            <circle r={22} fill={P.indigo} />
            <path
              d="M-10 0 L-3 8 L11 -7"
              fill="none"
              stroke={P.marfil}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      );
      break;
    case "hojas-unidas":
      // la traducción y la hoja de legalización, unidas por un clip que se dibuja
      cuerpo = (
        <>
          <g transform={`translate(${(1 - a(0, 0.4)) * -30} 0)`} opacity={a(0, 0.3)}>
            <rect x={10} y={20} width={110} height={150} rx={12} fill={papel} />
            <Renglones x={26} y={44} w={78} n={5} color={P.indigo} t={a(0, 0.4)} />
          </g>
          <g transform={`translate(${(1 - a(0.2, 0.6)) * 40} 0)`} opacity={a(0.2, 0.5)}>
            <rect x={75} y={40} width={110} height={150} rx={12} fill={fondo === P.wisteria ? papel : P.wisteria} />
            <circle cx={150} cy={150} r={22} fill={P.chili} />
            <circle cx={150} cy={150} r={13} fill="none" stroke={P.marfil} strokeWidth={4} />
            <Renglones x={91} y={62} w={70} n={3} color={P.indigo} t={a(0.3, 0.7)} />
          </g>
          <path
            d="M95 8 V 62 A 10 10 0 0 0 115 62 V 18 A 6 6 0 0 0 103 18 V 58"
            fill="none"
            stroke={fondo === P.chili ? P.indigo : P.chili}
            strokeWidth={6}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - a(0.6, 0.95)}
          />
        </>
      );
      break;
    case "certifica":
      // sello grande que cae con su tilde
      cuerpo = (
        <g
          transform={`translate(100 100) scale(${interpolate(a(0, 0.5), [0, 1], [1.6, 1])})`}
          opacity={a(0, 0.25)}
        >
          <circle r={88} fill={fondo === P.chili ? P.marfil : P.chili} />
          <circle
            r={70}
            fill="none"
            stroke={fondo === P.chili ? P.chili : P.marfil}
            strokeWidth={6}
            strokeDasharray="10 9"
          />
          <path
            d="M-34 0 L-10 26 L38 -24"
            fill="none"
            stroke={fondo === P.chili ? P.chili : P.marfil}
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
      break;
    case "contenido-no":
      // documento con una cruz: el Colegio no se expide sobre el contenido
      cuerpo = (
        <>
          <rect x={30} y={5} width={140} height={190} rx={14} fill={papel} />
          <Renglones x={50} y={32} w={100} n={7} color={P.indigo} t={a(0, 0.4)} />
          <g transform={`translate(140 150) scale(${a(0.4, 0.75)})`}>
            <circle r={42} fill={fondo === P.chili ? P.indigo : P.chili} />
            <path d="M-16 -16 L16 16 M16 -16 L-16 16" stroke={P.marfil} strokeWidth={10} strokeLinecap="round" />
          </g>
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 200 200" width={tamano} height={tamano} style={{ overflow: "visible" }}>
      {cuerpo}
    </svg>
  );
};

const ModuloBento: React.FC<{ m: Modulo }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({
    frame: frame - m.entra,
    fps,
    durationInFrames: MODULO_DURA,
    config: { damping: 15, mass: 0.7 },
  });
  if (frame < m.entra) return null;
  const c = frame - m.entra - CONTENIDO_DEMORA;
  const textoT = ease(interpolate(c, [4, 14], [0, 1], clamp));
  const iconoT = interpolate(c, [0, 30], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: m.x,
        top: m.y,
        width: m.w,
        height: m.h,
        borderRadius: RADIO,
        background: m.fondo,
        transform: `scale(${t})`,
        transformOrigin: "0% 0%",
        overflow: "hidden",
        display: "flex",
        flexDirection: m.horizontal ? "row" : "column",
        alignItems: m.horizontal ? "center" : "flex-start",
        justifyContent: m.horizontal ? "flex-start" : "space-between",
        padding: m.horizontal ? "0 44px" : "40px 40px 38px",
        boxSizing: "border-box",
        gap: m.horizontal ? 36 : 0,
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <IconoSvg icono={m.icono} t={iconoT} tinta={m.tinta} fondo={m.fondo} />
      </div>
      <div style={{ opacity: textoT, transform: `translateY(${(1 - textoT) * 16}px)` }}>
        <div
          style={{
            fontFamily: `"${ALMARAI}", sans-serif`,
            fontWeight: 800,
            fontSize: m.horizontal ? MODULO_TITULO_ANCHO : MODULO_TITULO,
            lineHeight: 1.02,
            color: m.tinta,
          }}
        >
          {m.titulo}
        </div>
        {m.texto ? (
          <div
            style={{
              marginTop: 10,
              fontFamily: `"${BE_VIETNAM}", sans-serif`,
              fontWeight: 500,
              fontSize: MODULO_TEXTO,
              lineHeight: 1.2,
              color: m.tinta,
              opacity: 0.85,
            }}
          >
            {m.texto}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const PlacaExplicacion: React.FC<PlacaExplicacionProps> = ({
  numero,
  titulo,
  bajada,
  modulos,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const apertura = ease(interpolate(frame, [0, APERTURA], [0, 1], clamp));
  const encabezado = spring({
    frame: frame - ENCABEZADO_DEMORA,
    fps,
    durationInFrames: 18,
    config: { damping: 14 },
  });
  const textoT = ease(interpolate(frame, [ENCABEZADO_DEMORA + 4, ENCABEZADO_DEMORA + 16], [0, 1], clamp));
  const franja = ease(interpolate(frame, [6, 18], [0, 1], clamp));
  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${apertura * 2300}px at ${NUMERO.x}px ${NUMERO.y}px)`,
        background: P.marfil,
      }}
    >
      {/* franja índigo de los subtítulos, con dos formas Bauhaus en los bordes */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: FRANJA_Y, // ya está en su lugar: el círculo la descubre (si sube, el subtítulo queda blanco sobre marfil)
          bottom: 0,
          background: P.indigo,
          borderTopLeftRadius: RADIO,
          borderTopRightRadius: RADIO,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 190,
            height: 190,
            background: P.wisteria,
            borderTopRightRadius: "100%",
            transform: `scale(${franja})`,
            transformOrigin: "0% 100%",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 120,
            height: 240,
            background: P.chili,
            borderTopLeftRadius: 120,
            borderBottomLeftRadius: 120,
            transform: `scale(${franja})`,
            transformOrigin: "100% 50%",
          }}
        />
      </div>
      {/* encabezado: número en círculo Chili + título Almarai + bajada */}
      <div
        style={{
          position: "absolute",
          left: NUMERO.x - NUMERO.d / 2,
          top: NUMERO.y - NUMERO.d / 2,
          width: NUMERO.d,
          height: NUMERO.d,
          borderRadius: "50%",
          background: P.chili,
          transform: `scale(${encabezado})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: `"${ALMARAI}", sans-serif`,
          fontWeight: 800,
          fontSize: 78,
          color: P.marfil,
          paddingTop: 8,
          boxSizing: "border-box",
        }}
      >
        {numero}
      </div>
      <div
        style={{
          position: "absolute",
          left: TITULO_X,
          top: NUMERO.y - 70,
          opacity: textoT,
          transform: `translateX(${(1 - textoT) * -24}px)`,
        }}
      >
        <div
          style={{
            fontFamily: `"${ALMARAI}", sans-serif`,
            fontWeight: 800,
            fontSize: TITULO_TAMANO,
            lineHeight: 1,
            color: P.indigo,
          }}
        >
          {titulo}
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: `"${BE_VIETNAM}", sans-serif`,
            fontWeight: 500,
            fontSize: BAJADA_TAMANO,
            color: P.gris,
          }}
        >
          {bajada}
        </div>
      </div>
      {modulos.map((m, i) => (
        <ModuloBento key={i} m={m} />
      ))}
    </AbsoluteFill>
  );
};
