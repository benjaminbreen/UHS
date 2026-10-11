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
# The marks of signage.ts, in its order: the first sixteen are indexed by the
# baked house specs, so new marks go on the end. Drawn by hand on a 12px grid:
# o outline, h highlight, a light, b body, c shade, in the mark's own ramp;
# w/v oak handle light/dark, g gilt, f flame, i horn, r red.

EMBLEMS = [
    ('Jug', 'pewter', ["..oooooooo..", "..ohaaaabo..", "...oaabbo...", "..oaabbbbooo", ".oaabbbbbo.o",
                       ".ohabbbbco.o", ".oaabbbbcooo", ".oabbbbbco..", ".oabbbbbco..", "..oabbbco...",
                       "..occcccco..", "...ooooo...."]),
    ('Shears', 'steel', ["o..........o", "oo........oo", ".oho....oho.", "..oho..oho..", "...ohooho...",
                         "....oaco....", "...oo..oo...", "..obbo.obbo.", ".ob..bob..bo", ".ob..bob..bo",
                         "..obbo.obbo."]),
    ('Hammer', 'steel', [".oooooooooo.", "ohaaaaaabbco", "oabbbbbbccco", ".oooowvooooo", "....owvo....",
                         "....owvo....", "....owvo....", "....owvo....", "....owvo....", "....owvo....",
                         "....oooo...."]),
    ('Loaf', 'bread', ["...oooooo...", "..ohaaaabo..", ".ohaacaabbo.", "oaaacaabcbco", "oaacaabcbbco",
                       "oabbbbbbbcco", "obbbbbbbccco", ".occcccccco.", "..oooooooo.."]),
    ('Boot', 'leather', ["..ooooo.....", "..ohabo.....", "..oabbo.....", "..oabbo.....", "..oabbo.....",
                         "..oabbco....", "..oabbbcooo.", ".oabbbbbbbco", ".oabbbbbbbco", ".occcccccco.",
                         ".oooooooooo."]),
    ('Jar', 'clay', ["...oooooo...", "....oaco....", "...ohaaco...", "..oaabbbco..", ".oaabbbbbco.",
                     ".oabrrrrbco.", ".oabbbbbbco.", "..obbbbbco..", "...obbbco...", "....occo....",
                     ".....oo....."]),
    ('Bell', 'gilt', [".....oo.....", "....ohco....", "...oaabco...", "...oabbco...", "...oabbco...",
                      "..oaabbbco..", "..oabbbbco..", ".oaabbbbbco.", "oaabbbbbbbco", "oooooooooooo",
                      ".....oo....."]),
    ('Fish', 'silver', ["....oooo....", "..oohaaaoo.o", ".ohoaabbbooo", "oaaabbbbbbco", ".occbbbbccoo",
                        "..oocccco..o", "....oooo...."]),
    ('Book', 'book', ["oooooooooooo", "oaaaaaaaabco", "oahhhhhhhbco", "oabbbbbbbbco", "oabbggbbbbco",
                      "oabbggbbbbco", "oabbbbbbbbco", "oahhhhhhhbco", "occcccccccco", "oooooooooooo"]),
    ('Tea cup', 'porcelain', ["....i..i....", ".....i..i...", "....i..i....", "oooooooooo..", "ohaaaaaabooo",
                              "oabbrrbbbo.o", "oabbbbbbbo.o", ".obbbbbbcooo", "..obbbbco...", ".oooooooooo."]),
    ('Mortar', 'brass', ["........oo..", ".......owo..", "......owo...", ".....owo....", "oooooowooooo",
                         "ohaaaaabbbco", ".oaabbbbbco.", "..oabbbbco..", "..oabbbbco..", "...occcco...",
                         "..oooooooo.."]),
    ('Scales', 'brass', [".....oo.....", "oooooaaooooo", ".o...oo...o.", ".o...oo...o.", "o.o..oo..o.o",
                         "obbo.oo.obbo", ".oo..oo..oo.", ".....oo.....", ".....oo.....", "...oaaaao...",
                         "..oooooooo.."]),
    ('Cloth', 'cloth', ["..oooooooo..", ".ohaaaaaabo.", "oaabbbbbbbco", "orrrrrrrrrro", "oabbbbbbbbco",
                        "oabbbbbbbbco", "orrrrrrrrrro", ".occccccccoo", "..oooooooooc"]),
    ('Bath', 'copper', ["..i..i..i...", "...i..i..i..", "..i..i..i...", "oooooooooooo", "ohaaaaaaabco",
                        "oabbbbbbbbco", ".oabbbbbbco.", "..obbbbbbo..", "..oo....oo.."]),
    ('Stage', 'gilt', [".oooooooooo.", "ohhaaaaaabbo", "oaaaaaaaaabo", "oaoooaaooobo", "oaaoaaaaoabo", "oaaaaaaaaabo", "oaoaaaaaaobo", ".oaoooooobo.", "..oaabbbbo..", "...oooooo..."]),
    ('Dice', 'ivory', [".oooooooooo.", "ohhhhhhhhhbo", "ohoohhhhhhbo", "ohoohhhhhhbo", "ohhhhhhhhhbo", "ohhhhoohhhbo", "ohhhhoohhhbo", "ohhhhhhhhhbo", "ohhhhhhhoobo", "ohhhhhhhoobo", "obbbbbbbbbco", ".oooooooooo."]),
    # Guild marks, from here on new: the German bakers' pretzel, the barber's
    # basin, the pawnbroker's three balls, the locksmith's key, the glover's
    # glove, the chandler's candle, the butcher's ox, the carpenter's saw.
    ('Pretzel', 'bread', ["..xxx..xxx..", ".xxxxxxxxxx.", "xx..xxxx..xx", "xx...xx...xx", "xx..xxxx..xx",
                          ".xxxx..xxxx.", "..xx....xx..", "..xxx..xxx..", "...xx..xx..."]),
    ('Basin', 'brass', ["............", ".oooo..oooo.", "ohaaao.oabco", "oabbbbbbbbco", ".oabbbbbbco.",
                        "..occcccco..", "...oooooo..."]),
    ('Balls', 'gilt', ["oooooooooooo", "..o.....o...", "..oo....oo..", ".ohao..ohao.", ".obco..obco.",
                       "..oo.o..oo..", ".....oo.....", "....ohao....", "....obco....", ".....oo....."]),
    ('Key', 'steel', [".oooo.......", "ohaabo......", "oa..bcoooooo", "oa..bcaaaabo", "obbbcoooobbo",
                      ".oooo...ob.o", "........oo.o"]),
    ('Glove', 'leather', ["...o.o.o....", "..ohoaoao...", "..oaobobo...", "..oaobobo.o.", "..oabbbbooao",
                          "..oabbbbbbo.", "..oabbbbbo..", "...oabbbo...", "...oabbbo...", "...occcco...",
                          "...oooooo..."]),
    ('Candle', 'ivory', [".....o......", "....ofo.....", "....ofo.....", ".....o......", "....ooo.....",
                         "...ohabo....", "...oabco....", "...oabco....", "...oabco....", "...oabco....",
                         ".oooooooooo.", ".oggggggggo.", "..oooooooo.."]),
    ('Ox', 'leather', ["oo........oo", "oio......oio", ".oio....oio.", "..oooooooo..", "..oaaaaabo..",
                       ".ooaoaaobooo", "..oaaaaabo..", "..oabbbbbo..", "...obiibo...", "...obbbbo...",
                       "....oooo...."]),
    ('Saw', 'steel', ["ooooo.......", "owwvo.......", "ow.voooooooo", "owwvahhhhhho", "ooooabbbbbbo",
                      "....ococococ"]),
]
EMBLEM_RAMP = {
    'pewter': ramp(240, 0.02, lift=-0.04), 'steel': ramp(245, 0.025, lift=-0.08),
    'bread': ramp(65, 0.12), 'leather': ramp(45, 0.1, lift=-0.12), 'clay': RAMPS['terracotta'],
    'gilt': GILT, 'silver': ramp(225, 0.03), 'book': ramp(25, 0.14, lift=-0.1),
    'porcelain': ramp(250, 0.03, lift=0.04), 'brass': ramp(78, 0.11, lift=-0.04),
    'cloth': ramp(255, 0.1, lift=-0.08), 'copper': ramp(45, 0.12, lift=-0.04),
    'ivory': ramp(88, 0.03, lift=0.03),
}
FLAME = ramp(60, 0.16, lift=0.06)
RED = ramp(25, 0.15, lift=-0.06)


