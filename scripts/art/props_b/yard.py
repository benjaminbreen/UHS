"""Yard and work props: racks, troughs, tubs, tools and the like.

A variant's first few numbers keep the family's named meanings in props.json;
every number also seeds the small differences, so two racks on one map are
not the same rack.
"""
import math
from random import Random

from .core import Canvas, RAMPS, revolve, belly, soft_outline
from .solid import K, disc, lathe, stave_body

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


def _hang_fish(c, x, y, h, pal):
 """Split or whole fish hung by the tail: forked tail fin above the twine tie,
 plump curved body, dorsal highlight, split ribs, tapering snout below."""
 hi, mid, sh, dk = pal
 c.set(x - 1, y, hi); c.set(x + 1, y, mid)
 c.set(x - 2, y - 1, hi); c.set(x - 1, y - 1, mid); c.set(x + 1, y - 1, sh); c.set(x + 2, y - 1, dk)
 c.set(x, y + 1, ROPE[2])
 for i in range(h):
  yy = y + 2 + i
  t = i / max(1, h - 1)
  half = 1 if (t < .15 or t > .82) else (3 if .35 <= t <= .62 else 2)
  for dx in range(-half, half + 1):
   if dx == -half: col = hi
   elif dx < 0: col = hi if t < .6 else mid
   elif dx == 0: col = '#f4d6b8' if (i % 2 == 0 and .25 < t < .72) else mid
   elif dx < half: col = sh
   else: col = dk
   c.set(x + dx, yy, col)
  if i == h - 2: c.set(x - 1, yy, '#1c1618')


def _hang_meat(c, x, y, h, pal):
 """Smoked haunch or tied sausage link with twine pinch and fat marbling."""
 hi, mid, sh, dk = pal
 c.set(x, y, ROPE[2]); c.set(x, y + 1, ROPE[1])
 for i in range(h):
  yy = y + 2 + i
  t = i / max(1, h - 1)
  pinch = i == h // 2
  half = 1 if (pinch or t < .12 or t > .88) else 2
  for dx in range(-half, half + 1):
   if pinch: col = ROPE[2] if dx <= 0 else ROPE[0]
   elif dx == -half: col = hi
   elif dx == 0: col = '#f0cbb0' if i in (3, h - 3) else mid
   elif dx < half: col = sh
   else: col = dk
   c.set(x + dx, yy, col)


def _hang_bundle(c, x, y, h, pal):
 """Tied bundle of herbs, chilies or maize cobs hanging stems-up."""
 hi, mid, sh, dk = pal
 c.set(x, y, '#7d914e'); c.set(x + 1, y, '#3d4a26')
 c.set(x - 1, y + 1, ROPE[2]); c.set(x, y + 1, ROPE[1]); c.set(x + 1, y + 1, ROPE[0])
 for i in range(h):
  yy = y + 2 + i
  t = i / max(1, h - 1)
  half = 1 if t < .2 else (3 if .35 <= t <= .75 else 2)
  for dx in range(-half, half + 1):
   if t > .82 and dx in (-2, 0, 2): continue
   col = (hi if (dx + i) % 2 == 0 else mid) if dx < 0 else (mid if i % 2 == 0 else sh) if dx == 0 else (sh if dx < half else dk)
   c.set(x + dx, yy, col)


