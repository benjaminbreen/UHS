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

FRONT_WIDTH = 1.18
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
  if s.on_pod(x, d) and s.roof(x) is not None: zs.append(s.H + s.pod[2])
  return max(zs) if zs else None

 def on_pod(s, x, d):
  """Inside the plan of the sensor housing on the roof."""
  return bool(s.get('pod')) and hypot(x - s.pod[0], d) <= s.pod[1]

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
  if z > s.H and s.on_pod(x, d): return 'sensor'
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
    if lamp == 'bar' and abs(z - lz) < 0.03 and d < s.half(x) - 0.06: return 'lamp'
    if lamp == 'twin' and (hypot(d - lx, z - lz) < 0.07 or hypot(d - lx + 0.17, z - lz) < 0.07): return 'lamp'
    if d < gw and gz[0] <= z <= gz[1]:
     return 'grille' if int(z * 60) % 2 or d > gw - 0.03 else 'chrome'
   if x > L - 0.07:
    tl = s.get('tail_z', s.profile[-1][1] - 0.1)
    if (d < s.half(x) - 0.06 if s.get('tail_bar') else d > s.half(x) - 0.2) and abs(z - tl) < (0.03 if s.get('tail_bar') else 0.06): return 'tail'
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
   # A body with no windows but the dark sensor panel where a windscreen would be.
   if s.get('blind'): return 'glass' if not side and x < c1 and z > s.belt + 0.15 else 'paint' if side else 'roof'
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


TURNED = {'ne': 1, 'se': 3, 'sw': 5, 'nw': 7}


