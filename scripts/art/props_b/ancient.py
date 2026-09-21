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


def hide_frame(v=0, layer='all'):
 """A hide laced into a pole frame to dry and be scraped: two posts, a
 top bar it hangs from, a lower bar its hind legs are tied to."""
 c = Canvas(40, 40)
 w = RAMPS[WOOD7[2 if v == 0 else 0]]
 h = HIDE[v]
 # Frame behind the hide.
 _post(c, 3, 3, 39, w, knots=(14, 27))
 _post(c, 34, 3, 39, w, knots=(10, 22))
 _bar(c, 1, 38, 5, w)
 _bar(c, 4, 36, 31, w)
 mask = _hide_mask(v)
 for (x, y), d in mask.items():
  u = (x + .5 - 20) / 12
  t = (y + .5 - 19) / 13
  # Lit from the upper left; the stretched middle is flattest and brightest,
  # the edges curl and darken.
  tone = 5 - (1 if d > 0.6 else 0) - (1 if u > 0.4 else 0) - (1 if t > 0.55 else 0) + (1 if u < -0.2 and t < -0.1 and d < 0.6 else 0)
  if v == 2 and jitter(x, y // 2, 7) % 9 == 0 and d < 0.7: tone -= 2        # the dapple
  if jitter(x // 4, y // 3, 3) % 5 == 0: tone -= 1                             # uneven drying
  if abs(x + .5 - 20) < 1 and 10 < y < 28: tone -= 1                          # the spine
  if (x * 7 + y * 3) % 17 == 0: tone -= 1                                      # scraping marks
  c.set(x, y, h[max(1, min(6, tone))])
 for (x, y) in mask:                                   # its edge, in its own dark
  for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
   if (x + dx, y + dy) not in mask: c.set(x + dx, y + dy, h[0])
 # Ties from the legs to the frame, and the pegs it hangs from.
 r = RAMPS['rope']
 for (lx, ly), (px, py) in [((9, 11), (6, 11)), ((31, 11), (33, 11)), ((10, 28), (6, 30)), ((30, 28), (33, 30))]:
  n = max(abs(px - lx), abs(py - ly), 1)
  for i in range(n + 1):
   c.set(round(lx + (px - lx) * i / n), round(ly + (py - ly) * i / n), r[2])
 for px in (15, 20, 25):
  c.set(px, 7, INK); c.set(px, 8, h[0])
 _lash(c, 3, 5); _lash(c, 34, 5)
 grass(c, [(1, 40, 3), (37, 40, 2)])
 return c.image()


def knapping_floor(v=0):
 """Where someone knaps: a hide laid on the ground to catch the waste, a
 core half worked, an antler billet and a hammerstone beside it, finished
 blades laid in a row, and a scatter of flakes past the hide's edge."""
 c = Canvas(34, 20)
 flint = [['#15171b', '#262a31', '#3b414c', '#56606e', '#7d8796', '#a8b1bd'],
          ['#0b0a0d', '#17151a', '#26232b', '#3c3844', '#5e5868', '#8d869a'],
          ['#2a1a10', '#44291a', '#633f26', '#845a37', '#a57b52', '#c49e76']][v]
 hide = HIDE[1]
 for y in range(4, 18):                               # the hide
  for x in range(3, 29):
   u, t = (x + .5 - 16) / 12.5, (y + .5 - 11) / 6.4
   d = abs(u) ** 2.6 + abs(t) ** 2.6 + (jitter(x, y) % 4) * 0.04
   if d > 1: continue
   tone = 4 if d < 0.5 and u < 0.2 else 3 if d < 0.85 else 2
   if (x * 5 + y * 3) % 13 == 0: tone -= 1
   c.set(x, y, hide[tone])
 blob(c, [(12, 10.5, 3.6, 2.8)], flint)              # the core, flakes off one face
 for x, y in [(11, 9), (13, 9), (10, 11)]: c.set(x, y, flint[5])
 for k in range(4):                                   # blades in a row
  x = 18 + k * 2
  for y in range(8, 13):
   c.set(x, y + (k % 2), flint[4] if y < 10 else flint[3])
  c.set(x, 7 + (k % 2), flint[5])
 bone = ['#3f392e', '#645c4a', '#8a8068', '#aaa084', '#c4ba9c', '#d8cfb2']
 for i in range(8):                                   # the antler billet
  c.set(6 + i, 14 - i // 3, bone[4]); c.set(6 + i, 15 - i // 3, bone[2])
 c.set(9, 11, bone[4]); c.set(9, 10, bone[3])         # a tine
 blob(c, [(24.5, 14.5, 2.2, 1.6)], WARMSTONE[1:])     # the hammerstone
 for k in range(22):                                  # waste, thickest near the core
  r = 3 + (jitter(k, v, 9) % 13)
  a = jitter(v, k, 4) / 97 * 6.283
  x = int(12 + r * 1.3 * cos(a)); y = int(11 + r * 0.55 * sin(a))
  if 0 <= x < 34 and 0 <= y < 20 and c.get(x, y) not in (flint[1], flint[2], flint[3]):
   c.set(x, y, flint[5] if k % 3 == 0 else flint[4])
 return c.image()


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


def skull_post(v=0):
 """A post by a gate or a shrine carrying an aurochs skull, weathered grey,
 the horns sweeping out and forward."""
 c = Canvas(30, 36)
 w = RAMPS[WOOD7[1]]
 _post(c, 13, 12, 35, w, knots=(20, 29))
 bone = ['#2f2a22', '#4d463a', '#6e6654', '#8f8670', '#aca38a', '#c3baa0', '#d6cfb6']
 # The skull: broad brow, narrowing to the muzzle, seen from a little above.
 for y in range(5, 20):
  t = (y - 5) / 14
  half = 5.2 - 2.4 * t ** 1.4
  for x in range(int(14.5 - half), int(14.5 + half) + 1):
   u = (x + .5 - 14.5) / half
   tone = 5 if u < -0.2 and t < 0.5 else 4 if u < 0.4 else 3
   if t > 0.7: tone -= 1
   c.set(x, y, bone[tone])
 for x in (12, 16):                                   # the orbits, deep
  c.set(x, 9, bone[0]); c.set(x + 1, 9, bone[1]); c.set(x, 10, bone[1])
 c.vline(14, 12, 17, bone[3]); c.set(13, 18, bone[1]); c.set(15, 18, bone[1])  # nasal line
 horn = ['#1f1a14', '#3e3527', '#62553c', '#8a7a58', '#b1a07a', '#cdbd97']
 for side in (-1, 1):                                 # horns: up, out, then forward
  for i in range(12):
   x = 14.5 + side * (5 + i * 0.95)
   y = 6 - 3.2 * sin(i / 11 * pi * (0.8 if v != 1 else 0.55)) + (i > 8) * (i - 8) * (0.6 if v == 1 else -0.2)
   thick = 2 if i < 7 else 1
   for k in range(thick):
    c.set(x, y + k, horn[4 - (i > 8)] if k == 0 else horn[2])
  c.set(14.5 + side * 16.4, 6 - 3.2 * sin(pi * 0.8) - 1, horn[5])
 soft_outline(c, bone[1], bone[3])
 c.hline(12, 17, 4, bone[6])
 grass(c, [(11, 36, 3), (17, 36, 2)])
 return c.image()


def shaduf(v=0):
 """A shaduf: a sweep pole pivoting on a crossbar between two posts, a mud
 counterweight on the short end, a bucket on its rope over the water."""
 c = Canvas(54, 50)
 w = RAMPS[WOOD7[0]]
 mud = ['#2e2218', '#4a3828', '#654e36', '#806648', '#9b7f5c', '#b39770']
 for x in (19, 28):                                   # the uprights
  if v == 2:                                          # mud-brick pillars
   for y in range(24, 50):
    for xx in range(x - 2, x + 4):
     c.set(xx, y, mud[4] if xx < x else mud[3] if xx < x + 2 else mud[2])
     if (y + (xx // 3) * 2) % 5 == 0: c.set(xx, y, mud[1])
   c.hline(x - 2, x + 3, 23, mud[5])
  _post(c, x, 18, 49, w)
 _bar(c, 17, 32, 19, w)                               # the pivot bar
 # The sweep: two pixels thick, lit along its top, long end high over the water.
 ax, ay, bx, by = 5, 36, 50, 7
 n = bx - ax
 for i in range(n + 1):
  x = ax + i; y = round(ay + (by - ay) * i / n)
  c.set(x, y - 1, INK); c.set(x, y, w[5]); c.set(x, y + 1, w[3]); c.set(x, y + 2, INK)
 _lash(c, 25, 19)
 blob(c, [(6, 38.5, 5.2, 4.4)], mud)                  # the counterweight, lumpy
 for x, y in [(4, 36), (8, 37), (6, 40)]: c.set(x, y, mud[1])
 r = RAMPS['rope']
 for y in range(8, 32): c.set(50, y, r[3] if y % 2 else r[1])
 bucket = HIDE[1] if v == 1 else ['#2d1a13', '#4a2a1c', '#6b3f27', '#8d5836', '#ab7149', '#c58f63', '#dcb086']
 blob(c, [(50, 35, 3.6, 3.0)], bucket)
 for x in range(47, 54):                              # its mouth, seen from above
  c.set(x, 32, bucket[5] if x < 51 else bucket[3]); c.set(x, 33, bucket[1])
 c.set(50, 36, RAMPS['water'][4]); c.set(50, 38, RAMPS['water'][3])
 return c.image()


def zir(v=0):
 """A zir: the big porous water jar standing in the ring of its wooden
 stand, sweating to cool the water, a dish beneath to catch the drip."""
 c = Canvas(24, 32)
 w = RAMPS[WOOD7[1]]
 clay = [RAMPS['buffclay7'], RAMPS['terracotta7'], RAMPS['redearth7']][v]
 for x in (4, 18):                                    # the back legs
  c.vline(x + 1, 16, 29, w[2])
 prof = belly(3, 25, [6.6, 8.6, 9.4, 9.0, 7.4, 4.6, 1.8])
 revolve(c, 12, prof, clay)
 for y in range(1, 6):                                # the thick rolled mouth
  for x in range(3, 22):
   u, t = (x + .5 - 12) / 6.6, (y + .5 - 3.4) / 1.9
   r = u * u + t * t
   if r <= 1: c.set(x, y, clay[6] if r > 0.55 and t < 0 and u < 0.3 else clay[4] if r > 0.55 else clay[0] if t < 0.3 else clay[1])
 for k, (x, y) in enumerate([(8, 11), (14, 9), (11, 15), (16, 14), (9, 19)]):  # the sweat
  c.set(x, y, clay[2]); c.set(x, y + 1, clay[1])
 soft_outline(c, clay[1], clay[3])
 for x in (3, 19):                                    # the front legs and the ring
  _post(c, x, 15, 29, w)
 _bar(c, 3, 21, 15, w)
 c.set(12, 26, RAMPS['water'][5]); c.set(12, 28, RAMPS['water'][4])
 blob(c, [(12, 30.5, 4.6, 1.5)], clay)                # the drip dish
 c.hline(10, 14, 30, RAMPS['water'][3])
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
