"""A gabled house front, built from the materials and openings libraries:
the gable faces the street and the roof's two slopes rise up the screen, as
Stardew draws a house.

    .venv/bin/python scripts/art/front_house.py artifacts/front-house.png

The roof slopes are drawn here rather than from a material swatch: their
shingles lie along the rake, which a level swatch cannot do.
"""
from pathlib import Path
import math
import random
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import (  # noqa: E402
    C, RAMPS, ramp, mix, h2, render, rubble, brick, plain_tiles,
)
from art import front_openings as op  # noqa: E402
from art.front_kit import outline  # noqa: E402

OAK = RAMPS['oak']
RENDER = RAMPS['render']
SHINGLE = [RAMPS['shingle'], ramp(30, 0.13, lift=-0.08), ramp(12, 0.11, lift=-0.12), ramp(62, 0.11, lift=-0.06)]
RIDGE = ramp(48, 0.12, lift=-0.04)
POT = ["..aab..", ".abbbc.", "abdddcc", "abdddcc", ".bcccc.", "..ccc..", ".eeeee.", "..eee.."]


def pot(c, x, y):
    t = RAMPS['terracotta']
    col = {'a': t[1], 'b': t[2], 'c': t[3], 'd': t[7], 'e': t[5]}
    for j, row in enumerate(POT):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x + i, y + j, col[ch])


def bevel(c, x, y, w, h, r, body=3, mask=None):
    """A timber standing proud: lit top and left, shaded bottom and right,
    a little grain."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            col = r[body]
            if h2(xx, yy // 4, 301) < 0.1 and w > 2 and h > 2:
                col = r[body + 1]
            if yy == y or xx == x:
                col = r[body - 1]
            if yy == y + h - 1 or xx == x + w - 1:
                col = r[body + 2]
            c.p(xx, yy, col)
            if mask is not None:
                mask.add((xx, yy))


def brace(c, x0, y0, x1, y1, r, t=5, mask=None):
    n = max(abs(x1 - x0), abs(y1 - y0))
    for i in range(n + 1):
        x = round(x0 + (x1 - x0) * i / n)
        y = round(y0 + (y1 - y0) * i / n)
        for k in range(t):
            c.p(x + k, y, r[2] if k == 0 else r[5] if k == t - 1 else r[3])
            if mask is not None:
                mask.add((x + k, y))


def recess(c, region, solid):
    """Infill sits behind the frame: shade it under and right of timber."""
    for x, y in region:
        if (x, y) in solid:
            continue
        if (x, y - 1) in solid or (x - 1, y) in solid:
            c.p(x, y, RENDER[3])
        elif (x, y - 2) in solid:
            c.p(x, y, mix(RENDER[1], RENDER[2], 0.6))


def rake_shingle(a, b, tw, th, r, shade):
    """A shingle in course space: a runs ridge to eave along the rake, b runs
    up the course; the butt at the eave end is rounded."""
    if a == tw - 1 and (b < 2 or b > th - 2):
        return r[6]
    if a == tw - 2 and (b == 0 or b == th - 1):
        return r[6]
    if b == 0:
        col = r[6]
    elif b == 1:
        col = r[5]
    elif a <= 1:
        col = r[5]
    elif b >= th - 2:
        col = r[1] if a >= tw - 5 else r[2]
    elif a >= tw - 3:
        col = r[2] if b >= th // 2 else r[3]
    else:
        col = r[3]
    if a == tw - 1:
        col = r[4] if b <= th // 2 else r[3]
    if shade:
        col = r[min(7, r.index(col) + 1)]
    return col


def roof_slope(c, xa, xe, rake, depth, shade, tw=12, th=7):
    for x in range(min(xa, xe), max(xa, xe) + 1):
        u = abs(x - xa)
        yr = rake(x)
        for y in range(yr - depth, yr + 1):
            w = yr - y
            course = w // th
            uu = u + (course % 2) * (tw // 2) + (course * 3) % tw
            k = h2(uu // tw, course, 311)
            r = SHINGLE[0 if k < 0.74 else 1 if k < 0.88 else 2 if k < 0.95 else 3]
            col = rake_shingle(uu % tw, w % th, tw, th, r, shade)
            if u > 60:
                col = mix(col, r[5], 0.12)
            c.p(x, y, col)


DIG = {"1": "010110010010111", "6": "011100111101111", "4": "101101111001001", "2": "110001010100111"}


def carve(c, x, y, s, col):
    for k, ch in enumerate(s):
        for j in range(5):
            for i in range(3):
                if DIG[ch][j * 3 + i] == '1':
                    c.p(x + k * 4 + i, y + j, col)


def lantern(c, x, y):
    iron = op.IRON
    c.rect(x + 3, y - 6, 1, 4, iron[3])
    c.rect(x - 2, y - 6, 6, 1, iron[3])
    c.rect(x - 1, y - 2, 9, 2, iron[2])
    c.rect(x, y, 7, 10, iron[4])
    c.rect(x + 1, y + 1, 5, 8, ramp(85, 0.06)[1])
    c.rect(x + 1, y + 1, 2, 8, ramp(85, 0.04)[0])
    c.rect(x + 3, y + 1, 1, 8, iron[4])
    c.rect(x + 1, y + 10, 5, 2, iron[2])


def sign(c, x, y):
    """A baker's sign: a pretzel on a board hung from a wrought bracket."""
    iron, pr = op.IRON, ramp(55, 0.13)
    c.rect(x, y, 24, 2, iron[3]); c.rect(x, y, 24, 1, iron[2])
    for i in range(9):
        c.p(x + i, y + 9 - i, iron[3]); c.p(x + i, y + 8 - i, iron[2])
    for hx in (x + 9, x + 20):
        c.rect(hx, y + 2, 1, 4, iron[2])
    op.raised(c, x + 6, y + 6, 18, 16, OAK, 3)
    c.rect(x + 8, y + 8, 14, 12, RENDER[1])
    c.rect(x + 8, y + 8, 14, 1, RENDER[3]); c.rect(x + 8, y + 8, 1, 12, RENDER[3])
    cx, cy = x + 15, y + 14
    for yy in range(-5, 6):
        for xx in range(-7, 8):
            for lx in (-3, 3):
                d = math.hypot(xx - lx, yy * 1.2)
                if 2.0 <= d <= 3.6:
                    c.p(cx + xx, cy + yy, pr[2] if yy < 0 else pr[4])
    c.p(cx - 4, cy - 3, pr[0]); c.p(cx + 2, cy - 3, pr[0])


