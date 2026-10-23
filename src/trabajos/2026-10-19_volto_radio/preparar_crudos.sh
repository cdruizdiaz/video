#!/usr/bin/env bash
# Copia los originales de la radio y genera proxies 1080p, 30 fps constantes, rango estándar.
# Uso: bash src/trabajos/2026-10-19_volto_radio/preparar_crudos.sh
set -e
ID=2026-10-19_volto_radio
ORIGEN="C:/Users/LUCIA/Documents/RASTRO/Clientes/Volto.ia/Radio/Videos"
CRUDOS=C:/Videos/crudos/$ID
PROXIES=public/trabajos/$ID/crudos
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
FP=C:/Videos/_herramientas/ffmpeg/bin/ffprobe.exe
mkdir -p "$CRUDOS" "$PROXIES"
for f in "$ORIGEN"/*.MOV; do
  n=$(basename "$f"); b=${n%.*}
  [ -f "$CRUDOS/$n" ] && [ $(stat -c%s "$CRUDOS/$n") -eq $(stat -c%s "$f") ] || cp "$f" "$CRUDOS/$n"
  [ $(stat -c%s "$CRUDOS/$n") -eq $(stat -c%s "$f") ] || { echo "ERROR tamaño $n"; exit 1; }
  [ -f "$PROXIES/$b.mp4" ] && continue
  # Los iPhone graban casi todo en rango completo (yuvj420p, pc): se pasa a rango estándar
  # (CRITERIOS_REEL.md → Color). El 4K (IMG_7327) baja a 1080; los de 60 y 29,97 fps, a 30.
  RANGO=$("$FP" -v error -select_streams v:0 -show_entries stream=color_range -of csv=p=0 "$CRUDOS/$n" | tr -d ',\r\n')
  IN=tv; [ "$RANGO" = "pc" ] && IN=full
  "$FF" -hide_banner -loglevel error -y -i "$CRUDOS/$n" -map 0:v:0 -map 0:a:0 \
    -vf "fps=30,scale='if(gt(iw,ih),-2,1080)':'if(gt(iw,ih),1080,-2)':in_range=$IN:out_range=limited,format=yuv420p" \
    -c:v libx264 -preset veryfast -crf 20 -g 30 \
    -color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$PROXIES/$b.mp4"
  echo "ok $b"
done
echo listo
