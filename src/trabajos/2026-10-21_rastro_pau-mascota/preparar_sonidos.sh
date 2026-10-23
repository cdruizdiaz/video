#!/usr/bin/env bash
# Efectos cortos (biblioteca de Mixkit, ya bajados) para Bloomie y el motion graphic del ideario. Un pop por gráfico;
# lo que suena seguido (los Big Ben repetidos de "trillado"), en escalera de tono (CRITERIOS_REEL → Efectos de sonido).
#   pop_bloomie / pop_flor / pop_gano: Mixkit 2357 "Bubble pop up alert notification" (tono normal, más agudo)
#   etapa_1…3: Mixkit 2357 subiendo de a 3 semitonos (las tres tarjetas de las etapas)
#   pop_ben, sello_1…4: Mixkit 2356 "Dry pop up notification alert" (más grave y subiendo de a 2 semitonos)
# Todos con pico en -3 dBFS; el volumen final va en ReelPau.tsx (EFECTOS_DB).
# Uso (raíz del proyecto): bash src/trabajos/2026-10-21_rastro_pau-mascota/preparar_sonidos.sh
set -e
ID=2026-10-21_rastro_pau-mascota
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
B=public/biblioteca/sfx/mixkit
A=public/trabajos/$ID/audio
POP=$B/mixkit-2357-bubble-pop-up-alert-notification.wav
SECO=$B/mixkit-2356-dry-pop-up-notification-alert.wav
sonido() { # entrada salida semitonos
  local r; r=$(awk "BEGIN{print 2^($3/12)}")
  "$FF" -v error -y -i "$1" -af "asetrate=48000*$r,aresample=48000,atrim=0:0.6,afade=t=out:st=0.45:d=0.15,loudnorm=I=-20:TP=-3" -ac 2 -ar 48000 "$A/$2.wav"
}
sonido $POP pop_bloomie 0
sonido $POP pop_flor 2
sonido $POP pop_gano 5
sonido $SECO pop_ben -3
for k in 1 2 3 4; do sonido $SECO sello_$k $((k * 2 - 2)); done
for k in 1 2 3; do sonido $POP etapa_$k $((k * 3 - 3)); done # etapas: papel, Illustrator, animación
ls $A/*.wav | grep -v voz
