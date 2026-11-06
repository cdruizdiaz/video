// Trabajo 2026-10-28_docba_r2-nov — R2 NOV de DOCBA (cierres de año de equipos, 9:16): la host a cámara, íconos animados sobre el recorrido
// ("nacieron / obstáculos / fin"), brindis en cámara lenta, recorrido por los espacios con cutaways de inserts mientras ella habla,
// "como en casa, pero sin lavar un plato" y el cartel de la entrada (sin zoom). Tras "indicado" arranca la música sola con inserts y, 1 s después, la voz en off
// "Hay proyectos…", siempre con inserts arriba hasta "celebración". Tiempos "src" = segundos del proxy; los de voz están alineados con
// scripts/alinear.py (alineación forzada, 20 ms por palabra) y cada subtítulo entra en su primera palabra (−0,03 s).
import type { ComposicionTrabajo } from "../tipos";
import {
  duracionReelDocba,
  ReelDocba,
  type ClipDocba,
  type PistaDocba,
  type ReelDocbaProps,
  type SubtituloDocba,
} from "../../plantillas/ReelDocba/ReelDocba";
import type { IconoProyecto } from "../../plantillas/ReelDocba/IconosProyecto";
import centroUltimo from "./centro_ultimo.json";

const ID = "2026-10-28_docba_r2-nov";
const crudo = (n: string) => `trabajos/${ID}/crudos/${n}.mp4`;
const audio = (n: string) => `trabajos/${ID}/audio/${n}.wav`;
const r = (x: number) => Math.round(x * 1000) / 1000;
const AL = 0.03;

const clips: ClipDocba[] = [];
const pistas: PistaDocba[] = [];
const subtitulos: SubtituloDocba[] = [];
const iconos: IconoProyecto[] = [];
let t = 0;
const seg = (src: string, desdeS: number, durS: number, extra: Partial<ClipDocba> = {}) => {
  clips.push({ src, desdeS, durS, inicioS: r(t), ...extra });
  const inicio = t;
  t = r(t + durS);
  return inicio;
};
const sub = (texto: string, desde: number, hasta: number) => subtitulos.push({ texto, inicioS: r(desde - AL), finS: r(hasta) });
const pista = (n: string, desdeS: number, durS: number, inicioS: number, extra: Partial<PistaDocba> = {}) =>
  pistas.push({ src: audio(n), desdeS, durS, inicioS: r(inicioS), entraS: 0.02, saleS: 0.03, ...extra });

// 1) 0–3 s: primer plano de la host a cámara: "¿Necesitás un espacio para cerrar el año con tu equipo?" y "DOCBA es el lugar indicado."
const A_DESDE = 0.85;
const A_FIN = 3.32; // termina "equipo" (3,26 s)
const a = seg(crudo("IMG_9353"), A_DESDE, r(A_FIN - A_DESDE));
const ta = (s: number) => a + s - A_DESDE;
pista("hab_IMG_9353", A_DESDE, r(A_FIN - A_DESDE), a, { entraS: 0.01, saleS: 0.02 });
sub("¿Necesitás", ta(1.02), ta(1.56));
sub("un espacio", ta(1.56), ta(2.06));
sub("para cerrar", ta(2.06), ta(2.56));
sub("el año", ta(2.56), ta(2.84));
sub("con tu equipo?", ta(2.84), ta(A_FIN));
const B_DESDE = 1.14;
const B_FIN = 2.62; // termina "indicado" (2,54 s)
const b = seg(crudo("IMG_9358"), B_DESDE, r(B_FIN - B_DESDE));
const tb = (s: number) => b + s - B_DESDE;
pista("hab_IMG_9358", B_DESDE, r(B_FIN - B_DESDE), b, { entraS: 0.01, saleS: 0.03 });
sub("DOCBA", tb(1.26), tb(1.7));
sub("es el lugar indicado.", tb(1.7), tb(B_FIN));
const inicioMusica = t; // tras "indicado" arranca la música sola, con inserts
seg(crudo("ins_inicio"), 0.1, 1.15, { empuje: true }); // C0021 desde el 0:03, antes de la secuencia

