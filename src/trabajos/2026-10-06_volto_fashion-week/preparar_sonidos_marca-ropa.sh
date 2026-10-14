#!/usr/bin/env bash
# Pieza 1 (marca de ropa): efectos que no tenía la entrevista (los demás se reusan de preparar_sonidos_entrevista.sh).
#  - whoosh.wav: Mixkit 1492 "Cinematic whoosh fast transition", pico -3 dBFS (logo de la SFFW detrás de él).
#  - pregunta.wav: pop.wav (Mixkit 3005) 5 semitonos más agudo (signos de pregunta).
#  - cuenta.wav: compuesto por código (sonido_cuenta.py): golpecitos que suben con la cifra y un "ding".
#  - zoom.wav: compuesto por código (sonido_zoom.py): zoom corto para el empuje de "sí o sí".
#  (whoosh.wav quedó sin uso: el cliente sacó el barrido del logo de la SFFW, 2026-10-09)
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-06_volto_fashion-week/preparar_sonidos_marca-ropa.sh
set -euo pipefail
ID=2026-10-06_volto_fashion-week
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
PY=$(grep '"python"' scripts/herramientas.json | cut -d'"' -f4)
B=public/biblioteca; A=public/trabajos/$ID/audio
pico(){ "$FF" -hide_banner -nostats -i "$1" -af volumedetect -f null - 2>&1 | grep max_volume | awk '{print $5}'; }
"$FF" -hide_banner -loglevel error -y -i $B/sfx/mixkit/mixkit-1492-cinematic-whoosh-fast-transition.wav -ac 2 -ar 48000 $A/_x.wav
"$FF" -hide_banner -loglevel error -y -i $A/_x.wav -af "volume=$(awk "BEGIN{print -3-($(pico $A/_x.wav))}")dB" $A/whoosh.wav
rm $A/_x.wav
"$FF" -hide_banner -loglevel error -y -i $A/pop.wav -af "rubberband=pitch=$(awk "BEGIN{print 2^(5/12)}")" $A/pregunta.wav
"$PY" src/trabajos/2026-10-06_volto_fashion-week/sonido_cuenta.py $A/cuenta.wav
"$PY" src/trabajos/2026-10-06_volto_fashion-week/sonido_zoom.py $A/zoom.wav
for f in whoosh pregunta cuenta zoom; do echo "$f: pico $(pico $A/$f.wav) dB, $("${FF%ffmpeg.exe}ffprobe.exe" -v error -show_entries format=duration -of csv=p=0 $A/$f.wav) s"; done
