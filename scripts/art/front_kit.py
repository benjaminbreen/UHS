"""Front-on building kit: parts that read their geometry and palette from a
spec, so a narrower, wider, taller or recoloured building is a new spec, not a
new painter.

    .venv/bin/python scripts/art/front_kit.py artifacts/front-kit.png

The sheet sets every immeuble spec beside the atlas frame it replaces, at 3x,
with the live adult for scale. Numbers live in front_style.py.
"""
from pathlib import Path
import math
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_style import (  # noqa: E402
    BAY, CARRIAGE, CORNICE, CORNICE_TOP, GROUND, HEADROOM, MANSARD, MARGIN,
    NOBLE, OUTLINE_K, ROOF_TOP, SLAB, UPPER,
)


def H(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


def ramp(*hexes):
    return [H(h) for h in hexes]


def darken(c, f, tint=(1, 1, 1)):
    return tuple(min(255, int(c[i] * f * tint[i])) for i in range(3)) + (c[3],)


def mid(a, b):
    return tuple((a[i] + b[i]) // 2 for i in range(3)) + (255,)


def h2(x, y, s=0):
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 0xFFFF


class C:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w, h))
        self.px = self.im.load()

    def p(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = c

    def g(self, x, y):
        return self.px[x, y] if 0 <= x < self.w and 0 <= y < self.h else (0, 0, 0, 0)

    def rect(self, x, y, w, h, c):
        for yy in range(max(0, y), min(self.h, y + h)):
            for xx in range(max(0, x), min(self.w, x + w)):
                self.px[xx, yy] = c


# ------------------------------------------------------------------ palettes

STONE = {
    'lime': ramp('fbf2de', 'ecdec2', 'd9c7a6', 'bca784', '8f7a62', '5e4c48'),
    'warm': ramp('fdeed6', 'f0d9b6', 'dcc09a', 'c09f7c', '937660', '604a46'),
}
SHOP = {
    'green': ramp('6aa67a', '468a5c', '306a46', '214c34', '15301f'),
    'navy': ramp('7088bc', '4c6298', '364a7a', '26365c', '182440'),
    'oxblood': ramp('c06a62', '9c4648', '7a3038', '58222c', '3a1620'),
}
AWNING = {
    'red': (ramp('f7f0e2', 'e2d6c2', 'c4b6a0'), ramp('e05a52', 'bc3e40', '8e2c36')),
    'green': (ramp('f7f0e2', 'e2d6c2', 'c4b6a0'), ramp('5e9e6e', '3e7a52', '2a5a3c')),
}
COMMON = dict(
    slate=ramp('7f8bb0', '65719a', '515c84', '414a6e', '323957', '252a42'),
    zinc=ramp('8d97b4', '77819f', '636c8b', '525a77', '424862', '33384e'),
    joinery=ramp('f4f1ea', 'dcd6cc', 'b4ada2', '857e76'),
    glass=ramp('cfe6f2', '88b4d0', '4f7aa6', '37557e', '26375a'),
    iron=ramp('7e8598', '4f5468', '353949', '23262f'),
    gilt=ramp('fff0a8', 'f0c860', 'b88a34', '7a5422'),
    flue=ramp('e7a07a', 'c8764e', '9e5638', '6c3828'),
    lit=ramp('fff4c8', 'ffd878', 'f0a848'),
)


# ------------------------------------------------------------------ lettering

FONT = {
    'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110',
    'E': '111100110100111', 'F': '111100110100100', 'G': '011100101101011', 'H': '101101111101101',
    'I': '111010010010111', 'J': '001001001101010', 'K': '101101110101101', 'L': '100100100100111',
    'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010', 'P': '110101110100100',
    'Q': '010101101110011', 'R': '110101110101101', 'S': '011100010001110', 'T': '111010010010010',
    'U': '101101101101111', 'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101',
    'Y': '101101010010010', 'Z': '111001010100111', ' ': '000000000000000',
}


def text_w(s):
    return len(s) * 4 - 1


def text(c, x, y, s, col, shadow):
    for k, ch in enumerate(s):
        bits = FONT.get(ch, FONT[' '])
        for j in range(5):
            for i in range(3):
                if bits[j * 3 + i] == '1':
                    c.p(x + k * 4 + i + 1, y + j + 1, shadow)
                    c.p(x + k * 4 + i, y + j, col)


# ------------------------------------------------------------------ primitives

def hband(c, x, y, w, cols):
    for k, col in enumerate(cols):
        c.rect(x, y + k, w, 1, col)


def raised(c, x, y, w, h, r, light=0, body=1, dark=3):
    """A block standing proud of the wall: lit top and left, shaded bottom and right."""
    c.rect(x, y, w, h, r[body])
    c.rect(x, y, w, 1, r[light])
    c.rect(x, y, 1, h, r[light])
    c.rect(x, y + h - 1, w, 1, r[dark])
    c.rect(x + w - 1, y + 1, 1, h - 1, r[dark])


def cast(c, x, y, w, n, k0=0.66):
    """Soft shadow thrown down onto the wall by anything projecting above."""
    for i in range(n):
        f = k0 + (1 - k0) * i / n
        for xx in range(x, x + w):
            q = c.g(xx, y + i)
            if q[3]:
                c.p(xx, y + i, darken(q, f, (0.96, 0.94, 1.06)))


def outline(c):
    """Outline tinted from the colour it touches, never flat black."""
    todo = []
    for y in range(c.h):
        for x in range(c.w):
            if c.px[x, y][3]:
                continue
            for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1)):
                q = c.g(x + dx, y + dy)
                if q[3]:
                    todo.append((x, y, tuple(int(q[i] * OUTLINE_K * 0.6 + (42, 22, 34)[i] * 0.4) for i in range(3)) + (255,)))
                    break
    for x, y, col in todo:
        c.px[x, y] = col


