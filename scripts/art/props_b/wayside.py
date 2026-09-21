"""Things that stand by a road, in a yard or at a field's edge, drawn to the
figure: about 17 px to the metre. Placed pixel by rule, as props_b/stores.py
is: a lit band, a core shadow, a dark keyline. Variants are different objects
for different countries, not recolours.
"""
from math import sqrt, sin, pi
from .core import Canvas
from .stores import INK, WOOD, IRON, SACK, STRAW, LEAF, BLOOMS

STONE = ['#3b3a33', '#6a685c', '#96937f', '#bdb9a2', '#ddd9c2']
MOSS = '#5d7a3a'
RED = ['#5a1a14', '#8e2a1e', '#c0432c', '#e0714a']


def _dome(c, cx, top, bottom, half, ramp, band=2, stretch=1.0):
 """A coiled or stacked dome: tone by position across, a dark row between
 coils, so it reads as rope laid on rope."""
 rows = bottom - top
 for y in range(top, bottom + 1):
  t = (y - top) / rows
  h = half * sin(min(t * 1.15, 1.0) * pi / 2) ** (0.75 * stretch)
  for x in range(int(cx - h), int(cx + h) + 1):
   u = (x + .5 - cx) / max(h, .5)
   if abs(u) > 1: continue
   tone = 3 if u < -0.55 else 2 if u < 0.25 else 1
   if -0.5 < u < -0.2 and t < 0.75: tone = 3
   if (y - top) % band == band - 1: tone = max(0, tone - 1)
   c.set(x, y, ramp[tone])


def _bees(c, frame, spots):
 for i, (cx, cy, rx, ry, turn) in enumerate(spots):
  from math import cos
  a = (frame / 4 + i / len(spots)) * 2 * pi * turn
  x, y = round(cx + cos(a) * rx), round(cy + sin(a) * ry)
  c.set(x, y, '#1c160c'); c.set(x + 1, y, '#e2b33a')


def beehive(v=0, frame=0):
 """A half-metre skep on its stand, one under a straw hackle, or a box hive."""
 c = Canvas(24, 24)
 w = WOOD[v % 3]
 if v == 2:
  for k, top in enumerate((8, 13)):                 # two boxes
   c.rect(6, top, 17, top + 4, w[2])
   c.vline(6, top, top + 4, w[4]); c.rect(7, top, 9, top + 4, w[3]); c.vline(17, top, top + 4, w[0]); c.vline(16, top, top + 4, w[1])
   c.hline(6, 17, top, w[4]); c.hline(6, 17, top + 4, w[0])
   c.set(11, top + 2, w[0]); c.set(12, top + 2, w[0])             # hand holds
  c.poly([(4, 8), (12, 4), (19, 8)], w[3]); c.line((4, 8), (12, 4), w[4]); c.line((12, 4), (19, 8), w[1])
  c.hline(4, 19, 8, w[0])
  c.hline(9, 14, 17, INK)                           # the entrance slot
  c.hline(5, 18, 18, w[3]); c.hline(5, 18, 19, w[0])              # flight board
 else:
  straw = STRAW if v == 0 else ['#5c4a24', '#866c34', '#ad8f48', '#cdb268']
  _dome(c, 12, 7, 17, 6.5, straw)
  c.set(11, 6, straw[3]); c.set(12, 6, straw[2]); c.set(12, 5, straw[1])   # the carrying loop
  c.rect(11, 15, 12, 17, INK)                       # the flight hole
  if v == 1:                                        # a hackle: a straw cone tied over it
   for y in range(2, 11):
    half = 1 + (y - 2) * 0.85
    for x in range(int(12 - half), int(12 + half) + 1):
     c.set(x, y, STRAW[3] if x < 11 else STRAW[2] if x < 14 else STRAW[1])
   c.hline(9, 14, 5, STRAW[0]); c.set(12, 1, STRAW[1])
   for x in range(4, 20, 2): c.set(x, 11, STRAW[2 if x < 12 else 1])
  c.hline(4, 19, 18, w[3]); c.hline(4, 19, 19, w[0])              # the stand's board
 for x in (6, 17):                                  # legs
  c.vline(x, 20, 23, w[2]); c.vline(x + 1, 20, 23, w[0])
 c.outline(INK)
 _bees(c, frame, [(12, 12, 10, 8, 1.0), (12, 14, 8, 5, -1.0), (12, 18, 5, 2, 1.0)])
 return c.image()


