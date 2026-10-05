// Línea de tiempo neutra para exportar una composición a Premiere (la escribe scripts/a-premiere.mjs
// como XML de Final Cut 7, que Premiere importa). Cada plantilla que se pueda pasar a Premiere exporta
// una función `(props) => LineaPremiere` y el trabajo la registra en `premiere` de su composición.
// Sin React ni Remotion: el script la ejecuta en Node.
// Todos los tiempos en frames de la composición.

// Encuadre en un frame del clip. Modelo: el video primero cubre el lienzo (como objectFit "cover");
// después se amplía `zoom` veces y queda visible la zona cuya esquina superior izquierda está en
// (izq, arriba), en fracciones del lienzo cubierto.
export type EncuadrePremiere = {
  frame: number;
  zoom: number;
  izq: number;
  arriba: number;
};

export type ClipVideoPremiere = {
  archivo: string; // ruta dentro de public/ (p. ej. "trabajos/<ID>/crudos/x.mp4"); el script busca el original
  inicio: number; // frame de la línea de tiempo donde empieza
  entrada: number; // frame del archivo donde empieza
  duracion: number;
  nombre?: string;
  encuadre?: EncuadrePremiere[]; // frames relativos al clip; sin encuadre: cubre el lienzo sin zoom
};

export type ClipAudioPremiere = {
  archivo: string;
  pista: number; // 1 = A1
  inicio: number;
  entrada: number;
  duracion: number;
  gananciaDb?: number;
  video?: number; // índice del clip de video al que va vinculado (mismo archivo)
};

// Fundido de audio en una pista: "cruzado" centrado en el corte de `frame`; "salida" termina en `frame`
export type FundidoPremiere = {
  pista: number;
  frame: number;
  duracion: number;
  tipo: "cruzado" | "salida";
};

export type LineaPremiere = {
  fps: number;
  ancho: number;
  alto: number;
  duracion: number;
  video: ClipVideoPremiere[]; // V1
  audio: ClipAudioPremiere[];
  fundidos: FundidoPremiere[];
  // Lo que define la capa de gráficos (se renderiza con soloGraficos: true y va en V2).
  // Si no cambia entre versiones, se reutiliza la capa ya renderizada. Sin `graficos`: no hay capa.
  graficos?: unknown;
};
