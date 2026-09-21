"""The shared fire in its period forms. Every form has four flame frames."""
from .common import Art, palette

EMBER=['#5a1f14','#a13a1e','#e0662b','#f7a648','#ffe08a']
FLAME=['#8e3d28','#e58b36','#f5d37a','#fff1c2']
SMOKE='#8a8378'

def flame(a,cx,by,h,w,frame,seed=0):
 """Three-layer tongue with a per-frame lean and a loose spark above it."""
 f=(frame+seed)%4
 lean=[0,1,0,-1][f];dh=[0,-1,1,0][f]
 H=h+dh
 def layer(scale,color,shift):
  hh=max(3,round(H*scale));ww=max(1,round(w*scale))
  pts=[(cx-ww,by),(cx-ww-1,by-hh//3),(cx-ww//2+lean,by-(hh*2)//3),(cx+lean+shift,by-hh),(cx+ww//2+lean,by-(hh*3)//5),(cx+ww+1,by-hh//3),(cx+ww,by)]
  a.poly(pts,color)
 layer(1,FLAME[0],0);layer(.78,FLAME[1],lean);layer(.5,FLAME[2],0)
 if H>=12:layer(.28,FLAME[3],0)
 sx,sy=[(2,3),(-3,5),(1,7),(-1,2)][f]
 a.rect((cx+sx,by-H-sy,cx+sx,by-H-sy),'#f7a648')
 if H>=14:
  sx,sy=[(-2,6),(3,2),(-4,3),(2,5)][(f+1)%4];a.rect((cx+sx,by-H-sy,cx+sx,by-H-sy),'#e0662b')

def embers(a,cells,frame):
 for i,(x,y) in enumerate(cells):
  a.rect((x,y,x+1,y),EMBER[2+((i+frame)%3)] if (i+frame)%4 else EMBER[1])

def firepit(v,frame):
 a=Art('stone')
 a.ell((9,31,39,44),'#3d3a33');a.ell((12,32,36,41),'#2a2320')
 for x,y in [(10,34),(15,40),(23,42),(32,40),(36,34),(29,30),(18,30)]:
  a.poly([(x-3,y),(x-1,y-3),(x+3,y-2),(x+4,y+2),(x,y+3)],1);a.poly([(x-2,y),(x,y-2),(x+2,y-1),(x+2,y+1)],3)
 a.line((16,36,30,39),'#5b3a26',3);a.line((17,39,31,33),'#8a5a35',2);a.line((18,38,30,34),'#b07a44')
 embers(a,[(20,36),(24,38),(27,35),(22,39)],frame)
 flame(a,24,37,21,6,frame)
 return a.finish()

def threestone(v,frame):
 """Three stones under a round pot, the fire fed by sticks pushed in from
 the sides and moved inward as they burn."""
 a=Art('stone')
 a.ell((8,35,40,45),'#4a4238');a.ell((12,36,36,43),'#302822')
 for p,q in [((6,38),(18,40)),((42,37),(30,40)),((20,45),(24,40))]:   # the sticks
  a.line((*p,*q),'#5b3a26',3);a.line((p[0],p[1]-1,q[0],q[1]-1),'#8a5a35')
 embers(a,[(21,40),(26,41),(24,39),(28,39)],frame)
 def stone(x,y,big):
  r=5 if big else 4
  a.ell((x-r,y-r,x+r,y+r//2+2),'#3f362c');a.ell((x-r+1,y-r,x+r-2,y),'#6e604e');a.ell((x-r+2,y-r+1,x,y-2),'#978468')
 stone(24,33,False)                                                     # the back stone
 flame(a,17,40,9,3,frame,1);flame(a,31,40,9,3,frame,2)
 # The pot: round-bellied, sooted at the base, mouth open to the sky.
 a.ell((15,23,33,40),'#4a2a1c');a.ell((16,23,31,38),'#8d5836');a.ell((17,24,27,33),'#ab7149');a.ell((18,25,23,29),'#c58f63')
 a.ell((16,33,32,40),'#2d1a13');a.ell((18,33,30,38),'#4a2a1c')
 a.ell((19,20,29,25),'#4a2a1c');a.ell((19,20,29,24),'#c58f63');a.ell((21,21,27,23),'#2d1a13')
 f=frame%4
 for i,(sx,sy) in enumerate([(23,16),(25,13),(24,10)]):                    # steam
  if (i+f)%4!=3:a.rect((sx+[0,1,0,-1][(i+f)%4],sy-f%2,sx+1+[0,1,0,-1][(i+f)%4],sy-f%2),'#d8d2c4')
 stone(15,41,True);stone(33,41,True)                                      # the front two
 flame(a,24,43,7,3,frame)
 return a.finish()

def longfire(v,frame):
 a=Art('stone')
 a.poly([(5,36),(12,32),(38,32),(43,37),(40,43),(8,44)],'#3d3a33');a.poly([(8,36),(13,34),(36,34),(40,37),(38,41),(10,42)],'#2a2320')
 for x,y in [(6,38),(42,38),(14,44),(34,44)]:a.poly([(x-2,y),(x,y-2),(x+3,y-1),(x+3,y+2),(x,y+3)],1)
 a.line((11,37,38,38),'#5b3a26',3);a.line((12,36,37,37),'#8a5a35')
 embers(a,[(14,39),(19,40),(23,39),(28,40),(33,39),(17,37),(31,37)],frame)
 flame(a,14,37,10,3,frame,1);flame(a,24,38,14,4,frame);flame(a,34,37,10,3,frame,2)
 return a.finish()

def tannur(v,frame):
 a=Art('clay',v)
 a.ell((7,35,41,46),'#6b5640');a.ell((9,36,39,44),'#8a7152')
 a.rect((14,26,34,40),0);a.rect((15,26,33,39),2);a.rect((15,27,20,38),1);a.line((32,28,32,38),3)
 a.ell((13,22,35,31),0);a.ell((14,23,34,30),3);a.ell((16,24,32,29),'#1f1713')
 for x in [18,27]:a.line((x,26,x-1,32),'#3a2a22')
 a.line((14,35,20,37,28,37,34,35),1)
 a.line((5,42,10,39),'#8a5a35',2);a.line((6,43,11,41),'#5b3a26')
 embers(a,[(20,27),(26,28),(23,26)],frame)
 flame(a,24,28,12,4,frame)
 a.line((16,25,32,25),3);a.rect((25,24,29,24),4)
 return a.finish()

def brazier(v,frame):
 a=Art('metal',v)
 a.ell((15,38,33,46),'#3d3a33')
 for x0,x1 in [(19,13),(29,35),(24,24)]:a.line((x0,36,x1,45),0,2);a.line((x0,36,x1,44),2)
 a.ell((11,26,37,38),0);a.ell((12,27,36,36),2);a.line((14,30,21,35),3)
 a.ell((13,25,35,31),0);a.ell((14,25,34,30),3);a.ell((16,26,32,29),'#2a1a14')
 a.line((17,26,31,26),4)
 embers(a,[(20,27),(24,28),(28,27)],frame)
 flame(a,24,28,13,5,frame)
 return a.finish()

def oven(v,frame):
 a=Art('clay',v);a.poly([(7,37),(10,40),(39,40),(42,36),(42,43),(8,44)],0);a.rect((10,38,39,42),1)
 a.ell((9,15,39,42),0);a.ell((10,15,37,40),2);a.poly([(12,25),(15,19),(22,16),(27,17),(21,19),(17,24),(15,33),(12,33)],3)
 a.ell((18,27,32,43),0);a.ell((19,29,30,40),'#332b28');a.rect((18,36,32,42),0);a.rect((20,37,29,40),'#894831')
 a.line((21,39,28,39),EMBER[2+frame%2]);embers(a,[(22,38),(26,38)],frame)
 flame(a,24,40,5+(frame%2),2,frame)
 a.line((17,31,19,27,27,26,32,30),4);a.specks([(27,20),(32,25),(12,35)],1)
 sx=[0,1,1,0][frame]
 a.rect((23+sx,10,24+sx,11),SMOKE);a.rect((25+sx,7,25+sx,8),SMOKE)
 return a.finish()

def stove(v,frame):
 a=Art('clay',[2,0,1][v%3])
 a.rect((9,29,39,43),0);a.rect((10,30,38,42),2)
 for y in [33,37,41]:a.line((10,y,38,y),1)
 for y0,xs in [(30,[16,24,32]),(34,[12,20,28,36]),(38,[16,24,32])]:
  for x in xs:a.line((x,y0,x,y0+2),1)
 a.rect((8,27,40,29),3);a.line((9,27,39,27),4)
 a.rect((19,35,29,42),'#1f1713');a.rect((20,40,28,41),EMBER[1])
 embers(a,[(21,40),(25,41)],frame);flame(a,24,40,5+(frame%2),2,frame)
 m=palette('iron');a.ell((16,20,32,30),m[0]);a.ell((17,21,31,28),m[2]);a.ell((18,17,30,23),m[0]);a.ell((19,18,29,22),m[3])
 a.rect((23,15,25,17),m[1]);a.d.arc((17,12,31,24),200,340,fill=m[1],width=2)
 a.line((31,23,36,20),m[1],2);a.line((32,22,36,19),m[3])
 f=frame%4
 for (x,y) in [(21,12),(20,9),(22,6)][:2+f%2]:a.rect((x+[0,1,0,-1][f],y,x+[0,1,0,-1][f],y),'#cfc9bd')
 return a.finish()

def firebasket(v,frame):
 a=Art('iron')
 a.ell((14,40,34,46),'#3d3a33')
 embers(a,[(19,33),(23,35),(27,33),(21,31),(26,30)],frame)
 a.poly([(17,26),(31,26),(29,36),(19,36)],'#4a2317')
 flame(a,24,34,12,4,frame)
 for x0,x1 in [(15,18),(21,22),(27,26),(33,30)]:a.line((x0,24,x1,37),0,2);a.line((x0,24,x1,36),2)
 a.line((14,24,34,24),0,2);a.line((15,23,33,23),3);a.line((18,37,30,37),0,2);a.line((16,31,32,31),0)
 for x0,x1 in [(18,13),(30,35)]:a.line((x0,37,x1,45),0,2);a.line((x0,37,x1,44),2)
 return a.finish()

def drum(v,frame):
 a=Art('iron')
 a.ell((12,36,36,47),'#3d3a33')
 a.rect((13,20,35,43),0);a.rect((14,20,34,42),2);a.rect((15,21,19,41),1);a.line((32,21,32,41),3)
 for y in [27,35]:a.line((13,y,35,y),0);a.line((14,y+1,34,y+1),3)
 a.ell((12,37,36,44),0);a.ell((13,38,35,43),1)
 a.specks([(17,30),(28,38),(24,24)],'#7b4a2a')
 a.ell((13,16,35,24),0);a.ell((14,17,34,23),1);a.ell((16,18,32,22),'#1f1713')
 embers(a,[(19,19),(24,20),(29,19)],frame)
 for (x,y) in [(18,31),(27,33),(22,39)]:a.rect((x,y,x+1,y+1),EMBER[2+((x+frame)%2)])
 flame(a,24,20,13,5,frame)
 a.line((15,17,33,17),3)
 return a.finish()

FIRES={'three-stone-hearth':threestone,'hearth':firepit,'long-fire':longfire,'tannur':tannur,'brazier':brazier,'oven':oven,'stove':stove,'fire-basket':firebasket,'oil-drum':drum}

# The open fires are redrawn at their own sizes with eight flame frames.
from art.props_b.fire import FIRES_B
FIRES.update(FIRES_B)
