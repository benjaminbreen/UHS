"""Street and yard furniture in the buildings' convention: fronts square on,
tops seen from above at moderate depth, no sheared side.

Sized to the figure as the game draws it (about 40px from crown to heel), not
to the metre: a crate comes to a person's knee, a bench seat to the back of
the knee.
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
    top(c, x, x + w - 1, g - h + 1, r[1:] + r[-1:], round(w * .45))
    for nx in (x + 1, x + w - 2): c.set(nx, g - h - round(w * .45) + 1, IRON[2]); c.set(nx, g - h - 1, IRON[1])


def crate(v=0):
    r = WOODS[v]
    c = Canvas(22, 26)
    _crate(c, 1, 25, 20, 14, r, v)
    return finish(c, r)


def crate_stack(v=0):
    """Two crates and a smaller one set back on top of them."""
    r = WOODS[v]
    c = Canvas(42, 44)
    _crate(c, 1, 43, 20, 14, r, v)
    _crate(c, 21, 43, 20, 14, WOODS[(v + 1) % 3], v + 3)
    _crate(c, 9, 26, 16, 11, WOODS[(v + 2) % 3], v + 5)
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
    c = Canvas(46, 22)
    v = v % 3
    if v == 0:
        w = RAMPS['oak7']
        for lx in (7, 36):
            for y in range(11, 20):
                c.set(lx, y, w[4]); c.set(lx + 1, y, w[3]); c.set(lx + 2, y, w[1])
        for x in range(10, 36):
            c.set(x, 15, w[3]); c.set(x, 16, w[1])
        for y in range(5, 13):
            for x in range(4, 42):
                if (x in (4, 41)) and y in (5, 12):
                    continue
                if y == 5: col = w[5] if x < 30 else w[4]
                elif y == 8: col = w[2]
                elif y < 11:
                    grain = (x * 5 + y * 3) % 11 == 0
                    col = w[4] if (x < 28 and not grain) else w[3]
                elif y == 11: col = w[2] if x < 34 else w[1]
                else: col = w[1]
                c.set(x, y, col)
        for px in (8, 37):
            c.set(px, 7, w[2]); c.set(px, 9, w[2])
        soft_outline(c, w[0], w[2])
    elif v == 1:
        s = RAMPS['limestone']
        for lx in (8, 33):
            for y in range(11, 20):
                w_pad = 1 if y >= 18 else 0
                for x in range(lx - w_pad, lx + 5 + w_pad):
                    col = s[1] if y == 11 else (s[5] if (x == lx and y < 17) else (s[4] if x < lx + 2 else (s[3] if x < lx + 4 else s[1])))
                    c.set(x, y, col)
        for y in range(5, 12):
            for x in range(4, 42):
                if y == 5: col = s[5] if x < 32 else s[4]
                elif y < 9: col = s[4] if x < 30 else s[3]
                elif y == 9: col = s[5] if x < 26 else s[4]
                elif y == 10: col = s[3] if x < 32 else s[2]
                else: col = s[1]
                c.set(x, y, col)
        soft_outline(c, s[0], s[2])
    else:
        b = RAMPS['bamboo7']
        cord = '#3a2b1c'
        for lx in (8, 35):
            for y in range(11, 20):
                c.set(lx, y, b[4] if y % 4 != 0 else b[1])
                c.set(lx + 1, y, b[3] if y % 4 != 0 else b[1])
                c.set(lx + 2, y, b[1])
        for x in range(11, 35):
            c.set(x, 16, b[3] if x % 5 != 0 else b[1]); c.set(x, 17, b[1])
        for sy in (5, 7, 9):
            for x in range(4, 42):
                node = (x % 7) == 0
                c.set(x, sy, b[1] if node else (b[5] if x < 28 else b[4]))
                c.set(x, sy + 1, b[1] if node else (b[3] if x < 32 else b[2]))
        for lx in (8, 9, 36, 37):
            for y in range(5, 12):
                c.set(lx, y, cord)
        soft_outline(c, b[0], b[2])
    return c.image()


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


def privy_bench(v=0, motion=0):
    """A public latrine: weathered carved stone bench with keyhole seats over a running gutter."""
    c = Canvas(58, 32)
    stone = [
        ['#2f333a', '#4d535e', '#6c7482', '#8d96a6', '#afb8c8', '#cfd7e4'],
        ['#452e1d', '#6d4c31', '#936c48', '#b68c62', '#d3ad80', '#e9cca0'],
        ['#3e3c36', '#646158', '#888479', '#aba79b', '#cbc7bc', '#e6e2d8'],
    ][v % 3]
    for y in range(23, 30):
        for x in range(4, 54):
            if y == 23:
                c.set(x, y, stone[1])
            elif y in (24, 25, 26):
                glint = ((x + motion * 2 + y * 3) % 9) == 0 and y == 25
                c.set(x, y, '#294d5e' if y == 24 else ('#7ec0d4' if glint else ('#43768a' if y == 25 else '#346275')))
            elif y == 27:
                c.set(x, y, stone[5] if x < 38 else stone[4])
            else:
                c.set(x, y, stone[3] if y == 28 else stone[1])
    for y in range(6, 24):
        for x in range(5, 53):
            if (x in (5, 52)) and y == 6:
                continue
            slab = (x - 5) // 12
            seam = x in (17, 29, 41)
            tone_v = 1 if slab in (0, 2) else 0
            if y < 14:
                if y == 6:
                    col = stone[5] if x < 40 else stone[4]
                elif seam:
                    col = stone[2]
                else:
                    col = stone[4 + (tone_v if y < 10 and x < 36 else 0)] if x < 38 else stone[3]
                if y == 13 and x in (13, 37):
                    col = stone[2]
                c.set(x, y, col)
            elif y == 14:
                c.set(x, y, stone[5] if x < 36 else stone[4])
            elif y == 15:
                c.set(x, y, stone[1])
            else:
                pilaster = x in (5, 6, 16, 17, 28, 29, 40, 41, 51, 52)
                if pilaster:
                    col = stone[4] if x in (5, 16, 28, 40, 51) else stone[2]
                else:
                    col = stone[3] if (x < 34 and y < 21) else stone[2]
                    if y == 22:
                        col = stone[1]
                c.set(x, y, col)
    for kx in (11, 23, 35, 47):
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                d2 = dx * dx + dy * dy
                if 5 < d2 <= 9:
                    c.set(kx + dx, 10 + dy, stone[2] if dy < 0 else stone[5])
                elif d2 <= 5:
                    c.set(kx + dx, 10 + dy, '#181412' if dy < 1 else '#28221e')
        for sy in range(13, 19):
            c.set(kx - 1, sy, stone[2]); c.set(kx + 2, sy, stone[4])
            c.set(kx, sy, '#181412'); c.set(kx + 1, sy, '#26201c')
    soft_outline(c, stone[0], stone[2])
    # Orbit stays inside the stone bench silhouette so trimmed bounds match across frames.
    _flies(c, motion, [(28, 12, 11, 3, 1.0)])
    return c.image()


# -- granaries ------------------------------------------------------------------

def _draw_granary_roof(c, x0, x1, y0, y1, kind):
    tile_r = ['#4f241c', '#7c3b2a', '#a6543b', '#c56f50', '#dc8c69']
    thatch_r = ['#4a381d', '#745a2f', '#9c7c42', '#bfa05c', '#dac07c']
    slate_r = ['#282d36', '#424a58', '#5c6678', '#7a8598', '#9aa5b8']
    dark_tile = ['#1f242c', '#343b48', '#4d5666', '#687386', '#8692a6']
    r = {'thatch': thatch_r, 'tile': tile_r, 'slate': slate_r, 'darktile': dark_tile}[kind]
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(1, y1 - y0)
        inset = int((1.0 - t) * 4)
        lx, rx = x0 + inset, x1 - inset
        for x in range(lx, rx + 1):
            if y == y0:
                col = r[4] if x < (lx + rx) // 2 + 4 else r[3]
            elif y == y0 + 1:
                col = r[3] if x % 4 != 0 else r[1]
            elif y == y1:
                col = r[0] if kind != 'thatch' else (r[2] if x % 3 == 1 else r[1])
            elif kind == 'thatch':
                bundle = (x * 11 + ((y - y0) // 5) * 7) % 5
                tier = (y - y0) // 5
                idx = 4 if (bundle == 0 and y < y1 - 3) else (3 if bundle in (1, 2) else (2 if bundle == 3 else 1))
                if (y - y0) % 5 == 4 and (x + tier) % 2 == 0:
                    idx = max(1, idx - 1)
                if x > rx - 6 and idx > 1:
                    idx -= 1
                col = r[idx]
            elif kind in ('tile', 'darktile'):
                course = (y - y0) % 4
                rib = x % 4
                idx = 4 if (rib == 1 and course < 3) else (3 if rib in (0, 2) else 2)
                if course == 3: idx = max(1, idx - 1)
                if x > rx - 7: idx = max(1, idx - 1)
                col = r[idx]
            else:
                course = (y - y0) // 3
                seam = (x + (course % 2) * 3) % 5 == 0
                idx = 3 if y < (y0 + y1) // 2 else 2
                if seam or (y - y0) % 3 == 2: idx = max(1, idx - 1)
                if x < lx + 8 and not seam: idx = min(4, idx + 1)
                col = r[idx]
            c.set(x, y, col)
    for y in range(y0 + 1, y1 + 1):
        t = (y - y0) / max(1, y1 - y0)
        inset = int((1.0 - t) * 4)
        c.set(x0 + inset, y, r[1]); c.set(x1 - inset, y, r[0])


def granary_staddle(v=0):
    c = Canvas(62, 74)
    if v == 0:
        roof_k, wall, door = 'thatch', RAMPS['oak7'], RAMPS['walnut7']
    elif v == 1:
        roof_k, wall, door = 'tile', RAMPS['walnut7'], RAMPS['oak7']
    else:
        roof_k, wall, door = 'slate', RAMPS['cedar7'], RAMPS['walnut7']
    stone, iron = RAMPS['limestone'], RAMPS['castiron7']
    for sx in (14, 31, 48):
        for y in range(58, 70):
            hw = 2 if y < 67 else 3
            for x in range(sx - hw, sx + hw + 1):
                col = stone[1] if y == 58 else (stone[4] if x < sx else (stone[3] if x == sx else (stone[2] if x == sx + 1 else stone[1])))
                c.set(x, y, col)
        for y in range(53, 58):
            hw = 5 if y in (55, 56) else (4 if y == 54 else 3)
            for x in range(sx - hw, sx + hw + 1):
                col = stone[1] if y == 57 else (stone[5] if (y <= 54 and x <= sx) else (stone[4] if x < sx else (stone[3] if x <= sx + 1 else stone[2])))
                c.set(x, y, col)
    for y in range(50, 54):
        for x in range(7, 55):
            col = wall[1] if x > 44 else (wall[5] if y == 50 else (wall[3] if y == 51 else (wall[2] if y == 52 else wall[1])))
            c.set(x, y, col)
    for y in range(24, 50):
        for x in range(9, 53):
            if y < 27:
                c.set(x, y, wall[1] if y == 24 else wall[2]); continue
            if x in (9, 10, 11) or x in (50, 51, 52):
                c.set(x, y, wall[5] if x == 10 else (wall[3] if x in (9, 11, 50) else wall[1])); continue
            lap = (y - 27) % 4
            idx = (4 if lap == 0 else (3 if lap <= 2 else 2)) - (1 if x > 42 else 0)
            if (x * 5 + y * 2) % 13 == 0 and lap in (1, 2): idx = max(1, idx - 1)
            c.set(x, y, wall[max(1, idx)])
    for y in range(32, 39):
        for x in range(15, 23):
            c.set(x, y, (wall[1] if y == 38 or x == 22 else wall[5]) if (y in (32, 38) or x in (15, 22)) else ('#241b14' if y % 2 == 1 else wall[3]))
    for y in range(28, 50):
        for x in range(30, 44):
            if x in (30, 43) or y == 28:
                c.set(x, y, wall[1] if x == 43 else wall[5])
            else:
                plank = (x - 31) % 3 == 0
                idx = (4 if (x < 35 and not plank) else (3 if not plank else 2)) - (1 if y < 31 else 0)
                c.set(x, y, door[max(1, idx)])
    for hy in (33, 43):
        for hx in range(31, 37):
            c.set(hx, hy, iron[4] if hx < 35 else iron[2]); c.set(hx, hy + 1, iron[1])
    c.set(41, 39, iron[5]); c.set(41, 40, iron[2])
    _draw_granary_roof(c, 4, 57, 5, 24, roof_k)
    soft_outline(c, wall[0], wall[2])
    for step in range(21):
        ly, lx = 50 + step, 34 + int(step * 0.28)
        for rail_dx in (0, 7):
            c.set(lx + rail_dx, ly, wall[0]); c.set(lx + rail_dx + 1, ly, wall[4]); c.set(lx + rail_dx + 2, ly, wall[1])
        if step % 4 == 2:
            for rx in range(lx + 1, lx + 8):
                c.set(rx, ly, wall[5]); c.set(rx, ly + 1, wall[1])
    return c.image()


def granary_stilt(v=0):
    c = Canvas(62, 74)
    if v == 0:
        roof_k, wall, post, door, guards = 'thatch', RAMPS['bamboo7'], RAMPS['walnut7'], RAMPS['oak7'], True
    elif v == 1:
        roof_k, wall, post, door, guards = 'darktile', RAMPS['cedar7'], RAMPS['walnut7'], RAMPS['walnut7'], False
    else:
        roof_k, wall, post, door, guards = 'thatch', RAMPS['oak7'], RAMPS['walnut7'], RAMPS['walnut7'], False
    for sx in (13, 25, 37, 49):
        for y in range(50, 71):
            c.set(sx - 1, y, post[4]); c.set(sx, y, post[3]); c.set(sx + 1, y, post[1])
        if guards:
            for x in range(sx - 4, sx + 5):
                c.set(x, 53, door[5] if x <= sx else door[3]); c.set(x, 54, door[2] if x <= sx else door[1])
    for x in range(13, 50):
        c.set(x, 62, post[3]); c.set(x, 63, post[1])
    for y in range(47, 51):
        for x in range(7, 55):
            c.set(x, y, post[5] if y == 47 else (post[3] if y == 48 else post[1]))
    for y in range(23, 47):
        for x in range(9, 53):
            if y < 26:
                c.set(x, y, wall[1] if y == 23 else wall[2]); continue
            if x in (9, 10, 51, 52):
                c.set(x, y, post[4] if x <= 10 else post[1]); continue
            shade_r = 1 if x > 42 else 0
            if v == 0:
                rib = (x - 11) % 8 == 0
                weave = ((x + y) // 2) % 2 == 0
                idx = (2 if rib else (4 if weave else 3)) - shade_r
            elif v == 1:
                batten = (x - 11) % 5 == 0
                idx = (2 if batten else (4 if (x - 11) % 5 == 1 else 3)) - shade_r
            else:
                lap = (y - 26) % 4
                idx = (4 if lap == 0 else (3 if lap <= 2 else 2)) - shade_r
            c.set(x, y, wall[max(1, idx)])
    for y in range(27, 47):
        for x in range(24, 38):
            if x in (24, 37) or y == 27:
                c.set(x, y, post[1] if x == 37 else post[5])
            else:
                plank = (x - 25) % 3 == 0
                idx = (4 if (x < 30 and not plank) else (3 if not plank else 2)) - (1 if y < 30 else 0)
                c.set(x, y, door[max(1, idx)])
    for bx in range(26, 36):
        c.set(bx, 37, post[5]); c.set(bx, 38, post[1])
    _draw_granary_roof(c, 4, 57, 4, 23, roof_k)
    soft_outline(c, post[0], wall[2])
    lr = wall if v == 0 else door
    for step in range(23):
        ly, lx = 48 + step, 28 + int(step * 0.25)
        for rail_dx in (0, 6):
            c.set(lx + rail_dx, ly, post[0]); c.set(lx + rail_dx + 1, ly, lr[4])
        if step % 4 == 2:
            for rx in range(lx + 1, lx + 7):
                c.set(rx, ly, lr[5]); c.set(rx, ly + 1, post[1])
    return c.image()


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
    c = Canvas(26, 42)
    oak, walnut = OAK, WALNUT
    lime, sand = RAMPS['limestone'], RAMPS['sandstone']
    terra = RAMPS['terracotta7']
    gold = ['#8f6218', '#bf8826', '#e3ad42', '#f7cc6e', '#fff2b8']
    moss = ['#2a421c', '#42662c', '#628e42']
    cx = 12.5

    def plinth_34(hw, top_y, bot_y, st):
        for x in range(int(cx - hw), int(cx + hw) + 1):
            u = (x - cx) / max(1, hw)
            drop = round(2.0 * math.sqrt(max(0.0, 1.0 - min(1.0, u * u))))
            for y in range(top_y, bot_y + drop + 1):
                tone = 6 if (y == top_y and u < 0.25) else (5 if y == top_y else (1 if y >= bot_y + drop else (4 if u < -0.3 else (3 if u < 0.35 else 2))))
                c.set(x, y, st[tone])

    if v == 0:
        plinth_34(5, 35, 38, lime)
        for y in range(21, 36):
            c.set(11, y, oak[5]); c.set(12, y, oak[4]); c.set(13, y, oak[2]); c.set(14, y, oak[1])
        for i in range(3):
            c.set(9 + i, 22 + i, oak[5]); c.set(16 - i, 22 + i, oak[2])
        box_r = oak
        roof_r = walnut
    else:
        st = lime if v == 1 else sand
        plinth_34(7, 35, 38, st)
        plinth_34(5, 23, 34, st)
        box_r = st
        roof_r = terra

    for x in range(5, 21):
        c.set(x, 21, box_r[6] if x < 14 else box_r[4])
        c.set(x, 22, box_r[2])
    for y in range(10, 21):
        for x in range(6, 20):
            u = (x - cx) / 7.0
            c.set(x, y, box_r[5] if x < 8 else (box_r[2] if x > 17 else (box_r[4] if u < 0.2 else box_r[3])))
    for y in range(11, 21):
        for x in range(8, 18):
            if y == 11 and x in (8, 17):
                continue
            c.set(x, y, '#182232' if (y < 13 or x in (8, 17)) else '#283a52')

    # Halo & robed sacred figure
    for dx in range(-2, 3):
        for dy in range(-2, 2):
            if abs(dx) + abs(dy) <= 2:
                c.set(12 + dx, 14 + dy, gold[3 if dx <= 0 else 2])
    c.rect(12, 13, 13, 14, '#f2d4b0')
    robe = ['#2b4c7e', '#4970ab', '#739ad1'] if v != 1 else ['#8e241a', '#c43626', '#e8523c']
    for y in range(15, 20):
        c.set(11, y, robe[2]); c.set(12, y, robe[1]); c.set(13, y, robe[1]); c.set(14, y, robe[0])
    if v == 2:
        c.set(13, 16, gold[3]); c.set(13, 15, '#f2d4b0')

    # Pitched roof with overhang
    for dy in range(7):
        y = 4 + dy
        hw = 2 + dy
        for x in range(int(cx - hw), int(cx + hw) + 2):
            u = (x - cx) / max(1, hw)
            tone = 6 if dy == 0 else (5 if u < -0.15 else (4 if u < 0.35 else 2))
            if (x + dy) % 2 == 0 and 0 < dy < 6:
                tone = max(1, tone - 1)
            c.set(x, y, roof_r[tone])
    c.hline(4, 21, 10, roof_r[1])
    c.vline(12, 1, 3, IRON[5]); c.hline(11, 13, 2, IRON[5])
    # Candle & flower offerings on the sill
    c.set(9, 20, '#ff9e22'); c.set(9, 19, '#fff6bf')
    c.set(16, 20, '#e8523c'); c.set(17, 20, moss[2])
    soft_outline(c, box_r[0], box_r[3])
    return c.image()


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
    from .solid import disc, lathe
    r = STONES[[2, 1, 0][v % 3]]
    water = ['#16324a', '#214b6e', '#2f6994', '#468cb8', '#6cb2d6', '#a4dbf0', '#eafaff']
    brass = RAMPS['brass7']
    c = Canvas(36, 36)
    cx = 17.5

    # 1. Carved stone basin in 3/4 view with curved elliptical base drop
    hw_b = 14
    for x in range(int(cx - hw_b), int(cx + hw_b) + 1):
        u = (x - cx) / hw_b
        drop = round(2.6 * math.sqrt(max(0.0, 1.0 - u * u)))
        for y in range(21, 30 + drop + 1):
            if y == 21:
                tone = 6 if u < 0.25 else 5
            elif y >= 30 + drop:
                tone = 1
            else:
                tone = 5 if u < -0.45 else (4 if u < 0.2 else (3 if u < 0.65 else 2))
                if (x - int(cx - hw_b)) % 7 == 0 and 22 < y < 28 + drop:
                    tone = max(2, tone - 1)
            c.set(x, y, r[tone])

    # 2. 3/4 top rim & shimmering water pool
    for d in range(5):
        y = 17 + d
        inset = (4 - d) // 2
        for x in range(int(cx - hw_b + inset), int(cx + hw_b - inset) + 1):
            if d == 0 or d == 4 or x <= int(cx - hw_b + inset + 1) or x >= int(cx + hw_b - inset - 1):
                c.set(x, y, r[6 if d == 0 or x < cx else 4])
            else:
                c.set(x, y, water[4 if (x + d) % 3 != 0 else 5])

    # 3. Rear sculpted fountain pier with cornice cap & lion/brass mask spout
    for y in range(3, 18):
        for x in range(12, 24):
            u = (x - cx) / 6.0
            if y in (3, 4):
                tone = 6 if (y == 3 and u < 0.3) else (5 if u < 0.2 else 3)
            else:
                tone = 5 if u < -0.35 else (4 if u < 0.35 else 2)
            c.set(x, y, r[tone])
    c.hline(11, 24, 3, r[6]); c.hline(11, 24, 5, r[2])
    c.rect(15, 8, 20, 13, r[3]); c.hline(15, 20, 8, r[2])
    c.rect(17, 10, 18, 11, brass[5]); c.set(17, 10, brass[6])

    # 4. Falling water jet and concentric splash rings in the basin
    for y in range(12, 19):
        c.set(17, y, water[6]); c.set(18, y, water[4])
    for dx in (-3, -2, -1, 0, 1, 2, 3):
        c.set(17 + dx, 19, water[6 if abs(dx) <= 1 else 5])
    c.set(10, 19, water[6]); c.set(24, 18, water[5])

    soft_outline(c, r[0], r[3])
    return c.image()


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
    from .solid import K, disc, lathe, bench_34
    jar = [RAMPS['terracotta7'], RAMPS['buffclay7'], RAMPS['redearth7']][v % 3]
    wood = WALNUT if v % 3 == 0 else OAK
    stone = RAMPS['sandstone']
    straw = ['#362812', '#523d1b', '#735726', '#967434', '#ba9447', '#dbb660', '#f2d680']
    water = ['#16324a', '#214b6e', '#2f6994', '#468cb8', '#6cb2d6', '#a4dbf0', '#eafaff']
    brass = RAMPS['brass7']
    c = Canvas(36, 34)
    cx = 17.5

    if v % 3 < 2:
        # 4-legged 3/4 timber stand with back & front posts
        bench_34(c, cx, 21, 14, 3, wood)
        for lx in (5, 29):
            for y in range(9, 22):
                c.set(lx, y, wood[5]); c.set(lx + 1, y, wood[2])
        base_y = 22
    else:
        # Carved sandstone plinth with curved 3/4 base drop
        hw_p = 14
        for x in range(int(cx - hw_p), int(cx + hw_p) + 1):
            u = (x - cx) / hw_p
            drop = round(2.2 * math.sqrt(max(0.0, 1.0 - u * u)))
            for y in range(21, 29 + drop + 1):
                tone = 6 if (y == 21 and u < 0.25) else (5 if y == 21 else (1 if y >= 29 + drop else (4 if u < -0.3 else (3 if u < 0.35 else 2))))
                c.set(x, y, stone[tone])
        base_y = 21

    # Three plump 3/4 matka water jars with cool water inside the mouths
    for jx in (9.5, 17.5, 25.5):
        lathe(c, jx, base_y, [(0, 2.2), (2.5, 4.0), (5.5, 3.8), (7.5, 2.2), (8.5, 2.6)], jar)
        ty = base_y - 8.5 - 2.2 * K
        disc(c, jx, ty, 2.5, 1.1, jar[5])
        disc(c, jx, ty + 0.2, 1.6, 0.8, water[3])
        c.set(int(jx) - 1, int(ty), water[6])

    # Brass drinking ladle resting on the right edge
    c.rect(29, base_y - 3, 31, base_y - 1, brass[5]); c.set(29, base_y - 3, brass[6])
    c.line((30, base_y - 3), (32, base_y - 7), brass[4])

    if v % 3 < 2:
        # Pitched overhanging thatch canopy roof over the jars
        for dy in range(7):
            y = 3 + dy
            inset = (6 - dy) // 2
            xl, xr = 2 + inset, 33 - inset
            for x in range(xl, xr + 1):
                u = (x - cx) / max(1, (xr - xl) / 2.0)
                if dy == 0:
                    tone = 6 if u < 0.3 else 5
                elif dy == 6:
                    tone = 2 if (x % 2 == 0) else 1
                else:
                    tone = 5 if u < -0.25 else (4 if u < 0.35 else 3)
                    if (x + dy * 2) % 4 == 0:
                        tone = max(2, tone - 1)
                c.set(x, y, straw[tone])
        soft_outline(c, wood[0], straw[3])
    else:
        soft_outline(c, stone[0], jar[3])
    return c.image()


def farm_cart(v=0):
    r = [OAK, OAK, ASH][v]
    c = Canvas(76, 46)
    g = 45
    # Seen broadside: the bed on its axle, two big wheels, the shafts down.
    boards(c, 4, 16, 52, 30, r, v, across=True, widths=(4, 5))
    for x in (4, 20, 36, 52): c.vline(x, 14, 30, r[2 if x > 4 else 5])
    c.hline(4, 52, 30, r[1]); c.hline(3, 53, 14, r[6]); c.hline(3, 53, 15, r[3])
    for x in range(5, 52):
        c.vline(x, 7, 9, r[3]); c.vline(x, 10, 13, r[4] if (x - 5) % 6 else r[2])
    c.hline(4, 52, 6, r[6]); c.hline(4, 52, 9, r[2])
    for x in (4, 52): c.vline(x, 6, 13, r[5 if x == 4 else 2])
    if v == 1:
        for x in range(3, 54):
            h = 9 + int(3 * math.sin(x * .3)) + (x * 7) % 3
            for k in range(h):
                c.set(x, 13 - k, THATCH[[4, 5, 6, 5, 3][(x + k * 2) % 5]] if k < h - 1 else THATCH[3])
    # Two-wheeled, so broadside shows one wheel, on the axle under the load.
    wheel(c, 28, 33, 12, r, spokes=10)
    c.line((52, 26), (75, 42), r[4]); c.line((52, 27), (75, 43), r[2])
    c.vline(4, 31, g, r[3])
    return finish(c, r)


FRONTS = {
    'crate': crate, 'crate-stack': crate_stack, 'strapped-chest': strapped_chest,
    'bench': bench, 'park-bench': park_bench, 'municipal-planter': municipal_planter,
    'privy-bench': privy_bench,
    'granary-staddle': granary_staddle, 'granary-stilt': granary_stilt,
    'stall-trestle': stall_trestle, 'stall-awning': stall_awning, 'stall-booth': stall_booth,
    'stall-cart': stall_cart, 'stall-modern': stall_modern,
    'saint-niche': saint_niche, 'newsstand': newsstand, 'street-fountain': street_fountain,
    'street-notice': street_notice, 'market-display': market_display, 'water-station': water_station,
    'farm-cart': farm_cart,
}
