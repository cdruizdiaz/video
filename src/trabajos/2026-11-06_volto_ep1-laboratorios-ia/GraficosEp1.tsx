// Gráficos del ep. 1 de "Quién es quién en el mundo de la IA" (Volto), replicados de la v2 de la otra PC con las
// correcciones del 2026-11-06:
//  - título en dos renglones y más grande;
//  - la fila de chips es una RULETA: gira rápido, frena y queda solo el elegido (AI Labs);
//  - todos los gráficos apoyan su borde de abajo sobre la cabeza con un aire leve (`base` = y del borde de abajo,
//    calculada en composiciones.tsx con el seguimiento de la cara), no pegados al margen de arriba.
// Paleta de Volto; un pop por gráfico; fundido de 6 cuadros por elemento.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MARCAS } from "../../marcas";

// ---------- Constantes ----------
export const FUNDIDO = 6; // frames de entrada/salida de cada elemento
export const TINTA_VIDRIO = "rgba(14, 34, 36, 0.62)"; // #0e2224 translúcido
export const BORDE_VIDRIO = "rgba(245, 245, 237, 0.28)";
export const CLARO = "#f5f5ed";
export const NARANJA = "#f97d55";
const VERDE = "#406162";
const CELESTE = "#a0c9cb";
export const SOMBRA_TEXTO = "0 2px 6px rgba(0,0,0,0.45), 0 6px 24px rgba(0,0,0,0.35)";
// Apertura
const TITULO_TAMANO = 66; // antes ~26 px en un renglón: no se leía
const TITULO_INTERLINEA = 1.08;
const TITULO_ESPACIADO = "0.05em";
const TITULO_A_RULETA = 34; // px entre el título y la ruleta
export const CHIP_ALTO = 76;
export const CHIP_TAMANO = 34;
const CHIP_SEPARACION = 26;
export const RULETA_ITEMS = ["TOOLS", "AI LABS", "INFERENCIA", "HARNESS"];
const RULETA_GANADOR = 1; // AI LABS
const RULETA_VUELTAS = 4; // vueltas completas antes de frenar
export const RULETA_GIRO = 50; // frames de giro (frena con ease-out)
export const RULETA_DEMORA = 10; // frames desde que entra el título hasta que arranca la ruleta
const RULETA_DESVANECE = 8; // frames en que se van los perdedores
const RULETA_DESENFOQUE = 9; // px de desenfoque a máxima velocidad
// Tarjeta "Objetivo"
const TARJETA_ANCHO = 960;
const TARJETA_ALTO = 200;
// Logos
const LOGO_TAMANO = 132;
const LOGO_SEPARACION = 34;
// Benchmark
const BENCH_ANCHO = 960;
const BENCH_ALTO = 200;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const m = MARCAS.volto;

export const fundido = (frame: number, dur: number) =>
  Math.min(
    interpolate(frame, [0, FUNDIDO], [0, 1], clamp),
    interpolate(frame, [dur - FUNDIDO, dur], [1, 0], clamp),
  );

export const pop = (frame: number, fps: number, demora = 0) =>
  spring({ frame: frame - demora, fps, config: { damping: 11, stiffness: 170, mass: 0.7 } });

