"""The trees a tropical village keeps, drawn the way a pixel artist would:
a dark crown mass dressed in hand-shaped leaf marks that lighten toward the
sun, a few sparkles on the brightest, one dark outline round everything, and
fruit drawn large enough to read at a glance. The marks are designed by hand;
code only decides where they go."""
import math
import numpy as np
from PIL import Image

from art.voxel import hexrgb, h3
from art.voxel_trees import Tree, roots, bake, unit

np.seterr(over='ignore')

# Leaf marks: H is a step lighter than the mark's tone, M the tone, S a step darker.
LEAVES = [
    [".HH.",
     "HMMM",
     ".MMS",
     "..S."],
    ["HH..",
     "HMM.",
     ".MMS",
     "..SS"],
    [".HH",
     "HMM",
     "MMS",
     ".S."],
    ["..HH",
     ".HMM",
     "HMMS",
     ".SS."],
    ["H.",
     "MH",
     "MM",
     ".S"],
    [".HHH.",
     "HMMMM",
     "MMMMS",
     ".MSS.",
     "..S.."],
    ["HH...",
     "HMMH.",
     ".MMMM",
     ".SMMS",
     "...S."],
]


class Sprite:
    """A canvas of palette indices; the outline takes each material's own
    darkest colour."""

    def __init__(self, size, palette):
        self.W, self.H = size
        self.pal = palette
        self.idx = np.full((self.H, self.W), -1, np.int16)

    def put(self, x, y, k):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.W and 0 <= y < self.H:
            self.idx[y, x] = k

    def stamp(self, rows, x, y, tones):
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch in tones:
                    self.put(x + i, y + j, tones[ch])

    def image(self, outline):
        """`outline` maps a palette index to the index its edge is drawn in."""
        a = self.idx >= 0
        p = np.pad(self.idx, 1, constant_values=-1)
        out = self.idx.copy()
        for n in (p[2:, 1:-1], p[:-2, 1:-1], p[1:-1, 2:], p[1:-1, :-2]):
            sel = ~a & (n >= 0) & (out < 0)
            out[sel] = [outline.get(int(k), int(k)) for k in n[sel]]
        rgba = np.zeros((self.H, self.W, 4), np.uint8)
        for k, hx in enumerate(self.pal):
            rgba[out == k] = (*hexrgb(hx), 255)
        return Image.fromarray(rgba, 'RGBA')


MANGO_FRUIT = [
    "...s....",
    "..oGGo..",
    ".oYWGOo.",
    "oYWYYOOo",
    "oYYYOOOo",
    "oYOOOORo",
    "oOOOORRo",
    ".oOORRo.",
    "..oRRo..",
    "...oo...",
]

MANGO_PAL = [
    '#0a1f12', '#14341c', '#225224', '#367826', '#5aa02a', '#9cc92e', '#e6ee6c',
    '#24150e', '#3e2617', '#5e3b22', '#80552f', '#a6733f',
    '#5a240f', '#c8481c', '#ec8a28', '#f6c040', '#fff2a8', '#7fae36',
]
LEAF = list(range(7))
BARK = [7, 8, 9, 10, 11]


# Ramps whose colours are labels, so a baked tree says which light band each
# pixel fell in: green channel for leaf bands, blue for bark.
LEAF_IDS = ['#%02xff00' % (16 * k) for k in range(7)]
BARK_IDS = ['#%02x00ff' % (16 * k) for k in range(6)]


def bands(im):
    """Leaf band (1-5, 0 a seam between masses), bark band (0-5) and the
    silhouette of a tree baked with the label ramps, its outline stripped."""
    a = np.asarray(im.convert('RGBA')).astype(int)
    solid = a[..., 3] > 0
    leaf = solid & (a[..., 1] == 255)
    bark = solid & (a[..., 2] == 255)
    k = a[..., 0] // 16
    p = np.pad(solid, 1)
    rim = solid & ~(p[2:, 1:-1] & p[:-2, 1:-1] & p[1:-1, 2:] & p[1:-1, :-2])
    leaf &= ~(rim & (k <= 1))
    return np.where(leaf, k, -1), np.where(bark, k, -1)


def paintover(im, tones, bark, seed, spacing=3.4, sparkle=.4):
    """Redraw a baked tree as pixel art: its light bands become the base, then
    hand leaf marks toned by the band beneath each are laid dark to light, and
    the leaves at the rim break the outline."""
    L, B = bands(im)
    H, W = L.shape
    sp = Sprite((W, H), None)
    for y, x in zip(*np.nonzero(B >= 0)):
        sp.put(x, y, bark[min(4, B[y, x])])
    for y, x in zip(*np.nonzero(L >= 0)):
        sp.put(x, y, tones[max(1, min(5, L[y, x]))] if L[y, x] > 0 else tones[0])
    rng = np.random.default_rng(seed)
    # Marks keep a pixel clear of the seams so the masses stay apart.
    near_seam = np.zeros_like(L, bool)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            near_seam |= np.roll(np.roll(L == 0, dy, 0), dx, 1)
    inside = (L > 0) & ~near_seam
    marks = []
    y = 0.0
    while y < H:
        x = rng.uniform(0, spacing)
        while x < W:
            jx, jy = int(x + rng.uniform(-1, 1)), int(y + rng.uniform(-1, 1))
            if 0 <= jx < W and 0 <= jy < H and inside[jy, jx]:
                t = int(np.clip(L[jy, jx] - (rng.uniform() < .2), 1, 5))
                marks.append((t, jx, jy, int(rng.integers(len(LEAVES)))))
            x += spacing
        y += spacing * .8
    marks.sort(key=lambda m: m[0])
    for t, x, y, g in marks:
        sp.stamp(LEAVES[g], x - 1, y - 1, {'H': tones[t + 1 if t >= 4 else t], 'M': tones[t], 'S': tones[max(t - 1, 1)]})
    sp.idx[L == 0] = tones[0]
    for t, x, y, g in marks:
        if t >= 5 and rng.uniform() < sparkle:
            sp.put(x, y - 1, tones[6])
            if rng.uniform() < .35:
                sp.put(x + 1, y - 1, tones[6])
    return sp


