"""What stands in the open ground of a place of worship, one per tradition.

0 spirit storehouse (Ob-Ugrian and Siberian forest peoples), 1 bronze incense
burner (East Asian temple court), 2 lamp pillar (South Asian temple), 3
churchyard cross, 4 classical altar, 5 ablution fountain (mosque court),
6 chedi (Theravada monastery). ~17 source pixels to a metre.
"""
from .asia import GOLD, LACQUER, CREAM
from .building import _ground
from .core import Canvas, RAMPS, blob, jitter, soft_outline, grass

GREYWOOD = ['#1d1a17', '#312c27', '#474039', '#5f564b', '#786d5e', '#928672', '#aea28b']
BARK = ['#231a14', '#3b2c20', '#57402c', '#735739', '#8f6f4a', '#aa8a60']
CUT = ['#5a4430', '#86694b', '#ab8e69', '#c9b08a']
BRONZE = ['#1b1a13', '#2f2f21', '#474731', '#5f6041', '#7c7a52', '#9c9463', '#bdb17c']
PATINA = ['#1f3a33', '#2e5448', '#43705f']
ASH = ['#4a4640', '#6b665d', '#8d887d', '#b0aa9d']
RED = LACQUER
WHITE = ['#3d3a34', '#5f5b52', '#86817a', '#aaa59b', '#c9c4b8', '#e0dccf', '#f3f0e6']
WATER = RAMPS['water']
STONE = RAMPS['limestone']


