"""Roman buildings and the Persian courtyard house, built from the library.

    .venv/bin/python scripts/art/front_roman.py artifacts/front-roman.png

Walls, roofs, openings and columns come from front_materials, front_openings,
front_parts, front_eave and front_house; what is drawn here is how they are
put together and what only these buildings have: the goods in a shop, the
atrium and the Persian court.

A courtyard house is drawn as Stardew stacks depth: the street range at the
bottom, its roof above it; then the court seen from above, its far range
standing square to us with its own roof; the side ranges as gabled roofs
running back, their ridges up the screen. Scale is about 20px to the metre.
"""
from pathlib import Path
import math
import sys
import types

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art.front_eave import EaveHouse, antefix  # noqa: E402
from art.front_house import roof_slope, GableHouse  # noqa: E402
from art.front_kit import outline, finish, consolidate, text, text_w  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as pr  # noqa: E402
from art import front_goods as fg  # noqa: E402
from art.front_persian import persian  # noqa: E402

TRAV = RAMPS['travertine']
MARBLE = RAMPS['marble']
RED = RAMPS['pompeian-red']
OCHRE = RAMPS['plaster-ochre']
TILE = RAMPS['tegula']
BRICK = RAMPS['roman-brick']
KAH = RAMPS['kahgel']
OAK = RAMPS['oak']
BRONZE = ramp(72, 0.09, lift=-0.16)
GILT = ramp(85, 0.13, lift=-0.02)
WATER = ramp(222, 0.08, lift=-0.08)
LEAF = ramp(132, 0.1, lift=-0.16)
LAVA = ramp(260, 0.015, lift=-0.3)
SIGNINUM = ramp(30, 0.07, lift=-0.04)
FAIENCE = ramp(232, 0.1, lift=-0.08)
FIRE = ramp(55, 0.16)
BLACK = ramp(20, 0.03, lift=-0.36)
CLOTH = [ramp(25, 0.13, lift=-0.1), ramp(80, 0.12), ramp(255, 0.08, lift=-0.14)]
PAVE = ramp(55, 0.07, lift=-0.02)
BED = ramp(50, 0.06, lift=-0.22)
DARK = (40, 30, 70, 255)


def shade_rect(c, x, y, w, h, k):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            fp.shade(c, xx, yy, k)


# ------------------------------------------------------------------ goods

SHOPS = {'bakery': fg.SPECS['Roman bakery'], 'thermopolium': fg.SPECS['thermopolium'],
         'wine': fg.SPECS['wine shop'], 'cloth': fg.SPECS['draper']}


def goods(c, x, y, w, h, kind):
    """What a shop shows in its open front; the boards take its right 17px."""
    fg.bay(c, x, y, w - 17, h, SHOPS[kind])


def dipinto(c, x, y, lines):
    """An electoral notice painted in red on a whitened panel."""
    w = max(text_w(s) for s in lines) + 6
    h = len(lines) * 7 + 4
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            c.p(xx, yy, MARBLE[1] if (xx * 7 + yy * 3) % 23 else MARBLE[2])
    for i, s in enumerate(lines):
        text(c, x + 3, y + 3 + i * 7, s, RED[2], RED[4])


def relief(c, cx, y):
    """A baker's terracotta sign: the hourglass mill turned by a donkey."""
    op.raised(c, cx - 8, y, 17, 15, TILE, 2)
    shape = ('..ooo..', '.ooooo.', '..ooo..', '...o...', '..ooo..', '.ooooo.', 'ooooooo', 'ooooooo')
    for j, row in enumerate(shape):
        for i, ch in enumerate(row):
            if ch == 'o':
                c.p(cx - 3 + i, y + 3 + j, TILE[1] if i < 3 else TILE[4])
    op.cast(c, cx - 7, y + 15, 17, 2, 0.7)


def relieving_arch(c, cx, spring, half, rise, ring=4, fill=None):
    """A segmental brick arch over a lintel, its tympanum recessed."""
    R = (half * half + rise * rise) / (2 * rise)
    oy = spring - rise + R
    for yy in range(int(spring - rise - ring) - 1, spring + 1):
        for xx in range(int(cx - half - ring) - 1, int(cx + half + ring) + 2):
            d = math.hypot(xx + 0.5 - cx, yy + 0.5 - oy)
            if R <= d < R + ring:
                a = math.atan2(yy + 0.5 - oy, xx + 0.5 - cx)
                k = int(a * 30) % 2
                c.p(xx, yy, BRICK[1] if d < R + 1 else BRICK[2 + k])
            elif d < R and fill:
                c.p(xx, yy, fill)


# ------------------------------------------------------------------ the insula

