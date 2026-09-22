"""Small ground-anchored signs: shared construction, hand-set trade glyphs."""
from .core import Canvas, RAMPS

GLYPHS = [
 ['..####...', '...###...', '..#####..', '..#####.#', '..#####.#', '..#####.#', '..######.', '..#####..', '...###...'],
 ['#.......#', '.#.....#.', '..#...#..', '...#.#...', '....#....', '...#.#...', '.##...##.', '#..#.#..#', '#..#.#..#', '.##...##.'],
 ['..######.', '.########', '..######.', '....##...', '....##...', '....##...', '....##...', '....##...', '....##...'],
 ['...##.##...', '..##.##.##.', '.##.##.####', '###########', '###########', '.#########.', '..#######..'],
 ['.#####...', '.#####...', '..####...', '..####...', '..####...', '..####...', '..######.', '..#######', '.########'],
 ['...###...', '...###...', '..#####..', '.#######.', '#########', '#########', '.#######.', '..#####..', '...###...'],
 ['....#....', '...###...', '..#####..', '..#####..', '..#####..', '.#######.', '.#######.', '#########', '....#....'],
 ['...#####...', '..#######.#', '.##########', '###.#######', '.##########', '..#######.#', '...#####...'],
 ['####.####', '####.####', '####.####', '####.####', '####.####', '####.####', '####.####', '.###.###.', '....#....'],
 ['..#.#....', '.#.#.....', '.........', '#######..', '.######.#', '.######.#', '..######.', '..####...', '########.'],
 ['......##.', '.....##..', '....##...', '#########', '.#######.', '.#######.', '..#####..', '...###...', '..#####..'],
 ['....#....', '.#######.', '.#..#..#.', '.#..#..#.', '#.#.#.#.#', '###.#.###', '....#....', '....#....', '..#####..'],
 ['..#######', '.#######.', '#######..', '#.....#..', '#######..', '.#.....#.', '.#######.', '..#######'],
 ['..#.#.#..', '.#.#.#...', '.........', '#########', '.#######.', '..#####..', '...###...', '..#####..'],
 ['##.....##', '###...###', '####.####', '###...###', '##.....##', '##.....##', '###...###', '###...###', '#########'],
 ['#########', '#.......#', '#.#...#.#', '#.......#', '#...#...#', '#.......#', '#.#...#.#', '#.......#', '#########'],
]
TEA = ['..#...#..','#########','..#...#..','....#....','..##.##..','##..#..##','..#####..','...###...','..#.#.#..','.#..#..#.']
WINE = ['#..######','.#...#.#.','...######','#..#.#.##','.#.#.#.##','...######','.#.#...##','#..######','#..#...##','...######']
NAMES = ['Jug', 'Shears', 'Hammer', 'Loaf', 'Boot', 'Jar', 'Bell', 'Fish',
         'Book', 'Tea cup', 'Mortar', 'Scales', 'Cloth', 'Bath', 'Stage', 'Dice']
STYLES = ['oak', 'painted', 'lacquer', 'split', 'pennant', 'bazaar']
FIELDS = ['greenglaze7', 'paintblue7', 'rustred7', 'rustred7', 'buffclay7',
          'greenglaze7', 'paintblue7', 'blueglaze7', 'greenglaze7', 'rustred7',
          'paintblue7', 'paintblue7', 'rustred7', 'blueglaze7', 'rustred7', 'greenglaze7']


def glyph_for(style, variant):
    # Tea and wine read better as 茶 / 酒 on Chinese and Japanese boards.
    if style in ('lacquer', 'split') and variant == 9: return TEA
    if style in ('lacquer', 'split') and variant == 0: return WINE
    return GLYPHS[variant]


def stamp(c, glyph, x0, x1, top, bottom, ink, shade):
    gx = (x0 + x1 + 1 - max(map(len, glyph))) // 2
    gy = (top + bottom + 1 - len(glyph)) // 2
    for y, row in enumerate(glyph):
        for x, pixel in enumerate(row):
            if pixel == '#':
                c.set(gx + x, gy + y, shade if y == len(glyph) - 1 else ink)


