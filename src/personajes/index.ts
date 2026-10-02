// Biblioteca de personajes animables con rig (ver src/rig/README.md). /rig-personaje agrega aquí cada personaje nuevo.
// Los datos viven en public/personajes/<nombre>/ (piezas.json del extractor + rig.json con los pivotes);
// el .ai original, en carpetaPersonajes (scripts/herramientas.json).
import piezasBloomie from "../../public/personajes/bloomie/piezas.json";
import rigBloomie from "../../public/personajes/bloomie/rig.json";

export const DATOS_PERSONAJES: Record<string, { piezas: unknown; rig: unknown }> = {
  bloomie: { piezas: piezasBloomie, rig: rigBloomie },
};
