"""Street and yard furniture in the buildings' convention: fronts square on,
tops seen from above at moderate depth, no sheared side.

Sized to the figure as the game draws it (about 40px from crown to heel), not
to the metre: a crate comes to a person's knee, a bench seat to the back of
the knee, a privy door is a little shorter than a house door.
"""
import math
import random
from .core import Canvas, RAMPS, soft_outline
from .building import _flies
from . import pitches as P

OAK, WALNUT, ASH = RAMPS['oak7'], RAMPS['walnut7'], RAMPS['ash7']
WOODS = [OAK, WALNUT, ASH]
IRON = RAMPS['iron7']
BLACK = RAMPS['blackiron7']
STONES = [RAMPS['granite'], RAMPS['sandstone'], RAMPS['limestone']]
CANVAS = RAMPS['linen7']
THATCH = RAMPS['straw']
TILE = RAMPS['tile']
SHEET = RAMPS['galvanised7']
SOIL = ['#1e140d', '#2e2016', '#3f2c1d', '#523a26', '#6a4b32', '#80603f', '#977550']
DEPTH = 6


def boards(c, x0, y0, x1, y1, r, seed=0, across=False, widths=(4, 5, 5, 6)):
    """Planks, each its own tone, a dark seam between and a broken grain line.
    Upright unless `across`."""
    rng = random.Random(seed)
    lo, hi = (y0, y1) if across else (x0, x1)
    p = lo
    while p <= hi:
        bw = rng.choice(widths)
        tone = rng.choice([3, 4, 4, 5])
        for q in range(p, min(p + bw, hi + 1)):
            for t in range(x0 if across else y0, (x1 if across else y1) + 1):
                x, y = (t, q) if across else (q, t)
                grain = q == p + bw // 2 and (t + seed + p) % 9 < 5
                c.set(x, y, r[tone - 1] if grain else r[tone])
        if p > lo:
            if across: c.hline(x0, x1, p, r[2])
            else: c.vline(p, y0, y1, r[2])
        if rng.random() < .3:
            k = rng.randrange(max(1, (x1 - x0 if across else y1 - y0)))
            kx, ky = ((x0 + k, p + bw // 2) if across else (p + bw // 2, y0 + k))
            c.set(kx, ky, r[2])
        p += bw


def top(c, x0, x1, y, r, d=DEPTH, across=True):
    """A flat top above the front edge `y`: dark at the back, lit at the lip."""
    for k in range(d):
        row = y - d + k
        t = 3 if k == 0 else 5 if k == d - 1 else 4
        for x in range(x0, x1 + 1):
            seam = across and (x - x0) % 7 == 0 and 0 < k < d - 1
            c.set(x, row, r[t - 1] if seam else r[t])
    c.hline(x0, x1, y - 1, r[6])


def wheel(c, cx, cy, rad, r, hub=IRON, spokes=8):
    for y in range(-rad, rad + 1):
        for x in range(-rad, rad + 1):
            d = math.hypot(x, y)
            if rad - 2 <= d <= rad + .4:
                c.set(cx + x, cy + y, hub[2] if d > rad - .8 else r[4 if x + y < 0 else 2])
    for i in range(spokes):
        a = i * math.pi * 2 / spokes
        for t in range(2, rad - 1):
            c.set(cx + round(math.cos(a) * t), cy + round(math.sin(a) * t), r[3 if math.cos(a) + math.sin(a) < 0 else 2])
    c.rect(cx - 1, cy - 1, cx + 1, cy + 1, hub[4]); c.set(cx - 1, cy - 1, hub[6])


def finish(c, r):
    soft_outline(c, r[1], r[3])
    return c.image()


# -- storage ----------------------------------------------------------------------

def _crate(c, x, g, w, h, r, seed):
    boards(c, x, g - h + 1, x + w - 1, g, r, seed, across=True, widths=(3, 4, 4))
    for bx in (x, x + w - 1): c.vline(bx, g - h + 1, g, r[2 if bx > x else 5])
    c.hline(x, x + w - 1, g - h + 1, r[5]); c.hline(x, x + w - 1, g, r[1])
    # A brace corner to corner, nailed at both ends.
    for i in range(1, w - 1):
        y = g - 1 - round((i - 1) * (h - 3) / (w - 3))
        c.set(x + i, y, r[5]); c.set(x + i, y + 1, r[2])
    for nx, ny in ((x + 1, g - h + 2), (x + w - 2, g - h + 2), (x + 1, g - 1), (x + w - 2, g - 1)):
        c.set(nx, ny, IRON[1])
    top(c, x, x + w - 1, g - h + 1, r, 5)


def crate(v=0):
    r = WOODS[v]
    c = Canvas(22, 22)
    _crate(c, 1, 21, 20, 14, r, v)
    return finish(c, r)


def crate_stack(v=0):
    r = WOODS[v]
    c = Canvas(42, 38)
    _crate(c, 1, 37, 20, 14, r, v)
    _crate(c, 21, 37, 20, 14, WOODS[(v + 1) % 3], v + 3)
    _crate(c, 8, 18, 16, 11, WOODS[(v + 2) % 3], v + 5)
    return finish(c, r)


def woodpile(v=0):
    r = WOODS[v]
    rng = random.Random(f'woodpile-{v}')
    c = Canvas(44, 28)
    # Rack posts either end, the logs stacked ends-out between them.
    for px in (1, 42):
        c.vline(px, 4, 27, r[4]); c.vline(px + 1, 4, 27, r[2])
    ends = ['#5e4224', '#8a6438', '#b48a52', '#d4ae74', '#ead0a0']
    for row in range(5):
        y = 25 - row * 4 - (row % 2)
        x = 4 + (row % 2) * 2
        while x < 39:
            rad = rng.choice([2, 2, 3])
            for dy in range(-rad, rad + 1):
                for dx in range(-rad, rad + 1):
                    d = math.hypot(dx, dy)
                    if d <= rad + .3:
                        tone = 0 if d > rad - .6 else 2 if dx + dy > 0 else 3 if d > 1 else 4
                        c.set(x + dx, y + dy, r[2] if d > rad - .6 else ends[tone])
            c.set(x, y, ends[1])
            x += rad * 2 + 1
    # The bark of the top course, seen from above.
    for x in range(3, 41):
        for k in range(3):
            c.set(x, 4 + k, r[3 + (x * 3 + k) % 3 % 2] if k else r[2])
    return finish(c, r)


def strapped_chest(v=0):
    r = WOODS[v]
    c = Canvas(24, 22)
    x0, x1, g = 1, 22, 21
    boards(c, x0, 9, x1, g, r, v + 7, across=True, widths=(3, 4))
    # A domed lid: board courses curving over, lit on top.
    for k in range(6):
        y = 8 - k
        inset = [0, 0, 1, 1, 2, 4][k]
        c.hline(x0 + inset, x1 - inset, y, r[5 if k > 2 else 4] if k % 2 else r[6 if k > 2 else 5])
    c.hline(x0, x1, 9, r[2])
    for sx in (x0 + 4, x1 - 4):
        c.vline(sx, 4, g, IRON[3]); c.vline(sx + 1, 4, g, IRON[1])
        for ry in (6, 12, 18): c.set(sx, ry, IRON[6])
    lx = (x0 + x1) // 2
    c.rect(lx - 1, 9, lx + 1, 12, RAMPS['brass7'][5]); c.set(lx, 11, RAMPS['brass7'][0])
    c.hline(x0, x1, g, r[1])
    return finish(c, r)


# -- seats and planters ---------------------------------------------------------

def bench(v=0):
    r = WOODS[v]
    c = Canvas(46, 20)
    g, seat = 19, 9
    # Splayed legs, a stretcher, and a thick seat with a worn lit edge.
    for lx in (4, 39):
        for k in range(seat + 1):
            c.set(lx - (k // 6), g - k, r[3]); c.set(lx + 1 - (k // 6), g - k, r[2])
    c.hline(5, 40, g - 4, r[2])
    c.rect(1, g - seat - 2, 44, g - seat + 1, r[3])
    c.hline(1, 44, g - seat + 1, r[1]); c.hline(1, 44, g - seat - 2, r[5])
    top(c, 1, 44, g - seat - 2, r, 5)
    for x in range(8, 40, 11): c.set(x, g - seat - 4, r[6])
    return finish(c, r)


def park_bench(v=0):
    r = WOODS[v]
    c = Canvas(48, 30)
    g, seat = 29, 10
    for lx in (3, 42):
        # Cast-iron ends: a leg, an arm, the back upright.
        c.vline(lx, g - 20, g, BLACK[2]); c.vline(lx + 1, g - 20, g, BLACK[3]); c.vline(lx + 2, g - 12, g, BLACK[1])
        c.hline(lx - 1, lx + 3, g - 13, BLACK[4]); c.hline(lx - 1, lx + 3, g, BLACK[1])
    for i, y in enumerate((g - 26, g - 22, g - 18)):
        c.hline(5, 41, y, r[5]); c.hline(5, 41, y + 1, r[3]); c.hline(5, 41, y + 2, r[1] if i < 2 else r[2])
    for x in (3, 42): c.vline(x, g - 27, g - 19, BLACK[3])
    for k in range(4):
        c.hline(2, 45, g - seat - 4 + k, [r[4], r[5], r[4], r[6]][k])
    c.hline(2, 45, g - seat, r[3]); c.hline(2, 45, g - seat + 1, r[1])
    return finish(c, r)


def municipal_planter(v=0):
    r = [RAMPS['limestone'], RAMPS['sandstone'], ['#141c24', '#1e2a35', '#2f4150', '#43596b', '#5c7486', '#7a92a2', '#9cb0bc']][v]
    c = Canvas(36, 26)
    x0, x1, g = 1, 34, 25
    c.rect(x0, g - 10, x1, g, r[4]); c.hline(x0, x1, g, r[2]); c.vline(x1, g - 10, g, r[3])
    c.hline(x0 + 2, x1 - 2, g - 2, r[3]); c.hline(x0, x1, g - 10, r[6])
    for x in range(x0 + 6, x1 - 2, 8): c.vline(x, g - 8, g - 3, r[3])
    top(c, x0, x1, g - 10, r, 4, across=False)
    c.rect(x0 + 2, g - 13, x1 - 2, g - 12, SOIL[3])
    leaf = ['#1f3a24', '#2f5634', '#437a47', '#63a062', '#95c68e']
    bloom = [['#7a1b34', '#a82a45', '#cf4a5c', '#ea8088'], ['#8a3529', '#cd6a44', '#e59a6c', '#f4c8a0'], ['#7a1b34', '#cf4a5c', '#ea8088', '#f8d0d8']][v]
    rng = random.Random(v)
    for x in range(x0 + 3, x1 - 2, 4):
        h = 4 + rng.randrange(3)
        for k in range(h):
            c.set(x + (k % 2), g - 13 - k, leaf[2 + (k % 2)]); c.set(x - 1, g - 12 - k // 2, leaf[1])
        cx, cy = x + 1, g - 13 - h
        for dx, dy in ((0, 0), (1, 0), (0, -1), (1, -1), (-1, 0), (2, -1)):
            c.set(cx + dx, cy + dy, bloom[2 if dy else 1])
        c.set(cx, cy - 1, bloom[3])
    return finish(c, r)


# -- privies --------------------------------------------------------------------

def _door(c, x0, x1, y0, y1, r, cut='moon'):
    boards(c, x0, y0, x1, y1, r, x0 + y0, widths=(3, 3, 4))
    c.rect(x0 - 1, y0 - 1, x1 + 1, y0 - 1, r[2]); c.vline(x0 - 1, y0, y1, r[2]); c.vline(x1 + 1, y0, y1, r[1])
    for y in (y0 + 3, y1 - 4): c.hline(x0, x1, y, r[2]); c.hline(x0, x1, y - 1, r[5])
    cx = (x0 + x1) // 2
    if cut == 'moon':
        for dx, dy in ((0, 0), (1, 0), (-1, 1), (2, 1), (-1, 2), (0, 3), (1, 3)): c.set(cx + dx - 1, y0 + 6 + dy, '#141210')
    elif cut == 'slot':
        c.hline(cx - 2, cx + 2, y0 + 7, '#141210')
    c.set(x1 - 1, (y0 + y1) // 2, IRON[5])


def _gable(c, x0, x1, eave, rise, kind, r):
    """A small roof seen from above at moderate depth: front slope in courses,
    lit verge, dark eave line on the wall below."""
    for k in range(rise):
        y = eave - rise + k
        inset = max(0, (rise - k - 2) // 2)
        for x in range(x0 - 2 + inset, x1 + 3 - inset):
            if kind == 'thatch':
                t = 4 if k < 2 else 3 if (x * 3 + k * 5) % 7 else 2
            elif kind == 'sheet':
                t = 5 if (x - x0) % 4 == 0 else 4 if k < rise - 2 else 3
            else:
                t = 5 if k % 3 == 0 else 4 if (x + (k // 3) * 3) % 6 else 2
            c.set(x, y, r[t])
    c.hline(x0 - 2, x1 + 2, eave, r[1]); c.hline(x0 - 1, x1 + 1, eave + 1, '#1a1410')


def _privy(c, x0, x1, g, wall, wr, roof, rr, cut, seed):
    eave = g - 34
    if wall == 'plank':
        boards(c, x0, eave + 1, x1, g, wr, seed)
    elif wall == 'wattle':
        for y in range(eave + 1, g + 1):
            for x in range(x0, x1 + 1):
                c.set(x, y, wr[4] if (x + (y // 2) * 2) % 4 < 2 else wr[3])
            if y % 6 == 0: c.hline(x0, x1, y, wr[2])
    elif wall == 'sheet':
        for x in range(x0, x1 + 1):
            for y in range(eave + 1, g + 1):
                c.set(x, y, wr[5] if (x - x0) % 4 == 0 else wr[4] if (x - x0) % 4 == 1 else wr[3])
        c.hline(x0, x1, eave + 12, wr[2])
    else:
        for y in range(eave + 1, g + 1):
            course = (y - eave) // 4
            for x in range(x0, x1 + 1):
                joint = (y - eave) % 4 == 0 or (x + course * (5 if wall == 'stone' else 3)) % (10 if wall == 'stone' else 6) == 0
                c.set(x, y, wr[2] if joint else wr[4 + (x * 7 + course) % 3 % 2])
    c.vline(x0, eave + 1, g, wr[5]); c.vline(x1, eave + 1, g, wr[2])
    mid = (x0 + x1) // 2
    _door(c, mid - 5, mid + 5, eave + 5, g - 1, WOODS[seed % 3] if wall != 'sheet' else wr, cut)
    _gable(c, x0, x1, eave, 10, roof, rr)
    c.hline(x0, x1, g, wr[1])


def privy_shed(v=0, motion=0):
    wr = [OAK, ASH, SHEET][v]
    c = Canvas(34, 50)
    _privy(c, 4, 29, 49, ['plank', 'wattle', 'sheet'][v], wr, ['shingle', 'thatch', 'sheet'][v],
           [WALNUT, THATCH, SHEET][v], 'moon' if v == 0 else 'slot', v)
    for x in range(0, 4):
        c.set(x, 49 - (1 if x in (1, 2) else 0), SOIL[3]); c.set(x, 49, SOIL[2])
    _flies(c, motion, [(17, 30, 9, 4, 1.0), (16, 22, 6, 5, -1.0)])
    return finish(c, wr)


def privy_stone(v=0, motion=0):
    wr = STONES[v]
    c = Canvas(34, 50)
    _privy(c, 3, 30, 49, 'stone', wr, 'tile', TILE, 'slot', v)
    # The chute down the side.
    c.vline(31, 26, 49, wr[3]); c.vline(32, 26, 49, wr[1]); c.hline(30, 33, 49, wr[2])
    _flies(c, motion, [(17, 30, 9, 4, 1.0)])
    return finish(c, wr)


def privy_outhouse(v=0, motion=0):
    wr = [RAMPS['rustred7'], RAMPS['buffclay7'], SHEET][v]
    c = Canvas(36, 52)
    _privy(c, 3, 30, 51, 'brick' if v < 2 else 'sheet', wr, 'sheet' if v == 2 else 'slate', [TILE, TILE, SHEET][v] if v else RAMPS['granite'], 'slot', v)
    # A cistern up on the wall and the soil pipe down it.
    c.rect(24, 10, 32, 14, IRON[3]); c.hline(24, 32, 10, IRON[5]); c.hline(24, 32, 14, IRON[1])
    c.vline(33, 14, 51, IRON[2]); c.vline(34, 14, 51, IRON[1])
    _flies(c, motion, [(17, 32, 8, 4, 1.0)])
    return finish(c, wr)


def privy_nightsoil(v=0, motion=0):
    wr = [OAK, WALNUT, SHEET][v]
    c = Canvas(48, 50)
    _privy(c, 3, 28, 49, 'plank' if v < 2 else 'sheet', wr, ['tile', 'shingle', 'sheet'][v], [TILE, WALNUT, SHEET][v], 'slot', v + 1)
    # The tub at the hatch and its carrying yoke across it.
    tub = OAK
    c.rect(32, 40, 43, 49, tub[4]); c.hline(32, 43, 49, tub[1])
    for x in range(33, 43, 3): c.vline(x, 41, 48, tub[3])
    for y in (42, 47): c.hline(32, 43, y, IRON[3])
    top(c, 32, 43, 40, ['#100c08', '#1a1410', '#2a2018', '#3a2c1e', '#4a3826', '#5a4630', '#6a553a'], 3)
    c.line((29, 33), (46, 38), WALNUT[4]); c.line((29, 34), (46, 39), WALNUT[2])
    _flies(c, motion, [(38, 34, 5, 3, 1.0), (16, 30, 8, 4, -1.0)])
    return finish(c, wr)


def privy_bench(v=0, motion=0):
    """A public latrine: a stone bench of keyhole seats, the channel running
    beneath, a sponge-stick trough at the foot."""
    r = STONES[v]
    c = Canvas(58, 26)
    x0, x1, g = 1, 56, 25
    c.rect(x0, g - 12, x1, g - 3, r[4]); c.hline(x0, x1, g - 12, r[6]); c.hline(x0, x1, g - 3, r[2])
    for x in range(x0 + 9, x1, 14): c.vline(x, g - 11, g - 4, r[2])
    # Water in the channel under the front, and the gutter at the foot.
    water = RAMPS['water']
    c.rect(x0, g - 2, x1, g, water[3]); c.hline(x0, x1, g - 2, water[5])
    for x in range(x0 + 3, x1, 6): c.set(x + motion, g - 1, water[6])
    top(c, x0, x1, g - 12, r, 7, across=False)
    for i, sx in enumerate(range(x0 + 7, x1 - 4, 14)):
        # The keyhole: a round seat and the slot down the front.
        for dy in range(-2, 2):
            for dx in range(-2, 3):
                if dx * dx + dy * dy * 2 <= 5: c.set(sx + dx, g - 15 + dy, '#141210')
        c.vline(sx, g - 13, g - 10, '#141210'); c.set(sx - 1, g - 17, r[3])
    _flies(c, motion, [(28, 8, 12, 3, 1.0)])
    return finish(c, r)


# -- granaries ------------------------------------------------------------------

def _granary(c, x0, x1, body_top, floor, r, roof, rr, seed):
    boards(c, x0, body_top, x1, floor, r, seed, across=True, widths=(3, 3, 4))
    for x in (x0, x1, (x0 + x1) // 2): c.vline(x, body_top, floor, r[2 if x != x0 else 5])
    mid = (x0 + x1) // 2
    _door(c, mid + 3, mid + 11, body_top + 6, floor - 2, r, 'none')
    c.hline(x0, x1, floor, r[1]); c.hline(x0 - 1, x1 + 1, floor + 1, r[2])
    _gable(c, x0, x1, body_top - 1, 16, roof, rr)


def granary_staddle(v=0):
    r = WOODS[v]
    roof, rr = [('thatch', THATCH), ('tile', TILE), ('shingle', WALNUT)][v]
    c = Canvas(66, 74)
    x0, x1 = 7, 58
    _granary(c, x0, x1, 22, 58, r, roof, rr, v)
    stone = RAMPS['limestone']
    for sx in ([12, 32, 53] if v < 2 else [11, 25, 39, 53]):
        # A mushroom stone: a cap the rats cannot climb round, on a tapered foot.
        c.rect(sx - 4, 60, sx + 4, 62, stone[5]); c.hline(sx - 4, sx + 4, 62, stone[2]); c.hline(sx - 3, sx + 3, 60, stone[6])
        for y in range(63, 73):
            half = 1 + (y - 63) // 4
            c.hline(sx - half, sx + half, y, stone[4]); c.set(sx + half, y, stone[2])
        c.hline(sx - 3, sx + 3, 73, stone[2])
    for k in range(7):
        c.hline(44 + k, 46 + k, 59 + k * 2, OAK[4]); c.set(43 + k, 59 + k * 2, OAK[2])
    return finish(c, r)


def granary_stilt(v=0):
    r = [ASH, OAK, WALNUT][v]
    roof, rr = [('thatch', THATCH), ('tile', TILE), ('thatch', THATCH)][v]
    c = Canvas(64, 76)
    x0, x1 = 7, 56
    _granary(c, x0, x1, 24, 54, r, roof, rr, v + 2)
    for px in (9, 22, 41, 54):
        c.vline(px, 56, 75, r[4]); c.vline(px + 1, 56, 75, r[2])
        if v < 2:
            # Rat guards: a disc on each post.
            c.hline(px - 3, px + 4, 63, r[5]); c.hline(px - 3, px + 4, 64, r[2])
    c.hline(8, 56, 67, r[3])
    for k in range(9):
        c.hline(44 + k // 2, 45 + k // 2, 55 + k * 2, r[4])
    return finish(c, r)


# -- stalls without a kit ---------------------------------------------------------

def _wares(c, x0, x1, y, trades, seed):
    rng = random.Random(seed)
    span = (x1 - x0) // len(trades)
    for i, t in enumerate(trades):
        fn = P.GOODS[t]
        args = (c, x0 + i * span, x0 + (i + 1) * span, y, rng, None)
        if 'trade' in fn.__code__.co_varnames: fn(*args, trade=t)
        else: fn(*args)


def stall_trestle(v=0):
    r = WOODS[v]
    c = Canvas(42, 22)
    surf = P.base_table(c, 2, 39, 21, r, 9)
    for lx in (6, 33):
        c.line((lx - 2, 21), (lx + 2, 13), r[2]); c.line((lx + 2, 21), (lx - 2, 13), r[3])
    _wares(c, 3, 38, surf, [['fruit', 'greens'], ['grain', 'pottery'], ['fish']][v], v)
    return finish(c, r)


def stall_awning(v=0):
    cloth = P.CLOTH[['madder', 'indigo', 'green'][v]]
    r = OAK
    c = Canvas(52, 46)
    under = P.cover_awning(c, 5, 46, 4, 45, cloth, cloth, r, 0)
    surf = P.base_counter(c, 3, 48, 45, r, 13)
    _wares(c, 4, 47, surf, [['bread', 'cheese'], ['cloth', 'pottery'], ['fruit', 'fowl']][v], v)
    return finish(c, r)


def stall_booth(v=0):
    r = [OAK, WALNUT, ASH][v]
    roof = [['#3a2418', '#5d3527', '#804630', '#a05c3a', '#bd7a4c'], P.SHINGLE, ['#4b4030', '#6f6048', '#958264', '#b8a580', '#d4c29c']][v]
    c = Canvas(56, 52)
    under = P.cover_booth(c, 6, 49, 6, 51, roof, r[1:6], 0)
    surf = P.base_counter(c, 4, 51, 51, r, 14)
    _wares(c, 5, 50, surf, [['pottery', 'bread'], ['cloth', 'cheese'], ['greens', 'fish']][v], v + 3)
    for hx in range(12, 46, 8):
        P.lantern(c, hx, under + 5, P.CLOTH['madder']) if v == 0 else P.bolt(c, hx, under + 7, 6, P.CLOTH[['woad', 'weld', 'madder'][hx % 3]])
    return finish(c, r)


def stall_cart(v=0):
    r = WOODS[v]
    c = Canvas(54, 44)
    # A canvas tilt on hoops, the bed below it, one big wheel and the shafts down.
    for k in range(8):
        half = 20 - max(0, 3 - k) * 2
        c.hline(24 - half, 24 + half, 4 + k, CANVAS[6 if k < 2 else 5 if k < 5 else 4])
    for x in range(5, 44, 9): c.vline(x, 6, 11, CANVAS[3])
    c.hline(4, 44, 12, CANVAS[2])
    for px in (6, 42): c.vline(px, 12, 26, r[3]); c.vline(px + 1, 12, 26, r[2])
    boards(c, 3, 26, 45, 34, r, v, across=True, widths=(3, 3))
    c.hline(3, 45, 26, r[6]); c.hline(3, 45, 34, r[1])
    top(c, 3, 45, 26, r, 4)
    _wares(c, 5, 43, 24, [['fruit', 'greens'], ['bread', 'cheese'], ['pottery', 'fish']][v], v + 7)
    wheel(c, 24, 36, 7, r)
    c.line((45, 31), (53, 41), r[3]); c.line((45, 32), (53, 42), r[1])
    c.vline(5, 35, 43, r[2])
    return finish(c, r)


def stall_modern(v=0):
    cloth = [CANVAS, RAMPS['paintblue7'], RAMPS['rustred7']][v]
    c = Canvas(54, 46)
    g = 45
    # A tubular frame, a flat tilt, a board counter on trestles, crates under.
    for px in (3, 49): c.vline(px, 8, g, IRON[4]); c.vline(px + 1, 8, g, IRON[2])
    for k in range(5):
        c.hline(1, 52, 4 + k, cloth[6 if k == 0 else 5 if k < 3 else 4])
    for x in range(1, 53, 2): c.set(x, 9, cloth[3])
    c.hline(1, 52, 10, cloth[2])
    boards(c, 3, 26, 50, 29, OAK, v, across=True, widths=(2, 2))
    top(c, 3, 50, 26, ASH, 5)
    _wares(c, 5, 48, 24, [['fruit', 'greens'], ['fish', 'bread'], ['cheese', 'fruit']][v], v + 11)
    _crate(c, 8, g, 14, 10, ASH, v)
    _crate(c, 24, g, 14, 10, OAK, v + 1)
    c.hline(3, 50, 34, IRON[3])
    # The scale on its hook at the end.
    c.vline(50, 10, 15, IRON[2]); c.hline(47, 53, 16, IRON[5]); c.hline(48, 52, 17, IRON[3])
    return finish(c, IRON)


# -- street details ---------------------------------------------------------------

def saint_niche(v=0):
    r = [OAK, RAMPS['limestone'], RAMPS['sandstone']][v]
    c = Canvas(20, 42)
    g = 41
    if v == 0:
        c.vline(9, 18, g, OAK[4]); c.vline(10, 18, g, OAK[2])
    else:
        c.rect(6, 22, 13, g, r[4]); c.vline(13, 22, g, r[2]); c.hline(5, 14, 22, r[6]); c.hline(5, 14, g, r[2])
    # The box with its little roof, the image inside, a candle at its foot.
    c.rect(2, 6, 17, 21, r[4]); c.vline(17, 6, 21, r[2]); c.hline(2, 17, 21, r[1])
    c.rect(5, 9, 14, 19, '#2a2430')
    _gable(c, 2, 17, 6, 6, 'tile' if v else 'shingle', TILE if v else WALNUT)
    robe = [['#3a5a8a', '#5a7aaa'], ['#d8d0c0', '#f0eadc'], ['#2d4d7a', '#4a78a2']][v]
    c.rect(8, 13, 11, 19, robe[0]); c.vline(8, 13, 19, robe[1])
    c.rect(8, 10, 11, 12, '#e0b890'); c.hline(8, 11, 10, '#6a4428' if v != 1 else '#e0b890')
    for dx, dy in ((-1, -1), (0, -2), (1, -1), (2, -2), (3, -1)): c.set(8 + dx, 10 + dy, '#f0d060')
    if v == 2: c.rect(11, 15, 12, 17, '#e0b890')
    c.set(9, 20, '#f6e6a4'); c.set(9, 19, '#ffce5a')
    return finish(c, r)


def newsstand(v=0):
    r = [OAK, WALNUT, ['#14241e', '#1e3a30', '#2d5546', '#3f7259', '#579073', '#7dae92', '#aecdb5']][v]
    c = Canvas(38, 46)
    g = 45
    if v == 1:
        for k in range(6): c.hline(1, 36, 4 + k, CANVAS[6 if k < 1 else 5 if k < 4 else 3])
        for px in (2, 34): c.vline(px, 10, g, OAK[3])
    if v == 2:
        _gable(c, 3, 34, 12, 8, 'sheet', SHEET)
        c.rect(3, 13, 34, g, r[4]); c.vline(3, 13, g, r[5]); c.vline(34, 13, g, r[2])
        c.rect(6, 16, 31, 28, '#2a2a26')
    # Racks of papers, folded and hung, then the counter.
    rack_top = 16 if v == 2 else 12
    for i, x in enumerate(range(7, 31, 6)):
        c.rect(x, rack_top + 1, x + 4, rack_top + 9, '#e8e2d0'); c.hline(x, x + 4, rack_top + 1, '#fbf8ee')
        for y in range(rack_top + 3, rack_top + 9, 2): c.hline(x + 1, x + 3, y, '#8a8478')
        c.hline(x, x + 1, rack_top + 3, ['#a82a45', '#223a5c', '#2a2a26', '#a82a45'][i])
    if v < 2:
        for px in (5, 32): c.vline(px, rack_top - 1, g, OAK[3])
        c.hline(4, 33, rack_top, OAK[5])
    boards(c, 4, 33, 33, g, r if v != 1 else OAK, v, across=True, widths=(3, 4))
    top(c, 4, 33, 33, r if v != 1 else OAK, 4)
    for x in range(6, 31, 5):
        c.rect(x, 26, x + 3, 28, '#d8d2c0'); c.hline(x, x + 3, 26, '#f4f0e2')
    return finish(c, r)


def street_fountain(v=0):
    r = STONES[[2, 1, 0][v]]
    water = RAMPS['water']
    c = Canvas(34, 34)
    g = 33
    # A carved stele with a spout, falling into a basin.
    c.rect(11, 2, 22, 22, r[4]); c.vline(22, 2, 22, r[2]); c.hline(11, 22, 2, r[6])
    c.hline(10, 23, 4, r[5]); c.hline(10, 23, 5, r[2])
    c.rect(14, 8, 19, 13, r[3]); c.hline(14, 19, 8, r[2])
    c.set(16, 10, r[1]); c.set(17, 10, r[1])
    c.hline(16, 17, 15, IRON[5]); c.vline(17, 16, 22, water[6]); c.vline(16, 17, 22, water[5])
    c.rect(2, g - 9, 31, g, r[4]); c.hline(2, 31, g, r[2]); c.vline(31, g - 9, g, r[2]); c.hline(2, 31, g - 9, r[6])
    for x in range(8, 30, 7): c.vline(x, g - 7, g - 2, r[3])
    top(c, 2, 31, g - 9, r, 5, across=False)
    c.rect(4, g - 13, 29, g - 11, water[4]); c.hline(4, 29, g - 13, water[3])
    for x in (12, 20): c.set(x, g - 12, water[6])
    c.set(16, g - 12, water[6]); c.set(17, g - 12, water[6])
    return finish(c, r)


def street_notice(v=0):
    r = [OAK, WALNUT, OAK][v]
    c = Canvas(34, 40)
    g = 39
    for px in (4, 28): c.vline(px, 6, g, r[4]); c.vline(px + 1, 6, g, r[2])
    if v == 2: _gable(c, 3, 30, 6, 6, 'shingle', WALNUT)
    c.rect(2, 8, 31, 26, r[4]); c.hline(2, 31, 8, r[6]); c.hline(2, 31, 26, r[1]); c.vline(31, 8, 26, r[2])
    c.rect(4, 10, 29, 24, r[2] if v else '#e6e0cc')
    if v == 0:
        # A whitened board, lettered in red and black.
        for y in range(12, 23, 2): c.hline(6, 27 - (y * 3) % 7, y, '#3a2a20' if y != 12 else '#9a2a20')
    else:
        rng = random.Random(v)
        for x, y, w, h in ((5, 11, 9, 12), (15, 11, 7, 6), (15, 18, 7, 5), (23, 11, 6, 9)):
            paper = rng.choice(['#ece6d4', '#f4e8b8', '#e0d8c4'])
            c.rect(x, y, x + w - 1, y + h - 1, paper); c.hline(x, x + w - 1, y, '#fbf8ee')
            for ly in range(y + 2, y + h - 1, 2): c.hline(x + 1, x + w - 2, ly, '#8a8070')
            c.set(x + w // 2, y, '#7a1b34')
    return finish(c, r)


def market_display(v=0):
    r = WOODS[v]
    c = Canvas(34, 22)
    surf = P.base_table(c, 2, 31, 21, r, 6)
    rng = random.Random(v)
    if v == 0:
        for i, x in enumerate(range(6, 30, 6)):
            P.pot(c, x, surf, 3, 5, P.TERRACOTTA, False)
            P.cone(c, x, surf - 3, 4, P.CLOTH[['saffron', 'madder', 'weld', 'ochre'][i]])
    elif v == 1:
        P.folded(c, 4, surf, 10, 4, P.CLOTH['madder'], P.CLOTH['weld'])
        P.folded(c, 17, surf, 10, 3, P.CLOTH['indigo'], P.CLOTH['cotton'])
    else:
        P._baskets(c, 2, 31, surf, rng, None, trade='fruit')
    return finish(c, r)


def water_station(v=0):
    jar = [RAMPS['redearth7'], RAMPS['buffclay7'], RAMPS['terracotta7']][v]
    r = WALNUT if v < 2 else RAMPS['limestone']
    c = Canvas(34, 32)
    g = 31
    if v < 2:
        # A frame on legs holding the jars, a cup on a cord.
        for px in (2, 30): c.vline(px, 8, g, r[4]); c.vline(px + 1, 8, g, r[2])
        c.hline(1, 32, 8, r[5]); c.hline(1, 32, 9, r[2])
        c.hline(2, 31, 22, r[4]); c.hline(2, 31, 23, r[2])
        for k in range(4): c.hline(0, 33, 4 + k, THATCH[4 if k < 2 else 3])
    else:
        c.rect(1, g - 10, 32, g, r[4]); c.hline(1, 32, g - 10, r[6]); c.hline(1, 32, g, r[2])
        top(c, 1, 32, g - 10, r, 4, across=False)
    base = 21 if v < 2 else g - 12
    for x in (9, 17, 25):
        P.pot(c, x, base, 10, 7, jar[1:6])
        c.hline(x - 1, x + 1, base - 10, jar[1])
    c.vline(30 if v < 2 else 29, base - 6, base - 2, '#8a7a5a'); c.rect(29, base - 1, 31, base, jar[3])
    return finish(c, r)


def farm_cart(v=0):
    r = [OAK, OAK, ASH][v]
    c = Canvas(76, 46)
    g = 45
    # Seen broadside: the bed on its axle, two big wheels, the shafts down.
    boards(c, 4, 16, 52, 30, r, v, across=True, widths=(4, 5))
    for x in (4, 20, 36, 52): c.vline(x, 14, 30, r[2 if x > 4 else 5])
    c.hline(4, 52, 30, r[1]); c.hline(3, 53, 14, r[6]); c.hline(3, 53, 15, r[3])
    top(c, 4, 52, 15, r, 4)
    if v == 1:
        for x in range(3, 54):
            h = 9 + int(3 * math.sin(x * .3)) + (x * 7) % 3
            for k in range(h):
                c.set(x, 10 - k, THATCH[[4, 5, 6, 5, 3][(x + k * 2) % 5]] if k < h - 1 else THATCH[3])
    # Two-wheeled, so broadside shows one wheel, on the axle under the load.
    wheel(c, 28, 33, 12, r, spokes=10)
    c.line((52, 26), (75, 42), r[4]); c.line((52, 27), (75, 43), r[2])
    c.vline(4, 31, g, r[3])
    return finish(c, r)


FRONTS = {
    'crate': crate, 'crate-stack': crate_stack, 'woodpile': woodpile, 'strapped-chest': strapped_chest,
    'bench': bench, 'park-bench': park_bench, 'municipal-planter': municipal_planter,
    'privy-shed': privy_shed, 'privy-stone': privy_stone, 'privy-outhouse': privy_outhouse,
    'privy-nightsoil': privy_nightsoil, 'privy-bench': privy_bench,
    'granary-staddle': granary_staddle, 'granary-stilt': granary_stilt,
    'stall-trestle': stall_trestle, 'stall-awning': stall_awning, 'stall-booth': stall_booth,
    'stall-cart': stall_cart, 'stall-modern': stall_modern,
    'saint-niche': saint_niche, 'newsstand': newsstand, 'street-fountain': street_fountain,
    'street-notice': street_notice, 'market-display': market_display, 'water-station': water_station,
    'farm-cart': farm_cart,
}
