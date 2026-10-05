// /a-premiere: exporta una composición de un trabajo a Premiere como XML de Final Cut 7 (xmeml v4),
// que Premiere importa con Archivo → Importar.
// Uso (desde la raíz del proyecto):
//   node scripts/a-premiere.mjs <ID> [composición] [--version N] [--sin-graficos] [--forzar-graficos] [--forzar]
//     composición        id de la composición (por defecto, la única del trabajo o la primera con `premiere`)
//     --version N        número de versión del nombre (por defecto, la última _vN de out/<ID>/final/)
//     --sin-graficos     no renderiza ni incluye la capa de gráficos (V2)
//     --forzar-graficos  vuelve a renderizar la capa aunque no haya cambiado
//     --forzar           sobrescribe el XML de esa versión si ya existe
// Salida en out/<ID>/premiere/: <salida>_v<N>.xml, graficos_<huella>.mov (se reutiliza entre versiones
// mientras no cambien los gráficos), medios/ (copias de 30 fps constantes de los videos de fps variable)
// y LEEME.txt.
// La línea de tiempo la arma la plantilla (`premiere` en composiciones.ts, ver src/plantillas/comunes/premiere.ts).
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

// Convenciones del XML de Final Cut 7 al importar en Premiere. Si en Premiere el reencuadre queda
// corrido o los keyframes no se mueven, se corrige acá (ver LEEME.txt, "Verificar el reencuadre").
const CENTRO_EN_FRACCION_DEL_CUADRO = true; // center: desplazamiento / ancho (y / alto); false = / (ancho/2)
const KEYFRAMES_DESDE_EL_ORIGEN = true; // <when> contado desde el inicio del archivo; false = desde la entrada del clip

const RAIZ = process.cwd();
const HERR = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));

// ---------- Argumentos ----------
const args = process.argv.slice(2);
const opcion = (n) => args.includes(n);
const valor = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const sueltos = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--version");
const [ID, compPedida] = sueltos;
if (!ID) {
  console.error("Uso: node scripts/a-premiere.mjs <ID> [composición] [--version N] [--sin-graficos] [--forzar-graficos] [--forzar]");
  process.exit(1);
}
const salir = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

// ---------- Composiciones del trabajo (se compilan con esbuild y se ejecutan en Node) ----------
const cargarComposiciones = async () => {
  const entrada = path.join(RAIZ, "src/trabajos", ID, "composiciones.ts");
  if (!fs.existsSync(entrada)) salir(`No existe ${path.relative(RAIZ, entrada)}`);
  const stubFuentes = {
    name: "stub-fuentes",
    setup(b) {
      // las fuentes de Google se cargan en el navegador; acá no hacen falta
      b.onResolve({ filter: /^@remotion\/google-fonts(\/|$)/ }, (a) => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
        contents:
          'const f={fontFamily:"stub",fonts:{},unicodeRanges:{},waitUntilDone:()=>Promise.resolve()};' +
          "export const loadFont=()=>f;export const getInfo=()=>({});export const fontFamily='stub';",
        loader: "js",
      }));
    },
  };
  const r = await esbuild.build({
    entryPoints: [entrada],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    jsx: "automatic",
    logLevel: "silent",
    loader: { ".css": "empty", ".png": "empty", ".jpg": "empty", ".svg": "empty", ".woff2": "empty" },
    plugins: [stubFuentes],
  });
  const tmp = path.join(os.tmpdir(), `a-premiere-${process.pid}.mjs`);
  fs.writeFileSync(tmp, r.outputFiles[0].text);
  try {
    return (await import(pathToFileURL(tmp).href)).composiciones;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
};

