// Trabajo 2026-10-28_docba_r4-nov — R4 NOV de DOCBA (resumen de lo que ofrece el loft, 9:16): la voz en off (IMG_8580, solo el audio) cuenta
// "A DOCBA no hace falta venir con un plan…" sobre la host llegando, sentándose, pidiendo, trabajando y brindando; montaje de inserts
// "un montón de detalles", la host a cámara (IMG_9453) y la placa con el horario. Tiempos "src" = segundos del proxy; los de voz están
// alineados con scripts/alinear.py (20 ms por palabra) y cada subtítulo entra en su primera palabra (−0,03 s). Los clips van sin su audio.
import type { ComposicionTrabajo } from "../tipos";
import {
  duracionReelDocba,
  ReelDocba,
  type ClipDocba,
  type PistaDocba,
  type ReelDocbaProps,
  type SubtituloDocba,
} from "../../plantillas/ReelDocba/ReelDocba";

const ID = "2026-10-28_docba_r4-nov";
const crudo = (n: string) => `trabajos/${ID}/crudos/${n}.mp4`;
const audio = (n: string) => `trabajos/${ID}/audio/${n}.wav`;
const r = (x: number) => Math.round(x * 1000) / 1000;
const AL = 0.03;

const clips: ClipDocba[] = [];
const pistas: PistaDocba[] = [];
const subtitulos: SubtituloDocba[] = [];
let t = 0;
const seg = (src: string, desdeS: number, durS: number, extra: Partial<ClipDocba> = {}) => {
  clips.push({ src, desdeS, durS, inicioS: r(t), ...extra });
  const inicio = t;
  t = r(t + durS);
  return inicio;
};
const sub = (texto: string, desde: number, hasta: number) => subtitulos.push({ texto, inicioS: r(desde - AL), finS: r(hasta) });

// ---------- Voz en off (IMG_8580): 5 frases; la primera palabra suena en 0,72 s del archivo → se empieza en 0,6 s ----------
const VOZ_DESDE = 0.6;
const VOZ_FIN = 16.1;
const OFF = 0.333; // el primer plano termina en 2:09 (2 s y 9 cuadros = 2,3 s; pedido de la usuaria, 2026-10-30): la voz después de "plan", los subtítulos, los planos siguientes y la música se corren OFF respecto del original (1,97 s)
const tv = (s: number) => r(s - VOZ_DESDE + OFF); // segundo del archivo de voz → segundo del reel
// la voz en dos partes: "A DOCBA no hace falta venir con un plan." (sin correr) y, tras un silencio con música, "Venís, te sentás…" (corrida OFF)
const VOZ_CORTE = 2.85; // silencio entre "plan" (termina en 2,57 s) y "Venís" (3,08 s) del archivo de voz
pistas.push({ src: audio("voz_n19"), desdeS: VOZ_DESDE, durS: r(VOZ_CORTE - VOZ_DESDE), inicioS: 0, entraS: 0.02, saleS: 0.05 });
pistas.push({ src: audio("voz_n19"), desdeS: VOZ_CORTE, durS: r(VOZ_FIN - VOZ_CORTE), inicioS: r(VOZ_CORTE - VOZ_DESDE + OFF), entraS: 0.02, saleS: 0.05 });

// 1) "A DOCBA no hace falta venir con un plan." — la host llegando (IMG_9444: abre la puerta y entra) y dejando la cartera (IMG_9448)
seg(crudo("luz_9444"), 0, 1.97 + OFF); // arranca donde siempre; "plan" termina en 1,97 s y el plano sigue 1 s más (2,3 s) // IMG_9444 con la cara iluminada (retocar_luz.py)
seg(crudo("IMG_9448"), 2.37, 0.53); // deja la cartera (0,17 s menos: el primer plano se alargó y todo lo que sigue queda igual de sincronizado con la voz)
// 2) "Venís, te sentás, comés algo rico mientras te tomás un café…" — montaje de clips cortos (IMG_9448, 4K 30 fps)
seg(crudo("IMG_9448"), 10.3, 0.7); // escanea la carta
seg(crudo("IMG_9448"), 19.0, 0.7); // llama al mozo
seg(crudo("IMG_9448"), 23.0, 0.6); // hace su pedido
seg(crudo("IMG_9448"), 31.0, 0.6); // llega el pedido
seg(crudo("IMG_9448"), 46.3, 0.8); // toma café
// 3) "…y si se te activa el laburo, el espacio te acompaña." — agarra la compu y la abre (un solo plano, sin el del celular y la carta), escribe
seg(crudo("IMG_9448"), 39.5, 1.6);
seg(crudo("IMG_9448"), 49.0, 1.1);
// 4) "…o te quedás, porque cuando cae la noche, también podés disfrutar de una copita." — llega la amiga y brindan (IMG_9449 / IMG_9450)
// video original con la luz apenas corregida (retocar_luz.py)
const inicioNoche = seg(crudo("noche_a"), 0, 1.5); // el corte compu → brindis (8,6 s) lleva el flash corto de R1_VFinal
seg(crudo("noche_b"), 0, 1.4);
seg(crudo("IMG_9451"), 4.0, 1.4); // "una copita": el choque de copas (pedido de la usuaria, desde el 0:04 de IMG_9451)
// 5) "Y entre medio, un montón de detalles para descubrir." — menú, comida, baristas, murales y personas (inserts de Producciones)
const inicioInserts = t; // el corte a los inserts (12,9 s) lleva el flash de siempre
for (const n of ["ins_menu", "ins_comida", "ins_barista", "ins_mural", "ins_gente"]) seg(crudo(n), 0.05, 0.52, { empuje: true });

