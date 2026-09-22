"""Small, dated street details. Clear silhouettes before surface ornament."""
from .core import Canvas, RAMPS


def slab(c, x0, y0, x1, y1, stone):
    c.rect(x0, y0, x1, y1, stone[4])
    c.hline(x0, x1, y0, stone[6]); c.vline(x0, y0 + 1, y1 - 1, stone[5])
    c.hline(x0, x1, y1, stone[1]); c.vline(x1, y0 + 1, y1, stone[2])


def saint_niche(v=0):
    c = Canvas(25, 39)
    stone, tile, wood = RAMPS['limestone'], RAMPS['terracotta7'], RAMPS['walnut7']
    blue, gold = RAMPS['paintblue7'], RAMPS['brasspot7']
    if v == 0:
        slab(c, 10, 23, 14, 36, wood)
        slab(c, 7, 36, 17, 38, stone)
        slab(c, 5, 9, 19, 24, wood)
    else:
        slab(c, 7, 27, 17, 35, stone)
        slab(c, 4, 35, 20, 38, stone)
        slab(c, 4, 8, 20, 28, stone)
        c.hline(4, 19, 26, stone[5])
    c.rect(7, 12, 17, 24, stone[1]); c.rect(8, 11, 16, 23, '#253844')
    c.hline(9, 15, 10, stone[2]); c.vline(7, 12, 23, stone[2])
    # A plain tiled gable and a small cross.
    for y in range(3, 11):
        half = (y - 3) * 10 // 7
        c.hline(12 - half, 12 + half, y, tile[4] if y % 2 else tile[3])
        c.set(12 - half, y, tile[5]); c.set(12 + half, y, tile[2])
    c.hline(2, 22, 10, tile[1])
    c.vline(12, 0, 3, wood[3]); c.hline(11, 13, 1, wood[3])
    # A readable gilded halo and blue robe, not an invented named saint.
    c.rect(10, 12, 14, 15, gold[4]); c.hline(11, 13, 11, gold[6])
    c.rect(11, 13, 13, 15, RAMPS['buffclay7'][6]); c.set(13, 14, wood[2])
    c.poly([(11, 16), (13, 16), (16, 23), (9, 23)], blue[4])
    c.vline(11, 17, 22, blue[6]); c.vline(14, 19, 23, blue[2])
    if v == 2:
        c.rect(13, 17, 15, 20, tile[4]); c.set(14, 16, RAMPS['buffclay7'][6])
    else:
        c.set(10, 18, RAMPS['buffclay7'][6]); c.hline(12, 14, 19, gold[4])
    slab(c, 5, 25, 19, 27, wood if v == 0 else stone)
    for x in (7, 17):
        c.vline(x, 22, 24, RAMPS['linen7'][5]); c.set(x, 21, gold[6])
    c.hline(9, 15, 28, RAMPS['greenglaze7'][2]); c.set(10, 27, tile[5]); c.set(15, 27, RAMPS['linen7'][6])
    return c.image()


