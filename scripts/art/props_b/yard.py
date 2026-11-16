"""Yard and work props: racks, troughs, tubs, tools and the like.

A variant's first few numbers keep the family's named meanings in props.json;
every number also seeds the small differences, so two racks on one map are
not the same rack.
"""
from random import Random

from .core import Canvas, revolve, belly
from .solid import disc

W = ['#5a3420', '#7d4a28', '#a26a38', '#c68e50', '#e6b872']       # warm timber
WD = ['#3e2a22', '#5a3c2c', '#7a543a', '#9c7450', '#ba9468']      # weathered
BARK = ['#3a2a22', '#54392a', '#6e4c34', '#8a6444']
CUT = ['#b88a52', '#d9ae72', '#f0d09a']                           # fresh-cut wood
ROPE = ['#7a5a30', '#a8824a', '#d4b070']
STRAW = ['#8a6a24', '#b8923a', '#dcb850', '#f2dc80']
STONE = ['#55526a', '#7c7a90', '#a3a2b2', '#c9c8d0']
WATER = ['#2a5a8a', '#3c86b8', '#62b4d8', '#a8e0ee', '#eefcfa']
IRON = ['#2c3040', '#4a5064', '#727a8e', '#a4acba']
CLAY = ['#6a3524', '#96502f', '#bd7443', '#dc9a62', '#f0c08a']
LEAF = ['#3f6a2c', '#5e8f3a', '#86b84c']
INK = (30, 18, 38)


def _rgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def _lum(h): r, g, b = _rgb(h); return r * 3 + g * 6 + b


def ink(c, k=.6):
 """Outline in each material's own darkened hue, pulled toward plum."""
 filled = dict(c.px)
 edge = {}
 for (x, y), col in filled.items():
  for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
   n = (x + dx, y + dy)
   if n in filled: continue
   if n not in edge or _lum(col) < _lum(edge[n]): edge[n] = col
 for (x, y), col in edge.items():
  c.set(x, y, '#%02x%02x%02x' % tuple(round(a * (1 - k) + b * k) for a, b in zip(_rgb(col), INK)))


def limb(c, a, b, cols):
 """A timber from a to b. cols run left to right on a steep one, top to
 bottom on a shallow one, so the lit side is always first."""
 (x0, y0), (x1, y1) = a, b
 n = max(abs(x1 - x0), abs(y1 - y0)) or 1
 steep = abs(y1 - y0) >= abs(x1 - x0)
 for i in range(n + 1):
  x, y = round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n)
  for k, col in enumerate(cols):
   if steep: c.set(x + k, y, col)
   else: c.set(x, y + k, col)


def lash(c, x0, x1, y0, y1):
 for y in range(y0, y1 + 1): c.hline(x0, x1, y, ROPE[2] if (y - y0) % 2 == 0 else ROPE[0])


def fish(c, x, y, n, tones):
 """Hung by the tail, head down, n rows of body."""
 hi, mid, lo = tones
 edge = '#4a3a48'
 for dx in (-2, -1, 1, 2): c.set(x + dx, y, mid if dx < 0 else lo)
 c.hline(x - 1, x + 1, y + 1, mid); c.set(x, y + 2, mid)
 for i in range(n):
  half = 1 if i == 0 or i >= n - 2 else 2
  yy = y + 3 + i
  for dx in range(-half, half + 1):
   c.set(x + dx, yy, hi if dx < 0 else mid if dx == 0 else lo)
  c.set(x + half + 1, yy, edge)
 c.set(x - 1, y + 4, '#ffffff')
 c.set(x, y + 3 + n, lo); c.set(x + 1, y + 3 + n, edge)
 c.set(x - 1, y + n, '#2a2030')
 c.set(x + 1, y + 6, mid); c.set(x + 2, y + 7, mid)                # gill fin


CREAM = ['#b8a888', '#ddd0b0', '#f6eed8']
RED = ['#8a2e2a', '#b8443a', '#dc6a52']
INDIGO = ['#243a6a', '#3a5a9a', '#5e86c4']
OCHRE = ['#9a6a1e', '#c8922e', '#e8ba54']
GREEN = ['#365a30', '#568446', '#84b068']
ROSE = ['#8a4660', '#b86a84', '#dc98aa']
TEAL = ['#1e5454', '#34807c', '#62aea4']
UMBER = ['#5a3c2c', '#86603e', '#b08a5c']
RUST = ['#7a3a22', '#a85a34', '#cc8454']
SLATE = ['#3e5674', '#5e7a9a', '#86a2bc']
HIDE = ['#8a5a34', '#b88454', '#d8ac78', '#ecca9c']
MUD = ['#7a5a40', '#a88460', '#caa880', '#e2c8a0']
BONE = ['#8a8068', '#c4baa0', '#e8e0cc', '#fbf6e8']
LEATHER = ['#4a2a1c', '#74442a', '#9c6438', '#c08a52']
GRIT = ['#7a6a58', '#a8947a', '#c8b698', '#e0d2b8']
DARK = '#2a2030'


def rnd(v, salt): return Random(v * 7919 + salt)


def timber(c, x0, y0, x1, y1, t=W, across=False):
 """An upright (or a rail, across) with a lit edge and a shaded one."""
 c.rect(x0, y0, x1, y1, t[2])
 if across: c.hline(x0, x1, y0, t[4]); c.hline(x0, x1, y1, t[1])
 else: c.vline(x0, y0, y1, t[3]); c.vline(x1, y0, y1, t[1])


def cloth(c, x0, y0, w, h, t, hem=None):
 c.rect(x0, y0, x0 + w - 1, y0 + h - 1, t[1])
 c.vline(x0, y0, y0 + h - 1, t[2]); c.vline(x0 + 1, y0 + 1, y0 + h - 2, t[2])
 c.vline(x0 + w - 1, y0, y0 + h - 1, t[0]); c.hline(x0, x0 + w - 1, y0 + h - 1, t[0])
 if w > 6: c.vline(x0 + w - 3, y0 + 2, y0 + h - 3, t[0])
 if hem:
  c.hline(x0, x0 + w - 1, y0 + h - 4, hem[2]); c.hline(x0, x0 + w - 1, y0 + h - 3, hem[1])


