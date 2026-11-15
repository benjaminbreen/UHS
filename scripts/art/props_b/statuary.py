"""Statues, built from parts: a figure of some kind, in some material, at some
size, on a pedestal of its tradition. A figure is a union of lit ellipsoids
and tapered limbs, so one description draws at any size and takes any ramp.

    PYTHONPATH=scripts .venv/bin/python -m art.props_b.statuary   # artifacts/statuary.png

Sizes are the town's rank: 0 a provincial town's, 1 a city's, 2 a capital's.
The regional figures are statuary_*.py; each exports KINDS.
"""
import math

from art.city_kit import C, outline, mix
from .plaza import box, drum, disc, after, _pigeon

# Seven steps, dark to light.
MATERIAL = {
    'marble': ['#4a4a58', '#74748a', '#9a9aa8', '#bcbcc4', '#d8d8da', '#ececea', '#fbfbf6'],
    'limestone': ['#3b3a32', '#5f5d4e', '#847f6a', '#a8a186', '#c7bfa1', '#e3dcbe', '#f3eeda'],
    'sandstone': ['#3a2b22', '#5e4632', '#856348', '#a8815c', '#c4a077', '#dcc199', '#eedcb8'],
    'redstone': ['#2e1612', '#52261c', '#7a3a28', '#9c5236', '#b86e4c', '#d09070', '#e4b498'],
    'granite': ['#191d24', '#282f38', '#3b4350', '#525b67', '#6e7783', '#8f96a0', '#b4bac0'],
    'basalt': ['#0e1014', '#181b21', '#252931', '#353a44', '#484e59', '#5f6672', '#7c8490'],
    'bronze': ['#1a120c', '#2e2014', '#48321c', '#684a28', '#8a6636', '#ac884c', '#d0b070'],
    'verdigris': ['#10201c', '#1a342c', '#284e42', '#3a6c5a', '#549078', '#7ab49a', '#a8d4bc'],
    'gilt': ['#4a3008', '#7a5410', '#a87c1c', '#d0a430', '#ecc850', '#f8e488', '#fff6c4'],
    'terracotta': ['#2d1a13', '#4a2a1c', '#6b3f27', '#8d5836', '#ab7149', '#c58f63', '#dcb086'],
    'wood': ['#241610', '#3a2418', '#553520', '#6f4526', '#8b5c33', '#a87546', '#c6945f'],
    'jade': ['#0e2a22', '#1a4636', '#2a664c', '#3e8664', '#5ea684', '#8cc6a8', '#c0e4d0'],
}
SCALE = (0.86, 1.06, 1.36)


class Parts:
    """A figure's forms, far to near. Coordinates are from the feet at
    (cx, by) in pixels at scale 1, where a standing figure is 44 tall."""

    def __init__(self, cx, by, s):
        self.cx, self.by, self.s, self.list = cx, by, s, []

    def e(self, x, y, rx, ry):
        s = self.s
        self.list.append((self.cx + x * s, self.by + y * s, max(0.8, rx * s), max(0.8, ry * s)))

    def limb(self, x0, y0, x1, y1, r0, r1=None):
        r1 = r0 if r1 is None else r1
        n = max(2, int(math.hypot(x1 - x0, y1 - y0) * self.s / 1.2) + 1)
        for i in range(n + 1):
            t = i / n
            r = r0 + (r1 - r0) * t
            self.e(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r)

    def top(self):
        return min(y - ry for _, y, _, ry in self.list)


def sculpt(c, parts, ramp):
    """Each form shaded by its own surface, lit from the upper left, in hard
    steps: a statue is modelled, not outlined."""
    n = len(ramp)
    for (cx, cy, rx, ry) in parts.list:
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                u, v = (x + .5 - cx) / rx, (y + .5 - cy) / ry
                d = u * u + v * v
                if d > 1:
                    continue
                lam = -0.5 * u - 0.58 * v + 0.64 * math.sqrt(1 - d)
                k = 1 + int(max(0.0, min(0.999, (lam + 0.25) / 1.2)) * (n - 1))
                c.px(x, y, ramp[min(n - 1, k)])