def post(c, x, top, bottom, wood):
    c.rect(x, top, x + 2, bottom, wood[3])
    c.vline(x, top + 1, bottom, wood[5]); c.vline(x + 2, top + 1, bottom, wood[1])
    c.hline(x, x + 2, top, wood[6])


def board(c, x0, x1, top, bottom, frame, field, tone=3):
    c.rect(x0, top, x1, bottom, field[tone])
    c.hline(x0, x1, top, frame[5]); c.vline(x0, top, bottom, frame[5])
    c.hline(x0, x1, bottom, frame[1]); c.vline(x1, top, bottom, frame[1])
    c.hline(x0 + 1, x1 - 1, top + 1, field[tone + 1])


def oak(v):
    """Medieval: a timber gallows with a knee brace, the board on two chains."""
    c = Canvas(25, 38)
    wood, iron = RAMPS['oak7'], RAMPS['blackiron7']
    field = RAMPS['walnut7' if v in (0, 3, 5) else FIELDS[v]]
    post(c, 3, 2, 35, wood)
    c.rect(2, 34, 6, 36, wood[2]); c.hline(2, 6, 34, wood[4]); c.hline(2, 6, 37, wood[1])
    c.rect(6, 3, 23, 5, wood[3]); c.hline(6, 22, 3, wood[5]); c.hline(6, 23, 5, wood[1])
    c.set(23, 4, wood[2])
    c.line((6, 11), (11, 6), wood[4]); c.line((6, 12), (12, 6), wood[2])
    for x in (11, 20):
        c.vline(x, 6, 9, iron[3]); c.set(x, 7, iron[5])
    board(c, 9, 22, 10, 26, wood, field)
    ink, shade = RAMPS['linen7'][6], RAMPS['linen7'][4]
    if v == 4: ink, shade = RAMPS['walnut7'][1], RAMPS['walnut7'][2]
    stamp(c, glyph_for('oak', v), 10, 21, 11, 25, ink, shade)
    im = c.image(); im.info['anchor'] = [5, 39]
    return im


def painted(v):
    """Early modern: a wrought-iron scroll arm and a gilt-framed painted board."""
    c = Canvas(25, 38)
    wood, iron, gilt = RAMPS['walnut7'], RAMPS['blackiron7'], RAMPS['brasspot7']
    field = RAMPS[FIELDS[v]]
    post(c, 3, 3, 35, wood)
    c.rect(2, 34, 6, 36, RAMPS['limestone'][3]); c.hline(2, 6, 34, RAMPS['limestone'][5])
    c.hline(2, 6, 37, RAMPS['limestone'][1])
    c.set(4, 1, gilt[5]); c.rect(3, 2, 5, 2, gilt[3])
    # The arm and its scroll.
    c.hline(6, 23, 5, iron[3]); c.hline(6, 23, 4, iron[5])
    c.set(23, 3, iron[4]); c.set(22, 2, iron[5]); c.set(21, 3, iron[3])
    for x, y in [(7, 12), (8, 11), (9, 10), (10, 9), (10, 8), (11, 7), (12, 6)]:
        c.set(x, y, iron[4])
    for x, y in [(12, 9), (13, 8), (13, 10), (14, 9)]:
        c.set(x, y, iron[3])
    c.set(6, 12, iron[2])
    for x in (11, 20): c.vline(x, 6, 8, iron[4])
    # Shaped top: the corners are cut and a gilt line runs inside the edge.
    c.rect(9, 9, 22, 26, gilt[2])
    c.set(9, 9, None); c.set(22, 9, None)
    for (x, y) in [(9, 9), (22, 9)]: c.px.pop((x, y), None)
    c.hline(10, 21, 9, gilt[5]); c.vline(9, 10, 25, gilt[4])
    c.hline(10, 21, 26, gilt[1]); c.vline(22, 10, 25, gilt[1])
    c.rect(10, 10, 21, 25, field[3]); c.hline(10, 21, 10, field[4])
    c.set(10, 25, field[2])
    stamp(c, glyph_for('painted', v), 10, 21, 10, 25, RAMPS['linen7'][6], RAMPS['linen7'][4])
    im = c.image(); im.info['anchor'] = [5, 39]
    return im


