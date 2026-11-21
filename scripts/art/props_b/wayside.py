"""Things that stand by a road, in a yard or at a field's edge, drawn to the
figure: about 17 px to the metre. Placed pixel by rule, as props_b/stores.py
is: a lit band, a core shadow, a dark keyline. Variants are different objects
for different countries, not recolours.
"""
from math import sin, pi, sqrt
from .core import Canvas, RAMPS, soft_outline
from .solid import K, disc, lathe, bench_34
from .stores import INK, WOOD, IRON, SACK, STRAW, LEAF, BLOOMS

STONE = ['#3b3a33', '#6a685c', '#96937f', '#bdb9a2', '#ddd9c2']
MOSS = '#5d7a3a'
RED = ['#5a1a14', '#8e2a1e', '#c0432c', '#e0714a']
STRAW7 = ['#362812', '#523d1b', '#735726', '#967434', '#ba9447', '#dbb660', '#f2d680']
OLD_STRAW7 = ['#2f2618', '#473b25', '#635334', '#826e46', '#a18b5b', '#bfa975', '#d9c594']


def _dome(c, cx, top, bottom, half, ramp, band=2, stretch=1.0):
 """A coiled or stacked dome: tone by position across, a dark row between
 coils, so it reads as rope laid on rope."""
 rows = bottom - top
 for y in range(top, bottom + 1):
  t = (y - top) / rows
  h = half * sin(min(t * 1.15, 1.0) * pi / 2) ** (0.75 * stretch)
  for x in range(int(cx - h), int(cx + h) + 1):
   u = (x + .5 - cx) / max(h, .5)
   if abs(u) > 1: continue
   tone = 3 if u < -0.55 else 2 if u < 0.25 else 1
   if -0.5 < u < -0.2 and t < 0.75: tone = 3
   if (y - top) % band == band - 1: tone = max(0, tone - 1)
   c.set(x, y, ramp[tone])


