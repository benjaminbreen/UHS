"""Plaza furniture of the Americas: the North American park and sidewalk, the
Latin American plaza and its vendors. Scale and conventions are plaza.py's."""
import math

from art.city_kit import SLATE
from art.props_b.plaza import (C, outline, sphere, mix, after, disc, drum, box, wheel, parasol, legs,
                               IRON, GREEN, OAK, LIME, GOLD, CREAM, RED, WATER, STEEL, CONCRETE,
                               BRASS, WHITE, BLUE, YELLOW, ORANGE, PINK, PLASTIC_RED, CLAY, LEAF)

PANE = ['#7fa8b8', '#a8cdd6', '#cfe6ea', '#eef8f6']
CORN = ['#a87810', '#e0b020', '#f8d850', '#fff0a0']


def pane(c, x0, y0, x1, y1):
    """A sheet of glass: pale, with one slanting light."""
    c.rect(x0, y0, x1, y1, PANE[2])
    for y in range(y0, y1 + 1):
        x = x0 + 2 + (y1 - y) // 2
        if x + 1 <= x1:
            c.hl(x, x + 1, y, PANE[3])
    c.hl(x0, x1, y1, PANE[1])


def steam(c, x, y, frame=0, n=3, h=7):
    """Rising wisps, drawn after the outline. Loops over four frames."""
    for i in range(n):
        for k in range(h - (i % 2) * 2):
            p = (k - frame + i) % 4
            if p != 3:
                c.px(x + i * 4 + (0, 1, 1, 0)[p], y - k, '#f4f2ec' if k < h - 3 else '#d2d0d4')


def thread(c, x0, y0, x1, y1, col):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(n + 1):
        c.px(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n), col)


def hot_dog_cart(v=0):
    """A stainless hot-dog cart under its umbrella. 0 blue and yellow, 1 red and yellow."""
    c = C(48, 62)
    b, cx = 60, 21
    parasol(c, cx + .5, b - 44, 21, 8, 5, [[BLUE, YELLOW], [PLASTIC_RED, YELLOW]][v], n=8, pole=STEEL, foot=b - 24)
    c.rect(38, b - 21, 43, b - 20, STEEL[4])
    c.rect(42, b - 21, 43, b - 16, STEEL[2])
    box(c, 5, b - 22, 36, b - 7, 4, STEEL, lean=2)
    for x in (9, 20):
        c.rect(x, b - 25, x + 8, b - 24, STEEL[3])
        c.hl(x, x + 8, b - 25, STEEL[2])
        c.rect(x + 3, b - 25, x + 5, b - 25, STEEL[5])
    c.rect(8, b - 20, 33, b - 16, PLASTIC_RED[3])
    c.hl(8, 33, b - 20, PLASTIC_RED[4])
    c.hl(8, 33, b - 16, PLASTIC_RED[1])
    c.rect(13, b - 19, 28, b - 17, YELLOW[3])
    c.hl(15, 26, b - 18, ORANGE[2])
    c.hl(5, 36, b - 13, STEEL[5])
    for x, col in ((31, PLASTIC_RED), (34, YELLOW)):
        c.rect(x, b - 31, x + 1, b - 26, col[3])
        c.vl(x, b - 31, b - 26, col[4])
        c.px(x, b - 32, col[2])
    wheel(c, 13, b - 6, 6, IRON, STEEL, n=6)
    legs(c, (32,), b - 6, b, STEEL, w=2)
    return outline(c.im)


