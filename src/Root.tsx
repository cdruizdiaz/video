import "./index.css";
import { Composition, Folder } from "remotion";
import { COMPOSICIONES_PERSONAJES } from "./personajes/composiciones";
import { TRABAJOS } from "./trabajos";
import type { ComposicionTrabajo } from "./trabajos/tipos";

const registrar = (c: ComposicionTrabajo) => (
  <Composition
    key={c.id}
    id={c.id}
    component={c.component}
    durationInFrames={c.durationInFrames}
    fps={c.fps ?? 30}
    width={c.width ?? 1080}
    height={c.height ?? 1920}
    defaultProps={c.defaultProps}
    schema={c.schema}
  />
);

// Cada trabajo aparece en Remotion Studio como una carpeta con sus composiciones; la biblioteca de personajes
// con rig (editores y muestrarios), en la carpeta "personajes".
// Los nombres de carpeta solo admiten letras, números y guiones: "_" se reemplaza por "-".
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {TRABAJOS.map((trabajo) => (
        <Folder key={trabajo.id} name={trabajo.id.replace(/_/g, "-")}>
          {trabajo.composiciones.map(registrar)}
        </Folder>
      ))}
      <Folder name="personajes">{COMPOSICIONES_PERSONAJES.map(registrar)}</Folder>
    </>
  );
};
