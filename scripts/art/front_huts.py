"""Huts and tents: round and portable dwellings, drawn by hand-banded turning.

    .venv/bin/python scripts/art/front_huts.py artifacts/huts/sheet.png [study ...]

A round house looks the same from every side, so it has no side wall to
shear. `turn` paints a solid of revolution column by column: each pixel takes
a step of a curated palette by how far round the form it lies (a lit band
left of centre, the core shadow right), and a covering adds its courses,
seams and strands on top. The ground ellipse is shallow (`RY`), as the old
round sprites had it: they read as standing things, not plans.

A door on a round wall is drawn on the wall: it sits a little round the
curve, narrows as it turns away, and its head and sill follow the wall's
ellipse. The palettes are the game's own (`steppePalette`, `foragerPalette`
in regional-houses.json), dark to light.
"""
from pathlib import Path
import json
import math
import random
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, h2  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402


def _rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


_DATA = json.loads((ROOT / 'src/content/graphics/regional-houses.json').read_text())
PAL = {k: [_rgb(c) for c in v] for k, v in {**_DATA['foragerPalette'], **_DATA['steppePalette']}.items()}
PAL.update({k: [_rgb(c) for c in v] for k, v in {
    'straw': ['#4e3a1c', '#7c5c26', '#a98034', '#cfa44a', '#e6c46e', '#f4dc98'],
    'straw-old': ['#3e3424', '#625238', '#88744e', '#aa9568', '#c6b288', '#dccca6'],
    'reed': ['#33301f', '#524c32', '#746c48', '#958c62', '#b2aa80', '#cbc49e'],
    'hide': ['#40281a', '#68432c', '#8f6340', '#b38558', '#cfa676', '#e4c49a'],
    'hide-pale': ['#4a3a2a', '#745c42', '#9c805e', '#bea27c', '#d8c09c', '#ece0c4'],
    'mud': ['#3e2a1e', '#644430', '#8a6244', '#ae8460', '#c8a27a', '#dcbe98'],
    'whitewash': ['#4e4a42', '#7a7466', '#a8a290', '#cdc8b6', '#e6e2d2', '#f6f3e8'],
    'wattle': ['#2e2216', '#4c3824', '#6c5234', '#8c6e48', '#ab8c62', '#c6aa80'],
    'cedar': ['#2a1812', '#48281c', '#6c3e2a', '#92563a', '#b2724e', '#cc9268'],
    'cedar-grey': ['#2c2a2a', '#4a4644', '#6c6662', '#8e8882', '#aea8a0', '#cac4ba'],
    'palm': ['#2a2414', '#463c22', '#665a32', '#887a46', '#a89a60', '#c4b882'],
    'canvas': ['#4a463a', '#78725e', '#a49e86', '#c8c2a8', '#e0dcc4', '#f2eedc'],
    'expedition': ['#553d31', '#7a4a30', '#925633', '#b8722f', '#d18c39', '#ebbd5c'],
    'paint-red': ['#3a1210', '#6a1e16', '#9c3020', '#c4442a', '#d8623a', '#e88a58'],
}.items()})
DARK = (30, 22, 20, 255)
DOORWAY = (56, 40, 34, 255)
RY = 0.26


def band(u):
    """Palette step across a turned form: the rim turning away a little dim,
    a lit band left of centre, the body, then the core shadow on the right."""
    return 3 if u < -0.78 else 5 if u < -0.32 else 4 if u < 0.12 else 3 if u < 0.52 else 2 if u < 0.84 else 1


def turn(c, cx, gy, H, radius, pal, tex=None, step=0.5):
    """A solid of revolution whose foot's centre is on row `gy`: `radius(z)`
    for z in 0..H. `tex(x, u, z, k)` returns a palette step or a colour."""
    R = max(radius(z * H / 24) for z in range(25))
    for x in range(int(cx - R) - 1, int(cx + R) + 2):
        dx = x + 0.5 - cx
        z = 0.0
        while z <= H:
            r = radius(z)
            if abs(dx) <= r and r > 0.3:
                u = dx / r
                sy = round(gy - z + RY * math.sqrt(max(0.0, r * r - dx * dx)))
                k = band(u)
                col = tex(x, u, z, k) if tex else k
                if isinstance(col, int):
                    col = pal[max(0, min(5, col))]
                c.p(x, sy, col)
            z += step


def ring_y(cx, gy, r, x):
    """The row where the front of a ring of radius r crosses column x."""
    dx = x + 0.5 - cx
    return gy + RY * math.sqrt(max(0.0, r * r - dx * dx))


def wall_door(c, cx, gy, R, theta, w, h, paint, frame=None, arch=0):
    """A door on a round wall, `theta` round from the front (+ to the right):
    it narrows as it turns and its sill and head follow the wall's curve.
    `paint(a, v, edge)` colours it, a across and v down, 0..1."""
    xs = []
    for x in range(int(cx - R), int(cx + R) + 1):
        dx = x + 0.5 - cx
        if abs(dx) >= R:
            continue
        phi = math.asin(dx / R)
        a = (phi - theta) * R
        if abs(a) > w / 2 + (2 if frame else 0):
            continue
        xs.append(x)
        sill = round(gy + RY * R * math.cos(phi))
        ai = (a + w / 2) / w
        top_h = h - (arch * (1 - math.sqrt(max(0.0, 1 - (2 * ai - 1) ** 2))) if arch else 0)
        if abs(a) > w / 2:
            for yy in range(round(sill - h - 2), sill + 1):
                c.p(x, yy, frame[4 if a < 0 else 1])
            continue
        for yy in range(round(sill - top_h), sill + 1):
            v = (yy - (sill - top_h)) / max(1, top_h)
            col = paint(ai, v, yy <= sill - top_h + 1)
            if col:
                c.p(x, yy, col)
        if frame:
            c.p(x, round(sill - h - 2), frame[3]); c.p(x, round(sill - h - 1), frame[1])
    return (min(xs) + max(xs)) // 2 if xs else cx


def knot(c, cx, top, pal):
    """Straw gathered at a cone's apex and bound: the finial of every
    thatched round house."""
    for k, row in enumerate(('.#.#.', '#.#.#', '.###.', '.###.', '..#..')):
        for i, ch in enumerate(row):
            if ch == '#':
                c.p(cx - 2 + i, top + k, pal[4 if i < 2 else 2])
    c.rect(cx - 2, top + 3, 5, 1, PAL['wood'][1])


def poles_out(c, cx, top, n, spread, pal):
    """Poles crossing at a cone's smoke hole and fanning out above it."""
    for i in range(n):
        f = (i - (n - 1) / 2) / max(1, (n - 1) / 2)
        L = 9 + (i % 2) * 3
        for k in range(L):
            c.p(round(cx + f * spread * k / L), top - k, pal[3 if f < 0 else 1 if f > 0.3 else 2])


# --------------------------------------------------------------- props

