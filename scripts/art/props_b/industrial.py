"""What a yard or a street carries from the factory age on."""
from .core import (Canvas, RAMPS, belly, jitter, revolve, soft_outline, grass)
from .workshop import streak

WOOD7 = ['oak7', 'walnut7', 'ash7']


def dustbin(v=0):
 """A galvanised bin: ribbed body, rimmed lid, riveted handles, one dent."""
 c = Canvas(19, 26)
 m = RAMPS[['galvanised7', 'blackiron7', 'rustred7'][v]]
 cx = 9.0
 revolve(c, cx, belly(6, 24, [8.6, 8.0, 7.4, 6.6]), m, gloss=1)
 for x in range(0, 19):                           # pressed ribs down the body
  if (x + 1) % 4: continue
  for y in range(7, 24):
   if c.get(x, y): c.set(x, y, m[2])
 for y in (10, 16, 21):                           # rolling beads round it
  for x in range(0, 19):
   if c.get(x, y): c.set(x, y, m[6] if x < 9 else m[3])
   if c.get(x, y + 1): c.set(x, y + 1, m[1])
 for y, half in ((5, 9.0), (4, 8.6), (3, 7.6), (2, 5.6)):   # the lid
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / half
   if abs(u) > 1: continue
   c.set(x, y, m[6] if u < -0.25 else m[5] if u < 0.5 else m[3])
 for x in range(0, 19):
  if c.get(x, 6): c.set(x, 6, m[1])               # the lid's own shadow
 for x, y in [(8, 0), (9, 0), (7, 1), (10, 1)]:   # the lifting knob
  c.set(x, y, m[5] if x < 9 else m[3])
 for hx in (0, 18):                               # riveted side handles
  for k in range(4):
   c.set(hx, 12 + k, m[4] if k < 2 else m[2])
  c.set(hx, 11, m[6]); c.set(hx, 16, m[1])
 for x, y in [(13, 18), (14, 18), (13, 19)]:      # a dent in the shaded side
  if c.get(x, y): c.set(x, y, m[2])
 c.hline(5, 13, 25, m[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def steel_drum(v=0):
 """A two-hundred-litre drum: chime, two rolling hoops, a bung, rust."""
 c = Canvas(19, 27)
 m = RAMPS[['paintblue7', 'rustred7', 'galvanised7'][v]]
 rust = RAMPS['rustred7']
 cx = 9.0
 revolve(c, cx, belly(4, 25, [8.8, 9.0, 9.0, 8.4]), m, gloss=1)
 for y in (10, 18):                               # rolling hoops, with rivets
  for x in range(0, 19):
   if c.get(x, y): c.set(x, y, m[6] if x < 9 else m[3])
   if c.get(x, y + 1): c.set(x, y + 1, m[1])
  for x in range(2, 17, 5):
   if c.get(x, y): c.set(x, y, m[2])
 for x in range(0, 19):                           # the top and its chime
  u = (x + .5 - cx) / 9.0
  if abs(u) > 1: continue
  c.set(x, 2, m[6] if u < -0.2 else m[4] if u < 0.6 else m[2])
  c.set(x, 3, m[5] if u < -0.2 else m[3] if u < 0.6 else m[2])
  c.set(x, 4, m[2])
 for x, y in [(12, 3), (13, 3), (12, 4)]:         # the bung
  c.set(x, y, m[1])
 c.set(5, 3, m[6])
 for x in range(3, 16):                           # a painted band
  if c.get(x, 14): c.set(x, 14, m[1] if x > 9 else m[3])
 for x, y in [(1, 21), (17, 20), (2, 23), (16, 23), (3, 24)]:   # rust at the foot
  if c.get(x, y): c.set(x, y, rust[3])
  if c.get(x, y + 1): c.set(x, y + 1, rust[2])
 c.hline(5, 13, 26, m[1])
 soft_outline(c, m[0], m[2])
 return c.image()


def wheelbarrow(v=0):
 """A barrow: planked tray, spoked wheel in an iron tyre, two handles."""
 from math import hypot
 c = Canvas(38, 24)
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
 for i, x in enumerate(range(30, 38)):            # the handle bar, running back
  y = 11 + i // 3
  c.set(x, y, w[5]); c.set(x, y + 1, w[3]); c.set(x, y + 2, w[1])
 c.set(37, 13, w[6]); c.set(37, 14, w[4])
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
 soft_outline(c, m[0] if steel else w[0], w[2])
 return c.image()


def washing_line(v=0, layer='all'):
 """A line between two poles, hung with what a household washes.

 Frame and washing are separate layers: the poles are rigid, the sheets are
 not, and the renderer sways only the washing.
 """
 c = Canvas(60, 46)
 w = RAMPS[WOOD7[v]]
 r = RAMPS['rope']
 line_y = 10
 if layer != 'hang':
  for px in (4, 51):                              # the poles, with a foot brace
   c.rect(px, line_y - 3, px + 3, 43, w[3])
   c.vline(px, line_y - 3, 43, w[1]); c.vline(px + 1, line_y - 2, 42, w[5])
   c.vline(px + 3, line_y - 3, 43, w[1])
   c.rect(px - 3, 42, px + 6, 45, w[2])
   c.hline(px - 3, px + 6, 42, w[4]); c.hline(px - 3, px + 6, 45, w[0])
   for i in range(6):                             # a diagonal stay
    bx = px + 4 + i if px < 30 else px - 1 - i
    c.set(bx, line_y + 2 + i, w[2]); c.set(bx, line_y + 3 + i, w[1])
   c.hline(px - 1, px + 4, line_y - 3, w[5])
  for x in range(6, 52):                          # the line, sagging in the middle
   sag = 1 if 16 < x < 42 else 0
   c.set(x, line_y + sag, r[2] if x % 2 else r[1])
 if layer != 'frame':
  linen = RAMPS['linen7']
  blue = RAMPS['paintblue7']
  straw = RAMPS['straw']
  cloth = [linen, blue, straw, linen, blue]
  hangs = [(13, 4, 12), (24, 6, 19), (35, 5, 14), (45, 3, 10)]
  for i, (x, half, drop) in enumerate(hangs):
   p = cloth[(i + v) % len(cloth)]
   top = line_y + 2 + (1 if 16 < x < 42 else 0)
   for k in range(drop):
    t = k / (drop - 1)
    wide = half if t < .80 else half - 1
    for px in range(x - wide, x + wide + 1):
     shade = 5 if px < x - wide // 2 else 4 if px < x + wide // 3 else 2
     c.set(px, top + k, p[shade])
    if k % 5 == 2:                                # folds down the cloth
     c.set(x - wide // 2, top + k, p[6])
     c.set(x + wide // 2, top + k, p[1])
   c.hline(x - half, x + half, top, p[6])
   c.hline(x - half, x + half, top + drop - 1, p[1])
   for peg in (x - half + 1, x + half - 1):       # pegs on the line
    c.set(peg, top - 1, w[4]); c.set(peg, top - 2, w[2])
 soft_outline(c, w[0], w[2])
 if layer != 'hang':
  grass(c, [(1, 45, 3), (28, 45, 2), (57, 45, 3)])
 return c.image()
