"""Street lighting, by era and region.

A lamp is three to five metres tall — three times a person — so these are the
tallest props in the set. Each draws an unlit and a lit state; the renderer
swaps them at dusk.
"""
from math import hypot
from .core import Canvas, RAMPS, jitter, soft_outline, grass

FLAME = ['#7a2f17', '#c25a1e', '#ef8f2c', '#ffc257', '#ffe9a8', '#fff8dc']
GAS = ['#4a3a12', '#8d6d1c', '#c4a02c', '#efd06a', '#fff3bd', '#fffbe6']
SODIUM = ['#4a2c08', '#8a5410', '#c08420', '#e6b348', '#ffe08c', '#fff4cc']
MERCURY = ['#20323d', '#2f5568', '#4a8298', '#7fb4c4', '#c4e2ea', '#eaf7fa']


def _column(c, x, top, bottom, p, width=3, flute=True):
 """An iron or timber shaft: lit edge, shaded edge, one line of detail."""
 for y in range(top, bottom + 1):
  for i in range(width):
   tone = 5 if i == 0 else 3 if i < width - 1 else 1
   c.set(x + i, y, p[tone])
  if flute and y % 4 == 0 and width > 2:
   c.set(x + 1, y, p[2])


def _plinth(c, cx, y, p, w=4, h=4):
 """The stone or iron foot it stands on, stepped out at the bottom."""
 for k in range(h):
  half = w - 1 + k // 2
  for x in range(cx - half, cx + half + 1):
   tone = 5 if k == 0 else 4 if x < cx else 2
   c.set(x, y + k, p[tone])
 c.hline(cx - w - h // 2, cx + w + h // 2, y + h, p[1])


def torch_post(v=0):
 """A brand in an iron cresset on a timber post: what a gate had before gas."""
 c = Canvas(15, 38)
 w = RAMPS[['oak7', 'walnut7', 'ash7'][v]]
 m = RAMPS['blackiron7']
 _plinth(c, 7, 33, RAMPS['granite'][:6] + [RAMPS['granite'][5]], w=3, h=4)
 _column(c, 6, 8, 33, w, width=3, flute=False)
 for y in range(10, 33, 5):                       # binding rings
  c.hline(5, 9, y, m[3]); c.hline(5, 9, y + 1, m[1])
 for i, (x, y) in enumerate([(4, 8), (3, 7), (3, 6), (4, 5),
                             (10, 8), (11, 7), (11, 6), (10, 5)]):
  c.set(x, y, m[4] if i < 4 else m[2])            # the cresset's bars
 c.hline(3, 11, 8, m[2]); c.hline(4, 10, 9, m[1])
 for x in range(4, 11): c.set(x, 7, FLAME[1])     # the brand inside it
 for k, (x, y, wd) in enumerate([(5, 6, 5), (6, 4, 3), (6, 2, 2), (7, 0, 1)]):
  for i in range(wd):
   c.set(x + i, y, FLAME[min(1 + k, 4)])
  c.set(x, y - 1, FLAME[min(2 + k, 4)])
 c.set(7, 1, FLAME[5]); c.set(6, 3, FLAME[4])
 soft_outline(c, w[0], w[2])
 return c.image()


def brazier_post(v=0):
 """A fire basket on a stone column: a square's light before street lamps."""
 c = Canvas(19, 42)
 s = RAMPS[['granite', 'sandstone', 'limestone'][v]]
 p = [s[0], s[1], s[2], s[3], s[4], s[5]]
 m = RAMPS['blackiron7']
 _plinth(c, 9, 36, p, w=4, h=5)
 for y in range(12, 36):                          # the column, slightly tapered
  half = 3 if y > 18 else 2
  for x in range(9 - half, 9 + half + 1):
   c.set(x, y, p[5] if x < 9 else p[3] if x < 9 + half else p[1])
  if y % 6 == 0: c.hline(9 - half, 9 + half, y, p[2])
 for y, half in ((11, 5), (10, 6), (9, 6)):       # the basket's belly
  for x in range(9 - half, 9 + half + 1):
   c.set(x, y, m[4] if x < 9 else m[2])
 for x in range(3, 16, 2): c.set(x, 10, m[1])     # its bars
 c.hline(3, 15, 8, m[5]); c.hline(3, 15, 9, m[2])
 for k, (x, y, wd) in enumerate([(5, 7, 9), (6, 5, 7), (7, 3, 5), (8, 1, 3)]):
  for i in range(wd):
   c.set(x + i, y, FLAME[min(1 + k, 4)])
 c.set(9, 0, FLAME[5]); c.set(8, 2, FLAME[4]); c.set(11, 4, FLAME[3])
 soft_outline(c, m[0], p[2])
 return c.image()


def lantern_post(v=0):
 """A paper lantern in a little roofed box: the East Asian street standard."""
 c = Canvas(19, 46)
 w = RAMPS[['walnut7', 'oak7', 'ash7'][v]]
 paper = ['#3a2a20', '#6b4a33', '#a8713f', '#d9a45c', '#f2d493', '#fff3cf']
 if v == 1: paper = ['#3a1d1a', '#6e2b22', '#a3402c', '#c9603c', '#e0906a', '#f7c9a6']
 _plinth(c, 9, 40, RAMPS['granite'], w=3, h=5)
 _column(c, 8, 16, 40, w, width=3, flute=False)
 for y in range(20, 40, 6):
  c.hline(7, 11, y, w[2])
 for y, half in ((9, 7), (8, 8), (7, 6), (6, 4)):  # the little hipped roof
  for x in range(9 - half, 9 + half + 1):
   c.set(x, y, w[5] if x < 9 else w[3])
   if (x + y) % 3 == 0: c.set(x, y, w[2])
 c.set(9, 5, w[4]); c.set(9, 4, w[5])             # the finial
 for y in range(10, 17):                          # the paper box
  for x in range(4, 15):
   edge = x in (4, 14)
   c.set(x, y, paper[1] if edge else paper[3])
 for x in (4, 9, 14):                             # its frame ribs
  for y in range(10, 17): c.set(x, y, paper[0] if x != 9 else paper[1])
 c.hline(4, 14, 10, w[1]); c.hline(4, 14, 16, w[1])
 soft_outline(c, w[0], w[2])
 return c.image()


def gas_lamp(v=0):
 """Cast iron and four panes of glass: the eighteenth-century street lit."""
 c = Canvas(17, 54)
 m = RAMPS[['blackiron7', 'galvanised7', 'brass7b'][v]]
 _plinth(c, 8, 47, m, w=4, h=6)
 for y in range(42, 47):                          # the swelling base of the column
  half = 2 + (y - 42) // 2
  for x in range(8 - half, 8 + half + 1):
   c.set(x, y, m[5] if x < 8 else m[3] if x < 8 + half else m[1])
 _column(c, 7, 14, 42, m, width=3)
 for y in (20, 30):                               # mouldings up the shaft
  c.hline(6, 10, y, m[5]); c.hline(6, 10, y + 1, m[1])
 c.hline(2, 14, 17, m[4]); c.hline(3, 13, 18, m[1])   # the ladder bar
 c.set(2, 16, m[3]); c.set(14, 16, m[3])
 c.rect(6, 12, 10, 14, m[3]); c.hline(6, 10, 12, m[5])
 # Unlit glass: the light itself is an effect the renderer adds later.
 pane = ['#2a3033', '#39414a', '#4e5a63', '#6d7b84', '#9fb0b8', '#c9d8de']
 for y in range(4, 12):                           # the lantern, four panes
  inset = 0 if y < 11 else 1
  for x in range(3 + inset, 14 - inset):
   c.set(x, y, pane[4] if x < 8 else pane[3])
 for x in (3, 8, 13):
  for y in range(4, 12): c.set(x, y, m[2])
 c.hline(3, 13, 7, m[2])
 for y, half in ((3, 6), (2, 5), (1, 3)):         # the domed cap
  for x in range(8 - half, 8 + half + 1):
   c.set(x, y, m[5] if x < 8 else m[3])
 c.set(8, 0, m[6])
 soft_outline(c, m[0], m[2])
 return c.image()


def electric_lamp(v=0):
 """A swan neck and an enamel shade: the wired street, 1890 to the war."""
 c = Canvas(24, 62)
 m = RAMPS[['blackiron7', 'galvanised7', 'pewter7'][v]]
 glass = MERCURY if v == 2 else GAS
 _plinth(c, 7, 55, m, w=4, h=6)
 for y in range(50, 55):
  half = 2 + (y - 50) // 2
  for x in range(7 - half, 7 + half + 1):
   c.set(x, y, m[5] if x < 7 else m[3] if x < 7 + half else m[1])
 _column(c, 6, 12, 50, m, width=3)
 c.hline(5, 9, 24, m[5]); c.hline(5, 9, 25, m[1])
 for i, (x, y) in enumerate([(6, 11), (7, 9), (9, 7), (12, 6), (15, 6), (17, 7)]):
  c.set(x, y, m[5]); c.set(x + 1, y, m[3]); c.set(x + 1, y + 1, m[1])
 c.set(18, 8, m[3]); c.set(18, 9, m[2])           # down to the shade
 for y, half in ((10, 5), (11, 6), (12, 5), (13, 3)):   # the enamel shade
  for x in range(18 - half, 18 + half + 1):
   c.set(x, y, m[6] if x < 18 else m[4] if x < 18 + half else m[2])
 c.hline(13, 23, 13, m[1])
 for y in range(14, 17):                          # the lamp under it
  half = 3 - (y - 14)
  for x in range(18 - half, 18 + half + 1):
   c.set(x, y, glass[1] if y == 16 else m[5])
 soft_outline(c, m[0], m[2])
 return c.image()


def sodium_lamp(v=0):
 """A tapered steel column and a cut-off head: the road since about 1960."""
 c = Canvas(33, 70)
 m = RAMPS[['galvanised7', 'pewter7', 'blackiron7'][v]]
 glass = SODIUM if v != 1 else MERCURY
 for y in range(64, 70):                          # a plain concrete foot
  half = 3 + (y - 64) // 3
  for x in range(6 - half, 6 + half + 1):
   c.set(x, y, m[4] if x < 6 else m[2])
 for y in range(6, 64):                           # the column, tapering upward
  half = 2 if y < 30 else 1
  for x in range(6 - half, 6 + half + 1):
   c.set(x, y, m[5] if x < 6 else m[3] if x < 6 + half else m[1])
 c.hline(3, 9, 58, m[2]); c.hline(3, 9, 59, m[1])  # the access door
 for i, (x, y) in enumerate([(6, 5), (7, 4), (9, 3), (12, 2), (15, 2), (18, 2)]):
  c.set(x, y, m[5]); c.set(x, y + 1, m[3]); c.set(x, y + 2, m[1])
 for x in range(18, 27):                          # the arm running out
  c.set(x, 2, m[5]); c.set(x, 3, m[3]); c.set(x, 4, m[1])
 for y, (a, b) in {5: (19, 28), 6: (18, 29), 7: (19, 28)}.items():   # the head
  for x in range(a, b + 1):
   c.set(x, y, m[5] if y == 5 else m[3] if y == 6 else m[1])
 for x in range(20, 28):                          # the bowl under it
  c.set(x, 8, glass[1] if 21 < x < 27 else m[2])
 soft_outline(c, m[0], m[2])
 return c.image()


LAMPS = {
 'torch-post': torch_post,
 'brazier-post': brazier_post,
 'lantern-post': lantern_post,
 'gas-lamp': gas_lamp,
 'electric-lamp': electric_lamp,
 'sodium-lamp': sodium_lamp,
}
