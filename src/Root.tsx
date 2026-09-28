import "./index.css";
import { Composition, Folder } from "remotion";
import { TRABAJOS } from "./trabajos";

// Cada trabajo aparece en Remotion Studio como una carpeta con sus composiciones.
// Los nombres de carpeta solo admiten letras, números y guiones: "_" se reemplaza por "-".
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {TRABAJOS.map((trabajo) => (
        <Folder key={trabajo.id} name={trabajo.id.replace(/_/g, "-")}>
          {trabajo.composiciones.map((c) => (
            <Composition
              key={c.id}
              id={c.id}
              component={c.component}
              durationInFrames={c.durationInFrames}
              fps={c.fps ?? 30}
              width={c.width ?? 1080}
              height={c.height ?? 1920}
              defaultProps={c.defaultProps}
            />
          ))}
        </Folder>
      ))}
    </>
  );
};
