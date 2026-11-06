// Plantilla "ReelCtpsfpc": reel de persona hablando para el CTPSFPC (Colegio de Traductores de Santa Fe, 1.ª Circ.).
// HablaSubtitulada sin logo arriba ni zoom (como los reels que se vienen publicando, "Reel idóneo.mov") con los
// subtítulos del cliente (Be Vietnam Pro SemiBold blanco, sombra negra difusa al 25 %) + la placa final animada
// PlacaCtpsfpc entrando por corte después de la última toma. La música (si hay) sigue bajo la placa y sube.
// Gráficos, a elección por reel: placas de explicación a pantalla completa (`explicaciones`) o símbolos sobre el video
// con la persona siempre a la vista (`simbolos`: números e íconos en el aire alrededor de ella).
// Criterios del cliente: src/marcas/ctpsfpc/CRITERIOS.md
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  duracionHablaSubtitulada,
  HablaSubtitulada,
  type HablaSubtituladaProps,
} from "../HablaSubtitulada/HablaSubtitulada";
import { frameDeSalida } from "../HablaSubtitulada/calculos";
import { PlacaCtpsfpc } from "./PlacaCtpsfpc";
import { type Modulo, PlacaExplicacion } from "./PlacaExplicacion";
import { type Simbolo, SimboloVideo } from "./SimbolosVideo";

// Placa de explicación a pantalla completa sobre una toma (la voz y los subtítulos siguen). Va como datos y el JSX se
// arma acá: las props de la composición se serializan y un elemento de React no sobrevive.
export type Explicacion = {
  clip: string; // la toma sobre la que va (dura hasta su final)
  desdeMs: number; // ms del clip en que entra
  hastaClip?: string; // si sigue en otra toma (contigua): dura hasta el final de la toma de ese clip
  numero: string;
  titulo: string;
  bajada: string;
  modulos: (Omit<Modulo, "entra"> & { ms: number; clip?: string })[]; // ms del clip (por defecto `clip`) en que entra
};

// Símbolo sobre una toma: entra en `ms` del clip y queda hasta `hastaMs` (si no, hasta el final de la toma)
export type SimboloEnToma = Simbolo & {
  clip: string;
  ms: number;
  hastaMs?: number;
  sinEntrada?: boolean; // ya venía de la toma anterior: aparece quieto
};

export type ReelCtpsfpcProps = HablaSubtituladaProps & {
  placa: number; // duración de la placa final en frames (0: sin placa)
  sitio?: string; // web debajo del logo en la placa
  explicaciones?: Explicacion[];
  simbolos?: SimboloEnToma[];
};

export const duracionReelCtpsfpc = (p: ReelCtpsfpcProps) =>
  duracionHablaSubtitulada(p) + p.placa;

export const ReelCtpsfpc: React.FC<ReelCtpsfpcProps> = (p) => {
  const finTomas = duracionHablaSubtitulada(p);
  const salida = (clip: string, ms: number) => frameDeSalida(p.tomas, clip, ms, p.velocidad) ?? 0;
  const placas = (p.explicaciones ?? []).map((e) => {
    const fin = e.hastaClip ?? e.clip;
    const toma = p.tomas.find((t) => t.clip === fin);
    if (!toma) throw new Error(`Explicación sobre ${fin}: no hay toma de ese clip`);
    const desde = salida(e.clip, e.desdeMs);
    const hasta = salida(fin, toma.hastaMs - 10) + 1;
    return { e, desde, hasta };
  });
  const simbolos = (p.simbolos ?? []).map((s) => {
    const toma = p.tomas.find((t) => t.clip === s.clip);
    if (!toma) throw new Error(`Símbolo sobre ${s.clip}: no hay toma de ese clip`);
    const desde = salida(s.clip, Math.max(s.ms, toma.desdeMs));
    const hasta = salida(s.clip, Math.min(s.hastaMs ?? Infinity, toma.hastaMs - 10)) + 1;
    return { s, desde, hasta, saleAntes: s.hastaMs !== undefined && s.hastaMs < toma.hastaMs - 10 };
  });
  return (
    <AbsoluteFill>
      <HablaSubtitulada
        {...p}
        sobreVideo={[
          ...simbolos.map(({ s, desde, hasta, saleAntes }, i) => (
            <Sequence key={`s${i}`} from={desde} durationInFrames={hasta - desde} name={`símbolo ${s.clip} ${s.ms}`}>
              <SimboloVideo s={s} duracion={hasta - desde} sinEntrada={s.sinEntrada} saleAntes={saleAntes} fase={i * 17} />
            </Sequence>
          )),
          ...placas.map(({ e, desde, hasta }) => (
          <Sequence key={e.numero} from={desde} durationInFrames={hasta - desde} name={`explicación ${e.numero}`}>
            <PlacaExplicacion
              numero={e.numero}
              titulo={e.titulo}
              bajada={e.bajada}
              modulos={e.modulos.map(({ ms, clip, ...m }) => ({
                ...m,
                entra: salida(clip ?? e.clip, ms) - desde,
              }))}
            />
          </Sequence>
          )),
        ]}
      />
      {p.placa ? (
        <Sequence from={finTomas} durationInFrames={p.placa} name="placa CTPSFPC">
          <PlacaCtpsfpc duracion={p.placa} sitio={p.sitio} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
