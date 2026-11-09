"""Furniture and dressing for a feast: tables, trays, carpets, a dining couch
and strings of lanterns, garlands or flags. ~17 source pixels to a metre.

Tops are seen from above at the same moderate depth as the bench: a table's
board shows about half its real depth, and its front edge stands square on.
"""
from .core import Canvas, RAMPS, jitter, blob, revolve, belly, soft_outline
from .workshop import streak

LACQUER7 = ['#1c0b0a', '#330f0d', '#521512', '#721d17', '#93291e', '#b23a26', '#cc5a3a']
CLOTH7 = ['#3d3b36', '#6b6a62', '#9a998f', '#bebcb0', '#d7d5c9', '#e8e6db', '#f6f4ea']
CHECK = ['#7c2a22', '#a8392c', '#e8e2d2']
LEAF7 = ['#0f2414', '#173a1d', '#215226', '#2f6c31', '#43873d', '#62a24d', '#8cbf68']
MARIGOLD = ['#7a3a08', '#b25a0c', '#e08a14', '#f6b23a']
PAPER = ['#4a0e0c', '#7e1712', '#b32419', '#dc4a2c', '#f08a52']
RUG = ['#2a0f12', '#561a1e', '#8a2a28', '#b4483a', '#d9a560', '#2c3a5a', '#e9d8b0']
RICE = ['#8f8a76', '#c9c3ab', '#ece7d2']
BREAD = ['#4a2c14', '#7a4a22', '#a86d34', '#cf9550']
ROAST = ['#3a1a0c', '#6a3016', '#9a4c22', '#c4743a']
GREENS = ['#22401c', '#3c6a2a', '#6a9a3c']


def oval(c, cx, cy, rx, ry, fill, rimc=None, lit=None):
 """A flat round thing seen from above: a dish, a tray, a table top."""
 for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   u, v = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   r = u * u + v * v
   if r > 1: continue
   tone = fill
   if rimc and r > 0.62: tone = lit if (lit and (u + v) < -0.3) else rimc
   c.set(x, y, tone)


def dish(c, cx, cy, rx, food, plate=CLOTH7):
 """A plate with something heaped on it."""
 oval(c, cx, cy, rx, max(1.4, rx * 0.5), plate[5], plate[2], plate[6])
 if food:
  blob(c, [(cx, cy - 0.6, rx * 0.62, max(1.2, rx * 0.42))], food, rim=False)


def jug(c, cx, base, ramp, h=7):
 revolve(c, cx, belly(base - h, base, [1.2, 2.2, 2.6, 2.0]), ramp, gloss=1)
 c.set(cx - 1, base - h - 1, ramp[5]); c.set(cx, base - h - 1, ramp[4])


def board(c, x0, x1, y0, y1, ramp, cloth=None):
 """A table's top face, grain along the length, or a cloth over it."""
 for y in range(y0, y1 + 1):
  tone = 6 if y == y0 else 5 if y < y0 + 3 else 4
  if cloth:
   c.hline(x0, x1, y, cloth[tone] if cloth is CLOTH7 else cloth[(y - y0) % 2])
  else:
   c.hline(x0, x1, y, ramp[tone]); streak(c, x0, x1, y, ramp, tone)


