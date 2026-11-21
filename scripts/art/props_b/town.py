"""Town well and hand tools. Same ruler: ~17 source pixels to the metre."""
from .core import Canvas, RAMPS, STONE, WOOD, draw_grid, jitter, dither, grass
from .wells import kerb, shaft


def town_well(v=0):
 """A public wellhead, 3 m across, with a swing arm and a bucket on the rope."""
 c = Canvas(54, 45)
 cx, cy = 26, 14
 st = STONE[v]
 kerb(c, cx, cy, 25, 9, 19, 6.8, 18, st, courses=4, across=8, blocks=13)
 shaft(c, cx, cy, 19, 6.8, st)
 c.rim(RAMPS[st])
 w = RAMPS[WOOD[(v + 1) % 3]]
 c.rect(43, 4, 46, 30, w[3])                      # post
 c.vline(43, 4, 30, w[1]); c.vline(44, 5, 29, w[4]); c.vline(46, 4, 30, w[1])
 c.rect(41, 2, 48, 4, w[2]); c.hline(41, 48, 2, w[4])
 c.rect(22, 3, 43, 5, w[3])                       # swing arm over the mouth
 c.hline(22, 43, 3, w[5]); c.hline(22, 43, 5, w[1])
 for i in range(4):                               # brace
  c.set(40 - i, 6 + i, w[2]); c.set(40 - i, 7 + i, w[1])
 r = RAMPS['rope']
 for y in range(6, 13): c.set(24, y, r[3] if y % 2 else r[1])
 c.rect(20, 13, 29, 22, w[2])                     # bucket
 c.rect(21, 14, 28, 21, w[3]); c.vline(21, 14, 21, w[4]); c.vline(28, 14, 21, w[1])
 c.hline(20, 29, 13, w[5]); c.hline(20, 29, 22, w[1])
 for y in (15, 20): c.hline(20, 29, y, RAMPS['iron'][3])
 c.set(24, 12, RAMPS['iron'][4]); c.set(24, 13, RAMPS['iron'][4])
 c.rim(w)
 g, s = RAMPS['grass'], RAMPS[st]
 grass(c, [(2, 33, 3), (7, 37, 2), (44, 36, 3), (50, 33, 2), (16, 40, 2), (33, 41, 2)])
 for x, y in [(4, 38), (10, 40), (48, 39), (39, 41)]:                # pebbles
  c.set(x, y, s[2]); c.set(x + 1, y, s[3])
 for x, y in [(9, 20), (10, 20), (41, 26), (14, 29), (35, 17)]:      # moss
  if c.get(x, y): c.set(x, y, g[1])
 return c.image()


