// Museo del Umbral (CEI, Halloween 2026): las teachers cuentan "The Threshold", el proyecto de todos los cursos sobre
// rituales funerarios de seis culturas. Montaje de tomas con su voz (proxies), inserts de la actividad con la voz de
// una teacher en off, testimonios de alumnos con cartel del país, subtítulos del CEI, música suave y cierre con el
// nombre de la actividad y el logo. El plan (cortes, audios, subtítulos) lo arma armar_plan.py -> plan.json.
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import type { Marca } from "../../marcas";
import { cei, PALETA_CEI } from "../../marcas/cei/marca";
import flor from "./flor.json";
import { Bandera } from "./Banderas";


// ---------- Constantes de animación y estilo ----------
const FPS = 30;
const ID = "2026-10-29_cei_halloween";
export const CARPETA = `trabajos/${ID}`;
export const PLACA_FR = 120; // frames de la placa con el nombre de la actividad
export const CIERRE_LOGO = 90; // frames del logo final
export const CRUCE_LOGO = 10; // frames del cruce entre la placa y el logo
export const MUSICA_BAJO_VOZ = 0.13; // volumen de la música bajo las voces (el archivo está a -20 LUFS: queda ~11 dB bajo la voz)
export const MUSICA_RAMPA = 10; // frames de la subida/bajada
export const MUSICA_PLACA = 0.55; // volumen en la placa final, sin voces
export const MUSICA_SUBE = 36; // frames que tarda en subir al llegar la placa
export const MUSICA_ANTICIPO = 12;
export const MUSICA_FADE_FINAL = 54;
const PLACA_FLOR = 400;
const PLACA_EMPUJE = 1.035;
const PLACA_GRANO = 0.07;
const FLOR_LUZ = "#ffc58a";
const PLACA_BOKEH = [
  { x: -170, y: -120, ancho: 560, desenfoque: 34, opacidad: 0.09, giro: 12, deriva: 0.12 },
  { x: 720, y: 180, ancho: 420, desenfoque: 26, opacidad: 0.07, giro: -20, deriva: 0.2 },
  { x: -120, y: 1380, ancho: 480, desenfoque: 30, opacidad: 0.07, giro: 30, deriva: -0.15 },
  { x: 760, y: 1500, ancho: 600, desenfoque: 40, opacidad: 0.08, giro: -8, deriva: -0.1 },
];
// Subtítulos del CEI: Filson Pro Medium, fondo hueso 80 % redondeado, letras naranja.
const SUB_TAMANO = 72; // "15" en CapCut = 72 px en 1080 de ancho
const SUB_MARGEN = 110;
const SUB_FONDO = "rgba(255, 237, 225, 0.8)";
const SUB_COLOR = PALETA_CEI.calabaza;
const SUB_PADDING_Y = 12;
const SUB_PADDING_X = 28;
const SUB_RADIO = 28;
const SUB_INTERLINEA = 1.18;
const SUB_Y = 1450;
const SUB_ENTRA = 4;
const SUB_FONDO_EN = "rgba(220, 123, 38, 0.92)"; // subtítulo en inglés: naranja con letras blancas
const SUB_ES_TAMANO = 44; // "9" de CapCut
const SUB_ES_PADDING_Y = 8;
const SUB_ES_PADDING_X = 22;
const SUB_ES_RADIO = 18;
const SUB_ES_GAP = 10;
export const AUDIO_FUNDIDO = 3; // frames de fundido al entrar y salir cada voz
// "Welcome" animado sobre los chicos de la apertura (arriba de ellos, Filson Pro Bold, blanco)
const WELCOME_Y = 360; // px, centro del texto
const WELCOME_TAMANO = 210;
const WELCOME_SILABAS = [
  { t: "Wel", entra: 3 }, // frame (del insert) en que entra cada sílaba: acompañan el grito
  { t: "come", entra: 19 },
];
const WELCOME_POP = 9; // frames que dura el "pop" de cada sílaba
// Transición de luz al entrar cada teacher (como la de R1_VFinal de DOCBA, s 11-12): la imagen se sobreexpone con
// un brillo suave, el corte cae en el pico y la luz se apaga sola (flash de cámara, limpio)
const FLASH_SUBE = 6; // frames hasta el pico
const FLASH_BAJA = 11; // frames de decaimiento
const FLASH_BLANCO = 0.72; // opacidad máxima del velo claro
export const FLASH_BRILLO = 0.9; // brillo extra de la imagen en el pico
export const FLASH_DESENFOQUE = 5; // px de desenfoque en el pico (el brillo "sangra")
export const FLASH_ZOOM = 0.06; // la imagen se agranda un poco en el pico (así el desenfoque no deja bordes)
// Cartel del país (testimonios de alumnos)
const TAG_Y = 250;
const TAG_Y_BANDERA = 340; // cartel del país con bandera, un poco más abajo
const TAG_BANDERA = 112; // px de ancho de la bandera (cartel grande, 2026-10-30)
const TAG_TAMANO_BANDERA = 72; // px de la letra del cartel con bandera
const TAG_TAMANO = 54;
const TAG_ENTRA = 8;

