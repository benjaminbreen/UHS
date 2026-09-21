"""Yard things that mark a region: the gourd, the standing mortar, the rope
bed, the log hive and the stock pen. ~17 source pixels to a metre, drawn
above life size like the rest of the yard kit."""
from .core import Canvas, RAMPS, blob, revolve, belly, soft_outline, grass, jitter
from .workshop import WOOD7, streak

GOURD = [
 ['#3a2614', '#5c3c1c', '#80572a', '#a3753b', '#c4944f', '#dcb46c', '#ecd08f'],
 ['#3d3620', '#5f5530', '#837644', '#a8995b', '#c6b776', '#dccf95', '#ede3b6'],
 ['#2c1a12', '#48291a', '#673a22', '#87502c', '#a56a3b', '#bf8750', '#d6a66b'],
]
ROPE = RAMPS['rope']


def calabash(v=0):
 """A bottle gourd with a stopper and a string sling, and a half-calabash
 bowl beside it, seen from above so its pale inside shows."""
 c = Canvas(22, 17)
 g = GOURD[v]
 # The bowl first: it sits behind and to the right.
 blob(c, [(16.5, 13.0, 4.8, 2.9)], g)
 for y in range(10, 15):
  for x in range(12, 22):
   u, w = (x + .5 - 16.5) / 3.6, (y + .5 - 12.2) / 1.7
   if u * u + w * w <= 1:
    c.set(x, y, g[6] if w < -0.2 and u < 0.2 else g[5] if w < 0.4 else g[4])
 c.hline(14, 19, 14, g[2])
 # The bottle: a round belly, a waist and a smaller head.
 blob(c, [(7.0, 11.2, 5.2, 4.9), (7.0, 5.0, 2.8, 2.9)], g)
 for y in range(6, 9):                              # the waist
  for x in range(5, 9): c.set(x, y, g[4] if x < 7 else g[3])
 c.rect(6, 0, 8, 2, RAMPS['wood'][3]); c.set(6, 0, RAMPS['wood'][5])  # stopper
 c.set(8, 2, RAMPS['wood'][1])
 if v == 2:                                          # burnt-in bands
  for x in range(3, 12):
   if (x + 1) % 3: c.set(x, 10, g[1])
   if x % 3 == 0: c.set(x, 13, g[1])
 soft_outline(c, g[1], g[3])
 # The sling goes on after the rim so the cord keeps its gaps.
 for y, (a, b) in {9: (3, 11), 12: (2, 12)}.items():
  for x in range(a, b + 1, 2): c.set(x, y, ROPE[3 if x < 7 else 1])
 for y in range(3, 12): c.set(11 - (y > 8), y, ROPE[2] if y % 2 else ROPE[1])
 return c.image()


def pounding_mortar(v=0):
 """A standing wooden mortar, waisted like a drum, with its pestle stood
 up in it. The hollow is seen from above."""
 c = Canvas(20, 40)
 w = RAMPS[WOOD7[v]]
 cx = 9.0
 prof = belly(23, 38, [6.0, 5.4, 3.6, 3.4, 4.6, 5.2])
 revolve(c, cx, prof, w, foot=2)
 for y in (24, 25):                                  # the lip, a lit band
  for x in range(int(cx - prof[y]), int(cx + prof[y]) + 1):
   c.set(x, y, w[5] if x < cx + 2 else w[3])
 for x in range(int(cx - 4.5), int(cx + 5)):         # carved foot ring
  c.set(x, 34, w[2])
 # The mouth: a dark ellipse with the lip curving over its far side.
 for y in range(20, 26):
  for x in range(2, 17):
   u, t = (x + .5 - cx) / 6.0, (y + .5 - 23.0) / 2.6
   r = u * u + t * t
   if r > 1: continue
   c.set(x, y, w[5] if r > 0.55 and t < 0 else w[4] if r > 0.55 else w[0] if t < 0.3 else w[1])
 soft_outline(c, w[1], w[3])
 # The pestle: long, thicker at both ends, leaning a little to the right.
 p = RAMPS[WOOD7[(v + 2) % 3]]
 for y in range(0, 24):
  x = int(cx - 1 + (24 - y) * 0.12)
  thick = 3 if y < 4 else 2
  for k in range(thick):
   c.set(x + k, y, p[5] if k == 0 else p[3] if k == 1 else p[2])
  c.set(x + thick, y, p[1])
 c.hline(int(cx + 1), int(cx + 4), 0, p[4])
 if v == 1:                                          # a second pestle leaning out
  for y in range(6, 36):
   x = int(cx + 7 + (y - 6) * 0.22)
   c.set(x, y, p[4]); c.set(x + 1, y, p[2])
 return c.image()


