// Los chicos se entrevistan entre ellos (Museo del Umbral, CEI, Halloween día 2): preguntas y respuestas en inglés con
// doble subtítulo (inglés + español), carteles de país con bandera, después inserts de la actividad con la música que
// sube, y una placa final nueva (paneles que se abren) + logo del CEI. El plan lo arma armar_plan_entrevistas.py.
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { NEW_SPIRIT } from "../../marcas/cei/fuentes";
import { cei, PALETA_CEI } from "../../marcas/cei/marca";
import {
  AUDIO_FUNDIDO,
  CARPETA,
  CIERRE_LOGO,
  CRUCE_LOGO,
  FLASH_BRILLO,
  FLASH_DESENFOQUE,
  FLASH_ZOOM,
  LogoFinal,
  MUSICA_FADE_FINAL,
  Subtitulo,
  Tag,
  VeloLuz,
  clamp,
  frames,
  intensidadFlash,
} from "./MuseoUmbral";

// ---------- Constantes de animación y estilo ----------
// Música (musica_entrevistas.wav está a -14 LUFS): baja bajo las voces y SUBE cuando terminan las preguntas.
const MUSICA_BAJO_VOZ = 0.06;
const MUSICA_ALTA = 0.85; // inserts y placa
const MUSICA_ANTICIPO = 0; // frames antes de que termine de hablar el último chico en que empieza a subir
const MUSICA_SUBE = 24; // frames que tarda en subir
const MUSICA_ARRANQUE = 10; // frames de entrada al inicio
const PLACA_FR = 78; // frames de la placa final
const PLACA_FONDO = PALETA_CEI.cielo;
const PLACA_PANEL = PALETA_CEI.royal;
const PLACA_ABRE_DESDE = 4; // frame en que empiezan a abrirse los paneles
const PLACA_ABRE_DURA = 26;
const PLACA_TEXTO_DESDE = 14; // frame en que entra el título
const PLACA_TEXTO_ENTRE = 14; // frames entre una línea y la siguiente
const PLACA_TEXTO_DURA = 30;
const PLACA_TITULO = 104; // px, New Spirit
const PLACA_SUBTITULO = 70; // px, Filson Pro
const PLACA_PUNTOS = [PALETA_CEI.calabaza, PALETA_CEI.hueso, PALETA_CEI.vino]; // tres puntos bajo el texto
const PLACA_PUNTO_DESDE = 46;

// ---------- Tipos ----------
type Toma = { clip: string; ini: number; dur: number; flash?: boolean; rot?: number; esc?: number; rate?: number }; // rate = velocidad (0,5 = cámara lenta)
export type PlanEntrevistas = {
  video: Toma[]; // tramos con voz (s del proxy / s en pantalla)
  audio: { id: string; desde: number; dur: number; gananciaDb: number; fade?: number }[];
  subs: { t: string; es?: string; desde: number; hasta: number }[];
  tags: { t: string; desde: number; hasta: number; y?: number }[];
  inserts: Toma[]; // tomas de la actividad, sin sonido
  finEntrevistas: number; // s
  finHabla?: number; // s en que termina de hablar el último chico (ahí empieza a subir la música)
  finInserts: number; // s
  musica?: string; // archivo en audio/ (por defecto musica_entrevistas.wav)
  placa?: "paneles" | "barras"; // diseño de la placa final (por defecto paneles)
};
export type EntrevistasProps = { plan: PlanEntrevistas };

export const duracionEntrevistas = (p: Pick<EntrevistasProps, "plan">) => frames(p.plan.finInserts) + PLACA_FR + CIERRE_LOGO - CRUCE_LOGO;

const estiloToma = (v: Toma): React.CSSProperties => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transform: v.rot ? `rotate(${v.rot}deg) scale(${v.esc ?? 1})` : undefined,
});

