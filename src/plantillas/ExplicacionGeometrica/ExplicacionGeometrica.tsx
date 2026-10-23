// Plantilla ExplicacionGeometrica (canal "Los Amigos Mat" y parecidos): dos personajes conversan en el tercio de
// abajo mientras en la pizarra de arriba (los 2/3 superiores) pasa la explicación. Fondo de hoja cuadriculada,
// subtítulos de la línea que se dice, voces línea por línea y música de fondo con ducking.
// La línea de tiempo sale de la duración real de las voces (calculos.ts → armarTiempos); el contenido de la
// pizarra lo pone cada trabajo con `pizarra(t)` (t = tiempos de cada línea y escena, para sincronizar).
import React, { useMemo } from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { PersonajeRig, type PersonajeRigProps } from "../PersonajeRig/PersonajeRig";
import { poseEn } from "../PersonajeRig/calculos";
import { type Caja, cajaEnCuadro, cajasEnPose } from "../../rig/cajas";
import { partirEnCarteles, ubicarCartel, type Ubicacion } from "../comunes/zonaSegura";
import { PersonajePoses } from "../../rig/PersonajePoses";
import { cajasDePose } from "../../rig/poses";
import { holguraVaiven } from "../../rig/vaiven";
import { visemaEn, visemasRhubarb, type TramoVisema } from "../../rig/lipsync";
import { type ConfigPersonaje, lineaDePoses, lineaEn, type Movimiento, palabraEn, pistasDe, poseEnCuadro, type Resaltado, resaltadoDe, type SegmentoPose, type Tiempos } from "./calculos";

export { armarTiempos, type LineaDialogo, type Resaltado, type Tiempos } from "./calculos";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
export const FUENTE = fontFamily;

// ---------- Diseño (1080 × 1920) ----------
export const PAPEL = "#fbfaf5";
const CUADRICULA = "#cfe0ee";
const MARGEN_ROJO = "#f1b7b7";
const LADO_CUADRO = 40; // px de cada cuadradito de la hoja
export const PIZARRA = { x: 40, y: 110, w: 1000, h: 1050 }; // zona de la explicación
// Subtítulos: franja libre entre la pizarra y las cabezas (zonaSegura: nunca pisan cabezas, pelo ni gorros)
// Como máximo 2 renglones por cartel (con letra legible en el celular); las líneas largas se parten en varios
const SUB = { x0: 50, ancho: 980, techo: 1140, relleno: 14, interlinea: 1.16, tamanios: [40, 37, 34], maxLineas: 2, muestreo: 3 };
type ParteSub = { texto: string; desde: number; hasta: number; u: Ubicacion; primera: boolean; inicio: number }; // inicio: índice de su 1.ª palabra en la línea
const SUB_ENTRA = 5; // frames del fundido de cada subtítulo
// Resaltado palabra por palabra (si la línea trae `palabras` con tiempos): la que se dice lleva un marcador
// amarillo; las que faltan decir, un poco más claras. El marcador es una sombra: no corre el texto de lugar.
const MARCADOR = "255,226,122"; // amarillo resaltador (rgb)
const MARCADOR_ENTRA = 3; // frames de aparición del marcador en cada palabra
const PENDIENTE = 0.5; // opacidad de las palabras que todavía no se dijeron
const MUSICA_DUCK = 0.35; // la música baja a esto (× volumen) mientras alguien habla
const MUSICA_RAMPA = 8; // frames de bajada/subida del ducking

export type PersonajeEnEscena = ConfigPersonaje & {
  x: number; // pies (px)
  y: number;
  escala: number;
  espejo?: boolean;
  color: string; // color del nombre en los subtítulos
  etiqueta: string; // nombre visible
  // "poses": personaje por poses de cuerpo entero (stop motion, sin articulaciones): el gesto de cada línea elige
  // una pose entera (poseDeGesto) y las bocas A–F hablan encima; "rig" (por defecto): piezas articuladas
  modo?: "rig" | "poses";
  poseDeGesto?: Record<string, string>;
  posesExtra?: SegmentoPose[];
  movimiento?: Movimiento; // poses intermedias (caminos) y temblor de espera
  piel?: string; // modo poses: tono de piel (carpeta poses_<piel>/ de scripts/rig/tono_piel.py)
};

