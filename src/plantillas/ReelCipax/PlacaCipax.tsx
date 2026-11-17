// Placa final de Cipax: degradado del manual con brillos que se mueven y la trama de isotipos, y el logo que se arma
// "tecnológico": el rombo cae y rebota, se estira en una línea que escanea y deja una grilla, las piezas del isotipo
// encastran, las letras suben por máscara, el rombo vuelve a la A y un brillo cruza el logo.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  CIPAX_AZUL,
  CIPAX_EASE,
  CIPAX_MENTA,
  CIPAX_MONTSERRAT,
  CIPAX_SALIDA,
  CIPAX_VIOLETA,
  LOGO_CIPAX,
} from "../../marcas/cipax/marca";
import { FONDO_PLACA } from "./Transiciones";
import { ALTO_SOBRE_ANCHO, CAJA_LOGO, COLORES_SOBRE_OSCURO, RUTAS_LOGO, SvgLogo } from "./LogoCipax";

// ---------- Constantes de animación (cuadros desde el inicio de la placa) ----------
const W = 1080;
const H = 1920;
const LOGO_ANCHO = 820;
const LOGO_Y = 900; // centro vertical del logo
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PUNTO_CAE = [2, 16]; // el rombo cae desde arriba y rebota en el centro
const LINEA = [15, 27]; // se estira en una línea horizontal
const ESCANEO = [25, 45]; // la línea baja y sube, dibujando la grilla
const GRILLA_SALE = [58, 78];
const GRILLA_PASO = 64;
const ISO_ENTRA = [36, 56]; // piezas del isotipo
const LETRAS_DESDE = 46;
const LETRA_PASO = 2.6;
const LETRA_DURA = 12;
const ROMBO_VUELVE = [62, 74];
const BRILLO = [74, 96];
const LEMA = [78, 98];
const ROMBO = LOGO_CIPAX.rombo.caja;
const p01 = (f: number, r: number[], ease: (x: number) => number = CIPAX_EASE) => ease(interpolate(f, r, [0, 1], clamp));

const Fondo: React.FC<{ frame: number }> = ({ frame }) => {
  const brillos = interpolate(frame, [0, 14], [0, 1], clamp); // el panel de la transición llega sin brillos: entran suave
  const s = frame / 30;
  const mancha = (color: string, x: number, y: number, r: number, a: number) => (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        background: color,
        opacity: a * brillos,
        filter: "blur(140px)",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: FONDO_PLACA, overflow: "hidden" }}>
      {mancha("#6E9BFF", 260 + 90 * Math.sin(s * 0.9), 260 + 60 * Math.cos(s * 0.7), 360, 0.55)}
      {mancha(CIPAX_VIOLETA, 880 + 70 * Math.cos(s * 0.8), 1250 + 90 * Math.sin(s * 0.6), 300, 0.32)}
      {mancha(CIPAX_MENTA, 300 + 80 * Math.sin(s * 0.5 + 1), 1650 + 50 * Math.cos(s * 0.9), 260, 0.18)}
      <Img
        src={staticFile("marcas/cipax/trama.png")}
        style={{
          position: "absolute",
          width: 2400,
          left: -660 - frame * 0.6,
          top: 1180 - frame * 0.35,
          opacity: 0.07,
          filter: "brightness(0) invert(1)",
          transform: "rotate(-18deg)",
        }}
      />
    </AbsoluteFill>
  );
};

