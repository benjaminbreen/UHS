"""Vessels, all turned on the same wheel.

Every ceramic body is a profile of half-widths through `revolve`, so a pot, a
jar and an amphora catch the light the same way. What tells them apart is the
profile and the fittings: rim, neck, handles, foot.
"""
from math import sqrt
from .core import (Canvas, RAMPS, belly, revolve,
                   soft_outline)

CLAY = ['terracotta7', 'buffclay7', 'redearth7']
GLAZE = ['greenglaze7', 'blueglaze7', 'creamglaze7']
METAL = ['brass7b', 'pewter7', 'copper7']


def _top(c, cx, half, y, p, open_rows=1):
 """The mouth in perspective: far rim lit, the opening dark inside it, the
 near rim standing in front. One helper, so every vessel opens the same way.
 """
 span = range(int(cx - half), int(cx + half) + 1)
 for x in span:                                   # far rim, catching the light
  u = (x + .5 - cx) / max(half, .5)
  if abs(u) > 1: continue
  c.set(x, y, p[6] if u < -0.15 else p[5] if u < 0.65 else p[4])
 for k in range(open_rows):                       # the opening
  w = half - 0.7 - k * 0.3
  for x in range(int(cx - w), int(cx + w) + 1):
   if abs((x + .5 - cx) / max(w, .5)) > 1: continue
   c.set(x, y + 1 + k, p[1] if k == 0 else p[0])
 near = y + 1 + open_rows
 for x in span:                                   # near rim, in front of it
  u = (x + .5 - cx) / max(half, .5)
  if abs(u) > 1: continue
  c.set(x, near, p[4] if u < -0.1 else p[3] if u < 0.7 else p[2])
 for x in range(int(cx - half) + 1, int(cx + half)):
  c.set(x, near + 1, p[2])


def pot(v=0):
 """A round cooking pot, 0.4 m across: the commonest thing in the world."""
 c = Canvas(11, 11)
 p = RAMPS[CLAY[v]]
 cx = 5.0
 revolve(c, cx, belly(2, 9, [3.4, 4.8, 5.2, 4.2, 2.8]), p)
 _top(c, cx, 3.6, 0, p)
 for x, y in [(2, 8), (7, 7)]:                    # firing marks
  c.set(x, y, p[1])
 c.hline(3, 6, 10, p[1])                          # it sits on its own shadow
 soft_outline(c, p[0], p[2])
 return c.image()


