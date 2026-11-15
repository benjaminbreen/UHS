"""The plaza kit's East Asian sets: the Chinese park and street corner, and
the Japanese and Korean stall street. Helpers and scale are plaza.py's."""
import math

from art.props_b.plaza import (C, outline, sphere, after, disc, drum, box, wheel, legs, side_chair, stool,
                               IRON, GREEN, OAK, LIME, LEAF, BARK, RED, NAVY, STEEL, CONCRETE, CANE,
                               WHITE, BLUE, YELLOW, ORANGE, PINK, PLASTIC_RED, PLASTIC_BLUE, CLAY, CLOTH)

RUST = ['#2a1410', '#4a2418', '#6e3620', '#8e4a28', '#a8643a', '#c48858']
PINE = ['#0a1814', '#12281c', '#1c3c24', '#2a5230', '#3e6c3a', '#5a8a48']
TILE = ['#22242e', '#383c48', '#525866', '#6e7682', '#8e96a0', '#b0b6bc']
LACQUER = ['#2a0c10', '#4e1418', '#7a2020', '#9c2c28', '#b84434', '#d06a50']
TARP = ['#6a2a08', '#a84a0c', '#d86c14', '#f08a24', '#f8a840', '#fcc870']
SOIL = '#2a2018'
STEAM = '#f4f2ec'


def bar(c, x0, y0, x1, y1, ramp, hi=4, lo=2):
    """A 2px tube between two points, lit on its upper or left side."""
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    steep = abs(y1 - y0) >= abs(x1 - x0)
    for i in range(n + 1):
        x, y = round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n)
        c.px(x + (1 if steep else 0), y + (0 if steep else 1), ramp[lo])
        c.px(x, y, ramp[hi])


def hoop(c, cx, y, rx, ry, col):
    """A band round the near side of a drum."""
    for x in range(int(cx - rx), int(cx + rx) + 1):
        t = (x + .5 - cx) / rx
        if abs(t) <= 1:
            c.px(x, int(y + ry * math.sqrt(1 - t * t)), col)


def jar(c, cx, y0, y1, half, ramp, bands=()):
    """A pot shaded across: `half(t)` is the half-width from rim (0) to foot (1).
    `bands` is (row0, row1, ramp) stripes of another glaze."""
    for y in range(y0, y1 + 1):
        h = half((y - y0) / max(1, y1 - y0))
        r = next((br for a, z, br in bands if a <= y <= z), ramp)
        for x in range(int(cx - h), int(cx + h) + 1):
            f = (x + .5 - cx + h) / (2 * h)
            if 0 <= f <= 1:
                c.px(x, y, r[4 if f < 0.12 else 5 if f < 0.3 else 4 if f < 0.5 else 3 if f < 0.72 else 2 if f < 0.9 else 1])


