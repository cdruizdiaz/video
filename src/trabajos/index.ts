// Registro de trabajos. /nuevo-trabajo agrega aquí cada trabajo nuevo.
import { composiciones as rastroHistoriaIg } from "./2026-09-28_rastro_historia-ig/composiciones";
import { composiciones as voltoIa2026 } from "./2026-09-28_volto_ia2026/composiciones";
import { composiciones as claudioMusica } from "./2026-09-29_claudio_musica/composiciones";
import { composiciones as luciaLucia70 } from "./2026-09-30_lucia_lucia70/composiciones";
import { composiciones as claudioBloomie } from "./2026-10-01_claudio_bloomie/composiciones";
import { composiciones as luciaBloomieHalloween } from "./2026-10-01_lucia_bloomie-halloween/composiciones";
import { composiciones as luciaBloomieCorriendo } from "./2026-10-02_lucia_bloomie-corriendo/composiciones";
import { composiciones as claudioRigBloomie } from "./2026-10-02_claudio_rig-bloomie/composiciones";
import { composiciones as luciaChisteNavidad } from "./2026-10-02_lucia_chiste-navidad/composiciones";
import { composiciones as rastroBloomieCreators } from "./2026-10-02_rastro_bloomie-creators/composiciones";
import { composiciones as claudioPrueba25d } from "./2026-10-02_claudio_prueba-25d/composiciones";
import { composiciones as luciaBloomieVolandoEscoba } from "./2026-10-02_lucia_bloomie-volando-escoba-realista/composiciones";
import { composiciones as claudioPruebaMocap } from "./2026-10-04_claudio_prueba-mocap/composiciones";
import type { Trabajo } from "./tipos";

export const TRABAJOS: Trabajo[] = [
  { id: "2026-09-28_rastro_historia-ig", composiciones: rastroHistoriaIg },
  { id: "2026-09-28_volto_ia2026", composiciones: voltoIa2026 },
  { id: "2026-09-29_claudio_musica", composiciones: claudioMusica },
  { id: "2026-09-30_lucia_lucia70", composiciones: luciaLucia70 },
  { id: "2026-10-01_claudio_bloomie", composiciones: claudioBloomie },
  { id: "2026-10-01_lucia_bloomie-halloween", composiciones: luciaBloomieHalloween },
  { id: "2026-10-02_lucia_bloomie-corriendo", composiciones: luciaBloomieCorriendo },
  { id: "2026-10-02_lucia_bloomie-volando-escoba-realista", composiciones: luciaBloomieVolandoEscoba },
  { id: "2026-10-02_claudio_rig-bloomie", composiciones: claudioRigBloomie },
  { id: "2026-10-02_lucia_chiste-navidad", composiciones: luciaChisteNavidad },
  { id: "2026-10-02_rastro_bloomie-creators", composiciones: rastroBloomieCreators },
  { id: "2026-10-02_claudio_prueba-25d", composiciones: claudioPrueba25d },
  { id: "2026-10-04_claudio_prueba-mocap", composiciones: claudioPruebaMocap },
];
