#!/usr/bin/env bash
# Proxies de video (1080×1920, 30 fps constantes) y audios externos de cada alumno, con nombres sin tildes.
# Originales: C:/Videos/crudos/<ID>/ (los .MOV son 4K HEVC 24 fps con rotación -90: ffmpeg los endereza solo).
# Uso: bash preparar_crudos.sh
set -e
ID=2026-10-15_cei_dia-de-la-madre
ORIG="C:/Videos/crudos/$ID"
DEST="C:/Users/LUCIA/Documents/RASTRO/Edición IA/video/public/trabajos/$ID"
FF="C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"

# nombre corto | video original | audio externo original (* = letra con tilde o eñe, que puede venir descompuesta; se resuelve con find)
FILAS=(
  "aglieri-olivia|Aglieri Olivia.MOV|Aglieri Olivia.m4a"
  "alvarez-lola|Alvarez Lola. .MOV|*lvarez Lola.m4a"
  "azanza-amparo|Azanza Amparo.MOV|Azanza Amparo.m4a"
  "bautista-rosario|Bautista Rosario. .mov|Bautista Rosario.m4a"
  "benuzzi-dante|Benuzzi Dante.MOV|Dante - High Junior.m4a"
  "ciorciari-santiago|Ciorciari Santiago.MOV|Santiago Ciorciari- 1 A*o.m4a"
  "gauna-alfonsina|Gauna Alfonsina.MOV|Gauna Alfonsina.m4a"
  "macagno-sofia|Macagno Sofia.MOV|Sofi Macagno- Low Junior.m4a"
  "mastropaolo-ricardo|Mastropaolo Ricardo.MOV|Ricky Mastropaolo - 6to A*o.m4a"
  "mellis-silvero|Mellis Silvero.MOV|Mellis Silvero - High Junior.m4a"
  "meresman-mateo|Meresman Mateo.MOV|Meresman Mateo.m4a"
  "perello-clara|Perello Clara.MOV|Perello Clara.m4a"
  "di-gerolamo-pilar|Pilar Di Gerolamo.MOV|Di Gerolamo Pilar.m4a"
  "rodrigo-antonia|Rodrigo Antonia.MOV|Rodrigo Rosario.m4a"
  "sartore-naiara|Sartore Naiara.MOV|Naiara Sartore - 5to.m4a"
)

mkdir -p "$DEST/crudos" "$DEST/audio/externo"
for fila in "${FILAS[@]}"; do
  IFS='|' read -r nombre video audio <<< "$fila"
  if [ ! -f "$DEST/crudos/$nombre.mp4" ]; then
    "$FF" -y -loglevel error -i "$ORIG/$video" \
      -vf "scale=1080:1920,fps=30,format=yuv420p" \
      -c:v libx264 -preset veryfast -crf 20 -g 30 \
      -c:a aac -ar 48000 -b:a 160k "$DEST/crudos/$nombre.mp4"
  fi
  if [ ! -f "$DEST/audio/externo/$nombre.wav" ]; then
    AUD="$(find "$ORIG" -maxdepth 1 -name "$audio" | head -n 1)"
    "$FF" -y -loglevel error -i "$AUD" -ar 48000 -ac 1 "$DEST/audio/externo/$nombre.wav"
  fi
  echo "ok $nombre"
done

# Copias de mayor resolución (1620×2880) para los acercamientos de hasta 1,5×: con los proxies de 1080 se ve blando.
for fila in "${FILAS[@]}"; do
  IFS='|' read -r nombre video audio <<< "$fila"
  if [ ! -f "$DEST/crudos/${nombre}_hd.mp4" ]; then
    "$FF" -y -loglevel error -i "$ORIG/$video" \
      -vf "scale=1620:2880,fps=30,format=yuv420p" \
      -c:v libx264 -preset veryfast -crf 18 -g 30 -an "$DEST/crudos/${nombre}_hd.mp4"
  fi
  echo "hd $nombre"
done
