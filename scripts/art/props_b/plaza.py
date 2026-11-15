"""Furniture of the public square, worldwide, to the city kit's scale: the
adult is 37px, a table top stands at 15px and a seat at 10px. Tops are shown:
every table, tray, basin and counter is seen a little from above. The regional
sets are plaza_*.py; plaza_families.py sorts them all into prop families.
"""
import math

from art.city_kit import (C, outline, sphere, mix, IRON, GREEN, OAK, LIME, LEAF, BARK, TERRA,
                          RED, GOLD, CREAM, NAVY, WATER, BRICK)

INKY = (18, 12, 28)
STEEL = ['#1c2230', '#2e3746', '#4a5566', '#6c7888', '#98a4b0', '#c6ced4']
CONCRETE = ['#2e2c38', '#4e4b56', '#6f6b72', '#8e8a8c', '#aba6a2', '#c8c2ba']
BRASS = ['#4a3010', '#7a5418', '#a87c28', '#d0a840', '#eccc68', '#fbeaa0']
CANE = ['#4a3418', '#6e5024', '#947238', '#b89450', '#d8b870', '#eed898']
WHITE = ['#6e6a78', '#9a96a0', '#c4c0c4', '#e2dfdc', '#f4f2ec', '#ffffff']
BLUE = ['#10203e', '#183866', '#245a94', '#3a80bc', '#68a8d8', '#a8d4ee']
YELLOW = ['#6a4a08', '#a87810', '#d8a818', '#f0c838', '#f8e070', '#fff4b0']
ORANGE = ['#5a2408', '#96400c', '#cc6414', '#ec8a24', '#f8b048', '#fcd488']
PINK = ['#5a1838', '#8e2a58', '#c0447c', '#e070a0', '#f0a0c0', '#fad0e0']
PLASTIC_RED = ['#4a0c14', '#801420', '#b82028', '#e03a38', '#f06a5c', '#f8a090']
PLASTIC_BLUE = ['#0c1c4a', '#142e80', '#2048b8', '#3a6ce0', '#6a98f0', '#a0c0f8']
CLAY = ['#3a1a1c', '#6e2c24', '#a2472e', '#c96a3c', '#e3935a', '#f0b888']
CLOTH = ['#5a5040', '#8a7c60', '#b8a880', '#d8c8a0', '#ece0c0', '#f8f0dc']


def disc(c, cx, cy, rx, ry, ramp, thick=1, hi=None):
    """A round top seen from above: lit face over a darker edge."""
    hi = len(ramp) - 1 if hi is None else hi
    for t in range(thick, 0, -1):
        c.ellipse(cx, cy + t, rx, ry, ramp[max(0, hi - 3)])
    c.ellipse(cx, cy, rx, ry, ramp[hi - 1])
    c.ellipse(cx - rx * 0.18, cy - ry * 0.2, rx * 0.6, ry * 0.55, ramp[hi])


def drum(c, cx, y0, y1, rx, ry, ramp, top=None, hi=None):
    """An upright cylinder from top centre y0 to base centre y1, lit from the
    left, with its top face showing. `top` is the ramp of the top face."""
    hi = len(ramp) - 1 if hi is None else hi
    for x in range(int(cx - rx), int(cx + rx) + 1):
        t = (x + .5 - cx) / rx
        if abs(t) > 1:
            continue
        dy = ry * math.sqrt(1 - t * t)
        f = (t + 1) / 2
        k = hi - (2 if f < 0.12 else 1 if f < 0.42 else 2 if f < 0.68 else 3 if f < 0.88 else 4)
        for y in range(int(y0), int(y1 + dy) + 1):
            c.px(x, y, ramp[max(0, k)])
    if top is not False:
        disc(c, cx, y0, rx, ry, top or ramp, thick=0, hi=hi if top is None else None)


def box(c, x0, y0, x1, y1, d, ramp, lean=2, hi=None):
    """A block: front face x0..x1 by y0..y1, top face d rows deep above it
    receding right, and the right end wall that shows."""
    hi = len(ramp) - 1 if hi is None else hi
    for k in range(1, d + 1):
        dx = round(k * lean / d)
        c.hl(x0 + dx, x1 + dx, y0 - k, ramp[hi])
        for j in range(1, dx + 1):
            c.vl(x1 + j, y0 - k + 1, y1 - round(j * d / lean) + 1, ramp[max(0, hi - 3)])
    c.rect(x0, y0, x1, y1, ramp[hi - 2])
    c.hl(x0, x1, y0, ramp[hi - 1])
    c.vl(x0, y0, y1, ramp[hi - 1])
    c.hl(x0, x1, y1, ramp[max(0, hi - 3)])