// ---------- Medios ----------
const ffprobe = (archivo) => {
  const r = spawnSync(
    HERR.ffprobe,
    ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels:stream_side_data=rotation:format=duration", "-of", "json", archivo],
    { encoding: "utf8" },
  );
  if (r.status !== 0) salir(`ffprobe falló con ${archivo}: ${r.stderr}`);
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  const fr = (s) => (s ? s.split("/").reduce((x, y) => Number(x) / Number(y)) : 0);
  const giro = Math.abs(Number(v?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0)) % 180 === 90;
  return {
    duracion: Number(j.format.duration),
    video: v ? { ancho: giro ? v.height : v.width, alto: giro ? v.width : v.height, fps: fr(v.r_frame_rate), fpsMedio: fr(v.avg_frame_rate) } : null,
    audio: a ? { muestreo: Number(a.sample_rate), canales: a.channels } : null,
  };
};

const dirSalida = path.join(RAIZ, "out", ID, "premiere");

// Archivo real para Premiere: el ORIGINAL de <carpetaCrudos>/<ID>/ si tiene el mismo nombre y fps constante
// igual al de la secuencia; si no, el proxy de public/ (copiado a medios/ para que no dependa de public/).
const cacheMedios = new Map();
const resolverMedio = (archivoPublic, fps) => {
  if (cacheMedios.has(archivoPublic)) return cacheMedios.get(archivoPublic);
  const proxy = path.join(RAIZ, "public", archivoPublic);
  if (!fs.existsSync(proxy)) salir(`No existe public/${archivoPublic}`);
  const nombre = path.basename(archivoPublic);
  const deTrabajo = archivoPublic.startsWith(`trabajos/${ID}/`);
  let ruta = proxy;
  let origen = "public";
  if (deTrabajo && archivoPublic.includes("/crudos/")) {
    const original = path.join(HERR.carpetaCrudos, ID, nombre);
    const p = fs.existsSync(original) ? ffprobe(original) : null;
    if (p?.video && Math.abs(p.video.fps - fps) < 0.01 && Math.abs(p.video.fpsMedio - fps) < 0.05) {
      ruta = original;
      origen = "original";
    } else {
      fs.mkdirSync(path.join(dirSalida, "medios"), { recursive: true });
      const copia = path.join(dirSalida, "medios", nombre);
      if (!fs.existsSync(copia) || fs.statSync(copia).size !== fs.statSync(proxy).size) fs.copyFileSync(proxy, copia);
      ruta = copia;
      origen = p ? "proxy (el original tiene fps variable u otro fps)" : "proxy (sin original con el mismo nombre)";
    }
  }
  const m = { ruta, origen, ...ffprobe(ruta) };
  cacheMedios.set(archivoPublic, m);
  return m;
};

// ---------- Capa de gráficos ----------
const huellaPlantillas = () => {
  const h = crypto.createHash("sha256");
  const recorrer = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) recorrer(p);
      else {
        h.update(path.relative(RAIZ, p));
        h.update(fs.readFileSync(p));
      }
    }
  };
  recorrer(path.join(RAIZ, "src/plantillas"));
  return h.digest("hex");
};

const renderizarGraficos = (comp, linea) => {
  const huella = crypto
    .createHash("sha256")
    .update(JSON.stringify({ comp: comp.id, graficos: linea.graficos, duracion: linea.duracion, ancho: linea.ancho, alto: linea.alto }))
    .update(huellaPlantillas())
    .digest("hex")
    .slice(0, 10);
  const archivo = path.join(dirSalida, `graficos_${huella}.mov`);
  if (fs.existsSync(archivo) && !opcion("--forzar-graficos")) {
    console.log(`• Capa de gráficos sin cambios: reutilizo ${path.basename(archivo)}`);
    return archivo;
  }
  console.log(`• Renderizando la capa de gráficos (ProRes 4444 con transparencia) → ${path.basename(archivo)}`);
  const props = path.join(os.tmpdir(), `a-premiere-props-${process.pid}.json`);
  fs.writeFileSync(props, JSON.stringify({ ...comp.defaultProps, soloGraficos: true }));
  const cli = path.join(RAIZ, "node_modules/@remotion/cli/remotion-cli.js");
  const r = spawnSync(
    process.execPath,
    [cli, "render", "src/index.ts", comp.id, archivo, "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--muted", `--props=${props}`],
    { stdio: "inherit", cwd: RAIZ },
  );
  fs.rmSync(props, { force: true });
  if (r.status !== 0) salir("Falló el render de la capa de gráficos");
  return archivo;
};

