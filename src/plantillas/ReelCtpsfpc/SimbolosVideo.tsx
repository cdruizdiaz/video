// Símbolos sobre el video para los reels del CTPSFPC: la persona queda siempre a la vista y los motion graphics van
// encima, en el aire alrededor de ella (nunca sobre la cara). Dos tipos, con la estética del Social Media Playbook
// (Bauhaus: círculos y cuartos de círculo en colores planos de la paleta):
//  - "numero": el número de un paso ("1", "!") en Almarai ExtraBold dentro de un círculo, con un cuarto de círculo
//    detrás que gira apenas al entrar;
//  - "icono": un ícono de la marca (los de PlacaExplicacion) dentro de una insignia redonda;
//  - "web": una dirección web en una píldora (globo en un círculo Chili + el texto, que se escribe de izquierda a
//    derecha); reemplaza al subtítulo cuando la persona la dice.
// Entran con un pop (tamaño real, no `transform: scale`), flotan apenas mientras están y salen con el corte de la
// toma o encogiéndose en sus últimos cuadros si terminan antes.
import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ALMARAI, BE_VIETNAM } from "../../marcas/ctpsfpc/fuentes";
import { PALETA_CTPSFPC as P } from "../../marcas/ctpsfpc/marca";
import { type Icono, IconoSvg } from "./PlacaExplicacion";

// ---------- Constantes de animación ----------
const ENTRADA = 14; // frames del pop de entrada
const SALIDA = 6; // frames en que se encoge al salir (si termina antes que la toma)
const FLOTA_PX = 6; // amplitud del flotado
const FLOTA_PERIODO = 75; // frames por vaivén
const ICONO_PROPORCION = 0.66; // ícono dentro de la insignia
const NUMERO_PROPORCION = 0.62; // tamaño del número respecto del círculo
const SOMBRA = "drop-shadow(0 8px 18px rgba(0, 0, 0, 0.28))";
const WEB_ESCRIBE = 18; // frames en que se escribe la dirección
const WEB_ABRE = 10; // frames en que la píldora se estira desde el círculo
const ease = Easing.bezier(0.33, 1, 0.68, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Simbolo = {
  x: number; // centro, en px del cuadro 1080 × 1920
  y: number;
  d: number; // diámetro
  fondo: string;
  tinta?: string; // color del número o de los trazos del ícono
} & (
  | { tipo: "numero"; numero: string }
  | { tipo: "icono"; icono: Icono }
  | { tipo: "web"; texto: string; ancho: number } // d = alto de la píldora; ancho = ancho final
);

// globo de líneas (como el del logo), dibujado en 100 × 100
const Globo: React.FC<{ color: string; tamano: number }> = ({ color, tamano }) => (
  <svg viewBox="0 0 100 100" width={tamano} height={tamano}>
    <g fill="none" stroke={color} strokeWidth={7}>
      <circle cx={50} cy={50} r={40} />
      <ellipse cx={50} cy={50} rx={17} ry={40} />
      <path d="M12 36 H 88 M12 64 H 88" />
    </g>
  </svg>
);

const WebVideo: React.FC<{ s: Extract<Simbolo, { tipo: "web" }>; flota: number }> = ({ s, flota }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, durationInFrames: ENTRADA, config: { damping: 11, mass: 0.6 } });
  const abre = ease(interpolate(frame, [6, 6 + WEB_ABRE], [0, 1], clamp));
  const letras = Math.round(
    interpolate(frame, [10, 10 + WEB_ESCRIBE], [0, s.texto.length], clamp),
  );
  const alto = s.d;
  const circulo = alto * 0.78;
  const ancho = alto + (s.ancho - alto) * abre;
  const tinta = s.tinta ?? P.marfil;
  return (
    <div
      style={{
        position: "absolute",
        left: s.x - ancho / 2,
        top: s.y - alto / 2 + flota,
        width: ancho,
        height: alto,
        borderRadius: alto / 2,
        background: s.fondo,
        filter: SOMBRA,
        opacity: interpolate(pop, [0, 0.3], [0, 1], clamp),
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        paddingLeft: (alto - circulo) / 2,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: circulo * pop,
          height: circulo * pop,
          margin: (circulo * (1 - pop)) / 2,
          borderRadius: "50%",
          background: P.chili,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Globo color={P.marfil} tamano={circulo * pop * 0.66} />
      </div>
      <div
        style={{
          marginLeft: alto * 0.24,
          whiteSpace: "nowrap",
          fontFamily: `"${BE_VIETNAM}", sans-serif`,
          fontWeight: 600,
          fontSize: alto * 0.42,
          letterSpacing: "0.01em",
          color: tinta,
        }}
      >
        {s.texto.slice(0, letras)}
      </div>
    </div>
  );
};

export const SimboloVideo: React.FC<{
  s: Simbolo;
  duracion: number; // frames que está
  sinEntrada?: boolean; // ya estaba en la toma anterior (p. ej. el número de un paso que sigue): aparece quieto
  saleAntes?: boolean; // termina antes que la toma: se encoge en sus últimos cuadros
  fase?: number; // desfase del flotado, para que no floten todos juntos
}> = ({ s, duracion, sinEntrada, saleAntes, fase = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = sinEntrada
    ? 1
    : spring({ frame, fps, durationInFrames: ENTRADA, config: { damping: 11, mass: 0.6 } });
  const salida = saleAntes ? ease(interpolate(frame, [duracion - SALIDA, duracion], [1, 0], clamp)) : 1;
  const k = entrada * salida;
  const d = s.d * k;
  if (d < 1) return null;
  const flota = Math.sin(((frame + fase) / FLOTA_PERIODO) * Math.PI * 2) * FLOTA_PX;
  if (s.tipo === "web") return <WebVideo s={s} flota={flota} />;
  const tinta = s.tinta ?? (s.fondo === P.wisteria || s.fondo === P.marfil ? P.indigo : P.marfil);
  const contenidoT = sinEntrada ? 1 : interpolate(frame, [4, 34], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: s.x - d / 2,
        top: s.y - d / 2 + flota,
        width: d,
        height: d,
        filter: SOMBRA,
      }}
    >
      {s.tipo === "numero" ? (
        <>
          {/* cuarto de círculo Wisteria detrás, que gira apenas al entrar */}
          <div
            style={{
              position: "absolute",
              left: d * 0.42,
              top: -d * 0.12,
              width: d * 0.7,
              height: d * 0.7,
              background: s.fondo === P.wisteria ? P.indigo : P.wisteria,
              borderTopRightRadius: "100%",
              transform: `rotate(${interpolate(entrada, [0, 1], [-60, 0])}deg)`,
              transformOrigin: "0% 100%",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: s.fondo,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: `"${ALMARAI}", sans-serif`,
              fontWeight: 800,
              fontSize: d * NUMERO_PROPORCION,
              lineHeight: 1,
              paddingTop: d * 0.08, // Almarai asienta los números bajos: se compensa para centrarlos
              boxSizing: "border-box",
              color: tinta,
            }}
          >
            {s.numero}
          </div>
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: s.fondo,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconoSvg icono={s.icono} t={contenidoT} tinta={tinta} fondo={s.fondo} tamano={d * ICONO_PROPORCION} />
        </div>
      )}
    </div>
  );
};
