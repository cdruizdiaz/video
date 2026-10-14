// Trabajo 2026-10-06_volto_fashion-week — reels de Volto en la Argentina Fashion Week (plantilla HablaSubtitulada).
// Audio siempre de la cám. B (iPhone 17 con micrófono, IMG_69xx); la imagen alterna con la cám. A
// (iPhone 16, plano cerrado vertical, IMG_42xx) sincronizada con sincronizar.py. Los planos horizontales de B
// se recortan a 9:16 siguiendo la cara (encuadre.py). Tiempos de las tomas = segundos del clip de B (ms).
import {
  duracionHablaSubtitulada,
  HablaSubtitulada,
  type HablaSubtituladaProps,
} from "../../plantillas/HablaSubtitulada/HablaSubtitulada";
import encuadre from "../../../public/trabajos/2026-10-06_volto_fashion-week/datos/encuadre.json";
import sincronia from "../../../public/trabajos/2026-10-06_volto_fashion-week/datos/sincronia.json";
import transcripcion from "../../../public/trabajos/2026-10-06_volto_fashion-week/datos/transcripcion.json";
import seguimiento5 from "../../../public/trabajos/2026-10-06_volto_fashion-week/datos/seguimiento_IMG_6977n.json";
import type { ComposicionTrabajo } from "../tipos";
import { RELOJ_DIA_PASO } from "../../plantillas/comunes/Insertos";
import { EntrevistaRadio, type EntrevistaRadioProps } from "./EntrevistaRadio";

const ID = "2026-10-06_volto_fashion-week";
const CIERRE = 3 * 30; // frames
const APERTURA = {
  titulo: "ARGENTINA FASHION WEEK",
  subtitulo: "Santa Fe",
  duracion: Math.round(3.5 * 30),
};
const ZOOM_REMATE = 1.12;
// Voz: cada toma nivelada a -16 LUFS (gananciaDb medida con ebur128 sobre el tramo); el render final
// lleva además loudnorm a -14 LUFS. Música preparada a -14 LUFS (preparar_musica.sh) -> -17 dB bajo
// la voz queda ~15 dB por debajo; sube en el cierre.
const MUSICA_BAJO_VOZ_DB = -17;
const MUSICA_CIERRE_DB = -8;
const MUSICA_PLACA_DB = -7; // entrevista de radio: la música queda sola bajo la placa (voz a -19 LUFS)
const CLIC_VOLUMEN = 0.6;
const BARRA_VOLUMEN = 1;
// Insertos de la entrevista: volúmenes de sus sonidos, lugar en el cerrado de él y lo que se enumera [texto, ms]
const EFECTOS_DB = -5; // todos los efectos 5 dB más bajos: sutiles, que se noten sin molestar (pedido 2026-10-08)
const POP_VOLUMEN = 0.6;
const TICTAC_VOLUMEN = 0.5;
const DIAS_POP_VOLUMEN = 0.4;
const RELOJ_DIAS_MS = 59410; // "7 días": se encienden L M M J V S D
const ROBOT_VOLUMEN = 0.45;
const ERROR_VOLUMEN = 0.2; // más bajo: son cinco seguidos
const ACIERTO_VOLUMEN = 0.45;
const TIPEO_VOLUMEN = 0.6;
const PREGUNTAS: [string, number][] = [
  ["¿talle?", 97850],
  ["¿stock?", 98230],
  ["¿precio?", 98580],
  ["¿color?", 98970],
  ["¿cantidad?", 99270],
];
const TAREAS: [string, number][] = [
  ["campañas", 103730],
  ["lanzamientos", 104230],
  ["descuentos", 104830],
  ["promociones", 105540],
];
// Plano original de la entrevista, apenas recortado arriba (tenía mucho aire): zoom anclado abajo
const SUB_TAMANO = 74; // subtítulos: 84 quedaba grande
const GENERAL_ZOOM = 1.08;
const GENERAL_ORIGEN = "50% 92%";

// Plano de la cám. A (cerrado) desde el segundo `ms` del clip de B; con `rampaMs`, el zoom entra animado
const camA = (
  clipA: keyof typeof sincronia,
  ms: number,
  zoom?: number,
  rampaMs?: number,
) => ({
  desdeMs: ms,
  clip: clipA,
  desfaseMs: sincronia[clipA].desfaseMs,
  zoom,
  rampaMs,
});
// Plano de la cám. B (abierto, recortado a 9:16)
const camB = (ms: number) => ({ desdeMs: ms });

const base = {
  marca: "volto",
  carpetaVideos: `trabajos/${ID}/crudos`,
  transcripcion,
  encuadre,
  velocidad: 1,
  logoSuperior: false, // la remera ya lleva el logo; los reels de Volto no lo superponen
  apertura: APERTURA,
} satisfies Partial<HablaSubtituladaProps>;

