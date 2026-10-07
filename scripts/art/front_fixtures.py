"""Things hung off a building's front: trade signs on brackets, lanterns,
banners. They hang from the wall, never stand free, and take their form from
the street's sign style (src/content/props/signage.ts) and their mark from
its sixteen trade emblems.

    .venv/bin/python scripts/art/front_fixtures.py artifacts/front-fixtures.png

fixture(c, x, y, side, kind, ...) hangs one with its bracket fixed to the
wall at (x, y), projecting right (side=1) or left (side=-1).
"""
from pathlib import Path
import math
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, ramp, mix, h2, render, ashlar, brick, boards, whitewash  # noqa: E402
from art import front_openings as op  # noqa: E402

IRON = op.IRON
GILT = ramp(80, 0.13, lift=0.02)
OAK = RAMPS['oak']
CLOTH = {'red': ramp(25, 0.15, lift=-0.06), 'indigo': ramp(270, 0.1, lift=-0.12),
         'saffron': ramp(65, 0.15), 'green': ramp(150, 0.1, lift=-0.1), 'white': ramp(90, 0.015, lift=0.02)}
BOARD = {'green': op.PAINT['green'], 'oxblood': op.PAINT['oxblood'], 'blue': op.PAINT['blue'],
         'cream': ramp(85, 0.04, lift=0.03)}
LACQUER = ramp(20, 0.03, lift=-0.5)
VERMILION = ramp(32, 0.16, lift=-0.04)

# ------------------------------------------------------------------ emblems
# The sixteen marks of signage.ts, in its order. Drawn by hand: o outline,
# h highlight, a light, b body, c shade. Each takes its material's ramp.

EMBLEMS = [
    ('Jug', 'pewter', ["..oooo....", ".oaabbo...", ".oabbbcooo", "oabbbbco.o", "oabbbbco.o",
                       "oabbbbcooo", "oabbbbco..", ".oabbco...", "..oooo...."]),
    ('Shears', 'steel', ["o.......o.", "oo.....oo.", ".oo...oo..", "..oo.oo...", "...ooo....",
                         "..oo.oo...", ".ohho.ohho", ".o..o.o..o", ".ohho.ohho", "..oo...oo."]),
    ('Hammer', 'steel', ["oooooooo..", "ohaabbbco.", "obbbbbcco.", "oooooooo..", "...oao....",
                         "...oao....", "...oao....", "...oao....", "...oco....", "...ooo...."]),
    ('Loaf', 'bread', ["..........", "..oooooo..", ".ohaaabbo.", "oaabaabbco", "oabbbbbbco",
                       "obbcbbcbco", "obbbbbbcco", ".occcccco.", "..oooooo.."]),
    ('Boot', 'leather', ["..oooo....", "..ohbo....", "..oabo....", "..oabo....", "..oabco...",
                         ".oabbcooo.", "oabbbbbbco", "oabbbbbbco", "oooooooooo"]),
    ('Jar', 'clay', ["..oooooo..", "...oaco...", "..ohabco..", ".oaabbbco.", "oaabbbbbco",
                     "oabbbbbbco", ".obbbbbco.", "..occcco..", "...oooo..."]),
    ('Bell', 'gilt', ["....oo....", "...ohco...", "..oabbco..", "..oabbco..", ".oabbbbco.",
                      ".oabbbbco.", "oabbbbbbco", "oooooooooo", "....oo...."]),
    ('Fish', 'silver', ["..........", "...ooo....", ".ooaaaoo.o", "oho.abbcoo", "oabbbbbbco",
                        ".ocbbbccoo", "..ooooo..o"]),
    ('Book', 'book', ["oooooooooo", "oaaaaabbco", "oahhhhhbco", "oabbbbbbco", "oahhhhhbco",
                      "oabbbbbbco", "oabbbbbbco", "occcccccco", "oooooooooo"]),
    ('Tea cup', 'porcelain', ["...o.o....", "....o.o...", "oooooooo..", "ohaaaabooo", "oabbbbbo.o",
                              ".obbbbcooo", "..occco...", "oooooooooo"]),
    ('Mortar', 'brass', ["......oo..", ".....oao..", "....oao...", "oooooaoooo", "ohaaabbbco",
                         ".oabbbbco.", "..obbbco..", "..occcco..", ".oooooooo."]),
    ('Scales', 'brass', ["....oo....", "oooooooooo", "o...oo...o", "o...oo...o", ".o..oo..o.",
                         "ohbo.oo.ohbo"[:10], ".oo.oo.oo.", "....oo....", "..oooooo.."]),
    ('Cloth', 'cloth', ["..........", "oooooooo..", "ohaaaaabo.", "oabbbbbbco", "ohhhhhhhho",
                        "oabbbbbbco", "oabbbbbbco", ".occcccco.", "..oooooo.."]),
    ('Bath', 'copper', ["..o..o..o.", ".o..o..o..", "..o..o..o.", "oooooooooo", "ohaaaaabco",
                        "oabbbbbbco", ".obbbbbco.", "..oo..oo.."]),
    ('Stage', 'gilt', [".oooooooo.", "ohaaaaabco", "oaooaoobco", "oaaaaaabco", "oabbbbbbco",
                       ".oabooabo.", "..oaaabo..", "...oooo..."]),
    ('Dice', 'ivory', ["oooooooo", "ohhhhhbo", "ohoohhbo", "ohhhhhbo", "ohhhoobo", "ohhhhhbo",
                       "oabbbbco", "oooooooo"]),
]
EMBLEM_RAMP = {
    'pewter': ramp(240, 0.02, lift=-0.04), 'steel': ramp(245, 0.025, lift=-0.08),
    'bread': ramp(65, 0.12), 'leather': ramp(45, 0.1, lift=-0.12), 'clay': RAMPS['terracotta'],
    'gilt': GILT, 'silver': ramp(225, 0.03), 'book': ramp(25, 0.14, lift=-0.1),
    'porcelain': ramp(250, 0.03, lift=0.04), 'brass': ramp(78, 0.11, lift=-0.04),
    'cloth': ramp(255, 0.1, lift=-0.08), 'copper': ramp(45, 0.12, lift=-0.04),
    'ivory': ramp(88, 0.03, lift=0.03),
}


