"""The European city kit, c.1850-1914: buildings, their outworks and street
props drawn to one standard, for review before they replace the modern masters.

    .venv/bin/python scripts/art/city_kit.py artifacts/city-kit/sheet.png

The standard: the live adult is 37px, so a storey is 40px and a door 16x40,
not the 28px storey and 10x23 door the older painters use. Light comes from
the upper left. Every ramp shifts hue, cool and violet in shadow, warm in
light. Walls are flat mid tones with detail gathered at openings, corners
and the ground; every sprite gets a selective outline, darker on its shadow
side.
"""
from pathlib import Path
import math
import sys

from PIL import Image, ImageDraw, ImageFont

from art.oblique_style import DRIFT, drift

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

LIME = ['#2f2838', '#5a4d55', '#8a7a74', '#b3a18d', '#d2c1a3', '#ebdcbc', '#f7eed6']
WARM_LIME = ['#34293a', '#634f52', '#977b6c', '#c09f82', '#dcbf9a', '#efdab6', '#fbeed2']
BRICK = ['#261522', '#4d2128', '#7a3130', '#9c4535', '#b85c41', '#d27d58', '#e8a27a']
SLATE = ['#151527', '#232843', '#343d5e', '#4b5779', '#687696', '#8c9cb6', '#b9c6d4']
IRON = ['#0f0e19', '#1d1d2e', '#2f3045', '#484a62']
GLASS = ['#0f1426', '#1b2640', '#2c4260', '#46668a', '#7da0b8', '#c3dbe0']
GREEN = ['#0c1d1b', '#15302a', '#20483a', '#2f634c', '#468262', '#6aa47a']
NAVY = ['#0e1127', '#18203f', '#26335e', '#384a80', '#5670a4']
OXBLOOD = ['#1e0b17', '#3b1320', '#5c1d27', '#7f2c30', '#a3443c']
OAK = ['#1d1117', '#36201f', '#54332a', '#734a36', '#946645', '#b38658']
LEAF = ['#0e2019', '#173a24', '#23552b', '#3a7431', '#5b943a', '#86b546', '#b5d65e']
BARK = ['#2a2126', '#4a4038', '#6d6450', '#958a68', '#bfb48a']
TERRA = ['#3a1a1c', '#6e2c24', '#a2472e', '#c96a3c', '#e3935a']
PAVE = ['#3e3a4a', '#5d5763', '#7b747c', '#958d91', '#aba2a2', '#c4bbb4']
SETT = ['#2c2b3b', '#433f50', '#57525f', '#6b6570', '#827b82']
GOLD = ['#6b4a1f', '#b08a3e', '#e2c071', '#f8e6a4']
BREAD = ['#6a3a1c', '#a8652c', '#d59a48', '#f0c878']
RED = ['#4a1020', '#8e1f2c', '#c8363c', '#ec6a5c']
CREAM = ['#9d917c', '#cfc4aa', '#efe6cf']
WATER = ['#1c3354', '#2a5a7c', '#3f86a0', '#6fb7c2', '#b6e2dc', '#f0faf4']
INK = (18, 12, 28)
SHADOW = (24, 20, 44, 96)

STOREY, GROUND, DOOR_W, DOOR_H = 40, 54, 16, 40

_rgba = {}


def rgba(c):
    if isinstance(c, tuple):
        return c if len(c) == 4 else (*c, 255)
    if c not in _rgba:
        _rgba[c] = (int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16), 255)
    return _rgba[c]


def mix(a, b, t):
    a, b = rgba(a), rgba(b)
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)


def h2(x, y, s=0):
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65536


