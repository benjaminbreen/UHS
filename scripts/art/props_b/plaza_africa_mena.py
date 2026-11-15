"""Plaza furniture of the Middle East, North Africa and sub-Saharan Africa,
to the standard of plaza.py."""
import math

from art.props_b.plaza import (C, outline, sphere, mix, after, disc, drum, box, wheel, parasol,
                               legs, side_chair, stool, IRON, GREEN, OAK, LIME, LEAF, BARK, RED,
                               WATER, STEEL, CONCRETE, BRASS, CANE, WHITE, BLUE, YELLOW, ORANGE,
                               PLASTIC_RED, PLASTIC_BLUE, CLAY, CLOTH)

GLASS, GLARE = '#bcd6d8', '#eef8f4'
ZEER = ['#4a3020', '#7a5438', '#a67c58', '#c8a078', '#e0c098', '#f0dcbc']
PALM = ['#16281c', '#22402a', '#34603a', '#4e8048', '#74a058', '#a0c070']
RUST = ['#1a1418', '#2e2224', '#4a3430', '#6a4a3c', '#8a6450', '#a88468']
GREY = ['#2a2420', '#4a4038', '#6a5c50', '#8a7a68', '#a89880', '#c4b49a']
INK_ = (18, 12, 28)
FADED_Y = ['#8a7430', '#c0a448', '#e0c868', '#f0e090']
FADED_R = ['#7a3a34', '#a8544a', '#c87868', '#e0a090']
TEA = ('#f4f4ff', '#b8402a', '#8a2a18')