class GableHouse:
    def __init__(self, W=152, wall=62, rise=60, depth=70, over=10, lean_to=True, seed=3,
                 ground='render', paint='green'):
        self.ground, self.paint = ground, paint
        self.W, self.wall, self.rise, self.depth, self.over = W, wall, rise, depth, over
        self.lean = lean_to
        self.seed = seed
        self.x0 = 50 if lean_to else 12
        self.base = 230
        self.c = C(self.x0 + W + 36, self.base + 6)

    def build(self):
        c, W = self.c, self.W
        wx0, wx1, base = self.x0, self.x0 + W, self.base
        eave = base - self.wall
        apx = wx0 + W // 2
        rise, depth, over = self.rise, self.depth, self.over
        slope = rise / (W / 2)

        def rake(x):
            return round(eave + 6 - (W / 2 + over - abs(x - apx)) * slope)

        if self.lean:
            self.lean_to(wx0, base)
        # front wall and the gable triangle
        gf = [(x, y) for y in range(eave, base) for x in range(wx0, wx1)]
        gt = [(x, y) for y in range(eave - rise, eave) for x in range(wx0, wx1)
              if abs(x - apx + 0.5) <= (y - (eave - rise)) / slope]
        render(c, wx0, eave - rise, W, rise + self.wall - 11)
        if self.ground == 'brick':
            brick(c, wx0, eave + 6, W, self.wall - 17)
        elif self.ground == 'whitewash':
            from art.front_materials import whitewash
            whitewash(c, wx0, eave + 6, W, self.wall - 17)
        for x, y in [(x, y) for y in range(eave - rise, eave) for x in range(wx0, wx1)]:
            if abs(x - apx + 0.5) > (y - (eave - rise)) / slope:
                c.px[x, y] = (0, 0, 0, 0)
        solid = set()
        bevel(c, wx0, eave + 4, 6, self.wall - 15, OAK, mask=solid)
        bevel(c, wx1 - 6, eave + 4, 6, self.wall - 15, OAK, mask=solid)
        bevel(c, apx - 3, eave - rise + 20, 6, rise - 20, OAK, mask=solid)
        for px in (apx - 42, apx + 36):
            top = round(eave - (W / 2 - abs(px + 3 - apx)) * slope) + 6
            bevel(c, px, top, 6, eave - top, OAK, mask=solid)
        bevel(c, apx - 48, eave - 34, 96, 5, OAK, mask=solid)
        brace(c, apx - 36, eave - 1, apx - 24, eave - 29, OAK, 5, solid)
        brace(c, apx + 19, eave - 29, apx + 31, eave - 1, OAK, 5, solid)
        recess(c, gf + gt, solid)
        for gx in (apx - 18, apx + 6):
            op.frame_timber(c, gx, eave - 27, 12, 20, None)
            op.casement(c, gx, eave - 27, 12, 20, 'oak')
            op.reveal(c, gx, eave - 27, 12, 20, 2)
        oy = eave - rise + 25
        for yy in range(-5, 6):
            for xx in range(-5, 6):
                d = math.hypot(xx, yy)
                if d <= 3:
                    c.p(apx + xx, oy + yy, op.GLASS[2] if xx + yy < -1 else op.GLASS[5])
                elif d <= 5:
                    c.p(apx + xx, oy + yy, OAK[2] if xx + yy < 0 else OAK[5])
        # jetty beam with joist ends, shading the ground floor under it
        bevel(c, wx0 - 3, eave - 1, W + 6, 7, OAK, 3)
        for k in range(wx0 + 3, wx1 - 4, 9):
            bevel(c, k, eave + 6, 5, 4, OAK, 3)
        op.cast(c, wx0 + 6, eave + 6, W - 12, 6, 0.7)
        rubble(c, wx0, base - 11, W, 11)
        c.rect(wx0, base - 12, W, 1, RENDER[3])
        # door under a carved lintel, windows with open shutters and boxes
        dw, dh = 24, 46
        dx = apx - dw // 2
        op.door_plank(c, dx, base - dh, dw, dh)
        carve(c, apx - 8, base - dh - 6, '1642', OAK[5])
        # Windows sit midway between the door's frame and the corner post;
        # a narrow front takes narrower windows and leaves, and a lantern
        # only where a gap is left for it.
        ww, leaf = (20, 8) if W >= 140 else (16, 6)
        ext = ww // 2 + 3 + leaf + 2
        lo, hi = dw // 2 + 4 + ext, W // 2 - 6 - ext
        off = (lo + hi) // 2
        for wcx in (apx - off, apx + off):
            wx, y = wcx - ww // 2, eave + 18
            op.frame_timber(c, wx, y, ww, 24, None)
            op.casement(c, wx, y, ww, 24, 'oak')
            op.reveal(c, wx, y, ww, 24, 2)
            op.open_shutters(c, wx - 3, y - 4, ww + 6, 32, self.paint, leaf)
            op.flower_box(c, wx, y + 30, ww, seed=wx)
        if off - ext - dw // 2 - 4 >= 10:
            lantern(c, apx + dw // 2 + 5, eave + 20)
        for k in range(3):
            c.rect(dx - 8 - k, base + k, dw + 16 + 2 * k, 1, RAMPS['granite'][k + 1])
        # roof: two slopes, bargeboards along the rake, ridge, chimney
        roof_slope(c, apx, wx0 - over, rake, depth, 0)
        roof_slope(c, apx, wx1 + over, rake, depth, 1)
        self.roof_window(apx, rake, 22, 30, 16, 18)
        for x in range(wx0 - over, wx1 + over + 1):
            y = rake(x)
            r = OAK if x < apx else [mix(q, OAK[7], 0.15) for q in OAK]
            for k, idx in enumerate((2, 3, 3, 4, 5)):
                c.p(x, y + 1 + k, r[idx])
            op.cast(c, x, y + 6, 1, 3, 0.6)
        self.chimney(wx1 - 44, rake(wx1 - 35) - 26, 18, 44, rake)
        self.ridge(apx, rake(apx) - depth - 1, rake(apx) + 1)
        sign(c, wx1 - 6, eave + 12)
        outline(c)
        return c.im

    def lean_to(self, wx0, base):
        c = self.c
        lx0, lwall = 6, 44
        leave = base - lwall
        render(c, lx0, leave, wx0 - lx0, lwall)
        solid = set()
        bevel(c, lx0, leave, 5, lwall, OAK, mask=solid)
        bevel(c, lx0, leave, wx0 - lx0, 5, OAK, mask=solid)
        recess(c, [(x, y) for y in range(leave, base) for x in range(lx0, wx0)], solid)
        op.frame_timber(c, lx0 + 15, leave + 13, 14, 16, None)
        op.casement(c, lx0 + 15, leave + 13, 14, 16, 'oak')
        op.reveal(c, lx0 + 15, leave + 13, 14, 16, 2)
        rubble(c, lx0, base - 9, wx0 - lx0, 9)
        plain_tiles(c, lx0 - 4, leave - 32, wx0 - lx0 + 8, 32)
        c.rect(lx0 - 4, leave, wx0 - lx0 + 8, 2, OAK[4])
        c.rect(lx0 - 4, leave, wx0 - lx0 + 8, 1, OAK[3])
        op.cast(c, lx0, leave + 2, wx0 - lx0, 3)

    def roof_window(self, xa, rake, u0, w0, uw, wh):
        c = self.c
        for u in range(u0, u0 + uw):
            x = xa - u
            yr = rake(x)
            for w in range(w0, w0 + wh):
                a, b = u - u0, w - w0
                y = yr - w
                if a < 2 or a >= uw - 2 or b < 2 or b >= wh - 2:
                    col = OAK[2] if (b >= wh - 2 or a < 2) else OAK[4]
                    if a == 0 or b == 0:
                        col = OAK[5]
                else:
                    col = op.GLASS[5] if b < wh - 5 else op.GLASS[4]
                    if a == uw // 2:
                        col = OAK[4]
                    if (a + b) in (6, 7) and b > 3:
                        col = op.GLASS[2]
                c.p(x, y, col)
            q = c.g(x, yr - w0 + 1)
            c.p(x, yr - w0 + 1, mix(q, (30, 20, 40, 255), 0.4))

    def chimney(self, x, foot, w, h, rake):
        """Brick stack out of the right slope: a stone crown seen from above,
        pots on it, lead flashing at its foot, its shadow on the shingles."""
        c = self.c
        top = foot - h
        for y in range(top + 8, foot + 6):
            for xx in range(x + w, x + w + 7):
                if xx - (x + w) < 7 - max(0, y - foot) and y <= rake(xx):
                    q = c.g(xx, y)
                    if q[3]:
                        c.p(xx, y, mix(q, (40, 30, 70, 255), 0.35))
        brick(c, x, top, w, h, ramp(30, 0.09, lift=-0.13))
        c.rect(x, top, 2, h, mix(c.g(x + 3, top + 1), (255, 240, 220, 255), 0.25))
        op.cast(c, x, top, w, 2, 0.7)
        s = RAMPS['limestone']
        c.rect(x - 2, top - 7, w + 4, 7, s[2])
        c.rect(x - 2, top - 7, w + 4, 1, s[0]); c.rect(x - 2, top - 7, 1, 7, s[1])
        c.rect(x + 3, top - 5, w - 6, 3, s[7]); c.rect(x + 3, top - 5, w - 6, 1, s[6])
        c.rect(x - 2, top - 1, w + 4, 1, s[4])
        pot(c, x + 2, top - 14)
        pot(c, x + 9, top - 14)
        g = RAMPS['zinc']
        c.rect(x - 1, foot - 2, w + 2, 2, g[3]); c.rect(x - 1, foot - 2, w + 2, 1, g[2])

    def ridge(self, x, y0, y1):
        c = self.c
        cols = [None, RIDGE[3], RIDGE[2], RIDGE[1], RIDGE[2], RIDGE[3], RIDGE[4], RIDGE[4], None]
        for y in range(y0, y1):
            seg = (y - y0) % 11
            for k in range(-4, 5):
                col = cols[k + 4]
                if col is None:
                    continue
                if seg == 10:
                    col = RIDGE[5]
                elif seg == 0 and k < 1:
                    col = RIDGE[1]
                c.p(x + k, y, col)
        for yy in range(-5, 6):
            for xx in range(-5, 6):
                d = math.hypot(xx, yy)
                if d <= 4.6:
                    l = (xx + yy) / 6.5
                    c.p(x + xx, y1 + yy, RIDGE[1] if l < -0.7 and d < 3.6 else RIDGE[2] if l < -0.1 else RIDGE[3] if l < 0.5 else RIDGE[5])


def make(out, zoom=3):
    from art.reference import current_adult
    adult = current_adult()
    im = GableHouse().build()
    W, H = im.width + 40, im.height + 10
    sheet = Image.new('RGBA', (W, H), (28, 24, 34, 255))
    sheet.alpha_composite(im, (0, 0))
    sheet.alpha_composite(adult, (im.width + 4, 230 - adult.height))
    sheet = sheet.resize((W * zoom, H * zoom), Image.NEAREST)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    sheet.convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-house.png')