def forked_post(c, x, y0, y1, t=W):
 timber(c, x, y0, x + 2, y1, t)
 c.vline(x - 1, y0 - 3, y0, t[3]); c.vline(x + 3, y0 - 3, y0, t[1])
 c.set(x + 1, (y0 + y1) // 2, t[1]); c.set(x + 1, (y0 + y1) // 2 + 1, t[1])


def drying_rack(v=0, layer='all'):
 """0 mixed catch, 1 split fish, 2 strips of meat, then seeded mixes."""
 R = rnd(v, 1)
 c = Canvas(48, 38)
 py = 9
 knots = R.sample(range(13, 44, 3), 4)
 xs = [15, 20, 25, 30, 35] if R.random() < .5 else [16, 22, 28, 33]
 if v != 0: xs = [x for x in xs if R.random() < .85]
 hangs = [(x, R.randint(8, 12), R.random() < .45) for x in xs]
 if layer != 'hang':
  for ex in (9, 38):
   limb(c, (ex - 2, 5), (ex + 4, 32), [WD[3], WD[2], WD[1]])
   limb(c, (ex + 1, 5), (ex - 6, 37), [W[3], W[2], W[1]])
  timber(c, 1, py, 46, py + 2, across=True)
  for x in (0, 47): c.vline(x, py, py + 2, CUT[1])
  for x in knots: c.hline(x, x + 1, py + 1, W[1])
  for ex in (9, 38): lash(c, ex - 3, ex + 3, py - 2, py + 3)
  ink(c)
  # The knot stays on the pole; only what hangs below it swings.
  for x, _, _ in hangs: c.set(x, py + 3, ROPE[1])
 if layer != 'frame':
  silver = ['#dfe6e6', '#aebbc2', '#7f8e9c']
  amber = ['#f0bc84', '#d0905a', '#a0643c']
  meat = ['#c8685a', '#a04438', '#742c2a']
  for x, n, split in hangs:
   c.set(x, py + 4, ROPE[1])
   if v % 3 == 2:
    c.rect(x - 1, py + 5, x + 1, py + 5 + n, meat[1]); c.vline(x - 1, py + 5, py + 4 + n, meat[0])
    c.vline(x + 1, py + 6, py + 5 + n, meat[2]); c.set(x, py + 5 + n + 1, meat[2])
   else: fish(c, x, py + 5, n, amber if v % 3 == 1 or (v % 3 == 0 and split) else silver)
 return c.image()


def trough(v=0):
 """A hollowed log on sleepers; variant 1 is carved stone."""
 R = rnd(v, 2)
 c = Canvas(52, 25)
 stone = v % 3 == 1
 side = STONE if stone else BARK
 rim = [STONE[2], STONE[3], '#e2e1e6'] if stone else CUT
 if not stone:
  for x in (8, 39):
   c.rect(x, 20, x + 5, 24, BARK[1]); c.hline(x, x + 5, 20, BARK[0]); c.vline(x, 21, 24, BARK[2])
 groove = R.randint(0, 5)
 bottom = 23 if stone else 21
 for y in range(3, bottom + 1):
  inset = min(3, max(0, 3 - (y - 3), (1 if stone else 3) - (bottom - y)))
  for x in range(2 + inset, 50 - inset):
   if y < 13: col = rim[1]
   else:
    col = side[3] if y == 13 else side[2] if y < 18 else side[1]
    if stone:
     if (x * 3 + y * 5 + groove) % 13 == 0 and y > 14: col = side[1 if y < 18 else 0]
    elif (x + groove + (y > 17) * 3) % 6 == 0 and y > 14 and (x * 5 + y) % 4: col = side[0]
   c.set(x, y, col)
 c.hline(5, 46, 3, rim[2]); c.hline(3, 48, 12, rim[0])
 for x in R.sample(range(8, 44), 5): c.set(x, 4, rim[0])
 for y in range(5, 12):
  inset = 2 if y in (5, 11) else 1 if y in (6, 10) else 0
  for x in range(6 + inset, 46 - inset):
   c.set(x, y, side[0] if y == 5 else side[1] if y == 6 else WATER[0] if y == 7 else WATER[1])
 for _ in range(3):
  x, y, n = R.randint(9, 36), R.randint(8, 10), R.randint(4, 9)
  c.hline(x, x + n, y, WATER[2]); c.hline(x + 1, x + n // 2, y, WATER[3])
 x = R.randint(10, 38); c.set(x, 9, WATER[4])
 if R.random() < .7:
  x = R.randint(12, 40); c.set(x, 9, LEAF[2]); c.set(x + 1, 9, LEAF[1]); c.set(x + 1, 8, LEAF[2])
 for _ in range(R.randint(2, 5)):
  x, y = R.choice([R.randint(3, 8), R.randint(42, 47), R.randint(12, 38)]), R.randint(16, 19)
  c.set(x, y, LEAF[1]); c.set(x + 1, y + 1, LEAF[1]); c.set(x, y - 1, LEAF[2])
 ink(c)
 return c.image()


def chopping_block(v=0):
 R = rnd(v, 3)
 c = Canvas(34, 30)
 cx, axe = 13, v % 3 != 2
 lean = R.randint(0, 3)
 for y in range(13, 29):
  half = 9 + (1 if y > 25 else 0)
  if y == 28: half = 8
  for x in range(cx - half, cx + half + 1):
   u = (x - cx) / half
   col = BARK[3] if u < -.45 else BARK[2] if u < .35 else BARK[1]
   if (x + lean + (y // 5)) % 4 == 0 and y > 15: col = BARK[1] if u < .35 else BARK[0]
   c.set(x, y, col)
 disc(c, cx + .5, 13, 9.6, 4.6, CUT[1])
 disc(c, cx + .5, 13, 6.5, 3, CUT[0]); disc(c, cx + .5, 13, 5.5, 2.3, CUT[1])
 disc(c, cx + .5, 13, 2.6, 1.2, CUT[0]); c.set(cx, 13, CUT[2])
 c.hline(cx - 6, cx + 2, 9, CUT[2])
 c.hline(cx + 3, cx + 8, 14, CUT[0])
 if axe:
  limb(c, (16, 8), (27, 0), [W[4], W[2]])
  c.set(27, 0, W[1]); c.set(28, 0, W[3])
  for y, (a, b) in {5: (11, 16), 6: (10, 17), 7: (10, 17), 8: (9, 16), 9: (9, 15), 10: (9, 13), 11: (9, 11)}.items():
   for x in range(a, b + 1): c.set(x, y, IRON[1] if x > a + 2 else IRON[2])
  c.hline(11, 16, 5, IRON[3]); c.vline(9, 8, 11, IRON[3]); c.set(10, 6, IRON[3])
 else:                                                            # a billet stood ready to split
  c.rect(10, 4, 16, 12, CUT[1]); c.vline(10, 4, 12, CUT[2]); c.vline(16, 4, 12, BARK[2]); c.vline(15, 5, 12, BARK[3])
  c.hline(10, 16, 4, CUT[2]); c.set(12, 7, CUT[0]); c.set(13, 10, CUT[0])
 spots = [(24, 20), (27, 23), (23, 25)]
 for bx, by in spots[:R.randint(1, 3)]:
  c.rect(bx, by, bx + 6, by + 4, CUT[1]); c.hline(bx, bx + 6, by, CUT[2])
  c.hline(bx, bx + 6, by + 4, BARK[1]); c.vline(bx + 6, by, by + 4, BARK[2]); c.set(bx + 2, by + 2, CUT[0]); c.set(bx + 4, by + 2, CUT[0])
 ink(c)
 for _ in range(R.randint(2, 4)):
  x = R.choice([R.randint(0, 2), R.randint(22, 24)]); c.set(x, 29, CUT[2]); c.set(x + 1, 29, CUT[1])
 return c.image()


def washing_line(v=0, layer='all'):
 """0 linen, 1 mixed, 2 bright; every variant hangs its own wash."""
 R = rnd(v, 5)
 pool = [[CREAM, CREAM, ['#a89878', '#c8ba98', '#e2d8bc'], UMBER],
         [CREAM, INDIGO, OCHRE, UMBER, RED, SLATE],
         [RED, INDIGO, OCHRE, GREEN, ROSE, TEAL, CREAM]][v % 3]
 c = Canvas(60, 42)
 frame = c
 if layer == 'frame': c = Canvas(60, 42)                         # the wash is drawn and thrown away
 if layer != 'hang':
  for x in (3, 54): forked_post(frame, x, 8, 41)
 sag = lambda x: 9 + round(4 * (1 - ((x - 29.5) / 25.5) ** 2))
 pegs, x, last = [], R.randint(8, 12), None
 while x < 46:
  kind = R.choice(['tunic', 'sheet', 'sheet', 'strip', 'strip', 'small', 'legs'])
  t = R.choice([q for q in pool if q is not last] or pool); last = t
  w = {'tunic': 13, 'sheet': R.randint(8, 11), 'strip': R.randint(4, 6), 'small': 7, 'legs': 9}[kind]
  if x + w > 52: break
  y = sag(x + w // 2)
  if kind == 'tunic':
   h = R.randint(12, 16)
   cloth(c, x + 2, y, 9, h, t); c.rect(x, y, x + 12, y + 3, t[1]); c.hline(x, x + 12, y + 3, t[0])
   c.vline(x, y, y + 3, t[2]); c.hline(x + 5, x + 7, y, t[0]); c.set(x + 6, y + 1, t[0])
  elif kind == 'legs':
   h = R.randint(12, 15)
   cloth(c, x, y, 9, 5, t); cloth(c, x, y + 4, 4, h - 4, t); cloth(c, x + 5, y + 4, 4, h - 4, t)
  else:
   h = {'sheet': R.randint(13, 18), 'strip': R.randint(8, 13), 'small': R.randint(6, 8)}[kind]
   cloth(c, x, y, w, h, t, hem=R.choice([q for q in pool if q is not t] or [None]) if kind == 'sheet' and R.random() < .5 else None)
  pegs += [x + 1, x + w - 2]
  x += w + R.choice([1, 1, 2, 2, 6])
 c = c if layer != 'frame' else frame
 ink(c)
 if layer != 'hang':
  for x in range(5, 56): c.set(x, sag(x) - 1, ROPE[1])
  for x in pegs: c.set(x, sag(x) - 1, W[0]); c.set(x, sag(x), W[0])
 return c.image()


def hide_frame(v=0):
 """0 deer, 1 cattle, 2 dappled."""
 R = rnd(v, 6)
 t = [HIDE, ['#4a2e22', '#6e4630', '#8e6040', '#a87a54'], ['#96643a', '#c08a52', '#dcae74', '#ecca9c']][v % 3]
 c = Canvas(42, 42)
 for x in (3, 36): timber(c, x, 1, x + 2, 41)
 for y in (4, 33): timber(c, 0, y, 41, y + 2, across=True)
 for x in (3, 36):
  for y in (4, 33): lash(c, x - 1, x + 3, y - 1, y + 3)
 inside = set()
 for y in range(10, 30):
  pinch = round(1.5 * (1 - abs(y - 19.5) / 9.5))
  for x in range(11 + pinch, 31 - pinch):
   u, w = (x - 20.5) / 10, (y - 19.5) / 10
   col = t[3] if u * u + w * w < .25 and u + w < .2 else t[2]
   if x >= 29 - pinch or y >= 28: col = t[1]
   c.set(x, y, col); inside.add((x, y))
 for (x, y, dx, dy) in ((11, 10, -1, -1), (30, 10, 1, -1), (11, 29, -1, 1), (30, 29, 1, 1)):
  for i in range(3):
   c.set(x + dx * i, y + dy * i, t[2 if dx < 0 else 1]); c.set(x + dx * i + dx, y + dy * i, t[2 if dx < 0 else 1])
 c.rect(19, 8, 22, 10, t[2])
 if v % 3 == 1:                                                   # a piebald's white
  for cx, cy, rx, ry in ((R.randint(14, 18), R.randint(13, 17), 3.4, 2.6), (R.randint(22, 26), R.randint(20, 25), 4, 3)):
   disc(c, cx, cy, rx, ry, '#efe6d2', keep=lambda dx, dy, cx=cx, cy=cy: (int(cx + dx), int(cy + dy)) in inside)
 elif v % 3 == 2:
  for _ in range(9):
   x, y = R.randint(13, 27), R.randint(12, 27)
   c.set(x, y, '#f6ead0'); c.set(x + 1, y, '#f6ead0')
 else:
  for _ in range(6):
   x, y = R.randint(13, 27), R.randint(12, 27); c.set(x, y, t[1])
 ink(c)
 sinew = '#f0e2bc'
 for a, b in (((8, 7), (6, 6)), ((33, 7), (35, 6)), ((8, 32), (6, 33)), ((33, 32), (35, 33)),
              ((20, 7), (20, 7)), ((21, 7), (21, 7)), ((14, 9), (13, 7)), ((27, 9), (28, 7)),
              ((14, 30), (13, 32)), ((27, 30), (28, 32)), ((20, 30), (20, 32)),
              ((10, 15), (6, 14)), ((10, 24), (6, 25)), ((31, 15), (35, 14)), ((31, 24), (35, 25))):
  c.line(a, b, sinew)
 return c.image()


def wash_tub(v=0, m=0):
 """0 oak, 1 pale pine; the wash over the rim and the board are seeded."""
 from math import sqrt
 R = rnd(v, 7)
 t = [WD[1], WD[2], WD[3], WD[4], '#d8b888'] if v % 2 else W
 c = Canvas(34, 30)
 cx, board = 15, R.random() < .7
 if board:
  timber(c, 21, 1, 28, 14); c.hline(21, 28, 1, W[4])
  for y in range(4, 13): c.hline(23, 26, y, '#c8d2d8' if y % 2 else '#8794a2')
 for x in range(cx - 12, cx + 13):
  u = (x + .5 - cx) / 12.5
  drop = round(4 * sqrt(max(0, 1 - u * u)))
  for y in range(13, 22 + drop + 1):
   col = t[3] if u < -.4 else t[2] if u < .4 else t[1]
   if (x - cx) % 4 == 0: col = t[1] if u < .4 else t[0]
   if y in (15 + drop // 2, 20 + drop): col = IRON[3] if u < -.4 else IRON[2] if u < .4 else IRON[1]
   c.set(x, y, col)
 disc(c, cx + .5, 13, 12.6, 5, CUT[1])
 disc(c, cx + .5, 13, 11, 3.8, t[0])
 disc(c, cx + .5, 14, 10.6, 3.2, WATER[2])
 c.hline(cx - 7, cx + 5, 11, t[1])
 for _ in range(6):
  x, y = R.randint(7, 19) + (m + _) % 2, R.randint(13, 15)
  c.set(x, y, '#f4fbff'); c.set(x + 1, y, '#f4fbff'); c.set(x + R.randint(0, 1), y - 1 if y > 13 else y + 1, '#f4fbff')
 for _ in range(3): c.set(R.randint(8, 21), R.randint(13, 15), WATER[3])
 if board: timber(c, 22, 11, 27, 14); c.rect(23, 12, 26, 14, W[2])
 wash = R.choice([RED, INDIGO, CREAM, OCHRE, GREEN, ROSE])
 if R.random() < .5: cloth(c, 2, 11, 6, R.randint(7, 10), wash); c.hline(3, 8, 10, wash[2]); c.hline(4, 8, 11, wash[2])
 else: cloth(c, 10, 15, 7, R.randint(6, 9), wash); c.hline(10, 16, 14, wash[2])
 ink(c)
 for i, (x, y) in enumerate(((11, 8), (14, 6), (17, 9))[:R.randint(1, 3)]): c.set(x, y - (m + i) % 4 * 2, WATER[4])
 return c.image()


def plough(v=0):
 """An ard: sole and iron share on the ground, beam forward, one stilt.
 The wheeled and mouldboard ploughs are still farm.py's."""
 if v % 3:
  from .farm import plough as later
  return later(v)
 c = Canvas(58, 34)
 limb(c, (44, 26), (51, 6), [W[3], W[2], W[1]])
 timber(c, 47, 4, 55, 6, across=True)
 limb(c, (40, 24), (22, 15), [W[4], W[2], W[1]])
 limb(c, (22, 15), (3, 11), [W[4], W[2], W[1]])
 timber(c, 31, 20, 33, 27)
 timber(c, 2, 7, 4, 17, WD)
 lash(c, 1, 5, 10, 13)
 timber(c, 26, 27, 48, 30, across=True); c.hline(30, 44, 29, W[1])
 lash(c, 38, 42, 23, 27)
 for y, (a, b) in {27: (22, 27), 28: (18, 27), 29: (15, 27), 30: (19, 27)}.items():
  for x in range(a, b + 1): c.set(x, y, IRON[3] if y == 27 else IRON[2] if y < 30 else IRON[1])
 c.set(15, 29, IRON[3]); c.set(16, 29, IRON[3])
 for x, y, col in ((10, 32, BARK[2]), (11, 32, BARK[2]), (12, 31, BARK[3]), (13, 31, BARK[2]), (14, 31, BARK[2]),
                   (12, 32, BARK[1]), (13, 32, BARK[1]), (14, 32, BARK[1]), (15, 32, BARK[2]), (16, 31, BARK[2]),
                   (16, 32, BARK[1]), (17, 32, BARK[1]), (18, 32, BARK[2])):
  c.set(x, y, col)
 ink(c)
 return c.image()


def scarecrow(v=0):
 """0 natural, 1 rust red, 2 muted blue; hat, face, patch and crow seeded."""
 R = rnd(v, 9)
 shirt = [CREAM, RUST, SLATE][v] if v < 3 else R.choice([GREEN, UMBER, OCHRE, ROSE, SLATE, RUST])
 hat = ['brim', 'none', 'brim', 'cone', 'brim', 'none', 'cone'][v % 7]
 sack, shade = ('#dcc494', '#b89a64') if R.random() < .7 else ('#c8b8a0', '#a08e74')
 c = Canvas(36, 46)
 timber(c, 17, 30, 18, 45); c.vline(19, 32, 45, W[1])
 for x0, d in ((3, -1), (32, 1)):
  for y, n in ((15, 2), (17, 3), (19, 2)):
   for i in range(n): c.set(x0 + d * i, y, STRAW[3 if i == 0 else 2]); c.set(x0 + d * i, y + 1, STRAW[1])
 droop = R.randint(0, 1)
 c.rect(4, 15, 31, 20, shirt[1]); c.hline(4, 31, 15, shirt[2]); c.hline(4, 31, 20, shirt[0])
 c.rect(11, 15, 25, 32, shirt[1]); c.vline(11, 20, 32, shirt[2]); c.vline(12, 21, 31, shirt[2]); c.vline(25, 20, 32, shirt[0]); c.vline(24, 21, 32, shirt[0])
 if droop: c.rect(4, 21, 8, 23, shirt[1]); c.hline(4, 8, 23, shirt[0]); c.rect(27, 21, 31, 22, shirt[1]); c.hline(27, 31, 22, shirt[0])
 rag = R.randint(0, 4)
 for x in range(11, 26): c.set(x, 33 + ((x + rag) % 3 == 0) + ((x + rag) % 5 == 0), shirt[0]); c.set(x, 33, shirt[1] if (x + rag) % 3 else shirt[0])
 for x in R.sample(range(12, 25, 2), 4): c.set(x, 35, STRAW[2]); c.set(x, 36, STRAW[3]); c.set(x + 1, 35, STRAW[1])
 if R.random() < .75: c.hline(11, 25, 26, ROPE[1]); c.set(16, 27, ROPE[1]); c.set(16, 28, ROPE[2]); c.set(18, 27, ROPE[0])
 for _ in range(R.randint(1, 2)):
  px, py, pt = R.choice([13, 19, 20]), R.choice([21, 22, 28]), R.choice([q for q in (OCHRE, RED, CREAM, INDIGO, GREEN) if q is not shirt])
  c.rect(px, py, px + 3, py + 3, pt[1]); c.hline(px, px + 3, py, pt[2]); c.set(px, py + 3, pt[0]); c.set(px + 3, py + 1, pt[0])
 for x in (15, 17, 19, 21): c.set(x, 15, STRAW[3]); c.set(x + 1, 14, STRAW[2])
 disc(c, 18, 9.5, 5.6, 5.6, sack)
 for y in range(5, 15):
  for x in range(21, 24):
   if c.get(x, y) == sack and x + (y > 11) > 21: c.set(x, y, shade)
 c.hline(14, 22, 14, shade)
 eyes = R.choice(['buttons', 'odd', 'cross'])
 if eyes == 'cross':
  for ex in (15, 20): c.set(ex, 8, DARK); c.set(ex + 1, 9, DARK); c.set(ex + 1, 8, shade); c.set(ex, 9, shade); c.set(ex, 10, DARK) if False else None
 else:
  c.rect(15, 8, 16, 9, DARK); c.set(20, 9, DARK)
  if eyes == 'buttons': c.rect(20, 8, 21, 9, DARK)
  else: c.set(20, 8, DARK)
 smile = R.random() < .5
 for i, x in enumerate((15, 17, 19, 21)): c.set(x, 12 if not smile or i in (0, 3) else 13, '#5a3420')
 if smile: c.set(16, 13, '#5a3420'); c.set(20, 13, '#5a3420'); c.set(18, 13, '#5a3420')
 band = R.choice([RED, INDIGO, UMBER, GREEN])[1]
 if hat == 'brim':
  c.rect(9, 4, 27, 5, STRAW[2]); c.hline(9, 27, 4, STRAW[3]); c.hline(10, 26, 6, STRAW[0])
  c.rect(13, 0, 23, 3, STRAW[2]); c.hline(14, 22, 0, STRAW[3]); c.hline(13, 23, 3, band); c.vline(23, 0, 2, STRAW[1])
  for x in (8, 28): c.set(x, 5, STRAW[1])
 elif hat == 'cone':
  for y in range(0, 7):
   half = 1 + y * 1.6
   for x in range(round(18 - half), round(18 + half) + 1):
    c.set(x, y, STRAW[3] if x < 17 - y // 2 else STRAW[2] if x < 20 + y // 2 else STRAW[1])
  c.hline(8, 28, 6, STRAW[1])
 else:
  for x in range(13, 24): c.set(x, 4 - (x % 2), STRAW[3 if x % 3 else 2]); c.set(x, 5, STRAW[2])
  c.set(12, 6, STRAW[2]); c.set(24, 6, STRAW[1]); c.set(18, 2, STRAW[3])
 if R.random() < .55:
  crow = '#2a2838'
  for y, (a, b) in {9: (6, 8), 10: (5, 9), 11: (5, 10), 12: (6, 11), 13: (7, 12), 14: (8, 9)}.items(): c.hline(a, b, y, crow)
  c.set(6, 10, '#f4f0e0'); c.set(4, 10, OCHRE[2]); c.set(3, 10, OCHRE[1]); c.hline(7, 9, 11, '#4a4a68'); c.set(8, 12, '#4a4a68')
 ink(c)
 return c.image()


def fishing_nets(v=0):
 """0 undyed, 1 tanned; floats, sinkers and the heap are seeded."""
 R = rnd(v, 10)
 net = ['#7a4a34', '#96623e', '#b07e52'] if v % 2 else ['#676250', '#817c62', '#9a9578']
 cork = R.choice([['#e0a868', '#b87a44'], ['#e8dcc0', '#b8a888'], ['#c86a4a', '#964434']])
 c = Canvas(46, 34)
 for x in (3, 40): forked_post(c, x, 7, 33)
 timber(c, 0, 5, 45, 7, across=True)
 span, depth, off = R.choice([8, 10, 12]), R.randint(3, 5), R.randint(0, 5)
 bottom = lambda x: 27 - round(depth * abs(((x - 8 + off) % span) / span - .5) * 2)
 mesh = lambda x, y: (x + y + off) % 6 == 0 or (x - y) % 6 == 0
 for x in range(8, 39):
  for y in range(8, bottom(x) + 1):
   c.set(x, y, net[0] if mesh(x, y) else net[2] if (x - 8 + off) % span < 4 else net[1])
 for x in range(9 + off % 3, 38, R.choice([4, 5, 6])): c.rect(x, 8, x + 1, 9, cork[0]); c.set(x + 1, 9, cork[1])
 for x in range(8, 39):
  if bottom(x) == 27 and bottom(x - 1) < 27: c.rect(x - 1, 28, x, 29, STONE[2]); c.set(x, 29, STONE[0])
 hx = R.choice([-8, -3, 0, 2])
 for y, (a, b) in {29: (22, 32), 30: (19, 36), 31: (17, 38), 32: (16, 39), 33: (16, 39)}.items():
  for x in range(a + hx, b + hx + 1): c.set(x, y, net[0] if mesh(x, y) else net[2] if y < 31 else net[1])
 for _ in range(R.randint(2, 4)):
  x, y = R.randint(18, 34) + hx, R.randint(30, 32); c.rect(x, y, x + 1, y + 1, cork[0]); c.set(x + 1, y + 1, cork[1])
 ink(c)
 return c.image()


def shaduf(v=0):
 """0 timber post and staved bucket, 1 hide bucket, 2 mud pillar."""
 R = rnd(v, 11)
 c = Canvas(64, 50)
 disc(c, 54.5, 45.5, 8.6, 4.2, MUD[1]); disc(c, 54.5, 45, 8, 3.4, MUD[2])
 disc(c, 54.5, 45.5, 6.4, 2.6, WATER[0]); disc(c, 54.5, 46, 6, 2.2, WATER[1])
 x = R.randint(50, 55); c.hline(x, x + 3, 46, WATER[3]); c.set(R.randint(56, 58), 47, WATER[2])
 if v % 3 == 2:
  for y in range(15, 50):
   half = 4 + (y - 15) // 12
   for x in range(27 - half, 29 + half): c.set(x, y, MUD[3] if x < 26 - half // 2 else MUD[2] if x < 29 else MUD[1])
   if y % 6 == 3: c.hline(27 - half + 2, 27 + half - 2, y, MUD[1])
  c.rect(25, 12, 26, 15, MUD[3]); c.rect(29, 12, 30, 15, MUD[1])
 else:
  timber(c, 26, 14, 29, 49); c.vline(26, 14, 49, W[4]); c.vline(27, 16, 49, W[3]); c.vline(29, 14, 49, W[0])
  c.vline(25, 11, 14, W[3]); c.vline(30, 11, 14, W[1])
 dip = R.randint(-2, 2)
 limb(c, (6, 25 - dip), (56, 3 + dip), [W[4], W[2], W[1]])
 lash(c, 25, 30, 14, 18)
 wy = 29 - dip
 if R.random() < .5:
  disc(c, 7, wy, 6, 5.5, MUD[1]); disc(c, 6, wy - 1, 4, 3.6, MUD[2]); c.set(4, wy - 3, MUD[3]); c.set(5, wy - 3, MUD[3])
 else:
  disc(c, 7, wy, 6, 5, STONE[1]); disc(c, 6, wy - 1, 4, 3, STONE[2]); c.set(4, wy - 3, STONE[3]); c.set(5, wy - 3, STONE[3])
 for y in range(wy - 5, wy + 6):
  if c.get(7, y): c.set(7 + (y % 2), y, ROPE[0])
 by = 30 + dip + R.randint(0, 3)
 if v % 3 == 1:
  for y in range(by, by + 9):
   half = 3 - (y - by) // 3
   for x in range(55 - half, 56 + half): c.set(x, y, LEATHER[3] if x < 54 else LEATHER[2] if x < 57 else LEATHER[1])
  c.hline(52, 58, by, WD[3])
 else:
  timber(c, 52, by, 58, by + 7, WD); c.vline(58, by, by + 7, WD[0]); c.hline(52, 58, by, WATER[2])
  c.hline(53, 57, by + 8, WD[1]); c.hline(52, 58, by + 3, IRON[2]); c.hline(52, 58, by + 6, IRON[2]); c.set(54, by, WATER[4])
 ink(c)
 c.vline(55, 6 + dip, by - 4, ROPE[1])
 c.line((55, by - 4), (52, by - 1), ROPE[1]); c.line((55, by - 4), (58, by - 1), ROPE[1])
 return c.image()


DYES = [INDIGO, RED, OCHRE, GREEN, ROSE, UMBER, TEAL]


def dye_vats(v=0, m=0):
 """Variant 0 leads with indigo; the rest draw their three baths by seed."""
 R = rnd(v, 12)
 baths = R.sample(DYES, 3)
 if v == 0: baths = [INDIGO, RED, OCHRE]
 c = Canvas(56, 34)
 for y in range(7, 33):
  a = 2 if y in (7, 32) else 1 if y in (8, 31) else 0
  for x in range(1 + a, 55 - a):
   c.set(x, y, MUD[3] if y == 7 else MUD[2] if y < 24 else MUD[1] if y < 31 else MUD[0])
 c.hline(1, 54, 24, MUD[3])
 for _ in range(4): x, y = R.randint(5, 48), R.randint(27, 30); c.hline(x, x + 1, y, MUD[0])
 centres = (10.5, 28, 45.5)
 for t, cx in zip(baths, centres):
  disc(c, cx, 15.6, 8, 5.4, CLAY[1]); disc(c, cx, 15, 8, 5, CLAY[3])
  disc(c, cx, 15, 6.4, 3.8, CLAY[0]); disc(c, cx, 16, 6, 3, t[1])
  c.hline(int(cx) - 4 + (0, 1, 2, 1)[m], int(cx) - 1 + (0, 1, 2, 1)[m], 15, t[2]); c.hline(int(cx) + 1 - (0, 1, 2, 1)[m], int(cx) + 3 - (0, 1, 2, 1)[m], 17, t[2]); c.hline(int(cx) - 5, int(cx) - 2, 11, CLAY[4])
  for _ in range(R.randint(0, 3)):
   x = int(cx) + R.randint(-5, 5); c.vline(x, 25, 25 + R.randint(0, 2), t[1])
 sx = int(R.choice(centres)) + 1
 limb(c, (sx, 15), (sx + R.choice([-6, 5, 6]), 0), [W[4], W[2]])
 for hx in R.sample([16, 34, 4, 46], R.randint(1, 2)):
  t = R.choice(baths)
  cloth(c, hx, 21, R.randint(5, 7), R.randint(8, 10), t); c.hline(hx, hx + 4, 20, t[2])
 ink(c)
 return c.image()


def hitching_post(v=0):
 """0 post and ring, 1 with a mounting block, 2 a rail."""
 R = rnd(v, 13)
 c = Canvas(46, 30)
 rope = lambda x, y, n: [c.set(x + (i % 2 if i > 1 else 0), y + i, ROPE[1 + (i % 2)]) for i in range(n)]
 if v % 3 == 2:
  for x in (5, 37): timber(c, x, 8, x + 3, 29); c.hline(x, x + 3, 7, CUT[1]); c.hline(x + 1, x + 2, 6, CUT[1])
  timber(c, 1, 11, 44, 14, across=True); c.vline(0, 11, 14, CUT[1]); c.vline(45, 11, 14, CUT[1])
  for x in (5, 37): lash(c, x - 1, x + 4, 10, 15)
  ties = R.sample([13, 20, 27, 32], R.randint(1, 2))
  ink(c)
  for x in ties:
   c.rect(x, 10, x + 1, 15, ROPE[1]); c.set(x, 10, ROPE[2]); rope(x + 1, 16, R.randint(4, 9))
 else:
  x0 = 6 if v % 3 == 1 else 20
  timber(c, x0, 5, x0 + 4, 29); c.vline(x0 + 1, 6, 29, W[3]); c.vline(x0 + 4, 5, 29, W[0])
  c.hline(x0, x0 + 4, 4, CUT[1]); c.hline(x0 + 1, x0 + 3, 3, CUT[2])
  c.hline(x0, x0 + 4, 8, IRON[1]); c.hline(x0, x0 + 1, 8, IRON[3])
  if v % 3 == 1:
   for (a, b, top) in ((16, 43, 21), (26, 43, 13)):
    c.rect(a, top, b, 29, STONE[1]); c.rect(a, top, b, top + 3, STONE[3]); c.hline(a, b, top, '#e2e1e6'); c.hline(a, b, top + 4, STONE[2])
    c.vline(b, top + 4, 29, STONE[0])
   for _ in range(5): x, y = R.randint(18, 41), R.randint(19, 28); c.hline(x, x + 2, y, STONE[0]) if c.get(x, y) == STONE[1] else None
   c.set(17, 28, LEAF[1]); c.set(18, 29, LEAF[1]); c.set(17, 27, LEAF[2])
  ink(c)
  rx = x0 + 5
  for dx, dy in ((0, 0), (1, 0), (2, 1), (2, 2), (2, 3), (1, 4), (0, 4), (-1, 3), (-1, 1)): c.set(rx + dx, 9 + dy, IRON[2] if dx < 2 else IRON[1])
  c.set(rx, 9, IRON[3])
  if R.random() < .6:
   c.hline(x0, x0 + 4, 12, ROPE[1]); c.hline(x0, x0 + 4, 13, ROPE[0]); rope(x0 - 1, 13, R.randint(5, 10))
 return c.image()


def skull_post(v=0):
 """0 upswept horns, 1 drooping; ribbons, feathers and cracks seeded."""
 R = rnd(v, 14)
 c = Canvas(40, 44)
 timber(c, 18, 16, 21, 43, WD); c.vline(19, 18, 43, WD[3])
 up = v % 2 == 0
 for s in (-1, 1):
  pts = [(20 + s * 5, 8), (20 + s * 11, 7), (20 + s * 15, 3 if up else 11), (20 + s * 16, 0 if up else 15)]
  for a, b in zip(pts, pts[1:]): limb(c, a, b, [BONE[3], BONE[1]] if s < 0 else [BONE[2], BONE[0]])
  c.set(pts[-1][0], pts[-1][1], '#5a5048')
 for y in range(5, 22):
  half = 6 if y < 11 else 6 - (y - 10) // 3 if y < 19 else 2
  if y == 5: half = 4
  for x in range(20 - half, 20 + half):
   c.set(x, y, BONE[3] if x < 18 and y < 9 else BONE[2] if x < 22 else BONE[1])
 for ex in (15, 22): c.rect(ex, 10, ex + 2, 12, DARK); c.set(ex + 2 if ex < 20 else ex, 10, BONE[1])
 c.vline(19, 17, 20, DARK); c.vline(20, 17, 20, '#5a4a50'); c.hline(18, 21, 21, BONE[1])
 for _ in range(R.randint(1, 3)):
  x, y = R.randint(16, 23), R.randint(6, 9); c.set(x, y, BONE[1]); c.set(x + R.choice([-1, 1]), y + 1, BONE[1])
 lash(c, 17, 22, 23, 26)
 ink(c)
 for _ in range(R.randint(1, 3)):
  t = R.choice([RED, OCHRE, INDIGO, CREAM])
  x, n = R.choice([15, 16, 23, 24, 25]), R.randint(5, 11)
  for i in range(n): c.set(x + (i // 3) % 2, 24 + i, t[1] if i % 3 else t[2])
  if R.random() < .5:                                             # a feather on the end
   c.vline(x, 24 + n, 28 + n, '#f4f0e0'); c.set(x + 1, 25 + n, '#f4f0e0'); c.set(x + 1, 26 + n, '#b8b0a0'); c.set(x, 29 + n, DARK)
 return c.image()


def grindstone(v=0):
 """0 oak frame, 1 dark frame; wear, crank and the water are seeded."""
 R = rnd(v, 15)
 t = WD if v % 2 else W
 c = Canvas(36, 32)
 timber(c, 5, 22, 30, 27, t, across=True); c.rect(7, 22, 28, 23, WATER[1]); c.hline(9, 9 + R.randint(3, 8), 22, WATER[3])
 for x in (6, 27): timber(c, x, 27, x + 2, 31, t)
 for x in (4, 29): timber(c, x, 10, x + 2, 26, t)
 disc(c, 18, 14, 9.6, 9.6, GRIT[1])
 disc(c, 17.4, 13.4, 8.4, 8.4, GRIT[2])
 disc(c, 16, 12, 5, 5, GRIT[3], keep=lambda dx, dy: dx + dy < -2)
 for _ in range(R.randint(3, 6)):
  x, y = R.randint(12, 23), R.randint(8, 20); c.hline(x, x + 1, y, GRIT[1])
 for y in range(5, 24):                                           # worn rim
  for x in range(8, 28):
   if c.get(x, y) == GRIT[1] and (x - 18) + (y - 14) > 6: c.set(x, y, GRIT[0])
 c.rect(17, 13, 19, 15, IRON[1]); c.set(17, 13, IRON[3])
 timber(c, 3, 13, 32, 15, t, across=True) if False else None
 c.hline(20, 32, 14, IRON[2]); c.hline(20, 32, 15, IRON[0])
 up = R.random() < .5
 c.vline(32, 9 if up else 14, 14 if up else 20, IRON[2]); c.vline(33, 9 if up else 14, 14 if up else 20, IRON[0])
 hy = 8 if up else 20
 c.rect(31, hy, 35, hy + 1, t[3]); c.hline(31, 35, hy + 1, t[1])
 ink(c)
 if R.random() < .6: c.set(11, 21, WATER[3]); c.set(10, 19, WATER[4])
 return c.image()


def saddle_stand(v=0):
 """0 red and blue blanket, 1 blue and gold; stripes and tack seeded."""
 R = rnd(v, 16)
 a, b = (INDIGO, OCHRE) if v % 2 else (RED, INDIGO)
 if v > 1: a, b = R.sample([RED, INDIGO, OCHRE, GREEN, CREAM, TEAL], 2)
 c = Canvas(34, 30)
 for x, s in ((6, -1), (26, 1)):
  limb(c, (x, 12), (x + s * 3, 29), [W[3], W[2], W[1]])
 timber(c, 3, 11, 30, 13, across=True); c.vline(2, 11, 13, CUT[1]); c.vline(31, 11, 13, CUT[1])
 stripes = sorted(R.sample(range(11, 22), R.randint(2, 4)))
 for y in range(9, 23):
  for x in range(7, 27):
   col = a[2] if y == 9 else a[1]
   if y in stripes or y - 1 in stripes and R.random() < 0: col = b[1]
   if x == 7: col = a[2] if col == a[1] else b[2]
   if x >= 25: col = a[0] if col in (a[1], a[2]) else b[0]
   c.set(x, y, col)
 for x in range(7, 27, 2): c.set(x, 23, b[1]); c.set(x, 24, b[0])
 for y, (x0, x1) in {3: (10, 13), 4: (9, 14), 5: (9, 24), 6: (9, 25), 7: (10, 25), 8: (10, 24), 9: (11, 23), 2: (21, 25), 3.5: (0, -1), 4.5: (0, -1)}.items():
  if x1 > x0: c.hline(x0, x1, int(y), LEATHER[2])
 c.rect(21, 3, 25, 4, LEATHER[2]); c.hline(10, 13, 3, LEATHER[3]); c.hline(11, 22, 5, LEATHER[3]); c.hline(21, 24, 2, LEATHER[3])
 c.hline(11, 23, 9, LEATHER[1]); c.vline(25, 3, 7, LEATHER[1]); c.vline(14, 6, 8, LEATHER[1])
 ink(c)
 sx = R.choice([13, 15, 18])
 c.vline(sx, 10, 16, LEATHER[1]); c.rect(sx - 1, 17, sx + 1, 19, IRON[2]); c.set(sx, 18, a[1] if 18 not in stripes else b[1]); c.hline(sx - 1, sx + 1, 20, IRON[1])
 return c.image()


def zir(v=0):
 """0 buff, 1 terracotta, 2 red earth; the lid, cup and damp are seeded."""
 R = rnd(v, 17)
 t = [['#6a5838', '#8f7a4c', '#ab9765', '#c4b384', '#dccda6'], CLAY, ['#5a2a22', '#84402e', '#a85c40', '#c8805c', '#e0a888']][v % 3]
 c = Canvas(28, 40)
 for x in (4, 21): timber(c, x, 14, x + 2, 39, WD)
 for x in (8, 18): c.rect(x, 12, x + 1, 30, WD[1])
 revolve(c, 13.5, belly(4, 33, [5, 8, 9.5, 9, 6.5, 3, 1]), t, rimlight=False)
 disc(c, 13.5, 4.5, 5.4, 2, t[4]); disc(c, 13.5, 4.8, 4, 1.2, t[0])
 if R.random() < .6:
  disc(c, 13.5, 3.6, 5.2, 1.8, WD[3]); c.hline(10, 16, 3, WD[4]); c.rect(13, 1, 14, 2, WD[2])
 for _ in range(R.randint(3, 7)):                                 # sweat on the porous clay
  x, y = R.randint(8, 18), R.randint(18, 28)
  if c.get(x, y): c.set(x, y, t[1]); c.set(x, y + 1, t[1])
 timber(c, 3, 19, 24, 21, WD, across=True); timber(c, 3, 30, 24, 31, WD, across=True)
 lash(c, 3, 7, 18, 22); lash(c, 20, 24, 18, 22)
 disc(c, 13.5, 37.5, 4.6, 2.2, t[3]); disc(c, 13.5, 37.3, 3.2, 1.2, WATER[1]); c.set(12, 37, WATER[3])
 ink(c)
 c.set(13, 35, WATER[3])
 if R.random() < .5: c.set(13, 34, WATER[4])
 if R.random() < .5:                                              # a dipper hung on the frame
  c.vline(25, 20, 24, ROPE[1]); c.rect(24, 25, 26, 27, '#c8a060'); c.set(24, 25, '#e8c888'); c.hline(24, 26, 28, '#8a6a34')
 return c.image()


def trip_hammer(v=0):
 """0 plain timber, 1 dark; grain, husks and the tilt are seeded."""
 R = rnd(v, 18)
 t = WD if v % 2 else W
 c = Canvas(60, 30)
 disc(c, 10, 23.5, 9, 5.2, STONE[1]); disc(c, 10, 22.6, 9, 4.6, STONE[3])
 disc(c, 10, 22.6, 6.4, 3, STONE[0]); disc(c, 10, 23.4, 5.6, 2.2, STRAW[2])
 for _ in range(4): c.set(R.randint(6, 14), R.randint(22, 24), STRAW[3])
 timber(c, 37, 12, 39, 28, t); timber(c, 43, 9, 45, 25, [t[0], t[0], t[1], t[2], t[3]])
 tilt = R.randint(0, 3)
 limb(c, (6, 8 + tilt), (57, 24 - tilt), [t[4], t[2], t[2], t[1]])
 timber(c, 8, 9 + tilt, 11, 20, t); c.rect(8, 18, 11, 20, IRON[1]); c.vline(8, 18, 20, IRON[3])
 lash(c, 7, 12, 8 + tilt, 11 + tilt)
 c.rect(36, 15, 46, 16, IRON[1]); c.set(36, 15, IRON[3])
 c.rect(52, 24 - tilt, 58, 25 - tilt, t[3])
 for _ in range(R.randint(3, 6)):
  x = R.randint(18, 30); c.hline(x, x + 1, 28, STRAW[2]); c.set(x, 27, STRAW[3])
 if R.random() < .6:                                              # a winnowing tray of clean grain
  disc(c, 26, 26, 6, 2.8, '#c8a060'); disc(c, 26, 25.6, 4.6, 1.8, STRAW[3]); c.hline(22, 25, 24, '#e8c888')
 ink(c)
 return c.image()


def knapping_floor(v=0):
 """0 flint, 1 obsidian, 2 chert, on a hide; the scatter is seeded."""
 R = rnd(v, 19)
 t = [['#343a48', '#56607a', '#8a94a8', '#c4cad4'], ['#141420', '#2a2a3c', '#5a5a78', '#d8dcf0'], ['#6a3e2e', '#9a6044', '#c48a64', '#e6c09c']][v % 3]
 c = Canvas(38, 22)
 for y in range(5, 21):
  a = 3 if y in (5, 20) else 1 if y in (6, 19) else 0
  for x in range(1 + a, 37 - a): c.set(x, y, HIDE[3] if y < 8 else HIDE[2] if y < 18 else HIDE[1])
 for x in range(3, 35, 3): c.set(x + R.randint(0, 1), R.randint(9, 17), HIDE[1])
 cx = R.randint(10, 16)
 for y, (a, b) in {4: (2, 5), 5: (1, 7), 6: (0, 8), 7: (0, 8), 8: (0, 9), 9: (0, 9), 10: (1, 9), 11: (2, 8), 12: (3, 6)}.items():
  for x in range(cx + a, cx + b + 1): c.set(x, y, t[2] if x - cx < 4 and y < 8 else t[1] if x - cx < 6 else t[0])
 c.hline(cx + 2, cx + 4, 4, t[3]); c.line((cx + 4, 5), (cx + 3, 11), t[0]); c.line((cx + 6, 6), (cx + 7, 10), t[1]); c.set(cx + 2, 6, t[3])
 hx = cx + R.choice([-8, 13, 15])
 disc(c, hx, 11, 3, 2.4, STONE[2]); disc(c, hx - .6, 10.4, 1.6, 1.2, STONE[3]); c.hline(hx - 2, hx + 1, 13, STONE[0])
 ink(c)
 for _ in range(R.randint(7, 12)):
  x, y = R.randint(4, 33), R.randint(12, 18)
  c.set(x, y, t[2]); c.set(x + 1, y, t[1]); c.set(x, y - 1, t[3]) if R.random() < .4 else None
 bx = R.randint(22, 28)
 for i in range(6): c.set(bx + i, 16 - i // 2, t[3] if i < 4 else t[2]); c.set(bx + i, 17 - i // 2, t[0])
 if R.random() < .6:
  ax = R.randint(5, 10); c.line((ax, 18), (ax + 6, 15), BONE[2]); c.line((ax, 19), (ax + 6, 16), BONE[0]); c.set(ax + 3, 15, BONE[2])
 return c.image()


def metate(v=0):
 """0 basalt, 1 brown andesite; the meal, mano and bowl are seeded."""
 R = rnd(v, 20)
 t = ['#4e3a30', '#7a5c48', '#a08264', '#c0a688'] if v % 2 else ['#34343e', '#52525e', '#787886', '#a2a2ae']
 c = Canvas(32, 22)
 for x in (4, 22): c.rect(x, 14, x + 2, 20, t[1]); c.vline(x, 14, 20, t[2]); c.vline(x + 2, 15, 20, t[0])
 c.rect(13, 12, 15, 16, t[0])
 for y in range(5, 15):
  for x in range(1 + (y > 12), 28 - (y > 12)):
   top = y < 11
   c.set(x, y, (t[3] if y == 5 else t[2]) if top else t[1] if y < 13 else t[0])
 disc(c, 14, 8, 10, 2.2, t[1])
 meal = R.choice([['#f0e2b0', '#d0b878'], ['#e8c860', '#b89030'], ['#c86a48', '#964030']])
 mx = R.randint(8, 17)
 disc(c, mx, 8, R.randint(3, 5), 1.6, meal[0]); c.hline(mx - 2, mx + 1, 9, meal[1])
 px = R.randint(4, 14)
 c.rect(px, 4, px + 9, 6, t[2]); c.hline(px, px + 9, 4, t[3]); c.hline(px, px + 9, 7, t[0]); c.vline(px + 9, 4, 6, t[1])
 if R.random() < .7:
  disc(c, 26.5, 18, 4.4, 2.6, CLAY[2]); disc(c, 26.5, 17.4, 4.4, 2, CLAY[3]); disc(c, 26.5, 17.4, 3, 1.2, meal[0]); c.hline(24, 28, 20, CLAY[1])
 ink(c)
 for _ in range(R.randint(2, 5)): c.set(R.randint(3, 24), R.randint(9, 10), meal[0])
 return c.image()


def catch(v=0):
 """0 silver, 1 bronze-backed, 2 dark: a few fish on a cord, as carried."""
 R = rnd(v, 21)
 t = [['#dfe6e6', '#aebbc2', '#7f8e9c'], ['#e8d0a0', '#b88a4a', '#7a5a34'], ['#9aa4b4', '#5e687e', '#3a4054']][v % 3]
 c = Canvas(18, 20)
 c.set(9, 0, ROPE[1]); c.set(8, 1, ROPE[1]); c.set(10, 1, ROPE[1]); c.hline(4, 14, 2, ROPE[1]); c.set(9, 2, ROPE[2])
 for x in sorted(R.sample([4, 9, 14], R.randint(2, 3))): fish(c, x, 3 + R.randint(0, 2), R.randint(7, 10), t)
 return c.image()


def pounding_mortar(v=0):
 """0 oak, 1 walnut with two pestles, 2 pale; grain and lean are seeded."""
 R = rnd(v, 22)
 t = [W, [WD[0], WD[1], WD[2], WD[3], WD[4]], ['#6a5434', '#927848', '#b89c66', '#d8be8a', '#f0dcae']][v % 3]
 c = Canvas(26, 42)
 revolve(c, 12.5, belly(22, 39, [8, 7, 5, 5.5, 7.5, 8]), t, foot=2)
 disc(c, 12.5, 22, 8.4, 3.2, t[4]); disc(c, 12.5, 22.2, 6.4, 2.2, t[0])
 disc(c, 12.5, 23, 5, 1.4, STRAW[2]); c.set(11, 23, STRAW[3]); c.set(14, 22, STRAW[3])
 for i in range(R.randint(1, 3)): c.hline(7, 18, 27 + i * 4, t[1]) if False else None
 c.hline(8, 16, 30, t[1]); c.hline(8, 16, 31, t[4])
 ink(c)
 for k in range(2 if v % 3 == 1 else 1):
  lean = R.choice([-4, -2, 3, 5]) if k == 0 else -R.choice([3, 5]) if lean > 0 else R.choice([3, 5])
  x0, x1 = 12 + k, 12 + k + lean
  limb(c, (x0, 22), (x1, 2), [t[3], t[2], t[1]])
  c.rect(x1 - 1, 0, x1 + 3, 4, t[2]); c.vline(x1 - 1, 0, 4, t[4]); c.vline(x1 + 3, 0, 4, t[0]); c.hline(x1 - 1, x1 + 3, 0, t[4])
  for (x, y) in ((x1 - 2, 1), (x1 - 2, 2), (x1 - 2, 3), (x1 + 4, 1), (x1 + 4, 2), (x1 + 4, 3), (x1, -1), (x1 + 1, -1), (x1 + 2, -1)):
   c.set(x, y, '#3a2420')
 for _ in range(R.randint(2, 6)):
  x = R.choice([R.randint(0, 3), R.randint(21, 24)]); c.set(x, 40, STRAW[3]); c.set(x + 1, 41, STRAW[2])
 return c.image()


def _helve(c, x, y0, y1, R):
 c.vline(x, y0, y1, W[3]); c.vline(x + 1, y0, y1, W[1])
 for y in R.sample(range(y0 + 3, y1 - 3), 2): c.set(x, y, W[2])
 c.set(x, y0, W[4])


def rake(v=0):
 """0 wooden head, 1 rusted iron teeth, 2 fine-toothed. Head down."""
 R = rnd(v, 23)
 c = Canvas(20, 38)
 tooth = [W[1], RUST[1], W[1]][v % 3]
 step = 2 if v % 3 == 2 else 3
 _helve(c, 9, 1, 30, R)
 limb(c, (5, 30), (9, 24), [W[2]]); limb(c, (14, 30), (10, 24), [W[1]])
 timber(c, 1, 30, 18, 32, across=True)
 ink(c)
 for x in range(2, 18, step): c.vline(x, 33, 36, tooth); c.set(x, 33, RUST[2] if v % 3 == 1 else W[3])
 for _ in range(R.randint(0, 3)): c.set(R.randint(1, 18), 37, STRAW[2])
 return c.image()


def pitchfork(v=0):
 """0 three tines, 1 four tines, 2 rusted. Tines down."""
 R = rnd(v, 24)
 c = Canvas(24, 38)
 m = [IRON[3], IRON[2], IRON[1]] if v % 3 != 2 else [RUST[2], RUST[1], RUST[0]]
 _helve(c, 11, 1, 24, R)
 if R.random() < .5: c.hline(9, 14, 1, W[2]); c.hline(9, 14, 0, W[4])
 c.rect(11, 24, 12, 26, m[1])
 xs = (7, 11, 16) if v % 3 != 1 else (6, 10, 13, 17)
 c.hline(xs[0], xs[-1], 27, m[1]); c.hline(xs[0], xs[-1] - 1, 26, m[0])
 for x in xs: c.vline(x, 27, 36, m[1]); c.set(x, 28, m[0]); c.set(x, 37, m[2])
 ink(c)
 return c.image()


YARD = {
 'drying-rack': drying_rack, 'trough': trough, 'chopping-block': chopping_block,
 'washing-line': washing_line, 'hide-frame': hide_frame, 'wash-tub': wash_tub, 'plough': plough,
 'scarecrow': scarecrow, 'fishing-nets': fishing_nets, 'shaduf': shaduf, 'dye-vats': dye_vats,
 'hitching-post': hitching_post, 'skull-post': skull_post, 'grindstone': grindstone,
 'saddle-stand': saddle_stand, 'zir': zir, 'trip-hammer': trip_hammer,
 'knapping-floor': knapping_floor, 'metate': metate, 'catch': catch,
 'pounding-mortar': pounding_mortar, 'rake': rake, 'pitchfork': pitchfork,
}
