"""The street's smaller ironwork: somewhere to tie a horse, something to weigh with."""
from math import cos, pi, sin
from .building import _ground
from .core import Canvas, RAMPS, jitter, soft_outline, grass
from .workshop import WOOD7, streak


def hitching_post(v=0):
 """A post with a ring, a mounting block, or a rail: wherever animals wait."""
 c = Canvas(56, 46)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7']
 s = RAMPS['granite']
 if v == 0:                                        # a single post and its ring
  for y in range(8, 42):
   for k in range(5):
    tone = 5 if k == 0 else 4 if k < 3 else 2 if k < 4 else 1
    c.set(22 + k, y, w[tone])
   if y % 9 == 3: c.set(23, y, w[6])
   if jitter(y, 2) % 11 == 0: c.set(24, y, w[2])
  for k, half in enumerate((4, 5, 4)):             # a turned cap
   for x in range(24 - half, 24 + half + 1):
    c.set(x, 5 + k, w[5 if x < 24 else 3])
  c.hline(19, 29, 12, m[3]); c.hline(19, 29, 13, m[1])
  for a in range(0, 360, 20):                      # the ring it ties to
   r = a * pi / 180
   x = round(20 + cos(r) * 5.0)
   y = round(24 + sin(r) * 4.4)
   c.set(x, y, m[5] if cos(r) < 0 else m[3])
   c.set(x, y + 1, m[1])
  c.set(21, 19, m[4]); c.set(22, 20, m[2])
  _ground(c, 24, 42, 12)
 elif v == 1:                                      # a mounting block beside it
  for y in range(10, 42):
   for k in range(4):
    c.set(44 + k, y, w[5] if k == 0 else w[3] if k < 3 else w[1])
  c.hline(42, 49, 9, w[5]); c.hline(42, 49, 10, w[2])
  for a in range(0, 360, 24):
   r = a * pi / 180
   c.set(round(42 + cos(r) * 4.2), round(20 + sin(r) * 3.8),
         m[5] if cos(r) < 0 else m[3])
  for k, (half, y) in enumerate(((12, 22), (15, 30), (18, 38))):
   for yy in range(y, y + 8):                      # three steps of dressed stone
    for x in range(20 - half, 20 + half + 1):
     u = (x - 20) / half
     tone = 5 if u < -0.3 else 4 if u < 0.4 else 3
     if (x + yy) % 11 == 0: tone -= 1
     c.set(x, yy, s[max(tone, 1)])
   c.hline(20 - half, 20 + half, y, s[6])
   c.hline(20 - half, 20 + half, y + 7, s[1])
  _ground(c, 26, 46, 24)
 else:                                             # a rail between two posts
  for px in (6, 46):
   for y in range(14, 42):
    for k in range(4):
     c.set(px + k, y, w[5] if k == 0 else w[3] if k < 3 else w[1])
   c.hline(px - 1, px + 4, 13, w[5])
  for y in range(18, 23):                          # the rail itself
   for x in range(4, 52):
    tone = 5 if y == 18 else 4 if y < 21 else 2
    c.set(x, y, w[tone])
   if y == 19: streak(c, 4, 51, y, w, 4)
  c.hline(4, 51, 23, w[0])
  for rx in (16, 36):                              # rings hanging off it
   for a in range(0, 360, 18):
    r = a * pi / 180
    x, y = round(rx + cos(r) * 3.4), round(28 + sin(r) * 3.0)
    c.set(x, y, m[5] if cos(r) < 0 else m[3])
   c.set(rx, 24, m[4]); c.set(rx, 25, m[2])
  _ground(c, 28, 42, 26)
 soft_outline(c, w[0], w[2])
 grass(c, [(1, 45, 2), (52, 45, 2)])
 return c.image()


def beam_scale(v=0, frame=0):
 """A balance on a post: a beam, a pan on each cord, a box of weights.

 The beam is never quite still — it settles one way, then the other — so the
 frames walk a slow sine rather than cycling a pose.
 """
 c = Canvas(52, 56)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7'] if v != 2 else RAMPS['brasspot7']
 pan = RAMPS['brasspot7'] if v != 1 else RAMPS['blackiron7']
 cx = 25
 for y in range(16, 50):                           # the post
  for k in range(5):
   tone = 5 if k == 0 else 4 if k < 3 else 2 if k < 4 else 1
   c.set(cx - 2 + k, y, w[tone])
  if y % 8 == 2: c.set(cx - 1, y, w[6])
 for k, half in enumerate((6, 8, 9)):              # its foot
  for x in range(cx - half, cx + half + 1):
   c.set(x, 47 + k, w[5 if x < cx else 3] if k == 0 else w[2] if k == 1 else w[0])
 # The beam tips a little either side of level, slowly.
 tilt = sin(frame / 8 * 2 * pi)
 lift = round(tilt * 2)
 for i in range(-17, 18):                          # the beam across the top
  y = 12 + round(tilt * 2 * (i / 17))
  c.set(cx + i, y, m[5]); c.set(cx + i, y + 1, m[3]); c.set(cx + i, y + 2, m[1])
 c.set(cx, 9, m[4]); c.set(cx, 10, m[6]); c.set(cx, 11, m[5])   # the pivot
 c.set(cx - 1, 10, m[2]); c.set(cx + 1, 10, m[2])
 for side, dx in ((0, -17), (1, 17)):              # a pan hanging at each end
  hang = 12 + round(tilt * 2 * (dx / 17)) + 2
  px = cx + dx
  for k in range(8):                               # two cords, straight
   c.set(px - 5 + k // 2, hang + k, pan[3])
   c.set(px + 5 - k // 2, hang + k, pan[2])
  top = hang + 8
  for y in range(top, top + 5):                    # the pan itself
   half = 7 - (y - top) * 2
   for x in range(px - half, px + half + 1):
    u = (x - px) / max(half, 1)
    c.set(x, y, pan[5] if u < -0.25 else pan[4] if u < 0.45 else pan[2])
  c.hline(px - 7, px + 7, top, pan[6])
  c.set(px - 7, top, pan[3]); c.set(px + 7, top, pan[1])
  c.hline(px - 2, px + 2, top + 4, pan[1])
  if side == 0:                                    # something in the near pan
   for x in range(px - 4, px + 5):
    c.set(x, top - 1, RAMPS['straw'][4 if x % 2 else 3])
   c.hline(px - 2, px + 2, top - 2, RAMPS['straw'][5])
 box = RAMPS['oak7']                               # the box of weights
 for y in range(40, 50):
  for x in range(36, 51):
   u = (x - 36) / 15
   tone = 5 if u < 0.25 else 4 if u < 0.7 else 2
   if (x - 36) % 5 == 0: tone -= 2
   c.set(x, y, box[max(tone, 1)])
 c.hline(36, 50, 40, box[6]); c.hline(36, 50, 49, box[0])
 for i, x in enumerate((39, 43, 47)):              # the weights on its lid
  h = 3 + i
  for y in range(40 - h, 40):
   half = 1 if y < 40 - h + 1 else 2
   for px2 in range(x - half, x + half + 1):
    c.set(px2, y, m[5] if px2 < x else m[3])
  c.set(x, 40 - h - 1, m[4])
 _ground(c, cx, 50, 22)
 soft_outline(c, w[0], w[2])
 return c.image()


MARKET = {
 'hitching-post': hitching_post,
 'beam-scale': beam_scale,
}