def grinder(v=0):
 """A saddle quern: a sculpted 3/4 hollowed stone slab with a cylindrical
 rubbing stone and freshly ground meal spilling into the basin."""
 from .core import soft_outline
 from .solid import K, disc, lathe
 c = Canvas(26, 18)
 stone = RAMPS[['granite', 'sandstone', 'limestone'][v % 3]]
 meal = ['#b89850', '#dfc074', '#f2dc9c', '#fcf2cf'] if v % 2 == 0 else ['#a87a38', '#cfa052', '#ecc478', '#fae2a8']

 disc(c, 13.5, 13.2, 11.2, 4.2, meal[1])
 disc(c, 13.0, 13.0, 9.8, 3.5, meal[2])

 for y in range(6, 15):
  for x in range(3, 23):
   u = (x - 12.5) / 10.0
   v_el = (y - 9.5) / 4.2
   if u * u + v_el * v_el > 1.08:
    continue
   if y >= 12:
    tone = 2 if u < 0.2 else 1
   elif abs(u) > 0.78 or v_el < -0.65:
    tone = 6 if (u + v_el < -0.15) else (5 if u < 0.35 else 3)
   else:
    basin = u * 0.3 + v_el * 0.4
    tone = 3 if basin < -0.05 else (4 if basin < 0.25 else 5)
    if (x * 5 + y * 3) % 6 == 0:
     tone = max(2, tone - 1)
   c.set(x, y, stone[tone])

 for mx, my in ((11, 9), (12, 9), (13, 9), (14, 9), (12, 10), (13, 10), (14, 10), (15, 10), (13, 11), (14, 11)):
  c.set(mx, my, meal[3] if (mx + my) % 2 == 0 else meal[2])

 for d in range(8):
  rx = 8 + (d // 2)
  ry = 4 + d
  end = 1 if d in (0, 7) else 0
  c.set(rx - 1, ry, stone[6 - end])
  c.set(rx, ry, stone[5 - end])
  c.set(rx + 1, ry, stone[4 - end])
  c.set(rx + 2, ry, stone[2])

 soft_outline(c, stone[0], stone[3])
 return c.image()


def sickle(v=0):
 """A thin crescent blade on a short grip, laid down.

 Drawn as an arc with a falling thickness: stacked rows read as a club.
 """
 from math import atan2, hypot, pi
 c = Canvas(19, 13)
 w = RAMPS[WOOD[v]]
 m = RAMPS['iron'] if v != 2 else RAMPS['copper']
 cx, cy, rad = 9.0, 14.5, 10.0
 for y in range(13):
  for x in range(19):
   X, Y = x + .5 - cx, y + .5 - cy
   r = hypot(X, Y)
   a = atan2(-Y, X)                              # 0 right, pi/2 up
   if not (0.78 < a < 2.62): continue
   t = (a - 0.78) / 1.84                          # 0 at the tip, 1 at the heel
   thick = 0.9 + 2.0 * t
   if not (rad - thick <= r <= rad + 0.6): continue
   band = (r - (rad - thick)) / max(thick, .1)
   c.set(x, y, m[5] if band > .72 else (m[4] if band > .38 else m[2]))
 if v == 1:                                      # a toothed edge
  for x in range(5, 17, 3):
   for y in range(13):
    if c.get(x, y) == m[5]: c.set(x, y, m[3])
 grip = [(2, 11), (3, 11), (4, 10), (5, 10), (6, 9)]
 for i, (x, y) in enumerate(grip):
  c.set(x, y, w[4] if i % 2 else w[3]); c.set(x, y + 1, w[1])
 c.set(6, 10, RAMPS['iron'][2]); c.set(7, 9, RAMPS['iron'][2])
 # Only the back of the blade is outlined: a ring round a two-pixel edge
 # doubles its width and the tool stops reading as thin steel.
 for x in range(19):
  column = [y for y in range(13) if c.get(x, y)]
  if column: c.set(x, column[-1] + 1, m[0])
 return c.image()


def axe(v=0):
 """A hafted blade laid on the ground: felling axe, bronze axe or hoe.

 The head is small against the haft and its edge runs on the diagonal, or it
 reads as a mallet.
 """
 c = Canvas(17, 21)
 w = RAMPS[WOOD[v]]
 m = RAMPS['iron'] if v != 1 else RAMPS['copper']
 haft = [(2, 20), (3, 19), (3, 18), (4, 17), (5, 16), (5, 15), (6, 14),
         (7, 13), (7, 12), (8, 11), (9, 10), (9, 9), (10, 8)]
 for i, (x, y) in enumerate(haft):
  c.set(x, y, w[4]); c.set(x + 1, y, w[2])
  if i % 4 == 0: c.set(x, y, w[5])
 c.set(2, 20, w[1]); c.set(3, 20, w[1])
 if v == 2:                                       # hoe: blade hangs down-right
  rows = {6: (11, 13), 7: (11, 14), 8: (11, 15), 9: (12, 15), 10: (13, 15)}
  lit = {6: 13, 7: 14, 8: 15, 9: 15, 10: 15}
 else:                                            # axe: edge on the diagonal
  rows = {3: (11, 12), 4: (11, 13), 5: (11, 14), 6: (10, 15), 7: (10, 14),
          8: (10, 12)}
  lit = {3: 12, 4: 13, 5: 14, 6: 15, 7: 14, 8: 12}
 for y, (a, b) in rows.items():
  c.hline(a, b, y, m[3])
  c.set(a, y, m[1])                               # the cheek beside the eye
  c.set(lit[y], y, m[5])                          # the cutting edge
  c.set(lit[y] - 1, y, m[4])
 for x, y in [(10, 6), (10, 7), (11, 7), (11, 8)]:
  c.set(x, y, m[1])                               # eye, gripping the haft
 c.set(10, 9, m[2])
 c.rim(m)
 return c.image()


def pick(v=0):
 """A pickaxe laid on the ground beside the axe: same haft, a head that crosses
 it instead of sitting on the end.

 One arm comes to a point and the other to a narrow chisel, so the silhouette
 cannot be read as an axe at tile size.
 """
 c = Canvas(19, 21)
 w = RAMPS[WOOD[v]]
 m = RAMPS['iron'] if v != 1 else RAMPS['granite']
 haft = [(3, 20), (4, 19), (4, 18), (5, 17), (6, 16), (6, 15), (7, 14),
         (8, 13), (8, 12), (9, 11), (10, 10), (10, 9), (11, 8)]
 for i, (x, y) in enumerate(haft):
  c.set(x, y, w[4]); c.set(x + 1, y, w[2])
  if i % 4 == 0: c.set(x, y, w[5])
 c.set(3, 20, w[1]); c.set(4, 20, w[1])
 # The head runs across the haft: pointed arm up-right, chisel arm down-left.
 arm = [(3, 11), (4, 10), (5, 9), (6, 8), (7, 7), (8, 6), (9, 5), (10, 4),
        (11, 3), (12, 2), (13, 2), (14, 3)]
 for i, (x, y) in enumerate(arm):
  c.set(x, y, m[3]); c.set(x, y + 1, m[1])
  if i % 3 == 1: c.set(x, y, m[4])
 # A slight droop at each end, the way a struck head is forged.
 for x, y in [(2, 12), (2, 13), (15, 4), (15, 5)]:
  c.set(x, y, m[2])
 c.set(2, 13, m[1]); c.set(15, 5, m[1])
 c.set(3, 11, m[5]); c.set(14, 3, m[5])           # the two working points
 c.set(4, 10, m[4]); c.set(13, 2, m[4])
 # The eye, a raised collar where the haft passes through.
 c.rect(8, 6, 10, 9, m[2])
 c.set(8, 7, m[4]); c.set(10, 8, m[1])
 c.set(9, 7, m[3]); c.set(9, 8, m[3])
 c.rim(m)
 return c.image()

