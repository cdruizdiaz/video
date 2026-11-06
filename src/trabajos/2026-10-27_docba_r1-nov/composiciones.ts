// Trabajo 2026-10-27_docba_r1-nov — R1 NOV de DOCBA (~26 s, 9:16): host a cámara + carta digital animada + voz en off sobre
// inserts de la carta, subtítulos blancos (IBM Plex Sans Condensed Medium, en seco) y placa final con el logotipo animado.
// Los tiempos de cada palabra están medidos sobre la energía de la voz (pausas y arranques), no con el DTW de Whisper solo:
// el DTW estira las palabras sobre las pausas (ver CRITERIOS.md de la marca). Tiempos "src" = segundos del proxy.
import type { ComposicionTrabajo } from "../tipos";
import {
  duracionReelDocba,
  ReelDocba,
  type ClipDocba,
  type PistaDocba,
  type ReelDocbaProps,
  type SubtituloDocba,
} from "../../plantillas/ReelDocba/ReelDocba";

const ID = "2026-10-27_docba_r1-nov";
const crudo = (n: string) => `trabajos/${ID}/crudos/${n}.mp4`;
const audio = (n: string) => `trabajos/${ID}/audio/${n}.wav`;
const r = (x: number) => Math.round(x * 1000) / 1000;
const ADELANTO = 0; // el subtítulo entra en el cuadro donde arranca la voz (tiempos medidos con arranques.py sobre el audio)

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
const sub = (texto: string, desde: number, hasta: number) =>
  subtitulos.push({ texto, inicioS: r(desde - ADELANTO), finS: r(hasta) });
const pista = (n: string, desdeS: number, durS: number, inicioS: number, extra: Partial<PistaDocba> = {}) =>
  pistas.push({ src: audio(n), desdeS, durS, inicioS: r(inicioS), entraS: 0.03, saleS: 0.03, ...extra });

// 1) Arranque: IMG_9324 sin el "va" del inicio (la voz arranca en 3,19): ella camina apurada desde antes, con ruido de ciudad
//    caótica de fondo (ciudad.py) que se va mientras entra la música.
const A_DESDE = 1.4; // 0,35 s menos que antes: el plano de "En DOCBA…" tiene que arrancar en el segundo 8,0
const A_DUR = 4.35;
const a = seg(crudo("IMG_9324"), A_DESDE, A_DUR);
pista("hab_IMG_9324", A_DESDE, A_DUR, a, { saleS: 0.15 });
pista("ciudad", 0, 5.9, a, { entraS: 0.2, saleS: 1.4, vol: 0.9 });
// En este primer plano no van subtítulos ni textos (versión final v2, 2026-10-30). Se probó texto grande en Gabriella Heavy sobre la
// cabeza de ella (cabeza.py → cabeza_9324.json, prop `rotulos` de ReelDocba) y la usuaria lo sacó.

// 2) IMG_9332 desde que abre más la puerta, casi entrando. Música de a poco; el beat arranca cuando termina "las horas".
// Se deja correr hasta 7,05 s del reel (ella sale del cuadro): hace de transición al plano siguiente. (IMG_9330, de costado, se probó en
// el borrador J y se descartó.)
const B_DESDE = 2.75;
const B_DUR = 2.7;
const b = seg(crudo("IMG_9332_luz"), B_DESDE, B_DUR); // curva global (sin máscara): la máscara hacía titilar las mangas oscuras
const tb = (src: number) => b + src - B_DESDE;
pista("hab_IMG_9332", B_DESDE, B_DUR, b, { entraS: 0.02, saleS: 0.15 });
sub("y dejar", tb(2.83), tb(3.52)); // la "y" arranca antes de que la energía pase el umbral (2,83 medido en el render)
sub("que pasen", tb(3.98), tb(4.37)); // hay un silencio de 0,5 s después de "dejar"
sub("las horas.", tb(4.37), tb(4.68));
const beat = tb(4.57); // acá entra el beat más movido
const BEAT_FUERTE = 0.3; // volumen normal de música
const FONDO_MUSICA = 0.06; // música de fondo bajo la voz

