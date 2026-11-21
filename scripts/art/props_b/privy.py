"""Privies.

The cabins are one hand drawing: a shed seen gable on, its roof from above at
the houses' depth, the gable-shingle gold master at the width of one door. A
build is a wall swatch, a roof and what stands beside it.
"""
import math
from .building import _flies, _ground
from .core import Canvas, RAMPS, blob, draw_grid, jitter, ramp_keys, soft_outline, grass

IRON = RAMPS['blackiron7']
HOLE = '#141210'

# Digits light the wall in bands from the upper left; the swatch adds the
# material on top. p-s are the wall's own corner posts and door frame, A-G the
# door, h and i its iron.
CABIN_AT = 18
CABIN = [
 "..................1..................",
 "................11111................",
 "...............1113111...............",
 "..............113333311..............",
 "............1113333333111............",
 "...........111333333333111...........",
 "..........11333333333333311..........",
 "........111333333333333332111........",
 ".....s.1114p333333333333322111.p.....",
 ".....s11444rrrrrrrrrrrrrrr22211p.....",
 ".....s14444qEEEEBEDDBECCBp22221p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qihFFFFFFFFFFFp22222p.....",
 ".....s44444qDDDDDDDDDDDDDp22222p.....",
 ".....s44444qBBBBBBBBBBBBBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBEChBp22222p.....",
 ".....s44444qEEEEBEDDBECiBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s44444qihFFFFFFFFFFFp22222p.....",
 ".....s44444qDDDDDDDDDDDDDp22222p.....",
 ".....s44444qBBBBBBBBBBBBBp22222p.....",
 ".....s44444qEEEEBEDDBECCBp22222p.....",
 ".....s33333qEEEEBEDDBECCBp11111p.....",
 ".....s33333qBBBBBBBBBBBBBp11111p.....",
]

ROOF_AT = 4
ROOFS = {
 'tile': [
 "..................c..................",
 "................bfgeb................",
 "...............gbfgebb...............",
 "..............cebfgebbe..............",
 "............ffccbcccbbdee............",
 "...........feecfbfgebebddf...........",
 "..........geccfebfgebdebbdb..........",
 "........fcecgfecbfgebbdfbbbee........",
 ".......feccceecfbcccbfbdbebdde.......",
 "......feccfcccgebfgebdbbbdebbdf......",
 "....cgecffecfcecbfgebbbeebdefbdbe....",
 "...fcecgeecfecccbfgebebddebddbbbde...",
 "...eccceccfeccfcbcdcbdebbdfbbbebbd...",
 "...cffcccgecffeceebddbdefbdbebdeeb...",
 "...feecfcecgeecebb.bbdbddbbbdebddf...",
 "...eccfecccecceb.....bdbbbebbdebbd...",
 "...cgfecffcceeb.......bddbdeebdfbb...",
 "...ceecfeecebb.........bbdbddfbdbe...",
 "...cccgecceb.............bdbbdbbbd...",
 "...cfceceeb...............bddbbeeb...",
 "...feccebb.................bbdbdde...",
 "...ecceb.....................bdbbd...",
 "...ceeb.......................bddb...",
 "...ebb.........................bbd...",
 "...b.............................b...",
 ],
 'thatch': [
 "..................c..................",
 "................bfgeb................",
 "...............fbfgebe...............",
 "..............eebfgebde..............",
 "............eeeebcccbdded............",
 "...........feedebfgebddddd...........",
 "..........feeefebfgebdddcdd..........",
 "........efeeffeebfgebcddeddee........",
 ".......eeeeeeeefbcccbedddeddde.......",
 "......eeedeeeeeebfgebdedddedddd......",
 "....ffeefeedeeeebfgebddedddddcddd....",
 "...feeefeeefeeeebfgebdddddcdddddde...",
 "...edefeeefeedfebcfcbddcddddddeddd...",
 "...eeeeeefeeffedggdffdddeddeeddeed...",
 "...eeedeeeeeeeegeebddfdddedddedddd...",
 "...eeeeedeeeeegebb.bbdfdddedcddcdd...",
 "...effeefeeeggeb.....bdffcdddddddd...",
 "...feeefeedgeeb.......bddfddddddde...",
 "...eeefeeegebb.........bbdfdddeddd...",
 "...deeeeggeb.............bdffddeec...",
 "...eeeegeeb...............bddfcddd...",
 "...eedgebb.................bbdfddd...",
 "...eggeb.....................bdffd...",
 "...geeb.......................bddf...",
 "...ebb.........................bbd...",
 "...b.............................b...",
 ],
 'sheet': [
 "..................c..................",
 "................bfgeb................",
 "...............fbfgebe...............",
 "..............eebfgebdd..............",
 "............ddddbcccbcccc............",
 "...........fffffbfgebeeeee...........",
 "..........eeeeeebfgebdddddd..........",
 "........ddddddddbfgebcccccccc........",
 ".......fffffffffbcccbeeeeeeeee.......",
 "......eeeeeeeeeebfgebdddddddddd......",
 "....ddddddddddddbfgebcccccccccccc....",
 "...fffffffffffffbfgebeeeeeeeeeeeee...",
 "...eeeeeeeeeeeeebcdcbddddddddddddd...",
 "...dddddddddddddeebddccccccccccccc...",
 "...ffffffffffffebb.bbdeeeeeeeeeeee...",
 "...eeeeeeeeeeeeb.....bdddddddddddd...",
 "...dddddddddeeb.......bddccccccccc...",
 "...ffffffffebb.........bbdeeeeeeee...",
 "...eeeeeeeeb.............bdddddddd...",
 "...dddddeeb...............bddccccc...",
 "...ffffebb.................bbdeeee...",
 "...eeeeb.....................bdddd...",
 "...deeb.......................bddc...",
 "...ebb.........................bbd...",
 "...b.............................b...",
 ],
}

