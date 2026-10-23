#!/usr/bin/env bash
# Timelapse de las grabaciones de Illustrator para "De ahí la puesta en marcha… o Navidad" (IMG_9060 17,05–27,75 s,
# 321 cuadros, voz en off de Pau), recortado al área de trabajo (sin barras ni paneles). Cada tramo acompaña lo que
# dice (cuadros del tramo · fuente · segundos de la grabación):
#   98  pantalla2 (11-25-27)  20–960 s   "De ahí la puesta en marcha, el diseño del personaje."  (formas → color)
#   114 pantalla1 (11-58-24)  0–399 s    "Queríamos que fuera amigable, tierno, divertido…"      (cara → personaje)
#   74  pantalla3 (13-48-09)  40–64 s    "…jugar en fechas especiales como"                     (anteojos de telaraña)
#   15  pantalla3             152–200 s  "Halloween"                                            (murciélago)
#   24  pantalla3             336–368 s  "o Navidad." hasta "Pasamos" (borrador D; antes 20)     (reno)
# El ideario ("Arrancamos con el ideario… ganó la flor.") ya no usa grabaciones: es el motion graphic IdearioCei.tsx.
# Uso (raíz del proyecto): bash src/trabajos/2026-10-21_rastro_pau-mascota/preparar_pantallas.sh
set -e
ID=2026-10-21_rastro_pau-mascota
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
C=public/trabajos/$ID/crudos
RECORTE="crop=1530:890:50:70"
TRAMOS=( "pantalla2 20 960 98" "pantalla1 0 399 114" "pantalla3 40 64 74" "pantalla3 152 200 15" "pantalla3 336 368 24" )
ENTRADAS=(); FILTRO=""; i=0
for t in "${TRAMOS[@]}"; do
  set -- $t
  ENTRADAS+=( -i "$C/$1.mp4" )
  FILTRO+="[$i:v]trim=start=$2:end=$3,$RECORTE,setpts=(PTS-STARTPTS)*($4/30)/($3-$2),fps=30,trim=end_frame=$4,setpts=PTS-STARTPTS[v$i];"
  i=$((i+1))
done
FILTRO+="$(for k in $(seq 0 $((i-1))); do printf "[v$k]"; done)concat=n=$i:v=1,format=yuv420p[v]"
$FF -y -v error "${ENTRADAS[@]}" -filter_complex "$FILTRO" -map "[v]" -c:v libx264 -preset veryfast -crf 18 -g 30 -an $C/pantalla_diseno.mp4
rm -f $C/pantalla_ideario.mp4
C:/Videos/_herramientas/ffmpeg/bin/ffprobe.exe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height -of csv=p=0 $C/pantalla_diseno.mp4 | sed "s/^/pantalla_diseno: /"
