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

// Cada chequeo es un paso(). Las herramientas opcionales (las del plan de mejoras, que no hacen falta para los
// trabajos de siempre) van con { opcional: true }: si no están instaladas se informan con ⚪ sin dar error.
// Para sumar una herramienta: un paso() más, con requiere() para lo que tiene que existir en disco.
const resultados = [];
class NoInstalado extends Error {}
const requiere = (...rutas) => {
  for (const r of rutas) if (!r || !fs.existsSync(r)) throw new NoInstalado(`no instalado (${r ?? "falta la ruta en herramientas.json"})`);
};
const paso = (nombre, fn, { opcional = false } = {}) => {
  const t0 = Date.now();
  const seg = () => (Date.now() - t0) / 1000;
  try {
    const nota = fn() ?? "";
    resultados.push({ nombre, estado: "ok", nota, seg: seg() });
  } catch (e) {
    const nota = String(e.message ?? e).split("\n")[0];
    resultados.push({ nombre, estado: opcional && e instanceof NoInstalado ? "falta" : "error", nota, seg: seg() });
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

// ---- Herramientas de la fase 1 del plan de mejoras (opcionales) ----
paso("Piper (español)", () => {
  requiere(path.join(herr.carpetaPiper ?? "", `${herr.vozPiperEs}.onnx`));
  const wav = path.join(TMP, "piper_es.wav");
  const out = correr("node", ["scripts/voz.mjs", "Hola, esto es una prueba.", wav, "--sin-tiempos"]);
  return out.trim().split("\n")[0].replace(/^OK .*?\.wav · /, "");
}, { opcional: true });
paso("Rhubarb (lip sync)", () => {
  requiere(herr.rhubarb);
  const json = path.join(TMP, "rhubarb.json");
  correr("node", ["scripts/lipsync_rhubarb.mjs", VOZ, json]);
  const n = JSON.parse(fs.readFileSync(json, "utf8")).mouthCues.length;
  if (n < 10) throw new Error(`Muy pocas bocas (${n})`);
  return `${n} bocas para la voz de prueba`;
}, { opcional: true });
paso("RIFE (interpolación)", () => {
  requiere(herr.rife);
  const d = path.join(TMP, "rife");
  fs.rmSync(d, { recursive: true, force: true });
  fs.mkdirSync(d);
  correr(herr.ffmpeg, ["-v", "error", "-f", "lavfi", "-i", "testsrc2=s=256x144:r=30", "-frames:v", "2", path.join(d, "%d.png")]);
  correr(herr.rife, ["-0", path.join(d, "1.png"), "-1", path.join(d, "2.png"), "-o", path.join(d, "medio.png"), "-m", "rife-v4.6"], { cwd: path.dirname(herr.rife) });
  existe(path.join(d, "medio.png"));
  return "cuadro intermedio con rife-v4.6 (Vulkan)";
}, { opcional: true });
paso("Real-ESRGAN", () => {
  requiere(herr.realesrgan);
  const i = path.join(TMP, "esrgan_in.png");
  const o = path.join(TMP, "esrgan_out.png");
  correr(herr.ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=64x64", "-frames:v", "1", i]);
  correr(herr.realesrgan, ["-i", i, "-o", o, "-n", "realesr-animevideov3-x2", "-s", "2"], { cwd: path.dirname(herr.realesrgan) });
  const dims = correr(herr.ffprobe, ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", o]).trim();
  if (dims !== "128,128") throw new Error(`Salida ${dims}, esperaba 128,128`);
  return "64 → 128 px (realesr-animevideov3-x2)";
}, { opcional: true });
paso("librosa (pulsos)", () => {
  // Clics a 120 bpm durante 12 s: tiene que encontrar ~120 bpm
  const clic = path.join(TMP, "clic120.wav");
  correr(herr.ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "aevalsrc='if(lt(mod(t\\,0.5)\\,0.03)\\,sin(2*PI*1000*t)\\,0)':s=22050:d=12", clic]);
  const json = path.join(TMP, "pulsos.json");
  try {
    correr(herr.python, ["scripts/pulsos.py", clic, json]);
  } catch (e) {
    if (/No module named 'librosa'/.test(e.message)) throw new NoInstalado("no instalado (pip install librosa en el .venv)");
    throw e;
  }
  const { bpm } = JSON.parse(fs.readFileSync(json, "utf8"));
  if (Math.abs(bpm - 120) > 3) throw new Error(`Detectó ${bpm} bpm en un clic de 120`);
  return `${bpm} bpm en un clic de 120`;
}, { opcional: true });

// ---- Fase 2: mocap (MediaPipe Pose + Face Landmarker) ----
paso("Mocap (MediaPipe)", () => {
  const modelos = path.dirname(herr.modeloCaras);
  requiere(path.join(modelos, "pose_landmarker_full.task"), path.join(modelos, "face_landmarker.task"));
  // Sin video de prueba con personas: se usa el proxy del trabajo de prueba si está; si no, solo carga los modelos
  const video = path.join(RAIZ, "public/trabajos/2026-10-04_claudio_prueba-mocap/crudos/guitarra.mp4");
  if (!fs.existsSync(video)) {
    correr(herr.python, ["-c", `from mediapipe.tasks.python import BaseOptions, vision
vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(base_options=BaseOptions(model_asset_path=r"${path.join(modelos, "pose_landmarker_full.task")}")))
vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=r"${path.join(modelos, "face_landmarker.task")}")))`]);
    return "modelos cargan (sin video de prueba)";
  }
  const json = path.join(TMP, "mocap.json");
  const out = correr(herr.python, ["scripts/rig/mocap.py", video, "bloomie", json, "--hasta", "2"]);
  const det = out.match(/cuerpo (\d+)\/(\d+) · cara (\d+)\/\d+/);
  if (!det || Number(det[1]) < Number(det[2]) * 0.9) throw new Error(`Detectó poco cuerpo: ${det?.[0]}`);
  return `${JSON.parse(fs.readFileSync(json, "utf8")).poses.length} poses en 2 s · ${det[0]}`;
}, { opcional: true });

// ---- Fase 3: video real 2,5D (recorte, profundidad, seguimiento) ----
// Imagen de prueba: cuadro sintético con un objeto que se mueve (testsrc2) → video de 1 s
const VIDEO_PRUEBA = path.join(TMP, "movil.mp4");
const videoPrueba = () => {
  if (!fs.existsSync(VIDEO_PRUEBA))
    correr(herr.ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=480x270:r=30:d=1", "-pix_fmt", "yuv420p", VIDEO_PRUEBA]);
  return VIDEO_PRUEBA;
};
paso("Recorte de personas", () => {
  requiere(path.join(path.dirname(herr.modeloCaras), "selfie_multiclass_256x256.tflite"));
  const out = correr(herr.python, ["scripts/mascaras.py", videoPrueba(), path.join(TMP, "persona.webm")]);
  return out.trim().split("\n").at(-1).replace(/^OK .*?\.webm · /, "");
}, { opcional: true });
paso("Profundidad (ONNX)", () => {
  requiere(herr.modeloProfundidad);
  const png = path.join(TMP, "prof.png");
  correr(herr.ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=480x270", "-frames:v", "1", path.join(TMP, "prof_in.png")]);
  const out = correr(herr.python, ["scripts/profundidad.py", path.join(TMP, "prof_in.png"), png]);
  existe(png);
  return `Depth Anything V2 Small · ${out.trim().split("\n").at(-1).split(" · ").at(-1)} una imagen`;
}, { opcional: true });
paso("Seguimiento (OpenCV)", () => {
  const json = path.join(TMP, "seguimiento.json");
  correr(herr.python, ["scripts/seguimiento.py", videoPrueba(), json, "--punto", "240,135"]);
  const d = JSON.parse(fs.readFileSync(json, "utf8"));
  if (d.cuadros < 25) throw new Error(`Solo ${d.cuadros} cuadros`);
  return `${d.cuadros} cuadros seguidos`;
}, { opcional: true });

// ---- Fase 4: logo vectorizado para Logo3D ----
paso("Vectorizar logo", () => {
  const png = path.join(TMP, "logo.png");
  // "A" negra sobre blanco: 1 pieza y 1 agujero
  correr(herr.ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "color=white:s=200x200", "-vf",
    "drawbox=x=40:y=40:w=120:h=120:c=black:t=fill,drawbox=x=80:y=80:w=40:h=40:c=white:t=fill", "-frames:v", "1", png]);
  const out = correr(herr.python, ["scripts/vectorizar_logo.py", png, path.join(TMP, "logo.svg")]);
  if (!/1 piezas, 1 agujeros/.test(out)) throw new Error(out.trim());
  return "cuadrado con agujero → 1 pieza, 1 agujero";
});

// ---- Fase 5: Blender ----
paso("Blender", () => {
  requiere(herr.blender);
  const ver = correr(herr.blender, ["-b", "--factory-startup", "--version"]).split("\n")[0].trim();
  // Render mínimo con Eevee: un cubo de 64 px con fondo transparente
  const png = path.join(TMP, "blender.png");
  const py = `import bpy
sc = bpy.context.scene
motores = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in motores else "BLENDER_EEVEE"
sc.render.resolution_x = sc.render.resolution_y = 64
sc.render.film_transparent = True
sc.render.filepath = r"${png}"
bpy.ops.render.render(write_still=True)`;
  const script = path.join(TMP, "blender_prueba.py");
  fs.writeFileSync(script, py);
  correr(herr.blender, ["-b", "--factory-startup", "--python-exit-code", "1", "-P", script]);
  existe(png);
  const blend = path.join(herr.carpetaPersonajes, "bloomie", "bloomie_3d.blend");
  return `${ver} · Eevee renderiza${fs.existsSync(blend) ? " · Bloomie 3D armado" : ""}`;
}, { opcional: true });

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
paso("Tests (vitest)", () => {
  const out = correr("npx", ["vitest", "run"], { shell: true });
  const m = out.replace(/\x1b\[[0-9;]*m/g, "").match(/Tests\s+(\d+) passed/);
  return `${m ? m[1] : "?"} pruebas (src/**/__tests__)`;
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
const ICONO = { ok: "✅", error: "❌", falta: "⚪" };
for (const r of resultados)
  console.log(`${ICONO[r.estado]} ${r.nombre.padEnd(20)} ${r.seg.toFixed(0).padStart(3)} s  ${r.nota}`);
const fallas = resultados.filter((r) => r.estado === "error").length;
const faltan = resultados.filter((r) => r.estado === "falta").length;
console.log((fallas ? `\n${fallas} con problemas.` : "\nTodo OK.") + (faltan ? ` ${faltan} opcionales sin instalar (⚪).` : ""));
process.exit(fallas ? 1 : 0);
