// El reel "¿Funcionó tu newsletter?" (RASTRO, caso animaná): HablaSubtitulada + los gráficos de
// GraficosNewsletter.tsx sobre el video (debajo de los subtítulos) + la placa de cierre de RASTRO (PlacaRastro) al
// final. Como en ReelConsumos (2026-10-21_rastro_consumos-del-mes): cada gráfico se ancla a una toma y a los ms del
// clip en que se dice la palabra; dura hasta el final de su toma (sale en seco con el corte) o hasta `hastaMs`. Sus
// sonidos, también en ms del clip.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { framesTomaSalida } from "../../plantillas/HablaSubtitulada/calculos";
import {
  duracionHablaSubtitulada,
  HablaSubtitulada,
  type HablaSubtituladaProps,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import {
  DURACION_PLACA,
  PlacaRastro,
  type PlacaRastroProps,
} from "../../plantillas/PlacaRastro/PlacaRastro";
import * as G from "./GraficosNewsletter";

// ---------- Constantes ----------
const FPS = 30;

export type Grafico =
  | { tipo: "sobre"; y: number; preguntaMs: number }
  | { tipo: "pasos"; y: number; beatsMs: number[] }
  | { tipo: "placaFigma"; menosMs: number }
  | { tipo: "reporte"; y: number; marcaMs: number }
  | { tipo: "formula"; y: number; formula: "ctr" | "ctor"; cambiaMs: number }
  | { tipo: "boton"; y: number; tocaMs: number }
  | { tipo: "placaUtm"; resaltaMs: number }
  | { tipo: "analytics"; y: number; llegaMs: number; accionesMs: number[] }
  | { tipo: "usuario"; y: number };

export type Inserto = {
  toma: number;
  ms: number; // ms del clip de la toma en que entra
  hastaMs?: number; // ms del clip en que sale (si no, con el final de la toma)
  grafico: Grafico;
  sonidos: { ms: number; src: string; volumen?: number }[]; // ms del clip; volumen: × efectosVolumen
};

export type ReelNewsletterProps = HablaSubtituladaProps & {
  insertos: Inserto[];
  efectosVolumen: number;
  placa: PlacaRastroProps;
};

export const duracionReelNewsletter = (p: ReelNewsletterProps) =>
  duracionHablaSubtitulada(p) + DURACION_PLACA;

const aCuadros = (ms: number) => Math.round((ms / 1000) * FPS);

const Dibujo: React.FC<{ g: Grafico; desdeMs: number; dura: number }> = ({
  g,
  desdeMs,
  dura,
}) => {
  const rel = (ms: number) => aCuadros(ms - desdeMs);
  switch (g.tipo) {
    case "sobre":
      return <G.SobrePregunta y={g.y} pregunta={rel(g.preguntaMs)} />;
    case "pasos":
      return <G.Pasos y={g.y} beats={g.beatsMs.map(rel)} />;
    case "placaFigma":
      return <G.PlacaFigma dura={dura} menos={rel(g.menosMs)} />;
    case "reporte":
      return <G.ReporteAperturas y={g.y} marca={rel(g.marcaMs)} />;
    case "formula":
      return <G.Formula y={g.y} tipo={g.formula} cambia={rel(g.cambiaMs)} />;
    case "boton":
      return <G.BotonClic y={g.y} toca={rel(g.tocaMs)} />;
    case "placaUtm":
      return <G.PlacaUtm resalta={rel(g.resaltaMs)} />;
    case "analytics":
      return (
        <G.Analytics
          y={g.y}
          llega={rel(g.llegaMs)}
          acciones={g.accionesMs.map(rel)}
        />
      );
    case "usuario":
      return <G.Usuario y={g.y} />;
  }
};

export const ReelNewsletter: React.FC<ReelNewsletterProps> = ({
  insertos,
  efectosVolumen,
  placa,
  ...p
}) => {
  const inicios: number[] = [];
  p.tomas.reduce((acc, t) => {
    inicios.push(acc);
    return acc + framesTomaSalida(t, p.velocidad, FPS);
  }, 0);
  const enSalida = (toma: number, ms: number) =>
    inicios[toma] + aCuadros(ms - p.tomas[toma].desdeMs);
  const capa = (
    <AbsoluteFill>
      {insertos.map((ins, i) => {
        const desde = enSalida(ins.toma, ins.ms);
        const fin =
          ins.hastaMs !== undefined
            ? enSalida(ins.toma, ins.hastaMs)
            : inicios[ins.toma] +
              framesTomaSalida(p.tomas[ins.toma], p.velocidad, FPS);
        const dura = Math.max(1, fin - desde);
        return (
          <Sequence
            key={i}
            from={desde}
            durationInFrames={dura}
            name={ins.grafico.tipo}
          >
            <Dibujo g={ins.grafico} desdeMs={ins.ms} dura={dura} />
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
  return (
    <AbsoluteFill>
      <HablaSubtitulada {...p} sobreVideo={capa} />
      {/* placa de cierre de RASTRO (2026-10-23_rastro_placa-cierre), por corte después de la última frase */}
      <Sequence
        from={duracionHablaSubtitulada(p)}
        durationInFrames={DURACION_PLACA}
        name="placa RASTRO"
      >
        <PlacaRastro {...placa} />
      </Sequence>
    </AbsoluteFill>
  );
};
