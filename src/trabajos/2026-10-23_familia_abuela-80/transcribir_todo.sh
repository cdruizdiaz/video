#!/usr/bin/env bash
# Transcribe cada clip (Whisper, tiempos por palabra) a datos/transcripciones/<clip>.json. Retomable.
set -uo pipefail
ID=2026-10-23_familia_abuela-80
ORIGEN="/c/Users/LUCIA/Documents/abuela 80/abuela mp4"
SALIDA="public/trabajos/$ID/datos/transcripciones"
for f in "$ORIGEN"/*.mp4; do
  n=$(basename "$f" .mp4)
  [ -f "$SALIDA/$n.json" ] && continue
  node scripts/transcribir.mjs "$f" "$SALIDA/$n.json" --prompt "Cumpleaños de la abuela, 80 años. Feliz cumpleaños." \
    && echo "ok $n" || echo "FALLÓ $n"
done
echo "transcripciones listas"