// 2) Inserts con la música sola (1 s) y, 1 s después de "indicado", la voz en off "Hay proyectos que nacieron, otros que tuvieron
//    obstáculos y otros que llegaron a su fin." Todo con inserts arriba (pizarrón, frente a la compu, el equipo festejando) y los íconos.
const V1_DESDE = 0.7; // la voz arranca en 0,76 s
const V1_FIN = 5.06;
const v1 = r(t - (0.76 - V1_DESDE)); // la voz arranca apenas termina el primer insert (la música sola dura solo ese insert)
const sv1 = (s: number) => v1 + s - V1_DESDE;
pista("voz_1_n19", V1_DESDE, r(V1_FIN - V1_DESDE), v1, { entraS: 0.01, saleS: 0.03 });
// cortes parejos (~1,4 s cada insert): terminan donde acaba "nacieron," y "obstáculos"
const CORTE_PIZARRON = 2.1;
const CORTE_COMPU = 3.5;
seg(crudo("ins_loft_a"), 0.1, r(sv1(CORTE_PIZARRON) - t), { empuje: true });
seg(crudo("ins_pizarron"), 0.1, r(CORTE_COMPU - CORTE_PIZARRON), { empuje: true });
seg(crudo("ins_teclado"), 0.1, r(V1_FIN - CORTE_COMPU), { empuje: true });
sub("Hay proyectos", sv1(0.76), sv1(1.32));
sub("que nacieron,", sv1(1.32), sv1(2.16));
sub("otros que", sv1(2.16), sv1(2.5));
sub("tuvieron", sv1(2.5), sv1(2.84));
sub("obstáculos", sv1(2.84), sv1(3.6));
sub("y otros", sv1(3.6), sv1(4.14));
sub("que llegaron", sv1(4.14), sv1(4.62));
sub("a su fin.", sv1(4.62), sv1(V1_FIN));

// 3) "Todos merecen una celebración." sobre el brindis en cámara lenta (IMG_9450 de 1. R4 NOV, 120 fps → 4× más lento)
const V2_DESDE = 0.7; // la voz arranca en 0,78 s
const V2_FIN = 2.5;
const v2 = seg(crudo("ins_brindis_lento"), 0.1, r(V2_FIN - V2_DESDE), { empuje: true });
const sv2 = (s: number) => v2 + s - V2_DESDE;
pista("voz_2_n19", V2_DESDE, r(V2_FIN - V2_DESDE), v2, { entraS: 0.01, saleS: 0.04 });
sub("Todos", sv2(0.78), sv2(1.34));
sub("merecen", sv2(1.34), sv2(1.72));
sub("una celebración.", sv2(1.72), sv2(V2_FIN));

// 4) Recorrido: "En DOCBA tenemos espacios amplios, variedad gastronómica y un servicio con todas las comodidades." Ella baja la escalera
//    hablando (IMG_9364) y, mientras sigue su voz, tres inserts largos (espacios, comida, servicio) hasta que termina "comodidades".
const C_DESDE = 0.92; // "En" arranca en 0,98 s
const C_FIN = 5.4; // termina "comodidades" (5,34 s)
const c0 = t;
const tc = (s: number) => c0 + s - C_DESDE;
const tramos: { src: string; ini: number; fin: number; desde: number; extra?: Partial<ClipDocba> }[] = [
  { src: "IMG_9364", ini: C_DESDE, fin: 1.74, desde: C_DESDE },
  { src: "ins_loft", ini: 1.74, fin: 2.9, desde: 0, extra: { empuje: true } }, // espacio amplio (C0119 desde el 0:02, horizontal escalado)
  { src: "ins_comida", ini: 2.9, fin: 4.2, desde: 0.1, extra: { empuje: true } }, // variedad gastronómica
  { src: "ins_barista", ini: 4.2, fin: C_FIN, desde: 0.1, extra: { empuje: true } }, // un servicio con todas las comodidades
];
tramos.forEach((x) => seg(crudo(x.src), x.desde, r(x.fin - x.ini), x.extra));
pista("hab_IMG_9364", C_DESDE, r(C_FIN - C_DESDE), c0, { entraS: 0.01, saleS: 0.03 });
sub("En DOCBA tenemos", tc(0.98), tc(1.78));
sub("un espacio amplio,", tc(1.78), tc(2.54));
sub("variedad", tc(2.54), tc(2.84));
sub("gastronómica", tc(2.84), tc(3.5));
sub("y un servicio", tc(3.5), tc(4.16));
sub("con todas las", tc(4.16), tc(4.72));
sub("comodidades.", tc(4.72), tc(C_FIN));

