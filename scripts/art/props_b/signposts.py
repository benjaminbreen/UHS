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
STYLES = ['oak', 'painted', 'iron', 'lacquer', 'split', 'pennant', 'bazaar']
FIELDS = ['greenglaze7', 'paintblue7', 'rustred7', 'rustred7', 'buffclay7',
          'greenglaze7', 'paintblue7', 'blueglaze7', 'greenglaze7', 'rustred7',
          'paintblue7', 'paintblue7', 'rustred7', 'blueglaze7', 'rustred7', 'greenglaze7']


def signpost(style, variant=0):
    c = Canvas(25, 38)
    wood = RAMPS['blackiron7' if style == 'iron' else 'walnut7' if style in ('painted', 'lacquer') else 'oak7']
    metal = RAMPS['blackiron7']
    cloth = style in ('split', 'pennant', 'bazaar')
    field = RAMPS['paintblue7' if style == 'split' else 'rustred7' if style == 'lacquer' else FIELDS[variant]]
    if style == 'oak' and variant in (0, 3, 5): field = RAMPS['walnut7']
    if style == 'iron': field = RAMPS['creamglaze7']
    # The anchor is the post foot, not the centre of its overhanging board.
    c.rect(3, 2, 5, 35, wood[3])
    c.vline(3, 3, 34, wood[5]); c.vline(5, 3, 35, wood[1])
    c.hline(3, 5, 1, wood[6]); c.set(4, 2, wood[5])
    c.rect(2, 34, 6, 36, wood[2]); c.hline(2, 5, 34, wood[5])
    c.vline(6, 35, 36, wood[1]); c.hline(2, 6, 37, wood[1])
    c.rect(6, 4, 22, 6, wood[3]); c.hline(6, 21, 4, wood[5])
    c.hline(6, 22, 6, wood[1]); c.set(22, 5, wood[2])
    c.vline(7, 4, 6, metal[2]); c.set(7, 4, metal[5])
    c.rect(3, 10, 5, 11, metal[2]); c.set(3, 10, metal[4])
    for x in (10, 20):
        c.vline(x, 7, 9, metal[2]); c.set(x, 7, metal[5])
    x0, x1, top, bottom = 8, 22, 10, 27
    if style == 'lacquer': x0, x1, bottom = 9, 21, 29
    for y in range(top, bottom + 1):
        for x in range(x0, x1 + 1):
            if style in ('painted', 'iron') and (x in (x0, x1) and y in (top, bottom)): continue
            if style == 'split' and y >= bottom - 3 and x == 15: continue
            if style == 'pennant' and y > bottom - 3 + abs(x - 15) // 2: continue
            tone = 3 if x == x1 or y == bottom else 5 if y == top or x == x0 else 4
            if not cloth and (x in (x0, x1) or y in (top, bottom)):
                c.set(x, y, wood[5] if x == x0 or y == top else wood[1])
            else:
                c.set(x, y, field[tone if cloth else 5 if style == 'iron' else 3])
    if not cloth:
        c.hline(x0 + 1, x1 - 1, top + 1, field[6 if style == 'iron' else 4])
        c.set(x0 + 1, bottom - 1, field[4 if style == 'iron' else 2])
    if style == 'bazaar':
        for x in range(x0 + 1, x1, 3): c.set(x, bottom + 1, RAMPS['linen7'][4])
    glyph = TEA if style == 'lacquer' and variant == 9 else WINE if style == 'lacquer' and variant == 0 else GLYPHS[variant]
    ink = RAMPS['brasspot7'][6] if style == 'lacquer' else RAMPS['linen7'][6]
    shade = RAMPS['brasspot7'][4] if style == 'lacquer' else RAMPS['linen7'][4]
    if style == 'iron' or variant == 4 and style not in ('split', 'lacquer'):
        ink, shade = RAMPS['walnut7'][1], RAMPS['walnut7'][2]
    gx = (x0 + x1 + 1 - max(map(len, glyph))) // 2
    gy = (top + bottom + 1 - len(glyph)) // 2
    for y, row in enumerate(glyph):
        for x, pixel in enumerate(row):
            if pixel == '#':
                c.set(gx + x, gy + y, shade if y == len(glyph) - 1 else ink)
    im = c.image()
    im.info['anchor'] = [5, 39]
    return im


SIGNPOSTS = {f'signpost-{style}': (lambda v=0, s=style: signpost(s, v)) for style in STYLES}
