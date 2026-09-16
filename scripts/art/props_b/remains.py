"""What is left on the ground after something breaks.

One set per material rather than per object: a smashed jug and a smashed bowl
leave the same curved terracotta. Three arrangements each, so a yard of broken
crockery is not the same pile stamped out three times.
"""
from math import hypot
from .core import Canvas, RAMPS, dither, jitter, soft_outline

CLAY = ['terracotta7', 'buffclay7', 'redearth7']
GLAZE = ['greenglaze7', 'blueglaze7', 'creamglaze7']
WOOD = ['oak7', 'walnut7', 'ash7']


def _shard(c, x, y, w, h, p, tilt=0, face=True):
 """One angular piece: a lit top face, a slanted side, a dark broken base.

 Wedges, not bricks. A pile of little rectangles reads as rubble; what says
 pottery is the taper and the dark edge where the wall was cut through.
 """
 for k in range(h):
  run = max(1, w - k)
  start = x + (k if tilt > 0 else 0) + (k // 2 if tilt < 0 else 0)
  for i in range(run):
   tone = 6 if k == 0 else 5 if k == 1 else 4
   if i == run - 1: tone = max(tone - 2, 2)
   c.set(start + i, y + k, p[tone])
  if face and k == h - 1:
   for i in range(run): c.set(start + i, y + k, p[1])


def clay(v=0):
 """Curved terracotta, the dark of the inside showing on every piece."""
 c = Canvas(19, 9)
 p = RAMPS[CLAY[v]]
 layouts = [
  [(1, 3, 6, 4, 1), (10, 4, 5, 3, -1), (15, 2, 3, 3, 1)],
  [(2, 4, 7, 3, -1), (11, 2, 5, 5, 1), (0, 1, 3, 2, 1)],
  [(3, 2, 5, 4, 1), (10, 5, 6, 3, -1), (16, 3, 2, 2, 0)],
 ][v]
 for x, y, w, h, tilt in layouts:
  _shard(c, x, y, w, h, p, tilt)
 for x, y in [(8, 8), (18, 7), (0, 7)]:           # chips thrown clear
  c.set(x, y, p[3]); c.set(x, y + 1, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def glaze(v=0):
 """Glazed shards: a hard glint on the face, raw clay at every break."""
 c = Canvas(18, 9)
 p = RAMPS[GLAZE[v]]
 body = RAMPS['buffclay7']
 for x, y, w, h, tilt in [(1, 3, 6, 4, 1), (10, 2, 5, 4, -1), (14, 5, 4, 3, 1)]:
  _shard(c, x, y, w, h, p, tilt)
  c.set(x + 1, y, p[6])                           # the glaze catching the light
  for k in range(h):                              # raw clay along the break
   c.set(x + (k if tilt > 0 else 0), y + k, body[3])
 for x, y in [(7, 7), (16, 8), (0, 7)]:
  c.set(x, y, p[4])
 soft_outline(c, p[0], p[2])
 return c.image()


def wood(v=0):
 """Split staves and splinters, the grain running out of every break."""
 c = Canvas(20, 8)
 w = RAMPS[WOOD[v]]
 planks = [
  [(1, 3, 9, 2, 1), (7, 5, 8, 2, 0), (12, 1, 6, 2, -1)],
  [(2, 4, 11, 3, 0), (3, 1, 7, 2, 1), (13, 4, 6, 2, 1)],
  [(1, 5, 8, 2, -1), (8, 2, 10, 3, 1), (2, 1, 5, 2, 0)],
 ][v]
 for x, y, length, thick, lean in planks:
  for i in range(length):
   yy = y + (lean * i) // 8
   for k in range(thick):
    c.set(x + i, yy + k, w[5] if k == 0 else w[3])
   if i == length - 1:                            # the splintered end
    c.set(x + i, yy, w[2]); c.set(x + i + 1, yy + thick - 1, w[1])
   elif i % 4 == 1:
    c.set(x + i, yy, w[4])
 for x, y in [(6, 7), (15, 6), (18, 7), (0, 6)]:  # splinters thrown clear
  c.set(x, y, w[2]); c.set(x + 1, y, w[1])
 soft_outline(c, w[0], w[2])
 return c.image()


def fiber(v=0):
 """A basket burst open: the coils unwound and the weave come apart."""
 c = Canvas(19, 8)
 p = RAMPS[['wicker7', 'ash7', 'buffclay7'][v]]
 for i, (cx, cy, rx, ry, gap) in enumerate(
   [(5, 5, 4.6, 2.8, 1), (13, 4, 4.2, 3.0, -1), (9, 6, 3.0, 1.8, 1)][: 2 + v % 2]):
  for y in range(8):
   for x in range(19):
    d = hypot((x + .5 - cx) / rx, (y + .5 - cy) / ry)
    if d > 1 or d < 0.52: continue
    # A coil that has sprung open, not a closed hoop.
    if gap > 0 and x > cx and abs(y - cy) < 1.2: continue
    if gap < 0 and x < cx and abs(y - cy) < 1.2: continue
    c.set(x, y, p[5] if y < cy else p[3])
    if (x + y) % 2 == 0: c.set(x, y, p[2] if y > cy else p[4])
 for x in range(1, 18):                           # loose ends of the weave
  if jitter(x, 3) % 4 == 0:
   c.set(x, 7, p[4]); c.set(x + 1, 7, p[2])
 soft_outline(c, p[0], p[2])
 return c.image()


def metal(v=0):
 """Torn sheet and a sprung hoop: metal folds and tears, it does not shatter."""
 c = Canvas(19, 9)
 m = RAMPS[['galvanised7', 'blackiron7', 'brass7b'][v]]
 rust = RAMPS['rustred7']
 # Two panels, each folded along one line: the fold is the brightest thing on
 # it and the torn edge the darkest, which is what separates tin from pottery.
 for x, y, w, h, fold in [(1, 3, 8, 5, 3), (11, 4, 7, 4, 2)]:
  for k in range(h):
   run = w - abs(k - fold)
   sx = x + abs(k - fold) // 2
   for i in range(run):
    c.set(sx + i, y + k, m[4] if k < fold else m[3])
   c.set(sx, y + k, m[2])
   c.set(sx + run - 1, y + k, m[1])               # the torn edge
  for i in range(w - 2):                          # the fold itself
   c.set(x + i + 1, y + fold, m[6] if i % 3 else m[5])
 for i in range(11):                              # a strip sprung out of round
  a = i / 10
  x = 4 + round(a * 11)
  y = 1 + round((1 - (2 * a - 1) ** 2) * 2)
  c.set(x, y, m[6] if i < 5 else m[4]); c.set(x, y + 1, m[1])
 for x, y in [(2, 8), (17, 8), (9, 2)]:
  c.set(x, y, rust[3] if v != 2 else m[6])
 soft_outline(c, m[0], m[2])
 return c.image()


def plastic(v=0):
 """Cracked plastic: pale stress lines where it split, no dark interior."""
 c = Canvas(17, 8)
 p = [RAMPS['paintblue7'], RAMPS['greenglaze7'], RAMPS['rustred7']][v]
 for x, y, w, h, tilt in [(1, 3, 7, 4, 1), (9, 4, 6, 3, -1), (12, 1, 4, 3, 1)]:
  _shard(c, x, y, w, h, p, tilt, face=False)
  for k in range(h):                              # the split, gone white
   c.set(x + (k if tilt > 0 else 0), y + k, p[6])
 for x, y in [(8, 7), (16, 6), (0, 6)]:
  c.set(x, y, p[4])
 soft_outline(c, p[1], p[3])
 return c.image()


def paper(v=0):
 """Crushed card: folded flats and one torn corner, nothing sharp."""
 c = Canvas(18, 7)
 p = [RAMPS['buffclay7'], RAMPS['linen7'], RAMPS['ash7']][v]
 for x, y, w, h in [(1, 3, 8, 3), (8, 2, 7, 4), (13, 5, 4, 2)]:
  for k in range(h):
   run = w - k
   for i in range(run):
    c.set(x + i + k // 2, y + k, p[5] if k == 0 else p[3] if i % 4 else p[4])
  c.set(x, y + h - 1, p[1]); c.set(x + w - 1, y, p[2])
 for x in range(1, 17):                           # the fold lines across it
  if x % 5 == 0:
   for y in range(2, 6):
    if c.get(x, y): c.set(x, y, p[2])
 soft_outline(c, p[0], p[2])
 return c.image()


REMAINS = {'clay': clay, 'glaze': glaze, 'wood': wood, 'fiber': fiber,
           'metal': metal, 'plastic': plastic, 'paper': paper}
