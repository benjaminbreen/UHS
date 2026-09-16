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
 c.outline(RAMPS[st][0])
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
 c.outline(w[0])
 g, s = RAMPS['grass'], RAMPS[st]
 grass(c, [(2, 33, 3), (7, 37, 2), (44, 36, 3), (50, 33, 2), (16, 40, 2), (33, 41, 2)])
 for x, y in [(4, 38), (10, 40), (48, 39), (39, 41)]:                # pebbles
  c.set(x, y, s[2]); c.set(x + 1, y, s[3])
 for x, y in [(9, 20), (10, 20), (41, 26), (14, 29), (35, 17)]:      # moss
  if c.get(x, y): c.set(x, y, g[1])
 return c.image()


def grinder(v=0):
 """A saddle quern: a flat slab with the handstone resting on it."""
 p = RAMPS[['granite', 'sandstone', 'limestone'][v]]
 keys = {'o': p[0], 'E': p[1], 'e': p[2], 'd': p[3], 't': p[4], 'T': p[5],
         'f': RAMPS['straw'][5], 'g': RAMPS['grass'][1], 'G': RAMPS['grass'][2]}
 c = draw_grid([
  '............ooo...',
  '..........ooTTTo..',
  '..........oTTTto..',
  '...ooooooooteeoo..',
  '..oTTTTTTTTTTTeo..',
  '.oTTtdddddtTTTTTo.',
  '.oTtdffdddttttTto.',
  '.oteddddddteeeeto.',
  '.oeEeeeeeeeeeeEeo.',
  '..oEEEEEEEEEEEoo..',
  'g..ooooooooooo..G.',
 ], keys)
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
 c.outline(m[0])
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
 c.outline(m[0])
 return c.image()


def drying_rack(v=0, layer='all'):
 """Two lashed X-frames carrying a pole, hung with split fish or cloth.

 2.6 m wide and head-high: the pole clears a standing figure. The hangings are
 a separate layer so the renderer can sway them against a frame that stays
 rigid; a rack whose legs move is a rack falling over.
 """
 c = Canvas(46, 36)
 w = RAMPS[WOOD7[v]] if False else RAMPS[WOOD[v]]
 r = RAMPS['rope']
 pole_y, foot = 10, 35
 hangs = [(16, 12), (22, 15), (28, 11), (33, 14)]
 if layer != 'hang':
  for lx in (10, 35):
   for dx in (-1, 1):                              # two legs crossing at the top
    x0, y0 = lx - dx * 2, pole_y - 4
    x1, y1 = lx + dx * 9, foot
    for i in range(y1 - y0 + 1):
     t = i / (y1 - y0)
     x = round(x0 + (x1 - x0) * t)
     c.set(x, y0 + i, w[4] if dx < 0 else w[2])
     c.set(x + 1, y0 + i, w[2] if dx < 0 else w[1])
    c.set(x1, y1, w[1]); c.set(x1 + 1, y1, w[0])
  c.rect(1, pole_y - 1, 44, pole_y + 1, w[3])      # the pole
  c.hline(1, 44, pole_y - 1, w[5]); c.hline(1, 44, pole_y + 1, w[1])
  for x in range(3, 44, 6):
   if jitter(x) % 3 == 0: c.set(x, pole_y, w[2])
  for lx in (10, 35):                              # lashing over pole and legs
   for i, y in enumerate((pole_y - 2, pole_y - 1, pole_y, pole_y + 1)):
    c.hline(lx - 2, lx + 2, y, r[3] if i % 2 else r[1])
   c.set(lx - 3, pole_y, r[1]); c.set(lx + 3, pole_y - 1, r[1])
  # The knot stays with the pole. Only what hangs below it swings, or the
  # cord appears to come untied every time the wind moves.
  for x, _ in hangs: c.set(x, pole_y + 2, r[1])
 if layer != 'frame':
  for i, (x, h) in enumerate(hangs):
   c.set(x, pole_y + 3, r[2])
   top = pole_y + 4
   if v == 2:                                      # hanks of dyed cloth
    cloth = RAMPS['straw'] if i % 2 else RAMPS['palewood']
    c.rect(x - 2, top, x + 2, top + h, cloth[4])
    c.vline(x - 2, top, top + h, cloth[2]); c.vline(x + 2, top, top + h, cloth[1])
    c.vline(x - 1, top + 1, top + h - 1, cloth[5])
    c.hline(x - 2, x + 2, top, cloth[5]); c.hline(x - 2, x + 2, top + h, cloth[1])
   else:                                           # split fish, tail down
    f = RAMPS['limestone'] if v == 0 else RAMPS['sandstone']
    for k in range(h + 1):
     t = k / h
     half = 0 if t < .10 else 2 if t < .60 else 1
     c.hline(x - half, x + half, top + k, f[4] if k % 4 else f[3])
     c.set(x - half, top + k, f[2]); c.set(x + half, top + k, f[1])
     if .25 < t < .75 and k % 2: c.set(x, top + k, f[5])
    c.set(x - 2, top + h + 1, f[2]); c.set(x + 2, top + h + 1, f[2])
    c.set(x - 1, top + h + 1, f[3]); c.set(x + 1, top + h + 1, f[3])
 c.outline(w[0])
 if layer != 'hang':
  grass(c, [(1, 35, 3), (21, 35, 2), (44, 35, 3)])
 return c.image()
