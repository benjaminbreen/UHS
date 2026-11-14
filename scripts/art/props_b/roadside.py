"""What a business stands on its own lot once customers come by car: a pump
island under its canopy, a sign on a pole tall enough to read from the road,
a trolley bay, a menu board, tyres stacked by the bay door.

A canopy is drawn as a roof is: its top seen from above at a moderate depth,
then the fascia below it.
"""
from .core import Canvas, RAMPS
from .kerbside import (RED, BLUE, YELLOW, GREEN, WHITE, ORANGE, BROWN, STEEL, IRON, GLASS, CONCRETE,
                       _box, _cyl, _post, soft_outline)

TEAL = ['#0b2424', '#123a3a', '#1b5656', '#277676', '#3a9a98', '#62bdb8', '#9adcd6']
BULB = ['#5a3a08', '#f0b030', '#fff2b0']


def _pump(c, x, y0, y1, m, globe=None):
 """One pump: cabinet, dial, hose down its right side."""
 _box(c, x, y0, x + 5, y1, m)
 c.rect(x + 1, y0 + 2, x + 4, y0 + 5, WHITE[6]); c.hline(x + 1, x + 4, y0 + 4, IRON[2])   # the dial
 c.set(x + 2, y0 + 3, IRON[1]); c.set(x + 3, y0 + 3, IRON[1])
 c.hline(x + 1, x + 4, y0 + 7, m[5])
 for y in range(y0 + 4, y1 - 1): c.set(x + 6, y, IRON[1])                               # the hose
 c.set(x + 5, y0 + 4, STEEL[5]); c.set(x + 6, y1 - 1, STEEL[4])
 if globe:
  c.rect(x + 1, y0 - 5, x + 4, y0 - 1, globe[6]); c.hline(x + 2, x + 3, y0 - 6, globe[6])
  c.set(x + 2, y0 - 3, m[3]); c.set(x + 3, y0 - 3, m[3]); c.vline(x + 4, y0 - 5, y0 - 1, globe[4])


