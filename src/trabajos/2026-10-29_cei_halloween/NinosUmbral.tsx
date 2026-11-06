// Los chicos del Museo del Umbral (CEI): placa animada con la pregunta "What did you learn about your country?" y
// después sus respuestas (su voz, subtítulos del CEI y cartel del país arriba), flash de luz al entrar la primera
// respuesta, música suave y el mismo cierre (nombre de la actividad + logo). El plan lo arma armar_plan_ninos.py.
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
  MUSICA_RAMPA,
  Subtitulo,
  Tag,
  VeloLuz,
  clamp,
  frames,
  intensidadFlash,
} from "./MuseoUmbral";

// ---------- Constantes de animación y estilo ----------
// Música (musica_ninos.wav está a -14 LUFS): baja bajo las voces y SUBE fuerte en la placa final, como de cierre.
const MUSICA_BAJO_VOZ = 0.07;
const MUSICA_PLACA = 0.9;
const MUSICA_ANTICIPO = 18; // frames antes del fin de las tomas en que empieza a subir
const MUSICA_SUBE = 24; // frames que tarda en subir
const PLACA_NINOS_FR = 54; // frames de la placa final (corta: el logo del CEI entra enseguida)
const TITULO_PALABRA = 3; // frames entre palabra y palabra
const TITULO_PALABRAS_DESDE = 14; // frame en que entra la primera palabra (después de que empieza la flor)
const TITULO_ENTRA = 10; // frames que tarda en entrar cada palabra
const TITULO_TAMANO = 120; // px
const TITULO_TAMANO_ACENTO = 138; // px de "country?"
const TITULO_Y = 960; // centro vertical del bloque de texto
const TITULO_FUENTE_ACENTO = `"${NEW_SPIRIT}", serif`; // "country?" en New Spirit (tipografía de títulos del CEI)
const TITULO_PESO_ACENTO = 600;
const TITULO_LINEAS: { t: string; acento?: boolean }[][] = [
  [{ t: "What" }, { t: "did" }, { t: "you" }],
  [{ t: "learn" }, { t: "about" }],
  [{ t: "your" }, { t: "country?", acento: true }],
];
const FLASH_SUBE_N = 6; // = FLASH_SUBE del montaje de las teachers (el corte cae en el pico)

// ---------- Tipos ----------
export type PlanNinos = {
  video: { clip: string; ini: number; dur: number; flash?: boolean; rot?: number; esc?: number }[]; // rot/esc = enderezado (retoques_ninos.py)
  audio: { id: string; desde: number; dur: number; gananciaDb: number; fade?: number }[];
  subs: { t: string; es?: string; desde: number; hasta: number }[]; // es = traducción (el chico habla inglés)
  tags: { t: string; desde: number; hasta: number; y?: number }[]; // y = alto del cartel (ubicar_carteles.py)
  musicaSola: { desde: number; hasta: number; nivel: number }[];
  titulo: number; // s de la placa de la pregunta
  finTomas: number; // s
};
export type NinosProps = { plan: PlanNinos };

export const duracionNinos = (p: Pick<NinosProps, "plan">) => frames(p.plan.finTomas) + PLACA_NINOS_FR + CIERRE_LOGO - CRUCE_LOGO;

