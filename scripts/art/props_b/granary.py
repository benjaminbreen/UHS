"""Granaries: where a farm keeps what it grew.

Four builds. After the house this is the most important structure on a
holding, and the one that differs most from place to place, so each carries
its own variations rather than a palette swap.
"""
from math import cos, hypot, pi, sin
from .building import DIRT, _door, _ground, _roof, _wall
from .core import Canvas, RAMPS, belly, jitter, revolve, soft_outline, grass
from .workshop import WOOD7, streak

THATCH = ['straw', 'wicker7', 'linen7']
MUD = ['terracotta7', 'buffclay7', 'redearth7']


def _staddle(c, x, y, p, cap=10):
 """A staddle stone: a stem with a mushroom cap the rats cannot climb past."""
 for k in range(12):                               # the stem, spreading down
  half = 3 + k // 4
  for sx in range(x - half, x + half + 1):
   u = (sx - x) / max(half, 1)
   tone = 5 if u < -0.3 else 4 if u < 0.3 else 2
   if k > 9: tone -= 1
   c.set(sx, y + 5 + k, p[max(tone, 1)])
 for k, half in enumerate((cap - 3, cap - 1, cap, cap - 2)):
  for sx in range(x - half, x + half + 1):
   u = (sx - x) / half
   tone = 6 if k == 0 and u < 0.3 else 5 if k < 2 else 3 if k < 3 else 1
   c.set(sx, y + k, p[max(tone, 1)])
 c.hline(x - cap + 2, x + cap - 2, y + 4, p[1])


def _thatch_cap(c, cx, base, half, top, p, ridge=True):
 """A conical cap of thatch or grass, bound at the point."""
 rows = base - top
 for i in range(rows + 1):
  y = top + i
  w = round(half * (i / rows) ** 0.82)
  for x in range(cx - w, cx + w + 1):
   u = (x - cx) / max(w, 1)
   tone = 5 if u < -0.35 else 4 if u < 0.35 else 3
   if jitter(x, i) % 3 == 0: tone -= 1
   if jitter(x * 2, i) % 11 == 0: tone += 1
   c.set(x, y, p[max(min(tone, 6), 1)])
  c.set(cx - w, y, p[2]); c.set(cx + w, y, p[1])
 for x in range(cx - half - 2, cx + half + 3):     # the eaves, ragged
  if jitter(x, 5) % 3: c.set(x, base + 1, p[2])
 c.hline(cx - half - 1, cx + half + 1, base, p[1])
 if ridge:
  for k in range(3):
   c.set(cx, top - k - 1, p[4 + (k == 0)])
  c.set(cx - 1, top - 1, p[2]); c.set(cx + 1, top - 1, p[2])


