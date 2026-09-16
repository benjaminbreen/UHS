"""Field props. A sheaf is chest high on a person; a spade is shorter than one."""
from .core import Canvas, RAMPS, WOOD, jitter, dither, grass


def sheaf(v=0):
 """Tied bundle, about 1.1 m: wheat, barley in the ear, or a bound bale."""
 straw = RAMPS['straw']
 if v == 2:                                     # squat bound bale
  c = Canvas(20, 15)
  for y in range(2, 14):
   for x in range(1, 19):
    t = jitter(x, y) % 6
    c.set(x, y, straw[2 + (t % 3)] if y > 3 else straw[3 + (t % 2)])
  for x in range(1, 19):                        # cut ends catch the light
   if jitter(x, 1) % 3: c.set(x, 1, straw[4])
   if jitter(x, 9) % 4 == 0: c.vline(x, 4, 12, straw[1])
  r = RAMPS['rope']
  for bx in (5, 14):
   c.vline(bx, 1, 13, r[1]); c.vline(bx + 1, 1, 13, r[3])
  c.hline(1, 18, 13, straw[1])
  c.outline(straw[0])
  grass(c, [(0, 14, 2), (18, 14, 2)])
  return c.image()
 c = Canvas(17, 22)
 tie, foot = 12, 21
 fan = [(-7, 3), (-6, 1), (-4, 0), (-3, 2), (-1, 0), (0, 1), (2, 0), (3, 2), (5, 0), (6, 2), (7, 4)]
 for i, (dx, dy) in enumerate(fan):             # stalks above the tie
  tip = (8 + dx, dy)
  c.line((8 + (dx > 0) - (dx < 0), tie), tip, straw[4 if i % 2 else 3])
  ear = straw[5] if v == 1 else straw[4]
  for k in range(4 if v == 1 else 2):
   c.set(tip[0], tip[1] + k, ear)
   if v == 1 and k % 2: c.set(tip[0] + (1 if dx >= 0 else -1), tip[1] + k, straw[3])
 for i in range(13):                            # butts, splaying to the ground
  xt = 4 + i * 8 // 13
  xb = 1 + i * 14 // 13
  c.line((xt, tie), (xb, foot), straw[2 + (jitter(i) % 3)])
  if i % 4 == 0: c.line((xt + 1, tie + 2), (xb + 1, foot), straw[1])
 c.hline(2, 14, foot, straw[1])
 r = RAMPS['rope']
 c.hline(4, 12, tie, r[1]); c.hline(4, 12, tie + 1, r[3]); c.hline(4, 12, tie + 2, r[1])
 c.set(12, tie + 1, r[0]); c.set(5, tie + 1, r[2])
 c.outline(straw[0])
 grass(c, [(1, 21, 2), (14, 21, 2)])
 return c.image()


def spade(v=0):
 """Handle a little over a metre; the blade is barely a hand and a half wide.

 No outline pass at this size: a dark ring round a two-pixel shaft doubles it.
 """
 c = Canvas(9, 24)
 w = RAMPS[WOOD[v]]
 m = RAMPS['iron'] if v != 1 else RAMPS['copper']
 grip = v != 2
 top = 3 if grip else 1
 c.vline(4, top, 15, w[4]); c.vline(5, top, 15, w[1])   # lit face, shaded face
 c.set(4, top + 5, w[5]); c.set(4, top + 11, w[2])
 if grip:                                               # D grip
  c.hline(3, 6, 0, w[3]); c.set(2, 1, w[2]); c.set(7, 1, w[1])
  c.set(3, 1, w[4]); c.set(6, 1, w[2]); c.set(3, 2, w[3]); c.set(6, 2, w[1])
 else:
  c.hline(3, 6, 0, w[2]); c.set(4, 1, w[5])
 c.rect(3, 14, 6, 16, m[3]); c.hline(3, 6, 14, m[5]); c.set(6, 15, m[1])
 for i, (a, b) in enumerate([(2, 6), (2, 6), (2, 6), (2, 6), (2, 6), (3, 5)]):
  y = 17 + i
  c.hline(a, b, y, m[3])
  c.set(a, y, m[4] if i < 4 else m[3]); c.set(b, y, m[1])
  if i == 1: c.set(a + 1, y, m[4])
 c.hline(3, 5, 23, m[0]); c.hline(3, 5, 22, m[5])       # edge, then its shadow
 c.vline(1, 17, 21, m[1]); c.vline(7, 17, 21, m[1])
 c.set(2, 22, m[1]); c.set(6, 22, m[1]); c.set(2, 16, m[1]); c.set(6, 16, m[1])
 return c.image()
