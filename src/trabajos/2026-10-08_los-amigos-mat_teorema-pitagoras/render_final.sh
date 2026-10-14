#!/bin/bash
# Render final de una versión: Remotion → loudnorm -14 LUFS (video sin recodificar) → ebur128 → copia liviana 720p.
# Uso: bash src/trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/render_final.sh 7
set -e
V=$1
ID=2026-10-08_los-amigos-mat_teorema-pitagoras
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
R=out/$ID/revision; F=out/$ID/final/teorema-pitagoras_9x16_v$V
[ -e "$F.mp4" ] && { echo "Ya existe $F.mp4"; exit 1; }
echo "inicio $(date +%H:%M)"
npx remotion render src/index.ts amigos-mat-pitagoras-9x16 "$R/v${V}_sin_normalizar.mp4" --crf=18
"$FF" -y -loglevel error -i "$R/v${V}_sin_normalizar.mp4" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k "$F.mp4"
"$FF" -hide_banner -i "$F.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
"$FF" -y -loglevel error -i "$F.mp4" -vf scale=720:1280 -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k "${F}_whatsapp.mp4"
echo "fin $(date +%H:%M)"
