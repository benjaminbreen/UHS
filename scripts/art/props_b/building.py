"""The shared building vocabulary: wall, roof, door, ground.

Everything built on the map is drawn the same way — a wall seen square on with
a good deal of roof above it, lit from the upper left, the eaves throwing a
line of shadow down onto the wall. A region is a choice of materials.
"""
from math import cos, pi, sin
from .core import Canvas, RAMPS, jitter, soft_outline, grass

DIRT = RAMPS['buffclay7']


def _wall(c, x0, x1, top, base, kind, p):
 """A wall: lit at the left, shaded at the right, dark where it meets the
 ground. Flat panels of one tone are what make a building read as cardboard."""
 span = max(x1 - x0, 1)
 for y in range(top, base + 1):
  down = (y - top) / max(base - top, 1)
  for x in range(x0, x1 + 1):
   u = (x - x0) / span
   tone = 5 if u < 0.22 else 4 if u < 0.62 else 3 if u < 0.88 else 2
   if down > 0.86: tone -= 1                      # the ground takes the light
   if kind == 'plank':
    if (x - x0) % 6 == 0: tone -= 2                # the gap between boards
    elif (x - x0) % 6 == 1: tone += 1              # and the lit edge beside it
    if jitter(x, y // 4) % 11 == 0: tone -= 1      # grain
   elif kind == 'wattle':
    if (x + y) % 3 == 0: tone -= 1
    if y % 2 and (x + y // 2) % 5 == 0: tone -= 1
   elif kind == 'mud':
    if y % 6 == 0: tone -= 2
    if jitter(x // 2, y // 2) % 5 == 0: tone -= 1
   elif kind == 'brick':
    course = y // 3
    if y % 3 == 0: tone -= 2
    elif (x + course * 5) % 8 == 0: tone -= 2
    elif jitter(x, course) % 4 == 0: tone += 1
   elif kind == 'stone':
    course = y // 7
    if y % 7 == 0 or (x + course * 5) % 11 == 0: tone -= 2
    elif jitter(x // 3, course) % 3 == 0: tone += 1
   elif kind == 'sheet':
    tone = 5 if (x - x0) % 5 < 2 else 3 if (x - x0) % 5 < 4 else 2
    if y % 11 == 0: tone -= 1
   c.set(x, y, p[max(min(tone, 6), 0)])
 for y in range(top, base + 1):                    # the corners turn away
  c.set(x0, y, p[2]); c.set(x1, y, p[1])
 c.hline(x0, x1, base, p[1])
 c.hline(x0 + 1, x1 - 1, base - 1, p[2])


def _roof(c, x0, x1, ridge, eaves, kind, p):
 """A pitched roof seen from above and in front: most of a small building.

 The near slope is what you see, so it carries the texture; the ridge takes
 the light and the eaves throw a shadow onto the wall below.
 """
 rows = max(eaves - ridge, 1)
 for i in range(rows + 1):
  y = ridge + i
  t = i / rows
  over = round(t * 3)
  a, b = x0 - over, x1 + over
  for x in range(a, b + 1):
   u = (x - a) / max(b - a, 1)
   tone = 5 if u < 0.30 else 4 if u < 0.70 else 3
   tone -= round(t * 1.4)                          # the slope falls away
   if kind == 'tile':
    if i % 2 == 0: tone -= 1
    if (x + i * 2) % 5 == 0: tone -= 1
   elif kind == 'shingle':
    if i % 3 == 0: tone -= 1
    if (x + (i // 3) * 3) % 7 == 0: tone -= 2
   elif kind == 'thatch':
    if jitter(x, i) % 3 == 0: tone -= 1
    if jitter(x * 3, i) % 9 == 0: tone += 1
   elif kind == 'sheet':
    tone = (5 if (x - a) % 5 < 2 else 3) - round(t)
   c.set(x, y, p[max(min(tone, 6), 0)])
  c.set(a, y, p[1]); c.set(b, y, p[1])
 mid = (x0 + x1) // 2
 c.hline(mid - (x1 - x0) // 3, mid + (x1 - x0) // 3, ridge, p[6])
 c.hline(x0 - 3, x1 + 3, eaves, p[1])              # the eaves themselves
 if kind == 'thatch':
  for x in range(x0 - 3, x1 + 4):                  # a ragged thatch edge
   if jitter(x, 7) % 3 == 0: c.set(x, eaves + 1, p[2])
 c.hline(x0 - 1, x1 + 1, eaves + 1, p[0])          # and their shadow on the wall
 c.hline(x0, x1, eaves + 2, p[0] if kind != 'sheet' else p[1])


def _door(c, x0, x1, top, base, p, cut='moon', dark='#181310'):
 """A door in a recess: dark reveal at the head and hinge side, lit frame."""
 for y in range(top, base + 1):                    # the reveal behind it
  c.hline(x0, x1, y, dark)
 for y in range(top + 1, base + 1):                # the door itself, inset
  for x in range(x0 + 1, x1):
   tone = 4 if (x - x0) % 5 else 2
   if jitter(x, y // 3) % 9 == 0: tone -= 1
   c.set(x, y, p[max(tone, 1)])
 c.hline(x0 + 1, x1 - 1, top + 1, p[5])            # its lit top rail
 c.hline(x0 + 1, x1 - 1, base, p[1])
 for y in (top + 4, base - 4):                     # ledges across the boards
  c.hline(x0 + 1, x1 - 1, y, p[2])
  c.hline(x0 + 1, x1 - 1, y + 1, p[5])
 m = RAMPS['blackiron7']
 for y in (top + 5, base - 5):                     # strap hinges
  c.hline(x0 + 1, x0 + 6, y, m[4]); c.hline(x0 + 1, x0 + 6, y + 1, m[1])
 c.set(x1 - 3, (top + base) // 2, m[5])            # the latch
 c.set(x1 - 3, (top + base) // 2 + 1, m[1])
 mid = (x0 + x1) // 2
 if cut == 'moon':
  for dy, half in ((0, 2), (1, 3), (2, 3), (3, 2)):
   c.hline(mid - half, mid + half, top + 6 + dy, dark)
  c.hline(mid - 1, mid + 1, top + 5, dark)
 elif cut == 'slot':
  for y in range(top + 5, top + 11):
   c.hline(mid - 1, mid + 1, y, dark)


def _ground(c, cx, base, width, dust=DIRT):
 """Trodden earth, and a few weeds where nobody walks."""
 for x in range(cx - width, cx + width + 1):
  u = (x - cx) / max(width, 1)
  for k in range(round(4 * (1 - u * u)) + 1):
   tone = 3 if k < 2 else 2 if k < 3 else 1
   if jitter(x, k) % 5 == 0: tone -= 1
   c.set(x, base + k, dust[max(tone, 1)])


def _flies(c, frame, spots):
 """One pixel each, going round. Only in the warm half of the year on the map."""
 for i, (cx, cy, rx, ry, turn) in enumerate(spots):
  a = (frame / 4 + i / max(len(spots), 1)) * 2 * pi * turn
  c.set(round(cx + cos(a) * rx), round(cy + sin(a) * ry), '#241f18')
