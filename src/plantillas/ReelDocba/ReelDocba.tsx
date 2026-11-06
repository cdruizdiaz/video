// Reel de DOCBA (loft social de Nueva Córdoba): persona hablando + inserts con voz en off, subtítulos blancos en
// IBM Plex Sans, música y placa final con el logotipo en motion graphic. Todo se arma en composiciones.ts del trabajo
// con `armarReelDocba` (tiempos en segundos; acá se pasan a cuadros). Criterios del cliente: src/marcas/docba/CRITERIOS.md.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { LOGO_DOCBA } from "../../marcas/docba/logo";
import { DOCBA_GABRIELLA, DOCBA_PLEX_COND } from "../../marcas/docba/fuentes";
import {
  BarridoLuz,
  estiloDestello,
  estiloFlash,
  estiloFlashCorto,
  intensidadFlash,
  intensidadFlashCorto,
  progresoDestello,
  VeloBloom,
  VeloLuz,
} from "../comunes/flashLuz";
import { MenuDigital } from "./MenuDigital";
import { IconosProyecto, type IconoProyecto } from "./IconosProyecto";
import { PlacaChat, FONDO_BRILLO, FONDO_DESENFOQUE, FONDO_ESCALA, FONDO_VELO, type PlacaChatProps } from "./PlacaChat";
import {
  DOCBA_AZUL,
  DOCBA_HUESO,
  DOCBA_NARANJA,
  docba,
} from "../../marcas/docba/marca";

// ---------- Constantes de animación ----------
const FPS = 30;
const ROTULO_MAX = 190; // px: tamaño máximo del texto sobre la cabeza (Gabriella Heavy, hueso); el real es ROTULO_ESCALA × el que hace entrar la frase más larga en una línea
const ROTULO_MIN = 90;
const ROTULO_LADOS = 50; // px de margen a cada lado
const ROTULO_SOBRE = 36; // px de aire entre el texto y la cabeza
const ROTULO_ARRIBA = 160; // px desde el borde superior: el texto no sube más que esto
const ROTULO_ESCALA = 0.62; // el texto va más chico que el máximo que entra en una línea (pedido de la usuaria, 2026-10-30)
const PUSH_INSERT = 0.07; // acercamiento lento de cada insert (escala extra)
const FOCO_ZOOM = 1.1; // escala a la que llega el zoom rápido del foco
const FOCO_ASIENTA = 36; // cuadros que tarda en acomodarse de FOCO_ZOOM a 1,0
const PUSH_ALEJAR = 0.035; // alejamiento apenas perceptible y suavizado (con 0,12 se veía muy digital)
const SUBT_TAMANO = 66; // px, en 1080 de ancho (IBM Plex Sans Condensed Medium; la Regular se probó en el borrador F y se descartó)
const SUBT_LADOS = 170; // px de margen a cada lado: el texto no llega a los bordes
const SUBT_PESO = 500;
const SUBT_HUECO_MAX = 4; // cuadros: un hueco más corto que esto entre dos subtítulos se cierra (sin parpadeo)
const SUBT_ABAJO = 430; // px desde el borde inferior hasta la base del subtítulo (fuera de la zona de la interfaz)
const SUBT_SOMBRA = "0 2px 18px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.35)";
const VELO_SUBT =
  "linear-gradient(to top, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.16) 28%, rgba(0,0,0,0) 46%)";
const PLACA_LOGO_ANCHO = 820; // px
const PLACA_VELO_ENTRA = 14; // cuadros que tarda en entrar el velo de la placa sobre el video
const PLACA_SUBE = 520; // px que sube el logotipo cuando la placa va sobre el video (queda sobre la puerta, lejos de la persona)
const VELO_PLACA = "linear-gradient(to bottom, rgba(48,60,67,0.62) 0%, rgba(48,60,67,0.78) 50%, rgba(48,60,67,0.4) 100%)"; // azul petróleo translúcido
const PLACA_BARRIDO = 16; // cuadros del panel naranja que sube
const PLACA_LETRA_DESDE = 12; // cuadro en que entra la primera letra
const PLACA_LETRA_PASO = 4; // cuadros entre letras
const PLACA_LETRA_DURA = 18;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.out(Easing.cubic);
const barrido = Easing.inOut(Easing.cubic);
const salto = Easing.out(Easing.exp);