# Steps off the lighting digit: '=' -2, '-' -1, '0', '+' +1.
STEP = {'=': -2, '-': -1, '0': 0, '+': 1}
SWATCH = {
 'plank': [
  "=+000=+0000=+000=+0000",
  "=+000=+0000=+000=+0000",
  "=+000=+00-0=+000=+0000",
  "=+0-0=+00-0=+000=+0000",
  "=+0-0=+0000=+000=+00-0",
  "=+000=+0000=+000=+00-0",
  "=+000=+0000=+-00=+0000",
  "=+000=+0000=+-00=+0000",
  "=+000=+0000=+000=+0000",
  "=+000=+0-00=+000=+0000",
  "=+000=+0-00=+000=+0000",
  "=+000=+0000=+000=+0000",
 ],
 'brick': [
  "+++++++-0000000-",
  "0000000-0000000-",
  "----------------",
  "+++-+++++++-0000",
  "000-0000000-0000",
  "----------------",
 ],
 'stone': [
  "+++++++=+++++++++=",
  "+000000=+00000000=",
  "+000000=+00000000=",
  "+00000-=+0000000-=",
  "========+0000000-=",
  "++++=+++=========-",
  "+000=+00000=++++++",
  "+000=+0000-=+00000",
  "+00-=+0000-=+00000",
  "=====------=+0000-",
 ],
 'daub': [
  "000000000000",
  "000000000000",
  "0000-0000000",
  "000-00000000",
  "000000000000",
  "00000000+000",
  "000000000000",
  "000000000-00",
  "0000000000-0",
  "000000000000",
 ],
 'sheet': ["+0-"],
}

CUTS = {
 'moon': ([".kk", "k..", "k..", "k..", ".kk"], (17, 32)),
 'slot': (["kkkkk", "FFFFF"], (16, 33)),
 'diamond': ([".k.", "kkk", ".k."], (17, 32)),
}


def _cabin(c, wall, wr, door, cut, inside=None):
 keys = ramp_keys(wr, None, door, p=wr[1], q=wr[2], r=wr[2], s=wr[5],
                  h=IRON[5], i=IRON[1], k=HOLE)
 sw = SWATCH[wall]
 for y, row in enumerate(CABIN, CABIN_AT):
  for x, ch in enumerate(row):
   if ch.isdigit():
    s = sw[y % len(sw)]
    c.set(x, y, wr[max(0, min(6, int(ch) + STEP[s[x % len(s)]]))])
   elif ch != '.':
    c.set(x, y, keys[ch])
 if inside:
  draw_grid(INSIDE[inside], INSIDE_KEYS, c, (12, 28))
  draw_grid(OPEN_DOOR, keys, c, (3, 28))
 else:
  rows, at = CUTS[cut]
  draw_grid(rows, keys, c, at)
 return keys


