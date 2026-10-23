// Insertos "profesionales" para reels de entrevista: tarjetas de panel (dashboard) y vidrio esmerilado con la
// paleta de Volto. Reemplazan a los dibujos de línea de `InsertosTrazo.tsx` donde el cliente pidió algo más
// pulido (2026-10-14): curva de ventas que se estanca, embudo, mensajes en vidrio, integración del agente,
// barras de resultados y tarjeta de perfil.
// Cada uno vive en un <Sequence> (frame 0 = entra) y recibe su duración en frames; con `seco` sale de golpe.
// Entradas suaves (sube y se aclara, sin rebote); los tamaños cambian de verdad (nada de `transform: scale`
// sobre texto, sale pixelado).
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Marca } from "../../marcas";

// ---------- Constantes de animación ----------
const CLARO = "#f5f5ed"; // paleta del cliente
const OSCURO = "#262626";
const GRIS = "#57534c";
const NARANJA = "#f97d55";
const CELESTE = "#a0c9cb";
const ARENA = "#ebdbb7";
const PETROLEO = "#406162";
const SALE = 6; // frames del desvanecido de salida (sin `seco`)
const ENTRA = 12; // frames en que la tarjeta sube y se aclara
const ENTRA_SUBE = 28; // px que sube al entrar
const TARJETA_RADIO = 36;
// vidrio esmerilado flotando (pedido 2026-10-14): fondo translúcido, borde de luz y sombra negra difusa
const TARJETA_FONDO = "rgba(245, 245, 237, 0.4)";
const TARJETA_BORDE = "2px solid rgba(255, 255, 255, 0.55)";
const TARJETA_BLUR = "blur(18px) saturate(1.15)";
const TARJETA_SOMBRA =
  "0 34px 70px rgba(0, 0, 0, 0.46), 0 10px 22px rgba(0, 0, 0, 0.26)";
const GLOBO_SOMBRA =
  "0 24px 48px rgba(0, 0, 0, 0.5), 0 8px 16px rgba(0, 0, 0, 0.28)";
const LISTA_ENTRA = 10; // frames en que entra cada pregunta
const LISTA_DESLIZA = 46; // px que desliza cada pregunta al entrar
const CIFRA_VIAJE = 18; // frames que tarda en subir a su lugar final
const VENTAS_SUBE = 30; // frames que tarda la curva en subir
const VENTAS_PLANA = 30; // frames que tarda en aplanarse
const VENTAS_MAXIMO = 8.2; // % al que llega antes de estancarse
const VENTAS_FINAL = 0.3; // % en el que queda
const EMBUDO_BARRA = 8; // frames en que crece cada barra (rápido, para que dé tiempo a leer)
const MENSAJE_ENTRA = 14;
const MENSAJE_SUBE = 30; // px que sube cada globo al entrar
const INTEGRA_LINEA = 20; // frames en que se traza la conexión
const PERFIL_ENTRA = 14;
const DEGRADE = "linear-gradient(90deg, #f97d55, #95a8a0, #406162)"; // degradé del cliente
// asterisco de public/marcas/volto/estrella.svg (viewBox 27×27)
const ESTRELLA =
  "M17.0621 11.4931H26.2481V14.7551H17.0591L23.5576 21.2531L21.2536 23.5571L14.7556 17.0591V26.2481H11.4931V17.0621L4.99752 23.5576L2.69051 21.2536L9.18904 14.7556H0V11.4931H9.18604L2.69051 4.99752L4.99752 2.69101L11.4931 9.18604V0H14.7556V9.18904L21.2536 2.69101L23.5576 4.99752L17.0621 11.4931Z";

