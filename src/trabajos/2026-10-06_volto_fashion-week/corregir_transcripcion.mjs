// Transcripción por palabra de los clips de la cám. B (la del micrófono), corregida a mano.
// Mismo método que 2026-09-28_volto_ia2026/corregir_transcripcion.mjs:
//   fin de palabra    = t_dtw de su último token (alineación DTW de whisper.cpp)
//   inicio de palabra = fin de la anterior, o el final de una pausa real entre ambas
//                       (silencedetect, >= 150 ms). Acá el umbral es relativo al fondo de cada clip
//                       (el ambiente del desfile está alto en el bloque de las 18 h).
// Las correcciones de texto van con el segundo aproximado: son clips largos y las palabras se repiten.
// Voz limpia: si existe audio/voz_limpia/<clip>.wav (DeepFilterNet, sin el ruido del desfile), los tiempos
// salen de ahí: pausas reales (umbral fijo UMBRAL_LIMPIA; con el ruido no se veían y los subtítulos
// quedaban corridos) y, dentro de una frase continua, cada límite entre palabras se lleva al mínimo de
// energía más cercano (±AJUSTE_MS) del límite DTW. El texto sigue siendo el de la transcripción con
// ruido: la de la voz limpia tiene más errores ("¿Se ha tenido", "inteligente") y los mismos tiempos DTW.
// Uso (raíz del proyecto): node src/trabajos/2026-10-06_volto_fashion-week/corregir_transcripcion.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const ID = "2026-10-06_volto_fashion-week";
const DATOS = `public/trabajos/${ID}/datos`;
const CRUDOS = `public/trabajos/${ID}/crudos`;
const herr = JSON.parse(fs.readFileSync("scripts/herramientas.json", "utf8"));

// Clips con su umbral de silencio (dB): ~6 dB sobre el fondo medido (p10) de cada uno
const CLIPS = {
  IMG_6966: -30,
  IMG_6972: -29,
  IMG_6982: -17,
  IMG_6976: -21,
  IMG_6977: -24,
};
const UMBRAL_LIMPIA = -40;
const AJUSTE_MS = 120;
const VENTANA_ENERGIA_MS = 10;
// energía (dB) de la voz limpia cada 10 ms
const energia = (clip) => {
  const r = spawnSync(
    herr.ffmpeg,
    [
      "-v",
      "error",
      "-i",
      LIMPIA(clip),
      "-ac",
      "1",
      "-ar",
      "16000",
      "-f",
      "s16le",
      "-",
    ],
    { maxBuffer: 1 << 28 },
  );
  const x = new Int16Array(
    r.stdout.buffer,
    r.stdout.byteOffset,
    r.stdout.length / 2,
  );
  const n = 16 * VENTANA_ENERGIA_MS;
  const db = [];
  for (let i = 0; i + n <= x.length; i += n) {
    let s = 0;
    for (let j = i; j < i + n; j++) s += (x[j] / 32768) ** 2;
    db.push(10 * Math.log10(s / n + 1e-12));
  }
  return db;
};
// mínimo de energía cerca de `ms` (el valle entre dos palabras)
const valle = (db, ms) => {
  const c = Math.round(ms / VENTANA_ENERGIA_MS);
  const r = Math.round(AJUSTE_MS / VENTANA_ENERGIA_MS);
  let mejor = c;
  for (let i = Math.max(0, c - r); i <= Math.min(db.length - 1, c + r); i++)
    if (db[i] < db[mejor]) mejor = i;
  return mejor * VENTANA_ENERGIA_MS;
};
const LIMPIA = (clip) => `public/trabajos/${ID}/audio/voz_limpia/${clip}.wav`;

