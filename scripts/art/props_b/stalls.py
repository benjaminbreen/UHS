"""Market stalls.

Five builds rather than one: what a square sells from changes with the date and
the place, and a row of identical counters is the flattest thing on the map.
Colour and goods vary within each build.
"""
from .core import Canvas, RAMPS, jitter, soft_outline
from .workshop import streak

WOOD = ['oak7', 'walnut7', 'ash7']
CLOTH = [
 ['#5d2320', '#8a3529', '#b04a33', '#cd6a44', '#e08d5f'],   # madder red
 ['#1d3346', '#2b4d66', '#3c6b86', '#5a8ea6', '#86b4c6'],   # indigo
 ['#3d3a1c', '#5e5a2a', '#847f3c', '#a8a054', '#c6bf78'],   # olive
 ['#4a2545', '#6b3a5f', '#8d5480', '#ac749d', '#c89bb8'],   # murex purple
]
WARES = {
 'fruit': ['#7a2a1e', '#b8452a', '#d9722f', '#e8a13d', '#f2c86a'],
 'greens': ['#25401f', '#3c6329', '#588a38', '#79ab4c', '#9fc76c'],
 'grain': ['#5b4520', '#8a6c2c', '#b09040', '#ceb160', '#e4cd8c'],
 'fish': ['#33403f', '#4f6360', '#748984', '#9aaca4', '#c2cfc2'],
 'pots': ['#4a2a1c', '#6f4227', '#8f5a34', '#ab7549', '#c69466'],
 'cloth': ['#4a2545', '#7a3a54', '#a05a6c', '#c08088', '#d8a8a8'],
}


def _heap(c, x, y, w, ware, rows=2):
 """A pile of produce on the boards: two rows of little domes."""
 p = WARES[ware]
 for r in range(rows):
  yy = y - r
  for i in range(w - r * 2):
   px = x + i + r
   tone = 4 if (px + yy) % 3 else 3
   c.set(px, yy, p[tone])
  c.set(x + r, yy, p[2]); c.set(x + w - r - 1, yy, p[1])


def _bolts(c, x, y, n=3):
 """Rolled cloth stood on end, each a different dye."""
 for i in range(n):
  p = CLOTH[(i + 1) % len(CLOTH)]
  bx = x + i * 4
  for k in range(6):
   c.set(bx, y - k, p[3]); c.set(bx + 1, y - k, p[2]); c.set(bx + 2, y - k, p[1])
  c.set(bx, y - 6, p[4]); c.set(bx + 1, y - 6, p[3])


def _counter(c, x0, x1, top, w, deep=4):
 """The board and its trestle or frame, seen from the front."""
 for k in range(deep):
  tone = 5 if k == 0 else 4 if k < deep - 1 else 2
  c.hline(x0, x1, top + k, w[tone])
  if k == 1: streak(c, x0, x1, top + k, w, tone)
 c.hline(x0, x1, top + deep, w[1])