def emblem(c, x, y, index, tint=None):
    """Draw emblem `index` with its top-left at (x, y); returns its size."""
    name, mat, rows = EMBLEMS[index]
    r = tint or EMBLEM_RAMP[mat]
    key = {'o': mix(r[7], (30, 18, 34, 255), 0.4), 'h': r[0], 'a': r[1], 'b': r[3], 'c': r[5]}
    if mat == 'book':
        key['h'] = ramp(85, 0.03, lift=0.03)[1]
    if mat == 'ivory':
        key['o'] = (40, 28, 40, 255)
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch in key:
                c.p(x + i, y + j, key[ch])
    return len(rows[0]), len(rows)


# ------------------------------------------------------------------ brackets

def scroll_bracket(c, x, y, side, reach=22):
    """Wrought iron: a straight arm off a wall plate, a scrolled stay under
    it, a curl at the tip. Returns the hanging points."""
    sx = lambda d: x + side * d
    c.rect(min(x, x + side * 2), y - 3, 2, 14, IRON[3])
    c.rect(min(x, x + side * 2), y - 3, 1, 14, IRON[2])
    for d in range(reach):
        c.p(sx(d), y, IRON[2])
        c.p(sx(d), y + 1, IRON[4])
    for i in range(10):
        c.p(sx(1 + i), y + 10 - i, IRON[3])
    for a in range(0, 300, 30):
        t = math.radians(a)
        c.p(sx(reach) + round(math.cos(t) * 2) * side, y - 2 + round(math.sin(t) * 2), IRON[3])
    for a in range(0, 360, 45):
        t = math.radians(a)
        c.p(sx(6) + round(math.cos(t) * 2), y + 4 + round(math.sin(t) * 2), IRON[3])
    return sx(5), sx(reach - 3)


