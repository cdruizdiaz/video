#!/usr/bin/env bash
# Proxies 1080x1920 / 30 fps CFR. iPhone en rango completo (yuvj420p) → rango estándar (CRITERIOS_REEL → Color).
set -e
ID=2026-10-21_rastro_pau-mascota
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
O=C:/Videos/crudos/$ID
D="$(dirname "$0")/../../../public/trabajos/$ID/crudos"
for f in "$O"/pau/*.MOV; do
  n=$(basename "$f" .MOV)
  $FF -y -v error -i "$f" -vf "scale=1080:1920:in_range=full:out_range=limited,fps=30,format=yuv420p" \
    -c:v libx264 -preset veryfast -crf 20 -g 30 -color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
    -c:a aac -b:a 192k -ar 48000 "$D/$n.mp4"
  echo "ok $n"
done
i=1
for f in "$O"/grab\ pantalla/*.mp4; do
  $FF -y -v error -i "$f" -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 20 -g 30 -an "$D/pantalla$i.mp4"
  echo "ok pantalla$i"; i=$((i+1))
done
# Plano de la hoja de bocetos (IMG_9053, 1,78–2,42 s, pedido 2026-10-21): recorte 1080×1920 del original 4K centrado
# en la hoja (= zoom 2× sin perder definición). Centro de la hoja en el proxy: (460, 930) → (920, 1860) en 4K.
$FF -y -v error -i "$O/pau/IMG_9053.MOV" -vf "crop=1080:1920:380:900,scale=in_range=full:out_range=limited,fps=30,format=yuv420p" \
  -c:v libx264 -preset veryfast -crf 18 -g 30 -color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
  -c:a aac -b:a 192k -ar 48000 "$D/IMG_9053p.mp4"
echo "ok IMG_9053p"
