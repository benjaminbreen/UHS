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


FEASTING = {
 'trestle-table': trestle_table,
 'round-table': round_table,
 'food-tray': food_tray,
 'floor-carpet': floor_carpet,
 'dining-couch': dining_couch,
 'festoon': festoon,
}
