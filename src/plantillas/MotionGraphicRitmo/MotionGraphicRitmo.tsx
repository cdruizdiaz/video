// Plantilla MotionGraphicRitmo: pieza de motion graphics al compás de la música. Títulos que entran por máscara
// con Easy Ease y blur vertical en las palabras clave de la voz (Whisper) llevadas al pulso (librosa), camera punch
// en cada compás, personaje del rig con boca de Rhubarb y brazos que cambian de pose en cada compás (desfasados),
// detrás del primer plano (góndola dibujada o video + recorte por profundidad), y botón de llamado a la acción con
// física de resorte en el último compás. Cálculos y esquema en ./calculos.ts.
import { loadFont } from "@remotion/google-fonts/Sora";
import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type Caja, cajaEnCuadro, cajasEnPose } from "../../rig/cajas";
import { DetrasDePersona } from "../comunes/DetrasDePersona";
import { TituloMascara } from "../comunes/TituloMascara";
import { pisoLibre } from "../comunes/zonaSegura";
import { PersonajeRig } from "../PersonajeRig/PersonajeRig";
import { poseEn, type PersonajeRigProps, type Pista } from "../PersonajeRig/calculos";
import { Gondola } from "./Gondola";
import {
  ESPACIO_LINEAS,
  INTERLINEA,
  pistasBrazos,
  punchEn,
  tamanioBloque,
  tiemposBloques,
  zMotionGraphicRitmo,
  type MotionGraphicRitmoProps,
} from "./calculos";

export { zMotionGraphicRitmo, type MotionGraphicRitmoProps } from "./calculos";

const { fontFamily } = loadFont("normal", { weights: ["800"], subsets: ["latin", "latin-ext"] });

