# R2 NOV, 4.ª/5.ª tanda: loft "un espacio amplio" en horizontal (C0119 desde el 0:02) escalado para entrar en 1080x1920 (fondo = la misma toma
# desenfocada) con un poco más de luz; baristas (C0141) con la luz justa. Los dos salen del 4K (al achicar baja el ruido) con reducción de
# ruido leve y una curva de medios suave: así la luz no se ve granulada. Uso: python preparar_inserts3.py
import subprocess
FF = "C:/Videos/_herramientas/ffmpeg/bin/ffmpeg.exe"
ID = "2026-10-28_docba_r2-nov"
B = f"public/trabajos/{ID}/crudos"
BASE = "C:/Users/LUCIA/Documents/RASTRO/Clientes/DOCBA/Producciones/Inserts cámara"
TAGS = ["-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709"]
ENC = ["-an", "-c:v", "libx264", "-crf", "16", "-preset", "veryfast", "-g", "30", *TAGS]
run = lambda a: subprocess.run([FF, "-y", "-v", "error", *a], check=True)
LUZ_LOFT = "hqdn3d=2:2:5:5,curves=all='0/0 0.15/0.20 0.5/0.59 0.8/0.86 1/1'"
# loft horizontal "grande": recorte 9:16 del alto completo del 4K (1215x2160) escalado a 1080x1920: sin fondo desenfocado y sin perder resolución
run(["-ss", "2.0", "-t", "1.6", "-i", f"{BASE}/Loft/C0119.MP4", "-vf", f"crop=1215:2160:{1312}:0,scale=1080:1920:flags=lanczos,{LUZ_LOFT},fps=30,format=yuv420p", *ENC, f"{B}/ins_loft.mp4"])
# primer insert (C0021, desde el 0:03): estaba chueco (~1,5° en sentido horario): se endereza a 4K y se recorta un 6 % para sacar los bordes
run(["-ss", "3.0", "-t", "1.4", "-i", f"{BASE}/Cowork/C0021.MP4", "-vf", "transpose=2,rotate=-1.5*PI/180:ow=iw:oh=ih:c=black,crop=iw/1.06:ih/1.06,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p", *ENC, f"{B}/ins_inicio.mp4"])
LUZ_CAFE = "hqdn3d=3:3:6:6,curves=all='0/0 0.1/0.16 0.25/0.36 0.5/0.63 0.8/0.87 1/1'"
run(["-ss", "11.17", "-t", "1.7", "-i", f"{BASE}/Comida/C0141.MP4", "-vf", f"transpose=2,scale=1080:1920:flags=lanczos,{LUZ_CAFE},fps=30,format=yuv420p", *ENC, f"{B}/ins_barista.mp4"])
