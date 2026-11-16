"""The street's smaller ironwork: somewhere to tie a horse, something to weigh with."""
from math import cos, pi, sin
from .building import _ground
from .core import Canvas, RAMPS, jitter, soft_outline, grass
from .workshop import WOOD7, streak


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
 'beam-scale': beam_scale,
}
