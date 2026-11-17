// Trabajo 2026-11-13_cipax_r0 — R0 de Cipax (reel 9:16, grabado con el celular): "¿Tenés una PyME…?" → dolores →
// "no es la tecnología" → giro a cámara "Para eso está Cipax" → "soluciones a medida" → (paneo hacia arriba que empalma
// con el de la toma siguiente) → "el día a día" → placa con el logo animado.
// Tiempos de palabras alineados con scripts/alinear.py (datos/alin_*.json); cada subtítulo entra en su primera palabra (−0,03 s).
import type { ComposicionTrabajo } from "../tipos";
import { enReel, lineaDeTiempo, aCuadros, FPS } from "../../plantillas/ReelCipax/calculos";
import {
  duracionReelCipax,
  ReelCipax,
  type ReelCipaxProps,
  type SubtituloCipax,
  type TomaCipax,
} from "../../plantillas/ReelCipax/ReelCipax";

const ID = "2026-11-13_cipax_r0";
const crudo = (n: string) => `trabajos/${ID}/crudos/IMG_${n}.mp4`;
const voz = (n: string) => `trabajos/${ID}/audio/voz_${n}.wav`;
const sfx = (n: string) => `biblioteca/sfx/mixkit/${n}.wav`;
const r = (x: number) => Math.round(x * 1000) / 1000;
const AL = 0.03;

const tomas: TomaCipax[] = [
  // 0) gancho: "¿Tenés una PyME y probaste un montón de herramientas digitales y ninguna te sirvió?" (2,04–6,12)
  { src: crudo("9589"), desdeS: 1.9, hastaS: 6.3, duracionS: 7.1, voz: voz("9589"), transicion: "pildora" },
  // 1) dolores, 2ª toma (la 1ª se cortó: "cuando lo hice preguntando, voy de vuelta"): 7,60–12,26
  { src: crudo("9590"), desdeS: 7.48, hastaS: 12.4, duracionS: 13.47, voz: voz("9590"), transicion: "circulo" },
  // 2) "No es que no te lleves bien con la tecnología… para cómo trabaja" (1,04–6,14); "tu organización" sale de la toma siguiente
  { src: crudo("9592"), desdeS: 0.92, hastaS: 6.3, duracionS: 7.43, voz: voz("9592"), transicion: "bandas" },
  // 3) de perfil "Tu organización." (3,98–4,74), gira a cámara: "Para eso está Cipax." (5,10–6,44). Descartadas: 9593 y 9594 (misma frase, más largas)
  { src: crudo("9595"), desdeS: 3.86, hastaS: 7.0, duracionS: 7.07, voz: voz("9595"), transicion: "isotipo", logoDesdeS: 5.75 },
  // 4) "Construimos soluciones a medida en base a lo que realmente necesitás." (1,38–5,04) y el paneo hacia arriba (arranca 5,0; pausa en 5,27; pico en 5,50 s: el corte va en el pico)
  { src: crudo("9597"), desdeS: 1.25, hastaS: 5.53, duracionS: 5.87, voz: voz("9597"), transicion: "camara" },
  // 5) arranca con el paneo hacia arriba desde el piso (0,4–0,9 s; pico 0,53) y "Pensado para hacerte más fácil el día a día." (1,20–3,50)
  { src: crudo("9599"), desdeS: 0.47, hastaS: 3.85, duracionS: 4.73, voz: voz("9599"), transicion: "placa" },
];

const subtitulos: SubtituloCipax[] = [];
const sub = (i: number, texto: string, desde: number, hasta: number, resaltar?: string) =>
  subtitulos.push({ texto, inicioS: r(enReel(tomas, i, desde) - AL), finS: r(enReel(tomas, i, hasta)), resaltar });
