"""Shapes in the houses' projection: walls square on, anything level seen
from above at K of its depth. Props built from these show their tops the way
the buildings show their roofs."""
from math import asin, atan2, hypot, pi, sqrt

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


def stave_body(c, cx, top_y, bot_y, rx_top, rx_bot, wood, hoops=(), hoop_ramp=None, staves=8):
 """A coopered wooden tub or cask body in K=0.5 3/4 view: elliptical bottom
 drop, stave seams crowding toward the sides by asin(u), and curved hoops."""
 span = max(1, bot_y - top_y)
 ry_top, ry_bot = rx_top * .44, rx_bot * .43
 max_rx = max(rx_top, rx_bot)
 for x in range(int(cx - max_rx) - 1, int(cx + max_rx) + 2):
  for y in range(top_y, int(bot_y + ry_bot) + 2):
   t = max(0.0, min(1.0, (y - top_y) / span))
   rx = rx_top + (rx_bot - rx_top) * t
   ry = ry_top + (ry_bot - ry_top) * t
   u = (x + .5 - cx) / rx
   if abs(u) > 1.0: continue
   y_front_top = top_y + ry_top * sqrt(max(0.0, 1.0 - u * u))
   y_front_bot = bot_y + ry * sqrt(max(0.0, 1.0 - u * u))
   if y < round(y_front_top) - 1 or y > round(y_front_bot): continue
   idx = 3 if u < -.78 else 5 if u < -.52 else 6 if u < -.22 else 4 if u < .14 else 3 if u < .52 else 2 if u < .84 else 3
   stave_pos = (asin(max(-1.0, min(1.0, u))) / pi + .5) * staves
   stave_idx = int(stave_pos)
   if stave_pos - stave_idx < .11 * (1.0 + .6 * abs(u)):
    idx = max(1, idx - 1)
   elif stave_idx % 3 == 1 and idx in (3, 4, 5) and (y + stave_idx * 3) % 7 < 4:
    idx = max(2, idx - 1)
   if y >= round(y_front_bot): idx = max(1, idx - 1)
   elif y == round(y_front_top): idx = min(6, idx + 1)
   c.set(x, y, wood[idx])
 if not hoop_ramp: return
 for yh in hoops:
  th = max(0.0, min(1.0, (yh - top_y) / span))
  rx = rx_top + (rx_bot - rx_top) * th + .35
  ry = ry_top + (ry_bot - ry_top) * th
  for x in range(int(cx - rx), int(cx + rx) + 1):
   u = (x + .5 - cx) / rx
   if abs(u) > 1.0: continue
   yc = round(yh + ry * sqrt(max(0.0, 1.0 - u * u)))
   hi = hoop_ramp[6] if -.62 < u < -.20 else (hoop_ramp[5] if u < .18 else (hoop_ramp[3] if u < .65 else hoop_ramp[2]))
   lo = hoop_ramp[2] if u < .15 else hoop_ramp[1]
   c.set(x, yc - 1, hi); c.set(x, yc, lo)
   if abs(u + .38) < .06 or abs(u - .42) < .06:
    c.set(x, yc - 1, hoop_ramp[6] if u < 0 else hoop_ramp[4])


def bench_34(c, cx, top_y, w_half, depth_h, wood):
 """A 4-legged 3/4 timber stand or bench: rear legs stepped up and darker,
 front legs grounded lower and brighter, and a plank top seen at K=0.5."""
 for lx in (int(cx - w_half + 2), int(cx + w_half - 3)):
  for y in range(top_y + depth_h + 1, top_y + depth_h + 5):
   c.set(lx, y, wood[2]); c.set(lx + 1, y, wood[1])
 for lx in (int(cx - w_half + 1), int(cx + w_half - 2)):
  for y in range(top_y + depth_h + 2, top_y + depth_h + 8):
   c.set(lx, y, wood[5]); c.set(lx + 1, y, wood[3]); c.set(lx + 2, y, wood[1])
 for dy in range(depth_h):
  y = top_y + dy
  inset = (depth_h - 1 - dy) // 2
  for x in range(int(cx - w_half + inset), int(cx + w_half - inset) + 1):
   idx = 6 if dy == 0 else (5 if x < cx + 2 else 4)
   if (x - int(cx)) % 5 == 0 and 0 < dy < depth_h - 1: idx -= 1
   c.set(x, y, wood[idx])
 fy = top_y + depth_h
 for x in range(int(cx - w_half), int(cx + w_half) + 1):
  c.set(x, fy, wood[5] if x < cx else wood[4])
  c.set(x, fy + 1, wood[2] if x < cx else wood[1])


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
