"""Classical street fittings at the front kit's native scale and projection."""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, ramp, h2
from art import front_materials as fm
from art import front_props as shared
from art import front_goods as goods
from art import front_solid as so
from art import front_parts as fp
from art.front_kit import finish, consolidate

STONE = RAMPS['travertine']
MARBLE = RAMPS['marble']
CLAY = RAMPS['tegula']
WOOD = RAMPS['oak']
RED = RAMPS['pompeian-red']
BRONZE = ramp(78, 0.085, lift=-0.17)
WATER = ramp(220, 0.08, lift=-0.08)
INK = ramp(280, 0.025, lift=-0.25)
LEAF = ramp(125, 0.07, lift=-0.16)
FIG = ramp(325, 0.085, lift=-0.18)
FIRE = ramp(65, 0.16)


def line(c, x0, y0, x1, y1, colour):
    n = max(abs(x1 - x0), abs(y1 - y0))
    for i in range(n + 1):
        t = i / max(1, n)
        c.p(round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), colour)


def band(c, x, y, w, r, indices):
    for k, q in enumerate(indices):
        c.rect(x, y + k, w, 1, r[q])


def ashlar(c, x, y, w, h, r=STONE, course=8, block=19, seed=0, shade=0):
    fm.ashlar(c, x, y, w, h, r, course, block)
    if shade:
        goods.dim(c, x, y, w, h, shade)