class Insula(EaveHouse):
    """An Ostian apartment block: a row of shops under relieving arches with
    their mezzanine lights, the stair door between pilasters, a balcony on
    travertine corbels, brick dentil cornices, and windows under brick
    arches growing smaller toward the roof. No chimneys: Rome had none."""

    def __init__(self, spec=None):
        s = dict(W=280, storeys=['testaceum'] * 4, heights=[76, 56, 50, 46], roof='imbrex', hip=True, rise=52,
                 tone='tegula', antefixes=False, stacks='none', plinth=None, wear=0.3, seed=1,
                 shops=('bakery', 'wine', 'thermopolium', 'cloth', 'wine'))
        s.setdefault('edge', 'finish')
        s.update(spec or {})
        s['storeys'] = [s['storeys'][0]] * len(s['heights'])
        super().__init__(s)

    def walls(self):
        super().walls()
        c, x0, x1 = self.c, self.x0, self.x0 + self.W
        fm.ashlar(c, x0, self.base - 5, self.W, 5, TRAV, 5, 22)
        for top, h, _ in self.floors[2:]:
            y = top + h
            for xx in range(x0 - 2, x1 + 2):
                c.p(xx, y - 4, BRICK[1]); c.p(xx, y - 3, BRICK[2]); c.p(xx, y - 2, BRICK[4])
                if (xx - x0) % 4 < 2:
                    c.p(xx, y - 1, BRICK[2]); c.p(xx, y, BRICK[5])
            op.cast(c, x0, y + 1, self.W, 2, 0.7)

    def openings(self):
        c, s = self.c, self.s
        x0, W, base = self.x0, self.W, self.base
        n = max(2, round(W / 46))
        pitch = W / n
        cols = [x0 + round(pitch * (k + 0.5)) for k in range(n)]
        door_col = max(0, n // 2 - (s['seed'] % 2 if n > 3 else 0))
        self.cols, self.door_col, self.door_x, self.door_h = cols, door_col, cols[door_col], 48
        self.sills = []
        from itertools import cycle
        shops = cycle(s['shops'])
        for k, cx in enumerate(cols):
            if k == door_col:
                self.entrance(cx)
                continue
            tw = round(pitch) - 12
            lintel = base - 54
            relieving_arch(c, cx, lintel - 1, tw // 2 + 2, 11, 4, BRICK[5])
            op.grille(c, cx - 6, lintel - 10, 12, 8)
            op.shopfront_open(c, cx - tw // 2, lintel + 4, tw, base - 4 - lintel - 4)
            goods(c, cx - tw // 2, lintel + 4, tw, base - 4 - lintel - 4, next(shops, 'wine'))
        # Windows, smaller up the building; the first floor's open on the balcony.
        for i, (top, h, _) in enumerate(self.floors[1:], 1):
            ww, wh = ((18, 30), (16, 24), (14, 20), (14, 18))[min(3, i - 1)]
            wy = top + (13 if i > 1 else 11)
            for k, cx in enumerate(cols):
                closed = h2(k, i, 501) < 0.25
                op.FRAMES['roman'][0](c, cx - ww // 2, wy, ww, wh, None)
                op.INFILLS['boards' if closed else 'open'](c, cx - ww // 2, wy, ww, wh, 'oak')
                op.reveal(c, cx - ww // 2, wy, ww, wh, 2)
                if not closed:
                    op.open_shutters(c, cx - ww // 2, wy, ww, wh, 'oak', 8)
                if i > 1:
                    self.sills.append((cx - ww // 2 - 4, wy + wh + 5, ww + 8))
        self.balcony(self.floors[0][0])

    def entrance(self, cx):
        c, base = self.c, self.base
        dw, dh = 24, 48
        for side in (-1, 1):
            px = cx + side * (dw // 2 + 6) - (7 if side < 0 else 0)
            op.raised(c, px, base - dh - 14, 7, dh + 10, BRICK, 2)
        top = base - dh - 16
        for k in range(9):
            for xx in range(cx - 22 + 2 * k, cx + 23 - 2 * k):
                c.p(xx, top - k, BRICK[2] if k < 8 else BRICK[1])
        for xx in range(cx - 24, cx + 25):
            c.p(xx, top, TRAV[0]); c.p(xx, top + 1, TRAV[2]); c.p(xx, top + 2, TRAV[4])
        op.cast(c, cx - 20, top + 3, 41, 2, 0.7)
        op.door_studded(c, cx - dw // 2, base - dh, dw, dh)
        for k in range(3):
            c.rect(cx - 16 - k, base + k, 32 + 2 * k, 1, TRAV[k + 1])

    def balcony(self, y):
        """A maenianum along the first floor: a travertine slab whose top we
        see, on corbels, with a timber rail."""
        c, x0, x1 = self.c, self.x0, self.x0 + self.W
        for xx in range(x0 + 6, x1 - 6, 23):
            for k in range(6):
                for j in range(max(1, 5 - k)):
                    c.p(xx + j, y + 2 + k, TRAV[2 if j == 0 else 4])
        for xx in range(x0 - 3, x1 + 3):
            for k, q in enumerate((0, 1, 1, 2, 3, 5)):
                c.p(xx, y - 4 + k, TRAV[q])
        op.cast(c, x0 - 2, y + 2, self.W + 4, 4, 0.62)
        for xx in range(x0 - 3, x1 + 3):
            c.p(xx, y - 18, OAK[2]); c.p(xx, y - 17, OAK[4])
            c.p(xx, y - 11, OAK[3])
            if (xx - x0) % 6 == 0:
                for yy in range(y - 17, y - 4):
                    c.p(xx, yy, OAK[3]); c.p(xx + 1, yy, OAK[5])


class Casa(EaveHouse):
    """A small Roman house: rendered walls over a red dado, a studded door, a
    window or two with their shutters open, a hipped tile roof with
    antefixes; one storey or two."""

    def __init__(self, spec=None):
        s = dict(W=112, storeys=['stucco'], heights=[64], roof='imbrex', hip=True, rise=40, antefixes=True,
                 stacks='none', plinth=None, wear=0.35, seed=3, windows=('roman', 'open'), shutters='oak',
                 door='plank')
        s.setdefault('edge', 'finish')
        s.update(spec or {})
        s['storeys'] = (list(s['storeys']) * len(s['heights']))[:len(s['heights'])]
        super().__init__(s)

    def walls(self):
        super().walls()
        c, x0 = self.c, self.x0
        for yy in range(self.base - 18, self.base - 4):
            for xx in range(x0, x0 + self.W):
                c.p(xx, yy, RED[1] if yy == self.base - 18 else RED[3])
        for yy in range(self.base - 4, self.base):
            for xx in range(x0, x0 + self.W):
                c.p(xx, yy, LAVA[2] if yy == self.base - 4 else LAVA[4] if (xx - x0) % 13 == 0 else LAVA[3])

    def openings(self):
        super().openings()
        dw, dh = 24, 46
        op.door_studded(self.c, self.door_x - dw // 2, self.base - dh, dw, dh)
        self.door_h = dh


def casa(spec=None):
    return Casa(spec).build()


def insula(spec=None):
    return Insula(spec).build()


# ------------------------------------------------------------------ the shop row

class Tabernae(EaveHouse):
    """A row of shops with rooms over them on a timber frame filled with
    rubble and plaster (opus craticium, as at Herculaneum), the upper floor
    jettied out on joists, a tiled roof with antefixes along its eave."""

    def __init__(self, spec=None):
        s = dict(W=236, storeys=['sandstone', 'render'], heights=[70, 44], roof='imbrex', hip=False, rise=46,
                 jetty=True, frame=True, antefixes=True, stacks='none', plinth=None, wear=0.35, seed=2,
                 shops=('bakery', 'thermopolium', 'wine'))
        s.setdefault('edge', 'finish')
        s.update(spec or {})
        super().__init__(s)

    def walls(self):
        super().walls()
        c, x0 = self.c, self.x0
        for yy in range(self.base - 20, self.base - 4):
            for xx in range(x0, x0 + self.W):
                c.p(xx, yy, RED[3] if yy > self.base - 19 else RED[1])
        for yy in range(self.base - 4, self.base):
            for xx in range(x0, x0 + self.W):
                c.p(xx, yy, LAVA[2] if yy == self.base - 4 else LAVA[4] if (xx - x0) % 13 == 0 else LAVA[3])

    def openings(self):
        c, s = self.c, self.s
        x0, W, base = self.x0, self.W, self.base
        n = len(s['shops'])
        pitch = W / n
        cols = [x0 + round(pitch * (k + 0.5)) for k in range(n)]
        self.cols, self.door_col, self.door_x, self.door_h = cols, 0, cols[0], 44
        self.sills = []
        for k in range(1, n):
            px = x0 + round(pitch * k)
            fp.column(c, px, self.floors[0][0] + 6, base - 4, MARBLE, 8, 'ionic')
        for k, (cx, kind) in enumerate(zip(cols, s['shops'])):
            tw = round(pitch) - 18
            sy = base - 50
            op.shopfront_open(c, cx - tw // 2, sy, tw, 46)
            goods(c, cx - tw // 2, sy, tw, 46, kind)
            if kind == 'bakery':
                relief(c, cx, self.floors[0][0] + 1)
            top = self.floors[1][0]
            for wx in (cx - 18, cx + 8):
                op.frame_timber(c, wx, top + 12, 10, 14, None)
                op.INFILLS['open'](c, wx, top + 12, 10, 14)
                op.reveal(c, wx, top + 12, 10, 14, 2)
                op.open_shutters(c, wx, top + 12, 10, 14, 'oak', 4)


def tabernae(spec=None):
    return Tabernae(spec).build()


# ------------------------------------------------------------------ the domus

class DomusFront(EaveHouse):
    """The street range of an atrium house: shops let out either side of the
    fauces, its doorway between pilasters with Corinthian capitals, a red
    dado, slit windows and a painted electoral notice above."""

    def __init__(self, spec=None):
        s = dict(W=304, storeys=['stucco'], heights=[80], roof='imbrex', hip=False, rise=46, antefixes=True,
                 stacks='none', plinth=None, wear=0.3, seed=4, shops=('cloth', 'thermopolium', 'wine', 'bakery'),
                 notice=('C IVLIVM', 'POLYBIVM', 'AED OVF'))
        s.setdefault('edge', 'finish')
        s.update(spec or {})
        super().__init__(s)

    def walls(self):
        super().walls()
        c, x0 = self.c, self.x0
        for yy in range(self.base - 24, self.base - 4):
            for xx in range(x0, x0 + self.W):
                c.p(xx, yy, RED[1] if yy == self.base - 24 else RED[5] if yy == self.base - 23 else RED[3])
        for yy in range(self.base - 4, self.base):
            for xx in range(x0, x0 + self.W):
                c.p(xx, yy, LAVA[2] if yy == self.base - 4 else LAVA[4] if (xx - x0) % 13 == 0 else LAVA[3])

    def openings(self):
        c, s = self.c, self.s
        x0, W, base = self.x0, self.W, self.base
        cx = x0 + W // 2
        self.cols, self.door_col, self.door_x, self.door_h = [cx], 0, cx, 54
        self.sills = []
        top = self.floors[0][0]
        # the fauces: a tall studded door between pilasters under an entablature
        dw, dh = 28, 54
        for side in (-1, 1):
            fp.column(c, cx + side * 23, base - dh - 10, base - 4, TRAV, 8, 'corinthian', fluted=False)
        for xx in range(cx - 32, cx + 33):
            for k, q in enumerate((0, 1, 1, 2, 3, 2, 4)):
                c.p(xx, base - dh - 17 + k, TRAV[q])
        op.cast(c, cx - 30, base - dh - 10, 61, 3, 0.66)
        op.door_studded(c, cx - dw // 2, base - dh - 4, dw, dh)
        for k in range(3):
            c.rect(cx - 20 - k, base - 4 + k, 40 + 2 * k, 1, TRAV[k + 1])
        # two shops each side
        tw = 46
        if W >= 280:
            xs = [x0 + 12, x0 + 12 + tw + 14, x0 + W - 12 - 2 * tw - 14, x0 + W - 12 - tw]
        else:
            xs = [x0 + 12, x0 + W - 12 - tw]
        for x, kind in zip(xs, s['shops'] if len(xs) == 4 else s['shops'][1:3]):
            op.shopfront_open(c, x, base - 52, tw, 48)
            goods(c, x, base - 52, tw, 48, kind)
            if kind == 'bakery':
                relief(c, x + tw // 2, top + 6)
        for wx in ((xs[1] + 6, xs[2] + tw - 18) if len(xs) == 4 else (xs[0] + tw + 6,)):
            op.FRAMES['stone'][0](c, wx, top + 9, 10, 10, None)
            op.grille(c, wx, top + 9, 10, 10)
        if len(xs) == 4:
            dipinto(c, xs[0] + 2, top + 4, s['notice'])


class AtriumRange(EaveHouse):
    """The far side of the atrium, square to us: the tablinum open in the
    middle with a curtain drawn half across, the alae either side, the walls
    painted in red panels over a black dado."""

    def __init__(self, spec):
        s = dict(storeys=['stucco'], heights=[52], roof='imbrex', hip=False, rise=30, antefixes=True,
                 stacks='none', plinth=None, wear=0.15, seed=5)
        s.setdefault('edge', 'finish')
        s.update(spec)
        super().__init__(s)

    def walls(self):
        super().walls()
        c, x0, W, base = self.c, self.x0, self.W, self.base
        top = self.floors[0][0]
        for yy in range(top, base):
            for xx in range(x0, x0 + W):
                if yy > base - 12:
                    c.p(xx, yy, BLACK[3] if yy > base - 11 else BLACK[1])
                elif (xx - x0) % 30 in (0, 1, 2) or yy < top + 6:
                    c.p(xx, yy, OCHRE[2] if yy >= top + 6 else OCHRE[1])
                else:
                    c.p(xx, yy, RED[3] if (xx - x0) % 30 not in (5, 26) and yy not in (top + 9, base - 15) else OCHRE[1])

    def openings(self):
        c, x0, W, base = self.c, self.x0, self.W, self.base
        cx = x0 + W // 2
        self.cols, self.door_col, self.door_x, self.door_h = [cx], 0, cx, 44
        self.sills = []
        tw, th = 52, 44
        for yy in range(base - th, base):
            for xx in range(cx - tw // 2, cx + tw // 2):
                c.p(xx, yy, (46, 34, 40, 255) if yy < base - 8 else (70, 52, 50, 255))
        op.raised(c, cx - tw // 2 - 4, base - th - 4, tw + 8, 4, TRAV, 1)
        op.cast(c, cx - tw // 2, base - th, tw, 3, 0.6)
        cloth = CLOTH[0]
        for yy in range(base - th, base - 2):
            for xx in range(cx - tw // 2, cx - tw // 2 + 18 - (yy - base + th) // 8):
                f = (xx - cx + tw // 2) % 5
                c.p(xx, yy, cloth[(2, 3, 3, 4, 5)[f]])
        for side in (-1, 1):
            ax = cx + side * (tw // 2 + 20) - 8
            for yy in range(base - 38, base):
                for xx in range(ax, ax + 16):
                    c.p(xx, yy, (46, 34, 40, 255))
            op.reveal(c, ax, base - 38, 16, 38, 2)


def domus(spec=None, info=None):
    """An atrium house under one hipped roof that frames the atrium like a
    mitred picture frame; through the opening, the far range's face with the
    tablinum, and the atrium floor with the impluvium."""
    s = dict(floor=40, back=26, **(spec or {}))
    s.setdefault('wing', round(s.get('W', 304) * 0.19))
    F = DomusFront(s)
    fim = F.build()
    wing = s['wing']
    B = AtriumRange(dict(W=F.W - 2 * wing))
    bim = B.build()
    face = B.base - B.eave
    hole = face + s['floor']
    frame_top = F.eave - F.rise - hole - s['back']
    off = max(0, 8 - frame_top)
    c = C(fim.width, fim.height + off)
    c.im.alpha_composite(fim, (0, off))
    c.px = c.im.load()
    x0, x1 = F.x0 - F.over, F.x0 + F.W + F.over
    y0, y1 = off + frame_top, off + F.eave + 2
    ox0, ox1 = F.x0 + wing, F.x0 + F.W - wing
    oy0 = y0 + s['back']
    oy1 = oy0 + hole
    for yy in range(max(0, y0 - 12), y1 - 1):
        for xx in range(max(0, x0 - 3), min(c.w, x1 + 3)):
            c.px[xx, yy] = (0, 0, 0, 0)
    crop = bim.crop((B.x0, B.eave, B.x0 + B.W, B.base))
    c.im.alpha_composite(crop, (ox0, oy0))
    c.px = c.im.load()
    atrium_floor(c, ox0, ox1, oy0 + face, oy1)
    hipped_frame(c, x0, x1, y0, y1, ox0, ox1, oy0, oy1, F.tone)
    if info is not None:
        info.update(x0=F.x0, W=F.W, base=F.base + off, door_x=F.door_x, door_h=F.door_h)
    finish(c)
    # a composite of three ranges gathers strays where they meet
    consolidate(c, rare=6)
    return c.im


def _tile(x, y, r, col=11, course=10, shift=0, across=(5, 3, 2, 1, 1, 2, 3, 4)):
    """One pixel of Roman tile in a plane whose courses run across x and lap
    down y: each imbrex a lit barrel, the tegula channel dark, the lip of
    each course lit over its shadow, the clay varying tile to tile."""
    warm, dark = ramp(50, 0.13, lift=0.02), ramp(30, 0.12, lift=-0.08)
    lx, ly = x % col, y % course
    k = h2(x // col, y // course, 401)
    rr = r if k < 0.6 else warm if k < 0.82 else dark
    if lx >= len(across):
        return rr[7 if ly >= course - 2 else 6]
    q = across[lx]
    q = max(1, min(5, q + shift))
    if ly == 0:
        q = min(7, q + 2)
    elif ly == 1:
        q = min(7, q + 1)
    elif ly == course - 3:
        q = max(0, q - 1)
    elif ly == course - 2:
        q = 5 if 1 <= lx <= 6 else 6
    elif ly == course - 1:
        q = 6
    return rr[min(7, q)]


SIDEWAYS = (3, 1, 1, 2, 3, 4, 5)


def hipped_frame(c, x0, x1, y0, y1, ox0, ox1, oy0, oy1, r):
    """A hipped roof round an open court, mitred like a picture frame: four
    planes meeting along hips that run from each outer corner to the court's
    corner. Each plane's tiles run down its own slope: toward us on the
    front, away on the back, sideways on the sides; each plane is a step up
    or down its ramp by the way it faces;
    the hips carry ridge tiles; the court is ringed by a ridge with an eave
    and antefixes on its far side, and shaded inside."""
    cap = [mix(q, (120, 40, 30, 255), 0.12) for q in r]
    lit = (255, 238, 205, 255)
    for y in range(y0, y1):
        for x in range(x0, x1):
            if ox0 <= x < ox1 and oy0 <= y < oy1:
                continue
            d = {'L': (x - x0) / max(1, ox0 - x0), 'R': (x1 - 1 - x) / max(1, x1 - ox1),
                 'T': (y - y0) / max(1, oy0 - y0), 'B': (y1 - 1 - y) / max(1, y1 - oy1)}
            order = sorted(d, key=d.get)
            plane = order[0]
            shift = {'B': 0, 'T': 1, 'L': -1, 'R': 2}[plane]
            if plane == 'B':
                col = _tile(x, y, r, shift=shift)
            elif plane == 'T':
                col = _tile(x, -y, r, shift=shift)
            elif plane == 'L':
                # tiles run sideways down to the left eave, each barrel lit
                # along its upper edge
                col = _tile(y, -x, r, col=10, course=16, shift=shift, across=SIDEWAYS)
            else:
                col = _tile(y, x, r, col=10, course=16, shift=shift, across=SIDEWAYS)
            if d[order[1]] - d[plane] < 0.045 and d[plane] < 0.97:
                col = cap[1] if plane in 'LB' else cap[4]
            c.p(x, y, col)
    for x in range(ox0 - 3, ox1 + 3):
        c.p(x, oy0 - 3, cap[3]); c.p(x, oy0 - 2, cap[1]); c.p(x, oy0 - 1, cap[4])
        c.p(x, oy1, cap[2]); c.p(x, oy1 + 1, cap[1]); c.p(x, oy1 + 2, cap[4])
    for y in range(oy0 - 3, oy1 + 3):
        c.p(ox0 - 3, y, cap[1]); c.p(ox0 - 2, y, cap[2]); c.p(ox0 - 1, y, cap[5])
        c.p(ox1, y, cap[3]); c.p(ox1 + 1, y, cap[2]); c.p(ox1 + 2, y, cap[4])
    for x in range(ox0 + 2, ox1 - 2, 9):
        antefix(c, x + 2, oy0 + 4, r)
    for k in range(6):
        for x in range(ox0, ox1):
            fp.shade(c, x, oy0 + k, 0.42 * (1 - k / 6))
        for y in range(oy0, oy1):
            fp.shade(c, ox0 + k, y, 0.42 * (1 - k / 6))
    for x in range(x0, x1):
        c.p(x, y1 - 1, r[4]); c.p(x, y1, r[6])
    for x in range(x0 + 2, x1 - 2, 11):
        antefix(c, x + 2, y1 + 1, r)
    op.cast(c, x0 + 3, y1 + 1, x1 - x0 - 6, 5, 0.6)


def atrium_floor(c, L, R, y0, y1):
    """The atrium floor from above: opus signinum set with white tesserae,
    the impluvium sunk in its marble kerb holding the sky, the cartibulum
    before the tablinum, a well-head over the cistern beside the pool."""
    for yy in range(y0, y1):
        for xx in range(L, R):
            dot = (xx - L) % 6 == 3 and (yy - y0) % 4 == 2
            c.p(xx, yy, MARBLE[2] if dot else SIGNINUM[3])
    cx = (L + R) // 2
    pw = (R - L) * 2 // 5
    pr.pool(c, cx - pw // 2, y1 - 5, pw, (y1 - y0 - 14) * 2, kerb=MARBLE, water=WATER, depth=4)
    so.box(c, cx - 11, y0 + 9, 22, 5, 6, MARBLE)
    pr.well(c, cx + pw // 2 + 14, y1 - 10, MARBLE, R=5)
    pr.pot(c, L + 12, y1 - 6, 'flowerpot', TILE)
    pr.shrub(c, L + 12, y1 - 15, 4)
    shade_rect(c, L, y0, R - L, 3, 0.25)


def side_ranges(c, Lo, Li, Ri, Ro, back, front, mat='imbrex'):
    """The side ranges' roofs, gabled and running back: each ridge a line up
    the screen, the slope facing the court and the one facing out, the
    left-hand range's shadow cast into the court."""
    ns = types.SimpleNamespace(c=c)
    depth = front - back
    for lo, li, outer_shade in ((Lo, Li, 0), (Ro, Ri, 1)):
        xr = (lo + li) // 2
        roof_slope(c, xr, lo, lambda x: front, depth, outer_shade, mat)
        roof_slope(c, xr, li, lambda x: front, depth, 1 - outer_shade, mat)
        # each slope dims in steps from its ridge to its eave
        for edge in (lo, li):
            span = abs(edge - xr)
            for xx in range(min(xr, edge), max(xr, edge) + 1):
                t = abs(xx - xr) / max(1, span)
                for yy in range(back, front + 1):
                    fp.shade(c, xx, yy, 0.0 if t < 0.35 else 0.08 if t < 0.7 else 0.16)
        GableHouse.ridge(ns, xr, back - 1, front + 2, 'cap')
        inward = 1 if lo < li else -1
        for yy in range(back, front + 1):
            c.p(li, yy, TILE[5]); c.p(li - inward, yy, TILE[2])
    for k in range(6):
        for yy in range(back + 2, front):
            fp.shade(c, Li + 1 + k, yy, 0.42 * (1 - k / 6))


# ------------------------------------------------------------------ the temple

TEMPLES = {
    # A Corinthian temple of the Principate, marble over a concrete core.
    'corinthian': dict(order='corinthian', stone='marble', podium=28, col_h=80, span=30, d=12, over=6, frieze='text',
                       base='podium'),
    'ionic': dict(order='ionic', stone='marble', podium=24, col_h=74, span=30, d=12, over=6, frieze='text',
                  base='podium'),
    # The Tuscan temple of Republican Italy: squat stuccoed columns set wide,
    # deep eaves, the gable and roof dressed in painted terracotta.
    'tuscan': dict(order='tuscan', stone='stucco', podium=22, col_h=58, span=36, d=14, over=14, frieze='terracotta',
                   base='podium', dedication=''),
    # The Greek Doric temple on its three-stepped base, a triglyph frieze.
    'doric': dict(order='doric', stone='marble', podium=12, col_h=70, span=28, d=14, over=6, frieze='triglyph',
                  base='crepidoma', dedication=''),
}
STONES = {'marble': None, 'stucco': ramp(80, 0.035, lift=0.04)}


def temple(spec=None, info=None):
    """A temple on its podium or stepped base: the roof's two slopes run back
    from the raking cornice as the gable house's do; the frieze carries a
    dedication, triglyphs or painted terracotta; the cella's doors in the
    shade of the porch. Kinds in TEMPLES; columns 4 to 8."""
    s = {**dict(columns=6, kind='corinthian', dedication='DIVO AVGVSTO', depth=74), **(spec or {})}
    k = {**TEMPLES[s['kind']], **{key: v for key, v in s.items() if key in TEMPLES['ionic']}}
    if 'dedication' in TEMPLES[s['kind']] and 'dedication' not in (spec or {}):
        s['dedication'] = TEMPLES[s['kind']]['dedication']
    st = STONES[k['stone']] or MARBLE
    n, span, d = s['columns'], k['span'], k['d']
    W = (n - 1) * span + d + 24
    podium, col_h, ent = k['podium'], k['col_h'], 17
    over, slope = k['over'], 0.36
    rise = round((W / 2 + over) * slope)
    depth = s['depth']
    base = depth + rise + ent + col_h + podium + 20
    c = C(W + 2 * over + 30, base + 6)
    x0 = 15 + over
    x1, apx = x0 + W, x0 + W // 2
    pt = base - podium
    ct = pt - col_h
    et = ct - ent

    def rake(x):
        return round(et + 1 - (W / 2 + over - abs(x - apx)) * slope)

    roof_slope(c, apx, x0 - over, rake, depth, 0, 'imbrex')
    roof_slope(c, apx, x1 + over, rake, depth, 1, 'imbrex')
    GableHouse.ridge(types.SimpleNamespace(c=c), apx, rake(apx) - depth - 1, rake(apx) + 1, 'cap')
    for yy in range(rake(apx) + 4, et):
        for xx in range(x0, x1):
            if yy > rake(xx) + 4:
                c.p(xx, yy, st[3] if (yy + (xx // 18) * 3) % 9 else st[4])
    if k['frieze'] == 'terracotta':
        # a painted terracotta group in the gable, red and ochre on the stucco
        for i in range(-2, 3):
            fx = apx + i * (W // 7)
            for yy in range(et - max(4, rise // 2 - abs(i) * 4), et - 1):
                for xx in range(fx - 3, fx + 4):
                    c.p(xx, yy, TILE[2] if xx < fx else TILE[4])
    else:
        clipeus(c, apx, et - rise // 2 + 3)
    for xx in range(x0 - over, x1 + over + 1):
        y = rake(xx)
        left = xx < apx
        cornice = TILE if k['frieze'] == 'terracotta' else st
        for kk, q in enumerate((0, 1, 2, 3, 2, 5)):
            col = cornice[q if left else min(7, q + 1)]
            if kk == 4 and xx % 3 == 0:
                col = cornice[5]
            c.p(xx, y + kk, col)
        if x0 + 2 < xx < x1 - 2:
            for kk in range(3):
                fp.shade(c, xx, y + 6 + kk, 0.4 - kk * 0.12)
    for xx in range(x0 - 3, x1 + 3):
        for kk, q in enumerate((0, 1, 2, 3, 5)):
            col = st[q] if not (kk == 3 and xx % 3 == 0) else st[5]
            c.p(xx, et + kk, col)
    for xx in range(x0, x1):
        for kk in range(5, ent):
            q = 2 if kk < ent - 5 else (1, 2, 2, 1, 3)[kk - (ent - 5)]
            c.p(xx, et + kk, st[q])
    if k['frieze'] == 'triglyph':
        for xx in range(x0, x1):
            j = (xx - x0) % (span // 2)
            if j < 5:
                for yy in range(et + 5, et + ent - 5):
                    c.p(xx, yy, st[(2, 4, 2, 4, 3)[j]])
    elif k['frieze'] == 'terracotta':
        for xx in range(x0, x1):
            for yy in range(et + 5, et + ent - 5):
                c.p(xx, yy, TILE[2] if ((xx - x0) // 6 + (yy - et)) % 2 else OCHRE[2])
    elif s['dedication']:
        t = s['dedication']
        text(c, apx - text_w(t) // 2, et + 6, t, GILT[1], GILT[5])
    for yy in range(ct, pt):
        for xx in range(x0 + 2, x1 - 2):
            row = (yy - ct) // 8
            joint = (yy - ct) % 8 == 7 or (xx + (row % 2) * 12) % 24 == 0
            c.p(xx, yy, TRAV[6] if joint else TRAV[5])
    dh = min(60, col_h - 14)
    op.door_studded(c, apx - 18, pt - dh, 36, dh, wood=BRONZE, studs=GILT)
    for xx in range(x0 + 2, x1 - 2):
        for kk in range(6):
            fp.shade(c, xx, ct + kk, 0.4 - kk * 0.06)
    for i in range(n):
        fp.column(c, x0 + 12 + i * span, ct, pt, st, d, k['order'])
    if k['base'] == 'crepidoma':
        # three steps the whole width, each a lit tread over a shaded riser
        for i in range(3):
            y0, y1 = pt + i * podium // 3, pt + (i + 1) * podium // 3
            for yy in range(y0, y1):
                for xx in range(x0 - 4 - i * 4, x1 + 4 + i * 4):
                    c.p(xx, yy, st[0] if yy == y0 else st[1] if yy == y0 + 1 else st[4])
    else:
        for yy in range(pt, base):
            for xx in range(x0 - 4, x1 + 4):
                row = (yy - pt) // 6
                j = (xx + (row % 2) * 11) % 22
                c.p(xx, yy, TRAV[4] if (yy - pt) % 6 == 5 or j == 0 else TRAV[2])
        for xx in range(x0 - 6, x1 + 6):
            for kk, q in enumerate((0, 1, 3)):
                c.p(xx, pt + kk, st[q])
            for kk, q in enumerate((1, 2, 4)):
                c.p(xx, base - 3 + kk, st[q])
        sw = span * (n - 2) + 6
        sx = apx - sw // 2
        steps = max(4, podium // 3)
        for i in range(steps):
            y0 = pt + 1 + i * (podium - 1) // steps
            y1 = pt + 1 + (i + 1) * (podium - 1) // steps
            for yy in range(y0, y1):
                for xx in range(sx, sx + sw):
                    c.p(xx, yy, st[0] if yy == y0 else st[1] if yy == y0 + 1 else st[4])
        for cx in (sx - 7, sx + sw):
            for yy in range(pt - 3, base):
                for kk in range(7):
                    c.p(cx + kk, yy, st[0] if yy < pt else st[(1, 1, 2, 2, 2, 3, 4)[kk]])
        op.cast(c, sx, pt + 1, 6, podium - 2, 0.7)
    for x, y, big in ((apx, rake(apx) - 1, True), (x0 - over + 2, rake(x0 - over) + 3, False),
                      (x1 + over - 2, rake(x1 + over) + 3, False)):
        acroterion(c, x, y, big)
    if info is not None:
        info.update(x0=x0 - 6, W=W + 12, base=base, door_x=apx, door_h=dh)
    finish(c)
    consolidate(c, rare=4)
    return c.im


def clipeus(c, cx, cy):
    for yy in range(cy - 7, cy + 8):
        for xx in range(cx - 8, cx + 9):
            d = math.hypot((xx - cx) / 8.3, (yy - cy) / 7.3)
            if d < 1:
                lit = (cx - xx) + (cy - yy) > 0
                c.p(xx, yy, (GILT[1] if lit else GILT[4]) if d > 0.7 else (GILT[2] if lit else GILT[3]) if d < 0.3 else MARBLE[2])
    for k in range(-3, 4):
        c.p(cx + k, cy, GILT[2] if k < 0 else GILT[4])


def acroterion(c, x, foot, big):
    rows = ('..o..', '.oLo.', 'oLLLo', '.oLo.', 'ooooo') if not big else (
        '...o...', '..oLo..', '.oLLLo.', 'oLLoLLo', '.oLLLo.', '..oLo..', 'ooooooo')
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x - len(row) // 2 + i, foot - len(rows) + j, GILT[4] if ch == 'o' else GILT[1])


# ------------------------------------------------------------------ the baths

def lunette(c, cx, spring, w):
    """A thermal window: a half-round light in a brick arch, divided by two
    mullions, glazed with the greenish glass the baths could afford."""
    R = w / 2
    glass = ramp(165, 0.04, lift=-0.12)
    for yy in range(int(spring - R) - 4, spring + 3):
        for xx in range(int(cx - R) - 4, int(cx + R) + 5):
            d = math.hypot(xx + 0.5 - cx, yy + 0.5 - spring)
            if yy >= spring:
                if abs(xx + 0.5 - cx) <= R + 4:
                    c.p(xx, yy, TRAV[0] if yy == spring else TRAV[3])
            elif d < R:
                q = 2 if (xx - cx) + (yy - spring) * 0.5 < -R * 0.3 else 3
                if abs(xx + 0.5 - cx) < 1.2 or abs(abs(xx + 0.5 - cx) - R * 0.5) < 1:
                    c.p(xx, yy, TRAV[2])
                else:
                    c.p(xx, yy, glass[q])
            elif d < R + 4:
                a = math.atan2(yy + 0.5 - spring, xx + 0.5 - cx)
                c.p(xx, yy, BRICK[1] if d < R + 1 else BRICK[2 + int(a * 12) % 2])
    for k in range(3):
        for xx in range(int(cx - R), int(cx + R) + 1):
            for yy in range(int(spring - R), spring):
                if math.hypot(xx + 0.5 - cx, yy + 0.5 - spring) < R and yy - (spring - R) < k + 1:
                    fp.shade(c, xx, yy, 0.12)


class BathHall(EaveHouse):
    """The bath's great hall, the frigidarium: tall brick walls lit by thermal
    windows under a hipped tile roof."""

    def __init__(self, spec=None):
        s = dict(W=180, storeys=['testaceum'], heights=[104], roof='imbrex', hip=True, rise=40, antefixes=True,
                 stacks='none', plinth=None, wear=0.25, seed=8)
        s.setdefault('edge', 'finish')
        s.update(spec or {})
        super().__init__(s)

    def openings(self):
        c, x0, W, base = self.c, self.x0, self.W, self.base
        top = self.floors[0][0]
        n = max(1, (W - 20) // 56)
        lw = min(44, (W - 20) // n - 12)
        for i in range(n):
            cx = x0 + round(W * (i + 0.5) / n)
            lunette(c, cx, top + 12 + lw // 2, lw)
        fm.ashlar(c, x0, base - 6, W, 6, TRAV, 6, 22)
        self.cols, self.door_col, self.door_x, self.door_h = [x0 + W // 2], 0, x0 + W // 2, 54
        self.sills = []


def portico(c, cx, base, n=4, col_h=66, span=26, d=10, stone=None):
    """A columned porch with a low pediment, its roof running back above the
    raking cornice; the shade under it on the wall behind."""
    st = stone or MARBLE
    W = (n - 1) * span + d + 14
    x0 = cx - W // 2
    ct = base - 4 - col_h
    et = ct - 12
    for yy in range(ct, base - 4):
        for xx in range(x0 + 2, x0 + W - 2):
            fp.shade(c, xx, yy, 0.45 if yy < ct + 8 else 0.32)
    op.door_studded(c, cx - 14, base - 54, 28, 50, wood=BRONZE, studs=GILT)
    for i in range(n):
        fp.column(c, x0 + 7 + i * span, ct, base - 4, st, d, 'corinthian')
    for xx in range(x0 - 3, x0 + W + 3):
        for k, q in enumerate((0, 1, 2, 3, 2, 2, 2, 2, 1, 3, 4, 5)):
            c.p(xx, et + k, st[q] if not (k == 3 and xx % 3 == 0) else st[5])
    rise = W // 6
    for i in range(-W // 2 - 4, W // 2 + 5):
        y = round(et - (W / 2 + 4 - abs(i)) * rise / (W / 2 + 4))
        for yy in range(y + 4, et):
            c.p(cx + i, yy, st[3])
        for k, q in enumerate((0, 1, 2, 4)):
            c.p(cx + i, y + k, st[q if i < 0 else min(7, q + 1)])
    for k in range(3):
        c.rect(x0 - 6 - k * 3, base - 4 + k, W + 12 + k * 6, 1, st[k + 1])
    acroterion(c, cx, et - rise - 1, True)


def thermae(spec=None, info=None):
    """A public bath: the tall frigidarium in the middle lit by thermal windows,
    its columned porch on the street; either side a lower wing, the warm rooms,
    each under a dome with its oculus."""
    s = {**dict(W=272), **(spec or {})}
    W = s['W']
    hw = max(120, round(W * 0.5))
    ww = (W - hw) // 2 + 8
    H = BathHall(dict(W=hw, heights=[min(140, 112 + W // 12)]))
    him = H.build()
    wings = [Casa(dict(W=ww, storeys=['testaceum'], heights=[66], rise=22, windows=('roman', 'grille'),
                       shutters=None, seed=11 + i)) for i in range(2)]
    wims = [w.build() for w in wings]
    off = max(0, max(w.base for w in wings) - H.base)
    canvas_w = W + 60
    c = C(canvas_w, max(him.height, max(i.height for i in wims)) + off + 10)
    base = c.h - 6
    cx = canvas_w // 2
    for i, (w, im) in enumerate(zip(wings, wims)):
        wx = (cx - hw // 2 - ww + 8) if i == 0 else (cx + hw // 2 - 8)
        c.im.alpha_composite(im, (wx - w.x0, base - w.base))
    c.px = c.im.load()
    for i, w in enumerate(wings):
        wx = (cx - hw // 2 - ww + 8) if i == 0 else (cx + hw // 2 - 8)
        dcx = wx + ww // 2
        foot = base - w.heights[0] - 12
        R = min(30, ww // 2 - 6)
        so.lathe(c, dcx, foot, [(0, R + 2), (8, R + 2), (9, R + 3), (11, R + 3)], TRAV)
        so.dome(c, dcx, foot, R, TILE, z0=11, kind='hemi', courses=4, ribs=12)
        so.ellipse(c, dcx, foot - 11 - R + 3, 4, 2, (40, 30, 40, 255))
    c.im.alpha_composite(him, (cx - hw // 2 - H.x0, base - H.base))
    c.px = c.im.load()
    portico(c, cx, base, 4 if hw < 200 else 6, col_h=52)
    if info is not None:
        info.update(x0=cx - W // 2, W=W, base=base, door_x=cx, door_h=50)
    finish(c)
    consolidate(c, rare=6)
    return c.im


# ------------------------------------------------------------------ the market stall

AWNINGS = [(ramp(25, 0.13, lift=-0.06), ramp(80, 0.04, lift=0.06)), (ramp(240, 0.08, lift=-0.06), ramp(80, 0.04, lift=0.06)),
           (ramp(60, 0.12, lift=-0.02), ramp(28, 0.1, lift=-0.1))]


def stall(spec=None, info=None):
    """A market stall: a board counter whose top carries the goods, two posts,
    a striped linen awning sloping toward us with its scalloped edge, and its
    shade on the counter."""
    s = {**dict(W=64, goods='loaves:quadratus', awning=0), **(spec or {})}
    W = s['W']
    c = C(W + 24, 92)
    x0, base = 12, 86
    so.box(c, x0, base, W, 18, 14, fg.counter.__defaults__ and (lambda c, x, y, w, h: fm.boards(c, x, y, w, h)),
           OAK)
    top = base - 18 - round(14 * so.K)
    fg.place(c, x0 + 2, x0 + W - 2, base - 22, 18, s['goods'])
    for px in (x0 + 1, x0 + W - 4):
        c.rect(px, base - 62, 3, 62, OAK[3]); c.rect(px, base - 62, 1, 62, OAK[2])
    a, b = AWNINGS[s['awning'] % len(AWNINGS)]
    ay0, ay1 = base - 72, base - 56
    for yy in range(ay0, ay1):
        for xx in range(x0 - 4, x0 + W + 4):
            stripe = ((xx - x0) // 6) % 2
            r = a if stripe else b
            t = (yy - ay0) / (ay1 - ay0)
            c.p(xx, yy, r[1 if t < 0.3 else 2 if t < 0.8 else 3])
    for xx in range(x0 - 4, x0 + W + 4):
        stripe = ((xx - x0) // 6) % 2
        r = a if stripe else b
        drop = 3 if (xx - x0) % 6 in (2, 3) else 2
        for k in range(drop):
            c.p(xx, ay1 + k, r[3 if k < drop - 1 else 4])
    op.cast(c, x0, ay1 + 3, W, 6, 0.6)
    if info is not None:
        info.update(x0=x0, W=W, base=base, door_x=x0 + W // 2, door_h=30)
    finish(c)
    consolidate(c, rare=4)
    return c.im


SHEET = [('thermae', thermae), ('stall', stall), ('casa', casa), ('domus', domus), ('insula', insula), ('tabernae', tabernae), ('temple', temple),
         ('Persian courtyard house', persian)]


def make(out):
    from art.front_review import sheet
    sheet([(label, fn()) for label, fn in SHEET], out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-roman.png')
