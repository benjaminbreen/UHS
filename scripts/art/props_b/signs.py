"""Shop signs outside the Asian street: Europe, and the souk.

Signage is a market's habit, not a universal one. Each family here is one
region's answer to the same problem — a painted tablet, a bracket and a board,
a bush on a pole, a plaque, a rail of the goods themselves, a pennant — drawn
the way the Asian boards are, standing on their own posts beside the door.
"""
from .asia import _marks
from .building import _ground
from .core import Canvas, RAMPS, jitter, soft_outline, grass

PLASTER = ['#2e2b23', '#4b463a', '#6f6857', '#948c76', '#b4ac93', '#d0c8ae', '#e9e2c9']
OCHRE = ['#2c150f', '#4a2416', '#6b3720', '#8c4b2a', '#a86438', '#c3854f', '#dcab74']
LEAF = ['#16220f', '#22351a', '#324c24', '#446531', '#587f40', '#749b55', '#97b876']
INDIGO = ['#0f1826', '#182740', '#213a5c', '#2c527c', '#3d6f99', '#5b90b5', '#8ab4d0']
INK = '#1b1510'
TEAL = ['#0e2a2b', '#16403f', '#1f5a56', '#2c7a70', '#3f9c8b', '#63bda8', '#96dcc5']
SLIP = ['#332e22', '#4f4835', '#71684c', '#918768', '#ada284', '#c7bda2', '#e2dac2']


def _board(c, x0, x1, top, bottom, p, shade=(0.3, 0.8)):
 """A flat painted panel, lit at the left and turning away to the right."""
 lo, hi = shade
 for y in range(top, bottom + 1):
  for x in range(x0, x1 + 1):
   u = (x - x0) / max(x1 - x0, 1)
   c.set(x, y, p[5] if u < lo else p[4] if u < hi else p[3])
 c.hline(x0, x1, top, p[6])
 c.hline(x0, x1, bottom, p[1])


def _post(c, x, top, base, w):
 for y in range(top, base + 1):
  c.set(x, y, w[5]); c.set(x + 1, y, w[3]); c.set(x + 2, y, w[1])
 c.hline(x - 1, x + 3, base, w[1])


# Painted emblems, hand-authored: at 20-odd pixels a formula draws a blob.
# A European sign was read by people who could not read, so the trade's own
# tools are the whole message and there is no lettering anywhere on it.
TANKARD = [
 '......ffffff........',
 '....ffFFFFFFff......',
 '...fFFffffffFFf.....',
 '..ffFffffffffFf.....',
 '..PPPPPPPPPPPPP.....',
 '..PdppppppppPP..hhh.',
 '..PdppppppppPP.hhPh.',
 '..PdppppppppPP.hh.h.',
 '..PdppppppppPP....h.',
 '..PdppppppppPP....h.',
 '..PdppppppppPP....h.',
 '..PdppppppppPP.hh.h.',
 '..PdppppppppPP.hhPh.',
 '..PdppppppppPP..hhh.',
 '..PdppppppppPP......',
 '..PdppppppppPP......',
 '..PPdppppppPPP......',
 '...PPPPPPPPPP.......',
 '....PPPPPPPP........',
]
SHEARS = [
 '...b..........b...',
 '...bb........bb...',
 '....bb......bb....',
 '.....bb....bb.....',
 '......bb..bb......',
 '.......bBBb.......',
 '........rr........',
 '.......bb.bb......',
 '......bb....bb....',
 '.....bb......bb...',
 '....oo........oo..',
 '...o..o......o..o.',
 '..o....o....o....o',
 '..o....o....o....o',
 '...o..o......o..o.',
 '....oo........oo..',
]
SMITHY = [
 '..............hhh.',
 '.............hHHHh',
 '.............hHHHh',
 '..........ww.hhhh.',
 '.........ww.......',
 '........ww........',
 '.aaaaaaaaaaaaa....',
 'aAAAAAAAAAAAAAa...',
 '.aaAAAAAAAAAAa....',
 '....aaAAAAaa......',
 '......aAAa........',
 '......aAAa........',
 '.....aAAAAa.......',
 '....aAAAAAAa......',
 '...aAAAAAAAAa.....',
 '...aaaaaaaaaa.....',
]
LOAF = [
 '......LLLLLL......',
 '....LLllllllLL....',
 '...LllllllllllL...',
 '..LlllcllllcllllL.',
 '..LllcllllcllllllL',
 '.LllcllllcllllllL.',
 '.LllllllllllllllL.',
 '..LllllllllllllL..',
 '...LLllllllllLL...',
 '.....LLLLLLLL.....',
]
BOOT = [
 '..ssss..........',
 '.sSSSSs.........',
 '.sSlSSs.........',
 '.sSSSSs.........',
 '.sSlSSs.........',
 '.sSSSSs.........',
 '.sSlSSs.........',
 '.sSSSSs.........',
 '.sSSSSsssss.....',
 '.sSSSSSSSSSss...',
 '.sSSSSSSSSSSSs..',
 '.sSSSSSSSSSSSSs.',
 '.ssssssssssssss.',
 '.kkkkkkkkkkkkkk.',
 '..kkkkkkkkkkkk..',
]
JAR = [
 '.....jjjjjj.....',
 '....jJJJJJJj....',
 '...jjjjjjjjjj...',
 '..jJJJJJJJJJJj..',
 '.jJJJJJJJJJJJJj.',
 'jJJJJJJJJJJJJJJj',
 'jJJJJJJJJJJJJJJj',
 'jJJJJJJJJJJJJJJj',
 '.jJJJJJJJJJJJJj.',
 '.jJJJJJJJJJJJJj.',
 '..jJJJJJJJJJJj..',
 '...jJJJJJJJJj...',
 '....jjJJJJjj....',
 '......jjjj......',
]
BELL = [
 '.......nn.......',
 '......nNNn......',
 '.....nNNNNn.....',
 '....nNNNNNNn....',
 '...nNNNNNNNNn...',
 '..nNNNNNNNNNNn..',
 '..nNNNNNNNNNNn..',
 '.nNNNNNNNNNNNNn.',
 '.nNNNNNNNNNNNNn.',
 'nNNNNNNNNNNNNNNn',
 'nnnnnnnnnnnnnnnn',
 '.....nNNNNn.....',
 '......nnnn......',
]