def waymark(v=0):
 """What stands where roads meet: a fingerpost, a wayside cross, a milestone,
 a cairn. Each is a different country's answer to the same need."""
 c = Canvas(22, 34)
 if v == 0:                                          # fingerpost
  w = WOOD[1]
  c.rect(10, 6, 11, 33, w[2]); c.vline(10, 6, 33, w[3]); c.vline(11, 8, 33, w[0])
  c.poly([(11, 8), (19, 8), (21, 10), (19, 12), (11, 12)], WOOD[2][3]); c.hline(12, 19, 8, WOOD[2][4]); c.hline(12, 19, 12, WOOD[2][1])
  c.poly([(10, 15), (3, 15), (1, 17), (3, 19), (10, 19)], WOOD[2][2]); c.hline(3, 9, 15, WOOD[2][4]); c.hline(3, 9, 19, WOOD[2][0])
  for x in (13, 15, 17): c.set(x, 10, w[0])
  for x in (4, 6, 8): c.set(x, 17, w[0])
  c.rect(9, 4, 12, 5, w[3]); c.set(10, 3, w[4])
 elif v == 1:                                        # stone wayside cross on steps
  s = STONE
  c.rect(9, 3, 12, 25, s[2]); c.vline(9, 3, 25, s[4]); c.vline(12, 3, 25, s[1])
  c.rect(4, 8, 17, 11, s[2]); c.hline(4, 17, 8, s[4]); c.hline(4, 17, 11, s[1]); c.vline(17, 8, 11, s[1])
  c.rect(10, 9, 11, 10, s[1])
  for k, (x0, x1, y) in enumerate(((6, 15, 26), (4, 17, 29), (2, 19, 32))):
   c.rect(x0, y, x1, y + 2, s[2]); c.hline(x0, x1, y, s[4 if k < 2 else 3]); c.hline(x0, x1, y + 2, s[1])
  c.set(5, 30, MOSS); c.set(6, 30, MOSS); c.set(16, 33, MOSS)
 elif v == 2:                                        # milestone
  s = STONE
  for y in range(16, 34):
   half = 5 if y > 19 else 5 - (19 - y) * 0.9
   for x in range(int(11 - half), int(11 + half) + 1):
    u = (x + .5 - 11) / 5
    c.set(x, y, s[4] if u < -0.5 else s[3] if u < 0 else s[2] if u < 0.6 else s[1])
  for y in (22, 25): c.hline(8, 13, y, s[1])
  c.set(9, 28, s[1]); c.set(11, 28, s[1]); c.set(13, 28, s[1])
  c.set(6, 33, MOSS); c.set(7, 32, MOSS); c.set(15, 33, MOSS)
 else:                                               # cairn with a marker stick
  s = STONE
  for cx, cy, r in ((6, 30, 4), (15, 30, 4.5), (10, 27, 4.5), (13, 23, 3.5), (9, 21, 3), (11, 18, 2.5)):
   for y in range(int(cy - r * .7), int(cy + r * .7) + 1):
    for x in range(int(cx - r), int(cx + r) + 1):
     u, t = (x + .5 - cx) / r, (y + .5 - cy) / (r * .7)
     if u * u + t * t > 1: continue
     lit = -u * .6 - t * .8
     c.set(x, y, s[4] if lit > .6 else s[3] if lit > .1 else s[2] if lit > -.4 else s[1])
  c.vline(11, 6, 17, WOOD[1][2]); c.set(12, 7, RED[2]); c.set(13, 8, RED[2]); c.set(12, 8, RED[1]); c.set(13, 7, RED[3])
 c.outline(INK)
 return c.image()


