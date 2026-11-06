// El reel "Consumos del mes": HablaSubtitulada + los gráficos de GraficosConsumos.tsx sobre el video (debajo de los
// subtítulos). Cada gráfico se ancla a una toma y a los ms del clip en que se dice la palabra; dura hasta el final de
// su toma (sale en seco con el corte) o hasta `hastaMs`. Sus sonidos, también en ms del clip.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { framesTomaSalida } from "../../plantillas/HablaSubtitulada/calculos";
import {
  HablaSubtitulada,
  type HablaSubtituladaProps,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import * as G from "./GraficosConsumos";

// ---------- Constantes ----------
const FPS = 30;

export type Grafico =
  | { tipo: "iconos"; y: number; paso: number; escala: number }
  | { tipo: "stickerGuilty" | "posterAHS" | "fotoEvan"; y: number }
  | { tipo: "etiquetasAHS"; y: number; beatsMs: number[] }
  | { tipo: "noTeCases"; y: number; cada: number }
  | { tipo: "factoria"; y: number }
  | { tipo: "ventanaDiseno"; y: number; escala: number }
  | { tipo: "discoLali" | "comentario"; y: number };

export type Inserto = {
  toma: number;
  ms: number; // ms del clip de la toma en que entra
  hastaMs?: number; // ms del clip en que sale (si no, con el final de la toma)
  grafico: Grafico;
  sonidos: { ms: number; src: string; volumen?: number }[]; // ms del clip; volumen: × efectosVolumen
};

// personaje que asoma DETRÁS de la persona (CapaDetras de HablaSubtitulada). Va como datos y el JSX se arma acá:
// las props de la composición se serializan y un elemento de React no sobrevive (error #31 al renderizar)
export type Asoma = {
  clip: string;
  desdeMs: number;
  hastaMs: number;
  recorte: string; // en carpetaVideos (scripts/mascaras.py)
  recorteDesdeMs: number;
  desde: { x: number; y: number };
  hasta: { x: number; y: number };
  escondeMs: number; // ms del clip en que vuelve detrás
  sonido?: string; // suena al empezar a asomar
};

export type ReelConsumosProps = HablaSubtituladaProps & {
  insertos: Inserto[];
  efectosVolumen: number;
  asoma?: Asoma;
};

const aCuadros = (ms: number) => Math.round((ms / 1000) * FPS);

const Dibujo: React.FC<{ g: Grafico; desdeMs: number }> = ({ g, desdeMs }) => {
  const rel = (ms: number) => aCuadros(ms - desdeMs);
  switch (g.tipo) {
    case "iconos":
      return <G.IconosConsumo y={g.y} paso={g.paso} escala={g.escala} />;
    case "stickerGuilty":
      return <G.StickerGuilty y={g.y} />;
    case "posterAHS":
      return <G.PosterAHS y={g.y} />;
    case "fotoEvan":
      return <G.FotoEvan y={g.y} />;
    case "etiquetasAHS":
      return <G.EtiquetasAHS y={g.y} beats={g.beatsMs.map(rel)} />;
    case "noTeCases":
      return <G.NoTeCases y={g.y} cada={g.cada} />;
    case "factoria":
      return <G.Factoria y={g.y} />;
    case "ventanaDiseno":
      return <G.VentanaDiseno y={g.y} escala={g.escala} />;
    case "discoLali":
      return <G.DiscoLali y={g.y} />;
    case "comentario":
      return <G.Comentario y={g.y} />;
  }
};

export const ReelConsumos: React.FC<ReelConsumosProps> = ({
  insertos,
  efectosVolumen,
  asoma,
  ...p
}) => {
  const inicios: number[] = [];
  p.tomas.reduce((acc, t) => {
    inicios.push(acc);
    return acc + framesTomaSalida(t, p.velocidad, FPS);
  }, 0);
  const enSalida = (toma: number, ms: number) =>
    inicios[toma] + aCuadros(ms - p.tomas[toma].desdeMs);
  const tomaAsoma = asoma
    ? p.tomas.findIndex((t) => t.clip === asoma.clip)
    : -1;
  const capa = (
    <AbsoluteFill>
      {asoma?.sonido && tomaAsoma >= 0 ? (
        <Sequence from={enSalida(tomaAsoma, asoma.desdeMs)} name="sonido asoma">
          <Audio src={staticFile(asoma.sonido)} volume={() => efectosVolumen} />
        </Sequence>
      ) : null}
      {insertos.map((ins, i) => {
        const desde = enSalida(ins.toma, ins.ms);
        const fin =
          ins.hastaMs !== undefined
            ? enSalida(ins.toma, ins.hastaMs)
            : inicios[ins.toma] +
              framesTomaSalida(p.tomas[ins.toma], p.velocidad, FPS);
        return (
          <Sequence
            key={i}
            from={desde}
            durationInFrames={Math.max(1, fin - desde)}
            name={ins.grafico.tipo}
          >
            <Dibujo g={ins.grafico} desdeMs={ins.ms} />
          </Sequence>
        );
      })}
      {insertos.flatMap((ins, i) =>
        ins.sonidos.map((s, k) => (
          <Sequence
            key={`s${i}-${k}`}
            from={enSalida(ins.toma, s.ms)}
            name={`sonido ${s.src}`}
          >
            <Audio
              src={staticFile(s.src)}
              volume={() => efectosVolumen * (s.volumen ?? 1)}
            />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
  const detras = asoma
    ? [
        {
          clip: asoma.clip,
          desdeMs: asoma.desdeMs,
          hastaMs: asoma.hastaMs,
          recorte: asoma.recorte,
          recorteDesdeMs: asoma.recorteDesdeMs,
          contenido: (
            <G.PauAsoma
              desde={asoma.desde}
              hasta={asoma.hasta}
              escondeEn={aCuadros(asoma.escondeMs - asoma.desdeMs)}
            />
          ),
        },
      ]
    : p.detrasDePersona;
  return <HablaSubtitulada {...p} detrasDePersona={detras} sobreVideo={capa} />;
};
