"""The square in South and South-East Asia: tea, paan and juice sellers, the
tree platform, the pavement restaurant. Same scale and view as plaza.py."""
import math

from art.props_b.plaza import (C, outline, after, sphere, mix, disc, drum, box, wheel, parasol, legs,
                               IRON, GREEN, OAK, LIME, LEAF, RED, WATER, STEEL, CONCRETE, BRASS, CANE,
                               WHITE, BLUE, YELLOW, ORANGE, PINK, PLASTIC_RED, PLASTIC_BLUE, CLAY, CLOTH)

TEAL = ['#0c2a2c', '#144446', '#1e6464', '#2e8a84', '#58b0a4', '#98d4c4']
TEA = ['#4a2810', '#6e4018', '#946028', '#b88444', '#d0a468', '#e4c490']
LIMEFRUIT = ['#3a5010', '#5a7a18', '#86a828', '#b4cc40', '#d8e468', '#f0f4a0']
COCO = ['#1c3a14', '#2c5a1c', '#44802a', '#68a43c', '#94c458', '#c4e088']
GLAZE = ['#2a1408', '#4e2a10', '#7a4818', '#a06a24', '#c08c38', '#dcb060']
BANYAN = ['#2a1e1c', '#46342c', '#64503e', '#846c52', '#a48a68']
PANE, PANE_HI, PANE_LO = '#bcd8da', '#e6f4f2', '#8fb4bc'
SWAY = (0, 1, 0, -1)


def steam(c, x, y, frame, n=6, col=WHITE[4]):
    """A rising curl that climbs one step a frame and loops in four."""
    for i in range(n):
        if (i - frame) % 4 != 3:
            c.px(x + (0, 1, 1, 0)[(i - frame) % 4], y - i, col if i < n - 2 else mix(col, '#b4aca4', 0.5))


def vessel(c, cx, y0, y1, widths, ramp):
    """A turned pot or bottle: half-widths from top to bottom, lit from the left."""
    hi, n = len(ramp) - 1, len(widths) - 1
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(1, y1 - y0) * n
        i = min(n - 1, int(t))
        half = widths[i] + (widths[i + 1] - widths[i]) * (t - i)
        for x in range(round(cx - half), round(cx + half)):
            g = (x + .5 - (cx - half)) / (2 * half)
            c.px(x, y, ramp[max(0, hi - (2 if g < 0.14 else 1 if g < 0.4 else 2 if g < 0.66 else 3 if g < 0.86 else 4))])


def glass_case(c, x0, y0, x1, y1, frame, d=2):
    """A glazed box: the pane, its top seen from above, a frame."""
    c.rect(x0, y0, x1, y1, PANE)
    c.rect(x0 + 1, y0 - d, x1 + 1, y0 - 1, PANE_HI)
    c.vl(x1, y0, y1, PANE_LO)
    for x in (x0, x1):
        c.vl(x, y0 - 1, y1, frame[2])
    c.hl(x0, x1, y0, frame[3])
    c.hl(x0, x1, y1, frame[1])


def tumblers(c, x, y, n, drink=TEA):
    for i in range(n):
        c.rect(x + i * 3, y - 3, x + i * 3 + 1, y, drink[3])
        c.hl(x + i * 3, x + i * 3 + 1, y - 4, PANE_HI)
        c.px(x + i * 3 + 1, y, drink[1])