def head(p, x=0, y=-40.4, r=3.9):
    """Shoulders' worth of neck and a head a little taller than wide."""
    p.e(x, y + 4.2, r * 0.72, 2.6)
    p.e(x, y, r, r * 1.12)


def face(c, p, ramp, x=0, y=-40.4, r=3.9, hair=True):
    """Hair as a slightly darker crown, and the shadow under the chin."""
    s = p.s
    cx, cy = p.cx + x * s, p.by + y * s
    if hair:
        for yy in range(int(cy - r * 1.12 * s), int(cy - r * 0.6 * s) + 1):
            for xx in range(int(cx - r * s) - 1, int(cx + r * s) + 2):
                if c.get(xx, yy)[3] and ((xx + .5 - cx) / (r * s)) ** 2 + ((yy + .5 - cy) / (r * 1.12 * s)) ** 2 <= 1:
                    c.px(xx, yy, ramp[3 if xx > cx else 4])
    incise(c, line((cx - r * 0.5 * s, cy + r * 1.1 * s), (cx + r * 0.6 * s, cy + r * 1.1 * s)), ramp, 1)


def incise(c, pts, ramp, k=1):
    """A cut line, only where there is already stone."""
    for x, y in pts:
        if c.get(int(x), int(y))[3]:
            c.px(int(x), int(y), ramp[k])


def line(a, b):
    n = max(1, int(max(abs(b[0] - a[0]), abs(b[1] - a[1]))))
    return [(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n) for i in range(n + 1)]


def fold(c, p, x0, y0, x1, y1, ramp, k=2):
    """A drapery fold between two points of the figure's own coordinates."""
    s = p.s
    incise(c, line((p.cx + x0 * s, p.by + y0 * s), (p.cx + x1 * s, p.by + y1 * s)), ramp, k)


# --------------------------------------------------------------- pedestals

def classical(c, cx, by, w, h, ramp, plate=True):
    """A die between a base and a cornice; returns the row the figure stands on."""
    hw = w // 2
    box(c, cx - hw - 3, by - 2, cx + hw + 2, by, 2, ramp, lean=1, hi=5)
    box(c, cx - hw, by - h + 3, cx + hw - 1, by - 3, 1, ramp, lean=1, hi=5)
    box(c, cx - hw - 2, by - h, cx + hw + 1, by - h + 2, 3, ramp, lean=1, hi=6)
    if plate and h >= 12 and w >= 10:
        c.rect(cx - hw + 3, by - h + 6, cx + hw - 4, by - 6, ramp[2])
        for y in range(by - h + 8, by - 7, 2):
            c.hl(cx - hw + 5, cx + hw - 6, y, ramp[1])
    return by - h - 2


def stepped(c, cx, by, w, steps, ramp, rise=3):
    """Courses stepping in; returns the top row."""
    for i in range(steps):
        hw = w // 2 + (steps - 1 - i) * 3
        y = by - i * rise
        box(c, cx - hw, y - rise + 2, cx + hw - 1, y, 1, ramp, lean=1, hi=6 - (i == 0))
    return by - steps * rise - 0