sub(0, "¿Tenés una PyME", 2.04, 2.82, "PyME");
sub(0, "y probaste un montón", 3.06, 3.92);
sub(0, "de herramientas digitales", 3.94, 5.06);
sub(0, "y ninguna te sirvió?", 5.32, 6.12);
sub(1, "¿No podés dar seguimiento", 7.6, 8.46);
sub(1, "al prospecto,", 8.5, 9.12);
sub(1, "la conciliación bancaria", 9.4, 10.24);
sub(1, "te lleva horas", 10.28, 11.02);
sub(1, "o no sabés cuánto ganás?", 11.22, 12.26);
sub(2, "No es que no te lleves bien", 1.04, 1.92);
sub(2, "con la tecnología,", 1.96, 2.84, "tecnología");
sub(2, "es que esas herramientas", 3.16, 4.28);
sub(2, "no se pensaron", 4.52, 5.2);
sub(2, "para cómo trabaja", 5.3, 6.14);
sub(3, "tu organización.", 3.98, 4.74, "organización");
sub(3, "Para eso está Cipax.", 5.1, 6.44, "Cipax");
sub(4, "Construimos soluciones", 1.38, 2.62);
sub(4, "a medida", 2.68, 3.06, "a medida");
sub(4, "en base a lo que", 3.26, 4.04);
sub(4, "realmente necesitás.", 4.1, 5.04); // ⚠️ Whisper escribió "necesitas"; se subtitula con voseo (verificar al escuchar)
sub(5, "Pensado para hacerte", 1.2, 2.12);
sub(5, "más fácil", 2.16, 2.72);
sub(5, "el día a día.", 3.0, 3.5, "día a día");

const { cortes, fin } = lineaDeTiempo(tomas);
const s = (cuadro: number) => r(cuadro / FPS);
const PLACA_DUR = 4.0;
const finS = s(fin);

const reel: ReelCipaxProps = {
  tomas,
  subtitulos,
  mostrarSubtitulos: true,
  pildoras: {
    items: [
      { texto: "Seguimiento de prospectos", icono: "embudo", inicioS: r(enReel(tomas, 1, 8.12) - 0.05) },
      { texto: "Conciliación bancaria", icono: "banco", inicioS: r(enReel(tomas, 1, 9.5) - 0.05) },
      { texto: "¿Cuánto ganás?", icono: "grafico", inicioS: r(enReel(tomas, 1, 11.66) - 0.05) },
    ],
    finS: s(cortes[1] - 13), // se van antes de que caiga el punto del círculo
  },
  placa: { durS: PLACA_DUR, lema: "DIGITAL SOLUTIONS" },
  musica: {
    src: `trabajos/${ID}/audio/musica.wav`,
    puntos: [
      [0, 0],
      [0.25, 0.055],
      [r(finS - 0.6), 0.055],
      [r(finS + 0.2), 0.5],
      [r(finS + PLACA_DUR - 0.9), 0.5],
      [r(finS + PLACA_DUR), 0],
    ],
  },
  sonidos: [
    { src: sfx("mixkit-3005-explainer-video-pops-whoosh-light-pop"), inicioS: s(cortes[0] - 9), vol: 0.22 },
    ...[8.12, 9.5, 11.66].map((x, k) => ({ src: sfx("mixkit-2356-dry-pop-up-notification-alert"), inicioS: r(enReel(tomas, 1, x) - 0.05), vol: 0.14 + 0.02 * k })),
    { src: sfx("mixkit-2357-bubble-pop-up-alert-notification"), inicioS: s(cortes[1] - 13), vol: 0.2 },
    { src: sfx("mixkit-3005-explainer-video-pops-whoosh-light-pop"), inicioS: s(cortes[2] - 8), vol: 0.22 },
    { src: sfx("mixkit-2356-dry-pop-up-notification-alert"), inicioS: r(enReel(tomas, 3, 5.75)), vol: 0.2 },
    { src: sfx("mixkit-1492-cinematic-whoosh-fast-transition"), inicioS: s(cortes[3] - 8), vol: 0.22 },
    { src: sfx("mixkit-1492-cinematic-whoosh-fast-transition"), inicioS: s(cortes[4] - 6), vol: 0.18 },
    { src: sfx("mixkit-2574-software-interface-start"), inicioS: s(fin + 34), vol: 0.3 },
  ],
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "cipax-r0", component: ReelCipax, durationInFrames: duracionReelCipax(reel), defaultProps: reel, salida: "r0_9x16" },
  { id: "cipax-r0-placa", component: ReelCipax, durationInFrames: aCuadros(PLACA_DUR), defaultProps: { ...reel, tomas: [], subtitulos: [], pildoras: undefined, sonidos: [], musica: undefined }, salida: "r0-placa_9x16" },
];
