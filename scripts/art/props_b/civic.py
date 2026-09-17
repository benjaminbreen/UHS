"""What a square is built round, and what hangs at a door.

One object per culture group rather than one design recoloured. These are
generic types — an arch, a fountain, a platform, a cairn — not drawings of any
particular monument, the same way the building recipes are illustrative.
"""
from math import cos, hypot, pi, sin
from .asia import GOLD, LACQUER, SAFFRON, TEAL, CREAM, _marks
from .asia import square_focus as _asian_focus
from .building import _ground
from .core import Canvas, RAMPS, jitter, revolve, belly, soft_outline, grass
from .workshop import WOOD7, streak

W, H = 88, 94                                      # one canvas for the family


def _plinth(c, cx, base, half, rows, p, step=2):
 """A stepped stone base: each course wider than the one above it."""
 for k in range(rows):
  w = half + k * step
  for x in range(cx - w, cx + w + 1):
   u = (x - cx) / max(w, 1)
   tone = 5 if u < -0.3 else 4 if u < 0.45 else 2
   if k: tone -= 1
   c.set(x, base + k, p[max(tone, 1)])
  c.hline(cx - w, cx + w, base + k, p[6] if k == 0 else p[max(tone, 1)])
  c.set(cx - w, base + k, p[2]); c.set(cx + w, base + k, p[1])
 c.hline(cx - half - rows * step, cx + half + rows * step, base + rows, p[0])


def _dome(c, cx, cy, half, p, squat=0.8):
 """A dome, lit from the upper left, with a finial on top."""
 for y in range(int(cy - half * squat) - 1, cy + 1):
  for x in range(cx - half, cx + half + 1):
   u, v = (x - cx) / half, (y - cy) / (half * squat)
   if u * u + v * v > 1: continue
   lit = (u * 0.6 + v * 0.75)
   tone = 6 if lit < -0.7 else 5 if lit < -0.2 else 4 if lit < 0.35 else 3
   c.set(x, y, p[max(tone, 1)])
 c.set(cx, int(cy - half * squat) - 2, p[5])
 c.set(cx, int(cy - half * squat) - 3, p[4])


