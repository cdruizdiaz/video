#!/usr/bin/env bash
# Voz de las tomas con menos ruido de calle, sin robotizarla (CRITERIOS_REEL → Audio): pasa-altos 70 Hz y
# DeepFilterNet con --atten-lim 12 (mismo criterio que 2026-10-25_ctpsfpc_varios-idiomas: micrófono corbatero;
# solo hay que bajar el tránsito). Cada toma a -19 LUFS (ganancia fija medida con ebur128 + limitador en picos).
# Sale audio/voz/<clip>.wav, misma línea de tiempo que el proxy (opción `audios` de HablaSubtitulada).
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion/preparar_voz.sh
set -euo pipefail
ID=2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion
ATENUACION=12
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
DF=$(grep '"deepFilter"' scripts/herramientas.json | cut -d'"' -f4)
A=public/trabajos/$ID/audio/voz
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/in" "$T/out" $A
for CLIP in IMG_8443 IMG_8447 IMG_8456 IMG_8479 IMG_8481 IMG_8488 IMG_8497 IMG_8500; do
  "$FF" -v error -y -i public/trabajos/$ID/crudos/$CLIP.mp4 -map 0:a:0 -ac 1 -ar 48000 -af "highpass=f=70" "$T/in/$CLIP.wav"
done
"$DF" "$T"/in/*.wav --atten-lim $ATENUACION -o "$T/out" >/dev/null 2>&1
lufs() { "$FF" -i "$1" -af ebur128 -f null - 2>&1 | grep -A2 "Integrated loudness" | grep " I:" | awk '{print $2}'; }
for f in "$T"/out/*_DeepFilterNet3.wav; do
  n=$(basename "$f" _DeepFilterNet3.wav)
  I=$(lufs "$f")
  G=$(awk "BEGIN{print -19 - ($I)}")
  "$FF" -v error -y -i "$f" -af "volume=${G}dB,alimiter=limit=0.84:attack=2:release=60:level=disabled" -c:a pcm_s16le $A/$n.wav
  echo "  $n: $I LUFS → -19 (ganancia $G dB)"
done
