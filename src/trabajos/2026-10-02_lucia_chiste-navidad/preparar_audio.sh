#!/usr/bin/env bash
# Música del chiste de Navidad: Mixkit "Christmas Jokes" (id 1021, Michael Ramir C.), tramo 27,0–67,0 s: los
# últimos 40 s, para que el cierre real del tema (deja de sonar a los 66,7 s) caiga al final del video. Fundido de
# entrada de 1 s, normalizada a -14 LUFS; el ducking bajo la voz se hace en Remotion (ChisteNavidad.tsx).
# Los efectos se usan directo desde public/biblioteca/sfx/mixkit/ (tiempos y volúmenes en composiciones.ts).
# Uso (desde la raíz del proyecto): bash src/trabajos/2026-10-02_lucia_chiste-navidad/preparar_audio.sh
set -euo pipefail
FFMPEG=$(node -p "require('./scripts/herramientas.json').ffmpeg")
ID=2026-10-02_lucia_chiste-navidad
"$FFMPEG" -y -hide_banner -loglevel error -ss 27.0 -t 40 -i public/biblioteca/musica/mixkit/mixkit-1021.mp3 \
  -af "afade=t=in:d=1,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -ac 2 "public/trabajos/$ID/audio/musica_40s.wav"
"$FFMPEG" -hide_banner -nostats -i "public/trabajos/$ID/audio/musica_40s.wav" -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep "I:"