def wayside_shrine(v=0):
 """A small roadside shrine: a post shrine with a gabled niche, a plastered
 niche on a plinth, a stone lantern, a flagged cairn."""
 c = Canvas(24, 38)
 if v == 0:                                          # Bildstock: niche on a post
  w = WOOD[1]; s = STONE
  c.rect(11, 18, 13, 37, w[2]); c.vline(11, 18, 37, w[3]); c.vline(13, 18, 37, w[0])
  c.rect(7, 8, 17, 18, SACK[3]); c.vline(7, 8, 18, SACK[4]); c.vline(17, 8, 18, SACK[1])
  c.rect(9, 10, 15, 17, '#1e2a3a'); c.rect(10, 11, 14, 17, '#2d4563')
  c.rect(11, 12, 13, 16, '#d9b85a'); c.set(12, 11, '#f0dc9a'); c.set(12, 13, RED[2])     # the image within
  c.poly([(5, 8), (12, 2), (19, 8)], RED[1]); c.line((5, 8), (12, 2), RED[3]); c.line((12, 2), (19, 8), RED[0])
  c.hline(5, 19, 8, RED[0]); c.vline(12, 0, 1, IRON[1]); c.set(11, 0, IRON[1]); c.set(13, 0, IRON[1])
  c.hline(8, 16, 18, w[0])
  for i, x in enumerate((8, 10, 15)): c.set(x, 19, BLOOMS[i]); c.set(x, 20, LEAF[2])     # an offering
 elif v == 1:                                        # plastered aedicula on a plinth
  p = ['#6b6351', '#9a917a', '#c9c1a6', '#e6dfc6', '#f7f1dc']
  c.rect(5, 26, 18, 37, p[2]); c.vline(5, 26, 37, p[4]); c.vline(18, 26, 37, p[0]); c.hline(5, 18, 26, p[4]); c.hline(4, 19, 37, p[0])
  c.rect(6, 10, 17, 25, p[3]); c.vline(6, 10, 25, p[4]); c.vline(17, 10, 25, p[1])
  c.rect(9, 14, 14, 25, '#2a1e1a'); c.rect(10, 13, 13, 13, '#2a1e1a'); c.rect(10, 15, 14, 25, '#4a2f25')
  c.rect(11, 17, 12, 22, '#d9b85a'); c.set(11, 16, '#f0dc9a'); c.set(12, 16, '#f0dc9a')
  c.set(10, 24, '#f2cf3e'); c.set(10, 23, '#fff1b0')                                        # a lamp burning
  c.poly([(4, 10), (11, 4), (12, 4), (19, 10)], RED[2]); c.line((4, 10), (11, 4), RED[3]); c.line((12, 4), (19, 10), RED[0]); c.hline(4, 19, 10, RED[0])
  c.vline(11, 1, 3, IRON[1]); c.hline(10, 12, 2, IRON[1])
 elif v == 2:                                        # stone lantern
  s = STONE
  c.rect(8, 34, 15, 37, s[2]); c.hline(8, 15, 34, s[4]); c.hline(7, 16, 37, s[1])
  c.rect(10, 22, 13, 33, s[2]); c.vline(10, 22, 33, s[4]); c.vline(13, 22, 33, s[1])
  c.rect(7, 19, 16, 21, s[3]); c.hline(7, 16, 19, s[4]); c.hline(7, 16, 21, s[1])
  c.rect(8, 12, 15, 18, s[2]); c.vline(8, 12, 18, s[4]); c.vline(15, 12, 18, s[1])
  c.rect(10, 13, 13, 17, '#2a1e12'); c.rect(11, 14, 12, 16, '#f2b13e'); c.set(11, 14, '#fff1b0')
  c.poly([(4, 12), (11, 6), (12, 6), (19, 12)], s[2]); c.line((4, 12), (11, 6), s[4]); c.line((12, 6), (19, 12), s[1]); c.hline(3, 20, 12, s[1])
  c.set(3, 11, s[3]); c.set(20, 11, s[2])
  c.rect(11, 3, 12, 5, s[3]); c.set(11, 2, s[4]); c.set(8, 37, MOSS); c.set(15, 36, MOSS)
 else:                                               # cairn with prayer flags
  s = STONE
  for cx, cy, r in ((7, 34, 5), (16, 34, 5), (12, 30, 5.5), (9, 26, 4), (14, 25, 4), (12, 21, 3)):
   for y in range(int(cy - r * .7), int(cy + r * .7) + 1):
    for x in range(int(cx - r), int(cx + r) + 1):
     u, t = (x + .5 - cx) / r, (y + .5 - cy) / (r * .7)
     if u * u + t * t > 1: continue
     lit = -u * .6 - t * .8
     c.set(x, y, s[4] if lit > .6 else s[3] if lit > .1 else s[2] if lit > -.4 else s[1])
  c.vline(12, 3, 19, WOOD[1][2])
  for i, tone in enumerate(('#2f5fa0', '#e9e4d2', RED[2], '#3f8a3a', '#e8c53a')):
   x = 13 + i * 2; y = 4 + i
   c.rect(x, y, x + 1, y + 2, tone)
  c.line((12, 3), (23, 9), IRON[1])
 c.outline(INK)
 return c.image()


