"""Everyday goods by period: the clutter that dates a yard at a glance.

Sizes at about 22 px to the metre (the adult is 37 px). Shading is banded by
form with one upper-left light and no noise; boxes show their top straight
back with at most two pixels of drift, as the buildings do.
"""
from math import cos, sin, pi, sqrt
from .core import Canvas, RAMPS, belly, revolve, revolve_x, soft_outline

COALSACK = ['#16130f', '#231d17', '#342a20', '#463829', '#5a4834', '#6f5b42', '#877255']
OLIVE = ['#171a10', '#252b18', '#353d22', '#4a542e', '#606c3b', '#7b874d', '#9aa466']
RED = ['#240b0b', '#431312', '#661d19', '#8a2a21', '#ab3d2c', '#c75a3f', '#e0835e']
SAND = ['#2e2618', '#4a3e27', '#6a5a39', '#8b784c', '#a99461', '#c4b07c', '#ddcc9e']
PAPER = ['#3a3a3c', '#5b5a58', '#7f7c76', '#a29e95', '#c1bdb1', '#dad5c7', '#efeadc']
PINE = ['#2f2418', '#4b3a24', '#6c5634', '#8d7348', '#ab905e', '#c6ad7a', '#ddc89c']
BIRCH = ['#2a2624', '#4a4541', '#77716a', '#a39d93', '#c7c2b6', '#e0dccf', '#f1eee4']
FRAMES = [['#101114', '#1b1d22', '#2a2d34', '#3d414a', '#575c66', '#7a808a', '#a4a9b0'],
          ['#0d1d15', '#153223', '#1f4a33', '#2b6445', '#3f805a', '#5f9e75', '#8cc19b'],
          RED]


def _ink(p, dark=False):
 return p[0] if dark else p[1]


def _box(c, x0, yb, w, h, d, p, dr=2, planks=3, lit=4):
 """A case seen square on: planked front, the top receding d rows with dr of
 drift, and the sliver of right side that drift uncovers."""
 top = yb - h + 1
 for i in range(1, d + 1):                        # top, far edge palest
  s = round(i * dr / d)
  for x in range(x0 + s, x0 + w + s):
   c.set(x, top - i, p[min(6, lit + 2)] if i == d else p[min(6, lit + 1)])
  for y in range(top - i + 1, yb - i + 1):       # right side
   c.set(x0 + w - 1 + s, y, p[lit - 2])
 for y in range(top, yb + 1):
  k = (y - top) % planks
  tone = lit if k else lit + 1
  if k == planks - 1 or y == yb: tone = lit - 1
  for x in range(x0, x0 + w):
   t = tone
   if x == x0: t = min(t + 1, 6)
   if x >= x0 + w - 2: t = max(t - 1, 0)
   c.set(x, y, p[t])
 return top


def _ball(c, cx, cy, rx, ry, p, lo=1, hi=5, flat_bottom=None):
 """Lambert on an ellipsoid, quantised to hard bands: no dither."""
 for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
  if flat_bottom is not None and y > flat_bottom: continue
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   u, v = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   r2 = u * u + v * v
   if r2 > 1: continue
   nz = sqrt(1 - r2)
   lam = max(0.0, -0.55 * u - 0.62 * v + 0.56 * nz)
   c.set(x, y, p[lo + min(hi - lo, int(lam * (hi - lo + 0.9)))])


def _circle(c, cx, cy, r, col, lit=None):
 for a in range(0, 360, 4):
  t = a * pi / 180
  x, y = round(cx + cos(t) * r), round(cy + sin(t) * r)
  c.set(x, y, lit if lit and 150 < a < 290 else col)