def drying_rack(v=0, layer='all'):
 """0 mixed catch, 1 split fish, 2 strips of meat, 3 full rack / herbs & catch;
 timber and hanging palettes vary deterministically with v."""
 R = rnd(v, 1)
 c = Canvas(50, 36)
 w_front = RAMPS[['oak7', 'ash7', 'walnut7', 'cedar7'][v % 4]]
 w_back = RAMPS[['walnut7', 'oak7', 'darkwood', 'walnut7'][v % 4]]
 py = 9
 silver = ('#eef4f6', '#b8c8d4', '#7e92a4', '#465668')
 herring = ('#dde8ec', '#9eb4c4', '#647b8f', '#364758')
 salmon = ('#f5b895', '#d9845d', '#a85538', '#6b3122')
 mackerel = ('#e8d4a2', '#b89458', '#826032', '#4d361a')
 meat_red = ('#e07b68', '#b84b3e', '#852c26', '#4f1816')
 meat_dark = ('#c46854', '#943c2e', '#66221c', '#3b1210')
 chili = ('#f26d52', '#c93b2b', '#8f2018', '#54100c')
 herb = ('#9cc45a', '#6c9638', '#476922', '#294012')
 maize = ('#f7d868', '#d6a836', '#9e721e', '#614310')

 xs = (14, 21, 28, 35)
 items = []
 for idx, hx in enumerate(xs):
  hh = R.randint(11, 14)
  if v % 4 == 0:
   pal = R.choice([silver, herring, salmon, mackerel])
   items.append((hx, hh, 'fish', pal))
  elif v % 4 == 1:
   pal = salmon if idx % 2 == 0 else R.choice([salmon, mackerel, silver])
   items.append((hx, hh, 'fish', pal))
  elif v % 4 == 2:
   pal = meat_red if idx % 2 == 0 else meat_dark
   items.append((hx, hh, 'meat', pal))
  else:
   kind, pal = [('herb', herb), ('herb', chili), ('herb', maize), ('fish', salmon)][idx % 4]
   items.append((hx, hh, kind, pal))

 if layer != 'hang':
  for ex, s in ((11, 1), (38, -1)):
   for i in range(25):
    y = 6 + i
    x = round(ex + s * (i * 4.5 / 24))
    c.set(x - 1, y, w_back[4]); c.set(x, y, w_back[3]); c.set(x + 1, y, w_back[1])
   for dx in range(5):
    cx_b, cy_b = ex - s * 2 + s * dx, 22 - dx // 2
    c.set(cx_b, cy_b, w_back[4]); c.set(cx_b, cy_b + 1, w_back[2])
  for ex, s in ((10, -1), (39, 1)):
   for i in range(29):
    y = 5 + i
    x = round(ex + s * (i * 4.5 / 28))
    c.set(x - 1, y, w_front[5]); c.set(x, y, w_front[4]); c.set(x + 1, y, w_front[2])
   c.set(ex - 1, 4, CUT[2]); c.set(ex, 4, CUT[1])
  for x in range(2, 48):
   grain = (x * 5 + v * 3) % 11 == 0
   c.set(x, py - 1, w_front[6] if not grain else w_front[5])
   c.set(x, py, w_front[4] if not grain else w_front[3])
   c.set(x, py + 1, w_front[2]); c.set(x, py + 2, w_front[1])
  for y in range(py - 1, py + 2):
   c.set(1, y, CUT[2] if y == py - 1 else CUT[1]); c.set(48, y, w_front[1])
  for jx in (10, 39):
   for dy in range(-1, 3):
    for dx in range(-2, 3):
     if abs(dx) + abs(dy) <= 3:
      c.set(jx + dx, py + dy, ROPE[2] if (dx + dy) % 2 == 0 else ROPE[0])
  soft_outline(c, w_back[0], w_front[2])
  # The knot stays on the pole; only what hangs below it swings.
  for hx, _, _, _ in items:
   c.set(hx, py + 2, ROPE[2]); c.set(hx, py + 3, ROPE[1])
 if layer != 'frame':
  for hx, hh, kind, pal in items:
   if kind == 'fish': _hang_fish(c, hx, py + 4, hh, pal)
   elif kind == 'meat': _hang_meat(c, hx, py + 4, hh, pal)
   else: _hang_bundle(c, hx, py + 4, hh, pal)
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


def _split_billet(c, x, y, bark, heart):
 for dy in range(4):
  for dx in range(8):
   if (dx == 0 and dy == 0) or (dx == 7 and dy == 3): continue
   c.set(x + dx, y + dy, (heart[2] if dy == 0 else heart[1]) if (dy <= 1 and dx < 6) else (bark[3] if dy == 2 else bark[1]))
 for dy in range(1, 4):
  for dx in range(5, 8):
   if dx == 7 and dy == 3: continue
   c.set(x + dx, y + dy, heart[2] if (dx == 5 and dy == 1) else (heart[1] if dy < 3 else heart[0]))


