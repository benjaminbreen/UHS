"""Pixel vocabulary for the B studies.

Every prop declares its own canvas, because a 48x48 box for everything is what
made a scythe and a well the same size. The ruler is the character: ~17px per
metre (a standing body is 29px for 1.7m), in both axes.
"""
from math import atan2, hypot, pi
from PIL import Image, ImageDraw

RAMPS = {
 'granite': ['#111419','#191d24','#282f38','#3b4350','#525b67','#6e7783','#8f96a0'],
 'sandstone': ['#2a1e17','#3a2b22','#5e4632','#856348','#a8815c','#c4a077','#dcc199'],
 'limestone': ['#2b2a24','#3b3a32','#5f5d4e','#847f6a','#a8a186','#c7bfa1','#e3dcbe'],
 'wood': ['#2b231d','#48342423'[:7],'#6a4b30','#8a6440','#a87e52','#c69c6c'],
 'darkwood': ['#221c19','#3a2b22','#54402f','#70573e','#8d7352','#ab9070'],
 'palewood': ['#332c22','#544731','#776446','#98815a','#b59d72','#d2bc93'],
 'iron': ['#1c2123','#313938','#4a5450','#67716a','#88907f','#a9b096'],
 'copper': ['#2e211a','#4d3626','#6f4d31','#91683e','#b1854f','#cea56b'],
 'thatch': ['#33291c','#544325','#77612f','#96803f','#b39c55','#cdb975'],
 'tile': ['#2a1712','#3a241d','#5d3527','#804630','#a05c3a','#bd7a4c','#d69a6a'],
 'water': ['#0a1e25','#0f2a33','#17414f','#215c6d','#347f8d','#55a5ab','#87c9c6'],
 'grass': ['#2c3820','#42522a','#5e6f36','#7c8c45'],
 'straw': ['#3d3018','#4a3c20','#6f5a2a','#93793a','#b39a4f','#ccb66c','#e2d190'],
 'rope': ['#4a3d26','#6d5a36','#907a4b','#b09a68'],
 # Seven-step ramps for the furniture studies: five tones cannot carry grain,
 # a rivet and a lit edge on the same board.
 'burlap7': ['#39301f','#544a31','#726545','#8f815a','#aa9b72','#c4b590','#dcd0b2'],
 'linen7': ['#3b382d','#585441','#787358','#979170','#b3ae8c','#ccc8aa','#e4e1c8'],
 'castiron7': ['#101317','#1a1f25','#272e36','#373f4a','#4b545f','#646e79','#848e99'],
 'copper7': ['#2a1a12','#452a1a','#653d23','#89552e','#a8703d','#c69154','#e0b678'],
 # Ceramics: warm bodies with a cool shadow foot, seven steps each.
 'terracotta7': ['#2d1a13','#4a2a1c','#6b3f27','#8d5836','#ab7149','#c58f63','#dcb086'],
 'buffclay7': ['#31281b','#4f4128','#705c38','#8f7a4c','#ab9765','#c4b384','#dccda6'],
 'redearth7': ['#2b1512','#4b241c','#6d3628','#8f4c34','#ad6748','#c78864','#dfae8c'],
 'greenglaze7': ['#13241f','#1f3a31','#2d5546','#3f7259','#579073','#7dae92','#aecdb5'],
 'blueglaze7': ['#132029','#1d3345','#274a63','#356480','#4d839c','#76a5b6','#a9c9d1'],
 'creamglaze7': ['#2f2b20','#4d4734','#6e674b','#908767','#aea684','#c9c2a4','#e6e1c8'],
 'brass7b': ['#2a1f0d','#493615','#6b5020','#8f6e2c','#ac8c42','#c8ab63','#e2cb92'],
 'copperpot7': ['#2b1710','#4a2818','#6d3c22','#91552c','#b0723c','#cb9556','#e5bd80'],
 'brasspot7': ['#2a1e09','#4b3711','#6f541c','#95742a','#b4933d','#d0b257','#e9d184'],
 'galvanised7': ['#1c2124','#2f3639','#464e51','#606a6d','#7d878a','#9aa4a6','#b9c1c2'],
 'paintblue7': ['#0f1c2b','#172c43','#20405f','#2b567c','#3c6f97','#5a8cb0','#87b2cc'],
 'rustred7': ['#2a1410','#45211a','#5f3122','#7c432b','#97583a','#b2764f','#caa070'],
 'blackiron7': ['#121416','#1d2023','#2b2f32','#3c4145','#525759','#6d7274','#8d9294'],
 'pewter7': ['#1b1e21','#2c3135','#41474c','#5b6167','#787f84','#98a0a4','#bcc3c5'],
 'wicker7': ['#33260f','#513c1c','#70552b','#8e703c','#a88a52','#c0a56e','#d8c18f'],
 'oak7': ['#241610','#3a2418','#553520','#6f4526','#8b5c33','#a87546','#c6945f'],
 'walnut7': ['#1d1410','#301f17','#452c1d','#5b3c26','#74502f','#8e663d','#ab8250'],
 'ash7': ['#2a2018','#443426','#5f4b31','#7a643e','#95804f','#b09b64','#cab77e'],
 'iron7': ['#14181c','#242a30','#363e46','#4c545d','#666f78','#848d95','#a6adb3'],
 'brass7': ['#241a10','#3d2c17','#5a4320','#7a5d2a','#9a7b38','#b99a4c','#d4b968'],
}
RAMPS['wood'] = ['#2b231d','#4a3524','#6a4b30','#8a6440','#a87e52','#c69c6c']
STONE = ['granite', 'sandstone', 'limestone']
WOOD = ['wood', 'darkwood', 'palewood']

