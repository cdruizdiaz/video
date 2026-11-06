// Trabajo 2026-11-03_cei_visita-cementerio: historia de IG del CEI con la visita al cementerio.
// Montaje musical sin voces: tomas cortas cortadas en los compases de la música ("Smile", Mixkit),
// golpe de zoom en cada corte, título de apertura tipo sticker y sin placa final (v2).
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
import { FILSON, NEW_SPIRIT } from "../../marcas/cei/fuentes";
import { PALETA_CEI } from "../../marcas/cei/marca";
import pulsos from "../../../public/trabajos/2026-11-03_cei_visita-cementerio/datos/pulsos.json";

const ID = "2026-11-03_cei_visita-cementerio";
const FPS = 30;

// ---------- Constantes ----------
const FILTRO_VIDEO = "saturate(1.18) contrast(1.06) brightness(1.03)";
const GOLPE_ZOOM = 0.1; // escala extra al entrar cada toma
const GOLPE_FRAMES = 7;
const EMPUJE = 0.05; // acercamiento lento durante la toma
const INTRO_HASTA_COMPAS = 2; // la primera toma (con el título) dura hasta este compás
const TITULO_ENTRA = 8;
const TITULO_SALE_ANTES = 8; // frames antes del primer corte en que sale el título
const MUSICA_FUNDIDO = 30;
const FUNDIDO_FINAL = 15; // la última toma se va a negro
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- Tomas ----------
// clip, segundo de inicio en el proxy, duración en compases (0.5 = medio compás)
type Toma = { clip: string; desde: number; compases: number };
// v2: más corta y sin tomas repetidas (una por momento), sin placa final
const TOMAS: Toma[] = [
  { clip: "c11", desde: 0.0, compases: 1.5 }, // bajan del colectivo
  { clip: "c10", desde: 0.4, compases: 1 }, // entrada del cementerio
  { clip: "c13", desde: 2.5, compases: 1 }, // recorrido
  { clip: "c04", desde: 0.2, compases: 0.5 }, // monumento
  { clip: "c06", desde: 4.2, compases: 0.5 }, // relieve
  { clip: "c08", desde: 0.3, compases: 1 }, // teacher en la galería
  { clip: "c01", desde: 1.4, compases: 1 }, // grupo entre las cruces
  { clip: "c14", desde: 5.3, compases: 1.5 }, // vuelven al colectivo (cierra con fundido)
];
const INTRO: Toma = { clip: "c03", desde: 1.6, compases: 0 };

// Cortes en los compases de la música (y en la mitad de cada compás)
const tiempoCompas = (c: number) => {
  const cs = pulsos.compases as number[];
  const i = Math.floor(c);
  const f = c - i;
  if (i + 1 < cs.length) return cs[i] + f * (cs[i + 1] - cs[i]);
  return cs[cs.length - 1];
};

type TomaUbicada = Toma & { inicio: number; dura: number };
const armar = () => {
  const lista: TomaUbicada[] = [];
  const finIntro = Math.round(tiempoCompas(INTRO_HASTA_COMPAS) * FPS);
  lista.push({ ...INTRO, inicio: 0, dura: finIntro });
  let c = INTRO_HASTA_COMPAS;
  let prev = finIntro;
  for (const t of TOMAS) {
    c += t.compases;
    const fin = Math.round(tiempoCompas(c) * FPS);
    lista.push({ ...t, inicio: prev, dura: fin - prev });
    prev = fin;
  }
  return lista;
};
export const TOMAS_UBICADAS = armar();
const ULTIMA = TOMAS_UBICADAS[TOMAS_UBICADAS.length - 1];
export const DURACION = ULTIMA.inicio + ULTIMA.dura;

// ---------- Piezas ----------
const TomaVideo: React.FC<{ t: TomaUbicada; golpe: boolean }> = ({ t, golpe }) => {
  const frame = useCurrentFrame();
  const g = golpe ? interpolate(frame, [0, GOLPE_FRAMES], [GOLPE_ZOOM, 0], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  const e = interpolate(frame, [0, t.dura], [0, EMPUJE], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <OffthreadVideo
        src={staticFile(`trabajos/${ID}/crudos/${t.clip}.mp4`)}
        trimBefore={Math.round(t.desde * FPS)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: FILTRO_VIDEO, transform: `scale(${1 + g + e})` }}
      />
    </AbsoluteFill>
  );
};

const Sticker: React.FC<{
  children: React.ReactNode;
  fondo: string;
  tinta: string;
  borde: string;
  giro: number;
  desde: number;
  fuente: string;
  tamano: number;
  peso: number;
  hasta: number;
}> = ({ children, fondo, tinta, borde, giro, desde, fuente, tamano, peso, hasta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - desde, fps, config: { damping: 11, stiffness: 170 } });
  const sale = interpolate(frame, [hasta - 6, hasta], [1, 0], clamp);
  return (
    <div
      style={{
        display: "inline-block",
        padding: `${tamano * 0.16}px ${tamano * 0.42}px ${tamano * 0.2}px`,
        background: fondo,
        color: tinta,
        border: `6px solid ${borde}`,
        borderRadius: tamano * 0.38,
        boxShadow: `8px 10px 0 ${borde}`,
        fontFamily: `"${fuente}", sans-serif`,
        fontWeight: peso,
        fontSize: tamano,
        lineHeight: 1,
        whiteSpace: "nowrap",
        transform: `rotate(${giro * s}deg) scale(${s * sale})`,
      }}
    >
      {children}
    </div>
  );
};

const Titulo: React.FC<{ hasta: number }> = ({ hasta }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34, flexDirection: "column", paddingBottom: 260 }}>
    <Sticker fondo={PALETA_CEI.cielo} tinta={PALETA_CEI.royal} borde={PALETA_CEI.royal} giro={-5} desde={TITULO_ENTRA} fuente={NEW_SPIRIT} tamano={112} peso={700} hasta={hasta}>
      Field trip!
    </Sticker>
    <Sticker fondo={PALETA_CEI.hueso} tinta={PALETA_CEI.calabaza} borde={PALETA_CEI.royal} giro={3} desde={TITULO_ENTRA + 9} fuente={FILSON} tamano={74} peso={700} hasta={hasta}>
      Visita al cementerio
    </Sticker>
  </AbsoluteFill>
);

// ---------- Composición ----------
export const VisitaCementerio: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {TOMAS_UBICADAS.map((t, i) => (
        <Sequence key={i} from={t.inicio} durationInFrames={t.dura}>
          <TomaVideo t={t} golpe={i > 0} />
        </Sequence>
      ))}
      <Sequence  durationInFrames={TOMAS_UBICADAS[0].dura}>
        <Titulo hasta={TOMAS_UBICADAS[0].dura - TITULO_SALE_ANTES + 6} />
      </Sequence>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(frame, [DURACION - FUNDIDO_FINAL, DURACION], [0, 1], clamp) }} />
      <Audio src={staticFile(`trabajos/${ID}/audio/musica.wav`)} volume={(f) => interpolate(f, [DURACION - MUSICA_FUNDIDO, DURACION], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
