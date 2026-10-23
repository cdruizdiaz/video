#!/usr/bin/env bash
# (Copiado de 2026-10-21_rastro_pau-mascota: mismo micrófono y misma voz.)
# Voz de Pau con menos ruido de fondo, sin robotizarla (pedidos 2026-10-21): pasa-altos 70 Hz y DeepFilterNet con
# --atten-lim 24 (el ruido baja 24 dB, no del todo: queda algo de ambiente) sin bajar la entrada (el truco de Volto, -6 dB, acá hacía que DeepFilterNet confundiera la voz suave con ruido: en pau-mascota un tramo perdía 20 dB;
# CRITERIOS_REEL → Audio). Después, nivelar_voz.py, palabra por palabra (pau-mascota, borrador E: "en algunas palabras se apaga, tiene
# que estar toda al mismo nivel"): las palabras que el filtro se comió vuelven de la original y cada palabra va a la
# mediana del clip; al final cada clip a -19 LUFS. Sale audio/voz/<clip>.wav, misma línea de tiempo que el proxy (opción `audios`).
# La puerta de ruido del borrador D se sacó: no cambiaba las palabras (medido) y no hacía falta.
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-10-21_rastro_consumos-del-mes/preparar_voz.sh
set -euo pipefail
ID=2026-10-21_rastro_consumos-del-mes
ATENUACION=24 # 2026-10-21, borrador C: "el ruido de fondo sigue estando" (con 10, al subir la voz a -19 el fondo quedaba a -40 dB; con 24, a -60)
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
DF=$(grep '"deepFilter"' scripts/herramientas.json | cut -d'"' -f4)
PY=$(grep '"python"' scripts/herramientas.json | cut -d'"' -f4)
A=public/trabajos/$ID/audio/voz
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/in" "$T/out" $A
for CLIP in IMG_9085 IMG_9086 IMG_9088 IMG_9089 IMG_9091 IMG_9092 IMG_9093 IMG_9094; do
  "$FF" -v error -y -i public/trabajos/$ID/crudos/$CLIP.mp4 -map 0:a:0 -ac 1 -ar 48000 -af "highpass=f=70" "$T/in/$CLIP.wav"
done
"$DF" "$T"/in/*.wav --atten-lim $ATENUACION -o "$T/out" >/dev/null 2>&1
# IMG_9089: en la pasada entera DeepFilterNet borra "El programa de La" (24 dB abajo) y nivelar_voz.py lo traía de la
# original, con su ruido ("el audio está raro", revisión del borrador C). Filtrado desde los 4 s (sin lo anterior) esas
# palabras quedan: 0–6 s salen de esa pasada (antes de "no te cases", fundido de 30 ms) y el resto, de la entera.
mkdir -p "$T/in2" "$T/out2"
"$FF" -v error -y -i "$T/in/IMG_9089.wav" -af "atrim=start=4,asetpts=PTS-STARTPTS,adelay=4s:all=1" "$T/in2/IMG_9089.wav"
"$DF" "$T/in2/IMG_9089.wav" --atten-lim $ATENUACION -o "$T/out2" >/dev/null 2>&1
"$FF" -v error -y -i "$T/out2/IMG_9089_DeepFilterNet3.wav" -i "$T/out/IMG_9089_DeepFilterNet3.wav" -filter_complex   "[0]atrim=end=6.03[a];[1]atrim=start=6,asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=0.03" "$T/IMG_9089_unida.wav"
mv "$T/IMG_9089_unida.wav" "$T/out/IMG_9089_DeepFilterNet3.wav"
lufs() { "$FF" -i "$1" -af ebur128 -f null - 2>&1 | grep -A2 "Integrated loudness" | grep " I:" | awk '{print $2}'; }
for f in "$T"/out/*_DeepFilterNet3.wav; do
  n=$(basename "$f" _DeepFilterNet3.wav)
  "$PY" src/trabajos/$ID/nivelar_voz.py "$f" "$T/in/$n.wav" "$n" "$T/$n.nivelada.wav"
  # cada toma a -19 LUFS (CRITERIOS_REEL → Audio): ganancia fija medida con ebur128 y un limitador solo en los picos (-1,5 dBFS)
  I=$(lufs "$T/$n.nivelada.wav")
  G=$(awk "BEGIN{print -19 - ($I)}")
  "$FF" -v error -y -i "$T/$n.nivelada.wav" -af "volume=${G}dB,alimiter=limit=0.84:attack=2:release=60:level=disabled" -c:a pcm_s16le $A/$n.wav
  echo "  $n: $I LUFS → -19 (ganancia $G dB)"
done
ls $A
