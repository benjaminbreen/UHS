"""Plaza furniture of Europe and of the Soviet city. See plaza.py."""
import math

from art.city_kit import text, SLATE
from art.props_b.plaza import (C, outline, sphere, mix, after, disc, drum, box, wheel, parasol, legs,
                               IRON, GREEN, OAK, LIME, LEAF, BARK, RED, GOLD, CREAM, NAVY, WATER,
                               STEEL, CONCRETE, BRASS, WHITE, BLUE, YELLOW, ORANGE, PINK, CLAY)

PINE = ['#3a2410', '#5e3c1c', '#8a5c2c', '#b07e40', '#d0a05c', '#e8c484']
ZINC = ['#1e2a34', '#34444e', '#506670', '#728a90', '#98aeb0', '#c4d4d0']
GREYBLUE = ['#1c2838', '#30445a', '#4c6680', '#6e8aa2', '#98b0c2', '#c8d8e0']


def taper(c, cx, y0, y1, r0, r1, ramp, hi=None, curve=1.0):
    """A turned body from half-width r0 at y0 to r1 at y1, lit from the left."""
    hi = len(ramp) - 1 if hi is None else hi
    for y in range(int(y0), int(y1) + 1):
        t = ((y - y0) / max(1, y1 - y0)) ** curve
        half = r0 + (r1 - r0) * t
        for x in range(int(round(cx - half)), int(round(cx + half))):
            f = (x + .5 - cx + half) / (2 * half)
            k = hi - (2 if f < 0.12 else 1 if f < 0.42 else 2 if f < 0.68 else 3 if f < 0.88 else 4)
            c.px(x, y, ramp[max(0, k)])


def dome(c, cx, base, r, h, ramp, hi=None):
    hi = len(ramp) - 1 if hi is None else hi
    for y in range(int(base - h), int(base) + 1):
        half = r * math.sqrt(max(0, 1 - ((base - y) / h) ** 2))
        for x in range(int(round(cx - half)), int(round(cx + half))):
            f = (x + .5 - cx + half) / (2 * half + .01)
            up = (base - y) / h
            k = hi - (2 if f < 0.1 else 0 if f < 0.4 and up > 0.35 else 1 if f < 0.5 else 2 if f < 0.75 else 3)
            c.px(x, y, ramp[max(0, k)])


