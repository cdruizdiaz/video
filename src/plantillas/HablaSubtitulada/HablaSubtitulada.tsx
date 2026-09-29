// Plantilla "HablaSubtitulada": video vertical de una persona hablando a cámara.
// Se alimenta con un montaje (tomas = tramos de clips), la transcripción por palabra de cada
// clip, música y un kit de marca. Hace:
//  - cortes directos entre tomas; en los cortes dentro del mismo plano, un zoom distinto
//    disimula el salto; acercamiento lento durante cada toma;
//  - subtítulos por grupos cortos de palabras, con la palabra que se está diciendo resaltada;
//  - música de fondo baja bajo la voz, que sube en el cierre;
//  - cierre con logo, frase y sitio de la marca.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { conAlfa, MARCAS, type Marca } from "../../marcas";

// ---------- Constantes de animación ----------
const FPS = 30;
const ZOOM_LENTO = 0.035; // cuánto se acerca la cámara a lo largo de cada toma
const ORIGEN_ZOOM = "50% 32%"; // punto hacia el que se acerca (cara, tercio superior)
const RAMPA_AUDIO = 2; // frames de fundido de la voz en cada corte (evita clics)
const MAX_PALABRAS = 3; // palabras por grupo de subtítulo
const MAX_CARACTERES = 18; // largo máximo de un grupo
const COLA_SUBTITULO_MS = 350; // cuánto queda el último grupo tras la última palabra
const SUB_Y = 1290; // centro vertical de los subtítulos (zona segura de Reels/TikTok)
const SUB_TAMANO = 78;
const SUB_FONDO_ALFA = 0.82; // cápsula oscura detrás del texto (se lee sobre cualquier fondo)
const SUB_RELLENO = "16px 30px";
const SUB_RADIO = 26;
const ENTRADA_SUB = 5; // frames de entrada de cada grupo
const LOGO_ANCHO = 190;
const LOGO_Y = 140;
const CIERRE_FUNDIDO = 9; // frames de fundido de entrada del cierre
const MUSICA_SUBIDA = 18; // frames en que la música sube al empezar el cierre

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- Datos ----------
export type PalabraFuente = { text: string; startMs: number; endMs: number };

export type Toma = {
  clip: string; // clave en la transcripción; el video es `${carpetaVideos}/${clip}.mp4`
  desdeMs: number;
  hastaMs: number;
  gananciaDb?: number;
  zoom?: number; // escala base de la toma (p. ej. 1.12 en un corte dentro del mismo plano)
};

export type HablaSubtituladaProps = {
  marca: string;
  carpetaVideos: string; // dentro de public/
  tomas: Toma[];
  transcripcion: Record<string, PalabraFuente[]>;
  velocidad: number; // 1 = normal; 1.05 = 5 % más rápido (mantiene el tono)
  musica: string;
  musicaBajoVozDb: number; // volumen de la música mientras hay voz
  musicaCierreDb: number; // volumen de la música en el cierre
  cierre: { frase: string; sitio: string; duracion: number }; // duracion en frames
};

// ---------- Cálculos de montaje ----------
const framesToma = (t: Toma, velocidad: number) =>
  Math.round(((t.hastaMs - t.desdeMs) / 1000) * FPS / velocidad);

const inicios = (p: HablaSubtituladaProps) => {
  let acc = 0;
  return p.tomas.map((t) => {
    const ini = acc;
    acc += framesToma(t, p.velocidad);
    return ini;
  });
};

const framesTomas = (p: HablaSubtituladaProps) =>
  p.tomas.reduce((s, t) => s + framesToma(t, p.velocidad), 0);

export const duracionHablaSubtitulada = (p: HablaSubtituladaProps) => framesTomas(p) + p.cierre.duracion;

const dbAVolumen = (db: number) => Math.pow(10, db / 20);

// Palabras en tiempo de salida (frames); solo las que caen dentro de alguna toma
type Palabra = { text: string; desde: number; hasta: number; nuevaFrase: boolean };

