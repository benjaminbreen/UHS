"""Open-lot props: what a town or village kept on ground it left unbuilt.
Frame order is the variant index src/content/props/lots.ts names; keep the
two lists in step. Graves, crosses, carts and troughs are not here: the lots
use the grave-mound, sacred-marker, farm-cart and trough sprites."""
from math import atan2, cos, hypot, pi, sin, sqrt
from .core import Canvas, RAMPS, blob, jitter, revolve, belly, soft_outline
from .solid import K, disc, lathe, block, log_x

BARK = ['#1f1814', '#33261d', '#4a3727', '#634a33', '#7d5f41', '#987752']
HEART = ['#3d2b1a', '#6a4c2e', '#95703f', '#b8925a', '#d4b077', '#ead09a']
STRAW = ['#4a3a1a', '#6f5a2a', '#93793a', '#b39a4f', '#ccb66c', '#e2d190']
OLD_STRAW = ['#3a301e', '#55482c', '#76663e', '#958452', '#ae9e68', '#c6b885']
STRAW7 = ['#362812', '#523d1b', '#735726', '#967434', '#ba9447', '#dbb660', '#f2d680']
OLD_STRAW7 = ['#2f2618', '#473b25', '#635334', '#826e46', '#a18b5b', '#bfa975', '#d9c594']
CUT_COL = ['#9e7340', '#cfa468', '#f2cf94']
DUNG = ['#251c15', '#3a2c20', '#52402e', '#6b553c', '#86704f', '#a28b66']
MUD = ['#3a2a1e', '#5a412c', '#7a5a3c', '#98764f', '#b39266', '#cbad82']
LOESS = ['#4a3b25', '#6e5835', '#927748', '#b0955d', '#c9b078', '#dfca98']
TWIG = ['#241c18', '#3a2e27', '#554437', '#6f5a48', '#8c765f', '#a8937a']
SORGHUM = ['#2c1310', '#4e1f17', '#73301f', '#94462a', '#b0623a']
EAR = ['#7a5a1c', '#a8842c', '#cfae48', '#e6cd72']
GRASS = ['#1f3318', '#2e4a20', '#41632a', '#5a7f36', '#7a9c48']
LEAF = ['#152517', '#1f3a1f', '#2c5226', '#3e6b2e', '#55873a', '#76a24c', '#9fbf6c']
ROPE = ['#3e3020', '#64502f', '#8a7245', '#ab9462']


def post(c, x, y0, y1, r=BARK):
 """A round post two pixels wide, lit on the left, its cut top showing."""
 c.vline(x, y0, y1, r[4]); c.vline(x + 1, y0, y1, r[2])
 c.set(x, y0, r[5]); c.set(x + 1, y0, r[3])
 c.set(x, y1, r[2]); c.set(x + 1, y1, r[1])


def tufts(c, spots):
 """Grass grown up round the foot: after the rim, so it is not outlined."""
 for x, y, h in spots:
  for i in range(h):
   c.set(x + (i == h - 1), y - i, GRASS[2 + (i > 0)])
  c.set(x - 1, y, GRASS[1]); c.set(x + 2, y - 1, GRASS[3])


ENDS = [
 ['.BbbB.',
  'bLLLhd',
  'bLhhhd',
  'bLhphd',
  'bhhhmd',
  '.dddd.'],
 ['.Bbb.',
  'bLLhd',
  'bLphd',
  'bhhmd',
  '.ddd.'],
 ['..BbB..',
  '.bLLLhd',
  'bLLhhhd',
  'bLhmphd',
  'bhhhhmd',
  '.dhhmd.',
  '..ddd..'],
 ['BbbbbB',
  'dLLLLd',
  '.dhhd.',
  '..dd..'],
 ['Bb...',
  'bLb..',
  'bLhb.',
  'bLhhd',
  'dddd.'],
]


def log_end(c, x, y, k, flip=False):
 """A log seen end on, hand placed: bark ring, the lit face, pith and the
 dark growth ring on the shaded side. The last two are split billets."""
 keys = {'B': BARK[5], 'b': BARK[4], 'd': BARK[2], 'L': HEART[5], 'h': HEART[3], 'm': HEART[2], 'p': HEART[1]}
 g = ENDS[k]
 for j, row in enumerate(g):
  for i, ch in enumerate(row[::-1] if flip else row):
   if ch != '.': c.set(x + i, y + j, keys[ch])


