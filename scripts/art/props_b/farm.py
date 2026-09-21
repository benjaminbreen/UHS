"""Farm implements: what stands in a yard or leans against a barn.

Drawn above life scale, the way this kind of game does it: a water butt stands
higher than a person's waist on the map, not at the eleven pixels a metre and
a half would really be. Legibility and presence beat the tape measure.
"""
from math import cos, hypot, pi, sin
from .core import Canvas, RAMPS, belly, jitter, revolve, soft_outline, grass
from .workshop import WOOD7, streak


def _hoop(c, x0, x1, y, m, thick=2):
 """An iron band: one lit edge, the rest dark, two rivets. A band of mid grey
 reads as tape stuck round the barrel."""
 for k in range(thick):
  for x in range(x0, x1 + 1):
   if not c.get(x, y + k): continue
   c.set(x, y + k, m[5] if k == 0 else m[2] if k == 1 else m[1])
 for x in range(x0, x1 + 1):
  if c.get(x, y + thick): c.set(x, y + thick, m[0])
 for rx in (x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4):
  if c.get(rx, y): c.set(rx, y, m[6])
  if c.get(rx, y + 1): c.set(rx, y + 1, m[1])


def _knots(c, ramp, spots):
 """Knots and nail heads: the small dark marks that stop timber reading flat."""
 for x, y in spots:
  if not c.get(x, y): continue
  c.set(x, y, ramp[1])
  if c.get(x + 1, y): c.set(x + 1, y, ramp[2])
  if c.get(x, y + 1): c.set(x, y + 1, ramp[2])


def water_butt(v=0):
 """A rain butt: a big open cask seen from above the rim, water standing in
 it, a wooden tap near the foot."""
 from .stores import WOOD, IRON, INK, _cask
 c = Canvas(22, 30)
 w = WOOD[v]
 cx = 11.0
 _cask(c, cx, 5, 29, [9.2, 10.2, 10.6, 10.6, 10.2, 9.2], w, (7, 13, 21, 26), staves=4)
 water = RAMPS['water']
 for y in range(1, 10):                          # the open top
  for x in range(0, 22):
   u, t = (x + .5 - cx) / 9.4, (y + .5 - 5.0) / 3.6
   r = u * u + t * t
   if r > 1: continue
   if r > 0.62: c.set(x, y, w[4] if u < 0.3 and t < 0.4 else w[3] if t < 0.5 else w[2])
   else:
    c.set(x, y, water[3] if t < -0.35 else water[4] if u < -0.2 else water[2])
 for x in range(7, 11): c.set(x, 4, water[6])     # sky caught on the surface
 c.set(12, 5, water[5]); c.set(13, 5, water[5])
 c.rect(9, 22, 11, 23, w[3]); c.set(9, 22, w[4])   # the tap
 c.set(12, 23, w[1]); c.set(10, 24, w[1])
 c.outline(INK)
 grass(c, [(0, 31, 3), (21, 31, 2)])
 return c.image()


def milk_churn(v=0):
 """A conical churn: clamped lid, two beads, handles, a dairy number stencilled."""
 c = Canvas(30, 44)
 m = RAMPS[['galvanised7', 'pewter7', 'brasspot7'][v]]
 cx = 14.0
 revolve(c, cx, belly(10, 39, [6.4, 10.0, 12.0, 12.4, 11.6]), m, gloss=2, foot=3)
 for y in (22, 33):
  _hoop(c, 1, 27, y, m)
 for y in range(4, 11):                           # the neck
  half = 6 if y > 6 else 7
  for x in range(14 - half, 14 + half + 1):
   u = (x - 14) / half
   c.set(x, y, m[6] if u < -0.3 else m[4] if u < 0.5 else m[2])
 for x in range(6, 23):                           # the lid on top of it
  u = (x - 14) / 8.0
  c.set(x, 2, m[6] if u < -0.2 else m[4] if u < 0.6 else m[2])
  c.set(x, 3, m[3] if u < 0.4 else m[1])
 c.set(13, 0, m[5]); c.set(14, 0, m[6]); c.set(13, 1, m[3]); c.set(14, 1, m[4])
 for cx2 in (7, 21):                              # the lid clamps
  c.set(cx2, 3, m[2]); c.set(cx2, 4, m[5]); c.set(cx2, 5, m[3]); c.set(cx2, 6, m[1])
 for hx, sign in ((1, 1), (27, -1)):              # the carrying handles
  for k in range(6):
   c.set(hx, 13 + k, m[4] if k else m[6]); c.set(hx + sign, 13 + k, m[2])
  c.set(hx + sign * 2, 13, m[3]); c.set(hx + sign * 2, 18, m[1])
  c.set(hx + sign * 2, 15, m[5])
 for x, y in [(9, 27), (10, 27), (11, 27), (9, 28), (11, 28), (9, 29), (10, 29)]:
  c.set(x, y, m[1])                               # a stencilled number
 for x, y in [(19, 18), (20, 19), (22, 30)]:      # dents catching the light
  if c.get(x, y): c.set(x, y, m[6])
 soft_outline(c, m[0], m[2])
 return c.image()


