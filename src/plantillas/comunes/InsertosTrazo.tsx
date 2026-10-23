// Insertos "de trazo" para videos de entrevista: dibujos de línea que se trazan a medida que se habla
// (percha y curva de ventas, embudo, mensajes sin leer, enchufe, chat que responde, tilde, barras, flecha).
// A propósito NO usan tarjetas blancas, baldosas ni rebote (lo de `Insertos.tsx`): línea clara con sombra
// paralela negra (como los subtítulos), acento naranja de la marca y rótulos a mano (Nostalgic Memories).
// Cada uno vive en un <Sequence> (frame 0 = entra) y recibe su duración en frames; con `seco` sale de golpe.
// Los frames de cada hito son relativos al inicio del inserto.
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Marca } from "../../marcas";

// ---------- Constantes de animación ----------
const TINTA = "#f5f5ed"; // claro de la paleta del cliente
const NARANJA = "#f97d55"; // naranja de la marca
const OSCURO = "#262626";
const SOMBRA = "drop-shadow(3px 6px 0 rgba(0, 0, 0, 0.88))"; // paralela, como los subtítulos
const SOMBRA_SUAVE =
  "drop-shadow(0 18px 18px rgba(0, 0, 0, 0.34)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.22))"; // difusa, flotando
const GROSOR = 9;
const SALE = 6; // frames del desvanecido de salida (sin `seco`)
const VENTAS_PERCHA = 14; // frames en que se traza la percha
const VENTAS_CURVA = 26; // frames en que se traza la curva de ventas
const EMBUDO_TRAZO = 16;
const EMBUDO_CAIDA = 12; // frames que tarda la gota en llegar a la boca
const EMBUDO_ABSORBE = 10; // frames en que la gota se mete y desaparece
const MENSAJES_CUENTA = 26; // frames que tarda el contador en llegar a 99+
const ENCHUFE_ACERCA = 18; // frames que viaja el enchufe hasta el tomacorriente
const TILDE_CIRCULO = 16;
const TILDE_MARCA = 10;
const BARRA_SUBE = 14;
const FLECHA_TRAZO = 18;
const FLECHA_VAIVEN = 10; // px que sube y baja la flecha
const FLECHA_PERIODO = 22; // frames por vaivén
// asterisco de public/marcas/volto/estrella.svg (viewBox 27×27)
const ESTRELLA =
  "M17.0621 11.4931H26.2481V14.7551H17.0591L23.5576 21.2531L21.2536 23.5571L14.7556 17.0591V26.2481H11.4931V17.0621L4.99752 23.5576L2.69051 21.2536L9.18904 14.7556H0V11.4931H9.18604L2.69051 4.99752L4.99752 2.69101L11.4931 9.18604V0H14.7556V9.18904L21.2536 2.69101L23.5576 4.99752L17.0621 11.4931Z";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 → 1 con ease in-out a partir de `desde`
const progreso = (f: number, desde: number, dura: number) =>
  interpolate(f, [desde, desde + dura], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

// ---------- Piezas comunes ----------
type Comun = { x: number; y: number; duracion: number; seco?: boolean };

// Lienzo centrado en (x, y) con la sombra paralela; el dibujo se hace en coordenadas del viewBox
const Lienzo: React.FC<
  Comun & {
    ancho: number;
    alto: number;
    suave?: boolean; // sombra difusa en vez de la paralela
    children: React.ReactNode;
  }
> = ({ x, y, ancho, alto, duracion, seco, suave, children }) => {
  const f = useCurrentFrame();
  const opacidad = seco
    ? 1
    : interpolate(f, [duracion - SALE, duracion], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - alto / 2,
        width: ancho,
        height: alto,
        opacity: opacidad,
        filter: suave ? SOMBRA_SUAVE : SOMBRA,
      }}
    >
      <svg
        width={ancho}
        height={alto}
        viewBox={`0 0 ${ancho} ${alto}`}
        style={{ overflow: "visible" }}
      >
        {children}
      </svg>
    </div>
  );
};

// Trazo que se dibuja de 0 a `p` (pathLength normalizado a 1)
const Trazo: React.FC<{
  d: string;
  p: number;
  color?: string;
  grosor?: number;
  relleno?: string;
}> = ({ d, p, color = TINTA, grosor = GROSOR, relleno = "none" }) =>
  p <= 0.001 ? null : (
    <path
      d={d}
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - p}
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={relleno}
    />
  );

