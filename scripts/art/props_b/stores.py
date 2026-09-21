"""Household stores drawn to the figure, not the old 48px study canvas.

The barrel, crate, woodpile and scarecrow were each about twice life size:
a barrel stood a storey tall beside a 23px door. Sizes follow PROP_ART.md,
about 17 source px to the metre. These are placed pixel by rule rather than
shaded by a lighting function: at this size a form reads from a hard lit
band, a hard core shadow and a dark keyline, and a smooth ramp reads as mud.
"""
from math import sqrt
from .core import Canvas

INK = '#24140d'
# dark, shade, mid, light, highlight
WOOD = [['#4f2b14', '#7a4a20', '#a2672e', '#c98a44', '#e9b56c'],
        ['#3d2416', '#5f3a22', '#84532f', '#a87242', '#cc9a63'],
        ['#574526', '#806a3a', '#a78e52', '#c9b272', '#e6d39a']]
IRON = ['#1d2126', '#3a4048', '#5f6772', '#97a0aa']
SACK = ['#5b4a2e', '#86724a', '#b09a6a', '#d2be8e', '#ece0b8']
STRAW = ['#7a5a1e', '#a9832e', '#d2ab48', '#efd37a']
LEAF = ['#1f4424', '#2f6a2e', '#4b8f38', '#77b64a', '#a6d868']
BLOOMS = ['#f2cf3e', '#e2553f', '#f4efe0', '#d583c6']


def _band(u):
 """Tone index across a turned wooden body: a lit band left of centre, a
 narrow highlight inside it, a core shadow on the right, bounce at the rim."""
 if u < -0.82: return 2
 if u < -0.62: return 3
 if u < -0.38: return 4
 if u < -0.12: return 3
 if u < 0.42: return 2
 if u < 0.84: return 1
 return 2 if u < 0.93 else 1


def _cask(c, cx, top, bottom, widths, w, hoops, staves=3):
 rows = bottom - top
 prof = {}
 for y in range(top, bottom + 1):
  t = (y - top) / rows * (len(widths) - 1)
  i = min(int(t), len(widths) - 2)
  prof[y] = widths[i] + (widths[i + 1] - widths[i]) * (t - i)
 for y, half in prof.items():
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / half
   if abs(u) > 1: continue
   tone = _band(u)
   # Stave joints: evenly spaced round the girth, so they crowd at the sides.
   a = (1 - u) / 2 * 3.14159
   if int(a * staves * 2 / 3.14159 + 0.5) != int((a - 0.34 / max(half, 1)) * staves * 2 / 3.14159 + 0.5):
    tone = max(0, tone - 1)
   if y >= bottom - 1: tone = max(0, tone - 1)    # the foot sits in shade
   c.set(x, y, w[tone])
 for y0 in hoops:
  half = prof[y0]
  for x in range(int(cx - half), int(cx + half) + 1):
   u = (x + .5 - cx) / half
   if abs(u) > 1: continue
   sag = 1 if abs(u) < 0.6 else 0               # a hoop bows toward the eye
   c.set(x, y0 + sag, IRON[3] if -0.6 < u < -0.3 else IRON[2] if u < 0.35 else IRON[1])
   c.set(x, y0 + sag + 1, IRON[0] if u > -0.2 else IRON[1])
 return prof


def _head(c, cx, cy, rx, ry, w):
 """The top seen from above the rim: a bright chime, the head sunk inside it."""
 for y in range(int(cy - ry), int(cy + ry) + 1):
  for x in range(int(cx - rx), int(cx + rx) + 1):
   u, v = (x + .5 - cx) / rx, (y + .5 - cy) / ry
   r2 = u * u + v * v
   if r2 > 1: continue
   if r2 > 0.55: c.set(x, y, w[4] if u < 0.3 else w[3])
   else: c.set(x, y, w[0] if v < -0.25 else w[1] if x % 3 == 0 else w[2])


def barrel(v=0):
 """A 0.9 m cask: bulged staves, iron hoops top and bottom, an open chime."""
 c = Canvas(16, 22)
 w = WOOD[v]
 _cask(c, 8, 3, 21, [5.8, 7.2, 7.9, 7.9, 7.2, 5.8], w, (5, 8, 15, 18))
 _head(c, 8, 3, 5.8, 2.6, w)
 c.set(8, 12, INK); c.set(7, 12, w[4])             # the bung
 c.outline(INK)
 return c.image()