// Lo que necesita un personaje por poses en cada cuadro (se arma una vez)
type Animacion = { segs: SegmentoPose[]; bocas: TramoVisema[] };
const animacionDe = (p: PersonajeEnEscena, t: Tiempos, fps: number): Animacion => ({
  segs: lineaDePoses(p.nombre, t, p.poseDeGesto ?? {}, p.posesExtra ?? []),
  bocas: t.lineas.filter((l) => l.quien === p.nombre).flatMap((l) => visemasRhubarb({ mouthCues: l.bocas }, { fps, desde: l.desde })),
});

export type ExplicacionGeometricaProps = {
  tiempos: Tiempos;
  personajes: PersonajeEnEscena[];
  pizarra: (t: Tiempos) => React.ReactNode;
  musica?: { archivo: string; volumen: number } | null;
  efectos?: { archivo: string; desde: number; volumen?: number }[];
  subtitulos?: boolean;
  resaltar?: Resaltado[]; // palabras clave de los subtítulos con su color
};

const Cuaderno: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPEL }}>
    <svg width="100%" height="100%">
      <defs>
        <pattern id="cuadricula" width={LADO_CUADRO} height={LADO_CUADRO} patternUnits="userSpaceOnUse">
          <path d={`M ${LADO_CUADRO} 0 L 0 0 0 ${LADO_CUADRO}`} fill="none" stroke={CUADRICULA} strokeWidth={2} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cuadricula)" />
      <line x1={92} y1={0} x2={92} y2={1920} stroke={MARGEN_ROJO} strokeWidth={3} />
    </svg>
  </AbsoluteFill>
);