def _roofed(c, wr, roof, rr, frame):
 """Outline the walls in their own hue, then lay the roof over with its own."""
 soft_outline(c, wr[0], wr[2])
 top = draw_grid(ROOFS[roof], ramp_keys(rr, rr), Canvas(c.w, c.h), (0, ROOF_AT))
 soft_outline(top, rr[0], rr[2])
 c.px.update(top.px)
 _flies(c, frame, [(18, 40, 10, 5, 1.0), (18, 33, 7, 6, -1.0)])
 return c.image()


def privy_shed(v=0, frame=0, inside=None):
 """A board shed over a pit: the default almost everywhere, almost always."""
 c = Canvas(37, 60)
 wr = RAMPS[['oak7', 'buffclay7', 'galvanised7'][v]]
 keys = _cabin(c, ['plank', 'daub', 'sheet'][v], wr,
               RAMPS[['ash7', 'ash7', 'galvanised7'][v]], ['moon', 'slot', 'slot'][v], inside)
 if v == 1:
  draw_grid(WATTLE, keys, c, (6, 50))
 return _roofed(c, wr, ['tile', 'thatch', 'sheet'][v], RAMPS[['walnut7', 'straw', 'galvanised7'][v]], frame)


def privy_stone(v=0, frame=0, inside=None):
 """A masonry privy with a chute at the side: the town house's own."""
 c = Canvas(37, 60)
 wr = RAMPS[['granite', 'sandstone', 'limestone'][v]]
 keys = _cabin(c, 'stone', wr, RAMPS['oak7'], 'diamond', inside)
 draw_grid(CHUTE, keys, c, (32, 47))
 return _roofed(c, wr, 'tile', RAMPS['tile'], frame)


def privy_outhouse(v=0, frame=0, inside=None):
 """Brick and a slate roof, the soil pipe up the side: the plumbed century."""
 c = Canvas(37, 60)
 wr = RAMPS[['rustred7', 'buffclay7', 'galvanised7'][v]]
 keys = _cabin(c, 'brick' if v < 2 else 'sheet', wr, RAMPS['oak7'] if v < 2 else wr, 'slot', inside and 'pan')
 draw_grid(PIPE, ramp_keys(IRON, IRON), c, (32, 60 - len(PIPE)))
 return _roofed(c, wr, 'tile' if v < 2 else 'sheet', RAMPS[['pewter7', 'tile', 'galvanised7'][v]], frame)


def privy_nightsoil(v=0, frame=0, inside=None):
 """A shed with a tub at the hatch: what comes out of it goes on the fields."""
 c = Canvas(52, 60)
 wr = RAMPS[['oak7', 'walnut7', 'galvanised7'][v]]
 _cabin(c, 'plank' if v < 2 else 'sheet', wr, RAMPS[['ash7', 'oak7', 'galvanised7'][v]], 'slot', inside)
 draw_grid(TUB, ramp_keys(RAMPS['oak7'], IRON, RAMPS['walnut7'], k=HOLE, u='#2e2516'), c, (36, 60 - len(TUB)))
 return _roofed(c, wr, ['tile', 'tile', 'sheet'][v], RAMPS[['tile', 'walnut7', 'galvanised7'][v]], frame)


# Seen through the open door: digits walnut, a-g oak, A-G iron, w-y paper and
# glaze. A pit privy has a plank seat; the plumbed outhouse a pan under a high
# cistern with its chain.
INSIDE_KEYS = ramp_keys(RAMPS['walnut7'], RAMPS['oak7'], IRON, k=HOLE,
                        w='#e8e4d6', v='#c9c4b3', y='#9d9888')
