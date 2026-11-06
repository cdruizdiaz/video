// Plantilla "PlacaRastro": placa de cierre de los reels de RASTRO (2026-10-23).
// El logo entra como UNA sola pieza (letras y figurita juntas) con un movimiento suave: 2ª tanda del 2026-10-23
// ("la animación de RASTRO se ve muy dura… no quiero que el logo sea aparte, sino que esté todo unido… más
// movimiento smooth"; la 1ª dibujaba las letras y hacía asomar y asentir a la figurita por separado).
// Entradas para elegir:
//  - "sube":   el logo entero sube apenas, aparece y pasa de desenfocado a nítido; el eslogan, en dos tiempos;
//  - "revela": un barrido de borde suave lo descubre de izquierda a derecha mientras sube un poco;
//  - "dibuja": TODO se dibuja a la vez (3ª tanda: "¿y si probamos que se dibuje todo a la vez? incluido el
//              logo"): las letras con su trazo a mano y la figurita con una pincelada que sigue su forma.
//              ELEGIDA (2026-10-23: "que sea solo RASTRO así; el menos ruido más historias dejalo como antes"):
//              el eslogan con su entrada del borrador B (1,6 y 1,9 s), no dibujado.
// Todo el bloque (logo + eslogan) se asienta junto con una deriva lenta hacia arriba. Después, quieta.
// Muda (la música del reel sigue debajo). Colores por props.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { rastro } from "../../marcas/rastro/marca";
import { TRAZOS_LOGO } from "../ManifiestoRastros/ManifiestoRastros";

// ---------- Duración y tiempos (frames a 30 fps) ----------
export const DURACION_PLACA = 90; // 3 s; quieta desde ~2 s
const LOGO_INICIO = 4;
const LOGO_DURA = 28; // frames que tarda el logo en entrar (con la curva de la marca: suave)
const LOGO_SUBE = 40; // px que sube el logo al entrar ("sube")
const LOGO_DESENFOQUE = 14; // px de desenfoque al empezar ("sube")
const REVELA_SUBE = 22; // px que sube mientras se descubre ("revela")
const REVELA_BORDE = 0.28; // ancho del borde suave del barrido (fracción del logo)
const REVELA_DESENFOQUE = 5;
const LINEA1 = 24; // 0,8 s: "Menos ruido." (se encadena con el final del logo)
const LINEA2 = 33; // 1,1 s: "Más historias."
const LINEA_DURA = 18;
const LINEA_SUBE = 16; // px que sube cada línea al entrar
const BLOQUE_DERIVA = 26; // px que sube todo el bloque mientras entra (lo une)
const BLOQUE_DURA = 60;
// "dibuja": todo empieza junto
const DIBUJO_INICIO = 4;
const DIBUJO_DURA = 34; // frames del trazo (letras, figurita y contorno del eslogan)
const DIBUJO_DESFASE = 1.5; // frames entre trazo y trazo del logo (casi juntos: orgánico, no en fila)
const DIBUJO_RELLENO = 12; // frames en que el logo y el eslogan pasan del trazo a la forma llena
// eslogan con "dibuja": como en el borrador B, cuando el logo termina de llenarse
const LINEA1_DIBUJA = 40; // 1,33 s: apenas el logo se ve completo ("que entre al toque RASTRO está listo"; antes 1,6 s)
const LINEA2_DIBUJA = 46; // 1,53 s (antes 1,9 s)
const LINEA_DURA_DIBUJA = 14;
const LINEA_SUBE_DIBUJA = 14;