// 5) "Como en casa, pero sin lavar un plato." sobre dos inserts (mesa servida y tostón con jamón); la voz sigue siendo la de IMG_9368
const D_DESDE = 1.1;
const D_FIN = 3.0;
const d = t;
const td = (s: number) => d + s - D_DESDE;
seg(crudo("ins_casa"), 0.1, r(1.92 - D_DESDE), { empuje: true }); // "Como en casa,"
seg(crudo("ins_plato"), 0.1, r(D_FIN - 1.92)); // "pero sin lavar un plato."
pista("hab_IMG_9368", D_DESDE, r(D_FIN - D_DESDE), d, { entraS: 0.01, saleS: 0.03 });
sub("Como en casa,", td(1.28), td(1.92));
sub("pero sin", td(1.92), td(2.32));
sub("lavar un plato.", td(2.32), td(D_FIN));

// 6) Entrada de DOCBA: "Reservá tu fin de año en DOCBA, o simplemente pasen a brindar." Plano de la entrada SIN zoom (la usuaria lo sacó)
const E_DESDE = 1.5;
const E_FIN = 4.55;
const e = seg(crudo("IMG_9394"), E_DESDE, r(E_FIN - E_DESDE + 0.6)); // 0,6 s extra: queda bajo el barrido de la placa
const te = (s: number) => e + s - E_DESDE;
pista("hab_IMG_9394", E_DESDE, r(E_FIN - E_DESDE), e, { entraS: 0.01, saleS: 0.03 });
sub("Reservá tu", te(1.68), te(2.16));
sub("fin de año", te(2.16), te(2.48));
sub("en DOCBA,", te(2.48), te(2.94));
sub("o simplemente", te(2.94), te(3.68));
sub("pasen a brindar.", te(3.68), te(E_FIN));
const inicioPlaca = r(te(E_FIN));

// Música: "momotmusic-coffee-time" (Clientes/DOCBA/Música; 103 bpm, primer pulso fuerte en 3,55 s del archivo). Arranca sola tras "indicado"
// y el pulso cae en el corte al pizarrón ("que nacieron"); baja a fondo bajo las voces y sube en la placa.
const T_PIZARRON = r(sv1(CORTE_PIZARRON));
const musica = {
  src: `trabajos/${ID}/audio/musica_full.wav`,
  desdeS: r(8.2 - T_PIZARRON), // 3.er compás del archivo (8,2 s) justo en el corte al segundo insert
  inicioS: 0, // suena desde el primer cuadro
  puntos: [
    [0, 0],
    [0.5, 0.1], // de fondo bajo la voz de la host
    [r(inicioMusica - 0.1), 0.1],
    [r(inicioMusica + 0.3), 0.3], // sube con el primer insert (la música sola)
    [r(v1 - 0.05), 0.3],
    [r(v1 + 0.5), 0.08], // baja a fondo bajo las voces
    [r(inicioPlaca - 0.3), 0.08],
    [r(inicioPlaca + 0.5), 0.45],
    [r(inicioPlaca + 3.0), 0.45],
    [r(inicioPlaca + 3.8), 0],
  ] as [number, number][],
};

