#!/usr/bin/env bash
# (Nació en 2026-10-21_rastro_pau-mascota; pasó a la suite el 2026-10-23: va en todo render final con audio.)
# Audio de un render de Remotion listo para entregar:
#  1) adelanta el audio 42,7 ms: el AAC de cada render de Remotion arranca con 2048 muestras de relleno sin marcar
#     (medido el 2026-10-21 por correlación con el proxy: +42,6 ms por render; el borrador A, con un clip renderizado
#     dos veces, tenía la voz 85 ms atrasada: "se mueve la boca antes que el audio");
#  2) -14 LUFS con loudnorm en dos pasadas (lineal), pico verdadero -1,5 dBFS. El video se copia sin recodificar.
# Uso (raíz del proyecto): bash scripts/terminar_audio.sh <entrada.mp4> <salida.mp4>
set -euo pipefail
FF=$(grep '"ffmpeg"' scripts/herramientas.json | cut -d'"' -f4)
RELLENO=0.042667
E=$1; S=$2
M=$("$FF" -i "$E" -ss $RELLENO -i "$E" -map 1:a -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
v() { echo "$M" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
"$FF" -v error -y -i "$E" -ss $RELLENO -i "$E" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true" \
  -ar 48000 -c:a aac -b:a 192k -shortest "$S"
"$FF" -i "$S" -af ebur128=peak=true -f null - 2>&1 | grep -A14 "Summary" | grep -E "I:|Peak:"
