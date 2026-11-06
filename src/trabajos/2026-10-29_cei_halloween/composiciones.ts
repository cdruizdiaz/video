// Trabajo 2026-10-29_cei_halloween: "Museo del Umbral / The Threshold" del CEI (teachers cuentan la actividad).
// El montaje (tomas, audios, subtítulos, carteles) vive en plan.json, armado por armar_plan.py.
import type { ComposicionTrabajo } from "../tipos";
import { duracionMuseo, MuseoUmbral } from "./MuseoUmbral";
import type { MuseoProps, PlanMuseo } from "./MuseoUmbral";
import plan from "./plan.json";
import { duracionNinos, NinosUmbral } from "./NinosUmbral";
import type { NinosProps, PlanNinos } from "./NinosUmbral";
import planNinos from "./plan_ninos.json";
import { duracionEntrevistas, EntrevistasUmbral } from "./EntrevistasUmbral";
import type { EntrevistasProps, PlanEntrevistas } from "./EntrevistasUmbral";
import planEntrevistas from "./plan_entrevistas.json";
import planTestimonios from "./plan_testimonios.json";

const props: MuseoProps = { plan: plan as unknown as PlanMuseo };

const propsNinos: NinosProps = { plan: planNinos as unknown as PlanNinos };

const propsEntrevistas: EntrevistasProps = { plan: planEntrevistas as unknown as PlanEntrevistas };

const propsTestimonios: EntrevistasProps = { plan: { ...(planTestimonios as unknown as PlanEntrevistas), musica: "musica_testimonios.wav", placa: "barras" } };

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "cei-halloween-museo",
    component: MuseoUmbral,
    durationInFrames: duracionMuseo(props),
    defaultProps: props as unknown as Record<string, unknown>,
    salida: "museo-umbral_9x16",
  },
  {
    // los chicos responden "What did you learn about your country?" (placa animada + respuestas con cartel del país)
    id: "cei-halloween-ninos",
    component: NinosUmbral,
    durationInFrames: duracionNinos(propsNinos),
    defaultProps: propsNinos as unknown as Record<string, unknown>,
    salida: "ninos-umbral_9x16",
  },
  {
    // los chicos se entrevistan entre ellos (Halloween día 2): doble subtítulo, inserts de la actividad, música que sube, placa final
    id: "cei-halloween-entrevistas",
    component: EntrevistasUmbral,
    durationInFrames: duracionEntrevistas(propsEntrevistas),
    defaultProps: propsEntrevistas as unknown as Record<string, unknown>,
    salida: "entrevistas-umbral_9x16",
  },
  {
    // testimonios de alumnas y padres sobre la actividad (mismo estilo que las entrevistas, placa final "barras")
    id: "cei-halloween-testimonios",
    component: EntrevistasUmbral,
    durationInFrames: duracionEntrevistas(propsTestimonios),
    defaultProps: propsTestimonios as unknown as Record<string, unknown>,
    salida: "testimonios-umbral_9x16",
  },
];
