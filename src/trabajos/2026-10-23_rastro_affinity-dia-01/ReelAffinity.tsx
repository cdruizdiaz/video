// "Día 1/20 probando Affinity" (RASTRO, video orgánico): HablaSubtitulada + insertos de las grabaciones de pantalla y
// gráficos de GraficosAffinity.tsx sobre el video (debajo de los subtítulos) + la etiqueta de la serie + la placa de
// cierre de RASTRO. Como ReelNewsletter (2026-10-23_rastro_newsletter-animana): cada inserto se ancla a una toma y a
// los ms del clip; dura hasta el final de su toma o hasta `hastaMs`.
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
import * as G from "./GraficosAffinity";

// ---------- Constantes ----------
const FPS = 30;

export type Grafico =
  | { tipo: "pantalla"; tramos: G.TramoPantalla[] }
  | { tipo: "pildoras"; y: number; textos: string[]; beatsMs: number[] };

export type Inserto = {
  toma: number;
  ms: number; // ms del clip de la toma en que entra
  hastaMs?: number; // ms del clip en que sale (si no, con el final de la toma)
  hastaToma?: number; // sigue hasta el final de esta toma (contigua en el montaje)
  grafico: Grafico;
  sonidos: { ms: number; src: string; volumen?: number }[];
};

export type ReelAffinityProps = HablaSubtituladaProps & {
  insertos: Inserto[];
  efectosVolumen: number;
  placa: PlacaRastroProps;
};

export const duracionReelAffinity = (p: ReelAffinityProps) =>
  duracionHablaSubtitulada(p) + DURACION_PLACA;

const aCuadros = (ms: number) => Math.round((ms / 1000) * FPS);

const Dibujo: React.FC<{ g: Grafico; desdeMs: number; dura: number }> = ({
  g,
  desdeMs,
  dura,
}) => {
  switch (g.tipo) {
    case "pantalla":
      return <G.Pantalla tramos={g.tramos} dura={dura} />;
    case "pildoras":
      return (
        <G.Pildoras
          y={g.y}
          textos={g.textos}
          beats={g.beatsMs.map((ms) => aCuadros(ms - desdeMs))}
        />
      );
  }
};

export const ReelAffinity: React.FC<ReelAffinityProps> = ({
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
  const finToma = (toma: number) =>
    inicios[toma] + framesTomaSalida(p.tomas[toma], p.velocidad, FPS);
  const enSalida = (toma: number, ms: number) =>
    inicios[toma] + aCuadros(ms - p.tomas[toma].desdeMs);
  const total = duracionHablaSubtitulada(p);
  const capa = (
    <AbsoluteFill>
      {insertos.map((ins, i) => {
        const desde = enSalida(ins.toma, ins.ms);
        const fin =
          ins.hastaMs !== undefined
            ? enSalida(ins.toma, ins.hastaMs)
            : finToma(ins.hastaToma ?? ins.toma);
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
      <Sequence durationInFrames={total} name="serie">
        <G.Serie />
      </Sequence>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <HablaSubtitulada {...p} sobreVideo={capa} />
      <Sequence
        from={total}
        durationInFrames={DURACION_PLACA}
        name="placa RASTRO"
      >
        <PlacaRastro {...placa} />
      </Sequence>
    </AbsoluteFill>
  );
};