def render(spec, paint, heading):
 """Paint the car facing `heading` onto its own canvas: e, w, s or n square
 on, or one of the diagonals in TURNED, which stands on the centre of its
 plan rather than at a kerb."""
 from math import sin, cos
 car = Car(spec, paint)
 Lp, Wp = int(round(car.L * PX)), int(round(car.W * PX))
 Hp = int(round((car.H + max((car.get('fin') or (0, 0))[1], (car.get('pod') or (0, 0, 0))[2], 0) + 0.1) * PX))
 turned = heading in TURNED
 if turned:
  t = TURNED[heading] * pi / 4
  fe, fs = sin(t), -cos(t)                    # the way it faces: east, south
  re, rs = fs, -fe                            # the model's y axis
  lat = 1 + (FRONT_WIDTH - 1) * abs(fs)
  across = int(round(abs(fe) * Lp + abs(re) * Wp * lat))
  depth = int(round(abs(fs) * Lp + abs(rs) * Wp * lat))
 else:
  # The model's x runs from the nose back, so a car facing east has it at the right.
  heading = {'e': 'w', 'w': 'e'}.get(heading, heading)
  side = heading in 'ew'
  across = Lp if side else round(Wp * FRONT_WIDTH)                 # screen width
  depth = Wp if side else Lp                  # ground depth
 W = across + 4
 H = Hp + int(depth * DEPTH) + 4
 ground = H - 2
 px = {}
 # Model axes to world axes for the light: east, south (toward us), up.
 def world(dx, dd):
  if turned: return (-dx * fe + dd * re, -dx * fs + dd * rs)
  return {'e': (dx, dd), 'w': (-dx, -dd), 's': (dd, dx), 'n': (-dd, -dx)}[heading]
 # Far to near.
 for k in range(depth * 2):
  g = k / 2                                  # ground px from the far edge
  near = depth - g
  for a in range(across):
   # (x, y) in model metres: y from the left side of the car.
   if turned:
    E, S = a + .5 - across / 2, g + .5 - depth / 2
    x, y = (Lp / 2 - (E * fe + S * fs)) / PX, (Wp / 2 + (E * re + S * rs) / lat) / PX
    if not (0 <= x <= car.L and 0 <= y <= car.W): continue
   elif heading == 'e': x, y = (a + .5) / PX, (g + .5) / PX
   elif heading == 'w': x, y = (Lp - a - .5) / PX, (Wp - g - .5) / PX
   elif heading == 's': x, y = (Lp - g - .5) / PX, (Wp - (a + .5) * Wp / across) / PX
   else: x, y = (g + .5) / PX, (a + .5) * Wp / across / PX
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
 im.info['anchor'] = [W // 2, ground - int(depth * DEPTH / 2)] if turned else [W // 2 - 8, ground + 1]
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
 if part == 'sensor': return GLASS[3] if top else TYRE[4 if lam > 0.5 else 2]
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
   seams=(2.2, 3.1), paints=('silver', 'grey', 'white', 'blue', 'black', 'red'), era=(1995, 2040),
   label='Sedan', about='A rounded modern sedan in the colour most of them come in.'),
 # A 2000s-2010s SUV.
 'suv-2010': dict(BASE, L=4.9, W=1.95, H=1.82, belt=1.2, r=0.4, clear=0.28, wheels=(1.0, 3.95),
   profile=[(0, 0.85), (0.2, 1.05), (1.2, 1.15), (4.8, 1.2), (4.9, 1.1)],
   cabin=(1.25, 1.95, 4.6, 4.85), tuck=0.1, nose=0.35, tail=0.18, hub='alloy',
   bumper='black', grille_w=0.5, grille_z=(0.7, 0.95), lamp='rect', lamp_z=0.98, lamp_in=0.25,
   seams=(2.3, 3.3), paints=('black', 'white', 'silver', 'navy', 'grey'), era=(1995, 2042),
   label='SUV', about='Tall, heavy and square-backed.'),
 # A pickup truck.
 'pickup-1975': dict(BASE, L=5.2, W=2.0, H=1.75, belt=1.12, r=0.38, clear=0.28, wheels=(1.1, 4.1),
   profile=[(0, 1.0), (0.1, 1.08), (1.8, 1.12), (5.2, 1.12)], bed=2.95, bed_floor=0.72,
   cabin=(1.8, 2.2, 2.75, 2.9), tuck=0.08, nose=0.15, tail=0.05, hub='steel',
   grille_w=0.8, grille_z=(0.55, 0.98), lamp='round', lamp_z=0.85, lamp_in=0.15, pillars=[(1.8, 2.05), (2.62, 2.9)],
   seams=(2.75,), paints=('olive', 'brown', 'white', 'sky', 'red'), era=(1955, 2045),
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
   seams=(1.6, 2.5), paints=('white', 'silver', 'mint', 'cream', 'blue'), era=(1975, 2045),
   label='Kei car', about='A tall, narrow box of a car, exactly as big as the rules allow.'),
 # A minibus / van.
 'van': dict(BASE, L=4.5, W=1.75, H=1.95, belt=1.08, r=0.33, wheels=(0.7, 3.4),
   profile=[(0, 0.95), (0.15, 1.02), (0.4, 1.06), (4.5, 1.06)],
   cabin=(0.4, 0.75, 4.35, 4.5), tuck=0.05, nose=0.35, tail=0.1, hub='steel', top_paint='white',
   stripe=0.72, lamp_z=0.8, lamp_in=0.12, grille_w=0.3, grille_z=(0.55, 0.78),
   pillars=[(0.4, 0.62), (1.4, 1.5), (2.4, 2.5), (3.4, 3.5), (4.3, 4.5)], seams=(1.45,),
   paints=('sky', 'orange', 'green', 'red', 'cream'), era=(1955, 1990),
   label='Minibus', about='A van with windows all down its side and its engine under the floor.'),
 # Dates past 2026 on the four below are projection.
 # An electric crossover of the 2020s: no grille, a lamp bar across the nose.
 'ev-2030': dict(BASE, L=4.6, W=1.88, H=1.6, belt=0.95, r=0.36, clear=0.18, wheels=(0.95, 3.85),
   profile=[(0, 0.62), (0.25, 0.8), (1.25, 0.92), (4.3, 1.0), (4.6, 0.9)],
   cabin=(1.25, 2.05, 3.3, 4.45), tuck=0.16, nose=0.6, tail=0.45, hub='alloy',
   bumper='none', grille_w=0.0, lamp='bar', lamp_z=0.74, lamp_in=0.0, tail_bar=True, seams=(2.3, 3.3),
   paints=('white', 'silver', 'grey', 'black', 'teal', 'blue'), era=(2018, 2060),
   label='Electric car', about='A smooth car with no grille, since there is no engine to cool. It pulls away without a sound.'),
 # A small Chinese electric runabout, charged from a plug at home.
 'ev-mini': dict(BASE, L=2.95, W=1.5, H=1.62, belt=0.92, r=0.27, wheels=(0.5, 2.45),
   profile=[(0, 0.66), (0.15, 0.78), (0.5, 0.84), (2.85, 0.88), (2.95, 0.82)],
   cabin=(0.55, 0.95, 2.7, 2.9), tuck=0.08, nose=0.25, tail=0.1, hub='alloy', top_paint='white',
   bumper='black', grille_w=0.0, lamp='rect', lamp_z=0.72, lamp_in=0.14, seams=(1.55,),
   paints=('mint', 'pink', 'sky', 'white', 'yellow'), era=(2020, 2060),
   label='Mini electric car', about='A small square electric car in a sweet-shop colour, charged overnight from a plug.'),
 # A driverless taxi: a tall glassy pod with a sensor drum on its roof.
 'robotaxi': dict(BASE, L=4.5, W=1.92, H=1.74, belt=0.95, r=0.36, clear=0.2, wheels=(0.85, 3.65),
   profile=[(0, 0.7), (0.3, 0.9), (0.7, 0.95), (3.9, 0.98), (4.5, 0.86)],
   cabin=(0.75, 1.35, 3.6, 4.3), tuck=0.12, nose=0.55, tail=0.5, hub='alloy', pod=(2.5, 0.2, 0.18),
   bumper='none', grille_w=0.0, lamp='bar', lamp_z=0.8, lamp_in=0.0, tail_bar=True, seams=(2.3,),
   paints=('white', 'white', 'sky'), era=(2028, 2060),
   label='Robotaxi', about='A taxi with nobody at the wheel and a sensor drum turning on its roof. You pay with your phone.'),
 # A driverless parcel van the size of a shed, its side all locker doors.
 'delivery-pod': dict(BASE, L=2.7, W=1.12, H=1.7, belt=0.9, r=0.25, clear=0.16, wheels=(0.45, 2.25),
   profile=[(0, 0.8), (0.1, 0.88), (2.7, 0.9)], cabin=(0.12, 0.45, 2.6, 2.7), tuck=0.03, inset=0.03,
   nose=0.25, tail=0.1, pinch=0.4, hub='steel', blind=True, pod=(0.5, 0.12, 0.12),
   bumper='black', grille_w=0.0, lamp='bar', lamp_z=0.7, lamp_in=0.0, tail_bar=True, seams=(1.0, 1.55, 2.1),
   top_paint='white', paints=('white', 'orange', 'sky'), era=(2022, 2060),
   label='Delivery pod', about='A driverless van full of parcel lockers. It pulls up, flashes, and waits for someone to type in a code.'),
}


