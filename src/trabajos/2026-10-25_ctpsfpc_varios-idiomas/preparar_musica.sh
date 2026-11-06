#!/usr/bin/env bash
# Música de fondo: Mixkit 33 "Motivating Mornings" (corporativa, con empuje, 123 bpm). Pedido 2026-10-25, borrador A:
# "la música parece media tétrica, dame algo con más energía o dinamismo" (antes: Mixkit 440 "Infinity").
# Arranca en un compás (DESDE, de scripts/pulsos.py) elegido para que el final propio del tema (~92,5 s) caiga con el
# final de la placa; DURACION = duración del reel. Fundido de entrada corto, de salida en el último segundo; -14 LUFS
# (dos pasadas). La plantilla la baja bajo la voz (musicaBajoVozDb) y la sube en la placa (musicaCierreDb).
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-25_ctpsfpc_varios-idiomas/preparar_musica.sh [duración s]
set -euo pipefail
ID=2026-10-25_ctpsfpc_varios-idiomas
DESDE=43.65
DURACION=${1:-48.9}
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
SRC=public/biblioteca/musica/mixkit/mixkit-33-motivating-mornings.mp3
OUT=public/trabajos/$ID/audio/musica.wav
FILTRO="atrim=$DESDE:$(awk "BEGIN{print $DESDE+$DURACION}"),asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st=$(awk "BEGIN{print $DURACION-1}"):d=1"
J=$("$FF" -hide_banner -i $SRC -af "$FILTRO,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p')
v() { echo "$J" | grep "\"$1\"" | cut -d'"' -f4; }
"$FF" -v error -y -i $SRC -af "$FILTRO,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true" -ar 48000 -c:a pcm_s16le $OUT
"$FF" -i $OUT -af ebur128=peak=true -f null - 2>&1 | grep -A3 "Integrated loudness" | grep " I:"
