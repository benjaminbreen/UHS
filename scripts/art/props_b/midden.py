"""Middens: the heap every settlement had until someone came to take it away.

One drawer at two sizes, a household tip and the village's own mound, with the
contents chosen by how the place lived rather than who lived there. At this
size a heap reads from its silhouette and three or four things you can name;
everything else is dark earth.
"""
from math import sqrt
from .core import Canvas, RAMPS, jitter, soft_outline, grass

# Midden soil is dark: decades of ash, dung and rot. Archaeologists call it
# dark earth for a reason.
DARK = ['#1c140e', '#2a1f16', '#3a2b1e', '#4c3927', '#5f4830', '#74593b', '#8b6d49']
ASH = RAMPS['limestone']
BONE = ['#6e6552', '#a39a82', '#d2c9ae', '#ece5cc']
SHELL = ['#7e756a', '#b3a998', '#e0d8ca', '#f6f1e6']
SHERD = RAMPS['terracotta7']
STONE = ['#3a3430', '#5c524a', '#7f7166', '#9e8f80']
STRAW = RAMPS['straw']
DUNG = ['#1e1a10', '#2f2a18', '#443c22', '#5a4f2e']
TILE = RAMPS['redearth7']
GLASS = ['#1d3326', '#2f5a3c', '#4f8a5c', '#a8d4ac']
CINDER = ['#15151a', '#26262c', '#3a3a42', '#56545c']
FLY = '#16120c'

# The variants, in the order props.json names them.
CONTENTS = [
 ['bone', 'stone', 'bone', 'flake', 'stone', 'antler'],     # foragers
 ['shells', 'bone', 'stone', 'shells'],                     # a shore camp
 ['sherd', 'straw', 'bone', 'sherd', 'pot'],                # farmers
 ['dung', 'horn', 'bone', 'dung', 'straw'],                 # herders
 ['tile', 'oyster', 'sherd', 'bone', 'amphora'],            # a town
 ['glass', 'cinder', 'pipe', 'sherd', 'bone', 'cinder'],    # after 1600
]


