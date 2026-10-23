// Día de la Madre del CEI: cada alumno agradece a su mamá por teléfono. Montaje de tomas cortas en su plano
// original (sin movimientos de cámara), la voz sale del audio externo grabado aparte, limpiado y sincronizado
// (datos/sincronia.json), con música suave debajo; subtítulos del cliente y placa + logo finales.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { Marca } from "../../marcas";
import { cei, PALETA_CEI } from "../../marcas/cei/marca";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import flor from "./flor.json";

const { fontFamily: frauncesItalica } = loadFraunces("italic", { weights: ["400"], subsets: ["latin"] });

// ---------- Constantes de animación y estilo ----------
const FPS = 30;
const ID = "2026-10-15_cei_dia-de-la-madre";
const CARPETA = `trabajos/${ID}`;
const AUDIO_FUNDIDO_ENTRA = 2; // frames de fundido de la voz al entrar (corto: el corte cae justo antes de la primera sílaba)
const AUDIO_FUNDIDO_SALE = 4; // frames de fundido al salir
const CIERRE_PLACA = 120; // frames de "Happy Mother's Day"
const CIERRE_LOGO = 90; // frames del logo final
const CRUCE_LOGO = 10; // frames del cruce entre la placa y el logo
const MUSICA_BAJO_VOZ = 0.15; // volumen de la música mientras hablan (≈ -16 dB bajo las voces)
const MUSICA_PLACA = 0.75; // volumen en la placa final, sin voces
const MUSICA_SUBE = 36; // frames que tarda en subir al llegar la placa
const MUSICA_ANTICIPO = 12; // la música empieza a subir antes de que termine la última voz
const MUSICA_FADE_FINAL = 54; // frames del fundido final

// Placa final
const PLACA_FLOR = 400; // px de ancho de la flor central
const PLACA_EMPUJE = 1.035; // escala al final de la placa (acercamiento lento)
const PLACA_GRANO = 0.07; // opacidad del grano
const FLOR_LUZ = "#ffc58a"; // brillo de los pétalos (lado de la luz)
// flores fuera de foco del fondo: posición, tamaño, desenfoque, opacidad, giro y px por cuadro que bajan
const PLACA_BOKEH = [
  { x: -170, y: -120, ancho: 560, desenfoque: 34, opacidad: 0.09, giro: 12, deriva: 0.12 },
  { x: 720, y: 180, ancho: 420, desenfoque: 26, opacidad: 0.07, giro: -20, deriva: 0.2 },
  { x: -120, y: 1380, ancho: 480, desenfoque: 30, opacidad: 0.07, giro: 30, deriva: -0.15 },
  { x: 760, y: 1500, ancho: 600, desenfoque: 40, opacidad: 0.08, giro: -8, deriva: -0.1 },
];

// Subtítulos (pedido del cliente): Filson Pro Medium, fondo hueso #ffede1 al 80 % con esquinas redondeadas, letras
// naranja #dc7b26. Hasta dos líneas dentro de UN solo rectángulo que se amolda a la frase, sin tocar los márgenes.
const SUB_TAMANO = 54; // px
const SUB_MARGEN = 110; // px libres a cada lado del rectángulo
const SUB_FONDO = "rgba(255, 237, 225, 0.8)";
const SUB_COLOR = PALETA_CEI.calabaza;
const SUB_PADDING_Y = 12; // px
const SUB_PADDING_X = 28; // px
const SUB_RADIO = 28; // px
const SUB_INTERLINEA = 1.18;
const SUB_Y = 1450; // centro vertical del bloque
const SUB_ENTRA = 4; // frames de aparición

// ---------- Tipos ----------
export type TomaPlan = {
  clip: string;
  ini: number; // s del video
  fin: number;
  subs: [string, number, number][]; // texto (con \n para dos líneas), desde, hasta (s del video)
};
export type Sincronia = Record<string, { desfaseMs: number; duracionVideoMs: number }>;
export type Ganancias = Record<string, { gananciaDb: number }>;

