// Funciones puras de HablaSubtitulada (testeadas en src/plantillas/__tests__/habla-subtitulada.test.ts).

// Subtítulo en dos renglones: cuántas veces cuenta que el renglón de arriba quede más largo (cortePiramide)
const PIRAMIDE_INVERTIDA = 3;
// …y una palabra sola en un renglón, más corta que esta fracción del otro, queda feo ("La / diferencia es que")
const PALABRA_SUELTA = 0.4;
const COSTO_SUELTA = 1e6;

// ---------- Palabras clave de los subtítulos ----------
// "WhatsApp," -> "whatsapp"; "más" -> "mas" (las claves se escriben sin preocuparse por tildes ni signos)
export const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%]/g, "");

// Marca qué palabras forman parte de alguna clave. Cada clave es una o más palabras seguidas
// ("whatsapp reventado"); se buscan en orden, sin superponerse, en todo el texto.
export const marcarClaves = (
  palabras: string[],
  claves: string[],
): boolean[] => {
  // una "palabra" puede traer espacios ("3 o"): se compara parte por parte
  const norm: string[] = [];
  const de: number[] = []; // de qué palabra viene cada parte
  palabras.forEach((p, i) =>
    p
      .split(/\s+/)
      .map(normalizar)
      .filter(Boolean)
      .forEach((x) => {
        norm.push(x);
        de.push(i);
      }),
  );
  const marca = palabras.map(() => false);
  for (const clave of claves) {
    const partes = clave.split(/\s+/).map(normalizar).filter(Boolean);
    if (!partes.length) continue;
    for (let i = 0; i + partes.length <= norm.length; i++) {
      if (partes.every((p, j) => norm[i + j] === p)) {
        for (let j = 0; j < partes.length; j++) marca[de[i + j]] = true;
        i += partes.length - 1;
      }
    }
  }
  return marca;
};

// ---------- Encuadre 9:16 de un plano horizontal ----------
// puntos: [segundo, cx, cy, alto] de datos/encuadre.json (cx en fracción del ancho del cuadro).
// Devuelve el cx suavizado en `seg`: mediana de los puntos a ±VENTANA s, interpolada entre segundos
// (sigue a la persona si camina, pero no tiembla con los errores sueltos del detector).
const VENTANA_ENCUADRE_S = 2;
const mediana = (xs: number[]) => {
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};
const cxEnSegundo = (puntos: number[][], s: number, porDefecto: number) => {
  const cerca = puntos
    .filter((p) => Math.abs(p[0] - s) <= VENTANA_ENCUADRE_S)
    .map((p) => p[1]);
  return cerca.length ? mediana(cerca) : porDefecto;
};
export const cxSuavizado = (
  puntos: number[][] | undefined,
  seg: number,
  porDefecto = 0.5,
) => {
  if (!puntos || !puntos.length) return porDefecto;
  const a = Math.floor(seg);
  const t = seg - a;
  return (
    cxEnSegundo(puntos, a, porDefecto) * (1 - t) +
    cxEnSegundo(puntos, a + 1, porDefecto) * t
  );
};

// object-position horizontal (0-1) para que un video de proporción `aspecto` (ancho/alto), recortado
// con object-fit: cover en un lienzo de `anchoLienzo`×`altoLienzo`, quede centrado en cx.
export const posicionRecorte = (
  cx: number,
  aspecto: number,
  anchoLienzo = 1080,
  altoLienzo = 1920,
) => {
  const anchoVideo = altoLienzo * aspecto;
  if (anchoVideo <= anchoLienzo) return 0.5;
  const p = (cx * anchoVideo - anchoLienzo / 2) / (anchoVideo - anchoLienzo);
  return Math.min(1, Math.max(0, p));
};

// ---------- Seguimiento de la cara (zoom que acompaña a la persona, como un camarógrafo) ----------
// puntos: [segundo, cx, cy, alto] (fracciones del cuadro), muchos por segundo (p. ej. 10).
// Promedio ponderado (gaussiano) de los puntos cercanos: suave, sin el temblor del detector ni de la mano.
const SIGMA_SEGUIMIENTO_S = 0.6; // 0,4 todavía acompañaba el bamboleo del paso
export const centroSeguido = (
  puntos: number[][] | undefined,
  seg: number,
): [number, number] | null => {
  if (!puntos || !puntos.length) return null;
  let suma = 0;
  let sx = 0;
  let sy = 0;
  for (const p of puntos) {
    const d = (p[0] - seg) / SIGMA_SEGUIMIENTO_S;
    if (Math.abs(d) > 3) continue;
    const w = Math.exp(-d * d);
    suma += w;
    sx += w * p[1];
    sy += w * p[2];
  }
  return suma > 1e-3 ? [sx / suma, sy / suma] : null;
};