def _box(c, x0, y0, wide, tall, w, brace='x'):
 """A framed packing case: lid seen from above, then a battened front."""
 lid = 3
 c.rect(x0, y0, x0 + wide - 1, y0 + lid - 1, w[4])
 c.hline(x0, x0 + wide - 1, y0 + lid - 1, w[3])
 for x in range(x0 + 4, x0 + wide - 2, 5): c.vline(x, y0, y0 + lid - 2, w[3])
 t, b, l, r = y0 + lid, y0 + tall - 1, x0, x0 + wide - 1
 c.rect(l, t, r, b, w[1])                          # the recessed panel
 for y in range(t + 2, b - 1, 3): c.hline(l + 2, r - 2, y, w[0])
 if brace:
  n = b - t - 3
  for i in range(n + 1):
   x = l + 2 + round(i * (wide - 6) / max(1, n))
   c.set(x, t + 2 + i, w[3]); c.set(x + 1, t + 2 + i, w[2])
   if brace == 'x':
    c.set(r - 2 - (x - l - 2), t + 2 + i, w[2]); c.set(r - 3 - (x - l - 2), t + 2 + i, w[3])
 c.rect(l, t, r, t + 1, w[3]); c.hline(l, r, t, w[4])       # battens
 c.rect(l, b - 1, r, b, w[2]); c.hline(l, r, b, w[0])
 c.rect(l, t, l + 1, b, w[3]); c.vline(l, t, b, w[4])
 c.rect(r - 1, t, r, b, w[2]); c.vline(r, t, b, w[0])
 for x, y in ((l + 1, t + 1), (r - 1, t + 1), (l + 1, b - 1), (r - 1, b - 1)):
  c.set(x, y, IRON[0])


def crate(v=0):
 c = Canvas(18, 15)
 _box(c, 0, 0, 18, 15, WOOD[v])
 c.outline(INK)
 return c.image()


def crate_stack(v=0):
 """Two cases and a smaller one on top, not squared up."""
 c = Canvas(29, 25)
 _box(c, 0, 11, 15, 14, WOOD[v])
 _box(c, 15, 13, 14, 12, WOOD[(v + 2) % 3], brace='/')
 _box(c, 6, 0, 14, 12, WOOD[(v + 1) % 3])
 c.hline(6, 19, 12, INK)                           # the shade the top one throws
 c.outline(INK)
 return c.image()


def woodpile(v=0):
 """A cord of logs between two stakes. The cut ends are the whole drawing:
 a bark ring, pale sapwood, a darker heart and a drying crack."""
 c = Canvas(30, 18)
 w, bark = WOOD[(v + 2) % 3], WOOD[1]
 c.rect(1, 3, 28, 17, INK)
 def log(cx, cy, split=False):
  for yy in range(cy - 2, cy + 3):
   for xx in range(cx - 2, cx + 3):
    d = (xx - cx) ** 2 + (yy - cy) ** 2
    if d > 5 or (split and yy > cy): continue
    lit = xx <= cx and yy <= cy
    c.set(xx, yy, (bark[2] if lit else bark[1]) if d > 2 else w[4] if lit else w[3])
  c.set(cx, cy, w[1])
  if not split: c.set(cx + 1, cy, w[2])
 n = v * 5
 for row, cy in enumerate((15, 11, 7)):
  for k, cx in enumerate(range(3 + (row % 2) * 2, 27, 5)):
   n += 1
   log(cx, cy, split=(n * 7 + row) % 5 == 0)
 for x in range(3, 27):                            # two logs lying along the top
  c.set(x, 3, w[4] if x < 15 else w[3]); c.set(x, 4, w[2]); c.set(x, 5, w[1])
 for x in (9, 20): c.vline(x, 3, 5, bark[0])
 for x, tone in ((0, bark[3]), (29, bark[1])):     # the stakes
  c.vline(x, 0, 17, tone)
 c.outline(INK)
 return c.image()


def _sack(c, cx, base, rx, tall, p, lean=0):
 for y in range(base - tall, base + 1):
  t = (y - (base - tall)) / tall
  # Gathered at the neck, fullest two thirds down, settling flat at the foot.
  half = rx * (0.34 + 0.66 * sqrt(max(0, 1 - ((t - 0.68) / 0.72) ** 2)))
  if t > 0.9: half -= (t - 0.9) * rx * 1.6
  mid = cx + lean * (1 - t)
  for x in range(int(mid - half), int(mid + half) + 1):
   u = (x + .5 - mid) / max(half, .5)
   if abs(u) > 1: continue
   tone = 4 if -0.65 < u < -0.2 and 0.25 < t < 0.75 else 3 if u < 0.1 else 2 if u < 0.62 else 1
   if t > 0.86: tone = max(1, tone - 1)
   c.set(x, y, p[tone])
 top = base - tall
 mx = int(cx + lean)
 c.rect(mx - 1, top - 2, mx + 1, top, p[3]); c.hline(mx - 2, mx + 2, top + 1, p[0])
 c.set(mx - 2, top - 3, p[4]); c.set(mx + 2, top - 2, p[2]); c.set(mx, top - 3, p[3])
 for y in range(top + 4, base - 1, 3): c.set(int(cx + rx * 0.35), y, p[1])   # the seam


def grain_sacks(v=0):
 """Tied sacks slumped against each other."""
 c = Canvas(23, 17)
 p = SACK if v != 1 else ['#57503a', '#7f775a', '#a8a07e', '#ccc5a3', '#e8e3c8']
 _sack(c, 5, 16, 5, 10, p, lean=-1)
 _sack(c, 17, 16, 5.5, 9, p, lean=1)
 _sack(c, 11, 16, 5.5, 12, p)
 if v == 2:
  for x, y in ((20, 16), (21, 16), (22, 16), (21, 15)): c.set(x, y, '#e3c264')
 c.outline(INK)
 return c.image()