def hurdle(c, x0, x1, gy, pal):
    """A run of woven wattle beside the house: stakes, rods over and under."""
    step = 1 if x1 > x0 else -1
    for x in range(x0, x1, step):
        n = abs(x - x0)
        lift = n // 6
        for row in range(3):
            y = gy - 3 - row * 3 - lift
            c.p(x, y, pal[3 if (x // 3 + row) % 2 else 1]); c.p(x, y + 1, pal[2])
        if n % 5 == 0:
            for yy in range(gy - 12 - lift, gy - lift + 1):
                c.p(x, yy, pal[2])
            c.p(x, gy - 13 - lift, pal[4])


def hitching(c, x0, x1, gy):
    """Two posts and the rope between them, for the horses."""
    w = PAL['wood']
    for px in (x0, x1):
        c.rect(px, gy - 14, 2, 14, w[2]); c.p(px, gy - 14, w[4])
    for x in range(x0, x1 + 1):
        t = (x - x0) / max(1, x1 - x0)
        c.p(x, round(gy - 12 + 2 * math.sin(t * math.pi)), PAL['rope'][2])


def fuel(c, x, gy):
    """Dung cakes stacked to dry: the steppe's firewood."""
    d = PAL['dung']
    for row in range(3):
        for i in range(3 - row):
            xx, yy = x + i * 6 + row * 3, gy - row * 3
            c.rect(xx, yy - 3, 6, 3, d[3]); c.rect(xx, yy - 3, 6, 1, d[5]); c.p(xx + 5, yy - 2, d[1])


def standard(c, x, gy):
    """A tall pole with a tuft of horsehair at the top, by the door."""
    w, hh = PAL['wood'], PAL['horsehair']
    c.rect(x, gy - 34, 1, 34, w[3]); c.rect(x + 1, gy - 34, 1, 34, w[1])
    for k in range(9):
        half = 1 + k // 3
        c.rect(x - half + 1, gy - 32 + k, half * 2, 1, hh[2 if k % 3 else 3])
    c.rect(x - 1, gy - 36, 4, 2, PAL['ochre'][4])


def rack(c, x, gy):
    """A drying rack: two forked poles, a rail, strips hung over it."""
    w = PAL['wood']
    for px in (x, x + 18):
        c.rect(px, gy - 20, 1, 20, w[3]); c.p(px - 1, gy - 21, w[3]); c.p(px + 1, gy - 21, w[3])
    c.rect(x, gy - 19, 19, 1, w[2])
    for k, xx in enumerate(range(x + 3, x + 17, 4)):
        c.rect(xx, gy - 18, 2, 7 + k % 2 * 2, PAL['meat'][3 - k % 2]); c.p(xx, gy - 18, PAL['meat'][4])


def hearth(c, x, gy):
    """A ring of hearthstones round the ash of the fire."""
    s, ash = PAL['stone'], PAL['ash']
    c.rect(x - 6, gy - 3, 13, 3, s[3]); c.rect(x - 6, gy - 3, 13, 1, s[4])
    c.rect(x - 3, gy - 3, 7, 2, ash[1])


def windbreak(c, x0, x1, gy):
    """A crescent of brush on the windward side."""
    br, leaf = PAL['branch'], PAL['brush']
    for x in range(x0, x1):
        u = (x - x0) / max(1, x1 - x0 - 1)
        hgt = int(9 + 3 * math.sin(u * math.pi))
        base = gy - int(3 * math.sin(u * math.pi))
        for k in range(hgt):
            n = int(h2(x, k, 29) * 12)
            c.p(x, base - k, br[1 + n % 3] if n % 3 == 0 else leaf[2 + (n % 4 == 0) - (k < 2)])
        if h2(x, 7, 3) < 0.33:
            c.p(x, base - hgt, leaf[4])


def gear(c, name, x, gy):
    w, s, br = PAL['wood'], PAL['stone'], PAL['branch']
    if name == 'coolamon':
        for i in range(-4, 5):
            c.p(x + i, gy, w[2]); c.p(x + i, gy - 1, w[4] if abs(i) > 2 else w[1])
    elif name == 'grindstone':
        for i in range(-4, 5):
            c.p(x + i, gy, s[2]); c.p(x + i, gy - 1, s[4])
        for i in range(-1, 2):
            c.p(x + i, gy - 2, s[5])
    elif name == 'spears':
        for k in range(26):
            c.p(x + k // 6, gy - k, br[3 if k % 4 else 2]); c.p(x + 2 + k // 5, gy - k, br[2])
    elif name == 'sled':
        c.rect(x, gy - 3, 22, 1, w[3]); c.rect(x, gy - 2, 22, 1, w[1])
        for k in range(0, 22, 4):
            c.rect(x + k, gy - 6, 3, 3, w[4 if k % 8 else 3])
        c.p(x - 1, gy - 4, w[3])
    elif name == 'kayak':
        for px in (x + 3, x + 22):
            c.rect(px, gy - 7, 4, 7, s[3]); c.rect(px, gy - 7, 4, 1, s[5])
        for xx in range(x - 3, x + 32):
            t = (xx - x + 3) / 35
            hh = max(1, round(3 * math.sin(t * math.pi)))
            c.rect(xx, gy - 8 - hh, 1, hh, PAL['hide'][3]); c.p(xx, gy - 8 - hh, PAL['hide'][5])
    elif name == 'pots':
        e = PAL['earth']
        for i, dx in enumerate((0, 7)):
            hh = 8 - i * 2
            for k in range(hh):
                half = round(3 * math.sin((k + 1) / (hh + 1) * math.pi)) + 1
                for j in range(-half, half):
                    c.p(x + dx + j, gy - k, e[4 if j < 0 else 2])
            c.rect(x + dx - 1, gy - hh, 2, 1, e[1])


def gear_at(c, s, cx, gy, R):
    left, right = round(cx - R - 4), round(cx + R + 4)
    base = gy + round(R * RY * 0.5)
    for i, g in enumerate(s['gear']):
        if g == 'hitching':
            hitching(c, left - 22, left - 4, base)
        elif g == 'fuel':
            fuel(c, right, base)
        elif g == 'standard':
            standard(c, left - 4, base)
        elif g == 'rack':
            rack(c, right, base)
        elif g == 'hearth':
            hearth(c, right + 8, base + 2)
        elif g == 'windbreak':
            windbreak(c, left - 24, left, base)
        elif g == 'hurdles':
            hurdle(c, round(cx - R * 0.55), 1, base + 4, PAL['wattle'])
            hurdle(c, round(cx + R * 0.55), c.w - 2, base + 4, PAL['wattle'])
        else:
            gear(c, g, (left - 14) if i % 2 == 0 else (right + 6), base)


# --------------------------------------------------------------- forms

APPLIQUE = ('##.###.#', '#..#.#..', '#.##.#.#', '#....#.#')


def ger(s):
    """The lattice tent: a drum of felt, slightly bellied, under a low
    cone of felt to the crown ring, roped round, an appliqué band at the
    head and foot of the wall in the household's colour."""
    W = s['W']
    R = W / 2 - 2
    hw = round(R * 0.74)
    rise = round(R * 0.6)
    crown = max(3, R * 0.15)
    felt, rope, acc = PAL[s['felt']], PAL['rope'], PAL[s['accent']]

    def radius(z):
        if z <= hw:
            return R * (1 + 0.035 * math.sin(math.pi * z / hw))
        t = (z - hw) / rise
        return crown + (R + 1.5 - crown) * (1 - t ** 1.25) ** 0.9

    ropes = [round(hw * k / (s['ropes'] + 1)) for k in range(1, s['ropes'] + 1)]

    def tex(x, u, z, k):
        if z <= hw:
            if s['bands'] and (z < 4 or hw - 5 <= z < hw - 0.5):
                j = int(z - (0 if z < 4 else hw - 5))
                col = int((u + 1) * R) % 8
                if 0 < j < 4 and APPLIQUE[j - 1][col] == '#':
                    return felt[min(5, k + 1)]
                return acc[k - 1]
            if any(abs(z - r) < 0.6 for r in ropes):
                return rope[k - 1]
            if any(abs(z - r - 1) < 0.6 for r in ropes):
                return felt[min(5, k + 1)]
            return k
        if z < hw + 1.2:
            return felt[max(0, k - 2)]
        t = (z - hw) / rise
        seam = ((u + 1) * 5 + t * 0.3) % 1 < 0.07
        return min(5, k + 1) - (1 if seam else 0)

    room = 26 if s['gear'] else 4
    c = C(round(2 * R + 2 * room + 6), round(hw + rise + R * RY + 30))
    cx, gy = c.w // 2, c.h - 4 - round(R * RY)
    turn(c, cx, gy, hw + rise, radius, felt, tex)
    top = round(gy - hw - rise)
    wood = PAL['wood']
    for x in range(round(cx - crown) - 1, round(cx + crown) + 2):
        c.p(x, top - 1, wood[4]); c.p(x, top, wood[2]); c.p(x, top + 1, wood[1])
    if s['urkh']:
        for k in range(3):
            c.rect(round(cx - crown) + k, top - 2 - k, round(crown) + 2, 1, felt[4 - k])
    if s['door'] == 'painted':
        dp = PAL[s['door_paint']]

        def paint(a, v, edge):
            if edge or a < 0.12 or a > 0.88 or v > 0.94:
                return dp[2] if a > 0.5 else dp[3]
            if abs(a - 0.5) < 0.06 or abs(v - 0.5) < 0.04:
                return dp[1]
            if 0.28 < v < 0.36 or 0.68 < v < 0.74:
                return dp[4] if a < 0.5 else dp[3]
            return dp[3] if a < 0.5 else dp[2]
    else:
        def paint(a, v, edge):
            if v < 0.16:
                return felt[5 if v < 0.06 else 3]
            if a < 0.08:
                return felt[2]
            return DARK if a > 0.2 else DOORWAY
    dw = max(10, round(R * 0.36))
    door_x = wall_door(c, cx, gy, R, s['door_at'], dw, hw - 4, paint, frame=wood)
    gear_at(c, s, cx, gy, R)
    return c, dict(x0=cx - R, W=2 * R, base=gy + round(R * RY), door_x=door_x, door_h=hw - 4, door_width=dw,
                   door_base=round(gy + RY * R * math.cos(s['door_at'])), leaf=s['door'] == 'painted',
                   smoke=[[cx, top - 4, 'vent']])


def shell(s):
    """A one-skin hut from the ground up: cone, dome, beehive, snowhouse or
    sod mound, in its covering, with its own kind of door."""
    W, form, cover = s['W'], s['form'], s['cover']
    pal = PAL[cover]
    R = W / 2 - 2
    H = {'cone': min(R * 2.15, 50 + R * 0.7), 'dome': R * 1.12, 'beehive': R * 1.5, 'snowhouse': R * 0.9,
         'sodhouse': R * 0.62}[form]

    def radius(z):
        t = z / H
        if form == 'cone':
            return max(0.6, R * (1 - t) * (1 + 0.05 * math.sin(math.pi * t)))
        if form == 'beehive':
            return R * max(0.0, 1 - t ** 2.4) ** 0.5
        if form == 'sodhouse':
            return R * max(0.0, 1 - t ** 1.8) ** 0.6
        return R * math.sqrt(max(0.0, 1 - t * t))

    cuts = {'cone': 3.0, 'dome': 4.2, 'beehive': 5.0, 'snowhouse': 5.5, 'sodhouse': 3.0}[form]

    def tex(x, u, z, k):
        t = z / H
        if cover == 'snow':
            row = int(t * cuts * 1.6)
            joint = (t * cuts * 1.6) % 1 < 0.14 or ((u + 1) * 3.2 + row * 0.37) % 1 < 0.06
            return k if joint else min(5, k + 1)
        if cover == 'sod':
            if t > 0.55:
                g = PAL['turf-grass']
                return g[min(5, k + (1 if h2(x // 3, int(z // 4), 5) > 0.88 else 0))]
            joint = (t * cuts * 2) % 1 < 0.16 or ((u + 1) * 4 + int(t * cuts * 2) * 0.5) % 1 < 0.06
            return k - 1 if joint else k
        lap = (t * cuts) % 1
        k2 = k
        if cover.startswith('felt'):
            if z < 4:
                return PAL[s.get('accent', 'door-red')][k - 1]
            if any(abs(t - r) < 0.025 for r in (0.3, 0.55)):
                return PAL['rope'][k - 1]
            return k2
        if cover in ('hide', 'hide-pale'):
            return k2 - 1 if ((u + 1) * 3.5) % 1 < 0.05 and t < 0.9 else k2
        if cover in ('bark-paper', 'bark-stringy'):
            row = int(t * cuts)
            if lap > 0.9:
                return k - 2
            if ((u + 1) * 3 + row * 0.5) % 1 < 0.06:
                return k - 1
            if cover == 'bark-paper' and h2(x, int(z), 3) > 0.93:
                return k - 2
            return k2 + (1 if lap < 0.1 else 0)
        if cover == 'mat':
            return k - 1 if lap > 0.84 else k + (1 if lap < 0.16 else 0)
        # Grass, brush and spinifex: strands down the slope, ragged at every lap.
        strand = int(h2(int((u + 1) * 11), int(t * cuts), 7) * 6)
        if lap > 0.86:
            k2 -= 2
        elif lap < 0.12:
            k2 += 1
        if strand == 0:
            k2 -= 1
        elif strand == 1 and lap < 0.6:
            k2 += 1
        if cover in ('brush', 'spinifex') and h2(x // 2, int(z // 3), 11) > 0.88:
            k2 += 1
        return k2

    room = 26 if s['gear'] else 4
    c = C(round(2 * R + 2 * room + 6), round(H + R * RY + (16 if form == 'cone' else 6) + 22))
    cx, gy = c.w // 2, c.h - 4 - round(R * RY)
    turn(c, cx, gy, H, radius, pal, tex)
    top = round(gy - H)
    smoke = []
    theta = s['door_at']
    base = gy + round(R * RY) + 2
    if form == 'cone':
        poles_out(c, cx, top + 3, 5, 6, PAL['wood'])
        for side in (-1, 1):
            for k in range(8):
                c.p(cx + side * (2 + k // 3), top + 4 + k, pal[3 if side < 0 else 1])
        smoke.append([cx, top - 2, 'vent'])
        dh = round(min(H * 0.34, 24))
        dw = max(9, round(R * 0.5))

        def paint(a, v, edge):
            # The door flap pinned back on the right.
            if a > 0.62 and v > (1 - a) * 1.6:
                return pal[5 if a < 0.72 else 4]
            return DARK if a > 0.14 else DOORWAY
        door_x = wall_door(c, cx, gy, R * 0.98, theta, dw, dh, paint, arch=dh * 0.45)
        for yy in range(round(gy - dh - 4), top + 12, -4):
            fr = (gy - yy) / H
            xx = round(cx + R * (1 - fr) * math.sin(theta))
            c.p(xx, yy, pal[1]); c.p(xx - 1, yy, PAL['wood'][4]); c.p(xx + 1, yy, PAL['wood'][2])
        if s.get('painted'):
            p = PAL['paint-red']
            for x in range(round(cx - R), round(cx + R)):
                y0 = round(ring_y(cx, gy - 8, R * 0.96, x))
                if c.g(x, y0)[3] and c.g(x, y0) not in (DARK, DOORWAY):
                    c.p(x, y0, p[3]); c.p(x, y0 - 1, p[2])
                    if x % 6 < 3:
                        c.p(x, y0 - 2 - x % 6, p[3])
    elif form == 'snowhouse':
        tw, tr = round(R * 0.52), round(R * 0.38)
        tx = round(cx + R * 0.9 * math.sin(theta))
        for x in range(tx - tw, tx + tw + 1):
            dx = (x + 0.5 - tx) / tw
            if abs(dx) > 1:
                continue
            hgt = round(tr * math.sqrt(1 - dx * dx))
            for yy in range(base - hgt, base + 1):
                joint = (base - yy) % 6 == 0 or (x - tx + (base - yy) // 6 * 3) % 8 == 0
                c.p(x, yy, pal[min(5, band(dx) + (0 if joint else 1))])
        for x in range(tx - 5, tx + 6):
            hh = round(10 * math.sqrt(max(0.0, 1 - ((x - tx) / 5.5) ** 2)))
            c.rect(x, base - hh, 1, hh + 1, DARK)
        wx, wy = cx - 4 - round(R * 0.2), top + round(H * 0.35)
        c.rect(wx, wy, 7, 5, (198, 226, 240, 255)); c.rect(wx, wy, 7, 1, (238, 248, 252, 255))
        door_x, dh = tx, 10
    elif form == 'sodhouse':
        tx = round(cx + R * math.sin(theta))
        pw, ph = 11, 15
        for x in range(tx - pw, tx + pw + 1):
            dx = (x - tx) / pw
            hgt = round(ph * math.sqrt(max(0.0, 1 - dx ** 4)))
            for yy in range(base - hgt, base + 1):
                grass = yy < base - hgt + 3
                c.p(x, yy, PAL['turf-grass'][band(dx)] if grass else PAL['sod'][band(dx) - 1])
        for x in range(tx - 5, tx + 6):
            hh = round(10 * math.sqrt(max(0.0, 1 - ((x - tx) / 5.5) ** 2)))
            c.rect(x, base - hh, 1, hh + 1, DARK)
        bone = PAL['shell']
        for side in (-1, 1):
            for k in range(13):
                c.p(tx + side * (6 - (k * k) // 40), base - k, bone[4 if side < 0 else 2])
        door_x, dh = tx, 10
    else:
        if form in ('dome', 'beehive'):
            smoke.append([cx, top + 3, 'vent'])
        dh = round(min(H * 0.7, 28))
        dw = max(12, round(R * 0.52))

        hang = PAL[s.get('curtain', 'hide')]
        side = 1 if theta < 0 else -1

        def paint(a, v, edge):
            # A hide hung in the doorway, drawn back to one side.
            aa = a if side > 0 else 1 - a
            if edge or a < 0.06 or a > 0.94:
                return pal[1]
            if aa > 0.5 - 0.25 * v:
                fold = int(aa * 9) % 3
                return hang[(4, 3, 2)[fold] - (1 if v > 0.9 else 0)]
            return DARK if aa > 0.14 else DOORWAY
        door_x = wall_door(c, cx, gy, R * 0.99, theta, dw, dh, paint, arch=dh * 0.5)
    if form in ('dome', 'beehive') and cover in ('bark-paper', 'bark-stringy', 'mat', 'grass'):
        # Binding poles bent round outside the cover to hold it down.
        for zz in (H * 0.32, H * 0.62):
            r = radius(zz)
            for x in range(round(cx - r), round(cx + r)):
                yy = round(ring_y(cx, gy - zz, r, x))
                q = c.g(x, yy)
                if q[3] and q not in (DARK, DOORWAY):
                    c.p(x, yy, PAL['branch'][2 if (x - cx) > r * 0.4 else 3])
    gear_at(c, s, cx, gy, R)
    sill = base - 2 if form in ('snowhouse', 'sodhouse') else round(gy + RY * R * math.cos(theta))
    return c, dict(x0=cx - R, W=2 * R, base=gy + round(R * RY), door_x=door_x, door_h=dh, smoke=smoke,
                   door_width=10 if form in ('snowhouse', 'sodhouse') else dw, door_base=sill)


def drum_hut(s):
    """A drum wall under a cone of thatch, ragged at its eave and bound at
    its apex: rondavel, roundhouse, pit house."""
    W, form = s['W'], s['form']
    R = W / 2 - 6
    wall_pal = PAL[s['wall']]
    th = PAL[s['thatch']]
    hw = {'rondavel': round(R * 0.62), 'roundhouse': round(R * 0.48), 'pit': round(R * 0.18)}[form]
    RR = R + 5
    rise = RR * {'rondavel': 0.82, 'roundhouse': 0.95, 'pit': 0.9}[form]
    room = 16 if s['gear'] else 4
    c = C(round(2 * RR + 2 * room + 6), round(hw + rise + RR * RY + 28))
    cx, gy = c.w // 2, c.h - 4 - round(RR * RY)
    stone = s['wall'] == 'stone'

    def wall_tex(x, u, z, k):
        if z < 3:
            return PAL['stone'][min(5, k) - (1 if (x // 4 + int(z)) % 2 else 0)]
        if stone:
            joint = z % 4 < 0.8 or (x + int(z // 4) * 3) % 7 == 0
            return k - 1 if joint else k
        if s['wall'] == 'wattle':
            if x % 7 == 0:
                return PAL['wood'][k - 1]
            return k + (1 if z % 3 < 1 else -1 if z % 3 > 2.2 else 0)
        if s.get('band') and abs(z - hw * 0.45) < 1.6:
            return PAL['paint-red'][k - 1]
        n = h2(x // 3, int(z // 4), s['seed'])
        return k + (-1 if n > 0.92 else 1 if n < 0.06 else 0)

    turn(c, cx, gy, hw, lambda z: R, wall_pal, wall_tex)
    if not stone and s['wall'] != 'whitewash':
        for a in range(-80, 81, 26):
            x = round(cx + R * math.sin(math.radians(a)))
            y1 = round(ring_y(cx, gy, R, x)) - 3
            for yy in range(y1 - hw + 6, y1):
                c.p(x, yy, PAL['wood'][2 if a < 0 else 1])
    eave = gy - hw

    def roof_tex(x, u, z, k):
        t = z / rise
        course = int(t * 5.2 + h2(x // 3, 3, 1) * 0.15)
        lap = (t * 5.2) % 1
        strand = int(h2(int((u + 1) * 9), course, 2) * 6)
        k2 = k + (-2 if lap > 0.86 else 1 if lap < 0.12 else 0) + (-1 if strand == 0 else 1 if strand == 1 and lap < 0.6 else 0)
        return k2 - (1 if t < 0.06 else 0)

    turn(c, cx, eave, rise, lambda z: max(0.5, RR * (1 - z / rise)), th, roof_tex)
    for x in range(round(cx - RR), round(cx + RR) + 1):
        y0 = round(ring_y(cx, eave, RR, x))
        hang = int(h2(x // 2, 5, 3) * 3)
        for k in range(hang + 1):
            c.p(x, y0 + k, th[2 if k < hang else 1])
        if abs(x + 0.5 - cx) < R:
            for k in range(2):
                q = c.g(x, y0 + hang + 1 + k)
                if q[3] and q in wall_pal:
                    c.p(x, y0 + hang + 1 + k, wall_pal[max(0, wall_pal.index(q) - 2 + k)])
    apex = round(eave - rise)
    knot(c, cx, apex - 4, th)
    theta = s['door_at']
    wood = PAL['wood']
    if form == 'pit':
        # The house is sunk; its door is a low porch of poles and thatch.
        px = round(cx + RR * 0.9 * math.sin(theta))
        base = gy + round(RR * RY)
        for x in range(px - 9, px + 10):
            dx = (x - px) / 9.5
            hgt = round(18 - 9 * abs(dx))
            for yy in range(base - hgt, base - hgt + 5):
                c.p(x, yy, th[band(dx) - (1 if yy == base - hgt + 4 else 0)])
            for yy in range(base - hgt + 5, base + 1):
                c.p(x, yy, DARK if abs(x - px) < 5 else wood[2 if x < px else 1])
        door_x, dh = px, 12
    else:
        dh = hw - 3
        dw = max(10, round(R * 0.34))

        def paint(a, v, edge):
            if a < 0.1:
                return wood[3]
            if a > 0.9:
                return wood[1]
            if v < 0.08:
                return wood[2]
            return DARK if a > 0.24 else DOORWAY
        door_x = wall_door(c, cx, gy, R, theta, dw, dh, paint)
        for x in range(door_x - dw // 2 - 3, door_x + dw // 2 + 4):
            y = round(ring_y(cx, gy, R, x)) + 1
            c.p(x, y, PAL['stone'][3]); c.p(x, y + 1, PAL['stone'][1])
    gear_at(c, s, cx, gy, R)
    return c, dict(x0=cx - R, W=2 * R, base=gy + round(RR * RY), door_x=door_x, door_h=dh,
                   door_width=10 if form == 'pit' else dw,
                   door_base=gy + round(RR * RY) if form == 'pit' else round(gy + RY * R * math.cos(theta)),
                   smoke=[[cx, apex - 4, 'vent']])


# --------------------------------------------------------------- long and square houses

def logs_wall(c, x0, y0, w, h, pal, ends=True):
    """Logs laid one on another, each round: lit along its top, dark in the
    joint below; the ends cross out past the corners, showing their rings."""
    d = 5
    for yy in range(y0, y0 + h):
        j = (yy - y0) % d
        k = (5, 4, 3, 3, 1)[j]
        for xx in range(x0, x0 + w):
            c.p(xx, yy, pal[k - (1 if h2(xx // 7, (yy - y0) // d, 4) > 0.85 and j in (1, 2) else 0)])
    if ends:
        for yy in range(y0, y0 + h, d):
            for ex in (x0 - 3, x0 + w - 1):
                c.rect(ex, yy, 4, d - 1, pal[3]); c.p(ex + 1, yy + 1, pal[5]); c.p(ex + 2, yy + 2, pal[1])


def eave_roof(c, x0, x1, eave, depth, pal, tex=None, hip=0.0):
    """A roof seen from above in front of its ridge: the front slope a band
    `depth` rows deep, its ends drawn in by `hip` per row; lit hip ends on
    the left, shaded on the right, the ridge lit along its top."""
    for j in range(depth):
        y = eave - j
        inset = round(j * hip)
        L, R = x0 + inset, x1 - inset
        for x in range(L, R):
            if hip and x - L < (depth - j) * hip * 0.7 and x < (x0 + x1) // 2:
                k = 5 if x - L < (depth - j) * hip * 0.7 - 2 else 4
            elif hip and R - x < (depth - j) * hip * 0.7 and x > (x0 + x1) // 2:
                k = 1
            else:
                k = 3
            if j == depth - 1:
                k = 5
            col = tex(x, j / depth, k) if tex else k
            c.p(x, y, pal[max(0, min(5, col))] if isinstance(col, int) else col)


def thatch_tex(courses=4, seed=0):
    """Thatch in courses, each lap's foot ragged and in shade, strands
    streaking down it."""
    def at(x, t, k):
        lap = (t * courses + h2(x // 2, 1, seed) * 0.1) % 1
        strand = int(h2(x, int(t * courses), seed) * 8)
        return k + (-1 if lap < 0.08 else 0) + (-1 if strand == 0 and lap < 0.6 else 1 if strand == 1 and lap > 0.4 else 0)
    return at


def ragged_eave(c, x0, x1, y, pal, seed=0):
    for x in range(x0, x1):
        hang = int(h2(x // 2, 9, seed) * 3)
        for k in range(hang + 1):
            c.p(x, y + 1 + k, pal[2 if k < hang else 1])


def plain_door(c, x, base, w, h, wood, curtain=None):
    """A doorway in a square wall: posts lit and shaded, a lintel, the dark
    inside, or a hide hung half across it."""
    c.rect(x - 2, base - h - 2, w + 4, 2, wood[4]); c.rect(x - 2, base - h - 1, w + 4, 1, wood[2])
    c.rect(x - 2, base - h, 2, h, wood[3]); c.rect(x + w, base - h, 2, h, wood[1])
    c.rect(x, base - h, w, h, DARK); c.rect(x, base - h, 2, h, DOORWAY)
    if curtain:
        for yy in range(base - h, base):
            v = (yy - base + h) / h
            for xx in range(x + round(w * (0.4 + 0.25 * v)), x + w):
                c.p(xx, yy, curtain[(4, 3, 2)[(xx - x) % 3]])


def winter(s):
    """A winter house: a low log cabin banked with earth, under a roof of
    sod growing grass, or of bark slabs held down by poles."""
    W = s['W']
    wood = PAL['log']
    hw, depth = 30, round(W * 0.2) + 6
    c = C(W + 30, hw + depth + 22)
    x0, base = 15, c.h - 4
    logs_wall(c, x0, base - hw, W, hw, wood)
    for xx in range(x0 - 2, x0 + W + 2):
        hh = 3 + int(h2(xx // 4, 1, 3) * 2)
        for yy in range(base - hh, base + 1):
            c.p(xx, yy, PAL['earth'][2 if yy == base - hh else 1])
    eave = base - hw - 1
    if s['roof'] == 'sod':
        g = PAL['sod']

        def tex(x, t, k):
            tuft = h2(x // 3, int(t * depth / 3), 2) > 0.84
            return k + (1 if tuft else 0) - (1 if t < 0.15 else 0)
        eave_roof(c, x0 - 4, x0 + W + 4, eave, depth, g, tex)
        for x in range(x0 - 4, x0 + W + 4):
            c.p(x, eave + 1, PAL['earth'][1]); c.p(x, eave, PAL['earth'][2])
            if h2(x, 3, 5) > 0.6:
                c.p(x, eave + 2, g[3])
    else:
        b = PAL['bark-stringy']

        def tex(x, t, k):
            return k - (1 if (x - x0) % 10 == 0 else 0) + (1 if (x - x0) % 10 == 1 else 0)
        eave_roof(c, x0 - 4, x0 + W + 4, eave, depth, b, tex)
        for t in (0.3, 0.7):
            c.rect(x0 - 6, eave - round(depth * t), W + 12, 2, PAL['wood'][3])
            c.rect(x0 - 6, eave - round(depth * t) + 2, W + 12, 1, PAL['wood'][1])
    op_cast(c, x0, base - hw, W, 3)
    dx = x0 + round(W * (0.28 if s['seed'] % 2 else 0.62))
    plain_door(c, dx, base - 2, 14, 24, PAL['wood'], PAL['hide'])
    wx = x0 + round(W * (0.7 if s['seed'] % 2 else 0.22))
    c.rect(wx - 1, base - hw + 7, 10, 8, PAL['wood'][2]); c.rect(wx, base - hw + 8, 8, 6, DARK)
    c.rect(wx, base - hw + 8, 4, 6, PAL['wood'][4])
    hx = x0 + W - 16
    hy = eave - depth + 4
    c.rect(hx, hy - 4, 8, 5, PAL['log'][3]); c.rect(hx, hy - 4, 8, 1, PAL['log'][5])
    c.rect(hx + 1, hy - 3, 6, 2, DARK); c.rect(hx + 7, hy - 4, 1, 5, PAL['log'][1])
    return c, dict(x0=x0, W=W, base=base, door_x=dx + 7, door_h=24, door_width=14, door_base=base - 2, smoke=[[hx + 4, hy - 6, 'vent']])


def op_cast(c, x, y, w, n):
    """Shade thrown down a wall from the eave above it."""
    for i in range(n):
        for xx in range(x, x + w):
            q = c.g(xx, y + i)
            if q[3]:
                c.p(xx, y + i, tuple(round(q[j] * (0.7 + 0.1 * i)) for j in range(3)) + (255,))


def barrel(c, x0, x1, top, base, pal, tex=None, round_ends=True):
    """A roof bent over in one arch, lying along the house: the front slope
    in shade below, lit along its crown; its ends rounded."""
    H = base - top
    L = x1 - x0
    cap = H * 0.9 if round_ends else 0
    for x in range(x0, x1):
        e = min(x - x0, x1 - 1 - x)
        lift = 0
        if cap and e < cap:
            f = 1 - e / cap
            lift = round(H * (1 - math.sqrt(max(0.0, 1 - f * f))))
        for y in range(top + lift, base):
            t = (y - top - lift) / max(1, base - top - lift)
            k = 5 if t < 0.12 else 4 if t < 0.35 else 3 if t < 0.7 else 2
            if cap and e < cap * 0.45:
                k = min(k, 4) if x < (x0 + x1) / 2 else max(1, k - 1)
            col = tex(x, t, k) if tex else k
            c.p(x, y, pal[max(0, min(5, col))] if isinstance(col, int) else col)


def longhouse(s):
    """An Iroquoian longhouse: elm bark lashed in sheets over bent saplings,
    the roof one arch along its length, a smoke hole over each pair of
    hearths, the door under a bark porch at one end of the long side."""
    W = s['W']
    bark = PAL['bark-stringy']
    wall, rise = 22, 26
    c = C(W + 20, wall + rise + 26)
    x0, base = 10, c.h - 4
    poles = (0.3, 0.62)

    def tex(x, t, k):
        if any(abs(t - p) < 0.05 for p in poles):
            return PAL['wood'][k]
        return k - (1 if (x - x0) % 17 == 0 or (t * 3) % 1 < 0.08 else 0)
    barrel(c, x0, x0 + W, base - wall - rise, base - wall + 2, bark, tex)
    for xx in range(x0 + 4, x0 + W - 4):
        for yy in range(base - wall, base):
            k = 3 if (xx - x0) % 17 else 1
            if (yy - base) % 11 == 0:
                k = 2
            c.p(xx, yy, bark[k])
    for yy in (base - wall + 5, base - 6):
        c.rect(x0 + 4, yy, W - 8, 1, PAL['wood'][4]); c.rect(x0 + 4, yy + 1, W - 8, 1, PAL['wood'][1])
    op_cast(c, x0 + 4, base - wall + 2, W - 8, 3)
    smoke = []
    n = max(2, W // 46)
    for k in range(n):
        hx = x0 + round((k + 0.5) * W / n)
        hy = base - wall - rise + 2
        c.rect(hx - 3, hy, 7, 2, DARK); c.rect(hx - 4, hy - 2, 9, 2, bark[4])
        smoke.append([hx, hy - 3, 'vent'])
    dx = x0 + round(W * (0.22 if s['seed'] % 2 else 0.74))
    plain_door(c, dx - 7, base, 14, 22, PAL['wood'], PAL['hide'])
    c.rect(dx - 10, base - 27, 20, 3, bark[4]); c.rect(dx - 10, base - 24, 20, 1, bark[1])
    return c, dict(x0=x0, W=W, base=base, door_x=dx, door_h=22, door_width=14, smoke=smoke)


def enkang(s):
    """A Maasai house: a low loaf of poles and sticks plastered with dung
    and mud, flat-topped, entered at one end through a short curved passage."""
    W = s['W']
    dung = PAL['dung'][1:] + [PAL['earth'][4]]
    top_h = 28
    c = C(W + 20, top_h + 26)
    x0, base = 10, c.h - 4

    def tex(x, t, k):
        return k + (1 if h2(x // 5, int(t * 5), 6) > 0.9 else 0)
    barrel(c, x0, x0 + W, base - top_h, base, dung, tex)
    px = x0 + (14 if s['seed'] % 2 else W - 30)
    barrel(c, px, px + 18, base - 18, base + 1, dung, tex)
    c.rect(px + 6, base - 11, 7, 11, DARK); c.p(px + 6, base - 11, dung[1])
    return c, dict(x0=x0, W=W, base=base, door_x=px + 9, door_h=11, door_width=7, smoke=[])


CREST = ('..######....',
         '.#RRRRRR#...',
         '#R.####.R#..',
         '#R#OOOO#R#..',
         '#R#O##O#R#..',
         '#R#OOOO#R#..',
         '#R.####.R#..',
         '.#RRRRRR#.#.',
         '..######.#R#',
         '.#R#.#R#.#R#',
         '.#R#.#R#..#.',
         '..#...#.....')


def plank_house(s):
    """A Northwest Coast house, gable to the beach: weathered cedar planks
    set between corner posts, a low plank roof, the lineage's crest painted
    across the front either side of the carved entrance pole."""
    W = s['W']
    cedar = PAL['cedar-grey' if s['seed'] % 2 else 'cedar']
    wall, rise, back = 40, 12, 14
    c = C(W + 20, wall + rise + back + 34)
    x0, base = 10, c.h - 4
    cx = x0 + W // 2
    eave = base - wall
    for j in range(back):
        for x in range(x0 - 3, x0 + W + 3):
            ry = eave - rise + abs(x - cx) * rise / (W / 2 + 3)
            c.p(x, round(ry) - j, cedar[(4 if x < cx else 2) + (1 if j == back - 1 else 0)])
    for x in range(x0, x0 + W):
        top = round(eave - rise + abs(x - cx) * rise / (W / 2))
        for y in range(top, base):
            k = 3 if (x - x0) % 8 else 1
            if (x - x0) % 8 == 1:
                k = 4
            c.p(x, y, cedar[k])
    for x in range(x0 - 3, x0 + W + 3):
        y = round(eave - rise + abs(x - cx) * rise / (W / 2 + 3))
        c.p(x, y, cedar[5]); c.p(x, y + 1, cedar[1])
    for px in (x0, x0 + W - 4):
        c.rect(px, eave - 2, 4, wall + 2, cedar[4]); c.rect(px + 3, eave - 2, 1, wall + 2, cedar[1])
    black, red = (38, 30, 34, 255), PAL['paint-red'][2]
    sc = 2
    cy0 = eave + 2
    for j, row in enumerate(CREST):
        for i, ch in enumerate(row):
            if ch in '#RO':
                col = black if ch == '#' else red if ch == 'R' else cedar[4]
                c.rect(cx + 7 + (len(row) - 1 - i) * sc, cy0 + j * sc, sc, sc, col)
                c.rect(cx - 7 - (len(row) - i) * sc, cy0 + j * sc, sc, sc, col)
    pw = 10
    ptop = eave - rise - 16
    for y in range(ptop, base):
        for x in range(cx - pw // 2, cx + pw // 2):
            c.p(x, y, cedar[4 if x < cx - 2 else 3 if x < cx + 2 else 2])
    for k, y in enumerate(range(ptop + 2, base - 22, 12)):
        c.rect(cx - 3, y + 2, 2, 2, black); c.rect(cx + 1, y + 2, 2, 2, black)
        c.rect(cx - 4, y + 6, 8, 1, red); c.rect(cx - pw // 2, y + 10, pw, 1, cedar[1])
    for y in range(base - 16, base):
        t = (y - base + 16) / 16
        half = round(4 * math.sqrt(max(0.0, 1 - (2 * t - 1) ** 2))) + (1 if t > 0.5 else 0)
        c.rect(cx - half, y, 2 * half, 1, DARK)
    return c, dict(x0=x0, W=W, base=base, door_x=cx, door_h=16, door_width=9, smoke=[[cx + W // 4, eave - rise - back + 2, 'vent']])


def maloca(s):
    """A maloca: a great roof of palm thatch on poles, nearly to the ground,
    its ends rounded and hipped, the door a dark gap in a low pole wall."""
    W = s['W']
    pal = PAL['palm']
    wall, depth = 16, round(W * 0.42)
    c = C(W + 24, wall + depth + 24)
    x0, base = 12, c.h - 4
    for x in range(x0 + 6, x0 + W - 6):
        k = (4, 3, 3, 1)[(x - x0) % 4]
        for y in range(base - wall, base):
            c.p(x, y, PAL['wood'][k])
    eave = base - wall
    eave_roof(c, x0 - 4, x0 + W + 4, eave, depth, pal, thatch_tex(6, s['seed']), hip=0.55)
    ragged_eave(c, x0 - 4, x0 + W + 4, eave, pal, s['seed'])
    op_cast(c, x0 + 6, eave + 3, W - 12, 3)
    dx = x0 + round(W * (0.3 if s['seed'] % 2 else 0.64))
    c.rect(dx, base - wall + 2, 16, wall - 2, DARK)
    return c, dict(x0=x0, W=W, base=base, door_x=dx + 8, door_h=wall - 2, door_width=16, smoke=[[x0 + W // 2, eave - depth + 2, 'vent']])


def chise(s):
    """An Ainu chise: walls of reed bundles, a steep hipped roof of grass in
    stepped tiers with a smoke vent at the ridge ends, the porch at the end."""
    W = s['W']
    reed, grass = PAL['reed'], PAL['grass']
    wall, depth = 24, round(W * 0.34) + 8
    porch = min(30, round(W * 0.4))
    c = C(W + porch + 20, wall + depth + 24)
    x0, base = porch + 6, c.h - 4
    for x in range(x0, x0 + W):
        k = (4, 3, 3, 2)[(x - x0) % 4]
        for y in range(base - wall, base):
            c.p(x, y, reed[k - (1 if (y - base) % 9 == 0 else 0)])
    eave = base - wall
    eave_roof(c, x0 - 5, x0 + W + 5, eave, depth, grass, thatch_tex(4, s['seed']), hip=0.5)
    ragged_eave(c, x0 - 5, x0 + W + 5, eave, grass, s['seed'])
    for side in (x0 + round(depth * 0.5), x0 + W - round(depth * 0.5) - 6):
        c.rect(side, eave - depth - 3, 6, 4, DARK); c.rect(side - 1, eave - depth - 4, 8, 1, grass[4])
    op_cast(c, x0, eave + 2, W, 3)
    c.rect(x0 + round(W * 0.6), base - wall + 6, 9, 7, DARK); c.rect(x0 + round(W * 0.6), base - wall + 6, 9, 1, reed[1])
    px = x0 - porch
    for x in range(px, x0):
        k = (4, 3, 3, 2)[(x - px) % 4]
        for y in range(base - 18, base):
            c.p(x, y, reed[k])
    eave_roof(c, px - 3, x0, base - 18, 10, grass, thatch_tex(2, s['seed'] + 1), hip=0.6)
    ragged_eave(c, px - 3, x0, base - 18, grass)
    dx = px + porch // 2 - 5
    plain_door(c, dx, base, 11, 15, PAL['wood'], PAL['mat'])
    return c, dict(x0=px, W=W + porch, base=base, door_x=dx + 5, door_h=15, door_width=11,
                   smoke=[[x0 + round(depth * 0.5) + 3, eave - depth - 5, 'vent']])


def ridge_tent(s):
    """A camp tent, gable to the front: canvas, hide or felt over a ridge
    pole, its slopes running back, a flap tied open, guy ropes to pegs."""
    W = s['W']
    pal = PAL[s['cover']]
    rise, back = round(W * 0.7), 8
    c = C(W + 24, rise + back + 12)
    x0, base = 12, c.h - 4
    cx = x0 + W // 2
    for j in range(back):
        for x in range(x0, x0 + W + 1):
            dx = x - cx
            y = round(base - rise + abs(dx) * rise / (W / 2)) - j
            c.p(x, y, pal[(4 if dx < 0 else 2) + (1 if j == back - 1 else 0)])
    for y in range(base - rise, base):
        half = (y - base + rise) * (W / 2) / rise
        for x in range(round(cx - half), round(cx + half) + 1):
            c.p(x, y, pal[4 if x < cx - half * 0.4 else 3 if x < cx + half * 0.5 else 2])
    side = 1 if s['seed'] % 2 else -1
    dh = round(rise * 0.62)
    for y in range(base - dh, base):
        half = (y - base + dh) * 6 / dh
        for x in range(round(cx - half), round(cx + half) + 1):
            c.p(x, y, DARK)
        fx = round(cx + side * (half + 1))
        for k in range(round(half * 0.8) + 1):
            c.p(fx + side * k, y, pal[5 if side < 0 else 4])
    for i in range(3):
        c.p(cx, base - rise - 1 - i, PAL['wood'][3])
    for sgn in (-1, 1):
        ax, ay = cx + sgn * round(W * 0.25), base - round(rise * 0.5)
        gx = cx + sgn * (W // 2 + 9)
        for k in range(abs(gx - ax)):
            c.p(ax + sgn * k, round(ay + (base - ay) * k / abs(gx - ax)), PAL['rope'][3])
        c.rect(gx, base - 2, 1, 3, PAL['wood'][2])
    return c, dict(x0=x0, W=W, base=base, door_x=cx, door_h=dh, door_width=12, smoke=[])


def cart(s):
    """A felt tent lashed to a wagon bed, as the camps moved it: two big
    wheels, the shaft out to one side for the oxen."""
    W = s['W']
    tent = BUILDERS['ger'](dict(W=W - 22, felt=s['felt'], accent=s['accent'], door='flap', door_at=0.25,
                                ropes=1))
    wood = PAL['wood']
    c = C(W + 40, tent.height + 18)
    base = c.h - 3
    cx = c.w // 2
    bed_y = base - 16
    c.rect(cx - W // 2 + 6, bed_y - 4, W - 12, 4, wood[3]); c.rect(cx - W // 2 + 6, bed_y - 4, W - 12, 1, wood[5])
    c.rect(cx - W // 2 + 6, bed_y, W - 12, 2, wood[1])
    c.im.alpha_composite(tent, (cx - tent.width // 2, bed_y - tent.height + 2))
    for k in range(18):
        c.p(cx - W // 2 + 6 - k, bed_y - 1 + k // 4, wood[3]); c.p(cx - W // 2 + 6 - k, bed_y + k // 4, wood[1])
    for wx in (cx - W // 2 + 18, cx + W // 2 - 18):
        R = 10
        for yy in range(-R, R + 1):
            for xx in range(-R, R + 1):
                d = math.hypot(xx, yy)
                if R - 2 <= d <= R:
                    c.p(wx + xx, base - R + yy, wood[4 if xx + yy < 0 else 1])
                elif d < 2:
                    c.p(wx + xx, base - R + yy, wood[2])
        for k in range(6):
            a = k * math.pi / 3
            for t in range(2, R - 1):
                c.p(round(wx + math.cos(a) * t), round(base - R + math.sin(a) * t), wood[3])
    return c, dict(x0=cx - W // 2 + 6, W=W - 12, base=base, door_x=cx, door_h=20, door_width=10,
                   smoke=[[cx, bed_y - tent.height + 6, 'vent']])


def built(fn, defaults):
    def make(spec=None, info=None):
        s = dict(seed=0, gear=(), door_at=0.3)
        s.update(defaults)
        s.update(spec or {})
        c, i = fn(s)
        # Curtains, flaps and tunnels: no hinged leaf for the game to swing.
        i.setdefault('leaf', False)
        finish(c)
        consolidate(c, rare=3)
        if info is not None:
            info.update(i)
        return c.im
    return make


BUILDERS = {
    'ger': built(ger, dict(W=70, felt='felt-white', accent='blue', bands=True, ropes=2, door='painted',
                           door_paint='door-red', urkh=True)),
    'shell': built(shell, dict(W=50, form='dome', cover='grass')),
    'drum': built(drum_hut, dict(W=72, form='rondavel', wall='mud', thatch='straw')),
    'winter': built(winter, dict(W=80, roof='sod')),
    'longhouse': built(longhouse, dict(W=200)),
    'enkang': built(enkang, dict(W=70)),
    'plank-house': built(plank_house, dict(W=120)),
    'maloca': built(maloca, dict(W=150)),
    'chise': built(chise, dict(W=80)),
    'ridge-tent': built(ridge_tent, dict(W=40, cover='canvas')),
    'cart': built(cart, dict(W=70, felt='felt-white', accent='blue')),
}
STEPPE_GEAR = {'fuel': 'fuel', 'hitching': 'hitching', 'rack': 'rack', 'standard': 'standard'}
FORAGER_GEAR = ('coolamon', 'grindstone', 'spears', 'kayak', 'sled')
THATCHES = ('straw', 'straw-old', 'reed', 'turf-grass')


def spec_for(name, r):
    """The builder and spec for a hut, tent or lodge frame, or None. The
    recipe's own data picks the form, covering, colours and gear, seeded by
    the recipe so a camp's tents differ."""
    fw, fh = r['footprint']
    rng = random.Random(r.get('seed', 0) * 31 + 7)
    tier = r.get('wealthTier', 1)
    side = rng.choice((-1, 1))
    door_at = side * rng.uniform(0.18, 0.4)
    base = dict(seed=r.get('seed', 0) % 997, door_at=round(door_at, 2))
    if r.get('steppe'):
        st = r['steppe']
        tiered = lambda k: st[k][min(tier, len(st[k]) - 1)]
        felt = rng.choice(tiered('felts'))
        accent = rng.choice(st.get('appliqueColours') or ['door-red'])
        plan = r.get('steppePlan')
        if plan == 'winter':
            return 'winter', dict(base, W=fw * 16 - 4, roof=rng.choice(st.get('winterRoofs') or ['sod']))
        if plan == 'cart':
            return 'cart', dict(base, W=fw * 16 + 6, felt=felt, accent=accent)
        gear = tuple(STEPPE_GEAR[e] for e in st.get('extras', []) if e in STEPPE_GEAR and rng.random() < 0.15 + 0.1 * tier)[:2]
        form = rng.choice(st.get('tentForms') or ['ger'])
        W = fw * 16 + 6
        if form == 'ger':
            door = rng.choice(tiered('doors'))
            return 'ger', dict(base, W=W, felt=felt, accent=accent, door=door, door_paint='door-red',
                               bands=tier >= 1 or rng.random() < 0.4, ropes=rng.choice(st.get('ropeBands') or [2]),
                               urkh=tier >= 1, gear=gear)
        cover = 'bark-paper' if form == 'cone' and st.get('coneCover') == 'bark' else felt
        return 'shell', dict(base, W=W - (8 if form == 'cone' else 0), form=form, cover=cover, accent=accent,
                             curtain='felt-brown', gear=gear)
    if r.get('forager'):
        fg = r['forager']
        form = rng.choice(fg['forms'])
        gear = tuple(g for g in fg.get('gear', []) if g in FORAGER_GEAR and rng.random() < 0.6)[:1]
        if fg.get('windbreak') and rng.random() < 0.6:
            gear = ('windbreak',) + gear
        elif form not in ('snowhouse', 'sodhouse') and rng.random() < 0.5:
            gear = gear + ('hearth',)
        return 'shell', dict(base, W=fw * 16 + 6, form=form, cover=rng.choice(fg['covers']), gear=gear[:2])
    lodge = r.get('lodge')
    if lodge:
        kind = {'plank': 'plank-house', 'maloca': 'maloca', 'enkang': 'enkang', 'longhouse': 'longhouse',
                'chise': 'chise'}.get(lodge.get('form'))
        if kind:
            return kind, dict(base, W=fw * 16 - (20 if kind == 'chise' else 8))
        return None
    style = r.get('campStyle')
    if style:
        W = fw * 16 - 16
        if style in ('canvas', 'leather'):
            return 'ridge-tent', dict(base, W=W, cover='canvas' if style == 'canvas' else 'hide')
        if style == 'felt':
            return 'ger', dict(base, W=W - 8, felt='felt-grey', accent='blue', door='flap', urkh=False)
        if style == 'dome':
            return 'shell', dict(base, W=W, form='dome', cover='expedition', curtain='expedition')
        return 'shell', dict(base, W=W - 10, form='cone', cover='brush')
    form = r.get('round')
    if not form:
        return None
    covers = r.get('covers')
    treat = rng.choice(r.get('surfaceTreatments') or ['plain'])
    W = fw * 16 - 6
    if form == 'tent':
        return 'shell', dict(base, W=W, form='cone', cover=rng.choice(('hide', 'hide-pale')), painted=treat == 'ochre',
                             gear=('hearth',) if rng.random() < 0.5 else ())
    if form == 'dome':
        return 'shell', dict(base, W=W, form='dome', cover=rng.choice(('bark-stringy', 'mat', 'grass')))
    thatch = THATCHES[rng.choice(covers) if covers else rng.randrange(3)]
    if form == 'pit':
        return 'drum', dict(base, W=W, form='pit', wall='earth', thatch=thatch)
    if name.startswith('house-rondavel'):
        wall = 'whitewash' if treat == 'whitewash-band' else 'mud'
        return 'drum', dict(base, W=W, form='rondavel', wall=wall, thatch=thatch, band='red' if treat == 'ochre-band' else None)
    wall = 'stone' if name.startswith('house-round-stone') else 'wattle'
    return 'drum', dict(base, W=W, form='roundhouse', wall=wall, thatch=thatch,
                        gear=('hurdles',) if rng.random() < 0.6 else ())


def door_cell(kind, spec, fw):
    """The footprint column under the door this spec paints: the frame's
    entrance, so the walkable doorway and any camp path meet the drawn one."""
    info = {}
    BUILDERS[kind](spec, info)
    left = info['x0'] + info['W'] / 2 - fw * 8
    return max(0, min(fw - 1, int((info['door_x'] - left) // 16)))


STUDIES = [
    ('ger-mongol', 'ger', dict(W=76, gear=('hitching', 'fuel'), door_at=0.22)),
    ('ger-turkic', 'ger', dict(W=64, felt='felt-grey', accent='door-red', door='flap', door_at=-0.3,
                               gear=('standard',))),
    ('felt-dome', 'shell', dict(W=58, form='dome', cover='felt-brown', door_at=0.35)),
    ('chum', 'shell', dict(W=44, form='cone', cover='bark-paper', door_at=0.4, gear=('rack',))),
    ('tipi', 'shell', dict(W=46, form='cone', cover='hide-pale', door_at=-0.35, painted=True)),
    ('house-tent', 'shell', dict(W=50, form='cone', cover='hide', door_at=0.3, gear=('hearth',))),
    ('wigwam', 'shell', dict(W=56, form='dome', cover='bark-paper', door_at=-0.3, gear=('pots',))),
    ('mat-house', 'shell', dict(W=52, form='dome', cover='mat', door_at=0.3)),
    ('san', 'shell', dict(W=40, form='beehive', cover='grass', door_at=0.25, gear=('hearth', 'spears'))),
    ('bark-shelter', 'shell', dict(W=50, form='dome', cover='bark-stringy', door_at=-0.25, gear=('coolamon',))),
    ('spinifex', 'shell', dict(W=50, form='dome', cover='spinifex', door_at=0.3, gear=('windbreak', 'grindstone'))),
    ('wickiup', 'shell', dict(W=46, form='cone', cover='brush', door_at=-0.3)),
    ('snowhouse', 'shell', dict(W=60, form='snowhouse', cover='snow', door_at=0.3, gear=('sled',))),
    ('sodhouse', 'shell', dict(W=66, form='sodhouse', cover='sod', door_at=-0.3, gear=('kayak',))),
    ('rondavel', 'drum', dict(W=64, wall='mud', thatch='straw', band='red', door_at=0.25)),
    ('roundhouse', 'drum', dict(W=84, form='roundhouse', wall='wattle', thatch='straw-old', door_at=-0.2,
                                gear=('hurdles',))),
    ('roundhouse-stone', 'drum', dict(W=78, form='roundhouse', wall='stone', thatch='reed', door_at=0.3)),
    ('rondavel-white', 'drum', dict(W=60, wall='whitewash', thatch='straw-old', door_at=-0.28)),
    ('pit', 'drum', dict(W=74, form='pit', wall='earth', thatch='straw-old', door_at=0.3)),
    ('cart', 'cart', dict(W=70)),
    ('winter-sod', 'winter', dict(W=84)),
    ('winter-bark', 'winter', dict(W=70, roof='bark', seed=1)),
    ('enkang', 'enkang', dict(W=72)),
    ('longhouse', 'longhouse', dict(W=210)),
    ('plank-house', 'plank-house', dict(W=124)),
    ('maloca', 'maloca', dict(W=150)),
    ('chise', 'chise', dict(W=80)),
    ('tent-canvas', 'ridge-tent', dict(W=40)),
    ('tent-leather', 'ridge-tent', dict(W=42, cover='hide', seed=1)),
]


def sheet(names, out):
    from PIL import Image
    from art.reference import current_adult
    ims = [BUILDERS[k](sp) for n, k, sp in STUDIES if not names or n in names]
    a = current_adult()
    rows, row, w = [], [], 0
    for im in ims:
        if w + im.width > 640 and row:
            rows.append(row); row, w = [], 0
        row.append(im); w += im.width + 4
    rows.append(row)
    W = max(sum(i.width + 4 for i in r) for r in rows) + a.width + 10
    H = sum(max(i.height for i in r) + 6 for r in rows)
    bg = Image.new('RGBA', (W, H), (146, 160, 116, 255))
    y = 0
    for r in rows:
        h = max(i.height for i in r)
        x = 4
        for im in r:
            bg.alpha_composite(im, (x, y + h - im.height)); x += im.width + 4
        bg.alpha_composite(a, (x, y + h - 6 - a.height))
        y += h + 6
    bg.resize((W * 3, H * 3), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    sheet(sys.argv[2:], sys.argv[1] if len(sys.argv) > 1 else 'artifacts/huts/sheet.png')
