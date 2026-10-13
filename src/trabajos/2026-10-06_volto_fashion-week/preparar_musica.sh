#!/usr/bin/env bash
# Música de las piezas 2 y 3 (Mixkit, elegidas el 2026-10-06; "no corporativa"):
#   whatsapp-reventado: "Cat Walk" de Arulo (id 371), 0–53,4 s
#   tienda-nube:        "Tech House vibes" de Alejandro Magaña (id 130), 0–54,9 s
# Entrada de 1 s, salida de 1,5 s, normalizada a -14 LUFS (en la mezcla va unos 15 dB bajo la voz).
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-06_volto_fashion-week/preparar_musica.sh
set -euo pipefail
FFMPEG=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
DEST=public/trabajos/2026-10-06_volto_fashion-week/audio
mkdir -p "$DEST"
preparar() { # origen id duración destino
  [ -f "$1" ] || node scripts/mixkit.mjs bajar "$2"
  "$FFMPEG" -hide_banner -loglevel error -y -t "$3" -i "$1" \
    -af "afade=t=in:st=0:d=1,afade=t=out:st=$(awk -v d="$3" 'BEGIN{print d-1.5}'):d=1.5,loudnorm=I=-14:TP=-1.5:LRA=11" \
    -ar 48000 -ac 2 "$DEST/$4"
  echo "Listo: $DEST/$4"
}
preparar public/biblioteca/musica/mixkit/mixkit-371-cat-walk.mp3 371 53.4 musica-whatsapp-reventado.wav
preparar public/biblioteca/musica/mixkit/mixkit-130-tech-house-vibes.mp3 130 54.9 musica-tienda-nube.wav