def timber_arm(c, x, y, side, reach=22):
    """An oak arm through the wall with a diagonal strut under it."""
    sx = lambda d: x + side * d
    for d in range(reach):
        for k, idx in enumerate((2, 3, 5)):
            c.p(sx(d), y + k, OAK[idx])
    c.p(sx(reach - 1), y, OAK[3]); c.p(sx(reach - 1), y + 1, OAK[4])
    for i in range(11):
        for k in range(2):
            c.p(sx(1 + i) + k * side, y + 13 - i, OAK[3] if k == 0 else OAK[5])
    return sx(5), sx(reach - 4)


def chain(c, x, y0, y1):
    for y in range(y0, y1):
        c.p(x, y, IRON[2] if (y - y0) % 2 == 0 else IRON[4])


def board(c, x, y, w, h, paint, framed=True):
    """A hanging board: frame lit top-left, field inset, its own small shadow."""
    p = BOARD.get(paint) or paint
    op.raised(c, x, y, w, h, OAK if framed else p, 3)
    c.rect(x + 2, y + 2, w - 4, h - 4, p[3])
    c.rect(x + 2, y + 2, w - 4, 1, p[5])
    c.rect(x + 2, y + 2, 1, h - 4, p[5])


# ------------------------------------------------------------------ fixtures

