// Plantilla "HablaSubtitulada": video vertical de una persona hablando a cámara.
// Se alimenta con un montaje (tomas = tramos de clips), la transcripción por palabra de cada
// clip, música y un kit de marca. Hace:
//  - cortes directos entre tomas; en los cortes dentro del mismo plano, un zoom distinto
//    disimula el salto; acercamiento lento durante cada plano;
//  - multicámara: dentro de una toma, `planos` cambian la imagen a otra cámara sincronizada
//    (el audio sigue siendo el del clip de la toma, así el cambio no se oye);
//  - planos horizontales recortados a 9:16 siguiendo la cara (`encuadre`, de MediaPipe);
//  - subtítulos por grupos cortos de palabras: estilo "capsula" (palabra dicha resaltada) o
//    "reel" (texto con borde y sombra dura, palabras clave en amarillo);
//  - título de apertura opcional, o rótulo de ubicación (pin + lugar) que entra desde un costado;
//  - zoom animado ("rampa") dentro de un plano para remarcar una frase;
//  - música de fondo opcional bajo la voz, que sube en el cierre;
//  - cierre con logo, frase y sitio de la marca (fondo oscuro o degradé de la marca).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { conAlfa, MARCAS, type Marca } from "../../marcas";
import {
  alargarCortos,
  cortePiramide,
  centroSeguido,
  cxSuavizado,
  framesTomaSalida,
  gruposManuales,
  marcarClaves,
  origenSeguimiento,
  partirFrase,
  posicionRecorte,
  tramosDePlanos,
  type Plano,
  type TramoPlano,
} from "./calculos";

// ---------- Constantes de animación ----------
const FPS = 30;
const ZOOM_LENTO = 0.035; // cuánto se acerca la cámara a lo largo de cada plano
const ORIGEN_ZOOM = "50% 32%"; // punto hacia el que se acerca (cara, tercio superior)
const RAMPA_AUDIO = 2; // frames de fundido de la voz en cada corte (evita clics)
const ASPECTO_HORIZONTAL = 16 / 9; // clips con `encuadre` (horizontales recortados a 9:16)
const COLA_SUBTITULO_MS = 350; // cuánto queda el último grupo tras la última palabra
const ENTRADA_SUB = 5; // frames de entrada de cada grupo
const SUB_MINIMO = 15; // frames: menos no se llega a leer (habla rápida)…
const SUB_ADELANTO = 8; // …entonces entra hasta estos frames antes…
const SUB_RETRASO = 8; // …o queda hasta estos frames más (sin dejar corto a un vecino)
// Subtítulos "capsula"
const MAX_PALABRAS = 3; // palabras por grupo de subtítulo
const MAX_CARACTERES = 18; // largo máximo de un grupo
const SUB_Y = 1290; // centro vertical de los subtítulos (zona segura de Reels/TikTok)
const SUB_TAMANO = 78;
const SUB_FONDO_ALFA = 0.82; // cápsula oscura detrás del texto (se lee sobre cualquier fondo)
const SUB_RELLENO = "16px 30px";
const SUB_RADIO = 26;
// Subtítulos "reel" (medidos en los reels de Volto: ~75 % de la altura, 1-2 renglones cortos)
const REEL_MAX_PALABRAS = 5;
const REEL_MAX_CARACTERES = 22;
const REEL_Y = 1545; // más abajo que el reel de referencia: en el plano abierto de B el logo de la remera llega a y≈1470
const REEL_TAMANO = 66;
const REEL_ANCHO = 940;
const REEL_ANCHO_DOS = 680; // con tamaño fijo: ancho de renglón antes de pasar a dos (renglones cortos, como el reel de referencia)
const REEL_INTERLINEA_DOS = 1.08;
const REEL_SOMBRA_SUAVE = "0 6px 16px rgba(0, 0, 0, 0.5)";
const REEL_SOMBRA_SIN_BORDE = "0 2px 4px rgba(0, 0, 0, 0.45), 0 4px 18px rgba(0, 0, 0, 0.55)"; // sin trazo: solo sombra difusa para leerse sobre fondos claros // con tamaño fijo: leve sombra difusa (reel de referencia)
const REEL_SOMBRA_PARALELA = "3px 7px 0 #000"; // con tamaño fijo: sombra paralela sólida (100 %), como la referencia
const REEL_ESPACIO = 0.32; // em entre palabras (margen 0.16em a cada lado) // un renglón casi siempre (dos renglones bajarían de la zona segura)
const REEL_PESO = 700;
const REEL_BORDE = 7; // px de trazo (se ve la mitad: paint-order stroke)
const REEL_SOMBRA = 5; // sombra dura hacia abajo a la derecha
const REEL_TEXTO = "#ffffff";
const REEL_CLAVE = "#efc512"; // amarillo de las palabras clave (medido en el reel de referencia)
const REEL_TINTA = "#000000";
// Apertura
const APERTURA_Y = 170; // arriba de la cabeza también en el plano abierto
const APERTURA_TAMANO = 64;
const APERTURA_SUB_TAMANO = 92;
const APERTURA_LETRA = 1.1; // frames entre letra y letra
const APERTURA_SALIDA = 8; // frames de salida
// Rótulo de ubicación
const UBIC_X = 54;
const UBIC_Y = 150; // arriba, en zona segura
const UBIC_TAMANO = 39;
const UBIC_PIN = 74; // diámetro del círculo del pin
const UBIC_RECORRIDO = 1150; // px desde fuera de cuadro
const UBIC_PIN_DEMORA = 8; // frames hasta que cae el pin
const UBIC_TEXTO_DESDE = 10;
const UBIC_TEXTO_DURA = 18;
const UBIC_LATIDO = 36; // frames por latido del anillo
const UBIC_SALIDA = 12;
// Logo y cierre
const LOGO_ANCHO = 190;
const LOGO_Y = 140;
const CIERRE_FUNDIDO = 9; // frames de fundido de entrada del cierre
const CIERRE_LOGO_DEMORA = 4; // frames hasta que entra el logo (con fundido)
const CIERRE_TEXTO_DEMORA = 10; // frames hasta que entran frase y sitio (con fundido)
const CIERRE_ENTRADA = 14; // frames de la animación de entrada
const CIERRE_LOGO_COLORES =
  "linear-gradient(100deg, #f97d55 0%, #95a8a0 42%, #406162 72%, #262626 100%)"; // logo de la placa blanca
