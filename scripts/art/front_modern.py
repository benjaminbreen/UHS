"""The twentieth-century street drawn front-on, 1900 to 1990.

    .venv/bin/python scripts/art/front_modern.py artifacts/modern-ab.png

The American Main Street as it stood in the eighties: the false-front store
that survived from the cattle towns, the two-part brick commercial block of
1900-1925, the stainless diner, the motel and its pole sign, the travertine
bank of the sixties with a time-and-temperature sign, the strip center under a
shake mansard, the curtain-wall office and the deco picture palace. Then the
same century elsewhere: a Mexico City apartment block of painted concrete over
shops with roll-down cortinas and painted rotulos, rebar left standing for the
next floor and tinacos on a red-coated roof; and a Tokyo zakkyo building of
small tiles, with a tenant per floor named in katakana on its windows and in a
column of lit kanban.

Neon, bulbs and moving parts are registered as they are drawn, so a building
can give a lamplit frame (`night`) and an animation (`frames()`) of its own.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_iberia as ib  # noqa: E402
from art.front_kit import outline, consolidate, FONT  # noqa: E402

ALU = ramp(245, 0.01, lift=0.04)
STEEL = ramp(240, 0.014, warm=8, cool=12, lift=0.07)
BRONZE = ramp(55, 0.04, lift=-0.2)          # dark anodised aluminium
CONCRETE = ramp(85, 0.014, lift=0.02)
CMU = ramp(80, 0.02, lift=0.04)
TAR = ramp(275, 0.018, lift=-0.14)
FELT = ramp(255, 0.014, lift=0.0)           # felt under a silvered coat
GRAVEL = ramp(70, 0.03, lift=-0.02)
IMPER = ramp(32, 0.1, lift=-0.08)           # the red waterproofing coat of a Mexican roof
TIN = ramp(240, 0.014, lift=-0.02)
RUST = ramp(40, 0.09, lift=-0.12)
ROOM = ramp(320, 0.03, lift=-0.16)
GLASS = op.GLASS
TINT = {'blue': ramp(232, 0.06, lift=-0.06), 'bronze': ramp(58, 0.045, lift=-0.16),
        'green': ramp(185, 0.055, lift=-0.08), 'sky': ramp(225, 0.06, lift=0.02)}
BRICK = RAMPS['brick']
BUFF = ramp(72, 0.065, lift=0.02)
CHOCOLATE = ramp(36, 0.075, lift=-0.1)
LIMESTONE = RAMPS['limestone']
TRAV = RAMPS['travertine']
GRANITE = ramp(20, 0.02, lift=-0.3)
PINKGRAN = ramp(32, 0.05, lift=-0.04)
TERRA = ramp(86, 0.04, lift=0.04)
PINE = RAMPS['pine']
CREAM = ramp(88, 0.045, lift=0.04)
WHITE = ramp(95, 0.01, lift=0.05)
OXBLOOD = ramp(24, 0.1, lift=-0.1)
MUSTARD = ramp(82, 0.1, lift=-0.01)
SAGE = ramp(140, 0.035, lift=-0.01)
DOVE = ramp(250, 0.016, lift=0.01)
MINT = ramp(170, 0.05, lift=0.03)
SALMON = ramp(36, 0.075, lift=0.03)
BUTTER = ramp(92, 0.085, lift=0.04)
SKY = ramp(228, 0.05, lift=0.03)
RED = ramp(27, 0.16, lift=-0.04)
BLUE = ramp(258, 0.13, lift=-0.06)
GREEN = ramp(150, 0.12, lift=-0.08)
YELLOW = ramp(92, 0.15, lift=0.03)
ORANGE = ramp(55, 0.15, lift=0.0)
TEAL = ramp(195, 0.09, lift=-0.04)
INK = ramp(280, 0.02, lift=-0.3)
GOLD = ramp(80, 0.11, lift=-0.04)
SHAKE = ramp(48, 0.07, lift=-0.1)
TILES = [ramp(75, 0.035, lift=0.03), ramp(48, 0.045, lift=-0.05), ramp(165, 0.022, lift=-0.01)]
JTILES = [ramp(36, 0.1, lift=-0.06), ramp(160, 0.075, lift=-0.1), ramp(90, 0.014, lift=0.05), ramp(250, 0.08, lift=-0.08)]
HOTPINK = ramp(355, 0.15, lift=0.0)
LIME = ramp(122, 0.15, lift=0.02)
TURQ = ramp(192, 0.12, lift=0.0)
VIOLET = ramp(300, 0.12, lift=-0.04)
SAFFRON = ramp(68, 0.16, lift=0.03)
CRIMSON = ramp(22, 0.16, lift=-0.1)
JADE = ramp(165, 0.1, lift=-0.12)
COBALT = ramp(262, 0.15, lift=-0.12)
TANGERINE = ramp(48, 0.16, lift=0.02)
AZURE = ramp(238, 0.11, lift=0.02)
OCHRE = ramp(74, 0.12, lift=0.0)
REDGRAN = ramp(25, 0.06, lift=-0.14)       # the red granite of a Moscow plinth
YBRICK = ramp(80, 0.085, lift=0.05)        # Tehran's yellow brick
TRAVY = ramp(82, 0.06, lift=0.03)          # the travertine on a Tehran front
COOLER = ramp(85, 0.03, lift=0.0)          # galvanised sheet of an evaporative cooler
PAD = ramp(66, 0.09, lift=-0.06)           # its wet straw pads
ISOGAM = ramp(240, 0.008, lift=0.1)        # bitumen felt faced in aluminium foil
WOOD_ = ramp(46, 0.07, lift=-0.1)
JUTE = ramp(70, 0.08, lift=0.0)
PANEL = ramp(95, 0.012, lift=0.02)
STOEP = ramp(28, 0.09, lift=-0.12)         # red polished cement
IRONROOF = {'green': ramp(160, 0.07, lift=-0.1), 'red': ramp(30, 0.1, lift=-0.1), 'grey': ramp(250, 0.02, lift=-0.06)}
GOODS = [RED[2], YELLOW[1], BLUE[2], GREEN[2], ORANGE[1], WHITE[1], TEAL[2], CREAM[2]]
DAYTUBE = {k: ramp(h, 0.12, lift=0.02)[2] for k, h in
           (('red', 28), ('pink', 350), ('blue', 245), ('green', 150), ('amber', 70), ('white', 95))}
# Neon is light, not paint: core and glow lie off the ladder by design.
NEON = {'red': ((255, 214, 196), (255, 70, 60)), 'pink': ((255, 220, 240), (255, 70, 170)),
        'blue': ((214, 240, 255), (70, 160, 255)), 'green': ((214, 255, 222), (60, 235, 120)),
        'amber': ((255, 240, 200), (255, 168, 40)), 'white': ((255, 255, 240), (200, 220, 255))}
LAMP = {'warm': ((255, 206, 120), (255, 228, 164)), 'cool': ((176, 222, 214), (214, 244, 232)),
        'shop': ((255, 236, 196), (255, 250, 228)), 'tv': ((120, 170, 255), (190, 220, 255)),
        'dim': ((214, 140, 70), (240, 176, 100))}
FRAMES = 16

DIGITS = {'0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
          '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010',
          '8': '111101111101111', '9': '111101111001110', ':': '000010000010000', '.': '000000000000010',
          '-': '000000111000000', '&': '010101010101011', "'": '010010000000000', '*': '010101010000000',
          '+': '000010111010000', '$': '011110010011110'}
GLYPHS = {**FONT, **DIGITS}
# Cyrillic: letters that share a Latin form use it; the rest are drawn here.
LOOKALIKE = dict(zip('АВЕКМНОРСТХ', 'ABEKMHOPCTX'))
CYR = {'П': '111101101101101', 'Д': '011101101111101', 'Г': '111100100100100', 'Л': '011101101101101',
       'Б': '111100110101110', 'У': '101101011001110', 'Я': '011101011101101', 'Ж': '101111010111101',
       'З': '110001010001110', 'Ц': '101101101111001', 'Ь': '100100110101110'}
WIDE = {'Ы': '1001100111011011' + '1101', 'И': '1001101111011001' + '1001', 'Ш': '1001100110011001' + '1111',
        'Щ': '1001100110011111' + '0001', 'Й': '0110100110111101' + '1001'}
GLYPHS.update(CYR)
# Persian, right to left: the joined word drawn whole.
FARSI = {'نان': ['0000000010000', '0010000010000', '0000000010001', '1000010010001', '1000010010001',
                 '0111100011111']}
KANA = {  # 5x5 katakana, rows top to bottom
    'ス': '11111/00010/00100/01010/10001',
    'ナ': '00100/11111/00100/00100/01000',
    'ッ': '00000/10101/10101/00010/01100',
    'ク': '01000/01111/10001/00010/01100',
    'カ': '01000/11111/01001/01001/10011',
    'ラ': '01110/00000/11111/00010/01100',
    'オ': '00010/11111/00110/01010/10010',
    'ケ': '01000/01111/10010/00010/00100',
    'コ': '11110/00010/00010/00010/11110',
    'ー': '00000/00000/11111/00000/00000',
    'ヒ': '10000/10011/11100/10000/01111',
    'メ': '00010/10010/01100/01010/10000',
    'ン': '10000/01001/00001/00010/11100',
    'バ': '00011/01010/01001/10001/10001',
    'ブ': '00011/11110/00010/00100/01000',
}
KANA = {k: v.replace('/', '') for k, v in KANA.items()}


# ------------------------------------------------------------------ lettering

# Scripts other modules draw: char -> (w, h, bits).
EXTRA = {}


def glyph(ch):
    if ch in EXTRA:
        return EXTRA[ch]
    if ch in KANA:
        return 5, 5, KANA[ch]
    if ch in WIDE:
        return 4, 5, WIDE[ch]
    return 3, 5, GLYPHS.get(LOOKALIKE.get(ch, ch), FONT[' '])


def farsi(c, x, y, word, col, shadow=None, scale=1):
    rows = FARSI[word]
    for pass_, colour, d in ((0, shadow, 1), (1, col, 0)):
        if colour is None:
            continue
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch == '1':
                    c.rect(x + i * scale + d, y + j * scale + d, scale, scale, colour)


def text_w(s, scale=1):
    return sum((glyph(ch)[0] + 1) * scale for ch in s) - scale


def text(c, x, y, s, col, shadow=None, scale=1):
    for ch in s:
        w, h, bits = glyph(ch)
        for j in range(h):
            for i in range(w):
                if bits[j * w + i] == '1':
                    if shadow:
                        c.rect(x + i * scale + 1, y + j * scale + 1, scale, scale, shadow)
        for j in range(h):
            for i in range(w):
                if bits[j * w + i] == '1':
                    c.rect(x + i * scale, y + j * scale, scale, scale, col)
        x += (w + 1) * scale


def vtext(c, cx, y, s, col, shadow=None, pitch=7):
    """Letters stacked down a blade or a kanban, centred on cx."""
    for k, ch in enumerate(s):
        w = glyph(ch)[0]
        text(c, cx - w // 2, y + k * pitch, ch, col, shadow)


def skeleton(s, x, y, vertical=False, pitch=11):
    """Tube letters: the 3x5 font at double size, drawn as 1px lines through
    the centres of its cells, as a glass bender would bend them."""
    pts = []
    for k, ch in enumerate(s):
        w, h, bits = glyph(ch)
        ox, oy = (x - w + 1, y + k * pitch) if vertical else (x + k * (2 * w + 3), y)
        on = {(i, j) for j in range(h) for i in range(w) if bits[j * w + i] == '1'}
        for i, j in on:
            pts.append((ox + 2 * i, oy + 2 * j))
            for di, dj in ((1, 0), (0, 1)):
                if (i + di, j + dj) in on:
                    pts.append((ox + 2 * i + di, oy + 2 * j + dj))
            for di in (1, -1):
                if (i + di, j + 1) in on and (i + di, j) not in on and (i, j + 1) not in on:
                    pts.append((ox + 2 * i + di, oy + 2 * j + 1))
    return pts


def skeleton_w(s):
    return sum(2 * glyph(ch)[0] + 3 for ch in s) - 3


def line(x0, y0, x1, y1):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    return [(round(x0 + (x1 - x0) * t / n), round(y0 + (y1 - y0) * t / n)) for t in range(n + 1)]


# ------------------------------------------------------------------ walls

def stucco(c, x, y, w, h, r, q=2, seed=0):
    c.rect(x, y, w, h, r[q])
    for yy in range(y, y + h, 2):
        for xx in range(x, x + w, 3):
            k = h2(xx // 3, yy // 2, seed)
            if k < 0.035:
                c.rect(xx, yy, 3, 1, r[q + 1])
            elif k > 0.975:
                c.rect(xx, yy, 2, 1, r[q - 1])


def cmu(c, x, y, w, h, r, q=2):
    """Painted concrete block in stacked bond: only the joints show."""
    c.rect(x, y, w, h, r[q])
    for yy in range(y + 7, y + h, 8):
        c.rect(x, yy, w, 1, r[q + 1])
    for yy in range(y, y + h, 8):
        for xx in range(x + 15, x + w, 16):
            c.rect(xx, yy, 1, min(7, y + h - yy), r[q + 1])


def panels(c, x, y, w, h, r, pw=24, ph=12, q=2, seed=0):
    """Stone cladding in large slabs, a vein now and then."""
    c.rect(x, y, w, h, r[q])
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = (xx - x) % pw, (yy - y) % ph
            if b == ph - 1 or a == pw - 1:
                c.p(xx, yy, r[q + 2])
            elif b == 0:
                c.p(xx, yy, r[q - 1])
            elif h2((xx - x) // pw, (yy - y) // ph, seed) < 0.4 and b == 4 + (xx // 5) % 3 and a % 9 < 5:
                c.p(xx, yy, r[q + 1])


def flutes(c, x, y, w, h, r=STEEL):
    """Stainless sheet in horizontal flutes: each catches the sky on its top."""
    for yy in range(y, y + h):
        k = (yy - y) % 4
        col = (r[1], r[0], r[2], r[3])[k]
        if (yy - y) > h * 0.6 and k == 1:
            col = r[1]
        c.rect(x, yy, w, 1, col)


def tiles(c, x, y, w, h, r, size=4, seed=0):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = (xx - x) % size, (yy - y) % size
            if a == size - 1 or b == size - 1:
                c.p(xx, yy, r[3])
            else:
                k = h2((xx - x) // size, (yy - y) // size, seed)
                c.p(xx, yy, r[1] if k < 0.18 else r[2] if k < 0.92 else r[3])


def shakes(c, x, y, w, h, r=SHAKE, seed=0):
    """Cedar shakes on a mansard fascia, in courses with a shadow under each butt."""
    for yy in range(y, y + h):
        row, ly = (yy - y) // 5, (yy - y) % 5
        for xx in range(x, x + w):
            u = (xx - x + row * 5) % 9
            k = h2((xx - x + row * 5) // 9, row, seed)
            col = r[2] if k < 0.5 else r[3] if k < 0.85 else r[1]
            if ly == 4:
                col = r[5]
            elif u == 0:
                col = r[4]
            elif ly == 0 and k < 0.5:
                col = r[1]
            c.p(xx, yy, col)


# ------------------------------------------------------------------ parts

def raised(c, x, y, w, h, r, body=2):
    op.raised(c, x, y, w, h, r, body)


def cast_right(c, x, y, h, n=3, k0=0.62):
    for i in range(n):
        t = round((k0 + (1 - k0) * i / n) * 8) / 8
        for yy in range(y, y + h):
            q = c.g(x + i, yy)
            if q[3]:
                c.p(x + i, yy, (int(q[0] * t * 0.96), int(q[1] * t * 0.95), int(min(255, q[2] * t * 1.04)), 255))


def reflect(c, x, y, w, h, g=GLASS, seed=0):
    """Sky caught on plate glass: one broad diagonal streak and a thin one."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            d = (xx - x) + (yy - y) - (seed % 7)
            if 6 <= d % 40 <= 10:
                c.p(xx, yy, g[3] if d % 40 in (6, 10) else g[2])
            elif d % 40 == 14:
                c.p(xx, yy, g[3])