def _bone(c, x, y, k):
 n = 5 + k % 3
 for i in range(n):
  c.set(x + i, y + (i * (k % 2)) // 4, BONE[2 if i % 3 else 1]); c.set(x + i, y + 1 + (i * (k % 2)) // 4, BONE[0])
 for dx, dy in ((-1, -1), (-1, 1), (n, -1), (n, 1)):           # the knuckle ends
  c.set(x + dx, y + dy + (0 if dx < 0 else (n * (k % 2)) // 4), BONE[3 if dy < 0 else 1])


def _antler(c, x, y, k):
 for i in range(8):
  c.set(x + i, y - i // 3, BONE[2]); c.set(x + i, y - i // 3 + 1, BONE[0])
 for i in range(3):
  c.set(x + 3, y - 2 - i, BONE[3 if i == 2 else 2]); c.set(x + 6, y - 3 - i, BONE[2])


def _stone(c, x, y, k):
 # Fire-cracked: angular, and reddened on one face by the hearth.
 for dy, row in enumerate(((1, 3), (0, 4), (0, 4))):
  for dx in range(*row):
   c.set(x + dx, y + dy, STONE[3 if dy == 0 else 2 if dx < 2 else 1])
 c.set(x + 3, y + 1, '#8a5a44'); c.set(x + 2, y + 2, STONE[0])


def _flake(c, x, y, k):
 c.set(x, y, '#2a2c30'); c.set(x + 1, y, '#6a7078'); c.set(x + 1, y - 1, '#b8c0c8')


def _shells(c, x, y, k):
 for i in range(6):
  n = jitter(x, y, i)
  sx, sy = x + n % 9 - 3, y + (n // 9) % 4 - 1
  c.set(sx, sy, SHELL[3 if n % 3 else 2]); c.set(sx + 1, sy, SHELL[1]); c.set(sx, sy + 1, SHELL[0])


def _sherd(c, x, y, k):
 # A curved body sherd, rim up, lit on the outside of the curve.
 for i in range(6):
  dy = 1 if i in (0, 5) else 0
  c.set(x + i, y + dy, SHERD[5 if i < 3 else 4]); c.set(x + i, y + dy + 1, SHERD[3]); c.set(x + i, y + dy + 2, SHERD[1])


def _pot(c, x, y, k):
 # Half a pot, sunk on its side with the dark inside showing.
 for dy, half in enumerate((3, 4, 4, 3)):
  for dx in range(-half, half + 1):
   inside = abs(dx) < half - 1 and dy < 3
   c.set(x + dx, y + dy, DARK[0] if inside else SHERD[5 if dx < 0 else 3])
 c.hline(x - 3, x + 3, y - 1, SHERD[6])


def _straw(c, x, y, k):
 for i in range(5):
  n = jitter(x, i, k)
  sx, sy = x + n % 8, y + (n // 8) % 3
  c.set(sx, sy, STRAW[5]); c.set(sx + 1, sy + (n % 2), STRAW[4])


def _dung(c, x, y, k):
 for dx, dy in ((0, 0), (1, 0), (2, 0), (1, -1), (4, 1), (5, 1), (5, 0)):
  c.set(x + dx, y + dy, DUNG[3 if dy < 0 or dx == 5 else 2])
 c.hline(x, x + 5, y + 2, DUNG[0])


def _horn(c, x, y, k):
 for i in range(7):
  yy = y - (i * i) // 12
  c.set(x + i, yy, BONE[2 if i < 5 else 3]); c.set(x + i, yy + 1, BONE[1] if i < 4 else BONE[0])


def _tile(c, x, y, k):
 # A broken roof tile lying flat: a lit top face and a thick edge.
 for dx in range(8):
  if dx == 7 and k % 2: continue
  c.set(x + dx, y, TILE[5]); c.set(x + dx, y + 1, TILE[4]); c.set(x + dx, y + 2, TILE[2])
 c.set(x + 2, y, TILE[6]); c.set(x + 3, y, TILE[6])


def _oyster(c, x, y, k):
 for i in range(3):
  sx = x + i * 3
  c.set(sx, y, '#c8c4b8'); c.set(sx + 1, y, '#9a978c'); c.set(sx, y + 1, '#6c6a62')


def _amphora(c, x, y, k):
 # A neck and handle, the piece of a jar that survives being thrown out.
 for i in range(6):
  c.set(x, y - i, SHERD[5]); c.set(x + 1, y - i, SHERD[3]); c.set(x + 2, y - i, SHERD[2])
 c.hline(x - 1, x + 3, y - 6, SHERD[6])
 for i in range(4): c.set(x + 3 + (i > 0) + (i > 2), y - 5 + i, SHERD[4])


def _glass(c, x, y, k):
 # A bottle on its side, neck downhill.
 for dx in range(6):
  c.set(x + dx, y, GLASS[2]); c.set(x + dx, y + 1, GLASS[1]); c.set(x + dx, y + 2, GLASS[0])
 c.set(x + 6, y + 1, GLASS[1]); c.set(x + 7, y + 1, GLASS[2])
 c.set(x + 1, y, GLASS[3]); c.set(x + 2, y, GLASS[3])


def _cinder(c, x, y, k):
 for dx, dy in ((0, 0), (1, 0), (1, -1), (2, 0), (3, 1), (4, 1), (2, 1)):
  c.set(x + dx, y + dy, CINDER[3 if dy < 0 else 2 if dx % 2 else 1])


def _pipe(c, x, y, k):
 # A clay pipe stem: the commonest thing on any site after 1600.
 for i in range(7): c.set(x + i, y + i // 4, '#e8e2d4')
 c.set(x - 1, y - 1, '#e8e2d4'); c.set(x - 1, y, '#b8b0a0')


ITEM = {'bone': _bone, 'antler': _antler, 'stone': _stone, 'flake': _flake,
        'shells': _shells, 'sherd': _sherd, 'pot': _pot, 'straw': _straw,
        'dung': _dung, 'horn': _horn, 'tile': _tile, 'oyster': _oyster,
        'amphora': _amphora, 'glass': _glass, 'cinder': _cinder, 'pipe': _pipe}


def _hash(x, y):
 h = (x * 374761393 + y * 668265263) & 0xffffffff
 h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
 return (h ^ (h >> 16)) & 1023


def _heap(v, frame, w, h, lumps, tipped):
 c = Canvas(w, h)
 base = h - 5
 # A tipped heap is basket-loads, not a dome: small lumps along the crest.
 lumps = list(lumps)
 for (cx, cy, rx, ry) in list(lumps):
  for k in range(int(rx) // 5):
   n = jitter(cx, k, v)
   a = -0.9 + 1.8 * k / max(int(rx) // 5 - 1, 1)
   lumps.append((cx + a * rx * 0.8, cy - ry * sqrt(max(0, 1 - (a * .8) ** 2)) + 3, 4 + n % 4, 3 + n % 3))
 mask = {}
 for y in range(h):
  for x in range(w):
   best = None
   for (cx, cy, rx, ry) in lumps:
    u, d = (x + .5 - cx) / rx, (y + .5 - cy) / ry
    r2 = u * u + d * d
    if r2 <= 1 and (best is None or r2 < best[0]): best = (r2, u, d, rx)
   if best is None or y > base: continue
   r2, u, d, rx = best
   lam = -0.55 * u - 0.6 * d + 0.7 * sqrt(1 - r2)
   mask[(x, y)] = max(0, min(6, round(1 + lam * 4.2)))
 top = {}
 for (x, y) in mask:
  if y < top.get(x, h): top[x] = y
 for (x, y), i in mask.items():
  n = jitter(x, y, v)
  c.set(x, y, DARK[max(0, min(6, i + (n % 7 == 0) - (n % 5 == 0)))])
 # Clods of ash and burnt earth through the body, so it is not one brown.
 for k in range(w // 6):
  n = jitter(k, v, 7)
  x, y = sorted(top)[n * 5 % len(top)], 0
  y = top[x] + 3 + (jitter(x, k) % max(2, base - top[x] - 4))
  tone = ASH[3 + n % 2] if n % 3 else '#6a3e2a'
  for dx, dy in ((0, 0), (1, 0), (0, 1), (-1, 1)):
   if (x + dx, y + dy) in mask and mask[(x + dx, y + dy)] > 1: c.set(x + dx, y + dy, tone)
 # Ash lenses, broken where later loads cut them: they are what makes a heap
 # read as tipped rubbish rather than a mound of soil.
 xs = sorted(top)
 for (a, b, depth) in ((len(xs) // 8, len(xs) // 2, 5), (len(xs) * 5 // 8, len(xs) * 7 // 8, 7)):
  x0, x1 = xs[a], xs[b]
  for x in range(x0, x1 + 1):
   if jitter(x // 3, v, depth) % 5 == 0: continue
   d = depth + abs(x - (x0 + x1) // 2) // 4
   for k in range(2 + (w > 80)):
    y = top[x] + d + k
    if (x, y) in mask and mask[(x, y)] > 1: c.set(x, y, ASH[5 - k] if mask[(x, y)] > 3 else ASH[3 - k // 2])
 # The fresh tip: a wet tongue down one flank from the crest, darker than the
 # heap around it but still lit like it.
 fx, fy = tipped
 for (x, y) in mask:
  t = (y - top.get(fx, fy)) / max(base - top.get(fx, fy), 1)
  half = (w / 22) * (0.6 + t)
  off = x - fx + t * w / 14
  if abs(off) <= half and (abs(off) < half - 1 or jitter(x, y) % 2):
   c.set(x, y, DARK[max(0, mask[(x, y)] - 2)])
 if v == 1:                                                 # a shell heap is mostly shell
  for (x, y), i in mask.items():
   n = _hash(x, y)
   clump = _hash(x // 4, y // 3) % 3
   if y < base - 1 and n % (2 + clump) == 0: c.set(x, y, SHELL[max(0, min(3, i // 2 + (n >> 4) % 2))])
 # The things you can name, set into the surface; more of them spill round
 # the foot, which is where things roll to.
 items = CONTENTS[v] * (2 if w > 80 else 1)
 for k, name in enumerate(items):
  x = xs[4 + (k * len(xs) * 5 // 7 // len(items) + jitter(k, v) % 5) % (len(xs) - 14)]
  foot = k % 3 == 2
  y = base - 3 if foot else top[x] + 3 + (jitter(x, k) % max(3, (base - top[x]) // 2))
  ITEM[name](c, x, min(y, base - 3), k)
 for x in range(xs[0] - 2, xs[-1] + 3):
  if jitter(x, base) % 4 == 0: c.set(x, base + 1, DARK[2])
 soft_outline(c, DARK[0], DARK[4])
 # A fly or two over the wet corner, not a swarm on rails: each frame puts
 # them somewhere new, which is what flies look like at a glance.
 for i in range(2 + (w > 80)):
  n = jitter(frame, i, v)
  if (n + frame) % 4 == 0: continue
  c.set(fx - 5 + n % 11, fy - h // 4 - (n // 11) % 6, FLY)
 grass(c, [(1, h - 2, 3), (w - 4, h - 2, 2)])
 return c


def household(v=0, frame=0):
 """The yard's own tip, a couple of metres across."""
 c = _heap(v, frame, 64, 40, [(38, 36, 24, 20), (18, 37, 15, 13), (51, 37, 12, 12)], (22, 30))
 return c.image()


def communal(v=0, frame=0):
 """The village midden: years of it, taller than a person at the crown and
 spreading down its own slope. Sited at the edge, downwind if anyone chose."""
 c = _heap(v, frame, 124, 64,
           [(66, 60, 44, 38), (34, 60, 28, 24), (96, 60, 26, 26), (80, 58, 30, 32), (16, 60, 14, 10)],
           (36, 46))
 return c.image()


MIDDEN = {
 'privy-midden': household,
 'midden': communal,
}