// ---------- Pieza 1: "¿Tenés una marca de ropa?" (guion_marca-ropa.md) ----------
// IMG_6982 + IMG_4219. Rehecha el 2026-10-09 con CRITERIOS_REEL.md (como la entrevista de radio): arranca en
// "¿Querés tener tu marca acá?", subtítulos escritos a mano, voz con menos ruido, insertos con sonido y música
// suave solo bajo la placa. Más tiempo el plano de frente (B, mira a cámara: el más lindo para el cliente),
// con el color igualado a la cám. A (color_camB.py -> IMG_6982c.mp4).
// 2ª tanda (2026-10-09): B con más contraste y saturación; logo de la SFFW sin tarjeta, grande y detrás de él
// (recorte de la persona: crudos/IMG_6982c_persona.webm, scripts/mascaras.py 4,3–6,5 s); primer plano hasta
// el segundo 2, cambio en "Bueno"; empujes de zoom en "sí o sí" y "si tiene una pregunta", cortes con zoom en
// "las preguntas" y "más rápido"; se saca la pausa después de "rápido" (17,82–18,70) y entra A ya hablando.
// Cortes: 17,82–18,70 (pausa) y 46,28–48,55 ("Entonces sé de lo que te estoy hablando"), en valles de la voz limpia.
// Cám. B con el color retocado por el cliente (2026-10-09): ya viene vertical (1080×1920, encuadrada) y con la
// misma línea de tiempo que IMG_6982 (audio con desfase 0 medido en 6 ventanas; 2 s de más al final)
const ID_B1 = "IMG_6982r";
const RECORTE_B1 = { recorte: "IMG_6982r_persona.webm", recorteDesdeMs: 4300 }; // scripts/mascaras.py 4,3–6,8 s
const ZOOM_SI_O_SI = 1.3; // empuje en "sí o sí": rápido y anclado a su lado (1,5 era demasiado); la cara pasa de x≈0,30 a ≈0,39
const SI_O_SI_MS = 200;
const SI_O_SI_ORIGEN = "0% 28%";
// "Tenés que contestar / las preguntas / más rápido": cortes secos a planos cada vez más cerrados, quietos
// (sin el acercamiento lento, para que no parezca un zoom)
const PLANO_CONTESTAR = 1.1; // 1,18 / 1,36 / 1,55 dejaba la cabeza gigante
const PLANO_PREGUNTAS = 1.2;
const PLANO_RAPIDO = 1.3;
const ZOOM_PREGUNTA = 1.1; // empuje leve en "si tiene una pregunta"
const ZOOM_SIGNIFICA = 1.3; // empuje en "Eso significa que" (1,15 no se notaba), anclado hacia él
const SIGNIFICA_ORIGEN = "15% 30%";
const EMPUJE_MS = 450;
const camBc = (
  ms: number,
  zoom?: number,
  rampaMs?: number,
  fijo?: boolean,
) => ({
  desdeMs: ms,
  clip: ID_B1,
  desfaseMs: 0,
  zoom,
  rampaMs,
  fijo,
});
const SONIDO_1 = (ms: number, archivo: string, volumen: number) => ({
  clip: "IMG_6982",
  ms,
  src: `trabajos/${ID}/audio/${archivo}.wav`,
  volumen,
});
const VENTANAS_MS = [23950, 24300, 24360, 25020]; // "probablemente abre 3 o 4 páginas"
const marcaRopa: EntrevistaRadioProps = {
  ...base,
  apertura: undefined, // sin títulos arriba: el evento lo nombra el logo de la Santa Fe Fashion Week
  audios: { IMG_6982: `trabajos/${ID}/audio/voz_suave/IMG_6982.wav` },
  cruceAudio: 1,
  efectosDb: EFECTOS_DB,
  tomas: [
    {
      clip: "IMG_6982",
      desdeMs: 4400, // "¿Querés" empieza en 4,48: el cambio en "Bueno" cae justo en el segundo 2
      gananciaDb: 4.6, // voz_suave (15 dB menos de ruido) a -19 LUFS (ebur128 sobre el tramo)
      hastaMs: 17820, // fin de "rápido" (17,80); sigue una pausa hasta "Todos" (18,74)
      planos: [
        camBc(4400), // "¿Querés tener tu marca acá?": de frente, a cámara, hasta el segundo 2,30 (pedido)
        camA("IMG_4219", 6700), // "Bueno, hay algo que sí o sí tenés que tener,"
        {
          ...camA("IMG_4219", 8030, ZOOM_SI_O_SI, SI_O_SI_MS),
          origen: SI_O_SI_ORIGEN,
        }, // "sí o sí": empuje rápido
        camBc(9760), // ya en "porque todas las marcas que están acá…" ("porque" en 9,80), sigue con "Y eso es una tienda online…"
        camBc(15300, PLANO_CONTESTAR, undefined, true), // corte seco a un plano más cerrado en "Tenés" (15,30)
        camBc(15830, PLANO_PREGUNTAS, undefined, true), // otro, más cerrado, en "las" (15,84) de "las preguntas"
        camBc(16960, PLANO_RAPIDO, undefined, true), // y otro en "más" (16,96) de "más rápido"
      ],
    },
    {
      clip: "IMG_6982",
      desdeMs: 18700, // A ya hablando: "Todos" empieza en 18,74
      gananciaDb: 5.4,
      hastaMs: 46280, // fin de "seguidores"; "Entonces" empieza en 46,38
      planos: [
        camA("IMG_4219", 18700), // "Todos estos productos… son de ticket bajo."
        {
          ...camA("IMG_4219", 21600, ZOOM_SIGNIFICA, EMPUJE_MS),
          origen: SIGNIFICA_ORIGEN,
        }, // "Eso significa que…" ("Eso" en 21,64): empuje… "al mismo tiempo."
        camBc(26150), // "Y es muy probable que,": después de "tiempo" (termina en 25,90; "Y" en 26,20)
        camBc(27150, ZOOM_PREGUNTA, EMPUJE_MS), // "si tiene una pregunta": empuje leve (signos de pregunta)
        camA("IMG_4219", 32120), // "En Volto resolvemos exactamente eso." (logo de Volto)
        camBc(34950), // "Ponemos agentes de IA… dentro de tu WhatsApp, Instagram… catálogo de tu tienda."
        camA("IMG_4219", 41560), // "Somos partners de Tienda Nube… un millón y medio de seguidores."
      ],
    },
    {
      clip: "IMG_6982",
      desdeMs: 48550, // "Es" empieza en 48,63
      gananciaDb: 6.0, // -19,6 LUFS: con +6,6 el pico llegaba a 0 dBFS
      hastaMs: 52950,
      planos: [camBc(48550)], // remate de frente, a cámara: "Es muy importante… se te van a ir."
    },
  ],
  // barra espaciadora en el remate; un sonido por gráfico
  sonidos: [
    SONIDO_1(4440, "pop", POP_VOLUMEN), // logo de la Argentina Fashion Week
    SONIDO_1(48550, "tecla", BARRA_VOLUMEN),
    SONIDO_1(12760, "logo-wa", POP_VOLUMEN), // "tienda online": celular con bolsas
    // "3 o 4 páginas": una ventana por golpe, en escalera de tono
    ...VENTANAS_MS.map((ms, i) =>
      SONIDO_1(ms, `dia-${i + 1}`, DIAS_POP_VOLUMEN),
    ),
    // un pop por globo de pregunta (entran cada 5 cuadros), subiendo de tono
    ...[0, 1, 2].map((i) =>
      SONIDO_1(
        27220 + Math.round((i * 5 * 1000) / 30),
        `dia-${i + 5}`,
        POP_VOLUMEN,
      ),
    ),
    SONIDO_1(32420, "pop", POP_VOLUMEN), // logo de Volto ("En Volto resolvemos")
    SONIDO_1(37830, "logo-ig", POP_VOLUMEN), // WhatsApp
    SONIDO_1(38770, "logo-ig", POP_VOLUMEN), // Instagram
    SONIDO_1(40450, "interfaz", POP_VOLUMEN), // catálogo: se conectan
    SONIDO_1(41640, "logo-tn", POP_VOLUMEN), // Tienda Nube Partners
    SONIDO_1(45040, "cuenta", ACIERTO_VOLUMEN), // la cifra sube hasta 1.500.000
  ],
  insertos: [
    // logo de la Argentina Fashion Week (reemplaza al de la Santa Fe Fashion Week, pedido 2026-10-09): blanco sobre
    // su fondo negro original (agrandado ×2 con Real-ESRGAN, esquinas redondeadas), grande y DETRÁS de él; sale en
    // seco con el cambio de plano
    {
      tipo: "logo",
      clip: "IMG_6982",
      desdeMs: 4440,
      hastaMs: 6700,
      x: 540,
      y: 340,
      seco: true,
      sinTarjeta: true,
      sinSombra: true, // sin sombra (pedido)
      detras: RECORTE_B1,
      src: `trabajos/${ID}/img/argentina-fashion-week.png`,
      ancho: 800,
    },
    // celular con bolsas (recreado de la referencia del cliente con la paleta de Volto), hasta "Buenísimo"
    {
      tipo: "tiendaOnline",
      clip: "IMG_6982",
      desdeMs: 12760,
      hastaMs: 15300,
      x: 540,
      y: 230, // más chico (pedido)
    },
    // en el aire de arriba de la cabeza; cada uno sale en seco con el cambio de plano
    {
      tipo: "ventanas",
      ms: VENTANAS_MS,
      clip: "IMG_6982",
      desdeMs: 23950,
      hastaMs: 26150,
      x: 540,
      y: 340, // más grandes (pedido) y sin tocar la cabeza
      seco: true,
    },
    {
      tipo: "pregunta",
      clip: "IMG_6982",
      desdeMs: 27220,
      hastaMs: 29100,
      x: 540,
      y: 180,
      seco: true,
    },
    // "En Volto resolvemos": "En" + logo y "resolvemos" sobre el resaltador amarillo (reemplaza al subtítulo)
    {
      tipo: "marcaTexto",
      clip: "IMG_6982",
      desdeMs: 32200,
      hastaMs: 34950,
      x: 540,
      y: 430, // más cerca de él (pedido)
      seco: true,
      previo: "En",
      palabra: "resolvemos",
      logo: "marcas/volto/logo.png",
      logoMs: 32420,
      palabraMs: 32650,
    },
    // WhatsApp e Instagram cuando los nombra y, en "conectados al catálogo", el catálogo al centro con líneas lisas
    {
      tipo: "conexion",
      clip: "IMG_6982",
      desdeMs: 37830,
      hastaMs: 41560,
      x: 0,
      y: 0,
      seco: true,
      apps: [
        { icono: "whatsapp", x: 230, y: 290, ms: 37830 },
        { icono: "instagram", x: 850, y: 290, ms: 38770 },
      ],
      centro: { icono: "catalogo", x: 540, y: 170, ms: 40450 },
    },
    {
      tipo: "logo",
      clip: "IMG_6982",
      desdeMs: 41640,
      hastaMs: 44900,
      x: 540,
      y: 420,
      seco: true,
      src: `trabajos/${ID}/img/tiendanube-partners.png`,
      ancho: 620,
    }, // "Somos partners de Tienda Nube"
    {
      tipo: "cifra",
      valor: 1500000,
      prefijo: "+",
      etiqueta: "seguidores",
      tamano: 150,
      clip: "IMG_6982",
      desdeMs: 45000,
      hastaMs: 46250,
      x: 540,
      y: 450,
      seco: true,
    }, // hasta el fin de la toma
  ],
  // "Digital Clouds" (Mixkit 175) entra suave en "porque si no, se te van a ir" y sigue bajo la placa
  musicaFinal: {
    clip: "IMG_6982",
    ms: 51900,
    src: `trabajos/${ID}/audio/musica-final-entrevista.wav`,
    bajoVozDb: MUSICA_BAJO_VOZ_DB,
    placaDb: MUSICA_PLACA_DB,
  },
  subtitulos: {
    estilo: "reel",
    tamano: SUB_TAMANO,
    seco: true,
    // Amarillo (entre asteriscos): propuesta mínima, a confirmar por el cliente
    grupos: [
      "¿Querés tener",
      "tu marca acá?",
      "Bueno, hay algo",
      "que sí o sí",
      "tenés que tener,",
      "porque todas las marcas",
      "que están acá",
      "lo tienen.",
      "Y eso es",
      "una tienda online.",
      "¿Ya tenés",
      "una tienda online?",
      "Buenísimo.",
      "Tenés que contestar",
      "las preguntas",
      "*más rápido.*",
      "Todos estos productos",
      "que están acá",
      "son de ticket bajo.",
      "Eso significa que",
      "la persona",
      "=probablemente abre",
      "tres, cuatro páginas", // en letras (pedido)
      "al mismo tiempo.",
      "Y es muy probable que,",
      "si tiene una pregunta,",
      "le va a terminar comprando",
      "al negocio",
      "que le dé la respuesta",
      "*primero.*",
      "-En Volto resolvemos",
      "exactamente eso.",
      "Ponemos agentes",
      "de inteligencia artificial",
      "a funcionar",
      "dentro de tu WhatsApp,",
      "dentro de tu Instagram",
      "y conectados al catálogo",
      "de tu tienda.",
      "Somos partners",
      "de Tienda Nube",
      "y trabajamos con tiendas",
      "que tienen",
      "más de un millón y medio",
      "de seguidores.",
      "Es muy importante",
      "que le respondas",
      "a todos tus prospectos",
      "a tiempo,",
      "porque si no,",
      "*se te van a ir.*",
    ],
  },
  // placa por corte, solo el logo animado, con la música (sin el ambiente del desfile)
  cierre: {
    frase: "",
    sitio: "@volto.ai",
    duracion: CIERRE,
    estilo: "degrade",
    corte: true,
  },
};