class C:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w, h))
        self.p = self.im.load()

    def px(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.p[x, y] = rgba(c)

    def get(self, x, y):
        return self.p[x, y] if 0 <= x < self.w and 0 <= y < self.h else (0, 0, 0, 0)

    def rect(self, x0, y0, x1, y1, c):
        c = rgba(c)
        for y in range(max(0, y0), min(self.h, y1 + 1)):
            for x in range(max(0, x0), min(self.w, x1 + 1)):
                self.p[x, y] = c

    def hl(self, x0, x1, y, c):
        self.rect(x0, y, x1, y, c)

    def vl(self, x, y0, y1, c):
        self.rect(x, y0, x, y1, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for y in range(int(cy - ry), int(cy + ry) + 1):
            for x in range(int(cx - rx), int(cx + rx) + 1):
                if ((x - cx + .5) / rx) ** 2 + ((y - cy + .5) / ry) ** 2 <= 1:
                    self.px(x, y, c)

    def blit(self, im, x, y):
        self.im.alpha_composite(im, (x, y))
        self.p = self.im.load()


def outline(im, soft=0.45, hard=0.72):
    """Selective outline inside the silhouette: the lit top and left edges
    take less ink than the shadowed bottom and right."""
    src = im.load()
    out = im.copy()
    q = out.load()
    w, h = im.size
    op = lambda x, y: 0 <= x < w and 0 <= y < h and src[x, y][3] > 40
    for y in range(h):
        for x in range(w):
            if src[x, y][3] <= 40:
                continue
            lit = not op(x - 1, y) or not op(x, y - 1)
            dark = not op(x + 1, y) or not op(x, y + 1)
            if dark or lit:
                q[x, y] = mix(src[x, y], INK, hard if dark else soft)
    return out


def sphere(c, cx, cy, r, ramp, lo=0, hi=None, flat=1.0, edge=None):
    """A shaded ball quantised onto a ramp; the building block of foliage,
    water and stone finials."""
    hi = len(ramp) - 1 if hi is None else hi
    L = (-0.55, -0.62, 0.56)
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            dx, dy = (x + .5 - cx) / r, (y + .5 - cy) / (r * flat)
            d = dx * dx + dy * dy
            if d > 1:
                continue
            nz = math.sqrt(1 - d)
            l = max(0, dx * L[0] + dy * L[1] + nz * L[2])
            k = lo + min(hi - lo, int(l * (hi - lo + 0.6)))
            c.px(x, y, ramp[k])


FONT = {
    'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011',
    'D': '110101101101110', 'E': '111100110100111', 'F': '111100110100100',
    'G': '011100101101011', 'H': '101101111101101', 'I': '111010010010111',
    'J': '001001001101010', 'K': '101101110101101', 'L': '100100100100111',
    'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010',
    'P': '110101110100100', 'Q': '010101101110011', 'R': '110101110101101',
    'S': '011100010001110', 'T': '111010010010010', 'U': '101101101101111',
    'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101',
    'Y': '101101010010010', 'Z': '111001010100111', ' ': '000000000000000',
    '.': '000000000000010', "'": '010010000000000',
}


def text(c, s, cx, y, col, shade=None):
    w = len(s) * 4 - 1
    x0 = cx - w // 2
    for i, ch in enumerate(s):
        g = FONT.get(ch, FONT[' '])
        for k, bit in enumerate(g):
            if bit == '1':
                x, yy = x0 + i * 4 + k % 3, y + k // 3
                if shade:
                    c.px(x + 1, yy + 1, shade)
                c.px(x, yy, col)
    return w


def lettering(c, x0, x1, y, words, seed):
    """A fascia with no words, so it belongs to no one language: gilt rules
    either side of a painted lozenge."""
    cx = (x0 + x1) // 2
    for x in range(x0 + 2, x1 - 1):
        if abs(x - cx) > 5:
            c.px(x, y + 2, GOLD[2])
            c.px(x, y + 3, GOLD[0])
    for i in range(4):
        c.hl(cx - i, cx + i, y + i - 1, GOLD[3] if i < 2 else GOLD[2])
        c.hl(cx - i, cx + i, y + 6 - i, GOLD[1])
    c.px(cx, y + 2, RED[2])
    c.px(cx, y + 3, RED[1])


# ---------------------------------------------------------------- openings

def glass(c, x0, y0, x1, y1, seed=0, curtain=None):
    """Plate glass: the room's dark below, the sky's reflection in a pair of
    diagonal streaks, a shadow under the head."""
    c.rect(x0, y0, x1, y1, GLASS[1])
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            t = (y - y0) / max(1, y1 - y0)
            if t < 0.45:
                c.px(x, y, GLASS[2])
            k = (x - x0) + (y - y0)
            if k % 11 in (4, 5) and t < 0.8:
                c.px(x, y, GLASS[3])
            if k % 11 == 5 and t < 0.35:
                c.px(x, y, GLASS[4])
    if curtain:
        for y in range(y0 + 1, y1 + 1):
            c.px(x0, y, curtain[1])
            c.px(x1, y, curtain[0])
            if y < y0 + (y1 - y0) // 2 + 2:
                c.px(x0 + 1, y, curtain[1])
    c.hl(x0, x1, y0, GLASS[0])


def french_window(c, x, y, w, h, stone, seed, curtain=False):
    """A casement to the floor: stone surround lit on the left and head,
    white frame, a centre mullion and a transom at a third."""
    c.rect(x - 2, y - 2, x + w + 1, y + h + 1, stone[4])
    c.vl(x + w + 1, y - 1, y + h + 1, stone[2])
    c.hl(x - 1, x + w + 1, y + h + 1, stone[2])
    c.vl(x - 2, y - 2, y + h + 1, stone[5])
    c.hl(x - 2, x + w + 1, y - 2, stone[5])
    c.rect(x - 1, y - 1, x + w, y + h, '#e9e3d6')
    glass(c, x, y, x + w - 1, y + h - 1, seed,
          ['#d8cdb4', '#b4a78c'] if curtain else None)
    tr = y + h // 3
    c.hl(x, x + w - 1, tr, '#e9e3d6')
    c.hl(x, x + w - 1, tr + 1, '#8f8a90')
    mid = x + w // 2
    c.vl(mid, tr + 1, y + h - 1, '#e9e3d6')
    c.vl(mid - 1 if w % 2 == 0 else mid + 1, tr + 2, y + h - 1, '#9d99a0')
    c.vl(x + w, y, y + h, '#9d99a0')


def keystone_head(c, x, y, w, stone):
    """Flat arch with a keystone standing proud of the lintel."""
    c.rect(x - 3, y - 5, x + w + 2, y - 3, stone[4])
    c.hl(x - 3, x + w + 2, y - 5, stone[5])
    c.hl(x - 3, x + w + 2, y - 3, stone[3])
    k = x + w // 2 - 2
    c.rect(k, y - 7, k + 3, y - 2, stone[5])
    c.vl(k + 3, y - 6, y - 2, stone[3])
    c.px(k, y - 7, stone[6])


def pediment(c, x, y, w, stone, segmental=False):
    """A cornice over the window on consoles, triangular or segmental."""
    x0, x1 = x - 4, x + w + 3
    c.rect(x0, y - 5, x1, y - 3, stone[4])
    c.hl(x0, x1, y - 5, stone[5])
    c.hl(x0, x1, y - 2, stone[1])
    c.px(x0, y - 1, stone[3])
    c.px(x1, y - 1, stone[2])
    half = (x1 - x0) // 2
    for i in range(half + 1):
        rise = (round(math.sin(math.pi * i / (2 * half)) * 5) if segmental else i * 5 // half)
        for dx, col in ((i, stone[5]), (x1 - x0 - i, stone[4])):
            c.px(x0 + dx, y - 6 - rise, col)
            for yy in range(y - 5 - rise, y - 5):
                c.px(x0 + dx, yy, stone[3])
        c.px(x0 + i, y - 7 - rise, stone[6] if i % 3 else stone[5])


def iron_rail(c, x0, x1, y, h, pattern=0):
    """A wrought-iron rail: a top bar, a bottom bar and balusters between,
    every other panel carrying a ring."""
    c.hl(x0, x1, y, IRON[3])
    c.hl(x0, x1, y + 1, IRON[1])
    c.hl(x0, x1, y + h - 1, IRON[1])
    for x in range(x0, x1 + 1, 2):
        c.vl(x, y + 2, y + h - 2, IRON[1])
        if pattern == 0 and (x - x0) % 8 == 4 and h > 6:
            c.px(x - 1, y + h // 2, IRON[1])
            c.px(x + 1, y + h // 2, IRON[1])


def flower_box(c, x0, x1, y, seed, bloom=RED):
    """A window box of geraniums: a lead-green box, leaves and scattered
    heads, lit from the left."""
    c.rect(x0, y, x1, y + 3, GREEN[2])
    c.hl(x0, x1, y, GREEN[4])
    c.hl(x0, x1, y + 3, GREEN[0])
    for x in range(x0, x1 + 1):
        top = y - 2 - int(h2(x, 1, seed) * 3)
        for yy in range(top, y):
            c.px(x, yy, LEAF[3] if (x + yy) % 3 else LEAF[2])
        c.px(x, top, LEAF[4])
    for x in range(x0 + 1, x1, 3):
        yy = y - 4 - int(h2(x, 2, seed) * 2)
        c.px(x, yy, bloom[2])
        c.px(x + 1, yy, bloom[1])
        c.px(x, yy - 1, bloom[3])


# ---------------------------------------------------------------- buildings

def lit_rooms(im, seed):
    """After dark: a third of the rooms lit, chosen per window, not per
    pixel, by the glass tones the painters use."""
    em = Image.new('RGBA', im.size)
    src, q = im.load(), em.load()
    panes = {rgba(GLASS[1])[:3], rgba(GLASS[2])[:3], rgba(GLASS[3])[:3]}
    for y in range(im.height):
        for x in range(im.width):
            p = src[x, y]
            if p[3] and p[:3] in panes and h2(x // 20, y // 40, seed) < 0.34:
                q[x, y] = rgba('#f2c774' if p[:3] != rgba(GLASS[1])[:3] else '#d49a48')
    return em


class Oblique:
    """Front face square on, the right wall a strip sheared up at 45 degrees,
    a roof leaning back over both. `sd` is the strip's width."""

    def __init__(self, W, wall, above, sd):
        self.W, self.wall, self.above, self.sd = W, wall, above, sd
        self.H = above + wall + sd
        self.c = C(W + DRIFT + 4, self.H)
        self.base = self.H

    def build(self):
        im = self.render()
        self.anchor_x = self.W // 2
        return im, lit_rooms(im, self.seed)

    def side(self, face, top):
        """Paste an unsheared side elevation whose top row sits at `top`."""
        src = face.load()
        for i in reversed(range(face.width)):
            for y in range(face.height):
                p = src[i, y]
                if p[3]:
                    self.c.px(self.W + drift(i + 1, face.width) - 1, top + y - i - 1, p)

    def flat_top(self, x0, x1, y, ramp, seams=True):
        for j in range(1, self.sd + 1):
            o = drift(j, self.sd)
            for x in range(x0 + o, x1 + o + 1):
                col = ramp[3]
                if seams and (x - o) % 6 == 0:
                    col = ramp[4]
                elif seams and (x - o) % 6 == 1:
                    col = ramp[2]
                if j == self.sd:
                    col = ramp[2]
                self.c.px(x, y - j, col)

    def chimney(self, x, y, w, h, wall, depth=4, pots=3):
        """A stack on a party wall: face, a sliver of side, the capping's top
        running back, and pots standing along it."""
        c = self.c
        c.rect(x, y - h, x + w - 1, y, wall[3])
        c.vl(x, y - h, y, wall[4])
        c.vl(x + w, y - h - 1, y - 2, wall[1])
        for yy in range(y - h + 5, y, 5):
            c.hl(x + 1, x + w - 2, yy, wall[2])
        c.rect(x - 1, y - h - 2, x + w, y - h, wall[4])
        c.hl(x - 1, x + w, y - h + 1, wall[2])
        top = y - h - 3
        for i in range(depth):
            o = drift(i + 1, depth * 3)
            c.hl(x - 1 + o, x + w + o, top - i, wall[5] if i < depth - 1 else wall[6] if len(wall) > 6 else wall[5])
        for k in range(pots):
            px_ = x + 1 + k * ((w - 2) // max(1, pots))
            b = top - depth // 2
            c.rect(px_, b - 5, px_ + 1, b, TERRA[3])
            c.px(px_ + 1, b - 4, TERRA[2])
            c.hl(px_, px_ + 1, b - 5, TERRA[4])
            c.px(px_, b - 6, TERRA[1])
            c.px(px_ + 1, b - 6, TERRA[1])


def shop_front(c, x0, x1, y0, y1, paint, sign, goods, seed, awning=None, door='right'):
    """Painted timber shopfront: fascia with gilt letters, pilasters, a
    stall riser, plate glass dressed with goods and a glazed door."""
    c.rect(x0, y0, x1, y1, paint[2])
    fy = y0 + 10
    c.rect(x0, y0, x1, fy, paint[1])
    c.hl(x0, x1, y0, paint[4])
    c.hl(x0, x1, y0 + 1, paint[3])
    c.hl(x0, x1, fy, paint[0])
    c.rect(x0 + 3, y0 + 3, x1 - 3, fy - 2, paint[1])
    c.hl(x0 + 3, x1 - 3, y0 + 3, paint[0])
    pil = [x0, x1 - 3]
    dw = 12
    dx = x1 - 3 - dw if door == 'right' else x0 + 3
    run = (x0 + 4, dx - 2) if door == 'right' else (dx + dw + 2, x1 - 4)
    gy0, gy1 = fy + 2, y1 - 8
    glass(c, run[0], gy0, run[1], gy1, seed)
    span = run[1] - run[0]
    for k in (1, 2):
        mx = run[0] + span * k // 3
        c.vl(mx, gy0, gy1, paint[3])
        c.vl(mx + 1, gy0, gy1, paint[1])
    goods(c, run[0], gy0, run[1], gy1, seed)
    c.rect(run[0], gy1 + 1, run[1], y1, paint[2])
    c.hl(run[0], run[1], gy1 + 1, paint[4])
    for k in range(3):
        a = run[0] + 2 + k * (span // 3)
        c.rect(a, gy1 + 3, a + span // 3 - 4, y1 - 2, paint[1])
        c.hl(a, a + span // 3 - 4, gy1 + 3, paint[0])
        c.hl(a, a + span // 3 - 4, y1 - 2, paint[3])
    c.rect(dx - 1, fy + 1, dx + dw, y1, paint[0])
    c.rect(dx, fy + 2, dx + dw - 1, y1, paint[2])
    glass(c, dx + 2, fy + 4, dx + dw - 3, y1 - 12, seed + 3)
    c.rect(dx + 2, y1 - 10, dx + dw - 3, y1 - 2, paint[1])
    c.hl(dx + 2, dx + dw - 3, y1 - 10, paint[3])
    c.px(dx + dw - 3, y1 - 16, GOLD[2])
    c.door_cx = dx + dw // 2
    c.hl(dx - 2, dx + dw + 1, y1, LIME[2])
    for px_ in pil + [dx - 3]:
        c.rect(px_, y0 + 2, px_ + 2, y1, paint[2])
        c.vl(px_, y0 + 2, y1, paint[4])
        c.vl(px_ + 2, y0 + 2, y1, paint[0])
        c.rect(px_ - 1, fy - 1, px_ + 3, fy, paint[3])
    if sign.startswith('~'):
        lettering(c, x0 + 6, x1 - 6, y0 + 4, len(sign) - 1, seed)
    else:
        text(c, sign, (x0 + x1) // 2 + 1, y0 + 4, GOLD[3], GOLD[0])
    if awning:
        awn(c, run[0] - 1, run[1] + 1, fy + 1, awning)


def awn(c, x0, x1, y, stripes, drop=9):
    """A roller awning let down: stripes, a lit fold at the head, a scalloped
    valance, and its shadow on the glass."""
    for x in range(x0, x1 + 1):
        s = stripes[((x - x0) // 3) % 2]
        for yy in range(y, y + drop):
            c.px(x, yy, s[1] if yy > y + drop - 4 else s[2])
        c.px(x, y, s[3] if len(s) > 3 else s[2])
        k = (x - x0) % 6
        if k in (1, 2, 3, 4):
            c.px(x, y + drop, s[1])
        if k in (2, 3):
            c.px(x, y + drop + 1, s[0])
        c.px(x, y + drop + 2, mix(c.get(x, y + drop + 2), INK, 0.35) if c.get(x, y + drop + 2)[3] else (0, 0, 0, 0))


def goods_bread(c, x0, y0, x1, y1, seed):
    for sy in (y0 + 7, y0 + 15):
        if sy + 3 > y1:
            break
        c.hl(x0, x1, sy + 3, OAK[4])
        c.hl(x0, x1, sy + 4, OAK[2])
        for x in range(x0 + 1, x1 - 3, 5):
            if h2(x, sy, seed) < 0.15:
                continue
            c.rect(x, sy, x + 3, sy + 2, BREAD[2])
            c.hl(x + 1, x + 2, sy, BREAD[3])
            c.hl(x, x + 3, sy + 2, BREAD[1])
            c.px(x + 2, sy + 1, BREAD[1])
    for x in range(x0 + 2, x1 - 2, 7):
        c.vl(x, y1 - 9, y1 - 2, BREAD[2])
        c.vl(x + 1, y1 - 8, y1 - 2, BREAD[1])


def goods_cafe(c, x0, y0, x1, y1, seed):
    c.rect(x0, y0 + 9, x1, y1, OAK[1])
    for x in range(x0, x1 + 1):
        for y in range(y0 + 9, y1 + 1):
            if (x + y) % 11 in (4, 5) and y < y1 - 4:
                c.px(x, y, OAK[2])
    for x in range(x0 + 3, x1 - 2, 8):
        c.px(x, y0 + 5, GOLD[3])
        c.px(x, y0 + 6, GOLD[2])
        c.rect(x - 1, y1 - 7, x + 2, y1 - 7, CREAM[1])
        c.vl(x, y1 - 6, y1 - 2, OAK[0])
        c.px(x - 2, y1 - 3, OAK[3])
        c.px(x + 3, y1 - 3, OAK[3])


def goods_books(c, x0, y0, x1, y1, seed):
    cols = [RED[2], NAVY[3], GREEN[4], GOLD[1], CREAM[1], OXBLOOD[4], '#6a5a8a']
    for sy in (y0 + 5, y0 + 13, y0 + 21):
        if sy + 6 > y1:
            break
        for x in range(x0 + 1, x1, 2):
            if h2(x, sy, seed) < 0.1:
                continue
            h = 4 + int(h2(x, sy + 1, seed) * 3)
            col = cols[int(h2(x, sy + 2, seed) * len(cols))]
            c.vl(x, sy + 6 - h, sy + 5, col)
            c.px(x, sy + 6 - h, mix(col, '#ffffff', 0.3))
        c.hl(x0, x1, sy + 6, OAK[3])


def goods_pharma(c, x0, y0, x1, y1, seed):
    for x in range(x0 + 3, x1 - 3, 7):
        for sy, col in ((y0 + 8, GREEN[4]), (y0 + 16, '#b83a6e')):
            c.rect(x, sy, x + 2, sy + 5, col)
            c.px(x, sy, mix(col, '#ffffff', 0.5))
            c.hl(x - 1, x + 3, sy + 6, CREAM[1])


class Immeuble(Oblique):
    """The Haussmann-era apartment house: rusticated shop storey, a piano
    nobile and attic storey with continuous balconies, a cornice, and a slate
    mansard with a dormer on every bay axis."""

    def __init__(self, bays=5, storeys=4, stone=LIME, shop=None, seed=0,
                 entrance=None, boxes=0.35, W=None, sd=14, brick=False, corner=None):
        W = W or bays * 20 + 8
        bays = (W - 8) // 20
        self.bays, self.storeys, self.stone, self.shop = bays, storeys, stone, shop
        self.seed, self.boxes, self.brick, self.corner = seed, boxes, brick, corner
        self.entrance = entrance
        self.mx = (W - bays * 20) // 2
        self.M, self.COR = 30, 9
        wall = GROUND + STOREY * (storeys - 1)
        super().__init__(W, wall, self.M + self.COR + 22, sd)

    def render(self):
        W, st, c, sd = self.W, self.stone, self.c, self.sd
        H = self.H
        wall_top = H - self.wall
        cor = wall_top - self.COR
        T = cor - self.M
        self.T = T
        # Side: a party wall in shade, cornice and mansard carried round.
        side = C(sd, H - T)
        side.rect(0, 0, sd - 1, side.h - 1, st[2])
        for y in range(side.h - 12, side.h):
            side.hl(0, sd - 1, y, mix(st[2], st[1], (y - side.h + 12) / 16))
        side.rect(0, self.M, sd - 1, self.M + self.COR - 1, st[3])
        side.hl(0, sd - 1, self.M + self.COR - 1, st[1])
        for y in range(self.M):
            for x in range(sd):
                side.px(x, y, SLATE[2] if (y % 3) else SLATE[1])
        side.hl(0, sd - 1, 0, SLATE[4])
        self.side(side.im, T)
        self.flat_top(4, W - 1, T, SLATE)
        # Chimney stacks on the party walls stand back on the roof.
        for cx in (3, W - 15):
            self.chimney(cx + DRIFT // 2 + 1, T - 5, 11, 12, st, pots=3)
        # Mansard: steep slate lower slope, zinc roll at the break.
        for y in range(T, cor):
            inset = (cor - y) * 4 // self.M
            for x in range(inset, W):
                row = (y - T) // 3
                col = SLATE[3]
                if (y - T) % 3 == 2:
                    col = SLATE[2]
                elif (x + (row % 2) * 3) % 6 == 0:
                    col = SLATE[2]
                elif (x + (row % 2) * 3) % 6 == 1 and y - T < 12:
                    col = SLATE[4]
                if x == inset:
                    col = SLATE[5]
                c.px(x, y, col)
        c.hl(4, W - 1, T, SLATE[6])
        c.hl(3, W - 1, T + 1, SLATE[5])
        # Cornice.
        y = cor
        c.rect(0, y, W - 1, wall_top - 1, st[4])
        c.hl(0, W - 1, y, st[6])
        c.hl(0, W - 1, y + 1, st[5])
        c.hl(0, W - 1, y + 3, st[2])
        for x in range(0, W, 3):
            c.rect(x, y + 4, x + 1, y + 5, st[5])
            c.px(x + 2, y + 4, st[2])
        c.hl(0, W - 1, y + 6, st[3])
        c.hl(0, W - 1, y + 7, st[1])
        c.hl(0, W - 1, y + 8, st[0])
        # Walls.
        c.rect(0, wall_top, W - 1, H - 1, st[4])
        for yy in range(wall_top + 1, H - GROUND, 7):
            for x in range(W):
                if (x + (yy // 7) * 9) % 23 == 0:
                    c.px(x, yy - 1, st[3])
                c.px(x, yy, mix(st[4], st[3], 0.55))
        c.hl(0, W - 1, wall_top, st[2])
        c.hl(0, W - 1, wall_top + 1, mix(st[4], st[2], 0.5))
        c.vl(0, wall_top, H - 1, st[5])
        # Rusticated ground storey: deep horizontal channels.
        gy = H - GROUND
        for yy in range(gy + 5, H, 6):
            c.hl(0, W - 1, yy, st[2])
            c.hl(0, W - 1, yy + 1, st[5])
        c.rect(0, gy - 3, W - 1, gy, st[5])
        c.hl(0, W - 1, gy - 3, st[6])
        c.hl(0, W - 1, gy, st[2])
        c.hl(0, W - 1, gy + 1, st[3])
        axes = [self.mx + k * 20 + 10 for k in range(self.bays)]
        if self.brick:
            self.coursing(wall_top + 2, H - GROUND - 4)
        # Upper storeys, top down.
        for s in range(1, self.storeys):
            fy = H - GROUND - STOREY * s
            if s > 1:
                c.hl(0, W - 1, fy + STOREY - 2, st[5])
                c.hl(0, W - 1, fy + STOREY - 1, st[3])
            tall = 24 if s in (1, 2) else 20 if s < self.storeys - 1 else 18
            wy = fy + STOREY - 4 - tall
            balcony = s == 1 or (self.storeys >= 4 and s == self.storeys - 1)
            for k, ax in enumerate(axes):
                wx = ax - 5
                french_window(c, wx, wy, 10, tall, st, self.seed + k * 7 + s,
                              curtain=h2(k, s, self.seed) < 0.4)
                if s == 1:
                    pediment(c, wx, wy - 1, 10, st, segmental=k % 2 == 1)
                else:
                    keystone_head(c, wx, wy, 10, st)
                if not balcony:
                    iron_rail(c, wx - 1, wx + 10, wy + tall - 7, 7)
                    c.hl(wx - 2, wx + 11, wy + tall, st[5])
                    c.hl(wx - 2, wx + 11, wy + tall + 1, st[2])
                    if h2(k, s, self.seed + 5) < self.boxes:
                        flower_box(c, wx, wx + 9, wy + tall - 9, self.seed + k + s)
            if balcony:
                by = wy + tall - 8
                c.rect(0, by + 8, W - 1, by + 10, st[5])
                c.hl(0, W - 1, by + 8, st[6])
                c.hl(0, W - 1, by + 10, st[2])
                for x in range(2, W - 2, 4):
                    c.px(x, by + 11, st[3])
                    c.px(x + 1, by + 11, st[1])
                c.hl(0, W - 1, by + 12, mix(st[4], st[1], 0.5))
                iron_rail(c, 0, W - 1, by, 8)
                for k, ax in enumerate(axes):
                    if s == 1 and h2(k, 9, self.seed) < self.boxes:
                        flower_box(c, ax - 6, ax + 5, by - 2, self.seed + k * 3)
        # Dormers on the bay axes.
        for k, ax in enumerate(axes):
            self.dormer(ax, cor, T)
        # Ground storey.
        shop = self.shop
        ent = self.entrance
        if ent is not None:
            ax = axes[ent]
            self.porte(ax, H)
        if shop:
            paint, sign, goods, awning = shop[:4]
            if ent is None:
                x0, x1 = 3, W - 4
            elif ent == 0:
                x0, x1 = axes[0] + 13, W - 4
            else:
                x0, x1 = 3, axes[ent] - 13
            shop_front(c, x0, x1, gy + 5, H - 1, paint, sign, goods, self.seed,
                       awning, door='right' if ent != self.bays - 1 else 'left')
            self.shop_door = c.door_cx
            if ent is not None and 0 < ent < self.bays - 1:
                x0 = axes[ent] + 13
                shop_front(c, x0, W - 4, gy + 5, H - 1, shop[4] if len(shop) > 4 else paint,
                           shop[5] if len(shop) > 5 else sign, shop[6] if len(shop) > 6 else goods,
                           self.seed + 1, None, door='left')
        else:
            for k, ax in enumerate(axes):
                if k != ent:
                    french_window(c, ax - 5, gy + 14, 10, 26, st, self.seed + k)
                    keystone_head(c, ax - 5, gy + 14, 10, st)
                    iron_rail(c, ax - 5, ax + 4, gy + 32, 7, pattern=1)
        c.hl(0, W - 1, H - 1, st[1])
        if ent is not None:
            self.door_x = axes[ent]
        else:
            self.door_x = self.shop_door
        if self.corner:
            self.cut_corner(wall_top, cor, T)
        return outline(c.im)

    def cut_corner(self, wall_top, cor, T):
        """The pan coupe: the corner cut back on the diagonal as a narrow bay,
        lit on the west corner and shaded on the east, with a slate dome and
        a door to the corner shop."""
        c, st, W, H = self.c, self.stone, self.W, self.H
        east = self.corner == 'e'
        x0, x1 = (W - 11, W - 1) if east else (0, 10)
        face, edge = (st[3], st[2]) if east else (st[5], st[4])
        c.rect(x0, wall_top, x1, H - 1, face)
        c.vl(x0 if east else x1, wall_top, H - 1, edge)
        for yy in range(H - GROUND + 5, H, 6):
            c.hl(x0, x1, yy, mix(face, st[1], 0.5))
        cx = (x0 + x1) // 2
        for s in range(1, self.storeys):
            fy = H - GROUND - STOREY * s
            wy = fy + 12
            c.rect(cx - 3, wy - 1, cx + 3, wy + 20, '#e9e3d6')
            glass(c, cx - 2, wy, cx + 2, wy + 19, s + x0)
            iron_rail(c, cx - 3, cx + 3, wy + 13, 7, pattern=1)
            c.rect(cx - 4, wy - 4, cx + 4, wy - 2, st[5] if not east else st[4])
        c.rect(cx - 4, H - 36, cx + 4, H - 1, OAK[1])
        glass(c, cx - 3, H - 34, cx + 3, H - 12, x0)
        c.rect(cx - 3, H - 10, cx + 3, H - 2, OAK[2])
        c.rect(x0, cor, x1, wall_top - 1, st[4] if not east else st[3])
        c.hl(x0, x1, cor, st[6])
        for y in range(T - 12, cor):
            for x in range(x0 - 1, x1 + 2):
                d = ((x - cx + .5) / 7) ** 2 + ((y - cor + .5) / (cor - T + 12)) ** 2
                if d <= 1 and y < cor:
                    k = 5 if x < cx - 2 else 4 if x < cx + 2 else 3
                    if (y - T) % 4 == 0:
                        k -= 1
                    c.px(x, y, SLATE[k])
        c.vl(cx, T - 18, T - 12, IRON[2])
        c.px(cx, T - 19, GOLD[2])

    def coursing(self, y0, y1):
        c, st = self.c, self.stone
        for y in range(y0, y1):
            row = (y - y0) // 4
            for x in range(self.W):
                if (y - y0) % 4 == 3:
                    c.px(x, y, mix(st[4], st[3], 0.7))
                elif (x + (row % 2) * 4) % 8 == 0 and h2(x // 8, row, self.seed) < 0.6:
                    c.px(x, y, mix(st[4], st[3], 0.5))
                elif h2(x // 9, (y + x // 9 * 3) // 8, self.seed) > 0.86:
                    c.px(x, y, mix(st[4], st[5], 0.4))

    def dormer(self, ax, cor, T):
        c, st = self.c, self.stone
        x0, x1 = ax - 6, ax + 6
        top = T - 3
        c.rect(x0 + 1, top + 6, x1 - 1, cor - 1, st[4])
        c.vl(x0 + 1, top + 6, cor - 1, st[5])
        c.rect(x1, top + 7, x1 + 2, cor - 1, SLATE[1])
        c.rect(ax - 3, top + 9, ax + 2, cor - 3, '#e9e3d6')
        glass(c, ax - 2, top + 10, ax + 1, cor - 3, ax)
        c.vl(ax, top + 14, cor - 3, '#e9e3d6')
        c.hl(x0 + 1, x1 - 1, cor - 1, st[2])
        for i in range(7):
            c.px(x0 + i, top + 6 - i * 6 // 7, st[6])
            c.px(x1 - i, top + 6 - i * 6 // 7, st[3])
            for yy in range(top + 7 - i * 6 // 7, top + 8):
                c.px(x0 + i, yy, st[5])
                c.px(x1 - i, yy, st[4])
        c.hl(x0, x1, top + 7, st[2])
        c.px(ax, top - 1, SLATE[5])

    def porte(self, ax, H):
        """The porte-cochere: a round-arched carriage door in oak, a fanlight
        and a rusticated surround."""
        c, st = self.c, self.stone
        x0, x1 = ax - 9, ax + 8
        top = H - 46
        r = 9
        for y in range(top - 4, H):
            for x in range(x0 - 3, x1 + 4):
                dy = top + r - y
                inside_arch = y >= top + r or (x - ax + .5) ** 2 + dy ** 2 <= (r + 3) ** 2
                if inside_arch:
                    c.px(x, y, st[5] if x < ax else st[4])
        for x in range(x0 - 3, x1 + 4, 3):
            pass
        for y in range(top, H):
            for x in range(x0, x1 + 1):
                dy = top + r - y
                if y >= top + r or (x - ax + .5) ** 2 + dy ** 2 <= r * r:
                    fan = y < top + r
                    if fan:
                        ang = math.atan2(dy, x - ax + .5)
                        spoke = int(ang / (math.pi / 6) + 0.5) % 1 == 0 and abs(ang * 6 / math.pi - round(ang * 6 / math.pi)) < 0.12
                        c.px(x, y, IRON[1] if spoke or y == top + r - 1 else GLASS[2] if dy > 4 else GLASS[3])
                    else:
                        leaf = x < ax
                        k = (x - x0) if leaf else (x1 - x)
                        col = OAK[2]
                        yy = y - top - r
                        if k in (2, 7) or yy % 12 in (2, 10):
                            col = OAK[1]
                        if k in (3,) or yy % 12 == 3:
                            col = OAK[3]
                        c.px(x, y, col)
        c.vl(ax, top + r, H - 1, OAK[0])
        c.vl(ax - 1, top + r, H - 1, OAK[1])
        c.rect(ax - 1, top - 6, ax + 1, top - 1, st[6])
        c.vl(ax + 1, top - 5, top - 1, st[3])
        c.px(ax - 3, top + r + 16, GOLD[2])
        c.px(ax + 2, top + r + 16, GOLD[2])
        c.hl(x0 - 2, x1 + 2, H - 1, st[2])


class TownHouse(Oblique):
    """A brick terrace house: stone quoins and dressings, six-over-six sashes,
    a slate roof with dormers, a raised door up a stoop."""

    def __init__(self, bays=3, storeys=3, seed=0, brick=BRICK, door_col=GREEN, W=None, sd=16):
        W = W or bays * 20 + 12
        bays = (W - 12) // 20
        self.bays, self.storeys, self.seed, self.brick, self.door_col = bays, storeys, seed, brick, door_col
        self.mx = (W - bays * 20) // 2
        self.R = 30
        wall = GROUND - 6 + STOREY * (storeys - 1)
        super().__init__(W, wall, self.R + 30, sd)

    def brickwork(self, c, x0, y0, x1, y1, b, seed, dark=0):
        """Brick as a flat field: bed joints one tone down, heads only every
        other brick, colour drifting in broad patches, never pixel noise."""
        for y in range(y0, y1 + 1):
            row = (y - y0) // 4
            for x in range(x0, x1 + 1):
                patch = h2(x // 11, (y + (x // 11) * 3) // 9, seed)
                base = b[4 - dark] if patch < 0.72 else b[3 - dark] if patch < 0.9 else b[5 - dark]
                if (y - y0) % 4 == 3:
                    col = b[3 - dark]
                elif (x + (row % 2) * 4) % 8 == 0 and h2(x // 8, row, seed) < 0.7:
                    col = b[3 - dark]
                else:
                    col = base
                c.px(x, y, col)

    def render(self):
        W, c, sd, b = self.W, self.c, self.sd, self.brick
        H = self.H
        wall_top = H - self.wall
        R = self.R
        self.T = wall_top
        # Gable end, sheared: the side wall and the roof's triangle together.
        rise = R
        side = C(sd, self.wall + rise)
        side.rect(0, 0, sd - 1, side.h - 1, b[2])
        for y in range(0, side.h, 8):
            side.hl(0, sd - 1, y, mix(b[2], b[1], 0.5))
        for x in range(sd):
            apex = rise - int(rise * (1 - abs(x - sd / 2) / (sd / 2)))
            for y in range(0, apex):
                side.px(x, y, (0, 0, 0, 0))
            side.px(x, apex, SLATE[4])
            side.px(x, apex + 1, SLATE[2])
        self.side(side.im, wall_top - rise)
        # Front roof slope: from the eave back to the ridge at half depth.
        ridge_y = wall_top - rise - sd // 2
        for y in range(ridge_y, wall_top + 1):
            t = (wall_top - y) / (wall_top - ridge_y)
            xl = -2 + round(t * DRIFT / 2)
            xr = W + 1 + round(t * DRIFT / 2)
            for x in range(xl, xr + 1):
                row = (wall_top - y) // 3
                col = SLATE[3]
                if (wall_top - y) % 3 == 0:
                    col = SLATE[2]
                elif (x + (row % 2) * 3) % 6 == 0:
                    col = SLATE[2]
                elif (x + (row % 2) * 3) % 6 == 1 and t > 0.4:
                    col = SLATE[4]
                if y == ridge_y:
                    col = SLATE[6]
                elif y == ridge_y + 1:
                    col = SLATE[5]
                c.px(x, y, col)
        c.hl(-2, W + 1, wall_top, SLATE[1])
        c.hl(-2, W + 1, wall_top + 1, SLATE[0])
        # Stacks on both gables.
        self.chimney(2 + DRIFT // 2, ridge_y + 2, 12, 16, b, depth=4, pots=4)
        self.chimney(W - 14 + DRIFT // 2, ridge_y + 2, 12, 16, b, depth=4, pots=4)
        # Walls.
        self.brickwork(c, 0, wall_top + 2, W - 1, H - 1, b, self.seed)
        c.hl(0, W - 1, wall_top + 2, b[2])
        c.hl(0, W - 1, wall_top + 3, b[3])
        # Quoins: alternating long and short stones on both corners.
        for yy in range(wall_top + 2, H - 8, 8):
            for x0, long_ in ((0, (yy // 8) % 2 == 0), (W - 7, (yy // 8) % 2 == 1)):
                w_ = 7 if long_ else 4
                xa = x0 if x0 == 0 else W - w_
                c.rect(xa, yy, xa + w_ - 1, yy + 6, LIME[4])
                c.hl(xa, xa + w_ - 1, yy, LIME[5])
                c.hl(xa, xa + w_ - 1, yy + 6, LIME[2])
                c.vl(xa + w_ - 1, yy, yy + 6, LIME[3])
        # Plinth: stone basement band.
        c.rect(0, H - 10, W - 1, H - 1, LIME[3])
        c.hl(0, W - 1, H - 10, LIME[5])
        c.hl(0, W - 1, H - 9, LIME[4])
        for x in range(0, W, 12):
            c.vl(x, H - 8, H - 1, LIME[2])
        axes = [self.mx + k * 20 + 10 for k in range(self.bays)]
        door_k = self.bays - 1
        for s in range(self.storeys):
            fy = H - (GROUND - 6) - STOREY * (s - 1) if s else H - (GROUND - 6)
            if s:
                fy = H - (GROUND - 6) - STOREY * s
            tall = 22 if s < 2 else 18
            wy = fy + (STOREY if s else GROUND - 6) - tall - (14 if s == 0 else 7)
            if s:
                c.hl(6, W - 7, fy + STOREY - 1, LIME[4])
                c.hl(6, W - 7, fy + STOREY, LIME[2])
            for k, ax in enumerate(axes):
                if s == 0 and k == door_k:
                    continue
                self.sash(ax - 5, wy, 10, tall)
        self.door(axes[door_k], H)
        c.hl(0, W - 1, H - 1, LIME[1])
        # Dormers in the roof.
        for k, ax in enumerate(axes):
            if k % 2 == 0 or self.bays < 3:
                self.dormer(ax + 3, wall_top)
        self.door_x = axes[door_k]
        return outline(self.c.im)

    def sash(self, x, y, w, h):
        c = self.c
        c.rect(x - 1, y - 1, x + w, y + h, '#ede7da')
        glass(c, x, y, x + w - 1, y + h - 1, x + y)
        for yy in (y + h // 2 - 1,):
            c.hl(x, x + w - 1, yy, '#ede7da')
            c.hl(x, x + w - 1, yy + 1, '#a6a2a6')
        for yy in (y + h // 4, y + 3 * h // 4):
            c.hl(x, x + w - 1, yy, '#cfc9c0')
        for xx in (x + w // 3, x + 2 * w // 3):
            c.vl(xx, y, y + h - 1, '#cfc9c0')
        c.rect(x - 3, y - 5, x + w + 2, y - 2, LIME[4])
        c.hl(x - 3, x + w + 2, y - 5, LIME[5])
        c.hl(x - 3, x + w + 2, y - 2, LIME[2])
        c.rect(x + w // 2 - 1, y - 6, x + w // 2 + 1, y - 2, LIME[5])
        c.rect(x - 2, y + h + 1, x + w + 1, y + h + 2, LIME[5])
        c.hl(x - 2, x + w + 1, y + h + 3, self.brick[1])

    def door(self, ax, H):
        """A panelled door with a fanlight, raised up a stoop of five steps."""
        c, d = self.c, self.door_col
        x0 = ax - DOOR_W // 2 + 1
        steps = 5
        base = H - 1 - steps * 2
        top = base - DOOR_H + 4
        c.rect(x0 - 4, top - 10, x0 + DOOR_W + 2, base, LIME[4])
        c.vl(x0 - 4, top - 10, base, LIME[5])
        c.vl(x0 + DOOR_W + 2, top - 10, base, LIME[2])
        c.rect(x0 - 5, top - 12, x0 + DOOR_W + 3, top - 10, LIME[5])
        c.hl(x0 - 5, x0 + DOOR_W + 3, top - 9, LIME[2])
        c.rect(x0 - 1, top - 8, x0 + DOOR_W - 1, top - 2, '#ede7da')
        glass(c, x0, top - 7, x0 + DOOR_W - 2, top - 3, 5)
        for i in range(0, DOOR_W - 1, 3):
            c.px(x0 + i, top - 4, '#ede7da')
        c.rect(x0 - 1, top - 1, x0 + DOOR_W - 1, base, d[0])
        c.rect(x0, top, x0 + DOOR_W - 2, base, d[2])
        for py0, py1 in ((top + 2, top + 15), (top + 18, base - 2)):
            for px0 in (x0 + 2, x0 + DOOR_W // 2 + 1):
                c.rect(px0, py0, px0 + 4, py1, d[1])
                c.hl(px0, px0 + 4, py1, d[3])
                c.vl(px0 + 4, py0, py1, d[3])
        c.px(x0 + DOOR_W - 4, top + 17, GOLD[2])
        c.px(x0 + DOOR_W // 2 - 1, top + 10, GOLD[3])
        for i in range(steps):
            y = base + 1 + i * 2
            c.rect(x0 - 3 - i, y, x0 + DOOR_W + 1 + i, y + 1, LIME[3])
            c.hl(x0 - 3 - i, x0 + DOOR_W + 1 + i, y, LIME[5])
        for side, sx in ((-1, x0 - 5), (1, x0 + DOOR_W + 3)):
            for i in range(steps + 1):
                x = sx + side * i
                y = base - 8 + i * 2
                c.vl(x, y, y + 8, IRON[1])
                c.px(x, y - 1, IRON[2])
            c.rect(sx + side * (steps + 1) - (1 if side > 0 else 0), H - 5,
                   sx + side * (steps + 1) + (0 if side > 0 else 1), H - 1, IRON[1])

    def dormer(self, ax, eave):
        c = self.c
        x0, x1 = ax - 7, ax + 7
        bot = eave - 4
        top = bot - 18
        c.rect(x0, top + 5, x1, bot, '#ede7da')
        c.vl(x0, top + 5, bot, '#ffffff')
        c.rect(x1 + 1, top + 6, x1 + 3, bot, SLATE[1])
        glass(c, x0 + 3, top + 8, x1 - 3, bot - 2, ax)
        c.vl(ax, top + 8, bot - 2, '#ede7da')
        for i in range(8):
            y = top + 5 - i * 5 // 8
            c.px(x0 - 1 + i, y, SLATE[5])
            c.px(x1 + 1 - i, y, SLATE[3])
            for yy in range(y + 1, top + 6):
                c.px(x0 - 1 + i, yy, SLATE[3])
                c.px(x1 + 1 - i, yy, SLATE[2])
        c.hl(x0 - 1, x1 + 1, top + 6, SLATE[1])


class Mairie(Oblique):
    """A town hall: a pedimented centre pavilion on columns with a clock and
    a flag, plain wings, a slate roof with a lantern."""

    def __init__(self, seed=0, stone=WARM_LIME, W=132, sd=18, sign='MAIRIE'):
        self.seed, self.stone, self.sign = seed, stone, sign
        wall = GROUND + STOREY + 6
        super().__init__(W, wall, 76, sd)

    def render(self):
        W, c, sd, st = self.W, self.c, self.sd, self.stone
        H = self.H
        wall_top = H - self.wall
        T = wall_top - 26
        side = C(sd, H - T)
        side.rect(0, 0, sd - 1, side.h - 1, st[2])
        for y in range(0, 26):
            for x in range(sd):
                side.px(x, y, SLATE[2] if y % 3 else SLATE[1])
        side.rect(0, 26, sd - 1, 33, st[3])
        side.hl(0, sd - 1, 33, st[1])
        self.side(side.im, T)
        self.flat_top(6, W - 1, T, SLATE)
        # Roof lantern (campanile) at the centre, set back.
        lx = W // 2 + DRIFT // 2 - 7
        ly = T - sd // 2
        c.rect(lx, ly - 20, lx + 13, ly, st[4])
        c.vl(lx, ly - 20, ly, st[5])
        c.rect(lx + 14, ly - 21, lx + 14, ly - 1, st[2])
        c.rect(lx + 4, ly - 16, lx + 9, ly - 4, IRON[1])
        c.rect(lx + 5, ly - 15, lx + 8, ly - 5, GLASS[2])
        for i in range(10):
            c.hl(lx - 1 + i // 2 + i // 4, lx + 14 - i // 2 - i // 4, ly - 21 - i, SLATE[4] if i % 2 else SLATE[3])
        c.vl(lx + 7, ly - 38, ly - 30, IRON[2])
        # Flag.
        fx = lx + 7
        for x in range(12):
            for y in range(7):
                wave = round(math.sin((x + 1) * 0.6) * 1)
                col = ['#28418a', '#f0ece2', '#c43a3c'][x // 4]
                if y == 0:
                    col = mix(col, '#ffffff', 0.25)
                c.px(fx + 1 + x, ly - 38 + y + wave, col)
        for y in range(T, wall_top):
            inset = (wall_top - y) * 5 // 26
            for x in range(inset, W):
                col = SLATE[3]
                if (y - T) % 3 == 2:
                    col = SLATE[2]
                elif (x + ((y - T) // 3 % 2) * 3) % 6 == 0:
                    col = SLATE[2]
                if x == inset:
                    col = SLATE[5]
                c.px(x, y, col)
        c.hl(5, W - 1, T, SLATE[6])
        # Cornice and walls.
        c.rect(0, wall_top, W - 1, H - 1, st[4])
        c.rect(0, wall_top, W - 1, wall_top + 7, st[4])
        c.hl(0, W - 1, wall_top, st[6])
        c.hl(0, W - 1, wall_top + 2, st[2])
        for x in range(0, W, 3):
            c.rect(x, wall_top + 3, x + 1, wall_top + 4, st[5])
            c.px(x + 2, wall_top + 3, st[2])
        c.hl(0, W - 1, wall_top + 6, st[2])
        c.hl(0, W - 1, wall_top + 7, st[1])
        for yy in range(H - GROUND + 5, H, 6):
            c.hl(0, W - 1, yy, st[2])
            c.hl(0, W - 1, yy + 1, st[5])
        c.rect(0, H - GROUND - 3, W - 1, H - GROUND, st[5])
        c.hl(0, W - 1, H - GROUND, st[2])
        pw = 48 if W < 200 else 72
        px0, px1 = W // 2 - pw // 2, W // 2 + pw // 2
        axes = []
        for ax in range(12, px0 - 8, 20):
            axes += [ax, W - 1 - ax]
        for ax in axes:
            french_window(c, ax - 5, H - GROUND - STOREY + 4, 10, 26, st, ax)
            pediment(c, ax - 5, H - GROUND - STOREY + 3, 10, st, segmental=True)
            iron_rail(c, ax - 6, ax + 5, H - GROUND - STOREY + 23, 7)
            french_window(c, ax - 5, H - GROUND + 12, 10, 26, st, ax + 1)
            keystone_head(c, ax - 5, H - GROUND + 12, 10, st)
        # Centre pavilion, standing forward with its own pediment.
        top = wall_top - 16
        c.rect(px0, top, px1, H - 1, st[5])
        c.vl(px0, top, H - 1, st[6])
        c.vl(px1, top, H - 1, st[2])
        c.rect(px1 + 1, top + 1, px1 + 3, H - 1, st[1])
        half = (px1 - px0) // 2
        for i in range(half + 1):
            y = top - i * 14 // half
            for yy in range(y, top + 1):
                c.px(px0 + i, yy, st[5])
                c.px(px1 - i, yy, st[4])
            c.px(px0 + i, y, st[6])
            c.px(px1 - i, y, st[3])
            c.px(px0 + i, y + 1, st[6] if i % 2 else st[5])
        c.hl(px0, px1, top, st[6])
        c.hl(px0, px1, top + 1, st[2])
        sphere(c, (px0 + px1) / 2, top - 5, 4.5, [st[0], '#e8e2d2', '#f7f2e6', '#ffffff'])
        c.px((px0 + px1) // 2, top - 6, IRON[1])
        c.px((px0 + px1) // 2 + 1, top - 7, IRON[1])
        c.px((px0 + px1) // 2, top - 8, IRON[1])
        text(c, self.sign, (px0 + px1) // 2 + 1, top + 5, st[1])
        # Columns carrying the entablature, the recess dark behind them.
        cy0, cy1 = top + 13, H - 9
        c.rect(px0 + 3, cy0, px1 - 3, cy1, st[2])
        for yy in range(cy0, cy1 + 1):
            c.hl(px0 + 3, px1 - 3, yy, mix(st[2], st[1], min(1, (yy - cy0) / 20)) if yy < cy0 + 20 else st[1])
        ncol = (px1 - px0 - 12) // 12 + 1
        for k in range(ncol - 1):
            ax = px0 + 12 + k * 12
            c.rect(ax - 5, cy0 + 8, ax + 5, cy1, OAK[1])
            for yy in range(cy0 + 12, cy1, 1):
                c.px(ax - 5 + (yy % 2), yy, OAK[2])
            c.rect(ax - 4, cy0 + 9, ax + 4, cy0 + 16, GLASS[2])
            c.hl(ax - 4, ax + 4, cy0 + 9, GLASS[0])
            c.vl(ax, cy0 + 9, cy1, OAK[0])
        for k in range(ncol):
            x = px0 + 6 + k * 12
            c.rect(x - 2, cy0, x + 2, cy1, st[4])
            c.vl(x - 2, cy0, cy1, st[6])
            c.vl(x - 1, cy0, cy1, st[5])
            c.vl(x + 2, cy0, cy1, st[2])
            c.rect(x - 3, cy0, x + 3, cy0 + 2, st[5])
            c.hl(x - 3, x + 3, cy0 + 2, st[2])
            c.rect(x - 3, cy1 - 1, x + 3, cy1, st[5])
        # Steps across the pavilion.
        for i in range(4):
            y = H - 8 + i * 2
            c.rect(px0 - 2 - i * 2, y, px1 + 2 + i * 2, y + 1, st[4])
            c.hl(px0 - 2 - i * 2, px1 + 2 + i * 2, y, st[6])
        for fx in (px0 - 6, px1 + 6):
            c.vl(fx, H - 34, H - 9, IRON[1])
            c.rect(fx - 1, H - 38, fx + 1, H - 34, IRON[1])
            c.px(fx, H - 37, '#f3e2a8')
        c.hl(0, W - 1, H - 1, st[1])
        self.door_x = px0 + 12 + ((ncol - 1) // 2) * 12
        return outline(c.im)


class Atelier(Oblique):
    """A yard range of one storey: a workshop, stable or coach house, rendered
    or brick, under pantiles or slate. It lines a block's back and ends below
    the tall street range, so the lane behind is walled, not open."""

    def __init__(self, seed=0, W=44, sd=10, roof='tile', wall=WARM_LIME, coach=False):
        self.seed, self.roof, self.wallc, self.coach = seed, roof, wall, coach
        super().__init__(W, 44, 18, sd)

    def render(self):
        W, c, sd, wl = self.W, self.c, self.sd, self.wallc
        H = self.H
        wt = H - self.wall
        rise = 14
        side = C(sd, self.wall + rise)
        side.rect(0, 0, sd - 1, side.h - 1, wl[2])
        for x in range(sd):
            apex = rise - int(rise * min(1, x / max(1, sd * 0.6)))
            for y in range(0, apex):
                side.px(x, y, (0, 0, 0, 0))
        self.side(side.im, wt - rise)
        tile = self.roof == 'tile'
        for y in range(wt - rise - sd // 2, wt + 3):
            t = (wt + 3 - y) / (rise + sd // 2 + 3)
            xl = -2 + round(t * DRIFT * 0.6)
            for x in range(xl, W + 2 + round(t * DRIFT * 0.6)):
                if tile:
                    col = TERRA[3] if (x // 3) % 2 else TERRA[2]
                    if (y - wt) % 4 == 0:
                        col = TERRA[1]
                    elif (x // 3) % 2 and x % 3 == 0:
                        col = TERRA[4]
                else:
                    row = (wt - y) // 3
                    col = SLATE[2] if (wt - y) % 3 == 0 or (x + (row % 2) * 3) % 6 == 0 else SLATE[3]
                if y == wt - rise - sd // 2:
                    col = TERRA[4] if tile else SLATE[5]
                c.px(x, y, col)
        c.hl(-2, W + 1, wt + 3, IRON[1])
        brick = wl is BRICK
        c.rect(0, wt + 4, W - 1, H - 1, wl[4])
        for x in range(W):
            for y in range(wt + 4, H):
                if brick and (y % 4 == 3 or ((x + (y // 4 % 2) * 4) % 8 == 0 and h2(x // 8, y // 4, self.seed) < 0.6)):
                    c.px(x, y, wl[3])
                elif not brick and h2(x // 6, y // 5, self.seed) < 0.12:
                    c.px(x, y, wl[3])
        c.hl(0, W - 1, wt + 4, wl[2])
        c.rect(0, H - 5, W - 1, H - 1, LIME[3])
        c.hl(0, W - 1, H - 5, LIME[5])
        units = max(1, (W - 4) // 22)
        pitch = (W - 4) / units
        door_unit = 0 if not self.coach else units // 2
        for u in range(units):
            ux = int(2 + u * pitch + pitch / 2)
            if u == door_unit and self.coach:
                x0, x1, top = ux - 9, ux + 8, H - 38
                for y in range(top, H):
                    for x in range(x0, x1 + 1):
                        r = 9
                        if y >= top + r or (x - ux + .5) ** 2 + (top + r - y) ** 2 <= r * r:
                            k = (x - x0) % 4
                            c.px(x, y, OAK[3] if k == 0 else OAK[2])
                for y in range(top + 2, H):
                    for x in (x0 - 1, x1 + 1):
                        if y >= top + 9:
                            c.px(x, y, LIME[5] if x < ux else LIME[3])
                c.vl(ux, top + 9, H - 1, OAK[0])
                c.hl(x0, x1, top + 20, OAK[1])
                self.door_x = ux
            elif u == door_unit:
                x0 = ux - 8
                c.rect(x0, H - 36, x0 + 15, H - 1, OAK[1])
                for x in range(x0 + 1, x0 + 15):
                    c.vl(x, H - 35, H - 1, OAK[3] if x % 3 == 0 else OAK[2])
                c.hl(x0 + 1, x0 + 14, H - 29, OAK[1])
                c.hl(x0 + 1, x0 + 14, H - 8, OAK[1])
                for i in range(14):
                    c.px(x0 + 1 + i, H - 9 - i * 19 // 14, OAK[1])
                c.rect(x0 - 2, H - 38, x0 + 17, H - 37, LIME[5])
                self.door_x = ux
            else:
                x0 = ux - 6
                c.rect(x0 - 1, H - 32, x0 + 12, H - 17, '#ede7da')
                glass(c, x0, H - 31, x0 + 11, H - 18, u + self.seed)
                c.vl(x0 + 5, H - 31, H - 18, '#ede7da')
                c.hl(x0, x0 + 11, H - 25, '#ede7da')
                c.rect(x0 - 2, H - 16, x0 + 13, H - 15, LIME[5])
                c.rect(x0 - 2, H - 35, x0 + 13, H - 33, LIME[4] if not brick else wl[5])
        c.hl(0, W - 1, H - 1, LIME[1])
        return outline(c.im)


# ---------------------------------------------------------------- outworks

def garden_wall(w=56, h=22, gate=True):
    """A rendered garden wall with a stone coping, piers with ball finials and
    a pair of iron gates."""
    c = C(w + 6, h + 12)
    base = c.h - 1
    top = base - h
    c.rect(0, top, w - 1, base, WARM_LIME[4])
    for x in range(w):
        for y in range(top, base + 1):
            if h2(x // 5, y // 4, 3) < 0.15:
                c.px(x, y, WARM_LIME[3])
    c.rect(-1, top - 3, w, top, LIME[5])
    c.hl(-1, w, top - 3, LIME[6])
    c.hl(-1, w, top, LIME[2])
    c.hl(0, w - 1, top + 1, WARM_LIME[2])
    for i in range(1, 4):
        c.hl(w, w + 2, top - 3 + i, LIME[3])
    c.rect(w, top + 1, w + 2, base - 2, WARM_LIME[2])
    if gate:
        g0, g1 = w // 2 - 11, w // 2 + 10
        c.rect(g0, top - 3, g1, base, (0, 0, 0, 0))
        for px0 in (g0 - 6, g1 + 1):
            c.rect(px0, top - 6, px0 + 5, base, LIME[4])
            c.vl(px0, top - 6, base, LIME[6])
            c.vl(px0 + 5, top - 6, base, LIME[2])
            c.rect(px0 - 1, top - 8, px0 + 6, top - 6, LIME[5])
            sphere(c, px0 + 2.5, top - 11, 3.2, LIME[1:])
        for x in range(g0, g1 + 1):
            k = (x - g0) % 3
            if k == 0:
                arc = int(3 * math.sin(math.pi * ((x - g0) % 11) / 11))
                c.vl(x, top + 2 - arc, base - 1, IRON[1])
                c.px(x, top + 1 - arc, IRON[3])
        for y in (top + 6, base - 4):
            c.hl(g0, g1, y, IRON[1])
        c.vl(w // 2, top, base, IRON[0])
    return outline(c.im)


def railing(w=48, h=16):
    """Area railings on a stone curb, spear-headed."""
    c = C(w, h + 5)
    base = c.h - 1
    c.rect(0, base - 3, w - 1, base, LIME[3])
    c.hl(0, w - 1, base - 3, LIME[5])
    for x in range(1, w - 1, 3):
        c.vl(x, base - h, base - 4, IRON[1])
        c.px(x, base - h - 1, IRON[3])
        c.px(x - 1, base - h, IRON[2])
        c.px(x + 1, base - h, IRON[2])
    c.hl(0, w - 1, base - h + 3, IRON[2])
    c.hl(0, w - 1, base - 6, IRON[1])
    return outline(c.im)


# ---------------------------------------------------------------- props

def lamp():
    """A cast-iron candelabra lamp: fluted base, slender post, a lantern of
    four panes under a crown."""
    c = C(13, 58)
    b = 57
    c.rect(2, b - 6, 10, b, IRON[1])
    c.rect(3, b - 10, 9, b - 6, IRON[1])
    c.vl(3, b - 10, b, IRON[3])
    c.vl(4, b - 10, b, IRON[2])
    c.hl(1, 11, b, IRON[0])
    c.rect(5, b - 40, 7, b - 10, IRON[1])
    c.vl(5, b - 40, b - 10, IRON[3])
    for y in (b - 20, b - 30):
        c.hl(4, 8, y, IRON[2])
    c.rect(1, b - 42, 11, b - 40, IRON[1])
    c.hl(1, 11, b - 42, IRON[3])
    c.rect(2, b - 53, 10, b - 43, IRON[1])
    c.rect(3, b - 52, 9, b - 44, '#f2dea0')
    c.rect(3, b - 52, 5, b - 44, '#fbf0c8')
    c.vl(6, b - 52, b - 44, IRON[2])
    c.hl(3, 9, b - 44, '#d4b060')
    for i in range(4):
        c.hl(1 + i, 11 - i, b - 54 - i, IRON[2] if i % 2 else IRON[1])
    c.vl(6, b - 57, b - 57, IRON[3])
    return outline(c.im)


def bench():
    """A park bench: slatted seat and back in dark green, cast-iron ends."""
    c = C(30, 20)
    for y, col in ((2, GREEN[4]), (5, GREEN[3]), (8, GREEN[3])):
        c.hl(2, 27, y, col)
        c.hl(2, 27, y + 1, GREEN[1])
    c.rect(1, 12, 28, 13, GREEN[4])
    c.hl(1, 28, 14, GREEN[2])
    c.hl(1, 28, 15, GREEN[0])
    for x in (2, 26):
        c.vl(x, 1, 19, IRON[1])
        c.vl(x + 1, 1, 19, IRON[2])
        c.px(x - 1, 19, IRON[1])
        c.px(x + 2, 19, IRON[1])
        c.px(x - 1, 11, IRON[1])
    return outline(c.im)


def plane_tree(seed=0, r=28):
    """A London plane, pollarded high: clumped canopy shaded as balls, the
    mottled trunk, an iron grate at its foot."""
    W = r * 2 + 8
    c = C(W, int(r * 2.9) + 10)
    cx = W // 2
    base = c.h - 1
    c.ellipse(cx, base - 2, 11, 3, IRON[1])
    for x in range(cx - 10, cx + 11):
        if x % 2 == 0:
            for y in range(base - 4, base + 1):
                c.px(x, y, IRON[2] if abs(x - cx) > 3 else IRON[0])
    c.ellipse(cx, base - 2, 3.5, 1.5, '#3d2d22')
    ty = base - int(r * 1.35)
    for y in range(ty, base - 2):
        for x in range(cx - 3, cx + 3):
            k = h2(x // 2, y // 3, seed)
            col = BARK[3] if k < 0.4 else BARK[2] if k < 0.75 else BARK[4]
            if x == cx + 2:
                col = BARK[1]
            c.px(x, y, col)
    for i in range(6):
        c.px(cx - 3 - i // 2, ty + 4 - i, BARK[2])
        c.px(cx + 3 + i // 2, ty + 3 - i, BARK[1])
    ccy = ty - r * 0.55
    clumps = []
    for k in range(24):
        a = h2(k, 1, seed) * math.tau
        d = h2(k, 2, seed) ** 0.6
        clumps.append((cx + math.cos(a) * r * 0.62 * d, ccy + math.sin(a) * r * 0.52 * d,
                       r * (0.32 + 0.14 * h2(k, 3, seed))))
    clumps.sort(key=lambda t: t[1] + t[0] * 0.3)
    shadow = C(c.w, c.h)
    for x_, y_, rr in clumps:
        sphere(shadow, x_ + 1.5, y_ + 2, rr, [LEAF[0]] * 2)
    c.blit(shadow.im, 0, 0)
    for x_, y_, rr in clumps:
        tilt = (x_ - cx) / r * 0.8 + (y_ - ccy) / r
        lo = 1 if tilt > 0.2 else 2
        sphere(c, x_, y_, rr, LEAF, lo=lo, hi=6 if tilt < -0.2 else 5)
    for k in range(40):
        x = int(cx + (h2(k, 5, seed) - 0.5) * r * 1.6)
        y = int(ccy + (h2(k, 6, seed) - 0.7) * r * 1.2)
        p = c.get(x, y)
        if p[3] and p[:3] == rgba(LEAF[5])[:3]:
            c.px(x, y, LEAF[6])
            c.px(x + 1, y + 1, LEAF[4])
    return outline(c.im)


def cafe_set(umbrella=True):
    """A bistro table and two rattan chairs, a parasol over them."""
    c = C(34, 50)
    b = 49
    for cx in (6, 27):
        for y in range(b - 13, b - 5):
            for x in range(cx - 3, cx + 4):
                if y < b - 8 or abs(x - cx) == 3:
                    c.px(x, y, '#c9a868' if (x + y) % 2 else '#9a7a44')
        c.rect(cx - 3, b - 8, cx + 3, b - 7, '#7a5a30')
        c.vl(cx - 3, b - 7, b, '#6a4a28')
        c.vl(cx + 3, b - 7, b, '#6a4a28')
    c.vl(16, b - 8, b - 1, IRON[1])
    c.hl(13, 19, b, IRON[1])
    c.ellipse(16.5, b - 9, 6.5, 2, '#e9e5de')
    c.hl(11, 22, b - 8, '#a6a1a8')
    c.px(14, b - 11, '#f4f4ff')
    c.px(18, b - 11, '#c8a060')
    if umbrella:
        c.vl(16, b - 42, b - 10, OAK[2])
        for i in range(8):
            y = b - 42 + i
            for x in range(16 - 2 - i * 2, 16 + 3 + i * 2):
                s = ((x - 16) // 3) % 2
                col = ['#efe6d0', '#b8323a'][s]
                if i > 5:
                    col = mix(col, INK, 0.25)
                c.px(x, y, col)
        for x in range(0, 33, 3):
            c.px(x + 1, b - 34, '#8e2430')
    return outline(c.im)


def market_stall(stripes=((RED[1], RED[2], RED[3], RED[3]), ('#b9ad92', '#e8dec6', '#f6efdc', '#f6efdc')),
                 produce='fruit'):
    """A barrow stall: produce banked in crates, a striped awning on posts."""
    c = C(46, 44)
    b = 43
    c.rect(2, b - 14, 41, b - 4, OAK[3])
    for y in range(b - 13, b - 4, 3):
        c.hl(2, 41, y, OAK[2])
    c.hl(2, 41, b - 14, OAK[5])
    c.vl(41, b - 14, b - 4, OAK[1])
    for x in (4, 38):
        c.vl(x, b - 4, b, OAK[1])
    c.ellipse(10, b - 3, 4, 4, OAK[1])
    c.ellipse(10, b - 3, 2, 2, OAK[3])
    fruit = [(RED, 4), (('#2a4a18', '#4a7a22', '#7ab038', '#a8d060'), 4),
             (('#6a3208', '#b8601a', '#e89030', '#f8c060'), 4), (('#4a2a50', '#6a3a78', '#9a5aa8', '#c090d0'), 3)]
    for k, (ramp, rr) in enumerate(fruit):
        x0 = 4 + k * 9
        c.rect(x0, b - 18, x0 + 8, b - 14, OAK[4])
        c.hl(x0, x0 + 8, b - 18, OAK[5])
        for j in range(4):
            sphere(c, x0 + 1.5 + j * 2, b - 19 - (j % 2), 1.8, ramp, lo=0, hi=3)
    for x in (3, 40):
        c.vl(x, b - 38, b - 14, OAK[2])
    for y in range(b - 40, b - 30):
        for x in range(0, 44):
            s = stripes[(x // 4) % 2]
            c.px(x, y, s[2] if y < b - 33 else s[1])
    for x in range(0, 44):
        s = stripes[(x // 4) % 2]
        c.px(x, b - 40, s[3])
        if x % 4 in (1, 2):
            c.px(x, b - 30, s[1])
            c.px(x, b - 29, s[0])
    return outline(c.im)


def morris_column():
    """An advertising column: green drum, posters wrapped round it, a domed
    crown with a finial; shaded as a cylinder."""
    c = C(18, 60)
    b = 59
    prof = [4, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 1, 1, 1]
    for x in range(18):
        k = prof[x]
        c.vl(x, b - 4, b, GREEN[min(5, k)])
        for y in range(b - 44, b - 4):
            c.px(x, y, mix(CREAM[2], INK, (5 - k) * 0.1))
        c.vl(x, b - 46, b - 44, GREEN[min(5, k + 1)])
    posters = [(1, 5, b - 42, b - 26, RED[2]), (6, 12, b - 42, b - 30, NAVY[3]),
               (13, 16, b - 40, b - 22, GOLD[2]), (2, 9, b - 24, b - 7, '#d0703a'),
               (10, 16, b - 28, b - 8, GREEN[4])]
    for x0, x1, y0, y1, col in posters:
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                c.px(x, y, mix(col, INK, (5 - prof[x]) * 0.12))
        c.hl(x0 + 1, x1 - 1, y0 + 2, mix(CREAM[2], INK, 0.1))
        if y1 - y0 > 10:
            c.hl(x0 + 1, x1 - 2, y0 + 5, mix(CREAM[2], INK, 0.3))
    for i in range(9):
        w = int(9 * math.cos(i / 9 * math.pi / 2))
        for x in range(9 - w, 9 + w):
            c.px(x, b - 47 - i, GREEN[min(5, prof[x] + 1)] if i < 7 else GREEN[3])
    c.vl(9, b - 59, b - 55, GREEN[4])
    c.px(9, b - 59, GOLD[2])
    return outline(c.im)


def fountain():
    """A two-tier fountain in a round basin, the water catching the light."""
    c = C(64, 52)
    b = 51
    c.ellipse(32, b - 9, 31, 9, LIME[3])
    c.ellipse(32, b - 11, 31, 9, LIME[5])
    c.ellipse(32, b - 11, 28, 7.5, LIME[2])
    c.ellipse(32, b - 10, 27, 7, WATER[2])
    for x in range(6, 58):
        for y in range(b - 17, b - 3):
            p = c.get(x, y)
            if p[:3] == rgba(WATER[2])[:3]:
                if (x * 3 + y * 7) % 17 == 0:
                    c.px(x, y, WATER[4])
                elif (x * 3 + y * 7) % 17 == 1:
                    c.px(x, y, WATER[3])
                elif y > b - 7:
                    c.px(x, y, WATER[1])
    c.rect(1, b - 11, 62, b - 4, LIME[4])
    c.ellipse(32, b - 11, 31, 8.5, (0, 0, 0, 0)) if False else None
    for x in range(1, 63):
        dy = int(8.5 * math.sqrt(max(0, 1 - ((x - 31.5) / 31) ** 2)))
        for y in range(b - 11 + dy - 1, b - 3 + dy - 7):
            pass
    # Rebuild the rim band properly: lower half-ellipse outer wall.
    c2 = C(64, 52)
    for x in range(1, 63):
        t = (x - 31.5) / 31
        dy = 8.5 * math.sqrt(max(0, 1 - t * t))
        for y in range(int(b - 11 + dy), int(b - 5 + dy) + 1):
            c2.px(x, y, LIME[4] if t < -0.3 else LIME[3] if t < 0.4 else LIME[2])
        c2.px(x, int(b - 11 + dy), LIME[5])
    base = C(64, 52)
    base.ellipse(32, b - 9, 31, 9, LIME[3])
    base.ellipse(32, b - 11, 31, 9, LIME[5])
    base.ellipse(32, b - 11, 28.5, 7.5, LIME[3])
    base.ellipse(32, b - 10, 27, 6.5, WATER[2])
    bp = base.p
    for x in range(64):
        for y in range(52):
            if bp[x, y][:3] == rgba(WATER[2])[:3]:
                k = (x * 3 + y * 7) % 19
                if k == 0:
                    bp[x, y] = rgba(WATER[4])
                elif k in (1, 9):
                    bp[x, y] = rgba(WATER[3])
                elif y > b - 8:
                    bp[x, y] = rgba(WATER[1])
    base.blit(c2.im, 0, 0)
    c = base
    c.rect(29, b - 26, 35, b - 11, LIME[4])
    c.vl(29, b - 26, b - 11, LIME[5])
    c.vl(35, b - 26, b - 11, LIME[2])
    c.ellipse(32, b - 27, 13, 4, LIME[5])
    c.ellipse(32, b - 28, 12, 3, WATER[3])
    c.hl(20, 44, b - 26, LIME[3])
    c.hl(21, 43, b - 25, LIME[2])
    c.rect(31, b - 38, 33, b - 28, LIME[4])
    c.ellipse(32, b - 38, 5, 2, LIME[5])
    for i in range(12):
        y = b - 42 + i
        for x in (32 - i * 0.9, 32 + i * 0.9):
            c.px(int(x), y, WATER[5] if i < 4 else WATER[4])
        for x in (19 - i // 2, 45 + i // 2):
            if i > 3:
                c.px(int(x), b - 28 + (i - 3), WATER[4])
    c.vl(32, b - 46, b - 38, WATER[5])
    c.px(31, b - 44, WATER[4])
    c.px(33, b - 43, WATER[4])
    return outline(c.im)


def planter():
    """A Versailles box with a clipped bay tree."""
    c = C(18, 34)
    b = 33
    c.rect(2, b - 12, 15, b - 1, GREEN[3])
    c.vl(2, b - 12, b - 1, GREEN[5])
    c.vl(3, b - 12, b - 1, GREEN[4])
    c.vl(15, b - 12, b - 1, GREEN[1])
    for x in (2, 15):
        c.vl(x, b - 12, b, IRON[1])
    c.hl(1, 16, b - 12, IRON[2])
    c.hl(2, 15, b, IRON[1])
    for x in (6, 11):
        c.vl(x, b - 11, b - 1, GREEN[2])
    c.vl(8, b - 20, b - 13, BARK[2])
    c.vl(9, b - 20, b - 13, BARK[1])
    sphere(c, 8.5, b - 25, 7.5, LEAF, lo=1)
    return outline(c.im)


def barrels():
    c = C(26, 22)
    b = 21

    def barrel(x0, y0):
        prof = [1, 2, 3, 4, 4, 4, 3, 3, 2, 1]
        for i, k in enumerate(prof):
            for y in range(y0, y0 + 14):
                c.px(x0 + i, y, OAK[k + 1] if (y - y0) not in (2, 11) else IRON[min(3, k)])
        c.ellipse(x0 + 5, y0, 5, 2, OAK[4])
        c.ellipse(x0 + 5, y0, 3.5, 1, OAK[2])
    barrel(1, b - 14)
    barrel(13, b - 14)
    return outline(c.im)


def crates():
    c = C(28, 26)
    b = 25

    def crate(x0, y0, w, h):
        c.rect(x0, y0, x0 + w, y0 + h, OAK[4])
        c.rect(x0 + w + 1, y0 - 1, x0 + w + 3, y0 + h - 1, OAK[2])
        c.rect(x0 + 1, y0 - 3, x0 + w + 2, y0 - 1, OAK[5])
        for y in range(y0 + 3, y0 + h, 4):
            c.hl(x0, x0 + w, y, OAK[3])
        c.vl(x0, y0, y0 + h, OAK[5])
        c.vl(x0 + w, y0, y0 + h, OAK[2])
        for i in range(min(w, h)):
            c.px(x0 + i * w // h, y0 + i, OAK[3])
    crate(1, b - 11, 12, 11)
    crate(14, b - 9, 10, 9)
    crate(6, b - 22, 10, 8)
    return outline(c.im)


def handcart():
    c = C(36, 22)
    b = 21
    c.rect(4, b - 14, 29, b - 8, OAK[3])
    c.hl(4, 29, b - 14, OAK[5])
    for x in range(4, 30, 5):
        c.vl(x, b - 14, b - 8, OAK[2])
    c.hl(4, 29, b - 8, OAK[1])
    for i in range(7):
        c.px(30 + i, b - 11 - i // 2, OAK[2])
    sphere(c, 12, b - 17, 3, BREAD)
    sphere(c, 18, b - 17, 3, ('#2a4a18', '#4a7a22', '#7ab038', '#a8d060'))
    sphere(c, 23, b - 16, 2.5, RED)
    for cx in (9, 24):
        for a in range(0, 360, 8):
            r = math.radians(a)
            c.px(round(cx + math.cos(r) * 5), round(b - 5 + math.sin(r) * 5), IRON[1])
        for a in range(0, 180, 45):
            r = math.radians(a)
            for t in range(-4, 5):
                c.px(round(cx + math.cos(r) * t), round(b - 5 + math.sin(r) * t), OAK[2])
        c.px(cx, b - 5, IRON[2])
    return outline(c.im)


def sign_board(word='MENU'):
    c = C(16, 22)
    b = 21
    for i in range(18):
        c.px(3 + i // 6, b - i, OAK[3])
        c.px(12 - i // 6, b - i, OAK[2])
    c.rect(3, b - 18, 12, b - 5, OAK[2])
    c.rect(4, b - 17, 11, b - 6, '#27302c')
    text(c, word[:2], 8, b - 16, '#e8e2d0')
    c.hl(5, 10, b - 9, '#9aa89a')
    c.hl(5, 9, b - 7, '#9aa89a')
    return outline(c.im)


def bollard():
    c = C(6, 14)
    for y in range(3, 14):
        c.hl(1, 4, y, IRON[1])
        c.px(1, y, IRON[3])
    c.rect(0, 1, 5, 3, IRON[2])
    c.hl(1, 4, 0, IRON[3])
    return outline(c.im)


def flower_tub(bloom=RED):
    c = C(16, 18)
    b = 17
    for x in range(2, 14):
        k = 4 if x < 5 else 3 if x < 10 else 2
        c.vl(x, b - 8, b, TERRA[k])
    c.hl(1, 14, b - 9, TERRA[4])
    c.hl(1, 14, b - 8, TERRA[2])
    sphere(c, 8, b - 12, 6, LEAF, lo=1, hi=5, flat=0.7)
    for x, y in ((5, b - 15), (9, b - 16), (11, b - 13), (6, b - 12), (8, b - 13)):
        c.px(x, y, bloom[2])
        c.px(x + 1, y, bloom[1])
        c.px(x, y - 1, bloom[3])
    return outline(c.im)


# ---------------------------------------------------------------- ground

def ground_scene(W, H, kerb_y, street_h, corner_x=None):
    """Sidewalk slabs, a granite kerb and a sett carriageway, with a rounded
    kerb where a side street turns off at `corner_x`."""
    c = C(W, H)
    sy0, sy1 = kerb_y, kerb_y + street_h
    for y in range(H):
        for x in range(W):
            if sy0 + 3 <= y < sy1 or (corner_x and x >= corner_x and y >= sy0 + 3):
                row = (y - sy0) // 4
                xo = (x + (row % 2) * 3) % 6
                col = SETT[2]
                if (y - sy0) % 4 == 0:
                    col = SETT[1]
                elif xo == 0:
                    col = SETT[1]
                elif xo == 1 and (y - sy0) % 4 == 1:
                    col = SETT[3]
                elif h2(x // 6, row, 11) < 0.12 and xo in (2, 3):
                    col = SETT[3]
                c.px(x, y, col)
            else:
                xo, yo = x % 20, (y - sy0) % 12
                col = PAVE[4]
                if yo == 0 or (xo == ((y - sy0) // 12 % 2) * 10):
                    col = mix(PAVE[4], PAVE[3], 0.6)
                elif h2(x // 20 + ((y - sy0) // 12 % 2), (y - sy0) // 12, 7) < 0.25:
                    col = mix(PAVE[4], PAVE[5], 0.35)
                if y < sy0 - 60:
                    col = mix(PAVE[3], PAVE[2], 0.4)
                c.px(x, y, col)
    for yk in (sy0, sy1):
        for x in range(W if not corner_x else corner_x - 10):
            if yk == sy0:
                c.px(x, yk, PAVE[5])
                c.px(x, yk + 1, PAVE[4])
                c.px(x, yk + 2, PAVE[1])
                c.px(x, yk + 3, SETT[0])
            else:
                c.px(x, yk - 1, SETT[0])
                c.px(x, yk, PAVE[5])
                c.px(x, yk + 1, PAVE[3])
    if corner_x:
        r = 10
        cxr, cyr = corner_x - r, sy0 + r
        for y in range(sy0, H):
            for x in range(corner_x - r - 1, corner_x + 4):
                if y < cyr and x < cxr:
                    continue
                d = math.hypot(x + .5 - cxr, y + .5 - cyr) if y < cyr else x + .5 - cxr
                if x < cxr and y >= cyr:
                    continue
                if r - 0.5 <= d < r + 0.8:
                    c.px(x, y, PAVE[5])
                elif r + 0.8 <= d < r + 2:
                    c.px(x, y, PAVE[1])
                elif r + 2 <= d < r + 3:
                    c.px(x, y, SETT[0])
                elif d < r - 0.5 and y >= cyr - 2:
                    pass
        for y in range(cyr, H):
            if y > sy1 - 2 and y < sy1 + 2:
                pass
        # Zebra crossing across the side street.
    for x in range(W // 2 - 20, W // 2 + 20, 1):
        pass
    for y in range(H):
        for x in range(W):
            if False:
                c.px(x, y, mix(c.get(x, y), '#e8e4da', 0.8))
    for x in (120, 250):
        if x < W:
            c.rect(x, sy0 + 4, x + 7, sy0 + 6, IRON[1])
            for xx in range(x + 1, x + 7, 2):
                c.px(xx, sy0 + 5, SETT[0])
    return c


def shadow_for(im, dx=5, dy=3, squash=0.35):
    """A soft cast shadow: the sprite's silhouette flattened onto the ground
    and thrown down-right, away from the upper-left sun."""
    w, h = im.size
    sh = Image.new('RGBA', (w + int(h * squash) + dx, int(h * squash) + dy + 2))
    sp = sh.load()
    src = im.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] > 40:
                ny = int((h - 1 - y) * squash)
                nx = x + ny
                yy = sh.height - 1 - ny - (0 if y > h - 3 else 0)
                if 0 <= nx + dx < sh.width and 0 <= yy - dy + dy < sh.height:
                    sp[nx + dx // 2, yy] = SHADOW
    return sh


# ---------------------------------------------------------------- catalogue

AWN_RED = (('#8a1f2c', '#b8323a', '#d04a4a', '#e06a60'), ('#b9ad92', '#e8dec6', '#f6efdc', '#fff8e8'))
AWN_GREEN = (GREEN[1:5], ('#b9ad92', '#e8dec6', '#f6efdc', '#fff8e8'))

# name: (kind, footprint, storeys, seed, options)
KIT = {
    'modern-immeuble-0': ('immeuble', [9, 6], 3, 2, dict(shop=(GREEN, 'CAFE', goods_cafe, AWN_RED))),
    'modern-immeuble-1': ('immeuble', [8, 6], 3, 5, dict(stone=WARM_LIME, entrance=-1, shop=(NAVY, '~~', goods_bread, None))),
    'modern-immeuble-2': ('immeuble', [10, 6], 3, 9, dict(entrance=2, boxes=0.6, shop=(OXBLOOD, '~~', goods_books, None, GREEN, '~', goods_pharma))),
    'modern-immeuble-3': ('immeuble', [8, 6], 3, 13, dict(entrance=2, boxes=0.5)),
    'modern-immeuble-4': ('immeuble', [11, 6], 4, 17, dict(stone=WARM_LIME, entrance=0, shop=(GREEN, 'HOTEL', goods_cafe, AWN_GREEN))),
    'modern-brickshop-0': ('immeuble', [7, 6], 3, 21, dict(stone=BRICK, brick=True, shop=(NAVY, '~~', goods_bread, AWN_GREEN))),
    'modern-brickshop-1': ('immeuble', [6, 5], 3, 25, dict(stone=BRICK, brick=True, entrance=-1, shop=(OXBLOOD, '~~', goods_books, None))),
    'modern-brickshop-2': ('immeuble', [8, 6], 3, 29, dict(stone=BRICK, brick=True, entrance=2, shop=(GREEN, 'CAFE', goods_cafe, AWN_RED, NAVY, '~~', goods_pharma))),
    'modern-townhouse-0': ('townhouse', [5, 5], 3, 1, dict()),
    'modern-townhouse-1': ('townhouse', [6, 5], 3, 6, dict(door_col=NAVY)),
    'modern-townhouse-2': ('townhouse', [5, 5], 3, 11, dict(door_col=OXBLOOD)),
    'modern-immeuble-5': ('immeuble', [6, 5], 3, 41, dict(entrance=1, boxes=0.6)),
    'modern-immeuble-6': ('immeuble', [7, 5], 3, 43, dict(stone=WARM_LIME, shop=(OXBLOOD, '~', goods_bread, AWN_GREEN))),
    'modern-immeuble-7': ('immeuble', [7, 4], 2, 45, dict(shop=(GREEN, 'CAFE', goods_cafe, AWN_RED))),
    'modern-brickshop-3': ('immeuble', [4, 5], 3, 47, dict(stone=BRICK, brick=True, shop=(NAVY, '~', goods_pharma, None))),
    'modern-brickshop-4': ('immeuble', [5, 4], 2, 49, dict(stone=BRICK, brick=True, shop=(GREEN, '~~', goods_books, AWN_RED))),
    'modern-immeuble-corner-e-0': ('immeuble', [8, 6], 3, 51, dict(corner='e', shop=(GREEN, 'CAFE', goods_cafe, AWN_RED))),
    'modern-immeuble-corner-w-0': ('immeuble', [8, 6], 3, 53, dict(corner='w', stone=WARM_LIME, entrance=-1, shop=(NAVY, '~~', goods_bread, None))),
    'modern-immeuble-corner-e-1': ('immeuble', [9, 6], 3, 55, dict(corner='e', stone=WARM_LIME, shop=(OXBLOOD, '~~', goods_books, None))),
    'modern-immeuble-corner-w-1': ('immeuble', [9, 6], 3, 57, dict(corner='w', shop=(GREEN, 'HOTEL', goods_cafe, AWN_GREEN))),
    'modern-brickshop-corner-e-0': ('immeuble', [6, 6], 3, 59, dict(corner='e', stone=BRICK, brick=True, shop=(GREEN, 'CAFE', goods_cafe, AWN_RED))),
    'modern-brickshop-corner-w-0': ('immeuble', [6, 6], 3, 61, dict(corner='w', stone=BRICK, brick=True, shop=(NAVY, '~~', goods_bread, None))),
    'modern-atelier-0': ('atelier', [5, 4], 1, 31, dict()),
    'modern-atelier-1': ('atelier', [7, 4], 1, 33, dict(roof='slate', coach=True)),
    'modern-atelier-2': ('atelier', [4, 4], 1, 35, dict(wall=BRICK, roof='slate')),
    'modern-atelier-3': ('atelier', [6, 4], 1, 37, dict(wall=BRICK, coach=True)),
    'modern-hoteldeville-small-0': ('hotel', [12, 8], 2, 71, dict(stone=WARM_LIME)),
    'modern-hoteldeville-medium-0': ('hotel', [16, 9], 3, 72, dict(stone=LIME)),
    'modern-hoteldeville-large-0': ('hotel', [22, 10], 3, 73, dict(stone=WARM_LIME)),
    'modern-opera-small-0': ('opera', [11, 8], 2, 81, dict()),
    'modern-opera-medium-0': ('opera', [16, 10], 2, 82, dict()),
    'modern-opera-large-0': ('opera', [22, 12], 2, 83, dict()),
    'religious-gothic-small-0': ('church', [8, 6], 2, 91, dict(look=0)),
    'religious-gothic-small-1': ('church', [8, 6], 2, 94, dict(look=1)),
    'religious-gothic-small-2': ('church', [8, 6], 2, 97, dict(look=2)),
    'religious-gothic-medium-0': ('church', [14, 8], 2, 92, dict(look=0)),
    'religious-gothic-medium-1': ('church', [14, 8], 2, 95, dict(look=1)),
    'religious-gothic-medium-2': ('church', [14, 8], 2, 98, dict(look=2)),
    'religious-gothic-large-0': ('church', [20, 10], 2, 93, dict(look=0)),
    'religious-gothic-large-1': ('church', [20, 10], 2, 96, dict(look=1)),
    'religious-gothic-large-2': ('church', [20, 10], 2, 99, dict(look=2)),
    'modern-works-0': ('mill', [18, 10], 3, 5, dict()),
    'modern-works-1': ('mill', [14, 9], 3, 13, dict()),
    'modern-works-2': ('mill', [10, 8], 2, 21, dict()),
    'modern-institute-small-0': ('institute', [9, 7], 2, 101, dict()),
    'modern-institute-medium-0': ('institute', [12, 8], 2, 102, dict()),
    'modern-institute-large-0': ('institute', [16, 9], 2, 103, dict()),
    'modern-station-terminus-large-0': ('terminus', [20, 9], 2, 111, dict(look='stock')),
    'modern-station-terminus-large-1': ('terminus', [20, 9], 2, 112, dict(look='brick')),
    'modern-station-terminus-medium-0': ('terminus', [14, 8], 2, 113, dict(look='ashlar')),
    'modern-station-terminus-medium-1': ('terminus', [14, 8], 2, 114, dict(look='brick')),
    'modern-station-town-medium-0': ('townstation', [14, 7], 2, 121, dict(look='stock')),
    'modern-station-town-medium-1': ('townstation', [14, 7], 2, 122, dict(look='brick')),
    'modern-station-town-small-0': ('townstation', [10, 6], 2, 123, dict(look='brick')),
    'modern-station-town-small-1': ('townstation', [10, 6], 2, 124, dict(look='green')),
    'modern-station-postwar-large-0': ('postwar', [20, 9], 5, 131, dict(look='travertine')),
    'modern-station-postwar-large-1': ('postwar', [20, 9], 6, 132, dict(look='concrete')),
    'modern-station-postwar-medium-0': ('postwar', [14, 8], 3, 133, dict(look='travertine')),
    'modern-machiya-0': ('machiya', [5, 5], 2, 111, dict()),
    'modern-machiya-1': ('machiya', [6, 5], 2, 112, dict(wood='bengara')),
    'modern-machiya-2': ('machiya', [7, 5], 2, 113, dict(shop=False, upper='lattice')),
    'modern-machiya-3': ('machiya', [5, 5], 2, 114, dict(wood='bengara', upper='lattice')),
    'modern-machiya-4': ('dozo', [7, 6], 2, 115, dict()),
    'modern-machiya-5': ('machiya', [6, 5], 2, 116, dict()),
    'modern-nagaya-0': ('nagaya', [10, 5], 1, 117, dict()),
    'modern-nagaya-1': ('nagaya', [8, 5], 1, 118, dict()),
    'modern-ginza-0': ('ginza', [11, 6], 2, 119, dict()),
    'modern-ginza-1': ('ginza', [9, 6], 2, 120, dict()),
    'modern-civic-hall-0': ('mairie', [14, 6], 2, 3, dict(sign='~')),
    'modern-civic-hall-1': ('mairie', [18, 7], 2, 11, dict(sign='~')),
}

ABOUT = {
    'immeuble': 'An apartment house of the boulevard age: shops in a rusticated ground storey, iron balconies, a cornice and a slate mansard with dormers.',
    'townhouse': 'A brick terrace house: stone quoins and dressings, sash windows, a door raised up a stoop behind area railings.',
    'atelier': 'A yard range of one storey: a workshop, stable or coach house behind the street front.',
    'hotel': 'The town hall of a boulevard-age city: a rusticated arcade, pedimented windows between pilasters, pavilions under steep roofs and a belfry over the clock.',
    'opera': 'An opera house of the boulevard age: steps the width of the front, an arcaded loggia, paired columns, a gilt attic and a copper dome over the stage.',
    'church': 'A Gothic parish church seen from the south: a west tower and spire, buttressed aisles under a clerestory, the transept gable with its rose window over the south door, and the apse at the east end.',
    'mill': 'A brick mill of the 1880s: storeys of segmental windows between pilaster strips, loading doors under a hoist, a stair tower with its water tank, and the stack.',
    'institute': 'A workers\' institute: a meeting hall over reading rooms in red brick and stone, a pedimented door up a flight of steps, a lantern on the ridge.',
    'terminus': 'A terminus of the high railway age: great glazed arches at the ends of the train sheds, a clock, office ranges ending in pavilions, and the sheds\' vaults running back behind.',
    'townstation': 'A town\'s railway station: the station master\'s house under a fretted gable, the booking hall and waiting rooms, and a canopy with a sawtooth valance over the platform.',
    'postwar': 'A station rebuilt after the war: a glass concourse under a cantilevered concrete roof, offices in a slab behind, a clock on a pylon.',
    'machiya': 'A merchant house of the Tokyo street: slatted plaster windows over a tiled pent roof, the shop open behind noren, firewalls on the party walls.',
    'dozo': 'A fireproof storehouse-shop in black lacquered plaster, heavy stepped shutters, a great ridge and a signboard on the roof.',
    'nagaya': 'A lane tenement of one storey: a row of lattice doors under one roof, pot plants and rain barrels on the step.',
    'ginza': 'A Ginza bricktown row: two storeys of red brick, a colonnade along the footway carrying a balcony, green shutters, a tiled roof.',
    'mairie': 'A town hall: a pedimented pavilion on columns, wings of tall windows, a roof lantern with the flag.',
}


def kit_recipes(side_depth):
    from art.front_kit import IMMEUBLES, recipe as front_recipe
    out = {}
    for name, (kind, fp, storeys, seed, o) in KIT.items():
        station = kind in ('terminus', 'townstation', 'postwar')
        deep = (storeys >= 4 or station or kind in ('mairie', 'hotel', 'opera', 'church', 'mill', 'institute')) and kind != 'atelier'
        out[name] = {
            'label': {'immeuble': 'Apartment house', 'townhouse': 'Brick town house', 'mairie': 'Town hall',
                      'atelier': 'Yard workshop', 'hotel': 'Town hall', 'opera': 'Opera house', 'church': 'Parish church', 'mill': 'Works', 'institute': 'Institute',
                      'machiya': 'Merchant house', 'dozo': 'Storehouse shop', 'nagaya': 'Lane tenement', 'ginza': 'Brick row',
                      'terminus': 'Railway station', 'townstation': 'Railway station', 'postwar': 'Railway station'}[kind]
            if 'brickshop' not in name else 'Brick shop block',
            'footprint': fp, 'entrance': [fp[0] // 2, fp[1]],
            'wall': 'grey-brick', 'roof': 'flat', 'roofMaterial': 'slate', 'attachments': [],
            'opening': 'door', 'height': 62 if kind == 'atelier' else 200 if station or kind in ('hotel', 'opera', 'church', 'mill', 'institute') else 120 if kind in ('machiya', 'dozo', 'ginza') else 70 if kind == 'nagaya' else GROUND + STOREY * storeys + 30,
            'description': ABOUT[kind], 'obliqueModern': 'kit', 'seed': seed,
            'stories': storeys, 'deep': deep,
        }
        if name in IMMEUBLES:
            out[name].update(front_recipe(name, seed))
    return out


def kit_building(r, side_depth):
    for name, (kind, fp, storeys, seed, o) in KIT.items():
        if seed == r['seed'] and fp == r['footprint']:
            break
    sd = side_depth(fp[1], deep=r['deep'])
    W = fp[0] * 16
    o = dict(o)
    from art.front_kit import IMMEUBLES, Building
    if name in IMMEUBLES:
        return Building(name, seed)
    if kind == 'immeuble':
        if o.get('entrance') == -1:
            o['entrance'] = (W - 8) // 20 - 1
        return Immeuble(storeys=storeys, seed=seed, W=W, sd=sd, **o)
    if kind == 'atelier':
        return Atelier(seed=seed, W=W, sd=sd, **o)
    if kind == 'hotel':
        from art.city_civic import HotelDeVille
        return HotelDeVille(W=W, sd=sd, seed=seed, storeys=storeys, **o)
    if kind == 'opera':
        from art.city_civic import OperaHouse
        return OperaHouse(W=W, sd=sd, seed=seed, **o)
    if kind == 'mill':
        from art.city_civic import Mill
        return Mill(W=W - 26, sd=sd, seed=seed, storeys=storeys)
    if kind == 'institute':
        from art.city_civic import Institute
        return Institute(W=W, sd=sd, seed=seed)
    if kind in ('machiya', 'dozo', 'nagaya', 'ginza'):
        from art import city_japan as j
        if kind == 'machiya':
            return j.Machiya(W=W, sd=sd, seed=seed, shop=o.get('shop', True), upper=o.get('upper', 'mushiko'),
                             wood=j.BENGARA if o.get('wood') == 'bengara' else j.CEDAR)
        return {'dozo': j.Dozo, 'nagaya': j.Nagaya, 'ginza': j.GinzaBrick}[kind](W=W, sd=sd, seed=seed)
    if kind == 'church':
        from art.city_civic import GothicChurch, GREY_STONE, RED_SAND, LEAD
        stone, roof = ((GREY_STONE, LEAD), (WARM_LIME, SLATE), (RED_SAND, SLATE))[o['look']]
        return GothicChurch(W=W, sd=sd, seed=seed, stone=stone, roof=roof)
    if kind in ('terminus', 'townstation', 'postwar'):
        from art.city_station import station
        return station(kind, W, sd, seed, storeys, o['look'])
    if kind == 'townhouse':
        return TownHouse(storeys=storeys, seed=seed, W=W, sd=sd, **o)
    return Mairie(seed=seed, W=W, sd=sd, **o)


# ---------------------------------------------------------------- sheet

def person():
    from art.reference import current_adult
    return current_adult()


def composite(buildings, props, W=560, H=330):
    """One street, assembled from the kit: a continuous frontage, a planted
    sidewalk, a sett carriageway turning at a rounded kerb, and a walled
    town house across a side street."""
    kerb = 250
    g = ground_scene(W, H, kerb, 44, corner_x=None)
    scene = C(W, H)
    scene.blit(g.im, 0, 0)
    fr = kerb - 30
    placed = []
    x = 6
    for im, dx in buildings:
        placed.append((im, x, fr - im.height + 1))
        x += dx
    for im, x0, y0 in reversed(placed):
        pass
    for im, x0, y0 in placed:
        scene.blit(im, x0, y0)
    for im, px_, py in sorted(props, key=lambda t: t[2]):
        sh = shadow_for(im)
        scene.blit(sh, px_, py - sh.height + 1)
    for im, px_, py in sorted(props, key=lambda t: t[2]):
        scene.blit(im, px_, py - im.height + 1)
    return scene.im


def make(out, zoom=3):
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    adult = person()
    cafe = Immeuble(5, 5, LIME, (GREEN, 'CAFE DE LA PAIX', goods_cafe, (('#8a1f2c', '#b8323a', '#d04a4a', '#e06a60'), ('#b9ad92', '#e8dec6', '#f6efdc', '#fff8e8'))),
                    seed=2, entrance=None)
    bakery = Immeuble(4, 4, WARM_LIME, (NAVY, 'BOULANGERIE', goods_bread, None), seed=5, entrance=3)
    books = Immeuble(5, 4, LIME, (OXBLOOD, 'LIBRAIRIE', goods_books, None, GREEN, 'PHARMACIE', goods_pharma),
                     seed=9, entrance=2, boxes=0.6)
    town = TownHouse(3, 3, seed=1)
    town2 = TownHouse(4, 3, seed=6, door_col=NAVY)
    mairie = Mairie()
    atelier = Atelier(roof='slate', coach=True, W=64)
    ims = {k: v.render() for k, v in
           dict(cafe=cafe, bakery=bakery, books=books, town=town, town2=town2, mairie=mairie, atelier=atelier).items()}
    props = dict(lamp=lamp(), bench=bench(), tree=plane_tree(3), tree2=plane_tree(8, 19), cafe=cafe_set(),
                 cafe2=cafe_set(False), stall=market_stall(), stall2=market_stall(
                     (GREEN[1:5], ('#b9ad92', '#e8dec6', '#f6efdc', '#f6efdc'))),
                 morris=morris_column(), fountain=fountain(), planter=planter(), barrels=barrels(),
                 crates=crates(), cart=handcart(), sign=sign_board(), bollard=bollard(), tub=flower_tub(),
                 wall=garden_wall(), railing=railing())

    # The street: three immeubles in a row share party walls, then a walled
    # garden with its atelier, then a brick house set back behind railings.
    W, H = 660, 400
    kerb = 340
    g = ground_scene(W, H, kerb, 44)
    scene = C(W, H)
    scene.blit(g.im, 0, 0)
    front = kerb - 36
    x = 8
    for im, b in ((ims['books'], books), (ims['cafe'], cafe), (ims['bakery'], bakery)):
        scene.blit(im, x, front - im.height + 1)
        x += b.W
    gx0, gx1 = x + 14, x + 124
    tx = gx1 + 6
    for yy in range(front - 70, front + 1):
        for xx in range(gx0 - 14, gx1 + 4):
            col = LEAF[4] if h2(xx // 3, yy // 2, 4) > 0.2 else LEAF[3]
            if h2(xx, yy, 5) < 0.04:
                col = LEAF[5]
            scene.px(xx, yy, col)
    for xx in range(gx0 - 14, gx1 + 4):
        for yy in range(front - 78, front - 64):
            top = front - 76 + int(2 * math.sin(xx * 0.7) + h2(xx // 3, 0, 2) * 2)
            if yy >= top:
                scene.px(xx, yy, LEAF[5] if yy == top else LEAF[3] if (xx + yy) % 5 else LEAF[2])
    for xx in range(gx0 + 30, gx0 + 44):
        for yy in range(front - 40, front + 1):
            scene.px(xx, yy, PAVE[3] if (yy // 3 + xx // 4) % 2 else PAVE[2])
    scene.blit(ims['atelier'], gx0 + 44, front - 52 - ims['atelier'].height)
    scene.blit(ims['town'], tx, front - 14 - ims['town'].height + 1)
    things = []
    for k, tx_ in enumerate((30, 250, 380, 520, 640)):
        things.append((props['tree' if k % 2 else 'tree2'], tx_ - 30, kerb - 2))
    for k in range(6):
        things.append((props['lamp'], 70 + k * 112, kerb - 1))
    cafe_x = 8 + books.W
    things += [(props['cafe'], cafe_x + 6, front + 24), (props['cafe2'], cafe_x + 42, front + 26),
               (props['cafe'], cafe_x + 76, front + 24), (props['sign'], cafe_x + 2, front + 14),
               (props['bench'], 212, kerb - 3), (props['tub'], cafe_x - 12, front + 10),
               (props['tub'], cafe_x + 104, front + 10),
               (props['barrels'], x - 30, front + 14), (props['crates'], x - 58, front + 16),
               (props['railing'], tx + 2, front + 1), (props['railing'], tx + 50, front + 1),
               (props['morris'], 150, kerb - 4),
               (props['bollard'], 20, kerb), (props['bollard'], 32, kerb),
               (props['tree2'], gx0 + 70, front - 30), (props['planter'], gx0 + 2, front - 8),
               (props['cart'], tx - 26, kerb - 12)]
    wall_im = props['wall']
    things.append((wall_im, gx0 - 12, front + 3))
    things.append((props['wall'].crop((0, 0, 40, wall_im.height)), gx0 + 50, front + 3))
    for k, (ax, ay) in enumerate(((70, 18), (190, 4), (330, 10), (470, 26), (600, 8))):
        things.append((adult, ax, kerb - ay))
    for im, px_, py in sorted(things, key=lambda t: t[2]):
        if im is not adult:
            sh = shadow_for(im)
            scene.blit(sh, px_, py - sh.height + 2)
        scene.blit(im, px_, py - im.height + 1)
    street = scene.im

    # The sheet.
    pad = 12
    font_path = '/System/Library/Fonts/Menlo.ttc'
    try:
        font = ImageFont.truetype(font_path, 9)
    except OSError:
        font = ImageFont.load_default()

    def cell(im, label, bg='#6f8a55'):
        w = im.width + adult.width + 3 * pad
        h = max(im.height, adult.height) + 2 * pad + 8
        c = Image.new('RGBA', (w, h + 12), '#1b2135')
        d = ImageDraw.Draw(c)
        d.rectangle((0, 12, w, h + 12), fill=bg)
        d.rectangle((0, h + 2, w, h + 12), fill=PAVE[4])
        c.alpha_composite(shadow_for(im), (pad, h + 4 - shadow_for(im).height))
        c.alpha_composite(im, (pad, h + 4 - im.height))
        c.alpha_composite(adult, (2 * pad + im.width, h + 4 - adult.height))
        d.text((2, 0), label, font=font, fill='#f0d795')
        return c

    rows = [
        [cell(ims['cafe'], 'Immeuble 5 bays, cafe'), cell(ims['books'], 'Immeuble, two shops + porte-cochere'),
         cell(ims['bakery'], 'Immeuble 4 bays, boulangerie')],
        [cell(ims['town'], 'Brick town house, stoop'), cell(ims['town2'], 'Brick town house, 4 bays'),
         cell(ims['mairie'], 'Mairie / civic'), cell(ims['atelier'], 'Yard atelier')],
        [cell(props[k], k) for k in ('lamp', 'tree', 'tree2', 'bench', 'cafe', 'stall', 'stall2', 'morris')],
        [cell(props[k], k) for k in ('fountain', 'planter', 'barrels', 'crates', 'cart', 'sign', 'tub', 'wall', 'railing')],
    ]
    width = max(sum(c.width for c in r) + pad * (len(r) + 1) for r in rows)
    width = max(width, street.width + 2 * pad)
    height = 20 + sum(max(c.height for c in r) + pad for r in rows) + street.height + 2 * pad + 14
    sheet = Image.new('RGBA', (width, height), '#1b2135')
    d = ImageDraw.Draw(sheet)
    d.text((pad, 4), 'CITY KIT c.1850-1914 · 40px storey · live adult (37px) for scale', font=font, fill='#f0d795')
    y = 20
    d.text((pad, y), 'Street composed from the kit', font=font, fill='#f0d795')
    sheet.alpha_composite(street, (pad, y + 12))
    y += street.height + 12 + pad
    for r in rows:
        x = pad
        for c in r:
            sheet.alpha_composite(c, (x, y))
            x += c.width + pad
        y += max(c.height for c in r) + pad
    sheet = sheet.resize((sheet.width * zoom, sheet.height * zoom), Image.NEAREST)
    sheet.save(out)
    street.resize((street.width * zoom, street.height * zoom), Image.NEAREST).save(out.with_name('street.png'))
    return out


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'artifacts/city-kit/sheet.png')
