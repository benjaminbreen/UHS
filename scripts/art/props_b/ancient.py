"""Seats for the big fires, and the yard things of early farming and the
ancient world that the later kit lacks. ~17 source pixels to a metre."""
from math import cos, pi, sin
from .core import Canvas, RAMPS, blob, revolve, belly, soft_outline, grass, jitter
from .workshop import WOOD7, streak
from .fire import block, STONE

BARK = ['#231a14', '#3b2c20', '#57402c', '#735739', '#8f6f4a', '#aa8a60']
CUT = ['#6e5236', '#9a7a54', '#c2a276', '#dcc195']
CLAY = ['#2d1a13', '#4a2a1c', '#6b3f27', '#8d5836', '#ab7149', '#c58f63', '#dcb086']
BUFF = RAMPS['buffclay7']


def _log_x(c, x0, x1, cy, half, b=BARK, cut=CUT):
 """A log lying across the view, lit along its top, bark furrows running
 along it, the near end sawn and showing its rings."""
 ex = max(2, round(half * 0.6))
 for y in range(int(cy - half), int(cy + half) + 1):
  t = (y + .5 - cy) / half
  if abs(t) > 1: continue
  inset = round(ex * 0.8 * (1 - (1 - t * t) ** .5))
  tone = 5 if t < -0.6 else 4 if t < -0.1 else 3 if t < 0.45 else 2 if t < 0.8 else 1
  for x in range(x0 + inset, x1 + 1):
   c.set(x, y, b[tone])
  if int(y - cy) % 2 == 0 and -0.6 < t < 0.8:
   x = x0 + 2 + jitter(y) % 3
   while x < x1 - ex - 2:
    n = 3 + jitter(x, y) % 4
    for k in range(min(n, x1 - ex - 1 - x)): c.set(x + k, y, b[max(tone - 2, 0)])
    c.set(x + 1, y - 1, b[min(tone + 1, 5)])
    x += n + 2 + jitter(y, x) % 4
 for y in range(int(cy - half), int(cy + half) + 1):
  for x in range(x1 - ex, x1 + ex + 1):
   u, t = (x + .5 - x1) / (ex + .4), (y + .5 - cy) / (half + .4)
   e = u * u + t * t
   if e > 1: continue
   col = (b[1] if u + t > 0.3 else b[3]) if e > 0.62 else cut[0] if e < 0.05 else cut[1] if 0.2 < e < 0.32 else cut[3] if u + t < -0.35 else cut[2]
   c.set(x, y, col)


def seat_log(v=0):
 """0: a log rolled up to the fire. 1: a split log on two stubs, flat side
 up. 2: a stump, stood on end."""
 if v == 2:
  c = Canvas(14, 16)
  w = RAMPS[WOOD7[1]]
  prof = belly(5, 14, [5.2, 5.4, 5.6, 6.0])
  revolve(c, 7, prof, BARK, foot=1)
  for y in range(2, 8):                               # the cut top
   for x in range(0, 14):
    u, t = (x + .5 - 7) / 5.4, (y + .5 - 5) / 2.6
    r = u * u + t * t
    if r > 1: continue
    c.set(x, y, CUT[1] if r > 0.7 else CUT[3] if (int(r * 6) % 2 == 0) else CUT[2])
  c.set(7, 5, CUT[0])
  soft_outline(c, BARK[1], BARK[3])
  return c.image()
 c = Canvas(30, 14)
 if v == 1:
  for x in (5, 24):                                   # the stubs
   c.rect(x - 1, 8, x + 2, 13, BARK[2]); c.vline(x - 1, 8, 13, BARK[3])
  for x in range(1, 29):                              # the split face, up
   c.set(x, 5, CUT[3]); c.set(x, 6, CUT[2] if x % 5 else CUT[1])
   c.set(x, 7, BARK[3]); c.set(x, 8, BARK[2]); c.set(x, 9, BARK[1])
  streak(c, 2, 27, 6, CUT + [CUT[3], CUT[3], CUT[3]], 2)
  for y in range(5, 10): c.set(0, y, CUT[2]); c.set(29, y, CUT[1])
 else:
  _log_x(c, 2, 27, 9, 4.2)
 soft_outline(c, BARK[1], BARK[3])
 return c.image()


