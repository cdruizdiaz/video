#!/usr/bin/env bash
# Proxies 1080x1920 / 30 fps CFR. iPhone 4K HEVC rotado (vertical), rango completo (yuvj420p) → rango estándar
# (CRITERIOS_REEL → Color). Mismo material que 2026-10-21_rastro_consumos-del-mes.
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-23_rastro_newsletter-animana/proxies.sh
set -e
ID=2026-10-23_rastro_newsletter-animana
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
# Grabaciones de pantalla (insertos): 60 → 30 fps, tamaño original (se escalan en Remotion)
mkdir -p "$D/pantalla"
for f in "$O"/grab_pantalla/*.mp4; do
  n=$(basename "$f" .mp4)
  $FF -y -v error -i "$f" -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 18 -g 30 -an "$D/pantalla/$n.mp4"
  echo "ok $n"
done
