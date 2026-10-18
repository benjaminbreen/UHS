"""Wells and water gear. Sized off the character: ~17 source pixels to a metre."""
from math import atan2, hypot, pi
from .core import Canvas, RAMPS, STONE, WOOD, jitter, dither, grass
from .workshop import WOOD7, streak

HISTORICAL_WELLS = [
 ('timber','1. Early timber-lined well','Central Europe / c.5200–5000 BCE','Oak lining attested; exposed curb reconstructed','Tegel et al., PLOS ONE, 2012'),
 ('indus','2. Harappan brick well','Indus cities / c.2600–1900 BCE','Radial brickwork; deep brick-lined shaft','Harappa Archaeological Research Project'),
 ('roman','3. Classical stone puteal','Roman Mediterranean / c.100 BCE–300 CE','Moulded stone head; ornament simplified','The Met / Gosford Wellhead'),
 ('han','4. Han framed well','China / 206 BCE–220 CE','Timber frame and tiled cover; model-based','The Met / Han wellhead model 52526'),
 ('windlass','5. Timber windlass well','Europe / c.1100–1700 CE','Stone shaft and crank; generic reconstruction','Medieval well technology; reconstructed assembly'),
 ('japan','6. Tsurube bucket well','Japan / Edo period, 1615–1868','Square curb and pulley; reconstructed frame','The Met / Edo well-bucket form 40074'),
 ('venice','7. Venetian cistern head','Venice / mid-16th century','Bronze wellhead; ornament interpreted','Palazzo Ducale / courtyard wellheads'),
 ('westasia','8. Brick courtyard well','West Asia / c.1200–1800 CE','Brick piers + pulley; regional reconstruction','Shared lifting technology; inferred assembly'),
 ('rahat','9. Rahat water-lift head','South Asia / c.1500–1850 CE','Pot chain and wheel; drive outside sprite','Living Waters Museum / Rahat field research'),
 ('arid','10. Arid-region draw-well','North Africa / preindustrial','Low curb + leather bag; reconstruction','Functional reconstruction; exact date unassigned'),
 ('maya','11. Chultun cistern access','Maya Puuc / c.600–1000 CE','Rainwater storage access; reconstructed collar','INAH / Xlapak and Puuc water systems'),
 ('pump','12. Cast-iron pump well','Industrial settings / c.1850–1930 CE','Hand lever, spout and drain; type-based','Science Museum Group / hand water pump'),
]


def historical_wells():
 result={}
 for kind,*_ in HISTORICAL_WELLS:
  im=historical_well(kind)
  im=im.crop((0,0,im.width,im.getbbox()[3]))
  im.info['anchor']=[im.width/2,im.height]
  result[f'nature-well-{kind}']=im
 return result