// ---------- Geometría (logo 681×213) ----------
const LOGO_ANCHO = 681;
const LOGO_ALTO = 213;
const A_DESDE = 100; // la "A" de logo.png ocupa x 100–244: ahí va la figurita en alta
const A_HASTA = 244;
// La figurita es el short logo del manual de marca en alta (la "A" de logo.png es chica y con el filtro de color
// perdía el contraste). preparar_logo.py del trabajo 2026-10-23_rastro_placa-cierre la deja con fondo
// transparente: positivo (contorno negro, madera papel) y blanca (contorno y vetas blancas, el resto transparente;
// 2026-10-23: "para las que el fondo te permita, usá el logo todo blanco").
// Su "A" (x 126–492, y 59–527 de 577×641) va donde estaba la de logo.png (x 105–230, y 18–176).
const FIGURA_ARCHIVO_ANCHO = 577;
const FIGURA_ARCHIVO_ALTO = 641;
const FIGURA_ESCALA = 0.34; // 125/366 de ancho y 158/468 de alto
const FIGURA_X = 105 - 126 * FIGURA_ESCALA;
const FIGURA_Y = 18 - 59 * FIGURA_ESCALA;
// pinceladas que descubren la figurita al dibujarla (coordenadas del logo): las patas y el arco, el travesaño
// y la cabeza
const TRAZOS_FIGURA = [
  {
    d: "M127,180 L127,96 C127,62 147,48 168,48 C189,48 209,62 209,96 L209,180",
    grosor: 52,
  },
  { d: "M138,124 L198,124", grosor: 34 },
  { d: "M166,18 C182,18 182,48 166,48 C150,48 150,18 166,18", grosor: 30 },
];
const ANCHO_EN_PANTALLA = 760; // px del logo en 1080 de ancho
const K = ANCHO_EN_PANTALLA / LOGO_ANCHO;
const LOGO_CENTRO_Y = 860; // centro vertical del logo en 1920
const ESLOGAN_GAP = 92; // px entre la base del logo y la primera línea
const ESLOGAN_TAMANO = 54;
const ESLOGAN_INTERLINEA = 1.3;

const EASE = rastro.ease; // cubic-bezier(.16, 1, .3, 1): arranca rápido y se posa despacio
const DIBUJO_EASE = Easing.inOut(Easing.cubic); // el trazo, parejo de punta a punta
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const p = (f: number, a: number, b: number, easing = EASE) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing });

export type PlacaRastroProps = {
  fondo: string;
  tinta: string; // color del eslogan
  logoClaro: boolean; // true: logo todo blanco (letras y figurita) para fondos oscuros o de color
  entrada: "sube" | "revela" | "dibuja";
};

// trazo en una máscara: no se dibuja hasta que empieza (con largo 0, la punta redonda igual dibuja un punto)
const Trazo: React.FC<{ d: string; t: number; grosor: number }> = ({
  d,
  t,
  grosor,
}) =>
  t > 0 ? (
    <path
      d={d}
      fill="none"
      stroke="white"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={`${t} 2`}
    />
  ) : null;

