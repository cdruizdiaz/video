import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASE, INTER, MARGEN, PAPEL, TINTA } from "./tema";

const DURACION_REVEAL = 20;
const DURACION_FADE = 14;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Factor de ritmo: 1 = versión de 30 s; < 1 acelera todas las animaciones
export const Ritmo = React.createContext(1);
// Convierte un tiempo "de la versión de 30 s" al ritmo actual
export const useT = () => {
  const f = React.useContext(Ritmo);
  return (frames: number) => Math.round(frames * f);
};

const useEntrada = (desde: number, duracion = DURACION_REVEAL) => {
  const frame = useCurrentFrame();
  const t = useT();
  return interpolate(frame, [desde, desde + Math.max(6, t(duracion))], [0, 1], {
    ...clamp,
    easing: EASE,
  });
};

// Texto que aparece suavemente desde abajo (máscara + fundido)
export const Reveal: React.FC<{
  desde: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ desde, children, style }) => {
  const p = useEntrada(desde);
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.1em", marginBottom: "-0.1em" }}>
      <div
        style={{
          transform: `translateY(${(1 - p) * 100}%)`,
          opacity: p,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Bloque que sube un poco mientras aparece (textos chicos, logos)
export const Aparece: React.FC<{
  desde: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ desde, children, style }) => {
  const p = useEntrada(desde, DURACION_FADE + 6);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, ...style }}>
      {children}
    </div>
  );
};

// Etiqueta en mayúsculas con letras espaciadas
export const Etiqueta: React.FC<{
  children: React.ReactNode;
  color: string;
  size?: number;
}> = ({ children, color, size = 28 }) => (
  <div
    style={{
      fontFamily: INTER,
      fontWeight: 500,
      fontSize: size,
      letterSpacing: "0.3em",
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </div>
);

// Logo original. "claro" lo pasa a blanco/crema para fondos oscuros.
export const Logo: React.FC<{ ancho: number; claro?: boolean; style?: React.CSSProperties }> = ({
  ancho,
  claro,
  style,
}) => (
  <Img
    src={staticFile("img/rastro/logo.png")}
    style={{
      width: ancho,
      filter: claro ? "invert(1) brightness(2.2)" : "brightness(0.35)",
      ...style,
    }}
  />
);

// Encabezado: logo arriba a la izquierda y número [0N] arriba a la derecha
export const Encabezado: React.FC<{ numero?: string; claro?: boolean }> = ({
  numero,
  claro,
}) => {
  const p = useEntrada(0, 12);
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        left: MARGEN,
        right: MARGEN,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        opacity: p,
      }}
    >
      <Logo ancho={210} claro={claro} />
      {numero ? (
        <span
          style={{
            fontFamily: INTER,
            fontSize: 32,
            letterSpacing: "0.04em",
            color: claro ? "rgba(247,244,234,.7)" : "rgba(13,13,13,.6)",
          }}
        >
          [{numero}]
        </span>
      ) : null}
    </div>
  );
};

// Pie: línea fina + leyenda a la izquierda y RASTRO® a la derecha
export const Pie: React.FC<{
  desde: number;
  izquierda: string;
  derecha?: string;
  claro?: boolean;
}> = ({ desde, izquierda, derecha = "RASTRO®", claro }) => {
  const t = useT();
  const linea = useEntrada(desde, 24);
  const textos = useEntrada(desde + t(8), DURACION_FADE);
  const color = claro ? "rgba(247,244,234,.72)" : "rgba(13,13,13,.62)";
  return (
    <div style={{ position: "absolute", top: 1490, left: MARGEN, right: MARGEN }}>
      <div
        style={{
          height: 2,
          background: claro ? "rgba(247,244,234,.22)" : "rgba(13,13,13,.16)",
          transform: `scaleX(${linea})`,
          transformOrigin: "left",
        }}
      />
      <div
        style={{
          marginTop: 26,
          display: "flex",
          justifyContent: "space-between",
          opacity: textos,
        }}
      >
        <Etiqueta color={color} size={24}>
          {izquierda}
        </Etiqueta>
        <Etiqueta color={color} size={24}>
          {derecha}
        </Etiqueta>
      </div>
    </div>
  );
};

// Imagen que entra (fundido + leve subida) y se acerca lentamente todo el tiempo
export const ImagenLenta: React.FC<{
  src: string;
  desde: number;
  duracionEscena: number;
  alto: number;
  top: number;
  inclinacionInicial?: number;
}> = ({ src, desde, duracionEscena, alto, top, inclinacionInicial = 0 }) => {
  const frame = useCurrentFrame();
  const entrada = useEntrada(desde, 30);
  const zoom = interpolate(frame, [desde, duracionEscena], [0.94, 1.06], clamp);
  const t = useT();
  const giro = interpolate(frame, [desde, desde + t(36)], [inclinacionInicial, 0], {
    ...clamp,
    easing: EASE,
  });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        height: alto,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: entrada,
        transform: `translateY(${(1 - entrada) * 60}px) scale(${zoom}) rotate(${giro}deg)`,
      }}
    >
      <Img src={staticFile(src)} style={{ maxWidth: "100%", maxHeight: "100%" }} />
    </div>
  );
};

// Cápsula negra "HABLEMOS" con flecha en círculo claro que gira al aparecer
export const Capsula: React.FC<{ texto: string; desde: number }> = ({ texto, desde }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: frame - desde, fps, config: { damping: 16, mass: 0.7 } });
  const t = useT();
  const giro = interpolate(frame, [desde + t(4), desde + t(30)], [-90, 0], {
    ...clamp,
    easing: EASE,
  });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 40,
        background: TINTA,
        borderRadius: 999,
        padding: "22px 22px 22px 64px",
        opacity: interpolate(frame, [desde, desde + 8], [0, 1], clamp),
        transform: `translateY(${(1 - entrada) * 40}px) scale(${0.92 + entrada * 0.08})`,
      }}
    >
      <span
        style={{
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: 44,
          letterSpacing: "0.16em",
          color: PAPEL,
        }}
      >
        {texto}
      </span>
      <div
        style={{
          width: 104,
          height: 104,
          borderRadius: 999,
          background: PAPEL,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={50}
          height={50}
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: `rotate(${giro}deg)` }}
        >
          <path
            d="M7 17L17 7M17 7H9M17 7V15"
            stroke={TINTA}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