// ---------- Placa de la pregunta ----------
const TituloPregunta: React.FC = () => {
  const f = useCurrentFrame();
  let n = 0;
  return (
    <AbsoluteFill style={{ background: PALETA_CEI.royal, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: TITULO_Y, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {TITULO_LINEAS.map((linea, li) => (
          <div key={li} style={{ display: "flex", gap: 28, alignItems: "baseline", position: "relative" }}>
            {linea.map((w) => {
              const ini = TITULO_PALABRAS_DESDE + n++ * TITULO_PALABRA;
              const p = interpolate(f, [ini, ini + TITULO_ENTRA], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
              const o = interpolate(f, [ini, ini + 8], [0, 1], clamp);
              return (
                <span
                  key={w.t}
                  style={{
                    display: "inline-block",
                    opacity: o,
                    filter: `blur(${(1 - o) * 12}px)`,
                    transform: `translateY(${(1 - p) * 50}px) scale(${0.8 + 0.2 * p})`,
                    fontFamily: w.acento ? TITULO_FUENTE_ACENTO : cei.fuente,
                    fontWeight: w.acento ? TITULO_PESO_ACENTO : 700,
                    fontSize: w.acento ? TITULO_TAMANO_ACENTO : TITULO_TAMANO,
                    lineHeight: 1.05,
                    letterSpacing: "-0.01em",
                    color: w.acento ? PALETA_CEI.agosto : PALETA_CEI.hueso,
                  }}
                >
                  {w.t}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};


// ---------- Placa final (distinta de la de las teachers): fondo naranja y solo el texto, centrado ----------
const CIERRE_FONDO = PALETA_CEI.calabaza;
const CIERRE_TITULO = 104; // px, New Spirit
const CIERRE_SUBTITULO = 70; // px, Filson Pro
const CIERRE_LINEA_ENTRE = 12; // frames entre una línea y la siguiente
const CIERRE_LINEA_DURA = 22;

const PLACA_BARRIDO = 14; // frames que tarda el barrido naranja en cruzar la pantalla
const PLACA_BORDE = 14; // px de la franja clara que va en la punta del barrido
const PLACA_TEXTO_DESDE = 7; // frame en que empieza a entrar el texto (con el barrido ya a medio camino)

const PlacaNinos: React.FC = () => {
  const f = useCurrentFrame();
  const barrido = interpolate(f, [0, PLACA_BARRIDO], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
  const linea = (k: number) => {
    const ini = PLACA_TEXTO_DESDE + k * CIERRE_LINEA_ENTRE;
    return interpolate(f, [ini, ini + CIERRE_LINEA_DURA], [0, 1], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* barrido de izquierda a derecha: el naranja cubre la toma y una franja clara marca la punta */}
      <AbsoluteFill style={{ background: CIERRE_FONDO, clipPath: `inset(0 ${(1 - barrido) * 100}% 0 0)` }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: PLACA_BORDE,
          left: `calc(${barrido * 100}% - ${PLACA_BORDE}px)`,
          background: PALETA_CEI.hueso,
          opacity: interpolate(barrido, [0, 0.1, 0.9, 1], [0, 0.9, 0.9, 0], clamp),
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {[
            { t: "Museo del Umbral", fuente: `"${NEW_SPIRIT}", serif`, peso: 600, tam: CIERRE_TITULO, color: PALETA_CEI.hueso, sep: "-0.01em", mayus: false },
            { t: "The Threshold", fuente: cei.fuente, peso: 500, tam: CIERRE_SUBTITULO, color: PALETA_CEI.royal, sep: "0.14em", mayus: true },
          ].map((l, k) => (
            <div
              key={l.t}
              style={{
                padding: "0 30px 12px",
                opacity: linea(k),
                transform: `translateX(${(1 - linea(k)) * -90}px)`,
                filter: `blur(${(1 - linea(k)) * 6}px)`,
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
export const NinosUmbral: React.FC<NinosProps> = ({ plan }) => {
  const f = useCurrentFrame();
  const tituloFr = frames(plan.titulo);
  const finTomas = frames(plan.finTomas);
  const total = duracionNinos({ plan });
  let acum = tituloFr;
  const arranques = plan.video.map((v) => {
    const a = acum;
    acum += frames(v.dur);
    return a;
  });
  const cortesFlash = plan.video.flatMap((v, i) => (v.flash ? [arranques[i]] : []));
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
        <Sequence  durationInFrames={tituloFr}>
          <TituloPregunta />
        </Sequence>
        {plan.video.map((v, i) => (
          <Sequence key={`v${i}`} from={arranques[i]} durationInFrames={frames(v.dur) + (i === plan.video.length - 1 ? PLACA_BARRIDO : 0)} premountFor={30}>
            <OffthreadVideo
              src={staticFile(`${CARPETA}/crudos/${v.clip}.mp4`)}
              trimBefore={frames(v.ini)}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: v.rot ? `rotate(${v.rot}deg) scale(${v.esc ?? 1})` : undefined }}
            />
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
            <Audio
              src={staticFile(`${CARPETA}/audio/voz/${a.id}.wav`)}
              volume={(g) => lineal * interpolate(g, [0, fa, dura - fa, dura], [0, 1, 1, 0], clamp)}
            />
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
        src={staticFile(`${CARPETA}/audio/musica_ninos.wav`)}
        volume={(g) => {
          const subida = Math.max(
            0,
            ...plan.musicaSola.map(
              (w) =>
                (w.nivel - MUSICA_BAJO_VOZ) *
                Math.min(
                  interpolate(g, [frames(w.desde), frames(w.desde) + MUSICA_RAMPA], [0, 1], clamp),
                  interpolate(g, [frames(w.hasta) - MUSICA_RAMPA, frames(w.hasta)], [1, 0], clamp),
                ),
            ),
          );
          const base = MUSICA_BAJO_VOZ + subida;
          const sube = interpolate(g, [finTomas - MUSICA_ANTICIPO, finTomas - MUSICA_ANTICIPO + MUSICA_SUBE], [base, MUSICA_PLACA], {
            ...clamp,
            easing: Easing.inOut(Easing.cubic),
          });
          const baja = interpolate(g, [total - MUSICA_FADE_FINAL, total], [1, 0], clamp);
          const arranca = interpolate(g, [0, MUSICA_RAMPA], [0, 1], clamp);
          return sube * baja * arranca;
        }}
      />
      <Sequence from={finTomas} durationInFrames={PLACA_NINOS_FR}>
        <PlacaNinos />
      </Sequence>
      <Sequence from={finTomas + PLACA_NINOS_FR - CRUCE_LOGO} durationInFrames={CIERRE_LOGO}>
        <LogoFinal />
      </Sequence>
    </AbsoluteFill>
  );
};

export { FLASH_SUBE_N };
