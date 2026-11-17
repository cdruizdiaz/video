// Gráficos del ep. 2 de "Quién es quién en el mundo de la IA" (Volto): mismo lenguaje que el ep. 1 (vidrio oscuro,
// New Black, naranja Volto, un pop por elemento, apoyados sobre la cabeza con aire) y contenido propio:
//  - apertura: la ruleta del ep. 1, que ahora frena en INFERENCIA (de GraficosEp1);
//  - logos OpenAI y Anthropic, uno por nombre (LogosModelos del ep. 1);
//  - tarjeta "INFERENCIA COMO SERVICIO" con un rack de servidores que se arma y titila;
//  - "PRECIO POR TOKEN": una palabra que se parte en tokens y cada uno recibe su "$";
//  - "PROVEEDOR INFERENCIA" sola en la píldora naranja, con entrada animada (punto que cae, se estira, palabras);
//  - aumentos de hardware: RAM, GPU, SSD, CPU, una píldora por palabra con flecha naranja hacia arriba.
// `base` = y del borde de abajo de cada gráfico (calculada en composiciones.tsx con el seguimiento de la cara).
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MARCAS } from "../../marcas";
import {
  Apertura,
  CHIP_ALTO,
  CHIP_TAMANO,
  CLARO,
  clamp,
  FUNDIDO,
  fundido,
  LogosModelos,
  NARANJA,
  pop,
  SOMBRA_TEXTO,
  vidrio,
  type Modelo,
} from "../2026-11-06_volto_ep1-laboratorios-ia/GraficosEp1";

// ---------- Constantes ----------
const m = MARCAS.volto;
// Tarjeta "inferencia como servicio"
// la tarjeta de dos renglones de la v. A (en la B fue una píldora de un renglón: al usuario le gustaba más esta)
const TARJETA_ANCHO = 960;
const TARJETA_ALTO = 200;
const RACK_UNIDADES = 3;
const RACK_PASO = 8; // frames entre unidades del rack
const LED_PERIODO = 14; // frames del titilar de los LEDs
// Tokens
const TOKENS = ["in", "fer", "en", "cia"];
const TOKEN_ALTO = 76;
const TOKEN_TAMANO = 36;
const TOKEN_SEPARACION = 18;
const TOKEN_PARTE = 12; // frame en que la palabra se parte
const TOKEN_PASO = 7; // frames entre los "$" de cada token
const TOKENS_TITULO = 40; // px del título
const TOKENS_TITULO_A_FILA = 46; // deja lugar para los "$" que asoman arriba de cada token
// Hardware
const HARD_ANCHO = 196;
const HARD_SEPARACION = 20;

// ---------- Tarjeta "INFERENCIA / COMO SERVICIO" con un rack que se arma ----------
const Rack: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={128} height={128} viewBox="0 0 128 128">
    {Array.from({ length: RACK_UNIDADES }, (_, i) => {
      const entra = interpolate(frame, [4 + i * RACK_PASO, 12 + i * RACK_PASO], [0, 1], { ...clamp, easing: m.ease });
      const y = 98 - i * 40;
      const prendido = Math.floor((frame + i * 5) / LED_PERIODO) % 2 === 0;
      return (
        <g key={i} opacity={entra} transform={`translate(0 ${(1 - entra) * -18})`}>
          <rect x={8} y={y} width={112} height={30} rx={7} fill="none" stroke={CLARO} strokeWidth={3} />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={20 + k * 12} y={y + 9} width={6} height={12} rx={2} fill={CLARO} opacity={0.55} />
          ))}
          <circle cx={92} cy={y + 15} r={5} fill={prendido ? NARANJA : CLARO} opacity={prendido ? 1 : 0.45} />
          <circle cx={106} cy={y + 15} r={5} fill={CLARO} opacity={prendido ? 0.45 : 0.9} />
        </g>
      );
    })}
  </svg>
);

