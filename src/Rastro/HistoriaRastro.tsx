import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  Aparece,
  Capsula,
  Encabezado,
  Etiqueta,
  ImagenLenta,
  Logo,
  Pie,
  Reveal,
  Ritmo,
  useT,
} from "./piezas";
import { INTER, MARGEN, OSCURO, PAPEL, TINTA, TINTA_SUAVE } from "./tema";

// ---- Versiones (frames a 30 fps). Cortes directos entre escenas. ----
// Los tiempos internos de cada escena están escritos para la versión de 30 s
// y se escalan con "ritmo" en la de 15 s.
type Escena = { desde: number; dura: number };
type Version = {
  ritmo: number;
  musica: string;
  escenas: Record<
    "marca" | "equipo" | "contenido" | "identidad" | "estrategia" | "contacto",
    Escena
  >;
};

export const VERSIONES: Record<"30s" | "15s", Version> = {
  "30s": {
    ritmo: 1,
    musica: "audio/musica/rastro-base.wav",
    escenas: {
      marca: { desde: 0, dura: 120 }, // 00:00–00:04
      equipo: { desde: 120, dura: 120 }, // 00:04–00:08
      contenido: { desde: 240, dura: 150 }, // 00:08–00:13
      identidad: { desde: 390, dura: 150 }, // 00:13–00:18
      estrategia: { desde: 540, dura: 150 }, // 00:18–00:23
      contacto: { desde: 690, dura: 210 }, // 00:23–00:30
    },
  },
  "15s": {
    ritmo: 0.45,
    musica: "audio/musica/rastro-base-15s.wav",
    escenas: {
      marca: { desde: 0, dura: 75 }, // 00:00–00:02,5
      equipo: { desde: 75, dura: 75 }, // 00:02,5–00:05
      contenido: { desde: 150, dura: 60 }, // 00:05–00:07
      identidad: { desde: 210, dura: 60 }, // 00:07–00:09
      estrategia: { desde: 270, dura: 60 }, // 00:09–00:11
      contacto: { desde: 330, dura: 120 }, // 00:11–00:15
    },
  },
};

export const duracionVersion = (v: keyof typeof VERSIONES) =>
  VERSIONES[v].escenas.contacto.desde + VERSIONES[v].escenas.contacto.dura;

// Escalonado de aparición dentro de cada escena (ritmo de la versión de 30 s)
const T_LINEA_1 = 6;
const T_LINEA_2 = 16;
const T_IMAGEN = 24;
const T_TEXTO_1 = 56;
const T_TEXTO_2 = 64;
const T_PIE = 74;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const TITULO: React.CSSProperties = {
  fontFamily: INTER,
  fontWeight: 600,
  letterSpacing: "-0.045em",
  lineHeight: 1,
};

const CUERPO: React.CSSProperties = {
  fontFamily: INTER,
  fontWeight: 400,
  fontSize: 46,
  lineHeight: 1.3,
  letterSpacing: "-0.01em",
};

const Titulo: React.FC<{ lineas: [string, string]; color: string; size?: number }> = ({
  lineas,
  color,
  size = 116,
}) => {
  const t = useT();
  return (
    <div style={{ position: "absolute", top: 350, left: MARGEN, right: MARGEN, color, fontSize: size, ...TITULO }}>
      <Reveal desde={t(T_LINEA_1)}>{lineas[0]}</Reveal>
      <Reveal desde={t(T_LINEA_2)}>{lineas[1]}</Reveal>
    </div>
  );
};

const TextoInferior: React.FC<{ lineas: [string, string]; color: string; top?: number }> = ({
  lineas,
  color,
  top = 1310,
}) => {
  const t = useT();
  return (
    <div style={{ position: "absolute", top, left: MARGEN, right: MARGEN, color, ...CUERPO }}>
      <Reveal desde={t(T_TEXTO_1)}>{lineas[0]}</Reveal>
      <Reveal desde={t(T_TEXTO_2)}>{lineas[1]}</Reveal>
    </div>
  );
};

