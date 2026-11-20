"""Vessels, all turned on the same wheel.

The generic ceramic bodies are a profile of half-widths through `revolve`, so a
pot, a jar and an amphora catch the light the same way. What tells them apart is
the profile and the fittings: rim, neck, handles, foot. The regional storage
jars at the end are hand grids in the same view.
"""
from math import sqrt
from .core import (Canvas, RAMPS, belly, revolve,
                   soft_outline, draw_grid, ramp_keys, lay_down)

CLAY = ['terracotta7', 'buffclay7', 'redearth7']
GLAZE = ['greenglaze7', 'blueglaze7', 'creamglaze7']
METAL = ['brass7b', 'pewter7', 'copper7']


def _top(c, cx, half, y, p, open_rows=1):
 """The mouth in perspective: far rim lit, the opening dark inside it, the
 near rim standing in front. One helper, so every vessel opens the same way.
 """
 span = range(int(cx - half), int(cx + half) + 1)
 for x in span:                                   # far rim, catching the light
  u = (x + .5 - cx) / max(half, .5)
  if abs(u) > 1: continue
  c.set(x, y, p[6] if u < -0.15 else p[5] if u < 0.65 else p[4])
 for k in range(open_rows):                       # the opening
  w = half - 0.7 - k * 0.3
  for x in range(int(cx - w), int(cx + w) + 1):
   if abs((x + .5 - cx) / max(w, .5)) > 1: continue
   c.set(x, y + 1 + k, p[1] if k == 0 else p[0])
 near = y + 1 + open_rows
 for x in span:                                   # near rim, in front of it
  u = (x + .5 - cx) / max(half, .5)
  if abs(u) > 1: continue
  c.set(x, near, p[4] if u < -0.1 else p[3] if u < 0.7 else p[2])
 for x in range(int(cx - half) + 1, int(cx + half)):
  c.set(x, near + 1, p[2])


def pot(v=0):
 """A round cooking pot, 0.4 m across: the commonest thing in the world."""
 c = Canvas(11, 11)
 p = RAMPS[CLAY[v]]
 cx = 5.0
 revolve(c, cx, belly(2, 9, [3.4, 4.8, 5.2, 4.2, 2.8]), p)
 _top(c, cx, 3.6, 0, p)
 for x, y in [(2, 8), (7, 7)]:                    # firing marks
  c.set(x, y, p[1])
 c.hline(3, 6, 10, p[1])                          # it sits on its own shadow
 soft_outline(c, p[0], p[2])
 return c.image()


