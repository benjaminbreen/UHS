"""Regional yard work: the grinding slabs and querns that stand in for the
generic grinding stone, and the everyday kit that says which part of the
world a yard is in. ~17 source pixels to a metre, like the rest."""
from math import pi, sqrt
from .core import Canvas, RAMPS, soft_outline
from .solid import K, disc, lathe

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
 c = Canvas(26, 22)
 cx, by = 12.5, 19
 basalt7 = ['#18171c', '#28262e', '#3c3944', '#524e5c', '#6b6676', '#878292', '#a6a0b0']
 stone = [RAMPS['granite'], RAMPS['sandstone'], basalt7][v % 3]
 oak = RAMPS['oak7']
 flour = ['#b8a882', '#d9ccb0', '#efe6ce', '#fbf7ec']

 for y in range(13, 21):
  for x in range(1, 25):
   u = (x + 0.5 - (cx - 0.5)) / 11.2
   v_el = (y + 0.5 - 16.8) / 3.8
   d2 = u * u + v_el * v_el
   if d2 <= 1.0:
    col = flour[3] if (d2 < 0.65 and u < 0.2) else (flour[2] if d2 < 0.85 else flour[1])
    c.set(x, y, col)

 def bed_tex(z, a, i):
  if int((a + pi) * 10 + z * 2) % 5 == 0:
   return max(1, i - 1)
  return i
 lathe(c, cx, by, [(0, 9.2), (3.5, 9.0)], stone, bed_tex)

 seam_y = by - 3.5
 for x in range(int(cx - 8.8), int(cx + 8.8) + 1):
  u = (x + 0.5 - cx) / 8.8
  if abs(u) <= 1.0:
   ys = round(seam_y - 8.8 * K + 8.8 * K * sqrt(max(0.0, 1.0 - u * u)))
   c.set(x, ys, stone[0])
   if -0.65 < u < -0.15:
    c.set(x, ys, flour[3])
    c.set(x, ys + 1, flour[2])

 def run_tex(z, a, i):
  if int((a + pi) * 9 + z * 3) % 6 == 0:
   return max(1, i - 1)
  return i
 lathe(c, cx, by, [(4.0, 8.2), (7.5, 8.0), (8.5, 6.8)], stone, run_tex)

 top_cy = by - 8.2 - 8.0 * K + 0.5
 disc(c, cx, top_cy, 3.8, 1.8, stone[5])
 disc(c, cx, top_cy, 2.5, 1.2, stone[1])
 c.set(int(cx) - 1, int(top_cy), '#e8c252'); c.set(int(cx), int(top_cy), '#c49630')

 for dx, dy in ((-5, 0), (5, 0), (-3, 2), (3, 2), (-4, -1), (4, -1)):
  c.set(int(cx) + dx, int(top_cy) + dy, stone[3] if dx < 0 else stone[2])

 hx, hy = int(cx) + 5, int(top_cy)
 c.set(hx - 1, hy + 1, stone[1])
 for dy in range(8):
  y = hy - dy
  c.set(hx, y, oak[6] if dy == 7 else oak[5])
  c.set(hx + 1, y, oak[4] if dy == 7 else oak[3])
  c.set(hx + 2, y, oak[1])

 soft_outline(c, stone[0], stone[3])
 return c.image()


def travois(v=0, m=0):
 """A travois at rest: two lodgepoles crossed and tied at the front, a rawhide
 web platform between them with a plump painted parfleche bundle and rolled
 buffalo hide lashed on. Its fringe stirs."""
 c = Canvas(80, 28)
 p = RAMPS['ash7']
 oak = RAMPS['oak7']
 h = HIDE
 rope = RAMPS['rope']

 def thick_pole(a, b, ramp):
  (x0, y0), (x1, y1) = a, b
  steps = max(abs(x1 - x0), abs(y1 - y0)) or 1
  for i in range(steps + 1):
   x = round(x0 + (x1 - x0) * i / steps)
   y = round(y0 + (y1 - y0) * i / steps)
   c.set(x, y, ramp[6] if i % 7 != 0 else ramp[5])
   c.set(x, y + 1, ramp[4])
   c.set(x, y + 2, ramp[2])

 # Back lodgepole
 thick_pole((3, 6), (76, 15), oak)

 # Oval rawhide netting frame between the poles
 for k in range(5):
  t = k / 4.0
  x0 = round(38 + t * 24)
  y_top = round(10 + t * 3)
  y_bot = round(15 + t * 7)
  c.line((x0, y_top), (x0 - 2, y_bot), h[3] if k % 2 == 0 else h[2])
 for y_off in (0, 2, 4):
  c.line((37, 11 + y_off), (63, 14 + y_off + y_off // 2), h[3 if y_off == 0 else 2])
 for x in range(36, 65):
  t = (x - 36) / 28.0
  yt = round(10 + t * 3)
  yb = round(15 + t * 7)
  c.set(x, yt, oak[5]); c.set(x, yt + 1, oak[2])
  c.set(x, yb, oak[4]); c.set(x, yb + 1, oak[1])

 # Plump rolled hide bedroll lashed behind the parfleche
 for dx in range(11):
  bx = 39 + dx
  by = 7 + dx // 4
  for dy in range(6):
   tone = 4 if dy <= 1 else (3 if dy <= 3 else 1)
   c.set(bx, by + dy, h[tone])
  if dx in (3, 8):
   for dy in range(6):
    c.set(bx, by + dy, RED if dy < 4 else BLK)

 # Painted parfleche rawhide trunk in 3/4 view (top face + front panel)
 px0, py0, pw, ph = 48, 4, 15, 10
 for dy in range(3):
  for dx in range(pw):
   c.set(px0 + dx - (2 - dy), py0 + dy, h[4] if dy == 0 else h[3])
 for dy in range(3, ph):
  for dx in range(pw):
   x, y = px0 + dx, py0 + dy
   col = h[3] if dx < pw - 3 else h[2]
   if dy == 3: col = h[1]
   elif dy == ph - 1: col = h[0]
   c.set(x, y, col)

 # Geometric Plains parfleche rawhide painting (diamonds & border stripes)
 c.hline(px0 + 1, px0 + pw - 2, py0 + 4, BLUE)
 c.hline(px0 + 1, px0 + pw - 2, py0 + ph - 2, RED)
 for k, col in enumerate((RED, YEL, BLUE, RED)):
  gx = px0 + 2 + k * 3
  c.set(gx + 1, py0 + 6, col)
  c.set(gx, py0 + 7, col); c.set(gx + 1, py0 + 7, YEL if col != YEL else RED); c.set(gx + 2, py0 + 7, col)
  c.set(gx + 1, py0 + 8, col)
 c.vline(px0 + pw // 2, py0 + 1, py0 + ph - 1, rope[1])

 # Animated rawhide fringe hanging from the parfleche side
 sway = (0, 1, 0, -1)[m % 4]
 for k, fx in enumerate(range(px0 + 2, px0 + pw - 1, 2)):
  for fy in range(py0 + ph, py0 + ph + 3):
   c.set(fx, fy, h[3 if k % 2 == 0 else 2])
  c.set(fx + sway * (1 if k % 2 == 0 else -1), py0 + ph + 3, h[2])

 # Front lodgepole & rawhide lashing at the apex hitch
 thick_pole((3, 3), (76, 24), p)
 for dx in range(4):
  for dy in range(5):
   c.set(16 + dx, 5 + dy, rope[3] if (dx + dy) % 2 == 0 else rope[1])

 soft_outline(c, oak[0], p[3])
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