// ---------- Tipos ----------
export type PlanMuseo = {
  video: { clip: string; ini: number; dur: number; fundido?: number; flash?: boolean; rot?: number; esc?: number; luz?: number }[]; // s del proxy / s en pantalla, en orden; fundido = frames de cruce con el anterior
  audio: { id: string; desde: number; dur: number; gananciaDb: number; fade?: number }[]; // desde/dur en s de la línea de tiempo
  subs: { t: string; desde: number; hasta: number }[];
  tags: { t: string; desde: number; hasta: number }[];
  musicaSola: { desde: number; hasta: number; nivel: number }[]; // tramos sin voz: la música sube
  musicaDesde: number; // s en que arranca la música (con la teacher 1; antes se oye el insert de apertura)
  finTomas: number; // s
};
export type MuseoProps = { plan: PlanMuseo; sinSubsNiMusica?: boolean };

export const frames = (s: number) => Math.round(s * FPS);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const duracionMuseo = (p: Pick<MuseoProps, "plan">) => frames(p.plan.finTomas) + PLACA_FR + CIERRE_LOGO - CRUCE_LOGO;

const FundidoEntrada: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames: n, children }) => {
  const f = useCurrentFrame();
  const o = n > 0 ? interpolate(f, [0, n], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// ---------- Subtítulo ----------
// Parte la frase en una o dos líneas parejas que entren en `maxPx` (se mide con la tipografía real).
let lienzo: CanvasRenderingContext2D | null = null;
const medir = (texto: string, fuente: string, tam: number) => {
  if (typeof document === "undefined") return texto.length * tam * 0.5;
  lienzo = lienzo ?? document.createElement("canvas").getContext("2d");
  if (!lienzo) return texto.length * tam * 0.5;
  lienzo.font = `500 ${tam}px ${fuente}`;
  return lienzo.measureText(texto).width;
};
const partir = (texto: string, fuente: string, tam: number, maxPx: number): { lineas: string[]; tam: number } => {
  const limpio = texto.replace(/\s+/g, " ").trim();
  let t = tam;
  for (let intento = 0; intento < 6; intento++) {
    if (medir(limpio, fuente, t) <= maxPx) return { lineas: [limpio], tam: t };
    const pal = limpio.split(" ");
    let mejor: string[] | null = null;
    let mejorAncho = Infinity;
    for (let i = 1; i < pal.length; i++) {
      const a = pal.slice(0, i).join(" ");
      const b = pal.slice(i).join(" ");
      const ancho = Math.max(medir(a, fuente, t), medir(b, fuente, t));
      if (ancho < mejorAncho) {
        mejorAncho = ancho;
        mejor = [a, b];
      }
    }
    if (mejor && mejorAncho <= maxPx) return { lineas: mejor, tam: t };
    t = Math.floor(t * 0.92);
  }
  return { lineas: [limpio], tam: t };
};

// Subtítulo del CEI. `seco`: entra y sale sin animación. `es`: el chico habla inglés -> doble subtítulo (referencia del
// cliente): el inglés en naranja con letras blancas y debajo el español chico, fondo hueso con letras naranja.
export const Subtitulo: React.FC<{ texto: string; marca: Marca; desde: number; seco?: boolean; es?: string }> = ({ texto, marca, desde, seco = false, es }) => {
  const f = useCurrentFrame();
  const p = seco ? 1 : interpolate(f, [desde, desde + SUB_ENTRA], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const maxTexto = 1080 - 2 * SUB_MARGEN - 2 * SUB_PADDING_X;
  const { lineas, tam } = partir(texto, marca.fuente, SUB_TAMANO, maxTexto);
  const ingles = es !== undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: SUB_Y,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: SUB_ES_GAP,
        opacity: p,
        transform: seco ? "translateY(-50%)" : `translateY(calc(-50% + ${(1 - p) * 14}px))`,
      }}
    >
      <div
        style={{
          padding: `${SUB_PADDING_Y}px ${SUB_PADDING_X}px`,
          borderRadius: lineas.length > 1 ? SUB_RADIO + 6 : SUB_RADIO,
          background: ingles ? SUB_FONDO_EN : SUB_FONDO,
          color: ingles ? PALETA_CEI.hueso : SUB_COLOR,
          fontFamily: marca.fuente,
          fontWeight: 500,
          fontSize: tam,
          lineHeight: SUB_INTERLINEA,
          textAlign: "center",
          whiteSpace: "pre",
        }}
      >
        {lineas.join("\n")}
      </div>
      {ingles ? (
        <div
          style={{
            padding: `${SUB_ES_PADDING_Y}px ${SUB_ES_PADDING_X}px`,
            borderRadius: SUB_ES_RADIO,
            background: SUB_FONDO,
            color: SUB_COLOR,
            fontFamily: marca.fuente,
            fontWeight: 500,
            fontSize: SUB_ES_TAMANO,
            lineHeight: SUB_INTERLINEA,
            whiteSpace: "pre",
          }}
        >
          {es}
        </div>
      ) : null}
    </div>
  );
};