def chai_stall(v=0, frame=0):
    """A tapri: plank counter under a tarpaulin, stove and kettle, glasses,
    biscuit jars, a bench for the customers."""
    c = C(74, 56)
    b = 54
    for x in (3, 42):
        c.rect(x, b - 46, x + 1, b - 24, CANE[2])
        c.vl(x, b - 46, b - 24, CANE[4])
    legs(c, (52, 68), b - 9, b, OAK, w=2)
    box(c, 50, b - 10, 69, b - 8, 3, OAK)
    box(c, 2, b - 20, 42, b, 6, OAK)
    c.rect(4, b - 17, 40, b - 3, TEAL[3])
    c.hl(4, 40, b - 17, TEAL[4])
    for x in (13, 22, 31):
        c.vl(x, b - 16, b - 3, TEAL[2])
    c.hl(4, 40, b - 3, TEAL[1])
    drum(c, 10, b - 27, b - 23, 4, 1.5, BRASS, top=False)
    c.hl(7, 12, b - 28, ORANGE[4] if frame % 2 == 0 else YELLOW[4])
    c.hl(8 + frame % 2, 10 + frame % 2, b - 28, BLUE[4])
    sphere(c, 10, b - 32, 4.6, STEEL, lo=1)
    c.hl(8, 11, b - 37, STEEL[4])
    c.px(10, b - 38, IRON[1])
    c.rect(4, b - 34, 5, b - 33, STEEL[4])
    c.px(3, b - 35, STEEL[5])
    drum(c, 21, b - 28, b - 24, 4, 1.6, STEEL, top=TEA)
    c.hl(25, 29, b - 28, IRON[1])
    tumblers(c, 27, b - 23, 3)
    tumblers(c, 28, b - 21, 2)
    for x, fill in ((35, TEA), (40, YELLOW)):
        c.rect(x - 2, b - 30, x + 1, b - 24, PANE)
        c.rect(x - 2, b - 28, x + 1, b - 24, fill[4])
        c.vl(x - 2, b - 30, b - 24, PANE_HI)
        c.vl(x + 1, b - 28, b - 24, fill[2])
        c.hl(x - 2, x + 1, b - 31, PLASTIC_RED[3])
        c.hl(x - 2, x + 1, b - 32, PLASTIC_RED[4])
    for k in range(6):
        y = b - 52 + k
        c.hl(0 + (k > 3), 47 - (k > 3), y, BLUE[4] if k < 2 else BLUE[3] if k < 4 else BLUE[2])
    c.hl(1, 46, b - 46, BLUE[1])
    for x in (12, 24, 36):
        c.vl(x, b - 51, b - 48, BLUE[2])
    c = after(outline(c.im))
    steam(c, 20, b - 31, frame)
    steam(c, 3, b - 37, frame + 2, n=4)
    for x in range(7, 14):
        c.px(x, b - 38 - round(2.2 * math.sin((x - 7) / 6 * math.pi)), IRON[1])
    return c.im


def paan_stall(v=0, frame=0):
    """A paan box: a cabin on legs just big enough to sit in, a brass tray of
    betel leaves on the ledge, tins behind, strings of sachets across the top."""
    c = C(40, 58)
    b = 56
    legs(c, (5, 30), b - 14, b, OAK, w=2)
    legs(c, (9, 27), b - 14, b - 3, OAK)
    c.rect(4, b - 47, 32, b - 13, TEAL[3])
    c.vl(4, b - 47, b - 13, TEAL[4])
    c.rect(33, b - 48, 35, b - 15, TEAL[1])
    c.hl(4, 32, b - 13, TEAL[1])
    c.rect(7, b - 43, 29, b - 22, '#2a1a22')
    c.rect(7, b - 43, 8, b - 22, '#3c2630')
    for i, x in enumerate(range(10, 28, 3)):
        col = (PLASTIC_RED, YELLOW, BLUE, WHITE, GREEN, ORANGE)[i]
        c.rect(x, b - 36, x + 1, b - 33, col[3])
        c.hl(x, x + 1, b - 37, col[4])
    c.hl(9, 28, b - 32, OAK[3])
    c.rect(11, b - 29, 25, b - 27, RED[2])
    c.hl(11, 25, b - 30, RED[3])
    for i, x in enumerate(range(8, 29, 3)):
        col = (YELLOW, PLASTIC_RED, WHITE, PINK, YELLOW, PLASTIC_BLUE, PLASTIC_RED)[i]
        dx = SWAY[(frame + i % 2 * 2) % 4] if i % 3 != 1 else 0
        c.rect(x, b - 42, x + 1, b - 41, col[4])
        c.rect(x + dx, b - 40, x + 1 + dx, b - 39, col[4])
        c.px(x + 1 + dx, b - 39, col[2])
    c.hl(7, 29, b - 43, IRON[1])
    box(c, 2, b - 22, 33, b - 20, 4, OAK, lean=2)
    disc(c, 12, b - 24, 6, 1.8, BRASS, thick=0)
    for x in (8, 11, 14):
        c.hl(x, x + 2, b - 24, LEAF[4])
        c.px(x + 1, b - 25, LEAF[5])
    for i, x in enumerate((21, 25, 29)):
        col = (STEEL, BRASS, STEEL)[i]
        c.rect(x, b - 26, x + 2, b - 23, col[3])
        c.hl(x, x + 2, b - 27, col[5])
        c.vl(x + 2, b - 26, b - 23, col[2])
    box(c, 1, b - 49, 34, b - 48, 4, STEEL, lean=3)
    for x in range(4, 36, 4):
        c.vl(x, b - 52, b - 50, STEEL[3])
    return outline(c.im)


