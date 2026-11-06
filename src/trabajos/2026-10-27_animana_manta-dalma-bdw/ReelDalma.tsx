// Reel de animaná: manta Dalma en la Barcelona Design Week. Tomas cortadas al pulso de la música ("musica dalma", 90 bpm, del cliente; antes "Coffee Chill Out" de
// romanbelov, 88 bpm), fundidos de 5 cuadros, textos en Didot sobre velo cálido y cierre en hueso con el logo.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  ANIMANA_HUESO,
  ANIMANA_MARRON,
  animana,
} from "../../marcas/animana/marca";

// ---------- Constantes de animación ----------
const FPS = 30;
const BPM = 90.0; // música nueva (Clientes/Animaná/Dalma/musica dalma.mp4): 90,0 bpm medidos con pulsos.py; el primer pulso fuerte cae en el cuadro 0
const FRAMES_PULSO = (FPS * 60) / BPM; // 20,0
const CRUCE = 5; // cuadros de fundido entre tomas
const PUSH = 0.09; // acercamiento lento de cada toma (escala extra)
const TEXTO_ENTRA = 16;
const TEXTO_SALE = 10;
const TEXTO_SUBE = 26; // px
const TAMANO_GOTHAM = 54; // renglones en Gotham Book
const TAMANO_CURSIVA = 62; // renglón en Didot cursiva (Barcelona Design Week)
const ESPACIO_LETRAS = 0.06; // em, Gotham
const VELO =
  "linear-gradient(to top, rgba(40,26,10,0.62) 0%, rgba(40,26,10,0.28) 30%, rgba(40,26,10,0) 52%)";
const VELO_TEXTO =
  "radial-gradient(ellipse 85% 22% at 50% 50%, rgba(40,26,10,0.5) 0%, rgba(40,26,10,0.28) 55%, rgba(40,26,10,0) 100%)";
// Más luz sin quemar las ventanas: curva gamma (levanta sombras y medios tonos) + un poco de saturación
const GAMMA = 0.78; // < 1 aclara
const GANANCIA = 1.04;
const FILTRO = "url(#luz-dalma) saturate(1.04)";
const CIERRE_LOGO = 640;
const CIERRE_NOMBRE = 52;
const CIERRE_SELLO = 190;
const CIERRE_SEPARACION = 44; // px entre el nombre y el sello
const CIERRE_ARRIBA = 70;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.out(Easing.cubic);

// ---------- Datos ----------
export type Toma = {
  tipo: "video" | "foto";
  src: string; // dentro de public/
  desdeS?: number; // video: segundo del proxy
  pulsos: number; // duración en pulsos de la música
  origen?: string; // transform-origin del acercamiento
  empuja?: "dentro" | "fuera";
  texto?: { lineas: string[]; cursiva?: number }; // renglones; cursiva = índice del renglón en Didot Italic
};

export type ReelDalmaProps = {
  tomas: Toma[];
  pulsosCierre: number;
  musica: string;
};

const inicios = (tomas: Toma[]) => {
  const r: number[] = [];
  let acc = 0;
  for (const t of tomas) {
    r.push(Math.round(acc * FRAMES_PULSO));
    acc += t.pulsos;
  }
  r.push(Math.round(acc * FRAMES_PULSO));
  return r;
};

export const duracionReelDalma = (p: ReelDalmaProps) => {
  const ini = inicios(p.tomas);
  return ini[ini.length - 1] + Math.round(p.pulsosCierre * FRAMES_PULSO);
};

