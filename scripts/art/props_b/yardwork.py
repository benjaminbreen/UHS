"""Regional yard work: the grinding slabs and querns that stand in for the
generic grinding stone, and the everyday kit that says which part of the
world a yard is in. ~17 source pixels to a metre, like the rest."""
import math
from .core import Canvas, RAMPS

BASALT = [
 ['#1d1a19', '#2f2a27', '#46403a', '#5f5850', '#7d7468', '#a09584'],
 ['#28231f', '#403830', '#5c5045', '#7a6c5d', '#9a8b77', '#bcae97'],
]
MAIZE = ['#6b4f1f', '#a6802f', '#d3ad4b', '#ebcd72', '#f7e6a8']
HIDE = ['#4a3a2b', '#7d6446', '#b09368', '#d4bb8e', '#efdfb8']
DUNG = ['#2f251c', '#4f3d2b', '#6e5639', '#8f7552', '#b39a73']
FIBER = ['#4b3c2b', '#81704a', '#b49c65', '#d1be89', '#ede0b2']
FLOUR = '#efe6cc'
RED, BLUE, YEL, BLK, CREAM = '#a8402f', '#2f4f7a', '#d9a93a', '#241c18', '#ece0c0'


def ell(c, box, col):
 px = c._mask(lambda d: d.ellipse(box, fill=1))
 for y in range(c.h):
  for x in range(c.w):
   if px[x, y]: c.set(x, y, col)


def cyl(c, cx, yt, rx, ry, h, r):
 """An upright drum lit from the upper left: shaded side, flat top."""
 n = len(r)
 for x in range(cx - rx, cx + rx + 1):
  u = (x - cx) / rx
  dy = round(ry * max(0, 1 - u * u) ** .5)
  k = n - 2 if u < -.55 else n - 3 if u < .15 else n - 4 if u < .7 else 1
  c.vline(x, yt + dy, yt + h + dy, r[k])
 ell(c, (cx - rx, yt - ry, cx + rx, yt + ry), r[n - 2])
 c.hline(cx - rx + 2, cx + rx - 2, yt - ry, r[n - 1])


def pole(c, a, b, r):
 """A round pole two pixels thick: lit above, shaded below."""
 c.line((a[0], a[1] + 1), (b[0], b[1] + 1), r[1])
 c.line(a, b, r[-2])


def metate(v=0, m=0):
 """A three-legged basalt grinding slab, the mano across it and a spill of
 maize meal at the low end."""
 c = Canvas(24, 15)
 s = BASALT[v % 2]
 c.rect(11, 9, 12, 13, s[0])
 c.poly([(1, 5), (20, 3), (22, 8), (2, 11)], s[2])
 c.poly([(2, 11), (22, 8), (22, 10), (2, 13)], s[1])
 c.poly([(4, 6), (18, 4), (20, 8), (4, 10)], s[4])
 c.line((2, 11), (22, 8), s[3])
 for x, y in [(2, 6), (8, 4), (19, 5), (5, 10), (12, 10), (20, 9), (15, 6)]:
  c.set(x, y, s[5])
 c.rect(3, 13, 4, 14, s[1]); c.set(3, 13, s[3])
 c.rect(20, 10, 21, 12, s[1]); c.set(20, 10, s[3])
 ell(c, (3, 7, 7, 10), MAIZE[2]); c.hline(4, 6, 8, MAIZE[4])
 c.hline(0, 3, 13, MAIZE[2]); c.hline(1, 2, 14, MAIZE[1]); c.set(1, 12, MAIZE[3])
 c.poly([(12, 2), (15, 2), (16, 10), (13, 10)], s[4])
 c.line((12, 2), (13, 10), s[5]); c.line((15, 2), (16, 10), s[1]); c.hline(13, 16, 11, s[0])
 c.rim(s)
 return c.image()


