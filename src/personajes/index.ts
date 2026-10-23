// Biblioteca de personajes animables con rig (ver src/rig/README.md). /rig-personaje agrega aquí cada personaje nuevo.
// Los datos viven en public/personajes/<nombre>/ (piezas.json del extractor + rig.json con los pivotes);
// el .ai original (o las hojas PNG de los importados con scripts/rig/importar_png.py), en carpetaPersonajes
// (scripts/herramientas.json). Los personajes "por poses" (scripts/rig/importar_poses.py) suman poses.json.
import piezasBenja from "../../public/personajes/benja/piezas.json";
import posesBenja from "../../public/personajes/benja/poses.json";
import rigBenja from "../../public/personajes/benja/rig.json";
import piezasBloomie from "../../public/personajes/bloomie/piezas.json";
import rigBloomie from "../../public/personajes/bloomie/rig.json";
import piezasSofi from "../../public/personajes/sofi/piezas.json";
import posesSofi from "../../public/personajes/sofi/poses.json";
import rigSofi from "../../public/personajes/sofi/rig.json";

export const DATOS_PERSONAJES: Record<string, { piezas: unknown; rig: unknown }> = {
  bloomie: { piezas: piezasBloomie, rig: rigBloomie },
  benja: { piezas: piezasBenja, rig: rigBenja },
  sofi: { piezas: piezasSofi, rig: rigSofi },
};

// Personajes por poses de cuerpo entero (stop motion): poses.json de scripts/rig/importar_poses.py
export const DATOS_POSES: Record<string, unknown> = {
  benja: posesBenja,
  sofi: posesSofi,
};