def storage_jar(v=0):
 """A shoulder-height jar, 0.8 m: grain, oil, water kept indoors."""
 c = Canvas(14, 20)
 p = RAMPS[CLAY[v]]
 cx = 6.5
 revolve(c, cx, belly(3, 18, [4.0, 6.2, 6.6, 5.4, 3.6, 3.2]), p)
 _top(c, cx, 4.4, 0, p, open_rows=2)
 for y in (8, 12):                                # the turning ridges
  for x in range(3, 11):
   if c.get(x, y): c.set(x, y, p[5] if x < 5 else p[4] if x < 8 else p[2])
 c.hline(4, 9, 19, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def water_jug(v=0):
 """A narrow-necked jug with one handle, 0.5 m."""
 c = Canvas(13, 17)
 p = RAMPS[CLAY[v]]
 cx = 5.0
 revolve(c, cx, belly(6, 15, [3.2, 4.6, 4.8, 3.8, 2.6]), p)
 revolve(c, cx, belly(2, 6, [1.8, 1.6, 2.2, 3.4]), p, base=0.08, rimlight=False)
 _top(c, cx, 2.4, 0, p, open_rows=0)
 for x in range(3, 8):                            # the shoulder turning over
  if c.get(x, 6): c.set(x, 6, p[5] if x < 5 else p[3])
 # One pixel of handle, standing clear of the belly: two pixels and its own
 # shade close the gap and the jug grows a boot.
 for x, y in [(8, 5), (10, 6), (11, 8), (11, 10), (9, 12)]:
  c.set(x, y, p[4])
 c.set(9, 5, p[5]); c.set(10, 7, p[3]); c.set(10, 11, p[2]); c.set(8, 12, p[2])
 c.hline(3, 7, 16, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def amphora(v=0):
 """Two handles and a pointed foot, standing in its ring: 1 m of transport."""
 c = Canvas(14, 24)
 p = RAMPS[CLAY[v]]
 cx = 6.5
 revolve(c, cx, belly(6, 19, [3.6, 5.6, 5.8, 4.4, 2.4, 1.4]), p)
 revolve(c, cx, belly(2, 6, [1.6, 1.4, 1.8, 3.0]), p, base=0.08)
 _top(c, cx, 2.6, 0, p, open_rows=0)
 for dx in (-1, 1):                               # a handle each side
  for i, (x, y) in enumerate([(3, 3), (4, 3), (5, 5), (5, 7)]):
   px = int(cx) + dx * x
   c.set(px, y, p[4] if dx < 0 else p[2])
   if i > 1: c.set(px, y + 1, p[3] if dx < 0 else p[1])
 ring = RAMPS['wicker7']                          # the stand it rests in
 for y, half in [(20, 4.0), (21, 4.4), (22, 4.0)]:
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / half
   if abs(u) > 1: continue
   c.set(x, y, ring[5 if y == 20 else 4] if u < 0 else ring[3 if y == 20 else 2])
 soft_outline(c, p[0], p[2])
 return c.image()


def glazed_jar(v=0):
 """A glazed jar: the glaze is a hard highlight and a painted band."""
 c = Canvas(13, 16)
 p = RAMPS[GLAZE[v]]
 cx = 6.0
 revolve(c, cx, belly(3, 14, [4.0, 5.8, 6.0, 4.6, 3.4]), p, gloss=1)
 _top(c, cx, 3.4, 0, p, open_rows=1)
 band = RAMPS['terracotta7'] if v != 2 else RAMPS['blueglaze7']
 for x in range(1, 12):                           # one painted line round it
  if c.get(x, 9): c.set(x, 9, band[4] if x < 6 else band[2])
 c.set(3, 6, p[6])                                # the glaze's hard glint
 c.hline(4, 8, 15, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def metal_vessel(v=0):
 """Beaten metal: a narrow specular band and a cool reflected edge."""
 c = Canvas(11, 13)
 m = RAMPS[METAL[v]]
 cx = 5.0
 revolve(c, cx, belly(3, 11, [3.4, 5.0, 5.2, 4.0, 3.0]), m, gloss=1, light=-0.62)
 _top(c, cx, 3.0, 0, m, open_rows=1)
 for x in range(1, 10):                           # one turned collar, cut in
  if c.get(x, 6): c.set(x, 6, m[1] if x > 6 else m[3])
  if c.get(x, 7): c.set(x, 7, m[6] if x < 5 else m[4])
 for x in range(2, 9):                            # ground light under the belly
  if c.get(x, 10): c.set(x, 10, m[4])
 c.hline(3, 7, 12, m[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def pithos(v=0):
 """A storage vat sunk to its shoulder, 1.4 m: a household's whole year."""
 c = Canvas(24, 26)
 p = RAMPS[CLAY[v]]
 cx = 11.5
 revolve(c, cx, belly(4, 24, [7.0, 10.4, 11.0, 9.6, 7.4, 6.0]), p)
 _top(c, cx, 7.6, 0, p, open_rows=2)
 for y in (9, 10):                                # a rope-pattern collar
  for x in range(1, 23):
   if c.get(x, y) and (x + y) % 3: c.set(x, y, p[5] if x < 11 else p[2])
 for x, y in [(4, 16), (18, 13), (9, 21)]:        # firing marks
  c.set(x, y, p[1]); c.set(x + 1, y, p[2])
 soft_outline(c, p[0], p[2])
 return c.image()


def flask(v=0):
 """A stoppered flask, 0.35 m: what a traveller carries, not what a house keeps."""
 c = Canvas(11, 16)
 p = RAMPS[CLAY[v] if v < 2 else 'creamglaze7']
 cx = 5.0
 revolve(c, cx, belly(6, 14, [3.0, 4.4, 4.6, 3.6, 2.6]), p)
 revolve(c, cx, belly(2, 6, [1.6, 1.6, 2.2, 3.4]), p, base=0.10, rimlight=False)
 for x in range(3, 8):                            # the shoulder's lit edge
  if c.get(x, 6): c.set(x, 6, p[5] if x < 5 else p[3])
 cork = RAMPS['oak7']
 c.hline(3, 6, 0, cork[5]); c.hline(3, 6, 1, cork[3])
 c.set(3, 1, cork[2]); c.set(6, 1, cork[1])
 cord = RAMPS['rope']
 for x in range(2, 9):                            # the carrying cord
  if c.get(x, 8): c.set(x, 8, cord[2] if x % 2 else cord[1])
 c.set(1, 9, cord[1]); c.set(9, 9, cord[1])
 c.hline(3, 7, 15, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def bowl(v=0):
 """A wide open bowl: the inside is most of what you see."""
 c = Canvas(13, 8)
 p = RAMPS[CLAY[v] if v < 2 else 'creamglaze7']
 cx = 6.0
 revolve(c, cx, belly(2, 7, [6.0, 5.4, 4.2, 2.6]), p)
 for y in range(0, 3):                            # the bowl's dark interior
  half = 6.0 - y * 0.8
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / half
   if abs(u) > 1: continue
   c.set(x, y, p[1] if y else p[2])
 for x in range(1, 12):
  u = (x + .5 - cx) / 6.0
  if abs(u) <= 1: c.set(x, 0, p[5] if u < -0.1 else p[3])
 c.hline(4, 8, 7, p[1])
 soft_outline(c, p[0], p[2])
 return c.image()


def _mouth(c, cx, cy, rx, ry, p, inside):
 """An open top seen from a little above: a lit rim ring round a dark inside,
 the inside's near half lit where the light falls past the far rim."""
 for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
  for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
   U, V = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   r2 = U * U + V * V
   if r2 > 1: continue
   if r2 > 0.5: c.set(x, y, p[6] if U < -0.2 or V > 0.4 and U < 0.4 else p[4] if V > 0 else p[3])
   else: c.set(x, y, inside[0] if V < 0.1 else inside[1])


def bucket(v=0):
 """A 0.5 m pail with a bail handle. Variants 3-5 are the small 0.35 m one."""
 if v >= 3: return _small_bucket(v - 3)
 c = Canvas(15, 19)
 w = RAMPS[['oak7', 'ash7', 'walnut7'][v]]
 m = RAMPS['blackiron7']
 cx, top, bot = 7.0, 5, 18
 prof = belly(top, bot, [6.8, 6.3, 5.8, 5.2])
 revolve(c, cx, prof, w)
 for y, h in prof.items():                        # stave joints, crowding at the sides
  for k in (-0.75, -0.3, 0.2, 0.65):
   c.set(round(cx + h * k), y, w[2] if k < 0 else w[1])
 for y0 in (8, 15):                               # hoops on the rim's curve
  h = prof[y0]
  for x in range(15):
   u = (x + .5 - cx) / h
   if abs(u) > 1: continue
   y = y0 + round(1.6 * sqrt(1 - u * u))
   c.set(x, y - 1, m[5] if u < 0.1 else m[3]); c.set(x, y, m[2] if u < 0.1 else m[1])
 _mouth(c, cx, top, 6.8, 2.2, w, (w[1], w[2]))
 for x, y in [(1, 4), (1, 3), (2, 2), (3, 1), (4, 0), (5, 0)]:   # the bail, left half lit
  c.set(x, y, m[5])
 for x, y in [(9, 0), (10, 0), (11, 1), (12, 2), (13, 3), (13, 4)]:
  c.set(x, y, m[3])
 c.hline(6, 8, 0, RAMPS['oak7'][5])               # the wooden grip
 soft_outline(c, w[0], w[2])
 return c.image()


def _small_bucket(v=0):
 """Staves and two hoops, 0.35 m: a pail, not a barrel."""
 c = Canvas(10, 12)
 w = RAMPS[['oak7', 'ash7', 'walnut7'][v]]
 m = RAMPS['blackiron7']
 cx = 4.5
 revolve(c, cx, belly(2, 10, [4.6, 4.2, 3.8, 3.2]), w)
 for x in range(0, 10):                           # staves
  if x % 3 == 0:
   for y in range(2, 11):
    if c.get(x, y): c.set(x, y, w[2])
 for y in (4, 9):                                 # iron hoops
  for x in range(0, 10):
   if c.get(x, y): c.set(x, y, m[3] if x < 5 else m[1])
  for x in range(0, 10):
   if c.get(x, y - 1) and x < 5: c.set(x, y - 1, m[5])
 for x in range(0, 10):                           # the mouth
  u = (x + .5 - cx) / 4.6
  if abs(u) <= 1:
   c.set(x, 1, w[1]); c.set(x, 0, w[4] if u < 0 else w[2])
 soft_outline(c, w[0], w[2])
 return c.image()


def basket(v=0, lid=False):
 """Coiled wicker: the weave is the whole of the shading.

 A lid needs its own rows: drawn above the canvas it falls in the one-pixel
 margin and disappears.
 """
 dy = 4 if lid else 0
 c = Canvas(12, 10 + dy)
 p = RAMPS[['wicker7', 'ash7', 'buffclay7'][v]]
 cx = 5.5
 prof = {y + dy: w for y, w in belly(2, 9, [5.6, 5.2, 4.6, 3.4]).items()}
 revolve(c, cx, prof, p)
 for y, half in prof.items():                     # coils: a light row, a dark
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / max(half, .5)
   if abs(u) > 1: continue
   if y % 2 == 0:
    c.set(x, y, p[2] if u > 0.2 else p[4])
   elif (x + y) % 2 == 0:
    c.set(x, y, p[1] if u > 0.2 else p[5])
 for x in range(0, 12):                           # the rim and the dark inside
  u = (x + .5 - cx) / 5.6
  if abs(u) > 1: continue
  c.set(x, 1 + dy, p[1]); c.set(x, dy, p[5] if u < -0.1 else p[3])
 if lid:                                          # a domed lid with a knob
  for y, half in ((dy, 5.6), (dy - 1, 5.2), (dy - 2, 4.2), (dy - 3, 2.6)):
   for x in range(int(cx - half), int(cx + half) + 1):
    u = (x + .5 - cx) / half
    if abs(u) > 1: continue
    c.set(x, y, p[5] if u < -0.2 else p[4] if u < 0.5 else p[2])
  for x in range(0, 12):
   if c.get(x, dy + 1): c.set(x, dy + 1, p[1])
  c.set(5, dy - 4, p[4]); c.set(6, dy - 4, p[2])
 soft_outline(c, p[0], p[2])
 return c.image()


def _big_basket(v=0, lid=False):
 """A 0.5 m storage basket: coils banded round a revolved body, an open
 elliptical mouth, or a domed lid with a loop."""
 dy = 3 if lid else 0
 c = Canvas(19, 15 + dy)
 p = RAMPS[['wicker7', 'ash7', 'buffclay7'][v]]
 cx = 9.0
 prof = {y + dy: h for y, h in belly(3, 14, [8.6, 8.4, 7.6, 6.0]).items()}
 revolve(c, cx, prof, p)
 for y, half in prof.items():                     # coils, and the stitches binding them
  if y % 2: continue
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / max(half, .5)
   if abs(u) > 1: continue
   c.set(x, y, p[2] if u > 0.25 else p[3])
   if (x + y // 2 * 3) % 4 == 0 and y + 1 in prof: c.set(x, y + 1, p[5] if u < 0 else p[3])
 if lid:
  for y in range(0, dy + 4):                      # a shallow dome
   for x in range(19):
    U, V = (x + .5 - cx) / 8.8, (y + .5 - (dy + 3)) / (dy + 2.5)
    if U * U + V * V > 1 or y > dy + 3: continue
    lit = U * 0.6 + V * 0.8
    c.set(x, y, p[6] if lit < -0.45 else p[5] if lit < 0.05 else p[4] if lit < 0.45 else p[3])
  for x in range(2, 17): c.set(x, dy + 3, p[1] if x > 5 else p[2])
  c.set(8, 0, p[5]); c.set(9, 0, p[4]); c.set(10, 0, p[3])
 else:
  _mouth(c, cx, 3, 8.6, 2.6, p, (p[0], p[1]))
 soft_outline(c, p[0], p[2])
 return c.image()


def open_basket(v=0):
 """Variants 0-2 the big storage basket, 3-5 the small one."""
 return _big_basket(v) if v < 3 else basket(v - 3)


def lidded_basket(v=0):
 return _big_basket(v, lid=True) if v < 3 else basket(v - 3, lid=True)


# Regional storage jars, drawn by hand. Digits are the body's ramp, a-g a lid
# or a second clay, A-G paint, seal or stand. A lid or stand is its own grid
# so the open and fallen states can leave it on the ground.

WATER_JAR = [
 "......4566654......",
 ".....532222234.....",
 ".....521000113.....",
 ".....456665443.....",
 "......2333221......",
 "....45666665432....",
 "..345666655443321..",
 ".32566665544332202.",
 ".34336665544331112.",
 ".34453355444112212.",
 ".23445532221322112.",
 "..234444443322111..",
 "...2333433322211...",
 "....22333322211....",
 ".....122222111.....",
 "......1111110......",
]

OLLA = [
 ".....456666654.....",
 "....53222222234....",
 "....52100000113....",
 "....45666655443....",
 "......2333221......",
 "..554566666543233..",
 "..235666665544311..",
 ".34566665544332212.",
 ".34556665522332212.",
 ".34455655242132112.",
 ".23445554421122112.",
 "..234444443322111..",
 "...2333433322211...",
 "....22333322211....",
 ".....122222111.....",
 "......1111110......",
]

ONGGI = [
 ".....456666544.....",
 "....53333333334....",
 "....52222222213....",
 "....51000000013....",
 "....45666655443....",
 "...3456666554432...",
 "..345666665544322..",
 ".34566666554433221.",
 ".45666665544332212.",
 ".45666655445335212.",
 ".44656655443522212.",
 ".34555554453522112.",
 "..445555455325111..",
 "..344554443322110..",
 "...3444443322110...",
 "...2344443322110...",
 "....23444332210....",
 ".....123332211.....",
 "......1111110......",
]

EGYPT_JAR = [
 "......D......",
 ".....CED.....",
 "....CDEDC....",
 "...BCDEDCB...",
 "...ABCCCBA...",
 "...4566543...",
 "....23321....",
 "..456665432..",
 ".34566655432.",
 ".45666554322.",
 ".45566554322.",
 ".45565544322.",
 ".44555443321.",
 ".34555443321.",
 ".34454433221.",
 "..344443321..",
 "..334443221..",
 "...3444321...",
 "...2343210...",
 "....23321....",
 ".....121.....",
]

CANAAN_JAR = [
 "......45654......",
 "......52113......",
 "......45543......",
 ".......243.......",
 ".......353.......",
 ".....4566654.....",
 "...34566666543...",
 "..3456666655443..",
 "44344555443322111",
 "41.45555443321.01",
 "31.45554433212.01",
 ".2..455443212..1.",
 "....445443211....",
 ".....4544321.....",
 ".....3443321.....",
 "......44321......",
 "......34320......",
 ".......431.......",
 ".......321.......",
 "........1........",
]

MAJIAYAO_JAR = [
 ".......45654.......",
 ".......52113.......",
 ".......45543.......",
 "........343........",
 ".....B5666654A.....",
 "...345BBBBBBB432...",
 "..345666666554332..",
 ".34566666655443321.",
 ".B55666665544332AA.",
 ".4B5BB66BB44AA2212.",
 "4ABB55BB44BA32AAAA.",
 "3.34BBBBBBAAAAA11.1",
 "...3344443322110...",
 "....23344332210....",
 ".....122222111.....",
 "......1111110......",
]

TRADE_JAR = [
 ".......45654.......",
 ".......52113.......",
 ".......45543.......",
 "......2344321......",
 ".55.45666665432.32.",
 ".33456666665444321.",
 ".34566366655143321.",
 ".45666666554433212.",
 ".45666665544332212.",
 ".45566655443322212.",
 ".44556655443322112.",
 "..445555443322111..",
 "..344554433221110..",
 "...3445443322110...",
 "...3344433221110...",
 "....c2dd3cc1baa....",
 ".....bcccbbbaa.....",
 "......aaaaaaa......",
]

URPU = [
 ".....4566654.....",
 ".....5221113.....",
 ".....4566543.....",
 "......45542......",
 ".......453.......",
 ".......453.......",
 "......45543......",
 "....456665432....",
 "..3456663655432..",
 ".3456AAAAAAA4321.",
 ".4556fAeeAed3212.",
 ".4555AeAAeAd3212.",
 "44455fAeeAed2112.",
 "3.445AAAAAAA211.1",
 "..3445544332110..",
 "...34454433210...",
 "....344443210....",
 ".....3443210.....",
 "......34320......",
 ".......231.......",
 "........1........",
]

CROCK = [
 "....566666554....",
 "...53222222224...",
 "..5322222222224..",
 "..5211111111113..",
 ".451000000000141.",
 ".455661000144321.",
 ".455666655444321.",
 ".234444443322110.",
 ".455555544332211.",
 ".456655544332212.",
 ".DEE655544332BBB.",
 ".455EEEDDCCBB212.",
 ".445555DDC322112.",
 ".3455544C3221112.",
 ".344444433221110.",
 "..2333333222110..",
 "...12222211100...",
 ".....1111110.....",
]

WATER_JAR_LID = [
 ".......cefec.......",
 ".....cdeffeedcb....",
 "....cdeeeedddcba...",
 "....bcccccccbbaa...",
 ".....abbbbbbaa.....",
]

ONGGI_LID = [
 ".......deffd.......",
 ".....cdeffeeddc....",
 "...bcdeeeeeddccba..",
 "...abbcccccbbbaaa..",
 "....aaabbbbaaaaa...",
]

CROCK_LID = [
 ".......dfe.......",
 ".......cdc.......",
 "....cdeeeeddc....",
 "..cdeeeffeeddcb..",
 ".cdeeefffeeeddcb.",
 ".cdeeeeeeeedddcb.",
 ".bcddeeeedddccba.",
 ".abbbccccccbbbaa.",
 "...aabbbbbbbaa...",
]

RING_STAND = [
 ".....BCCCCCB.....",
 "...BCDDDDDDDCB...",
 "...ABCCCCCCCBA...",
 ".....AAAAAAA.....",
]
WATER_POOL = [
 "....EFFFE.....",
 "..EFGGFFEED...",
 ".DEFFGFFEEDD..",
 "DEEFFFEEEDDD..",
 ".DDEEEEDDDD...",
 "...DDDDDD.....",
]

RAMPS['brownglaze7'] = ['#160e0a', '#24160f', '#352015', '#4a2c1c', '#623c25', '#7f5233', '#a06d47']


def _jar(body, keys, top=0, left=0, after=(), pool=None):
 """Stamp a jar grid, rim it, and pin the anchor under the jar's own foot
 so a lid or stand set beside it does not move it on the ground."""
 parts = [(body, (left, top)), *after]
 w = max(at[0] + len(g[0]) for g, at in parts)
 h = max(at[1] + len(g) for g, at in parts)
 c = Canvas(w, h)
 for g, at in parts: draw_grid(g, keys, c, at)
 soft_outline(c, keys['0'], keys['2'])
 im = c.image()
 if pool:
  under = draw_grid(pool[0], keys, Canvas(w, h), pool[1]).image()
  under.alpha_composite(im); im = under
 im.info['anchor'] = [left + len(body[0]) // 2 + 1, top + len(body) + 1]
 return im


def _keys(v, body, second=None, third=None):
 pick = lambda r: RAMPS[r[v % len(r)] if isinstance(r, list) else r] if r else None
 return ramp_keys(pick(body), pick(second), pick(third))


def water_jar(v=0, lid=True):
 """A matka: round, short-necked, an incised ring on the shoulder, a saucer
 or a cloth over the mouth."""
 k = _keys(v, ['redearth7', 'terracotta7', 'buffclay7'], ['redearth7', 'brass7', 'linen7'], 'water')
 if lid: return _jar(WATER_JAR, k, top=2, after=[(WATER_JAR_LID, (0, 0))])
 return _jar(WATER_JAR, k, after=[(WATER_JAR_LID, (10, 12))])


def water_jar_open(v=0): return water_jar(v, lid=False)


def water_jar_fallen(v=0):
 k = _keys(v, ['redearth7', 'terracotta7', 'buffclay7'], ['redearth7', 'brass7', 'linen7'], 'water')
 return _jar(lay_down(WATER_JAR), k, left=5, after=[(WATER_JAR_LID, (16, 9))], pool=(WATER_POOL, (0, 8)))


OLLA_RAMPS = ['redearth7', 'terracotta7', 'granite']


def olla(v=0):
 """Burnished earthenware with a flared rim, two lugs and a fire cloud."""
 return _jar(OLLA, _keys(v, OLLA_RAMPS))


def olla_fallen(v=0): return _jar(lay_down(OLLA), _keys(v, OLLA_RAMPS))


ONGGI_RAMPS = (['brownglaze7', 'walnut7', 'brownglaze7'], ['brownglaze7', 'walnut7', 'terracotta7'])


def onggi(v=0, lid=True):
 """Dark-glazed and broad-shouldered, a finger-drawn spray through the glaze,
 the lid an upturned bowl."""
 k = _keys(v, *ONGGI_RAMPS)
 if lid: return _jar(ONGGI, k, top=1, after=[(ONGGI_LID, (0, 0))])
 return _jar(ONGGI, k, after=[(ONGGI_LID, (11, 15))])


def onggi_open(v=0): return onggi(v, lid=False)


EGYPT_RAMPS = (['buffclay7', 'redearth7', 'terracotta7'], None, 'sandstone')


def egyptian_jar(v=0):
 """Tall and ovoid, the mouth sealed with a cone of mud."""
 return _jar(EGYPT_JAR, _keys(v, *EGYPT_RAMPS))


def egyptian_jar_fallen(v=0): return _jar(lay_down(EGYPT_JAR), _keys(v, *EGYPT_RAMPS))


CANAAN_RAMPS = (['buffclay7', 'terracotta7', 'redearth7'], None, 'oak7')


def canaanite_jar(v=0):
 """Carinated shoulder, two loop handles, a pointed foot that needs its ring."""
 return _jar(CANAAN_JAR, _keys(v, *CANAAN_RAMPS), after=[(RING_STAND, (0, 16))])


def canaanite_jar_fallen(v=0):
 return _jar(lay_down(CANAAN_JAR), _keys(v, *CANAAN_RAMPS), after=[(RING_STAND, (12, 10))])


MAJIAYAO_RAMPS = (['terracotta7', 'buffclay7', 'redearth7'], None, 'walnut7')


def majiayao_jar(v=0):
 """A low-bellied jar with lugs, painted in bands and waves on the upper half."""
 return _jar(MAJIAYAO_JAR, _keys(v, *MAJIAYAO_RAMPS))


def majiayao_jar_fallen(v=0): return _jar(lay_down(MAJIAYAO_JAR), _keys(v, *MAJIAYAO_RAMPS))


def trade_jar(v=0):
 """Glazed stoneware with four shoulder lugs; the glaze stops short of the foot."""
 return _jar(TRADE_JAR, _keys(v, ['brownglaze7', 'greenglaze7', 'creamglaze7'], 'buffclay7'))


URPU_RAMPS = (['terracotta7', 'redearth7', 'buffclay7'], 'linen7', 'walnut7')


def urpu(v=0):
 """An aryballos: flared neck, a nub on the shoulder, strap handles low down,
 a painted diamond panel, the pointed foot in a ring."""
 return _jar(URPU, _keys(v, *URPU_RAMPS), after=[(RING_STAND, (0, 17))])


def urpu_fallen(v=0):
 return _jar(lay_down(URPU), _keys(v, *URPU_RAMPS), after=[(RING_STAND, (13, 10))])


CROCK_RAMPS = (['pewter7', 'creamglaze7', 'copper7'], ['pewter7', 'creamglaze7', 'copper7'], 'blueglaze7')


def stoneware_crock(v=0, lid=True):
 """Salt-glazed stoneware: straight walls, a rolled lip, a cobalt band."""
 k = _keys(v, *CROCK_RAMPS)
 if lid: return _jar(CROCK, k, top=2, after=[(CROCK_LID, (0, 0))])
 return _jar(CROCK, k, after=[(CROCK_LID, (10, 12))])


def stoneware_crock_open(v=0): return stoneware_crock(v, lid=False)
