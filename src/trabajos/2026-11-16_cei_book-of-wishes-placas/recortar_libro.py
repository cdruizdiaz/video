import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
im=Image.open(sys.argv[1]).convert("RGB"); out=sys.argv[2]
cx,cy,r=1603,473,206
m=im.crop((cx-r,cy-r,cx+r,cy+r)).convert("RGBA")
mask=Image.new("L",m.size,0); ImageDraw.Draw(mask).ellipse((4,4,2*r-4,2*r-4),fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(3)); m.putalpha(mask); m.save(out+"/medallon.png")
e=np.array(im.crop((1265,20,1500,255))).astype(float)
R,G,B=e[...,0],e[...,1],e[...,2]
a=np.clip((R-B-15)*3.0,0,255)
h,w=a.shape; yy,xx=np.mgrid[0:h,0:w]
a[(xx+yy)>250]=0
a[(yy<14)|(xx<14)]=0   # sin las líneas del marco original
rgba=np.dstack([e,a]).astype(np.uint8)
Image.fromarray(rgba,"RGBA").save(out+"/esquina.png")
