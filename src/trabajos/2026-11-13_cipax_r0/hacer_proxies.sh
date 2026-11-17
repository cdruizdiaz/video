#!/bin/bash
# Crudos iPhone 4K HEVC SDR (bt709, rango completo yuvj420p, rotación -90): se pasan a rango estándar -> proxies 1080x1920, 30 fps constantes, AAC 48 kHz.
# Uso: bash hacer_proxies.sh
export PATH="/c/Videos/_herramientas/ffmpeg/bin:$PATH"
ID=2026-11-13_cipax_r0
SRC=C:/Videos/crudos/$ID
cd "$(dirname "$0")/../../../public/trabajos/$ID/crudos" || exit 1
hacer() { n=$(basename "$1" .MOV); [ -f "$n.mp4" ] || ffmpeg -v error -y -i "$1" -vf "fps=30,scale=1080:1920:flags=lanczos:in_range=full:out_range=limited,format=yuv420p" -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:v libx264 -preset veryfast -crf 20 -g 30 -c:a aac -ar 48000 -b:a 160k "$n.mp4"; }
export -f hacer
ls $SRC/*.MOV | xargs -P 4 -I{} bash -c 'hacer "{}"'
echo LISTO