def historical_well(kind):
 from PIL import Image, ImageDraw
 import math
 sizes={'timber':(62,46),'indus':(64,48),'roman':(64,50),'han':(76,66),
        'windlass':(76,66),'japan':(74,66),'venice':(72,56),'westasia':(78,66),
        'rahat':(80,66),'arid':(76,56),'maya':(72,44),'pump':(62,66)}
 im=Image.new('RGBA',sizes[kind]);d=ImageDraw.Draw(im)
 wood=['#382d29','#67503b','#99744b','#c19b69','#e0c18c']
 stone=['#343d43','#59646a','#858e8d','#afb2a7','#d6d1b9']
 brick=['#4b3230','#80503c','#ae7653','#cf9f73','#e5c399']
 pale=['#47423d','#7d796d','#ada898','#d1cbb4','#e9dfc5']
 rope=['#514230','#9a8054','#d0b681']
 void='#1d2a2e'
 def box(x0,y0,x1,y1,p):
  d.rectangle((x0,y0,x1,y1),fill=p[2],outline=p[0])
  d.line((x0+1,y0+1,x1-1,y0+1),fill=p[4])
  d.line((x0+1,y0+2,x0+1,y1-1),fill=p[3])
  d.line((x1-1,y0+2,x1-1,y1-1),fill=p[1])
 def ring(cx,cy,rx,ry,height,p,blocks=10,courses=3):
  d.rectangle((cx-rx,cy,cx+rx,cy+height),fill=p[2])
  d.ellipse((cx-rx,cy+height-ry,cx+rx,cy+height+ry),fill=p[2])
  d.rectangle((cx-rx,cy,cx-rx+3,cy+height),fill=p[3])
  d.rectangle((cx+rx-5,cy,cx+rx,cy+height),fill=p[1])
  d.polygon([(cx+rx-5,cy),(cx+rx,cy),(cx+rx,cy+height),(cx+rx-4,cy+height+ry-2)],fill=p[1])
  d.line((cx-rx,cy,cx-rx,cy+height),fill=p[0]);d.line((cx+rx,cy,cx+rx,cy+height),fill=p[0])
  d.arc((cx-rx,cy+height-ry,cx+rx,cy+height+ry),0,180,fill=p[0])
  for course in range(1,courses):
   yy=cy+round(height*course/courses)
   d.arc((cx-rx+1,yy-ry,cx+rx-1,yy+ry),0,180,fill=p[1])
  for course in range(courses):
   lo=round(height*course/courses);hi=round(height*(course+1)/courses)
   for j in range(1,blocks//2+1):
    a=math.pi*(j-(.5 if course%2 else 0))/(blocks/2+1)
    xx=round(cx+math.cos(a)*(rx-1));yy=round(cy+math.sin(a)*ry)
    d.line((xx,yy+lo,xx,yy+hi-1),fill=p[1])
    if j%3==0 and course<2:d.line((xx+1,yy+lo+2,xx+2,yy+lo+2),fill=p[3])
  d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=p[3],outline=p[0])
  ix,iy=rx-6,max(3,ry-3)
  d.ellipse((cx-ix,cy-iy,cx+ix,cy+iy),fill=void)
  d.arc((cx-ix+1,cy-iy,cx+ix-1,cy+iy+3),185,355,fill=p[1])
  d.arc((cx-rx+1,cy-ry+1,cx+rx-1,cy+ry-1),185,290,fill=p[4])
  d.arc((cx-rx+1,cy-ry+1,cx+rx-1,cy+ry-1),5,175,fill=p[2])
  for j in range(blocks):
   a=j*math.tau/blocks
   d.line((round(cx+math.cos(a)*(rx-1)),round(cy+math.sin(a)*(ry-1)),
           round(cx+math.cos(a)*ix),round(cy+math.sin(a)*iy)),fill=p[1])
 def bucket(cx,yy,p=wood):
  d.arc((cx-4,yy-6,cx+4,yy+3),180,360,fill=p[0])
  d.polygon([(cx-5,yy),(cx+5,yy),(cx+3,yy+8),(cx-3,yy+8)],fill=p[2],outline=p[0])
  d.line((cx-3,yy+1,cx-2,yy+6),fill=p[3]);d.line((cx,yy+1,cx,yy+6),fill=p[1])
  d.line((cx-3,yy+3,cx+3,yy+3),fill=p[1]);d.line((cx-3,yy+6,cx+3,yy+6),fill=p[1])
 def squared_curb(left,top,right,bottom,p):
  box(left,top,right,bottom,p)
  d.rectangle((left+4,top+4,right-4,top+13),fill=void,outline=p[0])
  d.line((left+5,top+5,right-5,top+5),fill=p[1])
  d.rectangle((left+1,top+14,right-1,top+17),fill=p[3])
  d.line((left+2,top+14,right-2,top+14),fill=p[4])
  for yy in range(top+21,bottom,5):d.line((left+2,yy,right-2,yy),fill=p[1])
  for xx in [left+4,right-4]:d.line((xx,top+18,xx,bottom-1),fill=p[1])
 if kind=='timber':
  squared_curb(9,7,52,40,wood)
  for yy in [22,28,34]:
   d.line((7,yy,54,yy),fill=wood[0]);d.line((8,yy+1,53,yy+1),fill=wood[3])
  for xx in [10,47]:
   d.rectangle((xx,19,xx+3,39),fill=wood[2]);d.line((xx,20,xx,38),fill=wood[4])
  for xx,yy in [(14,31),(32,26),(37,36)]:d.line((xx,yy,xx+4,yy+1),fill=wood[1])
 elif kind=='indus':
  ring(32,14,25,9,20,brick,18,4)
  for yy in [26,31,36]:d.line((18,yy,23,yy+1),fill=brick[3])
 elif kind=='roman':
  ring(32,14,24,9,23,pale,8,1)
  for xx,yy in [(17,24),(24,27),(39,27),(47,24)]:
   d.line((xx,yy,xx,yy+11),fill=pale[1]);d.line((xx+1,yy,xx+1,yy+10),fill=pale[3])
  d.arc((9,29,55,44),0,180,fill=pale[1]);d.arc((9,31,55,46),0,180,fill=pale[3])
  d.line((30,24,34,24),fill=pale[1]);d.line((30,25,30,35),fill=pale[3])
 elif kind=='han':
  roof=['#2c343e','#4a5661','#687681','#89959b','#bcc0b4']
  for xx in [17,56]:box(xx,20,xx+3,52,wood)
  box(13,25,63,29,wood)
  squared_curb(13,42,63,61,brick)
  roof_poly=[(7,23),(15,18),(24,6),(51,6),(61,18),(69,23),(64,25),(12,25)]
  d.polygon(roof_poly,fill=roof[2],outline=roof[0])
  for yy,lo,hi in [(10,23,53),(14,20,56),(18,16,61),(22,10,66)]:
   d.line((lo,yy,hi,yy),fill=roof[1]);d.line((lo+1,yy-1,hi-1,yy-1),fill=roof[3])
   for xx in range(lo+3,hi-2,6):d.line((xx,yy-3,xx+1,yy-1),fill=roof[1])
  box(23,5,52,7,roof)
  box(24,34,51,38,wood);d.line((38,38,38,51),fill=rope[1])
  bucket(38,49)
 elif kind=='windlass':
  for xx in [12,60]:box(xx,9,xx+4,49,wood)
  ring(38,39,28,8,15,stone,10,3)
  d.rectangle((15,19,61,26),fill=wood[2],outline=wood[0])
  d.line((16,20,60,20),fill=wood[4]);d.line((16,24,60,24),fill=wood[1])
  d.ellipse((12,19,18,26),fill=wood[3],outline=wood[0]);d.ellipse((58,19,65,26),fill=wood[1],outline=wood[0])
  for xx in range(28,46,3):d.line((xx,20,xx,25),fill=rope[1])
  d.line([(10,22),(6,22),(6,32),(11,32)],fill=wood[0]);d.line((7,23,7,31),fill=wood[3])
  d.line((37,26,37,40),fill=rope[1]);bucket(37,37)
  for xx in [14,62]:d.line((xx,30,xx,37),fill=wood[1])
 elif kind=='japan':
  for xx in [13,57]:box(xx,12,xx+3,52,wood)
  box(9,10,64,15,wood)
  squared_curb(13,41,61,61,wood)
  box(35,15,39,19,wood)
  d.ellipse((32,17,42,27),fill=wood[1],outline=wood[0]);d.arc((33,18,41,26),185,315,fill=wood[3])
  d.line((34,24,34,50),fill=rope[2]);d.line((40,24,40,45),fill=rope[1])
  bucket(34,49)
  for xx in [20,29,39,49,57]:d.line((xx,59,xx+1,61),fill=wood[0])
 elif kind=='venice':
  bronze=['#293b35','#485b48','#74836a','#a6ad83','#d2cd9b']
  d.polygon([(11,43),(17,37),(55,37),(61,43),(55,51),(17,51)],fill=pale[2],outline=pale[0])
  d.polygon([(11,16),(61,16),(56,32),(53,40),(46,44),(25,44),(18,40),(16,31)],fill=bronze[2],outline=bronze[0])
  d.polygon([(13,20),(20,23),(24,40),(20,38),(17,30)],fill=bronze[3])
  d.polygon([(49,23),(59,19),(55,33),(51,40),(45,43),(46,35)],fill=bronze[1])
  d.ellipse((10,5,62,24),fill=bronze[3],outline=bronze[0]);d.ellipse((16,9,56,19),fill=void)
  d.arc((11,6,61,23),185,290,fill=bronze[4]);d.arc((11,6,61,23),5,170,fill=bronze[1])
  for xx in [25,36,47]:
   d.polygon([(xx,26),(xx+3,30),(xx,37),(xx-3,30)],fill=bronze[1])
   d.line([(xx-1,29),(xx,27),(xx+1,30),(xx,34)],fill=bronze[3])
  d.arc((18,35,54,45),0,180,fill=bronze[0]);d.arc((19,36,53,46),0,180,fill=bronze[3])
  d.arc((7,17,17,31),75,290,fill=bronze[0]);d.arc((8,18,16,30),95,275,fill=bronze[3])
  d.arc((55,17,65,31),255,100,fill=bronze[0]);d.arc((56,18,64,30),275,80,fill=bronze[2])
 elif kind=='westasia':
  for xx in [9,61]:
   box(xx,11,xx+7,52,brick)
   for yy in range(17,49,6):d.line((xx+1,yy,xx+6,yy),fill=brick[1])
  ring(39,40,26,8,14,brick,14,3)
  box(8,9,70,14,wood)
  box(37,14,41,19,wood)
  d.ellipse((33,17,45,29),fill=wood[1],outline=wood[0]);d.arc((34,18,44,28),185,300,fill=wood[3])
  d.line((36,26,36,43),fill=rope[2]);d.line((42,26,42,38),fill=rope[1]);bucket(36,38)
 elif kind=='rahat':
  for xx in [10,65]:box(xx,23,xx+5,50,pale)
  ring(40,40,29,8,14,pale,12,3)
  box(12,24,69,28,wood)
  back=im;im=Image.new('RGBA',sizes[kind]);d=ImageDraw.Draw(im)
  d.ellipse((21,7,59,45),fill=wood[1],outline=wood[0])
  d.ellipse((24,10,56,42),fill=(0,0,0,0))
  for a in [j*math.tau/8 for j in range(8)]:
   xx=40+round(math.cos(a)*17);yy=26+round(math.sin(a)*17)
   d.line((40,26,xx,yy),fill=wood[0]);d.line((40,25,xx,yy-1),fill=wood[3])
  d.arc((20,6,60,46),180,360,fill=rope[1])
  for xx in [20,60]:d.line((xx,26,xx,43),fill=rope[1])
  for xx,yy in [(20,32),(20,41),(60,32),(60,41),(23,12),(40,6),(57,12)]:
   d.polygon([(xx-2,yy-2),(xx+2,yy-2),(xx+2,yy+2),(xx-1,yy+3)],fill=brick[2],outline=brick[0])
   d.point((xx-1,yy-1),fill=brick[4])
  d.ellipse((36,22,44,30),fill=wood[2],outline=wood[0]);d.point((39,24),fill=wood[4])
  back.alpha_composite(im);im=back;d=ImageDraw.Draw(im)
 elif kind=='arid':
  dry=['#443b30','#746550','#a49170','#c3b18b','#dfcca4']
  ring(37,22,27,9,13,dry,9,2)
  d.line((22,25,24,29),fill=dry[0]);d.line((49,25,47,30),fill=dry[0])
  d.line([(22,25),(17,38),(21,45)],fill=rope[1]);d.line([(49,25),(55,37),(57,42)],fill=rope[1])
  leather=['#3c3029','#5a4031','#8d6344','#b3895b']
  d.polygon([(54,37),(62,36),(66,43),(62,49),(54,48),(51,43)],fill=leather[2],outline=leather[0])
  d.line((55,39,53,44),fill=leather[3]);d.line((57,37,60,37),fill=leather[1])
  d.polygon([(55,35),(61,34),(62,38),(56,39)],fill=leather[1],outline=leather[0])
  for xx,yy in [(60,45),(62,43),(60,41)]:d.point((xx,yy),fill=leather[3])
 elif kind=='maya':
  stucco=['#5b5546','#88816c','#b3ad90','#d6ceb0','#e7dfc6']
  apron=[(6,23),(17,10),(31,6),(55,10),(66,24),(54,37),(19,36)]
  d.polygon(apron,fill=stucco[2],outline=stucco[1])
  d.polygon([(8,23),(19,12),(31,8),(52,11),(59,19),(47,26),(27,30)],fill=stucco[3])
  ring(33,20,14,6,3,stucco,7,1)
  d.ellipse((50,25,63,32),fill=stucco[2],outline=stucco[0]);d.arc((51,26,62,31),185,310,fill=stucco[4])
  for pts in [[(19,14),(23,16)],[(15,28),(22,27)],[(39,33),(45,30)],[(54,15),(56,18)]]:d.line(pts,fill=stucco[1])
 elif kind=='pump':
  iron=['#273b39','#3f5b53','#607e6a','#8aa58a','#b9c6a1']
  box(8,53,53,61,stone);d.line((10,56,50,56),fill=stone[1])
  d.rectangle((13,49,24,55),fill=stone[1],outline=stone[0]);d.line((14,50,23,50),fill=stone[3])
  box(26,18,34,53,iron);box(23,48,37,54,iron)
  d.ellipse((23,8,37,23),fill=iron[2],outline=iron[0]);d.arc((24,9,36,22),185,280,fill=iron[4])
  d.polygon([(26,28),(20,28),(16,32),(16,37),(21,37),(21,33),(27,33)],fill=iron[2],outline=iron[0])
  d.line((18,31,23,29),fill=iron[3]);d.line((17,36,20,36),fill=iron[0])
  d.line([(35,17),(43,11),(48,13),(51,23),(50,35)],fill=iron[0],width=3)
  d.line([(35,16),(43,10),(47,13),(50,23),(49,34)],fill=iron[3])
  d.rectangle((48,33,51,37),fill=wood[1],outline=wood[0]);d.line((28,24,28,46),fill=iron[3])
 return im