def seat_stone(v=0):
 """A flat boulder dragged up to the fire, worn smooth on top where people
 sit. One has a hide thrown over it."""
 c = Canvas(20, 14)
 w, h = [(8.2, 3.6), (7.4, 3.4), (8.8, 3.0)][v]
 block(c, 10, 6, w, h, 3, WARMSTONE, v)
 for x in range(int(10 - w * 0.5), int(10 + w * 0.2)):  # the worn seat
  c.set(x, 5, WARMSTONE[6])
 if v == 1:
  hide = HIDE[1]
  for y in range(2, 9):
   for x in range(4, 17):
    u, t = (x + .5 - 10) / 6.4, (y + .5 - 5.2) / 3.2
    if u * u + t * t <= 1 + (jitter(x, y) % 3) * 0.08:
     c.set(x, y, hide[5] if t < -0.2 and u < 0.2 else hide[4] if u < 0.5 else hide[3])
  c.set(4, 9, hide[3]); c.set(16, 9, hide[2])        # the legs hanging down
 return c.image()


def seat_mat(v=0):
 """A pandanus mat laid on the ground, seen from above."""
 c = Canvas(24, 12)
 ramps = [['#6a5a36', '#8c7a4c', '#ad9a66', '#c9b884'],
          ['#5e4a2a', '#826a3e', '#a58b56', '#c2ab76'],
          ['#6a5a36', '#8c7a4c', '#ad9a66', '#c9b884']]
 r = ramps[v]
 for y in range(2, 11):
  for x in range(1, 23):
   k = (x + y) % 4 == 0 or (x - y) % 4 == 0
   c.set(x, y, r[3] if k else r[2] if (x + y) % 2 else r[1])
 if v == 2:                                           # a dyed band
  for x in range(1, 23): c.set(x, 5, '#7b3a26'); c.set(x, 7, '#7b3a26')
 c.hline(1, 22, 10, r[0]); c.vline(22, 2, 10, r[0])
 return c.image()


HIDE = [['#2f261c', '#5e5040', '#83745c', '#a09078', '#b8a98e', '#cabda2', '#dcd0b6'],   # scraped, flesh side
        ['#241810', '#4a3020', '#6b4630', '#8a5e40', '#a67854', '#bf9068', '#d4a882'],   # cattle, hair on
        ['#2e2418', '#5a4632', '#806448', '#a3835f', '#bf9f78', '#d6b994', '#e8d0ae']]   # deer, dappled
INK = '#22170f'


def _post(c, x, top, bottom, w, knots=()):
 """A peeled pole, three pixels thick: lit edge, body, shaded edge, then a
 dark keyline down the right."""
 for y in range(top, bottom + 1):
  c.set(x - 1, y, INK); c.set(x, y, w[5]); c.set(x + 1, y, w[4]); c.set(x + 2, y, w[2]); c.set(x + 3, y, INK)
 c.hline(x, x + 2, top - 1, INK)
 for ky in knots:
  c.set(x + 1, ky, w[2]); c.set(x + 2, ky, w[1])
 c.set(x + 1, top, w[5]); c.set(x + 2, top, w[3])     # the cut top


def _bar(c, x0, x1, y, w):
 for x in range(x0, x1 + 1):
  c.set(x, y - 1, INK); c.set(x, y, w[5]); c.set(x, y + 1, w[3]); c.set(x, y + 2, w[1]); c.set(x, y + 3, INK)
 c.vline(x0 - 1, y, y + 2, INK); c.vline(x1 + 1, y, y + 2, INK)
 c.set(x0, y + 1, w[4]); c.set(x1, y + 1, w[2])       # the cut ends


