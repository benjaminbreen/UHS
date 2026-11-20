"""What a yard or a street carries from the factory age on."""
from .core import (Canvas, RAMPS, belly, jitter, revolve, soft_outline, grass, draw_grid, ramp_keys)
from .solid import K, disc, lathe
from .workshop import streak

WOOD7 = ['oak7', 'walnut7', 'ash7']


def municipal_planter(v=0):
 """A low cast-stone trough with geraniums; about 1.6 metres across."""
 c = Canvas(29, 23)
 stone = [['#595f5b', '#7b8076', '#a5a899', '#c6c5ad', '#e2dcc2'],
          ['#5b5550', '#81796b', '#a89d85', '#c8b99c', '#e1cfad'],
          ['#444e53', '#66747b', '#8b9b9d', '#b0bbba', '#d4d8cf']][v]
 c.rect(2, 11, 26, 19, stone[2]); c.hline(3, 25, 20, stone[1])
 c.rect(4, 21, 8, 22, stone[0]); c.rect(21, 21, 24, 22, stone[0])
 c.rect(0, 8, 28, 11, stone[3]); c.hline(0, 28, 8, stone[4])
 c.hline(2, 26, 9, '#454238'); c.hline(2, 26, 12, stone[1])
 for x in range(4, 26, 5):
  c.rect(x, 5, x + 1, 9, '#435c36')
  c.hline(x - 2, x + 3, 6, '#638049'); c.hline(x - 1, x + 2, 5, '#8d9a54')
  c.rect(x - 1, 2 + x % 3, x + 2, 4 + x % 3, '#913f47')
  c.hline(x - 1, x + 1, 2 + x % 3, '#d47772'); c.set(x, 3 + x % 3, '#e7ad81')
 for x in (5, 14, 22): c.set(x, 15, stone[3]); c.set(x + 1, 17, stone[1])
 return c.image()


def works_fence(v=0):
 """One ground-grid cell of wire mesh, 1.4m high; across and into the scene."""
 c = Canvas(16, 26 if v == 0 else 42)
 if v == 0:
  for y in range(4, 24):
   for x in range(16):
    if (x + y) % 7 == 0 or (x - y) % 7 == 0:
     c.set(x, y, '#839087' if (x + y) % 7 == 0 else '#526663')
  for y in (3, 23): c.hline(0, 15, y, '#667b77')
  c.rect(0, 1, 1, 25, '#445751'); c.vline(0, 1, 24, '#a0aaa0')
  c.hline(0, 2, 0, '#b9c0ae'); c.hline(0, 3, 25, '#394942')
 else:
  for y in range(4, 40):
   c.set(8, y, '#5a716b')
   if y % 4 < 2: c.set(9, y, '#91a096')
  c.rect(6, 0, 7, 25, '#425750'); c.vline(6, 0, 24, '#a0aaa0')
  c.rect(6, 16, 7, 41, '#425750'); c.vline(6, 16, 40, '#a0aaa0')
  c.hline(5, 8, 16, '#bdc2b0'); c.hline(5, 9, 41, '#394942')
 return c.image()


DUSTBIN_RAMPS = ['galvanised7', 'blackiron7', 'rustred7']

# The lid is its own grid so it can come off. Its ellipse is the body's at K.
DUSTBIN_LID = [
 "....56666666555....",
 "..564562333254334..",
 ".54456566665443334.",
 "5444455200023323333",
 "5444444433332223333",
 "5444444442222233332",
 "4544444444333333321",
 ".46444444433333331.",
 "..5664444433333320.",
 "...45555544444220..",
 ".....444443333.....",
]

DUSTBIN_BODY = [
 *["." * 19] * 8,
 ".1...............0.",
 ".32.............02.",
 ".3434.........0012.",
 ".44563222111102213.",
 "5255654443333222212",
 "4336654443333233021",
 ".34456555444431112.",
 ".34564333222212212.",
 ".34565444333322212.",
 ".44565444333322213.",
 ".25565444333322221.",
 ".33665444333323302.",
 ".34456555444431112.",
 ".34564333222212212.",
 ".24565444333322211.",
 "..356544433332220..",
 "...4554443333211...",
 ".....433322221.....",
]

# Seen into with the lid off: the far wall lit on the right, rubbish below.
DUSTBIN_MOUTH = [
 ".....666665555.....",
 "...6611234455455...",
 "..611111234443444..",
 ".61111111122333334.",
 ".111FFE11cd1122333.",
 ".51FED11cdd1112222.",
 "..51111bc11111112..",
 "...56111111111333..",
 ".....655544433.....",
]

