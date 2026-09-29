#!/usr/bin/env bash
# Música del video de 40 s: "Digital Clouds" de Alejandro Magaña (Mixkit, id 175).
# Tramo 0–40 s: arranque parejo (-14/-15 LUFS) y crecimiento desde el s 32, que cae en el cierre.
# Entrada de 0,3 s, salida de 2,5 s, normalizado a -14 LUFS (en Remotion va ~18 dB bajo la voz).
#
# Uso (desde la raíz del proyecto, en Git Bash):  bash src/trabajos/2026-09-28_volto_ia2026/preparar_musica.sh
set -euo pipefail

FFMPEG=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
ORIGEN=public/biblioteca/musica/mixkit/mixkit-175-digital-clouds.mp3
DESTINO=public/trabajos/2026-09-28_volto_ia2026/audio/musica-40s.wav
DUR=40

[ -f "$ORIGEN" ] || node scripts/mixkit.mjs bajar 175

"$FFMPEG" -hide_banner -loglevel error -y -ss 0 -t $DUR -i "$ORIGEN" \
  -af "afade=t=in:st=0:d=0.3,afade=t=out:st=$((DUR - 3)).5:d=2.5,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 "$DESTINO"

echo "Listo: $DESTINO"
