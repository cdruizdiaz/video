#!/usr/bin/env bash
# Voz de un clip de la radio con menos ruido (copia de 2026-10-06_volto_fashion-week/preparar_voz_entrevista.sh):
#  - voz_limpia/<clip>.wav: DeepFilterNet completo, solo para medir pausas y ubicar los cortes.
#  - voz_suave/<clip>.wav: DeepFilterNet con --atten-lim 15 y la entrada 6 dB más baja (si no, satura) para el montaje.
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-19_volto_radio/preparar_voz.sh <clip> [dB]
set -euo pipefail
ID=2026-10-19_volto_radio
CLIP=${1:?clip}
ATENUACION=${2:-15} # dB que baja el ruido (criterio de Volto: 15, sin robotizar)
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
DF=$(grep '"deepFilter"' scripts/herramientas.json | cut -d'"' -f4)
A=public/trabajos/$ID/audio
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/in" "$T/limpia" "$T/suave" $A/voz_limpia $A/voz_suave
"$FF" -v error -y -i public/trabajos/$ID/crudos/$CLIP.mp4 -map 0:a:0 -ac 1 -ar 48000 "$T/in/$CLIP.wav"
if [ ! -f $A/voz_limpia/$CLIP.wav ]; then
  "$DF" "$T/in/$CLIP.wav" -o "$T/limpia" >/dev/null 2>&1
  cp "$T/limpia/${CLIP}_DeepFilterNet3.wav" $A/voz_limpia/$CLIP.wav
fi
"$FF" -v error -y -i "$T/in/$CLIP.wav" -af volume=-6dB "$T/in/b.wav" && mv "$T/in/b.wav" "$T/in/$CLIP.wav"
"$DF" "$T/in/$CLIP.wav" --atten-lim $ATENUACION -o "$T/suave" >/dev/null 2>&1
cp "$T/suave/${CLIP}_DeepFilterNet3.wav" $A/voz_suave/$CLIP.wav
echo "listo: $A/voz_limpia/$CLIP.wav y $A/voz_suave/$CLIP.wav"