def trestle_table(v=0):
 """A board on trestles, about 2.4 m by 0.8 m, laid for a meal.

 0: a bare oak board with loaves, trenchers and a jug, the medieval hall's
 table. 1: a linen cloth with a roast and cups. 2: a checked cloth with
 plates and bottles, for the last two centuries.
 """
 c = Canvas(46, 24)
 w = RAMPS['oak7' if v < 2 else 'ash7']
 x0, x1, top, edge = 1, 44, 6, 14
 for lx in (5, 38):                                # trestles: splayed legs, a foot rail
  for y in range(edge + 1, 23):
   spread = (y - edge) // 3
   c.set(lx - spread, y, w[3]); c.set(lx - spread + 1, y, w[2])
   c.set(lx + 2 + spread, y, w[2]); c.set(lx + 3 + spread, y, w[1])
  c.hline(lx - 2, lx + 5, 19, w[2])
 cloth = None if v == 0 else CLOTH7 if v == 1 else CHECK
 board(c, x0, x1, top, edge - 1, w, cloth)
 if cloth is CLOTH7:                               # the cloth hangs over the front edge
  for y in range(edge, edge + 4):
   c.hline(x0, x1, y, CLOTH7[3 if y < edge + 3 else 2])
  for x in range(x0, x1, 4): c.vline(x, edge + 1, edge + 3, CLOTH7[2])
 elif cloth is CHECK:
  for y in range(edge, edge + 3):
   for x in range(x0, x1 + 1): c.set(x, y, CHECK[((x // 3) + (y - edge)) % 2])
 else:
  c.hline(x0, x1, edge, w[4]); c.hline(x0, x1, edge + 1, w[2])
 if v == 0:
  for x in (9, 21, 33):                            # trenchers of stale bread, loaves between
   oval(c, x, 10, 3.4, 1.6, BREAD[2], BREAD[1])
  for x, y in ((15, 9), (27, 10), (40, 9)):
   blob(c, [(x, y, 3.0, 2.0)], BREAD)
  jug(c, 4, 11, RAMPS['terracotta7'], h=5)
  oval(c, 24, 7, 2.2, 1.1, RAMPS['walnut7'][4], RAMPS['walnut7'][2])
 elif v == 1:
  oval(c, 22, 10, 7, 2.6, RAMPS['pewter7'][5], RAMPS['pewter7'][3], RAMPS['pewter7'][6])
  blob(c, [(20, 8.8, 4.0, 2.3), (25, 9.6, 2.4, 1.7)], ROAST)
  for x in (6, 12, 33, 39):
   dish(c, x, 10, 2.6, GREENS if x % 2 else BREAD, [RAMPS['pewter7'][i] for i in range(7)])
  for x in (9, 30, 42): revolve(c, x, belly(6, 10, [1.4, 1.2, 1.0]), RAMPS['pewter7'], gloss=1)
 else:
  for x in (6, 14, 30, 38): dish(c, x, 10, 2.8, ROAST if x < 20 else GREENS)
  for x in (21, 24):
   revolve(c, x, belly(5, 11, [0.6, 0.6, 1.3, 1.4]), RAMPS['greenglaze7'], gloss=1)
  blob(c, [(18, 9, 2.4, 1.6)], BREAD)
 c.rim(w)
 return c.image()


def round_table(v=0):
 """A round table about 1.3 m across, dishes shared from the middle.

 0: dark lacquered wood, a whole fish in the centre, the Song and after.
 1: a red cloth, for a twentieth-century wedding banquet.
 """
 c = Canvas(28, 22)
 wood = RAMPS['walnut7']
 top = LACQUER7 if v else wood
 cx, cy, rx, ry = 13.5, 7.5, 13, 5.5
 for lx, dark in ((4, 2), (23, 1), (9, 3), (18, 3)):
  c.vline(lx, 10, 20, wood[dark]); c.vline(lx + 1, 10, 20, wood[max(dark - 1, 0)])
 for y in range(int(cy), int(cy + ry) + 4):        # the apron below the top's front half
  for x in range(int(cx - rx), int(cx + rx) + 1):
   u = (x + .5 - cx) / rx
   if abs(u) <= 1 and y - cy <= ry * (1 - u * u) ** 0.5 + 2.5:
    c.set(x, y, top[2] if u > 0.3 else top[3])
 oval(c, cx, cy, rx, ry, top[5], top[3], top[6])
 oval(c, cx, cy, rx - 2.5, ry - 1.4, top[4])
 oval(c, cx, cy, 4.6, 2.2, CLOTH7[5], CLOTH7[2])   # the fish on its platter
 blob(c, [(cx - 0.5, cy - 0.3, 3.2, 1.1), (cx + 3.2, cy - 0.3, 1.0, 1.0)], RAMPS['copper7'], rim=False)
 for a, food in ((-9, GREENS), (-6, RICE), (6, ROAST), (9, GREENS), (0, RICE)):
  y = cy + (3.2 if a else -3.6)
  dish(c, cx + a, y if abs(a) < 8 else cy, 1.8, food, RAMPS['blueglaze7'] if v == 0 else CLOTH7)
 revolve(c, cx + 7, belly(int(cy) - 6, int(cy) - 1, [1.0, 2.0, 2.2, 1.6]), RAMPS['blueglaze7'], gloss=1)
 c.rim(top)
 return c.image()


def food_tray(v=0):
 """A meal set out on the floor.

 0: a brass tray on a low stand, rice heaped in the middle and bread round
 it, West Asia and North Africa. 1: two banana leaves, rice and small heaps,
 South Asia. 2: a lacquered tray-table with its own bowls, Japan and Korea.
 """
 if v == 0:
  c = Canvas(22, 11)
  b = RAMPS['brass7']
  for x in (5, 16): c.vline(x, 6, 10, RAMPS['walnut7'][2])
  oval(c, 10.5, 5, 10, 4, b[5], b[3], b[6])
  oval(c, 10.5, 5, 8.2, 3.1, b[4])
  blob(c, [(10.5, 4.2, 3.6, 2.4)], RICE + [RICE[2]])
  for x, y in ((4.5, 5), (16.5, 5), (10.5, 7.6)): oval(c, x, y, 2.2, 1.2, BREAD[3], BREAD[2])
  c.rim(b)
 elif v == 1:
  c = Canvas(30, 9)
  for x0 in (1, 16):
   for y in range(1, 8):
    half = 6.5 * (1 - abs(y - 4) / 4.5) ** 0.6
    for x in range(int(x0 + 6.5 - half * 1.05), int(x0 + 6.5 + half * 1.05) + 1):
     c.set(x, y, LEAF7[4 if y < 4 else 3])
   c.hline(x0 + 1, x0 + 12, 4, LEAF7[2])
   blob(c, [(x0 + 6, 3.4, 2.6, 1.6)], RICE + [RICE[2]], rim=False)
   for dx, food in ((2.5, ROAST), (10, GREENS), (9, MARIGOLD)):
    blob(c, [(x0 + dx, 5.4 if food is not MARIGOLD else 2.6, 1.2, 0.9)], food, rim=False)
  c.rim(LEAF7)
 else:
  c = Canvas(14, 10)
  for x in (2, 11): c.vline(x, 5, 9, LACQUER7[1])
  c.rect(1, 1, 12, 5, LACQUER7[4]); c.hline(1, 12, 1, LACQUER7[6]); c.hline(1, 12, 5, LACQUER7[2])
  c.hline(1, 12, 6, LACQUER7[1])
  for x, food in ((4, RICE), (9, None)):
   oval(c, x, 3, 1.8, 1.1, LACQUER7[0] if food is None else CLOTH7[5], LACQUER7[2])
   if food: blob(c, [(x, 2.6, 1.2, 0.8)], food, rim=False)
  dish(c, 6.5, 4, 1.4, ROAST)
  c.rim(LACQUER7)
 return c.image()


def floor_carpet(v=0):
 """A carpet or mat laid out to sit on, about 2.2 m by 1.4 m, flat.

 0: a red knotted carpet with a border and a medallion. 1: an indigo one.
 2: a plain reed mat.
 """
 c = Canvas(40, 13)
 if v == 2:
  r = RAMPS['straw']
  for y in range(1, 12):
   for x in range(1, 39):
    c.set(x, y, r[5] if (x // 2 + y) % 3 else r[4])
  for x in range(1, 39, 6): c.vline(x, 1, 11, r[3])
  c.rim(r)
  return c.image()
 field, border = (RUG[2], RUG[1]) if v == 0 else (RUG[5], RUG[1])
 c.rect(1, 1, 38, 11, border)
 c.rect(3, 3, 36, 9, field)
 for x in range(2, 38, 3): c.set(x, 2, RUG[4]); c.set(x + 1, 10, RUG[4])
 oval(c, 19.5, 6, 6, 2.4, RUG[3], RUG[6])
 oval(c, 19.5, 6, 2.6, 1.1, border)
 for x in (7, 32):
  oval(c, x, 6, 2.0, 1.4, RUG[3]); c.set(x, 6, RUG[6])
 for x in range(1, 39, 2): c.set(x, 12, RUG[6])    # the fringe
 soft_outline(c, RUG[0], RUG[1])
 return c.image()


def dining_couch(v=0):
 """A Roman dining couch, about 2 m long: turned legs, a mattress, cushions
 and a raised end to lean on. Diners lay on their left elbows."""
 c = Canvas(42, 22)
 w = RAMPS['walnut7']
 cover = [RAMPS['paintblue7'], LACQUER7, RAMPS['linen7']][v]
 for lx in (3, 37):
  for y in range(13, 21):
   bead = y in (15, 18)
   c.set(lx, y, w[5] if bead else w[3]); c.set(lx + 1, y, w[4] if bead else w[2]); c.set(lx + 2, y, w[1])
  c.hline(lx - 1, lx + 3, 21, w[0])
 c.rect(1, 11, 40, 13, w[3]); c.hline(1, 40, 11, w[5]); c.hline(1, 40, 13, w[1])
 for y in range(5, 11):                            # the mattress, its top seen from above
  c.hline(2, 39, y, cover[5 if y < 7 else 4])
 for x in range(4, 38, 5): c.set(x, 9, cover[3])
 c.hline(2, 39, 10, cover[2])
 for y in range(1, 11):                            # the raised end, the fulcrum
  c.vline(1, max(1, y), 10, w[4]); c.set(2, y, w[3])
 blob(c, [(6, 5, 4, 2.4)], RAMPS['linen7'])        # cushions against it
 blob(c, [(11, 5.5, 3.4, 2.0)], cover)
 for x in range(2, 40, 3): c.vline(x, 11, 12 + jitter(x) % 2, cover[3])
 c.rim(w)
 return c.image()


def festoon(v=0):
 """Two poles with a string between, about 3 m apart.

 0: red paper lanterns, East Asia. 1: a marigold garland with mango leaves,
 South Asia. 2: cloth bunting, for the last two centuries.
 """
 c = Canvas(52, 40)
 w = RAMPS['ash7']
 for px in (1, 49):
  c.vline(px, 3, 39, w[4]); c.vline(px + 1, 3, 39, w[2])
  c.set(px, 2, w[6])
 sag = lambda x: 4 + int(8 * (1 - ((x - 25.5) / 24) ** 2))
 for x in range(3, 49): c.set(x, sag(x), RAMPS['rope'][1])
 if v == 0:
  for x in range(8, 46, 9):
   y = sag(x) + 1
   c.set(x, y, RAMPS['rope'][1])
   blob(c, [(x + .5, y + 5.5, 3.6, 3.4)], PAPER)
   for ry in (y + 4, y + 7): c.hline(x - 2, x + 3, ry, PAPER[1])   # the ribs of the frame
   c.hline(x - 1, x + 2, y + 2, MARIGOLD[1]); c.hline(x - 1, x + 2, y + 9, MARIGOLD[1])
   c.vline(x, y + 10, y + 12, PAPER[2]); c.vline(x + 1, y + 10, y + 11, PAPER[1])
 elif v == 1:
  for x in range(3, 49):
   y = sag(x)
   for d in (0, 1): c.set(x, y + d, MARIGOLD[3 - (x + d) % 3])
   if x % 4 == 0:
    for k in range(1, 5): c.set(x, y + 1 + k, LEAF7[4 if k < 3 else 3])
  for x in (10, 25, 40):                           # strands hanging down
   for k in range(2, 12): c.set(x, sag(x) + k, MARIGOLD[2 + k % 2])
 else:
  colours = [RAMPS['paintblue7'][4], '#e8e2d2', '#b33a2a', '#e0b84a']
  for i, x in enumerate(range(4, 47, 5)):
   y = sag(x + 2)
   for k in range(6):
    c.hline(x + k // 2, x + 4 - k // 2, y + 1 + k, colours[i % 4])
 c.rim(w)
 return c.image()



def _ring(cx, cy, rx, ry, x, y):
 u, v = (x + .5 - cx) / rx, (y + .5 - cy) / ry
 return u * u + v * v


def wrestling_ring(v=0):
 """Ground marked out for a bout, about 5 m across, flat under the wrestlers' feet.

 0: a circle of raked sand, kurash and ssireum. 1: a sumo ring, straw bales
 sunk in a raised clay floor. 2: an akhara's dug pit of red earth. 3: a rope
 on stakes round trodden grass, for oil wrestling and anywhere else.
 """
 W, H = 86, 50
 c = Canvas(W, H)
 cx, cy, rx, ry = W / 2, 24, 40, 21
 sand, clay, red, straw = RAMPS['sandstone'], RAMPS['buffclay7'], RAMPS['redearth7'], RAMPS['straw']
 if v == 1:
  # The clay floor, its top seen from above and its front face standing square on.
  for y in range(2, 43): c.hline(2, W - 3, y, clay[6] if y < 4 else clay[5])
  for y in range(43, 49): c.hline(2, W - 3, y, clay[3] if y < 46 else clay[2])
  for y in range(2, 43):
   for x in range(2, W - 2):
    r = _ring(cx, 22, 30, 15, x, y)
    if 0.78 < r <= 1.14:
     seam = int((x - cx) * 0.6) % 6 == 0
     c.set(x, y, straw[3] if seam or r > 1.04 else straw[6] if y < 20 else straw[5])
    elif r <= 0.78: c.set(x, y, clay[6])
  for x in (cx - 5, cx + 4): c.vline(x, 20, 23, '#f4f2ea')     # the two start lines
  c.rim(clay)
  return c.image()
 if v == 3:
  w, rope = RAMPS['ash7'], RAMPS['rope']
  from math import cos, sin, pi
  stakes = [(round(cx + rx * cos(a)), round(cy + ry * sin(a))) for a in [i * 2 * pi / 10 for i in range(10)]]
  for i, (x, y) in enumerate(stakes):
   nx, ny = stakes[(i + 1) % 10]
   c.line((x, y - 7), (nx, ny - 7), rope[1]); c.line((x, y - 6), (nx, ny - 6), rope[3])
  for x, y in stakes:
   c.rect(x, y - 9, x + 1, y, w[5]); c.vline(x + 2, y - 9, y, w[2]); c.set(x, y - 10, w[6])
  return c.image()
 base = sand if v == 0 else red
 for y in range(H):
  for x in range(W):
   r = _ring(cx, cy, rx, ry, x, y)
   if r > 1.0: continue
   if r > 0.86: c.set(x, y, base[3] if y > cy else base[5])      # the raised lip
   elif v == 2 and _ring(cx, cy + 4, rx * 0.92, ry * 0.9, x, y) > 1: c.set(x, y, base[3])   # the dug pit's far wall in shadow
   else: c.set(x, y, base[5] if v == 2 else base[6])
 for x0, y0 in ((cx - 20, cy - 6), (cx + 13, cy + 5)):   # scuffs where feet have dug in
  c.hline(x0, x0 + 4, y0, base[4]); c.hline(x0 + 1, x0 + 3, y0 + 1, base[4])
 c.rim(base)
 return c.image()


def _stone(c, x0, y0, x1, y1, ramp, round_top=False, cap=True):
 """An upright stone seen square on: lit face, shaded right edge, a lit top."""
 for y in range(y0, y1 + 1):
  inset = 1 if round_top and y == y0 else 0
  c.hline(x0 + inset, x1 - inset, y, ramp[4] if y > y0 + 1 else ramp[5])
  c.set(x1 - inset, y, ramp[2]); c.set(x0 + inset, y, ramp[5])
 if cap: c.hline(x0 + (1 if round_top else 0), x1 - (2 if round_top else 1), y0, ramp[6])
 c.hline(x0, x1, y1, ramp[2])


def _tufts(c, xs, base, tall=3):
 """Grass left long at a grave's foot, a few strands to a clump."""
 for i, x in enumerate(xs):
  h = 2 + jitter(x, base) % tall
  c.vline(x, base - h, base, TURF[3 + jitter(x, i) % 2]); c.set(x, base - h, TURF[6])
  if i % 2: c.vline(x + 1, base - h + 2, base, TURF[2])


def _earth(c, cx, gy, rx, ry, ramp, h=None, power=0.6):
 """A heaped grave raised from the ground, not a ball set on it.

 The base is an ellipse on the ground centred on (cx, gy), `ry` its
 foreshortened depth; each point rises to h * (1 - r^2)^power and is drawn
 back to front, lit by its slope. The foot meets the grass at mid-tone,
 which is what keeps a mound from reading as an orb.
 """
 from math import sqrt
 h = ry * 1.3 if h is None else h
 L = (-0.62, -0.12, 0.78)
 z = lambda x, y: h * max(0.0, 1 - ((x - cx) / rx) ** 2 - ((y - gy) / ry) ** 2) ** power
 for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
  last = None
  y = gy - ry
  while y <= gy + ry:
   if ((x + .5 - cx) / rx) ** 2 + ((y - gy) / ry) ** 2 <= 1:
    zz = z(x + .5, y)
    dx = (z(x + 1, y) - z(x, y))
    dy = (z(x + .5, y + .25) - z(x + .5, y - .25)) * 2 * ry / rx
    n = sqrt(dx * dx + dy * dy + 1)
    lam = (-dx * L[0] - dy * L[1] + L[2]) / n
    tone = ramp[max(1, min(len(ramp) - 1, round(2 + max(0, lam) ** 1.4 * (len(ramp) - 2.4))))]
    sy = round(y - zz)
    top = sy if last is None else min(last + 1, sy)
    for yy in range(top, sy + 1): c.set(x, yy, tone)
    last = sy if last is None else max(last, sy)
   y += 0.25


LOAM = ['#2e2318', '#46351f', '#5f4a2a', '#7a6036', '#957746', '#ae8f5a', '#c6a873']
SANDY = ['#3a2c1e', '#56432d', '#74603f', '#927b52', '#ad9667', '#c6b081', '#ddc89d']


def grave_mound(v=0):
 """Graves as the town keeps them, about 2 m long, 17 px a metre.

 0: a Chinese grave, a heaped mound with a sod on its crown, a stele and an
 offering slab. 1: the same grown over, the stele leaning. 2: a barrow or
 kurgan, turfed, kerbed with stones. 3: a Muslim grave, a long low mound with
 a stone at the head and foot. 4: an Ottoman grave, a stone kerb, a turbaned
 headstone. 5: a Korean bongbun, a turf mound with a bank behind, a stone
 table and two posts. 6: a Japanese gorinto, five stones stacked on a plinth.
 7: a wooden cross on a heaped grave. 8: a headstone with the grave before it.
 9: a West African grave, the dead's pots and bowls set on the mound.
 10: a cairn. 11: a hero stone at a cremation ground, South Asia. 12: an
 Andean chullpa, a stone tomb tower with a small door.
 """
 earth, stone, grass = RAMPS['buffclay7'], RAMPS['limestone'], LEAF7
 grey, red = RAMPS['granite'], RAMPS['redearth7']
 if v in (0, 1):
  # A Chinese grave: a heaped mound with a sod set on its crown, the stele
  # before it and a slab for the offerings. Untended, it grows over.
  c = Canvas(48, 36)
  _earth(c, 24, 21, 19, 7, LOAM if v == 0 else TURF, h=12)
  if v == 0:
   blob(c, [(24, 9.5, 5, 1.8)], TURF, rim=False, hard=True)
  else:
   for x in range(7, 42, 3): _tufts(c, (x,), 15 + abs(x - 24) // 3 + jitter(x) % 4, tall=4)
  lean = 1 if v == 1 else 0
  for y in range(13, 29):
   dx = lean if y < 20 else 0
   half = 5 if y > 14 else 4
   c.hline(24 - half + dx, 23 + half + dx, y, grey[4] if y > 15 else grey[5])
   c.set(23 + half + dx, y, grey[2]); c.set(24 - half + dx, y, grey[5])
  c.hline(21 + lean, 26 + lean, 12, grey[6])
  c.rect(17, 29, 30, 30, grey[3]); c.hline(17, 30, 29, grey[5]); c.hline(17, 30, 31, grey[1])
  if v == 0:
   for y in range(16, 27, 2): c.set(24, y, '#b23a26')
   c.rect(13, 32, 34, 33, stone[5]); c.hline(13, 34, 32, stone[6]); c.hline(13, 34, 34, stone[2])
   for x, col in ((17, '#d4642a'), (19, '#e0a030'), (30, '#c03a2a')): c.set(x, 31, col); c.set(x + 1, 31, col)
  soft_outline(c, LOAM[1] if v == 0 else TURF[1], LOAM[3] if v == 0 else TURF[3])
  return c.image()
 if v == 2:
  c = Canvas(58, 34)
  _earth(c, 29, 22, 26, 8, TURF, h=14)
  for i, x in enumerate(range(4, 55, 5)):
   y = 22 + round(8 * max(0, 1 - ((x - 29) / 26) ** 2) ** 0.5)
   blob(c, [(x, y, 2.6, 1.9)], grey if i % 3 else stone, rim=False, hard=True)
  soft_outline(c, TURF[1], TURF[3])
  return c.image()
 if v == 3:
  # A long low mound, a stone at the head taller than the one at the foot.
  c = Canvas(46, 30)
  _earth(c, 23, 21, 16, 4, SANDY, h=5)
  for x in range(14, 33, 4): c.set(x + jitter(x) % 2, 16 + jitter(x, 1) % 2, SANDY[6])
  for i, x in enumerate(range(8, 39, 3)):
   blob(c, [(x, 24.5, 1.9, 1.4)], grey if i % 2 else stone, rim=False, hard=True)
  for y in range(2, 26):                                       # the headstone, coming to a point
   half = min(3, (y - 1) // 2)
   c.hline(5 - half, 5 + half, y, stone[5] if y < 5 else stone[4]); c.set(5 + half, y, stone[2]); c.set(5 - half, y, stone[6])
  c.rect(39, 15, 41, 25, stone[4]); c.vline(41, 15, 25, stone[2]); c.hline(39, 41, 15, stone[6])
  soft_outline(c, SANDY[1], SANDY[3])
  return c.image()
 if v == 4:
  c = Canvas(40, 36)
  marble = ['#3a3a3c', '#5c5d60', '#828488', '#a7aaae', '#c8cbcd', '#e2e4e4', '#f4f5f2']
  for y in range(22, 31): c.hline(6, 33, y, TURF[4] if y < 24 else TURF[3])
  for x in range(8, 32, 3): c.vline(x, 24 + jitter(x) % 4, 26 + jitter(x) % 4, TURF[5])
  for x, col in ((12, '#c8443a'), (20, '#e8d070'), (27, '#c8443a')): c.set(x, 25, col)
  for y in range(20, 32):
   for x in (5, 34): c.set(x, y, marble[4])
  c.hline(5, 34, 20, marble[6]); c.hline(5, 34, 21, marble[4]); c.hline(5, 34, 31, marble[3]); c.hline(5, 34, 32, marble[2])
  _stone(c, 2, 11, 9, 32, marble)
  for y in (15, 18, 21, 24): c.hline(4, 7, y, marble[2])      # the lettering
  # The turban that tells a man's rank, wound and capped.
  blob(c, [(5.5, 7, 5, 4.2)], marble, rim=False, hard=True)
  for x in range(2, 10, 2): c.set(x, 7 + (x % 4 == 2), marble[3])
  c.hline(4, 7, 2, marble[6]); c.hline(2, 9, 10, marble[2])
  _stone(c, 32, 16, 35, 32, marble, round_top=True)
  c.rim(marble)
  return c.image()
 if v == 5:
  # A bongbun: a round turf mound with a low bank curving round behind it,
  # a stone table for the offerings in front and a stone post either side.
  from math import cos, sin, radians
  c = Canvas(62, 50)
  from math import atan2
  for y in range(8, 38):                                       # one ridge, lit on its upper-left crest
   for x in range(0, 62):
    r = _ring(31, 29, 27, 17, x, y) ** 0.5
    if not 0.74 < r <= 1 or (y > 30 and abs(x - 31) < 22): continue
    t = (r - 0.74) / 0.26
    lit = 0.5 + 0.5 * cos(atan2(y - 29, x - 31) + 2.3)
    up = 1 - abs(2 * t - 1)
    c.set(x, y, TURF[max(1, min(6, round(1 + up * 3 + (lit if t > 0.5 else 1 - lit) * 2)))])
  _earth(c, 31, 30, 18, 8, TURF, h=15)
  t = 39
  for y in range(t, t + 3): c.hline(22, 40, y, grey[6] if y == t else grey[5])  # the table, its top
  c.hline(22, 40, t + 3, grey[3]); c.hline(22, 40, t + 4, grey[2]); c.vline(40, t, t + 4, grey[2])
  c.rect(24, t + 5, 25, t + 6, grey[1]); c.rect(37, t + 5, 38, t + 6, grey[1])
  c.rect(29, t + 6, 33, t + 7, grey[4]); c.hline(29, 33, t + 6, grey[5]); c.hline(29, 33, t + 8, grey[2])
  for px in (6, 56):                                           # the paired posts
   c.rect(px - 1, 25, px + 1, 43, grey[4]); c.vline(px - 1, 25, 43, grey[5]); c.vline(px + 1, 25, 43, grey[2])
   blob(c, [(px + 0.5, 22.5, 2.8, 3)], grey, rim=False, hard=True)
   c.rect(px - 2, 43, px + 2, 45, grey[3]); c.hline(px - 2, px + 2, 43, grey[5]); c.hline(px - 2, px + 2, 45, grey[1])
  soft_outline(c, TURF[1], TURF[3])
  return c.image()
 if v == 6:
  c = Canvas(24, 44)
  moss = ['#24291c', '#3a4127', '#566035', '#717a44', '#8e9658', '#acb174', '#c9cb94']
  c.rect(1, 37, 22, 41, grey[4]); c.hline(1, 22, 36, grey[6]); c.hline(1, 22, 41, grey[2])
  c.rect(4, 32, 19, 36, grey[4]); c.hline(4, 19, 31, grey[6]); c.set(19, 33, grey[2])
  c.rect(6, 22, 17, 31, grey[4]); c.hline(6, 17, 22, grey[5]); c.vline(17, 22, 31, grey[2])  # the cube, earth
  blob(c, [(11.5, 17, 6, 5)], grey, rim=False, hard=True)                                   # the sphere, water
  for y in range(9, 13): c.hline(11 - (y - 8) * 2, 12 + (y - 8) * 2, y, grey[5] if y < 11 else grey[3])  # the roof, fire
  c.hline(4, 19, 13, grey[2])
  blob(c, [(11.5, 7, 4, 2)], grey, rim=False, hard=True)                                    # the bowl, wind
  blob(c, [(11.5, 3, 2, 2.5)], grey, rim=False, hard=True)                                  # the jewel, space
  for x, y in ((7, 30), (8, 29), (15, 24), (2, 40), (20, 39)): c.set(x, y, moss[3])
  c.rim(grey)
  return c.image()
 if v == 7:
  c = Canvas(40, 36)
  wood = RAMPS['oak7']
  _earth(c, 20, 30, 15, 4.5, TURF, h=6)
  c.rect(18, 4, 21, 28, wood[4]); c.vline(21, 4, 28, wood[2]); c.vline(18, 4, 28, wood[5])
  c.rect(11, 10, 28, 13, wood[4]); c.hline(11, 28, 10, wood[6]); c.hline(11, 28, 13, wood[2])
  c.hline(18, 21, 4, wood[6])
  for y in range(6, 27, 4): c.set(19, y, wood[3])
  soft_outline(c, TURF[1], TURF[3])
  return c.image()
 if v == 8:
  c = Canvas(36, 44)
  slate = ['#22262a', '#353b41', '#4b535a', '#636c73', '#7d868c', '#99a1a5', '#b8bec0']
  for y in range(3, 31):
   half = 9 - (3 if y < 4 else 1 if y < 6 else 0)
   c.hline(18 - half, 17 + half, y, slate[4] if y > 5 else slate[5]); c.set(17 + half, y, slate[2]); c.set(18 - half, y, slate[5])
  for y in (10, 13, 16): c.hline(13, 22, y, slate[2])          # the lettering
  c.hline(15, 20, 19, slate[2])
  for x, y in ((11, 21), (12, 22), (24, 7), (23, 24)): c.set(x, y, '#9a9a4a')  # lichen
  _earth(c, 18, 37, 14, 4, TURF, h=5)                               # the grave itself, in front
  soft_outline(c, slate[1], slate[3])
  return c.image()
 if v == 9:
  # The dead's own pots stand on the grave, and plates are set round it.
  c = Canvas(46, 34)
  _earth(c, 23, 27, 20, 5, red, h=7)
  pots = RAMPS['terracotta7']
  for cx, top, ws in ((12, 12, [2, 3, 5, 5, 3]), (23, 6, [2, 2.5, 6, 6.5, 4]), (34, 13, [2, 3, 4.5, 4, 2.5])):
   bottom = top + 4 * len(ws) - 3
   revolve(c, cx, belly(top, bottom, ws), pots, foot=1)
   c.hline(int(cx - ws[0]), int(cx + ws[0]), top, pots[1]); c.set(cx, top, pots[0])
  for cx in (17, 29):                                           # bowls turned over
   blob(c, [(cx, 29, 3.2, 1.8)], RAMPS['creamglaze7'], rim=False, hard=True)
  soft_outline(c, red[1], red[3])
  return c.image()
 if v == 10:
  c = Canvas(40, 30)
  stones = [(20, 9, 4, 3), (14, 14, 5, 3.5), (25, 14, 5, 3.5), (9, 20, 5, 3.5), (19, 20, 5.5, 4), (30, 20, 5, 3.5), (5, 25, 4, 3), (14, 25, 5, 3.5), (24, 25, 5, 3.5), (34, 25, 4, 3)]
  for i, (x, y, rx, ry) in enumerate(stones):
   blob(c, [(x, y, rx, ry)], (grey, stone, RAMPS['sandstone'])[jitter(i) % 3], rim=False, hard=True)
  c.rim(grey)
  return c.image()
 if v == 11:
  c = Canvas(26, 40)
  sand = RAMPS['sandstone']
  c.rect(1, 33, 24, 37, sand[3]); c.hline(1, 24, 32, sand[5]); c.hline(1, 24, 37, sand[1])
  _stone(c, 4, 4, 21, 32, sand, round_top=True)
  for y0 in (9, 18, 26):                                         # three carved registers
   c.hline(6, 19, y0 - 1, sand[2]); c.hline(6, 19, y0 + 6 if y0 < 26 else y0 + 4, sand[6])
  for x, y in ((9, 11), (14, 12), (10, 20), (15, 21), (12, 28)):  # figures in relief
   c.vline(x, y, y + 4, sand[6]); c.vline(x + 1, y + 1, y + 4, sand[2]); c.set(x, y - 1, sand[6])
  c.set(12, 6, '#c8501c'); c.set(13, 6, '#e07a2a')              # vermilion smeared on it
  c.rim(sand)
  return c.image()
 c = Canvas(30, 44)
 field = ['#2a2420', '#40362e', '#5a4c40', '#756454', '#917e6a', '#ab9882', '#c6b49c']
 # Built wider at the top than the foot, coursed stone under a jutting cornice.
 for y in range(8, 42):
  half = 9 + (42 - y) // 9
  c.hline(15 - half, 14 + half, y, field[4] if y < 30 else field[3])
  if y % 4 == 0: c.hline(15 - half, 14 + half, y, field[2])
  else:
   for x in range(15 - half + (y // 4) % 2 * 3, 15 + half, 6): c.set(x, y, field[2])
  c.set(14 + half, y, field[2]); c.set(15 - half, y, field[5])
 c.rect(1, 5, 28, 7, field[5]); c.hline(1, 28, 4, field[6]); c.hline(1, 28, 7, field[2])
 blob(c, [(14.5, 4, 11, 3)], field, rim=False, hard=True)
 c.rect(12, 36, 16, 41, '#1a1410'); c.hline(11, 17, 35, field[5])  # the door the dead were passed through
 c.rim(field)
 return c.image()

TURF = ['#26331d', '#344428', '#435634', '#556b40', '#68804c', '#7f9659', '#9aad6c']
SKIN = ['#4a3a26', '#7a6444', '#a88e64', '#cdb68a', '#e6d4ae']


def festival_drum(v=0):
 """A drum set down for a festival, played where it stands.

 0: a nagora pair, two clay kettledrums with skin heads, from Central Asia
 to the Mediterranean. 1: a barrel drum tilted on a wooden stand, East Asia.
 2: a tall standing drum, its skin pegged and corded, Africa and the Americas.
 """
 c = Canvas(28, 26)
 clay, wood, rope = RAMPS['terracotta7'], RAMPS['oak7'], RAMPS['rope']
 if v == 0:
  for cx, r, top in ((8, 6, 14), (20, 5, 16)):
   blob(c, [(cx, top + 4, r, 5)], clay, rim=False)
   oval(c, cx, top, r, 2.2, SKIN[3], SKIN[2], SKIN[4])
   for x in (cx - r + 1, cx + r - 1): c.vline(x, top + 1, top + 5, rope[1])
  c.rim(clay)
  return c.image()
 if v == 1:
  for x0, x1 in ((4, 10), (18, 24)):              # the stand's legs
   c.line((x0, 25), (x1, 12), wood[2]); c.line((x1, 25), (x0, 12), wood[3])
  for y in range(5, 21):
   half = 9 + (2 if 8 < y < 17 else 1 if 6 < y < 19 else 0)
   c.hline(14 - half, 13 + half, y, LACQUER7[4] if y < 10 else LACQUER7[3] if y < 16 else LACQUER7[2])
  oval(c, 14, 6, 9, 3, SKIN[4], SKIN[2], SKIN[4])
  for x in range(5, 24, 3): c.set(x, 9, '#e0b84a'); c.set(x, 18, '#e0b84a')   # the tacks
  c.rim(LACQUER7)
  return c.image()
 for y in range(5, 25):
  half = 6 if y < 14 else 5 if y < 18 else 4
  c.hline(14 - half, 13 + half, y, wood[5] if y < 8 else wood[4] if y < 20 else wood[3])
 oval(c, 14, 5, 6, 2, SKIN[4], SKIN[2], SKIN[4])
 for i, x in enumerate(range(9, 20, 2)):         # cords down to the pegs
  c.line((x, 7), (x + (1 if i % 2 else -1), 14), rope[1])
  c.set(x, 14, wood[1])
 c.rim(wood)
 return c.image()


def censer(v=0, f=0):
 """Incense burning before the dead, a thread of smoke going up.

 0: a bronze tripod burner with sticks of incense, China and Korea.
 1: a clay bowl of smouldering resin, anywhere else.
 """
 from math import sin
 c = Canvas(14, 26)
 bronze, clay = RAMPS['copper7'], RAMPS['terracotta7']
 if v == 0:
  for x in (3, 10): c.vline(x, 21, 24, bronze[2])
  blob(c, [(7, 19, 5, 3.4)], bronze, rim=False)
  c.hline(2, 12, 16, bronze[5]); c.hline(3, 11, 17, bronze[3])
  c.rim(bronze)
  for x, top in ((5, 11), (7, 10), (9, 12)):      # the sticks, their tips alight
   c.vline(x, top, 15, '#6a2a18'); c.set(x, top, '#f0a040')
  top = 9
 else:
  blob(c, [(7, 21, 5, 3)], clay, rim=False)
  oval(c, 7, 18.6, 4, 1.2, '#3a2a20', clay[3])
  c.rim(clay)
  c.set(6, 18, '#f0a040'); c.set(8, 18, '#c05a20')
  top = 17
 # The smoke drifts as it rises and thins out toward the top.
 for k in range(top - 1, 1, -1):
  x = 7 + round(1.4 * sin((k + f * 2) * 0.55))
  if k < top - 9 and (k + f) % 3 == 0: continue
  c.set(x, k, '#e4dfd6' if k > 5 else '#cfc9be')
 return c.image()


def trade_goods(v=0):
 """Goods laid out for sale, about a metre across.

 0: bolts of dyed cloth. 1: bars of rock salt, tied in pairs.
 2: bales sewn up in hide and roped.
 """
 c = Canvas(30, 18)
 if v == 0:
  colours = [RAMPS['paintblue7'], LACQUER7, ['#2a2408', '#4a4010', '#7a6a18', '#a8922a', '#cdb44a', '#e2cc6c', '#f0e09a'], RAMPS['linen7']]
  for i, (x, y) in enumerate(((3, 12), (11, 12), (19, 12), (7, 7), (15, 7))):
   r = colours[i % 4]
   c.rect(x, y, x + 8, y + 4, r[4]); c.hline(x, x + 8, y, r[6]); c.hline(x, x + 8, y + 4, r[2])
   oval(c, x + 8.5, y + 2.5, 1.6, 2.4, r[5], r[3])
  c.rim(RAMPS['linen7'])
  return c.image()
 if v == 1:
  salt = ['#5a5a58', '#8e8c86', '#bdbab2', '#dedbd2', '#f2f0ea']
  for x, y in ((2, 11), (15, 11), (8, 5)):
   c.rect(x, y, x + 12, y + 5, salt[3]); c.hline(x, x + 12, y, salt[4]); c.hline(x, x + 12, y + 5, salt[1])
   for k in (x + 3, x + 9): c.vline(k, y, y + 5, RAMPS['rope'][1])
  c.rim(salt)
  return c.image()
 hide = ['#2e2418', '#5a4632', '#806448', '#a3835f', '#bf9f78']
 for cx, cy, rx in ((9, 11, 7), (21, 12, 6), (15, 6, 6)):
  blob(c, [(cx, cy, rx, 4.2)], hide, rim=False)
  c.vline(cx, cy - 4, cy + 4, RAMPS['rope'][2]); c.hline(cx - rx + 1, cx + rx - 1, cy, RAMPS['rope'][2])
 c.rim(hide)
 return c.image()


FEASTING = {
 'trestle-table': trestle_table,
 'round-table': round_table,
 'food-tray': food_tray,
 'floor-carpet': floor_carpet,
 'dining-couch': dining_couch,
 'festoon': festoon,
 'wrestling-ring': wrestling_ring,
 'grave-mound': grave_mound,
 'festival-drum': festival_drum,
 'censer': censer,
 'trade-goods': trade_goods,
}