def _shade(rows):
    """A mark drawn as a mask of x: outlined round, lit along its top and
    left, shaded along its bottom and right."""
    W, H = len(rows[0]) + 2, len(rows) + 2
    m = [[False] * W for _ in range(H)]
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            m[j + 1][i + 1] = ch == 'x'
    out = []
    for j in range(H):
        line = ''
        for i in range(W):
            n = lambda dx, dy: 0 <= i + dx < W and 0 <= j + dy < H and m[j + dy][i + dx]
            if m[j][i]:
                line += 'h' if not n(0, -1) and not n(-1, 0) else 'a' if not n(0, -1) else 'c' if not n(0, 1) or not n(1, 0) else 'b'
            else:
                line += 'o' if any(n(dx, dy) for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1))) else '.'
        out.append(line)
    return out


EMBLEMS = [(n, m, _shade(r) if any('x' in row for row in r) else r) for n, m, r in EMBLEMS]


def emblem_size(index):
    rows = EMBLEMS[index][2]
    return len(rows[0]), len(rows)


def emblem(c, x, y, index, tint=None):
    """Draw emblem `index` with its top-left at (x, y); returns its size."""
    name, mat, rows = EMBLEMS[index]
    r = tint or EMBLEM_RAMP[mat]
    key = {'o': mix(r[7], (30, 18, 34, 255), 0.4), 'h': r[0], 'a': r[1], 'b': r[3], 'c': r[5],
           'w': OAK[2], 'v': OAK[4], 'g': GILT[2], 'f': FLAME[1], 'i': EMBLEM_RAMP['ivory'][1], 'r': RED[3]}
    if mat == 'book':
        key['h'] = ramp(85, 0.03, lift=0.03)[1]
    if mat == 'ivory':
        key['o'] = (40, 28, 40, 255)
    if tint:
        for k in 'wvgir':
            key[k] = r[3]
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
    w, h = r - l + 7, 19
    bx = l - 3
    chain(c, l, y + 2, y + 5); chain(c, r, y + 2, y + 5)
    board(c, bx, y + 5, w, h, paint)
    ew, eh = emblem_size(emb)
    emblem(c, bx + (w - ew) // 2, y + 5 + (h - eh) // 2, emb)


def sign_oak(c, x, y, side, emb):
    """Medieval: an oak board on chains from a timber arm, the mark painted
    plain on bare wood."""
    a, b = timber_arm(c, x, y, side)
    l, r = min(a, b), max(a, b)
    w, h = r - l + 7, 18
    chain(c, l, y + 3, y + 6); chain(c, r, y + 3, y + 6)
    bx = l - 3
    op.raised(c, bx, y + 6, w, h, OAK, 2)
    for xx in range(bx + 1, bx + w - 1, 5):
        c.rect(xx, y + 7, 1, h - 2, OAK[3])
    ew, eh = emblem_size(emb)
    emblem(c, bx + (w - ew) // 2, y + 6 + (h - eh) // 2, emb)


def sign_cutout(c, x, y, side, emb):
    """The mark itself, gilt and hung from a scroll bracket: the bakers' and
    bootmakers' sign across northern Europe."""
    a, b = scroll_bracket(c, x, y, side, 26)
    chain(c, b, y + 2, y + 9)
    ew = emblem_size(emb)[0]
    emblem(c, b - ew // 2, y + 9, emb, GILT)


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
    """South and Southeast Asia: a cloth hung from a bamboo pole run out from
    the wall, swallow-tailed, the mark painted on it."""
    bam = ramp(90, 0.09)
    sx = lambda d: x + side * d
    for d in range(24):
        c.p(sx(d), y, bam[2] if d % 7 else bam[4])
        c.p(sx(d), y + 1, bam[4])
    c.p(sx(24), y, bam[3])
    cl = CLOTH[colour]
    l = min(sx(5), sx(21))
    w, h = 17, 26
    for b in range(h):
        sway = 0 if b < 8 else 1 if b < 18 else 2
        for a in range(w):
            if b > h - 6 and abs(a - w // 2) < (b - (h - 6)) * 1.4:
                continue
            col = cl[3]
            if b == 0 or a == 0:
                col = cl[2]
            elif a == w - 1 or b > h - 3:
                col = cl[4]
            elif a == 2 or a == w - 3:
                col = cl[5]
            c.p(l + a + sway * side, y + 2 + b, col)
    ew, eh = emblem_size(emb)
    emblem(c, l + (w - ew) // 2 + side, y + 6, emb, EMBLEM_RAMP['ivory'] if colour != 'white' else None)


def sign_bazaar(c, x, y, side, emb, colour='red'):
    """Ottoman and Persian bazaars: a cloth banner on a rod, fringed, a
    border band, the mark woven in."""
    cl = CLOTH[colour]
    sx = lambda d: x + side * d
    for d in range(22):
        c.p(sx(d), y, IRON[2]); c.p(sx(d), y + 1, IRON[4])
    l = min(sx(3), sx(20))
    w, h = 18, 24
    for yy in range(y + 2, y + 2 + h):
        for xx in range(l, l + w):
            a, b = xx - l, yy - y - 2
            sway = int(math.sin(b * 0.3) * 0.6)
            col = cl[3]
            if a < 2 or a > w - 3 or b < 2:
                col = GILT[3]
            elif a == 2 or a == w - 3 or b == 2:
                col = cl[5]
            if a == 0:
                col = cl[2]
            c.p(xx + sway, yy, col)
    for xx in range(l, l + w, 2):
        c.p(xx, y + 2 + h, GILT[2]); c.p(xx, y + 3 + h, GILT[3])
    ew, eh = emblem_size(emb)
    emblem(c, l + (w - ew) // 2, y + 6, emb, GILT)



# The forms the street took by place and period, past the hanging board.

LETTERS = {'P': ['xx.', 'x.x', 'xx.', 'x..', 'x..'], 'A': ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'],
           'I': ['x', 'x', 'x', 'x', 'x'], 'N': ['x..x', 'xx.x', 'x.xx', 'x..x', 'x..x']}

def sign_bush(c, x, y, side, emb=0):
    """The ale-stake: a pole out from an English alehouse with a bush of
    greenery tied at its end. Its length was capped in London in 1375."""
    sx = lambda d: x + side * d
    c.rect(min(x, x + side * 3), y - 3, 3, 9, OAK[4])
    for d in range(30):
        c.p(sx(d), y, OAK[1]); c.p(sx(d), y + 1, OAK[3]); c.p(sx(d), y + 2, OAK[5])
    for i in range(13):
        c.p(sx(2 + i), y + 15 - i, OAK[3]); c.p(sx(3 + i), y + 15 - i, OAK[5])
    c.p(sx(30), y, OAK[2]); c.p(sx(30), y + 1, OAK[4]); c.p(sx(30), y + 2, OAK[5])
    leaf = ramp(140, 0.1, lift=-0.08)
    cx, cy = sx(26), y + 11
    chain(c, cx, y + 3, y + 5)
    for yy in range(-7, 9):
        for xx in range(-8, 9):
            d = (xx / 8) ** 2 + (yy / 7.5) ** 2
            if d <= 1 - 0.3 * h2(xx, yy, 7):
                col = leaf[1] if xx + yy < -5 else leaf[3] if xx + yy < 4 else leaf[5]
                if h2(xx, yy, 3) < 0.16:
                    col = leaf[min(7, leaf.index(col) + 1)]
                c.p(cx + xx, cy + yy, col)
    for k in range(-1, 2):
        c.p(cx + k, cy - 6, ramp(25, 0.15)[3])


def sign_barber(c, x, y, side, emb=17):
    """A barber-surgeon's pole, banded red and white, run out from the wall
    with the brass basin hung from its end."""
    sx = lambda d: x + side * d
    red, white = CLOTH['red'], CLOTH['white']
    c.rect(min(x, x + side * 3), y - 4, 3, 10, IRON[3])
    for d in range(28):
        top = y - d // 3
        for k in range(4):
            band = ((d + k) // 3) % 2
            col = (white if band else red)[(1, 2, 3, 5)[k]]
            c.p(sx(d), top + k, col)
    for k in range(5):
        c.p(sx(28), y - 9 + k, GILT[1 + k // 2]); c.p(sx(29), y - 9 + k, GILT[3 + k // 3])
    m = sx(22)
    chain(c, m, y - 3, y + 4)
    ew, eh = emblem_size(emb)
    emblem(c, m - ew // 2, y + 4, emb)


def sign_fascia(c, x, y, side, emb, w=46, paint='green', word='PAIN'):
    """After the 1760s Paris and London had their hanging signs taken down;
    the name went on a board flat over the shop, under a moulded cornice.
    The emblem keeps a place at its end; the game letters the rest."""
    # The game's 3x5 face (src/render/sign-texture.ts), enough for the sheet.
    p = BOARD.get(paint) or paint
    l = x if side > 0 else x - w
    c.rect(l - 2, y, w + 4, 2, RAMPS['limestone'][1])
    c.rect(l - 2, y + 2, w + 4, 1, RAMPS['limestone'][4])
    op.raised(c, l, y + 3, w, 14, p, 3)
    c.rect(l + 2, y + 5, w - 4, 10, p[4])
    c.rect(l + 2, y + 5, w - 4, 1, p[5])
    c.rect(l + 1, y + 17, w - 2, 1, mix(p[6], (30, 18, 34, 255), 0.3))
    ew, eh = emblem_size(emb)
    emblem(c, l + 3, y + 4 + (12 - eh) // 2 + 1, emb, GILT)
    gx = l + ew + 8
    for ch in word:
        glyph = LETTERS.get(ch, ['...'] * 5)
        for j, row in enumerate(glyph):
            for i, bit in enumerate(row):
                if bit == 'x':
                    c.p(gx + i, y + 7 + j, GILT[1] if j < 2 else GILT[3])
        gx += len(glyph[0]) + 1


def sign_relief(c, x, y, side, emb):
    """Rome and Pompeii: the mark cut in relief on a terracotta plaque set
    into the wall beside the door."""
    t = RAMPS['terracotta']
    ew, eh = emblem_size(emb)
    w, h = ew + 8, eh + 8
    l = x if side > 0 else x - w
    op.raised(c, l, y, w, h, t, 3)
    c.rect(l + 2, y + 2, w - 4, h - 4, t[4])
    c.rect(l + 2, y + 2, w - 4, 1, t[5])
    c.rect(l + 2, y + 2, 1, h - 4, t[5])
    emblem(c, l + 4, y + 4, emb, t)


def sign_dipinto(c, x, y, side, emb):
    """A notice painted straight on the plaster, framed in red, as on the
    shopfronts of Pompeii: the mark in colour, a line of red capitals under."""
    red = RAMPS['pompeian-red']
    ew, eh = emblem_size(emb)
    w, h = ew + 16, eh + 13
    l = x if side > 0 else x - w
    c.rect(l, y, w, h, red[3])
    c.rect(l + 2, y + 2, w - 4, h - 4, RAMPS['whitewash'][1])
    c.rect(l + 2, y + 2, w - 4, 1, RAMPS['whitewash'][3])
    emblem(c, l + (w - ew) // 2, y + 4, emb)
    for k in range(4):
        c.rect(l + 4 + k * 5, y + h - 6, 3, 2, red[4])


def sign_noren(c, x, y, side, emb=None, w=24, colour='indigo'):
    """Edo Japan: a noren split into panels across the doorway's head, dyed
    with the house's crest. (x, y) is the left end of its rod."""
    cl = CLOTH[colour]
    c.rect(x - 2, y, w + 4, 2, RAMPS['cedar'][3])
    c.p(x - 2, y, RAMPS['cedar'][2])
    panels, h = 3, 18
    pw = (w - (panels - 1)) // panels
    for k in range(panels):
        l = x + k * (pw + 1)
        for b in range(h):
            for a in range(pw):
                col = cl[2] if b == 0 else cl[3] if a < pw - 1 else cl[4]
                if b == h - 1:
                    col = cl[4]
                c.p(l + a, y + 2 + b, col)
    white = CLOTH['white']
    cx, cy = x + w // 2, y + 9
    for yy in range(-4, 5):
        for xx in range(-4, 5):
            d = xx * xx + yy * yy
            if 9 <= d <= 18 or (d <= 2):
                if c.g(cx + xx, cy + yy) != (0, 0, 0, 0) and c.g(cx + xx, cy + yy)[:3] != (0, 0, 0):
                    c.p(cx + xx, cy + yy, white[1] if yy < 0 else white[2])


def sign_wineflag(c, x, y, side, emb=None):
    """Song China: the wine shop's flag, a long white banner bordered blue on
    a pole run up from the wall, as in the Qingming scroll."""
    bam = ramp(90, 0.09)
    sx = lambda d: x + side * d
    for d in range(30):
        c.p(sx(d), y - d // 2, bam[2]); c.p(sx(d), y - d // 2 + 1, bam[4])
    blue, white = CLOTH['indigo'], CLOTH['white']
    l = sx(26) - (0 if side > 0 else 12)
    top = y - 12
    w, h = 13, 34
    for b in range(h):
        sway = 0 if b < 12 else side if b < 24 else 2 * side
        for a in range(w):
            col = white[1] if a == 2 else white[2] if a < w - 3 else white[3]
            if b in (13, 25) and 2 < a < w - 2:
                col = white[4]
            if a < 2 or a > w - 3 or b < 2:
                col = blue[2] if a == 0 or b == 0 else blue[4] if a == w - 1 else blue[3]
            if b > h - 4:
                col = blue[3] if (a // 2) % 2 == 0 else None
            if col:
                c.p(l + a + sway, top + b, col)
    ink = (34, 26, 30, 255)
    gx, gy = l + 3, top + 6
    # 酒: the water strokes down the left, the wine jar beside them.
    strokes = [(0, 0, 7, 1), (3, 0, 1, 4), (0, 3, 7, 1), (1, 6, 5, 1), (1, 6, 1, 6), (5, 6, 1, 6), (1, 9, 5, 1), (1, 11, 5, 1),
               (-2, 2, 1, 1), (-2, 6, 1, 1), (-2, 9, 1, 2)]
    for dx, dy, ww, hh in strokes:
        c.rect(gx + dx + 1, gy + dy + 4, ww, hh, ink)


def sign_sugidama(c, x, y, side, emb=None):
    """A sake brewer's cedar ball, hung green when the new brew is pressed and
    left to brown as it ages."""
    a, b = timber_arm(c, x, y, side, 14)
    m = (a + b) // 2
    chain(c, m, y + 3, y + 6)
    g = ramp(120, 0.08, lift=-0.1)
    for yy in range(-8, 9):
        for xx in range(-8, 9):
            d = (xx / 8) ** 2 + (yy / 8) ** 2
            if d <= 1 - 0.18 * h2(xx, yy, 11):
                col = g[1] if xx + yy < -6 else g[2] if xx + yy < 0 else g[4] if xx + yy < 7 else g[5]
                if h2(xx, yy, 5) < 0.22:
                    col = g[min(7, g.index(col) + 1)]
                c.p(m + xx, y + 15 + yy, col)


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
         'split': sign_split, 'pennant': sign_pennant, 'bazaar': sign_bazaar, 'bush': sign_bush,
         'barber': sign_barber, 'fascia': sign_fascia, 'relief': sign_relief, 'dipinto': sign_dipinto,
         'noren': sign_noren, 'wineflag': sign_wineflag, 'sugidama': sign_sugidama}
# Flat on the wall: no shadow cast clear of it.
FLAT = {'relief', 'dipinto'}
LANTERNS = {'iron': lantern_iron, 'gas': lantern_gas, 'red': lantern_red,
            'chochin': lantern_chochin, 'brass': lantern_brass}


def fixture(c, x, y, side, kind, style, emblem_index=0, **kw):
    """Hang a sign or a lantern from the wall at (x, y). Anything standing
    off the wall drops a shadow down and away on it, a step darker."""
    layer = C(c.w, c.h)
    if kind == 'lantern':
        LANTERNS[style](layer, x, y, side, **kw)
    else:
        SIGNS[style](layer, x, y, side, emblem_index, **kw)
    box = layer.im.getbbox()
    if box and style not in FLAT:
        dx, dy = 2, 3
        for yy in range(box[1], box[3]):
            for xx in range(box[0], box[2]):
                if layer.px[xx, yy][3] and not layer.g(xx + dx, yy + dy)[3]:
                    q = c.g(xx + dx, yy + dy)
                    if q[3]:
                        c.p(xx + dx, yy + dy, mix(q, (52, 34, 70, 255), 0.38))
    c.im.alpha_composite(layer.im)


# ------------------------------------------------------------------ sheet

def make(out, zoom=3):
    from art.reference import current_adult
    adult = current_adult()
    pw, ph, gap = 120, 70, 8
    tufa = lambda c, x, y, w, h: render(c, x, y, w, h, RAMPS['tufa'])
    cedar = lambda c, x, y, w, h: boards(c, x, y, w, h, RAMPS['cedar'])
    ochre = lambda c, x, y, w, h: render(c, x, y, w, h, RAMPS['plaster-ochre'])
    wash = lambda c, x, y, w, h: whitewash(c, x, y, w, h)
    stone = lambda c, x, y, w, h: ashlar(c, x, y, w, h)
    plaster = lambda c, x, y, w, h: render(c, x, y, w, h)
    bricks = lambda c, x, y, w, h: brick(c, x, y, w, h)
    # (style, wall, [(x, y, side, emblem, kw)], door, label)
    rows = [
        ('Europe', [
            ('oak', plaster, [(6, 14, 1, 0, {}), (pw - 6, 14, -1, 4, {})], False, 'oak board · 1100-1500'),
            ('painted', stone, [(6, 14, 1, 3, {}), (pw - 6, 14, -1, 16, {'paint': 'oxblood'})], False, 'painted · 1500-1760'),
            ('cutout', plaster, [(6, 12, 1, 16, {}), (pw - 6, 12, -1, 19, {})], False, 'gilt cut-out'),
            ('bush', plaster, [(4, 16, 1, 0, {})], False, 'ale-stake · alehouse'),
            ('barber', plaster, [(6, 30, 1, 17, {})], False, 'barber pole & basin'),
            ('fascia', stone, [(pw // 2 - 23, 12, 1, 3, {})], True, 'fascia · after 1760'),
        ]),
        ('Rome · Western Asia · India', [
            ('relief', tufa, [(10, 22, 1, 3, {}), (pw - 10, 22, -1, 22, {})], False, 'relief · Rome, Ostia'),
            ('dipinto', plaster, [(8, 18, 1, 12, {}), (pw - 8, 18, -1, 0, {})], False, 'dipinto · Pompeii'),
            ('bazaar', ochre, [(6, 12, 1, 12, {}), (pw - 6, 12, -1, 9, {'colour': 'indigo'})], False, 'bazaar banner'),
            ('pennant', wash, [(6, 12, 1, 12, {}), (pw - 6, 12, -1, 7, {'colour': 'red'})], False, 'pennant · India, SE Asia'),
        ]),
        ('East Asia', [
            ('noren', cedar, [(pw // 2 - 12, 18, 1, 0, {})], True, 'noren · Edo'),
            ('sugidama', cedar, [(6, 10, 1, 0, {})], False, 'sugidama · sake brewer'),
            ('split', cedar, [(6, 14, 1, 9, {}), (pw - 6, 14, -1, 0, {})], False, 'kanban · Japan'),
            ('wineflag', wash, [(6, 40, 1, 0, {})], False, 'wine flag · Song'),
            ('lacquer', cedar, [(6, 14, 1, 9, {}), (pw - 6, 14, -1, 5, {})], False, 'lacquer board · China'),
        ]),
    ]
    top, head = 26, 14
    W = gap + 6 * (pw + gap) + 10
    H = top + len(rows) * (head + ph + 16) + 2 * 22 + 30 + ph + 40
    c = C(W, H)
    c.rect(0, 0, W, H, (28, 24, 34, 255))
    labels, heads = [], []
    y = top
    for title, panels in rows:
        heads.append((gap, y, title))
        y += head
        for i, (style, wall, hangs, door, label) in enumerate(panels):
            x = gap + i * (pw + gap)
            wall(c, x, y, pw, ph)
            if door:
                dx = x + pw // 2 - 12
                c.rect(dx, y + 20, 24, ph - 20, (46, 32, 44, 255))
                op.reveal(c, dx, y + 20, 24, ph - 20)
            for hx, hy, side, emb, kw in hangs:
                fixture(c, x + hx, y + hy, side, 'sign', style, emb, **kw)
            labels.append((x, y + ph + 2, label))
        y += ph + 16
    heads.append((gap, y, 'Trade marks · 16 of signage.ts, then guild marks'))
    y += head
    for k in range(len(EMBLEMS)):
        x = gap + (k % 12) * 26
        yy = y + (k // 12) * 22
        board(c, x, yy, 22, 19, ['green', 'oxblood', 'blue', 'cream'][k % 4])
        ew, eh = emblem_size(k)
        emblem(c, x + (22 - ew) // 2, yy + (19 - eh) // 2, k)
    names = '  '.join(f'{i}:{n}' for i, (n, _, _) in enumerate(EMBLEMS))
    labels.append((gap + 12 * 26 + 6, y + 4, names[:150]))
    labels.append((gap + 12 * 26 + 6, y + 14, names[150:300]))
    labels.append((gap + 12 * 26 + 6, y + 24, names[300:]))
    y += 2 * 22 + 14
    heads.append((gap, y, 'Lanterns'))
    y += head
    lwall = [('iron', plaster), ('gas', stone), ('red', cedar), ('chochin', cedar), ('brass', ochre)]
    for i, (style, wall) in enumerate(lwall):
        x = gap + i * (pw // 2 + 30 + gap)
        wall(c, x, y, pw // 2 + 30, ph)
        fixture(c, x + 6, y + 14, 1, 'lantern', style)
        labels.append((x, y + ph + 2, style))
    c.im.alpha_composite(adult, (gap + 5 * (pw // 2 + 30 + gap) + 14, y + ph - adult.height))
    im = c.im.resize((W * zoom, H * zoom), Image.NEAREST)
    d = ImageDraw.Draw(im)
    font = ImageFont.load_default(size=15)
    d.text((gap * zoom, 6 * zoom), 'FRONT FIXTURES  ·  hung off the wall, cast shadow on it  ·  by region and period  ·  adult for scale',
           font=font, fill=(240, 220, 170))
    for x, yy, t in heads:
        d.text((x * zoom, yy * zoom), t, font=font, fill=(240, 220, 170))
    for x, yy, t in labels:
        d.text((x * zoom, yy * zoom), t, font=ImageFont.load_default(size=13), fill=(205, 196, 220))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-fixtures.png')
