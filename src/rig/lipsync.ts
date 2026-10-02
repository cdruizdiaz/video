// Lip sync automático a partir de la transcripción de Whisper (scripts/transcribir.mjs → transcripcion.json).
// Convierte cada palabra en bocas (visemas) con reglas de letras para español e inglés, las reparte en el tiempo de
// la palabra (las vocales duran más que las consonantes) y cierra la boca en las pausas. Sin herramientas extra.
// Visemas (como Rhubarb / Preston Blair): A = M/B/P (labios cerrados) · B = consonantes, dientes · C = E/I ·
// D = A (bien abierta) · E = O (redonda) · F = U/W (chiquita) · X = reposo (la boca de la expresión).
import type { PoseParcial } from "./pose";

const PAUSA_MS = 110; // silencio entre palabras desde el que se cierra la boca
const MINIMO = 2; // frames mínimos de cada boca (más cortas se funden con la vecina)
const PESO: Record<string, number> = { A: 1.2, B: 0.8, C: 1.6, D: 2, E: 1.8, F: 1.5 }; // duración relativa
export const APERTURA: Record<string, number> = { X: 0, A: 0, B: 0.3, C: 0.55, D: 1, E: 0.75, F: 0.4 };

export type TokenWhisper = { text: string; fromMs: number; toMs: number };
export type Transcripcion = { tokens: TokenWhisper[] };
export type TramoVisema = { desde: number; hasta: number; v: string }; // frames de la composición

