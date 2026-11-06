#!/usr/bin/env bash
# Música de la pieza (15 s): "Coffee or Tea" (Mixkit, id 1168; electrónica positiva, 103,4 bpm).
# Tramo 27,609–42,609 s: arranca justo en un compás (el primer golpe cae en el cuadro 0) y es la
# zona de más energía del tema. Fundido de salida de 0,6 s, normalizado a -18 LUFS (pedido del brief;
# en la mezcla queda bajo la voz y la final se normaliza a -14 LUFS).
# Después: pulsos del tramo (tiempos relativos al video) → datos/pulsos.json.
#
# Uso (desde la raíz del proyecto, en Git Bash):  bash src/trabajos/2026-10-20_claudio_motion-graphic-prueba/preparar_musica.sh
set -euo pipefail

ID=2026-10-20_claudio_motion-graphic-prueba
FFMPEG=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
PY=$(grep '"python"' scripts/herramientas.json | cut -d'"' -f4)
ORIGEN=public/biblioteca/musica/mixkit/mixkit-1168-coffee-or-tea.mp3
DESTINO=public/trabajos/$ID/audio/musica_15s.wav

[ -f "$ORIGEN" ] || node scripts/mixkit.mjs bajar 1168

"$FFMPEG" -hide_banner -loglevel error -y -ss 27.609 -t 15 -i "$ORIGEN" \
  -af "afade=t=in:st=0:d=0.05,afade=t=out:st=14.4:d=0.6,loudnorm=I=-18:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 "$DESTINO"

"$PY" scripts/pulsos.py "$DESTINO" public/trabajos/$ID/datos/pulsos.json

echo "Listo: $DESTINO"