def trestle(v=0):
 """Boards on trestles: the oldest and plainest way to sell anything."""
 c = Canvas(38, 26)
 w = RAMPS[WOOD[v]]
 _counter(c, 1, 36, 12, w, deep=4)
 for lx in (4, 30):                               # the trestles under it
  for k in range(9):
   c.set(lx - k // 3, 17 + k, w[3]); c.set(lx + 4 + k // 3, 17 + k, w[2])
  c.hline(lx - 1, lx + 5, 21, w[4]); c.hline(lx - 1, lx + 5, 22, w[1])
 wares = [['fruit', 'greens', 'grain'], ['grain', 'pots', 'fruit'],
          ['fish', 'greens', 'fish']][v]
 for i, ware in enumerate(wares):
  _heap(c, 4 + i * 11, 11, 9, ware, rows=3)
 soft_outline(c, w[0], w[2])
 return c.image()


def awning(v=0):
 """A counter under a striped cloth: the classical and medieval market."""
 c = Canvas(48, 40)
 w = RAMPS[WOOD[v]]
 stripe = CLOTH[v % len(CLOTH)]
 plain = ['#5a5341', '#7d755c', '#a09madeup'][0:0] or ['#5a5341', '#7d755c', '#a09877', '#c2b995', '#ddd5b4']
 for px in (2, 42):                               # the poles
  for y in range(6, 36):
   c.set(px, y, w[4]); c.set(px + 1, y, w[2]); c.set(px + 2, y, w[1])
  c.hline(px - 1, px + 3, 35, w[1])
 for i, x in enumerate(range(1, 44, 5)):          # the awning, front edge down
  band = stripe if i % 2 else plain
  for k in range(7):
   run = 5 if k < 5 else 4
   for j in range(run):
    c.set(x + j, 4 + k, band[3] if k < 4 else band[2])
  c.hline(x, x + 4, 4, band[4])
  c.hline(x, x + 3, 11, band[1])
 c.hline(0, 46, 3, w[2]); c.hline(0, 46, 12, w[1])
 _counter(c, 3, 44, 20, w, deep=5)
 for y in range(26, 34):                          # a cloth over the front
  for x in range(4, 44):
   c.set(x, y, stripe[2] if (x + y) % 7 else stripe[1])
 c.hline(4, 43, 33, stripe[0])
 wares = [['fruit', 'greens'], ['pots', 'grain'], ['fish', 'fruit']][v]
 for i, ware in enumerate(wares):
  _heap(c, 6 + i * 17, 19, 12, ware, rows=3)
 if v == 1: _bolts(c, 30, 19)
 soft_outline(c, w[0], w[2])
 return c.image()


def booth(v=0):
 """A roofed kiosk with its goods hung up: a permanent pitch."""
 c = Canvas(50, 44)
 w = RAMPS[WOOD[v]]
 tile = RAMPS['tile'] if v == 0 else RAMPS[WOOD[(v + 1) % 3]]
 for px in (3, 43):
  for y in range(10, 38):
   c.set(px, y, w[4]); c.set(px + 1, y, w[2]); c.set(px + 2, y, w[1])
 for i, (y, half) in enumerate([(2, 12), (3, 15), (4, 18), (5, 21), (6, 24),
                                (7, 25), (8, 25)]):
  for x in range(25 - half, 25 + half):
   c.set(x, y, tile[4] if i % 2 else tile[3])
   if i % 2 == 0 and x % 5 == 0: c.set(x, y, tile[2])
 c.hline(0, 49, 9, tile[1]); c.hline(13, 37, 2, tile[5])
 _counter(c, 5, 44, 24, w, deep=5)
 for y in range(30, 37):                          # the boarded front
  for x in range(6, 43):
   c.set(x, y, w[3] if (x // 4 + y) % 2 else w[2])
 c.hline(6, 42, 36, w[1])
 for hx in (10, 18, 34):                          # goods hung from the lintel
  p = WARES[['pots', 'fish', 'cloth'][(hx + v) % 3]]
  for k in range(5):
   c.set(hx, 11 + k, p[3]); c.set(hx + 1, 11 + k, p[2])
  c.set(hx, 16, p[1]); c.set(hx + 1, 16, p[1])
 wares = [['grain', 'pots'], ['fish', 'greens'], ['fruit', 'grain']][v]
 for i, ware in enumerate(wares):
  _heap(c, 9 + i * 18, 23, 13, ware, rows=3)
 soft_outline(c, w[0], w[2])
 return c.image()


def cart(v=0):
 """A two-wheeled cart tipped down to sell from: the street trader's pitch."""
 from math import hypot
 c = Canvas(46, 34)
 w = RAMPS[WOOD[v]]
 m = RAMPS['blackiron7']
 stripe = CLOTH[(v + 1) % len(CLOTH)]
 for y in range(14, 26):                          # the body, tipped forward
  for x in range(6, 40):
   c.set(x, y, w[4] if y < 17 else w[3] if y < 23 else w[2])
 streak(c, 6, 39, 16, w, 4); streak(c, 6, 39, 21, w, 3)
 c.hline(6, 39, 13, w[5]); c.hline(6, 39, 26, w[1])
 for bx in (12, 30):
  for y in range(14, 26): c.set(bx, y, w[2])
 for i, x in enumerate(range(4, 44, 5)):          # a tilt over the top
  band = stripe if i % 2 else ['#5a5341', '#7d755c', '#a09877', '#c2b995', '#ddd5b4']
  for k in range(5):
   for j in range(5):
    c.set(x + j, 4 + k, band[3] if k < 3 else band[2])
  c.hline(x, x + 4, 4, band[4]); c.hline(x, x + 3, 9, band[1])
 for px in (5, 40):
  for y in range(9, 15): c.set(px, y, w[2])
 for y in range(24, 34):                          # the wheel
  for x in range(8, 22):
   d = hypot((x + .5 - 15) / 6.6, (y + .5 - 29) / 5.0)
   if d > 1: continue
   c.set(x, y, w[3] if d > 0.55 else w[2])
   if d > 0.80: c.set(x, y, m[4] if x < 15 else m[2])
 for dx, dy in [(0, -4), (0, 4), (-4, 0), (4, 0), (-3, -3), (3, 3)]:
  c.set(15 + dx, 29 + dy, w[5] if dx <= 0 else w[2])
 c.set(15, 29, m[4]); c.set(16, 29, m[2])
 for x in range(36, 45):                          # the shafts, resting down
  c.set(x, 22 + (x - 36) // 3, w[4]); c.set(x, 23 + (x - 36) // 3, w[1])
 wares = [['fruit', 'greens'], ['fish', 'fruit'], ['grain', 'pots']][v]
 for i, ware in enumerate(wares):
  _heap(c, 9 + i * 15, 13, 12, ware, rows=3)
 soft_outline(c, w[0], w[2])
 return c.image()


def modern(v=0):
 """Tubular frame, canvas tilt, crates and a scale: the twentieth-century market."""
 c = Canvas(50, 38)
 m = RAMPS[['galvanised7', 'pewter7', 'blackiron7'][v]]
 w = RAMPS['ash7']
 canvas_ = [['#48413a', '#6b6255', '#8d8374', '#ada291', '#cbc0ac'],
            CLOTH[1], CLOTH[0]][v]
 for px in (3, 44):                               # the frame
  for y in range(8, 34):
   c.set(px, y, m[5]); c.set(px + 1, y, m[3]); c.set(px + 2, y, m[1])
 c.hline(2, 47, 7, m[5]); c.hline(2, 47, 8, m[2])
 for i, x in enumerate(range(2, 48, 6)):          # the tilt
  band = canvas_ if i % 2 else [c2 for c2 in canvas_]
  for k in range(6):
   for j in range(6):
    tone = 4 if i % 2 else 3
    c.set(x + j, 1 + k, band[tone if k < 4 else tone - 1])
  c.hline(x, x + 5, 1, band[4]); c.hline(x, x + 5, 6, band[1])
 _counter(c, 4, 45, 18, w, deep=4)
 for y in range(23, 32):                          # crates stacked under it
  for x in range(5, 44):
   box = (x // 9 + y // 5) % 2
   c.set(x, y, w[3] if box else w[2])
   if x % 9 == 0: c.set(x, y, w[1])
 c.hline(5, 43, 22, w[5]); c.hline(5, 43, 31, w[1])
 wares = [['fruit', 'greens'], ['greens', 'fruit'], ['fruit', 'grain']][v]
 for i, ware in enumerate(wares):
  _heap(c, 7 + i * 18, 17, 14, ware, rows=3)
 c.rect(38, 13, 43, 17, m[4])                     # a scale on the end
 c.hline(38, 43, 13, m[6]); c.set(40, 12, m[3]); c.set(41, 12, m[5])
 soft_outline(c, m[0], w[2])
 return c.image()


STALLS = {
 'stall-trestle': trestle,
 'stall-awning': awning,
 'stall-booth': booth,
 'stall-cart': cart,
 'stall-modern': modern,
}
