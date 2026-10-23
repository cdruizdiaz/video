#!/usr/bin/env bash
# Voz de cada alumno con menos ruido y más pareja, a partir del audio externo (audio/externo/<n>.wav).
#  1. entrada 6 dB más baja (a nivel original DeepFilterNet saturaba y dejaba chasquidos: ver Volto fashion-week);
#  2. DeepFilterNet con --atten-lim 18 (baja el ruido de la sala sin robotizar);
#  3. pasa-altos a 80 Hz, un poco de presencia (+2 dB a 3 kHz) y compresión suave para que las voces suaves
#     (Clara, Rosario) no queden por debajo de las fuertes.
# Salida: audio/voz/<n>.wav (mismo largo y mismo cuadro 0 que el externo: la sincronía no cambia).
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-15_cei_dia-de-la-madre/preparar_voz.sh
set -euo pipefail
ID=2026-10-15_cei_dia-de-la-madre
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
DF=$(grep '"deepFilter"' scripts/herramientas.json | cut -d'"' -f4)
A=public/trabajos/$ID/audio
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$A/voz" "$T/in" "$T/out"
for f in "$A"/externo/*.wav; do
  n=$(basename "$f" .wav)
  [ -f "$A/voz/$n.wav" ] && continue
  "$FF" -v error -y -i "$f" -af volume=-6dB "$T/in/$n.wav"
  "$DF" "$T/in/$n.wav" --atten-lim 18 -o "$T/out" >/dev/null 2>&1
  "$FF" -v error -y -i "$T/out/${n}_DeepFilterNet3.wav" \
    -af "highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=2,acompressor=threshold=-26dB:ratio=2.5:attack=8:release=140:makeup=3" \
    -ar 48000 -ac 1 "$A/voz/$n.wav"
  echo "listo $n"
done
