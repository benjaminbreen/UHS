"""Open fires in their regional forms, eight flame frames each.

The flame is drawn from a few tongues whose heights run on whole harmonics of
the eight-frame cycle, so the loop closes without a jump. Smoke and night
light are the renderer's; nothing here is part-transparent.
"""
from math import cos, pi, sin
from .core import Canvas, RAMPS, blob, jitter, soft_outline, grass
from .workshop import WOOD7

FRAMES = 8
# outer red, orange, yellow, pale core
FLAME = ['#7c2a17', '#c24a1c', '#ec8a2c', '#f7c451', '#fff0b8']
EMBER = ['#3a1a10', '#6e2412', '#b0391a', '#e8702a', '#ffb65a']
ASH = ['#2a2522', '#3d3631', '#554c44', '#6e645a', '#8a8074']
STONE = ['#26282a', '#3a3d3e', '#55595a', '#6f7473', '#8b908c', '#a8ada6', '#c4c8bf']
CHAR = ['#1b1512', '#2c211a', '#433125', '#5d4432', '#7a5a41']


FLAME_EDGE = '#5a1c12'


def flame(c, cx, base, width, height, frame, seed=0, tongues=3):
 """A fire's flame: tongues that swell above the fuel and curl to a point,
 a pale core low in the middle, the whole edged in dark red. `width` is the
 half-width at the foot, `height` the tallest tongue."""
 ph = 2 * pi * frame / FRAMES
 spots = []
 for k in range(tongues):
  u = (k - (tongues - 1) / 2) / max((tongues - 1) / 2, 1) if tongues > 1 else 0
  a = seed * 1.7 + k * 2.3
  h = height * (1 - 0.3 * abs(u)) * (0.84 + 0.1 * sin(ph + a) + 0.06 * sin(2 * ph + a * 1.3))
  lean = 1.0 * sin(ph + a * 0.7) + u * 2.2
  spots.append((cx + u * width * 0.5, h, width * (0.72 - 0.22 * abs(u)), lean, a))
 body = {}
 top = int(base - height * 1.2) - 2
 for y in range(top, base + 1):
  for x in range(int(cx - width * 2) - 2, int(cx + width * 2) + 3):
   heat = 0
   for tx, h, hw, lean, a in spots:
    d = base - y + 0.5
    if d < 0 or d > h: continue
    t = d / h
    half = hw * (1 - t) ** 1.05 * (0.85 + 0.65 * sin(pi * t)) + 0.45
    mid = tx + lean * t * t + 1.3 * t * sin(4.2 * t + ph * 1 + a)
    v = 1 - abs(x + 0.5 - mid) / half
    if v > 0: heat = max(heat, v * (1 - 0.35 * t))
   if heat <= 0: continue
   # The core is a hot pocket low in the middle, not a band across the fire.
   qx, qy = (x + .5 - cx) / (width * 0.8), (base - height * 0.2 - y) / (height * 0.36)
   core = 1 - (qx * qx + qy * qy) ** 0.5
   val = heat * 0.55 + max(core, 0) * 0.75
   body[(x, y)] = 0 if val < 0.2 else 1 if val < 0.42 else 2 if val < 0.68 else 3 if val < 0.92 else 4
 tx, h, hw, lean, a = max(spots, key=lambda s: s[1])
 if frame % 4 in (1, 2):                              # a lick breaking off the tip
  y = int(base - h - 2 - frame % 2); x = int(tx + lean + 1.3 * sin(4.2 + ph + a))
  body[(x, y)] = 1; body[(x, y - 1)] = 0
 for (x, y), i in body.items():
  c.set(x, y, FLAME[i])
 for (x, y) in list(body):
  for dx, dy in ((1, 0), (-1, 0), (0, -1)):
   if (x + dx, y + dy) not in body: c.set(x + dx, y + dy, FLAME_EDGE)


