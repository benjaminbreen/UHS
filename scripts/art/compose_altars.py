"""Composes the altar sprites into src/render/interiors/altars.ts.
Run: python3 scripts/art/compose_altars.py (no dependencies).
Symmetric parts are drawn from |x - centre|; the right half is then recoloured
(swap) and shaded (shade), since light falls from the upper left."""
import json, math

class Canvas:
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.g = [['.'] * w for _ in range(h)]
        s.c = (w - 1) / 2
    def a(s, x):  # distance from the centre line, in whole pixels
        return int(abs(x - s.c))
    def set(s, x, y, ch):
        if 0 <= x < s.w and 0 <= y < s.h and ch: s.g[y][x] = ch
    def get(s, x, y):
        return s.g[y][x] if 0 <= x < s.w and 0 <= y < s.h else '.'
    def fill(s, f):
        """f(x, y, a) returns a char or None, for every pixel."""
        for y in range(s.h):
            for x in range(s.w):
                ch = f(x, y, s.a(x))
                if ch: s.g[y][x] = ch
    def stamp(s, rows, x0, y0, flip=False):
        for j, row in enumerate(rows):
            row = row[::-1] if flip else row
            for i, ch in enumerate(row):
                if ch != '.': s.set(x0 + i, y0 + j, ch)
    def right(s, swap={}, shade={}):
        half = s.w // 2
        for y in range(s.h):
            for x in range(half, s.w):
                ch = s.g[y][x]
                ch = swap.get(ch, ch)
                s.g[y][x] = shade.get(ch, ch)
    def rows(s):
        return [''.join(r) for r in s.g]

def ring(cv, cx, cy, r, ch, inner=None):
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            d = math.hypot(x - cx, y - cy)
            if r - 0.7 <= d <= r + 0.3: cv.set(x, y, ch)
            elif inner and d < r - 0.7: cv.set(x, y, inner)

SPRITES = {}

# ---------------------------------------------------------------- gothic
def gothic():
    W, H = 48, 62
    cv = Canvas(W, H)
    def f(x, y, a):
        # Retable: three gables on pinnacles, gold frame, gold-ground panels.
        top_c = 2 + a                       # centre gable
        top_s = 10 + abs(a - 13) if 9 <= a <= 18 else 99
        if a <= 7 and y >= top_c and y <= 41:
            if y <= top_c + 1: return 'G' if y == top_c else 'g'       # gable edge
            if a <= 5 and y >= 6 + a and y <= 38: return 'P'            # centre panel field
            return 'h'                                                 # frame
        if a == 8 and 4 <= y <= 41: return 'G' if y == 4 else ('g' if y % 6 == 0 else 'h')   # pinnacle shaft
        if 9 <= a <= 18 and top_s <= y <= 41:
            if y <= top_s + 1: return 'G' if y == top_s else 'g'
            if 10 <= a <= 17 and y >= 13 + abs(a - 13) and y <= 38: return 'P'
            return 'h'
        if a == 19 and 10 <= y <= 41: return 'G' if y == 10 else 'H'
        # Predella: a band of little arched niches under the panels.
        if a <= 19 and 39 <= y <= 42:
            if y == 39: return 'G'
            if y == 42: return 'k'
            return 'x' if (a % 4) in (1, 2) else 'h'
        return None
    cv.fill(f)
    # Blue starred grounds in the panels; gold frames carved in alternate bands.
    for y in range(cv.h):
        for x in range(cv.w):
            ch = cv.g[y][x]
            if ch == 'P':
                cv.g[y][x] = 'G' if (x * 7 + y * 3) % 23 == 0 else ('b' if y < 18 else 'v')
            elif ch == 'h' and y < 39 and (x + y) % 4 == 0:
                cv.g[y][x] = 'g'
    # Trefoils pierced in the gables.
    for cx, cy in ((23.5, 6.5), (10, 14.5), (37, 14.5)):
        for (dx, dy) in ((0, -1), (-1, 0.6), (1, 0.6)):
            for y in range(int(cy + dy - 1), int(cy + dy + 2)):
                for x in range(int(cx + dx - 1), int(cx + dx + 2)):
                    if abs(x - (cx + dx)) + abs(y - (cy + dy)) <= 1.1: cv.set(x, y, 'k')
    # The Crucifixion: cross, haloed head, outstretched arms, loincloth; Golgotha below.
    for y in range(9, 36): cv.set(23, y, 'e'); cv.set(24, y, 'q')
    for x in range(18, 30): cv.set(x, 13, 'e'); cv.set(x, 14, 'q')
    ring(cv, 23.5, 11.5, 2.6, 'G')
    for (x, y) in ((23, 11), (24, 11), (23, 12), (24, 12)): cv.set(x, y, 'S' if x == 23 else 's')
    for x in range(19, 29): cv.set(x, 14, 'S' if x < 24 else 's')
    for y in range(15, 22): cv.set(23, y, 'S'); cv.set(24, y, 's')
    for y in range(21, 24):
        for x in range(22, 26): cv.set(x, y, 'W' if x < 24 else 'w')
    for y in range(24, 31): cv.set(23, y, 'S'); cv.set(24, y, 's')
    for x in (22, 23, 24, 25): cv.set(x, 31, 's')
    for y in range(33, 39):
        half = y - 31
        for x in range(23 - half, 25 + half):
            if abs(x - 23.5) <= 5.5: cv.set(x, y, 'L' if (x - y) % 4 == 0 else 'l')
    cv.set(22, 36, 'W'); cv.set(23, 36, 'W'); cv.set(22, 37, 'w')
    # Saints in the wings: the Virgin in blue mantle over red, John's colours swapped on the right.
    saint = [
        "...GGGGG...",
        "..GkkkkkG..",
        ".Gkkuuukkg.",
        ".GkuSSsukg.",
        ".GkuSSsukg.",
        "..GksssskG.",
        "...gkbbkg..",
        "...bBBbb...",
        "..bBBrrbv..",
        "..bBrrrbv..",
        "..BBrrSbv..",
        ".bBBrrrbbv.",
        ".bBBrrrbbv.",
        ".bBBrrrbbv.",
        ".bBBxrrbbv.",
        ".bBBxrrbbv.",
        "bbBBxrrbbbv",
        "bBBbxrxbbbv",
        "bBBbbxbbbvv",
        "vbbbbbbbvvv",
        "kkkkkkkkkkk",
    ]
    cv.stamp(saint, 5, 15)
    cv.stamp(saint, W - 16, 15, flip=True)
    # Candlesticks beside the retable on the altar, their flames marked '*'.
    for x in (2, W - 3):
        cv.set(x, 29, '*')
        for y in range(30, 35): cv.set(x, y, 'C' if x < 24 else 'c')
        cv.set(x - 1, 35, 'g'); cv.set(x, 35, 'G'); cv.set(x + 1, 35, 'h')
        for y in range(36, 43): cv.set(x, y, 'g' if y % 3 else 'G')
        cv.set(x - 1, 39, 'h'); cv.set(x + 1, 39, 'H')
        for dx in (-2, -1, 0, 1, 2): cv.set(x + dx, 43, 'h' if dx < 1 else 'H')
    # The mensa under its linen, the red frontal with its gold orphrey, the footpace.
    def mensa(x, y, a):
        if 43 <= y <= 45 and a <= 21: return 'T' if y == 43 else ('t' if y == 44 else 'n')
        if 46 <= y <= 48 and a <= 21: return 'W' if y == 46 else ('w' if y == 47 else ('W' if x % 2 else 'u'))
        if 49 <= y <= 58 and a <= 20:
            if a >= 19 or y == 49 or y == 58: return 'g' if (y + a) % 3 else 'G'
            if a == 18 or y == 50 or y == 57: return 'k'
            if a <= 1 and 51 <= y <= 56: return 'G'
            if 53 <= y <= 54 and a <= 5: return 'G'
            return 'R' if a % 6 == 2 else ('x' if a % 6 == 5 else 'r')
        if 59 <= y <= 61 and a <= 23: return 'T' if y == 59 else ('t' if y == 60 else 'n')
        return None
    cv.fill(mensa)
    cv.right(swap={'B': 'R', 'b': 'r', 'v': 'x', 'r': 'l', 'R': 'L', 'x': 'm'} if False else {}, shade={'G': 'g', 'T': 't', 'W': 'w'})
    # Recolour the right saint only (John: red mantle over green).
    for y in range(15, 36):
        for x in range(W - 16, W - 5):
            ch = cv.g[y][x]
            cv.g[y][x] = {'B': 'R', 'b': 'r', 'v': 'x', 'r': 'l', 'x': 'm'}.get(ch, ch)
    SPRITES['gothic'] = {
        'rows': cv.rows(),
        'ink': {
            'G': ['brass', 5], 'g': ['brass', 4], 'h': ['brass', 3], 'H': ['brass', 2], 'k': ['brass', 1],
            'B': 0x4a64b8, 'b': 0x2c3f88, 'v': 0x1a2658,
            'R': 0xd0503a, 'r': 0xa8302a, 'x': 0x6a1a18,
            'L': 0x6a9a4a, 'l': 0x3e6a3a, 'm': 0x24402a,
            'S': 0xf0d0b0, 's': 0xd0a888, 'u': 0x4a2e22,
            'W': ['linen', 5], 'w': ['linen', 4],
            'T': ['stone', 4], 't': ['stone', 3], 'n': ['stone', 1],
            'q': ['wood', 1], 'e': ['wood', 3],
            'C': 0xf4ecd8, 'c': 0xd8ccb4,
        },
    }

gothic()

GOLD = {'G': ['brass', 5], 'g': ['brass', 4], 'h': ['brass', 3], 'H': ['brass', 2], 'k': ['brass', 1], 'K': 0x2a1a10}
FLESH = {'S': 0xf0d0b0, 's': 0xd0a888, 'u': 0x4a2e22}