def interior(c, x, y, w, h, goods='shelves', seed=0):
    c.rect(x, y, w, h, ROOM[5])
    c.rect(x, y, w, max(2, h // 3), ROOM[6])
    for lx in range(x + 3, x + w - 4, 12):
        c.rect(lx, y + 1, 5, 1, CREAM[1])
    c.rect(x, y + h - 3, w, 3, ROOM[4])
    if goods == 'shelves':
        for sy in (y + h * 2 // 5, y + h * 2 // 3):
            c.rect(x, sy, w, 1, ROOM[3])
            for xx in range(x + 1, x + w - 1, 3):
                k = h2(xx, sy, seed)
                if k < 0.85:
                    c.rect(xx, sy - 2 - (k < 0.3), 2, 2 + (k < 0.3), GOODS[int(k * 97) % len(GOODS)])
    elif goods == 'racks':
        c.rect(x + 2, y + h // 4, w - 4, 1, ROOM[2])
        for xx in range(x + 3, x + w - 4, 4):
            k = h2(xx, y, seed)
            c.rect(xx, y + h // 4 + 1, 3, h // 3 + int(k * 4), GOODS[int(k * 31) % len(GOODS)])
            c.rect(xx + 2, y + h // 4 + 1, 1, h // 3 + int(k * 4), ROOM[4])
    elif goods == 'tv':
        for row in range(2):
            for xx in range(x + 2, x + w - 10, 11):
                ty = y + 4 + row * 10
                c.rect(xx, ty, 9, 8, INK[3])
                c.rect(xx + 1, ty + 1, 7, 5, TINT['sky'][2 + (h2(xx, ty, seed) < 0.4)])
                c.rect(xx + 1, ty + 1, 7, 1, TINT['sky'][1])
    elif goods == 'counter':
        cy = y + h * 3 // 5
        c.rect(x, cy, w, 1, CREAM[1])
        c.rect(x, cy + 1, w, h - (cy - y) - 3, ROOM[3])
        for xx in range(x + 4, x + w - 6, 9):
            c.rect(xx, cy - 4, 6, 4, GOODS[int(h2(xx, cy, seed) * 7)])
    elif goods == 'bread':
        c.rect(x + w // 2 - 8, y + h - 14, 16, 11, TANGERINE[3])
        c.rect(x + w // 2 - 6, y + h - 12, 12, 8, TANGERINE[1])
        c.rect(x + 1, y + 4, w - 2, 1, ROOM[3])
        for xx in range(x + 2, x + w - 8, 9):
            c.rect(xx, y + 5, 8, h // 2 - 4, CREAM[2])
            c.rect(xx, y + 5, 8, 1, CREAM[1])
            for k in range(3):
                c.p(xx + 1 + k * 3, y + 8 + k * 2, OCHRE[3])
            c.rect(xx + 7, y + 5, 1, h // 2 - 4, OCHRE[3])
    elif goods == 'books':
        for sy in (y + h // 3, y + h * 2 // 3):
            c.rect(x, sy, w, 1, ROOM[3])
            for xx in range(x + 1, x + w - 1):
                k = h2(xx, sy, seed + 3)
                if k < 0.8:
                    c.rect(xx, sy - 4 - (k < 0.25), 1, 4 + (k < 0.25), GOODS[int(k * 53) % len(GOODS)])


def bars(c, x, y, w, n, r):
    """Mullions dividing a run of glass into n lights."""
    for k in range(1, n):
        mx = x + round(w * k / n)
        c.rect(mx - 1, y[0], 2, y[1] - y[0], r[2])
        c.rect(mx - 1, y[0], 1, y[1] - y[0], r[1])


def unit(c, x, by, w, h, d, r, top=None, louvres=False, fan=False):
    """A box on a roof: its front square on, its top seen from above."""
    t = top or r
    c.rect(x, by - h, w, h, r[3])
    c.rect(x, by - h, 1, h, r[2])
    c.rect(x + w - 1, by - h, 1, h, r[4])
    c.rect(x, by - 1, w, 1, r[5])
    if louvres:
        for yy in range(by - h + 2, by - 2, 2):
            c.rect(x + 2, yy, w - 4, 1, r[5])
    c.rect(x, by - h - d, w, d, t[1])
    c.rect(x, by - h - d, w, 1, t[0])
    c.rect(x, by - h - 1, w, 1, t[2])
    if fan:
        cx, cy = x + w // 2, by - h - d // 2 - 1
        for a in range(16):
            c.p(cx + round(4 * math.cos(a * math.pi / 8)), cy + round(2 * math.sin(a * math.pi / 8)), r[5])
        c.rect(cx - 1, cy, 3, 1, r[4])
    for yy in range(by - h - d + 2, by + 1):
        op.cast(c, x + w, yy, 2, 1, 0.7)
    op.cast(c, x + 1, by, w + 1, 1, 0.7)


def vent(c, x, by, h=7, r=ALU):
    op.cast(c, x + 2, by - h + 1, 2, h, 0.72)
    op.cast(c, x, by, 4, 1, 0.72)
    c.rect(x, by - h, 2, h, r[3])
    c.rect(x, by - h, 1, h, r[1])
    c.rect(x - 1, by - h - 2, 4, 2, r[2])
    c.rect(x - 1, by - h - 2, 4, 1, r[0])


def cylinder(c, x, by, w, h, r, lid=None):
    """An upright tank: banded across its width, its top an ellipse."""
    bands = [1, 2, 2, 3, 3, 3, 3, 4, 4, 5]
    for i in range(w):
        col = r[bands[min(len(bands) - 1, i * len(bands) // w)]]
        c.rect(x + i, by - h, 1, h, col)
    e = max(2, w // 4)
    for i in range(w):
        t = (i + 0.5) / w * 2 - 1
        dy = round(e * math.sqrt(max(0.0, 1 - t * t)))
        c.rect(x + i, by - h - dy, 1, 2 * dy + 1, r[1])
        c.p(x + i, by - h + dy, r[2])
        c.p(x + i, by - 1 + min(1, dy // 2), r[5])
    if lid:
        c.rect(x + w // 2 - 2, by - h - 1, 4, 2, lid)


def sash(b, cx, sill, w=16, h=30, frame=WHITE, trim=LIMESTONE, blind=None, lit=None, arch=None):
    c = b.c
    x, y = cx - w // 2, sill - h
    if arch is not None:
        for i in range(-2, w + 2):
            t = (i - w / 2 + 0.5) / (w / 2 + 2)
            lift = round(3 * math.sqrt(max(0.0, 1 - t * t)))
            c.rect(x + i, y - 4 - lift, 1, 4 + lift, arch[5] if i % 3 == 2 else arch[4 if lift > 1 else 3])
            c.p(x + i, y - 4 - lift, arch[2])
    else:
        op.raised(c, x - 3, y - 3, w + 6, h + 3, trim, 2)
        ib.guardapolvo(c, x, y - 3, w, trim)
    c.rect(x, y, w, h, frame[3])
    c.rect(x, y, w, 1, frame[2])
    mid = y + h // 2
    for gy, gh in ((y + 2, mid - y - 3), (mid + 1, y + h - mid - 3)):
        op.glass(c, x + 2, gy, w - 4, gh)
    c.rect(x + 1, mid - 1, w - 2, 2, frame[1])
    if blind:
        bh = round(h * (0.25 + 0.5 * h2(cx, sill, b.seed)))
        c.rect(x + 2, y + 2, w - 4, bh, blind[1])
        c.rect(x + 2, y + 1 + bh, w - 4, 1, blind[3])
        c.p(cx, y + 2 + bh, blind[4])
    op.reveal(c, x + 1, y + 1, w - 2, h - 2, 2)
    ib.repison(c, x, sill, w, trim)
    b.panes.append((x + 2, y + 2, w - 4, h - 4, lit or 'warm', h2(cx, sill, b.seed + 9) < 0.55))


def glass_door(b, cx, base, w=20, h=44, frame=ALU, kind='shop'):
    c = b.c
    x, y = cx - w // 2, base - h
    c.rect(x, y, w, h, frame[3])
    c.rect(x, y, w, 1, frame[1])
    c.rect(x, y, 1, h, frame[1])
    interior(c, x + 3, y + 3, w - 6, h - 9, 'empty', b.seed)
    reflect(c, x + 3, y + 3, w - 6, h - 9, GLASS, b.seed + 3)
    c.rect(x + 3, y + h * 11 // 20, w - 6, 2, frame[1])
    c.rect(x + 3, y + h * 11 // 20 + 2, w - 6, 1, frame[4])
    c.rect(x, base - 6, w, 6, frame[3])
    c.rect(x, base - 6, w, 1, frame[2])
    if w >= 24:
        c.rect(cx, y, 1, h, frame[4])
    op.reveal(c, x + 3, y + 3, w - 6, h - 9, 2)
    b.panes.append((x + 3, y + 3, w - 6, h - 9, kind, True))


def shopfront(b, x, y, w, h, frame=ALU, kick=None, goods='shelves', letters=None, ink=GOLD, transom=8,
              tglass=None, kind='shop', pitch=26):
    """Plate glass on a kickplate, a transom over it, the shop showing through."""
    c = b.c
    kick = kick or frame
    kh = 8
    c.rect(x, y, w, h, frame[3])
    gx, gy, gw = x + 2, y + 2, w - 4
    main = gy + (transom + 2 if transom else 0)
    gh = y + h - kh - main
    if transom:
        tg = tglass or GLASS
        c.rect(gx, gy, gw, transom, tg[3])
        for xx in range(gx, gx + gw):
            for yy in range(gy, gy + transom):
                if tglass is not None and ((xx - gx) % 3 == 2 or (yy - gy) % 3 == 2):
                    c.p(xx, yy, tg[4])
                elif (xx + yy) % 23 < 3:
                    c.p(xx, yy, tg[2])
        c.rect(gx, gy + transom, gw, 2, frame[2])
        c.rect(gx, gy + transom, gw, 1, frame[1])
    interior(c, gx, main, gw, gh, goods, b.seed + x)
    reflect(c, gx, main, gw, gh, GLASS, b.seed + x)
    bars(c, gx, (main, main + gh), gw, max(1, round(gw / pitch)), frame)
    op.reveal(c, gx, main, gw, gh, 2)
    c.rect(x, y, w, 1, frame[1])
    c.rect(x, y, 1, h, frame[1])
    c.rect(x + w - 1, y, 1, h, frame[4])
    raised(c, x + 1, y + h - kh, w - 2, kh, kick, 2)
    for px0 in range(x + 4, x + w - 8, 14):
        c.rect(px0, y + h - kh + 2, 10, 1, kick[3])
        c.rect(px0, y + h - 3, 10, 1, kick[1])
    if letters:
        tw = text_w(letters)
        if tw < gw - 6:
            text(c, gx + (gw - tw) // 2, main + gh // 3, letters, ink[1], ink[5])
    b.panes.append((gx, main, gw, gh, kind, True))
    if transom:
        b.panes.append((gx, gy, gw, transom, kind, True))


def roller(c, x, y, w, h, r, up=0.0):
    """A rolling steel shutter in its box, part raised."""
    top = y + round(h * up)
    c.rect(x - 1, y, w + 2, 5, r[2])
    c.rect(x - 1, y, w + 2, 1, r[0])
    c.rect(x - 1, y + 4, w + 2, 1, r[4])
    for yy in range(max(top, y + 5), y + h):
        c.rect(x, yy, w, 1, r[(1, 2, 2, 3)[(yy - y) % 4]])
    if top < y + h - 2 and top > y + 5:
        c.rect(x, top, w, 1, r[4])
        c.rect(x + w // 2 - 2, top - 1, 4, 1, r[4])


def awning(c, x, y, w, a, bb=None, depth=9, valance=5, stripe=6):
    """A canvas awning: its slope seen from above, a scalloped valance, its
    shade on the glass below."""
    bb = bb or a
    for xx in range(x, x + w):
        r = a if ((xx - x) // stripe) % 2 == 0 else bb
        for yy in range(y, y + depth):
            c.p(xx, yy, r[1] if yy - y < depth // 2 else r[2])
        for yy in range(y + depth, y + depth + valance):
            c.p(xx, yy, r[3])
        u = (xx - x) % stripe
        if u in (0, stripe - 1):
            c.p(xx, y + depth + valance, r[4])
        else:
            c.rect(xx, y + depth + valance, 1, 2, r[3])
    c.rect(x, y, w, 1, a[0])
    c.rect(x, y + depth, w, 1, a[4])
    c.rect(x, y, 1, depth + valance, a[4])
    c.rect(x + w - 1, y, 1, depth + valance, a[5])
    op.cast(c, x, y + depth + valance + 2, w, 7, 0.58)


def box_sign(b, x, y, w, h, word=None, face=None, ink=None, frame=ALU, scale=None, trade=None):
    """A lit box sign over a shop: the game draws it."""
    b.sign(x, y, w, h, 'box', trade)


# ------------------------------------------------------------------ the building

def surface(c, x, y, w, h, r, seed=0):
    """A roof deck from above, in the sun: felt in laid strips, gravel, square
    pavers or ribbed iron, chosen by its material. Light values; the
    parapets' shadows give it depth."""
    if w <= 0 or h <= 0:
        return
    if r is TAR:
        r = FELT
    c.rect(x, y, w, h, r[2])
    if r is GRAVEL:
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                k = h2(xx, yy, seed)
                if k < 0.1:
                    c.p(xx, yy, r[1])
                elif k > 0.92:
                    c.p(xx, yy, r[3])
        return
    if r is ISOGAM:
        # foil-faced rolls laid across, each lapped over the one below
        for yy in range(y, y + h):
            k = (y + h - 1 - yy) % 9
            c.rect(x, yy, w, 1, r[3] if k == 0 else r[1] if k == 1 else r[2])
        for yy in range(y + 2, y + h - 1, 3):
            for xx in range(x + 2, x + w - 2, 7):
                if h2(xx, yy, seed) < 0.18:
                    c.rect(xx, yy, 3, 1, r[1] if h2(xx, yy, seed + 1) < 0.5 else r[3])
        return
    if r in IRONROOF.values():
        for xx in range(x + 1, x + w - 1, 5):
            c.rect(xx, y, 1, h, r[1])
            c.rect(xx + 1, y, 1, h, r[3])
        return
    if r in (CONCRETE, TRAVY, PANEL, WHITE, TERRA) or r is LIMESTONE:
        for py in range(y + h, y - 15, -16):
            for px in range(x, x + w, 16):
                ty, tx = max(y, py - 16), px
                th, tw = py - ty, min(16, x + w - px)
                if th <= 0:
                    continue
                k = h2(px, py, seed)
                c.rect(tx, ty, tw, th, r[1] if k < 0.2 else r[3] if k > 0.88 else r[2])
                c.rect(tx, ty, tw, 1, r[1] if k >= 0.2 else r[0])
                c.rect(tx, ty + th - 1, tw, 1, r[3])
                c.rect(tx + tw - 1, ty, 1, th, r[3])
        return
    for cy in range(y + h - 10, y - 10, -10):
        if cy >= y:
            c.rect(x, cy, w, 1, r[1])
        if y <= cy + 1 < y + h:
            c.rect(x, cy + 1, w, 1, r[3])
    k = h2(seed, 7, 41)
    if w > 60 and h > 20:
        px, py = x + 8 + int(k * (w - 30)), y + 6 + int(h2(seed, 8, 43) * (h - 16))
        c.rect(px, py, 16, 7, r[1])
        c.rect(px, py + 6, 16, 1, r[3])
        c.rect(px + 15, py, 1, 7, r[3])


def chimney(c, x, by, r, h=12):
    """A plastered stack with its cap and pots, its top seen from above."""
    c.rect(x, by - h, 9, h, r[2])
    c.rect(x, by - h, 1, h, r[1])
    c.rect(x + 8, by - h, 1, h, r[4])
    c.rect(x - 1, by - h - 4, 11, 4, r[1])
    c.rect(x - 1, by - h - 1, 11, 1, r[3])
    for px in (x + 1, x + 5):
        c.rect(px, by - h - 7, 3, 3, BRICK[3])
        c.rect(px, by - h - 7, 3, 1, BRICK[1])
        c.p(px + 1, by - h - 7, INK[3])
    op.cast(c, x + 9, by - h + 1, 2, h, 0.7)
    op.cast(c, x + 1, by, 10, 1, 0.7)


def puddle(c, x, y, r, seed):
    """Standing water by a drain: a darker stain with the sky in it."""
    for i, w in enumerate((5, 9, 11, 9, 5)):
        c.rect(x + 6 - w // 2 + (seed % 3), y - 4 + i, w, 1, (FELT if r is TAR else r)[3])
    c.rect(x + 4 + (seed % 3), y - 2, 5, 1, SKY[3])
    c.rect(x + 5 + (seed % 3), y - 2, 2, 1, SKY[1])


def bulkhead(c, x, by, w, h, d, r):
    """The stair's housing on a roof: a box with a door, its slab from above."""
    unit(c, x, by, w, h, d, r)
    c.rect(x + 3, by - h + 3, 9, h - 3, r[5])
    c.rect(x + 4, by - h + 4, 7, h - 4, CHOCOLATE[3])
    c.rect(x + 4, by - h + 4, 7, 1, CHOCOLATE[2])
    c.p(x + 9, by - h // 2, ALU[1])
    c.rect(x + 2, by - h - 1, 11, 1, r[5])
    unit(c, x + w - 6, by - h - d + 3, 3, 4, 2, ALU)


def skylight(c, x, by, w, d):
    """A hipped glass light on a curb, seen from above."""
    c.rect(x, by - 3, w, 3, CONCRETE[3])
    c.rect(x, by - 3, w, 1, CONCRETE[2])
    c.rect(x, by - 3 - d, w, d, CONCRETE[2])
    c.rect(x + 2, by - 1 - d, w - 4, d - 2, GLASS[4])
    c.rect(x + 2, by - 1 - d, w - 4, (d - 2) // 2, GLASS[3])
    for i in range(d - 3):
        c.p(x + 4 + i, by - 2 - d + 1 + i, GLASS[1])
    for xx in range(x + 2 + (w - 4) // 3, x + w - 2, (w - 4) // 3):
        c.rect(xx, by - 1 - d, 1, d - 2, ALU[2])
    op.cast(c, x + w, by - d - 2, 2, d + 2, 0.7)


def turbine(b, x, by):
    """A whirlybird vent: its stem drawn here, its turning head an overlay."""
    c = b.c
    c.rect(x + 2, by - 6, 3, 6, ALU[3])
    c.rect(x + 2, by - 6, 1, 6, ALU[1])
    c.rect(x + 1, by - 1, 5, 1, ALU[4])
    b.overlays.append(['turbine', x, by - 13])


class Block:
    """One building from a spec, geometry settled before any paint: x0, W,
    base, floors, door_x and door_size are known from __init__."""
    FLOORS = dict(row=2, tall=3, shop=1, cottage=1, hut=1, stall=1, hall=2)
    H0, H1, PARA, HEAD = 60, 50, 12, 30

    def __init__(self, s, form='row', cells=12, seed=0):
        self.s, self.form, self.seed = s, form or 'row', seed
        self.W = cells * 16
        n = s.get('floors') or self.FLOORS.get(self.form, 2)
        self.floors = n
        self.hs = [s.get('h0', self.H0)] + [s.get('h1', self.H1)] * (n - 1)
        self.para = s.get('para', self.PARA)
        self.left, self.right = self.margins()
        self.x0 = 16 + self.left
        self.x1 = self.x0 + self.W
        self.head = self.headroom()
        self.base = self.head + self.para + sum(self.hs)
        self.top = self.base - sum(self.hs) - self.para
        self.c = C(self.x1 + 16 + self.right, self.base + 10)
        self.panes, self.signs, self.neon, self.bulbs, self.lamps = [], [], {}, {}, []
        self.overlays, self.smoke, self.shop_signs = [], [], []
        self.door_x, self.door_size = self.x0 + self.W // 2, (22, 44)
        self.plan()

    all_shop = False
    stacks = ()
    # A flat roof shows half the footprint's depth: room to walk on.
    DEPTH = dict(row=48, tall=48, wide=56, hall=56, shop=40, cottage=30, hut=28, stall=24)

    @property
    def roof_depth(self):
        return self.s.get('roof_depth', self.DEPTH.get(self.form, 44))

    @property
    def roof_span(self):
        return 0, self.c.w

    @property
    def door_h(self):
        return self.door_size[1]

    def margins(self):
        return 0, 0

    def headroom(self):
        return self.HEAD + self.roof_depth - 14

    def plan(self):
        pass

    def floor(self, i):
        """(top, bottom) of storey i, the ground floor 0."""
        bottom = self.base - sum(self.hs[:i])
        return bottom - self.hs[i], bottom

    # ------------------------------------------------ light

    def tube(self, pts, colour, group, mode='steady'):
        """Neon: pale glass by day with its shadow on the backing; light at night."""
        c = self.c
        g = self.neon.setdefault(group, dict(mode=mode, colour=colour, px=set()))
        for x, y in pts:
            if (x + 1, y + 1) not in g['px']:
                q = c.g(x + 1, y + 1)
                if q[3]:
                    c.p(x + 1, y + 1, (int(q[0] * 0.6), int(q[1] * 0.58), int(q[2] * 0.66), 255))
        for x, y in pts:
            c.p(x, y, DAYTUBE[colour])
            g['px'].add((x, y))

    def bulb_row(self, pts, group, mode='chase'):
        c = self.c
        g = self.bulbs.setdefault(group, dict(mode=mode, px=[]))
        for x, y in pts:
            c.p(x, y, CREAM[0])
            c.p(x, y + 1, GOLD[4])
            g['px'].append((x, y))

    def sign(self, x, y, w, h, kind='board', trade=None):
        """Leave room for a shop sign the game draws: board, words and all."""
        self.shop_signs.append([x, y, w, h, kind] + ([trade] if trade else []))
        op.cast(self.c, x, y + h, w, 2, 0.74)

    def lamp(self, x, y, colour='warm'):
        self.lamps.append((x, y, colour))

    def frame(self, k=0):
        """The lamplit layer at animation frame k."""
        from PIL import Image
        im = Image.new('RGBA', (self.c.w, self.c.h))
        g, p = im.load(), self.c.px
        for x, y, w, h, kind, on in self.panes:
            if not on:
                continue
            lo, hi = LAMP['tv' if kind == 'tv' else kind]
            if kind == 'tv' and k % 5 == 3:
                lo, hi = LAMP['cool']
            for yy in range(y, y + h):
                for xx in range(x, x + w):
                    if not (0 <= xx < im.width and 0 <= yy < im.height):
                        continue
                    q = p[xx, yy]
                    if not q[3] or sum(q[:3]) > 3 * 172:
                        continue
                    t = hi if yy - y > h * 0.55 else lo
                    a = 0.62 if kind != 'dim' else 0.45
                    g[xx, yy] = tuple(int(q[i] * (1 - a) + t[i] * a) for i in range(3)) + (255,)
        for x, y, w, h, *mode in self.signs:
            if mode and not lit(mode[0], k):
                continue
            for yy in range(y, y + h):
                for xx in range(x, x + w):
                    q = p[xx, yy]
                    if q[3]:
                        g[xx, yy] = tuple(min(255, int(q[i] * 1.35 + 34)) for i in range(3)) + (255,)

        def halo(x, y, col, a):
            if 0 <= x < im.width and 0 <= y < im.height and g[x, y][3] < a:
                g[x, y] = col + (a,)

        for name, gr in self.neon.items():
            if not lit(gr['mode'], k):
                continue
            core, col = NEON[gr['colour']]
            for x, y in gr['px']:
                for dx in range(-2, 3):
                    for dy in range(-2, 3):
                        d = abs(dx) + abs(dy)
                        if d and (dx, dy) != (0, 0):
                            halo(x + dx, y + dy, col, 230 if d == 1 else 110 if d == 2 else 50)
            for x, y in gr['px']:
                g[x, y] = core + (255,)
        for name, gr in self.bulbs.items():
            for i, (x, y) in enumerate(gr['px']):
                on = gr['mode'] == 'steady' or (gr['mode'] == 'chase' and (i + k) % 3 != 0) or \
                    (gr['mode'] == 'blink' and lit('blink', k))
                if on:
                    for dx, dy in ((1, 0), (-1, 0), (0, -1), (0, 1)):
                        halo(x + dx, y + dy, (255, 200, 110), 150)
                    g[x, y] = (255, 246, 214, 255)
                else:
                    g[x, y] = (150, 104, 60, 255)
        for x, y, colour in self.lamps:
            core, col = LAMP[colour]
            for dx in range(-3, 4):
                for dy in range(-3, 4):
                    d = abs(dx) + abs(dy)
                    if 0 < d <= 3:
                        halo(x + dx, y + dy, col, (170, 90, 40)[d - 1])
            g[x, y] = col + (255,)
        im.info['trim'] = True
        return im

    def frames(self):
        return [self.frame(k) for k in range(FRAMES)]

    # ------------------------------------------------ roofs

    def deck(self, depth=None, membrane=TAR, coping=CONCRETE, inset=0, y=None, furnish=True, clear=()):
        """A flat roof seen from above inside its parapets; returns the back row.
        Its depth is the roof's, so the deck can be walked on."""
        c = self.c
        d = self.roof_depth if depth is None else depth
        x0, x1 = self.x0 + inset, self.x1 - inset
        y1 = self.top if y is None else y
        y0 = y1 - d
        P = 4 if d >= 30 else 3
        fx0, fx1, fy0, fy1 = x0 + P, x1 - P, y0 + P + 4, y1 - 2
        surface(c, fx0, fy0, fx1 - fx0, fy1 - fy0, membrane, self.seed)
        # the back parapet's top and its face towards us, the sides' tops
        c.rect(x0, y0, x1 - x0, P, coping[1])
        c.rect(x0, y0, x1 - x0, 1, coping[0])
        c.rect(x0 + P, y0 + P, x1 - x0 - 2 * P, 4, coping[3])
        c.rect(x0 + P, y0 + P, x1 - x0 - 2 * P, 1, coping[2])
        c.rect(x0 + P, y0 + P + 3, x1 - x0 - 2 * P, 1, coping[4])
        c.rect(x0, y0, P, d, coping[1])
        c.rect(x0, y0, 1, d, coping[0])
        c.rect(x1 - P, y0, P, d, coping[2])
        c.rect(x1 - 1, y0, 1, d, coping[3])
        c.rect(x0, y1 - 2, x1 - x0, 2, coping[1])
        c.rect(x0, y1 - 2, x1 - x0, 1, coping[0])
        op.cast(c, fx0, fy0, fx1 - fx0, 3, 0.66)
        cast_right(c, fx0, fy0 + 3, fy1 - fy0 - 3, 2, 0.7)
        if furnish:
            self.furnish(fx0, fy0, fx1, fy1, membrane, clear)
        return y0

    def furnish(self, x0, y0, x1, y1, membrane, clear=()):
        """What stands on a flat roof: a stair bulkhead, a fan unit, stacks,
        a skylight, drains; placed from the seed, never on each other."""
        c, sd, W = self.c, self.seed, x1 - x0
        D = y1 - y0
        if membrane in IRONROOF.values():
            for k, cx in enumerate(range(x0 + 14 + sd % 11, x1 - 12, 52)):
                by = y0 + D // 2 + (k % 2) * 6
                chimney(c, cx, by, WHITE if k % 2 else CREAM)
                self.smoke.append([cx + 4, by - 16, 'chimney'])
            return
        dx = x0 + 3 + round(h2(sd, 2, 11) * 8)
        dy = y1 - 4
        if membrane not in (GRAVEL,):
            puddle(c, dx + 2, dy - 1, membrane, sd)
        c.rect(dx, dy, 3, 2, membrane[5])
        c.rect(dx, dy, 3, 1, membrane[4])
        if D < 16 or W < 40:
            vent(c, x1 - 8, y0 + D // 2 + 4, 6)
            return
        back = y0 + min(D - 6, 16)
        free = [(x0 + 4, x1 - 4)]
        for a, b in clear:
            free = [p for f in free for p in ((f[0], min(f[1], a)), (max(f[0], b), f[1])) if p[1] - p[0] > 0]

        def take(w):
            for i, (a, b) in enumerate(free):
                if b - a >= w:
                    left = h2(sd, a, 31) < 0.5
                    s0 = a if left else b - w
                    free[i:i + 1] = [(a, s0 - 4), (s0 + w + 4, b)]
                    return s0
            return None

        if self.form in ('row', 'tall', 'wide', 'hall') and W >= 100:
            bx = take(24)
            if bx is not None:
                bulkhead(c, bx, back + 6, 24, 15, 8, CONCRETE)
        fan = take(20)
        if fan is not None:
            fy = back + 4 + round(h2(sd, 5, 3) * max(0, D - 26))
            unit(c, fan, fy, 20, 8, 9, DOVE, louvres=True, fan=True)
            self.overlays.append(['acfan', fan + 10 - 5, fy - 8 - 9 // 2 - 1 - 3])
        if W >= 150:
            sx = take(18)
            if sx is not None:
                skylight(c, sx, back + 2, 18, 9)
        for k in range(1):
            vx = take(6)
            if vx is not None:
                vent(c, vx + 2, back + 2 + round(h2(sd, k, 9) * max(0, D - 18)), 6 + k)
        if W >= 110 and self.form not in ('row', 'tall', 'wide', 'hall'):
            tx = take(8)
            if tx is not None:
                turbine(self, tx + 1, back + 8)

    def coping(self, coping=CONCRETE, y=None, over=1):
        c = self.c
        y = self.top if y is None else y
        c.rect(self.x0 - over, y - 2, self.W + 2 * over, 2, coping[1])
        c.rect(self.x0 - over, y - 2, self.W + 2 * over, 1, coping[0])
        c.rect(self.x0 - over, y, self.W + 2 * over, 1, coping[4])
        op.cast(c, self.x0, y + 1, self.W, 2, 0.72)

    def foot(self, r=CONCRETE):
        c = self.c
        c.rect(self.x0 - 1, self.base, self.W + 2, 1, r[2])
        c.rect(self.x0 - 1, self.base + 1, self.W + 2, 2, r[4])

    # ------------------------------------------------ build

    def paint(self):
        raise NotImplementedError

    def weather(self):
        """Wear on the walls: grime drawn down from the ends of each upper
        sill, damp rising at the foot. Each pixel steps one down its own ramp."""
        c, wear, sd = self.c, self.s.get('wear', 0.5), self.seed
        ramps = [v for v in self.s.values() if isinstance(v, list) and len(v) == 8 and isinstance(v[0], tuple)]
        ramps += [BRICK, CONCRETE, LIMESTONE, CREAM, WHITE, STEEL, PANEL, TRAVY, BUFF, CHOCOLATE, YBRICK, SAGE]
        index = {q: (r, i) for r in ramps for i, q in enumerate(r) if type(q) is tuple and type(q[0]) is int}

        def step(x, y):
            q = c.g(x, y)
            if q[3] and q in index and (x, y) not in c.glass:
                r, i = index[q]
                c.p(x, y, r[min(7, i + 1)])

        for x, y, w, h, *_ in self.panes:
            sill = y + h + 5
            if sill > self.base - 50:
                continue
            for sx in (x - 1, x + w):
                n = int(6 + 12 * wear * h2(sx, sill, sd))
                for k in range(n):
                    if h2(sx, sill + k, sd + 1) < 0.9 - k / n * 0.6:
                        step(sx, sill + k)
        for xx in range(self.x0, self.x1):
            rise = int(3 + 4 * wear + 2 * math.sin(xx * 0.19 + sd) + 1.5 * math.sin(xx * 0.05))
            for k in range(max(0, rise)):
                if k < rise - 1 or h2(xx, k, sd) < 0.5:
                    step(xx, self.base - 1 - k)

    def build(self):
        self.paint()
        c = self.c
        self.weather()
        outline(c)
        consolidate(c)
        for y in range(c.h):
            for x in range(c.w):
                q = c.px[x, y]
                if q[3] and max(q[:3]) < 14:
                    c.px[x, y] = (22, 15, 24, 255)
        self.im = c.im
        self.night = self.frame(0)
        return c.im


def lit(mode, k):
    if mode == 'steady':
        return True
    if mode == 'flicker':
        return k not in (9, 11, 12)
    if mode == 'blink':
        return k % 8 < 5
    if mode == 'first':
        return k < FRAMES // 2
    if mode == 'second':
        return k >= FRAMES // 2
    if mode.startswith('seq'):
        _, i, n = mode.split(':')
        return k % (int(n) + 2) >= int(i)
    return True


# ------------------------------------------------------------------ the false-front store

class FalseFront(Block):
    """The cattle-town store: a tall board front hiding a gable roof, a
    bracketed cornice, a painted sign, and a porch over the boardwalk."""
    FLOORS = dict(row=1, tall=2, shop=1, cottage=1, hut=1, stall=1, hall=2)
    H0, H1, HEAD = 62, 48, 26

    def __init__(self, s, form='row', cells=12, seed=0):
        s = dict(s, para=s.get('para', 44 if (s.get('floors') or self.FLOORS.get(form or 'row')) == 1 else 30))
        super().__init__(s, form, cells, seed)

    def plan(self):
        self.door_x = self.x0 + self.W // 2 if self.W >= 96 else self.x0 + self.W - 18
        self.door_size = (24, 46)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, trim = s['wall'], s['trim']
        step = 0 if s.get('crown') == 'square' or W < 96 else 8
        fy = top + step
        # the gable roof running back, seen over the front
        ins, rd = 4, round(self.roof_depth * 0.6)
        ridge = (x0 + x1) // 2
        for xx in range(x0 + ins, x1 - ins):
            left = xx < ridge
            for yy in range(fy - rd, fy):
                k = (xx - x0) % 4
                col = (TIN[1] if k == 0 else TIN[2]) if left else (TIN[3] if k == 0 else TIN[4])
                c.p(xx, yy, col)
        c.rect(ridge - 1, fy - rd, 3, rd, TIN[1])
        c.rect(ridge + 1, fy - rd, 1, rd, TIN[3])
        c.rect(x0 + ins, fy - rd, x1 - x0 - 2 * ins, 1, TIN[1])
        if W >= 96:
            px0 = ridge + (x1 - ridge) // 2
            c.rect(px0, fy - rd - 6, 3, 14, INK[3])
            c.rect(px0, fy - rd - 6, 1, 14, INK[2])
            c.rect(px0 - 1, fy - rd - 8, 5, 2, INK[2])
        # the front
        def face(x, y, w, h):
            if s['kind'] == 'brick':
                fm.brick(c, x, y, w, h, wall)
            else:
                fm.clapboard(c, x, y, w, h, wall, board=5)
        face(x0, fy, W, base - fy)
        if step:
            cw = W // 3
            face(ridge - cw // 2, top, cw, step + 1)
        # cornice with brackets
        def cornice(x, y, w):
            c.rect(x - 3, y, w + 6, 3, trim[1])
            c.rect(x - 3, y, w + 6, 1, trim[0])
            c.rect(x - 3, y + 3, w + 6, 3, trim[3])
            c.rect(x - 3, y + 6, w + 6, 1, trim[5])
            op.cast(c, x, y + 7, w, 4, 0.66)
            for bx in range(x + 2, x + w - 3, 12):
                c.rect(bx, y + 7, 3, 6, trim[2])
                c.rect(bx, y + 7, 1, 6, trim[1])
                c.rect(bx + 2, y + 8, 1, 5, trim[4])
                c.p(bx + 1, y + 12, trim[4])
        if step:
            cw = W // 3
            cornice(ridge - cw // 2, top, cw)
            cornice(x0, fy, ridge - cw // 2 - x0 - 3)
            cornice(ridge + cw - cw // 2 + 3, fy, x1 - (ridge + cw - cw // 2 + 3))
        else:
            cornice(x0, fy, W)
        # the painted sign
        word = s['word'] if text_w(s['word'], 2) <= W - 24 else s.get('short', s['word'][:4])
        sy = fy + 15
        sw = min(W - 12, 76)
        sx = (x0 + x1) // 2 - sw // 2
        self.sign(sx, sy, sw, 15, 'board')
        # an upper storey
        if self.floors > 1:
            t, b = self.floor(1)
            n = max(2, round(W / 40))
            for k in range(n):
                cx = x0 + round(W * (k + 0.5) / n)
                sash(self, cx, b - 10, 14, 28, s['sash'], trim, blind=CREAM if k % 2 else None)
                c.rect(cx - 10, b - 44, 20, 3, trim[1])
                c.rect(cx - 9, b - 46, 18, 2, trim[2])
        # the shop
        dx, (dw, dh) = self.door_x, self.door_size
        wy = base - 50
        for lx, rx in ((x0 + 6, dx - dw // 2 - 4), (dx + dw // 2 + 4, x1 - 6)):
            if rx - lx >= 18:
                shopfront(self, lx, wy, rx - lx, 50, trim, trim, s['goods'], transom=7, pitch=22)
        raised(c, dx - dw // 2 - 3, base - dh - 10, dw + 6, dh + 10, trim, 2)
        op.glass(c, dx - dw // 2, base - dh - 8, dw, 6)
        c.rect(dx - dw // 2, base - dh - 2, dw, 1, trim[4])
        for lx in (dx - dw // 2, dx):
            c.rect(lx, base - dh, dw // 2, dh, s['door'][3])
            c.rect(lx, base - dh, 1, dh, s['door'][2])
            op.glass(c, lx + 2, base - dh + 2, dw // 2 - 4, 20)
            raised(c, lx + 2, base - dh + 25, dw // 2 - 4, 16, s['door'], 3)
        op.reveal(c, dx - dw // 2, base - dh, dw, dh, 3)
        self.panes.append((dx - dw // 2, base - dh - 8, dw, 6, 'warm', True))
        if s.get('neon'):
            word, col = s['neon']
            nx = x0 + 12
            if skeleton_w(word) < dx - dw // 2 - 20 - x0:
                self.tube(skeleton(word, nx, wy + 22), col, 'window', 'flicker')
        # the porch
        if s.get('porch', True) and W >= 64:
            py = base - 58
            for xx in range(x0 - 2, x1 + 2):
                for yy in range(py - 8, py):
                    c.p(xx, yy, TIN[1] if (xx - x0) % 4 == 0 else TIN[2] if yy < py - 4 else TIN[3])
            c.rect(x0 - 2, py - 8, W + 4, 1, TIN[0])
            c.rect(x0 - 2, py, W + 4, 2, trim[3])
            c.rect(x0 - 2, py + 2, W + 4, 1, trim[5])
            op.cast(c, x0, py + 3, W, 12, 0.56)
            posts = [x0, x1 - 3] + [x for x in range(x0 + 48, x1 - 40, 48) if abs(x - dx) > dw // 2 + 6]
            for px0 in posts:
                c.rect(px0, py + 3, 3, base - py - 3, trim[2])
                c.rect(px0, py + 3, 1, base - py - 3, trim[1])
                c.rect(px0 + 2, py + 3, 1, base - py - 3, trim[4])
                for i in range(4):
                    if px0 + 3 + i < x1:
                        c.p(px0 + 3 + i, py + 3 + i, trim[3])
                    if px0 - 1 - i >= x0:
                        c.p(px0 - 1 - i, py + 3 + i, trim[3])
            self.lamp(dx, py + 5)
        for yy in range(base, base + 5):
            c.rect(x0 - 2, yy, W + 4, 1, PINE[2] if (yy - base) % 2 == 0 else PINE[4])
        c.rect(x0 - 2, base, W + 4, 1, PINE[1])


# ------------------------------------------------------------------ the brick commercial block

class BrickBlock(Block):
    """Main Street's two-part block, 1900-1925: a shop in plate glass and cast
    iron below, offices or rooms in brick above, a corbelled cornice and a
    stone panel with the year it went up."""
    FLOORS = dict(row=2, tall=3, shop=1, cottage=1, hut=1, stall=1, hall=3)
    H0, H1, PARA, HEAD = 62, 50, 22, 24

    def plan(self):
        n = 2 if self.W >= 176 else 1
        self.shops = [(self.x0 + round(self.W * k / n), self.x0 + round(self.W * (k + 1) / n)) for k in range(n)]
        a, b_ = self.shops[0]
        self.door_x = a + (b_ - a) // 2 if b_ - a >= 80 else b_ - 18
        self.door_size = (22, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, iron = s['wall'], s['iron']
        fm.brick(c, x0, top, W, base - top, wall)
        # cornice: a corbel table, a frieze, a coping
        cy = top + 4
        c.rect(x0 - 2, top - 1, W + 4, 3, LIMESTONE[1])
        c.rect(x0 - 2, top - 1, W + 4, 1, LIMESTONE[0])
        c.rect(x0 - 2, top + 2, W + 4, 1, LIMESTONE[4])
        c.rect(x0, cy, W, 3, wall[2])
        c.rect(x0, cy + 2, W, 1, wall[5])
        for bx in range(x0 + 1, x1 - 2, 5):
            c.rect(bx, cy + 3, 3, 3, wall[2])
            c.rect(bx, cy + 3, 3, 1, wall[1])
            c.rect(bx + 2, cy + 4, 1, 2, wall[5])
        op.cast(c, x0, cy + 6, W, 2, 0.7)
        if self.floors > 1 and W >= 96:
            year = str(1898 + int(h2(self.seed, 3, 7) * 28))
            pw = text_w(year) + 10
            px0 = (x0 + x1) // 2 - pw // 2
            raised(c, px0 - 4, top - 9, pw + 8, 10, LIMESTONE, 2)
            if s.get('ghost'):
                text(c, px0 + 5, top - 7, year, LIMESTONE[5])
            else:
                raised(c, px0, cy + 6, pw, 11, LIMESTONE, 2)
                text(c, px0 + 5, cy + 9, year, LIMESTONE[5])
        if s.get('ghost') and self.floors > 1:
            word = s['ghost']
            if text_w(word, 2) < W - 20:
                gy = cy + 8
                for (gx, gy2) in [(x0 + (W - text_w(word, 2)) // 2, gy)]:
                    tmp = C(text_w(word, 2) + 2, 12)
                    text(tmp, 0, 0, word, (1, 1, 1, 255), None, 2)
                    for yy in range(tmp.h):
                        for xx in range(tmp.w):
                            if tmp.px[xx, yy][3] and h2(xx, yy, 77) > 0.18:
                                q = c.g(gx + xx, gy2 + yy)
                                c.p(gx + xx, gy2 + yy, fm.mix(q, CREAM[1], 0.42))
        # upper floors
        for i in range(1, self.floors):
            t, b = self.floor(i)
            n = max(2, round(W / 32))
            for k in range(n):
                cx = x0 + round(W * (k + 0.5) / n)
                ac = s.get('ac') and (k + i + self.seed) % 5 == 2
                sash(self, cx, b - 10, 16, 30, s['sash'], LIMESTONE, blind=CREAM if (k * 7 + i) % 3 == 0 else None,
                     arch=wall if s.get('arched') else None)
                if ac:
                    unit(c, cx - 7, b - 9, 14, 7, 3, DOVE, louvres=True)
                    c.rect(cx - 6, b - 2, 1, 6, wall[4])
        if s.get('blade') and self.floors > 1 and W >= 96:
            word, col = s['blade']
            bx = x1 - 26
            t, b = self.floor(self.floors - 1)
            bh = len(word) * 11 + 10
            by = self.floor(1)[1] - bh - 4
            c.rect(bx + 6, by - 3, 3, 3, iron[3])
            c.rect(bx + 6, by + bh, 3, 3, iron[3])
            raised(c, bx, by, 15, bh, s['blade_box'], 3)
            c.rect(bx + 2, by + 2, 11, bh - 4, INK[3])
            self.tube(skeleton(word, bx + 9, by + 6, vertical=True), col, 'blade', 'flicker')
            self.bulb_row([(bx + 1, yy) for yy in range(by + 2, by + bh - 2, 3)], 'blade-bulbs')
            cast_right(c, bx + 15, by + 2, bh, 3)
        # the shops
        t0, _ = self.floor(0)
        c.rect(x0, t0, W, 4, iron[3])
        c.rect(x0, t0, W, 1, iron[1])
        c.rect(x0, t0 + 4, W, 1, iron[5])
        for k, (a, b_) in enumerate(self.shops):
            sw = b_ - a
            sy, sh = t0 + 5, 14 if s.get('fascia') == 'box' else 12
            word = s['words'][(k + self.seed) % len(s['words'])]
            if s.get('fascia') == 'box':
                box_sign(self, a + 8, sy, sw - 16, sh, word, s['face'], s['face_ink'])
            else:
                self.sign(a + 7, sy, sw - 14, sh, 'board')
            gy = sy + sh + 3
            dx = a + sw // 2 if sw >= 80 else b_ - 18
            dw = 22
            for lx, rx in ((a + 6, dx - dw // 2 - 3), (dx + dw // 2 + 3, b_ - 6)):
                if rx - lx >= 16:
                    shopfront(self, lx, gy, rx - lx, base - gy, iron, wall, s['goods'][k % len(s['goods'])],
                              tglass=TINT['sky'] if s.get('prism') else None)
            c.rect(dx - dw // 2 - 3, gy, dw + 6, base - gy, ROOM[6])
            glass_door(self, dx, base, dw, base - gy - 8, iron)
            c.rect(dx - dw // 2 - 3, gy, dw + 6, 8, iron[3])
            op.glass(c, dx - dw // 2, gy + 2, dw, 5)
            for px0 in (a, b_ - 6):
                raised(c, px0, t0 + 5, 6, base - t0 - 5, iron, 2)
                c.rect(px0 + 1, t0 + 10, 4, 1, iron[0])
            if s.get('awning'):
                a1, a2 = s['awning']
                awning(c, a + 6, gy + 1, sw - 12, a1, a2)
        self.deck(None, TAR)
        dy = self.top - 3
        unit(c, x0 + W // 3, dy, 18, 7, 6, DOVE, fan=True)
        vent(c, x1 - 20, dy - 2)
        if W >= 128:
            vent(c, x0 + 14, dy - 1, 5)
        self.foot()


# ------------------------------------------------------------------ the diner

class Diner(Block):
    """A factory-built diner, 1935-1955: stainless flutes, a band of windows
    over the booths, porcelain enamel lettering, a monitor roof and a sign on
    legs saying EAT."""
    FLOORS = dict(row=1, tall=1, shop=1, cottage=1, hut=1, stall=1, hall=1)
    H0, PARA, HEAD = 52, 16, 46

    def plan(self):
        self.door_x = self.x0 + self.W // 2 if self.W < 140 else self.x0 + round(self.W * 0.36)
        self.door_size = (20, 42)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        en, ink = s['enamel'], s['ink']
        # roof: barrel with a clerestory monitor, then the sign on its legs
        rd = self.roof_depth - 10
        for yy in range(top - rd, top):
            t = (yy - top + rd) / rd
            c.rect(x0 + 2, yy, W - 4, 1, s['roof'][1 if t < 0.2 else 2 if t < 0.55 else 3 if t < 0.85 else 4])
        for xx in range(x0 + 12, x1 - 6, 12):
            c.rect(xx, top - rd + 1, 1, rd - 2, s['roof'][3])
            c.rect(xx + 1, top - rd + 1, 1, rd - 2, s['roof'][1])
        c.rect(x0 + 2, top - rd, W - 4, 1, s['roof'][0])
        for k in range(3):
            c.p(x0 + 2 + k, top - rd + 2 - k, (0, 0, 0, 0))
        my = top - rd // 2 - 2
        c.rect(x0 + 14, my - 3, W - 28, 3, s['roof'][1])
        c.rect(x0 + 14, my, W - 28, 5, en[4])
        for xx in range(x0 + 18, x1 - 18, 8):
            op.glass(c, xx, my + 1, 5, 3)
            self.panes.append((xx, my + 1, 5, 3, 'warm', True))
        if s.get('sign', True) and W >= 96:
            sw, sh = 34, 18
            sx, sy = x1 - sw - 16, top - rd - sh - 8
            for lx in (sx + 6, sx + sw - 9):
                c.rect(lx, sy + sh, 2, top - rd + 6 - sy - sh, INK[3])
                c.rect(lx, sy + sh, 1, top - rd + 6 - sy - sh, INK[2])
            raised(c, sx, sy, sw, sh, en, 3)
            c.rect(sx + 2, sy + 2, sw - 4, sh - 4, INK[3])
            self.tube(skeleton('EAT', sx + (sw - skeleton_w('EAT')) // 2, sy + 5), s['neon'], 'eat', 'blink')
            self.bulb_row([(x, sy + 1) for x in range(sx + 2, sx + sw - 1, 3)] +
                          [(x, sy + sh - 2) for x in range(sx + sw - 3, sx + 1, -3)], 'eat-bulbs')
        # enamel band with the name
        c.rect(x0, top, W, self.para, en[2])
        c.rect(x0, top, W, 1, en[1])
        for yy in (top + 2, top + self.para - 4):
            c.rect(x0, yy, W, 2, ink[3])
            c.rect(x0, yy, W, 1, ink[2])
        dx = self.door_x
        span = (dx + 22, x1 - 4) if x1 - dx > dx - x0 else (x0 + 4, dx - 22)
        self.sign(span[0], top + 4, span[1] - span[0], self.para - 7, 'paint', 'diner')
        c.rect(x0, top + self.para - 1, W, 1, STEEL[4])
        # windows over the booths
        wy, wh = top + self.para, 20
        c.rect(x0, wy, W, wh, STEEL[3])
        c.rect(x0, wy, W, 1, STEEL[1])
        for xx in range(x0 + 3, x1 - 12, 12):
            gx, gw = xx + 1, 10
            c.rect(gx, wy + 2, gw, wh - 4, CREAM[3])
            c.rect(gx, wy + 2, gw, 3, CREAM[4])
            c.rect(gx + 3, wy + 3, 4, 1, CREAM[0])
            c.rect(gx, wy + wh - 7, gw, 5, s['booth'][2])
            c.rect(gx, wy + wh - 7, gw, 1, s['booth'][1])
            c.rect(gx + 4, wy + wh - 6, 2, 4, s['booth'][4])
            for yy in range(wy + 2, wy + wh - 2):
                for xx2 in range(gx, gx + gw):
                    if (xx2 - gx + yy - wy) % 14 in (3, 4):
                        c.p(xx2, yy, GLASS[2])
            op.reveal(c, gx, wy + 2, gw, wh - 4, 1)
            self.panes.append((gx, wy + 2, gw, wh - 4, 'shop', True))
        flutes(c, x0, wy + wh, W, base - wy - wh - 6)
        c.rect(x0, wy + wh, W, 1, STEEL[0])
        tiles(c, x0, base - 6, W, 6, s['tile'], 3)
        # corners turn: a lit roll on the left, a shaded one on the right
        for yy in range(top, base):
            c.p(x0, yy, STEEL[1] if yy > wy else en[1])
            c.p(x1 - 1, yy, STEEL[4])
        # the vestibule standing forward
        dx, (dw, dh) = self.door_x, self.door_size
        vw = dw + 12
        vx = dx - vw // 2
        vt = base - dh - 4
        c.rect(vx, vt - 5, vw, 5, STEEL[1])
        c.rect(vx, vt - 5, vw, 1, STEEL[0])
        flutes(c, vx, vt, vw, base - vt)
        c.rect(vx, vt, vw, 3, en[3])
        glass_door(self, dx, base, dw, dh, STEEL)
        c.rect(vx, vt, 1, base - vt, STEEL[0])
        c.rect(vx + vw - 1, vt, 1, base - vt, STEEL[5])
        cast_right(c, vx + vw, vt - 4, base - vt + 4, 3)
        self.lamp(dx, vt + 1)
        self.foot()


# ------------------------------------------------------------------ the motel

class Motel(Block):
    """The motor court, 1950-1970: an office in plate glass, a row of rooms
    with coloured doors under a deep fascia, and the pole sign that sold it to
    the highway: a star, an arrow, VACANCY with its NO."""
    FLOORS = dict(row=1, tall=1, shop=1, cottage=1, hut=1, stall=1, hall=1)
    H0, PARA, HEAD = 54, 7, 16

    def margins(self):
        return 0, 40

    def headroom(self):
        return max(self.HEAD + self.roof_depth - 14, 178 - self.H0 - self.PARA)

    def plan(self):
        self.office = min(56, self.W)
        self.door_x = self.x0 + self.office - 16
        self.door_size = (20, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, fas = s['wall'], s['fascia']
        cmu(c, x0, top, W, base - top, wall)
        # roof: gravel from above over a deep fascia
        rd = self.roof_depth - 6
        for yy in range(top - rd, top):
            for xx in range(x0 - 4, x1 + 4):
                k = h2(xx, yy, 21)
                c.p(xx, yy, GRAVEL[1] if k < 0.12 else GRAVEL[3] if k > 0.88 else GRAVEL[2])
        c.rect(x0 - 4, top - rd, W + 8, 1, GRAVEL[0])
        c.rect(x0 - 4, top - 2, W + 8, 2, fas[1])
        c.rect(x0 - 4, top, W + 8, self.para, fas[2])
        c.rect(x0 - 4, top + self.para - 1, W + 8, 1, fas[4])
        op.cast(c, x0, top + self.para, W, 7, 0.56)
        self.furnish(x0 + 2, top - rd + 3, x1 - 2, top - 3, GRAVEL)
        # office
        ow = self.office
        dx = self.door_x
        if ow >= 40:
            shopfront(self, x0 + 4, base - 46, dx - 12 - x0 - 4, 46, ALU, wall, 'counter', transom=0)
            text(c, x0 + 6, top + 1 + (self.para - 5) // 2, 'OFFICE', fas[5])
        glass_door(self, dx, base, 20, 44)
        self.lamp(dx + 13, base - 34)
        c.rect(dx + 12, base - 35, 3, 3, GOLD[1])
        # rooms
        cols = [s['doors'][(k + self.seed) % len(s['doors'])] for k in range(12)]
        n = max(0, (W - ow - 4) // 50)
        for k in range(n):
            rx = x0 + ow + 4 + k * 50
            col = cols[k]
            ddx = rx + 4
            raised(c, ddx - 2, base - 47, 24, 47, wall, 1)
            c.rect(ddx, base - 44, 20, 44, col[2])
            c.rect(ddx, base - 44, 20, 1, col[1])
            c.rect(ddx, base - 44, 1, 44, col[1])
            c.rect(ddx + 19, base - 44, 1, 44, col[4])
            for py in (base - 40, base - 22):
                c.rect(ddx + 4, py, 12, 14, col[3])
                c.rect(ddx + 4, py, 12, 1, col[4])
                c.rect(ddx + 4, py + 13, 12, 1, col[1])
            c.rect(ddx + 16, base - 22, 2, 2, GOLD[1])
            num = str(k + 1 + (self.seed % 3) * 10)
            c.rect(ddx + 5, base - 53, text_w(num) + 4, 7, GOLD[2])
            text(c, ddx + 7, base - 52, num, GOLD[5])
            wx = rx + 28
            ww = 20
            c.rect(wx - 1, base - 42, ww + 2, 24, ALU[2])
            c.rect(wx, base - 41, ww, 22, ROOM[5])
            dr = s['drapes']
            gap = 2 + int(h2(k, 5, self.seed) * 8)
            for xx in range(wx, wx + ww):
                if not (wx + ww // 2 - gap // 2 <= xx < wx + ww // 2 + gap // 2):
                    c.rect(xx, base - 41, 1, 22, dr[2] if (xx - wx) % 3 else dr[3])
            reflect(c, wx, base - 41, ww, 22, GLASS, k)
            self.panes.append((wx, base - 41, ww, 22, 'warm', h2(k, 1, self.seed) < 0.65))
            raised(c, wx - 2, base - 18, ww + 4, 3, CONCRETE, 2)
            unit(c, wx + 4, base - 6, 12, 8, 2, DOVE, louvres=True)
            c.rect(wx + 9, base - 6, 1, 4, wall[4])
            self.lamp(rx + 26, base - 40)
            c.rect(rx + 25, base - 41, 3, 3, CREAM[1])
        # the pole sign
        px0 = x1 + 10
        top_y = base - 172
        for lx in (px0 + 4, px0 + 16):
            c.rect(lx, top_y + 70, 3, base - top_y - 70, STEEL[3])
            c.rect(lx, top_y + 70, 1, base - top_y - 70, STEEL[1])
        cw, ch = 24, 66
        cx0 = px0
        cy0 = top_y + 12
        raised(c, cx0, cy0, cw, ch, s['cab'], 2)
        c.rect(cx0 + 3, cy0 + 3, cw - 6, ch - 6, CREAM[1])
        self.tube(skeleton('MOTEL', cx0 + cw // 2 + 2, cy0 + 7, vertical=True, pitch=11), 'red', 'motel', 'steady')
        self.bulb_row([(cx0 + 1, yy) for yy in range(cy0 + 2, cy0 + ch - 2, 3)], 'motel-bulbs')
        # star on top
        sx, sy = cx0 + cw // 2, cy0 - 8
        pts = []
        for a in range(8):
            ang = a * math.pi / 4
            r_ = 7 if a % 2 == 0 else 4
            pts += line(sx, sy, sx + round(r_ * math.cos(ang)), sy + round(r_ * math.sin(ang)))
        c.rect(sx, sy + 2, 1, 6, STEEL[3])
        self.tube(pts, 'amber', 'star', 'blink')
        # arrow pointing back to the office
        ay = cy0 + ch + 6
        aw = 38
        ax = cx0 + cw - aw
        c.rect(ax + 6, ay, aw - 6, 7, YELLOW[3])
        c.rect(ax + 6, ay, aw - 6, 1, YELLOW[1])
        for i in range(7):
            half = min(i, 5)
            c.rect(ax + i, ay + 3 - half, 1, 2 * half + 1, YELLOW[2])
            c.p(ax + i, ay + 3 - half, YELLOW[1])
        self.bulb_row([(xx, ay + 3) for xx in range(ax + aw - 2, ax + 2, -3)], 'arrow')
        # vacancy
        vy = ay + 12
        raised(c, cx0 - 8, vy, 32, 9, s['cab'], 3)
        c.rect(cx0 - 6, vy + 2, 28, 5, INK[3])
        self.tube([(cx0 - 5 + x, vy + 2 + y) for x, y in text_pts('VACANCY')], 'blue', 'vacancy', 'steady')
        nx = cx0 - 8
        raised(c, nx - 12, vy, 11, 9, s['cab'], 3)
        c.rect(nx - 10, vy + 2, 7, 5, INK[3])
        self.tube([(nx - 10 + x, vy + 2 + y) for x, y in text_pts('NO')], 'red', 'no', 'blink')
        self.foot()


def text_pts(s):
    """The 3x5 font as tube pixels, for small neon."""
    pts, x = [], 0
    for ch in s:
        w, h, bits = glyph(ch)
        pts += [(x + i, j) for j in range(h) for i in range(w) if bits[j * w + i] == '1']
        x += w + 1
    return pts


# ------------------------------------------------------------------ the bank

class Bank(Block):
    """A savings bank of 1958-1970: travertine piers and bronze glass under a
    thin cantilevered slab with its name in bronze letters, the banking hall's
    globes showing through, and a pylon telling the time and the temperature."""
    FLOORS = dict(row=1, tall=2, shop=1, cottage=1, hut=1, stall=1, hall=1)
    H0, H1, PARA, HEAD = 76, 50, 14, 22

    def margins(self):
        return 0, 26 if self.W >= 112 else 0

    def headroom(self):
        return max(self.HEAD + self.roof_depth - 14, 132 - sum(self.hs))

    def plan(self):
        self.door_x = self.x0 + self.W // 2
        self.door_size = (26, 46)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        pier, g = s['pier'], TINT['bronze']
        gy0, gy1 = top + self.para, base - 7
        # the glass wall behind the piers
        c.rect(x0, gy0, W, gy1 - gy0, BRONZE[3])
        c.rect(x0 + 2, gy0 + 2, W - 4, gy1 - gy0 - 2, g[4])
        c.rect(x0 + 2, gy0 + 2, W - 4, (gy1 - gy0) // 3, g[5])
        cy = gy1 - 18
        c.rect(x0 + 2, cy, W - 4, 2, TRAV[1])
        c.rect(x0 + 2, cy + 2, W - 4, 14, s['counter'][3])
        for xx in range(x0 + 6, x1 - 6, 7):
            c.rect(xx, cy + 4, 1, 10, s['counter'][4])
        for xx in range(x0 + 12, x1 - 10, 22):
            ly = gy0 + 10 + (xx // 22) % 2 * 4
            c.rect(xx, gy0 + 2, 1, ly - gy0 - 2, BRONZE[4])
            c.rect(xx - 1, ly, 3, 3, CREAM[1])
            self.lamp(xx, ly + 1)
        for yy in range(gy0 + 2, gy1):
            for xx in range(x0 + 2, x1 - 2):
                d = (xx - x0) - (yy - gy0) * 0.6
                if 18 <= d % 70 <= 30:
                    q = c.g(xx, yy)
                    c.p(xx, yy, g[3] if q in (g[4], g[5]) else q)
        for xx in range(x0 + 16, x1, 16):
            c.rect(xx, gy0, 2, gy1 - gy0, BRONZE[2])
            c.rect(xx, gy0, 1, gy1 - gy0, BRONZE[1])
        c.rect(x0, gy1 - 30, W, 2, BRONZE[2])
        self.panes.append((x0 + 2, gy0 + 2, W - 4, gy1 - gy0 - 2, 'warm', True))
        if self.floors > 1:
            t, b = self.floor(1)
            panels(c, x0, t, W, b - t, pier, 16, 10, 1)
            for xx in range(x0 + 8, x1 - 20, 24):
                c.rect(xx, t + 12, 16, 26, BRONZE[3])
                op.glass(c, xx + 1, t + 13, 14, 24)
                self.panes.append((xx + 1, t + 13, 14, 24, 'cool', h2(xx, t, 3) < 0.5))
        dx, (dw, dh) = self.door_x, self.door_size
        glass_door(self, dx - dw // 4, gy1, dw // 2, dh - 7, BRONZE)
        glass_door(self, dx + dw // 4 + 1, gy1, dw // 2, dh - 7, BRONZE)
        # piers
        step = max(32, W // 6)
        for xx in list(range(x0, x1 - 4, step)) + [x1 - 7]:
            if abs(xx + 3 - dx) < dw // 2 + 4:
                continue
            panels(c, xx, gy0, 7, gy1 - gy0, pier, 7, 14, 1)
            c.rect(xx, gy0, 1, gy1 - gy0, pier[0])
            c.rect(xx + 6, gy0, 1, gy1 - gy0, pier[4])
        op.cast(c, x0, gy0, W, 12, 0.5)
        # plinth and steps
        c.rect(x0 - 2, gy1, W + 4, base - gy1, GRANITE[3])
        c.rect(x0 - 2, gy1, W + 4, 1, GRANITE[1])
        c.rect(x0 - 2, gy1 + 3, W + 4, 1, GRANITE[2])
        for k in range(3):
            c.rect(dx - dw // 2 - 6 - 2 * k, gy1 + 2 * k + 1, dw + 12 + 4 * k, 2, TRAV[1 + k])
        # the slab and its name
        rd = self.roof_depth - 6
        c.rect(x0 - 6, top - rd, W + 12, rd, WHITE[2])
        c.rect(x0 - 6, top - rd, W + 12, 1, WHITE[1])
        surface(c, x0 - 2, top - rd + 3, W + 4, rd - 6, GRAVEL, self.seed)
        op.cast(c, x0 - 2, top - rd + 3, W + 4, 2, 0.7)
        c.rect(x0 - 6, top - 3, W + 12, 3, WHITE[1])
        self.furnish(x0, top - rd + 3, x1, top - 3, GRAVEL)
        c.rect(x0 - 6, top, W + 12, self.para, WHITE[2])
        c.rect(x0 - 6, top + self.para - 2, W + 12, 2, WHITE[4])
        self.sign(x0 + 4, top + 2, W - 8, self.para - 4, 'paint', 'bank')
        # the time and temperature pylon
        if self.right:
            px0 = x1 + 8
            ptop = base - 128
            panels(c, px0 + 4, ptop + 34, 8, base - ptop - 34, pier, 8, 16, 1)
            c.rect(px0 + 4, ptop + 34, 1, base - ptop - 34, pier[0])
            raised(c, px0 - 6, ptop, 28, 34, BRONZE, 2)
            c.rect(px0 - 4, ptop + 2, 24, 13, s['logo'][2])
            emblem_key(c, px0 + 8, ptop + 8, s['logo'])
            c.rect(px0 - 4, ptop + 17, 24, 15, INK[4])
            hh = 1 + int(h2(self.seed, 2, 1) * 11)
            now = f'{hh}{int(h2(self.seed, 4, 1) * 5)}{int(h2(self.seed, 5, 1) * 9)}'
            temp = f'{50 + int(h2(self.seed, 6, 1) * 40)}*'
            self.tube(dots(now.rjust(3), px0 - 3, ptop + 20), 'amber', 'time', 'first')
            self.neon['temp'] = dict(mode='second', colour='amber', px=set(dots(temp.rjust(3), px0 - 3, ptop + 20)))
        self.foot(GRANITE)


def dots(s, x, y):
    """Lamp-bank digits: each cell of the font one bulb, one dark pixel apart."""
    pts = []
    for k, ch in enumerate(s):
        w, h, bits = glyph(ch)
        pts += [(x + k * 8 + 2 * i, y + 2 * j) for j in range(h) for i in range(w) if bits[j * w + i] == '1']
    return pts


def emblem_key(c, cx, cy, r):
    """A bank's mark: a ring and a bar, the modern logo of thrift."""
    for a in range(20):
        c.p(cx + round(4 * math.cos(a * math.pi / 10)), cy + round(4 * math.sin(a * math.pi / 10)), r[0])
    c.rect(cx - 1, cy - 2, 3, 5, r[0])


# ------------------------------------------------------------------ the strip center

STRIP = [('VIDEO', 'tv', BLUE, YELLOW), ('DONUTS', 'counter', ORANGE, WHITE), ('PIZZA', 'counter', RED, WHITE),
         ('CLEANERS', 'racks', TEAL, WHITE), ('LIQUOR', 'shelves', GREEN, WHITE), ('BARBER', 'empty', WHITE, RED),
         ('SHOES', 'racks', CREAM, RED), ('RADIO', 'tv', INK, ORANGE), ('BOOKS', 'books', BUTTER, GREEN)]

# The same strip let to other tenants: who runs a shop shows in its signs and
# paint before it shows in the building.
STRIP_MX = [('TAQUERIA', 'counter', CRIMSON, SAFFRON), ('PANADERIA', 'bread', SAFFRON, CRIMSON),
            ('CARNICERIA', 'counter', JADE, WHITE), ('MERCADO', 'shelves', COBALT, YELLOW),
            ('LAVANDERIA', 'racks', TURQ, WHITE), ('BOTANICA', 'shelves', VIOLET, SAFFRON),
            ('ZAPATERIA', 'racks', HOTPINK, WHITE), ('ENVIOS', 'counter', GREEN, WHITE)]
STRIP_ASIA = [('PHO', 'counter', CRIMSON, WHITE), ('NOODLES', 'counter', SAFFRON, CRIMSON), ('SUSHI', 'counter', INK, WHITE),
              ('MARKET', 'shelves', JADE, YELLOW), ('TOFU', 'shelves', WHITE, CRIMSON), ('TEA', 'shelves', COBALT, GOLD),
              ('BAKERY', 'bread', HOTPINK, WHITE), ('VIDEO', 'tv', AZURE, YELLOW)]


class Strip(Block):
    """A neighbourhood strip center, 1965-1990: brick piers, plate glass, a
    shake mansard carrying one lit sign per tenant, and the walk under it."""
    FLOORS = dict(row=1, tall=1, shop=1, cottage=1, hut=1, stall=1, hall=1)
    H0, PARA, HEAD = 56, 22, 22

    def plan(self):
        n = max(1, self.W // 64)
        self.units = [(self.x0 + round(self.W * k / n), self.x0 + round(self.W * (k + 1) / n)) for k in range(n)]
        a, b_ = self.units[0]
        self.door_x, self.door_size = b_ - 17, (20, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        piers = s['pier']
        fm.brick(c, x0, top + self.para, W, base - top - self.para, piers)
        tenants = s.get('biz', STRIP)
        biz = [tenants[(self.seed * 3 + k * 5 + s.get('shift', 0)) % len(tenants)] for k in range(len(self.units))]
        for k, ((a, b_), (word, goods, face, ink)) in enumerate(zip(self.units, biz)):
            dx = b_ - 17
            shopfront(self, a + 5, base - 46, dx - 13 - a - 5, 46, s['frame'], piers, goods, transom=0,
                      letters='OPEN' if k % 3 == 1 and word != 'BARBER' else None)
            glass_door(self, dx, base, 20, 44, s['frame'])
            if goods != 'tv' and (k + self.seed) % 2 == 0:
                px0 = a + 9 + int(h2(k, 3, self.seed) * 12)
                c.rect(px0, base - 34, 11, 14, CREAM[1])
                c.rect(px0 + 1, base - 33, 9, 5, RED[2])
                text(c, px0 + 1, base - 26, 'SALE' if goods != 'counter' else 'HOT', RED[3])
            if word == 'BARBER':
                bx = dx + 13
                self.pole = (bx, base - 36)
                c.rect(bx - 1, base - 38, 5, 2, STEEL[1])
                c.rect(bx - 1, base - 20, 5, 2, STEEL[3])
                barber(c, bx, base - 36, 0)
                self.overlays.append(['barber', bx, base - 36])
            elif k % 2 == 0 and skeleton_w('OPEN') < dx - a - 30:
                self.tube(skeleton('OPEN', a + 10, base - 30), 'red', f'open{k}', 'flicker' if k == 0 else 'steady')
        # mansard and its signs
        my = top
        shakes(c, x0 - 3, my, W + 6, self.para, SHAKE, self.seed)
        c.rect(x0 - 3, my, W + 6, 1, ALU[1])
        c.rect(x0 - 3, my + self.para, W + 6, 2, SHAKE[5])
        op.cast(c, x0, my + self.para + 2, W, 10, 0.5)
        for k, ((a, b_), (word, goods, face, ink)) in enumerate(zip(self.units, biz)):
            sw = min(b_ - a - 12, max(text_w(word, 2) + 12, 40))
            box_sign(self, (a + b_) // 2 - sw // 2, my + 4, sw, 15, word, face, ink)
        self.deck(None, GRAVEL, CONCRETE, y=my)
        for a, b_ in self.units:
            unit(c, (a + b_) // 2 - 9, my - 3, 18, 6, 6, DOVE, fan=True)
        self.foot()


def barber(c, x, y, k):
    """A barber's pole, 3 x 16, its stripes risen k pixels."""
    for yy in range(16):
        for i in range(3):
            u = (i + yy + k) % 4
            col = RED[2] if u == 0 else BLUE[2] if u == 2 else WHITE[1]
            c.p(x + i, y + yy, col if i < 2 else fm.mix(col, INK[4], 0.3))
    c.p(x, y, WHITE[0])


# ------------------------------------------------------------------ the office

class Office(Block):
    """The curtain-wall office, 1958-1990: a lobby set back behind columns,
    floors of glass in a grid of mullions, a mechanical penthouse, and on
    some a name in red letters on the roof."""
    FLOORS = dict(row=4, tall=7, shop=2, cottage=2, hut=3, stall=2, hall=5)
    H0, H1, PARA, HEAD = 58, 46, 10, 44

    def __init__(self, s, form='row', cells=12, seed=0):
        if s.get('roofname') and cells >= 7:
            s = dict(s, para=18)
        super().__init__(s, form, cells, seed)

    def plan(self):
        self.door_x = self.x0 + self.W // 2
        self.door_size = (26, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        g, mull, span = TINT[s['glass']], s['mullion'], s['spandrel']
        pier = s.get('pier')
        ft = self.floor(self.floors - 1)[0]
        lobby_top = self.floor(0)[0]
        # curtain wall
        c.rect(x0, ft, W, lobby_top - ft, mull[3])
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for yy in range(t + 2, b - 10):
                for xx in range(x0 + 1, x1 - 1):
                    v = (yy - top) / max(1, base - top)
                    col = g[2] if v < 0.3 else g[3] if v < 0.7 else g[4]
                    d = (xx - x0) + (yy - top) * 0.7 + self.seed * 13
                    if 30 <= d % 120 <= 46:
                        col = g[max(1, g.index(col) - 1)]
                    c.p(xx, yy, col)
            c.rect(x0, b - 10, W, 10, span[2])
            c.rect(x0, b - 10, W, 1, span[1])
            c.rect(x0, b - 1, W, 1, span[4])
            c.rect(x0, t, W, 2, mull[2])
            for xx in range(x0, x1, 16):
                k = h2(xx, t, self.seed)
                if k < 0.3:
                    c.rect(xx + 2, t + 2, 14, int(4 + k * 40), g[1] if s['glass'] != 'bronze' else CREAM[3])
                self.panes.append((xx + 2, t + 2, 14, b - t - 12, 'cool', h2(xx, t, self.seed + 5) < 0.45))
        for xx in range(x0, x1, 16):
            c.rect(xx, ft, 2, lobby_top - ft, mull[2])
            c.rect(xx, ft, 1, lobby_top - ft, mull[1])
        if pier:
            for xx in list(range(x0, x1 - 6, 48)) + [x1 - 8]:
                panels(c, xx, ft, 8, lobby_top - ft, pier, 8, 12, 2)
                c.rect(xx, ft, 1, lobby_top - ft, pier[0])
                c.rect(xx + 7, ft, 1, lobby_top - ft, pier[5])
        # lobby behind its columns
        c.rect(x0, lobby_top, W, base - lobby_top, ROOM[5])
        shopfront(self, x0 + 6, lobby_top + 10, W - 12, base - lobby_top - 10, mull, s.get('pier') or GRANITE,
                  'empty', transom=0, pitch=16)
        glass_door(self, self.door_x, base, 26, 44, mull)
        op.cast(c, x0, lobby_top, W, 12, 0.48)
        colr = pier or GRANITE
        for xx in list(range(x0, x1 - 6, 48)) + [x1 - 8]:
            if abs(xx + 4 - self.door_x) < 20:
                continue
            c.rect(xx, lobby_top, 8, base - lobby_top, colr[2])
            c.rect(xx, lobby_top, 1, base - lobby_top, colr[0])
            c.rect(xx + 7, lobby_top, 1, base - lobby_top, colr[4])
            c.rect(xx, lobby_top, 8, 3, colr[4])
        # parapet, roof, penthouse
        c.rect(x0, top, W, self.para, (pier or mull)[2])
        c.rect(x0, top + self.para - 1, W, 1, (pier or mull)[4])
        self.coping((pier or mull), over=1)
        dy0 = self.deck(None, TAR, pier or ALU)
        pw = max(30, W // 2)
        px0 = (x0 + x1) // 2 - pw // 2
        unit(c, px0, top - 5, pw, 14, 8, pier or CONCRETE, louvres=True)
        if s.get('pediment') and pw >= 40:
            for i in range(pw + 4):
                h_ = round(10 * (1 - abs(i - (pw + 4) / 2) / ((pw + 4) / 2)))
                if abs(i - (pw + 4) / 2) > 4:
                    c.rect(px0 - 2 + i, top - 27 - h_, 1, h_ + 2, pier[2] if i < (pw + 4) / 2 else pier[3])
                    c.p(px0 - 2 + i, top - 27 - h_, pier[0])
        mx = px0 + pw - 6
        c.rect(mx, top - 44, 1, 17, INK[2])
        c.rect(mx - 2, top - 38, 5, 1, INK[3])
        self.tube([(mx, top - 45)], 'red', 'beacon', 'blink')
        if s.get('roofname') and self.para >= 18:
            word = s['roofname']
            tw = text_w(word, 2)
            lx, ly = (x0 + x1) // 2 - tw // 2, top + 4
            text(c, lx, ly, word, RED[2], RED[5], 2)
            tmp = C(tw + 1, 11)
            text(tmp, 0, 0, word, (1, 1, 1, 255), None, 2)
            self.neon['roofname'] = dict(mode='steady', colour='red', px={
                (lx + xx, ly + yy) for yy in range(tmp.h) for xx in range(tmp.w) if tmp.px[xx, yy][3]})
        self.foot(GRANITE)


# ------------------------------------------------------------------ the setback skyscraper

class Skyscraper(Block):
    """The setback skyscraper of New York and Chicago, 1923-1955: a stone base
    round a bronze portal, a shaft of brick piers running unbroken past dark
    spandrels, terraces where the 1916 zoning law stepped it back, and a crown:
    stepped, a steel spire, or a plain parapet round the water tank."""
    FLOORS = dict(tall=14, row=10, wide=12, hall=11)
    H0, H1, PARA, HEAD = 70, 38, 4, 150

    def __init__(self, s, form='row', cells=12, seed=0):
        # The tall form reaches the look's full height; the rest stand at half
        # to four fifths of it, so a downtown is not a wall of the tallest.
        u = h2(seed, 17, 91)
        k = 0.7 + 0.3 * u if form == 'tall' else 0.5 + 0.3 * u
        super().__init__(dict(s, floors=s.get('floors') or max(6, round(self.FLOORS['tall'] * k))), form, cells, seed)

    def plan(self):
        self.door_x = self.x0 + self.W // 2
        self.door_size = (26, 46)

    def half(self, i):
        """Half the width of storey i's face; the top storeys step back twice."""
        n, W = self.floors, self.W
        k = 1 if i < n - 4 else 0.72 if i < n - 1 else 0.46
        return int(W * k) // 2

    def beacon(self, x, y):
        """An aviation light: a dark red lens by day; the game blinks it at night."""
        self.c.rect(x - 1, y, 3, 2, CRIMSON[3])
        self.c.p(x, y, CRIMSON[1])
        self.overlays.append(['beacon', x - 3, y - 3])

    def paint(self):
        c, s, sd = self.c, self.s, self.seed
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        mid = (x0 + x1) // 2
        wall, stone, sp, acc = s['wall'], s['stone'], s['spandrel'], s['accent']
        g = TINT['sky']
        n = self.floors
        for i in range(n):
            t, b = self.floor(i)
            hw = self.half(i)
            a, z = mid - hw, mid + hw
            if i == 0:
                panels(c, a, t, z - a, b - t, stone, 24, 14, 2, sd)
                continue
            c.rect(a, t, z - a, b - t, wall[3])
            # bays of 16: a pier, then a window over a spandrel in the recess
            for bx in range(a, z - 6, 16):
                c.rect(bx, t, 5, b - t, wall[2])
                c.rect(bx, t, 1, b - t, wall[1])
                c.rect(bx + 4, t, 1, b - t, wall[4])
                wx, ww = bx + 6, min(9, z - bx - 7)
                if ww < 5:
                    continue
                wy, wh = t + 4, b - t - 15
                for yy in range(wy, wy + wh):
                    c.rect(wx, yy, ww, 1, g[2] if yy < wy + wh * 0.45 else g[3])
                c.rect(wx, wy, ww, 1, g[4])
                c.rect(wx, wy + wh // 2, ww, 1, CREAM[3])
                c.p(wx, wy + 1, g[1])
                self.panes.append((wx, wy, ww, wh, 'warm', h2(wx, wy, sd) < 0.42))
                # the spandrel, with a chevron in the accent
                c.rect(wx, wy + wh, ww, 11, sp[3])
                c.rect(wx, wy + wh, ww, 1, sp[1])
                for k in range(ww):
                    c.p(wx + k, wy + wh + 5 - min(k, ww - 1 - k) // 2 + 1, acc[2])
            c.rect(z - 5, t, 5, b - t, wall[2])
            c.rect(z - 1, t, 1, b - t, wall[4])
            c.rect(a, t, 1, b - t, wall[1])
            if i == 1:
                c.rect(a, b - 4, z - a, 4, stone[1])
                c.rect(a, b - 4, z - a, 1, stone[0])
                for xx in range(a, z):
                    c.p(xx, b - 2 + (abs(xx % 8 - 4) > 2), acc[3])
        # terraces where the face steps back, seen from above
        for i in range(1, n):
            lo, hi = self.half(i - 1), self.half(i)
            if hi >= lo:
                continue
            y = self.floor(i)[1]
            for a, z in ((mid - lo, mid - hi), (mid + hi, mid + lo)):
                c.rect(a, y - 7, z - a, 7, TAR[2])
                c.rect(a, y - 7, z - a, 2, wall[1])
                c.rect(a, y - 7, z - a, 1, wall[0])
                c.rect(a, y - 1, z - a, 1, wall[0])
            cast_right(c, mid + hi, y - 5, 5, 2)
            op.cast(c, mid - hi, y, 2 * hi, 2, 0.8)
        top = self.floor(n - 1)[0]
        hw = self.half(n - 1)
        crown = s['crown']
        c.rect(mid - hw - 1, top - 3, 2 * hw + 2, 3, acc[2])
        c.rect(mid - hw - 1, top - 3, 2 * hw + 2, 1, acc[0])
        if crown == 'step':
            y = top - 3
            for k, w_ in enumerate((hw - 6, hw - 14, hw - 22)):
                if w_ < 6:
                    break
                h_ = 12
                c.rect(mid - w_, y - h_, 2 * w_, h_, wall[2])
                c.rect(mid - w_, y - h_, 1, h_, wall[1])
                c.rect(mid + w_ - 1, y - h_, 1, h_, wall[4])
                for xx in range(mid - w_ + 4, mid + w_ - 3, 6):
                    c.rect(xx, y - h_ + 3, 2, h_ - 5, sp[3])
                c.rect(mid - w_ - 1, y - h_ - 2, 2 * w_ + 2, 2, acc[1])
                c.rect(mid - w_ - 1, y - h_ - 2, 2 * w_ + 2, 1, acc[0])
                op.cast(c, mid - w_, y - h_, 2 * w_, 2, 0.8)
                y -= h_ + 2
            c.rect(mid - 1, y - 30, 2, 30, STEEL[2])
            c.p(mid - 1, y - 30, STEEL[0])
            self.beacon(mid, y - 32)
        elif crown == 'spire':
            y = top - 3
            for k in range(4):
                r_ = hw - 4 - k * (hw // 5)
                if r_ < 6:
                    break
                for i in range(-r_, r_ + 1):
                    h_ = round(r_ * 0.75 * math.sqrt(max(0.0, 1 - (i / r_) ** 2)))
                    for j in range(h_):
                        e = h_ - j
                        col = STEEL[1] if e <= 2 else STEEL[2] if i < 0 else STEEL[3]
                        if 3 < e < h_ - 3 and abs(i) < r_ - 3 and (i + 64) % 6 < 2 and e % 5 < 3:
                            col = g[4]
                        c.p(mid + i, y - j, col)
                    c.p(mid + i, y - h_, STEEL[0])
                y -= round(r_ * 0.75) - 3
            for j in range(46):
                w_ = max(0, round(3 * (1 - j / 46)))
                c.rect(mid - w_, y - j, w_ + 1, 1, STEEL[1])
                c.rect(mid + 1, y - j, w_, 1, STEEL[3])
            c.p(mid, y - 46, STEEL[0])
        else:
            # the water tank on its steel stand, behind a plain parapet
            c.rect(mid - hw, top - 8, 2 * hw, 5, wall[2])
            c.rect(mid - hw, top - 8, 2 * hw, 1, wall[0])
            tx, tw, ty = mid + hw // 3 - 9, 18, top - 30
            for lx in (tx + 2, tx + tw - 4):
                c.rect(lx, ty + 14, 2, 10, INK[2])
            c.rect(tx + 1, ty + 18, tw - 2, 1, INK[3])
            for xx in range(tw):
                col = SHAKE[1] if xx < 3 else SHAKE[2] if xx < tw - 4 else SHAKE[4]
                c.rect(tx + xx, ty, 1, 14, col)
            for yy in (ty + 3, ty + 9):
                c.rect(tx, yy, tw, 1, INK[3])
            for xx in range(tw + 2):
                h_ = round(5 * (1 - abs(xx - (tw + 1) / 2) / ((tw + 2) / 2)))
                c.rect(tx - 1 + xx, ty - h_, 1, h_, SHAKE[3] if xx > tw / 2 else SHAKE[1])
            bx = mid - hw + 6
            c.rect(bx, top - 20, 16, 12, wall[2])
            c.rect(bx, top - 20, 16, 2, wall[0])
            c.rect(bx + 5, top - 15, 6, 7, INK[3])
        # the portal: two storeys of stone round bronze doors under a stepped head
        t1 = self.floor(1)[0] + 8
        pw = 40 if W >= 128 else 32
        px = mid - pw // 2
        c.rect(px - 4, t1, pw + 8, base - t1, stone[1])
        c.rect(px - 4, t1, 1, base - t1, stone[0])
        c.rect(px + pw + 3, t1, 1, base - t1, stone[4])
        for k in range(3):
            c.rect(px + k * 3, t1 + 4 + k * 3, pw - k * 6, base - t1 - 4 - k * 3, stone[2 + k])
        rx, rw = px + 9, pw - 18
        c.rect(rx, t1 + 13, rw, base - t1 - 13, ROOM[5])
        for yy in range(t1 + 15, base - 48):
            for xx in range(rx + 2, rx + rw - 2):
                a_, b_ = (xx - rx) % 5, (yy - t1) % 6
                c.p(xx, yy, acc[1] if a_ == 0 or b_ == 0 else g[3] if (xx + yy) % 7 else g[2])
        self.panes.append((rx + 2, t1 + 15, rw - 4, base - 48 - t1 - 15, 'warm', True))
        c.rect(rx, base - 48, rw, 2, acc[1])
        glass_door(self, mid, base, 22, 44, GOLD)
        op.cast(c, rx, t1 + 13, rw, 3, 0.6)
        for xx in range(px - 4, px + pw + 4):
            c.p(xx, t1 - 1, stone[0])
        for k in range(4):
            c.rect(mid - 3 - k * 3, t1 - 5 - k * 3 + 3, 6 + k * 6, 2, acc[2 if k % 2 else 1])
        for lx in (px - 9, px + pw + 5):
            c.rect(lx, base - 32, 4, 8, GOLD[2])
            c.rect(lx + 1, base - 31, 2, 5, CREAM[0])
            self.lamp(lx + 2, base - 29)
        self.foot(GRANITE)


def star_px(cx, cy, r):
    """A five-pointed star, point up, as a set of pixels."""
    pts = [(cx + (r if k % 2 == 0 else r * 0.42) * math.cos(-math.pi / 2 + k * math.pi / 5),
            cy + (r if k % 2 == 0 else r * 0.42) * math.sin(-math.pi / 2 + k * math.pi / 5)) for k in range(10)]
    out = set()
    for yy in range(cy - r - 1, cy + r + 2):
        for xx in range(cx - r - 1, cx + r + 2):
            inside = False
            for k in range(10):
                (ax, ay), (bx, by) = pts[k], pts[k - 1]
                if (ay > yy) != (by > yy) and xx < ax + (yy - ay) * (bx - ax) / (by - ay):
                    inside = not inside
            if inside:
                out.add((xx, yy))
    return out


def ruby_star(c, cx, cy, r, gilt):
    """The Kremlin's ruby star: red glass in a gilt rim, lit from within."""
    px = star_px(cx, cy, r)
    for x, y in px:
        rim = any((x + dx, y + dy) not in px for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        c.p(x, y, gilt[1] if rim and (x < cx or y < cy) else gilt[3] if rim else
            CRIMSON[1] if x < cx else CRIMSON[2] if x == cx else CRIMSON[3])
    return px


def obelisk(c, x, by, h, r, tip=GOLD):
    """A corner pinnacle: a plinth, a tapering shaft, a gilt ball; returns its tip."""
    c.rect(x - 3, by - 4, 7, 4, r[2])
    c.rect(x - 3, by - 4, 7, 1, r[0])
    c.rect(x + 3, by - 4, 1, 4, r[4])
    for j in range(h):
        y = by - 5 - j
        if j < h * 0.6:
            c.p(x - 1, y, r[1])
            c.p(x, y, r[2])
            c.p(x + 1, y, r[3])
        else:
            c.p(x, y, r[1] if j % 2 else r[2])
    top = by - 5 - h
    c.rect(x - 1, top - 2, 2, 2, tip[1])
    c.p(x, top - 1, tip[3])
    return top - 3


class Vysotka(Skyscraper):
    """One of Moscow's high-rises of 1947-1957: a red granite base round a
    tall arched portal, cream ceramic tiers that step in behind balustraded
    terraces with an obelisk at each corner, a lantern and drum, and a gilt
    spire carrying a ruby star in a wreath, floodlit at night."""
    FLOORS = dict(tall=15, row=11, wide=12, hall=12)
    H0, H1, PARA, HEAD = 74, 38, 4, 200

    def plan(self):
        self.door_x = self.x0 + self.W // 2
        self.door_size = (26, 50)

    def half(self, i):
        f = i / self.floors
        k = 1 if f < 0.4 else 0.7 if f < 0.66 else 0.48 if f < 0.87 else 0.32
        return int(self.W * k) // 2

    def casement(self, cx, t, wall, trim):
        c = self.c
        x, y, w, h = cx - 4, t + 6, 8, 20
        raised(c, x - 2, y - 2, w + 4, h + 3, trim, 1)
        op.glass(c, x, y, w, h)
        c.rect(x + w // 2, y, 1, h, WHITE[2])
        c.rect(x, y + h // 3, w, 1, WHITE[2])
        self.panes.append((x, y, w, h, 'warm', h2(x, y, self.seed) < 0.48))
        raised(c, x - 2, y + h + 1, w + 4, 2, trim, 1)
        op.cast(c, x - 2, y + h + 3, w + 4, 1, 0.7)
        c.rect(x, y + h + 5, w, 4, wall[3])
        c.rect(x, y + h + 5, w, 1, wall[4])
        c.rect(x, y + h + 8, w, 1, wall[1])

    def cornice(self, a, z, y, trim):
        c = self.c
        c.rect(a - 3, y, z - a + 6, 3, trim[1])
        c.rect(a - 3, y, z - a + 6, 1, trim[0])
        for xx in range(a - 2, z + 2, 3):
            c.p(xx, y + 3, trim[2])
        c.rect(a - 3, y + 4, z - a + 6, 1, trim[3])
        op.cast(c, a, y + 5, z - a, 2, 0.72)

    def balustrade(self, a, z, y, trim):
        c = self.c
        c.rect(a, y - 9, z - a, 2, trim[1])
        c.rect(a, y - 9, z - a, 1, trim[0])
        for xx in range(a + 1, z - 1, 3):
            c.rect(xx, y - 7, 2, 6, trim[2])
            c.p(xx + 1, y - 7, trim[3])
            c.p(xx, y - 4, trim[1])
        c.rect(a, y - 1, z - a, 1, trim[3])

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        mid = (x0 + x1) // 2
        wall, trim, plinth, gilt = s['wall'], s['trim'], s['plinth'], s['spire']
        n = self.floors
        wing = self.half(1)
        for i in range(1, n):
            t, b = self.floor(i)
            hw = self.half(i)
            a, z = mid - hw, mid + hw
            c.rect(a, t, z - a, b - t, wall[2])
            nb = max(2, round((z - a) / 16))
            for k in range(nb):
                self.casement(a + 4 + round((z - a - 8) * (k + 0.5) / nb), t, wall, trim)
            if hw < wing:
                # the tower's pilaster strips run unbroken up each tier
                for k in range(nb + 1):
                    px = a if k == 0 else z - 4 if k == nb else a + 2 + round((z - a - 8) * k / nb)
                    c.rect(px, t, 4, b - t, wall[1])
                    c.rect(px, t, 1, b - t, wall[0])
                    c.rect(px + 3, t, 1, b - t, wall[3])
            else:
                c.rect(a, b - 2, z - a, 2, wall[1])
                c.rect(a, b - 2, z - a, 1, wall[0])
                for qx, q in ((a, 1), (z - 5, 2)):
                    for yy in range(t, b, 6):
                        c.rect(qx, yy, 5, 5, trim[q])
                        c.rect(qx, yy + 5, 5, 1, trim[3])
        # each tier ends in a cornice; where the next steps in, a terrace
        tips = []
        for i in range(1, n):
            hw = self.half(i)
            if i < n - 1 and self.half(i + 1) == hw:
                continue
            y = self.floor(i)[0]
            self.cornice(mid - hw, mid + hw, y, trim)
            if i == n - 1:
                break
            hi = self.half(i + 1)
            for a, z in ((mid - hw, mid - hi), (mid + hi, mid + hw)):
                self.balustrade(a, z, y, trim)
            cast_right(c, mid + hi, y - 8, 7, 2)
            for ox in (mid - hw + 1, mid + hw - 2):
                tips.append((ox, obelisk(c, ox, y, 14 if hw == wing else 11, trim, gilt)))
        top = self.floor(n - 1)[0]
        hw = self.half(n - 1)
        # the top tier's terrace, its corner obelisks carrying the lights
        self.balustrade(mid - hw, mid + hw, top, trim)
        for ox in (mid - hw + 1, mid + hw - 2):
            self.beacon(ox, obelisk(c, ox, top, 16, trim, gilt))
        for ox, ty in tips[-2:]:
            self.beacon(ox, ty)
        # the lantern: three tall arches under a cornice
        bw = max(12, round(hw * 0.7))
        ly = top - 9
        c.rect(mid - bw, ly - 30, 2 * bw, 30, wall[2])
        c.rect(mid - bw, ly - 30, 1, 30, wall[0])
        c.rect(mid + bw - 1, ly - 30, 1, 30, wall[4])
        for k in (-1, 0, 1):
            ax = mid + k * round(bw * 0.62)
            for yy in range(ly - 24, ly - 4):
                hw_ = 3 if yy > ly - 22 else 2 if yy > ly - 24 else 1
                c.rect(ax - hw_, yy, 2 * hw_ + 1, 1, ROOM[5] if yy < ly - 14 else ROOM[4])
            self.panes.append((ax - 3, ly - 22, 7, 18, 'warm', True))
            raised(c, ax - 4, ly - 4, 9, 2, trim, 1)
        self.cornice(mid - bw, mid + bw, ly - 33, trim)
        # the drum, ribbed, round in plan
        dw = max(7, round(bw * 0.62))
        dy = ly - 33
        for xx in range(mid - dw, mid + dw):
            u = (xx - mid + 0.5) / dw
            q = 1 if u < -0.55 else 2 if u < 0.15 else 3 if u < 0.7 else 4
            c.rect(xx, dy - 16, 1, 16, wall[q])
            if (xx - mid) % 4 == 0 and abs(u) < 0.8:
                c.rect(xx, dy - 13, 1, 9, ROOM[5])
        c.rect(mid - dw - 1, dy - 18, 2 * dw + 2, 2, trim[1])
        c.rect(mid - dw - 1, dy - 18, 2 * dw + 2, 1, trim[0])
        # the spire, gilt and ribbed, with a small lantern a third of the way up
        sy, H = dy - 18, s.get('spire_h', 62)
        for j in range(H):
            w_ = round((dw * 0.55) * (1 - j / H) ** 1.2) + 1
            if H * 0.28 < j < H * 0.28 + 6:
                w_ += 2
            y = sy - j
            for xx in range(mid - w_, mid + w_ + 1):
                d = xx - mid
                col = gilt[0] if d == 0 else gilt[1] if d == -w_ else gilt[2] if d < 0 else gilt[4] if d == w_ else gilt[3]
                if j % 9 == 4:
                    col = gilt[1] if d <= 0 else gilt[3]
                elif j % 9 == 5 and d:
                    col = gilt[4]
                c.p(xx, y, col)
        # the wreath, and the star in it
        cy = sy - H - 8
        for a in range(-7, 8):
            for side in (-1, 1):
                ang = math.pi / 2 + side * (0.4 + a * 0.13)
                c.p(mid + round(9 * math.cos(ang)), cy + round(8 * math.sin(ang)), gilt[1] if a % 2 else gilt[3])
        c.rect(mid - 1, cy + 6, 3, 3, gilt[2])
        px = ruby_star(c, mid, cy, 7, gilt)
        self.neon['star'] = dict(mode='steady', colour='red', px=px)
        # floodlights wash the spire and the lantern after dark
        self.signs.append((mid - dw - 1, cy - 10, 2 * dw + 2, sy - cy + 10))
        # the base: red granite, a gilt star over the portal, shops either side
        t0 = self.floor(0)[0]
        fm.rustication(c, x0, t0, W, base - t0, plinth, 8, 26)
        raised(c, x0 - 2, t0 - 2, W + 4, 4, plinth, 1)
        pw = 40
        px0 = mid - pw // 2
        for cx in (px0 - 3, px0 + pw - 3):
            c.rect(cx, t0 + 4, 6, base - t0 - 4, plinth[2])
            c.rect(cx, t0 + 4, 1, base - t0 - 4, plinth[0])
            c.rect(cx + 5, t0 + 4, 1, base - t0 - 4, plinth[4])
            raised(c, cx - 1, t0 + 4, 8, 4, trim, 1)
        ax, aw = px0 + 4, pw - 8
        for i in range(aw):
            tt = (i - aw / 2 + 0.5) / (aw / 2)
            rise = round(12 * math.sqrt(max(0.0, 1 - tt * tt)))
            for yy in range(t0 + 22 - rise, base):
                c.p(ax + i, yy, ROOM[6] if yy < t0 + 22 else ROOM[5])
            c.p(ax + i, t0 + 21 - rise, plinth[1])
        for yy in range(t0 + 13, base - 52):
            for xx in range(ax + 3, ax + aw - 3):
                c.p(xx, yy, gilt[2] if (xx - ax) % 5 == 0 or (yy - t0) % 5 == 0 else TINT['sky'][3])
        self.panes.append((ax + 3, t0 + 13, aw - 6, base - 52 - t0 - 13, 'warm', True))
        glass_door(self, mid, base, 24, 48, gilt)
        fy = t0 - 18
        c.rect(mid - 9, fy - 2, 18, 18, wall[3])
        c.rect(mid - 9, fy - 2, 18, 1, wall[4])
        for a in range(-6, 7):
            for side in (-1, 1):
                ang = math.pi / 2 + side * (0.5 + a * 0.13)
                c.p(mid + round(7 * math.cos(ang)), fy + 7 + round(6 * math.sin(ang)), gilt[1] if a % 2 else gilt[2])
        ruby_star(c, mid, fy + 6, 4, gilt)
        for a, z in ((x0 + 4, px0 - 6), (px0 + pw + 6, x1 - 4)):
            if z - a < 24:
                continue
            shopfront(self, a, base - 46, z - a, 44, BRONZE, plinth, 'shelves', transom=8, pitch=14)
            self.sign(a + 1, t0 + 6, z - a - 2, 12, 'neon')
        for lx in (px0 - 10, px0 + pw + 6):
            c.rect(lx, base - 36, 4, 10, gilt[2])
            c.rect(lx + 1, base - 35, 2, 6, CREAM[0])
            self.lamp(lx + 2, base - 32)
        self.foot(plinth)


class Bubble(Skyscraper):
    """A Tokyo office tower of the bubble years, 1985-1995: a polished granite
    base round a glass lobby, ribbon windows of tinted glass between granite
    spandrels, a rounded corner, a column of lit tenant signs up one side,
    and on the roof a glass gable, a billboard or a red-and-white mast with
    the aviation lights blinking."""
    FLOORS = dict(tall=16, row=12, wide=13, hall=13)
    H0, H1, PARA, HEAD = 76, 34, 4, 130

    def half(self, i):
        return self.W // 2

    def paint(self):
        c, s, sd = self.c, self.s, self.seed
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        mid = (x0 + x1) // 2
        gr, g, tube = s['granite'], TINT[s['glass']], s['tubes']
        n = self.floors
        kx, kw = x0 + 3, 20
        signs = min(n - 1, 7 + sd % 3)
        fx = kx + kw + 3
        sx = (fx + x1 - 12) // 2
        for i in range(1, n):
            t, b = self.floor(i)
            sb = b - 11
            for yy in range(t, sb):
                c.rect(fx, yy, x1 - fx, 1, g[4] if yy == t else g[2] if yy < t + (sb - t) * 0.42 else g[3])
            # one broad sky reflection runs across the whole face
            for xx in range(fx, x1):
                for yy in range(t + 1, sb):
                    u = (xx - fx + (yy - base) // 2 + sd * 7) % 150
                    if u < 14:
                        c.p(xx, yy, g[1] if 4 <= u < 9 else g[2])
            for xx in range(fx, x1 - 12, 12):
                c.rect(xx, t, 1, sb - t, ALU[2])
                self.panes.append((xx + 1, t + 1, 11, sb - t - 1, 'cool', h2(xx, i, sd) < 0.66))
            c.rect(fx, sb, x1 - fx, 11, gr[2])
            c.rect(fx, sb, x1 - fx, 1, gr[0])
            c.rect(fx, sb + 1, x1 - fx, 1, gr[1])
            c.rect(fx, b - 1, x1 - fx, 1, gr[4])
            c.rect(fx, sb + 5, x1 - fx, 1, gr[3])
            # the rounded corner: the glass and the stone turn away from the light
            for j in range(12):
                q = 1 if j < 4 else 2 if j < 8 else 3
                xx = x1 - 12 + j
                for yy in range(t, b):
                    if yy < sb:
                        c.p(xx, yy, g[min(6, (4 if yy == t else 3) + q - (j == 1))])
                    else:
                        c.p(xx, yy, gr[min(6, 2 + q)] if j != 1 else gr[0])
            c.rect(fx - 3, t, 3, b - t, gr[1])
            c.rect(fx - 3, t, 1, b - t, gr[0])
            # the stair slot: a glazed recess between granite fins, its landings showing
            for xx in range(sx - 4, sx + 5):
                d = xx - sx
                c.rect(xx, t, 1, b - t, gr[1] if d == -4 else gr[2] if d == -3 else gr[4] if d in (3, 4) else
                       g[4] if d == -2 else g[3])
            c.rect(sx - 2, t + (b - t) // 2, 5, 1, ALU[3])
            c.rect(sx - 2, b - 2, 5, 2, gr[3])
            self.panes.append((sx - 2, t, 5, b - t - 2, 'cool', True))
        # the column of tenant signs on its steel frame, a neon tube beside each
        ty = self.floor(signs)[0]
        t0 = self.floor(0)[0]
        c.rect(kx - 1, ty, kw + 2, t0 - ty, gr[3])
        for xx in (kx, kx + kw - 1):
            c.rect(xx, ty - 4, 1, t0 - ty + 4, ALU[3])
        c.rect(kx, ty - 4, kw, 1, ALU[1])
        for i in range(1, signs + 1):
            t, b = self.floor(i)
            self.sign(kx + 2, t + 2, kw - 4, b - t - 4, "box")
            colour = tube[i % len(tube)]
            for yy in range(t + 3, t + 31):
                c.p(kx - 2, yy, DAYTUBE[colour])
            self.overlays.append([f'chase-{colour}', kx - 3, t + 3])
        for i in range(signs + 1, n):
            t, b = self.floor(i)
            c.rect(kx - 1, t, kw + 2, b - t, gr[2])
            c.rect(kx - 1, t, 1, b - t, gr[1])
            c.rect(kx - 1, b - 1, kw + 2, 1, gr[4])
        # the base: polished piers round a glass lobby, a steel canopy at the door
        c.rect(x0, t0, W, base - t0, GRANITE[3])
        c.rect(x0, t0, W, 4, gr[1])
        c.rect(x0, t0, W, 1, gr[0])
        for yy in range(t0 + 18, base):
            c.rect(x0 + 2, yy, W - 4, 1, ROOM[4] if yy < t0 + 21 else g[2] if yy < t0 + 30 else g[3] if yy < base - 4 else TRAV[3])
        for xx in range(x0 + 2, x1 - 2, 8):
            c.rect(xx, t0 + 18, 1, base - t0 - 18, ALU[3])
        c.rect(x0 + 2, t0 + 30, W - 4, 1, ALU[2])
        self.panes.append((x0 + 2, t0 + 18, W - 4, base - t0 - 18, 'shop', True))
        for xx in range(x0, x1 - 6, 32):
            c.rect(xx, t0 + 4, 6, base - t0 - 4, GRANITE[2])
            c.rect(xx, t0 + 4, 1, base - t0 - 4, GRANITE[1])
            c.rect(xx + 5, t0 + 4, 1, base - t0 - 4, GRANITE[4])
        c.rect(x1 - 6, t0 + 4, 6, base - t0 - 4, GRANITE[3])
        self.sign(mid - 30, t0 + 6, 60, 9, 'box')
        glass_door(self, mid, base, 24, 44, ALU)
        c.rect(mid - 22, base - 52, 44, 5, ALU[2])
        c.rect(mid - 22, base - 52, 44, 1, ALU[0])
        c.rect(mid - 22, base - 48, 44, 1, ALU[4])
        op.cast(c, mid - 20, base - 47, 40, 3, 0.66)
        for lx in (mid - 18, mid + 17):
            c.rect(lx, base - 47, 1, 2, ALU[3])
            self.lamp(lx, base - 45, 'shop')
        # the crown
        top = self.floor(n - 1)[0]
        crown = s['crown']
        c.rect(x0 - 1, top - 6, W + 2, 6, gr[2])
        c.rect(x0 - 1, top - 6, W + 2, 1, gr[0])
        c.rect(x0 - 1, top - 1, W + 2, 1, gr[4])
        if crown == 'gable':
            gw, gh = W // 2 - 6, 36
            for j in range(gh):
                w_ = round(gw * (1 - j / gh))
                y = top - 7 - j
                for xx in range(mid - w_, mid + w_ + 1):
                    col = g[2] if xx < mid else g[3]
                    if (xx - mid + j) % 9 == 0 or (xx - mid - j) % 9 == 0 or j % 7 == 0:
                        col = ALU[2] if xx < mid else ALU[3]
                    if abs(abs(xx - mid) - w_) < 1:
                        col = gr[1] if xx < mid else gr[3]
                    c.p(xx, y, col)
            c.rect(mid, top - 7 - gh - 12, 1, 12, ALU[2])
            self.beacon(mid, top - 7 - gh - 14)
        elif crown == 'billboard':
            bw, by = round(W * 0.72), top - 14
            bx = mid - bw // 2
            for px in (bx + 4, mid, bx + bw - 5):
                c.rect(px, by, 2, 8, INK[3])
            for x_, y_ in line(bx + 6, by, bx + bw - 7, top - 7):
                c.p(x_, y_, INK[3])
            c.rect(bx - 1, by - 28, bw + 2, 28, INK[2])
            c.rect(bx - 1, by - 28, bw + 2, 1, INK[1])
            self.sign(bx + 1, by - 27, bw - 2, 25, 'neon')
        else:
            mx, my = x1 - W // 3, top - 7
            for j in range(64):
                w_ = round(5 * (1 - j / 70)) + 1
                band = (j // 8) % 2
                r = CRIMSON if band == 0 else WHITE
                c.p(mx - w_, my - j, r[2])
                c.p(mx + w_, my - j, r[3])
                if j % 4 == 0:
                    c.rect(mx - w_, my - j, 2 * w_ + 1, 1, r[2])
                elif j % 4 == 2:
                    c.p(mx - w_ + (j // 2) % (2 * w_ + 1), my - j, r[3])
            for k, dy in enumerate((22, 36)):
                ex, ey = mx + (7 if k == 0 else -11), my - dy
                for yy in range(5):
                    w_ = (2, 3, 3, 3, 2)[yy]
                    c.rect(ex, ey + yy - 2, w_, 1, WHITE[1] if k else WHITE[3])
            c.rect(mx, my - 76, 1, 12, ALU[2])
            self.beacon(mx, my - 78)
            self.beacon(mx - 4, my - 32)
        for bx in (x0 + 2, x1 - 3):
            self.beacon(bx, top - 9)
        self.foot(GRANITE)


class Slab(Skyscraper):
    """The glass slab of the 1950s and 60s, after Lever House and the Seagram
    Building: a plain box of glass hung on a grid of mullions with no setback,
    a lobby set back behind columns on an open plaza, the plant hidden behind
    louvres on top. The blinds stop at three heights, as Seagram's did."""
    FLOORS = dict(tall=16, row=11, wide=12, hall=12)
    H0, H1, PARA, HEAD = 80, 32, 4, 70

    def half(self, i):
        return self.W // 2

    def paint(self):
        c, s, sd = self.c, self.s, self.seed
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        mid = (x0 + x1) // 2
        g, mull, sp = TINT[s['glass']], s['mullion'], s['spandrel']
        n = self.floors
        t0 = self.floor(0)[0]
        ft = self.floor(n - 1)[0]
        for i in range(1, n):
            t, b = self.floor(i)
            sb = b - 9
            if i == n - 1:
                # the plant floor: louvres across the whole face
                for yy in range(t, b):
                    c.rect(x0, yy, W, 1, mull[2] if (yy - t) % 3 == 0 else mull[4] if (yy - t) % 3 == 1 else mull[3])
                continue
            for yy in range(t, sb):
                c.rect(x0, yy, W, 1, g[4] if yy == t else g[2] if yy < t + (sb - t) * 0.4 else g[3])
            for xx in range(x0, x1):
                for yy in range(t + 1, sb):
                    u = (xx - x0 + (yy - base) // 2 + sd * 11) % 170
                    if u < 18:
                        c.p(xx, yy, g[1] if 5 <= u < 12 else g[2])
            for bx in range(x0, x1 - 2, 8):
                bay = (bx - x0) // 8
                k = h2(bay, i, sd)
                drop = 0 if k < 0.62 else (sb - t) // 2 if k < 0.86 else sb - t - 1
                if drop:
                    c.rect(bx + 2, t, 6, drop, s['blind'][3])
                    c.rect(bx + 2, t + drop - 1, 6, 1, s['blind'][4])
                self.panes.append((bx + 2, t, 6, sb - t, 'cool', h2(bay, i, sd + 3) < 0.5))
            c.rect(x0, sb, W, 9, sp[3])
            c.rect(x0, sb, W, 1, sp[1])
            c.rect(x0, b - 1, W, 1, sp[4])
        # the mullions run the full height, past glass and spandrel alike
        for xx in range(x0, x1 - 2, 8):
            c.rect(xx, ft, 1, t0 - ft, mull[1])
            c.rect(xx + 1, ft, 1, t0 - ft, mull[3])
        c.rect(x1 - 2, ft, 2, t0 - ft, mull[4])
        c.rect(x0, ft, 1, t0 - ft, mull[0])
        # the window cleaners' cradle, part way down the face
        if s.get('cradle'):
            gi = max(2, round(n * 0.62))
            gy, gx = self.floor(gi)[0] + 6, x0 + (W * 2) // 3
            for lx in (gx + 2, gx + 19):
                c.rect(lx, ft - 4, 1, gy - ft + 4, ALU[3])
            c.rect(gx, gy, 22, 8, ALU[2])
            c.rect(gx, gy, 22, 1, ALU[0])
            c.rect(gx, gy + 3, 22, 1, ALU[3])
            c.rect(gx + 21, gy, 1, 8, ALU[4])
            op.cast(c, gx, gy + 8, 22, 3, 0.7)
        # the lobby, set back under the slab behind its columns
        c.rect(x0, t0, W, base - t0, ROOM[5])
        c.rect(x0, t0, W, 3, mull[4])
        lx0, lx1 = x0 + 10, x1 - 10
        for yy in range(t0 + 12, base):
            c.rect(lx0, yy, lx1 - lx0, 1, g[2] if yy < t0 + 20 else g[3] if yy < base - 6 else TRAV[3])
        for xx in range(lx0, lx1, 12):
            c.rect(xx, t0 + 12, 1, base - t0 - 12, mull[2])
        c.rect(lx0, t0 + 12, lx1 - lx0, 1, mull[1])
        self.panes.append((lx0 + 1, t0 + 13, lx1 - lx0 - 2, base - t0 - 19, 'shop', True))
        op.cast(c, x0, t0 + 3, W, 14, 0.5)
        col = s['column']
        for xx in list(range(x0 + 4, x1 - 8, 40)) + [x1 - 10]:
            if abs(xx + 3 - mid) < 18:
                continue
            c.rect(xx, t0 + 3, 6, base - t0 - 3, col[2])
            c.rect(xx, t0 + 3, 1, base - t0 - 3, col[0])
            c.rect(xx + 5, t0 + 3, 1, base - t0 - 3, col[4])
        self.sign(mid - 26, t0 + 4, 52, 6, 'box')
        glass_door(self, mid, base, 26, 46, mull)
        # the roof: a cap over the louvres, the cleaners' track, and the plant
        top = ft
        c.rect(x0 - 1, top - 4, W + 2, 4, mull[2])
        c.rect(x0 - 1, top - 4, W + 2, 1, mull[0])
        c.rect(x0 - 1, top - 1, W + 2, 1, mull[4])
        c.rect(x0, top - 16, W, 12, TAR[3])
        c.rect(x0, top - 16, W, 1, TAR[1])
        c.rect(x0 + 2, top - 7, W - 4, 1, STEEL[2])
        c.rect(x0 + 2, top - 14, W - 4, 1, STEEL[3])
        pw = W // 2
        px = mid - pw // 2
        unit(c, px, top - 9, pw, 18, 6, mull, louvres=True)
        if s.get('cradle'):
            dx = x0 + (W * 2) // 3
            c.rect(dx - 2, top - 14, 26, 6, STEEL[2])
            c.rect(dx - 2, top - 14, 26, 1, STEEL[0])
            c.rect(dx + 1, top - 8, 1, 6, STEEL[3])
            c.rect(dx + 20, top - 8, 1, 6, STEEL[3])
        if s.get('mast'):
            mx = px + pw - 10
            c.rect(mx, top - 66, 2, 40, STEEL[2])
            c.rect(mx, top - 66, 1, 40, STEEL[1])
            for k in range(5):
                c.rect(mx - 3, top - 60 + k * 8, 8, 1, STEEL[3])
            self.beacon(mx + 1, top - 68)
            self.beacon(mx + 1, top - 46)
        for bx in (x0 + 2, x1 - 3):
            self.beacon(bx, top - 7)
        self.foot(s['column'])


def palm(c, x, by, h, seed=0):
    """A potted palm on a roof garden, seen square on."""
    c.rect(x - 3, by - 4, 7, 4, CONCRETE[3])
    c.rect(x - 3, by - 4, 7, 1, CONCRETE[1])
    for j in range(h):
        c.p(x + (j > h * 0.6) * ((seed % 2) * 2 - 1), by - 5 - j, WOOD_[2] if j % 3 else WOOD_[3])
    tx, ty = x + ((seed % 2) * 2 - 1), by - 5 - h
    for k, (dx, dy) in enumerate(((-6, 2), (-5, -2), (0, -4), (5, -2), (6, 2), (-3, 4), (3, 4))):
        for t in range(1, 6):
            px, py = tx + round(dx * t / 5), ty + round(dy * t / 5 + (t * t) / 10)
            c.p(px, py, JADE[1] if dx < 0 and t < 4 else JADE[2] if t < 4 else JADE[3])


class Tropic(Skyscraper):
    """A tower of Bangkok, Kuala Lumpur, Jakarta or Manila of the 1990s and
    2000s: a podium of shops with a video screen over the door and palms on its
    roof, a shaft of reflective glass striped with aluminium sunshades, white
    composite panels at the corners lit with colour strips at night, and a
    crown: a helipad, a pointed spire, or a gilt dome round a rooftop bar."""
    FLOORS = dict(tall=18, row=13, wide=14, hall=14)
    H0, H1, PARA, HEAD = 66, 32, 4, 130
    POD = 3

    def half(self, i):
        return self.W // 2 if i < self.POD else int(self.W * 0.74) // 2

    def paint(self):
        c, s, sd = self.c, self.s, self.seed
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        mid = (x0 + x1) // 2
        g, pan, strip = TINT[s['glass']], s['panel'], s['strip']
        n, P = self.floors, self.POD
        hw = self.half(P)
        a, z = mid - hw, mid + hw
        for i in range(P, n):
            t, b = self.floor(i)
            for yy in range(t, b - 4):
                c.rect(a + 8, yy, z - a - 16, 1, g[2] if yy < t + 12 else g[3])
            for xx in range(a + 8, z - 8):
                for yy in range(t, b - 4):
                    u = (xx - a + (yy - base) // 2 + sd * 5) % 130
                    if u < 16:
                        c.p(xx, yy, g[1] if 4 <= u < 10 else g[2])
            for xx in range(a + 8, z - 8, 12):
                c.rect(xx, t, 1, b - t - 4, g[4])
                self.panes.append((xx + 1, t, 11, b - t - 5, 'cool', h2(xx, i, sd) < 0.6))
            # the sunshade, its top lit, its shadow on the glass below
            c.rect(a + 8, b - 4, z - a - 16, 2, ALU[1])
            c.rect(a + 8, b - 2, z - a - 16, 1, ALU[3])
            c.rect(a + 8, b - 1, z - a - 16, 1, g[5])
            for k, cx in enumerate((a, z - 8)):
                c.rect(cx, t, 8, b - t, pan[2] if k == 0 else pan[3])
                c.rect(cx, t, 1 if k == 0 else 8, 1, pan[1])
                c.rect(cx + (0 if k == 0 else 7), t, 1, b - t, pan[0] if k == 0 else pan[4])
                c.rect(cx, b - 1, 8, 1, pan[4])
                c.p(cx + 4, t + 4, DAYTUBE[s['led']])
                for yy in range(t + 2, b - 2):
                    c.p(cx + 4, yy, pan[3] if k == 0 else pan[4])
                if (i - P) % 2 == 0 and i < n - 1:
                    self.overlays.append([f"chase-{s['led']}", cx + 3, t + 2])
        # a feature stripe of darker glass up the middle
        ft = self.floor(n - 1)[0]
        tp = self.floor(P)[1]
        sx = mid - 6
        for yy in range(ft, tp):
            if (yy - ft) % self.H1 < self.H1 - 4:
                c.rect(sx, yy, 12, 1, strip[3])
        c.rect(sx, ft, 1, tp - ft, strip[1])
        c.rect(sx + 11, ft, 1, tp - ft, strip[5])
        # the podium roof, a garden seen from above, where the shaft steps in
        py = self.floor(P - 1)[0]
        for l, r in ((x0, a), (z, x1)):
            c.rect(l, py - 8, r - l, 8, CONCRETE[3])
            c.rect(l, py - 8, r - l, 1, CONCRETE[1])
            c.rect(l, py - 2, r - l, 2, pan[1])
            c.rect(l, py - 2, r - l, 1, pan[0])
        op.cast(c, x0, py, W, 2, 0.8)
        cast_right(c, z, py - 7, 5, 2)
        for k, px in enumerate((x0 + (a - x0) // 2, z + (x1 - z) // 2)):
            if (a - x0) >= 14:
                palm(c, px, py - 2, 9 + k * 2, sd + k)
        # the podium: composite panels, a band of shop windows, a screen
        for i in range(1, P):
            t, b = self.floor(i)
            c.rect(x0, t, W, b - t, pan[2])
            c.rect(x0, t, W, 1, pan[1])
            c.rect(x0, b - 1, W, 1, pan[4])
            for xx in range(x0 + 16, x1, 16):
                c.rect(xx, t, 1, b - t, pan[3])
            if i == 1:
                c.rect(x0 + 4, t + 6, W - 8, b - t - 12, g[3])
                c.rect(x0 + 4, t + 6, W - 8, 1, g[4])
                for xx in range(x0 + 4, x1 - 4, 8):
                    c.rect(xx, t + 6, 1, b - t - 12, ALU[2])
                self.panes.append((x0 + 5, t + 7, W - 10, b - t - 14, 'shop', True))
        t2 = self.floor(P - 1)[0]
        sw, sh = 48, 36
        lx, ly = mid - sw // 2, t2 + 4
        c.rect(lx - 2, ly - 2, sw + 4, sh + 4, INK[3])
        c.rect(lx - 2, ly - 2, sw + 4, 1, INK[1])
        c.rect(lx, ly, sw, sh, INK[5])
        self.overlays.append(['led', lx, ly])
        op.cast(c, lx - 2, ly + sh + 2, sw + 4, 2, 0.7)
        for sx_ in (x0 + 6, x1 - 6 - 36):
            if abs(sx_ + 18 - mid) > 46:
                self.sign(sx_, t2 + 10, 36, 14, 'neon')
        # the ground floor: shops either side of the mall doors under a glass canopy
        t0 = self.floor(0)[0]
        c.rect(x0, t0, W, base - t0, pan[3])
        c.rect(x0, t0, W, 3, pan[1])
        shopfront(self, x0 + 4, t0 + 16, W - 8, base - t0 - 16, ALU, pan, 'racks', transom=0, pitch=24)
        for sx_ in (x0 + 6, mid + 22):
            if sx_ + 40 <= x1 - 4:
                self.sign(sx_, t0 + 5, min(40, mid - 22 - x0 - 8), 8, 'box')
        glass_door(self, mid, base, 28, 46, ALU)
        cy = base - 54
        c.rect(mid - 26, cy, 52, 3, g[2])
        c.rect(mid - 26, cy, 52, 1, g[0])
        c.rect(mid - 26, cy + 3, 52, 1, STEEL[3])
        op.cast(c, mid - 24, cy + 4, 48, 3, 0.66)
        for rx in (mid - 22, mid + 21):
            for j in range(10):
                c.p(rx + (j // 3 if rx < mid else -(j // 3)), cy - 1 - j, STEEL[2])
        # the crown
        top = ft
        c.rect(a - 1, top - 5, z - a + 2, 5, pan[2])
        c.rect(a - 1, top - 5, z - a + 2, 1, pan[0])
        c.rect(a - 1, top - 1, z - a + 2, 1, pan[4])
        crown = s['crown']
        if crown == 'helipad':
            # the pad on its steel frame, seen from above: a ring, an H
            rx_, ry_ = hw + 4, 12
            cy_ = top - 18
            for j in range(4):
                lx_ = a + 6 + j * ((z - a - 12) // 3)
                c.rect(lx_, cy_, 1, top - 5 - cy_, STEEL[3])
            for yy in range(cy_ - ry_, cy_ + ry_ + 1):
                for xx in range(mid - rx_, mid + rx_ + 1):
                    e = ((xx - mid) / rx_) ** 2 + ((yy - cy_) / ry_) ** 2
                    if e <= 1:
                        q = DOVE[1] if e > 0.86 and yy < cy_ else DOVE[4] if e > 0.86 else \
                            SAFFRON[2] if 0.58 < e < 0.7 else DOVE[2] if yy < cy_ else DOVE[3]
                        c.p(xx, yy, q)
            c.rect(mid - rx_, cy_ + ry_ + 1, 2 * rx_ + 1, 2, STEEL[4])
            for xx in (mid - 5, mid + 4):
                c.rect(xx, cy_ - 5, 2, 10, WHITE[0])
            c.rect(mid - 4, cy_ - 1, 8, 2, WHITE[0])
            for k in range(4):
                ang = math.pi * (0.15 + k * 0.5)
                self.beacon(mid + round(math.cos(ang) * (rx_ - 2)), cy_ + round(math.sin(ang) * (ry_ - 2)) - 1)
        elif crown == 'spire':
            y = top - 5
            for k, w_ in enumerate((hw - 6, hw - 14, hw - 22)):
                if w_ < 6:
                    break
                h_ = 14 - k * 2
                for yy in range(y - h_, y):
                    c.rect(mid - w_, yy, 2 * w_, 1, g[2] if (yy - y) % 4 else ALU[2])
                c.rect(mid - w_, y - h_, 2, h_, pan[1])
                c.rect(mid + w_ - 2, y - h_, 2, h_, pan[4])
                c.rect(mid - w_ - 1, y - h_ - 2, 2 * w_ + 2, 2, pan[1])
                c.rect(mid - w_ - 1, y - h_ - 2, 2 * w_ + 2, 1, pan[0])
                y -= h_ + 2
            for j in range(60):
                w_ = max(0, round(3 * (1 - j / 60)))
                c.rect(mid - w_, y - j, w_ + 1, 1, STEEL[1])
                c.rect(mid + 1, y - j, w_, 1, STEEL[3])
            self.beacon(mid, y - 62)
        else:
            # a colonnade round the bar, under a gilt dome lit from the upper left
            cw, ch = int(hw * 0.8), 18
            c.rect(mid - cw, top - 5 - ch, 2 * cw, ch, ROOM[4])
            self.panes.append((mid - cw, top - 5 - ch, 2 * cw, ch, 'warm', True))
            for k in range(7):
                px = mid - cw + round(k * (2 * cw - 3) / 6)
                c.rect(px, top - 5 - ch, 3, ch, pan[2])
                c.rect(px, top - 5 - ch, 1, ch, pan[0])
                c.rect(px + 2, top - 5 - ch, 1, ch, pan[4])
            dy = top - 5 - ch
            c.rect(mid - cw - 2, dy - 3, 2 * cw + 4, 3, pan[2])
            c.rect(mid - cw - 2, dy - 3, 2 * cw + 4, 1, pan[0])
            r = cw - 2
            rise = round(r * 0.95)
            for xx in range(-r, r + 1):
                h_ = round(rise * math.sqrt(max(0.0, 1 - (xx / r) ** 2)))
                for j in range(h_):
                    nx, ny = xx / r, -j / max(1, rise)
                    lit = -0.6 * nx - 0.8 * ny * 1.0 + 0.2
                    k = 1 if lit > 0.75 else 2 if lit > 0.35 else 3 if lit > 0.0 else 4
                    c.p(mid + xx, dy - 4 - j, GOLD[k])
                c.p(mid + xx, dy - 4 - h_, GOLD[1] if xx < 0 else GOLD[3])
            c.rect(mid, dy - 4 - rise - 14, 1, 14, GOLD[2])
            c.rect(mid - 1, dy - 4 - rise - 6, 3, 3, GOLD[1])
            self.beacon(mid, dy - 4 - rise - 16)
        for bx in (a + 2, z - 3):
            self.beacon(bx, top - 7)
        self.foot(GRANITE)


# ------------------------------------------------------------------ the picture palace

class Theatre(Block):
    """A deco picture palace, 1928-1950: cream terracotta with fluted piers, a
    stepped crown with a sunburst, a marquee ringed in chasing bulbs, a blade
    sign taller than the building, a ticket booth between the doors."""
    FLOORS = dict(row=2, tall=3, shop=1, cottage=1, hut=1, stall=1, hall=2)
    H0, H1, PARA, HEAD = 64, 50, 20, 52

    def plan(self):
        self.door_x = self.x0 + self.W // 2 + 22 if self.W >= 112 else self.x0 + self.W // 2
        self.door_size = (22, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, acc, acc2 = s['wall'], s['accent'], s['accent2']
        mid = (x0 + x1) // 2
        self.deck(None, TAR, wall, y=top + 14)
        steps = [(W, 0), (W * 3 // 5, 7), (W * 3 // 10, 14)] if W >= 112 else [(W, 0), (W // 2, 7)]
        for w_, rise in steps:
            panels(c, mid - w_ // 2, top + 14 - rise, w_, base - top - 14 + rise, wall, 24, 10, 2, self.seed)
        for w_, rise in steps:
            y = top + 14 - rise
            c.rect(mid - w_ // 2 - 1, y - 2, w_ + 2, 2, wall[0])
            c.rect(mid - w_ // 2 - 1, y, w_ + 2, 1, wall[4])
            op.cast(c, mid - w_ // 2, y + 1, w_, 2, 0.74)
        # sunburst in the crown
        sy = top + 14 + 4
        for a in range(-6, 7):
            ang = math.pi / 2 + a * math.pi / 14
            for r_ in range(4, 15):
                c.p(mid + round(r_ * math.cos(ang)), sy + 10 - round(r_ * math.sin(ang) * 0.8),
                    (acc if a % 2 else acc2)[2 if r_ < 10 else 3])
        c.rect(mid - 3, sy + 7, 7, 4, acc2[1])
        # fluted piers
        piers = [x0, x1 - 8] + ([mid - W // 4 - 4, mid + W // 4 - 4] if W >= 160 else [])
        for px0 in piers:
            for i in range(8):
                c.rect(px0 + i, top + 14, 1, base - top - 14, wall[1 if i in (0, 3, 6) else 3 if i in (2, 5) else 2])
            for k in range(3):
                c.rect(px0 + 1 + k, top + 16 + 2 * k, 6 - 2 * k, 2, acc[2])
        # upper storeys: glass block and zigzag spandrels
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for cx in [mid - W // 6 - 6, mid + W // 6 + 6] if W >= 140 else [mid - 14, mid + 14]:
                gx, gw = cx - 8, 16
                for yy in range(t + 8, b - 8):
                    for xx in range(gx, gx + gw):
                        a, b2 = (xx - gx) % 4, (yy - t) % 4
                        c.p(xx, yy, TINT['sky'][4] if a == 3 or b2 == 3 else TINT['sky'][1 if (a + b2) < 2 else 2])
                raised(c, gx - 2, t + 6, gw + 4, 2, wall, 1)
                raised(c, gx - 2, b - 8, gw + 4, 3, wall, 1)
                self.panes.append((gx, t + 8, gw, b - t - 16, 'dim', True))
                for xx in range(gx - 2, gx + gw + 2):
                    c.p(xx, b - 4 + abs((xx % 6) - 3) // 2, acc[3])
        # entrance
        dx = self.door_x
        if W >= 112:
            for side in (-1, 1):
                ddx = mid + side * 22
                glass_door(self, ddx, base, 22, 44, GOLD)
            bw = 20
            bx = mid - bw // 2
            c.rect(bx, base - 40, bw, 40, acc2[3])
            c.rect(bx, base - 12, bw, 12, TRAV[2])
            c.rect(bx, base - 12, bw, 1, TRAV[0])
            c.rect(bx + 2, base - 36, bw - 4, 22, CREAM[2])
            op.glass(c, bx + 3, base - 35, bw - 6, 20)
            for i in range(bw):
                lift = round(4 * math.sqrt(max(0.0, 1 - ((i - bw / 2 + 0.5) / (bw / 2)) ** 2)))
                c.rect(bx + i, base - 40 - lift, 1, lift, acc2[2])
                c.p(bx + i, base - 40 - lift, acc2[1])
            c.rect(bx + 6, base - 16, 8, 2, INK[3])
            self.panes.append((bx + 3, base - 35, bw - 6, 20, 'warm', True))
            for px0 in (x0 + 10, x1 - 30):
                if W >= 150:
                    raised(c, px0, base - 42, 20, 30, GOLD, 2)
                    poster(c, px0 + 2, base - 40, 16, 26, self.seed + px0)
                    self.signs.append((px0 + 2, base - 40, 16, 26))
        else:
            glass_door(self, dx, base, 22, 44, GOLD)
        # marquee
        mw = min(W - 12, max(84, W * 7 // 10))
        mx = mid - mw // 2
        my = self.floor(0)[0] - 2
        c.rect(mx - 2, my - 6, mw + 4, 6, STEEL[1])
        c.rect(mx - 2, my - 6, mw + 4, 1, STEEL[0])
        raised(c, mx, my, mw, 20, acc, 2)
        c.rect(mx + 2, my + 4, mw - 4, 12, WHITE[1])
        for row, word in enumerate(s['marquee']):
            if text_w(word) < mw - 8:
                text(c, mid - text_w(word) // 2, my + 4 + row * 6 + 1, word, INK[3])
        self.signs.append((mx + 2, my + 4, mw - 4, 12))
        self.bulb_row([(xx, my + 1) for xx in range(mx + 2, mx + mw - 1, 3)], 'marquee-top')
        self.bulb_row([(xx, my - 4) for xx in range(mx, mx + mw, 4)], 'marquee-deck', 'steady')
        self.bulb_row([(xx, my + 17) for xx in range(mx + mw - 3, mx + 1, -3)], 'marquee-bottom')
        op.cast(c, mx, my + 21, mw, 9, 0.5)
        # blade sign
        word = s['name']
        bh = len(word) * 11 + 12
        bw = 17
        bx = mid - bw // 2
        by = my - 6 - bh
        raised(c, bx, by, bw, bh, acc, 2)
        c.rect(bx + 3, by + 3, bw - 6, bh - 6, INK[3])
        self.tube(skeleton(word, mid + 2, by + 7, vertical=True), s['neon'], 'blade', 'steady')
        self.bulb_row([(bx + 1, yy) for yy in range(by + 2, by + bh - 1, 3)], 'blade-left')
        self.bulb_row([(bx + bw - 2, yy) for yy in range(by + bh - 3, by, -3)], 'blade-right')
        pts = []
        for a in range(8):
            ang = a * math.pi / 4
            pts += line(mid, by - 6, mid + round(5 * math.cos(ang)), by - 6 + round(5 * math.sin(ang)))
        self.tube(pts, 'amber', 'finial', 'blink')
        cast_right(c, bx + bw, by + 2, bh, 3)
        # terrazzo apron
        for yy in range(base, base + 4):
            for xx in range(x0 - 1, x1 + 1):
                k = h2(xx, yy, 3)
                c.p(xx, yy, acc[1] if abs(xx - mid) < 20 and yy == base + 1 else TRAV[1] if k < 0.8 else TRAV[3])
        c.rect(x0 - 1, base, W + 2, 1, TRAV[0])


def poster(c, x, y, w, h, seed):
    """A film poster, read from across a street: a field, a figure, a title."""
    pal = [RED, BLUE, YELLOW, TEAL, ORANGE][seed % 5]
    c.rect(x, y, w, h, pal[2])
    c.rect(x, y, w, h // 3, pal[1])
    cx = x + w // 2 + (seed % 3) - 1
    c.rect(cx - 2, y + 7, 4, 4, CREAM[2])
    c.rect(cx - 3, y + 11, 6, 8, INK[3])
    c.rect(x + 2, y + h - 5, w - 4, 2, WHITE[1])
    c.rect(x + 2, y + 2, w - 4, 1, WHITE[1])


# ------------------------------------------------------------------ Mexico City

def herreria(c, x, y, w, h, r, seed=0):
    """A Mexican steel casement, herrería: a frame of flat bar, a fixed band
    of small lights along the top, opening leaves below divided in
    rectangles, and a bar bent into a step or a diamond across the middle."""
    c.rect(x, y, w, h, r[3])
    op.glass(c, x + 1, y + 1, w - 2, h - 2)
    band = 7
    c.rect(x, y + band, w, 1, r[3])
    for xx in range(x + 4, x + w - 2, 4):
        c.rect(xx, y, 1, band, r[3])
    leaves = max(2, round(w / 10))
    for j in range(1, leaves):
        c.rect(x + round(w * j / leaves), y + band, 1, h - band, r[3])
    my = y + band + (h - band) // 2
    c.rect(x, my, w, 1, r[3])
    pattern = seed % 3
    for xx in range(x + 1, x + w - 1):
        u = (xx - x) % 8
        if pattern == 0:
            dy = -2 if u < 4 else 2
        elif pattern == 1:
            dy = min(u, 8 - u) - 2
        else:
            dy = 0 if u % 4 else -3
        c.p(xx, my + dy, r[3])
    c.rect(x, y, w, 1, r[1])
    c.rect(x, y, 1, h, r[2])


def mosaic(c, x, y, w, h, a, b, seed=0):
    """A panel of venecitas, the small glass tiles of the fifties, in two
    colours laid at random with a pale joint."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if (xx - x) % 3 == 2 or (yy - y) % 3 == 2:
                c.p(xx, yy, WHITE[2])
            else:
                k = h2((xx - x) // 3, (yy - y) // 3, seed)
                c.p(xx, yy, a[1] if k < 0.45 else a[2] if k < 0.8 else b[1])
    op.reveal(c, x, y, w, h, 1)


def gas_cylinder(c, x, by, r=None):
    """A 30 kg LP gas cylinder on a roof, its hood and valve on top."""
    r = r or WHITE
    cylinder(c, x, by, 8, 14, r, lid=None)
    c.rect(x + 2, by - 18, 4, 3, r[3])
    c.rect(x + 2, by - 18, 4, 1, r[1])
    c.rect(x + 1, by - 6, 6, 1, RED[2])
    c.rect(x + 8, by - 13, 6, 1, ALU[3])


def tinaco(c, x, by, r, w=16, h=16):
    """A water tank on its stand of block: asbestos cement banded, or the
    later black plastic one ribbed."""
    c.rect(x - 1, by - 6, w + 2, 6, CMU[2])
    c.rect(x - 1, by - 6, w + 2, 1, CMU[1])
    c.rect(x + w // 2, by - 5, 1, 5, CMU[4])
    cylinder(c, x, by - 6, w, h, r, lid=r[1])
    for yy in range(by - 6 - h + 4, by - 7, 5):
        c.rect(x, yy, w, 1, r[4])
    cast_right(c, x + w, by - 6 - h - 2, h + 6, 3, 0.66)


class Moderno(Block):
    """A Mexico City apartment block of 1950-1985: a painted concrete frame
    of columns and floor beams, steel casements (herrería) under thin
    concrete visors, a panel of venecitas under a window here and there,
    tubular balconies, a stair behind a lattice of breeze block; shops
    behind cortinas with their names painted on the wall over them. On the
    red-coated azotea, tinacos on block stands, gas cylinders, a room for
    the help, the wash on its lines, and rebar left for the next floor."""
    FLOORS = dict(row=3, tall=4, shop=2, cottage=1, hut=2, stall=1, hall=4, wide=3)
    H0, H1, PARA, HEAD = 60, 48, 8, 34

    def plan(self):
        self.stair = self.W >= 112 and self.floors > 1
        n = max(1, round((self.W - (24 if self.stair else 0)) / 52))
        a = self.x0 + (24 if self.stair else 0)
        self.bays = [(a + round((self.x1 - a) * k / n), a + round((self.x1 - a) * (k + 1) / n)) for k in range(n)]
        self.door_x = self.x0 + 12 if self.stair else self.bays[0][0] + 14
        self.door_size = (20, 44)
        self.cols = [self.x0] + [a for a, _ in self.bays[1:]] + [self.x1 - 6] + ([self.x0 + 22] if self.stair else [])

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, frame = s['wall'], s['frame']
        t0 = self.floor(0)[0]
        stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        if self.stair:
            self.moderno_stair()
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for k, (a, b_) in enumerate(self.bays):
                self.moderno_bay(a, b_, b, i, k)
            # the floor beam, painted as the frame
            c.rect(x0, b - 5, W, 5, frame[2])
            c.rect(x0, b - 5, W, 1, frame[1])
            c.rect(x0, b - 1, W, 1, frame[4])
            op.cast(c, x0, b, W, 2, 0.72)
        for xx in self.cols:
            c.rect(xx, top, 6, t0 - top, frame[2])
            c.rect(xx, top, 1, t0 - top, frame[1])
            c.rect(xx + 5, top, 1, t0 - top, frame[4])
            cast_right(c, xx + 6, top, t0 - top, 2, 0.74)
        self.moderno_ground()
        self.moderno_roof()
        self.foot()

    def moderno_stair(self):
        c, s = self.c, self.s
        st, sb = self.top + self.para, self.floor(0)[0]
        x = self.x0 + 4
        for yy in range(st, sb):
            for xx in range(x, x + 18):
                a, b2 = (xx - x) % 6, (yy - st) % 6
                if a == 5 or b2 == 5:
                    col = s['frame'][2] if b2 != 5 or a == 5 else s['frame'][1]
                elif 1 <= a <= 3 and 1 <= b2 <= 3:
                    col = ROOM[5] if (a, b2) != (1, 1) else ROOM[4]
                else:
                    col = s['frame'][1]
                c.p(xx, yy, col)
        self.panes.append((x, st, 18, sb - st, 'dim', True))

    def moderno_bay(self, a, b_, b, i, k):
        c, s, frame = self.c, self.s, self.s['frame']
        cx = (a + b_) // 2
        balcony = (k + i + self.seed) % 3 == 0 and b_ - a >= 46
        ww = min(32, b_ - a - 18)
        wh = 26 if not balcony else 36
        sill = b - 16 if not balcony else b - 6
        wx, wy = cx - ww // 2, sill - wh
        c.rect(wx - 1, wy - 1, ww + 2, wh + 1, s['wall'][4])
        herreria(c, wx, wy, ww, wh, s['steel'], self.seed + k + i)
        if h2(k, i, self.seed + 2) < 0.55:
            cw = round((ww - 2) * (0.3 + 0.4 * h2(k, i, self.seed + 3)))
            cy0 = wy + 8
            for xx in range(wx + 1, wx + 1 + cw):
                c.rect(xx, cy0, 1, wh - 9, s['curtain'][1 if (xx - wx) % 3 else 2])
            c.rect(wx + cw, cy0, 1, wh - 9, s['curtain'][3])
        op.reveal(c, wx + 1, wy + 1, ww - 2, wh - 2, 2)
        self.panes.append((wx + 1, wy + 8, ww - 2, wh - 9, 'warm', h2(k, i, self.seed) < 0.6))
        # the visor: a thin slab out over the window, its top from above
        c.rect(wx - 5, wy - 7, ww + 10, 4, frame[1])
        c.rect(wx - 5, wy - 7, ww + 10, 1, frame[0])
        c.rect(wx - 5, wy - 3, ww + 10, 1, frame[3])
        op.cast(c, wx - 3, wy - 2, ww + 6, 4, 0.58)
        if balcony:
            sy = b - 6
            c.rect(wx - 7, sy, ww + 14, 4, frame[1])
            c.rect(wx - 7, sy, ww + 14, 1, frame[0])
            c.rect(wx - 7, sy + 3, ww + 14, 1, frame[4])
            r = s['rail']
            for ry in (sy - 14, sy - 7):
                c.rect(wx - 7, ry, ww + 14, 2, r[1])
                c.rect(wx - 7, ry + 1, ww + 14, 1, r[3])
            for xx in (wx - 7, wx + ww + 6):
                c.rect(xx, sy - 14, 1, 14, r[2])
            op.cast(c, wx - 7, sy + 4, ww + 14, 3, 0.62)
        else:
            c.rect(wx - 3, sill, ww + 6, 3, frame[1])
            c.rect(wx - 3, sill, ww + 6, 1, frame[0])
            c.rect(wx - 3, sill + 2, ww + 6, 1, frame[4])
            if (k + i + self.seed) % 2 == 1:
                mosaic(c, wx + 1, sill + 4, ww - 2, b - sill - 9, s['tile'], s['tile2'], self.seed + k * 7 + i)

    def moderno_ground(self):
        c, s = self.c, self.s
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        frame = s['frame']
        t0 = self.floor(0)[0]
        c.rect(x0, t0 - 2, W, 4, frame[1])
        c.rect(x0, t0 - 2, W, 1, frame[0])
        for k, (a, b_) in enumerate(self.bays):
            sx, sw = a + 8, b_ - a - 12
            if not self.stair and k == 0:
                self.moderno_gate(self.door_x)
                sx, sw = a + 30, b_ - a - 34
                if sw < 20:
                    continue
            # the shop's name painted straight on the wall
            self.sign(sx - 2, t0 + 4, sw + 4, 13, 'paint')
            sy = t0 + 20
            c.rect(sx - 1, sy, sw + 2, base - sy, ROOM[6])
            up = [0.85, 0.35, 0.0][(k + self.seed) % 3]
            open_h = round((base - sy - 5) * up)
            if open_h > 4:
                interior(c, sx, sy + 5, sw, open_h, ['shelves', 'counter', 'racks'][(k + self.seed) % 3], self.seed + k)
                self.panes.append((sx, sy + 5, sw, open_h, 'shop', True))
            roller(c, sx, sy, sw, base - sy, s['cortina'], up)
        if self.stair:
            self.moderno_gate(self.door_x)
        for xx in self.cols:
            raised(c, xx, t0 + 2, 6, base - t0 - 2, frame, 1)

    def moderno_gate(self, cx):
        """The residents' door: an iron gate over glass in a frame of stone."""
        c, s = self.c, self.s
        base = self.base
        gx, gw = cx - 10, 20
        raised(c, gx - 3, base - 49, gw + 6, 49, TRAV, 1)
        c.rect(gx, base - 46, gw, 46, s['steel'][3])
        op.glass(c, gx + 2, base - 44, gw - 4, 30)
        for xx in range(gx + 3, gx + gw - 2, 3):
            c.rect(xx, base - 44, 1, 30, s['steel'][2])
        for i in range(gw - 4):
            c.p(gx + 2 + i, base - 36 + abs(i - (gw - 4) // 2) // 2, s['steel'][1])
        c.rect(gx, base - 14, gw, 14, s['steel'][3])
        c.rect(gx + 1, base - 13, gw - 2, 1, s['steel'][2])
        c.rect(gx + gw - 5, base - 22, 2, 2, GOLD[1])
        self.panes.append((gx + 2, base - 44, gw - 4, 30, 'dim', True))
        self.lamp(cx, base - 52)

    def moderno_roof(self):
        c, s = self.c, self.s
        x0, x1, W, top = self.x0, self.x1, self.W, self.top
        y0 = self.deck(None, IMPER, s['frame'], furnish=False)
        D = top - y0
        # the room for the help, its door to the roof
        if W >= 112:
            rx, rw = x0 + 8, 36
            rb = y0 + min(D - 8, 24)
            stucco(c, rx, rb - 22, rw, 22, s['wall'], 2, self.seed + 5)
            c.rect(rx, rb - 22, 1, 22, s['wall'][1])
            c.rect(rx + rw - 1, rb - 22, 1, 22, s['wall'][4])
            c.rect(rx - 1, rb - 29, rw + 2, 7, IMPER[1])
            c.rect(rx - 1, rb - 29, rw + 2, 1, IMPER[0])
            c.rect(rx - 1, rb - 23, rw + 2, 1, IMPER[3])
            c.rect(rx + 5, rb - 18, 10, 18, s['steel'][3])
            c.rect(rx + 6, rb - 17, 8, 7, GLASS[3])
            herreria(c, rx + 20, rb - 17, 12, 10, s['steel'], self.seed)
            cast_right(c, rx + rw, rb - 28, 28, 3, 0.66)
            op.cast(c, rx, rb, rw + 2, 2, 0.7)
            aerial(c, rx + rw - 6, rb - 29, 26)
        # tinacos, the gas, the lines of wash
        tx = x1 - 26
        tinaco(c, tx, y0 + min(D - 4, 26), s['tinaco'])
        if W >= 144:
            tinaco(c, tx - 22, y0 + min(D - 6, 22), s['tinaco'])
        gas_cylinder(c, tx - (40 if W >= 144 else 16), y0 + min(D - 6, 28))
        if W >= 96:
            lx0, lx1 = x0 + (52 if W >= 112 else 8), tx - (46 if W >= 144 else 22)
            if lx1 - lx0 >= 26:
                for px in (lx0, lx1):
                    c.rect(px, y0 + 8, 1, 14, DOVE[3])
                for j, ly in enumerate((y0 + 9, y0 + 15)):
                    c.rect(lx0, ly, lx1 - lx0, 1, DOVE[4])
                for wx in range(lx0 + 2, lx1 - 20, 22):
                    self.overlays.append(['wash', wx, y0 + 9])
        for xx in self.cols:
            for i in (1, 4):
                c.rect(xx + i, top - 13, 1, 11, RUST[3])
                c.p(xx + i, top - 14, RUST[1])


# ------------------------------------------------------------------ Tokyo

def nichome(c, x, y, w, h, r, seed=0):
    """Long facing tiles laid in stretcher bond, the cladding of a Japanese
    building of the seventies: a course every three pixels, joints faint."""
    for yy in range(y, y + h):
        row, ly = (yy - y) // 3, (yy - y) % 3
        for xx in range(x, x + w):
            u = (xx - x + (row % 2) * 4) % 8
            k = h2((xx - x + (row % 2) * 4) // 8, row, seed)
            col = r[2] if k < 0.8 else r[1] if k < 0.9 else r[3]
            if ly == 2:
                col = r[3]
            elif u == 7:
                col = r[3] if ly == 0 else col
            c.p(xx, yy, col)


def sliding(c, x, y, w, h, frame, frosted=False):
    """An aluminium sliding window, two leaves overlapping at the middle,
    frosted glass in the lower leaf of a stair or a washroom."""
    c.rect(x, y, w, h, frame[2])
    c.rect(x, y, w, 1, frame[0])
    c.rect(x, y, 1, h, frame[1])
    c.rect(x + w - 1, y, 1, h, frame[3])
    mid = x + w // 2
    for gx, gw in ((x + 2, w // 2 - 3), (mid + 1, w - w // 2 - 3)):
        if frosted:
            c.rect(gx, y + 2, gw, h - 4, WHITE[2])
            c.rect(gx, y + 2, gw, 2, WHITE[3])
            for yy in range(y + 5, y + h - 2, 4):
                c.rect(gx, yy, gw, 1, WHITE[1])
        else:
            op.glass(c, gx, y + 2, gw, h - 4)
    c.rect(mid - 1, y, 2, h, frame[1])
    c.rect(mid + 1, y, 1, h, frame[3])
    c.rect(x, y + h - 2, w, 2, frame[1])
    c.rect(x, y + h - 1, w, 1, frame[3])


def lace_curtain(c, x, y, w, h, r):
    """A curtain drawn to one side and a lace under-curtain across the rest."""
    cw = max(4, w // 4)
    for xx in range(x, x + cw):
        c.rect(xx, y, 1, h, r[1] if (xx - x) % 3 == 1 else r[2])
    c.rect(x + cw - 1, y, 1, h, r[3])
    for xx in range(x + cw, x + w):
        for yy in range(y + 1, y + h):
            if (xx + yy) % 4 == 0:
                c.p(xx, yy, WHITE[2])


def outdoor_unit(c, x, by, w=14, h=10):
    """An air conditioner's outdoor unit on its wall bracket: the fan grille
    round, the pipe run up the wall in its cover."""
    c.rect(x, by, w, 1, INK[3])
    c.rect(x + 2, by + 1, 1, 3, INK[3])
    c.rect(x + w - 3, by + 1, 1, 3, INK[3])
    c.rect(x, by - h, w, h, WHITE[2])
    c.rect(x, by - h, w, 1, WHITE[0])
    c.rect(x + w - 1, by - h, 1, h, WHITE[4])
    cx, cy = x + 5, by - h // 2
    for a in range(16):
        c.p(cx + round(3 * math.cos(a * math.pi / 8)), cy + round(3 * math.sin(a * math.pi / 8)), DOVE[4])
    c.p(cx, cy, DOVE[5])
    for yy in range(by - h + 2, by - 2, 2):
        c.rect(x + 10, yy, 2, 1, DOVE[4])
    op.cast(c, x + 1, by + 1, w, 2, 0.7)
    cast_right(c, x + w, by - h + 1, h, 2, 0.72)


def tank_tower(b, x, by, w, r):
    """The rooftop water tank of a Japanese building: FRP panels bolted in a
    grid, a hatch on top, raised on a steel stand with a cage ladder."""
    c = b.c
    sh = 12
    for px in (x + 2, x + w - 4):
        c.rect(px, by - sh, 2, sh, INK[3])
        c.p(px, by - sh, INK[1])
    for x_, y_ in line(x + 4, by - sh + 1, x + w - 5, by - 2):
        c.p(x_, y_, INK[3])
    for x_, y_ in line(x + 4, by - 2, x + w - 5, by - sh + 1):
        c.p(x_, y_, INK[3])
    c.rect(x, by - sh - 1, w, 2, INK[2])
    th, d = 20, 10
    ty = by - sh - 1 - th
    c.rect(x, ty, w, th, r[2])
    for xx in range(x, x + w, 7):
        c.rect(xx, ty, 1, th, r[4])
        c.rect(xx + 1, ty, 1, th, r[1])
    for yy in range(ty, ty + th, 7):
        c.rect(x, yy, w, 1, r[4])
        c.rect(x, yy + 1, w, 1, r[1])
    c.rect(x + w - 1, ty, 1, th, r[4])
    c.rect(x, ty - d, w, d, r[1])
    c.rect(x, ty - d, w, 1, r[0])
    c.rect(x, ty - 1, w, 1, r[3])
    c.rect(x + w // 2 - 4, ty - d + 3, 8, 4, r[2])
    c.rect(x + w // 2 - 4, ty - d + 3, 8, 1, r[3])
    # the ladder up its side
    lx = x + w + 1
    c.rect(lx, ty - 2, 1, by - ty + 2, ALU[3])
    c.rect(lx + 4, ty - 2, 1, by - ty + 2, ALU[3])
    for yy in range(ty, by, 3):
        c.rect(lx, yy, 5, 1, ALU[2])
    op.cast(c, x + 1, by, w + 6, 2, 0.68)
    cast_right(c, lx + 5, ty - d + 2, by - ty + d - 2, 2, 0.72)



class Zakkyo(Block):
    """A Tokyo zakkyo building of 1970-1990: long brown or cream facing
    tiles, a tenant to a floor behind aluminium sliding windows (a snack bar
    behind frosted glass, an office with its name in the glass, a flat with
    a lace curtain), outdoor units on brackets, a column of lit kanban down
    the side, a ramen shop under a noren with a red lantern, a vending
    machine; on the roof a tank on its stand behind a pipe rail and, on a
    tall one, a billboard frame."""
    FLOORS = dict(row=4, tall=6, shop=2, cottage=2, hut=4, stall=1, hall=4, wide=4)
    H0, H1, PARA, HEAD = 58, 44, 8, 36

    def margins(self):
        return 0, 6

    def plan(self):
        self.door_x = self.x0 + 22
        self.door_size = (24, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        tile = s['tile']
        t0 = self.floor(0)[0]
        nichome(c, x0, top, W, base - top, tile, self.seed)
        kx = x1 - 10
        for i in range(1, self.floors):
            t, b = self.floor(i)
            self.zakkyo_floor(i, t, b, kx)
            # the floor slab shows as a band of plain concrete
            c.rect(x0, b - 3, W, 3, CONCRETE[2])
            c.rect(x0, b - 3, W, 1, CONCRETE[1])
            c.rect(x0, b - 1, W, 1, CONCRETE[4])
            ky, kh = t + 4, b - t - 8
            self.sign(kx - 2, ky - 1, 16, kh + 2, 'box')
        c.rect(kx + 4, top + self.para, 3, t0 - top - self.para, ALU[3])
        c.rect(kx + 4, top + self.para, 1, t0 - top - self.para, ALU[2])
        # the drainpipe down the corner
        c.rect(x0 + 1, top + 2, 3, t0 - top - 2, DOVE[3])
        c.rect(x0 + 1, top + 2, 1, t0 - top - 2, DOVE[1])
        for yy in range(top + 20, t0, 30):
            c.rect(x0, yy, 5, 2, DOVE[4])
        self.zakkyo_ground()
        self.zakkyo_roof()
        self.foot()

    def zakkyo_floor(self, i, t, b, kx):
        c, s, x0, W = self.c, self.s, self.x0, self.W
        kind = (i * 2 + self.seed + s.get('shift', 0)) % 4
        wx, ww = x0 + 7, kx - x0 - 14
        wy, wh = t + 9, 24
        c.rect(wx - 2, wy - 2, ww + 4, wh + 4, CONCRETE[3])
        c.rect(wx - 2, wy - 2, ww + 4, 1, CONCRETE[4])
        n = max(1, round(ww / 30))
        for j in range(n):
            a = wx + round(ww * j / n)
            bw = round(ww * (j + 1) / n) - round(ww * j / n)
            frosted = kind == 1
            if kind == 2:
                c.rect(a, wy, bw, wh, ROOM[5])
            sliding(c, a, wy, bw, wh, ALU, frosted)
            if kind == 0:
                lace_curtain(c, a + 2, wy + 2, bw // 2 - 3, wh - 4, s['blind'])
            elif kind == 3:
                for xx in range(a + 2, a + bw - 2):
                    for yy in range(wy + 2, wy + 2 + round((wh - 4) * 0.45)):
                        c.p(xx, yy, s['blind'][1] if yy % 2 else s['blind'][2])
            op.reveal(c, a + 2, wy + 2, bw - 4, wh - 4, 1)
            self.panes.append((a + 2, wy + 2, bw - 4, wh - 4, 'warm' if kind in (0, 1) else 'cool',
                               h2(i, j, self.seed) < (0.9 if kind == 1 else 0.6)))
        if kind == 2:
            self.sign(wx + 4, wy + 6, ww - 8, 12, 'paint')
        raised(c, wx - 3, wy + wh + 2, ww + 6, 3, CONCRETE, 1)
        op.cast(c, wx - 2, wy + wh + 5, ww + 4, 2, 0.7)
        if kind == 1:
            awning(c, wx - 1, wy - 7, ww + 2, s['noren'], depth=4, valance=3, stripe=ww + 2)
        if (i + self.seed) % 2 == 0 and W >= 80:
            outdoor_unit(c, wx + ww - 18 - (i * 9) % 12, b - 6)

    def zakkyo_ground(self):
        c, s = self.c, self.s
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        t0 = self.floor(0)[0]
        c.rect(x0, t0, W, 4, CONCRETE[2])
        c.rect(x0, t0, W, 1, CONCRETE[1])
        sw = W - 22 if W < 96 else W - 40
        fy = t0 + 6
        c.rect(x0 + 4, fy, sw, base - fy, PINE[3])
        c.rect(x0 + 4, fy, sw, 2, PINE[1])
        shopfront(self, x0 + 6, fy + 4, sw - 4, base - fy - 4, PINE, PINE, 'counter', transom=0, pitch=14)
        nr = s['noren']
        nx, nw = self.door_x - 13, 26
        c.rect(nx - 1, fy + 2, nw + 2, 2, PINE[4])
        for k in range(4):
            px0 = nx + k * 7
            c.rect(px0, fy + 4, 6, 15, nr[2])
            c.rect(px0, fy + 4, 6, 1, nr[1])
            c.rect(px0 + 5, fy + 4, 1, 15, nr[4])
            c.rect(px0 + 2, fy + 9, 2, 2, nr[0])
        lx, ly = x0 + 4 + sw - 6, fy + 10
        for i, wdt in enumerate((4, 6, 7, 7, 6, 4)):
            c.rect(lx - wdt // 2, ly + i, wdt, 1, RED[2 if i < 3 else 3])
        c.rect(lx - 2, ly - 1, 4, 1, INK[3])
        c.rect(lx - 2, ly + 6, 4, 1, INK[3])
        c.p(lx - 1, ly + 2, RED[0])
        self.lamp(lx, ly + 3)
        if W >= 96:
            vx, vw = x1 - 32, 16
            c.rect(vx, base - 36, vw, 36, WHITE[2])
            c.rect(vx, base - 36, vw, 1, WHITE[0])
            c.rect(vx + 2, base - 33, vw - 4, 16, TINT['sky'][1])
            for row in range(3):
                for k in range(4):
                    c.rect(vx + 3 + k * 3, base - 32 + row * 5, 2, 3, GOODS[(row * 4 + k + self.seed) % len(GOODS)])
            c.rect(vx + 2, base - 15, vw - 4, 3, INK[3])
            c.rect(vx + vw - 4, base - 12, 2, 4, ALU[3])
            c.rect(vx + 2, base - 6, vw - 4, 4, INK[4])
            self.signs.append((vx + 2, base - 33, vw - 4, 16))
            dw = 14
            c.rect(x1 - 14, base - 44, dw - 2, 44, ALU[3])
            op.glass(c, x1 - 12, base - 42, dw - 6, 40)
            self.panes.append((x1 - 12, base - 42, dw - 6, 40, 'cool', True))

    def zakkyo_roof(self):
        c, s = self.c, self.s
        x0, x1, W, top = self.x0, self.x1, self.W, self.top
        y0 = self.deck(None, CONCRETE, CONCRETE, furnish=False)
        D = top - y0
        tw = 24
        tx = x0 + 8
        tank_tower(self, tx, y0 + min(D - 6, 36), tw, s['tank'])
        if self.form == 'tall' and W >= 64:
            # a billboard frame on the roof, its face the game's
            bx, bw = tx + tw + 12, min(56, x1 - tx - tw - 18)
            if bw >= 30:
                by = y0 + 10
                for px in (bx + 3, bx + bw - 5):
                    c.rect(px, by - 6, 2, top - by + 2, INK[3])
                for x_, y_ in line(bx + 5, by, bx + bw - 6, top - 6):
                    c.p(x_, y_, INK[3])
                c.rect(bx - 1, by - 28, bw + 2, 24, INK[2])
                self.sign(bx, by - 27, bw, 22, 'box')
        else:
            vent(c, x1 - 16, y0 + D // 2 + 6, 7)
            outdoor_unit(c, x1 - 34, y0 + D // 2 + 10)
        # the pipe rail round the edge of the roof
        for xx in range(x0 + 2, x1 - 1, 12):
            c.rect(xx, top - 12, 1, 10, ALU[3])
        c.rect(x0 + 1, top - 13, W - 2, 1, ALU[1])
        c.rect(x0 + 1, top - 7, W - 2, 1, ALU[3])


# ------------------------------------------------------------------ Moscow

def fortochka(b, x, y, w, h, frame=WHITE, lit='warm', tulle=False):
    """A Soviet double casement: two leaves, a transom, and the small vent
    pane (fortochka) let into the upper left."""
    c = b.c
    c.rect(x, y, w, h, frame[2])
    c.rect(x, y, w, 1, frame[1])
    op.glass(c, x + 2, y + 2, w - 4, h - 4)
    c.rect(x + w // 2 - 1, y, 2, h, frame[2])
    ty = y + h // 3
    c.rect(x, ty, w, 2, frame[2])
    c.rect(x + 2, y + 2, w // 2 - 3, ty - y - 2, frame[3])
    op.glass(c, x + 3, y + 3, w // 2 - 5, ty - y - 4)
    if tulle:
        for yy in range(ty + 2, y + h - 2):
            for xx in range(x + 2, x + w - 2):
                if xx != x + w // 2 and xx != x + w // 2 - 1 and (xx - x) % 3 != 1:
                    c.p(xx, yy, WHITE[0] if yy == ty + 2 or (xx - x) % 3 == 0 else WHITE[2])
    op.reveal(c, x + 1, y + 1, w - 2, h - 2, 2)
    b.panes.append((x + 2, y + 2, w - 4, h - 4, lit, h2(x, y, b.seed) < 0.62))


def hipped(c, L, R, eave, rd, r, hip=0.9, seam=6):
    """A painted iron roof in standing seams, hipped at both ends, from above."""
    px = set()
    for i in range(rd):
        yy = eave - 1 - i
        ins = round(i * hip) + 1
        for xx in range(L + round(i * 0.25), R - round(i * 0.25)):
            if xx < L + ins:
                col = r[1] if (xx - L - i) % seam else r[0]
            elif xx >= R - ins:
                col = r[4] if (xx - R + i) % seam else r[5]
            else:
                u = (xx - L) % seam
                col = r[1] if u == 0 else r[3] if u == 1 else r[2] if i < rd * 0.55 else r[1]
            c.p(xx, yy, col)
            px.add((xx, yy))
        if i == rd - 1:
            c.rect(L + ins, yy, R - L - 2 * ins, 1, r[0])
    return px


class Stalinka(Block):
    """A Moscow stalinka of 1947-1957: a red granite base of shops under
    neon letters, an arched way through to the yard, ochre stucco above with
    pilasters, architraves and stone balconies, a heavy cornice, an attic with
    a star in a wreath, and a painted iron roof hipped at the ends."""
    FLOORS = dict(row=4, tall=6, shop=2, cottage=2, hut=3, stall=1, hall=5)
    H0, H1, PARA, HEAD = 66, 48, 18, 34

    def plan(self):
        n = max(2, round(self.W / 34))
        self.cols = [self.x0 + round(self.W * (k + 0.5) / n) for k in range(n)]
        self.arch = self.W >= 144 and n >= 4
        self.k = n // 2 if self.arch else 0
        self.door_x = self.cols[self.k]
        self.door_size = (30, 56) if self.arch else (22, 46)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, trim, roof = s['wall'], s['trim'], IRONROOF[s['roof']]
        n = len(self.cols)
        hipped(c, x0 - 3, x1 + 3, top, round(self.roof_depth * 0.66), roof)
        for vx in (x0 + W // 5, x1 - W // 5):
            c.rect(vx, top - 20, 6, 12, BRICK[3])
            c.rect(vx, top - 20, 6, 2, BRICK[1])
            c.rect(vx + 5, top - 18, 1, 10, BRICK[5])
        t0 = self.floor(0)[0]
        stucco(c, x0, top, W, t0 - top, wall, 2, self.seed)
        fm.rustication(c, x0, t0, W, base - t0, REDGRAN, 8, 26)
        # attic with a star in a wreath
        if W >= 144:
            aw = 44
            ax = (x0 + x1) // 2 - aw // 2
            stucco(c, ax, top - 20, aw, 21, wall, 2, 3)
            c.rect(ax - 1, top - 22, aw + 2, 2, trim[1])
            c.rect(ax - 1, top - 22, aw + 2, 1, trim[0])
            sx, sy = (x0 + x1) // 2, top - 11
            for a in range(-7, 8):
                for side in (-1, 1):
                    ang = math.pi / 2 + side * (0.5 + a * 0.12)
                    c.p(sx + round(9 * math.cos(ang)), sy + round(6 * math.sin(ang)) - 1,
                        GOLD[2] if a % 2 else GOLD[3])
            for a in range(5):
                ang = -math.pi / 2 + a * 2 * math.pi / 5
                for r_ in range(5):
                    c.p(sx + round(r_ * math.cos(ang)), sy - 1 + round(r_ * math.sin(ang)), GOLD[1])
            c.rect(sx - 1, sy - 2, 3, 3, GOLD[1])
        # cornice
        c.rect(x0 - 4, top, W + 8, 4, trim[1])
        c.rect(x0 - 4, top, W + 8, 1, trim[0])
        c.rect(x0 - 4, top + 4, W + 8, 3, trim[3])
        for xx in range(x0 - 3, x1 + 3, 4):
            c.rect(xx, top + 7, 2, 3, trim[1])
            c.rect(xx + 1, top + 8, 1, 2, trim[4])
        c.rect(x0 - 2, top + 10, W + 4, 1, trim[4])
        op.cast(c, x0, top + 11, W, 4, 0.66)
        # pilasters between pairs of bays
        for k in range(n + 1):
            if k not in (0, n) and k % 2:
                continue
            px0 = x0 + round(W * k / n) - (0 if k == 0 else 6 if k == n else 3)
            raised(c, px0, top + 14, 6, t0 - top - 16, wall, 1)
            raised(c, px0 - 1, top + 12, 8, 4, trim, 1)
        # windows, string courses, balconies
        for i in range(1, self.floors):
            t, b = self.floor(i)
            wh = 26 if (i == self.floors - 1 and self.floors > 2) else 32
            for k, cx in enumerate(self.cols):
                sill = b - 8
                x, y = cx - 8, sill - wh
                raised(c, x - 3, y - 3, 22, wh + 5, trim, 1)
                fortochka(self, x, y, 16, wh, WHITE, 'warm', tulle=(k + i) % 3 == 0)
                if i == 1 and self.floors > 2:
                    for j in range(17):
                        h_ = round(4 * (1 - abs(j - 8) / 8))
                        c.rect(cx - 8 + j, y - 4 - h_, 1, h_ + 1, trim[1 if j < 8 else 2])
                        c.p(cx - 8 + j, y - 4 - h_, trim[0])
                raised(c, x - 4, sill, 24, 3, trim, 1)
                op.cast(c, x - 4, sill + 3, 24, 2, 0.7)
                if i == 2 and self.floors > 3 and (k == self.k or k in (0, n - 1)):
                    bw = 30
                    bx = cx - bw // 2
                    c.rect(bx, b - 3, bw, 3, trim[1])
                    c.rect(bx, b, bw, 2, trim[3])
                    for cx2 in (bx + 3, bx + bw - 7):
                        raised(c, cx2, b + 2, 4, 5, trim, 1)
                    c.rect(bx, b - 16, bw, 3, trim[1])
                    c.rect(bx, b - 16, bw, 1, trim[0])
                    for xx in range(bx + 1, bx + bw - 1, 3):
                        c.rect(xx, b - 13, 2, 10, trim[2])
                        c.p(xx, b - 9, trim[1])
                        c.p(xx + 1, b - 12, trim[4])
                    op.cast(c, bx, b + 2, bw, 3, 0.66)
            raised(c, x0, b - 1, W, 3, trim, 1)
        # the shops and their neon
        for k, cx in enumerate(self.cols):
            if self.arch and k == self.k:
                continue
            shopfront(self, cx - 13, base - 48, 26, 46, s['shopframe'], REDGRAN,
                      ['shelves', 'counter', 'books'][(k + self.seed) % 3], transom=8, pitch=14)
        spans = [(x0 + 4, self.door_x - 20), (self.door_x + 20, x1 - 4)] if self.arch else [(x0 + 4, x1 - 4)]
        for j, (a, b_) in enumerate(spans):
            self.sign(a + 2, t0 + 2, b_ - a - 4, 14, 'neon')
        # the arch through to the yard
        if self.arch:
            cx = self.door_x
            aw, ah = 30, 56
            ax, ay = cx - aw // 2, base - ah
            for i in range(-3, aw + 3):
                tt = (i - aw / 2 + 0.5) / (aw / 2 + 3)
                lift = round(12 * math.sqrt(max(0.0, 1 - tt * tt)))
                c.rect(ax + i, ay + 12 - lift - 3, 1, 3, trim[2 if i < aw // 2 else 3])
                c.p(ax + i, ay + 12 - lift - 3, trim[0])
            for i in range(aw):
                tt = (i - aw / 2 + 0.5) / (aw / 2)
                lift = round(12 * math.sqrt(max(0.0, 1 - tt * tt)))
                for yy in range(ay + 12 - lift, base):
                    d = (yy - ay) / ah
                    c.p(ax + i, yy, ROOM[6] if d < 0.45 else ROOM[5])
            c.rect(cx - 6, base - 20, 12, 20, CONCRETE[2])
            c.rect(cx - 6, base - 20, 12, 9, JADE[2])
            c.rect(cx - 4, base - 19, 3, 5, JADE[1])
            c.rect(cx - 6, base - 11, 12, 1, CONCRETE[1])
            for xx in range(ax + 1, ax + aw - 1, 3):
                c.rect(xx, base - 32, 1, 32, INK[2])
            c.rect(ax, base - 33, aw, 2, INK[2])
            c.rect(ax, base - 18, aw, 1, INK[2])
            self.lamp(cx, ay + 6)
        self.foot(REDGRAN)


SLOGANS = ['СЛАВА ТРУДУ', 'МИР ТРУД МАЙ', 'МИР']
SUPER = [CRIMSON, SAFFRON, COBALT, TANGERINE, JADE]


class Panelka(Block):
    """A Moscow panel block of 1965-1988: tiled panels with their joints
    sealed in dark mastic, loggias whose fronts were painted in bands of
    colour and glazed by each family in its own way, an entrance canopy, and
    a slogan in red letters on a lattice on the roof."""
    FLOORS = dict(row=5, tall=9, shop=3, cottage=3, hut=4, stall=2, hall=5)
    H0, H1, PARA, HEAD = 48, 42, 8, 42

    def plan(self):
        n = max(1, self.W // 48)
        self.bays = [(self.x0 + round(self.W * k / n), self.x0 + round(self.W * (k + 1) / n)) for k in range(n)]
        a, b_ = self.bays[n // 2]
        self.door_x, self.door_size = (a + b_) // 2, (20, 42)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        for yy in range(top, base):
            for xx in range(x0, x1):
                a, b2 = (xx - x0) % 4, (yy - top) % 4
                k = h2((xx - x0) // 4, (yy - top) // 4, self.seed)
                c.p(xx, yy, PANEL[2] if (xx - x0) % 8 == 7 or (yy - top) % 8 == 7 else PANEL[1])
        for a, _ in self.bays[1:]:
            for yy in range(top + self.para, base - 10):
                c.p(a, yy, PANEL[5])
                if h2(a, yy // 3, 9) < 0.3:
                    c.p(a + 1, yy, PANEL[4])
        for i in range(1, self.floors):
            t, b = self.floor(i)
            c.rect(x0, b - 1, W, 1, PANEL[5])
            for xx in range(x0, x1, 5):
                if h2(xx, b, 4) < 0.4:
                    c.rect(xx, b, 3, 1, PANEL[4])
        loggia = {k for k in range(len(self.bays)) if (k + self.seed) % 2 == 0}
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for k, (a, b_) in enumerate(self.bays):
                cx = (a + b_) // 2
                if k in loggia and b_ - a >= 40:
                    lx, lw, ly = a + 5, b_ - a - 10, t + 3
                    py = b - 15
                    c.rect(lx, ly, lw, py - ly, ROOM[5])
                    style = int(h2(k, i, self.seed) * 3)
                    if style == 0:
                        c.rect(lx + 4, ly + 4, 12, py - ly - 4, WHITE[3])
                        op.glass(c, lx + 6, ly + 6, 8, 12)
                        fortochka(self, lx + 20, ly + 6, min(18, lw - 24), 18, WHITE)
                    else:
                        fr = PINE if style == 1 else WHITE
                        c.rect(lx, ly, lw, py - ly, fr[2])
                        op.glass(c, lx + 1, ly + 2, lw - 2, py - ly - 2)
                        step = 7 if style == 1 else 10
                        for xx in range(lx, lx + lw, step):
                            c.rect(xx, ly, 1, py - ly, fr[3])
                        c.rect(lx, ly + (py - ly) // 3, lw, 1, fr[3])
                        self.panes.append((lx + 1, ly + 2, lw - 2, py - ly - 2, 'warm', h2(k, i, 3) < 0.6))
                    op.reveal(c, lx, ly, lw, py - ly, 3)
                    sup = SUPER[(k + s.get('shift', 0)) % len(SUPER)]
                    q = 2 if i % 2 else 3
                    c.rect(lx - 2, py, lw + 4, 13, sup[q])
                    c.rect(lx - 2, py, lw + 4, 1, sup[q - 1])
                    c.rect(lx - 2, py + 12, lw + 4, 1, sup[q + 2])
                    c.rect(lx - 2, b - 2, lw + 4, 2, PANEL[4])
                    op.cast(c, lx - 2, b, lw + 4, 2, 0.7)
                    for rx in (lx + 3, lx + lw - 4):
                        if h2(rx, i, 5) < 0.35:
                            c.rect(rx, b, 1, 4 + int(h2(rx, i, 6) * 6), RUST[4])
                else:
                    ww = min(24, b_ - a - 14)
                    fortochka(self, cx - ww // 2, b - 31, ww, 23, WHITE, 'warm', tulle=h2(k, i, 8) < 0.5)
                    c.rect(cx - ww // 2 - 1, b - 8, ww + 2, 2, ALU[2])
                    c.rect(cx - ww // 2 - 1, b - 8, ww + 2, 1, ALU[0])
        # ground floor and the entrance
        c.rect(x0, base - 10, W, 10, CONCRETE[3])
        c.rect(x0, base - 10, W, 1, CONCRETE[2])
        for k, (a, b_) in enumerate(self.bays):
            cx = (a + b_) // 2
            if cx == self.door_x:
                continue
            fortochka(self, cx - 11, base - 36, 22, 23, WHITE, 'warm', tulle=True)
            for xx in range(cx - 11, cx + 11, 4):
                c.rect(xx, base - 37, 1, 25, INK[3])
            c.rect(cx - 12, base - 26, 24, 1, INK[3])
        dx = self.door_x
        c.rect(dx - 10, base - 42, 20, 42, s['door'][3])
        c.rect(dx - 10, base - 42, 20, 1, s['door'][1])
        c.rect(dx - 10, base - 42, 1, 42, s['door'][2])
        c.rect(dx - 5, base - 36, 10, 8, GLASS[3])
        for yy in range(base - 36, base - 28, 2):
            c.rect(dx - 5, yy, 10, 1, INK[3])
        c.rect(dx + 5, base - 22, 3, 2, ALU[1])
        op.reveal(c, dx - 10, base - 42, 20, 42, 2)
        cy = base - 50
        for px0 in (dx - 18, dx + 16):
            c.rect(px0, cy + 4, 2, base - cy - 4, ALU[3])
            c.rect(px0, cy + 4, 1, base - cy - 4, ALU[1])
        c.rect(dx - 21, cy - 3, 42, 4, CONCRETE[1])
        c.rect(dx - 21, cy - 3, 42, 1, CONCRETE[0])
        c.rect(dx - 21, cy + 1, 42, 3, CONCRETE[3])
        op.cast(c, dx - 20, cy + 4, 40, 5, 0.6)
        c.rect(dx + 12, base - 46, 9, 6, BLUE[2])
        text(c, dx + 15, base - 45, str(1 + self.seed % 6), WHITE[0])
        self.signs.append((dx + 12, base - 46, 9, 6))
        self.lamp(dx, cy + 7)
        # roof and slogan
        c.rect(x0, top, W, self.para, PANEL[2])
        self.coping(PANEL)
        word = next((w_ for w_ in SLOGANS[s.get('slogan', 0):] + SLOGANS if text_w(w_, 2) <= W - 12), None)
        word = word if self.floors >= 4 else None
        y0 = self.deck(None, TAR, PANEL, furnish=not word)
        if word:
            by = y0 + 13
            unit(c, x0 + 12, by, 30, 14, 8, CONCRETE)
            c.rect(x0 + 18, by - 12, 8, 12, s['door'][3])
            unit(c, x1 - 34, by, 20, 8, 9, DOVE, louvres=True, fan=True)
            self.overlays.append(['acfan', x1 - 29, by - 8 - 4 - 1 - 3])
        if word:
            tw = text_w(word, 2)
            lx, ly = (x0 + x1) // 2 - tw // 2, top - 34
            for yy in (ly - 2, ly + 11):
                c.rect(lx - 3, yy, tw + 6, 1, INK[3])
            for xx in range(lx - 3, lx + tw + 4, 8):
                for d in range(top - ly - 15):
                    c.p(xx + d * 8 // max(1, top - ly - 15), ly + 12 + d, INK[3])
                c.rect(xx, ly + 11, 1, top - ly - 14, INK[2])
            text(c, lx, ly, word, RED[2], RED[5], 2)
            tmp = C(tw + 2, 12)
            text(tmp, 0, 0, word, (1, 1, 1, 255), None, 2)
            cut = lx + text_w(word[:-1], 2)
            for yy in range(tmp.h):
                for xx in range(tmp.w):
                    if tmp.px[xx, yy][3]:
                        g = 'slogan-last' if lx + xx > cut else 'slogan'
                        self.neon.setdefault(g, dict(mode='flicker' if g == 'slogan-last' else 'steady',
                                                     colour='red', px=set()))['px'].add((lx + xx, ly + yy))
        self.foot()


# ------------------------------------------------------------------ Tehran

def ajor(c, x, y, w, h, r, seed=0):
    """Tehran's yellow brick, ajor: long thin bricks in running bond with a
    pale raked joint, the courses reading before the bricks do."""
    for yy in range(y, y + h):
        row, ly = (yy - y) // 3, (yy - y) % 3
        for xx in range(x, x + w):
            u = (xx - x + (row % 2) * 5) % 10
            if ly == 2:
                col = r[1]
            elif u == 9:
                col = r[3] if ly == 0 else r[4]
            else:
                k = h2((xx - x + (row % 2) * 5) // 10, row, seed)
                col = r[3] if k < 0.14 else r[2]
                if ly == 0 and k >= 0.14:
                    col = r[2] if k < 0.8 else r[1]
            c.p(xx, yy, col)


def lozenge(c, x, y, w, h, r):
    """A recessed panel of brick laid in lozenges, the ajor-kari under a
    window: the pattern in shadow, the panel's frame proud."""
    c.rect(x, y, w, h, r[2])
    for yy in range(y + 1, y + h - 1):
        for xx in range(x + 1, x + w - 1):
            a, b = xx - x - w // 2, yy - y - h // 2
            if (abs(a) + abs(b * 2)) % 6 == 0:
                c.p(xx, yy, r[4])
            elif (abs(a) + abs(b * 2)) % 6 == 1:
                c.p(xx, yy, r[1])
    op.reveal(c, x, y, w, h, 1)
    c.rect(x, y + h - 1, w, 1, r[0])


def net(c, x, y, w, h, r, part=1.0, left=True):
    """A net curtain hung inside the glass in loose folds, drawn back part way."""
    cw = max(3, round(w * part))
    cx = x if left else x + w - cw
    for xx in range(cx, cx + cw):
        f = (xx - cx) % 4
        col = r[0] if f == 1 else r[2] if f == 3 else r[1]
        c.rect(xx, y, 1, h, col)
    edge = cx + cw - 1 if left else cx
    c.rect(edge, y, 1, h, r[3])
    c.rect(cx, y, cw, 1, r[3])


def cooler(b, x, by, r=None):
    """The evaporative cooler (kooler-e abi) on every Tehran roof: a sheet
    steel box, straw pads behind louvres on its sides, on an angle-iron
    stand, its square duct dropping into the house below."""
    c = b.c
    r = r or COOLER
    # the duct, behind: up out of the roof, over and into the box's back
    c.rect(x + 6, by - 10, 10, 10, ALU[2])
    c.rect(x + 6, by - 10, 1, 10, ALU[1])
    c.rect(x + 15, by - 10, 1, 10, ALU[4])
    for yy in range(by - 8, by, 3):
        c.rect(x + 6, yy, 10, 1, ALU[3])
    # the stand
    for px in (x + 1, x + 20):
        c.rect(px, by - 6, 2, 6, INK[3])
        c.p(px, by - 6, INK[1])
    c.rect(x, by - 7, 23, 2, INK[2])
    # the box: its front face, louvred pad, top seen from above
    bx, bw, bh, d = x, 23, 15, 9
    top = by - 7 - bh
    c.rect(bx, top, bw, bh, r[2])
    c.rect(bx, top, 1, bh, r[1])
    c.rect(bx + bw - 1, top, 1, bh, r[4])
    c.rect(bx + 3, top + 3, bw - 6, bh - 6, r[4])
    for yy in range(top + 3, top + bh - 3, 2):
        c.rect(bx + 3, yy, bw - 6, 1, r[2])
        c.rect(bx + 3, yy + 1, bw - 6, 1, PAD[3] if (yy // 2) % 3 else PAD[2])
    c.rect(bx, top - d, bw, d, r[1])
    c.rect(bx, top - d, bw, 1, r[0])
    c.rect(bx + 4, top - d + 2, bw - 8, d - 4, r[2])
    c.rect(bx + 4, top - d + 2, bw - 8, 1, r[3])
    c.rect(bx, top - 1, bw, 1, r[3])
    # the water's rust where the drip tray leaks
    c.rect(bx + 4, top + bh - 2, 6, 2, RUST[3])
    c.p(bx + 6, by - 6, RUST[4])
    op.cast(c, bx + bw, top - d + 2, 3, bh + d - 2, 0.66)
    op.cast(c, bx + 1, by, bw + 2, 2, 0.7)


def aerial(c, x, by, h=32, arms=(16, 13, 10, 7), r=None):
    """A television aerial on its mast: a boom with dipoles, a guy wire."""
    r = r or ALU
    c.rect(x, by - h, 1, h, r[3])
    c.rect(x - 1, by - 1, 3, 1, r[4])
    # the boom runs away from us, so its dipoles shorten up the mast
    for j, w_ in enumerate(arms):
        y_ = by - h + 2 + j * 3
        c.rect(x - w_ // 2, y_, w_, 1, r[2])
        c.p(x - w_ // 2, y_ + 1, r[4])
        c.p(x + w_ // 2 - 1, y_ + 1, r[4])
    for x_, y_ in line(x + 1, by - h + 4, x + 12, by - 1):
        if (x_ + y_) % 2:
            c.p(x_, y_, r[4])


def wrought(c, x, y, w, h, r):
    """A Tehran wrought-iron gate over glass: a frame, bars, a scroll at the
    head of each bar and a rail of rings across the middle."""
    c.rect(x, y, w, 2, r[2])
    c.rect(x, y + h - 2, w, 2, r[2])
    c.rect(x, y, 2, h, r[2])
    c.rect(x + w - 2, y, 2, h, r[2])
    for xx in range(x + 4, x + w - 3, 4):
        c.rect(xx, y + 2, 1, h - 4, r[2])
        c.p(xx - 1, y + 3, r[2])
        c.p(xx + 1, y + 3, r[2])
    my = y + h // 2
    c.rect(x, my - 1, w, 1, r[2])
    c.rect(x, my + 3, w, 1, r[2])
    for xx in range(x + 2, x + w - 2, 4):
        c.rect(xx, my, 3, 1, r[2])
        c.rect(xx, my + 2, 3, 1, r[2])
    c.rect(x, y, w, 1, r[1])


TEHRAN_SHOPS = ['bread', 'counter', 'shelves', 'racks', 'books']


class Tehran(Block):
    """A Tehran apartment house of 1960-1979: yellow ajor brick, with piers
    between the bays and lozenge panels under the windows, or a skin of
    travertine slabs; steel windows painted a strong colour with net
    curtains, a balcony to every other bay on a cantilevered slab; a
    turquoise tiled band under a thin concrete cornice; shops behind steel
    shutters and an iron-and-glass street door with its blue number plate.
    The roof is silvered isogam, with an evaporative cooler at each flat."""
    FLOORS = dict(row=4, tall=5, shop=2, cottage=2, hut=3, stall=1, hall=4, wide=4)
    H0, H1, PARA, HEAD = 60, 48, 12, 34

    def plan(self):
        self.stair = self.W >= 112 and self.floors > 1
        a0 = self.x0 + (26 if self.stair else 0)
        n = max(1, round((self.x1 - a0) / 52))
        self.bays = [(a0 + round((self.x1 - a0) * k / n), a0 + round((self.x1 - a0) * (k + 1) / n)) for k in range(n)]
        self.door_x = self.x0 + 13 if self.stair else self.bays[0][0] + 14
        self.door_size = (20, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        steel, cur = s['steel'], s['curtain']
        brick = s['face'] == 'brick'
        t0 = self.floor(0)[0]
        if brick:
            ajor(c, x0, top, W, t0 - top, YBRICK, self.seed)
        else:
            panels(c, x0, top, W, t0 - top, TRAVY, 32, 12, 2, self.seed)
        # piers between the bays, a brick proud of the wall
        if brick:
            for a in [a for a, _ in self.bays[1:]] + ([x0 + 24] if self.stair else []):
                c.rect(a - 3, top + self.para, 6, t0 - top - self.para, YBRICK[1])
                for yy in range(top + self.para + 2, t0, 3):
                    c.rect(a - 3, yy, 6, 1, YBRICK[0])
                c.rect(a - 3, top + self.para, 1, t0 - top - self.para, YBRICK[0])
                c.rect(a + 2, top + self.para, 1, t0 - top - self.para, YBRICK[3])
                cast_right(c, a + 3, top + self.para, t0 - top - self.para, 2, 0.74)
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for k, (a, b_) in enumerate(self.bays):
                balcony = (k + i + self.seed) % 2 == 0 and i < self.floors
                self.tehran_bay(a, b_, b, i, k, balcony, brick)
            # the floor slab's edge, travertine-faced
            c.rect(x0, b - 3, W, 3, TRAVY[1])
            c.rect(x0, b - 3, W, 1, TRAVY[0])
            c.rect(x0, b - 1, W, 1, TRAVY[3])
            op.cast(c, x0, b, W, 2, 0.74)
        if self.stair:
            self.tehran_stair()
        # the tiled band and the cornice slab
        ty = top + 2
        c.rect(x0, ty, W, 8, s['tile'][3])
        c.rect(x0, ty, W, 1, s['tile'][1])
        for sx in range(x0 + 1, x1 - 6, 8):
            c.rect(sx + 2, ty + 2, 4, 4, s['tile2'][1])
            c.rect(sx + 3, ty + 1, 2, 6, s['tile2'][1])
            c.rect(sx + 1, ty + 3, 6, 2, s['tile2'][1])
            c.rect(sx + 3, ty + 3, 2, 2, WHITE[1])
            c.p(sx + 7, ty + 4, s['tile'][5])
        c.rect(x0, ty + 7, W, 1, s['tile'][5])
        c.rect(x0 - 2, top - 2, W + 4, 4, CONCRETE[1])
        c.rect(x0 - 2, top - 2, W + 4, 1, CONCRETE[0])
        c.rect(x0 - 2, top + 1, W + 4, 1, CONCRETE[4])
        op.cast(c, x0, top + 2, W, 2, 0.66)
        self.tehran_ground()
        self.tehran_roof()
        self.foot(TRAVY)

    def tehran_bay(self, a, b_, b, i, k, balcony, brick):
        c, s, steel, cur = self.c, self.s, self.s['steel'], self.s['curtain']
        ww = b_ - a - 14
        wh = 30 if balcony else 24
        sill = b - 6 if balcony else b - 12
        wx, wy = a + 7, sill - wh
        # travertine surround, then the steel frame and its lights
        raised(c, wx - 2, wy - 2, ww + 4, wh + 2, TRAVY, 1)
        c.rect(wx, wy, ww, wh, steel[3])
        c.rect(wx, wy, ww, 1, steel[1])
        lights = max(2, round(ww / 12))
        fan = 6
        gx0 = wx + 2
        for j in range(lights):
            lx = wx + 2 + round((ww - 4) * j / lights)
            lw = round((ww - 4) * (j + 1) / lights) - round((ww - 4) * j / lights) - 2
            op.glass(c, lx, wy + 2, lw, fan - 2)
            op.glass(c, lx, wy + fan + 1, lw, wh - fan - 3)
        c.rect(wx, wy + fan - 1, ww, 2, steel[2])
        c.rect(wx, wy + fan - 1, ww, 1, steel[1])
        state = h2(k, i, self.seed)
        if state < 0.7:
            net(c, gx0, wy + fan + 1, ww - 4, wh - fan - 3, cur, 0.4 + 0.5 * h2(k, i, self.seed + 3), state < 0.35)
        for j in range(1, lights):
            lx = wx + 2 + round((ww - 4) * j / lights)
            c.rect(lx - 2, wy, 2, wh, steel[3])
            c.rect(lx - 2, wy, 1, wh, steel[2])
        op.reveal(c, wx + 2, wy + 2, ww - 4, wh - 4, 2)
        self.panes.append((wx + 2, wy + fan + 1, ww - 4, wh - fan - 3, 'warm', h2(k, i, self.seed + 1) < 0.6))
        if balcony:
            bx, bw = a + 3, b_ - a - 6
            c.rect(bx, b - 6, bw, 4, CONCRETE[1])
            c.rect(bx, b - 6, bw, 1, CONCRETE[0])
            c.rect(bx, b - 3, bw, 1, CONCRETE[4])
            op.cast(c, bx, b - 2, bw, 3, 0.62)
            ry = b - 19
            c.rect(bx, ry, bw, 2, steel[1])
            c.rect(bx, ry + 2, bw, 1, steel[4])
            for xx in range(bx, bx + bw, 4):
                c.rect(xx, ry + 2, 1, 11, steel[2])
            for xx in range(bx + 2, bx + bw - 1, 4):
                c.rect(xx - 1, ry + 6, 3, 1, steel[2])
                c.p(xx, ry + 5, steel[2])
                c.p(xx, ry + 7, steel[2])
            c.rect(bx, ry + 12, bw, 1, steel[3])
            c.rect(bx, ry, 1, 13, steel[1])
            c.rect(bx + bw - 1, ry, 1, 13, steel[3])
        else:
            c.rect(wx - 3, sill, ww + 6, 3, TRAVY[1])
            c.rect(wx - 3, sill, ww + 6, 1, TRAVY[0])
            c.rect(wx - 3, sill + 2, ww + 6, 1, TRAVY[4])
            op.cast(c, wx - 2, sill + 3, ww + 5, 2, 0.7)
            if brick:
                lozenge(c, wx + 2, sill + 4, ww - 4, b - sill - 8, YBRICK)

    def tehran_stair(self):
        """The stair's tall window of glass blocks, one to a landing."""
        c = self.c
        x = self.x0 + 6
        t0 = self.floor(0)[0]
        for i in range(1, self.floors):
            t, b = self.floor(i)
            gy, gh = t + 10, b - t - 20
            raised(c, x - 2, gy - 2, 18, gh + 4, TRAVY, 1)
            for yy in range(gy, gy + gh):
                for xx in range(x, x + 14):
                    u, v = (xx - x) % 5, (yy - gy) % 5
                    c.p(xx, yy, GLASS[2] if u == 4 or v == 4 else GLASS[1] if u + v < 2 else GLASS[3] if u + v > 5 else SKY[2])
            self.panes.append((x, gy, 14, gh, 'dim', True))

    def tehran_ground(self):
        c, s = self.c, self.s
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        t0 = self.floor(0)[0]
        c.rect(x0, t0, W, base - t0, TRAVY[2])
        c.rect(x0, t0, W, 3, TRAVY[1])
        c.rect(x0, t0, W, 1, TRAVY[0])
        for k, (a, b_) in enumerate(self.bays):
            sx, sw = a + 4, b_ - a - 8
            if not self.stair and k == 0:
                self.tehran_door(self.door_x)
                sx, sw = a + 30, b_ - a - 34
                if sw < 20:
                    continue
            self.sign(sx, t0 + 5, sw, 15, 'board')
            sy = t0 + 23
            c.rect(sx - 1, sy - 1, sw + 2, base - sy + 1, TRAVY[4])
            up = [0.85, 0.85, 0.35, 0.0][(k + self.seed) % 4]
            open_h = round((base - sy - 5) * up)
            if open_h:
                interior(c, sx, sy + 5, sw, open_h, TEHRAN_SHOPS[(k + self.seed + s.get('shift', 0)) % 5], self.seed + k)
                self.panes.append((sx, sy + 5, sw, open_h, 'shop', True))
            roller(c, sx, sy, sw, base - sy, s['shutter'], up)
        if self.stair:
            self.tehran_door(self.door_x)
        for a in [x0] + [a for a, _ in self.bays[1:]] + [x1 - 4]:
            px0 = min(x1 - 5, max(x0, a - 2))
            raised(c, px0, t0 + 3, 5, base - t0 - 3, TRAVY, 1)

    def tehran_door(self, cx):
        c = self.c
        base = self.base
        dx = cx - 10
        c.rect(dx - 3, base - 49, 26, 49, TRAVY[1])
        c.rect(dx - 3, base - 49, 26, 1, TRAVY[0])
        c.rect(dx - 3, base - 49, 1, 49, TRAVY[0])
        c.rect(dx, base - 44, 20, 44, INK[3])
        op.glass(c, dx + 1, base - 43, 18, 30)
        wrought(c, dx, base - 44, 20, 32, INK)
        c.rect(dx, base - 12, 20, 12, INK[3])
        c.rect(dx + 1, base - 11, 18, 1, INK[2])
        c.rect(dx + 15, base - 22, 2, 2, GOLD[1])
        # the street number on its blue enamel plate
        c.rect(dx + 23, base - 36, 7, 5, COBALT[2])
        c.rect(dx + 23, base - 36, 7, 1, COBALT[1])
        c.rect(dx + 25, base - 34, 3, 1, WHITE[0])
        self.panes.append((dx + 1, base - 43, 18, 30, 'dim', True))
        self.lamp(cx, base - 52)

    def tehran_roof(self):
        c, s = self.c, self.s
        x0, x1, W, top = self.x0, self.x1, self.W, self.top
        y0 = self.deck(None, ISOGAM, CONCRETE, y=top - 2, furnish=False)
        D = top - 2 - y0
        # a cooler for each flat on a floor, by the parapet over its windows
        n = max(1, min(3, W // 56))
        for k in range(n):
            cx = x0 + 10 + round((W - 44) * k / max(1, n - 1)) if n > 1 else x0 + W // 2 - 12
            by = top - 6 - (k % 2) * 6
            cooler(self, cx, by)
        if W >= 96:
            bx = x1 - 34
            from_back = y0 + 6 + min(14, D // 3)
            bulkhead(c, bx, from_back + 16, 24, 14, 7, CONCRETE)
        aerial(c, x0 + W // 3 + 6, y0 + 18, 30)
        if W >= 128:
            vent(c, x0 + 2 * W // 3, y0 + 20, 6)


# ------------------------------------------------------------------ New Delhi

def grille(c, x, y, w, h, r):
    """A mild-steel window grille: a frame, uprights, and a band of diamonds."""
    c.rect(x, y, w, 1, r[2])
    c.rect(x, y + h - 1, w, 1, r[3])
    c.rect(x, y, 1, h, r[2])
    c.rect(x + w - 1, y, 1, h, r[3])
    for xx in range(x + 3, x + w - 2, 4):
        c.rect(xx, y + 1, 1, h - 2, r[2])
    my = y + h // 2
    for xx in range(x + 1, x + w - 1):
        d = (xx - x) % 4
        c.p(xx, my - min(d, 4 - d), r[2])
        c.p(xx, my + min(d, 4 - d), r[3])


def chhajja(c, x, y, w, r, d=5):
    """A concrete sunshade over a window: its sloping top seen from above,
    its thin front edge, and the deep shadow it throws on the wall."""
    for i in range(d):
        c.rect(x + (d - i) // 3, y + i, w - 2 * ((d - i) // 3), 1, r[1] if i < d - 2 else r[2])
    c.rect(x, y + d, w, 2, r[3])
    c.rect(x, y + d + 1, w, 1, r[4])
    op.cast(c, x + 1, y + d + 2, w - 2, 5, 0.5)


def jali(c, x, y, w, h, r, sky=True):
    """A parapet or balcony front of brick jali: a lit coping, then bricks
    laid with gaps the light comes through."""
    c.rect(x, y, w, h, r[2])
    for yy in range(y + 3, y + h - 1):
        row = (yy - y - 3) // 3
        for xx in range(x + 1, x + w - 1):
            u = (xx - x + (row % 2) * 3) % 6
            if (yy - y - 3) % 3 == 2:
                c.p(xx, yy, r[3])
            elif u >= 4:
                if sky:
                    c.px[xx, yy] = (0, 0, 0, 0)
                else:
                    c.p(xx, yy, r[5])
            elif u == 0:
                c.p(xx, yy, r[1])
    c.rect(x - 1, y, w + 2, 3, r[1])
    c.rect(x - 1, y, w + 2, 1, r[0])
    c.rect(x - 1, y + 2, w + 2, 1, r[3])
    c.rect(x, y + h - 1, w, 1, r[3])


def charpai(c, x, by, r=None):
    """A string cot carried up to sleep on the roof: its frame and woven
    jute seen from above, on four short legs."""
    r = r or WOOD_
    w, d = 26, 11
    for px in (x + 1, x + w - 3):
        c.rect(px, by - 4, 2, 4, r[4])
    c.rect(x, by - 4 - d, w, d, r[2])
    c.rect(x, by - 4 - d, w, 1, r[1])
    c.rect(x, by - 5, w, 1, r[4])
    for yy in range(by - 3 - d, by - 5):
        for xx in range(x + 2, x + w - 2):
            c.p(xx, yy, JUTE[1] if (xx + yy) % 3 == 0 else JUTE[2] if (xx - yy) % 3 == 0 else JUTE[3])
    op.cast(c, x + 1, by, w, 2, 0.68)


DELHI_GOODS = ['counter', 'shelves', 'racks', 'books', 'shelves', 'counter']


class Delhi(Block):
    """A Delhi market building of 1965-1990, Karol Bagh or Lajpat Nagar:
    painted plaster in strong colour, a concrete chhajja over every window,
    steel windows behind grilles with half their shutters closed, balconies
    behind brick jali, the whole streaked black by the monsoon. Shops under
    painted boards and rolling shutters; wires slung across. On the roof,
    behind the jali parapet, a barsati with its own chhajja, a black tank on
    a brick stand, an aerial and a string cot for the hot nights."""
    FLOORS = dict(row=3, tall=4, shop=2, cottage=2, hut=3, stall=1, hall=3, wide=3)
    H0, H1, PARA, HEAD = 62, 48, 14, 42

    def plan(self):
        n = max(1, round(self.W / 48))
        self.bays = [(self.x0 + round(self.W * k / n), self.x0 + round(self.W * (k + 1) / n)) for k in range(n)]
        a, b_ = self.bays[-1] if len(self.bays) > 1 else self.bays[0]
        self.door_x = b_ - 14 if len(self.bays) > 1 else (a + b_) // 2
        self.door_size = (18, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall = s['wall']
        t0 = self.floor(0)[0]
        stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for k, (a, b_) in enumerate(self.bays):
                self.delhi_bay(a, b_, b, i, k)
            # a plaster band at each floor, painted a shade darker
            c.rect(x0, b - 3, W, 3, wall[3])
            c.rect(x0, b - 3, W, 1, wall[1])
        self.monsoon()
        jali(c, x0, top, W, self.para, CONCRETE if s.get('jali') == 'concrete' else wall)
        op.cast(c, x0, top + self.para, W, 2, 0.72)
        self.delhi_wires()
        self.delhi_ground()
        self.delhi_roof()
        self.foot()

    def delhi_bay(self, a, b_, b, i, k):
        c, s = self.c, self.s
        sh, gr = s['shutter'], s['grille']
        cx = (a + b_) // 2
        balcony = (k + i + self.seed) % 3 == 1 and b_ - a >= 40
        ww, wh = min(24, b_ - a - 16), 26
        sill = b - 10 if not balcony else b - 6
        wx, wy = cx - ww // 2, sill - wh
        c.rect(wx - 1, wy - 1, ww + 2, wh + 2, s['wall'][4])
        c.rect(wx, wy, ww, wh, ROOM[6])
        op.glass(c, wx + 1, wy + 1, ww - 2, wh - 2)
        c.rect(cx, wy, 1, wh, INK[3])
        # one leaf of painted wooden shutters closed, panelled
        state = h2(k, i, self.seed)
        lw = ww // 2
        lx = wx if state < 0.5 else cx + 1
        if state < 0.8:
            c.rect(lx, wy, lw, wh, sh[2])
            c.rect(lx, wy, lw, 1, sh[1])
            for py in (wy + 2, wy + wh // 2 + 1):
                c.rect(lx + 2, py, lw - 4, wh // 2 - 4, sh[3])
                c.rect(lx + 2, py, lw - 4, 1, sh[4])
                c.rect(lx + 2, py + wh // 2 - 5, lw - 4, 1, sh[1])
        op.reveal(c, wx, wy, ww, wh, 2)
        grille(c, wx - 1, wy, ww + 2, wh, gr)
        self.panes.append((wx + 1, wy + 1, ww - 2, wh - 2, 'cool' if (k + i) % 2 else 'warm',
                           h2(k, i, self.seed + 5) < 0.6))
        chhajja(c, wx - 6, wy - 9, ww + 12, CONCRETE)
        if balcony:
            bx, bw = a + 4, b_ - a - 8
            c.rect(bx - 1, b - 6, bw + 2, 4, CONCRETE[1])
            c.rect(bx - 1, b - 6, bw + 2, 1, CONCRETE[0])
            c.rect(bx - 1, b - 3, bw + 2, 1, CONCRETE[4])
            jali(c, bx, b - 18, bw, 12, s['wall'], sky=False)
            op.cast(c, bx, b - 2, bw, 3, 0.62)
        else:
            c.rect(wx - 2, sill, ww + 4, 2, CONCRETE[1])
            c.rect(wx - 2, sill + 2, ww + 4, 1, CONCRETE[4])
            op.cast(c, wx - 1, sill + 3, ww + 2, 2, 0.72)
            if (k + i + self.seed) % 4 == 2 and i < self.floors - 1:
                unit(c, wx + ww + 3, sill + 7, 12, 9, 3, DOVE, louvres=True)

    def monsoon(self):
        """Black streaks run down from the ends of every chhajja and sill."""
        c, wall = self.c, self.s['wall']
        for x, y, w, h, *_ in self.panes:
            for sx in range(x - 6, x + w + 6):
                if h2(sx, y, self.seed + 4) < 0.16:
                    L = 6 + int(h2(sx, y, 7) * 22)
                    for yy in range(y - 2, y - 2 + L):
                        if x - 2 <= sx < x + w + 2 and yy >= y - 1:
                            continue
                        q = c.g(sx, yy)
                        if q in wall and h2(sx, yy, 3) < 1 - (yy - y) / (L * 1.4):
                            c.p(sx, yy, wall[min(7, wall.index(q) + 2)])

    def delhi_wires(self):
        c, x0, x1, W = self.c, self.x0, self.x1, self.W
        if self.floors < 2:
            return
        for j in range(3):
            y0 = self.floor(1)[1] - 4 + j * 3
            sag = 5 + j * 2
            for xx in range(x0 - 8, x1 + 8):
                u = (xx - (x0 + x1) / 2) / (W / 2 + 8)
                c.p(xx, y0 + round(sag * (1 - u * u)), INK[3] if j != 1 else INK[2])

    def delhi_ground(self):
        c, s = self.c, self.s
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        wall = s['wall']
        t0 = self.floor(0)[0]
        c.rect(x0, t0, W, base - t0, wall[3])
        c.rect(x0, t0, W, 2, wall[1])
        for k, (a, b_) in enumerate(self.bays):
            door = len(self.bays) > 1 and k == len(self.bays) - 1
            sx, sw = a + 3, b_ - a - 6 - (24 if door else 0)
            self.sign(sx, t0 + 3, sw, 17, 'board')
            chhajja(c, sx - 1, t0 + 20, sw + 2, CONCRETE, 3)
            sy = t0 + 26
            up = [0.9, 0.9, 0.5, 0.0][(k + self.seed) % 4]
            open_h = round((base - sy - 7) * up)
            c.rect(sx, sy, sw, base - sy, ROOM[6])
            if open_h:
                interior(c, sx, sy + 5, sw, open_h, DELHI_GOODS[(k * 2 + self.seed + s.get('shift', 0)) % 6],
                         self.seed + k)
                self.panes.append((sx, sy + 5, sw, open_h, 'cool', True))
            roller(c, sx, sy, sw, base - sy - 4, ALU, up)
            # the step up into the shop, swept and worn
            c.rect(sx - 2, base - 4, sw + 4, 4, CONCRETE[2])
            c.rect(sx - 2, base - 4, sw + 4, 1, CONCRETE[1])
            c.rect(sx - 2, base - 1, sw + 4, 1, CONCRETE[4])
        if len(self.bays) > 1:
            dx = self.door_x - 9
            c.rect(dx - 2, base - 47, 22, 47, wall[4])
            # the stair straight up from the street, its treads in stone
            c.rect(dx, base - 44, 18, 44, wall[5])
            c.rect(dx, base - 44, 3, 44, wall[6])
            for j in range(9):
                sy_ = base - 4 - j * 5
                if sy_ < base - 44:
                    break
                c.rect(dx + 3, sy_, 15, 2, CONCRETE[2] if j < 5 else CONCRETE[3])
                c.rect(dx + 3, sy_ + 2, 15, 3, wall[4] if j < 5 else wall[5])
            op.reveal(c, dx, base - 44, 18, 44, 2)
            c.rect(dx - 2, base - 47, 22, 2, CONCRETE[1])
            self.lamp(self.door_x, base - 50, 'cool')

    def delhi_roof(self):
        """Behind the jali: the barsati, the tank on its brick stand, the
        aerial, a cot and the wash."""
        c, s = self.c, self.s
        x0, x1, W, top = self.x0, self.x1, self.W, self.top
        y0 = self.deck(None, CONCRETE, CONCRETE, y=top, furnish=False)
        D = top - y0
        # the barsati: a room on the roof, its own chhajja and door
        hx, hw = x0 + 6, min(48, W // 2 - 8)
        hb = y0 + min(D - 8, 30)
        hh = 26
        stucco(c, hx, hb - hh, hw, hh, s['hut'], 2, self.seed + 3)
        c.rect(hx, hb - hh, 1, hh, s['hut'][1])
        c.rect(hx + hw - 1, hb - hh, 1, hh, s['hut'][4])
        c.rect(hx - 2, hb - hh - 8, hw + 4, 8, CONCRETE[1])
        c.rect(hx - 2, hb - hh - 8, hw + 4, 1, CONCRETE[0])
        c.rect(hx - 2, hb - hh - 1, hw + 4, 1, CONCRETE[3])
        c.rect(hx + 4, hb - 20, 10, 20, s['door'][2])
        c.rect(hx + 4, hb - 20, 10, 1, s['door'][1])
        c.rect(hx + 9, hb - 20, 1, 20, s['door'][4])
        op.reveal(c, hx + 4, hb - 20, 10, 20, 1)
        if hw >= 32:
            wx = hx + 20
            c.rect(wx, hb - 18, 12, 10, ROOM[6])
            op.glass(c, wx + 1, hb - 17, 10, 8)
            grille(c, wx, hb - 18, 12, 10, s['grille'])
            self.panes.append((wx + 1, hb - 17, 10, 8, 'warm', True))
        chhajja(c, hx - 3, hb - 24, 20, CONCRETE, 3)
        cast_right(c, hx + hw, hb - hh - 6, hh + 6, 3, 0.66)
        op.cast(c, hx, hb, hw + 3, 2, 0.7)
        # the tank on its stand
        tx = x1 - 26
        tb = y0 + min(D - 10, 22)
        c.rect(tx - 1, tb - 6, 20, 6, BRICK[3])
        c.rect(tx - 1, tb - 6, 20, 1, BRICK[1])
        for xx in range(tx + 3, tx + 18, 5):
            c.rect(xx, tb - 5, 1, 5, BRICK[4])
        sintex = s.get('sintex', True)
        cylinder(c, tx + 1, tb - 6, 16, 16, INK if sintex else CONCRETE, lid=(INK if sintex else CONCRETE)[2])
        if sintex:
            for yy in range(tb - 21, tb - 6, 4):
                c.rect(tx + 1, yy, 16, 1, INK[4])
        cast_right(c, tx + 19, tb - 22, 22, 3, 0.66)
        # pipe down from the tank into the house
        c.rect(tx + 17, tb - 8, 6, 1, DOVE[3])
        c.rect(tx + 22, tb - 8, 1, top - tb + 8, DOVE[3])
        aerial(c, hx + hw // 2, hb - hh - 8, 28)
        if W >= 128:
            charpai(c, hx + hw + 10, top - 6)
        if W >= 112:
            mx0, mx1 = hx + hw + 6, tx - 8
            if mx1 - mx0 >= 26:
                for px in (mx0, mx1):
                    c.rect(px, y0 + 14 - 16, 1, 16, DOVE[3])
                c.rect(mx0, y0 - 2, mx1 - mx0, 1, DOVE[4])
                for wx in range(mx0 + 2, mx1 - 20, 22):
                    self.overlays.append(['wash', wx, y0 - 2])


# ------------------------------------------------------------------ Cape Town

LACE = ['011110', '100001', '101101', '101101', '100001', '011110']


def lace(c, x, y, w, h, r):
    """Cast-iron broekie lace: rings in a frame."""
    c.rect(x, y, w, 1, r[1])
    c.rect(x, y + h - 1, w, 1, r[3])
    for yy in range(y + 1, y + h - 1):
        for xx in range(x, x + w):
            if LACE[(yy - y - 1) % 6][(xx - x) % 6] == '1':
                c.p(xx, yy, r[2] if (xx - x) % 6 < 3 else r[3])


class Veranda(Block):
    """A Long Street building in Cape Town, 1890-1910: painted plaster with
    quoins, a parapet with a pediment and ball finials, French doors behind
    louvred shutters, and a two-storey cast-iron veranda over the pavement,
    its bullnose roof in corrugated iron and its friezes in broekie lace."""
    FLOORS = dict(row=2, tall=3, shop=2, cottage=1, hut=1, stall=1, hall=2)
    H0, H1, PARA, HEAD = 62, 52, 22, 26

    def plan(self):
        self.door_x = self.x0 + self.W // 2
        self.door_size = (22, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, iron, tin = s['wall'], s['iron'], s['tin']
        mid = (x0 + x1) // 2
        stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        for qx in (x0, x1 - 7):
            for k, yy in enumerate(range(top + 8, base - 4, 9)):
                raised(c, qx + (0 if qx == x0 or k % 2 else 2), yy, 7 if k % 2 == 0 else 5, 8, WHITE, 1)
        # parapet, pediment, finials
        cy = top + self.para - 8
        c.rect(x0 - 3, cy, W + 6, 3, WHITE[1])
        c.rect(x0 - 3, cy, W + 6, 1, WHITE[0])
        c.rect(x0 - 2, cy + 3, W + 4, 2, WHITE[3])
        op.cast(c, x0, cy + 5, W, 3, 0.7)
        c.rect(x0, top, W, 2, WHITE[1])
        pw = min(W - 30, 56)
        for i in range(pw):
            tt = (i - pw / 2 + 0.5) / (pw / 2)
            lift = round(9 * math.sqrt(max(0.0, 1 - tt * tt)))
            c.rect(mid - pw // 2 + i, top - lift, 1, lift + 1, wall[2])
            c.rect(mid - pw // 2 + i, top - lift - 1, 1, 2, WHITE[1])
        if self.floors > 1 and W >= 96:
            year = str(1889 + int(h2(self.seed, 1, 3) * 22))
            c.rect(mid - 10, top - 1, 20, 7, WHITE[1])
            text(c, mid - text_w(year) // 2, top, year, wall[4])
        for fx in (x0 + 1, x1 - 6):
            c.rect(fx, top - 2, 5, 2, WHITE[2])
            for j, w_ in enumerate((2, 4, 4, 2)):
                c.rect(fx + 2 - w_ // 2 + 1, top - 7 + j, w_, 1, WHITE[1 if j < 2 else 2])
        # upper floors: French doors between shutters
        n = max(1, round(W / 44))
        cols = [x0 + round(W * (k + 0.5) / n) for k in range(n)]
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for cx in cols:
                dx0, dy0, dw, dh = cx - 8, b - 40, 16, 38
                raised(c, dx0 - 2, dy0 - 5, dw + 4, 4, WHITE, 1)
                c.rect(dx0, dy0, dw, dh, WHITE[2])
                for gy in range(dy0 + 2, dy0 + dh - 10, 9):
                    op.glass(c, dx0 + 2, gy, 5, 8)
                    op.glass(c, dx0 + 9, gy, 5, 8)
                c.rect(dx0 + 2, dy0 + dh - 9, 12, 7, WHITE[3])
                self.panes.append((dx0 + 2, dy0 + 2, 12, dh - 12, 'warm', h2(cx, i, self.seed) < 0.6))
                for sx in (dx0 - 9, dx0 + dw):
                    c.rect(sx, dy0, 9, dh, s['shutter'][2])
                    c.rect(sx, dy0, 9, 1, s['shutter'][1])
                    for yy in range(dy0 + 2, dy0 + dh - 1, 2):
                        c.rect(sx + 1, yy, 7, 1, s['shutter'][3])
        # the shop
        t0 = self.floor(0)[0]
        fy0 = t0 + (12 if self.floors > 1 else 4)
        self.sign(x0 + 5, fy0, W - 10, 14, 'board')
        t0 = fy0 - 3
        dx = self.door_x
        for lx, rx in ((x0 + 6, dx - 13), (dx + 13, x1 - 6)):
            if rx - lx >= 16:
                shopfront(self, lx, t0 + 18, rx - lx, base - t0 - 18, s['shopframe'], s['shopframe'], s['goods'],
                          transom=6, pitch=18)
        glass_door(self, dx, base, 22, base - t0 - 22, s['shopframe'])
        c.rect(dx - 11, t0 + 18, 22, 4, s['shopframe'][3])
        # the veranda
        posts = [x0 - 1] + [x0 + round(W * k / max(1, round(W / 52))) for k in range(1, max(1, round(W / 52)))] + [x1 - 2]
        posts = [p for p in posts if abs(p - dx) > 14 or p in (x0 - 1, x1 - 2)]
        roof_y = self.floor(self.floors - 1)[0] + 6 if self.floors > 1 else base - 60
        for xx in range(x0 - 4, x1 + 4):
            for yy in range(roof_y - 11, roof_y):
                k = yy - (roof_y - 11)
                col = tin[1] if (xx - x0) % 3 == 0 else tin[2]
                if k >= 8:
                    col = tin[3] if (xx - x0) % 3 else tin[2]
                c.p(xx, yy, col)
        c.rect(x0 - 4, roof_y - 11, W + 8, 1, tin[0])
        c.rect(x0 - 4, roof_y, W + 8, 1, iron[4])
        op.cast(c, x0, roof_y + 1, W, 14, 0.56)
        for a, b_ in zip(posts, posts[1:]):
            lace(c, a + 2, roof_y + 1, b_ - a - 2, 7, iron)
        if self.floors > 1:
            fy = self.floor(1)[1]
            c.rect(x0 - 4, fy - 4, W + 8, 4, PINE[2])
            c.rect(x0 - 4, fy - 4, W + 8, 1, PINE[1])
            c.rect(x0 - 4, fy, W + 8, 2, iron[2])
            op.cast(c, x0, fy + 9, W, 8, 0.58)
            for a, b_ in zip(posts, posts[1:]):
                lace(c, a + 2, fy + 2, b_ - a - 2, 7, iron)
                lace(c, a + 2, fy - 17, b_ - a - 2, 13, iron)
            c.rect(x0 - 4, fy - 18, W + 8, 2, iron[1])
        for p in posts:
            c.rect(p, roof_y + 1, 3, base - roof_y - 1, iron[2])
            c.rect(p, roof_y + 1, 1, base - roof_y - 1, iron[1])
            c.rect(p + 2, roof_y + 1, 1, base - roof_y - 1, iron[4])
            c.rect(p - 1, base - 3, 5, 3, iron[3])
        self.deck(None, IRONROOF['red'], WHITE, y=top - 1, inset=2)
        self.lamp(dx, t0 + 18)
        self.foot()


BOLD = [HOTPINK, LIME, TURQ, SAFFRON, VIOLET, TANGERINE, AZURE]
DOORS = [JADE, PINE, COBALT, CRIMSON]


class BoKaap(Block):
    """Houses in the Bo-Kaap, Cape Town: flat roofs behind moulded parapets,
    each house painted its own bright colour, white sashes and fanlights, and
    a red stoep along the street with a seat at either end."""
    FLOORS = dict(row=1, tall=2, shop=1, cottage=1, hut=1, stall=1, hall=2)
    H0, H1, PARA, HEAD = 62, 48, 16, 22

    def plan(self):
        n = max(1, round(self.W / 72))
        self.houses = [(self.x0 + round(self.W * k / n), self.x0 + round(self.W * (k + 1) / n)) for k in range(n)]
        a, b_ = self.houses[0]
        self.door_x, self.door_size = (a + b_) // 2, (18, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        pt = top + 6
        self.deck(None, IRONROOF['red'], WHITE, y=pt)
        rd = self.roof_depth
        for a, _ in self.houses[1:]:
            c.rect(a - 1, pt - rd, 4, rd, WHITE[2])
            c.rect(a - 1, pt - rd, 1, rd, WHITE[0])
            cast_right(c, a + 3, pt - rd + 8, rd - 10, 2, 0.7)
        for k, (a, b_) in enumerate(self.houses):
            col = BOLD[(self.seed * 5 + k * 3 + s.get('shift', 0)) % len(BOLD)]
            hw, cx = b_ - a, (a + b_) // 2
            stucco(c, a, pt, hw, base - pt, col, 2, self.seed + k)
            shape = (self.seed + k + s.get('shift', 0)) % 3
            if shape == 1:
                gw = hw // 2
                for i in range(gw):
                    tt = (i - gw / 2 + 0.5) / (gw / 2)
                    lift = round(7 * math.sqrt(max(0.0, 1 - tt * tt)))
                    c.rect(cx - gw // 2 + i, pt - lift, 1, lift, col[2])
                    c.rect(cx - gw // 2 + i, pt - lift - 1, 1, 2, WHITE[1])
            elif shape == 2:
                gw = hw * 2 // 5
                c.rect(cx - gw // 2, pt - 5, gw, 5, col[2])
                c.rect(cx - gw // 2 - 1, pt - 6, gw + 2, 2, WHITE[1])
                for fx in (a + 2, b_ - 6):
                    c.rect(fx, pt - 5, 4, 4, WHITE[2])
                    c.rect(fx, pt - 5, 3, 1, WHITE[0])
                    c.p(fx + 3, pt - 2, WHITE[4])
            c.rect(a, pt, hw, 2, WHITE[1])
            c.rect(a, pt, hw, 1, WHITE[0])
            c.rect(a, pt + 8, hw, 2, WHITE[1])
            c.rect(a, pt + 10, hw, 1, WHITE[3])
            op.cast(c, a, pt + 11, hw, 2, 0.74)
            raised(c, a, pt + 2, 3, base - pt - 12, WHITE, 1)
            if k == len(self.houses) - 1:
                raised(c, b_ - 3, pt + 2, 3, base - pt - 12, WHITE, 1)
            door = DOORS[(k + self.seed) % len(DOORS)]
            for i in range(self.floors):
                t, b = self.floor(i)
                sill = b - (14 if i == 0 else 8)
                wxs = [a + hw // 4 - 1, b_ - hw // 4 + 1] if hw >= 64 else [a + hw // 4]
                if i > 0:
                    wxs = [a + hw // 4 - 1, cx, b_ - hw // 4 + 1] if hw >= 80 else wxs + [cx]
                for wx in wxs:
                    x, y = wx - 8, sill - 30
                    raised(c, x - 2, y - 3, 20, 3, WHITE, 1)
                    c.rect(x, y, 16, 30, WHITE[2])
                    for py in range(y + 2, y + 28, 7):
                        for px0 in (x + 2, x + 7, x + 12):
                            op.glass(c, px0, py, 3 if px0 == x + 12 else 4, 5)
                    c.rect(x + 1, y + 14, 14, 2, WHITE[1])
                    raised(c, x - 2, sill, 20, 2, WHITE, 1)
                    self.panes.append((x + 2, y + 2, 12, 26, 'warm', h2(wx, i, self.seed) < 0.6))
                if i == 0:
                    dx, dy = cx, base - 50
                    for j in range(19):
                        tt = (j - 9) / 9.5
                        lift = round(9 * math.sqrt(max(0.0, 1 - tt * tt)))
                        c.rect(dx - 9 + j, dy - lift, 1, lift, GLASS[3])
                        c.p(dx - 9 + j, dy - lift - 1, WHITE[1])
                    for a2 in range(5):
                        ang = math.pi * (a2 + 1) / 6
                        for r_ in range(9):
                            c.p(dx - round(r_ * math.cos(ang)), dy - round(r_ * math.sin(ang)), WHITE[1])
                    self.panes.append((dx - 8, dy - 8, 17, 8, 'warm', True))
                    c.rect(dx - 9, dy, 18, base - 6 - dy, door[3])
                    c.rect(dx - 9, dy, 18, 1, door[1])
                    c.rect(dx, dy, 1, base - 6 - dy, door[4])
                    for py in (dy + 3, dy + 22):
                        for px0 in (dx - 7, dx + 2):
                            raised(c, px0, py, 6, 16, door, 3)
                    c.rect(dx + 3, dy + 20, 2, 2, GOLD[1])
                    op.reveal(c, dx - 9, dy, 18, base - 6 - dy, 2)
                    self.lamp(dx + 12, dy - 2)
        # the stoep
        c.rect(x0 - 2, base - 10, W + 4, 4, STOEP[1])
        c.rect(x0 - 2, base - 10, W + 4, 1, STOEP[0])
        c.rect(x0 - 2, base - 6, W + 4, 6, STOEP[3])
        c.rect(x0 - 2, base - 6, W + 4, 1, STOEP[2])
        for k, (a, b_) in enumerate(self.houses):
            cx = (a + b_) // 2
            for j in range(2):
                c.rect(cx - 10, base - 4 + j * 2, 20, 1, STOEP[1])
            for sx in (a + 2, b_ - 12):
                if b_ - a >= 64:
                    c.rect(sx, base - 16, 10, 4, WHITE[1])
                    c.rect(sx, base - 16, 10, 1, WHITE[0])
                    c.rect(sx, base - 12, 10, 6, WHITE[3])
        self.foot(STOEP)


# ------------------------------------------------------------------ looks

LOOKS = {
    'falsefront': (FalseFront, 'False-front store', [
        dict(kind='clap', wall=WHITE, trim=OXBLOOD, board=CREAM, ink=OXBLOOD, sash=WHITE, door=OXBLOOD,
             word='MERCANTILE', short='GOODS', goods='shelves', neon=('BEER', 'red')),
        dict(kind='clap', wall=OXBLOOD, trim=CREAM, board=INK, ink=YELLOW, sash=CREAM, door=SAGE,
             word='SADDLERY', short='TACK', goods='racks', crown='square'),
        dict(kind='brick', wall=BRICK, trim=SAGE, board=MUSTARD, ink=INK, sash=CREAM, door=SAGE,
             word='HARDWARE', short='HDWE', goods='shelves', neon=('OPEN', 'blue')),
    ]),
    'brick': (BrickBlock, 'Brick commercial block', [
        dict(wall=BRICK, iron=SAGE, sash=CREAM, face=INK, face_ink=GOLD, words=['DRUGS', 'JEWELRY', 'CAFE'],
             goods=['shelves', 'counter'], awning=(GREEN, WHITE), prism=True, ac=True,
             blade=('HOTEL', 'red'), blade_box=OXBLOOD),
        dict(wall=BUFF, iron=OXBLOOD, sash=WHITE, face=WHITE, face_ink=RED, words=['WESTERN WEAR', 'BOOTS', 'PAWN'],
             goods=['racks', 'shelves'], fascia='box', ghost='DRY GOODS', ac=True),
        dict(wall=CHOCOLATE, iron=INK, sash=CREAM, face=GOLD, face_ink=INK, words=['BOOKS', 'MUSIC', 'TOYS'],
             goods=['books', 'shelves'], awning=(RED, CREAM), arched=True,
             blade=('CAFE', 'blue'), blade_box=INK),
    ]),
    'diner': (Diner, 'Stainless diner', [
        dict(enamel=CREAM, ink=RED, word='DINER', booth=RED, roof=TIN, tile=TILES[2], neon='red'),
        dict(enamel=WHITE, ink=BLUE, word='STAR DINER', booth=TEAL, roof=TIN, tile=INK, neon='blue'),
        dict(enamel=BUTTER, ink=GREEN, word='DINER', booth=GREEN, roof=TIN, tile=TILES[0], neon='green'),
    ]),
    'motel': (Motel, 'Motel', [
        dict(wall=CREAM, fascia=TEAL, doors=[TEAL, SALMON, BUTTER], drapes=MUSTARD, cab=RED),
        dict(wall=WHITE, fascia=RED, doors=[RED, SKY, MINT], drapes=SKY, cab=BLUE),
        dict(wall=SALMON, fascia=CHOCOLATE, doors=[CREAM, SAGE, MUSTARD], drapes=SAGE, cab=TEAL),
    ]),
    'bank': (Bank, 'Savings bank', [
        dict(pier=TRAV, counter=PINE, names=['FIRST NATIONAL BANK', 'FIRST NATIONAL', 'BANK'], logo=TEAL),
        dict(pier=WHITE, counter=OXBLOOD, names=['FEDERAL SAVINGS AND LOAN', 'FEDERAL SAVINGS', 'SAVINGS'],
             logo=BLUE),
        dict(pier=PINKGRAN, counter=PINE, names=['STOCKMENS BANK', 'BANK'], logo=RED),
    ]),
    'strip': (Strip, 'Strip center', [
        dict(pier=BRICK, frame=BRONZE), dict(pier=BUFF, frame=ALU, shift=2), dict(pier=CHOCOLATE, frame=BRONZE, shift=5),
    ]),
    'office': (Office, 'Curtain-wall office', [
        dict(glass='blue', mullion=ALU, spandrel=TEAL, roofname='UNION'),
        dict(glass='bronze', mullion=BRONZE, spandrel=BRONZE, roofname='MUTUAL'),
        dict(glass='green', mullion=ALU, spandrel=INK, pier=PINKGRAN, pediment=True),
    ]),
    'deco': (Skyscraper, 'Setback skyscraper', [
        dict(wall=BUFF, stone=LIMESTONE, spandrel=INK, accent=GOLD, crown='step'),
        dict(wall=WHITE, stone=GRANITE, spandrel=INK, accent=STEEL, crown='spire'),
        dict(wall=BRICK, stone=LIMESTONE, spandrel=CHOCOLATE, accent=SAGE, crown='tank'),
    ]),
    'vysotka': (Vysotka, 'Stalinist high-rise', [
        dict(wall=CREAM, trim=WHITE, plinth=REDGRAN, spire=GOLD, spire_h=64),
        dict(wall=BUFF, trim=CREAM, plinth=GRANITE, spire=GOLD, spire_h=52),
        dict(wall=WHITE, trim=LIMESTONE, plinth=REDGRAN, spire=STEEL, spire_h=58),
    ]),
    'bubble': (Bubble, 'Bubble-era office tower', [
        dict(granite=PINKGRAN, glass='blue', tubes=['pink', 'blue', 'amber'], crown='gable'),
        dict(granite=DOVE, glass='green', tubes=['blue', 'green', 'pink'], crown='billboard'),
        dict(granite=TRAV, glass='sky', tubes=['amber', 'pink', 'red'], crown='mast'),
    ]),
    'slab': (Slab, 'Glass slab tower', [
        dict(glass='bronze', mullion=BRONZE, spandrel=BRONZE, column=TRAV, blind=CREAM),
        dict(glass='green', mullion=STEEL, spandrel=TEAL, column=STEEL, blind=WHITE, cradle=True),
        dict(glass='blue', mullion=ALU, spandrel=INK, column=GRANITE, blind=CREAM, mast=True),
    ]),
    'tropic': (Tropic, 'Southeast Asian glass tower', [
        dict(glass='blue', panel=WHITE, strip=TINT['green'], led='blue', crown='helipad'),
        dict(glass='green', panel=DOVE, strip=TINT['blue'], led='green', crown='spire'),
        dict(glass='sky', panel=CREAM, strip=TINT['bronze'], led='amber', crown='dome'),
    ]),
    'theatre': (Theatre, 'Picture palace', [
        dict(wall=TERRA, accent=RED, accent2=GOLD, name='STATE', neon='red', marquee=['TONIGHT', 'DOUBLE FEATURE']),
        dict(wall=CREAM, accent=TEAL, accent2=GOLD, name='LYRIC', neon='blue', marquee=['NOW SHOWING', 'AT 7 & 9']),
        dict(wall=BUFF, accent=OXBLOOD, accent2=TEAL, name='RIALTO', neon='pink', marquee=['MATINEE', 'SAT & SUN']),
    ]),
    'moderno': (Moderno, 'Mexico City moderno', [
        dict(wall=MINT, frame=WHITE, steel=INK, rail=WHITE, curtain=CREAM, tinaco=DOVE, tile=TURQ, tile2=COBALT,
             cortina=ALU),
        dict(wall=SALMON, frame=CREAM, steel=SAGE, rail=SAGE, curtain=YELLOW, tinaco=INK, tile=SAFFRON, tile2=CRIMSON,
             cortina=SKY, shift=1),
        dict(wall=BUTTER, frame=WHITE, steel=INK, rail=TEAL, curtain=SKY, tinaco=DOVE, tile=JADE, tile2=TURQ,
             cortina=ALU, shift=3),
    ]),
    'zakkyo': (Zakkyo, 'Tokyo zakkyo building', [
        dict(tile=JTILES[0], noren=COBALT, tank=CREAM, blind=SAFFRON),
        dict(tile=JTILES[2], noren=CRIMSON, tank=AZURE, shift=1, blind=TURQ),
        dict(tile=JTILES[1], noren=INK, tank=CREAM, shift=3, blind=HOTPINK),
        dict(tile=JTILES[3], noren=CRIMSON, tank=CREAM, shift=5, blind=LIME),
    ]),
    'stalinka': (Stalinka, 'Moscow stalinka', [
        dict(wall=OCHRE, trim=CREAM, roof='green', shopframe=PINE, neon=['red', 'blue']),
        dict(wall=CRIMSON, trim=CREAM, roof='grey', shopframe=INK, neon=['blue', 'red']),
        dict(wall=CREAM, trim=WHITE, roof='red', shopframe=JADE, neon=['red', 'green']),
    ]),
    'panelka': (Panelka, 'Moscow panel block', [
        dict(door=RUST), dict(door=JADE, shift=2, slogan=1), dict(door=COBALT, shift=4, slogan=2),
    ]),
    'tehran': (Tehran, 'Tehran apartment house', [
        dict(face='brick', steel=TURQ, curtain=WHITE, tile=COBALT, tile2=TURQ, shutter=JADE),
        dict(face='trav', steel=COBALT, curtain=CREAM, tile=TURQ, tile2=COBALT, shutter=COBALT, shift=1),
        dict(face='brick', steel=JADE, curtain=WHITE, tile=COBALT, tile2=SAFFRON, shutter=CRIMSON, shift=3),
    ]),
    'delhi': (Delhi, 'New Delhi market building', [
        dict(wall=HOTPINK, grille=JADE, shutter=JADE, hut=CREAM, door=COBALT),
        dict(wall=TURQ, grille=CRIMSON, shutter=SAFFRON, hut=SAFFRON, door=CRIMSON, shift=2, sintex=False),
        dict(wall=SAFFRON, grille=COBALT, shutter=COBALT, hut=WHITE, door=JADE, shift=4),
    ]),
    'veranda': (Veranda, 'Cape Town veranda building', [
        dict(wall=CRIMSON, iron=JADE, tin=TIN, shutter=JADE, sign=CREAM, sign_ink=CRIMSON, word='OUTFITTERS',
             shopframe=JADE, goods='racks'),
        dict(wall=SAFFRON, iron=WHITE, tin=IRONROOF['red'], shutter=COBALT, sign=COBALT, sign_ink=WHITE,
             word='TRADING STORE', shopframe=COBALT, goods='shelves'),
        dict(wall=AZURE, iron=INK, tin=TIN, shutter=WHITE, sign=INK, sign_ink=SAFFRON, word='CAFE', shopframe=INK,
             goods='counter'),
    ]),
    'bokaap': (BoKaap, 'Bo-Kaap houses', [dict(), dict(shift=1), dict(shift=4)]),
    'brick-mx': (BrickBlock, 'Brick block, Mexican shops', [
        dict(wall=TURQ, iron=CRIMSON, sash=WHITE, face=SAFFRON, face_ink=CRIMSON, words=['TAQUERIA', 'PANADERIA'],
             goods=['counter', 'bread'], awning=(CRIMSON, WHITE), ac=True),
        dict(wall=HOTPINK, iron=JADE, sash=CREAM, face=WHITE, face_ink=JADE, words=['CARNICERIA', 'MERCADO'],
             goods=['counter', 'shelves'], fascia='box', ghost='DRY GOODS', ac=True),
        dict(wall=SAFFRON, iron=COBALT, sash=WHITE, face=COBALT, face_ink=WHITE, words=['ZAPATERIA', 'BOTANICA'],
             goods=['racks', 'shelves'], awning=(GREEN, WHITE), blade=('BAR', 'green'), blade_box=CRIMSON),
    ]),
    'brick-cn': (BrickBlock, 'Chinatown brick block', [
        dict(wall=BRICK, iron=JADE, sash=CREAM, face=CRIMSON, face_ink=GOLD, words=['CHOP SUEY', 'NOODLES'],
             goods=['counter', 'shelves'], awning=(CRIMSON, GOLD), blade=('TEA', 'red'), blade_box=JADE),
        dict(wall=BUFF, iron=CRIMSON, sash=WHITE, face=JADE, face_ink=GOLD, words=['HERBS', 'GROCERY'],
             goods=['shelves', 'shelves'], fascia='box', ac=True),
        dict(wall=CHOCOLATE, iron=CRIMSON, sash=CREAM, face=GOLD, face_ink=CRIMSON, words=['TEA', 'LAUNDRY'],
             goods=['shelves', 'racks'], awning=(JADE, GOLD), blade=('CHOP', 'pink'), blade_box=CRIMSON),
    ]),
    'strip-mx': (Strip, 'Strip center, Mexican shops', [
        dict(pier=BRICK, frame=BRONZE, biz=STRIP_MX), dict(pier=BUFF, frame=ALU, shift=2, biz=STRIP_MX),
        dict(pier=CMU, frame=BRONZE, shift=5, biz=STRIP_MX)]),
    'strip-asia': (Strip, 'Strip center, Asian shops', [
        dict(pier=BRICK, frame=BRONZE, biz=STRIP_ASIA), dict(pier=BUFF, frame=ALU, shift=2, biz=STRIP_ASIA),
        dict(pier=CMU, frame=ALU, shift=5, biz=STRIP_ASIA)]),
}

# For the game's building models: the nearest wall in buildings.json, and what each look is.
ABOUT = {
    'falsefront': ('weatherboard', 'A frame store behind a square false front, kept on from the cattle-town years.'),
    'brick': ('bengal-brick', 'A two-part brick block: plate-glass shops below, offices or rooms above.'),
    'diner': ('concrete-frame', 'A factory-built diner in stainless steel and enamel, with a counter and booths.'),
    'motel': ('modern-stucco', 'A motel: a row of rooms, each door on the parking lot, and a pole sign by the road.'),
    'bank': ('white-plaster', 'A savings bank in stone and glass with a time-and-temperature sign.'),
    'strip': ('bengal-brick', 'A strip center: a row of small shops under one shake mansard.'),
    'deco': ('limestone', 'A setback office tower of brick piers over a limestone base, with a stepped or steel crown.'),
    'vysotka': ('limestone', 'A Stalinist high-rise in tiers of cream ceramic over red granite, under a spire and a ruby star.'),
    'bubble': ('blue-glass', 'A Tokyo office tower of tinted glass and polished granite, with tenant signs up one side.'),
    'office': ('blue-glass', 'A curtain-wall office block of glass and aluminium.'),
    'slab': ('blue-glass', 'A slab of glass on a grid of mullions, its lobby set back behind columns on a plaza.'),
    'tropic': ('blue-glass', 'A tower of reflective glass and white panels over a podium of shops, with a helipad, spire or dome on top.'),
    'theatre': ('ochre-plaster', 'A picture palace with a marquee and a lit vertical sign.'),
    'moderno': ('modern-stucco', 'A concrete apartment block over shops with roll-down shutters and painted signs.'),
    'zakkyo': ('white-plaster', 'A narrow building of small tiles with a different bar or shop on every floor.'),
    'stalinka': ('modern-stucco', 'A Soviet apartment house of the Stalin years, with shops on the ground floor.'),
    'panelka': ('concrete-frame', 'A prefabricated concrete panel block with glazed loggias.'),
    'tehran': ('ochre-plaster', 'An apartment house of yellow brick or travertine over a row of shops.'),
    'delhi': ('modern-stucco', 'A market building of painted stucco, with shops, signboards and a roof room.'),
    'veranda': ('modern-stucco', 'A shop under a two-storey veranda of cast-iron lace and a corrugated iron roof.'),
    'bokaap': ('modern-stucco', 'Flat-roofed houses painted in bright colours, with stoeps at the doors.'),
    'brick-mx': ('bengal-brick', 'A brick block painted bright, its shops run by Mexican families.'),
    'brick-cn': ('bengal-brick', 'A brick block of a Chinatown, with restaurants, grocers and herb shops.'),
    'strip-mx': ('bengal-brick', 'A strip center whose shops are run by Mexican families.'),
    'strip-asia': ('bengal-brick', 'A strip center whose shops are run by Vietnamese, Chinese, Japanese and Korean families.'),
}


def animations():
    """Four-frame loops the game turns at points the painters publish
    (`overlays`): a roof fan, a whirlybird vent, a barber's pole."""
    from PIL import Image
    out = {}
    for f in range(4):
        c = C(11, 7)
        for yy in range(7):
            for xx in range(11):
                e = ((xx - 5) / 5.5) ** 2 + ((yy - 3) / 3.5) ** 2
                if e <= 1:
                    c.p(xx, yy, ALU[4] if e > 0.6 and yy < 3 else ALU[6] if yy < 3 else ALU[5])
        for n in range(3):
            a = f * math.pi / 6 + n * 2 * math.pi / 3
            for t in (1, 2, 3, 4):
                c.p(5 + round(math.cos(a) * t), 3 + round(math.sin(a) * t * 0.62), ALU[2] if t < 4 else ALU[3])
        c.p(5, 3, ALU[1])
        out[f'animation-acfan-{f}'] = c.im
    for f in range(4):
        c = C(7, 8)
        for xx in range(7):
            band = (xx + f) % 4
            col = ALU[(1, 2, 3, 2)[band]] if xx < 5 else ALU[(3, 4, 5, 4)[band]]
            top = 2 if xx in (0, 6) else 1 if xx in (1, 5) else 0
            c.rect(xx, top, 1, 7 - top, col)
            if band == 0:
                c.rect(xx, top + 1, 1, 5 - top, ALU[4] if xx >= 5 else ALU[3])
        c.rect(0, 6, 7, 1, ALU[5])
        c.rect(3, 0, 1, 1, ALU[0])
        out[f'animation-turbine-{f}'] = c.im
    for f in range(4):
        c = C(3, 16)
        for yy in range(16):
            for i in range(3):
                u = (i + yy + f) % 4
                col = RED[2] if u == 0 else BLUE[2] if u == 2 else WHITE[1]
                c.p(i, yy, col if i < 2 else fm.mix(col, INK[4], 0.3))
        out[f'animation-barber-{f}'] = c.im
    wash = [WHITE, SKY, SALMON, BUTTER]
    for f in range(4):
        c = C(22, 12)
        for k, col in enumerate(wash):
            sway = round(math.sin(f * math.pi / 2 + k * 1.3) * 1.5)
            gx, gw, gh = 1 + k * 5, 4, 6 + (k * 3) % 4
            for yy in range(gh):
                dx = round(sway * yy / gh)
                c.rect(gx + dx, 1 + yy, gw, 1, col[1] if yy else col[0])
                c.p(gx + dx + gw - 1, 1 + yy, col[3])
            c.p(gx + 1, 0, INK[3])
        out[f'animation-wash-{f}'] = c.im
    # A podium's video screen: four advertisements, shown by day and night.
    ads = [(CRIMSON, WHITE, SAFFRON), (COBALT, WHITE, TURQ), (JADE, SAFFRON, WHITE), (HOTPINK, WHITE, AZURE)]
    for f, (bg, bar, mark) in enumerate(ads):
        c = C(48, 36)
        c.rect(0, 0, 48, 36, bg[2])
        c.rect(0, 24, 48, 12, bg[3])
        if f % 2 == 0:
            for yy in range(6, 22):
                for xx in range(28, 44):
                    if (xx - 36) ** 2 + (yy - 14) ** 2 <= 56:
                        c.p(xx, yy, mark[1] if xx + yy < 50 else mark[2])
        else:
            c.rect(30, 5, 12, 18, mark[2])
            c.rect(30, 5, 12, 2, mark[0])
            c.rect(41, 5, 1, 18, mark[4])
        c.rect(4, 6, 20, 4, bar[0])
        c.rect(4, 12, 14, 2, bar[1])
        c.rect(4, 16, 17, 2, bar[1])
        c.rect(4, 27, 10, 5, bar[0])
        c.rect(5, 28, 8, 3, bg[1])
        out[f'animation-led-{f}'] = c.im
    # Lights the game shows only after dark: an aviation beacon's slow blink,
    # and a neon tube with its light running down it.
    for f in range(4):
        im = Image.new('RGBA', (7, 7))
        k = (1.0, 0.5, 0, 0)[f]
        for yy in range(7):
            for xx in range(7):
                d = abs(xx - 3) + abs(yy - 3)
                if k and d <= 3:
                    im.putpixel((xx, yy), (255, 226, 214, 255) if d == 0 and k == 1 else
                                (255, 60, 50, round((255, 230, 120, 45)[d] * k)))
        out[f'animation-beacon-{f}'] = im
    for colour, (core, glow) in NEON.items():
        for f in range(4):
            im = Image.new('RGBA', (3, 28))
            for yy in range(28):
                if (yy // 4 - f) % 4:
                    im.putpixel((1, yy), core + (255,))
                    for xx in (0, 2):
                        im.putpixel((xx, yy), glow + (130,))
            out[f'animation-chase-{colour}-{f}'] = im
    return out


def house(look, variant=0, form='row', cells=12, seed=0):
    cls, _, colours = LOOKS[look]
    return cls(colours[variant % len(colours)], form, cells, seed)


def build(look, variant=0, form='row', cells=12, seed=0):
    return house(look, variant, form, cells, seed).build()


from art import front_family  # noqa: E402

# The street forms each look is built in; the rest would only fill the atlas.
FORMS = dict(
    falsefront='row shop tall cottage', brick='row shop wide tall hall', diner='row shop cottage',
    motel='row wide cottage hall', bank='row shop tall hall', strip='row shop wide hall',
    office='row wide tall hall', deco='row wide tall hall', vysotka='row wide tall hall', bubble='row wide tall hall', slab='row wide tall hall', tropic='row wide tall hall', theatre='row tall hall', moderno='row shop wide tall cottage hall',
    zakkyo='row shop tall cottage hut', stalinka='row wide tall hall', panelka='row wide tall hall',
    tehran='row shop wide tall hall', delhi='row shop tall cottage hut', veranda='row shop wide tall cottage',
    bokaap='row shop cottage hut')
FORMS.update({'brick-mx': FORMS['brick'], 'brick-cn': FORMS['brick'], 'strip-mx': FORMS['strip'],
              'strip-asia': FORMS['strip']})

def register():
    front_family.register('mod', {k: dict(label=L[1], about=ABOUT[k][1], wall=ABOUT[k][0], roof='flat',
                                          variants=len(L[2]), forms=set(FORMS[k].split()))
                                  for k, L in LOOKS.items()}, house)


register()


# ------------------------------------------------------------------ review

NOW = {'street-buildings': ['candidate-modern-diner', 'candidate-modern-motel', 'candidate-modern-gas-station',
                            'candidate-modern-sporting-goods', 'modern-shop-urban-row', 'modern-office-urban-row'],
       'modern-buildings': ['modern-commercial-block-0', 'modern-brickshop-0', 'modern-curtain-tower-0']}


def now():
    import json
    from PIL import Image
    out = []
    for pack, names in NOW.items():
        d = json.load(open(ROOT / f'public/packs/{pack}.json'))
        im = Image.open(ROOT / f'public/packs/{d["meta"]["image"]}').convert('RGBA')
        for n in names:
            f = d['frames'][n]['frame']
            out.append((n.replace('candidate-', '').replace('modern-', ''),
                        im.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))))
    return out


SHOW = {'falsefront': [('row', 12), ('tall', 10), ('cottage', 6)], 'brick': [('row', 12), ('tall', 10), ('shop', 7)],
        'diner': [('row', 10), ('shop', 7)], 'motel': [('hall', 17), ('cottage', 6)],
        'bank': [('row', 12), ('tall', 10)], 'strip': [('hall', 17), ('row', 8)],
        'office': [('tall', 10), ('row', 12), ('shop', 7)], 'deco': [('tall', 9), ('tall', 12)], 'vysotka': [('tall', 10), ('tall', 12)], 'bubble': [('tall', 9), ('tall', 11)], 'slab': [('tall', 9), ('tall', 12)], 'tropic': [('tall', 9), ('tall', 11)], 'theatre': [('row', 11), ('tall', 9)],
        'moderno': [('row', 12), ('tall', 10), ('shop', 7)], 'zakkyo': [('tall', 6), ('row', 7), ('hut', 4)],
        'stalinka': [('row', 12), ('tall', 10), ('shop', 7)], 'panelka': [('row', 12), ('tall', 9), ('cottage', 6)],
        'tehran': [('row', 12), ('tall', 9), ('shop', 7)], 'delhi': [('row', 12), ('tall', 8), ('cottage', 6)],
        'veranda': [('row', 10), ('tall', 9), ('cottage', 6)], 'bokaap': [('hall', 17), ('row', 9), ('tall', 5)],
        'brick-mx': [('row', 12), ('wide', 16), ('shop', 7)], 'brick-cn': [('row', 12), ('tall', 10), ('shop', 7)],
        'strip-mx': [('hall', 17), ('row', 12)], 'strip-asia': [('hall', 17), ('row', 12)]}


def sheets(out, only=None):
    from art import front_family as ff
    looks = [k for k in LOOKS if not only or k in only]
    bands, rows = [], []
    for k in looks:
        cls, label, colours = LOOKS[k]
        cells = [(f'{form} {n * 16}px', build(k, 0, form, n, 3)) for form, n in SHOW[k]]
        cells += [(f'colour {v}', build(k, v, SHOW[k][0][0], SHOW[k][0][1], 5 + v)) for v in range(1, len(colours))]
        bands.append((f'{k} · {label}', cells))
    ff.ab(out, bands, now=now(), masters=False, zoom=2)
    street(out.replace('.png', '-street.png'), looks)


def street(out, looks):
    """One American Main Street and one street each for Mexico City and Tokyo,
    by day, by night, and the night animated."""
    from art import front_family as ff
    us = [house('falsefront', 0, 'row', 8, 1), house('brick', 0, 'row', 12, 2), house('theatre', 0, 'row', 11, 3),
          house('diner', 0, 'row', 9, 4), house('bank', 0, 'row', 10, 5), house('office', 1, 'tall', 9, 6),
          house('brick', 1, 'tall', 10, 7), house('strip', 0, 'hall', 13, 8), house('motel', 0, 'row', 12, 9)]
    mx = [house('moderno', v % 3, f, n, 10 + v) for v, (f, n) in enumerate(
        [('row', 12), ('tall', 9), ('shop', 7), ('row', 10), ('tall', 12)])]
    jp = [house('zakkyo', v % 3, f, n, 20 + v) for v, (f, n) in enumerate(
        [('tall', 6), ('row', 7), ('tall', 5), ('row', 8), ('tall', 6), ('row', 6)])]
    ru = [house('stalinka', 0, 'row', 14, 30), house('panelka', 0, 'tall', 10, 31), house('stalinka', 1, 'tall', 9, 32),
          house('panelka', 1, 'row', 12, 33), house('stalinka', 2, 'row', 10, 34)]
    ir = [house('tehran', v % 3, f, n, 40 + v) for v, (f, n) in enumerate(
        [('row', 12), ('tall', 9), ('shop', 7), ('row', 10), ('tall', 12)])]
    dl = [house('delhi', v % 3, f, n, 50 + v) for v, (f, n) in enumerate(
        [('row', 9), ('tall', 7), ('row', 8), ('shop', 6), ('tall', 9), ('row', 7)])]
    za = [house('veranda', 0, 'row', 10, 60), house('bokaap', 0, 'hall', 14, 61), house('veranda', 1, 'tall', 9, 62),
          house('bokaap', 1, 'hall', 13, 63), house('veranda', 2, 'row', 8, 64)]
    rows = [('Main Street, 1985', us), ('Mexico City, 1975', mx), ('Tokyo, 1985', jp), ('Moscow, 1980', ru),
            ('Tehran, 1975', ir), ('New Delhi, 1988', dl), ('Cape Town, 1985', za)]
    ff.street(out, rows, zoom=2)
    ff.street(out.replace('.png', '-night.png'), rows, zoom=2, night=True)
    animate(out.replace('-street.png', '-night.gif'), rows)


def animate(out, rows, zoom=2):
    from PIL import Image, ImageEnhance
    from art.reference import current_adult
    adult = current_adult()
    for _, hs in rows:
        for h in hs:
            if not hasattr(h, 'im'):
                h.build()
    W = max(sum(h.im.width - 26 for h in hs) for _, hs in rows) + 44
    heights = [max(h.im.height for h in hs) + 40 for _, hs in rows]
    frames = []
    anims = [[h.frames() for h in hs] for _, hs in rows]
    for k in range(FRAMES):
        s = Image.new('RGBA', (W, sum(heights)), (60, 58, 66, 255))
        y = 0
        for (_, hs), H, fr in zip(rows, heights, anims):
            x = 6
            day = Image.new('RGBA', (W, H), (110, 104, 98, 255))
            glow = Image.new('RGBA', (W, H))
            for h, f in zip(hs, fr):
                im = h.im
                if isinstance(h, Strip) and hasattr(h, 'pole'):
                    im = im.copy()
                    cc = C(1, 1)
                    cc.im, cc.px, cc.w, cc.h = im, im.load(), im.width, im.height
                    barber(cc, h.pole[0], h.pole[1], k % 6)
                day.alpha_composite(im, (x, H - 24 - im.height))
                glow.alpha_composite(f[k], (x, H - 24 - im.height))
                x += im.width - 26
            for fx in (W // 4, W // 2 + 30, 3 * W // 4 + 20):
                day.alpha_composite(adult, (fx, H - 6 - adult.height))
            dark = ImageEnhance.Brightness(day.convert('RGB')).enhance(0.36).convert('RGBA')
            dark = Image.blend(dark, Image.new('RGBA', (W, H), (40, 52, 110, 255)), 0.28)
            dark.alpha_composite(glow)
            s.alpha_composite(dark, (0, y))
            y += H
        frames.append(s.resize((s.width * zoom, s.height * zoom), Image.NEAREST).convert('P', palette=Image.ADAPTIVE))
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=160, loop=0)
    print(f'wrote {out}')


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/modern-ab.png'
    sheets(target, sys.argv[2:] or None)