def sign_painted(c, x, y, side, emb, paint='green'):
    """European painted board on a wrought bracket, the emblem gilt or in
    colour on the field."""
    a, b = scroll_bracket(c, x, y, side)
    l, r = min(a, b), max(a, b)
    w, h = r - l + 7, 17
    bx = l - 3
    chain(c, l, y + 2, y + 5); chain(c, r, y + 2, y + 5)
    board(c, bx, y + 5, w, h, paint)
    ew, eh = len(EMBLEMS[emb][2][0]), len(EMBLEMS[emb][2])
    emblem(c, bx + (w - ew) // 2, y + 5 + (h - eh) // 2, emb)


def sign_oak(c, x, y, side, emb):
    """Medieval: an oak board on chains from a timber arm, the mark painted
    plain on bare wood."""
    a, b = timber_arm(c, x, y, side)
    l, r = min(a, b), max(a, b)
    w, h = r - l + 7, 16
    chain(c, l, y + 3, y + 6); chain(c, r, y + 3, y + 6)
    bx = l - 3
    op.raised(c, bx, y + 6, w, h, OAK, 2)
    for xx in range(bx + 1, bx + w - 1, 5):
        c.rect(xx, y + 7, 1, h - 2, OAK[3])
    ew, eh = len(EMBLEMS[emb][2][0]), len(EMBLEMS[emb][2])
    emblem(c, bx + (w - ew) // 2, y + 6 + (h - eh) // 2, emb)


def sign_cutout(c, x, y, side, emb):
    """The mark itself, gilt and hung from a scroll bracket: the bakers' and
    bootmakers' sign across northern Europe."""
    a, b = scroll_bracket(c, x, y, side)
    m = (a + b) // 2
    chain(c, m, y + 2, y + 6)
    ew = len(EMBLEMS[emb][2][0])
    emblem(c, m - ew // 2, y + 6, emb, GILT)


def sign_lacquer(c, x, y, side, emb, strokes=4):
    """Chinese: a tall lacquered board in a vermilion frame, gilt strokes
    down it, hung from a small timber bracket under the eave."""
    a, b = timber_arm(c, x, y, side, 12)
    m = (a + b) // 2
    chain(c, m, y + 3, y + 5)
    bx, by, w, h = m - 6, y + 5, 12, 34
    op.raised(c, bx, by, w, h, VERMILION, 3)
    c.rect(bx + 2, by + 2, w - 4, h - 4, LACQUER[4])
    c.rect(bx + 2, by + 2, w - 4, 1, LACQUER[2])
    for k in range(strokes):
        gy = by + 5 + k * 7
        c.rect(bx + 4, gy, 4, 1, GILT[2]); c.p(bx + 5, gy + 1, GILT[2]); c.p(bx + 6, gy + 2, GILT[3])
        c.rect(bx + 4, gy + 3, 4, 1, GILT[3]); c.p(bx + 4, gy + 4, GILT[2])
    c.rect(bx - 1, by + h, w + 2, 2, VERMILION[4])


def sign_split(c, x, y, side, emb):
    """Japanese: a plain cedar kanban hung under a small roof, black ink
    characters on bare wood."""
    cd = RAMPS['cedar']
    a, b = timber_arm(c, x, y, side, 14)
    m = (a + b) // 2
    bx, by, w, h = m - 6, y + 5, 12, 30
    for k in range(5):
        c.rect(bx - 3 + k // 2, by - 5 + k, w + 6 - k, 1, RAMPS['kawara'][3 + k // 2])
    op.raised(c, bx, by, w, h, RAMPS['pine'], 2)
    ink = (34, 26, 30, 255)
    for k in range(3):
        gy = by + 4 + k * 9
        c.rect(bx + 3, gy, 6, 1, ink); c.rect(bx + 5, gy, 1, 6, ink)
        c.p(bx + 3, gy + 3, ink); c.p(bx + 8, gy + 4, ink); c.rect(bx + 4, gy + 6, 4, 1, ink)


def sign_pennant(c, x, y, side, emb, colour='saffron'):
    """South and Southeast Asia: a cloth pennant on a bamboo pole, the mark
    painted on it, the tail lifting a little."""
    bam = ramp(90, 0.09)
    sx = lambda d: x + side * d
    for d in range(26):
        c.p(sx(d), y - d // 4, bam[2] if d % 6 else bam[4])
        c.p(sx(d), y - d // 4 + 1, bam[4])
    cl = CLOTH[colour]
    for d in range(4, 24):
        top = y - d // 4 + 2
        length = 20 - (d - 4) * 0.6
        for k in range(int(length)):
            col = cl[2] if k < 2 else cl[3]
            if k > length - 3:
                col = cl[4]
            if (d + k) % 9 == 0:
                col = cl[4]
            c.p(sx(d), top + k, col)
    emblem(c, sx(8) - (9 if side < 0 else 0), y + 2, emb, EMBLEM_RAMP['ivory'] if colour != 'white' else None)


def sign_bazaar(c, x, y, side, emb, colour='red'):
    """Ottoman and Persian bazaars: a cloth banner on a rod, fringed, a
    border band, the mark woven in."""
    cl = CLOTH[colour]
    sx = lambda d: x + side * d
    for d in range(22):
        c.p(sx(d), y, IRON[2]); c.p(sx(d), y + 1, IRON[4])
    l = min(sx(3), sx(20))
    w, h = 17, 22
    for yy in range(y + 2, y + 2 + h):
        for xx in range(l, l + w):
            a, b = xx - l, yy - y - 2
            sway = int(math.sin(b * 0.3) * 0.6)
            col = cl[3]
            if a < 2 or a > w - 3 or b < 2:
                col = GILT[3] if (a + b) % 2 else cl[4]
            if a == 0:
                col = cl[2]
            c.p(xx + sway, yy, col)
    for xx in range(l, l + w, 2):
        c.p(xx, y + 2 + h, GILT[2]); c.p(xx, y + 3 + h, GILT[3])
    ew, eh = len(EMBLEMS[emb][2][0]), len(EMBLEMS[emb][2])
    emblem(c, l + (w - ew) // 2, y + 5, emb, GILT)


# lanterns -------------------------------------------------------------------

def lantern_iron(c, x, y, side, lit=False):
    """A square iron lantern hung from a short scroll bracket."""
    a, b = scroll_bracket(c, x, y, side, 12)
    m = (a + b) // 2
    chain(c, m, y + 2, y + 4)
    glass = ramp(80, 0.1, lift=0.02) if lit else ramp(85, 0.04, lift=0.02)
    lx = m - 4
    c.rect(lx + 1, y + 4, 7, 2, IRON[3]); c.rect(lx + 3, y + 3, 3, 1, IRON[3])
    c.rect(lx, y + 6, 9, 10, IRON[4])
    c.rect(lx + 1, y + 7, 7, 8, glass[2]); c.rect(lx + 1, y + 7, 3, 8, glass[0])
    c.rect(lx + 4, y + 7, 1, 8, IRON[4])
    c.rect(lx + 1, y + 16, 7, 2, IRON[3]); c.p(lx + 4, y + 18, IRON[3])


def lantern_gas(c, x, y, side, lit=False):
    """A nineteenth-century gas bracket: a swan-neck arm, a glazed lamp with
    a ventilator cap."""
    g = op.PAINT['green']
    sx = lambda d: x + side * d
    for d in range(16):
        yy = y + round(4 - 4 * math.sin(d / 15 * math.pi))
        c.p(sx(d), yy, g[3]); c.p(sx(d), yy + 1, g[5])
    m = sx(15)
    glass = ramp(85, 0.08, lift=0.03)
    c.rect(m - 4, y + 2, 9, 2, g[3]); c.rect(m - 1, y, 3, 2, g[2])
    for k in range(9):
        half = 3 + k // 3
        c.rect(m - half, y + 4 + k, 2 * half + 1, 1, glass[1] if k < 4 else glass[2])
        c.p(m - half, y + 4 + k, g[4]); c.p(m + half, y + 4 + k, g[4])
    c.rect(m - 3, y + 13, 7, 2, g[4]); c.p(m, y + 15, g[4])


def lantern_red(c, x, y, side, lit=False):
    """A Chinese red paper lantern, gold caps and a tassel."""
    a, b = timber_arm(c, x, y, side, 12)
    m = (a + b) // 2
    chain(c, m, y + 3, y + 5)
    r = CLOTH['red']
    for yy in range(-6, 7):
        for xx in range(-7, 8):
            d = (xx / 7) ** 2 + (yy / 6.5) ** 2
            if d <= 1:
                col = r[2] if xx < -2 and yy < 0 else r[3] if xx < 3 else r[4]
                if abs(yy) % 3 == 0 and abs(yy) > 0:
                    col = r[min(7, r.index(col) + 1)]
                c.p(m + xx, y + 12 + yy, col)
    c.rect(m - 3, y + 5, 7, 1, GILT[2]); c.rect(m - 3, y + 19, 7, 1, GILT[3])
    for k in range(5):
        c.p(m, y + 20 + k, GILT[2] if k < 2 else VERMILION[3])
    c.p(m - 1, y + 24, VERMILION[3]); c.p(m + 1, y + 24, VERMILION[4])


def lantern_chochin(c, x, y, side, lit=False):
    """A Japanese chōchin: white paper on bamboo ribs, black bands top and
    bottom, an ink mark."""
    a, b = timber_arm(c, x, y, side, 12)
    m = (a + b) // 2
    w = CLOTH['white']
    c.rect(m - 4, y + 4, 9, 2, (34, 26, 30, 255))
    for yy in range(16):
        half = 5 if 2 < yy < 13 else 4
        for xx in range(-half, half + 1):
            col = w[1] if xx < -1 else w[2] if xx < 3 else w[3]
            if yy % 3 == 0:
                col = w[min(7, w.index(col) + 1)]
            c.p(m + xx, y + 6 + yy, col)
    c.rect(m - 4, y + 22, 9, 2, (34, 26, 30, 255))
    ink = (34, 26, 30, 255)
    c.rect(m - 1, y + 10, 3, 1, ink); c.rect(m, y + 10, 1, 6, ink); c.rect(m - 2, y + 13, 5, 1, ink)


def lantern_brass(c, x, y, side, lit=False):
    """An Ottoman pierced brass lantern: a domed cap, a body of cut stars,
    a finial below."""
    br = EMBLEM_RAMP['brass']
    a, b = scroll_bracket(c, x, y, side, 12)
    m = (a + b) // 2
    chain(c, m, y + 2, y + 5)
    for k in range(4):
        c.rect(m - 1 - k, y + 5 + k, 3 + 2 * k, 1, br[2 + k // 2])
    for yy in range(12):
        half = 5 if 1 < yy < 10 else 4
        for xx in range(-half, half + 1):
            col = br[2] if xx < 0 else br[4]
            if (xx + yy) % 3 == 0 and abs(xx) < half - 1 and 1 < yy < 10:
                col = ramp(80, 0.12, lift=0.04)[0]
            c.p(m + xx, y + 9 + yy, col)
    c.rect(m - 3, y + 21, 7, 1, br[4])
    for k in range(4):
        c.p(m, y + 22 + k, br[3 + (k % 2)])


SIGNS = {'painted': sign_painted, 'oak': sign_oak, 'cutout': sign_cutout, 'lacquer': sign_lacquer,
         'split': sign_split, 'pennant': sign_pennant, 'bazaar': sign_bazaar}
LANTERNS = {'iron': lantern_iron, 'gas': lantern_gas, 'red': lantern_red,
            'chochin': lantern_chochin, 'brass': lantern_brass}


def fixture(c, x, y, side, kind, style, emblem_index=0, **kw):
    """Hang a sign or a lantern from the wall at (x, y)."""
    if kind == 'lantern':
        LANTERNS[style](c, x, y, side, **kw)
    else:
        SIGNS[style](c, x, y, side, emblem_index, **kw)


# ------------------------------------------------------------------ sheet

def make(out, zoom=3):
    from art.reference import current_adult
    adult = current_adult()
    cw, chh, gap = 58, 64, 6
    walls = {'painted': lambda c, x, y, w, h: ashlar(c, x, y, w, h),
             'oak': lambda c, x, y, w, h: render(c, x, y, w, h),
             'cutout': lambda c, x, y, w, h: brick(c, x, y, w, h),
             'lacquer': lambda c, x, y, w, h: boards(c, x, y, w, h, RAMPS['cedar']),
             'split': lambda c, x, y, w, h: boards(c, x, y, w, h, RAMPS['cedar']),
             'pennant': lambda c, x, y, w, h: whitewash(c, x, y, w, h),
             'bazaar': lambda c, x, y, w, h: render(c, x, y, w, h, RAMPS['plaster-ochre'])}
    lwall = {'iron': walls['oak'], 'gas': walls['painted'], 'red': walls['lacquer'],
             'chochin': walls['split'], 'brass': walls['bazaar']}
    picks = {'painted': [3, 1], 'oak': [0, 4], 'cutout': [3, 4], 'lacquer': [9, 5],
             'split': [9, 0], 'pennant': [12, 7], 'bazaar': [12, 9]}
    top = 22
    cols = 7
    W = gap + cols * (cw * 2 + gap) + 30
    H = top + 3 * (chh + 20) + 60
    c = C(W, H)
    c.rect(0, 0, W, H, (28, 24, 34, 255))
    labels = []
    for i, (style, embs) in enumerate(picks.items()):
        x = gap + i * (cw * 2 + gap) // 1
        y = top
        walls[style](c, x, y, cw * 2, chh)
        fixture(c, x + 6, y + 16, 1, 'sign', style, embs[0])
        fixture(c, x + cw * 2 - 6, y + 16, -1, 'sign', style, embs[1])
        labels.append((x, y + chh + 2, style))
    y = top + chh + 20
    for k in range(16):
        x = gap + k * 26
        board(c, x, y, 22, 18, ['green', 'oxblood', 'blue', 'cream'][k % 4])
        ew, eh = len(EMBLEMS[k][2][0]), len(EMBLEMS[k][2])
        emblem(c, x + (22 - ew) // 2, y + (18 - eh) // 2, k)
        labels.append((x, y + 20, EMBLEMS[k][0]))
    y += 48
    for i, (style, wall) in enumerate(lwall.items()):
        x = gap + i * (cw + gap + 20)
        wall(c, x, y, cw + 14, chh)
        fixture(c, x + 6, y + 14, 1, 'lantern', style)
        labels.append((x, y + chh + 2, style + ' lantern'))
    c.im.alpha_composite(adult, (gap + 5 * (cw + gap + 20) + 10, y + chh - adult.height))
    im = c.im.resize((W * zoom, H * zoom), Image.NEAREST)
    d = ImageDraw.Draw(im)
    font = ImageFont.load_default(size=15)
    d.text((gap * zoom, 4 * zoom), 'FRONT FIXTURES  ·  sign styles of signage.ts, the sixteen trade emblems, lanterns  ·  adult for scale',
           font=font, fill=(240, 220, 170))
    for x, y, t in labels:
        d.text((x * zoom, y * zoom), t, font=font, fill=(205, 196, 220))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-fixtures.png')
