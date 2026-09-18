"""Wells and water gear. Sized off the character: ~17 source pixels to a metre."""
from math import atan2, hypot, pi
from .core import Canvas, RAMPS, STONE, WOOD, jitter, dither, grass
from .workshop import WOOD7, streak


def shaft(c, cx, cy, rxi, ryi, ramp='limestone'):
 """The mouth: a course of lining stones on the far side, then the dark.

 A flat dark ellipse with a dither over it reads as a hole cut in paper. What
 sells the depth is seeing the lining curve away before the light gives out.
 """
 p = RAMPS[ramp]
 dark = ['#2f3733', '#262d2a', '#1e2422', '#181d1c', '#121616', '#0d1010', '#080a0a']
 for y in range(c.h):
  for x in range(c.w):
   X, Y = x + .5 - cx, y + .5 - cy
   d = hypot(X / rxi, Y / ryi)
   if d > 1: continue
   t = (Y / ryi + 1) / 2                        # 0 at the far lip, 1 at the near
   # How far this pixel is from the mouth's edge, along the shaft's wall.
   drop = (t - 0.02) / 0.40                     # the lining band, seen far side
   if t < 0.44 and d > 0.42:
    band = p[3] if drop < .30 else p[2] if drop < .62 else p[1]
    joint = (atan2(Y / ryi, X / rxi) % (2 * pi)) / (2 * pi) * 9
    if joint % 1 < .15: band = p[1] if drop < .5 else p[0]
    if drop > .85: band = dark[0]
    c.set(x, y, band)
    continue
   # Below the lining the light falls off: a smooth ramp with a dithered
   # boundary between each pair of steps, so no band edge shows.
   f = min(max((t - 0.26) / 0.58, 0), 1) ** 0.75
   f = f * 0.55 + (1 - abs(X) / rxi) * 0.45 * f  # darkest down the middle
   step = f * (len(dark) - 1)
   i = int(step)
   if step - i > (0.66 if dither(x, y) else 0.33): i += 1
   c.set(x, y, dark[min(i, len(dark) - 1)])


