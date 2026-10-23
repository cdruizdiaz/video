#!/usr/bin/env bash
# Música de fondo: Mixkit 738 "Hip Hop 02" (Lily J, Mixkit Stock Music Free License; sha256 en
# public/biblioteca/LICENCIAS-mixkit.json), elegida el 2026-10-21 ("musiquita como cool, una que usaría un estudio
# creativo"). Desde el principio del tema, recortada a la duración del reel (57,13 s = 1714 cuadros, borrador A), fundido
# de entrada corto y de salida al final de la placa, a -14 LUFS. Bajo la voz va a -27 dB (musicaBajoVozDb) y sube en la
# placa (musicaCierreDb).
# Uso (raíz del proyecto): bash src/trabajos/2026-10-21_rastro_consumos-del-mes/preparar_musica.sh
set -e
ID=2026-10-21_rastro_consumos-del-mes
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
DUR=57.2
$FF -v error -y -i public/biblioteca/musica/mixkit/mixkit-738-hip-hop-02.mp3 \
  -af "atrim=0:$DUR,afade=t=in:d=0.3,afade=t=out:st=$(awk "BEGIN{print $DUR-1.4}"):d=1.4,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 public/trabajos/$ID/audio/musica.wav
$FF -i public/trabajos/$ID/audio/musica.wav -af ebur128 -f null - 2>&1 | grep " I:" | tail -1
