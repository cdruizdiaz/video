// "Bloomie toma vida" (5 s, 9:16): escenario negro con reflector en Remotion + Bloomie 3D renderizado en Blender (capa
// con alfa de scripts/blender/render.mjs, poses de datos/animacion.json, luces y órbita de datos/escena_extra.json, cara
// del kit del diseñador). Tiempos: datos/coreografia.json (sale del guion_bloomie-toma-vida.md).
// Capas, de atrás hacia adelante (reglas de superposición del guion):
//   fondo → haz del reflector y polvo → partículas de atrás (desenfocadas) → piso, charco de luz, reflejo y sombra →
//   Bloomie 3D → partículas de adelante (esquivan la cara y no bajan a la zona del logo) → viñeta → subtítulos → firma
// La reusa 2026-10-06_claudio_bloomie-plantado (con `subtitulos`: palabra por palabra, debajo de la sombra).
// La "cámara": acercamiento (dolly) y paralaje del fondo con el giro; la profundidad de campo desenfoca el fondo.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { bloomie, PALETA_BLOOMIE } from "../../marcas/bloomie/marca";
import { lugarEn, poseEn, type PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";

// ---------- Constantes ----------
const FONDO = { arriba: "#0d0a12", abajo: "#020103", piso: ["#1a151d", "#060408"] as const, horizonte: 70 }; // px sobre los pies
const HAZ = { fuente: [-260, -320], ancho: 300, color: "#ffd59a", opacidad: 0.2, desenfoque: 18 }; // sale arriba a la izquierda
const CHARCO = { rx: 400, ry: 70, opacidad: 0.26, corrido: 30 }; // luz en el piso
const POLVO = { cantidad: 46, tam: [2, 5], deriva: 0.35, opacidad: 0.55 };
const REFLEJO = { alto: 230, opacidad: 0.2, desenfoque: 2.5 };
const SOMBRA = { ancho: 112, alto: 15, opacidad: 0.5, achique: 0.005 }; // pt del .ai (× escala)
const CARA = { centro: -202.5, rx: 112, ry: 78, margen: 1.15 }; // óvalo de ojos y boca (pt) que las partículas esquivan
const PARTICULAS = { atras: 0.6, tam: [34, 70], caida: [9, 15], vaiven: 38, giro: 5, zonaLogo: 1380 };
const LOGO = { rebote: { damping: 11, mass: 0.6 }, texto: "Bloomie", borde: 7, brillo: 26 }; // firma de la marca (Fredoka)
const PARALAJE = 70; // px del fondo por radián de giro (la cámara orbita)
const VINETA = 0.75;
const SUBTITULO = { y: [1470, 1556], tam: 62, borde: 9, entra: 4, sale: 5, destaque: 1.2, actual: 8 }; // px · cuadros

export type BloomieTomaVidaProps = {
  capa: string;
  audio: string;
  rig: PersonajeRigProps;
  coreo: {
    duracion: number;
    pies: number[];
    escala: number;
    giro: { inicio: number; fin: number; tramo: number[] };
    dolly: { tramo: number[]; escala: number };
    particulas: { desde: number; cada: number; vida: number };
    logo: { entra: number; y: number; alto: number };
    dof: { tramo: number[]; desenfoque: number };
  };
  brillo: number[]; // 0…1 por cuadro: el reflector (de escena_extra.json)
  rotY: number[];
  imagenes: { petalo_naranja: string; petalo_turquesa: string; destello: string };
  subtitulos?: Frase[];
};

// Subtítulos palabra por palabra (de los tiempos de Whisper): cada palabra entra en su cuadro
export type Frase = { desde: number; hasta: number; lineas: { texto: string; cuadro: number; destacar?: boolean }[][] };

const Subtitulos: React.FC<{ frases: Frase[]; f: number; fps: number }> = ({ frases, f, fps }) => {
  const frase = frases.find((x) => f >= x.desde && f < x.hasta + SUBTITULO.sale);
  if (!frase) return null;
  const sale = interpolate(f, [frase.hasta, frase.hasta + SUBTITULO.sale], [1, 0], clamp);
  const ys = frase.lineas.length === 1 ? [(SUBTITULO.y[0] + SUBTITULO.y[1]) / 2] : SUBTITULO.y;
  const todas = frase.lineas.flat();
  return (
    <>
      {frase.lineas.map((linea, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: ys[i] - SUBTITULO.tam * 0.6,
            width: "100%",
            textAlign: "center",
            fontFamily: bloomie.fuente,
            fontWeight: 700,
            fontSize: SUBTITULO.tam,
            lineHeight: 1.2,
            opacity: sale,
          }}
        >
          {linea.map((p, j) => {
            const siguiente = todas[todas.indexOf(p) + 1];
            const dicha = f >= p.cuadro;
            const actual = dicha && (siguiente ? f < siguiente.cuadro : f < p.cuadro + SUBTITULO.actual);
            const entra = spring({ frame: f - p.cuadro, fps, config: { damping: 12, mass: 0.5 }, durationInFrames: SUBTITULO.entra * 3 });
            return (
              <span
                key={j}
                style={{
                  display: "inline-block",
                  margin: "0 0.16em",
                  color: p.destacar || actual ? PALETA_BLOOMIE.naranja : "#ffffff",
                  WebkitTextStroke: `${SUBTITULO.borde}px ${bloomie.colores.oscuro}`,
                  paintOrder: "stroke",
                  opacity: dicha ? 1 : 0,
                  fontSize: p.destacar ? `${SUBTITULO.destaque}em` : undefined, // ocupa su lugar en el renglón
                  transform: `scale(${0.85 + 0.15 * entra})`,
                  transformOrigin: "50% 80%",
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

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const BloomieTomaVida: React.FC<BloomieTomaVidaProps> = ({ capa, audio, rig, coreo, brillo, rotY, imagenes, subtitulos }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const piso = coreo.pies[1];
  const b = brillo[Math.min(f, brillo.length - 1)] ?? 1;
  const ry = rotY[Math.min(f, rotY.length - 1)] ?? 0;
  const lugar = lugarEn(rig, f);
  const raizY = poseEn(rig, f, fps).huesos.raiz?.y ?? 0;
  const alto = Math.max(0, -raizY);
  const e = lugar.escala;

  // cámara: acercamiento y paralaje
  const dolly = interpolate(f, coreo.dolly.tramo, [1, coreo.dolly.escala], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  const paralaje = (ry - coreo.giro.fin) * PARALAJE;
  const desenfoque = interpolate(f, coreo.dof.tramo, [0, coreo.dof.desenfoque], clamp);

  // haz: de la fuente (arriba a la izquierda) al charco de luz alrededor de los pies
  const charco = { x: lugar.x + CHARCO.corrido, y: piso };
  const [fx, fy] = HAZ.fuente;
  const haz = `${fx - HAZ.ancho / 2},${fy} ${fx + HAZ.ancho / 2},${fy} ${charco.x + CHARCO.rx * 0.9},${charco.y} ${charco.x - CHARCO.rx * 0.9},${charco.y}`;

  // polvo en suspensión dentro del haz
  const polvo = Array.from({ length: POLVO.cantidad }, (_, k) => {
    const t = (random(`pt${k}`) + f * 0.0012 * (0.5 + random(`pv${k}`))) % 1; // a lo largo del haz (baja despacio)
    const u = random(`pu${k}`) - 0.5; // a lo ancho
    const ancho = HAZ.ancho + (CHARCO.rx * 1.8 - HAZ.ancho) * t;
    const x = fx + (charco.x - fx) * t + u * ancho + Math.sin(f / 20 + k) * 6;
    const y = fy + (charco.y - fy) * t + Math.cos(f / 25 + k) * 5;
    const tam = POLVO.tam[0] + random(`ps${k}`) * (POLVO.tam[1] - POLVO.tam[0]);
    const titila = 0.55 + 0.45 * Math.sin(f / 7 + k * 1.7);
    return <circle key={k} cx={x} cy={y} r={tam} fill="#fff1d6" opacity={POLVO.opacidad * titila * b * (1 - Math.abs(u) * 1.2)} />;
  });

  // partículas de marca (pétalos y destellos): caen desde que saluda; unas atrás (desenfocadas) y otras adelante
  const centroCara = { x: lugar.x, y: piso + (CARA.centro + raizY) * e };
  const particulas: { atras: React.ReactNode[]; adelante: React.ReactNode[] } = { atras: [], adelante: [] };
  const P = coreo.particulas;
  for (let k = 0; P.desde + k * P.cada <= f; k++) {
    const nace = P.desde + k * P.cada;
    const t = f - nace;
    if (t > P.vida) continue;
    const atras = random(`a${k}`) < PARTICULAS.atras;
    const tipo = (["petalo_naranja", "petalo_turquesa", "destello"] as const)[Math.floor(random(`t${k}`) * 3)];
    const tam = (PARTICULAS.tam[0] + random(`s${k}`) * (PARTICULAS.tam[1] - PARTICULAS.tam[0])) * (atras ? 0.7 : 1);
    const caida = PARTICULAS.caida[0] + random(`c${k}`) * (PARTICULAS.caida[1] - PARTICULAS.caida[0]);
    let x = 60 + random(`x${k}`) * (width - 120) + Math.sin(t / 9 + k) * PARTICULAS.vaiven;
    const y = -80 + random(`y${k}`) * 900 + t * caida; // aparecen (fundido) a distintas alturas y caen
    let op = interpolate(t, [0, 6, P.vida - 10, P.vida], [0, 1, 1, 0], clamp);
    if (!atras) {
      // regla: nunca delante de la cara → se corre al borde del óvalo; y no baja a la zona del logo
      const a = CARA.rx * e * CARA.margen;
      const bb = CARA.ry * e * CARA.margen;
      const dy = (y - centroCara.y) / bb;
      if (Math.abs(dy) < 1 && Math.abs(x - centroCara.x) < a * Math.sqrt(1 - dy * dy)) {
        x = centroCara.x + Math.sign(x - centroCara.x || 1) * a * Math.sqrt(1 - dy * dy);
      }
      op *= interpolate(y, [PARTICULAS.zonaLogo - 120, PARTICULAS.zonaLogo], [1, 0], clamp);
    }
    const giro = tipo === "destello" ? 0 : t * PARTICULAS.giro * (random(`g${k}`) < 0.5 ? -1 : 1);
    const pulso = tipo === "destello" ? 0.7 + 0.3 * Math.sin(t / 3 + k) : 1;
    const el = (
      <Img
        key={k}
        src={staticFile(imagenes[tipo])}
        style={{
          position: "absolute",
          left: x - tam / 2,
          top: y - tam / 2,
          width: tam,
          opacity: op * (atras ? 0.75 : 1),
          transform: `rotate(${giro}deg) scale(${pulso})`,
          filter: tipo === "destello" ? `drop-shadow(0 0 ${tam * 0.25}px ${PALETA_BLOOMIE.naranja})` : undefined,
        }}
      />
    );
    (atras ? particulas.atras : particulas.adelante).push(el);
  }

  const logoS = spring({ frame: f - coreo.logo.entra, fps, config: LOGO.rebote });

  return (
    <AbsoluteFill style={{ backgroundColor: FONDO.abajo, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${dolly})`, transformOrigin: `${lugar.x}px ${piso - 330}px` }}>
        {/* fondo: escenario, haz, polvo y partículas de atrás (se desenfocan: profundidad de campo) */}
        <AbsoluteFill style={{ transform: `translateX(${paralaje}px)`, filter: desenfoque > 0.05 ? `blur(${desenfoque}px)` : undefined }}>
          <AbsoluteFill style={{ background: `linear-gradient(${FONDO.arriba}, ${FONDO.abajo})` }} />
          <div
            style={{
              position: "absolute",
              left: -200,
              top: piso - FONDO.horizonte,
              width: width + 400,
              height: height - piso + FONDO.horizonte,
              background: `linear-gradient(transparent, ${FONDO.piso[0]} ${FONDO.horizonte}px, ${FONDO.piso[1]})`,
              opacity: 0.35 + 0.65 * b,
            }}
          />
          <svg width={width} height={height} style={{ position: "absolute", mixBlendMode: "screen" }}>
            <defs>
              <linearGradient id="haz" gradientUnits="userSpaceOnUse" x1={fx} y1={fy} x2={charco.x} y2={charco.y}>
                <stop offset="0" stopColor={HAZ.color} stopOpacity={HAZ.opacidad * 1.6} />
                <stop offset="1" stopColor={HAZ.color} stopOpacity={HAZ.opacidad * 0.5} />
              </linearGradient>
              <radialGradient id="charco">
                <stop offset="0" stopColor={HAZ.color} stopOpacity={CHARCO.opacidad} />
                <stop offset="1" stopColor={HAZ.color} stopOpacity={0} />
              </radialGradient>
              <filter id="suave">
                <feGaussianBlur stdDeviation={HAZ.desenfoque} />
              </filter>
            </defs>
            <g opacity={b}>
              <polygon points={haz} fill="url(#haz)" filter="url(#suave)" />
              <ellipse cx={charco.x} cy={charco.y} rx={CHARCO.rx} ry={CHARCO.ry} fill="url(#charco)" />
              {polvo}
            </g>
          </svg>
          {particulas.atras}
        </AbsoluteFill>
        {/* reflejo en el piso (espejo de la capa sobre la línea de los pies, se apaga hacia abajo) */}
        {capa && (
          <div
            style={{
              position: "absolute",
              top: piso,
              left: 0,
              width,
              height: REFLEJO.alto,
              overflow: "hidden",
              opacity: REFLEJO.opacidad * b,
              WebkitMaskImage: "linear-gradient(to bottom, #000, transparent)",
              maskImage: "linear-gradient(to bottom, #000, transparent)",
              filter: `blur(${REFLEJO.desenfoque}px)`,
            }}
          >
            <div style={{ position: "absolute", top: -piso, left: 0, width, height, transform: `translateY(${2 * piso}px) scaleY(-1)`, transformOrigin: "0 0" }}>
              <OffthreadVideo src={staticFile(capa)} transparent muted />
            </div>
          </div>
        )}
        {/* sombra de contacto (se achica y se aclara en el aire) */}
        <svg width={width} height={height} style={{ position: "absolute" }}>
          <defs>
            <radialGradient id="sombra">
              <stop offset="0.4" stopColor="#000" stopOpacity={1} />
              <stop offset="1" stopColor="#000" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse
            cx={lugar.x + 12}
            cy={piso}
            rx={SOMBRA.ancho * e * Math.max(0.45, 1 - alto * SOMBRA.achique)}
            ry={SOMBRA.alto * e * Math.max(0.45, 1 - alto * SOMBRA.achique)}
            fill="url(#sombra)"
            opacity={SOMBRA.opacidad * b * Math.max(0.35, 1 - alto * SOMBRA.achique * 1.4)}
          />
        </svg>
        {capa && (
          <AbsoluteFill style={{ filter: `brightness(${0.2 + 0.8 * b})` }}>
            <OffthreadVideo src={staticFile(capa)} transparent muted />
          </AbsoluteFill>
        )}
        {particulas.adelante}
      </AbsoluteFill>
      {/* viñeta */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,${VINETA}) 100%)` }} />
      {subtitulos && <Subtitulos frases={subtitulos} f={f} fps={fps} />}
      {/* firma abajo, debajo de los pies y de la sombra (nunca tapa a Bloomie) */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          top: coreo.logo.y - coreo.logo.alto / 2,
          height: coreo.logo.alto,
          lineHeight: `${coreo.logo.alto}px`,
          textAlign: "center",
          fontFamily: bloomie.fuente,
          fontWeight: 700,
          fontSize: coreo.logo.alto * 0.82,
          color: PALETA_BLOOMIE.naranja,
          WebkitTextStroke: `${LOGO.borde}px ${bloomie.colores.claro}`,
          paintOrder: "stroke",
          textShadow: `0 0 ${LOGO.brillo}px rgba(239,145,60,0.55)`,
          transform: `scale(${logoS})`,
          opacity: Math.min(1, logoS * 1.4),
        }}
      >
        {LOGO.texto}
      </div>
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