const reel: ReelDocbaProps = {
  clips,
  pistas,
  subtitulos,
  mostrarSubtitulos: true,
  iconos,
  musica,
  placa: { inicioS: inicioPlaca, durS: 3.8, leyenda: "RESERVÁ TU FIN DE AÑO EN DOCBA", direccion: "BUENOS AIRES 864 · NUEVA CÓRDOBA" },
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "docba-r2-nov", component: ReelDocba, durationInFrames: duracionReelDocba(reel), defaultProps: reel, salida: "r2-nov_9x16" },
  { id: "docba-r2-nov-cortes", component: ReelDocba, durationInFrames: duracionReelDocba(reel), defaultProps: { ...reel, mostrarSubtitulos: false }, salida: "r2-nov-cortes_9x16" },
];

// ---------- R2 editado por la usuaria (r2.mp4 de Reels finales): se le suman subtítulos, estabilización leve de algunos inserts y la placa ----------
// Base: `crudos/r2_editado.mp4` (el video de la usuaria, SIN estabilizar: la estabilización dejó gelatinosos los inserts; ver TRABAJO.md). El audio (voz + música ya mezcladas por ella) es `audio/r2_editado.wav`.
// Tiempos de voz con scripts/alinear.py sobre ese audio (datos/alin_r2.json).
const ZOOM_2 = 0.16; // acercamiento de plano del 2.º video (escala extra al final del plano)
const ZOOM_ULTIMO = centroUltimo.zoom; // acercamiento gradual del último video ("Reservá…"): 10 %, el máximo con el que el rectángulo naranja del edificio (87 % del ancho) sigue entero en el cuadro; centrar_ultimo.py lo mantiene centrado
const ORIGEN_2 = "50% 30%"; // hacia la cara de ella
const ORIGEN_ULTIMO = "50% 50%"; // bien centrado: la línea naranja superior del edificio se va hacia arriba al acercarse
const FIN_VOZ_ED = 21.37; // termina "brindar" (21,26 s): la placa entra apenas después
const subsEd: SubtituloDocba[] = [];
const se = (texto: string, desde: number, hasta: number) => subsEd.push({ texto, inicioS: r(desde - AL), finS: r(hasta) });
// (sin subtítulos en el primer plano, 0–2,6 s: pedido de la usuaria, 2026-10-30)
se("DOCBA", 2.7, 3.14); se("es el lugar indicado.", 3.14, 3.98);
se("Hay proyectos", 4.92, 5.48); se("que nacieron,", 5.48, 6.32); se("otros que", 6.32, 6.66); se("tuvieron", 6.66, 7.0); se("obstáculos", 7.0, 7.58);
se("y otros que", 7.78, 8.4); se("llegaron", 8.44, 8.78); se("a su fin.", 8.78, 9.14);
se("Todos", 9.68, 10.24); se("merecen", 10.24, 10.62); se("una celebración.", 10.62, 11.32);
se("En DOCBA", 11.58, 11.98); se("tenemos", 11.98, 12.28); se("un espacio amplio,", 12.28, 13.04); se("variedad", 13.1, 13.42); se("gastronómica", 13.42, 13.98);
se("y un servicio", 14.1, 14.78); se("con todas las", 14.78, 15.3); se("comodidades.", 15.3, 15.88);
se("Como en casa,", 16.92, 17.52); se("pero sin", 17.52, 17.9); se("lavar un plato.", 17.9, 18.42);
se("Reservá tu", 18.64, 19.12); se("fin de año", 19.12, 19.44); se("en DOCBA,", 19.44, 19.9); se("o simplemente", 19.9, 20.64); se("pasen a brindar.", 20.64, 21.26);

