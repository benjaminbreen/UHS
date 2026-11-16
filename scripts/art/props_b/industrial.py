"""What a yard or a street carries from the factory age on."""
from .core import (Canvas, RAMPS, belly, jitter, revolve, soft_outline, grass)
from .solid import K, disc, lathe
from .workshop import streak

WOOD7 = ['oak7', 'walnut7', 'ash7']


def litter_bin(v=0):
 """An open municipal basket, with a rolled rim and slats on an iron stand."""
 c = Canvas(15, 24)
 palettes = [ ['#1e302e', '#304742', '#456058', '#658071', '#98aa8d'],
              ['#263138', '#3b4d58', '#536a73', '#789099', '#a6b7b7'],
              ['#392b29', '#58403a', '#79574b', '#a07960', '#bba68a'] ]
 p = palettes[v]
 for y in range(3, 9):
  for x in range(2, 13):
   if ((x - 7) / 5.5) ** 2 + ((y - 5.5) / 3) ** 2 <= 1:
    c.set(x, y, p[0] if 3 < x < 11 and 4 <= y <= 6 else p[2])
 for x in range(3, 13, 2):
  c.rect(x, 7, x, 19, p[3] if x < 7 else p[1])
  c.set(x, 8, p[4] if x < 7 else p[2])
 for y in (9, 17, 20):
  c.hline(3, 11, y, p[2]); c.hline(3, 6, y, p[3])
 c.rect(6, 20, 8, 23, p[1])
 c.hline(4, 10, 23, p[2])
 c.hline(3, 11, 3, p[3]); c.hline(4, 8, 3, p[4])
 return c.image()


def municipal_planter(v=0):
 """A low cast-stone trough with geraniums; about 1.6 metres across."""
 c = Canvas(29, 23)
 stone = [['#595f5b', '#7b8076', '#a5a899', '#c6c5ad', '#e2dcc2'],
          ['#5b5550', '#81796b', '#a89d85', '#c8b99c', '#e1cfad'],
          ['#444e53', '#66747b', '#8b9b9d', '#b0bbba', '#d4d8cf']][v]
 c.rect(2, 11, 26, 19, stone[2]); c.hline(3, 25, 20, stone[1])
 c.rect(4, 21, 8, 22, stone[0]); c.rect(21, 21, 24, 22, stone[0])
 c.rect(0, 8, 28, 11, stone[3]); c.hline(0, 28, 8, stone[4])
 c.hline(2, 26, 9, '#454238'); c.hline(2, 26, 12, stone[1])
 for x in range(4, 26, 5):
  c.rect(x, 5, x + 1, 9, '#435c36')
  c.hline(x - 2, x + 3, 6, '#638049'); c.hline(x - 1, x + 2, 5, '#8d9a54')
  c.rect(x - 1, 2 + x % 3, x + 2, 4 + x % 3, '#913f47')
  c.hline(x - 1, x + 1, 2 + x % 3, '#d47772'); c.set(x, 3 + x % 3, '#e7ad81')
 for x in (5, 14, 22): c.set(x, 15, stone[3]); c.set(x + 1, 17, stone[1])
 return c.image()


def works_fence(v=0):
 """One ground-grid cell of wire mesh, 1.4m high; across and into the scene."""
 c = Canvas(16, 26 if v == 0 else 42)
 if v == 0:
  for y in range(4, 24):
   for x in range(16):
    if (x + y) % 7 == 0 or (x - y) % 7 == 0:
     c.set(x, y, '#839087' if (x + y) % 7 == 0 else '#526663')
  for y in (3, 23): c.hline(0, 15, y, '#667b77')
  c.rect(0, 1, 1, 25, '#445751'); c.vline(0, 1, 24, '#a0aaa0')
  c.hline(0, 2, 0, '#b9c0ae'); c.hline(0, 3, 25, '#394942')
 else:
  for y in range(4, 40):
   c.set(8, y, '#5a716b')
   if y % 4 < 2: c.set(9, y, '#91a096')
  c.rect(6, 0, 7, 25, '#425750'); c.vline(6, 0, 24, '#a0aaa0')
  c.rect(6, 16, 7, 41, '#425750'); c.vline(6, 16, 40, '#a0aaa0')
  c.hline(5, 8, 16, '#bdc2b0'); c.hline(5, 9, 41, '#394942')
 return c.image()


def dustbin(v=0):
 """A galvanised bin: ribbed body, rimmed domed lid with its knob, riveted
 handles, one dent."""
 m = RAMPS[['galvanised7', 'blackiron7', 'rustred7'][v]]
 c = Canvas(20, 30)
 cx, by = 10, 28
 def body(z, a, i):
  if int(z) in (4, 10, 15): return i + 1
  if int(z) in (5, 11): return i - 1
  return i - (int((a + 3.2) * 4) % 2 == 0 and abs(a) < 1.4)
 lathe(c, cx, by, [(0, 7.0), (17, 8.0)], m, body, flat=False)
 lid = [(0, 8.6), (1, 8.6), (2.5, 7), (3.5, 4.5), (4, 2), (4.5, 1.2), (5.5, 1.2)]
 lathe(c, cx, by + (8.6 - 7.0) * K, lid, m, z0=17)
 for hx, lit in ((cx - 9, 5), (cx + 8, 2)):
  for k in range(3): c.set(hx, by - 13 - 3.5 - k, m[lit]); c.set(hx + 1, by - 13 - 3.5 - k, m[lit - 1])
 for x, y in ((14, 18), (15, 18), (14, 19)):
  if c.get(x, y): c.set(x, y, m[2])
 soft_outline(c, m[0], m[2])
 return c.image()


