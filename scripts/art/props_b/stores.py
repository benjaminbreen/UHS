"""Household stores drawn to the figure, not the old 48px study canvas.

The barrel and scarecrow were each about twice life size:
a barrel stood a storey tall beside a 23px door. Sizes follow PROP_ART.md,
about 17 source px to the metre. These are placed pixel by rule rather than
shaded by a lighting function: at this size a form reads from a hard lit
band, a hard core shadow and a dark keyline, and a smooth ramp reads as mud.
"""
from math import sqrt, sin, asin, pi
from .core import Canvas, RAMPS, soft_outline
from .workshop import streak
from .solid import K, lathe
from art.front_materials import RAMPS as HOUSE_RAMPS

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
BOX_WOOD = [['#%02x%02x%02x' % HOUSE_RAMPS['oak'][i][:3] for i in (6, 5, 3, 2, 0)],
            [RAMPS['walnut7'][i] for i in (1, 2, 3, 5, 6)],
            [RAMPS['ash7'][i] for i in (1, 2, 3, 5, 6)]]


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


def barrel(v=0):
 """A 0.95 m cask seen from a little above: the head is a lit ellipse, the
 staves run top to bottom and crowd at the sides, and every hoop follows the
 same ellipse as the chime, so it bows down toward the eye."""
 w = RAMPS[['oak7', 'walnut7', 'ash7'][v]]
 m = RAMPS['blackiron7']
 c = Canvas(17, 24)
 cx, rx0, ry, top, bot = 8.5, 6.6, 2.6, 3, 21
 def half(y):                                      # the bulge, widest at the bung
  t = (y - top) / (bot - top)
  return rx0 + 1.6 * sin(pi * t)
 def arc(x, y0, r):                                # the near half of an ellipse
  u = (x + .5 - cx) / r
  return y0 + ry * sqrt(max(0, 1 - u * u)) if abs(u) <= 1 else None
 for x in range(17):
  for y in range(top, bot + 4):
   h = half(min(y, bot))
   u = (x + .5 - cx) / h
   if abs(u) > 1: continue
   if y > bot and (arc(x, bot, h) is None or y > arc(x, bot, h)): continue
   # a cylinder lit from the upper left: highlight a third in, core shadow
   # past the middle, a little bounce on the far edge
   tone = 3 if u < -0.8 else 5 if u < -0.52 else 6 if u < -0.3 else 4 if u < 0.05 else 3 if u < 0.45 else 2 if u < 0.86 else 3
   th = asin(max(-1, min(1, u)))                   # stave joints, even round the girth
   if abs((th / pi * 9 + 0.5) % 1 - 0.5) < 0.09 * (1 + abs(u)): tone = max(1, tone - 2)
   c.set(x, y, w[tone])
 for y0 in (6, 10, 15, 19):                         # hoops on the chime's curve
  h = half(y0)
  for x in range(17):
   y = arc(x, y0, h + 0.3)
   if y is None: continue
   u = (x + .5 - cx) / h
   y = round(y) - 1
   c.set(x, y, m[6] if -0.62 < u < -0.25 else m[5] if u < 0.2 else m[3])
   c.set(x, y + 1, m[2] if u < 0.2 else m[1])
 for x in range(17):                               # the head, above the top hoop
  for y in range(0, top + 3):
   U, V = (x + .5 - cx) / rx0, (y + .5 - top) / ry
   r2 = U * U + V * V
   if r2 > 1: continue
   if r2 > 0.55: tone = 6 if U < 0.2 else 4       # the chime
   elif V < -0.1: tone = 3                         # the far chime's shadow on the head
   else: tone = 5
   c.set(x, y, w[tone])
  y = arc(x, top, rx0)
  if y is not None: c.set(x, round(y) + 1, w[1])   # under the near chime's lip
 for bx in (6, 11):                                # the head's board joints
  for y in range(top, top + 2):
   if c.get(bx, y) in (w[3], w[4]): c.set(bx, y, w[2])
 c.set(9, 12, w[1]); c.set(8, 12, w[6])            # the bung
 soft_outline(c, w[1], w[3])
 return c.image()


def plain_box(v=0, lid=True):
 """A low board box with a lift-off lid: the lid seen from above and
 overhanging by a pixel, broad boards and dovetails at the corners. Open,
 the lid leans on the back and the box shows its straw."""
 o = 7 if not lid else 0
 c = Canvas(19, 17 + o)
 c.PAD = 2
 w = BOX_WOOD[v]
 if lid:
  c.rect(0, 0, 18, 6, w[4])
  c.hline(0, 18, 0, w[3]); c.hline(0, 18, 5, w[4])
  for y in (2, 4): streak(c, 1, 17, y, w, 3)
  c.hline(0, 18, 6, w[3])
 else:
  c.rect(0, 0, 18, 7, w[3])                                                   # the lid against the back
  for y in (2, 5): streak(c, 1, 17, y, w, 2)
  c.hline(0, 18, 0, w[4]); c.hline(0, 18, 7, w[2])
  c.rect(1, o, 17, o + 6, w[1]); c.hline(1, 17, o, w[0])
  c.vline(1, o, o + 6, w[2]); c.hline(1, 17, o + 6, w[3])
  straw = ('#e9d58c', '#c8ae5e', '#9c8240')
  for x in range(3, 16):
   for y in range(o + 3, o + 6):
    if (x * 5 + y * 3) % 7 < 4: c.set(x, y, straw[(x + y) % 3])
  c.hline(0, 18, o + 6, w[4])
 c.hline(0, 18, o + 7, w[1])
 for y in range(o + 8, o + 16):
  c.hline(1, 17, y, w[1] if y == o + 15 else w[2])
 c.hline(1, 17, o + 11, w[1]); c.hline(1, 17, o + 8, w[3])
 streak(c, 2, 15, o + 9, w, 2); streak(c, 2, 15, o + 13, w, 2)
 for x in (1, 17):
  for y in range(o + 8, o + 16, 2): c.set(x, y, w[3] if x == 1 else w[1])
 c.hline(1, 17, o + 16, w[0])
 soft_outline(c, w[0], w[3])
 return c.image()


