import type React from "react";

// Una composición de un trabajo, tal como se registra en Remotion Studio.
export type ComposicionTrabajo = {
  id: string; // solo letras, números y guiones (regla de Remotion), p. ej. "rastro-historia-ig-15s"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<any>;
  durationInFrames: number;
  defaultProps: Record<string, unknown>;
  salida: string; // nombre base del archivo en out/<ID>/final/, p. ej. "historia-15s_9x16" (+ "_vN.mp4")
  width?: number; // por defecto 1080
  height?: number; // por defecto 1920
  fps?: number; // por defecto 30
};

export type Trabajo = {
  id: string; // AAAA-MM-DD_cliente_pieza (mismo nombre en public/trabajos, out y src/trabajos)
  composiciones: ComposicionTrabajo[];
};
