// Pruebas automáticas del sistema de rig (sin render): reglas de lip sync en español e inglés, tiempos de los
// visemas contra una transcripción real, poses de secuencia y combinación de capas.
// Uso: node --experimental-strip-types --no-warnings scripts/rig/probar_rig.mjs
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { bocasDePalabra, visemas, palabras } = await import(pathToFileURL(join(RAIZ, "src/rig/lipsync.ts")).href);
const { combinar, poseInicial, movDe } = await import(pathToFileURL(join(RAIZ, "src/rig/pose.ts")).href);

let fallas = 0;
const igual = (nombre, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallas++;
  console.log(`${ok ? "ok  " : "FALLA"} ${nombre}: ${JSON.stringify(real)}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)})`}`);
};

// Reglas de bocas
igual("es «mamá»", bocasDePalabra("mamá", "es"), ["A", "D", "A", "D"]);
igual("es «queso» (u muda)", bocasDePalabra("queso", "es"), ["B", "C", "B", "E"]);
igual("es «hola» (h muda)", bocasDePalabra("hola", "es"), ["E", "B", "D"]);
igual("es «guitarra»", bocasDePalabra("guitarra", "es"), ["B", "C", "B", "D", "B", "D"]);
igual("en «mom»", bocasDePalabra("Mom", "en"), ["A", "E", "A"]);
igual("en «cake» (e muda)", bocasDePalabra("cake", "en"), ["B", "D", "B"]);
igual("en «school» (oo)", bocasDePalabra("school", "en"), ["B", "F", "B"]);
igual("en «the»", bocasDePalabra("the", "en"), ["B", "C"]);

// Tiempos contra la transcripción real de la voz de Bloomie
const tr = JSON.parse(readFileSync(join(RAIZ, "public/trabajos/2026-10-02_claudio_rig-bloomie/datos/voz_bloomie_en.json"), "utf8"));
const ps = palabras(tr);
igual("palabras de la transcripción", ps.slice(0, 4).map((p) => p.texto), ["Bye", "Mom", "Don't", "forget"]);
const tramos = visemas(tr, { fps: 30, idioma: "en" });
const ordenados = tramos.every((t, i) => t.hasta >= t.desde && (i === 0 || t.desde >= tramos[i - 1].desde - 1e-6));
igual("tramos ordenados y sin superposición", ordenados, true);
const cortos = tramos.filter((t) => t.v !== "X" && t.hasta - t.desde < 1.999);
igual("ninguna boca dura menos de 2 frames", cortos.length, 0);
const fin = tramos[tramos.length - 1];
igual("termina en reposo", fin.v, "X");
const dentro = tramos.filter((t) => t.v !== "X").every((t) => t.desde >= -2 && t.hasta <= (tr.duracionMs / 1000) * 30 + 2);
igual("bocas dentro del audio", dentro, true);

// Combinación de capas y comodines
const p = combinar(poseInicial(), { huesos: { "petalo_*": { rot: 10 }, petalo_sup: { rot: 5, sy: 2 } } }, { parpado: 0.3 }, { parpado: 0.1, visema: "D" });
igual("comodín + exacto se suman", movDe(p, "petalo_sup"), { rot: 15, x: 0, y: 0, sx: 1, sy: 2 });
igual("parpadeo toma el máximo", p.parpado, 0.3);
igual("visema: gana la última capa", p.visema, "D");

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas pasaron");
process.exit(fallas ? 1 : 0);