export const PlacaRastro: React.FC<PlacaRastroProps> = ({
  fondo,
  tinta,
  logoClaro,
  entrada,
}) => {
  const f = useCurrentFrame();
  const src = staticFile(rastro.logo ?? "marcas/rastro/logo.png");
  const figura = staticFile(
    `marcas/rastro/figurita-${logoClaro ? "blanca" : "positivo"}.png`,
  );
  // letras en negro o blanco puros (con los filtros de la marca quedaban grises: poco contraste)
  const filtroLetras = logoClaro ? "brightness(0) invert(1)" : "brightness(0)";
  const revela = entrada === "revela";
  const dibuja = entrada === "dibuja";
  const t = p(f, LOGO_INICIO, LOGO_INICIO + LOGO_DURA);
  const subeLogo = dibuja ? 0 : (1 - t) * (revela ? REVELA_SUBE : LOGO_SUBE);
  const desenfoque = dibuja
    ? 0
    : (1 - t) * (revela ? REVELA_DESENFOQUE : LOGO_DESENFOQUE);
  // barrido: el borde suave va de antes del logo a después de él
  const frente = -REVELA_BORDE + t * (1 + 2 * REVELA_BORDE);
  // dibujo: cuánto de cada trazo ya pasó, y cuándo todo queda lleno (sin bordes de máscara)
  const trazo = (i: number) =>
    p(
      f,
      DIBUJO_INICIO + i * DIBUJO_DESFASE,
      DIBUJO_INICIO + i * DIBUJO_DESFASE + DIBUJO_DURA,
      DIBUJO_EASE,
    );
  const finDibujo =
    DIBUJO_INICIO +
    (TRAZOS_LOGO.length + TRAZOS_FIGURA.length) * DIBUJO_DESFASE +
    DIBUJO_DURA;
  const lleno = p(f, finDibujo - DIBUJO_RELLENO, finDibujo);
  const deriva = (1 - p(f, 0, BLOQUE_DURA)) * BLOQUE_DERIVA;
  const x0 = (1080 - ANCHO_EN_PANTALLA) / 2;
  const y0 = LOGO_CENTRO_Y - (LOGO_ALTO * K) / 2;
  const esloganY = y0 + LOGO_ALTO * K + ESLOGAN_GAP;
  const linea = (desde: number) => {
    const dura = dibuja ? LINEA_DURA_DIBUJA : LINEA_DURA;
    const k = p(f, desde, desde + dura);
    const sube = dibuja ? LINEA_SUBE_DIBUJA : LINEA_SUBE;
    return { opacity: k, transform: `translateY(${(1 - k) * sube}px)` };
  };
  const letras = (
    <g clipPath="url(#sinA)" style={{ filter: filtroLetras }}>
      <image href={src} width={LOGO_ANCHO} height={LOGO_ALTO} />
    </g>
  );
  const imagenFigura = (
    <image
      href={figura}
      x={FIGURA_X}
      y={FIGURA_Y}
      width={FIGURA_ARCHIVO_ANCHO * FIGURA_ESCALA}
      height={FIGURA_ARCHIVO_ALTO * FIGURA_ESCALA}
    />
  );
  const mascara = (id: string, hijos: React.ReactNode) => (
    <mask
      id={id}
      maskUnits="userSpaceOnUse"
      x={-40}
      y={-60}
      width={LOGO_ANCHO + 80}
      height={LOGO_ALTO + 120}
    >
      {hijos}
    </mask>
  );
  const eslogan = {
    fontFamily: rastro.fuente,
    fontWeight: 500,
    fontSize: ESLOGAN_TAMANO,
    letterSpacing: "-0.01em",
  };
  return (
    <AbsoluteFill style={{ background: fondo }}>
      <AbsoluteFill style={{ transform: `translateY(${deriva}px)` }}>
        <svg
          viewBox={`0 0 ${LOGO_ANCHO} ${LOGO_ALTO}`}
          width={ANCHO_EN_PANTALLA}
          height={LOGO_ALTO * K}
          style={{
            position: "absolute",
            left: x0,
            top: y0 + subeLogo,
            overflow: "visible",
            opacity: revela || dibuja ? 1 : t,
            filter: desenfoque > 0.05 ? `blur(${desenfoque}px)` : undefined,
          }}
        >
          <defs>
            {/* todo menos la "A" chica de logo.png */}
            <clipPath id="sinA">
              <rect x={0} y={0} width={A_DESDE} height={LOGO_ALTO} />
              <rect
                x={A_HASTA}
                y={0}
                width={LOGO_ANCHO - A_HASTA}
                height={LOGO_ALTO}
              />
            </clipPath>
            <linearGradient
              id="barrido"
              gradientUnits="userSpaceOnUse"
              x1={0}
              x2={LOGO_ANCHO}
              y1={0}
              y2={0}
            >
              <stop offset={frente} stopColor="white" />
              <stop offset={frente + REVELA_BORDE} stopColor="black" />
            </linearGradient>
            {mascara(
              "revela",
              <rect
                x={-40}
                y={-60}
                width={LOGO_ANCHO + 80}
                height={LOGO_ALTO + 120}
                fill="url(#barrido)"
              />,
            )}
            {mascara(
              "dibujoLetras",
              TRAZOS_LOGO.map((tr, i) => (
                <Trazo key={i} d={tr.d} t={trazo(i)} grosor={26} />
              )),
            )}
            {mascara(
              "dibujoFigura",
              TRAZOS_FIGURA.map((tr, i) => (
                <Trazo key={i} d={tr.d} t={trazo(i)} grosor={tr.grosor} />
              )),
            )}
          </defs>
          {dibuja ? (
            <>
              {/* todo a la vez: cada parte vista donde ya pasó su trazo; encima aparecen las formas llenas (si las dos capas
                  se cruzan con opacidad, a mitad de camino el logo se ve gris) */}
              <g>
                <g mask="url(#dibujoLetras)">{letras}</g>
                <g mask="url(#dibujoFigura)">{imagenFigura}</g>
              </g>
              <g opacity={lleno}>
                {letras}
                {imagenFigura}
              </g>
            </>
          ) : (
            // el logo entero, una sola pieza
            <g mask={revela ? "url(#revela)" : undefined}>
              {letras}
              {imagenFigura}
            </g>
          )}
        </svg>
        {/* el eslogan, en dos tiempos: sube un poco y aparece */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: esloganY,
            textAlign: "center",
            lineHeight: ESLOGAN_INTERLINEA,
            color: tinta,
            ...eslogan,
          }}
        >
          <div style={linea(dibuja ? LINEA1_DIBUJA : LINEA1)}>Menos ruido.</div>
          <div style={linea(dibuja ? LINEA2_DIBUJA : LINEA2)}>
            Más historias.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