// Globo de chat de 300×176 (cola abajo a la izquierda), con su origen en la esquina superior izquierda
const GLOBO =
  "M30 0 H270 a30 30 0 0 1 30 30 V110 a30 30 0 0 1 -30 30 H112 L68 176 L74 140 H30 a30 30 0 0 1 -30 -30 V30 a30 30 0 0 1 30 -30 Z";
const GLOBO_RAYAS = ["M40 48 H196", "M40 84 H150"]; // renglones de texto

// ---------- Percha → curva de ventas que se aplana contra un techo ----------
export const TrazoVentas: React.FC<
  Comun & { perchaFrame: number; graficoFrame: number; techoFrame: number }
> = ({ perchaFrame, graficoFrame, techoFrame, ...c }) => {
  const f = useCurrentFrame();
  const percha =
    progreso(f, perchaFrame, VENTAS_PERCHA) *
    (1 - progreso(f, graficoFrame - 6, 8));
  const ejes = progreso(f, graficoFrame, 10);
  const curva = progreso(f, graficoFrame + 8, VENTAS_CURVA);
  const techo = progreso(f, techoFrame, 8);
  return (
    <Lienzo {...c} ancho={760} alto={340}>
      <Trazo d="M380 124 L380 104 C380 62 436 66 432 100" p={percha} />
      <Trazo
        d="M380 124 L222 218 C206 228 212 252 236 252 L524 252 C548 252 554 228 538 218 Z"
        p={percha}
      />
      <Trazo d="M150 40 L150 300 L650 300" p={ejes} />
      <Trazo
        d="M170 280 C240 270 280 200 340 160 C400 120 430 100 500 98 L640 98"
        p={curva}
        color={TINTA}
        grosor={12}
      />
      <path
        d="M150 98 L700 98"
        stroke={NARANJA}
        strokeWidth={7}
        strokeDasharray="16 14"
        strokeLinecap="round"
        opacity={techo}
      />
      <circle cx={640} cy={98} r={14} fill={NARANJA} opacity={techo} />
    </Lienzo>
  );
};

// ---------- Embudo: entran consultas y no sale nada ----------
const EMBUDO_X = [190, 300, 410, 250, 360, 450];
export const TrazoEmbudo: React.FC<
  Comun & { gotasFrames: number[]; nadaFrame: number }
> = ({ gotasFrames, nadaFrame, ...c }) => {
  const f = useCurrentFrame();
  const embudo = progreso(f, 0, EMBUDO_TRAZO);
  const cruz = progreso(f, nadaFrame, 8);
  return (
    <Lienzo {...c} ancho={640} alto={340}>
      <Trazo
        d="M120 40 L520 40 L372 196 L372 270 L268 270 L268 196 Z"
        p={embudo}
      />
      {gotasFrames.map((g, i) => {
        const t = f - g;
        if (t < 0 || t > EMBUDO_CAIDA + EMBUDO_ABSORBE) return null;
        const x0 = EMBUDO_X[i % EMBUDO_X.length];
        const cx = interpolate(
          t,
          [0, EMBUDO_CAIDA, EMBUDO_CAIDA + EMBUDO_ABSORBE],
          [x0, x0, 320],
          clamp,
        );
        const cy = interpolate(
          t,
          [0, EMBUDO_CAIDA, EMBUDO_CAIDA + EMBUDO_ABSORBE],
          [-40, 70, 200],
          clamp,
        );
        const r = interpolate(
          t,
          [EMBUDO_CAIDA, EMBUDO_CAIDA + EMBUDO_ABSORBE],
          [18, 0],
          clamp,
        );
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={TINTA}
            strokeWidth={GROSOR}
          />
        );
      })}
      <Trazo d="M294 290 L346 338" p={cruz} color={NARANJA} grosor={13} />
      <Trazo d="M346 290 L294 338" p={cruz} color={NARANJA} grosor={13} />
    </Lienzo>
  );
};

// ---------- Mensajes que se apilan con el contador de no leídos ----------
const MENSAJES_POS = [
  { x: 20, y: 150 },
  { x: 170, y: 88 },
  { x: 310, y: 26 },
];
export const TrazoMensajes: React.FC<
  Comun & { m: Marca; frames: number[]; contadorFrame: number }
