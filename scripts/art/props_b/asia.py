"""Street furniture for east, south and southeast Asian settings.

One variant of each per region rather than one design recoloured: a shop board
is not a banner is not a bamboo pennant, and the thing a square is built round
differs more between these three than any roof does.
"""
from math import cos, hypot, pi, sin
from .building import _ground
from .core import Canvas, RAMPS, jitter, soft_outline, grass
from .workshop import WOOD7, streak

LACQUER = ['#2a0f0e', '#4a1614', '#6d211c', '#8f2e24', '#b04236', '#cc6450', '#e28f77']
GOLD = ['#3a2a0a', '#5e4611', '#87661b', '#ab8629', '#c9a53e', '#e0c463', '#f3e097']
SAFFRON = ['#4a2408', '#6e3a0c', '#955613', '#b8751d', '#d2942c', '#e5b453', '#f5d489']
TEAL = ['#0e2a2b', '#16403f', '#1f5a56', '#2c7a70', '#3f9c8b', '#63bda8', '#96dcc5']
CREAM = ['#3b3628', '#5d573f', '#807759', '#a29875', '#bfb694', '#d8d0b4', '#efead3']


def _marks(c, x0, x1, top, bottom, ink, step=7):
 """Writing, as bars rather than glyphs. Deliberately not letters: at this
 size a real script is noise pretending to be language, and asterisks read as
 symbols. Short strokes of varying length read as text and nothing else."""
 mid = (x0 + x1) // 2
 y = top
 n = 0
 while y + 3 <= bottom:
  for k in range(2 + jitter(y, n) % 2):
   half = 1 + jitter(y + k, n) % 3
   c.hline(mid - half, mid + half, y + k, ink)
  if jitter(n, 5) % 3 == 0: c.set(mid, y + 2, ink)
  y += step
  n += 1


