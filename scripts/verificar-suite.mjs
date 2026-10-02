// Verifica que las herramientas de la suite funcionen de verdad (no solo que existan).
// Correrlo después de instalar, de actualizar algo (pip, winget, whisper) o si un trabajo falla raro.
// Uso (desde la raíz del proyecto): node scripts/verificar-suite.mjs [--rapido]
//   --rapido  omite Whisper (lo más lento) y el chequeo de TypeScript/Remotion.
// Archivos de prueba en tmp/verificacion/ (se reutiliza el audio de voz entre corridas).
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const TMP = path.join(RAIZ, "tmp/verificacion");
const herr = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));
const rapido = process.argv.includes("--rapido");
fs.mkdirSync(TMP, { recursive: true });

const FRASE = "Hola, esto es una prueba de la suite de video. Seguinos para ver cómo.";
const PALABRAS_CLAVE = ["prueba", "suite", "video"];

const resultados = [];
const paso = (nombre, fn) => {
  const t0 = Date.now();
  try {
    const nota = fn() ?? "";
    resultados.push({ nombre, ok: true, nota, seg: (Date.now() - t0) / 1000 });
  } catch (e) {
    resultados.push({ nombre, ok: false, nota: String(e.message ?? e).split("\n")[0], seg: (Date.now() - t0) / 1000 });
  }
};
const correr = (exe, args, opts = {}) => {
  const r = spawnSync(exe, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${path.basename(exe)} salió con ${r.status}: ${(r.stderr || r.stdout).trim().split("\n").at(-1)}`);
  return `${r.stdout}${r.stderr}`;
};
// Loudness integrado (LUFS) de un archivo, con ebur128.
// extra: opciones de entrada (van antes de -i), p. ej. ["-sseof", "-1.8"].
const lufs = (archivo, extra = []) => {
  const log = correr(herr.ffmpeg, ["-hide_banner", "-nostats", ...extra, "-i", archivo, "-af", "ebur128", "-f", "null", "-"]);
  return Number(log.match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).match(/-?[\d.]+/)[0]);
};
const existe = (...rutas) => {
  for (const r of rutas) if (!fs.existsSync(r)) throw new Error(`No existe ${r}`);
};

const equipo = (() => {
  try {
    return JSON.parse(fs.readFileSync(herr.equipo, "utf8"));
  } catch {
    return null;
  }
})();

paso("equipo.json", () => {
  if (!equipo) throw new Error(`Falta ${herr.equipo} (ver README: "PC donde la suite ya estaba instalada")`);
  return `${equipo.cpu} · ${equipo.hilosWhisper} hilos`;
});

paso("ffmpeg (filtros)", () => {
  existe(herr.ffmpeg, herr.ffprobe);
  const filtros = correr(herr.ffmpeg, ["-hide_banner", "-filters"]);
  const faltan = ["ebur128", "loudnorm", "lut3d", "silencedetect", "xfade", "blurdetect"].filter(
    (f) => !new RegExp(`\\s${f}\\s`).test(filtros),
  );
  if (faltan.length) throw new Error(`Faltan filtros: ${faltan.join(", ")} (¿se está usando el ffmpeg de Remotion?)`);
  return correr(herr.ffmpeg, ["-version"]).split("\n")[0].replace("ffmpeg version ", "").split(" ")[0];
});

// Voz de prueba: síntesis de Windows (una sola vez), 16 kHz mono.
const VOZ = path.join(TMP, "voz.wav");
paso("audio de prueba", () => {
  if (fs.existsSync(VOZ)) return "reutilizado";
  const crudo = path.join(TMP, "voz_raw.wav");
  const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer;
    $v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'es-*' } | Select-Object -First 1;
    if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }; $s.SetOutputToWaveFile('${crudo}'); $s.Speak('${FRASE}'); $s.Dispose()`;
  correr("powershell", ["-NoProfile", "-Command", ps]);
  correr(herr.ffmpeg, ["-v", "error", "-y", "-i", crudo, "-af", "apad=pad_dur=1", "-ar", "16000", "-ac", "1", VOZ]);
  fs.rmSync(crudo);
  return "voz sintética de Windows";
});