// ---------------- Escena 1 — Presentación de la marca ----------------
const EscenaMarca: React.FC<{ dura: number }> = ({ dura }) => {
  const frame = useCurrentFrame();
  const t = useT();
  const zoom = interpolate(frame, [0, dura], [1.12, 1], clamp);
  return (
    <AbsoluteFill style={{ background: OSCURO }}>
      <Img
        src={staticFile("img/rastro/7VqCsB7LDPBzdeefnQBtSRxm6a8.jpg")}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,.05) 42%, rgba(0,0,0,.72) 78%, rgba(0,0,0,.8) 100%)",
        }}
      />
      <Encabezado claro />
      <div style={{ position: "absolute", top: 930, left: MARGEN, right: MARGEN, color: "#fff" }}>
        <Aparece desde={t(8)}>
          <Etiqueta color="rgba(255,255,255,.8)">Somos Rastro</Etiqueta>
        </Aparece>
        <div style={{ ...TITULO, fontSize: 140, marginTop: 30 }}>
          <Reveal desde={t(18)}>Menos ruido.</Reveal>
          <Reveal desde={t(30)}>Más historias.</Reveal>
        </div>
        <div style={{ ...CUERPO, fontSize: 50, marginTop: 36, color: "rgba(255,255,255,.88)" }}>
          <Reveal desde={t(50)}>Comunicación que deja marca.</Reveal>
        </div>
      </div>
      <Pie desde={t(66)} izquierda="Diseño · Contenido · Estrategia" derecha="" claro />
    </AbsoluteFill>
  );
};

// ---------------- Escena 2 — El equipo ----------------
const FOTOS_EQUIPO = [
  "img/rastro/equipo-lula.jpg",
  "img/rastro/equipo-pau.jpg",
  "img/rastro/equipo-sere.jpg",
  "img/rastro/equipo-luco.jpg",
];