# A blow's worth: lit lip, dark inner slope, the silhouette bitten in.
DUSTBIN_DENT = [
 "..66665..",
 "x6211125.",
 "x2111345.",
 "x3113562.",
 ".4235562.",
 "..42222..",
]


def _dustbin(v, lid=True, dent=False):
 m = RAMPS[DUSTBIN_RAMPS[v]]
 keys = ramp_keys(m, RAMPS['oak7'], RAMPS['linen7'])
 c = Canvas(31 if not lid else 19, 26)
 draw_grid(DUSTBIN_BODY, keys, c)
 draw_grid(DUSTBIN_LID if lid else DUSTBIN_MOUTH, keys, c, (0, 0 if lid else 3))
 if dent: draw_grid(DUSTBIN_DENT, keys, c, (1, 13))
 if not lid: draw_grid(DUSTBIN_LID, keys, c, (12, 15))
 soft_outline(c, m[0], m[2])
 im = c.image()
 im.info['anchor'] = [10, 27]
 return im


def dustbin(v=0):
 """A galvanised bin: ribbed body, domed lid with a strap handle, a handle
 each side."""
 return _dustbin(v)


def dustbin_open(v=0): return _dustbin(v, lid=False)
def dustbin_dented(v=0): return _dustbin(v, dent=True)
def dustbin_dented_open(v=0): return _dustbin(v, lid=False, dent=True)


# A four-gallon tin with its top cut out and a stick nailed across for a
# handle: how most of them were reused. About 35cm high, drawn above life.
KEROSENE_TIN = [
 "5666666666665",
 "5333333333332",
 "5100000000012",
 "nwwwwwwwwwwwn",
 "uvvvvvvvvvvvu",
 "5100000000012",
 "6666666666664",
 "5444444444432",
 "5455555555532",
 "545ddddddd232",
 "545dgggggd232",
 "545dgDDDgd232",
 "545dgggggd232",
 "545ddddddd232",
 "545efefefe232",
 "5432222222232",
 "5444444444432",
 "5444444444432",
 "3222222222221",
]
KEROSENE_DENT = [
 "x25",
 "x13",
 "x24",
]
KEROSENE_LOOKS = [('pewter7', 'paintblue7', 'rustred7'),
                  ('pewter7', 'brasspot7', 'rustred7'),
                  ('rustred7', 'galvanised7', 'rustred7')]


def kerosene_tin(v=0, dent=False):
 """Tinplate, a faded printed panel, the cut rim folded over."""
 body, label, mark = (RAMPS[r] for r in KEROSENE_LOOKS[v])
 oak = RAMPS['oak7']
 keys = ramp_keys(body, label, mark, w=oak[5], v=oak[3], u=oak[1], n=RAMPS['iron7'][2])
 c = draw_grid(KEROSENE_TIN, keys)
 if dent: draw_grid(KEROSENE_DENT, keys, c, (0, 13))
 soft_outline(c, body[0], body[2])
 return c.image()


def kerosene_tin_dented(v=0): return kerosene_tin(v, dent=True)


def steel_drum(v=0):
 """A two-hundred-litre drum: rolling hoops, a chimed lid with its bungs,
 rust at the foot."""
 m = RAMPS[['paintblue7', 'rustred7', 'galvanised7'][v]]
 rust = RAMPS['rustred7']
 c = Canvas(20, 30)
 cx, by = 10, 28
 def hoops(z, a, i):
  if int(z) in (6, 13): return i + 1
  if int(z) in (7, 14): return i - 2
  return i
 lathe(c, cx, by, [(0, 8.6), (20, 8.6)], m, hoops)
 ty = by - 20 - 8.6 * K
 disc(c, cx, ty, 7.4, 3.5, m[4]); disc(c, cx + .4, ty + .2, 6.8, 3.0, m[5])
 c.set(cx + 3, int(ty) - 1, m[1]); c.set(cx + 4, int(ty) - 1, m[2]); c.set(cx - 4, int(ty) + 1, m[2])
 for x, y in ((3, 25), (16, 24), (4, 27), (15, 27), (6, 28)):
  if c.get(x, y): c.set(x, y, rust[3])
 soft_outline(c, m[0], m[2])
 return c.image()


