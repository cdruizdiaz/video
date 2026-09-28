#!/usr/bin/env bash
# Música de la historia de RASTRO de 15 s: "Happy Home" de Michael Ramir C. (Mixkit, id 801).
# Tramo 93,7–108,7 s: último estribillo + cierre real del tema (el golpe final cae a los 14,3 s
# del video, sobre la escena de contacto). Entrada suave de 0,8 s, normalizado a -16 LUFS.
#
# Uso (desde la raíz del proyecto, en Git Bash):  bash src/trabajos/2026-09-28_rastro_historia-ig/preparar_musica_15s.sh
set -euo pipefail

FFMPEG=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
ORIGEN=public/biblioteca/musica/mixkit/mixkit-801-happy-home.mp3
DESTINO=public/trabajos/2026-09-28_rastro_historia-ig/audio/rastro-mixkit-15s.wav

[ -f "$ORIGEN" ] || node scripts/mixkit.mjs bajar 801

"$FFMPEG" -hide_banner -loglevel error -y -ss 93.7 -t 15 -i "$ORIGEN" \
  -af "afade=t=in:st=0:d=0.8,afade=t=out:st=14.8:d=0.2,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 "$DESTINO"

echo "Listo: $DESTINO"
