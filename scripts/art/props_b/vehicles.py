"""Parked cars, drawn from a model rather than four times by hand.

A car is described in metres -- its deck line, its cabin, its wheels, fenders,
bumpers, lamps and paint -- and sampled as a column of parts at every point of
its plan. The columns are painted far to near in the game's view: the side or
the end square on, ground depth at half the prop scale (the terrain's own
scale), lit from the upper left. One model gives all four headings, each lit
the same way, which four hand-drawn views never quite are.

Scale follows PROP_ART.md: about 17px to the metre.
"""
from math import atan2, hypot, pi, sqrt
from PIL import Image
from .core import RAMPS

PX = 17
DEPTH = 0.5          # ground depth on screen, as a share of the prop scale

# Car paints of their decades, seven steps each, dark to light.
PAINT = {
 'black': ['#0c0e12', '#15181e', '#20242c', '#2d323c', '#3f4652', '#5a6270', '#808896'],
 'cream': ['#4a4232', '#6e6449', '#958a66', '#b8ad86', '#d3c9a2', '#e6dfbf', '#f4efd8'],
 'white': ['#4b4f55', '#6d737a', '#9198a0', '#b4bac1', '#d0d5da', '#e4e8eb', '#f5f7f8'],
 'red': ['#2a0a0c', '#4a1014', '#6e171b', '#951f22', '#b93129', '#d4503a', '#e97d5e'],
 'maroon': ['#1f0a0e', '#331117', '#4a1921', '#62222c', '#7c3038', '#984548', '#b36660'],
 'sky': ['#15283a', '#20405a', '#2f5d7d', '#4680a0', '#66a2bd', '#90c2d4', '#bfdde6'],
 'navy': ['#0b1220', '#121d33', '#1b2a49', '#253a60', '#334d78', '#4a6690', '#6c86aa'],
 'mint': ['#1c3530', '#28514a', '#3b7066', '#528f82', '#72ad9e', '#98c8b9', '#c2e1d4'],
 'turquoise': ['#0d2e30', '#12474a', '#196366', '#228184', '#3aa0a0', '#62bfba', '#98dad2'],
 'pink': ['#3e1f28', '#62323e', '#874a58', '#a8657a', '#c5859a', '#dba8b8', '#eed0d8'],
 'yellow': ['#3c2c07', '#5f470b', '#866611', '#ad8a18', '#cfae29', '#e6ca4b', '#f5e37f'],
 'taxi': ['#3d2604', '#633f07', '#8c5b0a', '#b6790f', '#dc9a1b', '#f0b93a', '#fbd66e'],
 'green': ['#0f2012', '#17331c', '#224a28', '#2f6436', '#437f48', '#62995f', '#8ab47e'],
 'olive': ['#23240f', '#373818', '#4d4e22', '#65662e', '#7f7f3e', '#999854', '#b6b474'],
 'brown': ['#20140c', '#352214', '#4c321d', '#654428', '#805a36', '#9c744a', '#b99264'],
 'beige': ['#3d3426', '#5d5039', '#7f6f51', '#a08f6c', '#bcae8b', '#d3c7a8', '#e7ddc6'],
 'orange': ['#3a1706', '#5e250a', '#853610', '#ae4a17', '#d0632a', '#e5854a', '#f3ab78'],
 'silver': ['#2a2e33', '#40464c', '#5a6168', '#767d84', '#959ba1', '#b5babe', '#d6d9db'],
 'grey': ['#1f2226', '#30353a', '#43494f', '#585f66', '#707880', '#8c939a', '#abb1b6'],
 'blue': ['#0a1631', '#10224a', '#193369', '#23468a', '#335ea8', '#5580c2', '#86a8d8'],
 'gold': ['#2e2410', '#4a3a1a', '#6a5426', '#8c7035', '#ad8e49', '#c9ad66', '#e2cc8e'],
 'teal': ['#0c2026', '#12323b', '#1a4853', '#23606d', '#337b88', '#5299a4', '#7fb8c0'],
}
CHROME = ['#262a30', '#4a5058', '#7c848c', '#aeb5bb', '#d6dbde', '#f1f3f3', '#ffffff']
GLASS = ['#0d161c', '#152228', '#1f3139', '#2d4550', '#44616c', '#6c8a92', '#a7c0c3']
TYRE = ['#0b0b0c', '#141416', '#1c1d20', '#26282b', '#333538', '#44474a', '#5a5d60']
RIM = ['#2b2e32', '#4a4f55', '#6d737a', '#949aa0', '#b8bdc1', '#d7dadc', '#f0f1f2']
UNDER = '#0b0c0e'
LAMP = ['#8a7a4e', '#c9bd8a', '#f2ecc9', '#fffbe8']
TAIL = ['#3a0a0a', '#6e1210', '#b0231a', '#e25a3c']
GRILLE = ['#07080a', '#15171a', '#2a2d31']

# Light from the upper left of the screen and from above: from the west, a
# little toward the viewer, so a flank facing south is lit but not bleached.
LIGHT = (-0.55, 0.28, 0.79)


def smooth(t):
 t = max(0.0, min(1.0, t))
 return t * t * (3 - 2 * t)


