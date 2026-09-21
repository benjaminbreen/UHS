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
 """A log lying across the view, lit along its top, a cut face at each end
 seen slightly from the side."""
 for x in range(x0, x1 + 1):
  for y in range(int(cy - half), int(cy + half) + 1):
   t = (y + .5 - cy) / half
   if abs(t) > 1: continue
   tone = 5 if t < -0.6 else 4 if t < -0.1 else 3 if t < 0.45 else 2 if t < 0.8 else 1
   if jitter(x // 3, y) % 6 == 0: tone -= 1
   c.set(x, y, b[max(tone, 1)])
 for ex in (x0, x1):
  for y in range(int(cy - half), int(cy + half) + 1):
   for dx in (0, 1) if ex == x1 else (-1, 0):
    t = (y + .5 - cy) / half
    if abs(t) <= 1:
     c.set(ex + dx, y, cut[3] if t < -0.3 else cut[2] if t < 0.4 else cut[1])
  c.set(ex, int(cy), cut[0])                          # the heart of the wood


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
 """A flat boulder to sit on, dragged up to the fire."""
 c = Canvas(20, 14)
 w, h = [(8.5, 4.2), (7.5, 3.8), (9, 3.4)][v]
 block(c, 10, 6, w, h, 3, STONE, v)
 if v == 1:                                           # a hide thrown over it
  hide = ['#4a3322', '#6b4a30', '#8c6644', '#a9835c', '#c4a07a']
  blob(c, [(10, 5.5, 5.5, 2.6)], hide)
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


HIDE = [['#4a3322', '#6b4a30', '#8c6644', '#a9835c', '#c4a07a', '#dcc09a'],
        ['#2e2019', '#46302a', '#5f4436', '#7b5a46', '#96735a', '#b08c70'],
        ['#6a5c48', '#8c7c62', '#ad9c7e', '#c9b99a', '#dfd2b4', '#efe6cc']]


def hide_frame(v=0, layer='all'):
 """A hide laced into a pole frame to dry and scrape. The frame stands; the
 hide, on its lacing, takes the wind."""
 c = Canvas(34, 38)
 w = RAMPS[WOOD7[2 if v == 1 else 0]]
 h = HIDE[v]
 x0, x1, y0, y1 = 4, 29, 4, 34
 if layer != 'hang':
  for x in (x0, x1):                                  # the uprights, into the ground
   c.vline(x, y0 - 2, y1 + 3, w[4]); c.vline(x + 1, y0 - 2, y1 + 3, w[2])
  for y in (y0, y1 - 6):                              # the crossbars
   c.hline(x0 - 2, x1 + 3, y, w[5]); c.hline(x0 - 2, x1 + 3, y + 1, w[2])
  for x, y in [(x0, y0), (x1, y0), (x0, y1 - 6), (x1, y1 - 6)]:
   c.set(x - 1, y + 2, RAMPS['rope'][3]); c.set(x + 2, y - 1, RAMPS['rope'][1])
 if layer != 'frame':
  # The hide: the animal's outline, stretched square by the lacing.
  hx, hy = 16.5, 16.5
  for y in range(y0 + 3, y1 - 8):
   t = (y - (y0 + 3)) / (y1 - 11 - y0)
   half = 8.5 + 1.8 * sin(pi * t) - (2.5 if 0.15 < t < 0.3 or 0.7 < t < 0.85 else 0)
   for x in range(int(hx - half), int(hx + half) + 1):
    u = (x + .5 - hx) / half
    tone = 4 if u < -0.3 else 3 if u < 0.5 else 2
    if jitter(x, y) % 9 == 0: tone += 1 if tone < 5 else -1
    if v == 2 and jitter(x // 3, y // 3) % 5 == 0: tone = 1  # a dappled coat
    c.set(x, y, h[tone])
  for y in range(y0 + 4, y1 - 9, 3):                  # the lacing to the uprights
   c.hline(x0 + 2, int(hx - 9), y, RAMPS['rope'][2])
   c.hline(int(hx + 9), x1 - 1, y + 1, RAMPS['rope'][1])
 return c.image()


def knapping_floor(v=0):
 """Where someone sits to knap: a sitting stone, a core and a hammerstone,
 and a spray of flakes on the trodden ground."""
 c = Canvas(26, 14)
 flint = [['#1d1f24', '#2f333b', '#4a505c', '#6f7684', '#9aa1ad'],
          ['#0e0d10', '#1c1a20', '#2c2932', '#48434f', '#7b7488'],
          ['#3a2518', '#5a3a24', '#7c5634', '#a07650', '#c49c74']][v]
 block(c, 6, 6, 5, 2.6, 2, STONE, 1)                 # the sitting stone
 blob(c, [(15, 8.5, 3.2, 2.2)], flint)               # the core
 blob(c, [(20.5, 9.5, 1.8, 1.4)], STONE[1:])          # the hammerstone
 for k in range(14):
  x = 11 + (jitter(k, v) % 14); y = 6 + (jitter(v, k) % 7)
  if c.get(x, y): continue
  c.set(x, y, flint[4] if k % 3 == 0 else flint[3])
  if k % 4 == 0: c.set(x + 1, y, flint[2])
 return c.image()


def warp_loom(v=0):
 """A warp-weighted loom: two posts and a beam, cloth growing down from the
 top, the warp held taut by rows of clay weights."""
 c = Canvas(34, 40)
 w = RAMPS[WOOD7[1]]
 cloth = [['#5e5440', '#7e7358', '#9e9272', '#bdb18e', '#d6cba8'],
          ['#5a2a20', '#7c3a2a', '#9c5038', '#b86a4c', '#cf8a68'],
          ['#3c4a52', '#51646c', '#6c8088', '#8a9ca2', '#aabbbf']][v]
 for x in (3, 29):                                    # the uprights
  c.vline(x, 2, 39, w[4]); c.vline(x + 1, 2, 39, w[2])
 c.hline(1, 32, 4, w[5]); c.hline(1, 32, 5, w[3]); c.hline(1, 32, 6, w[1])  # cloth beam
 c.hline(5, 28, 25, w[4]); c.hline(5, 28, 26, w[1])  # shed rod
 for y in range(7, 17):                               # the woven cloth
  for x in range(6, 28):
   c.set(x, y, cloth[3] if (x + y) % 2 else cloth[2])
   if y in (10, 11): c.set(x, y, cloth[4] if x % 2 else cloth[1])
 c.hline(6, 27, 17, cloth[1])
 for x in range(6, 28):                               # the warp, down to the weights
  for y in range(18, 33):
   if (x % 2 == 0) or y < 25: c.set(x, y, '#d8cfb4' if x % 2 == 0 else '#b2a98f')
 for k, x in enumerate(range(7, 28, 3)):              # the loom weights
  y = 33 + (k % 2)
  blob(c, [(x, y + 1, 1.6, 1.8)], CLAY[1:])
  c.set(x, y, CLAY[0])
 return c.image()


def grain_pit(v=0):
 """A storage pit: a clay-sealed mouth with a stone or wicker lid."""
 c = Canvas(24, 12)
 earth = ['#2e2218', '#44332a', '#5e4838', '#7a5f48', '#95785c']
 for y in range(1, 12):
  for x in range(0, 24):
   u, t = (x + .5 - 12) / 11, (y + .5 - 6.5) / 5
   r = u * u + t * t
   if r <= 1: c.set(x, y, earth[3] if r > 0.6 else earth[2] if t < 0 else earth[1])
 if v == 1:                                           # a wicker lid
  w = RAMPS['wicker7']
  for y in range(3, 10):
   for x in range(4, 20):
    u, t = (x + .5 - 12) / 7.5, (y + .5 - 6) / 3.2
    if u * u + t * t <= 1: c.set(x, y, w[5] if (x + y) % 3 == 0 else w[4] if x % 2 else w[3])
 else:                                                # a flat stone, sealed with clay
  for y in range(3, 10):
   for x in range(4, 20):
    u, t = (x + .5 - 12) / 7.8, (y + .5 - 6) / 3.4
    if u * u + t * t <= 1: c.set(x, y, BUFF[5] if u * u + t * t > 0.75 else BUFF[4])
  block(c, 12, 5.5, 6, 2.6, 1, STONE, v)
 soft_outline(c, earth[1], earth[3])
 return c.image()


def skull_post(v=0):
 """A post set up by a gate or a shrine, carrying a cattle skull."""
 c = Canvas(24, 34)
 w = RAMPS[WOOD7[1]]
 c.vline(11, 10, 33, w[4]); c.vline(12, 10, 33, w[2]); c.vline(13, 12, 33, w[1])
 bone = ['#3f392e', '#645c4a', '#8a8068', '#aaa084', '#c4ba9c', '#d8cfb2']
 blob(c, [(12, 11, 4.2, 5.2), (12, 5.5, 5, 3)], bone)  # the skull
 for x in (10, 14): c.set(x, 9, '#1d1814'); c.set(x, 10, '#2b241d')  # eye sockets
 c.set(11, 14, '#3a3226'); c.set(13, 14, '#3a3226')
 horn = ['#2a241c', '#4e4432', '#7a6b4c', '#a8976e', '#cdbf97']
 for side in (-1, 1):                                 # the horns
  for i in range(10):
   x = 12 + side * (5 + i); y = 5 - round(4 * sin(i / 9 * pi * 0.9)) + (2 if v == 1 else 0) * (i > 6)
   c.set(x, y, horn[3] if i < 7 else horn[4]); c.set(x, y + 1, horn[1])
 soft_outline(c, bone[1], bone[3])
 grass(c, [(9, 33, 3), (15, 33, 2)])
 return c.image()


def shaduf(v=0):
 """A shaduf: a sweep pole on a post frame, a mud counterweight on the
 short end and a bucket on its rope over the water."""
 c = Canvas(50, 48)
 w = RAMPS[WOOD7[0]]
 mud = ['#3a2c1e', '#54402c', '#6e573c', '#8a7050', '#a58a66']
 for x in (18, 26):                                   # the two posts and the pivot
  c.vline(x, 18, 47, w[4]); c.vline(x + 1, 18, 47, w[2])
  if v == 2:                                          # plastered mud pillars
   c.rect(x - 1, 30, x + 2, 47, mud[3]); c.vline(x - 1, 30, 47, mud[4])
 c.hline(17, 28, 18, w[5]); c.hline(17, 28, 19, w[2])
 # The sweep: long end up over the water, short end down with the weight.
 ax, ay, bx, by = 4, 34, 46, 8
 n = bx - ax
 for i in range(n + 1):
  x = ax + i; y = round(ay + (by - ay) * i / n)
  c.set(x, y, w[4]); c.set(x, y + 1, w[1])
 blob(c, [(5, 36, 4.2, 3.6)], mud)                    # the counterweight
 for y in range(9, 30): c.set(46, y, RAMPS['rope'][2] if y % 2 else RAMPS['rope'][1])
 bucket = RAMPS['buffclay7'] if v != 1 else HIDE[0] + ['#e8d6b4']
 blob(c, [(46, 32, 3, 2.6)], bucket)                  # the bucket
 c.hline(44, 48, 30, bucket[1])
 return c.image()


def zir(v=0):
 """A zir: the big porous water jar on its wooden stand, sweating to cool
 the water, a dish beneath to catch the drip."""
 c = Canvas(22, 34)
 w = RAMPS[WOOD7[1]]
 clay = [RAMPS['buffclay7'], RAMPS['terracotta7'], RAMPS['redearth7']][v]
 for x in (4, 17):                                    # the stand's legs
  c.vline(x, 20, 33, w[4]); c.vline(x + 1, 20, 33, w[1])
 c.hline(3, 19, 22, w[5]); c.hline(3, 19, 23, w[2])
 prof = belly(3, 27, [6.2, 8.4, 9.0, 8.4, 6.6, 3.8, 1.4])
 revolve(c, 11, prof, clay)
 for y in range(1, 5):                                # the mouth
  for x in range(4, 19):
   u, t = (x + .5 - 11) / 5.2, (y + .5 - 3) / 1.7
   r = u * u + t * t
   if r <= 1: c.set(x, y, clay[5] if r > 0.5 and t < 0 else clay[3] if r > 0.5 else clay[0])
 for k in range(4):                                   # the sweat on its skin
  c.set(8 + k * 3, 12 + (k % 2) * 5, clay[1])
 c.set(11, 29, RAMPS['water'][4]); c.set(11, 30, RAMPS['water'][3])
 blob(c, [(11, 32, 4.4, 1.5)], clay)                  # the drip dish
 c.hline(9, 13, 32, RAMPS['water'][3])
 return c.image()


def pipe_hive(v=0):
 """Egyptian hives: clay pipes laid on their sides and stacked in a mud
 bank, the round ends toward us, each with its small flight hole."""
 c = Canvas(34, 26)
 mud = ['#3a2c1e', '#54402c', '#6e573c', '#8a7050', '#a58a66', '#bfa47e']
 pipe = ['#4a3422', '#6e5036', '#957050', '#b8936c', '#d2b08a']
 cols = 4 if v != 1 else 3
 top, rows = 6, (3 if v != 2 else 2)
 x0, x1 = 2, 2 + cols * 7 + 3
 y1 = top + rows * 6 + 2
 for y in range(top - 4, top):                        # the top of the bank
  for x in range(x0 + 1, x1):
   c.set(x, y, mud[5] if y == top - 4 else mud[4] if (x + y) % 5 else mud[3])
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
 'hide-frame': hide_frame,
 'knapping-floor': knapping_floor,
 'warp-loom': warp_loom,
 'grain-pit': grain_pit,
 'skull-post': skull_post,
 'shaduf': shaduf,
 'zir': zir,
 'pipe-hive': pipe_hive,
}
