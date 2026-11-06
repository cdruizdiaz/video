#!/bin/bash
# R2 editado v8: inserts del loft para "Como en casa, pero sin lavar un plato." (C0165, C0164) desde el 4K:
# vertical, estabilizados (vidstab en dos pasadas, zoom fijo 4 %, sin zoom adaptativo) y con luz + contraste + color (no grises).
set -e
F=/c/Videos/_herramientas/ffmpeg/bin
L="C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara/Loft"
P=public/trabajos/2026-10-28_docba_r2-nov/crudos
T=$(mktemp -d)
curva="curves=all='0/0 0.1/0.06 0.5/0.52 0.9/0.94 1/1'"
hacer() { # clip desde dur gamma color_extra
  local n=${1,,}
  $F/ffmpeg -v error -y -ss $2 -t $3 -i "$L/$1.MP4" -an -vf "transpose=2,scale=1080:1920:flags=lanczos,fps=30" -c:v libx264 -crf 12 -preset fast "$T/$n.mp4"
  (cd "$T" && $F/ffmpeg -v error -y -i $n.mp4 -vf "vidstabdetect=shakiness=6:accuracy=15:result=$n.trf" -f null -)
  (cd "$T" && $F/ffmpeg -v error -y -i $n.mp4 -an -vf "vidstabtransform=input=$n.trf:smoothing=12:zoom=4:optzoom=0:interpol=bicubic,hqdn3d=1.5:1.5:3:3,eq=gamma=$4,$curva,$5,format=yuv420p" -c:v libx264 -crf 16 -preset medium out_$n.mp4)
  cp "$T/out_$n.mp4" "$P/ins_${n}_est.mp4"
}
hacer C0165 0.2 1.6 1.35 "eq=saturation=1.2,vibrance=0.25"
hacer C0164 6.6 1.8 1.55 "colorbalance=rm=0.03:gm=0.005:bm=-0.03,eq=saturation=1.28,vibrance=0.3"
rm -rf "$T"; echo listo
