"""The buildings of a world's fair, drawn front-on: one painter per pavilion
style in `src/content/fairs/types.ts`, sized to the footprint the fair's plan
gives each building, and the legs of the Tower.

    .venv/bin/python scripts/art/front_fair.py artifacts/fair/sheet.png   # review sheet
    .venv/bin/python scripts/art/front_fair.py --bake                     # public/packs/fair

A frame is `fair-<building id>`, (w * 16 + 2 * M) wide; its bottom row is the
front edge of the footprint and its left edge M px left of the footprint.
"""
from pathlib import Path
import math
import re
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402
from art.front_eave import TONES  # noqa: E402
from art.front_solid import dome, box  # noqa: E402
from art.front_stepped import coursed  # noqa: E402
from art.front_parts import (  # noqa: E402
    DARK, LIGHT, VOID, GOLD, shade, cast_right, cast_down, raised, rounded, pointed, surround, window, wall,
    column, plinth, string_course, parapet, roof_band,
)

M = 12
# Headroom over the footprint for domes, towers and finials.
TOP = 120
IRON = ramp(262, 0.028, lift=-0.2)
TOWER = ramp(32, 0.1, lift=-0.16)
TILE_BLUE = ramp(232, 0.1, lift=-0.06)
TILE_GREEN = ramp(165, 0.08, lift=-0.06)
TERRACOTTA = RAMPS['terracotta']
LACQUER = ramp(26, 0.15, lift=-0.1)
CREAM = ramp(85, 0.035, lift=0.04)
OCHRE = ramp(70, 0.1)
BAMBOO = ramp(88, 0.08, lift=-0.02)
SKY_GLASS = ramp(215, 0.05, lift=-0.08)
COLOURED = [ramp(28, 0.14, lift=-0.1), ramp(80, 0.12, lift=-0.04), ramp(150, 0.08, lift=-0.14), ramp(250, 0.1, lift=-0.14)]
fm.glazes(SKY_GLASS, *COLOURED)


class Pav:
    """A canvas for one building: footprint x0..x1 along the bottom row `base`."""

    def __init__(self, w, h, top=TOP):
        self.W, self.D = w * 16, h * 16
        self.c = C(self.W + 2 * M, self.D + top)
        self.x0, self.x1, self.base = M, M + self.W, self.D + top
        self.cx = M + self.W // 2

    def done(self):
        finish(self.c)
        consolidate(self.c)
        return self.c.im


# ------------------------------------------------------------------ shared parts