def _lash(c, x, y, r=RAMPS['rope']):
 """Rope wound over a joint: three turns, the top one lit."""
 for k, yy in enumerate(range(y - 1, y + 3)):
  for xx in range(x - 1, x + 4):
   c.set(xx, yy, r[3] if (xx + yy + k) % 3 == 0 else r[2] if k < 2 else r[1])


def _hide_mask(v):
 """A pegged-out hide: a squarish body stretched between the posts, the
 neck at the top bar, forelegs pulled out to the posts, hind legs hanging.
 Edges wander a pixel, as a hide does."""
 parts = [(20, 7.6, 2.4, 1.8), (11.4, 10.0, 2.8, 1.8), (28.6, 10.0, 2.8, 1.8),
          (13.2, 28.6, 2.2, 2.8), (26.8, 28.6, 2.2, 2.8), (20, 29.8, 1.2, 1.8)]
 mask = {}
 for y in range(6, 33):
  for x in range(7, 34):
   u, t = (x + .5 - 20) / 9.2, (y + .5 - 18.2) / 10.6
   best = abs(u) ** 3 + abs(t) ** 3                   # a squarish body
   for cx, cy, rx, ry in parts:
    best = min(best, ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2)
   edge = (jitter(x, y, v) % 5) * 0.05
   if best <= 0.9 + edge: mask[(x, y)] = best
 return mask


def warp_loom(v=0):
 """A warp-weighted loom: two posts and a beam, cloth growing down from the
 top, the warp held taut by rows of clay weights."""
 c = Canvas(34, 40)
 w = RAMPS[WOOD7[1]]
 cloth = [['#5e5440', '#7e7358', '#9e9272', '#bdb18e', '#d6cba8'],
          ['#5a2a20', '#7c3a2a', '#9c5038', '#b86a4c', '#cf8a68'],
          ['#3c4a52', '#51646c', '#6c8088', '#8a9ca2', '#aabbbf']][v]
 for x in (2, 29):                                    # the uprights
  _post(c, x, 2, 39, w, knots=(18, 31))
 _bar(c, 0, 33, 4, w)                                 # the cloth beam
 for y in range(7, 17):                               # the woven cloth
  for x in range(6, 28):
   c.set(x, y, cloth[3] if (x + y) % 2 else cloth[2])
   if y in (10, 11): c.set(x, y, cloth[4] if x % 2 else cloth[1])
 c.hline(6, 27, 17, cloth[1])
 for x in range(6, 28):                               # the warp, down to the weights
  for y in range(18, 33):
   if (x % 2 == 0) or y < 25: c.set(x, y, '#d8cfb4' if x % 2 == 0 else '#b2a98f')
 _bar(c, 5, 28, 24, w)                                # the shed rod
 for k, x in enumerate(range(7, 28, 3)):              # the loom weights
  y = 33 + (k % 2)
  blob(c, [(x, y + 1, 1.7, 1.9)], BUFF)
  c.set(x, y + 1, BUFF[0])                             # the hole the warp runs through
 return c.image()


EARTH = ['#1f1710', '#33261b', '#4a3828', '#624b35', '#7b6045', '#957958', '#ae926e']
WARMSTONE = ['#2a2620', '#403a31', '#5c5447', '#766d5d', '#918776', '#aba190', '#c3baa8']
CLAYCAP = ['#2a2016', '#46382a', '#62503c', '#7c684e', '#958062', '#ab9676', '#bfab8a']


def _paste(c, im, x, y):
 """Lay a finished sprite into a canvas, its foot at (x, y)."""
 px = im.load()
 ox, oy = x - im.width // 2, y - im.height
 for j in range(im.height):
  for i in range(im.width):
   r, g, b, a = px[i, j]
   if a > 200: c.set(ox + i, oy + j, '#%02x%02x%02x' % (r, g, b))