// [segundo aproximado, texto de Whisper, texto corregido]
const TEXTO = {
  // "la gente de día" = "el agente de IA" (Whisper lo confunde siempre; en el material de Volto ya pasó)
  IMG_6966: [
    [48.36, "la", "al"],
    [48.42, "gente", "agente"],
    [48.82, "día", "IA"],
  ],
  IMG_6972: [
    [168.78, "de", "del"],
    [174.74, "la", "el"],
    [174.82, "gente", "agente"],
    [175.04, "de", "de"],
    [175.18, "vida", "IA"],
  ],
  IMG_6982: [
    [23.96, "hable", "abre"],
    [35.3, "a", ""],
    [35.56, "gente", "agentes"],
    [42.5, "Tiendan", "Tienda"],
    [42.84, "Uwe", "Nube"],
    [49.52, "nos", "le"],
    [24.14, "3,", "tres,"],
    [24.46, "4", "cuatro"],
  ], // en letras (pedido 2026-10-09: "tres, cuatro", no "3 o 4")
  // pieza 5 ("Vení, seguime"): "a gente" = "agentes"; "la gente" = "el agente de IA" (la voz limpia da
  // "el agente de días")
  IMG_6977: [
    [38.22, "a", ""],
    [38.29, "gente", "agentes"],
    [58.05, "la", "el"],
    [58.31, "gente", "agente de IA"],
  ],
  // "sentarse" = "centrarse" (seseo; lo repite bien a los 100 s); "por voz" = "por vos"
  IMG_6976: [
    [8.19, "Polto", "Volto"],
    [16.07, "Polto", "Volto"],
    [93.8, "sentarse", "centrarse"],
    [97.85, "talla,", "talle,"],
    [107.39, "voz", "vos"],
    [118.52, "le", "les"],
  ],
};
// Puntuación y mayúsculas de los subtítulos: [segundo de la 1ª palabra, frase corregida].
// Reemplaza esa cantidad de palabras (misma cantidad, así se conservan los tiempos); "~" une dos
// palabras en una sola ("3~o" se ve "3 o": se agrega una palabra que no se dijo clara).
const FRASES = {
  IMG_6977: [
    [
      1.1,
      "¿Sos dueño o dueña de una marca de ropa y sentís que estás estancado en tus ventas, que no podés crecer?",
    ],
    [
      7.22,
      "¿Tenés un montón de consultas por tu web y no se transforman en ventas?",
    ],
    [
      12.04,
      "Estamos acá en Argentina Fashion Week y te vamos a decir qué es lo que podés hacer para incrementar eso.",
    ],
    [16.4, "Vení, seguime."],
    [
      18.27,
      "Lo que dueños y dueñas de marcas nos dicen todo el tiempo es: no doy abasto para responder WhatsApp.",
    ],
    [
      30.76,
      "Entonces, tenés tu WhatsApp reventado, tu Instagram reventado y tenés una tienda online.",
    ],
    [34.24, "Volto es la solución para tu negocio."],
    [35.76, "¿Qué es lo que hacemos para eso?"],
    [
      36.96,
      "Conectamos agentes de inteligencia artificial que se conectan a tus sistemas, se conectan a Tienda Nube, se conectan a WooCommerce, se conectan a Shopify y responden como si fueran vendedores de tu empresa.",
    ],
    [
      47.06,
      "Logramos liberar hasta el 80% de las consultas repetitivas que tenés una y otra vez.",
    ],
    [
      52.96,
      "Te preguntan por stock, te preguntan por talle, te preguntan por cantidad.",
    ],
    [57.18, "Bueno, hoy el agente~de~IA ya puede resolver eso."],
    [
      61.82,
      "Literalmente, en Volto lo estamos haciendo para las marcas que más venden en Tienda Nube a nivel país y están teniendo resultados increíbles.",
    ],
    [
      104.88,
      "Entonces, ¿necesitás Volto? ¿Estás en esa situación? Escribinos acá abajo y contanos, te podemos ayudar.",
    ],
  ],
  IMG_6982: [
    [3.96, "¿Querés tener tu marca acá?"],
    [6.48, "Bueno, hay algo que sí o sí tenés que tener,"],
    [9.62, "porque todas las marcas que están acá lo tienen."],
    [11.26, "Y eso es una tienda online."],
    [13.2, "¿Ya tenés una tienda online? Buenísimo."],
    [14.94, "Tenés que contestar las preguntas más rápido."],
    [17.7, "Todos estos productos que están acá son de ticket bajo."],
    [
      21.36,
      "Eso significa que la persona probablemente abre tres, cuatro páginas al mismo tiempo.",
    ],
    [25.76, "Y es muy probable que, si tiene una pregunta,"],
    [
      27.94,
      "le va a terminar comprando al negocio que le dé la respuesta primero.",
    ],
    [31.7, "En Volto resolvemos exactamente eso."],
    [
      34.6,
      "Ponemos agentes de inteligencia artificial a funcionar dentro de tu WhatsApp,",
    ],
    [38.12, "dentro de tu Instagram y conectados al catálogo de tu tienda."],
    [41.4, "Somos partners de Tienda Nube"],
    [
      43.36,
      "y trabajamos con tiendas que tienen más de un millón y medio de seguidores.",
    ],
    [
      48.42,
      "Es muy importante que le respondas a todos tus prospectos a tiempo,",
    ],
    [51.88, "porque si no, se te van a ir."],
  ],
  IMG_6976: [
    [0.41, "Estamos en la tercera edición de la Santa Fe Fashion Week,"],
    [3.65, "junto a Ignacio, él es el cofundador de la empresa Volto."],
    [
      8.7,
      "Explicanos un poco para los oyentes que están aquí en esta Fashion Week:",
    ],
    [14.1, "¿De qué se trata tu empresa?"],
    [
      16.03,
      "En Volto hacemos agentes de inteligencia artificial para marcas de retail.",
    ],
    [23.78, "Y somos partners oficiales de Tienda Nube."],
    [44.66, "Entonces, lo que hacemos es: ponemos un vendedor."],
    [
      47.66,
      "Pero en vez de ser un vendedor físico, es un vendedor con inteligencia artificial.",
    ],
    [
      50.76,
      "Lo conectamos al WhatsApp, lo conectamos a Instagram, lo conectamos a las redes sociales",
    ],
    [54.48, "y lo entrenamos como el mejor vendedor de la empresa."],
    [
      57.34,
      "La diferencia es que está las 24 horas, los 7 días de la semana conectado, atendiendo a los clientes.",
    ],
    [
      89.72,
      "Lo que nosotros queremos hacer es dejar de robotizar a los humanos para que puedan centrarse en lo importante.",
    ],
    [
      94.88,
      "Si tienen que dejar de responder las preguntas que le hacen siempre, como talle, stock, precio, color, cantidad,",
    ],
    [
      99.6,
      "pueden centrarse en empezar a hacer más estrategia para su negocio.",
    ],
    [102.98, "Exactamente."],
    [103.34, "A lanzar campañas, lanzamientos, descuentos, promociones."],
    [106.0, "Y mientras, la IA vende por vos en piloto automático."],
  ],
};
// Inicios medidos a mano en la energía de la voz limpia, donde el DTW se corrió: [segundo que imprime
// --ver, palabra, inicio real en ms]. "Igna-cio" tiene una "c" casi muda (4,28–4,42) que se tomó por pausa.
const TIEMPOS = {
  IMG_6982: [
    [6.44, "Bueno,", 6880], // el valle de 6,38–6,42 es la "c" de "a-cá" (no el final): "cá" sigue hasta ~6,80 y "Bueno" arranca en 6,88
    [25.74, "Y", 26180], // el DTW ponía la "Y" sobre el "-po" de "tiempo" (25,74–25,90); la "Y" arranca en 26,20
  ],
  IMG_6976: [
    [4.43, "él", 4840],
    [5.26, "es", 5040],
    [5.68, "el", 5270],
    [7.11, "de", 7100],
  ], // valle de la voz en 7,10: "Él es el cofundador" hasta el segundo 7 (pedido del cliente)
  // "canti-dad" sigue hasta 57,36 (boca abierta en la "a"); "Bueno" arranca con los labios redondeados en 57,40
  IMG_6977: [[57.06, "Bueno,", 57400]],
};
// Fines de palabra corregidos a mano: [segundo de inicio, texto, fin en ms] (energía de la voz limpia)
const FINES = {
  IMG_6982: [
    [6.265, "acá?", 6800], // termina la cola de "cá" (ver "Bueno," en TIEMPOS)
    [17.37, "rápido.", 17800],
    [25.54, "tiempo.", 25900],
    [26.18, "Y", 26210],
  ], // el DTW lo estiraba hasta 18,53 sobre la pausa (se corta en 17,82)
  IMG_6977: [[56.7, "cantidad.", 57360]], // ver "Bueno," en TIEMPOS
};
const VENTANA_CORRECCION_MS = 1500;
const PRIMERA_PALABRA_MAX_MS = 450;