def awning(c, x0, x1, y, d, drop, a, b_, w=4):
    """A flat striped roof seen from above: d rows of top over a scalloped valance."""
    for x in range(x0, x1 + 1):
        r = (a, b_)[((x - x0) // w) % 2]
        for k in range(d):
            c.px(x + round((d - 1 - k) * 2 / d), y + k, r[3] if k < d - 1 else r[2])
        for k in range(drop):
            if k == drop - 1 and (x - x0) % w in (0, w - 1):
                continue
            c.px(x, y + d + k, r[2] if k == 0 else r[1])


def glass_case(c, x0, y0, x1, y1, frame):
    c.rect(x0, y0, x1, y1, GLASS)
    c.hl(x0 - 1, x1 + 1, y0 - 1, frame[4])
    c.vl(x0 - 1, y0, y1, frame[4])
    c.vl(x1 + 1, y0, y1, frame[2])


def glare(c, x, y, n=4):
    for i in range(n):
        c.px(x - i, y + i, GLARE)


def tea(c, x, y):
    c.hl(x, x + 1, y - 2, TEA[0])
    c.hl(x, x + 1, y - 1, TEA[1])
    c.hl(x, x + 1, y, TEA[2])


def smoke(c, x, y, frame, h=10, col=WHITE):
    """A rising curl: puffs four rows apart climb a row a frame, so four frames loop."""
    for k in range(h):
        if (k - frame) % 4 < 2:
            c.px(x + (0, 1, 1, 0)[k % 4], y - k, col[4 if k < h // 2 else 3 if k < h - 2 else 2])


def embers(c, spots, frame):
    for i, (x, y) in enumerate(spots):
        c.px(x, y, (ORANGE[5], ORANGE[3], RED[2], ORANGE[3])[(i + frame) % 4])


def jerry(c, x, y):
    """A 20-litre yellow jerrycan, 7 wide, standing on row y."""
    c.rect(x, y - 8, x + 6, y, YELLOW[3])
    c.hl(x, x + 6, y - 9, YELLOW[5])
    c.vl(x, y - 8, y, YELLOW[4])
    c.vl(x + 6, y - 8, y, YELLOW[1])
    c.hl(x, x + 6, y, YELLOW[1])
    for dx, dy in ((2, 6), (4, 6), (3, 5), (2, 4), (4, 4)):
        c.px(x + dx, y - dy, YELLOW[2])
    c.rect(x + 1, y - 11, x + 2, y - 10, '#2a2a30')
    c.hl(x + 3, x + 5, y - 10, YELLOW[2])


def simit_cart(v=0):
    """Istanbul: a red barrow, a glass case of stacked sesame rings, a striped roof."""
    c = C(46, 56)
    b = 54
    for x in (4, 39):
        c.rect(x, b - 46, x + 1, b - 24, BRASS[2])
        c.vl(x, b - 46, b - 24, BRASS[4])
    box(c, 4, b - 22, 38, b - 8, 4, PLASTIC_RED)
    c.rect(8, b - 19, 34, b - 13, WHITE[4])
    c.hl(8, 34, b - 13, WHITE[2])
    for x in range(11, 32, 4):
        c.rect(x, b - 17, x + 2, b - 15, PLASTIC_RED[2])
    glass_case(c, 8, b - 37, 37, b - 25, BRASS)
    for i, (x, n) in enumerate(((10, 5), (17, 4), (24, 5), (31, 3))):
        for k in range(n):
            y = b - 26 - k * 2
            c.hl(x, x + 4, y, ORANGE[1])
            c.hl(x, x + 4, y - 1, ORANGE[3])
            c.px(x + 1, y - 1, ORANGE[5])
    glare(c, 15, b - 36)
    glare(c, 35, b - 35, 5)
    awning(c, 1, 41, b - 53, 5, 3, PLASTIC_RED[1:5], WHITE[2:])
    wheel(c, 12, b - 6, 6.5)
    wheel(c, 31, b - 6, 6.5)
    c.rect(41, b - 23, 44, b - 22, IRON[2])
    return outline(c.im)


def shoeshine(v=0):
    """A boyacı sandığı: brass chest, a row of capped polish bottles, a footrest,
    the bootblack's stool beside it."""
    c = C(48, 34)
    b = 32
    stool(c, 41, b, OAK, r=4, h=7, top=CANE)
    box(c, 2, b - 13, 31, b, 5, BRASS, lean=2)
    c.rect(4, b - 11, 29, b - 2, BRASS[2])
    for cx in (9, 17, 25):
        c.ellipse(cx, b - 6.5, 3.4, 3.6, BRASS[5])
        c.ellipse(cx, b - 6.5, 2.2, 2.4, RED[1] if cx != 17 else BLUE[2])
        c.px(cx - 1, b - 8, WHITE[4])
    c.hl(3, 30, b - 12, BRASS[5])
    c.hl(3, 30, b - 1, BRASS[1])
    for x in range(4, 31, 5):
        c.rect(x, b - 22, x + 2, b - 18, '#3a2c24' if x % 2 else '#6a2a20')
        c.rect(x, b - 25, x + 2, b - 23, BRASS[3])
        c.vl(x, b - 25, b - 23, BRASS[5])
        c.px(x + 1, b - 26, BRASS[5])
    c.rect(15, b - 20, 16, b - 15, BRASS[1])
    c.rect(11, b - 22, 21, b - 21, BRASS[4])
    c.hl(12, 22, b - 23, BRASS[5])
    c.hl(11, 21, b - 20, BRASS[1])
    return outline(c.im)


def coffeehouse(v=0, frame=0):
    """A brass tray on a folding stand, two rush stools, tea, a narghile."""
    c = C(60, 40)
    b = 38
    stool(c, 6, b, OAK, r=5, h=8, top=CANE)
    stool(c, 42, b, OAK, r=5, h=8, top=CANE)
    cx = 24
    legs(c, (cx - 6, cx + 4), b - 11, b, OAK, w=2)
    c.hl(cx - 4, cx + 3, b - 5, OAK[2])
    disc(c, cx, b - 13, 11, 4.2, BRASS, thick=1)
    c.ellipse(cx, b - 13, 8.5, 2.8, BRASS[3])
    c.ellipse(cx - 1, b - 13.5, 6, 1.8, BRASS[4])
    tea(c, cx - 6, b - 13)
    tea(c, cx + 5, b - 12)
    sphere(c, cx, b - 15, 2.6, BRASS, lo=1)
    c.px(cx + 3, b - 16, BRASS[4])
    c.px(cx, b - 18, BRASS[5])
    nx = 53
    sphere(c, nx + 1, b - 5, 5, BLUE, lo=1)
    c.hl(nx - 1, nx + 2, b, BLUE[1])
    c.rect(nx, b - 27, nx + 1, b - 9, BRASS[3])
    c.vl(nx, b - 27, b - 9, BRASS[5])
    c.hl(nx - 1, nx + 2, b - 17, BRASS[4])
    c.hl(nx - 1, nx + 2, b - 11, BRASS[2])
    disc(c, nx + 1, b - 27, 4, 1.5, BRASS, thick=1)
    c.rect(nx - 1, b - 32, nx + 2, b - 29, CLAY[2])
    c.vl(nx - 1, b - 32, b - 29, CLAY[4])
    c.hl(nx - 1, nx + 2, b - 33, '#2a1a18')
    c = after(outline(c.im))
    embers(c, ((nx, b - 33), (nx + 1, b - 33), (nx + 2, b - 33)), frame)
    smoke(c, nx, b - 35, frame, h=6)
    for i in range(40):
        t = i / 39
        c.px(round(nx - 1 - t * 8), round(b - 15 + math.sin(t * math.pi) * 9 - t * 3), '#8a2434')
    c.hl(nx - 11, nx - 9, b - 19, BRASS[4])
    smoke(c, 30, b - 17, frame, h=4)
    return c.im


def juice_stall(v=0):
    """Jemaa el-Fna: a numbered green cart, a ridge of oranges, a canopy."""
    c = C(58, 62)
    b = 60
    for x in (4, 50):
        c.rect(x, b - 52, x + 1, b - 22, GREEN[2])
        c.vl(x, b - 52, b - 22, GREEN[4])
    box(c, 3, b - 22, 50, b - 5, 5, GREEN)
    c.rect(3, b - 10, 50, b - 8, WHITE[4])
    c.ellipse(27, b - 15, 5.5, 4.5, WHITE[5])
    c.vl(25, b - 18, b - 14, GREEN[1])
    c.hl(27, 29, b - 18, GREEN[1])
    c.vl(29, b - 17, b - 16, GREEN[1])
    c.hl(27, 29, b - 16, GREEN[1])
    c.px(27, b - 15, GREEN[1])
    c.hl(27, 29, b - 14, GREEN[1])
    for row, (n, y) in enumerate(((9, b - 26), (8, b - 29), (7, b - 32))):
        for i in range(n):
            sphere(c, 7.5 + row * 2 + i * 4, y, 2.5, ORANGE, lo=1)
    for x in (43, 47):
        c.rect(x, b - 29, x + 1, b - 25, ORANGE[4])
        c.hl(x, x + 1, b - 30, WHITE[5])
        c.px(x + 1, b - 25, ORANGE[2])
    awning(c, 0, 54, b - 59, 5, 3, GREEN[2:], WHITE[2:], w=5)
    for x in range(8, 48, 5):
        sphere(c, x + .5, b - 48.5, 1.6, ORANGE, lo=2)
    wheel(c, 12, b - 4, 4.5, n=6)
    wheel(c, 42, b - 4, 4.5, n=6)
    return outline(c.im)


def backgammon(v=0):
    """A tavla board open on a small table between two rush stools."""
    c = C(56, 32)
    b = 30
    stool(c, 6, b, OAK, r=5, h=9, top=CANE)
    stool(c, 49, b, OAK, r=5, h=9, top=CANE)
    legs(c, (17, 36), b - 13, b, OAK, w=2)
    legs(c, (20, 39), b - 13, b - 4, [OAK[0]] * 4, w=2)
    box(c, 15, b - 15, 37, b - 13, 7, OAK, lean=3)
    for k in range(1, 7):
        dx = round(k * 3 / 7)
        y = b - 15 - k
        c.hl(17 + dx, 35 + dx, y, '#3a2018')
        if k in (1, 2, 5, 6):
            for i, x in enumerate(range(18, 35, 2)):
                if x == 26:
                    continue
                c.px(x + dx, y, (CANE[5], RED[2])[(i + (k > 3)) % 2])
        c.px(26 + dx, y, OAK[5])
    c.px(30, b - 18, WHITE[5])
    c.px(23, b - 19, '#18141a')
    tea(c, 39, b - 17)
    return outline(c.im)


def frond(c, x0, y0, ang, length, droop, ramp, tick=4):
    for i in range(int(length * 2)):
        t = i / (length * 2)
        x = x0 + math.cos(ang) * length * t
        y = y0 - math.sin(ang) * length * t + droop * t * t
        c.rect(round(x), round(y), round(x) + 1, round(y), ramp[1])
        c.rect(round(x), round(y) - 1, round(x) + 1, round(y) - 1, ramp[2])
        if i % 2 == 0 and t > 0.12:
            for k in range(1, 1 + round(tick * (1 - abs(t - 0.5)))):
                c.px(round(x), round(y) + k, ramp[0])


def date_palm(v=0, frame=0):
    """A date palm in a square pit with a stone kerb."""
    c = C(70, 92)
    b, cx = 90, 35
    box(c, cx - 12, b - 4, cx + 10, b, 5, LIME, lean=2, hi=5)
    for k in range(2, 5):
        c.hl(cx - 9 + round(k * 2 / 5), cx + 8 + round(k * 2 / 5), b - 4 - k, '#5a4434')
    top = b - 62
    for y in range(top, b - 5):
        t = (y - top) / (b - 5 - top)
        x = cx - 2 + round(math.sin(t * 2.2) * 2)
        half = 3 if t < 0.8 else 4
        band = (y // 2) % 2
        c.hl(x - half, x + half, y, BARK[2 if band else 1])
        c.px(x - half, y, BARK[3 if band else 2])
        c.px(x - half + 1, y, BARK[4 if band else 3])
        c.px(x + half, y, BARK[0])
    hx, hy = cx - 2, top
    back = [PALM[1], PALM[2], PALM[3]]
    sway = lambda i: (0, 1, 0, -1)[(frame + i) % 4]
    for i, (ang, ln, dr) in enumerate(((2.6, 26, 16), (0.5, 26, 16), (2.0, 22, 6), (1.1, 22, 6), (3.3, 22, 24), (-0.2, 22, 24))):
        frond(c, hx, hy, ang, ln, dr + sway(i), back)
    for dx, dy in ((-5, 5), (4, 6), (-1, 8)):
        for k in range(5):
            c.rect(hx + dx - (k > 1), hy + dy + k, hx + dx + 1 + (k > 1 and k < 4), hy + dy + k, ORANGE[2 if k > 2 else 3])
        c.px(hx + dx, hy + dy + 1, ORANGE[5])
    front = [PALM[2], PALM[4], PALM[5]]
    mid = [PALM[1], PALM[3], PALM[4]]
    for i, (ang, ln, dr, ramp) in enumerate(((2.85, 30, 22, mid), (0.3, 30, 22, mid), (2.3, 28, 12, front), (0.85, 28, 12, front),
                                             (1.75, 22, 3, front), (1.35, 22, 3, mid), (3.6, 20, 26, mid), (-0.45, 20, 26, mid))):
        frond(c, hx, hy, ang, ln, dr + sway(i + 1), ramp)
    sphere(c, hx + .5, hy + 1, 4.5, BARK, lo=1)
    return outline(c.im)


def corn_cart(v=0, frame=0):
    """Istanbul: a red barrow with a charcoal grill of cobs and a glass case of
    boiled corn and chestnuts."""
    c = C(50, 44)
    b = 42
    box(c, 5, b - 20, 39, b - 8, 6, PLASTIC_RED, lean=2)
    c.rect(9, b - 17, 35, b - 12, WHITE[4])
    for x in range(12, 33, 4):
        c.rect(x, b - 16, x + 2, b - 14, PLASTIC_RED[2])
    for k in range(1, 6):
        dx = round(k * 2 / 6)
        c.hl(7 + dx, 20 + dx, b - 20 - k, '#221a1c')
    for i, (x, y) in enumerate(((9, 22), (13, 24), (17, 22), (11, 25), (19, 24), (15, 21))):
        c.px(x, b - y, (ORANGE[3], RED[2], ORANGE[5])[i % 3])
    for x, y in ((8, 25), (12, 23), (16, 25)):
        c.hl(x, x + 5, b - y, YELLOW[3])
        c.hl(x, x + 5, b - y - 1, YELLOW[4])
        c.px(x + 2, b - y, '#5a3a18')
        c.px(x + 4, b - y - 1, '#5a3a18')
    glass_case(c, 24, b - 31, 38, b - 22, BRASS)
    for x, y, r, col in ((28, 24, 3, YELLOW), (34, 24, 3, RUST), (31, 25, 2.5, YELLOW)):
        sphere(c, x, b - y, r, col, lo=2)
    glare(c, 36, b - 30, 4)
    c.rect(2, b - 30, 3, b - 20, IRON[2])
    c.rect(2, b - 31, 6, b - 30, IRON[3])
    wheel(c, 13, b - 6, 6.5)
    wheel(c, 32, b - 6, 6.5)
    c.rect(42, b - 22, 47, b - 21, IRON[2])
    c = after(outline(c.im))
    embers(c, ((9, b - 22), (13, b - 24), (17, b - 22), (11, b - 26), (19, b - 24), (15, b - 21)), frame)
    smoke(c, 12, b - 28, frame, h=9)
    smoke(c, 18, b - 29, frame + 2, h=6)
    return c.im


def jar(c, cx, y, r=5):
    """A porous water jar seen from above the shoulder: belly, neck, open mouth."""
    sphere(c, cx, y, r, ZEER, lo=1, flat=1.15)
    c.rect(cx - 2, y - r - 3, cx + 1, y - r + 1, ZEER[3])
    c.vl(cx - 2, y - r - 3, y - r + 1, ZEER[5])
    c.ellipse(cx, y - r - 3, 3.5, 1.6, ZEER[5])
    c.hl(cx - 2, cx + 1, y - r - 3, '#2a1c18')


def water_jars(v=0):
    """A street sabil: porous clay jars in a timber stand under a reed shade,
    a tin cup on a chain for whoever passes."""
    c = C(46, 58)
    b = 56
    for x in (8, 38):
        c.rect(x, b - 46, x + 1, b - 4, OAK[1])
    for x in (4, 34):
        c.rect(x, b - 46, x + 1, b, OAK[3])
        c.vl(x, b - 46, b, OAK[5])
    box(c, 1, b - 48, 38, b - 46, 6, CANE, lean=3)
    for k in range(1, 7):
        for x in range(3, 40, 3):
            c.px(x + round(k * 3 / 6), b - 48 - k, CANE[3])
    box(c, 3, b - 17, 36, b - 15, 4, OAK, lean=2)
    for cx in (11, 22, 33):
        jar(c, cx, b - 24, 6)
        c.hl(cx - 3, cx + 3, b - 18, ZEER[1])
    c.hl(4, 35, b - 4, OAK[2])
    c.rect(40, b - 12, 43, b - 8, STEEL[4])
    c.vl(40, b - 12, b - 8, STEEL[5])
    c.hl(40, 43, b - 13, STEEL[5])
    c.px(44, b - 10, STEEL[3])
    c = after(outline(c.im))
    for i in range(5):
        c.px(39 + i // 2, b - 18 + i, STEEL[1])
    return c.im


def umbrella_vendor(v=0):
    """A sun-faded parasol over a table of phone cards, sweets and cigarettes."""
    c = C(60, 64)
    b = 62
    parasol(c, 24.5, b - 44, 24, 9, 6, [FADED_Y, FADED_R], n=8, pole=STEEL, foot=b)
    legs(c, (14, 33), b - 13, b - 4, [OAK[0]] * 4, w=2)
    legs(c, (11, 30), b - 13, b, OAK, w=2)
    box(c, 9, b - 15, 31, b - 13, 6, OAK, lean=3)
    cols = (RED[2], BLUE[4], YELLOW[3], GREEN[4], WHITE[5], ORANGE[3])
    for k, y in enumerate((b - 17, b - 20)):
        for i, x in enumerate(range(12, 27, 3)):
            c.rect(x + 1 + k, y, x + 2 + k, y + 1, cols[(i + k * 2) % 6])
    c.rect(29, b - 24, 31, b - 19, GLASS)
    c.hl(29, 31, b - 25, RED[2])
    c.px(30, b - 21, RED[3])
    c.px(29, b - 20, YELLOW[3])
    side_chair(c, 44, b, -1, WHITE, wide=10)
    return outline(c.im)


def suya_grill(v=0, frame=0):
    """Half an oil drum on angle-iron legs: suya skewers and maize over charcoal."""
    c = C(54, 46)
    b = 44
    legs(c, (11, 37), b - 13, b - 4, [RUST[0]] * 4, w=2)
    legs(c, (7, 33), b - 12, b, RUST, w=2)
    c.rect(5, b - 20, 36, b - 14, RUST[3])
    c.hl(5, 36, b - 20, RUST[5])
    c.rect(5, b - 16, 36, b - 14, RUST[2])
    c.hl(6, 35, b - 13, RUST[1])
    c.hl(8, 33, b - 12, RUST[1])
    for x in (15, 26):
        c.vl(x, b - 19, b - 13, RUST[1])
        c.vl(x + 1, b - 19, b - 14, RUST[4])
    c.rect(37, b - 23, 39, b - 15, RUST[1])
    for k in range(1, 6):
        dx = round(k * 3 / 5)
        c.hl(5 + dx, 36 + dx, b - 20 - k, '#1c1416' if 1 < k < 5 else RUST[4])
    for x, y in ((9, 23), (14, 22), (19, 23)):
        c.hl(x - 1, x + 7, b - y, CANE[4])
        c.hl(x + 1, x + 5, b - y, '#7a3a20')
        c.hl(x + 1, x + 5, b - y - 1, '#a85a30')
        c.px(x + 3, b - y - 1, '#5a2414')
    for x, y in ((27, 22), (31, 24)):
        c.hl(x, x + 6, b - y, YELLOW[3])
        c.hl(x, x + 6, b - y - 1, YELLOW[4])
        c.px(x + 2, b - y, '#4a3018')
        c.px(x + 5, b - y - 1, '#4a3018')
    disc(c, 46, b - 3, 7, 2.8, WHITE, thick=2)
    for x in (42, 45, 48):
        c.rect(x, b - 6, x + 2, b - 4, LEAF[4])
        c.hl(x, x + 2, b - 7, LEAF[5])
        c.px(x + 2, b - 5, YELLOW[4])
    c = after(outline(c.im))
    embers(c, ((8, b - 22), (13, b - 24), (18, b - 22), (24, b - 23), (29, b - 23), (35, b - 22), (37, b - 24)), frame)
    smoke(c, 12, b - 27, frame, h=12)
    smoke(c, 24, b - 26, frame + 2, h=9)
    smoke(c, 33, b - 27, frame + 1, h=7)
    return c.im


def mkokoteni(v=0):
    """An East African handcart on car tyres, loaded with water jerrycans."""
    c = C(68, 42)
    b = 40
    c.rect(1, b - 16, 16, b - 15, GREY[4])
    c.hl(1, 16, b - 14, GREY[1])
    c.rect(1, b - 20, 2, b - 12, GREY[3])
    c.vl(1, b - 20, b - 12, GREY[5])
    legs(c, (17, 52), b - 11, b, GREY, w=2)
    box(c, 14, b - 14, 54, b - 11, 5, GREY, lean=2)
    for x in range(16, 50, 7):
        jerry(c, x, b - 16)
    for x in range(19, 44, 7):
        jerry(c, x + 1, b - 26)
    c.ellipse(35, b - 6, 7, 7, '#18161c')
    c.ellipse(35, b - 6, 3.5, 3.5, STEEL[3])
    c.ellipse(34.5, b - 6.5, 2, 2, STEEL[5])
    c.ellipse(35, b - 6, 1, 1, STEEL[1])
    c = after(outline(c.im))
    for i in range(40):
        t = i / 39
        c.px(round(15 + t * 37), round(b - 15 - math.sin(t * math.pi) * 23), CANE[2])
    return c.im


def duka(v=0):
    """A tuck-shop kiosk: painted sheet metal, a serving hatch with its flap
    propped up, goods on the shelves, stones holding the roof down."""
    c = C(58, 64)
    b = 62
    wall = BLUE
    c.rect(43, b - 42, 46, b - 2, wall[1])
    c.rect(4, b - 40, 42, b, wall[3])
    c.vl(4, b - 40, b, wall[4])
    c.rect(4, b - 9, 42, b, YELLOW[3])
    c.hl(4, 42, b - 9, YELLOW[5])
    c.hl(4, 42, b, YELLOW[1])
    c.rect(43, b - 9, 46, b - 2, YELLOW[1])
    for x in (16, 29):
        c.vl(x, b - 40, b, mix(wall[3], INK_, 0.2))
    c.rect(8, b - 33, 38, b - 16, '#1c1a24')
    cols = (RED[2], YELLOW[3], WHITE[5], GREEN[4], ORANGE[3], BLUE[5], RED[3])
    for k, sy in enumerate((b - 27, b - 20)):
        c.hl(8, 38, sy, OAK[3])
        for i, x in enumerate(range(12, 37, 3)):
            c.rect(x, sy - 3 + (i + k) % 2, x + 1, sy - 1, cols[(i * 3 + k) % 7])
    for i in range(6):
        c.rect(9, b - 32 + i * 2, 10, b - 31 + i * 2, (RED[2], WHITE[5], GREEN[4])[i % 3])
    c.rect(6, b - 15, 40, b - 14, OAK[5])
    c.hl(6, 40, b - 13, OAK[2])
    c.rect(6, b - 42, 40, b - 35, wall[4])
    c.hl(6, 40, b - 42, wall[5])
    c.hl(6, 40, b - 34, wall[1])
    for x in range(0, 48):
        ramp = STEEL[4] if (x // 2) % 2 else STEEL[3]
        for k in range(8):
            c.px(x + round((7 - k) * 3 / 8), b - 51 + k, STEEL[5] if k == 0 and (x // 2) % 2 else ramp)
        c.px(x, b - 43, STEEL[1])
    for x, y in ((10, 46), (24, 48), (38, 46)):
        c.px(x, b - y, RUST[4])
        c.px(x + 1, b - y, RUST[3])
    sphere(c, 8, b - 49, 2.6, CONCRETE, lo=1)
    sphere(c, 41, b - 48, 3, CONCRETE, lo=1)
    box(c, 48, b - 6, 54, b, 3, PLASTIC_RED, lean=1)
    for x in (49, 51, 53):
        c.px(x, b - 8, WHITE[5])
        c.px(x + 1, b - 8, '#3a2a20')
    return outline(c.im)


def market_mat(v=0):
    """A market woman's pitch: enamel basins of tomatoes, peppers and onions in
    pyramids on a woven mat, and the small piles that are the unit of sale."""
    c = C(64, 26)
    b = 24
    for y in range(b - 13, b + 1):
        dx = round((b - y) * 4 / 13)
        c.hl(2 + dx, 54 + dx, y, CANE[4] if (y - b) % 4 else CANE[2])
        c.px(2 + dx, y, CANE[5])
        for x in range(8, 54, 12):
            c.rect(x + dx, y, x + 2 + dx, y, BLUE[3])
    onion = ['#4a1c3a', '#7a3460', '#a85888', '#d090b8']
    for cx, cy, ramp in ((14, b - 7, RED), (31, b - 8, LEAF[2:6]), (48, b - 7, onion)):
        c.ellipse(cx, cy + 1, 8, 3.4, WHITE[2])
        c.ellipse(cx, cy, 8, 3.4, BLUE[2])
        c.ellipse(cx, cy, 7, 2.6, WHITE[5])
        for dx, dy in ((-4, 0), (0, 0), (4, 0), (-2, -3), (2, -3), (0, -6)):
            sphere(c, cx + dx, cy + dy - 1, 2.5, ramp, lo=1)
    for cx in (22, 39):
        for dx, dy in ((-2, 0), (2, 0), (0, -2)):
            sphere(c, cx + dx, b - 1 + dy, 2, RED, lo=1)
    return outline(c.im)


def palaver_bench(v=0):
    """A long plank bench with a back, weathered grey: where the square sits and talks."""
    c = C(58, 32)
    b = 30
    for x in (8, 45):
        c.rect(x, b - 25, x + 1, b - 12, GREY[1])
    c.rect(4, b - 24, 50, b - 20, GREY[3])
    c.hl(4, 49, b - 24, GREY[5])
    c.hl(5, 50, b - 20, GREY[1])
    c.hl(12, 30, b - 22, GREY[2])
    c.px(36, b - 22, GREY[1])
    legs(c, (9, 29, 48), b - 8, b - 4, [GREY[0]] * 4, w=2)
    legs(c, (6, 26, 45), b - 8, b, GREY, w=2)
    box(c, 3, b - 10, 48, b - 8, 5, GREY, lean=2)
    c.hl(5, 49, b - 13, GREY[2])
    c.hl(20, 34, b - 15, GREY[4])
    return outline(c.im)


def tailor(v=0):
    """A roadside tailor: treadle sewing machine on its iron stand, wax-print
    cloth over the table end, a stool."""
    c = C(52, 44)
    b = 42
    for x in (7, 29):
        c.rect(x, b - 14, x + 1, b, IRON[1])
        c.vl(x, b - 14, b, IRON[3])
    c.hl(5, 33, b, IRON[1])
    c.hl(8, 29, b - 8, IRON[2])
    c.rect(12, b - 3, 22, b - 2, IRON[2])
    c.hl(12, 22, b - 4, IRON[3])
    wheel(c, 25, b - 8, 5, tyre=IRON, spoke=IRON + IRON, n=4)
    box(c, 4, b - 17, 32, b - 15, 5, OAK, lean=2)
    c.rect(11, b - 21, 27, b - 20, IRON[1])
    c.hl(11, 27, b - 22, IRON[3])
    c.rect(23, b - 31, 26, b - 22, IRON[1])
    c.rect(11, b - 32, 26, b - 29, IRON[1])
    c.hl(11, 26, b - 32, IRON[3])
    c.rect(11, b - 29, 13, b - 25, IRON[1])
    c.vl(11, b - 32, b - 25, IRON[3])
    for x in (15, 18, 21):
        c.px(x, b - 30, BRASS[4])
    c.px(12, b - 27, BRASS[4])
    c.ellipse(28.5, b - 27, 2.5, 3, IRON[2])
    c.px(28, b - 28, STEEL[4])
    c.rect(1, b - 20, 9, b - 8, ORANGE[3])
    c.hl(2, 10, b - 21, ORANGE[4])
    c.vl(1, b - 20, b - 8, ORANGE[4])
    for y in range(b - 19, b - 8, 4):
        for x in range(2, 9, 4):
            c.rect(x, y, x + 1, y + 1, BLUE[2])
            c.px(x + 2, y + 2, YELLOW[4])
    c.hl(1, 9, b - 8, ORANGE[1])
    stool(c, 43, b, OAK, r=5, h=10)
    c = after(outline(c.im))
    c.vl(12, b - 24, b - 22, STEEL[5])
    return c.im


def standpipe(v=0, frame=0):
    """A public tap: concrete post on a wet apron, a bucket filling, a jerrycan waiting."""
    c = C(46, 40)
    b = 38
    box(c, 2, b - 3, 38, b, 7, CONCRETE, lean=3)
    c.ellipse(22, b - 7, 9, 2.5, CONCRETE[2])
    box(c, 7, b - 31, 14, b - 7, 2, CONCRETE, lean=1)
    c.rect(15, b - 24, 20, b - 23, BRASS[3])
    c.hl(15, 20, b - 24, BRASS[5])
    c.rect(20, b - 23, 21, b - 21, BRASS[2])
    c.hl(16, 19, b - 26, RED[2])
    c.px(17, b - 25, BRASS[2])
    drum(c, 21, b - 14, b - 7, 5, 2, PLASTIC_BLUE, top=WATER)
    jerry(c, 30, b - 6)
    c = after(outline(c.im))
    c.px(21, b - 20 + frame, WATER[5])
    c.px(20, b - 20 + (frame + 2) % 4, WATER[4])
    c.hl(20 - frame % 2, 22 + frame % 2, b - 14, WATER[5])
    for i in range(9):
        t = i / 8
        c.px(round(16 + t * 10), round(b - 15 - math.sin(t * math.pi) * 4), STEEL[4])
    return c.im


MENA = [
    ('Simit cart', simit_cart, 0), ('Shoeshine box', shoeshine, 0), ('Coffeehouse set', coffeehouse, 0),
    ('Orange-juice stall', juice_stall, 0), ('Backgammon', backgammon, 0), ('Date palm', date_palm, 0),
    ('Corn & chestnut cart', corn_cart, 0), ('Water jars', water_jars, 0),
]

AFRICA = [
    ('Umbrella vendor', umbrella_vendor, 0), ('Suya & maize grill', suya_grill, 0),
    ('Mkokoteni', mkokoteni, 0), ('Duka kiosk', duka, 0), ('Market mat', market_mat, 0),
    ('Palaver bench', palaver_bench, 0), ('Tailor', tailor, 0), ('Standpipe', standpipe, 0),
]

GROUPS = [('MIDDLE EAST & NORTH AFRICA', MENA), ('SUB-SAHARAN AFRICA', AFRICA)]
