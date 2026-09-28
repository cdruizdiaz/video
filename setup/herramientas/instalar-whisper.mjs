// Instala whisper.cpp y el modelo en C:\Videos\_herramientas.
// Ejecutar desde la raíz de un proyecto Remotion que tenga @remotion/install-whisper-cpp:
//   node C:/Videos/_herramientas/instalar-whisper.mjs
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));
const {
  installWhisperCpp,
  downloadWhisperModel,
}= require("@remotion/install-whisper-cpp");

const RAIZ = "C:/Videos/_herramientas";
const VERSION = "1.9.2";
const MODELO = "large-v3-turbo";
const destino = path.join(RAIZ, "whisper.cpp");

await installWhisperCpp({ to: destino, version: VERSION, printOutput: false }).catch(
  (e) => {
    // Remotion busca build/bin/whisper-cli.exe (>=1.7.4), pero el zip oficial de Windows
    // trae Release/whisper-cli.exe: se reubica abajo.
    if (!String(e.message).includes("executable")) throw e;
  },
);

const release = path.join(destino, "Release");
const buildBin = path.join(destino, "build", "bin");
if (fs.existsSync(release) && !fs.existsSync(buildBin)) {
  fs.mkdirSync(path.dirname(buildBin), { recursive: true });
  fs.renameSync(release, buildBin);
}

const exe = path.join(buildBin, "whisper-cli.exe");
if (!fs.existsSync(exe)) throw new Error(`No se encontró ${exe}`);
console.log(`whisper.cpp ${VERSION} OK: ${exe}`);

let ultimo = -10;
await downloadWhisperModel({
  model: MODELO,
  folder: path.join(RAIZ, "modelos-whisper"),
  printOutput: false,
  onProgress: (bajado, total) => {
    const pct = Math.floor((bajado / total) * 100);
    if (pct >= ultimo + 10) {
      ultimo = pct;
      console.log(`Modelo ${MODELO}: ${pct}%`);
    }
  },
});
console.log(`Modelo ${MODELO} OK`);
