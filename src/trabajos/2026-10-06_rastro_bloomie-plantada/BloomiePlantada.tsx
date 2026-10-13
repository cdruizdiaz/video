// "Bloomie — Planted" (8,5 s, 9:16): escenario oscuro con reflector + Bloomie 3D renderizado en Blender (capa con alfa
// de scripts/blender/render.mjs) + subtítulos palabra por palabra + partículas y firma al cierre + mezcla de audio.
// Tiempos: datos/plantada.json (armar_escena.mjs, desde el guion y las voces). Un solo plano, sin cortes.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { bloomie, PALETA_BLOOMIE } from "../../marcas/bloomie/marca";

// ---------- Constantes ----------
const C = { clamp: { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const };
const AMBAR = "#ffd59a";
const CELESTE = "#8fd8ff";
const PISO_Y = 1250; // donde empieza el piso (horizonte suave)
const REFLECTOR = { origen: [40, -120], izq: [180, 1420], der: [960, 1290], opacidad: 0.2 };
const POLVO = { cantidad: 46, tam: [2, 5], deriva: 22, opacidad: 0.55 };
const CHARCO = { rx: 380, ry: 86, opacidad: 0.4 };
const CONTRALUZ = { x: 790, y: 760, r: 470, opacidad: 0.2 };
const REFLEJO = { opacidad: 0.07, largo: 210, desenfoque: 5 };
const SOMBRA = { rx: 150, ry: 20, opacidad: 0.6 };
const DOLLY = { desde: 201, hasta: 211, escala: 1.04, origen: "540px 1000px" };
const BAJA_LUZ = { desde: 246, hasta: 255, factor: 0.8 };
const SUBT = { y: [1470, 1560], tam: 74, borde: 12, color: "#ffffff", dicha: PALETA_BLOOMIE.naranja, contorno: "#2a1a12", grande: 1.2 };
const FIRMA = { entra: 225, y: 1500, tam: 150, borde: 14, crema: "#fff1d6" };
const PARTICULAS = { inicio: 219, atras: 9, adelante: 7, caida: 900, vida: 36, fin: 255 };
const CARA = { cx: 540, cy: 944, rx: 250, ry: 200 }; // óvalo de la cara (las partículas de adelante lo esquivan)
const ZONA_FIRMA = 1390; // las partículas de adelante se apagan antes de esta altura
const DESTELLOS = [
  { x: 300, y: 760, en: 219, tam: 90 },
  { x: 800, y: 700, en: 222, tam: 70 },
  { x: 250, y: 1060, en: 226, tam: 60 },
  { x: 840, y: 1010, en: 229, tam: 80 },
];

type Palabra = { texto: string; linea: number; desde: number; hasta: number; grande: boolean };
export type BloomiePlantadaProps = {
  capa: string;
  audio: string;
  pies: number[];
  subtitulos: { lineas: string[]; borra: number; palabras: Palabra[] }[];
  kit: string; // carpeta de las piezas del kit (pétalos, destellos)
};

const Escenario: React.FC<{ f: number; luz: number }> = ({ f, luz }) => {
  const { width, height } = useVideoConfig();
  const [ox, oy] = REFLECTOR.origen;
  const polvo = Array.from({ length: POLVO.cantidad }, (_, i) => {
    const u = random(`pu${i}`);
    const v = random(`pv${i}`);
    const bx = ox + (REFLECTOR.izq[0] + (REFLECTOR.der[0] - REFLECTOR.izq[0]) * v - ox) * u;
    const by = oy + (REFLECTOR.izq[1] + (REFLECTOR.der[1] - REFLECTOR.izq[1]) * v - oy) * u;
    const x = bx + POLVO.deriva * Math.sin(f / 40 + i);
    const y = by + ((f * (0.3 + random(`pf${i}`) * 0.5)) % 80) - 40;
    const brillo = 0.5 + 0.5 * Math.sin(f / 9 + i * 1.7);
    const r = POLVO.tam[0] + random(`pr${i}`) * (POLVO.tam[1] - POLVO.tam[0]);
    return <circle key={i} cx={x} cy={y} r={r} fill={AMBAR} opacity={POLVO.opacidad * brillo * u * luz} />;
  });
  return (
    <svg width={width} height={height} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="piso" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.12" stopColor="#140f0c" />
          <stop offset="1" stopColor="#060505" />
        </linearGradient>
        <linearGradient id="haz" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={AMBAR} stopOpacity={0.9} />
          <stop offset="1" stopColor={AMBAR} stopOpacity={0.15} />
        </linearGradient>
        <radialGradient id="charco">
          <stop offset="0" stopColor={AMBAR} stopOpacity={1} />
          <stop offset="1" stopColor={AMBAR} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="contraluz">
          <stop offset="0" stopColor={CELESTE} stopOpacity={1} />
          <stop offset="1" stopColor={CELESTE} stopOpacity={0} />
        </radialGradient>
        <filter id="suave">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      <rect width={width} height={height} fill="#000" />
      <rect y={PISO_Y} width={width} height={height - PISO_Y} fill="url(#piso)" />
      <circle cx={CONTRALUZ.x} cy={CONTRALUZ.y} r={CONTRALUZ.r} fill="url(#contraluz)" opacity={CONTRALUZ.opacidad} />
      <polygon
        points={`${ox - 30},${oy} ${ox + 60},${oy} ${REFLECTOR.der.join(",")} ${REFLECTOR.izq.join(",")}`}
        fill="url(#haz)"
        opacity={REFLECTOR.opacidad * luz}
        filter="url(#suave)"
        style={{ mixBlendMode: "screen" }}
      />
      <ellipse cx={560} cy={1335} rx={CHARCO.rx} ry={CHARCO.ry} fill="url(#charco)" opacity={CHARCO.opacidad * luz} />
      {polvo}
    </svg>
  );
};

// Pétalos del kit que caen: "atras" (detrás de Bloomie, desenfocados) y "adelante" (esquivan la cara y se apagan
// antes de la firma)
const Particulas: React.FC<{ f: number; plano: "atras" | "adelante"; kit: string }> = ({ f, plano, kit }) => {
  if (f < PARTICULAS.inicio) return null;
  const n = PARTICULAS[plano];
  const piezas = ["petalo_naranja_1", "petalo_turquesa_1", "petalo_naranja_2", "petalo_turquesa_2"];
  const fin = interpolate(f, [BAJA_LUZ.desde, PARTICULAS.fin], [1, 0], C.clamp);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const sem = `${plano}${i}`;
        const t = f - PARTICULAS.inicio - random(`d${sem}`) * 8;
        if (t < 0) return null;
        const adelante = plano === "adelante";
        // adelante: solo por los costados (fuera del óvalo de la cara)
        const lado = i % 2 ? 1 : -1;
        const x0 = adelante ? CARA.cx + lado * (CARA.rx + 40 + random(`x${sem}`) * 180) : 120 + random(`x${sem}`) * 840;
        const x = x0 + 30 * Math.sin(t / 7 + i);
        const y = 380 + random(`y${sem}`) * 120 + (t / PARTICULAS.vida) * PARTICULAS.caida * (adelante ? 1 : 0.7);
        const tam = (adelante ? 70 : 42) * (0.75 + random(`s${sem}`) * 0.5);
        let op = interpolate(t, [0, 5], [0, 1], C.clamp) * fin;
        if (adelante) op *= interpolate(y, [ZONA_FIRMA - 160, ZONA_FIRMA], [1, 0], C.clamp);
        return (
          <Img
            key={i}
            src={staticFile(`${kit}/${piezas[i % piezas.length]}.png`)}
            style={{
              position: "absolute",
              left: x - tam / 2,
              top: y - tam / 2,
              width: tam,
              opacity: op,
              transform: `rotate(${(random(`r${sem}`) - 0.5) * 120 + t * 6 * lado}deg)`,
              filter: adelante ? undefined : "blur(3px)",
            }}
          />
        );
      })}
    </>
  );
};