// ---------- Pieza 2: "El lunes tengo el WhatsApp reventado" (guion_whatsapp-reventado.md) ----------
// IMG_6966 + IMG_4213. Salón todavía tranquilo (~22 dB entre voz y fondo): lleva música,
// Mixkit "Cat Walk" de Arulo (id 371), 0–53,4 s (preparar_musica.sh).
// Cortes en pausas medidas: se sacan 52,15–61,95 s y 72,30–98,85 s (incluye "De nuevo,").
// Las tomas empiezan con la cámara contraria a la que termina la anterior: el salto no se nota.
const whatsappReventado: HablaSubtituladaProps = {
  ...base,
  tomas: [
    {
      clip: "IMG_6966",
      desdeMs: 22700,
      gananciaDb: -1.4,
      hastaMs: 52150,
      planos: [
        camA("IMG_4213", 22700), // "Los dueños de negocios de ropa nos dicen siempre lo mismo"
        camB(34700), // "Y tengo que tener un montón de gente contratada"
        camA("IMG_4213", 40400), // "En Volto lo que hacemos es…"
        camB(47000), // "Entonces eso le permite al agente de IA responder…"
      ],
    },
    {
      clip: "IMG_6966",
      desdeMs: 61950,
      gananciaDb: -0.9,
      hastaMs: 72300,
      planos: [
        camA("IMG_4213", 61950), // "Esto lo hacemos para marcas que tienen mucho volumen"
        camB(67850), // "Y le devolvemos la paz y la tranquilidad mental"
      ],
    },
    {
      clip: "IMG_6966",
      desdeMs: 98850,
      gananciaDb: -0.7,
      hastaMs: 109350,
      planos: [
        camA("IMG_4213", 98850, ZOOM_REMATE), // "es la experiencia de que te atienda el mejor vendedor"
        camB(101600), // "Pero conectado las 24 horas del día"
        camA("IMG_4213", 105250, ZOOM_REMATE), // "Entonces, lo que logramos… ninguna de las ventas se pierda"
      ],
    },
  ],
  subtitulos: {
    estilo: "reel",
    claves: [
      "siempre lo mismo",
      "whatsapp reventado",
      "instagram",
      "un montón de gente",
      "agente de inteligencia artificial",
      "catálogo",
      "el mejor vendedor",
      "mucho volumen",
      "la paz",
      "tranquilidad mental",
      "24 horas",
      "7 días",
      "ninguna de las ventas se pierda",
    ],
  },
  musica: `trabajos/${ID}/audio/musica-whatsapp-reventado.wav`,
  musicaBajoVozDb: MUSICA_BAJO_VOZ_DB,
  musicaCierreDb: MUSICA_CIERRE_DB,
  cierre: {
    frase: "Escribinos",
    sitio: "@volto.ai",
    duracion: CIERRE,
    estilo: "degrade",
  },
};