if (!rapido)
  paso("whisper.cpp", () => {
    const modelo = path.join(herr.carpetaModelosWhisper, `ggml-${herr.modeloWhisper}.bin`);
    existe(herr.whisperExe, modelo);
    const args = ["-m", modelo, "-f", VOZ, "-l", "es", "-t", String(equipo?.hilosWhisper ?? 4), "-ojf", "-of", path.join(TMP, "whisper"), "-np"];
    const t0 = Date.now();
    correr(herr.whisperExe, args);
    const seg = (Date.now() - t0) / 1000;
    const texto = JSON.parse(fs.readFileSync(path.join(TMP, "whisper.json"), "utf8"))
      .transcription.map((s) => s.text).join("").trim();
    const sinTildes = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const faltan = PALABRAS_CLAVE.filter((p) => !sinTildes(texto).includes(p));
    if (faltan.length) throw new Error(`Transcripción incompleta ("${texto}"): faltan ${faltan.join(", ")}`);
    const dur = Number(correr(herr.ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", VOZ]));
    // Con un audio tan corto manda la carga del modelo: no sirve para medir velocidad.
    return `${herr.modeloWhisper} · ${seg.toFixed(0)} s para ${dur.toFixed(0)} s de audio (incluye cargar el modelo) · "${texto}"`;
  });

// DeepFilterNet: voz + ruido rosa; la salida tiene que conservar la voz y bajar el ruido.
paso("DeepFilterNet", () => {
  existe(herr.deepFilter);
  const sucio = path.join(TMP, "sucio.wav");
  correr(herr.ffmpeg, ["-v", "error", "-y", "-i", VOZ, "-f", "lavfi", "-i", "anoisesrc=c=pink:a=0.03:r=16000:d=30",
    "-filter_complex", "[0:a]apad=pad_dur=2[v];[v][1:a]amix=inputs=2:duration=first:normalize=0", "-ar", "48000", sucio]);
  const salida = path.join(TMP, "df");
  fs.rmSync(salida, { recursive: true, force: true });
  correr(herr.deepFilter, [sucio, "-o", salida]);
  const limpio = fs.readdirSync(salida).find((f) => f.endsWith(".wav"));
  if (!limpio) throw new Error("No generó el WAV de salida (¿se rompió PyTorch/torchaudio o falta soundfile?)");
  const archivoLimpio = path.join(salida, limpio);
  const vozAntes = lufs(sucio);
  const vozDespues = lufs(archivoLimpio);
  // Últimos 2 s: solo ruido (la voz terminó).
  const ruidoAntes = lufs(sucio, ["-sseof", "-1.8"]);
  const ruidoDespues = lufs(archivoLimpio, ["-sseof", "-1.8"]);
  if (vozDespues < -50) throw new Error(`La salida quedó en silencio (${vozDespues} LUFS)`);
  if (ruidoAntes - ruidoDespues < 10) throw new Error(`No reduce el ruido: ${ruidoAntes} → ${ruidoDespues} LUFS`);
  return `voz ${vozAntes} → ${vozDespues} LUFS · ruido ${ruidoAntes} → ${ruidoDespues} LUFS`;
});

paso("MediaPipe", () => {
  existe(herr.python, herr.modeloCaras);
  const img = path.join(TMP, "cuadro.png");
  correr(herr.ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=640x360", "-frames:v", "1", img]);
  const py = `import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision
d = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(base_options=BaseOptions(model_asset_path=r"${herr.modeloCaras}")))
print(len(d.detect(mp.Image.create_from_file(r"${img}")).detections), mp.__version__)`;
  const [caras, ver] = correr(herr.python, ["-c", py]).trim().split("\n").at(-1).split(" ");
  return `mediapipe ${ver} · carga y detecta (${caras} caras en la imagen de prueba)`;
});

paso("Mixkit (biblioteca)", () => {
  const r = spawnSync("node", ["scripts/mixkit.mjs", "verificar"], { encoding: "utf8" });
  const ultima = r.stdout.trim().split("\n").at(-1);
  if (r.status !== 0) throw new Error(ultima);
  return ultima;
});

// ---- Rig de personajes (scripts/rig/, src/rig/) ----
paso("Rig: extractor", () => {
  // Bloomie (.ai sin capas): tiene que salir igual que el de la biblioteca (vistas, caras, visemas, escoba)
  const ref = JSON.parse(fs.readFileSync(path.join(RAIZ, "public/personajes/bloomie/piezas.json"), "utf8"));
  existe(ref.fuente);
  const dir = path.join(TMP, "rig");
  correr(herr.python, ["scripts/rig/extraer_rig.py", ref.fuente, "bloomie", "--salida", path.join(dir, "pub"), "--revision", path.join(dir, "rev"), "--sin-copia"]);
  const d = JSON.parse(fs.readFileSync(path.join(dir, "pub/piezas.json"), "utf8"));
  const resumen = (x) => [Object.keys(x.vistas).join("/"), Object.keys(x.rostros).length, Object.keys(x.visemas).length, Object.values(x.vistas).map((v) => v.piezas.length).join("+")].join(" · ");
  if (resumen(d) !== resumen(ref)) throw new Error(`Bloomie cambió: ${resumen(d)} (esperaba ${resumen(ref)})`);
  return `Bloomie: ${resumen(d)} (vistas · caras · visemas · piezas)`;
});
paso("Rig: capas con nombre", () => {
  const out = correr(herr.python, ["scripts/rig/prueba_capas.py"]);
  return `${out.split("\n").filter((l) => l.startsWith("ok")).length} pruebas · .ai sintético con capas`;
});
paso("Rig: lip sync y poses", () => {
  const out = correr("node", ["--experimental-strip-types", "--no-warnings", "scripts/rig/probar_rig.mjs"]);
  return `${out.split("\n").filter((l) => l.startsWith("ok")).length} pruebas`;
});

if (!rapido) {
  paso("Rig: render", () => {
    const png = path.join(TMP, "rig-muestrario.png");
    execFileSync("npx", ["remotion", "still", "src/index.ts", "personaje-bloomie-muestrario", `"${png}"`, "--frame=250", "--scale=0.25", "--log=error"], { shell: true, stdio: "pipe" });
    existe(png);
    return "muestrario de Bloomie (props validadas con zod)";
  });
  paso("Rig: 3D (WebGL)", () => {
    const png = path.join(TMP, "rig-3d.png");
    const t0 = Date.now();
    execFileSync("npx", ["remotion", "still", "src/index.ts", "personaje-bloomie-3d", `"${png}"`, "--frame=20", "--scale=0.25", "--gl=angle", "--log=error"], { shell: true, stdio: "pipe" });
    existe(png);
    return `Bloomie 3D con Three.js (--gl=angle) · ${((Date.now() - t0) / 1000).toFixed(0)} s un cuadro`;
  });
  paso("TypeScript", () => {
    execFileSync("npx", ["tsc", "--noEmit"], { shell: true, stdio: "pipe" });
    return "sin errores";
  });
  paso("Remotion", () => {
    const out = execFileSync("npx", ["remotion", "compositions", "src/index.ts", "--quiet"], { shell: true, encoding: "utf8" });
    return `${out.trim().split(/\s+/).filter(Boolean).length} composiciones`;
  });
}

console.log("\nVerificación de la suite");
for (const r of resultados)
  console.log(`${r.ok ? "✅" : "❌"} ${r.nombre.padEnd(20)} ${r.seg.toFixed(0).padStart(3)} s  ${r.nota}`);
const fallas = resultados.filter((r) => !r.ok).length;
console.log(fallas ? `\n${fallas} con problemas.` : "\nTodo OK.");
process.exit(fallas ? 1 : 0);
