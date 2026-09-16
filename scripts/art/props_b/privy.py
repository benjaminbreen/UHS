"""Privies: six builds sharing one vocabulary of roof, wall and door.

Drawn the way the buildings are — a wall seen square on with a good deal of
roof above it, lit from the upper left, with the eaves throwing a line of
shadow down onto the wall. A region is a choice of materials, not a redraw.
"""
from .building import DIRT, _door, _flies, _ground, _roof, _wall
from .core import Canvas, RAMPS, jitter, soft_outline, grass

def plank_shed(v=0, frame=0):
 """A board shed over a pit: the default almost everywhere, almost always."""
 c = Canvas(52, 76)
 wall_kind = ['plank', 'wattle', 'sheet'][v]
 w = RAMPS[['oak7', 'ash7', 'galvanised7'][v]]
 roof_kind = ['shingle', 'thatch', 'sheet'][v]
 rp = RAMPS[['walnut7', 'straw', 'galvanised7'][v]]
 x0, x1 = 8, 43
 _roof(c, x0, x1, 4, 20, roof_kind, rp)
 _wall(c, x0, x1, 21, 68, wall_kind, w)
 _door(c, 17, 34, 30, 66, w, 'moon' if v == 0 else 'slot')
 for x in (x0, x1):                                # corner posts
  for y in range(21, 69):
   c.set(x, y, w[2] if x == x0 else w[1])
 _ground(c, 26, 68, 23)
 for x in range(1, 9):                             # the spoil heap behind
  h = 4 - abs(x - 5) // 2
  for k in range(h):
   c.set(x, 66 - k, DIRT[3 if k else 2])
 _flies(c, frame, [(26, 58, 24, 10, 1.0), (26, 50, 18, 14, -1.0)])
 soft_outline(c, w[0], w[2])
 grass(c, [(2, 73, 3), (47, 73, 2)])
 return c.image()


