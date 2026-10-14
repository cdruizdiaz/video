// Movimiento de espera de un personaje por poses: en vez de cambiar de imagen (eso se ve a los saltos, v5 de
// Pitágoras) se mueve la imagen entera de forma continua: se balancea apenas sobre los pies, corre el peso de
// un lado al otro y respira. Sumas de senos con períodos que no coinciden: suave y sin que se note la repetición.

// v1 (0,55°, 5 px, 0,8 %) casi no se notaba: el usuario pidió más
const BALANCEO_GRADOS = 1.6; // inclinación máxima sobre los pies
const BALANCEO_PERIODOS = [101, 67]; // cuadros (a 30 fps: ~3,4 s y ~2,2 s)
const PESO_PX = 11; // corrimiento de lado al pasar el peso de un pie al otro (px del cuadro)
const PESO_PERIODO = 157;
const RESPIRA = 0.018; // estiramiento en y al respirar
const RESPIRA_PERIODO = 78;

export type Vaiven = { grados: number; dx: number; sy: number };

const onda = (f: number, periodo: number, fase: number) => Math.sin((2 * Math.PI * f) / periodo + fase);

// `fase` desfasa a cada personaje para que no se muevan al unísono
export const vaivenEnCuadro = (f: number, fase = 0): Vaiven => ({
  grados: BALANCEO_GRADOS * (0.7 * onda(f, BALANCEO_PERIODOS[0], fase) + 0.3 * onda(f, BALANCEO_PERIODOS[1], fase * 1.7)),
  dx: PESO_PX * onda(f, PESO_PERIODO, fase * 0.6 + 1),
  sy: 1 + RESPIRA * onda(f, RESPIRA_PERIODO, fase * 1.3),
});

// Fase estable a partir del nombre
export const faseDe = (nombre: string) => [...nombre].reduce((a, c) => a + c.charCodeAt(0), 0) % 628 / 100;

// Cuánto puede llegar a moverse la cabeza (px del cuadro) en un personaje de `alto` px: holgura para los carteles
export const holguraVaiven = (alto: number) => Math.ceil(alto * Math.sin((BALANCEO_GRADOS * Math.PI) / 180) + PESO_PX + alto * RESPIRA);
