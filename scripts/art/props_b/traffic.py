"""Traffic control: signals at the busy crossings, signs at the quiet ones.

A signal head stands about three and a half metres up, so these are nearly as
tall as the street lamps. The lit lens is drawn bright and the others dull;
the camera sees the face turned toward it.
"""
from .core import Canvas, RAMPS, soft_outline

# Signal housings: the green of the interwar post-top signal, the yellow of
# the postwar American head, the black of everything since.
HOUSING = {
 'green': ['#0e1a14', '#15271e', '#1f3a2b', '#2b4f3a', '#3b664b', '#52805f', '#6f9b78'],
 'yellow': ['#3a2c07', '#5c4610', '#826418', '#a98422', '#c9a232', '#dfbe52', '#efd786'],
 'black': ['#0d0e10', '#16181b', '#202327', '#2c3035', '#3a3f45', '#4d535a', '#666d75'],
}
RED = ['#3b0e0c', '#e0402c', '#ff8a70']
AMBER = ['#3d2a08', '#eea12a', '#ffd27a']
GREEN = ['#0c2a1c', '#2fc47a', '#9ff0c4']


def _post(c, x, top, bottom, m):
 for y in range(top, bottom + 1):
  c.set(x, y, m[5]); c.set(x + 1, y, m[3]); c.set(x + 2, y, m[1])


def _lens(c, cx, cy, lit, ramp, h):
 """A round lens under its visor: lit, it glows to the rim."""
 for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
  c.set(cx + dx, cy + dy, ramp[1] if lit else ramp[0])
 if lit: c.set(cx, cy, ramp[2])
 c.hline(cx - 1, cx + 2, cy - 1, h[0])            # the visor's shadow


def _head(c, x0, y0, m, lit, lenses=3, backplate=False):
 """A signal head: housing, three lenses top to bottom, visors."""
 w, h = 6, 3 + lenses * 4
 if backplate:
  c.rect(x0 - 2, y0 - 1, x0 + w + 1, y0 + h, m[1])
  c.vline(x0 - 2, y0 - 1, y0 + h, m[3])
 c.rect(x0, y0, x0 + w - 1, y0 + h - 1, m[3])
 c.vline(x0, y0, y0 + h - 1, m[5]); c.vline(x0 + w - 1, y0, y0 + h - 1, m[1])
 c.hline(x0, x0 + w - 1, y0, m[6])
 for i, ramp in enumerate((RED, AMBER, GREEN)[:lenses]):
  _lens(c, x0 + 2, y0 + 2 + i * 4, lit == i, ramp, m)


def traffic_signal(v=0):
 """v0 an interwar post-top signal, v1 a postwar three-light head on a
 pole, v2 a modern head with a black backplate and a walk signal."""
 if v == 0:
  c = Canvas(16, 50)
  m = HOUSING['green']
  post = RAMPS['blackiron7']
  _post(c, 6, 17, 45, post)
  c.rect(4, 45, 11, 48, post[3]); c.hline(4, 11, 45, post[5]); c.hline(3, 12, 49, post[1])
  # A four-way head: two faces seen, one full, one edge-on at the right.
  _head(c, 4, 4, m, 2)
  c.rect(10, 5, 11, 17, m[2]); c.vline(11, 5, 17, m[1])
  c.hline(4, 11, 3, m[6]); c.hline(5, 10, 2, m[5]); c.set(7, 1, m[6]); c.set(8, 1, m[4])
  soft_outline(c, m[0], m[2])
  return c.image()
 c = Canvas(18, 60)
 m = HOUSING['yellow' if v == 1 else 'black']
 pole = RAMPS['galvanised7' if v == 1 else 'blackiron7']
 _post(c, 7, 8, 56, pole)
 c.rect(5, 56, 11, 59, pole[3]); c.hline(5, 11, 56, pole[5])
 _head(c, 5, 6, m, 0 if v == 1 else 2, backplate=v == 2)
 # A pedestrian head lower on the pole.
 c.rect(10, 28, 15, 34, m[3]); c.vline(10, 28, 34, m[5]); c.vline(15, 28, 34, m[1])
 if v == 2:
  for x, y in ((12, 30), (13, 30), (12, 31), (13, 32), (12, 32)):
   c.set(x, y, '#f2f2ea')                         # the walking figure
 else:
  c.hline(11, 14, 31, '#e8913a')                  # DONT WALK, lit orange
 c.set(11, 29, m[6])
 # The push button and its sign.
 c.rect(5, 38, 6, 40, '#c9a232' if v == 1 else '#3a3f45'); c.set(5, 38, m[6])
 soft_outline(c, m[0], m[2])
 return c.image()


