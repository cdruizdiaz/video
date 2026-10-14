// Personaje 3D renderizado en Blender con las poses del rig 2D, listo para Remotion (capa con transparencia).
// 1) poses cuadro a cuadro con el motor del rig (scripts/blender/poses.ts, mismas pistas que el 2D)
// 2) textura animada de la cara (composición CaraTextura del trabajo, si existe: <comp-cara>)
// 3) Blender (Eevee) sobre <personaje>_3d.blend con scripts/blender/render.py → PNG con alfa
// 4) ffmpeg → webm VP9 con alfa en public/trabajos/<ID>/cache3d/, con huella (si no cambió nada, se reusa)
//
// Uso: node scripts/blender/render.mjs <ID> <nombre> <animacion.json> <duración> [--cara <comp-cara>] [--rotY 0.4]
//        [--luz 135] [--estilo toon] [--ancho 1080 --alto 1920] [--muestras 16] [--forzar]
//        [--solo 30,54,66] [--png carpeta]   (solo esos cuadros para revisar; sin capa ni caché; ver abajo)
//   animacion.json: PersonajeRigProps (personaje, x, y, escala, pistas…) dentro del trabajo.
// Salida: public/trabajos/<ID>/cache3d/<nombre>_<huella>.webm y la entrada <nombre> en datos/cache3d.json
// --solo 12,40,70  renderiza solo esos cuadros (para revisar antes del render completo): PNG con alfa en
//   out/<ID>/revision/solo_<nombre>/ y la hoja out/<ID>/revision/solo_<nombre>.png (sobre gris, con el número de cuadro);
//   con --png carpeta, además una copia de cada cuadro como <nombre>_fNNNN.png
// Antes, una vez por personaje: blender -b -P scripts/blender/personaje_desde_rig.py -- <personaje>
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const herr = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));
const args = process.argv.slice(2);
const opc = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const [id, nombre, animacion, duracion] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && args[i - 1] !== "--forzar"));
if (!id || !nombre || !animacion || !duracion) {
  console.error("Uso: node scripts/blender/render.mjs <ID> <nombre> <animacion.json> <duración> [--cara comp] [--rotY r] [--luz grados] [--estilo toon]");
  process.exit(1);
}
const correr = (exe, a, o = {}) => {
  const r = spawnSync(exe, a, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, cwd: RAIZ, ...o });
  if (r.status !== 0) throw new Error(`${path.basename(exe)}: ${(r.stderr || r.stdout || r.error?.message || "").trim().split("\n").slice(-6).join("\n")}`);
  return `${r.stdout}${r.stderr}`;
};
const props = JSON.parse(fs.readFileSync(animacion, "utf8"));
const blend = path.join(herr.carpetaPersonajes, props.personaje, `${props.personaje}_3d.blend`);
if (!fs.existsSync(blend)) {
  console.error(`Falta ${blend}: blender -b -P scripts/blender/personaje_desde_rig.py -- ${props.personaje}`);
  process.exit(1);
}
const escena = {
  ancho: Number(opc("ancho", 1080)),
  alto: Number(opc("alto", 1920)),
  rotY: Number(opc("rotY", 0)),
  luz: { angulo: Number(opc("luz", 135)), altura: 45, intensidad: 3.0 },
  estilo: opc("estilo", "suave"),
  muestras: Number(opc("muestras", 16)),
};
const comp_cara = opc("cara");
// --extra escena.json: se suma a la escena (tarjetas/accesorios, rotY por cuadro, luz…)
// --cara-png carpeta: la cara ya armada como secuencia PNG (en vez de renderizar una composición CaraTextura)
const extra = opc("extra") ? JSON.parse(fs.readFileSync(opc("extra"), "utf8")) : {};
Object.assign(escena, extra);
const caraPng = opc("cara-png");
const solo = opc("solo") ? String(opc("solo")).split(",").map(Number) : null;

// ---------- Huella: animación + escena + modelo + scripts + código del rig ----------
const h = crypto.createHash("sha256");
h.update(JSON.stringify({ props, duracion, escena, comp_cara, caraPng }));
for (const t of escena.tarjetas ?? []) h.update(fs.readFileSync(t.imagen));
if (caraPng) for (const f of fs.readdirSync(caraPng).sort()) h.update(fs.readFileSync(path.join(caraPng, f)));
h.update(fs.readFileSync(blend));
for (const f of ["scripts/blender/render.py", "scripts/blender/poses.ts", "src/rig/pose.ts", "src/rig/animaciones.ts", "src/rig/secuencia.ts", "src/rig/Rig.tsx", "src/rig/CaraTextura.tsx", "src/plantillas/PersonajeRig/calculos.ts"])
  h.update(fs.readFileSync(path.join(RAIZ, f)));