def reed_screen(v=0, frame=0):
 """No building at all: a screen in a horseshoe round a pit."""
 c = Canvas(58, 58)
 p = RAMPS[['wicker7', 'straw', 'linen7'][v]]
 w = RAMPS['walnut7']
 for py in range(18, 52):                          # the pit's own screen wall
  for x in list(range(6, 24)) + list(range(36, 53)):
   u = (x - 6) / 46
   tone = 5 if u < 0.25 else 4 if u < 0.65 else 3
   if v == 2:
    if (x + py // 3) % 7 == 0: tone -= 2           # cloth, hanging in folds
    elif (x + py // 3) % 7 == 1: tone += 1
   else:
    if x % 3 == 0: tone -= 2                       # reed, stem by stem
    elif x % 3 == 1: tone += 1
   if py % 7 == 0: tone -= 1
   c.set(x, py, p[max(min(tone, 6), 1)])
 for y in range(18, 36):                           # the far side, seen over the gap
  for x in range(24, 36):
   tone = 3 if x % 3 else 1                        # darker: it is in shade
   if y % 7 == 0: tone -= 1
   c.set(x, y, p[max(tone, 1)])
 c.hline(24, 35, 18, p[4]); c.hline(24, 35, 35, p[0])
 for y in range(18, 52):                           # the cut ends at the opening
  c.set(23, y, p[1]); c.set(36, y, p[2])
 c.hline(6, 23, 18, p[6]); c.hline(36, 52, 18, p[6])
 c.hline(6, 23, 51, p[1]); c.hline(36, 52, 51, p[1])
 for y in (24, 34, 44):                            # binding round the screen
  for x in list(range(6, 24)) + list(range(36, 53)):
   c.set(x, y, p[2] if x % 2 else p[5])
 for px in (5, 22, 37, 52):                        # the poles it is lashed to
  for y in range(14, 54):
   c.set(px, y, w[5]); c.set(px + 1, y, w[3]); c.set(px + 2, y, w[1])
  c.set(px, 13, w[4]); c.set(px + 1, 12, w[2])
  for y in (24, 34, 44):
   c.hline(px, px + 2, y, RAMPS['rope'][2])
 for y in range(36, 52):                           # the pit, seen through the gap
  for x in range(25, 35):
   t = (y - 36) / 16
   c.set(x, y, '#3a2f22' if t < 0.3 else '#2a2118' if t < 0.7 else '#1d1711')
 _ground(c, 29, 51, 26)
 _flies(c, frame, [(29, 44, 22, 8, 1.0), (29, 38, 15, 12, -1.0)])
 soft_outline(c, p[0], p[2])
 grass(c, [(1, 56, 3), (54, 56, 2)])
 return c.image()


def bench_latrine(v=0, frame=0):
 """A stone bench of keyhole seats over a running channel: the public one."""
 c = Canvas(72, 60)
 s = RAMPS[['granite', 'sandstone', 'limestone'][v]]
 _wall(c, 2, 69, 6, 30, 'stone', s)                # the wall behind the bench
 c.hline(2, 69, 6, s[6]); c.hline(2, 69, 7, s[4])
 for y in range(30, 40):                           # the bench slab
  t = (y - 30) / 9
  for x in range(4, 68):
   u = (x - 4) / 63
   tone = 6 if t < 0.25 else 5 if t < 0.6 else 4
   if u > 0.75: tone -= 1
   if jitter(x // 3, y) % 6 == 0: tone -= 1
   c.set(x, y, s[max(tone, 1)])
 c.hline(4, 67, 30, s[6]); c.hline(4, 67, 39, s[2])
 for hx in (15, 36, 57):                           # the keyhole openings
  for y in range(32, 38):
   half = 4 if y < 36 else 3
   for x in range(hx - half, hx + half + 1):
    c.set(x, y, '#15110e' if y < 37 else '#221b15')
  c.hline(hx - 4, hx + 4, 31, s[6])
  c.set(hx - 5, 33, s[3]); c.set(hx + 5, 33, s[2])
 for y in range(40, 50):                           # the front of the bench
  for x in range(4, 68):
   u = (x - 4) / 63
   tone = 4 if u < 0.3 else 3 if u < 0.75 else 2
   if y % 5 == 0: tone -= 1
   if jitter(x, y // 5) % 7 == 0: tone += 1
   c.set(x, y, s[max(tone, 1)])
 c.hline(4, 67, 40, s[5])
 for x in range(6, 66):                            # the channel running under it
  c.set(x, 50, s[1]); c.set(x, 51, '#141a19'); c.set(x, 52, '#0f1414')
 for i in range(3):                                # water going down it
  x = 8 + ((frame * 6 + i * 19) % 54)
  c.set(x, 51, RAMPS['water'][4]); c.set(x + 1, 51, RAMPS['water'][3])
 c.hline(4, 67, 53, s[2])
 _ground(c, 36, 54, 33, RAMPS['granite'])
 soft_outline(c, s[0], s[2])
 return c.image()


def stone_privy(v=0, frame=0):
 """A masonry privy block with a chute at the side: the town house's own."""
 c = Canvas(56, 74)
 s = RAMPS[['granite', 'sandstone', 'limestone'][v]]
 rp = RAMPS[['tile', 'tile', 'walnut7'][v]]
 x0, x1 = 6, 43
 _roof(c, x0, x1, 2, 20, 'tile' if v != 2 else 'shingle', rp)
 _wall(c, x0, x1, 21, 66, 'stone', s)
 _door(c, 15, 32, 30, 64, RAMPS['walnut7'], 'slot')
 for y in range(26, 32):                           # a vent slit high up
  c.hline(36, 38, y, '#161210')
 c.set(35, 26, s[5]); c.set(39, 26, s[3])
 for y in range(30, 62):                           # the chute down the side
  for x in range(44, 51):
   u = (x - 44) / 7
   c.set(x, y, s[4] if u < 0.4 else s[2])
  if y % 6 == 0: c.hline(44, 50, y, s[1])
 c.hline(44, 50, 29, s[6])
 for x in range(45, 50):                           # what runs out of it
  c.set(x, 62, '#2e2a20'); c.set(x, 63, '#211e17')
 _ground(c, 26, 66, 26, RAMPS['granite'])
 _flies(c, frame, [(47, 58, 9, 6, 1.0), (26, 60, 22, 9, -1.0)])
 soft_outline(c, s[0], s[2])
 grass(c, [(1, 71, 3), (52, 71, 2)])
 return c.image()


def night_soil(v=0, frame=0):
 """A shed with a hatch at the back: what comes out of it goes on the fields."""
 c = Canvas(60, 74)
 w = RAMPS[['walnut7', 'oak7', 'ash7'][v]]
 rp = RAMPS[['tile', 'walnut7', 'galvanised7'][v]]
 x0, x1 = 6, 41
 _roof(c, x0, x1, 2, 20, ['tile', 'shingle', 'sheet'][v], rp)
 _wall(c, x0, x1, 21, 66, 'plank', w)
 _door(c, 14, 31, 30, 64, w, 'slot')
 for y in range(34, 50):                           # the collection hatch
  for x in range(42, 52):
   u = (x - 42) / 10
   tone = 4 if u < 0.4 else 3 if u < 0.8 else 2
   if (x + y) % 5 == 0: tone -= 1
   c.set(x, y, w[max(tone, 1)])
 c.hline(42, 51, 34, w[6]); c.hline(42, 51, 49, w[1])
 m = RAMPS['blackiron7']
 c.hline(42, 51, 38, m[3]); c.hline(42, 51, 46, m[3])
 c.set(50, 42, m[5]); c.set(50, 43, m[1])
 tub = RAMPS['oak7']                               # a pail and its yoke, waiting
 for y in range(54, 66):
  for x in range(44, 56):
   u = (x - 44) / 12
   c.set(x, y, tub[5] if u < 0.25 else tub[4] if u < 0.7 else tub[2])
 c.hline(44, 55, 54, tub[6]); c.hline(44, 55, 65, tub[1])
 for y in (57, 62):
  c.hline(44, 55, y, m[4]); c.hline(44, 55, y + 1, m[1])
 for x in range(46, 54): c.set(x, 52, tub[3]); c.set(x, 53, tub[1])
 c.set(45, 53, tub[2]); c.set(54, 53, tub[2])
 _ground(c, 24, 66, 24)
 _flies(c, frame, [(24, 58, 23, 9, 1.0), (48, 50, 10, 7, -1.0)])
 soft_outline(c, w[0], w[2])
 grass(c, [(1, 71, 3), (57, 71, 2)])
 return c.image()


def brick_outhouse(v=0, frame=0):
 """Brick, a slate roof, a cistern and a soil pipe: the plumbed century."""
 c = Canvas(58, 78)
 bp = RAMPS[['rustred7', 'buffclay7', 'galvanised7'][v]]
 rp = RAMPS[['pewter7', 'pewter7', 'galvanised7'][v]]
 m = RAMPS['blackiron7']
 x0, x1 = 6, 43
 _roof(c, x0, x1, 8, 20, 'sheet' if v == 2 else 'tile', rp)
 _wall(c, x0, x1, 21, 70, 'brick' if v != 2 else 'sheet', bp)
 _door(c, 15, 33, 32, 68, RAMPS['oak7'] if v != 2 else bp, 'slot')
 for y in range(24, 36):                           # the cistern on brackets
  for x in range(44, 56):
   u = (x - 44) / 12
   c.set(x, y, m[5] if u < 0.3 else m[4] if u < 0.7 else m[2])
 c.hline(44, 55, 24, m[6]); c.hline(44, 55, 35, m[0])
 for x in (45, 54): c.set(x, 36, m[2]); c.set(x, 37, m[1])
 for y in range(36, 68):                           # the soil pipe
  c.set(48, y, m[5]); c.set(49, y, m[3]); c.set(50, y, m[1])
  if y % 9 == 0:
   c.hline(47, 51, y, m[4]); c.hline(47, 51, y + 1, m[1])
 c.set(47, 67, m[2]); c.set(51, 67, m[2])
 for y in range(26, 31):                           # a fanlight over the door
  c.hline(20, 28, y, '#22282b' if y > 27 else '#39424a')
 c.hline(19, 29, 25, bp[5])
 _ground(c, 24, 70, 25, RAMPS['granite'])
 soft_outline(c, bp[0], bp[2])
 grass(c, [(1, 75, 3), (54, 75, 2)])
 return c.image()


PRIVY = {
 'privy-shed': plank_shed,
 'privy-screen': reed_screen,
 'privy-bench': bench_latrine,
 'privy-stone': stone_privy,
 'privy-nightsoil': night_soil,
 'privy-outhouse': brick_outhouse,
}