const CIERRE_FRASE_MAX = 120; // tamaño de la frase manuscrita en el cierre "degrade"…
const CIERRE_FRASE_ANCHO = 1900; // …que se achica en frases largas (≈ tamaño × letras)
const MUSICA_SUBIDA = 18; // frames en que la música sube al empezar el cierre
const COLA_AMBIENTE_FUNDIDO = 30; // frames en que el ambiente se apaga al final del cierre

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- Datos ----------
export type PalabraFuente = {
  text: string;
  startMs: number;
  endMs: number;
  frase?: boolean;
}; // frase: empieza una frase

export type Toma = {
  clip: string; // clave en la transcripción; el video es `${carpetaVideos}/${clip}.mp4`
  desdeMs: number;
  hastaMs: number;
  gananciaDb?: number;
  rampaAudio?: number; // frames de fundido de la voz en los bordes (por defecto RAMPA_AUDIO); 1 si el corte cae pegado a una palabra
  zoom?: number; // escala base de la toma (p. ej. 1.12 en un corte dentro del mismo plano)
  planos?: Plano[]; // cambios de cámara dentro de la toma (el audio sigue siendo de `clip`)
  // pausa al final (deja respirar la frase cuando la siguiente palabra viene pegada): la imagen sigue
  // (congelada se veía "trabada", 2026-10-13) y suena el ambiente del clip desde `ambienteMs` (un tramo sin voz)
  pausaMs?: number;
  ambienteMs?: number;
};

export type HablaSubtituladaProps = {
  marca: string;
  carpetaVideos: string; // dentro de public/
  audios?: Record<string, string>; // audio de un clip desde otro archivo (p. ej. voz con menos ruido), misma línea de tiempo
  cruceAudio?: number; // frames: cada toma se encima con la siguiente (fundido cruzado) en vez de fundir a cero
  tomas: Toma[];
  transcripcion: Record<string, PalabraFuente[]>;
  velocidad: number; // 1 = normal; 1.05 = 5 % más rápido (mantiene el tono)
  musica?: string; // sin música: solo la voz y su ambiente
  musicaBajoVozDb?: number; // volumen de la música mientras hay voz
  musicaCierreDb?: number; // volumen de la música en el cierre
  // sin cierre (y con transcripcion {} y sin gráficos) sirve de "preview": solo los cortes
  cierre?: {
    frase: string;
    sitio: string;
    duracion: number; // en frames
    estilo?: "oscuro" | "degrade" | "claro";
    colaAmbiente?: boolean; // el sonido del último clip sigue bajo el cierre y se apaga
    corte?: boolean; // la placa entra por corte (sin fundido con la toma) y solo se anima el logo
  };
  subtitulos?: {
    estilo?: "capsula" | "reel";
    claves?: string[];
    minusculas?: boolean;
    grupos?: string[]; // subtítulos escritos a mano, en orden (ver gruposManuales en calculos.ts)
    tamano?: number; // "reel": tamaño de letra fijo; si no entra en un renglón pasa a dos (sin achicar)
    seco?: boolean; // "reel": entran y salen sin animación
    peso?: number; // "reel": grosor de la letra (por defecto REEL_PESO)
    sinBorde?: boolean; // "reel": sin el trazo negro ni la sombra paralela, solo una sombra difusa
  };
  apertura?: { titulo: string; subtitulo?: string; duracion: number }; // duracion en frames
  ubicacion?: { texto: string; duracion: number }; // rótulo con pin que entra desde la izquierda (frames)
  encuadre?: Record<string, number[][]>; // datos/encuadre.json: [seg, cx, cy, alto] por clip horizontal
  seguimiento?: Record<string, number[][]>; // cara cuadro a cuadro [seg, cx, cy, alto] para planos con `seguir`
  logoSuperior?: boolean; // logo arriba durante las tomas (por defecto sí)
  zoomLento?: boolean; // acercamiento lento en cada plano (por defecto sí)
  // Capas DETRÁS de la persona: `contenido` va entre el video y la persona recortada (scripts/mascaras.py,
  // webm con alfa del mismo clip que se ve, en carpetaVideos; su cuadro 0 = segundo `recorteDesdeMs` del clip).
  // desdeMs/hastaMs en tiempo del clip de la toma. El recorte recibe el mismo encuadre y zoom que el plano.
  detrasDePersona?: CapaDetras[];
  // Capa sobre el video y debajo de logo y subtítulos, en frames de salida (p. ej. grabaciones de pantalla con
  // la voz en off: la persona sigue sonando y los subtítulos quedan encima)
  sobreVideo?: React.ReactNode;
};

export type CapaDetras = {
  clip: string;
  desdeMs: number;
  hastaMs: number;
  recorte: string;
  recorteDesdeMs: number;
  contenido: React.ReactNode;
};

