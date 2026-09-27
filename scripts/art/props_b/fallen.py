"""Knocked-over states.

A tipped vessel is the same body of revolution lying down, not the standing
sprite rotated: the light stays upper-left, so it is lit along its top and
dark underneath, and the mouth becomes a disc you look into from the side.
"""
from math import hypot, sin, cos, radians
from .core import RAMPS, Canvas, belly, revolve_x, soft_outline, grass
from .vessels import CLAY, GLAZE, METAL
from .industrial import WOOD7


def leaning(image, direction):
 from PIL import Image
 a = radians(18 * direction)
 co, si = cos(a), sin(a)
 ax, ay = image.info['anchor']
 margin = int(image.height * .4) + 2
 nx, ny = ax + margin, ay + margin
 tilted = image.transform((image.width + margin * 2, image.height + margin * 2),
  Image.AFFINE, (co, si, ax - co * nx - si * ny, -si, co, ay + si * nx - co * ny), Image.NEAREST)
 tilted.info['anchor'] = [nx, ny]
 return tilted


def milestone(v=0):
 c = Canvas(36, 15)
 p = RAMPS['limestone' if v == 0 else 'sandstone']
 revolve_x(c, 8, belly(4, 32, [4.0, 4.8, 4.8, 5.3]), p)
 _end_cap(c, 4, 8, 4, p, rim=2, rings=False)
 for x in (12, 17, 22, 27):
  c.hline(x, x + 2, 6, p[2]); c.set(x, 7, p[2])
 soft_outline(c, p[1], p[3])
 return c.image()


def marker(v=0, rune=False):
 c = Canvas(40, 17)
 p = RAMPS['granite' if rune and v == 0 else 'sandstone' if rune else 'limestone']
 if not rune and v == 3: p = RAMPS['oak7']
 if not rune and v == 4:
  for x0, x1, y0, y1 in ((2, 10, 10, 13), (6, 14, 5, 8), (14, 27, 9, 13), (18, 24, 4, 7), (29, 36, 10, 14)):
   c.rect(x0, y0, x1, y1, p[3]); c.hline(x0, x1, y0, p[5]); c.hline(x0, x1, y1, p[1])
  soft_outline(c, p[1], p[3])
  return c.image()
 if not rune and v == 3:
  c.rect(3, 9, 36, 13, p[3]); c.hline(3, 36, 9, p[5]); c.hline(3, 36, 13, p[1])
  for x, tone in zip((8, 15, 22, 29), ('#a5533a', '#e9e4d2', '#2f5fa0', '#1c1c1c')):
   c.rect(x, 9, x + 2, 12, tone)
  soft_outline(c, p[1], p[3])
  return c.image()
 c.poly([(3, 8), (9, 4), (32, 5), (37, 8), (34, 13), (7, 14)], p[3])
 c.poly([(3, 8), (9, 4), (32, 5), (37, 8), (32, 10), (7, 11)], p[5])
 c.line((7, 14), (34, 13), p[1]); c.line((34, 13), (37, 8), p[2])
 if rune:
  red = '#a5533a'
  c.line((10, 6), (29, 6), red); c.line((10, 9), (29, 9), red)
  c.line((8, 7), (10, 9), red); c.line((29, 6), (31, 8), red)
  for x in (12, 17, 22, 27): c.set(x, 6, p[1]); c.set(x + 1, 7, p[1])
 else:
  for x in (10, 20, 29): c.set(x, 7, p[2]); c.set(x + 1, 7, p[3])
 soft_outline(c, p[1], p[3])
 return c.image()


def rune_marker(v=0): return marker(v, rune=True)


def stone_lantern(v=0):
 c = Canvas(42, 24)
 p = RAMPS['granite' if v == 0 else 'limestone']
 revolve_x(c, 15, belly(18, 34, [3, 2.5, 2.5, 4]), p)
 _end_cap(c, 35, 15, 8, p, rim=3, rings=False)
 c.rect(10, 11, 18, 19, p[3]); c.hline(10, 18, 11, p[5]); c.hline(10, 18, 19, p[1])
 c.rect(12, 12, 15, 15, p[0]); c.hline(12, 15, 12, p[2])
 c.poly([(8, 3), (5, 10), (3, 14), (5, 22), (9, 23), (10, 5)], p[3])
 c.line((8, 3), (5, 10), p[6]); c.line((5, 10), (3, 14), p[5]); c.line((5, 22), (9, 23), p[1])
 c.rect(1, 12, 3, 15, p[4]); c.hline(1, 3, 12, p[6])
 soft_outline(c, p[1], p[3])
 return c.image()