// Palabras a partir de los tokens (un token que empieza con espacio abre una palabra; la puntuación la corta)
export const palabras = (tr: Transcripcion) => {
  const salida: { texto: string; desdeMs: number; hastaMs: number }[] = [];
  let actual: { texto: string; desdeMs: number; hastaMs: number } | null = null;
  for (const t of tr.tokens) {
    if (/^\[.*\]$/.test(t.text.trim())) continue; // [_BEG_], [MÚSICA]…
    const limpio = t.text.replace(/[^\p{L}\p{N}' ]/gu, "");
    if (!limpio.trim()) {
      actual = null;
      continue;
    }
    if (t.text.startsWith(" ") || !actual) {
      actual = { texto: limpio.trim(), desdeMs: t.fromMs, hastaMs: t.toMs };
      salida.push(actual);
    } else {
      actual.texto += limpio;
      actual.hastaMs = t.toMs;
    }
  }
  return salida;
};

const sinTildes = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z']/g, "");

const VOCAL_ES: Record<string, string> = { a: "D", e: "C", i: "C", o: "E", u: "F", y: "C" };
const VOCAL_EN: Record<string, string> = { a: "D", e: "C", i: "C", o: "E", u: "D", y: "C" };

// Bocas de una palabra (sin tiempos)
export const bocasDePalabra = (palabra: string, idioma: "es" | "en" = "es"): string[] => {
  let w = sinTildes(palabra).replace(/'/g, "");
  const s: string[] = [];
  const pon = (v: string) => {
    // Consonantes seguidas (B B) se funden en una
    if (v === "B" && s[s.length - 1] === "B") return;
    s.push(v);
  };
  if (idioma === "en") {
    if (w.length > 3 && w.endsWith("e") && !"aeiou".includes(w[w.length - 2])) w = w.slice(0, -1); // e muda
    const dig: [string, string][] = [
      ["oo", "F"], ["ee", "C"], ["ea", "C"], ["ou", "E"], ["ow", "E"], ["oa", "E"], ["ai", "C"], ["ay", "C"], ["ey", "C"],
      ["th", "B"], ["sh", "B"], ["ch", "B"], ["ph", "B"], ["wh", "F"], ["qu", "F"], ["ck", "B"], ["ng", "B"],
    ];
    for (let i = 0; i < w.length; ) {
      const d = dig.find(([k]) => w.startsWith(k, i));
      if (d) {
        pon(d[1]);
        i += 2;
        continue;
      }
      const c = w[i];
      if (VOCAL_EN[c] && !(c === "y" && i === 0)) pon(VOCAL_EN[c]);
      else if ("mbp".includes(c)) pon("A");
      else if (c === "w") pon("F");
      else if (c !== "h") pon("B");
      i++;
    }
  } else {
    for (let i = 0; i < w.length; ) {
      const dos = w.slice(i, i + 2);
      if (["ch", "ll", "rr"].includes(dos)) {
        pon("B");
        i += 2;
        continue;
      }
      if (dos === "qu" || (dos === "gu" && "ei".includes(w[i + 2] ?? ""))) {
        pon("B");
        i += 2; // la u no suena
        continue;
      }
      const c = w[i];
      if (VOCAL_ES[c] && !(c === "y" && i < w.length - 1 && VOCAL_ES[w[i + 1]])) pon(VOCAL_ES[c]);
      else if ("mbpv".includes(c)) pon("A");
      else if (c !== "h") pon("B");
      i++;
    }
  }
  return s.length ? s : ["B"];
};

// Tramos de bocas en frames de la composición. `desde`: frame en que empieza el audio.
export const visemas = (
  tr: Transcripcion,
  o: { fps: number; idioma?: "es" | "en"; desde?: number; adelanto?: number },
): TramoVisema[] => {
  const fps = o.fps;
  const base = o.desde ?? 0;
  const adelanto = o.adelanto ?? 1; // la boca se adelanta un frame al sonido (se ve más natural)
  const aFrame = (ms: number) => base + (ms / 1000) * fps - adelanto;
  const tramos: TramoVisema[] = [];
  const ps = palabras(tr);
  ps.forEach((p, k) => {
    const bocas = bocasDePalabra(p.texto, o.idioma ?? "es");
    const total = bocas.reduce((a, b) => a + (PESO[b] ?? 1), 0);
    const ini = aFrame(p.desdeMs);
    const fin = aFrame(p.hastaMs);
    let t = ini;
    for (const b of bocas) {
      const d = ((fin - ini) * (PESO[b] ?? 1)) / total;
      tramos.push({ desde: t, hasta: t + d, v: b });
      t += d;
    }
    // Pausa larga: la boca vuelve al reposo
    const sig = ps[k + 1];
    if (!sig || sig.desdeMs - p.hastaMs >= PAUSA_MS) tramos.push({ desde: fin, hasta: sig ? aFrame(sig.desdeMs) : fin + fps, v: "X" });
  });
  // Bocas demasiado cortas se funden con la anterior
  const salida: TramoVisema[] = [];
  for (const t of tramos) {
    const ult = salida[salida.length - 1];
    if (ult && (t.hasta - t.desde < MINIMO || ult.v === t.v) && t.v !== "X") {
      ult.hasta = t.hasta;
      if ((APERTURA[t.v] ?? 0) > (APERTURA[ult.v] ?? 0) && t.hasta - t.desde >= 1) ult.v = t.v;
    } else salida.push({ ...t });
  }
  // Una boca corta sin anterior (la primera): se alarga a costa de la siguiente
  for (let i = 0; i < salida.length - 1; i++) {
    const t = salida[i];
    const sig = salida[i + 1];
    if (t.v !== "X" && t.hasta - t.desde < MINIMO && sig.hasta - sig.desde > 2 * MINIMO) {
      t.hasta = t.desde + MINIMO;
      sig.desde = t.hasta;
    }
  }
  return salida;
};

export const visemaEn = (tramos: TramoVisema[], f: number): string | null => {
  const t = tramos.find((x) => f >= x.desde && f < x.hasta);
  return t && t.v !== "X" ? t.v : null;
};

// Pista "hablar": boca + un leve cabeceo que acompaña la apertura
export const hablar = (f: number, tramos: TramoVisema[], o: { intensidad?: number } = {}): PoseParcial => {
  const v = visemaEn(tramos, f);
  if (!v) return { visema: null };
  const a = APERTURA[v] ?? 0;
  const i = o.intensidad ?? 1;
  return { visema: v, huesos: { cabeza: { rot: 1.5 * i * Math.sin(f * 0.35) * a, y: -1.2 * i * a } } };
};
