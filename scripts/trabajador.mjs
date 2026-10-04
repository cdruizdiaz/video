// Trabajador de render repartido: toma partes pendientes de una carpeta de cola (ver scripts/render_partes.mjs),
// las renderiza y deja el resultado al lado. Se corre en la otra PC (o en varias) apuntando a la misma carpeta:
//   node scripts/trabajador.mjs --cola \\RYZEN\Videos\cola [--una]
// Toma una tarea renombrando su .json a .json.<pc> (atómico: dos PC no toman la misma). Al terminar escribe
// <parte>.mp4 y <parte>.mp4.ok (con el nombre de la PC). Si el commit del repo no coincide con el de la tarea, la
// devuelve y avisa (renderizaría otra versión). --una: hace una sola tarea y termina; si no, sigue esperando.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Toma la primera tarea libre de una carpeta de partes (o de cualquier subcarpeta de la cola)
export const tomarTarea = (carpeta, pc) => {
  const dirs = fs.readdirSync(carpeta).some((f) => f.endsWith(".json") && f.startsWith("parte_"))
    ? [carpeta]
    : fs.readdirSync(carpeta, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(carpeta, d.name));
  for (const dir of dirs) {
    for (const f of fs.readdirSync(dir).filter((x) => /^parte_\d+\.json$/.test(x)).sort()) {
      const libre = path.join(dir, f);
      const tomada = `${libre}.${pc}`;
      try {
        fs.renameSync(libre, tomada); // atómico: si otra PC la tomó antes, falla
      } catch {
        continue;
      }
      return { ...JSON.parse(fs.readFileSync(tomada, "utf8")), archivo: tomada };
    }
  }
  return null;
};

export const hacerTarea = (t, pc) => {
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: RAIZ, encoding: "utf8" }).trim();
  if (commit !== t.commit) {
    fs.renameSync(t.archivo, t.archivo.replace(/\.json\.[^.\\/]+$/, ".json"));
    throw new Error(`${pc} está en el commit ${commit.slice(0, 8)} y la tarea es del ${t.commit.slice(0, 8)}: hacer git pull antes`);
  }
  const t0 = Date.now();
  const a = ["remotion", "render", "src/index.ts", t.comp, `"${t.salida}"`, `--frames=${t.desde}-${t.hasta}`, "--codec=h264", `--crf=${t.crf}`, "--muted", "--log=error"];
  if (t.gl) a.push(`--gl=${t.gl}`);
  const r = spawnSync("npx", a, { cwd: RAIZ, shell: true, encoding: "utf8" });
  if (r.status !== 0) {
    fs.writeFileSync(t.salida.replace(/\.mp4$/, ".error"), `${pc}: ${(r.stderr || r.stdout).trim().split("\n").slice(-3).join(" ")}`);
    throw new Error(`Falló ${t.nombre} en ${pc}`);
  }
  fs.writeFileSync(`${t.salida}.ok`, `${t.nombre}@${pc} ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  fs.rmSync(t.archivo, { force: true });
  console.log(`  ${t.nombre} (${t.desde}–${t.hasta}) en ${pc}: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
};

// ---------- Como programa ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--cola");
  if (i < 0) {
    console.error("Uso: node scripts/trabajador.mjs --cola <carpeta compartida> [--una]");
    process.exit(1);
  }
  const cola = path.resolve(args[i + 1]);
  const pc = process.env.PC_NOMBRE ?? os.hostname(); // PC_NOMBRE: para distinguir dos trabajadores en la misma PC (pruebas)
  console.log(`Trabajador ${pc} mirando ${cola} (Ctrl+C para terminar)`);
  for (;;) {
    const t = fs.existsSync(cola) ? tomarTarea(cola, pc) : null;
    if (t) {
      hacerTarea(t, pc);
      if (args.includes("--una")) break;
    } else {
      if (args.includes("--una")) break;
      spawnSync(process.platform === "win32" ? "timeout" : "sleep", process.platform === "win32" ? ["/t", "10", "/nobreak"] : ["10"], { stdio: "ignore", shell: true });
    }
  }
}