def chaat_cart(v=0):
    """A pani-puri thela: four cycle wheels, a red cloth, a glass case of puris,
    steel pots and the clay pot of spiced water."""
    c = C(58, 48)
    b = 46
    for x in (10, 44):
        wheel(c, x, b - 7, 7, spoke=STEEL, n=10)
    box(c, 3, b - 20, 50, b - 17, 6, OAK)
    c.rect(3, b - 19, 50, b - 11, RED[2])
    c.hl(3, 50, b - 19, RED[3])
    for x in range(3, 51):
        c.vl(x, b - 11, b - 10 + (1 if (x // 4) % 2 == 0 else 0), RED[1 if x % 8 > 5 else 2])
    c.hl(8, 45, b - 15, YELLOW[3])
    glass_case(c, 6, b - 34, 24, b - 22, STEEL)
    for row, (x0, x1) in enumerate(((8, 22), (9, 21), (11, 20), (13, 18))):
        y = b - 23 - row * 2
        c.rect(x0, y - 1, x1, y, ORANGE[4])
        for x in range(x0, x1, 3):
            c.px(x, y - 1, ORANGE[5])
            c.px(x + 2, y, ORANGE[2])
    drum(c, 32, b - 28, b - 23, 4, 1.6, STEEL, top=['#3a2418', '#5a3a20', '#7a5428', '#94702e', '#a88838', '#c0a04a'])
    drum(c, 41, b - 27, b - 23, 3, 1.3, STEEL, top=LEAF[1:])
    vessel(c, 48, b - 31, b - 23, (2.5, 3, 5, 5.5, 4), CLAY)
    c.hl(46, 49, b - 32, CLAY[5])
    c.hl(46, 49, b - 31, '#2a2a20')
    c.rect(51, b - 22, 56, b - 21, OAK[2])
    return outline(c.im)


def cane_press(v=0):
    """A ganne-ka-ras cart: the iron roller press with its big hand wheel, a
    bundle of cane, glasses of juice."""
    c = C(62, 56)
    b = 54
    for i, x in enumerate((4, 7, 10, 13)):
        top = b - 52 + (i * 5) % 7
        c.rect(x, top, x + 1, b - 22, LIMEFRUIT[3] if i % 2 else YELLOW[4])
        c.vl(x + 1, top, b - 22, LIMEFRUIT[2] if i % 2 else YELLOW[2])
        for y in range(top + 4, b - 22, 6):
            c.hl(x, x + 1, y, GLAZE[2])
    c.hl(3, 15, b - 30, RED[2])
    for x in (12, 44):
        wheel(c, x, b - 7, 7, spoke=OAK, n=8)
    box(c, 2, b - 20, 54, b - 15, 6, GREEN)
    c.hl(6, 50, b - 17, YELLOW[3])
    box(c, 22, b - 34, 36, b - 22, 4, IRON, lean=2)
    for y in (b - 31, b - 27):
        c.rect(24, y, 34, y + 2, STEEL[3])
        c.hl(24, 34, y, STEEL[5])
        c.hl(24, 34, y + 2, STEEL[1])
    c.rect(18, b - 26, 21, b - 25, STEEL[4])
    c.rect(17, b - 24, 18, b - 22, LIMEFRUIT[4])
    wheel(c, 46, b - 36, 11, tyre=IRON, spoke=IRON, n=6)
    c.rect(37, b - 37, 46, b - 36, IRON[2])
    c.rect(49, b - 46, 52, b - 44, OAK[4])
    drum(c, 19, b - 24, b - 21, 3, 1.2, STEEL, top=LIMEFRUIT)
    tumblers(c, 5, b - 22, 3, LIMEFRUIT)
    return outline(c.im)


def chabutra(v=0, frame=0):
    """A banyan on its masonry platform: whitewashed rim to sit on, hanging
    roots, a red thread round the trunk and a daubed stone at its foot."""
    c = C(92, 96)
    b, cx = 94, 46
    wash = LIME[1:]
    drum(c, cx, b - 16, b - 7, 40, 9, wash, top=False)
    c.ellipse(cx, b - 16, 40, 9, wash[5])
    c.ellipse(cx, b - 16, 36, 7.4, '#a08a68')
    c.ellipse(cx - 3, b - 17, 28, 5, '#b49c78')
    for x in range(cx - 36, cx + 37, 9):
        t = (x - cx) / 40
        c.vl(x, b - 14 + round(9 * math.sqrt(1 - t * t)), b - 8 + round(9 * math.sqrt(1 - t * t)), wash[2])
    for x in range(cx - 14, cx + 15):
        t = (x - cx) / 14
        flute = (x - cx + 14) % 6
        col = BANYAN[(3, 4, 3, 2, 2, 1)[flute] if t < 0.3 else (2, 3, 2, 1, 1, 0)[flute]]
        flare = round(6 * abs(t) ** 3)
        c.vl(x, b - 62, b - 17 + round(3 * math.sqrt(1 - t * t)), col)
        if flare:
            c.vl(x - (1 if t < 0 else -1) * flare, b - 24, b - 16, col)
            c.hl(min(x, x - (1 if t < 0 else -1) * flare), max(x, x - (1 if t < 0 else -1) * flare), b - 17 + flare // 3, col)
    for x, top in ((cx - 27, 48), (cx + 24, 46), (cx - 20, 52), (cx + 31, 42)):
        foot = b - 15 - abs(x - cx) // 14
        c.rect(x, b - top, x + 2, foot, BANYAN[2])
        c.vl(x, b - top, foot, BANYAN[4])
        c.vl(x + 2, b - top, foot, BANYAN[1])
    c.hl(cx - 14, cx + 14, b - 30, RED[2])
    c.hl(cx - 14, cx + 13, b - 31, YELLOW[3])
    c.rect(cx - 20, b - 22, cx - 16, b - 17, CONCRETE[2])
    c.rect(cx - 19, b - 23, cx - 17, b - 22, CONCRETE[3])
    c.rect(cx - 19, b - 21, cx - 17, b - 19, ORANGE[3])
    disc(c, cx - 12, b - 15, 2.5, 1, BRASS, thick=0)
    c.px(cx - 12, b - 17, ORANGE[5])
    blobs = [(-30, 62, 13), (30, 60, 13), (-14, 56, 12), (14, 55, 12), (0, 60, 14), (-36, 52, 9), (37, 50, 9),
             (-24, 74, 14), (24, 73, 14), (-8, 80, 14), (10, 79, 14), (0, 70, 15), (-34, 66, 10), (35, 64, 10),
             (-16, 86, 9), (16, 85, 9), (0, 88, 9)]
    for dx, dy, r in sorted(blobs, key=lambda q: q[1]):
        sphere(c, cx + dx, b - dy, r, LEAF, lo=1, hi=5, flat=0.8)
    for i in range(40):
        x, y = cx - 38 + (i * 29) % 77, b - 90 + (i * 17) % 40
        if c.get(x, y)[3]:
            x += SWAY[frame] if i % 4 == 0 else 0
            c.hl(x, x + 1, y, LEAF[6 if i % 3 == 0 else 2])
    c = after(outline(c.im))
    for i, (x, top, n) in enumerate(((cx - 33, 44, 16), (cx - 22, 46, 10), (cx + 18, 44, 14), (cx + 34, 42, 12),
                                     (cx - 15, 44, 8), (cx + 12, 44, 9), (cx + 28, 40, 6), (cx - 29, 42, 7))):
        for k in range(n):
            c.px(x + (SWAY[(frame + i) % 4] if k > n // 2 else 0), b - top + k, BANYAN[2] if k % 4 else BANYAN[1])
    return c.im


def letterbox(v=0):
    """The red pillar letterbox of India Post."""
    c = C(18, 34)
    b, cx = 32, 9
    drum(c, cx, b - 3, b - 1, 7, 2, IRON, top=False)
    drum(c, cx, b - 23, b - 3, 6, 2, PLASTIC_RED, top=False)
    sphere(c, cx, b - 24, 6.5, PLASTIC_RED, lo=1, hi=5, flat=0.7)
    c.hl(cx - 7, cx + 6, b - 22, PLASTIC_RED[1])
    c.hl(cx - 7, cx + 6, b - 23, PLASTIC_RED[4])
    c.rect(cx - 1, b - 30, cx, b - 29, PLASTIC_RED[4])
    c.hl(cx - 4, cx + 2, b - 19, IRON[0])
    c.hl(cx - 4, cx + 2, b - 20, PLASTIC_RED[1])
    c.rect(cx - 3, b - 15, cx + 1, b - 11, WHITE[4])
    c.hl(cx - 2, cx, b - 14, IRON[2])
    c.hl(cx - 2, cx, b - 12, IRON[2])
    c.hl(cx - 6, cx + 5, b - 6, YELLOW[3])
    return outline(c.im)


def nimbu_cart(v=0):
    """A nimbu-pani and banta cart: a heap of limes, marble-stoppered soda
    bottles in their crate, a clay pot, a parasol."""
    c = C(56, 62)
    b = 60
    for x in (13, 41):
        wheel(c, x, b - 8, 8, spoke=OAK, n=8)
    box(c, 4, b - 20, 49, b - 16, 6, BLUE)
    c.hl(8, 45, b - 18, WHITE[4])
    c.rect(27, b - 46, 28, b - 24, OAK[2])
    for row, (n, y) in enumerate(((5, b - 23), (4, b - 26), (3, b - 29), (2, b - 32), (1, b - 35))):
        for i in range(n):
            sphere(c, 8 + row * 2 + i * 4, y, 2.4, LIMEFRUIT, lo=1)
    box(c, 31, b - 26, 45, b - 23, 3, OAK, lean=1)
    for i, x in enumerate(range(32, 46, 3)):
        c.rect(x, b - 33, x + 1, b - 27, COCO[3] if i % 2 else PANE_LO)
        c.vl(x, b - 33, b - 27, COCO[5] if i % 2 else PANE_HI)
        c.px(x, b - 34, COCO[4] if i % 2 else PANE)
    vessel(c, 49, b - 30, b - 22, (2, 2.5, 4.5, 4.5, 3), CLAY)
    tumblers(c, 24, b - 22, 2, LIMEFRUIT)
    parasol(c, 27.5, b - 46, 24, 8, 5, [PLASTIC_RED, YELLOW, GREEN, WHITE], n=8)
    return outline(c.im)


def hand_pump(v=0, frame=0):
    """A municipal lever hand pump on its concrete apron, a brass lota under
    the spout."""
    c = C(40, 38)
    b = 36
    disc(c, 19, b - 5, 17, 5, CONCRETE, thick=3)
    c.ellipse(13, b - 5, 6, 2, CONCRETE[2])
    drum(c, 22, b - 20, b - 6, 2.5, 1, STEEL, top=False)
    box(c, 19, b - 28, 25, b - 21, 2, STEEL, lean=1)
    c.rect(14, b - 19, 19, b - 17, STEEL[3])
    c.hl(14, 19, b - 19, STEEL[5])
    c.rect(14, b - 16, 15, b - 15, STEEL[2])
    for k in range(13):
        c.rect(26 + k, b - 27 + k // 2 + (1 if k > 8 else 0), 26 + k, b - 26 + k // 2 + (1 if k > 8 else 0), STEEL[4 if k < 9 else 3])
    c.px(22, b - 30, IRON[1])
    vessel(c, 14, b - 12, b - 5, (2, 1.5, 3.5, 4, 2.5), BRASS)
    c.hl(12, 15, b - 13, BRASS[5])
    c = after(outline(c.im))
    c.px(14, b - 15 + frame, WATER[4])
    if frame == 3:
        c.px(13, b - 13, WATER[5])
    return c.im


def kaki_lima(v=0, frame=0):
    """An Indonesian kaki lima: glazed cabinet on one axle and a prop leg, the
    pot at the end, push handles. 0 blue bakso cart, 1 green."""
    paint = (BLUE, GREEN)[v]
    c = C(58, 60)
    b = 58
    c.rect(48, b - 12, 49, b, OAK[2])
    c.rect(0, b - 22, 8, b - 21, OAK[3])
    c.rect(49, b - 50, 50, b - 28, paint[2])
    box(c, 7, b - 24, 50, b - 11, 5, paint)
    c.rect(10, b - 21, 47, b - 14, WHITE[4])
    c.rect(11, b - 20, 46, b - 15, paint[3])
    for x in (18, 28, 38):
        c.rect(x, b - 18, x + 2, b - 17, YELLOW[3] if v == 0 else PLASTIC_RED[3])
    wheel(c, 26, b - 8, 8, spoke=STEEL, n=10)
    glass_case(c, 9, b - 46, 35, b - 30, paint, d=0)
    c.vl(22, b - 46, b - 30, paint[2])
    c.hl(10, 34, b - 38, paint[3])
    for x in (12, 16, 26, 30):
        c.rect(x, b - 41, x + 2, b - 39, WHITE[4])
        c.hl(x, x + 2, b - 39, BLUE[3])
    for x in range(11, 21, 3):
        sphere(c, x + 1, b - 32, 1.6, TEA, lo=2)
    c.rect(24, b - 34, 33, b - 31, YELLOW[4])
    c.hl(24, 33, b - 31, YELLOW[2])
    c.rect(25, b - 36, 27, b - 35, LEAF[4])
    c.rect(11, b - 45, 33, b - 43, PLASTIC_RED[3])
    for x in range(13, 32, 3):
        c.px(x, b - 44, WHITE[5])
    drum(c, 43, b - 36, b - 30, 5, 1.8, STEEL)
    c.px(43, b - 38, IRON[1])
    box(c, 5, b - 50, 51, b - 49, 4, paint, lean=3)
    c.hl(6, 51, b - 48, WHITE[4])
    c = after(outline(c.im))
    steam(c, 44, b - 39, frame, n=5)
    return c.im


def pstool(c, x, b, ramp, h=9):
    """The moulded plastic stool of the pavement restaurant."""
    c.rect(x, b - h + 3, x + 1, b, ramp[2])
    c.rect(x + 7, b - h + 3, x + 8, b, ramp[1])
    c.hl(x + 2, x + 6, b - 4, ramp[1])
    c.rect(x, b - h + 2, x + 8, b - h + 3, ramp[3])
    c.hl(x, x + 8, b - h + 1, ramp[4])
    c.hl(x + 1, x + 9, b - h, ramp[5])
    c.hl(x + 4, x + 5, b - h, ramp[1])


def noodle_cart(v=0, frame=0):
    """A Thai or Vietnamese noodle cart: steel body, glass case of noodles and
    greens, the broth pot, a side counter with stools, a market umbrella."""
    c = C(74, 70)
    b = 68
    for x in (34, 54):
        wheel(c, x, b - 5, 5, spoke=STEEL, n=6)
    legs(c, (5, 20), b - 14, b, STEEL, w=2)
    box(c, 3, b - 17, 23, b - 15, 4, STEEL, lean=2)
    box(c, 27, b - 24, 60, b - 9, 6, STEEL)
    c.hl(30, 57, b - 20, STEEL[5])
    c.rect(30, b - 17, 57, b - 12, STEEL[2])
    c.hl(30, 57, b - 17, STEEL[4])
    c.rect(43, b - 52, 44, b - 30, STEEL[2])
    glass_case(c, 29, b - 41, 44, b - 30, STEEL)
    for x in (31, 36, 41):
        sphere(c, x, b - 33, 2.2, YELLOW, lo=2)
    c.rect(30, b - 38, 35, b - 36, LEAF[4])
    c.hl(30, 35, b - 36, LEAF[2])
    c.rect(37, b - 38, 42, b - 37, PLASTIC_RED[3])
    c.hl(37, 42, b - 36, PLASTIC_RED[1])
    drum(c, 53, b - 36, b - 29, 6, 2.2, STEEL, top=['#4a2c14', '#6a4420', '#8a6230', '#a87e44', '#c09a5c', '#d4b47c'])
    c.rect(4, b - 22, 5, b - 19, PLASTIC_RED[3])
    c.rect(7, b - 22, 8, b - 19, TEA[2])
    c.rect(10, b - 22, 11, b - 19, YELLOW[3])
    c.hl(4, 11, b - 23, WHITE[5])
    drum(c, 17, b - 21, b - 19, 2, 0.8, STEEL)
    pstool(c, 1, b, PLASTIC_RED)
    pstool(c, 13, b, PLASTIC_BLUE)
    parasol(c, 43.5, b - 52, 30, 9, 6, [PLASTIC_RED, YELLOW, PLASTIC_BLUE, WHITE, COCO, ORANGE], n=12)
    c = after(outline(c.im))
    steam(c, 52, b - 38, frame, n=7)
    steam(c, 55, b - 37, frame + 2, n=5)
    return c.im


def pavement_set(v=0):
    """The pavement restaurant: a folding steel table, plastic stools, the
    condiment caddy and the roll of tissue."""
    c = C(62, 38)
    b = 36
    pstool(c, 1, b - 6, PLASTIC_RED)
    pstool(c, 50, b - 6, PLASTIC_BLUE)
    legs(c, (17, 41), b - 14, b - 1, STEEL, w=2)
    c.hl(19, 40, b - 6, STEEL[2])
    box(c, 14, b - 16, 44, b - 15, 7, STEEL, lean=3)
    c.hl(18, 45, b - 20, STEEL[4])
    for i, col in enumerate((PLASTIC_RED, YELLOW, TEA, COCO)):
        c.rect(20 + i * 3, b - 25, 21 + i * 3, b - 21, col[3])
        c.hl(20 + i * 3, 21 + i * 3, b - 26, WHITE[5])
    drum(c, 36, b - 25, b - 20, 2.5, 1, PINK, top=WHITE)
    drum(c, 41, b - 22, b - 18, 1.6, 0.7, STEEL, top=False)
    for x in (40, 41, 42):
        c.vl(x, b - 27, b - 23, CANE[4 if x % 2 else 2])
    pstool(c, 15, b, PLASTIC_BLUE)
    pstool(c, 35, b, PLASTIC_RED)
    return outline(c.im)


def coconut_stand(v=0):
    """Green drinking coconuts in a heap, the chopping block and cleaver, a
    cooler box."""
    c = C(58, 36)
    b = 34
    for row, n in enumerate((6, 5, 4, 2)):
        for i in range(n):
            x, y = 5 + row * 3 + (row == 3) * 2 + i * 6, b - 4 - row * 5
            sphere(c, x, y, 3.9, COCO, lo=1)
            if (i + row) % 3 == 0:
                c.hl(x - 1, x + 1, y - 3, '#ece4c4')
                c.px(x, y - 4, '#d4c8a0')
    drum(c, 42, b - 9, b - 2, 5, 2, OAK, top=CANE)
    c.rect(41, b - 16, 46, b - 12, STEEL[4])
    c.hl(41, 46, b - 16, STEEL[5])
    c.vl(46, b - 16, b - 12, STEEL[2])
    c.rect(44, b - 11, 45, b - 10, STEEL[4])
    c.rect(47, b - 19, 48, b - 15, OAK[2])
    box(c, 50, b - 11, 55, b - 1, 3, ORANGE, lean=1)
    c.rect(50, b - 14, 56, b - 12, WHITE[4])
    c.hl(50, 55, b - 11, WHITE[2])
    return outline(c.im)


def iced_drinks(v=0):
    """An iced-drink stall: jars of red sala, green pandan, orange tea and pink
    milk, a block of ice, cups, a painted board overhead."""
    c = C(52, 56)
    b = 54
    for x in (3, 45):
        c.rect(x, b - 48, x + 1, b - 20, CANE[2])
        c.vl(x, b - 48, b - 20, CANE[4])
    legs(c, (4, 44), b - 4, b, OAK, w=2)
    box(c, 2, b - 19, 46, b - 4, 6, PLASTIC_BLUE)
    for x in range(2, 47):
        c.vl(x, b - 4, b - 4 + (1 if (x // 5) % 2 else 0), PLASTIC_BLUE[2])
    c.hl(2, 46, b - 12, WHITE[4])
    for i, col in enumerate((PLASTIC_RED, COCO, ORANGE, PINK)):
        x = 5 + i * 7
        c.rect(x, b - 33, x + 4, b - 23, PANE)
        c.rect(x, b - 30, x + 4, b - 23, col[3])
        c.vl(x, b - 33, b - 23, PANE_HI)
        c.vl(x + 1, b - 30, b - 24, col[5])
        c.vl(x + 4, b - 30, b - 23, col[2])
        c.hl(x, x + 4, b - 23, col[1])
        c.rect(x, b - 35, x + 4, b - 34, STEEL[4])
        c.hl(x, x + 4, b - 34, STEEL[2])
    box(c, 34, b - 27, 41, b - 22, 3, ['#6a94b0', '#94bcd0', '#bcdce8', '#dceef4', '#f4fcff'], lean=1)
    c.px(36, b - 25, WHITE[5])
    c.px(39, b - 24, WHITE[5])
    c.rect(43, b - 28, 45, b - 22, WHITE[4])
    for y in range(b - 27, b - 22, 2):
        c.hl(43, 45, y, WHITE[2])
    c.rect(1, b - 52, 48, b - 45, YELLOW[3])
    c.hl(1, 48, b - 52, YELLOW[5])
    c.hl(1, 48, b - 45, YELLOW[1])
    for x in range(5, 44, 5):
        c.rect(x, b - 50, x + 2, b - 47, PLASTIC_RED[2])
        c.px(x + 1, b - 48, YELLOW[3])
    return outline(c.im)


def banh_mi(v=0, frame=0):
    """A banh mi cabinet on a steel stand with a charcoal trough of skewers
    beside it."""
    c = C(56, 54)
    b = 52
    legs(c, (4, 27), b - 22, b, STEEL, w=2)
    c.hl(6, 26, b - 8, STEEL[2])
    box(c, 3, b - 24, 29, b - 22, 3, STEEL, lean=1)
    glass_case(c, 4, b - 44, 28, b - 27, STEEL, d=3)
    c.rect(5, b - 43, 27, b - 40, PLASTIC_RED[3])
    for x in range(7, 26, 4):
        c.rect(x, b - 42, x + 1, b - 41, YELLOW[4])
    for row, y in enumerate((b - 29, b - 33, b - 36)):
        for x in range(6 + row, 22, 7):
            c.rect(x, y - 1, x + 5, y, ORANGE[4])
            c.hl(x + 1, x + 4, y - 1, ORANGE[5])
            c.px(x + 5, y, ORANGE[2])
    c.rect(22, b - 31, 26, b - 28, LEAF[4])
    c.hl(22, 26, b - 31, PLASTIC_RED[3])
    legs(c, (35, 50), b - 15, b, IRON, w=2)
    box(c, 33, b - 18, 51, b - 14, 4, IRON, lean=2)
    for x in range(35, 52):
        hot = (x * 7 + frame * 3) % 5
        c.px(x, b - 20, ORANGE[5] if hot == 0 else ORANGE[3] if hot < 3 else RED[1])
        c.px(x + 1, b - 21, ORANGE[3] if hot == 1 else RED[1] if hot < 4 else ORANGE[4])
    for x in range(36, 51, 3):
        c.rect(x, b - 23, x + 1, b - 20, TEA[2])
        c.px(x, b - 23, TEA[4])
        c.px(x, b - 19, CANE[4])
    c = after(outline(c.im))
    steam(c, 40, b - 25, frame, n=8, col='#d8d4d0')
    steam(c, 46, b - 25, frame + 2, n=6, col='#d8d4d0')
    return c.im


def dragon_jar(v=0, frame=0):
    """A brown-glazed dragon jar planted with bougainvillea."""
    c = C(40, 56)
    b, cx = 54, 20
    for x0, x1, top in ((cx - 2, cx - 9, 40), (cx, cx + 1, 46), (cx + 2, cx + 10, 38)):
        for k in range(top - 22):
            x = x0 + round((x1 - x0) * (k / (top - 22)) ** 1.5)
            c.rect(x, b - 23 - k, x + 1, b - 23 - k, GLAZE[2])
    vessel(c, cx, b - 23, b - 1, (7, 6.5, 10.5, 12, 10.5, 7.5), GLAZE)
    c.ellipse(cx, b - 23, 7, 1.6, GLAZE[5])
    c.ellipse(cx, b - 23, 5.5, 1, '#2a1c14')
    for x in range(cx - 10, cx + 10):
        y = b - 12 + round(1.6 * math.sin((x - cx) * 0.8))
        c.px(x, y, GLAZE[5] if x < cx + 2 else GLAZE[4])
        if (x - cx) % 5 == 0:
            c.px(x, y - 2, GLAZE[5] if x < cx + 2 else GLAZE[4])
    c.rect(cx - 12, b - 13, cx - 10, b - 12, GLAZE[5])
    blooms = [(-2, 38, 8, 1), (6, 42, 7, 1), (-8, 43, 7, 1), (-11, 38, 6, 0), (-3, 47, 6, 0), (10, 40, 6, 0),
              (3, 35, 5, 0), (-7, 32, 5, 1), (12, 47, 5, 0), (-14, 31, 4, 0), (15, 32, 4, 0), (3, 51, 4, 0),
              (-11, 49, 4, 0), (9, 31, 4, 1)]
    for i, (dx, dy, r, leafy) in enumerate(blooms):
        sx = SWAY[(frame + i) % 4] if i % 3 == 0 else 0
        sphere(c, cx + dx + sx, b - dy, r, LEAF if leafy else PINK, lo=1, hi=5, flat=0.85)
    return outline(c.im)


def water_jars(v=0):
    """Roadside drinking water: lidded clay pots on a roofed shelf, a
    coconut-shell dipper, a cup. Set out as merit in Thailand and Burma."""
    c = C(42, 60)
    b = 58
    for x in (5, 33):
        c.rect(x, b - 46, x + 1, b, OAK[3])
        c.vl(x, b - 46, b, OAK[5])
    c.hl(7, 32, b - 6, OAK[2])
    box(c, 3, b - 19, 36, b - 17, 5, OAK, lean=2)
    for x in (13, 28):
        vessel(c, x, b - 33, b - 21, (3.5, 3, 6, 7, 6, 4), CLAY)
        disc(c, x, b - 34, 4.5, 1.5, CANE, thick=0)
        c.px(x, b - 36, OAK[2])
    c.rect(19, b - 25, 21, b - 22, STEEL[4])
    c.hl(19, 21, b - 26, STEEL[5])
    c.rect(36, b - 40, 36, b - 30, CANE[3])
    sphere(c, 36.5, b - 28, 2.6, GLAZE, lo=1)
    for k in range(7):
        col = CLAY[3] if k % 2 == 0 else CLAY[2]
        c.hl(3 - k // 2 + 3, 36 + k // 2 - 3 + 3, b - 52 + k, CLAY[4] if k == 0 else col)
    c.hl(1, 40, b - 45, CLAY[1])
    for x in range(4, 38, 4):
        c.vl(x + 1, b - 51, b - 46, CLAY[1])
    return outline(c.im)


GROUPS = [
    ('SOUTH ASIA', [
        ('Chai stall', chai_stall, 0), ('Paan stall', paan_stall, 0), ('Chaat cart', chaat_cart, 0),
        ('Cane press', cane_press, 0), ('Banyan platform', chabutra, 0), ('Letterbox', letterbox, 0),
        ('Lime soda', nimbu_cart, 0), ('Hand pump', hand_pump, 0)]),
    ('SOUTH-EAST ASIA', [
        ('Kaki lima', kaki_lima, 0), ('Kaki lima, green', kaki_lima, 1), ('Noodle cart', noodle_cart, 0),
        ('Pavement table', pavement_set, 0), ('Coconut stand', coconut_stand, 0), ('Iced drinks', iced_drinks, 0),
        ('Banh mi and skewers', banh_mi, 0), ('Dragon jar', dragon_jar, 0), ('Water jars', water_jars, 0)]),
]