def lotus(c, cx, by, w, ramp):
    """A drum between two rings of petals, the seat of a holy figure."""
    hw = w / 2
    drum(c, cx, by - 3, by - 1, hw + 1, 2.2, ramp, top=False, hi=5)
    for row, (y, turn) in enumerate(((by - 4, 1), (by - 8, -1))):
        n = max(4, int(w // 4))
        for i in range(n):
            px = cx - hw + (i + 0.5) * w / n
            for dy in range(3):
                half = 1.6 - dy * 0.5
                yy = y + turn * dy if turn > 0 else y - dy
                c.hl(int(px - half), int(px + half), int(yy), ramp[5 if i < n / 2 else 4])
            c.px(int(px), y, ramp[6])
    disc(c, cx, by - 10, hw + 1.5, 2.4, ramp, thick=0, hi=6)
    return by - 10


def pillar(c, cx, by, r, h, ramp, capital=True):
    """A column on a base; returns the top row."""
    box(c, cx - r - 3, by - 3, cx + r + 2, by, 2, ramp, lean=1, hi=5)
    drum(c, cx, by - h, by - 4, r, 1.2, ramp, top=False, hi=6)
    for y in range(by - h + 4, by - 5, 9):
        c.hl(int(cx - r), int(cx + r) - 1, y, ramp[2])
    if capital:
        box(c, cx - r - 2, by - h - 2, cx + r + 1, by - h, 2, ramp, lean=1, hi=6)
        return by - h - 4
    return by - h


def boulder(c, cx, by, w, h, ramp):
    """Rough rock, undressed."""
    p = Parts(cx, by, 1)
    p.e(-w * 0.2, -h * 0.45, w * 0.42, h * 0.5)
    p.e(w * 0.22, -h * 0.4, w * 0.36, h * 0.44)
    p.e(0, -h * 0.62, w * 0.34, h * 0.4)
    sculpt(c, p, ramp)
    return by - int(h * 0.9)


# ----------------------------------------------------------------- figures
# Each takes (c, cx, by, s, ramp) and draws a figure standing on row `by`.
# It returns the canvas width it wants at scale 1 and its height, through
# KINDS below: (draw, half width, height, pedestal, footprint width).

def draped(c, cx, by, s, ramp, arm='scroll'):
    """A standing figure in a long wrapped garment: a magistrate in his toga,
    a saint, a draped goddess."""
    p = Parts(cx, by, s)
    p.e(0, -11, 7.2, 12)
    p.e(-0.5, -2.6, 7.4, 2.8)
    p.e(0, -27, 6.6, 8.6)
    p.limb(-5.6, -32, -7.2, -21, 2.5, 2.1)
    if arm == 'raised':
        p.limb(9.5, -46, 8.5, -38, 1.5, 1.9)
        p.limb(8.5, -38, 5.4, -32, 1.9, 2.3)
    else:
        p.limb(5.4, -32, 8, -25.5, 2.4, 2)
        p.limb(8, -25.5, 11.5, -28, 1.9, 1.5)
    for x in (-4.6, 4.6):
        p.e(x, -32, 2.6, 2.3)
    head(p)
    sculpt(c, p, ramp)
    face(c, p, ramp)
    for x0, y0, x1, y1 in ((-4, -31, 3, -18), (-1, -32, 5, -20), (2, -18, -3, -1), (4.5, -17, 2, -1), (-3.5, -16, -5.5, -2)):
        fold(c, p, x0, y0, x1, y1, ramp)
    fold(c, p, -6, -20, 6, -17, ramp, 3)
    if arm == 'scroll':
        c.rect(int(cx + 11 * s), int(by - 30 * s), int(cx + 12 * s), int(by - 26 * s), ramp[6])
    return p


def orator(c, cx, by, s, ramp, arm='raised'):
    """A man in a coat and trousers on his own two legs: the bronze worthy of
    any nineteenth-century square."""
    p = Parts(cx, by, s)
    for x in (-2.6, 2.8):
        p.limb(x * 0.9, -19, x, -1.5, 2.9, 2.3)
        p.e(x + 0.8, -1, 2.9, 1.4)
    p.e(0, -16.5, 6, 8)
    p.e(0, -27.5, 5.8, 8)
    p.limb(-5.6, -32, -7.4, -24, 2.4, 2)
    p.limb(-7.4, -24, -5, -19, 2, 1.7)
    if arm == 'raised':
        p.limb(10.5, -47, 9, -39, 1.5, 1.9)
        p.limb(9, -39, 5.4, -32.5, 1.9, 2.3)
    else:
        p.limb(5.4, -32, 7.6, -24, 2.4, 2)
        p.limb(7.6, -24, 4, -22, 1.9, 1.7)
    for x in (-4.6, 4.6):
        p.e(x, -32, 2.6, 2.3)
    head(p)
    sculpt(c, p, ramp)
    face(c, p, ramp)
    fold(c, p, 0, -33, 0.5, -11, ramp, 1)
    fold(c, p, -3, -34, 0, -29, ramp, 2)
    fold(c, p, 3, -34, 0, -29, ramp, 2)
    fold(c, p, -6, -11, 6, -11, ramp, 2)
    fold(c, p, 0, -10, 0, -2, ramp, 1)
    return p


def seated(c, cx, by, s, ramp, crown='ushnisha'):
    """A figure sitting cross-legged, hands in the lap: a Buddha, a
    tirthankara, a sage."""
    p = Parts(cx, by, s)
    p.e(0, -4.4, 13, 4.6)
    p.e(-8, -5.5, 5.5, 4)
    p.e(8, -5.5, 5.5, 4)
    p.e(0, -15.5, 7.2, 9.4)
    p.limb(-6.4, -21, -8, -12, 2.5, 2.2)
    p.limb(6.4, -21, 8, -12, 2.5, 2.2)
    p.limb(-8, -12, -2, -7.4, 2.2, 1.8)
    p.limb(8, -12, 2, -7.4, 2.2, 1.8)
    head(p, 0, -28.4, 4.1)
    if crown == 'ushnisha':
        p.e(0, -33.6, 2, 1.9)
    sculpt(c, p, ramp)
    face(c, p, ramp, 0, -28.4, 4.1)
    fold(c, p, -5, -22, 4, -10, ramp)
    fold(c, p, -2, -23, 6, -13, ramp)
    fold(c, p, -11, -3, 11, -3, ramp, 2)
    for x in (-4.8, 4.8):
        c.rect(int(cx + x * s), int(by - 29.5 * s), int(cx + x * s), int(by - 25.5 * s), ramp[3])
    return p


def lion(c, cx, by, s, ramp, facing=-1):
    """A lion sitting on its haunches, head up: a gate's guardian."""
    p = Parts(cx, by, s)
    f = facing
    p.limb(-9 * f, -8, -12 * f, -17, 1.6, 1.2)
    p.e(-4.5 * f, -7, 8, 7)
    p.e(-7 * f, -1.6, 4.5, 1.8)
    p.e(3 * f, -13, 6.2, 8.4)
    p.limb(4.5 * f, -10, 5.5 * f, -1.5, 2.6, 2.2)
    p.limb(1 * f, -10, 1.5 * f, -1.5, 2.4, 2)
    p.e(5.6 * f, -1.2, 3, 1.4)
    p.e(2.4 * f, -20, 7.2, 6.8)
    p.e(4.2 * f, -22.4, 5.4, 5)
    p.e(8.4 * f, -21, 2.8, 2.3)
    p.e(1.6 * f, -27, 1.5, 1.5)
    p.e(5.4 * f, -27.4, 1.5, 1.5)
    sculpt(c, p, ramp)
    for a in range(5):
        fold(c, p, (-3 + a * 1.6) * f, -24 + a * 0.6, (-3.6 + a * 1.4) * f, -15 + a * 0.4, ramp, 2)
    c.px(int(cx + 6 * f * s), int(by - 23 * s), ramp[0])
    fold(c, p, 8 * f, -19.6, 10.6 * f, -19.6, ramp, 1)
    return p


def rider(c, cx, by, s, ramp, arm='point'):
    """A horse walking with one foreleg up and a rider on it."""
    p = Parts(cx, by, s)
    p.limb(15, -25, 19.5, -11, 2.2, 1.3)
    p.limb(8, -19, 6.5, -9.5, 2.5, 1.9)
    p.limb(6.5, -9.5, 7.5, -1.4, 1.8, 1.6)
    p.limb(-8, -19, -7, -1.4, 2.4, 1.6)
    p.e(0, -22, 13, 7.2)
    p.e(10.5, -23.5, 6.6, 7.4)
    p.e(-10, -24.5, 6.2, 7.8)
    p.limb(12, -18, 13.5, -9.5, 2.7, 2)
    p.limb(13.5, -9.5, 12, -1.4, 1.9, 1.6)
    p.limb(-11.5, -19.5, -16.5, -14, 2.5, 1.9)
    p.limb(-16.5, -14, -14.5, -8, 1.8, 1.5)
    p.limb(-12, -28, -17, -38, 4.8, 3.2)
    p.e(-20.4, -39.4, 5, 2.9)
    p.e(-16.4, -42.6, 1.2, 1.6)
    p.limb(-1.5, -29, -4.5, -20.5, 2.8, 2.2)
    p.limb(-4.5, -20.5, -5.5, -16, 1.9, 1.7)
    p.e(1, -36.5, 4.8, 7.2)
    if arm == 'point':
        p.limb(4.4, -40, -3, -41, 2, 1.7)
        p.limb(-3, -41, -9.5, -44.5, 1.7, 1.4)
    else:
        p.limb(-2.6, -40, -6.5, -33.5, 2, 1.6)
    head(p, 1, -48.4, 3.4)
    sculpt(c, p, ramp)
    face(c, p, ramp, 1, -48.4, 3.4)
    fold(c, p, -13.5, -27, -18.5, -36.5, ramp, 3)
    fold(c, p, -5, -26, 6, -26.5, ramp, 2)
    c.px(int(cx - 21.5 * s), int(by - 40.4 * s), ramp[0])
    return p


def bust(c, cx, by, s, ramp):
    """Head and shoulders, for a town that could afford no more."""
    p = Parts(cx, by, s)
    p.e(0, -4.4, 8, 4.8)
    head(p, 0, -14.6, 4.6)
    sculpt(c, p, ramp)
    face(c, p, ramp, 0, -14.6, 4.6)
    fold(c, p, -3, -6.5, 0, -2.5, ramp, 2)
    fold(c, p, 3, -6.5, 0, -2.5, ramp, 2)
    return p


# kind: (draw, half width at scale 1, height at scale 1, default pedestal)
KINDS = {
    'draped': (draped, 13, 45, 'classical'),
    'draped-raised': (lambda c, cx, by, s, r: draped(c, cx, by, s, r, 'raised'), 12, 49, 'classical'),
    'orator': (orator, 12, 49, 'classical'),
    'worthy': (lambda c, cx, by, s, r: orator(c, cx, by, s, r, 'hip'), 9, 45, 'classical'),
    'seated': (seated, 14, 36, 'lotus'),
    'lion': (lion, 13, 30, 'stepped'),
    'rider': (rider, 26, 53, 'classical'),
    'bust': (bust, 9, 21, 'pillar'),
}


def statue(kind, material='bronze', size=1, pedestal=None, stone='limestone', pigeon=False, kinds=None):
    """One statue. `size` is the town's rank; a bigger town also stands the
    same figure on a taller pedestal."""
    draw, half, height, default = (kinds or KINDS)[kind]
    pedestal = pedestal or default
    s = SCALE[size]
    ramp, rock = MATERIAL[material], MATERIAL[stone]
    fw = int(half * s) * 2 + 4
    base = {'classical': 8 + size * 7, 'stepped': 3 * (2 + size), 'lotus': 10, 'pillar': 12 + size * 6,
            'column': 34 + size * 16, 'boulder': 8 + size * 4, 'none': 0}[pedestal]
    pw = max(10, int(half * s * 1.5) // 2 * 2 + (4 if pedestal == 'classical' else 0))
    W = max(fw, pw + 12 + (0 if pedestal != 'stepped' else (2 + size) * 6)) + 6
    H = int(height * s) + base + 12
    c = C(W, H)
    cx, by = W // 2, H - 2
    if pedestal == 'classical':
        top = classical(c, cx, by, pw, base, rock)
    elif pedestal == 'stepped':
        top = stepped(c, cx, by, pw, 2 + size, rock) - 1
    elif pedestal == 'lotus':
        top = lotus(c, cx, by, pw + 2, rock if material in rock_like else ramp)
    elif pedestal == 'pillar':
        top = pillar(c, cx, by, max(4, pw // 2 - 1), base, rock, capital=True)
    elif pedestal == 'column':
        top = pillar(c, cx, by, 3 + size, base, rock)
    elif pedestal == 'boulder':
        top = boulder(c, cx, by, pw + 6, base + 2, rock)
    else:
        top = by
    p = draw(c, cx, top + 1, s, ramp)
    im = outline(c.im)
    if pigeon:
        c = after(im)
        _pigeon(c, cx - 5, int(p.top()) + 1)
        im = c.im
    return im


rock_like = ('marble', 'limestone', 'sandstone', 'redstone', 'granite', 'basalt')


# kind: the materials it was made in, commonest first.
CAST = {
    'draped': ('marble', 'bronze'), 'draped-raised': ('marble', 'bronze'), 'orator': ('bronze', 'verdigris'),
    'worthy': ('bronze', 'verdigris'), 'seated': ('sandstone', 'gilt'), 'lion': ('limestone', 'granite'),
    'rider': ('bronze', 'verdigris', 'gilt'), 'bust': ('marble', 'bronze'),
    'cuirass': ('marble', 'bronze'), 'goddess': ('marble', 'verdigris'), 'athlete': ('marble', 'bronze'),
    'victory': ('gilt', 'bronze'), 'saint': ('limestone', 'sandstone'), 'knight': ('sandstone', 'limestone'),
    'king': ('bronze', 'marble'), 'soldier': ('bronze', 'granite'), 'worker': ('bronze', 'granite'),
    'pharaoh': ('granite', 'sandstone'), 'striding': ('basalt', 'limestone'), 'sphinx': ('sandstone', 'granite'),
    'lamassu': ('limestone', 'basalt'),
    'buddha-standing': ('sandstone', 'gilt'), 'bodhisattva': ('gilt', 'sandstone'), 'guardian': ('wood', 'granite'),
    'official': ('granite', 'limestone'), 'foo-lion': ('granite', 'marble'), 'haechi': ('granite', 'limestone'),
    'nandi': ('basalt', 'granite'), 'vishnu': ('granite', 'bronze'), 'nataraja': ('bronze', 'verdigris'),
    'tirthankara': ('granite', 'marble'), 'elephant': ('granite', 'redstone'), 'naga-buddha': ('sandstone', 'gilt'),
    'jizo': ('granite', 'limestone'),
    'olmec-head': ('basalt',), 'chacmool': ('limestone', 'basalt'), 'atlantean': ('basalt', 'sandstone'),
    'serpent-head': ('basalt', 'limestone'), 'monolith': ('redstone', 'basalt'), 'moai': ('basalt', 'granite'),
    'moai-topknot': ('basalt',), 'tiki': ('wood', 'basalt'), 'totem': ('wood',), 'balbal': ('granite', 'sandstone'),
    'benin-head': ('bronze',), 'zimbabwe-bird': ('granite', 'sandstone'), 'ancestor': ('wood', 'terracotta'),
    'terracotta-seated': ('terracotta',), 'eagle': ('bronze', 'gilt'),
}
# What the pedestal is cut from where the figure's own stone would be wrong.
PLINTH = {'bronze': 'granite', 'verdigris': 'limestone', 'gilt': 'marble', 'wood': 'granite', 'terracotta': 'sandstone'}


def all_kinds():
    from . import statuary_classical, statuary_asia, statuary_world
    return {**KINDS, **statuary_classical.KINDS, **statuary_asia.KINDS, **statuary_world.KINDS}


def variants():
    """Every baked statue, named kind/material/size: what
    src/content/settlements/statues.ts asks for."""
    # The commonest material at every size; the others at a city's size only,
    # which keeps the shadow sheet inside one page.
    return [(f'{kind}/{material}/{size}', kind, material, size)
            for kind, made in CAST.items() for i, material in enumerate(made)
            for size in (range(3) if i == 0 else (1,))]


def statuary(v=0):
    _, kind, material, size = variants()[v]
    return statue(kind, material, size, stone=PLINTH.get(material, material), kinds=all_kinds(),
                  pigeon=kind in ('worthy', 'orator') and material == 'verdigris' and size == 1)


STATUARY = {'statuary': statuary}


if __name__ == '__main__':
    from pathlib import Path
    from .plaza_families import sheet
    kinds = list(CAST)
    names = [v[0] for v in variants()]
    rows = [(' / '.join(group).upper(), [(f'{k} {m}', statuary, names.index(f'{k}/{m}/{z}'))
                                          for k in group for z, m in ((1, CAST[k][0]), (2, CAST[k][-1]))])
            for group in (kinds[i:i + 5] for i in range(0, len(kinds), 5))]
    print(sheet(Path(__file__).resolve().parents[3] / 'artifacts/statuary.png', rows))
