// Trabajo 2026-10-28_docba_r3-nov — R3 NOV de DOCBA (cierre de año con el equipo, 9:16): arranca con un insert de pantalla de celular
// (chat de grupo lleno de mensajes, con sonidos de mensaje) sobre un primer plano de los ojos de la host; en "nosotros te lo resolvemos"
// entra el beat de la música y todo el montaje corta sobre los pulsos (99,4 bpm). Tiempos "src" = segundos del proxy; los de voz están
// medidos sobre la energía del audio (arranques.py), no con el DTW de Whisper.
import type { ComposicionTrabajo } from "../tipos";
import {
  duracionReelDocba,
  ReelDocba,
  type ClipDocba,
  type PistaDocba,
  type ReelDocbaProps,
  type SubtituloDocba,
} from "../../plantillas/ReelDocba/ReelDocba";

const ID = "2026-10-28_docba_r3-nov";
const crudo = (n: string) => `trabajos/${ID}/crudos/${n}.mp4`;
const audio = (n: string) => `trabajos/${ID}/audio/${n}.wav`;
const r = (x: number) => Math.round(x * 1000) / 1000;

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
const sub = (texto: string, desde: number, hasta: number) => subtitulos.push({ texto, inicioS: r(desde), finS: r(hasta) });
const pista = (n: string, desdeS: number, durS: number, inicioS: number, extra: Partial<PistaDocba> = {}) =>
  pistas.push({ src: audio(n), desdeS, durS, inicioS: r(inicioS), entraS: 0.03, saleS: 0.03, ...extra });

// Tiempos de voz: alineación forzada (scripts/alinear.py: wav2vec2 CTC en español, 20 ms) sobre cada audio con su texto; los subtítulos
// entran en el inicio de la primera palabra de cada trozo (menos 0,03 s) y nunca antes de que se diga.
const AL = 0.03;

const MUSICA_INICIO = 5.4; // el beat arranca justo en "nosotros te lo resolvemos"

// 1) 0–4,6 s: directamente la placa de inicio de la usuaria (MSJwppFondonaranja.ai: conversación estilo iMessage sobre degradado naranja,
//    descompuesta en capas con extraer_placa.py): cada globo se infla y su texto se revela; al final los globos se van y la placa se
//    disuelve sobre el primer cuadro del primer video de la host (congelado y desenfocado), que se enfoca con un zoom rápido y empieza a
//    hablar. Sin sonidos de notificación (los agrega la usuaria después), ni tráfico, ni música.
const CHAT_DUR = 4.3;
const SALIDA_CHAT = 9999; // sin animación de salida: la placa queda completa y corta en seco al video
const GLOBOS_FRAMES = [14, 42, 70, 96]; // cuadro en que se infla cada globo
t = CHAT_DUR; // corte en seco: del último cuadro de la placa a ella apagando el celular

// 2) IMG_9483 desde 6,75 s: corte en seco a ella apagando el celular (lo bloquea y lo baja); "Tranqui, nosotros te lo resolvemos" y se va a la puerta.
const A_DESDE = 6.75; // ella está apagando el celular (lo bloquea y lo baja)
const A_DUR = r(10.0 - A_DESDE);
const a = seg(crudo("IMG_9483_col2"), A_DESDE, A_DUR);
const ta = (src: number) => a + src - A_DESDE;
pista("hab_IMG_9483", A_DESDE, A_DUR, a, { entraS: 0.02, saleS: 0.05 });
sub("Tranqui,", ta(7.34) - AL, ta(7.92));
sub("nosotros", ta(7.92) - AL, ta(8.3));
sub("te lo resolvemos.", ta(8.3) - AL, ta(9.05));

// 3) Arranca directo con ella ya en movimiento (IMG_9485): "En DOCBA podés reservar un espacio…"
const C_DESDE = 0.83; // "En" arranca en 0,90 s del proxy
const C_FIN = 4.17; // termina "equipo"
const C_DUR = r(C_FIN - C_DESDE);
const c = seg(crudo("IMG_9485_col2"), C_DESDE, C_DUR);
const tc = (src: number) => c + src - C_DESDE;
pista("hab_IMG_9485", C_DESDE, C_DUR, c, { entraS: 0.01, saleS: 0.02 });
sub("En DOCBA", tc(0.9) - AL, tc(1.36));
sub("podés reservar", tc(1.36) - AL, tc(1.96));
sub("un espacio", tc(1.96) - AL, tc(2.5));
sub("para hacer", tc(2.5) - AL, tc(2.84));
sub("el cierre", tc(2.84) - AL, tc(3.18));
sub("de año", tc(3.18) - AL, tc(3.48));
sub("con tu equipo,", tc(3.48) - AL, tc(C_FIN));

