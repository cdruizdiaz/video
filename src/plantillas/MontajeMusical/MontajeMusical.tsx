// Plantilla "MontajeMusical": reel vertical armado con fragmentos de videos donde la gente toca y canta.
// No usa kit de marca (sirve para videos familiares/personales). Dos apariencias para los textos:
// "sticker" (cápsulas de color, Fredoka, notas grandes) y "sutil" (texto blanco fino en Poppins, notas
// chicas y translúcidas).
// Hace:
//  - cada toma reencuadrada sobre las personas (encuadre calculado con MediaPipe: zoom fijo por toma
//    y centro que sigue a las caras), con un golpe de zoom al entrar y un acercamiento lento;
//  - el audio original de cada fragmento, con fundido cruzado corto entre tomas y ganancia por toma;
//  - destello + whoosh suave en cada corte;
//  - título de apertura, etiqueta del año de cada toma, notas musicales flotando y frase de cierre.
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ALTO,
  ANCHO,
  CRUCE_AUDIO,
  dbAVolumen,
  duracionMontajeMusical,
  encuadreEn,
  frameDesde,
  framesTomaMusical,
  FUNDIDO_FINAL,
  iniciosTomas,
  WHOOSH_ANTES,
  WHOOSH_DB,
  WHOOSH_DURA,
  type TomaMusical,
} from "./calculos";

const { fontFamily: FREDOKA } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
const { fontFamily: POPPINS } = loadPoppins("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

// ---------- Constantes de animación ----------
// (las de montaje y encuadre están en calculos.ts, compartidas con la exportación a Premiere)
const DESTELLO_FRAMES = 6;
const DESTELLO_ALFA = 0.55;
const ETIQUETA_ENTRA = 5; // frames después del corte en que aparece la etiqueta del año
const ETIQUETA_Y = 250;
const TITULO_DURA = 78; // frames del título de apertura
const TITULO_Y = 1280;
const CIERRE_Y = 1270;
const NOTAS_CICLO = 70; // frames que tarda cada nota en subir y desvanecerse
const NOTAS_TAMANO = 92;
// apariencia "sutil": texto blanco fino, sin cápsulas; notas chicas y translúcidas
const SUTIL_SOMBRA = "0 2px 18px rgba(0,0,0,0.45)";
const SUTIL_SOMBRA_FUERTE =
  "0 1px 3px rgba(0,0,0,0.6), 0 2px 16px rgba(0,0,0,0.55)"; // textos chicos sobre fondos claros
const SUTIL_VELO_ABAJO =
  "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.28) 30%, rgba(0,0,0,0) 55%)";
const SUTIL_VELO_ARRIBA =
  "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 22%)";
const SUTIL_SUBE = 18; // px que sube el texto al aparecer
const SUTIL_ENTRA = 14; // frames de fundido de entrada
const SUTIL_NOTAS_CICLO = 100;
const SUTIL_NOTAS_TAMANO = 68;
const SUTIL_NOTAS_ALFA = 0.6;
const SUTIL_NOTAS_RECORRIDO: [number, number] = [1540, 1060]; // y de salida y de llegada
const SUTIL_NOTAS_VAIVEN = 16; // px de balanceo lateral
const SUTIL_NOTAS_GIRO = 10; // grados de balanceo

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const salida = Easing.out(Easing.cubic);

// ---------- Datos ----------
export type { PuntoEncuadre, TomaMusical } from "./calculos";
export { duracionMontajeMusical, framesTomaMusical } from "./calculos";

export type EstiloMontaje = {
  primario: string; // relleno de stickers
  secundario: string; // segundo color de stickers
  tinta: string; // texto y borde de stickers
  claro: string;
};

export type MontajeMusicalProps = {
  carpetaVideos: string;
  tomas: TomaMusical[];
  titulo: [string, string]; // dos renglones de la apertura
  cierre: { texto: string; subtexto?: string; duracion: number }; // duracion en frames, sobre la última toma
  filtroVideo?: string; // filtro CSS sobre el video, p. ej. "brightness(1.2)" para material a contraluz
  whoosh?: string; // efecto en cada corte (dentro de public/)
  whooshDb?: number;
  estilo: EstiloMontaje;
  apariencia?: "sticker" | "sutil"; // por defecto "sticker"
  soloGraficos?: boolean; // sin video ni audio y con fondo transparente: capa de gráficos para Premiere
};

// ---------- Piezas ----------
const TomaVideo: React.FC<{
  t: TomaMusical;
  src: string;
  dura: number;
  filtro?: string;
}> = ({ t, src, dura, filtro }) => {
  const frame = useCurrentFrame();
  const { z, izq, arriba } = encuadreEn(t, frame, dura);
  const ancho = t.anchoFuente ?? ANCHO;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        trimBefore={frameDesde(t)}
        muted
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: ancho,
          height: ALTO,
          maxWidth: "none",
          objectFit: "cover",
          filter: filtro,
          transformOrigin: "0 0",
          transform: `translate(${-izq * ancho * z}px, ${-arriba * ALTO * z}px) scale(${z})`,
        }}
      />
    </AbsoluteFill>
  );
};

