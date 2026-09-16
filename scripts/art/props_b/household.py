"""Household things drawn soft: tinted rims, seven tones, no black keyline."""
from math import hypot
from .core import Canvas, RAMPS, blob, jitter, dither, soft_outline, shade_rows

WOOD7 = ['oak7', 'walnut7', 'ash7']


def sack(v=0):
 """A full grain sack, a little under a metre: gathered neck, folds, soft rim."""
 c = Canvas(16, 20)
 p = RAMPS[['burlap7', 'linen7', 'ash7'][v]]
 # A slumped bag: a wide low body, a shoulder above it, a gathered neck.
 blob(c, [(8, 13.5, 7.0, 5.6), (8, 9.8, 5.7, 4.2), (7.8, 6.2, 2.4, 2.2)], p)
 for x, y in [(6, 3), (7, 2), (8, 2), (9, 3), (7, 3), (8, 3)]:   # puckered mouth
  c.set(x, y, p[5] if x < 8 else p[3])
 c.set(6, 2, p[4]); c.set(9, 2, p[2])
 cord = RAMPS['rope']
 for x in range(5, 11):                           # the tie, wrapped twice
  c.set(x, 5, cord[3] if x % 2 else cord[2])
  c.set(x, 6, cord[1])
 c.set(4, 5, cord[2]); c.set(11, 5, cord[1])
 c.set(11, 6, cord[2]); c.set(12, 7, cord[1])     # the loose end hanging
 for fx, fy, fh in [(5, 11, 4), (11, 13, 3)]:               # folds in the cloth
  for i in range(fh):
   x = fx + i // 3
   if (x, fy + i) in c.px: c.set(x, fy + i, p[2] if i % 2 else p[3])
 for x, y in [(5, 16), (6, 11)]:                            # weave in the light
  if (x, y) in c.px: c.set(x, y, p[6])
 for x in range(3, 13):                           # it settles into the ground
  if jitter(x, 9) % 3 and (x, 18) in c.px: c.set(x, 18, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def cooking_pot(v=0):
 """A cast-iron pot on three legs with a bail handle: 0.7 m across the belly."""
 c = Canvas(16, 16)
 m = RAMPS[['castiron7', 'iron7', 'copper7'][v]]
 for lx, ly, lean in [(3, 11, -1), (14, 11, 1), (8, 12, 0)]:   # three legs
  for i in range(4):
   c.set(lx + lean * (i // 2), ly + i, m[3] if i < 2 else m[2])
  c.set(lx + lean * 2, ly + 4, m[1]); c.set(lx + lean * 2 + 1, ly + 4, m[1])
 blob(c, [(8.0, 8.0, 6.6, 5.0)], m, light=(-0.5, -0.66))
 for x in range(2, 15):                           # the rim, turned outward
  d = abs(x - 8.5) / 6.5
  c.set(x, 4, m[6] if d < .45 else m[5] if d < .8 else m[3])
  c.set(x, 5, m[4] if d < .7 else m[3])
 for x in range(4, 13):                           # what the open mouth shows
  c.set(x, 4, m[2] if 5 <= x <= 11 else m[3])
 c.hline(5, 10, 3, m[1])
 for x in (3, 14): c.set(x, 3, m[4])              # the lugs the bail swings on
 for x, y in [(12, 10), (13, 8), (11, 12)]:       # soot on the shaded side
  if (x, y) in c.px: c.set(x, y, m[1])
 soft_outline(c, m[0], m[2])
 # The bail goes on after the rim pass: outlined, its own gaps fill in and the
 # handle becomes a solid block with a slot in it.
 for x, y in [(7, -1), (8, -1), (5, 0), (6, 0), (9, 0), (10, 0),
              (4, 1), (11, 1), (3, 2), (12, 2)]:
  c.set(x, y, m[5] if x < 8 else m[3])
 for x, y in [(7, 0), (8, 0), (5, 1), (10, 1), (4, 2), (11, 2)]:
  c.set(x, y, m[1])                               # the shaded underside
 return c.image()


def stool(v=0):
 """A turned three-legged stool: round board, straight splayed legs.

 The seat is shaded in clean bands with no dither. At fourteen pixels across,
 a dithered board looks chewed rather than round.
 """
 c = Canvas(16, 16)
 w = RAMPS[WOOD7[v]]
 cx, cy, rx, ry = 7.5, 3.6, 7.0, 3.0
 legs = [(3, -2), (12, 2), (8, 0)]                # left, right, and the front
 for i, (lx, lean) in enumerate(legs):
  top = 6 if i < 2 else 7
  bottom = 12 if i < 2 else 14
  for k in range(bottom - top + 1):
   x = lx + (lean * k) // 5
   y = top + k
   c.set(x, y, w[4]); c.set(x + 1, y, w[2])
   if k == 0: c.set(x, y, w[5])
  c.set(x, bottom, w[1]); c.set(x + 1, bottom, w[1])
 for y in range(16):                              # the board, in clean bands
  for x in range(16):
   X, Y = x + .5 - cx, y + .5 - cy
   d = hypot(X / rx, Y / ry)
   if d > 1: continue
   lit = (X * 0.5 + Y * 0.85) / 1.2               # -1 lit corner, +1 shaded
   tone = 6 if lit < -0.42 else 5 if lit < 0.12 else 4
   if d > 0.86: tone -= 1
   c.set(x, y, w[tone])
 for x in range(16):                              # the board's cut edge
  X = x + .5 - cx
  if abs(X) > rx: continue
  k = (1 - (X / rx) ** 2) ** .5
  y = cy + ry * k
  c.set(x, round(y), w[3] if X < 0 else w[2])
  if abs(X) < rx * 0.72: c.set(x, round(y) + 1, w[2] if X < 0 else w[1])
 for x, y in [(4, 2), (6, 2), (9, 3)]:            # grain on the seat
  if (x, y) in c.px: c.set(x, y, w[6])
 soft_outline(c, w[1], w[3])
 return c.image()


def catch(v=0):
 """A hand-line of two fish, carried to the rack.

 Two, not three: at this size a third overlaps the others into one blob.
 """
 c = Canvas(15, 16)
 r = RAMPS['rope']
 f = [RAMPS['limestone'], RAMPS['sandstone'], RAMPS['castiron7']][v]
 for x in range(3, 12):                           # the line, held at the top
  c.set(x, 1, r[2] if x % 2 else r[1])
 c.set(7, 2, r[1])
 for x, top, length in [(4, 4, 11), (11, 3, 9)]:
  c.set(x, top - 1, r[1])                         # the gill loop
  for k in range(length):
   t = k / (length - 1)
   half = 0 if t < .12 else 2 if t < .62 else 1
   y = top + k
   c.hline(x - half, x + half, y, f[4] if k % 4 else f[3])
   c.set(x - half, y, f[2]); c.set(x + half, y, f[1])
   if .25 < t < .7 and k % 2: c.set(x, y, f[5])
  c.set(x - 1, top + length, f[2]); c.set(x + 1, top + length, f[2])
 soft_outline(c, f[0], f[2])
 return c.image()