def steam(c, x, y, n=9, lean=1, frame=0, col=STEAM):
    """A rising thread of steam; four frames carry it up one wobble."""
    for i in range(n):
        if (i - frame) % 4 != 3:
            c.px(x + lean * (((i - frame) // 2) % 2) + (i // 5), y - i, col)


def drum_stool(c, cx, base):
    drum(c, cx, base - 9, base - 2, 4.5, 1.8, CONCRETE)
    c.vl(cx - 6, base - 7, base - 3, CONCRETE[4])
    c.vl(cx + 5, base - 7, base - 3, CONCRETE[1])
    hoop(c, cx, base - 8, 4.5, 1.8, CONCRETE[2])
    hoop(c, cx, base - 3, 4.5, 1.8, CONCRETE[1])


def xiangqi(v=0):
    """A park's granite chess table, the xiangqi board cut into the top, and
    four drum stools."""
    c = C(58, 38)
    b, cx = 36, 29
    for x in (9, 49):
        drum_stool(c, x, b - 10)
    drum(c, cx, b - 13, b - 2, 4, 1.6, CONCRETE, top=False)
    drum(c, cx, b - 19, b - 16, 13, 5, CONCRETE)
    c.rect(cx - 8, b - 22, cx + 7, b - 16, LIME[4])
    c.rect(cx - 7, b - 21, cx + 6, b - 17, LIME[6])
    for x in range(cx - 6, cx + 6, 2):
        c.vl(x, b - 21, b - 20, LIME[5])
        c.vl(x, b - 18, b - 17, LIME[5])
    for dx, dy, col in ((-5, -21, RED[2]), (1, -20, IRON[1]), (-2, -17, RED[2]), (4, -18, IRON[1]), (-6, -18, IRON[1])):
        c.hl(cx + dx, cx + dx + 1, b + dy, col)
    for x in (16, 42):
        drum_stool(c, x, b)
    return outline(c.im)


def sweet_potato(v=0, frame=0):
    """Baked sweet potatoes: an oil drum turned oven on a flatbed tricycle,
    the potatoes keeping warm on the lid."""
    c = C(52, 46)
    b = 44
    wheel(c, 12, b - 5, 5.5, IRON, STEEL, 6)
    wheel(c, 43, b - 5, 5.5, IRON, STEEL, 6)
    bar(c, 43, b - 6, 39, b - 25, NAVY, hi=3, lo=1)
    c.rect(34, b - 27, 41, b - 26, IRON[2])
    c.rect(28, b - 11, 41, b - 10, NAVY[2])
    c.hl(28, 41, b - 11, NAVY[3])
    c.rect(32, b - 18, 33, b - 12, NAVY[2])
    c.rect(29, b - 20, 35, b - 19, IRON[1])
    c.hl(29, 35, b - 20, IRON[3])
    box(c, 2, b - 12, 28, b - 10, 3, STEEL, lean=2)
    drum(c, 15, b - 34, b - 15, 9.5, 3.5, RUST, top=RUST)
    for y in (b - 28, b - 21):
        hoop(c, 15, y, 9.5, 3.5, RUST[1])
    c.rect(11, b - 20, 18, b - 14, '#1a0c0c')
    c.rect(12, b - 18, 17, b - 15, ORANGE[2])
    c.hl(13, 16, b - 16, YELLOW[4])
    c.hl(13, 16, b - 17, ORANGE[4])
    for x, y in ((10, -35), (16, -36), (20, -34), (13, -33)):
        c.ellipse(x + .5, b + y + .5, 2.6, 1.6, CLAY[2])
        c.hl(x - 1, x, b + y, CLAY[4])
    c.px(17, b - 33, ORANGE[4])
    c.px(18, b - 33, YELLOW[3])
    c = after(outline(c.im))
    steam(c, 12, b - 38, 6, 1, frame)
    steam(c, 18, b - 39, 5, -1, frame + 2)
    return c.im


def baozi(v=0, frame=0):
    """A baozi seller's cart: a tower of bamboo steamers over the stove, the
    top one open, and a pot of soy milk."""
    c = C(50, 56)
    b = 54
    wheel(c, 11, b - 4, 4.5, IRON, STEEL, 6)
    wheel(c, 35, b - 4, 4.5, IRON, STEEL, 6)
    box(c, 3, b - 20, 41, b - 8, 6, STEEL, lean=3)
    c.rect(5, b - 18, 39, b - 10, BLUE[2])
    c.hl(5, 39, b - 18, BLUE[3])
    c.vl(5, b - 18, b - 10, BLUE[3])
    c.rect(18, b - 16, 26, b - 12, '#1a0c0c')
    c.rect(19, b - 14, 25, b - 12, ORANGE[3])
    c.hl(20, 24, b - 13, YELLOW[4])
    c.rect(44, b - 24, 48, b - 23, STEEL[2])
    c.rect(47, b - 23, 48, b - 12, STEEL[2])
    for i in range(4):
        y1 = b - 24 - i * 4
        drum(c, 15, y1 - 3, y1, 9.5, 3.2, CANE, top=CANE)
        hoop(c, 15, y1 - 1, 9.5, 3.2, CANE[1])
    top = b - 39
    c.ellipse(15, top, 8, 2.4, CANE[1])
    for x, y in ((11, 0), (16, -1), (20, 0), (14, 1)):
        sphere(c, x, top + y, 2.2, WHITE[1:], lo=1)
    drum(c, 34, b - 30, b - 25, 5.5, 2, STEEL, top=STEEL)
    c.ellipse(34, b - 30, 4, 1.3, WHITE[4])
    c = after(outline(c.im))
    steam(c, 12, top - 4, 9, 1, frame)
    steam(c, 18, top - 5, 7, -1, frame + 2)
    steam(c, 34, b - 33, 5, 1, frame + 1)
    return c.im


def air_walker(v=0):
    """Park fitness kit, the yellow and blue tube steel air walker."""
    c = C(42, 48)
    b = 46
    for x in (6, 33):
        c.ellipse(x + 1, b - .5, 3.5, 1.5, CONCRETE[3])
    bar(c, 10, b - 41, 37, b - 41, YELLOW, hi=2, lo=1)
    bar(c, 10, b - 41, 10, b - 4, YELLOW, hi=2, lo=1)
    bar(c, 36, b - 41, 36, b - 4, YELLOW, hi=2, lo=1)
    bar(c, 16, b - 36, 12, b - 6, PLASTIC_BLUE, hi=3, lo=1)
    c.rect(8, b - 5, 15, b - 4, PLASTIC_RED[2])
    bar(c, 6, b - 40, 33, b - 40, YELLOW)
    bar(c, 6, b - 40, 6, b - 1, YELLOW)
    bar(c, 33, b - 40, 33, b - 1, YELLOW)
    c.px(6, b - 40, YELLOW[5])
    bar(c, 8, b - 26, 32, b - 26, YELLOW, hi=3, lo=1)
    for x in (12, 26):
        c.rect(x, b - 27, x + 3, b - 25, IRON[1])
    bar(c, 24, b - 38, 28, b - 5, PLASTIC_BLUE)
    c.rect(24, b - 4, 32, b - 3, PLASTIC_RED[3])
    c.hl(24, 32, b - 5, PLASTIC_RED[4])
    c.rect(23, b - 40, 26, b - 38, IRON[2])
    return outline(c.im)


def pine_pot(v=0):
    """A trained pine in a blue-and-white glazed jar on a low wooden stand."""
    c = C(40, 62)
    b, cx = 60, 19
    legs(c, (cx - 9, cx + 7), b - 3, b, OAK, w=2)
    box(c, cx - 10, b - 6, cx + 8, b - 4, 2, OAK, lean=1)
    half = lambda t: 9 + 3 * t / 0.3 if t < 0.3 else 12 - 6 * ((t - 0.3) / 0.7) ** 1.5
    y0, y1 = b - 26, b - 8
    jar(c, cx, y0, y1, half, WHITE, bands=((y0, y0 + 1, BLUE), (y0 + 6, y0 + 7, BLUE), (y1 - 2, y1, BLUE)))
    for x in range(cx - 9, cx + 9, 4):
        c.rect(x, y0 + 10, x + 1, y0 + 12, BLUE[3])
        c.px(x + 2, y0 + 11, BLUE[3])
    c.ellipse(cx, y0 - 1, 10, 2.8, BLUE[4])
    c.ellipse(cx, y0 - 1, 8, 1.8, SOIL)
    bar(c, cx, y0 - 2, cx - 3, y0 - 12, BARK, hi=3, lo=1)
    bar(c, cx - 3, y0 - 12, cx + 3, y0 - 20, BARK, hi=3, lo=1)
    bar(c, cx + 3, y0 - 20, cx, y0 - 27, BARK, hi=3, lo=1)
    bar(c, cx - 2, y0 - 10, cx - 9, y0 - 14, BARK, hi=3, lo=1)
    for dx, dy, r in ((-9, -16, 7), (8, -22, 7.5), (-4, -26, 6), (1, -31, 6.5)):
        sphere(c, cx + dx, y0 + dy, r, PINE, lo=0, hi=5, flat=0.55)
    return outline(c.im)


def tanghulu(v=0):
    """The tanghulu seller's straw-bound pole, bristling with skewers of
    candied haws."""
    c = C(40, 64)
    b, cx = 62, 19
    c.rect(cx - 8, b - 1, cx + 9, b, OAK[2])
    c.hl(cx - 8, cx + 9, b - 1, OAK[4])
    c.rect(cx - 2, b - 4, cx + 3, b - 2, OAK[3])
    c.rect(cx, b - 26, cx + 1, b - 4, OAK[3])
    c.vl(cx, b - 26, b - 4, OAK[5])
    drum(c, cx + 1, b - 47, b - 27, 4, 1.5, CANE, top=CANE)
    for y in (b - 42, b - 35, b - 29):
        hoop(c, cx + 1, y, 4, 1.5, CANE[1])
    c = after(outline(c.im))
    for sx, sy, dx, dy in ((-3, -44, -1, -0.55), (-3, -38, -1, -0.2), (-3, -32, -1, 0.1), (-1, -47, -0.55, -1),
                           (4, -44, 1, -0.55), (4, -38, 1, -0.2), (4, -32, 1, 0.1), (2, -47, 0.5, -1), (0, -40, -0.9, -0.35), (2, -36, 0.9, -0.3)):
        for i in range(13):
            x, y = round(cx + sx + dx * i), round(b + sy + dy * i)
            if i < 4:
                c.px(x, y, CANE[4])
            elif i % 2 == 0:
                c.rect(x, y - 1, x + 1, y, PLASTIC_RED[3])
                c.px(x, y - 1, PLASTIC_RED[5])
                c.px(x + 1, y, PLASTIC_RED[1])
    return c.im


def notice_board(v=0):
    """The neighbourhood newspaper board: the day's papers under glass, a
    tiled eave over them."""
    c = C(62, 50)
    b = 48
    for x in (7, 52):
        c.rect(x, b - 14, x + 2, b, LACQUER[3])
        c.vl(x, b - 14, b, LACQUER[5])
        c.vl(x + 2, b - 14, b, LACQUER[1])
        c.rect(x - 1, b - 1, x + 3, b, CONCRETE[3])
    c.rect(3, b - 37, 58, b - 13, LACQUER[2])
    c.hl(3, 58, b - 37, LACQUER[4])
    c.vl(3, b - 37, b - 13, LACQUER[4])
    c.hl(3, 58, b - 13, LACQUER[0])
    for i in range(4):
        x0 = 5 + i * 13
        c.rect(x0, b - 35, x0 + 12, b - 15, '#cfd6d2')
        c.rect(x0 + 1, b - 34, x0 + 11, b - 16, CLOTH[5] if i % 2 == 0 else CLOTH[4])
        c.rect(x0 + 2, b - 33, x0 + 8, b - 32, LACQUER[4] if i != 2 else IRON[2])
        c.rect(x0 + 2 + (i % 2) * 4, b - 30, x0 + 6 + (i % 2) * 4, b - 26, STEEL[3 - i % 2])
        for y in range(b - 30, b - 17, 2):
            a, z = (x0 + 8, x0 + 10) if (y < b - 25 and i % 2 == 0) else (x0 + 2, x0 + 5) if y < b - 25 else (x0 + 2, x0 + 10)
            c.hl(a, z, y, CLOTH[1])
        c.vl(x0 + 12, b - 35, b - 15, LACQUER[1])
    for k, y in enumerate(range(b - 45, b - 37)):
        x0, x1 = 5 - min(5, k), 56 + min(5, k)
        col = TILE[1] if k == 0 else TILE[5] if k < 3 else TILE[4] if k < 6 else TILE[2] if k == 6 else TILE[0]
        c.hl(x0, x1, y, col)
        if 0 < k < 7:
            for x in range(x0 + 1 + (k % 2), x1, 3):
                c.px(x, y, TILE[2] if k < 6 else TILE[1])
    c.rect(3, b - 46, 6, b - 45, TILE[2])
    c.rect(55, b - 46, 58, b - 45, TILE[2])
    c = after(outline(c.im))
    for i in range(4):
        c.px(8 + i, b - 22 - i, '#eef4f0')
        c.px(34 + i, b - 22 - i, '#eef4f0')
    return c.im


def tea_table(v=0, frame=0):
    """The teahouse in the park: a low table of thermos flasks and enamel
    mugs, a bamboo chair and a folding stool."""
    c = C(60, 40)
    b = 38
    side_chair(c, 1, b, 1, CANE, seat=7, back=11, wide=10)
    legs(c, (21, 42), b - 9, b - 4, [OAK[0]] * 4, w=2)
    legs(c, (16, 37), b - 9, b, OAK, w=2)
    box(c, 16, b - 12, 38, b - 10, 6, OAK, lean=4)
    drum(c, 23, b - 27, b - 16, 2.5, 1, PLASTIC_RED, top=STEEL)
    c.hl(21, 24, b - 22, PLASTIC_RED[5])
    drum(c, 29, b - 26, b - 15, 2.5, 1, GREEN, top=STEEL)
    c.hl(27, 30, b - 21, GREEN[5])
    for x, y in ((34, -17), (38, -15), (19, -14)):
        c.rect(x, b + y, x + 2, b + y + 2, WHITE[4])
        c.hl(x, x + 2, b + y, BLUE[3])
        c.px(x + 1, b + y, '#7a5020')
        c.px(x + 2, b + y + 2, WHITE[2])
    bar(c, 47, b - 7, 56, b - 1, OAK, hi=4, lo=2)
    bar(c, 56, b - 7, 47, b - 1, OAK, hi=3, lo=1)
    c.rect(46, b - 9, 57, b - 8, NAVY[2])
    c.hl(47, 58, b - 10, NAVY[4])
    c = after(outline(c.im))
    steam(c, 35, b - 19, 4, 1, frame)
    steam(c, 39, b - 17, 3, -1, frame + 2)
    return c.im


PURPLE = ['#2a1848', '#44287a', '#6440a8', '#8a64cc', '#b090e4', '#d8c4f4']
SMOKE = '#d0ccd0'


def lantern(c, cx, cy, frame=0, r=4):
    """A red paper chochin, the candle inside never quite steady."""
    c.rect(cx - 2, cy - r - 2, cx + 1, cy - r - 1, IRON[1])
    c.rect(cx - 2, cy + r + 1, cx + 1, cy + r + 2, IRON[1])
    for y in range(cy - r, cy + r + 1):
        half = max(2, round(math.sqrt(max(0, 1 - ((y - cy) / (r + 1)) ** 2)) * (r + .5)))
        for x in range(cx - half, cx + half):
            f = (x - cx + half) / (2 * half)
            k = 4 if f < 0.3 else 3 if f < 0.65 else 2
            c.px(x, y, PLASTIC_RED[k - (1 if (y - cy) % 2 else 0)])
    c.rect(cx - 2, cy - 1, cx - 1, cy + 1, [ORANGE[4], YELLOW[4], ORANGE[4], ORANGE[3]][frame % 4])


def roof_from_above(c, x0, x1, y0, rows, ramp, flare=4, plank=4):
    """A low roof seen from above: dark ridge, lit slope, shadowed eave."""
    for k in range(rows):
        f = min(flare, k)
        col = ramp[2] if k == 0 else ramp[5] if k < rows // 2 else ramp[4] if k < rows - 2 else ramp[3] if k < rows - 1 else ramp[1]
        c.hl(x0 - f, x1 + f, y0 + k, col)
        if plank and 0 < k < rows - 1:
            for x in range(x0 - f + 2, x1 + f, plank):
                c.px(x, y0 + k, ramp[3])


def yatai(v=0, frame=0):
    """A yatai: the wheeled night stall, noren over the counter, bowls set
    out, a red lantern at the eave and a bench for three."""
    c = C(66, 64)
    b = 62
    c.rect(8, b - 48, 50, b - 27, '#2a1a18')
    for i, x in enumerate(range(12, 46, 5)):
        c.rect(x, b - 34 + i % 2, x + 1, b - 28, [GREEN[3], '#8a5a20', WHITE[3], BLUE[3]][i % 4])
    for x in (6, 50):
        c.rect(x, b - 48, x + 1, b - 23, OAK[3])
        c.vl(x, b - 48, b - 23, OAK[5])
    box(c, 5, b - 22, 51, b - 9, 5, OAK, lean=2)
    for x in range(12, 50, 8):
        c.vl(x, b - 20, b - 10, OAK[2])
    for x in (14, 28, 42):
        c.ellipse(x, b - 25, 3.5, 1.6, WHITE[4])
        c.hl(x - 2, x, b - 26, '#b87830')
        c.px(x - 1, b - 26, GREEN[4])
    c.rect(34, b - 29, 35, b - 26, OAK[4])
    c.rect(20, b - 28, 21, b - 26, LACQUER[3])
    wheel(c, 10, b - 7, 7, IRON, OAK, 8)
    wheel(c, 47, b - 7, 7, IRON, OAK, 8)
    legs(c, (19, 37), b - 7, b, OAK, w=2)
    box(c, 17, b - 9, 39, b - 8, 3, OAK, lean=1)
    for p in range(4):
        x0 = 8 + p * 10 + (1 if p else 0)
        lift = 1 if (frame + p) % 4 == 1 else 0
        c.rect(x0, b - 47, 8 + p * 10 + 10, b - 37 - lift, NAVY[2])
        c.vl(x0, b - 47, b - 37 - lift, NAVY[3])
        c.hl(x0, 8 + p * 10 + 10, b - 37 - lift, NAVY[1])
        c.rect(x0 + 3, b - 44, x0 + 6, b - 43, WHITE[4])
        c.rect(x0 + 4, b - 45, x0 + 5, b - 40, WHITE[4])
        c.px(x0 + 3, b - 41, WHITE[4])
    roof_from_above(c, 6, 52, b - 58, 10, OAK)
    c.vl(59, b - 49, b - 47, IRON[1])
    lantern(c, 59, b - 41, frame)
    c = after(outline(c.im))
    steam(c, 28, b - 28, 4, 1, frame)
    return c.im


def pojangmacha(v=0, frame=0):
    """A pojangmacha: the orange tarpaulin tent bar, flap rolled up on the
    counter of pots and soju, plastic stools at the door."""
    c = C(60, 52)
    b = 50
    for k, y in enumerate(range(b - 43, b - 35)):
        x0 = max(3, 8 - k)
        c.hl(x0, 59 - x0, y, TARP[5] if k < 3 else TARP[4])
    c.rect(3, b - 35, 56, b, TARP[3])
    c.rect(3, b - 35, 6, b, TARP[4])
    c.rect(52, b - 35, 56, b, TARP[2])
    c.hl(3, 56, b - 35, TARP[2])
    for x in (12, 47):
        c.vl(x, b - 34, b, TARP[2])
    for x in (8, 48):
        c.rect(x - 1, b - 27, x + 4, b - 15, TARP[1])
        c.rect(x, b - 26, x + 3, b - 16, '#c0d0cc')
        c.vl(x, b - 26, b - 16, '#e4eeea')
    c.rect(17, b - 29, 43, b, '#2c1a16')
    c.rect(16, b - 32, 44, b - 30, TARP[5])
    c.hl(16, 44, b - 29, TARP[1])
    c.rect(30, b - 28, 31, b - 27, YELLOW[5 if frame % 2 == 0 else 4])
    box(c, 19, b - 16, 38, b - 4, 4, STEEL, lean=2)
    c.rect(21, b - 20, 27, b - 18, PLASTIC_RED[3])
    c.hl(22, 24, b - 19, PLASTIC_RED[5])
    for x in (29, 31):
        c.rect(x, b - 24, x, b - 19, GREEN[4])
    drum(c, 36, b - 23, b - 19, 3.5, 1.3, STEEL, top=STEEL)
    stool(c, 10, b, PLASTIC_BLUE, r=4, h=8)
    stool(c, 50, b, PLASTIC_RED, r=4, h=8)
    c = after(outline(c.im))
    steam(c, 36, b - 25, 4, 1, frame)
    steam(c, 23, b - 21, 5, -1, frame + 2)
    return c.im


def yakiimo(v=0, frame=0):
    """The stone-roast sweet potato man's handcart: oven box and stovepipe,
    a red banner, a lantern for the evening round."""
    c = C(62, 60)
    b = 58
    c.rect(41, b - 55, 42, b - 22, OAK[3])
    c.rect(43, b - 54, 50, b - 30, RED[2])
    c.vl(43, b - 54, b - 30, RED[3])
    c.hl(43, 50, b - 30, RED[1])
    for y in range(b - 52, b - 34, 5):
        c.rect(45, y, 48, y + 2, WHITE[4])
        c.px(46 + (y % 2), y + 1, RED[2])
    c.rect(38, b - 16, 59, b - 15, OAK[3])
    c.hl(38, 59, b - 16, OAK[5])
    c.rect(58, b - 19, 59, b - 12, OAK[2])
    c.rect(5, b - 10, 6, b, OAK[2])
    box(c, 4, b - 20, 38, b - 10, 4, OAK, lean=2)
    for x in range(10, 38, 7):
        c.vl(x, b - 18, b - 11, OAK[2])
    box(c, 8, b - 36, 30, b - 25, 4, STEEL, lean=2)
    c.rect(11, b - 39, 29, b - 38, '#3a3438')
    for x in range(12, 29, 3):
        c.px(x, b - 39 + x % 2, STEEL[3])
    for x in (15, 21):
        c.ellipse(x + .5, b - 38, 2.6, 1.5, CLAY[2])
        c.hl(x - 1, x, b - 39, CLAY[4])
    c.rect(12, b - 33, 21, b - 27, STEEL[1])
    c.rect(13, b - 32, 20, b - 28, ORANGE[2 + frame % 2])
    c.hl(14, 19, b - 29, YELLOW[4])
    c.rect(23, b - 31, 24, b - 29, STEEL[5])
    drum(c, 27, b - 52, b - 40, 2, 0.8, STEEL, top=False)
    c.rect(24, b - 54, 30, b - 53, STEEL[2])
    c.hl(24, 30, b - 54, STEEL[4])
    lantern(c, 35, b - 30, frame, r=3)
    wheel(c, 21, b - 8, 8, IRON, OAK, 10)
    c = after(outline(c.im))
    steam(c, 25, b - 55, 3, -1, frame, SMOKE)
    steam(c, 28, b - 56, 2, 1, frame + 2, SMOKE)
    return c.im


def maru_post(v=0):
    """The round red pillar postbox of the Japanese street corner."""
    c = C(20, 46)
    b, cx = 44, 10
    drum(c, cx, b - 4, b - 2, 8, 2.4, CONCRETE)
    drum(c, cx, b - 33, b - 5, 6.5, 2, PLASTIC_RED, top=False)
    drum(c, cx, b - 36, b - 34, 7.5, 2.4, PLASTIC_RED, top=False)
    sphere(c, cx, b - 36, 7.5, PLASTIC_RED, lo=2, flat=0.5)
    c.rect(cx - 1, b - 41, cx, b - 40, PLASTIC_RED[3])
    c.hl(cx - 5, cx + 3, b - 29, PLASTIC_RED[5])
    c.rect(cx - 4, b - 28, cx + 2, b - 27, '#1a0c10')
    c.rect(cx - 3, b - 22, cx + 1, b - 17, WHITE[4])
    c.hl(cx - 2, cx, b - 21, RED[1])
    c.hl(cx - 2, cx, b - 19, STEEL[2])
    hoop(c, cx, b - 12, 6.5, 2, PLASTIC_RED[1])
    return outline(c.im)


def mizunomiba(v=0, frame=0):
    """A park water fountain: concrete pedestal, steel basin, the upturned
    bubbler and a tap at the side."""
    c = C(26, 36)
    b = 34
    c.ellipse(11, b - 1, 10, 2.4, CONCRETE[2])
    box(c, 5, b - 20, 15, b - 1, 4, CONCRETE, lean=2)
    c.rect(8, b - 23, 15, b - 22, STEEL[2])
    c.hl(8, 14, b - 23, STEEL[1])
    c.rect(11, b - 28, 12, b - 23, STEEL[4])
    c.vl(12, b - 28, b - 23, STEEL[2])
    c.rect(10, b - 30, 13, b - 29, STEEL[5])
    c.rect(18, b - 13, 21, b - 12, STEEL[4])
    c.rect(20, b - 15, 21, b - 14, STEEL[3])
    c.rect(20, b - 11, 21, b - 10, STEEL[2])
    c.rect(8, b - 16, 12, b - 12, CONCRETE[2])
    c = after(outline(c.im))
    for i, (dx, dy) in enumerate(((0, -32), (1, -33), (2, -33), (3, -32), (4, -30), (4, -28))):
        if (i - frame) % 4 != 3:
            c.px(12 + dx, b + dy, '#b6e2dc' if i % 2 else '#f0faf4')
    return c.im


def tteokbokki(v=0, frame=0):
    """A bunsik cart: tteokbokki simmering red, fish-cake skewers standing in
    broth, a tray of fritters, under a striped awning."""
    c = C(58, 60)
    b = 58
    for x in (5, 48):
        c.rect(x, b - 51, x + 1, b - 27, STEEL[3])
        c.vl(x, b - 51, b - 27, STEEL[5])
    wheel(c, 12, b - 4, 4.5, IRON, STEEL, 6)
    wheel(c, 40, b - 4, 4.5, IRON, STEEL, 6)
    box(c, 3, b - 21, 46, b - 8, 7, STEEL, lean=3)
    c.rect(5, b - 19, 44, b - 10, PLASTIC_RED[2])
    c.hl(5, 44, b - 19, PLASTIC_RED[3])
    c.rect(13, b - 17, 36, b - 12, WHITE[4])
    for x in range(15, 35, 5):
        c.rect(x, b - 16, x + 2, b - 13, PLASTIC_RED[2])
        c.px(x + 1, b - 15, WHITE[4])
    c.rect(6, b - 27, 19, b - 23, STEEL[1])
    c.rect(7, b - 27, 18, b - 24, PLASTIC_RED[3])
    for i, x in enumerate(range(8, 18, 3)):
        c.hl(x, x + 1, b - 26 + (i + frame // 2) % 2, WHITE[4])
    c.px(10 + frame, b - 25, PLASTIC_RED[5])
    c.rect(22, b - 27, 35, b - 23, STEEL[1])
    c.rect(23, b - 27, 34, b - 24, '#c8a868')
    c.rect(38, b - 27, 47, b - 23, STEEL[1])
    c.rect(39, b - 27, 46, b - 24, YELLOW[3])
    for x in (40, 43, 45):
        c.hl(x, x + 1, b - 26 + x % 2, ORANGE[3])
    for k, y in enumerate(range(b - 57, b - 48)):
        f = min(4, k)
        for x in range(4 - f, 51 + f):
            ramp = PLASTIC_RED if ((x + 1) // 5) % 2 == 0 else WHITE
            if k == 8 and x % 5 == 3:
                continue
            c.px(x, y, ramp[5 if k < 4 else 4 if k < 7 else 3 if ramp is WHITE else 2])
    c = after(outline(c.im))
    for x in (25, 28, 31):
        c.vl(x, b - 33, b - 26, CANE[4])
        c.rect(x - 1, b - 29, x, b - 27, CLAY[4])
        c.px(x, b - 28, CLAY[3])
    steam(c, 12, b - 29, 6, 1, frame)
    steam(c, 33, b - 30, 5, -1, frame + 2)
    return c.im


def hydrangea(v=0):
    """Hydrangeas in a cedar tub bound with bamboo hoops."""
    c = C(38, 42)
    b, cx = 40, 19
    drum(c, cx, b - 13, b - 3, 10.5, 3.2, OAK, top=False)
    for y in (b - 11, b - 5):
        hoop(c, cx, y, 10.5, 3.2, CANE[4])
    c.ellipse(cx, b - 13, 10.5, 3.2, OAK[4])
    c.ellipse(cx, b - 13, 9, 2.3, SOIL)
    for dx, dy, r in ((-8, -18, 6), (8, -18, 6), (0, -23, 8), (-4, -15, 5), (5, -15, 5)):
        sphere(c, cx + dx, b + dy, r, LEAF, lo=1, hi=5, flat=0.8)
    for dx, dy, ramp in ((-9, -23, BLUE), (0, -29, PURPLE), (9, -22, BLUE), (-2, -19, PINK), (7, -29, BLUE), (-7, -30, PURPLE)):
        sphere(c, cx + dx, b + dy, 3.8, ramp, lo=2, hi=5)
    return outline(c.im)


def go_bench(v=0):
    """An evening bench with a go board on it, two bowls of stones and a
    cushion at each end."""
    c = C(64, 30)
    b = 28
    legs(c, (9, 55), b - 8, b - 4, [OAK[0]] * 4, w=2)
    legs(c, (4, 50), b - 8, b, OAK, w=2)
    box(c, 2, b - 11, 53, b - 9, 6, OAK, lean=4)
    box(c, 7, b - 15, 16, b - 14, 3, NAVY, lean=1)
    box(c, 44, b - 15, 53, b - 14, 3, LACQUER, lean=1)
    box(c, 24, b - 17, 35, b - 14, 5, CANE, lean=2)
    for x in range(26, 37, 2):
        c.vl(x, b - 22, b - 18, CANE[3])
    for x, y, col in ((27, -21, IRON[0]), (31, -20, WHITE[5]), (29, -19, IRON[0]), (33, -22, WHITE[5]), (35, -19, IRON[0]), (30, -22, WHITE[5])):
        c.px(x, b + y, col)
    for x, col in ((20, WHITE[5]), (40, IRON[0])):
        c.ellipse(x + .5, b - 14.5, 2.8, 1.7, OAK[1])
        c.hl(x - 1, x + 1, b - 15, col)
    return outline(c.im)


GROUPS = [
    ('CHINA', [
        ('Xiangqi table', xiangqi, 0), ('Sweet-potato oven', sweet_potato, 0), ('Baozi steamers', baozi, 0),
        ('Air walker', air_walker, 0), ('Pine in glazed jar', pine_pot, 0), ('Tanghulu pole', tanghulu, 0),
        ('Newspaper board', notice_board, 0), ('Park tea table', tea_table, 0),
    ]),
    ('JAPAN & KOREA', [
        ('Yatai', yatai, 0), ('Pojangmacha', pojangmacha, 0), ('Yaki-imo cart', yakiimo, 0),
        ('Pillar postbox', maru_post, 0), ('Water fountain', mizunomiba, 0), ('Tteokbokki cart', tteokbokki, 0),
        ('Hydrangea tub', hydrangea, 0), ('Go bench', go_bench, 0),
    ]),
]