// ---------- Cálculos de montaje ----------
const framesToma = (t: Toma, velocidad: number) =>
  framesTomaSalida(t, velocidad, FPS);
// cuadros con voz (sin la pausa del final)
const framesVoz = (t: Toma, velocidad: number) =>
  Math.round((((t.hastaMs - t.desdeMs) / 1000) * FPS) / velocidad);

const inicios = (p: HablaSubtituladaProps) => {
  let acc = 0;
  return p.tomas.map((t) => {
    const ini = acc;
    acc += framesToma(t, p.velocidad);
    return ini;
  });
};

const framesTomas = (p: HablaSubtituladaProps) =>
  p.tomas.reduce((s, t) => s + framesToma(t, p.velocidad), 0);

export const duracionHablaSubtitulada = (p: HablaSubtituladaProps) =>
  framesTomas(p) + (p.cierre?.duracion ?? 0);

const dbAVolumen = (db: number) => Math.pow(10, db / 20);

// Palabras en tiempo de salida (frames); solo las que caen dentro de alguna toma
type Palabra = {
  text: string;
  desde: number;
  hasta: number;
  nuevaFrase: boolean;
  clave: boolean;
};

const palabrasMontadas = (p: HablaSubtituladaProps): Palabra[] => {
  const ini = inicios(p);
  const out: Palabra[] = [];
  p.tomas.forEach((t, i) => {
    const aFrame = (ms: number) =>
      ini[i] + (((ms - t.desdeMs) / 1000) * FPS) / p.velocidad;
    const palabras = p.transcripcion[t.clip] ?? [];
    const primera = out.length; // la primera palabra de cada toma siempre abre frase
    palabras.forEach((w) => {
      const medio = (w.startMs + w.endMs) / 2;
      if (medio < t.desdeMs || medio >= t.hastaMs) return;
      out.push({
        text: w.text,
        desde: Math.max(ini[i], aFrame(w.startMs)),
        hasta: Math.min(ini[i] + framesToma(t, p.velocidad), aFrame(w.endMs)),
        nuevaFrase:
          out.length === primera || Boolean(w.frase) || /^[¿¡]/.test(w.text),
        clave: false,
      });
    });
  });
  // una frase nueva empieza tras un signo de cierre (además de las marcadas en la transcripción)
  out.forEach((w, i) => {
    w.nuevaFrase = w.nuevaFrase || i === 0 || /[.?!]$/.test(out[i - 1].text);
  });
  marcarClaves(
    out.map((w) => w.text),
    p.subtitulos?.claves ?? [],
  ).forEach((c, i) => {
    out[i].clave = c;
  });
  return out;
};

type Grupo = {
  palabras: Palabra[];
  desde: number;
  hasta: number;
  unRenglon?: boolean;
};

const agrupar = (
  palabras: Palabra[],
  maxPalabras: number,
  maxCaracteres: number,
  parejo = false, // true: cada frase se reparte en grupos parejos (estilo "reel"); false: llenado voraz
): Grupo[] => {
  const grupos: Grupo[] = [];
  let actual: Palabra[] = [];
  const cerrar = () => {
    if (actual.length)
      grupos.push({ palabras: actual, desde: actual[0].desde, hasta: 0 });
    actual = [];
  };
  if (parejo) {
    // frases (cortadas también en comas) repartidas en grupos de largo parejo
    const frases: Palabra[][] = [];
    palabras.forEach((w, i) => {
      if (w.nuevaFrase || !frases.length || /[,:;]$/.test(palabras[i - 1].text))
        frases.push([]);
      frases[frases.length - 1].push(w);
    });
    frases.forEach((f) => {
      let i = 0;
      partirFrase(
        f.map((w) => w.text),
        maxPalabras,
        maxCaracteres,
      ).forEach((n) => {
        actual = f.slice(i, i + n);
        i += n;
        cerrar();
      });
    });
  } else {
    palabras.forEach((w) => {
      const largo = [...actual, w].map((x) => x.text).join(" ").length;
      if (w.nuevaFrase || actual.length >= maxPalabras || largo > maxCaracteres)
        cerrar();
      actual.push(w);
      if (/[,:;]$/.test(w.text)) cerrar(); // una coma también corta el grupo
    });
    cerrar();
  }
  return conFin(grupos);
};

// cada grupo queda hasta que entra el siguiente o poco después de su última palabra; los que duran
// muy poco para leerlos toman tiempo de los vecinos
const conFin = (grupos: Grupo[]): Grupo[] => {
  grupos.forEach((g, i) => {
    const fin =
      g.palabras[g.palabras.length - 1].hasta +
      (COLA_SUBTITULO_MS / 1000) * FPS;
    g.hasta = i + 1 < grupos.length ? Math.min(grupos[i + 1].desde, fin) : fin;
  });
  return alargarCortos(grupos, SUB_MINIMO, SUB_ADELANTO, SUB_RETRASO);
};

// grupos escritos a mano: el texto y el amarillo salen del guion de subtítulos; los tiempos, de lo dicho
const agruparManual = (palabras: Palabra[], textos: string[]): Grupo[] => {
  const grupos: Grupo[] = [];
  let i = 0;
  for (const g of gruposManuales(
    palabras.map((w) => w.text),
    textos,
  )) {
    const ps = palabras.slice(i, i + g.cantidad).map((w, k) => ({
      ...w,
      text: g.textos[k],
      clave: g.claves[k] || w.clave,
    }));
    i += g.cantidad;
    if (!g.omitir)
      grupos.push({
        palabras: ps,
        desde: ps[0].desde,
        hasta: 0,
        unRenglon: g.unRenglon,
      });
  }
  return conFin(grupos);
};