def wheel(c, cx, cy, r, tyre=IRON, spoke=OAK, n=8):
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            d = math.hypot(x + .5 - cx, y + .5 - cy)
            if d > r:
                continue
            if d > r - 1.6:
                c.px(x, y, tyre[1] if y > cy else tyre[3])
            elif d < 1.6:
                c.px(x, y, tyre[2])
            elif n:
                a = math.atan2(y + .5 - cy, x + .5 - cx) % (2 * math.pi / n)
                if min(a, 2 * math.pi / n - a) * d < 0.7:
                    c.px(x, y, spoke[3])


def parasol(c, cx, y, rx, rise, drop, gores, n=8, pole=OAK, foot=None):
    """A parasol seen from a little above: the near rim dips toward the viewer,
    the gores turn round the cap. `y` is the rim line, `foot` where the pole lands."""
    px = int(cx)
    if foot is not None:
        c.rect(px, y, px + 1, foot, pole[2])
        c.vl(px, y, foot, pole[4])
    ay = y - rise * 0.55
    for yy in range(int(y - rise) - 1, int(y + drop) + 2):
        for x in range(int(cx - rx), int(cx + rx) + 2):
            t = (x + .5 - cx) / rx
            if abs(t) > 1:
                continue
            s = math.sqrt(1 - t * t)
            if not (y - rise * s <= yy + .5 <= y + drop * s):
                continue
            a = math.atan2((yy + .5 - ay) * (rx / max(rise, drop)) * 0.9, x + .5 - cx)
            ramp = gores[int((a + math.pi) / (2 * math.pi / n) + 0.5) % len(gores)]
            lit = 3 if (t < 0.1 and yy < y) else 2 if (t < 0.55 and yy < y + drop * s - 1) else 1
            c.px(x, yy, ramp[min(lit, len(ramp) - 1)])
    c.rect(px, int(y - rise) - 2, px + 1, int(y - rise), pole[3])


def legs(c, xs, y0, y1, ramp, w=1):
    for x in xs:
        c.rect(x, y0, x + w - 1, y1, ramp[1])
        c.vl(x, y0, y1, ramp[2] if w == 1 else ramp[3])


def side_chair(c, x, b, facing, ramp, seat=10, back=12, wide=10, cane=None):
    """A chair seen from the side and a little above, `facing` +1 right."""
    bx = x if facing > 0 else x + wide - 3
    pad = cane or ramp
    c.rect(bx, b - seat - back + 1, bx + 2, b - seat, ramp[3])
    c.hl(bx + (1 if facing > 0 else 0), bx + (2 if facing > 0 else 1), b - seat - back, ramp[4])
    c.vl(bx + (2 if facing > 0 else 0), b - seat - back + 2, b - seat - 4, pad[4])
    c.vl(bx + 1, b - seat - back + 2, b - seat - 4, pad[3])
    c.vl(bx if facing > 0 else bx + 2, b - seat - back + 1, b - seat, ramp[5 if facing > 0 else 1])
    legs(c, (x + 2, x + wide - 3), b - seat, b - 3, [ramp[0]] * 3)
    legs(c, (x, x + wide - 1), b - seat, b, ramp)
    c.rect(x, b - seat - 2, x + wide - 1, b - seat - 1, pad[4])
    c.hl(x + 1, x + wide, b - seat - 3, pad[5])
    c.hl(x + 2, x + wide, b - seat - 4, pad[5])
    c.hl(x, x + wide - 1, b - seat, pad[1])


def after(im):
    """A canvas over an outlined sprite, for threads the outline would ink."""
    c = C(*im.size)
    c.blit(im, 0, 0)
    return c


def stool(c, cx, b, ramp, r=4, h=9, top=None):
    """A round stool: three legs under a disc."""
    legs(c, (cx - r + 1, cx + r - 2), b - h, b, ramp)
    c.vl(cx, b - h, b - 2, ramp[1])
    disc(c, cx, b - h, r, max(1.5, r * 0.45), top or ramp, thick=1)