const Welcome: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* velo oscuro suave arriba para que el blanco se lea sobre la pared clara */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,27,43,0.38) 0%, rgba(7,27,43,0.14) 28%, rgba(7,27,43,0) 45%)" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: WELCOME_Y,
          transform: "translateY(-50%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          fontFamily: cei.fuente,
          fontWeight: 700,
          fontSize: WELCOME_TAMANO,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: "#ffffff",
          textShadow: "0 8px 30px rgba(7, 27, 43, 0.45), 0 2px 6px rgba(7, 27, 43, 0.3)",
        }}
      >
        {WELCOME_SILABAS.map((sil, i) => {
          const p = interpolate(f, [sil.entra, sil.entra + WELCOME_POP], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
          const o = interpolate(f, [sil.entra, sil.entra + 3], [0, 1], clamp);
          return (
            <span
              key={sil.t}
              style={{
                display: "inline-block",
                opacity: o,
                transform: `translateY(${(1 - p) * 60}px) scale(${0.55 + 0.45 * p}) rotate(${(1 - p) * (i === 0 ? -8 : 6)}deg)`,
                transformOrigin: "50% 100%",
                filter: `blur(${(1 - o) * 8}px)`,
              }}
            >
              {sil.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Intensidad (0-1) del flash en el cuadro f para un corte en el cuadro c: sube hasta el corte y se apaga después
export const intensidadFlash = (f: number, c: number) =>
  f < c
    ? interpolate(f, [c - FLASH_SUBE, c], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })
    : interpolate(f, [c, c + FLASH_BAJA], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

export const VeloLuz: React.FC<{ e: number }> = ({ e }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 80% 60% at 50% 38%, rgba(255,253,246,${e * FLASH_BLANCO}) 0%, rgba(255,250,238,${e * FLASH_BLANCO * 0.8}) 100%)`,
    }}
  />
);

export const Tag: React.FC<{ texto: string; desde: number; bandera?: boolean; y?: number; seco?: boolean }> = ({ texto, desde, bandera = false, y, seco = false }) => {
  const f = useCurrentFrame();
  const p = seco ? 1 : interpolate(f, [desde, desde + TAG_ENTRA], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y ?? (bandera ? TAG_Y_BANDERA : TAG_Y),
        display: "flex",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * -12}px)`,
      }}
    >
      <div
        style={{
          padding: bandera ? "14px 52px 14px 30px" : "12px 42px",
          borderRadius: bandera ? 56 : 40,
          background: PALETA_CEI.royal,
          color: PALETA_CEI.hueso,
          fontFamily: cei.fuente,
          fontWeight: 500,
          fontSize: bandera ? TAG_TAMANO_BANDERA : TAG_TAMANO,
          letterSpacing: "0.12em",
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        {bandera ? <Bandera pais={texto} ancho={TAG_BANDERA} /> : null}
        {texto}
      </div>
    </div>
  );
};

// ---------- Cierre: placa con el nombre de la actividad y logo ----------
// La flor es la del logo del CEI (contornos extraídos del manual: flor.json): cinco pétalos y el centro.
export const FlorLogo: React.FC<{ ancho: number; progreso: number; borde?: boolean; relieve?: boolean; colorBorde?: string; colorPetalo?: string }> = ({
  ancho,
  progreso,
  borde = true,
  relieve = false,
  colorBorde,
  colorPetalo,
}) => {
  const cx = flor.ancho / 2;
  const cy = flor.alto / 2;
  const petalos = flor.petalos; // ordenados de mayor a menor: el último es el centro
  const relleno = relieve ? "url(#flor-luz)" : (colorPetalo ?? flor.colorPetalo);
  return (
    <svg width={ancho} height={(ancho * flor.alto) / flor.ancho} viewBox={`0 0 ${flor.ancho} ${flor.alto}`} style={{ overflow: "visible" }}>
      {relieve ? (
        <defs>
          <radialGradient id="flor-luz" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={flor.ancho * 0.62} fx={cx * 0.62} fy={cy * 0.55}>
            <stop offset="0" stopColor={FLOR_LUZ} />
            <stop offset="0.45" stopColor={PALETA_CEI.agosto} />
            <stop offset="0.8" stopColor={PALETA_CEI.calabaza} />
            <stop offset="1" stopColor={PALETA_CEI.canela} />
          </radialGradient>
        </defs>
      ) : null}
      <g transform={`rotate(${(1 - progreso) * -35} ${cx} ${cy})`}>
        {borde ? (
          <path
            d={flor.silueta}
            fill={colorBorde ?? flor.colorBorde}
            opacity={interpolate(progreso, [0, 0.3], [0, 1], clamp)}
            transform={`translate(${cx} ${cy}) scale(${0.55 + 0.45 * progreso}) translate(${-cx} ${-cy})`}
          />
        ) : null}
        {petalos.map((d, i) => {
          const esCentro = i === petalos.length - 1;
          const ini = esCentro ? 0.55 : i * 0.1;
          const p = interpolate(progreso, [ini, ini + 0.45], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
          return <path key={d.slice(0, 30)} d={d} fill={relleno} transform={`translate(${cx} ${cy}) scale(${p}) translate(${-cx} ${-cy})`} />;
        })}
      </g>
    </svg>
  );
};

// Placa: fondo azul royal del CEI con luz cálida detrás de la flor, viñeta, flores desenfocadas y grano fino.
export const PlacaMuseo: React.FC<{ marca: Marca }> = ({ marca }) => {
  const f = useCurrentFrame();
  const suave = Easing.bezier(0.22, 1, 0.36, 1);
  const abre = interpolate(f, [4, 54], [0, 1], { ...clamp, easing: suave });
  const linea1 = interpolate(f, [22, 46], [0, 1], { ...clamp, easing: suave });
  const linea2 = interpolate(f, [30, 56], [0, 1], { ...clamp, easing: suave });
  const filete = interpolate(f, [46, 76], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const empuje = interpolate(f, [0, PLACA_FR], [1, PLACA_EMPUJE], clamp);
  const luz = interpolate(f, [0, 40], [0, 1], { ...clamp, easing: suave });
  const entraTexto = (p: number): React.CSSProperties => ({
    opacity: p,
    filter: `blur(${(1 - p) * 10}px)`,
    transform: `translateY(${(1 - p) * 26}px)`,
  });
  return (
    <AbsoluteFill style={{ background: PALETA_CEI.royal, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: luz,
          background: `radial-gradient(ellipse 70% 42% at 50% 30%, rgba(239, 145, 60, 0.18) 0%, rgba(239, 145, 60, 0.05) 45%, rgba(239, 145, 60, 0) 75%)`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 46%, rgba(0, 0, 0, 0) 55%, rgba(3, 12, 24, 0.5) 100%)" }} />
      {PLACA_BOKEH.map((b) => (
        <div
          key={`${b.x}-${b.y}`}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y + f * b.deriva,
            opacity: b.opacidad * luz,
            filter: `blur(${b.desenfoque}px)`,
            transform: `rotate(${b.giro + f * 0.05}deg)`,
          }}
        >
          <FlorLogo ancho={b.ancho} progreso={1} borde={false} />
        </div>
      ))}
      <AbsoluteFill style={{ transform: `scale(${empuje})` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 440,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(abre, [0, 0.25], [0, 1], clamp),
            filter: "drop-shadow(0 30px 50px rgba(3, 12, 24, 0.6)) drop-shadow(0 4px 8px rgba(3, 12, 24, 0.3))",
          }}
        >
          <FlorLogo ancho={PLACA_FLOR} progreso={abre} relieve />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 980, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              ...entraTexto(linea1),
              fontFamily: cei.fuente, // Filson Pro Regular Italic (FilsonProRegularItalic.otf, del cliente)
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 84,
              lineHeight: 1,
              color: PALETA_CEI.agosto,
              letterSpacing: "0.01em",
            }}
          >
            Museo del Umbral
          </div>
          <div
            style={{
              ...entraTexto(linea2),
              marginTop: 10,
              fontFamily: marca.fuenteTitulos,
              fontWeight: 500,
              fontSize: 132,
              lineHeight: 1.05,
              color: PALETA_CEI.hueso,
              letterSpacing: "-0.015em",
              textShadow: "0 6px 24px rgba(3, 12, 24, 0.4)",
            }}
          >
            The Threshold
          </div>
          <div style={{ marginTop: 56, display: "flex", alignItems: "center", gap: 18, opacity: filete }}>
            <div style={{ height: 2, width: 150 * filete, background: `linear-gradient(90deg, rgba(255,237,225,0), ${PALETA_CEI.hueso})`, opacity: 0.55 }} />
            <div style={{ width: 9, height: 9, borderRadius: 5, background: PALETA_CEI.agosto }} />
            <div style={{ height: 2, width: 150 * filete, background: `linear-gradient(90deg, ${PALETA_CEI.hueso}, rgba(255,237,225,0))`, opacity: 0.55 }} />
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: PLACA_GRANO, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="placa-grano">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 6} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#placa-grano)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const LogoFinal: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [CRUCE_LOGO, CRUCE_LOGO + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fondo = interpolate(f, [0, CRUCE_LOGO], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: PALETA_CEI.hueso, alignItems: "center", justifyContent: "center", opacity: fondo }}>
      <Img src={staticFile(cei.logo)} style={{ width: 860, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }} />
    </AbsoluteFill>
  );
};

// ---------- Composición ----------
export const MuseoUmbral: React.FC<MuseoProps> = ({ plan, sinSubsNiMusica = false }) => {
  const f = useCurrentFrame();
  const finTomas = frames(plan.finTomas);
  const inicioLogo = finTomas + PLACA_FR - CRUCE_LOGO;
  const total = duracionMuseo({ plan });
  let acum = 0;
  const arranques = plan.video.map((v) => {
    const a = acum;
    acum += frames(v.dur);
    return a;
  });
  const cortesFlash = plan.video.flatMap((v, i) => (v.flash ? [arranques[i]] : []));
  const e = Math.max(0, ...cortesFlash.map((c) => intensidadFlash(f, c)));
  const sub = plan.subs.find((s) => f >= frames(s.desde) && f < frames(s.hasta));
  const tag = plan.tags.find((s) => f >= frames(s.desde) && f < frames(s.hasta));
  return (
    <AbsoluteFill style={{ background: PALETA_CEI.royal }}>
      <AbsoluteFill
        style={{
          filter: e > 0 ? `blur(${e * FLASH_DESENFOQUE}px) brightness(${1 + e * FLASH_BRILLO}) contrast(${1 - e * 0.2})` : undefined,
          transform: e > 0 ? `scale(${1 + e * FLASH_ZOOM})` : undefined,
        }}
      >
      {plan.video.map((v, i) => {
        const fu = v.fundido ?? 0; // cruce: entra antes, con la imagen sincronizada, subiendo de opacidad
        return (
          <Sequence key={`v${i}`} from={arranques[i] - fu} durationInFrames={frames(v.dur) + fu} premountFor={30}>
            <FundidoEntrada frames={fu}>
              <OffthreadVideo
                src={staticFile(`${CARPETA}/crudos/${v.clip}.mp4`)}
                trimBefore={Math.max(0, frames(v.ini) - fu)}
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  // inserts enderezados (rot, grados) y escalados para que no asomen bordes (esc); luz = brillo de los oscuros
                  transform: v.rot ? `rotate(${v.rot}deg) scale(${v.esc ?? 1})` : undefined,
                  filter: v.luz ? `brightness(${v.luz}) contrast(1.04) saturate(1.04)` : undefined,
                }}
              />
            </FundidoEntrada>
          </Sequence>
        );
      })}
      </AbsoluteFill>
      {e > 0 ? <VeloLuz e={e} /> : null}
      <Sequence durationInFrames={frames(plan.video[0].dur)} layout="none">
        <Welcome />
      </Sequence>
      {plan.audio.map((a) => {
        const dura = frames(a.dur);
        const fa = a.fade ?? AUDIO_FUNDIDO;
        const lineal = Math.pow(10, a.gananciaDb / 20);
        return (
          <Sequence key={a.id} from={frames(a.desde)} durationInFrames={dura} layout="none">
            <Audio
              src={staticFile(`${CARPETA}/audio/voz/${a.id}.wav`)}
              volume={(g) => lineal * interpolate(g, [0, fa, dura - fa, dura], [0, 1, 1, 0], clamp)}
            />
          </Sequence>
        );
      })}
      {sinSubsNiMusica || !tag ? null : <Tag key={tag.desde} texto={tag.t} desde={frames(tag.desde)} />}
      {sinSubsNiMusica || !sub ? null : <Subtitulo key={sub.desde} texto={sub.t} marca={cei} desde={frames(sub.desde)} />}
      {sinSubsNiMusica ? null : (
        <Audio
          src={staticFile(`${CARPETA}/audio/musica.wav`)}
          volume={(g) => {
            const subida = Math.max(
              0,
              ...plan.musicaSola.map(
                (w) =>
                  (w.nivel - MUSICA_BAJO_VOZ) *
                  Math.min(
                    interpolate(g, [frames(w.desde), frames(w.desde) + MUSICA_RAMPA], [0, 1], clamp),
                    interpolate(g, [frames(w.hasta) - MUSICA_RAMPA, frames(w.hasta)], [1, 0], clamp),
                  ),
              ),
            );
            const base = MUSICA_BAJO_VOZ + subida;
            const sube = interpolate(g, [finTomas - MUSICA_ANTICIPO, finTomas - MUSICA_ANTICIPO + MUSICA_SUBE], [base, MUSICA_PLACA], {
              ...clamp,
              easing: Easing.inOut(Easing.cubic),
            });
            const baja = interpolate(g, [total - MUSICA_FADE_FINAL, total], [1, 0], clamp);
            const arranca = interpolate(g, [frames(plan.musicaDesde), frames(plan.musicaDesde) + MUSICA_RAMPA], [0, 1], clamp);
            return sube * baja * arranca;
          }}
        />
      )}
      <Sequence from={finTomas} durationInFrames={PLACA_FR}>
        <PlacaMuseo marca={cei} />
      </Sequence>
      <Sequence from={inicioLogo} durationInFrames={CIERRE_LOGO}>
        <LogoFinal />
      </Sequence>
    </AbsoluteFill>
  );
};