def beehive(v=0, frame=0):
 """0 coiled straw skep, 1 skep under a straw hackle cloak, 2 stacked box hive."""
 c = Canvas(32, 32)
 cx = 15.5
 oak = RAMPS['oak7']
 walnut = RAMPS['walnut7']
 wood = RAMPS[['oak7', 'walnut7', 'ash7'][v % 3]]
 rope = RAMPS['rope']

 if v % 3 == 2:
  bench_34(c, cx, 21, 10, 3, walnut)
  box_pals = [
   ['#423c34', '#665e52', '#8c8272', '#b3a896', '#d4cab8', '#ede4d4', '#fcf8f0'],
   ['#3a3828', '#5c583e', '#827c58', '#a8a076', '#c8c096', '#e4dcb6', '#f7f2d4'],
   ['#2c3844', '#46586a', '#647c92', '#88a0b6', '#acc2d4', '#cce0ee', '#eaf4fc'],
  ]
  box_pal = box_pals[(v // 3) % len(box_pals)]
  for by0, bh in ((16, 7), (10, 6)):
   hw = 9
   for y in range(by0, by0 + bh):
    for x in range(int(cx - hw), int(cx + hw) + 1):
     u = (x + 0.5 - cx) / hw
     if y == by0:
      col = box_pal[6] if u < 0.25 else box_pal[5]
     elif y == by0 + bh - 1:
      col = box_pal[1]
     else:
      col = box_pal[5] if u < -0.35 else (box_pal[4] if u < 0.35 else box_pal[3])
     if (x in (int(cx - hw), int(cx - hw) + 1) or x in (int(cx + hw) - 1, int(cx + hw))) and (y - by0) % 2 == 1:
      col = oak[4] if x < cx else oak[2]
     c.set(x, y, col)
   for x in range(int(cx - 3), int(cx + 3) + 1):
    c.set(x, by0 + 2, box_pal[2]); c.set(x, by0 + 3, box_pal[6])

  roof_pal = RAMPS['copper7'] if (v // 3) % 2 == 0 else RAMPS['pewter7']
  for dy in range(6):
   y = 4 + dy
   inset = (5 - dy) // 2
   hw = 10 - inset
   for x in range(int(cx - hw), int(cx + hw) + 1):
    u = (x + 0.5 - cx) / max(1, hw)
    if dy == 0:
     col = roof_pal[6] if u < 0.3 else roof_pal[5]
    elif dy == 5:
     col = roof_pal[1]
    else:
     col = roof_pal[5] if u < -0.2 else (roof_pal[4] if u < 0.35 else roof_pal[3])
    c.set(x, y, col)
  for x in range(int(cx - 4), int(cx + 4) + 1):
   c.set(x, 22, '#18120e')
   c.set(x, 23, walnut[5] if x < cx else walnut[3])
  soft_outline(c, walnut[0], box_pal[3])
 else:
  bench_34(c, cx, 21, 10, 3, wood)
  skep_top, skep_bot = 8, 21
  max_rx = 8.5
  straw = STRAW7 if (v // 3) % 2 == 0 else OLD_STRAW7
  for x in range(int(cx - max_rx) - 1, int(cx + max_rx) + 2):
   for y in range(skep_top, skep_bot + 4):
    t = max(0.0, min(1.0, (y - skep_top) / (skep_bot - skep_top)))
    rx = 1.5 + (max_rx - 1.5) * (sin(min(1.0, t * 1.05) * pi / 2) ** 0.82)
    ry = rx * 0.38
    u = (x + 0.5 - cx) / rx
    if abs(u) > 1.0:
     continue
    y_arc_bot = skep_bot + (max_rx * 0.36) * sqrt(max(0.0, 1.0 - ((x + 0.5 - cx) / max_rx) ** 2))
    if y > round(y_arc_bot):
     continue
    coil_y = y - ry * sqrt(max(0.0, 1.0 - u * u)) * 0.65
    coil_phase = (coil_y - skep_top) % 3.0
    base_t = 5 if u < -0.35 else (4 if u < 0.28 else (3 if u < 0.72 else 2))
    if coil_phase < 0.9:
     tone = min(6, base_t + 1)
    elif coil_phase > 2.1:
     tone = max(1, base_t - 2)
    else:
     tone = base_t
     if (x + int((coil_y - skep_top) // 3) * 2) % 4 == 0:
      tone = min(6, tone + 1) if u < 0 else max(1, tone - 1)
    if y == round(y_arc_bot):
     tone = max(1, tone - 1)
    c.set(x, y, straw[tone])

  if v % 3 == 0:
   c.set(int(cx) - 1, skep_top - 1, straw[6]); c.set(int(cx), skep_top - 1, straw[4])
   c.set(int(cx), skep_top - 2, straw[5])
  else:
   h_top, h_bot = 3, 14
   for y in range(h_top, h_bot + 2):
    t = max(0.0, min(1.0, (y - h_top) / (h_bot - h_top)))
    rx = 1.2 + t * 9.6
    ry = rx * 0.34
    for x in range(int(cx - rx), int(cx + rx) + 1):
     u = (x + 0.5 - cx) / rx
     if abs(u) > 1.0:
      continue
     yc = round(y + ry * sqrt(max(0.0, 1.0 - u * u)) * 0.55)
     if yc > h_bot + 2:
      continue
     tone = 6 if u < -0.38 else (5 if u < 0.15 else (3 if u < 0.65 else 2))
     if (x * 5 + y) % 3 == 0:
      tone = max(1, tone - 1)
     if y == h_bot:
      tone = 5 if (x % 2 == 0 and u < 0.3) else 1
     c.set(x, yc, OLD_STRAW7[tone])
   for dx in range(-3, 4):
    c.set(int(cx) + dx, h_top + 2 + (1 if abs(dx) < 2 else 0), rope[3 if dx < 0 else 1])
   c.set(int(cx), h_top - 1, OLD_STRAW7[5])

  for dx in range(-2, 3):
   c.set(int(cx) + dx, 20, '#18120c')
   if abs(dx) <= 1:
    c.set(int(cx) + dx, 19, '#241a10')
   c.set(int(cx) + dx, 21, wood[6] if dx < 0 else wood[4])

  soft_outline(c, wood[0], straw[2])

 bee_orbits = [(5, 12, -1), (25, 10, 1), (4, 19, 1)]
 f = frame % 4
 offsets = [(0, 0), (1, -1), (2, 0), (1, 1)]
 for i, (bx0, by0, dir_s) in enumerate(bee_orbits):
  ox, oy = offsets[(f + i) % 4]
  bx, by_b = bx0 + ox * dir_s, by0 + oy
  c.set(bx, by_b, '#241808')
  c.set(bx + 1, by_b, '#f0c242')
  c.set(bx + (f % 2), by_b - 1, '#f7f4e8')
 return c.image()


def _stone_cairn(c, cx, stones, stone_ramp):
 for idx, (sx, sy, rx, ry) in enumerate(stones):
  s_col = stone_ramp if idx % 3 != 1 else RAMPS['limestone']
  for y in range(int(sy - ry) - 1, int(sy + ry) + 2):
   for x in range(int(sx - rx) - 1, int(sx + rx) + 2):
    u = (x + 0.5 - sx) / rx
    v_el = (y + 0.5 - sy) / ry
    if u * u + v_el * v_el > 1.0:
     continue
    lit = -u * 0.65 - v_el * 0.75
    tone = 6 if lit > 0.45 else (5 if lit > 0.08 else (4 if lit > -0.28 else (3 if lit > -0.62 else 2)))
    if v_el > 0.52 or u > 0.62:
     tone = 1
    c.set(x, y, s_col[tone])


def _stepped_plinth_34(c, cx, base_y, tiers, st):
 """Draw a 3/4 rectangular stepped stone plinth with a 3px curved base drop
 so the front face reads with crisp liturgical steps without failing flat-bottom checks."""
 for hw, top_y, bot_y in tiers:
  for x in range(int(cx - hw), int(cx + hw) + 1):
   u = (x + 0.5 - cx) / max(1, hw)
   drop = round(2.2 * sqrt(max(0.0, 1.0 - u * u)))
   for y in range(top_y, bot_y + drop + 1):
    if y == top_y:
     tone = 6 if u < 0.25 else 5
    elif y == top_y + 1:
     tone = 5 if u < 0.0 else 4
    elif y >= bot_y + drop:
     tone = 1
    else:
     tone = 4 if u < -0.35 else (3 if u < 0.35 else 2)
    c.set(x, y, st[tone])


def waymark(v=0):
 """What stands where roads meet: a fingerpost, a wayside cross, a milestone,
 a cairn, a brick kos minar, or a carved stone road stela."""
 c = Canvas(26, 40)
 oak = RAMPS['oak7']
 walnut = RAMPS['walnut7']
 granite = RAMPS['granite']
 sand = RAMPS['sandstone']
 lime = RAMPS['limestone']
 terra = RAMPS['terracotta7']
 iron = RAMPS['blackiron7']
 moss = ['#2a421c', '#42662c', '#628e42']

 kind = v % 6
 if kind == 0:                                       # fingerpost
  wood = oak if (v // 6) % 2 == 0 else walnut
  board = ['#524838', '#786c56', '#a29478', '#c8bc9e', '#e4dac2', '#f7f2e4']
  lathe(c, 12.5, 37, [(0, 4.8), (2.5, 4.2), (4.5, 3.0)], lime)
  for y in range(8, 35):
   c.set(11, y, wood[5]); c.set(12, y, wood[4]); c.set(13, y, wood[2]); c.set(14, y, wood[1])
   if y % 6 == 2:
    c.set(12, y, wood[3])
  c.hline(10, 15, 7, wood[5]); c.hline(10, 15, 8, wood[2])
  c.hline(11, 14, 6, wood[6]); c.set(12, 5, wood[6]); c.set(13, 5, wood[4])

  for dy in range(5):
   y = 10 + dy
   x1 = 22 + (2 - abs(dy - 2))
   for x in range(13, x1 + 1):
    col = board[5] if dy == 0 else (board[1] if dy == 4 else (board[4] if x < 19 else board[3]))
    c.set(x, y, col)
  for x in (15, 17, 19, 21):
   c.set(x, 12, wood[1])

  for dy in range(5):
   y = 17 + dy
   x0 = 3 - (2 - abs(dy - 2))
   for x in range(x0, 13):
    col = board[5] if dy == 0 else (board[1] if dy == 4 else (board[4] if x < 8 else board[3]))
    c.set(x, y, col)
  for x in (4, 6, 8, 10):
   c.set(x, 19, wood[1])

  for y in (11, 13, 18, 20):
   c.set(12, y, iron[4]); c.set(13, y, iron[2])
  soft_outline(c, wood[0], wood[3])
  c.set(9, 37, moss[1]); c.set(10, 37, moss[2]); c.set(16, 37, moss[0])
 elif kind == 1:                                     # stone wayside cross on 3-step 3/4 plinth
  st = lime if (v // 6) % 2 == 0 else granite
  _stepped_plinth_34(c, 12.5, 36, [(8, 33, 36), (6, 30, 32), (4, 27, 29)], st)
  for y in range(6, 28):
   c.set(11, y, st[6] if y < 16 else st[5])
   c.set(12, y, st[4])
   c.set(13, y, st[3])
   c.set(14, y, st[2])
  c.hline(11, 14, 5, st[6])
  for y in range(11, 15):
   for x in range(5, 21):
    if y == 11: col = st[6] if x < 15 else st[5]
    elif y == 14: col = st[1]
    else: col = st[5] if x < 10 else (st[4] if x < 16 else st[2])
    c.set(x, y, col)
  c.rect(12, 12, 13, 13, st[2]); c.set(12, 12, st[5])
  soft_outline(c, st[0], st[3])
  for mx, my in ((6, 36), (7, 37), (17, 36), (8, 32)):
   c.set(mx, my, moss[2 if mx < 12 else 1])
 elif kind == 2:                                     # milestone
  st = lime if (v // 6) % 2 == 0 else sand
  _stepped_plinth_34(c, 12.5, 36, [(6, 33, 36)], st)
  for y in range(15, 34):
   dy_top = y - 15
   hw = 3 if dy_top == 0 else (4 if dy_top == 1 else 5)
   for x in range(13 - hw, 13 + hw + 1):
    u = (x - 13.0) / max(1, hw)
    if dy_top == 0:
     tone = 6 if u < 0.3 else 5
    elif dy_top == 1:
     tone = 6 if u < -0.1 else (5 if u < 0.4 else 3)
    else:
     tone = 5 if u < -0.45 else (4 if u < 0.25 else (3 if u < 0.68 else 2))
     if (x * 5 + y * 3) % 11 == 0:
      tone = max(2, tone - 1)
    c.set(x, y, st[tone])
  for y in (21, 24, 28):
   for x in range(10, 16):
    if (x + y) % 2 == 0:
     c.set(x, y, st[2])
  soft_outline(c, st[0], st[3])
  for mx, my in ((7, 36), (8, 37), (17, 36)):
   c.set(mx, my, moss[2 if mx < 12 else 1])
 elif kind == 3:                                     # cairn with marker pole
  st = lime if (v // 6) % 2 == 0 else sand
  stones = [
   (8.5, 34.5, 4.4, 2.7), (16.5, 34.5, 4.6, 2.7), (12.5, 35.8, 4.8, 2.9),
   (9.5, 30.5, 4.0, 2.5), (15.5, 30.5, 4.0, 2.5), (12.5, 31.5, 4.4, 2.7),
   (10.8, 26.8, 3.6, 2.2), (14.5, 27.0, 3.5, 2.1),
   (12.5, 23.8, 3.2, 2.0), (12.5, 21.0, 2.4, 1.6),
  ]
  _stone_cairn(c, 12.5, stones, st)
  for y in range(7, 20):
   c.set(12, y, oak[5]); c.set(13, y, oak[2])
  c.hline(11, 14, 17, RAMPS['rope'][3]); c.hline(11, 14, 18, RAMPS['rope'][1])
  flag = ['#5a1a14', '#8e2a1e', '#c0432c', '#e87454']
  for dy in range(5):
   w_f = 6 - dy // 2
   for dx in range(w_f):
    c.set(14 + dx, 8 + dy + (dx // 3), flag[3] if dy == 0 or dx < 2 else (flag[2] if dx < 4 else flag[1]))
  soft_outline(c, st[0], st[3])
  c.set(7, 36, moss[1]); c.set(17, 36, moss[0])
 elif kind == 4:                                     # South Asian kos minar distance tower
  plaster = ['#5e5646', '#857b66', '#aba088', '#cfc5ae', '#e8e0cc', '#f6f1e2', '#fcfaf2']
  _stepped_plinth_34(c, 12.5, 36, [(9, 32, 36), (8, 28, 31)], terra)
  def kos_tex(z, a, i):
   if abs(z - 8.0) < 0.7 or abs(z - 16.0) < 0.7:
    return max(1, i - 2)
   if int(z) % 3 == 0 and int((a + pi) * 6) % 3 == 0:
    return max(1, i - 1)
   return i
  m = lathe(c, 12.5, 29, [(0, 6.6), (8, 5.4), (16, 4.0), (20, 2.2), (22, 0.8)], terra, kos_tex, flat=False)
  for (x, y), (z, a) in m.items():
   if 7.5 <= z <= 9.2 or 15.2 <= z <= 16.8:
    c.set(x, y, plaster[6] if a < -0.2 else (plaster[5] if a < 0.4 else plaster[3]))
  c.set(12, 6, plaster[6]); c.set(13, 6, plaster[4]); c.set(12, 5, '#f5d458')
  soft_outline(c, terra[0], terra[3])
  for mx, my in ((5, 36), (6, 37), (19, 36)):
   c.set(mx, my, moss[1])
 else:                                               # Carved stone road stela / wooden milepost
  st = sand if (v // 6) % 2 == 0 else granite
  _stepped_plinth_34(c, 12.5, 36, [(7, 32, 36), (5, 30, 31)], st)
  for y in range(8, 30):
   hw = 3 if y < 10 else 4
   for x in range(13 - hw, 13 + hw + 1):
    u = (x - 13.0) / max(1, hw)
    tone = 6 if y == 8 else (5 if u < -0.35 else (4 if u < 0.25 else 2))
    c.set(x, y, st[tone])
  for y in range(5, 8):
   hw = 5 if y in (6, 7) else 3
   for x in range(13 - hw, 13 + hw + 1):
    u = (x - 13.0) / max(1, hw)
    c.set(x, y, st[6 if y == 5 else (5 if u < 0.2 else 3)])
  c.rect(11, 11, 14, 15, '#8c2820')
  c.set(12, 12, '#f5d458'); c.set(13, 13, '#f5d458'); c.set(12, 14, '#f5d458')
  for y in range(18, 27, 2):
   c.set(12, y, st[2]); c.set(13, y, st[1])
  soft_outline(c, st[0], st[3])
 return c.image()


def wayside_shrine(v=0):
 """A small roadside shrine: a post shrine with a gabled niche, a plastered
 niche on a plinth, a stone lantern, a flagged cairn, a South Asian tree/lamp
 chabutra, or a tiny East Asian tiled hokora shrine."""
 c = Canvas(28, 42)
 oak = RAMPS['oak7']
 walnut = RAMPS['walnut7']
 granite = RAMPS['granite']
 sand = RAMPS['sandstone']
 lime = RAMPS['limestone']
 terra = RAMPS['terracotta7']
 iron = RAMPS['blackiron7']
 moss = ['#2a421c', '#42662c', '#628e42']

 kind = v % 6
 if kind == 0:                                       # Bildstock: gabled niche on a braced post
  wood = oak if (v // 6) % 2 == 0 else walnut
  plaster = ['#5e5646', '#857b66', '#aba088', '#cfc5ae', '#e8e0cc', '#f6f1e2', '#fcfaf2']
  _stepped_plinth_34(c, 13.5, 38, [(5, 35, 38)], lime)
  for y in range(20, 36):
   c.set(12, y, wood[5]); c.set(13, y, wood[4]); c.set(14, y, wood[2]); c.set(15, y, wood[1])
  for i in range(4):
   c.set(10 + i, 21 + i, wood[5]); c.set(10 + i, 22 + i, wood[3])
   c.set(17 - i, 21 + i, wood[3]); c.set(17 - i, 22 + i, wood[1])
  for x in range(7, 21):
   c.set(x, 19, wood[6] if x < 15 else wood[4])
   c.set(x, 20, wood[3] if x < 15 else wood[1])
  for y in range(10, 19):
   for x in range(8, 20):
    c.set(x, y, plaster[6] if x < 10 else (plaster[3] if x > 17 else plaster[5]))
  for y in range(11, 19):
   for x in range(10, 18):
    if y == 11 and (x in (10, 17)): continue
    c.set(x, y, '#1c2838' if y < 13 or x in (10, 17) else '#2e4664')
  c.rect(13, 13, 14, 17, '#e0b24c'); c.set(13, 12, '#fff0ad'); c.set(14, 12, '#e0b24c')
  c.set(13, 14, '#c94a38'); c.set(14, 15, '#e87454')
  c.set(11, 17, '#ff9e38'); c.set(11, 16, '#fff6bf')
  for dy in range(7):
   y = 4 + dy
   hw = 1 + dy
   for x in range(13 - hw, 15 + hw):
    u = (x - 13.5) / max(1, hw)
    tone = 6 if dy == 0 else (5 if u < -0.15 else (4 if u < 0.35 else 2))
    if dy % 2 == 1 and 0 < dy < 6:
     tone = max(1, tone - 1)
    c.set(x, y, terra[tone])
  c.hline(6, 21, 10, terra[1])
  c.vline(13, 1, 3, iron[5]); c.vline(14, 1, 3, iron[2]); c.hline(12, 15, 2, iron[5])
  for bx, col in ((9, '#e85d4a'), (11, '#f5d458'), (16, '#e87a98'), (18, '#f5d458')):
   c.set(bx, 18, col); c.set(bx, 19, moss[2])
  soft_outline(c, wood[0], wood[3])
 elif kind == 1:                                     # plastered aedicula on curved masonry plinth
  plaster = ['#5e5646', '#857b66', '#aba088', '#cfc5ae', '#e8e0cc', '#f6f1e2', '#fcfaf2']
  _stepped_plinth_34(c, 13.5, 38, [(8, 35, 38), (7, 28, 34)], sand)
  c.hline(7, 20, 28, terra[4]); c.hline(7, 20, 29, terra[2])
  for y in range(12, 28):
   for x in range(7, 21):
    u = (x - 13.5) / 7.0
    col = plaster[6] if u < -0.45 else (plaster[5] if u < 0.25 else (plaster[4] if u < 0.65 else plaster[2]))
    c.set(x, y, col)
  for y in range(15, 28):
   for x in range(10, 18):
    if y == 15 and x in (10, 17): continue
    if y == 16 and x in (10, 17):
     c.set(x, y, plaster[3]); continue
    c.set(x, y, '#261816' if (x in (10, 17) or y < 17) else '#422822')
  c.rect(13, 18, 14, 24, '#e0b24c'); c.set(13, 17, '#fff0ad'); c.set(14, 17, '#e0b24c')
  c.rect(13, 20, 14, 23, '#3b6ea6'); c.set(13, 21, '#c94a38')
  c.set(11, 26, '#c87a28'); c.set(12, 26, '#ff9e38'); c.set(11, 25, '#fff6bf')
  c.set(16, 26, '#e85d4a'); c.set(15, 27, moss[2])
  for dy in range(7):
   y = 6 + dy
   hw = 2 + dy
   for x in range(13 - hw, 15 + hw):
    u = (x - 13.5) / max(1, hw)
    tone = 6 if dy == 0 else (5 if u < -0.1 else (4 if u < 0.4 else 2))
    if (x + dy) % 3 == 0 and dy < 6:
     tone = max(1, tone - 1)
    c.set(x, y, terra[tone])
  c.hline(5, 22, 12, terra[1])
  c.vline(13, 3, 5, iron[5]); c.hline(12, 14, 4, iron[5])
  soft_outline(c, sand[0], plaster[3])
 elif kind == 2:                                     # Japanese stone tōrō lantern
  st = lime if (v // 6) % 2 == 0 else sand
  _stepped_plinth_34(c, 13.5, 38, [(6, 35, 38), (4, 33, 34)], st)
  for y in range(23, 33):
   c.set(11, y, st[5]); c.set(12, y, st[4]); c.set(13, y, st[4]); c.set(14, y, st[3]); c.set(15, y, st[2])
  c.hline(10, 16, 28, st[6]); c.hline(10, 16, 29, st[2])
  _stepped_plinth_34(c, 13.5, 22, [(6, 20, 22)], st)
  for y in range(14, 21):
   for x in range(9, 19):
    c.set(x, y, st[5] if x < 11 else (st[2] if x > 16 else st[4]))
  for y in range(15, 20):
   for x in range(11, 17):
    c.set(x, y, '#2b1d12')
  c.rect(12, 16, 15, 19, '#e89a2e')
  c.rect(13, 16, 14, 18, '#ffd86b')
  c.set(13, 17, '#fff8cc')
  c.vline(13, 15, 19, st[5]); c.vline(14, 15, 19, st[2])
  for dy in range(7):
   y = 8 + dy
   flare = 1 if dy == 6 else 0
   hw = 2 + dy + flare
   for x in range(13 - hw, 15 + hw):
    u = (x - 13.5) / max(1, hw)
    tone = 6 if dy <= 1 else (5 if u < -0.15 else (4 if u < 0.38 else (3 if u < 0.72 else 2)))
    if dy == 6:
     tone = 6 if u < -0.6 else (5 if abs(u) > 0.75 else 2)
    c.set(x, y, st[tone])
  c.set(4, 13, st[6]); c.set(23, 13, st[4])
  c.rect(12, 5, 15, 7, st[4]); c.set(12, 6, st[6]); c.set(13, 4, st[6]); c.set(14, 4, st[4])
  soft_outline(c, st[0], st[3])
  for mx, my in ((8, 38), (9, 38), (18, 37), (9, 12), (10, 11)):
   c.set(mx, my, moss[2 if mx < 13 else 1])
 elif kind == 3:                                     # Ovoo / apacheta cairn with prayer flags & offerings
  st = lime if (v // 6) % 2 == 0 else sand
  stones = [
   (7.5, 36.0, 4.8, 2.9), (18.5, 36.0, 4.8, 2.9), (13.0, 37.2, 5.2, 3.1),
   (9.0, 32.0, 4.4, 2.6), (17.0, 32.0, 4.4, 2.6), (13.0, 33.2, 4.8, 2.8),
   (10.5, 28.2, 3.8, 2.3), (15.5, 28.2, 3.8, 2.3), (13.0, 29.0, 4.0, 2.4),
   (11.5, 24.8, 3.4, 2.0), (14.5, 25.0, 3.3, 2.0),
   (13.0, 21.8, 2.8, 1.7),
  ]
  _stone_cairn(c, 13.0, stones, st)
  for dx in (-2, -1, 0, 1):
   c.set(13 + dx, 24, '#c03828' if dx < 1 else '#8e2218')
   c.set(13 + dx, 25, '#e8e2d0' if dx < 1 else '#bfb6a2')
  for y in range(3, 21):
   c.set(12, y, oak[5]); c.set(13, y, oak[2])
  c.set(12, 2, '#f5d458'); c.set(13, 2, '#c89a28')
  flags = [
   ('#2a589e', '#4c7ec4'),
   ('#d9d2c0', '#f7f3e8'),
   ('#a82e22', '#dc5242'),
   ('#2e7230', '#529e52'),
   ('#c89820', '#f0c84b'),
  ]
  for i, (sh_c, hi_c) in enumerate(flags):
   fx = 14 + i * 2
   fy = 4 + i * 2
   c.set(fx, fy - 1, RAMPS['rope'][2]); c.set(fx + 1, fy, RAMPS['rope'][1])
   for dy in range(3):
    c.set(fx, fy + dy, hi_c)
    c.set(fx + 1, fy + dy, sh_c if dy == 2 else hi_c)
  for i, (sh_c, hi_c) in enumerate(flags[:3]):
   fx = 10 - i * 2
   fy = 5 + i * 2
   c.set(fx + 1, fy - 1, RAMPS['rope'][2])
   for dy in range(3):
    c.set(fx, fy + dy, hi_c)
    c.set(fx + 1, fy + dy, sh_c)
  soft_outline(c, st[0], st[3])
 elif kind == 4:                                     # South Asian vermilion chabutra shrine with dome & diya lamp
  plaster = ['#5e5646', '#857b66', '#aba088', '#cfc5ae', '#e8e0cc', '#f6f1e2', '#fcfaf2']
  _stepped_plinth_34(c, 13.5, 38, [(9, 34, 38), (8, 29, 33)], terra)
  for x in range(6, 22):
   if (x % 2) == 0:
    c.set(x, 31, '#e84428'); c.set(x, 32, '#fcfaf2')
  for y in range(18, 29):
   for x in range(8, 20):
    u = (x - 13.5) / 6.0
    c.set(x, y, plaster[6] if u < -0.4 else (plaster[5] if u < 0.3 else plaster[3]))
  c.hline(7, 20, 17, terra[5]); c.hline(7, 20, 18, terra[2])
  for y in range(20, 29):
   for x in range(11, 17):
    if y == 20 and x in (11, 16): continue
    c.set(x, y, '#261412' if y < 22 or x in (11, 16) else '#3d1e1a')
  lathe(c, 13.5, 27, [(0, 2.2), (3, 2.0), (5, 1.2)], ['#5a1812', '#8e241a', '#c43626', '#e8523c', '#ff7a5c', '#ffa68c', '#ffd4c4'], flat=False)
  for mx, my in ((10, 28), (11, 28), (16, 28), (17, 28), (12, 19), (15, 19)):
   c.set(mx, my, '#ff9e22' if (mx + my) % 2 == 0 else '#ffd84b')
  c.set(9, 28, '#c87a28'); c.set(9, 27, '#fff6bf')
  for dy in range(9):
   y = 8 + dy
   t = dy / 8.0
   hw = round(1.2 + 5.8 * (sin(min(1.0, t * 1.05) * pi / 2) ** 0.78))
   for x in range(int(13.5 - hw), int(13.5 + hw) + 1):
    u = (x - 13.5) / max(1, hw)
    tone = 6 if (u < -0.25 or dy <= 1) else (5 if u < 0.35 else (4 if u < 0.72 else 3))
    if dy in (3, 6):
     tone = max(2, tone - 1)
    c.set(x, y, plaster[tone])
  c.set(13, 6, '#f5d458'); c.set(14, 6, '#c89a28'); c.set(13, 7, '#e3ad42'); c.set(14, 7, '#bf8826'); c.set(13, 5, '#fff6bf')
  soft_outline(c, terra[0], plaster[3])
 else:                                               # East Asian wood-and-tile hokora wayside shrine
  slate = ['#1c222b', '#2c3542', '#414d5e', '#5a687c', '#76869c', '#96a6bc', '#bac8dc']
  _stepped_plinth_34(c, 13.5, 38, [(8, 34, 38), (6, 28, 33)], granite)
  for y in range(16, 28):
   for x in range(8, 20):
    u = (x - 13.5) / 6.0
    col = oak[5] if x in (8, 9) else (oak[2] if x in (18, 19) else (oak[4] if u < 0.2 else oak[3]))
    c.set(x, y, col)
  for y in range(18, 27):
   for x in range(11, 17):
    c.set(x, y, '#241810' if (x + y) % 2 == 0 else oak[2])
  c.hline(8, 19, 17, '#fcfaf2'); c.set(11, 18, '#fcfaf2'); c.set(14, 18, '#fcfaf2'); c.set(17, 18, '#fcfaf2')
  c.set(11, 27, '#e8523c'); c.set(16, 27, '#fcfaf2')
  for dy in range(9):
   y = 8 + dy
   flare = 2 if dy >= 7 else (1 if dy >= 5 else 0)
   hw = 2 + dy + flare
   for x in range(13 - hw, 15 + hw):
    u = (x - 13.5) / max(1, hw)
    tone = 6 if dy <= 1 else (5 if u < -0.15 else (4 if u < 0.35 else 2))
    if (x + dy) % 2 == 0 and 1 < dy < 7:
     tone = max(1, tone - 1)
    c.set(x, y, slate[tone])
  c.hline(4, 23, 7, slate[6],) if False else None
  c.hline(10, 17, 7, slate[6]); c.set(9, 6, '#f5d458'); c.set(18, 6, '#c89a28')
  soft_outline(c, granite[0], oak[3])
 return c.image()


def dovecote(v=0, frame=0):
 """A pigeon house on a braced post, with a 4-frame animated dove on the sill."""
 c = Canvas(28, 44)
 wood = RAMPS['oak7']
 post = RAMPS['walnut7']
 f = frame % 4
 v = v % 3
 if v == 0:
  roof = ['#52241c', '#823c2a', '#ad563c', '#cc7353', '#e2916e']
  wall = ['#8d7f6a', '#b4a58c', '#d2c6ae', '#e8dfc9', '#f6f0df']
 elif v == 1:
  roof = ['#262d38', '#414b5b', '#5c687c', '#7c889e', '#9ea9be']
  wall = RAMPS['oak7']
 else:
  roof = ['#4a381d', '#745a2f', '#9c7c42', '#bfa05c', '#dac07c']
  wall = RAMPS['oak7']
 for y in range(22, 41):
  c.set(12, y, post[4]); c.set(13, y, post[3]); c.set(14, y, post[2]); c.set(15, y, post[1])
 for k in range(4):
  c.set(11 - k, 37 + k, post[4]); c.set(11 - k, 38 + k, post[1])
  c.set(16 + k, 37 + k, post[2]); c.set(16 + k, 38 + k, post[1])
  c.set(11 - k, 26 - k, post[4]); c.set(16 + k, 26 - k, post[2])
 for x in range(4, 24):
  c.set(x, 20, wood[5] if x < 15 else wood[3])
  c.set(x, 21, wood[3] if x < 17 else wood[2])
  c.set(x, 22, wood[1])
 for y in range(10, 20):
  for x in range(6, 22):
   if y < 12:
    c.set(x, y, wall[1] if y == 10 else wall[2])
   elif x in (6, 7, 20, 21):
    c.set(x, y, post[4] if x <= 7 else post[1])
   else:
    idx = 4 if x < 12 else (3 if x < 17 else 2)
    if y == 15:
     idx = max(1, idx - 1)
    c.set(x, y, wall[min(len(wall) - 1, idx)])
 for py_top in (12, 16):
  for hx in (9, 13, 17):
   c.set(hx, py_top, '#221814'); c.set(hx + 1, py_top, '#221814')
   c.set(hx, py_top + 1, '#18110e'); c.set(hx + 1, py_top + 1, '#18110e')
   c.set(hx, py_top + 2, wood[5]); c.set(hx + 1, py_top + 2, wood[2])
 for y in range(3, 11):
  hw = min(11, int((y - 2) * 1.35) + 1)
  for x in range(14 - hw, 14 + hw):
   if y == 10:
    col = roof[0]
   elif x < 12:
    col = roof[4] if (y % 2 == 1) else roof[3]
   elif x < 16:
    col = roof[3] if (y % 2 == 1) else roof[2]
   else:
    col = roof[2] if (y % 2 == 1) else roof[1]
   c.set(x, y, col)
 c.set(13, 2, roof[4]); c.set(14, 2, roof[2]); c.set(13, 1, '#e8c464')
 soft_outline(c, post[0], wood[2])
 dx, dy = 18, 17
 if f == 0:
  c.set(dx, dy, '#ffffff'); c.set(dx + 1, dy, '#e8e3d6')
  c.set(dx, dy + 1, '#f2eee4'); c.set(dx + 1, dy + 1, '#c8c2b4'); c.set(dx + 2, dy + 1, '#9a9488')
  c.set(dx, dy + 2, '#6c675e'); c.set(dx + 1, dy + 2, '#6c675e')
  c.set(dx - 1, dy, '#e2903a')
 elif f == 1:
  c.set(dx, dy + 1, '#ffffff'); c.set(dx + 1, dy, '#e8e3d6')
  c.set(dx + 1, dy + 1, '#c8c2b4'); c.set(dx + 2, dy + 1, '#9a9488')
  c.set(dx - 1, dy + 2, '#e2903a')
 elif f == 2:
  c.set(dx, dy, '#ffffff'); c.set(dx + 1, dy - 1, '#ffffff'); c.set(dx + 2, dy - 1, '#dfd9cc')
  c.set(dx, dy + 1, '#f2eee4'); c.set(dx + 1, dy + 1, '#c8c2b4'); c.set(dx + 2, dy + 1, '#9a9488')
  c.set(dx - 1, dy, '#e2903a')
 else:
  c.set(dx + 1, dy, '#ffffff'); c.set(dx, dy + 1, '#c8c2b4')
  c.set(dx + 1, dy + 1, '#f2eee4'); c.set(dx + 2, dy + 1, '#e8e3d6')
  c.set(dx + 2, dy, '#e2903a')
 return c.image()


def chicken_coop(v=0, frame=0):
 """A low henhouse with its pop hole, ramp, and 4-frame pecking hen."""
 c = Canvas(36, 28)
 f = frame % 4
 v = v % 3
 if v == 0:
  roof_r = ['#4a381d', '#745a2f', '#9c7c42', '#bfa05c', '#dac07c']
  wall, trim_r = RAMPS['oak7'], RAMPS['walnut7']
 elif v == 1:
  roof_r = ['#4f241c', '#7c3b2a', '#a6543b', '#c56f50', '#dc8c69']
  wall, trim_r = RAMPS['walnut7'], RAMPS['oak7']
 else:
  roof_r = ['#282d36', '#424a58', '#5c6678', '#7a8598', '#9aa5b8']
  wall, trim_r = RAMPS['birch7'], RAMPS['walnut7']
 for lx in (5, 22):
  for y in range(21, 25):
   c.set(lx, y, trim_r[4]); c.set(lx + 1, y, trim_r[1])
 for y in range(11, 22):
  for x in range(5, 25):
   if y < 13:
    c.set(x, y, wall[1] if y == 11 else wall[2])
   elif x in (5, 6, 23, 24):
    c.set(x, y, trim_r[4] if x <= 6 else trim_r[1])
   elif y == 21:
    c.set(x, y, trim_r[2])
   else:
    plank = (x - 7) % 3 == 0
    idx = (4 if x < 16 else 3) - (1 if plank else 0)
    c.set(x, y, wall[max(1, idx)])
 for y in range(14, 19):
  for x in range(17, 22):
   c.set(x, y, trim_r[2] if (y in (14, 18) or x in (17, 21)) else ('#201712' if y % 2 == 1 else trim_r[4]))
 for y in range(14, 21):
  for x in range(8, 14):
   if x in (8, 13) or y == 14:
    c.set(x, y, trim_r[5] if x == 8 or y == 14 else trim_r[1])
   elif y == 20 and x in (9, 10, 12):
    c.set(x, y, '#d4b460')
   else:
    c.set(x, y, '#1d1510' if y < 18 else '#2b2018')
 for y in range(2, 12):
  inset = max(0, (5 - y) // 2)
  for x in range(2 + inset, 28 - inset):
   if y == 2:
    col = roof_r[4]
   elif y == 11:
    col = roof_r[0]
   elif v == 0:
    bundle = (x * 7 + y * 3) % 4
    idx = 4 if (bundle == 0 and y < 9) else (3 if bundle <= 2 else 2)
    if x > 21:
     idx = max(1, idx - 1)
    col = roof_r[idx]
   else:
    rib = x % 4
    idx = 4 if rib == 1 else (3 if rib in (0, 2) else 2)
    if (y - 2) % 3 == 2:
     idx = max(1, idx - 1)
    if x > 21:
     idx = max(1, idx - 1)
    col = roof_r[idx]
   c.set(x, y, col)
 for step in range(5):
  ry, rx = 20 + step, 8 + step // 2
  for dx in range(5):
   c.set(rx + dx, ry, wall[5] if step % 2 == 0 else wall[3])
  c.set(rx + 5, ry, wall[1])
 hen = ['#70351d', '#a6552c', '#cf7a46', '#e8a872'] if v != 2 else ['#7c746a', '#b4aba0', '#dbd4c8', '#f7f4ec']
 peck = f in (1, 2)
 hx, hy = 27, 20
 for dx, dy, hi in [
  (1, 1, 3), (2, 1, 2), (3, 1, 2), (4, 1, 1),
  (0, 2, 2), (1, 2, 2), (2, 2, 1), (3, 2, 1),
  (1, 3, 0), (2, 3, 0),
 ]:
  c.set(hx + dx, hy + dy, hen[hi])
 if peck:
  c.set(hx - 1, hy + 2, hen[3]); c.set(hx, hy + 1, hen[3])
  c.set(hx - 1, hy + 1, '#cf3832')
  c.set(hx - 2, hy + 3, '#e2a83a')
 else:
  c.set(hx + 1, hy, hen[3]); c.set(hx + 2, hy, hen[2]); c.set(hx, hy + 1, hen[3])
  c.set(hx + 1, hy - 1, '#cf3832')
  c.set(hx - 1, hy + 1, '#e2a83a')
 soft_outline(c, trim_r[0], wall[2])
 return c.image()


def _slab(c, cx, top, base, half, s, lean=0, taper=.55):
 """An upright stone: broad at the foot, narrowing unevenly to a worn top."""
 for y in range(top, base + 1):
  t = (y - top) / max(1, base - top)
  h = half * (taper + (1 - taper) * min(1, t * 1.6)) - (0 if t > .08 else 1)
  mid = cx + lean * (1 - t)
  for x in range(int(mid - h), int(mid + h) + 1):
   u = (x + .5 - mid) / max(h, .5)
   if abs(u) > 1: continue
   tone = 4 if u < -.55 else 3 if u < -.1 else 2 if u < .5 else 1
   if (x * 7 + y * 3) % 11 == 0: tone = max(1, tone - 1)
   c.set(x, y, s[tone])
 for x in range(int(cx - half) - 1, int(cx + half) + 2):
  if (x + top) % 3: c.set(x, base + 1, MOSS if x % 2 else LEAF[1])


def standing_stone(v=0):
 """A raised stone, carved or plain, as each country marked its ground: a
 menhir with pecked spirals, a deer stone, a cup-marked slab, a carved post,
 a stacked figure of flat stones."""
 c = Canvas(24, 42)
 granite = RAMPS['granite']
 sand = RAMPS['sandstone']
 lime = RAMPS['limestone']
 oak = RAMPS['oak7']
 walnut = RAMPS['walnut7']
 moss = ['#2a421c', '#42662c', '#628e42']

 kind = v % 5
 if kind == 0:                                       # menhir with pecked spiral carvings
  st = granite
  _stepped_plinth_34(c, 11.5, 38, [(7, 36, 38)], st)
  for y in range(6, 37):
   t = (y - 6) / 30.0
   hw = 3.2 + 3.2 * (t ** 0.65)
   cx_y = 11.5 + 0.8 * (1.0 - t)
   for x in range(int(cx_y - hw), int(cx_y + hw) + 1):
    u = (x + 0.5 - cx_y) / max(1.0, hw)
    tone = 6 if (y < 9 and u < 0.2) else (5 if u < -0.38 else (4 if u < 0.25 else (3 if u < 0.68 else 2)))
    if (x * 7 + y * 3) % 11 == 0:
     tone = max(2, tone - 1)
    c.set(x, y, st[tone])
  for cx_s, cy_s in ((11, 16), (11, 27)):
   for dx, dy in ((0, -2), (1, -2), (2, -1), (2, 0), (2, 1), (1, 2), (0, 2), (-1, 2), (-2, 1), (-2, 0), (-1, -1), (0, 0)):
    c.set(cx_s + dx, cy_s + dy, st[1])
   c.set(cx_s - 1, cy_s - 2, st[6]); c.set(cx_s, cy_s - 3, st[6])
  soft_outline(c, st[0], st[3])
  for mx, my in ((6, 38), (7, 39), (16, 38), (8, 35)):
   c.set(mx, my, moss[2 if mx < 12 else 1])
 elif kind == 1:                                     # Eurasian steppe deer stone
  st = sand
  _stepped_plinth_34(c, 11.5, 38, [(6, 36, 38)], st)
  for y in range(4, 37):
   t = (y - 4) / 32.0
   hw = 3.8 + 1.0 * t
   for x in range(int(11.5 - hw), int(11.5 + hw) + 1):
    u = (x + 0.5 - 11.5) / max(1.0, hw)
    tone = 6 if (y == 4 and u < 0.3) else (5 if u < -0.35 else (4 if u < 0.28 else 2))
    c.set(x, y, st[tone])
  for y in (9, 30):
   for x in range(8, 16):
    c.set(x, y, '#8c2820' if x < 14 else '#5a1812')
  for k, y in enumerate((14, 20, 26)):
   x = 9 + (k % 2)
   c.hline(x, x + 3, y, '#8c2820')
   c.set(x + 4, y - 1, '#c43626'); c.set(x + 5, y - 2, '#e87454')
   c.set(x, y + 1, '#5a1812'); c.set(x + 3, y + 1, '#5a1812')
  c.rect(10, 6, 11, 7, '#f5d458')
  soft_outline(c, st[0], st[3])
  c.set(7, 38, moss[1]); c.set(16, 38, moss[0])
 elif kind == 2:                                     # Cup-marked boulder slab
  st = lime
  _stepped_plinth_34(c, 11.5, 38, [(8, 35, 38)], st)
  for y in range(13, 36):
   t = (y - 13) / 22.0
   hw = 4.5 + 3.2 * (t ** 0.55)
   for x in range(int(11.5 - hw), int(11.5 + hw) + 1):
    u = (x + 0.5 - 11.5) / max(1.0, hw)
    tone = 6 if (y <= 14 and u < 0.25) else (5 if u < -0.35 else (4 if u < 0.3 else (3 if u < 0.7 else 2)))
    if (x * 5 + y * 3) % 9 == 0:
     tone = max(2, tone - 1)
    c.set(x, y, st[tone])
  for x, y in ((8, 20), (12, 19), (14, 24), (9, 27), (13, 30), (7, 32)):
   c.set(x, y, st[1]); c.set(x + 1, y, st[2]); c.set(x, y + 1, st[6])
  soft_outline(c, st[0], st[3])
  for mx, my in ((5, 38), (6, 39), (17, 38)):
   c.set(mx, my, moss[2 if mx < 12 else 1])
 elif kind == 3:                                     # Carved and painted totem / ancestor post
  _stepped_plinth_34(c, 11.5, 38, [(6, 36, 38)], granite)
  for y in range(7, 36):
   for x in range(8, 16):
    u = (x - 11.5) / 4.0
    c.set(x, y, walnut[5] if u < -0.35 else (walnut[4] if u < 0.25 else walnut[2]))
  for x in range(9, 15):
   c.set(x, 6, walnut[6] if x < 13 else walnut[4])
  bands = [
   (9,  ['#8e241a', '#c43626', '#e8523c', '#ffa68c']),
   (16, ['#aba088', '#cfc5ae', '#e8e0cc', '#fcfaf2']),
   (23, ['#1d3158', '#2e4c82', '#4970ab', '#739ad1']),
   (30, ['#8f6218', '#bf8826', '#e3ad42', '#f7cc6e']),
  ]
  for by0, pal in bands:
   for dy in range(5):
    y = by0 + dy
    for x in range(8, 16):
     u = (x - 11.5) / 4.0
     col = pal[3] if u < -0.3 else (pal[2] if u < 0.3 else pal[1])
     c.set(x, y, col)
   c.set(9, by0 + 1, '#181412'); c.set(13, by0 + 1, '#181412')
   c.set(10, by0 + 1, '#fcfaf2'); c.set(14, by0 + 1, '#fcfaf2')
   c.hline(10, 12, by0 + 3, '#181412')
   c.set(7, by0 + 2, oak[5]); c.set(16, by0 + 2, oak[2])
  soft_outline(c, walnut[0], walnut[3])
 else:                                               # Inuksuk: stacked flat stone figure with 3/4 slab depth
  st = granite
  blocks = [
   (4, 9, 31, 38), (14, 19, 31, 38),                 # two stone legs
   (3, 20, 26, 30),                                  # hip lintel slab
   (7, 16, 20, 25),                                  # torso stone
   (2, 21, 15, 19),                                  # outstretched arm slab
   (9, 14, 11, 14),                                  # neck stone
   (7, 16, 6, 10),                                   # head boulder
  ]
  for x0, x1, y0, y1 in blocks:
   cx_b = (x0 + x1) / 2.0
   hw = max(1.0, (x1 - x0) / 2.0)
   for x in range(x0, x1 + 1):
    u = (x - cx_b) / hw
    drop = round(1.5 * sqrt(max(0.0, 1.0 - min(1.0, u * u))))
    for y in range(y0, y1 + drop + 1):
     if y == y0:
      tone = 6 if u < 0.25 else 5
     elif y == y0 + 1:
      tone = 5 if u < 0.0 else 4
     elif y >= y1 + drop:
      tone = 1
     else:
      tone = 5 if u < -0.45 else (4 if u < 0.25 else (3 if u < 0.65 else 2))
      if (x * 5 + y * 3) % 7 == 0:
       tone = max(2, tone - 1)
     c.set(x, y, st[tone])
  soft_outline(c, st[0], st[3])
  c.set(5, 38, moss[2]); c.set(17, 38, moss[1])
 return c.image()


def stone_lantern(v=0):
 from .core import RAMPS, revolve, belly, soft_outline
 c = Canvas(28, 36)
 p = RAMPS['granite' if v == 0 else 'limestone']
 revolve(c, 14, belly(29, 34, [4, 8, 9, 8]), p, foot=1)
 revolve(c, 14, belly(19, 29, [3, 2.5, 2.5, 4]), p, foot=1)
 c.poly([(7, 18), (10, 15), (18, 15), (21, 18), (19, 20), (9, 20)], p[3])
 c.line((7, 18), (14, 16), p[5]); c.hline(9, 19, 20, p[1])
 c.rect(9, 9, 18, 16, p[3]); c.vline(9, 9, 16, p[5]); c.vline(18, 9, 16, p[1])
 c.rect(12, 11, 15, 15, p[0]); c.vline(12, 11, 15, p[2])
 c.poly([(2, 10), (5, 8), (10, 5), (17, 5), (23, 8), (26, 10), (22, 11), (5, 11)], p[3])
 c.line((3, 9), (10, 5), p[6]); c.hline(10, 17, 5, p[5]); c.line((18, 6), (25, 10), p[2])
 c.hline(5, 22, 11, p[1]); c.rect(12, 2, 15, 4, p[4]); c.hline(12, 15, 2, p[6]); c.set(13, 1, p[5])
 c.set(7, 33, MOSS); c.set(8, 34, LEAF[1]); c.set(20, 32, MOSS)
 soft_outline(c, p[1], p[3])
 return c.image()


def rune_marker(v=0):
 from .core import RAMPS, soft_outline
 c = Canvas(24, 33)
 p = RAMPS['granite' if v == 0 else 'sandstone']
 c.poly([(3, 31), (4, 14), (7, 4), (13, 1), (18, 5), (21, 19), (21, 31)], p[3])
 c.poly([(4, 29), (5, 14), (8, 5), (12, 3), (11, 28)], p[5])
 c.poly([(17, 6), (20, 19), (20, 30), (16, 29)], p[2])
 red = ['#6b322b', '#a5533a', '#c4764c']
 loop = [(8, 27), (6, 21), (7, 12), (10, 7), (14, 6), (17, 12), (17, 21), (14, 27), (8, 27)]
 for a, b in zip(loop, loop[1:]): c.line(a, b, red[1])
 c.line((9, 24), (14, 12), red[0]); c.line((14, 12), (11, 10), red[1])
 for x, y, direction in ((7, 15, 1), (7, 20, 1), (9, 26, -1), (14, 26, -1), (17, 18, -1), (16, 11, -1)):
  c.vline(x, y - 1, y + 1, p[1]); c.line((x, y - 1), (x + direction * 2, y), p[1])
 c.set(5, 29, MOSS); c.set(6, 30, LEAF[1]); c.set(18, 29, p[1])
 soft_outline(c, p[1], p[3])
 return c.image()


def roman_milestone(v=0):
 from .core import RAMPS, revolve, belly, soft_outline
 c = Canvas(18, 32)
 p = RAMPS['limestone' if v == 0 else 'sandstone']
 revolve(c, 9, belly(3, 30, [4.0, 4.8, 4.8, 5.3]), p, foot=1)
 for y, length in ((9, 5), (13, 6), (17, 4), (21, 5)):
  for x in range(6, 6 + length):
   if x % 3 != (y // 4) % 3:
    c.set(x, y, p[1]); c.set(x, y - 1, p[4])
 c.line((12, 24), (11, 28), p[2]); c.set(5, 29, MOSS)
 soft_outline(c, p[1], p[3])
 return c.image()


WAYSIDE = {
 'stone-lantern': stone_lantern,
 'rune-marker': rune_marker,
 'roman-milestone': roman_milestone,
 'standing-stone': standing_stone,
 'beehive': beehive,
 'waymark': waymark,
 'wayside-shrine': wayside_shrine,
 'dovecote': dovecote,
 'chicken-coop': chicken_coop,
}