def bistro(v=0):
    """0 a marble-topped bistro table and two cane chairs, 1 under a parasol."""
    c = C(44, 54)
    b, cx = 52, 22
    if v:
        c.rect(cx, b - 44, cx + 1, b - 16, OAK[2])
    side_chair(c, 1, b, 1, OAK, cane=CANE)
    side_chair(c, 33, b, -1, OAK, cane=CANE)
    c.ellipse(cx + .5, b - .5, 4.5, 1.8, IRON[1])
    c.rect(cx, b - 14, cx + 1, b - 1, IRON[2])
    c.vl(cx, b - 14, b - 1, IRON[3])
    disc(c, cx + .5, b - 16, 8.5, 3.4, WHITE, thick=1)
    c.rect(cx - 4, b - 19, cx - 3, b - 17, '#f4f4ff')
    c.px(cx - 4, b - 17, '#b0b8c8')
    c.rect(cx + 2, b - 17, cx + 3, b - 16, '#7a4a20')
    c.px(cx + 4, b - 16, WHITE[2])
    if v:
        parasol(c, cx + .5, b - 38, 21, 8, 5, [RED, CREAM + CREAM[-1:]], n=10)
        c.rect(cx, b - 34, cx + 1, b - 20, OAK[2])
        c.vl(cx, b - 34, b - 20, OAK[4])
    return outline(c.im)


def urn(v=0):
    """A cast-iron urn of bedding plants on a square plinth, the planting seen
    from above. 0 green-black iron, 1 white-painted stone."""
    ramp = [['#141a1e', '#1f2a2c', '#2e3d3c', '#445650', '#5f7466', '#8aa08a'], LIME[1:]][v]
    c = C(26, 36)
    b, cx = 35, 13
    box(c, cx - 6, b - 4, cx + 4, b, 2, ramp, lean=1)
    drum(c, cx, b - 11, b - 6, 3, 1.2, ramp, top=False)
    for y in range(b - 21, b - 10):
        t = (y - (b - 21)) / 10
        half = 11 - t * t * 8
        for x in range(int(cx - half), int(cx + half) + 1):
            f = (x + .5 - cx + half) / (2 * half)
            c.px(x, y, ramp[4 if f < 0.15 else 5 if f < 0.3 else 4 if f < 0.5 else 3 if f < 0.75 else 2])
    for x in range(cx - 8, cx + 9, 3):
        c.vl(x, b - 18, b - 15, ramp[2])
    c.ellipse(cx, b - 22, 12, 3.6, ramp[2])
    c.ellipse(cx, b - 23, 12, 3.6, ramp[5])
    c.ellipse(cx, b - 23, 10, 2.6, '#2a2018')
    for i, (dx, dy, r) in enumerate(((-6, -25, 4), (5, -25, 4), (0, -27, 5), (-3, -23, 3.5), (4, -23, 3.5))):
        sphere(c, cx + dx, b + dy, r, LEAF, lo=1, hi=5, flat=0.75)
    blooms = [RED, YELLOW, PINK, WHITE[2:]]
    for i, (dx, dy) in enumerate(((-7, -27), (-3, -30), (2, -31), (6, -28), (-5, -24), (0, -26), (5, -24), (9, -25), (-9, -24))):
        col = blooms[(i + v) % (2 if v == 0 else 4)]
        c.px(cx + dx, b + dy, col[2])
        c.px(cx + dx + 1, b + dy, col[1])
        c.px(cx + dx, b + dy - 1, col[3])
    return outline(c.im)


