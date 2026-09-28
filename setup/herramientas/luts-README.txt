LUTs de color (.cube)
=====================

Aquí van los LUTs exportados desde DaVinci Resolve (versión gratuita).

Cómo crear uno (una sola vez por cámara/iluminación):
  1. Importa un clip representativo en DaVinci Resolve.
  2. Corrígelo en la página Color.
  3. Clic derecho sobre el clip en la página Color > Generate LUT > 33 Point Cube.
  4. Guarda el .cube en esta carpeta (ej.: mi-camara-oficina.cube).

Cómo aplicarlo a un crudo:
  npx remotion ffmpeg -i crudo.mp4 -vf lut3d=C:/Videos/_herramientas/luts/mi-camara.cube -c:a copy salida.mp4