> = ({ m, frames, contadorFrame, ...c }) => {
  const f = useCurrentFrame();
  const n = Math.floor(
    interpolate(f, [contadorFrame, contadorFrame + MENSAJES_CUENTA], [1, 99], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    }),
  );
  const insignia = interpolate(f, [contadorFrame - 4, contadorFrame + 4], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.8)),
  });
  return (
    <Lienzo {...c} ancho={640} alto={340}>
      {MENSAJES_POS.map((pos, i) => {
        const p = progreso(f, frames[i] ?? 0, 12);
        if (p <= 0.001 || frames[i] === undefined) return null;
        return (
          <g key={i} transform={`translate(${pos.x} ${pos.y})`}>
            <path
              d={GLOBO}
              fill={OSCURO}
              fillOpacity={0.88 * p}
              stroke="none"
            />
            <Trazo d={GLOBO} p={p} />
            {GLOBO_RAYAS.map((d, j) => (
              <Trazo key={j} d={d} p={progreso(f, (frames[i] ?? 0) + 6, 8)} />
            ))}
          </g>
        );
      })}
      {insignia > 0.02 ? (
        <g transform={`translate(590 44) scale(${insignia})`}>
          <circle r={50} fill={NARANJA} />
          <text
            textAnchor="middle"
            y={16}
            fontFamily={m.fuenteTitulos ?? m.fuente}
            fontWeight={800}
            fontSize={n >= 99 ? 44 : 52}
            fill="#ffffff"
          >
            {n >= 99 ? "99+" : n}
          </text>
        </g>
      ) : null}
    </Lienzo>
  );
};

// ---------- Enchufe que se conecta ("se conectan a tus sistemas") ----------
export const TrazoEnchufe: React.FC<
  Comun & { m: Marca; enchufeFrame: number; conectaFrame: number }
> = ({ m, enchufeFrame, conectaFrame, ...c }) => {
  const f = useCurrentFrame();
  const p = progreso(f, enchufeFrame, 16);
  const tx = interpolate(f, [conectaFrame - ENCHUFE_ACERCA, conectaFrame], [-120, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const chispas =
    progreso(f, conectaFrame, 5) * (1 - progreso(f, conectaFrame + 9, 6));
  return (
    <Lienzo {...c} ancho={760} alto={320}>
      <Trazo
        d="M520 90 H680 a24 24 0 0 1 24 24 V206 a24 24 0 0 1 -24 24 H520 Z"
        p={p}
      />
      <g transform={`translate(${tx} 0)`}>
        <Trazo
          d="M180 100 H340 a22 22 0 0 1 22 22 V198 a22 22 0 0 1 -22 22 H180 Z"
          p={p}
        />
        <Trazo d="M362 135 H550" p={p} grosor={12} />
        <Trazo d="M362 185 H550" p={p} grosor={12} />
        <Trazo
          d="M180 160 C100 160 80 250 -40 250"
          p={progreso(f, enchufeFrame + 4, 14)}
        />
        <text
          x={270}
          y={184}
          textAnchor="middle"
          fontFamily={m.fuenteManuscrita ?? m.fuente}
          fontSize={80}
          fill={TINTA}
          opacity={progreso(f, enchufeFrame + 12, 8)}
        >
          IA
        </text>
      </g>
      <Trazo d="M500 70 L478 36" p={chispas} color={NARANJA} grosor={10} />
      <Trazo d="M560 56 L566 16" p={chispas} color={NARANJA} grosor={10} />
      <Trazo d="M620 70 L646 38" p={chispas} color={NARANJA} grosor={10} />
    </Lienzo>
  );
};

// ---------- Chat que responde solo ----------
export const TrazoChat: React.FC<
  Comun & { clienteFrame: number; escribeFrame: number; respuestaFrame: number }
> = ({ clienteFrame, escribeFrame, respuestaFrame, ...c }) => {
  const f = useCurrentFrame();
  const cliente = progreso(f, clienteFrame, 12);
  const respuesta = progreso(f, respuestaFrame, 12);
  const escribiendo = f >= escribeFrame && f < respuestaFrame + 2;
  return (
    <Lienzo {...c} ancho={680} alto={330} suave>
      <g transform="translate(0 10)">
        <path d={GLOBO} fill={OSCURO} fillOpacity={0.88 * cliente} />
        <Trazo d={GLOBO} p={cliente} />
        {GLOBO_RAYAS.map((d, j) => (
          <Trazo key={j} d={d} p={progreso(f, clienteFrame + 6, 8)} />
        ))}
      </g>
      {escribiendo ? (
        <g transform="translate(380 160)">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={50 + i * 50}
              cy={68 + Math.sin((f - escribeFrame) / 3 - i) * -7}
              r={11}
              fill={TINTA}
            />
          ))}
        </g>
      ) : null}
      {respuesta > 0.001 ? (
        <g transform="translate(680 160) scale(-1 1)">
          <path d={GLOBO} fill={NARANJA} fillOpacity={respuesta} />
          <Trazo d={GLOBO} p={respuesta} color={NARANJA} />
          {GLOBO_RAYAS.map((d, j) => (
            <Trazo
              key={j}
              d={d}
              p={progreso(f, respuestaFrame + 6, 8)}
              color="#ffffff"
            />
          ))}
        </g>
      ) : null}
    </Lienzo>
  );
};

