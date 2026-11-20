"""What stands at the kerb once there are cars: hydrants, post boxes, phones,
bus stops, meters, bins. Each family's variants are the same object as
different countries made it, so a street is dated and placed by its small
things as much as by its buildings.

Sizes follow PROP_ART.md: a metre is about 17 px, and small things are drawn
a little over life so they carry their own detail.
"""
from .core import Canvas, RAMPS, soft_outline, draw_grid, ramp_keys

RED = ['#2a0a0a', '#4a1010', '#7a1a17', '#a82620', '#c93a2e', '#e25a48', '#f08a76']
BLUE = RAMPS['paintblue7']
YELLOW = ['#3a2c07', '#5c4610', '#826418', '#a98422', '#c9a232', '#dfbe52', '#efd786']
GREEN = ['#0e1a14', '#15271e', '#1f3a2b', '#2b4f3a', '#3b664b', '#52805f', '#6f9b78']
OLIVE = ['#1a1c10', '#2a2d18', '#3c4022', '#51562e', '#696f3d', '#858b52', '#a3a870']
WHITE = ['#3a3d40', '#5a5e61', '#82868a', '#a9adb0', '#c8cbcc', '#e0e2e1', '#f3f4f1']
ORANGE = ['#3a1a06', '#5e2c0a', '#8a4410', '#b55f18', '#d97e26', '#eea04a', '#f8c486']
BROWN = ['#1c140e', '#2c2016', '#3d2c1e', '#503b28', '#664c34', '#7d5f42', '#957454']
STEEL = RAMPS['galvanised7']
IRON = RAMPS['blackiron7']
GLASS = ['#16242c', '#22363f', '#33505b', '#4b7280', '#6f97a3', '#9bbcc4', '#c9dfe2']
CONCRETE = ['#2c2c2a', '#454541', '#62625c', '#82827a', '#a09f96', '#bab9af', '#d2d1c8']


def _box(c, x0, y0, x1, y1, m):
 """A flat-fronted box lit from the upper left."""
 c.rect(x0, y0, x1, y1, m[3])
 c.vline(x0, y0, y1, m[5]); c.vline(x1, y0, y1, m[1])
 c.hline(x0, x1, y0, m[6]); c.hline(x0, x1, y1, m[1])


def _cyl(c, x0, x1, y0, y1, m):
 """An upright cylinder: the light a third of the way in from the left."""
 w = max(1, x1 - x0)
 for x in range(x0, x1 + 1):
  t = (x - x0) / w
  c.vline(x, y0, y1, m[4 if t < 0.15 else 6 if t < 0.35 else 4 if t < 0.55 else 3 if t < 0.8 else 1])


def _post(c, x, y0, y1, m):
 c.vline(x, y0, y1, m[5]); c.vline(x + 1, y0, y1, m[2])


def _foot(c, x0, x1, y, m):
 c.hline(x0, x1, y, m[1])


