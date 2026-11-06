# Voces del reel R1 NOV a -19 LUFS (criterio de la suite: tomas a -19, loudnorm a -14 en el render final).
# Cada crudo hablado (proxy) -> audio/hab_<clip>.wav (mono 48 kHz); las dos voces en off -> audio/voz_n_n19.wav.
import re, subprocess, sys
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
ID = "2026-10-27_docba_r1-nov"
B = f"public/trabajos/{ID}"
OBJ = -19.0

def lufs(path):
    r = subprocess.run([FF, "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return float(m[-1])

def nivelar(entrada, salida, filtro_in=None):
    tmp = salida + ".tmp.wav"
    cmd = [FF, "-y", "-v", "error", "-i", entrada, "-ac", "1", "-ar", "48000", "-vn"]
    if filtro_in:
        cmd += ["-af", filtro_in]
    subprocess.run(cmd + [tmp], check=True)
    g = OBJ - lufs(tmp)
    subprocess.run([FF, "-y", "-v", "error", "-i", tmp, "-af", f"volume={g:.2f}dB,alimiter=limit=0.89", salida], check=True)
    print(salida, f"{g:+.1f} dB")

FILTRO = "highpass=f=70,acompressor=threshold=0.08:ratio=3:attack=15:release=200:makeup=1.5"  # parejo y sin picos
for c in ["IMG_9324", "IMG_9332", "IMG_9347", "IMG_9395", "IMG_9398"]:
    nivelar(f"{B}/crudos/{c}.mp4", f"{B}/audio/hab_{c}.wav", FILTRO)
# la voz en off va sin ruido de fondo: DeepFilterNet (--atten-lim 22) -> voz_1_limpia.wav, y de ahí a -19 LUFS
nivelar(f"{B}/audio/voz_1_limpia.wav", f"{B}/audio/voz_1_n19.wav", FILTRO)