def shaft(c, cx, cy, rxi, ryi, ramp='limestone'):
 """The mouth: a course of lining stones on the far side, then the dark.

 A flat dark ellipse with a dither over it reads as a hole cut in paper. What
 sells the depth is seeing the lining curve away before the light gives out.
 """
 p = RAMPS[ramp]
 dark = ['#2f3733', '#262d2a', '#1e2422', '#181d1c', '#121616', '#0d1010', '#080a0a']
 for y in range(c.h):
  for x in range(c.w):
   X, Y = x + .5 - cx, y + .5 - cy
   d = hypot(X / rxi, Y / ryi)
   if d > 1: continue
   t = (Y / ryi + 1) / 2                        # 0 at the far lip, 1 at the near
   # How far this pixel is from the mouth's edge, along the shaft's wall.
   drop = (t - 0.02) / 0.40                     # the lining band, seen far side
   if t < 0.44 and d > 0.42:
    band = p[3] if drop < .30 else p[2] if drop < .62 else p[1]
    joint = (atan2(Y / ryi, X / rxi) % (2 * pi)) / (2 * pi) * 9
    if joint % 1 < .15: band = p[1] if drop < .5 else p[0]
    if drop > .85: band = dark[0]
    c.set(x, y, band)
    continue
   # Below the lining the light falls off: a smooth ramp with a dithered
   # boundary between each pair of steps, so no band edge shows.
   f = min(max((t - 0.26) / 0.58, 0), 1) ** 0.75
   f = f * 0.55 + (1 - abs(X) / rxi) * 0.45 * f  # darkest down the middle
   step = f * (len(dark) - 1)
   i = int(step)
   if step - i > (0.66 if dither(x, y) else 0.33): i += 1
   c.set(x, y, dark[min(i, len(dark) - 1)])


