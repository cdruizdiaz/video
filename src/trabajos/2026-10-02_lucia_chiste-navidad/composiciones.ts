// Trabajo 2026-10-02_lucia_chiste-navidad — "Bloomie busca papel en Navidad" (40 s, 9:16, inglés británico).
// Composición en ChisteNavidad.tsx (rig de Bloomie + noche nevada + globos de historieta).
// Música: Mixkit 1021 "Christmas Jokes" (preparar_audio.sh). Efectos de Mixkit desde public/biblioteca/sfx/mixkit/.
import type { ComposicionTrabajo } from "../tipos";
import { ChisteNavidad, type ChisteNavidadProps, DURACION, MOMENTOS } from "./ChisteNavidad";

const ID = "2026-10-02_lucia_chiste-navidad";
const SFX = "biblioteca/sfx/mixkit";

const efectos: ChisteNavidadProps["efectos"] = [
  // Whoosh en cada giro (cambio de disfraz) y cuando entra el arbolito
  ...MOMENTOS.giros.map((desde) => ({ archivo: `${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, desde, volumen: 0.55 })),
  { archivo: `${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, desde: MOMENTOS.arbol, volumen: 0.35 },
  // Despega y cae: silbido de caída hasta tocar el piso y golpe ("plop")
  { archivo: `${SFX}/mixkit-395.wav`, desde: MOMENTOS.salto + 6, volumen: 0.6, dura: MOMENTOS.plop - MOMENTOS.salto - 4 },
  { archivo: `${SFX}/mixkit-2151.wav`, desde: MOMENTOS.plop, volumen: 1 },
  // Pasitos en la nieve hasta el árbol y whoosh del salto a la punta
  { archivo: `${SFX}/mixkit-539-footsteps-on-the-snow.wav`, desde: MOMENTOS.camina[0], volumen: 0.8, dura: MOMENTOS.camina[1] - MOMENTOS.camina[0] },
  { archivo: `${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, desde: MOMENTOS.sube[0], volumen: 0.4 },
  // Destello en los anteojos y acento final
  { archivo: `${SFX}/mixkit-3062.wav`, desde: MOMENTOS.destello - 2, volumen: 0.7 },
  { archivo: `${SFX}/mixkit-2986.wav`, desde: MOMENTOS.risa - 4, volumen: 0.6, dura: DURACION - MOMENTOS.risa + 4 },
];

const completo: ChisteNavidadProps = {
  soloPersonaje: false,
  // -14 LUFS normalizada; 0,45 de fondo y ×0,3 mientras habla (≈ 17 dB por debajo de la voz)
  musica: { archivo: `trabajos/${ID}/audio/musica_40s.wav`, volumen: 0.45, bajaConVoz: 0.3 },
  efectos,
};
const alfa: ChisteNavidadProps = { ...completo, soloPersonaje: true };

export const composiciones: ComposicionTrabajo[] = [
  { id: "lucia-chiste-navidad-40s", component: ChisteNavidad, durationInFrames: DURACION, defaultProps: completo, salida: "chiste-navidad_9x16" },
  { id: "lucia-chiste-navidad-alfa", component: ChisteNavidad, durationInFrames: DURACION, defaultProps: alfa, salida: "chiste-navidad-alfa_9x16" },
];