def storage_jar(v=0):
 """A shoulder-height jar, 0.8 m: grain, oil, water kept indoors."""
 c = Canvas(14, 20)
 p = RAMPS[CLAY[v]]
 cx = 6.5
 revolve(c, cx, belly(3, 18, [4.0, 6.2, 6.6, 5.4, 3.6, 3.2]), p)
 _top(c, cx, 4.4, 0, p, open_rows=2)
 for y in (8, 12):                                # the turning ridges
  for x in range(3, 11):
   if c.get(x, y): c.set(x, y, p[5] if x < 5 else p[4] if x < 8 else p[2])
 c.hline(4, 9, 19, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def water_jug(v=0):
 """A narrow-necked jug with one handle, 0.5 m."""
 c = Canvas(13, 17)
 p = RAMPS[CLAY[v]]
 cx = 5.0
 revolve(c, cx, belly(6, 15, [3.2, 4.6, 4.8, 3.8, 2.6]), p)
 revolve(c, cx, belly(2, 6, [1.8, 1.6, 2.2, 3.4]), p, base=0.08, rimlight=False)
 _top(c, cx, 2.4, 0, p, open_rows=0)
 for x in range(3, 8):                            # the shoulder turning over
  if c.get(x, 6): c.set(x, 6, p[5] if x < 5 else p[3])
 # One pixel of handle, standing clear of the belly: two pixels and its own
 # shade close the gap and the jug grows a boot.
 for x, y in [(8, 5), (10, 6), (11, 8), (11, 10), (9, 12)]:
  c.set(x, y, p[4])
 c.set(9, 5, p[5]); c.set(10, 7, p[3]); c.set(10, 11, p[2]); c.set(8, 12, p[2])
 c.hline(3, 7, 16, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def amphora(v=0):
 """Two handles and a pointed foot, standing in its ring: 1 m of transport."""
 c = Canvas(14, 24)
 p = RAMPS[CLAY[v]]
 cx = 6.5
 revolve(c, cx, belly(6, 19, [3.6, 5.6, 5.8, 4.4, 2.4, 1.4]), p)
 revolve(c, cx, belly(2, 6, [1.6, 1.4, 1.8, 3.0]), p, base=0.08)
 _top(c, cx, 2.6, 0, p, open_rows=0)
 for dx in (-1, 1):                               # a handle each side
  for i, (x, y) in enumerate([(3, 3), (4, 3), (5, 5), (5, 7)]):
   px = int(cx) + dx * x
   c.set(px, y, p[4] if dx < 0 else p[2])
   if i > 1: c.set(px, y + 1, p[3] if dx < 0 else p[1])
 ring = RAMPS['wicker7']                          # the stand it rests in
 for y, half in [(20, 4.0), (21, 4.4), (22, 4.0)]:
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / half
   if abs(u) > 1: continue
   c.set(x, y, ring[5 if y == 20 else 4] if u < 0 else ring[3 if y == 20 else 2])
 soft_outline(c, p[0], p[2])
 return c.image()


def glazed_jar(v=0):
 """A glazed jar: the glaze is a hard highlight and a painted band."""
 c = Canvas(13, 16)
 p = RAMPS[GLAZE[v]]
 cx = 6.0
 revolve(c, cx, belly(3, 14, [4.0, 5.8, 6.0, 4.6, 3.4]), p, gloss=1)
 _top(c, cx, 3.4, 0, p, open_rows=1)
 band = RAMPS['terracotta7'] if v != 2 else RAMPS['blueglaze7']
 for x in range(1, 12):                           # one painted line round it
  if c.get(x, 9): c.set(x, 9, band[4] if x < 6 else band[2])
 c.set(3, 6, p[6])                                # the glaze's hard glint
 c.hline(4, 8, 15, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def metal_vessel(v=0):
 """Beaten metal: a narrow specular band and a cool reflected edge."""
 c = Canvas(11, 13)
 m = RAMPS[METAL[v]]
 cx = 5.0
 revolve(c, cx, belly(3, 11, [3.4, 5.0, 5.2, 4.0, 3.0]), m, gloss=1, light=-0.62)
 _top(c, cx, 3.0, 0, m, open_rows=1)
 for x in range(1, 10):                           # one turned collar, cut in
  if c.get(x, 6): c.set(x, 6, m[1] if x > 6 else m[3])
  if c.get(x, 7): c.set(x, 7, m[6] if x < 5 else m[4])
 for x in range(2, 9):                            # ground light under the belly
  if c.get(x, 10): c.set(x, 10, m[4])
 c.hline(3, 7, 12, m[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def pithos(v=0):
 """A storage vat sunk to its shoulder, 1.4 m: a household's whole year."""
 c = Canvas(24, 26)
 p = RAMPS[CLAY[v]]
 cx = 11.5
 revolve(c, cx, belly(4, 24, [7.0, 10.4, 11.0, 9.6, 7.4, 6.0]), p)
 _top(c, cx, 7.6, 0, p, open_rows=2)
 for y in (9, 10):                                # a rope-pattern collar
  for x in range(1, 23):
   if c.get(x, y) and (x + y) % 3: c.set(x, y, p[5] if x < 11 else p[2])
 for x, y in [(4, 16), (18, 13), (9, 21)]:        # firing marks
  c.set(x, y, p[1]); c.set(x + 1, y, p[2])
 soft_outline(c, p[0], p[2])
 return c.image()


def flask(v=0):
 """A stoppered flask, 0.35 m: what a traveller carries, not what a house keeps."""
 c = Canvas(11, 16)
 p = RAMPS[CLAY[v] if v < 2 else 'creamglaze7']
 cx = 5.0
 revolve(c, cx, belly(6, 14, [3.0, 4.4, 4.6, 3.6, 2.6]), p)
 revolve(c, cx, belly(2, 6, [1.6, 1.6, 2.2, 3.4]), p, base=0.10, rimlight=False)
 for x in range(3, 8):                            # the shoulder's lit edge
  if c.get(x, 6): c.set(x, 6, p[5] if x < 5 else p[3])
 cork = RAMPS['oak7']
 c.hline(3, 6, 0, cork[5]); c.hline(3, 6, 1, cork[3])
 c.set(3, 1, cork[2]); c.set(6, 1, cork[1])
 cord = RAMPS['rope']
 for x in range(2, 9):                            # the carrying cord
  if c.get(x, 8): c.set(x, 8, cord[2] if x % 2 else cord[1])
 c.set(1, 9, cord[1]); c.set(9, 9, cord[1])
 c.hline(3, 7, 15, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def bowl(v=0):
 """A wide open bowl: the inside is most of what you see."""
 c = Canvas(13, 8)
 p = RAMPS[CLAY[v] if v < 2 else 'creamglaze7']
 cx = 6.0
 revolve(c, cx, belly(2, 7, [6.0, 5.4, 4.2, 2.6]), p)
 for y in range(0, 3):                            # the bowl's dark interior
  half = 6.0 - y * 0.8
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / half
   if abs(u) > 1: continue
   c.set(x, y, p[1] if y else p[2])
 for x in range(1, 12):
  u = (x + .5 - cx) / 6.0
  if abs(u) <= 1: c.set(x, 0, p[5] if u < -0.1 else p[3])
 c.hline(4, 8, 7, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def _mouth(c, cx, cy, rx, ry, p, inside):
 """An open top seen from a little above: a lit rim ring round a dark inside,
 the inside's near half lit where the light falls past the far rim."""
 for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   U, V = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   r2 = U * U + V * V
   if r2 > 1: continue
   if r2 > 0.5: c.set(x, y, p[6] if U < -0.2 or V > 0.4 and U < 0.4 else p[4] if V > 0 else p[3])
   else: c.set(x, y, inside[0] if V < 0.1 else inside[1])


def bucket(v=0):
 """A 0.5 m pail with a bail handle. Variants 3-5 are the small 0.35 m one."""
 if v >= 3: return _small_bucket(v - 3)
 c = Canvas(15, 19)
 w = RAMPS[['oak7', 'ash7', 'walnut7'][v]]
 m = RAMPS['blackiron7']
 cx, top, bot = 7.0, 5, 18
 prof = belly(top, bot, [6.8, 6.3, 5.8, 5.2])
 revolve(c, cx, prof, w)
 for y, h in prof.items():                        # stave joints, crowding at the sides
  for k in (-0.75, -0.3, 0.2, 0.65):
   c.set(round(cx + h * k), y, w[2] if k < 0 else w[1])
 for y0 in (8, 15):                               # hoops on the rim's curve
  h = prof[y0]
  for x in range(15):
   u = (x + .5 - cx) / h
   if abs(u) > 1: continue
   y = y0 + round(1.6 * sqrt(1 - u * u))
   c.set(x, y - 1, m[5] if u < 0.1 else m[3]); c.set(x, y, m[2] if u < 0.1 else m[1])
 _mouth(c, cx, top, 6.8, 2.2, w, (w[1], w[2]))
 for x, y in [(1, 4), (1, 3), (2, 2), (3, 1), (4, 0), (5, 0)]:   # the bail, left half lit
  c.set(x, y, m[5])
 for x, y in [(9, 0), (10, 0), (11, 1), (12, 2), (13, 3), (13, 4)]:
  c.set(x, y, m[3])
 c.hline(6, 8, 0, RAMPS['oak7'][5])               # the wooden grip
 soft_outline(c, w[0], w[2])
 return c.image()


def _small_bucket(v=0):
 """Staves and two hoops, 0.35 m: a pail, not a barrel."""
 c = Canvas(10, 12)
 w = RAMPS[['oak7', 'ash7', 'walnut7'][v]]
 m = RAMPS['blackiron7']
 cx = 4.5
 revolve(c, cx, belly(2, 10, [4.6, 4.2, 3.8, 3.2]), w)
 for x in range(0, 10):                           # staves
  if x % 3 == 0:
   for y in range(2, 11):
    if c.get(x, y): c.set(x, y, w[2])
 for y in (4, 9):                                 # iron hoops
  for x in range(0, 10):
   if c.get(x, y): c.set(x, y, m[3] if x < 5 else m[1])
  for x in range(0, 10):
   if c.get(x, y - 1) and x < 5: c.set(x, y - 1, m[5])
 for x in range(0, 10):                           # the mouth
  u = (x + .5 - cx) / 4.6
  if abs(u) <= 1:
   c.set(x, 1, w[1]); c.set(x, 0, w[4] if u < 0 else w[2])
 soft_outline(c, w[0], w[2])
 return c.image()


def basket(v=0, lid=False):
 """Coiled wicker: the weave is the whole of the shading.

 A lid needs its own rows: drawn above the canvas it falls in the one-pixel
 margin and disappears.
 """
 dy = 4 if lid else 0
 c = Canvas(12, 10 + dy)
 p = RAMPS[['wicker7', 'ash7', 'buffclay7'][v]]
 cx = 5.5
 prof = {y + dy: w for y, w in belly(2, 9, [5.6, 5.2, 4.6, 3.4]).items()}
 revolve(c, cx, prof, p)
 for y, half in prof.items():                     # coils: a light row, a dark
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / max(half, .5)
   if abs(u) > 1: continue
   if y % 2 == 0:
    c.set(x, y, p[2] if u > 0.2 else p[4])
   elif (x + y) % 2 == 0:
    c.set(x, y, p[1] if u > 0.2 else p[5])
 for x in range(0, 12):                           # the rim and the dark inside
  u = (x + .5 - cx) / 5.6
  if abs(u) > 1: continue
  c.set(x, 1 + dy, p[1]); c.set(x, dy, p[5] if u < -0.1 else p[3])
 if lid:                                          # a domed lid with a knob
  for y, half in ((dy, 5.6), (dy - 1, 5.2), (dy - 2, 4.2), (dy - 3, 2.6)):
   for x in range(int(cx - half), int(cx + half) + 1):
    u = (x + .5 - cx) / half
    if abs(u) > 1: continue
    c.set(x, y, p[5] if u < -0.2 else p[4] if u < 0.5 else p[2])
  for x in range(0, 12):
   if c.get(x, dy + 1): c.set(x, dy + 1, p[1])
  c.set(5, dy - 4, p[4]); c.set(6, dy - 4, p[2])
 soft_outline(c, p[0], p[2])
 return c.image()


def _big_basket(v=0, lid=False):
 """A 0.5 m storage basket: coils banded round a revolved body, an open
 elliptical mouth, or a domed lid with a loop."""
 dy = 3 if lid else 0
 c = Canvas(19, 15 + dy)
 p = RAMPS[['wicker7', 'ash7', 'buffclay7'][v]]
 cx = 9.0
 prof = {y + dy: h for y, h in belly(3, 14, [8.6, 8.4, 7.6, 6.0]).items()}
 revolve(c, cx, prof, p)
 for y, half in prof.items():                     # coils, and the stitches binding them
  if y % 2: continue
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / max(half, .5)
   if abs(u) > 1: continue
   c.set(x, y, p[2] if u > 0.25 else p[3])
   if (x + y // 2 * 3) % 4 == 0 and y + 1 in prof: c.set(x, y + 1, p[5] if u < 0 else p[3])
 if lid:
  for y in range(0, dy + 4):                      # a shallow dome
   for x in range(19):
    U, V = (x + .5 - cx) / 8.8, (y + .5 - (dy + 3)) / (dy + 2.5)
    if U * U + V * V > 1 or y > dy + 3: continue
    lit = U * 0.6 + V * 0.8
    c.set(x, y, p[6] if lit < -0.45 else p[5] if lit < 0.05 else p[4] if lit < 0.45 else p[3])
  for x in range(2, 17): c.set(x, dy + 3, p[1] if x > 5 else p[2])
  c.set(8, 0, p[5]); c.set(9, 0, p[4]); c.set(10, 0, p[3])
 else:
  _mouth(c, cx, 3, 8.6, 2.6, p, (p[0], p[1]))
 soft_outline(c, p[0], p[2])
 return c.image()


def open_basket(v=0):
 """Variants 0-2 the big storage basket, 3-5 the small one."""
 return _big_basket(v) if v < 3 else basket(v - 3)


def lidded_basket(v=0):
 return _big_basket(v, lid=True) if v < 3 else basket(v - 3, lid=True)


CONTAINER_STUDIES = [
 ('waterskin', 'Sewn waterskin', 'West Asia / caravan and household use', 'Tied leather neck, seams and shoulder sling'),
 ('bale', 'Bound merchant bale', 'Overland and maritime trading settings', 'Folded cloth casing, crossed hemp bindings'),
 ('matka', 'Water jar on a woven ring', 'South Asia / regional earthenware tradition', 'Unglazed rounded body and cloth mouth cover'),
 ('milkbag', 'Leather fermentation bag', 'Inner Eurasia / pastoral household', 'Broad hide body, wooden mouth and suspension loops'),
 ('onggi', 'Lidded onggi jar', 'Korea / food storage and fermentation', 'Brown glaze, broad shoulders and separate lid'),
 ('taru', 'Wooden taru', 'Japan / storage and transport', 'Straight staves, bamboo hoops and fitted lid'),
 ('ricebale', 'Straw rice bale', 'Japan / agricultural storage and transport', 'End-on straw coils and lengthwise rope bindings'),
 ('tradejar', 'Lugged trade jar', 'Southeast Asia / late medieval onward', 'Heavy glazed stoneware, shoulder lugs and stopper'),
 ('milkcontainer', 'Leather-capped milk container', 'East African pastoral traditions / Somali study', 'Tall woven body, leather cover and carrying strap'),
 ('urpu', 'Inca urpu', 'Andes / c.1400–1535 CE', 'Flared neck, side handles, pointed base in support'),
 ('barkbox', 'Lidded birchbark box', 'North American woodlands / regional tradition', 'Folded bark, root stitching and bentwood rim'),
 ('coolamon', 'Carved wooden coolamon', 'Australia / Western Desert study', 'Shallow hollowed timber, tool marks and worn lip'),
]


def container_study(kind):
 from PIL import Image, ImageDraw
 import numpy as np
 im = Image.new('RGBA', (60, 58)); d = ImageDraw.Draw(im)
 hide = ['#3e2c2b', '#684234', '#95613f', '#bb8755', '#d7ab74', '#ebca92']
 cloth = ['#3e3b3c', '#686052', '#93866c', '#b9ac8d', '#d5c8a7', '#eee0bd']
 rope = ['#554333', '#96764a', '#c3a46b', '#e1c78b']
 wood = ['#40312d', '#72503a', '#a37548', '#c49a64', '#ddba83', '#efd3a1']
 clay = ['#4f3331', '#854b36', '#b5754b', '#cf9566', '#e0b382', '#efcea1']
 glaze = ['#352e30', '#50382e', '#764b32', '#95653e', '#b18a5b', '#d0b482']
 bark = ['#484038', '#797064', '#b0a18a', '#d3c5a8', '#e8dbbc', '#f4e7cb']
 def line(points, p): d.line(points, fill=p, width=1)
 def profile(cx, rows, p):
  ys = np.arange(rows[0][0], rows[-1][0]+1)
  widths = np.interp(ys, [a for a,b in rows], [b for a,b in rows])
  for y, rr in zip(ys, widths):
   r = round(rr)
   for x in range(cx-r, cx+r+1):
    u = (x-cx)/max(r,1)
    value = 0 if abs(x-cx)==r else 1 if u>.72 else 2 if u>.28 else 3 if u>-.7 else 4
    if y >= rows[-1][0]-1 and abs(u)<.8: value = max(1,value-1)
    d.point((x,int(y)), fill=p[value])
  r0=round(widths[0]);r1=round(widths[-1])
  line([(cx-r0,int(ys[0])),(cx+r0,int(ys[0]))],p[0])
  line([(cx-r1,int(ys[-1])),(cx+r1,int(ys[-1]))],p[0])
 def rim(box,p,opening=False):
  d.ellipse(box, fill=p[3],outline=p[0])
  a,b,c,e=box
  d.arc((a+1,b+1,c-1,e-1),185,290,fill=p[5])
  if opening: d.ellipse((a+2,b+1,c-2,e-2),fill=p[0])
 def cord(points):
  d.line(points,fill=rope[0],width=3)
  line(points,rope[2])
 def stitches(points,p=rope[3]):
  for x,y in points: line([(x,y),(x+1,y-1)],p)
 if kind=='waterskin':
  line([(19,32),(17,23),(18,16),(22,11),(29,10),(35,13),(38,20),(37,32)],hide[0])
  line([(20,31),(18,23),(19,16),(23,12),(29,11),(34,14),(37,20),(36,31)],hide[2])
  shape=[(24,17),(30,18),(34,25),(39,32),(40,40),(37,47),(30,50),(20,49),(15,45),(15,37),(19,29),(22,24)]
  d.polygon(shape,fill=hide[2],outline=hide[0])
  d.polygon([(24,22),(26,25),(24,31),(21,36),(20,44),(23,47),(19,46),(17,42),(18,36)],fill=hide[3])
  d.polygon([(31,25),(37,32),(38,40),(35,46),(29,48),(31,42),(32,34)],fill=hide[1])
  line([(18,37),(18,43),(22,47),(29,48),(36,45),(38,40)],hide[0])
  stitches([(19,39),(20,43),(24,46),(28,47),(32,46),(35,44)],hide[4])
  d.polygon([(24,16),(30,17),(29,23),(23,22)],fill=hide[3],outline=hide[0])
  cord([(23,21),(30,22)]);line([(27,22),(30,25),(28,28)],rope[1])
  d.rectangle((25,14,29,17),fill=wood[2],outline=wood[0]);line([(26,14),(28,14)],wood[4])
  line([(21,31),(23,29)],hide[4]);line([(25,39),(27,41),(27,43)],hide[1])
 elif kind=='bale':
  shape=[(9,26),(13,21),(43,21),(49,26),(50,42),(46,48),(13,48),(8,43)]
  d.polygon(shape,fill=cloth[2],outline=cloth[0])
  d.polygon([(13,22),(43,22),(47,26),(13,29),(10,27)],fill=cloth[4])
  d.polygon([(10,29),(16,31),(43,29),(48,27),(48,40),(45,44),(14,44),(10,40)],fill=cloth[3])
  d.polygon([(43,30),(48,27),(49,41),(45,47),(39,47),(43,42)],fill=cloth[1])
  line([(10,28),(16,32),(23,34)],cloth[1]);line([(12,42),(18,40),(24,41)],cloth[2])
  line([(38,31),(34,35),(36,39)],cloth[2]);line([(15,46),(34,46)],cloth[1])
  for x in [20,37]:
   cord([(x-2,22),(x,28),(x,45),(x-1,48)])
   line([(x-2,23),(x-1,27)],rope[3])
  cord([(9,36),(19,37),(38,37),(49,35)])
  d.rectangle((19,35,22,38),fill=rope[0]);line([(20,35),(22,37),(20,38)],rope[3])
  line([(22,38),(26,41),(27,40),(24,38)],rope[1])
  line([(29,25),(34,24)],cloth[5]);line([(14,33),(15,35)],cloth[4])
 elif kind=='matka':
  rim((17,44,43,51),[rope[0],rope[1],rope[1],rope[2],rope[2],rope[3]])
  d.arc((18,45,42,50),5,175,fill=rope[1])
  profile(30,[(23,7),(26,11),(31,14),(37,15),(42,12),(46,7)],clay)
  line([(19,32),(18,35),(18,38)],clay[5])
  line([(22,43),(27,45),(34,45)],clay[1])
  d.ellipse((23,20,37,25),fill=clay[3],outline=clay[0])
  d.polygon([(23,20),(27,18),(34,19),(38,21),(36,24),(34,27),(31,25),(26,26),(23,23)],fill=cloth[3],outline=cloth[1])
  line([(25,20),(29,20),(31,21),(35,20)],cloth[5]);line([(25,22),(28,23),(27,25)],cloth[2])
  line([(34,22),(33,25)],cloth[1]);line([(25,24),(35,24)],rope[1])
 elif kind=='milkbag':
  for x in [19,37]:
   d.ellipse((x-3,18,x+3,26),fill=hide[2],outline=hide[0]);d.ellipse((x-1,20,x+1,23),fill=(0,0,0,0))
  shape=[(25,20),(32,20),(34,26),(40,28),(43,33),(43,46),(40,51),(19,51),(15,47),(15,33),(19,28),(24,26)]
  d.polygon(shape,fill=hide[1],outline=hide[0])
  d.polygon([(24,27),(28,24),(31,27),(36,31),(37,44),(35,48),(22,48),(18,44),(18,34)],fill=hide[2])
  d.polygon([(23,30),(25,29),(23,36),(23,44),(26,47),(20,45),(19,34)],fill=hide[3])
  line([(17,34),(17,43),(20,48),(26,49),(36,49),(40,46),(41,34)],hide[0])
  stitches([(18,36),(18,40),(20,45),(24,48),(29,49),(34,48),(39,44)],hide[4])
  line([(36,31),(38,35),(38,44)],hide[3])
  d.rectangle((25,15,32,24),fill=wood[2],outline=wood[0]);line([(26,16),(26,22)],wood[4])
  rim((24,13,33,17),wood);cord([(23,23),(33,23)])
  line([(27,31),(26,36),(28,40)],hide[1]);line([(32,40),(31,45)],hide[3])
 elif kind=='onggi':
  profile(30,[(20,9),(24,13),(29,16),(37,16),(44,13),(49,9)],glaze)
  d.arc((15,23,45,34),5,175,fill=glaze[1])
  d.arc((15,32,45,43),5,175,fill=glaze[1])
  line([(19,28),(18,31),(18,35)],glaze[5]);line([(20,37),(20,40)],glaze[4])
  line([(24,44),(30,45),(36,44)],glaze[2])
  rim((17,16,43,24),glaze)
  d.polygon([(16,19),(20,15),(25,13),(35,13),(40,15),(44,19),(43,22),(18,22)],fill=glaze[2],outline=glaze[0])
  d.ellipse((18,15,42,21),fill=glaze[3]);line([(21,16),(26,15),(34,15)],glaze[5])
  line([(18,21),(24,23),(37,23),(43,21)],glaze[1])
  d.ellipse((27,11,33,15),fill=glaze[2],outline=glaze[0]);line([(28,12),(31,12)],glaze[4])
 elif kind=='taru':
  profile(30,[(24,15),(28,15),(44,14),(49,12)],wood)
  for x in [19,24,29,34,39,43]:
   line([(x,27),(x if x<40 else x-1,46)],wood[1]);line([(x+1,29),(x+1,44)],wood[3 if x<32 else 2])
  for y in [28,42,46]:
   d.arc((15,y-4,45,y+3),0,180,fill=rope[0]);d.arc((15,y-5,45,y+2),0,180,fill=rope[2])
   d.arc((16,y-5,44,y),20,165,fill=rope[3])
  rim((14,18,46,29),wood)
  d.ellipse((17,20,43,26),fill=wood[3],outline=wood[1])
  for yy in [22,24]:line([(19,yy),(41,yy)],wood[2])
  line([(20,21),(37,21)],wood[5]);line([(21,25),(39,25)],wood[4])
  d.polygon([(22,20),(24,19),(38,24),(36,26)],fill=wood[2],outline=wood[1]);line([(24,20),(36,24)],wood[4])
  line([(19,34),(20,37)],wood[4]);line([(36,33),(37,35),(37,38)],wood[1])
 elif kind=='ricebale':
  p=['#51402d','#897045','#b19856','#ceb46d','#e1cc8b','#efdfa8']
  shape=[(14,26),(41,26),(47,29),(50,35),(49,43),(45,48),(15,49),(9,45),(7,38),(9,30)]
  d.polygon(shape,fill=p[2],outline=p[0])
  d.polygon([(13,27),(41,27),(46,30),(17,33),(10,31)],fill=p[4])
  d.polygon([(15,43),(48,41),(45,47),(16,48)],fill=p[1])
  for yy in [30,34,38,42,46]:
   for xx in range(16,45,7):line([(xx,yy),(xx+4,yy-1)],p[3 if yy<42 else 2])
  d.ellipse((6,27,24,49),fill=p[3],outline=p[0])
  d.ellipse((9,30,21,46),outline=p[1]);d.ellipse((11,33,19,43),outline=p[2]);d.ellipse((13,35,17,41),outline=p[1])
  line([(10,33),(13,31),(18,31)],p[5]);line([(10,42),(12,45),(17,46)],p[2])
  for xx in [27,41]:cord([(xx,27),(xx+3,32),(xx+3,42),(xx+1,48)])
  cord([(7,38),(23,38),(49,36)])
  line([(13,29),(14,34)],rope[1]);line([(16,41),(17,46)],rope[1])
 elif kind=='tradejar':
  p=['#34372f','#4f4c32','#777040','#99904e','#b7ad65','#d7c88a']
  for xx in [15,39]:
   d.ellipse((xx-2,21,xx+5,30),fill=p[2],outline=p[0]);d.ellipse((xx,23,xx+3,27),fill=(0,0,0,0))
  profile(30,[(14,6),(19,8),(23,13),(29,16),(37,15),(45,11),(50,8)],p)
  d.arc((16,20,44,29),5,175,fill=p[1]);d.arc((15,26,45,34),5,175,fill=p[2])
  line([(19,28),(18,32),(18,36)],p[5]);line([(20,38),(21,40)],p[4])
  line([(25,46),(34,46)],p[1])
  for xx,yy in [(22,23),(37,23)]:
   d.ellipse((xx-2,yy-2,xx+2,yy+4),fill=p[2],outline=p[0]);line([(xx,yy),(xx,yy+2)],p[0]);d.point((xx-1,yy-1),fill=p[4])
  rim((23,10,37,16),p)
  d.polygon([(25,9),(27,7),(33,7),(35,9),(34,12),(26,12)],fill=wood[2],outline=wood[0])
  line([(27,8),(32,8)],wood[4]);line([(27,10),(33,10)],wood[1])
 elif kind=='milkcontainer':
  p=['#45352b','#715238','#9f7845','#c09c60','#dbbd82','#eed6a1']
  cord([(25,17),(37,24),(40,38),(36,49)])
  profile(29,[(19,5),(24,6),(28,9),(34,10),(41,9),(48,7),(51,4)],p)
  for yy in range(28,48,3):
   rr=9 if yy<43 else 7
   d.arc((29-rr,yy-3,29+rr,yy+2),5,175,fill=p[1])
   for xx in range(29-rr+2,29+rr-1,4):line([(xx,yy),(xx+1,yy-1)],p[4 if xx<29 else 2])
  line([(23,31),(22,35),(23,41)],p[4])
  d.polygon([(22,18),(24,15),(27,13),(32,14),(36,18),(35,25),(32,28),(25,27),(22,23)],fill=hide[1],outline=hide[0])
  d.polygon([(24,18),(27,16),(31,16),(32,23),(29,25),(24,23)],fill=hide[2])
  line([(24,18),(26,16),(30,16)],hide[4]);cord([(23,24),(34,24)])
  d.rectangle((27,12,31,15),fill=hide[2],outline=hide[0])
  line([(33,26),(35,34),(34,44),(32,49)],hide[0]);line([(34,27),(36,34),(35,43)],hide[2])
 elif kind=='urpu':
  for xx in [17,38]:
   d.ellipse((xx-2,29,xx+4,39),fill=clay[2],outline=clay[0]);d.ellipse((xx,31,xx+2,36),fill=(0,0,0,0))
  profile(30,[(12,4),(19,3),(23,5),(27,10),(32,13),(38,12),(44,7),(50,1)],clay)
  d.polygon([(24,27),(28,24),(33,25),(36,28),(36,41),(32,46),(28,47),(24,42)],fill='#dec89b')
  for yy in [28,37,42]:line([(25,yy),(35,yy)],clay[1])
  for yy in [31,39]:
   line([(25,yy+1),(27,yy-1),(29,yy+1),(31,yy-1),(33,yy+1),(35,yy-1)],clay[0])
  line([(29,28),(29,36)],clay[1]);line([(31,28),(31,36)],clay[1])
  rim((23,8,37,14),clay,True);line([(26,15),(27,21)],clay[4])
  d.polygon([(28,23),(30,21),(32,23),(31,25),(29,25)],fill=clay[2],outline=clay[0]);d.point((29,22),fill=clay[4])
  rim((23,47,37,53),[rope[0],rope[1],rope[1],rope[2],rope[2],rope[3]])
  line([(25,48),(30,49),(35,48)],rope[3]);line([(25,51),(33,52)],rope[1])
 elif kind=='barkbox':
  profile(30,[(31,17),(44,16),(49,12)],bark)
  line([(15,34),(17,46),(23,48)],bark[1]);line([(16,35),(18,44)],bark[4])
  for xx,yy,length in [(20,36,4),(31,34,3),(26,41,5),(38,38,3),(33,46,4),(19,43,2)]:
   line([(xx,yy),(xx+length,yy)],bark[1 if xx>30 else 2])
  for yy in range(34,47,3):
   line([(16,yy),(19,yy+1)],rope[0]);d.point((17,yy),fill=rope[2])
  rim((11,24,49,35),wood)
  d.ellipse((13,25,47,32),fill=bark[3],outline=bark[1])
  line([(17,27),(23,26),(36,26),(42,28)],bark[5])
  line([(23,29),(27,29)],bark[1]);line([(34,27),(39,28)],bark[2])
  d.arc((24,20,36,30),180,360,fill=wood[0]);d.arc((25,21,35,30),180,360,fill=wood[3])
  for xx,yy in [(15,28),(18,30),(23,32),(29,33),(35,32),(41,31),(46,28)]:line([(xx,yy),(xx,yy+1)],rope[0])
 elif kind=='coolamon':
  shape=[(7,38),(10,34),(18,31),(30,30),(42,32),(50,36),(52,40),(49,45),(41,49),(27,51),(16,48),(9,44)]
  d.polygon(shape,fill=wood[2],outline=wood[0])
  d.polygon([(9,38),(17,34),(30,32),(41,34),(49,38),(49,42),(41,46),(28,48),(17,45),(11,42)],fill=wood[4])
  d.polygon([(12,38),(20,35),(31,34),(42,36),(47,39),(43,43),(30,46),(20,43)],fill=wood[1],outline=wood[2])
  d.polygon([(16,39),(23,37),(33,36),(41,38),(44,40),(39,42),(29,44),(21,42)],fill=wood[2])
  line([(14,37),(20,35),(29,34),(37,35)],wood[5])
  line([(12,44),(19,47),(28,49),(40,47),(48,43)],wood[1])
  line([(16,44),(23,46),(30,47),(39,45)],wood[3])
  for xx,yy in [(20,39),(25,38),(30,39),(35,40),(27,42),(39,39)]:line([(xx,yy),(xx+2,yy-1)],wood[3])
  line([(10,39),(12,41)],wood[5]);line([(45,37),(48,39)],wood[3])
 else:
  raise ValueError(kind)
 bbox=im.getbbox()
 im=im.crop((bbox[0]-2,bbox[1]-2,bbox[2]+2,bbox[3]+2))
 im.info['anchor']=[im.width/2,im.height-2]
 return im
