/* global fetch, URLSearchParams */
// Busca voces en la biblioteca compartida de ElevenLabs (para elegir antes de generar con scripts/voz.mjs --voz eleven:<id>).
// Uso: node scripts/voces_eleven.mjs [--genero female|male] [--edad young|middle_aged] [--acento argentine] [--buscar "texto"]
// Escribe tmp/voces-eleven.json (id, nombre, acento, edad, descripción, muestra) y lista las primeras.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
const opc = (n) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 ? undefined : args[i + 1];
};
const clave =
  process.env.ELEVENLABS_API_KEY ||
  (spawnSync("powershell", ["-NoProfile", "-Command", '[Environment]::GetEnvironmentVariable("ELEVENLABS_API_KEY","User")'], { encoding: "utf8" }).stdout || "").trim();
if (!clave) {
  console.error('Falta ELEVENLABS_API_KEY (setx ELEVENLABS_API_KEY "clave" en una terminal).');
  process.exit(1);
}
const q = new URLSearchParams({ page_size: "30", language: "es" });
if (opc("genero")) q.set("gender", opc("genero"));
if (opc("edad")) q.set("age", opc("edad"));
if (opc("acento")) q.set("accent", opc("acento"));
if (opc("buscar")) q.set("search", opc("buscar"));
const res = await fetch(`https://api.elevenlabs.io/v1/shared-voices?${q}`, { headers: { "xi-api-key": clave } });
if (!res.ok) {
  console.error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const { voices = [] } = await res.json();
const lista = voices.map((v) => ({ id: v.voice_id, nombre: v.name, genero: v.gender, edad: v.age, acento: v.accent, descripcion: (v.description || "").slice(0, 140), usos: v.cloned_by_count, muestra: v.preview_url }));
fs.mkdirSync("tmp", { recursive: true });
fs.writeFileSync("tmp/voces-eleven.json", JSON.stringify(lista, null, 1));
for (const v of lista.slice(0, 15)) console.log(`${v.id}  ${v.nombre} · ${v.genero}/${v.edad} · ${v.acento} · ${v.usos} usos — ${v.descripcion}`);
console.log(`${lista.length} voces → tmp/voces-eleven.json`);