def grave_stone(v=0):
    """A raised kerb over the grave, a tall stone at the head and a short one
    at the foot. v//2: pointed, rounded, Ottoman turban; v%2: axis."""
    c = Canvas(27, 30)
    stone = RAMPS['sandstone'] if v // 2 == 1 else RAMPS['limestone']
    earth, grass = RAMPS['walnut7'], RAMPS['greenglaze7']
    if v % 2:
        x0, y0, x1, y1 = 2, 21, 24, 28
        head, foot = (4, 23), (22, 23)
    else:
        x0, y0, x1, y1 = 8, 16, 18, 28
        head, foot = (13, 18), (13, 26)
    # Kerb: a lit top rim, a darker front face, earth and a little grass inside.
    c.rect(x0, y0, x1, y1, stone[3])
    c.hline(x0, x1, y0, stone[5]); c.vline(x0, y0, y1 - 1, stone[5])
    c.hline(x0, x1, y1, stone[1]); c.hline(x0, x1, y1 - 1, stone[2]); c.vline(x1, y0 + 1, y1, stone[2])
    c.rect(x0 + 2, y0 + 2, x1 - 2, y1 - 3, earth[2])
    c.hline(x0 + 2, x1 - 2, y0 + 2, earth[1])
    for i, (x, y) in enumerate([(x0 + 3, y1 - 4), (x1 - 3, y0 + 3), ((x0 + x1) // 2, (y0 + y1) // 2)]):
        c.set(x, y, grass[3 + i % 2])

    def stele(cx, base, h, w=2):
        c.rect(cx - w, base - h, cx + w, base, stone[4])
        c.vline(cx - w, base - h, base, stone[6]); c.vline(cx + w, base - h + 1, base, stone[2])
        c.hline(cx - w, cx + w, base, stone[1])
        return base - h

    fx, fy = foot
    top = stele(fx, fy, 5, 1)
    c.hline(fx - 1, fx + 1, top - 1, stone[5])
    hx, hy = head
    top = stele(hx, hy, 11)
    kind = v // 2
    if kind == 0:
        c.hline(hx - 1, hx + 1, top - 1, stone[5]); c.set(hx, top - 2, stone[6])
    elif kind == 1:
        c.hline(hx - 1, hx + 1, top - 1, stone[5])
    else:
        # A carved turban on a short neck.
        c.hline(hx - 1, hx + 1, top - 1, stone[3])
        for dy, half in [(-2, 3), (-3, 3), (-4, 3), (-5, 2), (-6, 1)]:
            c.hline(hx - half, hx + half, top + dy, stone[5])
            c.set(hx + half, top + dy, stone[3])
        c.line((hx - 3, top - 3), (hx + 2, top - 5), stone[3])
        c.set(hx, top - 7, stone[6])
    # Two incised lines stand for an inscription without inventing one.
    for y in (top + 3, top + 5):
        c.hline(hx - 1, hx + 1, y, stone[3])
    return c.image()


def newspaper(c, x, y, w, h, variant=0):
    paper, ink = RAMPS['linen7'], RAMPS['blackiron7']
    c.rect(x, y, x + w - 1, y + h - 1, paper[5])
    c.hline(x, x + w - 1, y, paper[6]); c.vline(x + w - 1, y + 1, y + h - 1, paper[3])
    c.hline(x + 1, x + w - 3, y + 2, ink[2])
    if variant % 2: c.rect(x + 1, y + 4, x + 3, y + 6, ink[4])
    for row in range(y + 4, y + h - 1, 2):
        c.hline(x + 1, x + 2, row, paper[2]); c.hline(x + 4, x + w - 3, row, paper[2])


def newsstand(v=0):
    c = Canvas(32, 38)
    wood = RAMPS['walnut7'] if v < 2 else RAMPS['greenglaze7']
    iron = RAMPS['blackiron7']
    slab(c, 4, 24, 28, 33, wood)
    for x in (5, 26): slab(c, x, 33, x + 1, 37, wood)
    slab(c, 3, 23, 29, 25, wood)
    for i, x in enumerate((5, 13, 21)):
        newspaper(c, x, 14, 7, 10, i + v)
        c.hline(x, x + 6, 24, RAMPS['linen7'][3])
    for i, x in enumerate((6, 17)):
        newspaper(c, x, 27, 9, 5, i)
    if v:
        for x in (3, 28):
            c.vline(x, 8, 24, wood[2]); c.vline(x + 1, 9, 22, wood[5])
        roof = RAMPS['paintblue7'] if v == 1 else iron
        c.poly([(1, 8), (5, 3), (27, 3), (31, 8)], roof[3])
        c.hline(5, 26, 3, roof[5]); c.hline(1, 31, 8, roof[1])
        c.hline(2, 30, 7, roof[4])
        if v == 1:
            for x in (6, 14, 22): c.line((x, 4), (x - 2, 7), RAMPS['linen7'][4])
        else:
            c.rect(8, 9, 24, 12, wood[2]); c.hline(10, 21, 10, RAMPS['linen7'][5])
    return c.image()


def street_fountain(v=0):
    c = Canvas(29, 30)
    stone = RAMPS[['limestone', 'sandstone', 'granite'][v]]
    water = RAMPS['water']
    slab(c, 11, 3, 20, 19, stone)
    c.hline(12, 19, 2, stone[6])
    c.rect(13, 7, 18, 12, stone[3]); c.hline(14, 17, 6, stone[5])
    c.set(14, 8, stone[1]); c.set(17, 8, stone[1]); c.set(16, 10, stone[6])
    c.rect(15, 12, 17, 13, stone[1]); c.set(16, 13, water[5])
    slab(c, 3, 19, 25, 27, stone)
    c.rect(5, 18, 23, 22, stone[1]); c.rect(6, 19, 22, 21, water[2])
    c.hline(7, 14, 19, water[4]); c.hline(17, 21, 21, water[3])
    c.vline(16, 14, 20, water[5]); c.set(15, 20, water[4]); c.set(17, 20, water[6])
    c.hline(3, 25, 23, stone[5]); c.hline(4, 24, 24, stone[4])
    c.vline(14, 25, 27, stone[2]); c.set(7, 27, RAMPS['greenglaze7'][1])
    return c.image()


def notice_board(v=0):
    c = Canvas(27, 34)
    w = RAMPS['walnut7']; red = RAMPS['rustred7']
    for x in (4, 22): slab(c, x, 19, x + 1, 33, w)
    slab(c, 2, 6, 25, 23, w)
    c.rect(4, 8, 23, 21, red[2] if v == 2 else w[2])
    if v == 0:
        paper = RAMPS['linen7']
        c.rect(5, 9, 22, 20, paper[5]); c.hline(6, 21, 10, red[2])
        for y in (13, 16, 19):
            c.hline(7, 12, y, paper[2]); c.hline(15, 20, y, paper[2])
    else:
        newspaper(c, 5, 9, 8, 11, 0); newspaper(c, 14, 11, 8, 10, 1)
    c.hline(1, 26, 5, w[5]); c.hline(1, 26, 6, w[1])
    if v == 2:
        c.poly([(1, 5), (5, 2), (23, 2), (26, 5)], RAMPS['blackiron7'][3])
        c.hline(5, 23, 2, RAMPS['blackiron7'][5])
    return c.image()


def jizo(v=0):
    c = Canvas(24, 32)
    stone, red = RAMPS['granite'], RAMPS['rustred7']
    if v == 2:
        w = RAMPS['walnut7']
        for x in (3, 20): slab(c, x, 9, x + 1, 30, w)
        c.poly([(1, 9), (12, 2), (23, 9)], w[3]); c.line((1, 8), (12, 1), w[5]); c.hline(1, 23, 9, w[1])
    slab(c, 7, 28, 17, 31, stone)
    c.poly([(10, 18), (14, 18), (17, 27), (7, 27)], stone[4])
    c.line((10, 20), (9, 26), stone[5]); c.line((14, 21), (15, 26), stone[2])
    for y, half in [(11, 1), (12, 2), (13, 3), (14, 3), (15, 3), (16, 2), (17, 1)]:
        c.hline(12 - half, 12 + half, y, stone[5]); c.set(12 + half, y, stone[3])
    c.set(10, 14, stone[2]); c.set(14, 14, stone[2]); c.set(12, 16, stone[3]); c.set(12, 15, stone[6])
    if v:
        c.poly([(8, 18), (16, 18), (15, 22), (12, 24), (9, 22)], red[4])
        c.hline(9, 15, 18, red[6]); c.set(15, 20, red[2])
    c.rect(11, 22, 13, 24, stone[5]); c.vline(12, 22, 24, stone[3])
    c.set(5, 30, RAMPS['greenglaze7'][3]); c.set(5, 29, RAMPS['linen7'][6])
    return c.image()


def market_display(v=0):
    c = Canvas(29, 22)
    w = RAMPS['walnut7']
    slab(c, 3, 15, 26, 18, w)
    for x in (5, 23): slab(c, x, 18, x + 1, 21, w)
    if v == 0:
        for x, food in [(7, 'rustred7'), (15, 'straw'), (23, 'greenglaze7')]:
            c.hline(x - 3, x + 3, 12, RAMPS['buffclay7'][5])
            c.hline(x - 2, x + 2, 14, RAMPS['terracotta7'][2])
            c.rect(x - 2, 12, x + 2, 13, RAMPS['terracotta7'][4])
            c.poly([(x - 3, 11), (x, 8), (x + 3, 11)], RAMPS[food][4])
            c.set(x - 1, 10, RAMPS[food][6])
    elif v == 1:
        for x, y, key in [(5, 11, 'paintblue7'), (14, 11, 'rustred7'), (8, 7, 'linen7')]:
            p = RAMPS[key]; slab(c, x, y, x + 10, y + 4, p)
            c.hline(x + 1, x + 8, y + 2, p[5])
            c.set(x + 1, y + 3, p[2])
    else:
        for x, y in [(8, 10), (20, 10), (13, 5)]:
            p = RAMPS['wicker7']; slab(c, x - 4, y, x + 4, y + 4, p)
            for xx in range(x - 3, x + 4, 2): c.set(xx, y + 2, p[3])
            c.hline(x - 3, x + 3, y - 1, RAMPS['greenglaze7'][3]); c.set(x, y - 2, RAMPS['greenglaze7'][5])
    return c.image()


def water_station(v=0):
    c = Canvas(29, 29)
    w = RAMPS['walnut7']; straw = RAMPS['straw']
    slab(c, 3, 23, 26, 25, w)
    for x in (4, 24): slab(c, x, 11, x + 1, 28, w)
    if v != 2:
        c.poly([(1, 11), (5, 5), (24, 5), (28, 11)], straw[4])
        c.hline(5, 23, 5, straw[6]); c.hline(1, 28, 11, straw[2])
        for x in range(4, 26, 4): c.line((x, 7), (x - 1, 10), straw[3])
    clay = RAMPS['terracotta7'] if v != 1 else RAMPS['buffclay7']
    for x, y, r in [(10, 18, 5), (21, 19, 4)]:
        for yy, half in [(-5, 2), (-4, 2), (-3, r - 1), (-2, r), (-1, r), (0, r), (1, r - 1), (2, r - 2)]:
            for xx in range(-half, half + 1):
                c.set(x + xx, y + yy, clay[5] if xx < -1 else clay[4] if xx < 2 else clay[2])
        c.hline(x - 2, x + 2, y - 5, clay[1]); c.hline(x - 2, x + 1, y - 6, clay[6])
    c.hline(5, 8, 21, RAMPS['brasspot7'][5]); c.set(6, 22, RAMPS['brasspot7'][2])
    return c.image()


DETAILS = {'saint-niche': saint_niche, 'burial-stone': grave_stone,
           'newsstand': newsstand, 'street-fountain': street_fountain,
           'street-notice': notice_board, 'jizo': jizo,
           'market-display': market_display, 'water-station': water_station}
