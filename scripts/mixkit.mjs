// Integración con Mixkit (Envato): música y efectos de sonido gratuitos.
//
// Licencias: "Mixkit Stock Music Free License" / "Sound Effects Free License".
//   ✅ Uso comercial (redes, YouTube monetizado, anuncios), sin atribución obligatoria.
//   ❌ No se puede revender el tema solo, ni registrarlo/reclamarlo como propio (Content ID).
//
// Términos de Mixkit: PROHÍBEN usar scripts o bots para descargas masivas.
// Por eso este script solo permite: 1 búsqueda (1 página) o 1 descarga por ejecución,
// siempre de un tema elegido explícitamente.
//
// Uso (desde la raíz del proyecto):
//   node scripts/mixkit.mjs buscar <términos>            búsqueda libre de música
//   node scripts/mixkit.mjs buscar mood:<estado>         p. ej. mood:upbeat, mood:relaxing
//   node scripts/mixkit.mjs buscar genero:<genero>       p. ej. genero:corporate, genero:hip-hop
//   node scripts/mixkit.mjs buscar tag:<etiqueta>        p. ej. tag:motivational
//   node scripts/mixkit.mjs buscar --sfx <términos>      efectos de sonido (whoosh, click, pop...)
//   node scripts/mixkit.mjs bajar <id> [--sfx]           descarga UN tema/efecto
//
// Resultados de búsqueda: public/datos/mixkit-busqueda.json (leer este JSON, no el HTML).
// Descargas: public/audio/musica/mixkit/ y public/audio/sfx/mixkit/,
// con registro de licencia en public/audio/LICENCIAS-mixkit.json.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = "https://mixkit.co";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
const RAIZ = process.cwd();
const BUSQUEDA = path.join(RAIZ, "public/datos/mixkit-busqueda.json");
const REGISTRO = path.join(RAIZ, "public/audio/LICENCIAS-mixkit.json");
const LICENCIA = {
  musica: "Mixkit Stock Music Free License — https://mixkit.co/license/#musicFree",
  sfx: "Mixkit Sound Effects Free License — https://mixkit.co/license/#sfxFree",
};

const args = process.argv.slice(2);
const esSfx = args.includes("--sfx");
const [comando, ...resto] = args.filter((a) => a !== "--sfx");
const tipo = esSfx ? "sfx" : "musica";

const slug = (t) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const leerJson = (f, def) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return def;
  }
};

const urlBusqueda = (consulta) => {
  const seccion = esSfx ? "free-sound-effects" : "free-stock-music";
  const [clave, valor] = consulta.includes(":") ? consulta.split(":", 2) : [null, consulta];
  const v = slug(valor);
  if (clave === "mood") return `${BASE}/${seccion}/mood/${v}/`;
  if (clave === "genero") return `${BASE}/${seccion}/${v}/`;
  if (clave === "tag") return `${BASE}/${seccion}/tag/${v}/`;
  return `${BASE}/${seccion}/discover/${v}/`;
};

