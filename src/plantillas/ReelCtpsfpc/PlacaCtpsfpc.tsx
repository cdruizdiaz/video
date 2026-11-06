// Placa de cierre del CTPSFPC (Colegio de Traductores de la Provincia de Santa Fe — 1.ª Circunscripción).
// Estilo del Social Media Playbook 2026: "Bento Grid + Bauhaus" — módulos cuadrados con formas geométricas
// simples (cuartos y medios círculos, círculos con ojo) en colores planos de la paleta, sobre Ivory Mist.
// Las formas se arman en cascada desde el centro hacia los bordes y el logo azul aparece en el medio.
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
import { BE_VIETNAM } from "../../marcas/ctpsfpc/fuentes";
import { PALETA_CTPSFPC as P } from "../../marcas/ctpsfpc/marca";

// ---------- Constantes de animación ----------
const CELDA = 270; // 4 columnas en 1080 de ancho
const FILAS_ABAJO = 2;
const ESCALON = 2; // frames entre una forma y la siguiente
const FORMA_DURA = 16; // frames de la entrada de cada forma
const LOGO_DEMORA = 10; // frames hasta que entra el logo
const LOGO_DURA = 18;
const LOGO_ANCHO = 560;
const LOGO_ANCHO_INICIAL = 470;
const GRUPO_Y = 960; // centro del conjunto logo + sitio (mitad entre las dos bandas)
const SITIO_TAMANO = 40;
const SITIO_ESPACIO = 52; // px visibles entre "CTPSFPC" y el sitio
const LOGO_AIRE = 0.124; // aire propio del SVG arriba y abajo (fracción de su alto): se descuenta al centrar
const SITIO_DEMORA = 20; // frames hasta que entra el sitio
const SITIO_DURA = 12;
const SITIO_SUBE = 18; // px que sube al entrar
const SALIDA = 0; // frames de fundido al final (0: termina sobre la placa)

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Esquina = "tl" | "tr" | "bl" | "br";
type Lado = "arriba" | "abajo" | "izq" | "der";
type Forma =
  | { tipo: "cuarto"; color: string; esquina: Esquina; fondo?: string } // cuarto de círculo con el centro en `esquina`
  | { tipo: "medio"; color: string; lado: Lado; fondo?: string } // medio círculo apoyado en `lado`
  | { tipo: "circulo"; color: string; ojo?: string; fondo?: string }
  | { tipo: "cuadrado"; color: string };

const ARRIBA: Forma[][] = [
  [
    { tipo: "cuarto", color: P.indigo, esquina: "br" },
    { tipo: "medio", color: P.chili, lado: "abajo" },
    { tipo: "cuadrado", color: P.wisteria },
    { tipo: "cuarto", color: P.gris, esquina: "bl", fondo: P.indigo },
  ],
  [
    { tipo: "circulo", color: P.indigo, ojo: P.marfil, fondo: P.wisteria },
    { tipo: "cuarto", color: P.gris, esquina: "tr" },
    { tipo: "medio", color: P.indigo, lado: "izq", fondo: P.chili },
    { tipo: "cuarto", color: P.wisteria, esquina: "tl" },
  ],
];

const ABAJO: Forma[][] = [
  [
    { tipo: "cuarto", color: P.chili, esquina: "br" },
    { tipo: "medio", color: P.wisteria, lado: "der", fondo: P.indigo },
    { tipo: "cuarto", color: P.indigo, esquina: "bl" },
    { tipo: "circulo", color: P.chili, ojo: P.indigo, fondo: P.gris },
  ],
  [
    { tipo: "cuadrado", color: P.indigo },
    { tipo: "cuarto", color: P.gris, esquina: "tl", fondo: P.wisteria },
    { tipo: "medio", color: P.chili, lado: "arriba" },
    { tipo: "cuarto", color: P.indigo, esquina: "tr" },
  ],
];

const RADIOS: Record<Esquina, string> = {
  // el radio va en la esquina opuesta al centro del cuarto de círculo
  tl: "0 0 100% 0",
  tr: "0 0 0 100%",
  bl: "0 100% 0 0",
  br: "100% 0 0 0",
};
const ORIGEN: Record<Esquina, string> = {
  tl: "0% 0%",
  tr: "100% 0%",
  bl: "0% 100%",
  br: "100% 100%",
};