// ---------- Piezas ----------
// Imagen de un plano (siempre muda: el audio va aparte, del clip de la toma)
const PlanoVideo: React.FC<{
  tr: TramoPlano;
  carpeta: string;
  dura: number;
  velocidad: number;
  encuadre?: number[][];
  seguimiento?: number[][];
  lento: boolean;
  capas?: (CapaDetras & { desde: number; dura: number })[]; // desde/dura en frames del plano
}> = ({
  tr,
  carpeta,
  dura,
  velocidad,
  encuadre,
  seguimiento,
  lento,
  capas,
}) => {
  const frame = useCurrentFrame();
  const zl = lento ? ZOOM_LENTO : 0;
  // con rampa: arranca donde terminó el plano anterior (1 + ZOOM_LENTO, o `zoomDesde`) y empuja hasta `zoom`
  const rampa = tr.rampaMs ? ((tr.rampaMs / 1000) * FPS) / velocidad : 0;
  const escala = rampa
    ? interpolate(frame, [0, rampa], [tr.zoomDesde ?? 1 + zl, tr.zoom], {
        ...clamp,
        easing:
          tr.zoomDesde !== undefined
            ? Easing.inOut(Easing.cubic)
            : Easing.out(Easing.cubic),
      }) * interpolate(frame, [rampa, dura], [1, 1 + zl], clamp)
    : tr.zoom * interpolate(frame, [0, dura], [1, 1 + zl], clamp);
  // segundo del clip que se ve (quieto si el plano está congelado)
  const seg =
    tr.congelarMs !== undefined
      ? tr.congelarMs / 1000
      : tr.inicioClipMs / 1000 + (frame / FPS) * velocidad;
  const x = encuadre
    ? posicionRecorte(cxSuavizado(encuadre, seg), ASPECTO_HORIZONTAL)
    : 0.5;
  const cara = tr.seguir ? centroSeguido(seguimiento, seg) : null;
  const origen = cara
    ? origenSeguimiento(cara[0], cara[1], escala)
        .map((v) => `${(v * 100).toFixed(2)}%`)
        .join(" ")
    : (tr.origen ?? ORIGEN_ZOOM);
  const estilo: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: `${(x * 100).toFixed(2)}% 50%`,
    transform: `scale(${escala})`,
    transformOrigin: origen,
  };
  const congelado = tr.congelarMs !== undefined;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Freeze frame={0} active={congelado}>
        <OffthreadVideo
          src={staticFile(`${carpeta}/${tr.clip}.mp4`)}
          trimBefore={Math.round(
            ((tr.congelarMs ?? tr.inicioClipMs) / 1000) * FPS,
          )}
          playbackRate={velocidad}
          muted
          style={estilo}
        />
      </Freeze>
      {(capas ?? []).map((c, i) => (
        <Sequence
          key={i}
          from={c.desde}
          durationInFrames={c.dura}
          name={`detrás de la persona ${c.desdeMs}`}
        >
          <AbsoluteFill>{c.contenido}</AbsoluteFill>
          <OffthreadVideo
            src={staticFile(`${carpeta}/${c.recorte}`)}
            trimBefore={Math.max(
              0,
              Math.round(
                ((tr.inicioClipMs +
                  (c.desde / FPS) * 1000 * velocidad -
                  c.recorteDesdeMs) /
                  1000) *
                  FPS,
              ),
            )}
            playbackRate={velocidad}
            transparent
            muted
            style={{ ...estilo, position: "absolute", inset: 0 }}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const TomaVideo: React.FC<{
  t: Toma;
  p: HablaSubtituladaProps;
  dura: number;
}> = ({ t, p, dura }) => {
  const g = dbAVolumen(t.gananciaDb ?? 0);
  const rampa = t.rampaAudio ?? RAMPA_AUDIO;
  const voz = framesVoz(t, p.velocidad);
  const aFrame = (ms: number) =>
    Math.round((((ms - t.desdeMs) / 1000) * FPS) / p.velocidad);
  const tramos = tramosDePlanos(t, t.planos);
  return (
    <AbsoluteFill>
      {tramos.map((tr, i) => {
        const ini = aFrame(tr.desdeMs);
        // el último plano llega hasta el final de la toma (pausa incluida)
        const fin =
          i === tramos.length - 1 ? dura : Math.min(dura, aFrame(tr.hastaMs));
        return (
          <Sequence
            key={i}
            from={ini}
            durationInFrames={Math.max(1, fin - ini)}
            name={`${tr.clip} ${tr.inicioClipMs}`}
          >
            <PlanoVideo
              tr={tr}
              carpeta={p.carpetaVideos}
              dura={fin - ini}
              velocidad={p.velocidad}
              encuadre={p.encuadre?.[tr.clip]}
              seguimiento={p.seguimiento?.[tr.clip]}
              lento={p.zoomLento !== false && !tr.fijo}
              capas={(p.detrasDePersona ?? [])
                .filter(
                  (c) =>
                    c.clip === t.clip &&
                    c.desdeMs < tr.hastaMs &&
                    c.hastaMs > tr.desdeMs,
                )
                .map((c) => {
                  const d = Math.max(
                    0,
                    aFrame(Math.max(c.desdeMs, tr.desdeMs)) - ini,
                  );
                  const h =
                    Math.min(fin, aFrame(Math.min(c.hastaMs, tr.hastaMs))) -
                    ini;
                  return { ...c, desde: d, dura: Math.max(1, h - d) };
                })}
            />
          </Sequence>
        );
      })}
      {p.cruceAudio ? null : (
        <Audio
          src={staticFile(
            p.audios?.[t.clip] ?? `${p.carpetaVideos}/${t.clip}.mp4`,
          )}
          trimBefore={Math.round((t.desdeMs / 1000) * FPS)}
          playbackRate={p.velocidad}
          volume={(f) =>
            g *
            interpolate(f, [0, rampa, voz - rampa, voz], [0, 1, 1, 0], clamp)
          }
        />
      )}
      {t.pausaMs && t.ambienteMs !== undefined ? (
        // ambiente bajo la pausa (sin esto, la caída a silencio total se nota en un lugar con ruido)
        <Sequence from={voz - 1} name={`ambiente ${t.ambienteMs}`}>
          <Audio
            src={staticFile(
              p.audios?.[t.clip] ?? `${p.carpetaVideos}/${t.clip}.mp4`,
            )}
            trimBefore={Math.round((t.ambienteMs / 1000) * FPS)}
            volume={(f) =>
              g *
              interpolate(
                f,
                [0, 2, dura - voz - 1, dura - voz + 1],
                [0, 1, 1, 0],
                clamp,
              )
            }
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const Subtitulo: React.FC<{ g: Grupo; m: Marca }> = ({ g, m }) => {
  const frame = useCurrentFrame(); // relativo al inicio del grupo
  const { fps } = useVideoConfig();
  const entrada = spring({
    frame,
    fps,
    durationInFrames: ENTRADA_SUB * 2,
    config: { damping: 14 },
  });
  const opacidad = interpolate(frame, [0, ENTRADA_SUB], [0, 1], clamp);
  const ahora = g.desde + frame;
  return (
    <div
      style={{
        position: "absolute",
        left: m.margen,
        right: m.margen,
        top: SUB_Y,
        transform: `translateY(-50%) scale(${0.86 + 0.14 * entrada})`,
        opacity: opacidad,
        textAlign: "center",
        fontFamily: m.fuenteTitulos ?? m.fuente,
        fontWeight: 800,
        fontSize: SUB_TAMANO,
        lineHeight: 1.1,
        letterSpacing: "-0.01em",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: SUB_RELLENO,
          borderRadius: SUB_RADIO,
          background: conAlfa(m.colores.oscuro, SUB_FONDO_ALFA),
          boxShadow: `0 10px 30px ${conAlfa(m.colores.oscuro, 0.35)}`,
        }}
      >
        {g.palabras.map((w, i) => {
          const activa =
            ahora >= w.desde && ahora < Math.max(w.hasta, w.desde + 4);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 0.2em",
                color: activa
                  ? (m.colores.acento ?? m.colores.claro)
                  : m.colores.claro,
                transform: `scale(${activa ? 1.06 : 1})`,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Tamaño de letra para que el subtítulo entre en un renglón (se achica solo si no entra)
const tamanoReel = (textos: string[], familia: string) => {
  const ctx =
    typeof document === "undefined"
      ? null
      : document.createElement("canvas").getContext("2d");
  if (!ctx) return REEL_TAMANO;
  ctx.font = `${REEL_PESO} ${REEL_TAMANO}px ${familia}`;
  const texto = textos.join("");
  const ancho =
    ctx.measureText(texto).width +
    REEL_TAMANO * (0.02 * texto.length + REEL_ESPACIO * textos.length) +
    REEL_BORDE +
    REEL_SOMBRA;
  return Math.min(REEL_TAMANO, (REEL_TAMANO * REEL_ANCHO) / ancho);
};

// Estilo de los reels de Volto: minúsculas, borde negro y sombra dura, sin fondo
const SubtituloReel: React.FC<{
  g: Grupo;
  m: Marca;
  minusculas?: boolean;
  tamanoFijo?: number;
  seco?: boolean;
  peso?: number;
  sinBorde?: boolean;
}> = ({ g, m, minusculas, tamanoFijo, seco, peso = REEL_PESO, sinBorde }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({
    frame,
    fps,
    durationInFrames: ENTRADA_SUB * 2,
    config: { damping: 12 },
  });
  const opacidad = seco ? 1 : interpolate(frame, [0, 2], [0, 1], clamp);
  const escala = seco ? 1 : 0.9 + 0.1 * entrada;
  const familia = m.fuenteTitulos ?? m.fuente;
  const tamanoAjustado = React.useMemo(
    () =>
      tamanoReel(
        g.palabras.map((w) => w.text),
        familia,
      ),
    [g.palabras, familia],
  );
  const tamano = tamanoFijo ?? tamanoAjustado;
  const textos = g.palabras.map((w) =>
    minusculas ? w.text.toLowerCase() : w.text,
  );
  // con tamaño fijo, si no entra en un renglón: dos, en forma de pirámide
  const corte = React.useMemo(() => {
    if (!tamanoFijo || g.unRenglon) return 0;
    const ctx =
      typeof document === "undefined"
        ? null
        : document.createElement("canvas").getContext("2d");
    if (!ctx) return 0;
    ctx.font = `${peso} ${tamanoFijo}px ${familia}`;
    const anchos = textos.map(
      (t) => ctx.measureText(t).width + 0.02 * tamanoFijo * t.length,
    );
    return cortePiramide(
      anchos,
      REEL_ESPACIO * tamanoFijo,
      REEL_ANCHO_DOS - REEL_BORDE - REEL_SOMBRA,
    );
  }, [textos.join(" "), tamanoFijo, familia, g.unRenglon, peso]); // eslint-disable-line react-hooks/exhaustive-deps
  const sombra = sinBorde
    ? REEL_SOMBRA_SIN_BORDE
    : tamanoFijo
    ? `${REEL_SOMBRA_PARALELA}, ${REEL_SOMBRA_SUAVE}`
    : `${REEL_SOMBRA}px ${REEL_SOMBRA}px 0 ${REEL_TINTA}`;
  const palabra = (w: Palabra, i: number) => (
    <span
      key={i}
      style={{
        display: "inline-block",
        margin: "0 0.16em",
        color: w.clave ? REEL_CLAVE : REEL_TEXTO,
        WebkitTextStroke: sinBorde ? undefined : `${REEL_BORDE}px ${REEL_TINTA}`,
        paintOrder: "stroke fill",
        textShadow: sombra,
      }}
    >
      {textos[i]}
    </span>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: REEL_Y,
        transform: `translateY(-50%) scale(${escala})`,
        opacity: opacidad,
        textAlign: "center",
        fontFamily: familia,
        fontWeight: peso,
        fontSize: tamano,
        lineHeight: tamanoFijo ? REEL_INTERLINEA_DOS : 1.2,
        letterSpacing: "0.02em",
      }}
    >
      <div
        style={{
          display: "inline-block",
          maxWidth: tamanoFijo ? undefined : REEL_ANCHO,
        }}
      >
        {corte ? (
          <>
            <div>{g.palabras.slice(0, corte).map((w, i) => palabra(w, i))}</div>
            <div>
              {g.palabras.slice(corte).map((w, i) => palabra(w, corte + i))}
            </div>
          </>
        ) : (
          g.palabras.map((w, i) => palabra(w, i))
        )}
      </div>
    </div>
  );
};

const Apertura: React.FC<{
  m: Marca;
  titulo: string;
  subtitulo?: string;
  duracion: number;
}> = ({ m, titulo, subtitulo, duracion }) => {
  const frame = useCurrentFrame();
  const salida = interpolate(
    frame,
    [duracion - APERTURA_SALIDA, duracion],
    [1, 0],
    { ...clamp, easing: m.ease },
  );
  const finTitulo = titulo.length * APERTURA_LETRA;
  const sub = interpolate(frame, [finTitulo, finTitulo + 12], [0, 1], {
    ...clamp,
    easing: m.ease,
  });
  const sombra = `0 4px 24px ${conAlfa("#000000", 0.45)}`;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: APERTURA_Y,
        textAlign: "center",
        opacity: salida,
        transform: `translateY(${(1 - salida) * -30}px)`,
      }}
    >
      <div
        style={{
          fontFamily: m.fuenteTitulos ?? m.fuente,
          fontWeight: 800,
          fontSize: APERTURA_TAMANO,
          letterSpacing: "0.06em",
          color: m.colores.claro,
          textShadow: sombra,
        }}
      >
        {[...titulo].map((c, i) => {
          const v = interpolate(
            frame,
            [i * APERTURA_LETRA, i * APERTURA_LETRA + 8],
            [0, 1],
            { ...clamp, easing: m.ease },
          );
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: v,
                transform: `translateY(${(1 - v) * 24}px)`,
                whiteSpace: "pre",
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
      {subtitulo ? (
        <div
          style={{
            marginTop: -6,
            fontFamily: m.fuenteManuscrita ?? m.fuente,
            fontSize: APERTURA_SUB_TAMANO,
            color: m.colores.acento ?? m.colores.claro,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 20}px) rotate(-4deg)`,
            textShadow: sombra,
          }}
        >
          {subtitulo}
        </div>
      ) : null}
    </div>
  );
};

// Rótulo de ubicación: píldora oscura con pin naranja que entra desde la izquierda, el pin cae y
// rebota, el texto se descubre de izquierda a derecha, un anillo late detrás del pin y al final sale.
const Ubicacion: React.FC<{ m: Marca; texto: string; duracion: number }> = ({
  m,
  texto,
  duracion,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const salida = interpolate(
    frame,
    [duracion - UBIC_SALIDA, duracion],
    [0, 1],
    { ...clamp, easing: Easing.in(Easing.cubic) },
  );
  const x = (1 - entrada) * -UBIC_RECORRIDO + salida * -UBIC_RECORRIDO;
  const pin = spring({
    frame: frame - UBIC_PIN_DEMORA,
    fps,
    config: { damping: 9, stiffness: 160 },
  });
  const descubre = interpolate(
    frame,
    [UBIC_TEXTO_DESDE, UBIC_TEXTO_DESDE + UBIC_TEXTO_DURA],
    [0, 100],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  );
  const ciclo = ((frame - UBIC_PIN_DEMORA) % UBIC_LATIDO) / UBIC_LATIDO; // anillo que late
  const anillo = frame > UBIC_PIN_DEMORA + 8 ? ciclo : 0;
  const acento = m.colores.acento ?? m.colores.claro;
  return (
    <div
      style={{
        position: "absolute",
        top: UBIC_Y,
        left: UBIC_X,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "14px 34px 14px 14px",
        borderRadius: 999,
        background: conAlfa("#262626", 0.82),
        boxShadow: `0 12px 34px ${conAlfa("#000000", 0.35)}`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: UBIC_PIN,
          height: UBIC_PIN,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `4px solid ${acento}`,
            opacity: (1 - anillo) * 0.8 * (anillo > 0 ? 1 : 0),
            transform: `scale(${1 + anillo * 0.7})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: acento,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateY(${(1 - pin) * -26}px) scale(${0.4 + 0.6 * pin})`,
            opacity: Math.min(1, pin * 2),
          }}
        >
          <svg
            width={UBIC_PIN * 0.56}
            height={UBIC_PIN * 0.56}
            viewBox="0 0 24 24"
          >
            <path
              fill={m.colores.claro}
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
            />
          </svg>
        </div>
      </div>
      <div
        style={{
          fontFamily: m.fuenteTitulos ?? m.fuente,
          fontWeight: 600,
          fontSize: UBIC_TAMANO,
          color: m.colores.claro,
          whiteSpace: "nowrap",
          clipPath: `inset(-10px ${100 - descubre}% -10px 0)`,
        }}
      >
        {texto}
      </div>
    </div>
  );
};

const LogoSuperior: React.FC<{ m: Marca }> = ({ m }) => (
  <Img
    src={staticFile(m.logo)}
    style={{
      position: "absolute",
      top: LOGO_Y,
      left: "50%",
      width: LOGO_ANCHO,
      transform: "translateX(-50%)",
      filter: `${m.logoFiltroSobreOscuro === "none" ? "" : m.logoFiltroSobreOscuro} drop-shadow(0 3px 10px ${conAlfa(m.colores.oscuro, 0.6)})`,
      opacity: 0.95,
    }}
  />
);

// Degradé de la marca de arriba abajo (Volto: naranja → salvia → petróleo → casi negro)
const fondoDegrade = (m: Marca) =>
  `linear-gradient(180deg, ${m.colores.acento ?? m.colores.oscuro} 0%, #95a8a0 38%, ${m.colores.acentoSuave ?? m.colores.oscuro} 68%, #262626 100%)`;

const Cierre: React.FC<{
  m: Marca;
  frase: string;
  sitio: string;
  estilo: "oscuro" | "degrade" | "claro";
  corte?: boolean;
}> = ({ m, frase, sitio, estilo, corte }) => {
  const frame = useCurrentFrame();
  const fondo = corte
    ? 1
    : interpolate(frame, [0, CIERRE_FUNDIDO], [0, 1], clamp);
  const demoraLogo = corte ? 0 : CIERRE_LOGO_DEMORA;
  const logo = interpolate(
    frame,
    [demoraLogo, demoraLogo + CIERRE_ENTRADA],
    [0, 1],
    { ...clamp, easing: m.ease },
  );
  const texto = corte
    ? 1
    : interpolate(
        frame,
        [CIERRE_TEXTO_DEMORA, CIERRE_TEXTO_DEMORA + CIERRE_ENTRADA],
        [0, 1],
        { ...clamp, easing: m.ease },
      );
  const degrade = estilo === "degrade";
  const claro = estilo === "claro";
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: claro
            ? "#ffffff"
            : degrade
              ? fondoDegrade(m)
              : m.colores.oscuro,
          opacity: fondo,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {claro ? (
          // placa blanca: el logo (claro sobre transparente) se tiñe con los colores de la marca
          <div
            style={{
              position: "relative",
              width: 620,
              opacity: logo,
              transform: `translateY(${(1 - logo) * 40}px)`,
            }}
          >
            <Img src={staticFile(m.logo)} style={{ width: 620, opacity: 0 }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: CIERRE_LOGO_COLORES,
                WebkitMaskImage: `url(${staticFile(m.logo)})`,
                WebkitMaskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                maskImage: `url(${staticFile(m.logo)})`,
                maskSize: "100% 100%",
                maskRepeat: "no-repeat",
              }}
            />
          </div>
        ) : (
          <Img
            src={staticFile(m.logo)}
            style={{
              width: 620,
              opacity: logo,
              transform: `translateY(${(1 - logo) * 40}px)`,
              filter:
                m.logoFiltroSobreOscuro === "none"
                  ? undefined
                  : m.logoFiltroSobreOscuro,
            }}
          />
        )}
        {frase ? (
          <div
            style={{
              marginTop: degrade ? 40 : 70,
              opacity: texto,
              transform: `translateY(${(1 - texto) * 30}px)`,
              fontFamily: m.fuenteManuscrita ?? m.fuente,
              fontWeight: degrade ? 400 : 700,
              fontSize: degrade
                ? Math.min(
                    CIERRE_FRASE_MAX,
                    Math.round(CIERRE_FRASE_ANCHO / Math.max(1, frase.length)),
                  )
                : 78,
              color: degrade
                ? m.colores.claro
                : (m.colores.acento ?? m.colores.claro),
            }}
          >
            {frase}
          </div>
        ) : null}
        <div
          style={{
            marginTop: frase ? (degrade ? 20 : 36) : 48,
            opacity: texto,
            fontFamily: degrade ? (m.fuenteTitulos ?? m.fuente) : m.fuente,
            fontWeight: degrade ? 600 : 500,
            fontSize: 44,
            letterSpacing: "0.04em",
            color: claro ? "#262626" : m.colores.claro,
          }}
        >
          {sitio}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Composición ----------
export const HablaSubtitulada: React.FC<HablaSubtituladaProps> = (p) => {
  const m = MARCAS[p.marca];
  const ini = inicios(p);
  const finTomas = framesTomas(p);
  const reel = p.subtitulos?.estilo === "reel";
  const grupos = p.subtitulos?.grupos
    ? agruparManual(palabrasMontadas(p), p.subtitulos.grupos)
    : agrupar(
        palabrasMontadas(p),
        reel ? REEL_MAX_PALABRAS : MAX_PALABRAS,
        reel ? REEL_MAX_CARACTERES : MAX_CARACTERES,
        reel,
      );
  const bajo = dbAVolumen(p.musicaBajoVozDb ?? -20);
  const alto = dbAVolumen(p.musicaCierreDb ?? -8);
  const ultima = p.tomas[p.tomas.length - 1];
  const durCierre = p.cierre?.duracion ?? 0;
  return (
    <AbsoluteFill style={{ background: m.colores.oscuro }}>
      {p.musica ? (
        <Audio
          src={staticFile(p.musica)}
          volume={(f) =>
            interpolate(
              f,
              [finTomas - 4, finTomas - 4 + MUSICA_SUBIDA],
              [bajo, alto],
              clamp,
            )
          }
        />
      ) : null}
      {p.tomas.map((t, i) => {
        const dura = framesToma(t, p.velocidad);
        return (
          <Sequence
            key={i}
            from={ini[i]}
            durationInFrames={dura}
            name={`${t.clip} ${t.desdeMs}-${t.hastaMs}`}
          >
            <TomaVideo t={t} p={p} dura={dura} />
          </Sequence>
        );
      })}
      {p.sobreVideo ? (
        <Sequence durationInFrames={finTomas} name="sobre el video">
          {p.sobreVideo}
        </Sequence>
      ) : null}
      {/* con cruceAudio: la voz de cada toma empieza `c` frames antes y termina `c` después, fundiendo
          cruzado con la vecina (sin el hueco de silencio que dejan dos fundidos a cero) */}
      {p.cruceAudio
        ? p.tomas.map((t, i) => {
            const dura = framesVoz(t, p.velocidad);
            const c = p.cruceAudio ?? 0;
            const antes = i === 0 ? 0 : c;
            const despues = i === p.tomas.length - 1 && !t.pausaMs ? 0 : c;
            const g = dbAVolumen(t.gananciaDb ?? 0);
            const largo = antes + dura + despues;
            return (
              <Sequence
                key={`voz${i}`}
                from={ini[i] - antes}
                durationInFrames={largo}
                name={`voz ${t.clip} ${t.desdeMs}`}
              >
                <Audio
                  src={staticFile(
                    p.audios?.[t.clip] ?? `${p.carpetaVideos}/${t.clip}.mp4`,
                  )}
                  trimBefore={Math.max(
                    0,
                    Math.round((t.desdeMs / 1000) * FPS) - antes,
                  )}
                  playbackRate={p.velocidad}
                  volume={(f) =>
                    g *
                    interpolate(
                      f,
                      [0, 2 * antes || 1, largo - 2 * despues - 1, largo],
                      [antes ? 0 : 1, 1, 1, despues ? 0 : 1],
                      clamp,
                    )
                  }
                />
              </Sequence>
            );
          })
        : null}
      {p.cierre?.colaAmbiente && ultima ? (
        <Sequence
          from={finTomas}
          durationInFrames={p.cierre.duracion}
          name="ambiente del cierre"
        >
          <Audio
            src={staticFile(`${p.carpetaVideos}/${ultima.clip}.mp4`)}
            trimBefore={Math.round((ultima.hastaMs / 1000) * FPS)}
            playbackRate={p.velocidad}
            volume={(f) =>
              dbAVolumen(ultima.gananciaDb ?? 0) *
              interpolate(
                f,
                [0, RAMPA_AUDIO, durCierre - COLA_AMBIENTE_FUNDIDO, durCierre],
                [0, 1, 1, 0],
                clamp,
              )
            }
          />
        </Sequence>
      ) : null}
      {p.logoSuperior !== false ? (
        <Sequence durationInFrames={finTomas} name="logo">
          <LogoSuperior m={m} />
        </Sequence>
      ) : null}
      {p.apertura ? (
        <Sequence durationInFrames={p.apertura.duracion} name="apertura">
          <Apertura
            m={m}
            titulo={p.apertura.titulo}
            subtitulo={p.apertura.subtitulo}
            duracion={p.apertura.duracion}
          />
        </Sequence>
      ) : null}
      {p.ubicacion ? (
        <Sequence durationInFrames={p.ubicacion.duracion} name="ubicación">
          <Ubicacion
            m={m}
            texto={p.ubicacion.texto}
            duracion={p.ubicacion.duracion}
          />
        </Sequence>
      ) : null}
      {grupos.map((g, i) => (
        <Sequence
          key={i}
          from={Math.round(g.desde)}
          durationInFrames={Math.max(
            1,
            Math.round(g.hasta) - Math.round(g.desde),
          )}
          name={g.palabras.map((w) => w.text).join(" ")}
        >
          {reel ? (
            <SubtituloReel
              g={{ ...g, desde: Math.round(g.desde) }}
              m={m}
              minusculas={p.subtitulos?.minusculas}
              tamanoFijo={p.subtitulos?.tamano}
              seco={p.subtitulos?.seco}
              peso={p.subtitulos?.peso}
              sinBorde={p.subtitulos?.sinBorde}
            />
          ) : (
            <Subtitulo g={{ ...g, desde: Math.round(g.desde) }} m={m} />
          )}
        </Sequence>
      ))}
      {/* el cierre empieza a fundir sobre los últimos frames de la toma final (con `corte`, entra seco) */}
      {p.cierre ? (
        <Sequence
          from={p.cierre.corte ? finTomas : finTomas - CIERRE_FUNDIDO}
          durationInFrames={
            p.cierre.duracion + (p.cierre.corte ? 0 : CIERRE_FUNDIDO)
          }
          name="cierre"
        >
          <Cierre
            m={m}
            frase={p.cierre.frase}
            sitio={p.cierre.sitio}
            estilo={p.cierre.estilo ?? "oscuro"}
            corte={p.cierre.corte}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