def kerb(c, cx, cy, rx, ry, rxi, ryi, wall, ramp, courses=3, across=6, blocks=11):
 """A ring of dressed stone with its wall extruded below it."""
 p = RAMPS[ramp]
 for y in range(c.h):
  for x in range(c.w):
   X, Y = x + .5 - cx, y + .5 - cy
   outer, inner = hypot(X / rx, Y / ry), hypot(X / rxi, Y / ryi)
   if outer > 1 or inner <= 1: continue
   b = (atan2(Y / ry, X / rx) % (2 * pi)) / (2 * pi) * blocks
   lit = 4 if (X - Y * 1.6) < 0 else 3
   lit = min(lit + (jitter(int(b)) % 3 == 0), 5)
   col = p[lit]
   mid = (outer + inner) / 2                   # across the ring's width
   if mid > 1.06: col = p[lit - 1]             # the outer edge rolls away
   if inner < 1.10: col = p[2]                 # inner lip, in its own shadow
   if b % 1 < .11: col = p[2]                  # radial joint
   c.set(x, y, col)
 for y in range(c.h):
  for x in range(c.w):
   X, Y = x + .5 - cx, y + .5 - cy
   if Y <= 0 or abs(X) > rx: continue
   d = X / rx
   k = max(0, 1 - d * d) ** .5
   if hypot(d, Y / ry) <= 1 or Y > wall + ry * k: continue
   shade = 4 if d < -.55 else 3 if d < .40 else 2
   top = cy + ry * k
   local, ch = y - top, wall / courses
   course = int(local // ch)
   bx = (d + 1) / 2 * across + (.5 if course % 2 else 0)
   col = p[min(shade + (jitter(int(bx), course) % 3 == 0), 5)]
   if k < .35: col = p[max(shade - 1, 1)]      # the curve turns away at the ends
   if (local % ch) / ch < .15: col = p[1]      # bed joint
   if bx % 1 < .09: col = p[1]                 # perpend
   if local > wall - 1 and dither(x, y): col = p[max(shade - 1, 1)]
   c.set(x, y, col)


def low_well(v=0):
 """About 2.4 m across the kerb and waist high."""
 c = Canvas(42, 34)
 cx, cy = 20.5, 9.5
 kerb(c, cx, cy, 20, 7.5, 15.5, 5.6, 15, STONE[v])
 shaft(c, cx, cy, 15.5, 5.6, STONE[v])
 c.rim(RAMPS[STONE[v]])
 g = RAMPS['grass']
 for x, y in [(6, 16), (7, 16), (33, 22), (34, 22), (12, 27), (28, 13)]:
  if c.get(x, y): c.set(x, y, g[1])
 return c.image()


def _hood(c, ridge, eaves, half0, half1, cover, w):
 """A pitched hood: ridge at the top, eaves fanning out below."""
 p = RAMPS[cover]
 rows = eaves - ridge
 for i in range(rows + 1):
  y = ridge + i
  half = half0 + (half1 - half0) * i // rows
  band = p[4] if i % 2 else p[3]
  c.hline(w // 2 - half, w // 2 + half, y, band)
  if cover == 'thatch':
   for x in range(w // 2 - half, w // 2 + half + 1):
    if jitter(x, y) % 5 == 0: c.set(x, y, p[5] if i % 2 else p[2])
  elif i % 2 == 0:
   for x in range(w // 2 - half + 1, w // 2 + half, 4): c.set(x, y, p[2])
 c.hline(w // 2 - half0, w // 2 + half0, ridge, p[5])
 c.hline(w // 2 - half1, w // 2 + half1, eaves, p[2])


def framed_well(v=0):
 """Roofed well: the eaves clear a standing figure by a head."""
 style = [
  {'cover': 'tile', 'post': 'wood', 'pitch': 11, 'lift': True, 'bucket': True},
  {'cover': 'thatch', 'post': 'darkwood', 'pitch': 13, 'lift': False, 'bucket': True},
  {'cover': 'wood', 'post': 'palewood', 'pitch': 9, 'lift': True, 'bucket': False},
 ][v % 3]
 c = Canvas(46, 52)
 cx, cy = 23, 30
 kerb(c, cx, cy, 17, 6.5, 13, 4.8, 13, STONE[v], courses=3, across=5)
 shaft(c, cx, cy, 13, 4.8, STONE[v])
 c.rim(RAMPS[STONE[v]])
 w = RAMPS[style['post']]
 beam = 4 + style['pitch']
 for px in (7, 35):                                    # posts, with a foot brace
  c.rect(px, beam, px + 3, 33, w[3])
  c.vline(px, beam, 33, w[1]); c.vline(px + 1, beam + 1, 32, w[4])
  c.vline(px + 3, beam, 33, w[1])
  for i in range(3):                                   # short knee brace
   bx = px + 4 + i if px < 20 else px - 1 - i
   c.set(bx, beam + 2 + i, w[2]); c.set(bx, beam + 3 + i, w[1])
 c.rect(5, beam - 2, 40, beam, w[2])                    # lintel
 c.hline(6, 39, beam - 2, w[4]); c.hline(6, 39, beam, w[1])
 _hood(c, 1, beam - 2, 3, 22, style['cover'], 46)
 if style['lift']:                                      # windlass and crank
  c.rect(17, beam + 1, 29, beam + 5, w[3])
  c.hline(17, 29, beam + 1, w[5]); c.hline(17, 29, beam + 5, w[1])
  for x in range(18, 29, 4): c.vline(x, beam + 2, beam + 4, w[2])
  c.rect(29, beam + 2, 32, beam + 3, RAMPS['iron'][3])
  c.rect(32, beam + 3, 33, beam + 7, RAMPS['iron'][2])
  c.rect(31, beam + 7, 34, beam + 9, RAMPS['iron'][3])
  rope_top = beam + 5
 else:                                                  # a plain rope over a peg
  c.rect(21, beam + 1, 25, beam + 3, RAMPS['iron'][3])
  c.set(23, beam + 4, RAMPS['iron'][2])
  rope_top = beam + 4
 r = RAMPS['rope']
 if style['bucket']:
  for y in range(rope_top, rope_top + 4): c.set(23, y, r[2] if y % 2 else r[3])
  by = rope_top + 4
  c.rect(19, by, 27, by + 8, w[2])                       # bucket
  c.rect(20, by + 1, 26, by + 7, w[3]); c.vline(20, by + 1, by + 7, w[4])
  c.vline(26, by + 1, by + 7, w[1])
  c.hline(19, 27, by, w[5]); c.hline(19, 27, by + 8, w[1])
  for hy in (by + 2, by + 6): c.hline(19, 27, hy, RAMPS['iron'][3])
  c.set(23, by - 1, RAMPS['iron'][4])
 else:
  for y in range(rope_top, cy - 1): c.set(23, y, r[2] if y % 2 else r[3])
  c.set(23, cy - 1, r[1])
 c.rim(w)
 return c.image()


def trough(v=0):
 """A feed or water trough, about 2.8 m long and knee high.

 Drawn square on, the way everything else in this view is: the top face is a
 symmetric band above the front, narrower at the back, with no lateral skew.
 A three-quarter box reads as a different game's projection.
 """
 c = Canvas(46, 26)
 stone = v == 2
 # Seven steps either way, so the boards can carry grain and a lit lip.
 w = RAMPS['ash7'] if stone else RAMPS[WOOD7[v]]
 if stone: w = ['#3b3a32', '#5f5d4e', '#847f6a', '#a8a186', '#c7bfa1', '#e3dcbe', '#f2eed8']
 water = RAMPS['water']
 back, front, base = 4, 11, 22
 for y in range(back, front + 1):                 # the top edge of the walls
  t = (y - back) / (front - back)
  inset = round(3 * (1 - t))
  c.hline(1 + inset, 44 - inset, y, w[5] if t < .4 else w[4])
 for y in range(back + 2, front - 1):             # the water, sunk inside
  t = (y - back - 2) / max(front - 3 - back, 1)
  inset = round(3 * (1 - t)) + 3
  # Darkest against the far wall, lightening toward the near lip.
  tone = 1 if t < .2 else 2 if t < .55 else 3
  c.hline(1 + inset, 44 - inset, y, water[tone])
 c.hline(9, 21, back + 3, water[4]); c.hline(11, 18, back + 4, water[5])
 c.hline(27, 37, back + 4, water[4]); c.hline(30, 35, back + 5, water[3])
 for y in range(front, base + 1):                 # the front boards
  tone = 4 if y < front + 3 else 3 if y < base - 2 else 2
  c.hline(1, 44, y, w[tone])
  streak(c, 1, 44, y, w, tone)
 c.hline(1, 44, front, w[6])                      # the lit lip
 c.hline(1, 44, base, w[1])
 if stone:
  for bx in range(7, 44, 8):                      # dressed blocks
   c.vline(bx, front + 1, base - 1, w[2])
  c.hline(1, 44, front + 5, w[2])
 else:
  c.hline(1, 44, front + 5, w[2])                 # the join between two boards
  for bx in (6, 38):                              # iron straps round the ends
   c.vline(bx, front, base, RAMPS['iron7'][3])
   c.vline(bx + 1, front, base, RAMPS['iron7'][1])
 for ex in (0, 45):                               # the end grain, either side
  for y in range(back + 3, base + 1):
   c.set(ex, y, w[2] if ex == 0 else w[1])
 for lx in (3, 39):                               # feet
  c.rect(lx, base + 1, lx + 3, base + 2, w[2])
  c.hline(lx, lx + 3, base + 2, w[0])
 c.rim(w)
 grass(c, [(0, 25, 2), (44, 25, 2)])
 return c.image()


def pump(v=0):
 """A hand pump is a post: one hand's width, chest high."""
 c = Canvas(14, 27)
 m = RAMPS[['iron', 'copper', 'iron'][v]]
 s = RAMPS['granite']
 for y in range(22, 27):                         # stone pad
  half = 5 - abs(y - 25) // 2
  c.hline(6 - half, 6 + half, y, s[3] if y < 25 else s[2])
 c.hline(2, 10, 22, s[4]); c.set(3, 24, s[4]); c.set(9, 25, s[1])
 c.rect(4, 6, 8, 23, m[3])                        # column
 c.vline(4, 6, 23, m[1]); c.vline(8, 6, 23, m[1]); c.vline(5, 7, 22, m[4])
 for y in (10, 17):
  c.rect(3, y, 9, y + 1, m[2]); c.hline(3, 9, y, m[4])
 c.rect(3, 3, 9, 7, m[2]); c.rect(4, 4, 8, 6, m[3]); c.hline(4, 8, 3, m[4])
 c.rect(9, 8, 11, 10, m[3]); c.hline(9, 11, 8, m[4])   # spout
 c.rect(11, 10, 12, 12, m[3]); c.vline(12, 10, 12, m[1]); c.hline(10, 12, 12, m[2])
 for i, (x, y) in enumerate([(7, 2), (5, 1), (3, 0)]):  # lever
  c.rect(x, y, x + 1, y + 1, m[3] if i else m[2]); c.set(x, y, m[4])
 c.set(2, 1, m[2])
 c.rim(m)
 return c.image()