const FormaCelda: React.FC<{ f: Forma; t: number }> = ({ f, t }) => {
  const fondo = "fondo" in f ? f.fondo : undefined;
  const base: React.CSSProperties = { position: "absolute", background: f.color };
  let figura: React.ReactNode;
  if (f.tipo === "cuadrado") {
    figura = (
      <div style={{ ...base, inset: 0, transform: `scale(${t})`, transformOrigin: "50% 50%" }} />
    );
  } else if (f.tipo === "cuarto") {
    figura = (
      <div
        style={{
          ...base,
          inset: 0,
          borderRadius: RADIOS[f.esquina],
          transform: `scale(${t})`,
          transformOrigin: ORIGEN[f.esquina],
        }}
      />
    );
  } else if (f.tipo === "medio") {
    const horizontal = f.lado === "arriba" || f.lado === "abajo";
    const r = CELDA / 2;
    const estilo: React.CSSProperties = horizontal
      ? {
          left: 0,
          width: CELDA,
          height: r,
          [f.lado === "abajo" ? "bottom" : "top"]: 0,
          borderRadius: f.lado === "abajo" ? `${r}px ${r}px 0 0` : `0 0 ${r}px ${r}px`,
          transformOrigin: f.lado === "abajo" ? "50% 100%" : "50% 0%",
        }
      : {
          top: 0,
          height: CELDA,
          width: r,
          [f.lado === "der" ? "right" : "left"]: 0,
          borderRadius: f.lado === "der" ? `${r}px 0 0 ${r}px` : `0 ${r}px ${r}px 0`,
          transformOrigin: f.lado === "der" ? "100% 50%" : "0% 50%",
        };
    figura = <div style={{ ...base, ...estilo, transform: `scale(${t})` }} />;
  } else {
    figura = (
      <div style={{ ...base, inset: 0, borderRadius: "50%", transform: `scale(${t})` }}>
        {f.ojo ? (
          <div
            style={{
              position: "absolute",
              inset: "31%",
              borderRadius: "50%",
              background: f.ojo,
              transform: `scale(${interpolate(t, [0.6, 1], [0, 1], clamp)})`,
            }}
          />
        ) : null}
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: CELDA, height: CELDA, overflow: "hidden" }}>
      {fondo ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: fondo,
            opacity: interpolate(t, [0, 0.35], [0, 1], clamp),
          }}
        />
      ) : null}
      {figura}
    </div>
  );
};

const Banda: React.FC<{ filas: Forma[][]; top: number; desdeAbajo: boolean }> = ({
  filas,
  top,
  desdeAbajo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 0, top }}>
      {filas.map((fila, r) => (
        <div key={r} style={{ display: "flex" }}>
          {fila.map((f, c) => {
            // cascada: primero las celdas más cercanas al logo (centro de la pantalla)
            const distFila = desdeAbajo ? r : filas.length - 1 - r;
            const distCol = Math.abs(c - 1.5);
            const demora = Math.round((distFila * 2 + distCol) * ESCALON);
            const t = spring({
              frame: frame - demora,
              fps,
              durationInFrames: FORMA_DURA,
              config: { damping: 14, mass: 0.7 },
            });
            return <FormaCelda key={c} f={f} t={t} />;
          })}
        </div>
      ))}
    </div>
  );
};

export const PlacaCtpsfpc: React.FC<{ duracion: number; sitio?: string }> = ({
  duracion,
  sitio,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({
    frame: frame - LOGO_DEMORA,
    fps,
    durationInFrames: LOGO_DURA,
    config: { damping: 13 },
  });
  const ancho = interpolate(entrada, [0, 1], [LOGO_ANCHO_INICIAL, LOGO_ANCHO]);
  const opacidad = interpolate(frame, [LOGO_DEMORA, LOGO_DEMORA + 6], [0, 1], clamp);
  // el logo y el sitio van centrados juntos (con el logo ya en su tamaño final, así no se mueve el conjunto)
  // (medido sobre lo que se ve del logo, sin el aire del SVG)
  const altoLogo = (LOGO_ANCHO * 504) / 737.36;
  const altoVisible = altoLogo * (1 - 2 * LOGO_AIRE);
  const altoGrupo = altoVisible + (sitio ? SITIO_ESPACIO + SITIO_TAMANO * 1.2 : 0);
  const centroLogo = GRUPO_Y - altoGrupo / 2 + altoVisible / 2;
  const sitioT = interpolate(frame, [SITIO_DEMORA, SITIO_DEMORA + SITIO_DURA], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
  const salida = SALIDA
    ? interpolate(frame, [duracion - SALIDA, duracion], [1, 0], clamp)
    : 1;
  return (
    <AbsoluteFill style={{ background: P.marfil, opacity: salida }}>
      <Banda filas={ARRIBA} top={0} desdeAbajo={false} />
      <Banda filas={ABAJO} top={1920 - FILAS_ABAJO * CELDA} desdeAbajo />
      <Img
        src={staticFile("marcas/ctpsfpc/logo-azul.svg")}
        style={{
          position: "absolute",
          left: (1080 - ancho) / 2,
          top: centroLogo - (ancho * 504) / 737.36 / 2,
          width: ancho,
          opacity: opacidad,
        }}
      />
      {sitio ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: GRUPO_Y + altoGrupo / 2 - SITIO_TAMANO * 1.2 + (1 - sitioT) * SITIO_SUBE,
            textAlign: "center",
            fontFamily: `"${BE_VIETNAM}", sans-serif`,
            fontWeight: 500,
            fontSize: SITIO_TAMANO,
            lineHeight: 1.2,
            letterSpacing: "0.02em",
            color: P.indigo,
            opacity: sitioT,
          }}
        >
          {sitio}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