def sparks(c, cx, base, height, frame, seed=0, n=3):
 """Sparks climbing above the fire, each on its own place in the cycle."""
 for k in range(n):
  f = (frame + k * 3 + seed) % FRAMES
  x = cx + ((jitter(k, seed) % 7) - 3) + (f // 3) * (1 if k % 2 else -1)
  y = base - height - 2 - f * 2
  if f < 6: c.set(x, y, FLAME[3] if f < 3 else FLAME[2])


def embers(c, cells, frame):
 for i, (x, y) in enumerate(cells):
  k = (i * 3 + frame) % FRAMES
  c.set(x, y, EMBER[4] if k in (0, 1) else EMBER[3] if k in (2, 5) else EMBER[2])


def block(c, x, y, w, h, face, ramp=STONE, seed=0):
 """A kerb stone seen from above and in front: a lit, rounded top and a
 darker face under it, `face` pixels deep, with its own dark edge so it
 stands apart from the stones beside it."""
 j = jitter(int(x), int(y), seed)
 mask = {}
 for yy in range(int(y - h) - 1, int(y + h + face) + 2):
  for xx in range(int(x - w) - 1, int(x + w) + 2):
   u = (xx + .5 - x) / w
   tv = (yy + .5 - y) / h
   if u * u + tv * tv <= 1:                           # the top
    tone = 5 if u < -0.15 and tv < 0.15 else 4 if u < 0.45 else 3
    if u * u + tv * tv > 0.62 and tv > 0.3: tone = 3
    if (xx * 3 + yy + j) % 11 == 0: tone -= 1
    mask[(xx, yy)] = ramp[tone]
   elif abs(u) <= 1 and y <= yy + .5 <= y + face + h * (1 - u * u) ** 0.5:
    mask[(xx, yy)] = ramp[2] if u < -0.3 else ramp[1] if u < 0.6 else ramp[0]
 for (xx, yy), col in mask.items(): c.set(xx, yy, col)
 for (xx, yy) in mask:
  for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
   if (xx + dx, yy + dy) not in mask:
    c.set(xx + dx, yy + dy, ramp[0] if dy >= 0 or dx > 0 else ramp[1])


def stone(c, x, y, rx, ry, ramp=STONE):
 block(c, x, y, rx, ry, max(1, int(ry * 0.8)), ramp)


def ring(c, cx, cy, rx, ry, n, size, ramp=STONE, back=True, seed=0):
 """The half of a stone ring behind (back) or in front of the fire, drawn
 from the far side forward so each stone overlaps the one behind it."""
 stones = []
 for k in range(n):
  a = 2 * pi * (k + 0.5) / n + seed * 0.3
  if (sin(a) < 0) != back: continue
  j = jitter(k, seed)
  s = size * (0.9 + (j % 4) * 0.07)
  stones.append((cy + ry * sin(a), cx + rx * cos(a), s))
 for y, x, s in sorted(stones):
  block(c, x, y, s, s * 0.62, max(2, int(s * 0.55)), ramp, seed + int(x))


def ash_bed(c, cx, cy, rx, ry):
 for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   u, v = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   r = u * u + v * v
   if r > 1: continue
   c.set(x, y, ASH[0] if r < 0.35 else ASH[1] if r < 0.7 else ASH[2] if jitter(x, y) % 3 else ASH[3])


def log(c, x0, y0, x1, y1, ramp=CHAR, thick=2, char=0):
 """A length of wood, lit along its top, its far `char` fraction burnt
 black where it lies in the fire, a pale cut face at the near end."""
 n = max(abs(x1 - x0), abs(y1 - y0), 1)
 for i in range(n + 1):
  x = round(x0 + (x1 - x0) * i / n); y = round(y0 + (y1 - y0) * i / n)
  burnt = i > n * (1 - char)
  for k in range(thick):
   tone = (4 if k == 0 else 3 if k < thick - 1 else 1) if thick > 2 else (3 if k == 0 else 1)
   c.set(x, y + k, CHAR[min(tone, 2)] if burnt else ramp[tone])
  if burnt and i % 3 == 0: c.set(x, y + thick - 1, EMBER[3])
 if thick > 2:                                        # the cut end
  for k in range(thick): c.set(x0, y0 + k, '#c9a878' if 0 < k < thick - 1 else '#8d6e4a')


def _out(c, flame_top, cx=None, cy=None):
 """Anchored on the middle of the fire bed rather than the canvas foot, so
 the ring sits on its own cell and seats fit round it."""
 im = c.image()
 im.info['own'] = True
 im.info['shadowMinY'] = flame_top + c.PAD
 if cy is not None:
  im.info['anchor'] = [int(cx) + c.PAD, int(cy) + 6 + c.PAD]
 return im


def hearth(v=0, frame=0):
 """The small fire: a ring of grey stones round a few burning sticks. The
 fallback wherever nothing more particular is known."""
 c = Canvas(32, 40)
 cx, cy = 16, 30
 ring(c, cx, cy, 11.5, 5.8, 10, 3.3, back=True)
 ash_bed(c, cx, cy, 8.5, 4.0)
 flame(c, cx, 29, 5.0, 24, frame)
 log(c, 9, 30, 15, 28); log(c, 23, 30, 17, 28)        # the sticks, in front
 embers(c, [(12, 30), (15, 31), (19, 30), (14, 29), (18, 31), (21, 30), (11, 29)], frame)
 sparks(c, cx, 29, 24, frame)
 ring(c, cx, cy + 0.5, 11.5, 5.8, 10, 2.9, back=False)
 return _out(c, 24, *(16, 30))


def _hollow(c, cx, cy, rx, ry, rim='#4a3b2c', floor='#3a2e24'):
 """A scooped fire bed: a darker floor inside a trodden lip."""
 for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   u, t = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   r = u * u + t * t
   if r <= 1: c.set(x, y, rim if r > 0.62 else floor)


def camp_hearth(v=0, frame=0):
 """A hunter's or herder's fire in a scooped hollow, a few big stones
 banked round it to hold the heat and a pot's weight."""
 c = Canvas(40, 42)
 cx, cy = 20, 32
 _hollow(c, cx, cy, 16, 7)
 ring(c, cx, cy, 13, 5.5, 7, 4.4, back=True, seed=2)
 ash_bed(c, cx, cy, 9, 4)
 log(c, 10, 31, 18, 33, thick=3); log(c, 30, 31, 22, 33, thick=3)
 flame(c, cx, 32, 6.5, 28, frame, seed=1, tongues=4)
 embers(c, [(14, 34), (18, 35), (21, 33), (24, 35), (26, 34), (17, 33), (23, 34)], frame)
 sparks(c, cx, 32, 28, frame, seed=1, n=4)
 w = RAMPS[WOOD7[2]]
 for px in (4, 36):                                   # forked uprights and the spit
  c.vline(px, 20, 33, w[4]); c.vline(px + 1, 20, 33, w[2])
  c.set(px - 1, 19, w[4]); c.set(px + 2, 19, w[2])
 c.hline(3, 38, 20, w[5]); c.hline(3, 38, 21, w[2])
 meat = ['#3b1c14', '#5e2b1c', '#83402a', '#a45a38', '#c07a50']
 blob(c, [(20, 22.5, 5, 2.6)], meat)
 ring(c, cx, cy + 0.5, 13, 5.5, 7, 4.0, back=False, seed=2)
 return _out(c, 24, *(20, 32))


def communal_hearth(v=0, frame=0):
 """The village's fire: a broad oval hearth kerbed with big stones, a
 clay floor baked hard inside, a tripod over it with a pot on its chain."""
 c = Canvas(58, 58)
 cx, cy = 29, 46
 ring(c, cx, cy, 23, 9.5, 14, 4.2, back=True, seed=3)
 _hollow(c, cx, cy, 19, 7.5, rim='#6b4a32', floor='#4a3325')
 ash_bed(c, cx, cy, 13, 5)
 w = RAMPS[WOOD7[1]]
 legs = [(12, 50), (46, 50), (31, 39)]                # the tripod
 apex = (29, 8)
 for lx, ly in legs[2:]:
  log(c, apex[0], apex[1], lx, ly, ramp=[w[0], w[1], w[2], w[3], w[4]], thick=1)
 for lx, ly in [(10, 40), (48, 42), (22, 44), (37, 45)]:
  log(c, lx, ly, cx + (lx - cx) // 3, cy - 1, thick=3)
 # The pot on its chain, over the fire.
 for y in range(apex[1] + 1, 24): c.set(29 if y % 2 else 30, y, '#3a3d3e')
 blob(c, [(29.5, 29, 6.5, 5.2)], ['#1a1614', '#2a2420', '#3e342d', '#54473c', '#6c5c4d', '#877563'])
 c.hline(24, 35, 24, '#2a2420'); c.hline(25, 34, 25, '#54473c')
 flame(c, cx, 46, 9.5, 20, frame, seed=2, tongues=5)
 embers(c, [(20, 47), (24, 48), (28, 47), (33, 48), (37, 47), (26, 46), (31, 46), (35, 46)], frame)
 sparks(c, cx, 40, 22, frame, seed=2, n=4)
 for lx, ly in legs[:2]:
  log(c, apex[0], apex[1], lx, ly, ramp=[w[0], w[1], w[2], w[3], w[4]], thick=1)
 c.hline(27, 31, apex[1], w[4]); c.set(29, apex[1] - 1, w[3])  # lashing
 ring(c, cx, cy + 0.5, 23, 9.5, 14, 3.8, back=False, seed=3)
 return _out(c, 34, *(29, 46))


def long_fire(v=0, frame=0):
 """A northern long hearth: a stone-kerbed trench of fire the length of a
 hall floor, logs laid end to end along it."""
 c = Canvas(72, 44)
 cx, cy = 36, 34
 k = STONE
 back = [(x, cy - 5, 3.4) for x in range(6, 67, 6)]
 front = [(x + 3, cy + 5, 3.2) for x in range(5, 64, 6)]
 for x, y, s in back: block(c, x, y, s, s * 0.6, 2, k, x)
 for x, y, s in [(3, cy, 3.4), (69, cy, 3.4)]: block(c, x, y, s * 0.8, s * 0.8, 2, k, x)
 for y in range(cy - 3, cy + 4):                      # the trench
  for x in range(7, 66):
   c.set(x, y, ASH[0] if abs(y - cy) < 2 else ASH[1] if jitter(x, y) % 3 else ASH[2])
 for x0 in (9, 27, 45):
  log(c, x0, cy, x0 + 17, cy - 1, thick=3)
 for i, fx in enumerate((18, 36, 54)):
  flame(c, fx, cy + 1, 5.0 if i != 1 else 6.0, 17 if i != 1 else 22, frame, seed=i + 3, tongues=3)
 embers(c, [(x, cy + 2 - (x % 3 == 0)) for x in range(10, 64, 4)], frame)
 sparks(c, 36, cy + 1, 22, frame, seed=4, n=4)
 for x, y, s in front: block(c, x, y, s, s * 0.6, 2, k, x + 1)
 return _out(c, 24, *(36, 34))


def council_fire(v=0, frame=0):
 """A woodland people's fire: long logs laid like the spokes of a wheel and
 pushed inward as they burn, in a ring of trodden earth. No kerb."""
 c = Canvas(56, 50)
 cx, cy = 28, 38
 _hollow(c, cx, cy, 24, 10, rim='#6a5a3c', floor='#5e4d34')
 ash_bed(c, cx, cy, 11, 4.5)
 w = RAMPS[WOOD7[0]]
 bark = [w[0], w[1], w[2], w[3], w[4], w[5]]
 spokes = [(3, 37), (11, 30), (45, 30), (53, 37)]
 for x, y in spokes: log(c, x, y, cx + (x - cx) // 4, cy - 2 + (y - cy) // 4, ramp=bark, thick=4, char=0.3)
 flame(c, cx, 38, 8.5, 30, frame, seed=5, tongues=4)
 embers(c, [(22, 40), (26, 41), (30, 40), (34, 41), (24, 39), (32, 39)], frame)
 sparks(c, cx, 38, 30, frame, seed=5, n=5)
 for x, y in [(12, 47), (44, 47)]:                    # the two logs toward us
  log(c, x, y - 2, cx + (x - cx) // 4, cy + 1, ramp=bark, thick=4, char=0.3)
 return _out(c, 26, *(28, 38))


def earth_oven(v=0, frame=0):
 """A Pacific earth oven: food on hot stones under a dome of leaves and
 earth, steam finding its way out, and beside it the fire heating the next
 load of stones."""
 c = Canvas(58, 44)
 leaf = ['#1c2e17', '#2a4420', '#3c5e2a', '#527a35', '#6c9642', '#8cb356']
 earth = ['#2a1f16', '#3c2d22', '#54402f', '#6e5640', '#8a6f52', '#a38866']
 blob(c, [(22, 34, 18, 9)], earth)                    # the dome of earth
 for k, (x, y, rx, a) in enumerate([(8, 38, 5, 1), (15, 41, 6, 0), (27, 41, 6, 0),
                                    (36, 38, 5, -1), (10, 30, 4, 1), (33, 30, 4, -1)]):
  for i in range(-rx, rx + 1):                        # banana leaves at the edges
   yy = y + (i * a) // 3
   half = max(1, round(2.2 * (1 - (i / (rx + 1)) ** 2)))
   for j in range(-half, half + 1):
    c.set(x + i, yy + j, leaf[4] if j < 0 else leaf[3] if j == 0 else leaf[2])
   c.set(x + i, yy, leaf[5] if i % 2 else leaf[4])    # the midrib
 for k, (sx, sy) in enumerate([(13, 27), (22, 25), (31, 28)]):  # steam
  for i in range(2):
   f = (frame + k * 3 + i * 4) % FRAMES
   yy = sy - f * 2
   xx = sx + round(1.5 * sin(f * 0.8 + k))
   col = '#e2e0d8' if f < 3 else '#c8c6be' if f < 6 else '#a9a79f'
   if f < 7:
    c.rect(xx, yy - 1, xx + 1, yy, col)
    if f < 4: c.set(xx - 1, yy, col)
 cx, cy = 48, 37
 ash_bed(c, cx, cy, 7, 3)
 flame(c, cx, 36, 4.2, 16, frame, seed=6, tongues=3)
 for x, y in [(43, 37), (47, 38), (51, 37), (45, 40), (50, 40)]:
  block(c, x, y, 2.4, 1.5, 1, STONE, x)
 sparks(c, cx, 36, 16, frame, seed=6, n=2)
 return _out(c, 26, *(30, 36))


def three_stone(v=0, frame=0):
 """Three stones under a round pot, the fire fed by sticks pushed in from
 the sides and moved inward as they burn."""
 c = Canvas(40, 40)
 cx = 20
 ash_bed(c, cx, 33, 12, 4.5)
 for p, q in [((3, 32), (15, 33)), ((37, 31), (25, 33)), ((18, 38), (20, 34))]:
  log(c, p[0], p[1], q[0], q[1], thick=2)
 block(c, 20, 27, 4, 2.6, 3, STONE, 1)               # the back stone
 flame(c, 13, 33, 3.2, 12, frame, seed=1, tongues=2)
 flame(c, 27, 33, 3.2, 12, frame, seed=4, tongues=2)
 clay = ['#2d1a13', '#4a2a1c', '#6b3f27', '#8d5836', '#ab7149', '#c58f63', '#dcb086']
 blob(c, [(20, 22, 9.5, 8.2)], clay)                  # the pot
 for x in range(12, 29):                              # soot on its underside
  for y in range(25, 31):
   if c.get(x, y) and (y > 27 or (x + y) % 2): c.set(x, y, '#2a1d17' if y > 27 else c.get(x, y))
 for y in range(12, 17):                              # its mouth
  for x in range(13, 28):
   u, t = (x + .5 - 20) / 6.5, (y + .5 - 14.5) / 2.4
   r = u * u + t * t
   if r <= 1: c.set(x, y, clay[5] if r > 0.5 and t < 0.2 else clay[3] if r > 0.5 else clay[0])
 f = frame
 for i, (sx, sy) in enumerate([(19, 10), (21, 7), (20, 4)]):  # steam
  if (i + f) % 4 != 3: c.set(sx + [0, 1, 0, -1][(i + f) % 4], sy - (f % 2), '#dcd8cc')
 block(c, 10, 34, 4.4, 2.8, 3, STONE, 2); block(c, 30, 34, 4.4, 2.8, 3, STONE, 3)
 flame(c, 20, 37, 2.8, 8, frame, seed=2, tongues=2)
 return _out(c, 26, *(20, 33))


FIRES_B = {
 'hearth': hearth,
 'camp-hearth': camp_hearth,
 'communal-hearth': communal_hearth,
 'long-fire': long_fire,
 'council-fire': council_fire,
 'earth-oven': earth_oven,
 'three-stone-hearth': three_stone,
}