def stencil_crate(v=0):
 """A 19th-century shipping case: pine boards, corner battens, a merchant's
 mark and a port stencilled on the front."""
 c = Canvas(19, 16)
 p = [PINE, RAMPS['oak7'], RAMPS['ash7']][v]
 top = _box(c, 0, 15, 17, 11, 3, p, planks=4)
 for x in (0, 1, 15, 16):                         # corner battens
  c.vline(x, top, 15, p[5] if x == 0 else p[4] if x == 1 else p[2])
 ink = '#1b1712' if v != 1 else '#d8cfb4'
 if v == 2:                                       # tea chest: tin edge strips
  for x in range(0, 17): c.set(x, top, '#9aa4a6'); c.set(x, 15, '#606a6d')
  mark = [(5, 7), (6, 6), (7, 5), (8, 6), (9, 7), (8, 8), (7, 9), (6, 8), (7, 7),
          (11, 6), (11, 7), (11, 8), (12, 6), (12, 8), (13, 6), (13, 7), (13, 8)]
 else:                                            # a diamond mark and two bars
  mark = [(8, 6), (7, 7), (9, 7), (6, 8), (10, 8), (7, 9), (9, 9), (8, 10), (8, 8),
          (4, 12), (5, 12), (6, 12), (10, 12), (11, 12), (12, 12)]
 for x, y in mark: c.set(x, y + (1 if v == 2 else 0), ink)
 soft_outline(c, p[0], p[3])
 return c.image()


