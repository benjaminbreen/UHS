"""The street's smaller ironwork: somewhere to tie a horse, something to weigh with."""
from math import cos, pi, sin
from .building import _ground
from .core import Canvas, RAMPS, jitter, soft_outline, grass
from .workshop import WOOD7, streak


def beam_scale(v=0, frame=0):
 """A balance on a post: a beam, a pan on each cord, a box of weights.

 The beam is never quite still — it settles one way, then the other — so the
 frames walk a slow sine rather than cycling a pose.
 """
 c = Canvas(52, 56)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7'] if v != 2 else RAMPS['brasspot7']
 pan = RAMPS['brasspot7'] if v != 1 else RAMPS['blackiron7']
 cx = 25
 for y in range(16, 50):                           # the post
  for k in range(5):
   tone = 5 if k == 0 else 4 if k < 3 else 2 if k < 4 else 1
   c.set(cx - 2 + k, y, w[tone])
  if y % 8 == 2: c.set(cx - 1, y, w[6])
 for k, half in enumerate((6, 8, 9)):              # its foot
  for x in range(cx - half, cx + half + 1):
   c.set(x, 47 + k, w[5 if x < cx else 3] if k == 0 else w[2] if k == 1 else w[0])
 # The beam tips a little either side of level, slowly.
 tilt = sin(frame / 8 * 2 * pi)
 lift = round(tilt * 2)
 for i in range(-17, 18):                          # the beam across the top
  y = 12 + round(tilt * 2 * (i / 17))
  c.set(cx + i, y, m[5]); c.set(cx + i, y + 1, m[3]); c.set(cx + i, y + 2, m[1])
 c.set(cx, 9, m[4]); c.set(cx, 10, m[6]); c.set(cx, 11, m[5])   # the pivot
 c.set(cx - 1, 10, m[2]); c.set(cx + 1, 10, m[2])
 for side, dx in ((0, -17), (1, 17)):              # a pan hanging at each end
  hang = 12 + round(tilt * 2 * (dx / 17)) + 2
  px = cx + dx
  for k in range(8):                               # two cords, straight
   c.set(px - 5 + k // 2, hang + k, pan[3])
   c.set(px + 5 - k // 2, hang + k, pan[2])
  top = hang + 8
  for y in range(top, top + 5):                    # the pan itself
   half = 7 - (y - top) * 2
   for x in range(px - half, px + half + 1):
    u = (x - px) / max(half, 1)
    c.set(x, y, pan[5] if u < -0.25 else pan[4] if u < 0.45 else pan[2])
  c.hline(px - 7, px + 7, top, pan[6])
  c.set(px - 7, top, pan[3]); c.set(px + 7, top, pan[1])
  c.hline(px - 2, px + 2, top + 4, pan[1])
  if side == 0:                                    # something in the near pan
   for x in range(px - 4, px + 5):
    c.set(x, top - 1, RAMPS['straw'][4 if x % 2 else 3])
   c.hline(px - 2, px + 2, top - 2, RAMPS['straw'][5])
 box = RAMPS['oak7']                               # the box of weights
 for y in range(40, 50):
  for x in range(36, 51):
   u = (x - 36) / 15
   tone = 5 if u < 0.25 else 4 if u < 0.7 else 2
   if (x - 36) % 5 == 0: tone -= 2
   c.set(x, y, box[max(tone, 1)])
 c.hline(36, 50, 40, box[6]); c.hline(36, 50, 49, box[0])
 for i, x in enumerate((39, 43, 47)):              # the weights on its lid
  h = 3 + i
  for y in range(40 - h, 40):
   half = 1 if y < 40 - h + 1 else 2
   for px2 in range(x - half, x + half + 1):
    c.set(px2, y, m[5] if px2 < x else m[3])
  c.set(x, 40 - h - 1, m[4])
 _ground(c, cx, 50, 22)
 soft_outline(c, w[0], w[2])
 return c.image()


MARKET = {
 'beam-scale': beam_scale,
}


def cloth_counter(bale, tied, bolts):
 from PIL import Image, ImageDraw
 im = Image.new('RGBA', (77, 69))
 d = ImageDraw.Draw(im)
 ink, end, oak, sun = '#493728', '#6d4932', '#a26e43', '#dfb278'
 d.polygon([(7,54),(53,48),(74,56),(69,62),(26,66),(6,60)], fill=(50,39,32,52))
 def post(x, y, foot):
  d.rectangle((x,y,x+3,foot),fill=end)
  d.line((x,y+1,x,foot-2),fill=sun)
  d.line((x+3,y,x+3,foot),fill=ink)
 for x,y,foot in [(11,8,51),(59,7,52),(6,24,59),(55,26,61)]: post(x,y,foot)
 d.polygon([(10,34),(57,35),(63,43),(15,44)],fill=oak,outline=ink)
 d.polygon([(15,44),(63,43),(63,48),(15,50)],fill='#79513b',outline=ink)
 d.line((16,45,61,44),fill=sun)
 for x in [17,58]: post(x,49,57)
 d.line((19,54,56,52),fill=end,width=2)
 d.line((12,38,52,39),fill='#c7915e')
 d.line((20,41,40,41),fill='#f0cb88')
 for x in range(21,41,4): d.point((x,41),fill=end)
 # Folded bolts spread over the edge of the worktop.
 if bolts:
  for x,y,light,mid,dark in [(27,37,'#d7a97e','#b96e52','#844b40'),(31,34,'#98bbc1','#618c9b','#40556a')]:
   d.polygon([(x,y),(x+14,y-1),(x+17,y+2),(x+15,y+5),(x+1,y+6)],fill=dark)
   d.polygon([(x+1,y),(x+14,y),(x+15,y+2),(x+2,y+3)],fill=light)
   d.line((x+3,y+4,x+14,y+3),fill=mid)
  d.polygon([(46,37),(52,37),(54,42),(54,49),(51,52),(46,50),(47,44)],fill='#b99762',outline=end)
  d.line((48,40,49,49),fill='#f5d291')
 d.rectangle((17,34,22,37),fill=end,outline=ink)
 d.line((17,34,22,34),fill='#e3bd78')
 # The rear rope is higher at both posts; the sunward cloth sags between ties.
 back = [(10,8),(21,10),(32,12),(44,11),(59,7)]
 front = [(4,23),(16,27),(28,28),(42,28),(57,24)]
 for i in range(4):
  a,b = back[i:i+2]; c,e = front[i:i+2]
  d.polygon([a,b,e,c],fill=['#d4ad72','#edc994','#e1bb83','#d8af79'][i])
  d.line((a,c), fill='#b38b62')
  d.line((a[0]+2,a[1]+1,c[0]+2,c[1]-1),fill='#f3d6a2')
  if i in (0,3):
   d.line((a[0]+5,a[1]+1,c[0]+5,c[1]-1),fill='#678d8b',width=2)
  d.polygon([c,e,(e[0]-1,e[1]+3),(c[0]+4,c[1]+5),(c[0],c[1]+4)],fill=['#aa825a','#b99469','#b38860','#9f7956'][i])
  d.line((c,e),fill='#f7d7a0')
 d.line(back,fill='#755741'); d.line((58,7,64,16,70,54),fill='#826348')
 d.line((60,11,64,16),fill='#e1bd7f')
 for x,y in [(11,7),(59,6),(6,23),(56,24)]:
  d.rectangle((x-1,y-1,x+2,y),fill=end);d.point((x,y-1),fill='#f6d396')
 if tied: im.alpha_composite(bale,(44,47))
 im.info['anchor']=[34,58]
 return im


def landing_skids(bale, direction, count):
 from PIL import Image, ImageDraw
 im = Image.new('RGBA', (81, 61))
 d = ImageDraw.Draw(im)
 dx,dy = {'north':(0,-1),'south':(0,1),'west':(-1,0),'east':(1,0)}[direction]
 def at(a,b,h=0): return (round(40+a*dx-b*dy),round(34+(a*dy+b*dx)*.64-h))
 def plank(a,b,length,width,high,top,face):
  pts=[at(a,b,high),at(a+length,b,high),at(a+length,b+width,high),at(a,b+width,high)]
  d.polygon([*pts,pts[0]],fill=top,outline='#694a35')
  for p,q in zip(pts,pts[1:]+pts[:1]):
   if q[0]<p[0]: d.polygon([p,q,(q[0],q[1]+2),(p[0],p[1]+2)],fill=face)
  d.line([at(a+2,b+1,high),at(a+length-3,b+1,high)],fill='#d1ac79')
 for a in [-21,-6,10]:
  plank(a,-15,4,31,1,'#966e4d','#684936')
 for b in [-12,-3,7]:
  plank(-25,b,47,6,3,'#b38559','#755339')
  d.line([at(-14,b+3,3),at(-7,b+3,3)],fill='#8d664b')
 for x,y in sorted([at(-20,-17),at(-20,17)],key=lambda pt:pt[1]):
  d.rectangle((x-2,y-13,x+2,y),fill='#866043',outline='#654a37')
  d.line((x-1,y-11,x-1,y-1),fill='#cb995f')
  d.ellipse((x-3,y-15,x+2,y-12),fill='#d7b780',outline='#6a503a')
  d.line((x-2,y-8,x+2,y-7),fill='#e4c391')
 x,y=at(-13,21)
 for k in range(3):
  d.ellipse((x-6+k,y-3+k,x+6-k,y+3-k),outline=['#886c46','#d8b681','#ac895c'][k])
 d.line((x+3,y+2,x+8,y+4,x+11,y+2),fill='#a28259')
 for x,y in sorted([at(-13,-6,4),at(3,6,4),at(-12,9,10)][:count],key=lambda pt:pt[1]):
  bx,by=bale.info['anchor'];im.alpha_composite(bale,(x-bx,y-by))
 im.info['anchor']=[40,34]
 return im


def fish_stall(shed, state):
 from PIL import Image, ImageDraw
 im = Image.new('RGBA', (75, 61))
 d = ImageDraw.Draw(im)
 ink, wood, bamboo, tip = '#443831', '#825b41', '#b99263', '#e1c18c'
 d.polygon([(5,49),(53,44),(73,51),(66,58),(23,60)], fill=(49,44,58,62))
 def post(x, y, foot):
  d.rectangle((x,y,x+3,foot),fill=wood,outline=ink)
  d.line((x+1,y+1,x+1,foot-1),fill=bamboo)
  d.line((x,y+3,x+3,y+4),fill=tip)
 for x,y,h in [(12,10,46),(60,10,47),(5,24,54),(56,24,55)]: post(x,y,h)
 if shed:
  for x in range(14,60,3):
   d.line((x,21,x,44),fill=wood if x%2 else bamboo)
  for y in [28,42]: d.line((12,y,62,y),fill=ink)
  d.line((8,48,55,28),fill=wood,width=2)
  for y in [33,40]:
   d.line((5,y,28,y+1,57,y-1),fill=bamboo,width=2)
   d.line((6,y-1,28,y,56,y-2),fill=tip)
  if state:
   for i,x in enumerate([16,31,47][:(state-1)%3+1]):
    y=32+(i%3)
    d.line((x,y,x+1,y+4),fill=ink)
    pts=[(x+1,y+2),(x+4,y+4),(x+3,y+7),(x,y+9),(x-2,y+13),(x-3,y+11),(x-5,y+11),(x-2,y+8),(x-2,y+5)]
    d.polygon(pts,fill='#c39460' if state>3 else '#a0b8af',outline=ink)
    d.line((x+1,y+4,x-1,y+8),fill='#f6d796' if state>3 else '#e3ebe0')
    d.point((x+2,y+4),fill=ink)
  # Bound reed mat over a shallow pitched roof, with an uneven cut edge.
  d.polygon([(2,24),(10,8),(62,8),(69,25),(58,29),(3,28)],fill='#79563e',outline=ink)
  for x in range(5,59):
   length=[0,2,1,0,3,1,2][x%7]
   d.line((x+6,10,x,25+length),fill=['#b38a57','#c7a16b','#a0774c','#d4ad74','#ba945f'][x%5])
  for y in [14,21]: d.line((11-(y-10)//2,y,60-(y-10)//2,y),fill=wood)
  d.line((10,8,62,8),fill=tip,width=2)
 else:
  for x in [11,51]: post(x,37,54)
  d.polygon([(7,36),(54,36),(61,43),(55,48),(6,47),(3,43)],fill=wood,outline=ink)
  d.polygon([(9,35),(52,35),(59,42),(4,42)],fill=bamboo,outline=ink)
  d.line((6,43,57,43),fill=tip)
  for x in [17,34,49]:
   d.ellipse((x-8,36,x+6,42),fill=wood,outline=ink)
   d.arc((x-7,36,x+5,41),0,175,fill=tip)
   if state:
    for ax,ay in [(x-4,37),(x-1,39)]:
     d.line((ax,ay+1,ax+5,ay),fill='#424e54',width=2)
     d.line((ax+1,ay+1,ax+4,ay),fill='#e3e6ca')
     d.point((ax-1,ay),fill='#aab9b7')
  d.polygon([(3,23),(11,7),(60,7),(66,22),(57,27),(4,26)],fill='#566a74',outline=ink)
  for x in range(7,56,8):
   d.line((x+6,9,x,24),fill='#8b9c9c')
   d.polygon([(x-2,24),(x+6,24),(x+5,32+(x%3)),(x+2,33),(x-2,32)],fill='#344759',outline='#38454e')
   d.line((x-1,26,x-1,31),fill='#657d87')
  d.line((9,8,61,8),fill=bamboo,width=2); d.line((3,24,57,25),fill='#b7c0b3')
  d.line((26,28,30,28,29,30,26,30,25,29,23,30),fill='#e5d8b6')
 im.info['anchor']=[33,52]
 return im


# The market uses the buildings' native pot profiles, fitted masonry and timber light.
from art.front_materials import C, ramp
from art.front_props import pot
from art.front_solid import lathe
from art.front_stepped import coursed, glyph, plaster
from PIL import ImageDraw
from random import Random

OCHRE = ramp(69, .095, lift=-.045)
SILT = ramp(55, .105, lift=-.07)
BASKET = ramp(75, .103, lift=-.09)
EARTHEN = ramp(40, .13, lift=-.085)
METAL = ramp(44, .148, lift=-.055)
FLAX = ramp(87, .038)
MADDER = ramp(29, .104, lift=-.095)
RIVER_BLUE = ramp(213, .074, lift=-.08)
TIMBER = ramp(61, .087, lift=-.13)


def river_post(d,x,foot,height):
 top=foot-height
 d.rectangle((x-2,top,x+2,foot), fill=TIMBER[5])
 d.line((x-1,top+1,x-1,foot-2),fill=TIMBER[2])
 d.line((x+2,top+2,x+2,foot),fill=TIMBER[7])
 d.ellipse((x-2,top-1,x+2,top+1),fill=TIMBER[1])
 for y in (top+5,top+7):
  d.line((x-3,y,x+2,y+1),fill=BASKET[3])
  d.point((x-2,y),fill=BASKET[1])


# Painted at native scale. Shared by the stall and the parcels down on the landing.
BEER_JAR = (
 '.......abbbb......',
 '......aggeebb.....',
 '.......cffcb......',
 '.......cdeeb......',
 '......ddfeec......',
 '.....deggfeec.....',
 '...bdeffgffeedb...',
 '..bdeefggffeeddb..',
 '.bdefgfgfffeeecdb.',
 '.cdefffeeeeeeedcb.',
 '.bccccddbcccccccb.',
 '.bggfccfgccfggccb.',
 '.cdeeggeeeggffeeb.',
 '.cdeefffffeedddcb.',
 '..cdefffffeedddbb.',
 '..cddffffeedddccb.',
 '...bcdeeeeedcccb..',
 '....bcddeeeddcb...',
 '.....bccddcccb....',
 '......bbccccb.....',
)
TIED_JAR = (
 '......cfffec.....',
 '......bcdccb.....',
 '.......eddb......',
 '.....cdeeedb.....',
 '...bdefgfeeddb...',
 '..beffgffeeeecb..',
 '..cfggggfffeeddb.',
 '.bgeeddddeeddgcb.',
 '.cegddddeddggdcb.',
 '.cdeggddeggeddcb.',
 '.cdeefgggfeedccb.',
 '.cddeggdggeddccb.',
 '..cggffeedggdccb.',
 '..cgdeffeeedgcb..',
 '...cdeeeeeedgb...',
 '....ccdddddcb....',
 '.....bbccdcbb....',
 '.......bbbb......',
)
COPPER_CAKE = (
 '....ddeffffeed...',
 '..deggggffeeeeb..',
 '.dfggfffeeeddccb.',
 'agffeeeedeeedcccb',
 'bdeeeeedddeedcccb',
 '.bcdeeeedddccccb.',
 '..bccddddccccbb..',
 '....bbccccbbb....',
)
GRAIN_MEASURE = (
 '.....cceeeec.....',
 '...ceffgfgffeec..',
 '..deggfgggfgeeed.',
 '.cffgfffgffffedc.',
 '.dggffeeeedddccb.',
 '.ceeeffffeeeeccb.',
 '.bcddcccdccccccb.',
 '..dffeefeeedddcb.',
 '..cddeeddcddcccb.',
 '...ceffeeeedccb..',
 '....bcdddcccb....',
 '......bbbbb......',
)
def painted(c,rows,x,y,colours):
 glyph(c,x-len(rows[0])//2,y-len(rows)+1,rows,dict(zip('abcdefg',colours)))


def hanging_cloth(d,x,y,w,h,accent,sway=0):
 # A folded width over a pole. The short return behind it casts a narrow shadow.
 outline=[(x,y),(x+w,y-1),(x+w-1,y+5),(x+w-2+sway,y+h-1),
          (x+w-6+sway,y+h+1),(x+3+sway,y+h),(x+1+sway,y+h-3)]
 d.polygon(outline,fill=accent[6])
 d.polygon([(x+1,y+1),(x+w-2,y),(x+w-4,y+5),(x+w-5+sway,y+h-1),(x+3+sway,y+h-1)],fill=accent[3])
 d.polygon([(x+3,y),(x+7,y),(x+5,y+7),(x+5+sway,y+h-3),(x+3+sway,y+h-4)],fill=accent[1])
 d.line((x+w-4,y+3,x+w-6,y+8,x+w-6+sway,y+h-4),fill=accent[5])
 for k in range(3,w-4,4):
  d.line((x+k+sway,y+h-5,x+k+2+sway,y+h-3,x+k+4+sway,y+h-5),fill=FLAX[1])
  d.line((x+k+sway,y+h,x+k-1+sway,y+h+2+k%2),fill=accent[4])
 d.line((x+2,y,x+w-2,y-1),fill=accent[1])


def receipt(d,x,y):
 d.polygon([(x,y),(x+3,y-4),(x+12,y-3),(x+12,y+2),(x+10,y+4),(x,y+3)],fill=SILT[6])
 d.polygon([(x,y),(x+3,y-4),(x+12,y-3),(x+10,y+2),(x+1,y+2)],fill=SILT[2])
 for ax,ay in [(3,-1),(6,-1),(9,-1),(2,1),(6,1)]:
  d.line((x+ax,y+ay,x+ax+1,y+ay),fill=SILT[5])
 d.line((x+10,y+3,x+17,y-3),fill=TIMBER[4])
 d.point((x+17,y-3),fill=BASKET[1])


def river_goods(c,kind,x,foot,size=1):
 d=ImageDraw.Draw(c.im)
 if kind=='beer':
  clay=EARTHEN if size>=1 else SILT
  colours=[clay[5],clay[7],clay[5],clay[4],clay[3],clay[2],clay[1]]
  tied=size<1
  if tied:colours[-1]=BASKET[1]
  painted(c,TIED_JAR if tied else BEER_JAR,x,foot,colours)
  if not tied:d.line((x+1,foot-20,x+2,foot-24,x+5,foot-27),fill=BASKET[3])
 elif kind=='grain':
  colours=[BASKET[6],BASKET[7],BASKET[5],BASKET[4],BASKET[3],OCHRE[2],OCHRE[1]]
  painted(c,GRAIN_MEASURE,x,foot,colours)
 elif kind=='copper':
  colours=[METAL[1],METAL[7],METAL[5],METAL[4],METAL[3],METAL[2],METAL[1]]
  painted(c,COPPER_CAKE,x,foot,colours)
  if size<1:d.line((x+2,foot-2,x+5,foot-3),fill='#647e70')
 else:
  for dx,dy in ((0,0),(2,-3),(-1,-6)):
   left,right,y=x+dx-round(8*size),x+dx+round(8*size),foot+dy
   d.polygon([(left,y-2),(left+2,y-5),(right-1,y-5),(right+1,y-3),(right,y),(left+1,y+1)],fill=FLAX[4])
   d.polygon([(left,y-2),(left+2,y-5),(right-1,y-5),(right,y-3),(right-2,y-2)],fill=FLAX[1])
   d.line((left+3,y-1,right-3,y-2),fill=FLAX[2])
   d.line((left+5,y-4,left+4,y-2,left+4,y),fill=MADDER[4])


def reed_roof(d,x,y,w,depth,seed):
 rng=Random(seed)
 # Hipped reed mat roof, with a shadow plane at the right verge.
 a=x+8; b=x+w-10; e=y+depth
 d.polygon([(x,e),(a,y),(b,y),(x+w,e-1),(x+w-1,e+4),(x+1,e+5)],fill=BASKET[6])
 d.polygon([(x,e),(a,y),(b,y),(b+3,e),(x,e+1)],fill=BASKET[3])
 d.polygon([(b,y),(x+w,e-1),(b+3,e)],fill=BASKET[5])
 for k in range(0,b-a-1,3):
  start=a+k; end=x+1+round(k*(b+2-x)/(b-a))
  d.line((start,y+2,end,e+rng.randrange(2)),fill=BASKET[rng.choice([2,2,3,4])],width=rng.choice([1,2]))
 for i in (1,2):
  h=depth*i//3
  d.line((a-8*i//3,y+h,b+i,y+h,b+10*i//3,y+h-1),fill=BASKET[4])
 for k in range(1,w-1,2):
  n=rng.randrange(2,6)
  d.line((x+k,e,x+k-1,e+n),fill=BASKET[rng.choice([2,3,4,5])])
 d.line((a,y,b,y),fill=BASKET[1],width=2)
 for k in range(a+3,b,12):d.line((k,y-1,k+1,y+2),fill=TIMBER[4])


def cloth_shade(d,x,y,w,depth,accent,seed):
 # Four widths tied to a ridge rope; the free hems sag between the front pegs.
 for j in range(4):
  a=x+w*j//4; b=x+w*(j+1)//4
  lift=[0,2,3,2,0]
  top=y+lift[j]; end=y+lift[j+1]
  p,q=(a-3,top+depth),(b-3,end+depth)
  d.polygon([(a,top),(b,end),q,p],fill=FLAX[1+j%2])
  d.polygon([p,q,(q[0]-2,q[1]+4),(p[0]+3,p[1]+5),(p[0],p[1]+3)],fill=FLAX[3])
  for k in (3,6) if seed%2 else (4,):
   d.line((a+k,top+1,a+k-3,p[1]-1),fill=accent[3],width=2 if k==4 else 1)
  d.line((p,q),fill=FLAX[0]);d.line((a,top,b,end),fill=FLAX[4])
  d.line((a+1,top+2,p[0]+1,p[1]-2),fill=FLAX[3])


def river_counter(cargo, stocked, variant, motion=0):
 c=C(98,83);d=ImageDraw.Draw(c.im)
 x=(9,6,12)[variant]; w=(65,75,58)[variant]; right=x+w
 d.polygon([(x,60),(right-4,57),(right+9,63),(right+12,69),(right+3,72),(x+4,69)],fill=(57,39,36,47))
 def bench(a,b,y):
  for p in (a+4,b-4):river_post(d,p,y+8,10)
  d.rectangle((a,y-5,b,y+2),fill=TIMBER[5])
  d.polygon([(a,y-5),(a+3,y-12),(b,y-12),(b,y-5)],fill=TIMBER[2])
  d.line((a,y-5,b,y-5),fill=TIMBER[1])
  d.line((a+8,y-9,b-4,y-9),fill=TIMBER[3])
  d.line((a+5,y+6,b-5,y+6),fill=TIMBER[4],width=2)
  for px in range(a+6,b-6,13):
   d.line((px,y,px+4,y),fill=TIMBER[4])
   d.point((px,y-4),fill=TIMBER[6])
 def wall(a,b,top,bottom):
  plaster(c,a,top,b-a,bottom-top,SILT,q=4,seed=variant,wear=.5,stone=EARTHEN)
  coursed(c,a,bottom-6,b-a,6,EARTHEN,q=5,course=3,block=11,seed=variant)
  for px in (a,b-4):
   d.rectangle((px,top,px+3,bottom-1),fill=SILT[5])
   d.line((px,top+2,px,bottom-3),fill=SILT[3])
 def niche(a,y,w,h):
  d.rectangle((a,y,a+w,y+h),fill=EARTHEN[7])
  d.line((a+w,y+1,a+w,y+h,a,y+h),fill=SILT[2])
  d.line((a+1,y+1,a+w-1,y+1),fill=TIMBER[7],width=2)
 if cargo=='copper':
  wall(x+4,right-4,23,58)
  niche(x+8,32,24,17); niche(right-23,31,15,14)
  pot(c,right-15,44,'jug',OCHRE,scale=.72)
  if variant==1:
   reed_roof(d,x-1,6,w-17,17,variant)
   cloth_shade(d,right-21,12,24,13,MADDER,variant)
  else:reed_roof(d,x-1,5+(variant==2)*3,w+2,18,variant)
  bench(x+3,right-1,57)
  hanging_cloth(d,x+6,53,16,9,(RIVER_BLUE,MADDER,RIVER_BLUE)[variant])
  # The balance hangs clear of the dark recess; the angled beam has two suspended pans.
  cx=x+21
  d.line((cx,52,cx,32),fill=TIMBER[5],width=3)
  d.line((cx-13,35+motion,cx+13,31-motion),fill=METAL[2],width=2)
  for k,py in [(-12,35),(12,32)]:
   px=cx+k
   d.line((px-4,py+10,px,py,px+4,py+10),fill=BASKET[1])
   d.pieslice((px-5,py+7,px+5,py+13),0,180,fill=METAL[4])
   d.line((px-4,py+10,px+4,py+10),fill=METAL[1])
  if stocked:
   for a,b in [(right-20,53),(right-9,52),(right-15,48),(right+2,69)][:1 if stocked==1 else 4]:river_goods(c,cargo,a,b)
  receipt(d,right-34,51)
  # Dark stone duck weight, its head turning back into the shoulder.
  d.ellipse((x+3,48,x+10,51),fill='#4b4547')
  d.line((x+8,48,x+8,45,x+5,46,x+6,47),fill='#605b56')
  d.line((x+4,48,x+6,48),fill='#aa9f87')
 elif cargo=='beer':
  # A round-fronted bound reed shelter. Each hoop turns over the barrel roof.
  cx=x+w//2; rad=w//2-4; spring=39+(variant==1)*3
  wall(cx-rad,cx+rad,spring-3,61)
  arc=[(cx+round(rad*cos(pi*k/40)),spring-round(24*sin(pi*k/40))) for k in range(41)]
  for j in range(13,-1,-1):
   curve=[(a+round(j*.28),b-j) for a,b in arc]
   for i,(a,b) in enumerate(zip(curve,curve[1:])):
    tone=5 if i<9 else 4 if i<17 else 2 if i<32 else 3
    d.line((a,b),fill=BASKET[min(7,tone+(1 if j in (1,6,12) else 0))],width=2)
  d.polygon(arc,fill=BASKET[5]);d.rectangle((cx-rad,spring,cx+rad,58),fill=BASKET[5])
  d.pieslice((cx-rad+5,spring-19,cx+rad-5,spring+19),180,360,fill=TIMBER[7])
  d.rectangle((cx-rad+5,spring,cx+rad-5,57),fill=TIMBER[7])
  # Bent reed ribs cross the mat seams and lash into the springing posts.
  for i in range(2,38,3):
   a,b=arc[i]
   d.line((a,b-2,a+3,b-11),fill=BASKET[4 if i<16 else 3])
   d.line((a+1,b-8,a+3,b-12),fill=BASKET[2])
  for a in range(cx-rad+8,cx+rad-7,4):
   ht=round(12*(1-((a-cx)/(rad-5))**2))
   d.line((a,spring-ht,a,54),fill=TIMBER[6])
  d.line((cx-rad+7,45,cx+rad-7,45),fill=BASKET[5],width=2)
  d.line(arc,fill=BASKET[1],width=2)
  for i in (4,10,17,23,30,36):
   a,b=arc[i]; d.line((a,b-1,a+1,b+2),fill=BASKET[4])
  for side in (-1,1):river_post(d,cx+side*(rad-1),62,25)
  # A half-height reed screen and a serving mat leave the shade open to the quay.
  for k in range(9):
   px=cx+rad-15+k
   d.line((px,spring-2+(k%3),px,58),fill=BASKET[[3,4,2,4][k%4]])
  for sy in (spring+3,spring+10,55):d.line((cx+rad-16,sy,cx+rad-6,sy+1),fill=TIMBER[4])
  # Cups nest on the shelf; the long scoop hangs where the server can reach it.
  for px in (cx-10,cx-4):
   d.arc((px-3,37,px+3,41),0,180,fill=EARTHEN[2])
   d.line((px-3,37,px+2,37),fill=OCHRE[2])
  d.line((cx-14,42,cx+1,42),fill=TIMBER[3],width=2)
  d.line((cx+4,29,cx+3,38),fill=BASKET[2])
  d.ellipse((cx+1,37,cx+5,40),fill=BASKET[4],outline=BASKET[2])
  bench(cx-12,cx+12,58)
  hanging_cloth(d,cx-8,52,14,8,MADDER)
  pot(c,cx-7,51,'jug',OCHRE,scale=.7)
  pot(c,cx+4,52,'basket',BASKET,scale=.52)
  if stocked:
   for a,b,size in [(cx-18,53,.9),(cx+14,55,1.15),(cx+23,64,1),(cx+30,69,.74),(cx-22,67,.85)][:1 if stocked==1 else 5]:
    river_goods(c,cargo,a,b,size)
 elif cargo=='grain':
  # Twin plaster storage bins with high filling mouths and low draw-off shutters.
  for j,(cx,y,r) in enumerate([(x+18,60,17),(right-16,61,14)]):
   h=(30,38,33)[variant]-j*4
   lathe(c,cx,y,[(0,r-2),(4,r),(h-10,r),(h-5,r-3),(h,r*.46),(h+2,r*.5)],OCHRE,
         hollow=(r*.36,h-2),fill=(h+1,OCHRE) if stocked else None)
   if stocked:
    d.ellipse((cx-4,y-h-4,cx+3,y-h-2),fill=OCHRE[2])
    d.line((cx-3,y-h-4,cx,y-h-5,cx+2,y-h-4),fill=OCHRE[1])
   for sx,sy,width in [(-r+3,-14,4),(5,-10,4),(3,-17,5),(6,-19,3)]:
    d.line((cx+sx,y+sy,cx+sx+width,y+sy),fill=OCHRE[4 if sx<0 else 5])
   d.arc((cx-r+3,y-8,cx+r-3,y+4),15,115,fill=OCHRE[5])
   d.rectangle((cx-4,y-11,cx+4,y-4),fill=TIMBER[6])
   d.line((cx-5,y-12,cx+5,y-12),fill=TIMBER[2],width=2)
   for dx in (-3,1,3):d.line((cx+dx,y-10,cx+dx,y-5),fill=TIMBER[4])
  if variant==1:
   river_post(d,right-4,61,38)
   cloth_shade(d,right-32,18,34,9,RIVER_BLUE,variant)
  for dx in (0,6):d.line((x+4+dx,63,x+12+dx,27),fill=TIMBER[4],width=2)
  for k in range(6):d.line((x+5+k,59-k*5,x+11+k,59-k*5),fill=BASKET[2])
  # The wooden measure hangs mouth-out from the peg beside the grain shutter.
  d.line((right-15,46,right-12,40),fill=TIMBER[3],width=2)
  d.ellipse((right-20,44,right-14,49),fill=TIMBER[2],outline=TIMBER[5])
  d.line((right-18,46,right-16,45),fill=TIMBER[5])
  if stocked:
   for a,b,size in [(right-17,64,1.2),(right-3,67,1),(right-21,70,.8)][:1 if stocked==1 else 3]:river_goods(c,cargo,a,b,size)
 else:
  accent=(RIVER_BLUE,MADDER,BASKET)[variant]
  for p in (x+3,right-4):river_post(d,p,63,50)
  for j in range(3):
   a=x+8+j*14; y=29+j%2*3
   d.polygon([(a,y),(a+12,y+1),(a+12,49-j*2),(a+5,50-j*2),(a,48-j*2)],fill=FLAX[2+j%2])
   d.line((a+3,y+1,a+2,47-j*2),fill=FLAX[0])
   d.line((a+1,45-j*2,a+11,46-j*2),fill=accent[3],width=2)
  cloth_shade(d,x+1,8,w-1,9 if variant==2 else 16,accent,variant)
  bench(x+4,right-3,60)
  hanging_cloth(d,x+10,56,23,12,accent,motion)
  for k in range(4):
   d.line((x+14+k*3+motion,66,x+15+k*3+motion,67),fill=FLAX[1])
  if stocked:
   for a,b in [(x+15,54),(right-12,53),(right+1,69)][:1 if stocked==1 else 3]:river_goods(c,cargo,a,b)
 c.im.info['anchor']=[47,65]
 return c.im


def river_lot(cargo, direction, stock):
 im=landing_skids(None,direction,0)
 c=C(*im.size);c.im.paste(im)
 dx,dy={'east':(1,0),'west':(-1,0),'south':(0,1),'north':(0,-1)}[direction]
 goods=[]
 for bit,kind in enumerate((cargo,'beer' if cargo=='copper' else 'linen')):
  if stock & (1<<bit):
   for u,v,s in [(-14+bit*23,-5,.92),(-8+bit*23,5,1.08),(-17+bit*23,8,.8)]:
    goods.append((35+round((u*dy+v*dx)*.55),40+u*dx-v*dy,s,kind))
 for y,x,size,kind in sorted(goods):river_goods(c,kind,x,y,size)
 c.im.info['anchor']=im.info['anchor']
 return c.im

def river_mat(linen,variant):
 from .ancient import seat_mat
 c=C(45,32); d=ImageDraw.Draw(c.im)
 mat=seat_mat(variant)
 c.im.alpha_composite(mat,(4,13))
 if linen:
  # A spindle with a few turns of yarn left and a loose length pulled from it.
  d.line((26,15,32,23),fill=MADDER[5],width=2)
  d.ellipse((26,15,32,19),fill=FLAX[3],outline=TIMBER[5])
  d.line((26,17,31,17),fill=FLAX[1])
  d.line((32,22,35,24,38,23,39,21),fill=FLAX[2])
  d.line((29,20,33,24),fill=TIMBER[4])
 else:
  pot(c,31,21,'jug',EARTHEN,scale=.96)
  for x,y in [(25,23),(35,25)]:
   d.ellipse((x-3,y-3,x+3,y),fill=SILT[2],outline=SILT[5])
   d.arc((x-3,y-4,x+3,y+2),0,162,fill=EARTHEN[4],width=2)
 c.im.info['anchor']=[19,23]
 return c.im
