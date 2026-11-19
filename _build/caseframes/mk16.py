import numpy as np, cv2, sys
from PIL import Image, ImageDraw
up=np.asarray(Image.open('up2.png').convert('RGB'))
SS=4; W=H=1600; k=2
dp,di=float(sys.argv[1]),float(sys.argv[2])
def rr(b,r):
    m=Image.new('L',(W*SS,H*SS),0); ImageDraw.Draw(m).rounded_rectangle([v*SS for v in b],radius=max(r,0)*SS,fill=255)
    return np.asarray(m.resize((W,H),Image.LANCZOS)).astype(np.float32)/255
def g(b,d): return tuple(v*k for v in (b[0]-d,b[1]-d,b[2]+d,b[3]+d)), (b[4]+d)*k
P=(255.5,92,545,707,36); I=(263,101,419.5,260.5,34)
printm=rr(*g(P,dp))*(1-rr(*g(I,-di)))
mn=up.min(2).astype(np.float32); sil=np.clip((250-mn)/40,0,1)
body=rr((247*k,84*k,554.5*k,715.5*k),44*k)
sil=np.maximum(sil*(cv2.dilate(body,np.ones((9,9),np.uint8))>0),body)
alpha=np.clip(sil-printm,0,1)
crop=(200,0,1400,1600)
Image.fromarray(np.dstack([up,(alpha*255).astype(np.uint8)])).crop(crop).save('frame.png')
mk=Image.new('LA',(W,H),255); mk.putalpha(Image.fromarray((printm*255).astype(np.uint8))); mk.crop(crop).save('mask.png')