const EscenaEquipo: React.FC<{ dura: number }> = ({ dura }) => {
  const frame = useCurrentFrame();
  const t = useT();
  return (
    <AbsoluteFill style={{ background: PAPEL }}>
      <Encabezado numero="01" />
      <Titulo lineas={["Un equipo.", "Muchas miradas."]} color={TINTA} />
      <div
        style={{
          position: "absolute",
          top: 640,
          left: MARGEN,
          right: MARGEN,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {FOTOS_EQUIPO.map((src, i) => {
          const desde = t(22 + i * 8);
          const p = interpolate(frame, [desde, desde + t(18)], [0, 1], clamp);
          const zoom = interpolate(frame, [desde, dura], [1.12, 1], clamp);
          return (
            <div
              key={src}
              style={{
                height: 310,
                borderRadius: 6,
                overflow: "hidden",
                opacity: p,
                transform: `translateY(${(1 - p) * 40}px)`,
              }}
            >
              <Img
                src={staticFile(src)}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", transform: `scale(${zoom})` }}
              />
            </div>
          );
        })}
      </div>
      <TextoInferior
        lineas={["Creatividad y tecnología para", "marcas y proyectos de Argentina."]}
        color={TINTA}
        top={1300}
      />
      <Pie desde={t(T_PIE)} izquierda="Lo pensamos juntas" />
    </AbsoluteFill>
  );
};

// ---------------- Escenas 3, 4 y 5 — Servicios con pieza del sitio ----------------
const EscenaServicio: React.FC<{
  numero: string;
  titulo: [string, string];
  imagen: string;
  texto: [string, string];
  pie: string;
  duracion: number;
  oscura?: boolean;
  inclinacion?: number;
}> = ({ numero, titulo, imagen, texto, pie, duracion, oscura, inclinacion }) => {
  const t = useT();
  const tinta = oscura ? PAPEL : TINTA;
  return (
    <AbsoluteFill style={{ background: oscura ? OSCURO : PAPEL }}>
      <Encabezado numero={numero} claro={oscura} />
      <Titulo lineas={titulo} color={tinta} />
      <ImagenLenta
        src={imagen}
        desde={t(T_IMAGEN)}
        duracionEscena={duracion}
        top={655}
        alto={600}
        inclinacionInicial={inclinacion}
      />
      <TextoInferior lineas={texto} color={oscura ? "rgba(247,244,234,.78)" : TINTA_SUAVE} />
      <Pie desde={t(T_PIE)} izquierda={pie} claro={oscura} />
    </AbsoluteFill>
  );
};

// ---------------- Escena 6 — Invitación a contactar ----------------
const EscenaContacto: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: PAPEL }}>
      <div style={{ position: "absolute", top: 300, left: MARGEN, right: MARGEN, textAlign: "center" }}>
        <Aparece desde={t(6)}>
          <Etiqueta color={TINTA_SUAVE} size={27}>
            Tu próxima historia empieza acá.
          </Etiqueta>
        </Aparece>
        <div style={{ ...TITULO, fontSize: 190, color: TINTA, marginTop: 44, lineHeight: 0.98 }}>
          <Reveal desde={t(20)}>¿Tenés</Reveal>
          <Reveal desde={t(32)}>una idea?</Reveal>
        </div>
        <div style={{ ...CUERPO, fontSize: 60, color: TINTA_SUAVE, marginTop: 34 }}>
          <Reveal desde={t(52)}>Dejemos rastro.</Reveal>
        </div>
      </div>
      <Aparece desde={t(72)} style={{ position: "absolute", top: 985, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Logo ancho={600} />
      </Aparece>
      <div style={{ position: "absolute", top: 1220, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Capsula texto="HABLEMOS" desde={t(92)} />
      </div>
      <Aparece
        desde={t(108)}
        style={{
          position: "absolute",
          top: 1392,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: INTER,
          fontWeight: 500,
          fontSize: 46,
          letterSpacing: "0.01em",
          color: TINTA,
        }}
      >
        somosrastro.com.ar
      </Aparece>
      <Pie desde={t(118)} izquierda="@somos_rastro" />
    </AbsoluteFill>
  );
};

export const HistoriaRastro: React.FC<{ version: keyof typeof VERSIONES }> = ({ version }) => {
  const { ritmo, musica, escenas: e } = VERSIONES[version];
  return (
    <Ritmo.Provider value={ritmo}>
      <AbsoluteFill style={{ background: PAPEL }}>
        <Audio src={staticFile(musica)} />
        <Sequence from={e.marca.desde} durationInFrames={e.marca.dura}>
          <EscenaMarca dura={e.marca.dura} />
        </Sequence>
        <Sequence from={e.equipo.desde} durationInFrames={e.equipo.dura}>
          <EscenaEquipo dura={e.equipo.dura} />
        </Sequence>
        <Sequence from={e.contenido.desde} durationInFrames={e.contenido.dura}>
          <EscenaServicio
            numero="02"
            titulo={["Tu marca,", "en movimiento."]}
            imagen="img/rastro/servicio-01.png"
            texto={["Reels y carruseles.", "Manejo de redes sociales."]}
            pie="Contenido con identidad"
            duracion={e.contenido.dura}
          />
        </Sequence>
        <Sequence from={e.identidad.desde} durationInFrames={e.identidad.dura}>
          <EscenaServicio
            numero="03"
            titulo={["Una identidad", "que se reconoce."]}
            imagen="img/rastro/servicio-04.png"
            texto={["Branding · Marca personal", "Diseño gráfico"]}
            pie="Tu esencia, en cada detalle"
            duracion={e.identidad.dura}
            inclinacion={-7}
          />
        </Sequence>
        <Sequence from={e.estrategia.desde} durationInFrames={e.estrategia.dura}>
          <EscenaServicio
            numero="04"
            titulo={["Cada palabra.", "Con intención."]}
            imagen="img/rastro/servicio-06.png"
            texto={["Estrategia de contenido", "Copywriting · Newsletter"]}
            pie="Historias que conectan"
            duracion={e.estrategia.dura}
            oscura
          />
        </Sequence>
        <Sequence from={e.contacto.desde} durationInFrames={e.contacto.dura}>
          <EscenaContacto />
        </Sequence>
      </AbsoluteFill>
    </Ritmo.Provider>
  );
};
