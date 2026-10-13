#!/usr/bin/env bash
# Copia los originales (sin los duplicados "(1)") y genera proxies 30 fps constantes.
# Uso: bash src/trabajos/2026-10-06_volto_fashion-week/preparar_crudos.sh
set -e
ID=2026-10-06_volto_fashion-week
ORIGEN="c:/Users/LUCIA/Documents/RASTRO/Volto desfile"
CRUDOS=C:/Videos/crudos/$ID
PROXIES=public/trabajos/$ID/crudos
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
FP=C:/Videos/_herramientas/ffmpeg/bin/ffprobe.exe
# Cám. A (iPhone 16) grabó en HDR HLG; la B en SDR. A la A se le baja a SDR con mobius
# (elegido comparando un cuadro contra la B, 2026-10-06).
SDR="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
mkdir -p "$CRUDOS" "$PROXIES"
for f in "$ORIGEN"/IMG_????.mov "$ORIGEN"/IMG_????.MOV; do
  n=$(basename "$f"); b=${n%.*}
  [ -f "$CRUDOS/$n" ] && [ $(stat -c%s "$CRUDOS/$n") -eq $(stat -c%s "$f") ] || cp "$f" "$CRUDOS/$n"
  [ $(stat -c%s "$CRUDOS/$n") -eq $(stat -c%s "$f") ] || { echo "ERROR tamaño $n"; exit 1; }
  [ -f "$PROXIES/$b.mp4" ] && continue
  TRC=$("$FP" -v error -select_streams v:0 -show_entries stream=color_transfer -of csv=p=0 "$CRUDOS/$n" | tr -d ',
')
  PRE=""; [ "$TRC" = "arib-std-b67" ] && PRE="$SDR"
  # Cám. A: color original según la captura del cliente (color_referencia.py, ajustado sobre el
  # proxy sin LUT; para rehacerlo, generar el proxy sin esta línea).
  CUBE="public/trabajos/$ID/datos/color_camA.cube"
  [ "$TRC" = "arib-std-b67" ] && [ -f "$CUBE" ] && PRE="${PRE}lut3d=file=$CUBE,"
  # Solo el primer video y el primer audio (AAC estéreo); la rotación del iPhone se aplica sola.
  "$FF" -hide_banner -loglevel error -y -i "$CRUDOS/$n" -map 0:v:0 -map 0:a:0 \
    -vf "${PRE}fps=30,scale='if(gt(iw,ih),-2,1080)':'if(gt(iw,ih),1080,-2)'" \
    -c:v libx264 -preset veryfast -crf 20 -g 30 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$PROXIES/$b.mp4"
  echo "ok $b"
done
echo listo
