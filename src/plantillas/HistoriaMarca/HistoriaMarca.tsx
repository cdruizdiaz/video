// Plantilla "HistoriaMarca": historia vertical 9:16 de presentación de marca.
// Se alimenta con datos (escenas, textos, imágenes, música) y un kit de marca.
// Cortes directos entre escenas; dentro de cada escena los textos suben suavemente
// y las imágenes se acercan lentamente.
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
import { conAlfa, MARCAS } from "../../marcas";
import {
  Aparece,
  Capsula,
  Encabezado,
  Etiqueta,
  ImagenLenta,
  Logo,
  MarcaContext,
  Pie,
  Reveal,
  Ritmo,
  useMarca,
  useT,
} from "../comunes/piezas";
import { type Desenfoque, DesenfoqueEntrada, opcionesDe } from "../comunes/Desenfoque";

// ---------- Datos ----------
type DosLineas = [string, string];

export type EscenaPortada = {
  tipo: "portada";
  dura: number;
  foto: string;
  etiqueta: string;
  titulo: DosLineas;
  subtitulo: string;
  pie: string;
};
export type EscenaEquipo = {
  tipo: "equipo";
  dura: number;
  numero: string;
  titulo: DosLineas;
  fotos: string[]; // 4 fotos, cuadrícula 2x2
  texto: DosLineas;
  pie: string;
};
export type EscenaPieza = {
  tipo: "pieza";
  dura: number;
  numero: string;
  titulo: DosLineas;
  imagen: string;
  texto: DosLineas;
  pie: string;
  oscura?: boolean;
  inclinacion?: number; // grados con los que entra la imagen antes de enderezarse
};
export type EscenaContacto = {
  tipo: "contacto";
  dura: number;
  etiqueta: string;
  titulo: DosLineas;
  subtitulo: string;
  boton: string;
  url: string;
  usuario: string;
};
export type Escena = EscenaPortada | EscenaEquipo | EscenaPieza | EscenaContacto;

export type HistoriaMarcaProps = {
  marca: string; // id en src/marcas
  musica: string; // ruta dentro de public/
  ritmo: number; // 1 = tiempos de referencia (~30 s); < 1 acelera las apariciones
  escenas: Escena[];
  desenfoqueEntrada?: Desenfoque; // los textos entran con motion blur (Reveal y Aparece); quietos, nítidos
};

export const duracionHistoria = (p: HistoriaMarcaProps) =>
  p.escenas.reduce((total, e) => total + e.dura, 0);

// ---------- Tiempos de referencia dentro de cada escena (se escalan con "ritmo") ----------
const T_LINEA_1 = 6;
const T_LINEA_2 = 16;
const T_IMAGEN = 24;
const T_TEXTO_1 = 56;
const T_TEXTO_2 = 64;
const T_PIE = 74;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useEstilos = () => {
  const m = useMarca();
  const titulo: React.CSSProperties = {
    fontFamily: m.fuente,
    fontWeight: 600,
    letterSpacing: "-0.045em",
    lineHeight: 1,
  };
  const cuerpo: React.CSSProperties = {
    fontFamily: m.fuente,
    fontWeight: 400,
    fontSize: 46,
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
  };
  return { m, titulo, cuerpo };
};

const Titulo: React.FC<{ lineas: DosLineas; color: string }> = ({ lineas, color }) => {
  const { m, titulo } = useEstilos();
  const t = useT();
  return (
    <div style={{ position: "absolute", top: 350, left: m.margen, right: m.margen, color, fontSize: 116, ...titulo }}>
      <Reveal desde={t(T_LINEA_1)}>{lineas[0]}</Reveal>
      <Reveal desde={t(T_LINEA_2)}>{lineas[1]}</Reveal>
    </div>
  );
};

const TextoInferior: React.FC<{ lineas: DosLineas; color: string; top?: number }> = ({
  lineas,
  color,
  top = 1310,
}) => {
  const { m, cuerpo } = useEstilos();
  const t = useT();
  return (
    <div style={{ position: "absolute", top, left: m.margen, right: m.margen, color, ...cuerpo }}>
      <Reveal desde={t(T_TEXTO_1)}>{lineas[0]}</Reveal>
      <Reveal desde={t(T_TEXTO_2)}>{lineas[1]}</Reveal>
    </div>
  );
};

// ---------- Escenas ----------
const Portada: React.FC<{ e: EscenaPortada }> = ({ e }) => {
  const frame = useCurrentFrame();
  const t = useT();
  const { m, titulo, cuerpo } = useEstilos();
  const zoom = interpolate(frame, [0, e.dura], [1.12, 1], clamp);
  return (
    <AbsoluteFill style={{ background: m.colores.oscuro }}>
      <Img
        src={staticFile(e.foto)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,.05) 42%, rgba(0,0,0,.72) 78%, rgba(0,0,0,.8) 100%)",
        }}
      />
      <Encabezado claro />
      <div style={{ position: "absolute", top: 930, left: m.margen, right: m.margen, color: "#fff" }}>
        <Aparece desde={t(8)}>
          <Etiqueta color="rgba(255,255,255,.8)">{e.etiqueta}</Etiqueta>
        </Aparece>
        <div style={{ ...titulo, fontSize: 140, marginTop: 30 }}>
          <Reveal desde={t(18)}>{e.titulo[0]}</Reveal>
          <Reveal desde={t(30)}>{e.titulo[1]}</Reveal>
        </div>
        <div style={{ ...cuerpo, fontSize: 50, marginTop: 36, color: "rgba(255,255,255,.88)" }}>
          <Reveal desde={t(50)}>{e.subtitulo}</Reveal>
        </div>
      </div>
      <Pie desde={t(66)} izquierda={e.pie} derecha="" claro />
    </AbsoluteFill>
  );
};