def piece(points, x):
 """Piecewise-linear profile through (x, z) control points, in metres."""
 if x <= points[0][0]: return points[0][1]
 for (x0, z0), (x1, z1) in zip(points, points[1:]):
  if x <= x1:
   t = (x - x0) / max(x1 - x0, 1e-6)
   return z0 + (z1 - z0) * t
 return points[-1][1]


class Car:
 """Geometry in metres. x runs from the front bumper (0) to the rear (L);
 d is the distance from the centre line; z is height above the road."""

 def __init__(s, spec, paint):
  s.__dict__.update(spec)
  s.paint = PAINT[paint]
  s.roof_paint = PAINT[spec['top_paint']] if spec.get('top_paint') else s.paint
  s.hw = s.W / 2

 def half(s, x):
  """Half-width of the body at x: the plan is rounded at nose and tail."""
  w = s.hw - s.get('fender_w', 0)
  # Before the war the engine sat under its own narrow bonnet between the
  # fenders, ahead of a wider body.
  if s.get('hood_w') and x < s.cabin[0] - 0.02: w = min(w, s.hood_w)
  for dist, r in ((x, s.nose), (s.L - x, s.tail)):
   if r > 0 and dist < r:
    t = (r - dist) / r
    w -= r * s.get('pinch', 0.55) * (1 - sqrt(max(0.0, 1 - t * t)))
  return w

 def get(s, k, default=None): return s.__dict__.get(k, default)

 def deck(s, x, d):
  """Top of the lower body, rolled over at its outer edge, with fins."""
  hw = s.half(x)
  if d > hw: return None
  z = piece(s.profile, x)
  roll = s.get('roll', 0.14)
  if d > hw - roll: z -= (d - (hw - roll)) ** 2 / roll * 1.1
  fin = s.get('fin')
  if fin and x > s.L - fin[0] and d > hw - 0.18:
   z += fin[1] * smooth((x - (s.L - fin[0])) / fin[0])
  bed = s.get('bed')
  if bed and x > bed and d < hw - 0.07 and x < s.L - 0.07:
   z = s.get('bed_floor', 0.62)
  return z

 def roof(s, x):
  c0, c1, c2, c3 = s.cabin
  if x < c0 or x > c3: return None
  if x < c1: return s.belt + (s.H - s.belt) * smooth((x - c0) / (c1 - c0)) ** 0.8
  if x > c2: return s.belt + (s.H - s.belt) * smooth((c3 - x) / (c3 - c2)) ** 0.8
  return s.H

 def cab(s, x, d):
  """Top of the cabin at (x, d): sides lean in toward the roof."""
  zr = s.roof(x)
  if zr is None: return None
  base = s.half(x) - s.get('inset', 0.07)
  if d > base: return None
  tuck = s.get('tuck', 0.12)
  if tuck <= 0: return zr
  z = s.belt + (base - d) / tuck * (s.H - s.belt)
  return min(zr, z)

 def wheel(s, x, d, z):
  """(radial distance / r) if (x, d, z) is inside a wheel, else None."""
  r = s.r
  for xw in s.wheels:
   rho = hypot(x - xw, z - r)
   if rho > r: continue
   outer = s.hw - s.get('wheel_in', 0.08)
   if outer - s.tyre_w <= d <= outer:
    return rho / r, outer - d, (atan2(z - r, x - xw) / (2 * pi)) % 1
  return None

 def arch(s, x):
  """Height of the fender opening's edge above x, or 0 away from wheels."""
  if s.get('fender_w'): return 0
  top = 0
  for xw in s.wheels:
   a = s.r + 0.05
   if abs(x - xw) < a:
    top = max(top, s.r + sqrt(a * a - (x - xw) ** 2))
  return top

 def fender(s, x, d):
  """Separate fenders and a running board, for cars before the war."""
  fw = s.get('fender_w')
  if not fw or d > s.hw or d < s.hw - fw - 0.06: return None
  best = None
  for xw in s.wheels:
   span = s.r * 1.55
   if abs(x - xw) < span:
    t = (x - xw) / span
    z = s.r * 2 + 0.07 - (t * t) * (s.r * 1.3)
    best = max(best or 0, z)
  if best is None and s.get('running_board') and s.wheels[0] < x < s.wheels[-1]:
   best = 0.42
  return best

 def top(s, x, d):
  zs = [z for z in (s.deck(x, d), s.cab(x, d), s.fender(x, d)) if z is not None]
  w = None
  for xw in s.wheels:
   if abs(x - xw) <= s.r:
    outer = s.hw - s.get('wheel_in', 0.08)
    if outer - s.tyre_w <= d <= outer:
     w = s.r + sqrt(max(0.0, s.r * s.r - (x - xw) ** 2))
  if w is not None: zs.append(w)
  return max(zs) if zs else None

 def part(s, x, d, z):
  w = s.wheel(x, d, z)
  deck = s.deck(x, d)
  fend = s.fender(x, d)
  # A mudguard is a sheet over the wheel, and a running board a plank.
  guard = (fend is not None and d > s.hw - s.get('fender_w', 0) - 0.06
           and fend - (0.06 if fend <= 0.43 else 0.11) <= z <= fend)
  if w and not guard:
   rho, inset, ang = w
   hub = s.get('hub', 'hubcap')
   if rho > 0.72: return 'tyre'
   if hub == 'whitewall' and rho > 0.58: return 'white'
   if hub == 'spoke':
    # Twelve wooden spokes from a hub to the felloe.
    if rho < 0.2: return 'rim'
    if rho > 0.62: return 'felloe'
    return 'spoke' if (ang * 12) % 1 < 0.34 else None
   if hub == 'wire':
    if rho < 0.2: return 'rim'
    return 'rim' if (ang * 20) % 1 < 0.4 or rho > 0.64 else 'hubdark'
   if hub == 'steel': return 'hubdark' if 0.35 < rho < 0.42 else 'steel'
   if hub == 'alloy':
    if rho < 0.18: return 'rim'
    return 'rim' if (ang * 5) % 1 < 0.45 else 'hubdark'
   return 'rim' if rho < 0.6 else 'hubdark'
  if guard: return 'paint'
  if deck is not None and z <= deck:
   if z < s.clear or (z < s.arch(x) and d > s.half(x) - 0.42):
    return 'under' if d < s.half(x) - 0.12 else None
   L = s.L
   bumper = s.get('bumper', 'chrome')
   bz0, bz1 = s.get('bumper_z', (0.3, 0.46))
   if bumper != 'none' and (x < 0.12 or x > L - 0.12) and bz0 <= z <= bz1:
    return 'chrome' if bumper == 'chrome' else 'trim'
   if x < 0.07:
    gw = s.get('grille_w', 0.32)
    gz = s.get('grille_z', (bz1 + 0.02, s.profile[0][1] - 0.06))
    lamp = s.get('lamp', 'round')
    lx, lz = s.half(x) - s.get('lamp_in', 0.22), s.get('lamp_z', gz[1] - 0.08)
    if lamp == 'round' and hypot(d - lx, z - lz) < 0.095: return 'lamp'
    if lamp == 'rect' and abs(d - lx) < 0.14 and abs(z - lz) < 0.05: return 'lamp'
    if lamp == 'twin' and (hypot(d - lx, z - lz) < 0.07 or hypot(d - lx + 0.17, z - lz) < 0.07): return 'lamp'
    if d < gw and gz[0] <= z <= gz[1]:
     return 'grille' if int(z * 60) % 2 or d > gw - 0.03 else 'chrome'
   if x > L - 0.07:
    tl = s.get('tail_z', s.profile[-1][1] - 0.1)
    if d > s.half(x) - 0.2 and abs(z - tl) < 0.06: return 'tail'
    if d < 0.16 and abs(z - (bz1 + 0.07)) < 0.05: return 'plate'
   if abs(z - s.get('trim_z', -1)) < 0.02: return 'chrome'
   if d > s.half(x) - 0.03:
    if any(abs(x - sx) < 0.02 for sx in s.get('seams', ())) and s.clear + 0.06 < z < s.belt - 0.02:
     return 'seam'
    if any(abs(x - (sx - 0.22)) < 0.06 for sx in s.get('seams', ())[:1]) and abs(z - (s.belt - 0.09)) < 0.02:
     return 'chrome'
   if s.get('stripe') and abs(z - s.stripe) < 0.035 and d > s.half(x) - 0.08: return 'stripe'
   return 'paint'
  cab = s.cab(x, d)
  if cab is not None and z <= cab and z > (deck if deck is not None else 0):
   c0, c1, c2, c3 = s.cabin
   if s.get('open') and z > s.belt + 0.05: return None
   near_roof = z > s.roof(x) - s.get('rail', 0.06)
   pillars = s.get('pillars', [(c0, c0 + (c1 - c0) * 0.55), ((c1 + c2) / 2 - 0.05, (c1 + c2) / 2 + 0.05), (c2 + (c3 - c2) * 0.35, c3)])
   side = d > s.half(x) - s.get('inset', 0.07) - s.get('tuck', 0.12) * (z - s.belt) / max(s.H - s.belt, 0.1) - 0.04
   if side and not near_roof and not any(a <= x <= b for a, b in pillars):
    return 'glass'
   if not side:
    zr = s.roof(x)
    slope = abs(s.roof(min(x + 0.05, c3)) - s.roof(max(x - 0.05, c0))) / 0.1
    if slope > 0.9 and z >= zr - 0.05: return 'glass'
   return 'roof'
  return None