def amphora(c, cx, by, r=CLAY, size=1.0, kind='wine'):
    profiles = {
        'wine': [(0, 1), (4, 2.5), (9, 5), (16, 6), (20, 5), (23, 2.5), (28, 2), (29, 3)],
        'oil': [(0, 2), (3, 4), (10, 7), (17, 6.5), (21, 4), (23, 2), (26, 2), (27, 3)],
        'jug': [(0, 2.5), (2, 3.5), (7, 4.5), (10, 3.5), (12, 2), (15, 2), (16, 2.5)],
    }
    p = [(z * size, radius * size) for z, radius in profiles[kind]]
    so.lathe(c, cx, by, p, r, hollow=(max(1, p[-1][1] - 1), p[-1][0] - 3))
    H = p[-1][0]
    for side in ((1,) if kind == 'jug' else (-1, 1)):
        neck, shoulder = (2.5 * size, 9 * size)
        pts = [(cx + side * neck, by - H + 3 * size),
               (cx + side * (shoulder - size), by - H + 3 * size),
               (cx + side * shoulder, by - H + 5 * size),
               (cx + side * shoulder, by - H + 11 * size),
               (cx + side * (shoulder - size), by - H + 13 * size),
               (cx + side * 4 * size, by - H + 14 * size)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            line(c, round(x0), round(y0), round(x1), round(y1), r[2 if side < 0 else 4])
            line(c, round(x0 + 1), round(y0 + 1), round(x1 + 1), round(y1 + 1), r[5])


def dolium(c, cx, by, r=CLAY, R=11):
    so.lathe(c, cx, by, [(0, R * 0.7), (2, R * 0.75), (4, R * 0.8), (12, R), (20, R * 0.9),
                        (24, R * 0.65), (25, R * 0.72), (27, R * 0.72)], r,
             hollow=(R * 0.55, 20))
    for a in range(200, 341, 15):
        t = math.radians(a)
        c.p(cx + math.cos(t) * R * 0.85, by - 10 + math.sin(t) * R * so.K, r[4])


def well(c, cx, by, r=STONE, R=15):
    so.lathe(c, cx, by, [(0, R + 1), (2, R + 1), (3, R - 1), (17, R - 1),
                        (18, R + 1), (21, R + 1)], r, hollow=(R - 3, -4), inside=[INK[min(i, 4)] for i in range(8)])
    for dx in (-7, 7):
        so.ellipse(c, cx + dx, by - 11, 2.5, 2.5, r[4])
        so.ellipse(c, cx + dx - 0.5, by - 12, 1.5, 1.5, r[1])
    for i in range(-6, 7):
        y = by - 10 + round(3 * (1 - (i / 7) ** 2))
        c.p(cx + i, y, r[4]); c.p(cx + i, y - 1, r[2])


def lion(c, cx, cy, r=STONE):
    rows = ('..4444444..', '.422122224.', '42211222344', '42151151234',
            '42223322344', '.423113234.', '..4212234..', '...44544...')
    for j, row in enumerate(rows):
        for i, q in enumerate(row):
            if q != '.':
                c.p(cx - 5 + i, cy - 4 + j, r[int(q)])


def fountain(c, cx, by, r=STONE, w=50):
    x = cx - w // 2
    so.box(c, cx - 15, by - 6, 30, 37, 8,
           lambda c, x, y, w, h: ashlar(c, x, y, w, h, r, 8, 15), r)
    band(c, cx - 17, by - 48, 34, r, (0, 1, 3, 4))
    lion(c, cx, by - 31, r)
    so.box(c, x, by, w, 9, 28, r)
    top = by - 9 - round(28 * so.K)
    so.recess(c, x + 3, by - 10, w - 6, 23, 5, r, r, WATER)
    ashlar(c, x, by - 8, w, 8, r, 8, 13)
    band(c, x - 1, by - 10, w + 2, r, (0, 1, 3))
    so.ellipse(c, cx, top + 10, 5, 1.5, WATER[1])
    so.ellipse(c, cx, top + 10, 3.5, 0.7, WATER[3])
    for y in range(by - 27, top + 11):
        c.p(cx, y, WATER[0]); c.p(cx + 1, y, WATER[2])


def bench(c, cx, by, r=STONE, w=46):
    for lx in (cx - w // 2 + 5, cx + w // 2 - 11):
        so.box(c, lx, by, 7, 12, 10, r)
        lion(c, lx + 3, by - 10, r)
        band(c, lx - 1, by - 2, 9, r, (1, 3))
    so.box(c, cx - w // 2, by, w, 4, 15, r, z0=13)
    for i in range(3):
        line(c, cx - 14 + i * 10, by - 20, cx - 10 + i * 10, by - 18, r[2])


def flame(c, cx, by):
    for j, row in enumerate(('..3..', '..2..', '.323.', '.212.', '32123', '.333.')):
        for i, q in enumerate(row):
            if q != '.':
                c.p(cx - 2 + i, by - 6 + j, FIRE[int(q)])


def altar(c, cx, by, r=STONE):
    so.box(c, cx - 10, by, 20, 3, 12, r)
    so.box(c, cx - 7, by, 14, 16, 9, r, z0=3)
    so.box(c, cx - 10, by, 20, 3, 12, r, z0=19)
    c.rect(cx - 5, by - 17, 10, 12, RED[3])
    for dx, dy in ((0, 0), (-2, 0), (2, 0), (0, -2), (0, 2)):
        c.p(cx + dx, by - 11 + dy, r[1])
    so.ellipse(c, cx, by - 25, 3, 1.5, BRONZE[4])
    flame(c, cx, by - 25)


def lamp(c, cx, by, stand=True):
    if stand:
        for dx in (-8, 7, 0):
            line(c, cx, by - 13, cx + dx, by - (0 if dx else -2), BRONZE[4])
            line(c, cx - 1, by - 13, cx + dx - 1, by - (1 if dx else -1), BRONZE[2])
        so.lathe(c, cx, by, [(8, 2), (11, 2), (12, 1), (29, 1), (30, 6), (32, 6)], BRONZE)
        by -= 32
    so.lathe(c, cx, by, [(0, 3), (1, 4), (2, 3.5), (3, 2.8)], CLAY, hollow=(1, 1))
    c.rect(cx + 2, by - 2, 5, 2, CLAY[3])
    c.p(cx + 6, by - 3, INK[4])
    flame(c, cx + 6, by - 3)


def column(c, cx, by, r=MARBLE, h=60, order='ionic'):
    so.box(c, cx - 8, by, 16, 3, 13, r)
    fp.column(c, cx, by - h, by - 4, r, d=9, order=order)
    if order == 'ionic':
        for dx in (-6, 6):
            so.ellipse(c, cx + dx, by - h + 4, 3.5, 3, r[4])
            so.ellipse(c, cx + dx - 0.5, by - h + 3.5, 2.5, 2, r[1])
            c.p(cx + dx, by - h + 4, r[5])
        band(c, cx - 10, by - h - 1, 21, r, (0, 2, 4))


def mosaic(c, cx, by, w=44, depth=48):
    h = round(depth * so.K)
    x, y = cx - w // 2, by - h
    so.box(c, x - 2, by + 3, w + 4, 3, depth + 4, STONE)
    for yy in range(h):
        for xx in range(w):
            u, v = xx // 2, yy
            edge = min(u, w // 2 - 1 - u, v, h - 1 - v)
            dark = edge == 1 or (edge == 3 and (u + v) % 4 < 3)
            dx, dy = u - w / 4, (v - h / 2) * 0.8
            dist = abs(dx) + abs(dy)
            flower = 3 < dist < 7 and (abs(dx) < 2 or abs(dy) < 2 or abs(abs(dx) - abs(dy)) < 1)
            r = INK if dark else CLAY if flower else MARBLE
            q = 3 if dark else 2 if xx % 2 else 1
            c.p(x + xx, y + yy, r[q])
    band(c, x - 2, by + 1, w + 4, STONE, (2, 4, 5))


def mill(c, cx, by, r=None):
    r = r or RAMPS['granite']
    so.lathe(c, cx, by, [(0, 14), (3, 14), (4, 12), (16, 4), (27, 1)], r)
    so.lathe(c, cx, by, [(7, 12), (10, 11), (19, 5), (22, 5), (32, 11), (35, 12)], r,
             hollow=(5, 26))
    band(c, cx - 22, by - 21, 44, WOOD, (2, 3, 5))
    for i in range(9):
        x = cx - 10 + round(h2(i, 0, 6) * 20)
        y = by - 5 - round(h2(i, 1, 6) * 9)
        if c.g(x, y)[3]:
            c.p(x, y, r[4])


def basket(c, cx, by):
    so.lathe(c, cx, by, [(0, 8), (4, 11), (6, 12), (8, 12)], WOOD, courses=2,
             hollow=(10, 3))
    for x in range(cx - 9, cx + 10, 3):
        line(c, x, by - 5, x + 1, by - 1, WOOD[4])
    for i in range(5):
        x = cx - 7 + i * 3
        y = by - 7 - (i % 2) * 2
        so.lathe(c, x, y, [(0, 2), (2, 3), (4, 2), (6, 0.5)], FIG)
        c.p(x, y - 6, LEAF[2])


def olive(c, cx, by):
    shared.pot(c, cx, by, 'flowerpot', CLAY, scale=1.3)
    shared.tree(c, cx, by - 11, 'olive', fruit=False)
    leaf = shared.LEAF_OLIVE
    for yy in range(by - 50, by - 20, 3):
        for xx in range(cx - 19, cx + 20, 3):
            if c.g(xx, yy) in leaf:
                q = 1 if xx < cx else 3
                line(c, xx - 1, yy + 1, xx + 1, yy - 1, leaf[q])
                c.p(xx + 1, yy + 1, leaf[min(7, q + 2)])



PROPS = {
    'amphorae': (52, 42, lambda c, x, b: [amphora(c, x - 10, b), amphora(c, x + 10, b, kind='oil')]),
    'dolium': (34, 38, dolium),
    'fountain': (62, 58, fountain),
    'wellhead': (40, 39, well),
    'bench': (58, 37, bench),
    'votive-altar': (32, 41, altar),
    'oil-lamp': (32, 52, lamp),
    'fig-basket': (34, 27, basket),
    'grain-mill': (54, 49, mill),
    'ionic-column': (28, 74, column),
    'floor-mosaic': (56, 37, mosaic),
    'olive-planter': (42, 57, olive),
}


def sprite(name):
    w, h, draw = PROPS[name]
    c = C(w, h)
    draw(c, w // 2, h - 7)
    finish(c)
    consolidate(c, rare=4, common=3, reach=100)
    return c.im