def staddle_granary(v=0, frame=0):
 """A boarded box lifted clear of the ground on mushroom stones."""
 c = Canvas(90, 98)
 w = RAMPS[WOOD7[v]]
 stone = RAMPS[['granite', 'limestone', 'sandstone'][v]]
 roof_kind = ['thatch', 'tile', 'shingle'][v]
 rp = RAMPS[[ 'straw', 'tile', 'walnut7'][v]]
 legs = [(18, 74), (45, 74), (72, 74)] if v != 2 else [
  (16, 74), (37, 74), (58, 74), (78, 74)]
 for x, y in legs:
  _staddle(c, x, y, stone)
 x0, x1 = 8, 81
 _roof(c, x0, x1, 4, 30, roof_kind, rp)
 _wall(c, x0, x1, 31, 70, 'plank', w)
 for bx in range(x0 + 6, x1, 14):                  # the frame behind the boards
  for y in range(31, 71): c.set(bx, y, w[2])
  c.set(bx, 31, w[5])
 for y in (40, 62):                                # rails across it
  c.hline(x0, x1, y, w[5]); c.hline(x0, x1, y + 1, w[2])
 _door(c, 34, 55, 40, 68, w, 'slot')
 for y in range(71, 75):                           # the floor it stands on
  c.hline(x0 - 2, x1 + 2, y, w[3] if y == 71 else w[1] if y < 74 else w[0])
 for x in range(x0, x1 + 1):                       # and the dark beneath it
  if jitter(x, 2) % 4: c.set(x, 75, '#2b241d')
 if v != 1:
  for i in range(16):                              # a ladder up to the door
   y = 70 + i
   c.set(58 + i // 2, y, w[4]); c.set(67 + i // 2, y, w[3])
   if i % 4 == 0: c.hline(58 + i // 2, 67 + i // 2, y, w[5])
 _ground(c, 45, 90, 36)
 soft_outline(c, w[0], w[2])
 grass(c, [(2, 95, 3), (84, 95, 2)])
 return c.image()


def mud_silo(v=0, frame=0):
 """Round mud granaries under conical thatch, taller than they are wide."""
 c = Canvas(88, 96)
 p = RAMPS[MUD[v]]
 tp = RAMPS[THATCH[v]]
 # One big store, or a big one with a smaller beside it. The far one is drawn
 # first and a shade darker, so it sits behind.
 silos = [[(44, 21, 44)],
          [(30, 18, 38), (62, 14, 30)],
          [(32, 20, 42), (66, 13, 26)]][v]
 for i, (cx, half, height) in enumerate(silos):
  behind = i > 0
  base = 88 - (6 if behind else 0)
  top = base - height
  prof = {y: half - max(0, (y - (base - 8))) * 0.4 -
             max(0, (top + 6 - y)) * 0.35 for y in range(top, base + 1)}
  revolve(c, cx, prof, p, foot=half * 0.36,
          base=-0.10 if behind else 0.0)
  for y in range(top, base + 1):                   # courses of hand-laid mud
   if (y - top) % 8: continue
   for x in range(cx - half, cx + half + 1):
    if c.get(x, y): c.set(x, y, p[2])
    if c.get(x, y - 1) and x < cx: c.set(x, y - 1, p[5])
  for x in range(cx - half, cx + half + 1):        # and the hand of the builder
   for y in range(top, base + 1):
    if c.get(x, y) and jitter(x // 3, y // 4) % 11 == 0:
     c.set(x, y, p[5] if x < cx else p[2])
  _thatch_cap(c, cx, top + 1, half + 6, top - (18 if not behind else 14), tp)
  dy = top + height // 3                           # the filling hole, high up
  hw = 4 if behind else 5
  for y in range(dy, dy + hw * 2):
   for x in range(cx - hw, cx + hw + 1):
    if not c.get(x, y): continue
    t = (y - dy) / (hw * 2)
    c.set(x, y, '#2a2018' if t < 0.2 else '#171109')
  c.hline(cx - hw - 1, cx + hw + 1, dy - 1, p[6])
  c.hline(cx - hw, cx + hw, dy + hw * 2, p[2])
  if not behind:
   ow = RAMPS['oak7']                              # its shutter, stood aside
   for k in range(14):
    x = cx + half - 6 + k // 5
    c.set(x, base - 14 + k, ow[5]); c.set(x + 1, base - 14 + k, ow[3])
    c.set(x + 2, base - 14 + k, ow[1])
   c.hline(cx + half - 6, cx + half - 3, base - 14, ow[6])
 _ground(c, 44, 89, 34)
 soft_outline(c, p[0], p[2])
 grass(c, [(1, 93, 3), (82, 93, 2)])
 return c.image()


def stilt_granary(v=0, frame=0):
 """A plank box on posts with rat guards: the rice barn of monsoon Asia."""
 c = Canvas(94, 102)
 w = RAMPS[WOOD7[v]]
 rp = RAMPS[['straw', 'tile', 'straw'][v]]
 roof_kind = ['thatch', 'tile', 'thatch'][v]
 posts = [(14, 96), (38, 96), (60, 96), (82, 96)]
 guard = v != 2
 for x, y in posts:                                # the posts, and their guards
  for k in range(26):
   yy = y - k
   c.set(x, yy, w[5]); c.set(x + 1, yy, w[3]); c.set(x + 2, yy, w[1])
  if guard:
   for k, half in enumerate((7, 9, 10, 8)):
    for sx in range(x - half + 1, x + half + 2):
     u = (sx - x - 1) / half
     tone = 6 if k == 0 and u < 0.25 else 5 if k < 2 else 3 if k < 3 else 1
     c.set(sx, y - 28 - k, w[max(tone, 1)])
  c.hline(x - 1, x + 3, y, w[0])
 deck = 68
 for y in range(deck, deck + 4):                   # the floor it sits on
  c.hline(8, 86, y, w[4] if y == deck else w[2] if y < deck + 3 else w[0])
 x0, x1 = 10, 84
 _roof(c, x0 - 4, x1 + 4, 2, 34, roof_kind, rp)
 _wall(c, x0, x1, 35, deck - 1, 'plank', w)
 for bx in range(x0 + 8, x1, 16):
  for y in range(35, deck): c.set(bx, y, w[2])
  c.set(bx, 35, w[5])
 _door(c, 38, 58, 44, deck - 3, w, 'slot')
 if v != 1:
  for i in range(22):                              # a notched log ladder
   y = deck + i
   c.set(60 + i // 3, y, w[4]); c.set(63 + i // 3, y, w[2])
   if i % 4 == 0: c.hline(60 + i // 3, 64 + i // 3, y, w[5])
 _ground(c, 47, 96, 38)
 soft_outline(c, w[0], w[2])
 grass(c, [(2, 100, 3), (88, 100, 2)])
 return c.image()


def clay_silo(v=0, frame=0):
 """A bulbous clay store with a lid and a drawing hole: the oldest of them."""
 c = Canvas(78, 90)
 p = RAMPS[MUD[v]]
 w = RAMPS['oak7']
 cx = 36.0
 prof = belly(18, 82, [14.0, 26.0, 30.0, 28.0, 21.0])
 if v == 1:                                        # a straight-sided bin
  prof = belly(18, 82, [22.0, 26.0, 27.0, 26.0, 24.0])
 revolve(c, cx, prof, p, foot=9)
 for y in range(18, 83):                           # plaster coats, hand-smoothed
  if (y - 18) % 11: continue
  for x in range(4, 68):
   if c.get(x, y): c.set(x, y, p[2])
 for x in range(4, 68):
  for y in range(18, 83):
   if c.get(x, y) and jitter(x // 4, y // 4) % 9 == 0:
    c.set(x, y, p[5] if x < cx else p[2])
 for x in range(int(cx - 15), int(cx + 16)):       # the mouth at the top
  u = (x - cx) / 15
  if abs(u) > 1: continue
  c.set(x, 17, p[6] if u < -0.2 else p[4] if u < 0.6 else p[2])
  c.set(x, 18, p[2])
 if v != 2:                                        # a board lid on it
  for y in range(12, 18):
   for x in range(int(cx - 14 + (y - 12) * 0.6), int(cx + 15 - (y - 12) * 0.6)):
    c.set(x, y, w[4] if (x + y) % 6 else w[2])
  c.hline(int(cx - 14), int(cx + 14), 12, w[6])
  c.set(int(cx), 10, w[3]); c.set(int(cx) + 1, 10, w[5])
  c.set(int(cx), 11, w[2]); c.set(int(cx) + 1, 11, w[3])
 else:
  for y in range(13, 18):                          # or open, with grain in it
   for x in range(int(cx - 13 + (y - 13)), int(cx + 14 - (y - 13))):
    c.set(x, y, RAMPS['straw'][4] if (x + y) % 3 else RAMPS['straw'][3])
 for y in range(66, 74):                           # the drawing hole, low down
  for x in range(int(cx) - 6, int(cx) + 7):
   if c.get(x, y): c.set(x, y, '#1b1410' if y < 72 else p[2])
 c.hline(int(cx) - 7, int(cx) + 7, 65, p[6])
 for x in range(int(cx) - 5, int(cx) + 6):         # grain spilt beneath it
  if jitter(x, 3) % 2: c.set(x, 74, RAMPS['straw'][4])
 for i in range(16):                               # a ladder leaning on it
  y = 80 - i
  c.set(62 + i // 4, y, w[4]); c.set(66 + i // 4, y, w[2])
  if i % 4 == 0: c.hline(62 + i // 4, 66 + i // 4, y, w[5])
 _ground(c, 36, 84, 28)
 soft_outline(c, p[0], p[2])
 grass(c, [(1, 88, 3), (72, 88, 2)])
 return c.image()


GRANARY = {
 'granary-staddle': staddle_granary,
 'granary-mud': mud_silo,
 'granary-stilt': stilt_granary,
 'granary-clay': clay_silo,
}