CORD = {
 0: ['#4a3d26', '#6d5a36', '#907a4b', '#b09a68', '#cbb688'],
 1: ['#4a3d26', '#7b2f22', '#a8452d', '#2d4f6e', '#e0c79a'],
 2: ['#4a3d26', '#6d5a36', '#907a4b', '#b09a68', '#cbb688'],
}


def charpoy(v=0):
 """A rope bed seen from above the foot: the woven top, its frame, the
 shadow under it and two turned legs. One is made up with a folded quilt."""
 c = Canvas(34, 20)
 w = RAMPS[WOOD7[v % 3]]
 r = CORD[v]
 x0, x1, y0, y1 = 2, 31, 2, 11                       # the top face
 for x in (x0 + 1, x1 - 2):                           # back legs, under the far rail
  c.vline(x, y1 + 1, y1 + 3, w[1])
 for x in range(x0 + 3, x1 - 2):                      # the dark under the bed
  c.vline(x, y1 + 3, y1 + 5, '#2a2016' if x % 2 else '#33281b')
 for y in range(y0 + 1, y1):
  far = (y - y0) / (y1 - y0)                         # the top recedes: lighter behind
  for x in range(x0 + 2, x1 - 1):
   if v == 1:                                         # coloured tape in blocks
    col = r[1] if (x // 3 + y // 2) % 2 else r[3]
    c.set(x, y, col if (x + y) % 3 else r[4])
   else:                                              # diagonal rope weave
    d1, d2 = (x + y) % 4, (x - y) % 4
    tone = 4 if d1 == 0 else 3 if d2 == 0 else 1 if (d1 == 2 and d2 == 2) else 2
    c.set(x, y, r[min(4, tone + (far < 0.3))])
 for x in range(x0, x1 + 1):                          # the rails
  c.set(x, y0, w[5]); c.set(x, y0 + 1, w[4])
  c.set(x, y1, w[5]); c.set(x, y1 + 1, w[3]); c.set(x, y1 + 2, w[2])
 for y in range(y0, y1 + 3):
  c.set(x0, y, w[4]); c.set(x0 + 1, y, w[3])
  c.set(x1, y, w[2]); c.set(x1 - 1, y, w[3])
 streak(c, x0 + 2, x1 - 2, y1 + 1, w, 3)
 for x in (x0, x1 - 1):                               # turned front legs
  for y in range(y1 + 3, y1 + 8):
   bulge = 1 if y in (y1 + 4, y1 + 5) else 0
   c.set(x - bulge, y, w[4]); c.set(x + 1, y, w[2])
   if bulge: c.set(x + 1 + bulge, y, w[1])
 if v == 2:                                           # a quilt folded at the head
  q = ['#3b2320', '#6a2f2a', '#9a4535', '#c0674a', '#dc9a72', '#ecc59a']
  for y in range(y0 + 1, y1 + 1):
   for x in range(x1 - 9, x1 - 1):
    t = (x - (x1 - 9)) / 8
    c.set(x, y, q[4] if t < 0.3 else q[3] if t < 0.75 else q[2])
    if (x + y * 2) % 7 == 0: c.set(x, y, q[5])
  c.vline(x1 - 9, y0 + 1, y1, q[5]); c.hline(x1 - 9, x1 - 2, y1 + 1, q[1])
 soft_outline(c, w[1], w[3])
 return c.image()


def _bark_log(c, x0, x1, cy, half, b):
 """A hollow log lying across the view, lit along its top, its near end
 stopped with a plug of grass and dung."""
 for x in range(x0, x1 + 1):
  for y in range(int(cy - half), int(cy + half) + 1):
   t = (y + .5 - cy) / half
   if abs(t) > 1: continue
   tone = 5 if t < -0.6 else 4 if t < -0.15 else 3 if t < 0.4 else 2 if t < 0.8 else 1
   if jitter(x // 3, y) % 6 == 0: tone -= 1         # bark cracks, with the grain
   c.set(x, y, b[max(tone, 1)])
  if (x - x0) % 7 == 4:                               # the lashings
   for y in range(int(cy - half), int(cy + half) + 1):
    t = (y + .5 - cy) / half
    c.set(x, y, ROPE[3] if t < -0.3 else ROPE[1])
 # The end, seen a little from the side: bark ring round a pale plug.
 for y in range(int(cy - half) - 1, int(cy + half) + 2):
  for x in range(x0 - 3, x0 + 2):
   u, t = (x + .5 - x0 + 0.5) / 2.6, (y + .5 - cy) / (half + 0.6)
   r = u * u + t * t
   if r > 1: continue
   c.set(x, y, b[2] if r > 0.55 else '#9a8a62' if t < -0.1 else '#7d6c49')
 c.set(x0 - 1, int(cy + 1), '#1d140c'); c.set(x0 - 2, int(cy + 1), '#1d140c')


def log_hive(v=0):
 """Bark or hollow-log hives slung between forked posts, the way they hang
 in trees across Africa and the Russian forest."""
 c = Canvas(30, 24)
 b = (['#2b2419', '#4a3e2c', '#6b5c42', '#8a7a5a', '#a89874', '#c4b690'] if v == 1
      else ['#231a14', '#3b2c20', '#57402c', '#735739', '#8f6f4a', '#aa8a60'])
 post = RAMPS[WOOD7[1]]
 logs = [(4, 26, 13, 4.6), (6, 24, 5, 3.8)] if v == 2 else [(4, 26, 11, 5.6)]
 low = logs[0][2] + logs[0][3]
 for px in (8, 22):                                   # the forked posts, behind
  c.vline(px - 3, low - 9, low - 6, post[3]); c.vline(px + 3, low - 9, low - 6, post[2])
 for x0, x1, cy, half in logs: _bark_log(c, x0, x1, cy, half, b)
 for px in (8, 22):                                   # and in front, below it
  for y in range(int(low) - 1, 24):
   c.set(px, y, post[4]); c.set(px + 1, y, post[2])
  c.set(px - 1, int(low) - 1, post[4]); c.set(px + 2, int(low) - 1, post[2])
 soft_outline(c, b[1], b[3])
 grass(c, [(6, 24, 3), (24, 24, 2), (15, 24, 2)])
 return c.image()


def stock_pen(v=0):
 """A night kraal: a ring of cut thorn or close-set poles round trodden
 dung, with a gap at the front closed by a branch."""
 c = Canvas(50, 32)
 cx, cy, rx, ry = 25.0, 20.0, 18.0, 9.0
 dung = ['#3a2b1c', '#4f3c27', '#634b31', '#76593a']
 for y in range(0, 30):                               # the floor
  for x in range(0, 48):
   u, t = (x + .5 - cx) / (rx - 2), (y + .5 - cy) / (ry - 1.5)
   if u * u + t * t <= 1:
    c.set(x, y, dung[1 + (jitter(x // 2, y) % 3 == 0) + (t > 0.3)])
 thorn = ['#1f1912', '#3a2e22', '#574633', '#735f45', '#8f7a5b', '#ab9674']
 pole = RAMPS[WOOD7[2]]
 from math import cos, sin, pi
 steps = 64
 ring = sorted(((cy + ry * sin(2 * pi * k / steps), k) for k in range(steps)))
 for _, k in ring:                                    # back to front
  a = 2 * pi * k / steps
  x, y = cx + rx * cos(a), cy + ry * sin(a)
  front = sin(a) > 0
  if front and abs(cos(a)) < 0.16: continue          # the gateway
  if v == 1:                                          # close-set poles
   if k % 2: continue
   h = 9 + jitter(k) % 3
   for i in range(h):
    c.set(x, y - i, pole[5 if i == h - 1 else 4 if cos(a) < 0 else 2])
    c.set(x + 1, y - i, pole[2 if cos(a) < 0 else 1])
  else:                                               # cut thorn, a brush of twigs
   h = 6 + jitter(k, 3) % 3
   for i in range(3):                                 # the packed base
    for dx in (-1, 0, 1):
     c.set(x + dx, y - i, thorn[1 + (dx < 0) + (i == 2)])
   for t in range(4):                                 # branches fanning up and out
    lean = ((jitter(k, t) % 5) - 2) * 0.25 + cos(a) * 0.2
    n = h - (jitter(t, k) % 3)
    for i in range(n):
     tone = 2 + (i * 3) // n + (lean < 0)
     c.set(x + lean * i, y - 2 - i, thorn[min(tone, 5)])
   if v == 2 and k % 6 == 0:                          # a post through the thorn
    for i in range(h + 3): c.set(x, y - i, pole[4]); c.set(x + 1, y - i, pole[2])
 for x in range(int(cx - 5), int(cx + 6)):            # the bar across the gap
  c.set(x, int(cy + ry - 4), pole[5]); c.set(x, int(cy + ry - 3), pole[2])
 soft_outline(c, thorn[1], thorn[3])
 return c.image()


REGIONAL = {
 'calabash': calabash,
 'pounding-mortar': pounding_mortar,
 'charpoy': charpoy,
 'log-hive': log_hive,
 'stock-pen': stock_pen,
}