def hydrant(v=0):
 """v0 the red American hydrant, v1 the same in yellow with a green bonnet,
 v2 the slim red pillar hydrant of the Continent, v3 the Japanese sign that
 marks a hydrant under the road."""
 if v == 3:
  c = Canvas(11, 36)
  _post(c, 5, 10, 34, WHITE)
  for i, (a, b) in enumerate(((3, 7), (2, 8), (1, 9), (1, 9), (1, 9), (1, 9), (1, 9), (2, 8), (3, 7))):
   c.hline(a, b, 1 + i, RED[4 if a + 2 > i else 3])
   c.set(a, 1 + i, WHITE[6]); c.set(b, 1 + i, WHITE[4])
  c.hline(3, 7, 1, WHITE[6]); c.hline(3, 7, 9, WHITE[4])
  for x, y in ((4, 4), (5, 4), (6, 4), (5, 5), (4, 6), (6, 6)): c.set(x, y, WHITE[6])
  _foot(c, 4, 7, 35, WHITE)
  soft_outline(c, RED[0], RED[2])
  return c.image()
 if v == 2:
  c = Canvas(9, 19)
  _cyl(c, 2, 6, 5, 17, RED)
  c.hline(1, 7, 4, RED[5]); c.hline(2, 6, 3, RED[4]); c.hline(3, 5, 2, RED[6]); c.set(4, 1, RED[5])
  for y in (8, 12):
   c.set(1, y, RED[5]); c.set(0, y, STEEL[5]); c.set(7, y, RED[2]); c.set(8, y, STEEL[2])
  c.hline(1, 7, 18, RED[1])
  soft_outline(c, RED[0], RED[2])
  return c.image()
 body = RED if v == 0 else YELLOW
 cap = RED if v == 0 else GREEN
 c = Canvas(11, 16)
 _cyl(c, 3, 7, 6, 13, body)
 c.hline(2, 8, 5, cap[5]); c.hline(2, 8, 4, cap[4]); c.hline(3, 7, 3, cap[5]); c.hline(4, 6, 2, cap[6])
 c.set(5, 1, STEEL[5]); c.set(5, 0, STEEL[4])                # the operating nut
 for x, m in ((1, 5), (2, 4), (8, 3), (9, 2)):               # the two hose nozzles
  c.set(x, 8, body[m]); c.set(x, 9, body[max(1, m - 1)])
 c.set(0, 8, STEEL[5]); c.set(0, 9, STEEL[3]); c.set(10, 8, STEEL[3]); c.set(10, 9, STEEL[1])
 c.rect(4, 8, 5, 9, cap[5]); c.set(5, 9, cap[3])             # the pumper cap, facing
 c.hline(2, 8, 14, body[3]); c.set(2, 14, body[5]); c.hline(2, 8, 15, body[1])
 soft_outline(c, body[0], body[2])
 return c.image()


def _pillar(c, m, band=None, base=IRON):
 """A cast-iron pillar box: cap, body, plinth."""
 _cyl(c, 1, 9, 5, 24, m)
 c.hline(0, 10, 4, m[2]); c.hline(0, 10, 3, m[5]); c.hline(1, 9, 2, m[4]); c.hline(3, 7, 1, m[6])
 c.hline(3, 7, 8, IRON[0]); c.hline(3, 7, 7, m[2])           # the mouth under its hood
 c.rect(4, 11, 6, 14, WHITE[5]); c.set(5, 12, IRON[1]); c.set(5, 13, IRON[1])
 if band: c.hline(1, 9, 6, band); c.hline(1, 9, 22, band)
 c.rect(0, 24, 10, 26, base[2]); c.hline(0, 10, 24, base[4]); c.hline(0, 10, 26, base[0])


