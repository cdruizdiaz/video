#!/usr/bin/env bash
# Sonido de "Bloomie volando en escoba" (mismo calce que 2026-10-02_lucia_bloomie-corriendo): Fast car drive by (Mixkit 1538) calzado con el cruce de la composición
# lucia-bloomie-volando-escoba (entra f30, sale f105 → pasa por el medio a los 2,25 s).
# - rubberband tempo 0.645: estira la pasada (1538 dura 3,8 s y su pico está en 1,2 s) sin cambiar el tono,
#   así el Doppler se siente más largo: el pico queda en 1,2/0.645 = 1,86 s
# - adelay 390 ms: el pico cae en 2,25 s, cuando Bloomie está en el centro
# - paneo de izquierda a derecha siguiendo su posición (el original casi no panea)
# - 5 s con fundidos, a -14 LUFS (pico real ≤ -1,5 dBTP)
set -e
cd "$(dirname "$0")/../../.."
FFMPEG=C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe
ENTRADA=public/biblioteca/sfx/mixkit/mixkit-1538-fast-car-drive-by.wav
SALIDA=public/trabajos/2026-10-02_lucia_bloomie-volando-escoba-realista/audio/auto_doppler.wav

TEMPO=0.645
RETARDO=390   # ms
CENTRO=2.25   # s en que pasa por el medio
ANCHO=1.4     # s que tarda el paneo de un lado al otro (la mitad a cada lado del centro)
PISO=0.2      # el canal opuesto nunca baja de esto (no queda paneado del todo)

# p = posición -1 (izquierda) … 1 (derecha); ganancias con ley de potencia constante
P="max(-1,min(1,(t-$CENTRO)/($ANCHO/2)))"
GL="max($PISO,sqrt((1-$P)/2))"
GR="max($PISO,sqrt((1+$P)/2))"

"$FFMPEG" -y -v error -i "$ENTRADA" -filter_complex "\
[0]aformat=sample_rates=48000,rubberband=tempo=$TEMPO,adelay=$RETARDO|$RETARDO,apad,atrim=0:5,\
pan=mono|c0=0.5*c0+0.5*c1,asplit[a][b];\
[a]volume='$GL':eval=frame[l];[b]volume='$GR':eval=frame[r];\
[l][r]join=inputs=2:channel_layout=stereo,afade=t=in:d=0.3,afade=t=out:st=4.4:d=0.6,\
acompressor=threshold=-24dB:ratio=3:attack=5:release=80,volume=13dB,\
aresample=192000,alimiter=limit=0.78:level=false:attack=0.5:release=40,aresample=48000[s]" \
  -map "[s]" -c:a pcm_s16le "$SALIDA"

"$FFMPEG" -hide_banner -i "$SALIDA" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