def hay_rick(v=0):
 """Hay stacked to shed rain: a round rick on its pole, a thatched rick, or
 a row of stooks."""
 c = Canvas(30, 30)
 h = ['#6e5a22', '#9a8030', '#c4a644', '#e2c866']
 if v == 2:                                          # stooks: sheaves leaned together
  for cx in (6, 15, 24):
   for y in range(12, 29):
    half = 1 + (y - 12) * 0.28
    for x in range(int(cx - half), int(cx + half) + 1):
     c.set(x, y, h[3] if x < cx - 1 else h[2] if x <= cx + 1 else h[1])
   for x in range(cx - 2, cx + 3): c.set(x, 17, h[0])
   for x in (cx - 2, cx, cx + 2): c.set(x, 11, h[3]); c.set(x, 10, h[2])
 else:
  _dome(c, 15, 5, 28, 12, h, band=3, stretch=0.8)
  for y in range(8, 28, 3):                          # hay hangs in ragged tufts
   for x in range(4, 27, 4): 
    if c.get(x + (y % 2), y): c.set(x + (y % 2), y, h[3])
  c.vline(15, 1, 5, WOOD[1][2]); c.set(15, 0, WOOD[1][3])
  if v == 1:                                         # a thatched cap, roped down
   for y in range(3, 12):
    half = (y - 2) * 1.1
    for x in range(int(15 - half), int(15 + half) + 1):
     c.set(x, y, STRAW[3] if x < 13 else STRAW[2] if x < 18 else STRAW[1])
   c.hline(5, 25, 12, STRAW[0])
   c.line((8, 12), (5, 24), WOOD[1][1]); c.line((22, 12), (25, 24), WOOD[1][0])
 c.outline(INK)
 return c.image()


def dovecote(v=0):
 """A pigeon house on a post, out of a cat's reach."""
 c = Canvas(20, 40)
 w = WOOD[v % 3]
 c.rect(9, 20, 10, 39, w[2]); c.vline(9, 20, 39, w[3]); c.vline(10, 22, 39, w[0])
 c.line((9, 26), (5, 21), w[1]); c.line((10, 26), (14, 21), w[0])
 c.rect(3, 9, 16, 20, SACK[3] if v != 1 else w[2]); c.vline(3, 9, 20, SACK[4] if v != 1 else w[4]); c.vline(16, 9, 20, SACK[1] if v != 1 else w[0])
 for row, y in enumerate((11, 16)):
  for x in (5, 9, 13):
   c.rect(x, y, x + 1, y + 2, INK); c.set(x, y, '#3a2a1c')
  c.hline(4, 15, y + 3, w[1])
 c.poly([(1, 9), (9, 2), (10, 2), (18, 9)], RED[1] if v == 0 else IRON[1] if v == 1 else STRAW[2])
 c.line((1, 9), (9, 2), RED[3] if v == 0 else IRON[3] if v == 1 else STRAW[3]); c.hline(1, 18, 9, INK)
 c.set(9, 1, IRON[2]); c.set(10, 1, IRON[2])
 c.rect(6, 7, 8, 8, '#e9e6d8'); c.set(9, 7, '#e9e6d8'); c.set(6, 6, '#c9c6b8')            # a pigeon on the sill
 c.outline(INK)
 return c.image()


