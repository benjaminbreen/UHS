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