// transform-origin (fracciones 0-1) para que, con scale(escala), el punto (cx, cy) del cuadro quede en
// (ox, oy) de la pantalla. Con el origen dentro de [0, 1] el recorte nunca se sale del video:
// si la cara está muy al borde, queda corrida lo justo en vez de mostrar negro.
export const origenSeguimiento = (
  cx: number,
  cy: number,
  escala: number,
  objetivo: [number, number] = [0.5, 0.4],
): [number, number] => {
  if (escala <= 1.0001) return [0.5, 0.5];
  const o = (t: number, f: number) =>
    Math.min(1, Math.max(0, (t - escala * f) / (1 - escala)));
  return [o(objetivo[0], cx), o(objetivo[1], cy)];
};

// ---------- Planos (qué cámara se ve) dentro de una toma ----------
export type Plano = {
  desdeMs: number; // en tiempo de la fuente de audio (el clip de la toma)
  clip?: string; // video que se ve; por defecto el de la toma
  desfaseMs?: number; // segundo (ms) del clip de audio en que empieza `clip`: tiempoClip = tiempoAudio - desfase
  zoom?: number;
  rampaMs?: number; // el zoom llega a `zoom` animado en este tiempo (empuje que llama la atención)
  origen?: string; // punto hacia el que se acerca el zoom ("82% 40%": recorte sobre una persona)
  fijo?: boolean; // sin el acercamiento lento: plano quieto (cortes secos que solo cierran el plano)
  zoomDesde?: number; // con rampaMs: zoom de partida del empuje (suave al entrar y al llegar, como una cámara)
  seguir?: boolean; // el zoom sigue la cara (prop `seguimiento` de la plantilla) en vez de `origen`
  congelarMs?: number; // imagen quieta en este segundo (ms) del clip (la persona sale de cuadro)
};

export type TramoPlano = {
  clip: string;
  desdeMs: number;
  hastaMs: number;
  inicioClipMs: number;
  zoom: number;
  rampaMs?: number;
  origen?: string;
  fijo?: boolean;
  zoomDesde?: number;
  seguir?: boolean;
  congelarMs?: number;
};

// Convierte los planos de una toma [desdeMs, hastaMs] en tramos continuos (sin huecos):
// el primero arranca en desdeMs aunque su plano diga antes; cada uno dura hasta el siguiente.
export const tramosDePlanos = (
  toma: { clip: string; desdeMs: number; hastaMs: number; zoom?: number },
  planos: Plano[] | undefined,
): TramoPlano[] => {
  const lista = (planos?.length ? [...planos] : [{ desdeMs: toma.desdeMs }])
    .sort((a, b) => a.desdeMs - b.desdeMs)
    .filter(
      (p, i, arr) =>
        p.desdeMs < toma.hastaMs &&
        (i + 1 >= arr.length || arr[i + 1].desdeMs > toma.desdeMs),
    );
  return lista.map((p, i) => {
    // el primer plano cubre desde el inicio de la toma (si arranca unos ms después, esos cuadros quedaban vacíos)
    const desde = i === 0 ? toma.desdeMs : Math.max(toma.desdeMs, p.desdeMs);
    const hasta = i + 1 < lista.length ? lista[i + 1].desdeMs : toma.hastaMs;
    return {
      clip: p.clip ?? toma.clip,
      desdeMs: desde,
      hastaMs: hasta,
      inicioClipMs: desde - (p.desfaseMs ?? 0),
      zoom: p.zoom ?? toma.zoom ?? 1,
      ...("rampaMs" in p && p.rampaMs ? { rampaMs: p.rampaMs } : {}),
      ...("origen" in p && p.origen ? { origen: p.origen } : {}),
      ...("fijo" in p && p.fijo ? { fijo: true } : {}),
      ...("zoomDesde" in p && p.zoomDesde ? { zoomDesde: p.zoomDesde } : {}),
      ...("seguir" in p && p.seguir ? { seguir: true } : {}),
      ...("congelarMs" in p && p.congelarMs !== undefined
        ? { congelarMs: p.congelarMs - (p.desfaseMs ?? 0) }
        : {}),
    };
  });
};

