#!/usr/bin/env bash
# Música de fondo del ep. 1 (como la radio de Volto, 2026-10-23: "no tan corpo, pero sí tecnológica"; que NO tape la voz y suba en la placa):
# tape para nada la voz y que aumente en la placa"): "Deep Techno Ambience" de Alejandro Magaña (Mixkit 134,
# elegida entre tres propuestas), desde el principio y con la duración del video. Entrada de 1 s, salida de
# 1,5 s, normalizada a -14 LUFS (en la mezcla va 30 dB más baja bajo la voz y sube en la placa:
# musicaBajoVozDb / musicaCierreDb de composiciones.ts).
# Uso (raíz del proyecto, Git Bash): bash src/trabajos/2026-11-06_volto_ep1-laboratorios-ia/preparar_musica.sh [duración_s]
set -euo pipefail
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
DUR=${1:-47.8}
ORIGEN=public/biblioteca/musica/mixkit/mixkit-134-deep-techno-ambience.mp3
[ -f $ORIGEN ] || node scripts/mixkit.mjs bajar 134
"$FF" -hide_banner -loglevel error -y -t "$DUR" -i $ORIGEN \
  -af "afade=t=in:st=0:d=1,afade=t=out:st=$(awk -v d="$DUR" 'BEGIN{print d-1.5}'):d=1.5,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 public/trabajos/2026-11-06_volto_ep1-laboratorios-ia/audio/musica-fondo.wav
echo "listo: audio/musica-fondo.wav ($DUR s)"
