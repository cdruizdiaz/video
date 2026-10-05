#!/usr/bin/env bash
# Voz de Bloomie para la prueba 2,5D (pesas): Piper TTS local, voz en_GB-jenny_dioco-medium (la voz de Bloomie), tono subido ×1,35 con rubberband para que suene a nene. Una frase
# por archivo (audio/frase_N.wav, -14 LUFS) para ubicarlas en cada escena. Para transcribir en una sola pasada
# (Whisper es lo más lento), se arma voz_todas.wav con las frases separadas por 1,5 s de silencio; después
# separar_frases.mjs corta la transcripción en datos/frases.json (tiempos por palabra relativos a cada frase).
# Uso (desde la raíz del proyecto): bash src/trabajos/2026-10-02_lucia_chiste-navidad/preparar_voz.sh
set -euo pipefail
FFMPEG=$(node -p "require('./scripts/herramientas.json').ffmpeg")
PYTHON=$(node -p "require('./scripts/herramientas.json').python")
VOZ=C:/Videos/_herramientas/modelos-piper/en_GB-jenny_dioco-medium.onnx
ID=2026-10-02_claudio_prueba-25d
AUDIO=public/trabajos/$ID/audio
TONO=1.35
SILENCIO=1.5
FRASES=(
  "I've got to get strong for my social media debut!"
)
TMP=$(mktemp -d)
LISTA="$TMP/lista.txt"
"$FFMPEG" -y -hide_banner -loglevel error -f lavfi -i anullsrc=r=48000:cl=mono -t $SILENCIO "$TMP/silencio.wav"
: > "$LISTA"
for i in "${!FRASES[@]}"; do
  n=$((i + 1))
  echo "${FRASES[$i]}" | "$PYTHON" -m piper -m "$VOZ" --length-scale 0.95 -f "$TMP/crudo_$n.wav" 2>/dev/null
  "$FFMPEG" -y -hide_banner -loglevel error -i "$TMP/crudo_$n.wav" \
    -af "rubberband=pitch=$TONO:formant=shifted,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,afade=t=in:d=0.02,apad=pad_dur=0.15,loudnorm=I=-14:TP=-1.5:LRA=11" \
    -ar 48000 -ac 1 "$AUDIO/frase_$n.wav"
  echo "file '$(cygpath -m "$PWD/$AUDIO/frase_$n.wav")'" >> "$LISTA"
  echo "file '$(cygpath -m "$TMP/silencio.wav")'" >> "$LISTA"
done
"$FFMPEG" -y -hide_banner -loglevel error -f concat -safe 0 -i "$LISTA" -ar 48000 -ac 1 "$AUDIO/voz_todas.wav"
rm -rf "$TMP"
node scripts/transcribir.mjs "$AUDIO/voz_todas.wav" "public/trabajos/$ID/datos/voz_todas.json" --idioma en --sin-vad \
  --prompt "I've got to get strong for my social media debut!"
node "src/trabajos/$ID/separar_frases.mjs"
