#!/usr/bin/env bash
# Voz de Bloomie (escena 6), en inglés: Piper TTS local (voz en_US-hfc_female-medium, elegida el 2026-10-01)
# subida de tono con rubberband para que suene a nene. Queda a -14 LUFS; la música se agacha debajo en
# Remotion. Después se transcribe con Whisper para sincronizar el globo y la boca con cada palabra.
# Uso (desde la raíz del proyecto): bash src/trabajos/2026-10-01_claudio_bloomie/preparar_voz.sh
set -euo pipefail
FFMPEG=$(node -p "require('./scripts/herramientas.json').ffmpeg")
PYTHON=$(node -p "require('./scripts/herramientas.json').python")
VOZ=C:/Videos/_herramientas/modelos-piper/en_US-hfc_female-medium.onnx
ID=2026-10-01_claudio_bloomie
TEXTO="Bye, Mom! Don't forget to bake my favorite cake for when I get back from school!"
TONO=1.35
TMP=$(mktemp -d)
echo "$TEXTO" | "$PYTHON" -m piper -m "$VOZ" --length-scale 0.95 -f "$TMP/voz.wav" 2>/dev/null
"$FFMPEG" -y -hide_banner -loglevel error -i "$TMP/voz.wav" \
  -af "rubberband=pitch=$TONO:formant=shifted,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,afade=t=in:d=0.02,apad=pad_dur=0.15,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 -ac 1 "public/trabajos/$ID/audio/voz_bloomie_en.wav"
rm -rf "$TMP"
"$FFMPEG" -hide_banner -i "public/trabajos/$ID/audio/voz_bloomie_en.wav" -af ebur128=peak=true -f null - 2>&1 | grep -A3 "Integrated loudness" | head -4
node scripts/transcribir.mjs "public/trabajos/$ID/audio/voz_bloomie_en.wav" "public/trabajos/$ID/datos/voz_bloomie_en.json" --idioma en --sin-vad --prompt "Bye, Mom! Don't forget to bake my favorite cake"