// ---------- Pieza 3: "Partners oficiales de Tienda Nube" (guion_tienda-nube.md) ----------
// IMG_6972 (3ª toma, "ese me salió más clean") + IMG_4216 (empieza en 109,38 s de B).
// Se sacan: 119,45–133,58 ("con dos clics podés probar…", se repite al final), 164,44–167,22
// ("campañas nuevas, promociones, más contenido") y la pausa 170,70–170,98.
// Música: Mixkit "Tech House vibes" de Alejandro Magaña (id 130), 0–54,9 s (preparar_musica.sh).
const tiendaNube: HablaSubtituladaProps = {
  ...base,
  tomas: [
    {
      clip: "IMG_6972",
      desdeMs: 107600,
      gananciaDb: -1.3,
      hastaMs: 119450,
      planos: [
        camB(107600), // entra caminando: "En Volto somos partners oficiales de Tienda Nube"
        camA("IMG_4216", 113400), // "Esto significa que nos podés encontrar…"
      ],
    },
    {
      clip: "IMG_6972",
      desdeMs: 133580,
      gananciaDb: -1.6,
      hastaMs: 164440,
      planos: [
        camB(133580), // "Trabajamos con el retail de ropa femenino más grande…"
        camA("IMG_4216", 141350), // "Un equipo de más de 10 personas en atención al cliente"
        camB(145800), // "Totalmente saturado de consultas…"
        camA("IMG_4216", 153200, ZOOM_REMATE), // "A partir de tener la aplicación de Volto"
        camB(161600), // "Pensar en estrategias para hacer crecer las ventas"
      ],
    },
    {
      clip: "IMG_6972",
      desdeMs: 167220,
      gananciaDb: -2.4,
      hastaMs: 170700,
      planos: [camA("IMG_4216", 167220)], // "Y dejar que la IA se encargue del resto en piloto automático"
    },
    {
      clip: "IMG_6972",
      desdeMs: 170980, // silencio; con 171,20 se perdía "Con" (su medio cae en 171,06)
      gananciaDb: -3.0,
      hastaMs: 176620,
      planos: [
        camB(170980), // "Con dos clics podés tener la aplicación instalada"
        camA("IMG_4216", 173700, ZOOM_REMATE), // "Y probar lo que el agente de IA puede hacer para tu negocio"
      ],
    },
  ],
  subtitulos: {
    estilo: "reel",
    claves: [
      "partners oficiales",
      "tienda nube",
      "toda latinoamérica",
      "ropa femenino",
      "top 3",
      "más de 10 personas",
      "saturado",
      "una y otra vez lo mismo",
      "reducir",
      "lo que más importa",
      "crecer las ventas",
      "piloto automático",
      "dos clics",
      "tu negocio",
    ],
  },
  musica: `trabajos/${ID}/audio/musica-tienda-nube.wav`,
  musicaBajoVozDb: MUSICA_BAJO_VOZ_DB,
  musicaCierreDb: MUSICA_CIERRE_DB,
  cierre: {
    frase: "Probalo en Tienda Nube",
    sitio: "@volto.ai",
    duracion: CIERRE,
    estilo: "degrade",
  },
};

// ---------- Previews para el cliente (pedido 2026-10-06) ----------
// Solo los cortes: audio de la cám. B (micrófono) e imagen de las dos cámaras, sin subtítulos, gráficos,
// música, cierre ni movimientos animados. Se mantienen los cortes con acercamiento (cambio de plano).
const preview = (p: HablaSubtituladaProps): HablaSubtituladaProps => ({
  marca: p.marca,
  carpetaVideos: p.carpetaVideos,
  encuadre: p.encuadre,
  velocidad: p.velocidad,
  transcripcion: {},
  logoSuperior: false,
  zoomLento: false,
  cruceAudio: p.cruceAudio, // desde la preview de "Vení, seguime" (2026-10-13): las anteriores se renderizaron sin él (~20 ms de silencio en cada corte)
  seguimiento: p.seguimiento,
  // los movimientos que siguen la cara ("Vení, seguime", pedido 2026-10-13) son parte del montaje: se mantienen
  tomas: p.tomas.map((t) => ({
    ...t,
    planos: t.planos?.map((pl) =>
      pl.seguir ? pl : { ...pl, rampaMs: undefined },
    ),
  })),
});