def wheelbarrow(v=0):
 """A barrow: planked tray, spoked wheel in an iron tyre, two handles."""
 from math import hypot
 c = Canvas(40, 28)
 steel = v == 2
 w = RAMPS['galvanised7'] if steel else RAMPS[WOOD7[v]]
 m = RAMPS['blackiron7']
 tray = {}
 for y in range(3, 14):                           # the tray, flaring upward
  t = (y - 3) / 10
  tray[y] = (round(10 - t * 3), round(31 - t * 4))
 for y, (a, b) in tray.items():
  tone = 5 if y < 6 else 4 if y < 11 else 3
  c.hline(a, b, y, w[tone])
  if not steel: streak(c, a, b, y, w, tone)
  c.set(a, y, w[2]); c.set(b, y, w[2])
 c.hline(10, 31, 3, w[6])                         # the lip of the tray
 c.hline(8, 28, 13, w[1])
 if not steel:
  for y in (7, 10):                               # plank joins across it
   for x in range(9, 30):
    if c.get(x, y): c.set(x, y, w[2])
 for bx in (13, 26):                              # iron straps over the tray
  for y in range(4, 13):
   if c.get(bx, y): c.set(bx, y, m[4] if bx < 20 else m[3])
   if c.get(bx + 1, y): c.set(bx + 1, y, m[1])
 for i, x in enumerate(range(28, 40)):            # the handles, rising to the hand
  y = 12 - (i * 7) // 11
  c.set(x, y, w[5]); c.set(x, y + 1, w[3]); c.set(x, y + 2, w[1])
 c.rect(38, 4, 39, 6, w[4]); c.set(38, 4, w[6])   # the grips
 for lx in (20, 26):                              # the legs it stands on
  for y in range(14, 19):
   c.set(lx, y, w[3]); c.set(lx + 1, y, w[1])
  c.set(lx, 19, m[3]); c.set(lx + 1, 19, m[1])
 for y in range(9, 23):                           # the wheel
  for x in range(1, 17):
   d = hypot((x + .5 - 8.5) / 7.4, (y + .5 - 16) / 6.8)
   if d > 1: continue
   c.set(x, y, w[3] if d > 0.55 else w[2])
   if d > 0.80: c.set(x, y, m[4] if x < 9 else m[2])
 for dx, dy in [(0, -5), (0, 5), (-5, 0), (5, 0), (-4, -3), (4, 3), (-4, 3), (4, -3)]:
  c.set(8 + dx, 16 + dy, w[5] if dx <= 0 else w[2])   # spokes
 for x, y in [(7, 15), (8, 15), (7, 16), (8, 16)]:    # the hub
  c.set(x, y, m[4] if x < 8 else m[2])
 for x in range(10, 22):                          # the frame down to the axle
  c.set(x, 14, w[2]); c.set(x, 15, w[1])
 c.px = {(x, y + 4): col for (x, y), col in c.px.items()}
 for y in range(1, 7):
  a, b = 11 + (y < 3), 30 - (y < 3)
  c.hline(a, b, y, w[5] if y == 1 else w[2] if y < 3 else w[1])
  c.set(a - 1, y, w[4]); c.set(b + 1, y, w[2])
 c.hline(10, 31, 0, w[5])
 soft_outline(c, m[0] if steel else w[0], w[2])
 return c.image()



# A wheeled bin square on, its lid seen from above: about 1.05m, so a head
# taller than the galvanised bin. Wheels at the back show at the foot.
WHEELIE = [
 "..2455555555542..",
 ".122222222222221.",
 "45666666666665543",
 "45555555555554432",
 "45533333333333432",
 "45544444444444432",
 "45566666666666432",
 "45555555555544432",
 "56666666666666654",
 "44444444444433321",
 "12222222222222221",
 ".432222222222210.",
 ".543333333333321.",
 ".541111111111121.",
 ".545555555555521.",
 ".543333333333321.",
 ".543333www333321.",
 ".543333w3w333321.",
 ".543333333333321.",
 ".543333333333321.",
 ".543333333333321.",
 ".543333333333321.",
 "..5433333333321..",
 "..5433333333321..",
 "..5433333333321..",
 ".b5433333333321a.",
 "bc5433333333321ba",
 "be5433333333321ca",
 "bc4322222222210ba",
 ".a1111111111111a.",
]

# Lid thrown back over the handle; the sacks inside.
WHEELIE_MOUTH = [
 ".244444444444442.",
 ".122222222222221.",
 "x566666666666654x",
 "x533333333333323x",
 "x522222222222213x",
 "x51aabbb1wwk1113x",
 "x51abccba1wwkk13x",
 "x51aabba11kkk113x",
 "x666666666666654x",
 "x444444444444432x",
 "x543333333333321x",
 ".543333333333321.",
]
WHEELIE_RAMPS = ['bingreen7', 'blackiron7', 'paintblue7', 'binbrown7']


