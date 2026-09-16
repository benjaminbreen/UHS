"""Workshop furniture: anvil, bench, chest, loom. ~17 source pixels to a metre."""
from .core import Canvas, RAMPS, WOOD, jitter, dither, grass


WOOD7 = ['oak7', 'walnut7', 'ash7']


def streak(c, a, b, y, ramp, tone):
 """Grain runs with the board. Scattered single pixels read as dirt, not wood."""
 x = a + jitter(y) % 5
 while x <= b:
  run = 2 + jitter(x, y) % 4
  if jitter(x * 3, y) % 3 == 0:
   shade = ramp[max(tone - 1, 1)] if jitter(x, y * 2) % 2 else ramp[min(tone + 1, 6)]
   for i in range(run):
    if x + i <= b: c.set(x + i, y, shade)
  x += run + 2 + jitter(y, x) % 3


def chest(v=0):
 """A bound trunk seen square on: domed lid, plank courses, iron and rivets.

 Front elevation, not three-quarter: a chest this size is read off its face,
 and the receding side only eats pixels that the grain and the ironwork want.
 """
 c = Canvas(30, 24)
 w = RAMPS[WOOD7[v]]
 m = RAMPS['iron7']
 br = RAMPS['brass7']
 x0, x1 = 2, 27
 lid_top, lid_base, foot = 1, 11, 21
 for y in range(lid_top, lid_base):               # the domed lid
  t = (y - lid_top) / (lid_base - 1 - lid_top)
  inset = 3 if t < .10 else 2 if t < .24 else 1 if t < .44 else 0
  tone = 6 if t < .18 else 5 if t < .42 else 4 if t < .70 else 3
  c.hline(x0 + inset, x1 - inset, y, w[tone])
  streak(c, x0 + inset, x1 - inset, y, w, tone)
 for y in (lid_top + 3, lid_top + 6):             # lid board joints
  c.hline(x0 + 1, x1 - 1, y, w[2])
 c.hline(x0 + 3, x1 - 3, lid_top, w[6])
 c.hline(x0, x1, lid_base, m[0])                  # the lid's shut line
 c.hline(x0, x1, lid_base + 1, w[5])
 for y in range(lid_base + 1, foot):              # the body, three courses
  band = (y - lid_base - 1) // 3
  tone = 5 - band
  c.hline(x0, x1, y, w[tone])
  streak(c, x0, x1, y, w, tone)
  if (y - lid_base - 1) % 3 == 0 and y > lid_base + 1: c.hline(x0, x1, y, w[2])
 c.rect(x0 - 1, foot, x1 + 1, foot + 1, w[3])     # the plinth it stands on
 c.hline(x0 - 1, x1 + 1, foot, w[5]); c.hline(x0 - 1, x1 + 1, foot + 1, w[1])
 for sx in (6, 22):                               # iron straps, lid to floor
  for y in range(lid_top + 1, foot + 1):
   c.vline(sx, y, y, m[5]); c.vline(sx + 1, y, y, m[3]); c.vline(sx + 2, y, y, m[1])
  c.set(sx, lid_top + 1, m[6]); c.hline(sx, sx + 2, foot + 1, m[0])
  for ry in (lid_top + 2, lid_base - 2, lid_base + 4, foot - 2):
   c.set(sx, ry, m[2]); c.set(sx + 1, ry, m[6]); c.set(sx + 2, ry, m[0])
 for cx, cy in [(x0, lid_base + 1), (x1 - 2, lid_base + 1), (x0, foot - 3), (x1 - 2, foot - 3)]:
  c.rect(cx, cy, cx + 2, cy + 2, m[3])            # corner plates
  c.set(cx + 1, cy + 1, m[5])
 c.rect(12, lid_base - 3, 17, lid_base + 6, m[3])  # the lock plate, hasp down
 c.rect(13, lid_base - 2, 16, lid_base + 5, m[4])
 c.hline(13, 16, lid_base - 2, m[6])
 c.rect(13, lid_base + 1, 16, lid_base + 4, br[4])
 c.set(14, lid_base + 2, br[6]); c.set(15, lid_base + 3, br[1])
 c.set(14, lid_base + 3, m[0]); c.set(15, lid_base + 2, br[5])
 for hx in (9, 20):                                # lid hinges
  c.rect(hx, lid_base - 2, hx + 1, lid_base + 1, m[3]); c.set(hx, lid_base, m[6])
 c.outline(m[0])
 return c.image()