// Plano cerrado sobre una persona en un plano único (entrevista de radio: dos personas en cuadro)
const ACERCA = 1.6;
const SOBRE_IGNACIO = "82% 40%"; // él a la derecha del cuadro
const SOBRE_PERIODISTA = "18% 40%";
const sobreEl = (ms: number) => ({
  desdeMs: ms,
  zoom: ACERCA,
  origen: SOBRE_IGNACIO,
});
const general = (ms: number) => ({
  desdeMs: ms,
  zoom: GENERAL_ZOOM,
  origen: GENERAL_ORIGEN,
});
const sobreElla = (ms: number) => ({
  desdeMs: ms,
  zoom: ACERCA,
  origen: SOBRE_PERIODISTA,
});

// Idea 4: "Tengo un casamiento el viernes" (posventa). IMG_6969 + IMG_4214, 97,50–144,20 s.
// De frente (B) las frases al espectador; de 3/4 con los arcos de ladrillo (A) las explicaciones.
const casamientoViernes: HablaSubtituladaProps = {
  ...base,
  tomas: [
    {
      clip: "IMG_6969",
      desdeMs: 97500,
      gananciaDb: -1.9,
      hastaMs: 144200, // "…de lo demás se ocupa la IA de Volto"
      planos: [
        camB(97500), // "Además, nuestros agentes no solamente actúan en la preventa…"
        camA("IMG_4214", 103700), // "¿Te pasó que vendés, vendés, vendés…?"
        camB(111700), // "Ya llegó mi pedido, ¿dónde está? Tengo un casamiento el viernes…"
        camA("IMG_4214", 116000), // "El agente de Volto puede conectarse a tu catálogo…"
        camB(123100), // "Entonces, la mitad o más de las consultas de posventa…"
        camA("IMG_4214", 131700), // "Y logramos que esas consultas no te tapen de trabajo…"
        camB(139600), // "…hacer crecer las ventas de tu negocio. De lo demás se ocupa la IA de Volto"
      ],
    },
  ],
};

// ---------- Pieza 5: "Vení, seguime" (guion_veni-seguime.md, 2026-10-13) ----------
// IMG_6977: una sola cámara (B, vertical, en mano), él camina por la pasarela hablando a cámara. Proxy
// IMG_6977n.mp4 a rango estándar (el MOV es de rango completo). De 1:55 a ~62 s: se sacan "más" del principio,
// las quejas repetidas ("Tengo un montón de consultas por WhatsApp…", 24,65–30,70), "Bueno," (57,37–57,95),
// "la tecnología ya está disponible" (59,64–62,10), "Hoy la tecnología ya permite…" y toda la posventa
// (69,60–105,43) y el "Entonces," del cierre; también las pausas antes de "Estamos" y de "Conectamos".
// Cortes en valles de la voz limpia.
// Planos (correcciones del 2026-10-13, 2ª tanda): sobre todo cortes secos a planos quietos más cerrados
// (`cerca5`, que sigue la cara con seguir_cara.py → seguimiento_IMG_6977n.json para que quede encuadrado
// aunque camine) y movimiento de cámara solo en tres frases a destacar (`empuje5`). Cada corte cambia de
// escala (≥ 0,3) para que el salto no se note. Sin cuadros congelados (se veían "trabados").
const ID_5 = "IMG_6977n";
const plano5 = (
  ms: number,
  zoom = 1,
  extra: {
    zoomDesde?: number;
    rampaMs?: number;
    seguir?: boolean;
    origen?: string;
  } = {},
) => ({ desdeMs: ms, clip: ID_5, desfaseMs: 0, zoom, fijo: true, ...extra });
const ABIERTO_5 = 1; // el original
const CERCA_5 = 1.35; // corte seco a un plano más cerrado, quieto, con la cara encuadrada
const ESTAMOS_5 = "100% 45%"; // "Estamos acá…": recorte anclado a la derecha (a la izquierda caminan mujeres)
const abierto5 = (ms: number) => plano5(ms, ABIERTO_5);
const cerca5 = (ms: number, zoom = CERCA_5) =>
  plano5(ms, zoom, { seguir: true });
// movimiento de cámara para destacar una frase: acercamiento suave al arrancar y al llegar
const empuje5 = (ms: number, desde: number, hasta: number, rampaMs: number) =>
  plano5(ms, hasta, { zoomDesde: desde, rampaMs, seguir: true });
const toma5 = (
  desdeMs: number,
  hastaMs: number,
  planos: ReturnType<typeof plano5>[],
  extra: { pausaMs?: number; ambienteMs?: number } = {},
) => ({ clip: "IMG_6977", desdeMs, hastaMs, planos, ...extra });
const veniSeguime: HablaSubtituladaProps = {
  ...base,
  apertura: undefined,
  cruceAudio: 1, // un cuadro de fundido cruzado entre tomas (sin él, cada corte cae a silencio ~20 ms)
  seguimiento: { [ID_5]: seguimiento5 },
  tomas: [
    // "¿Sos dueño o dueña de una marca de ropa…?": leve zoom de entrada (gancho) / en "¿Tenés un montón
    // de consultas…?" otro acercamiento leve y lento, con la cámara en movimiento (pedido 2026-10-13)
    toma5(2150, 11420, [
      empuje5(2150, 1, 1.1, 1500),
      empuje5(7500, 1.1, 1.22, 3000),
    ]),
    // "Estamos acá en Argentina Fashion Week…": 1,45× anclado a la derecha para sacar a las mujeres que
    // caminan por el borde izquierdo / MOVIMIENTO en "Vení, seguime." y corte apenas termina (17,28)
    toma5(12000, 17330, [
      plano5(12000, 1.45, { origen: ESTAMOS_5 }),
      plano5(16650, 1.65, { zoomDesde: 1.45, rampaMs: 600, origen: ESTAMOS_5 }),
    ]),
    // caminando: "Lo que dueños y dueñas de marcas nos dicen…" / cerca en "no doy abasto para responder WhatsApp."
    toma5(18200, 24650, [abierto5(18200), cerca5(22100, 1.5)]),
    // "Entonces, tenés tu WhatsApp reventado… y tenés una tienda online" en el original (sin corte) /
    // MOVIMIENTO en "Volto es la solución para tu negocio." (queda cerca hasta "¿Qué es lo que hacemos para eso?")
    toma5(30700, 37320, [abierto5(30700), empuje5(34200, 1, 1.45, 600)]),
    // "Conectamos agentes de IA…" / cerca en "se conectan a Tienda Nube, WooCommerce, Shopify" /
    // abierto en "y responden como si fueran vendedores de tu empresa."
    toma5(37680, 47400, [abierto5(37680), cerca5(41450), abierto5(44750)]),
    // "Logramos liberar hasta el 80%…": en el original sale de cuadro por la derecha (47,85–48,70); plano
    // agrandado y quieto anclado a ese borde (lo que más se le ve). Abierto cuando vuelve a entrar (48,95)
    // y cerca en "Te preguntan por stock, por talle, por cantidad." ("canti-dad" termina en 57,36).
    toma5(47600, 57370, [
      plano5(47600, 1.3, { origen: "100% 42%" }),
      abierto5(48950),
      cerca5(53150, 1.5),
    ]),
    // "Hoy el agente de IA ya puede resolver eso." Corte apenas termina (59,64; "la tecnología" viene pegada)
    toma5(57950, 59640, [abierto5(57950)]),
    // "Literalmente, en Volto lo estamos haciendo para las marcas…" / original desde "y están teniendo
    // resultados" / MOVIMIENTO recién en "increíbles." (68,86)
    toma5(62100, 69600, [
      cerca5(62100),
      abierto5(66750),
      empuje5(68800, 1, 1.4, 700),
    ]),
    // viene hacia la cámara: "¿Necesitás Volto? ¿Estás en esa situación? Escribinos acá abajo…"
    toma5(108050, 112800, [abierto5(108050)]),
  ],
};