def traffic_sign(v=0):
 """v0 the North American stop octagon, v1 the European give-way
 triangle, v2 the Japanese stop, an inverted red triangle."""
 c = Canvas(15, 36)
 post = RAMPS['galvanised7']
 _post(c, 6, 12, 35, post)
 red = ['#4a0e0e', '#8c1a1a', '#c32a26', '#e24a3e', '#f07a6a']
 white = '#f1efe6'
 if v == 0:
  rows = [(3, 11), (2, 12), (1, 13), (1, 13), (1, 13), (1, 13), (1, 13), (2, 12), (3, 11)]
  for i, (a, b) in enumerate(rows):
   y = 1 + i
   for x in range(a, b + 1):
    edge = x in (a, b) or i in (0, len(rows) - 1)
    c.set(x, y, white if edge else red[3] if x < 7 else red[2])
  for x, y in ((3, 5), (4, 5), (6, 5), (8, 5), (9, 5), (11, 5), (3, 6), (6, 6), (8, 6), (11, 6)):
   c.set(x, y, white)                             # STOP, too small to spell
 elif v == 1:
  for i in range(10):
   a, b = 1 + i * 6 // 10, 13 - i * 6 // 10
   y = 1 + i
   for x in range(a, b + 1):
    c.set(x, y, red[2] if x in (a, b) or i < 2 else white)
 else:
  for i in range(10):
   a, b = 1 + i * 6 // 10, 13 - i * 6 // 10
   y = 1 + i
   for x in range(a, b + 1):
    c.set(x, y, white if x in (a, b) or i == 0 else red[3] if x < 7 else red[2])
  c.hline(5, 9, 3, white)
 c.hline(5, 9, 35, post[1])
 soft_outline(c, red[0], red[1])
 return c.image()


def utility_pole(v=0):
 """v0 a creosoted timber pole with a crossarm and glass insulators, v1 a
 spun-concrete pole as Japan and Latin America set them, v2 a timber pole
 carrying a transformer. The wires between poles are drawn by the scene."""
 c = Canvas(26, 84)
 if v == 1:
  m = RAMPS['galvanised7']
  for y in range(6, 82):
   half = 1 if y < 40 else 2
   for x in range(12 - half, 12 + half + 1):
    c.set(x, y, m[5] if x < 12 else m[3] if x < 12 + half else m[1])
   if y % 9 == 0: c.set(12, y, m[2])             # the step bolts
 else:
  m = ['#1c140e', '#2c2016', '#3d2c1e', '#503b28', '#664c34', '#7d5f42', '#957454']
  for y in range(4, 82):
   for x in (11, 12, 13):
    c.set(x, y, m[5] if x == 11 else m[3] if x == 12 else m[1])
   if (y * 7) % 11 == 0: c.set(12, y, m[2])      # the split grain
  for x, y in ((11, 50), (12, 50), (11, 51)):    # the pole tag
   c.set(x, y, '#c9b04a')
 arm = RAMPS['oak7'] if v != 1 else RAMPS['galvanised7']
 c.hline(2, 23, 8, arm[5]); c.hline(2, 23, 9, arm[3]); c.hline(2, 23, 10, arm[1])
 for bx in (9, 16):                               # the arm's braces
  for i in range(4):
   c.set(bx + (i if bx > 12 else -i) // 2, 11 + i, arm[2])
 for ix in (3, 8, 17, 22):                        # insulators, glass or porcelain
  glass = ['#2f6b5e', '#58a08c', '#a8dccb'] if v != 1 else ['#6a6c68', '#b8bab4', '#eeeeea']
  c.set(ix, 7, glass[1]); c.set(ix, 6, glass[2]); c.set(ix + 1, 7, glass[0])
 if v == 2:                                       # a transformer can on the pole
  tr = RAMPS['galvanised7']
  for y in range(18, 30):
   for x in range(14, 20):
    c.set(x, y, tr[5] if x == 14 else tr[4] if x < 17 else tr[2])
  c.hline(14, 19, 18, tr[6]); c.hline(14, 19, 29, tr[1])
  c.set(16, 17, '#2f6b5e'); c.set(18, 17, '#2f6b5e')
 c.hline(9, 15, 82, m[1]); c.hline(10, 14, 83, m[0])
 soft_outline(c, m[0], m[2])
 return c.image()


TRAFFIC = {
 'traffic-signal': traffic_signal,
 'traffic-sign': traffic_sign,
 'utility-pole': utility_pole,
}