def kerb(c, cx, cy, rx, ry, rxi, ryi, wall, ramp, courses=3, across=6, blocks=11):
 """A ring of dressed stone with its wall extruded below it."""
 p = RAMPS[ramp]
 for y in range(c.h):
  for x in range(c.w):
   X, Y = x + .5 - cx, y + .5 - cy
   outer, inner = hypot(X / rx, Y / ry), hypot(X / rxi, Y / ryi)
   if outer > 1 or inner <= 1: continue
   b = (atan2(Y / ry, X / rx) % (2 * pi)) / (2 * pi) * blocks
   lit = 4 if (X - Y * 1.6) < 0 else 3
   lit = min(lit + (jitter(int(b)) % 3 == 0), 5)
   col = p[lit]
   mid = (outer + inner) / 2                   # across the ring's width
   if mid > 1.06: col = p[lit - 1]             # the outer edge rolls away
   if inner < 1.10: col = p[2]                 # inner lip, in its own shadow
   if b % 1 < .11: col = p[2]                  # radial joint
   c.set(x, y, col)
 for y in range(c.h):
  for x in range(c.w):
   X, Y = x + .5 - cx, y + .5 - cy
   if Y <= 0 or abs(X) > rx: continue
   d = X / rx
   k = max(0, 1 - d * d) ** .5
   if hypot(d, Y / ry) <= 1 or Y > wall + ry * k: continue
   shade = 4 if d < -.55 else 3 if d < .40 else 2
   top = cy + ry * k
   local, ch = y - top, wall / courses
   course = int(local // ch)
   bx = (d + 1) / 2 * across + (.5 if course % 2 else 0)
   col = p[min(shade + (jitter(int(bx), course) % 3 == 0), 5)]
   if k < .35: col = p[max(shade - 1, 1)]      # the curve turns away at the ends
   if (local % ch) / ch < .15: col = p[1]      # bed joint
   if bx % 1 < .09: col = p[1]                 # perpend
   if local > wall - 1 and dither(x, y): col = p[max(shade - 1, 1)]
   c.set(x, y, col)


def low_well(v=0):
 """About 2.4 m across the kerb and waist high."""
 c = Canvas(42, 34)
 cx, cy = 20.5, 9.5
 kerb(c, cx, cy, 20, 7.5, 15.5, 5.6, 15, STONE[v])
 shaft(c, cx, cy, 15.5, 5.6, STONE[v])
 c.rim(RAMPS[STONE[v]])
 g = RAMPS['grass']
 for x, y in [(6, 16), (7, 16), (33, 22), (34, 22), (12, 27), (28, 13)]:
  if c.get(x, y): c.set(x, y, g[1])
 return c.image()


def _hood(c, ridge, eaves, half0, half1, cover, w):
 """A pitched hood: ridge at the top, eaves fanning out below."""
 p = RAMPS[cover]
 rows = eaves - ridge
 for i in range(rows + 1):
  y = ridge + i
  half = half0 + (half1 - half0) * i // rows
  band = p[4] if i % 2 else p[3]
  c.hline(w // 2 - half, w // 2 + half, y, band)
  if cover == 'thatch':
   for x in range(w // 2 - half, w // 2 + half + 1):
    if jitter(x, y) % 5 == 0: c.set(x, y, p[5] if i % 2 else p[2])
  elif i % 2 == 0:
   for x in range(w // 2 - half + 1, w // 2 + half, 4): c.set(x, y, p[2])
 c.hline(w // 2 - half0, w // 2 + half0, ridge, p[5])
 c.hline(w // 2 - half1, w // 2 + half1, eaves, p[2])


def framed_well(v=0):
 """Roofed well: the eaves clear a standing figure by a head."""
 style = [
  {'cover': 'tile', 'post': 'wood', 'pitch': 11, 'lift': True, 'bucket': True},
  {'cover': 'thatch', 'post': 'darkwood', 'pitch': 13, 'lift': False, 'bucket': True},
  {'cover': 'wood', 'post': 'palewood', 'pitch': 9, 'lift': True, 'bucket': False},
 ][v % 3]
 c = Canvas(46, 52)
 cx, cy = 23, 30
 kerb(c, cx, cy, 17, 6.5, 13, 4.8, 13, STONE[v], courses=3, across=5)
 shaft(c, cx, cy, 13, 4.8, STONE[v])
 c.rim(RAMPS[STONE[v]])
 w = RAMPS[style['post']]
 beam = 4 + style['pitch']
 for px in (7, 35):                                    # posts, with a foot brace
  c.rect(px, beam, px + 3, 33, w[3])
  c.vline(px, beam, 33, w[1]); c.vline(px + 1, beam + 1, 32, w[4])
  c.vline(px + 3, beam, 33, w[1])
  for i in range(3):                                   # short knee brace
   bx = px + 4 + i if px < 20 else px - 1 - i
   c.set(bx, beam + 2 + i, w[2]); c.set(bx, beam + 3 + i, w[1])
 c.rect(5, beam - 2, 40, beam, w[2])                    # lintel
 c.hline(6, 39, beam - 2, w[4]); c.hline(6, 39, beam, w[1])
 _hood(c, 1, beam - 2, 3, 22, style['cover'], 46)
 if style['lift']:                                      # windlass and crank
  c.rect(17, beam + 1, 29, beam + 5, w[3])
  c.hline(17, 29, beam + 1, w[5]); c.hline(17, 29, beam + 5, w[1])
  for x in range(18, 29, 4): c.vline(x, beam + 2, beam + 4, w[2])
  c.rect(29, beam + 2, 32, beam + 3, RAMPS['iron'][3])
  c.rect(32, beam + 3, 33, beam + 7, RAMPS['iron'][2])
  c.rect(31, beam + 7, 34, beam + 9, RAMPS['iron'][3])
  rope_top = beam + 5
 else:                                                  # a plain rope over a peg
  c.rect(21, beam + 1, 25, beam + 3, RAMPS['iron'][3])
  c.set(23, beam + 4, RAMPS['iron'][2])
  rope_top = beam + 4
 r = RAMPS['rope']
 if style['bucket']:
  for y in range(rope_top, rope_top + 4): c.set(23, y, r[2] if y % 2 else r[3])
  by = rope_top + 4
  c.rect(19, by, 27, by + 8, w[2])                       # bucket
  c.rect(20, by + 1, 26, by + 7, w[3]); c.vline(20, by + 1, by + 7, w[4])
  c.vline(26, by + 1, by + 7, w[1])
  c.hline(19, 27, by, w[5]); c.hline(19, 27, by + 8, w[1])
  for hy in (by + 2, by + 6): c.hline(19, 27, hy, RAMPS['iron'][3])
  c.set(23, by - 1, RAMPS['iron'][4])
 else:
  for y in range(rope_top, cy - 1): c.set(23, y, r[2] if y % 2 else r[3])
  c.set(23, cy - 1, r[1])
 c.rim(w)
 return c.image()


def trough(v=0):
 """A feed or water trough, about 2.8 m long and knee high.

 Drawn square on, the way everything else in this view is: the top face is a
 symmetric band above the front, narrower at the back, with no lateral skew.
 A three-quarter box reads as a different game's projection.
 """
 c = Canvas(46, 26)
 stone = v == 2
 # Seven steps either way, so the boards can carry grain and a lit lip.
 w = RAMPS['ash7'] if stone else RAMPS[WOOD7[v]]
 if stone: w = ['#3b3a32', '#5f5d4e', '#847f6a', '#a8a186', '#c7bfa1', '#e3dcbe', '#f2eed8']
 water = RAMPS['water']
 back, front, base = 4, 11, 22
 for y in range(back, front + 1):                 # the top edge of the walls
  t = (y - back) / (front - back)
  inset = round(3 * (1 - t))
  c.hline(1 + inset, 44 - inset, y, w[5] if t < .4 else w[4])
 for y in range(back + 2, front - 1):             # the water, sunk inside
  t = (y - back - 2) / max(front - 3 - back, 1)
  inset = round(3 * (1 - t)) + 3
  # Darkest against the far wall, lightening toward the near lip.
  tone = 1 if t < .2 else 2 if t < .55 else 3
  c.hline(1 + inset, 44 - inset, y, water[tone])
 c.hline(9, 21, back + 3, water[4]); c.hline(11, 18, back + 4, water[5])
 c.hline(27, 37, back + 4, water[4]); c.hline(30, 35, back + 5, water[3])
 for y in range(front, base + 1):                 # the front boards
  tone = 4 if y < front + 3 else 3 if y < base - 2 else 2
  c.hline(1, 44, y, w[tone])
  streak(c, 1, 44, y, w, tone)
 c.hline(1, 44, front, w[6])                      # the lit lip
 c.hline(1, 44, base, w[1])
 if stone:
  for bx in range(7, 44, 8):                      # dressed blocks
   c.vline(bx, front + 1, base - 1, w[2])
  c.hline(1, 44, front + 5, w[2])
 else:
  c.hline(1, 44, front + 5, w[2])                 # the join between two boards
  for bx in (6, 38):                              # iron straps round the ends
   c.vline(bx, front, base, RAMPS['iron7'][3])
   c.vline(bx + 1, front, base, RAMPS['iron7'][1])
 for ex in (0, 45):                               # the end grain, either side
  for y in range(back + 3, base + 1):
   c.set(ex, y, w[2] if ex == 0 else w[1])
 for lx in (3, 39):                               # feet
  c.rect(lx, base + 1, lx + 3, base + 2, w[2])
  c.hline(lx, lx + 3, base + 2, w[0])
 c.rim(w)
 grass(c, [(0, 25, 2), (44, 25, 2)])
 return c.image()


def pump(v=0):
 """A hand pump is a post: one hand's width, chest high."""
 c = Canvas(14, 27)
 m = RAMPS[['iron', 'copper', 'iron'][v]]
 s = RAMPS['granite']
 for y in range(22, 27):                         # stone pad
  half = 5 - abs(y - 25) // 2
  c.hline(6 - half, 6 + half, y, s[3] if y < 25 else s[2])
 c.hline(2, 10, 22, s[4]); c.set(3, 24, s[4]); c.set(9, 25, s[1])
 c.rect(4, 6, 8, 23, m[3])                        # column
 c.vline(4, 6, 23, m[1]); c.vline(8, 6, 23, m[1]); c.vline(5, 7, 22, m[4])
 for y in (10, 17):
  c.rect(3, y, 9, y + 1, m[2]); c.hline(3, 9, y, m[4])
 c.rect(3, 3, 9, 7, m[2]); c.rect(4, 4, 8, 6, m[3]); c.hline(4, 8, 3, m[4])
 c.rect(9, 8, 11, 10, m[3]); c.hline(9, 11, 8, m[4])   # spout
 c.rect(11, 10, 12, 12, m[3]); c.vline(12, 10, 12, m[1]); c.hline(10, 12, 12, m[2])
 for i, (x, y) in enumerate([(7, 2), (5, 1), (3, 0)]):  # lever
  c.rect(x, y, x + 1, y + 1, m[3] if i else m[2]); c.set(x, y, m[4])
 c.set(2, 1, m[2])
 c.rim(m)
 return c.image()