// Pieza 6: entrevista de radio (guion_entrevista-radio.md; preview aprobada, correcciones del 2026-10-08).
// IMG_6976 (una sola cámara, vertical). Solo tres planos: el original (general, los dos), cerrado sobre
// ella y cerrado sobre él (cambios de plano marcados por el cliente, 2026-10-08). Cada corte del montaje
// cae en un cambio de plano (así el salto no se nota). Los cortes van pegados a la voz (sin silencios).
// Se sacan: "junto a Ignacio, él es el cofundador de la empresa Volto" (3,58–9,02), "para los oyentes que están aquí en
// esta Fashion Week" (10,40–14,13), "Trabajamos con muchas
// marcas de ropa femenina…" (19,70–24,05), el problema del local (25,75–45,12) y la primera mención de
// las redes (62,36–89,95). Termina en "…para atender también" (122,21); después ella sigue hablando, por
// eso la placa final va sin el ambiente.
// Fondo del desfile alto (~11 dB bajo la voz): sin música. La voz sale de voz_suave/ (preparar_voz_entrevista.sh:
// DeepFilterNet con --atten-lim 10, el ruido baja 10 dB, no del todo, para que no suene robotizada); ganancias medidas con
// ebur128 sobre ese archivo (-19 LUFS por toma: margen para que la voz no sature en la mezcla; el
// loudnorm del render final la lleva a -14). Entre tomas, cruce de audio de 1 cuadro (sin hueco de silencio).
// Rótulo animado "@volto.ai" (RotuloUsuario) en el aire de arriba del general mientras dice "nos escriben a volto.ai".
// Insertos (pedido 2026-10-08, para que no quede plano sin música): logos de la Santa Fe Fashion Week y de
// Tienda Nube Partners, íconos de WhatsApp e Instagram, reloj 24/7 con tic-tac, robot tachado y las dos
// enumeraciones en burbujas (✕ con sonido de error / ✓ con sonido de acierto), cada uno cuando se nombra.
const entrevistaRadio: EntrevistaRadioProps = {
  ...base,
  apertura: undefined, // sin títulos arriba (pedido 2026-10-08)
  audios: { IMG_6976: `trabajos/${ID}/audio/voz_suave/IMG_6976.wav` },
  cruceAudio: 1,
  efectosDb: EFECTOS_DB,
  rotulo: {
    texto: "@volto.ai",
    clip: "IMG_6976",
    desdeMs: 109450,
    hastaMs: 113000,
    y: 330,
    sonido: `trabajos/${ID}/audio/interfaz.wav`, // Mixkit 2574 "Software interface start"
  },
  // Efectos solo en algunos cambios de plano (preparar_sonidos_entrevista.sh): barra espaciadora (la tecla
  // grave, Mixkit 2542) al volver al general después de "¿de qué se trata tu empresa?" y clic de mouse
  // (Mixkit 1113) en tres que remarcan una idea
  sonidos: [
    {
      clip: "IMG_6976",
      ms: 15950,
      src: `trabajos/${ID}/audio/tecla.wav`,
      volumen: BARRA_VOLUMEN,
    },
    ...[48950, 106250].map((ms) => ({
      clip: "IMG_6976",
      ms,
      src: `trabajos/${ID}/audio/clic.wav`,
      volumen: CLIC_VOLUMEN,
    })),
    // insertos
    // un sonido por logo; las redes comparten el de notificación (pedido del cliente) y el nodo de Volto, el clic con tono
    ...(
      [
        [2300, "pop"],
        [24300, "logo-tn"],
        [51920, "logo-ig"],
        [52810, "logo-ig"],
        [53290, "logo-tn"],
        [53880, "logo-ig"],
        [54140, "logo-ig"],
      ] as const
    ).map(([ms, archivo]) => ({
      clip: "IMG_6976",
      ms,
      src: `trabajos/${ID}/audio/${archivo}.wav`,
      volumen: POP_VOLUMEN,
    })),
    {
      clip: "IMG_6976",
      ms: 58250,
      src: `trabajos/${ID}/audio/tictac.wav`,
      volumen: TICTAC_VOLUMEN,
    },
    // pop, pop, pop… con cada día de la semana que se enciende (L M M J V S D), subiendo de tono
    ...Array.from({ length: 7 }, (_, i) => ({
      clip: "IMG_6976",
      ms: Math.round(RELOJ_DIAS_MS + (i * RELOJ_DIA_PASO * 1000) / 30),
      src: `trabajos/${ID}/audio/dia-${i + 1}.wav`,
      volumen: DIAS_POP_VOLUMEN,
    })),
    {
      clip: "IMG_6976",
      ms: 91550,
      src: `trabajos/${ID}/audio/robot.wav`,
      volumen: ROBOT_VOLUMEN,
    },
    // errores: el mismo beep (pedido del cliente); aciertos: en escalera hacia arriba
    ...PREGUNTAS.map(([, ms]) => ({
      clip: "IMG_6976",
      ms,
      src: `trabajos/${ID}/audio/error.wav`,
      volumen: ERROR_VOLUMEN,
    })),
    ...TAREAS.map(([, ms], i) => ({
      clip: "IMG_6976",
      ms,
      src: `trabajos/${ID}/audio/acierto-${i + 1}.wav`,
      volumen: ACIERTO_VOLUMEN,
    })),
    {
      clip: "IMG_6976",
      ms: 117200,
      src: `trabajos/${ID}/audio/tipeo.wav`,
      volumen: TIPEO_VOLUMEN,
    }, // "nos escriben por Instagram…"
  ],
  insertos: [
    // en el aire de arriba del cuadro (y≈330–400): no tapan caras en ningún plano
    {
      tipo: "logo",
      clip: "IMG_6976",
      desdeMs: 2300,
      hastaMs: 3570,
      x: 540,
      y: 330,
      seco: true, // se va con el corte
      src: `trabajos/${ID}/img/santa-fe-fashion-week.png`,
      ancho: 360,
    }, // "Santa Fe Fashion Week"
    // en su tarjeta blanca original, más abajo, cerca de él (su cabeza llega a y≈650 en este plano) con un
    // margen; sale en seco cuando arranca la toma siguiente
    {
      tipo: "logo",
      clip: "IMG_6976",
      desdeMs: 24300,
      hastaMs: 25740,
      x: 540,
      y: 460,
      seco: true,
      src: `trabajos/${ID}/img/tiendanube-partners.png`,
      ancho: 760,
    }, // "partners oficiales de Tienda Nube"
    // "Lo conectamos al WhatsApp, lo conectamos a Instagram, lo conectamos a las redes sociales": cada ícono
    // cuando se nombra; en el tercer "conectamos" aparece Volto al centro y se conecta a ellos, y en "redes
    // sociales" se suman Facebook y TikTok. Se va en seco con el cambio de plano de "y lo entrenamos…" (55,0)
    {
      tipo: "red",
      clip: "IMG_6976",
      desdeMs: 51920,
      hastaMs: 55000,
      x: 540,
      y: 200,
      seco: true,
      nodoMs: 53290,
      apps: [
        { icono: "whatsapp", x: 380, y: 410, ms: 51920 },
        { icono: "instagram", x: 700, y: 410, ms: 52810 },
        { icono: "facebook", x: 150, y: 410, ms: 53880 },
        { icono: "tiktok", x: 930, y: 410, ms: 54140 },
      ],
    },
    // hasta "…los clientes" y en seco con el corte al general (fin de la toma, 62,36)
    {
      tipo: "reloj",
      clip: "IMG_6976",
      desdeMs: 58250,
      hastaMs: 62350,
      x: 540,
      y: 400,
      seco: true,
      texto: "24 hs",
      textoMs: 58400,
      diasMs: RELOJ_DIAS_MS,
    },
    {
      tipo: "robot",
      clip: "IMG_6976",
      desdeMs: 91550,
      hastaMs: 94000,
      x: 540,
      y: 320,
      tachaMs: 92860,
    },
    {
      tipo: "lista",
      signo: "error",
      clip: "IMG_6976",
      desdeMs: 97750,
      hastaMs: 100050,
      x: 540,
      y: 330,
      ancho: 980,
      items: PREGUNTAS.map(([texto, ms]) => ({ texto, ms })),
    },
    {
      tipo: "lista",
      signo: "acierto",
      clip: "IMG_6976",
      desdeMs: 103650,
      hastaMs: 106200,
      x: 540,
      y: 330,
      ancho: 980,
      items: TAREAS.map(([texto, ms]) => ({ texto, ms })),
    },
  ],
  // "Digital Clouds" (Mixkit 175) entra suave en "…agente de IA para atender también" y sigue bajo la placa
  musicaFinal: {
    clip: "IMG_6976",
    ms: 120900,
    src: `trabajos/${ID}/audio/musica-final-entrevista.wav`,
    bajoVozDb: MUSICA_BAJO_VOZ_DB,
    placaDb: MUSICA_PLACA_DB,
  },
  tomas: [
    {
      clip: "IMG_6976",
      desdeMs: 0,
      gananciaDb: 1.5,
      hastaMs: 3580, // fin de "Week" (valle 3,50–3,62; "junto" en 3,64): se saca "junto a Ignacio, él es el cofundador…"
      planos: [general(0)], // "Estamos en la tercera edición de la Santa Fe Fashion Week."
    },
    {
      clip: "IMG_6976",
      desdeMs: 9020, // "Explicanos" empieza en 9,08
      gananciaDb: 1.5,
      hastaMs: 10370, // fin de "poco" (valle 10,36–10,38); el cruce de 1 cuadro llega hasta 10,40, donde empieza "para"
      planos: [sobreElla(9020)], // mismo plano que "¿de qué se trata tu empresa?": la pregunta queda de corrido
    },
    {
      clip: "IMG_6976",
      desdeMs: 14130, // "¿De qué se trata tu empresa?" ("De" en 14,20)
      gananciaDb: 4.1,
      hastaMs: 19700, // fin de "retail"
      planos: [
        sobreElla(14130), // el corte cae en el cambio de general a cerrado de ella
        general(15950), // general: "En Volto hacemos agentes de inteligencia artificial para marcas de retail."
      ],
    },
    {
      clip: "IMG_6976",
      desdeMs: 24050, // "Y" empieza en 24,12: entra al toque
      gananciaDb: 4.5,
      hastaMs: 25750,
      planos: [sobreEl(24050)], // "Y somos partners oficiales de Tienda Nube."
    },
    {
      clip: "IMG_6976",
      desdeMs: 45120, // "Entonces" empieza en 45,18
      gananciaDb: 2.9,
      hastaMs: 62360,
      planos: [
        general(45120), // general: "Entonces, lo que hacemos es: ponemos un vendedor, pero en vez de ser…"
        sobreEl(48950), // "es un vendedor con inteligencia artificial."
        general(51250), // general: "Lo conectamos al WhatsApp, lo conectamos a Instagram… las redes sociales"
        // él desde "y lo entrenamos como el mejor vendedor…" y sigue en "La diferencia es que está las 24
        // horas…" (volver al general solo para "La diferencia es que" duraba 0,65 s: un salto)
        sobreEl(55000),
      ],
    },
    {
      clip: "IMG_6976",
      desdeMs: 89950, // "Lo que nosotros…" (pausa hasta 90,06)
      gananciaDb: 3.9,
      hastaMs: 122210, // fin de "también"
      planos: [
        general(89950), // general: "Lo que nosotros queremos hacer es… pueden centrarse… A lanzar campañas… promociones."
        sobreEl(106250), // remate: "Y mientras, la IA vende por vos en piloto automático."
        general(108650), // general: "Entonces, nos escriben a volto.ai… inteligencia artificial de Volto."
        sobreEl(116750), // él: "Y además nos escriben por Instagram y les vamos a dar respuesta inmediata,"
        general(119900), // general: "porque en Volto usamos nuestro propio agente de IA para atender también."
      ],
    },
  ],
  subtitulos: {
    estilo: "reel",
    tamano: SUB_TAMANO, // como el reel de referencia del cliente (captura del 2026-10-08); dos renglones si no entra
    seco: true, // entran y salen sin animación
    // Guion de subtítulos (pedido 2026-10-08). Amarillo: entre asteriscos (palabras elegidas por el cliente).
    grupos: [
      "Estamos en la",
      "tercera edición de la",
      "Santa Fe Fashion Week.",
      "Explicanos un poco",
      "¿de qué se trata",
      "tu empresa?",
      "En Volto hacemos",
      "agentes de",
      "inteligencia artificial",
      "para marcas de retail.",
      "Y somos *partners*",
      "*oficiales* de",
      "Tienda Nube.",
      "Entonces,",
      "lo que hacemos es:",
      "ponemos un vendedor,",
      "pero en vez de ser",
      "un vendedor físico,",
      "es un *vendedor*",
      "*con inteligencia artificial.*",
      "Lo conectamos",
      "al WhatsApp,",
      "lo conectamos",
      "a Instagram,",
      "lo conectamos a",
      "las redes sociales",
      "y lo entrenamos",
      "como el mejor vendedor",
      "de la empresa.",
      "La diferencia es que",
      "está las *24 horas,*",
      "los *7 días* de la semana",
      "conectado,",
      "atendiendo a",
      "los clientes.",
      "Lo que nosotros",
      "queremos hacer es",
      "*dejar de robotizar*",
      "a los humanos para",
      "que puedan centrarse",
      "en lo importante.",
      "Si tienen que dejar de responder",
      "las preguntas que",
      "le hacen siempre,",
      "como talle,",
      "stock, precio,",
      "color, cantidad,",
      "pueden centrarse",
      "en empezar a hacer",
      "*más estrategia*",
      "para su negocio.",
      "-Exactamente.",
      "A lanzar campañas,",
      "lanzamientos,",
      "descuentos,",
      "promociones.",
      "Y mientras,",
      "la IA vende por vos",
      "en piloto automático.",
      "Entonces, nos escriben",
      "a volto.ai",
      "en nuestras redes",
      "y van a ver testimonios",
      "de marcas top",
      "en Argentina",
      "que están usando ya",
      "la inteligencia artificial",
      "de Volto.",
      "Y además nos escriben",
      "por Instagram",
      "y les vamos a dar",
      "*respuesta inmediata,*",
      "porque en Volto usamos",
      "nuestro propio",
      "agente de IA",
      "para atender también.",
    ],
  },
  // placa por corte, solo el logo animado; sin ambiente: ella sigue hablando
  cierre: {
    frase: "",
    sitio: "@volto.ai",
    duracion: CIERRE,
    estilo: "degrade",
    corte: true,
  },
};