const huella = h.digest("hex").slice(0, 12);
const carpeta = path.join(RAIZ, "public/trabajos", id, "cache3d");
const webm = path.join(carpeta, `${nombre}_${huella}.webm`);
const relativo = path.relative(path.join(RAIZ, "public"), webm).replaceAll("\\", "/");
const indice = path.join(RAIZ, "public/trabajos", id, "datos/cache3d.json");
const guardar = () => {
  const d = fs.existsSync(indice) ? JSON.parse(fs.readFileSync(indice, "utf8")) : {};
  d[nombre] = relativo;
  fs.writeFileSync(indice, JSON.stringify(d, null, 2) + "\n");
};
if (fs.existsSync(webm) && !args.includes("--forzar") && !solo) {
  guardar();
  console.log(`OK reusada ${relativo} (huella ${huella})`);
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(RAIZ, "tmp", "blender-"));
const t0 = Date.now();
try {
  // 1) poses
  const poses = path.join(tmp, "poses.json");
  correr("npx", ["vite-node", "scripts/blender/poses.ts", "--", `"${animacion}"`, duracion, `"${poses}"`], { shell: true }); // con shell: rutas entre comillas (espacios)
  // 2) cara
  if (caraPng) escena.cara = path.resolve(caraPng);
  else if (comp_cara) {
    const dir = path.join(tmp, "cara");
    correr("npx", ["remotion", "render", "src/index.ts", comp_cara, `"${dir}"`, "--sequence", "--image-format=png", `--frames=0-${Number(duracion) - 1}`, "--log=error"], { shell: true });
    escena.cara = dir;
  }
  const t1 = Date.now();
  // 3) Blender
  escena.poses = poses;
  const esc = path.join(tmp, "escena.json");
  fs.writeFileSync(esc, JSON.stringify(escena));
  const png = solo ? path.join(RAIZ, "out", id, "revision", `solo_${nombre}`) : path.join(tmp, "png");
  if (solo) {
    fs.rmSync(png, { recursive: true, force: true });
    escena.solo = solo;
    fs.writeFileSync(esc, JSON.stringify(escena));
  }
  correr(herr.blender, ["-b", blend, "--python-exit-code", "1", "-P", "scripts/blender/render.py", "--", esc, png]);
  const t2 = Date.now();
  if (solo) {
    // hoja de contactos: cada cuadro sobre gris, achicado, con su número
    const hoja = path.join(RAIZ, "out", id, "revision", `solo_${nombre}.png`);
    const codigo = `
import sys, cv2, numpy as np
from pathlib import Path
d, sal, cuadros = Path(sys.argv[1]), sys.argv[2], [int(x) for x in sys.argv[3].split(",")]
T, cols = 360, 6
filas = (len(cuadros) + cols - 1) // cols
hoja = np.full((filas * T * 16 // 9, cols * T, 3), 70, np.uint8)
alto = T * 16 // 9
for i, k in enumerate(cuadros):
    im = cv2.imdecode(np.fromfile(str(d / f"f{k + 1:04d}.png"), np.uint8), cv2.IMREAD_UNCHANGED)
    im = cv2.resize(im, (T, alto), interpolation=cv2.INTER_AREA)
    a = im[:, :, 3:4] / 255
    y, x = (i // cols) * alto, (i % cols) * T
    hoja[y:y + alto, x:x + T] = (im[:, :, :3] * a + hoja[y:y + alto, x:x + T] * (1 - a)).astype(np.uint8)
    cv2.putText(hoja, str(k), (x + 8, y + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
cv2.imencode(".png", hoja)[1].tofile(sal)
`;
    correr(herr.python, ["-c", codigo, png, hoja, solo.join(",")]);
    // --png carpeta: además, copia de los cuadros sueltos como <nombre>_fNNNN.png
    if (opc("png")) {
      const dest = path.resolve(opc("png"));
      fs.mkdirSync(dest, { recursive: true });
      for (const f of fs.readdirSync(png)) fs.copyFileSync(path.join(png, f), path.join(dest, `${nombre}_${f}`));
    }
    console.log(`OK ${solo.length} cuadros sueltos → ${path.relative(RAIZ, hoja)} · Blender ${((t2 - t1) / 1000).toFixed(0)} s`);
    fs.rmSync(tmp, { recursive: true, force: true }); // process.exit no pasa por el finally
    process.exit(0);
  }
  // 4) webm con alfa
  fs.mkdirSync(carpeta, { recursive: true });
  for (const viejo of fs.readdirSync(carpeta).filter((f) => f.startsWith(`${nombre}_`))) fs.rmSync(path.join(carpeta, viejo));
  correr(herr.ffmpeg, ["-y", "-v", "error", "-framerate", "30", "-start_number", "1", "-i", path.join(png, "f%04d.png"), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-row-mt", "1", "-auto-alt-ref", "0", webm]);
  guardar();
  const n = Number(duracion);
  console.log(`OK ${relativo} · ${n} cuadros · poses+cara ${((t1 - t0) / 1000).toFixed(0)} s · Blender ${((t2 - t1) / 1000).toFixed(0)} s (${((t2 - t1) / n / 1000).toFixed(2)} s/cuadro) · total ${((Date.now() - t0) / 1000).toFixed(0)} s`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