def bench(v=0):
 """A plank bench about 2.4 m long and knee high: three tiles of seat."""
 c = Canvas(41, 16)
 w = RAMPS[WOOD7[v]]
 x0, x1, dx, dy = 0, 35, 5, 4
 seat = 5
 for lx, back in [(3, False), (29, False), (9, True), (35, True)]:
  top = seat + (1 if back else 3)
  base = 13 if back else 15
  for y in range(top, base + 1):
   c.set(lx, y, w[3] if back else w[4])
   c.set(lx + 1, y, w[4] if back else w[5])
   c.set(lx + 2, y, w[1] if back else w[2])
   if jitter(lx, y) % 5 == 0: c.set(lx + 1, y, w[3])
  c.hline(lx, lx + 2, base, w[0])
 for i in range(dx):                              # the seat's top face
  shade = 6 if i < 2 else 5
  for x in range(x0 + 1 + i, x1 + 1 + i):
   c.set(x, seat - 1 - (i * dy) // dx, w[shade])
 for i in range(dx):                              # grain running along the boards
  streak(c, x0 + 1 + i, x1 + i, seat - 1 - (i * dy) // dx, w, 6 if i < 2 else 5)
 for x in range(3, x1, 11):                       # plank joins
  for i in range(dx): c.set(x + i, seat - 1 - (i * dy) // dx, w[2])
 for y, tone in [(seat, 5), (seat + 1, 4), (seat + 2, 3)]:   # the front edge
  c.hline(x0, x1, y, w[tone]); streak(c, x0, x1, y, w, tone)
 c.hline(x0, x1, seat - 1, w[6])
 for x in (2, 14, 26):                            # nail heads
  c.set(x, seat - 2, RAMPS['iron7'][5]); c.set(x, seat - 1, RAMPS['iron7'][2])
 c.outline(w[0])
 return c.image()


def anvil(v=0):
 """A smith's anvil on its block: horn out to the left, face about 0.8 m up.

 The face overhangs the block and the horn runs clear of it, or the whole
 thing reads as a mushroom.
 """
 c = Canvas(26, 24)
 m = RAMPS['iron7']
 w = RAMPS[WOOD7[(v + 1) % 3]]
 body = {                                         # x span per row
  0: (6, 20), 1: (5, 21), 2: (5, 21), 3: (6, 20),
  4: (8, 18), 5: (10, 16), 6: (10, 16), 7: (9, 17), 8: (7, 19), 9: (7, 19),
 }
 for y, (a, b) in body.items():
  c.hline(a, b, y, m[4]); c.set(a, y, m[2]); c.set(b, y, m[2])
 for y, (a, b) in {2: (4, 6), 3: (0, 6), 4: (4, 6)}.items():   # the horn
  c.hline(a, b, y, m[4])
 c.set(0, 3, m[2]); c.set(1, 3, m[4]); c.set(2, 3, m[5])
 c.hline(4, 6, 2, m[5])
 c.hline(6, 20, 0, m[6])                          # the face, struck smooth
 c.hline(5, 21, 1, m[5])
 c.hline(8, 18, 4, m[1])
 c.hline(10, 16, 6, m[2])                          # under the face, in shadow
 c.set(21, 2, m[1]); c.set(20, 3, m[1])           # the heel, squared off
 c.hline(7, 19, 9, m[1])
 for y in range(10, 24):                          # the block, staves and a hoop
  half = 7 if y < 22 else 6
  tone = 5 if y < 14 else 4 if y < 19 else 3
  c.hline(13 - half, 13 + half, y, w[tone])
  streak(c, 13 - half, 13 + half, y, w, tone)
  c.set(13 - half, y, w[2]); c.set(13 + half, y, w[1])
 for x in range(9, 20, 4): c.vline(x, 11, 23, w[2])
 c.hline(6, 20, 10, w[6])
 c.hline(6, 20, 17, m[4]); c.hline(6, 20, 18, m[1])
 for x in (8, 13, 18): c.set(x, 17, m[6])         # hoop rivets
 if v == 2:                                       # a log stump, not a barrel
  for x in range(7, 20): c.set(x, 11, w[6])
  for x in range(8, 19, 3): c.vline(x, 12, 23, w[1])
  for y in range(12, 23):
   if jitter(y, 3) % 4 == 0: c.hline(9, 17, y, w[2])
 c.outline(m[0])
 return c.image()


def loom(v=0):
 """An upright loom: 2.6 m of frame, wider than a doorway.

 Warp hangs from the top beam through a heddle rod, the shed opens below it,
 and finished cloth rolls onto the beam at waist height.
 """
 c = Canvas(44, 52)
 w = RAMPS[WOOD7[v]]
 r = RAMPS['rope']
 web = ['#3f3a2c', '#6b6350', '#938a६e'.replace('६', '6'), '#b5a985', '#d3c7a2', '#eee3c2']
 stripe = ['#8e4633', '#b4614a']
 indigo = ['#2c3d54', '#46597a']
 left, right = 3, 36
 post = 5
 for x in (left, right):                          # uprights, grain and all
  for y in range(2, 48):
   c.hline(x, x + post - 1, y, w[4])
   c.set(x, y, w[2]); c.set(x + 1, y, w[5]); c.set(x + post - 1, y, w[1])
   if jitter(x, y) % 6 == 0: c.hline(x + 2, x + 3, y, w[3])
  c.rect(x - 3, 47, x + post + 2, 50, w[3])       # splayed feet
  c.hline(x - 3, x + post + 2, 47, w[5]); c.hline(x - 3, x + post + 2, 50, w[0])
  c.hline(x - 2, x + post + 1, 49, w[2])
 beams = [(3, 'top'), (38, 'cloth'), (44, 'brace')]
 for y, kind in beams:
  h = 4 if kind in ('top', 'cloth') else 3
  for i in range(h):
   c.hline(0, 43, y + i, w[5] if i == 0 else (w[4] if i < h - 1 else w[2]))
  streak(c, 0, 43, y + 1, w, 4)
  c.hline(0, 43, y + h, w[1])
 c.outline(w[0])                                 # frame only: outlining after
 # the warp is threaded rings every thread in black and it reads as a cage.
 for x in (left + 1, right + 1):                  # lashings at the joints
  for y, kind in beams:
   for k in range(-1, 5):
    c.set(x - 1, y + k, r[1] if k % 2 else r[3]); c.set(x + 2, y + k, r[2])
 warp_top, shed, cloth_top = 9, 24, 29
 for i, x in enumerate(range(left + post + 1, right, 2)):
  for y in range(warp_top, shed):                 # warp, taut from the beam
   # Darker than the ground: a pale thread on a pale field disappears, and
   # the gaps cannot be painted because they are background.
   c.set(x, y, web[2] if (x + y) % 4 else web[1])
  lean = 1 if i % 2 else 0                        # the shed: threads part
  for y in range(shed, cloth_top):
   c.set(x + (lean if y > shed + 3 else 0), y, web[3 if lean else 1])
 c.rect(left + post, 20, right - 1, 22, w[3])     # heddle rod across the warp
 c.hline(left + post, right - 1, 20, w[6]); c.hline(left + post, right - 1, 22, w[1])
 for y in range(cloth_top, 38):                   # the woven panel, waist deep
  for x in range(left + post - 1, right + 1):
   c.set(x, y, web[4] if (x + y) % 2 else web[5])
 bands = {29: web[1], 33: stripe[1], 34: stripe[0], 37: web[2]}
 if v == 1:
  bands = {29: web[1], 32: indigo[1], 33: indigo[0], 36: stripe[1], 37: web[2]}
 if v == 2:
  bands = {29: web[1], 31: web[2], 34: stripe[1], 35: stripe[0], 37: web[2]}
 for y, colour in bands.items(): c.hline(left + post - 1, right, y, colour)
 if v == 2:                                       # a shuttle parked on the web
  c.rect(16, 25, 26, 27, w[3]); c.set(15, 26, w[1]); c.set(27, 26, w[1])
  c.hline(17, 25, 25, w[5]); c.hline(18, 24, 26, web[5])
 return c.image()