def _emblem(c, art, x, y, keys, rim=INK):
 """Paint over the board, then ring it. A painted emblem on oak needs its own
 dark edge or the grain eats it."""
 drawn = set()
 for dy, row in enumerate(art):
  for dx, ch in enumerate(row):
   if ch in keys:
    c.set(x + dx, y + dy, keys[ch]); drawn.add((x + dx, y + dy))
 for (px, py) in drawn:
  for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
   if (px + dx, py + dy) not in drawn: c.set(px + dx, py + dy, rim)


def _panel(c, cx, top, bottom, half, w, band=None):
 """A board of vertical planks, shaded across and grained down its length."""
 for y in range(top, bottom + 1):
  h = half(y)
  if h <= 0: continue
  for x in range(cx - h, cx + h + 1):
   u = (x - (cx - h)) / max(h * 2, 1)
   tone = 5 if u < 0.22 else 4 if u < 0.62 else 3 if u < 0.88 else 2
   if (x - cx) % 5 == 0: tone -= 1                 # the joint between planks
   if jitter(x, y // 5) % 9 == 0: tone -= 1        # grain, down the length
   c.set(x, y, w[max(min(tone, 6), 1)])
  edge = band or w
  c.set(cx - h, y, edge[1]); c.set(cx + h, y, edge[0] if band else w[1])
  if band:
   c.set(cx - h + 1, y, edge[4]); c.set(cx + h - 1, y, edge[2])
 for y in (top, bottom):                           # the lit top and dark foot
  h = half(y)
  if h > 0: c.hline(cx - h, cx + h, y, (band or w)[5 if y == top else 1])


# What each board says, in order. The sign is the trade: a house that sells
# nothing hangs nothing, so there is no blank board in the set.
EMBLEMS = ['drink', 'cloth', 'metal', 'bread', 'leather', 'goods', 'house']
# The board, and what hangs it. A sign is drawn larger than life so it reads
# at a glance, but at 17px to the metre the first cut stood four metres up and
# was wider than the house behind it. These numbers are the whole scale of the
# family: the board is about a metre and a half across, the post two and a bit.
CX, TOP, BOT, HALF = 23, 13, 43, 15
MID = (TOP + BOT) // 2


def _centred(c, art, keys, dx=0, dy=0):
 """Put an emblem in the middle of the board, wherever the board is."""
 w, h = max(len(r) for r in art), len(art)
 _emblem(c, art, CX - w // 2 + dx, MID - h // 2 + dy, keys)


def _paint(c, v):
 """The emblem for this variant, painted on the board."""
 pew, iron, oak = RAMPS['pewter7'], RAMPS['iron7'], RAMPS['oak7']
 if v == 0:
  _centred(c, TANKARD, {
   'f': PLASTER[6], 'F': PLASTER[4], 'P': pew[5], 'p': pew[3], 'd': pew[1],
   'h': pew[4]})
 elif v == 1:
  _centred(c, SHEARS, {
   'b': pew[5], 'B': pew[6], 'r': iron[2], 'o': pew[3]}, dx=-2, dy=-4)
  spool, flange = RAMPS['rustred7'], RAMPS['buffclay7']
  sx, sy = CX + 4, MID + 4                         # a spool of thread by them
  for y in range(sy, sy + 7):
   for x in range(sx, sx + 5):
    u = (x - sx) / 5
    c.set(x, y, spool[5] if u < 0.3 else spool[4] if u < 0.7 else spool[2])
   if (y - sy) % 3 == 0: c.hline(sx, sx + 4, y, spool[6])
  for y in (sy - 1, sy + 7):
   c.hline(sx - 2, sx + 6, y, flange[5]); c.hline(sx - 2, sx + 6, y + 1, flange[2])
  cloth = RAMPS['paintblue7']                      # and a fold of blue cloth
  for i in range(6):
   x0, x1 = CX - 10 + i // 2, CX + 1 - i // 3
   for x in range(x0, x1):
    c.set(x, MID + 5 + i, cloth[5] if (x + i) % 5 else cloth[3])
   c.set(x0 - 1, MID + 5 + i, '#141c26'); c.set(x1, MID + 5 + i, '#141c26')
  c.hline(CX - 11, CX + 1, MID + 4, cloth[6])
  c.hline(CX - 8, CX - 1, MID + 11, '#141c26')
 elif v == 2:
  _centred(c, SMITHY, {
   'a': iron[1], 'A': iron[4], 'h': iron[5], 'H': iron[6], 'w': oak[4]})
 elif v == 3:
  crust, crumb = RAMPS['oak7'], RAMPS['buffclay7']
  _centred(c, LOAF, {'L': crust[2], 'l': crumb[6], 'c': crust[3]})
 elif v == 4:
  hide = RAMPS['walnut7']
  _centred(c, BOOT, {
   's': hide[1], 'S': hide[5], 'l': RAMPS['buffclay7'][6],
   'k': RAMPS['blackiron7'][3]})
 elif v == 5:
  clay = RAMPS['terracotta7']
  _centred(c, JAR, {'j': clay[2], 'J': clay[5]})
  for k in range(4):                               # a handle either side
   c.set(CX - 8 - k // 3, MID - 2 + k, clay[4])
   c.set(CX + 8 + k // 3, MID - 2 + k, clay[3])
 else:
  bell = RAMPS['brass7']
  _centred(c, BELL, {'n': bell[2], 'N': bell[5]}, dy=1)
  for k in range(3): c.set(CX + k % 2, MID - 8 + k, bell[4])


def hanging_sign(v=0):
 """The European street: a gallows post, an iron arm, and a painted board.

 A board hung on chains from a scrolled bracket, with the trade's own tools
 painted on it — a tankard, shears and cloth, hammer and anvil, a loaf, a
 boot, a jar, a bell. No lettering: most people passing could not read one,
 which is why the sign is a picture in the first place. The post is the
 kerbside form, which is what can stand free of a wall.
 """
 c = Canvas(44, 52)
 shape = v % 3
 w = RAMPS[['oak7', 'walnut7', 'oak7'][shape]]
 m = RAMPS['blackiron7']
 for y in range(4, 49):                            # the post
  c.set(5, y, w[5]); c.set(6, y, w[3]); c.set(7, y, w[1])
 c.hline(4, 8, 49, w[1]); c.hline(4, 8, 4, w[6])
 for y in range(4, 14):                            # its iron strap at the head
  if y % 3: c.set(4, y, m[4]); c.set(8, y, m[2])
 c.hline(4, 8, 5, m[5]); c.hline(4, 8, 13, m[3])
 for x in range(8, 37):                            # the arm out over the street
  twist = shape == 2 and x % 4 < 2                 # one smith twisted his own
  c.set(x, 6, m[5] if not twist else m[3]); c.set(x, 7, m[3] if not twist else m[2])
 for k in range(4):                                # a spear finial at the tip
  c.set(37 + k, 6, m[5]); c.set(37 + k, 7, m[2])
 c.set(37, 5, m[4]); c.set(37, 8, m[3]); c.set(40, 6, m[4])
 for k in range(5):                                # a scroll bracing it
  c.set(9 + k, 8 + (4 - k), m[4]); c.set(10 + k, 9 + (4 - k), m[2])
 c.set(9, 12, m[4]); c.set(10, 12, m[3]); c.set(11, 11, m[2])
 for hx in (14, 33):                               # the two chains
  for k in range(TOP - 8):
   c.set(hx, 8 + k, m[5] if k % 2 else m[2])
   c.set(hx + (1 if k % 2 else -1), 8 + k, m[3])
 if shape == 0:                                    # a barrel end
  r = (BOT - TOP) / 2 + 0.5
  half = lambda y: int((1 - ((y - MID) / r) ** 2) ** 0.5 * HALF)
  _panel(c, CX, TOP, BOT, half, w)
  hoop = RAMPS['iron7']
  for y in (TOP + 4, BOT - 4):
   h = half(y)
   c.hline(CX - h, CX + h, y, hoop[4]); c.hline(CX - h, CX + h, y + 1, hoop[1])
 elif shape == 1:                                  # a board with cut corners
  def half(y):
   return HALF - max(3 - min(y - TOP, BOT - y), 0)
  _panel(c, CX, TOP, BOT, half, w)
 else:                                             # an iron-bound shield
  def half(y):
   t = (y - TOP) / (BOT - TOP)
   return int(HALF * (1 - max(t - 0.55, 0) ** 1.6 * 2.2)) if t < 0.98 else 2
  band = RAMPS['iron7']
  _panel(c, CX, TOP, BOT, half, w, band)
  for y in range(TOP, BOT):                        # rivets round the binding
   if (y - TOP) % 6 == 3:
    h = half(y)
    c.set(CX - h + 1, y, band[6]); c.set(CX + h - 1, y, band[5])
 _paint(c, v)
 soft_outline(c, w[0], w[2])
 _ground(c, 6, 49, 6)
 grass(c, [(1, 51, 2), (11, 51, 2)])
 return c.image()


def _naskh(c, x0, x1, y, ink, dots):
 """Writing that runs along a line rather than down a column. Not letters: at
 this size a real script is noise pretending to be language. A baseline with
 ascenders and a scatter of points reads as Arabic and as nothing else."""
 c.hline(x0, x1, y, ink)
 x = x0 + 1
 while x < x1 - 1:
  n = jitter(x, y)
  if n % 3 == 0:                                   # an ascender
   for k in range(1, 3 + n % 2): c.set(x, y - k, ink)
  elif n % 3 == 1:                                 # a bowl under the line
   c.set(x, y + 1, ink); c.set(x + 1, y + 1, ink)
  if n % 5 == 0: c.set(x, y - 5, dots)             # and its points
  x += 2 + n % 2


def souk_sign(v=0):
 """West of the Indus: the stock hung at the door, not a board.

 A suq shop was open-fronted and identified by what was on show and by which
 lane it stood in — the coppersmiths' row, the spice row — so the sign is the
 goods themselves on a short bracket. No pictorial board: that is a European
 habit, and a glazed inscription panel belongs to a mosque or a madrasa, not
 to a grocer. The one lettered form here is the carved foundation plaque a
 public building really did carry.
 """
 c = Canvas(40, 52)
 w = RAMPS['walnut7']
 m = RAMPS['blackiron7']
 cop, bra = RAMPS['copperpot7'], RAMPS['brasspot7']
 for y in range(6, 49):                            # the post
  c.set(5, y, w[5]); c.set(6, y, w[3]); c.set(7, y, w[1])
 c.hline(4, 8, 49, w[1]); c.hline(4, 8, 6, w[6])
 if v != 6:
  for x in range(8, 32):                           # a plain bracket, no scroll
   c.set(x, 9, m[5]); c.set(x, 10, m[2])
  for k in range(4): c.set(31 - k // 2, 11 + k, m[4])   # a hook at the tip
  for k in range(3): c.set(6 + k, 12 + k, m[3])         # a stay to the post
 hang = lambda hx, n=3: [c.set(hx, 11 + k, m[4 if k % 2 else 2]) for k in range(n)]
 if v == 0:                                        # the coffee seller: a dallah
  hang(23, 4)
  for i in range(15):                              # a narrow body: pot, not gourd
   t = i / 14
   half = 3.0 + 4.2 * (1 - abs(t - 0.66) * 1.5)
   for x in range(round(23 - half), round(23 + half) + 1):
    u = (x - (23 - half)) / max(half * 2, 1)
    c.set(x, 26 + i, bra[6] if u < 0.2 else bra[5] if u < 0.45 else bra[3] if u < 0.78 else bra[1])
  for i in range(10):                              # the tall neck
   half = 3 - i // 5
   for x in range(23 - half, 24 + half):
    c.set(x, 16 + i, bra[5] if x < 23 else bra[3])
  for k in range(4): c.set(23, 12 + k, bra[6 - k])  # the lid and its finial
  c.hline(20, 26, 25, bra[6]); c.hline(20, 26, 26, bra[2]); c.hline(21, 25, 15, bra[4])
  for k in range(12):                              # the long spout, clear of it
   x, y = 16 - k * 3 // 4, 38 - k
   c.set(x, y, bra[6]); c.set(x + 1, y, bra[4]); c.set(x + 2, y, bra[1])
  c.set(7, 27, bra[5]); c.set(8, 26, bra[4])
  for k in range(11):                              # and the handle behind it
   dx = 5 - abs(k - 5) // 2
   c.set(27 + dx, 29 + k, bra[5]); c.set(28 + dx, 29 + k, bra[2])
 elif v == 1:                                      # the cloth seller: a rug
  field, edge = RAMPS['rustred7'], INDIGO
  for y in range(12, 38):                          # the rug, doubled over the bar
   x0, x1 = 9 + (y < 14), 34 - (y < 14)
   t = (y - 12) / 25
   for x in range(x0, x1 + 1):
    u = (x - x0) / (x1 - x0)
    border = u < 0.14 or u > 0.86 or t < 0.08 or t > 0.93
    p = edge if border else field
    tone = 5 if u < 0.3 else 4 if u < 0.72 else 3
    if border and (x + y) % 3 == 0: tone += 1      # the pattern in the border
    c.set(x, y, p[max(min(tone, 6), 1)])
  cream = SLIP
  for k in range(11):                              # a lozenge in the middle
   wide = 5 - abs(k - 5)
   if wide < 0: continue
   for x in range(22 - wide, 23 + wide):
    on_edge = abs(abs(x - 22) - wide) < 1 or abs(x - 22) == wide
    inner = abs(abs(x - 22) - max(wide - 2, 0)) < 1 and wide > 2
    c.set(x, 19 + k, cream[6] if on_edge else field[2] if inner else field[4])
  for i in range(2):                               # the fold over the bar
   c.hline(9, 34, 12 + i, edge[6 - i * 3])
  for x in range(9, 35):                           # and the fringe at the foot
   c.set(x, 38, cream[4 if x % 2 else 2]); c.set(x, 39, cream[1])
   if x % 3 == 0: c.set(x, 40, cream[2])
 elif v == 2:                                      # the coppersmith
  hang(15, 4); hang(28, 4)
  for i in range(19):                              # a beaten tray, flat on
   half = round(9.5 * (1 - ((i - 9) / 9.6) ** 2) ** 0.5) if abs(i - 9) < 10 else 0
   for x in range(15 - half, 16 + half):
    u = (x - (15 - half)) / max(half * 2, 1)
    ring = (abs(x - 15) + abs(i - 9)) % 5 == 0
    c.set(x, 15 + i, cop[6] if u < 0.22 else cop[2] if ring else cop[4] if u < 0.7 else cop[3])
  for i in range(14):                              # and a small ewer beside it
   t = i / 13
   half = 1.8 if t < 0.3 else 5.5 - abs(t - 0.62) * 6
   for x in range(round(28 - half), round(28 + half) + 1):
    u = (x - (28 - half)) / max(half * 2, 1)
    c.set(x, 15 + i, bra[6] if u < 0.25 else bra[4] if u < 0.7 else bra[2])
  for k in range(5): c.set(24 - k // 2, 26 - k, bra[5])
  for k in range(6): c.set(32 + (3 - abs(k - 3) // 2), 22 + k, bra[4])
 elif v == 3:                                      # the baker: ring loaves
  for x in range(10, 32): c.set(x, 13, RAMPS['rope'][3]); c.set(x, 14, RAMPS['rope'][1])
  crust = RAMPS['oak7']
  seed = RAMPS['buffclay7']
  for cx, r, hole in ((19, 10, 4), (31, 6, 2)):
   for y in range(-r, r + 1):
    for x in range(-r, r + 1):
     d = (x * x + (y * 1.05) ** 2) ** 0.5
     if d > r or d < hole: continue
     tone = 6 if x + y < -r * 0.7 else 5 if d > r - 2.2 else 4 if jitter(x, y) % 3 else 3
     c.set(cx + x, 16 + r + y, crust[tone])
     if jitter(x * 3, y * 5) % 9 == 0: c.set(cx + x, 16 + r + y, seed[6])
   for k in range(3): c.set(cx, 15 + r - k, RAMPS['rope'][2])
   c.set(cx - 1, 16 + r - hole, crust[2]); c.set(cx + 1, 16 + r - hole, crust[2])
 elif v == 4:                                      # the slipper maker
  for x in range(10, 32): c.set(x, 13, RAMPS['rope'][3]); c.set(x, 14, RAMPS['rope'][1])
  for sx, hide in ((12, OCHRE), (25, RAMPS['rustred7'])):
   for k in range(7): c.set(sx + 3, 15 + k, RAMPS['rope'][2])
   # A flat sole with the toe turned up at the end: the shape that says slipper
   # rather than bag.
   for j, (x0, x1) in enumerate(((0, 5), (0, 7), (0, 8), (0, 9), (0, 9))):
    for x in range(sx + x0, sx + x1 + 1):
     u = (x - (sx + x0)) / max(x1 - x0, 1)
     c.set(x, 22 + j, hide[5] if u < 0.3 else hide[4] if u < 0.72 else hide[2])
   c.hline(sx, sx + 5, 22, hide[6])
   c.hline(sx, sx + 9, 27, hide[1])                # the sole
   for k in range(4): c.set(sx + 9 + k // 2, 26 - k, hide[4 if k % 2 else 6])
   c.set(sx + 10, 22, hide[2])
   for k in range(3): c.set(sx + 1 + k, 24, hide[6])
 elif v == 5:                                      # the grain and spice dealer
  for k in range(5): c.set(21, 11 + k, m[4 if k % 2 else 2])
  for x in range(9, 34):                           # the balance beam
   c.set(x, 17, m[5]); c.set(x, 18, m[2])
  c.set(21, 15, m[5]); c.set(21, 16, m[4])
  for hx, ramp in ((11, RAMPS['straw']), (32, RAMPS['redearth7'])):
   for k in range(7): c.set(hx, 19 + k, m[2 if k % 2 else 4])
   for j, hw in enumerate((8, 7, 5, 3)):           # the pan, and what is in it
    for x in range(hx - hw, hx + hw + 1):
     u = (x - (hx - hw)) / max(hw * 2, 1)
     c.set(x, 26 + j, bra[6] if j == 0 and u < 0.6 else bra[4] if u < 0.7 else bra[2])
   for x in range(hx - 6, hx + 7):
    u = abs(x - hx) / 6
    for k in range(round(4 * (1 - u * u)) + 1):
     c.set(x, 25 - k, ramp[5 if k else 4] if jitter(x, k) % 4 else ramp[6])
 else:                                             # a public building's plaque
  st = RAMPS['limestone']
  for y in range(10, 30):                          # the stone, set on the post
   for x in range(8, 34):
    u = (x - 8) / 26
    tone = 6 if u < 0.2 else 5 if u < 0.6 else 4 if u < 0.85 else 3
    if jitter(x // 2, y) % 9 == 0: tone -= 1
    c.set(x, y, st[max(tone, 1)])
  c.hline(8, 33, 10, st[6]); c.hline(8, 33, 29, st[1])
  for y in range(10, 30): c.set(8, y, st[6]); c.set(33, y, st[2])
  for k in range(3):                               # a moulding round the field
   c.hline(10 + k, 31 - k, 12, st[3]); c.hline(10 + k, 31 - k, 27, st[2])
  # The one place lettering belongs: a foundation inscription, cut in stone.
  _naskh(c, 13, 29, 17, st[0], st[2])
  _naskh(c, 13, 29, 25, st[0], st[2])
  for y in range(30, 36):                          # its bracket back to the post
   c.hline(9, 14, y, w[2 if y % 2 else 4])
 soft_outline(c, w[0], w[2])
 _ground(c, 6, 49, 6)
 grass(c, [(1, 51, 2), (11, 51, 2)])
 return c.image()


SIGNS = {
 'sign-hanging': hanging_sign,
 'sign-souk': souk_sign,
}


# Draft, unregistered: the bazaar pitch itself, for a market row rather than a
# doorway. Drawn at doorway scale and so half again too tall for the market —
# the other stalls are about 50x36, seen from further above. Redraw to that
# before wiring it into stallFor.

def _awning(c, w, cloth):
 """Posts, a lintel and a shade cloth: the booth front every trade shares."""
 for px in (6, 45):                                # the two posts
  for y in range(18, 64):
   c.set(px, y, w[5]); c.set(px + 1, y, w[3]); c.set(px + 2, y, w[1])
  c.hline(px - 1, px + 3, 64, w[1])
 for x in range(4, 50):                            # the lintel over them
  c.set(x, 17, w[6]); c.set(x, 18, w[4]); c.set(x, 19, w[1])
 for i in range(13):                               # the shade, sloping forward
  y = 4 + i
  t = i / 12
  x0, x1 = round(13 - t * 10), round(40 + t * 9)
  for x in range(x0, x1 + 1):
   p = [cloth, SLIP, OCHRE][(x // 4) % 3]         # stripes down the drop
   tone = 5 if t < 0.35 else 4 if t < 0.75 else 3
   if jitter(x, i) % 9 == 0: tone -= 1              # the weave, and its sag
   c.set(x, y, p[max(tone, 1)])
 for x in range(3, 51):                            # a dagged edge at the front
  d = 2 if (x // 3) % 2 else 1
  for k in range(d):
   c.set(x, 17 + k, (SLIP if (x // 4) % 2 else OCHRE)[2])
 for k in range(4):                                # and its two stay ropes
  c.set(4 - k // 2, 20 + k, RAMPS['rope'][2]); c.set(49 + k // 2, 20 + k, RAMPS['rope'][2])


def _vessel(c, cx, top, h, half, ramp, lid=False):
 """A beaten body: one profile function, shaded across the turn."""
 for i in range(h):
  y, hw = top + i, half(i / max(h - 1, 1))
  if hw <= 0: continue
  for x in range(round(cx - hw), round(cx + hw) + 1):
   u = (x - (cx - hw)) / max(hw * 2, 1)
   tone = 6 if u < 0.18 else 5 if u < 0.42 else 4 if u < 0.72 else 2
   if (x + y) % 7 == 0: tone -= 1                  # hammer marks
   c.set(x, y, ramp[max(min(tone, 6), 1)])
 c.hline(round(cx - half(0)), round(cx + half(0)), top, ramp[6])
 if lid:
  for k in range(3): c.set(cx, top - 1 - k, ramp[5 - k])


def souk_stall(v=0):
 """A bazaar pitch: posts, an awning, and one trade's stock laid out."""
 c = Canvas(56, 70)
 w = RAMPS['walnut7']
 m = RAMPS['blackiron7']
 _awning(c, w, INDIGO)
 if v == 0:                                        # the coppersmith's lane
  cop = RAMPS['copperpot7']
  bra = RAMPS['brasspot7']
  for x in range(9, 44):                           # the bar they hang from
   c.set(x, 23, m[5]); c.set(x, 24, m[3]); c.set(x, 25, m[1])
  for hx in (15, 30, 39):
   for k in range(4): c.set(hx, 25 + k, m[4 if k % 2 else 2])
  # A long neck over a wide belly: the shape that says beaten metal, where a
  # smooth oval says gourd.
  def ewer(t):
   return (2.0 if t < 0.28 else
           2.0 + (t - 0.28) * 34 if t < 0.44 else
           7.5 - (t - 0.44) * 6 if t < 0.86 else
           4.5 + (t - 0.86) * 12)
  _vessel(c, 15, 29, 22, ewer, cop, lid=True)
  for k in range(7):                               # its spout, out and up
   c.set(11 - k // 2, 36 - k, cop[5]); c.set(12 - k // 2, 36 - k, cop[3])
  for k in range(9):                               # and the handle behind
   dx = 4 - abs(k - 4) // 2
   c.set(18 + dx, 36 + k, cop[5]); c.set(19 + dx, 36 + k, cop[2])
  for y in range(36, 48):                          # a band round the belly
   if y % 5 == 0: c.hline(9, 21, y, cop[6])
  for i in range(17):                              # a beaten tray, hung flat on
   half = round(9 * (1 - ((i - 8) / 8.6) ** 2) ** 0.5) if abs(i - 8) < 9 else 0
   for x in range(30 - half, 31 + half):
    u = (x - (30 - half)) / max(half * 2, 1)
    ring = (abs(x - 30) + abs(i - 8)) % 5 == 0     # chased rings on the face
    c.set(x, 29 + i, bra[6] if u < 0.22 else bra[2] if ring else bra[4] if u < 0.7 else bra[3])
  for i in range(9):                               # a shallow dish, tipped to us
   half = round(8 * (1 - (i / 9) ** 1.6))
   for x in range(40 - half, 41 + half):
    u = (x - (40 - half)) / max(half * 2, 1)
    c.set(x, 32 + i, cop[6] if u < 0.2 else cop[5] if u < 0.5 else cop[3])
  for x in range(32, 49): c.set(x, 31, cop[6]); c.set(x, 32, cop[2])
  c.hline(33, 47, 30, cop[4])
  for wid, y in ((12, 57), (10, 53), (8, 49)):     # finished bowls, stacked
   for k, span in ((0, wid), (1, wid - 1), (2, wid - 3)):
    for x in range(16 - span // 2, 17 + span // 2):
     u = (x - (16 - span // 2)) / max(span, 1)
     c.set(x, y + k, bra[6] if k == 0 and u < 0.6 else
           bra[4] if k == 1 and u < 0.65 else bra[2] if k < 2 else bra[1])
  for k in range(9):                               # the smith's own hammer
   c.set(36 + k // 3, 60 - k, w[5]); c.set(37 + k // 3, 60 - k, w[2])
  for x in range(36, 43):
   c.set(x, 51, m[5]); c.set(x, 52, m[3]); c.set(x, 53, m[1])
 else:                                             # the grain and spice dealer
  sack = RAMPS['burlap7']
  for i, (cx, wide, top) in enumerate(((16, 9, 42), (33, 8, 45))):
   for y in range(top, 63):                        # the sack, slumped and open
    t = (y - top) / (62 - top)
    hw = wide * (0.82 + 0.28 * t)
    for x in range(round(cx - hw), round(cx + hw) + 1):
     u = (x - (cx - hw)) / max(hw * 2, 1)
     tone = 5 if u < 0.25 else 4 if u < 0.65 else 2
     if (x * 3 + y) % 5 == 0: tone -= 1            # the coarse weave
     c.set(x, y, sack[max(tone, 1)])
   for k in range(3):                              # its rolled-down rim
    c.hline(round(cx - wide - 1), round(cx + wide + 1), top + k,
            sack[6 if k == 0 else 3 if k == 1 else 1])
   grain = [RAMPS['straw'], RAMPS['redearth7']][i]  # what is in it
   for x in range(round(cx - wide), round(cx + wide) + 1):
    u = abs(x - cx) / max(wide, 1)
    for k in range(round(3 * (1 - u * u)) + 1):
     c.set(x, top - k, grain[5 if k else 3] if jitter(x, k) % 4 else grain[6])
  for k in range(13):                              # a scoop standing in one
   c.set(20 + k // 3, 38 - k, w[5]); c.set(21 + k // 3, 38 - k, w[2])
  for i, hw in enumerate((5, 6, 6, 5, 3)):
   for x in range(18 - hw, 19 + hw): c.set(x, 34 + i, w[4 if i < 2 else 2])
  for x in range(16, 38):                          # a balance hung over them
   c.set(x, 27, m[5]); c.set(x, 28, m[2])
  for k in range(6): c.set(27, 21 + k, m[3 if k % 2 else 5])
  for hx in (17, 37):
   for k in range(5): c.set(hx, 29 + k, m[2 if k % 2 else 4])
   for i, hw in enumerate((5, 4, 2)):
    for x in range(hx - hw, hx + hw + 1):
     c.set(x, 34 + i, RAMPS['brasspot7'][5 if i == 0 else 3])
 soft_outline(c, w[0], w[2])
 _ground(c, 26, 64, 24)
 grass(c, [(2, 68, 2), (50, 68, 2)])
 return c.image()
