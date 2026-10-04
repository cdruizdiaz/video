// Poses cuadro a cuadro de una animación del rig (PersonajeRig), para que Blender mueva el modelo 3D EXACTAMENTE
// igual que el dibujo 2D (mismas pistas: respirar, saltar, caminar, secuencias, mocap…).
// Uso: npx vite-node scripts/blender/poses.ts -- <props.json> <duración> <salida.json> [--fps 30]
//   props.json: PersonajeRigProps (personaje, pistas, x, y, escala…), p. ej. el defaultProps de una composición.
// Salida: { personaje, fps, cuadros: [{ huesos: { id: {rot,x,y,sx,sy} }, lugar: {x,y,escala,rot}, expresion, … }] }
// (huesos ya resueltos con comodines para cada hueso de la vista frente).
import fs from "node:fs";
import { lugarEn, poseEn, type PersonajeRigProps } from "../../src/plantillas/PersonajeRig/calculos";
import { cargarPersonaje } from "../../src/rig/personajes";
import { movDe } from "../../src/rig/pose";

const args = process.argv.slice(2).filter((a) => a !== "--");
const [entrada, dur, salida] = args;
if (!entrada || !dur || !salida) {
  console.error("Uso: npx vite-node scripts/blender/poses.ts -- <props.json> <duración> <salida.json> [--fps 30]");
  process.exit(1);
}
const i = args.indexOf("--fps");
const fps = i >= 0 ? Number(args[i + 1]) : 30;
const props = JSON.parse(fs.readFileSync(entrada, "utf8")) as PersonajeRigProps;
const huesos = cargarPersonaje(props.personaje).rig.vistas.frente.huesos.map((h) => h.id);
const redondo = (v: number | undefined, d: number) => +(v ?? d).toFixed(3);
const cuadros = [];
for (let f = 0; f < Number(dur); f++) {
  const pose = poseEn(props, f, fps);
  const h: Record<string, { rot: number; x: number; y: number; sx: number; sy: number }> = {};
  for (const id of huesos) {
    const m = movDe(pose, id);
    h[id] = { rot: redondo(m.rot, 0), x: redondo(m.x, 0), y: redondo(m.y, 0), sx: redondo(m.sx, 1), sy: redondo(m.sy, 1) };
  }
  cuadros.push({
    huesos: h,
    lugar: lugarEn(props, f),
    expresion: pose.expresion,
    parpado: pose.parpado,
    visema: pose.visema,
    yaw: pose.yaw,
    espejo: pose.espejo,
  });
}
fs.writeFileSync(salida, JSON.stringify({ personaje: props.personaje, fps, cuadros }));
console.log(`OK ${salida} · ${cuadros.length} cuadros · ${huesos.length} huesos`);
