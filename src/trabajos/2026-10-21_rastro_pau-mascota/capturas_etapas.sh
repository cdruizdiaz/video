#!/usr/bin/env bash
# Capturas de cada etapa para el motion graphic "Pasamos del papel, Illustrator y de Illustrator a la animación"
# (EtapasBloomie.tsx), en el aspecto de sus tarjetas (1530:890), sin las reglas de Illustrator:
#   etapa_papel.png        hoja de bocetos (IMG_9053p, 2,1 s: nítida), franja de arriba con los dibujos
#   etapa_vector.png       vectorizado sobre el boceto (pantalla2 / 11-25-27, 2:00: los pétalos en blanco sobre el boceto)
#   etapa_color.png        personaje a color terminado (pantalla1 / 11-58-24, 5:00)
# Uso (raíz del proyecto): bash src/trabajos/2026-10-21_rastro_pau-mascota/capturas_etapas.sh
set -e
ID=2026-10-21_rastro_pau-mascota
FF=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
C=public/trabajos/$ID/crudos
I=public/trabajos/$ID/img
$FF -v error -y -ss 2.1 -i $C/IMG_9053p.mp4 -frames:v 1 -vf "crop=921:535:24:380,scale=1530:890" $I/etapa_papel.png
$FF -v error -y -ss 120 -i $C/pantalla2.mp4 -frames:v 1 -vf "crop=1380:803:120:178,scale=1530:890" $I/etapa_vector.png
$FF -v error -y -ss 300 -i $C/pantalla1.mp4 -frames:v 1 -vf "crop=1480:861:70:110,scale=1530:890" $I/etapa_color.png
for f in papel vector color; do $FF -v error -y -i $I/etapa_$f.png -vf scale=480:-1 out/$ID/revision/etapa_$f.png; done
