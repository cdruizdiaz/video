#!/usr/bin/env bash
# Voz de Bloomie para "Bloomie Creators" (RASTRO): Piper TTS local, voz en_GB-jenny_dioco-medium (la misma del chiste
# de Navidad, para que Bloomie suene igual), tono subido ×1,35 con rubberband para que suene a nene. Una frase
# por archivo (audio/frase_N.wav, -14 LUFS) para ubicarlas en cada escena. Para transcribir en una sola pasada
# (Whisper es lo más lento), se arma voz_todas.wav con las frases separadas por 1,5 s de silencio; después
# separar_frases.mjs corta la transcripción en datos/frases.json (tiempos por palabra relativos a cada frase).
# Uso (desde la raíz del proyecto): bash src/trabajos/2026-10-02_lucia_chiste-navidad/preparar_voz.sh
set -euo pipefail
FFMPEG=$(node -p "require('./scripts/herramientas.json').ffmpeg")
PYTHON=$(node -p "require('./scripts/herramientas.json').python")
VOZ=C:/Videos/_herramientas/modelos-piper/en_GB-jenny_dioco-medium.onnx
ID=2026-10-02_rastro_bloomie-creators
AUDIO=public/trabajos/$ID/audio
TONO=1.35
SILENCIO=1.5
FRASES=(
  "Hi, I'm Bloomie."
  "These are my creators."
  "They work really hard."
  "Hire them, please!"
)
# El ruego (frase 4): "Hire them," a velocidad normal + "please!" dicho muy lento por Piper (--length-scale 4.5,
# ~1,6 s: el modelo estira la palabra con naturalidad; escribir "pleeeease" hace que deletree las letras y estirar
# el audio con rubberband suena artificial) y un vibrato leve para que suene suplicante.
RUEGO_LENTO=4.5
EXTRA_4=",vibrato=f=6.5:d=0.35"
TMP=$(mktemp -d)
LISTA="$TMP/lista.txt"
"$FFMPEG" -y -hide_banner -loglevel error -f lavfi -i anullsrc=r=48000:cl=mono -t $SILENCIO "$TMP/silencio.wav"
: > "$LISTA"
for i in "${!FRASES[@]}"; do
  n=$((i + 1))
  if [ $n = 4 ]; then
    echo "Hire them," | "$PYTHON" -m piper -m "$VOZ" --length-scale 0.95 -f "$TMP/a.wav" 2>/dev/null
    echo "please!" | "$PYTHON" -m piper -m "$VOZ" --length-scale $RUEGO_LENTO -f "$TMP/b.wav" 2>/dev/null
    "$FFMPEG" -y -hide_banner -loglevel error -i "$TMP/a.wav" -i "$TMP/b.wav" -filter_complex       "[0]silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.08[a];[1]silenceremove=start_periods=1:start_threshold=-45dB[b];[a][b]concat=n=2:v=0:a=1"       "$TMP/crudo_$n.wav"
  else
    echo "${FRASES[$i]}" | "$PYTHON" -m piper -m "$VOZ" --length-scale 0.95 -f "$TMP/crudo_$n.wav" 2>/dev/null
  fi
  "$FFMPEG" -y -hide_banner -loglevel error -i "$TMP/crudo_$n.wav" \
    -af "rubberband=pitch=$TONO:formant=shifted$( [ $n = 4 ] && echo "$EXTRA_4" ),silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,afade=t=in:d=0.02,apad=pad_dur=0.15,loudnorm=I=-14:TP=-1.5:LRA=11" \
    -ar 48000 -ac 1 "$AUDIO/frase_$n.wav"
  echo "file '$(cygpath -m "$PWD/$AUDIO/frase_$n.wav")'" >> "$LISTA"
  echo "file '$(cygpath -m "$TMP/silencio.wav")'" >> "$LISTA"
done
"$FFMPEG" -y -hide_banner -loglevel error -f concat -safe 0 -i "$LISTA" -ar 48000 -ac 1 "$AUDIO/voz_todas.wav"
rm -rf "$TMP"
node scripts/transcribir.mjs "$AUDIO/voz_todas.wav" "public/trabajos/$ID/datos/voz_todas.json" --idioma en --sin-vad \
  --prompt "Hi, I'm Bloomie. These are my creators. Hire them, please!"
node "src/trabajos/$ID/separar_frases.mjs"
