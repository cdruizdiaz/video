#!/usr/bin/env bash
# Proxies 1080x1920 / 30 fps CFR. iPhone 4K HEVC rotado (vertical; IMG_8277 rotado +90, a 30 fps justos), rango
# completo (yuvj420p) → rango estándar (CRITERIOS_REEL → Color). Grabaciones de pantalla de Affinity (1920×1020,
# 60 fps) → 30 fps, mismo tamaño, con su audio.
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-23_rastro_affinity-dia-01/proxies.sh
set -e
ID=2026-10-23_rastro_affinity-dia-01
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
O=C:/Videos/crudos/$ID
D=public/trabajos/$ID/crudos
for f in "$O"/*.MOV; do
  n=$(basename "$f" .MOV)
  $FF -y -v error -i "$f" -vf "scale=1080:1920:in_range=full:out_range=limited,fps=30,format=yuv420p" \
    -c:v libx264 -preset veryfast -crf 20 -g 30 -color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
    -c:a aac -b:a 192k -ar 48000 "$D/$n.mp4"
  echo "ok $n"
done
mkdir -p "$D/pantalla"
for f in "$O"/pantalla/*.mp4; do
  n=$(basename "$f" .mp4)
  $FF -y -v error -i "$f" -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 18 -g 30 \
    -c:a aac -b:a 160k -ar 48000 "$D/pantalla/$n.mp4"
  echo "ok $n"
done
