"""Monuments a square is built round, drawn to the city kit's standard.

Figures are built from overlapping parts, each shaded on its own from its
silhouette, so an arm reads against the body behind it. Forms are generic
types from the record (an equestrian bronze, a market cross, a bixi stele), not
portraits of any particular monument.
"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from art.city_kit import C, outline, mix, rgba, h2, LIME, WATER, IRON, GOLD

VERDIGRIS = ['#11161b', '#1b2a2b', '#27413a', '#33594a', '#46785e', '#68a07d', '#a2cfa8']
BRONZE = ['#140f16', '#2b1c1c', '#4a3025', '#6d4a31', '#936a40', '#b98f57', '#dcbd84']
GILT = ['#2a1a14', '#553519', '#8a5d22', '#b88a33', '#d8b04c', '#eed27a', '#fbeeb0']
MARBLE = ['#3a3446', '#676170', '#948d97', '#b8b0b1', '#d6cec6', '#ebe4d8', '#fbf7ee']
GRANITE = ['#1b1925', '#2d2b39', '#44414e', '#5c5863', '#77717a', '#948d90', '#b4adab']
RED_GRANITE = ['#22131b', '#3e2129', '#5b3333', '#784943', '#946356', '#af7e6c', '#c99f8a']
SANDSTONE = ['#2d1e25', '#553839', '#83584a', '#ab7c5e', '#c99e75', '#e1be91', '#f2dab0']
RED_SANDSTONE = ['#241219', '#462024', '#6d3129', '#92452f', '#b25e3c', '#cb7d52', '#e0a172']
CONCRETE = ['#25252d', '#3e3e46', '#5a595f', '#767479', '#928f92', '#adaaa9', '#c9c5c0']
CORTEN = ['#1d0e13', '#3b1919', '#61271e', '#883a23', '#ad562c', '#c9763c', '#e09a58']
STEEL = ['#1a1d2a', '#2e3445', '#4a5263', '#6b7482', '#919aa4', '#bcc3c8', '#eef1f0']
LEAD = ['#1a1a28', '#2c2e40', '#434760', '#5d637c', '#7b8298', '#a0a7b8', '#c8cdd6']
TILE_TEAL = ['#0f2027', '#173541', '#1f4d5a', '#2b6a74', '#43898f', '#6eaaa9', '#a8d0c8']
RED_PAINT = ['#3a1216', '#6b1f22', '#9a3029', '#be4a34']
FLAME = ['#8e2a1c', '#d8622a', '#f5a53c', '#fde58a']

L = np.array([-0.6, -0.7, 0.4]) / 1.005


def _shade(c, mask, ramp, dim=0, soft=1.3, lo=1, hi=6):
    a = np.asarray(mask) > 127
    if not a.any():
        return
    b = np.asarray(mask.filter(ImageFilter.GaussianBlur(soft)), float) / 255
    gy, gx = np.gradient(b)
    nx, ny, nz = -gx * 5, -gy * 5, np.full(b.shape, 0.42)
    n = np.sqrt(nx * nx + ny * ny + nz * nz)
    l = (nx * L[0] + ny * L[1] + nz * L[2]) / n
    t = np.clip((l + 0.45) / 1.3, 0, 1)
    k = np.clip(lo + (t * (hi - lo + 0.99)).astype(int) - dim, 0, len(ramp) - 1)
    ys, xs = np.nonzero(a)
    for x, y, i in zip(xs, ys, k[ys, xs]):
        c.px(int(x), int(y), ramp[i])


class Sculpt:
    """Parts in unit coordinates (feet at 0, a man 100 tall), shaded one by one
    back to front on their own layer, outlined as one figure by done()."""

    def __init__(self, c, x, y, s, ramp):
        self.c, self.x, self.y, self.s, self.ramp = c, x, y, s, ramp
        self.l = C(c.w, c.h)
        self.mask = None

    def p(self, u, v):
        return (self.x + u * self.s, self.y + v * self.s)

    def part(self, *shapes, dim=0, soft=1.2, ramp=None):
        m = Image.new('L', (self.c.w, self.c.h))
        d = ImageDraw.Draw(m)
        for sh in shapes:
            kind, args = sh[0], sh[1:]
            if kind == 'poly':
                d.polygon([self.p(*q) for q in args[0]], fill=255)
            elif kind == 'ell':
                (u, v), ru, rv = args
                x, y = self.p(u, v)
                d.ellipse((x - ru * self.s, y - rv * self.s, x + ru * self.s - 1, y + rv * self.s - 1), fill=255)
            elif kind == 'limb':
                pts, w = args
                pts = [self.p(*q) for q in pts]
                r = max(1, w * self.s)
                d.line(pts, fill=255, width=max(1, round(r)))
                for x, y in pts:
                    d.ellipse((x - r / 2, y - r / 2, x + r / 2 - 1, y + r / 2 - 1), fill=255)
        _shade(self.l, m, ramp or self.ramp, dim, soft)
        self.mask = np.asarray(m) > 127
        return self

    def fold(self, *lines, tone=2):
        """Dark creases, clipped to the last part, each with a lit lip left of it."""
        m = Image.new('L', (self.c.w, self.c.h))
        d = ImageDraw.Draw(m)
        for q in lines:
            d.line([self.p(*pt) for pt in q], fill=255)
        ys, xs = np.nonzero((np.asarray(m) > 0) & self.mask)
        for x, y in zip(xs, ys):
            x, y = int(x), int(y)
            self.l.px(x, y, self.ramp[tone])
            if x > 0 and self.mask[y, x - 1]:
                self.l.px(x - 1, y, self.ramp[min(6, tone + 3)])
        return self

    def done(self):
        if self.ramp is VERDIGRIS:
            q = self.l.p
            for x in range(self.l.w):
                if h2(x, 3, 11) > 0.4:
                    continue
                run = 0
                for y in range(self.l.h):
                    if q[x, y][3] == 0:
                        run = 0
                        continue
                    run += 1
                    if run < 4 + int(h2(x, y // 9, 5) * 8):
                        k = next((i for i, col in enumerate(VERDIGRIS) if rgba(col) == q[x, y]), None)
                        if k is not None and 1 <= k < 6:
                            q[x, y] = rgba(VERDIGRIS[k + 1] if run < 3 else VERDIGRIS[max(k, 4)])
        self.c.blit(outline(self.l.im, 0.35, 0.8), 0, 0)
        return self


def poly(*q):
    return ('poly', q)


def ell(u, v, ru, rv=None):
    return ('ell', (u, v), ru, rv or ru)


def limb(w, *q):
    return ('limb', q, w)


# ---------------------------------------------------------------- figures

def standing(c, x, y, s, ramp, pose='raise', cloak=False, hat=False, robe=False):
    f = Sculpt(c, x, y, s, ramp)
    if cloak:
        f.part(poly((-12, -82), (12, -82), (24, -4), (16, 1), (-17, 1), (-22, -6)), dim=1, soft=2)
        f.fold([(-14, -60), (-18, -4)], [(16, -56), (20, -6)], [(8, -40), (10, -2)])
    if robe:
        f.part(poly((-11, -82), (11, -82), (15, -30), (17, 0), (-17, 0), (-14, -30)), soft=2)
        f.fold([(-7, -50), (-9, -2)], [(2, -40), (3, -2)], [(10, -34), (12, -2)])
        f.part(poly((-12, -82), (6, -82), (-2, -52), (15, -28), (8, -22), (-14, -46)), soft=1.2)
        f.fold([(-8, -74), (-4, -54), (8, -30)])
    else:
        f.part(limb(9, (4, -46), (6, -2)), dim=1)
        f.part(limb(9, (-4, -46), (-7, -2)))
        f.part(ell(-8, -2, 5.5, 2.6), ell(7, -2, 5.5, 2.6), dim=1)
        f.part(poly((-12, -82), (12, -82), (10, -56), (14, -32), (-14, -32), (-10, -56)), soft=1.8)
        f.fold([(0, -80), (1, -56)], [(-6, -52), (-9, -33)], [(6, -52), (9, -33)], [(-10, -56), (10, -56)])
    f.part(ell(-10, -79, 5.5, 4.5), ell(10, -79, 5.5, 4.5), soft=1.5)
    if pose == 'chest':
        f.part(limb(7, (-11, -78), (-13, -54), (-10, -40)))
        f.part(limb(7, (11, -78), (13, -64), (2, -62)))
    elif pose == 'sword':
        f.part(limb(7, (-11, -78), (-14, -60), (-12, -48)))
        f.part(limb(2.4, (-12, -52), (-14, -6)), dim=1)
        f.part(limb(2, (-17, -52), (-8, -52)), dim=1)
        f.part(limb(7, (11, -78), (14, -62), (12, -50)))
    elif pose == 'bowed':
        f.part(limb(7, (-11, -78), (-8, -60), (0, -52)))
        f.part(limb(7, (11, -78), (8, -60), (0, -54)))
    else:
        f.part(limb(7, (-11, -78), (-14, -60), (-12, -44)))
        f.part(limb(7.5, (10, -79), (20, -94), (25, -111)))
        f.part(ell(25.5, -113, 4.5))
    f.part(limb(7, (0, -80), (0, -86)), dim=2)
    hy = -84 if pose == 'bowed' else -92
    f.part(ell(0, hy, 7, 8.5))
    f.part(ell(1, hy - 4, 6.5, 4.5), dim=1)
    if hat:
        f.part(poly((-14, hy - 5), (14, hy - 5), (8, hy - 14), (-8, hy - 14)), dim=1)
    return f.done()


def rider(c, x, y, s, ramp, raise_arm=True, rearing=False):
    """A horse in profile facing west with its rider: the equestrian bronze."""
    f = Sculpt(c, x, y, s, ramp)
    f.part(limb(9, (18, -54), (14, -36)), limb(6, (14, -36), (10, -16), (12, -3)), ell(13, -2, 4, 2.5), dim=2)
    if rearing:
        f.part(limb(9, (-18, -56), (-30, -54)), limb(6, (-30, -54), (-36, -42)), dim=2)
    else:
        f.part(limb(9, (-18, -54), (-26, -44)), limb(6, (-26, -44), (-34, -34)), dim=2)
    f.part(limb(8, (28, -68), (36, -56), (35, -36)), soft=1.8)
    f.fold([(30, -64), (35, -40)])
    f.part(ell(0, -60, 30, 16), soft=3)
    f.fold([(-14, -50), (18, -50)], tone=3)
    f.part(limb(11, (22, -58), (27, -38)), limb(6, (27, -38), (24, -18), (26, -3)), ell(27, -2, 4, 2.5))
    if rearing:
        f.part(limb(9, (-20, -54), (-32, -58)), limb(6, (-32, -58), (-38, -48)))
    else:
        f.part(limb(10, (-20, -54), (-22, -36)), limb(6, (-22, -36), (-22, -3)), ell(-23, -2, 4, 2.5))
    f.part(poly((-12, -70), (-22, -92), (-30, -104), (-40, -100), (-36, -84), (-28, -56)), soft=2.2)
    f.part(limb(4, (-14, -74), (-24, -94), (-31, -104)), dim=2)
    f.part(poly((-30, -106), (-40, -102), (-54, -84), (-54, -76), (-46, -74), (-32, -90)), soft=1.6)
    f.part(limb(3, (-33, -104), (-33, -111)), dim=1)
    f.part(poly((-12, -76), (12, -76), (14, -58), (-10, -58)), dim=1, soft=1)
    f.part(limb(11, (-2, -74), (-8, -62), (-5, -46)), ell(-6, -45, 4, 3))
    f.part(poly((-9, -76), (9, -76), (8, -102), (-6, -104)), soft=1.8)
    f.fold([(0, -100), (2, -78)])
    if raise_arm:
        f.part(limb(7, (-3, -100), (-14, -112), (-20, -122)))
        f.part(ell(-21, -124, 7, 3))
    else:
        f.part(limb(7, (-3, -100), (-12, -94), (-20, -96)))
        f.part(limb(2, (-20, -96), (-44, -108)), dim=1)
    f.part(limb(7, (1, -102), (1, -108)), dim=2)
    f.part(ell(1, -112, 6.5, 7.5))
    f.part(poly((-13, -116), (15, -116), (7, -128), (-5, -128)), dim=1)
    return f.done()


# ---------------------------------------------------------------- masonry

def box(c, cx, base, hw, h, ramp, depth=None, face=4):
    """A block facing south: front face, a sliver of east wall and a lit top,
    receding straight back. Returns (front top y, depth)."""
    d = depth if depth is not None else max(2, round(hw * 0.55))
    x0, x1, top = cx - hw, cx + hw, base - h + 1
    for k in range(d, 0, -1):
        dx = round(k * 4 / max(d, 8))
        c.vl(x1 + dx, top - k, base - k, ramp[2])
        c.hl(x0 + dx, x1 + dx, top - k, ramp[5] if k > 1 else ramp[6])
    c.rect(x0, top, x1, base, ramp[face])
    c.vl(x0, top, base, ramp[face + 1])
    c.vl(x1, top, base, ramp[face - 2])
    c.hl(x0, x1, top, ramp[min(6, face + 1)])
    c.hl(x0, x1, base, ramp[face - 2])
    return top, d


def stack(c, cx, base, tiers, ramp):
    """Blocks set one on another, each centred on the one below.
    `tiers` is (half width, height[, face tone]) from the ground up."""
    y, prev = base, None
    for t in tiers:
        hw, h = t[0], t[1]
        d = max(2, round(hw * 0.55))
        if prev is not None:
            y -= (prev - d) // 2
        top, _ = box(c, cx + (0 if prev is None else 0), y, hw, h, ramp, d, t[2] if len(t) > 2 else 4)
        prev, y = d, top - 1
    return y + 1, prev


def railing(c, x0, x1, y, h=9, step=3, gate=True):
    cx = (x0 + x1) // 2
    for x in range(x0, x1 + 1, step):
        if gate and abs(x - cx) < 5:
            continue
        c.vl(x, y - h, y, IRON[2])
        c.px(x, y - h - 1, IRON[3]); c.px(x, y - h - 2, IRON[3])
        c.px(x - 1, y - h, IRON[2]); c.px(x + 1, y - h, IRON[1])
    c.hl(x0, x1, y - h + 2, IRON[1])
    c.hl(x0, x1, y - 2, IRON[1])
    if gate:
        for x in (cx - 5, cx + 5):
            c.rect(x, y - h - 3, x + 1, y, IRON[2]); c.px(x, y - h - 5, GOLD[2]); c.px(x + 1, y - h - 5, GOLD[1])
            c.px(x, y - h - 4, IRON[3])
        for x in range(cx - 3, cx + 4, 2):
            c.vl(x, y - h - 1 + abs(x - cx) // 2, y, IRON[1])
        c.hl(cx - 4, cx + 4, y - 4, IRON[2])


def plaque(c, x0, y0, x1, y1, ramp, metal=BRONZE):
    c.rect(x0, y0, x1, y1, metal[3])
    c.hl(x0, x1, y0, metal[5])
    c.vl(x0, y0, y1, metal[4])
    c.hl(x0, x1, y1, metal[1])
    c.vl(x1, y0, y1, metal[2])
    for y in range(y0 + 2, y1 - 1, 2):
        c.hl(x0 + 2, x1 - 2 - (y * 3) % 4, y, metal[2])


def ground(c, cx, base, hw, ramp):
    """The shadow the piece throws down and to the right."""
    for y in range(base - 1, base + 4):
        for x in range(cx - hw, cx + hw + 8):
            u = (x - cx - 4) / (hw + 3)
            v = (y - base - 1) / 3
            if u * u + v * v <= 1 and c.get(x, y)[3] == 0:
                c.px(x, y, mix(ramp[0], ramp[1], 0.3))


# ---------------------------------------------------------------- pieces

def equestrian(stone=GRANITE, metal=VERDIGRIS, rails=True, rearing=False):
    c = C(104, 136)
    cx, base = 50, 132
    y, d = pedestal(c, cx, base, 24, 22, stone, rails=rails, relief=rearing)
    rider(c, cx + 2, y - d // 2 + 1, 0.56, metal, raise_arm=not rearing, rearing=rearing)
    im = outline(c.im, 0.3, 0.6)
    if rails:
        c2 = C(104, 136)
        c2.blit(im, 0, 0)
        railing(c2, cx - 38, cx + 38, base - 1, h=9)
        im = c2.im
    return im


def statue(stone=GRANITE, metal=VERDIGRIS, pose='raise', cloak=False, rails=False, robe=False, hat=False):
    c = C(84, 124)
    cx, base = 40, 120
    y, d = pedestal(c, cx, base, 15, 24, stone, rails=rails, relief=cloak)
    standing(c, cx + 1, y - d // 2 + 1, 0.5, metal, pose=pose, cloak=cloak, robe=robe, hat=hat)
    im = outline(c.im, 0.3, 0.6)
    if rails:
        c2 = C(84, 124)
        c2.blit(im, 0, 0)
        railing(c2, cx - 30, cx + 30, base - 1, h=9)
        im = c2.im
    return im


def basin(c, cx, cy, rx, ry, wall, ramp, octagon=False, rings=()):
    """A moulded basin whose rim sits on (cx, cy); water a step below it.
    `rings` are (x, y) points where water falls, ringed with ripples."""
    def norm(x, y, rx, ry, oy=0):
        u, v = abs(x + .5 - cx) / rx, abs(y + .5 - cy - oy) / ry
        return max(u, v, (u + v) / 1.414) if octagon else math.hypot(u, v)
    for x in range(cx - rx, cx + rx + 1):
        low = max((y for y in range(cy, cy + ry + 1) if norm(x, y, rx, ry) <= 1), default=None)
        if low is None:
            continue
        u = (x - cx) / rx
        tone = 5 if u < -0.45 else 4 if u < 0.2 else 3 if u < 0.6 else 2
        c.vl(x, low, low + wall, ramp[tone])
        c.px(x, low + 1, ramp[min(6, tone + 1)])
        c.px(x, low + 2, ramp[max(1, tone - 2)])
        c.px(x, low + wall, ramp[1])
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            n = norm(x, y, rx, ry)
            if n <= 1:
                c.px(x, y, ramp[6] if y < cy - ry // 2 else ramp[5] if n > 0.93 else ramp[4])
            if norm(x, y, rx - 3, ry - 2, 1) <= 1:
                v = (y - cy + ry) / (2 * ry)
                col = WATER[1] if v < 0.28 else WATER[2] if v < 0.6 else WATER[3]
                if norm(x, y, rx - 3, ry - 2, 1) > 0.9 and y < cy:
                    col = WATER[0]
                c.px(x, y, col)
    for k, w in ((0, 0.55), (3, 0.3), (5, 0.45)):
        x0 = cx - round(rx * w)
        c.hl(x0, x0 + round(rx * w * 0.5), cy + 2 + k, WATER[4])
        c.hl(x0 + 2, x0 + round(rx * w * 0.2), cy + 2 + k, WATER[5])
    for px, py in rings:
        for r in (3, 6):
            for a in range(0, 360, 15):
                t = math.radians(a)
                x, y = round(px + math.cos(t) * r), round(py + math.sin(t) * r * 0.35)
                if norm(x, y, rx - 3, ry - 2, 1) <= 1 and a % 60:
                    c.px(x, y, WATER[4] if math.sin(t) > 0 else WATER[3])


def jet(c, x, y, h, spread=0, fall=0):
    c.vl(x, y - h, y, WATER[5])
    c.vl(x + 1, y - h + 1, y, WATER[4])
    c.px(x, y - h - 1, WATER[4])
    for side in (-1, 1):
        if spread:
            stream(c, x, y - h, x + side * spread, y - h + spread + fall)


def statue_fountain(octagon=False, pose='raise', metal=VERDIGRIS, stone=LIME):
    c = C(108, 120)
    cx, base = 52, 104
    basin(c, cx, base - 6, 48, 13, 6, stone, octagon, rings=((cx - 22, base - 4), (cx + 24, base - 4)))
    y, d = stack(c, cx, base - 6, [(12, 4), (10, 3, 5), (8, 18, 4), (11, 3, 5)], stone)
    c.hl(cx - 8, cx + 8, y + 4, stone[2])
    for sx in (-1, 1):
        mask(c, cx + sx * 5, y + 12, BRONZE)
        stream(c, cx + sx * 7, y + 13, cx + sx * 22, base - 5, lift=2)
    standing(c, cx + 1, y - d // 2 + 1, 0.46, metal, pose=pose, robe=True)
    return outline(c.im, 0.3, 0.6)


def tiered_fountain(stone=LIME, octagon=False):
    c = C(104, 110)
    cx, base = 50, 104
    basin(c, cx, base - 6, 46, 12, 6, stone, octagon, rings=((cx - 22, base - 2), (cx + 22, base - 2)))
    c.rect(cx - 3, base - 42, cx + 3, base - 8, stone[4])
    c.vl(cx - 3, base - 42, base - 8, stone[5]); c.vl(cx + 3, base - 42, base - 8, stone[2])
    c.hl(cx - 4, cx + 4, base - 20, stone[5]); c.hl(cx - 4, cx + 4, base - 19, stone[2])
    basin(c, cx, base - 44, 20, 5, 4, stone)
    for x in range(cx - 19, cx + 20, 2):
        if abs(x - cx) < 5:
            continue
        top, bot = base - 38, base - 6 + int(h2(x, 0, 2) * 3)
        for yy in range(top, bot):
            k = (yy - top + (x * 5) % 7) % 9
            c.px(x + (x - cx) // 12 * ((yy - top) // 10), yy, WATER[5] if k < 3 else WATER[4] if k < 6 else WATER[3])
    c.rect(cx - 2, base - 62, cx + 2, base - 46, stone[4]); c.vl(cx - 2, base - 62, base - 46, stone[5])
    c.vl(cx + 2, base - 62, base - 46, stone[2])
    basin(c, cx, base - 64, 9, 3, 3, stone)
    for sx in (-1, 1):
        stream(c, cx + sx * 9, base - 62, cx + sx * 13, base - 45)
    jet(c, cx, base - 65, 8, 5, 3)
    return outline(c.im, 0.3, 0.6)


def hero(stone=GRANITE, metal=GRANITE, banner=True):
    """A striding figure on a tall pylon: the socialist-realist square."""
    c = C(84, 150)
    cx, base = 40, 146
    y, d = stack(c, cx, base, [(26, 3, 3), (22, 4), (14, 44, 4), (16, 3, 5)], stone)
    for k in range(3):
        c.hl(cx - 13, cx + 13, y + 16 + k * 9, stone[2]); c.hl(cx - 13, cx + 13, y + 17 + k * 9, stone[5])
    c.rect(cx - 6, y + 6, cx + 6, y + 12, GOLD[2]); c.hl(cx - 6, cx + 6, y + 6, GOLD[3])
    f = Sculpt(c, cx + 1, y - d // 2 + 1, 0.6, metal)
    f.part(limb(10, (4, -46), (16, -2)), dim=1)
    f.part(limb(10, (-4, -46), (-12, -4)))
    f.part(poly((-12, -84), (12, -84), (28, -28), (18, -22), (-14, -36)), soft=2)
    f.fold([(4, -76), (18, -28)], [(-6, -66), (-10, -38)], [(10, -56), (24, -30)])
    f.part(ell(-10, -81, 6.5, 4.5), ell(10, -81, 6.5, 4.5))
    f.part(limb(8, (-11, -80), (-16, -60), (-10, -44)), ell(-10, -42, 4.5))
    if banner:
        f.part(limb(2.2, (16, -150), (18, -60)), dim=1)
        f.part(poly((17, -150), (-10, -146), (-22, -134), (-6, -128), (17, -124)), soft=1.6)
        f.fold([(10, -146), (0, -130)], [(-4, -144), (-12, -134)])
        f.part(limb(8, (11, -80), (18, -96), (17, -110)))
    else:
        f.part(limb(8, (11, -80), (22, -98), (26, -118)), ell(26, -121, 5))
    f.part(limb(8, (0, -82), (0, -88)), dim=2)
    f.part(ell(0, -95, 7, 8.5))
    f.part(ell(2, -99, 6.5, 4.5), dim=1)
    f.done()
    return outline(c.im, 0.3, 0.6)


def soldier(stone=GRANITE, metal=BRONZE):
    """A soldier in a greatcoat, head bowed, hands folded on a reversed rifle:
    the interwar village and town memorial."""
    c = C(84, 124)
    cx, base = 40, 120
    y, d = pedestal(c, cx, base, 14, 26, stone, relief=True)
    f = Sculpt(c, cx + 1, y - d // 2 + 1, 0.56, metal)
    f.part(limb(9, (-5, -16), (-6, -2)), limb(9, (5, -16), (6, -2)), ell(-7, -2, 5, 2.5), ell(7, -2, 5, 2.5), dim=1)
    f.part(poly((-12, -80), (12, -80), (17, -12), (-17, -12)), soft=2)
    f.fold([(-6, -60), (-10, -14)], [(4, -56), (6, -14)], [(11, -46), (14, -14)], [(-11, -52), (11, -52)])
    f.part(limb(3, (0, -60), (0, -4)), dim=1)
    f.part(ell(-10, -77, 5.5, 4.5), ell(10, -77, 5.5, 4.5))
    f.part(limb(7, (-11, -76), (-7, -62), (0, -60)))
    f.part(limb(7, (11, -76), (9, -63), (1, -61)))
    f.part(limb(7, (0, -78), (0, -82)), dim=2)
    f.part(ell(0, -84, 6.5, 7.5))
    f.part(ell(0, -89, 13, 3.5), dim=1)
    f.part(ell(0, -91, 7, 4))
    f.done()
    return outline(c.im, 0.3, 0.6)


def cenotaph(stone=LIME, wreath_on=True):
    """A stepped pylon with a tomb chest on top and a wreath laid at its face."""
    c = C(64, 116)
    cx, base = 30, 112
    y, d = stack(c, cx, base, [(26, 3, 3), (23, 3), (20, 3), (15, 12)], stone)
    for w, h in ((13, 18), (12, 16), (11, 14)):
        top, dd = box(c, cx, y - 1 - (d - round(w * 0.55)) // 2, w, h, stone)
        c.hl(cx - w, cx + w, top + 1, stone[5])
        y, d = top, dd
    c.rect(cx - 7, y + 5, cx + 7, y + 7, stone[3]); c.hl(cx - 7, cx + 7, y + 5, stone[2])
    top, dd = box(c, cx, y - 1, 13, 4, stone, face=5)
    c.hl(cx - 11, cx + 11, top + 4, stone[2])
    for k in range(5):
        c.hl(cx - 9 + k, cx + 9 - k, top - dd + 2 - k, stone[5 if k < 4 else 6])
    text_y = base - 10
    for x in range(cx - 10, cx + 11, 3):
        c.hl(x, x + 1, text_y, stone[2])
    if wreath_on:
        wreath(c, cx, base - 34, 6)
    return outline(c.im, 0.3, 0.6)


GREEN_W = ['#15291f', '#2a4c33', '#46703f', '#6f9a54', '#a3c374']


def abstract(metal=CORTEN):
    c = C(84, 110)
    cx, base = 40, 106
    y, d = stack(c, cx, base, [(30, 3, 3), (26, 3)], CONCRETE)
    if metal is CORTEN:
        plates = [((-26, 0), (-17, 0), (-2, -74), (-11, -76)), ((22, 0), (13, 0), (-6, -66), (4, -68)),
                  ((-24, -38), (20, -48), (20, -41), (-24, -31))]
        for n, pl in enumerate(plates):
            pts = [(cx + u, y - d // 2 + v) for u, v in pl]
            for k in range(3, 0, -1):
                ImageDraw.Draw(c.im).polygon([(x + k, yy - k) for x, yy in pts], fill=rgba(metal[1]))
            ImageDraw.Draw(c.im).polygon(pts, fill=rgba(metal[4 - n % 2]))
            ImageDraw.Draw(c.im).line(pts[2:] + pts[:1], fill=rgba(metal[5]))
            c.p = c.im.load()
        for x in range(cx - 28, cx + 26):
            for yy in range(y - 80, y):
                if c.get(x, yy)[:3] == rgba(metal[4])[:3] and h2(x, yy // 4, 9) < 0.18:
                    c.px(x, yy, metal[3])
    else:
        f = Sculpt(c, cx, y - d // 2, 1, metal)
        f.part(ell(0, -40, 24, 38), soft=4)
        m = Image.new('L', (c.w, c.h))
        ImageDraw.Draw(m).ellipse((cx - 13, y - d // 2 - 64, cx + 12, y - d // 2 - 18), fill=255)
        q = f.l.p
        for (yy, x) in zip(*np.nonzero(np.asarray(m))):
            q[int(x), int(yy)] = (0, 0, 0, 0)
        for yy in range(y - d // 2 - 76, y - d // 2 - 4):
            x = cx - 20 + (yy % 7 == 0)
            if f.l.get(x, yy)[3]:
                f.l.px(x, yy, metal[6])
        f.done()
    return outline(c.im, 0.3, 0.6)
def roman_column(stone=MARBLE, metal=GILT):
    c = C(52, 170)
    cx, base = 24, 166
    y, d = stack(c, cx, base, [(18, 3), (15, 22, 4), (16, 3, 5)], stone)
    plaque(c, cx - 9, y + 7, cx + 9, y + 17, stone, stone)
    for k in range(92):
        hw = 7 - (k > 60)
        yy = y - 3 - k
        c.hl(cx - hw, cx + hw, yy, stone[4])
        c.px(cx - hw, yy, stone[5]); c.px(cx - hw + 1, yy, stone[5])
        c.px(cx + hw, yy, stone[2]); c.px(cx + hw - 1, yy, stone[3])
        for x in range(cx - hw + 1, cx + hw):
            if (x - cx + k) % 9 == 0:
                c.px(x, yy, stone[3])
    y = y - 95
    box(c, cx, y + 2, 7, 3, stone, depth=2)
    box(c, cx, y - 1, 10, 3, stone, depth=4)
    standing(c, cx + 1, y - 5, 0.34, metal, pose='raise', robe=True)
    return outline(c.im)


def market_cross(lantern=False, stone=LIME):
    c = C(72, 130)
    cx, base = 34, 126
    y, d = stack(c, cx, base, [(30, 5), (24, 5), (18, 5), (10, 6)], stone)
    for k in range(56):
        hw = 3 - k // 30
        c.hl(cx - hw, cx + hw, y - k, stone[4]); c.px(cx - hw, y - k, stone[5]); c.px(cx + hw, y - k, stone[2])
    y -= 56
    if lantern:
        box(c, cx, y, 7, 3, stone, depth=3)
        for x0 in (cx - 6, cx + 2):
            c.rect(x0, y - 13, x0 + 4, y - 3, stone[4]); c.rect(x0 + 1, y - 11, x0 + 3, y - 4, stone[1])
            c.px(x0 + 2, y - 12, stone[1])
        box(c, cx, y - 13, 8, 2, stone, depth=3)
        for k in range(8):
            c.hl(cx - 6 + k * 3 // 4, cx + 6 - k * 3 // 4, y - 16 - k, stone[4 if k % 2 else 5])
        c.vl(cx, y - 30, y - 24, stone[5]); c.hl(cx - 2, cx + 2, y - 28, stone[5])
    else:
        c.rect(cx - 2, y - 22, cx + 2, y, stone[4]); c.vl(cx - 2, y - 22, y, stone[5]); c.vl(cx + 2, y - 22, y, stone[2])
        c.rect(cx - 10, y - 16, cx + 10, y - 12, stone[4]); c.hl(cx - 10, cx + 10, y - 16, stone[5]); c.hl(cx - 10, cx + 10, y - 12, stone[2])
        for dx in (-10, 10, 0):
            c.px(cx + dx, y - 14 if dx else y - 23, stone[6])
    return outline(c.im)


def sadirvan(stone=MARBLE, roof=LEAD):
    """An octagonal ablution fountain under a broad eaved roof."""
    c = C(104, 104)
    cx, base = 50, 100
    basin(c, cx, base - 10, 34, 10, 10, stone, octagon=True)
    c.rect(cx - 26, base - 20, cx + 26, base - 12, stone[4])
    for x in range(cx - 24, cx + 25, 6):
        c.px(x, base - 13, BRONZE[5]); c.px(x, base - 12, BRONZE[3]); c.px(x, base - 11, WATER[5])
    for x in (cx - 40, cx - 20, cx + 20, cx + 40):
        c.rect(x - 1, base - 58, x + 1, base - 10 if abs(x - cx) > 30 else base - 20, TILE_TEAL[5] if x < cx else TILE_TEAL[3])
    for k in range(10):
        hw = 50 - k * 2
        c.hl(cx - hw, cx + hw, base - 60 - k, roof[5 if k < 2 else 4])
        c.hl(cx + hw - 12, cx + hw, base - 60 - k, roof[2])
    c.hl(cx - 50, cx + 50, base - 59, roof[1])
    for k in range(18):
        hw = round(24 * math.sqrt(max(0, 1 - (k / 18) ** 2)))
        c.hl(cx - hw, cx + hw, base - 70 - k, roof[4])
        c.hl(cx - hw, cx - hw + max(1, hw // 3), base - 70 - k, roof[5])
        c.hl(cx + hw - max(1, hw // 3), cx + hw, base - 70 - k, roof[2])
    c.vl(cx, base - 96, base - 88, GOLD[2]); c.px(cx, base - 94, GOLD[3]); c.px(cx - 1, base - 92, GOLD[3])
    return outline(c.im)


def stone_lantern(stone=GRANITE):
    c = C(56, 100)
    cx, base = 26, 96
    y, d = stack(c, cx, base, [(18, 4), (12, 5)], stone)
    for k in range(30):
        hw = 5 - (k % 10 == 0)
        c.hl(cx - hw, cx + hw, y - k, stone[4]); c.px(cx - hw, y - k, stone[5]); c.px(cx + hw, y - k, stone[2])
    y, d = stack(c, cx, y - 29, [(12, 4), (9, 14), (10, 2)], stone)
    c.rect(cx - 4, y + 5, cx + 4, y + 13, stone[0]); c.rect(cx - 3, y + 7, cx + 3, y + 12, FLAME[1])
    for k in range(9):
        hw = 22 - k * 2
        c.hl(cx - hw, cx + hw, y - k, stone[5 if k < 3 else 4]); c.px(cx + hw, y - k, stone[2])
    c.px(cx - 23, y + 1, stone[4]); c.px(cx + 23, y + 1, stone[3])
    for yy, r in ((y - 12, 4), (y - 18, 3)):
        c.ellipse(cx, yy, r, r, stone[4]); c.px(cx - 1, yy - 1, stone[6])
    return outline(c.im)


def bixi(stone=GRANITE):
    """A stele on the back of a tortoise (bixi), a coiled dragon crown above."""
    c = C(96, 124)
    cx, base = 46, 118
    box(c, cx, base, 40, 3, stone, depth=14, face=3)
    f = Sculpt(c, cx, base - 3, 1, stone)
    f.part(ell(-26, -3, 8, 4), ell(26, -3, 8, 4), dim=2)
    f.part(ell(2, -15, 34, 15), soft=3)
    f.part(poly((-30, -18), (-44, -24), (-50, -18), (-46, -8), (-30, -8)), soft=1.8)
    f.part(ell(-47, -17, 6, 5), soft=1.5)
    f.part(ell(-32, -3, 7, 4), ell(34, -3, 7, 4))
    f.done()
    for x in range(cx - 30, cx + 34, 9):
        for yy in (base - 22, base - 14):
            o = (x // 9 % 2) * 4 if yy == base - 14 else 0
            c.hl(x + o, x + o + 6, yy, stone[2]); c.hl(x + o, x + o + 6, yy + 1, stone[5])
            c.px(x + o, yy - 3, stone[2]); c.px(x + o, yy - 2, stone[2])
    c.px(cx - 49, base - 21, stone[0]); c.hl(cx - 53, cx - 49, base - 15, stone[1])
    top, dd = box(c, cx + 2, base - 24, 14, 4, stone, depth=4)
    x0, x1, t = cx + 2 - 11, cx + 2 + 11, top - 62
    for yy in range(t, top):
        c.hl(x0, x1, yy, stone[4]); c.px(x0, yy, stone[5]); c.px(x0 + 1, yy, stone[5]); c.px(x1, yy, stone[2])
    c.rect(x0 + 3, t + 20, x1 - 3, top - 4, stone[3])
    c.hl(x0 + 3, x1 - 3, t + 20, stone[2]); c.vl(x1 - 3, t + 20, top - 4, stone[5])
    for x in range(x0 + 5, x1 - 3, 3):
        for yy in range(t + 23, top - 6, 2):
            if h2(x, yy, 4) < 0.8:
                c.px(x, yy, stone[1])
    g = Sculpt(c, cx + 2, t + 2, 1, stone)
    g.part(ell(0, -4, 14, 12), soft=2.5)
    g.done()
    for dx, dy, r in ((-6, -8, 4), (5, -9, 4), (0, -2, 3)):
        for a in range(40, 330, 25):
            q = math.radians(a)
            c.px(cx + 2 + dx + round(math.cos(q) * r), t + dy + round(math.sin(q) * r), stone[2])
    c.rect(cx - 1, t + 3, cx + 5, t + 9, stone[2]); c.rect(cx, t + 4, cx + 4, t + 8, stone[4])
    return outline(c.im, 0.3, 0.6)


def chhatri(stone=RED_SANDSTONE):
    c = C(80, 120)
    cx, base = 38, 116
    y, d = stack(c, cx, base, [(34, 6), (28, 10), (26, 3, 5)], stone)
    for x in range(cx - 20, cx + 21, 10):
        c.rect(x - 7, y + 6, x - 3, y + 11, stone[2])
    for x in (cx - 20, cx + 20, cx - 7, cx + 7):
        c.rect(x - 2, y - 30, x + 2, y, stone[5] if x < cx else stone[3])
        c.px(x - 2, y - 30, stone[6])
    c.rect(cx - 17, y - 30, cx + 17, y - 20, stone[0])
    for k in range(4):
        c.hl(cx - 28 + k, cx + 28 - k, y - 30 - k, stone[5 if k == 3 else 3])
    c.hl(cx - 28, cx + 28, y - 29, stone[1])
    y -= 34
    for k in range(22):
        hw = round(18 * math.sqrt(max(0, 1 - (k / 22) ** 2)))
        c.hl(cx - hw, cx + hw, y - k, stone[4])
        c.hl(cx - hw, cx - hw + hw // 2, y - k, stone[5])
        c.hl(cx + hw - hw // 3, cx + hw, y - k, stone[2])
    for k, r in enumerate((3, 2, 3, 1)):
        c.hl(cx - r, cx + r, y - 22 - k * 2, GOLD[2]); c.hl(cx - r, cx + r, y - 23 - k * 2, GOLD[3])
    return outline(c.im)


def lion_pillar(stone=SANDSTONE):
    """A polished monolith with a bell capital and addorsed lions: Mauryan."""
    c = C(48, 160)
    cx, base = 22, 156
    y, d = stack(c, cx, base, [(18, 3, 3), (14, 3)], stone)
    for k in range(104):
        hw = 4 if k < 60 else 3
        c.hl(cx - hw, cx + hw, y - k, stone[5]); c.px(cx - hw + 1, y - k, stone[6]); c.px(cx + hw, y - k, stone[3])
        c.px(cx - hw, y - k, stone[4])
    y -= 104
    for k in range(10):
        hw = 3 + k // 2
        c.hl(cx - hw, cx + hw, y - 9 + k, stone[4]); c.px(cx - hw, y - 9 + k, stone[5]); c.px(cx + hw, y - 9 + k, stone[2])
        if k % 3 == 1:
            c.hl(cx - hw + 1, cx + hw - 1, y - 9 + k, stone[3])
    t, dd = box(c, cx, y - 10, 8, 4, stone, depth=2)
    for x in range(cx - 7, cx + 8, 3):
        c.px(x, t + 2, stone[2])
    f = Sculpt(c, cx, t - 1, 0.32, stone)
    f.part(ell(-14, -12, 9, 12), ell(14, -12, 9, 12), dim=1, soft=1.5)
    f.part(ell(0, -24, 12, 22), soft=2)
    f.part(ell(0, -48, 13, 12), soft=2)
    f.part(ell(0, -44, 7, 5), dim=1)
    f.done()
    return outline(c.im, 0.3, 0.6)


def maya_stela(stone=LIME):
    """A carved stela with a ruler in plumed headdress, glyph columns at its
    sides, and a drum altar before it: Classic Maya plazas."""
    c = C(64, 112)
    cx, base = 30, 108
    top = base - 96
    for yy in range(top, base - 4):
        c.hl(cx - 12, cx + 12, yy, stone[4]); c.px(cx - 12, yy, stone[5]); c.px(cx - 11, yy, stone[5])
        c.px(cx + 12, yy, stone[2])
    for k in range(4):
        c.hl(cx - 12 + k, cx + 12 - k, top - 1 - k, stone[5])
    c.rect(cx - 7, top + 4, cx + 7, base - 8, mix(stone[3], RED_PAINT[2], 0.35))
    for side in (-10, 8):
        for yy in range(top + 4, base - 10, 6):
            c.rect(cx + side, yy, cx + side + 2, yy + 4, stone[3])
            c.px(cx + side, yy, stone[5]); c.px(cx + side + 2, yy + 4, stone[1]); c.px(cx + side + 1, yy + 2, stone[1])
    f = Sculpt(c, cx, base - 9, 0.62, stone)
    f.part(poly((-12, -126), (12, -128), (18, -140), (8, -136), (0, -146), (-8, -136), (-18, -140)), soft=1)
    f.part(poly((-9, -80), (9, -80), (11, -36), (-11, -36)), soft=1.2)
    f.fold([(-8, -56), (8, -56)], [(-9, -46), (9, -46)])
    f.part(limb(8, (-5, -36), (-6, 0)), limb(8, (5, -36), (6, 0)), dim=1)
    f.part(ell(-8, -2, 5, 2.5), ell(8, -2, 5, 2.5), dim=1)
    f.part(poly((-10, -120), (10, -120), (9, -104), (-9, -104)), soft=1)
    f.part(ell(0, -94, 7, 10))
    f.part(limb(6, (8, -76), (12, -62), (4, -58)))
    f.part(limb(6, (-8, -76), (-10, -64)), limb(2.5, (-10, -70), (-10, -40)))
    f.part(ell(-12, -60, 6, 8), dim=1)
    f.done()
    c.ellipse(cx, base - 2, 14, 3, stone[2])
    c.rect(cx - 14, base - 7, cx + 14, base - 2, stone[3])
    c.vl(cx - 14, base - 7, base - 2, stone[5]); c.vl(cx + 14, base - 7, base - 2, stone[1])
    c.ellipse(cx, base - 7, 14, 3, stone[5]); c.ellipse(cx, base - 7, 12, 2, stone[4])
    for x in range(cx - 12, cx + 13, 4):
        c.rect(x, base - 5, x + 2, base - 3, stone[2])
    return outline(c.im, 0.3, 0.6)
def obelisk(stone=RED_GRANITE, pedestal=None, cap=GOLD):
    c = C(60, 170)
    cx, base = 28, 166
    y = base
    if pedestal:
        y, d = stack(c, cx, base, [(22, 4), (18, 4), (15, 24, 4), (17, 3, 5)], pedestal)
        y -= d // 2
    h = 110 if pedestal else 128
    for k in range(h):
        hw = round(9 - 3 * k / h)
        c.hl(cx - hw, cx + hw, y - k, stone[4])
        c.px(cx - hw, y - k, stone[5]); c.px(cx + hw, y - k, stone[2]); c.px(cx + hw - 1, y - k, stone[3])
        if not pedestal and 8 < k < h - 10 and k % 4 < 2:
            c.px(cx - 3, y - k, stone[2]); c.px(cx + 2, y - k, stone[2])
    y -= h
    for k in range(7):
        hw = 6 - k
        c.hl(cx - hw, cx + hw, y - k, cap[2]); c.hl(cx - hw, cx, y - k, cap[3])
    if pedestal:
        c.vl(cx, y - 13, y - 7, IRON[3]); c.hl(cx - 2, cx + 2, y - 11, IRON[3])
    return outline(c.im)


def pedestal(c, cx, base, hw, h, stone, rails=False, relief=False):
    """Steps, a moulded base course, a panelled die and a cornice.
    Returns the y of the cornice top and its depth, for what stands on it."""
    if rails:
        box(c, cx, base, hw + 16, 3, stone, depth=hw // 2 + 10, face=3)
        base -= 3
    y, d = stack(c, cx, base, [(hw + 8, 3, 3), (hw + 5, 3)], stone)
    y, d2 = box(c, cx, y - 1 - (d - (hw + 3) * 11 // 20) // 2, hw + 3, 4, stone)
    c.hl(cx - hw - 3, cx + hw + 3, y + 1, stone[5])
    die_b = y - 1 - (d2 - round(hw * 0.55)) // 2
    top, dd = box(c, cx, die_b, hw, h, stone)
    x0, x1, y0, y1 = cx - hw + 4, cx + hw - 4, top + 5, die_b - 4
    c.rect(x0, y0, x1, y1, stone[3])
    c.hl(x0, x1, y0, stone[2]); c.vl(x0, y0, y1, stone[2])
    c.hl(x0, x1, y1, stone[5]); c.vl(x1, y0, y1, stone[5])
    if relief:
        c.rect(x0 + 2, y0 + 2, x1 - 2, y1 - 2, BRONZE[3])
        for k, x in enumerate(range(x0 + 4, x1 - 2, 5)):
            c.vl(x, y1 - 9 - (k % 2) * 2, y1 - 3, BRONZE[5]); c.px(x, y1 - 10 - (k % 2) * 2, BRONZE[6])
            c.vl(x + 1, y1 - 8 - (k % 2) * 2, y1 - 3, BRONZE[1])
        c.hl(x0 + 2, x1 - 2, y0 + 2, BRONZE[5]); c.hl(x0 + 2, x1 - 2, y1 - 2, BRONZE[1])
    else:
        py = y0 + 3
        plaque(c, cx - hw // 2, py, cx + hw // 2, py + 6, stone)
        for k in range(cx - hw // 2 + 1, cx + hw // 2, 2):
            n = int(h2(k, 1, 3) * 7)
            for j in range(n):
                c.px(k, py + 7 + j, mix(stone[3], VERDIGRIS[4], 0.45 - j * 0.05))
    ct, cd = box(c, cx, top - 1 - (round((hw + 3) * 0.55) - dd) // 2 + 3, hw + 3, 4, stone, face=5)
    c.hl(cx - hw, cx + hw, top, stone[1])
    c.hl(cx - hw - 3, cx + hw + 3, ct + 3, stone[2])
    t2, d3 = box(c, cx, ct - 1 - (cd - round((hw - 2) * 0.55)) // 2, hw - 2, 3, stone)
    return t2, d3


def stream(c, x0, y0, x1, y1, lift=0):
    """A falling arc from (x0, y0) to (x1, y1): bright core, mid edge, dim tail."""
    n = max(abs(x1 - x0), abs(y1 - y0)) + 1
    for i in range(n + 1):
        t = i / n
        x = round(x0 + (x1 - x0) * t)
        y = round(y0 + (y1 - y0) * t * t - lift * 4 * t * (1 - t))
        c.px(x, y, WATER[5])
        c.px(x, y + 1, WATER[4])
        if i % 3 == 0:
            c.px(x + (1 if x1 > x0 else -1), y + 1, WATER[3])


def mask(c, x, y, ramp):
    """A spout mask: a round lion's face with a dark mouth."""
    c.ellipse(x, y, 3, 3, ramp[4]); c.px(x - 1, y - 2, ramp[6]); c.px(x - 2, y - 1, ramp[5])
    c.px(x + 2, y + 1, ramp[2]); c.px(x, y + 1, ramp[0]); c.px(x - 1, y - 1, ramp[1]); c.px(x + 1, y - 1, ramp[1])