def delivery_lorry(late, long_body, paint):
 """Broadside at a loading door, at the parked cars' 17 pixels per metre."""
 from PIL import ImageDraw
 cab = PAINT[paint]
 start = 31 if late else 43
 end = start + (65 if long_body else 51)
 im = Image.new('RGBA', (end + 8, 65))
 d = ImageDraw.Draw(im)
 rect, poly, line = d.rectangle, d.polygon, d.line
 iron, buff = '#303638', '#d3b580'
 floor = 51
 d.ellipse((3,47,end+6,61), fill=(38,34,36,65))
 d.ellipse((9,51,end,58), fill=(36,33,34,115))
 rect((7,42,end,49),fill='#373d3a',outline='#232829')
 rect((33,48,start+13,53),fill='#595650',outline=iron)
 for x in (16,end-14):
  d.ellipse((x-9,floor-8,x+8,floor+8),fill='#28292b',outline='#26252a')
  d.arc((x-8,43,x+7,57),175,308,fill='#55504a',width=2)
  d.ellipse((x-5,46,x+4,55),fill=cab[2],outline='#181f21')
  d.ellipse((x-3,47,x+2,52),fill='#948d76',outline='#5e6056')
  d.point((x-2,48),fill='#c5bb9d')
 # The high side panel and the crown of its roof occupy different planes.
 side = '#a18258' if not late else '#a8b1ab'
 top = '#d4bd90' if not late else '#d4dad0'
 edge = '#6a5945' if not late else '#606b6b'
 poly([(start,13),(start+4,5),(end+2,5),(end+4,9),(end,14)],fill=top,outline=edge)
 rect((start,13,end,42),fill=side,outline=edge)
 poly([(end,14),(end+4,9),(end+4,37),(end,43)],fill=edge,outline='#545751')
 line((start+2,14,end-1,14),fill='#ead9af' if not late else '#e6e9d9')
 if late:
  for y in range(17,40,3):
   line((start+2,y,end-2,y),fill='#879692')
   line((start+2,y+1,end-2,y+1),fill='#c5cbc0')
  rect((start+9,21,start+28,32), fill='#e0dfc7',outline='#7d8c84')
  rect((start+11,24,start+15,29),fill=cab[3])
  for y,l in ((24,8),(27,6),(29,9)):line((start+17,y,start+17+l,y),fill='#64716a')
 else:
  for x in range(start+3,end-5,12):
   poly([(x,15),(x+2,15),(x+4,29),(x+2,34)],fill='#a8885c')
   poly([(x+3,35),(x+10,28),(x+7,35),(x+6,38)],fill='#94764f')
   line((x+5,34,x+8,30),fill='#b99a68')
  for x in range(start+3,end,12):
   line((x,14,x+1,28,x,39),fill='#b99b6e')
   line((x+1,37,x+3,34),fill='#8c714e')
   line((x+2,7,x,11),fill='#b99f75')
  rect((start+1,38,end-1,42),fill='#836444')
  for x in range(start+4,end,8):
   line((x,38,x-1,41),fill=buff)
 line((start,43,end,43),fill=cab[1],width=3)
 line((start+1,42,end,42),fill=cab[4])
 rect((end+2,40,end+4,43),fill='#923d2b')
 if late:
  poly([(3,35),(6,18),(12,13),(26,13),(31,17),(31,45),(5,46)],fill=cab[3],outline=cab[0])
  poly([(5,19),(12,12),(27,12),(30,15),(11,17)],fill=cab[5],outline=cab[2])
  poly([(5,31),(8,20),(13,18),(11,31)],fill=GLASS[4],outline=GLASS[1])
  poly([(14,19),(27,18),(27,29),(13,30)],fill=GLASS[3],outline=GLASS[1])
  line((17,21,23,20,18,25),fill=GLASS[5],width=2)
  line((13,32,27,31,27,43),fill=cab[1])
  rect((3,36,9,41),fill='#4a5153')
  for y in (37,39):line((3,y,8,y),fill='#98a29a')
  rect((3,33,7,35),fill=LAMP[2],outline='#847e67')
  line((5,44,1,44,1,47,9,47),fill='#9ca59c',width=2)
  rect((18,32,26,33),fill=cab[5])
 else:
  poly([(19,31),(22,19),(27,15),(39,15),(42,20),(42,43),(21,45)],fill=cab[3],outline=cab[0])
  poly([(20,20),(24,13),(38,12),(42,16),(39,18),(24,18)],fill=cab[5],outline=cab[1])
  line((24,14,37,13),fill=cab[6])
  poly([(21,28),(23,20),(26,19),(25,28)],fill=GLASS[5],outline=GLASS[2])
  rect((28,19,37,28),fill=GLASS[2],outline=cab[0])
  poly([(29,20),(36,20),(30,25),(29,25)],fill=GLASS[5])
  line((26,30,38,30,38,42,27,42,26,30),fill=cab[1])
  d.arc((28,33,36,39),180,340,fill='#cdbc8b')
  line((30,37,33,37),fill='#b2976f')
  poly([(3,38),(6,31),(20,28),(25,32),(25,42),(4,44)],fill=cab[3],outline=cab[1])
  poly([(6,32),(12,29),(20,28),(24,31),(11,34)],fill=cab[5])
  for x in (14,17,20):line((x,35,x-1,39),fill=cab[1])
  rect((3,35,7,43),fill='#b4a886',outline='#505451')
  for x in (4,6):line((x,36,x,41),fill='#676657')
  d.ellipse((4,32,9,37),fill=LAMP[2],outline='#7c7359')
  line((1,46,7,47),fill='#b1ab95',width=2)
  line((25,46,40,46),fill='#727b6a',width=3)
 line((19 if late else 34,32,22 if late else 37,32),fill='#c5c0a8')
 for x in (16,end-14):
  d.arc((x-10,40,x+10,61),184,352,fill=cab[1],width=3)
  d.arc((x-10,40,x+10,61),198,282,fill=cab[4],width=2)
 for x in (16,end-14):
  for dx,dy in ((-3,1),(1,3),(2,-1)):d.point((x+dx,floor+dy),fill='#ab9b7d')
  line((x+4,49,x+5,51),fill='#383a37')
 line((start+4,49,start+9,51,start+16,50),fill='#656459')
 line((6,30,3,27,3,25) if late else (24,29,22,24,20,24),fill=iron)
 im.info['anchor']=[(end+4)//2,55]
 return im


def delivery_headings(late, long_body, paint):
 """Project the painted sides, with a separate radiator, tailboard and roof."""
 from math import sin, cos
 from PIL import ImageDraw, ImageOps
 broad = delivery_lorry(late, long_body, paint)
 box = 31 if late else 43
 end = box + (65 if long_body else 51)
 cab = PAINT[paint]
 frames = []
 for facing in range(8):
  if facing in (2, 6):
   frame = broad if facing == 6 else ImageOps.mirror(broad)
   ax, ay = broad.info['anchor']
   frame.info['anchor'] = [ax if facing == 6 else frame.width-1-ax, ay]
   frames.append(frame)
   continue
  theta = facing*pi/4
  sx, sy = -sin(theta), cos(theta)
  im = Image.new('RGBA', (150, 138))
  d = ImageDraw.Draw(im)
  def at(u,v,z):
   return (round(75+(u-end/2)*sx+v*sy),round(89+((u-end/2)*sy-v*sx)*.54-z))
  def panel(points,fill,edge=None):
   d.polygon([at(*p) for p in points], fill=fill, outline=edge)
  def stroke(points,colour,width=1):
   d.line([at(*p) for p in points],fill=colour,width=width)
  def side_texture(x0,x1,side):
   # Side art's axle is at row 51 and the tyre rests at 59.
   a,b,c=at(x0,side,59),at(x1,side,59),at(x0,side,0)
   dx=b[0]-a[0]
   if not dx:return
   scale=(x1-x0)/dx
   slope=(b[1]-a[1])/dx
   tex=broad.crop((x0,0,x1,60))
   # The horizontal sprite includes its own roof. Only project the side below its eave.
   tex.paste((0,0,0,0),(0,0,tex.width,13 if x0>=box else 18 if x0>=20 or late else 29))
   alpha=tex.getchannel('A').point(lambda a:255 if a==255 else 0)
   tex.putalpha(alpha)
   mapped=tex.transform(im.size,Image.Transform.AFFINE,
     (scale,0,-a[0]*scale,-slope,1,a[0]*slope-a[1]),Image.Resampling.NEAREST)
   im.alpha_composite(mapped)
  panel([(2,-14,0),(end,-14,0),(end+2,13,0),(4,16,0)],(32,31,36,70))
  near= -15 if sx>0 else 15
  # Paint each body back-to-front; the bonnet is lower than the cab.
  sections=[(3,box-1,41 if late else 27,'nose'),(box,end,46,'box')]
  if not late:sections[:1]=[(3,23,27,'nose'),(22,box-1,41,'cab')]
  for lo,hi,h,kind in sorted(sections,key=lambda s:(s[0]+s[1])*sy):
   isbox=kind=='box'
   w=15 if isbox else (10 if kind=='nose' and not late else 13)
   side=w if near>0 else -w
   side_texture(lo,hi,side)
   u=hi if sy>0 else lo
   face='#a78c62' if isbox and not late else '#98a6a2' if isbox else cab[3]
   def end_panel(v0,v1,z0,z1,colour,edge=None):
    panel([(u,v0,z0),(u,v1,z0),(u,v1,z1),(u,v0,z1)],colour,edge)
   end_panel(-w,w,14,h,face,'#444a46')
   if isbox:
    for v in (-w+2,w-2,0):
     stroke([(u,v,16),(u,v,h-1)],'#69675b' if late else '#7e674a')
    end_panel(-w,w,12,16,cab[1])
    if late:
     for v in (-8,8):
      stroke([(u,v,18),(u,v,h-3)],'#c6cbc1')
      end_panel(v-2,v+1,26,28,'#515c5d')
    else:
     for v in (-10,-5,4,10):
      stroke([(u,v,17),(u,v+2,23),(u,v,32)],'#c5a679')
    for v in (-w+2,w-2):end_panel(v-1,v+1,13,15,'#b55036')
   elif kind=='cab' or late:
    end_panel(-w+2,w-2,h-13,h-3,GLASS[3],cab[1])
    stroke([(u,-w+4,h-6),(u,-w+1,h-9)],GLASS[5],2)
    stroke([(u,0,h-12),(u,0,h-3)],cab[2])
   if kind=='nose':
    end_panel(-6,6,15,25,'#383f40','#c9bca1')
    for z in (17,20,23):stroke([(u,-5,z),(u,5,z)],'#8e9892')
    for v in (-w+2,w-2):end_panel(v-2,v+1,21,24,LAMP[2])
    end_panel(-w-1,w+1,12,14,'#b5b3a3')
   if abs(sx)<.001:
    for v in (-w+2,w-2):
     end_panel(v-2,v+2,1,12,'#333438')
     stroke([(u,v-1,2),(u,v-1,9)],'#57534d')
    end_panel(-w+3,w-3,8,13,'#363b38')
    end_panel(-4,3,11,14,'#c1b18a','#5b5951')
   roof=('#c9ae7b' if not late else '#c1cbc4') if isbox else cab[5]
   crown=2 if isbox and not late else 1
   for sign,colour in [(-1,roof),(1,('#dac298' if not late else '#d3d9d0') if isbox else cab[4])]:
    panel([(lo,sign*w,h),(hi,sign*w,h),(hi,0,h+crown),(lo,0,h+crown)],colour)
   stroke([(lo,-w,h),(hi,-w,h),(hi,w,h),(lo,w,h),(lo,-w,h)],'#817359' if isbox else cab[2])
   if isbox:
    for x in range(lo+5,hi-2,11 if not late else 19):
     stroke([(x,-w+1,h),(x,0,h+crown),(x,w-1,h)],'#baa177' if not late else '#a4b1ac')
     stroke([(x+1,1,h+crown),(x+1,w-2,h)],'#e3cba0' if not late else '#dce1d6')
    stroke([(lo+1,-w+1,h),(hi-1,-w+1,h)],'#e6d1a8' if not late else '#e3e7dc')
    if sy>0:
     if not late:
      for sign in [-1,1]:
       panel([(u,sign*w,h-1),(u,sign*3,h),(u,sign*(w-2),h-16)],'#c8ab78')
       stroke([(u,sign*(w-2),h-15),(u,sign*4,h-2)],'#8e744e')
      end_panel(-w+1,w-1,13,19,'#846a4d','#64523d')
      stroke([(u,-w+2,17),(u,w-2,17)],'#b49b74')
     for v in (-w+3,w-3):
      for z in (18,32): end_panel(v-2,v+2,z,z+1,'#61665e')
     end_panel(-w+1,w-1,10,12,'#777f79','#515951')
   else:
    stroke([(lo+1,-w+2,h),(hi-1,-w+2,h)],cab[6])
    if kind=='nose' and not late:
     stroke([(lo+1,0,h+1),(hi-2,0,h+1)],cab[6])
     for sign in (-1,1):
      end_panel(sign*(w-2)-2,sign*(w-2)+2,21,25,'#b4aa8a',cab[1])
      end_panel(sign*(w-2)-1,sign*(w-2)+1,22,24,LAMP[2])
    else:
     for v in (-w+4,w-4):
      stroke([(u,v,h-11),(u,v+3,h-8)],'#81999b')
     for sign in (-1,1):
      stroke([(lo+2,sign*w,h-12),(lo+2,sign*(w+3),h-8)],'#3d4545')
      stroke([(lo+2,sign*(w+3),h-8),(lo+2,sign*(w+3),h-5)],'#88968b',2)
  bounds=im.getbbox()
  frame=im.crop(bounds)
  frame.info['anchor']=[75-bounds[0],89-bounds[1]]
  frames.append(frame)
 return frames


def vehicle_sprites():
 """Every model in every paint and heading, keyed for the atlas."""
 out = {}
 for model, spec in MODELS.items():
  for i, paint in enumerate(spec['paints']):
   for heading in ('e', 'w', 's', 'n', *TURNED):
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
  if paint != '0' or heading in TURNED: continue
  spec = MODELS[model]
  side = heading in 'ew'
  w = (spec['L'] if side else spec['W'] * FRONT_WIDTH) * PX
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
   # Its width in cells, for a car that has left its stall.
   'wide': round(spec['W'] * PX / 16, 2),
  }
  for model, spec in MODELS.items()
 }