// 3) IMG_9347: "En DOCBA tenés espacio de sobra para estar cómodo" (se saca la pausa de 0,7 s) y corte a un plano más
//    cercano que arranca directo en "y una carta…"; en "que no se parece a ninguna" corre la carta digital.
const C_DESDE = 0.95;
const C1_FIN = 3.12;
const C2_DESDE = 3.77;
const C2_FIN = 5.6;
const inicioC1 = t;
const c1 = seg(crudo("IMG_9347"), C_DESDE, C1_FIN - C_DESDE);
const c2 = seg(crudo("IMG_9347"), C2_DESDE, C2_FIN - C2_DESDE, { zoom: 1.18, origen: "50% 36%" });
const tc1 = (src: number) => c1 + src - C_DESDE;
const tc2 = (src: number) => c2 + src - C2_DESDE;
pista("hab_IMG_9347", C_DESDE, C1_FIN - C_DESDE, c1, { entraS: 0.02, saleS: 0.02 });
pista("hab_IMG_9347", C2_DESDE, C2_FIN - C2_DESDE, c2, { entraS: 0.01, saleS: 0.04 });
sub("En DOCBA tenés", tc1(1.05), tc1(1.8));
sub("espacio de sobra", tc1(1.8), tc1(2.52));
sub("para estar cómodo", tc1(2.58), tc1(3.1));
sub("y una carta", tc2(3.83), tc2(4.4));
sub("que no se parece", tc2(4.4), tc2(5.09));
sub("a ninguna.", tc2(5.09), tc2(5.6));
const menu = { inicioS: r(tc2(4.37)), durS: r(c2 + (C2_FIN - C2_DESDE) - tc2(4.37)) };

// 4) Voz en off (limpia, sin ruido de fondo): arranca al toque de "ninguna". Un insert por palabra, estabilizados y con color
//    (preparar_inserts.py); "y cuando se acerca la noche, aparece la copa de vino" va en dos planos de copas con look de noche.
const VO_DESDE = 0.62; // la voz de voz_1 arranca en 0,66
const v = seg(crudo("ins_matcha_mezcla"), 0.2, 0.85, { empuje: true }); // C0048: la mano revuelve el matcha
seg(crudo("ins_matcha2"), 0.3, 0.92, { empuje: true }); // C0049 en cámara lenta (cae el matcha)
seg(crudo("ins_croissant"), 0.3, 0.92, { empuje: true, zoom: 1.08, origen: "50% 0%" }); // origen arriba: baja el plato y recorta el aire de abajo
seg(crudo("ins_guacamole"), 0.3, 0.65, { alejar: true, zoom: 1.22, origen: "50% 0%" }); // el croissant venía alto, con mucho aire abajo
seg(crudo("ins_toston"), 0.3, 1.67, { empuje: true });
seg(crudo("ins_vino_a"), 0.3, 1.26, { empuje: true }); // brindis con copas en mano (C0114), look de noche
seg(crudo("ins_vino_b"), 0.3, 1.26, { empuje: true }); // cuatro copas con la tabla (C0131), look de noche
const VO_DUR = 7.5;
pista("voz_1_n19", VO_DESDE, VO_DUR, v, { entraS: 0, saleS: 0.04 });
sub("Encontrás", v + 0.03, v + 0.4);
sub("productos como", v + 0.4, v + 1.13);
sub("matcha latte,", v + 1.13, v + 1.77);
sub("croissant", v + 1.77, v + 2.21);
sub("de poché", v + 2.21, v + 2.68);
sub("y guacamole,", v + 2.68, v + 3.23);
sub("tostón proteico", v + 3.34, v + 4.07);
sub("de masa madre,", v + 4.07, v + 4.84);
sub("y cuando se acerca", v + 5.01, v + 5.93);
sub("la noche,", v + 5.93, v + 6.17);
sub("aparece la", v + 6.22, v + 6.72);
sub("copa de vino.", v + 6.8, v + 7.5);

