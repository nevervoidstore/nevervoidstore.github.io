import json, sys, re, os
from PIL import Image
fr=Image.open('/home/claude/p16/frame.png').convert('RGBA'); al=Image.open('/home/claude/p16/mask.png').getchannel('A')
x0,y0,x1,y1=json.load(open('/home/claude/p16/rect.json'))
def render(src):
    art=Image.open(src).convert('RGB'); rw,rh=x1-x0,y1-y0
    r=max(rw/art.width,rh/art.height); a=art.resize((round(art.width*r),round(art.height*r)),Image.LANCZOS)
    L=Image.new('RGBA',fr.size,(0,0,0,0)); L.paste(a,(round(x0+(rw-a.width)/2),round(y0+(rh-a.height)/2))); L.putalpha(al)
    c=Image.new('RGBA',fr.size,(0,0,0,0)); c.alpha_composite(L); c.alpha_composite(fr); return c
if __name__=='__main__':
    c=render(sys.argv[1]); c.save(sys.argv[2])
