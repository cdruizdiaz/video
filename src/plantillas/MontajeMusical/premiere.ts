// MontajeMusical → línea de tiempo para Premiere (ver comunes/premiere.ts y scripts/a-premiere.mjs).
// V1: tomas con el reencuadre como keyframes · A1: audio original con fundidos cruzados · A2: whoosh.
// Título, notas, destellos y cierre van en la capa de gráficos (V2).
import type {
  ClipAudioPremiere,
  ClipVideoPremiere,
  FundidoPremiere,
  LineaPremiere,
} from "../comunes/premiere";
import {
  ALTO,
  ANCHO,
  CRUCE_AUDIO,
  duracionMontajeMusical,
  encuadreEn,
  frameDesde,
  framesTomaMusical,
  FPS,
  FUNDIDO_FINAL,
  GOLPE_FRAMES,
  iniciosTomas,
  WHOOSH_ANTES,
  WHOOSH_DB,
  WHOOSH_DURA,
} from "./calculos";
import type { MontajeMusicalProps } from "./MontajeMusical";

const PASO_KEYFRAMES = 15; // un keyframe cada medio segundo después del golpe de zoom

const framesConKeyframe = (dura: number) => {
  const fs = new Set<number>();
  for (let f = 0; f <= Math.min(GOLPE_FRAMES, dura - 1); f++) fs.add(f); // golpe: uno por frame
  for (let f = 0; f < dura; f += PASO_KEYFRAMES) fs.add(f);
  fs.add(dura - 1);
  return [...fs].sort((a, b) => a - b);
};

export const lineaMontajeMusical = (p: MontajeMusicalProps): LineaPremiere => {
  const ini = iniciosTomas(p.tomas);
  const video: ClipVideoPremiere[] = [];
  const audio: ClipAudioPremiere[] = [];
  const fundidos: FundidoPremiere[] = [];

  p.tomas.forEach((t, i) => {
    const dura = framesTomaMusical(t);
    const archivo = `${p.carpetaVideos}/${t.clip}.mp4`;
    video.push({
      archivo,
      nombre: t.clip,
      inicio: ini[i],
      entrada: frameDesde(t),
      duracion: dura,
      encuadre: framesConKeyframe(dura).map((f) => {
        const { z, izq, arriba } = encuadreEn(t, f, dura);
        return { frame: f, zoom: z, izq, arriba };
      }),
    });
    audio.push({
      archivo,
      pista: 1,
      inicio: ini[i],
      entrada: frameDesde(t),
      duracion: dura,
      gananciaDb: t.gananciaDb ?? 0,
      video: i,
    });
    if (i > 0) {
      fundidos.push({
        pista: 1,
        frame: ini[i],
        duracion: CRUCE_AUDIO,
        tipo: "cruzado",
      });
      if (p.whoosh) {
        audio.push({
          archivo: p.whoosh,
          pista: 2,
          inicio: ini[i] - WHOOSH_ANTES,
          entrada: 0,
          duracion: WHOOSH_DURA,
          gananciaDb: p.whooshDb ?? WHOOSH_DB,
        });
      }
    }
  });
  const total = duracionMontajeMusical(p);
  fundidos.push({
    pista: 1,
    frame: total,
    duracion: FUNDIDO_FINAL,
    tipo: "salida",
  });

  return {
    fps: FPS,
    ancho: ANCHO,
    alto: ALTO,
    duracion: total,
    video,
    audio,
    fundidos,
    graficos: {
      titulo: p.titulo,
      cierre: p.cierre,
      apariencia: p.apariencia,
      estilo: p.estilo,
      tomas: p.tomas.map((t) => ({
        frames: framesTomaMusical(t),
        etiqueta: t.etiqueta,
      })),
    },
  };
};