def sabil(v=0):
 """A canopied fountain: the civic object of a west Asian or north African
 square, and the thing people actually draw water from."""
 c = Canvas(W, H)
 s = RAMPS['limestone']
 tile = RAMPS['blueglaze7'] if 'blueglaze7' in RAMPS else TEAL
 water = RAMPS['water']
 cx = 44
 _plinth(c, cx, 78, 20, 4, s)
 for y in range(40, 78):                           # the four piers and the wall
  for x in range(22, 67):
   pier = x < 27 or x > 61 or abs(x - cx) < 3
   u = (x - 22) / 45
   tone = 5 if u < 0.25 else 4 if u < 0.7 else 3
   if not pier: tone -= 1
   if y % 7 == 0 or (x + (y // 7) * 5) % 11 == 0: tone -= 1
   c.set(x, y, s[max(tone, 1)])
 for ax in (34, 54):                               # two arched openings
  for y in range(48, 74):
   for x in range(ax - 7, ax + 8):
    u, vv = (x - ax) / 7.5, (y - 56) / 8.5
    if y > 56 and abs(u) < 0.94: c.set(x, y, '#1a1d1c' if y < 72 else s[1])
    elif vv < 0 and u * u + vv * vv <= 1: c.set(x, y, '#1a1d1c')
  for y in range(48, 74):                          # the arch ring
   for x in range(ax - 9, ax + 10):
    u, vv = (x - ax) / 9.0, (y - 56) / 10.0
    d = hypot(u, vv)
    if vv > 0 and abs(x - ax) > 7: continue
    if 0.82 < d <= 1.0 and vv <= 0.1:
     c.set(x, y, tile[5] if x < ax else tile[3])
 for y in range(68, 74):                           # the basin below them
  for x in range(28, 61):
   c.set(x, y, water[2] if y < 71 else water[1])
 c.hline(28, 60, 68, water[4]); c.hline(32, 48, 69, water[5])
 for y in range(34, 40):                           # the parapet and its tiles
  for x in range(18, 71):
   c.set(x, y, s[5] if y < 36 else s[3])
 for x in range(18, 71, 4):
  c.set(x, 36, tile[4]); c.set(x + 1, 37, tile[2])
 c.hline(16, 72, 33, s[6]); c.hline(18, 70, 40, s[1])
 _dome(c, cx, 33, 15, tile)
 for dx in (-22, 22):                              # corner finials
  for k in range(5): c.set(cx + dx, 32 - k, s[4 if k % 2 else 5])
 _ground(c, cx, 82, 34, RAMPS['granite'])
 soft_outline(c, s[0], s[2])
 return c.image()


def palaver_tree(v=0):
 """The assembly tree with a built ring round its foot: what a west or
 southern African village square is, rather than what stands in one."""
 c = Canvas(W, H)
 bark = RAMPS['walnut7']
 leaf = ['#16300f', '#1f4415', '#2c5e1d', '#3d7d27', '#539c34', '#74b94a', '#9fd46c']
 earth = RAMPS['buffclay7']
 cx = 44
 for y in range(46, 82):                           # the trunk, buttressed
  t = (y - 46) / 36
  half = round(5 + 9 * t ** 2.2)
  for x in range(cx - half, cx + half + 1):
   u = (x - cx) / max(half, 1)
   tone = 5 if u < -0.35 else 4 if u < 0.3 else 2
   if jitter(x, y // 3) % 7 == 0: tone -= 1
   c.set(x, y, bark[max(tone, 1)])
 for i in range(5):                                # roots spreading out
  for k in range(7):
   c.set(cx - 14 - k, 78 + i - k // 3, bark[3 if k % 2 else 2])
   c.set(cx + 14 + k, 78 + i - k // 3, bark[2 if k % 2 else 1])
 for i, (bx, by) in enumerate([(cx - 8, 44), (cx + 8, 42), (cx, 38)]):
  for k in range(9):                               # the first limbs
   c.set(bx + (k if i == 1 else -k if i == 0 else 0), by - k // 2, bark[4])
   c.set(bx + (k if i == 1 else -k if i == 0 else 0) + 1, by - k // 2, bark[2])
 for cy, cxx, rx, ry in [(24, 44, 34, 17), (16, 30, 20, 11), (14, 58, 18, 10)]:
  for y in range(cy - ry - 1, cy + ry + 2):        # the canopy, in three masses
   for x in range(cxx - rx - 1, cxx + rx + 2):
    u, vv = (x - cxx) / rx, (y - cy) / ry
    d = hypot(u, vv)
    if d > 1: continue
    lit = u * 0.5 + vv * 0.8
    tone = 6 if lit < -0.72 else 5 if lit < -0.25 else 4 if lit < 0.3 else 3
    if jitter(x // 2, y // 2) % 5 == 0: tone -= 1
    if d > 0.9: tone -= 1
    c.set(x, y, leaf[max(tone, 1)])
 for y in range(74, 82):                           # a low seat ring of mud
  for x in range(10, 79):
   if abs(x - cx) < 16: continue
   u = (x - 10) / 69
   tone = 5 if u < 0.3 else 4 if u < 0.75 else 3
   if y > 78: tone -= 2
   if jitter(x // 3, y) % 6 == 0: tone -= 1
   c.set(x, y, earth[max(tone, 1)])
 c.hline(10, 78, 74, earth[6]); c.hline(10, 78, 81, earth[1])
 _ground(c, cx, 82, 38, earth)
 soft_outline(c, bark[0], bark[2])
 return c.image()


def meso_platform(v=0):
 """A stepped stone platform with a stela and a round altar before it."""
 c = Canvas(W, H)
 s = RAMPS['limestone']
 red = ['#3a1410', '#5a1e16', '#7b2b1e', '#9c3d29', '#b85539', '#cf7552', '#e29b78']
 cx = 42
 for k, (half, y) in enumerate(((26, 60), (30, 66), (34, 72), (38, 78))):
  for yy in range(y, y + 6):                       # four courses, each wider
   for x in range(cx - half, cx + half + 1):
    u = (x - cx) / half
    tone = 5 if u < -0.3 else 4 if u < 0.4 else 3
    if yy > y + 3: tone -= 1
    if (x + yy) % 9 == 0: tone -= 1
    c.set(x, yy, s[max(tone, 1)])
   c.hline(cx - half, cx + half, y, s[6])
   c.hline(cx - half, cx + half, y + 5, s[1])
 for k in range(4):                                # the stair up the front
  for x in range(cx - 8, cx + 9):
   c.set(x, 62 + k * 5, s[6]); c.hline(cx - 8, cx + 8, 63 + k * 5, s[2])
 for y in range(20, 60):                           # the stela
  for x in range(cx - 10, cx + 11):
   u = (x - cx) / 10.5
   tone = 5 if u < -0.25 else 4 if u < 0.5 else 2
   if jitter(x // 2, y // 3) % 8 == 0: tone -= 1
   c.set(x, y, s[max(tone, 1)])
 c.hline(cx - 11, cx + 11, 19, s[6]); c.hline(cx - 10, cx + 10, 59, s[1])
 for k, half in enumerate((8, 11, 10)):            # its carved head
  for x in range(cx - half, cx + half + 1):
   c.set(x, 15 + k, red[4] if x < cx else red[2])
 _marks(c, cx - 9, cx + 9, 24, 54, red[2], step=9)
 for y in range(78, 88):                           # the round altar in front
  for x in range(8, 30):
   d = hypot((x - 19) / 11.0, (y - 83) / 5.0)
   if d > 1: continue
   tone = 5 if (x - 19) / 11 < -0.2 else 4 if y < 83 else 2
   c.set(x, y, s[max(tone, 1)])
 c.hline(11, 27, 78, s[6])
 _ground(c, cx, 84, 40, RAMPS['granite'])
 soft_outline(c, s[0], s[2])
 return c.image()


def ovoo(v=0):
 """A cairn of stones with poles and cloth: the steppe's mark on a place."""
 c = Canvas(W, H)
 s = RAMPS['granite']
 cloth = [TEAL, SAFFRON, CREAM, LACQUER]
 cx = 44
 for y in range(44, 84):                           # the heap, stone on stone
  t = (y - 44) / 40
  half = round(6 + 26 * t ** 0.9)
  for x in range(cx - half, cx + half + 1):
   u = (x - cx) / max(half, 1)
   block = (jitter(x // 4, y // 3) % 5)
   tone = 5 if u < -0.3 else 4 if u < 0.35 else 3
   tone -= block % 2
   if (x // 4 + y // 3) % 3 == 0: tone -= 1
   c.set(x, y, s[max(tone, 1)])
   if (y % 3 == 0 and (x + y) % 4 == 0) or (x % 4 == 0 and y % 3 == 1):
    c.set(x, y, s[1])                              # the gaps between stones
 for i, (px, lean) in enumerate(((cx, 0), (cx - 13, -3), (cx + 12, 3))):
  top = 8 + i * 6
  for y in range(top, 60):                         # the poles
   x = px + round(lean * (y - top) / 50)
   c.set(x, y, RAMPS['walnut7'][5]); c.set(x + 1, y, RAMPS['walnut7'][2])
  for k in range(7):                               # the rags tied to them
   p = cloth[(i + k) % 4]
   x = px + round(lean * (top + 6 + k * 3 - top) / 50)
   for j in range(6 + k % 3):
    c.set(x + 2 + j, top + 6 + k * 3 + (j // 3), p[4 if j % 2 else 3])
   c.set(x + 2, top + 6 + k * 3, p[6])
 _ground(c, cx, 84, 36, RAMPS['granite'])
 soft_outline(c, s[0], s[2])
 return c.image()


def ushnu(v=0):
 """A low platform of fitted stone with a niche: the Andean plaza's centre."""
 c = Canvas(W, H)
 s = RAMPS['granite']
 cloth = ['#4a1a12', '#6d2a1a', '#8f4023', '#ad5c2e', '#c67c42', '#dba066', '#eec392']
 cx = 44
 for k, (half, y) in enumerate(((22, 58), (27, 68), (32, 78))):
  for yy in range(y, y + 10):                      # courses of dressed stone
   for x in range(cx - half, cx + half + 1):
    u = (x - cx) / half
    # Fitted masonry: big blocks, each with its own bevel, no mortar lines.
    bx, by = (x + 60) // 9, (yy + 40) // 5
    tone = 5 if u < -0.3 else 4 if u < 0.4 else 3
    tone -= (jitter(bx, by) % 3 == 0)
    if (x + 60) % 9 == 0 or (yy + 40) % 5 == 0: tone -= 2
    c.set(x, yy, s[max(tone, 1)])
   c.hline(cx - half, cx + half, y, s[6])
   c.hline(cx - half, cx + half, y + 9, s[1])
 for y in range(30, 58):                           # the upright behind it
  for x in range(cx - 14, cx + 15):
   u = (x - cx) / 14.5
   bx, by = (x + 60) // 10, y // 6
   tone = 5 if u < -0.25 else 4 if u < 0.45 else 3
   tone -= (jitter(bx, by) % 3 == 0)
   if (x + 60) % 10 == 0 or y % 6 == 0: tone -= 2
   c.set(x, y, s[max(tone, 1)])
 for y in range(36, 56):                           # its trapezoid niche
  half = 6 - (y - 36) // 8
  for x in range(cx - half, cx + half + 1):
   c.set(x, y, '#14181c' if y < 54 else s[1])
 c.hline(cx - 7, cx + 7, 35, s[6])
 for k in range(6):                                # a cloth laid over the step
  for x in range(cx - 20 + k, cx + 8 - k):
   c.set(x, 56 + k, cloth[4 if (x + k) % 5 else 2])
 c.hline(cx - 20, cx + 7, 56, cloth[6])
 _ground(c, cx, 88, 38, RAMPS['granite'])
 soft_outline(c, s[0], s[2])
 return c.image()


def war_memorial(v=0):
 """A tapered shaft on a stepped base with a wreath: the European square,
 1870 onward, where the market cross used to be."""
 c = Canvas(W, H)
 s = RAMPS['limestone']
 bronze = RAMPS['brasspot7'] if 'brasspot7' in RAMPS else GOLD
 cx = 44
 _plinth(c, cx, 72, 14, 5, s, step=3)
 for y in range(46, 72):                           # the die, with its panel
  for x in range(cx - 13, cx + 14):
   u = (x - cx) / 13.5
   tone = 5 if u < -0.28 else 4 if u < 0.45 else 3
   if jitter(x // 4, y // 5) % 11 == 0: tone -= 1
   c.set(x, y, s[max(tone, 1)])
  c.hline(cx - 13, cx + 13, 46, s[6])
 for y in range(52, 68):                           # the inscribed panel
  for x in range(cx - 9, cx + 10):
   c.set(x, y, s[3] if (x + y) % 13 else s[2])
 c.hline(cx - 10, cx + 10, 51, s[6]); c.hline(cx - 10, cx + 10, 68, s[1])
 _marks(c, cx - 8, cx + 8, 54, 66, s[1], step=5)
 for y in range(12, 46):                           # the shaft, tapering
  t = (y - 12) / 34
  half = round(5 + 3 * t)
  for x in range(cx - half, cx + half + 1):
   u = (x - cx) / max(half, 1)
   tone = 6 if u < -0.35 else 5 if u < 0.3 else 3
   c.set(x, y, s[max(tone, 1)])
 c.hline(cx - 9, cx + 9, 45, s[6]); c.hline(cx - 10, cx + 10, 44, s[2])
 for k, half in enumerate((4, 6, 5)):              # a capped head
  for x in range(cx - half, cx + half + 1):
   c.set(x, 9 + k, s[5] if x < cx else s[3])
 c.set(cx, 6, s[4]); c.set(cx, 7, s[5]); c.set(cx, 8, s[4])
 for a in range(0, 360, 12):                       # a bronze wreath on the die
  r = a * pi / 180
  x = round(cx + cos(r) * 7.5)
  y = round(59 + sin(r) * 6.5)
  c.set(x, y, bronze[5] if cos(r) < 0 else bronze[3])
  c.set(x, y + 1, bronze[1])
 _ground(c, cx, 78, 30, RAMPS['granite'])
 soft_outline(c, s[0], s[2])
 return c.image()


def clock_tower(v=0):
 """A brick tower with a clock and a bell stage: the modern square anywhere
 the nineteenth century reached."""
 c = Canvas(W, H)
 b = RAMPS['rustred7']
 s = RAMPS['limestone']
 m = RAMPS['blackiron7']
 cx = 44
 _plinth(c, cx, 82, 16, 4, s, step=2)
 for y in range(26, 82):                           # the shaft, in brick
  for x in range(cx - 14, cx + 15):
   u = (x - cx) / 14.5
   course = y // 3
   tone = 5 if u < -0.28 else 4 if u < 0.5 else 3
   if y % 3 == 0 or (x + course * 5) % 8 == 0: tone -= 2
   elif jitter(x, course) % 5 == 0: tone += 1
   c.set(x, y, b[max(tone, 1)])
 for y in (44, 62):                                # stone bands across it
  for k in range(3):
   c.hline(cx - 15, cx + 15, y + k, s[5] if k == 0 else s[3] if k == 1 else s[1])
 for y in range(30, 42):                           # the clock face
  for x in range(cx - 9, cx + 10):
   d = hypot((x - cx) / 9.5, (y - 36) / 6.2)
   if d > 1: continue
   c.set(x, y, s[5] if d < 0.78 else s[2])
 for a in range(0, 360, 30):                       # its hour marks
  r = a * pi / 180
  c.set(round(cx + cos(r) * 7.0), round(36 + sin(r) * 4.6), m[1])
 c.set(cx, 36, m[0]); c.set(cx, 34, m[1]); c.set(cx, 33, m[1])
 c.set(cx + 1, 37, m[1]); c.set(cx + 2, 38, m[1])
 for i, half in enumerate((17, 19)):               # the bell stage's cornice
  for x in range(cx - half, cx + half + 1):
   c.set(x, 24 + i, s[5] if x < cx else s[3])
 c.hline(cx - 19, cx + 19, 26, s[1])
 for y in range(12, 24):                           # the open bell stage
  for x in range(cx - 13, cx + 14):
   u = (x - cx) / 13.5
   pier = abs(u) > 0.72 or abs(u) < 0.12
   c.set(x, y, b[4 if u < 0 else 3] if pier else '#191413')
 for i, half in enumerate((15, 12, 8, 4)):         # a pyramid roof
  for x in range(cx - half, cx + half + 1):
   c.set(x, 8 + i, m[5] if x < cx else m[3])
 c.set(cx, 5, m[4]); c.set(cx, 6, m[5]); c.set(cx, 7, m[4])
 _ground(c, cx, 86, 28, RAMPS['granite'])
 soft_outline(c, b[0], b[2])
 return c.image()


def carved_post(v=0):
 """A standing carved figure at the ground's edge: Pacific and west African
 assembly grounds, where the mark of the place is worked timber."""
 c = Canvas(W, H)
 w = RAMPS['walnut7']
 paint = [LACQUER, CREAM, TEAL]
 cx = 44
 for k, (half, y) in enumerate(((13, 78), (16, 84))):
  for yy in range(y, y + 6):                       # a low stone footing
   for x in range(cx - half, cx + half + 1):
    u = (x - cx) / half
    c.set(x, yy, RAMPS['granite'][5 if u < -0.3 else 4 if u < 0.4 else 2])
 for y in range(14, 80):                           # the post itself
  t = (y - 14) / 66
  half = round(9 - 2 * t)
  for x in range(cx - half, cx + half + 1):
   u = (x - cx) / max(half, 1)
   tone = 5 if u < -0.35 else 4 if u < 0.35 else 2
   if jitter(x, y // 4) % 9 == 0: tone -= 1
   c.set(x, y, w[max(tone, 1)])
 for i, y in enumerate(range(20, 76, 14)):         # bands of carving
  p = paint[i % 3]
  for k in range(5):
   for x in range(cx - 8, cx + 9):
    zig = (x + k) % 6 < 3
    c.set(x, y + k, p[5] if zig else p[2])
 for y in range(4, 16):                            # a face at the head
  for x in range(cx - 11, cx + 12):
   u = (x - cx) / 11.5
   c.set(x, y, w[5] if u < -0.3 else w[4] if u < 0.4 else w[2])
 for ex in (cx - 5, cx + 4):                       # its eyes and mouth
  for y in range(8, 11):
   c.hline(ex, ex + 1, y, '#1a1210')
  c.set(ex, 8, CREAM[5]); c.set(ex + 1, 8, CREAM[4])
 c.hline(cx - 5, cx + 5, 13, '#1a1210')
 c.hline(cx - 4, cx + 4, 14, w[2])
 for dx in (-12, 12):                              # ears or wings at the head
  for k in range(4):
   c.set(cx + dx + (k if dx < 0 else -k), 6 + k, w[3])
 _ground(c, cx, 90, 26, RAMPS['buffclay7'])
 soft_outline(c, w[0], w[2])
 return c.image()


def door_marker(v=0, layer='all'):
 """What hangs at a door. Lanterns in east and southeast Asia, a garland in
 south Asia, a bracket lamp in west Asia and Europe — one object per place
 rather than the same lantern recoloured, since the silhouettes differ more
 than the colours do."""
 c = Canvas(40, 48)
 w = RAMPS[WOOD7[0 if v != 2 else 2]]
 m = RAMPS['blackiron7']
 brass = RAMPS['brasspot7'] if 'brasspot7' in RAMPS else GOLD
 hanging = v < 3 or v == 6                         # hung from a beam, or braced
 if layer != 'hang':
  if hanging:
   for px in (4, 31):                              # two uprights and a beam
    for y in range(10, 43):
     c.set(px, y, w[5]); c.set(px + 1, y, w[3]); c.set(px + 2, y, w[1])
    c.hline(px - 1, px + 3, 43, w[1]); c.hline(px - 1, px + 3, 9, w[4])
   for y in range(6, 10):
    for x in range(2, 37):
     c.set(x, y, w[5] if y == 6 else w[4] if y < 9 else w[1])
   streak(c, 2, 36, 7, w, 4)
   for bx in (8, 29):
    for k in range(4): c.set(bx + (k if bx < 20 else -k), 10 + k, w[2])
  else:                                            # a bracket off a wall
   for y in range(2, 46):                          # the jamb it is fixed to
    for x in range(1, 7):
     u = (x - 1) / 6
     c.set(x, y, RAMPS['limestone'][5 if u < 0.4 else 3 if u < 0.8 else 1])
   for x in range(6, 24):                          # the arm, with a scroll
    c.set(x, 8, m[5]); c.set(x, 9, m[3]); c.set(x, 10, m[1])
   for k in range(5):
    c.set(7 + k, 11 + k, m[3]); c.set(8 + k, 11 + k, m[1])
   for k in range(4):
    c.set(20 + k, 11 + k // 2, m[4])
   c.set(23, 11, m[5]); c.set(23, 12, m[2])
 if layer != 'frame':
  if v < 3:                                        # a pair of paper lanterns
   paper = [LACQUER, SAFFRON, CREAM][v]
   cap = [GOLD, GOLD, RAMPS['walnut7']][v]
   for lx in (12, 27):
    for k in range(3):
     c.set(lx, 10 + k, RAMPS['rope'][2 if k % 2 else 1])
    for y in range(13, 17):
     half = 3 if y < 15 else 4
     for x in range(lx - half, lx + half + 1):
      c.set(x, y, cap[5] if x < lx else cap[3])
    for y in range(17, 29):
     t = (y - 17) / 12
     half = round(4 + 3 * (1 - (t - 0.5) ** 2 * 3.4))
     for x in range(lx - half, lx + half + 1):
      u = (x - lx) / max(half, 1)
      tone = 5 if u < -0.35 else 4 if u < 0.35 else 2
      if (y - 17) % 4 == 0: tone -= 1
      c.set(x, y, paper[max(tone, 1)])
     c.set(lx - half, y, paper[1]); c.set(lx + half, y, paper[1])
    for y in range(29, 32):
     for x in range(lx - 3, lx + 4):
      c.set(x, y, cap[4] if x < lx else cap[2])
    for k in range(5):
     c.set(lx, 32 + k, cap[3] if k % 2 else cap[5])
  elif v == 6:                                     # a toran across the lintel
   leaf = ['#16300f', '#255019', '#357026', '#478f33', '#5cae45', '#7fc665', '#a8dc8e']
   flower = [SAFFRON, LACQUER, CREAM]
   for x in range(3, 36):                          # the string, swagged
    dip = round(3 * (1 - ((x - 19.5) / 16.5) ** 2))
    c.set(x, 10 + dip, leaf[2])
    c.set(x, 11 + dip, leaf[1])
   for i, x in enumerate(range(5, 35, 4)):         # leaves hanging from it
    dip = round(3 * (1 - ((x - 19.5) / 16.5) ** 2))
    h = 5 + (i % 3) * 3
    for k in range(h):
     half = 1 if k < h - 2 else 0
     for px in range(x - half, x + half + 1):
      c.set(px, 12 + dip + k, leaf[5] if px < x else leaf[3])
    p = flower[i % 3]
    c.set(x, 12 + dip + h, p[5]); c.set(x - 1, 12 + dip + h, p[3])
    c.set(x + 1, 12 + dip + h, p[3]); c.set(x, 13 + dip + h, p[2])
  else:                                            # a lamp on the bracket
   glass = ['#2a2a1e', '#4a4527', '#756a2e', '#9c8b36', '#c0ab45', '#ddc76a', '#f2e4a4']
   frame = brass if v == 3 else m
   for k in range(3):                              # the chain it hangs by
    c.set(23, 12 + k, frame[4 if k % 2 else 2])
   if v == 3:                                      # pierced brass, a globe
    for y in range(15, 31):
     t = (y - 15) / 16
     half = round(3 + 5 * (1 - (t - 0.45) ** 2 * 3.6))
     for x in range(23 - half, 23 + half + 1):
      u = (x - 23) / max(half, 1)
      tone = 5 if u < -0.35 else 4 if u < 0.3 else 2
      if (x + y) % 3 == 0: tone = 6                # the light through the holes
      c.set(x, y, frame[max(tone, 1)])
     c.set(23 - half, y, frame[1]); c.set(23 + half, y, frame[1])
    for k in range(4): c.set(23, 31 + k, frame[3 if k % 2 else 5])
   else:                                           # a glazed lamp, four panes
    top, base = (15, 30) if v == 5 else (14, 29)
    for y in range(top, base):
     half = 6 if y > top + 2 else 4
     for x in range(23 - half, 23 + half + 1):
      u = (x - 23) / max(half, 1)
      c.set(x, y, glass[5] if u < -0.2 else glass[4] if u < 0.5 else glass[2])
    for x in (23 - 6, 23, 23 + 6):
     for y in range(top + 3, base): c.set(x, y, frame[2])
    for x in range(23 - 7, 23 + 8):                # its cap and its foot
     c.set(x, top + 2, frame[5] if x < 23 else frame[3])
     c.set(x, base, frame[4] if x < 23 else frame[2])
    c.set(23, top - 1, frame[4]); c.set(23, top, frame[5])
    if v == 4:                                     # a gas lamp burns brighter
     for x in range(21, 26): c.set(x, base - 4, glass[6])
     c.set(23, base - 5, glass[6])
 soft_outline(c, w[0] if hanging else m[0], w[2])
 return c.image()


# The three Asian centrepieces keep their own module; everything else is here.
_FOCUS = [None, None, None, sabil, palaver_tree, meso_platform, ushnu, ovoo,
          war_memorial, clock_tower, carved_post]


def square_focus(v=0):
 """The whole family: 0-2 are the Asian three, 3 on are the rest."""
 return _asian_focus(v) if v < 3 else _FOCUS[v]()


CIVIC = {
 'square-focus': square_focus,
 'door-lantern': door_marker,
}