// ---------- Datos ----------
export type ClipDocba = {
  src: string; // dentro de public/
  desdeS: number; // segundo del proxy donde arranca
  durS: number;
  inicioS: number; // segundo de la línea de tiempo donde entra (lo calcula armarReelDocba)
  empuje?: boolean; // acercamiento lento (inserts)
  desplazaX?: number[]; // px (en 1080) de desplazamiento horizontal por cuadro del plano: mantiene centrado un motivo que la cámara en mano corre mientras se acerca
  push?: number; // escala extra del acercamiento lento (por defecto PUSH_INSERT); p. ej. 0,05 para un zoom in leve
  alejar?: boolean; // alejamiento lento (contrasta con el acercamiento del insert anterior)
  foco?: number; // cuadros de "foco": arranca desenfocado y oscurecido igual que el fondo congelado del chat (empalme sin salto), se enfoca y da un zoom rápido
  zoom?: number; // escala fija (plano más cercano; con origen "50% 0%" baja el motivo y recorta el aire de abajo)
  origen?: string; // transform-origin del acercamiento
};
export type PistaDocba = {
  src: string;
  desdeS: number;
  durS: number;
  inicioS: number;
  vol?: number;
  entraS?: number; // fundido de entrada
  saleS?: number; // fundido de salida
};
export type SubtituloDocba = { texto: string; inicioS: number; finS: number };
export type RotuloDocba = { texto: string; inicioS: number; finS: number; x?: number; y?: number; centroY?: number; tam?: number; interlineado?: number; ene?: number }; // ene: grosor extra (px de trazo) solo para la virgulilla de la ñ, que en Gabriella es muy fina. x, y: posición fija (px del centro y de la base del texto); sin ellas sigue la cabeza. centroY: centro vertical fijo del bloque (para frases de 1 y 2 renglones, un salto de línea en el texto separa renglones); tam: tamaño fijo en px
// Seguimiento de la cabeza (cabeza.py): un valor por cuadro desde inicioS (segundo del reel donde arranca el dato)
export type CabezaDocba = { inicioS: number; fps: number; x: number[]; top: number[] };
export type ReelDocbaProps = {
  clips: ClipDocba[];
  pistas: PistaDocba[];
  subtitulos: SubtituloDocba[];
  mostrarSubtitulos: boolean;
  rotulos?: RotuloDocba[]; // texto (Gabriella Heavy, naranja) sobre la cabeza de la chica, en lugar de subtítulos
  cabeza?: CabezaDocba;
  flashes?: number[]; // segundos del reel donde cae un corte con transición de luz (flash)
  flashesCortos?: number[]; // segundos de un corte con el flash corto de R1_VFinal (2 cuadros de sobreexposición con bloom justo antes del corte, nada después)
  destellos?: number[]; // segundos de un corte con un efecto parecido al flash, pero distinto: banda de luz cálida que cruza la imagen
  placa: { inicioS: number; durS: number; leyenda?: string; direccion?: string; invertida?: boolean; sobreVideo?: boolean; sfx?: { src: string; vol?: number; desdeS?: number } }; // sfx: efecto de sonido al aparecer (desdeS relativo al inicio de la placa) // leyenda/dirección: textos de la placa (por defecto los del manual)
  iconos?: IconoProyecto[]; // íconos animados sobre el video (nacieron / obstáculos / fin)
  chat?: { inicioS: number; durS: number } & PlacaChatProps; // placa de inicio de la usuaria (.ai) con los globos de un chat animados
  menu?: { inicioS: number; durS: number }; // la carta digital animada, a pantalla completa
  musica?: { src: string; desdeS: number; inicioS: number; puntos: [number, number][] }; // puntos: [segundo, volumen]
};

const f = (s: number) => Math.round(s * FPS);