def doorway(c, cx, base, w=22, h=44, shape='round', r=None, leaves=None):
    """The door: the darkest shape on the front, a clean arch in a frame."""
    x0, top = cx - w // 2, base - h
    if r:
        surround(c, x0, top, w, h, shape, r, 2)
    f = {'round': rounded, 'pointed': pointed}.get(shape)
    spring = top + (w // 2 if shape == 'round' else round(w * 0.87) if shape == 'pointed' else 0)
    for y in range(top, base):
        for x in range(x0, x0 + w):
            if f is None or f(x, y, x0, spring, w):
                c.p(x, y, VOID if leaves is None or y < spring + 2 else leaves[3 if (x - x0) % 6 else 5])
    op.reveal(c, x0, top, w, h, 3)


def horseshoe(x, y, x0, spring, w):
    if y >= spring:
        return x0 <= x < x0 + w
    r = w / 2 + 1.5
    return (x - x0 + 0.5 - w / 2) ** 2 + ((spring - y) * 1.0) ** 2 <= r * r and x0 - 1 <= x < x0 + w + 1


def opening(c, x0, top, w, h, fn, col=VOID, rim=None):
    spring = top + w // 2 + 1
    for y in range(top - 3, top + h):
        for x in range(x0 - 3, x0 + w + 3):
            if rim and fn(x, y, x0 - 2, spring, w + 4) and not fn(x, y, x0, spring, w):
                c.p(x, y, rim[1] if x < x0 + w // 2 else rim[3])
            elif fn(x, y, x0, spring, w):
                c.p(x, y, col)
    op.reveal(c, x0, top, w, h, 2)


def slab_roof(c, x0, x1, top, depth, r, edge=None):
    """A flat roof seen from above: one even tone, a darker ring at the far rim."""
    c.rect(x0, top, x1 - x0, depth, r[2])
    c.rect(x0, top, x1 - x0, 1, r[3])
    c.rect(x0, top + depth - 1, x1 - x0, 1, (edge or r)[0])


def flag(c, x, top, cols):
    c.rect(x, top, 1, 18, IRON[2])
    c.p(x, top - 1, GOLD[1])
    for i, col in enumerate(cols):
        for y in range(top + 1, top + 8):
            wave = round(math.sin((y - top) * 0.6 + i) * 0.6)
            c.rect(x + 1 + i * 3, y + wave, 3, 1, col)


def glazed(c, x, y, w, h, frame=IRON, bars=4, tint=SKY_GLASS):
    """An iron frame glazed in small panes, the sky's light caught high on the left."""
    c.rect(x, y, w, h, frame[3])
    for yy in range(y + 1, y + h - 1):
        for xx in range(x + 1, x + w - 1):
            if (xx - x) % bars == 0 or (yy - y) % (bars + 2) == 0:
                c.p(xx, yy, frame[2])
                continue
            k = 2 + (1 if yy - y > h * 0.6 else 0) - (1 if (xx - x) + (yy - y) < min(w, h) * 0.5 else 0)
            c.p(xx, yy, tint[max(1, min(5, k + 1))])


def tile_band(c, x, y, w, h, cols, step=4):
    """A frieze of glazed tiles: diamonds in two colours on a cream ground."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = (xx - x) % step, (yy - y) % step
            d = abs(a - step // 2) + abs(b - step // 2)
            c.p(xx, yy, cols[0][1] if d < step // 2 - 0 else cols[1][2] if d == step // 2 else CREAM[1])
    c.rect(x, y, w, 1, CREAM[0])
    c.rect(x, y + h - 1, w, 1, CREAM[3])


def hip_roof(c, x0, x1, eave, rise, tone, cover='slate', hip=0.6):
    roof_band(c, x0 - 3, x1 + 3, eave, rise, cover, tone, hip=hip)


def steps(c, cx, base, w, n, r):
    for k in range(n):
        y = base - (k + 1) * 3
        c.rect(cx - w // 2 - (n - k) * 2, y, w + (n - k) * 4, 3, r[1 + (k % 2)])
        c.rect(cx - w // 2 - (n - k) * 2, y, w + (n - k) * 4, 1, r[0])


# ------------------------------------------------------------------ styles

def classical(w, h, look):
    """A pavilion in the academic manner: rendered walls, a portico of four
    columns under a pediment, round-headed windows, a slate hip behind."""
    p = Pav(w, h)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    wallr = [RAMPS['limestone'], RAMPS['plaster-ochre'], ramp(20, 0.05, lift=0.02)][look % 3]
    hw = min(62, p.D - 24)
    eave = base - hw
    hip_roof(c, x0, x1, eave, p.D - hw - 6, TONES['slate-blue'])
    wall(c, x0, eave, p.W, hw, 'render', wallr)
    plinth(c, x0, base - 7, p.W, RAMPS['limestone'])
    c.rect(x0 - 2, eave, p.W + 4, 3, RAMPS['limestone'][0])
    c.rect(x0 - 2, eave + 3, p.W + 4, 2, RAMPS['limestone'][2])
    cast_down(c, x0, x1, eave + 5, 3, 0.3)
    bay = 22
    port = min(p.W - 24, 64)
    for x in range(x0 + 10, x1 - 16, bay):
        if abs(x + 7 - cx) < port // 2 + 6:
            continue
        window(c, 'roundhead', x + 7, eave + 14, 12, 26, RAMPS['limestone'], seed=x, glass='clear')
    # The portico: a pediment over four columns, standing out on steps.
    pl, pr = cx - port // 2, cx + port // 2
    ptop = eave - 2
    c.rect(pl - 2, ptop, port + 4, 6, RAMPS['limestone'][1])
    c.rect(pl - 2, ptop, port + 4, 1, RAMPS['limestone'][0])
    rise = port // 4
    for k in range(rise):
        half = (port // 2 + 3) * (rise - k) // rise
        c.rect(cx - half, ptop - 1 - k, 2 * half, 1, RAMPS['limestone'][2] if k else RAMPS['limestone'][3])
        c.p(cx - half, ptop - 1 - k, RAMPS['limestone'][0])
        c.p(cx + half - 1, ptop - 1 - k, RAMPS['limestone'][4])
    for k in range(rise - 4):
        half = (port // 2 - 4) * (rise - 4 - k) // (rise - 4)
        c.rect(cx - half, ptop - 3 - k, 2 * half, 1, wallr[2])
    doorway(c, cx, base - 6, shape='round')
    for i in range(4):
        x = pl + 4 + i * (port - 18) // 3
        column(c, x + 5, ptop + 6, base - 7, RAMPS['limestone'], d=8, order='ionic')
    steps(c, cx, base, port, 2, RAMPS['limestone'])
    flag(c, cx, ptop - rise - 16, [ramp(250, 0.12, lift=-0.1)[2], LIGHT, ramp(28, 0.16)[2]])
    return p.done()


def timber(w, h, look):
    """Timber: the forestry pavilion of logs and bark, a thatched hut, or a
    half-timbered house. A big gable faces the crowd."""
    p = Pav(w, h)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    hw = min(46, p.D - 30)
    eave = base - hw
    rise = p.D - hw + 10
    if look == 1:
        roof_band(c, x0 - 6, x1 + 6, eave, rise, 'thatch', TONES['straw'], hip=0.35)
        fm.boards(c, x0 + 2, eave + 2, p.W - 4, hw - 2, BAMBOO, board=4)
    elif look == 2:
        roof_band(c, x0 - 4, x1 + 4, eave, rise, 'plain', TONES['tile-red'], hip=0.15)
        fm.half_timber(c, x0, eave + 2, p.W, hw - 2)
    else:
        roof_band(c, x0 - 6, x1 + 6, eave, rise, 'shingle', TONES['shingle'], hip=0.0)
        fm.logs(c, x0, eave + 2, p.W, hw - 2, RAMPS['oak'], d=6)
        # A gable of logs ends and a bark-clad porch.
        g = min(p.W // 2 - 8, rise)
        for k in range(g):
            half = (g - k)
            c.rect(cx - half, eave - k, 2 * half, 1, RAMPS['cedar'][2 + (k // 3) % 2])
        for k in range(g + 2):
            c.p(cx - (g - k) - 1, eave - k, RAMPS['oak'][1]); c.p(cx - (g - k) - 2, eave - k, RAMPS['oak'][3])
            c.p(cx + (g - k), eave - k, RAMPS['oak'][3]); c.p(cx + (g - k) + 1, eave - k, RAMPS['oak'][5])
    for x in range(x0 + 6, x1 - 14, 26):
        if abs(x + 6 - cx) < 22:
            continue
        c.rect(x, eave + 12, 12, 14, RAMPS['oak'][4])
        op.casement(c, x + 1, eave + 13, 10, 12, 'oak')
    doorway(c, cx, base, 22, min(40, hw - 4), shape='square', r=RAMPS['oak'])
    for x in (cx - 18, cx + 15):
        c.rect(x, eave + 2, 3, hw - 2, RAMPS['oak'][2]); c.rect(x, eave + 2, 1, hw - 2, RAMPS['oak'][1])
        cast_right(c, x + 3, eave + 2, base, 2, 0.3)
    return p.done()


def moorish(w, h, look):
    """North African: whitewash, a horseshoe doorway in a tiled frame, wooden
    lattice windows, a crenellated parapet; a dome and a minaret on the grand
    ones, a striped awning on the café."""
    p = Pav(w, h)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    hw = min(58, p.D - 18)
    eave = base - hw
    slab_roof(c, x0, x1, base - p.D + 4, p.D - hw - 4, RAMPS['whitewash'])
    if look == 0:
        dome(c, cx, eave - 4, min(22, p.W // 5), RAMPS['whitewash'], drum=6, courses=0, lantern=(2, 5))
        mx = x1 - 22
        coursed(c, mx, eave - 70, 14, 70, RAMPS['whitewash'], q=1, course=6, block=14)
        tile_band(c, mx, eave - 64, 14, 8, [TILE_GREEN, TILE_BLUE])
        c.rect(mx - 2, eave - 72, 18, 3, RAMPS['whitewash'][0])
        c.rect(mx + 3, eave - 86, 8, 14, RAMPS['whitewash'][1]); c.rect(mx + 9, eave - 86, 2, 14, RAMPS['whitewash'][3])
        dome(c, mx + 7, eave - 86, 5, TILE_GREEN, courses=0)
        c.rect(mx + 7, eave - 98, 1, 5, GOLD[2]); c.p(mx + 7, eave - 99, GOLD[0])
        opening(c, mx + 4, eave - 58, 6, 12, horseshoe)
    fm.whitewash(c, x0, eave, p.W, hw)
    parapet(c, x0, eave, p.W, RAMPS['whitewash'], 'crenel')
    tile_band(c, x0, eave + 4, p.W, 5, [TILE_BLUE, TILE_GREEN])
    dw = 24 if look != 1 else 20
    for y in range(base - 52, base):
        for x in range(cx - dw // 2 - 6, cx + dw // 2 + 6):
            if horseshoe(x, y, cx - dw // 2 - 6, base - 52 + dw // 2 + 8, dw + 12):
                c.p(x, y, TILE_GREEN[2] if (x + y) % 4 else TILE_BLUE[1])
    opening(c, cx - dw // 2, base - 46, dw, 46, horseshoe)
    for x in range(x0 + 8, x1 - 16, 24):
        if abs(x + 7 - cx) < dw // 2 + 14:
            continue
        if look == 1 and x % 48 < 24:
            # A mashrabiya oriel on corbels.
            box(c, x - 2, eave + 34, 18, 22, 6, RAMPS['cedar'])
            for yy in range(eave + 14, eave + 34):
                for xx in range(x, x + 14):
                    c.p(xx, yy, RAMPS['cedar'][2] if (xx + yy) % 3 else RAMPS['cedar'][5])
            cast_down(c, x - 2, x + 16, eave + 34, 3, 0.4)
        else:
            opening(c, x + 2, eave + 18, 10, 18, horseshoe, col=RAMPS['cedar'][4], rim=RAMPS['whitewash'])
            for yy in range(eave + 26, eave + 36, 2):
                c.rect(x + 2, yy, 10, 1, RAMPS['cedar'][2])
    if look == 2:
        for x in range(x0 + 2, x1 - 2):
            for y in range(eave + 30, eave + 38):
                c.p(x, y, ramp(28, 0.14)[2] if ((x - x0) // 5) % 2 else CREAM[1])
            c.p(x, eave + 38, ramp(28, 0.14)[4] if (x // 5) % 2 else CREAM[3])
        cast_down(c, x0 + 2, x1 - 2, eave + 39, 4, 0.35)
    return p.done()


def aztec(w, h, look):
    """The Mexican pavilion's Aztec palace: a battered stone base, a frieze of
    stepped frets, figures in relief either side of a broad stair, and a
    cresting of stepped merlons."""
    p = Pav(w, h)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    stone = [OCHRE, RAMPS['sandstone']][look % 2]
    red = ramp(28, 0.13, lift=-0.12)
    hw = min(60, p.D - 20)
    eave = base - hw
    slab_roof(c, x0 + 2, x1 - 2, base - p.D + 6, p.D - hw - 6, stone)
    # The talus: a sloping skirt up a third of the wall.
    for k in range(18):
        inset = 6 - k // 3
        coursed(c, x0 - inset, base - 1 - k, p.W + 2 * inset, 1, stone, q=2, course=6, block=16, seed=k)
    coursed(c, x0, eave, p.W, hw - 18, stone, q=1, course=7, block=20)
    c.rect(x0, base - 19, p.W, 2, stone[0])
    # The fret frieze.
    fy = eave + 3
    c.rect(x0, fy - 1, p.W, 10, red[3])
    for x in range(x0, x1, 10):
        for (a, b, ww, hh) in ((0, 0, 8, 2), (6, 2, 2, 4), (2, 4, 4, 2), (2, 6, 2, 2)):
            c.rect(x + a, fy + b, ww, hh, stone[1])
    c.rect(x0 - 2, eave - 2, p.W + 4, 3, stone[0])
    for x in range(x0, x1 - 4, 8):
        for k in range(3):
            c.rect(x + k, eave - 4 - k * 2, 6 - 2 * k, 2, stone[1 + k % 2])
    for side in (-1, 1):
        rx = cx + side * (p.W // 4 + 6) - 9
        raised(c, rx, eave + 18, 18, 22, stone, 2)
        for (a, b, ww, hh, q) in ((7, 2, 5, 5, 4), (5, 7, 9, 8, 3), (3, 9, 2, 6, 4), (14, 9, 2, 6, 4), (6, 15, 3, 5, 4), (10, 15, 3, 5, 4)):
            c.rect(rx + a - 2, eave + 18 + b, ww, hh, stone[q])
        c.rect(rx + 5, eave + 20, 9, 2, GOLD[2])
    opening(c, cx - 12, base - 40, 24, 40 - 6, lambda x, y, a, s, ww: a <= x < a + ww + max(0, (y - (base - 40)) // 8 - 2) and x >= a - max(0, (y - (base - 40)) // 8 - 2))
    steps(c, cx, base, 30, 2, stone)
    flag(c, cx, eave - 30, [ramp(150, 0.1)[2], LIGHT, red[1]])
    return p.done()


def inca(w, h, look):
    """The Ecuadorian Temple of the Sun: fitted stone in courses, trapezoidal
    door and niches, a high hipped roof of grass."""
    p = Pav(w, h)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    hw = min(48, p.D - 32)
    eave = base - hw
    roof_band(c, x0 - 4, x1 + 4, eave, p.D - hw + 8, 'thatch', TONES['straw'], hip=0.5)
    coursed(c, x0, eave, p.W, hw, RAMPS['granite'], q=1, course=7, block=14, fitted=True)

    def trap(x, y, a, s, ww, top=base - 38):
        k = (y - top) // 6
        return a + 3 - k // 2 <= x < a + ww - 3 + k // 2
    for x in range(x0 + 6, x1 - 12, 18):
        if abs(x + 5 - cx) < 20:
            continue
        opening(c, x, eave + 12, 11, 20, lambda xx, yy, a, s, ww, t=eave + 12: a + 2 - (yy - t) // 8 <= xx < a + ww - 2 + (yy - t) // 8, col=RAMPS['granite'][5])
    opening(c, cx - 11, base - 38, 22, 38, trap)
    c.rect(cx - 7, eave + 2, 14, 7, GOLD[2]); c.rect(cx - 5, eave + 3, 10, 5, GOLD[1]); c.p(cx, eave + 5, GOLD[0])
    return p.done()


def iron_glass(w, h, look):
    """Iron and glass: a frame of painted iron bays glazed in clear and
    coloured panes, corner turrets, and over the middle a glazed dome."""
    p = Pav(w, h)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    paint = [ramp(240, 0.04, lift=-0.1), IRON][look % 2]
    hw = min(64, p.D - 18)
    eave = base - hw
    slab_roof(c, x0, x1, base - p.D + 6, p.D - hw - 6, paint)
    plinth(c, x0, base - 8, p.W, RAMPS['granite'])
    bay = 16
    for i, x in enumerate(range(x0, x1, bay)):
        bw = min(bay, x1 - x)
        glazed(c, x + 1, eave + 6, bw - 2, hw - 14, paint, 3, COLOURED[i % 4] if i % 3 == 1 else SKY_GLASS)
        c.rect(x, eave + 2, 2, hw - 8, paint[1]); c.rect(x + 1, eave + 2, 1, hw - 8, paint[3])
    c.rect(x0, eave, p.W, 6, paint[2]); c.rect(x0, eave, p.W, 1, paint[0])
    for x in range(x0, x1, 4):
        c.rect(x + 1, eave - 4, 1, 4, paint[3]); c.p(x + 1, eave - 5, GOLD[1])
    cast_down(c, x0, x1, eave + 6, 2, 0.3)
    for tx in (x0 - 2, x1 - 14):
        coursed(c, tx, eave - 12, 16, hw + 4, paint, q=1, course=8, block=16)
        dome(c, tx + 8, eave - 12, 8, paint, courses=3, lantern=(1, 4))
    if look == 0:
        dome(c, cx, eave - 2, min(26, p.W // 4), SKY_GLASS, drum=8, ribs=12, courses=4, lantern=(3, 6))
        flag(c, cx, eave - 66, [ramp(240, 0.1, lift=0.05)[1], LIGHT, ramp(240, 0.1, lift=0.05)[1]])
    doorway(c, cx, base - 8, 24, 40, shape='round', r=paint)
    steps(c, cx, base, 30, 2, RAMPS['granite'])
    return p.done()


def pagoda(w, h, look):
    """Annam and China: red lacquered columns on a stone plinth, and over
    them a tiled roof whose ends sweep up, two tiers on the grander front."""
    p = Pav(w, h)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    hw = min(40, p.D - 34)
    eave = base - hw
    tile = TONES.get('kawara') or RAMPS['kawara']
    green = ramp(150, 0.07, lift=-0.08)
    roof = [green, tile][look % 2]
    roof_band(c, x0 - 10, x1 + 10, eave, p.D - hw - 10, 'pantile', roof, hip=0.3)
    for side in (-1, 1):
        ex = x0 - 10 if side < 0 else x1 + 9
        for k in range(6):
            c.p(ex - side * k, eave + 1 - (5 - k) // 1, roof[1]); c.p(ex - side * k, eave + 2 - (5 - k), roof[3])
    if look == 0:
        roof_band(c, cx - p.W // 4, cx + p.W // 4, eave - 24, 14, 'pantile', roof, hip=0.4)
        for k in range(5):
            c.rect(cx - 2 + k % 2, eave - 44 - k * 2, 4, 2, GOLD[1 + k % 2])
    c.rect(x0, eave + 3, p.W, hw - 9, ramp(70, 0.05)[1])
    for x in range(x0 + 2, x1 - 2, 16):
        c.rect(x, eave + 3, 4, hw - 9, LACQUER[2]); c.rect(x, eave + 3, 1, hw - 9, LACQUER[1]); c.rect(x + 3, eave + 3, 1, hw - 9, LACQUER[4])
        cast_right(c, x + 4, eave + 3, base - 6, 2, 0.3)
        if abs(x + 8 - cx) > 16 and x + 16 < x1:
            for yy in range(eave + 10, eave + 24):
                for xx in range(x + 6, x + 14):
                    c.p(xx, yy, LACQUER[3] if (xx + yy) % 4 == 0 or (xx - yy) % 4 == 0 else ramp(80, 0.05)[1])
    c.rect(x0, eave + 3, p.W, 4, GOLD[3]); c.rect(x0, eave + 3, p.W, 1, GOLD[1])
    doorway(c, cx, base - 6, 20, 30, shape='square')
    plinth(c, x0, base - 6, p.W, RAMPS['granite'])
    steps(c, cx, base, 24, 1, RAMPS['granite'])
    return p.done()


def khmer(w, h, look):
    """Angkor: sandstone on a stepped base, a gallery of pillars, and a tower
    of diminishing tiers, the corncob prang, over the door."""
    p = Pav(w, h)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    stone = ramp(60, 0.05, lift=-0.06)
    hw = min(40, p.D - 30)
    eave = base - hw
    slab_roof(c, x0 + 4, x1 - 4, base - p.D + 8, p.D - hw - 8, stone)
    for k, ww in enumerate((p.W + 8, p.W + 2)):
        coursed(c, cx - ww // 2, base - 4 * (k + 1), ww, 4, stone, q=2, course=4, block=12, seed=k)
        c.rect(cx - ww // 2, base - 4 * (k + 1), ww, 1, stone[0])
    coursed(c, x0 + 2, eave, p.W - 4, hw - 8, stone, q=1, course=6, block=12)
    for x in range(x0 + 6, x1 - 8, 12):
        c.rect(x, eave + 6, 5, hw - 16, stone[1]); c.rect(x + 4, eave + 6, 1, hw - 16, stone[3])
        cast_right(c, x + 5, eave + 6, base - 10, 2, 0.35)
    c.rect(x0, eave - 2, p.W, 4, stone[1]); c.rect(x0, eave - 2, p.W, 1, stone[0])
    for x in range(x0, x1 - 4, 6):
        c.rect(x + 1, eave - 6, 4, 4, stone[2]); c.p(x + 2, eave - 7, stone[1])
    # The prang: tier on tier, each a little narrower, each with a row of petals.
    tw, ty = min(30, p.W // 3), eave - 2
    for k in range(9):
        ww = tw - k * 3
        th = 7 - k // 3
        coursed(c, cx - ww // 2, ty - th, ww, th, stone, q=1 + k % 2, course=th, block=6)
        for x in range(cx - ww // 2, cx + ww // 2, 5):
            c.p(x + 2, ty - th - 1, stone[1])
        ty -= th
    c.rect(cx - 1, ty - 6, 3, 6, GOLD[2]); c.p(cx, ty - 7, GOLD[0])
    opening(c, cx - 9, base - 36, 18, 36 - 8, rounded, rim=stone)
    for side in (-1, 1):
        c.rect(cx + side * 13 - 2, base - 30, 5, 22, stone[2])
    return p.done()


def formige(w, h, look):
    """Formigé's palaces of the Fine and Liberal Arts: an iron frame filled
    with glazed terracotta and coloured tile, arched bays with glass, a long
    balcony, and tiled domes at the ends and the middle."""
    p = Pav(w, h, TOP + 20)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    hw = min(74, p.D - 16)
    eave = base - hw
    dometile = [TILE_BLUE, TILE_GREEN][look % 2]
    slab_roof(c, x0, x1, base - p.D + 2, p.D - hw - 2, SKY_GLASS)
    for x in range(x0 + 4, x1 - 4, 10):
        c.rect(x, base - p.D + 3, 1, p.D - hw - 4, IRON[3])
    plinth(c, x0, base - 8, p.W, RAMPS['limestone'])
    fm.brick(c, x0, eave, p.W, hw - 8, TERRACOTTA)
    bay = 28
    for x in range(x0 + 4, x1 - bay + 1, bay):
        bx = x + 3
        if abs(bx + 10 - cx) < 20:
            continue
        opening(c, bx, eave + 16, 22, hw - 32, rounded, col=VOID, rim=CREAM)
        glazed(c, bx + 1, eave + 22, 20, hw - 38, IRON, 4)
        tile_band(c, x, eave + 6, bay, 6, [dometile, TERRACOTTA])
        c.rect(x, eave + 4, 2, hw - 12, IRON[2]); c.rect(x, eave + 4, 1, hw - 12, IRON[1])
    c.rect(x0 - 2, eave - 3, p.W + 4, 4, CREAM[1]); c.rect(x0 - 2, eave - 3, p.W + 4, 1, CREAM[0])
    cast_down(c, x0, x1, eave + 1, 3, 0.35)
    for x in range(x0, x1, 5):
        c.rect(x + 1, eave - 7, 2, 4, CREAM[2]); c.p(x + 1, eave - 8, CREAM[0])
    for dx in (x0 + 14, x1 - 14):
        coursed(c, dx - 12, eave - 14, 24, 14, CREAM, q=1, course=7, block=12)
        dome(c, dx, eave - 14, 13, dometile, courses=4, ribs=8, lantern=(2, 6))
    # The central portal: a great arch in a tiled frame under the big dome.
    coursed(c, cx - 22, eave - 24, 44, 24, CREAM, q=1, course=8, block=11)
    dome(c, cx, eave - 24, 22, dometile, courses=5, ribs=12, drum=4, lantern=(3, 8))
    for y in range(eave + 2, base - 8):
        for x in range(cx - 20, cx + 20):
            if rounded(x, y, cx - 20, eave + 22, 40) and not rounded(x, y, cx - 15, eave + 22, 30):
                c.p(x, y, dometile[2] if (x // 3 + y // 3) % 2 else GOLD[2])
    opening(c, cx - 15, eave + 8, 30, hw - 16, rounded)
    glazed(c, cx - 13, eave + 12, 26, 20, IRON, 4, COLOURED[1])
    doorway(c, cx, base - 8, 22, 40, shape='square')
    flag(c, cx, eave - 90, [ramp(250, 0.12, lift=-0.1)[2], LIGHT, ramp(28, 0.16)[2]])
    return p.done()


def dome_central(w, h, look):
    """The Dôme Central: a square block under a high tiled dome crowned by a
    gilded figure, its front one great arch in a frame of coloured tile."""
    p = Pav(w, h, TOP + 60)
    c, x0, x1, base, cx = p.c, p.x0, p.x1, p.base, p.cx
    hw = min(84, p.D - 10)
    eave = base - hw
    slab_roof(c, x0, x1, base - p.D + 2, p.D - hw - 2, CREAM)
    for dx in (x0 + 10, x1 - 10):
        coursed(c, dx - 10, eave - 20, 20, 20, CREAM, q=1, course=7, block=10)
        dome(c, dx, eave - 20, 10, TILE_BLUE, courses=3, ribs=8, lantern=(2, 5))
    coursed(c, cx - 36, eave - 30, 72, 30, CREAM, q=1, course=8, block=12)
    for x in range(cx - 34, cx + 34, 8):
        opening(c, x + 2, eave - 24, 4, 12, rounded, col=IRON[4])
    dome(c, cx, eave - 30, 36, TILE_BLUE, courses=6, ribs=16, drum=6, lantern=(5, 12))
    top = eave - 30 - 6 - 36 - 12
    c.rect(cx - 2, top - 14, 4, 10, GOLD[2]); c.rect(cx - 2, top - 14, 1, 10, GOLD[0])
    c.rect(cx - 5, top - 12, 3, 2, GOLD[1]); c.rect(cx + 2, top - 16, 2, 4, GOLD[1])
    c.rect(cx - 1, top - 17, 3, 3, GOLD[1])
    fm.ashlar(c, x0, eave, p.W, hw - 8, CREAM, 8, 20)
    tile_band(c, x0, eave + 2, p.W, 8, [TILE_BLUE, TERRACOTTA], 6)
    for y in range(eave + 12, base - 8):
        for x in range(cx - 38, cx + 38):
            if rounded(x, y, cx - 38, eave + 50, 76) and not rounded(x, y, cx - 30, eave + 50, 60):
                c.p(x, y, [TILE_BLUE[1], GOLD[2], TERRACOTTA[2], CREAM[1]][(x // 4 + y // 4) % 4])
    opening(c, cx - 30, eave + 20, 60, hw - 28, rounded)
    glazed(c, cx - 28, eave + 24, 56, 34, IRON, 5, SKY_GLASS)
    for k, col in enumerate(COLOURED):
        glazed(c, cx - 26 + k * 14, eave + 30, 10, 20, IRON, 3, col)
    for side in (-1, 1):
        for x in range(4):
            px = cx + side * (p.W // 2 - 20) + x * 7 * side - 3
            column(c, px, eave + 14, base - 8, CREAM, d=6, order='corinthian')
    doorway(c, cx, base - 8, 24, 40, shape='square')
    plinth(c, x0, base - 8, p.W, RAMPS['limestone'])
    steps(c, cx, base, 56, 2, RAMPS['limestone'])
    return p.done()


def tower_leg(flip=False):
    """One foot of the Tower: a rusticated masonry pier, the leg's two girder
    faces rising and leaning in toward the middle, braced in X panels, and
    half of the great arch springing toward the next foot. Drawn for a left
    foot; the right ones are mirrored. The frame runs from M px left of the
    foot to the middle of the span between the feet."""
    foot = 9 * 16
    span = (41 - 15) * 16          # inner edge to inner edge of the two feet
    W, H = M + foot + span // 2 + 4, 8 * 16 + 260
    c = C(W, H)
    base = H
    stone = RAMPS['limestone']
    # The pier: rusticated blocks under a moulded cornice.
    px, pw, ph = M + 2, foot - 4, 30
    coursed(c, px, base - ph, pw, ph, stone, q=1, course=8, block=20)
    c.rect(px - 3, base - ph - 4, pw + 6, 4, stone[1]); c.rect(px - 3, base - ph - 4, pw + 6, 1, stone[0])
    c.rect(px - 3, base - ph - 1, pw + 6, 1, stone[4])
    cast_down(c, px, px + pw, base - ph, 3, 0.35)
    top = base - ph - 4
    rise = top - 2
    # Outer and inner edge of the leg's front face; the lean grows with height.
    def edges(y):
        t = (top - y) / rise
        lean = t ** 1.35
        return M + 8 + lean * 96, M + foot - 8 + lean * 58

    def girder(x, y, wide, r, front=True):
        c.rect(x, y, wide, 1, r[3 if front else 4])
        if front:
            c.p(x, y, r[1]); c.p(x + 1, y, r[1])
            c.p(x + wide - 1, y, r[4])
            if (y // 3) % 2 == 0:
                c.p(x + wide // 2, y, r[2])

    back = [mix(col, (90, 74, 106), 0.35) for col in TOWER]
    for face, (dx, dy, r) in enumerate([(7, -5, back), (0, 0, TOWER)]):
        front = face == 1
        panel = 0
        y = top
        belts = []
        while y > 0:
            p_h = int(36 - 16 * (top - y) / rise)
            belts.append(y)
            y -= p_h
        for y in range(1, top + 1):
            a, b = edges(y)
            a, b = a + dx, b + dx
            yy = y + dy
            if yy < 0:
                continue
            girder(int(a), yy, 6, r, front)
            girder(int(b) - 6, yy, 6, r, front)
        # Belts across, and X braces between them.
        for i in range(len(belts) - 1):
            y0, y1 = belts[i], belts[i + 1]
            a0, b0 = edges(y0); a1, b1 = edges(y1)
            for k in range(3):
                yy = y1 + dy + k
                if yy >= 0:
                    c.rect(int(a1 + dx), yy, int(b1 - a1), 1, r[[1, 2, 4][k]] if front else r[4])
            n = max(2, int(abs(y0 - y1) * 1.5))
            for j in range(n):
                t = j / n
                y = y0 + (y1 - y0) * t
                aa, bb = edges(y)
                for xx in (aa + 6 + (bb - aa - 12) * t, bb - 6 - (bb - aa - 12) * t):
                    yy = int(y + dy)
                    if yy >= 0:
                        c.p(int(xx + dx), yy, r[3] if front else r[4])
                        c.p(int(xx + dx) + 1, yy, r[2] if front else r[4])
    # Half of the great arch: a lattice band from the inner girder to the middle of the span.
    xs, ys = edges(top - 96)[1], top - 96
    xc, yc = W - 2, 34
    for xi in range(int(xs) - 2, W):
        u = min(1, max(0, (xc - xi) / (xc - xs)))
        y = yc + (ys - yc) * (1 - math.sqrt(max(0, 1 - u * u)))
        for k in range(17):
            yy = int(y) + k
            if k in (0, 16):
                col = TOWER[1] if k == 0 else TOWER[4]
            elif k in (1, 2, 14, 15):
                col = TOWER[2] if k < 3 else TOWER[3]
            elif (xi + k) % 10 in (0, 1) or (xi - k) % 10 in (0, 1):
                col = TOWER[2]
            elif k == 8 and xi % 10 == 5:
                col = GOLD[1]
            else:
                continue
            c.p(xi, yy, col)
    finish(c)
    consolidate(c)
    im = c.im
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im


PAINTERS = {
    'classical': classical, 'timber': timber, 'moorish': moorish, 'aztec': aztec, 'inca': inca,
    'iron-glass': iron_glass, 'siamese': pagoda, 'pagoda': pagoda, 'khmer': khmer,
    'formige': formige, 'dome-central': dome_central,
}


def buildings():
    """The fair's buildings, read from the plan in the game's content."""
    src = (ROOT / 'src/content/fairs/paris-1889.ts').read_text()
    out = []
    for m in re.finditer(r'pavilion\("([a-z-]+)", "[^"]*", "([a-z-]+)", (\d+), (\d+)(?:, (\d+))?(?:, (\d+))?\)', src):
        out.append((m[1], m[2], int(m[4]), int(m[6] or 5), int(m[5] or 0)))
    for m in re.finditer(r'\{ id: "([a-z-]+)", name: "[^"]*", style: "([a-z-]+)", x: \d+, w: (\d+), h: (\d+)(?:, look: (\d+))?', src):
        out.append((m[1], m[2], int(m[3]), int(m[4]), int(m[5] or 0)))
    return out


def sprites():
    out = {f'fair-{bid}': PAINTERS[style](w, h, look) for bid, style, w, h, look in buildings()}
    out['fair-tower-leg'] = tower_leg()
    return out


def sheet(out, zoom=2):
    sp = sprites()
    W = 1600
    x = y = rowh = 0
    place = []
    for k, im in sp.items():
        if x + im.width > W:
            x, y, rowh = 0, y + rowh + 16, 0
        place.append((im, x, y))
        x += im.width + 12
        rowh = max(rowh, im.height)
    can = Image.new('RGBA', (W, y + rowh + 8), (126, 150, 96, 255))
    for im, x, y in place:
        can.alpha_composite(im, (x, y))
    can = can.resize((can.width * zoom, can.height * zoom), Image.NEAREST)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    can.save(out)
    print(out, len(sp))


if __name__ == '__main__':
    if sys.argv[1:] == ['--bake']:
        from art.atlas import pack_atlas
        pack_atlas(sprites(), ROOT / 'public/packs', 'fair', 2048)
    else:
        sheet(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'artifacts/fair/sheet.png'))
