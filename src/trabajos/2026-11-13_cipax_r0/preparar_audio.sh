#!/bin/bash
# Voz: el audio de cada toma (proxy), llevado a ~-20 LUFS según lo medido con ebur128 en el tramo que se usa
# (tomas grabadas al aire libre con el iPhone, fondo ~-60 dB: no hace falta DeepFilterNet).
# Música: Mixkit 130 "Tech House vibes" (biblioteca), 0–40 s, fundido de salida, normalizada a -14 LUFS.
# Uso: bash preparar_audio.sh
export PATH="/c/Videos/_herramientas/ffmpeg/bin:$PATH"
ID=2026-11-13_cipax_r0
cd "$(dirname "$0")/../../.." || exit 1
C=public/trabajos/$ID/crudos; A=public/trabajos/$ID/audio
voz() { ffmpeg -v error -y -i $C/IMG_$1.mp4 -vn -af "highpass=f=70,volume=$2dB,alimiter=limit=0.89" -ar 48000 -ac 1 $A/voz_$1.wav; }
voz 9589 6.8; voz 9590 1.8; voz 9592 4.0; voz 9595 3.2; voz 9597 4.9; voz 9599 8.4
ffmpeg -v error -y -i public/biblioteca/musica/mixkit/mixkit-130-tech-house-vibes.mp3 -t 40 -af "afade=t=out:st=37:d=3,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 $A/musica.wav
for f in $A/*.wav; do echo -n "$(basename $f) "; ffmpeg -i $f -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1; done