// Cuadros [desde, duración] de cada subtítulo, sin superposiciones (dos textos a la vez se ven como un "glitch") y sin
// parpadeos: el que termina pegado al siguiente (hueco ≤ SUBT_HUECO_MAX) se alarga hasta él (sin cruzar un corte de plano).
export const tramosSubtitulos = (subs: SubtituloDocba[], cortes: number[] = []) => {
  const orden = [...subs].sort((a, b) => a.inicioS - b.inicioS);
  return orden.map((s, i) => {
    const ini = f(s.inicioS);
    let fin = Math.max(ini + 1, f(s.finS));
    const sig = orden[i + 1] ? f(orden[i + 1].inicioS) : null;
    if (sig !== null && (fin > sig || sig - fin <= SUBT_HUECO_MAX)) {
      // al cerrar el hueco nunca se pasa de un corte de plano: el texto no puede quedar sobre el clip siguiente
      const corte = cortes.find((c) => c >= fin && c <= sig);
      fin = Math.max(ini + 1, corte ?? sig);
    }
    return { texto: s.texto, ini, dur: fin - ini };
  });
};

// ---------- Piezas ----------
const Clip: React.FC<{ c: ClipDocba; dur: number }> = ({ c, dur }) => {
  const frame = useCurrentFrame();
  const avance = interpolate(frame, [0, dur], c.alejar ? [1, 0] : [0, 1], { ...clamp, easing: c.alejar ? Easing.inOut(Easing.sin) : undefined });
  // foco: p va de 0 a 1 en `foco` cuadros; la escala parte de FONDO_ESCALA, da un zoom rápido a FOCO_ZOOM y se acomoda sola a 1,0
  const p = c.foco ? Easing.out(Easing.cubic)(interpolate(frame, [0, c.foco], [0, 1], clamp)) : 1;
  const asienta = c.foco ? Easing.inOut(Easing.cubic)(interpolate(frame, [c.foco, c.foco + FOCO_ASIENTA], [0, 1], clamp)) : 1;
  const kFoco = c.foco ? (frame <= c.foco ? FONDO_ESCALA + (FOCO_ZOOM - FONDO_ESCALA) * p : FOCO_ZOOM + (1 - FOCO_ZOOM) * asienta) : 1;
  const k = kFoco * (c.zoom ?? 1) * (c.empuje || c.alejar ? 1 + (c.alejar ? PUSH_ALEJAR : c.push ?? PUSH_INSERT) * avance : 1);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <OffthreadVideo
        src={staticFile(c.src)}
        trimBefore={f(c.desdeS)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translateX(${c.desplazaX ? c.desplazaX[Math.min(frame, c.desplazaX.length - 1)] : 0}px) scale(${k})`,
          transformOrigin: c.origen ?? "50% 50%",
          filter: p < 1 ? `blur(${(1 - p) * FONDO_DESENFOQUE}px) brightness(${FONDO_BRILLO + (1 - FONDO_BRILLO) * p}) saturate(${1.1 - 0.1 * p})` : undefined,
        }}
      />
      {p < 1 ? <AbsoluteFill style={{ background: `rgba(24,32,38,${FONDO_VELO * (1 - p)})` }} /> : null}
    </AbsoluteFill>
  );
};

// Texto grande sobre la cabeza: Gabriella Heavy naranja, sin sombra, fijo, una línea, entra y sale en seco en el
// cuadro de la voz. Cada frase tiene su posición fija (x, y) calculada con el seguimiento de la cabeza.
const medir = (texto: string, tam: number) => {
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return texto.length * tam * 0.6;
  c.font = `${tam}px "${DOCBA_GABRIELLA}"`;
  return c.measureText(texto).width;
};
// Tamaño (px) con el que la frase entra justa en una línea
const tamUnaLinea = (texto: string) => {
  const ancho = 1080 - 2 * ROTULO_LADOS;
  for (let tam = ROTULO_MAX; tam > ROTULO_MIN; tam -= 2) {
    if (medir(texto, tam) <= ancho) return tam;
  }
  return ROTULO_MIN;
};
// Un solo tamaño para todas las frases: el de la más larga (que entre en una línea), ni un píxel menos de lo necesario.
export const tamRotulos = (rotulos: RotuloDocba[]) => Math.round(Math.min(ROTULO_MAX, ...rotulos.map((r) => tamUnaLinea(r.texto))) * ROTULO_ESCALA);
// La virgulilla de la ñ en Gabriella Heavy es un hilo: se superpone una copia de la ñ con trazo, recortada a la parte de arriba
// (por encima de la n), así engrosa solo el palito.
const ENE_RECORTE = "inset(0 0 58% 0)"; // deja ver solo la franja superior de la caja de la letra
const TextoConEne: React.FC<{ texto: string; trazo: number }> = ({ texto, trazo }) => (
  <>
    {texto.split(/([ñÑ])/).map((parte, i) =>
      parte === "ñ" || parte === "Ñ" ? (
        <span key={i} style={{ position: "relative", display: "inline-block" }}>
          {parte}
          <span style={{ position: "absolute", left: 0, top: 0, WebkitTextStroke: `${trazo}px currentColor`, clipPath: ENE_RECORTE }}>{parte}</span>
        </span>
      ) : (
        <React.Fragment key={i}>{parte}</React.Fragment>
      ),
    )}
  </>
);
const Rotulo: React.FC<{ r: RotuloDocba; tam: number; desde: number; cabeza?: CabezaDocba }> = ({ r, tam: tamComun, desde, cabeza }) => {
  let tam = tamComun;
  const local = useCurrentFrame();
  const global = desde + local;
  tam = r.tam ?? tam;
  const ancho = Math.max(...r.texto.split("\n").map((l) => medir(l, tam)));
  let x = r.x ?? 540;
  let base = r.y ?? 700;
  if (r.x === undefined && cabeza) {
    const i = Math.max(0, Math.min(cabeza.x.length - 1, Math.round(global - cabeza.inicioS * FPS)));
    x = cabeza.x[i];
    base = cabeza.top[i] - ROTULO_SOBRE;
  }
  x = Math.max(ROTULO_LADOS + ancho / 2, Math.min(1080 - ROTULO_LADOS - ancho / 2, x));
  if (r.centroY === undefined) base = Math.max(base, ROTULO_ARRIBA + tam);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x,
          top: r.centroY ?? base,
          transform: r.centroY !== undefined ? "translate(-50%, -50%)" : "translate(-50%, -100%)",
          whiteSpace: "pre",
          textAlign: "center",
          fontFamily: DOCBA_GABRIELLA,
          fontWeight: 400,
          fontSize: tam,
          lineHeight: r.interlineado ?? 1.02,
          color: DOCBA_NARANJA,
        }}
      >
        {r.ene ? <TextoConEne texto={r.texto} trazo={r.ene} /> : r.texto}
      </div>
    </AbsoluteFill>
  );
};

// Entra y sale en seco (sin fundido ni desplazamiento), en el cuadro exacto de la voz.
const Subtitulo: React.FC<{ texto: string }> = ({ texto }) => (
  <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
    <div
      style={{
        marginBottom: SUBT_ABAJO,
        padding: `0 ${SUBT_LADOS}px`,
        fontFamily: DOCBA_PLEX_COND,
        fontWeight: SUBT_PESO,
        fontSize: SUBT_TAMANO,
        lineHeight: 1.18,
        color: "#ffffff",
        textAlign: "center",
        whiteSpace: "pre-line",
        textShadow: SUBT_SOMBRA,
      }}
    >
      {texto}
    </div>
  </AbsoluteFill>
);

const Pista: React.FC<{ p: PistaDocba }> = ({ p }) => {
  const dur = f(p.durS);
  const vol = (frame: number) => {
    const fe = Math.max(1, f(p.entraS ?? 0));
    const fs = Math.max(1, f(p.saleS ?? 0));
    const e = p.entraS ? interpolate(frame, [0, fe], [0, 1], clamp) : 1;
    const s = p.saleS ? interpolate(frame, [dur - fs, dur], [1, 0], clamp) : 1;
    return (p.vol ?? 1) * Math.min(e, s);
  };
  return <Audio src={staticFile(p.src)} trimBefore={f(p.desdeS)} volume={vol} />;
};

// Placa final: panel naranja que sube, logotipo (aplicación secundaria: hueso sobre naranja) que se arma letra por
// letra, y las leyendas del manual ("Denominación de Origen Córdoba", dirección).
export const PlacaDocba: React.FC<{ leyenda?: string; direccion?: string; invertida?: boolean; sobreVideo?: boolean }> = ({
  invertida = false,
  sobreVideo = false,
  leyenda: textoLeyenda = "DENOMINACIÓN DE ORIGEN CÓRDOBA",
  direccion: textoDireccion = "BUENOS AIRES 864 · NUEVA CÓRDOBA",
}) => {
  const frame = useCurrentFrame();
  const panel = barrido(interpolate(frame, [0, PLACA_BARRIDO], [0, 1], clamp));
  const alto = (PLACA_LOGO_ANCHO * LOGO_DOCBA.alto) / LOGO_DOCBA.ancho;
  const leyenda = interpolate(frame, [40, 58], [0, 1], clamp);
  const direccion = interpolate(frame, [54, 72], [0, 1], clamp);
  const trazo = salto(interpolate(frame, [36, 62], [0, 1], clamp));
  const velo = suave(interpolate(frame, [0, PLACA_VELO_ENTRA], [0, 1], clamp));
  const colorLogo = sobreVideo ? DOCBA_HUESO : invertida ? DOCBA_NARANJA : DOCBA_HUESO;
  return (
    <AbsoluteFill>
      {sobreVideo ? (
        <AbsoluteFill style={{ background: VELO_PLACA, opacity: velo }} />
      ) : null}
      <AbsoluteFill
        style={{
          display: sobreVideo ? "none" : undefined,
          background: invertida ? DOCBA_HUESO : DOCBA_NARANJA, // invertida: fondo hueso y logotipo naranja (aplicación principal del manual)
          clipPath: `inset(${(1 - panel) * 100}% 0 0 0)`,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: sobreVideo ? PLACA_SUBE : 0 }}>
        <div style={{ position: "relative", width: PLACA_LOGO_ANCHO, height: alto }}>
          <svg
            width={PLACA_LOGO_ANCHO}
            height={alto}
            viewBox={`0 0 ${LOGO_DOCBA.ancho} ${LOGO_DOCBA.alto}`}
            style={{ overflow: "hidden", display: "block" }}
          >
            {LOGO_DOCBA.letras.map((d, i) => {
              const t = salto(
                interpolate(
                  frame,
                  [
                    PLACA_LETRA_DESDE + i * PLACA_LETRA_PASO,
                    PLACA_LETRA_DESDE + i * PLACA_LETRA_PASO + PLACA_LETRA_DURA,
                  ],
                  [0, 1],
                  clamp,
                ),
              );
              return (
                <path
                  key={i}
                  d={d}
                  fill={colorLogo}
                  fillRule="evenodd"
                  transform={`translate(0 ${(1 - t) * LOGO_DOCBA.alto * 1.15})`}
                />
              );
            })}
          </svg>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: alto + 40,
              height: 4,
              width: PLACA_LOGO_ANCHO * trazo,
              background: sobreVideo ? DOCBA_NARANJA : DOCBA_AZUL,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: alto + 74,
              textAlign: "center",
              fontFamily: docba.fuente,
              fontWeight: 600,
              fontSize: textoLeyenda.length > 32 ? 25 : 27,
              letterSpacing: textoLeyenda.length > 32 ? "0.2em" : "0.34em",
              color: sobreVideo ? DOCBA_HUESO : DOCBA_AZUL,
              opacity: leyenda,
              transform: `translateY(${(1 - suave(leyenda)) * 12}px)`,
            }}
          >
            {textoLeyenda}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: alto + 128,
              textAlign: "center",
              fontFamily: docba.fuente,
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: "0.22em",
              color: sobreVideo ? DOCBA_HUESO : invertida ? DOCBA_NARANJA : DOCBA_HUESO,
              opacity: direccion,
              transform: `translateY(${(1 - suave(direccion)) * 12}px)`,
            }}
          >
            {textoDireccion}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Composición ----------
export const duracionReelDocba = (p: ReelDocbaProps) => f(p.placa.inicioS + p.placa.durS);

export const ReelDocba: React.FC<ReelDocbaProps> = ({
  clips,
  pistas,
  subtitulos,
  mostrarSubtitulos,
  rotulos,
  cabeza,
  flashes,
  flashesCortos,
  destellos,
  placa,
  menu,
  iconos,
  chat,
  musica,
}) => {
  const volMusica = (frameLocal: number) => {
    if (!musica) return 0;
    const t = musica.inicioS + frameLocal / FPS;
    const xs = musica.puntos.map((p) => p[0]);
    const ys = musica.puntos.map((p) => p[1]);
    return interpolate(t, xs, ys, clamp);
  };
  const cuadroActual = useCurrentFrame();
  const e = Math.max(0, ...(flashes ?? []).map((s) => intensidadFlash(cuadroActual, f(s))));
  const ec = Math.max(0, ...(flashesCortos ?? []).map((s) => intensidadFlashCorto(cuadroActual, f(s))));
  const pd = Math.max(0, ...(destellos ?? []).map((s) => { const q = progresoDestello(cuadroActual, f(s)); return q > 0 && q < 1 ? q : 0; }));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ ...estiloFlash(e), ...estiloDestello(pd), ...estiloFlashCorto(ec) }}>
      {clips.map((c, i) => {
        // Cada clip llega justo hasta el cuadro donde entra el siguiente (redondear por separado deja cuadros negros)
        const dur = (i < clips.length - 1 ? f(clips[i + 1].inicioS) : f(c.inicioS) + f(c.durS)) - f(c.inicioS);
        return (
          <Sequence key={i} from={f(c.inicioS)} durationInFrames={dur} layout="none">
            <Clip c={c} dur={dur} />
          </Sequence>
        );
      })}
      {menu ? (
        <Sequence from={f(menu.inicioS)} durationInFrames={f(menu.durS)} layout="none">
          <MenuDigital dur={f(menu.durS)} />
        </Sequence>
      ) : null}
      </AbsoluteFill>
      {e > 0 ? <VeloLuz e={e} /> : null}
      <BarridoLuz p={pd} />
      {ec > 0 ? <VeloBloom e={ec} /> : null}
      {iconos?.length ? <IconosProyecto iconos={iconos} /> : null}
      {chat ? (
        <Sequence from={f(chat.inicioS)} durationInFrames={f(chat.durS)} layout="none">
          <PlacaChat {...chat} dur={f(chat.durS)} />
        </Sequence>
      ) : null}
      {mostrarSubtitulos ? (
        <>
          <Sequence from={chat ? f(chat.inicioS + chat.durS) : 0} durationInFrames={f(placa.inicioS) - (chat ? f(chat.inicioS + chat.durS) : 0)} layout="none">
            <AbsoluteFill style={{ background: VELO_SUBT }} />
          </Sequence>
          {tramosSubtitulos(subtitulos, clips.map((c) => f(c.inicioS))).map((s, i) => (
            <Sequence key={i} from={s.ini} durationInFrames={s.dur} layout="none">
              <Subtitulo texto={s.texto} />
            </Sequence>
          ))}
        </>
      ) : null}
      {mostrarSubtitulos && rotulos?.length
        ? rotulos.map((r, i) => (
            <Sequence key={`rot${i}`} from={f(r.inicioS)} durationInFrames={Math.max(1, f(r.finS) - f(r.inicioS))} layout="none">
              <Rotulo r={r} tam={tamRotulos(rotulos)} desde={f(r.inicioS)} cabeza={cabeza} />
            </Sequence>
          ))
        : null}
      <Sequence from={f(placa.inicioS)} durationInFrames={f(placa.durS)} layout="none">
        <PlacaDocba leyenda={placa.leyenda} direccion={placa.direccion} invertida={placa.invertida} sobreVideo={placa.sobreVideo} />
      </Sequence>
      {placa.sfx ? (
        <Sequence from={f(placa.inicioS + (placa.sfx.desdeS ?? 0))} layout="none">
          <Audio src={staticFile(placa.sfx.src)} volume={() => placa.sfx?.vol ?? 0.5} />
        </Sequence>
      ) : null}
      {pistas.map((p, i) => (
        <Sequence key={i} from={f(p.inicioS)} durationInFrames={f(p.durS)} layout="none">
          <Pista p={p} />
        </Sequence>
      ))}
      {musica ? (
        <Sequence from={f(musica.inicioS)} layout="none">
          <Audio src={staticFile(musica.src)} trimBefore={f(musica.desdeS)} volume={volMusica} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