const texto = (html) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function buscar(consulta) {
  if (!consulta) throw new Error("Falta el término de búsqueda.");
  const url = urlBusqueda(consulta);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Mixkit respondió ${res.status} para ${url}`);
  const html = await res.text();

  // Cada tarjeta empieza con el reproductor de audio; se corta el HTML por tarjeta.
  const partes = html.split('data-controller="audio-player"').slice(1);
  const vistos = new Set();
  const items = [];
  for (const p of partes) {
    const id = p.match(/data-audio-player-item-id-value="(\d+)"/)?.[1];
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    const titulo = texto(p.match(/item-grid-card__title">([\s\S]*?)<\/h2>/)?.[1] ?? "");
    const autor = texto(p.match(/__author">([\s\S]*?)<\/p>/)?.[1] ?? "").replace(/^by /, "");
    const etiquetas = [...p.matchAll(/class="meta-links__link"[^>]*>([^<]+)<\/a>/g)]
      .map((m) => m[1].trim())
      .slice(0, 6);
    const preview = p.match(/data-audio-player-preview-url-value="([^"]+)"/)?.[1];
    items.push({ id, titulo, autor: autor || undefined, etiquetas, preview });
  }

  // En páginas de género/tag/mood hay JSON-LD con la duración de cada tema.
  const duraciones = {};
  for (const m of html.matchAll(/"name":"([^"]+)"[^}]*?"duration":"PT(?:(\d+)M)?(\d+)S"/g)) {
    duraciones[m[1]] = Number(m[2] ?? 0) * 60 + Number(m[3]);
  }
  for (const it of items) if (duraciones[it.titulo]) it.duracionSeg = duraciones[it.titulo];

  fs.mkdirSync(path.dirname(BUSQUEDA), { recursive: true });
  fs.writeFileSync(BUSQUEDA, JSON.stringify({ consulta, tipo, url, fecha: new Date().toISOString(), items }, null, 2));
  console.log(`${items.length} resultados (${tipo}) para "${consulta}" → ${path.relative(RAIZ, BUSQUEDA)}`);
  for (const it of items) {
    const dur = it.duracionSeg ? ` ${Math.floor(it.duracionSeg / 60)}:${String(it.duracionSeg % 60).padStart(2, "0")}` : "";
    console.log(`  ${it.id.padStart(5)}  ${it.titulo}${it.autor ? ` — ${it.autor}` : ""}${dur}  [${it.etiquetas.join(", ")}]`);
  }
}

async function bajar(id) {
  if (!/^\d+$/.test(id ?? "")) throw new Error("Indicá UN id numérico (sale de la búsqueda).");
  if (resto.length > 1) throw new Error("Solo se permite 1 descarga por ejecución (términos de Mixkit).");

  const url = esSfx
    ? `https://assets.mixkit.co/active_storage/sfx/${id}/${id}.wav`
    : `https://assets.mixkit.co/music/${id}/${id}.mp3`;
  const previa = leerJson(BUSQUEDA, { items: [] }).items.find((i) => i.id === id);
  const nombre = `mixkit-${id}${previa?.titulo ? `-${slug(previa.titulo)}` : ""}${esSfx ? ".wav" : ".mp3"}`;
  const carpeta = path.join(RAIZ, esSfx ? "public/audio/sfx/mixkit" : "public/audio/musica/mixkit");
  const destino = path.join(carpeta, nombre);

  if (fs.existsSync(destino)) {
    console.log(`Ya estaba descargado: ${path.relative(RAIZ, destino)}`);
    return;
  }
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (${res.status})`);
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(destino, Buffer.from(await res.arrayBuffer()));

  let duracionSeg;
  const herr = leerJson(path.join(RAIZ, "scripts/herramientas.json"), {});
  try {
    duracionSeg = Number(
      execFileSync(herr.ffprobe ?? "ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", destino])
        .toString()
        .trim(),
    );
  } catch {
    /* ffprobe no disponible: se omite la duración */
  }

  const registro = leerJson(REGISTRO, []);
  registro.push({
    archivo: path.relative(RAIZ, destino).replaceAll("\\", "/"),
    id,
    tipo,
    titulo: previa?.titulo,
    autor: previa?.autor,
    duracionSeg: duracionSeg ? Math.round(duracionSeg * 10) / 10 : undefined,
    fuente: url,
    licencia: LICENCIA[tipo],
    descargado: new Date().toISOString().slice(0, 10),
  });
  fs.writeFileSync(REGISTRO, JSON.stringify(registro, null, 2));
  console.log(`Descargado: ${path.relative(RAIZ, destino)}${duracionSeg ? ` (${duracionSeg.toFixed(1)} s)` : ""}`);
  console.log(`Licencia registrada en ${path.relative(RAIZ, REGISTRO)}`);
}

try {
  if (comando === "buscar") await buscar(resto.join(" "));
  else if (comando === "bajar") await bajar(resto[0]);
  else console.log("Uso: node scripts/mixkit.mjs buscar <términos|mood:x|genero:x|tag:x> [--sfx]  |  bajar <id> [--sfx]");
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