def tiered_fountain(v=0, frame=0):
    """A two-bowl stone fountain in a round basin; the water falls in four frames."""
    c = C(84, 70)
    b, cx = 68, 42
    drum(c, cx, b - 16, b - 10, 40, 9, LIME, top=False, hi=5)
    c.ellipse(cx, b - 16, 40, 9, LIME[6])
    c.ellipse(cx, b - 16, 36, 7.2, LIME[3])
    c.ellipse(cx, b - 15, 35, 6.6, WATER[2])
    c.ellipse(cx - 4, b - 16, 27, 4, WATER[3])
    for i in range(46):
        x = cx - 32 + (i * 37) % 64
        y = b - 20 + (i * 11) % 10
        if c.get(x, y)[:3] in (mix(WATER[2], WATER[2], 0)[:3], mix(WATER[3], WATER[3], 0)[:3]):
            if (i + frame) % 4:
                c.hl(x, x + 1 + (i + frame) % 2, y, WATER[4 + (i + frame) % 5 // 4])
    drum(c, cx, b - 34, b - 17, 4, 1.6, LIME, top=False, hi=5)
    c.ellipse(cx, b - 17, 7, 2.2, WATER[4])
    for y in range(b - 38, b - 33):
        half = 6 + (b - 33 - y) * 3
        for x in range(cx - half, cx + half + 1):
            f = (x - cx + half) / (2 * half)
            c.px(x, y, LIME[5 if f < 0.3 else 4 if f < 0.6 else 3 if f < 0.85 else 2])
    c.ellipse(cx, b - 39, 21, 4.6, LIME[6])
    c.ellipse(cx, b - 39, 18, 3.4, WATER[3])
    c.ellipse(cx - 3, b - 40, 12, 1.8, WATER[4])
    drum(c, cx, b - 52, b - 40, 2.5, 1, LIME, top=False, hi=5)
    for y in range(b - 55, b - 51):
        half = 3 + (b - 51 - y) * 2
        c.hl(cx - half, cx + half, y, LIME[4])
        c.hl(cx - half, cx - half // 2, y, LIME[5])
    c.ellipse(cx, b - 56, 10, 2.4, LIME[6])
    c.ellipse(cx, b - 56, 8, 1.5, WATER[3])
    c.rect(cx - 1, b - 61, cx, b - 57, LIME[4])
    c = after(outline(c.im))
    fall = lambda i: WATER[4] if (i - frame) % 4 == 0 else WATER[5]
    for i in range(7):
        c.px(cx - 1 - i // 3, b - 67 + i, fall(i))
        c.px(cx + i // 3, b - 66 + i, fall(i + 2))
    c.px(cx - 1 + frame % 2, b - 68, WATER[5])
    for side in (-1, 1):
        for i in range(13):
            c.px(cx + side * (9 + i // 4), b - 55 + i, fall(i + side))
        for i in range(19):
            x = cx + side * (20 + i // 5)
            c.px(x, b - 38 + i, fall(i))
            c.px(x - side * 7, b - 36 + i, fall(i + 2))
        w = frame % 2
        c.hl(cx + side * 22 - 3 - w, cx + side * 22 + 2 + w, b - 18, WATER[5])
        c.hl(cx + side * 14 - 2 + w, cx + side * 14 + 1 - w, b - 17, WATER[5])
        c.hl(cx + side * 12 - 2 - w, cx + side * 12 + 2 + w, b - 40, WATER[5])
    return c.im


BRONZE = ['#16241f', '#22382f', '#32554a', '#4a7868', '#6c9c88', '#98c0aa']
PIGEON = ['#2a2c3a', '#4a5064', '#6c7488', '#949cac', '#bcc2cc']


def _pigeon(c, x, b, peck=False, facing=1):
    """Call on an outlined canvas: a ten-pixel bird is all rim otherwise."""
    c.ellipse(x + 5, b - 3.5, 4, 2.6, PIGEON[2])
    c.hl(x + 3, x + 6, b - 6, PIGEON[4])
    c.hl(x + 2, x + 7, b - 5, PIGEON[3])
    c.hl(x + 3, x + 6, b - 2, PIGEON[1])
    c.hl(x + 4, x + 6, b - 4, PIGEON[0])
    tail, head = (x, x + 9) if facing > 0 else (x + 9, x)
    c.hl(min(tail, tail + facing), max(tail, tail + facing), b - 4, PIGEON[0])
    hy = b - 3 if peck else b - 8
    c.rect(min(head, head - facing), hy, max(head, head - facing), hy + 1, PIGEON[1])
    if not peck:
        c.rect(min(head, head - facing), hy + 2, max(head, head - facing), hy + 3, '#4e7a66')
    c.px(head, hy, PIGEON[3])
    c.px(head + facing, hy + 1, '#e0a040')
    c.px(x + 4, b - 1, '#d07070')
    c.px(x + 6, b - 1, '#d07070')


def pigeons(v=0, frame=0):
    """Town pigeons pecking at the paving, each to its own beat."""
    c = C(56, 16)
    b = 15
    for i, (x, dy, facing) in enumerate(((1, 0, 1), (15, -5, -1), (29, 0, 1), (44, -4, -1))):
        _pigeon(c, x, b + dy, peck=(frame + i) % 4 in ((0, 1) if i % 2 else (2,)), facing=facing)
    return c.im


def statue(v=0, frame=0):
    """A bronze worthy on a stone plinth, gone green, with a pigeon on his head."""
    c = C(30, 78)
    b, cx = 76, 14
    box(c, cx - 11, b - 5, cx + 9, b, 3, LIME, hi=5)
    box(c, cx - 8, b - 26, cx + 6, b - 6, 3, LIME, hi=6)
    c.hl(cx - 9, cx + 7, b - 26, LIME[6])
    c.hl(cx - 9, cx + 7, b - 25, LIME[3])
    c.rect(cx - 5, b - 20, cx + 3, b - 12, LIME[3])
    c.hl(cx - 4, cx + 2, b - 17, LIME[2])
    c.hl(cx - 4, cx + 1, b - 15, LIME[2])
    f = b - 29
    tone = lambda t: BRONZE[4 if t < 0.2 else 5 if t < 0.38 else 3 if t < 0.66 else 2 if t < 0.9 else 1]
    span = lambda x0, x1, y: [c.px(x, y, tone((x - x0) / max(1, x1 - x0))) for x in range(x0, x1 + 1)]
    c.rect(cx - 5, f - 1, cx + 6, f, BRONZE[2])
    for y in range(f - 7, f - 1):
        span(cx - 4, cx - 1, y)
        span(cx + 2, cx + 5, y)
    for k, y in enumerate(range(f - 17, f - 7)):
        half = 4 + (k + 2) // 4
        span(cx - half, cx + half + 1, y)
        c.px(cx + 1, y, BRONZE[1])
    for y in range(f - 28, f - 17):
        span(cx - 4, cx + 5, y)
    c.hl(cx - 6, cx + 7, f - 28, BRONZE[4])
    c.hl(cx - 5, cx + 6, f - 29, BRONZE[5])
    c.rect(cx - 7, f - 27, cx - 6, f - 16, BRONZE[4])
    c.vl(cx - 5, f - 26, f - 17, BRONZE[1])
    c.rect(cx + 7, f - 27, cx + 8, f - 22, BRONZE[2])
    c.vl(cx + 6, f - 26, f - 22, BRONZE[1])
    c.rect(cx + 1, f - 22, cx + 8, f - 20, BRONZE[3])
    c.hl(cx + 1, cx + 7, f - 22, BRONZE[5])
    c.rect(cx - 1, f - 24, cx + 1, f - 19, BRONZE[5])
    c.rect(cx, f - 31, cx + 1, f - 30, BRONZE[3])
    sphere(c, cx + .5, f - 34, 3.8, BRONZE)
    c.hl(cx - 2, cx + 3, f - 33, BRONZE[1])
    c = after(outline(c.im))
    _pigeon(c, cx - 4, f - 38, peck=frame == 2, facing=1 if frame < 3 else -1)
    return c.im


def stone_bench(v=0):
    """A backless stone bench, the seat slab seen from above."""
    c = C(44, 18)
    b = 17
    for x in (5, 30):
        box(c, x, b - 6, x + 5, b, 2, LIME, lean=1, hi=4)
    box(c, 1, b - 9, 39, b - 7, 5, LIME, hi=6)
    return outline(c.im)


def street_tree(v=0):
    """A young plane in an iron guard and a round grate."""
    c = C(44, 74)
    b, cx = 72, 21
    c.ellipse(cx + .5, b - 3, 14, 4.6, IRON[1])
    c.ellipse(cx + .5, b - 4, 14, 4.6, STEEL[2])
    for x in range(cx - 11, cx + 13, 3):
        c.vl(x, b - 6, b - 2, IRON[1])
    c.ellipse(cx + .5, b - 4, 4, 1.6, '#4a382a')
    c.rect(cx - 1, b - 40, cx + 2, b - 4, BARK[2])
    c.vl(cx - 1, b - 40, b - 4, BARK[4])
    c.vl(cx, b - 40, b - 4, BARK[3])
    c.vl(cx + 2, b - 40, b - 4, BARK[1])
    for y in (b - 33, b - 27):
        c.rect(cx, y, cx + 1, y + 1, BARK[4])
    for dx, dy, r in ((-8, -46, 10), (9, -47, 10), (0, -56, 12), (-3, -44, 9), (6, -41, 8)):
        sphere(c, cx + dx, b + dy, r, LEAF, lo=1, hi=5)
    c = after(outline(c.im))
    for y in (b - 23, b - 13):
        c.hl(cx - 4, cx + 5, y, STEEL[2])
    for x in (cx - 5, cx + 6):
        c.vl(x, b - 23, b - 4, STEEL[3])
    for x in (cx - 2, cx + 3):
        c.vl(x, b - 22, b - 3, STEEL[2])
    return c.im


SHARED = [
    ('Bistro table', bistro, 0), ('Bistro, parasol', bistro, 1),
    ('Iron urn', urn, 0), ('Stone urn', urn, 1), ('Tiered fountain', tiered_fountain, 0),
    ('Statue', statue, 0), ('Stone bench', stone_bench, 0), ('Street tree', street_tree, 0),
    ('Pigeons', pigeons, 0),
]

GROUPS = [('SHARED KIT', SHARED)]
