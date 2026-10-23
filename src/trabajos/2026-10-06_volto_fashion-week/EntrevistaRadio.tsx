// Pieza 6 (entrevista de radio): la plantilla HablaSubtitulada + el rótulo animado "@volto.ai" en el aire
// de arriba del plano general, efectos de sonido en algunos cambios de plano y música suave que entra
// cuando él termina de hablar y sigue bajo la placa, e insertos gráficos (logos, íconos, reloj, robot,
// enumeraciones, ventanas, cifras) colgados de lo que se dice. Tiempos en segundos del clip (ms), como las tomas.
// También la usa la pieza 1 (marca de ropa), sin rótulo.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
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
import {
  TrazoBarras,
  TrazoChat,
  TrazoEmbudo,
  TrazoEnchufe,
  TrazoFlecha,
  TrazoMensajes,
  TrazoTilde,
  TrazoVentas,
} from "../../plantillas/comunes/InsertosTrazo";
import {
  ProResultados,
  ProChat,
  ProCifraViaja,
  ProEmbudo,
  ProIntegracion,
  ProLista,
  ProMensajes,
  ProPalabras,
  SalidaCtx,
  ProPalabraSola,
  ProPerfil,
  ProEtiquetas,
  ProIgual,
  ProLema,
  ProReparto,
  ProSueno,
  ProReloj8,
  ProVentas,
} from "../../plantillas/comunes/InsertosPro";
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
      sufijo?: string;
      inicial?: number;
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
        badge?: { texto: string; ms: number }; // numerito de notificaciones
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
  // Insertos "de trazo" (InsertosTrazo.tsx): dibujos de línea que se trazan con lo que se dice
  | { tipo: "trazoVentas"; perchaMs: number; graficoMs: number; techoMs: number }
  | { tipo: "trazoEmbudo"; gotasMs: number[]; nadaMs: number }
  | { tipo: "trazoMensajes"; ms: number[]; contadorMs: number }
  | { tipo: "trazoEnchufe"; enchufeMs: number; conectaMs: number }
  | {
      tipo: "trazoChat";
      clienteMs: number;
      escribeMs: number;
      respuestaMs: number;
    }
  | { tipo: "trazoTilde"; circuloMs: number; tildeMs: number }
  | {
      tipo: "trazoBarras";
      ms: number[];
      completo?: boolean;
      flechaMs?: number;
      estrellaMs?: number;
    }
  | { tipo: "trazoFlecha"; desdeFlechaMs?: number }
  // Insertos "profesionales" (InsertosPro.tsx): tarjetas de panel y vidrio
  | { tipo: "proVentas"; subeMs: number; estancadoMs: number }
  | { tipo: "proEmbudo"; ms: number[] }
  | { tipo: "proMensajes"; ms: number[] }
  | { tipo: "proIntegracion"; entraMs: number; conectaMs: number }
  | {
      tipo: "proResultados";
      subeMs: number; // la curva arranca acá
    }
  | { tipo: "proPalabras"; palabras: { texto: string; ms: number }[]; tamano?: number }
  // una sola palabra a la vez sobre el sujeto (cada una reemplaza a la anterior)
  | { tipo: "proPalabraSola"; palabras: { texto: string; ms: number }[]; tamano?: number }
  | { tipo: "proChat"; clienteMs: number; escribeMs: number; respuestaMs: number }
  | { tipo: "proPerfil"; usuario: string; nombre: string; boton: string }
  | { tipo: "proLista"; items: { texto: string; ms: number }[] }
  // lema: x, y = esquina de arriba a la izquierda
  | {
      tipo: "proLema";
      renglones: { texto: string; tamano: number; resaltado?: boolean }[];
    }
  | { tipo: "proReparto"; valor: number; etiqueta: string }
  // sueño: x, y = centro de la cara; la flecha nace en `desde`
  | { tipo: "proSueno"; desde: { x: number; y: number } }
  | { tipo: "proEtiquetas"; items: { texto: string; ms: number }[] }
  | { tipo: "proIgual"; cifra: string; texto: string; empujaMs: number }
  | {
      tipo: "proReloj8";
      feasMs: number;
      feasHastaMs: number;
      buenaMs: number;
      todasMs: number;
    }
  // la cifra crece y cuenta en el espacio vacío y sube a su lugar cuando él vuelve (viajeMs)
  | {
      tipo: "cifraViaja";
      valor: number;
      sufijo?: string;
      etiqueta: string;
      tamano: number;
      tamanoFinal: number;
      yFinal: number;
      viajeMs: number;
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
    fondoOpacidad?: number; // vidrio translúcido en vez de píldora opaca
  };
  sonidos?: (Momento & { src: string; volumen: number })[];
  musicaFinal?: Momento & { src: string; bajoVozDb: number; placaDb: number };
  insertos?: Inserto[];
  efectosDb?: number; // ajuste general de todos los efectos de sonido (rótulo incluido)
};