// ---------- Placa final: dos paneles azules se abren (arriba y abajo) y dejan ver el título sobre el cielo ----------
const PlacaEntrevistas: React.FC = () => {
  const f = useCurrentFrame();
  const abre = interpolate(f, [PLACA_ABRE_DESDE, PLACA_ABRE_DESDE + PLACA_ABRE_DURA], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const entra = (k: number) => {
    const ini = PLACA_TEXTO_DESDE + k * PLACA_TEXTO_ENTRE;
    return interpolate(f, [ini, ini + PLACA_TEXTO_DURA], [0, 1], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  };
  const lineas = [
    { t: "Museo del Umbral", fuente: `"${NEW_SPIRIT}", serif`, peso: 700, tam: PLACA_TITULO, color: PALETA_CEI.royal, sep: "-0.01em", mayus: false },
    { t: "The Threshold", fuente: cei.fuente, peso: 500, tam: PLACA_SUBTITULO, color: PALETA_CEI.hueso, sep: "0.14em", mayus: true },
  ];
  return (
    <AbsoluteFill style={{ background: PLACA_FONDO, overflow: "hidden" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {lineas.map((l, k) => (
            <div
              key={l.t}
              style={{
                opacity: entra(k),
                transform: `scale(${0.88 + 0.12 * entra(k)})`,
                letterSpacing: `calc(${l.sep} + ${(1 - entra(k)) * 0.08}em)`,
                fontFamily: l.fuente,
                fontWeight: l.peso,
                fontSize: l.tam,
                whiteSpace: "nowrap",
                lineHeight: 1.1,
                color: l.color,
                textTransform: l.mayus ? "uppercase" : undefined,
              }}
            >
              {l.t}
            </div>
          ))}
          <div style={{ display: "flex", gap: 22, marginTop: 40 }}>
            {PLACA_PUNTOS.map((c, i) => {
              const p = interpolate(f, [PLACA_PUNTO_DESDE + i * 5, PLACA_PUNTO_DESDE + i * 5 + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
              return <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c, transform: `scale(${p})` }} />;
            })}
          </div>
        </div>
      </AbsoluteFill>
      {/* paneles: cubren la pantalla al principio y se abren hacia arriba y hacia abajo */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "50%", background: PLACA_PANEL, transform: `translateY(${-abre * 100}%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "50%", background: PLACA_PANEL, transform: `translateY(${abre * 100}%)` }} />
    </AbsoluteFill>
  );
};

// ---------- Placa final "barras": seis tiras verticales suben desde abajo, una tras otra, y tapan la última toma (la transición);
// después el texto entra sobre el fondo vino ----------
const BARRAS_FONDO = PALETA_CEI.vino;
const BARRAS_N = 6;
const BARRAS_ENTRE = 3; // frames entre una tira y la siguiente
const BARRAS_DURA = 14; // frames que tarda cada tira en subir
const BARRAS_TOTAL = BARRAS_ENTRE * (BARRAS_N - 1) + BARRAS_DURA; // frames que dura la transición
const BARRAS_TEXTO_DESDE = 18;
const BARRAS_TEXTO_ENTRE = 12;
const BARRAS_TEXTO_DURA = 26;

const PlacaBarras: React.FC = () => {
  const f = useCurrentFrame();
  const entra = (k: number) => {
    const ini = BARRAS_TEXTO_DESDE + k * BARRAS_TEXTO_ENTRE;
    return interpolate(f, [ini, ini + BARRAS_TEXTO_DURA], [0, 1], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  };
  const lineas = [
    { t: "Museo del Umbral", fuente: `"${NEW_SPIRIT}", serif`, peso: 600, tam: PLACA_TITULO, color: PALETA_CEI.hueso, sep: "-0.01em", mayus: false },
    { t: "The Threshold", fuente: cei.fuente, peso: 500, tam: PLACA_SUBTITULO, color: PALETA_CEI.agosto, sep: "0.14em", mayus: true },
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {Array.from({ length: BARRAS_N }, (_, k) => {
        const sube = interpolate(f, [k * BARRAS_ENTRE, k * BARRAS_ENTRE + BARRAS_DURA], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${(k * 100) / BARRAS_N}%`,
              width: `${100 / BARRAS_N + 0.2}%`,
              background: k % 2 === 0 ? BARRAS_FONDO : PALETA_CEI.calabaza,
              transform: `translateY(${(1 - sube) * 100}%)`,
            }}
          />
        );
      })}
      {/* el fondo se unifica en vino cuando las tiras ya taparon todo */}
      <AbsoluteFill style={{ background: BARRAS_FONDO, opacity: interpolate(f, [BARRAS_TOTAL, BARRAS_TOTAL + 10], [0, 1], clamp) }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {lineas.map((l, k) => (
            <div
              key={l.t}
              style={{
                opacity: entra(k),
                transform: `translateY(${(1 - entra(k)) * 40}px)`,
                filter: `blur(${(1 - entra(k)) * 8}px)`,
                fontFamily: l.fuente,
                fontWeight: l.peso,
                fontSize: l.tam,
                whiteSpace: "nowrap",
                lineHeight: 1.1,
                color: l.color,
                letterSpacing: l.sep,
                textTransform: l.mayus ? "uppercase" : undefined,
              }}
            >
              {l.t}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Composición ----------
export const EntrevistasUmbral: React.FC<EntrevistasProps> = ({ plan }) => {
  const f = useCurrentFrame();
  const finEnt = frames(plan.finEntrevistas);
  const finHabla = frames(plan.finHabla ?? plan.finEntrevistas);
  const finIns = frames(plan.finInserts);
  const total = duracionEntrevistas({ plan });
  let acum = 0;
  const arranques = plan.video.map((v) => {
    const a = acum;
    acum += frames(v.dur);
    return a;
  });
  let acumI = finEnt;
  const arranquesI = plan.inserts.map((v) => {
    const a = acumI;
    acumI += frames(v.dur);
    return a;
  });
  const cortesFlash = plan.inserts.flatMap((v, i) => (v.flash ? [arranquesI[i]] : []));
  const e = Math.max(0, ...cortesFlash.map((c) => intensidadFlash(f, c)));
  const sub = plan.subs.find((s) => f >= frames(s.desde) && f < frames(s.hasta));
  return (
    <AbsoluteFill style={{ background: PALETA_CEI.royal }}>
      <AbsoluteFill
        style={{
          filter: e > 0 ? `blur(${e * FLASH_DESENFOQUE}px) brightness(${1 + e * FLASH_BRILLO}) contrast(${1 - e * 0.2})` : undefined,
          transform: e > 0 ? `scale(${1 + e * FLASH_ZOOM})` : undefined,
        }}
      >
        {plan.video.map((v, i) => (
          <Sequence key={`v${i}`} from={arranques[i]} durationInFrames={frames(v.dur)} premountFor={30}>
            <OffthreadVideo src={staticFile(`${CARPETA}/crudos/${v.clip}.mp4`)} trimBefore={frames(v.ini)} playbackRate={v.rate} muted style={estiloToma(v)} />
          </Sequence>
        ))}
        {plan.inserts.map((v, i) => (
          <Sequence key={`i${i}`} from={arranquesI[i]} durationInFrames={frames(v.dur) + (plan.placa === "barras" && i === plan.inserts.length - 1 ? BARRAS_TOTAL : 0)} premountFor={30}>
            <OffthreadVideo src={staticFile(`${CARPETA}/crudos/${v.clip}.mp4`)} trimBefore={frames(v.ini)} muted style={estiloToma(v)} />
          </Sequence>
        ))}
      </AbsoluteFill>
      {e > 0 ? <VeloLuz e={e} /> : null}
      {plan.audio.map((a) => {
        const dura = frames(a.dur);
        const lineal = Math.pow(10, a.gananciaDb / 20);
        const fa = a.fade ?? AUDIO_FUNDIDO;
        return (
          <Sequence key={a.id} from={frames(a.desde)} durationInFrames={dura} layout="none">
            <Audio src={staticFile(`${CARPETA}/audio/voz/${a.id}.wav`)} volume={(g) => lineal * interpolate(g, [0, fa, dura - fa, dura], [0, 1, 1, 0], clamp)} />
          </Sequence>
        );
      })}
      {plan.tags.map((t) => (
        <Sequence key={`tag-${t.desde}`} from={frames(t.desde)} durationInFrames={frames(t.hasta) - frames(t.desde)} layout="none">
          <Tag texto={t.t} desde={0} bandera y={t.y} seco />
        </Sequence>
      ))}
      {sub ? <Subtitulo key={sub.desde} texto={sub.t} es={sub.es} marca={cei} desde={frames(sub.desde)} seco /> : null}
      <Audio
        src={staticFile(`${CARPETA}/audio/${plan.musica ?? "musica_entrevistas.wav"}`)}
        volume={(g) => {
          const sube = interpolate(g, [finHabla - MUSICA_ANTICIPO, finHabla - MUSICA_ANTICIPO + MUSICA_SUBE], [MUSICA_BAJO_VOZ, MUSICA_ALTA], {
            ...clamp,
            easing: Easing.inOut(Easing.cubic),
          });
          const baja = interpolate(g, [total - MUSICA_FADE_FINAL, total], [1, 0], clamp);
          const arranca = interpolate(g, [0, MUSICA_ARRANQUE], [0, 1], clamp);
          return sube * baja * arranca;
        }}
      />
      <Sequence from={finIns} durationInFrames={PLACA_FR}>
        {plan.placa === "barras" ? <PlacaBarras /> : <PlacaEntrevistas />}
      </Sequence>
      <Sequence from={finIns + PLACA_FR - CRUCE_LOGO} durationInFrames={CIERRE_LOGO}>
        <LogoFinal />
      </Sequence>
    </AbsoluteFill>
  );
};