def chicken_coop(v=0):
 """A low henhouse with its pop hole and ramp."""
 c = Canvas(24, 20)
 w = WOOD[v % 3]
 c.rect(2, 8, 19, 17, w[2]); c.vline(2, 8, 17, w[4]); c.vline(19, 8, 17, w[0])
 for x in range(5, 19, 3): c.vline(x, 8, 17, w[1])
 c.hline(2, 19, 17, w[0])
 c.poly([(0, 8), (5, 3), (21, 3), (21, 8)], STRAW[2] if v != 1 else w[3])
 c.line((0, 8), (5, 3), STRAW[3] if v != 1 else w[4]); c.hline(5, 21, 3, STRAW[3] if v != 1 else w[4]); c.hline(0, 21, 8, INK)
 for x in range(3, 21, 3): c.line((x, 8), (x + 3, 4), STRAW[1] if v != 1 else w[2])
 c.rect(8, 11, 12, 17, INK); c.rect(9, 12, 12, 17, '#2a2118')                                # the pop hole
 c.line((8, 18), (3, 19), w[3]); c.line((12, 18), (7, 19), w[1])
 for x in (3, 18): c.vline(x, 18, 19, w[0])                                                  # legs
 c.rect(15, 14, 17, 16, '#e9e6d8'); c.set(18, 14, RED[2]); c.set(17, 13, RED[2]); c.set(15, 17, '#d9a23a')   # a hen
 c.outline(INK)
 return c.image()


def _slab(c, cx, top, base, half, s, lean=0, taper=.55):
 """An upright stone: broad at the foot, narrowing unevenly to a worn top."""
 for y in range(top, base + 1):
  t = (y - top) / max(1, base - top)
  h = half * (taper + (1 - taper) * min(1, t * 1.6)) - (0 if t > .08 else 1)
  mid = cx + lean * (1 - t)
  for x in range(int(mid - h), int(mid + h) + 1):
   u = (x + .5 - mid) / max(h, .5)
   if abs(u) > 1: continue
   tone = 4 if u < -.55 else 3 if u < -.1 else 2 if u < .5 else 1
   if (x * 7 + y * 3) % 11 == 0: tone = max(1, tone - 1)
   c.set(x, y, s[tone])
 for x in range(int(cx - half) - 1, int(cx + half) + 2):
  if (x + top) % 3: c.set(x, base + 1, MOSS if x % 2 else LEAF[1])


def standing_stone(v=0):
 """A raised stone, carved or plain, as each country marked its ground: a
 menhir with pecked spirals, a deer stone, a cup-marked slab, a carved post,
 a stacked figure of flat stones."""
 c = Canvas(20, 40)
 s = STONE
 if v == 0:                                          # menhir, spirals pecked into the lit face
  _slab(c, 10, 6, 37, 6, s, lean=1)
  for cx, cy in ((9, 16), (10, 27)):
   for x, y in ((0, -2), (1, -2), (2, -1), (2, 0), (2, 1), (1, 2), (0, 2), (-1, 2), (-2, 1), (-2, 0), (-1, -1), (0, 0)):
    c.set(cx + x, cy + y, s[1])
  c.set(8, 35, MOSS); c.set(9, 36, MOSS); c.set(13, 34, MOSS)
 elif v == 1:                                        # deer stone: a banded pillar with leaping stags
  _slab(c, 10, 3, 37, 4.5, s, taper=.85)
  for y in (9, 30): c.hline(6, 14, y, s[1])
  for k, y in enumerate((13, 19, 25)):
   x = 8 + k % 2
   c.hline(x, x + 3, y, s[0]); c.set(x + 4, y - 1, s[0]); c.set(x + 5, y - 2, s[0]); c.set(x, y + 1, s[0]); c.set(x + 3, y + 1, s[0])
  c.rect(9, 5, 10, 6, s[1])
 elif v == 2:                                        # a broad slab, cup-marked
  _slab(c, 10, 14, 37, 8, s, taper=.75)
  for x, y in ((7, 20), (11, 19), (13, 24), (8, 27), (12, 30), (6, 32)):
   c.set(x, y, s[0]); c.set(x + 1, y, s[1]); c.set(x, y - 1, s[4])
 elif v == 3:                                        # a carved and painted post
  w = WOOD[1]
  c.rect(8, 4, 11, 38, w[2]); c.vline(8, 4, 38, w[4]); c.vline(11, 4, 38, w[0])
  for k, y in enumerate(range(6, 34, 7)):
   tone = (RED[2], '#e9e4d2', '#2f5fa0', '#1c1c1c')[k % 4]
   c.rect(7, y, 12, y + 3, tone); c.set(8, y + 1, INK); c.set(11, y + 1, INK); c.hline(9, 10, y + 3, INK)
   c.set(6, y + 1, w[3]); c.set(13, y + 1, w[1])
  c.poly([(7, 4), (9, 0), (10, 0), (12, 4)], w[3])
 else:                                               # flat stones stacked into a figure
  for y, half in ((34, 6), (30, 2), (30, 2), (25, 6), (21, 3), (16, 7), (12, 2), (8, 3)):
   pass
  for (x0, x1, y0, y1) in ((3, 8, 30, 37), (11, 16, 30, 37), (3, 16, 25, 29), (6, 13, 19, 24), (1, 18, 15, 18), (8, 11, 10, 14), (6, 13, 6, 9)):
   for y in range(y0, y1 + 1):
    for x in range(x0, x1 + 1):
     u = (x - x0) / max(1, x1 - x0)
     c.set(x, y, s[4] if y == y0 else s[3] if u < .4 else s[2] if u < .8 else s[1])
 c.outline(INK)
 return c.image()


