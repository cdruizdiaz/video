// Estado de los trabajos: lee cada src/trabajos/<ID>/TRABAJO.md y out/<ID>/final/.
// Uso (desde la raíz del proyecto): node scripts/estado.mjs [--todos]
//   Sin --todos muestra solo los trabajos abiertos (no 🟢 Cerrado).
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const TRABAJOS = path.join(RAIZ, "src/trabajos");
const todos = process.argv.includes("--todos");

const campo = (md, nombre) => md.match(new RegExp(`^\\|\\s*${nombre}\\s*\\|\\s*(.*?)\\s*\\|\\s*$`, "m"))?.[1] ?? "—";

// Última entrega anotada en la tabla "Entregas" (primera columna con `archivo`).
const ultimaAnotada = (md) => {
  const seccion = md.split(/^## Entregas\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  const filas = [...seccion.matchAll(/^\|\s*`([^`]+)`\s*\|\s*([^|]*)\|/gm)];
  const f = filas.at(-1);
  return f ? `${f[1]} (${f[2].trim()})` : "—";
};

// Último archivo en out/<ID>/final/ (puede haber uno sin anotar en TRABAJO.md).
const ultimaEnDisco = (id) => {
  const dir = path.join(RAIZ, "out", id, "final");
  if (!fs.existsSync(dir)) return null;
  const archivos = fs
    .readdirSync(dir)
    .filter((f) => /\.(mp4|mov|webm)$/i.test(f))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => a.t - b.t);
  return archivos.at(-1)?.f ?? null;
};

// Pendientes: renglones con ⚠️ (dato a completar o confirmar).
const pendientes = (md) =>
  md
    .split("\n")
    .filter((l) => l.includes("⚠️"))
    .map((l) => l.replace(/^[\s|*-]+/, "").replace(/\*\*/g, "").replace(/\s*\|\s*$/, "").trim())
    .map((l) => (l.length > 110 ? `${l.slice(0, 107)}…` : l));

const ids = fs
  .readdirSync(TRABAJOS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && fs.existsSync(path.join(TRABAJOS, d.name, "TRABAJO.md")))
  .map((d) => d.name)
  .sort();

let mostrados = 0;
for (const id of ids) {
  const md = fs.readFileSync(path.join(TRABAJOS, id, "TRABAJO.md"), "utf8");
  const estado = campo(md, "Estado");
  const cerrado = /cerrado/i.test(estado);
  if (cerrado && !todos) continue;
  mostrados++;

  const anotada = ultimaAnotada(md);
  const disco = ultimaEnDisco(id);
  const guiones = fs.readdirSync(path.join(TRABAJOS, id)).filter((f) => /^guion_.*\.md$/.test(f));
  // Material pesado que quedó en public/ (Remotion lo copia en cada render).
  const pesados = ["crudos", "audio", "img"].flatMap((c) => {
    const dir = path.join(RAIZ, "public/trabajos", id, c);
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f !== ".gitkeep") : [];
  });

  console.log(`\n■ ${id}  ${estado}`);
  console.log(`  Cliente: ${campo(md, "Cliente / marca")} · Pieza: ${campo(md, "Pieza")} · Abierto: ${campo(md, "Abierto")}`);
  console.log(`  Última entrega anotada: ${anotada}`);
  if (disco && !anotada.includes(disco)) console.log(`  ⚠️ En out/${id}/final/ hay una más nueva sin anotar: ${disco}`);
  if (guiones.length) console.log(`  Guiones: ${guiones.join(", ")}`);
  if (cerrado && pesados.length)
    console.log(`  ⚠️ Cerrado pero con ${pesados.length} archivo(s) pesados en public/trabajos/${id}/ (¿falta archivar?)`);
  const p = pendientes(md);
  if (p.length) {
    console.log(`  Pendientes (${p.length}):`);
    for (const l of p) console.log(`    - ${l}`);
  }
}
if (!mostrados) console.log(todos ? "No hay trabajos." : "No hay trabajos abiertos (usá --todos para ver los cerrados).");