def quern(v=0, m=0):
 """A rotary quern: the runner stone on its bedstone, a wooden handle peg
 and the ring of flour it has thrown out."""
 c = Canvas(18, 15)
 s = RAMPS[('granite', 'sandstone')[v % 2]]
 ell(c, (0, 9, 17, 14), FLOUR)
 cyl(c, 9, 10, 7, 2, 2, s)
 for x in (4, 7, 11, 14): c.set(x, 13, s[1])
 cyl(c, 9, 6, 6, 2, 3, s)
 ell(c, (7, 5, 11, 7), s[1]); c.set(9, 6, FLOUR)
 w = RAMPS['wood']
 c.vline(13, 1, 7, w[4]); c.vline(14, 1, 7, w[2]); c.set(13, 1, w[5])
 c.rim(s)
 return c.image()


def chopping_block(v=0, m=0):
 """A wide stump with the axe bitten into it, split billets and chips."""
 c = Canvas(24, 20)
 b = RAMPS[('darkwood', 'wood')[v % 2]]
 p = RAMPS['palewood']
 i = RAMPS['iron']
 cyl(c, 9, 11, 6, 2, 5, b)
 ell(c, (3, 9, 15, 13), p[4]); c.hline(5, 13, 11, p[3]); c.set(9, 11, p[2])
 c.line((4, 12), (5, 10), p[2])
 pole(c, (12, 10), (19, 1), p)
 c.poly([(9, 8), (13, 9), (13, 11), (10, 11)], i[2]); c.hline(10, 12, 9, i[4])
 c.poly([(13, 15), (21, 16), (21, 17), (13, 17)], p[4]); c.hline(13, 21, 18, b[2]); c.set(21, 16, p[2])
 c.poly([(1, 15), (5, 17), (4, 18), (0, 17)], p[3]); c.line((0, 18), (4, 19), b[1])
 for x, y in [(2, 13), (16, 12), (11, 18), (7, 19), (18, 19)]:
  c.set(x, y, p[5])
 c.rim(b)
 return c.image()


def trip_hammer(v=0, m=0):
 """A foot-worked trip-hammer: a long beam on a pivot, its pestle over a
 stone mortar sunk in the ground, the foot end over a worn hollow."""
 c = Canvas(54, 22)
 s = RAMPS['granite']
 w = RAMPS[('wood', 'darkwood')[v % 2]]
 ell(c, (0, 14, 13, 21), s[2]); ell(c, (1, 15, 12, 20), s[4])
 ell(c, (3, 16, 10, 20), s[0]); ell(c, (4, 17, 9, 20), '#e3d6aa'); c.set(6, 18, '#fff4d0')
 ell(c, (42, 16, 53, 21), '#3a3024')
 for x in (25, 30):
  c.vline(x, 9, 19, w[1]); c.vline(x + 1, 9, 19, w[3])
 for x in range(5, 49):
  y = 4 + (x - 5) * 10 // 43
  c.vline(x, y, y + 1, w[4]); c.set(x, y + 2, w[1])
 c.set(27, 10, RAMPS['iron'][3]); c.set(28, 10, RAMPS['iron'][1])
 c.rect(4, 5, 8, 12, w[2]); c.vline(4, 5, 12, w[4]); c.vline(8, 5, 12, w[1])
 c.rect(4, 13, 8, 15, s[3]); c.vline(4, 13, 15, s[5])
 c.poly([(43, 14), (51, 15), (51, 17), (43, 16)], w[4])
 c.rim(w)
 return c.image()


