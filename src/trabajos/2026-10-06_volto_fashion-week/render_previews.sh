#!/usr/bin/env bash
# Previews para el cliente: render 1080×1920 de cada composición "preview-*" y audio a -14 LUFS
# (loudnorm en dos pasadas, video copiado sin recodificar). Salida: out/<ID>/final/preview-<idea>_9x16_v<N>.mp4
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-06_volto_fashion-week/render_previews.sh [v] [idea…]
#   (sin ideas: todas; con una versión nueva, nombrar solo las que cambiaron)
set -euo pipefail
ID=2026-10-06_volto_fashion-week
V=${1:-1}; shift || true
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
TMP=out/$ID/revision/tmp_previews; mkdir -p "$TMP" out/$ID/final
IDEAS=${*:-marca-ropa whatsapp-reventado tienda-nube casamiento-viernes entrevista-radio lanzamientos-pauta veni-seguime}
for idea in $IDEAS; do
  final=out/$ID/final/preview-${idea}_9x16_v$V.mp4
  [ -f "$final" ] && { echo "ya existe $final (no se pisa)"; continue; }
  npx remotion render src/index.ts volto-fashion-week-preview-$idea "$TMP/$idea.mp4" --crf=18 --log=error
  m=$("$FF" -hide_banner -nostats -i "$TMP/$idea.mp4" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  val(){ echo "$m" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
  "$FF" -hide_banner -loglevel error -y -i "$TMP/$idea.mp4" -c:v copy \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset):linear=true,aresample=48000" \
    -c:a aac -b:a 192k -movflags +faststart "$final"
  echo "$final: $("$FF" -hide_banner -nostats -i "$final" -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+(I|Peak):' | tr -s ' ' | tr '\n' ' ')"
done
rm -rf "$TMP"
