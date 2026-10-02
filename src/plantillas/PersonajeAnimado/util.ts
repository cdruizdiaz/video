// Utilidades de animación de la plantilla PersonajeAnimado (todo en frames de 30 fps).
import { Easing, interpolate } from "remotion";

// interpolate siempre con clamp (regla del proyecto)
export const tramo = (
  f: number,
  entrada: number[],
  salida: number[],
  easing?: (t: number) => number,
) =>
  interpolate(f, entrada, salida, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const salida = Easing.bezier(0.2, 0.8, 0.3, 1);
export const entrada = Easing.bezier(0.6, 0, 0.9, 0.4);

// Salto de 0 a 1 y vuelta a 0 entre a y b (arco parabólico)
export const arco = (f: number, a: number, b: number) => {
  const t = tramo(f, [a, b], [0, 1]);
  return 4 * t * (1 - t);
};

// Rebotes: |sin| que se repite `veces` entre a y b, con amplitud que decae
export const rebotes = (f: number, a: number, b: number, veces: number) => {
  if (f < a || f > b) return 0;
  const t = (f - a) / (b - a);
  const decae = 1 - t * 0.5;
  return Math.abs(Math.sin(t * Math.PI * veces)) * decae;
};

// Aplastamiento al tocar el piso: devuelve [escalaX, escalaY] a partir de la altura del salto (0..1)
export const aplastar = (altura: number, enElPiso: boolean, golpe: number) => {
  if (!enElPiso) return [1 - altura * 0.05, 1 + altura * 0.08];
  return [1 + golpe * 0.12, 1 - golpe * 0.12];
};

// Cámara: centra (cx, cy) del mundo en el cuadro con zoom z
export const camara = (cx: number, cy: number, z: number, ancho = 1080, alto = 1920) =>
  `translate(${ancho / 2} ${alto / 2}) scale(${z}) translate(${-cx} ${-cy})`;

// Parpadeo: 0 abierto → 1 cerrado, en 6 frames a partir de `a`
export const parpadeo = (f: number, ...inicios: number[]) =>
  Math.max(0, ...inicios.map((a) => tramo(f, [a, a + 2, a + 4, a + 6], [0, 1, 1, 0])));

// Boca al hablar: aperturas pseudoaleatorias estables entre a y b
export const hablar = (f: number, a: number, b: number) => {
  if (f < a || f > b) return 0;
  const t = f - a;
  return 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9) * Math.cos(t * 0.37));
};
