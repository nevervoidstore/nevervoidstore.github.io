# Build custommug/tint-{a,b}.png from Printrove's orange two-tone mock-ups (same photo geometry as our 620 crops).
from PIL import Image, ImageFilter
import numpy as np
O=np.array([236.,105.,44.]); S0=(O[0]-O[2])/O[0]
for v,f,dx,dy in [('a','mugtpl-orange/front.png',-40,-84),('b','mugtpl-orange/back.png',-116,-84)]:
    im=Image.open(f)
    if im.mode=='RGBA':
        bg=Image.new('RGB',im.size,'white');bg.paste(im,mask=im.split()[3]);im=bg
    p=np.asarray(im.convert('RGB')).astype(float)[-dy:-dy+620, -dx:-dx+620]
    r,g,b=p[...,0],p[...,1],p[...,2]
    hue_ok=(r>g)&(g>b)
    a0=np.clip(((r-b)/np.maximum(r,1))/S0,0,1)*hue_ok
    L=np.clip(np.where(a0>0.01,(r-b)/((O[0]-O[2])*np.maximum(a0,0.01)),0),0,1.3)
    a=np.clip((a0-0.12)/0.83,0,1)**1.2
    E=np.asarray(Image.open(f'custommug/map-{v}-s.png').convert('RGB'))[...,2]>0
    # print area, minus its top 34 px per column (the rim's front lip sits there); grown downward only, soft-edged
    pa=E.copy()
    for x in range(620):
        ys=np.where(E[:,x])[0]
        if len(ys): pa[ys[0]:ys[0]+34,x]=False
    pa=np.asarray(Image.fromarray(pa.astype(np.uint8)*255).filter(ImageFilter.GaussianBlur(1.2))).astype(float)/255
    a=a*(1-pa)
    m=Image.fromarray((a>0.3).astype(np.uint8)*255).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(9))
    a*=np.asarray(m.filter(ImageFilter.GaussianBlur(1)))/255
    # the rim's front lip ends on the print area's top edge, which is stepped (whole pixels per column):
    # extend the colour down to a smooth curve fitted through that edge, anti-aliased, so no stair-steps show
    cols=[x for x in range(620) if E[:,x].any() and a[:E[:,x].argmax(),x].max()>0.5]
    if cols:
        tops=np.array([E[:,x].argmax() for x in cols],float); cx=np.array(cols,float)
        co=np.polyfit(cx,tops,4); edge=np.polyval(co,cx)+1.6
        for x,ye in zip(cols,edge):
            y0=int(E[:,x].argmax())-3; src=max(0,y0-2)
            for y in range(y0, int(np.ceil(ye))+1):
                cov=float(np.clip(ye-y+0.5,0,1))
                if cov>a[y,x]: a[y,x]=cov; L[y,x]=L[src,x] if L[src,x]>0 else L[y,x]
    out=np.dstack([L/1.3*255, np.zeros_like(L), np.zeros_like(L), a*255]).astype(np.uint8); out[out[...,3]==0]=0
    Image.fromarray(out,'RGBA').save(f'custommug/tint-{v}.png',optimize=True)