def plain_box_open(v=0): return plain_box(v, lid=False)


KRAFT = [['#4a3420', '#6e4f2e', '#93703f', '#b38f55', '#cfae74', '#e3caa0'],
         ['#3f2219', '#623527', '#844a36', '#a3634a', '#bf8265', '#d6a68a'],
         ['#1e2c38', '#2f4558', '#43617a', '#5d7f97', '#7f9fb3', '#a9c2cf']]


def cardboard_box(v=0, state=None):
 """A folded carton: flaps meeting at a taped seam on top, a crease where
 the top turns down, a stencilled mark on the face. Opened, the flaps stand
 out from the mouth; crushed, the top caves in and the face buckles."""
 k = KRAFT[v]
 tape = ['#8f8468', '#c9bd98', '#e6dcbc']
 X, Y = (2, 3) if state == 'open' else (0, 0)
 c = Canvas(13 + 2 * X, 13 + Y)
 c.PAD = 2
 if state == 'open':
  c.rect(X + 1, 0, X + 11, 2, k[4]); c.hline(X + 1, X + 11, 0, k[5])                 # the back flap
  for i in range(4):                                                                 # the side flaps
   c.hline(i, X + 1, Y + i, k[5] if i < 2 else k[4]); c.hline(X + 11, c.w - 1 - i, Y + i, k[2])
  c.rect(X, Y, X + 12, Y + 3, k[1]); c.hline(X, X + 12, Y, k[0])
  c.rect(X + 2, Y + 1, X + 9, Y + 3, k[2]); c.set(X + 4, Y + 2, k[3]); c.set(X + 7, Y + 3, k[3])
  c.hline(X, X + 12, Y + 3, k[4])
 elif state == 'dented':
  c.rect(0, 1, 12, 3, k[4]); c.hline(0, 3, 0, k[5]); c.hline(9, 12, 0, k[4])
  c.rect(3, 1, 9, 3, k[2]); c.rect(4, 2, 8, 3, k[1]); c.hline(4, 8, 1, k[3])
  c.set(5, 1, tape[1]); c.set(6, 2, tape[0]); c.set(7, 1, tape[2])
 else:
  c.rect(0, 0, 12, 3, k[4])
  c.hline(0, 5, 0, k[5]); c.hline(7, 12, 0, k[4])
  c.vline(6, 0, 3, k[2])
  c.set(5, 1, k[5]); c.set(1, 2, k[5])
  c.rect(5, 0, 7, 3, tape[2]); c.vline(7, 0, 3, tape[1])
 c.hline(X, X + 12, Y + 4, k[1])
 c.rect(X, Y + 5, X + 12, Y + 12, k[3])
 c.rect(X + 9, Y + 5, X + 12, Y + 12, k[2])
 c.vline(X, Y + 5, Y + 12, k[4])
 c.rect(X + 5, Y + 5, X + 7, Y + 7, tape[1]); c.vline(X + 7, Y + 5, Y + 7, tape[0])
 if state == 'dented':
  for x, y in ((3, 6), (4, 7), (5, 8), (6, 8), (7, 9), (8, 9)): c.set(x, y, k[2]); c.set(x, y + 1, k[4])
  c.set(12, 6, k[1]); c.set(11, 7, k[1])
 c.rect(X + 2, Y + 9, X + 4, Y + 10, k[1]); c.set(X + 3, Y + 9, k[2])
 c.hline(X, X + 12, Y + 12, k[1])
 soft_outline(c, k[0], k[3])
 return c.image()


def cardboard_box_open(v=0): return cardboard_box(v, 'open')
def cardboard_box_dented(v=0): return cardboard_box(v, 'dented')


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
 """Tied sacks stood together, the gathered necks and ears seen from above."""
 p = SACK if v != 1 else ['#57503a', '#7f775a', '#a8a07e', '#ccc5a3', '#e8e3c8']
 c = Canvas(32, 26)
 for cx, by in ((8, 18), (23, 18), (15.5, 24)):
  lathe(c, cx, by, [(0, 5.8), (2, 6.6), (7, 6.4), (10, 5.6), (11.5, 4.0), (12.2, 2.2)], p,
        lambda z, a, i: i - (abs(a - .6) < .1 and z < 10), flat=False)
  ny = by - 12.2 - 5.8 * K
  c.hline(int(cx) - 1, int(cx) + 1, int(ny) + 1, p[0])
  for dx, dy in ((-2, -1), (-1, -2), (1, -2), (2, -1), (0, -1)):
   c.set(int(cx) + dx, int(ny) + dy, p[4] if dx < 0 else p[2])
 if v == 2:
  for x, y in ((28, 24), (29, 24), (31, 24), (30, 23)): c.set(x, y, '#e3c264')
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


STORES = {
 'barrel': barrel,
 'plain-box': plain_box,
 'cardboard-box': cardboard_box,
 'grain-sacks': grain_sacks,
 'flower-tub': flower_tub,
}