def wreath(c, x, y, r):
    for a in range(0, 360, 10):
        t = math.radians(a)
        for dr, k in ((0, 3 if math.cos(t) + math.sin(t) < 0 else 1), (1, 2), (-1, 4 if math.cos(t) + math.sin(t) < -0.6 else 2)):
            c.px(round(x + math.cos(t) * (r + dr)), round(y + math.sin(t) * (r + dr)), GREEN_W[k])
    for k in range(4):
        c.px(x - 1 + k // 2, y + r + 1 + k, RED_PAINT[2 if k < 2 else 1])
        c.px(x + 1 - k // 2 + 1, y + r + 1 + k, RED_PAINT[1])


PIECES = [
    ('Bronze horseman, granite plinth', lambda: equestrian()),
    ('Bronze horseman, marble plinth', lambda: equestrian(MARBLE, VERDIGRIS, rails=False, rearing=True)),
    ('Bronze orator, granite plinth', lambda: statue()),
    ('Cloaked bronze, sandstone plinth', lambda: statue(SANDSTONE, VERDIGRIS, pose='sword', cloak=True, rails=True, hat=True)),
    ('Marble statue, limestone plinth', lambda: statue(LIME, MARBLE, pose='chest', robe=True)),
    ('Statue fountain, round basin', lambda: statue_fountain()),
    ('Statue fountain, octagonal basin', lambda: statue_fountain(True, 'chest', MARBLE, SANDSTONE)),
    ('Tiered fountain', lambda: tiered_fountain()),
    ('Heroic figure with banner, granite pylon', lambda: hero()),
    ('Soldier memorial', lambda: soldier()),
    ('Cenotaph with wreath', lambda: cenotaph()),
    ('Abstract corten sculpture', lambda: abstract()),
    ('Abstract steel forms', lambda: abstract(STEEL)),
    ('Roman honorific column', lambda: roman_column()),
    ('Roman togate statue', lambda: statue(MARBLE, MARBLE, pose='raise', robe=True)),
    ('Roman gilt horseman', lambda: equestrian(MARBLE, GILT, rails=False)),
    ('Market cross', lambda: market_cross()),
    ('Lantern-headed market cross', lambda: market_cross(True, SANDSTONE)),
    ('Sadirvan fountain', lambda: sadirvan()),
    ('Stone lantern', lambda: stone_lantern()),
    ('Stele on a tortoise', lambda: bixi()),
    ('Chhatri', lambda: chhatri()),
    ('Lion pillar', lambda: lion_pillar()),
    ('Maya stela and altar', lambda: maya_stela()),
    ('Granite obelisk', lambda: obelisk()),
    ('Obelisk on a pedestal', lambda: obelisk(RED_GRANITE, LIME)),
    ('Heroic worker, bronze', lambda: hero(RED_GRANITE, BRONZE, banner=False)),
]
VARIANTS = [name for name, _ in PIECES]


def monument(v=0):
    return PIECES[v % len(PIECES)][1]()


MONUMENTS = {'monument': monument}