# ---------------------------------------------------------------- baroque
def baroque():
    W, H = 48, 62
    cv = Canvas(W, H)
    rosette = ["hhhhhh", "hhgghh", "hgHHgh", "hgHHgh", "hHgghH", "hhHHhh"]
    def niche_top(x, cx, half, top):
        d = abs(x + 0.5 - cx)
        return None if d > half else top + int((d * d) / (half * 0.9))
    def body(x, y, a):
        if y < 10:
            # Attic: scrolls of a broken pediment, an oval of the Holy Spirit, the cross.
            if a <= 4 and 2 <= y <= 9:
                e = ((x - 23.5) / 4.7) ** 2 + ((y - 5.5) / 3.6) ** 2
                if e <= 1: return 'g' if e > 0.72 and x < 24 else ('H' if e > 0.72 else ('Y' if y < 5 else 'y'))
            if 7 <= a <= 15:
                t = 9 - (15 - a) // 2
                if y == t: return 'g' if x < 24 else 'h'
                if y > t: return 'K' if y == t + 1 else 'h'
            return None
        if a > 23 or y > 40: return None
        if y == 10: return 'g'
        if y == 11: return 'h'
        if y == 12: return 'K'
        if y == 13: return 'H'
        for c0 in (14, 44, 2, 32):
            if x in (c0, c0 + 1):
                if y == 14: return 'g'
                if y >= 38: return 'g' if y == 38 else 'H'
                return 'g' if (y + (x - c0) * 2) % 4 < 2 else 'K'
            if x in (c0 - 1, c0 + 2) and (y == 14 or y == 38): return 'h'
        for cx, half, top in ((24, 7, 16), (8.5, 4.5, 19), (39.5, 4.5, 19)):
            t = niche_top(x, cx, half, top)
            if t is not None and t <= y <= 37:
                if y == t or abs(x + 0.5 - cx) > half - 1: return 'g' if x + 0.5 < cx else 'H'
                return 'K' if y <= t + 1 else 'X'
        return rosette[y % 6][x % 6]
    cv.fill(body)
    for y in range(17, 38):
        for x in range(17, 31):
            if cv.get(x, y) == 'X':
                ang = math.atan2(y - 26, x - 23.5)
                if round(ang / (math.pi / 8)) * (math.pi / 8) - ang == 0 or abs(((ang + math.pi) % (math.pi / 6)) - math.pi / 12) < 0.07:
                    cv.set(x, y, 'h')
    virgin = [
        "...g.g.g...",
        "...gGgGg...",
        "...bWWWb...",
        "..bWSSsWb..",
        "..bWuSuWb..",
        "..bWSssWb..",
        "..BbWssWbb.",
        ".BBbRRrbbb.",
        ".BBbRSsbbv.",
        ".BBbSSsbbv.",
        "BBbbRRrbbbv",
        "BBbbRRrbbbv",
        "BBbbRrrbbbv",
        "BBbbRrrbbvv",
        "BBbbRrxbbvv",
        "BbbbRrxbbvv",
        "GbbbbbbbvvG",
        ".GGG...GGG.",
        "WwWwWwWwWwW",
        ".wWwWwWwWw.",
    ]
    cv.stamp(virgin, 18, 18)
    saint = [
        ".hGGGh.",
        "hKuuuKH",
        "GuSSsuH",
        "GuuSuuH",
        ".KsssK.",
        ".NnLnN.",
        "NnLLlnN",
        "NnLlLnN",
        "NSLlLnN",
        "NnLllnN",
        "NnLllnN",
        "NnLllnN",
        "NnnlnnN",
        "NnnlnnN",
        "nnnnnnn",
        "KKKKKKK",
    ]
    cv.stamp(saint, 5, 21)
    cv.stamp(saint, 36, 21, flip=True)
    for y in range(21, 37):
        for x in range(36, 43):
            cv.g[y][x] = {'N': 'D', 'n': 'd', 'L': 'W', 'l': 'w'}.get(cv.g[y][x], cv.g[y][x])
    for (x, y) in ((22, 5), (23, 5), (24, 5), (25, 5), (21, 4), (26, 4), (23, 6), (24, 6)): cv.set(x, y, 'W')
    for y in range(0, 2): cv.set(23, y, 'g'); cv.set(24, y, 'H')
    cv.set(22, 0, 'g'); cv.set(25, 0, 'H')
    # Gradin of six candles, the domed tabernacle at its centre.
    for y in range(40, 46):
        for x in range(1, 47):
            cv.set(x, y, 'g' if y in (40, 43) else ('K' if y in (42, 45) else 'h'))
    for x in (4, 10, 16, 31, 37, 43):
        cv.set(x, 31, '*')
        for y in range(32, 38): cv.set(x, y, 'C' if x < 24 else 'c')
        cv.set(x - 1, 38, 'h'); cv.set(x, 38, 'g'); cv.set(x + 1, 38, 'H')
        cv.set(x, 39, 'h')
    for y in range(31, 46):
        for x in range(19, 29):
            a = abs(x - 23.5)
            if y <= 34:
                if a <= (y - 30) * 1.4: cv.set(x, y, 'g' if a < 1 or x < 23 else 'h')
            elif 21 <= x <= 26 and 36 <= y <= 42:
                cv.set(x, y, 'g' if (x in (23, 24) and 37 <= y <= 41) or (y == 39 and 22 <= x <= 25) else 'x')
            else:
                cv.set(x, y, 'g' if x == 19 else ('K' if x == 28 else 'h'))
    cv.set(23, 30, 'g'); cv.set(24, 30, 'h'); cv.set(23, 29, 'g')
    def mensa(x, y, a):
        if 46 <= y <= 49 and a <= 22: return 'W' if y == 46 else ('w' if y < 49 else ('W' if x % 2 else '.'))
        if 50 <= y <= 58 and a <= 21:
            if a >= 20 or y in (50, 58): return 'g' if (x + y) % 2 else 'h'
            if a >= 19 or y in (51, 57): return 'K'
            r = math.hypot(x - 23.5, (y - 54) * 1.3)
            if r <= 3.2: return 'g' if r <= 1.6 else 'h'
            return 'h' if (x + y) % 4 == 0 or (x - y) % 4 == 0 else 'H'
        if 59 <= y <= 61 and a <= 23: return 'T' if y == 59 else ('t' if y == 60 else 'K')
        return None
    cv.fill(mensa)
    cv.right(shade={'g': 'h', 'T': 't'})
    SPRITES['baroque'] = {'rows': cv.rows(), 'ink': {**GOLD, **FLESH,
        'X': 0x3a1420, 'Y': 0xc8dcf0, 'y': 0x9ab8d8,
        'B': 0x4a6ac0, 'b': 0x2c4490, 'v': 0x1a2860, 'R': 0xe08a8a, 'r': 0xc05a5a, 'x': 0x7a1e22,
        'N': 0x7a5030, 'n': 0x5a3820, 'L': 0x5a8a4a, 'l': 0x3a6a3a, 'D': 0x2a2224, 'd': 0x1a1418,
        'W': ['linen', 5], 'w': ['linen', 4], 'C': 0xf4ecd8, 'c': 0xd8ccb4,
        'T': ['stone', 4], 't': ['stone', 3]}}

baroque()

def seated_buddha(cv, cx, top, hair, hair_lit):
    """A Buddha in meditation, gilt, about 30 px tall, head centre at top + 5."""
    hy = top + 5
    ellipse(cv, cx, hy, 4.2, 4.8, lambda e, x, y: (hair if (x + y) % 2 else hair_lit) if y < hy - 1.5 else ('G' if x < cx - 1.5 and e < 0.8 else ('g' if x < cx + 1.5 else 'h')))
    ellipse(cv, cx, top - 0.5, 2.2, 1.8, lambda e, x, y: hair if (x + y) % 2 else hair_lit)
    for y in range(hy - 1, hy + 4):
        cv.set(int(cx - 4.5), y, 'h'); cv.set(int(cx + 5.5), y, 'H')
    cv.set(int(cx - 1.5), hy + 1, 'k'); cv.set(int(cx - 0.5), hy + 1, 'H')
    cv.set(int(cx + 1.5), hy + 1, 'k'); cv.set(int(cx + 0.5), hy + 1, 'H')
    cv.set(int(cx), hy - 1, 'x'); cv.set(int(cx), hy + 3, 'H')
    for y in range(hy + 5, hy + 7):
        for x in range(int(cx - 2), int(cx + 3)): cv.set(x, y, 'h' if y == hy + 5 else 'g')
    for y in range(hy + 7, hy + 18):
        half = 6 + (y - hy - 7) // 4
        for x in range(int(cx - half), int(cx + half) + 1):
            right = x > cx
            robe = right or x < cx - half + 2 or y > hy + 13
            if robe: ch = 'H' if (x + y) % 4 == 0 else ('h' if right else 'g')
            else: ch = 'G' if x < cx - 2 and y < hy + 11 else 'g'
            cv.set(x, y, ch)
        cv.set(int(cx - half), y, 'h')
    for x in range(int(cx - 3), int(cx + 4)):   # hands joined in the lap
        cv.set(x, hy + 15, 'G' if x < cx else 'g'); cv.set(x, hy + 16, 'g' if x < cx else 'h')
    ellipse(cv, cx, hy + 20, 11.5, 3.6, lambda e, x, y: 'G' if (y < hy + 19 and x < cx - 4) else ('H' if (x + y) % 5 == 0 else ('g' if x < cx else 'h')))
    for side in (-1, 1):
        cv.set(int(cx + side * 6), hy + 18, 'G'); cv.set(int(cx + side * 6 + side), hy + 18, 'g')
    # The lotus: two tiers of petals, gilt edges on rose.
    for tier, (y0, half) in enumerate(((hy + 23, 13), (hy + 27, 15))):
        for x in range(int(cx - half), int(cx + half) + 1):
            k = (x - int(cx - half)) % 5
            h = 3 - abs(k - 2)
            for y in range(y0 - h, y0 + 4):
                cv.set(x, y, 'g' if y == y0 - h else ('P' if y < y0 + 2 else 'p'))
            cv.set(x, y0 + 4, 'k')