const reelEd: ReelDocbaProps = {
  // El video de la usuaria queda negro desde el 21,8 s: el último cuadro (ella quieta) se estira con un empuje lento para que la placa vaya sobre ella
  // Cortes del video de la usuaria (scripts/detectar_glitches.py): 2,60 / 4,33 / … / 18,57 s. El 2.º plano ("DOCBA es el lugar indicado.", 2,6–4,33) y el
  // último ("Reservá tu fin de año…", 18,57–21,8) llevan un acercamiento de plano gradual durante toda su duración (ZOOM_2, ZOOM_ULTIMO); se parte el clip en los cortes.
  clips: [
    { src: crudo("r2_editado"), desdeS: 0, durS: 2.6, inicioS: 0 },
    { src: crudo("r2_editado"), desdeS: 2.6, durS: r(4.3333 - 2.6), inicioS: 2.6, empuje: true, push: ZOOM_2, origen: ORIGEN_2 },
    { src: crudo("r2_editado"), desdeS: 4.3333, durS: r(18.5667 - 4.3333), inicioS: 4.3333 },
    { src: crudo("r2_editado"), desdeS: 18.5667, durS: r(21.8 - 18.5667), inicioS: 18.5667, empuje: true, push: ZOOM_ULTIMO, origen: ORIGEN_ULTIMO, desplazaX: centroUltimo.dx },
    // la cola sigue el zoom desde donde quedó el último plano (1 + ZOOM_ULTIMO) para que no haya salto
    { src: crudo("r2_cola"), desdeS: 0, durS: r(25 - 21.8), inicioS: 21.8, zoom: 1 + ZOOM_ULTIMO, origen: ORIGEN_ULTIMO, desplazaX: [centroUltimo.dx[centroUltimo.dx.length - 1]] },
  ],
  // r2_editado_dn.wav = el audio de la usuaria con la voz en off de 4,3 a 11,8 s sin ruido de fondo (DeepFilterNet 12 dB, 85 % procesado + 15 % original)
  pistas: [{ src: audio("r2_editado_dn"), desdeS: 0, durS: 25, inicioS: 0, saleS: 0.5 }],
  subtitulos: subsEd,
  mostrarSubtitulos: true,
  flashes: [4.3333, 18.5667], // flash (el del CEI) en el corte del 2.º al 3.er video y en el corte al último video (el destello de banda cálida se probó y se descartó)
  // La música de la usuaria es `musica_full.wav` desplazada 1,167 s (correlación 0,987 sobre el final del audio): se suma la misma pista en fase
  // para que suba cuando sube la placa (en su mezcla queda a −36 LUFS) y baje en los últimos cuadros.
  musica: {
    src: `trabajos/${ID}/audio/musica_full.wav`,
    desdeS: 1.167,
    inicioS: 0,
    puntos: [[0, 0], [21.2, 0], [r(FIN_VOZ_ED + 0.5), 0.33], [24.1, 0.33], [25, 0]],
  },
  placa: { inicioS: FIN_VOZ_ED, durS: r(25 - FIN_VOZ_ED), leyenda: "RESERVÁ TU FIN DE AÑO EN DOCBA", direccion: "BUENOS AIRES 864 · NUEVA CÓRDOBA" },
};
composiciones.push({ id: "docba-r2-nov-editado", component: ReelDocba, durationInFrames: duracionReelDocba(reelEd), defaultProps: reelEd, salida: "r2-nov-editado_9x16" });