def shoeshine(v=0):
    """A shoeshine stand: a leather armchair raised on a stepped platform,
    brass footrests in front of it."""
    c = C(42, 60)
    b = 58
    box(c, 3, b - 13, 34, b, 5, OAK, lean=2)
    c.rect(13, b - 44, 27, b - 28, OAK[3])
    c.hl(13, 27, b - 45, OAK[5])
    c.rect(15, b - 42, 25, b - 30, GREEN[3])
    c.hl(15, 25, b - 42, GREEN[5])
    c.vl(15, b - 42, b - 30, GREEN[4])
    for x in (17, 20, 23):
        c.px(x, b - 38, BRASS[4])
        c.px(x, b - 34, BRASS[4])
    for x in (10, 28):
        c.rect(x, b - 35, x + 1, b - 24, OAK[3])
        c.vl(x, b - 35, b - 24, OAK[5])
        sphere(c, x + 1, b - 36, 1.6, BRASS)
    box(c, 12, b - 26, 28, b - 24, 3, GREEN, lean=1)
    legs(c, (12, 27), b - 23, b - 16, OAK, w=2)
    for x in (15, 23):
        c.rect(x, b - 22, x + 1, b - 16, BRASS[2])
        c.vl(x, b - 22, b - 16, BRASS[4])
        c.rect(x - 1, b - 24, x + 3, b - 23, BRASS[4])
        c.hl(x - 1, x + 3, b - 24, BRASS[5])
    box(c, 9, b - 5, 28, b, 2, OAK, lean=1)
    c.rect(22, b - 10, 30, b - 8, OAK[1])
    c.px(26, b - 9, BRASS[4])
    return outline(c.im)


def picnic_table(v=0):
    """A plank picnic table with its two attached benches."""
    c = C(58, 34)
    b = 32
    box(c, 9, b - 25, 49, b - 24, 2, OAK, lean=1)
    legs(c, (11, 45), b - 19, b - 5, OAK, w=2)
    box(c, 6, b - 20, 46, b - 19, 6, OAK, lean=3)
    for k in (2, 4):
        dx = round(k * 3 / 6)
        c.hl(6 + dx, 46 + dx, b - 20 - k, OAK[4])
    c.hl(11, 46, b - 10, OAK[1])
    legs(c, (8, 43), b - 8, b, OAK, w=2)
    box(c, 4, b - 10, 46, b - 9, 3, OAK, lean=1)
    return outline(c.im)


def chess_table(v=0):
    """A concrete park chess table and two fixed stools, the board cast into the top."""
    c = C(52, 28)
    b, cx = 26, 25
    for sx in (6, 45):
        drum(c, sx, b - 10, b - 2, 4.5, 1.8, CONCRETE)
    drum(c, cx, b - 13, b - 2, 4, 1.6, CONCRETE, top=False)
    box(c, cx - 10, b - 16, cx + 9, b - 14, 6, CONCRETE, lean=2)
    for r in range(4):
        y = b - 21 + r
        dx = round((b - 16 - y) * 2 / 6)
        for i in range(4):
            x = cx - 5 + dx + i * 2
            c.hl(x, x + 1, y, '#3a3640' if (i + r) % 2 else '#efe6cf')
    c.rect(cx + 6, b - 20, cx + 6, b - 19, '#f4f2ec')
    c.px(cx - 7, b - 19, '#2e2c38')
    return outline(c.im)