def post_box(v=0):
 """v0 the blue American collection box, v1 its olive-drab forerunner, v2
 the British red pillar, v3 the Japanese red post with its conical cap, v4
 the yellow box on a post of the Continent, v5 a green pillar as Ireland and
 China painted theirs."""
 if v in (2, 5):
  c = Canvas(11, 27)
  m = RED if v == 2 else GREEN
  _pillar(c, m, band='#d9b84a' if v == 5 else None)
  soft_outline(c, m[0], m[2])
  return c.image()
 if v == 3:
  c = Canvas(10, 25)
  _cyl(c, 1, 8, 6, 22, RED)
  for y, (a, b) in enumerate(((4, 5), (3, 6), (1, 8), (0, 9), (0, 9))):
   c.hline(a, b, 1 + y, RED[5 if y < 3 else 2]); c.set(a, 1 + y, RED[6])
  c.hline(3, 6, 9, IRON[0])
  for x, y in ((3, 12), (4, 12), (5, 12), (6, 12), (3, 14), (4, 14), (5, 14), (6, 14), (4, 15), (5, 15), (4, 16), (5, 16)):
   c.set(x, y, WHITE[6])                                     # the postal mark
  c.hline(0, 9, 23, RED[2]); c.hline(0, 9, 24, RED[0])
  soft_outline(c, RED[0], RED[2])
  return c.image()
 if v == 4:
  c = Canvas(12, 25)
  _post(c, 5, 14, 23, STEEL)
  _box(c, 1, 3, 10, 13, YELLOW)
  c.hline(0, 11, 2, YELLOW[6]); c.hline(0, 11, 1, YELLOW[4])
  c.hline(3, 8, 5, IRON[0])
  for x, y in ((4, 8), (5, 8), (6, 8), (7, 9), (7, 10), (4, 10), (5, 11), (6, 11)): c.set(x, y, IRON[1])   # the post horn
  _foot(c, 4, 7, 24, STEEL)
  soft_outline(c, YELLOW[0], YELLOW[2])
  return c.image()
 m = BLUE if v == 0 else OLIVE
 c = Canvas(13, 23)
 _cyl(c, 1, 11, 5, 18, m)
 c.hline(2, 10, 4, m[5]); c.hline(3, 9, 3, m[5]); c.hline(4, 8, 2, m[6]); c.hline(5, 7, 1, m[5])
 c.rect(3, 6, 9, 8, m[2]); c.hline(3, 9, 6, m[6]); c.hline(3, 9, 8, IRON[0])    # the pull-down door
 c.set(6, 7, STEEL[5])
 c.rect(4, 11, 8, 14, WHITE[6] if v == 0 else m[5])
 if v == 0: c.set(5, 12, BLUE[2]); c.set(6, 12, RED[4]); c.set(7, 13, BLUE[2])
 for x in (2, 9):
  c.vline(x, 19, 22, m[4]); c.vline(x + 1, 19, 22, m[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def kerb_mailbox(v=0):
 """A household's own box at the kerb, where the post is delivered from a
 van: v0 bare aluminium with its red flag up, v1 black, v2 white on a
 turned post."""
 c = Canvas(13, 21)
 m = (STEEL, IRON, WHITE)[v]
 post = WHITE if v == 2 else BROWN
 c.vline(5, 9, 20, post[5]); c.vline(6, 9, 20, post[3]); c.vline(7, 9, 20, post[1])
 c.hline(3, 9, 9, post[4])                                   # the arm it sits on
 _box(c, 1, 4, 10, 8, m)
 c.hline(2, 9, 3, m[5]); c.hline(3, 8, 2, m[6])              # the tunnel top
 c.vline(10, 4, 8, m[2]); c.set(10, 6, m[5])                 # the door and its catch
 if v == 0:
  c.vline(8, 0, 3, RED[4]); c.set(9, 0, RED[4]); c.set(9, 1, RED[3])
 else:
  c.set(3, 6, WHITE[6] if v == 1 else IRON[1]); c.set(5, 6, WHITE[6] if v == 1 else IRON[1])
 _foot(c, 4, 8, 20, post)
 soft_outline(c, m[0], m[2])
 return c.image()


def _booth(c, frame, band, sign, phone):
 """A glazed kiosk: frame, a lettered band under the roof, glass to the
 ground with the instrument showing through."""
 _box(c, 1, 3, 14, 38, frame)
 c.hline(0, 15, 2, frame[5]); c.hline(1, 14, 1, frame[4])
 c.rect(2, 4, 13, 6, band);
 for x in range(3, 13, 2): c.set(x, 5, sign)
 c.rect(3, 8, 12, 35, GLASS[3])
 for y in range(8, 36):
  c.set(3, y, GLASS[5]); c.set(4 + (y // 3) % 2, y, GLASS[4])    # the sky in the glass
 c.rect(7, 14, 10, 21, phone[2]); c.hline(7, 10, 14, phone[4]); c.set(8, 17, WHITE[5]); c.set(9, 17, WHITE[5])
 c.vline(11, 15, 22, IRON[1])                                # the cord
 c.hline(1, 14, 38, frame[1]); c.hline(0, 15, 39, frame[0])


def phone_box(v=0):
 """v0 the British red kiosk, v1 the American aluminium booth, v2 the
 Japanese booth with its green telephone, v3 a hooded payphone on a
 pedestal, v4 the yellow booth of the German post office."""
 if v == 3:
  c = Canvas(13, 31)
  _post(c, 6, 16, 29, STEEL)
  _box(c, 2, 2, 11, 15, BLUE)
  c.hline(2, 11, 1, BLUE[6])
  c.rect(4, 4, 10, 14, IRON[1])                              # open to the front
  c.rect(5, 6, 9, 12, STEEL[3]); c.hline(5, 9, 6, STEEL[5]); c.vline(5, 7, 11, IRON[2])
  c.set(7, 8, WHITE[6]); c.set(8, 8, WHITE[5]); c.set(7, 10, WHITE[5]); c.set(8, 10, WHITE[4])
  c.rect(4, 29, 9, 30, STEEL[2]); c.hline(4, 9, 29, STEEL[4])
  soft_outline(c, BLUE[0], BLUE[2])
  return c.image()
 c = Canvas(16, 40)
 if v == 0:
  _booth(c, RED, WHITE[5], IRON[1], IRON)
  for x in (5, 10): c.vline(x, 8, 35, RED[3])                # the glazing bars
  for y in range(11, 35, 4): c.hline(3, 12, y, RED[3])
  c.hline(3, 12, 0, RED[4])                                  # the domed roof
  m = RED
 elif v == 1:
  _booth(c, STEEL, BLUE[3], WHITE[6], IRON)
  c.vline(8, 22, 35, STEEL[4])                               # the folding door
  m = STEEL
 elif v == 2:
  _booth(c, WHITE, WHITE[5], GREEN[3], GREEN)
  c.hline(1, 14, 3, GREEN[4])
  m = WHITE
 else:
  _booth(c, YELLOW, YELLOW[5], IRON[1], IRON)
  c.vline(8, 22, 35, YELLOW[4])
  m = YELLOW
 soft_outline(c, m[0], m[2])
 return c.image()


def bus_stop(v=0):
 """v0 the American pole sign, v1 the British flag with its timetable case,
 v2 the Japanese stop on a concrete block, v3 a glazed shelter with a bench
 and a poster panel."""
 if v == 3:
  c = Canvas(46, 34)
  c.rect(3, 7, 42, 28, GLASS[3])
  for y in range(7, 29):
   for x in range(3, 43):
    if (x + y * 2) % 11 < 2: c.set(x, y, GLASS[4])
  for x in (2, 22, 43):
   c.vline(x, 5, 32, STEEL[5]); c.vline(x + 1, 5, 32, STEEL[2])
  c.rect(0, 2, 45, 4, IRON[3]); c.hline(0, 45, 2, IRON[5]); c.hline(0, 45, 5, IRON[1])
  c.rect(34, 8, 42, 27, WHITE[5]); c.rect(35, 9, 41, 17, ORANGE[4]); c.rect(35, 18, 41, 26, BLUE[3])
  c.hline(36, 40, 21, WHITE[6]); c.hline(36, 39, 23, WHITE[6])
  c.rect(6, 23, 30, 24, BROWN[5]); c.hline(6, 30, 25, BROWN[2])
  for x in (8, 28): c.vline(x, 26, 31, STEEL[3])
  c.hline(1, 44, 33, IRON[1])
  soft_outline(c, IRON[0], IRON[2])
  return c.image()
 c = Canvas(13, 42)
 if v == 0:
  _post(c, 5, 10, 40, STEEL)
  _box(c, 2, 1, 9, 10, WHITE)
  c.rect(3, 2, 8, 4, BLUE[3])
  c.rect(4, 6, 7, 8, BLUE[2]); c.set(4, 9, IRON[1]); c.set(7, 9, IRON[1])   # the bus
  m = STEEL
 elif v == 1:
  _post(c, 3, 2, 40, STEEL)
  _box(c, 5, 3, 12, 9, WHITE)
  c.rect(6, 4, 11, 5, RED[3]); c.hline(6, 11, 7, IRON[2])
  _box(c, 1, 18, 6, 26, IRON); c.rect(2, 19, 5, 25, WHITE[5])
  for y in (20, 22, 24): c.hline(2, 5, y, WHITE[3])
  m = STEEL
 else:
  _post(c, 5, 9, 34, WHITE)
  for i, (a, b) in enumerate(((4, 7), (3, 8), (2, 9), (2, 9), (2, 9), (2, 9), (3, 8), (4, 7))):
   c.hline(a, b, 1 + i, ORANGE[4 if i < 4 else 3])
  c.hline(4, 7, 4, WHITE[6]); c.hline(4, 7, 6, WHITE[6])
  _box(c, 2, 13, 9, 24, WHITE)
  for y in range(15, 23, 2): c.hline(3, 8, y, BLUE[3])
  _box(c, 1, 35, 10, 40, CONCRETE)
  m = WHITE
 _foot(c, 3, 8, 41, STEEL)
 soft_outline(c, m[0], m[2])
 return c.image()


def parking_meter(v=0):
 """v0 a single-head meter, v1 a twin on one post, v2 the pay-and-display
 machine that replaced a street of them."""
 if v == 2:
  c = Canvas(10, 26)
  _post(c, 4, 14, 24, STEEL)
  _box(c, 1, 2, 8, 14, BLUE)
  c.rect(2, 3, 7, 5, WHITE[6]); c.set(3, 4, BLUE[2]); c.set(4, 4, BLUE[2]); c.set(3, 3, BLUE[2])
  c.rect(3, 7, 6, 9, GLASS[5]); c.hline(3, 6, 12, IRON[0])
  _foot(c, 3, 6, 25, STEEL)
  soft_outline(c, BLUE[0], BLUE[2])
  return c.image()
 c = Canvas(11 if v else 7, 24)
 x0 = 4 if v else 2
 _post(c, x0, 8, 22, STEEL)
 for hx in ((0, 6) if v else (1,)):
  c.rect(hx, 2, hx + 4, 7, IRON[3]); c.vline(hx, 2, 7, IRON[5]); c.vline(hx + 4, 2, 7, IRON[1])
  c.hline(hx + 1, hx + 3, 1, IRON[5])
  c.hline(hx + 1, hx + 3, 3, GLASS[6]); c.set(hx + 2, 3, RED[4])            # the dial and its flag
  c.set(hx + 3, 5, STEEL[6])                                               # the coin slot
 if v: c.hline(1, 9, 8, STEEL[4])
 _foot(c, x0 - 1, x0 + 2, 23, STEEL)
 soft_outline(c, IRON[0], IRON[2])
 return c.image()


def street_sign(v=0):
 """v0 the American green blades on a pole, v1 the blue plate of the
 Continent, v2 the Japanese block-number plate, v3 the low British
 nameplate on two legs."""
 if v == 3:
  c = Canvas(26, 13)
  for x in (3, 21): _post(c, x, 7, 11, IRON)
  _box(c, 0, 1, 25, 7, WHITE)
  for x in range(3, 23, 2):
   if x not in (11, 13): c.set(x, 4, IRON[1])
  c.hline(2, 23, 6, WHITE[3])
  _foot(c, 2, 23, 12, IRON)
  soft_outline(c, IRON[0], IRON[2])
  return c.image()
 c = Canvas(19, 42)
 _post(c, 9, 7, 40, STEEL)
 if v == 0:
  _box(c, 1, 2, 17, 5, GREEN)
  for x in range(3, 16, 2): c.set(x, 3, WHITE[6]); c.set(x, 4, WHITE[5] if x % 4 else GREEN[3])
  c.rect(7, 6, 12, 8, GREEN[2]); c.hline(7, 12, 6, GREEN[5])            # the cross street, edge on
  c.set(9, 1, STEEL[5]); c.set(10, 1, STEEL[3])
  m = GREEN
 elif v == 1:
  _box(c, 1, 2, 17, 8, BLUE)
  c.hline(2, 16, 3, WHITE[6]); c.hline(2, 16, 7, WHITE[6]); c.vline(2, 3, 7, WHITE[6]); c.vline(16, 3, 7, WHITE[5])
  for x in range(4, 15, 2): c.set(x, 5, WHITE[6])
  m = BLUE
 else:
  _box(c, 5, 2, 14, 12, GREEN)
  for y in (4, 6, 8, 10): c.set(8, y, WHITE[6]); c.set(10, y, WHITE[6]); c.set(11, y, WHITE[5])
  m = GREEN
 _foot(c, 8, 11, 41, STEEL)
 soft_outline(c, m[0], m[2])
 return c.image()


def news_box(v=0):
 """A coin-operated newspaper rack, in the liveries the papers chose."""
 m = (BLUE, RED, YELLOW, GREEN)[v]
 c = Canvas(11, 20)
 _box(c, 1, 2, 9, 14, m)
 c.hline(1, 9, 1, m[6])
 c.rect(2, 4, 8, 9, GLASS[2]); c.rect(3, 5, 7, 8, WHITE[6])
 c.hline(4, 6, 6, IRON[2]); c.hline(4, 7, 7, WHITE[3])                 # the headline
 c.set(8, 11, STEEL[6]); c.set(8, 12, STEEL[3]); c.hline(3, 6, 11, m[5])
 c.rect(4, 15, 6, 18, IRON[2]); c.vline(4, 15, 18, IRON[4])
 c.hline(2, 8, 19, IRON[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def vending_machine(v=0):
 """The drinks machine of a Japanese street: v0 red and white, v1 blue, v2
 green and white, v3 a cigarette machine."""
 body, trim = ((WHITE, RED), (BLUE, WHITE), (WHITE, GREEN), (BROWN, YELLOW))[v]
 c = Canvas(15, 31)
 _box(c, 1, 1, 13, 29, body)
 c.rect(2, 2, 12, 3, trim[4]); c.hline(2, 12, 2, trim[6])
 c.rect(2, 5, 12, 16, IRON[1])
 drinks = (RED[4], GREEN[5], ORANGE[5], BLUE[5], WHITE[6], YELLOW[5])
 for row, y in enumerate((6, 9, 12, 15) if v != 3 else (6, 8, 10, 12, 14)):
  for i, x in enumerate(range(3, 12, 2)):
   k = drinks[(i * 3 + row * 2 + v) % 6] if v != 3 else (WHITE[6], RED[5], WHITE[5], YELLOW[6], BLUE[5])[(i + row) % 5]
   c.set(x, y, k); c.set(x, y - 1, k)
  c.hline(2, 12, y + 1, STEEL[2])
 for x in range(3, 12, 2): c.set(x, 18, trim[5])                       # the buttons
 c.rect(10, 19, 12, 22, STEEL[3]); c.set(11, 20, IRON[0])              # the coin panel
 c.rect(3, 23, 9, 26, IRON[0]); c.hline(3, 9, 23, STEEL[4])            # where the can drops
 c.hline(1, 13, 30, IRON[0])
 soft_outline(c, body[0], body[2])
 return c.image()


def _bike(c, ox, oy, frame, basket=False):
 """A roadster seen side on, wheels four pixels in radius."""
 tyre, rim = IRON[1], STEEL[4]
 for cx in (ox + 4, ox + 16):
  for dx, dy in ((-1, -4), (0, -4), (1, -4), (-3, -3), (-2, -3), (2, -3), (3, -3), (-4, -1), (-4, 0), (-4, 1),
                 (4, -1), (4, 0), (4, 1), (-3, 2), (-3, 3), (3, 2), (3, 3), (-2, 3), (2, 3), (-1, 4), (0, 4), (1, 4),
                 (-3, -2), (3, -2), (-4, -2), (4, -2), (-4, 2), (4, 2)):
   c.set(cx + dx, oy + dy, tyre)
  c.set(cx, oy, rim); c.set(cx - 2, oy, rim); c.set(cx + 2, oy, rim); c.set(cx, oy - 2, rim); c.set(cx, oy + 2, rim)
 c.line((ox + 4, oy), (ox + 8, oy - 6), frame[4])                      # seat stay and tube
 c.line((ox + 8, oy - 6), (ox + 14, oy - 6), frame[5])                 # top tube
 c.line((ox + 8, oy - 6), (ox + 10, oy), frame[3])                     # seat tube
 c.line((ox + 10, oy), (ox + 14, oy - 6), frame[3])                    # down tube
 c.line((ox + 4, oy), (ox + 10, oy), frame[2])                         # chain stay
 c.line((ox + 14, oy - 6), (ox + 16, oy), frame[4])                    # fork
 c.line((ox + 14, oy - 6), (ox + 14, oy - 8), STEEL[5])
 c.hline(ox + 13, ox + 16, oy - 9, IRON[2])                            # bars
 c.hline(ox + 6, ox + 9, oy - 8, BROWN[2]); c.set(ox + 8, oy - 7, STEEL[4])   # saddle
 c.set(ox + 10, oy + 1, IRON[2]); c.set(ox + 11, oy + 2, IRON[2])      # pedal
 if basket:
  c.rect(ox + 16, oy - 9, ox + 20, oy - 6, STEEL[3])
  for x in range(ox + 16, ox + 21, 2): c.vline(x, oy - 9, oy - 6, STEEL[5])


def bicycle(v=0):
 """v0 the black roadster of China, India and the Netherlands, v1 red, v2
 blue, v3 the Japanese shopping bicycle with its front basket."""
 c = Canvas(23, 16)
 _bike(c, 1, 11, (IRON, RED, BLUE, WHITE)[v], basket=v == 3)
 return c.image()


def bike_rack(v=0):
 """v0 a row of steel hoops, v1 the same with two bicycles locked to it."""
 c = Canvas(46, 18)
 for x in (8, 22, 36):
  c.vline(x, 8, 16, STEEL[5]); c.vline(x + 4, 8, 16, STEEL[2]); c.hline(x + 1, x + 3, 7, STEEL[5])
 if v:
  _bike(c, 1, 12, BLUE)
  _bike(c, 23, 12, RED, basket=True)
 c.hline(6, 42, 17, STEEL[1])
 return c.image()


def utility_cabinet(v=0, doors=False):
 """v0 the green pad-mounted transformer of an American suburb, v1 a grey
 telephone cabinet, v2 the pale distribution box of a European pavement."""
 c = Canvas(16, 19)
 if v == 0:
  _box(c, 1, 4, 14, 16, GREEN)
  c.hline(1, 14, 3, GREEN[6]); c.hline(2, 13, 2, GREEN[5])            # the sloped lid
  c.rect(10, 8, 12, 10, YELLOW[4]); c.set(11, 9, IRON[0])              # the warning
  c.vline(7, 5, 15, GREEN[2]); c.set(6, 11, STEEL[5])
  _box(c, 0, 17, 15, 18, CONCRETE)
  m = GREEN
 elif v == 1:
  _box(c, 2, 2, 13, 17, STEEL)
  c.vline(7, 3, 16, STEEL[2]); c.vline(8, 3, 16, STEEL[5])
  for y in (4, 5, 6): c.hline(3, 6, y, STEEL[1] if y % 2 else STEEL[4]); c.hline(9, 12, y, STEEL[1] if y % 2 else STEEL[4])
  c.set(6, 11, IRON[0]); c.set(9, 11, IRON[0])
  m = STEEL
 else:
  _box(c, 4, 2, 11, 17, WHITE)
  c.hline(5, 10, 1, WHITE[4]); c.vline(8, 3, 16, WHITE[2])
  c.rect(5, 4, 6, 5, YELLOW[4]); c.set(9, 9, IRON[1])
  m = WHITE
 _foot(c, 1, 14, 18, IRON)
 if doors:
  x0, y0, x1, y1 = ((2, 5, 13, 15), (3, 3, 12, 16), (5, 3, 10, 16))[v]
  c.PAD = 4
  c.rect(x0, y0, x1, y1, IRON[0]); c.hline(x0, x1, y0, IRON[2]); c.vline(x0, y0, y1, IRON[1])
  wire = (RED[5], YELLOW[5], BLUE[5], GREEN[6], WHITE[5])
  for y in range(y0 + 2, y1 - 1, 3):
   c.hline(x0 + 1, x1 - 1, y, WHITE[3] if v else STEEL[4]); c.hline(x0 + 1, x1 - 1, y + 1, IRON[2])
   for x in range(x0 + 1, x1, 2): c.set(x, y + 1, wire[(x * 3 + y) % 5])
  for i in range(4):                                                         # the doors swung out toward us
   c.vline(x0 - 2 - i, y0 + i // 2, y1 + i // 2, m[4] if i < 3 else m[6])
   c.vline(x1 + 2 + i, y0 + i // 2, y1 + i // 2, m[2] if i < 3 else m[4])
 soft_outline(c, m[0], m[2])
 return c.image()


def utility_cabinet_open(v=0): return utility_cabinet(v, doors=True)


SACK = ['#0c0d10', '#16181d', '#22252c', '#2e323b', '#3e434e', '#59606e', '#8a93a4']
BIN_BAG = [
 "...4.5....",
 "....45....",
 "...4554...",
 "..456654..",
 ".45666543.",
 "4566655432",
 "4565554432",
 "4555544321",
 ".44443321.",
]


def rubbish(v=0):
 """Rubbish at the kerb on collection day: v0 black sacks tied at the neck,
 v1 the pale bags of a Japanese street under their crow net, v2 flattened
 cartons tied in a bundle."""
 if v == 2:
  c = Canvas(18, 11)
  for i, y in enumerate((8, 6, 4)):
   c.rect(2 + i, y, 15 - i, y + 1, BROWN[5 - i]); c.hline(2 + i, 15 - i, y, BROWN[6])
  c.vline(6, 3, 9, WHITE[5]); c.vline(11, 3, 9, WHITE[5])
  c.hline(2, 15, 10, BROWN[1])
  soft_outline(c, BROWN[0], BROWN[2])
  return c.image()
 m = SACK if v == 0 else WHITE
 c = Canvas(22, 14)
 for at in ((6, 1), (0, 4), (11, 5)):
  draw_grid(BIN_BAG, ramp_keys(m), c, at)
 if v == 1:
  for (x, y) in list(c.px):
   if (x + y) % 5 == 0 or (x - y) % 5 == 0: c.set(x, y, BLUE[4] if y < 8 else BLUE[3])
 c.hline(1, 20, 13, m[1])
 soft_outline(c, m[0], m[2])
 return c.image()

def pavement_board(v=0):
 """A shop's board stood on the pavement: v0 a chalked blackboard, v1 white
 with red lettering, v2 a yellow board."""
 face, ink = ((IRON, WHITE[6]), (WHITE, RED[4]), (YELLOW, IRON[1]))[v]
 c = Canvas(10, 16)
 for y in range(1, 13):
  inset = 1 if y < 3 else 0
  c.hline(1 + inset, 8 - inset, y, face[3 if v == 0 else 5])
 c.vline(1, 3, 12, BROWN[5]); c.vline(8, 3, 12, BROWN[2]); c.hline(2, 7, 1, BROWN[5]); c.hline(1, 8, 12, BROWN[2])
 for y, xs in ((4, (3, 4, 6)), (6, (3, 5, 6)), (8, (3, 4, 5)), (10, (4, 6))):
  for x in xs: c.set(x, y, ink)
 if v == 0: c.set(6, 8, YELLOW[6]); c.set(3, 10, RED[5])
 c.set(1, 13, BROWN[3]); c.set(1, 14, BROWN[2]); c.set(8, 13, BROWN[2]); c.set(8, 14, BROWN[1])
 c.set(3, 13, BROWN[1]); c.set(6, 13, BROWN[1])                             # the back legs
 soft_outline(c, BROWN[0], BROWN[2])
 return c.image()


def pavement_board_fallen(v=0):
 """Blown flat on its back: the face foreshortened to half, the back leaf
 folded under and showing at the top edge."""
 face, ink = ((IRON, WHITE[6]), (WHITE, RED[4]), (YELLOW, IRON[1]))[v]
 c = Canvas(12, 9)
 c.hline(2, 9, 0, BROWN[3]); c.hline(1, 10, 1, BROWN[5])
 c.rect(1, 2, 10, 7, face[3 if v == 0 else 5]); c.vline(1, 2, 7, BROWN[5]); c.vline(10, 2, 7, BROWN[2])
 c.hline(1, 10, 8, BROWN[2])
 for y, xs in ((3, (3, 4, 6, 7)), (4, (3, 5, 6, 8)), (6, (4, 5, 7))):
  for x in xs: c.set(x, y, ink)
 soft_outline(c, BROWN[0], BROWN[2])
 return c.image()


def driveway_hoop(v=0):
 """A basketball hoop on a pole beside the drive."""
 c = Canvas(15, 46)
 _post(c, 3, 12, 44, IRON)
 c.line((4, 12), (6, 8), IRON[3])
 _box(c, 5, 1, 13, 10, WHITE)
 c.rect(8, 5, 11, 8, WHITE[6]); c.hline(8, 11, 5, RED[4]); c.hline(8, 11, 8, RED[4]); c.vline(8, 5, 8, RED[4]); c.vline(11, 5, 8, RED[3])
 c.hline(7, 12, 10, ORANGE[5]); c.hline(7, 12, 11, ORANGE[3])
 for y in range(12, 16):
  for x in range(8, 12):
   if (x + y) % 2 == 0: c.set(x, y, WHITE[5])
 _box(c, 1, 43, 7, 45, IRON)
 soft_outline(c, IRON[0], IRON[2])
 return c.image()


KERBSIDE = {
 'fire-hydrant': hydrant,
 'post-box': post_box,
 'kerb-mailbox': kerb_mailbox,
 'phone-box': phone_box,
 'bus-stop': bus_stop,
 'parking-meter': parking_meter,
 'street-sign': street_sign,
 'news-box': news_box,
 'vending-machine': vending_machine,
 'bicycle': bicycle,
 'bike-rack': bike_rack,
 'utility-cabinet': utility_cabinet,
 'kerb-rubbish': rubbish,
 'pavement-board': pavement_board,
 'driveway-hoop': driveway_hoop,
}
