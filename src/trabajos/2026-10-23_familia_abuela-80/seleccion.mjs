// Selección de tramos (primera propuesta) → public/trabajos/<ID>/datos/candidatos.json
// [clip, desde s, hasta s, bloque, nota]. Orden = numeración de los clips (es el cronológico real).
import fs from "node:fs";
const ID = "2026-10-23_familia_abuela-80";
import { execFileSync } from "node:child_process";
const FFPROBE = "C:/Videos/_herramientas/ffmpeg/bin/ffprobe.exe";
const durMs = (clip) => Math.floor(1000 * +execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `public/trabajos/${ID}/crudos/${clip}.mp4`]).toString());
const T = [
  // Víspera
  ["00387", 58, 104, "Víspera", "Rastro Internacional, private equity, Shark Tank"],
  ["00388", 20, 58, "Víspera", "Beltrán, el algoritmo de gatitos, pedirle Aitana a la Alexa"],
  ["00390", 80, 126, "Víspera", "Entrevista a la abuela: interrumpiste el momento sentimental"],
  ["00390", 219, 264, "Víspera", "Anda un poco renga → homenaje de la Renga"],
  ["00391", 0, 45, "Víspera", "El cura, ¿apto para todo público?, que no sigan pecando"],
  // Mañana del vlog
  ["00392", 0, 58, "Mañana", "Buen día vlog, primas haters, el desayuno, Emilia del futuro"],
  ["00392", 83, 116, "Mañana", "Estresada: la tablet, el top negro, el busito"],
  ["00392", 141, 154, "Mañana", "La carta para la abuela"],
  ["00393", 0, 14, "Mañana", "¿Por qué la recibe Emilia?"],
  ["00395", 0, 11, "Mañana", "¿Dónde está la gente fiestera?"],
  ["00395", 36, 56, "Mañana", "Hola cumple; cualquier tema es polémico"],
  ["00396", 0, 27, "Mañana", "Las empanadas; ¡robá cámara!"],
  ["00397", 52, 79, "Mañana", "Ya está la previa, la Luli baila"],
  // Básquet de Amparo
  ["00398", 0, 32, "Básquet", "Escapada a ver a Amparo; perdón Emilia del futuro"],
  ["00399", 0, 21, "Básquet", "¿Dónde está Amparo?"],
  ["00400", 0, 18, "Básquet", "¡Dale Amparo!"],
  ["00403", 0, 24, "Básquet", "Tanteador, la media roja Nike"],
  ["00408", 0, 17, "Básquet", "Preguntas de reglamento"],
  ["00409", 11, 19, "Básquet", "¡Vale, triple!"],
  // Preparativos
  ["00414", 0, 20, "Preparativos", "Sector maquillaje"],
  ["00415", 0, 28, "Preparativos", "Maquillaje artístico; el olor del tío Javi"],
  ["00416", 0, 37, "Preparativos", "Rodeada de tomates; el sahumerio"],
  ["00417", 0, 30, "Preparativos", "Ya ensayamos la canción"],
  ["00418", 0, 23, "Preparativos", "¿Dónde está la reina? Buddy nunca haría esto"],
  ["00419", 0, 20, "Preparativos", "Diosa, única, bonita"],
  ["00420", 0, 7, "Preparativos", "Gracias Mila, qué haríamos sin vos"],
  // La abuela encerrada y la recorrida
  ["00421", 0, 34, "Llegada", "Abuela, ¿te tienen encerrada? En la gatera"],
  ["00421", 50, 65, "Llegada", "El cura me vio robarme un sándwich"],
  ["00422", 7, 58, "Llegada", "Bienvenidos al cumple: sector DJ, mesa de las nietas, tías"],
  ["00422", 78, 100, "Llegada", "Los abuelos, centro de mesa, sector dulce, la torta de los 80"],
  ["00422", 159, 176, "Llegada", "Pablo: un video para ver en 30 años; ese outfit"],
  ["00424", 30, 54, "Llegada", "¿Dónde está el tío Javi?"],
  ["00426", 0, 26, "Llegada", "La abuela encerrada en el auto hace más de una hora"],
  // Comida
  ["00429", 0, 38, "Comida", "Declaraciones de la comida: tenderism"],
  ["00430", 0, 52, "Comida", "¿Cómo estuvo la comida? Dos pollos, el hielo y el gas"],
  ["00431", 0, 46, "Comida", "Pa, ¿cocinaste vos? Cuando querés, podés"],
  ["00432", 0, 17, "Comida", "¿Aprobamos la comida?"],
  // Canción y torta
  ["00439", 0, 21, "Canción", "La entrega de la canción: no se lee hasta que arranquemos"],
  ["00439", 45, 57, "Canción", "Una canción creada para vos; música maestro"],
  ["00439", 124, 236, "Canción", "La canción de los nietos: ochenta años, historias por contar"],
  ["00439", 269, 296, "Canción", "Final de la canción"],
  ["00440", 0, 26, "Canción", "La abuela: muchas gracias por este espectáculo"],
  ["00441", 8, 32, "Torta", "Guitarra y canto para la abuela"],
  ["00441", 462, 584, "Torta", "La abuela canta, la torta con las velas de 80, abrazos"],
  ["00443", 0, 29, "Show", "Canción: tú, la que es tranquila"],
  ["00448", 0, 15, "Show", "¿Qué es eso? Una concha. ¡Quedó grabado!"],
  ["00449", 8, 68, "Show", "El show de las monjas"],
  ["00451", 41, 62, "Show", "Al gran pueblo argentino, ¡salud!"],
  // Premios de la familia
  ["00452", 0, 16, "Premios", "Presentación de las categorías"],
  ["00454", 0, 26, "Premios", "Cómo conoció al abuelo"],
  ["00455", 0, 33, "Premios", "Anécdotas: el carrito de las mellis, el fuego al tío Javi, 4 horas caminando"],
  ["00456", 0, 30, "Premios", "La impuntual: Amalia"],
  ["00458", 0, 11, "Premios", "Me llamaron para el premio y yo estaba en el baño"],
  ["00458", 103, 138, "Premios", "Claudio Ruiz Díaz con su hijo Walter"],
  ["00459", 19, 82, "Premios", "La próxima millonaria: Serena (aguanta Rastro)"],
  ["00460", 12, 36, "Premios", "La pelada con luz propia: Claudio"],
  ["00461", 0, 34, "Premios", "Con la tía Vero no hay negociación"],
  ["00462", 0, 48, "Premios", "La ganadora fue Lucía"],
  ["00463", 0, 39, "Premios", "Novela turca: Milagros"],
  ["00464", 0, 36, "Premios", "Las inseparables"],
  ["00465", 46, 72, "Premios", "El favorito: Ramón"],
  ["00467", 77, 122, "Premios", "Los que siempre quieren tener razón: todos"],
  // Bingo
  ["00469", 0, 26, "Bingo", "¿Tengo línea? ¡Tengo bingo!"],
  ["00471", 0, 28, "Bingo", "Abuela, ¿cuántos terrenos tenés? Javi es una florcita"],
  ["00473", 0, 30, "Bingo", "La reina y las princesas"],
  ["00476", 21, 52, "Bingo", "Aviso parroquial, cartón lleno"],
  // Cierre
  ["00478", 0, 30, "Cierre", "Karaoke"],
  ["00478", 118, 136, "Cierre", "¡Pero estamos divirtiéndonos!"],
  ["00480", 0, 39, "Cierre", "Últimas declaraciones de la abuela"],
];
const tomas = T.map(([clip, d, h, bloque, nota]) => ({ clip, desdeMs: d * 1000, hastaMs: Math.min(h * 1000, durMs(clip) - 100), bloque, nota }));
fs.writeFileSync(`public/trabajos/${ID}/datos/candidatos.json`, JSON.stringify({ tomas }, null, 1));
const por = {};
for (const t of tomas) por[t.bloque] = (por[t.bloque] || 0) + (t.hastaMs - t.desdeMs) / 1000;
const total = Object.values(por).reduce((a, b) => a + b, 0);
for (const [b, s] of Object.entries(por)) console.log(b.padEnd(14), (s / 60).toFixed(1), "min");
console.log("TOTAL", (total / 60).toFixed(1), "min en", tomas.length, "tramos");
