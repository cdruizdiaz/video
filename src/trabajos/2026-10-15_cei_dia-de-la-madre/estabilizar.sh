#!/usr/bin/env bash
# Estabiliza la imagen de cada alumno (algunos grabaron con el teléfono en la mano y tiemblan): vidstab de ffmpeg
# en dos pasadas sobre los proxies de 1080×1920 → crudos/<alumno>_est.mp4 (sin audio; la voz sale de audio/voz).
# Suavizado de 15 cuadros y zoom automático mínimo para no mostrar bordes negros. Mismos cuadros y mismo fps
# que el proxy, así que la sincronía no cambia.
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-15_cei_dia-de-la-madre/estabilizar.sh
set -euo pipefail
ID=2026-10-15_cei_dia-de-la-madre
RAIZ="$(pwd)"
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
C="$RAIZ/public/trabajos/$ID/crudos"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
cd "$T"
for f in "$C"/*.mp4; do
  n=$(basename "$f" .mp4)
  case "$n" in *_hd|*_est) continue ;; esac
  [ -f "$C/${n}_est.mp4" ] && continue
  "$FF" -v error -y -i "$f" -vf "vidstabdetect=stepsize=6:shakiness=6:accuracy=15:result=t.trf" -f null -
  "$FF" -v error -y -i "$f" -vf "vidstabtransform=input=t.trf:smoothing=15:optzoom=1:zoomspeed=0.05:interpol=bicubic,unsharp=5:5:0.6:3:3:0.0" \
    -an -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -g 30 "$C/${n}_est.mp4"
  echo "listo $n"
done
