// Trabajo 2026-10-01_rastro_manifiesto — manifiesto de marca 16:9 (plantilla ManifiestoRastros).
import {
  DURACION_MANIFIESTO,
  ManifiestoRastros,
  type ManifiestoRastrosProps,
} from "../../plantillas/ManifiestoRastros/ManifiestoRastros";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-10-01_rastro_manifiesto";

const manifiesto: ManifiestoRastrosProps = {
  logo: "marcas/rastro/logo.png",
  musica: `trabajos/${ID}/audio/manifiesto-musica.wav`, // compuesta por código: musica_manifiesto.py
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "rastro-manifiesto-16x9",
    component: ManifiestoRastros,
    durationInFrames: DURACION_MANIFIESTO,
    defaultProps: manifiesto,
    salida: "manifiesto-45s_16x9",
    width: 1920,
    height: 1080,
  },
];