const Subtitulos: React.FC<{ f: number; subtitulos: BloomiePlantadaProps["subtitulos"] }> = ({ f, subtitulos }) => {
  const sub = subtitulos.find((s) => f >= s.palabras[0].desde && f < s.borra);
  if (!sub) return null;
  return (
    <>
      {sub.lineas.map((_, l) => (
        <div
          key={l}
          style={{
            position: "absolute",
            top: SUBT.y[l] - SUBT.tam * 0.6,
            width: "100%",
            textAlign: "center",
            fontFamily: bloomie.fuente,
            fontWeight: 700,
            fontSize: SUBT.tam,
            lineHeight: 1.2,
          }}
        >
          {sub.palabras
            .map((p, i) => ({ p, sig: sub.palabras[i + 1] }))
            .filter(({ p }) => p.linea === l)
            .map(({ p, sig }) => {
              const dicha = f >= p.desde && f < Math.max(p.hasta, sig ? sig.desde : p.hasta + 6);
              const entra = interpolate(f, [p.desde, p.desde + 3], [0.6, 1], C.clamp);
              return (
                <span
                  key={p.texto + p.desde}
                  style={{
                    display: "inline-block",
                    margin: "0 0.16em",
                    visibility: f >= p.desde ? "visible" : "hidden",
                    color: dicha ? SUBT.dicha : SUBT.color,
                    WebkitTextStroke: `${SUBT.borde}px ${SUBT.contorno}`,
                    paintOrder: "stroke",
                    fontSize: p.grande ? `${SUBT.grande}em` : undefined, // con el tamaño (no transform) para que no pise a la anterior
                    transform: `scale(${entra})`,
                    transformOrigin: "50% 70%",
                  }}
                >
                  {p.texto}
                </span>
              );
            })}
        </div>
      ))}
    </>
  );
};