// Ícono monocromo desde un SVG de Simple Icons (CC0), pintado con máscara
export const Icono: React.FC<{ archivo: string; tam: number; color: string }> = ({ archivo, tam, color }) => {
  const url = `url(${staticFile(archivo)})`;
  return (
    <div
      style={{
        width: tam,
        height: tam,
        backgroundColor: color,
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
};

export const vidrio: React.CSSProperties = {
  background: TINTA_VIDRIO,
  border: `2px solid ${BORDE_VIDRIO}`,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
};

// ---------- Apertura: título en dos renglones + ruleta ----------
// color del chip elegido: naranja sobre el video; en la placa (degradé que arranca naranja) va oscuro con borde naranja
type Resalte = "naranja" | "oscuro";
const SOMBRA_SUAVE = "0 6px 22px rgba(0,0,0,0.10)"; // placa: sobre el degradé la del vidrio quedaba muy marcada
const Chip: React.FC<{ texto: string; activo: number; ancho: number; resalte?: Resalte; sombraSuave?: boolean }> = ({
  texto,
  activo,
  ancho,
  resalte = "naranja",
  sombraSuave,
}) => (
  <div
    style={{
      ...vidrio,
      width: ancho,
      height: CHIP_ALTO,
      borderRadius: CHIP_ALTO / 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: m.fuenteTitulos,
      fontWeight: 600,
      fontSize: CHIP_TAMANO,
      letterSpacing: "0.02em",
      color: CLARO,
      background:
        activo > 0
          ? resalte === "oscuro"
            ? `rgba(14, 34, 36, ${0.62 + 0.38 * activo})`
            : `rgba(249, 125, 85, ${0.62 + 0.38 * activo})`
          : TINTA_VIDRIO,
      borderColor: activo > 0 ? `rgba(249, 125, 85, ${activo})` : BORDE_VIDRIO,
      borderWidth: resalte === "oscuro" && activo > 0 ? 4 : 2,
      boxShadow: sombraSuave ? SOMBRA_SUAVE : vidrio.boxShadow,
      flexShrink: 0,
    }}
  >
    {texto}
  </div>
);

const CHIP_ANCHO = 268; // todos iguales: la ruleta gira pareja

type RuletaProps = {
  dur: number;
  base: number; // y del borde de abajo de la ruleta
  titulo?: string[]; // renglones sobre la ruleta
  tituloTamano?: number;
  ganador?: number; // índice en RULETA_ITEMS donde frena
  resalte?: Resalte;
  sinSalida?: boolean; // no se desvanece al final (placa: el video termina con ella en pantalla)
  sombraSuave?: boolean;
};

export const Apertura: React.FC<RuletaProps> = ({
  dur,
  base,
  titulo = ["QUIÉN ES QUIÉN", "EN EL MUNDO DE LA IA"],
  tituloTamano = TITULO_TAMANO,
  ganador = RULETA_GANADOR,
  resalte,
  sinSalida,
  sombraSuave,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sinSalida ? interpolate(frame, [0, FUNDIDO], [0, 1], clamp) : fundido(frame, dur);
  const paso = CHIP_ANCHO + CHIP_SEPARACION;
  const total = RULETA_ITEMS.length * paso;
  // posición de la ruleta (en ítems): arranca en 0 y frena en el ganador tras N vueltas
  const fin = RULETA_VUELTAS * RULETA_ITEMS.length + ganador;
  const t = interpolate(frame, [RULETA_DEMORA, RULETA_DEMORA + RULETA_GIRO], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.12, 0.7, 0.2, 1), // arranca rápido y frena largo, como una ruleta
  });
  const pos = t * fin; // ítem que está en el centro
  const velocidad = Math.abs(
    interpolate(frame + 1, [RULETA_DEMORA, RULETA_DEMORA + RULETA_GIRO], [0, 1], { ...clamp, easing: Easing.bezier(0.12, 0.7, 0.2, 1) }) * fin - pos,
  ); // ítems por frame
  const desenfoque = Math.min(RULETA_DESENFOQUE, velocidad * 14);
  const parada = RULETA_DEMORA + RULETA_GIRO;
  const ganadorPop = pop(frame, fps, parada);
  const perdedores = interpolate(frame, [parada, parada + RULETA_DESVANECE], [1, 0], clamp);
  const entradaTitulo = (i: number) =>
    interpolate(frame, [i * 4, i * 4 + 10], [0, 1], { ...clamp, easing: m.ease });
  // chips visibles: los que caen cerca del centro (se repite la lista para que gire infinito)
  const chips: React.ReactNode[] = [];
  const centroX = 540;
  for (let k = Math.floor(pos) - 3; k <= Math.floor(pos) + 3; k++) {
    const idx = ((k % RULETA_ITEMS.length) + RULETA_ITEMS.length) % RULETA_ITEMS.length;
    const x = centroX + (k - pos) * paso - CHIP_ANCHO / 2;
    const distancia = Math.abs(k - pos);
    const esGanador = k === fin;
    const activo = esGanador ? interpolate(frame, [parada - 4, parada], [0, 1], clamp) : 0;
    const opacidad = esGanador ? 1 : perdedores * interpolate(distancia, [0, 2.6], [1, 0.25], clamp);
    const escala = esGanador ? 1 + 0.12 * (ganadorPop - 1 < 0 ? ganadorPop : 1) * (1 - ganadorPop) * 4 + 0 : 1;
    chips.push(
      <div
        key={k}
        style={{
          position: "absolute",
          left: x,
          top: 0,
          opacity: opacidad,
          transform: `scale(${esGanador && frame >= parada ? interpolate(ganadorPop, [0, 0.6, 1], [1, 1.14, 1.06], clamp) : escala})`,
          filter: desenfoque > 0.3 ? `blur(${desenfoque.toFixed(1)}px)` : undefined,
        }}
      >
        <Chip texto={RULETA_ITEMS[idx]} activo={activo} ancho={CHIP_ANCHO} resalte={resalte} sombraSuave={sombraSuave} />
      </div>,
    );
  }
  void total;
  const altoTitulo = tituloTamano * TITULO_INTERLINEA * titulo.length;
  const top = base - CHIP_ALTO - TITULO_A_RULETA - altoTitulo;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div
        style={{
          position: "absolute",
          top,
          left: 0,
          width: 1080,
          textAlign: "center",
          fontFamily: m.fuenteTitulos,
          fontWeight: 700,
          fontSize: tituloTamano,
          lineHeight: TITULO_INTERLINEA,
          letterSpacing: TITULO_ESPACIADO,
          color: CLARO,
          textShadow: sombraSuave ? "0 2px 12px rgba(0,0,0,0.16)" : SOMBRA_TEXTO,
        }}
      >
        {titulo.map((r, i) => (
          <div
            key={r}
            style={{
              opacity: entradaTitulo(i),
              transform: `translateY(${(1 - entradaTitulo(i)) * 24}px)`,
            }}
          >
            {r}
          </div>
        ))}
      </div>
      {/* ventana de la ruleta: los bordes se desvanecen para que se lea como algo que gira */}
      <div
        style={{
          position: "absolute",
          top: base - CHIP_ALTO,
          left: 0,
          width: 1080,
          height: CHIP_ALTO + 20,
          opacity: interpolate(frame, [RULETA_DEMORA - 6, RULETA_DEMORA], [0, 1], clamp),
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 22%, #000 78%, transparent 100%)",
          maskImage: "linear-gradient(90deg, transparent 0%, #000 22%, #000 78%, transparent 100%)",
          overflow: "visible",
        }}
      >
        {chips}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Placa final: "Próximo episodio" con la misma ruleta, frena en INFERENCIA ----------
const PROXIMO_TITULO = ["PRÓXIMO EPISODIO"];
const PROXIMO_TAMANO = 58;
const PROXIMO_GANADOR = 2; // INFERENCIA
export const PROXIMO_PARADA = RULETA_DEMORA + RULETA_GIRO; // frame (desde que entra) en que frena: pop

export const ProximoEpisodio: React.FC<{ dur: number; base: number; ganador?: number }> = ({
  dur,
  base,
  ganador = PROXIMO_GANADOR,
}) => (
  <Apertura
    dur={dur}
    base={base}
    titulo={PROXIMO_TITULO}
    tituloTamano={PROXIMO_TAMANO}
    ganador={ganador}
    sinSalida
    sombraSuave
  />
);

// ---------- Tarjeta "Objetivo: construir modelos" ----------
const RedNeuronal: React.FC<{ progreso: number }> = ({ progreso }) => {
  const capas = [[20, 60, 100], [50, 70], [20, 60, 100]];
  const xs = [14, 64, 114];
  const nodos = capas.flatMap((c, i) => c.map((y) => ({ x: xs[i], y: y + (i === 1 ? -0 : 0), i })));
  return (
    <svg width={128} height={120} viewBox="0 0 128 120">
      {capas.slice(0, 2).flatMap((c, i) =>
        c.flatMap((y1) =>
          capas[i + 1].map((y2) => (
            <line
              key={`${i}-${y1}-${y2}`}
              x1={xs[i]}
              y1={y1}
              x2={xs[i + 1]}
              y2={y2}
              stroke={CLARO}
              strokeOpacity={0.55}
              strokeWidth={2}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - progreso}
            />
          )),
        ),
      )}
      {nodos.map((n, k) => (
        <circle key={k} cx={n.x} cy={n.y} r={9 * Math.min(1, progreso * 2)} fill={n.i === 2 ? NARANJA : CLARO} />
      ))}
    </svg>
  );
};

export const TarjetaObjetivo: React.FC<{ dur: number; base: number }> = ({ dur, base }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps);
  const red = interpolate(frame, [4, 22], [0, 1], { ...clamp, easing: m.ease });
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
        <RedNeuronal progreso={red} />
        <div style={{ opacity: texto, transform: `translateX(${(1 - texto) * 18}px)` }}>
          <div
            style={{
              fontFamily: m.fuenteTitulos,
              fontWeight: 500,
              fontSize: 30,
              letterSpacing: "0.32em",
              color: NARANJA,
            }}
          >
            OBJETIVO
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
            CONSTRUIR MODELOS
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Logos de los modelos (uno por nombre, se suman en fila) ----------
export type Modelo = { nombre: string; icono: string; color: string };

export const LogosModelos: React.FC<{ dur: number; base: number; modelos: Modelo[]; entradas: number[] }> = ({
  dur,
  base,
  modelos,
  entradas,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ancho = modelos.length * LOGO_TAMANO + (modelos.length - 1) * LOGO_SEPARACION;
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [dur - FUNDIDO, dur], [1, 0], clamp) }}>
      {modelos.map((mo, i) => {
        const p = pop(frame, fps, entradas[i]);
        const op = interpolate(frame, [entradas[i], entradas[i] + FUNDIDO], [0, 1], clamp);
        return (
          <div
            key={mo.nombre}
            style={{
              position: "absolute",
              left: (1080 - ancho) / 2 + i * (LOGO_TAMANO + LOGO_SEPARACION),
              top: base - LOGO_TAMANO - 52,
              width: LOGO_TAMANO,
              opacity: op,
              transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: LOGO_TAMANO,
                height: LOGO_TAMANO,
                borderRadius: 34,
                background: "rgba(245,245,237,0.92)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icono archivo={mo.icono} tam={74} color={mo.color} />
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: m.fuenteTitulos,
                fontWeight: 600,
                fontSize: 30,
                color: CLARO,
                textShadow: SOMBRA_TEXTO,
                whiteSpace: "nowrap",
              }}
            >
              {mo.nombre}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Benchmark: la carrera por la cima ----------
const campana = (x: number, centro: number, alto: number, ancho: number) =>
  alto * Math.exp(-((x - centro) ** 2) / (2 * ancho * ancho));

export const Benchmark: React.FC<{ dur: number; base: number; modelos: Modelo[] }> = ({ dur, base, modelos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: m.ease });
  const n = modelos.length;
  const ALTO_MAX = BENCH_ALTO - 96; // deja lugar para los logos sobre las cimas
  // alturas que compiten: cada una sube y baja en su ritmo y, al final, el naranja queda arriba
  const alturas = modelos.map((_, i) => {
    const ola = 0.62 + 0.28 * Math.sin(frame / 11 + i * 1.7) + 0.1 * Math.sin(frame / 5.3 + i);
    return ALTO_MAX * entra * Math.max(0.25, Math.min(1, ola));
  });
  const colores = [CELESTE, CLARO, NARANJA, VERDE];
  const xs = modelos.map((_, i) => 110 + (i * (BENCH_ANCHO - 220)) / (n - 1));
  const suelo = BENCH_ALTO - 8;
  const camino = (i: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= BENCH_ANCHO; x += 8) pts.push(`${x},${(suelo - campana(x, xs[i], alturas[i], 74)).toFixed(1)}`);
    return `M0,${suelo} L${pts.join(" L")} L${BENCH_ANCHO},${suelo} Z`;
  };
  const top = base - BENCH_ALTO - 70;
  return (
    <AbsoluteFill style={{ opacity: fundido(frame, dur) }}>
      <div
        style={{
          position: "absolute",
          top,
          width: 1080,
          textAlign: "center",
          fontFamily: m.fuenteTitulos,
          fontWeight: 600,
          fontSize: 38,
          letterSpacing: "0.14em",
          color: CLARO,
          textShadow: SOMBRA_TEXTO,
          opacity: interpolate(frame, [0, FUNDIDO], [0, 1], clamp),
        }}
      >
        BENCHMARK: LA CARRERA POR LA CIMA
      </div>
      <svg
        width={BENCH_ANCHO}
        height={BENCH_ALTO}
        style={{ position: "absolute", left: (1080 - BENCH_ANCHO) / 2, top: top + 70, overflow: "visible" }}
      >
        <line x1={0} y1={suelo} x2={BENCH_ANCHO} y2={suelo} stroke={CLARO} strokeOpacity={0.7} strokeWidth={3} />
        {modelos.map((_, i) => (
          <path key={i} d={camino(i)} fill={colores[i % colores.length]} fillOpacity={0.55} stroke={colores[i % colores.length]} strokeWidth={3} />
        ))}
      </svg>
      {modelos.map((mo, i) => {
        const p = pop(frame, fps, 6 + i * 4);
        return (
          <div
            key={mo.nombre}
            style={{
              position: "absolute",
              left: (1080 - BENCH_ANCHO) / 2 + xs[i] - 34,
              top: top + 70 + suelo - alturas[i] - 82,
              width: 68,
              height: 68,
              borderRadius: 34,
              background: "rgba(245,245,237,0.95)",
              border: i === 2 ? `4px solid ${NARANJA}` : "none",
              boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${p})`,
            }}
          >
            <Icono archivo={mo.icono} tam={40} color={mo.color} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Capa con todos los gráficos (frames de salida) ----------
export type GraficosEp1Props = {
  apertura: { desde: number; hasta: number; base: number };
  objetivo: { desde: number; hasta: number; base: number };
  logos: { desde: number; hasta: number; base: number; entradas: number[] };
  benchmark: { desde: number; hasta: number; base: number };
  modelos: Modelo[];
};

export const GraficosEp1: React.FC<GraficosEp1Props> = (g) => (
  <AbsoluteFill>
    <Sequence from={g.apertura.desde} durationInFrames={g.apertura.hasta - g.apertura.desde} layout="none">
      <Apertura dur={g.apertura.hasta - g.apertura.desde} base={g.apertura.base} />
    </Sequence>
    <Sequence from={g.objetivo.desde} durationInFrames={g.objetivo.hasta - g.objetivo.desde} layout="none">
      <TarjetaObjetivo dur={g.objetivo.hasta - g.objetivo.desde} base={g.objetivo.base} />
    </Sequence>
    <Sequence from={g.logos.desde} durationInFrames={g.logos.hasta - g.logos.desde} layout="none">
      <LogosModelos
        dur={g.logos.hasta - g.logos.desde}
        base={g.logos.base}
        modelos={g.modelos}
        entradas={g.logos.entradas.map((e) => e - g.logos.desde)}
      />
    </Sequence>
    <Sequence from={g.benchmark.desde} durationInFrames={g.benchmark.hasta - g.benchmark.desde} layout="none">
      <Benchmark dur={g.benchmark.hasta - g.benchmark.desde} base={g.benchmark.base} modelos={g.modelos} />
    </Sequence>
  </AbsoluteFill>
);
