"""Shapes in the houses' projection: walls square on, anything level seen
from above at K of its depth. Props built from these show their tops the way
the buildings show their roofs."""
from math import atan2, hypot

K = .5
_L = (-.55, .45, .7)
_n = hypot(*_L)
LIGHT = tuple(v / _n for v in _L)


def disc(c, cx, cy, rx, ry, col, keep=None):
 for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   dx, dy = x + .5 - cx, y + .5 - cy
   if (dx / rx) ** 2 + (dy / ry) ** 2 <= 1 and (keep is None or keep(dx, dy)):
    c.set(x, y, col)


def tone(r, lam):
 return max(0, min(len(r) - 1, int((lam + .2) / 1.15 * (len(r) - 1) + .5)))


def lathe(c, cx, by, prof, r, tex=None, z0=0, flat=True):
 """A solid of revolution seen from above at K, the front of its foot on
 row `by`: each level is an ellipse,
 painted from the foot up, so the foot curves, rings and courses curve with
 it and the top shows. `prof` is [(z, radius), ...]. `tex(z, a, i)` may
 shift the tone index at height z and angle a (0 = facing us). Returns
 {pixel: (z, a)} for detail drawn after."""
 def rad(z):
  if z <= prof[0][0]: return prof[0][1]
  for (za, ra), (zb, rb) in zip(prof, prof[1:]):
   if z <= zb: return ra + (rb - ra) * (z - za) / max(1e-6, zb - za)
  return -1
 top, out, z = prof[-1][0], {}, prof[0][0]
 while z <= top:
  R = rad(z)
  if R > .3:
   dr = rad(min(top, z + .5)) - rad(max(0, z - .5))
   cy = by - z0 - z - prof[0][1] * K
   for y in range(int(cy - R * K) - 1, int(cy + R * K) + 2):
    for x in range(int(cx - R) - 1, int(cx + R) + 2):
     u, w = (x + .5 - cx) / R, (y + .5 - cy) / (R * K)
     h = u * u + w * w
     if h > 1: continue
     if flat and z + .5 > top and h < .8: n = (0, 0, 1)
     else:
      h = h ** .5 or 1
      n = (u / h, w / h, -dr * 1.2)
     m = hypot(*n)
     lam = sum(a * b for a, b in zip(n, LIGHT)) / m
     i = tone(r, lam)
     a = atan2(u, w)
     if tex: i = tex(z, a, i)
     c.set(x, y, r[max(0, min(len(r) - 1, i))])
     out[(x, y)] = (z, a)
  z += .5
 return out


def block(c, x, by, w, h, d, r, top=None, front=None):
 """A box: its front face w by h standing on row `by`, its top seen above
 that at K of its depth. `top`/`front` may paint over the plain faces."""
 dd = round(d * K)
 fy = by - h + 1
 c.rect(x, fy - dd, x + w - 1, fy - 1, r[4]); c.hline(x, x + w - 1, fy - dd, r[5])
 c.rect(x, fy, x + w - 1, by, r[3]); c.vline(x + w - 1, fy, by, r[2]); c.vline(x, fy, by, r[4])
 c.hline(x, x + w - 1, fy, r[4] if h > 2 else r[3])
 if top: top(x, fy - dd, w, dd)
 if front: front(x, fy, w, h)
 return fy, fy - dd


def log_x(c, x0, x1, by, R, r, tex=None):
 """A log or bundle lying across the view: lit along its top, which the
 raised eye sees more of than its underside."""
 ry = R * (1 + K) / 1.4
 cy = by - ry
 for x in range(x0, x1 + 1):
  for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
   v = (y + .5 - cy) / ry
   e = min(1, (min(x - x0, x1 - x) + .5) / 2)
   if abs(v) > (1 if e >= 1 else (1 - (1 - e) ** 2) ** .5): continue
   lam = .62 - v * .55 - (abs(v) > .8) * .25
   i = tone(r, lam)
   if tex: i = tex(x, y, v, i)
   c.set(x, y, r[max(0, min(len(r) - 1, i))])