def travois(v=0, m=0):
 """A travois at rest: two lodgepoles crossed and tied at the front, a hide
 web between them and a painted parfleche lashed on. Its fringe stirs."""
 c = Canvas(80, 28)
 p = RAMPS['palewood']
 h = HIDE
 pole(c, (2, 6), (78, 15), p)
 c.poly([(44, 10), (62, 12), (62, 21), (44, 16)], h[1])
 for x in range(46, 62, 4): c.line((x, 11), (x, 16 + (x - 44) // 4), h[3])
 for y in (12, 15): c.line((44, y), (62, y + 3), h[3])
 c.poly([(47, 4), (60, 5), (61, 7), (48, 6)], h[4])
 c.rect(48, 7, 61, 13, h[3]); c.hline(48, 61, 7, h[1])
 for k, col in enumerate((RED, BLUE, RED)):
  x = 50 + k * 4; c.poly([(x, 12), (x + 1, 9), (x + 2, 12)], col)
 c.hline(49, 60, 8, BLK); c.set(52, 10, YEL); c.set(56, 10, YEL)
 c.vline(54, 4, 13, h[0])
 sway = (0, 1, 0, -1)[m % 4]
 for k, x in enumerate((58, 60, 62)):
  c.vline(x, 14, 16, h[2]); c.set(x + sway * (k % 2 or 1), 17, h[2])
 pole(c, (2, 2), (78, 26), p)
 c.line((21, 6), (23, 10), h[0]); c.line((22, 6), (24, 10), h[3])
 for x, y in [(74, 27), (77, 27), (75, 16), (78, 17)]:
  c.set(x, y, '#8a6a44')
 c.rim(p)
 return c.image()


def wash_tub(v=0, m=0):
 """A coopered wash tub on a low bench, a ridged washboard stood in it and
 a wet shirt over the rim. The suds shift."""
 c = Canvas(26, 24)
 w = RAMPS[('wood', 'palewood')[v % 2]]
 i = RAMPS['iron']
 q = RAMPS['water']
 c.rect(1, 15, 24, 16, w[4]); c.hline(1, 24, 17, w[1])
 for x in (3, 21):
  c.rect(x, 18, x + 1, 23, w[1]); c.vline(x, 18, 22, w[3])
 cyl(c, 12, 8, 8, 3, 6, w)
 for x in range(6, 19, 3):
  dy = round(3 * max(0, 1 - ((x - 12) / 8) ** 2) ** .5)
  c.vline(x, 8 + dy, 14 + dy, w[1])
 for k in (1, 5):
  for x in range(4, 21):
   dy = round(3 * max(0, 1 - ((x - 12) / 8) ** 2) ** .5)
   c.set(x, 8 + k + dy, i[2 if x < 12 else 1])
 ell(c, (6, 6, 18, 10), q[3]); ell(c, (8, 7, 15, 9), q[4])
 for k, (x, y) in enumerate([(8, 7), (11, 8), (14, 7), (16, 9), (10, 9), (13, 9)]):
  if (k + m) % 3: c.set(x, y, q[6])
 c.set(9 + m % 4, 8, q[6])
 c.rect(15, 1, 19, 9, w[1]); c.rect(16, 2, 18, 8, w[4])
 for y in range(3, 8, 2): c.hline(16, 18, y, w[2])
 c.poly([(3, 6), (6, 6), (5, 13), (2, 13)], '#7b4540'); c.line((4, 7), (3, 12), '#cb9470')
 c.rim(w)
 return c.image()


def grindstone(v=0, m=0):
 """A sandstone sharpening wheel on its axle, the crank to one side and the
 lower rim running in a trough of water."""
 c = Canvas(26, 26)
 s = RAMPS['sandstone']
 w = RAMPS[('wood', 'darkwood')[v % 2]]
 i = RAMPS['iron']
 c.vline(3, 8, 22, w[1]); c.vline(22, 8, 22, w[1])
 ell(c, (6, 2, 20, 21), s[1]); ell(c, (5, 2, 19, 21), s[3])
 ell(c, (7, 4, 17, 19), s[4]); ell(c, (6, 3, 16, 17), s[3])
 c.line((7, 5), (6, 12), s[5])
 for x, y in [(9, 5), (15, 8), (8, 15), (14, 16)]:
  c.set(x, y, s[2])
 c.rect(11, 10, 13, 12, i[1]); c.set(11, 10, i[4])
 c.hline(13, 22, 11, i[2]); c.vline(23, 6, 11, i[2]); c.hline(23, 25, 6, w[4])
 c.rect(1, 17, 24, 23, w[2]); c.hline(1, 24, 17, w[4])
 c.hline(2, 23, 18, RAMPS['water'][4]); c.set(10, 18, RAMPS['water'][6])
 for x in range(5, 24, 5): c.vline(x, 19, 23, w[1])
 c.rect(2, 24, 3, 25, w[0]); c.rect(22, 24, 23, 25, w[0])
 c.rim(w)
 return c.image()


def backstrap_loom(v=0, m=0):
 """A backstrap loom left on its mat: the warp tied to a post, a striped
 band half woven, the bar and the strap the weaver leans against. A loose
 end of weft stirs."""
 c = Canvas(46, 22)
 b = RAMPS['darkwood']
 ell(c, (24, 12, 45, 21), FIBER[2]); ell(c, (25, 13, 44, 20), FIBER[3])
 for x in range(28, 44, 3): c.line((x, 13), (x - 1, 20), FIBER[2])
 c.vline(2, 0, 18, b[1]); c.vline(3, 0, 18, b[3]); c.hline(1, 4, 0, b[4])
 for k in range(6):
  c.line((4, 5 + k // 2), (18, 8 + k * 2), CREAM if k % 2 else '#cdbd96')
 c.vline(11, 6, 13, b[4]); c.vline(14, 7, 15, b[2])
 bands = [(RED, BLUE, CREAM, YEL, RED, BLK, CREAM, BLUE), (BLUE, CREAM, RED, RED, YEL, CREAM, BLK, RED)][v % 2]
 for x in range(18, 31):
  col = bands[(x - 18) // 2 % len(bands)]
  c.vline(x, 8 + (x - 18) // 6, 17 + (x - 18) // 6, col)
  if x % 3 == 0: c.set(x, 11 + (x - 18) // 6, YEL if col != YEL else CREAM)
 c.vline(17, 7, 18, b[1]); c.vline(31, 8, 20, b[1]); c.vline(32, 8, 20, b[3])
 for y in range(9, 20):
  x = 33 + round(6 * max(0, 1 - ((y - 14) / 6) ** 2) ** .5)
  c.set(x, y, HIDE[2]); c.set(x + 1, y, HIDE[1])
 sway = (0, 1, 1, 0)[m % 4]
 c.set(30, 19, bands[0]); c.set(29 + sway, 20, bands[0]); c.set(28 + sway * 2, 21, bands[0])
 c.rim(b)
 return c.image()


def dung_stack(v=0, m=0):
 """A beehive stack of dried dung cakes for fuel, and a few more drying flat
 with the maker's finger marks in them."""
 c = Canvas(24, 22)
 d = DUNG
 for row, (y, hw) in enumerate([(18, 9), (15, 8), (12, 7), (9, 5), (6, 3), (3, 1)]):
  for x in range(11 - hw + (row % 2) * 2, 11 + hw + 1, 4):
   ell(c, (x - 2, y - 1, x + 2, y + 2), d[1]); ell(c, (x - 2, y - 1, x + 2, y + 1), d[2]); ell(c, (x - 2, y - 2, x + 1, y), d[3]); c.set(x - 1, y - 2, d[4]); c.hline(x - 1, x + 1, y + 2, d[0])
 for x, y in [(19, 19), (22, 20), (15, 21)][: 2 + v % 2]:
  ell(c, (x - 2, y - 1, x + 1, y + 1), d[3]); c.set(x - 1, y, d[1]); c.set(x, y, d[1])
 c.rim(d)
 return c.image()


def dugout(v=0, m=0):
 """A dugout canoe hauled up on two log rollers, its paddle across it."""
 c = Canvas(86, 20)
 w = RAMPS[('wood', 'darkwood')[v % 2]]
 p = RAMPS['palewood']
 for x in (20, 62):
  c.line((x - 3, 19), (x + 3, 15), w[0]); c.line((x - 2, 19), (x + 4, 15), w[2])
 c.poly([(1, 9), (10, 12), (43, 14), (76, 12), (84, 7), (78, 13), (60, 17), (26, 17), (8, 14)], w[2])
 c.line((8, 14), (26, 17), w[1]); c.hline(26, 60, 17, w[1]); c.line((60, 17), (78, 13), w[1])
 c.poly([(1, 9), (10, 5), (43, 3), (76, 4), (84, 7), (76, 12), (43, 14), (10, 12)], w[4])
 c.poly([(7, 9), (14, 6), (43, 5), (72, 6), (79, 8), (72, 10), (43, 12), (14, 10)], '#2a211b')
 c.poly([(14, 10), (43, 12), (72, 10), (70, 9), (43, 10), (16, 9)], '#4a3a2d')
 for x in range(18, 72, 7): c.set(x, 7 + x % 3, '#5a4636')
 c.line((1, 9), (10, 5), w[5]); c.line((10, 5), (43, 3), w[5]); c.line((43, 3), (76, 4), w[5])
 c.line((30, 1), (52, 12), p[4]); c.line((30, 2), (52, 13), p[1])
 c.poly([(51, 11), (57, 13), (58, 15), (52, 14)], p[3])
 c.rim(w)
 return c.image()


MUD = [
 ['#3f2f22', '#5f4631', '#826245', '#a3825e', '#c2a47c'],
 ['#4a3a28', '#6e5a3c', '#958058', '#b8a57a', '#d4c49d'],
]
BAMBOO = ['#3e3d23', '#626036', '#8c8a4e', '#b3ae6c', '#d4cf93']
INDIGO = ['#141c38', '#1d2a52', '#2f4474', '#4d6a9c', '#c9d2e0']
SLAG = ['#1f1d24', '#2e2b34', '#4a4458', '#6b6275']
EMBER = ['#7a2a14', '#c8541e', '#f0a040', '#ffe08a']
LEATHER = ['#2e1d14', '#4d3020', '#71492f', '#946645', '#b88a60']


def kiln(v=0, m=0):
 """An updraft pottery kiln: a clay dome sooted over its stoking mouth,
 a vent on top, and a few wasters broken at its foot."""
 c = Canvas(26, 24)
 k = RAMPS[('redearth7', 'buffclay7')[v % 2]]
 ell(c, (2, 4, 23, 23), k[2]); ell(c, (3, 4, 20, 20), k[3]); ell(c, (5, 5, 14, 12), k[4])
 c.hline(7, 11, 6, k[5])
 ell(c, (10, 3, 15, 6), k[1]); ell(c, (11, 4, 14, 6), k[0])
 for x, y in [(10, 12), (12, 11), (14, 12), (11, 13), (13, 14)]:
  c.set(x, y, k[1])
 c.poly([(9, 23), (9, 18), (12, 15), (15, 18), (15, 23)], '#1e1512')
 c.hline(10, 14, 22, EMBER[1]); c.set(12, 21, EMBER[2])
 for x, y in [(1, 22), (3, 23), (20, 23), (23, 22)]:
  c.set(x, y, k[4]); c.set(x + 1, y, k[2])
 c.rim(k)
 return c.image()


def mud_bricks(v=0, m=0):
 """Mud bricks set out in rows to dry, a stack of finished ones, the heap
 of tempered mud and the two-cell wooden mould."""
 c = Canvas(38, 16)
 d = MUD[v % 2]
 w = RAMPS['palewood']
 for x in (31, 34):
  for y in (2, 4, 6):
   c.rect(x, y, x + 2, y, d[4]); c.rect(x, y + 1, x + 2, y + 1, d[2])
 for row in range(3):
  for col in range(5):
   x, y = 3 + col * 6 - row, 3 + row * 4
   c.rect(x, y, x + 3, y + 1, d[3 if row else 4]); c.hline(x, x + 3, y + 2, d[1])
   c.set(x, y, d[4])
 ell(c, (1, 12, 9, 16), d[0]); ell(c, (2, 12, 7, 15), d[1]); c.set(4, 13, d[3])
 c.rect(26, 12, 35, 15, w[1]); c.rect(27, 13, 30, 14, d[2]); c.rect(32, 13, 34, 14, d[2])
 c.hline(26, 35, 12, w[4])
 c.rim(d)
 return c.image()


def fishing_nets(v=0, m=0):
 """A net hung to dry between two poles, floats along the head rope, and
 a pair of basket fish traps below."""
 c = Canvas(36, 26)
 w = RAMPS['wood']
 net = ('#8c7b5c', '#6b4a36')[v % 2]
 c.vline(3, 2, 24, w[2]); c.vline(4, 2, 24, w[4]); c.vline(31, 2, 24, w[2]); c.vline(32, 2, 24, w[1])
 c.hline(4, 31, 3, RAMPS['rope'][2])
 for x in range(5, 31):
  sag = round(4 * (1 - ((x - 18) / 13) ** 2))
  for y in range(4, 15 + sag):
   if (x + y) % 3 == 0 or (x - y) % 3 == 0: c.set(x, y, net)
  c.set(x, 15 + sag, '#5a4a36')
  if x % 4 == 1: c.set(x, 4, '#d8c38a')
 f = RAMPS['wicker7']
 for x0, y0 in ((6, 19), (18, 21)):
  c.poly([(x0, y0), (x0 + 10, y0 - 2), (x0 + 11, y0 + 1), (x0, y0 + 4)], f[3])
  ell(c, (x0 - 1, y0 - 1, x0 + 2, y0 + 4), f[1]); c.set(x0, y0 + 1, f[0])
  for k in range(3, 11, 3): c.line((x0 + k, y0 - 1), (x0 + k, y0 + 3), f[1])
 c.rim(w)
 return c.image()


def threshing_floor(v=0, m=0):
 """A round beaten threshing floor ringed with stones, straw spread over
 it, the flint-studded sledge, the grain and the chaff heap."""
 c = Canvas(46, 20)
 st = RAMPS['straw']
 ell(c, (0, 3, 45, 19), RAMPS['limestone'][2]); ell(c, (1, 4, 44, 18), '#b89868')
 for k in range(0, 360, 20):
  x = 22 + 22 * math.cos(math.radians(k)); y = 11 + 8 * math.sin(math.radians(k))
  c.set(x, y, RAMPS['limestone'][4 if k > 180 else 1])
 for x in range(3, 43):
  for y in range(5, 18):
   if (x * 7 + y * 13) % 5 == 0 and ((x - 22) / 21) ** 2 + ((y - 11) / 7) ** 2 < 1:
    c.set(x, y, st[4 if (x + y) % 2 else 5])
 c.poly([(31, 9), (37, 2), (43, 9)], st[4]); c.poly([(37, 2), (43, 9), (39, 10)], st[3]); c.line((34, 6), (37, 3), st[6])
 ell(c, (4, 8, 11, 12), st[2]); c.hline(6, 9, 9, st[4])
 w = RAMPS['wood']
 c.poly([(14, 9), (28, 8), (29, 12), (15, 13)], w[4]); c.hline(15, 28, 13, w[1])
 c.line((13, 8), (14, 12), w[5])
 for x, y in [(17, 10), (20, 9), (23, 10), (26, 9), (19, 12), (25, 11)]:
  c.set(x, y, '#dcd8cc')
 c.rim(RAMPS['limestone'])
 return c.image()


def lever_press(v=0, m=0):
 """A beam press for olives or grapes: the beam socketed in its posts,
 a stack of pressing baskets on the stone bed, a drilled weight stone on
 the far end and a jar at the spout."""
 c = Canvas(56, 28)
 st = RAMPS['limestone']
 w = RAMPS['darkwood']
 juice = ('#4e5a22', '#4a1f2e')[v % 2]
 c.rect(2, 3, 4, 25, w[1]); c.rect(7, 3, 9, 25, w[3]); c.hline(2, 9, 3, w[5])
 ell(c, (8, 17, 30, 26), st[2]); ell(c, (9, 17, 29, 24), st[4]); ell(c, (12, 19, 26, 23), juice)
 for k in range(4):
  y = 18 - k * 2; c.rect(14, y - 1, 24, y, RAMPS['wicker7'][4 - k % 2]); c.hline(14, 24, y + 1, RAMPS['wicker7'][1])
 for x in range(3, 48):
  y = 8 + (x - 3) * 6 // 45
  c.vline(x, y, y + 1, w[4]); c.set(x, y + 2, w[1])
 c.vline(47, 14, 19, RAMPS['rope'][2])
 c.rect(42, 19, 52, 25, st[3]); c.rect(42, 19, 52, 20, st[5]); c.vline(52, 19, 25, st[1]); c.rect(46, 22, 48, 23, st[0])
 c.set(29, 22, juice); c.set(30, 23, juice)
 ell(c, (29, 22, 35, 27), RAMPS['terracotta7'][3]); c.hline(31, 33, 22, RAMPS['terracotta7'][1])
 c.rim(st)
 return c.image()


def tanning_pits(v=0, m=0):
 """A tannery's pits in two rows: lime, bark liquor at two strengths, and
 a hide over the edge of one."""
 c = Canvas(40, 20)
 r = RAMPS[('limestone', 'wood')[v % 2]]
 liquors = ['#d8d3c0', '#8a6a3a', '#6e4526', '#a0703a', '#5b3a22', '#c9c2a6']
 for k, (x, y) in enumerate([(1, 1), (14, 1), (27, 1), (1, 10), (14, 10), (27, 10)]):
  c.rect(x, y, x + 11, y + 6, r[3]); c.hline(x, x + 11, y, r[5]); c.rect(x, y + 7, x + 11, y + 8, r[1])
  c.rect(x + 1, y + 1, x + 10, y + 5, '#2a2018'); c.rect(x + 1, y + 2, x + 10, y + 5, liquors[k])
  c.set(x + 3, y + 3, '#ffffff' if k in (0, 5) else '#c49a5a')
 c.poly([(16, 9), (24, 9), (26, 14), (22, 17), (17, 16)], HIDE[3]); c.line((17, 10), (23, 10), HIDE[4])
 c.rim(r)
 return c.image()


def dye_vats(v=0, m=0):
 """Indigo dye pots sunk in the ground, their bronze-skinned liquor, and
 dyed cloth drying on a line behind them. The cloth stirs."""
 c = Canvas(34, 24)
 k = RAMPS['terracotta7']
 w = RAMPS['wood']
 c.vline(2, 2, 13, w[2]); c.vline(31, 2, 13, w[2]); c.hline(2, 31, 2, RAMPS['rope'][2])
 sway = (0, 1, 0, -1)[m % 4]
 for x0 in (5, 18):
  for x in range(x0, x0 + 10):
   bottom = 10 + (1 if x % 3 == 0 else 0)
   for y in range(3, bottom + 1):
    xx = x + (sway if y > 7 else 0)
    c.set(xx, y, INDIGO[2] if (x + y) % 4 else INDIGO[3])
   if (x - x0) % 3 == 1: c.set(x + sway, 6, INDIGO[4])
 for x, y in [(3, 14), (13, 15), (23, 14)]:
  ell(c, (x, y, x + 8, y + 5), k[2]); ell(c, (x + 1, y + 1, x + 7, y + 4), INDIGO[0])
  c.set(x + 3, y + 2, '#8a6a4a'); c.hline(x + 1, x + 7, y, k[4])
 c.rim(w)
 return c.image()


def rice_rack(v=0, m=0):
 """A rice-drying rack: bamboo poles and rails hung with sheaves, heads
 down, to dry in the wind before threshing."""
 c = Canvas(46, 26)
 st = RAMPS['straw']
 for x in (2, 22, 43):
  c.vline(x, 1, 24, BAMBOO[3]); c.vline(x + 1, 1, 24, BAMBOO[1]); c.set(x, 6, BAMBOO[4]); c.set(x, 14, BAMBOO[4])
 for row, y in enumerate((5, 13)[: 1 + (v % 2 == 0)]):
  c.hline(1, 45, y, BAMBOO[2])
  for x in range(4, 43, 3):
   if x in (22, 23): continue
   drop = 5 + (x * 7 % 3)
   c.vline(x, y + 1, y + drop, st[4]); c.vline(x + 1, y + 1, y + drop, st[3])
   c.set(x, y + drop + 1, st[1]); c.set(x + 1, y + drop, st[2]); c.set(x, y - 1, st[5])
 c.rim(BAMBOO)
 return c.image()


def bloomery(v=0, m=0):
 """A clay bloomery furnace: the shaft, its glowing tuyere at the foot,
 a pair of drum bellows, charcoal and a heap of tapped slag. The embers
 breathe."""
 c = Canvas(24, 30)
 k = RAMPS[('redearth7', 'buffclay7')[v % 2]]
 cx = 9
 for y in range(4, 27):
  hw = 3 + (y - 4) * 4 // 22
  for x in range(cx - hw, cx + hw + 1):
   u = (x - cx) / hw
   c.set(x, y, k[5] if u < -.5 else k[4] if u < .1 else k[3] if u < .6 else k[1])
 ell(c, (cx - 3, 2, cx + 3, 5), k[2]); ell(c, (cx - 2, 3, cx + 2, 5), SLAG[0])
 glow = EMBER[(1, 2, 3, 2)[m % 4]]
 c.set(cx, 4, glow)
 c.rect(cx - 1, 22, cx + 1, 24, SLAG[0]); c.set(cx, 23, glow); c.set(cx - 1, 23, EMBER[(0, 1, 2, 1)[m % 4]])
 l = LEATHER
 for x0 in (15, 19):
  ell(c, (x0, 21, x0 + 4, 26), l[2]); ell(c, (x0, 21, x0 + 3, 24), l[3]); c.vline(x0 + 2, 16, 22, RAMPS['palewood'][4])
 c.hline(cx + 2, 16, 25, k[2])
 for x, y in [(1, 26), (3, 27), (0, 28), (4, 28), (2, 25)]:
  c.set(x, y, SLAG[2]); c.set(x + 1, y, SLAG[3] if x % 2 else SLAG[1])
 c.hline(12, 16, 28, SLAG[0]); c.set(13, 27, SLAG[1])
 c.rim(k)
 return c.image()


def saddle_stand(v=0, m=0):
 """A saddle over its rail on a woven blanket, a stirrup hanging, the
 bridle looped over the post."""
 c = Canvas(28, 22)
 w = RAMPS['wood']
 l = LEATHER
 for x in (4, 22):
  c.line((x - 2, 21), (x, 9), w[1]); c.line((x + 2, 21), (x, 9), w[3])
 c.rect(2, 8, 25, 9, w[4]); c.hline(2, 25, 10, w[1])
 bands = ((RED, CREAM, BLUE, CREAM), (BLUE, YEL, RED, YEL))[v % 2]
 for y in range(7, 16):
  c.hline(6 + (y > 12), 20 - (y > 12), y, bands[(y // 2) % 4])
 c.poly([(7, 7), (9, 3), (11, 6), (16, 6), (18, 2), (20, 7), (19, 10), (8, 10)], l[2])
 c.line((9, 3), (10, 6), l[4]); c.hline(11, 16, 6, l[4]); c.line((18, 2), (19, 6), l[1])
 c.vline(13, 10, 16, l[1]); c.rect(12, 17, 14, 18, RAMPS['iron'][3]); c.set(13, 17, RAMPS['iron'][1])
 c.line((24, 9), (26, 15), l[1]); c.line((26, 15), (23, 16), l[1]); c.set(25, 12, RAMPS['iron'][4])
 c.rim(w)
 return c.image()


YARDWORK = {
 'metate': metate,
 'quern': quern,
 'chopping-block': chopping_block,
 'trip-hammer': trip_hammer,
 'travois': travois,
 'wash-tub': wash_tub,
 'grindstone': grindstone,
 'backstrap-loom': backstrap_loom,
 'dung-stack': dung_stack,
 'dugout': dugout,
 'kiln': kiln,
 'mud-bricks': mud_bricks,
 'fishing-nets': fishing_nets,
 'threshing-floor': threshing_floor,
 'lever-press': lever_press,
 'tanning-pits': tanning_pits,
 'dye-vats': dye_vats,
 'rice-rack': rice_rack,
 'bloomery': bloomery,
 'saddle-stand': saddle_stand,
}