def chopping_block(v=0):
 """0 axe in oak block, 1 axe and billets (birch/ash), 2 billet stood ready."""
 c = Canvas(36, 35)
 cx, top_y, bot_y = 14.5, 13, 26
 rx, ry = 10.5, 4.8
 bark = RAMPS[['walnut7', 'birch7', 'oak7', 'walnut7'][v % 4]]
 heart = ['#b89868', '#d8bc8c', '#f2dcb4'] if v % 4 == 1 else ['#9e7340', '#cfa468', '#f2cf94']
 steel = RAMPS['iron7']
 oak = RAMPS['oak7']

 for x in range(int(cx - rx - 2), int(cx + rx + 3)):
  for y in range(top_y, bot_y + 6):
   t = max(0.0, min(1.0, (y - top_y) / (bot_y - top_y)))
   flare = 1.6 * ((t - .65) / .35) ** 2 if t > .65 else 0.0
   cur_rx, cur_ry = rx + flare, ry + flare * .45
   u = (x + .5 - cx) / cur_rx
   if abs(u) > 1.0: continue
   lobe = .7 * math.cos(u * math.pi * 2.5) if t > .75 else 0.0
   y_bot = bot_y + cur_ry * math.sqrt(max(0.0, 1.0 - u * u)) + lobe
   if y > round(y_bot): continue
   idx = 3 if u < -.75 else 5 if u < -.35 else 4 if u < .15 else 3 if u < .58 else 2
   if v % 4 == 1:
    if (y * 3 + x // 3) % 5 == 0 and abs(u) < .8: idx = max(1, idx - 2)
   else:
    theta = math.asin(max(-1.0, min(1.0, u)))
    furrow = int((theta / math.pi + .5) * 14 + (y // 4)) % 3
    if furrow == 0: idx = max(1, idx - 1)
    elif furrow == 1 and u < .1 and y % 3 != 0: idx = min(6, idx + 1)
   if y >= round(y_bot): idx = max(1, idx - 1)
   c.set(x, y, bark[idx])

 for y in range(int(top_y - ry) - 1, int(top_y + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   u, v_el = (x + .5 - cx) / rx, (y + .5 - top_y) / ry
   r2 = u * u + v_el * v_el
   if r2 > 1.0: continue
   r = math.sqrt(r2)
   if r > .86: col = bark[5] if (u + v_el < 0) else bark[3]
   elif r < .14: col = heart[0]
   elif .42 < r < .52 or .70 < r < .78: col = heart[1] if (u + v_el < .2) else heart[0]
   else: col = heart[2] if (u + v_el < .15) else heart[1]
   c.set(x, y, col)
 c.set(int(cx) + 4, top_y + 3, bark[1]); c.set(int(cx) + 4, top_y + 2, heart[0])
 c.hline(int(cx) - 3, int(cx) + 1, top_y, heart[0])

 if v % 3 != 2:
  for y, (a, b) in {6: (12, 16), 7: (11, 17), 8: (10, 17), 9: (10, 16), 10: (10, 15), 11: (10, 14), 12: (11, 13)}.items():
   for x in range(a, b + 1):
    col = steel[6] if (y == 6 or x == a) else (steel[5] if x <= a + 2 else (steel[2] if (x >= b - 1 or y >= 11) else steel[4]))
    c.set(x, y, col)
  for i in range(13):
   hx, hy = 16 + i, 7 - (i * 6) // 12
   c.set(hx, hy, oak[6]); c.set(hx, hy + 1, oak[4]); c.set(hx + 1, hy + 1, oak[2])
  c.set(28, 1, oak[6]); c.set(29, 1, oak[5]); c.set(29, 2, oak[3]); c.set(28, 2, oak[2])
 else:
  bx, by0, by1 = 11, 3, 13
  for y in range(by0, by1 + 1):
   for x in range(bx, bx + 7):
    col = (heart[2] if x < bx + 5 else heart[1]) if y <= by0 + 1 else ((heart[2] if x == bx else heart[1]) if x < bx + 4 else (bark[4] if x == bx + 4 else (bark[3] if x == bx + 5 else bark[1])))
    c.set(x, y, col)
  c.vline(bx + 3, by0 + 1, by0 + 5, bark[1])

 _split_billet(c, 24, 21, bark, heart)
 _split_billet(c, 22 if v % 3 == 1 else 26, 25, bark, heart)
 soft_outline(c, bark[0], bark[3])
 for wx, wy in ((3, 28), (7, 30), (21, 29)):
  c.set(wx, wy, heart[2]); c.set(wx + 1, wy, heart[1])
 return c.image()


def washing_line(v=0, frame=0):
 """0/3 Europe linen, 1/4 South Asian dyed/sari, 2/5 East Asian indigo & ecru; 6-frame breeze flutter."""
 c = Canvas(58, 40)
 region = v % 3
 second = (v // 3) % 2
 post = RAMPS['walnut7'] if region != 2 else RAMPS['bamboo7']
 post_out = post[0]
 rope = RAMPS['rope']
 phase = (frame % 6) / 6.0 * 2.0 * math.pi
 for sx in (4, 51):
  for y in range(7, 37):
   node = (region == 2) and (y % 6 == 0)
   c.set(sx, y, post[1] if node else post[4])
   c.set(sx + 1, y, post[1] if node else post[3])
   c.set(sx + 2, y, post[1])
  c.set(sx - 1, 5, post[4]); c.set(sx, 6, post[3])
  c.set(sx + 3, 5, post[2]); c.set(sx + 2, 6, post[1])
  c.set(sx - 1, 35, post[3]); c.set(sx + 3, 35, post[1])
 def line_y(x):
  t = (x - 28.5) / 22.5
  return int(round(10.8 + (1.0 - t * t) * 3.2))
 if region == 0 and not second:
  garments = [
   (10, 9, 14, ['#9c9282', '#c8beac', '#e6dfd0', '#f7f3e8'], 'shirt'),
   (22, 8, 15, ['#263952', '#3a5678', '#5678a0', '#7ba0c8'], 'apron'),
   (32, 6, 9,  ['#6e2c22', '#a24536', '#cb624d', '#e48972'], 'cloth'),
   (40, 8, 13, ['#9c9282', '#c8beac', '#e6dfd0', '#f7f3e8'], 'sheet'),
  ]
 elif region == 0:
  garments = [
   (10, 8, 13, ['#8f8678', '#b8ae9c', '#dbd2c2', '#f0eadc'], 'sheet'),
   (21, 9, 14, ['#3a4c32', '#567048', '#789668', '#9cb88a'], 'shirt'),
   (32, 6, 10, ['#845c22', '#b88438', '#daa656', '#f0c67a'], 'cloth'),
   (40, 8, 14, ['#40546c', '#5c7898', '#7fa0c2', '#a4c2de'], 'apron'),
  ]
 elif region == 1 and not second:
  garments = [
   (9,  11, 17, ['#7d4c14', '#b8761e', '#e2a232', '#f6ca5c'], 'sari'),
   (22, 11, 16, ['#681c22', '#9e2c36', '#cc4652', '#e8727c'], 'sari'),
   (35, 11, 16, ['#1d2a4c', '#2d4276', '#4462a0', '#6888c4'], 'sari'),
  ]
 elif region == 1:
  garments = [
   (9,  11, 16, ['#781e42', '#ae3264', '#d85488', '#ee82ac'], 'sari'),
   (22, 11, 17, ['#8a4a16', '#c26c24', '#e4923c', '#f6b864'], 'sari'),
   (35, 11, 16, ['#164a4c', '#247274', '#389a9c', '#62c0c2'], 'sari'),
  ]
 elif not second:
  garments = [
   (9,  12, 16, ['#1a2844', '#283f6a', '#3d5e94', '#5d82bc'], 'kimono'),
   (24, 9,  14, ['#948c7a', '#beb5a2', '#ded7c6', '#f2ede0'], 'sheet'),
   (36, 10, 15, ['#6b361e', '#9c522c', '#c47042', '#de9464'], 'sheet'),
  ]
 else:
  garments = [
   (9,  10, 15, ['#2a3c54', '#405a7c', '#5c7ca4', '#7e9ec6'], 'sheet'),
   (22, 12, 16, ['#948c7a', '#beb5a2', '#ded7c6', '#f2ede0'], 'kimono'),
   (37, 9,  14, ['#3a4e36', '#587452', '#789870', '#9cba94'], 'sheet'),
  ]
 for g_idx, (gx, gw, gh, pal, shape) in enumerate(garments):
  top = line_y(gx + gw // 2)
  g_phase = phase - g_idx * 0.85
  gust = math.sin(g_phase)
  for dy in range(gh):
   frac_y = dy / max(1.0, gh - 1.0)
   drift_x = int(round(gust * (frac_y ** 1.4) * 1.5))
   for dx in range(gw):
    hem_wave = int(round(math.sin((dx / max(1, gw)) * math.pi + g_phase) * 1.1))
    if dy >= gh - 1 + (hem_wave if dy > gh - 3 else 0):
     continue
    if shape == 'shirt' and dy > 6 and (dx < 2 or dx >= gw - 2):
     continue
    if shape == 'kimono' and dy > 10 and (dx < 2 or dx >= gw - 2):
     continue
    fold_v = math.sin(dx * 1.15 - g_phase * 0.9 + dy * 0.15)
    idx = 3 if (fold_v > 0.45 and dy < gh - 4) else (2 if fold_v > -0.25 else 1)
    if dy >= gh - 3:
     idx = max(0, idx - 1)
    px = gx + dx + drift_x
    if shape == 'sari' and dy >= gh - 4:
     c.set(px, top + dy, '#e8b848' if ((dx + (frame // 2)) % 2 == 0) else '#b87c24')
    else:
     c.set(px, top + dy, pal[idx])
  for px in (gx + 1, gx + gw - 2):
   c.set(px, top - 1, '#c8a064'); c.set(px, top, '#7a542e')
 soft_outline(c, post_out, post[2])
 for x in range(6, 52):
  ly = line_y(x)
  c.set(x, ly, rope[3] if (x % 3 != 0) else rope[1])
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
 R = rnd(v, 7)
 c = Canvas(38, 34)
 cx, top_y, bot_y = 18.5, 13, 25
 rx_top, rx_bot = 14.2, 12.2
 ry_top = rx_top * K
 wood = RAMPS['oak7'] if v % 2 == 0 else (RAMPS['ash7'] if v % 4 == 1 else RAMPS['walnut7'])
 hoop = RAMPS['blackiron7'] if v % 2 == 0 else (RAMPS['copper7'] if v % 4 == 1 else RAMPS['bamboo7'])
 steel = RAMPS['iron7']
 water = ['#16324a', '#214b6e', '#2f6994', '#468cb8', '#6cb2d6', '#a4dbf0', '#eafaff']
 cloths = [
  ['#7a2220', '#a8342e', '#d45244', '#ee7c6b'],
  ['#1d3158', '#2e4c82', '#4970ab', '#739ad1'],
  ['#8f6218', '#bf8826', '#e3ad42', '#f7cc6e'],
  ['#2d5428', '#497d3c', '#71a858', '#9cd17e'],
  ['#783852', '#a85876', '#d1829c', '#eeaec2'],
  ['#7a6e58', '#a89a80', '#d4c8ae', '#f2ead6'],
 ]
 cloth_pal = cloths[v] if v < 3 else R.choice(cloths)
 board = (v < 3) or (R.random() < 0.8)

 for y in range(int(top_y - ry_top) - 1, int(top_y + ry_top) + 2):
  for x in range(int(cx - rx_top) - 1, int(cx + rx_top) + 2):
   u = (x + 0.5 - cx) / rx_top
   v_el = (y + 0.5 - top_y) / ry_top
   if u * u + v_el * v_el > 1.0:
    continue
   ui = (x + 0.5 - cx) / (rx_top - 2.0)
   vi = (y + 0.5 - (top_y + 0.4)) / (ry_top - 1.3)
   if ui * ui + vi * vi > 1.0:
    lit = -u * 0.65 - v_el * 0.45
    tone = 6 if lit > 0.25 else (5 if lit > -0.2 else 4)
    ang = math.atan2(v_el, u)
    if abs(((ang / math.pi * 8) % 1.0) - 0.5) < 0.09:
     tone = max(2, tone - 2)
    c.set(x, y, wood[tone])
   else:
    c.set(x, y, wood[2 if u < -0.2 else (3 if u < 0.45 else 4)])

 w_cy = top_y + 1.4
 w_rx, w_ry = rx_top - 2.2, ry_top - 1.5
 for y in range(int(w_cy - w_ry) - 1, int(w_cy + w_ry) + 2):
  for x in range(int(cx - w_rx) - 1, int(cx + w_rx) + 2):
   u = (x + 0.5 - cx) / w_rx
   v_el = (y + 0.5 - w_cy) / w_ry
   if u * u + v_el * v_el <= 1.0:
    if v_el < -0.45: col = water[1]
    elif v_el < -0.1: col = water[2] if u > 0.2 else water[3]
    else: col = water[4] if u < 0.25 else water[3]
    c.set(x, y, col)

 if board:
  wb_x0, wb_y0 = 20, 2
  oak = RAMPS['oak7']
  for dy in range(14):
   wy = wb_y0 + dy
   lx = wb_x0 - (dy // 3)
   rx = lx + 9
   for x in range(lx, rx + 1):
    if wy > top_y + 2 and ((x + 0.5 - cx) / w_rx) ** 2 + ((wy + 0.5 - w_cy) / w_ry) ** 2 > 0.92:
     continue
    if x in (lx, lx + 1):
     c.set(x, wy, oak[6] if x == lx else oak[4])
    elif x in (rx - 1, rx):
     c.set(x, wy, oak[3] if x == rx - 1 else oak[1])
    elif dy < 2:
     c.set(x, wy, oak[6] if dy == 0 else oak[4])
    elif dy == 2:
     c.set(x, wy, oak[2])
    else:
     if (dy - 3) % 2 == 0:
      c.set(x, wy, steel[6] if x < lx + 6 else steel[4])
     else:
      c.set(x, wy, steel[2] if x < lx + 6 else steel[1])
  c.set(22, 11, water[5]); c.set(23, 12, water[6]); c.set(21, 13, water[6])

 stave_body(c, cx, top_y, bot_y, rx_top, rx_bot, wood, hoops=(16, 22), hoop_ramp=hoop, staves=8)

 for x in range(int(cx - rx_top), int(cx + rx_top) + 1):
  u = (x + 0.5 - cx) / rx_top
  if abs(u) > 1.0:
   continue
  yf = round(top_y + ry_top * math.sqrt(max(0.0, 1.0 - u * u)))
  c.set(x, yf - 1, wood[6] if u < 0.25 else wood[4])
  c.set(x, yf, wood[4] if u < 0.0 else (wood[3] if u < 0.5 else wood[2]))

 for side, hx in ((-1, int(cx - rx_top) - 1), (1, int(cx + rx_top))):
  hy = top_y - 2
  w_hi = wood[5] if side < 0 else wood[3]
  w_lo = wood[3] if side < 0 else wood[1]
  for dy in range(5):
   c.set(hx, hy + dy, w_hi); c.set(hx + side, hy + dy, w_lo)
  c.set(hx, hy + 2, wood[1])

 gx0 = 8 if (v < 2 or R.random() < 0.65) else 19
 for dx in range(8):
  x = gx0 + dx
  u = (x + 0.5 - cx) / rx_top
  yf = round(top_y + ry_top * math.sqrt(max(0.0, 1.0 - u * u)))
  hang = 6 if 2 <= dx <= 5 else (5 if 1 <= dx <= 6 else 3)
  fold_wave = 1 if dx in (2, 5) else 0
  for dy in range(-2, hang + fold_wave):
   y = yf + dy
   if dy < 0: col = cloth_pal[2] if dx < 5 else cloth_pal[1]
   elif dy == 0: col = cloth_pal[3] if dx < 6 else cloth_pal[2]
   elif dy == hang + fold_wave - 1: col = cloth_pal[0]
   else: col = cloth_pal[3] if dx in (1, 2, 4) else (cloth_pal[2] if dx < 6 else cloth_pal[1])
   c.set(x, y, col)

 f = m % 4
 suds_clusters = [
  [(11, 13), (12, 13), (13, 13), (12, 12), (15, 14), (16, 14), (17, 14), (16, 13), (20, 14), (21, 14)],
  [(12, 13), (13, 13), (14, 13), (13, 12), (16, 14), (17, 14), (18, 14), (17, 13), (19, 15), (20, 15)],
  [(11, 14), (12, 14), (13, 13), (15, 13), (16, 13), (17, 14), (18, 14), (21, 14), (22, 14), (20, 13)],
  [(10, 13), (11, 13), (12, 14), (14, 14), (15, 14), (16, 13), (19, 14), (20, 14), (21, 13), (15, 15)],
 ][f]
 for sx, sy in suds_clusters:
  c.set(sx, sy, water[6])
  if c.get(sx, sy + 1) in (water[2], water[3], water[4]):
   c.set(sx, sy + 1, water[5])

 soft_outline(c, wood[0], wood[2])

 bubbles = [
  [(13, 9, water[6]), (17, 7, water[5])],
  [(13, 8, water[6]), (18, 6, water[5]), (15, 10, water[6])],
  [(14, 7, water[5]), (15, 9, water[6])],
  [(15, 8, water[6]), (12, 10, water[5])],
 ][f]
 for bx, by_b, bcol in bubbles:
  c.set(bx, by_b, bcol)
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


KNAP_HIDE = [(6, 8, 25, 27), (5, 9, 24, 28), (6, 28), (4, 30), (3, 31), (2, 31), (0, 32), (0, 33), (0, 32),
             (2, 31), (3, 31), (4, 30), (6, 28), (5, 9, 24, 28), (6, 8, 25, 27)]
SCRAPED = ['#2f261c', '#5e5040', '#83745c', '#a09078', '#b8a98e', '#cabda2', '#dcd0b6']
KNAP_CORE = [
 "..dc...",
 ".dcbc..",
 "dccbbc.",
 "cdcbbba",
 "ccbcbba",
 ".cbbba.",
 "..aaa..",
]


def knapping_floor(v=0):
 """0 flint, 1 obsidian, 2 chert, knapped on a scraped hide: the core, a
 hammerstone, an antler billet, and flakes on the hide and off it."""
 t = [['#343a48', '#56607a', '#8a94a8', '#c4cad4'], ['#141420', '#2a2a3c', '#5a5a78', '#d8dcf0'], ['#6a3e2e', '#9a6044', '#c48a64', '#e6c09c']][v % 3]
 h = SCRAPED
 c = Canvas(38, 22)
 top = 4
 for y, spans in enumerate(KNAP_HIDE):
  for a0, a1 in zip(spans[::2], spans[1::2]):
   for x in range(a0 + 1, a1 + 2):
    edge = y in (0, 1, 13, 14) or x in (a0 + 1, a1 + 1)
    tone = 6 if 2 <= y <= 3 else 4 if y >= 12 else 5
    if edge: tone = 5 if y < 7 else 3
    if not edge and (x * 7 + y * 3) % 23 == 0: tone = 4
    c.set(x, top + y, h[tone])
 for x, y in ((7, 0), (26, 0), (7, 14), (26, 14), (1, 7), (34, 7)): c.set(x + 1, top + y, h[2])   # the pegs
 keys = {'a': t[0], 'b': t[1], 'c': t[2], 'd': t[3]}
 cx = (11, 14, 9)[v]
 for y, row in enumerate(KNAP_CORE):
  for x, ch in enumerate(row):
   if ch != '.': c.set(cx + x, y + 2, keys[ch])
 hx = (24, 7, 23)[v]
 for y, row in enumerate([".3443.", "345554", "344443", ".2332."]):
  for x, ch in enumerate(row):
   if ch != '.': c.set(hx + x, top + 4 + y, RAMPS['granite'][int(ch)])
 bx = (4, 21, 15)[v]
 for i in range(7): c.set(bx + i, top + 10 - (i + 1) // 3, BONE[2] if i < 5 else BONE[3]); c.set(bx + i, top + 11 - (i + 1) // 3, BONE[0])
 c.set(bx + 6, top + 7, BONE[2])
 flakes = [(20, 8), (17, 10), (27, 9), (8, 9), (14, 12), (30, 7), (22, 12), (35, 15), (2, 17), (11, 18)]
 for i, (x, y) in enumerate(flakes[v:v + 8]):
  c.set(x, top + y - 4, t[3] if i % 2 else t[2]); c.set(x + 1, top + y - 4, t[1])
 soft_outline(c, h[1], h[3])
 return c.image()


def metate(v=0):
 """0 basalt, 1 brown andesite, 2 basalt with maize, 3 brown andesite with maize."""
 R = rnd(v, 20)
 c = Canvas(36, 24)
 basalt = ['#18171c', '#28262e', '#3c3944', '#524e5c', '#6b6676', '#878292', '#a6a0b0']
 andesite = ['#241c18', '#3a2d26', '#544138', '#70584c', '#8e7162', '#ad8e7d', '#cbb09e']
 stone = basalt if v % 2 == 0 else andesite
 terra = RAMPS['terracotta7']
 maize = ['#b88620', '#e0b23c', '#fae078']
 masa = [
  ['#b8a678', '#d9c89e', '#f2e6c2', '#fcf6e3'],
  ['#a88430', '#ccaa48', '#e8cc6c', '#fae698'],
  ['#964030', '#bc5a42', '#dc7e60', '#f0a688'],
 ][0 if v < 4 else R.randint(0, 2)]

 for y in range(11, 16):
  c.set(5, y, stone[2]); c.set(6, y, stone[1])
 for y in range(13, 20):
  c.set(8, y, stone[4]); c.set(9, y, stone[3]); c.set(10, y, stone[1])
 for y in range(15, 21):
  c.set(22, y, stone[4]); c.set(23, y, stone[2]); c.set(24, y, stone[1])

 for dx in range(22):
  slope = (dx * 4) // 21
  bx = 4 + dx
  by_back = 4 + slope
  for d in range(7):
   x = bx + (d // 2)
   y = by_back + d
   if d == 0: tone = 6 if dx < 14 else 5
   elif d == 1: tone = 3
   elif d == 6: tone = 5 if dx < 16 else 4
   else:
    tone = 4 if (dx < 12 and d >= 3) else 3
    if (x * 5 + y * 3) % 7 == 0: tone = max(2, tone - 1)
   c.set(x, y, stone[tone])
  fx, fy = bx + 3, by_back + 7
  for th in range(3):
   c.set(fx, fy + th, stone[2] if th < 2 else stone[1])

 for d in range(7):
  x = 4 + (d // 2)
  y = 4 + d
  c.set(x - 1, y + 1, stone[5]); c.set(x - 1, y + 2, stone[3])

 kernels = [(9, 8), (11, 8), (10, 9), (12, 9), (8, 9)]
 if v >= 2:
  kernels += [(7, 8), (9, 7), (10, 8), (11, 9), (13, 9)]
 for mx, my in kernels:
  c.set(mx, my, maize[2] if (mx + my) % 2 == 0 else maize[1])

 for mx in range(14, 24):
  my = 7 + ((mx - 4) * 4) // 21
  for dy in range(2, 5):
   if (mx - 14 + dy) < 11:
    c.set(mx + dy // 2, my + dy, masa[3] if dy == 3 else masa[2])

 mano_x = 12 if v < 4 else R.randint(10, 15)
 mano_y_back = 3 + ((mano_x - 4) * 4) // 21
 for d in range(-1, 9):
  mx = mano_x + (d // 2)
  my = mano_y_back + d
  end_shade = 1 if (d in (-1, 8)) else 0
  c.set(mx - 1, my, stone[6 - end_shade])
  c.set(mx, my, stone[5 - end_shade])
  c.set(mx + 1, my, stone[3 - end_shade])
  c.set(mx + 2, my, stone[1])

 bx_c, by_c = 28.5, 20
 lathe(c, bx_c, by_c, [(0, 3.2), (1.5, 4.6), (3.5, 5.2)], terra)
 disc(c, bx_c, by_c - 3.5 - 3.2 * K, 5.0, 2.2, terra[5])
 fill_pal = maize if (v >= 2 and v % 2 == 0) else masa
 disc(c, bx_c, by_c - 3.5 - 3.2 * K + 0.2, 3.8, 1.5, fill_pal[1 if fill_pal is maize else 2])
 c.hline(int(bx_c) - 2, int(bx_c) + 1, int(by_c - 3.5 - 3.2 * K), fill_pal[2 if fill_pal is maize else 3])

 soft_outline(c, stone[0], stone[3])
 return c.image()


def catch(v=0):
 """0 silver, 1 bronze-backed, 2 dark: a string of three fish on a woven rush cord."""
 R = rnd(v, 21)
 c = Canvas(24, 22)
 rope = RAMPS['rope']
 pals = [
  ('#eef4f6', '#b8c8d4', '#7e92a4', '#465668'),
  ('#f7d89c', '#cf9c52', '#96652c', '#573716'),
  ('#c2d2e0', '#7e92a8', '#4c5c72', '#283242'),
  ('#f5b895', '#d9845d', '#a85538', '#6b3122'),
 ]
 pal0 = pals[v % 3] if v < 3 else R.choice(pals)
 pal1 = pals[(v + 1) % 4] if v >= 3 else pal0

 c.set(11, 1, rope[3]); c.set(12, 1, rope[2])
 c.set(10, 2, rope[3]); c.set(13, 2, rope[1])
 for x in range(5, 19):
  y_arc = 3 + (1 if 8 <= x <= 15 else 0)
  c.set(x, y_arc, rope[3] if x < 13 else rope[2])
  c.set(x, y_arc + 1, rope[1])

 specs = [(6, 4, 11, pal0), (12, 5, 12, pal1), (17, 4, 10, pal0)]
 for fx, fy, fh, pal in specs:
  hi, mid, sh, dk = pal
  c.set(fx - 1, fy, hi); c.set(fx + 1, fy, sh)
  c.set(fx, fy + 1, rope[2])
  for i in range(fh):
   yy = fy + 2 + i
   t = i / max(1, fh - 1)
   half = 1 if (t < 0.16 or t > 0.82) else 2
   for dx in range(-half, half + 1):
    if dx == -half: col = hi
    elif dx == 0: col = hi if t < 0.45 else mid
    elif dx < half: col = sh
    else: col = dk
    c.set(fx + dx, yy, col)
   if i == 3:
    c.set(fx + half, yy, mid)
   if i == fh - 2:
    c.set(fx - 1, yy, '#18141c'); c.set(fx, yy, hi)
 soft_outline(c, '#222834', rope[1])
 return c.image()


def pounding_mortar(v=0):
 """0 oak, 1 walnut with two pestles, 2 pale; grain and lean are seeded."""
 R = rnd(v, 22)
 c = Canvas(28, 44)
 cx, by = 13.5, 41
 wood = [RAMPS['oak7'], RAMPS['walnut7'], RAMPS['ash7']][v % 3]
 grains = [
  ['#8a6620', '#b88c30', '#e0b84c', '#fae078'],
  ['#a89878', '#cfc0a2', '#ebe0c8', '#fcf6e8'],
  ['#825a32', '#ab7c4b', '#d1a26e', '#ecc495'],
 ]
 grain = grains[0] if v < 3 else R.choice(grains)

 prof = [
  (0, 7.8), (2, 8.2), (4, 6.8), (7, 5.2), (10, 5.0),
  (13, 6.6), (17, 8.6), (20, 8.8),
 ]
 def mortar_tex(z, a, i):
  if abs(z - 15.0) < 0.6 or abs(z - 2.5) < 0.6:
   return max(1, i - 1)
  if abs(z - 14.0) < 0.6 and a < 0.3:
   return min(6, i + 1)
  if int((a + math.pi) * 7) % 4 == 0 and 4 < z < 14:
   return max(1, i - 1)
  return i

 lathe(c, cx, by, prof, wood, mortar_tex, flat=True)

 ty = by - 20 - 7.8 * K + 0.5
 rx, ry = 8.6, 3.6
 for y in range(int(ty - ry) - 1, int(ty + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   u = (x + 0.5 - cx) / rx
   v_el = (y + 0.5 - ty) / ry
   if u * u + v_el * v_el > 1.0:
    continue
   ui = (x + 0.5 - cx) / (rx - 1.8)
   vi = (y + 0.5 - (ty + 0.2)) / (ry - 0.9)
   if ui * ui + vi * vi > 1.0:
    c.set(x, y, wood[6] if (u + v_el < -0.1) else (wood[5] if u < 0.35 else wood[3]))
   else:
    if vi < -0.25:
     c.set(x, y, wood[1] if ui < 0.1 else wood[2])
    else:
     g_idx = 3 if (ui < 0.1 and vi < 0.3) else (2 if ui < 0.45 else 1)
     c.set(x, y, grain[g_idx])

 pestles = [(-3, -1)] if v % 3 == 0 else ([(-4, -1), (4, 1)] if v % 3 == 1 else [(3, 1)])
 for lean_x, side in pestles:
  x0 = round(cx + side * 1.2)
  y0 = round(ty + 0.5)
  x1 = x0 + lean_x
  y1 = 3
  steps = y0 - y1
  for s in range(steps + 1):
   t = s / max(1, steps)
   px = round(x0 + (x1 - x0) * t)
   py = y0 - s
   thick = 3 if t > 0.72 else 2
   for dx in range(thick):
    tone = 6 if dx == 0 else (4 if dx == 1 and thick == 3 else 2)
    c.set(px + dx - 1, py, wood[tone])
  c.set(x1 - 1, y1 - 1, wood[6]); c.set(x1, y1 - 1, wood[5])

 soft_outline(c, wood[0], wood[3])
 for gx, gy in ((4, 41), (5, 42), (21, 41), (22, 40)):
  c.set(gx, gy, grain[3]); c.set(gx + 1, gy, grain[1])
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