export const PlacaCipax: React.FC<{ lema?: string }> = ({ lema = "DIGITAL SOLUTIONS" }) => {
  const frame = useCurrentFrame();
  const k = LOGO_ANCHO / (CAJA_LOGO.x1 - CAJA_LOGO.x0);
  const altoLogo = LOGO_ANCHO * ALTO_SOBRE_ANCHO;
  const izq = (W - LOGO_ANCHO) / 2;
  const arriba = LOGO_Y - altoLogo / 2;

  // 1) el punto: cae, rebota y se estira en línea
  const cae = interpolate(frame, PUNTO_CAE, [0, 1], clamp);
  const yPunto = interpolate(cae, [0, 0.5, 0.72, 0.88, 1], [-80, LOGO_Y, LOGO_Y - 110, LOGO_Y, LOGO_Y]);
  const linea = p01(frame, LINEA);
  const escaneo = interpolate(frame, ESCANEO, [0, 1], clamp);
  const yLinea = LOGO_Y + Math.sin(escaneo * Math.PI * 2) * 360 * (1 - escaneo * 0.25);
  const lineaVisible = frame >= PUNTO_CAE[0] && frame < ESCANEO[1] + 4;
  const anchoLinea = interpolate(linea, [0, 1], [34, 900]);
  const altoLinea = interpolate(linea, [0, 1], [34, 4]);
  const finLinea = interpolate(frame, [ESCANEO[1] - 4, ESCANEO[1] + 4], [1, 0], clamp);
  // 2) la grilla que deja el escaneo
  const grillaEntra = interpolate(frame, ESCANEO, [0, 1], clamp);
  const grillaSale = 1 - interpolate(frame, GRILLA_SALE, [0, 1], clamp);

  // 3) isotipo: cuadrado desde la izquierda girando, trazo azul desde abajo-izquierda, oscuro desde arriba-derecha
  const iso = (i: number) => {
    const e = p01(frame, [ISO_ENTRA[0] + i * 3, ISO_ENTRA[1] + i * 3], CIPAX_SALIDA);
    const desde = [
      { dx: -520, dy: 0, giro: -180 },
      { dx: -340, dy: 320, giro: 0 },
      { dx: 340, dy: -320, giro: 0 },
    ][i];
    return { dx: desde.dx * (1 - e), dy: desde.dy * (1 - e), giro: desde.giro * (1 - e), opacidad: Math.min(1, e * 3) };
  };
  const letra = (i: number) => {
    const e = p01(frame, [LETRAS_DESDE + i * LETRA_PASO, LETRAS_DESDE + i * LETRA_PASO + LETRA_DURA], CIPAX_SALIDA);
    return { dy: (1 - e) * 200 };
  };
  const rombo = () => {
    const c = interpolate(frame, ROMBO_VUELVE, [0, 1], clamp);
    if (c <= 0) return null;
    const dy = interpolate(c, [0, 0.6, 0.8, 1], [-420, 0, -26, 0]);
    return { dy, giro: 180 * (1 - CIPAX_SALIDA(c)) };
  };
  const brillo = interpolate(frame, BRILLO, [0, 1], clamp);
  const lemaE = p01(frame, LEMA, CIPAX_SALIDA);
  const destello = interpolate(frame, [ROMBO_VUELVE[0] + 7, ROMBO_VUELVE[0] + 9, ROMBO_VUELVE[0] + 18], [0, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <Fondo frame={frame} />
      {/* grilla fina */}
      <AbsoluteFill style={{ opacity: 0.22 * grillaSale }}>
        <svg width={W} height={H}>
          {Array.from({ length: Math.ceil(W / GRILLA_PASO) + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * GRILLA_PASO + 12} x2={i * GRILLA_PASO + 12} y1={LOGO_Y - 380 * grillaEntra} y2={LOGO_Y + 380 * grillaEntra} stroke="#FFFFFF" strokeWidth={1} />
          ))}
          {Array.from({ length: 13 }, (_, j) => {
            const y = LOGO_Y + (j - 6) * GRILLA_PASO;
            return Math.abs(y - LOGO_Y) <= 380 * grillaEntra ? <line key={`h${j}`} x1={60} x2={W - 60} y1={y} y2={y} stroke="#FFFFFF" strokeWidth={1} /> : null;
          })}
        </svg>
      </AbsoluteFill>
      {/* punto → línea que escanea */}
      {lineaVisible ? (
        <div
          style={{
            position: "absolute",
            left: W / 2 - anchoLinea / 2,
            top: (frame < ESCANEO[0] ? yPunto : yLinea) - altoLinea / 2,
            width: anchoLinea,
            height: altoLinea,
            borderRadius: altoLinea / 2,
            background: linea > 0.3 ? `linear-gradient(90deg, rgba(16,255,203,0) 0%, ${CIPAX_MENTA} 30%, #FFFFFF 50%, ${CIPAX_MENTA} 70%, rgba(16,255,203,0) 100%)` : "#FFFFFF",
            boxShadow: linea > 0.3 ? `0 0 26px ${CIPAX_MENTA}` : `0 0 24px ${CIPAX_AZUL}, 0 0 8px #FFFFFF`,
            transform: linea < 0.3 ? "rotate(45deg)" : undefined,
            opacity: finLinea,
          }}
        />
      ) : null}
      {/* logo */}
      <div style={{ position: "absolute", left: izq, top: arriba }}>
        <SvgLogo
          ancho={LOGO_ANCHO}
          colores={COLORES_SOBRE_OSCURO}
          idUnico="placa"
          mascaraLetras
          iso={(i) => (frame < ISO_ENTRA[0] + i * 3 ? null : iso(i))}
          letra={letra}
          rombo={rombo}
          extra={
            brillo > 0 && brillo < 1 ? (
              <>
                <defs>
                  <clipPath id="cpx-brillo">
                    {RUTAS_LOGO.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </clipPath>
                  <linearGradient id="cpx-brillo-g" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.85" />
                    <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g clipPath="url(#cpx-brillo)">
                  <rect
                    x={CAJA_LOGO.x0 - 200 + (CAJA_LOGO.x1 - CAJA_LOGO.x0 + 400) * CIPAX_EASE(brillo)}
                    y={CAJA_LOGO.y0 - 100}
                    width={150}
                    height={CAJA_LOGO.y1 - CAJA_LOGO.y0 + 200}
                    fill="url(#cpx-brillo-g)"
                    transform={`skewX(-20)`}
                    style={{ mixBlendMode: "screen" }}
                  />
                </g>
              </>
            ) : null
          }
        />
        {/* destello del rombo al caer en la A */}
        {destello > 0 ? (
          <div
            style={{
              position: "absolute",
              left: ((ROMBO[0] + ROMBO[2]) / 2 - CAJA_LOGO.x0) * k - 90,
              top: ((ROMBO[1] + ROMBO[3]) / 2 - CAJA_LOGO.y0) * k - 90,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,255,255,${0.9 * destello}) 0%, rgba(16,255,203,${0.4 * destello}) 35%, rgba(16,255,203,0) 70%)`,
            }}
          />
        ) : null}
      </div>
      {/* lema */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: arriba + altoLogo + 70,
          textAlign: "center",
          fontFamily: CIPAX_MONTSERRAT,
          fontWeight: 500,
          fontSize: 34,
          letterSpacing: `${0.62 - 0.2 * lemaE}em`,
          color: "#FFFFFF",
          opacity: 0.88 * lemaE,
          transform: `translateY(${(1 - lemaE) * 24}px)`,
        }}
      >
        {lema}
      </div>
    </AbsoluteFill>
  );
};