def _mouth_disc(c, mx, cy, half, p, depth=2, rim=2.6):
 """The opening at the near end: an ellipse you look into, with a lit rim."""
 for y in range(int(cy - half) - 1, int(cy + half) + 2):
  for x in range(int(mx - rim) - 1, int(mx + rim) + 2):
   u = (x + .5 - mx) / rim
   v = (y + .5 - cy) / max(half, .5)
   d = hypot(u, v)
   if d > 1.0: continue
   if d > 0.80:                                   # the rim of the mouth
    c.set(x, y, p[6] if v < -0.25 else p[4] if v < 0.5 else p[2])
   else:                                          # and the dark inside it
    c.set(x, y, p[1] if (u < -0.3 and v < 0) else p[0])


def _end_cap(c, mx, cy, half, p, rim=3.0, rings=True):
 """A closed end seen at an angle: the lid of a drum, not an opening."""
 for y in range(int(cy - half) - 1, int(cy + half) + 2):
  for x in range(int(mx - rim) - 1, int(mx + rim) + 2):
   u = (x + .5 - mx) / rim
   v = (y + .5 - cy) / max(half, .5)
   d = hypot(u, v)
   if d > 1.0: continue
   tone = 5 if v < -0.3 else 4 if v < 0.35 else 2
   if d > 0.82: tone = 6 if v < -0.2 else 1
   if rings and 0.45 < d < 0.58: tone = max(tone - 2, 1)
   c.set(x, y, p[tone])


def _spill(c, x0, y, ramp, n=5, step=2):
 """What came out of it, in a short trail."""
 for i in range(n):
  sx = x0 - i * step - (i % 2)
  sy = y + (i % 3) - 1
  c.set(sx, sy, ramp[4 if i % 2 else 3])
  if i % 2: c.set(sx - 1, sy + 1, ramp[2])


def dustbin(v=0):
 """A bin on its side, lid off, rolled a little out of line."""
 c = Canvas(34, 21)
 m = RAMPS[['galvanised7', 'blackiron7', 'rustred7'][v]]
 cy = 13.0
 body = {x: h for x, h in belly(7, 28, [8.6, 8.0, 7.4, 6.6]).items()}
 revolve_x(c, cy, body, m, gloss=1)
 for y in range(0, 21):                           # ribs, now running across
  for x in range(7, 29):
   if (x + 1) % 4 == 0 and c.get(x, y): c.set(x, y, m[2])
 for x in (11, 17, 22):                           # the rolling beads
  for y in range(0, 21):
   if c.get(x, y): c.set(x, y, m[6] if y < cy else m[3])
   if c.get(x + 1, y): c.set(x + 1, y, m[1])
 _mouth_disc(c, 7, cy, 8.6, m, depth=3)
 for y in range(15, 21):                          # the lid, fallen flat beside it
  for x in range(24, 34):
   u = (x + .5 - 29) / 5.0
   v = (y + .5 - 18) / 2.8
   d = hypot(u, v)
   if d > 1: continue
   c.set(x, y, m[5] if v < -0.2 else m[3] if v < 0.5 else m[2])
   if d > 0.78: c.set(x, y, m[1] if v > 0 else m[6])
 c.set(29, 17, m[6]); c.set(30, 17, m[4])         # its knob, face up
 soft_outline(c, m[0], m[2])
 return c.image()


def steel_drum(v=0):
 """A drum on its side, the bung end toward you, rust where it rolled."""
 c = Canvas(34, 22)
 m = RAMPS[['paintblue7', 'rustred7', 'galvanised7'][v]]
 rust = RAMPS['rustred7']
 cy = 12.0
 revolve_x(c, cy, belly(5, 30, [8.8, 9.0, 9.0, 8.4]), m, gloss=1)
 for x in (11, 22):                               # the rolling hoops
  for y in range(0, 22):
   if c.get(x, y): c.set(x, y, m[6] if y < cy else m[3])
   if c.get(x + 1, y): c.set(x + 1, y, m[1])
  for y in range(3, 20, 5):
   if c.get(x, y): c.set(x, y, m[2])
 _end_cap(c, 6, cy, 9.0, m, rim=3.4)              # the closed end, toward you
 c.set(4, 9, m[1]); c.set(5, 9, m[2])             # the bung, off to one side
 for x, y in [(30, 8), (29, 17), (26, 19), (14, 19)]:
  if c.get(x, y): c.set(x, y, rust[3])
 soft_outline(c, m[0], m[2])
 return c.image()


