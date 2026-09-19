import sys
from PIL import Image, ImageDraw
from items import ITEMS, COLOR
N = 24
def rgbf(h): n=int(h[1:],16); return [(n>>16)&255,(n>>8)&255,n&255]
def shift(h,f): return [c+(255-c)*(f-1) if f>=1 else c*f for c in rgbf(h)]
def pal(base, accent):
    t=lambda f: tuple(int(x) for x in shift(base,f))
    a=lambda f: tuple(int(x) for x in shift(accent,f))
    return {'o':t(1.0),'O':t(1.25),'x':t(0.78),'#':t(0.56),':':t(0.68),'.':t(0.34),
            't':a(1.0),'T':a(1.25),'k':(107,74,46),'K':(138,100,64),
            'm':(141,148,156),'M':(204,210,216)}
names = sys.argv[2:] or sorted(ITEMS)
S = int(sys.argv[1]) if len(sys.argv)>1 else 5
cols=6; rows=(len(names)+cols-1)//cols
cell=N*S+16
img=Image.new('RGB',(cell*cols+10,(N*S+24)*rows+10),(26,30,38)); d=ImageDraw.Draw(img)
for i,name in enumerate(names):
    gx,gy=(i%cols)*cell+10,(i//cols)*(N*S+24)+8
    d.text((gx,gy),name,fill=(190,196,206))
    p=pal(*COLOR[name])
    for r,row in enumerate(ITEMS[name]):
        for c,ch in enumerate(row):
            if ch==' ': continue
            d.rectangle([gx+c*S,gy+14+r*S,gx+c*S+S-1,gy+14+r*S+S-1],fill=p.get(ch,p['o']))
img.save('itemsheet.png'); print(len(names))