// ---------- R2 editado v6 (2026-11-04) ----------
// 1) Primer plano con los textos del "R2 NOV DOCBA V1.mp4" de la usuaria: Gabriella Heavy naranja, grande y fijo sobre ella
//    (frases de 1 o 2 renglones, en seco, en la palabra). 2) "Como en casa, pero sin lavar un plato." pasa a voz en off pegada a
//    "comodidades" (sin el silencio de 0,83 s: audio_vo_casa.py separa voz y música y vuelve a sumar la música continua) y en vez de
//    la chica van dos inserts del loft: C0165 (pareja charlando junto a la ventana, "Como en casa,") y C0164 (barra con la barista,
//    "pero sin lavar un plato."), color original y sin sonido. 3) Los 3 efectos de sonido del V1 de ella (antes de cada flash y en la placa).
const DELTA6 = 25 / 30; // silencio que se saca entre "comodidades" y "Como"
const C1_6 = 16.03; // corte de audio (la voz termina en 15,98)
const CORTE_INS = 15.9; // corte de video del insert de "comodidades" en el video de ella
const ULTIMO6 = r(18.5667 - DELTA6); // 17,733 s: arranca "Reservá…"
const COLA6 = r(21.8 - DELTA6);
const FIN6 = r(25 - DELTA6);
const PLACA6 = r(FIN_VOZ_ED - DELTA6);
const sh = (s: number) => (s >= C1_6 ? r(s - DELTA6) : s);
const ROT_TAM = 107; // px (medido contra el V1 de ella: "¿Necesitás" ocupa ~910 px de ancho)
const ROT_CENTRO = 590; // px: centro vertical del bloque, entre el techo y la cabeza
const ROT_INTERLINEADO = 0.76;
const rot = (texto: string, desde: number, hasta: number) => ({ texto, inicioS: r(desde - AL), finS: r(hasta - AL), centroY: ROT_CENTRO, tam: ROT_TAM, interlineado: ROT_INTERLINEADO });
const sfx = (n: string, inicioS: number, durS: number) => ({ src: audio(n), desdeS: 0, durS, inicioS: r(inicioS), entraS: 0, saleS: 0 });
// v7: los dos inserts del loft con más luz (gamma 1,45 / 1,6 desde el 4K + reducción de ruido leve hqdn3d 1,5; luz media 80 → 119 y 67 → 120, como los vecinos)
// v8: además estabilizados (vidstab, zoom fijo 4 %) y con contraste y color para que no queden grises: inserts_casa.sh
const reelEd6: ReelDocbaProps = {
  ...reelEd,
  clips: [
    ...reelEd.clips.slice(0, 2),
    { src: crudo("r2_editado"), desdeS: 4.3333, durS: r(CORTE_INS - 4.3333), inicioS: 4.3333 },
    { src: crudo("ins_c0165_est"), desdeS: 0.1, durS: r(16.6667 - CORTE_INS), inicioS: CORTE_INS },
    { src: crudo("ins_c0164_est"), desdeS: 0.2, durS: r(ULTIMO6 - 16.6667), inicioS: 16.6667 },
    { ...reelEd.clips[3], inicioS: ULTIMO6 },
    { ...reelEd.clips[4], durS: r(FIN6 - COLA6), inicioS: COLA6 },
  ],
  pistas: [
    { src: audio("r2_editado_v6"), desdeS: 0, durS: FIN6, inicioS: 0, saleS: 0.5 },
    sfx("sfx_flash1", 4.15, 0.27),
    sfx("sfx_flash2", 18.35 - DELTA6, 0.29),
    sfx("sfx_placa", 21.3 - DELTA6, 1.7),
  ],
  subtitulos: subsEd.filter((s) => s.inicioS < CORTE_INS || s.inicioS >= C1_6 - AL).map((s) => (s.inicioS >= C1_6 - AL - 0.1 && s.finS > 16 ? { ...s, inicioS: r(s.inicioS - DELTA6), finS: r(s.finS - DELTA6) } : s)),
  rotulos: [
    rot("¿Necesitás", 0.16, 0.68),
    rot("un espacio", 0.68, 1.18),
    rot("para\ncerrar", 1.18, 1.7),
    { ...rot("el año", 1.7, 1.96), ene: 7 }, // la virgulilla de la ñ más gruesa (pedido de la usuaria, 2026-11-04)
    rot("con tu\nequipo?", 1.96, 2.63),
  ],
  flashes: [4.3333, ULTIMO6],
  musica: { ...reelEd.musica!, puntos: reelEd.musica!.puntos.map(([s, v]) => [s === 0 ? 0 : sh(s), v] as [number, number]) },
  placa: { ...reelEd.placa, inicioS: PLACA6, durS: r(FIN6 - PLACA6) },
};
composiciones.push({ id: "docba-r2-nov-editado6", component: ReelDocba, durationInFrames: duracionReelDocba(reelEd6), defaultProps: reelEd6, salida: "r2-nov-editado_9x16" });
