// Pieza 6 (entrevista de radio): la plantilla HablaSubtitulada + el rótulo animado "@volto.ai" en el aire
// de arriba del plano general, efectos de sonido en algunos cambios de plano y música suave que entra
// cuando él termina de hablar y sigue bajo la placa, e insertos gráficos (logos, íconos, reloj, robot,
// enumeraciones, ventanas, cifras) colgados de lo que se dice. Tiempos en segundos del clip (ms), como las tomas.
// También la usa la pieza 1 (marca de ropa), sin rótulo.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
} from "remotion";
import { MARCAS } from "../../marcas";
import { ICONOS_REDES } from "../../plantillas/comunes/iconosRedes";
import {
  InsertoApp,
  InsertoCifra,
  InsertoConexion,
  InsertoLista,
  InsertoLogo,
  InsertoMarcaTexto,
  InsertoPregunta,
  InsertoRed,
  InsertoReloj,
  InsertoRobot,
  InsertoTiendaOnline,
  InsertoVentanas,
} from "../../plantillas/comunes/Insertos";
import { RotuloUsuario } from "../../plantillas/comunes/RotuloUsuario";
import { frameDeSalida } from "../../plantillas/HablaSubtitulada/calculos";
import {
  duracionHablaSubtitulada,
  HablaSubtitulada,
  type HablaSubtituladaProps,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";

// ---------- Constantes de audio ----------
const MUSICA_ENTRADA = 18; // frames en que la música llega a su nivel bajo la voz
const MUSICA_SUBIDA = 12; // frames en que sube al empezar la placa
const ROTULO_VOLUMEN = 0.55; // sonido de entrada del rótulo (se oía poco)

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const dbAVolumen = (db: number) => Math.pow(10, db / 20);

type Momento = { clip: string; ms: number };

// Inserto gráfico: aparece en desdeMs y sale en hastaMs (del clip); x, y = centro en el cuadro 1080×1920;
// seco: sale de golpe (para que se vaya justo con un cambio de plano)
// detras: el inserto queda DETRÁS de la persona (recorte con alfa de scripts/mascaras.py, en carpetaVideos;
// su cuadro 0 = segundo recorteDesdeMs del clip que se ve)
export type Inserto = {
  clip: string;
  desdeMs: number;
  hastaMs: number;
  x: number;
  y: number;
  seco?: boolean;
  detras?: { recorte: string; recorteDesdeMs: number };
} & (
  | {
      tipo: "logo";
      src: string;
      ancho: number;
      sinTarjeta?: boolean;
      sinSombra?: boolean;
    }
  | { tipo: "app"; icono: keyof typeof ICONOS_REDES }
  | { tipo: "reloj"; texto: string; textoMs: number; diasMs: number }
  | { tipo: "robot"; tachaMs: number }
  // red: x, y = el nodo (asterisco de la marca), que entra en nodoMs; cada app entra en su ms
  | {
      tipo: "red";
      nodoMs: number;
      apps: {
        icono: keyof typeof ICONOS_REDES;
        x: number;
        y: number;
        ms: number;
      }[];
    }
  | { tipo: "ventanas"; ms: number[] } // una ventana por cada ms
  | {
      tipo: "cifra";
      valor: number;
      prefijo?: string;
      etiqueta: string;
      tamano?: number;
    }
  | { tipo: "pregunta" }
  // "En [logo]" + palabra resaltada ("resolvemos"); "En" entra en desdeMs
  | {
      tipo: "marcaTexto";
      previo: string;
      palabra: string;
      logo: string;
      logoMs: number;
      palabraMs: number;
    }
  | { tipo: "tiendaOnline" }
  // conexión: cada app entra en su ms; en centro.ms entra el ícono central y se conectan con líneas lisas
  | {
      tipo: "conexion";
      apps: {
        icono: keyof typeof ICONOS_REDES;
        x: number;
        y: number;
        ms: number;
      }[];
      centro: {
        icono: keyof typeof ICONOS_REDES;
        x: number;
        y: number;
        ms: number;
      };
    }
  | {
      tipo: "lista";
      items: { texto: string; ms: number }[];
      signo: "error" | "acierto";
      ancho: number;
    }
);

export type EntrevistaRadioProps = HablaSubtituladaProps & {
  rotulo?: {
    texto: string;
    clip: string;
    desdeMs: number;
    hastaMs: number;
    y: number;
    sonido?: string;
  };
  sonidos?: (Momento & { src: string; volumen: number })[];
  musicaFinal?: Momento & { src: string; bajoVozDb: number; placaDb: number };
  insertos?: Inserto[];
  efectosDb?: number; // ajuste general de todos los efectos de sonido (rótulo incluido)
};

export const EntrevistaRadio: React.FC<EntrevistaRadioProps> = ({
  rotulo,
  sonidos,
  musicaFinal,
  insertos,
  efectosDb = 0,
  ...p
}) => {
  const efectos = dbAVolumen(efectosDb);
  const enSalida = (m: Momento) => {
    const f = frameDeSalida(p.tomas, m.clip, m.ms, p.velocidad);
    if (f === null)
      throw new Error(`${m.clip} ${m.ms} ms cae fuera del montaje`);
    return f;
  };
  const desde = rotulo
    ? enSalida({ clip: rotulo.clip, ms: rotulo.desdeMs })
    : 0;
  const hasta = rotulo
    ? enSalida({ clip: rotulo.clip, ms: rotulo.hastaMs })
    : 0;
  const total = duracionHablaSubtitulada(p);
  const finTomas = total - (p.cierre?.duracion ?? 0);
  const musicaDesde = musicaFinal ? enSalida(musicaFinal) : 0;
  const m = MARCAS[p.marca];
  const detras = (insertos ?? []).filter((ins) => ins.detras);
  const inserto = (ins: Inserto, desdeIns: number, dura: number) => {
    const rel = (ms: number) => enSalida({ clip: ins.clip, ms }) - desdeIns;
    const comun = { x: ins.x, y: ins.y, duracion: dura, seco: ins.seco };
    switch (ins.tipo) {
      case "logo":
        return (
          <InsertoLogo
            src={ins.src}
            ancho={ins.ancho}
            sinTarjeta={ins.sinTarjeta}
            sinSombra={ins.sinSombra}
            {...comun}
          />
        );
      case "app":
        return <InsertoApp icono={ICONOS_REDES[ins.icono]} {...comun} />;
      case "reloj":
        return (
          <InsertoReloj
            m={m}
            texto={ins.texto}
            textoFrame={rel(ins.textoMs)}
            diasFrame={rel(ins.diasMs)}
            {...comun}
          />
        );
      case "red":
        return (
          <InsertoRed
            m={m}
            nodo={{ x: ins.x, y: ins.y, frame: rel(ins.nodoMs) }}
            apps={ins.apps.map((a) => ({
              icono: ICONOS_REDES[a.icono],
              x: a.x,
              y: a.y,
              frame: rel(a.ms),
            }))}
            duracion={dura}
            seco={ins.seco}
          />
        );
      case "ventanas":
        return <InsertoVentanas frames={ins.ms.map(rel)} {...comun} />;
      case "cifra":
        return (
          <InsertoCifra
            m={m}
            valor={ins.valor}
            prefijo={ins.prefijo}
            etiqueta={ins.etiqueta}
            tamano={ins.tamano}
            {...comun}
          />
        );
      case "marcaTexto":
        return (
          <InsertoMarcaTexto
            m={m}
            previo={ins.previo}
            palabra={ins.palabra}
            logo={ins.logo}
            logoFrame={rel(ins.logoMs)}
            palabraFrame={rel(ins.palabraMs)}
            {...comun}
          />
        );
      case "pregunta":
        return <InsertoPregunta m={m} {...comun} />;
      case "tiendaOnline":
        return <InsertoTiendaOnline {...comun} />;
      case "conexion":
        return (
          <InsertoConexion
            apps={ins.apps.map((a) => ({
              icono: ICONOS_REDES[a.icono],
              x: a.x,
              y: a.y,
              frame: rel(a.ms),
            }))}
            centro={{
              icono: ICONOS_REDES[ins.centro.icono],
              x: ins.centro.x,
              y: ins.centro.y,
              frame: rel(ins.centro.ms),
            }}
            duracion={dura}
            seco={ins.seco}
          />
        );
      case "robot":
        return <InsertoRobot tachaFrame={rel(ins.tachaMs)} {...comun} />;
      case "lista":
        return (
          <InsertoLista
            m={m}
            items={ins.items.map((it) => ({
              texto: it.texto,
              frame: rel(it.ms),
            }))}
            signo={ins.signo}
            ancho={ins.ancho}
            {...comun}
          />
        );
    }
  };
  return (
    <AbsoluteFill>
      <HablaSubtitulada
        {...p}
        detrasDePersona={detras.map((ins) => {
          const d = enSalida({ clip: ins.clip, ms: ins.desdeMs });
          const h = enSalida({ clip: ins.clip, ms: ins.hastaMs });
          return {
            clip: ins.clip,
            desdeMs: ins.desdeMs,
            hastaMs: ins.hastaMs,
            recorte: ins.detras!.recorte,
            recorteDesdeMs: ins.detras!.recorteDesdeMs,
            contenido: inserto(ins, d, h - d),
          };
        })}
      />
      {(insertos ?? [])
        .filter((ins) => !ins.detras)
        .map((ins, i) => {
          const d = enSalida({ clip: ins.clip, ms: ins.desdeMs });
          const h = enSalida({ clip: ins.clip, ms: ins.hastaMs });
          return (
            <Sequence
              key={`ins${i}`}
              from={d}
              durationInFrames={h - d}
              name={`inserto ${ins.tipo} ${ins.desdeMs}`}
            >
              {inserto(ins, d, h - d)}
            </Sequence>
          );
        })}
      {rotulo ? (
        <Sequence
          from={desde}
          durationInFrames={hasta - desde}
          name={`rótulo ${rotulo.texto}`}
        >
          <RotuloUsuario
            m={m}
            texto={rotulo.texto}
            duracion={hasta - desde}
            y={rotulo.y}
          />
          {rotulo.sonido ? (
            <Audio
              src={staticFile(rotulo.sonido)}
              volume={() => ROTULO_VOLUMEN * efectos}
            />
          ) : null}
        </Sequence>
      ) : null}
      {(sonidos ?? []).map((s, i) => (
        // hasta el final del video: cada sonido suena entero (antes se cortaba al segundo)
        <Sequence
          key={i}
          from={enSalida(s)}
          durationInFrames={total - enSalida(s)}
          name={`sonido ${s.ms}`}
        >
          <Audio src={staticFile(s.src)} volume={() => s.volumen * efectos} />
        </Sequence>
      ))}
      {musicaFinal ? (
        <Sequence
          from={musicaDesde}
          durationInFrames={total - musicaDesde}
          name="música del final"
        >
          <Audio
            src={staticFile(musicaFinal.src)}
            volume={(f) =>
              interpolate(
                f,
                [0, MUSICA_ENTRADA],
                [0, dbAVolumen(musicaFinal.bajoVozDb)],
                clamp,
              ) +
              interpolate(
                f,
                [
                  finTomas - musicaDesde,
                  finTomas - musicaDesde + MUSICA_SUBIDA,
                ],
                [
                  0,
                  dbAVolumen(musicaFinal.placaDb) -
                    dbAVolumen(musicaFinal.bajoVozDb),
                ],
                clamp,
              )
            }
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
