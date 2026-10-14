#!/usr/bin/env bash
# Música de fondo: "Happy Home" (Mixkit 801, Michael Ramir C., licencia Mixkit Stock Music Free) normalizada a
# -14 LUFS. El ducking bajo las voces lo hace la plantilla (ExplicacionGeometrica: MUSICA_DUCK).
set -e
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
ID=2026-10-08_los-amigos-mat_teorema-pitagoras
"$FF" -y -v error -i public/biblioteca/musica/mixkit/mixkit-801-happy-home.mp3 \
  -af "afade=t=in:d=1,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -ac 2 "public/trabajos/$ID/audio/musica.wav"
"$FF" -v info -i "public/trabajos/$ID/audio/musica.wav" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:" | tail -2