def lacquer(v):
    """Chinese standing shop board: a tall lacquered panel in a frame on a
    stone foot, under a small tiled cap."""
    c = Canvas(25, 38)
    wood, tile, stone = RAMPS['walnut7'], RAMPS['blackiron7'], RAMPS['granite']
    red, gold = RAMPS['rustred7'], RAMPS['brasspot7']
    # Frame posts.
    for x in (5, 19):
        c.rect(x, 6, x + 1, 34, red[2]); c.vline(x, 6, 34, red[4])
    # Stone foot blocks.
    for x in (3, 17):
        c.rect(x, 32, x + 5, 36, stone[3]); c.hline(x, x + 5, 32, stone[5])
        c.hline(x, x + 5, 36, stone[1]); c.vline(x + 5, 33, 36, stone[2])
    # Tiled cap with lifted eaves.
    c.rect(4, 3, 20, 5, tile[3]); c.hline(4, 20, 3, tile[5]); c.hline(3, 21, 6, tile[1])
    c.hline(3, 21, 5, tile[2])
    c.set(2, 4, tile[4]); c.set(22, 4, tile[4]); c.set(1, 3, tile[5]); c.set(23, 3, tile[5])
    for x in range(5, 20, 2): c.set(x, 4, tile[4])
    c.hline(7, 17, 2, tile[4]); c.hline(8, 16, 1, tile[5])
    # Panel.
    c.rect(7, 7, 17, 30, RAMPS['blackiron7'][1])
    c.hline(7, 17, 7, gold[4]); c.hline(7, 17, 30, gold[2])
    c.vline(7, 8, 29, gold[3]); c.vline(17, 8, 29, gold[2])
    c.rect(8, 8, 16, 29, '#1b1614')
    c.hline(8, 16, 8, '#2d2521')
    c.hline(7, 17, 31, red[3])
    stamp(c, glyph_for('lacquer', v), 8, 16, 8, 29, gold[6], gold[4])
    im = c.image(); im.info['anchor'] = [12, 39]
    return im


def split(v):
    """Japanese: an indigo noren hung from a bamboo pole on a small stand,
    slit into three panels below the mark."""
    c = Canvas(25, 38)
    bamboo, cloth, wood = RAMPS['straw'], RAMPS['paintblue7'], RAMPS['walnut7']
    for x in (3, 20):
        c.rect(x, 5, x + 1, 35, bamboo[3]); c.vline(x, 5, 35, bamboo[5])
        for y in (12, 22, 31): c.hline(x, x + 1, y, bamboo[2])
        c.rect(x - 1, 35, x + 2, 36, wood[2]); c.hline(x - 1, x + 2, 35, wood[4])
    c.rect(1, 4, 23, 5, bamboo[4]); c.hline(1, 23, 4, bamboo[6]); c.hline(1, 23, 5, bamboo[2])
    c.set(0, 4, bamboo[3]); c.set(24, 4, bamboo[3])
    for x in range(5, 20):
        for y in range(6, 28):
            if y >= 19 and x in (9, 15): continue
            tone = 4 if y == 6 else 1 if x in (5, 19) else 3 if y < 19 else 2 if x in (10, 16) else 3
            c.set(x, y, cloth[tone])
    for x in range(5, 20):
        if x not in (9, 15): c.set(x, 27, cloth[1])
    for x in range(6, 19, 3): c.set(x, 6, cloth[5])
    stamp(c, glyph_for('split', v), 5, 19, 7, 18, RAMPS['linen7'][6], RAMPS['linen7'][5])
    im = c.image(); im.info['anchor'] = [12, 39]
    return im


