#!/usr/bin/env bash
# Copia los originales a la carpeta de crudos (verificando tamaños) y arma proxies 1080p 30 fps.
set -euo pipefail
ID=2026-10-23_familia_abuela-80
ORIGEN="/c/Users/LUCIA/Documents/abuela 80/abuela mp4"
CRUDOS="C:/Videos/crudos/$ID"
PROXIES="public/trabajos/$ID/crudos"
FFMPEG=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
for f in "$ORIGEN"/*.mp4; do
  n=$(basename "$f")
  if [ ! -f "$CRUDOS/$n" ] || [ "$(stat -c%s "$f")" != "$(stat -c%s "$CRUDOS/$n")" ]; then
    cp "$f" "$CRUDOS/$n"
  fi
  [ "$(stat -c%s "$f")" = "$(stat -c%s "$CRUDOS/$n")" ] || { echo "TAMAÑO DISTINTO: $n"; exit 1; }
done
echo "copia ok"
for f in "$CRUDOS"/*.mp4; do
  n=$(basename "$f")
  [ -f "$PROXIES/$n" ] && continue
  "$FFMPEG" -v error -y -i "$f" -vf "scale=-2:1080,fps=30" -c:v libx264 -preset veryfast -crf 20 -g 30 \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$PROXIES/$n.tmp.mp4"
  mv "$PROXIES/$n.tmp.mp4" "$PROXIES/$n"
  echo "proxy $n"
done
echo "proxies ok"
