// Bloomie bailando rock (8 s, 9:16): escenario de recital en Remotion + Bloomie 3D renderizado en Blender (capa con
// alfa de scripts/blender/render.mjs, con las poses de datos/animacion.json y la cara del kit rock).
// Todo va al pulso de la música (120 bpm: un pulso cada 15 cuadros, un compás cada 60): luces que barren, destello en
// cada compás, notas que salen en cada pulso y el título que entra con el headbang.
import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { bloomie, PALETA_BLOOMIE } from "../../marcas/bloomie/marca";
import { lugarEn, poseEn, type PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";

// ---------- Constantes ----------
const FONDO = { arriba: "#2a0f3d", abajo: "#07030c" };
const PISO_Y = 1580; // borde del escenario (los pies de Bloomie)
const LUCES = [
  { x: 180, color: "#ff3d7f", fase: 0 },
  { x: 540, color: "#3dd6ff", fase: 0.5 },
  { x: 900, color: "#ffd23f", fase: 0.25 },
];
const BARRIDO = 22; // grados de vaivén de cada luz
const DESTELLO = { dura: 8, opacidad: 0.35 }; // en cada compás
const NOTAS = { cada: 1, vida: 40, sube: 520, tam: 76 }; // pulsos · cuadros · px · px
const SOMBRA = { ancho: 120, alto: 16, opacidad: 0.45, achique: 0.004 };
const TITULO = { entra: 58, texto: "¡A ROCKEAR!", tam: 132, y: 250 };

export type BloomieRockProps = { capa: string; musica: string; rig: PersonajeRigProps; pulso: number };

export const BloomieRock: React.FC<BloomieRockProps> = ({ capa, musica, rig, pulso }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const compas = pulso * 4;
  const enCompas = f % compas;
  const destello = interpolate(enCompas, [0, DESTELLO.dura], [DESTELLO.opacidad, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const golpe = interpolate(f % pulso, [0, 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); // en cada pulso
  const lugar = lugarEn(rig, f);
  const alto = Math.max(0, -(poseEn(rig, f, fps).huesos.raiz?.y ?? 0));
  const titulo = spring({ frame: f - TITULO.entra, fps, config: { damping: 9, mass: 0.7 } });

  // Notas: una por pulso, salen de la guitarra y suben haciendo ondas
  const notas = [];
  for (let k = Math.max(0, Math.floor((f - NOTAS.vida) / pulso)); k * pulso <= f; k++) {
    const t = (f - k * pulso) / NOTAS.vida;
    if (t < 0 || t > 1) continue;
    const lado = random(`n${k}`) < 0.5 ? -1 : 1;
    notas.push(
      <div
        key={k}
        style={{
          position: "absolute",
          left: width / 2 + lado * (140 + random(`x${k}`) * 260) + Math.sin(t * 7 + k) * 30,
          top: PISO_Y - 520 - t * NOTAS.sube,
          fontSize: NOTAS.tam * (0.8 + random(`s${k}`) * 0.5),
          color: [PALETA_BLOOMIE.naranja, "#3dd6ff", "#ffd23f", "#ff3d7f"][k % 4],
          opacity: interpolate(t, [0, 0.15, 0.75, 1], [0, 1, 1, 0]),
          transform: `rotate(${lado * 15 * t}deg) scale(${0.6 + 0.4 * Math.min(1, t * 4)})`,
          textShadow: "0 0 18px rgba(255,255,255,0.35)",
        }}
      >
        {k % 3 === 0 ? "♫" : "♪"}
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${FONDO.arriba}, ${FONDO.abajo})`, overflow: "hidden" }}>
      {/* luces del escenario: conos que barren al ritmo del compás */}
      <svg width={width} height={height} style={{ position: "absolute", mixBlendMode: "screen" }}>
        <defs>
          {LUCES.map((l, i) => (
            <linearGradient key={i} id={`cono${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={l.color} stopOpacity={0.55 + 0.25 * golpe} />
              <stop offset="1" stopColor={l.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {LUCES.map((l, i) => {
          const ang = BARRIDO * Math.sin(((f / compas) + l.fase) * 2 * Math.PI);
          return (
            <g key={i} transform={`rotate(${ang} ${l.x} -40)`}>
              <polygon points={`${l.x - 18},-40 ${l.x + 18},-40 ${l.x + 260},${PISO_Y + 60} ${l.x - 260},${PISO_Y + 60}`} fill={`url(#cono${i})`} />
            </g>
          );
        })}
      </svg>
      {/* escenario */}
      <div style={{ position: "absolute", left: 0, top: PISO_Y - 10, width, height: height - PISO_Y + 10, background: "linear-gradient(#3a1d4f, #120818)" }} />
      <div style={{ position: "absolute", left: 0, top: PISO_Y - 12, width, height: 6, background: "#ff3d7f", opacity: 0.6 + 0.4 * golpe, boxShadow: "0 0 30px #ff3d7f" }} />
      {notas}
      {/* sombra de contacto (se achica al saltar) */}
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <ellipse
          cx={lugar.x}
          cy={lugar.y}
          rx={SOMBRA.ancho * lugar.escala * Math.max(0.4, 1 - alto * SOMBRA.achique)}
          ry={SOMBRA.alto * lugar.escala}
          fill="#000"
          opacity={SOMBRA.opacidad}
        />
      </svg>
      {capa && (
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(capa)} transparent muted />
        </AbsoluteFill>
      )}
      {/* título: entra con el headbang */}
      <div
        style={{
          position: "absolute",
          top: TITULO.y,
          width: "100%",
          textAlign: "center",
          fontFamily: bloomie.fuente,
          fontWeight: 700,
          fontSize: TITULO.tam,
          color: "#ffd23f",
          WebkitTextStroke: "10px #2a0f3d",
          paintOrder: "stroke",
          transform: `scale(${titulo * (1 + 0.06 * golpe)}) rotate(${-4 + 2 * golpe}deg)`,
          textShadow: "0 8px 0 #ff3d7f",
        }}
      >
        {TITULO.texto}
      </div>
      {/* destello en cada compás */}
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: destello, mixBlendMode: "overlay" }} />
      <Audio src={staticFile(musica)} />
    </AbsoluteFill>
  );
};