INSIDE = {
 'bench': [
  "kkkkkkkkkkkkk",
  "k000000000000",
  "0111011101110",
  "0111011101110",
  "0121012101210",
  "0121012101210",
  "0121012101E10",
  "012101210wv10",
  "012101210wv10",
  "012101210vy10",
  "0122012201220",
  "0122012201220",
  "0122012201220",
  "0122012201220",
  "0122012201220",
  "0000000000000",
  "ccccccccccccb",
  "fgggbkkkbffee",
  "fggkkkkkkbfee",
  "fgggbkkkbffee",
  "ggggggggggggf",
  "bbbbbbbbbbbba",
  "dddcdddcdddcb",
  "dddcdddcdddcb",
  "dddcdddcdddcb",
  "dddcdddcdddcb",
  "dddcdddcdddcb",
  "dddcdddcdddcb",
  "cccbcccbcccba",
  "bbbbbbbbbbbba",
  "aaaaaaaaaaaaa",
 ],
 'pan': [
  "kkkkkkkkkkkkk",
  "k111111111111",
  "1yyyyyyyyyyyy",
  "yEEEEEEEyyyyy",
  "yDDDDDDCyyyyy",
  "yDDDDDDCyyyyy",
  "yBBBBBBByyyyy",
  "yyByCyBDyyyyy",
  "yyyyCyyByyyyy",
  "yyyyCyyDyyyyy",
  "yyyyCyyByyyyy",
  "yyyyCyyDyyyyy",
  "yyyyCyyByyyyy",
  "yyyyCyyDyyyyy",
  "yyyyCyEDyyEyy",
  "yyyyCyyyywvyy",
  "yyyyCyyyywvyy",
  "yyyyCyyyyvyyy",
  "yyyyCyyyyyyyy",
  "yyefggggfeyyy",
  "yefkkkkkkfdyy",
  "yefkkkkkkfdyy",
  "yyeffffffdyyy",
  "2222wvvvy2222",
  "2222wvvvy2222",
  "22222wvy22222",
  "22222wvy22222",
  "2222wvvvy2222",
  "1111111111111",
  "1111111111111",
  "0000000000000",
 ],
}

# The door swung open on its left hinges, turned toward you and foreshortened.
OPEN_DOOR = [
 "......FE",
 "...FFFED",
 "GFFFFFFE",
 "EDDDDDhC",
 "CBBBBBiA",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "FEECEDCB",
 "GFFFFFFE",
 "EDDDDDhC",
 "CBBBBBiA",
 "FEECEDCB",
 "FEECEDCB",
 "DCCBCBBA",
]

# Ash wattle where the daub has fallen away.
WATTLE = [
 ".DCDC.",
 "CDCDCD",
 "BCBCBC",
 "CDCDCD",
 ".BCB..",
]

# The chute from the seat to the pit, in the wall's own stone.
CHUTE = [
 "66651",
 "54432",
 "44321",
 "22221",
 "54432",
 "44321",
 "44321",
 "22221",
 "54432",
 "4kkk1",
 "4kkk1",
 "3kkk2",
 "22221",
]

# A cast-iron soil pipe standing off the corner on brackets, capped above the roof.
PIPE = [
 "..gfd",
 "..fed",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "..fec",
 "ddddc",
 "..bec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "..fec",
 "ddddc",
 "..bec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "...ec",
 "..fec",
 "..ddc",
]

# The night-soil tub, its yoke leaning on it. Digits oak, a-g iron hoops,
# A-G the walnut pole, u what is in it.
TUB = [
 "...........FD",
 "..........FD.",
 ".........FD..",
 "........FD...",
 ".......FD....",
 "......FD.....",
 "..3445FD43...",
 ".35uuFDuuu4..",
 "3uuuFDuuuuu3.",
 "4uuFDuuuuuu3.",
 "56FD66665543.",
 "4FDdddddddcb.",
 "FD444333221..",
 "D5444333221..",
 "45444333221..",
 "4fffffeeddcb.",
 "45444333221..",
 "45444333221..",
 "45444333221..",
 "45444333221..",
 "4fffffeeddcb.",
 "35444333221..",
 "23333222211..",
]