const palabrasMontadas = (p: HablaSubtituladaProps): Palabra[] => {
  const ini = inicios(p);
  const out: Palabra[] = [];
  p.tomas.forEach((t, i) => {
    const aFrame = (ms: number) => ini[i] + ((ms - t.desdeMs) / 1000) * FPS / p.velocidad;
    const palabras = p.transcripcion[t.clip] ?? [];
    palabras.forEach((w) => {
      const medio = (w.startMs + w.endMs) / 2;
      if (medio < t.desdeMs || medio > t.hastaMs) return;
      out.push({
        text: w.text,
        desde: Math.max(ini[i], aFrame(w.startMs)),
        hasta: Math.min(ini[i] + framesToma(t, p.velocidad), aFrame(w.endMs)),
        nuevaFrase: false,
      });
    });
  });
  // una frase nueva empieza tras un signo de cierre
  out.forEach((w, i) => {
    w.nuevaFrase = i === 0 || /[.?!]$/.test(out[i - 1].text);
  });
  return out;
};

type Grupo = { palabras: Palabra[]; desde: number; hasta: number };

const agrupar = (palabras: Palabra[]): Grupo[] => {
  const grupos: Grupo[] = [];
  let actual: Palabra[] = [];
  const cerrar = () => {
    if (actual.length) grupos.push({ palabras: actual, desde: actual[0].desde, hasta: 0 });
    actual = [];
  };
  palabras.forEach((w) => {
    const largo = [...actual, w].map((x) => x.text).join(" ").length;
    if (w.nuevaFrase || actual.length >= MAX_PALABRAS || largo > MAX_CARACTERES) cerrar();
    actual.push(w);
    if (/[,:;]$/.test(w.text)) cerrar(); // una coma también corta el grupo
  });
  cerrar();
  grupos.forEach((g, i) => {
    const fin = g.palabras[g.palabras.length - 1].hasta + (COLA_SUBTITULO_MS / 1000) * FPS;
    g.hasta = i + 1 < grupos.length ? Math.min(grupos[i + 1].desde, fin) : fin;
  });
  return grupos;
};