def shop_sign(v=0):
 """A trade's board at the street: the signature of an Asian shopfront."""
 c = Canvas(30, 62)
 w = RAMPS[WOOD7[0 if v != 2 else 2]]
 if v == 0:                                        # a lacquered board, capped
  p, ink = LACQUER, GOLD[5]
  for px in (5, 21):                               # the two posts
   for y in range(12, 58):
    c.set(px, y, w[5]); c.set(px + 1, y, w[3]); c.set(px + 2, y, w[1])
   c.hline(px - 1, px + 3, 58, w[1])
  tile = RAMPS['tile']
  for i, half in enumerate((9, 11, 13)):           # a little tiled cap
   for x in range(15 - half, 15 + half + 1):
    c.set(x, 6 + i, tile[5] if x < 15 else tile[3])
    if i == 2 and x % 4 == 0: c.set(x, 6 + i, tile[2])
  c.hline(2, 28, 9, tile[1]); c.set(15, 4, tile[4]); c.set(15, 5, tile[5])
  for y in range(12, 54):                          # the board itself
   for x in range(7, 24):
    u = (x - 7) / 17
    c.set(x, y, p[4] if u < 0.3 else p[3] if u < 0.8 else p[2])
  for x in range(7, 24):
   c.set(x, 12, p[5]); c.set(x, 53, p[1])
  for y in range(12, 54):
   c.set(7, y, GOLD[3]); c.set(23, y, GOLD[1])
  _marks(c, 7, 23, 16, 50, ink)
 elif v == 1:                                      # a painted board and a flag
  p = SAFFRON
  for y in range(10, 58):                          # one stout post
   c.set(13, y, w[5]); c.set(14, y, w[3]); c.set(15, y, w[1])
  c.hline(11, 17, 58, w[1])
  for y in range(12, 30):                          # the board across it
   for x in range(2, 27):
    u = (x - 2) / 25
    band = (y - 12) // 6
    ramp = [p, CREAM, TEAL][band % 3]
    c.set(x, y, ramp[4] if u < 0.3 else ramp[3] if u < 0.8 else ramp[2])
  c.hline(2, 26, 12, p[6]); c.hline(2, 26, 29, p[0])
  for y in range(12, 30): c.set(2, y, p[1]); c.set(26, y, p[1])
  _marks(c, 4, 24, 14, 27, CREAM[6], step=6)
  for i in range(14):                              # a cloth flag below it
   x = 18 + i // 4
   for k in range(7):
    c.set(x + k, 32 + i, TEAL[4] if (k + i) % 5 else TEAL[2])
  c.hline(18, 25, 32, TEAL[6])
  for i in range(4): c.set(18 + i, 45 + i % 2, TEAL[1])
 else:                                             # bamboo and a hanging cloth
  bamboo = RAMPS['greenglaze7']
  for y in range(4, 58):
   c.set(9, y, bamboo[5]); c.set(10, y, bamboo[3]); c.set(11, y, bamboo[1])
   if y % 9 == 0: c.hline(9, 11, y, bamboo[2])
  c.hline(7, 13, 58, w[1])
  c.hline(9, 25, 8, bamboo[4]); c.hline(9, 25, 9, bamboo[2])
  for y in range(11, 46):                          # the banner, hanging
   for x in range(13, 26):
    u = (x - 13) / 13
    fold = (x + y // 3) % 6 == 0
    c.set(x, y, CREAM[2] if fold else CREAM[4] if u < 0.5 else CREAM[3])
  c.hline(13, 25, 11, CREAM[6])
  for x in range(13, 26):                          # a woven fringe at the foot
   c.set(x, 46 + (x % 2), SAFFRON[3])
  _marks(c, 13, 25, 15, 42, SAFFRON[1], step=8)
 soft_outline(c, w[0], w[2])
 grass(c, [(1, 61, 2), (26, 61, 2)])
 return c.image()


def square_focus(v=0):
 """What a square is built round: an arch, a stele, or a spirit house."""
 c = Canvas(74, 78)
 w = RAMPS[WOOD7[0]]
 stone = RAMPS['limestone']
 tile = RAMPS['tile']
 if v == 0:                                        # a memorial arch
  for px in (8, 24, 44, 60):                       # four posts on stone feet
   for y in range(24, 70):
    c.set(px, y, LACQUER[4]); c.set(px + 1, y, LACQUER[3]); c.set(px + 2, y, LACQUER[1])
   for k, half in enumerate((3, 4, 4)):
    for x in range(px + 1 - half, px + 2 + half):
     c.set(x, 70 + k, stone[5] if k == 0 else stone[3] if k == 1 else stone[1])
  for y in range(20, 24):                          # the lower lintel
   for x in range(4, 68):
    c.set(x, y, LACQUER[5] if y == 20 else LACQUER[3] if y < 23 else LACQUER[1])
  for y in range(26, 34):                          # its plaque
   for x in range(26, 46):
    u = (x - 26) / 20
    c.set(x, y, LACQUER[3] if u < 0.7 else LACQUER[2])
  c.hline(25, 46, 25, GOLD[4]); c.hline(25, 46, 34, GOLD[1])
  _marks(c, 27, 45, 27, 33, GOLD[5], step=8)
  for i, (half, y) in enumerate(((30, 16), (33, 14), (36, 12))):   # the upper roof
   for x in range(36 - half, 36 + half + 1):
    c.set(x, y, tile[5] if x < 36 else tile[3])
    if i == 2 and x % 4 == 0: c.set(x, y, tile[2])
  c.hline(0, 72, 17, tile[1])
  for dx in (-36, 36):                             # the eaves curling up
   for k in range(4):
    c.set(36 + dx + (k if dx < 0 else -k), 16 - k, tile[4])
  for i, (half, y) in enumerate(((16, 8), (19, 6), (22, 4))):      # and the crown
   for x in range(36 - half, 36 + half + 1):
    c.set(x, y, tile[5] if x < 36 else tile[3])
  c.hline(13, 59, 9, tile[1]); c.set(36, 2, tile[4]); c.set(36, 3, tile[5])
 elif v == 1:                                      # a stele on its plinth
  for k, (half, y) in enumerate(((16, 66), (18, 68), (20, 70))):
   for x in range(37 - half, 37 + half + 1):
    c.set(x, y, stone[5] if k == 0 else stone[3] if k == 1 else stone[1])
   for yy in range(y, y + 2):
    c.hline(37 - half, 37 + half, yy, stone[4] if k == 0 else stone[2])
  for y in range(58, 68):                          # a tortoise carrying it
   for x in range(22, 53):
    d = hypot((x - 37) / 15.0, (y - 63) / 5.4)
    if d > 1: continue
    c.set(x, y, stone[4] if d < 0.6 else stone[3] if x < 37 else stone[2])
  c.set(20, 62, stone[4]); c.set(21, 61, stone[5]); c.set(19, 63, stone[2])
  c.set(53, 61, stone[3]); c.set(54, 62, stone[2])
  for y in range(14, 59):                          # the slab
   for x in range(26, 49):
    u = (x - 26) / 23
    tone = 5 if u < 0.28 else 4 if u < 0.72 else 2
    if jitter(x // 4, y // 6) % 13 == 0: tone -= 1
    c.set(x, y, stone[max(tone, 1)])
  c.hline(26, 48, 14, stone[6]); c.hline(26, 48, 58, stone[1])
  for y in range(14, 59): c.set(26, y, stone[2]); c.set(48, y, stone[1])
  for k, half in enumerate((12, 13, 12, 10)):      # a rounded, carved head
   for x in range(37 - half, 37 + half + 1):
    c.set(x, 10 + k, stone[5] if x < 37 else stone[3])
  c.hline(28, 46, 9, stone[6])
  _marks(c, 28, 47, 20, 54, stone[1], step=9)
 else:                                             # a spirit house on its post
  for y in range(46, 72):                          # the post
   for x in range(33, 41):
    u = (x - 33) / 8
    c.set(x, y, LACQUER[4] if u < 0.3 else LACQUER[3] if u < 0.75 else LACQUER[1])
  for k, half in enumerate((7, 9, 10)):
   for x in range(37 - half, 37 + half + 1):
    c.set(x, 72 + k, stone[5] if k == 0 else stone[3] if k < 2 else stone[1])
  for y in range(42, 47):                          # the platform
   for x in range(20, 55):
    c.set(x, y, w[5] if y == 42 else w[4] if y < 45 else w[1])
  for x in range(20, 55, 4):                       # its little railing
   for k in range(4): c.set(x, 38 + k, GOLD[4] if k < 2 else GOLD[2])
  c.hline(20, 54, 37, GOLD[5]); c.hline(20, 54, 38, GOLD[2])
  for y in range(22, 38):                          # the house itself
   for x in range(24, 51):
    u = (x - 24) / 27
    c.set(x, y, LACQUER[4] if u < 0.3 else LACQUER[3] if u < 0.78 else LACQUER[2])
  for y in range(26, 36):                          # its open front
   for x in range(32, 43):
    c.set(x, y, '#1a0d0c' if y < 34 else LACQUER[1])
  c.hline(31, 43, 25, GOLD[4])
  for i, half in enumerate((11, 14, 17)):          # a steep tiered roof
   for x in range(37 - half, 37 + half + 1):
    c.set(x, 18 + i, GOLD[5] if x < 37 else GOLD[3])
  c.hline(19, 55, 21, GOLD[1])
  for i, half in enumerate((6, 9, 12)):
   for x in range(37 - half, 37 + half + 1):
    c.set(x, 12 + i, GOLD[5] if x < 37 else GOLD[3])
  c.hline(24, 50, 15, GOLD[1])
  for dx in (-17, 17):                             # finials at the eaves
   for k in range(5):
    c.set(37 + dx + (k if dx < 0 else -k), 20 - k, GOLD[4])
  c.set(37, 9, GOLD[5]); c.set(37, 10, GOLD[4]); c.set(37, 11, GOLD[3])
  for x, y in [(28, 44), (31, 44), (45, 44)]:      # offerings on the platform
   c.set(x, y - 1, CREAM[5]); c.set(x, y - 2, CREAM[3])
 soft_outline(c, stone[0] if v == 1 else LACQUER[0], stone[2])
 _ground(c, 37, 74, 30)
 return c.image()


ASIA = {
 'shop-sign': shop_sign,
 'square-focus': square_focus,
}