const COLOR_TEXTO = "#FFFFFF";
const COLOR_ACENTO = "#FFD60A";
const MARCA = { fondo: "#FFD60A", color: "#0B1B3A" };
const SOMBRA_TEXTO = "drop-shadow(0 6px 18px rgba(0,0,0,0.45))";
const BOTON = { alto: 132, tam: 58, espacio: 36, color: "#0B1B3A", resorte: { damping: 9, stiffness: 170, mass: 0.7 }, latido: 0.06, latidoDura: 6 };
const ROTULO = {
  margen: 80, // px debajo del borde del mueble
  caja: { position: "absolute", left: 0, width: "100%", bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", opacity: 0.92, fontWeight: 800, fontSize: 124, letterSpacing: -2 } as React.CSSProperties,
};
const MUESTREO_ZONA = 3; // frames entre muestras de la caja del personaje
const SALIDA_TITULO = 16; // frames que tarda en irse un bloque (10 de salida + desfase entre líneas)
const RAMPA_DUCKING = 4; // frames
const ESPERA_PRIMERA_VOZ = 30; // frames: mira hacia arriba antes de hablar

const dB = (v: number) => Math.pow(10, v / 20);

export const MotionGraphicRitmo: React.FC<MotionGraphicRitmoProps> = (entrada) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = useMemo(() => zMotionGraphicRitmo.parse(entrada), [entrada]);
  const compases = useMemo(() => p.pulsos.compases.map((s) => Math.round(s * fps)), [p, fps]);
  const bloques = useMemo(() => tiemposBloques(p, fps), [p, fps]);
  const voces = useMemo(() => p.voces.map((v) => ({ ...v, f0: Math.round(v.desde * fps), f1: Math.round((v.desde + v.duracion) * fps) })), [p, fps]);
  const fBoton = useMemo(() => {
    const lineas = bloques[bloques.length - 1]?.lineas ?? [];
    const ultimo = lineas[lineas.length - 1]?.entra ?? 0;
    const despues = compases.filter((c) => c > ultimo);
    return despues[despues.length - 1] ?? ultimo + 15;
  }, [bloques, compases]);

  // Personaje: respira, parpadea, cambia de cara por bloque, habla cada frase (Rhubarb), brazos al compás
  const personaje: PersonajeRigProps = useMemo(() => {
    const pj = p.personaje;
    const pistas: Pista[] = [
      { tipo: "respirar", inicio: 0 },
      { tipo: "parpadear", inicio: 0, cada: 70 },
      { tipo: "mirada", inicio: 0, x: 0, y: -0.6, duracion: ESPERA_PRIMERA_VOZ, entrada: 5 },
      ...bloques.flatMap((b, i) => (b.expresion ? [{ tipo: "expresion" as const, inicio: b.entra, fin: bloques[i + 1]?.entra, nombre: b.expresion }] : [])),
      ...voces.map((v) => ({ tipo: "hablar" as const, inicio: v.f0, fin: v.f1, rhubarb: v.rhubarb, idioma: "es" as const })),
      ...pistasBrazos(compases, pj.poses),
      ...(p.cta ? [{ tipo: "saltar" as const, inicio: fBoton - 4, duracion: 18, altura: 50 }] : []),
    ] as Pista[];
    return { personaje: pj.nombre, x: pj.x, y: pj.y, escala: pj.escala, pistas };
  }, [p, bloques, voces, compases, fBoton]);

  // Zona de cada bloque: del techo hasta encima del personaje (cabeza, pétalos y manos) mientras se ve el bloque
  const pisos = useMemo(() => {
    const cajas: { k: number; caja: Caja }[] = [];
    for (let k = 0; k < durationInFrames; k += MUESTREO_ZONA) {
      const c = cajasEnPose(p.personaje.nombre, poseEn(personaje, k, fps));
      cajas.push({ k, caja: cajaEnCuadro(c.cuerpo, p.personaje.x, p.personaje.y, p.personaje.escala) });
    }
    return bloques.map((b) => {
      const hasta = b.sale === null ? durationInFrames : b.sale + SALIDA_TITULO;
      const visibles = cajas.filter((c) => c.k >= b.entra - MUESTREO_ZONA && c.k <= hasta).map((c) => c.caja);
      return pisoLibre(visibles, p.zona.x0, p.zona.x0 + p.zona.ancho, 1920);
    });
  }, [p, personaje, bloques, durationInFrames, fps]);

  const escala = punchEn(f, compases);
  const ducking = (fr: number) => {
    const d = Math.min(...voces.map((v) => (fr < v.f0 ? v.f0 - fr : fr >= v.f1 ? fr - v.f1 + 1 : 0)));
    return interpolate(d, [0, RAMPA_DUCKING], [dB(p.musica.bajoVoz), 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  };

  const actor = <PersonajeRig {...personaje} />;
  const titulos = (
    <AbsoluteFill style={{ filter: SOMBRA_TEXTO }}>
      {bloques.map((b, i) => {
        const ultimo = i === bloques.length - 1 && p.cta;
        const alto = pisos[i] - p.zona.techo - (ultimo ? BOTON.alto + BOTON.espacio : 0);
        const tam = tamanioBloque(
          b.lineas.map((l) => l.texto),
          p.zona.ancho,
          alto,
          p.tamanios,
        );
        if (f < b.entra || (b.sale !== null && f > b.sale + SALIDA_TITULO)) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.zona.x0,
              width: p.zona.ancho,
              top: p.zona.techo,
              height: alto,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: tam * ESPACIO_LINEAS,
            }}
          >
            {b.lineas.map((l, k) => (
              <TituloMascara
                key={k}
                id={`titulo-${i}-${k}`}
                texto={l.texto}
                entra={l.entra}
                sale={b.sale === null ? null : b.sale + k * 2}
                tam={tam}
                interlinea={INTERLINEA}
                fuente={fontFamily}
                color={l.estilo === "acento" ? COLOR_ACENTO : COLOR_TEXTO}
                caja={l.estilo === "marca" ? MARCA : null}
              />
            ))}
          </div>
        );
      })}
      {p.cta && f >= fBoton && <Boton texto={p.cta.boton} color={p.cta.color} desde={fBoton} top={pisos[pisos.length - 1] - BOTON.alto} pulsos={p.pulsos.pulsos} />}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1124" }}>
      <AbsoluteFill style={{ transform: `scale(${escala})` }}>
        {p.fondo.tipo === "video" ? (
          <DetrasDePersona video={p.fondo.video} recorte={p.fondo.recorte} desde={p.fondo.desde} volumen={0}>
            {actor}
          </DetrasDePersona>
        ) : (
          <>
            <Gondola capa="fondo" frente={p.fondo.frente} />
            {actor}
            <Gondola capa="frente" frente={p.fondo.frente} />
            {p.fondo.rotulo && (
              <div style={{ ...ROTULO.caja, top: p.fondo.frente + ROTULO.margen, fontFamily }}>
                {p.fondo.rotulo}
              </div>
            )}
          </>
        )}
        {titulos}
      </AbsoluteFill>
      <Audio src={staticFile(p.musica.archivo)} volume={(fr) => p.musica.volumen * ducking(fr)} />
      {voces.map((v, i) => (
        <Sequence key={i} from={v.f0} durationInFrames={v.f1 - v.f0 + fps} layout="none" name={`voz ${i + 1}`}>
          <Audio src={staticFile(v.archivo)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Botón del llamado a la acción: entra con resorte (escala 0 → 1 con rebote) y late en cada pulso posterior
const Boton: React.FC<{ texto: string; color: string; desde: number; top: number; pulsos: number[] }> = ({ texto, color, desde, top, pulsos }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: f - desde, fps, config: BOTON.resorte });
  const latido = pulsos
    .map((s) => Math.round(s * fps))
    .filter((pf) => pf > desde + 8)
    .reduce((m, pf) => Math.max(m, f >= pf && f < pf + BOTON.latidoDura ? 1 - (f - pf) / BOTON.latidoDura : 0), 0);
  return (
    <div style={{ position: "absolute", top, left: 0, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          height: BOTON.alto,
          padding: `0 ${BOTON.alto * 0.45}px`,
          borderRadius: BOTON.alto / 2,
          backgroundColor: color,
          color: BOTON.color,
          fontFamily,
          fontWeight: 800,
          fontSize: BOTON.tam,
          display: "flex",
          alignItems: "center",
          transform: `scale(${entrada * (1 + BOTON.latido * latido)})`,
          boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
        }}
      >
        {texto}
      </div>
    </div>
  );
};
