"""Pulsos de una música (librosa): para cortar al ritmo en MontajeMusical o sincronizar animaciones.

Uso (Python del .venv):  python scripts/pulsos.py <audio> <salida.json> [--desde s] [--hasta s]

Salida JSON:
  { audio, duracion, bpm,
    pulsos:   [s, …]   cada pulso (beat)
    compases: [s, …]   primer pulso de cada compás (se asume 4/4: el pulso más fuerte de cada grupo de 4)
    golpes:   [s, …]   ataques fuertes (onsets con mucha energía: golpes, entradas de batería)
    energia:  [[s, 0…1], …] envolvente de volumen cada 0,25 s (para subidas y bajadas) }
"""
import json
import sys
from pathlib import Path

import librosa
import numpy as np

PASO_ENERGIA = 0.25  # s
PERCENTIL_GOLPES = 90  # onsets por encima de este percentil de fuerza


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        sys.exit(1)

    def opc(n):
        return float(args[args.index(n) + 1]) if n in args else None

    entrada, salida = args[0], args[1]
    desde, hasta = opc("--desde") or 0.0, opc("--hasta")
    y, sr = librosa.load(entrada, sr=22050, mono=True, offset=desde, duration=(hasta - desde) if hasta else None)
    dur = len(y) / sr

    fuerza = librosa.onset.onset_strength(y=y, sr=sr)
    tempo, cuadros = librosa.beat.beat_track(onset_envelope=fuerza, sr=sr, units="frames")
    bpm = float(np.atleast_1d(tempo)[0])
    pulsos = librosa.frames_to_time(cuadros, sr=sr)

    # Compases: de las 4 fases posibles, la que cae sobre pulsos más fuertes
    fuerzas = fuerza[np.minimum(cuadros, len(fuerza) - 1)] if len(cuadros) else np.array([])
    fase = int(np.argmax([fuerzas[k::4].mean() if len(fuerzas[k::4]) else 0 for k in range(4)])) if len(fuerzas) else 0
    compases = pulsos[fase::4]

    onsets = librosa.onset.onset_detect(onset_envelope=fuerza, sr=sr, units="frames", backtrack=False)
    if len(onsets):
        umbral = np.percentile(fuerza[onsets], PERCENTIL_GOLPES)
        golpes = librosa.frames_to_time(onsets[fuerza[onsets] >= umbral], sr=sr)
    else:
        golpes = np.array([])

    rms = librosa.feature.rms(y=y, hop_length=int(sr * PASO_ENERGIA))[0]
    rms = rms / (rms.max() or 1)

    r = lambda v: round(float(v) + desde, 3)
    datos = {
        "audio": Path(entrada).as_posix(),
        "duracion": round(dur, 3),
        "bpm": round(bpm, 1),
        "pulsos": [r(t) for t in pulsos],
        "compases": [r(t) for t in compases],
        "golpes": [r(t) for t in golpes],
        "energia": [[r(k * PASO_ENERGIA), round(float(v), 3)] for k, v in enumerate(rms)],
    }
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    Path(salida).write_text(json.dumps(datos, ensure_ascii=False), encoding="utf-8")
    print(f"OK {salida} · {bpm:.1f} bpm · {len(pulsos)} pulsos · {len(compases)} compases · {len(golpes)} golpes · {dur:.1f} s")


if __name__ == "__main__":
    main()