// Idea 7: lanzamientos y pauta. IMG_6969 + IMG_4214: 18,85–55,80 y 79,85–97,15 s (se saca la parte
// repetida de "te escriben precio, info", 55,80–79,85).
const lanzamientosPauta: HablaSubtituladaProps = {
  ...base,
  tomas: [
    {
      clip: "IMG_6969",
      desdeMs: 18850,
      gananciaDb: -1.9,
      hastaMs: 55800, // "…hace el trabajo por vos"
      planos: [
        camB(18850), // "Sabemos que si en tu marca de ropa hacés un lanzamiento…"
        camA("IMG_4214", 25200), // "Quizás te escriben mil, dos mil, cinco mil personas…"
        camB(35900), // "En Volto, la IA puede atender todas esas consultas…"
        camA("IMG_4214", 43200), // "Y no hablo de un chat…"
        camB(50700), // "Puede ayudarte a vender… hace el trabajo por vos"
      ],
    },
    {
      clip: "IMG_6969",
      desdeMs: 79850,
      gananciaDb: -2.1,
      hastaMs: 97150, // "…sobre lo que vos le estás preguntando"
      planos: [
        camA("IMG_4214", 79850), // "El agente de Volto se conecta a la pauta…"
        camB(90000), // "Entonces no te va a preguntar desde cero: 'hola, ¿cómo estás?'"
        camA("IMG_4214", 93500), // "Te va a contestar exactamente sobre lo que le estás preguntando"
      ],
    },
  ],
};

