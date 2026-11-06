# R4 NOV: retoque de luz con máscara de personas (scripts/mascaras.py → tmp/r4/m_*.mp4).
#  luz_9444: la host entrando a contraluz → solo ella sube (cara visible), el fondo queda como está.
#  noche_a / noche_b (IMG_9449, 0:09 y 0:10): look de noche → fondo (pared) más oscuro con gradiente desde arriba, tono frío y viñeta;
#  las dos personas más iluminadas y cálidas.
# (30-oct: luz_9444 dura 2,3 s para llegar hasta el final de "plan"; máscara m_a2 = scripts/mascaras.py sobre IMG_9444 desde 2,3 s, 2,5 s)
# (30-oct, 3.ª: luz_9444 arranca donde siempre (2,4 s de IMG_9444) y dura 3,0 s: sigue corriendo 1 s más; máscara m_a3 = scripts/mascaras.py sobre IMG_9444 desde 1,3 s, 3,5 s)
# Uso: python retocar_luz.py   (necesita tmp/r4/m_a.mp4, m_b.mp4, m_c.mp4)
import subprocess
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
ID = "2026-10-28_docba_r4-nov"
B = f"public/trabajos/{ID}/crudos"
TAGS = ["-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709"]
FRIO = "colorbalance=rs=-0.03:bs=0.05:rm=-0.02:bm=0.03"
# borrador C: la usuaria pidió volver al video original y solo corregir un poco la luz (el look "de noche" con fondo negro quedó de terror;
# la luz de la host se había ido a rosa): curvas suaves, sin gradiente, sin tinte frío, sin viñeta
SUAVE_GLOBAL = "curves=all='0/0 0.2/0.25 0.5/0.57 0.85/0.9 1/1'"
trabajos = {
    # salida: (video, desde, duración, máscara, desde de la máscara, filtro del fondo, filtro de las personas)
    # contraluz: gamma (conserva el color mejor que una curva con tirón en sombras) sobre ella, y un toque de gamma en el fondo para que no se note el parche
    "luz_9444": ("IMG_9444", 2.4, 3.0, "m_a3", 1.1, "eq=gamma=1.07",
                 "eq=gamma=1.42:saturation=0.98,curves=all='0/0 0.5/0.52 0.85/0.88 1/1',colorchannelmixer=rr=0.985:bb=1.01"),
    "noche_a": ("IMG_9449", 2.8, 1.6, "m_b", 0.1, SUAVE_GLOBAL, "curves=all='0/0 0.15/0.22 0.45/0.55 0.8/0.86 1/1'"),
    "noche_b": ("IMG_9449", 6.8, 1.5, "m_c", 0.1, SUAVE_GLOBAL, "curves=all='0/0 0.15/0.22 0.45/0.55 0.8/0.86 1/1'"),
}
import sys
for nombre, (v, d, L, m, dm, fondo, gente) in trabajos.items():
    if len(sys.argv) > 1 and nombre not in sys.argv[1:]: continue
    fc = (f"[0:v]format=gbrp,split[o][f];[o]{fondo},format=gbrp[bg];[f]{gente},format=gbrp[fg];"
          f"[1:v]format=gray,erosion,erosion,gblur=sigma=7,format=gray[m];[bg][fg][m]maskedmerge,format=yuv420p")
    subprocess.run([FF, "-y", "-v", "error", "-ss", str(d), "-t", str(L), "-i", f"{B}/{v}.mp4", "-ss", str(dm), "-t", str(L), "-i", f"tmp/r4/{m}.mp4",
                    "-filter_complex", fc, "-an", "-r", "30", "-c:v", "libx264", "-crf", "14", "-preset", "fast", *TAGS, f"{B}/{nombre}.mp4"], check=True)
    print(nombre, "ok")
