"""Props that stand in and around buildings, drawn once and shared: trees,
shrubs and planters, fountains, wells and pools, pots, benches.

    .venv/bin/python scripts/art/front_props.py artifacts/front-props.png

All are built from front_solid's primitives, so they share its projection
and light: a pool shows its far kerb above its water, a fountain's basins
show their water from above, a tree's crown is a few lit clumps. Kinds and
materials are arguments, so a Roman impluvium, a Persian howz and a
medieval horse pond are one function.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_solid as so  # noqa: E402

WATER = ramp(222, 0.08, lift=-0.08)
LEAF = ramp(132, 0.1, lift=-0.16)
LEAF_DARK = ramp(150, 0.08, lift=-0.24)
LEAF_OLIVE = ramp(110, 0.05, lift=-0.08)
BARK = RAMPS['oak']
STONE = RAMPS['travertine']
CLAY = RAMPS['tegula']
FRUIT = {'pomegranate': ramp(22, 0.15, lift=-0.08), 'orange': ramp(60, 0.16, lift=0.02),
         'lemon': ramp(95, 0.14, lift=0.06), 'fig': ramp(320, 0.06, lift=-0.2)}

# Profiles (z, radius) for the pot family, at the adult's scale.
POTS = {
    'amphora': [(0, 0.5), (3, 3), (10, 6), (17, 6.5), (21, 5), (24, 2), (28, 2), (29, 3)],
    'dolium': [(0, 6), (6, 10), (14, 11), (20, 9), (22, 7), (23, 7.5)],
    'jug': [(0, 3), (5, 4.5), (8, 3.5), (10, 2.2), (12, 2.6)],
    'pithos': [(0, 4), (8, 8), (18, 9), (26, 7), (28, 5), (29, 5.5)],
    'urn': [(0, 3), (2, 3), (3, 2), (6, 5), (12, 6), (14, 4), (15, 5)],
    'flowerpot': [(0, 4), (8, 6), (9, 6.5)],
    'basket': [(0, 6), (6, 7.5)],
    'barrel': [(0, 7), (6, 8), (12, 8), (18, 7)],
}


def pot(c, cx, by, kind='amphora', r=CLAY, fill=None, z0=0, scale=1.0):
    """A pot of the family, open at the mouth; `fill` = ramp of what is in it."""
    prof = [(z * scale, rr * scale) for z, rr in POTS[kind]]
    top_r = prof[-1][1]
    courses = 2 if kind == 'basket' else 0
    so.lathe(c, cx, by, prof, r, hollow=(max(1.0, top_r - 1.2), prof[-1][0] - 4),
             fill=(prof[-1][0] - 1.5, fill) if fill else None, z0=z0, courses=courses)


def tree(c, cx, by, kind='pomegranate', size=1.0, fruit=True):
    """A tree in the projection: a trunk and a crown of lit clumps. Kinds:
    pomegranate, orange, lemon, fig, olive (grey, open), cypress (a tall
    flame), palm (a fan of fronds)."""
    s = size
    if kind == 'cypress':
        prof = [(6 * s, 0), (8 * s, 5 * s), (20 * s, 7 * s), (40 * s, 5 * s), (56 * s, 1.5 * s), (60 * s, 0)]
        so.lathe(c, cx, by, [(0, 1.5 * s), (8 * s, 1.5 * s)], BARK)
        so.lathe(c, cx, by, prof, LEAF_DARK, courses=5 * s, ribs=7)
        return
    if kind == 'palm':
        so.lathe(c, cx, by, [(0, 2.5 * s), (34 * s, 1.8 * s)], BARK, courses=3)
        top = by - 34 * s
        for a in range(0, 360, 40):
            for t in range(1, int(16 * s)):
                x = cx + math.cos(math.radians(a)) * t
                y = top - 2 + math.sin(math.radians(a)) * t * so.K + t * t * 0.03
                c.p(x, y, LEAF[2] if math.cos(math.radians(a)) < 0.2 else LEAF[4])
                c.p(x, y + 1, LEAF[5])
        return
    leaf = LEAF_OLIVE if kind == 'olive' else LEAF
    so.lathe(c, cx, by, [(0, 2 * s), (14 * s, 1.5 * s)], BARK)
    clumps = [(0, 0, 26, 10), (-8, 3, 19, 8), (8, 2, 19, 8), (0, 6, 15, 7)]
    if kind == 'olive':
        clumps = [(-6, 0, 22, 8), (7, -2, 25, 8), (0, 4, 17, 7)]
    for dx, dy, zc, R in sorted(clumps, key=lambda q: -q[1]):
        so.sphere(c, cx + dx * s, by + dy * s * so.K, zc * s, R * s, leaf)
    if fruit and kind in FRUIT:
        f = FRUIT[kind]
        for i in range(7):
            x = cx + (h2(i, 1, 801) - 0.5) * 22 * s
            y = by - (16 + h2(i, 2, 801) * 18) * s
            if c.g(x, y)[3] and c.g(x, y) in leaf:
                c.p(x, y, f[2]); c.p(x + 1, y, f[4]); c.p(x, y + 1, f[4])


def shrub(c, cx, by, R=5, leaf=LEAF):
    so.sphere(c, cx, by, R * 0.8, R, leaf, squash=0.8)


def hedge(c, x, by, w, h=8, d=8, leaf=LEAF_DARK):
    """A clipped hedge: a box of leaves, its top lit, its face in clumps."""
    def face(c, x0, y0, w0, h0):
        for yy in range(y0, y0 + h0):
            for xx in range(x0, x0 + w0):
                c.p(xx, yy, leaf[3] if (xx // 4 + yy // 3) % 3 else leaf[4])

    def top(c, x0, y0, w0, h0):
        for yy in range(y0, y0 + h0):
            for xx in range(x0, x0 + w0):
                c.p(xx, yy, leaf[1] if (xx // 3 + yy) % 4 else leaf[2])
    so.box(c, x, by, w, h, d, face, top, edge=False)


def planter(c, x, by, w, d, plants=('shrub',), r=STONE, soil=None):
    """A raised bed: a stone kerb box, soil, and what grows in it."""
    soil = soil or ramp(40, 0.05, lift=-0.28)
    so.box(c, x, by, w, 5, d, r)
    ty = by - 5 - round(d * so.K)
    c.rect(x + 2, ty + 1, w - 4, round(d * so.K) - 1, soil[3])
    n = len(plants)
    for i, p in enumerate(plants):
        px = x + (i + 0.5) * w / n
        py = by - 5 - round(d * so.K / 2)
        if p == 'shrub':
            shrub(c, px, py, 4)
        elif p == 'flowers':
            shrub(c, px, py, 4)
            for k in range(5):
                c.p(px - 3 + k * 1.5, py - 4 - (k % 2), ramp(20 + k * 60, 0.14, lift=0.02)[2])
        else:
            tree(c, px, py, p, 0.8)


def fountain(c, cx, by, kind='tiered', r=STONE, water=WATER, R=20):
    """A fountain: a basin from above with its water, and over it a
    pedestal and bowl (tiered), or a single jet (basin)."""
    so.lathe(c, cx, by, [(0, R), (8, R), (9, R + 1.5), (11, R + 1.5)], r, hollow=(R - 1, 3), fill=(8, water))
    if kind == 'tiered':
        so.lathe(c, cx, by, [(0, R * 0.2), (20, R * 0.15), (22, R * 0.45), (25, R * 0.45)], r,
                 hollow=(R * 0.45 - 1, 22.5), fill=(24, water))
        for k in range(8):
            c.p(cx + R * 0.45 + 1, by - 22 + k * 2, water[1])
            c.p(cx - R * 0.45 - 2, by - 22 + k * 2, water[1])
    for k in range(6):
        c.p(cx, by - 26 - k * (1 if kind == 'tiered' else 2), water[0 if k % 2 else 1])


def well(c, cx, by, r=STONE, R=8, kind='puteal'):
    """A well-head: a round curb whose dark inside we see over its rim."""
    so.lathe(c, cx, by, [(0, R), (12, R), (13, R + 1), (15, R + 1)], r, hollow=(R - 1.5, -10), courses=0)


def pool(c, x, by, w, d, kerb=STONE, water=WATER, depth=4, rim=3):
    """A rectangular pool sunk in a floor: a kerb whose top we see, the far
    kerb's inside face, the water."""
    so.box(c, x, by, w, 2, d, kerb, edge=False)
    ty = by - 2 - round(d * so.K)
    so.recess(c, x + rim, by - 2 - rim // 2, w - 2 * rim, d - 2 * rim, depth, kerb, kerb, water)
    c.rect(x, by - 2, w, 1, kerb[2])
    c.rect(x, by - 1, w, 1, kerb[4])
    return ty


def bench(c, x, by, w, r=STONE, h=6, d=8):
    so.box(c, x, by, w, h, d, r)


SHEET = [
    ('pomegranate', lambda c, x, b: tree(c, x, b, 'pomegranate')),
    ('orange', lambda c, x, b: tree(c, x, b, 'orange')),
    ('olive', lambda c, x, b: tree(c, x, b, 'olive')),
    ('cypress', lambda c, x, b: tree(c, x, b, 'cypress')),
    ('palm', lambda c, x, b: tree(c, x, b, 'palm')),
    ('fountain', lambda c, x, b: fountain(c, x, b)),
    ('well', lambda c, x, b: well(c, x, b)),
    ('pool', lambda c, x, b: pool(c, x - 22, b, 44, 30)),
    ('planter', lambda c, x, b: planter(c, x - 18, b, 36, 14, ('shrub', 'flowers', 'shrub'))),
    ('pots', lambda c, x, b: [pot(c, x - 14, b, 'amphora'), pot(c, x, b, 'dolium'), pot(c, x + 14, b, 'jug')]),
    ('hedge', lambda c, x, b: hedge(c, x - 18, b, 36)),
]


def make(out, zoom=3):
    from PIL import Image, ImageDraw, ImageFont
    from art.front_kit import outline
    from art.reference import current_adult
    cell, H = 60, 96
    W = cell * len(SHEET) + 30
    c = C(W, H)
    base = H - 14
    for i, (_, fn) in enumerate(SHEET):
        fn(c, 30 + i * cell, base)
    outline(c)
    adult = current_adult()
    bg = Image.new('RGBA', (W, H), (214, 206, 186, 255))
    bg.alpha_composite(c.im)
    bg.alpha_composite(adult, (2, base - adult.height))
    bg = bg.resize((W * zoom, H * zoom), Image.NEAREST)
    d = ImageDraw.Draw(bg)
    font = ImageFont.load_default(size=16)
    for i, (name, _) in enumerate(SHEET):
        d.text(((30 + i * cell - 24) * zoom, (H - 10) * zoom), name, font=font, fill=(60, 50, 60))
    bg.convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-props.png')