const pausas = (clip, db, limpia) => {
  const r = spawnSync(
    herr.ffmpeg,
    [
      "-hide_banner",
      "-nostats",
      "-i",
      limpia ? LIMPIA(clip) : `${CRUDOS}/${clip}.mp4`,
      "-map",
      "0:a:0",
      "-af",
      `silencedetect=n=${limpia ? UMBRAL_LIMPIA : db}dB:d=${limpia ? 0.12 : 0.15}`,
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" },
  );
  const ini = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map(
    (m) => +m[1] * 1000,
  );
  const fin = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map(
    (m) => +m[1] * 1000,
  );
  return ini.map((a, i) => [a, fin[i] ?? Infinity]);
};

const aPalabras = (tokens) => {
  const palabras = [];
  for (const t of tokens) {
    const esPuntuacion = /^[.,:;!?¿¡]+$/.test(t.text.trim());
    const abre = /^[¿¡]/.test(t.text.trim()); // "Week¿Querés": el ¿ viene pegado, sin espacio
    const nueva =
      palabras.length === 0 ||
      abre ||
      (t.text.startsWith(" ") && !esPuntuacion);
    if (nueva)
      palabras.push({
        text: t.text.trim(),
        endMs: t.dtwMs,
        finDtw: t.dtwMs,
        desdeTokenMs: t.fromMs,
      });
    else {
      const p = palabras.at(-1);
      p.text += t.text.trim();
      if (!esPuntuacion) p.endMs = p.finDtw = Math.max(p.endMs, t.dtwMs);
    }
  }
  return palabras;
};

// startMs/endMs de cada palabra: el fin es el DTW de Whisper; el inicio, el final de una pausa real
// entre las dos palabras o, si no hay, el fin de la anterior (con `ener`: el valle de energía más cercano)
const tiempos = (palabras, ps, ener) => {
  let anterior = 0;
  palabras.forEach((p, i) => {
    p.endMs = p.finDtw;
    const pausa = ps.filter(([, b]) => b > anterior && b < p.endMs - 60).at(-1);
    if (pausa) {
      p.startMs = Math.round(pausa[1]);
      // la palabra anterior termina donde empieza el silencio
      if (i > 0 && ener && pausa[0] > palabras[i - 1].startMs)
        palabras[i - 1].endMs = Math.round(pausa[0]);
    } else if (i === 0)
      p.startMs = Math.max(0, p.endMs - PRIMERA_PALABRA_MAX_MS);
    else {
      p.startMs = ener
        ? Math.max(palabras[i - 1].startMs + 40, valle(ener, anterior))
        : anterior;
      if (ener) palabras[i - 1].endMs = p.startMs;
    }
    anterior = p.finDtw;
  });
  // ninguna palabra empieza en silencio: el inicio avanza hasta la primera voz (máx. hasta su fin)
  if (ener) {
    palabras.forEach((p) => {
      let t = p.startMs;
      while (
        t < p.endMs - 40 &&
        ener[Math.round(t / VENTANA_ENERGIA_MS)] < UMBRAL_LIMPIA
      )
        t += VENTANA_ENERGIA_MS;
      p.startMs = t;
    });
  }
};

const salida = {};
const soloVer = process.argv.includes("--ver"); // imprime las palabras con su tiempo para revisar
for (const [clip, db] of Object.entries(CLIPS)) {
  const crudo = JSON.parse(
    fs.readFileSync(`${DATOS}/transcripciones_whisper/${clip}.json`, "utf8"),
  );
  const palabras = aPalabras(crudo.tokens);
  // 1º tiempos con las pausas del audio con ruido: son los segundos que usan TEXTO y FRASES
  tiempos(palabras, pausas(clip, db, false), null);
  for (const [seg, de, a] of TEXTO[clip]) {
    // la más cercana al segundo indicado (el segundo es el inicio que imprime --ver)
    const dist = (w) => Math.abs(w.startMs - seg * 1000);
    const cand = palabras
      .filter(
        (w) => w.text === de && !w.corregido && dist(w) < VENTANA_CORRECCION_MS,
      )
      .sort((x, y) => dist(x) - dist(y));
    if (!cand.length)
      throw new Error(
        `${clip}: no encontré "${de}" cerca de ${seg} s (hay: ${palabras
          .filter((w) => dist(w) < VENTANA_CORRECCION_MS)
          .map((w) => `${w.text}@${w.startMs}`)
          .join(" ")})`,
      );
    if (cand.length > 1 && dist(cand[1]) - dist(cand[0]) < 100)
      throw new Error(`${clip}: "${de}" ambiguo cerca de ${seg} s`);
    cand[0].text = a;
    cand[0].corregido = true;
  }
  const vivas = palabras.filter((w) => w.text !== ""); // sin las borradas (comparten objetos)
  // --ver1: los segundos de la 1ª pasada (los que usan TEXTO y FRASES)
  if (process.argv.includes("--ver1"))
    console.log(
      `\n### ${clip}\n${vivas.map((w) => `${w.text}[${(w.startMs / 1000).toFixed(2)}]`).join(" ")}`,
    );
  for (const [seg, frase] of FRASES[clip] ?? []) {
    const nuevas = frase.split(" ").map((x) => x.replace(/~/g, " "));
    const lejos = (w) => Math.abs(w.startMs - seg * 1000);
    const ini = vivas.reduce(
      (m, w, i) => (lejos(w) < lejos(vivas[m]) ? i : m),
      0,
    );
    if (lejos(vivas[ini]) > 150)
      throw new Error(
        `${clip}: no hay palabra en ${seg} s (hay: ${vivas
          .filter((w) => lejos(w) < VENTANA_CORRECCION_MS)
          .map((w) => `${w.text}@${w.startMs}`)
          .join(" ")})`,
      );
    const viejas = vivas.slice(ini, ini + nuevas.length);
    const norm = (x) =>
      x
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z0-9ñ]/g, "");
    // control: tienen que ser las mismas palabras (salvo puntuación, mayúsculas y las unidas con ~)
    viejas.forEach((w, k) => {
      if (!nuevas[k].includes(" ") && norm(w.text) !== norm(nuevas[k])) {
        throw new Error(
          `${clip} ${seg} s: "${w.text}" no coincide con "${nuevas[k]}"`,
        );
      }
      w.text = nuevas[k];
    });
  }
  // 2º con voz limpia: pausas reales y límites ajustados a los valles de energía
  if (fs.existsSync(LIMPIA(clip)))
    tiempos(palabras, pausas(clip, db, true), energia(clip));
  for (const [seg, texto, ms] of TIEMPOS[clip] ?? []) {
    const k = palabras.findIndex(
      (w) => w.text === texto && Math.abs(w.startMs - seg * 1000) < 60,
    );
    if (k < 0) throw new Error(`${clip}: no encontré "${texto}" en ${seg} s`);
    palabras[k].startMs = ms;
    if (k > 0) palabras[k - 1].endMs = Math.min(palabras[k - 1].endMs, ms);
  }
  for (const [seg, texto, ms] of FINES[clip] ?? []) {
    const k = palabras.findIndex(
      (w) => w.text === texto && Math.abs(w.startMs - seg * 1000) < 60,
    );
    if (k < 0) throw new Error(`${clip}: no encontré "${texto}" en ${seg} s`);
    palabras[k].endMs = ms;
  }
  // inicio de frase = primera palabra de cada segmento de Whisper (casi no pone puntuación; la
  // plantilla usa `frase` para no juntar en un subtítulo el final de una frase con la siguiente)
  for (const seg of crudo.segmentos) {
    const w = palabras.find(
      (x) => Math.abs(x.desdeTokenMs - seg.desdeMs) <= 60,
    );
    if (w) w.frase = true;
  }
  // una corrección "" borra la palabra (p. ej. dos tokens que Whisper separó de más)
  salida[clip] = palabras
    .filter((w) => w.text !== "")
    .map(({ text, startMs, endMs, frase }) => ({
      text,
      startMs,
      endMs,
      ...(frase ? { frase } : {}),
    }));
  if (soloVer) {
    console.log(
      `\n### ${clip}\n${salida[clip].map((w) => `${w.frase ? "|" : ""}${w.text}[${(w.startMs / 1000).toFixed(2)}]`).join(" ")}`,
    );
  }
}
if (!soloVer) {
  fs.writeFileSync(`${DATOS}/transcripcion.json`, JSON.stringify(salida));
  console.log(
    `Guardado ${DATOS}/transcripcion.json (${Object.keys(salida).join(", ")})`,
  );
}