# ------------------------------------------------------------------ the building

class Front:
    """One building from a spec. Coordinates: the facade runs x0..x1, its
    ground line is `base`; parts are drawn top to bottom so each cast shadow
    lands on what is already there."""

    def __init__(self, spec):
        self.s = spec
        self.p = dict(COMMON, stone=STONE[spec.get('stone', 'lime')])
        self.W = spec['width']
        n = spec['bays']
        self.bay = spec.get('bay', BAY)
        self.margin = (self.W - n * self.bay) // 2
        self.x0 = 3
        self.x1 = self.x0 + self.W
        self.storeys = spec['storeys']
        hs = [NOBLE] + [UPPER] * (self.storeys - 2)
        self.heights = hs
        self.base = HEADROOM + ROOF_TOP + MANSARD + CORNICE + sum(hs) + GROUND
        self.c = C(self.W + 6, self.base)
        self.em = C(self.W + 6, self.base)
        self.windows = []

    def bay_x(self, i):
        return self.x0 + self.margin + self.bay * i + self.bay // 2

    # walls and mouldings --------------------------------------------------

    def wall(self, y, h, rusticated=False):
        c, r = self.c, self.p['stone']
        rh, bl = (8, 22) if rusticated else (7, 18)
        tone = mid(r[1], r[2])
        for yy in range(y, y + h):
            row, ly = (yy - y) // rh, (yy - y) % rh
            for xx in range(self.x0, self.x1):
                off = (row % 2) * (bl // 2)
                lx = (xx - self.x0 + off) % bl
                col = tone if h2((xx - self.x0 + off) // bl, row + y) % 7 == 0 else r[1]
                if rusticated:
                    col = [r[0], r[1], r[1], r[1], r[1], r[2], r[3], r[4]][ly]
                    if 0 < ly < rh - 2 and lx in (0, 1):
                        col = r[3] if lx == 0 else r[0]
                elif ly == rh - 1 or lx == 0:
                    col = r[2]
                c.p(xx, yy, col)
        for xx, col in ((self.x0, r[0]), (self.x0 + 1, r[1]), (self.x1 - 2, r[2]), (self.x1 - 1, r[3])):
            c.rect(xx, y, 1, h, col)

    def string_course(self, y):
        c, r = self.c, self.p['stone']
        c.rect(self.x0 - 1, y, self.W + 2, 2, r[0])
        hband(c, self.x0 - 1, y + 2, self.W + 2, [r[1], r[2], r[3]])
        cast(c, self.x0, y + 5, self.W, 3)

    def cornice(self, y):
        c, r = self.c, self.p['stone']
        x, w = self.x0 - 3, self.W + 6
        c.rect(x, y - CORNICE_TOP, w, CORNICE_TOP, r[0])
        c.rect(x, y - CORNICE_TOP, w, 1, r[1])
        hband(c, x, y, w, [r[1], r[1], r[2]])
        for xx in range(x + 1, x + w - 1):
            c.rect(xx, y + 3, 1, 3, r[1] if (xx // 2) % 2 else r[3])
        hband(c, x + 1, y + 6, w - 2, [r[1], r[2], r[3], r[4]])
        cast(c, self.x0, y + 10, self.W, 4, 0.6)

    # openings --------------------------------------------------------------

    def window(self, cx, y, w, h, hood, lit=False):
        c, r, j, g = self.c, self.p['stone'], self.p['joinery'], self.p['glass']
        x = cx - w // 2
        raised(c, x - 4, y - 4, w + 8, h + 6, r)
        c.rect(x - 2, y - 2, w + 4, 1, r[2])
        c.rect(x - 2, y - 2, 1, h + 2, r[2])
        # the opening is deep: its top and left sit in shadow
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                a, b = xx - x, yy - y
                col = g[3] if b < h // 2 else g[2]
                if b < 3:
                    col = g[4]
                elif a < 2:
                    col = g[3] if b > h // 2 else g[4]
                elif (a + b) % 19 in (7, 8):
                    col = g[1]
                c.p(xx, yy, col)
        m = x + w // 2
        for yy in range(y + 1, y + h):
            c.p(x + 1, yy, j[1]); c.p(x + w - 2, yy, j[2])
            c.p(m - 1, yy, j[0]); c.p(m, yy, j[2])
        for ty in range(y + 2, y + h - 2, 8):
            c.rect(x + 1, ty, m - x - 1, 1, j[0])
            c.rect(m, ty, x + w - 1 - m, 1, j[1])
        c.rect(x + 1, y + h - 2, w - 2, 1, j[2])
        self.windows.append((x + 2, y + 3, w - 4, h - 5, lit))
        if hood == 'pediment':
            c.rect(x - 5, y - 12, w + 10, 2, r[0])
            hband(c, x - 5, y - 10, w + 10, [r[1], r[1], r[2], r[3]])
            for kx in (x - 5, x + w + 2):
                raised(c, kx, y - 6, 3, 7, r)
            cast(c, x - 4, y - 6, w + 8, 2, 0.74)
        elif hood == 'keystone':
            raised(c, cx - 3, y - 8, 6, 9, r)
            c.rect(cx - 2, y - 7, 4, 1, r[0])
        c.rect(x - 5, y + h + 1, w + 10, 2, r[0])
        c.rect(x - 5, y + h + 3, w + 10, 2, r[2])
        c.rect(x - 5, y + h + 5, w + 10, 1, r[4])
        cast(c, x - 4, y + h + 6, w + 8, 2, 0.72)

    def rail(self, x, y, w, h):
        c, i = self.c, self.p['iron']
        for xx in range(x, x + w):
            a = (xx - x) % 6
            m = y + h // 2
            if a == 0:
                c.rect(xx, y + 2, 1, h - 2, i[2])
            elif a in (2, 3):
                c.p(xx, m - 1, i[1]); c.p(xx, m + 1, i[1])
                if a == 3:
                    c.p(xx, m, i[0])
            else:
                c.p(xx, m, i[1])
        c.rect(x, y, w, 1, i[0])
        c.rect(x, y + 1, w, 1, i[2])
        c.rect(x, y + h - 2, w, 1, i[2])

    def balcony(self, x, y, w, d, rail_h):
        """y is where the slab leaves the wall: its floor shows d rows from
        above, then its edge and brackets; the railing stands on the front edge."""
        c, r = self.c, self.p['stone']
        c.rect(x, y, w, 1, r[3])
        c.rect(x, y + 1, w, d - 1, r[1])
        fy = y + d
        c.rect(x, fy, w, 1, r[0])
        c.rect(x, fy + 1, w, 2, r[2])
        c.rect(x, fy + 3, w, 1, r[4])
        for kx in range(x + 3, x + w - 4, 15):
            raised(c, kx, fy + 4, 4, 5, r)
        cast(c, x + 1, fy + 4, w - 2, 3, 0.66)
        self.rail(x, fy - rail_h, w, rail_h)

    # roof ------------------------------------------------------------------

    def roof_top(self, top, bottom):
        c, z, i = self.c, self.p['zinc'], self.p['iron']
        span = bottom - top
        ins0 = MANSARD // 11
        for yy in range(top, bottom):
            base = 3 if (yy - top) / span < 0.35 else 2
            inset = ins0 + (bottom - yy) // 4
            for xx in range(self.x0 + inset, self.x1 - inset):
                a = (xx - self.x0) % 9
                c.p(xx, yy, z[base - 1] if a == 0 else z[base + 1] if a == 1 else z[base])
        inset = ins0 + span // 4
        for xx in range(self.x0 + inset + 2, self.x1 - inset - 2, 5):
            c.rect(xx, top - 4, 1, 4, i[2])
            c.p(xx, top - 5, i[0])
        c.rect(self.x0 + inset, top - 1, self.W - 2 * inset, 1, i[1])
        return inset

    def mansard(self, top, bottom):
        """Slate darker under the zinc roll, lighter toward the bell-cast foot."""
        c, sl, z = self.c, self.p['slate'], self.p['zinc']
        span = bottom - top
        for yy in range(top, bottom):
            row, ly = (yy - top) // 5, (yy - top) % 5
            t = (yy - top) / span
            b = 3 if t < 0.25 else 2 if t < 0.75 else 1
            flare = max(0, (yy - (bottom - 6)) // 2)
            inset = (bottom - yy) // 11
            for xx in range(self.x0 + inset - flare, self.x1 - inset + flare):
                lx = (xx + (row % 2) * 4) % 8
                tone = b + (1 if h2((xx + (row % 2) * 4) // 8, row) % 7 == 0 else 0)
                col = sl[min(5, tone)]
                if ly == 4:
                    col = sl[min(5, b + 2)]
                elif lx == 7:
                    col = sl[min(5, b + 1)]
                elif ly == 0 or lx == 0:
                    col = sl[max(0, b - 1)]
                c.p(xx, yy, col)
        ins = span // 11
        hband(c, self.x0 + ins - 1, top - 2, self.W - 2 * ins + 2, [z[0], z[1], z[4]])

    def dormer(self, cx, foot, h):
        c, r, z = self.c, self.p['stone'], self.p['zinc']
        w = 22
        x, y = cx - w // 2, foot - h
        for yy in range(y - 6, y + 2):
            half = w // 2 + 1 - max(0, y - 2 - yy)
            c.rect(cx - half, yy, 2 * half, 1, z[2] if yy > y - 3 else z[1])
        raised(c, x, y + 2, w, h - 2, r)
        for xx in range(x - 2, x + w + 2):
            lift = round(math.sin((xx - x + 2) / (w + 3) * math.pi) * 5)
            for k, col in enumerate((r[0], r[1], r[1], r[3])):
                c.p(xx, y + 3 - lift + k, col)
        self.window(cx, y + 13, w - 10, h - 21, 'none')

    def stack(self, cx, foot, w, h):
        """Party-wall chimney standing on the roof, inside its outline."""
        c, r, f = self.c, self.p['stone'], self.p['flue']
        x, top = cx - w // 2, foot - h
        for yy in range(top, foot):
            for xx in range(x, x + w):
                a = xx - x
                col = r[0] if a <= 1 else r[2] if a == w - 3 or a == w - 2 else r[3] if a == w - 1 else r[1]
                if (yy - top) % 7 == 6:
                    col = r[2] if a < w - 1 else r[4]
                c.p(xx, yy, col)
        c.rect(x - 2, top - 5, w + 4, 2, r[0])
        hband(c, x - 2, top - 3, w + 4, [r[1], r[2], r[3]])
        cast(c, x, top, w, 2, 0.7)
        n = max(2, (w - 2) // 5)
        for k in range(n):
            px, py = x + 1 + k * ((w - 2) // n), top - 12
            c.rect(px, py + 2, 4, 6, f[1])
            c.rect(px, py + 2, 1, 6, f[0])
            c.rect(px + 3, py + 2, 1, 6, f[2])
            c.rect(px - 1, py, 6, 2, f[0])
            c.rect(px, py + 1, 4, 1, f[3])

    # ground floor ----------------------------------------------------------

    def interior(self, x0, y0, x1, y1, goods):
        """What shows through the shop glass, kept to a few readable shapes."""
        c, g = self.c, self.p['glass']
        back = {'cafe': H('5c403a'), 'bread': H('6a4a36'), 'books': H('4a3436'), 'pharma': H('3e4a4c')}[goods]
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                c.p(xx, yy, darken(back, 0.82) if yy - y0 < 5 else back)
        shelf = y0 + (y1 - y0) // 2
        for xx in range(x0 + 2, x1 - 2):
            if goods == 'cafe':
                col = H('b0a2a0') if (xx // 3) % 5 else H('d8ccc0')
                c.p(xx, shelf - 6, col); c.p(xx, shelf - 5, col)
                if xx % 4 == 0:
                    c.p(xx, shelf - 1, [H('3f7a52'), H('c9533a'), H('f0c860')][(xx // 4) % 3])
                    c.p(xx, shelf - 2, H('e8e4dc'))
            elif goods == 'bread':
                if (xx - x0) % 7 in (1, 2, 3, 4, 5):
                    c.p(xx, shelf - 1, H('d59a48')); c.p(xx, shelf - 2, H('f0c878') if (xx - x0) % 7 < 4 else H('a8652c'))
            elif goods == 'books':
                for k in range(6):
                    c.p(xx, shelf - 1 - k, [H('a3443c'), H('384a80'), H('b08a3e'), H('2f634c'), H('7f2c30')][(xx // 2) % 5])
            else:
                if (xx - x0) % 5 in (1, 2, 3):
                    c.p(xx, shelf - 1, H('e8f0f0')); c.p(xx, shelf - 2, H('6ab0a0') if (xx // 5) % 2 else H('c86a5a'))
            c.p(xx, shelf, H('8a5a3a'))
        for xx in range(x0, x1):
            for yy in range(y0, y1):
                if (xx - x0 + yy - y0) % 24 in (0, 1, 3):
                    c.p(xx, yy, darken(c.g(xx, yy), 1.3))

    def shopfront(self, x0, x1, top, base, sh):
        c, s, gl = self.c, SHOP[sh['paint']], self.p['gilt']
        raised(c, x0, top, x1 - x0, 14, s)
        c.rect(x0 + 2, top + 2, x1 - x0 - 4, 10, s[3])
        c.rect(x0 + 2, top + 2, x1 - x0 - 4, 1, s[4])
        word = sh['sign'] if text_w(sh['sign']) <= x1 - x0 - 8 else sh['sign'][: (x1 - x0 - 6) // 4]
        text(c, (x0 + x1) // 2 - text_w(word) // 2, top + 5, word, gl[1], gl[3])
        for px in (x0, x1 - 6):
            raised(c, px, top + 14, 6, base - top - 14, s)
            c.rect(px - 1, top + 14, 8, 2, s[0])
            c.rect(px - 1, top + 16, 8, 1, s[3])
        gx0, gx1, g0, sill = x0 + 6, x1 - 6, top + 14, base - 10
        self.interior(gx0, g0, gx1, sill, sh['goods'])
        n = max(1, (gx1 - gx0) // 28)
        for k in range(1, n):
            raised(c, gx0 + k * (gx1 - gx0) // n - 1, g0, 3, sill - g0, s, 1, 2, 4)
        self.windows.append((gx0, g0 + 2, gx1 - gx0, sill - g0 - 2, True))
        c.rect(gx0, sill, gx1 - gx0, 1, s[0])
        c.rect(gx0, sill + 1, gx1 - gx0, base - sill - 1, s[2])
        pw = (gx1 - gx0) // max(1, n)
        for k in range(n):
            raised(c, gx0 + k * pw + 2, sill + 2, pw - 4, base - sill - 4, s)
        if sh.get('awning'):
            aw, a0, depth = AWNING[sh['awning']], g0, 14
            for yy in range(a0, a0 + depth):
                sp = (yy - a0) // 2
                L, R = x0 + 4 - sp, x1 - 4 + sp
                for xx in range(L, R):
                    st = aw[((xx - L) * 16 // (R - L)) % 2]
                    c.p(xx, yy, st[2] if yy == a0 else st[0] if yy < a0 + depth - 4 else st[1])
            sp = depth // 2
            L, R = x0 + 4 - sp, x1 - 4 + sp
            for xx in range(L, R):
                st = aw[((xx - L) * 16 // (R - L)) % 2]
                k = (xx - L) % 6
                c.rect(xx, a0 + depth, 1, 4 if k in (2, 3) else 3 if k in (1, 4) else 2, st[1])
            cast(c, gx0, a0 + depth, gx1 - gx0, 6, 0.55)

    def carriage_door(self, cx, base):
        c, r, s, i = self.c, self.p['stone'], SHOP[self.s.get('door_paint', 'green')], self.p['iron']
        w, h = CARRIAGE
        x, y, R = cx - w // 2, base - h, w // 2
        for yy in range(y - 5, base):
            for xx in range(x - 5, x + w + 5):
                dx, dy = xx - (cx - 0.5), (y + R) - yy
                if dy > 0 and dx * dx + dy * dy > (R + 5) ** 2:
                    continue
                c.p(xx, yy, r[1])
        for a in range(0, 181, 20):
            t = math.radians(a)
            for k in range(R, R + 5):
                c.p(cx - 0.5 + math.cos(t) * k, y + R - math.sin(t) * k, r[3])
        raised(c, cx - 3, y - 6, 6, 8, r)
        for yy in range(y, base):
            for xx in range(x, x + w):
                dx, dy = xx - (cx - 0.5), (y + R) - yy
                if dy > 0 and dx * dx + dy * dy > R * R:
                    continue
                a, b = xx - x, yy - y
                if b < R:
                    col = i[1] if (a + b) % 4 == 0 or abs(a - R + 0.5) < 1 else self.p['glass'][3]
                else:
                    pa = a % 12
                    col = s[0] if pa == 0 else s[3] if pa == 11 else s[1]
                    if pa in (2, 9) or (b - R) % 14 in (2, 12):
                        col = s[0] if pa == 2 else s[2]
                    if b < R + 3 or a < 2:
                        col = darken(col, 0.72)
                c.p(xx, yy, col)
        c.rect(x, y + R, w, 1, s[3])
        c.rect(cx - 1, y + R, 2, h - R, s[3])
        for k in (-4, 2):
            c.rect(cx + k, y + 32, 2, 2, self.p['gilt'][1])
        c.rect(x - 3, base - 2, w + 6, 2, r[0])
        self.door = (cx, w, h)

    # assembly --------------------------------------------------------------

    def build(self):
        s, c = self.s, self.c
        base = self.base
        g_top = base - GROUND
        tops, y = [], g_top
        for h in self.heights:
            y -= h
            tops.append(y)
        corn = y - CORNICE
        m_top = corn - MANSARD
        r_top = m_top - ROOF_TOP
        inset = self.roof_top(r_top, m_top - 2)
        sw = 16
        for cx in (self.x0 + inset + sw // 2 + 3, self.x1 - inset - sw // 2 - 3):
            self.stack(cx, m_top - 6, sw, 18)
        self.mansard(m_top, corn - 4)
        for i in range(s['bays']):
            self.dormer(self.bay_x(i), corn - 4, MANSARD - 8)
        self.cornice(corn)
        order = list(zip(self.heights, tops))[::-1]
        for h, top in order:
            self.wall(top, h)
        cast(c, self.x0, corn + 10, self.W, 4, 0.6)
        for h, top in order:
            if top != tops[0]:
                self.string_course(top + h - 3)
        for k, (h, top) in enumerate(order):
            noble = top == tops[0]
            wy = top + (16 if noble else 13)
            for i in range(s['bays']):
                lit = h2(i, k, s.get('seed', 0)) % 10 < 4
                self.window(self.bay_x(i), wy, 18, h - (wy - top) - 8, 'pediment' if noble else 'keystone', lit)
            if not noble:
                for i in range(s['bays']):
                    self.balcony(self.bay_x(i) - 12, top + h - 10, 24, 4, 10)
        self.balcony(self.x0 - 2, g_top - 10, self.W + 4, SLAB, 12)
        self.wall(g_top + 4, GROUND - 4, rusticated=True)
        cast(c, self.x0, g_top + 4, self.W, 4, 0.62)
        self.door = None
        i = 0
        while i < s['bays']:
            k = s['ground'][i]
            j = i
            while k == 'shop' and j + 1 < s['bays'] and s['ground'][j + 1] == 'shop':
                j += 1
            L, R = self.bay_x(i) - self.bay // 2 + 3, self.bay_x(j) + self.bay // 2 - 3
            if k == 'shop':
                self.shopfront(L, R, g_top + 6, base, s['shops'][0] if len(s['shops']) == 1 or L < self.W // 2 else s['shops'][-1])
            elif k == 'door':
                self.carriage_door(self.bay_x(i), base)
            else:
                self.window(self.bay_x(i), g_top + 18, 18, GROUND - 32, 'keystone')
            i = j + 1
        outline(c)
        self.glow()
        return c.im, self.em.im

    def glow(self):
        """Lit rooms after dark: the same windows, warm, on their own layer."""
        lit = self.p['lit']
        for x, y, w, h, on in self.windows:
            if not on:
                continue
            for yy in range(y, y + h):
                for xx in range(x, x + w):
                    if self.c.g(xx, yy)[3]:
                        self.em.p(xx, yy, lit[0] if yy - y < h // 3 else lit[1] if yy - y < 2 * h // 3 else lit[2])


# ------------------------------------------------------------------ catalogue

CAFE = dict(paint='green', sign='CAFE', goods='cafe', awning='red')
BREAD = dict(paint='navy', sign='BOULANGERIE', goods='bread')
BOOKS = dict(paint='oxblood', sign='LIBRAIRIE', goods='books')
PHARMA = dict(paint='green', sign='PHARMACIE', goods='pharma')
HOTEL = dict(paint='green', sign='HOTEL', goods='cafe', awning='green')

# frame: footprint (tiles), storeys, bays, ground, shops, options
IMMEUBLES = {
    'modern-immeuble-0': ([9, 6], 3, 4, 'SSSD', [CAFE], {}),
    'modern-immeuble-1': ([8, 6], 3, 3, 'SSD', [BREAD], dict(stone='warm')),
    'modern-immeuble-2': ([10, 6], 3, 4, 'SSDS', [BOOKS, PHARMA], {}),
    'modern-immeuble-3': ([8, 6], 3, 3, 'WDW', [], {}),
    'modern-immeuble-4': ([11, 6], 4, 5, 'DSSSS', [HOTEL], dict(stone='warm')),
    'modern-immeuble-5': ([6, 5], 3, 2, 'WD', [], {}),
    'modern-immeuble-6': ([7, 5], 3, 3, 'SSD', [dict(BREAD, paint='oxblood', awning='green')], dict(stone='warm')),
    'modern-immeuble-7': ([7, 4], 2, 3, 'SSD', [CAFE], {}),
    'modern-immeuble-corner-e-0': ([8, 6], 3, 3, 'SSD', [CAFE], {}),
    'modern-immeuble-corner-w-0': ([8, 6], 3, 3, 'DSS', [BREAD], dict(stone='warm')),
    'modern-immeuble-corner-e-1': ([9, 6], 3, 4, 'SSSD', [BOOKS], dict(stone='warm')),
    'modern-immeuble-corner-w-1': ([9, 6], 3, 4, 'DSSS', [HOTEL], {}),
}
GROUND_KIND = {'S': 'shop', 'D': 'door', 'W': 'window'}


def spec(name, seed=0):
    fp, storeys, bays, ground, shops, opts = IMMEUBLES[name]
    return dict(width=fp[0] * 16, bays=bays, storeys=storeys, seed=seed,
                ground=[GROUND_KIND[k] for k in ground], shops=shops, **opts)


class Building:
    """What oblique_modern.ObliqueModern needs from a painter."""

    def __init__(self, name, seed=0):
        self.f = Front(spec(name, seed))
        self.seed = seed
        self.W = self.f.W
        self.sd = 0
        self.x0 = self.f.x0

    def build(self):
        im, em = self.f.build()
        self.anchor_x = self.f.x0 + self.W // 2
        cx, w, h = self.f.door or (self.anchor_x, 22, 44)
        # The leaf overlay covers the leaves under the fanlight, not the arch.
        self.door_x, self.door_size = cx, (w, h - w // 2)
        return im, em


def recipe(name, seed):
    fp, storeys, *_ = IMMEUBLES[name]
    hs = NOBLE + UPPER * (storeys - 2)
    return {'footprint': fp, 'height': GROUND + hs + CORNICE + MANSARD + ROOF_TOP, 'front': True}


# ------------------------------------------------------------------ review sheet

def make(out, zoom=3):
    import json
    from art.reference import current_adult
    adult = current_adult()
    frames = json.loads((ROOT / 'src/render/generated/modern-buildings.json').read_text())['frames']
    atlas = Image.open(ROOT / 'public/packs/modern-buildings.png').convert('RGBA')
    cells = []
    for name in IMMEUBLES:
        f = frames.get(name, {}).get('frame')
        old = atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])) if f else None
        new, _ = Front(spec(name)).build()
        cells.append((name, old, new))
    pad = 10
    rowh = max(max((o.height if o else 0), n.height) for _, o, n in cells) + 24
    colw = max((o.width if o else 0) + n.width + adult.width * 2 + 5 * pad for _, o, n in cells)
    cols = 3
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * colw + pad, rows * rowh + 24), (28, 24, 34, 255))
    d = ImageDraw.Draw(sheet)
    for k, (name, old, new) in enumerate(cells):
        x, y = pad + (k % cols) * colw, 20 + (k // cols) * rowh
        foot = y + rowh - 14
        d.text((x, y - 14), name.replace('modern-', ''), fill=(220, 210, 230))
        if old:
            sheet.alpha_composite(old, (x, foot - old.height))
        sheet.alpha_composite(adult, (x + (old.width if old else 0) + pad, foot - adult.height))
        nx = x + (old.width if old else 0) + adult.width + 2 * pad
        sheet.alpha_composite(new, (nx, foot - new.height))
        sheet.alpha_composite(adult, (nx + new.width + pad // 2, foot - adult.height))
    sheet = sheet.resize((sheet.width * zoom, sheet.height * zoom), Image.NEAREST)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    sheet.convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-kit.png')