// ---------- Piezas ----------
const TomaVideo: React.FC<{ t: Toma; src: string; dura: number; velocidad: number }> = ({ t, src, dura, velocidad }) => {
  const frame = useCurrentFrame();
  const base = t.zoom ?? 1;
  const escala = base * interpolate(frame, [0, dura], [1, 1 + ZOOM_LENTO], clamp);
  const g = dbAVolumen(t.gananciaDb ?? 0);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        trimBefore={Math.round((t.desdeMs / 1000) * FPS)}
        playbackRate={velocidad}
        volume={(f) =>
          g * interpolate(f, [0, RAMPA_AUDIO, dura - RAMPA_AUDIO, dura], [0, 1, 1, 0], clamp)
        }
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${escala})`,
          transformOrigin: ORIGEN_ZOOM,
        }}
      />
    </AbsoluteFill>
  );
};

const Subtitulo: React.FC<{ g: Grupo; m: Marca }> = ({ g, m }) => {
  const frame = useCurrentFrame(); // relativo al inicio del grupo
  const { fps } = useVideoConfig();
  const entrada = spring({ frame, fps, durationInFrames: ENTRADA_SUB * 2, config: { damping: 14 } });
  const opacidad = interpolate(frame, [0, ENTRADA_SUB], [0, 1], clamp);
  const ahora = g.desde + frame;
  return (
    <div
      style={{
        position: "absolute",
        left: m.margen,
        right: m.margen,
        top: SUB_Y,
        transform: `translateY(-50%) scale(${0.86 + 0.14 * entrada})`,
        opacity: opacidad,
        textAlign: "center",
        fontFamily: m.fuenteTitulos ?? m.fuente,
        fontWeight: 800,
        fontSize: SUB_TAMANO,
        lineHeight: 1.1,
        letterSpacing: "-0.01em",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: SUB_RELLENO,
          borderRadius: SUB_RADIO,
          background: conAlfa(m.colores.oscuro, SUB_FONDO_ALFA),
          boxShadow: `0 10px 30px ${conAlfa(m.colores.oscuro, 0.35)}`,
        }}
      >
        {g.palabras.map((w, i) => {
          const activa = ahora >= w.desde && ahora < Math.max(w.hasta, w.desde + 4);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 0.2em",
                color: activa ? (m.colores.acento ?? m.colores.claro) : m.colores.claro,
                transform: `scale(${activa ? 1.06 : 1})`,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const LogoSuperior: React.FC<{ m: Marca }> = ({ m }) => (
  <Img
    src={staticFile(m.logo)}
    style={{
      position: "absolute",
      top: LOGO_Y,
      left: "50%",
      width: LOGO_ANCHO,
      transform: "translateX(-50%)",
      filter: `${m.logoFiltroSobreOscuro === "none" ? "" : m.logoFiltroSobreOscuro} drop-shadow(0 3px 10px ${conAlfa(m.colores.oscuro, 0.6)})`,
      opacity: 0.95,
    }}
  />
);

const Cierre: React.FC<{ m: Marca; frase: string; sitio: string }> = ({ m, frase, sitio }) => {
  const frame = useCurrentFrame();
  const fondo = interpolate(frame, [0, CIERRE_FUNDIDO], [0, 1], clamp);
  const logo = interpolate(frame, [4, 4 + 14], [0, 1], { ...clamp, easing: m.ease });
  const texto = interpolate(frame, [10, 10 + 14], [0, 1], { ...clamp, easing: m.ease });
  return (
    <AbsoluteFill style={{ background: conAlfa(m.colores.oscuro, fondo), alignItems: "center", justifyContent: "center" }}>
      <Img
        src={staticFile(m.logo)}
        style={{
          width: 620,
          opacity: logo,
          transform: `translateY(${(1 - logo) * 40}px)`,
          filter: m.logoFiltroSobreOscuro === "none" ? undefined : m.logoFiltroSobreOscuro,
        }}
      />
      <div
        style={{
          marginTop: 70,
          opacity: texto,
          transform: `translateY(${(1 - texto) * 30}px)`,
          fontFamily: m.fuenteManuscrita ?? m.fuente,
          fontWeight: 700,
          fontSize: 78,
          color: m.colores.acento ?? m.colores.claro,
        }}
      >
        {frase}
      </div>
      <div
        style={{
          marginTop: 36,
          opacity: texto,
          fontFamily: m.fuente,
          fontWeight: 500,
          fontSize: 44,
          letterSpacing: "0.04em",
          color: m.colores.claro,
        }}
      >
        {sitio}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Composición ----------
export const HablaSubtitulada: React.FC<HablaSubtituladaProps> = (p) => {
  const m = MARCAS[p.marca];
  const ini = inicios(p);
  const finTomas = framesTomas(p);
  const grupos = agrupar(palabrasMontadas(p));
  const bajo = dbAVolumen(p.musicaBajoVozDb);
  const alto = dbAVolumen(p.musicaCierreDb);
  return (
    <AbsoluteFill style={{ background: m.colores.oscuro }}>
      <Audio
        src={staticFile(p.musica)}
        volume={(f) => interpolate(f, [finTomas - 4, finTomas - 4 + MUSICA_SUBIDA], [bajo, alto], clamp)}
      />
      {p.tomas.map((t, i) => {
        const dura = framesToma(t, p.velocidad);
        return (
          <Sequence key={i} from={ini[i]} durationInFrames={dura} name={`${t.clip} ${t.desdeMs}-${t.hastaMs}`}>
            <TomaVideo t={t} src={`${p.carpetaVideos}/${t.clip}.mp4`} dura={dura} velocidad={p.velocidad} />
          </Sequence>
        );
      })}
      <Sequence durationInFrames={finTomas} name="logo">
        <LogoSuperior m={m} />
      </Sequence>
      {grupos.map((g, i) => (
        <Sequence
          key={i}
          from={Math.round(g.desde)}
          durationInFrames={Math.max(1, Math.round(g.hasta) - Math.round(g.desde))}
          name={g.palabras.map((w) => w.text).join(" ")}
        >
          <Subtitulo g={{ ...g, desde: Math.round(g.desde) }} m={m} />
        </Sequence>
      ))}
      {/* el cierre empieza a fundir sobre los últimos frames de la toma final */}
      <Sequence from={finTomas - CIERRE_FUNDIDO} durationInFrames={p.cierre.duracion + CIERRE_FUNDIDO} name="cierre">
        <Cierre m={m} frase={p.cierre.frase} sitio={p.cierre.sitio} />
      </Sequence>
    </AbsoluteFill>
  );
};