const Equipo: React.FC<{ e: EscenaEquipo }> = ({ e }) => {
  const frame = useCurrentFrame();
  const t = useT();
  const { m } = useEstilos();
  return (
    <AbsoluteFill style={{ background: m.colores.fondo }}>
      <Encabezado numero={e.numero} />
      <Titulo lineas={e.titulo} color={m.colores.tinta} />
      <div
        style={{
          position: "absolute",
          top: 640,
          left: m.margen,
          right: m.margen,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {e.fotos.map((src, i) => {
          const desde = t(22 + i * 8);
          const p = interpolate(frame, [desde, desde + t(18)], [0, 1], clamp);
          const zoom = interpolate(frame, [desde, e.dura], [1.12, 1], clamp);
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
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "50% 30%",
                  transform: `scale(${zoom})`,
                }}
              />
            </div>
          );
        })}
      </div>
      <TextoInferior lineas={e.texto} color={m.colores.tinta} top={1300} />
      <Pie desde={t(T_PIE)} izquierda={e.pie} />
    </AbsoluteFill>
  );
};

const Pieza: React.FC<{ e: EscenaPieza }> = ({ e }) => {
  const t = useT();
  const { m } = useEstilos();
  return (
    <AbsoluteFill style={{ background: e.oscura ? m.colores.oscuro : m.colores.fondo }}>
      <Encabezado numero={e.numero} claro={e.oscura} />
      <Titulo lineas={e.titulo} color={e.oscura ? m.colores.claro : m.colores.tinta} />
      <ImagenLenta
        src={e.imagen}
        desde={t(T_IMAGEN)}
        duracionEscena={e.dura}
        top={655}
        alto={600}
        inclinacionInicial={e.inclinacion}
      />
      <TextoInferior
        lineas={e.texto}
        color={e.oscura ? conAlfa(m.colores.claro, 0.78) : m.colores.tintaSuave}
      />
      <Pie desde={t(T_PIE)} izquierda={e.pie} claro={e.oscura} />
    </AbsoluteFill>
  );
};

const Contacto: React.FC<{ e: EscenaContacto }> = ({ e }) => {
  const t = useT();
  const { m, titulo, cuerpo } = useEstilos();
  return (
    <AbsoluteFill style={{ background: m.colores.fondo }}>
      <div style={{ position: "absolute", top: 300, left: m.margen, right: m.margen, textAlign: "center" }}>
        <Aparece desde={t(6)}>
          <Etiqueta color={m.colores.tintaSuave} size={27}>
            {e.etiqueta}
          </Etiqueta>
        </Aparece>
        <div style={{ ...titulo, fontSize: 190, color: m.colores.tinta, marginTop: 44, lineHeight: 0.98 }}>
          <Reveal desde={t(20)}>{e.titulo[0]}</Reveal>
          <Reveal desde={t(32)}>{e.titulo[1]}</Reveal>
        </div>
        <div style={{ ...cuerpo, fontSize: 60, color: m.colores.tintaSuave, marginTop: 34 }}>
          <Reveal desde={t(52)}>{e.subtitulo}</Reveal>
        </div>
      </div>
      <Aparece
        desde={t(72)}
        style={{ position: "absolute", top: 985, left: 0, right: 0, display: "flex", justifyContent: "center" }}
      >
        <Logo ancho={600} />
      </Aparece>
      <div style={{ position: "absolute", top: 1220, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Capsula texto={e.boton} desde={t(92)} />
      </div>
      <Aparece
        desde={t(108)}
        style={{
          position: "absolute",
          top: 1392,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: m.fuente,
          fontWeight: 500,
          fontSize: 46,
          letterSpacing: "0.01em",
          color: m.colores.tinta,
        }}
      >
        {e.url}
      </Aparece>
      <Pie desde={t(118)} izquierda={e.usuario} />
    </AbsoluteFill>
  );
};

const RenderEscena: React.FC<{ e: Escena }> = ({ e }) => {
  switch (e.tipo) {
    case "portada":
      return <Portada e={e} />;
    case "equipo":
      return <Equipo e={e} />;
    case "pieza":
      return <Pieza e={e} />;
    case "contacto":
      return <Contacto e={e} />;
  }
};

// ---------- Composición ----------
export const HistoriaMarca: React.FC<HistoriaMarcaProps> = ({ marca, musica, ritmo, escenas, desenfoqueEntrada }) => {
  const m = MARCAS[marca];
  let desde = 0;
  return (
    <DesenfoqueEntrada.Provider value={opcionesDe(desenfoqueEntrada)}>
      <MarcaContext.Provider value={m}>
        <Ritmo.Provider value={ritmo}>
          <AbsoluteFill style={{ background: m.colores.fondo }}>
            <Audio src={staticFile(musica)} />
            {escenas.map((e, i) => {
              const inicio = desde;
              desde += e.dura;
              return (
                <Sequence key={i} from={inicio} durationInFrames={e.dura}>
                  <RenderEscena e={e} />
                </Sequence>
              );
            })}
          </AbsoluteFill>
        </Ritmo.Provider>
      </MarcaContext.Provider>
    </DesenfoqueEntrada.Provider>
  );
};