# ---------------------------------------------------------------- buddha (China)
def buddha_cn():
    W, H = 48, 62
    cv = Canvas(W, H)
    ellipse(cv, 23.5, 30, 16.5, 21, lambda e, x, y: ('g' if (int(math.atan2(y - 30, x - 23.5) * 9) % 2) else 'x') if e > 0.9 else ('x' if e > 0.82 else ('L' if e > 0.72 else ('h' if e > 0.64 else 'X'))))
    ellipse(cv, 23.5, 15, 8, 8, lambda e, x, y: 'g' if e > 0.85 else ('x' if e > 0.7 else ('h' if e > 0.6 else 'X')))
    seated_buddha(cv, 23.5, 10, 'v', 'V')
    for y in range(0, 6):     # silk valance with a gold fringe
        for x in range(0, 48):
            cv.set(x, y, 'g' if y == 5 and x % 2 else ('k' if y == 5 else ('x' if y == 0 else ('r' if (x // 6 + y) % 2 else 'R'))))
        if y == 2:
            for x in range(3, 46, 6): cv.set(x, y, 'g')
    for col in (2, 45):       # long hanging banners
        for y in range(6, 40):
            for dx in (-1, 0, 1):
                cv.set(col + dx, y, 'g' if y % 8 == 0 else ('R' if dx < 0 else 'r'))
        cv.set(col, 40, 'g'); cv.set(col, 41, 'h')
    # Altar: red lacquer, gold edge and cloud scrolls; a bronze ding, candles, lotus vases.
    def table(x, y, a):
        if 45 <= y <= 58 and a <= 20:
            if y == 45: return 'g'
            if y == 46: return 'k'
            if a == 20 or y == 58: return 'k'
            if 49 <= y <= 55 and a <= 16:
                return 'g' if (a in (16,) or y in (49, 55)) or ((x + 2 * y) % 9 == 0 and a < 14) else 'R'
            return 'r' if x > 23 else 'R'
        return None
    cv.fill(table)
    ding = ["..g.....g..", ".BBBBBBBBB.", "BbBBBBBBBbo", ".BbbbbbbbO.", "..BbbbbbO..", "..B.o.o.O.."]
    cv.stamp(ding, 18, 39)
    cv.set(23, 37, '%'); cv.set(24, 36, '%')
    for x in (11, 36):
        cv.set(x, 34, '*')
        for y in range(35, 41): cv.set(x, y, 'R' if x < 24 else 'r')
        cv.set(x - 1, 41, 'g'); cv.set(x, 41, 'g'); cv.set(x + 1, 41, 'h')
        for y in range(42, 45): cv.set(x, y, 'h')
    for x in (5, 42):
        for y in range(38, 45): cv.set(x, y, 'B' if x < 24 else 'b'); cv.set(x + 1, y, 'b')
        for (dx, dy, ch) in ((-1, -2, 'P'), (0, -3, 'P'), (1, -2, 'p'), (2, -3, 'P'), (0, -1, 'L'), (1, -1, 'L')): cv.set(x + dx, 38 + dy, ch)
    for y in range(59, 62):
        for x in range(48): cv.set(x, y, ('T', 't', 'K')[y - 59])
    cv.right(shade={'G': 'g', 'R': 'r'})
    SPRITES['buddha'] = {'rows': cv.rows(), 'ink': {**GOLD, **STONE, 'v': 0x2a3a7a, 'V': 0x4a62a8, 'x': 0x7a1a14, 'X': 0x4a1210,
        'R': 0xb8302a, 'r': 0x8a1e1c, 'L': 0x3a7a4a, 'P': 0xe8a0a8, 'p': 0xc87888, 'B': 0x5a6a5a, 'b': 0x3a4a40, 'o': 0x2a342c, 'O': 0x2a342c}}

# ---------------------------------------------------------------- Amida (Japan)
def buddha_jp():
    W, H = 48, 62
    cv = Canvas(W, H)
    # Boat-shaped mandorla in openwork gilt: flames and small seated buddhas.
    for y in range(3, 45):
        t = (y - 3) / 42
        half = 19 * math.sin(min(1, t * 1.3) * math.pi * 0.5) if t < 0.8 else 19 - (t - 0.8) * 12
        for x in range(48):
            d = abs(x - 23.5)
            if d <= half:
                rim = d > half - 1.5
                # Gilt flame tracery on dark bronze, so the gilt Buddha stands clear of it.
                flame = (int(x + y * 0.7) % 6 == 0) or (int(x - y * 0.7) % 6 == 0)
                cv.set(x, y, 'g' if rim else ('h' if flame and d > 6 else 'Z'))
    for (x, y) in ((14, 14), (33, 14), (11, 26), (36, 26), (13, 37), (34, 37)):
        ellipse(cv, x, y, 1.6, 1.6, lambda e, xx, yy: 'G')
    for y in range(0, 4):   # the canopy over it
        for x in range(8, 40): cv.set(x, y, 'G' if y == 0 else ('k' if y == 3 else 'g'))
    for x in range(9, 40, 4):
        for y in range(4, 8): cv.set(x, y, 'g' if y < 7 else 'r')
    ellipse(cv, 23.5, 31, 14.5, 15, lambda e, x, y: 'g' if e > 0.9 else ('Z' if e > 0.82 else 'z'))
    ellipse(cv, 23.5, 15, 7, 7, lambda e, x, y: 'g' if e > 0.84 else ('z' if e > 0.6 else 'Z'))
    seated_buddha(cv, 23.5, 10, 'K', 'k')
    # The shumidan: black lacquer, gold fittings at its corners; lotus vases, candles, a censer.
    def table(x, y, a):
        if 45 <= y <= 58 and a <= 20:
            if y == 45: return 'g'
            if (a >= 18 and (y <= 48 or y >= 55)): return 'g'
            if y in (46, 58) or a == 20: return 'K'
            return 'D' if x < 24 else 'd'
        return None
    cv.fill(table)
    for x in (8, 39):   # gilt lotus in a vase
        for y in range(39, 45): cv.set(x, y, 'g' if x < 24 else 'h'); cv.set(x + 1, y, 'h')
        for (dx, dy) in ((-1, -2), (0, -3), (1, -3), (2, -2), (0, -1), (1, -1)): cv.set(x + dx, 39 + dy, 'G')
        for y in range(29, 37): cv.set(x, y, 'g')
    for x in (15, 32):
        cv.set(x, 36, '*')
        for y in range(37, 41): cv.set(x, y, 'C')
        for y in range(41, 45): cv.set(x, y, 'h')
    for y in range(41, 45):
        for x in range(21, 27): cv.set(x, y, 'B' if x < 24 else 'b')
    cv.set(23, 39, '%'); cv.set(24, 38, '%')
    for y in range(59, 62):
        for x in range(48): cv.set(x, y, ('T', 't', 'K')[y - 59])
    cv.right(shade={'G': 'g'})
    SPRITES['buddha-jp'] = {'rows': cv.rows(), 'ink': {**GOLD, **STONE, 'Z': 0x3a2418, 'z': 0x24160e, 'D': 0x221614, 'd': 0x150d0c, 'r': 0xa8302a,
        'P': 0xe8a0a8, 'p': 0xc87888, 'x': 0x7a1a14, 'B': 0x5a5a52, 'b': 0x3a3a34, 'C': 0xf4ecd8}}

# ---------------------------------------------------------------- Hindu sanctum
def hindu():
    W, H = 48, 62
    cv = Canvas(W, H)
    def door(x, y, a):
        if 6 <= a <= 13 and 4 <= y <= 58:   # jambs: bands of carving
            band = a - 6
            if band == 0: return 'S1'
            if band in (1, 6): return 's' if y % 3 else 'S'
            if band in (2, 5): return 'S' if (y + band) % 4 < 2 else 's'
            return 'S' if (y // 3) % 2 else 'd'
        if a <= 13 and 4 <= y <= 12:        # lintel
            if y in (4, 12): return 'S'
            return 'd' if (x + y) % 5 == 0 else 's'
        if a <= 5 and 13 <= y <= 56: return 'K'
        if a <= 16 and 57 <= y <= 61:       # moonstone threshold
            e = math.hypot((x - 23.5) / 14, (y - 61) / 4.5)
            if e <= 1: return 'S' if int(e * 6) % 2 else 's'
        return None
    cv.fill(door)
    for y in range(cv.h):
        cv.g[y] = [('s' if c == 'S1' else c) for c in cv.g[y]]
    for y in range(13, 57):
        for x in range(14, 34): cv.set(x, y, 'K')
    # Ganesha on the lintel, river goddesses at the jambs' feet.
    ellipse(cv, 23.5, 8, 3, 3, lambda e, x, y: 'O' if e < 0.8 else 'o')
    for y in range(9, 12): cv.set(23, y, 'o')
    for side, x0 in ((-1, 7), (1, 36)):
        fig = [".GG..", ".dSd.", "dSSSd", ".SSS.", ".BBB.", "BBbBB", ".BbB.", "LLLLL"]
        cv.stamp(fig, x0, 46, flip=side > 0)
    # The god: dark stone, crowned, four-armed, garlanded, standing on a lotus.
    god = [
        "......GgG......",
        ".....GGgGG.....",
        ".....GgggG.....",
        ".....GGGGG.....",
        "......DDD......",
        "......DwD......",
        "..W...DDD...g..",
        "..D..DDDDD..D..",
        "...D.ODDDO.D...",
        "...DDDODOddD...",
        "......DODd.....",
        "......OdOd.....",
        ".....DDOOd.....",
        "....DdDDDdD....",
        ".....YYYYY.....",
        ".....YyYYy.....",
        ".....YyYyy.....",
        ".....YyYyy.....",
        ".....YyYyy.....",
        "......D.d......",
        "......D.d......",
        ".....DD.dd.....",
        "....PPPPPPP....",
        "...PpPpPpPpP...",
    ]
    cv.stamp(god, 17, 27)
    for x in (2, 45):   # tiered brass lamp stands, a flame at each tier
        for y in range(24, 56): cv.set(x, y, 'g' if y % 4 else 'G')
        for ty in (24, 33, 42):
            for dx in (-1, 0, 1): cv.set(x + dx, ty, 'h')
            cv.set(x - 1, ty - 1, '*'); cv.set(x + 1, ty - 1, '*')
        for dx in (-2, -1, 0, 1, 2): cv.set(x + dx, 56, 'h')
    for x in (16, 31):
        for y in range(13, 17): cv.set(x, y, 'k')
        for (dx, dy) in ((-1, 17), (0, 17), (1, 17), (-1, 18), (0, 18), (1, 18), (0, 19)): cv.set(x + dx, dy, 'g')
    for x in range(17, 31):   # a banana leaf of flowers before the god
        cv.set(x, 55, 'L'); cv.set(x, 56, 'l')
        if x % 2: cv.set(x, 54, 'O' if x % 4 == 1 else 'W')
    cv.right(shade={'S': 's'})
    SPRITES['hindu'] = {'rows': cv.rows(), 'ink': {**GOLD, 'S': ['stone', 4], 's': ['stone', 3], 'd': ['stone', 1], 'K': 0x120a0c,
        'D': 0x2a2830, 'O': 0xf0a020, 'o': 0xc8601a, 'Y': 0xe8b830, 'y': 0xb8861a, 'W': 0xf4f0e4, 'w': 0xd02020,
        'P': 0xd8708a, 'p': 0xa84a6a, 'L': 0x4a8a3a, 'l': 0x2e5e2a, 'B': 0x3a5aa0, 'b': 0x2a3a70}}

# ---------------------------------------------------------------- classical cult statue
def classical():
    W, H = 48, 62
    cv = Canvas(W, H)
    goddess = [
        "......gGg.......",
        ".....gGGGg......",
        "....GgGgGgg.....",
        "....gMMMMh......",
        "....MMmMMm......",
        ".....MmMm.......",
        "....gggggh......",
        "..MMgGgggghMMgG.",
        ".M.gGgggghh..gGg",
        "M..gGghggh....g.",
        "M..gGghggh......",
        "...gGghhgh......",
        "...gGgHhgh......",
        "..gGgghHghh.....",
        "..gGgghHghh.....",
        "..gGggHhghh.....",
        ".gGgggHhghhh....",
        ".gGgggHhghhh....",
        ".gGggHhhghhh....",
        "gGgggHhhghhhh...",
        "gGgggHhhghhhh...",
        "gGggHHhhghhhh...",
        "gGggHhhhhhhhh...",
        "hhhhhhhhhhhhh...",
    ]
    cv.stamp(goddess, 16, 13)
    for y in range(4, 44): cv.set(14, y, 'g' if y > 5 else 'G')   # her spear
    ellipse(cv, 34, 33, 5.5, 6, lambda e, x, y: 'g' if e > 0.8 else ('M' if e < 0.25 else ('H' if (x + y) % 3 else 'h')))
    def base(x, y, a):
        if 37 <= y <= 58 and a <= 12:
            if y in (37, 38): return 'M' if y == 37 else 'm'
            if y in (57, 58): return 'm' if y == 57 else 'n'
            if 41 <= y <= 54:
                return ('n' if (x + y) % 6 == 0 else 'r') if 44 <= y <= 50 else 'M'
            return 'm'
        return None
    cv.fill(base)
    for x in (3, 44):   # bronze tripod incense burners
        cv.set(x, 37, '%'); cv.set(x, 38, '*')
        for dx in (-2, -1, 0, 1, 2): cv.set(x + dx, 39, 'g'); cv.set(x + dx, 40, 'h')
        for y in range(41, 58):
            cv.set(x - (y - 41) // 6, y, 'H'); cv.set(x + (y - 41) // 6, y, 'H'); cv.set(x, y, 'h' if y < 50 else '.')
    for y in range(59, 62):
        for x in range(48): cv.set(x, y, ('M', 'm', 'n')[y - 59])
    cv.right(shade={'M': 'm'})
    SPRITES['classical'] = {'rows': cv.rows(), 'ink': {**GOLD, 'M': 0xf2ebdc, 'm': 0xcfc6b4, 'n': 0x8a8070, 'r': 0x9a3a2a}}

# ---------------------------------------------------------------- Mesopotamian god
def mesopotamian():
    W, H = 48, 62
    cv = Canvas(W, H)
    def niche(x, y, a):
        if a > 20 or y < 2 or y > 58: return None
        for step, (aa, top) in enumerate(((20, 2), (17, 5), (14, 8))):
            if a > aa - 3 and a <= aa and y >= top:
                return 'C' if a == aa or y == top else ('c' if (y + step) % 4 else 'k2')
        if a <= 11 and y >= 11: return 'X'
        return None
    cv.fill(niche)
    for y in range(cv.h):
        cv.g[y] = [('d' if c == 'k2' else c) for c in cv.g[y]]
    god = [
        "...gGgGg...",
        "..hgGgGgh..",
        "...gGgGg...",
        "..hgGgGgh..",
        "...gGGGg...",
        "...SSSSs...",
        "..SWkSWks..",
        "...SSsSs...",
        "...VvVvV...",
        "..VvVvVvV..",
        "..vVvVvVv..",
        "...vVvVv...",
        "..WwSSswW..",
        ".WwWSSsWwW.",
        ".wwwwwwwww.",
        ".WWWWWWWWW.",
        ".wwwwwwwww.",
        "WWWWWWWWWWW",
        "wwwwwwwwwww",
        "WWWWWWWWWWW",
        "wwwwwwwwwww",
        "WWWWWWWWWWW",
        "..SS...SS..",
        "ccccccccccc",
    ]
    cv.stamp(god, 18, 14)
    # Moon and star on their standards.
    for x in (3, 44):
        for y in range(14, 58): cv.set(x, y, 'g' if y % 5 else 'h')
    ellipse(cv, 3, 11, 2.6, 2.6, lambda e, x, y: 'G' if e > 0.55 and x <= 3 else None)
    for (dx, dy) in ((0, -3), (0, 3), (-3, 0), (3, 0), (-2, -2), (2, 2), (-2, 2), (2, -2), (0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)):
        cv.set(44 + dx, 11 + dy, 'G')
    # Worshippers with wide inlaid eyes along the benches.
    worshipper = ["vvv", "SWS", "Sks", "WWW", "WSW", "WWW", "www"]
    for x in (7, 11, 34, 38):
        cv.stamp(worshipper, x, 43)
    for y in range(50, 53):
        for x in list(range(5, 16)) + list(range(32, 43)): cv.set(x, y, 'C' if y == 50 else 'c')
    # Offering table: loaves, dates, a beer jar with drinking straws.
    for y in range(48, 59):
        for x in range(17, 31): cv.set(x, y, 'C' if y == 48 else ('c' if x < 24 else 'd'))
    for x in (19, 22): ellipse(cv, x, 46, 1.6, 1.2, lambda e, xx, yy: 'B')
    for (x, y) in ((25, 46), (26, 47), (26, 46)): cv.set(x, y, 'N')
    ellipse(cv, 28.5, 44, 2, 3.5, lambda e, x, y: 'c' if x > 28 else 'C')
    for k in range(4): cv.set(28 + k, 39 + k // 2, 'B')
    for y in range(59, 62):
        for x in range(48): cv.set(x, y, ('C', 'c', 'd')[y - 59])
    cv.right(shade={'C': 'c'})
    SPRITES['mesopotamian'] = {'rows': cv.rows(), 'ink': {**GOLD, 'C': ['clay', 4], 'c': ['clay', 3], 'd': ['clay', 1], 'X': 0x24160f,
        'S': 0xd8b48a, 's': 0xb08a68, 'W': 0xf0e6cc, 'w': 0xc8b892, 'V': 0x3a5ab8, 'v': 0x22367a, 'k': 0x120a0c,
        'B': 0xc8a060, 'N': 0x5a2a1a}}

# ---------------------------------------------------------------- Maya stela
def maya():
    W, H = 48, 62
    cv = Canvas(W, H)
    def stela(x, y, a):
        if a <= 10 and 2 <= y <= 50:
            if a == 10 or y == 2: return 'R'
            if x >= 29 and x <= 32:   # glyph column
                return 'r' if (y - 4) % 6 in (0, 5) or x in (29, 32) else ('Y' if (x + y) % 3 == 0 else 'B')
            return 'r'
        if a <= 12 and 51 <= y <= 58:  # round altar drum
            return 'S' if y == 51 else ('s' if (x + y) % 5 else 'd')
        return None
    cv.fill(stela)
    ruler = [
        "...LLlLLlL...",
        "..LlLGLLlLL..",
        ".LLlGGGlLlLL.",
        "..lGBGBGl....",
        "...GSSSG.....",
        "...SsSkS.....",
        "...SSSSS.....",
        "..BGBGBGB....",
        ".SBBBBBBBS...",
        "SSYYYYYYYSS..",
        "S.YyYyYyY.S..",
        "..YyYyYyY....",
        "..rYYYYYr....",
        "..WWWWWWW....",
        "..WwWwWwW....",
        "...SS.SS.....",
        "...SS.SS.....",
        "..YYY.YYY....",
    ]
    cv.stamp(ruler, 15, 14)
    for x in (2, 6):
        pass
    for x0 in (2, 37):   # effigy censers: the face of a god on a tall cylinder
        censer = ["..%.%..", ".RRRRR.", "RRBBBRR", "RYkYkYR", "RRYYYRR", "RRYrYRR", "RYYYYYR", "RRRRRRR", "RrRrRrR", "RRRRRRR", "rrrrrrr"]
        cv.stamp(censer, x0, 44)
        cv.set(x0 + 3, 45, '*')
    for y in range(59, 62):
        for x in range(48): cv.set(x, y, ('S', 's', 'd')[y - 59])
    cv.right(shade={'S': 's'})
    SPRITES['maya'] = {'rows': cv.rows(), 'ink': {**GOLD, 'R': 0xb8402a, 'r': 0x8a2a1c, 'Y': 0xd8a83a, 'y': 0xa87a2a,
        'B': 0x3a8a9a, 'L': 0x3a9a5a, 'l': 0x22603a, 'G': 0x5ac0a0, 'S': ['stone', 4], 's': ['stone', 3], 'd': ['stone', 1],
        'k': 0x1a1010, 'W': 0xe8e0d0, 'w': 0xc8bca8}}


def ellipse(cv, cx, cy, rx, ry, f):
    """f(e, x, y) for every pixel inside, e from 0 (centre) to 1 (rim)."""
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            e = math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
            if e <= 1:
                ch = f(e, x, y)
                if ch: cv.set(x, y, ch)

def candle(cv, x, top, base, wax='C', stick=('h', 'g', 'H')):
    cv.set(x, top, '*')
    for y in range(top + 1, top + 5): cv.set(x, y, wax)
    cv.set(x - 1, top + 5, stick[0]); cv.set(x, top + 5, stick[1]); cv.set(x + 1, top + 5, stick[2])
    for y in range(top + 6, base): cv.set(x, y, stick[1] if y % 3 else stick[0])
    for dx in (-1, 0, 1): cv.set(x + dx, base, stick[0] if dx < 1 else stick[2])

def footpace(cv, y0, a_max=23, ch=('T', 't', 'K')):
    for y in range(y0, y0 + 3):
        for x in range(cv.w):
            if cv.a(x) <= a_max: cv.set(x, y, ch[y - y0])

STONE = {'T': ['stone', 4], 't': ['stone', 3], 'K': 0x2a1a10}
LINEN = {'W': ['linen', 5], 'w': ['linen', 4]}

# ---------------------------------------------------------------- romanesque
def romanesque():
    W, H = 48, 62
    cv = Canvas(W, H)
    for x in range(1, 47):   # meander border along the top of the painted apse
        k = x % 6
        cv.set(x, 1, 'O'); cv.set(x, 5, 'O')
        for y in (2, 3, 4): cv.set(x, y, 'r' if (k == 0 or (y == 2 and k < 4) or (y == 4 and k > 1) or (y == 3 and k == 3)) else 'I')
    ellipse(cv, 23.5, 21, 9.5, 14.5, lambda e, x, y: 'O' if e > 0.93 else ('r' if e > 0.86 else ('b' if e > 0.78 else ('I' if (x * 3 + y) % 11 else 'O'))))
    christ = [
        "....hGGGGh....",
        "...hGrrrrGh...",
        "..hGrruurrGh..",
        "..GrruSSurrG..",
        "..GrruSsurrG..",
        "...hGuuuuGh...",
        ".S...uRRu..JJ.",
        ".Sb.bRRRRbbJJ.",
        "..bbbRRRRbbJr.",
        "..bbBRRRRbbJr.",
        "..BbbRRRRbBbr.",
        ".BBbbRRRRbbBb.",
        ".BbbbRRRRbbbb.",
        "BBbbRRRRRRbbBb",
        "BbbRRRRRRRRbbv",
        "BbRRxRRRRxRRbv",
        "bbRRxRRRRxRRvv",
        "..RRRR..RRRR..",
        "..SS......SS..",
        ".vvvvvvvvvvvv.",
    ]
    cv.stamp(christ, 17, 8)
    for (cx, cy, ink) in ((10, 11, 'W'), (37, 11, 'N'), (10, 28, 'g'), (37, 28, 'x')):
        ellipse(cv, cx, cy, 4.5, 4.5, lambda e, x, y, ink=ink: 'O' if e > 0.8 else ('b' if e > 0.6 or not (abs(x - cx) < 2.2 and abs(y - cy) < 2.5) else ink))
        cv.set(int(cx - 2), int(cy - 2), 'I'); cv.set(int(cx + 2), int(cy - 2), 'I')
    for y in range(37, 44):  # painted curtains below the image
        for x in range(1, 47):
            cv.set(x, y, 'O' if y == 37 else ('r' if ((x + (y - 38) // 2) % 6) < 3 else 'I'))
    for y in range(36, 44):  # a gilt reliquary casket on the altar, house-shaped
        for x in range(18, 30):
            a = abs(x - 23.5)
            if y <= 39 and a > (y - 35) * 2 + 1: continue
            cv.set(x, y, 'G' if y == 36 or (y > 39 and x == 18) else ('k' if y == 43 else ('x' if (y == 41 and a < 4) else 'g' if (x + y) % 3 else 'h')))
    candle(cv, 10, 34, 43)
    candle(cv, 37, 34, 43, wax='c')
    def altar(x, y, a):
        if 44 <= y <= 46 and a <= 15: return 'W' if y == 44 else ('w' if y == 45 else ('W' if x % 2 else 'w'))
        if 47 <= y <= 58 and a <= 14:
            if a == 14 or y == 58: return 't'
            if 49 <= y <= 56 and a <= 10: return 'G' if (a <= 1 and 50 <= y <= 55) or (y == 52 and a <= 4) else ('O' if a == 10 or y in (49, 56) else 'r')
            return 'T' if x < 24 else 't'
        return None
    cv.fill(altar)
    footpace(cv, 59)
    cv.right(shade={'G': 'g', 'T': 't'})
    SPRITES['romanesque'] = {'rows': cv.rows(), 'ink': {**GOLD, **FLESH, **STONE, **LINEN,
        'O': 0xc8923a, 'I': 0xe8dcc0, 'r': 0xa83a28, 'x': 0x6a2018, 'R': 0xc04a32, 'B': 0x5a7ab0, 'b': 0x3a5a8a, 'v': 0x2a4270,
        'J': 0xe8e0d0, 'N': 0x7a5030, 'C': 0xf4ecd8, 'c': 0xd8ccb4}}

# ---------------------------------------------------------------- reformed
def reformed():
    W, H = 48, 62
    cv = Canvas(W, H)
    def board(x0, w, y0, h, twin=False):
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                lx, ly = x - x0, y - y0
                if twin:
                    half = w // 2
                    cx = half / 2 - 0.5 if lx < half else half + half / 2 - 0.5
                    r = half / 2
                    if ly < r and math.hypot(lx - cx, ly - r) > r + 0.3: continue
                    rim = lx in (0, w - 1, half - 1, half) or ly == h - 1 or (ly < r and math.hypot(lx - cx, ly - r) > r - 0.8)
                else:
                    r = w / 2
                    if ly < r and math.hypot(lx - (w - 1) / 2, ly - r) > r + 0.3: continue
                    rim = lx in (0, w - 1) or ly == h - 1 or (ly < r and math.hypot(lx - (w - 1) / 2, ly - r) > r - 0.8)
                if rim: cv.set(x, y, 'g' if lx < w / 2 and ly < h - 1 else 'h')
                elif ly > (w / 2 if not twin else w / 4) and ly % 3 == 0 and 1 < lx < w - 2 and (lx * 7 + ly) % 9: cv.set(x, y, 'h')
                else: cv.set(x, y, 'D')
    board(3, 11, 8, 24)
    board(15, 18, 4, 30, twin=True)
    board(34, 11, 8, 24)
    for y in range(36, 44):  # flagon, chalice, alms dish in silver
        for x in range(15, 20):
            if abs(x - 17) <= (2 if y > 37 else 1): cv.set(x, y, 'Q' if x < 17 else 'q')
    cv.set(20, 38, 'q'); cv.set(20, 39, 'q')
    for (x, y, ch) in ((26, 39, 'Q'), (27, 39, 'Q'), (28, 39, 'q'), (27, 40, 'q'), (27, 41, 'q'), (26, 42, 'Q'), (27, 42, 'q'), (28, 42, 'q')): cv.set(x, y, ch)
    for x in range(30, 36): cv.set(x, 42, 'Q' if x < 33 else 'q')
    def table(x, y, a):
        if y == 43 and a <= 16: return 'W'
        if 44 <= y <= 51 and a <= 17:
            if y == 51: return 'g' if x % 2 else 'h'
            return 'R' if y == 44 else ('x' if a % 5 == 4 else 'r')
        if 52 <= y <= 56 and a in (14, 15):
            return 'e' if y % 2 else 'E'
        if 52 <= y <= 56 and a <= 13 and y == 55: return 'e'
        return None
    cv.fill(table)
    for x in range(0, 48):    # the communion rail, balusters on a sill
        cv.set(x, 54, 'E'); cv.set(x, 55, 'e')
        cv.set(x, 61, 'e')
        if x % 3 == 1:
            for y in range(56, 61): cv.set(x, y, 'E' if y in (56, 58) else 'e')
    cv.right(shade={'Q': 'q', 'E': 'e'})
    SPRITES['reformed'] = {'rows': cv.rows(), 'ink': {**GOLD, **LINEN,
        'D': 0x16131a, 'Q': 0xd8dce0, 'q': 0x9aa0a8, 'R': 0xa8303a, 'r': 0x7a1a26, 'x': 0x4a0e18,
        'E': ['wood', 4], 'e': ['wood', 2]}}

# ---------------------------------------------------------------- mihrab
def mihrab():
    W, H = 48, 62
    cv = Canvas(W, H)
    cx = 23.5
    def frame(x, y, a):
        if a > 17 or y < 2 or y > 61: return None
        if a >= 15 or y <= 4:   # calligraphy band: white thuluth on deep blue
            edge = a == 17 or y == 2
            if edge: return 'g'
            return 'W' if ((x * 5 + y * 3) % 7 == 0 or (y == 3 and x % 4 == 1) or (a == 16 and y % 4 == 1)) else 'V'
        if a == 14 or y == 5: return 'g'
        # Pointed arch: two arcs meeting above the centre.
        d_l = math.hypot(x - (cx - 3), y - 22)
        d_r = math.hypot(x - (cx + 3), y - 22)
        arch = max(d_l, d_r) if y < 22 else (a + 3)
        if arch <= 9.2 and y >= 7:
            if y >= 57: return 'm' if y == 57 else 'M'
            return None  # the niche, drawn below
        if arch <= 11.5 and y >= 6:
            ang = math.atan2(y - 22, x - cx)
            return 'r' if int((ang + 4) * 6) % 2 else 'W'
        # Spandrels: arabesque on turquoise.
        if y < 44:
            return 'W' if ((x - y) % 5 == 0 and (x + y) % 3 == 0) or ((x + y) % 7 == 0 and y % 2) else ('T' if (x + y) % 2 else 't')
        # Iznik tiles below the arch.
        tx, ty = x % 6, y % 6
        return 'W' if tx in (0, 3) and ty in (0, 3) else ('V' if (tx + ty) % 3 == 0 else ('t' if (tx * ty) % 4 == 1 else 'I'))
    cv.fill(frame)
    for y in range(7, 57):
        for x in range(10, 38):
            if cv.get(x, y) == '.' and abs(x - cx) < 10:
                d_l = math.hypot(x - (cx - 3), y - 22); d_r = math.hypot(x - (cx + 3), y - 22)
                if (max(d_l, d_r) if y < 22 else abs(x - cx) + 3) <= 9.2:
                    if y < 20:   # muqarnas hood: tiers of little cells
                        tier = (y - 7) // 3
                        cv.set(x, y, 'g' if (x + tier) % 3 == 0 else ('k' if (y - 7) % 3 == 2 else 'h'))
                    else:
                        cv.set(x, y, 'X' if abs(x - cx) < 6 else 'K')
    for y in range(20, 31): cv.set(23, y, 'k')
    lamp = ["..ggg..", ".tTTTt.", "tTg*gTt", ".tTTTt.", "..tTt..", ".gTTTg.", "gtttttg", ".kkkkk."]
    cv.stamp(lamp, 20, 30)
    for col in (11, 36):
        for y in range(22, 57): cv.set(col, y, 'M' if col < 24 else 'm')
        cv.set(col - 1, 22, 'g'); cv.set(col + 1, 22, 'h'); cv.set(col, 21, 'g')
    cv.right(shade={'M': 'm', 'T': 't'})
    SPRITES['mihrab'] = {'rows': cv.rows(), 'ink': {**GOLD, 'W': 0xf0ece0, 'I': 0xd8e4e8, 'V': 0x1e2c6a, 'r': 0xa8302a,
        'T': 0x3a9aa0, 't': 0x2a6a80, 'M': 0xece6da, 'm': 0xc4bcb0, 'X': 0x2a1c22, 'K': 0x1a1016}}

romanesque()
reformed()
mihrab()
buddha_cn()
buddha_jp()
hindu()
classical()
mesopotamian()
maya()

# ---------------------------------------------------------------- civic
def chair(cv, x0, y0, tall, wood=('E', 'e', 'q'), seat='R'):
    """A chair seen from the front: back of `tall` px, seat, legs."""
    E, e, q = wood
    for y in range(y0, y0 + tall):
        cv.set(x0, y, E); cv.set(x0 + 5, y, e)
        for x in range(x0 + 1, x0 + 5): cv.set(x, y, seat if 2 <= y - y0 < tall - 1 else e)
    cv.set(x0, y0 - 1, E); cv.set(x0 + 5, y0 - 1, e)
    for x in range(x0, x0 + 6): cv.set(x, y0 + tall, E if x < x0 + 3 else e); cv.set(x, y0 + tall + 1, q)
    for y in range(y0 + tall + 2, y0 + tall + 5): cv.set(x0, y, e); cv.set(x0 + 5, y, q)

def dais(cv, y0, a_max=23):
    for y in range(y0, 62):
        for x in range(48):
            a = cv.a(x)
            step = 0 if y < y0 + 5 else 1
            if a <= a_max - step * 2:
                cv.set(x, y, 'E' if y in (y0, y0 + 5) else ('q' if y in (y0 + 4, 61) else 'e'))

def dais_europe():
    cv = Canvas(48, 62)
    # The cloth of estate: a tester and a hanging behind the mayor's chair.
    for y in range(6, 44):
        for x in range(14, 34):
            if y < 10: cv.set(x, y, 'g' if y == 6 else ('R' if y < 9 else 'k'))
            elif 15 <= x <= 32: cv.set(x, y, 'R' if (x - y) % 7 else 'r')
    for x in range(14, 34, 2): cv.set(x, 10, 'g')
    # The town's arms: a shield, quartered, on the hanging.
    for y in range(13, 26):
        half = 6 if y < 21 else 6 - (y - 20)
        for x in range(int(23.5 - half), int(23.5 + half) + 1):
            q = (x < 24) == (y < 19)
            cv.set(x, y, 'G' if abs(x - 23.5) >= half - 0.5 or y == 13 else ('B' if q else 'g'))
    for (x, y) in ((21, 16), (21, 17), (26, 21), (26, 22), (25, 21)): cv.set(x, y, 'g')
    chair(cv, 21, 29, 15)
    chair(cv, 6, 36, 8)
    chair(cv, 36, 36, 8)
    dais(cv, 49)
    cv.right(shade={'E': 'e', 'g': 'h'})
    SPRITES['dais-europe'] = {'rows': cv.rows(), 'ink': {**GOLD, 'R': 0x8a1e26, 'r': 0x6a1420, 'B': 0x2a3a8a,
        'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1]}}

def tribunal():
    cv = Canvas(48, 62)
    for y in range(2, 46):   # the apse niche, painted, with the emperor's statue
        for x in range(8, 40):
            r = math.hypot(x - 23.5, y - 18)
            if y < 18 and r > 15.5: continue
            rim = r > 14.5 or x in (8, 39)
            cv.set(x, y, 'M' if rim and x < 24 else ('m' if rim else ('X' if y < 30 else 'x')))
    emperor = [
        "....MMM....",
        "...MMMMm...",
        "...MSSsm...",
        "....Mmm....",
        "..MMMMMMm..",
        ".MMRMMMmmm.",
        "MM.RMMMmm.m",
        "M..RMMMmm..",
        "...RMMMmmm.",
        "..MRMMMmmmm",
        "..MRMMMmmmm",
        "..MRMMmmmmm",
        "..MRMMmmmmm",
        "..MRMMmmmm.",
        "..MRMmmmmm.",
        "...MMmmmm..",
        "...MM.mm...",
        "..MMm.mmm..",
        "mmmmmmmmmmm",
    ]
    cv.stamp(emperor, 18, 12)
    for x in range(10, 38):
        cv.set(x, 33, 'r'); cv.set(x, 35, 'r')
        cv.set(x, 34, 'G' if x % 3 else 'r')
    for y in range(36, 62):  # podium with steps
        for x in range(48):
            a = cv.a(x)
            if y < 52 and a <= 19: cv.set(x, y, 'M' if y in (36, 37) else ('m' if (y == 51 or a == 19) else 'M'))
            elif y >= 52 and a <= 23 - (61 - y) // 3: cv.set(x, y, 'M' if (y - 52) % 3 == 0 else 'm')
    curule = ["G.......G", ".G.....G.", "WWWWWWWWW", "..G...G..", "...G.G...", "....G....", "...G.G...", "..G...G..", ".G.....G."]
    cv.stamp(curule, 19, 27)
    for x in (4, 43):   # fasces: rods bound round an axe
        for y in range(24, 50):
            cv.set(x, y, 'e'); cv.set(x + 1, y, 'E' if y % 4 else 'r')
        for (dx, dy) in ((-2, 22), (-1, 22), (-2, 23), (-1, 23), (-1, 24)): cv.set(x + dx if x < 24 else x - dx + 1, dy, 'M')
    cv.right(shade={'M': 'm'})
    SPRITES['tribunal'] = {'rows': cv.rows(), 'ink': {**GOLD, **FLESH, 'M': 0xf0e8da, 'm': 0xc8bfae, 'X': 0x7a3a2a, 'x': 0x5a2a20,
        'R': 0x8a2a5a, 'r': 0xa8302a, 'W': 0xf4ecdc, 'E': 0xb08a5a, 'e': 0x7a5a3a}}

def dais_plain():
    cv = Canvas(48, 62)
    for y in range(4, 40):   # a hanging in the room's own colour
        for x in range(16, 32):
            if y == 4: cv.set(x, y, 'E')
            elif y > 34 and abs(x - 23.5) > (39 - y) * 1.6: continue
            else: cv.set(x, y, 'A' if x in (16, 31) or y in (5, 34) else ('a' if (x + y) % 9 else 'A'))
    for y in range(12, 24):
        for x in range(20, 28):
            if abs(x - 23.5) + abs(y - 18) <= 5: cv.set(x, y, 'L' if abs(x - 23.5) + abs(y - 18) > 3.5 else 'G')
    chair(cv, 21, 31, 11)
    for y in range(40, 48):   # a plain table
        for x in range(12, 36):
            cv.set(x, y, 'E' if y == 40 else ('e' if y < 43 else ('q' if x in (13, 34) else '.')))
    for x in range(15, 20): cv.set(x, 39, 'L')
    dais(cv, 50)
    cv.right(shade={'E': 'e'})
    SPRITES['dais-plain'] = {'rows': cv.rows(), 'ink': {**GOLD, 'A': ['acc', 2], 'a': ['acc', 3], 'L': ['linen', 5],
        'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1], 'R': ['acc', 2]}}

def school_grammar():
    cv = Canvas(48, 62)
    for y in range(4, 14):   # the motto board
        for x in range(8, 40):
            cv.set(x, y, 'g' if y in (4, 13) or x in (8, 39) else ('h' if y in (7, 10) and x % 4 and 10 < x < 37 else 'D'))
    for y in range(17, 27):  # hornbook and the birch
        for x in range(9, 15): cv.set(x, y, 'E' if x in (9, 14) or y in (17, 26) else ('D' if (y + x) % 3 else 'W'))
    cv.set(11, 27, 'E'); cv.set(12, 27, 'E'); cv.set(11, 28, 'e'); cv.set(12, 28, 'e')
    for k in range(10): cv.set(35 + k // 3, 17 + k, 'e'); cv.set(36 + k // 3, 17 + k, 'N')
    chair(cv, 21, 20, 13)
    for y in range(34, 50):  # the master's raised desk
        for x in range(13, 35):
            if y == 34: cv.set(x, y, 'E')
            elif y < 37: cv.set(x, y, 'e')
            else: cv.set(x, y, 'E' if x in (13, 23) else ('q' if x in (34, 24) or y == 49 else 'e'))
    for x in range(16, 21): cv.set(x, 33, 'W')
    cv.set(29, 33, 'D'); cv.set(29, 32, 'W')
    dais(cv, 50)
    cv.right(shade={'E': 'e'})
    SPRITES['school-grammar'] = {'rows': cv.rows(), 'ink': {**GOLD, 'D': 0x1a1618, 'W': 0xece4d0, 'N': 0x6a4a2a, 'R': 0x6a3a2a,
        'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1]}}

def school_board():
    cv = Canvas(48, 62)
    for y in range(6, 30):   # blackboard, chalked
        for x in range(4, 30):
            frame = x in (4, 29) or y in (6, 29)
            chalk = (y in (10, 11) and 7 <= x <= 16 and (x - 7) % 4 != 3) or (y == 16 and 7 <= x <= 22 and x % 3) or (y == 21 and 7 <= x <= 19 and x % 4 != 1)
            cv.set(x, y, 'E' if frame else ('W' if chalk else ('D' if (x + y) % 11 else 'd')))
    for x in range(4, 30): cv.set(x, 30, 'e')
    for y in range(6, 28):   # world map, rolled down
        for x in range(32, 45):
            if y == 6: cv.set(x, y, 'E')
            else: cv.set(x, y, 'S' if ((x * 7 + y * 3) % 13 < 5 and 9 < y < 26) else 'b')
    for y in range(34, 50):  # teacher's desk, a bell and a globe on it
        for x in range(10, 38):
            cv.set(x, y, 'E' if y == 34 else ('e' if y < 38 else ('q' if x in (10, 37) or y == 49 else ('e' if x in (11, 36) else '.'))))
    for (x, y, c) in ((15, 32, 'G'), (14, 33, 'g'), (15, 33, 'g'), (16, 33, 'h')): cv.set(x, y, c)
    ellipse(cv, 30, 29, 2.6, 2.6, lambda e, x, y: 'S' if (x + y) % 3 == 0 else 'b')
    cv.set(30, 32, 'g'); cv.set(30, 33, 'g')
    dais(cv, 50)
    cv.right(shade={'E': 'e'})
    SPRITES['school-board'] = {'rows': cv.rows(), 'ink': {**GOLD, 'D': 0x2a3430, 'd': 0x34403a, 'W': 0xe8ece4, 'S': 0xc8b878, 'b': 0x6a9ab8,
        'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1]}}

def terakoya():
    cv = Canvas(48, 62)
    for k, x0 in enumerate((6, 13, 20, 27, 34)):   # calligraphy models hung up
        for y in range(6, 30):
            for x in range(x0, x0 + 6):
                cv.set(x, y, 'P' if y == 6 or x in (x0, x0 + 5) else ('K' if (x - x0 in (2, 3) and (y - 8) % 5 in (0, 1, 2) and y < 28 and (y + k) % 7) else 'W'))
    for y in range(40, 50):  # the master's low desk: brush, inkstone, paper
        for x in range(12, 36):
            cv.set(x, y, 'E' if y == 40 else ('e' if y < 43 else ('q' if x in (13, 34) else '.')))
    for x in range(15, 23): cv.set(x, 39, 'W')
    for x in (26, 27, 28): cv.set(x, 39, 'K')
    for y in range(35, 40): cv.set(31, y, 'N')
    cv.set(31, 34, 'K')
    for y in range(50, 62):
        for x in range(48): cv.set(x, y, 'T' if y == 50 else ('t' if y < 61 else 'q'))
    SPRITES['terakoya'] = {'rows': cv.rows(), 'ink': {**GOLD, 'W': 0xf0eadc, 'K': 0x1a1418, 'P': 0x8a6a4a, 'N': 0x6a4a2a,
        'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1], 'T': ['floor', 4], 't': ['floor', 3]}}

dais_europe()
tribunal()
dais_plain()
school_grammar()
school_board()
terakoya()

# ---------------------------------------------------------------- stages (144 px, nine tiles)
def stage_floor(cv, y0, ink=('E', 'e', 'q')):
    """The stage platform: planked top, a lip, the front boards to the floor."""
    E, e, q = ink
    for y in range(y0, cv.h):
        for x in range(cv.w):
            if y == y0: cv.set(x, y, E)
            elif y < y0 + 5: cv.set(x, y, E if x % 24 == 0 else e)
            elif y == y0 + 5: cv.set(x, y, q)
            else: cv.set(x, y, q if x % 16 == 0 else e if y % 2 else 'e')

def proscenium(cv, y_top, y_floor, inner, gold=('G', 'g', 'h', 'k')):
    G, g, h, k = gold
    for y in range(y_top, y_floor):
        for x in range(cv.w):
            if inner(x, y): continue
            cv.set(x, y, G if (x + y) % 9 == 0 else (g if x < cv.w // 2 else h))
    for y in range(y_top, y_floor):
        for x in range(cv.w):
            if inner(x, y) and (not inner(x - 1, y) or not inner(x + 1, y) or not inner(x, y - 1)): cv.set(x, y, k)

def footlights(cv, y):
    for x in range(6, cv.w - 6, 8): cv.set(x, y, '*'); cv.set(x, y + 1, 'k')

def stage_playhouse():
    cv = Canvas(144, 64)
    inner = lambda x, y: 14 <= x <= 129 and y >= 12 + max(0, 6 - min(x - 14, 129 - x) // 3)
    for y in range(12, 46):     # painted street scene
        for x in range(14, 130):
            sky = y < 26
            house = (x // 18) % 2 == 0 and y >= 18 + (x % 18 > 8)
            cv.set(x, y, ('Y' if y < 20 else 'y') if sky and not house else ('B' if house and (x % 18 in (4, 5, 12, 13) and y % 8 in (2, 3, 4)) else ('b' if house else 'c')))
    proscenium(cv, 4, 46, inner)
    for side in (0, 1):         # curtains swagged back
        for y in range(12, 46):
            reach = 16 - int((y - 12) * 0.35)
            for i in range(max(2, reach)):
                x = 14 + i if side == 0 else 129 - i
                cv.set(x, y, 'R' if (i + y // 3) % 4 else 'r')
    for x in range(14, 130): cv.set(x, 12, 'r'); cv.set(x, 13, 'R' if x % 6 else 'g')
    stage_floor(cv, 46)
    footlights(cv, 45)
    SPRITES['stage-playhouse'] = {'rows': cv.rows(), 'ink': {**GOLD, 'R': 0xa8202a, 'r': 0x6a1018, 'Y': 0x9ab8d8, 'y': 0xc8d8e4,
        'B': 0xe8d088, 'b': 0x8a7a68, 'c': 0x6a6a58, 'E': ['wood', 4], 'e': ['wood', 3], 'q': ['wood', 1]}}

def stage_elizabethan():
    cv = Canvas(144, 64)
    for y in range(4, 46):      # the tiring-house front: two doors, a gallery over them
        for x in range(4, 140):
            door = (24 <= x <= 40 or 103 <= x <= 119) and y >= 26
            gallery = 16 <= y <= 22 and 10 <= x <= 133
            if door: cv.set(x, y, 'K' if y > 27 and 26 <= x <= 38 or y > 27 and 105 <= x <= 117 else 'E')
            elif gallery: cv.set(x, y, 'E' if y in (16, 22) else ('K' if x % 10 not in (0, 1) else 'e'))
            else: cv.set(x, y, 'R' if (x // 12 + y // 10) % 2 and y < 16 else ('e' if x % 12 == 0 else 'E' if y % 9 == 0 else 'w'))
    for x in range(4, 140):     # the heavens, painted
        for y in range(0, 4): cv.set(x, y, 'B' if (x + y * 3) % 11 else 'G')
    for px in (14, 128):        # stage posts, painted as marble
        for y in range(4, 46): cv.set(px, y, 'M'); cv.set(px + 1, y, 'm'); cv.set(px + 2, y, 'm')
    stage_floor(cv, 46)
    for x in range(0, 144, 3): cv.set(x, 52, 'q')
    SPRITES['stage-elizabethan'] = {'rows': cv.rows(), 'ink': {**GOLD, 'R': 0x8a2a1a, 'B': 0x2a3a6a, 'K': 0x1a1210,
        'M': 0xe8e0d0, 'm': 0xb8b0a0, 'w': ['wall', 3], 'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1]}}

def stage_opera():
    cv = Canvas(144, 64)
    inner = lambda x, y: 18 <= x <= 125 and y >= 10 + max(0, 8 - min(x - 18, 125 - x) // 2)
    for y in range(10, 44):     # painted landscape: sky, distant hills, a temple
        for x in range(18, 126):
            hill = y > 30 - int(4 * math.sin(x / 9))
            temple = 62 <= x <= 82 and 22 <= y <= 34 and (x % 4 == 0 or y in (22, 23))
            cv.set(x, y, 'M' if temple else ('L' if hill and y > 36 else ('l' if hill else ('Y' if y < 22 else 'y'))))
    proscenium(cv, 0, 44, inner)
    for x in range(0, 144, 6):  # gilded cartouche ornament along the top
        cv.set(x, 2, 'G'); cv.set(x + 1, 3, 'G')
    ellipse(cv, 71.5, 4, 8, 4, lambda e, x, y: 'G' if e > 0.7 else 'R')
    for side in (0, 1):
        for y in range(10, 44):
            reach = 22 - int((y - 10) * 0.5)
            for i in range(max(3, reach)):
                x = 18 + i if side == 0 else 125 - i
                cv.set(x, y, 'R' if (i + y // 3) % 4 else 'r')
            cv.set(18 + max(3, reach) if side == 0 else 125 - max(3, reach), y, 'G')
    for x in range(18, 126): cv.set(x, 10, 'g'); cv.set(x, 11, 'R' if x % 6 else 'G'); cv.set(x, 12, 'r')
    stage_floor(cv, 44)
    footlights(cv, 43)
    for y in range(56, 64):     # the orchestra pit
        for x in range(10, 134): cv.set(x, y, 'K' if y > 56 else 'g')
    for x in range(16, 130, 10): cv.set(x, 58, 'W'); cv.set(x, 59, 'k')
    SPRITES['stage-opera'] = {'rows': cv.rows(), 'ink': {**GOLD, 'R': 0xb01c2a, 'r': 0x6a0e18, 'Y': 0xe8c8a0, 'y': 0xd8a888,
        'L': 0x4a6a3a, 'l': 0x6a8a5a, 'M': 0xf0e8d8, 'K': 0x140c10, 'W': 0xf0ecdc,
        'E': ['wood', 4], 'e': ['wood', 3], 'q': ['wood', 1]}}

def stage_noh():
    cv = Canvas(144, 64)
    for y in range(0, 10):      # the stage's own roof, under the theatre's
        for x in range(30, 130):
            a = abs(x - 79.5)
            if y >= a * 0.18 - 0.5 and y < 10: cv.set(x, y, 'k' if y == 9 else ('D' if (x + y) % 3 else 'd'))
    for y in range(10, 46):     # the kagami-ita, its great pine
        for x in range(36, 124): cv.set(x, y, 'B' if (x + y) % 7 else 'b')
    for (cx, cy, rx, ry) in ((80, 20, 22, 6), (66, 28, 16, 5), (96, 30, 14, 4.5), (80, 36, 10, 4)):
        ellipse(cv, cx, cy, rx, ry, lambda e, x, y: 'L' if (x * 3 + y) % 5 else 'l')
    for y in range(22, 46): cv.set(80 + (y - 22) // 6, y, 'N'); cv.set(81 + (y - 22) // 6, y, 'n')
    for px in (32, 126):        # corner pillars
        for y in range(8, 46): cv.set(px, y, 'E'); cv.set(px + 1, y, 'e'); cv.set(px + 2, y, 'e')
    for x in range(0, 34):      # the bridge running off to the left, its rail
        y = 38 - x // 6
        for k in range(0, 3): cv.set(x, y + k, 'E' if k == 0 else 'e')
        if x % 5 == 0:
            for k in range(1, 8): cv.set(x, y - k, 'e')
        cv.set(x, y - 7, 'E')
    for y in range(46, 52):
        for x in range(30, 130): cv.set(x, y, 'E' if y == 46 else 'e')
    for y in range(52, 64):     # white gravel before it
        for x in range(0, 144): cv.set(x, y, 'W' if (x * 7 + y * 3) % 5 else 'w')
    SPRITES['stage-noh'] = {'rows': cv.rows(), 'ink': {**GOLD, 'D': 0x2a2a30, 'd': 0x3a3a42, 'B': 0xd8c8a0, 'b': 0xc8b48a,
        'L': 0x3a6a3a, 'l': 0x2a4a2a, 'N': 0x5a3a24, 'n': 0x3a2416, 'W': 0xe8e4dc, 'w': 0xc8c4bc,
        'E': ['wood', 5], 'e': ['wood', 4]}}

def stage_kabuki():
    cv = Canvas(144, 64)
    for y in range(4, 46):      # the joshiki-maku: black, persimmon and green
        for x in range(0, 144):
            band = (x // 8) % 3
            cv.set(x, y, ('K', 'P', 'L')[band] if (x % 8) else ('k', 'p', 'l')[band])
    for x in range(0, 144):
        for y in range(0, 4): cv.set(x, y, 'E' if y in (0, 3) else 'e')
        if x % 12 == 6:
            for y in range(4, 10): cv.set(x, y, 'W')
    stage_floor(cv, 46)
    SPRITES['stage-kabuki'] = {'rows': cv.rows(), 'ink': {**GOLD, 'K': 0x1a1614, 'k': 0x0e0c0a, 'P': 0xc8582a, 'p': 0x9a3e1a,
        'L': 0x2a6a4a, 'l': 0x1a4a32, 'W': 0xe8e0d0, 'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1]}}

def stage_cinema():
    cv = Canvas(144, 64)
    inner = lambda x, y: 16 <= x <= 127 and y >= 8
    for y in range(8, 42):      # the screen, a picture on it
        for x in range(16, 128):
            lit = 24 <= x <= 119 and 12 <= y <= 38
            if not lit: cv.set(x, y, 'k'); continue
            hill = y > 30 - int(3 * math.sin(x / 7))
            cv.set(x, y, 'S' if not hill else 's')
    for y in range(18, 30):
        for x in range(60, 70): cv.set(x, y, 'd' if abs(x - 64.5) < 2 or y < 21 else 'S')
    proscenium(cv, 0, 42, inner)
    for x in range(0, 144, 8):  # zigzag deco band
        for k in range(4): cv.set(x + k, 3 + (k if k < 2 else 3 - k), 'G')
    for side in (0, 1):
        for y in range(8, 42):
            for i in range(8):
                x = 16 + i if side == 0 else 127 - i
                cv.set(x, y, 'R' if (i + y // 3) % 4 else 'r')
    stage_floor(cv, 42)
    for (x, y, c) in ((4, 50, 'X'), (5, 50, 'X'), (6, 50, 'X'), (137, 50, 'X'), (138, 50, 'X'), (139, 50, 'X')): cv.set(x, y, c)
    SPRITES['stage-cinema'] = {'rows': cv.rows(), 'ink': {**GOLD, 'R': 0x9a1a2a, 'r': 0x5a0e18, 'S': 0xd8dce4, 's': 0x9aa0a8,
        'd': 0x4a4e58, 'X': 0x30d060, 'E': ['wood', 4], 'e': ['wood', 3], 'q': ['wood', 1]}}

stage_playhouse()
stage_elizabethan()
stage_opera()
stage_noh()
stage_kabuki()
stage_cinema()

# ---------------------------------------------------------------- iconostasis (144 px)
def icon(cv, x0, y0, w, h, robe, child=False, wings=False):
    """An icon in its gilt frame: gold ground, a haloed figure in keyline."""
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            edge = x in (x0, x0 + w - 1) or y in (y0, y0 + h - 1)
            cv.set(x, y, 'k' if edge else ('G' if (x + y) % 5 == 0 else 'g'))
    cx = x0 + w // 2
    hy = y0 + max(3, h // 6)
    r = max(2, w // 5)
    ellipse(cv, cx, hy, r + 0.6, r + 0.6, lambda e, xx, yy: 'h' if e > 0.7 else None)
    ellipse(cv, cx, hy, r - 0.4, r - 0.2, lambda e, xx, yy: 'S' if e < 0.85 else 'K')
    for y in range(hy + r, y0 + h - 1):
        half = min(w // 2 - 1, 1 + (y - hy - r) // 2)
        for x in range(cx - half, cx + half + 1):
            cv.set(x, y, robe[0] if x < cx else robe[1])
        cv.set(cx - half, y, 'K'); cv.set(cx + half, y, 'K')
    if wings:
        for y in range(hy, hy + h // 2):
            cv.set(cx - w // 2 + 1, y, 'W'); cv.set(cx + w // 2 - 1, y, 'W')
    if child:
        ellipse(cv, cx + 1, hy + r + 4, 1.6, 1.6, lambda e, xx, yy: 'S')
        cv.set(cx + 1, hy + r + 6, 'W'); cv.set(cx + 2, hy + r + 6, 'W')

def screen_iconostasis():
    cv = Canvas(144, 64)
    for y in range(4, 56):      # the gilt screen
        for x in range(6, 138):
            cv.set(x, y, 'G' if y in (4, 12, 21) else ('k' if y in (11, 20) else ('h' if (x + y) % 3 else 'g')))
    for k in range(14):         # Deesis row, Christ at its centre
        x = 8 + k * 9 + (2 if k >= 7 else 0)
        icon(cv, x, 5, 8, 7, ('R', 'r') if k % 2 else ('B', 'b'))
    for k in range(14):         # feasts row
        x = 8 + k * 9 + (2 if k >= 7 else 0)
        for y in range(13, 20):
            for xx in range(x, x + 8):
                cv.set(xx, y, 'k' if xx in (x, x + 7) or y in (13, 19) else ('g' if (xx + y) % 4 else 'G'))
        for (dx, dy, c) in ((2, 16, 'R'), (3, 16, 'B'), (5, 15, 'L'), (4, 17, 'S'), (5, 17, 'W')): cv.set(x + dx, dy, c)
    # Sovereign row: Theotokos and child, the Royal Doors, Christ; archangels on the deacon doors.
    icon(cv, 45, 25, 14, 28, ('R', 'r'), child=True)
    icon(cv, 85, 25, 14, 28, ('B', 'b'))
    icon(cv, 25, 27, 12, 26, ('R', 'r'), wings=True)
    icon(cv, 107, 27, 12, 26, ('L', 'l'), wings=True)
    icon(cv, 9, 27, 12, 26, ('N', 'n'))
    icon(cv, 123, 27, 12, 26, ('N', 'n'))
    for y in range(22, 56):     # the Royal Doors, arched, gilt openwork, the Annunciation on their leaves
        for x in range(62, 82):
            a = abs(x - 71.5)
            if y < 26 and a > (y - 22) * 2.5 + 0.5: continue
            open_ = (x % 3 == 0 and y % 4 != 0 and 30 < y < 52)
            cv.set(x, y, 'k' if x in (71, 72) or a > 9 or y == 55 else ('K' if open_ else ('G' if (x + y) % 4 == 0 else 'g')))
    icon(cv, 63, 30, 8, 12, ('R', 'r'), wings=True)
    icon(cv, 73, 30, 8, 12, ('B', 'b'))
    for y in range(0, 5):       # the cross on top
        cv.set(71, y, 'G'); cv.set(72, y, 'g')
    for x in range(69, 75): cv.set(x, 1, 'G')
    for y in range(56, 64):     # the solea: a step of marble before the screen
        for x in range(0, 144): cv.set(x, y, 'M' if y in (56, 60) else ('m' if y < 60 else 'K'))
    for x in (40, 103):         # standing candles before the great icons
        cv.set(x, 50, '*')
        for y in range(51, 56): cv.set(x, y, 'C')
        cv.set(x - 1, 56, 'g'); cv.set(x + 1, 56, 'g')
    cv.right(shade={'G': 'g', 'M': 'm'})
    SPRITES['screen-iconostasis'] = {'rows': cv.rows(), 'ink': {**GOLD, 'S': 0xa8704a, 'K': 0x2a1810, 'W': 0xf0e8d8,
        'R': 0xa82a22, 'r': 0x6a1614, 'B': 0x2a4a9a, 'b': 0x1a2a5a, 'L': 0x3a7a4a, 'l': 0x22502e, 'N': 0x7a4a2a, 'n': 0x4a2a18,
        'M': 0xece4d6, 'm': 0xc4baa8, 'C': 0xf0dca0}}

screen_iconostasis()

# ---------------------------------------------------------------- assembly houses
def union_banner():
    cv = Canvas(48, 62)
    for x in range(4, 44): cv.set(x, 2, 'E'); cv.set(x, 3, 'e')
    for y in range(0, 50):          # the two carrying poles
        cv.set(4, y, 'E'); cv.set(43, y, 'e')
    for (x, y) in ((4, 0), (43, 0)): cv.set(x, y, 'G')
    for y in range(4, 40):          # the silk, gold-bordered, its foot cut in scallops
        for x in range(6, 42):
            if y > 36 and ((x - 6) % 6 in (0, 5)) == (y == 37): continue
            border = x in (6, 41) or y in (4, 36)
            cv.set(x, y, 'G' if border else ('g' if x in (7, 40) or y in (5, 35) else ('A' if (x + y) % 11 else 'a')))
    for y in range(6, 11):          # the scroll with the branch's name
        for x in range(10, 38): cv.set(x, y, 'W' if y in (6, 10) or x in (10, 37) else ('D' if y == 8 and x % 3 and 12 < x < 35 else 'w'))
    for y in range(12, 31):         # the painted roundel: clasped hands before a rising sun
        for x in range(12, 36):
            e = ((x - 23.5) / 11.5) ** 2 + ((y - 21) / 9.5) ** 2
            if e > 1: continue
            cv.set(x, y, 'G' if e > 0.82 else ('O' if y > 23 and (x * 3 + y) % 5 == 0 and abs(x - 23.5) < 9 else ('Y' if y > 22 else 'w')))
    hands = [
        "DDDD..............DDDD",
        "DDDDW............WDDDD",
        "DDDDWSSSSS..sSSSSWDDDD",
        "DDDDWSSSSSSssSSSSWDDDD",
        "DDDDWSSsSSSsSSSsSWDDDD",
        "DDDD.SSSSSSSSSSSS.DDDD",
        "DDDD...sSSssSSs...DDDD",
    ]
    cv.stamp(hands, 13, 18)
    for y in range(31, 35):         # motto under the roundel
        for x in range(13, 35): cv.set(x, y, 'W' if y in (31, 34) or x in (13, 34) else ('D' if y == 32 and x % 4 and 15 < x < 33 else 'w'))
    for x in (8, 39):               # tassels on gold cords
        for y in range(40, 45): cv.set(x, y, 'g')
        for y in range(45, 48): cv.set(x - 1, y, 'G'); cv.set(x, y, 'G'); cv.set(x + 1, y, 'g')
    for y in range(42, 50):         # the chairman's table: a cloth, the book, the jug
        for x in range(12, 36):
            cv.set(x, y, 'A' if y == 42 else ('a' if y < 48 else ('q' if x in (13, 34) else '.')))
    for x in range(16, 22): cv.set(x, 41, 'W')
    for x in range(16, 22): cv.set(x, 40, 'D' if x == 19 else 'W')
    for (x, y, c) in ((29, 37, 'M'), (29, 38, 'M'), (30, 38, 'm'), (28, 39, 'M'), (29, 39, 'M'), (30, 39, 'm'), (28, 40, 'M'), (29, 40, 'M'), (30, 40, 'm'), (31, 39, 'm'), (28, 41, 'M'), (29, 41, 'm'), (30, 41, 'm')): cv.set(x, y, c)
    dais(cv, 50)
    cv.right(shade={'E': 'e', 'G': 'g'})
    SPRITES['union-banner'] = {'rows': cv.rows(), 'ink': {**GOLD, **FLESH, 'A': ['acc', 3], 'a': ['acc', 2], 'W': 0xf4ecd8, 'w': 0xe8dcc0,
        'D': 0x24202a, 'Y': 0xe8b040, 'O': 0xf0d080, 'M': 0xd8d4cc, 'm': 0xa8a49c, 'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1]}}

def codex_seat():
    cv = Canvas(48, 62)
    for y in range(2, 30):          # a painted hanging: the sun disc of the calendar
        for x in range(8, 40):
            cv.set(x, y, 'R' if x in (8, 39) or y in (2, 29) else ('r' if (x + y) % 2 else 'R'))
    ellipse(cv, 23.5, 15.5, 10, 10, lambda e, x, y: 'Y' if e > 0.8 else ('B' if e > 0.6 else ('y' if e > 0.35 else ('L' if (x + y) % 3 else 'Y'))))
    for k in range(8):
        ang = k * math.pi / 4
        for t in (10.5, 11.5, 12.5):
            cv.set(int(23.5 + math.cos(ang) * t), int(15.5 + math.sin(ang) * t * 0.95), 'Y')
    for y in range(20, 42):         # the icpalli: a high-backed seat of woven reed
        for x in range(17, 31):
            if y < 22 and abs(x - 23.5) > 5 + (y - 20): continue
            cv.set(x, y, 'N' if x in (17, 30) or y == 20 else ('n' if (x + y) % 3 == 0 else 'T'))
    for y in range(28, 44):         # the jaguar pelt over it
        for x in range(19, 29):
            if y > 41 and abs(x - 23.5) > 3: continue
            cv.set(x, y, 'K' if ((x * 5 + y * 3) % 7 == 0 or (x * 3 + y * 5) % 11 == 0) else ('J' if (x + y) % 5 else 'j'))
    for k in range(7):              # the screenfold, open on a mat before it
        x0 = 3 + k * 6
        for y in range(45, 50):
            for x in range(x0, x0 + 6):
                cv.set(x, y, 'r' if y in (45, 49) or x == x0 else 'W')
        glyphs = ('B', 'R', 'K', 'Y', 'L')
        cv.set(x0 + 2, 47, glyphs[k % 5]); cv.set(x0 + 3, 47, glyphs[(k + 2) % 5]); cv.set(x0 + 2, 46, glyphs[(k + 3) % 5]); cv.set(x0 + 4, 48, 'K')
    for x in (5, 42):               # long-handled censers of copal, smoking
        for y in range(38, 44): cv.set(x, y, 'c' if y > 39 else 'C')
        cv.set(x - 1, 38, 'C'); cv.set(x + 1, 38, 'c')
        cv.set(x, 37, '*'); cv.set(x, 36, '%')
        for (dx, dy) in ((0, 34), (1, 33), (0, 32), (-1, 31)): cv.set(x + dx, dy, 'S')
    for y in range(50, 62):
        for x in range(48): cv.set(x, y, 'P' if y == 50 else ('p' if y < 61 else 'q'))
    SPRITES['codex-seat'] = {'rows': cv.rows(), 'ink': {'R': 0x9a2a1e, 'r': 0x86241a, 'Y': 0xe0b040, 'y': 0xc89030, 'B': 0x2a7a8a, 'L': 0x3a8a4a,
        'N': 0x6a4a28, 'n': 0x8a6a3a, 'T': 0xb89858, 'J': 0xd8a040, 'j': 0xc08a30, 'K': 0x1e1814, 'W': 0xf0e6d0,
        'C': 0xb0663a, 'c': 0x8a4a2a, 'S': 0xc8c4bc, 'P': 0xe4dccc, 'p': 0xd0c6b2, 'q': 0x8a7e6a}}

def guru_seat():
    cv = Canvas(48, 62)
    for x in range(2, 46):          # a toran of mango leaves across the top
        cv.set(x, 2, 'N')
        if x % 4 == 2:
            for (dx, dy) in ((0, 3), (-1, 4), (0, 4), (1, 4), (-1, 5), (0, 5), (1, 5), (0, 6), (0, 7)): cv.set(x + dx, dy, 'L' if dx <= 0 else 'l')
        elif x % 4 == 0: cv.set(x, 3, 'O'); cv.set(x, 4, 'o')
    for y in range(10, 34):         # a niche: the kalasha and its lamp
        for x in range(16, 32):
            a = abs(x - 23.5)
            if y < 16 and math.hypot(a, (16 - y) * 1.3) > 8: continue
            cv.set(x, y, 'X' if math.hypot(a, max(0, 16 - y) * 1.3) > 7 or x in (16, 31) else 'x')
    ellipse(cv, 23.5, 26, 4.5, 4, lambda e, x, y: 'G' if x < 23 and e < 0.5 else ('g' if e < 0.85 else 'h'))
    for x in range(21, 27): cv.set(x, 22, 'h')
    for (dx, dy) in ((-3, 20), (-2, 19), (-1, 19), (0, 18), (1, 19), (2, 19), (3, 20), (-2, 21), (2, 21)): cv.set(int(23.5 + dx), dy, 'L')
    ellipse(cv, 23.5, 19, 2, 1.8, lambda e, x, y: 'n' if e > 0.6 else 'N')
    for y in range(36, 46):         # the teacher's low seat, a deerskin on it
        for x in range(10, 38):
            cv.set(x, y, 'E' if y == 36 else ('e' if y < 44 else 'q'))
    for y in range(32, 37):
        for x in range(14, 34):
            if y == 32 and abs(x - 23.5) > 8: continue
            cv.set(x, y, 'k' if (x * 7 + y * 5) % 9 == 0 else ('D' if (x + y) % 4 else 'd'))
    for (x, y) in ((12, 33), (13, 34), (34, 34), (35, 33)): cv.set(x, y, 'D')
    for y in range(41, 50):         # the pothi on its folding stand, a lamp, marigolds
        for x in range(4, 13):
            if y < 44: cv.set(x, y, 'P' if y < 43 else 'p')
            elif abs((x - 8) - (y - 46)) < 1 or abs((x - 8) + (y - 46)) < 1: cv.set(x, y, 'e')
    for x in range(5, 12): cv.set(x, 42, 'p' if x % 3 == 0 else 'P')
    for (x, y, c) in ((40, 46, '*'), (40, 45, '%'), (38, 48, 'g'), (39, 48, 'G'), (40, 48, 'G'), (41, 48, 'g'), (42, 48, 'h'), (39, 47, 'g'), (40, 47, 'g'), (41, 47, 'h'), (40, 49, 'h')): cv.set(x, y, c)
    for (x, y) in ((15, 48), (17, 49), (19, 48), (28, 48), (30, 49), (32, 48)):
        cv.set(x, y, 'O'); cv.set(x + 1, y, 'o'); cv.set(x, y + 1, 'o')
    for y in range(50, 62):
        for x in range(48): cv.set(x, y, 'T' if y == 50 else ('t' if y < 61 else 'q'))
    cv.right(shade={'E': 'e'})
    SPRITES['guru-seat'] = {'rows': cv.rows(), 'ink': {**GOLD, 'N': 0x5a3a1e, 'n': 0x8a5a2a, 'L': 0x3a7a2a, 'l': 0x2a5a1e, 'O': 0xf0a020, 'o': 0xd07a10,
        'X': 0x8a3a2a, 'x': 0x5a2a20, 'D': 0xb08050, 'd': 0x9a6a40, 'k': 0xf0e0c0, 'P': 0xd8b878, 'p': 0x9a7a48,
        'E': ['wood', 4], 'e': ['wood', 2], 'q': ['wood', 1], 'T': ['floor', 4], 't': ['floor', 3]}}

union_banner()
codex_seat()
guru_seat()

def orator_stool():
    cv = Canvas(48, 62)
    # The ancestor whose back is the stool's: a long-nosed face, cowrie eyes, the body carved to the seat.
    for y in range(4, 44):
        for x in range(14, 34):
            a = abs(x - 23.5)
            if y < 22:
                e = math.hypot(a / 7.5, (y - 13) / 9.5)
                if e > 1: continue
                eye = math.hypot(a - 3.5, y - 11)
                ch = 'W' if eye < 1.2 else ('K' if eye < 2.2 else ('O' if e > 0.82 else 'R'))
                if a < 1 and 8 <= y <= 19: ch = 'W'
                if 19 <= y <= 20 and a < 3: ch = 'W'
                cv.set(x, y, ch)
            elif y < 37:
                if a > 4 + (2 if 26 <= y <= 28 else 0): continue
                cv.set(x, y, 'O' if y in (26, 30, 34) else ('W' if y in (27, 31) and a < 2 else ('R' if a < 2 else ('D' if (x + y) % 3 else 'd'))))
            elif a < 2 or 4 < a < 6: cv.set(x, y, 'D')
    for y in range(33, 37):         # the seat, struck with a bundle of leaves as the orator speaks
        for x in range(9, 39): cv.set(x, y, 'O' if y == 33 else ('D' if y < 36 else 'd'))
    for (x, y) in ((12, 31), (13, 30), (14, 30), (15, 31), (13, 32), (14, 32), (11, 32)): cv.set(x, y, 'L')
    for (x, y) in ((12, 30), (15, 30), (16, 31)): cv.set(x, y, 'l')
    for x0, flip in ((1, False), (27, True)):   # slit gongs lying on the floor, crocodile heads at their ends
        for y in range(40, 50):
            for x in range(x0, x0 + 20):
                e = abs(y - 45) / 5
                if e > 1: continue
                slit = y in (41, 42) and x0 + 4 <= x < x0 + 16
                cv.set(x, y, 'K' if slit else ('O' if y == 40 or (x - x0) % 6 == 0 and y < 47 else ('V' if y < 44 else ('v' if y < 48 else 'd'))))
        hx = x0 + 18 if not flip else x0 + 1
        for (dx, dy) in ((0, 43), (1, 43), (0, 44), (1, 44), (2, 44), (0, 45), (1, 45)): cv.set(hx + (dx if not flip else -dx), dy, 'D')
        cv.set(hx + (1 if not flip else -1), 43, 'W')
    for y in range(50, 62):
        for x in range(48): cv.set(x, y, 'T' if y == 50 else ('t' if y < 61 else 'q'))
    cv.right(shade={'D': 'd'})
    SPRITES['orator-stool'] = {'rows': cv.rows(), 'ink': {'R': 0xa8442a, 'O': 0xd8a040, 'W': 0xece4d0, 'K': 0x140e0c,
        'D': 0x4a3020, 'd': 0x2e1e14, 'V': 0x8a6a4a, 'v': 0x6a4e34, 'L': 0x3a7a2a, 'l': 0x8a3a6a, 'T': ['floor', 4], 't': ['floor', 3], 'q': ['floor', 1]}}

def huehuetl():
    cv = Canvas(48, 62)
    # Tezcatlipoca's smoking mirror: obsidian in a ring of quetzal and gold feathers, smoke curling off it.
    for y in range(0, 26):
        for x in range(10, 38):
            r = math.hypot(x - 23.5, (y - 12) * 1.1)
            ang = math.atan2(y - 12, x - 23.5)
            if r < 6: cv.set(x, y, 'w' if r < 4.5 and (x - 21) ** 2 + (y - 9) ** 2 < 4 else ('K' if r < 5 else 'G'))
            elif r < 8: cv.set(x, y, 'g' if r < 7 else 'h')
            elif r < 12 and (int((ang + 3.2) * 4.5) % 2 == 0): cv.set(x, y, 'L' if r < 10.5 else 'l')
    for (x, y) in ((22, 2), (23, 1), (24, 0), (27, 3), (28, 2)): cv.set(x, y, 'S')
    # The huehuetl: a hide head seen from above, the body carved with a frieze, the legs cut in steps.
    ellipse(cv, 23.5, 27.5, 8, 2.5, lambda e, x, y: 'J' if (x * 5 + y * 3) % 7 else 'K')
    for y in range(28, 50):
        for x in range(15, 33):
            a = abs(x - 23.5)
            if a > 8: continue
            lit = 'E' if x < 21 else ('e' if x > 27 else 'F')
            if y == 30 or y == 38: cv.set(x, y, 'O')
            elif y < 38: cv.set(x, y, 'O' if ((x - y) % 4 == 0 and y < 37 and 31 < y) else lit)
            elif y < 44: cv.set(x, y, lit)
            elif not (1.5 < a < 5.5) and not (a < 1.5 and y > 46): cv.set(x, y, lit)
    for y in range(40, 50):         # the teponaztli on its rope ring, rubber-tipped mallets
        for x in range(1, 14):
            e = abs(y - 44) / 3.2
            if y < 47 and e <= 1: cv.set(x, y, 'K' if y == 41 and 3 <= x <= 11 and x != 7 else ('O' if y == 41 else ('E' if y < 45 else 'e')))
            elif y >= 47 and 3 <= x <= 11: cv.set(x, y, 'T' if (x + y) % 2 else 'N')
    for (x, y) in ((3, 38), (4, 39), (5, 40), (11, 38), (10, 39)): cv.set(x, y, 'e')
    cv.set(2, 37, 'K'); cv.set(12, 37, 'K')
    for y in range(32, 50):         # a shield and spear-thrower stood by the wall
        for x in range(36, 46):
            if math.hypot(x - 40.5, y - 38) <= 4.8: cv.set(x, y, 'O' if math.hypot(x - 40.5, y - 38) > 3.8 else ('B' if (x + y) % 3 else 'W'))
        cv.set(44, y, 'e')
    for y in range(50, 62):
        for x in range(48): cv.set(x, y, 'P' if y == 50 else ('p' if y < 61 else 'q'))
    SPRITES['huehuetl'] = {'rows': cv.rows(), 'ink': {**GOLD, 'K': 0x14100e, 'w': 0x6a6a7a, 'S': 0xb8b4ac, 'J': 0xd8a040, 'L': 0x2a8a5a, 'l': 0x1a6a4a,
        'O': 0xc8902a, 'E': 0xa06a3a, 'F': 0x8a5a32, 'e': 0x5a3a20, 'B': 0x2a7aa8, 'W': 0xe8e0d0, 'T': 0xb89858, 'N': 0x7a5a30,
        'P': 0xe4dccc, 'p': 0xd0c6b2, 'q': 0x8a7e6a}}

orator_stool()
huehuetl()

import os
with open(os.path.join(os.path.dirname(__file__), '../../src/render/interiors/altars.ts'), 'w') as out:
    out.write('// Generated by scripts/art/compose_altars.py; edit the art there and rerun it.\n')
    out.write('/** An altar\'s pixels: a char per pixel, `.` clear, `*` a flame; `ink` maps the\n')
    out.write(' * rest to a fixed colour or to a step on one of the room\'s ramps. */\n')
    out.write('export type AltarArt = { rows: readonly string[]; ink: Record<string, number | readonly [string, number]> };\n\n')
    out.write('export const ALTARS: Record<string, AltarArt> = {\n')
    for name, sp in SPRITES.items():
        out.write(f'  {json.dumps(name)}: {{\n    rows: [\n')
        for r in sp['rows']: out.write(f'      {json.dumps(r)},\n')
        out.write('    ],\n    ink: {')
        out.write(', '.join(f'{json.dumps(k)}: {json.dumps(v) if isinstance(v, list) else hex(v)}' for k, v in sp['ink'].items()))
        out.write('},\n  },\n')
    out.write('};\n')