# Every ramp above is a hue at several brightnesses. The shift gives the ends
# somewhere to go -- shadows toward blue, lights toward warm -- without moving
# value or touching which ramp a family uses, so climates stay as different as
# they were. The tables here stay the authored colour; set_hue_shift derives.
BASE_RAMPS = {name: list(ramp) for name, ramp in RAMPS.items()}


def set_hue_shift(on=True, strength=None):
    """Mutates RAMPS in place: the draw functions look up by name at call
    time, so the before and after can be rendered in one process."""
    from art.quality.hue import shift_ramp, STRENGTH
    RAMPS.update({
        name: (shift_ramp(ramp, STRENGTH if strength is None else strength)
               if on else list(ramp))
        for name, ramp in BASE_RAMPS.items()})


set_hue_shift(True)


# Tinted rims instead of a hard keyline. See Canvas.rim. Off only for the
# before/after in scripts/art/rim_proof.py.
SOFT_RIM = True


class Canvas:
 """Bottom-centre anchored pixel buffer. Integer coordinates, no blending."""

 # One pixel of margin all round, so the outline pass has somewhere to go.
 # Without it the widest point of a kerb or the peak of a roof sits on the
 # canvas edge and loses its outline, which reads as a straight cut.
 PAD = 1

 def __init__(s, w, h):
  s.w, s.h, s.px = w, h, {}

 def set(s, x, y, c):
  x, y = int(x), int(y)
  if -s.PAD <= x < s.w + s.PAD and -s.PAD <= y < s.h + s.PAD and c:
   s.px[(x, y)] = c

 def get(s, x, y): return s.px.get((int(x), int(y)))

 def rect(s, x0, y0, x1, y1, c):
  for y in range(int(y0), int(y1) + 1):
   for x in range(int(x0), int(x1) + 1): s.set(x, y, c)

 def hline(s, x0, x1, y, c):
  for x in range(int(x0), int(x1) + 1): s.set(x, y, c)

 def vline(s, x, y0, y1, c):
  for y in range(int(y0), int(y1) + 1): s.set(x, y, c)

 def _mask(s, draw):
  m = Image.new('1', (s.w, s.h)); draw(ImageDraw.Draw(m)); return m.load()

 def poly(s, pts, c):
  px = s._mask(lambda d: d.polygon([(int(x), int(y)) for x, y in pts], fill=1))
  for y in range(s.h):
   for x in range(s.w):
    if px[x, y]: s.set(x, y, c)

 def line(s, a, b, c):
  px = s._mask(lambda d: d.line([(int(a[0]), int(a[1])), (int(b[0]), int(b[1]))], fill=1))
  for y in range(s.h):
   for x in range(s.w):
    if px[x, y]: s.set(x, y, c)

 def rim(s, ramp):
  """The material's own dark step round the silhouette, not a shared black.

  Every family drew its edge with `outline(ramp[0])`, the darkest tone in the
  ramp, which is what makes the wells and the anvil sit on top of the ground
  instead of in it. The flag is here so the two can be compared on the art.
  """
  if not SOFT_RIM: return s.outline(ramp[0])
  soft_outline(s, ramp[1], ramp[min(3, len(ramp) - 1)])

 def outline(s, c):
  filled = set(s.px)
  for (x, y) in list(filled):
   for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
    if (x + d[0], y + d[1]) not in filled: s.set(x + d[0], y + d[1], c)

 def image(s):
  pad = s.PAD
  im = Image.new('RGBA', (s.w + pad * 2, s.h + pad * 2)); p = im.load()
  for (x, y), c in s.px.items():
   c = c.lstrip('#')
   p[x + pad, y + pad] = (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)
  im.info['anchor'] = [s.w // 2 + pad, s.h + pad]
  return im


def jitter(*seed):
 """Repeatable wobble so a course of blocks is not one flat slab."""
 v = 0
 for i, n in enumerate(seed): v = (v * 31 + int(abs(n) * 7) + i * 13) % 97
 return v


def dither(x, y): return (x + y) % 2 == 0


def draw_grid(rows, keys):
 """Hand-authored pixels. At this size a formula draws a blob; a grid does not."""
 c = Canvas(max(len(r) for r in rows), len(rows))
 for y, row in enumerate(rows):
  for x, ch in enumerate(row):
   if ch != '.': c.set(x, y, keys[ch])
 return c


def soft_outline(c, low, high):
 """A tinted rim instead of a black keyline: dark under and to the right,
 a lighter tone over the lit shoulder. Hard black at this size reads as a
 sticker; the mockups carry their edge in the object's own hue."""
 filled = set(c.px)
 for (x, y) in list(filled):
  for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
   n = (x + dx, y + dy)
   if n in filled: continue
   c.set(n[0], n[1], low if (dy > 0 or dx > 0) else high)


def blob(c, shapes, ramp, light=(-0.52, -0.62), rim=True, gamma=0.85, spread=1.0):
 """Shade a union of ellipsoids by surface normal, the way a round thing reads.

 Per-row ramps make cones. A normal-shaded ball with the dither kept off the
 silhouette gives the soft, volumetric look the mockups have.
 Returns the filled mask so callers can draw details only where there is body.
 """
 from math import sqrt
 mask = {}
 for y in range(-c.PAD, c.h + c.PAD):
  for x in range(-c.PAD, c.w + c.PAD):
   best = None
   for (cx, cy, rx, ry) in shapes:
    u, v = (x + .5 - cx) / rx, (y + .5 - cy) / ry
    r2 = u * u + v * v
    if r2 > 1: continue
    if best is None or r2 < best[0]: best = (r2, u, v)
   if best is None: continue
   r2, u, v = best
   nz = sqrt(max(0.0, 1 - r2))
   lam = (light[0] * u + light[1] * v + 0.78 * nz) / 1.02
   lam = max(0.0, min(1.0, lam)) ** gamma
   step = (0.25 + lam * (len(ramp) - 1.45)) * spread
   i = int(step)
   edge = r2 > 0.80
   if not edge and step - i > (0.64 if dither(x, y) else 0.30): i += 1
   if edge: i = max(i - 1, 0)                     # the form turns away at the rim
   mask[(x, y)] = i
   c.set(x, y, ramp[max(0, min(i, len(ramp) - 1))])
 return mask


def revolve(c, cx, profile, ramp, light=-0.55, gloss=0, rimlight=True,
            base=0.0, top_tone=None, foot=0.0):
 """Shade a body of revolution from its silhouette.

 `profile` maps a row to the body's half-width there. Each pixel's horizontal
 position across the body gives the surface normal, so the same function draws
 a pot, a jar or a jug and they all turn the same way under the same light.
 `gloss` adds a glazed or metal highlight band; `rimlight` puts the sliver of
 reflected light on the shaded edge that makes a round thing read as round.
 """
 from math import sqrt
 rows = sorted(profile)
 span = max(rows[-1] - rows[0], 1)
 for y in rows:
  half = profile[y]
  if half <= 0: continue
  above = profile.get(y - 1, half)
  below = profile.get(y + 1, half)
  slope = (below - above) / 2.0                   # the wall tilting in or out
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / max(half, .5)
   if abs(u) > 1: continue
   nz = sqrt(max(0.0, 1 - u * u))
   # The light is above as well as to the left, so the shoulder is the
   # brightest part of the body and the foot sits in its own shade.
   down = (y - rows[0]) / span
   lam = (light * u + 0.78 * nz - 0.20 * slope * nz) / 1.06 - down * 0.30
   lam = max(0.0, min(1.0, lam + base))
   step = 0.5 + lam * (len(ramp) - 1.5)
   i = int(step)
   # No dithering across the body. Seven steps over ten pixels already band
   # finely, and a checkerboard on a pot reads as dirt on the glaze.
   if abs(u) > 0.82: i = max(i - 1, 0)
   if rimlight and u > 0.88 and 0.22 < down < 0.90: i = min(i + 2, len(ramp) - 2)
   if gloss and -0.56 < u < -0.34 and nz > 0.62 and down < 0.72:
    i = min(i + gloss, len(ramp) - 1)
   c.set(x, y, ramp[max(0, min(i, len(ramp) - 1))])
  if top_tone is not None and y == rows[0]:
   for x in range(int(cx - half), int(cx + half) + 1):
    c.set(x, y, ramp[top_tone])
 if not foot: return
 # The base is an ellipse on the ground, so the middle of the body sits lower
 # than its sides. A flat bottom edge reads as a sticker laid on the floor.
 from math import sqrt as _sqrt
 half = profile[rows[-1]]
 for x in range(int(cx - half), int(cx + half) + 1):
  u = (x + .5 - cx) / max(half, .5)
  if abs(u) > 1: continue
  drop = round(foot * _sqrt(max(0.0, 1 - u * u)))
  for k in range(1, drop + 1):
   shade = 2 if k < drop else 1
   if abs(u) > 0.7: shade = 1
   c.set(x, rows[-1] + k, ramp[shade])


def revolve_x(c, cy, profile, ramp, light=-0.58, gloss=0, rimlight=True,
              base=0.0):
 """The same body of revolution, lying down.

 `profile` maps a column to the body's half-height there. The light stays
 upper-left, so a lying cylinder is lit along its top and shaded underneath,
 which is what makes a knocked-over bin read as knocked over rather than as a
 bin drawn sideways.
 """
 from math import sqrt
 cols = sorted(profile)
 span = max(cols[-1] - cols[0], 1)
 for x in cols:
  half = profile[x]
  if half <= 0: continue
  before = profile.get(x - 1, half)
  after = profile.get(x + 1, half)
  slope = (after - before) / 2.0
  for y in range(int(cy - half), int(cy + half) + 1):
   v = (y + .5 - cy) / max(half, .5)
   if abs(v) > 1: continue
   nz = sqrt(max(0.0, 1 - v * v))
   along = (x - cols[0]) / span
   lam = (-0.80 * v + 0.74 * nz - 0.18 * slope * nz) / 1.06 + light * 0.12
   lam = max(0.0, min(1.0, lam + base - along * 0.12))
   step = 0.5 + lam * (len(ramp) - 1.5)
   i = int(step)
   if abs(v) > 0.82: i = max(i - 1, 0)
   if rimlight and v > 0.88: i = min(i + 2, len(ramp) - 2)
   if gloss and -0.60 < v < -0.36 and nz > 0.62:
    i = min(i + gloss, len(ramp) - 1)
   c.set(x, y, ramp[max(0, min(i, len(ramp) - 1))])


def belly(top, bottom, widths):
 """A profile from a few control half-widths, smoothed down the rows."""
 out = {}
 span = bottom - top
 for y in range(top, bottom + 1):
  t = (y - top) / span * (len(widths) - 1)
  i = min(int(t), len(widths) - 2)
  f = t - i
  out[y] = widths[i] * (1 - f) + widths[i + 1] * f
 return out


def shade_rows(c, rows, ramp, lit=5, dark=1, curve=0.5):
 """Fill spans with a left-lit round shading and a dithered band boundary."""
 for y, (a, b) in rows.items():
  width = max(b - a, 1)
  for x in range(a, b + 1):
   t = (x - a) / width
   f = abs(t - curve) / max(curve, 1 - curve)
   step = lit - f * (lit - dark)
   i = int(step)
   if step - i > (0.62 if dither(x, y) else 0.3): i += 1
   c.set(x, y, ramp[max(min(i, len(ramp) - 1), 0)])


def grass(c, spots):
 g = RAMPS['grass']
 for x, y, h in spots:
  for i in range(h): c.set(x + (i % 2), y - i, g[2] if i else g[1])
  c.set(x + 1, y, g[0])
