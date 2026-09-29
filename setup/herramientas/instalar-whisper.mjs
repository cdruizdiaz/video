// Instala whisper.cpp y el modelo en C:\Videos\_herramientas.
// Ejecutar desde la raíz de un proyecto Remotion que tenga @remotion/install-whisper-cpp:
//   node C:/Videos/_herramientas/instalar-whisper.mjs
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { installWhisperCpp } = require("@remotion/install-whisper-cpp");

const RAIZ = "C:/Videos/_herramientas";
const VERSION = "1.9.2";
const MODELO = "large-v3-turbo-q8_0";
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

// Modelo cuantizado q8_0 (~870 MB): mismo texto y tiempos que el f16 y ~25 % más rápido en CPU
// (medido en la i3 el 2026-09-29). @remotion/install-whisper-cpp no lo ofrece: se baja de Hugging Face.
const archivoModelo = path.join(RAIZ, "modelos-whisper", `ggml-${MODELO}.bin`);
if (!fs.existsSync(archivoModelo)) {
  const res = await fetch(`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${MODELO}.bin`);
  if (!res.ok) throw new Error(`No se pudo bajar el modelo ${MODELO} (${res.status})`);
  fs.mkdirSync(path.dirname(archivoModelo), { recursive: true });
  const total = Number(res.headers.get("content-length"));
  const parcial = `${archivoModelo}.parcial`;
  const archivo = fs.createWriteStream(parcial);
  let bajado = 0;
  let ultimo = -10;
  for await (const trozo of res.body) {
    archivo.write(trozo);
    bajado += trozo.length;
    const pct = Math.floor((bajado / total) * 100);
    if (pct >= ultimo + 10) {
      ultimo = pct;
      console.log(`Modelo ${MODELO}: ${pct}%`);
    }
  }
  await new Promise((ok) => archivo.end(ok));
  fs.renameSync(parcial, archivoModelo);
}
console.log(`Modelo ${MODELO} OK`);