// 4) Voz en off (limpia): arranca al toque de "equipo". La grabación trae 1,7 s de charla de fondo antes de "acompañado" (se recorta).
const VO_DESDE = 1.68; // "acompañado" arranca en 1,74 s del archivo
const VO_FIN = 7.4;
const v = c + C_DUR;
const sv = (src: number) => v + src - VO_DESDE;
// tres inserts en los 3,3 s de la primera frase de la VO: tostón (C0092), huevo centrado (C0100) y brindis de dos personas (C0115, estirado)
const INS = [0.9, 0.85]; // duraciones de los dos primeros; el tercero llega hasta donde empieza "Porque"
seg(crudo("ins_mesa"), 0.1, INS[0], { empuje: true });
seg(crudo("ins_platos"), 0.1, INS[1], { alejar: true, zoom: 1.22, origen: "50% 52%" }); // plano más cercano (detalle del huevo)
seg(crudo("ins_copas"), 0.1, r(sv(5.0) - t), { empuje: true });
pista("voz_1_n19", VO_DESDE, VO_FIN - VO_DESDE, v, { entraS: 0, saleS: 0.05 });
sub("acompañado", sv(1.74) - AL, sv(2.2));
sub("de un montón", sv(2.2) - AL, sv(2.68));
sub("de opciones", sv(2.68) - AL, sv(3.08));
sub("de carta", sv(3.08) - AL, sv(3.66));
sub("para compartir.", sv(3.66) - AL, sv(4.69));
// 5) "Porque todos los proyectos merecen…" sobre el equipo (C0042 desde el 0:09); el clip de IMG_9491 arranca justo cuando chocan las
//    copas, que cae en "brindis".
seg(crudo("ins_reunion"), 0, r(sv(6.7) - t));
sub("Porque todos", sv(5.16) - AL, sv(5.58));
sub("los proyectos", sv(5.58) - AL, sv(6.28));
sub("merecen", sv(6.28) - AL, sv(6.66));
sub("un brindis.", sv(6.66) - AL, sv(7.34));

// 6) IMG_9491 desde el choque de copas (1,55 s) hasta que ella termina "todo bajo un mismo techo"; ahí entra la placa (colores invertidos).
//    Solo suena la voz de ella (se silencia la charla del equipo del principio del clip).
const D_DESDE = 1.55;
const D_FIN = 7.0; // "techo" termina en 6,73 s
const D_VOZ = 2.8; // acá empieza ella
const d0 = t;
const td = (src: number) => d0 + src - D_DESDE;
seg(crudo("IMG_9491_col"), D_DESDE, D_FIN - D_DESDE + 0.5); // 0,5 s extra: queda bajo el barrido de la placa
pista("hab_IMG_9491", D_VOZ, D_FIN - D_VOZ, td(D_VOZ), { entraS: 0.05, saleS: 0.05 });
sub("Y cuando llega la hora", td(2.9) - AL, td(3.66));
sub("del after office,", td(3.66) - AL, td(4.6));
sub("siguen disfrutando.", td(4.6) - AL, td(5.3));
sub("Todo bajo", td(5.66) - AL, td(6.22));
sub("un mismo techo.", td(6.22) - AL, td(6.76));
const inicioPlaca = r(td(D_FIN));

const reel: ReelDocbaProps = {
  clips,
  pistas,
  subtitulos,
  mostrarSubtitulos: true,
  placa: { inicioS: inicioPlaca, durS: 3.8, leyenda: "RESERVÁ TU FIN DE AÑO EN DOCBA", direccion: "BUENOS AIRES 864 · NUEVA CÓRDOBA", invertida: true },
  chat: { inicioS: 0, durS: CHAT_DUR, carpeta: `trabajos/${ID}/img/placa_blanco`, diseno: "blanco", frames: GLOBOS_FRAMES, salidaDesde: SALIDA_CHAT },
  // Música: "alex-morgan-soul-jazz-coffee-shop" (Clientes/DOCBA/Música). Arranca desde el principio del archivo justo en "nosotros te lo
  // resolvemos" (el beat), queda bajo las voces y sube en los tramos sin voz y en la placa.
  musica: {
    src: `trabajos/${ID}/audio/musica_full.wav`,
    desdeS: 0,
    inicioS: MUSICA_INICIO,
    puntos: [
      [MUSICA_INICIO, 0],
      [r(MUSICA_INICIO + 0.12), 0.26], // el beat pega fuerte en "nosotros"
      [r(ta(9.0)), 0.2],
      [r(c - 0.2), 0.14],
      [r(c + 0.1), 0.07], // baja a fondo bajo las voces
      [r(inicioPlaca - 0.3), 0.07],
      [r(inicioPlaca + 0.5), 0.45],
      [r(inicioPlaca + 3.0), 0.45],
      [r(inicioPlaca + 3.8), 0],
    ],
  },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "docba-r3-nov",
    component: ReelDocba,
    durationInFrames: duracionReelDocba(reel),
    defaultProps: reel,
    salida: "r3-nov_9x16",
  },
  {
    id: "docba-r3-nov-cortes", // preview de cortes y planos, sin subtítulos
    component: ReelDocba,
    durationInFrames: duracionReelDocba(reel),
    defaultProps: { ...reel, mostrarSubtitulos: false },
    salida: "r3-nov-cortes_9x16",
  },
];
