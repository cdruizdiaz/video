#!/usr/bin/env bash
# Pieza 6 (entrevista de radio): música del final y efectos, preparados desde la biblioteca de Mixkit.
#  - musica-final-entrevista.wav: "Digital Clouds" (Mixkit 175, la misma del reel ia2026), 4,0–8,8 s del tema
#    (arranca en 3 s), entrada de 0,6 s y salida de 1,2 s, a -14 LUFS.
#  - tecla.wav: Mixkit 2542 "Hard single key press in a laptop", sin el silencio inicial (0,11 s), pico -3 dBFS.
#  - interfaz.wav: Mixkit 2574 "Software interface start", pico -3 dBFS.
#  - clic.wav: Mixkit 1113 "Mouse click close" (reemplaza a la tecla, que casi no se oía), desde el golpe
#    (0,008 s), 0,3 s, pico -1 dBFS.
#  - Insertos gráficos (pedido 2026-10-08), todos a pico -3 dBFS:
#    pop.wav (Mixkit 3005, logos) · robot.wav (Mixkit 3122, 0,48–2,08 s) · error.wav (Mixkit 2964, 0,25 s)
#    acierto.wav (Mixkit 2870, 0,65 s con salida) · tipeo.wav (Mixkit 2531, 1,2 s con salida)
#    tictac.wav (Mixkit 1060 a 3× sin cambiar el tono: el tiempo corre rápido y cada tic suena entero; 4,25 s)
#  - Para que no se repitan: un sonido por logo (logo-tn.wav Mixkit 2568, logo-wa.wav Mixkit 2356,
#    logo-ig.wav Mixkit 2357, también para WhatsApp; el de la SFFW sigue siendo pop.wav) y escaleras de tono
#    (rubberband, misma duración) en lo que suena seguido: dia-1..7 (pop, escala mayor hacia arriba) y
#    acierto-1..4 (suben como un acorde: positivo). Los errores van con el mismo beep (pedido del cliente).
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-06_volto_fashion-week/preparar_sonidos_entrevista.sh
set -euo pipefail
ID=2026-10-06_volto_fashion-week
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
B=public/biblioteca; A=public/trabajos/$ID/audio
pico(){ "$FF" -hide_banner -nostats -i "$1" -af volumedetect -f null - 2>&1 | grep max_volume | awk '{print $5}'; }
"$FF" -hide_banner -loglevel error -y -ss 4.0 -t 4.8 -i $B/musica/mixkit/mixkit-175-digital-clouds.mp3 \
  -af "afade=t=in:d=0.6,afade=t=out:st=3.6:d=1.2,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" $A/musica-final-entrevista.wav
"$FF" -hide_banner -loglevel error -y -ss 0.105 -i $B/sfx/mixkit/mixkit-2542.wav -ar 48000 $A/_tecla.wav
"$FF" -hide_banner -loglevel error -y -i $A/_tecla.wav -af "volume=$(awk "BEGIN{print -3-($(pico $A/_tecla.wav))}")dB" $A/tecla.wav
"$FF" -hide_banner -loglevel error -y -i $B/sfx/mixkit/mixkit-2574-software-interface-start.wav \
  -af "volume=$(awk "BEGIN{print -3-($(pico $B/sfx/mixkit/mixkit-2574-software-interface-start.wav))}")dB" -ar 48000 $A/interfaz.wav
"$FF" -hide_banner -loglevel error -y -ss 0.008 -t 0.3 -i $B/sfx/mixkit/mixkit-1113-mouse-click-close.wav -ar 48000 $A/_clic.wav
"$FF" -hide_banner -loglevel error -y -i $A/_clic.wav -af "volume=$(awk "BEGIN{print -1-($(pico $A/_clic.wav))}")dB" $A/clic.wav
# insertos: recorte -> _x.wav -> pico -3 dBFS
inserto(){ # nombre origen filtro
  "$FF" -hide_banner -loglevel error -y -i "$B/sfx/mixkit/$2" -af "$3" -ac 2 -ar 48000 "$A/_x.wav"
  "$FF" -hide_banner -loglevel error -y -i "$A/_x.wav" -af "volume=$(awk "BEGIN{print -3-($(pico $A/_x.wav))}")dB" "$A/$1.wav"
  rm "$A/_x.wav"
}
inserto pop mixkit-3005-explainer-video-pops-whoosh-light-pop.wav "anull"
inserto robot mixkit-3122.wav "atrim=0.48:2.08,asetpts=PTS-STARTPTS,afade=t=out:st=1.3:d=0.3"
inserto error mixkit-2964.wav "atrim=0:0.25,asetpts=PTS-STARTPTS,afade=t=out:st=0.2:d=0.05"
inserto acierto mixkit-2870.wav "atrim=0:0.65,asetpts=PTS-STARTPTS,afade=t=out:st=0.45:d=0.2"
inserto tipeo mixkit-2531.wav "atrim=0:1.2,asetpts=PTS-STARTPTS,afade=t=out:st=0.9:d=0.3"
inserto tictac mixkit-1060.wav "atrim=0.3:13.05,asetpts=PTS-STARTPTS,atempo=1.5,atempo=2,afade=t=out:st=4.05:d=0.2"
inserto logo-tn mixkit-2568.wav "anull"
inserto logo-wa mixkit-2356-dry-pop-up-notification-alert.wav "anull"
inserto logo-ig mixkit-2357-bubble-pop-up-alert-notification.wav "anull"
# escalera: nombre base, archivo ya preparado en audio/, semitonos de cada paso
escalera(){
  local n=1 base=$1 origen=$2; shift 2
  for st in "$@"; do
    "$FF" -hide_banner -loglevel error -y -i "$A/$origen" -af "rubberband=pitch=$(awk "BEGIN{print 2^($st/12)}")" "$A/$base-$n.wav"
    n=$((n+1))
  done
}
escalera dia pop.wav -5 -3 -1 0 2 4 6
escalera acierto acierto.wav 0 4 7 12
rm $A/_tecla.wav $A/_clic.wav
for f in musica-final-entrevista tecla interfaz clic pop robot error acierto tipeo tictac logo-tn logo-wa logo-ig dia-1 dia-7 acierto-4; do echo "$f: pico $(pico $A/$f.wav) dB"; done
