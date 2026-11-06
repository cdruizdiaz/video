#!/usr/bin/env bash
# Música del reel: "Smile" (Mixkit 1076) desde 0, 36 s con fundido final, a -14 LUFS.
set -e
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
ID=2026-11-03_cei_visita-cementerio
"$FF" -v error -y -i public/biblioteca/musica/mixkit/mixkit-1076-smile.mp3 \
  -af "atrim=0:36,asetpts=PTS-STARTPTS,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 public/trabajos/$ID/audio/musica.wav
