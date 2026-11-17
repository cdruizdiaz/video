// Reel de Cipax (9:16): persona hablando con transiciones de motion graphic en los cambios de idea, subtítulos en
// Montserrat Bold con palabra clave en píldora azul, píldoras de problemas, logo al nombrar la marca y placa final
// con el logo animado. Criterios: src/marcas/cipax/CRITERIOS.md. Datos en composiciones.ts del trabajo (segundos).
import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CIPAX_AZUL, CIPAX_MONTSERRAT, CIPAX_OSCURO, CIPAX_SALIDA } from "../../marcas/cipax/marca";
import { aCuadros, FPS, lineaDeTiempo, VENTANAS, type TipoTransicion } from "./calculos";
import { CapaTransicion, desenfoqueCamara, estiloEntrante } from "./Transiciones";
import { PlacaCipax } from "./PlacaCipax";

// ---------- Constantes ----------
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Subtítulos (zonas seguras de Reels/TikTok: ver CRITERIOS.md)
const SUBT_TAMANO = 60;
const SUBT_PESO = 700;
const SUBT_ANCHO = 760;
const SUBT_BASE = 1400; // y de la base del bloque
const SUBT_ENTRA = 4; // cuadros de la máscara que sube
const SUBT_SOMBRA = "0 3px 16px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.35)";
const SUBT_HUECO_MAX = 4;
// Píldoras de problemas
const PILDORA_Y = 300; // centro vertical (zona segura: y ≥ 220)
const PILDORA_ALTO = 84;
const PILDORA_ENTRA = 9;
const PILDORA_SALE = 6;
const VOZ_FUNDIDO = 2; // cuadros de fundido en cada borde de voz (sin clics)

// ---------- Datos ----------
export type TomaCipax = {
  src: string; // proxy (public/)
  desdeS: number;
  hastaS: number;
  duracionS: number; // del archivo (para validar manijas)
  voz?: string; // audio de la voz de esta toma (mismo tiempo que src)
  transicion?: TipoTransicion; // hacia la toma siguiente
  logoDesdeS?: number; // transicion "isotipo": segundo de esta toma en que entra el logo
};
export type SubtituloCipax = { texto: string; inicioS: number; finS: number; resaltar?: string };
export type PildoraCipax = { texto: string; icono: "embudo" | "banco" | "grafico"; inicioS: number };
export type SonidoCipax = { src: string; inicioS: number; vol?: number };
export type ReelCipaxProps = {
  tomas: TomaCipax[];
  subtitulos: SubtituloCipax[];
  mostrarSubtitulos: boolean;
  pildoras?: { items: PildoraCipax[]; finS: number };
  placa: { durS: number; lema?: string };
  musica?: { src: string; puntos: [number, number][] }; // [segundo del reel, volumen]
  sonidos?: SonidoCipax[];
};

export const duracionReelCipax = (p: ReelCipaxProps) => lineaDeTiempo(p.tomas).fin + aCuadros(p.placa.durS);

// Subtítulos sin superposición ni parpadeo
export const tramosSubtitulosCipax = (subs: SubtituloCipax[]) => {
  const orden = [...subs].sort((a, b) => a.inicioS - b.inicioS);
  return orden.map((s, i) => {
    const ini = aCuadros(s.inicioS);
    let fin = Math.max(ini + 1, aCuadros(s.finS));
    const sig = orden[i + 1] ? aCuadros(orden[i + 1].inicioS) : null;
    if (sig !== null && (fin > sig || sig - fin <= SUBT_HUECO_MAX)) fin = Math.max(ini + 1, sig);
    return { ...s, ini, dur: fin - ini };
  });
};

// ---------- Piezas ----------
const Toma: React.FC<{
  c: TomaCipax;
  desde: number; // cuadro del reel donde arranca la Sequence
  manijaAntes: number;
  corteEntrada: number | null; // cuadro del reel del corte de entrada
  tipoEntrada: TipoTransicion;
  corteSalida: number | null;
  tipoSalida: TipoTransicion;
  id: string;
}> = ({ c, desde, manijaAntes, corteEntrada, tipoEntrada, corteSalida, tipoSalida, id }) => {
  const local = useCurrentFrame();
  const g = desde + local;
  const estilo = corteEntrada !== null ? estiloEntrante(tipoEntrada, g - corteEntrada) : {};
  let blur = 0;
  if (corteEntrada !== null && tipoEntrada === "camara") blur = Math.max(blur, desenfoqueCamara(g - corteEntrada));
  if (corteSalida !== null && tipoSalida === "camara") blur = Math.max(blur, desenfoqueCamara(g - corteSalida));
  const filtro = `cpx-vblur-${id}`;
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...estilo }}>
      {blur > 0.2 ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id={filtro} x="0" y="-10%" width="100%" height="120%">
              <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} edgeMode="duplicate" />
            </filter>
          </defs>
        </svg>
      ) : null}
      <OffthreadVideo
        src={staticFile(c.src)}
        trimBefore={aCuadros(c.desdeS) - manijaAntes}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: blur > 0.2 ? `url(#${filtro})` : undefined }}
      />
    </AbsoluteFill>
  );
};