def pennant(v):
    """South and Southeast Asian: a tall bamboo pole flying a long saffron
    banner with a swallowtail."""
    c = Canvas(25, 38)
    bamboo = RAMPS['straw']
    cloth = RAMPS['copper7' if v % 3 == 0 else 'rustred7' if v % 3 == 1 else 'brasspot7']
    edge = RAMPS['greenglaze7' if v % 2 else 'paintblue7']
    c.rect(3, 1, 4, 35, bamboo[3]); c.vline(3, 1, 35, bamboo[5])
    for y in (7, 15, 23, 30): c.hline(3, 4, y, bamboo[1])
    c.set(3, 0, RAMPS['brasspot7'][6]); c.set(4, 0, RAMPS['brasspot7'][4])
    c.rect(1, 35, 6, 36, RAMPS['sandstone'][3]); c.hline(1, 6, 35, RAMPS['sandstone'][5])
    c.hline(1, 6, 37, RAMPS['sandstone'][1])
    c.hline(5, 21, 3, bamboo[4])
    for y in range(4, 31):
        for x in range(5, 21):
            if y > 26 and abs(x - 13) < (y - 26) * 2: continue
            border = x in (5, 6, 19, 20) or y in (4, 5)
            c.set(x, y, edge[4 if x < 13 else 3] if border else cloth[4 if y < 8 else 3])
    for y in range(6, 27, 3): c.set(20, y, edge[2])
    stamp(c, glyph_for('pennant', v), 7, 18, 7, 26, RAMPS['linen7'][6], RAMPS['linen7'][4])
    im = c.image(); im.info['anchor'] = [4, 39]
    return im


def bazaar(v):
    """West Asian bazaar: a kilim-bordered cloth hung from a pole on a
    turned post, fringed at the foot."""
    c = Canvas(25, 38)
    wood, brass, linen = RAMPS['walnut7'], RAMPS['brasspot7'], RAMPS['linen7']
    field = RAMPS['rustred7' if v % 2 == 0 else 'paintblue7']
    band = RAMPS['paintblue7' if v % 2 == 0 else 'rustred7']
    post(c, 3, 3, 35, wood)
    for y in (10, 20): c.hline(2, 6, y, wood[5]); c.hline(2, 6, y + 1, wood[2])
    c.rect(2, 34, 6, 36, wood[2]); c.hline(2, 6, 34, wood[4]); c.hline(2, 6, 37, wood[1])
    c.set(4, 1, brass[6]); c.rect(3, 2, 5, 2, brass[4])
    c.hline(6, 23, 5, wood[4]); c.hline(6, 23, 6, wood[2]); c.set(24, 5, brass[5]); c.set(24, 6, brass[3])
    x0, x1, top, bottom = 8, 22, 7, 27
    c.rect(x0, top, x1, bottom, field[3])
    # A dark outer band with a row of small light lozenges inside it.
    for x in range(x0, x1 + 1):
        for y, inner in ((top, top + 1), (bottom, bottom - 1)):
            c.set(x, y, band[2]); c.set(x, inner, linen[5] if x % 3 == 1 else band[4])
    for y in range(top, bottom + 1):
        for x, inner in ((x0, x0 + 1), (x1, x1 - 1)):
            c.set(x, y, band[2])
            if top < y < bottom: c.set(inner, y, linen[5] if y % 3 == 1 else band[4])
    c.rect(x0 + 3, top + 3, x1 - 3, bottom - 3, field[4])
    for x in range(x0, x1 + 1, 2): c.set(x, bottom + 1, linen[4]); c.set(x, bottom + 2, linen[3])
    stamp(c, glyph_for('bazaar', v), x0 + 2, x1 - 2, top + 2, bottom - 2, linen[6], linen[4])
    im = c.image(); im.info['anchor'] = [5, 39]
    return im


DRAW = {'oak': oak, 'painted': painted, 'lacquer': lacquer,
        'split': split, 'pennant': pennant, 'bazaar': bazaar}


def signpost(style, variant=0):
    return DRAW[style](variant)


SIGNPOSTS = {f'signpost-{style}': (lambda v=0, s=style: signpost(s, v)) for style in STYLES}