export type DiaDeLaMadreProps = {
  tomas: TomaPlan[];
  sincronia: Sincronia;
  ganancias: Ganancias;
  sinEstabilizar?: boolean; // usa los proxies originales en vez de los estabilizados (estabilizar.sh)
  sinSubsNiMusica?: boolean; // montaje para revisar cortes: las tomas con su voz y el cierre, sin subtítulos ni música
};

const frames = (s: number) => Math.round(s * FPS);
const duracionToma = (t: TomaPlan) => frames(t.fin - t.ini);

export const duracionDiaDeLaMadre = (p: Pick<DiaDeLaMadreProps, "tomas">) =>
  p.tomas.reduce((a, t) => a + duracionToma(t), 0) + CIERRE_PLACA + CIERRE_LOGO - CRUCE_LOGO;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- Subtítulo ----------
// Parte la frase en una o dos líneas parejas que entren en `maxPx` (se mide con la tipografía real); si ni así entra,
// achica la letra. El rectángulo mide lo que la línea más larga.
let lienzo: CanvasRenderingContext2D | null = null;
const medir = (texto: string, fuente: string, tam: number) => {
  if (typeof document === "undefined") return texto.length * tam * 0.5;
  lienzo = lienzo ?? document.createElement("canvas").getContext("2d");
  if (!lienzo) return texto.length * tam * 0.5;
  lienzo.font = `500 ${tam}px ${fuente}`;
  return lienzo.measureText(texto).width;
};
const partir = (texto: string, fuente: string, tam: number, maxPx: number): { lineas: string[]; tam: number } => {
  const limpio = texto.replace(/\s+/g, " ").trim();
  let t = tam;
  for (let intento = 0; intento < 6; intento++) {
    if (medir(limpio, fuente, t) <= maxPx) return { lineas: [limpio], tam: t };
    const pal = limpio.split(" ");
    let mejor: string[] | null = null;
    let mejorAncho = Infinity;
    for (let i = 1; i < pal.length; i++) {
      const a = pal.slice(0, i).join(" ");
      const b = pal.slice(i).join(" ");
      const ancho = Math.max(medir(a, fuente, t), medir(b, fuente, t));
      if (ancho < mejorAncho) {
        mejorAncho = ancho;
        mejor = [a, b];
      }
    }
    if (mejor && mejorAncho <= maxPx) return { lineas: mejor, tam: t };
    t = Math.floor(t * 0.92); // no entra ni en dos líneas: letra un poco más chica
  }
  return { lineas: [limpio], tam: t };
};