// Audio de una toma, con colas para el fundido cruzado con la anterior y la siguiente
const AudioToma: React.FC<{
  src: string;
  desdeFrame: number;
  dura: number;
  ganancia: number;
  entra: number;
  sale: number;
}> = ({ src, desdeFrame, dura, ganancia, entra, sale }) => (
  <Audio
    src={staticFile(src)}
    trimBefore={desdeFrame}
    volume={(f) =>
      ganancia *
      (entra ? interpolate(f, [0, entra], [0, 1], clamp) : 1) *
      interpolate(f, [dura - sale, dura], [1, 0], clamp)
    }
  />
);

const Destello: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [0, DESTELLO_FRAMES], [DESTELLO_ALFA, 0], clamp);
  return <AbsoluteFill style={{ background: color, opacity: a }} />;
};

// Rótulo tipo sticker: fondo de color, borde y sombra dura, un poco girado
const Sticker: React.FC<{
  texto: string;
  fondo: string;
  e: EstiloMontaje;
  tamano: number;
  giro: number;
  escala: number;
  style?: React.CSSProperties;
}> = ({ texto, fondo, e, tamano, giro, escala, style }) => (
  <div
    style={{
      display: "inline-block",
      padding: `${tamano * 0.14}px ${tamano * 0.4}px ${tamano * 0.18}px`,
      background: fondo,
      color: e.tinta,
      border: `${Math.round(tamano * 0.07)}px solid ${e.tinta}`,
      borderRadius: tamano * 0.32,
      boxShadow: `${tamano * 0.09}px ${tamano * 0.11}px 0 ${e.tinta}`,
      fontFamily: FREDOKA,
      fontWeight: 700,
      fontSize: tamano,
      lineHeight: 1,
      whiteSpace: "nowrap",
      transform: `rotate(${giro}deg) scale(${escala})`,
      ...style,
    }}
  >
    {texto}
  </div>
);

const usePop = (desde: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - desde,
    fps,
    config: { damping: 9, stiffness: 180, mass: 0.6 },
  });
};

const Titulo: React.FC<{ renglones: [string, string]; e: EstiloMontaje }> = ({
  renglones,
  e,
}) => {
  const frame = useCurrentFrame();
  const a = usePop(4);
  const b = usePop(11);
  const sale = interpolate(frame, [TITULO_DURA - 10, TITULO_DURA], [1, 0], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", top: TITULO_Y - 160 }}>
      <Sticker
        texto={renglones[0]}
        fondo={e.primario}
        e={e}
        tamano={130}
        giro={-5}
        escala={a * sale}
      />
      <Sticker
        texto={renglones[1]}
        fondo={e.secundario}
        e={e}
        tamano={104}
        giro={3}
        escala={b * sale}
        style={{ marginTop: 26 }}
      />
    </AbsoluteFill>
  );
};