def popcorn_wagon(v=0, frame=0):
    """A red popcorn wagon: glass case of popped corn, brass posts, striped roof."""
    c = C(54, 62)
    b = 60
    c.rect(43, b - 22, 49, b - 21, BRASS[3])
    box(c, 6, b - 24, 41, b - 10, 4, PLASTIC_RED, lean=2)
    c.rect(9, b - 21, 38, b - 13, PLASTIC_RED[2])
    c.hl(9, 38, b - 21, GOLD[2])
    c.hl(9, 38, b - 13, GOLD[1])
    c.vl(9, b - 21, b - 13, GOLD[2])
    c.vl(38, b - 21, b - 13, GOLD[1])
    for x in range(14, 35, 5):
        c.rect(x, b - 18, x + 2, b - 16, GOLD[2])
    pane(c, 9, b - 45, 39, b - 27)
    for i, (x, r) in enumerate(((14, 4), (21, 5.5), (29, 5), (35, 3.5))):
        sphere(c, x, b - 28, r, ['#d8b860', '#f0d880', '#fff4c0', '#fffbe8'], flat=0.8)
    c.rect(9, b - 28, 39, b - 27, '#f0d880')
    c.rect(13, b - 44, 18, b - 40, STEEL[3])
    c.hl(13, 18, b - 44, STEEL[5])
    for x in (8, 39):
        c.rect(x, b - 46, x + 1, b - 27, BRASS[3])
        c.vl(x, b - 46, b - 27, BRASS[5])
    for k in range(6, 0, -1):
        dx = round(k * 2 / 6)
        for x in range(4 + dx, 44 + dx + 1):
            c.px(x, b - 50 - k, [PLASTIC_RED[4], WHITE[5]][((x - dx) // 4) % 2])
    for x in range(4, 45):
        s = (x // 4) % 2
        c.vl(x, b - 50, b - 47, [PLASTIC_RED[3], WHITE[4]][s])
        if x % 4 in (1, 2):
            c.px(x, b - 46, [PLASTIC_RED[2], WHITE[3]][s])
    c.vl(45, b - 54, b - 48, PLASTIC_RED[1])
    wheel(c, 31, b - 8, 8, IRON, GOLD + GOLD[-1:], n=8)
    wheel(c, 12, b - 5, 5, IRON, GOLD + GOLD[-1:], n=6)
    c = after(outline(c.im))
    for i, (x, y) in enumerate(((14, 34), (22, 38), (30, 33), (35, 37), (18, 32), (27, 40))):
        p = (i + frame) % 4
        if p < 2:
            c.px(x, b - y - p * 2, '#fffbe8')
    return c.im


def flagpole(v=0, frame=0):
    """A park flagpole on a stepped stone base, a plain pennant flying."""
    c = C(38, 94)
    b, cx = 92, 11
    box(c, cx - 9, b - 5, cx + 7, b, 4, CONCRETE, lean=2)
    box(c, cx - 5, b - 12, cx + 4, b - 8, 3, CONCRETE, lean=1)
    c.rect(cx - 1, b - 86, cx, b - 12, STEEL[3])
    c.vl(cx - 1, b - 86, b - 12, STEEL[5])
    sphere(c, cx - .5, b - 88, 2.4, GOLD)
    col = [RED, BLUE, GREEN][v % 3]
    for i in range(22):
        half = 5.5 * (1 - i / 24)
        ph = i / 3.2 - frame * math.pi / 2
        wave = round(math.sin(ph) * 1.5 * min(1, i / 6))
        for y in range(round(b - 79 - half + wave), round(b - 79 + half + wave) + 1):
            c.px(cx + 1 + i, y, col[3 if math.cos(ph) > 0.2 else 2 if math.cos(ph) > -0.5 else 1])
    c = after(outline(c.im))
    for y in range(b - 72, b - 24):
        if y % 2:
            c.px(cx + 2, y, WHITE[3])
    c.hl(cx + 1, cx + 2, b - 24, STEEL[1])
    return c.im


def bubbler(v=0, frame=0):
    """A concrete pedestal drinking fountain with a child's step."""
    c = C(28, 32)
    b, cx = 30, 11
    box(c, 17, b - 5, 23, b, 3, CONCRETE, lean=1)
    drum(c, cx, b - 19, b - 2, 5, 2, CONCRETE, top=False)
    for y in range(b - 22, b - 18):
        half = 5 + (b - 18 - y)
        for x in range(cx - half, cx + half + 1):
            f = (x - cx + half) / (2 * half)
            c.px(x, y, CONCRETE[4 if f < 0.4 else 3 if f < 0.7 else 2])
    disc(c, cx, b - 24, 9.5, 3.4, CONCRETE, thick=2)
    c.ellipse(cx, b - 24, 6.5, 2.1, STEEL[2])
    c.ellipse(cx, b - 23.6, 5.5, 1.5, STEEL[4])
    c.hl(cx - 3, cx, b - 24, WATER[4])
    c.rect(cx + 4, b - 27, cx + 5, b - 25, STEEL[5])
    c.px(cx + 5, b - 26, STEEL[3])
    c = after(outline(c.im))
    arc = ((cx + 3, b - 28), (cx + 2, b - 28), (cx + 1, b - 27), (cx, b - 26), (cx - 1, b - 25))
    for i, (x, y) in enumerate(arc):
        c.px(x, y - (frame % 2 if i in (1, 2) else 0), WATER[5] if (i + frame) % 4 else WATER[4])
    return c.im


def kiosco(v=0):
    """The bandstand at the middle of a Mexican plaza: an octagon of slender
    iron columns on a masonry base, under a zinc roof. 1 red-painted roof."""
    c = C(94, 98)
    b, cx = 96, 46
    F, RX, RY, H = b - 26, 38, 8, 36
    iron = GREEN
    roof = [SLATE[1:], CLAY][v]
    pts = [(RX * math.cos(math.radians(22.5 + 45 * k)), RY * math.sin(math.radians(22.5 + 45 * k))) for k in range(8)]

    def column(px, py):
        x, y = round(cx + px) - 1, round(F + py)
        c.rect(x, y - H, x + 1, y, iron[3])
        c.vl(x, y - H, y, iron[5])
        c.rect(x - 1, y - 1, x + 2, y, iron[2])
        c.rect(x - 1, y - H + 4, x + 2, y - H + 5, iron[4])
        for k in range(1, 4):
            c.px(x - 1 - k, y - H + 4 - k, GOLD[1])
            c.px(x + 2 + k, y - H + 4 - k, GOLD[1])

    def rail(sign, tone):
        for x in range(cx - RX + 1, cx + RX):
            t = (x + .5 - cx) / RX
            y = round(F + sign * RY * math.sqrt(1 - t * t))
            if sign > 0 and abs(x - cx) < 10:
                continue
            c.px(x, y - 9, iron[tone])
            c.px(x, y - 8, iron[tone - 1])
            if x % 3 == 0:
                c.vl(x, y - 7, y - 1, iron[tone - 1])
            elif x % 3 == 1:
                c.px(x, y - 5, GOLD[1] if sign > 0 else iron[tone - 1])

    rail(-1, 3)
    for p in pts:
        if p[1] < 0:
            column(*p)
    for x in range(cx - RX - 2, cx + RX + 3):
        t = (x + .5 - cx) / (RX + 2)
        if abs(t) > 1:
            continue
        dy = (RY + 1) * math.sqrt(1 - t * t)
        tone = 5 if t < -0.42 else 4 if t < 0.42 else 3
        for y in range(F, round(F + dy + 16) + 1):
            c.px(x, y, LIME[tone])
        c.px(x, round(F + dy + 16), LIME[2])
        c.px(x, round(F + dy + 15), LIME[tone - 1])
        c.px(x, round(F + dy + 4), CLAY[3])
        c.px(x, round(F + dy + 5), CLAY[2])
    for t in (-0.42, 0.42):
        x = round(cx + t * (RX + 2))
        dy = round((RY + 1) * math.sqrt(1 - t * t))
        c.vl(x, F + dy, F + dy + 16, LIME[6 if t < 0 else 2])
    c.ellipse(cx, F, RX + 2, RY + 1, LIME[6])
    c.ellipse(cx, F, RX - 1, RY - 1, CLAY[3])
    c.ellipse(cx - 5, F - 1, RX * 0.62, RY * 0.5, CLAY[4])
    for i in range(4):
        y0, half = F + 9 + i * 4, 8 + i
        box(c, cx - half, y0 + 1, cx + half, y0 + 3, 1, LIME, lean=0, hi=5)
        c.hl(cx - half, cx + half, y0, LIME[6])
    rail(1, 4)
    for p in pts:
        if p[1] > 0:
            column(*p)
    E, A = F - H, F - H - 24
    for y in range(A - 1, E + 11):
        for x in range(cx - 44, cx + 45):
            t = (x + .5 - cx) / 44
            if abs(t) > 1:
                continue
            bot = E + 9 * math.sqrt(1 - t * t)
            if not A + abs(t) * 23 <= y <= bot:
                continue
            sx = (x + .5 - cx) / (y - A + 1.5)
            k = 5 if sx < -1.48 else 4 if sx < -0.52 else 3 if sx <= 0.52 else 2 if sx <= 1.48 else 1
            if y > bot - 2:
                k = max(0, k - 2)
            elif abs(abs(sx) - 0.52) < 0.035 or abs(abs(sx) - 1.48) < 0.08:
                k = min(5, k + 1)
            c.px(x, y, roof[k])
    for x in range(cx - 43, cx + 44):
        t = (x + .5 - cx) / 44
        y = round(E + 9 * math.sqrt(1 - t * t)) + 1
        if x % 2 == 0:
            c.vl(x, y, y + (1 if x % 4 == 0 else 0), iron[3])
    drum(c, cx, A - 5, A, 3, 1.2, iron, top=False)
    sphere(c, cx, A - 8, 2.6, GOLD)
    c.vl(cx, A - 14, A - 11, GOLD[1])
    c = after(outline(c.im))
    c.vl(cx, E + 9, E + 13, iron[1])
    c.rect(cx - 1, E + 14, cx + 1, E + 16, GOLD[3])
    c.px(cx, E + 15, '#fff8d8')
    return c.im


def bolero(v=0):
    """A bolero's shoeshine chair: a high seat under a square canopy, footrests,
    a drawer of polish in the base. 0 blue, 1 red."""
    col = [BLUE, PLASTIC_RED][v]
    c = C(40, 70)
    b = 68
    for x in (9, 33):
        c.rect(x, b - 60, x + 1, b - 17, STEEL[2])
    box(c, 4, b - 12, 31, b, 4, col, lean=2)
    c.rect(8, b - 9, 27, b - 3, col[2])
    c.hl(8, 27, b - 9, col[1])
    c.rect(16, b - 6, 19, b - 6, BRASS[4])
    c.rect(11, b - 44, 25, b - 29, IRON[2])
    c.rect(12, b - 43, 24, b - 30, '#8e1f2c')
    c.hl(12, 24, b - 43, '#c8363c')
    c.vl(12, b - 43, b - 30, '#b02a34')
    for x in (15, 18, 21):
        c.px(x, b - 37, BRASS[4])
    for x in (9, 26):
        c.rect(x, b - 34, x + 1, b - 25, STEEL[3])
        c.hl(x - (0 if x < 20 else 1), x + (2 if x < 20 else 1), b - 35, STEEL[5])
    box(c, 10, b - 26, 26, b - 24, 3, ['#3a0818', '#5e1024', '#8e1f2c', '#b02a34', '#c8363c', '#e06a60'], lean=1)
    legs(c, (11, 25), b - 23, b - 15, STEEL, w=2)
    for x in (14, 21):
        c.rect(x, b - 21, x + 1, b - 15, STEEL[3])
        c.rect(x - 1, b - 23, x + 3, b - 22, STEEL[4])
        c.hl(x - 1, x + 3, b - 23, STEEL[5])
    for x in (4, 30):
        c.rect(x, b - 58, x + 1, b - 13, STEEL[3])
        c.vl(x, b - 58, b - 13, STEEL[5])
    box(c, 2, b - 61, 32, b - 58, 5, col, lean=2)
    for x in range(2, 33):
        c.px(x, b - 57, YELLOW[3])
        if x % 4 in (0, 1):
            c.px(x, b - 56, YELLOW[2])
    c.hl(2, 32, b - 61, YELLOW[4])
    return outline(c.im)


def paletero(v=0):
    """A paletero's pushcart: a white insulated box of ice lollies, a rail of bells."""
    c = C(52, 38)
    b = 36
    c.rect(37, b - 21, 45, b - 20, STEEL[4])
    c.rect(44, b - 26, 45, b - 20, STEEL[3])
    c.hl(42, 47, b - 27, STEEL[5])
    box(c, 5, b - 21, 35, b - 7, 5, WHITE, lean=2)
    c.rect(13, b - 25, 24, b - 23, WHITE[2])
    c.hl(13, 24, b - 25, WHITE[3])
    c.rect(18, b - 24, 19, b - 24, STEEL[2])
    c.rect(5, b - 19, 35, b - 18, PINK[3])
    c.rect(5, b - 9, 35, b - 8, BLUE[3])
    for i, col in enumerate((PINK, ORANGE, LEAF, YELLOW)):
        x = 9 + i * 7
        c.rect(x, b - 16, x + 2, b - 13, col[3])
        c.vl(x, b - 16, b - 13, col[4])
        c.px(x + 1, b - 12, '#b89450')
        c.px(x + 1, b - 11, '#b89450')
    for x in (8, 33):
        c.rect(x, b - 31, x + 1, b - 26, STEEL[3])
    c.hl(8, 34, b - 32, STEEL[5])
    c.hl(8, 34, b - 31, STEEL[2])
    for x in range(12, 32, 5):
        c.rect(x, b - 30, x + 1, b - 29, BRASS[4])
        c.px(x, b - 30, BRASS[5])
        c.px(x, b - 28, BRASS[1])
    wheel(c, 12, b - 5, 5.5, IRON, STEEL, n=6)
    wheel(c, 29, b - 5, 5.5, IRON, STEEL, n=6)
    return outline(c.im)


def elote_cart(v=0, frame=0):
    """An elotero's cart: a steaming pot of corn, a charcoal grill of cobs,
    jars of mayonnaise and chile."""
    c = C(58, 56)
    b = 54
    c.rect(46, b - 21, 52, b - 20, STEEL[4])
    box(c, 5, b - 22, 44, b - 8, 5, BLUE, lean=2)
    c.rect(8, b - 19, 41, b - 11, BLUE[2])
    c.ellipse(24, b - 15, 9, 3, CORN[1])
    c.ellipse(23, b - 15.5, 7, 2, CORN[2])
    c.rect(31, b - 17, 36, b - 14, LEAF[3])
    c.hl(32, 36, b - 16, LEAF[5])
    drum(c, 14, b - 38, b - 25, 8, 3, STEEL)
    c.ellipse(14, b - 38, 6.5, 2.2, CORN[1])
    for x in (10, 13, 16):
        c.rect(x, b - 40, x + 1, b - 38, CORN[2])
        c.px(x, b - 40, CORN[3])
    c.rect(5, b - 34, 5, b - 32, STEEL[1])
    c.rect(22, b - 34, 22, b - 32, STEEL[1])
    for x, col in ((26, WHITE), (31, PLASTIC_RED)):
        drum(c, x, b - 31, b - 26, 2, 1, col)
    box(c, 35, b - 27, 45, b - 25, 3, IRON + IRON[-1:] * 2, lean=1)
    for i in range(3):
        y = b - 30 + i
        c.hl(36 + i % 2, 43 + i % 2, y, CORN[2] if i != 1 else CORN[1])
        c.px(38 + i * 2, y, '#5a2408')
    c.hl(36, 44, b - 27, '#e05020')
    wheel(c, 14, b - 6, 6, IRON, STEEL, n=6)
    wheel(c, 34, b - 6, 6, IRON, STEEL, n=6)
    c = after(outline(c.im))
    steam(c, 9, b - 42, frame, n=3, h=8)
    return c.im


JAMAICA = ['#3a0818', '#5e1024', '#8e1a30', '#b82c40', '#d85060', '#f0909a']
HORCHATA = ['#8a8070', '#b8ad98', '#d8cdb8', '#efe6d2', '#f8f2e4', '#ffffff']
LIMA = ['#2a5020', '#487830', '#6aa040', '#90c458', '#b8e080', '#e0f4b0']


def aguas_frescas(v=0):
    """An aguas frescas table: glass vitroleros of jamaica, horchata and lima
    on an oilcloth, a ladle and a stack of cups."""
    c = C(58, 42)
    b = 40
    cloth = ['#5a1838', '#8e2a58', '#c0447c', '#e070a0', '#f0a0c0', '#f8c8dc']
    legs(c, (6, 46), b - 4, b, OAK, w=2)
    box(c, 3, b - 16, 49, b - 3, 5, cloth, lean=2)
    for x in range(7, 48, 6):
        c.rect(x, b - 11, x + 1, b - 10, '#fff4b0')
        c.px(x + 3, b - 7, '#f8f2e4')
    c.hl(3, 49, b - 4, '#fff4b0')
    for x, ramp in ((12, JAMAICA), (26, HORCHATA), (40, LIMA)):
        drum(c, x, b - 32, b - 20, 6.5, 2.4, ramp, top=False)
        drum(c, x, b - 35, b - 33, 6.5, 2.4, PANE + PANE[-1:] * 2, top=False)
        c.ellipse(x, b - 32, 6.5, 2.4, ramp[4])
        disc(c, x, b - 36, 5, 1.8, STEEL, thick=1)
    drum(c, 49, b - 25, b - 20, 2, 1, WHITE)
    c = after(outline(c.im))
    for x in (12, 26, 40):
        c.vl(x - 4, b - 31, b - 23, '#ffffff')
    thread(c, 30, b - 37, 34, b - 43, STEEL[4])
    return c.im


def globero(v=0, frame=0):
    """A globero's pole: a bunch of balloons, a foil star, pinwheels below."""
    c = C(50, 88)
    b, cx = 86, 24
    c.ellipse(cx, b - 1.5, 5, 2, IRON[1])
    c.rect(cx - 1, b - 46, cx, b - 2, OAK[3])
    c.vl(cx - 1, b - 46, b - 2, OAK[5])
    green = LEAF[1:]
    violet = ['#2a1848', '#48287a', '#6e40a8', '#9668cc', '#c0a0e8', '#e4d4f8']
    bunch = [(-6, -74, 6, PINK, 3), (9, -76, 6, green, 0), (-15, -67, 5.5, ORANGE, 2), (16, -68, 5.5, violet, 1),
             (0, -67, 7, YELLOW, 1), (-11, -58, 6, PLASTIC_RED, 0), (12, -59, 6, BLUE, 2), (1, -56, 5, WHITE, 3)]
    ends = []
    for dx, dy, r, ramp, ph in bunch:
        bob = (0, -1, 0, 1)[(frame + ph) % 4]
        sphere(c, cx + dx, b + dy + bob, r, ramp, lo=1)
        c.px(cx + dx, round(b + dy + bob + r), ramp[1])
        ends.append((cx + dx, round(b + dy + bob + r) + 1))
    sx, sy = cx + 2, b - 80 + (0, -1, 0, 1)[frame % 4]
    for k in range(-5, 6):
        w = 5 - abs(k) if abs(k) > 1 else 5
        c.hl(sx - w, sx + w, sy + k, '#ffffff' if k < -1 else '#e8f0f4' if k < 2 else '#a8c4d8')
    for k in range(6):
        c.px(sx, sy - 5 - k // 2, STEEL[5])
        c.hl(sx - 1, sx + 1, sy - 5, STEEL[5])
    c.hl(sx - 2, sx, sy - 1, '#ffffff')
    c = after(outline(c.im))
    for x, y in ends:
        thread(c, x, y, cx - 1, b - 46, '#ece8e0')
    for i, (x, y, col) in enumerate(((cx + 6, b - 36, PLASTIC_RED), (cx - 7, b - 28, BLUE), (cx + 6, b - 20, YELLOW))):
        c.hl(min(x, cx), max(x, cx), y, OAK[1])
        t = (frame + i) % 2
        for k in range(1, 5):
            for j, (ax, ay) in enumerate(((1, 0), (0, 1), (-1, 0), (0, -1))):
                ox, oy = (ax, ay) if t == 0 else (ax - ay, ay + ax)
                if t == 0 or k < 4:
                    c.px(x + ox * k, y + oy * k, col[4 if j % 2 else 3])
                    c.px(x + ox * k - ay, y + oy * k + ax, col[2]) if t == 0 and k > 1 else None
        c.px(x, y, '#ffffff')
    return c.im


def banca(v=0):
    """A white-painted wrought-iron plaza bench, the back a run of hoops."""
    c = C(54, 32)
    b = 30
    W = WHITE
    mid = b - 18
    for x in range(5, 47):
        t = (x - 25.5) / 21
        top = b - 25 + round(2.5 * t * t)
        c.px(x, top, W[5])
        c.px(x, top + 1, W[3])
        ph = (x - 5) % 7
        if ph == 0:
            c.vl(x, top + 2, b - 13, W[4])
        for y in range(top + 2, b - 12):
            if 2.0 <= math.hypot(ph - 3.5, y - mid) <= 3.1:
                c.px(x, y, W[4])
    c.hl(5, 46, b - 13, W[3])
    for x in (4, 46):
        c.rect(x, b - 25, x + 1, b - 9, W[4])
        c.vl(x, b - 25, b - 9, W[5])
        sphere(c, x + 1, b - 26, 1.6, W)
    for x in (9, 42):
        c.rect(x, b - 8, x, b - 3, W[1])
    for k in range(4):
        c.hl(3 - (k > 1), 47 - (k > 1), b - 12 + k, W[5] if k % 2 == 0 else W[2])
    c.hl(2, 46, b - 8, W[1])
    for x, s in ((2, -1), (46, 1)):
        c.rect(x, b - 18, x + 2, b - 17, W[5])
        c.rect(x + 1, b - 16, x + 1, b - 12, W[3])
        c.rect(x, b - 7, x + 1, b - 2, W[4])
        c.vl(x, b - 7, b - 2, W[5])
        c.rect(x + s, b - 1, x + 1 + s, b, W[3])
    return outline(c.im)


def emoliente(v=0, frame=0):
    """An Andean emoliente cart: bottles of herb extracts behind glass, a
    kettle on the counter, bicycle wheels and a little roof."""
    c = C(52, 64)
    b = 62
    paint = ['#0c2a2c', '#144a48', '#1e6c66', '#2c9084', '#58b4a4', '#98d8c8']
    c.rect(40, b - 22, 46, b - 21, STEEL[4])
    box(c, 5, b - 24, 38, b - 9, 4, WHITE, lean=2)
    c.rect(5, b - 20, 38, b - 16, paint[3])
    c.hl(5, 38, b - 20, paint[4])
    c.hl(5, 38, b - 16, paint[1])
    c.rect(36, b - 50, 37, b - 25, STEEL[3])
    pane(c, 7, b - 47, 25, b - 27)
    c.hl(7, 25, b - 37, STEEL[3])
    for i, col in enumerate((LIMA, ORANGE, JAMAICA, YELLOW, CLAY)):
        x = 8 + i * 4
        c.rect(x, b - 34, x + 1, b - 28, col[3])
        c.vl(x, b - 34, b - 28, col[4])
        c.px(x, b - 35, WHITE[2])
        col = (YELLOW, LIMA, CLAY, JAMAICA, ORANGE)[i]
        c.rect(x, b - 42, x + 1, b - 38, col[3])
        c.px(x, b - 43, WHITE[2])
    for x in (6, 26):
        c.rect(x, b - 50, x + 1, b - 27, STEEL[3])
        c.vl(x, b - 50, b - 27, STEEL[5])
    drum(c, 32, b - 33, b - 27, 4, 1.6, STEEL)
    c.rect(31, b - 35, 32, b - 34, IRON[2])
    c.rect(36, b - 32, 37, b - 31, STEEL[4])
    c.px(38, b - 33, STEEL[4])
    for x in (29, 34):
        c.rect(x, b - 26, x + 1, b - 25, PANE[3])
    box(c, 3, b - 54, 40, b - 51, 4, paint, lean=2)
    c.rect(8, b - 53, 35, b - 52, YELLOW[3])
    wheel(c, 13, b - 8, 7.5, IRON, STEEL, n=8)
    wheel(c, 31, b - 8, 7.5, IRON, STEEL, n=8)
    c = after(outline(c.im))
    steam(c, 38, b - 35, frame, n=1, h=6)
    steam(c, 30, b - 37, frame, n=1, h=5)
    return c.im


GROUPS = [
    ('NORTH AMERICA', [
        ('Hot-dog cart', hot_dog_cart, 0), ('Hot-dog cart, red', hot_dog_cart, 1),
        ('Shoeshine stand', shoeshine, 0), ('Picnic table', picnic_table, 0),
        ('Chess table', chess_table, 0), ('Popcorn wagon', popcorn_wagon, 0),
        ('Flagpole', flagpole, 0), ('Drinking fountain', bubbler, 0),
    ]),
    ('LATIN AMERICA', [
        ('Kiosco', kiosco, 0), ('Bolero chair', bolero, 0), ('Paletero cart', paletero, 0),
        ('Elote cart', elote_cart, 0), ('Aguas frescas', aguas_frescas, 0), ('Globero', globero, 0),
        ('Banca', banca, 0), ('Emoliente cart', emoliente, 0),
    ]),
]