def shade(ramp, lam):
 # No dither across a body: seven steps already band finely, and a
 # checkerboard on paint reads as dirt.
 i = int(0.6 + lam * (len(ramp) - 1.2))
 return ramp[max(0, min(len(ramp) - 1, i))]


def render(spec, paint, heading):
 """Paint the car facing `heading` (e, w, s or n) onto its own canvas."""
 car = Car(spec, paint)
 Lp, Wp = int(round(car.L * PX)), int(round(car.W * PX))
 Hp = int(round((car.H + max((car.get('fin') or (0, 0))[1], 0) + 0.1) * PX))
 side = heading in 'ew'
 across = Lp if side else Wp                 # screen width
 depth = Wp if side else Lp                  # ground depth
 W = across + 4
 H = Hp + int(depth * DEPTH) + 4
 ground = H - 2
 px = {}
 # Model axes to world axes for the light: east, south (toward us), up.
 def world(dx, dd):
  return {'e': (dx, dd), 'w': (-dx, -dd), 's': (dd, dx), 'n': (-dd, -dx)}[heading]
 # Far to near.
 for k in range(depth * 2):
  g = k / 2                                  # ground px from the far edge
  near = depth - g
  for a in range(across):
   # (x, y) in model metres: y from the left side of the car.
   if heading == 'e': x, y = (a + .5) / PX, (g + .5) / PX
   elif heading == 'w': x, y = (Lp - a - .5) / PX, (Wp - g - .5) / PX
   elif heading == 's': x, y = (Lp - g - .5) / PX, (Wp - a - .5) / PX
   else: x, y = (g + .5) / PX, (a + .5) / PX
   d = abs(y - car.hw)
   zt = car.top(x, d)
   if zt is None: continue
   ztp = int(zt * PX)
   base = ground - int(near * DEPTH)
   # Surface normal from the height field, in world axes, once per column.
   h = 1 / PX
   gx = ((car.top(x + h, d) or 0) - (car.top(x - h, d) or 0)) / (2 * h)
   gd = ((car.top(x, abs(y + h - car.hw)) or 0) - (car.top(x, abs(y - h - car.hw)) or 0)) / (2 * h)
   wx, wy = world(-gx, -gd)
   n = (wx, wy, 1.0)
   ln = sqrt(wx * wx + wy * wy + 1)
   lit_top = max(0.0, (n[0] * LIGHT[0] + n[1] * LIGHT[1] + LIGHT[2]) / ln) * 0.86
   # A wall faces out of the plan outline, not out of whichever column
   # happens to be nearest: that flickered from pixel to pixel as stripes.
   out = lambda xx, yy: max(abs(yy - car.hw) - car.half(xx), -xx, xx - car.L)
   e = 0.5 / PX
   ox, oy = world((out(x + e, y) - out(x - e, y)), (out(x, y + e) - out(x, y - e)))
   l = hypot(ox, oy)
   wn = (ox / l, oy / l, 0.15) if l > 1e-6 else (0, 1, 0.1)
   # Inside the outline a column's side is a steep top -- a windscreen, the
   # fall of a bonnet -- and turns to the light as a top does.
   outline = out(x, y) > -2.5 / PX
   lit_wall = max(0.0, (wn[0] * LIGHT[0] + wn[1] * LIGHT[1] + wn[2] * LIGHT[2])
                  / sqrt(wn[0] ** 2 + wn[1] ** 2 + wn[2] ** 2)) if outline else None
   for zp in range(0, ztp + 1):
    z = (zp + .5) / PX
    part = car.part(x, d, z)
    if not part: continue
    sy = base - zp
    top = zp == ztp
    lam = lit_top if top or lit_wall is None else (
     lit_wall * 0.8 + 0.12 + 0.1 * (zp / max(ztp, 1)) - (0.12 if zp < car.clear * PX + 3 else 0))
    px[(a + 2, sy)] = colour(car, part, lam, a, sy, top)
 im = Image.new('RGBA', (W, H))
 p = im.load()
 for (x, y), c in px.items():
  if 0 <= x < W and 0 <= y < H:
   c = c.lstrip('#')
   p[x, y] = (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)
 rim(im, car.paint)
 # Stalls and parking lanes are an even number of cells, so a car is centred
 # on the line between two cells: half a cell right of the one it stands on.
 im.info['anchor'] = [W // 2 - 8, ground + 1]
 return im


def colour(car, part, lam, x, y, top):
 if part == 'paint': return shade(car.paint, lam * 1.05)
 if part == 'roof': return shade(car.roof_paint, lam * 1.05)
 if part == 'stripe': return shade(car.roof_paint if car.roof_paint is not car.paint else CHROME, lam)
 if part == 'seam': return car.paint[max(0, int(0.4 + lam * 5) - 2)]
 if part == 'trim': return shade(TYRE, lam * 0.9 + 0.1)
 if part == 'chrome':
  # Chrome shows the sky over its top and the road under its face.
  return CHROME[6 if top else 4 if lam > 0.55 else 2 if lam > 0.3 else 1]
 if part == 'glass':
  # A streak of reflected sky runs diagonally across every pane.
  streak = (x - y) % 13 in (0, 1) or (x - y) % 13 == 5
  i = 4 if top else 2
  if streak: i += 2
  if lam < 0.3: i -= 1
  return GLASS[max(0, min(6, i))]
 if part == 'tyre': return TYRE[2 if lam > 0.5 else 1]
 if part == 'white': return '#e8e6dc' if lam > 0.4 else '#bdbab0'
 if part == 'rim': return RIM[5 if lam > 0.55 else 3]
 if part == 'steel': return RIM[3 if lam > 0.5 else 2]
 if part == 'hubdark': return RIM[1]
 if part == 'spoke': return RAMPS['ash7'][4 if lam > 0.5 else 2]
 if part == 'felloe': return RAMPS['ash7'][3 if lam > 0.5 else 1]
 if part == 'lamp': return LAMP[3 if lam > 0.5 else 2]
 if part == 'tail': return TAIL[3 if lam > 0.5 else 2]
 if part == 'plate': return '#d9d4c0'
 if part == 'grille': return GRILLE[1]
 if part == 'under': return UNDER
 return '#ff00ff'


def rim(im, ramp):
 """The body's own dark round the silhouette, lighter over the lit shoulder."""
 p = im.load()
 W, H = im.size
 solid = lambda x, y: 0 <= x < W and 0 <= y < H and p[x, y][3]
 edge = []
 for y in range(H):
  for x in range(W):
   if solid(x, y): continue
   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
    if solid(x + dx, y + dy):
     edge.append((x, y, dx, dy)); break
 dark = tuple(int(ramp[0][i:i + 2], 16) for i in (1, 3, 5))
 for x, y, dx, dy in edge:
  p[x, y] = dark + (255,)


# Dimensions from the real vehicles, rounded; profiles are control points of
# the deck line, front to rear, in metres.
BASE = dict(clear=0.2, nose=0.35, tail=0.35, roll=0.14, tuck=0.12, inset=0.07,
            tyre_w=0.2, wheel_in=0.06, bumper_z=(0.3, 0.44), hub='hubcap', lamp='round')

MODELS = {
 # A Ford Model T-like touring car: upright, black, spoked wheels, separate
 # fenders and running boards, a folding top.
 'tourer-1915': dict(BASE, L=3.4, W=1.68, H=2.0, belt=1.12, r=0.4, tyre_w=0.1,
   wheels=(0.72, 2.8), profile=[(0, 0.95), (0.1, 1.2), (1.05, 1.24), (1.15, 1.12), (3.4, 1.12)],
   cabin=(1.2, 1.3, 3.05, 3.35), tuck=0.0, inset=0.04, clear=0.52, nose=0.1, tail=0.2,
   hood_w=0.34, fender_w=0.2, running_board=True, board_z=0.38, hub='spoke', bumper='none',
   grille_w=0.3, grille_z=(0.5, 1.18), lamp_z=0.95, lamp_in=-0.1, pillars=[(1.2, 1.3), (2.05, 2.15), (2.95, 3.35)],
   seams=(2.1,), paints=('black', 'black', 'green'), era=(1910, 1932),
   label='Touring car', about='Tall and upright on wooden spoked wheels, its engine under a narrow bonnet. A car for everyone, if everyone could crank it.'),
 # A 1930s sedan: tall grille, separate fenders, running boards, wire wheels.
 'sedan-1935': dict(BASE, L=4.5, W=1.75, H=1.72, belt=1.08, r=0.36, tyre_w=0.16,
   wheels=(0.95, 3.75), profile=[(0, 0.95), (0.15, 1.12), (1.5, 1.14), (1.6, 1.08), (3.9, 1.05), (4.5, 0.8)],
   cabin=(1.6, 1.85, 3.35, 4.1), tuck=0.08, clear=0.5, nose=0.25, tail=0.55,
   hood_w=0.46, fender_w=0.2, running_board=True, hub='wire', grille_w=0.3, grille_z=(0.5, 1.05), lamp_z=0.95, lamp_in=0.02,
   seams=(2.6, 3.4), paints=('black', 'maroon', 'navy', 'brown'), era=(1932, 1950),
   label='Sedan', about='A closed car with a tall grille and wire wheels, its fenders still separate from the body.'),
 # A late-forties fastback: pontoon body, fenders flowing into the doors.
 'fastback-1948': dict(BASE, L=5.0, W=1.9, H=1.58, belt=0.98, r=0.36, wheels=(1.1, 4.0),
   profile=[(0, 0.72), (0.2, 0.9), (1.7, 0.98), (1.8, 0.98), (4.2, 0.9), (5.0, 0.6)],
   cabin=(1.8, 2.15, 3.0, 4.6), hub='whitewall', nose=0.5, tail=0.8, trim_z=0.62,
   grille_w=0.55, grille_z=(0.46, 0.66), lamp_z=0.72, seams=(2.4, 3.3),
   paints=('green', 'maroon', 'beige', 'navy'), era=(1946, 1956),
   label='Fastback sedan', about='A rounded postwar sedan, its roof sloping all the way down to the bumper.'),
 # The American car of 1957: long, low, two-tone, finned and chromed.
 'hardtop-1957': dict(BASE, L=5.1, W=1.95, H=1.44, belt=0.92, r=0.36, wheels=(1.05, 4.0),
   profile=[(0, 0.78), (0.15, 0.88), (1.8, 0.9), (4.4, 0.9), (5.1, 0.82)],
   cabin=(1.85, 2.2, 3.1, 3.9), tuck=0.14, hub='whitewall', nose=0.2, tail=0.2,
   fin=(1.2, 0.14), trim_z=0.66, grille_w=0.7, grille_z=(0.46, 0.7), lamp='twin', lamp_z=0.74, lamp_in=0.12,
   bumper_z=(0.28, 0.46), seams=(2.45, 3.4), top_paint='white',
   paints=('turquoise', 'pink', 'red', 'mint', 'sky'), era=(1955, 1964),
   label='Hardtop', about='Two-tone paint, whitewall tyres and tail fins: a car built to be looked at.'),
 # A 1960s-70s full-size sedan: long, flat and square.
 'sedan-1968': dict(BASE, L=5.4, W=2.0, H=1.4, belt=0.9, r=0.36, wheels=(1.2, 4.2),
   profile=[(0, 0.82), (0.1, 0.86), (2.0, 0.88), (4.8, 0.88), (5.4, 0.84)],
   cabin=(2.0, 2.4, 3.4, 4.0), tuck=0.14, nose=0.15, tail=0.15, hub='hubcap',
   grille_w=0.8, grille_z=(0.46, 0.76), lamp='twin', lamp_z=0.68, lamp_in=0.12, bumper_z=(0.3, 0.45),
   trim_z=0.6, seams=(2.6, 3.6), top_paint='black',
   paints=('gold', 'green', 'blue', 'maroon', 'white', 'brown'), era=(1962, 1980),
   label='Sedan', about='A full-size sedan, flat of flank and roof, with a vinyl top and room for six.'),
 # A 1980s boxy compact.
 'compact-1985': dict(BASE, L=4.4, W=1.7, H=1.4, belt=0.9, r=0.31, wheels=(0.95, 3.45),
   profile=[(0, 0.7), (0.1, 0.78), (1.4, 0.84), (3.9, 0.86), (4.4, 0.84)],
   cabin=(1.45, 1.95, 3.0, 3.75), tuck=0.12, nose=0.18, tail=0.12, hub='steel',
   bumper='black', grille_w=0.45, grille_z=(0.5, 0.7), lamp='rect', lamp_z=0.62, lamp_in=0.2,
   seams=(2.05, 3.0), paints=('silver', 'red', 'navy', 'beige', 'white'), era=(1978, 1998),
   label='Compact sedan', about='A square little sedan with black plastic bumpers.'),
 # A 1990s-2000s rounded sedan.
 'sedan-2005': dict(BASE, L=4.8, W=1.8, H=1.46, belt=0.98, r=0.33, wheels=(0.98, 3.75),
   profile=[(0, 0.6), (0.2, 0.78), (1.3, 0.9), (4.2, 0.98), (4.8, 0.9)],
   cabin=(1.35, 2.05, 3.1, 4.1), tuck=0.16, nose=0.55, tail=0.45, hub='alloy',
   bumper='none', grille_w=0.4, grille_z=(0.52, 0.66), lamp='rect', lamp_z=0.7, lamp_in=0.24,
   seams=(2.2, 3.1), paints=('silver', 'grey', 'white', 'blue', 'black', 'red'), era=(1995, 2030),
   label='Sedan', about='A rounded modern sedan in the colour most of them come in.'),
 # A 2000s-2010s SUV.
 'suv-2010': dict(BASE, L=4.9, W=1.95, H=1.82, belt=1.2, r=0.4, clear=0.28, wheels=(1.0, 3.95),
   profile=[(0, 0.85), (0.2, 1.05), (1.2, 1.15), (4.8, 1.2), (4.9, 1.1)],
   cabin=(1.25, 1.95, 4.6, 4.85), tuck=0.1, nose=0.35, tail=0.18, hub='alloy',
   bumper='black', grille_w=0.5, grille_z=(0.7, 0.95), lamp='rect', lamp_z=0.98, lamp_in=0.25,
   seams=(2.3, 3.3), paints=('black', 'white', 'silver', 'navy', 'grey'), era=(1995, 2030),
   label='SUV', about='Tall, heavy and square-backed.'),
 # A pickup truck.
 'pickup-1975': dict(BASE, L=5.2, W=2.0, H=1.75, belt=1.12, r=0.38, clear=0.28, wheels=(1.1, 4.1),
   profile=[(0, 1.0), (0.1, 1.08), (1.8, 1.12), (5.2, 1.12)], bed=2.95, bed_floor=0.72,
   cabin=(1.8, 2.2, 2.75, 2.9), tuck=0.08, nose=0.15, tail=0.05, hub='steel',
   grille_w=0.8, grille_z=(0.55, 0.98), lamp='round', lamp_z=0.85, lamp_in=0.15, pillars=[(1.8, 2.05), (2.62, 2.9)],
   seams=(2.75,), paints=('olive', 'brown', 'white', 'sky', 'red'), era=(1955, 2030),
   label='Pickup truck', about='A truck with an open bed, dented along the tailgate.'),
 # Europe: a small beetle-backed people's car.
 'beetle': dict(BASE, L=4.05, W=1.55, H=1.5, belt=0.95, r=0.33, wheels=(0.72, 3.1),
   profile=[(0, 0.55), (0.25, 0.78), (0.9, 0.9), (1.2, 0.93), (3.3, 0.95), (4.05, 0.6)],
   cabin=(1.2, 1.6, 2.4, 3.9), tuck=0.18, nose=0.6, tail=0.7, pinch=0.4, hub='steel', lamp='round',
   lamp_in=0.14, lamp_z=0.72, grille_w=0.0, bumper_z=(0.28, 0.38), seams=(1.95,),
   paints=('beige', 'sky', 'red', 'green', 'yellow', 'white'), era=(1950, 2003),
   label='Beetle', about='A round little car with its engine in the back, air-cooled and loud about it.'),
 # Europe: a tiny city car of the fifties and sixties.
 'city-car': dict(BASE, L=3.0, W=1.32, H=1.32, belt=0.78, r=0.26, wheels=(0.58, 2.42),
   profile=[(0, 0.5), (0.2, 0.62), (0.7, 0.72), (2.5, 0.76), (3.0, 0.62)],
   cabin=(0.75, 1.1, 2.1, 2.85), tuck=0.14, nose=0.45, tail=0.55, pinch=0.45, hub='steel',
   lamp_in=0.12, lamp_z=0.56, grille_w=0.0, bumper_z=(0.22, 0.32), seams=(1.5,),
   paints=('cream', 'red', 'sky', 'mint', 'white'), era=(1955, 1985),
   label='City car', about='A tiny rear-engined car you could park sideways.'),
 # Europe: the corrugated two-horse car.
 'deux-chevaux': dict(BASE, L=3.85, W=1.48, H=1.6, belt=0.92, r=0.32, wheels=(0.72, 3.1),
   profile=[(0, 0.7), (0.15, 0.78), (1.1, 0.88), (1.25, 0.9), (3.5, 0.9), (3.85, 0.75)],
   cabin=(1.25, 1.55, 2.5, 3.7), tuck=0.1, nose=0.3, tail=0.5, clear=0.28,
   fender_w=0.12, hub='steel', lamp='round', lamp_in=0.0, lamp_z=0.88, grille_w=0.3, grille_z=(0.45, 0.72),
   bumper_z=(0.3, 0.38), seams=(2.0, 2.7), top_paint='grey',
   paints=('grey', 'beige', 'yellow', 'maroon'), era=(1950, 1990),
   label='Two-horse car', about='A light car of corrugated steel and canvas, soft on its springs.'),
 # Britain: the small two-box saloon.
 'mini': dict(BASE, L=3.05, W=1.4, H=1.35, belt=0.84, r=0.24, wheels=(0.4, 2.45),
   profile=[(0, 0.62), (0.1, 0.72), (0.8, 0.78), (2.9, 0.8), (3.05, 0.7)],
   cabin=(0.85, 1.15, 2.6, 2.95), tuck=0.12, nose=0.15, tail=0.12, hub='steel', top_paint='white',
   lamp_in=0.12, lamp_z=0.64, grille_w=0.3, grille_z=(0.38, 0.62), bumper_z=(0.24, 0.32), seams=(1.6,),
   paints=('red', 'green', 'sky', 'cream', 'black'), era=(1959, 2000),
   label='Mini', about='A box with a wheel at each corner and more room inside than it has any right to.'),
 # Britain: the London taxi.
 'cab-uk': dict(BASE, L=4.6, W=1.75, H=1.78, belt=1.02, r=0.33, wheels=(0.95, 3.8),
   profile=[(0, 0.85), (0.15, 0.98), (1.3, 1.0), (3.9, 1.0), (4.6, 0.85)],
   cabin=(1.35, 1.65, 3.9, 4.35), tuck=0.08, nose=0.3, tail=0.45, hub='steel',
   lamp_in=0.1, lamp_z=0.85, grille_w=0.3, grille_z=(0.5, 0.92), seams=(1.9, 3.2),
   paints=('black', 'black', 'maroon'), era=(1958, 1998),
   label='Taxi', about='A tall black cab, built to turn in the width of a street.'),
 # The Soviet sedan.
 'volga': dict(BASE, L=4.8, W=1.8, H=1.6, belt=0.98, r=0.36, wheels=(1.05, 3.75),
   profile=[(0, 0.8), (0.15, 0.92), (1.6, 0.96), (4.2, 0.92), (4.8, 0.78)],
   cabin=(1.7, 2.05, 3.0, 4.1), tuck=0.12, nose=0.4, tail=0.6, hub='whitewall', trim_z=0.66,
   grille_w=0.55, grille_z=(0.46, 0.75), lamp_z=0.78, seams=(2.35, 3.25),
   paints=('black', 'cream', 'mint', 'grey'), era=(1956, 1985),
   label='Sedan', about='A heavy, rounded sedan of the kind that came with a driver.'),
 # The square Soviet and Eastern-bloc family car.
 'lada': dict(BASE, L=4.1, W=1.61, H=1.44, belt=0.92, r=0.3, wheels=(0.85, 3.25),
   profile=[(0, 0.72), (0.1, 0.8), (1.3, 0.84), (3.6, 0.88), (4.1, 0.84)],
   cabin=(1.35, 1.8, 2.75, 3.45), tuck=0.12, nose=0.12, tail=0.1, hub='steel',
   grille_w=0.55, grille_z=(0.5, 0.72), lamp='twin', lamp_z=0.64, lamp_in=0.1, seams=(1.95, 2.8),
   paints=('white', 'beige', 'orange', 'sky', 'green', 'red'), era=(1970, 2012),
   label='Sedan', about='A square, stubborn little sedan that could be mended with a hammer.'),
 # India: the upright Ambassador-type sedan.
 'ambassador': dict(BASE, L=4.33, W=1.66, H=1.6, belt=1.0, r=0.34, wheels=(0.95, 3.5),
   profile=[(0, 0.82), (0.2, 0.95), (1.4, 0.98), (3.9, 0.95), (4.33, 0.8)],
   cabin=(1.45, 1.8, 2.8, 3.8), tuck=0.1, nose=0.45, tail=0.5, hub='hubcap',
   grille_w=0.5, grille_z=(0.46, 0.8), lamp_z=0.82, lamp_in=0.1, seams=(2.1, 2.95),
   paints=('white', 'white', 'black', 'cream'), era=(1958, 2014),
   label='Sedan', about='A tall, round-shouldered sedan, white, with a curtain in the back window.'),
 # Japan: a boxy kei car.
 'kei': dict(BASE, L=3.39, W=1.47, H=1.6, belt=0.95, r=0.27, wheels=(0.55, 2.8),
   profile=[(0, 0.7), (0.2, 0.82), (0.55, 0.88), (3.3, 0.92), (3.39, 0.85)],
   cabin=(0.6, 1.05, 3.1, 3.35), tuck=0.08, nose=0.25, tail=0.08, hub='steel',
   bumper='black', lamp='rect', lamp_z=0.74, lamp_in=0.14, grille_w=0.2, grille_z=(0.55, 0.7),
   seams=(1.6, 2.5), paints=('white', 'silver', 'mint', 'cream', 'blue'), era=(1975, 2030),
   label='Kei car', about='A tall, narrow box of a car, exactly as big as the rules allow.'),
 # A minibus / van.
 'van': dict(BASE, L=4.5, W=1.75, H=1.95, belt=1.08, r=0.33, wheels=(0.7, 3.4),
   profile=[(0, 0.95), (0.15, 1.02), (0.4, 1.06), (4.5, 1.06)],
   cabin=(0.4, 0.75, 4.35, 4.5), tuck=0.05, nose=0.35, tail=0.1, hub='steel', top_paint='white',
   stripe=0.72, lamp_z=0.8, lamp_in=0.12, grille_w=0.3, grille_z=(0.55, 0.78),
   pillars=[(0.4, 0.62), (1.4, 1.5), (2.4, 2.5), (3.4, 3.5), (4.3, 4.5)], seams=(1.45,),
   paints=('sky', 'orange', 'green', 'red', 'cream'), era=(1955, 1990),
   label='Minibus', about='A van with windows all down its side and its engine under the floor.'),
}


def vehicle_sprites():
 """Every model in every paint and heading, keyed for the atlas."""
 out = {}
 for model, spec in MODELS.items():
  for i, paint in enumerate(spec['paints']):
   for heading in 'ewsn':
    out[f'vehicle-{model}-{i}-{heading}'] = render(spec, paint, heading)
 return out


def vehicle_shadows(sprites, phases):
 """A car's shadow is mostly its own footprint, nudged by the sun: casting
 every pixel of a three-quarter view by its height would throw the roof's
 plan across the street. One shadow per model and heading, whatever the
 paint, keyed as the runtime asks for the first paint's."""
 from PIL import ImageDraw
 out = {}
 for key, im in sprites.items():
  model, paint, heading = key[8:].rsplit('-', 2)
  if paint != '0': continue
  spec = MODELS[model]
  side = heading in 'ew'
  w = (spec['L'] if side else spec['W']) * PX
  deep = (spec['W'] if side else spec['L']) * PX * DEPTH
  ax, ay = im.info['anchor']
  lift = spec['H'] * PX * 0.35
  for phase in phases:
   vx, vy = phase['cast']
   alpha = round(255 * phase['opacity'])
   dx, dy = round(vx * lift * 0.5), round(vy * lift * 0.5)
   pad = 4 + int(abs(dx)) + int(abs(dy))
   s = Image.new('RGBA', (int(w) + pad * 2 + 4, int(deep) + pad * 2 + 4))
   d = ImageDraw.Draw(s)
   x0, y1 = pad + 2, pad + 2 + int(deep)
   if alpha:
    d.rectangle((x0 + dx, y1 - int(deep) + dy, x0 + int(w) + dx, y1 + dy), fill=(28, 35, 42, alpha))
   # Under the car it is dark whatever the sun is doing.
   d.rectangle((x0 + 1, y1 - int(deep) + 2, x0 + int(w) - 1, y1 + 1), fill=(24, 28, 32, 110))
   s.info['anchor'] = [x0 + (ax - 2), y1 + 1]
   out[f"{phase['id']}:vehicle-{model}-0-{heading}"] = s
 return out


def vehicle_catalog():
 """What the game needs to know about each model: its words and dates, how
 many paints it comes in, and the ground it covers in cells for each axis."""
 return {
  model: {
   'label': spec['label'], 'about': spec['about'], 'era': list(spec['era']),
   'paints': len(spec['paints']),
   # Along an east-west street it covers its length at full prop scale; along
   # a north-south one its length at ground depth.
   'cells': {'x': round(spec['L'] * PX / 16, 2), 'y': round(spec['L'] * PX * DEPTH / 16, 2)},
  }
  for model, spec in MODELS.items()
 }
