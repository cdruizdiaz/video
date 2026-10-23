#!/usr/bin/env bash
# Voz del conductor de un tramo de IMG_7180-002: en el iPhone queda ~26 dB por debajo de Nacho (está lejos del
# micrófono). DeepFilterNet sobre el original lo borra (lo toma por ruido): primero se sube 20 dB (limitador para
# no saturar) con un pasa-altos de 70 Hz, y recién ahí DeepFilterNet con --atten-lim 24 (CRITERIOS_REEL.md →
# "Micrófono muy bajo"). Ninguna palabra pierde más de 8 dB respecto del original (medido 2026-10-22).
# Después se sube 7,5 dB (queda en ≈ -19 LUFS, como las tomas de Nacho) con un limitador a -6 dBFS: tiene un pico
# suelto 22 dB arriba de su voz.
# Salida: audio/voz_conductor/conductor_<desde>.wav, cuyo segundo 0 es el segundo <desde> del clip.
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-19_volto_radio/preparar_voz_conductor.sh <desde_s> <duración_s>
set -euo pipefail
ID=2026-10-19_volto_radio
DESDE=${1:?desde (s)}
DURA=${2:?duración (s)}
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
DF=$(grep '"deepFilter"' scripts/herramientas.json | cut -d'"' -f4)
A=public/trabajos/$ID/audio/voz_conductor
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/out" $A
"$FF" -v error -y -ss "$DESDE" -t "$DURA" -i public/trabajos/$ID/crudos/IMG_7180-002.mp4 -map 0:a:0 -ac 1 -ar 48000 \
  -af "highpass=f=70,volume=20dB,alimiter=limit=0.9" "$T/c.wav"
"$DF" "$T/c.wav" --atten-lim 24 -o "$T/out" >/dev/null 2>&1
"$FF" -v error -y -i "$T/out/c_DeepFilterNet3.wav" -af "volume=7.5dB,alimiter=limit=0.5:level=false" $A/conductor_$DESDE.wav
echo "listo: $A/conductor_$DESDE.wav"