export const TarjetaServicio: React.FC<{ dur: number; base: number }> = ({ dur, base }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps);
  const texto = interpolate(frame, [6, 6 + FUNDIDO], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: fundido(frame, dur) }}>
      <div
        style={{
          ...vidrio,
          position: "absolute",
          left: (1080 - TARJETA_ANCHO) / 2,
          top: base - TARJETA_ALTO,
          width: TARJETA_ANCHO,
          height: TARJETA_ALTO,
          borderRadius: 34,
          border: `2px solid rgba(249,125,85,0.75)`,
          display: "flex",
          alignItems: "center",
          gap: 40,
          padding: "0 56px",
          boxSizing: "border-box",
          transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})`,
        }}
      >
        <Rack frame={frame} />
        <div style={{ opacity: texto, transform: `translateX(${(1 - texto) * 18}px)` }}>
          <div style={{ fontFamily: m.fuenteTitulos, fontWeight: 500, fontSize: 30, letterSpacing: "0.32em", color: NARANJA }}>
            INFERENCIA
          </div>
          <div
            style={{
              fontFamily: m.fuenteTitulos,
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.05,
              whiteSpace: "nowrap",
              color: CLARO,
              marginTop: 6,
            }}
          >
            COMO SERVICIO
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- "PRECIO POR TOKEN": la palabra se parte en tokens y cada uno recibe su "$" ----------
const anchoToken = (t: string) => 56 + t.length * 24;

export const PrecioPorToken: React.FC<{ dur: number; base: number }> = ({ dur, base }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const parte = interpolate(frame, [TOKEN_PARTE, TOKEN_PARTE + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const anchos = TOKENS.map(anchoToken);
  const total = anchos.reduce((a, b) => a + b, 0) + (TOKENS.length - 1) * TOKEN_SEPARACION * parte;
  let x = (1080 - total) / 2;
  const top = base - TOKEN_ALTO;
  return (
    <AbsoluteFill style={{ opacity: fundido(frame, dur) }}>
      <div
        style={{
          position: "absolute",
          top: top - TOKENS_TITULO_A_FILA - TOKENS_TITULO * 1.1,
          width: 1080,
          textAlign: "center",
          fontFamily: m.fuenteTitulos,
          fontWeight: 600,
          fontSize: TOKENS_TITULO,
          letterSpacing: "0.14em",
          color: CLARO,
          textShadow: SOMBRA_TEXTO,
        }}
      >
        PRECIO POR <span style={{ color: NARANJA }}>TOKEN</span>
      </div>
      {TOKENS.map((t, i) => {
        const izq = x;
        x += anchos[i] + TOKEN_SEPARACION * parte;
        const dolar = pop(frame, fps, TOKEN_PARTE + 10 + i * TOKEN_PASO);
        // pegados forman una sola píldora (bordes redondeados solo en las puntas); al partirse, cada uno es una
        const radio = (lado: "i" | "d") =>
          (lado === "i" && i === 0) || (lado === "d" && i === TOKENS.length - 1) ? TOKEN_ALTO / 2 : (TOKEN_ALTO / 2) * parte;
        return (
          <div key={t} style={{ position: "absolute", left: izq, top, width: anchos[i], height: TOKEN_ALTO }}>
            <div
              style={{
                ...vidrio,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                borderRadius: `${radio("i")}px ${radio("d")}px ${radio("d")}px ${radio("i")}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: m.fuenteTitulos,
                fontWeight: 600,
                fontSize: TOKEN_TAMANO,
                letterSpacing: "0.02em",
                color: CLARO,
              }}
            >
              {t}
            </div>
            <div
              style={{
                position: "absolute",
                right: -10,
                top: -22,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: NARANJA,
                color: CLARO,
                fontFamily: m.fuenteTitulos,
                fontWeight: 700,
                fontSize: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                transform: `scale(${dolar})`,
              }}
            >
              $
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Aumentos de hardware: una píldora por palabra, con flecha naranja hacia arriba ----------
const Flecha: React.FC<{ alto: number }> = ({ alto }) => (
  <svg width={alto * 0.62} height={alto} viewBox="0 0 20 32">
    <path d="M10 30 V4 M2 12 L10 3 L18 12" fill="none" stroke={NARANJA} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Hardware: React.FC<{ dur: number; base: number; items: string[]; entradas: number[] }> = ({
  dur,
  base,
  items,
  entradas,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ancho = items.length * HARD_ANCHO + (items.length - 1) * HARD_SEPARACION;
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [dur - FUNDIDO, dur], [1, 0], clamp) }}>
      {items.map((it, i) => {
        const p = pop(frame, fps, entradas[i]);
        const op = interpolate(frame, [entradas[i], entradas[i] + FUNDIDO], [0, 1], clamp);
        const sube = interpolate(frame, [entradas[i] + 4, entradas[i] + 16], [10, 0], { ...clamp, easing: m.ease });
        return (
          <div
            key={it}
            style={{
              ...vidrio,
              position: "absolute",
              left: (1080 - ancho) / 2 + i * (HARD_ANCHO + HARD_SEPARACION),
              top: base - CHIP_ALTO,
              width: HARD_ANCHO,
              height: CHIP_ALTO,
              borderRadius: CHIP_ALTO / 2,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              opacity: op,
              transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
              fontFamily: m.fuenteTitulos,
              fontWeight: 600,
              fontSize: CHIP_TAMANO,
              letterSpacing: "0.02em",
              color: CLARO,
            }}
          >
            {it}
            <div style={{ transform: `translateY(${sube}px)`, display: "flex" }}>
              <Flecha alto={34} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- "PROVEEDOR INFERENCIA": sola, en la píldora naranja de la ruleta ----------
// Entrada (pedido 2026-11-12: "más movimiento al entrar"): un punto naranja cae con resorte, la píldora se estira a lo
// ancho con rebote, las palabras suben una por una con desenfoque y, ya quieta, la cruza un brillo.
const PROVEEDOR_ALTO = 92;
const PROVEEDOR_TAMANO = 46;
const PROVEEDOR_CAIDA = 90; // px desde donde cae el punto
const PROVEEDOR_ESTIRA = 6; // frame en que la píldora empieza a estirarse
const PROVEEDOR_PALABRA_DEMORA = 12; // frame de la primera palabra
const PROVEEDOR_PALABRA_PASO = 5;
const BRILLO_DEMORA = 26; // frames: el brillo cruza la píldora cuando ya está quieta
const BRILLO_DURA = 16;
export const PROVEEDOR_ALTO_TOTAL = PROVEEDOR_ALTO;

export const Proveedor: React.FC<{ dur: number; base: number; texto: string }> = ({ dur, base, texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const resorte = (demora: number, config = { damping: 9, stiffness: 160, mass: 0.6 }) =>
    spring({ frame: frame - demora, fps, config });
  const cae = resorte(0, { damping: 12, stiffness: 200, mass: 0.6 });
  const estira = resorte(PROVEEDOR_ESTIRA);
  const brillo = interpolate(frame, [BRILLO_DEMORA, BRILLO_DEMORA + BRILLO_DURA], [-30, 130], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const palabras = texto.split(" ");
  // ancho final aproximado (New Black ~0,66 em por letra en mayúsculas) para estirar desde un punto
  const anchoFinal = texto.length * PROVEEDOR_TAMANO * 0.66 + 96;
  const ancho = PROVEEDOR_ALTO + (anchoFinal - PROVEEDOR_ALTO) * Math.max(0, estira);
  const inclinacion = interpolate(estira, [0, 0.5, 1], [-6, 2, 0]);
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [dur - FUNDIDO, dur], [1, 0], clamp) }}>
      <div
        style={{
          position: "absolute",
          top: base - PROVEEDOR_ALTO,
          width: 1080,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(${(1 - cae) * -PROVEEDOR_CAIDA}px)`,
          opacity: interpolate(frame, [0, 3], [0, 1], clamp),
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            width: ancho,
            height: PROVEEDOR_ALTO,
            borderRadius: PROVEEDOR_ALTO / 2,
            background: NARANJA,
            boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3em",
            fontFamily: m.fuenteTitulos,
            fontWeight: 700,
            fontSize: PROVEEDOR_TAMANO,
            letterSpacing: "0.03em",
            color: CLARO,
            whiteSpace: "nowrap",
            transform: `rotate(${inclinacion}deg)`,
          }}
        >
          {palabras.map((w, k) => {
            const e = resorte(PROVEEDOR_PALABRA_DEMORA + k * PROVEEDOR_PALABRA_PASO);
            return (
              <span
                key={k}
                style={{
                  display: "inline-block",
                  opacity: interpolate(e, [0, 0.4], [0, 1], clamp),
                  transform: `translateY(${(1 - e) * 40}px) scale(${interpolate(e, [0, 1], [0.7, 1])})`,
                  filter: `blur(${(Math.max(0, 1 - e) * 6).toFixed(1)}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${brillo}%`,
              width: "22%",
              background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)",
              transform: "skewX(-18deg)",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Capa con todos los gráficos (frames de salida) ----------
type Tramo = { desde: number; hasta: number; base: number };
export type GraficosEp2Props = {
  apertura: Tramo & { ganador: number };
  logos: Tramo & { entradas: number[]; modelos: Modelo[] };
  servicio: Tramo;
  token: Tramo;
  proveedor: Tramo & { texto: string };
  hardware: Tramo & { items: string[]; entradas: number[] };
};

export const GraficosEp2: React.FC<GraficosEp2Props> = (g) => {
  const dur = (t: Tramo) => t.hasta - t.desde;
  return (
    <AbsoluteFill>
      <Sequence from={g.apertura.desde} durationInFrames={dur(g.apertura)} layout="none">
        <Apertura dur={dur(g.apertura)} base={g.apertura.base} ganador={g.apertura.ganador} />
      </Sequence>
      <Sequence from={g.logos.desde} durationInFrames={dur(g.logos)} layout="none">
        <LogosModelos
          dur={dur(g.logos)}
          base={g.logos.base}
          modelos={g.logos.modelos}
          entradas={g.logos.entradas.map((e) => e - g.logos.desde)}
        />
      </Sequence>
      <Sequence from={g.servicio.desde} durationInFrames={dur(g.servicio)} layout="none">
        <TarjetaServicio dur={dur(g.servicio)} base={g.servicio.base} />
      </Sequence>
      <Sequence from={g.token.desde} durationInFrames={dur(g.token)} layout="none">
        <PrecioPorToken dur={dur(g.token)} base={g.token.base} />
      </Sequence>
      <Sequence from={g.proveedor.desde} durationInFrames={dur(g.proveedor)} layout="none">
        <Proveedor dur={dur(g.proveedor)} base={g.proveedor.base} texto={g.proveedor.texto} />
      </Sequence>
      <Sequence from={g.hardware.desde} durationInFrames={dur(g.hardware)} layout="none">
        <Hardware
          dur={dur(g.hardware)}
          base={g.hardware.base}
          items={g.hardware.items}
          entradas={g.hardware.entradas.map((e) => e - g.hardware.desde)}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