const PREVIEWS: [string, HablaSubtituladaProps][] = [
  ["marca-ropa", marcaRopa],
  ["whatsapp-reventado", whatsappReventado],
  ["tienda-nube", tiendaNube],
  ["casamiento-viernes", casamientoViernes],
  ["entrevista-radio", entrevistaRadio],
  ["lanzamientos-pauta", lanzamientosPauta],
  ["veni-seguime", veniSeguime],
];

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "volto-fashion-week-marca-ropa",
    component: EntrevistaRadio,
    durationInFrames: duracionHablaSubtitulada(marcaRopa),
    defaultProps: marcaRopa,
    salida: "marca-ropa_9x16",
  },
  {
    id: "volto-fashion-week-whatsapp-reventado",
    component: HablaSubtitulada,
    durationInFrames: duracionHablaSubtitulada(whatsappReventado),
    defaultProps: whatsappReventado,
    salida: "whatsapp-reventado_9x16",
  },
  {
    id: "volto-fashion-week-tienda-nube",
    component: HablaSubtitulada,
    durationInFrames: duracionHablaSubtitulada(tiendaNube),
    defaultProps: tiendaNube,
    salida: "tienda-nube_9x16",
  },
  {
    id: "volto-fashion-week-entrevista-radio",
    component: EntrevistaRadio,
    durationInFrames: duracionHablaSubtitulada(entrevistaRadio),
    defaultProps: entrevistaRadio,
    salida: "entrevista-radio_9x16",
  },
  ...PREVIEWS.map(([nombre, props]): ComposicionTrabajo => {
    const pv = preview(props);
    return {
      id: `volto-fashion-week-preview-${nombre}`,
      component: HablaSubtitulada,
      durationInFrames: duracionHablaSubtitulada(pv),
      defaultProps: pv,
      salida: `preview-${nombre}_9x16`,
    };
  }),
];
