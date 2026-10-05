#!/usr/bin/env bash
# Música del trabajo: Mixkit 49 "Rock the Game" (Ahjay Stelino), tramo de 8 s de más energía que arranca en un
# compás (64,157 s; 120 bpm → 16 pulsos = 240 cuadros a 30 fps), fundidos cortos y -14 LUFS (loudnorm en 2 pasadas).
# Uso (desde la raíz del proyecto): bash src/trabajos/2026-10-04_claudio_bloomie-rock/preparar_musica.sh
set -euo pipefail
FFMPEG=$(node -p "require('./scripts/herramientas.json').ffmpeg")
ID=2026-10-04_claudio_bloomie-rock
ORIG=public/biblioteca/musica/mixkit/mixkit-49-rock-the-game.mp3
SAL=public/trabajos/$ID/audio/rock_8s.wav
DESDE=64.157
DURA=8
FILTRO="atrim=start=$DESDE:duration=$DURA,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=7.3:d=0.7"
MED=$("$FFMPEG" -hide_banner -nostats -i "$ORIG" -af "$FILTRO,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
val() { echo "$MED" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
"$FFMPEG" -y -hide_banner -loglevel error -i "$ORIG" \
  -af "$FILTRO,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset):linear=true" \
  -ar 48000 -ac 2 "$SAL"
"$FFMPEG" -hide_banner -nostats -i "$SAL" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
