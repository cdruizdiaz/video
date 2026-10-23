#!/usr/bin/env bash
# Efectos cortos (biblioteca de Mixkit, ya bajados): un pop por gráfico; lo que suena seguido, en escalera de tono
# (CRITERIOS_REEL → Efectos de sonido).
#   pop_0…5    Mixkit 2357 "Bubble pop up alert notification", subiendo de a 2 semitonos (íconos del inicio, etiquetas)
#   seco_0…3   Mixkit 2356 "Dry pop up notification alert", subiendo de a 2 semitonos (tapas y tarjetas)
#   boing      Mixkit 2894 "Boing hit sound": el asterisco cómico de "*la Factoria"
#   clic       Mixkit 1114 "Game click": la ventana del programa de diseño
#   sello      Mixkit 2356 tres semitonos abajo: el sello "me lo perdí" sobre la entrada de River
# Todos con pico en -3 dBFS; el volumen final va en composiciones.ts (efectosVolumen).
# Uso (raíz del proyecto): bash src/trabajos/2026-10-21_rastro_consumos-del-mes/preparar_sonidos.sh
set -e
ID=2026-10-21_rastro_consumos-del-mes
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
B=public/biblioteca/sfx/mixkit
A=public/trabajos/$ID/audio
POP=$B/mixkit-2357-bubble-pop-up-alert-notification.wav
SECO=$B/mixkit-2356-dry-pop-up-notification-alert.wav
sonido() { # entrada salida semitonos [duración]
  local r d; r=$(awk "BEGIN{print 2^($3/12)}"); d=${4:-0.6}
  "$FF" -v error -y -i "$1" -af "asetrate=48000*$r,aresample=48000,atrim=0:$d,afade=t=out:st=$(awk "BEGIN{print $d-0.15}"):d=0.15,loudnorm=I=-20:TP=-3" -ac 2 -ar 48000 "$A/$2.wav"
}
for k in 0 1 2 3 4 5; do sonido $POP pop_$k $((k * 2)); done
for k in 0 1 2 3; do sonido $SECO seco_$k $((k * 2)); done
sonido $B/mixkit-2894-boing-hit-sound.wav boing 0 0.9
sonido $B/mixkit-1114-game-click.wav clic 0 0.4
sonido $SECO sello -3
ls $A/*.wav
