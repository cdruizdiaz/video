// Capa "detrás de la persona": el video completo de fondo, después lo que tiene que quedar DETRÁS de la persona
// (texto grande, gráficos, un personaje del rig) y encima la persona recortada (webm con transparencia de
// scripts/mascaras.py, o el recorte por profundidad de scripts/profundidad.py). Los dos videos tienen que ser del
// mismo tramo: mismo inicio (trimBefore) y mismos fps.
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

export const DetrasDePersona: React.FC<{
  video: string; // dentro de public/
  recorte: string; // persona (o primer plano) con alfa, dentro de public/
  desde?: number; // frames a saltear del video de fondo (trimBefore); el recorte empieza en 0
  volumen?: number;
  children: React.ReactNode; // lo que queda entre el fondo y la persona
  delante?: React.ReactNode; // lo que va encima de todo (subtítulos…)
}> = ({ video, recorte, desde = 0, volumen = 1, children, delante }) => (
  <AbsoluteFill>
    <AbsoluteFill>
      <OffthreadVideo src={staticFile(video)} trimBefore={desde} volume={() => volumen} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
    <AbsoluteFill>{children}</AbsoluteFill>
    <AbsoluteFill>
      <OffthreadVideo src={staticFile(recorte)} transparent muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
    {delante && <AbsoluteFill>{delante}</AbsoluteFill>}
  </AbsoluteFill>
);