def _bees(c, frame, spots):
 """Bees on their rounds. Two pixels each — a dark body and a lit back — and
 a third for the blur of the wings on the frames where they are moving fast."""
 from math import cos, sin, pi
 for i, (cx, cy, rx, ry, turn) in enumerate(spots):
  a = (frame / 4 + i / len(spots)) * 2 * pi * turn
  x = round(cx + cos(a) * rx)
  y = round(cy + sin(a) * ry)
  c.set(x, y, '#2a1f08')
  c.set(x + 1, y, '#d8ae4e')
  if frame % 2:
   c.set(x, y - 1, '#e8dcc0')
  else:
   c.set(x + 1, y - 1, '#e8dcc0')


def beehive(v=0, frame=0):
 """A coiled straw skep with its flight board, or a stacked box hive."""
 c = Canvas(48, 48)
 straw = RAMPS['straw']
 w = RAMPS[WOOD7[v]]
 stone = RAMPS['granite']
 if v == 2:
  for x in range(10, 38):                          # the stand it sits on
   c.set(x, 36, w[3]); c.set(x, 37, w[1])
  for lx in (12, 34): c.set(lx, 38, w[2]); c.set(lx, 39, w[0])
  for k, top in enumerate((10, 20, 28)):          # three boxes, stacked
   half = 13 - k
   for y in range(top, top + (10 if k < 2 else 8)):
    for x in range(24 - half, 24 + half + 1):
     u = (x - 24) / half
     c.set(x, y, w[5] if u < -0.4 else w[4] if u < 0.45 else w[2])
    if (y - top) % 3 == 0: streak(c, 24 - half, 24 + half, y, w, 4)
   c.hline(24 - half - 1, 24 + half + 1, top, w[6])
   c.hline(24 - half, 24 + half, top + (9 if k < 2 else 7), w[1])
  for x in range(9, 40): c.set(x, 8, w[6])        # the lid
  for x in range(10, 39): c.set(x, 9, w[3])
  c.hline(19, 29, 7, w[5])
  c.hline(20, 28, 35, w[0])                       # the entrance slot
 else:
  from math import sin, pi
  for y in range(9, 41):                          # a skep: a dome of coils
   t = (y - 9) / 31
   half = round(2 + 14 * sin(min(t * 1.08, 1.0) * pi / 2) ** 0.85)
   band = (y - 9) % 4
   for x in range(24 - half, 24 + half + 1):
    u = (x - 24) / max(half, 1)
    # Each coil is lit along its own top edge and shaded under it, so the
    # bands read as rope laid on rope rather than as hatching.
    tone = 5 if u < -0.45 else 4 if u < 0.35 else 3
    if band == 0: tone += 1
    if band == 3: tone -= 2
    if jitter(x, y // 4) % 9 == 0: tone -= 1
    c.set(x, y, straw[max(min(tone, 6), 1)])
   c.set(24 - half, y, straw[2]); c.set(24 + half, y, straw[1])
   if band == 3:                                  # the binding through the coil
    for x in range(24 - half + 2, 24 + half - 1, 5):
     c.set(x, y, straw[5] if x < 24 else straw[2])
  from math import sqrt
  base_half = round(2 + 14 * sin(min((40 - 9) / 31 * 1.08, 1.0) * pi / 2) ** 0.85)
  for x in range(24 - base_half, 24 + base_half + 1):   # a base on the ground
   u = (x - 24) / max(base_half, 1)
   for k in range(1, round(3 * sqrt(max(0.0, 1 - u * u))) + 1):
    c.set(x, 40 + k, straw[2] if k < 3 and abs(u) < 0.7 else straw[1])
  c.set(16, 4, straw[5]); c.set(24, 4, straw[4]); c.set(24, 3, straw[3])
  for x in range(21, 28): c.set(x, 37, '#20180d'); c.set(x, 38, '#2c2213')
  for x in range(18, 31):                         # the flight board, in front
   c.set(x, 42, w[4] if x < 24 else w[3]); c.set(x, 43, w[1])
 # Four bees working: two on wide rounds, two shuttling at the flight hole.
 # Wide rounds that carry them clear of the straw, and two shuttling at the
 # flight hole. Bees drawn over the hive read as specks in the weave.
 _bees(c, frame, [
  (24, 20, 22, 17, 1.0),
  (24, 22, 19, 13, -1.0),
  (24, 30, 15, 7, 1.0),
  (24, 26, 11, 10, -1.0),
 ])
 soft_outline(c, straw[0] if v != 2 else w[0], straw[2] if v != 2 else w[2])
 grass(c, [(6, 47, 3), (38, 47, 2)])
 return c.image()


def plough(v=0):
 """Beam, coulter, share and mouldboard, with the handles rising behind."""
 c = Canvas(64, 42)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7'] if v != 2 else RAMPS['rustred7']
 # The beam: a heavy timber from the share up to the handles.
 for i in range(46):
  x, y = 8 + i, 24 - i // 3
  for k in range(4):
   c.set(x, y + k, w[5] if k == 0 else w[4] if k < 3 else w[2])
  if i % 7 == 0: c.set(x, y + 1, w[3])
 c.set(8, 24, w[2])
 for i in range(20):                              # two handles, one behind
  c.set(50 + i // 5, 4 + i, w[5]); c.set(51 + i // 5, 4 + i, w[3])
  c.set(52 + i // 5, 4 + i, w[1])
  c.set(43 + i // 5, 8 + i, w[4]); c.set(44 + i // 5, 8 + i, w[2])
 for x in range(49, 59): c.set(x, 3, w[6]); c.set(x, 4, w[3])    # the grips
 for x in range(42, 50): c.set(x, 7, w[5]); c.set(x, 8, w[2])
 for i in range(8): c.set(45 + i, 17 + i // 3, w[2])             # the stay
 for y in range(20, 30):                          # the coulter, knifing down
  c.set(20, y, m[5]); c.set(21, y, m[3]); c.set(22, y, m[1])
 c.set(20, 30, m[4]); c.set(21, 31, m[2])
 share = {27: (6, 17), 28: (3, 19), 29: (1, 21), 30: (1, 22), 31: (3, 22),
          32: (6, 21), 33: (10, 19)}
 for y, (a, b) in share.items():                  # the share, biting in
  for x in range(a, b + 1):
   c.set(x, y, m[4] if x < 10 else m[3])
  c.set(a, y, m[5]); c.set(b, y, m[1])
 for x in range(1, 10):                           # its polished cutting edge
  c.set(x, 29 + x // 5, m[6]); c.set(x, 30 + x // 5, m[4])
 c.set(1, 29, m[5]); c.set(2, 28, m[4])
 if v != 0:
  for y in range(20, 32):                         # a mouldboard turning the sod
   half = 5 - abs(y - 26) // 2
   for x in range(22 - half, 22 + half + 1):
    c.set(x, y, m[5] if x < 22 else m[3] if x < 22 + half else m[1])
  for y in range(22, 30):
   c.set(22, y, m[6] if y % 3 else m[4])
 if v == 1:
  for y in range(24, 40):                         # and a land wheel
   for x in range(28, 46):
    d = hypot((x + .5 - 37) / 8.4, (y + .5 - 32) / 7.6)
    if d > 1: continue
    c.set(x, y, w[3] if d > 0.58 else w[2])
    if d > 0.84: c.set(x, y, m[4] if x < 37 else m[2])
   for dx, dy in [(0, -6), (0, 6), (-6, 0), (6, 0), (-5, -4), (5, 4)]:
    c.set(37 + dx, 32 + dy, w[5] if dx <= 0 else w[2])
  c.set(37, 32, m[5]); c.set(38, 32, m[2])
 else:
  # The stilt has to start where the beam actually is, or it reads as a
  # separate little post standing beside the plough.
  for i in range(18):
   c.set(30 + i // 6, 21 + i, w[4]); c.set(31 + i // 6, 21 + i, w[2])
   c.set(32 + i // 6, 21 + i, w[1])
  c.hline(30, 36, 38, w[3]); c.hline(30, 36, 39, w[0])
 _knots(c, w, [(18, 22), (34, 18), (48, 10)])
 soft_outline(c, w[0], w[2])
 grass(c, [(0, 41, 3), (58, 41, 2)])
 return c.image()


def _shaft(c, x, top, base, w, lean=0, thick=3):
 """A tool's shaft: lit face, shaded face, a band of wear where it is held."""
 for i in range(base - top + 1):
  y = top + i
  sx = x + (lean * i) // 12
  for k in range(thick):
   tone = 5 if k == 0 else 3 if k < thick - 1 else 1
   c.set(sx + k, y, w[tone])
  if i % 9 == 4: c.set(sx, y, w[6])
  if jitter(sx, y // 5) % 13 == 0: c.set(sx + 1, y, w[2])
 return x + (lean * (base - top)) // 12


def rake(v=0):
 """A hay rake, head down: the way it is left standing against a wall."""
 c = Canvas(20, 50)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7'] if v != 1 else RAMPS['rustred7']
 _shaft(c, 8, 1, 36, w, lean=2)
 c.hline(8, 10, 1, w[6])
 for y in (30, 31):                                # the ferrule holding it on
  c.hline(8, 11, y, m[4] if y % 2 else m[2])
 head = 40
 c.hline(2, 17, head - 2, w[5])                    # the head, across the foot
 c.hline(2, 17, head - 1, w[4])
 c.hline(2, 17, head, w[1])
 c.set(2, head - 2, w[6]); c.set(17, head - 1, w[0])
 teeth = range(3, 18, 2) if v == 2 else range(3, 18, 3)
 for x in teeth:                                   # teeth, pointing at the earth
  for k, tone in enumerate((4, 4, 3, 1)):
   c.set(x, head + 1 + k, (m if v == 1 else w)[tone])
 for i in range(6):                                # braces back up to the shaft
  c.set(9 - i // 3, head - 3 - i, w[3])
  c.set(12 + i // 3, head - 3 - i, w[2])
 soft_outline(c, w[0], w[2])
 grass(c, [(0, 49, 2), (17, 49, 2)])
 return c.image()


def pitchfork(v=0):
 """A fork, tines down, stood where it was last used."""
 c = Canvas(18, 50)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7'] if v != 2 else RAMPS['rustred7']
 # The head hangs off wherever the shaft actually ends: with the offset
 # hard-coded, any lean at all left the tines floating beside the handle.
 cx = _shaft(c, 6, 1, 35, w, lean=1) + 1
 c.hline(cx - 2, cx, 1, w[6])
 for y in range(35, 39):                           # the socket
  half = (y - 35) // 2 + 1
  for x in range(cx - half, cx + half + 1):
   c.set(x, y, m[5] if x < cx else m[3])
  c.set(cx - half, y, m[2]); c.set(cx + half, y, m[1])
 c.hline(cx - 4, cx + 3, 39, m[6])
 tines = [(-4, 1), (0, 0), (4, 1)] if v != 1 else [(-5, 2), (-2, 0), (2, 0), (5, 2)]
 for dx, short in tines:                           # tines, curving into the ground
  x = cx + dx
  for k in range(9 - short):
   y = 40 + k
   bend = round(dx * k * 0.06)
   c.set(x + bend, y, m[5] if dx <= 0 else m[3])
   c.set(x + bend + 1, y, m[2])
  c.set(x + round(dx * (8 - short) * 0.06), 48 - short, m[6])
 soft_outline(c, w[0], w[2])
 grass(c, [(0, 49, 2), (14, 49, 2)])
 return c.image()


def spear(v=0):
 """A hunting spear stood on its butt: grey stone, bronze, then iron."""
 c = Canvas(12, 52)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['pewter7'] if v == 0 else RAMPS['copper7'] if v == 1 else RAMPS['iron7']
 cx = _shaft(c, 5, 12, 50, w, lean=0, thick=2)
 for y in (12, 13, 14):                            # the lashing or the socket
  c.hline(cx - 1, cx + 2, y, m[2] if v else w[1])
  c.set(cx - 1, y, m[4] if v else w[5])
 for i, half in enumerate([0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 1]):   # leaf blade, point up
  y = 1 + i
  for x in range(cx - half, cx + half + 2):
   c.set(x, y, m[5] if x <= cx else m[3])
  c.set(cx + half + 1, y, m[1])
 for y in range(3, 11): c.set(cx, y, m[6])         # the midrib catches the light
 soft_outline(c, w[0], w[2])
 grass(c, [(1, 51, 2), (8, 51, 2)])
 return c.image()


def shovel(v=0):
 """A navvy's shovel: a long haft and a blade that takes two cuts at once."""
 c = Canvas(18, 46)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7'] if v != 2 else RAMPS['rustred7']
 _shaft(c, 7, 4, 30, w, lean=1)
 if v != 1:                                        # a D grip at the top
  c.hline(4, 11, 0, w[5]); c.hline(5, 10, 1, w[3])
  c.set(4, 1, w[2]); c.set(11, 1, w[2])
  c.vline(4, 1, 3, w[4]); c.vline(11, 1, 3, w[2])
  c.hline(5, 10, 3, w[2])
 else:
  c.hline(4, 12, 1, w[5]); c.hline(4, 12, 2, w[3])   # or a straight T
  c.set(4, 3, w[2]); c.set(12, 3, w[2])
 for y in range(29, 34):                           # the socket and its straps
  for x in range(6, 12):
   c.set(x, y, m[4] if x < 9 else m[2])
  c.set(6, y, m[5]); c.set(11, y, m[1])
 c.hline(6, 11, 29, m[6])
 blade = {34: (3, 14), 35: (2, 15), 36: (1, 16), 37: (1, 16), 38: (1, 16),
          39: (2, 15), 40: (3, 14), 41: (5, 12)}
 for y, (a, b) in blade.items():                   # the blade, broad and dished
  for x in range(a, b + 1):
   u = (x - a) / max(b - a, 1)
   c.set(x, y, m[5] if u < 0.25 else m[4] if u < 0.62 else m[2])
  c.set(a, y, m[3]); c.set(b, y, m[1])
 for y in range(34, 40): c.set(8, y, m[6])         # the rib down the middle
 c.hline(5, 12, 42, m[6]); c.hline(6, 11, 43, m[3])   # the worn edge
 soft_outline(c, m[0], w[2])
 return c.image()


def scythe(v=0):
 """A scythe: an S-curved snath with two nibs and a long blade for a swathe."""
 from math import atan2, hypot, pi
 c = Canvas(50, 58)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7'] if v != 2 else RAMPS['pewter7']
 # The snath, sampled along a curve rather than listed point by point: a
 # hand-placed list leaves gaps and the shaft reads as a row of sticks.
 def bez(t):
  x = (1 - t) ** 2 * 43 + 2 * (1 - t) * t * 30 + t * t * 33
  y = (1 - t) ** 2 * 2 + 2 * (1 - t) * t * 22 + t * t * 44
  return x, y
 last = None
 for i in range(121):
  x, y = bez(i / 120)
  px, py = round(x), round(y)
  if (px, py) == last: continue
  last = (px, py)
  for k in range(3):
   c.set(px + k, py, w[5] if k == 0 else w[3] if k == 1 else w[1])
  if i % 20 == 0: c.set(px, py, w[6])
 for t, back in ((0.28, 6), (0.62, 7)):            # the two nibs
  hx, hy = bez(t)
  for k in range(back):
   c.set(round(hx) - k, round(hy) + k // 3, w[4] if k < back - 2 else w[2])
   c.set(round(hx) - k, round(hy) + 1 + k // 3, w[2])
  c.set(round(hx) - back, round(hy) + 2, w[1])
 cx, cy, rad = 33.0, 26.0, 20.0                    # the blade, one long arc
 for y in range(58):
  for x in range(50):
   X, Y = x + .5 - cx, y + .5 - cy
   r = hypot(X, Y * 0.92)
   a = atan2(-Y, X)
   if not (-2.95 < a < -1.15): continue            # sweeping down and to the left
   t = (a + 2.95) / 1.8                            # 0 at the tip, 1 at the heel
   thick = 1.6 + 2.6 * t
   if not (rad - thick <= r <= rad + 0.8): continue
   band = (r - (rad - thick)) / max(thick, .1)
   c.set(x, y, m[6] if band > .78 else m[4] if band > .40 else m[2])
 for y in range(58):                               # the back of the blade, dark
  for x in range(50):
   if c.get(x, y) == m[2] and not c.get(x, y - 1): c.set(x, y, m[1])
 for y in range(40, 48):                           # the collar joining the two
  half = 3 - abs(y - 44) // 2
  for x in range(33 - half, 33 + half + 1):
   c.set(x, y, m[5] if x < 33 else m[3])
 c.hline(30, 36, 40, m[6]); c.hline(31, 35, 47, m[1])
 soft_outline(c, m[0], w[2])
 grass(c, [(2, 57, 2), (44, 57, 2)])
 return c.image()


def farm_cart(v=0):
 """A two-wheeled cart with its shafts down, planked body and iron tyres."""
 c = Canvas(86, 54)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7']
 body_top, body_base = 8, 32
 for y in range(body_top, body_base + 1):         # the body, board on board
  band = (y - body_top) // 6
  tone = 5 - band
  c.hline(10, 68, y, w[max(tone, 2)])
  if (y - body_top) % 6: streak(c, 10, 68, y, w, max(tone, 2))
  else: c.hline(10, 68, y, w[1])
 c.hline(10, 68, body_top, w[6])
 c.hline(10, 68, body_base, w[0])
 for bx in range(16, 68, 12):                     # uprights, ironbound
  for y in range(body_top, body_base):
   c.set(bx, y, w[3]); c.set(bx + 1, y, w[1])
  c.set(bx, body_top, w[5])
  for k in range(3): c.set(bx, body_base - 3 + k, m[4 - k])
 for y in (body_top + 2, body_base - 4):          # side rails
  c.hline(10, 68, y, w[6]); c.hline(10, 68, y + 1, w[2])
 for wx in (26, 56):                              # two tall wheels
  for y in range(28, 52):
   for x in range(wx - 13, wx + 13):
    d = hypot((x + .5 - wx) / 12.0, (y + .5 - 40) / 11.4)
    if d > 1: continue
    c.set(x, y, w[3] if d > 0.5 else w[2])
    if d > 0.86: c.set(x, y, m[4] if x < wx else m[2])
    if 0.80 < d <= 0.86: c.set(x, y, m[1])
  for k in range(10):                             # ten spokes, hub to felloe
   a = k * pi / 5
   for t in range(4, 22):
    sx = round(wx + cos(a) * t * 0.52)
    sy = round(40 + sin(a) * t * 0.50)
    if not c.get(sx, sy): continue
    c.set(sx, sy, w[5] if cos(a) < 0 else w[3])
    if c.get(sx + 1, sy): c.set(sx + 1, sy, w[2])
  for y in range(37, 44):
   for x in range(wx - 4, wx + 4):
    if hypot((x + .5 - wx) / 3.6, (y + .5 - 40) / 3.4) <= 1:
     c.set(x, y, m[4] if x < wx else m[2])
  c.set(wx - 1, 39, m[6]); c.set(wx, 39, m[5])
 for i in range(14):                              # the shafts, resting down
  c.set(69 + i, 30 + i // 2, w[5]); c.set(69 + i, 31 + i // 2, w[3])
  c.set(69 + i, 32 + i // 2, w[1])
 c.hline(80, 85, 38, w[4]); c.hline(80, 85, 39, w[1])
 if v == 1:
  for x in range(12, 67, 2):                      # a load of hay over the top
   h = 4 + jitter(x) % 4
   for k in range(h):
    c.set(x, 7 - k, RAMPS['straw'][4 if k % 2 else 5])
    c.set(x + 1, 7 - k, RAMPS['straw'][3 if k % 2 else 2])
 _knots(c, w, [(22, 18), (44, 14), (62, 26)])
 soft_outline(c, w[0], w[2])
 grass(c, [(2, 53, 3), (76, 53, 2)])
 return c.image()


FARM = {
 'plough': plough,
 'water-butt': water_butt,
 'rake': rake,
 'pitchfork': pitchfork,
 'spear': spear,
 'shovel': shovel,
 'scythe': scythe,
 'beehive': beehive,
 'milk-churn': milk_churn,
 'farm-cart': farm_cart,
}