def heap(r, w, h, bits, seed, fork=False, loose=None):
 c = Canvas(w, h)
 cx = w / 2
 shapes = [(cx, h - h * .3, w * .46, h * .55), (cx - w * .18, h - h * .25, w * .3, h * .38),
           (cx + w * .2, h - h * .22, w * .27, h * .33)]
 m = blob(c, shapes, r, rim=False)
 for k in range(w * h // 9):
  j = jitter(k, seed); x, y = j % w, (j * 7 + k) % h
  if (x, y) in m and (x + 2, y) in m:
   tone = bits[(m[(x, y)] + 1) % len(bits)] if m[(x, y)] > 1 else bits[0]
   c.line((x, y), (x + 1 + j % 2, y - (j % 3 == 0)), tone)
 for x in range(w):
  if (x, h - 1) in m: c.set(x, h - 1, r[0])
 c.rim(r)
 if loose:
  for k in range(14):
   j = jitter(k, seed + 1); a = pi * (1.05 + .9 * k / 13)
   x, y = cx + cos(a) * w * .47, h - h * .3 + sin(a) * h * .62
   c.line((x, y), (x + cos(a + (j % 3 - 1) * .5) * 3, y + sin(a) * 2 - 1), loose[3 + j % 3])
 if fork:
  for k in range(3):
   c.line((w - 10 + k * 2, 4), (w - 9 + k * 2, 10), RAMPS['iron'][3 if k else 4])
  c.hline(w - 10, w - 5, 10, RAMPS['iron'][2])
  c.line((w - 7, 10), (w - 2, 0), BARK[4]); c.line((w - 6, 10), (w - 1, 0), BARK[2])
 return c.image()


def bark_top(c, x0, x1, y0, y1, seed=0):
 """The tops of the logs running back from the face: one lit cylinder
 per column, a dark seam between."""
 for x in range(x0, x1 + 1):
  k = (x - x0 + seed) % 5
  for y in range(y0, y1 + 1):
   t = (1, 3, 4, 3, 2)[k]
   if k in (1, 2, 3) and jitter(x // 5, y) % 5 == 0: t -= 1
   if y == y0 and k: t = max(t, 4)
   c.set(x, y, BARK[t])


def cordwood(rows):
 W, dd = 40, 5
 top = 3 + dd
 H = top + rows * 5 + 3
 c = Canvas(W, H)
 for x in (1, W - 3): post(c, x, 2, top - dd + 1)
 bark_top(c, 3, W - 4, top - dd, top - 1, 1)
 c.rect(3, top, W - 4, H - 2, BARK[0])
 for row in range(rows):
  y = top + 2 + row * 5
  x = 3 + (row % 2) * 2
  while x < W - 8:
   k = (0, 2, 0, 2, 1, 0, 3, 4)[jitter(x, row) % 8]
   log_end(c, x, y - 2 - (k == 3), k, flip=jitter(row, x) % 2 == 0)
   x += len(ENDS[k][0]) - 1
 c.hline(3, W - 4, top, BARK[2])
 c.hline(2, W - 3, H - 1, BARK[1])
 for x in (0, W - 2): post(c, x, top - 2, H - 1)
 c.rim(BARK)
 tufts(c, [(4, H - 1, 2), (W - 6, H - 1, 3), (17, H - 1, 1)])
 return c.image()


def straw_cone():
 c = Canvas(36, 42)
 cx, by = 18.0, 39
 oak, walnut, steel = RAMPS['oak7'], RAMPS['walnut7'], RAMPS['iron7']
 for y in range(2, 9):
  c.set(17, y, walnut[5]); c.set(18, y, walnut[3]); c.set(19, y, walnut[1])
 c.set(17, 1, CUT_COL[2]); c.set(18, 1, CUT_COL[1])

 prof = [(0, 13.5), (3, 15.0), (10, 14.5), (18, 11.5), (25, 7.0), (29, 3.0), (31, 1.2)]
 def hay_tex(z, a, i):
  course = int(z) % 6
  clump = int((a + pi) * 9 + int(z // 6) * 2) % 4
  if course == 0 and z > 3:
   return max(1, i - 1)
  if course == 1 and z > 3 and a < 0.4:
   return min(6, i + 1)
  if clump == 0:
   return max(1, i - 1)
  return i

 m = lathe(c, cx, by, prof, STRAW7, hay_tex, flat=False)
 for (x, y), (z, a) in m.items():
  if abs(z - 14.0) < 0.7 or abs(z - 22.0) < 0.7:
   c.set(x, y, ROPE[3] if a < -0.1 else (ROPE[2] if a < 0.5 else ROPE[1]))

 for x in range(4, 33):
  u = (x + 0.5 - cx) / 14.2
  if abs(u) > 1.0:
   continue
  yb = round(by - 13.5 * K + 13.5 * K * sqrt(max(0.0, 1.0 - u * u)))
  if (x * 7) % 3 == 0:
   c.set(x, yb + 1, STRAW7[4] if u < 0 else STRAW7[2])

 for i in range(24):
  rx = round(27 + i * 0.32)
  ry = 14 + i
  c.set(rx, ry, oak[5]); c.set(rx + 1, ry, oak[2])
 for tx, ty in ((25, 13), (27, 12), (29, 13)):
  c.set(tx, ty, steel[5]); c.set(tx, ty + 1, steel[3])

 soft_outline(c, STRAW7[0], STRAW7[3])
 return c.image()


def rick():
 c = Canvas(50, 44)
 L, Rt, by = 5, 44, 41
 oak, granite = RAMPS['oak7'], RAMPS['granite']
 for sx in (11, 26, 40):
  for y in range(by - 6, by - 2):
   c.set(sx - 1, y, granite[2]); c.set(sx, y, granite[1]); c.set(sx + 1, y, granite[0])
  for x in range(sx - 2, sx + 3):
   c.set(x, by - 7, granite[3] if x <= sx else granite[1])

 for sx in (9, 24, 39):
  for y in range(by - 4, by + 1):
   hw = 1 if y < by - 1 else 2
   for x in range(sx - hw, sx + hw + 1):
    c.set(x, y, granite[5] if x < sx else (granite[3] if x == sx else granite[1]))
  for dy, hw in ((-7, 3), (-6, 4), (-5, 4)):
   y = by + dy
   for x in range(sx - hw, sx + hw + 1):
    if dy == -7: col = granite[6] if x <= sx else granite[4]
    elif dy == -6: col = granite[5] if x < sx else (granite[4] if x <= sx + 1 else granite[2])
    else: col = granite[2] if x < sx else granite[1]
    c.set(x, y, col)

 frame_y = by - 9
 for x in range(L, Rt + 1):
  c.set(x, frame_y, oak[5] if x < 30 else oak[4])
  c.set(x, frame_y + 1, oak[3] if x < 30 else oak[2])
  c.set(x, frame_y + 2, oak[1])
 for jx in (9, 17, 24, 32, 39):
  c.rect(jx - 1, frame_y, jx + 1, frame_y + 1, CUT_COL[1])
  c.set(jx - 1, frame_y, CUT_COL[2])

 eave_y = frame_y - 11
 for y in range(eave_y + 2, frame_y):
  t = (y - (eave_y + 2)) / max(1, frame_y - eave_y - 3)
  flare = round((1.0 - t) * 1.2)
  xl, xr = L - flare, Rt + flare
  course = (y - eave_y) // 3
  for x in range(xl, xr + 1):
   u = (x - xl) / max(1, xr - xl)
   if y == eave_y + 2:
    tone = 1
   elif y == eave_y + 3:
    tone = 3 if u < 0.65 else 2
   else:
    tone = 5 if u < 0.35 else (4 if u < 0.78 else 3)
    clump = (x + course * 3) // 4
    if (y - eave_y) % 3 == 0 and (clump % 2 == 0):
     tone = max(2, tone - 1)
    elif (clump * 7 + course) % 5 == 0 and u < 0.6:
     tone = min(6, tone + 1)
   c.set(x, y, STRAW7[tone])

 for px, tone_hi, tone_lo in ((L, oak[5], oak[3]), (Rt - 1, oak[3], oak[1])):
  for y in range(eave_y + 2, frame_y):
   c.set(px, y, tone_hi); c.set(px + 1, y, tone_lo)

 ridge_y = eave_y - 14
 tiers = 3
 th = 14 / tiers
 for y in range(ridge_y, eave_y + 2):
  t = (y - ridge_y) / 15.0
  inset = round((1.0 - t) * 7)
  xl, xr = L - 3 + inset, Rt + 3 - inset
  for x in range(xl, xr + 1):
   u = (x - xl) / max(1, xr - xl)
   wave = round(0.6 * sin(x * 0.32))
   y_eff = (y - ridge_y) + wave
   tier = max(0, min(tiers - 1, int(y_eff // th)))
   ty = y_eff - tier * th
   if y == eave_y + 1:
    tone = 2
   elif tier > 0 and ty < 1.0:
    tone = 2
   elif tier > 0 and ty < 2.1:
    tone = 6 if u < 0.65 else 5
   else:
    tone = 5 if (u < 0.32 and ty < th * 0.6) else (4 if u < 0.78 else 3)
    if ((x + tier * 2) // 2) % 3 == 0:
     tone = max(2, tone - 1)
   if x < xl + 2:
    tone = min(6, tone + 1)
   elif x > xr - 3:
    tone = max(1, tone - 1)
   c.set(x, y, OLD_STRAW7[tone])

 for x in range(L - 3, Rt + 4):
  c.set(x, eave_y, OLD_STRAW7[5] if x < 34 else OLD_STRAW7[4])
  c.set(x, eave_y + 1, OLD_STRAW7[3] if (x % 3 != 0) else OLD_STRAW7[2])

 r_xl, r_xr = L + 4, Rt - 4
 for x in range(r_xl, r_xr + 1):
  c.set(x, ridge_y - 2, OLD_STRAW7[6] if x < 32 else OLD_STRAW7[5])
  c.set(x, ridge_y - 1, OLD_STRAW7[5] if x < 32 else OLD_STRAW7[4])
  c.set(x, ridge_y, OLD_STRAW7[2])
  if (x - r_xl) % 6 in (2, 3):
   c.set(x, ridge_y - 2, oak[5]); c.set(x, ridge_y, oak[2])
 for fx in (r_xl, r_xr):
  c.set(fx, ridge_y - 3, OLD_STRAW7[6]); c.set(fx, ridge_y - 4, OLD_STRAW7[4])

 for rx in (12, 20, 29, 37):
  for y in range(ridge_y, eave_y + 2):
   c.set(rx, y, ROPE[2] if y % 2 == 0 else ROPE[1])
  c.rect(rx - 1, eave_y + 2, rx, eave_y + 3, granite[4])
  c.set(rx - 1, eave_y + 2, granite[6]); c.set(rx, eave_y + 3, granite[1])

 soft_outline(c, OLD_STRAW7[0], OLD_STRAW7[3])
 return c.image()


def shock(heads):
 """Stalks stood together and tied near the top, the heads above the tie."""
 c = Canvas(28, 44)
 stalks = lambda z, a, i: i + (1 if int(a * 7 + 20) % 2 else -1) * (z < 24)
 lathe(c, 14, 42, [(0, 12), (3, 11), (20, 4), (24, 3), (27, 4.5), (30, 5)], STRAW, stalks, flat=False)
 m = lathe(c, 14, 42, [(23, 3.4), (25, 3.4)], ROPE)
 for k, (dx, dy) in enumerate([(-6, 4), (-3, 1), (0, 0), (3, 1), (6, 4), (-4, 7), (4, 7), (-1, 4), (2, 5)]):
  x, y = 14 + dx, 5 + dy
  disc(c, x, y, 1.7, 2.4, heads[2])
  c.set(x - 1, y - 1, heads[4]); c.set(x, y + 1, heads[1]); c.set(x - 1, y, heads[3])
 c.rim(STRAW)
 tufts(c, [(3, 43, 2), (24, 43, 2)])
 return c.image()


def faggots(thorns=False):
 r = TWIG if not thorns else ['#231e18', '#3a3226', '#555036', '#706a48', '#8c8560', '#aaa37c']
 c = Canvas(46, 24)
 def grain(x, y, v, i):
  return i + (1 if (y * 5 + jitter(x // 3, y)) % 4 == 0 else -1 if (y * 3 + x // 4) % 5 == 0 else 0)
 for x0, by, length in [(4, 23, 18), (22, 23, 18), (13, 15, 18)]:
  log_x(c, x0, x0 + length, by, 5, r, grain)
  for b in (x0 + 4, x0 + length - 4):
   for y in range(by - 10, by + 1):
    if c.get(b, y): c.set(b, y, (ROPE if not thorns else ['#4a4628', '#6b6a3a', '#8e8c50', '#aaa86a'])[2 - (y > by - 4)])
 c.rim(r)
 for x0, by, length in [(4, 23, 18), (22, 23, 18), (13, 15, 18)]:
  for e, d in ((x0, -1), (x0 + length, 1)):
   for k in range(5):
    y = by - 1 - k * 2
    c.line((e, y), (e + d * (2 + jitter(e, k) % 3), y - (k > 2)), r[3 + (k > 2)])
  if thorns:
   for k in range(6):
    j = jitter(k, x0)
    c.set(x0 + 2 + j % (length - 4), by - 8 + j % 5, r[5])
 tufts(c, [(2, 23, 2), (41, 23, 2)])
 return c.image()


def lumber():
 c = Canvas(54, 34)
 L, Rt, by = 2, 51, 30
 P = RAMPS['palewood']
 rows, dd = 4, 9
 front = by - rows * 4 + 1
 def boards(x, y, w, h):
  for xx in range(x, x + w):
   for yy in range(y, y + h):
    k = (xx - x) % 8
    c.set(xx, yy, P[5 if k == 1 else 4 if k < 6 else 3 if k == 6 else 2])
   if jitter(xx, 3) % 5 == 0: c.vline(xx, y + 2, y + 4, P[3])
 block(c, L, by, Rt - L + 1, rows * 4, 18, P, top=boards)
 for row in range(rows):
  y = front + row * 4
  c.hline(L, Rt, y, P[4]); c.hline(L, Rt, y + 1, P[3]); c.hline(L, Rt, y + 2, P[2])
  c.hline(L, Rt, y + 3, BARK[1])
  for x in (L + 4, (L + Rt) // 2 - 1, Rt - 6):
   c.hline(x, x + 2, y + 3, BARK[3])
 for x in range(L + 8, Rt - 2, 8): c.vline(x, front, by - 1, P[2])
 for x in (L + 6, Rt - 12):
  for y in range(front - 9, front):
   c.hline(x, x + 5, y, P[5] if y == front - 9 else P[3]); c.set(x + 5, y, P[2])
 c.rim(P)
 tufts(c, [(L + 6, by + 2, 2), (Rt - 8, by + 2, 3), (26, by + 2, 1)])
 return c.image()


def bitaura():
 """A dung-cake store as it is built in the Gangetic plain: cakes stacked
 into a pointed hut, plastered and pressed with a band of lime chevrons."""
 c = Canvas(32, 40)
 def courses(z, a, i):
  if int(z * 2) % 7 == 0: return i - 1
  if int((a + (int(z / 3.5) % 2) * .35) * 6) % 5 == 0 and z < 24: return i - 1
  return i
 m = lathe(c, 16, 37, [(0, 13), (6, 13), (16, 10.5), (25, 5), (29, 2), (31, 1)], DUNG, courses, flat=False)
 for (x, y), (z, a) in m.items():
  if 11 <= z <= 13 and abs(a) < 2.2 and ((x + (1 if z > 12 else 0)) % 3 == 0):
   c.set(x, y, '#ddd1b4' if a < .8 else '#b9ad91')
 c.vline(16, 3, 7, DUNG[4]); c.set(17, 5, DUNG[2])
 c.rim(DUNG)
 for k in range(3):
  lathe(c, 27 - k, 38 - k * 2, [(0, 3), (1.5, 3)], DUNG)
 tufts(c, [(2, 39, 2), (10, 39, 1)])
 return c.image()


def stooks():
 c = Canvas(48, 34)
 ear7 = ['#523a10', '#785618', '#9e7524', '#c49634', '#e3b84c', '#f5d66e', '#fff0a6']
 centers = [(12.5, 25), (35.5, 24), (24.0, 31)]
 for idx, (cx, by) in enumerate(centers):
  prof = [(0, 8.2), (3, 7.4), (9, 5.2), (13, 3.6), (15, 4.4), (18, 4.8), (20, 2.5)]
  def stook_tex(z, a, i):
   stalk = int((a + pi) * 7 + idx * 3) % 3
   if z < 12.5:
    return min(6, i + 1) if stalk == 0 else (max(1, i - 1) if stalk == 2 else i)
   return i
  lathe(c, cx, by, prof, STRAW7, stook_tex, flat=False)

  wy = round(by - 13 - 3.6 * K)
  for dx in range(-4, 5):
   drop = 1 if abs(dx) <= 2 else 0
   c.set(int(cx) + dx, wy + drop, ROPE[3] if dx < 0 else ROPE[1])
   c.set(int(cx) + dx, wy + drop + 1, ROPE[1] if dx < 0 else ROPE[0])

  head_y = wy - 5
  for dx, dy in ((-4, 2), (-2, 0), (0, -1), (2, 0), (4, 2), (-2, 3), (1, 3)):
   hx, hy = int(cx) + dx, head_y + dy
   c.set(hx, hy, ear7[6 if dx <= 0 else 4])
   c.set(hx + 1, hy, ear7[4 if dx <= 0 else 2])
   c.set(hx, hy + 1, ear7[5 if dx <= 0 else 3])
   c.set(hx + 1, hy + 1, ear7[2 if dx <= 0 else 1])

  for dx in range(-8, 9):
   u = dx / 8.2
   if abs(u) <= 1.0:
    yb = round(by - 8.2 * K + 8.2 * K * sqrt(max(0.0, 1.0 - u * u)))
    if (dx + idx) % 2 == 0:
     c.set(int(cx) + dx, yb + 1, STRAW7[4 if dx < 0 else 2])
    else:
     c.set(int(cx) + dx, yb, STRAW7[1])

 soft_outline(c, STRAW7[0], STRAW7[3])
 return c.image()


STORE = [
 lambda: shock(SORGHUM), lambda: faggots(thorns=True),
 lambda: heap(STRAW, 30, 16, OLD_STRAW, 3, loose=STRAW),
 lambda: heap(DUNG, 28, 18, STRAW, 5, fork=True), lumber,
]


INDIGO = ['#11182b', '#1a2542', '#25365e', '#33497b', '#4a6497', '#6c86b3']
WOAD = ['#1d2b3b', '#2b4057', '#3d5974', '#557693', '#7495ae', '#9cb8ca']
MADDER = ['#2b1113', '#4a1c1d', '#6c2925', '#8f3c32', '#ad5644', '#c87a62']
TURMERIC = ['#4a3009', '#7a520f', '#a87816', '#cc9a22', '#e3b93d', '#f2d673']
CHILI = ['#3a0e0c', '#5e1612', '#86211a', '#ab3022', '#c94a31', '#e0704c']
COCHINEAL = ['#2c0c1c', '#4b142c', '#6e1e3e', '#922a50', '#b24466', '#cc6c86']
LINEN = ['#45412f', '#625d45', '#827c5f', '#a29c7c', '#c1bb9b', '#dcd8bd']
BAMBOO = ['#2f3418', '#4b5224', '#6b7332', '#8d9645', '#adb560', '#cdd283']
MAT = ['#4d3b1f', '#6e5730', '#917646', '#ae935c', '#c7ae78']


def cloth(c, x, y, w, h, r, seed):
 """A length hung over a line: the fold-over on top, soft vertical folds
 that catch the light on their left, a hem that does not hang quite level."""
 for i in range(w):
  f = sin((i + seed) * 1.3) + .5 * sin((i + seed) * 2.9)
  tone = 3 + (f > .6) - (f < -.6) + (i == 0) - (i == w - 1)
  bottom = y + h + (1 if (i + seed) % 5 in (1, 2) else 0) - (i in (0, w - 1))
  for yy in range(y, bottom + 1):
   t = tone - (yy > bottom - 2) * (yy == bottom)
   if yy < y + 3: t = tone + 1 - (yy == y + 2)
   c.set(x + i, yy, r[max(0, min(5, t))])
 c.hline(x, x + w - 1, y + 3, r[1])


def line_cloth(*dyes):
 c = Canvas(54, 38)
 L, Rt, ty, by = 2, 50, 4, 37
 for i, x in enumerate(range(L + 3, Rt - 10, 16)):
  cloth(c, x, ty + 2 + (i == 1), 13, 18 + (i * 5) % 7, dyes[i % len(dyes)], i * 3)
 c.rim(BARK)
 for x in range(L + 1, Rt + 1):
  c.set(x, ty + 1 + round(2 * sin(pi * (x - L) / (Rt - L))), ROPE[2])
 for x in (L, Rt):
  post(c, x - 1, ty - 1, by)
  c.set(x - 2, ty, BARK[3]); c.set(x + 1, ty, BARK[2])
 for x in range(L + 3, Rt - 10, 16):
  for px in (x + 2, x + 10):
   c.vline(px, ty + 1, ty + 3, BARK[4]); c.set(px, ty, BARK[5])
 tufts(c, [(L + 1, by, 3), (Rt - 1, by, 2), (24, by, 1)])
 return c.image()


def tenter(r):
 c = Canvas(64, 26)
 L, Rt, ty, by = 2, 61, 6, 24
 for x in range(L + 2, Rt - 1):
  for y in range(ty + 2, ty + 13):
   t = 3 + ((y - ty) % 4 == 0) - (x > Rt - 6) + (y == ty + 2)
   if (x - L) % 15 == 0: t -= 1
   c.set(x, y, r[max(0, min(5, t))])
 c.rim(BARK)
 for y in (ty, ty + 14):
  c.hline(L, Rt, y, BARK[4]); c.hline(L, Rt, y + 1, BARK[2])
  for x in range(L + 3, Rt - 1, 3): c.set(x, y + (2 if y == ty else -1), RAMPS['iron'][4])
 for x in range(L, Rt + 1, 15):
  post(c, x, ty - 2, by)
 tufts(c, [(L + 4, by, 2), (30, by, 3), (Rt - 3, by, 2)])
 return c.image()


def maize_hang():
 c = Canvas(44, 34)
 L, Rt, ty, by = 3, 40, 5, 33
 colours = [TURMERIC, ['#2a1424', '#47213a', '#683052', '#87436b', '#a65f86', '#c182a2'], CHILI, TURMERIC,
            ['#3f3524', '#6b5b3a', '#9b8858', '#c4b37d', '#ddd0a0', '#efe6c6'], TURMERIC]
 for k, x in enumerate(range(L + 4, Rt - 3, 5)):
  r = colours[k % len(colours)]
  for side in (0, 1):
   cx = x + side * 2 - 1
   yt = ty + 4 + (k + side) % 2
   c.line((x, ty + 1), (cx, yt), LINEN[4])
   for y in range(yt, yt + 10):
    w = 1 if y in (yt, yt + 9) else 2
    for xx in range(cx - (w > 1), cx + w - (w > 1)):
     t = 4 if xx < cx else 2
     if (y + xx) % 2 == 0: t += 1
     c.set(xx, y, r[t])
 c.rim(BARK)
 c.hline(L - 2, Rt + 2, ty, BARK[4]); c.hline(L - 2, Rt + 2, ty + 1, BARK[2])
 for x in (L, Rt):
  post(c, x - 1, ty - 1, by)
  c.set(x - 2, ty - 2, BARK[4]); c.set(x + 1, ty - 2, BARK[3])
 tufts(c, [(L, by, 2), (Rt - 2, by, 2)])
 return c.image()


def daikon_rack():
 c = Canvas(46, 40)
 L, Rt, by = 2, 43, 39
 white = ['#5c5a52', '#8b887c', '#b4b0a2', '#d6d2c4', '#ecebe2', '#fbfaf3']
 for row, ty in enumerate((5, 20)):
  for k, x in enumerate(range(L + 3, Rt - 1, 4)):
   j = jitter(k, row)
   for dx in (-1, 0, 1):
    c.line((x, ty + 1), (x + dx * 2, ty - 3 - (j + dx) % 2), LEAF[4 + (dx < 0)])
   ln = 9 + j % 4
   for y in range(ty + 1, ty + ln):
    w = 2 if y < ty + ln - 3 else 1
    c.set(x - 1 + (w == 1), y, white[4]); c.set(x, y, white[3] if w > 1 else white[2])
   c.set(x - 1, ty + 2, white[5])
 c.rim(white)
 for ty in (5, 20):
  c.hline(L, Rt, ty, BAMBOO[4]); c.hline(L, Rt, ty + 1, BAMBOO[2])
 for x in (L, Rt - 1):
  c.vline(x, 2, by, BAMBOO[4]); c.vline(x + 1, 2, by, BAMBOO[2])
  for y in (9, 17, 27): c.hline(x, x + 1, y, BAMBOO[1])
 tufts(c, [(L + 3, by, 2), (Rt - 4, by, 2)])
 return c.image()


def stretch(r):
 c = Canvas(60, 22)
 L, Rt, ty, by = 2, 57, 6, 21
 for x in range(L + 2, Rt - 1):
  for y in range(ty, ty + 4):
   c.set(x, y, r[4 - (y > ty) - (y == ty + 3) + ((x // 6) % 2 == 0 and y == ty + 1)])
 for x in range(L + 4, Rt - 3, 4):
  for k in range(4):
   c.set(x + k - 2, ty + 5 + (1 if k in (1, 2) else 0), BAMBOO[3])
 c.rim(BARK)
 for x in (L, Rt - 1):
  post(c, x, ty - 3, by)
 c.hline(L + 2, Rt - 1, ty - 1, ROPE[2])
 tufts(c, [(L + 3, by, 2), (30, by, 1), (Rt - 3, by, 2)])
 return c.image()


def pots_board(r, slip=None):
 c = Canvas(48, 30)
 block(c, 1, 25, 46, 3, 10, RAMPS['palewood'])
 for x in (4, 41): block(c, x, 29, 3, 4, 3, RAMPS['granite'][1:])
 shapes = [[(0, 4), (5, 6.5), (10, 5), (13, 3.5)], [(0, 5), (4, 6.5), (8, 6), (10, 5)], [(0, 3), (6, 5.5), (12, 4), (15, 2.5)]]
 for cx, by, prof in zip((10, 24, 37), (21, 23, 21), shapes):
  m = lathe(c, cx, by, prof, r, lambda z, a, i, slip=slip: i + (1 if slip and 5 < z < 6.5 else 0))
  top, rr = prof[-1]
  disc(c, cx, by - top, rr, rr * K, r[1]); disc(c, cx, by - top + .6, rr - 1, (rr - 1) * K, r[0])
  c.hline(int(cx - rr + 1), int(cx + rr - 1), int(by - top - rr * K), r[5])
 c.rim(r)
 tufts(c, [(2, 29, 2), (45, 29, 2)])
 return c.image()


def mud_bricks(r=MUD):
 c = Canvas(50, 26)
 for row in range(3):
  for k in range(4):
   block(c, 2 + k * 7 + row % 2 * 2, 13 + row * 5, 6, 2, 6, r)
 for lay in range(4):
  by = 24 - lay * 3
  if lay % 2 == 0:
   for k in range(2): block(c, 33 + k * 7, by, 6, 2, 6, r)
  else:
   for x in (33, 36, 40, 43): block(c, x, by, 2, 2, 12, r)
 c.rim(r)
 for x in range(3, 30, 4): c.set(x, 25, STRAW[3])
 return c.image()


DRYING = [
 lambda: line_cloth(WOAD, MADDER, LINEN),
 lambda: line_cloth(TURMERIC, MADDER, INDIGO),
 lambda: line_cloth(COCHINEAL, INDIGO, LINEN),
 lambda: line_cloth(INDIGO, WOAD, INDIGO),
 lambda: tenter(WOAD), lambda: tenter(MADDER), maize_hang, daikon_rack, lambda: stretch(INDIGO),
 lambda: pots_board(RAMPS['buffclay7'][1:], slip='#c9bb98'), lambda: pots_board(RAMPS['terracotta7'][1:]),
]


def mat(c, x0, y0, w, h):
 for y in range(y0, y0 + h):
  for x in range(x0, x0 + w):
   c.set(x, y, MAT[2 + ((x // 2 + y // 2) % 2)])
 c.hline(x0, x0 + w - 1, y0, MAT[4]); c.hline(x0, x0 + w - 1, y0 + h - 1, MAT[1])
 c.hline(x0, x0 + w - 1, y0 + h, MAT[0])
 c.vline(x0, y0, y0 + h - 1, MAT[3]); c.vline(x0 + w - 1, y0, y0 + h - 1, MAT[1])


def spread(r, kind):
 c = Canvas(36, 22)
 mat(c, 1, 2, 34, 19)
 for k in range(150 if kind != 'grain' else 260):
  j = jitter(k, kind == 'chili', k * 3)
  x, y = 4 + (j * 7 + k * 13) % 28, 4 + (j + k * 5) % 15
  if ((x - 18) / 15) ** 2 + ((y - 11.5) / 8) ** 2 > 1: continue
  if kind == 'chili':
   c.set(x, y, r[3 + j % 3]); c.set(x + 1, y + (j % 2), r[2]); c.set(x + 2, y + (j % 2), r[1] if j % 4 else LEAF[3])
  elif kind == 'root':
   c.set(x, y, r[4]); c.set(x + 1, y, r[3]); c.set(x + 1, y + 1, r[2])
  else:
   c.set(x, y, r[2 + j % 4])
 c.rim(MAT)
 return c.image()


def hide(r):
 c = Canvas(34, 24)
 pts = [(6, 4), (11, 6), (16, 3), (22, 6), (28, 4), (26, 10), (30, 18), (23, 17), (17, 21), (11, 17), (4, 19), (7, 11)]
 c.poly(pts, r[2])
 c.poly([(9, 7), (16, 5), (24, 7), (24, 15), (16, 18), (9, 15)], r[3])
 c.poly([(11, 8), (16, 7), (19, 9), (15, 12), (11, 12)], r[4])
 for x, y in [(13, 13), (19, 14), (21, 9)]: c.set(x, y, r[1])
 c.rim(r)
 for x, y in pts[::2] + [pts[9], pts[11]]:
  c.vline(x, y - 2, y, BARK[4]); c.set(x, y - 3, BARK[5])
 return c.image()


def dung_cakes():
 c = Canvas(34, 18)
 for row in range(3):
  for k in range(5):
   x, y = 3 + k * 6 + row % 2 * 3, 4 + row * 5
   if x > 29: continue
   disc(c, x + 2.5, y + 1.5, 2.7, 1.9, DUNG[3])
   c.hline(x + 1, x + 3, y, DUNG[4]); c.set(x + 1, y + 1, DUNG[5]); c.set(x + 3, y + 1, DUNG[2])
   c.hline(x + 1, x + 4, y + 3, DUNG[1])
 c.rim(DUNG)
 return c.image()


def threshing_floor():
 """A round floor of beaten earth kerbed with stones, sheaves spread to be
 trodden out round the post the oxen are tethered to, the grain swept into
 a heap beside it."""
 c = Canvas(58, 30)
 cx, cy, rx, ry = 29, 14, 25, 11.5
 g = RAMPS['sandstone']
 for y in range(30):
  for x in range(58):
   u, v = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   d = u * u + v * v
   if d <= 1: c.set(x, y, LOESS[4] if d < .5 else LOESS[3] if v > .3 and d > .8 else LOESS[4])
 for k, rr in enumerate((.45, .62, .78, .9)):              # straw trodden round in rings
  for i in range(int(200 * rr)):
   a = i / (200 * rr) * 2 * pi + k
   if (i + 7 * k) % 11 < 7:
    x, y = cx + cos(a) * rx * rr, cy + sin(a) * ry * rr
    c.set(int(x), int(y), STRAW[5] if sin(a) < 0 else STRAW[4]); c.set(int(x) + 1, int(y), STRAW[3])
 stones = sorted(((cx + cos(a) * (rx + .5), cy + sin(a) * (ry + .6)) for a in (i * 2 * pi / 26 for i in range(26))), key=lambda p: p[1])
 for x, y in stones:
  x, y = int(x), int(y)
  front = y > cy
  c.hline(x - 1, x + 1, y, g[6] if not front else g[5]); c.hline(x - 1, x + 1, y + 1, g[4])
  if front: c.hline(x - 1, x + 1, y + 2, g[2])
  c.set(x + 1, y + 1, g[3])
 c.rect(cx, cy - 8, cx + 1, cy, RAMPS['ash7'][4]); c.vline(cx + 1, cy - 8, cy, RAMPS['ash7'][2])   # the tethering post
 c.hline(cx, cx + 1, cy - 9, RAMPS['ash7'][6])
 for y, (a0, a1) in enumerate(((-2, 2), (-4, 4), (-5, 5), (-5, 5))):              # the grain heap
  for x in range(a0, a1 + 1): c.set(cx + 6 + x, cy - 1 + y, EAR[0] if y == 3 else EAR[3] if y == 0 or x < -2 else EAR[2] if x < 3 else EAR[1])
 soft_outline(c, LOESS[0], LOESS[2])
 return c.image()


GROUND = [
 lambda: hide(['#3e2c1d', '#6e5235', '#9b7a52', '#bfa074', '#dcc39a', '#ecdcbc']),
 lambda: hide(['#1d1714', '#2e241e', '#47382c', '#5f4b3a', '#7a644e', '#947e66']),
 lambda: spread(CHILI, 'chili'), lambda: spread(STRAW, 'grain'), lambda: spread(TURMERIC, 'root'),
]

WHITEWASH = ['#58564d', '#7f7c70', '#a6a294', '#c9c5b5', '#e2dfd0', '#f4f2e6']
VERMILION = '#c2402a'
GOLD = ['#5a4110', '#8a6a1c', '#b8922c', '#dcbc4a', '#f2dc84']


def canopy(c, cx, cy, rx, ry, seed, r=LEAF):
 """A crown as clumps, each lit on its upper left, so it reads as leaves
 and not as one green ball."""
 clumps = [(cx + cos(k * 2.4) * rx * .55 * (k % 3 + 1) / 3, cy + sin(k * 2.4) * ry * .5 * (k % 3 + 1) / 3,
            rx * .42, ry * .45) for k in range(9)]
 clumps.append((cx, cy, rx * .7, ry * .6))
 m = blob(c, clumps, r, rim=False)
 for k in range(40):
  j = jitter(k, seed)
  x, y = int(cx - rx + j % int(2 * rx)), int(cy - ry + (j * 7 + k) % int(2 * ry))
  if (x, y) in m and (x + 1, y + 1) in m and m[(x, y)] > 1:
   c.set(x, y, r[min(6, m[(x, y)] + 1)]); c.set(x + 1, y + 1, r[max(0, m[(x, y)] - 2)])
 return m


def trunk(c, cx, top, by, w, r=BARK):
 for y in range(top, by + 1):
  flare = max(0, (y - by + 4)) // 1
  for x in range(cx - w // 2 - flare, cx + w - w // 2 + flare):
   u = (x - cx + .5) / (w / 2 + flare)
   c.set(x, y, r[4 if u < -.4 else 3 if u < .3 else 2 if u < .75 else 1])
  if (y * 3) % 7 == 0: c.set(cx + (y % 3) - 1, y, r[1])


def tree_shrine():
 """A pipal on a plastered chabutra: threads wound round the trunk, a
 vermilion-daubed stone and a lamp at its foot."""
 c = Canvas(58, 64)
 cx, by = 29, 61
 band = lambda z, a, i: 1 if 1 < z < 2.2 else i
 lathe(c, cx, by, [(0, 27), (5, 27)], WHITEWASH)
 lathe(c, cx, by, [(0, 27), (2.2, 27)], [VERMILION] * 2 + WHITEWASH[2:], band)
 lathe(c, cx, by - 4, [(1, 20), (5, 20)], WHITEWASH)
 root = lambda z, a, i: i - (int(a * 4) % 3 == 0 and z < 6)
 thread = lambda z, a, i: i if not (14 < z < 19) else 9 + int(z) % 3
 cols = BARK + [None] * 3 + ['#d8c25a', '#d04a3a', '#ece4cc']
 m = lathe(c, cx, by - 9, [(0, 7), (4, 4.5), (24, 4), (30, 5)], cols[:6], root)
 for (x, y), (z, a) in m.items():
  if 13 < z < 18: c.set(x, y, ('#d8c25a', '#d04a3a', '#ece4cc')[int(z) % 3])
 canopy(c, cx, 20, 27, 17, 3)
 c.rim(LEAF)
 lathe(c, cx + 11, by - 9, [(0, 2.4), (2, 2), (3, 1)], ['#5a2010', '#8a3018', '#b8441c', '#d0602e', '#e8803a', '#f4a860'])
 lathe(c, cx - 10, by - 9, [(0, 1.6), (1, 1.6)], ['#5c3a20', '#7a5030', '#9b6a3e', '#b88452', '#d0a068', '#e8c088'])
 c.set(cx - 10, by - 11, '#ffd36a'); c.set(cx - 10, by - 12, '#fff2b0')
 return c.image()


def spirit_house():
 """A san phra phum: a little gilded house on a pillar, its roof seen from
 above like any house, marigolds and an offering bowl on its porch."""
 c = Canvas(30, 50)
 cx, by = 15, 49
 RED = ['#3a1410', '#5e1d16', '#8a2a20', '#a8382a', '#c44a34', '#dc6a48']
 block(c, cx - 8, by, 17, 3, 10, WHITEWASH)
 block(c, cx - 2, by - 3, 5, 18, 5, WHITEWASH)
 block(c, cx - 9, by - 20, 19, 2, 12, RED, top=lambda x, y, w, h: c.hline(x, x + w - 1, y + h - 1, GOLD[3]))
 block(c, cx - 6, by - 25, 13, 6, 6, ['#6e6450', '#a89a78', '#cdbf98', '#e2d6b2', '#efe3c0', '#faf2da'])
 c.rect(cx - 1, by - 29, cx + 1, by - 26, '#3a2416'); c.set(cx, by - 30, GOLD[4])
 eave, ridge = by - 31, by - 43
 for y in range(ridge - 3, eave + 1):
  near = y >= ridge
  inset = round((y - ridge) / (eave - ridge) * -3 + 3) if near else 3
  for x in range(cx - 10 + inset, cx + 11 - inset):
   i = (4 if near else 2) - ((y - ridge) % 3 == 2) - (x > cx + 6 - inset)
   c.set(x, y, RED[max(0, i)])
 c.hline(cx - 7, cx + 7, ridge - 1, GOLD[4]); c.hline(cx - 10, cx + 10, eave + 1, GOLD[2])
 for d in (-1, 1):
  c.set(cx + d * 8, ridge - 2, GOLD[4]); c.set(cx + d * 9, ridge - 3, GOLD[3])
  c.set(cx + d * 11, eave, GOLD[4]); c.set(cx + d * 12, eave - 1, GOLD[3])
 c.rim(RED)
 for x in range(cx - 8, cx + 9, 2): c.set(x, by - 19 + (x % 4 == 0), '#f0a028')
 c.set(cx - 5, by - 22, '#f4c040'); c.set(cx + 5, by - 22, '#e8f0f0')
 return c.image()


def shrine_tree():
 """An old shade tree kept as a shrine: cloth tied round it, pots of
 offerings and a low clay altar at its foot."""
 c = Canvas(58, 60)
 cx, by = 29, 57
 m = lathe(c, cx, by - 2, [(0, 9), (5, 6.5), (26, 6), (33, 8)], BARK, lambda z, a, i: i - (int(a * 4) % 3 == 0 and z < 7))
 for (x, y), (z, a) in m.items():
  if 12 < z < 15: c.set(x, y, '#ece4cc' if z < 13.5 else '#b9302a')
 canopy(c, cx, 18, 28, 16, 7)
 c.rim(LEAF)
 for x, y in ((cx - 15, by), (cx - 10, by + 1), (cx + 14, by)):
  lathe(c, x, y, [(0, 2), (2, 3.5), (4, 3), (5, 2)], RAMPS['terracotta7'][1:])
  disc(c, x, y - 5, 2, 1, RAMPS['terracotta7'][1])
 block(c, cx + 4, by, 7, 3, 6, MUD)
 c.set(cx + 6, by - 4, '#ece4cc'); c.set(cx + 8, by - 4, '#f2d673')
 return c.image()


def matzevah():
 """A Jewish gravestone: an upright slab with a rounded head, the
 inscription in lines, small stones left on top by visitors."""
 c = Canvas(18, 28)
 S = RAMPS['sandstone'][1:]
 block(c, 1, 27, 16, 2, 6, S)
 for y in range(4, 25):
  for x in range(3, 15):
   if y < 7 and ((x - 8.5) / 6) ** 2 + ((y - 7) / 3.5) ** 2 > 1: continue
   c.set(x, y, S[4] if x < 5 else S[3] if x < 13 else S[2])
 for y in range(9, 21, 2):
  for x in range(5, 13):
   if (x + y) % 4: c.set(x, y, S[1])
 c.hline(6, 11, 7, S[1])
 c.hline(5, 12, 3, S[5]); c.hline(4, 13, 4, S[4])
 c.rim(S)
 c.set(6, 3, RAMPS['granite'][5]); c.set(7, 3, RAMPS['granite'][3]); c.set(11, 2, RAMPS['limestone'][6])
 return c.image()


SACRED = [tree_shrine, spirit_house, shrine_tree, matzevah]


CHAR = ['#100c0c', '#1c1615', '#2a211f', '#3a2e2a', '#4e3f39', '#665650']
EMBER = '#7a3420'


def charred(c, x0, y0, x1, y1):
 """Burnt wood: alligator cracks in the char, the sheen on the lit side."""
 for y in range(y0, y1 + 1):
  for x in range(x0, x1 + 1):
   u = (x - x0) / max(1, x1 - x0)
   t = 4 if u < .3 else 3 if u < .7 else 2
   if (y - y0) % 3 == 0 and (x + (y // 3)) % 3 != 0: t -= 2
   if (x + y // 3 * 2) % 4 == 0: t -= 1
   c.set(x, y, CHAR[max(0, t)])


def charred_post(h):
 c = Canvas(12, h + 4)
 charred(c, 3, 4, 8, h + 2)
 for x, d in zip(range(3, 9), (0, 2, 1, 3, 0, 2)):
  for y in range(4, 4 + d): c.px.pop((x, y), None)
  c.set(x, 4 + d, CHAR[5] if x < 6 else CHAR[4])
  c.set(x, 3 + d, CHAR[4]) if d < 2 else None
 c.rim(CHAR)
 c.set(4, 8, EMBER); c.set(7, h - 2, EMBER)
 tufts(c, [(2, h + 3, 3), (9, h + 3, 2)])
 return c.image()


def charred_beam():
 c = Canvas(46, 14)
 def top(x, y, w, h):
  for xx in range(x, x + w):
   for yy in range(y, y + h): c.set(xx, yy, CHAR[5 - ((xx + yy * 2) % 5 == 0) * 2])
 def front(x, y, w, h):
  for xx in range(x, x + w):
   for yy in range(y, y + h): c.set(xx, yy, CHAR[3 - ((xx + (yy // 2) * 2) % 4 == 0) * 2])
 block(c, 2, 12, 41, 4, 8, CHAR, top, front)
 for x, d in zip(range(38, 43), (1, 3, 2, 5, 4)):
  for y in range(4, 4 + d): c.px.pop((x, y), None)
 c.rim(CHAR)
 c.set(20, 9, EMBER)
 tufts(c, [(6, 13, 2), (28, 13, 3)])
 return c.image()


def rubble(stone, frag=None, w=30, h=18, seed=1, charcoal=False):
 """Fallen stones in a heap: each one a little block with a lit top,
 laid from the back of the heap to the front."""
 c = Canvas(w, h)
 blob(c, [(w / 2, h - 4, w * .44, h * .3)], stone, rim=False)
 for row in range(4):
  by = h - 8 + row * 2 + (row == 3)
  span = (w * (.18 + row * .1))
  x = max(1, w / 2 - span)
  k = 0
  while x < w / 2 + span - 3:
   j = jitter(k, row, seed)
   bw = 3 + j % 3
   r = frag if frag and j % 4 == 0 else stone
   block(c, int(x), by - (3 - row) * 2 + 2 + j % 2, bw, 2 + (j // 3) % 2, 3 + j % 3, r)
   x += bw - (j % 2) + 1
   k += 1
 if charcoal:
  for k in range(8):
   j = jitter(k, 77)
   c.hline(5 + j % (w - 12), 6 + j % (w - 12) + j % 2, h - 3 - j % 5, CHAR[1 + j % 2])
 c.rim(stone)
 tufts(c, [(2, h - 1, 2), (w - 4, h - 1, 2)])
 return c.image()


def slumped(r, rammed=False):
 c = Canvas(48, 30)
 dd = 4
 for x in range(2, 46):
  top = 9 + round(6 * abs(sin(x / 6.5))) + (jitter(x) % 2)
  for y in range(top - dd, top):
   c.set(x, y, r[5 if y == top - dd else 4])
  for y in range(top, 28):
   t = 3 - (x > 41)
   if rammed and (y - 9) % 5 == 0: t -= 1
   if not rammed and y > top + 2 and (y % 4 == 0 or ((x + (y // 4) * 4) % 8 == 0)): t -= 1
   c.set(x, y, r[t])
  c.set(x, top, r[2])
 if rammed:
  for x in (10, 30): c.rect(x, 19, x + 1, 20, r[0])
 c.rim(r)
 for x in range(4, 44, 6):
  top = 9 + round(6 * abs(sin(x / 6.5))) - dd
  c.set(x, top - 1, GRASS[3]); c.set(x + 1, top - 2, GRASS[4]); c.set(x - 1, top, GRASS[2])
 for x in range(3, 45, 4): c.set(x, 28, r[3]); c.set(x + 1, 29, r[2])
 return c.image()


def column_drum():
 """A fluted column drum lying where it fell, its bed face towards us and
 its length running back."""
 c = Canvas(28, 34)
 M = RAMPS['limestone'][1:]
 cx, cy, R, dd = 14, 22, 10, 9
 for x in range(cx - R, cx + R + 1):
  u = (x + .5 - cx) / R
  if abs(u) > 1: continue
  v = (1 - u * u) ** .5
  for y in range(int(cy - dd - R * v), int(cy + R * v) + 1):
   c.set(x, y, M[3 - (u > .2) - (u > .65) + (u < -.45) - int((u + 1) * 8) % 2])
 for y in range(cy - R, cy + R + 1):
  for x in range(cx - R, cx + R + 1):
   d = hypot(x + .5 - cx, y + .5 - cy)
   if d > R: continue
   a = atan2(y + .5 - cy, x + .5 - cx)
   if d > R - 1.3 and int((a + pi) * 20 / (2 * pi)) % 2: c.set(x, y, M[1]); continue
   c.set(x, y, M[5] if (x - cx) + (y - cy) < -R * .7 else M[4] if (x - cx) + (y - cy) < R * .3 else M[3])
 c.set(cx, cy, M[2]); c.set(cx + 1, cy, M[1]); c.line((cx - 4, cy + 3), (cx - 1, cy + 6), M[2])
 c.rim(M)
 tufts(c, [(3, 33, 3), (24, 33, 3), (14, 33, 1)])
 return c.image()


RUIN = [
 lambda: charred_post(32), lambda: charred_post(14), charred_beam,
 lambda: rubble(RAMPS['sandstone'][1:], RAMPS['tile'][1:], 30, 18, 1),
 lambda: rubble(MUD, None, 30, 18, 2),
 lambda: slumped(MUD), lambda: slumped(LOESS, rammed=True),
 lambda: rubble(['#3c3a36', '#56534c', '#757067', '#959086', '#b3ada2', '#cdc8bd'], RAMPS['tile'][1:], 28, 17, 3, charcoal=True),
 column_drum,
]


WATER = RAMPS['water'][1:]


def mud_trough():
 c = Canvas(34, 18)
 def top(x, y, w, h):
  c.rect(x + 2, y + 1, x + w - 3, y + h - 1, WATER[2]); c.hline(x + 2, x + w - 3, y + 1, MUD[2])
  c.hline(x + 4, x + 9, y + 3, WATER[4]); c.set(x + 14, y + 4, WATER[5])
 block(c, 2, 16, 30, 5, 14, MUD, top)
 c.rim(MUD)
 tufts(c, [(1, 17, 2), (30, 17, 3)])
 return c.image()


def roller():
 c = Canvas(40, 20)
 G = RAMPS['granite'][1:]
 log_x(c, 5, 26, 17, 6, G, lambda x, y, v, i: i - (y % 3 == 0))
 for x in (3, 27): c.vline(x, 9, 15, BARK[3]); c.vline(x + 1, 9, 15, BARK[1])
 c.line((28, 11), (38, 6), BARK[4]); c.line((28, 12), (38, 7), BARK[2])
 c.line((2, 11), (-1, 9), BARK[4])
 c.rim(G)
 tufts(c, [(2, 19, 2), (30, 19, 2)])
 return c.image()


def water_jar():
 c = Canvas(26, 33)
 r = RAMPS['terracotta7'][1:]
 lathe(c, 13, 31, [(0, 5), (4, 9), (12, 10), (18, 8), (21, 5.5), (23, 6)], r)
 disc(c, 13, 5, 6, 3, r[1]); disc(c, 13, 5.6, 4.6, 2.2, WATER[2])
 c.hline(10, 13, 5, WATER[4]); c.hline(8, 18, 2, r[5])
 c.rim(r)
 tufts(c, [(3, 32, 2), (22, 32, 2)])
 return c.image()


def pergola():
 """Bamboo posts and a flat roof of gourd vine, seen from above, the
 gourds hanging under its front edge."""
 c = Canvas(52, 44)
 for x in (8, 42): c.vline(x, 14, 22, BAMBOO[2])
 m = blob(c, [(26, 12, 25, 9), (12, 12, 12, 8), (40, 12, 12, 8)], LEAF, rim=False)
 for k in range(70):
  j = jitter(k, 31)
  x, y = 2 + j % 48, 4 + (j * 3 + k) % 16
  if (x, y) in m and m[(x, y)] > 2: c.set(x, y, LEAF[min(6, m[(x, y)] + 1)]); c.set(x + 1, y + 1, LEAF[2])
 for x in (3, 47):
  c.vline(x, 18, 42, BAMBOO[4]); c.vline(x + 1, 18, 42, BAMBOO[2])
  for y in (26, 34): c.hline(x, x + 1, y, BAMBOO[1])
 c.rim(LEAF)
 G = ['#2e3a18', '#4a5a24', '#6e7e34', '#93a048', '#b6bf68', '#d4d890']
 for k, x in enumerate((11, 19, 27, 35, 41)):
  y = 22 + k % 2 * 3
  c.vline(x, 19, y - 4, LEAF[3])
  lathe(c, x, y + 4, [(0, 1.5), (2, 2.5), (5, 2), (7, 1)], G)
 tufts(c, [(2, 43, 2), (46, 43, 2)])
 return c.image()


def frond(c, x, y, ang, ln, r, droop=.06, torn=False):
 for k in range(ln):
  px, py = x + cos(ang) * k, y + sin(ang) * k + droop * k * k * .5
  a = atan2(sin(ang) + droop * k, cos(ang))
  c.set(int(px), int(py), r[4 if k < ln * .6 else 3])
  if k > 2:
   for side in (-1, 1):
    if torn and (k + side) % 4 == 0: continue
    qa = a + side * 1.2
    for t in range(1, 3 + (k < ln * .7)):
     c.set(int(px + cos(qa) * t), int(py + sin(qa) * t + t * .5), r[5 if sin(qa) < 0 else 2])


def banana():
 c = Canvas(40, 48)
 lathe(c, 20, 46, [(0, 3.5), (20, 2.8), (24, 2.5)], ['#2a3a18', '#3e5524', '#57722f', '#729140', '#90ad55', '#b3c978'], flat=False)
 big = ['#14301a', '#1e4622', '#2c612a', '#3d7c32', '#55983e', '#7bb453', '#a5cf78']
 for ang, ln in ((-2.6, 17), (-.6, 17), (-2.0, 14), (-1.1, 14), (-1.57, 11), (-3.0, 12), (-.2, 12)):
  frond(c, 20, 22, ang, ln + 3, big, droop=.035, torn=True)
 c.rim(big)
 disc(c, 22, 30, 1.6, 2.4, '#5e2a3a'); c.set(21, 29, '#8e4a5a')
 tufts(c, [(14, 47, 2), (25, 47, 2)])
 return c.image()


def tulsi():
 """A tulsi vrindavan: the household's holy basil growing from a painted
 plinth, a lamp in its niche."""
 c = Canvas(20, 34)
 def niche(x, y, w, h):
  c.rect(x + 5, y + 4, x + w - 6, y + 9, '#4a2a1a'); c.set(x + w // 2, y + 7, '#ffd36a'); c.set(x + w // 2, y + 6, '#fff2b0')
  c.hline(x, x + w - 1, y + 1, VERMILION); c.hline(x, x + w - 1, y + h - 2, VERMILION)
 block(c, 2, 32, 16, 14, 10, WHITEWASH, front=niche)
 m = blob(c, [(10, 13, 6, 5), (7, 11, 4, 4), (13, 10, 4, 4), (10, 7, 3.5, 3.5)], ['#1a2a16', '#25401f', '#335a28', '#467332', '#5e8e3c', '#80a85a'])
 for x, y in [(8, 6), (12, 8), (6, 10), (14, 12)]: c.set(x, y, '#7a4a7a')
 c.rim(WHITEWASH)
 return c.image()


def cuezcomatl():
 """A cuezcomatl: a granary of mud-plastered wattle like a great jar, on a
 stone footing, its mouth under a thatched cap."""
 c = Canvas(30, 50)
 S = RAMPS['granite'][1:]
 lathe(c, 15, 48, [(0, 11), (4, 11)], S, lambda z, a, i: i - (int(a * 4 + z) % 3 == 0))
 lathe(c, 15, 44, [(0, 7), (6, 11), (14, 12), (22, 9), (26, 6), (27, 6.5)], LOESS, z0=0)
 lathe(c, 15, 44, [(25, 9), (27, 9), (31, 6), (35, 3), (38, 1)], OLD_STRAW,
       lambda z, a, i: i - (int(a * 9) % 3 == 0), flat=False)
 c.rim(LOESS)
 return c.image()


def date_palm():
 c = Canvas(56, 70)
 cx, by = 28, 68
 T = ['#2a2018', '#43342a', '#5e4a38', '#7a624a', '#97805e', '#b39c76']
 lathe(c, cx, by, [(0, 4), (4, 3), (44, 2.6)], T, lambda z, a, i: i - ((int(z) + int(a * 3)) % 3 == 0), flat=False)
 F = ['#1f2d1c', '#2c4426', '#3d5d30', '#517a3a', '#6c9648', '#90b264']
 ty = by - 46
 for ang in (-3.0, -2.6, -2.2, -1.8, -1.4, -1.0, -.6, -.15, 3.3, 3.6):
  frond(c, cx, ty, ang, 18 + int(abs(sin(ang * 3)) * 4), F, droop=.07)
 for dx in (-4, 3):
  for k in range(6):
   c.set(cx + dx + k % 2, ty + 3 + k, '#c8742a' if k % 2 else '#e0963a')
 c.rim(F)
 tufts(c, [(cx - 5, by + 1, 2), (cx + 4, by + 1, 2)])
 return c.image()


YARD = [mud_trough, roller, water_jar, pergola, banana, tulsi, cuezcomatl, date_palm]


def _draw_log_stack(c, rows, birch, oak, walnut, shadow_top=False):
 min_x = min(lx for _, logs in rows for lx, _ in logs)
 max_x = max(lx + lw for _, logs in rows for lx, lw in logs)
 min_y = min(ry for ry, _ in rows)
 max_y = max(ry for ry, _ in rows) + 5
 for y in range(min_y + 1, max_y):
  for x in range(min_x + 1, max_x - 1):
   c.set(x, y, walnut[1])
 for r_idx, (ry, logs) in enumerate(rows):
  for l_idx, (lx, lw) in enumerate(logs):
   heart = birch if (r_idx + l_idx) % 3 != 0 else oak
   for dy in range(5):
    for dx in range(lw):
     if (dx == 0 or dx == lw - 1) and (dy == 0 or dy == 4):
      continue
     if shadow_top and r_idx == 0 and dy <= 1:
      col = walnut[1] if dy == 0 else walnut[2]
     elif dy == 0:
      col = walnut[4] if dx < lw - 1 else walnut[2]
     elif dy == 4:
      col = walnut[1]
     elif dx == 0:
      col = walnut[3]
     elif dx == lw - 1:
      col = walnut[2]
     elif shadow_top and r_idx == 0 and dy == 2:
      col = oak[3]
     else:
      col = heart[5] if (dy == 1 and dx <= lw // 2) else (heart[4] if dy <= 2 else heart[3])
      if dy == 2 and dx == lw // 2:
       col = oak[2]
     c.set(lx + dx, ry + dy, col)


def woodpile_cordwood():
 oak, walnut, birch = RAMPS['oak7'], RAMPS['walnut7'], RAMPS['birch7']
 c = Canvas(48, 30)
 for sx in (3, 43):
  for y in range(8, 27):
   c.set(sx, y, walnut[4]); c.set(sx + 1, y, walnut[2])
  c.set(sx, 7, walnut[5]); c.set(sx + 1, 7, walnut[3])
 for y in range(7, 12):
  for x in range(6, 42):
   if (y == 7 and (x < 9 or x > 38 or x in (20, 21))) or (y == 8 and (x < 7 or x > 40)):
    continue
   tone = walnut[5] if y == 7 else (walnut[4] if y == 8 else (walnut[3] if y == 9 else (walnut[2] if y == 10 else walnut[1])))
   if (x + y * 3) % 8 == 0: tone = walnut[2]
   c.set(x, y, tone)
 rows = [
  (12, [(6, 6), (12, 5), (17, 7), (24, 6), (30, 5), (35, 7)]),
  (17, [(5, 7), (12, 6), (18, 5), (23, 7), (30, 6), (36, 6)]),
  (22, [(6, 6), (12, 7), (19, 6), (25, 5), (30, 7), (37, 5)]),
 ]
 _draw_log_stack(c, rows, birch, oak, walnut)
 for cx, cy in [(10, 27), (16, 28), (28, 28), (34, 27)]:
  c.set(cx, cy, birch[5]); c.set(cx + 1, cy, oak[3])
 soft_outline(c, walnut[0], oak[2])
 return c.image()


def woodpile_rack():
 oak, walnut, birch, cedar = RAMPS['oak7'], RAMPS['walnut7'], RAMPS['birch7'], RAMPS['cedar7']
 c = Canvas(50, 36)
 for sx in (4, 43):
  for y in range(11, 33):
   c.set(sx, y, walnut[4]); c.set(sx + 1, y, walnut[2])
 rows = [
  (16, [(7, 6), (13, 6), (19, 5), (24, 7), (31, 6), (37, 5)]),
  (21, [(6, 6), (12, 7), (19, 6), (25, 6), (31, 5), (36, 6)]),
  (26, [(7, 7), (14, 5), (19, 7), (26, 6), (32, 6), (38, 4)]),
 ]
 _draw_log_stack(c, rows, birch, oak, walnut, shadow_top=True)
 for y in range(4, 15):
  for x in range(2, 48):
   course = (y - 4) // 3
   seam = (x + (course % 2) * 3) % 6 == 0
   if y == 4: col = cedar[6] if x < 25 else cedar[4]
   elif y == 14: col = cedar[1]
   elif y == 13: col = cedar[4] if not seam else cedar[2]
   else:
    base = (4 if y < 9 else 3) - (1 if x > 34 else 0)
    col = cedar[max(1, base - 1)] if seam else cedar[base]
   c.set(x, y, col)
 soft_outline(c, walnut[0], cedar[2])
 return c.image()


def woodpile_faggots():
 oak, walnut, birch, rope = RAMPS['oak7'], RAMPS['walnut7'], RAMPS['birch7'], RAMPS['rope']
 c = Canvas(48, 30)
 for bx, by, bw, bh in [(14, 19, 17, 5), (31, 19, 17, 5), (22, 12, 18, 5)]:
  hw = bw // 2
  for dy in range(-bh, bh + 1):
   for dx in range(-hw, hw + 1):
    if (abs(dy) == bh and abs(dx) < 3) or (abs(dy) >= bh - 1 and abs(dx) > hw - 1):
     continue
    px, py = bx + dx, by + dy
    stripe = (py * 3 + (px // 3)) % 3
    if abs(dx) >= hw - 1:
     col = birch[5] if (dy < 0 and py % 2 == 0) else (oak[4] if dy <= 1 else walnut[2])
    elif dy <= -2:
     col = oak[5] if stripe == 0 else oak[4]
    elif dy <= 1:
     col = oak[4] if stripe == 0 else (walnut[4] if stripe == 1 else walnut[3])
    else:
     col = walnut[2] if stripe == 0 else walnut[1]
    c.set(px, py, col)
  for cx_off in (-1, 1):
   for dy in range(-bh + 1, bh):
    c.set(bx + cx_off, by + dy, rope[3] if dy < 0 else (rope[2] if dy < 2 else rope[0]))
 soft_outline(c, walnut[0], oak[2])
 return c.image()


FAMILIES = {
 'woodpile': [woodpile_cordwood, woodpile_rack, woodpile_faggots],
 'hay-rick': [straw_cone, rick, stooks],
 'dung-stack': [bitaura, dung_cakes],
 'mud-bricks': [mud_bricks, lambda: mud_bricks(LOESS)],
 'threshing-floor': [threshing_floor],
}
SETS = {'lot-store': STORE, 'lot-drying': DRYING, 'lot-ground': GROUND, 'lot-sacred': SACRED, 'lot-ruin': RUIN, 'lot-yard': YARD, **FAMILIES}
LOTS = {key: (lambda v, layer=None, key=key: SETS[key][v]()) for key in SETS}
