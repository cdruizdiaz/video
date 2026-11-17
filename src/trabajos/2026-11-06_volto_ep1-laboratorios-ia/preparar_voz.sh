#!/usr/bin/env bash
# Voz de IMG_7203 mejorada sin robotizar (pedido 2026-11-06: "mejorá el audio sin que quede robótico"):
#  - DeepFilterNet con --atten-lim limitado (por defecto 12 dB) y la entrada 6 dB más baja (si no, satura);
#  - se mezcla un 15 % del original (sin eso la voz queda "de robot", DOCBA R2 2026-10-30);
#  - pasa-altos suave a 70 Hz (golpes y zumbido de la sala), sin compresión fuerte.
# Solo el tramo que usa el reel (0–70 s del original), misma línea de tiempo que el clip.
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-11-06_volto_ep1-laboratorios-ia/preparar_voz.sh [dB] [mezcla]
set -euo pipefail
ID=2026-11-06_volto_ep1-laboratorios-ia
ATENUACION=${1:-12}
ORIGINAL=${2:-0.15}
TRAMO=70
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
DF=$(grep '"deepFilter"' scripts/herramientas.json | cut -d'"' -f4)
A=public/trabajos/$ID/audio
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/in" "$T/out"
"$FF" -v error -y -t $TRAMO -i $A/IMG_7203_original.wav -ac 1 -ar 48000 -af volume=-6dB "$T/in/voz.wav"
"$DF" "$T/in/voz.wav" --atten-lim "$ATENUACION" -o "$T/out" >/dev/null 2>&1
"$FF" -v error -y -i "$T/out/voz_DeepFilterNet3.wav" -i "$T/in/voz.wav" -filter_complex \
  "[0:a]volume=$(node -e "console.log(1-$ORIGINAL)")[l];[1:a]volume=$ORIGINAL[o];[l][o]amix=inputs=2:normalize=0,highpass=f=70,volume=6dB" \
  -ar 48000 $A/voz.wav
echo "listo: $A/voz.wav"