// Visibilidad (0–1) que fija el contenedor cuando el inserto se va. La aplican los elementos de vidrio por su
// cuenta: un `opacity` en un ancestro hace que `backdrop-filter` pierda el desenfoque de golpe (se veía como
// un parpadeo al salir).
export const SalidaCtx = React.createContext(1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 → 1 con ease out a partir de `desde`
const sube = (f: number, desde: number, dura: number) =>
  interpolate(f, [desde, desde + dura], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

// 0 → 1 con ease in-out
const mueve = (f: number, desde: number, dura: number) =>
  interpolate(f, [desde, desde + dura], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

// ---------- Piezas comunes ----------
type Comun = { x: number; y: number; duracion: number; seco?: boolean };

const titulos = (m: Marca) => m.fuenteTitulos ?? m.fuente;

// Opacidad de salida (sin `seco` se desvanece en los últimos frames)
const salida = (f: number, duracion: number, seco?: boolean) =>
  seco ? 1 : interpolate(f, [duracion - SALE, duracion], [1, 0], clamp);

// Tarjeta clara centrada en (x, y): sube y se aclara al entrar
const Tarjeta: React.FC<
  Comun & {
    ancho: number;
    alto: number;
    entra?: number;
    children: React.ReactNode;
  }
> = ({ x, y, ancho, alto, duracion, seco, entra = 0, children }) => {
  const f = useCurrentFrame();
  const k = React.useContext(SalidaCtx);
  const p = sube(f, entra, ENTRA);
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - alto / 2 + (1 - p) * ENTRA_SUBE,
        width: ancho,
        height: alto,
        borderRadius: TARJETA_RADIO,
        background: TARJETA_FONDO,
        backdropFilter: TARJETA_BLUR,
        border: TARJETA_BORDE,
        boxSizing: "border-box",
        boxShadow: TARJETA_SOMBRA,
        opacity: p * salida(f, duracion, seco) * k,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

const coma = (v: number, decimales = 1) =>
  v.toFixed(decimales).replace(".", ",");

// ---------- Ventas: crece y se estanca ----------
// Línea con área degradé, el porcentaje sube y vuelve a casi cero cuando se aplana ("estancado").
const VENTAS_CURVA =
  "M0 128 L60 112 L120 118 L190 82 L250 94 L320 52 L380 64 L450 26 L520 24 L600 26 L690 22 L780 24";
const VENTAS_FRACCION_SUBE = 0.58; // parte de la curva que corresponde al tramo en alza
export const ProVentas: React.FC<
  Comun & {
    m: Marca;
    subeFrame: number;
    estancadoFrame: number;
    entra?: number;
  }
> = ({ m, subeFrame, estancadoFrame, entra, ...c }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  const subeFin = Math.min(subeFrame + VENTAS_SUBE, estancadoFrame - 1); // el tramo en alza termina al estancarse
  const p = interpolate(
    f,
    [subeFrame, subeFin, estancadoFrame, estancadoFrame + VENTAS_PLANA],
    [0, VENTAS_FRACCION_SUBE, VENTAS_FRACCION_SUBE, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  const valor = interpolate(
    f,
    [subeFrame, subeFin, estancadoFrame, estancadoFrame + VENTAS_PLANA],
    [0, VENTAS_MAXIMO, VENTAS_MAXIMO, VENTAS_FINAL],
    { ...clamp, easing: Easing.out(Easing.cubic) },
  );
  return (
    <Tarjeta {...c} entra={entra} ancho={880} alto={320}>
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 20,
          fontFamily: fuente,
          fontWeight: 800,
          fontSize: 118,
          color: OSCURO,
          letterSpacing: "-0.01em",
        }}
      >
        {`+${coma(valor)} %`}
      </div>
      <svg
        width={800}
        height={150}
        viewBox="0 0 800 150"
        style={{ position: "absolute", left: 40, top: 152 }}
      >
        <defs>
          <linearGradient id="ventasArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={NARANJA} stopOpacity={0.38} />
            <stop offset="1" stopColor={NARANJA} stopOpacity={0} />
          </linearGradient>
          <clipPath id="ventasClip">
            <rect x={0} y={0} width={800 * p + 2} height={150} />
          </clipPath>
        </defs>
        {[40, 100].map((y) => (
          <line
            key={y}
            x1={0}
            x2={800}
            y1={y}
            y2={y}
            stroke="rgba(38,38,38,0.16)"
            strokeWidth={2}
          />
        ))}
        <line
          x1={0}
          x2={800}
          y1={140}
          y2={140}
          stroke={OSCURO}
          strokeWidth={3}
        />
        <path
          d={`${VENTAS_CURVA} L780 140 L0 140 Z`}
          fill="url(#ventasArea)"
          clipPath="url(#ventasClip)"
        />
        <path
          d={VENTAS_CURVA}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - p}
          fill="none"
          stroke={NARANJA}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={p > 0.002 ? 1 : 0}
        />
      </svg>
    </Tarjeta>
  );
};

// ---------- Lema: renglones a la izquierda, con resaltador ----------
// "IA con foco humano" (2026-10-23, volto radio): alineado a la izquierda, "IA" grande y blanca en su renglón y
// "con foco" / "humano" en tinta oscura sobre un trazo de resaltador naranja que los cruza, en cascada. Entra en
// bloque (no palabra por palabra). x = borde izquierdo, y = borde de arriba.
const LEMA_ENTRA = 9; // frames en que sube y se aclara
const LEMA_SUBE = 30; // px que sube al entrar
const LEMA_RESALTA = 8; // frames que tarda cada resaltador en cruzar su renglón
const LEMA_CASCADA = 4; // frames entre renglón y renglón
const LEMA_TINTA = OSCURO;
export const ProLema: React.FC<
  Comun & {
    m: Marca;
    renglones: { texto: string; tamano: number; resaltado?: boolean }[];
  }
> = ({ m, renglones, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  const entra = sube(f, 0, LEMA_ENTRA);
  let resaltados = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + (1 - entra) * LEMA_SUBE,
        opacity: entra * salida(f, duracion, seco),
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        fontFamily: fuente,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {renglones.map((r) => {
        if (!r.resaltado)
          return (
            <div
              key={r.texto}
              style={{
                fontSize: r.tamano,
                lineHeight: 0.95,
                color: "#ffffff",
                textShadow:
                  "0 8px 34px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
            >
              {r.texto}
            </div>
          );
        const desde = 3 + resaltados++ * LEMA_CASCADA;
        const p = sube(f, desde, LEMA_RESALTA);
        return (
          <div
            key={r.texto}
            style={{
              position: "relative",
              padding: `${r.tamano * 0.04}px ${r.tamano * 0.22}px ${r.tamano * 0.1}px`,
              marginTop: r.tamano * 0.08,
              marginLeft: -r.tamano * 0.08,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "6%",
                height: "88%",
                width: `${p * 100}%`,
                background: NARANJA,
                borderRadius: 14,
                transform: "rotate(-1.5deg)",
                boxShadow: "0 10px 26px rgba(0, 0, 0, 0.3)",
              }}
            />
            <span
              style={{
                position: "relative",
                display: "inline-block",
                fontSize: r.tamano,
                lineHeight: 1,
                color: LEMA_TINTA,
                clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
              }}
            >
              {r.texto}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Reparto: tarjeta con la cifra y una barra ----------
// "el 90 % de las consultas" (2026-10-22/23): tarjeta de vidrio con la cifra que cuenta, una barra que se llena
// hasta el valor con el degradé de la marca y la etiqueta debajo, todo centrado (letra oscura: se lee sobre el
// cartel blanco de la radio y sobre la pared).
const REPARTO_ANCHO = 560;
const REPARTO_ALTO = 320;
const REPARTO_BARRA = 34;
const REPARTO_CUENTA = 30; // frames que tarda en llegar al valor
const REPARTO_RETRASO = 4;
const REPARTO_ETIQUETA = 12; // frames hasta que entra la etiqueta
export const ProReparto: React.FC<
  Comun & { m: Marca; valor: number; etiqueta: string }
> = ({ m, valor, etiqueta, ...c }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  const p = interpolate(
    f,
    [REPARTO_RETRASO, REPARTO_RETRASO + REPARTO_CUENTA],
    [0, 1],
    { ...clamp, easing: Easing.out(Easing.quad) },
  );
  const etiquetaP = sube(f, REPARTO_ETIQUETA, 12);
  const barra = REPARTO_ANCHO - 2 * 60;
  return (
    <Tarjeta {...c} ancho={REPARTO_ANCHO} alto={REPARTO_ALTO}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fuente,
          fontWeight: 800,
          color: OSCURO,
        }}
      >
        <div
          style={{
            fontSize: 140,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {`${Math.round(valor * p)}%`}
        </div>
        <div
          style={{
            marginTop: 20,
            width: barra,
            height: REPARTO_BARRA,
            borderRadius: REPARTO_BARRA / 2,
            background: "rgba(38, 38, 38, 0.12)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${valor * p}%`,
              background: DEGRADE,
              borderRadius: REPARTO_BARRA / 2,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 40,
            opacity: etiquetaP,
            transform: `translateY(${(1 - etiquetaP) * 10}px)`,
          }}
        >
          {etiqueta}
        </div>
      </div>
    </Tarjeta>
  );
};

// ---------- Sueño: flecha que lleva a una cara bostezando ----------
// "porque son las más aburridas" (2026-10-23): desde la tarjeta del 90 % se traza una flecha curva hasta una
// carita que bosteza, con "z z Z" que suben. (x, y) = centro de la cara; `desde` = dónde nace la flecha.
const SUENO_TRAZO = 10; // frames que tarda la flecha en trazarse
const SUENO_CARA = 8; // frames en que crece la cara (tamaño real, no scale)
const SUENO_RADIO = 72;
const SUENO_Z_PASO = 7; // frames entre cada z
export const ProSueno: React.FC<
  Comun & { m: Marca; desde: { x: number; y: number } }
> = ({ m, desde, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const k = React.useContext(SalidaCtx);
  const fuente = titulos(m);
  const traza = sube(f, 0, SUENO_TRAZO);
  const cara = interpolate(
    f,
    [SUENO_TRAZO - 2, SUENO_TRAZO - 2 + SUENO_CARA],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.back(1.8)),
    },
  );
  const visible = salida(f, duracion, seco) * k;
  const r = SUENO_RADIO * cara;
  // flecha: curva desde `desde` hasta el borde de la cara
  const ang = Math.atan2(y - desde.y, x - desde.x);
  const fin = {
    x: x - Math.cos(ang) * (SUENO_RADIO + 18),
    y: y - Math.sin(ang) * (SUENO_RADIO + 18),
  };
  const ctrl = { x: desde.x + (fin.x - desde.x) * 0.15, y: fin.y + 10 };
  const largo = Math.hypot(fin.x - desde.x, fin.y - desde.y) * 1.25;
  const bostezo = 0.75 + 0.25 * Math.sin(Math.max(0, f - SUENO_TRAZO) / 6);
  return (
    <AbsoluteFillSvg opacity={visible}>
      <path
        d={`M ${desde.x} ${desde.y} Q ${ctrl.x} ${ctrl.y} ${fin.x} ${fin.y}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${largo * traza} ${largo}`}
        style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))" }}
      />
      {traza > 0.95 ? (
        <path
          d={`M ${fin.x - 26} ${fin.y - 14} L ${fin.x} ${fin.y} L ${fin.x - 22} ${fin.y + 20}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`rotate(${(Math.atan2(fin.y - ctrl.y, fin.x - ctrl.x) * 180) / Math.PI} ${fin.x} ${fin.y})`}
          style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))" }}
        />
      ) : null}
      {r > 1 ? (
        <g style={{ filter: "drop-shadow(0 14px 26px rgba(0,0,0,0.45))" }}>
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={ARENA}
            stroke={OSCURO}
            strokeWidth={6 * cara}
          />
          {/* ojos cerrados */}
          <path
            d={`M ${x - r * 0.48} ${y - r * 0.18} q ${r * 0.16} ${r * 0.14} ${r * 0.32} 0`}
            fill="none"
            stroke={OSCURO}
            strokeWidth={6 * cara}
            strokeLinecap="round"
          />
          <path
            d={`M ${x + r * 0.16} ${y - r * 0.18} q ${r * 0.16} ${r * 0.14} ${r * 0.32} 0`}
            fill="none"
            stroke={OSCURO}
            strokeWidth={6 * cara}
            strokeLinecap="round"
          />
          {/* boca bostezando */}
          <ellipse
            cx={x}
            cy={y + r * 0.36}
            rx={r * 0.2}
            ry={r * 0.26 * bostezo}
            fill={OSCURO}
          />
        </g>
      ) : null}
      {["z", "z", "Z"].map((z, i) => {
        const p = sube(f, SUENO_TRAZO + 4 + i * SUENO_Z_PASO, 10);
        const flota =
          Math.max(0, f - (SUENO_TRAZO + 4 + i * SUENO_Z_PASO)) * 0.6;
        return (
          <text
            key={i}
            x={x + SUENO_RADIO * 0.8 + i * 30}
            y={y - SUENO_RADIO * 0.7 - i * 36 - flota}
            fontFamily={fuente}
            fontWeight={800}
            fontSize={34 + i * 12}
            fill="#ffffff"
            opacity={p}
            style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }}
          >
            {z}
          </text>
        );
      })}
    </AbsoluteFillSvg>
  );
};
const AbsoluteFillSvg: React.FC<{
  opacity: number;
  children: React.ReactNode;
}> = ({ opacity, children }) => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      opacity,
      overflow: "visible",
    }}
  >
    {children}
  </svg>
);

// ---------- Etiquetas blancas ----------
// "las más aburridas / no calificados / siempre lo mismo" (2026-10-23: chips de otra forma que las píldoras de
// vidrio): etiquetas blancas sólidas con una franja naranja a la izquierda, apenas giradas (cada una para su
// lado), centradas y apiladas; cada una entra subiendo y asentando el giro cuando se dice. (x, y) = centro de
// la primera.
const ETIQUETA_ALTO = 76;
const ETIQUETA_PASO = 90; // px entre etiquetas
const ETIQUETA_ENTRA = 9; // frames
const ETIQUETA_GIROS = [-2.5, 2, -1.5];
export const ProEtiquetas: React.FC<
  Comun & { m: Marca; items: { texto: string; frame: number }[] }
> = ({ m, items, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  return (
    <>
      {items.map((it, i) => {
        const p = interpolate(
          f,
          [it.frame, it.frame + ETIQUETA_ENTRA],
          [0, 1],
          {
            ...clamp,
            easing: Easing.out(Easing.back(1.6)),
          },
        );
        const giro = ETIQUETA_GIROS[i % ETIQUETA_GIROS.length];
        return (
          <div
            key={it.texto}
            style={{
              position: "absolute",
              left: x,
              top: y + i * ETIQUETA_PASO,
              height: ETIQUETA_ALTO,
              transform: `translate(-50%, -50%) translateY(${(1 - p) * 36}px) rotate(${giro * 2 - giro * p}deg)`,
              opacity: Math.min(1, p * 1.6) * salida(f, duracion, seco),
              display: "flex",
              alignItems: "center",
              background: CLARO,
              borderRadius: 12,
              boxShadow: "0 16px 34px rgba(0, 0, 0, 0.4)",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{ width: 16, alignSelf: "stretch", background: NARANJA }}
            />
            <div
              style={{
                padding: "0 30px 0 24px",
                fontFamily: fuente,
                fontWeight: 800,
                fontSize: 50,
                color: OSCURO,
              }}
            >
              {it.texto}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------- Igual a: la cifra se corre y aparece lo que significa ----------
// "ese 10 %… con ese 10 % se vuelven más productivos" (2026-10-23): tarjeta blanca centrada con "10%"; en
// `empujaFrame` se ensancha, empuja la cifra hacia la izquierda y se escribe "= más productivos".
const IGUAL_ALTO = 190;
const IGUAL_MARGEN = 44;
const IGUAL_HUECO = 26;
const IGUAL_EMPUJA = 14; // frames del empujón
const IGUAL_ESCRIBE = 14; // frames en que se escribe el texto
const IGUAL_CUENTA = 18; // frames en que la cifra se carga de 1 a su valor (pedido 2026-10-23)
export const ProIgual: React.FC<
  Comun & { m: Marca; cifra: string; texto: string; empujaFrame: number }
> = ({ m, cifra, texto, empujaFrame, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  const tamCifra = 120;
  const tamTexto = 58;
  const anchoCifra = anchoTexto(cifra, fuente, tamCifra);
  const anchoTxt = anchoTexto(texto, fuente, tamTexto);
  const empuja = interpolate(
    f,
    [empujaFrame, empujaFrame + IGUAL_EMPUJA],
    [0, 1],
    {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const escribe = sube(f, empujaFrame + IGUAL_EMPUJA * 0.6, IGUAL_ESCRIBE);
  // la cifra se carga de 1 a su valor al entrar ("10%": 1 %, 2 %… 10 %)
  const [, numero, resto] = /^(\d+)(.*)$/.exec(cifra) ?? [null, null, cifra];
  const cifraContada =
    numero === null
      ? cifra
      : `${Math.round(interpolate(f, [2, 2 + IGUAL_CUENTA], [1, Number(numero)], clamp))}${resto}`;
  const anchoSolo = anchoCifra + 2 * IGUAL_MARGEN;
  const anchoTodo = anchoCifra + IGUAL_HUECO + anchoTxt + 2 * IGUAL_MARGEN;
  const ancho = anchoSolo + (anchoTodo - anchoSolo) * empuja;
  const entra = sube(f, 0, ENTRA);
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - IGUAL_ALTO / 2 + (1 - entra) * ENTRA_SUBE,
        width: ancho,
        height: IGUAL_ALTO,
        borderRadius: 30,
        background: CLARO,
        boxShadow: "0 24px 54px rgba(0, 0, 0, 0.42)",
        opacity: entra * salida(f, duracion, seco),
        overflow: "hidden",
        fontFamily: fuente,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: IGUAL_MARGEN,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          fontSize: tamCifra,
          color: NARANJA,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {cifraContada}
      </div>
      <div
        style={{
          position: "absolute",
          left: IGUAL_MARGEN + anchoCifra + IGUAL_HUECO,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          fontSize: tamTexto,
          color: OSCURO,
          clipPath: `inset(-10% ${(1 - escribe) * 100}% -10% 0)`,
        }}
      >
        {texto}
      </div>
    </div>
  );
};

// ---------- Jornada: reloj de ocho horas ----------
// "de las ocho horas de trabajo, antes tenías siete horas feas y una hora buena… ahora tenés las ocho horas
// buenas" (2026-10-22): esfera de vidrio en ocho porciones; la aguja recorre la jornada y deja las siete
// primeras en gris y la última en naranja; con "ahora" se encienden todas en una vuelta. Debajo, "antes" y
// "ahora" cuentan el relato.
const RELOJ8_DIAMETRO = 330;
const RELOJ8_HORAS = 8;
const RELOJ8_HUECO = 0.035; // radianes entre porciones
const RELOJ8_GRIS = "rgba(87, 83, 76, 0.9)";
const RELOJ8_VUELTA = 14; // frames de la vuelta final que enciende todas
const RELOJ8_ETIQUETA = 8; // frames del cambio de etiqueta
const porcion = (
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
) => {
  const p = (r: number, a: number) =>
    `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`;
  const grande = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${grande} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${grande} 0 ${p(r0, a0)} Z`;
};
export const ProReloj8: React.FC<
  Comun & {
    m: Marca;
    feasFrame: number; // empieza a recorrer las horas feas
    feasHastaFrame: number; // termina la séptima
    buenaFrame: number; // la octava, naranja
    todasFrame: number; // "ahora": se encienden todas
  }
> = ({
  m,
  feasFrame,
  feasHastaFrame,
  buenaFrame,
  todasFrame,
  x,
  y,
  duracion,
  seco,
}) => {
  const f = useCurrentFrame();
  const k = React.useContext(SalidaCtx);
  const fuente = titulos(m);
  const entra = sube(f, 0, ENTRA);
  const visible = entra * salida(f, duracion, seco) * k;
  const d = RELOJ8_DIAMETRO;
  const c = d / 2;
  const paso = (2 * Math.PI) / RELOJ8_HORAS;
  // posición de la aguja, en horas (0–8)
  const horas =
    f < buenaFrame
      ? interpolate(f, [feasFrame, feasHastaFrame], [0, 7], clamp)
      : f < todasFrame
        ? interpolate(f, [buenaFrame, buenaFrame + 8], [7, 8], clamp)
        : 8 +
          interpolate(f, [todasFrame, todasFrame + RELOJ8_VUELTA], [0, 8], {
            ...clamp,
            easing: Easing.inOut(Easing.cubic),
          });
  const ahora = sube(f, todasFrame, RELOJ8_ETIQUETA);
  const antes = sube(f, feasFrame, RELOJ8_ETIQUETA);
  const etiqueta = (texto: string, p: number, color: string) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: fuente,
        fontWeight: 800,
        fontSize: 52,
        color,
        textShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
      }}
    >
      {texto}
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x - c,
        top: y - c + (1 - entra) * ENTRA_SUBE,
        width: d,
      }}
    >
      <div
        style={{
          position: "relative",
          width: d,
          height: d,
          borderRadius: c,
          background: TARJETA_FONDO,
          backdropFilter: TARJETA_BLUR,
          border: TARJETA_BORDE,
          boxSizing: "border-box",
          boxShadow: TARJETA_SOMBRA,
          opacity: visible,
        }}
      >
        <svg
          width={d}
          height={d}
          style={{ position: "absolute", left: -2, top: -2 }}
        >
          <defs>
            <linearGradient id="horaBuena" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fba27c" />
              <stop offset="1" stopColor="#e2663f" />
            </linearGradient>
          </defs>
          {Array.from({ length: RELOJ8_HORAS }, (_, i) => {
            const a0 = i * paso + RELOJ8_HUECO;
            const a1 = (i + 1) * paso - RELOJ8_HUECO;
            const fea =
              i < 7 ? interpolate(horas, [i, i + 1], [0, 1], clamp) : 0;
            const buena =
              i === 7
                ? interpolate(horas, [7, 8], [0, 1], clamp)
                : interpolate(horas, [8 + i, 9 + i], [0, 1], clamp);
            const camino = porcion(c, c, c * 0.42, c * 0.88, a0, a1);
            return (
              <g key={i}>
                <path d={camino} fill="rgba(38, 38, 38, 0.1)" />
                <path
                  d={camino}
                  fill={RELOJ8_GRIS}
                  opacity={fea * (1 - buena)}
                />
                <path d={camino} fill="url(#horaBuena)" opacity={buena} />
              </g>
            );
          })}
          <line
            x1={c}
            y1={c}
            x2={c + Math.sin(horas * paso) * c * 0.8}
            y2={c - Math.cos(horas * paso) * c * 0.8}
            stroke={OSCURO}
            strokeWidth={9}
            strokeLinecap="round"
          />
          <circle cx={c} cy={c} r={14} fill={OSCURO} />
        </svg>
      </div>
      <div
        style={{
          position: "relative",
          height: 70,
          marginTop: 14,
          opacity: visible,
        }}
      >
        {etiqueta("antes", antes * (1 - ahora), "#ffffff")}
        {etiqueta("ahora", ahora, "#ffffff")}
      </div>
    </div>
  );
};

// ---------- Embudo de ventas ----------
// Tres etapas que se angostan: muchas consultas, pocas conversaciones, casi ninguna venta.
const EMBUDO_ETAPAS = [
  { etiqueta: "Consultas", ancho: 470, valor: "100 %", color: CELESTE },
  { etiqueta: "Conversaciones", ancho: 300, valor: "58 %", color: ARENA },
  { etiqueta: "Ventas", ancho: 54, valor: "3 %", color: NARANJA },
];
export const ProEmbudo: React.FC<
  Comun & { m: Marca; frames: number[]; entra?: number }
> = ({ m, frames, entra, ...c }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  const ANCHO = 860;
  const DERECHA = 44; // todas las barras nacen del mismo borde (derecha) y crecen hacia la izquierda
  return (
    <Tarjeta {...c} entra={entra} ancho={ANCHO} alto={290}>
      {EMBUDO_ETAPAS.map((e, i) => {
        const g = sube(f, frames[i] ?? 0, EMBUDO_BARRA);
        const top = 36 + i * 76;
        const barra = e.ancho * g;
        return (
          <React.Fragment key={e.etiqueta}>
            <div
              style={{
                position: "absolute",
                left: 44,
                top: top + 10,
                width: 230,
                fontFamily: m.fuente,
                fontWeight: 600,
                fontSize: 28,
                color: OSCURO,
                opacity: g,
              }}
            >
              {e.etiqueta}
            </div>
            <div
              style={{
                position: "absolute",
                right: DERECHA + barra + 16,
                top: top + 6,
                fontFamily: fuente,
                fontWeight: 800,
                fontSize: 34,
                color: OSCURO,
                opacity: g,
                whiteSpace: "nowrap",
              }}
            >
              {e.valor}
            </div>
            <div
              style={{
                position: "absolute",
                left: ANCHO - DERECHA - barra,
                top,
                width: barra,
                height: 54,
                borderRadius: 14,
                background: e.color,
              }}
            />
          </React.Fragment>
        );
      })}
    </Tarjeta>
  );
};

// ---------- Mensajes en vidrio ----------
// Globos translúcidos (vidrio esmerilado) y naranjas que se superponen a lo ancho, como la referencia del cliente.
type Globo = {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  naranja?: boolean;
  cola: "izq" | "der";
};
const MENSAJES_GLOBOS: Globo[] = [
  { x: 10, y: 70, ancho: 300, alto: 150, cola: "der" },
  { x: 250, y: 10, ancho: 240, alto: 120, naranja: true, cola: "izq" },
  { x: 440, y: 110, ancho: 270, alto: 130, cola: "izq" },
  { x: 660, y: 30, ancho: 210, alto: 110, naranja: true, cola: "der" },
  { x: 770, y: 150, ancho: 160, alto: 90, cola: "izq" },
  { x: 150, y: 195, ancho: 170, alto: 80, naranja: true, cola: "izq" },
];
const COLA = 26;
export const ProMensajes: React.FC<Comun & { frames: number[] }> = ({
  frames,
  x,
  y,
  duracion,
  seco,
}) => {
  const f = useCurrentFrame();
  const ancho = 940;
  const alto = 290;
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - alto / 2,
        width: ancho,
        height: alto,
        opacity: salida(f, duracion, seco),
      }}
    >
      {MENSAJES_GLOBOS.map((g, i) => {
        const p = sube(
          f,
          frames[i] ?? frames[frames.length - 1] ?? 0,
          MENSAJE_ENTRA,
        );
        if (p <= 0.003) return null;
        const fondo = g.naranja
          ? "linear-gradient(135deg, rgba(249, 125, 85, 0.62) 0%, rgba(251, 162, 124, 0.5) 100%)"
          : "rgba(245, 245, 237, 0.42)";
        const colaColor = g.naranja
          ? "rgba(249, 125, 85, 0.6)"
          : "rgba(245, 245, 237, 0.5)";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: g.x,
              top: g.y + (1 - p) * MENSAJE_SUBE,
              width: g.ancho,
              height: g.alto,
              opacity: p,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 26,
                background: fondo,
                backdropFilter: TARJETA_BLUR,
                border: g.naranja
                  ? "2px solid rgba(255, 190, 160, 0.7)"
                  : "2px solid rgba(255, 255, 255, 0.7)",
                boxSizing: "border-box",
                boxShadow: GLOBO_SOMBRA,
              }}
            />
            <svg
              width={COLA * 2}
              height={COLA}
              viewBox="0 0 52 26"
              style={{
                position: "absolute",
                filter: "drop-shadow(0 10px 10px rgba(0, 0, 0, 0.35))",
                bottom: -COLA + 4,
                left: g.cola === "izq" ? 34 : undefined,
                right: g.cola === "der" ? 34 : undefined,
                transform: g.cola === "der" ? "scaleX(-1)" : undefined,
              }}
            >
              <path d="M0 0 H52 L8 26 Z" fill={colaColor} />
            </svg>
            {[0.28, 0.5].map((t, j) => (
              <div
                key={j}
                style={{
                  position: "absolute",
                  left: 24,
                  top: g.alto * t + (j === 0 ? 0 : 4),
                  width: g.ancho * (j === 0 ? 0.62 : 0.4),
                  height: 12,
                  borderRadius: 6,
                  background: g.naranja
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(38, 38, 38, 0.32)",
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const PALABRA_FRAMES = 6; // frames en que cada palabra se planta
const PALABRA_GIRO = 7; // grados con que llega
const PALABRA_ESCALA = 2.1; // tamaño inicial (× el final)
const CHAT_ENTRA = 12;

// ---------- Integración: el agente de IA conectado a los sistemas ----------
// Primero entra solo "Agente de IA" (al centro); cuando se nombran los sistemas se corre a la izquierda, entre
// las dos tarjetas se traza una conexión (línea con extremos fijados a cada borde y un pulso que viaja) y
// "Tus sistemas" entra y se enciende al recibirla.
const INTEGRA_ANCHO = 960;
const INTEGRA_ALTO = 300;
const INTEGRA_TARJETA_ANCHO = 300;
const INTEGRA_TARJETA_ALTO = 240;
const INTEGRA_TARJETA_TOP = 20;
const INTEGRA_CORRE = 18; // frames que tarda el agente en correrse a la izquierda
const INTEGRA_SISTEMAS = 16; // frames que tarda en entrar la tarjeta de sistemas
const INTEGRA_DESLIZA = 60; // px que desliza "Tus sistemas" al entrar
const INTEGRA_CENTRO = (INTEGRA_ANCHO - INTEGRA_TARJETA_ANCHO) / 2;
const INTEGRA_PULSO_PERIODO = 26; // frames que tarda el pulso en recorrer la conexión
export const ProIntegracion: React.FC<
  Comun & { m: Marca; entraFrame: number; conectaFrame: number }
> = ({ m, entraFrame, conectaFrame, x, y }) => {
  const f = useCurrentFrame();
  const k = React.useContext(SalidaCtx);
  const fuente = titulos(m);
  const p = sube(f, entraFrame, ENTRA + 4);
  const corre = mueve(f, conectaFrame - INTEGRA_LINEA, INTEGRA_CORRE);
  const linea = mueve(f, conectaFrame - INTEGRA_LINEA + 6, INTEGRA_LINEA);
  const sistemas = sube(f, conectaFrame - 8, INTEGRA_SISTEMAS);
  const conectado = sube(f, conectaFrame + 4, 8);
  const agenteX = INTEGRA_CENTRO * (1 - corre);
  const xA = INTEGRA_TARJETA_ANCHO; // borde derecho del agente (ya corrido)
  const xB = INTEGRA_ANCHO - INTEGRA_TARJETA_ANCHO; // borde izquierdo de sistemas
  const yL = INTEGRA_TARJETA_TOP + INTEGRA_TARJETA_ALTO / 2;
  const pulso =
    conectado > 0.5
      ? ((f - conectaFrame) % INTEGRA_PULSO_PERIODO) / INTEGRA_PULSO_PERIODO
      : -1;
  const tarjeta: React.CSSProperties = {
    position: "absolute",
    top: INTEGRA_TARJETA_TOP,
    width: INTEGRA_TARJETA_ANCHO,
    height: INTEGRA_TARJETA_ALTO,
    borderRadius: TARJETA_RADIO,
    background: TARJETA_FONDO,
    backdropFilter: TARJETA_BLUR,
    border: TARJETA_BORDE,
    boxSizing: "border-box",
    boxShadow: TARJETA_SOMBRA,
  };
  const titulo: React.CSSProperties = {
    position: "absolute",
    left: 28,
    top: 124,
    fontFamily: fuente,
    fontWeight: 800,
    fontSize: 38,
    lineHeight: 1.15,
    color: OSCURO,
    whiteSpace: "nowrap",
  };
  const detalle: React.CSSProperties = {
    position: "absolute",
    left: 28,
    top: 184,
    fontFamily: m.fuente,
    fontWeight: 600,
    fontSize: 25,
    lineHeight: 1.2,
    color: GRIS,
    whiteSpace: "nowrap",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: x - INTEGRA_ANCHO / 2,
        top: y - INTEGRA_ALTO / 2,
        width: INTEGRA_ANCHO,
        height: INTEGRA_ALTO,
      }}
    >
      <div
        style={{
          ...tarjeta,
          left: agenteX,
          opacity: p * k,
          transform: `translateY(${(1 - p) * ENTRA_SUBE}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 28,
            width: 78,
            height: 78,
            borderRadius: 24,
            background: NARANJA,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={44} height={44} viewBox="0 0 27 27">
            <path d={ESTRELLA} fill={CLARO} />
          </svg>
        </div>
        <div style={titulo}>Agente de IA</div>
        <div style={detalle}>Atiende y vende</div>
      </div>
      {sistemas > 0.003 ? (
        <div
          style={{
            ...tarjeta,
            right: 0,
            opacity: sistemas * k,
            transform: `translateX(${(1 - sistemas) * INTEGRA_DESLIZA}px)`,
            border: `2px solid ${
              conectado > 0.02
                ? `rgba(249, 125, 85, ${0.35 + 0.65 * conectado})`
                : "rgba(255, 255, 255, 0.55)"
            }`,
            boxShadow:
              conectado > 0.02
                ? `${TARJETA_SOMBRA}, 0 0 ${28 * conectado}px rgba(249, 125, 85, ${0.45 * conectado})`
                : TARJETA_SOMBRA,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 28,
              display: "grid",
              gridTemplateColumns: "repeat(2, 36px)",
              gap: 8,
            }}
          >
            {[CELESTE, ARENA, PETROLEO, NARANJA].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: c,
                }}
              />
            ))}
          </div>
          <div style={titulo}>Tus sistemas</div>
          <div style={detalle}>Tienda, stock, pedidos</div>
        </div>
      ) : null}
      <svg
        width={INTEGRA_ANCHO}
        height={INTEGRA_ALTO}
        viewBox={`0 0 ${INTEGRA_ANCHO} ${INTEGRA_ALTO}`}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          overflow: "visible",
          opacity: k,
        }}
      >
        {linea > 0.003 ? (
          <>
            <line
              x1={xA}
              x2={xA + (xB - xA) * linea}
              y1={yL}
              y2={yL}
              stroke={NARANJA}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={conectado > 0.5 ? "2 16" : undefined}
              strokeDashoffset={conectado > 0.5 ? -f * 1.4 : undefined}
            />
            <circle cx={xA} cy={yL} r={13} fill={NARANJA} />
            <circle
              cx={xA}
              cy={yL}
              r={22}
              fill="none"
              stroke={NARANJA}
              strokeOpacity={0.35}
              strokeWidth={3}
            />
          </>
        ) : null}
        {linea > 0.98 ? (
          <>
            <circle cx={xB} cy={yL} r={13} fill={NARANJA} />
            <circle
              cx={xB}
              cy={yL}
              r={22}
              fill="none"
              stroke={NARANJA}
              strokeOpacity={0.35}
              strokeWidth={3}
            />
          </>
        ) : null}
        {pulso >= 0 ? (
          <circle
            cx={xA + (xB - xA) * pulso}
            cy={yL}
            r={9}
            fill={CLARO}
            stroke={NARANJA}
            strokeWidth={4}
          />
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          left: INTEGRA_ANCHO / 2,
          top: yL + 40 + (1 - conectado) * 10,
          transform: "translateX(-50%)",
          opacity: conectado * k,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: OSCURO,
          color: CLARO,
          fontFamily: m.fuente,
          fontWeight: 700,
          fontSize: 26,
          borderRadius: 999,
          padding: "8px 20px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: CELESTE,
            display: "inline-block",
          }}
        />
        Conectado
      </div>
    </div>
  );
};

// ---------- Resultados: la misma tarjeta de ventas, ahora en alza ----------
// "están teniendo resultados increíbles": cierra lo que abrió la tarjeta de "estancado en tus ventas". Mismo vidrio
// y mismo tamaño, sin cifra: la curva ocupa toda la tarjeta y sube sin aplanarse.
const RES_FRAMES = 40; // frames que tarda la curva en llegar arriba
const RES_CURVA_BASE: [number, number][] = [
  [0, 128],
  [70, 118],
  [140, 124],
  [220, 98],
  [290, 106],
  [380, 70],
  [450, 78],
  [540, 44],
  [610, 52],
  [700, 22],
  [780, 10],
];
const RES_PUNTO = 12; // radio del punto que marca la punta de la curva
const RES_ALTO = 240; // alto del área del gráfico dentro de la tarjeta
const RES_BASE = 218; // línea de base
const RES_TECHO = 20; // y de la cima de la curva
// estira la curva original (y de 10 a 128) a todo el alto disponible
const RES_CURVA: [number, number][] = RES_CURVA_BASE.map(([x, y]) => [
  x,
  RES_TECHO + ((y - 10) / (128 - 10)) * (RES_BASE - 8 - RES_TECHO),
]);
const RES_SUBE = Easing.bezier(0.45, 0, 0.25, 1); // arranca despacio y frena suave
const RES_LARGOS = RES_CURVA.slice(1).map(([x, y], i) =>
  Math.hypot(x - RES_CURVA[i][0], y - RES_CURVA[i][1]),
);
const RES_LARGO = RES_LARGOS.reduce((a, b) => a + b, 0);
const RES_PATH = `M${RES_CURVA.map(([x, y]) => `${x} ${y}`).join(" L")}`;

export const ProResultados: React.FC<
  Comun & { subeFrame: number; entra?: number }
> = ({ subeFrame, entra, ...c }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [subeFrame, subeFrame + RES_FRAMES], [0, 1], {
    ...clamp,
    easing: RES_SUBE,
  });
  // punto de la curva a esa fracción del recorrido
  let resto = p * RES_LARGO;
  let punta = RES_CURVA[0];
  for (let i = 0; i < RES_LARGOS.length; i++) {
    const [ax, ay] = RES_CURVA[i];
    const [bx, by] = RES_CURVA[i + 1];
    const k = Math.min(1, resto / RES_LARGOS[i]);
    punta = [ax + (bx - ax) * k, ay + (by - ay) * k];
    if (resto <= RES_LARGOS[i]) break;
    resto -= RES_LARGOS[i];
  }
  const ancho = punta[0];
  return (
    <Tarjeta {...c} entra={entra} ancho={880} alto={320}>
      <svg
        width={800}
        height={RES_ALTO}
        viewBox={`0 0 800 ${RES_ALTO}`}
        style={{ position: "absolute", left: 40, top: 40, overflow: "visible" }}
      >
        <defs>
          <linearGradient id="resultadosArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={NARANJA} stopOpacity={0.38} />
            <stop offset="1" stopColor={NARANJA} stopOpacity={0} />
          </linearGradient>
          <clipPath id="resultadosClip">
            <rect x={0} y={-20} width={ancho + 1} height={RES_ALTO + 40} />
          </clipPath>
        </defs>
        {[78, 148].map((y) => (
          <line
            key={y}
            x1={0}
            x2={800}
            y1={y}
            y2={y}
            stroke="rgba(38,38,38,0.16)"
            strokeWidth={2}
          />
        ))}
        <line
          x1={0}
          x2={800}
          y1={RES_BASE}
          y2={RES_BASE}
          stroke={OSCURO}
          strokeWidth={3}
        />
        {p > 0.002 ? (
          <>
            <path
              d={`${RES_PATH} L780 ${RES_BASE} L0 ${RES_BASE} Z`}
              fill="url(#resultadosArea)"
              clipPath="url(#resultadosClip)"
            />
            <path
              d={RES_PATH}
              fill="none"
              stroke={NARANJA}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#resultadosClip)"
            />
            <circle
              cx={punta[0]}
              cy={punta[1]}
              r={RES_PUNTO}
              fill="#ffffff"
              stroke={NARANJA}
              strokeWidth={5}
            />
          </>
        ) : null}
      </svg>
    </Tarjeta>
  );
};

// ---------- Perfil: tarjeta de la cuenta con el botón de escribir ----------
// Conserva la estética del rótulo (claro, asterisco naranja, línea del degradé), pero como tarjeta de perfil
// que sube y se compone por partes, no como la píldora que escribe el usuario.
export const ProPerfil: React.FC<
  Comun & { m: Marca; usuario: string; nombre: string; boton: string }
> = ({ m, usuario, nombre, boton, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  const ancho = 840;
  const alto = 184;
  const p = sube(f, 0, PERFIL_ENTRA);
  const avatar = interpolate(f, [2, 2 + PERFIL_ENTRA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.5)),
  });
  const texto = sube(f, 7, 10);
  const boton_ = sube(f, 12, 10);
  const linea = mueve(f, 14, 18);
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - alto / 2 + (1 - p) * ENTRA_SUBE,
        width: ancho,
        height: alto,
        borderRadius: TARJETA_RADIO,
        background: CLARO,
        boxShadow: TARJETA_SOMBRA,
        opacity: p * salida(f, duracion, seco),
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 30,
          top: 32,
          width: 120 * Math.max(0, avatar),
          height: 120 * Math.max(0, avatar),
          marginLeft: 60 * (1 - Math.max(0, avatar)),
          marginTop: 60 * (1 - Math.max(0, avatar)),
          borderRadius: "50%",
          background: OSCURO,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={64 * Math.max(0, avatar)}
          height={64 * Math.max(0, avatar)}
          viewBox="0 0 27 27"
        >
          <path d={ESTRELLA} fill={NARANJA} />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 178,
          top: 36,
          opacity: texto,
          transform: `translateY(${(1 - texto) * 10}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fuente,
            fontWeight: 800,
            fontSize: 58,
            lineHeight: 1.05,
            color: OSCURO,
          }}
        >
          {nombre}
        </div>
        <div
          style={{
            fontFamily: m.fuente,
            fontWeight: 600,
            fontSize: 32,
            color: GRIS,
            marginTop: 6,
          }}
        >
          {usuario}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 32,
          top: 52,
          height: 80,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 30px",
          borderRadius: 40,
          background: NARANJA,
          color: CLARO,
          fontFamily: fuente,
          fontWeight: 800,
          fontSize: 32,
          opacity: boton_,
          transform: `translateY(${(1 - boton_) * 10}px)`,
        }}
      >
        <svg width={34} height={34} viewBox="0 0 24 24">
          <path
            d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
            fill={CLARO}
          />
        </svg>
        {boton}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 8,
          width: ancho * linea,
          background: DEGRADE,
        }}
      />
    </div>
  );
};

// ---------- Preguntas: píldoras de vidrio que entran una tras otra ----------
// "Te preguntan por stock, por talle, por cantidad": cada pregunta entra deslizando desde la izquierda, con la
// estética de vidrio de las otras tarjetas, alineadas al margen izquierdo (x = borde izquierdo); con `seco`
// salen todas juntas con el cambio de plano.
export const ProLista: React.FC<
  Comun & { m: Marca; items: { texto: string; frame: number }[] }
> = ({ m, items, x, y }) => {
  const f = useCurrentFrame();
  const k = React.useContext(SalidaCtx);
  const fuente = titulos(m);
  const ALTO = 92;
  const HUECO = 18;
  const total = items.length * ALTO + (items.length - 1) * HUECO;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: y - total / 2,
        width: "100%",
      }}
    >
      {items.map((it, i) => {
        const g = sube(f, it.frame, LISTA_ENTRA);
        if (g <= 0.003) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: i * (ALTO + HUECO),
              transform: `translateX(${(1 - g) * -LISTA_DESLIZA}px)`,
              opacity: g * k,
              height: ALTO,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "0 40px 0 14px",
              borderRadius: ALTO / 2,
              background: "rgba(245, 245, 237, 0.5)",
              backdropFilter: TARJETA_BLUR,
              border: TARJETA_BORDE,
              boxSizing: "border-box",
              boxShadow: GLOBO_SOMBRA,
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: NARANJA,
                color: CLARO,
                fontFamily: fuente,
                fontWeight: 800,
                fontSize: 42,
                lineHeight: "64px",
                textAlign: "center",
              }}
            >
              ?
            </div>
            <div
              style={{
                fontFamily: fuente,
                fontWeight: 800,
                fontSize: 46,
                color: OSCURO,
              }}
            >
              {it.texto}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ancho del texto con la tipografía real (las fuentes ya están cargadas al renderizar)
const anchoTexto = (texto: string, familia: string, tamano: number) => {
  const ctx =
    typeof document === "undefined"
      ? null
      : document.createElement("canvas").getContext("2d");
  if (!ctx) return texto.length * tamano * 0.56;
  ctx.font = `800 ${tamano}px ${familia}`;
  return ctx.measureText(texto).width;
};

// ---------- Cifra que escala y viaja ----------
// "Logramos liberar hasta el 80 %…": un indicador circular de vidrio: el anillo se traza con degradé de la marca
// mientras la cifra cuenta, un destello sella el valor y todo sube suavemente a su lugar arriba para estar ya ahí
// cuando él vuelve. Un solo gráfico continuo.
const CIFRA_ANILLO = 0.075; // grosor del anillo (× diámetro)
const CIFRA_TRAZO = 34; // frames que tarda el anillo en llegar a su valor
const CIFRA_RETRASO = 4; // frames antes de que empiece a trazarse
const CIFRA_DESTELLO = 16; // frames del destello al llegar al valor
const CIFRA_ETIQUETA_RETRASO = 14; // frames hasta que entra la etiqueta
const CIFRA_SUBE = 36; // px que sube el panel al entrar
const CIFRA_DIAMETRO = 1.75; // diámetro del anillo al crecer (× `tamano`)
const CIFRA_DIAMETRO_FINAL = 1.5; // y ya arriba (× `tamanoFinal`)

export const ProCifraViaja: React.FC<{
  m: Marca;
  valor: number;
  sufijo?: string;
  etiqueta: string;
  tamano: number; // referencia del tamaño al crecer (px)
  tamanoFinal: number; // referencia ya arriba
  x: number;
  y: number; // centro al crecer
  yFinal: number; // centro ya arriba
  viajeFrame: number; // frame en que empieza a subir (llega arriba CIFRA_VIAJE frames después)
  duracion: number;
  seco?: boolean;
}> = ({
  m,
  valor,
  sufijo = "",
  etiqueta,
  tamano,
  tamanoFinal,
  x,
  y,
  yFinal,
  viajeFrame,
  duracion,
  seco,
}) => {
  const f = useCurrentFrame();
  const k = React.useContext(SalidaCtx);
  const fuente = titulos(m);
  const entra = sube(f, 0, ENTRA + 4);
  const viaje = mueve(f, viajeFrame, CIFRA_VIAJE);
  const d =
    tamano * CIFRA_DIAMETRO +
    (tamanoFinal * CIFRA_DIAMETRO_FINAL - tamano * CIFRA_DIAMETRO) * viaje;
  const grosor = d * CIFRA_ANILLO;
  const r = (d - grosor) / 2;
  const circ = 2 * Math.PI * r;
  const traza = interpolate(
    f,
    [CIFRA_RETRASO, CIFRA_RETRASO + CIFRA_TRAZO],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.quad),
    },
  );
  const fraccion = (valor / 100) * traza;
  const cuenta = valor * traza;
  const angulo = -Math.PI / 2 + fraccion * 2 * Math.PI;
  const llego = CIFRA_RETRASO + CIFRA_TRAZO;
  const destello = interpolate(
    f,
    [llego - 2, llego + CIFRA_DESTELLO],
    [0, 1],
    clamp,
  );
  const etiquetaP = sube(f, CIFRA_ETIQUETA_RETRASO, 14);
  const tamEtiqueta = d * 0.1;
  const altoEtiqueta = tamEtiqueta * 2.1;
  const hueco = d * 0.07;
  const bloque = d + hueco + altoEtiqueta;
  const centroY = y + (yFinal - y) * viaje;
  return (
    <div
      style={{
        position: "absolute",
        left: x - d / 2,
        top: centroY - bloque / 2 + (1 - entra) * CIFRA_SUBE,
        width: d,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: d,
          height: d,
          borderRadius: d / 2,
          background: TARJETA_FONDO,
          backdropFilter: TARJETA_BLUR,
          border: TARJETA_BORDE,
          boxSizing: "border-box",
          boxShadow: TARJETA_SOMBRA,
          opacity: entra * salida(f, duracion, seco) * k,
        }}
      >
        <svg
          width={d}
          height={d}
          viewBox={`0 0 ${d} ${d}`}
          style={{
            position: "absolute",
            left: -2,
            top: -2,
            overflow: "visible",
          }}
        >
          <defs>
            <linearGradient id="anilloCifra" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fba27c" />
              <stop offset="0.5" stopColor={NARANJA} />
              <stop offset="1" stopColor="#c9553a" />
            </linearGradient>
          </defs>
          <circle
            cx={d / 2}
            cy={d / 2}
            r={r}
            fill="none"
            stroke="rgba(38, 38, 38, 0.14)"
            strokeWidth={grosor}
          />
          {destello > 0 && destello < 1 ? (
            <circle
              cx={d / 2}
              cy={d / 2}
              r={r + grosor * (0.4 + destello * 1.6)}
              fill="none"
              stroke={NARANJA}
              strokeOpacity={0.45 * (1 - destello)}
              strokeWidth={grosor * 0.5}
            />
          ) : null}
          <circle
            cx={d / 2}
            cy={d / 2}
            r={r}
            fill="none"
            stroke="url(#anilloCifra)"
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0.01, circ * fraccion)} ${circ}`}
            transform={`rotate(-90 ${d / 2} ${d / 2})`}
          />
          {traza > 0.01 ? (
            <circle
              cx={d / 2 + Math.cos(angulo) * r}
              cy={d / 2 + Math.sin(angulo) * r}
              r={grosor * 0.2}
              fill="#ffffff"
              opacity={0.9}
            />
          ) : null}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fuente,
            fontWeight: 800,
            color: "#ffffff",
            textShadow: "0 4px 22px rgba(0, 0, 0, 0.45)",
            fontSize: d * 0.34,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {`${Math.round(cuenta)}${sufijo}`}
        </div>
      </div>
      <div
        style={{
          marginTop: hueco,
          height: altoEtiqueta,
          padding: `0 ${tamEtiqueta * 1.1}px`,
          borderRadius: altoEtiqueta / 2,
          background: TARJETA_FONDO,
          backdropFilter: TARJETA_BLUR,
          border: TARJETA_BORDE,
          boxShadow: "0 14px 30px rgba(0, 0, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          fontFamily: fuente,
          fontWeight: 800,
          fontSize: tamEtiqueta,
          color: "#ffffff",
          textShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
          whiteSpace: "nowrap",
          opacity: etiquetaP * entra * salida(f, duracion, seco) * k,
          transform: `translateY(${(1 - etiquetaP) * 14}px)`,
        }}
      >
        {etiqueta}
      </div>
    </div>
  );
};

// ---------- Una palabra a la vez ----------
// "no / doy / a basto": una sola palabra sobre el sujeto; cada una reemplaza a la anterior justo cuando se
// dice. Tipografía de títulos de la marca, blanca con sombra suave y subrayado naranja que se traza.
const SOLA_ENTRA = 7; // frames que tarda en entrar cada palabra
const SOLA_SALE = 3; // frames del desvanecido antes de la siguiente
const SOLA_SUBE = 34; // px que sube al entrar
const SOLA_SUBRAYA = 10; // frames que tarda el subrayado en trazarse
export const ProPalabraSola: React.FC<
  Comun & {
    m: Marca;
    palabras: { texto: string; frame: number }[];
    tamano?: number;
  }
> = ({ m, palabras, tamano = 150, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  const i = palabras.reduce((a, w, k) => (f >= w.frame ? k : a), -1);
  if (i < 0) return null;
  const w = palabras[i];
  const siguiente = palabras[i + 1];
  const entra = interpolate(f, [w.frame, w.frame + SOLA_ENTRA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const sale = siguiente
    ? interpolate(
        f,
        [siguiente.frame - SOLA_SALE, siguiente.frame],
        [1, 0],
        clamp,
      )
    : 1;
  const subraya = interpolate(
    f,
    [w.frame + 3, w.frame + 3 + SOLA_SUBRAYA],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  );
  const ancho = anchoTexto(w.texto, fuente, tamano);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        opacity: entra * sale * salida(f, duracion, seco),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: fuente,
          fontWeight: 800,
          fontSize: tamano,
          lineHeight: 1.05,
          color: "#ffffff",
          textShadow:
            "0 8px 34px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
          whiteSpace: "nowrap",
          transform: `translateY(${(1 - entra) * SOLA_SUBE}px)`,
        }}
      >
        {w.texto}
      </div>
      <div
        style={{
          marginTop: tamano * 0.04,
          height: Math.max(8, tamano * 0.07),
          width: ancho * subraya,
          borderRadius: 999,
          background: NARANJA,
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
        }}
      />
    </div>
  );
};

// ---------- Palabras resaltadas ----------
// "no doy a basto": cada palabra se planta con un golpe (llega grande y girada, se achica de golpe sobre su
// bloque de color resaltado) justo cuando se dice. El tamaño cambia de verdad (no scale CSS sobre texto).
export const ProPalabras: React.FC<
  Comun & {
    m: Marca;
    palabras: { texto: string; frame: number }[];
    tamano?: number;
  }
> = ({ m, palabras, tamano = 118, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const fuente = titulos(m);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: y,
        width: "100%",
        transform: "translateY(-50%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        paddingLeft: x - 540,
        opacity: salida(f, duracion, seco),
      }}
    >
      {palabras.map((w, i) => {
        const e = interpolate(f, [w.frame, w.frame + PALABRA_FRAMES], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.back(2.4)),
        });
        const visible = f >= w.frame;
        // antes de decirse, la palabra reserva su lugar con el tamaño final (el renglón no se corre)
        const k = visible
          ? PALABRA_ESCALA - (PALABRA_ESCALA - 1) * Math.min(e, 1.35)
          : 1;
        const size = tamano * Math.max(0.2, k);
        const giro = visible
          ? -PALABRA_GIRO * (1 - Math.min(1, e)) + (i % 2 ? 1.5 : -1.5)
          : 0;
        const anchoFinal = anchoTexto(w.texto, fuente, tamano) + tamano * 0.4;
        return (
          <div
            key={i}
            style={{
              width: anchoFinal,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "visible",
            }}
          >
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: `rotate(${giro}deg)`,
                background: NARANJA,
                borderRadius: 14,
                padding: `${size * 0.04}px ${size * 0.2}px`,
                color: "#ffffff",
                fontFamily: fuente,
                fontWeight: 800,
                fontSize: size,
                lineHeight: 1.12,
                whiteSpace: "nowrap",
                flex: "none",
                boxShadow: visible
                  ? "0 10px 24px rgba(0, 0, 0, 0.28)"
                  : undefined,
              }}
            >
              {w.texto}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Chat que responde (vidrio) ----------
// Pregunta del cliente (vidrio oscuro), tres puntos mientras el agente escribe y respuesta (vidrio naranja con el
// asterisco de la marca). Opacidades bajas y borde fino de luz: sutil, tecnológico.
export const ProChat: React.FC<
  Comun & { clienteFrame: number; escribeFrame: number; respuestaFrame: number }
> = ({ clienteFrame, escribeFrame, respuestaFrame, x, y }) => {
  const f = useCurrentFrame();
  const k = React.useContext(SalidaCtx);
  const cliente = sube(f, clienteFrame, CHAT_ENTRA);
  const respuesta = sube(f, respuestaFrame, CHAT_ENTRA);
  const escribiendo = f >= escribeFrame && f < respuestaFrame + 2;
  const ancho = 760;
  const alto = 330;
  const base: React.CSSProperties = {
    position: "absolute",
    backdropFilter: TARJETA_BLUR,
    boxSizing: "border-box",
    borderRadius: 30,
  };
  const linea = (w: number, color: string): React.CSSProperties => ({
    width: w,
    height: 11,
    borderRadius: 6,
    background: color,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - alto / 2,
        width: ancho,
        height: alto,
      }}
    >
      {cliente > 0.003 ? (
        <div
          style={{
            ...base,
            left: 0,
            top: 10 + (1 - cliente) * 24,
            width: 420,
            height: 120,
            opacity: cliente * k,
            background: "rgba(38, 38, 38, 0.34)",
            border: "1.5px solid rgba(255, 255, 255, 0.4)",
            boxShadow: "0 16px 34px rgba(0, 0, 0, 0.3)",
            padding: "30px 34px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={linea(300, "rgba(255, 255, 255, 0.78)")} />
          <div style={linea(190, "rgba(255, 255, 255, 0.55)")} />
        </div>
      ) : null}
      {escribiendo ? (
        <div
          style={{
            ...base,
            right: 40,
            top: 150,
            width: 150,
            height: 70,
            background: "rgba(245, 245, 237, 0.34)",
            border: "1.5px solid rgba(255, 255, 255, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            opacity: k,
            boxShadow: "0 12px 26px rgba(0, 0, 0, 0.22)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                background: "rgba(255, 255, 255, 0.9)",
                transform: `translateY(${Math.sin((f - escribeFrame) / 3 - i) * -6}px)`,
              }}
            />
          ))}
        </div>
      ) : null}
      {respuesta > 0.003 ? (
        <div
          style={{
            ...base,
            right: 0,
            top: 160 + (1 - respuesta) * 24,
            width: 470,
            height: 150,
            opacity: respuesta * k,
            background:
              "linear-gradient(135deg, rgba(249, 125, 85, 0.5) 0%, rgba(251, 162, 124, 0.34) 100%)",
            border: "1.5px solid rgba(255, 214, 192, 0.7)",
            boxShadow: "0 16px 34px rgba(0, 0, 0, 0.3)",
            padding: "30px 34px 30px 112px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 37,
              width: 60,
              height: 60,
              borderRadius: 30,
              background: "rgba(38, 38, 38, 0.55)",
              border: "1.5px solid rgba(255, 255, 255, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={30} height={30} viewBox="0 0 27 27">
              <path d={ESTRELLA} fill={CLARO} />
            </svg>
          </div>
          <div style={linea(270, "rgba(255, 255, 255, 0.88)")} />
          <div style={linea(190, "rgba(255, 255, 255, 0.62)")} />
        </div>
      ) : null}
    </div>
  );
};
