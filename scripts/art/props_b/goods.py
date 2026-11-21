"""Everyday goods by period: the clutter that dates a yard at a glance.

Sizes at about 22 px to the metre (the adult is 37 px). Shading is banded by
form with one upper-left light and no noise; boxes show their top straight
back with at most two pixels of drift, as the buildings do.
"""
from math import cos, sin, pi, sqrt
from .core import Canvas, RAMPS, belly, revolve, revolve_x, soft_outline, draw_grid, ramp_keys
from .solid import K, disc, lathe, log_x

COALSACK = ['#16130f', '#231d17', '#342a20', '#463829', '#5a4834', '#6f5b42', '#877255']
OLIVE = ['#171a10', '#252b18', '#353d22', '#4a542e', '#606c3b', '#7b874d', '#9aa466']
RED = ['#240b0b', '#431312', '#661d19', '#8a2a21', '#ab3d2c', '#c75a3f', '#e0835e']
SAND = ['#2e2618', '#4a3e27', '#6a5a39', '#8b784c', '#a99461', '#c4b07c', '#ddcc9e']
PAPER = ['#3a3a3c', '#5b5a58', '#7f7c76', '#a29e95', '#c1bdb1', '#dad5c7', '#efeadc']
PINE = ['#2f2418', '#4b3a24', '#6c5634', '#8d7348', '#ab905e', '#c6ad7a', '#ddc89c']
BIRCH = ['#2a2624', '#4a4541', '#77716a', '#a39d93', '#c7c2b6', '#e0dccf', '#f1eee4']


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
 """Sawn-timber pallets, stacked: the loading yard after 1950. 1.2 by 1 m,
 so the top deck runs well back."""
 p = PINE
 if v == 1: p = ['#2a2724', '#403c37', '#5a554d', '#766f64', '#918a7c', '#aaa293', '#c3bcac']
 n = [3, 4, 2][v]
 W, D = 26, 11
 c = Canvas(W + 2, n * 3 + D + (9 if v == 2 else 2))
 yb = c.h - 1
 for k in range(n):
  b = yb - k * 3
  c.hline(1, W, b, p[2])
  for x in range(1, W + 1): c.set(x, b - 1, p[3] if x - 1 in (0, 1, 12, 13, 24, 25) else p[0])
  c.hline(1, W, b - 2, p[4]); c.set(W, b - 2, p[3])
 t = yb - n * 3 + 1
 for y in range(t - D, t):
  for x in range(1, W + 1):
   gap = (t - 1 - y) % 3 == 2
   c.set(x, y, p[1] if gap else p[6] if y == t - 1 else p[5] if (x // 9 + y) % 4 else p[4])
 c.hline(1, W, t - D, p[3])
 for y in range(t - D + 1, t, 3):
  for x in (2, 13, 25): c.set(x, y, p[2])
 if v == 2:
  s = RAMPS['linen7']
  for k, (x0, y0) in enumerate(((2, t - 5), (13, t - 5), (7, t - 1))):
   _ball(c, x0 + 6, y0 - 3, 5.4, 3.4, s, lo=2, hi=6)
   c.hline(x0 + 3, x0 + 9, y0 - 3, s[3])
 soft_outline(c, p[0], p[3])
 return c.image()


JERRYCAN = [
 ".......65.",
 ".66.66.54.",
 ".4.34.34..",
 "4566666654",
 "5666666653",
 "3444444432",
 "4644444462",
 "4564444632",
 "4546446432",
 "4544664432",
 "4544664432",
 "4546446432",
 "4564444632",
 "4644444462",
 "3333333321",
 "2222222211",
]


def jerrycans(v=0):
 """Two twenty-litre cans, pressed steel with the embossed X and three
 handles along the top: a Second World War shape that never went away."""
 p = [OLIVE, RED, SAND][v]
 c = Canvas(22, 19)
 draw_grid(JERRYCAN, ramp_keys(p[1:] + p[-1:]), c, (11, 1))
 draw_grid(JERRYCAN, ramp_keys(p), c, (1, 2))
 soft_outline(c, p[0], p[3])
 return c.image()


def coal_sacks(v=0):
 """The coalman's hundredweight sacks stood open at a door, coal heaped in
 the rolled mouth: seen from above, the mouth is most of the drawing."""
 p = COALSACK
 c = Canvas(28, 22)
 spots = [((6, 15), (20, 15), (13, 20)), ((9, 19), (18, 20)), ((6, 15), (20, 15), (13, 20))][v]
 for cx, by in spots:
  lathe(c, cx, by, [(0, 4.6), (2, 5.2), (7, 4.8), (10, 4.2)], p[1:],
        lambda z, a, i: i - (abs(a - .9) < .12) + (z > 9.4), flat=False)
  ty = by - 10 - 4.6 * K
  disc(c, cx, ty, 4.3, 2.2, p[5])
  disc(c, cx - .3, ty - .2, 3.3, 1.6, '#0e0d10')
  disc(c, cx - .6, ty - .6, 2.2, 1.0, '#1b1b20')
  for dx, dy in ((-1, -1), (1, 0), (-2, 0)): c.set(int(cx + dx), int(ty + dy), '#5d6a78')
 if v == 2:
  for x, y in ((23, 21), (24, 21), (25, 21), (24, 20), (22, 21)): c.set(x, y, '#141216')
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


def handcart(v=0):
 """A two-wheeled barrow pushed by its shafts: the costermonger's, the
 builder's, the rag-and-bone man's. About 1.6 m long, the bed at the hip,
 on wheels most of a metre across."""
 c = Canvas(40, 30)
 w = RAMPS[['oak7', 'ash7', 'walnut7'][v]]
 iron = RAMPS['blackiron7']
 gy, r = 20, 9
 for x in range(0, 11):                           # the shafts, handles at the hand
  y = 11 + x // 4
  c.set(x, y, w[5]); c.set(x, y + 1, w[3]); c.set(x, y + 2, w[1])
 c.set(0, 11, w[6])
 _box(c, 10, 17, 28, 5, 2, w, dr=1, planks=2)      # the bed and a low side
 for x in (10, 19, 28, 37): c.vline(x, 11, 16, w[2])  # side stakes
 c.vline(36, 18, 29, w[2]); c.vline(37, 18, 29, w[0])  # the prop leg
 c.vline(11, 18, 24, w[3])
 cx = 23
 for y in range(gy - r - 1, gy + r + 2):          # an iron-tyred wheel, felloes and spokes
  for x in range(cx - r - 1, cx + r + 2):
   d = sqrt((x + .5 - cx - .5) ** 2 + (y + .5 - gy - .5) ** 2)
   if d > r + 0.5: continue
   if d > r - 0.6: c.set(x, y, iron[4] if x < cx and y < gy else iron[2] if x < cx or y < gy else iron[1])
   elif d > r - 2.2: c.set(x, y, w[5] if x - cx + y - gy < -3 else w[3] if x - cx + y - gy < 4 else w[2])
 for a in (0, 60, 120):                          # six spokes, as three diameters
  t = a * pi / 180
  c.line((cx - cos(t) * (r - 2), gy - sin(t) * (r - 2)), (cx + cos(t) * (r - 2), gy + sin(t) * (r - 2)), w[4] if a < 90 else w[3])
 c.rect(cx - 1, gy - 1, cx + 1, gy + 1, iron[3]); c.set(cx - 1, gy - 1, iron[5])
 if v == 0:                                       # a load of sacks
  s = RAMPS['burlap7']
  _ball(c, 17, 8, 6, 4.5, s, lo=2, hi=6, flat_bottom=11)
  _ball(c, 29, 8, 6.2, 4.8, s, lo=2, hi=6, flat_bottom=11)
  _ball(c, 23, 4, 5.4, 4.0, s, lo=2, hi=6, flat_bottom=7)
 elif v == 1:                                     # crates of greens
  _box(c, 13, 11, 11, 5, 2, w, dr=1, planks=6, lit=5)
  _box(c, 25, 11, 11, 5, 2, w, dr=1, planks=6, lit=5)
  for x in range(13, 37, 2):
   if x not in (24, 25): c.set(x, 4, '#4b8f38'); c.set(x + 1, 4, '#77b64a'); c.set(x, 3, '#77b64a')
 soft_outline(c, w[0], w[3])
 return c.image()


AMPHORA = [(0, .8), (2, 2.4), (6, 4.2), (10, 4.6), (13, 4.0), (15, 2.6), (16, 1.3), (20, 1.1), (21, 1.7)]


def amphora_stack(v=0):
 """Transport jars at a warehouse or shop wall, stood toe-down in a bed of
 sand, mouths up."""
 p = RAMPS[['terracotta7', 'buffclay7', 'redearth7'][v]]
 c = Canvas(30, 32)
 sand = ['#6a5a39', '#8b784c', '#a99461', '#c4b07c', '#ddcc9e']
 disc(c, 15, 27, 14.5, 4.4, sand[1]); disc(c, 14.5, 26.6, 13.6, 3.8, sand[3]); disc(c, 13.8, 26, 11, 2.6, sand[4])
 xs = ((6, 26), (15, 27), (24, 26)) if v != 2 else ((10, 27), (20, 27))
 for cx, by in xs:
  lathe(c, cx, by, AMPHORA, p, flat=False)
  my = by - 21 - .8 * K
  disc(c, cx, my, 1.4, .8, p[0])
  for dx in (-1, 1):
   hx = cx + dx * 3
   c.line((cx + dx * 1, my + 1), (hx, my + 1), p[5] if dx < 0 else p[3])
   c.line((hx, my + 1), (hx, my + 5), p[5] if dx < 0 else p[2])
  c.hline(int(cx - 3), int(cx + 3), by - 1, sand[2])
 soft_outline(c, p[0], p[3])
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
 """Roundwood with the bark on, laid in a pyramid ends out: the fuel of a
 camp or a first village before anyone split and corded it. The sawn ends
 face us; the bark of the top logs runs back."""
 bark = [RAMPS['darkwood'] + ['#c7a37a'], BIRCH, RAMPS['oak7']][v]
 cut = RAMPS['palewood']
 R, L = 3, 9
 c = Canvas(30, 26)
 rows = [(4, 24), (3, 19), (2, 14)]
 for row, (n, y) in enumerate(rows):
  for k in range(n):
   x = 4 + row * 3.4 + k * 6.8 + (k * 7 + row) % 2
   for yy in range(int(y - R - L * K), int(y)):
    for xx in range(int(x - R), int(x + R) + 1):
     u = (xx + .5 - x) / R
     if abs(u) > 1: continue
     t = 5 if u < -.4 else 4 if u < .2 else 3 if u < .7 else 2
     if v == 1 and (yy + xx * 3) % 5 == 0: t = 1
     elif v != 1 and (xx * 3 + yy * 5) % 11 == 0: t -= 1
     c.set(xx, yy, bark[t])
   for yy in range(int(y - R), int(y + R) + 1):
    for xx in range(int(x - R), int(x + R) + 1):
     d = ((xx + .5 - x) ** 2 + (yy + .5 - y) ** 2) ** .5
     if d > R + .4: continue
     col = bark[2] if d > R - .6 else cut[5] if (xx - x) + (yy - y) < -1 else cut[4] if d > 1 else cut[2]
     c.set(xx, yy, col)
 soft_outline(c, bark[0], bark[3])
 return c.image()


GOODS = {
 'stencil-crate': stencil_crate,
 'pallets': pallets,
 'jerrycans': jerrycans,
 'coal-sacks': coal_sacks,
 'newspapers': newspapers,
 'handcart': handcart,
 'amphora-stack': amphora_stack,
 'hurdle': hurdle,
 'log-pile': log_pile,
}
