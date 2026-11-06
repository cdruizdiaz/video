#!/bin/bash
# Los crudos del iPhone son HDR (HLG, BT.2020): se pasan a SDR BT.709 con tonemap (mobius, npl 1000) para que se vean normales.
# Proxies 1080x1920 (el crudo ya viene 1080p con rotación -90), 30 fps constantes, audio AAC 48 kHz. Uso: bash hacer_proxies.sh
export PATH="/c/Videos/_herramientas/ffmpeg/bin:$PATH"
ID=2026-10-29_cei_halloween
SRC=C:/Videos/crudos/$ID
cd "$(dirname "$0")/../../../public/trabajos/$ID/crudos" || exit 1
hacer() { n=$(basename "$1" .MOV); [ -f "$n.mp4" ] || ffmpeg -v error -y -i "$1" -vf "fps=30,zscale=t=linear:npl=1000,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p" -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:v libx264 -preset veryfast -crf 20 -g 30 -c:a aac -ar 48000 -b:a 160k "$n.mp4"; }
export -f hacer
ls $SRC/*.MOV | xargs -P 4 -I{} bash -c 'hacer "{}"'
echo LISTO
