#!/bin/bash
# Transcribe todos los proxies (es); los que salgan raros se repiten con --idioma en
cd "$(dirname "$0")/../../.."
ID=2026-10-29_cei_halloween
for f in public/trabajos/$ID/crudos/*.mp4; do
  n=$(basename "$f" .mp4)
  out=public/trabajos/$ID/datos/t_$n.json
  [ -f "$out" ] || node scripts/transcribir.mjs "$f" "$out" || echo "FALLO $n"
done
echo FIN