const Palabra: React.FC<{ texto: string; estado: "dicha" | "actual" | "pendiente"; marcador: number; resaltado?: Resaltado }> = ({ texto, estado, marcador, resaltado }) => {
  const color = resaltado?.color;
  const degrade = Array.isArray(color);
  const tinta: React.CSSProperties = !color
    ? {}
    : degrade
      ? { backgroundImage: `linear-gradient(90deg, ${color.join(", ")})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
      : { color };
  return (
    <span
      style={{
        borderRadius: 10,
        background: estado === "actual" ? `rgba(${MARCADOR},${marcador})` : undefined,
        boxShadow: estado === "actual" ? `0 0 0 5px rgba(${MARCADOR},${marcador})` : undefined,
        opacity: estado === "pendiente" ? PENDIENTE : 1,
      }}
    >
      <span style={{ ...tinta, fontWeight: resaltado ? 800 : undefined }}>{texto}</span>
    </span>
  );
};

const Palabras: React.FC<{ parte: ParteSub; palabras: { text: string; fromMs: number }[]; ms: number; fps: number; resaltar: Resaltado[] }> = ({ parte, palabras, ms, fps, resaltar }) => {
  const actual = palabraEn(palabras, ms);
  const textos = parte.texto.split(/\s+/).filter(Boolean);
  return (
    <>
      {textos.map((w, k) => {
        const i = parte.inicio + k;
        const desde = palabras[i] ? ((ms - palabras[i].fromMs) / 1000) * fps : 0;
        const marcador = interpolate(desde, [0, MARCADOR_ENTRA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <React.Fragment key={k}>
            {k > 0 && " "}
            <Palabra texto={w} estado={i < actual ? "dicha" : i === actual ? "actual" : "pendiente"} marcador={marcador} resaltado={resaltadoDe(w, resaltar)} />
          </React.Fragment>
        );
      })}
    </>
  );
};

const Subtitulo: React.FC<{ t: Tiempos; personajes: PersonajeEnEscena[]; partes: Map<string, ParteSub[]>; resaltar: Resaltado[] }> = ({ t, personajes, partes, resaltar }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = lineaEn(t, f);
  if (!l) return null;
  const p = personajes.find((x) => x.nombre === l.quien);
  const lista = partes.get(l.id) ?? [];
  const parte = lista.find((x) => f >= x.desde && f < x.hasta) ?? lista[lista.length - 1];
  if (!parte) return null;
  const u = parte.u;
  const op = interpolate(f, [parte.desde - 1, parte.desde + SUB_ENTRA, parte.hasta + 2, parte.hasta + 8], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: SUB.x0, width: SUB.ancho, top: u.top, height: u.alto, display: "flex", alignItems: "flex-end", justifyContent: "center", opacity: op }}>
      <div
        style={{
          fontFamily: FUENTE,
          fontSize: u.tam,
          lineHeight: SUB.interlinea,
          fontWeight: 600,
          color: "#1f2340",
          background: "rgba(255,255,255,0.92)",
          border: `4px solid ${p?.color ?? "#1f2340"}`,
          borderRadius: 24,
          padding: `${SUB.relleno - 4}px 22px`,
          textAlign: "center",
          boxShadow: "0 5px 0 rgba(31,35,64,0.12)",
        }}
      >
        {parte.primera && <span style={{ color: p?.color, fontWeight: 700 }}>{p?.etiqueta ?? l.quien}: </span>}
        {l.palabras.length ? <Palabras parte={parte} palabras={l.palabras} ms={((f - l.desde) / fps) * 1000} fps={fps} resaltar={resaltar} /> : parte.texto}
      </div>
    </div>
  );
};

// Props de PersonajeRig de cada personaje (una vez: PersonajeRig cachea el parseo y las bocas por objeto)
const propsDe = (p: PersonajeEnEscena, t: Tiempos): PersonajeRigProps => ({
  personaje: p.nombre,
  x: p.x,
  y: p.y,
  escala: p.escala,
  espejo: p.espejo ?? false,
  expresion: p.caraBase ?? "base",
  sombra: true,
  pistas: pistasDe(p, t),
});

// Lugar de cada subtítulo: se miran las poses de los personajes durante toda la línea (cada `muestreo` cuadros) y
// se busca el hueco libre (primero sin pisar cuerpos ni brazos levantados; si no entra, sin pisar las cabezas)
const ubicarSubtitulos = (t: Tiempos, personajes: PersonajeEnEscena[], props: PersonajeRigProps[], anim: Animacion[], fps: number) => {
  const partes = new Map<string, ParteSub[]>();
  const anchoTexto = SUB.ancho - 50;
  for (const l of t.lineas) {
    const quien = personajes.find((x) => x.nombre === l.quien);
    const prefijo = `${quien?.etiqueta ?? l.quien}: `;
    const trozos = partirEnCarteles(l.texto, anchoTexto - 2 * SUB.relleno, SUB.tamanios[SUB.tamanios.length - 1], SUB.maxLineas, prefijo);
    const dur = l.hasta - l.desde;
    // Índice de la primera palabra de cada parte; con tiempos por palabra, cada parte entra cuando se dice esa palabra
    const inicios = trozos.map((_, i) => trozos.slice(0, i).reduce((n, tr) => n + tr.texto.split(/\s+/).filter(Boolean).length, 0));
    const cuadroDe = (i: number) => {
      const w = l.palabras[inicios[i]];
      return w ? Math.round(l.desde + (w.fromMs / 1000) * fps) : Math.round(l.desde + dur * trozos[i].desde);
    };
    const lista: ParteSub[] = trozos.map((tr, i) => {
      const desde = i === 0 ? l.desde : cuadroDe(i);
      const hasta = i === trozos.length - 1 ? l.hasta : cuadroDe(i + 1);
      // Dónde están los personajes mientras se muestra esta parte
      const cabezas: Caja[] = [];
      const cuerpos: Caja[] = [];
      for (let f = desde - 2; f <= hasta + 8; f += SUB.muestreo) {
        personajes.forEach((p, k) => {
          const c =
            p.modo === "poses"
              ? cajasDePose(p.nombre, poseEnCuadro(anim[k].segs, f, "neutra", p.movimiento).pose, p.espejo)
              : cajasEnPose(p.nombre, poseEn(props[k], f, fps));
          const cab = cajaEnCuadro(c.cabeza, p.x, p.y, p.escala);
          // En poses el personaje se mece entero (vaiven.ts): la cabeza puede correrse hasta `h` px
          const h = p.modo === "poses" ? holguraVaiven(p.y - cab.y0) : 0;
          cabezas.push({ x0: cab.x0 - h, x1: cab.x1 + h, y0: cab.y0 - h, y1: cab.y1 });
          cuerpos.push(cajaEnCuadro(c.cuerpo, p.x, p.y, p.escala));
        });
      }
      const u = ubicarCartel(
        { texto: (i === 0 ? prefijo : "") + tr.texto, ancho: anchoTexto, x0: SUB.x0 + 25, relleno: SUB.relleno, interlinea: SUB.interlinea, tamanios: SUB.tamanios },
        { techo: SUB.techo, piso: 1920 },
        { cabezas, cuerpos },
      );
      if (!u.entra) console.warn(`Subtítulo ${l.id}: no entra entre la pizarra y las cabezas; se sube sobre la pizarra.`);
      return { texto: tr.texto, desde, hasta, u, primera: i === 0, inicio: inicios[i] };
    });
    partes.set(l.id, lista);
  }
  return partes;
};

const Personaje: React.FC<{ props: PersonajeRigProps }> = ({ props }) => (
  <AbsoluteFill>
    <PersonajeRig {...props} />
  </AbsoluteFill>
);

const SOMBRA_POSES = { ancho: 120, alto: 18, opacidad: 0.16 };
const PersonajeEnPoses: React.FC<{ p: PersonajeEnEscena; a: Animacion }> = ({ p, a }) => {
  const f = useCurrentFrame();
  const { pose, desdeCambio } = poseEnCuadro(a.segs, f, "neutra", p.movimiento);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: p.x - SOMBRA_POSES.ancho, top: p.y - SOMBRA_POSES.alto / 2, width: SOMBRA_POSES.ancho * 2, height: SOMBRA_POSES.alto, borderRadius: "50%", background: "#000", opacity: SOMBRA_POSES.opacidad }} />
      <PersonajePoses personaje={p.nombre} pose={pose} visema={visemaEn(a.bocas, f)} x={p.x} y={p.y} escala={p.escala} espejo={p.espejo} desdeCambio={desdeCambio} f={f} piel={p.piel} />
    </AbsoluteFill>
  );
};

export const ExplicacionGeometrica: React.FC<ExplicacionGeometricaProps> = ({ tiempos: t, personajes, pizarra, musica, efectos = [], subtitulos = true, resaltar = [] }) => {
  const { fps } = useVideoConfig();
  const props = useMemo(() => personajes.map((p) => propsDe(p, t)), [personajes, t]);
  const anim = useMemo(() => personajes.map((p) => animacionDe(p, t, fps)), [personajes, t, fps]);
  const partes = useMemo(() => ubicarSubtitulos(t, personajes, props, anim, fps), [t, personajes, props, anim, fps]);
  // Ducking: la música baja mientras hay voz
  const volMusica = (f: number) => {
    if (!musica) return 0;
    const habla = t.lineas.some((l) => f >= l.desde - MUSICA_RAMPA && f < l.hasta + MUSICA_RAMPA);
    const cerca = Math.min(
      ...t.lineas.map((l) => (f < l.desde ? l.desde - f : f > l.hasta ? f - l.hasta : 0)),
    );
    const k = habla ? MUSICA_DUCK + (1 - MUSICA_DUCK) * Math.min(1, Math.max(0, cerca / MUSICA_RAMPA)) : 1;
    const fundido = interpolate(f, [0, 15, t.total - 30, t.total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return musica.volumen * k * fundido;
  };
  return (
    <AbsoluteFill>
      <Cuaderno />
      <div style={{ position: "absolute", left: PIZARRA.x, top: PIZARRA.y, width: PIZARRA.w, height: PIZARRA.h }}>{pizarra(t)}</div>
      {personajes.map((p, k) => (p.modo === "poses" ? <PersonajeEnPoses key={p.nombre} p={p} a={anim[k]} /> : <Personaje key={p.nombre} props={props[k]} />))}
      {subtitulos && <Subtitulo t={t} personajes={personajes} partes={partes} resaltar={resaltar} />}
      {t.lineas.map((l) => (
        <Sequence key={l.id} from={l.desde} durationInFrames={l.hasta - l.desde + 15} layout="none" name={`voz ${l.id}`}>
          <Audio src={staticFile(l.audio)} />
        </Sequence>
      ))}
      {efectos.map((e, i) => (
        <Sequence key={`sfx-${i}`} from={e.desde} layout="none" name="efecto">
          <Audio src={staticFile(e.archivo)} volume={() => e.volumen ?? 0.6} />
        </Sequence>
      ))}
      {musica && <Audio src={staticFile(musica.archivo)} volume={volMusica} loop />}
    </AbsoluteFill>
  );
};