// 5) Remate: IMG_9395 (segunda toma) corta apenas termina "corridas"; IMG_9398 arranca directo en "te esperamos" (sin la "y")
//    y la placa entra apenas termina "DOCBA".
const ZOOM_TECHO = { zoom: 1.065, origen: "50% 100%" };
const D1_DESDE = 6.3;
const D1_FIN = 9.14;
const d1 = seg(crudo("IMG_9395_col"), D1_DESDE, D1_FIN - D1_DESDE, ZOOM_TECHO); // plano un poco más cerrado: sin el techo sucio, con el cartel
const td1 = (src: number) => d1 + src - D1_DESDE;
pista("hab_IMG_9395", D1_DESDE, D1_FIN - D1_DESDE, d1, { entraS: 0.02, saleS: 0.02 });
sub("Podés elegir", td1(6.42), td1(7.01));
sub("lo que más te guste,", td1(7.01), td1(7.65));
sub("y no hace falta", td1(7.65), td1(8.36));
sub("que estés", td1(8.36), td1(8.77));
sub("a las corridas.", td1(8.77), td1(9.14));
const D2_DESDE = 1.005; // en el hueco entre la "y" y "te"
const D2_VOZ_FIN = 2.17;
const d2 = seg(crudo("IMG_9398_col"), D2_DESDE, D2_VOZ_FIN - D2_DESDE + 0.55, ZOOM_TECHO); // 0,55 s extra: queda bajo el barrido de la placa
const td2 = (src: number) => d2 + src - D2_DESDE;
pista("hab_IMG_9398", D2_DESDE, D2_VOZ_FIN - D2_DESDE, d2, { entraS: 0.005 });
sub("Te esperamos", td2(1.005), td2(1.6));
sub("en DOCBA.", td2(1.68), td2(2.17));
const inicioPlaca = r(td2(D2_VOZ_FIN));

const reel: ReelDocbaProps = {
  clips,
  pistas,
  subtitulos,
  mostrarSubtitulos: true,
  flashes: [inicioC1, d1], // transición de luz (la del CEI) en el corte a "En DOCBA…" (7,05 s) y en el corte de las copas a la host (18,57 s, antes de que vuelva a hablar)
  placa: { inicioS: inicioPlaca, durS: 3.8 },
  menu,
  // Música: "hip-hop relax boombap" (paulyudin, de Clientes/DOCBA/Música). Su intro suave entra de a poco en el segundo plano
  // y el groove (1,5 s del archivo) cae justo cuando termina "las horas"; queda bajo la voz y sube en la placa.
  musica: {
    src: `trabajos/${ID}/audio/musica.wav`,
    desdeS: 0,
    inicioS: r(beat - 1.5),
    puntos: [
      [r(beat - 1.5), 0],
      [r(beat - 0.3), 0.035],
      [r(beat - 0.04), 0.07],
      [r(beat + 0.04), BEAT_FUERTE], // el beat pega fuerte apenas termina "las horas"
      [r(inicioC1 + 0.05), BEAT_FUERTE], // sigue fuerte hasta que arranca la voz del plano siguiente
      [r(inicioC1 + 0.45), FONDO_MUSICA], // y recién ahí baja a un fondo
      [r(inicioPlaca - 0.2), FONDO_MUSICA],
      [r(inicioPlaca + 0.6), 0.5],
      [r(inicioPlaca + 3.0), 0.5],
      [r(inicioPlaca + 3.8), 0],
    ],
  },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "docba-r1-nov",
    component: ReelDocba,
    durationInFrames: duracionReelDocba(reel),
    defaultProps: reel,
    salida: "r1-nov_9x16",
  },
  {
    id: "docba-r1-nov-cortes", // preview de cortes y planos, sin subtítulos
    component: ReelDocba,
    durationInFrames: duracionReelDocba(reel),
    defaultProps: { ...reel, mostrarSubtitulos: false },
    salida: "r1-nov-cortes_9x16",
  },
];