export const BloomiePlantada: React.FC<BloomiePlantadaProps> = ({ capa, audio, pies, subtitulos, kit }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const luz = interpolate(f, [BAJA_LUZ.desde, BAJA_LUZ.hasta], [1, BAJA_LUZ.factor], C.clamp);
  const dolly = interpolate(f, [DOLLY.desde, DOLLY.hasta], [1, DOLLY.escala], { ...C.clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const firma = spring({ frame: f - FIRMA.entra, fps, config: { damping: 10, mass: 0.6 } });
  const [px, py] = pies;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${dolly})`, transformOrigin: DOLLY.origen }}>
        <Escenario f={f} luz={luz} />
        <Particulas f={f} plano="atras" kit={kit} />
        {/* reflejo en el piso: la capa espejada bajo los pies, tenue y desvanecida */}
        {capa && (
          <AbsoluteFill
            style={{
              transform: "scaleY(-1)",
              transformOrigin: `${px}px ${py}px`,
              opacity: REFLEJO.opacidad * luz,
              filter: `blur(${REFLEJO.desenfoque}px)`,
              // la máscara se aplica antes del espejado: deja ver solo la franja de "largo" px sobre los pies
              WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,0) ${py - REFLEJO.largo}px, rgba(0,0,0,1) ${py}px)`,
            }}
          >
            <OffthreadVideo src={staticFile(capa)} transparent muted />
          </AbsoluteFill>
        )}
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <defs>
            <radialGradient id="sombra">
              <stop offset="0" stopColor="#000" stopOpacity={1} />
              <stop offset="1" stopColor="#000" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={px} cy={py - 2} rx={SOMBRA.rx} ry={SOMBRA.ry} fill="url(#sombra)" opacity={SOMBRA.opacidad} />
        </svg>
        {capa && (
          <AbsoluteFill>
            <OffthreadVideo src={staticFile(capa)} transparent muted />
          </AbsoluteFill>
        )}
        <Particulas f={f} plano="adelante" kit={kit} />
        {DESTELLOS.map((d, i) => {
          const t = f - d.en;
          if (t < 0) return null;
          const s = spring({ frame: t, fps, config: { damping: 8, mass: 0.4 } });
          const op = interpolate(t, [0, 3, 14, 22], [0, 1, 1, 0], C.clamp);
          return (
            <Img
              key={i}
              src={staticFile(`${kit}/destello_${(i % 2) + 1}.png`)}
              style={{ position: "absolute", left: d.x - d.tam / 2, top: d.y - d.tam / 2, width: d.tam, opacity: op, transform: `scale(${s}) rotate(${t * 4}deg)` }}
            />
          );
        })}
        {/* viñeta */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 52%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.8) 100%)" }} />
      </AbsoluteFill>
      <Subtitulos f={f} subtitulos={subtitulos} />
      {f >= FIRMA.entra && (
        <div
          style={{
            position: "absolute",
            top: FIRMA.y - FIRMA.tam * 0.62,
            width: "100%",
            textAlign: "center",
            fontFamily: bloomie.fuente,
            fontWeight: 700,
            fontSize: FIRMA.tam,
            color: PALETA_BLOOMIE.naranja,
            WebkitTextStroke: `${FIRMA.borde}px ${FIRMA.crema}`,
            paintOrder: "stroke",
            transform: `scale(${firma})`,
            transformOrigin: "50% 60%",
          }}
        >
          Bloomie
        </div>
      )}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