def _apron(c, cx, cy, rx, ry):
 """Trodden clay round the pits, lighter where feet have packed it."""
 for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   u, t = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   d = u * u + t * t + (jitter(x // 2, y) % 7) * 0.02
   if d > 1: continue
   tone = 4 if d < 0.5 else 3 if d < 0.85 else 2
   if jitter(x, y // 2) % 11 == 0: tone -= 1
   if jitter(x // 3, y, 5) % 13 == 0: tone += 1
   c.set(x, y, EARTH[tone])


def _rim(c, cx, cy, rx, ry):
 """The pit's lip: packed clay, lit along the near edge where it catches
 the sun, dark along the far edge where it drops away."""
 for y in range(int(cy - ry) - 2, int(cy + ry) + 3):
  for x in range(int(cx - rx) - 2, int(cx + rx) + 3):
   u, t = (x + .5 - cx) / (rx + 1.2), (y + .5 - cy) / (ry + 1.0)
   if u * u + t * t > 1: continue
   c.set(x, y, EARTH[5] if t > 0.35 and u < 0.3 else EARTH[4] if t > -0.3 else EARTH[3])


def _open_pit(c, cx, cy, rx, ry):
 """An open pit: the far wall in bands of subsoil, the near wall hidden,
 the dark coming up from the bottom, a little grain left on the floor."""
 _rim(c, cx, cy, rx, ry)
 from math import hypot
 for y in range(int(cy - ry), int(cy + ry) + 1):
  for x in range(int(cx - rx), int(cx + rx) + 1):
   X, Y = x + .5 - cx, y + .5 - cy
   if hypot(X / rx, Y / ry) > 1: continue
   t = (Y / ry + 1) / 2                               # 0 far lip, 1 near lip
   if t < 0.58:                                       # the far wall, in strata
    band = int(t * 12)
    col = [EARTH[4], EARTH[3], '#8a6a3e', EARTH[3], EARTH[2], '#6e5230', EARTH[2], EARTH[1]][min(band, 7)]
    if jitter(x, y) % 9 == 0: col = EARTH[1]
   else:
    k = min(int((t - 0.58) * 9), 3)
    col = ['#1a130d', '#140f0a', '#0f0b08', '#0b0806'][k]
    if t > 0.62 and abs(X) < rx * 0.4 and (x + y) % 2: col = '#6b5424' if k < 2 else col
   c.set(x, y, col)


def _sealed_pit(c, cx, cy, rx, ry):
 """A pit sealed for the winter: a low dome of clay daubed over it,
 cracked as it dried, a flat stone set on top to mark it."""
 _rim(c, cx, cy, rx, ry)
 blob(c, [(cx, cy - 1.2, rx + 0.6, ry + 1.4)], CLAYCAP)
 for k in range(5):                                   # drying cracks
  x0 = int(cx - rx * 0.6 + k * rx * 0.3); y0 = int(cy - 1 + (k % 2))
  c.set(x0, y0, CLAYCAP[2]); c.set(x0 + 1, y0 + 1, CLAYCAP[2])
 for k, (px, py) in enumerate([(-4, 1), (3, 1.5), (-1, 2.2), (5, -0.5)]):   # pebbles pressed in
  blob(c, [(cx + px, cy + py - 1.5, 1.3, 0.9)], WARMSTONE[2:])


def _wicker_pit(c, cx, cy, rx, ry):
 """A pit in use, under a wicker lid weighted with two stones."""
 _rim(c, cx, cy, rx, ry)
 w = RAMPS['wicker7']
 for y in range(int(cy - ry) - 1, int(cy + ry) + 1):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   u, t = (x + .5 - cx) / (rx + .8), (y + .5 - cy + .6) / (ry + .6)
   d = u * u + t * t
   if d > 1: continue
   ring = int(d ** 0.5 * 5)                           # coiled, not criss-crossed
   tone = 5 if (ring % 2 == 0) else 3
   if (x + ring * 2) % 4 == 0: tone -= 1
   if u > 0.3: tone -= 1
   if d > 0.8: tone = 2
   c.set(x, y, w[max(1, tone)])
 blob(c, [(cx - rx * 0.45, cy - 0.8, 2.2, 1.5)], WARMSTONE[1:])
 blob(c, [(cx + rx * 0.4, cy + 0.5, 1.9, 1.3)], WARMSTONE[1:])


def grain_pit(v=0):
 """A village's storage pits, dug together in a patch of trodden clay:
 one sealed, one open and being emptied, one under a wicker lid."""
 from .vessels import open_basket
 c = Canvas(66, 32)
 _apron(c, 33, 17, 32, 13)
 order = [('sealed', 13, 15), ('open', 34, 12), ('wicker', 53, 17)]
 if v == 1: order = [('wicker', 13, 15), ('sealed', 34, 12), ('open', 53, 17)]
 if v == 2: order = [('open', 13, 15), ('wicker', 34, 12), ('sealed', 53, 17)]
 for kind, x, y in sorted(order, key=lambda o: o[2]):
  {'sealed': _sealed_pit, 'open': _open_pit, 'wicker': _wicker_pit}[kind](c, x, y, 8.5, 4.4)
 # Spilled grain, and the basket it is being carried off in.
 for k in range(9):
  x = 24 + jitter(k, v) % 18; y = 19 + jitter(v, k) % 6
  if c.get(x, y) in EARTH: c.set(x, y, '#c9a24a' if k % 2 else '#a88234')
 _paste(c, open_basket(v % 3), 24 if v != 1 else 44, 30)
 return c.image()


def pipe_hive(v=0):
 """Egyptian hives: clay pipes laid on their sides and stacked in a mud
 bank, the round ends toward us, each with its small flight hole."""
 c = Canvas(34, 32)
 mud = ['#3a2c1e', '#54402c', '#6e573c', '#8a7050', '#a58a66', '#bfa47e']
 pipe = ['#4a3422', '#6e5036', '#957050', '#b8936c', '#d2b08a']
 cols = 4 if v != 1 else 3
 top, rows = 12, (3 if v != 2 else 2)
 x0, x1 = 2, 2 + cols * 7 + 3
 y1 = top + rows * 6 + 2
 for y in range(top - 10, top):                       # the top of the bank, a pipe's length deep
  for x in range(x0 + (y == top - 10), x1 + 1 - (y == top - 10)):
   c.set(x, y, mud[4] if y == top - 10 else mud[5] if y == top - 1 else mud[4] if jitter(x, y) % 6 else mud[3])
 for k in range(5):
  x, y = x0 + 3 + jitter(k, 7) % (x1 - x0 - 5), top - 8 + jitter(k, 9) % 6
  c.set(x, y, mud[2]); c.set(x + 1, y, mud[3])
 c.rect(x0, top, x1, y1, mud[2])                      # the face
 for x in range(x0, x1 + 1):
  if jitter(x) % 4 == 0: c.set(x, top + 1 + jitter(x, 1) % (y1 - top - 1), mud[1])
 for r in range(rows):
  for k in range(cols - (r % 2 == 1 and v == 1)):
   px = x0 + 5 + k * 7 + (3 if r % 2 else 0)
   if px > x1 - 3: continue
   py = top + 3 + r * 6
   for y in range(py - 3, py + 4):
    for x in range(px - 3, px + 4):
     u, t = (x + .5 - px) / 3.2, (y + .5 - py) / 3.2
     d = u * u + t * t
     if d > 1: continue
     c.set(x, y, pipe[4] if d > 0.55 and (u + t) < -0.2 else pipe[3] if d > 0.55 else pipe[1] if d > 0.18 else '#140d08')
 c.hline(x0, x1, y1 + 1, mud[1])
 soft_outline(c, mud[1], mud[3])
 return c.image()


ANCIENT = {
 'seat-log': seat_log,
 'seat-stone': seat_stone,
 'seat-mat': seat_mat,
 'warp-loom': warp_loom,
 'grain-pit': grain_pit,
 'pipe-hive': pipe_hive,
}