const Etiqueta: React.FC<{
  texto: string;
  e: EstiloMontaje;
  dura: number;
  fondo: string;
}> = ({ texto, e, dura, fondo }) => {
  const frame = useCurrentFrame();
  const entra = usePop(ETIQUETA_ENTRA);
  const sale = interpolate(frame, [dura - 6, dura], [1, 0], clamp);
  const vaiven = Math.sin(frame / 9) * 2.5;
  return (
    <div style={{ position: "absolute", top: ETIQUETA_Y, left: 70 }}>
      <Sticker
        texto={texto}
        fondo={fondo}
        e={e}
        tamano={78}
        giro={-6 + vaiven}
        escala={entra * sale}
      />
    </div>
  );
};

const Cierre: React.FC<{
  texto: string;
  subtexto?: string;
  e: EstiloMontaje;
}> = ({ texto, subtexto, e }) => {
  const a = usePop(0);
  const b = usePop(9);
  return (
    <AbsoluteFill style={{ alignItems: "center", top: CIERRE_Y - 120 }}>
      <Sticker
        texto={texto}
        fondo={e.primario}
        e={e}
        tamano={96}
        giro={-4}
        escala={a}
      />
      {subtexto ? (
        <Sticker
          texto={subtexto}
          fondo={e.claro}
          e={e}
          tamano={60}
          giro={3}
          escala={b}
          style={{ marginTop: 28 }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// Notas musicales que suben por los costados, en ciclos desfasados
const NOTAS = [
  { x: 60, desfase: 0, simbolo: "♪" },
  { x: 930, desfase: 23, simbolo: "♫" },
  { x: 140, desfase: 47, simbolo: "♫" },
  { x: 860, desfase: 58, simbolo: "♪" },
];

const Notas: React.FC<{ e: EstiloMontaje }> = ({ e }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {NOTAS.map((n, i) => {
        const f = (frame + n.desfase) % NOTAS_CICLO;
        const y = interpolate(f, [0, NOTAS_CICLO], [1500, 1050], clamp);
        const a = interpolate(
          f,
          [0, 10, NOTAS_CICLO - 18, NOTAS_CICLO],
          [0, 0.95, 0.95, 0],
          clamp,
        );
        const x = n.x + Math.sin((frame + n.desfase) / 11) * 22;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontSize: NOTAS_TAMANO,
              fontFamily: FREDOKA,
              fontWeight: 700,
              color: i % 2 ? e.secundario : e.primario,
              opacity: a,
              textShadow: `4px 5px 0 ${e.tinta}`,
              transform: `rotate(${Math.sin((frame + n.desfase) / 13) * 14}deg)`,
            }}
          >
            {n.simbolo}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Apariencia "sutil" ----------
// Entrada/salida suave: fundido + leve subida; sale en los últimos frames de su Sequence
const useSuave = (desde: number, dura?: number) => {
  const frame = useCurrentFrame();
  const entra = interpolate(frame, [desde, desde + SUTIL_ENTRA], [0, 1], {
    ...clamp,
    easing: salida,
  });
  const sale = dura ? interpolate(frame, [dura - 10, dura], [1, 0], clamp) : 1;
  return { alfa: entra * sale, y: (1 - entra) * SUTIL_SUBE };
};

const textoSutil = (
  tamano: number,
  peso: number,
  e: EstiloMontaje,
): React.CSSProperties => ({
  fontFamily: POPPINS,
  fontWeight: peso,
  fontSize: tamano,
  color: e.claro,
  textShadow: SUTIL_SOMBRA,
  lineHeight: 1.15,
  whiteSpace: "nowrap",
});

const TituloSutil: React.FC<{
  renglones: [string, string];
  e: EstiloMontaje;
}> = ({ renglones, e }) => {
  const a = useSuave(4, TITULO_DURA);
  const b = useSuave(12, TITULO_DURA);
  return (
    <>
      <AbsoluteFill style={{ background: SUTIL_VELO_ABAJO, opacity: a.alfa }} />
      <AbsoluteFill style={{ alignItems: "center", top: TITULO_Y - 90 }}>
        <div
          style={{
            ...textoSutil(84, 500, e),
            letterSpacing: "-0.01em",
            opacity: a.alfa,
            transform: `translateY(${a.y}px)`,
          }}
        >
          {renglones[0]}
        </div>
        <div
          style={{
            ...textoSutil(40, 300, e),
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            marginTop: 10,
            opacity: b.alfa,
            transform: `translateY(${b.y}px)`,
          }}
        >
          {renglones[1]}
        </div>
      </AbsoluteFill>
    </>
  );
};

const EtiquetaSutil: React.FC<{
  texto: string;
  e: EstiloMontaje;
  dura: number;
}> = ({ texto, e, dura }) => {
  const s = useSuave(ETIQUETA_ENTRA, dura);
  return (
    <>
      <AbsoluteFill
        style={{ background: SUTIL_VELO_ARRIBA, opacity: s.alfa }}
      />
      <div
        style={{
          position: "absolute",
          top: ETIQUETA_Y,
          left: 80,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: s.alfa,
          transform: `translateY(${s.y}px)`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 2,
            background: e.claro,
            boxShadow: SUTIL_SOMBRA_FUERTE,
          }}
        />
        <div
          style={{
            ...textoSutil(38, 500, e),
            letterSpacing: "0.22em",
            textShadow: SUTIL_SOMBRA_FUERTE,
          }}
        >
          {texto}
        </div>
      </div>
    </>
  );
};

const CierreSutil: React.FC<{
  texto: string;
  subtexto?: string;
  e: EstiloMontaje;
}> = ({ texto, subtexto, e }) => {
  const a = useSuave(0);
  const b = useSuave(10);
  return (
    <>
      <AbsoluteFill style={{ background: SUTIL_VELO_ABAJO, opacity: a.alfa }} />
      <AbsoluteFill style={{ alignItems: "center", top: CIERRE_Y - 70 }}>
        <div
          style={{
            ...textoSutil(66, 500, e),
            opacity: a.alfa,
            transform: `translateY(${a.y}px)`,
          }}
        >
          {texto}
        </div>
        {subtexto ? (
          <div
            style={{
              ...textoSutil(32, 300, e),
              letterSpacing: "0.3em",
              marginTop: 14,
              opacity: b.alfa,
              transform: `translateY(${b.y}px)`,
            }}
          >
            {subtexto}
          </div>
        ) : null}
      </AbsoluteFill>
    </>
  );
};

// Notas blancas y translúcidas que suben por los costados, en ciclos desfasados
const NOTAS_SUTILES = [
  { x: 60, desfase: 0, simbolo: "♪" },
  { x: 940, desfase: 30, simbolo: "♫" },
  { x: 150, desfase: 55, simbolo: "♫" },
  { x: 860, desfase: 80, simbolo: "♪" },
];

const NotasSutiles: React.FC<{ e: EstiloMontaje }> = ({ e }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {NOTAS_SUTILES.map((n, i) => {
        const f = (frame + n.desfase) % SUTIL_NOTAS_CICLO;
        const y = interpolate(
          f,
          [0, SUTIL_NOTAS_CICLO],
          SUTIL_NOTAS_RECORRIDO,
          clamp,
        );
        const a = interpolate(
          f,
          [0, 25, SUTIL_NOTAS_CICLO - 30, SUTIL_NOTAS_CICLO],
          [0, SUTIL_NOTAS_ALFA, SUTIL_NOTAS_ALFA, 0],
          clamp,
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left:
                n.x + Math.sin((frame + n.desfase) / 16) * SUTIL_NOTAS_VAIVEN,
              top: y,
              fontSize: SUTIL_NOTAS_TAMANO,
              fontFamily: POPPINS,
              color: e.claro,
              opacity: a,
              textShadow: SUTIL_SOMBRA_FUERTE,
              transform: `rotate(${Math.sin((frame + n.desfase) / 18) * SUTIL_NOTAS_GIRO}deg)`,
            }}
          >
            {n.simbolo}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Composición ----------
export const MontajeMusical: React.FC<MontajeMusicalProps> = (p) => {
  const ini = iniciosTomas(p.tomas);
  const total = duracionMontajeMusical(p);
  const mitad = CRUCE_AUDIO / 2;
  const sutil = p.apariencia === "sutil";
  const medios = !p.soloGraficos; // video y audio (sin ellos queda la capa de gráficos para Premiere)
  return (
    <AbsoluteFill
      style={{ background: medios ? p.estilo.tinta : "transparent" }}
    >
      {p.tomas.map((t, i) => {
        const dura = framesTomaMusical(t);
        const src = `${p.carpetaVideos}/${t.clip}.mp4`;
        const primera = i === 0;
        const ultima = i === p.tomas.length - 1;
        const antes = primera ? 0 : mitad; // cola de audio antes del corte de entrada
        const despues = ultima ? 0 : mitad; // cola después del corte de salida
        const desdeFrame = frameDesde(t);
        return (
          <React.Fragment key={i}>
            {medios ? (
              <>
                <Sequence
                  from={ini[i]}
                  durationInFrames={dura}
                  name={`${t.clip} ${t.desdeMs}-${t.hastaMs}`}
                >
                  <TomaVideo
                    t={t}
                    src={src}
                    dura={dura}
                    filtro={p.filtroVideo}
                  />
                </Sequence>
                <Sequence
                  from={ini[i] - antes}
                  durationInFrames={dura + antes + despues}
                  name={`audio ${t.clip}`}
                  layout="none"
                >
                  <AudioToma
                    src={src}
                    desdeFrame={desdeFrame - antes}
                    dura={dura + antes + despues}
                    ganancia={dbAVolumen(t.gananciaDb ?? 0)}
                    entra={primera ? 0 : CRUCE_AUDIO}
                    sale={ultima ? FUNDIDO_FINAL : CRUCE_AUDIO}
                  />
                </Sequence>
              </>
            ) : null}
            {t.etiqueta &&
            (i === 0 || p.tomas[i - 1].etiqueta !== t.etiqueta) ? (
              <Sequence
                from={ini[i] + (primera ? TITULO_DURA - 20 : 0)}
                durationInFrames={Math.min(dura, 75)}
                name={`etiqueta ${t.etiqueta}`}
              >
                {sutil ? (
                  <EtiquetaSutil
                    texto={t.etiqueta}
                    e={p.estilo}
                    dura={Math.min(dura, 75)}
                  />
                ) : (
                  <Etiqueta
                    texto={t.etiqueta}
                    e={p.estilo}
                    dura={Math.min(dura, 75)}
                    fondo={i % 2 ? p.estilo.secundario : p.estilo.claro}
                  />
                )}
              </Sequence>
            ) : null}
            {!primera ? (
              <>
                <Sequence
                  from={ini[i]}
                  durationInFrames={DESTELLO_FRAMES}
                  name="destello"
                  layout="none"
                >
                  <Destello color={p.estilo.claro} />
                </Sequence>
                {p.whoosh && medios ? (
                  <Sequence
                    from={ini[i] - WHOOSH_ANTES}
                    durationInFrames={WHOOSH_DURA}
                    name="whoosh"
                    layout="none"
                  >
                    <Audio
                      src={staticFile(p.whoosh)}
                      volume={dbAVolumen(p.whooshDb ?? WHOOSH_DB)}
                    />
                  </Sequence>
                ) : null}
              </>
            ) : null}
          </React.Fragment>
        );
      })}
      {sutil ? <NotasSutiles e={p.estilo} /> : <Notas e={p.estilo} />}
      <Sequence durationInFrames={TITULO_DURA} name="título">
        {sutil ? (
          <TituloSutil renglones={p.titulo} e={p.estilo} />
        ) : (
          <Titulo renglones={p.titulo} e={p.estilo} />
        )}
      </Sequence>
      <Sequence
        from={total - p.cierre.duracion}
        durationInFrames={p.cierre.duracion}
        name="cierre"
      >
        {sutil ? (
          <CierreSutil
            texto={p.cierre.texto}
            subtexto={p.cierre.subtexto}
            e={p.estilo}
          />
        ) : (
          <Cierre
            texto={p.cierre.texto}
            subtexto={p.cierre.subtexto}
            e={p.estilo}
          />
        )}
      </Sequence>
    </AbsoluteFill>
  );
};
