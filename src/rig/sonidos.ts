// Efectos de sonido automáticos según la animación del personaje: cada evento de las pistas (despegar y
// aterrizar en un salto, cambiar de cara o de disfraz, girar de vista) suena con un efecto de la biblioteca de
// Mixkit (public/biblioteca/sfx/mixkit/, licencias en LICENCIAS-mixkit.json). También lee las secuencias (p. ej.
// las del mocap): cambios de expresión y saltos (la raíz sube y vuelve al piso).
// Función pura: la plantilla PersonajeRig la usa con `sonidos: true`; un trabajo puede llamarla y editar la lista.

const SFX = "biblioteca/sfx/mixkit";
export const EFECTOS = {
  despegue: { archivo: `${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, volumen: 0.35, adelanto: 3 },
  aterrizaje: { archivo: `${SFX}/mixkit-2894-boing-hit-sound.wav`, volumen: 0.4, adelanto: 1 },
  cara: { archivo: `${SFX}/mixkit-731-cartoon-bubble-pop.wav`, volumen: 0.5, adelanto: 0 },
  giro: { archivo: `${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, volumen: 0.22, adelanto: 2 },
} as const;
export type TipoEfecto = keyof typeof EFECTOS;
const SEPARACION = 8; // frames mínimos entre dos efectos iguales
const SALTO_ALTO = 25; // pt que tiene que subir la raíz en una secuencia para que cuente como salto
const SALTO_PISO = 6; // pt: por debajo se considera que volvió al piso

export type EfectoSonido = { tipo: TipoEfecto; archivo: string; desde: number; volumen: number };

// Tipos mínimos de las pistas (para no depender de la plantilla)
type PistaSonora = {
  tipo: string;
  inicio?: number;
  duracion?: number;
  nombre?: string | null;
  veces?: number;
  secuencia?: { poses: { dura?: number; expresion?: string; huesos?: Record<string, { y?: number }> }[]; ciclo?: boolean };
};

const SALTO_DEFECTO = 26; // = SALTAR.duracion de animaciones.ts

export const efectosDePistas = (pistas: PistaSonora[], o: { volumen?: number } = {}): EfectoSonido[] => {
  const eventos: { tipo: TipoEfecto; f: number }[] = [];
  for (const p of pistas) {
    const ini = p.inicio ?? 0;
    switch (p.tipo) {
      case "saltar": {
        const d = p.duracion ?? SALTO_DEFECTO;
        eventos.push({ tipo: "despegue", f: ini + d * 0.25 }, { tipo: "aterrizaje", f: ini + d * 0.8 });
        break;
      }
      case "expresion":
        eventos.push({ tipo: "cara", f: ini });
        break;
      case "disfraz":
        if (p.nombre) eventos.push({ tipo: "cara", f: ini });
        break;
      case "girar":
        eventos.push({ tipo: "giro", f: ini });
        break;
      case "secuencia": {
        const sec = p.secuencia;
        if (!sec || !p.duracion) break;
        const poses = sec.poses;
        const tramos = sec.ciclo ? poses.length : poses.length - 1;
        const total = poses.slice(0, Math.max(1, tramos)).reduce((a, x) => a + (x.dura ?? 1), 0);
        const veces = p.veces ?? 1;
        for (let v = 0; v < veces; v++) {
          let acc = 0;
          let cara = poses[0]?.expresion;
          let enAire = false;
          poses.forEach((pose, k) => {
            const f = ini + (v + acc / total) * p.duracion!;
            if (k > 0 && pose.expresion !== undefined && pose.expresion !== cara) {
              eventos.push({ tipo: "cara", f });
              cara = pose.expresion;
            }
            const y = pose.huesos?.raiz?.y ?? 0;
            if (!enAire && y < -SALTO_ALTO) {
              eventos.push({ tipo: "despegue", f });
              enAire = true;
            } else if (enAire && y > -SALTO_PISO) {
              eventos.push({ tipo: "aterrizaje", f });
              enAire = false;
            }
            acc += pose.dura ?? 1;
          });
        }
        break;
      }
    }
  }
  eventos.sort((a, b) => a.f - b.f);
  const ultimo: Partial<Record<TipoEfecto, number>> = {};
  const salida: EfectoSonido[] = [];
  for (const e of eventos) {
    const ef = EFECTOS[e.tipo];
    const desde = Math.max(0, Math.round(e.f - ef.adelanto));
    if (ultimo[e.tipo] !== undefined && desde - ultimo[e.tipo]! < SEPARACION) continue;
    ultimo[e.tipo] = desde;
    salida.push({ tipo: e.tipo, archivo: ef.archivo, desde, volumen: ef.volumen * (o.volumen ?? 1) });
  }
  return salida;
};