def wallace(v=0, frame=0):
    """The Paris drinking fountain: four caryatids carrying a scaled dome."""
    G = GREEN
    c = C(26, 62)
    b, cx = 60, 13
    drum(c, cx, b - 6, b - 2, 11, 3, G, hi=4)
    drum(c, cx, b - 18, b - 7, 7, 2.2, G, top=False, hi=4)
    for x in (cx - 4, cx + 2):
        c.rect(x, b - 15, x + 1, b - 9, G[2])
    disc(c, cx, b - 20, 9, 2.6, G, thick=1, hi=5)
    c.ellipse(cx, b - 20, 6, 1.6, WATER[2])
    c.hl(cx - 3, cx, b - 21, WATER[4])
    for x, tone in ((cx - 3, 1), (cx + 2, 1)):
        c.rect(x, b - 38, x + 1, b - 22, G[tone])
    for x in (cx - 8, cx + 5):
        c.rect(x, b - 33, x + 2, b - 21, G[4])
        c.vl(x, b - 33, b - 21, G[5])
        c.vl(x + 2, b - 33, b - 21, G[2])
        c.rect(x - 1, b - 27, x + 3, b - 21, G[3])
        c.vl(x - 1, b - 27, b - 21, G[5])
        c.rect(x, b - 37, x + 2, b - 35, G[5])
        c.px(x + 2, b - 35, G[3])
        c.px(x - 1, b - 38, G[4])
        c.px(x + 3, b - 38, G[4])
    drum(c, cx, b - 40, b - 38, 9, 2.4, G, top=False, hi=5)
    c.hl(cx - 9, cx + 8, b - 40, G[5])
    dome(c, cx, b - 41, 9, 9, G, hi=5)
    for y in range(b - 48, b - 41, 2):
        for x in range(cx - 7 + (y % 4) // 2, cx + 8, 4):
            if c.get(x, y)[3]:
                c.px(x, y, G[2])
    c.rect(cx - 1, b - 55, cx, b - 50, G[3])
    c.px(cx - 1, b - 55, G[5])
    c.hl(cx - 2, cx + 1, b - 52, G[4])
    c.rect(cx - 1, b - 58, cx, b - 56, G[4])
    c = after(outline(c.im))
    for y in range(b - 37, b - 21):
        c.px(cx - 1, y, WATER[5] if (y - frame) % 4 else WATER[3])
    c.px(cx - 3 + frame, b - 21, WATER[5])
    c.px(cx + 3 - frame, b - 20, WATER[4])
    return c.im


def awning(c, x0, x1, y, d, stripes, drop=3, w=3):
    """A flat striped awning seen from above: top face d rows, valance below."""
    for k in range(d):
        dx = round((d - k) * 2 / d)
        for x in range(x0 + dx, x1 + dx + 1):
            ramp = stripes[((x - dx - x0) // w) % 2]
            c.px(x, y - d + k, ramp[3 if k < d - 1 else 2])
    for x in range(x0, x1 + 1):
        ramp = stripes[((x - x0) // w) % 2]
        for k in range(drop - (1 if (x - x0) % w == w - 1 else 0)):
            c.px(x, y + k, ramp[2 if k == 0 else 1])


def gelato(v=0):
    """An ice-cream tricycle: the tub box in front under a striped canopy."""
    c = C(52, 50)
    b = 48
    wheel(c, 40, b - 7, 7, IRON, STEEL, 10)
    c.rect(26, b - 14, 39, b - 13, RED[1])
    c.hl(26, 39, b - 14, RED[3])
    for i in range(8):
        c.rect(33 + i // 2, b - 21 + i, 34 + i // 2, b - 21 + i, RED[2])
    c.rect(32, b - 24, 38, b - 22, OAK[1])
    c.hl(32, 37, b - 24, OAK[3])
    c.rect(27, b - 27, 28, b - 14, STEEL[3])
    c.hl(25, 31, b - 28, IRON[2])
    c.hl(25, 31, b - 27, IRON[1])
    for x in (3, 23):
        c.rect(x, b - 44, x + 1, b - 26, WHITE[3])
        c.vl(x, b - 44, b - 26, WHITE[5])
    box(c, 2, b - 21, 24, b - 6, 5, WHITE, lean=2)
    c.rect(3, b - 16, 23, b - 12, PINK[3])
    c.hl(3, 23, b - 16, PINK[4])
    c.hl(3, 23, b - 11, BLUE[4])
    for x in (8, 17):
        c.ellipse(x + 1.5, b - 23.5, 3.5, 1.5, STEEL[5])
        c.hl(x, x + 2, b - 23, STEEL[3])
        c.px(x + 1, b - 25, STEEL[2])
    wheel(c, 13, b - 5, 5.5, IRON, STEEL, 10)
    awning(c, 1, 25, b - 44, 5, [RED, CREAM + CREAM[-1:]])
    return outline(c.im)


def chestnuts(v=0, frame=0):
    """A chestnut roaster: an iron drum stove on wheels, the pan on top, cones ready."""
    c = C(36, 50)
    b, cx = 48, 16
    c.rect(26, b - 40, 28, b - 20, IRON[2])
    c.vl(26, b - 40, b - 20, IRON[3])
    c.rect(25, b - 43, 29, b - 41, IRON[2])
    c.hl(25, 29, b - 43, IRON[3])
    for x in (cx - 8, cx + 7):
        wheel(c, x, b - 3, 3.5, IRON, IRON, 0)
    DARK = ['#0f0e19', '#1d1d2e', '#2f3045', '#484a62', '#62657c', '#8486a0']
    drum(c, cx, b - 22, b - 7, 11, 3.4, DARK, top=False)
    c.rect(cx - 4, b - 14, cx + 2, b - 8, '#3a1408')
    c.rect(cx - 3, b - 13, cx + 1, b - 9, ORANGE[2 + frame % 2])
    c.rect(cx - 2, b - 11, cx, b - 9, ORANGE[4])
    c.px(cx - 2 + (frame + 1) % 3, b - 10, YELLOW[5])
    c.px(cx - 3 + frame, b - 12, ORANGE[5])
    c.hl(cx - 10, cx + 9, b - 17, DARK[1])
    disc(c, cx, b - 23, 12, 3.8, DARK, thick=1)
    c.ellipse(cx, b - 23, 10, 2.8, OAK[1])
    for i in range(16):
        x = cx - 8 + (i * 7) % 17
        y = b - 25 + (i * 5) % 4
        if c.get(x, y)[:3] == mix(OAK[1], OAK[1], 0)[:3]:
            c.px(x, y, OAK[4])
            c.px(x + 1, y, OAK[3])
            if i % 3 == 0:
                c.px(x, y, CREAM[1])
    c.rect(29, b - 20, 34, b - 19, OAK[4])
    c.hl(29, 34, b - 18, OAK[2])
    c.rect(33, b - 18, 34, b - 6, OAK[2])
    for x in (30, 33):
        for k in range(5):
            c.hl(x - k // 2, x + k // 2 - (0 if k else 0), b - 21 - k, WHITE[4] if x == 30 else WHITE[3])
    c.rect(1, b - 20, 5, b - 19, IRON[2])
    c = after(outline(c.im))
    # Smoke leaves the cap and thins as it climbs; one puff per loop.
    for k, (dx, dy) in enumerate(((0, 0), (1, -1), (1, -2), (0, -3))):
        j = (k - frame) % 4
        c.px(27 + dx, b - 45 + dy + 0, ['#d8d4d0', '#b8b4b4', '#989498', None][j] or '#787478')
    return c.im


def beer_table(v=0):
    """A beer-garden set: folding trestle table and two plank benches."""
    c = C(54, 34)
    b = 32
    W = ORANGE if v else PINE
    box(c, 5, b - 25, 45, b - 24, 3, PINE, lean=2)
    legs(c, (8, 41), b - 23, b - 15, IRON, 2)
    for x in (9, 41):
        c.rect(x, b - 18, x + 1, b - 6, IRON[1])
        c.rect(x - 3, b - 6, x + 4, b - 6, IRON[2])
    c.hl(11, 40, b - 10, IRON[1])
    box(c, 2, b - 20, 48, b - 18, 5, PINE, lean=3)
    for x in range(10, 48, 9):
        c.px(x, b - 22, PINE[3])
        c.px(x + 4, b - 24, PINE[3])
    c.hl(4, 49, b - 23, PINE[4])
    for x, foam in ((14, 1), (30, 1)):
        c.rect(x, b - 27, x + 3, b - 23, '#d09a28')
        c.vl(x, b - 27, b - 23, '#f0c858')
        c.rect(x, b - 28, x + 3, b - 27, WHITE[5])
        c.px(x + 4, b - 26, WHITE[3])
        c.px(x + 4, b - 24, WHITE[3])
    legs(c, (7, 43), b - 8, b, IRON, 2)
    box(c, 4, b - 10, 46, b - 9, 3, PINE, lean=2)
    return outline(c.im)


def street_clock(v=0, frame=0):
    """A two-faced street clock on a cast-iron post."""
    G = [IRON + ['#62657c', '#8486a0'], GREEN][v]
    c = C(26, 66)
    b, cx = 64, 12
    drum(c, cx, b - 4, b - 1, 6, 2, G, hi=4)
    drum(c, cx, b - 12, b - 5, 4, 1.4, G, top=False, hi=4)
    c.hl(cx - 5, cx + 4, b - 12, G[4])
    c.rect(cx - 2, b - 44, cx + 1, b - 13, G[2])
    c.vl(cx - 2, b - 44, b - 13, G[4])
    c.vl(cx + 1, b - 44, b - 13, G[1])
    for y in (b - 20, b - 36):
        c.hl(cx - 3, cx + 2, y, G[4])
    for s in (-1, 1):
        for i in range(4):
            c.px(cx + s * (3 + i) - (0 if s > 0 else 1), b - 44 - i, G[3])
    c.ellipse(cx + 3, b - 53, 9, 9, G[1])
    c.ellipse(cx, b - 53, 9.5, 9.5, G[3])
    c.ellipse(cx, b - 53, 7.5, 7.5, CREAM[2])
    c.ellipse(cx + 1, b - 52, 6, 6, '#fbf6e6')
    for a in range(12):
        x = cx + 6.3 * math.sin(a * math.pi / 6) - .5
        y = b - 53 - 6.3 * math.cos(a * math.pi / 6) - .5
        c.px(round(x), round(y), G[1])
    c.rect(cx - 1, b - 65, cx, b - 63, G[3])
    c.px(cx - 1, b - 66, GOLD[2])
    c = after(outline(c.im))
    for i in range(5):
        c.px(cx - 1, b - 54 - i, INK)
    for i in range(4):
        c.px(cx + i, b - 53 + i // 2, INK)
    sx, sy = ((0, -1), (1, 0), (0, 1), (-1, 0))[frame]
    for i in range(1, 6):
        c.px(cx - (sx < 0) + sx * i, b - 53 - (sy < 0) + sy * i, RED[2])
    return c.im


INK = '#1d1d2e'


def pump(v=0, frame=0):
    """A cast-iron street pump over a stone trough."""
    G = GREEN
    c = C(34, 46)
    b, cx = 44, 21
    drum(c, cx, b - 6, b - 2, 6, 2, G, top=False, hi=4)
    drum(c, cx, b - 32, b - 7, 4, 1.4, G, top=False, hi=5)
    for y in (b - 12, b - 24):
        c.hl(cx - 5, cx + 4, y, G[4])
        c.hl(cx - 5, cx + 4, y + 1, G[1])
    dome(c, cx, b - 32, 5, 5, G, hi=5)
    c.rect(cx - 1, b - 41, cx, b - 38, G[3])
    sphere(c, cx - .5, b - 42, 1.8, GOLD)
    c.rect(cx - 9, b - 22, cx - 4, b - 21, G[3])
    c.hl(cx - 9, cx - 4, b - 22, G[5])
    c.rect(cx - 10, b - 21, cx - 9, b - 19, G[3])
    for i in range(10):
        c.rect(cx + 4 + i // 2, b - 30 + i, cx + 5 + i // 2, b - 30 + i, G[2])
    c.rect(cx + 8, b - 21, cx + 10, b - 19, G[3])
    box(c, 1, b - 9, 16, b - 1, 5, LIME, lean=2, hi=5)
    for k in range(3):
        c.hl(4 + (k < 1), 15 + (k < 2), b - 13 + k, WATER[2])
    c.hl(6, 10, b - 12, WATER[4])
    c = after(outline(c.im))
    for y in range(b - 18, b - 12):
        c.px(cx - 10, y, WATER[5] if (y - frame) % 3 else WATER[3])
    c.px(cx - 12 + frame % 2 * 3, b - 12, WATER[5])
    c.hl(6 + frame, 8 + frame, b - 12 + frame % 2, WATER[5])
    return c.im


def bandstand(v=0):
    """An octagonal bandstand: stone base, iron columns, zinc roof."""
    c = C(88, 92)
    b, cx = 90, 44
    fy, col_h = b - 15, 40
    posts = [(cx + 35 * math.cos(math.radians(a)), fy + 7 * math.sin(math.radians(a)), a)
             for a in (22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5)]
    back = [p for p in posts if p[2] > 180]
    front = [p for p in posts if p[2] < 180]
    G = GREEN

    def rail(a, q, tone):
        n = int(abs(q[0] - a[0]))
        for i in range(n + 1):
            x = round(a[0] + (q[0] - a[0]) * i / max(1, n))
            y = round(a[1] + (q[1] - a[1]) * i / max(1, n))
            c.rect(x, y - 9, x, y - 8, G[tone + 1])
            c.px(x, y - 2, G[tone])
            if i % 3 == 1:
                c.vl(x, y - 8, y - 2, G[tone])

    def column(x, y, tone):
        x = round(x)
        y = round(y)
        c.rect(x - 1, y - col_h, x, y - 1, G[tone])
        c.vl(x - 1, y - col_h, y - 1, G[tone + 2])
        c.hl(x - 2, x + 1, y - 2, G[tone + 1])
        c.hl(x - 2, x + 1, y - col_h + 3, G[tone + 1])
        for i in range(4):
            c.px(x - 2 - i, y - col_h + 2 - i, G[tone + 1])
            c.px(x + 1 + i, y - col_h + 2 - i, G[tone + 1])

    drum(c, cx, fy, b - 9, 40, 8.5, LIME, top=False, hi=5)
    for x in range(8, 82, 9):
        t = (x - cx) / 40
        c.vl(x, round(fy + 8.5 * math.sqrt(1 - t * t)) + 1, round(b - 9 + 8.5 * math.sqrt(1 - t * t)), LIME[2])
    c.ellipse(cx, fy, 40, 8.5, LIME[6])
    c.ellipse(cx, fy, 37.5, 7.3, PINE[4])
    for y in range(fy - 6, fy + 7, 2):
        for x in range(cx - 37, cx + 38):
            if c.get(x, y)[:3] == mix(PINE[4], PINE[4], 0)[:3]:
                c.px(x, y, PINE[3] if (x + y * 5) % 13 else PINE[2])
    for i in range(len(back) - 1):
        rail(back[i], back[i + 1], 1)
    rail(posts[3], back[0], 1)
    rail(back[-1], posts[0], 1)
    for x, y, _ in back:
        column(x, y, 1)
    # Steps out of the front, between the two front columns.
    for k in range(3):
        x0, x1, y = cx - 9 - k, cx + 8 + k, b - 8 + k * 3
        c.rect(x0, y - 2, x1, y, LIME[4])
        c.hl(x0, x1, y - 3, LIME[6])
        c.hl(x0, x1, y, LIME[3])
    rail(posts[0], posts[1], 2)
    rail(posts[2], posts[3], 2)
    for x, y, _ in front:
        column(x, y, 2)
    # Roof.
    ey, apex = fy - col_h, fy - col_h - 26
    edges = [-1, -0.71, 0, 0.71, 1.01]
    tones = [3, 5, 4, 2]
    for x in range(cx - 42, cx + 42):
        t = (x + .5 - cx) / 42
        if abs(t) >= 1:
            continue
        lo = ey + 9 * math.sqrt(1 - t * t)
        up = apex + (ey - apex) * abs(t) ** 0.85
        face = next(i for i in range(4) if edges[i] <= t < edges[i + 1])
        for y in range(int(up), int(lo) + 1):
            near = min(abs(t - e) for e in edges[1:4]) * 42 < 0.6 + (y - apex) * 0.012
            c.px(x, y, ZINC[tones[face] - (1 if near and face in (1, 2) else 0)])
        c.px(x, int(lo), ZINC[1])
        c.px(x, int(lo) + 1, G[3] if x % 3 else G[1])
        if x % 3 == 0:
            c.px(x, int(lo) + 2, G[3])
    for x in range(cx - 42, cx + 42):
        t = (x + .5 - cx) / 42
        if abs(t) < 1 and x % 2 == 0:
            for face_y in (0.45, 0.72):
                lo = ey + 9 * math.sqrt(1 - t * t)
                up = apex + (ey - apex) * abs(t) ** 0.85
                y = int(up + (lo - up) * face_y)
                if c.get(x, y)[3]:
                    c.px(x, y, mix(c.get(x, y), INK, 0.18))
    drum(c, cx, apex - 4, apex + 1, 3, 1, ZINC, top=False, hi=5)
    c.rect(cx - 1, apex - 10, cx, apex - 5, G[3])
    sphere(c, cx - .5, apex - 11, 2, GOLD)
    return outline(c.im)


def citrus_pot(v=0):
    """A terracotta pot: 0 an orange tree, 1 an oleander."""
    c = C(34, 54)
    b, cx = 52, 17
    taper(c, cx, b - 14, b - 1, 9, 6, CLAY, hi=5)
    c.hl(cx - 6, cx + 5, b - 6, CLAY[2])
    disc(c, cx, b - 16, 10, 3, CLAY, thick=2, hi=5)
    c.ellipse(cx, b - 16, 8, 2, '#2a2018')
    if v == 0:
        c.rect(cx - 1, b - 30, cx, b - 16, BARK[2])
        c.vl(cx - 1, b - 30, b - 16, BARK[3])
        for dx, dy, r in ((-6, -36, 8), (6, -35, 8), (0, -42, 9), (0, -33, 7)):
            sphere(c, cx + dx, b + dy, r, LEAF, lo=1, hi=5)
        for i, (dx, dy) in enumerate(((-9, -34), (-3, -44), (4, -40), (9, -33), (-5, -30), (2, -31), (7, -45), (-10, -40))):
            c.rect(cx + dx, b + dy, cx + dx + 1, b + dy + 1, ORANGE[3])
            c.px(cx + dx, b + dy, ORANGE[5])
    else:
        for dx, dy, r in ((-7, -26, 7), (7, -25, 7), (-4, -36, 8), (5, -37, 8), (0, -30, 8), (0, -44, 6)):
            sphere(c, cx + dx, b + dy, r, LEAF[:6], lo=0, hi=5)
        for i, (dx, dy) in enumerate(((-9, -28), (-5, -40), (3, -46), (8, -38), (10, -27), (-1, -33), (4, -29), (-8, -34), (0, -41))):
            c.rect(cx + dx, b + dy, cx + dx + 1, b + dy, PINK[4])
            c.px(cx + dx, b + dy - 1, PINK[5])
            c.px(cx + dx + 1, b + dy + 1, PINK[2])
    return outline(c.im)


def kvass(v=0):
    """A kvass barrel trailer with its tap, mug shelf and the seller's stool."""
    c = C(70, 40)
    b = 38
    Y = YELLOW
    y0, y1, x0, x1 = b - 33, b - 11, 4, 50
    c.rect(1, b - 9, 12, b - 8, IRON[2])
    c.rect(1, b - 9, 2, b - 1, IRON[2])
    c.rect(10, b - 10, 48, b - 9, IRON[2])
    for y in range(y0, y1 + 1):
        v_ = (y - y0) / (y1 - y0)
        inset = round(5 * (1 - math.sqrt(max(0, 1 - (2 * v_ - 1) ** 2))))
        k = 4 if v_ < 0.12 else 5 if v_ < 0.3 else 4 if v_ < 0.55 else 3 if v_ < 0.8 else 2
        c.hl(x0 + inset, x1 - inset, y, Y[k])
    for x in (x0 + 7, x1 - 7):
        c.vl(x, y0 + 1, y1 - 1, Y[2])
    c.ellipse(27, b - 12, 10, 4, IRON[1])
    wheel(c, 27, b - 8, 8, IRON, STEEL, 0)
    c.ellipse(27, b - 8, 3.5, 3.5, STEEL[4])
    c.ellipse(27, b - 8, 1.5, 1.5, STEEL[2])
    c.rect(24, y0 - 3, 31, y0 - 1, Y[3])
    c.hl(24, 31, y0 - 3, Y[5])
    text(c, 'KBAC', 27, b - 25, RED[1])
    c.rect(x1 - 1, b - 19, x1 + 2, b - 17, STEEL[4])
    c.rect(x1 + 2, b - 17, x1 + 3, b - 15, STEEL[3])
    box(c, x1 - 2, b - 13, x1 + 9, b - 12, 3, WHITE, lean=2)
    c.rect(x1 + 6, b - 11, x1 + 7, b - 1, IRON[2])
    for x in (x1 + 1, x1 + 6):
        c.rect(x, b - 19, x + 2, b - 15, '#c8d8e0')
        c.vl(x, b - 19, b - 15, '#f0f8ff')
        c.rect(x, b - 17, x + 2, b - 15, '#8a5a20')
        c.px(x + 3, b - 17, '#c8d8e0')
    legs(c, (62, 67), b - 9, b, OAK)
    disc(c, 65, b - 10, 4, 1.8, OAK, thick=1)
    return outline(c.im)


def gazirovka(v=0):
    """A soda-water machine: 0 grey-blue, 1 red."""
    R = [GREYBLUE, RED + ['#f49a8c', '#fac8bc']][v]
    c = C(24, 46)
    b = 44
    box(c, 2, b - 38, 18, b, 4, R, lean=2)
    c.rect(4, b - 36, 16, b - 30, CREAM[2])
    c.hl(4, 16, b - 36, '#fffbe8')
    c.hl(5, 15, b - 33, R[2])
    c.hl(7, 13, b - 31, R[3])
    c.rect(5, b - 26, 13, b - 15, R[0])
    c.rect(6, b - 25, 13, b - 15, R[1])
    c.hl(6, 13, b - 15, STEEL[4])
    c.rect(8, b - 20, 10, b - 16, '#c8dce8')
    c.vl(8, b - 20, b - 16, '#f4fbff')
    c.px(9, b - 26, STEEL[5])
    c.rect(15, b - 26, 16, b - 24, STEEL[5])
    c.px(15, b - 22, IRON[1])
    c.px(15, b - 20, STEEL[5])
    c.px(15, b - 18, STEEL[5])
    c.rect(4, b - 11, 16, b - 3, R[2])
    c.hl(4, 16, b - 11, R[1])
    for y in (b - 9, b - 7, b - 5):
        c.hl(6, 14, y, R[1])
    return outline(c.im)


def chess_table(v=0):
    """A concrete park chess table with two fixed stools."""
    K = CONCRETE
    c = C(50, 26)
    b = 24
    for x in (7, 42):
        drum(c, x, b - 10, b - 2, 5, 1.8, K, hi=5)
    drum(c, 24.5, b - 14, b - 2, 4, 1.6, K, top=False, hi=5)
    box(c, 14, b - 17, 34, b - 15, 6, K, lean=3, hi=5)
    for k in range(1, 6):
        dx = round(k * 3 / 6)
        for i in range(6):
            c.hl(19 + dx + i * 2, 20 + dx + i * 2, b - 17 - k, '#f0ece0' if (i + k) % 2 else '#3a3844')
    return outline(c.im)


def soviet_vase(v=0):
    """A whitewashed concrete flower vase on its pedestal."""
    c = C(32, 46)
    b, cx = 44, 16
    P = WHITE
    box(c, cx - 7, b - 16, cx + 5, b, 3, P, lean=2)
    c.rect(cx - 5, b - 13, cx + 3, b - 3, P[2])
    c.rect(cx - 4, b - 12, cx + 3, b - 3, P[3])
    taper(c, cx, b - 22, b - 19, 2.5, 4, P)
    taper(c, cx, b - 30, b - 23, 13, 3, P, curve=0.6)
    for x in range(cx - 9, cx + 10, 4):
        c.vl(x, b - 29, b - 27, P[2])
    disc(c, cx, b - 32, 14, 3.6, P, thick=1)
    c.ellipse(cx, b - 32, 12, 2.6, '#2a2018')
    for dx, dy, r in ((-7, -34, 4), (6, -34, 4), (0, -36, 5), (-3, -33, 3.5), (4, -33, 3.5)):
        sphere(c, cx + dx, b + dy, r, LEAF, lo=1, hi=5, flat=0.75)
    for i, (dx, dy) in enumerate(((-9, -35), (-5, -38), (-1, -40), (3, -39), (7, -37), (10, -34), (-6, -33), (0, -35), (5, -33))):
        col = RED if i % 3 else PINK
        c.rect(cx + dx, b + dy, cx + dx + 1, b + dy, col[2])
        c.px(cx + dx, b + dy - 1, col[3])
    return outline(c.im)


def news_stand(v=0):
    """A glazed newspaper reading stand on two posts."""
    P = BLUE
    c = C(50, 52)
    b = 50
    for x in (5, 41):
        c.rect(x, b - 44, x + 2, b, P[2])
        c.vl(x, b - 44, b, P[4])
        c.vl(x + 2, b - 44, b, P[1])
    box(c, 1, b - 46, 45, b - 45, 4, P, lean=3)
    c.rect(3, b - 43, 45, b - 18, P[2])
    c.hl(3, 45, b - 43, P[4])
    c.hl(3, 45, b - 18, P[1])
    for x0 in (5, 19, 33):
        c.rect(x0, b - 41, x0 + 10, b - 20, '#ece4cc')
        c.vl(x0, b - 41, b - 20, '#f8f2e0')
        c.rect(x0 + 1, b - 40, x0 + 9, b - 38, '#3a3440' if x0 != 19 else RED[1])
        for y in range(b - 36, b - 21, 2):
            c.hl(x0 + 1, x0 + 4, y, '#8e8878')
            c.hl(x0 + 6, x0 + 9, y, '#8e8878')
        c.rect(x0 + 6, b - 36, x0 + 9, b - 32, '#a09888')
    return outline(c.im)


def morozhenoe(v=0):
    """An ice-cream seller's box cart: white, blue lids, a push handle."""
    c = C(40, 34)
    b = 32
    for x in (9, 25):
        wheel(c, x, b - 4, 4.5, IRON, STEEL, 0)
        c.ellipse(x, b - 4, 1.5, 1.5, STEEL[4])
    box(c, 3, b - 20, 29, b - 6, 6, WHITE, lean=3)
    for k in range(1, 6):
        dx = round(k * 3 / 6)
        c.hl(5 + dx, 15 + dx, b - 20 - k, BLUE[3 if k > 1 else 2])
        c.hl(18 + dx, 28 + dx, b - 20 - k, BLUE[3 if k > 1 else 2])
    c.hl(8, 12, b - 23, BLUE[5])
    c.hl(21, 25, b - 23, BLUE[5])
    c.rect(4, b - 15, 28, b - 13, BLUE[3])
    c.hl(4, 28, b - 15, BLUE[4])
    c.ellipse(16, b - 10, 2.5, 2.5, BLUE[4])
    c.px(15, b - 11, WHITE[5])
    for i in range(6):
        c.rect(33 + i // 2, b - 26 + i, 34 + i // 2, b - 26 + i, STEEL[3])
    c.rect(34, b - 28, 37, b - 27, STEEL[4])
    return outline(c.im)


GROUPS = [
    ('EUROPE', [
        ('Wallace fountain', wallace, 0), ('Gelato tricycle', gelato, 0), ('Chestnut roaster', chestnuts, 0),
        ('Beer-garden set', beer_table, 0), ('Street clock', street_clock, 0), ('Street pump', pump, 0),
        ('Bandstand', bandstand, 0), ('Orange tree', citrus_pot, 0), ('Oleander', citrus_pot, 1),
    ]),
    ('RUSSIA & THE SOVIET CITY', [
        ('Kvass barrel', kvass, 0), ('Soda-water machine', gazirovka, 0), ('Soda machine, red', gazirovka, 1),
        ('Chess table', chess_table, 0), ('Flower vase', soviet_vase, 0), ('Newspaper stand', news_stand, 0),
        ('Ice-cream cart', morozhenoe, 0),
    ]),
]