def mango_model(seed, bare=False):
    """Mangifera indica: a short heavy trunk forking low into a few limbs under
    a broad, deep dome that comes down almost to head height."""
    t = Tree(seed, bare)
    roots(t, 5)
    fork, _ = t.limb((0, 0, 0), (.03, 0, 1), 16, 6.2, 5, wobble=.03)
    rng = t.rng
    masses = [(-20, 4, 36, 13, .8), (20, 6, 37, 13, .8), (-6, 14, 44, 14, .8), (6, -2, 50, 13, .78),
              (-26, -6, 28, 11, .75), (27, -5, 29, 11, .75), (-12, -14, 32, 13, .78), (13, -13, 34, 13, .8),
              (0, 4, 56, 11, .8), (-14, 2, 50, 11, .8), (15, 3, 49, 11, .8)]
    for i, (x, y, z, r, flat) in enumerate(masses):
        x, y, z = x + rng.uniform(-2, 2), y + rng.uniform(-2, 2), z + rng.uniform(-2, 2)
        middle = np.array([x * .5, y * .5, z - 10])
        t.caps += [(tuple(fork), tuple(middle), 3.6, 2.4), (tuple(middle), (x, y, z - 4), 2.4, 1)]
        t.clumps.append(((x, y, z), r, flat))
        for a in (i * 1.7, i * 1.7 + 2.4):
            t.clumps.append(((x + math.cos(a) * r * .7, y + math.sin(a) * r * .6, z + 1), r * .55, flat))
    return t, dict(leaf=LEAF_IDS, bark=BARK_IDS, ragged=.3, bounds=[c for c, *_ in t.clumps])


def mango(seed, angle, fruit=True):
    im = bake(mango_model, seed, (96, 96), angle)
    sp = paintover(im, LEAF, BARK, seed)
    sp.pal = MANGO_PAL
    if fruit:
        L, _ = bands(im)
        ys, xs = np.nonzero(L > 0)
        top, low = ys.min(), ys.max()
        # Fruit hangs in the lower part of the crown, spread across it.
        spots = [(x, y) for x, y in zip(xs, ys) if low - (low - top) * .5 < y < low - 5]
        rng = np.random.default_rng(seed + 1)
        placed = []
        for _ in range(300):
            x, y = spots[rng.integers(len(spots))]
            if all(abs(x - px) > 13 or abs(y - py) > 11 for px, py in placed):
                placed.append((x, y))
            if len(placed) == 4:
                break
        tone = {'o': 12, 'R': 13, 'O': 14, 'Y': 15, 'W': 16, 'G': 17, 's': 8}
        for x, y in placed:
            sp.stamp(MANGO_FRUIT, x - 4, y - 5, tone)
    return sp.image({**{k: 0 for k in LEAF}, **{k: 7 for k in BARK}, **{k: 12 for k in range(12, 18)}})


# Palm ramps, coolest shadow to warmest light, then dead fronds, stem and nuts.
PALM_PAL = [
    '#0a1d17', '#11301f', '#1a4628', '#27612e', '#3c7e32', '#5c9c35', '#8bbd3b', '#d4e56c',
    '#33220f', '#674419', '#9c722b', '#cda452',
    '#241c17', '#3f3328', '#5f503f', '#857258', '#aa9674', '#cdbc96',
    '#2e260c', '#6a6216', '#a89c26', '#d8c444', '#f4eca0',
]
FROND = list(range(8))
DEAD_FROND = [8, 8, 8, 9, 9, 10, 11, 11]
STEM = list(range(12, 18))
NUT = list(range(18, 23))


def _line(a, b):
    n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1]))) + 1
    return [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n + 1)]


def _rachis(top, yaw, elev, length, droop):
    """The midrib of a frond, grown in 3D and projected, about a pixel a step."""
    out = []
    for k in range(int(length * 1.6)):
        t = k / 1.6
        h = t * math.cos(elev)
        z = t * math.sin(elev) - droop * t * t / length
        out.append((top[0] + h * math.cos(yaw), top[1] - z - h * math.sin(yaw) * .5))
    return out