// ---------- Tilde dentro de un círculo marcado ----------
export const TrazoTilde: React.FC<
  Comun & { circuloFrame: number; tildeFrame: number }
> = ({ circuloFrame, tildeFrame, ...c }) => {
  const f = useCurrentFrame();
  return (
    <Lienzo {...c} ancho={360} alto={320}>
      <Trazo
        d="M180 30 C270 24 332 90 328 170 C324 250 250 300 170 296 C86 292 34 226 38 150 C42 74 110 28 200 36 L232 48"
        p={progreso(f, circuloFrame, TILDE_CIRCULO)}
        color={NARANJA}
        grosor={14}
      />
      <Trazo
        d="M100 170 L160 228 L262 98"
        p={progreso(f, tildeFrame, TILDE_MARCA)}
        grosor={20}
      />
    </Lienzo>
  );
};

// ---------- Barras que suben, flecha y estrella ----------
const BARRAS_ALTOS = [70, 110, 150, 200, 270];
const BARRA_ANCHO = 76;
const BARRA_BASE = 310;
export const TrazoBarras: React.FC<
  Comun & {
    frames: number[];
    completo?: boolean; // ya vienen subidas (segundo tramo de la misma idea)
    flechaFrame?: number;
    estrellaFrame?: number;
  }
> = ({ frames, completo, flechaFrame, estrellaFrame, ...c }) => {
  const f = useCurrentFrame();
  const base = completo ? 1 : progreso(f, frames[0] ?? 0, 8);
  const estrella =
    estrellaFrame === undefined
      ? 0
      : interpolate(f, [estrellaFrame, estrellaFrame + 12], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.back(2)),
        });
  return (
    <Lienzo {...c} ancho={760} alto={340}>
      <Trazo d={`M40 ${BARRA_BASE} H720`} p={base} />
      {BARRAS_ALTOS.map((alto, i) => {
        const g = completo
          ? 1
          : interpolate(f, [frames[i] ?? 0, (frames[i] ?? 0) + BARRA_SUBE], [0, 1], {
              ...clamp,
              easing: Easing.out(Easing.cubic),
            });
        if (g <= 0.01) return null;
        const x = 70 + i * 110;
        const h = alto * g;
        const ultima = i === BARRAS_ALTOS.length - 1;
        return (
          <path
            key={i}
            d={`M${x} ${BARRA_BASE} V${BARRA_BASE - h} H${x + BARRA_ANCHO} V${BARRA_BASE}`}
            fill={ultima ? NARANJA : "none"}
            stroke={ultima ? NARANJA : TINTA}
            strokeWidth={GROSOR}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      {flechaFrame !== undefined ? (
        <>
          <Trazo
            d="M60 240 C240 236 420 170 640 66"
            p={progreso(f, flechaFrame, 14)}
            grosor={11}
          />
          <Trazo
            d="M590 60 L644 62 L628 114"
            p={progreso(f, flechaFrame + 12, 6)}
            grosor={11}
          />
        </>
      ) : null}
      {estrella > 0.02 ? (
        <g
          transform={`translate(650 -36) scale(${estrella * 4.5}) rotate(${(1 - estrella) * 90} 13.5 13.5)`}
        >
          <path d={ESTRELLA} fill={NARANJA} />
        </g>
      ) : null}
    </Lienzo>
  );
};

// ---------- Flecha hacia abajo ("escribinos acá abajo") ----------
export const TrazoFlecha: React.FC<Comun & { desdeFrame?: number }> = ({
  desdeFrame = 0,
  ...c
}) => {
  const f = useCurrentFrame();
  const p = progreso(f, desdeFrame, FLECHA_TRAZO);
  const vaiven =
    p >= 1
      ? Math.sin(((f - desdeFrame - FLECHA_TRAZO) / FLECHA_PERIODO) * Math.PI * 2) *
        FLECHA_VAIVEN
      : 0;
  return (
    <Lienzo {...c} ancho={220} alto={420}>
      <g transform={`translate(0 ${vaiven})`}>
        <Trazo
          d="M40 20 C150 60 170 170 112 250 C92 280 84 306 102 336"
          p={p}
          grosor={12}
        />
        <Trazo
          d="M44 292 L102 346 L156 286"
          p={progreso(f, desdeFrame + FLECHA_TRAZO - 4, 6)}
          grosor={12}
        />
      </g>
    </Lienzo>
  );
};
