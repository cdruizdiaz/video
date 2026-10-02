#!/usr/bin/env bash
# Música de "Bloomie se va a la escuela": Happy Home (Mixkit 801), primeros 40 s con entrada suave y
# fundido de 3 s al final. Queda a -18 LUFS para dejar lugar a los efectos; la mezcla final se lleva a
# -14 LUFS después del render.
# Uso (desde la raíz del proyecto): bash src/trabajos/2026-10-01_claudio_bloomie/preparar_musica.sh
set -euo pipefail
FFMPEG=$(node -p "require('./scripts/herramientas.json').ffmpeg")
ID=2026-10-01_claudio_bloomie
"$FFMPEG" -y -hide_banner -loglevel error \
  -i public/biblioteca/musica/mixkit/mixkit-801-happy-home.mp3 \
  -af "atrim=0:40.5,asetpts=N/SR/TB,afade=t=in:d=0.6,afade=t=out:st=37:d=3.5,loudnorm=I=-18:TP=-2:LRA=11" \
  -ar 48000 -ac 2 "public/trabajos/$ID/audio/musica_40s.wav"
"$FFMPEG" -hide_banner -i "public/trabajos/$ID/audio/musica_40s.wav" -af ebur128=peak=true -f null - 2>&1 | grep -A3 "Integrated loudness" | head -4