// ---------- Piezas ----------
const Medio: React.FC<{ t: Toma; dura: number }> = ({ t, dura }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, dura], [0, 1], clamp);
  const k = t.empuja === "fuera" ? 1 + PUSH * (1 - p) : 1 + PUSH * p;
  const estilo: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${k})`,
    transformOrigin: t.origen ?? "50% 50%",
    filter: FILTRO,
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="luz-dalma" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="gamma" amplitude={GANANCIA} exponent={GAMMA} />
            <feFuncG type="gamma" amplitude={GANANCIA} exponent={GAMMA} />
            <feFuncB type="gamma" amplitude={GANANCIA} exponent={GAMMA} />
          </feComponentTransfer>
        </filter>
      </svg>
      {t.tipo === "video" ? (
        <OffthreadVideo
          src={staticFile(t.src)}
          trimBefore={Math.round((t.desdeS ?? 0) * FPS)}
          muted
          style={estilo}
        />
      ) : (
        <Img src={staticFile(t.src)} style={estilo} />
      )}
    </AbsoluteFill>
  );
};

const Texto: React.FC<{ lineas: string[]; cursiva?: number; dura: number }> = ({
  lineas,
  cursiva,
  dura,
}) => {
  const frame = useCurrentFrame();
  const sale = interpolate(frame, [dura - TEXTO_SALE, dura], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        background: VELO_TEXTO,
        opacity: sale,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", opacity: sale, padding: "0 70px" }}>
        {lineas.map((l, i) => {
          const a = interpolate(frame, [i * 5, i * 5 + TEXTO_ENTRA], [0, 1], clamp);
          return (
            <div
              key={l}
              style={{
                fontFamily: cursiva === i ? animana.fuenteTitulos : animana.fuente,
                fontStyle: cursiva === i ? "italic" : "normal",
                fontSize: cursiva === i ? TAMANO_CURSIVA : TAMANO_GOTHAM,
                letterSpacing: cursiva === i ? 0 : `${ESPACIO_LETRAS}em`,
                lineHeight: 1.3,
                color: "#fffaf0",
                textShadow: "0 2px 18px rgba(40,26,10,0.7)",
                opacity: a,
                transform: `translateY(${(1 - suave(a)) * TEXTO_SUBE}px)`,
                filter: `blur(${(1 - a) * 6}px)`,
              }}
            >
              {l}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Cierre: React.FC = () => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [0, 18], [0, 1], clamp);
  const b = interpolate(frame, [14, 32], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        background: ANIMANA_HUESO,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img
        src={staticFile("marcas/animana/logo-completo-taupe.png")}
        style={{
          width: CIERRE_LOGO,
          opacity: a,
          transform: `translateY(${(1 - suave(a)) * 20}px)`,
        }}
      />
      <div
        style={{
          marginTop: CIERRE_ARRIBA,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: CIERRE_SEPARACION,
          opacity: b,
          transform: `translateY(${(1 - suave(b)) * 20}px)`,
        }}
      >
        <div
          style={{
            fontFamily: animana.fuenteTitulos,
            fontStyle: "italic",
            fontSize: CIERRE_NOMBRE,
            color: ANIMANA_MARRON,
            whiteSpace: "nowrap",
          }}
        >
          Manta Dalma.
        </div>
        <Img
          src={staticFile("marcas/animana/sello-buen-diseno.png")}
          style={{ width: CIERRE_SELLO, display: "block" }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Fundido: React.FC<{ entra: boolean; children: React.ReactNode }> = ({
  entra,
  children,
}) => {
  const frame = useCurrentFrame();
  const o = entra ? interpolate(frame, [0, CRUCE], [0, 1], clamp) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// ---------- Composición ----------
export const ReelDalma: React.FC<ReelDalmaProps> = (props) => {
  const { tomas, musica } = props;
  const ini = inicios(tomas);
  const total = duracionReelDalma(props);
  return (
    <AbsoluteFill style={{ background: ANIMANA_MARRON }}>
      {tomas.map((t, i) => {
        const dura = ini[i + 1] - ini[i];
        const durSeq = dura + CRUCE;
        return (
          <Sequence key={i} from={ini[i]} durationInFrames={durSeq} layout="none">
            <Fundido entra={i > 0}>
              <Medio t={t} dura={durSeq} />
              <AbsoluteFill style={{ background: VELO }} />
              {t.texto ? (
                <Texto lineas={t.texto.lineas} cursiva={t.texto.cursiva} dura={dura} />
              ) : null}
            </Fundido>
          </Sequence>
        );
      })}
      <Sequence
        from={ini[tomas.length]}
        durationInFrames={total - ini[tomas.length]}
        layout="none"
      >
        <Fundido entra>
          <Cierre />
        </Fundido>
      </Sequence>
      <Audio src={staticFile(musica)} volume={0.9} />
    </AbsoluteFill>
  );
};