def pump_island(v=0):
 """v0 two globe-topped pumps of the thirties on a bare island, v1 the
 postwar station's flat canopy with a red band, v2 the wide branded canopy
 of the self-service years, v3 the same in green."""
 if v == 0:
  c = Canvas(30, 34)
  _box(c, 1, 29, 28, 32, CONCRETE); c.hline(1, 28, 29, CONCRETE[6])
  _pump(c, 5, 12, 28, RED, WHITE); _pump(c, 17, 12, 28, RED, WHITE)
  _post(c, 14, 4, 28, IRON); c.rect(12, 1, 17, 4, WHITE[6]); c.set(14, 2, YELLOW[4]); c.set(15, 3, YELLOW[4])   # the lamp
  soft_outline(c, IRON[0], RED[2])
  return c.image()
 band = (RED, BLUE, GREEN)[v - 1]
 w = 52 if v == 1 else 64
 c = Canvas(w, 56)
 # The canopy: its top from above, then the fascia.
 c.rect(1, 1, w - 2, 12, WHITE[5])
 for x in range(1, w - 1):
  c.set(x, 1, WHITE[6]); c.set(x, 12, WHITE[3])
 for x in range(6, w - 4, 9): c.vline(x, 2, 11, WHITE[4])                               # the roof's seams
 c.vline(1, 1, 12, WHITE[6]); c.vline(w - 2, 1, 12, WHITE[3])
 c.rect(1, 13, w - 2, 17, band[3]); c.hline(1, w - 2, 13, band[5]); c.hline(1, w - 2, 17, band[1])
 for x in range(w // 2 - 7, w // 2 + 8, 2): c.set(x, 15, WHITE[6])                      # the name
 c.hline(3, w - 4, 18, IRON[1])                                                        # the soffit in shadow
 for x in range(8, w - 6, 10): c.set(x, 18, BULB[2]); c.set(x + 1, 18, BULB[1])         # its lights
 for x in (6, w - 9):
  c.vline(x, 19, 50, STEEL[5]); c.vline(x + 1, 19, 50, STEEL[4]); c.vline(x + 2, 19, 50, STEEL[1])
 _box(c, 3, 50, w - 4, 54, CONCRETE); c.hline(3, w - 4, 50, CONCRETE[6])
 body = WHITE if v == 1 else STEEL
 for x in ((16, 30) if v == 1 else (16, 29, 42)):
  _pump(c, x, 32, 49, body)
  c.rect(x, 32, x + 5, 33, band[4])
 # A bin and a squeegee bucket between the pumps.
 c.rect(w - 14, 44, w - 12, 49, band[2]); c.hline(w - 14, w - 12, 44, band[5])
 soft_outline(c, IRON[0], IRON[2])
 return c.image()


def price_sign(v=0):
 """The station's sign at the road: v0 a round globe sign on a pole, v1 a
 red panel with its prices under it, v2 blue, v3 green."""
 c = Canvas(20, 52)
 _post(c, 9, 14, 50, STEEL)
 if v == 0:
  for i, (a, b) in enumerate(((6, 13), (4, 15), (3, 16), (2, 17), (2, 17), (2, 17), (2, 17), (2, 17), (3, 16), (4, 15), (6, 13))):
   c.hline(a, b, 2 + i, WHITE[6] if i < 6 else WHITE[5]); c.set(a, 2 + i, RED[4]); c.set(b, 2 + i, RED[3])
  c.hline(6, 13, 2, RED[4]); c.hline(6, 13, 12, RED[3])
  for x in range(6, 14, 2): c.set(x, 7, RED[3])
  c.hline(8, 11, 13, IRON[2])
  m = RED
 else:
  m = (RED, BLUE, GREEN)[v - 1]
  _box(c, 2, 1, 17, 12, m)
  c.rect(4, 3, 15, 6, WHITE[6])
  for x in range(5, 15, 2): c.set(x, 5, m[2]); c.set(x, 4, m[3])
  c.hline(4, 15, 9, WHITE[5])
  _box(c, 4, 15, 15, 26, WHITE)
  for y in (17, 20, 23):
   for x in (6, 8, 10, 13): c.set(x, y, IRON[1]); c.set(x, y + 1, IRON[1])
 c.hline(7, 12, 51, STEEL[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def pole_sign(v=0, motion=0):
 """A business's sign on a tall pole, chasing bulbs round its edge: v0 a
 motel arrow, v1 a diner's round sign, v2 a market's panel, v3 a drive-in's
 star."""
 c = Canvas(26, 54)
 _post(c, 12, 18, 52, STEEL)
 lit = lambda n: BULB[2] if (n + motion) % 4 == 0 else BULB[0]
 if v == 0:
  _box(c, 1, 2, 24, 12, RED)
  for x in range(4, 22, 3): c.set(x, 6, WHITE[6]); c.set(x, 7, WHITE[6]); c.set(x + 1, 6, WHITE[5])
  c.poly([(3, 14), (17, 14), (17, 12), (23, 16), (17, 20), (17, 18), (3, 18)], YELLOW[4])   # the arrow
  c.hline(3, 17, 14, YELLOW[6])
  for n, x in enumerate(range(4, 22, 3)): c.set(x, 16, lit(n))
  m = RED
 elif v == 1:
  for i, (a, b) in enumerate(((8, 17), (5, 20), (3, 22), (2, 23), (2, 23), (1, 24), (1, 24), (1, 24), (2, 23), (2, 23), (3, 22), (5, 20), (8, 17))):
   c.hline(a, b, 2 + i, TEAL[4] if i < 6 else TEAL[3])
   c.set(a, 2 + i, lit(i)); c.set(b, 2 + i, lit(i + 2))
  c.rect(5, 6, 20, 10, WHITE[6])
  for x in range(7, 20, 3): c.set(x, 8, RED[3]); c.set(x + 1, 8, RED[3])
  c.rect(11, 15, 14, 17, STEEL[3])
  m = TEAL
 elif v == 2:
  _box(c, 1, 2, 24, 14, GREEN)
  c.rect(3, 4, 22, 9, WHITE[6])
  for x in range(5, 21, 2): c.set(x, 6, GREEN[2]); c.set(x, 7, GREEN[3])
  for n, x in enumerate(range(3, 23, 3)): c.set(x, 12, lit(n))
  c.rect(11, 15, 14, 17, STEEL[3])
  m = GREEN
 else:
  c.poly([(13, 0), (16, 7), (24, 7), (18, 12), (21, 19), (13, 15), (5, 19), (8, 12), (2, 7), (10, 7)], ORANGE[4])
  c.poly([(13, 3), (15, 8), (20, 8), (16, 11), (13, 9)], ORANGE[5])
  for n, (x, y) in enumerate(((13, 1), (23, 7), (20, 18), (6, 18), (3, 7))): c.set(x, y, lit(n))
  c.rect(8, 9, 18, 12, WHITE[6])
  for x in range(9, 18, 2): c.set(x, 10, RED[3])
  m = ORANGE
 c.hline(10, 15, 53, STEEL[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def trolley_bay(v=0):
 """Shopping trolleys nested in a rail corral: v0 full, v1 a few left."""
 c = Canvas(34, 18)
 for x in (1, 31):
  c.vline(x, 6, 16, STEEL[5]); c.vline(x + 1, 6, 16, STEEL[2])
 c.hline(1, 32, 6, STEEL[5]); c.hline(1, 32, 7, STEEL[2])
 for i in range(6 if v == 0 else 2):
  x = 4 + i * 4
  for y in range(8, 13):
   for dx in range(5):
    if (dx + y) % 2 == 0 or dx in (0, 4): c.set(x + dx, y, STEEL[5 if dx < 2 else 3])
  c.hline(x, x + 4, 8, STEEL[6]); c.hline(x + 1, x + 4, 13, STEEL[2])
  c.set(x + 5, 7, RED[4]); c.set(x + 6, 7, RED[3])                                       # the handle
  c.set(x + 1, 15, IRON[1]); c.set(x + 4, 15, IRON[1]); c.set(x + 1, 14, STEEL[3]); c.set(x + 4, 14, STEEL[3])
 c.hline(0, 33, 17, STEEL[1])
 return c.image()


def menu_board(v=0):
 """A drive-in's menu on two posts with the speaker under it: v0 red, v1
 teal."""
 m = (RED, TEAL)[v]
 c = Canvas(18, 30)
 for x in (3, 13): _post(c, x, 14, 28, STEEL)
 _box(c, 1, 2, 16, 14, m)
 c.hline(1, 16, 1, m[6])
 c.rect(2, 4, 15, 12, WHITE[6])
 for y in (5, 7, 9, 11):
  c.hline(3, 8, y, IRON[2]); c.set(13, y, RED[3]); c.set(14, y, RED[3])
 c.rect(4, 6, 6, 6, ORANGE[4]); c.rect(4, 10, 6, 10, YELLOW[4])
 _box(c, 6, 17, 11, 22, STEEL)
 for y in (18, 20): c.hline(7, 10, y, IRON[1])
 c.hline(2, 15, 29, STEEL[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def tyre_stack(v=0):
 """Tyres stacked by a garage door: v0 a tall stack, v1 two short ones."""
 c = Canvas(22, 20)
 def tyre(cx, y):
  c.rect(cx - 4, y, cx + 4, y + 2, IRON[2])
  c.hline(cx - 3, cx + 3, y, IRON[4]); c.hline(cx - 4, cx + 4, y + 2, IRON[0])
  c.set(cx - 4, y + 1, IRON[4]); c.set(cx + 4, y + 1, IRON[1])
  for x in range(cx - 3, cx + 4, 2): c.set(x, y + 1, IRON[3])
 def top(cx, y):
  c.hline(cx - 2, cx + 2, y - 1, IRON[3]); c.hline(cx - 1, cx + 1, y - 1, IRON[0])
 if v == 0:
  for i in range(5): tyre(11, 16 - i * 3)
  top(11, 4)
 else:
  for i in range(3): tyre(6, 16 - i * 3)
  for i in range(2): tyre(16, 16 - i * 3)
  top(6, 10); top(16, 13)
 soft_outline(c, IRON[0], IRON[1])
 return c.image()


def ice_chest(v=0):
 """The freezer outside a store's door: v0 bagged ice, v1 a soft-drink
 cooler."""
 c = Canvas(24, 18)
 _box(c, 1, 2, 22, 15, WHITE)
 c.hline(1, 22, 1, WHITE[6])
 m = BLUE if v == 0 else RED
 c.rect(3, 4, 20, 8, m[3]); c.hline(3, 20, 4, m[5])
 for x in ((7, 8, 11, 12, 15, 16) if v == 0 else range(6, 19, 2)): c.set(x, 6, WHITE[6])
 if v == 0:
  for x in (5, 18): c.set(x, 5, WHITE[6]); c.set(x, 7, WHITE[5])                         # frost
 c.vline(12, 9, 14, WHITE[2]); c.set(10, 11, STEEL[2]); c.set(14, 11, STEEL[2])          # the doors
 c.hline(2, 21, 16, IRON[1]); c.hline(1, 22, 17, IRON[0])
 soft_outline(c, WHITE[0], WHITE[2])
 return c.image()


def produce_stand(v=0):
 """Crates of fruit tilted out on a stand in front of a grocer: v0 apples
 and oranges, v1 greens and melons."""
 c = Canvas(30, 18)
 fruit = ((RED[4], ORANGE[5], YELLOW[5]), (GREEN[5], GREEN[4], YELLOW[4]))[v]
 for i in range(3):
  x = 1 + i * 10
  _box(c, x, 3, x + 8, 11, BROWN)
  for y in range(4, 10):
   for dx in range(1, 8):
    k = fruit[(i + (dx + y) // 2) % 3] if (dx + y * 2 + i) % 3 else fruit[i % 3]
    c.set(x + dx, y, k)
  for dx in range(1, 8, 2): c.set(x + dx, 4 + dx % 3, WHITE[6])                          # the shine
  c.hline(x, x + 8, 11, BROWN[5]); c.hline(x, x + 8, 12, BROWN[2])
 for x in (3, 26):
  c.vline(x, 13, 16, BROWN[4]); c.vline(x + 1, 13, 16, BROWN[1])
 c.hline(2, 28, 17, BROWN[1])
 soft_outline(c, BROWN[0], BROWN[2])
 return c.image()


ROADSIDE = {
 'pump-island': pump_island,
 'price-sign': price_sign,
 'pole-sign': pole_sign,
 'trolley-bay': trolley_bay,
 'menu-board': menu_board,
 'tyre-stack': tyre_stack,
 'ice-chest': ice_chest,
 'produce-stand': produce_stand,
}