def steel_drum(v=0):
 """A two-hundred-litre drum: rolling hoops, a chimed lid with its bungs,
 rust at the foot."""
 m = RAMPS[['paintblue7', 'rustred7', 'galvanised7'][v]]
 rust = RAMPS['rustred7']
 c = Canvas(20, 30)
 cx, by = 10, 28
 def hoops(z, a, i):
  if int(z) in (6, 13): return i + 1
  if int(z) in (7, 14): return i - 2
  return i
 lathe(c, cx, by, [(0, 8.6), (20, 8.6)], m, hoops)
 ty = by - 20 - 8.6 * K
 disc(c, cx, ty, 7.4, 3.5, m[4]); disc(c, cx + .4, ty + .2, 6.8, 3.0, m[5])
 c.set(cx + 3, int(ty) - 1, m[1]); c.set(cx + 4, int(ty) - 1, m[2]); c.set(cx - 4, int(ty) + 1, m[2])
 for x, y in ((3, 25), (16, 24), (4, 27), (15, 27), (6, 28)):
  if c.get(x, y): c.set(x, y, rust[3])
 soft_outline(c, m[0], m[2])
 return c.image()


def wheelbarrow(v=0):
 """A barrow: planked tray, spoked wheel in an iron tyre, two handles."""
 from math import hypot
 c = Canvas(40, 28)
 steel = v == 2
 w = RAMPS['galvanised7'] if steel else RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7']
 tray = {}
 for y in range(3, 14):                           # the tray, flaring upward
  t = (y - 3) / 10
  tray[y] = (round(10 - t * 3), round(31 - t * 4))
 for y, (a, b) in tray.items():
  tone = 5 if y < 6 else 4 if y < 11 else 3
  c.hline(a, b, y, w[tone])
  if not steel: streak(c, a, b, y, w, tone)
  c.set(a, y, w[2]); c.set(b, y, w[2])
 c.hline(10, 31, 3, w[6])                         # the lip of the tray
 c.hline(8, 28, 13, w[1])
 if not steel:
  for y in (7, 10):                               # plank joins across it
   for x in range(9, 30):
    if c.get(x, y): c.set(x, y, w[2])
 for bx in (13, 26):                              # iron straps over the tray
  for y in range(4, 13):
   if c.get(bx, y): c.set(bx, y, m[4] if bx < 20 else m[3])
   if c.get(bx + 1, y): c.set(bx + 1, y, m[1])
 for i, x in enumerate(range(28, 40)):            # the handles, rising to the hand
  y = 12 - (i * 7) // 11
  c.set(x, y, w[5]); c.set(x, y + 1, w[3]); c.set(x, y + 2, w[1])
 c.rect(38, 4, 39, 6, w[4]); c.set(38, 4, w[6])   # the grips
 for lx in (20, 26):                              # the legs it stands on
  for y in range(14, 19):
   c.set(lx, y, w[3]); c.set(lx + 1, y, w[1])
  c.set(lx, 19, m[3]); c.set(lx + 1, 19, m[1])
 for y in range(9, 23):                           # the wheel
  for x in range(1, 17):
   d = hypot((x + .5 - 8.5) / 7.4, (y + .5 - 16) / 6.8)
   if d > 1: continue
   c.set(x, y, w[3] if d > 0.55 else w[2])
   if d > 0.80: c.set(x, y, m[4] if x < 9 else m[2])
 for dx, dy in [(0, -5), (0, 5), (-5, 0), (5, 0), (-4, -3), (4, 3), (-4, 3), (4, -3)]:
  c.set(8 + dx, 16 + dy, w[5] if dx <= 0 else w[2])   # spokes
 for x, y in [(7, 15), (8, 15), (7, 16), (8, 16)]:    # the hub
  c.set(x, y, m[4] if x < 8 else m[2])
 for x in range(10, 22):                          # the frame down to the axle
  c.set(x, 14, w[2]); c.set(x, 15, w[1])
 c.px = {(x, y + 4): col for (x, y), col in c.px.items()}
 for y in range(1, 7):
  a, b = 11 + (y < 3), 30 - (y < 3)
  c.hline(a, b, y, w[5] if y == 1 else w[2] if y < 3 else w[1])
  c.set(a - 1, y, w[4]); c.set(b + 1, y, w[2])
 c.hline(10, 31, 0, w[5])
 soft_outline(c, m[0] if steel else w[0], w[2])
 return c.image()

