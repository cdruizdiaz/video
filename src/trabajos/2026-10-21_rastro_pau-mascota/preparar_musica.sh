#!/usr/bin/env bash
# Música de fondo: Mixkit 1142 "Gummies" (Michael Ramir C., Mixkit Stock Music Free License; sha256 28a4219e2b0c),
# elegida el 2026-10-21 ("suave como de marketing pero divertida, sin ser institucional"). Desde el principio del tema,
# recortada a la duración del reel (50,1 s = 1503 cuadros, borrador C), fundido de entrada corto y de salida al final de la placa,
# a -14 LUFS. Bajo la voz va a -27 dB (musicaBajoVozDb; -19 era "extremadamente alta") y sube en la placa (musicaCierreDb).
# Uso (raíz del proyecto): bash src/trabajos/2026-10-21_rastro_pau-mascota/preparar_musica.sh
set -e
ID=2026-10-21_rastro_pau-mascota
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
DUR=50.1
$FF -v error -y -i public/biblioteca/musica/mixkit/mixkit-1142-gummies.mp3 \
  -af "atrim=0:$DUR,afade=t=in:d=0.3,afade=t=out:st=$(awk "BEGIN{print $DUR-1.4}"):d=1.4,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 public/trabajos/$ID/audio/musica.wav
$FF -i public/trabajos/$ID/audio/musica.wav -af ebur128 -f null - 2>&1 | grep " I:" | tail -1