const Subtitulo: React.FC<{ s: SubtituloCipax }> = ({ s }) => {
  const frame = useCurrentFrame();
  const e = CIPAX_SALIDA(interpolate(frame, [0, SUBT_ENTRA], [0, 1], clamp));
  const partes = s.resaltar && s.texto.includes(s.resaltar) ? s.texto.split(s.resaltar) : [s.texto];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: (1080 - SUBT_ANCHO) / 2,
          width: SUBT_ANCHO,
          bottom: 1920 - SUBT_BASE,
          textAlign: "center",
          clipPath: `inset(-40px -40px ${(1 - e) * 100}% -40px)`,
        }}
      >
        <div
          style={{
            fontFamily: CIPAX_MONTSERRAT,
            fontWeight: SUBT_PESO,
            fontSize: SUBT_TAMANO,
            lineHeight: 1.22,
            color: "#FFFFFF",
            textShadow: SUBT_SOMBRA,
            textWrap: "balance",
            transform: `translateY(${(1 - e) * 40}px)`,
          }}
        >
          {partes.length > 1 ? (
            <>
              {partes[0]}
              <span
                style={{
                  background: CIPAX_AZUL,
                  borderRadius: 14,
                  padding: "0 14px 4px",
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                  textShadow: "none",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                }}
              >
                {s.resaltar}
              </span>
              {partes.slice(1).join(s.resaltar)}
            </>
          ) : (
            s.texto
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Icono: React.FC<{ tipo: PildoraCipax["icono"] }> = ({ tipo }) => {
  const trazo = { fill: "none", stroke: "#FFFFFF", strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={34} height={34} viewBox="0 0 34 34">
      {tipo === "embudo" ? <path d="M5 7h24l-9 11v8l-6 3V18z" {...trazo} /> : null}
      {tipo === "banco" ? (
        <>
          <path d="M4 13L17 5l13 8z" {...trazo} />
          <path d="M8 15v10M14 15v10M20 15v10M26 15v10M4 29h26" {...trazo} />
        </>
      ) : null}
      {tipo === "grafico" ? (
        <>
          <path d="M5 28h24" {...trazo} />
          <path d="M7 22l7-7 5 4 9-10" {...trazo} />
          <path d="M23 9h5v5" {...trazo} />
        </>
      ) : null}
    </svg>
  );
};

// Una píldora a la vez: la nueva sube por máscara y empuja a la anterior hacia arriba (que se va).
const Pildoras: React.FC<{ items: PildoraCipax[]; fin: number }> = ({ items, fin }) => {
  const frame = useCurrentFrame(); // cuadros del reel
  const sale = interpolate(frame, [fin - PILDORA_SALE, fin], [1, 0], clamp);
  return (
    <AbsoluteFill>
      {items.map((it, i) => {
        const ini = aCuadros(it.inicioS);
        const sig = items[i + 1] ? aCuadros(items[i + 1].inicioS) : Infinity;
        if (frame < ini || frame >= sig + PILDORA_ENTRA) return null;
        const e = CIPAX_SALIDA(interpolate(frame, [ini, ini + PILDORA_ENTRA], [0, 1], clamp));
        const empujada = Number.isFinite(sig) ? CIPAX_SALIDA(interpolate(frame, [sig, sig + PILDORA_ENTRA], [0, 1], clamp)) : 0;
        const y = PILDORA_Y + (1 - e) * 60 - empujada * 110;
        const ancho = interpolate(e, [0, 1], [0.6, 1]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540,
              top: y,
              transform: `translate(-50%, -50%) scaleX(${ancho})`,
              opacity: Math.min(e * 1.6, 1) * (1 - empujada) * sale,
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: PILDORA_ALTO,
              padding: "0 34px 0 14px",
              borderRadius: PILDORA_ALTO / 2,
              background: "rgba(33,37,41,0.78)",
              border: "1.5px solid rgba(255,255,255,0.16)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ width: 58, height: 58, borderRadius: 29, background: CIPAX_AZUL, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icono tipo={it.icono} />
            </div>
            <span style={{ fontFamily: CIPAX_MONTSERRAT, fontWeight: 600, fontSize: 38, color: "#FFFFFF", clipPath: `inset(0 0 ${(1 - e) * 100}% 0)` }}>{it.texto}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Composición ----------
export const ReelCipax: React.FC<ReelCipaxProps> = ({ tomas, subtitulos, mostrarSubtitulos, pildoras, placa, musica, sonidos }) => {
  const { inicios, cortes, fin, tramos } = lineaDeTiempo(tomas);
  const durPlaca = aCuadros(placa.durS);
  const volMusica = (f: number) =>
    musica ? interpolate(f / FPS, musica.puntos.map((p) => p[0]), musica.puntos.map((p) => p[1]), clamp) : 0;
  // transiciones: una por corte (la última toma lleva la de la placa)
  const transiciones = tomas.map((c, i) => {
    const tipo = c.transicion ?? "corte";
    const corte = cortes[i];
    let antes = VENTANAS[tipo].antes;
    if (tipo === "isotipo" && c.logoDesdeS !== undefined) antes = corte - (inicios[i] + aCuadros(c.logoDesdeS) - aCuadros(c.desdeS));
    return { tipo, corte, antes, despues: VENTANAS[tipo].despues };
  });
  return (
    <AbsoluteFill style={{ background: CIPAX_OSCURO }}>
      {tomas.map((c, i) => (
        <Sequence key={`v${i}`} from={tramos[i].desde} durationInFrames={tramos[i].hasta - tramos[i].desde} layout="none">
          <Toma
            c={c}
            id={String(i)}
            desde={tramos[i].desde}
            manijaAntes={tramos[i].manijaAntes}
            corteEntrada={i > 0 ? cortes[i - 1] : null}
            tipoEntrada={i > 0 ? tomas[i - 1].transicion ?? "corte" : "corte"}
            corteSalida={i < tomas.length - 1 ? cortes[i] : null}
            tipoSalida={c.transicion ?? "corte"}
          />
        </Sequence>
      ))}
      <Sequence from={fin} durationInFrames={durPlaca} layout="none">
        <PlacaCipax lema={placa.lema} />
      </Sequence>
      {pildoras ? (
        <Sequence durationInFrames={aCuadros(pildoras.finS)} layout="none">
          <Pildoras items={pildoras.items} fin={aCuadros(pildoras.finS)} />
        </Sequence>
      ) : null}
      {transiciones.map((tr, i) =>
        tr.tipo === "corte" || tr.antes + tr.despues <= 0 ? null : (
          <Sequence key={`t${i}`} from={tr.corte - tr.antes} durationInFrames={tr.antes + Math.max(1, tr.despues)} layout="none">
            <CapaTransicionLocal tipo={tr.tipo} antes={tr.antes} />
          </Sequence>
        ),
      )}
      {mostrarSubtitulos
        ? tramosSubtitulosCipax(subtitulos).map((s, i) => (
            <Sequence key={`s${i}`} from={s.ini} durationInFrames={s.dur} layout="none">
              <Subtitulo s={s} />
            </Sequence>
          ))
        : null}
      {tomas.map((c, i) =>
        c.voz ? (
          <Sequence key={`a${i}`} from={inicios[i]} durationInFrames={cortes[i] - inicios[i]} layout="none">
            <Audio
              src={staticFile(c.voz)}
              trimBefore={aCuadros(c.desdeS)}
              volume={(f) => Math.min(interpolate(f, [0, VOZ_FUNDIDO], [0, 1], clamp), interpolate(f, [cortes[i] - inicios[i] - VOZ_FUNDIDO, cortes[i] - inicios[i]], [1, 0], clamp))}
            />
          </Sequence>
        ) : null,
      )}
      {musica ? <Audio src={staticFile(musica.src)} volume={volMusica} /> : null}
      {(sonidos ?? []).map((s, i) => (
        <Sequence key={`x${i}`} from={aCuadros(s.inicioS)} layout="none">
          <Audio src={staticFile(s.src)} volume={() => s.vol ?? 0.4} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// La capa recibe el cuadro relativo al corte
const CapaTransicionLocal: React.FC<{ tipo: TipoTransicion; antes: number }> = ({ tipo, antes }) => {
  const frame = useCurrentFrame();
  return <CapaTransicion tipo={tipo} t={frame - antes} antes={antes} />;
};