// (sin subtítulos en "A DOCBA no hace falta venir con un plan.": pedido de la usuaria, 2026-10-30)
sub("Venís,", tv(3.08), tv(3.46));
sub("te sentás,", tv(3.56), tv(4.1));
sub("comés algo rico", tv(4.22), tv(4.84));
sub("mientras te tomás", tv(4.9), tv(5.42));
sub("un café.", tv(5.44), tv(5.76));
sub("Y si se activa", tv(6.48), tv(7.1));
sub("el laburo,", tv(7.12), tv(7.52));
sub("el espacio", tv(7.74), tv(8.18));
sub("te acompaña.", tv(8.26), tv(8.76));
sub("O te quedás,", tv(9.52), tv(10.16));
sub("porque cuando", tv(10.3), tv(10.7));
sub("cae la noche,", tv(10.74), tv(11.26));
sub("también podés", tv(11.4), tv(11.92));
sub("disfrutar", tv(11.94), tv(12.3));
sub("de una copita.", tv(12.4), tv(12.94));
sub("Y entre medio,", tv(13.68), tv(14.22));
sub("un montón de", tv(14.44), tv(14.88));
sub("detalles", tv(14.94), tv(15.34));
sub("para descubrir.", tv(15.44), tv(16.0));

// 6) La host a cámara (IMG_9453): "Vení como quieras, quedate lo que quieras. Te esperamos en DOCBA." (habla de 2,90 a 5,94 s)
const H_DESDE = 2.7;
const H_FIN = 6.1;
const ZOOM_HOST = 0.1; // acercamiento durante todo el plano: ni leve (5 %) ni grande (16 %), hacia la cara
// v7 (2026-11-05): la host NO puede aparecer desde 0:16 → su frase queda como voz en off sobre inserts (tomas elegidas por la usuaria)
// y la placa entra apenas termina "DOCBA" (5,94 s de la toma). La música queda igual que en la v6 (MUSICA_PLACA = donde entraba la placa).
const HOST_A_CAMARA = false;
const h = t;
const th = (s: number) => h + s - H_DESDE;
if (HOST_A_CAMARA) {
  seg(crudo("IMG_9453"), H_DESDE, r(H_FIN - H_DESDE + 0.6), { empuje: true, push: ZOOM_HOST, origen: "50% 35%" }); // 0,6 s extra: queda bajo el barrido de la placa
} else {
  const fin = (s: number) => r(th(s) - t); // dura hasta el segundo s de la toma de la host
  seg(crudo("ins_fin_cartel"), 0.05, fin(3.7)); // "Vení como quieras," — cartel de la fachada (C0133)
  seg(crudo("ins_fin_cowork"), 0.05, fin(4.65)); // "quedate lo que quieras." — gente trabajando (C0033)
  seg(crudo("ins_fin_mural"), 0.05, fin(5.4)); // "Te esperamos" — mural (C0147)
  seg(crudo("ins_fin_cafe"), 0.0, fin(5.94 + 0.6), { empuje: true }); // "en DOCBA" — se toma un café (C0017 desde 0:07); sigue 0,6 s bajo el barrido de la placa
}
pistas.push({ src: audio("hab_IMG_9453"), desdeS: H_DESDE, durS: r(H_FIN - H_DESDE), inicioS: r(h), entraS: 0.01, saleS: 0.03 });
sub("Vení como quieras,", th(2.9), th(3.62));
sub("quedate lo que quieras.", th(3.8), th(4.6));
sub("Te esperamos en", th(4.94), th(5.94)); // sin la palabra "DOCBA" del final (pedido de la usuaria, 2026-10-30): un solo subtítulo "Te esperamos en"
const inicioPlaca = r(th(HOST_A_CAMARA ? H_FIN : 5.94));
const MUSICA_PLACA = r(th(H_FIN)); // la música sube donde siempre (la usuaria aprobó el sonido de la v6)

// Música: "paulyudin-hip-hop-relax-boombap" (Clientes/DOCBA/Música; 95,7 bpm, primer compás en 1,95 s del archivo): suena desde el primer
// cuadro con el compás en el cuadro 0, "Venís" (2,5 s), "laburo", etc.; de fondo bajo la voz, más baja con la host y fuerte en la placa.
const musica = {
  src: `trabajos/${ID}/audio/musica_full.wav`,
  desdeS: 1.95 - OFF, // el compás sigue cayendo en el "Venís" (corrido OFF)
  inicioS: 0,
  puntos: [
    [0, 0],
    [0.4, 0.16],
    [r(th(1.8)), 0.16],
    [r(th(2.7)), 0.07], // baja a fondo con la host
    [r(MUSICA_PLACA - 0.3), 0.07],
    [r(MUSICA_PLACA + 0.5), 0.45],
    [r(MUSICA_PLACA + 3.0), 0.45],
    [r(MUSICA_PLACA + 3.8), 0],
  ] as [number, number][],
};

const reel: ReelDocbaProps = {
  clips,
  pistas,
  subtitulos,
  mostrarSubtitulos: true,
  flashes: [inicioInserts],
  flashesCortos: [inicioNoche],
  musica,
  placa: { inicioS: inicioPlaca, durS: r(MUSICA_PLACA + 3.8 - inicioPlaca), invertida: true, leyenda: "LUNES A SÁBADO · 8:30 A 21 HS", direccion: "BUENOS AIRES 864 · NUEVA CÓRDOBA" },
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "docba-r4-nov", component: ReelDocba, durationInFrames: duracionReelDocba(reel), defaultProps: reel, salida: "r4-nov_9x16" },
  { id: "docba-r4-nov-cortes", component: ReelDocba, durationInFrames: duracionReelDocba(reel), defaultProps: { ...reel, mostrarSubtitulos: false }, salida: "r4-nov-cortes_9x16" },
];