// ---------- XML ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (x) => Number(x.toFixed(6)).toString();
const urlArchivo = (ruta) =>
  "file://localhost/" +
  path
    .resolve(ruta)
    .replace(/\\/g, "/")
    .split("/")
    .map((seg, i) => (i === 0 && /^[A-Za-z]:$/.test(seg) ? `${seg[0]}%3a` : encodeURIComponent(seg)))
    .join("/");

const generarXml = (linea, nombreSecuencia, graficos) => {
  const { fps, ancho, alto } = linea;
  const rate = `<rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>`;
  const archivos = new Map(); // ruta → { id, definido }
  let nClip = 0;

  const refArchivo = (m) => {
    let a = archivos.get(m.ruta);
    if (!a) {
      a = { id: `file-${archivos.size + 1}`, definido: false };
      archivos.set(m.ruta, a);
    }
    if (a.definido) return `<file id="${a.id}"/>`;
    a.definido = true;
    const v = m.video
      ? `<video><samplecharacteristics>${rate}<width>${m.video.ancho}</width><height>${m.video.alto}</height><anamorphic>FALSE</anamorphic><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics></video>`
      : "";
    const au = m.audio
      ? `<audio><samplecharacteristics><depth>16</depth><samplerate>${m.audio.muestreo}</samplerate></samplecharacteristics><channelcount>${m.audio.canales}</channelcount></audio>`
      : "";
    return `<file id="${a.id}"><name>${esc(path.basename(m.ruta))}</name><pathurl>${esc(urlArchivo(m.ruta))}</pathurl>${rate}<duration>${Math.round(m.duracion * fps)}</duration><media>${v}${au}</media></file>`;
  };

  const cabeceraClip = (nombre, m, inicio, entrada, dura) =>
    `<clipitem id="clipitem-${++nClip}"><masterclipid>masterclip-${esc(path.basename(m.ruta))}</masterclipid><name>${esc(nombre)}</name><enabled>TRUE</enabled><duration>${Math.round(m.duracion * fps)}</duration>${rate}<start>${inicio}</start><end>${inicio + dura}</end><in>${entrada}</in><out>${entrada + dura}</out>`;

  // Encuadre (modelo de comunes/premiere.ts) → Basic Motion de Premiere: escala en % del tamaño
  // original del archivo y centro como desplazamiento desde el centro del cuadro.
  const movimiento = (c, m) => {
    const { ancho: sw, alto: sh } = m.video;
    const cubre = Math.max(ancho / sw, alto / sh);
    const kfs = c.encuadre?.length ? c.encuadre : [{ frame: 0, zoom: 1, izq: 0, arriba: 0 }];
    const div = CENTRO_EN_FRACCION_DEL_CUADRO ? [ancho, alto] : [ancho / 2, alto / 2];
    const val = kfs.map((k) => {
      const dx = (0.5 - k.izq) * ancho * k.zoom - ancho / 2;
      const dy = (0.5 - k.arriba) * alto * k.zoom - alto / 2;
      return { when: (KEYFRAMES_DESDE_EL_ORIGEN ? c.entrada : 0) + k.frame, escala: cubre * k.zoom * 100, h: dx / div[0], v: dy / div[1] };
    });
    const hayKf = val.length > 1;
    const kfEscala = hayKf ? val.map((k) => `<keyframe><when>${k.when}</when><value>${num(k.escala)}</value></keyframe>`).join("") : "";
    const kfCentro = hayKf ? val.map((k) => `<keyframe><when>${k.when}</when><value><horiz>${num(k.h)}</horiz><vert>${num(k.v)}</vert></value></keyframe>`).join("") : "";
    return (
      `<filter><effect><name>Basic Motion</name><effectid>basic</effectid><effectcategory>motion</effectcategory><effecttype>motion</effecttype><mediatype>video</mediatype>` +
      `<parameter authoringApp="PremierePro"><parameterid>scale</parameterid><name>Scale</name><valuemin>0</valuemin><valuemax>1000</valuemax><value>${num(val[0].escala)}</value>${kfEscala}</parameter>` +
      `<parameter authoringApp="PremierePro"><parameterid>center</parameterid><name>Center</name><value><horiz>${num(val[0].h)}</horiz><vert>${num(val[0].v)}</vert></value>${kfCentro}</parameter>` +
      `</effect></filter>`
    );
  };

  const nivel = (db) =>
    `<filter><effect><name>Audio Levels</name><effectid>audiolevels</effectid><effectcategory>audiolevels</effectcategory><effecttype>audiolevels</effecttype><mediatype>audio</mediatype><parameter authoringApp="PremierePro"><parameterid>level</parameterid><name>Level</name><valuemin>0</valuemin><valuemax>3.98109</valuemax><value>${num(Math.pow(10, db / 20))}</value></parameter></effect></filter>`;

  const transicion = (f) => {
    const [ini, fin, alin] =
      f.tipo === "cruzado" ? [f.frame - f.duracion / 2, f.frame + f.duracion / 2, "center"] : [f.frame - f.duracion, f.frame, "end-black"];
    return {
      t: ini,
      xml: `<transitionitem>${rate}<start>${Math.round(ini)}</start><end>${Math.round(fin)}</end><alignment>${alin}</alignment><effect><name>Cross Fade (0dB)</name><effectid>KGAudioTransCrossFade0dB</effectid><effectcategory>audiotransition</effectcategory><effecttype>transition</effecttype><mediatype>audio</mediatype></effect></transitionitem>`,
    };
  };

  // V1: tomas
  const v1 = linea.video.map((c) => {
    const m = resolverMedio(c.archivo, fps);
    if (!m.video) salir(`${c.archivo} no tiene video`);
    return `${cabeceraClip(c.nombre ?? path.basename(c.archivo), m, c.inicio, c.entrada, c.duracion)}<alphatype>none</alphatype>${refArchivo(m)}${movimiento(c, m)}</clipitem>`;
  });
  const pistasVideo = [`<track>${v1.join("")}<enabled>TRUE</enabled><locked>FALSE</locked></track>`];

  // V2: capa de gráficos
  if (graficos) {
    const m = { ruta: graficos, ...ffprobe(graficos) };
    pistasVideo.push(
      `<track>${cabeceraClip("Gráficos (Remotion)", m, 0, 0, linea.duracion)}<alphatype>straight</alphatype>${refArchivo(m)}</clipitem><enabled>TRUE</enabled><locked>FALSE</locked></track>`,
    );
  }

  // Audio: una pista por número, con clips y fundidos en orden de tiempo
  const pistasAudio = [];
  const nPistas = Math.max(0, ...linea.audio.map((c) => c.pista));
  for (let p = 1; p <= nPistas; p++) {
    const items = [
      ...linea.audio
        .filter((c) => c.pista === p)
        .map((c) => {
          const m = resolverMedio(c.archivo, fps);
          if (!m.audio) salir(`${c.archivo} no tiene audio`);
          const dura = Math.min(c.duracion, Math.floor(m.duracion * fps) - c.entrada);
          return {
            t: c.inicio,
            xml: `${cabeceraClip(path.basename(c.archivo, path.extname(c.archivo)), m, c.inicio, c.entrada, dura)}${refArchivo(m)}<sourcetrack><mediatype>audio</mediatype><trackindex>1</trackindex></sourcetrack>${nivel(c.gananciaDb ?? 0)}</clipitem>`,
          };
        }),
      ...linea.fundidos.filter((f) => f.pista === p).map(transicion),
    ].sort((a, b) => a.t - b.t);
    pistasAudio.push(`<track>${items.map((i) => i.xml).join("")}<enabled>TRUE</enabled><locked>FALSE</locked></track>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
<sequence id="sequence-1">
<name>${esc(nombreSecuencia)}</name>
<duration>${linea.duracion}</duration>
${rate}
<timecode>${rate}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>
<media>
<video>
<format><samplecharacteristics>${rate}<width>${ancho}</width><height>${alto}</height><anamorphic>FALSE</anamorphic><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics></format>
${pistasVideo.join("\n")}
</video>
<audio>
<numOutputChannels>2</numOutputChannels>
<format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>
${pistasAudio.join("\n")}
</audio>
</media>
</sequence>
</xmeml>
`;
};

const LEEME = `Importar en Premiere
====================
1. Premiere → Archivo → Importar… → elegir el .xml de la versión (p. ej. reel-40s_9x16_v4.xml).
   Aparece una carpeta con la secuencia y los medios. Abrir la secuencia.
2. Pistas:
   V1  tomas, con el reencuadre como keyframes de Movimiento (Escala y Posición) → se pueden retocar.
   V2  capa de gráficos de Remotion (títulos, notas, destellos, cierre) con transparencia.
       Para cambiar un texto: pedirlo en Claude Code (/a-premiere vuelve a generar la capa) o apagar V2
       y poner títulos propios.
   A1  audio original de cada toma, con su nivel y fundidos cruzados.
   A2  efectos (whoosh).
3. Medios: los videos apuntan a los ORIGINALES de C:/Videos/crudos/<ID>/. Los que tienen fps variable
   (p. ej. los de WhatsApp) apuntan a la copia de 30 fps constantes de medios/ (Premiere se desincroniza
   con fps variable). Si se mueven carpetas: clic derecho en el medio → Vincular medios.

Verificar el reencuadre (primera vez)
-------------------------------------
Comparar un frame de la secuencia con el mismo frame del mp4 de out/<ID>/final/. Si las tomas quedan
corridas o con otro zoom, o los keyframes no se mueven, avisar en Claude Code: se ajusta con las dos
constantes del principio de scripts/a-premiere.mjs y se vuelve a exportar.
`;

// ---------- Principal ----------
const composiciones = await cargarComposiciones();
const conPremiere = composiciones.filter((c) => c.premiere);
const comp = compPedida ? composiciones.find((c) => c.id === compPedida) : conPremiere[0];
if (!comp) salir(compPedida ? `No hay composición "${compPedida}" en ${ID}` : `Ninguna composición de ${ID} tiene exportación a Premiere`);
if (!comp.premiere) salir(`La plantilla de "${comp.id}" todavía no sabe exportarse a Premiere (falta \`premiere\` en composiciones.ts)`);

let version = valor("--version");
if (!version) {
  const dirFinal = path.join(RAIZ, "out", ID, "final");
  const vs = fs.existsSync(dirFinal)
    ? fs
        .readdirSync(dirFinal)
        .map((f) => f.match(new RegExp(`^${comp.salida}_v(\\d+)\\.mp4$`))?.[1])
        .filter(Boolean)
        .map(Number)
    : [];
  if (!vs.length) salir(`No hay ${comp.salida}_vN.mp4 en out/${ID}/final/: indicá la versión con --version N`);
  version = Math.max(...vs);
}
const nombre = `${comp.salida}_v${version}`;
const xmlSalida = path.join(dirSalida, `${nombre}.xml`);
if (fs.existsSync(xmlSalida) && !opcion("--forzar")) salir(`Ya existe ${path.relative(RAIZ, xmlSalida)} (usar --forzar para rehacerlo)`);

fs.mkdirSync(dirSalida, { recursive: true });
const linea = comp.premiere(comp.defaultProps);
console.log(`• ${comp.id} → ${nombre}: ${linea.video.length} tomas, ${(linea.duracion / linea.fps).toFixed(2)} s`);
const graficos = linea.graficos !== undefined && !opcion("--sin-graficos") ? renderizarGraficos(comp, linea) : null;
fs.writeFileSync(xmlSalida, generarXml(linea, nombre, graficos));
fs.writeFileSync(path.join(dirSalida, "LEEME.txt"), LEEME);

console.log(`✔ ${path.relative(RAIZ, xmlSalida)}`);
for (const [a, m] of cacheMedios) console.log(`   ${path.basename(a).padEnd(40)} ← ${m.origen}`);
if (graficos) console.log(`   capa de gráficos: ${path.basename(graficos)}`);