// ---------- Grupos de subtítulos ----------
// Parte una frase (lista de palabras) en la menor cantidad de grupos que respeten los máximos,
// con largos parejos: "y eso es una tienda online" -> "y eso es" / "una tienda online"
// (no "y eso es una tienda" / "online"). Devuelve cuántas palabras va en cada grupo.
export const partirFrase = (
  palabras: string[],
  maxPalabras: number,
  maxCaracteres: number,
): number[] => {
  const n = palabras.length;
  if (!n) return [];
  const largo = (a: number, b: number) => palabras.slice(a, b).join(" ").length;
  for (let k = Math.max(Math.ceil(n / maxPalabras), 1); k <= n; k++) {
    // mejor partición en k grupos (n es chico: búsqueda exhaustiva con memoria): minimiza el grupo
    // más largo y, a igualdad, la suma de cuadrados de los largos (grupos parejos, sin palabras sueltas)
    type Parte = { peor: number; cuad: number; cortes: number[] };
    const memo = new Map<string, Parte | null>();
    const mejor = (ini: number, grupos: number): Parte | null => {
      const clave = `${ini},${grupos}`;
      if (memo.has(clave)) return memo.get(clave)!;
      let res: Parte | null = null;
      if (grupos === 1) {
        const l = largo(ini, n);
        res =
          n - ini <= maxPalabras && l <= maxCaracteres
            ? { peor: l, cuad: l * l, cortes: [n - ini] }
            : null;
      } else {
        for (
          let fin = ini + 1;
          fin <= Math.min(n - grupos + 1, ini + maxPalabras);
          fin++
        ) {
          const l = largo(ini, fin);
          if (l > maxCaracteres && fin - ini > 1) break;
          const resto = mejor(fin, grupos - 1);
          if (!resto) continue;
          const peor = Math.max(l, resto.peor);
          const cuad = l * l + resto.cuad;
          if (
            !res ||
            peor < res.peor ||
            (peor === res.peor && cuad < res.cuad)
          ) {
            res = { peor, cuad, cortes: [fin - ini, ...resto.cortes] };
          }
        }
      }
      memo.set(clave, res);
      return res;
    };
    const r = mejor(0, k);
    if (r) return r.cortes;
  }
  return palabras.map(() => 1); // una palabra sola más larga que el máximo: va sola
};

// ---------- Subtítulos escritos a mano ----------
// Cada texto es un subtítulo, en orden, con la puntuación y las mayúsculas con que se ve. Sus palabras
// se emparejan una a una con las dichas (sin importar tildes, signos ni mayúsculas), así conservan los
// tiempos. "-" adelante: esas palabras se dicen pero no llevan subtítulo. Entre asteriscos, en amarillo
// ("*Tienda Nube.*"). Si no coinciden, error con el subtítulo y la palabra esperada.
export type GrupoManual = {
  cantidad: number;
  textos: string[];
  claves: boolean[];
  omitir: boolean;
  unRenglon: boolean; // "=" al principio: siempre en un renglón (sin pirámide), aunque pase el ancho
};

export const gruposManuales = (
  palabras: string[],
  grupos: string[],
): GrupoManual[] => {
  let i = 0;
  const salida = grupos.map((g, n) => {
    const omitir = g.trimStart().startsWith("-");
    const sinMenos = omitir ? g.trimStart().slice(1) : g;
    const unRenglon = sinMenos.trimStart().startsWith("=");
    const cuerpo = unRenglon ? sinMenos.trimStart().slice(1) : sinMenos;
    let abierta = false;
    const textos: string[] = [];
    const claves: boolean[] = [];
    for (const tok of cuerpo.split(/\s+/).filter(Boolean)) {
      const abre = tok.startsWith("*");
      const cierra = tok.replace(/[.,:;!?]+$/, "").endsWith("*");
      textos.push(tok.replace(/\*/g, "").replace(/~/g, " ")); // "3~o": dos palabras que Whisper dio como una
      claves.push(abierta || abre);
      if (abre) abierta = true;
      if (cierra) abierta = false;
    }
    textos.forEach((t, k) => {
      const dicha = palabras[i + k];
      if (dicha === undefined || normalizar(dicha) !== normalizar(t)) {
        throw new Error(
          `Subtítulo ${n + 1} "${g}": "${t}" no coincide con lo dicho ("${dicha ?? "fin"}")`,
        );
      }
    });
    i += textos.length;
    return { cantidad: textos.length, textos, claves, omitir, unRenglon };
  });
  if (i !== palabras.length) {
    throw new Error(
      `Faltan subtítulos para: "${palabras.slice(i, i + 8).join(" ")}…"`,
    );
  }
  return salida;
};