def _wheelie(v, lid=True, fallen=False):
 m = RAMPS[WHEELIE_RAMPS[v]]
 sack = RAMPS['blackiron7'] if v != 1 else RAMPS['castiron7']
 keys = ramp_keys(m, sack, RAMPS['oak7'], w=RAMPS['linen7'][6], k=RAMPS['linen7'][4])
 if fallen: c = draw_grid(WHEELIE_FALLEN, keys)
 else: c = draw_grid(WHEELIE, keys)
 if not lid and not fallen: draw_grid(WHEELIE_MOUTH, keys, c)
 soft_outline(c, m[0], m[2])
 return c.image()


# On its side, top to the right: the side panel is the top now, a wheel
# turned up at the foot, the lid flopped open and the sacks out of it.
WHEELIE_FALLEN = [
 ".bbb.......................32........",
 "bcecb666666666666666666655521........",
 "1bcb5555555555555555444444421........",
 "15566666666666666666666664421........",
 "15544444444444444444444444421........",
 "16666666666666666666666666621........",
 "14444444444444444444444444421........",
 "15566666666666666666666664421........",
 "15544444444444444444444444421........",
 "155555555555555555554444444..........",
 "155555555556666666666665426..........",
 "166666666664444444444445426..........",
 "144444444443333333315335426..........",
 "133333333333333333315335426..........",
 "133333333333333333315335425..........",
 "133333333333333ww3315335425..........",
 "133333333333333w33315335425..........",
 "133333333333333ww3315335425.45555555.",
 "133333333333333333315335425433233233.",
 "133333333333333333315335425333233233.",
 "bb3333333333333333315335425222222222.",
 "ceb33333333333333331533bcb5.11111111.",
 "bcb2222222222222222222bdccb.wwk.CD.b.",
 "aa111111111111111111111abbakwwk.BCbca",
 ".aa.........................kk.......",
]


def wheelie_bin(v=0):
 """The household's wheeled bin at the kerb: green, black, blue or brown as
 the council sorts its rubbish, with the house number painted on."""
 return _wheelie(v)


def wheelie_bin_open(v=0): return _wheelie(v, lid=False)
def wheelie_bin_fallen(v=0): return _wheelie(v, fallen=True)


# Three forms the street's bin has taken, one grid each.
STREET_BIN = [
 # A cast-iron basket on a post, painted green: the city from the 1880s.
 ["....5666666....",
  "..56111111165..",
  ".5611fe1C1164..",
  "561ffe1CC1e1164",
  ".561eff1C11164.",
  "..56666666654..",
  "....5666654....",
  ".4151514131312.",
  ".4151514131312.",
  "..45151413132..",
  "..56665544332..",
  "..45151413132..",
  "...415141312...",
  "....4444332....",
  ".....33221.....",
  "......42.......",
  "......42.......",
  "......42.......",
  "......42.......",
  "....45444322...",
  ".....211110....",
 ],
 # The Soviet concrete urn on its foot.
 ["....6666666....",
  "..66333333363..",
  ".6611fe1C11163.",
  "661ef1CC1111133",
  ".6111111111113.",
  "..55555544433..",
  "....6666654....",
  ".4566655443321.",
  "..45665544332..",
  "...456544332...",
  "....4554322....",
  ".....43221.....",
  ".....45421.....",
  "....5655432....",
  "....4544321....",
  ".....33221.....",
 ],
 # A steel bin under a hood with its mouth in front: the street since 1960.
 ["......666......",
  "...665555566...",
  "..65555554442..",
  ".6555000004442.",
  ".65501ffe10332.",
  ".65501eee10332.",
  ".6556666666332.",
  ".1644433333320.",
  ".3222222222212.",
  ".3445654332212.",
  ".3445654332212.",
  ".3445654332212.",
  ".3445654332212.",
  ".4445654332213.",
  ".2545654332221.",
  ".3356665443302.",
  ".3434543221112.",
  "..44565433221..",
  "...456543322...",
 ],
]
STREET_BIN_RAMPS = ['bingreen7', 'limestone', 'galvanised7']


def street_bin(v=0):
 """The square's litter bin in the form of its day: iron basket, concrete
 urn or hooded steel."""
 m = RAMPS[STREET_BIN_RAMPS[v]]
 c = draw_grid(STREET_BIN[v], ramp_keys(m, RAMPS['linen7'], RAMPS['oak7']))
 soft_outline(c, m[0], m[2])
 return c.image()