def reed_screen(v=0, frame=0):
 """No building at all: a curved horseshoe reed, thatch or cloth screen round a pit."""
 c = Canvas(54, 44)
 post = RAMPS['walnut7']
 v = v % 3
 if v == 0:
  mat = ['#3e371a', '#665c2b', '#8d813f', '#b2a559', '#cfc378', '#e5dc9a']
 elif v == 1:
  mat = ['#4a381d', '#745a2f', '#9c7c42', '#bfa05c', '#dac07c', '#ece0a8']
 else:
  mat = ['#6e6456', '#968a78', '#bdb29e', '#dcd3c0', '#efe8d8', '#faf6ec']
 cx, base_y, rx, ry = 26.5, 31.0, 21.0, 9.0
 wall_h = 22
 for y in range(25, 39):
  for x in range(14, 39):
   if ((x - cx) / 13.5) ** 2 + ((y - 31.5) / 6.5) ** 2 <= 1.0:
    c.set(x, y, '#2b2118' if y < 31 else ('#3d2f22' if y < 35 else '#524130'))
 for x in range(6, 48):
  nx = (x - cx) / rx
  if abs(nx) > 0.99:
   continue
  ey = math.sqrt(max(0.0, 1.0 - nx * nx)) * ry
  yb = int(round(base_y - ey))
  yt = yb - wall_h
  tuft = ((x * 7) % 3) - 1 if v != 2 else 0
  for y in range(yt + tuft, yb + 1):
   if y < 2:
    continue
   if y >= yb - 6 and abs(x - cx) < 10:
    c.set(x, y, mat[1] if y < yb - 2 else '#261e16')
    continue
   if v == 2:
    fold = math.sin(x * 0.48) * 0.5 + 0.5
    idx = (3 if fold > 0.5 else 2) - (1 if nx > 0.35 else 0)
    if y == yt:
     idx = min(5, idx + 1)
    c.set(x, y, mat[max(1, idx)])
   else:
    if y in (yt + 4, yt + 12, yb - 3):
     c.set(x, y, post[3] if nx < 0.2 else post[1])
    else:
     bundle = ((x * 5 + (y // 6) * 3) % 4)
     idx = (3 if bundle in (0, 1) else 2) - (1 if nx > 0.35 else 0)
     if y <= yt + 1:
      idx = min(5, idx + 1)
     c.set(x, y, mat[max(1, idx)])
 for x in range(5, 49):
  if 20 <= x <= 33:
   continue
  nx = (x - cx) / rx
  if abs(nx) > 1.0:
   continue
  ey = math.sqrt(max(0.0, 1.0 - nx * nx)) * ry
  yb = int(round(base_y + ey * 0.85))
  yt = yb - wall_h
  tuft = ((x * 11) % 3) - 1 if v != 2 else 0
  for y in range(yt + tuft, yb + 1):
   if v == 2:
    fold = math.sin(x * 0.55 + y * 0.12)
    idx = (5 if (fold > 0.35 and nx < 0.15) else (4 if fold > -0.1 else 3)) - (1 if nx > 0.45 else 0)
    if y == yb:
     idx = max(1, idx - 1)
    c.set(x, y, mat[max(1, min(5, idx))])
   else:
    if y in (yt + 4, yt + 12, yb - 3):
     tie = (x % 5) == 0
     c.set(x, y, post[1] if tie else (post[4] if nx < 0.2 else post[2]))
    else:
     stalk = (x % 3) == 0
     bundle = ((x * 7 + (y // 7) * 5) % 4)
     lit = 1 if nx < -0.15 else (0 if nx < 0.4 else -1)
     idx = (4 if (not stalk and bundle < 2) else (3 if not stalk else 2)) + lit
     if y <= yt + 1:
      idx = min(5, idx + 1)
     if y >= yb - 1:
      idx = max(1, idx - 1)
     c.set(x, y, mat[max(1, min(5, idx))])
 for sx, yb in [(6, 33), (19, 38), (34, 38), (46, 33), (12, 24), (40, 24)]:
  sy0 = yb - wall_h - 2
  for y in range(max(2, sy0), yb + 1):
   c.set(sx, y, post[4]); c.set(sx + 1, y, post[1])
  c.set(sx, max(2, sy0 - 1), post[5])
 soft_outline(c, post[0], post[2])
 # Orbits stay inside the horseshoe screen so trimmed bounds match across frames.
 _flies(c, frame, [(26, 29, 10, 4, 1.0), (26, 25, 8, 4, -1.0)])
 return c.image()


def _heap(c, shapes, ramp, base):
 """A tipped mass, shaded as a solid rather than a row of columns. Everything
 below the standing line is cut away: the near face meets trodden earth."""
 mask = blob(c, shapes, ramp, light=(-0.5, -0.66), gamma=0.9)
 for (x, y) in list(c.px):
  if y > base: del c.px[(x, y)]
 return {k: v for k, v in mask.items() if k[1] <= base}


def dung_heap(v=0, frame=0):
 """The farmyard muck heap: byre straw and dung, forked out and rotting down.

 Manure is worth money, so it is boarded in and squared up rather than tipped
 down a bank. The fork stays in it between loads.
 """
 c = Canvas(62, 48)
 straw = RAMPS['straw']
 muck = RAMPS[['walnut7', 'redearth7', 'oak7'][v]]
 w = RAMPS['ash7']
 base = 42
 mask = _heap(c, [(31, 43, 24, 21), (17, 44, 13, 15), (45, 44, 14, 14)], muck, base)
 top = {}
 for (x, y) in mask:
  if y < top.get(x, 99): top[x] = y
 # Fresh straw on top, dark rotted muck under it: a heap in its second year
 # is two materials, not one, and the line between them is what reads.
 for (x, y), i in list(mask.items()):
  depth = y - top[x]
  n = jitter(x * 3, y * 7)
  if depth < 4 + n % 4:
   c.set(x, y, straw[max(min(i + 1 - n % 2, 6), 2)])
  else:
   tone = max(i - 2, 1)
   c.set(x, y, straw[min(tone + 2, 6)] if n % 6 == 0 else muck[tone])
 for i in range(11):                               # loose straw over the crest
  sx = 8 + i * 4
  if sx not in top: continue
  for k in range(3 + jitter(sx, i) % 3):
   c.set(sx + k, top[sx] - 1 - jitter(sx, k) % 2, straw[6 if k % 2 else 5])
 for px, side in ((5, 1), (54, -1)):               # the boards that hold it in
  for y in range(30, base + 1):
   c.set(px, y, w[5]); c.set(px + side, y, w[3]); c.set(px + side * 2, y, w[1])
  c.set(px, 29, w[6])
 for x in range(5, 57):                            # a rail along the near side
  if x % 7 == 0: continue
  c.set(x, 37 + (x > 31), w[4]); c.set(x, 38 + (x > 31), w[2])
 m = RAMPS['blackiron7']
 hw = RAMPS['walnut7']
 for k in range(30):                               # a fork left standing in it
  x, y = 45 - k // 5, 38 - k
  c.set(x, y, hw[5]); c.set(x + 1, y, hw[3]); c.set(x + 2, y, hw[0])
 for off in (-4, 0, 4):                            # its head, three tines
  for k in range(8): c.set(40 + off, 8 + k, m[5 if k % 2 else 4])
  c.set(40 + off, 7, m[6]); c.set(40 + off + 1, 8 + 7, m[1])
 c.hline(36, 44, 16, m[4]); c.hline(36, 44, 17, m[1])
 for k in range(3): c.set(40 + k, 18 + k, hw[4])   # the socket onto the shaft
 for i in range(4):                                # seepage at the foot
  x = 13 + i * 11
  for k in range(5): c.set(x + k, base + 1, '#332d1e')
 _ground(c, 31, base, 29)
 _flies(c, frame, [(31, 32, 23, 8, 1.0), (36, 24, 15, 10, -1.0), (19, 36, 10, 5, 1.0)])
 soft_outline(c, muck[0], muck[2])
 grass(c, [(2, 46, 3), (58, 46, 2)])
 return c.image()


PRIVY_STATES = {k: {'open': lambda v, f=f: f(v, inside='bench')}
                for k, f in (('privy-shed', privy_shed), ('privy-stone', privy_stone),
                             ('privy-outhouse', privy_outhouse), ('privy-nightsoil', privy_nightsoil))}

PRIVY = {
 'privy-shed': privy_shed,
 'privy-screen': reed_screen,
 'privy-stone': privy_stone,
 'privy-nightsoil': privy_nightsoil,
 'privy-outhouse': privy_outhouse,
 'privy-dung': dung_heap,
}