def _privy(v, frame, build):
 """A one-seat privy at its real size: a metre wide, a little over two tall.
 `build` is boards, stone or brick; the variant changes roof and wood."""
 from .building import _flies
 c = Canvas(20, 38)
 w = WOOD[v % 3]
 if build == 'stone':
  wall = STONE
 elif build == 'brick':
  wall = ['#4a221a', '#7a3526', '#a44d35', '#c46d4d', '#dd977a']
 else:
  wall = w
 x0, x1, top, base = 3, 16, 12, 35
 for y in range(top, base + 1):
  for x in range(x0, x1 + 1):
   u = (x - x0) / (x1 - x0)
   tone = 3 if u < 0.25 else 2 if u < 0.7 else 1
   if build == 'boards':
    if (x - x0) % 3 == 2: tone = max(0, tone - 1)
   elif (y - top) % (3 if build == 'brick' else 4) == 0 or (x + ((y - top) // (3 if build == 'brick' else 4)) * 3) % 6 == 0:
    tone = max(0, tone - 1)
   c.set(x, y, wall[tone])
 c.vline(x0, top, base, wall[4]); c.vline(x1, top, base, wall[0]); c.hline(x0, x1, base, wall[0])
 c.rect(6, 17, 13, base, w[1])                        # the door, boarded
 for x in (8, 11): c.vline(x, 18, base - 1, w[0])
 c.vline(6, 17, base, w[3]); c.hline(6, 13, 17, w[3])
 c.rect(9, 20, 10, 21, INK); c.set(9, 20, w[1])        # the moon cut in it
 c.set(12, 27, IRON[3]); c.hline(7, 8, 19, IRON[1]); c.hline(7, 8, 32, IRON[1])
 roof = STRAW if v == 1 else ['#33291f', '#54402c', '#77593a', '#9a7a52'] if build != 'brick' else ['#2a343a', '#44545c', '#62757d', '#8d9da1']
 # One pitch, falling to the back: the high edge is the one we see.
 for y in range(4, 13):
  lo, hi = 1 - (y - 4) // 4, 18 + (y - 4) // 4
  for x in range(max(0, lo), min(19, hi) + 1):
   c.set(x, y, roof[3] if y < 6 else roof[2] if (x + y) % 4 else roof[1])
 c.hline(0, 19, 12, roof[0]); c.hline(1, 18, 4, roof[3])
 c.hline(x0, x1, 13, wall[0])                         # the eave's shade
 c.outline(INK)
 _flies(c, frame, [(10, 26, 9, 5, 1.0), (10, 20, 7, 6, -1.0)])
 return c.image()


def privy_shed(v=0, frame=0): return _privy(v, frame, 'boards')
def privy_stone(v=0, frame=0): return _privy(v, frame, 'stone')
def privy_outhouse(v=0, frame=0): return _privy(v, frame, 'brick')


WAYSIDE = {
 'standing-stone': standing_stone,
 'privy-shed': privy_shed,
 'privy-stone': privy_stone,
 'privy-outhouse': privy_outhouse,
 'beehive': beehive,
 'waymark': waymark,
 'wayside-shrine': wayside_shrine,
 'hay-rick': hay_rick,
 'dovecote': dovecote,
 'chicken-coop': chicken_coop,
}