def flower_tub(v=0):
 """Half a cask planted up."""
 c = Canvas(16, 16)
 w = WOOD[v]
 _cask(c, 8, 8, 15, [7.2, 7.0, 6.2], w, (10,), staves=3)
 for cx, cy, r in ((4.5, 6, 3.6), (11.5, 6.2, 3.6), (8, 4, 4.2)):
  for y in range(int(cy - r), int(cy + r) + 1):
   for x in range(int(cx - r), int(cx + r) + 1):
    u, t = (x + .5 - cx) / r, (y + .5 - cy) / r
    if u * u + t * t > 1: continue
    lit = -u * 0.6 - t * 0.8
    tone = 4 if lit > 0.75 else 3 if lit > 0.3 else 2 if lit > -0.25 else 1
    if (x * 5 + y * 3) % 7 == 0: tone = max(0, tone - 1)
    c.set(x, y, LEAF[tone])
 for i, (x, y) in enumerate(((3, 4), (6, 1), (10, 2), (13, 5), (5, 6), (11, 7), (8, 4), (1, 7), (8, 8))):
  tone = BLOOMS[(i + v) % len(BLOOMS)]
  c.set(x, y, tone); c.set(x + 1, y, tone); c.set(x, y - 1, tone if i % 2 else LEAF[4])
 c.outline(INK)
 return c.image()


def scarecrow(v=0):
 """A pole, a crosspiece and a stuffed smock, straw at every opening."""
 c = Canvas(25, 35)
 pole = WOOD[1]
 cloth = [['#5b4a2e', '#86724a', '#b09a6a', '#d2be8e', '#ece0b8'],
          ['#5a2018', '#8a3324', '#b44a31', '#d46a47', '#ee9670'],
          ['#1c3350', '#2b4f78', '#3f6f9f', '#5f93c0', '#93bbdc']][v]
 c.rect(12, 9, 13, 34, pole[2]); c.vline(13, 9, 34, pole[0]); c.vline(12, 26, 34, pole[3])
 c.rect(1, 13, 23, 14, pole[2]); c.hline(1, 23, 14, pole[0])
 for y in range(12, 27):                          # the smock flares to a ragged hem
  half = 5.5 + (y - 12) * 0.2
  for x in range(int(12.5 - half), int(12.5 + half) + 1):
   u = (x + .5 - 12.5) / half
   tone = 3 if u < -0.5 else 4 if u < -0.2 else 3 if u < 0.15 else 2 if u < 0.65 else 1
   if y == 26 and x % 3 == 0: continue
   c.set(x, y, cloth[tone])
 for y in range(12, 16):                          # sleeves
  for x in range(3, 8): c.set(x, y, cloth[3 if y < 14 else 2])
  for x in range(18, 23): c.set(x, y, cloth[2 if y < 14 else 1])
 for x in (9, 12, 16): c.vline(x, 18, 25, cloth[1])                 # folds
 c.hline(7, 18, 20, pole[0]); c.set(12, 21, pole[0]); c.set(12, 22, pole[1])   # rope belt
 for x, y in ((8, 22), (15, 16)):                 # patches, stitched
  c.rect(x, y, x + 2, y + 2, SACK[3]); c.set(x, y, SACK[1]); c.set(x + 2, y + 2, SACK[1])
 for x in range(7, 19, 2):                        # straw at hem and cuffs
  c.vline(x, 27, 28 + (x % 4 == 1), STRAW[3] if x < 12 else STRAW[1])
 for x0, step in ((0, 1), (24, -1)):
  for i in range(3):
   c.set(x0 + i * step, 12 + i % 2, STRAW[3]); c.set(x0 + i * step, 15 - i % 2, STRAW[2])
 for y in range(3, 11):                           # the sack head
  half = 4.2 * sqrt(max(0, 1 - ((y - 6.5) / 4.4) ** 2))
  for x in range(int(12.5 - half), int(12.5 + half) + 1):
   u = (x + .5 - 12.5) / max(half, .5)
   c.set(x, y, SACK[4] if u < -0.3 else SACK[3] if u < 0.3 else SACK[2])
 c.set(11, 6, INK); c.set(14, 6, INK); c.set(11, 5, INK); c.set(14, 5, INK)
 for x in range(10, 16): c.set(x, 8, INK if x % 2 == 0 else SACK[2])  # stitched mouth
 c.hline(9, 16, 10, pole[1])                      # the neck tie
 c.hline(5, 20, 3, STRAW[1]); c.hline(6, 19, 2, STRAW[3]); c.hline(7, 18, 3, STRAW[2])
 c.rect(9, 0, 16, 1, STRAW[2]); c.hline(9, 16, 0, STRAW[3]); c.hline(9, 16, 2, cloth[1])
 for x in (6, 10, 15, 19): c.set(x, 2, STRAW[1])
 c.outline(INK)
 return c.image()


STORES = {
 'barrel': barrel,
 'crate': crate,
 'crate-stack': crate_stack,
 'woodpile': woodpile,
 'grain-sacks': grain_sacks,
 'flower-tub': flower_tub,
 'scarecrow': scarecrow,
}