def pallets(v=0):
 """Sawn-timber pallets, stacked: the loading yard after 1950."""
 c = Canvas(28, 17)
 p = PINE
 if v == 1: p = ['#2a2724', '#403c37', '#5a554d', '#766f64', '#918a7c', '#aaa293', '#c3bcac']
 n = [3, 4, 2][v]
 yb = 16
 for k in range(n):
  b = yb - k * 3
  for x in range(0, 26):                          # bottom board and deck
   c.set(x, b, p[2])
   c.set(x, b - 2, p[5] if x < 20 else p[4])
  for x in range(0, 26):                          # the fork gaps between blocks
   c.set(x, b - 1, p[3] if x in (0, 1, 12, 13, 24, 25) else p[0])
  for x in range(1, 26, 4): c.set(x + 3, b - 2, p[3])   # deck board joins
 t = yb - n * 3 + 1
 for i in range(1, 3):                            # the top deck, seen from above
  for x in range(i // 2, 26 + i // 2): c.set(x, t - i, p[6] if (x - i // 2) % 4 else p[4])
 if v == 2:                                       # a load of cement sacks
  s = RAMPS['linen7']
  for k, x0 in enumerate((1, 9, 17)):
   _ball(c, x0 + 4, t - 5, 4.4, 3.2, s, lo=2, hi=6, flat_bottom=t - 3)
   _ball(c, x0 + 4 + (k % 2) * 2 - 1, t - 9, 4.2, 2.8, s, lo=2, hi=6, flat_bottom=t - 7)
 soft_outline(c, p[0], p[3])
 return c.image()


def jerrycans(v=0):
 """Two twenty-litre cans, pressed steel with the embossed X and three
 handles: a Second World War shape that never went away."""
 c = Canvas(18, 13)
 p = [OLIVE, RED, SAND][v]
 for n, (x0, yb) in enumerate(((0, 12), (9, 12))):
  q = p if n == 0 else p[1:] + p[-1:]
  for y in range(yb - 9, yb + 1):
   for x in range(x0, x0 + 8):
    t = 4 if x < x0 + 2 else 3 if x < x0 + 6 else 2
    if y == yb: t = 1
    c.set(x, y, q[t])
  for i in range(6):                              # the embossed X
   for x, lit in ((x0 + 1 + i, 5), (x0 + 6 - i, 1)):
    c.set(x, yb - 7 + i + (1 if i > 2 else 0), q[lit])
  for x in range(x0, x0 + 8): c.set(x, yb - 9, q[5])
  for hx in (x0 + 2, x0 + 4, x0 + 6):             # three handles
   c.set(hx, yb - 10, q[4]); c.set(hx, yb - 11, q[5] if hx < x0 + 5 else q[3])
  c.set(x0 + 1, yb - 10, q[2]); c.set(x0, yb - 11, q[3]); c.set(x0 + 1, yb - 11, q[4])  # spout
 soft_outline(c, p[0], p[3])
 return c.image()


def coal_sacks(v=0):
 """The coalman's hundredweight sacks, stood open at a door, black with dust."""
 c = Canvas(24, 17)
 p = COALSACK
 spots = ((4.5, 16, 4.6, 11), (19.5, 16, 4.4, 10), (12, 16, 5.0, 12))[v == 1:]
 for cx, b, rx, tall in spots:
  top = b - tall
  for y in range(top, b + 1):
   t = (y - top) / tall
   half = rx * (0.68 + 0.32 * sin(min(t, 0.8) / 0.8 * pi / 2))   # slumps wide at the foot
   if y >= b - 1: half -= b - y + 1 if y == b else 0.5
   for x in range(int(cx - half), int(cx + half) + 1):
    u = (x + .5 - cx) / half
    if abs(u) > 1: continue
    tone = 5 if -0.7 < u < -0.3 else 4 if u < 0.1 else 3 if u < 0.65 else 2
    if t > 0.85: tone -= 1
    c.set(x, y, p[tone])
  hw = int(rx * 0.68)
  for x in range(int(cx) - hw, int(cx) + hw + 1):   # rolled hem, coal heaped above
   c.set(x, top, p[6] if x < cx else p[4])
   c.set(x, top - 1, '#0e0d10' if (x * 3) % 4 else '#434753')
   if abs(x - cx) < hw - 1: c.set(x, top - 2, '#1b1b20' if x % 2 else '#5d6a78')
   if abs(x - cx) < 1.5: c.set(x, top - 3, '#0e0d10')
  c.vline(int(cx + rx * 0.4), top + 3, b - 2, p[2])   # a crease
 if v == 2:                                       # a spill at the foot
  for x, y in ((21, 16), (22, 16), (23, 16), (22, 15), (1, 16)): c.set(x, y, '#141216')
 soft_outline(c, p[0], p[3])
 return c.image()


def newspapers(v=0):
 """Bundles of the day's papers, string-tied, dropped at a door or kiosk."""
 c = Canvas(16, 13)
 p = PAPER if v != 2 else ['#3e3a30', '#5f5847', '#837a62', '#a49a7d', '#c1b795', '#d9d0ae', '#ece5c6']
 bundles = [(0, 12, 13), (1, 8, 12), (0, 4, 13)][:3 - (v == 1)]
 for x0, yb, w in bundles:
  for y in range(yb - 3, yb + 1):
   for x in range(x0, x0 + w):
    t = 5 if y == yb - 3 else 4 if (y - yb) % 2 else 3   # folded edges, row by row
    if x >= x0 + w - 2: t -= 1
    c.set(x, y, p[t])
  c.vline(x0 + w // 2, yb - 3, yb, '#7a5a34')      # the string
 x0, yb, w = bundles[-1]
 for i in range(1, 3):                            # the top page, with its columns
  for x in range(x0 + 1, x0 + w + 1):
   c.set(x, yb - 3 - i, p[6] if (x - x0) % 4 else p[3])
 c.hline(x0 + 2, x0 + 7, yb - 5, '#2a2a2c')        # the masthead
 c.vline(x0 + w // 2 + 1, yb - 5, yb - 4, '#7a5a34')
 soft_outline(c, p[1], p[3])
 return c.image()


def bicycle(v=0):
 """A roadster on its stand: 1.8 m long, 70 cm wheels."""
 c = Canvas(36, 21)
 f = FRAMES[v]
 tyre, rim = '#16171b', '#b9c1c2'
 r, gy = 7, 13
 for cx in (7, 28):
  _circle(c, cx, gy, r, tyre)
  _circle(c, cx, gy, r - 1, rim if cx == 7 else '#8d969a', lit='#dfe5e4')
  for a in range(0, 180, 45):                     # spokes, thin enough to see through
   t = a * pi / 180
   c.line((cx - cos(t) * 5, gy - sin(t) * 5), (cx + cos(t) * 5, gy + sin(t) * 5), '#7d878a')
  c.set(cx, gy, f[5])
 bb, seat, head = (16, 14), (13, 5), (25, 5)
 for a, b in ((bb, seat), (bb, head), (seat, head), (bb, (7, gy)), (seat, (7, gy)), (head, (28, gy))):
  c.line(a, b, f[3])
 for a, b in ((seat, head),):                     # the top tube catches the light
  c.line((a[0], a[1] - 1), (b[0], b[1] - 1), f[5])
 c.hline(10, 15, 3, '#2a1f18'); c.hline(11, 14, 2, '#5b4332')   # saddle
 c.vline(13, 3, 4, f[2])
 c.vline(26, 1, 5, f[2]); c.hline(23, 28, 1, '#8d969a'); c.set(23, 1, '#16171b')   # bars
 _circle(c, bb[0], bb[1], 2, '#6d7274')
 c.line((bb[0], bb[1] - 2), (7, gy - 1), '#3c4145')  # chain
 for x in range(3, 11): c.set(x, gy - r - 1, f[4])  # mudguard
 c.line((16, 15), (19, 20), '#525759')             # the stand
 soft_outline(c, '#101114', f[4])
 return c.image()


def handcart(v=0):
 """A two-wheeled barrow pushed by its shafts: the costermonger's, the
 builder's, the rag-and-bone man's. About 1.4 m long."""
 c = Canvas(31, 20)
 w = RAMPS[['oak7', 'ash7', 'walnut7'][v]]
 gy, r = 14, 5
 for x in range(0, 9):                            # the shafts, to the left
  c.set(x, 8 + x // 5, w[4]); c.set(x, 9 + x // 5, w[2])
 c.set(0, 8, w[5])
 _box(c, 8, 12, 21, 4, 2, w, dr=1, planks=2)       # the bed and a low side
 for x in (8, 15, 22, 28): c.vline(x, 9, 12, w[2])
 _circle(c, 17, gy, r, '#1d2023')                 # an iron-tyred wheel
 _circle(c, 17, gy, r - 1, w[2], lit=w[4])
 for a in range(0, 180, 30):
  t = a * pi / 180
  c.line((17 - cos(t) * 3, gy - sin(t) * 3), (17 + cos(t) * 3, gy + sin(t) * 3), w[3])
 c.set(17, gy, '#525759')
 c.vline(27, 13, 19, w[2]); c.vline(28, 13, 19, w[1])   # the prop leg
 c.vline(9, 13, 18, w[3])
 if v == 0:                                       # a load of sacks
  s = RAMPS['burlap7']
  _ball(c, 13, 6, 4.2, 3.2, s, lo=2, hi=6, flat_bottom=8)
  _ball(c, 21, 6, 4.4, 3.4, s, lo=2, hi=6, flat_bottom=8)
 elif v == 1:                                     # crates of greens
  _box(c, 11, 8, 7, 4, 1, w, dr=1, planks=5, lit=5)
  _box(c, 19, 8, 7, 4, 1, w, dr=1, planks=5, lit=5)
  for x in range(12, 26, 2):
   if x not in (18,): c.set(x, 3, '#4b8f38'); c.set(x + 1, 3, '#77b64a')
 soft_outline(c, w[0], w[3])
 return c.image()


def _amph(c, cx, b, p, dim=0.0):
 revolve(c, cx, belly(b - 17, b - 4, [3.0, 4.6, 4.8, 3.6, 2.0, 1.1]), p, base=dim)
 for y in range(b - 21, b - 17):                   # the neck
  c.set(int(cx) - 1, y, p[5]); c.set(int(cx), y, p[4]); c.set(int(cx) + 1, y, p[2])
 c.hline(int(cx) - 1, int(cx) + 1, b - 22, p[6])
 for y in range(b - 3, b + 1): c.set(int(cx), y, p[2])   # the toe


def _handles(c, cx, b, p):
 """Drawn over the outline, so the neck shows through the loop."""
 for dx in (-1, 1):
  hx = int(cx) + dx * 3
  c.set(int(cx) + dx * 2, b - 21, p[5] if dx < 0 else p[3])
  c.vline(hx, b - 21, b - 18, p[5] if dx < 0 else p[2])


def amphora_stack(v=0):
 """Transport jars at a warehouse or shop wall, stood toe-down in sand."""
 p = RAMPS[['terracotta7', 'buffclay7', 'redearth7'][v]]
 c = Canvas(26, 24)
 xs = (4, 12, 20) if v != 2 else (7, 17)
 for k, cx in enumerate(xs):
  _amph(c, cx, 22, p)
 for x in range(0, 26):                           # the sand they are bedded in
  c.set(x, 23, '#b39c55' if x % 5 else '#96803f'); c.set(x, 22, '#cdb975' if 2 < x < 24 else '#b39c55')
 soft_outline(c, p[0], p[3])
 for cx in xs: _handles(c, cx, 22, p)
 return c.image()


def hurdle(v=0):
 """A wattle hurdle: hazel rods woven round split sails, pitched to pen sheep
 or close a gap. Neolithic to the twentieth century on the same pattern."""
 c = Canvas(32, 19)
 w = [['#2a2014', '#43341f', '#5f4b2d', '#7c663e', '#998152', '#b39c6a', '#cbb888'],
      ['#26241f', '#3c3932', '#57534a', '#747066', '#908b80', '#aba69a', '#c4c0b4'],
      ['#2a2014', '#43341f', '#5f4b2d', '#7c663e', '#998152', '#b39c6a', '#cbb888']][v]
 sails = list(range(1, 31, 5))
 for x in sails:                                  # sails, pointed at the foot
  c.vline(x, 1, 16, w[4]); c.vline(x + 1, 1, 16, w[2])
  c.set(x, 17, w[3]); c.set(x, 0, w[5])
 for row, y in enumerate(range(2, 15, 2)):
  if v == 2 and row == 3: continue                # a rod gone: an old hurdle
  for x in range(0, 32):
   seg = sum(1 for s in sails if s <= x)
   front = (seg + row) % 2 == 0
   onsail = any(s <= x <= s + 1 for s in sails)
   if onsail and not front: continue
   bow = 0 if onsail else 1 if (x % 5) in (3, 4) and front else 0
   c.set(x, y + bow, w[5] if front else w[3])
   c.set(x, y + 1 + bow, w[3] if front else w[1])
 soft_outline(c, w[0], w[3])
 return c.image()


def log_pile(v=0):
 """Roundwood with the bark on, laid in a pyramid: the fuel of a camp or a
 first village before anyone split and corded it."""
 c = Canvas(30, 15)
 bark = [RAMPS['darkwood'] + ['#c7a37a'], BIRCH, RAMPS['oak7']][v]
 cut = RAMPS['palewood']
 rows = (5, 4, 3, 3, 2, 1)                        # bark tone, row by row down a log
 logs = ((2, 26, 9), (0, 20, 9), (15, 29, 9), (5, 23, 4), (13, 27, 4), (8, 22, -1))
 for x0, x1, top in logs:
  for k, t in enumerate(rows):
   for x in range(x0, x1 + 1):
    tone = t
    if v == 1 and k in (2, 3) and x % 5 == 2: tone = 0        # birch lenticels
    if v != 1 and k in (1, 2, 3) and (x * 3 + k * 5) % 7 == 0: tone = max(0, t - 2)
    c.set(x, top + k, bark[tone])
  for k, col in enumerate((cut[4], cut[5], cut[4], cut[2], cut[3], cut[2])):
   c.set(x0, top + k, col); c.set(x0 + 1, top + k, cut[5] if 0 < k < 5 else bark[2])
  c.set(x0 + 1, top + 2, cut[2]); c.set(x0 + 1, top + 3, cut[1])   # the heart
 soft_outline(c, bark[0], bark[3])
 return c.image()


GOODS = {
 'stencil-crate': stencil_crate,
 'pallets': pallets,
 'jerrycans': jerrycans,
 'coal-sacks': coal_sacks,
 'newspapers': newspapers,
 'bicycle': bicycle,
 'handcart': handcart,
 'amphora-stack': amphora_stack,
 'hurdle': hurdle,
 'log-pile': log_pile,
}