// ---------- Tiempos de salida ----------
// Cuadro del video montado en que suena el segundo `ms` del clip (para colgar gráficos de lo dicho).
// null si ese momento quedó afuera del montaje. Mismo redondeo por toma que la plantilla.
// Cuadros que ocupa una toma en la salida: su voz más la pausa quieta del final (`pausaMs`)
export const framesTomaSalida = (
  t: { desdeMs: number; hastaMs: number; pausaMs?: number },
  velocidad = 1,
  fps = 30,
) =>
  Math.round((((t.hastaMs - t.desdeMs) / 1000) * fps) / velocidad) +
  Math.round(((t.pausaMs ?? 0) / 1000) * fps);

export const frameDeSalida = (
  tomas: { clip: string; desdeMs: number; hastaMs: number; pausaMs?: number }[],
  clip: string,
  ms: number,
  velocidad = 1,
  fps = 30,
): number | null => {
  let acc = 0;
  for (const t of tomas) {
    if (t.clip === clip && ms >= t.desdeMs && ms < t.hastaMs) {
      return acc + Math.round((((ms - t.desdeMs) / 1000) * fps) / velocidad);
    }
    acc += framesTomaSalida(t, velocidad, fps);
  }
  return null;
};

// ---------- Duración mínima de los subtítulos ----------
// Un grupo que dura menos que `minimo` (frames) toma tiempo prestado: entra antes (hasta `maxAdelanto`,
// usando el hueco previo o lo que le sobra al anterior por encima del mínimo) y, si no alcanza, queda
// más (hasta `maxRetraso`, corriendo el inicio del siguiente sin dejarlo por debajo del mínimo).
// Los grupos van en orden y sin superponerse; devuelve copias.
export const alargarCortos = <G extends { desde: number; hasta: number }>(
  grupos: G[],
  minimo: number,
  maxAdelanto: number,
  maxRetraso: number,
  inicio = 0,
): G[] => {
  const g = grupos.map((x) => ({ ...x }));
  const sobra = (x: G) => Math.max(0, x.hasta - x.desde - minimo);
  g.forEach((x, i) => {
    let falta = minimo - (x.hasta - x.desde);
    if (falta <= 0) return;
    const ant = g[i - 1];
    const libreAntes = ant
      ? x.desde - ant.hasta + sobra(ant)
      : x.desde - inicio;
    const a = Math.max(0, Math.min(falta, libreAntes, maxAdelanto));
    x.desde -= a;
    if (ant && ant.hasta > x.desde) ant.hasta = x.desde;
    falta -= a;
    if (falta <= 0) return;
    const sig = g[i + 1];
    const libreDespues = sig ? sig.desde - x.hasta + sobra(sig) : Infinity;
    const r = Math.max(0, Math.min(falta, libreDespues, maxRetraso));
    x.hasta += r;
    if (sig && sig.desde < x.hasta) sig.desde = x.hasta;
  });
  return g;
};

// ---------- Subtítulo en dos renglones ----------
// Si las palabras (anchos en px) no entran en `maxAncho`, devuelve en qué palabra empieza el 2º renglón:
// el más parejo con forma de pirámide (arriba más corto). Si el de arriba queda más largo, esa diferencia
// cuenta PIRAMIDE_INVERTIDA veces: solo pasa cuando la pirámide quedaría muy despareja. 0 = un renglón.
export const cortePiramide = (
  anchos: number[],
  espacio: number,
  maxAncho: number,
): number => {
  const largo = (a: number, b: number) =>
    anchos.slice(a, b).reduce((t, x) => t + x, 0) +
    espacio * Math.max(0, b - a - 1);
  const n = anchos.length;
  if (n < 2 || largo(0, n) <= maxAncho) return 0;
  const cortes = Array.from({ length: n - 1 }, (_, i) => i + 1).map((k) => {
    const arriba = largo(0, k);
    const abajo = largo(k, n);
    const forma =
      abajo >= arriba ? abajo - arriba : PIRAMIDE_INVERTIDA * (arriba - abajo);
    // una palabra corta sola en un renglón: solo si no hay otra forma
    const suelta =
      (k === 1 && anchos[0] < PALABRA_SUELTA * abajo) ||
      (k === n - 1 && anchos[n - 1] < PALABRA_SUELTA * arriba);
    return {
      k,
      entra: arriba <= maxAncho && abajo <= maxAncho,
      costo: forma + (suelta ? COSTO_SUELTA : 0),
    };
  });
  const entran = cortes.filter((c) => c.entra);
  return (entran.length ? entran : cortes).reduce((m, c) =>
    c.costo < m.costo ? c : m,
  ).k;
};