def frond(sp, pts, tf, ramp, leaflet, seed, comb=3, upper=.35, hang=.75, bristle=0.0, lit_upper=True):
    """One frond as a drawn shape: a comb of leaflets hanging forward off a
    lit midrib, a short far rank above it, and a shadow thrown on whatever
    was drawn before it. `tf` is the frond's tone in its ramp."""
    rng = np.random.default_rng(seed)
    n = len(pts)
    lower, top = [], []
    for i in range(2, n - 1, comb):
        s = i / n
        L = leaflet * math.sin(math.pi * min(1, s * 1.15)) ** .6 * (1 - .4 * s)
        if L < 1.5:
            continue
        tx, ty = pts[min(n - 1, i + 1)][0] - pts[i - 1][0], pts[min(n - 1, i + 1)][1] - pts[i - 1][1]
        m = math.hypot(tx, ty) or 1
        tx, ty = tx / m, ty / m
        # Leaflets leave the midrib across it, toward the ground, then trail.
        nx, ny = (-ty, tx) if tx > 0 else (ty, -tx)
        # An oil palm's leaflets stand in two planes: alternate ones lie back.
        lie = bristle if (i // comb) % 2 else 0
        dx, dy = nx + tx * (.45 + lie), ny + ty * (.45 + lie) + hang * .4
        m = math.hypot(dx, dy)
        x0, y0 = pts[i]
        L *= rng.uniform(.85, 1.1)
        lower.append(([(x0 + dx / m * u, y0 + dy / m * u + .1 * u * u / L) for u in np.arange(0, L, .7)], (i // comb) % 2))
        ux, uy = -nx + tx * (.6 + lie), -ny + ty * (.6 + lie)
        m = math.hypot(ux, uy)
        top.append([(x0 + ux / m * u, y0 + uy / m * u) for u in np.arange(0, L * upper, .7)])
    mask = {(int(round(x)), int(round(y))) for st, _ in lower for x, y in st} | \
        {(int(round(x)), int(round(y))) for st in top for x, y in st} | {(int(round(x)), int(round(y))) for x, y in pts}
    for x, y in mask:
        q = (x + 1, y + 2)
        if q not in mask and 0 <= q[0] < sp.W and 0 <= q[1] < sp.H:
            k = sp.idx[q[1], q[0]]
            if k in FROND or k in DEAD_FROND:
                sp.idx[q[1], q[0]] = ramp[max(1, ramp.index(k) - 2)] if k in ramp else max(1, k - 2)
    for st in top:
        for j, (x, y) in enumerate(st):
            sp.put(x, y, ramp[min(7, tf + lit_upper)] if j < len(st) - 1 else ramp[tf - (not lit_upper)])
    for st, alt in lower:
        L = len(st)
        for j, (x, y) in enumerate(st):
            u = j / max(1, L - 1)
            t = tf - 1 if u < .25 else tf if u < .8 else tf - 1
            sp.put(x, y, ramp[max(1, t - alt)])
    for k, (x, y) in enumerate(pts):
        sp.put(x, y + 1, ramp[max(1, tf - 2)])
        sp.put(x, y, ramp[min(7, tf + (tf >= 4))])


NUT_ART = [
    ".oo.",
    "oWYo",
    "oYGo",
    ".oo.",
]


def coconut(seed):
    """Cocos nucifera: a slender ringed stem leaning out of a swollen foot, a
    loose head of long fronds arching over and hanging, nuts at the heart."""
    W, H = 112, 132
    sp = Sprite((W, H), PALM_PAL)
    rng = np.random.default_rng(seed)
    lean = rng.choice([-1, 1]) * rng.uniform(10, 18)
    top = (W / 2 + lean, 44)
    foot = W / 2
    stem = [(foot + lean * (1 - (1 - t) ** 1.7), H - 3 - t * (H - 3 - top[1])) for t in np.linspace(0, 1, 160)]
    for k, (x, y) in enumerate(stem):
        t = k / len(stem)
        hw = 2.6 + 1.6 * (1 - t) ** 6 + .4 * (1 - t)
        ring = (y + 1000) % 4
        for xx in range(int(math.floor(x - hw)), int(math.ceil(x + hw)) + 1):
            u = (xx - x) / hw
            if abs(u) > 1.05:
                continue
            tone = 4 if u < -.4 else 3 if u < .3 else 2
            if ring < 1:
                tone -= 2 if abs(u) < .9 else 1
            elif ring < 2 and u < .3:
                tone += 1
            if t > .93:
                tone -= 1
            sp.put(xx, y, STEM[max(0, min(5, tone))])
    for j in range(5):
        a = -1 + j * .5
        for u in range(3):
            sp.put(foot + a * (3 + u), H - 3 + (u > 1), STEM[2 if a < 0 else 1])
    yaw0 = rng.uniform(0, 2 * math.pi)
    fronds = []
    for i in range(13):
        yaw = yaw0 + i * 2 * math.pi / 13 + rng.uniform(-.18, .18)
        # A frond aimed straight at the viewer reads as a stripe down the stem.
        off = (yaw + math.pi / 2 + math.pi) % (2 * math.pi) - math.pi
        if abs(off) < .55:
            yaw += math.copysign(.55, off) - off
        age = rng.uniform()
        elev = .85 - age * .75
        depth = math.sin(yaw)
        L = rng.uniform(40, 48) * (.7 if age < .15 else 1) * (1 + .3 * min(0, depth))
        tf = int(np.clip(round(4.6 - depth * 1.2 + (1 - age) * .6), 2, 6))
        fronds.append((depth, _rachis(top, yaw, elev, L, .35 + age * .55), tf, FROND, 11 + 3 * (1 - age)))
    for i in range(2):
        yaw = yaw0 + 1.1 + i * 2.9
        fronds.append((math.sin(yaw) + 2, _rachis((top[0], top[1] + 3), yaw, -1.0, 26, .1), 4, DEAD_FROND, 7))
    fronds.sort(key=lambda f: -f[0])
    back = [f for f in fronds if f[0] > -.2]
    front = [f for f in fronds if f[0] <= -.2]
    for k, (depth, pts, tf, ramp, leaflet) in enumerate(back):
        frond(sp, pts, tf, ramp, leaflet, seed * 50 + k)
    for k, (depth, pts, tf, ramp, leaflet) in enumerate(front):
        frond(sp, pts, tf, ramp, leaflet, seed * 50 + 30 + k)
    for x, y in ((-4, 6), (1, 7), (-1, 9), (4, 5), (-6, 8)):
        sp.stamp(NUT_ART, int(top[0] + x - 2), int(top[1] + y - 1), {'o': NUT[0], 'G': NUT[1], 'Y': NUT[2], 'W': NUT[3]})
    return sp.image({**{k: 0 for k in FROND}, **{k: 8 for k in range(8, 12)}, **{k: 12 for k in STEM},
                     **{k: 18 for k in NUT}})


OIL_PAL = [
    '#081a12', '#0e2c1a', '#164222', '#215c29', '#32782e', '#4f9532', '#7cb438', '#c4dc62',
    '#33220f', '#674419', '#9c722b', '#cda452',
    '#1c140f', '#352619', '#533b24', '#72542f', '#93703d', '#b38f55',
    '#1c0806', '#4e120a', '#8e2810', '#d0561a', '#f09a3a',
]
OIL_STEM = list(range(12, 18))
OIL_BUNCH = [
    "..o..o.o..",
    ".oRo.oRdo.",
    "oRYdoROdo.",
    ".oRORdYRo.",
    "odYdROdRdo",
    ".oRdOdRdo.",
    "..odRdodo.",
    "...o.o.o..",
]


def blade(sp, pts, tf, ramp, width, tooth=3.0, seed=0):
    """A frond drawn as one serrated blade: lit upper half, shaded lower half,
    a pale midrib, and an edge two tones down that also parts it from the
    fronds behind. Teeth slope toward the tip, as leaflets do."""
    rng = np.random.default_rng(seed)
    mask = np.zeros((sp.H, sp.W), np.int8)
    n = len(pts)
    jag = rng.uniform(0, 1)
    for i in range(1, n):
        s = i / (n - 1)
        (x0, y0), (x1, y1) = pts[i - 1], pts[i]
        tx, ty = x1 - x0, y1 - y0
        m = math.hypot(tx, ty) or 1
        nx, ny = -ty / m, tx / m
        if ny > 0:
            nx, ny = -nx, -ny
        saw = (s * n / 1.6 / tooth + jag) % 1
        w = width * min(1, s / .15) * (1 - s) ** .5 * (.3 + .7 * saw ** 1.5)
        for side, half in ((1, 2), (-1, 1)):
            for d in np.arange(0, w * (1 if side > 0 else .8) + .01, .5):
                x, y = int(round(x1 + nx * d * side)), int(round(y1 + ny * d * side))
                if 0 <= x < sp.W and 0 <= y < sp.H and mask[y, x] < half:
                    mask[y, x] = half
    p = np.pad(mask, 1)
    edge = (mask > 0) & ((p[2:, 1:-1] == 0) | (p[:-2, 1:-1] == 0) | (p[1:-1, 2:] == 0) | (p[1:-1, :-2] == 0))
    for y, x in zip(*np.nonzero(mask)):
        k = tf - 2 if edge[y, x] else tf if mask[y, x] == 2 else tf - 1
        sp.idx[y, x] = ramp[max(0, k)]
    for x, y in pts[2:int(n * .8)]:
        sp.put(x, y, ramp[min(7, tf + 1)])


def oil_palm(seed):
    """Elaeis guineensis: a stout stem scaled with old leaf bases, a dense head
    of stiff serrated fronds, and black-red fruit bunches at the heart."""
    W, H = 124, 120
    sp = Sprite((W, H), OIL_PAL)
    rng = np.random.default_rng(seed)
    foot = W / 2 + rng.uniform(-2, 2)
    top = (foot + rng.uniform(-3, 3), 52)
    for y in range(int(top[1]) - 4, H - 2):
        t = (y - top[1]) / (H - 2 - top[1])
        x0 = top[0] + (foot - top[0]) * t
        hw = 5 + 2 * max(0, t - .88) / .12
        row = int((y - top[1] + 40) // 5)
        ly = (y - top[1] + 40) % 5
        for x in range(int(x0 - hw - 2), int(x0 + hw + 3)):
            u = (x - x0) / hw
            k = 4 if u < -.45 else 3 if u < .3 else 2
            cell = (row, int((x - x0 + 30 + 2.5 * (row % 2)) // 5))
            if t < .62 + .2 * ((hash(cell) * 2654435761 + seed) % 97) / 97:
                # Leaf-base stubs: downward wedges with a pale cut face, the
                # dark pockets between them making a diamond lattice.
                lx = (x - x0 + 30 + 2.5 * (row % 2)) % 5
                c = abs(lx - 2)
                inside = c <= 2.7 - ly * .7
                if not inside:
                    k -= 2
                elif ly == 0:
                    k += 1
                elif ly >= 3:
                    k -= 1
                if abs(u) > 1 and not (inside and ly <= 2 and abs(u) < 1.45):
                    continue
            elif abs(u) > 1:
                continue
            elif (y - top[1]) % 7 == 0:
                k -= 1
            sp.put(x, y, OIL_STEM[max(0, min(5, k))])
    fronds = []
    yaw0 = rng.uniform(0, 2 * math.pi)
    for i in range(20):
        yaw = yaw0 + i * 2.39996 + rng.uniform(-.12, .12)
        off = (yaw + math.pi / 2 + math.pi) % (2 * math.pi) - math.pi
        if abs(off) < .5:
            yaw += math.copysign(.5, off) - off
        age = (i % 5) / 4
        depth = math.sin(yaw)
        light = -math.cos(yaw) * .7 + (1 - age) * .6 - depth * 1.1
        tf = int(np.clip(round(3.6 + light), 2, 6))
        L = rng.uniform(38, 45) * (.75 if age == 0 else 1) * (1 + .25 * min(0, depth))
        fronds.append((depth, _rachis(top, yaw, 1.05 - age * 1.2, L, .2 + age * .4), tf, FROND, 7.5))
    for i in range(2):
        yaw = yaw0 + 1 + i * 2.6
        fronds.append((math.sin(yaw) + 1.5, _rachis((top[0], top[1] + 3), yaw, -1.2, 20, .05), 3, DEAD_FROND, 3.5))
    fronds.sort(key=lambda f: -f[0])
    bunch = {'o': 18, 'd': 19, 'R': 20, 'O': 21, 'Y': 22}
    for k, (depth, pts, tf, ramp, width) in enumerate(fronds):
        blade(sp, pts, tf, ramp, width, tooth=2.6, seed=seed * 50 + k)
    # Bunches sit in the axils at the foot of the crown.
    side = rng.choice([-1, 1])
    sp.stamp(OIL_BUNCH, int(top[0] - side * 5 - 5), int(top[1] + 3), {**bunch, 'Y': 21, 'O': 20, 'R': 19})
    sp.stamp(OIL_BUNCH, int(top[0] + side * 3 - 5), int(top[1] + 6), bunch)
    return sp.image({**{k: 0 for k in FROND}, **{k: 8 for k in range(8, 12)}, **{k: 12 for k in OIL_STEM},
                     **{k: 18 for k in range(18, 23)}})


BANANA_PAL = [
    '#0f2a10', '#1d4514', '#2f6418', '#47861c', '#68a522', '#8ec238', '#bcdc5c', '#e8f29a',
    '#3a2810', '#6e4e1e', '#a07a36', '#cfae62',
    '#1f2a12', '#3a4a1c', '#5a6c28', '#7e8c38', '#a3a852', '#7a5428',
    '#2e4410', '#7aa82a', '#d2e264', '#2a0c1c', '#6a1c3a', '#b04a64',
]
BAN_LEAF = list(range(8))
BAN_DEAD = [8, 8, 8, 9, 9, 10, 11, 11]
BAN_STEM = list(range(12, 17))
BAN_BUNCH = [
    ".....s.....",
    "..gYYgYYg..",
    ".gGGYgGYGg.",
    "gGGGgGGgGGg",
    ".ggg.g.ggg.",
    ".gYYgYYgYg.",
    "gGGYgGYgGGg",
    ".gGGgGGgGg.",
    "..ggg.ggg..",
    "..gYYgYYg..",
    ".gGGYgGYGg.",
    "..gGgGGgg..",
    "...gg.gg...",
    ".....s.....",
    ".....s.....",
    "....pPp....",
    "...pPQPp...",
    "...pPQPp...",
    "...pPPPp...",
    "....pPp....",
    ".....p.....",
]


def paddle(sp, pts, tf, ramp, width, tears, seed, stalk=.25, rib=2):
    """A banana leaf: a narrow petiole, then a broad oblong blade with a round
    tip and a pale midrib. Wind tears it along the veins, which run out from
    the midrib slanting toward the tip."""
    rng = np.random.default_rng(seed)
    mask = np.zeros((sp.H, sp.W), np.int8)
    n = len(pts)
    normals = []
    for i in range(1, n):
        s = i / (n - 1)
        (x0, y0), (x1, y1) = pts[i - 1], pts[i]
        tx, ty = x1 - x0, y1 - y0
        m = math.hypot(tx, ty) or 1
        nx, ny = -ty / m, tx / m
        if ny > 0:
            nx, ny = -nx, -ny
        normals.append((nx, ny, tx / m, ty / m))
        u = (s - stalk) / (1 - stalk)
        w = 0 if u < 0 else width * max(0, 1 - (u * 2 - 1) ** 6) ** .5 * (1 + .06 * math.sin(s * 23 + seed))
        for side, half in ((1, 2), (-1, 1)):
            for d in np.arange(0, w * (1 if side > 0 else .85) + .01, .5):
                x, y = int(round(x1 + nx * d * side)), int(round(y1 + ny * d * side))
                if 0 <= x < sp.W and 0 <= y < sp.H and mask[y, x] < half:
                    mask[y, x] = half
    for _ in range(tears):
        i = int(rng.uniform(.3, .92) * (n - 2))
        side = rng.choice([-1, 1])
        nx, ny, tx, ty = normals[i]
        dx, dy = side * nx + tx * .7, side * ny + ty * .7
        m = math.hypot(dx, dy)
        start = width * rng.uniform(0, .7)
        for d in np.arange(start, width * 1.6, .5):
            x, y = int(round(pts[i + 1][0] + dx / m * d)), int(round(pts[i + 1][1] + dy / m * d))
            if 0 <= x < sp.W and 0 <= y < sp.H:
                mask[y, x] = 0
    p = np.pad(mask, 1)
    edge = (mask > 0) & ((p[2:, 1:-1] == 0) | (p[:-2, 1:-1] == 0) | (p[1:-1, 2:] == 0) | (p[1:-1, :-2] == 0))
    for y, x in zip(*np.nonzero(mask)):
        k = tf - 2 if edge[y, x] else tf if mask[y, x] == 2 else tf - 1
        sp.idx[y, x] = ramp[max(0, k)]
    for j, (x, y) in enumerate(pts[:int(n * .94)]):
        sp.put(x, y, ramp[min(7, tf + rib)] if j > n * stalk else ramp[tf - 1])


def banana(seed):
    """Musa: a soft green pseudostem streaked brown where old sheaths dry, a
    fountain of broad torn leaves, dead ones hanging, and a bunch on an arching
    stalk ending in the purple bell. A sucker comes up at the foot."""
    W, H = 108, 112
    sp = Sprite((W, H), BANANA_PAL)
    rng = np.random.default_rng(seed)
    foot = W / 2 + rng.uniform(-2, 2)
    top = (foot + rng.uniform(-3, 3), 50)
    streaks = rng.uniform(-1, 1, 3)
    for y in range(int(top[1]), H - 2):
        t = (y - top[1]) / (H - 2 - top[1])
        x0 = top[0] + (foot - top[0]) * t
        hw = 3 + 1.6 * t + 1.2 * max(0, t - .9) / .1
        for x in range(int(round(x0 - hw)), int(round(x0 + hw)) + 1):
            u = (x - x0) / hw
            k = 3 if u < -.4 else 2 if u < .35 else 1
            if any(abs(u - c) < .14 for c in streaks):
                k -= 1
            sp.put(x, y, BAN_STEM[k])
            # Dry sheaths: brown, ragged, more of them toward the foot.
            if t > .35 and ((x * 7 + y // 3 * 13 + seed) % 11) < (t - .35) * 12 and abs(u) > .3:
                sp.put(x, y, 17)
    sx = foot + rng.choice([-1, 1]) * 11
    for y in range(H - 12, H - 2):
        for x in range(int(sx - 1), int(sx + 2)):
            sp.put(x, y, BAN_STEM[3 - (x > sx)])
    leaves = []
    yaw0 = rng.uniform(0, 2 * math.pi)
    for i in range(7):
        yaw = yaw0 + i * 2.39996 + rng.uniform(-.15, .15)
        # Splay the leaves sideways, where they show their length.
        yaw -= .45 * math.sin(2 * yaw)
        off = (yaw + math.pi / 2 + math.pi) % (2 * math.pi) - math.pi
        if abs(off) < .7:
            yaw += math.copysign(.7, off) - off
        age = i / 6
        depth = math.sin(yaw)
        tf = int(np.clip(round(4 - depth * 1.1 - math.cos(yaw) * .6 + (1 - age) * .5), 2, 6))
        L = rng.uniform(44, 50) * (1 + .3 * min(0, depth)) * (.8 if age == 0 else 1)
        leaves.append((depth, _rachis(top, yaw, 1.35 - age * 1.1, L, .5 + age * .9), tf, BAN_LEAF, 6.5, 2 + int(age * 5)))
    leaves.append((1.5, _rachis(top, yaw0, 1.45, 16, 0), 5, BAN_LEAF, 2, 0))
    for i in range(2):
        yaw = yaw0 + 1.2 + i * 2.5
        leaves.append((math.sin(yaw) + .5, _rachis((top[0], top[1] + 3), yaw, -.2, 24, 1.2), 4, BAN_DEAD, 4, 3))
    for i, yaw in enumerate((.3, 2.6)):
        leaves.append((-.5, _rachis((sx, H - 12), yaw, .9, 11, .5), 5, BAN_LEAF, 3, 0))
    leaves.sort(key=lambda f: -f[0])
    for k, (depth, pts, tf, ramp, width, tears) in enumerate(leaves):
        paddle(sp, pts, tf, ramp, width, tears, seed * 40 + k)
    side = 1 if sx < foot else -1
    stalk = _rachis((top[0], top[1] + 2), math.pi / 2 + side * 1.35, .6, 16, 1.5)
    for x, y in stalk:
        sp.put(x, y, BAN_STEM[2])
        sp.put(x + 1, y, BAN_STEM[1])
    bx, by = stalk[-1]
    ox, oy = int(bx - 5), int(by)
    cells = {(ox + i, oy + j) for j, row in enumerate(BAN_BUNCH) for i, ch in enumerate(row) if ch != '.'}
    for x, y in cells:
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if (nx, ny) not in cells:
                sp.put(nx, ny, 21 if ny - oy >= 14 else 12)
    sp.stamp(BAN_BUNCH, ox, oy, {'s': 13, 'g': 18, 'G': 19, 'Y': 20, 'p': 21, 'P': 22, 'Q': 23})
    return sp.image({**{k: 0 for k in BAN_LEAF}, **{k: 8 for k in range(8, 12)}, **{k: 12 for k in range(12, 18)},
                     18: 18, 19: 18, 20: 18, 21: 21, 22: 21, 23: 21})


MAHOGANY_PAL = [
    '#0a1c12', '#123220', '#1c4a26', '#2a642c', '#3e7e32', '#5e9a3a', '#9cc05a',
    '#2a1d16', '#4a342a', '#6c4e3c', '#8f6b52', '#b38c6c',
]


def mahogany_model(seed, bare=False):
    """An emergent of the rainforest (mahogany, African khaya, Asian meranti):
    plank buttresses, a long clean bole, and a broad flat-topped crown of a
    few spreading limbs held above the canopy."""
    t = Tree(seed, bare)
    rng = t.rng
    for k in range(5):
        a = k * 2 * math.pi / 5 + rng.uniform(-.3, .3)
        reach = rng.uniform(9, 13)
        for h in range(5):
            t.caps.append(((0, 0, 22 - h * 4), (math.cos(a) * (4 + reach * h / 4), math.sin(a) * (4 + reach * h / 4), 0), 2.2, 1.2))
    top, _ = t.limb((0, 0, 0), (0, 0, 1), 74, 5.2, 3.6, wobble=.015, segs=6)
    for i in range(5):
        a = i * 2 * math.pi / 5 + rng.uniform(-.4, .4)
        tip, _ = t.limb(top, (math.cos(a), math.sin(a), .55), 24, 3, 1.3, wobble=.08)
        t.spray(tip + (0, 0, 3), 5, 7, 9, .45)
    t.clumps.append(((top[0], top[1], top[2] + 9), 13, .45))
    return t, dict(leaf=LEAF_IDS, bark=BARK_IDS, ragged=.3, bounds=[c for c, *_ in t.clumps])


def mahogany(seed, angle):
    sp = paintover(bake(mahogany_model, seed, (128, 176), angle), LEAF, BARK, seed, spacing=4.2, sparkle=.25)
    sp.pal = MAHOGANY_PAL
    return sp.image({**{k: 0 for k in LEAF}, **{k: 7 for k in BARK}})


FIG_PAL = [
    '#081a16', '#0f2e22', '#18452c', '#246034', '#367c3a', '#5a9a40', '#a6c868',
    '#34342f', '#55554d', '#7a7a70', '#a09f92', '#c6c4b4',
    '#4a140f', '#a83a24', '#e88038',
]
FIG_FRUIT = [".o.", "oRo", "oOR", ".o."]


def fig_model(seed, bare=False):
    """A wild fig: several stems braided into one pale fluted trunk, a few
    aerial roots, and a low, dense, glossy dome far wider than it is tall."""
    t = Tree(seed, bare)
    rng = t.rng
    roots(t, 6)
    fork = np.array([0., 0, 20])
    for k in range(4):
        a = k * math.pi / 2 + rng.uniform(-.3, .3)
        t.caps.append(((math.cos(a) * 5, math.sin(a) * 5, 0), tuple(fork + (math.cos(a + 1) * 2, math.sin(a + 1) * 2, 0)), 3.2, 2.6))
    masses = []
    for i in range(9):
        a = i * 2.39996 + rng.uniform(-.2, .2)
        rr = 30 * math.sqrt((i + .5) / 9)
        tip, _ = t.limb(fork, (math.cos(a), math.sin(a), .5), rr * .8, 2.8, 1.2, wobble=.1)
        masses.append(tip)
        t.clumps.append(((tip[0], tip[1], 30 + 10 * (1 - rr / 30) + rng.uniform(-2, 2)), 13, .62))
    return t, dict(leaf=LEAF_IDS, bark=BARK_IDS, ragged=.25, bounds=[c for c, *_ in t.clumps])


def fig(seed, angle):
    im = bake(fig_model, seed, (128, 112), angle)
    sp = paintover(im, LEAF, BARK, seed, spacing=3.0, sparkle=.55)
    sp.pal = FIG_PAL
    L, _ = bands(im)
    rng = np.random.default_rng(seed + 3)
    ys, xs = np.nonzero(L >= 3)
    for _ in range(9):
        k = rng.integers(len(xs))
        sp.stamp(FIG_FRUIT, xs[k] - 1, ys[k] - 1, {'o': 12, 'R': 13, 'O': 14})
    return sp.image({**{k: 0 for k in LEAF}, **{k: 7 for k in BARK}, **{k: 12 for k in (12, 13, 14)}})


UMBRELLA_PAL = [
    '#0c2412', '#163c1a', '#225a22', '#33782a', '#4f9632', '#78b23e', '#a8cc5c', '#dcea96',
    '#3a4a3c', '#6e8070', '#a4b4a2', '#d2dccc',
    '#2c2a26', '#4e4a42', '#76705f', '#a29a84', '#ccc4ac',
]
UM_LEAF = list(range(8))
UM_SILVER = [8, 8, 8, 9, 9, 10, 11, 11]
UM_BARK = list(range(12, 17))


def umbrella_tree(seed):
    """The pioneer that first fills a clearing (cecropia, musanga, macaranga):
    a slim pale ringed stem on stilt roots, a few candelabra arms, and at each
    tip a rosette of huge palmate leaves, the old ones hanging silver side out."""
    W, H = 128, 156
    sp = Sprite((W, H), UMBRELLA_PAL)
    rng = np.random.default_rng(seed)
    foot = (W / 2 + rng.uniform(-3, 3), H - 3)
    lean = rng.uniform(-.08, .08)
    top_y = 44
    stem = [(foot[0] + lean * (foot[1] - y), y) for y in range(int(foot[1]), top_y, -1)]

    def wood(pts, w0, w1):
        for i, (x, y) in enumerate(pts):
            w = w0 + (w1 - w0) * i / max(1, len(pts) - 1)
            for dx in range(-int(w), int(w) + 1):
                u = dx / max(w, 1)
                k = 3 if u < -.3 else 2 if u < .4 else 1
                if i % 6 == 0:
                    k -= 1
                sp.put(x + dx, y, UM_BARK[k])

    for k in (-1, 1, rng.choice([-1, 1]) * .4):
        root = _line((foot[0] + k * 11, foot[1]), (foot[0] + k * 1.5, foot[1] - 15 - abs(k) * 2))
        wood(root, 1, 1)
    wood(stem, 3, 1.8)
    tips = [stem[-1]]
    for i, side in enumerate(rng.permutation([-1, 1, 1, -1])[:3]):
        y0 = top_y + 16 + i * 11 + rng.uniform(-2, 2)
        x0 = foot[0] + lean * (foot[1] - y0)
        out = rng.uniform(16, 24)
        arm = [(x0 + side * out * math.sin(min(1, s * 1.6) * math.pi / 2), y0 - s * s * rng.uniform(14, 20)) for s in np.linspace(0, 1, 26)]
        wood(arm, 1.4, 1)
        tips.append(arm[-1])
    rosettes = []
    for (tx, ty) in tips:
        for j in range(6):
            yaw = j * 1.05 + rng.uniform(-.2, .2)
            age = j % 3 / 2
            depth = math.sin(yaw)
            pet = _rachis((tx, ty), yaw, .9 - age * 1.9, 9 + age * 3, .4)
            rosettes.append((ty, depth, pet, age))
    rosettes.sort(key=lambda r: (r[0] > top_y + 4, -r[1]))
    for k, (ty, depth, pet, age) in enumerate(rosettes):
        for x, y in pet:
            sp.put(x, y, UM_LEAF[2])
        (cx, cy) = pet[-1]
        silver = age > .7
        ramp = UM_SILVER if silver else UM_LEAF
        tf = 5 if silver else int(np.clip(round(4.4 - depth * .9), 3, 6))
        head = math.atan2(pet[-1][1] - pet[-2][1], pet[-1][0] - pet[-2][0])
        lobes = sorted(range(-3, 4), key=lambda i: abs(i))[::-1]
        for i in lobes:
            a = head + i * .52
            L = 14 - abs(i) * 1.6 + rng.uniform(-1, 1)
            if silver:
                a = math.pi / 2 + i * .36
            pts = [(cx + math.cos(a) * d, cy + math.sin(a) * d * (.75 if not silver else 1)) for d in np.linspace(0, L, int(L * 1.6))]
            paddle(sp, pts, tf, ramp, 2.3, 0, seed * 90 + k * 7 + i, stalk=.15, rib=1)
    return sp.image({**{k: 0 for k in UM_LEAF}, **{k: 8 for k in range(8, 12)}, **{k: 12 for k in UM_BARK}})


def _pad(im):
    out = Image.new('RGBA', (im.width + 4, im.height + 3))
    out.paste(im, (2, 2))
    return out


def tropical_trees():
    return {name: _pad(im) for name, im in {
        'nature-mango': mango(1, 0),
        'nature-mango-2': mango(6, 140),
        'nature-coconut-palm': coconut(2),
        'nature-coconut-palm-2': coconut(5),
        'nature-oil-palm': oil_palm(3),
        'nature-oil-palm-2': oil_palm(8),
        'nature-banana': banana(4),
        'nature-banana-2': banana(9),
        'nature-mahogany': mahogany(2, 0),
        'nature-mahogany-2': mahogany(7, 150),
        'nature-fig': fig(3, 0),
        'nature-fig-2': fig(5, 120),
        'nature-umbrella-tree': umbrella_tree(4),
        'nature-umbrella-tree-2': umbrella_tree(11),
    }.items()}