def _log(c, x0, x1, y, ramp, h=3):
 """A peeled log lying across the view: lit top, dark underside."""
 for x in range(x0, x1 + 1):
  for k in range(h):
   tone = 5 if k == 0 else 3 if k < h - 1 else 1
   if jitter(x // 4, y) % 7 == 0 and k: tone -= 1
   c.set(x, y + k, ramp[max(tone, 1)])


def _end(c, x, y, h=3):
 """The round cut end of a log, standing proud of the corner."""
 for k in range(h):
  c.set(x, y + k, CUT[3] if k == 0 else CUT[2] if k < h - 1 else CUT[0])
  c.set(x + 1, y + k, CUT[2] if k == 0 else CUT[1])
 c.set(x, y + h // 2, CUT[0])


def _strip(c, x, y, n, cloth, sway=0):
 """A strip of cloth tied on and hanging."""
 for k in range(n):
  c.set(x + (k * sway) // 4, y + k, cloth[4] if k % 3 else cloth[5])
 c.set(x + (n * sway) // 4, y + n, cloth[2])


def storehouse():
 """A small log store on one tall post: the family's or the village's
 spirit figures and offerings kept off the ground, out of reach of animals.
 Bark-covered gable roof, a little door, a notched log to climb, cloth tied
 on the post."""
 c = Canvas(48, 64)
 cx = 24
 # The post: a whole trunk, cut high, roots spreading at the foot.
 for y in range(38, 62):
  flare = max(0, y - 57)
  for x in range(cx - 3 - flare, cx + 4 + flare):
   u = (x - cx) / 3.5
   tone = 4 if u < -0.4 else 3 if u < 0.3 else 2 if u < 0.7 else 1
   if jitter(x, y // 3) % 5 == 0: tone -= 1
   c.set(x, y, BARK[max(tone, 1)])
 for y in (45, 52): c.hline(cx - 2, cx + 2, y, BARK[1])       # bark rings
 # A floor of split planks, wider than the post.
 for x in range(cx - 13, cx + 14):
  c.set(x, 36, GREYWOOD[5]); c.set(x, 37, GREYWOOD[3]); c.set(x, 38, GREYWOOD[1])
 # The body: four courses of logs, ends proud at both corners.
 for i, y in enumerate(range(22, 36, 3)):
  _log(c, cx - 11, cx + 11, y, GREYWOOD)
  _end(c, cx - 13, y); _end(c, cx + 12, y)
 # The door, low and narrow, with its wooden latch.
 for y in range(26, 36):
  for x in range(cx - 3, cx + 4):
   c.set(x, y, GREYWOOD[1] if x < cx + 2 else GREYWOOD[0])
 c.vline(cx - 3, 26, 35, GREYWOOD[4])
 c.hline(cx - 3, cx + 3, 25, GREYWOOD[5])
 c.set(cx + 2, 31, CUT[2]); c.set(cx + 3, 31, CUT[1])
 # Gable roof of planks under birch bark, eaves well out past the walls.
 for y in range(8, 23):
  t = (y - 8) / 14
  half = round(3 + 14 * t)
  for x in range(cx - half, cx + half + 1):
   u = (x - cx) / max(half, 1)
   board = (x + 40) // 3
   tone = 5 if u < -0.15 else 3
   if (x + 40) % 3 == 0: tone -= 1
   if jitter(board, y // 4) % 6 == 0: tone -= 1
   c.set(x, y, GREYWOOD[max(tone, 1)])
 # Birch bark on the slopes, pale with dark lenticels.
 for y in range(8, 23):
  t = (y - 8) / 14
  half = round(3 + 14 * t)
  for side in (-1, 1):
   for k in range(3):
    x = cx + side * (half - k)
    col = ['#e6dfcf', '#cfc6b2', '#a89e88'][k] if side < 0 else ['#b3aa94', '#958c78', '#766e5e'][k]
    if jitter(x, y) % 5 == 0: col = '#3a342c'
    c.set(x, y, col)
 c.hline(cx - 18, cx + 18, 23, GREYWOOD[0])                    # eaves shadow
 for x in range(cx - 1, cx + 2): c.set(x, 6, GREYWOOD[4])      # ridge pole end
 c.set(cx, 5, GREYWOOD[5]); c.set(cx, 7, GREYWOOD[2])
 # The notched log leant up to the door.
 for i in range(24):
  x = cx - 10 + round(i * 0.3)
  y = 61 - i
  c.set(x, y, CUT[1]); c.set(x + 1, y, BARK[3]); c.set(x + 2, y, BARK[1])
  if i % 5 == 2: c.set(x + 2, y, CUT[3]); c.set(x + 1, y, CUT[2])
 # Cloth tied round the post and hung from the eaves: offerings.
 c.hline(cx - 3, cx + 3, 41, RED[4]); c.hline(cx - 3, cx + 3, 42, RED[2])
 _strip(c, cx - 3, 43, 5, RED, -1); _strip(c, cx + 3, 43, 4, RED, 1)
 c.hline(cx - 3, cx + 3, 47, WHITE[5]); c.hline(cx - 3, cx + 3, 48, WHITE[3])
 _strip(c, cx + 3, 49, 4, WHITE, 1)
 _strip(c, cx - 17, 24, 6, RED, -1)
 _strip(c, cx + 17, 24, 5, WHITE, 1)
 _strip(c, cx + 15, 24, 4, ['#1a2a3e', '#263d5a', '#355478', '#476d96', '#5f86ae', '#83a5c8'], 0)
 soft_outline(c, GREYWOOD[0], GREYWOOD[4])
 grass(c, [(cx - 6, 63, 3), (cx + 7, 63, 2)])
 return c.image()


def incense_burner():
 """A bronze censer on three legs over a stone base, two ears on the rim,
 a bed of ash with sticks smouldering in it."""
 c = Canvas(36, 40)
 cx = 18
 g = RAMPS['granite']
 for y in range(33, 39):                                       # the stone base
  for x in range(cx - 14, cx + 15):
   u = (x - cx) / 14
   tone = 5 if y == 33 else 4 if u < -0.3 else 3 if u < 0.5 else 2
   if y == 38: tone = 1
   c.set(x, y, g[tone])
 for lx in (cx - 8, cx, cx + 7):                               # the legs
  for y in range(26, 33):
   c.set(lx, y, BRONZE[4]); c.set(lx + 1, y, BRONZE[2])
  c.set(lx - 1, 32, BRONZE[3]); c.set(lx + 2, 32, BRONZE[1])
 blob(c, [(cx + 0.5, 21, 11, 7)], BRONZE, rim=False)          # the belly
 for x in range(cx - 10, cx + 12):                             # a cast band
  if (x + 1) % 3: c.set(x, 22, BRONZE[1])
  c.set(x, 20, BRONZE[5] if x < cx else BRONZE[3])
 for (x, y) in [(cx - 6, 24), (cx + 4, 25), (cx - 2, 26), (cx + 8, 21), (cx - 9, 19)]:
  c.set(x, y, PATINA[1]); c.set(x + 1, y, PATINA[0])           # green patina
 for x in range(cx - 11, cx + 12):                             # the rim
  c.set(x, 14, BRONZE[6] if x < cx - 3 else BRONZE[5] if x < cx + 5 else BRONZE[3])
  c.set(x, 15, BRONZE[2])
 for x in range(cx - 9, cx + 10): c.set(x, 13, ASH[2 if x % 3 else 3])   # the ash
 for side in (-1, 1):                                          # the ears
  ex = cx + side * 9
  for y in range(8, 14):
   c.set(ex, y, BRONZE[5] if side < 0 else BRONZE[3])
   c.set(ex + side, y, BRONZE[2])
  c.hline(min(ex, ex + side * 3), max(ex, ex + side * 3), 8, BRONZE[4])
 for i, x in enumerate((cx - 5, cx - 3, cx - 1, cx + 2, cx + 4)):  # incense sticks
  top = 6 + (i * 3) % 5
  c.vline(x, top, 12, '#9c4a2a' if i % 2 else '#b25c32')
  c.set(x, top - 1, '#ff9a3c')
 soft_outline(c, BRONZE[0], BRONZE[4])
 for (x, y) in [(cx - 4, 2), (cx - 5, 0), (cx + 2, 3), (cx + 3, 1), (cx, 4)]:
  c.set(x, y, ASH[3])                                          # smoke, faint
 return c.image()


def lamp_pillar():
 """A tall stone lamp pillar: a tapering shaft ringed with little brackets,
 each holding a clay lamp, on a square base."""
 c = Canvas(26, 72)
 cx = 13
 s = RAMPS['sandstone']
 for k, (half, y) in enumerate(((10, 66), (8, 62))):          # the stepped base
  for yy in range(y, y + 4):
   for x in range(cx - half, cx + half + 1):
    u = (x - cx) / half
    tone = 5 if yy == y else 4 if u < -0.3 else 3 if u < 0.5 else 2
    c.set(x, yy, s[tone])
  c.hline(cx - half, cx + half, y + 3, s[1])
 for y in range(10, 62):                                       # the shaft
  half = 2 + round(2 * (y - 10) / 52)
  for x in range(cx - half, cx + half + 1):
   u = (x - cx) / max(half, 1)
   c.set(x, y, s[5] if u < -0.3 else s[4] if u < 0.4 else s[2])
 for i, y in enumerate(range(14, 60, 6)):                      # bracket rings
  half = 2 + round(2 * (y - 10) / 52)
  c.hline(cx - half, cx + half, y, s[6]); c.hline(cx - half, cx + half, y + 1, s[1])
  for side in (-1, 1):
   bx = cx + side * (half + 1)
   c.set(bx, y, s[4] if side < 0 else s[3]); c.set(bx + side, y, s[3])
   c.set(bx + side * 2, y - 1, '#6b3a22'); c.set(bx + side * 2, y, '#8d4f2c')   # a clay lamp
   c.set(bx + side * 2, y - 2, '#2a2019')                      # soot above it
 for y in range(4, 10):                                        # the top lamp and cap
  half = 3 if y > 6 else 1
  for x in range(cx - half, cx + half + 1):
   c.set(x, y, s[5] if x < cx else s[3])
 c.set(cx, 3, GOLD[5]); c.set(cx, 2, GOLD[4])
 soft_outline(c, s[0], s[4])
 grass(c, [(cx - 11, 70, 2), (cx + 11, 70, 2)])
 return c.image()


def churchyard_cross():
 """A stone cross on three steps, the kind that stood in a churchyard for
 preaching and processions, lichen on the north face."""
 c = Canvas(32, 58)
 cx = 16
 for k, (half, y) in enumerate(((14, 52), (11, 48), (8, 44))):  # the calvary
  for yy in range(y, y + 4):
   for x in range(cx - half, cx + half + 1):
    u = (x - cx) / half
    tone = 5 if yy == y else 4 if u < -0.3 else 3 if u < 0.5 else 2
    if jitter(x // 3, yy) % 9 == 0: tone -= 1
    c.set(x, yy, STONE[tone])
  c.hline(cx - half, cx + half, y + 3, STONE[1])
 for y in range(6, 44):                                        # the shaft
  for x in range(cx - 2, cx + 3):
   c.set(x, y, STONE[5] if x < cx - 1 else STONE[4] if x < cx + 1 else STONE[2])
 for y in range(12, 16):                                       # the arms
  for x in range(cx - 8, cx + 9):
   c.set(x, y, STONE[6] if y == 12 else STONE[4] if x < cx + 1 else STONE[2])
 c.hline(cx - 2, cx + 2, 5, STONE[6])
 for (x, y) in [(cx + 1, 22), (cx + 2, 23), (cx + 1, 31), (cx + 2, 38), (cx + 7, 14), (cx + 9, 47), (cx + 6, 51)]:
  c.set(x, y, '#7c8a4e')                                        # lichen
 soft_outline(c, STONE[0], STONE[4])
 grass(c, [(cx - 13, 56, 3), (cx + 13, 56, 3), (cx + 2, 56, 2)])
 return c.image()


def altar():
 """A stone altar in the open before a temple: moulded top and foot, the
 rolled cushions at each end, a carved garland, a fire on top."""
 c = Canvas(34, 40)
 cx = 17
 m = RAMPS['limestone']
 for y in range(20, 36):                                       # the die
  for x in range(cx - 10, cx + 11):
   u = (x - cx) / 10
   c.set(x, y, m[5] if u < -0.4 else m[4] if u < 0.5 else m[2])
 for (y, half) in ((16, 13), (17, 13), (18, 12), (19, 11), (36, 12), (37, 13), (38, 13)):
  for x in range(cx - half, cx + half + 1):                    # mouldings
   u = (x - cx) / half
   tone = 6 if y in (16, 36) else 4 if u < 0.4 else 2
   if y in (19, 38): tone = 1
   c.set(x, y, m[tone])
 for side in (-1, 1):                                          # the bolsters
  bx = cx + side * 11
  for y in range(12, 17):
   for x in range(bx - 2, bx + 3):
    r = ((x - bx) / 2.5) ** 2 + ((y - 14.5) / 2.5) ** 2
    if r <= 1: c.set(x, y, m[6] if r < 0.3 and side < 0 else m[4] if y < 15 else m[2])
  c.set(bx, 14, m[1])
 for x in range(cx - 8, cx + 9):                               # the garland
  dip = round(3 * (1 - ((x - cx) / 8) ** 2))
  c.set(x, 22 + dip, '#5f7a3c'); c.set(x, 23 + dip, '#44592b')
 for x in (cx - 8, cx + 8): c.vline(x, 21, 23, '#7c3a2a')      # its ribbons
 c.set(cx, 26, '#8d4f3a'); c.set(cx - 1, 26, '#6b3a2a')
 for x in range(cx - 7, cx + 8):                               # soot and blood
  if jitter(x, 3) % 3 == 0: c.set(x, 20, m[1])
 for y in range(4, 16):                                        # the fire
  t = (y - 4) / 11
  half = round(1 + 5 * t)
  for x in range(cx - half, cx + half + 1):
   u = abs(x - cx) / max(half, 1)
   if jitter(x, y) % 4 == 0 and u > 0.5: continue
   col = '#fff0b0' if u < 0.3 and y > 9 else '#ffc04a' if u < 0.6 else '#e8702a'
   c.set(x, y, col)
 c.hline(cx - 6, cx + 6, 15, '#3a2418')                        # the embers' bed
 soft_outline(c, m[0], m[4])
 _ground(c, cx, 39, 14)
 return c.image()


def ablution_fountain():
 """A stone basin in a mosque court for washing before prayer: water on top,
 a central spout, brass taps round the rim, a low step to sit on."""
 c = Canvas(48, 38)
 cx = 24
 m = RAMPS['limestone']
 for y in range(14, 30):                                       # the basin wall
  for x in range(cx - 18, cx + 19):
   u = (x - cx) / 18
   panel = 0 if u < -0.45 else 1 if u < 0.45 else 2
   tone = [5, 4, 2][panel]
   if y == 14: tone = 6
   c.set(x, y, m[tone])
 for x in (cx - 8, cx + 8): c.vline(x, 15, 29, m[1])          # the octagon's edges
 for y in range(10, 14):                                       # the water surface
  half = 17 - (13 - y)
  for x in range(cx - half, cx + half + 1):
   c.set(x, y, WATER[4] if (x + y) % 5 else WATER[5])
 c.hline(cx - 18, cx + 18, 13, m[6])
 for y in range(3, 12):                                        # the central spout
  c.set(cx - 1, y, m[5]); c.set(cx, y, m[4]); c.set(cx + 1, y, m[2])
 c.hline(cx - 3, cx + 3, 3, m[6]); c.hline(cx - 3, cx + 3, 4, m[2])
 for (x, y) in [(cx - 2, 1), (cx + 2, 1), (cx - 4, 5), (cx + 4, 5), (cx, 0)]:
  c.set(x, y, WATER[6])
 brass = RAMPS['brass7']
 for x in range(cx - 15, cx + 16, 5):                          # taps, dripping
  c.set(x, 18, brass[5]); c.set(x, 19, brass[3]); c.set(x + 1, 18, brass[2])
  c.set(x, 21, WATER[5])
 for y in range(30, 34):                                       # the step round it
  for x in range(cx - 21, cx + 22):
   u = (x - cx) / 21
   c.set(x, y, m[5] if y == 30 else m[3] if u < 0.4 else m[1])
 for x in range(cx - 14, cx + 15, 4):
  c.set(x, 32, WATER[3])                                        # splash on the step
 soft_outline(c, m[0], m[4])
 return c.image()


def chedi():
 """A small whitewashed chedi on a square base: bell, a ringed spire, a
 gilded tip."""
 c = Canvas(32, 62)
 cx = 16
 w = WHITE
 for k, (half, y) in enumerate(((14, 54), (12, 50), (10, 46))):  # the base
  for yy in range(y, y + 4):
   for x in range(cx - half, cx + half + 1):
    u = (x - cx) / half
    tone = 6 if yy == y else 5 if u < -0.3 else 4 if u < 0.5 else 2
    if jitter(x // 2, yy) % 11 == 0: tone -= 2                 # damp stains
    c.set(x, yy, w[max(tone, 1)])
  c.hline(cx - half, cx + half, y + 3, w[1])
 blob(c, [(cx + 0.5, 42, 9, 12)], w[1:], rim=False)            # the bell
 for y in range(42, 46):
  for x in range(cx - 9, cx + 10): c.set(x, y, w[4] if x < cx + 3 else w[2])
 c.hline(cx - 9, cx + 9, 45, w[1])
 for y in range(24, 31):                                       # the square box
  for x in range(cx - 4, cx + 5): c.set(x, y, w[5] if x < cx else w[3])
 c.hline(cx - 5, cx + 5, 24, w[6])
 for i, y in enumerate(range(8, 24)):                          # the ringed spire
  half = max(0, round(3 - 3 * (23 - y) / 16))
  for x in range(cx - half, cx + half + 1):
   c.set(x, y, w[5] if x <= cx else w[3])
  if y % 3 == 0: c.hline(cx - half, cx + half, y, w[2])
 for y in range(2, 9):                                         # the gilded tip
  c.set(cx, y, GOLD[5]); c.set(cx + 1, y, GOLD[3]) if y > 5 else None
 c.set(cx, 1, GOLD[6])
 for (x, y) in [(cx - 6, 36), (cx + 5, 40), (cx - 3, 44)]:
  c.set(x, y, '#5b6a3a')                                        # moss on the bell
 soft_outline(c, w[0], w[3])
 grass(c, [(cx - 13, 60, 3), (cx + 13, 60, 2)])
 return c.image()


_ALL = [storehouse, incense_burner, lamp_pillar, churchyard_cross, altar,
        ablution_fountain, chedi]


def sacred_marker(v=0):
 return _ALL[v]()


SACRED = {'sacred-marker': sacred_marker}
