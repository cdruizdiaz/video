// Tiempos por palabra para los subtítulos resaltados: transcribe cada voz con Whisper y alinea esas palabras con
// el texto del guion (que es el que se muestra: Whisper puede escribir "90" o perder una tilde). Las palabras del
// guion que Whisper no reconoce toman el tiempo repartido entre sus vecinas. Después cada comienzo se pega al cambio
// de boca de Rhubarb más cercano (las mismas bocas que mueve el personaje): el marcador aparece en el cuadro en que
// la boca se mueve para esa palabra. Agrega `palabras` a datos/dialogo.json.
// Uso (desde la raíz): node src/trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/tiempos_palabras.mjs [--rehacer]
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const ID = "2026-10-08_los-amigos-mat_teorema-pitagoras";
const DATOS = `public/trabajos/${ID}/datos`;
const rehacer = process.argv.includes("--rehacer");
const dialogo = JSON.parse(fs.readFileSync(`${DATOS}/dialogo.json`, "utf8"));

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]/g, "");

// Palabras de Whisper: un token que empieza con espacio abre palabra nueva
const palabrasWhisper = (tokens) => {
  const res = [];
  for (const t of tokens) {
    if (/^\[.*\]$/.test(t.text.trim()) || !t.text.trim()) continue;
    if (t.text.startsWith(" ") || !res.length) res.push({ texto: t.text.trim(), desde: t.fromMs, hasta: t.toMs });
    else Object.assign(res[res.length - 1], { texto: res[res.length - 1].texto + t.text, hasta: t.toMs });
  }
  return res.map((w) => ({ ...w, n: norm(w.texto) })).filter((w) => w.n);
};

// Alineación por programación dinámica (como un diff): iguales cuestan 0, distintas 1
const alinear = (a, b) => {
  const n = a.length, m = b.length;
  const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const par = new Array(n).fill(-1);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    if (d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      if (a[i - 1] === b[j - 1] || n === m) par[i - 1] = j - 1; // sustitución solo si las listas tienen el mismo largo
      i--;
      j--;
    } else if (d[i][j] === d[i - 1][j] + 1) i--;
    else j--;
  }
  return par;
};

const IMAN_MS = 120; // distancia máxima para pegar el comienzo de una palabra a un cambio de boca

let total = 0, sueltas = 0, pegadas = 0, corrido = 0;
for (const l of dialogo) {
  const wav = `public/${l.audio}`;
  const json = `${DATOS}/whisper_${l.id}.json`;
  if (rehacer || !fs.existsSync(json)) {
    const r = spawnSync("node", ["scripts/transcribir.mjs", wav, json, "--sin-vad", "--prompt", l.texto], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`Whisper falló en ${l.id}: ${r.stderr}`);
  }
  const w = palabrasWhisper(JSON.parse(fs.readFileSync(json, "utf8")).tokens);
  const guion = l.texto.split(/\s+/).filter(Boolean);
  const par = alinear(guion.map(norm), w.map((x) => x.n));
  const pal = guion.map((texto, i) => (par[i] >= 0 ? { text: texto, fromMs: w[par[i]].desde, toMs: w[par[i]].hasta } : { text: texto, fromMs: NaN, toMs: NaN }));
  // Sin pareja: repartir el hueco entre la anterior y la siguiente que sí tienen tiempo
  for (let i = 0; i < pal.length; i++) {
    if (!Number.isNaN(pal[i].fromMs)) continue;
    let k = i;
    while (k < pal.length && Number.isNaN(pal[k].fromMs)) k++;
    const ini = i > 0 ? pal[i - 1].toMs : 0;
    const fin = k < pal.length ? pal[k].fromMs : l.duracionMs;
    const paso = (fin - ini) / (k - i);
    for (let j = i; j < k; j++) Object.assign(pal[j], { fromMs: Math.round(ini + paso * (j - i)), toMs: Math.round(ini + paso * (j - i + 1)) });
    sueltas += k - i;
    i = k - 1;
  }
  // Imán a las bocas: comienzo de palabra → cambio de boca más cercano (sin pasar a la palabra vecina)
  const cambios = l.bocas.map((b) => Math.round(b.start * 1000));
  pal.forEach((p, i) => {
    const min = i > 0 ? pal[i - 1].fromMs + 30 : 0;
    const max = i + 1 < pal.length ? pal[i + 1].fromMs - 30 : l.duracionMs;
    const c = cambios.filter((x) => x >= min && x <= max).reduce((a, x) => (Math.abs(x - p.fromMs) < Math.abs(a - p.fromMs) ? x : a), Infinity);
    if (Math.abs(c - p.fromMs) <= IMAN_MS) {
      corrido += Math.abs(c - p.fromMs);
      pegadas++;
      p.fromMs = c;
    }
  });
  l.palabras = pal;
  total += pal.length;
}
fs.writeFileSync(`${DATOS}/dialogo.json`, JSON.stringify(dialogo, null, 2));
console.log(`dialogo.json: ${total} palabras con tiempo (${sueltas} repartidas sin pareja en Whisper); ${pegadas} pegadas a un cambio de boca (corrimiento medio ${Math.round(corrido / Math.max(1, pegadas))} ms)`);