def bucket(v=0):
 """A pail on its side with the water run out of it. Variants 0-2 are the
 large pail, 3-5 the small one, as upright."""
 k = 1.45 if v < 3 else 1.0
 c = Canvas(round(20 * k), round(13 * k))
 w = RAMPS[['oak7', 'ash7', 'walnut7'][v % 3]]
 m = RAMPS['blackiron7']
 cy = 7.5 * k
 revolve_x(c, cy, belly(4, round(17 * k), [4.6 * k, 4.2 * k, 3.8 * k, 3.2 * k]), w)
 for x in (round(8 * k), round(13 * k)):         # the hoops
  for y in range(0, c.h):
   if c.get(x, y): c.set(x, y, m[4] if y < cy else m[1])
 for x in range(4, round(18 * k)):                # staves, running lengthwise
  for y in (round(cy - 2.5 * k), round(cy + 1.5 * k)):
   if c.get(x, y) and x % 3 == 0: c.set(x, y, w[2])
 _mouth_disc(c, 4, cy, 4.6 * k, w, depth=2)
 _spill(c, 2, c.h - 2, RAMPS['water'], n=4)
 soft_outline(c, w[0], w[2])
 return c.image()


def cooking_pot(v=0):
 """A pot rolled onto its side, legs out, the fire long since out."""
 c = Canvas(20, 15)
 m = RAMPS[['castiron7', 'iron7', 'copper7'][v]]
 cy = 8.5
 revolve_x(c, cy, belly(4, 16, [4.4, 6.4, 6.6, 5.4]), m, gloss=2, base=0.12)
 _mouth_disc(c, 4, cy, 4.6, m, depth=3)
 for lx, ly in [(15, 2), (17, 6), (15, 13)]:      # the three legs, sticking out
  c.set(lx, ly, m[3]); c.set(lx + 1, ly, m[2])
  c.set(lx + 2, ly + (1 if ly < 8 else -1), m[1])
 for x, y in [(8, 3), (11, 3)]:                   # the bail, fallen flat
  c.set(x, y, m[4]); c.set(x + 1, y - 1, m[3])
 c.set(9, 2, m[4]); c.set(10, 2, m[4])
 soft_outline(c, m[0], m[2])
 return c.image()


def stool(v=0):
 """A stool on its side, legs in the air."""
 c = Canvas(18, 15)
 w = RAMPS[WOOD7[v]]
 cx, cy, rx, ry = 13.0, 8.0, 3.0, 6.4
 for y in range(0, 15):                           # the seat, now edge on
  for x in range(0, 18):
   X, Y = x + .5 - cx, y + .5 - cy
   if hypot(X / rx, Y / ry) > 1: continue
   lit = (Y * 0.5 + X * 0.85) / 1.2
   tone = 6 if lit < -0.42 else 5 if lit < 0.12 else 4
   c.set(x, y, w[tone])
 for x in range(9, 17):                           # the board's cut edge
  X = x + .5 - cx
  if abs(X) > rx: continue
  k = (1 - (X / rx) ** 2) ** .5
  for dy in (-1, 1):
   c.set(x, round(cy + ry * k * dy), w[2] if dy > 0 else w[4])
 for ly, lean in [(3, -1), (8, 0), (13, 1)]:      # three legs, pointing away
  for i in range(8):
   x = 10 - i
   y = ly + (lean * i) // 3
   c.set(x, y, w[4] if lean <= 0 else w[3])
   c.set(x, y + 1, w[2])
  c.set(x, y, w[1])
 soft_outline(c, w[1], w[3])
 return c.image()


def open_basket(v=0, lid=False):
 """A basket on its side; what it held has rolled out. 0-2 large, 3-5 small."""
 k = 1.5 if v < 3 else 1.0
 c = Canvas(round(20 * k), round(13 * k))
 p = RAMPS[['wicker7', 'ash7', 'buffclay7'][v % 3]]
 cy = 7.0 * k
 prof = belly(4, round(17 * k), [5.6 * k, 5.2 * k, 4.6 * k, 3.4 * k])
 revolve_x(c, cy, prof, p)
 for x, half in prof.items():                     # the coils, running across
  for y in range(int(cy - half), int(cy + half) + 1):
   v2 = (y + .5 - cy) / max(half, .5)
   if abs(v2) > 1: continue
   if x % 2 == 0:
    c.set(x, y, p[2] if v2 > 0.2 else p[4])
   elif (x + y) % 2 == 0:
    c.set(x, y, p[1] if v2 > 0.2 else p[5])
 _mouth_disc(c, 4, cy, 5.6 * k, p, depth=2)
 lx = round(17 * k)
 if lid:
  for y, half in ((0, 4.4 * k), (1, 5.0 * k), (2, 4.0 * k)):  # the lid, off to one side
   for x in range(int(lx - half), int(lx + half) + 1):
    if abs((x - lx) / half) > 1: continue
    c.set(x, y + c.h - 4, p[4] if x < lx else p[2])
 _spill(c, 2, c.h - 3, RAMPS['straw'], n=4)
 soft_outline(c, p[0], p[2])
 return c.image()


def lidded_basket(v=0):
 return open_basket(v, lid=True)