// Desvanecido corto al final de cada gráfico: ningún inserto desaparece de golpe en medio del plano
// (en seco se veía como un parpadeo). Termina justo en el último cuadro del inserto.
const SALIDA_INSERTO = 6; // frames
const SALIDA_INSERTO_BAJA = 10; // px que se hunde al irse
// Los de vidrio (backdrop-filter) no pueden bajar el `opacity` del contenedor: perderían el desenfoque de golpe.
// Esos reciben la visibilidad por contexto (`SalidaCtx`) y cada elemento de vidrio la aplica por su cuenta.
const TIPOS_VIDRIO = new Set<string>([
  "proVentas",
  "proEmbudo",
  "proMensajes",
  "proIntegracion",
  "proResultados",
  "proLista",
  "proChat",
  "cifraViaja",
  "proReparto",
  "proSueno",
  "proReloj8",
]);
const SalidaSuave: React.FC<{
  dura: number;
  vidrio: boolean;
  children: React.ReactNode;
}> = ({ dura, vidrio, children }) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [dura - SALIDA_INSERTO, dura - 1], [1, 0], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  return (
    <SalidaCtx.Provider value={vidrio ? k : 1}>
      <AbsoluteFill
        style={{
          opacity: vidrio ? 1 : k,
          transform: `translateY(${(1 - k) * SALIDA_INSERTO_BAJA}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </SalidaCtx.Provider>
  );
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
            sufijo={ins.sufijo}
            inicial={ins.inicial}
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
            fuente={m.fuenteTitulos ?? m.fuente}
            apps={ins.apps.map((a) => ({
              icono: ICONOS_REDES[a.icono],
              x: a.x,
              y: a.y,
              frame: rel(a.ms),
              badge: a.badge
                ? { texto: a.badge.texto, frame: rel(a.badge.ms) }
                : undefined,
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
      case "trazoVentas":
        return (
          <TrazoVentas
            perchaFrame={rel(ins.perchaMs)}
            graficoFrame={rel(ins.graficoMs)}
            techoFrame={rel(ins.techoMs)}
            {...comun}
          />
        );
      case "trazoEmbudo":
        return (
          <TrazoEmbudo
            gotasFrames={ins.gotasMs.map(rel)}
            nadaFrame={rel(ins.nadaMs)}
            {...comun}
          />
        );
      case "trazoMensajes":
        return (
          <TrazoMensajes
            m={m}
            frames={ins.ms.map(rel)}
            contadorFrame={rel(ins.contadorMs)}
            {...comun}
          />
        );
      case "trazoEnchufe":
        return (
          <TrazoEnchufe
            m={m}
            enchufeFrame={rel(ins.enchufeMs)}
            conectaFrame={rel(ins.conectaMs)}
            {...comun}
          />
        );
      case "trazoChat":
        return (
          <TrazoChat
            clienteFrame={rel(ins.clienteMs)}
            escribeFrame={rel(ins.escribeMs)}
            respuestaFrame={rel(ins.respuestaMs)}
            {...comun}
          />
        );
      case "trazoTilde":
        return (
          <TrazoTilde
            circuloFrame={rel(ins.circuloMs)}
            tildeFrame={rel(ins.tildeMs)}
            {...comun}
          />
        );
      case "trazoBarras":
        return (
          <TrazoBarras
            frames={ins.ms.map(rel)}
            completo={ins.completo}
            flechaFrame={
              ins.flechaMs === undefined ? undefined : rel(ins.flechaMs)
            }
            estrellaFrame={
              ins.estrellaMs === undefined ? undefined : rel(ins.estrellaMs)
            }
            {...comun}
          />
        );
      case "trazoFlecha":
        return (
          <TrazoFlecha
            desdeFrame={
              ins.desdeFlechaMs === undefined ? 0 : rel(ins.desdeFlechaMs)
            }
            {...comun}
          />
        );
      case "proVentas":
        return (
          <ProVentas
            m={m}
            subeFrame={rel(ins.subeMs)}
            estancadoFrame={rel(ins.estancadoMs)}
            {...comun}
          />
        );
      case "proEmbudo":
        return <ProEmbudo m={m} frames={ins.ms.map(rel)} {...comun} />;
      case "proMensajes":
        return <ProMensajes frames={ins.ms.map(rel)} {...comun} />;
      case "proIntegracion":
        return (
          <ProIntegracion
            m={m}
            entraFrame={rel(ins.entraMs)}
            conectaFrame={rel(ins.conectaMs)}
            {...comun}
          />
        );
      case "proResultados":
        return (
          <ProResultados
            subeFrame={rel(ins.subeMs)}
            {...comun}
          />
        );
      case "proPerfil":
        return (
          <ProPerfil
            m={m}
            usuario={ins.usuario}
            nombre={ins.nombre}
            boton={ins.boton}
            {...comun}
          />
        );
      case "proPalabras":
        return (
          <ProPalabras
            m={m}
            palabras={ins.palabras.map((w) => ({
              texto: w.texto,
              frame: rel(w.ms),
            }))}
            tamano={ins.tamano}
            {...comun}
          />
        );
      case "proPalabraSola":
        return (
          <ProPalabraSola
            m={m}
            palabras={ins.palabras.map((w) => ({
              texto: w.texto,
              frame: rel(w.ms),
            }))}
            tamano={ins.tamano}
            {...comun}
          />
        );
      case "proChat":
        return (
          <ProChat
            clienteFrame={rel(ins.clienteMs)}
            escribeFrame={rel(ins.escribeMs)}
            respuestaFrame={rel(ins.respuestaMs)}
            {...comun}
          />
        );
      case "proLista":
        return (
          <ProLista
            m={m}
            items={ins.items.map((it) => ({ texto: it.texto, frame: rel(it.ms) }))}
            {...comun}
          />
        );
      case "proLema":
        return <ProLema m={m} renglones={ins.renglones} {...comun} />;
      case "proReparto":
        return (
          <ProReparto m={m} valor={ins.valor} etiqueta={ins.etiqueta} {...comun} />
        );
      case "proSueno":
        return <ProSueno m={m} desde={ins.desde} {...comun} />;
      case "proEtiquetas":
        return (
          <ProEtiquetas
            m={m}
            items={ins.items.map((it) => ({ texto: it.texto, frame: rel(it.ms) }))}
            {...comun}
          />
        );
      case "proIgual":
        return (
          <ProIgual
            m={m}
            cifra={ins.cifra}
            texto={ins.texto}
            empujaFrame={rel(ins.empujaMs)}
            {...comun}
          />
        );
      case "proReloj8":
        return (
          <ProReloj8
            m={m}
            feasFrame={rel(ins.feasMs)}
            feasHastaFrame={rel(ins.feasHastaMs)}
            buenaFrame={rel(ins.buenaMs)}
            todasFrame={rel(ins.todasMs)}
            {...comun}
          />
        );
      case "cifraViaja":
        return (
          <ProCifraViaja
            m={m}
            valor={ins.valor}
            sufijo={ins.sufijo}
            etiqueta={ins.etiqueta}
            tamano={ins.tamano}
            tamanoFinal={ins.tamanoFinal}
            yFinal={ins.yFinal}
            viajeFrame={rel(ins.viajeMs)}
            {...comun}
          />
        );
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
            contenido: (
              <SalidaSuave dura={h - d} vidrio={TIPOS_VIDRIO.has(ins.tipo)}>{inserto(ins, d, h - d)}</SalidaSuave>
            ),
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
              <SalidaSuave dura={h - d} vidrio={TIPOS_VIDRIO.has(ins.tipo)}>{inserto(ins, d, h - d)}</SalidaSuave>
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
            fondoOpacidad={rotulo.fondoOpacidad}
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