const Subtitulo: React.FC<{ texto: string; marca: Marca; desde: number }> = ({ texto, marca, desde }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [desde, desde + SUB_ENTRA], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const maxTexto = 1080 - 2 * SUB_MARGEN - 2 * SUB_PADDING_X;
  const { lineas, tam } = partir(texto, marca.fuente, SUB_TAMANO, maxTexto);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: SUB_Y,
        display: "flex",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(calc(-50% + ${(1 - p) * 14}px))`,
      }}
    >
      <div
        style={{
          padding: `${SUB_PADDING_Y}px ${SUB_PADDING_X}px`,
          borderRadius: lineas.length > 1 ? SUB_RADIO + 6 : SUB_RADIO,
          background: SUB_FONDO,
          color: SUB_COLOR,
          fontFamily: marca.fuente,
          fontWeight: 500,
          fontSize: tam,
          lineHeight: SUB_INTERLINEA,
          textAlign: "center",
          whiteSpace: "pre",
        }}
      >
        {lineas.join("\n")}
      </div>
    </div>
  );
};

// ---------- Una toma ----------
const Toma: React.FC<{ t: TomaPlan; sinc: Sincronia[string]; conSubs: boolean; estabilizar: boolean }> = ({
  t,
  sinc,
  conSubs,
  estabilizar,
}) => {
  const f = useCurrentFrame();
  const dura = duracionToma(t);
  const inicio = frames(t.ini);
  const finVideo = Math.floor((sinc.duracionVideoMs / 1000) * FPS) - 1; // último cuadro disponible del clip
  const disponibles = Math.max(1, Math.min(dura, finVideo - inicio + 1));
  const src = staticFile(`${CARPETA}/crudos/${t.clip}${estabilizar ? "_est" : ""}.mp4`); // _est: estabilizar.sh
  const estiloVideo: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
  const ahora = t.ini + f / FPS;
  const sub = t.subs.find(([, d, h]) => ahora >= d && ahora < h);
  const subDesde = sub ? frames(sub[1] - t.ini) : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={disponibles} layout="none">
        <OffthreadVideo src={src} trimBefore={inicio} muted style={estiloVideo} />
      </Sequence>
      {disponibles < dura ? (
        // el audio externo dura más que el video: se congela el último cuadro hasta que termine la frase
        <Sequence from={disponibles} durationInFrames={dura - disponibles} layout="none">
          <Freeze frame={0}>
            <OffthreadVideo src={src} trimBefore={inicio + disponibles - 1} muted style={estiloVideo} />
          </Freeze>
        </Sequence>
      ) : null}
      {sub && conSubs ? <Subtitulo texto={sub[0]} marca={cei} desde={subDesde} /> : null}
    </AbsoluteFill>
  );
};

// Audio de una toma (voz limpia del archivo externo), alineado al cuadro: sin adelantar el audio a la imagen (el corte
// ya cae en la pausa justo antes de la primera sílaba, así no se cuela el final de la frase anterior).
const AudioToma: React.FC<{ t: TomaPlan; sinc: Sincronia[string]; gananciaDb: number }> = ({ t, sinc, gananciaDb }) => {
  const dura = duracionToma(t);
  const extIni = t.ini + sinc.desfaseMs / 1000; // s del audio externo donde arranca la toma
  const retrasoFrames = frames(Math.max(0, -extIni)); // el externo empezó después del cuadro 0 del video
  const desde = Math.max(0, extIni);
  const lineal = Math.pow(10, gananciaDb / 20);
  const largo = dura - retrasoFrames;
  return (
    <Sequence from={retrasoFrames} durationInFrames={largo} layout="none">
      <Audio
        src={staticFile(`${CARPETA}/audio/voz/${t.clip}.wav`)}
        trimBefore={frames(desde)}
        volume={(f) =>
          lineal *
          interpolate(f, [0, AUDIO_FUNDIDO_ENTRA, largo - AUDIO_FUNDIDO_SALE, largo], [0, 1, 1, 0], clamp)
        }
      />
    </Sequence>
  );
};

// ---------- Cierre: placa "Happy Mother's Day" y logo ----------
// La flor es la del logo del CEI (contornos extraídos del manual: flor.json): cinco pétalos y el centro, con el
// borde vino que los rodea. Los pétalos se abren de a uno desde el centro.
// `relieve`: los pétalos llevan un degradé de luz (de arriba a la izquierda) en vez del naranja plano.
const FlorLogo: React.FC<{ ancho: number; progreso: number; borde?: boolean; relieve?: boolean }> = ({
  ancho,
  progreso,
  borde = true,
  relieve = false,
}) => {
  const cx = flor.ancho / 2;
  const cy = flor.alto / 2;
  const petalos = flor.petalos; // ordenados de mayor a menor: el último es el centro
  const relleno = relieve ? "url(#flor-luz)" : flor.colorPetalo;
  return (
    <svg
      width={ancho}
      height={(ancho * flor.alto) / flor.ancho}
      viewBox={`0 0 ${flor.ancho} ${flor.alto}`}
      style={{ overflow: "visible" }}
    >
      {relieve ? (
        <defs>
          <radialGradient id="flor-luz" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={flor.ancho * 0.62} fx={cx * 0.62} fy={cy * 0.55}>
            <stop offset="0" stopColor={FLOR_LUZ} />
            <stop offset="0.45" stopColor={PALETA_CEI.agosto} />
            <stop offset="0.8" stopColor={PALETA_CEI.calabaza} />
            <stop offset="1" stopColor={PALETA_CEI.canela} />
          </radialGradient>
        </defs>
      ) : null}
      <g transform={`rotate(${(1 - progreso) * -35} ${cx} ${cy})`}>
        {borde ? (
          <path
            d={flor.silueta}
            fill={flor.colorBorde}
            opacity={interpolate(progreso, [0, 0.3], [0, 1], clamp)}
            transform={`translate(${cx} ${cy}) scale(${0.55 + 0.45 * progreso}) translate(${-cx} ${-cy})`}
          />
        ) : null}
        {petalos.map((d, i) => {
          const esCentro = i === petalos.length - 1;
          const ini = esCentro ? 0.55 : i * 0.1;
          const p = interpolate(progreso, [ini, ini + 0.45], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
          return (
            <path
              key={d.slice(0, 30)}
              d={d}
              fill={relleno}
              transform={`translate(${cx} ${cy}) scale(${p}) translate(${-cx} ${-cy})`}
            />
          );
        })}
      </g>
    </svg>
  );
};

// Placa: fondo vino #6d1414 parejo, con una luz cálida muy suave detrás de la flor, viñeta en los bordes, flores
// grandes desenfocadas que flotan lento (profundidad sin trama) y grano fino para que no se vea plano/digital.
const PlacaFeliz: React.FC<{ marca: Marca }> = ({ marca }) => {
  const f = useCurrentFrame();
  const suave = Easing.bezier(0.22, 1, 0.36, 1);
  const abre = interpolate(f, [4, 54], [0, 1], { ...clamp, easing: suave });
  const linea1 = interpolate(f, [22, 46], [0, 1], { ...clamp, easing: suave });
  const linea2 = interpolate(f, [30, 56], [0, 1], { ...clamp, easing: suave });
  const filete = interpolate(f, [46, 76], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const empuje = interpolate(f, [0, CIERRE_PLACA], [1, PLACA_EMPUJE], clamp); // acercamiento lentísimo de todo
  const luz = interpolate(f, [0, 40], [0, 1], { ...clamp, easing: suave });
  const entraTexto = (p: number): React.CSSProperties => ({
    opacity: p,
    filter: `blur(${(1 - p) * 10}px)`,
    transform: `translateY(${(1 - p) * 26}px)`,
  });
  return (
    <AbsoluteFill style={{ background: PALETA_CEI.vino, overflow: "hidden" }}>
      {/* luz cálida detrás de la flor y viñeta: el centro de la placa queda en el vino exacto */}
      <AbsoluteFill
        style={{
          opacity: luz,
          background: `radial-gradient(ellipse 70% 42% at 50% 30%, rgba(239, 145, 60, 0.16) 0%, rgba(239, 145, 60, 0.05) 45%, rgba(239, 145, 60, 0) 75%)`,
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 85% 70% at 50% 46%, rgba(0, 0, 0, 0) 55%, rgba(30, 4, 4, 0.42) 100%)" }}
      />
      {/* flores grandes fuera de foco que derivan despacio */}
      {PLACA_BOKEH.map((b) => (
        <div
          key={`${b.x}-${b.y}`}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y + f * b.deriva,
            opacity: b.opacidad * luz,
            filter: `blur(${b.desenfoque}px)`,
            transform: `rotate(${b.giro + f * 0.05}deg)`,
          }}
        >
          <FlorLogo ancho={b.ancho} progreso={1} borde={false} />
        </div>
      ))}
      <AbsoluteFill style={{ transform: `scale(${empuje})` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 440,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(abre, [0, 0.25], [0, 1], clamp),
            filter: "drop-shadow(0 30px 50px rgba(40, 4, 4, 0.55)) drop-shadow(0 4px 8px rgba(40, 4, 4, 0.25))",
          }}
        >
          <FlorLogo ancho={PLACA_FLOR} progreso={abre} relieve />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              ...entraTexto(linea1),
              fontFamily: frauncesItalica,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 104,
              lineHeight: 1,
              color: PALETA_CEI.agosto,
              letterSpacing: "0.01em",
            }}
          >
            Happy
          </div>
          <div
            style={{
              ...entraTexto(linea2),
              marginTop: 10,
              fontFamily: marca.fuenteTitulos,
              fontWeight: 500,
              fontSize: 128,
              lineHeight: 1.05,
              color: PALETA_CEI.hueso,
              letterSpacing: "-0.015em",
              textShadow: "0 6px 24px rgba(40, 4, 4, 0.35)",
            }}
          >
            Mother’s Day
          </div>
          {/* filete fino que se abre desde el centro, con un punto */}
          <div style={{ marginTop: 56, display: "flex", alignItems: "center", gap: 18, opacity: filete }}>
            <div style={{ height: 2, width: 150 * filete, background: `linear-gradient(90deg, rgba(255,237,225,0), ${PALETA_CEI.hueso})`, opacity: 0.55 }} />
            <div style={{ width: 9, height: 9, borderRadius: 5, background: PALETA_CEI.agosto }} />
            <div style={{ height: 2, width: 150 * filete, background: `linear-gradient(90deg, ${PALETA_CEI.hueso}, rgba(255,237,225,0))`, opacity: 0.55 }} />
          </div>
        </div>
      </AbsoluteFill>
      {/* grano fino */}
      <AbsoluteFill style={{ opacity: PLACA_GRANO, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="placa-grano">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 6} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#placa-grano)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const LogoFinal: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [CRUCE_LOGO, CRUCE_LOGO + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fondo = interpolate(f, [0, CRUCE_LOGO], [0, 1], clamp); // el fondo hueso entra encima de la placa
  return (
    <AbsoluteFill style={{ background: PALETA_CEI.hueso, alignItems: "center", justifyContent: "center", opacity: fondo }}>
      <Img src={staticFile(cei.logo)} style={{ width: 860, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }} />
    </AbsoluteFill>
  );
};

// ---------- Composición ----------
export const DiaDeLaMadre: React.FC<DiaDeLaMadreProps> = ({
  tomas,
  sincronia,
  ganancias,
  sinEstabilizar = false,
  sinSubsNiMusica = false,
}) => {
  let acum = 0;
  const arranques = tomas.map((t) => {
    const a = acum;
    acum += duracionToma(t);
    return a;
  });
  const finTomas = acum;
  const inicioLogo = finTomas + CIERRE_PLACA - CRUCE_LOGO;
  const total = finTomas + CIERRE_PLACA + CIERRE_LOGO - CRUCE_LOGO;
  return (
    <AbsoluteFill style={{ background: PALETA_CEI.vino }}>
      {tomas.map((t, i) => (
        <Sequence key={t.clip} from={arranques[i]} durationInFrames={duracionToma(t)} premountFor={30}>
          <Toma t={t} sinc={sincronia[t.clip]} conSubs={!sinSubsNiMusica} estabilizar={!sinEstabilizar} />
        </Sequence>
      ))}
      {tomas.map((t, i) => (
        <Sequence key={`a-${t.clip}`} from={arranques[i]} layout="none">
          <AudioToma t={t} sinc={sincronia[t.clip]} gananciaDb={ganancias[t.clip]?.gananciaDb ?? 0} />
        </Sequence>
      ))}
      {sinSubsNiMusica ? null : (
        <Audio
          src={staticFile(`${CARPETA}/audio/musica.wav`)}
          volume={(f) => {
            const sube = interpolate(
              f,
              [finTomas - MUSICA_ANTICIPO, finTomas - MUSICA_ANTICIPO + MUSICA_SUBE],
              [MUSICA_BAJO_VOZ, MUSICA_PLACA],
              { ...clamp, easing: Easing.inOut(Easing.cubic) },
            );
            const baja = interpolate(f, [total - MUSICA_FADE_FINAL, total], [1, 0], clamp);
            return sube * baja;
          }}
        />
      )}
      <Sequence from={finTomas} durationInFrames={CIERRE_PLACA}>
        <PlacaFeliz marca={cei} />
      </Sequence>
      <Sequence from={inicioLogo} durationInFrames={CIERRE_LOGO}>
        <LogoFinal />
      </Sequence>
    </AbsoluteFill>
  );
};
