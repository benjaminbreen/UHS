"""Regional yard work: the grinding slabs and querns that stand in for the
generic grinding stone, and the everyday kit that says which part of the
world a yard is in. ~17 source pixels to a metre, like the rest."""
from .core import Canvas, RAMPS
from .solid import K, disc

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
 """A tannery's pits sunk in two rows, seen from above: lime, bark liquor at
 two strengths, the far wall of each pit showing, a hide over one edge."""
 c = Canvas(42, 30)
 r = RAMPS[('limestone', 'wood')[v % 2]]
 liquors = ['#d8d3c0', '#8a6a3a', '#6e4526', '#a0703a', '#5b3a22', '#c9c2a6']
 c.rect(0, 1, 41, 27, r[3]); c.hline(0, 41, 1, r[2]); c.hline(0, 41, 27, r[2]); c.hline(0, 41, 28, r[1])
 for k, (x, y) in enumerate([(2, 3), (15, 3), (28, 3), (2, 15), (15, 15), (28, 15)]):
  c.rect(x, y, x + 11, y + 9, r[4]); c.hline(x, x + 11, y + 9, r[5])
  c.rect(x + 1, y + 1, x + 10, y + 3, r[1]); c.hline(x + 1, x + 10, y + 3, r[0])
  c.rect(x + 1, y + 4, x + 10, y + 8, liquors[k])
  c.hline(x + 2, x + 6, y + 5, '#ffffff' if k in (0, 5) else '#c49a5a')
 c.poly([(16, 13), (24, 13), (26, 19), (22, 21), (17, 20)], HIDE[3]); c.line((17, 14), (23, 14), HIDE[4])
 c.line((35, 9), (40, 0), RAMPS['wood'][4]); c.line((36, 9), (41, 0), RAMPS['wood'][2])
 c.rim(r)
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


YARDWORK = {
 'quern': quern,
 'travois': travois,
 'backstrap-loom': backstrap_loom,
 'dugout': dugout,
 'kiln': kiln,
 'lever-press': lever_press,
 'tanning-pits': tanning_pits,
 'rice-rack': rice_rack,
 'bloomery': bloomery,
}
