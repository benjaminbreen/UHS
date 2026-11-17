"""More of the twentieth-century street, front-on: the looks front_modern.py
lacks, added to the same `mod` family.

    .venv/bin/python scripts/art/front_modern_world.py artifacts/modern/ab4.png [look ...]

A Cairo apartment house with a pigeon loft on the roof; a Hong Kong tong lau
over its arcade, hung with vertical signs; the British high street, Victorian
and postwar; a Lagos storey-building behind breeze-block balconies; Havana's
portales; California's Spanish Colonial Revival; the New York walk-up and
brownstone; and the roadside: a gas station, a drive-in and a supermarket.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_modern as fmod
from art import front_iberia as ib  # noqa: E402
from art import front_props as pr  # noqa: E402
from art.front_modern import *  # noqa: E402,F401,F403
from art.front_modern import (Block, C, CONCRETE, CMU, TAR, GRAVEL, ALU, STEEL, BRONZE, RUST, ROOM, GLASS, TIN,  # noqa: E402
                              BRICK, BUFF, CHOCOLATE, LIMESTONE, CREAM, WHITE, OXBLOOD, MUSTARD, SAGE, DOVE, MINT,
                              SALMON, BUTTER, SKY, RED, BLUE, GREEN, YELLOW, ORANGE, TEAL, INK, GOLD, HOTPINK,
                              LIME, TURQ, VIOLET, SAFFRON, CRIMSON, JADE, COBALT, TANGERINE, AZURE, OCHRE, PINE,
                              TERRA, IRONROOF, GOODS, fm, op, h2, math, stucco, cmu, panels, raised, cast_right,
                              reflect, interior, unit, vent, cylinder, sash, glass_door, shopfront, awning, box_sign,
                              text, text_w, farsi, FARSI, skeleton, skeleton_w, line, ramp, RAMPS)

SLATE = RAMPS['slate']
TERRACOTTA = RAMPS['terracotta']
BROWNSTONE = ramp(38, 0.05, lift=-0.16)
WOOD = ramp(50, 0.06, lift=-0.08)
PIGEON = ramp(60, 0.05, lift=-0.02)         # mud and lath of a rooftop loft
SAND = ramp(78, 0.06, lift=0.04)
PISTACHIO = ramp(120, 0.05, lift=0.02)
PEACH = ramp(48, 0.07, lift=0.04)
LILAC = ramp(300, 0.05, lift=0.03)
PALEBLUE = ramp(225, 0.05, lift=0.04)
MALIBU = [ramp(200, 0.11, lift=-0.04), ramp(70, 0.15, lift=0.02), ramp(30, 0.15, lift=-0.06)]

# Arabic, drawn by hand: ful (beans) and shay (tea).
FARSI.update({
    'فول': ['0100000000100', '0100000000000', '0100000000111', '0100011000101', '1100101001111',
            '1110011111111', '0000100000000', '0001000000000'],
    'شاي': ['00000100001000', '00000100010100', '00000100000000', '01100100101010', '10010100101010',
            '10001101111111', '01110000000000', '00101000000000'],
})

# Han characters at 7x7, enough to read as the signs of a Chinese street.
HANZI = {
    '中': '0001000111111110010011001001111111100010000001000',
    '大': '0001000000100011111110001000001010001000101000001',
    '金': '0001000001010001111100001000111111101010101111111',
    '行': '0101111100000000100000101111110001001000100100110',
    '茶': '0100010111111101000100011100010101011111110101010',
    '酒': '1011111000010110111110010101101011100100011011111',
    '家': '0001000111111110111010001010011010000010100110001',
    '米': '1001001010101011111110011100010101010010010001000',
    '藥': '0100010111111100101010111110010101011111110101010',
    '房': '0011100111111110100010111111010000001011110100001',
}
fmod.EXTRA.update({ch: (7, 7, bits) for ch, bits in HANZI.items()})


def bays(x0, W, pitch):
    n = max(1, round(W / pitch))
    return [(x0 + round(W * k / n), x0 + round(W * (k + 1) / n)) for k in range(n)]


def board(b, x, y, w, h, word=None, bg=None, fg=None, frame=None, trade=None):
    """A painted signboard: the game draws it, in the street's own script."""
    b.sign(x, y, w, h, 'board', trade)


def vboard(b, cx, y, word, bg, fg, neon=None, group='v', mode='steady'):
    """A vertical signboard hung off the wall on a bracket, its characters
    the game's, one to a square."""
    c = b.c
    w, h = 15, len(word) * 12 + 5
    x = cx - w // 2
    c.rect(cx - 1, y - 3, 3, 3, STEEL[3])
    b.sign(x, y, w, h, 'blade')
    if neon:
        pts = [(xx, y - 1) for xx in range(x - 1, x + w + 1)] + [(xx, y + h) for xx in range(x - 1, x + w + 1)]
        pts += [(x - 1, yy) for yy in range(y, y + h)] + [(x + w, yy) for yy in range(y, y + h)]
        b.tube(pts, neon, group, mode)
    cast_right(c, x + w, y + 1, h, 3)
    return h


def shutter(c, x, y, w, h, r, up=0.0):
    """A roll-down steel shutter, part raised."""
    top = y + round(h * up)
    c.rect(x - 1, y, w + 2, 5, r[2])
    c.rect(x - 1, y, w + 2, 1, r[0])
    for yy in range(max(top, y + 5), y + h):
        c.rect(x, yy, w, 1, r[(1, 2, 2, 3)[(yy - y) % 4]])


def laundry(c, x, y, w, seed):
    """A line across a balcony with the wash on it."""
    c.rect(x, y, w, 1, DOVE[4])
    xx = x + 2
    k = 0
    while xx < x + w - 5:
        cw, ch = 4 + int(h2(k, 3, seed) * 4), 5 + int(h2(k, 5, seed) * 6)
        col = [WHITE, SKY, SALMON, BUTTER, MINT, CRIMSON, COBALT][int(h2(k, 7, seed) * 7)]
        c.rect(xx, y + 1, cw, ch, col[1])
        c.rect(xx, y + 1, cw, 1, col[0])
        c.rect(xx + cw - 1, y + 1, 1, ch, col[3])
        xx += cw + 2 + int(h2(k, 9, seed) * 4)
        k += 1


def washline(b, x0, x1, by):
    """Two posts and a line on a roof; the wash is an overlay, so it blows."""
    c = b.c
    for px in (x0, x1):
        c.rect(px, by - 16, 2, 16, WOOD[3])
        c.rect(px, by - 16, 1, 16, WOOD[1])
        op.cast(c, px + 2, by - 14, 1, 14, 0.75)
    c.rect(x0 + 2, by - 15, x1 - x0 - 2, 1, DOVE[4])
    for wx in range(x0 + 3, x1 - 22, 22):
        b.overlays.append(['wash', wx, by - 15])


def louvres(c, x, y, w, h, r):
    """Louvred wooden shutters, closed: slats lit on top, dark below."""
    c.rect(x, y, w, h, r[3])
    for yy in range(y + 2, y + h - 1, 2):
        c.rect(x + 1, yy, w - 2, 1, r[1])
    c.rect(x + w // 2, y, 1, h, r[5])
    c.rect(x, y, w, 1, r[1])


def railing(c, x, y, w, h, r, pitch=3):
    c.rect(x, y, w, 2, r[1])
    c.rect(x, y + 2, w, 1, r[4])
    for xx in range(x, x + w, pitch):
        c.rect(xx, y + 2, 1, h - 2, r[2])
    c.rect(x, y + h - 1, w, 1, r[3])


def slab(c, x, y, w, r=CONCRETE, d=4):
    """A balcony or floor slab: its top from above, its edge, its shadow."""
    c.rect(x, y, w, d - 1, r[1])
    c.rect(x, y, w, 1, r[0])
    c.rect(x, y + d - 1, w, 1, r[4])
    op.cast(c, x, y + d, w, 3, 0.6)


def hip_roof(c, L, R, eave, depth, r, tex=None):
    """A pitched roof seen from above at moderate depth: a lit front slope
    in courses, a ridge cap, hips at both ends."""
    for i in range(depth):
        yy = eave - 1 - i
        ins = round(i * 0.9)
        lo, hi = L + ins, R - ins
        if hi - lo < 4:
            break
        q = 1 if i > depth * 0.6 else 2 if i > depth * 0.25 else 3
        c.rect(lo, yy, hi - lo, 1, r[q])
        if (i % 4) == 3:
            c.rect(lo, yy, hi - lo, 1, r[q + 1])
        c.rect(lo, yy, 2, 1, r[1])
        c.rect(hi - 2, yy, 2, 1, r[4])
    top = eave - depth
    c.rect(L + round(depth * 0.9), top, max(0, R - L - 2 * round(depth * 0.9)), 2, r[0])
    c.rect(L - 2, eave - 1, R - L + 4, 2, r[4])
    return top


def pigeon_loft(b, lx, ly):
    """A pigeon loft on poles over a roof, its birds an overlay."""
    c = b.c
    c.rect(lx, ly - 20, 24, 20, PIGEON[2])
    c.rect(lx, ly - 20, 24, 1, PIGEON[0])
    c.rect(lx + 23, ly - 20, 1, 20, PIGEON[4])
    for j in range(3):
        c.rect(lx + 4 + j * 7, ly - 12, 3, 3, PIGEON[6])
    for xx in (lx + 1, lx + 11, lx + 22):
        c.rect(xx, ly - 42, 1, 22, WOOD[3])
    for (ax, ay, bx2, by2) in ((lx + 1, ly - 42, lx + 22, ly - 22), (lx + 22, ly - 42, lx + 1, ly - 22),
                               (lx - 2, ly - 42, lx + 25, ly - 42), (lx - 2, ly - 32, lx + 25, ly - 32)):
        for x_, y_ in line(ax, ay, bx2, by2):
            c.p(x_, y_, WOOD[2])
    op.cast(c, lx + 24, ly - 18, 2, 18, 0.7)
    b.overlays.append(['pigeons', lx + 5, ly - 27])


def peel(c, x, y, w, h, wall, under, seed, n=6):
    """Paint flaking off a rendered wall: blots of the older coat beneath,
    each with the broken edge of the new one lit along its top."""
    for k in range(n):
        px = x + int(h2(k, 1, seed) * (w - 14))
        py = y + int(h2(k, 2, seed) * (h - 10))
        pw, ph = 5 + int(h2(k, 3, seed) * 9), 3 + int(h2(k, 4, seed) * 5)
        for yy in range(py, py + ph):
            inset = abs(yy - py - ph // 2) * 2 // 3 + int(h2(k, yy, seed) * 2)
            for xx in range(px + inset, px + pw - inset):
                q = c.g(xx, yy)
                if q in wall:
                    c.p(xx, yy, under[wall.index(q)])
            c.p(px + inset - 1, yy, wall[4])
        c.rect(px + 2, py - 1, max(1, pw - 4), 1, wall[0])


# ------------------------------------------------------------------ Cairo

CAIRO_SHOPS = [('فول', 'counter', JADE, WHITE), ('PHARMACY', 'shelves', GREEN, WHITE), ('شاي', 'counter', CRIMSON, SAFFRON),
               ('TAILOR', 'racks', COBALT, WHITE), ('JUICE', 'counter', TANGERINE, INK), ('STUDIO', 'empty', INK, YELLOW),
               ('SHOES', 'racks', SAFFRON, CRIMSON)]


class Cairo(Block):
    """A Cairo apartment house of 1950-1985: a concrete frame in painted
    render, tall shuttered windows and balconies with the wash on the line,
    shops under steel shutters, and on the roof a pigeon loft, a tank and
    rebar left for the next floor."""
    FLOORS = dict(row=5, tall=6, shop=3, cottage=2, hut=3, stall=1, hall=5, wide=5)
    H0, H1, PARA, HEAD = 58, 46, 10, 50

    def plan(self):
        self.bays = bays(self.x0, self.W, 40)
        a, b_ = self.bays[len(self.bays) // 2]
        self.door_x, self.door_size = (a + b_) // 2, (20, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, sh, frame = s['wall'], s['shutter'], s.get('kind') == 'frame'
        dust = CONCRETE
        if frame:
            fm.brick(c, x0, top, W, base - top, BRICK)
        else:
            stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for k, (a, b_) in enumerate(self.bays):
                balcony = not frame and (k + i + self.seed) % 3 != 1
                self.cairo_bay(a, b_, b, i, k, balcony, frame)
            if frame:
                # the concrete beam at each floor, cast in place and never rendered
                c.rect(x0, b - 5, W, 5, dust[2])
                c.rect(x0, b - 5, W, 1, dust[1])
                c.rect(x0, b - 1, W, 1, dust[4])
                op.cast(c, x0, b, W, 2, 0.72)
            else:
                self.cairo_balconies(b, i)
        if frame:
            for a in [x0] + [a for a, _ in self.bays[1:]] + [x1 - 5]:
                px0 = min(x1 - 5, max(x0, a - 2))
                c.rect(px0, top, 5, self.floor(0)[0] - top, dust[2])
                c.rect(px0, top, 1, self.floor(0)[0] - top, dust[1])
                c.rect(px0 + 4, top, 1, self.floor(0)[0] - top, dust[4])
                cast_right(c, px0 + 5, top, self.floor(0)[0] - top, 2, 0.74)
        # the roof slab's edge
        c.rect(x0 - 2, top - 1, W + 4, 4, dust[2] if frame else wall[1])
        c.rect(x0 - 2, top - 1, W + 4, 1, dust[1] if frame else wall[0])
        c.rect(x0 - 2, top + 3, W + 4, 1, dust[4] if frame else wall[4])
        op.cast(c, x0, top + 4, W, 3, 0.7)
        self.cairo_ground()
        self.cairo_roof(frame)
        self.foot(CONCRETE)

    def cairo_bay(self, a, b_, b, i, k, balcony, frame):
        """One window on an upper floor: a door to the balcony behind its
        parapet, or a window on a plain sill, shut with wooden louvres."""
        c, s, sh = self.c, self.s, self.s['shutter']
        cx = (a + b_) // 2
        ww = 18
        wh, sill = (30, b - 3) if balcony else (24, b - 13)
        if frame:
            ww, wh, sill = 16, 22, b - 14
        wx, wy = cx - ww // 2, sill - wh
        c.rect(wx - 1, wy - 1, ww + 2, wh + 1, CONCRETE[3])
        c.rect(wx, wy, ww, wh, ROOM[6])
        state = h2(k, i, self.seed)
        if state < 0.3:
            louvres(c, wx, wy, ww, wh, sh)
        else:
            op.glass(c, wx + 1, wy + 1, ww - 2, wh - 2)
            c.rect(cx, wy, 1, wh, CONCRETE[4])
            self.panes.append((wx + 1, wy + 1, ww - 2, wh - 2, 'warm', h2(k, i, self.seed + 2) < 0.6))
            if state < 0.7:
                louvres(c, wx - 7, wy, 6, wh, sh)
                louvres(c, wx + ww + 1, wy, 6, wh, sh)
            else:
                louvres(c, wx, wy, ww // 2, wh, sh)
        op.reveal(c, wx, wy, ww, wh, 2)
        # a concrete lintel over and a sill under, both lit on top
        c.rect(wx - 2, wy - 3, ww + 4, 2, CONCRETE[1])
        c.rect(wx - 2, wy - 1, ww + 4, 1, CONCRETE[3])
        if not balcony:
            c.rect(wx - 2, sill, ww + 4, 2, CONCRETE[1])
            c.rect(wx - 2, sill + 2, ww + 4, 1, CONCRETE[4])
            op.cast(c, wx - 1, sill + 3, ww + 3, 2, 0.72)
            if (k + i + self.seed) % 4 == 0:
                unit(c, wx + ww + (8 if state >= 0.3 and state < 0.7 else 2), sill + 9, 13, 8, 3, DOVE, louvres=True)

    def cairo_balconies(self, b, i):
        """Each run of balconies on a floor: a cantilevered slab and a solid
        rendered parapet, the wash hung above it, a unit on its rail."""
        c, s, wall = self.c, self.s, self.s['wall']
        runs, run = [], []
        for k, (a, b_) in enumerate(self.bays):
            if (k + i + self.seed) % 3 != 1:
                run.append((a, b_))
            elif run:
                runs.append(run)
                run = []
        if run:
            runs.append(run)
        for j, run in enumerate(runs):
            X, R = run[0][0] + 2, run[-1][1] - 2
            ph = 12
            slab(c, X - 2, b - 3, R - X + 4, wall, 3)
            c.rect(X, b - 3 - ph, R - X, ph, wall[1])
            c.rect(X, b - 3 - ph, R - X, 2, wall[0])
            c.rect(X, b - 3 - ph + 2, R - X, 1, wall[2])
            c.rect(R - 1, b - 3 - ph, 1, ph, wall[3])
            c.rect(X, b - 4, R - X, 1, wall[3])
            for k_, (a, b_) in enumerate(run):
                if h2(k_, i, self.seed + 4 + j) < 0.35:
                    laundry(c, a + 3, b - 3 - ph - 12, b_ - a - 6, self.seed + k_ * 7 + i)
                elif h2(k_, i, self.seed + 6 + j) < 0.3:
                    unit(c, a + 4, b - 3 - ph + 9, 12, 8, 3, DOVE, louvres=True)

    def cairo_ground(self):
        """Shops under steel shutters, each with room for its board; the
        building's own entrance with an iron and glass door."""
        c, s = self.c, self.s
        x0, x1, W, base = self.x0, self.x1, self.W, self.base
        t0 = self.floor(0)[0]
        c.rect(x0, t0, W, base - t0, CONCRETE[3])
        c.rect(x0, t0, W, 4, CONCRETE[1])
        c.rect(x0, t0 + 4, W, 1, CONCRETE[4])
        for k, (a, b_) in enumerate(self.bays):
            sx, sw = a + 3, b_ - a - 6
            if a <= self.door_x < b_:
                c.rect(sx, t0 + 6, sw, base - t0 - 6, CONCRETE[4])
                dx = self.door_x - 10
                c.rect(dx - 2, base - 47, 24, 47, TRAV[2])
                c.rect(dx - 2, base - 47, 24, 1, TRAV[1])
                c.rect(dx, base - 44, 20, 44, INK[3])
                op.glass(c, dx + 2, base - 42, 16, 26)
                for xx in range(dx + 3, dx + 17, 3):
                    c.rect(xx, base - 42, 1, 26, INK[2])
                c.rect(dx, base - 30, 20, 1, INK[2])
                c.rect(dx + 15, base - 14, 2, 2, GOLD[1])
                self.lamp(self.door_x, base - 50)
                continue
            self.sign(sx, t0 + 7, sw, 16, 'board')
            sy = t0 + 25
            up = [0.85, 0.85, 0.3, 0.0][(k + self.seed) % 4]
            open_h = round((base - sy - 5) * up)
            goods = ['counter', 'shelves', 'racks', 'books'][(k * 3 + self.seed) % 4]
            interior(c, sx, sy + 5, sw, open_h, goods, self.seed + k)
            if open_h:
                self.panes.append((sx, sy + 5, sw, open_h, 'shop', True))
            shutter(c, sx, sy, sw, base - sy, STEEL, up)
        for a in [x0] + [a for a, _ in self.bays[1:]] + [x1 - 3]:
            px0 = min(x1 - 6, max(x0, a - 3))
            op.raised(c, px0, t0 + 5, 6, base - t0 - 5, CONCRETE, 2)

    def cairo_roof(self, frame):
        """A tiled roof with a tank, a pigeon loft on poles and the wash; on a
        frame building the columns' rebar left for the floor still to come."""
        c, s = self.c, self.s
        x0, x1, W, top = self.x0, self.x1, self.W, self.top
        y0 = self.deck(None, CONCRETE, CONCRETE if frame else s['wall'], furnish=False)
        if frame:
            for a in [x0] + [a for a, _ in self.bays[1:]] + [x1 - 5]:
                px0 = min(x1 - 5, max(x0, a - 2))
                c.rect(px0, top - 6, 5, 4, CONCRETE[2])
                c.rect(px0, top - 6, 5, 1, CONCRETE[1])
                for d in (1, 3):
                    c.rect(px0 + d, top - 22, 1, 16, RUST[3])
                    c.p(px0 + d, top - 22, RUST[1])
        vent(c, x0 + W // 3 - 6, y0 + 16, 6)
        ty = y0 + min(26, self.roof_depth - 10)
        cylinder(c, x0 + W // 3 + 4, ty, 14, 12, DOVE, lid=DOVE[4])
        if W >= 96:
            lx, ly = x1 - 34, y0 + min(34, self.roof_depth - 8)
            pigeon_loft(self, lx, ly)
            wx = x0 + W // 3 + 24
            if lx - wx >= 30:
                washline(self, wx, lx - 6, ly - 4)


# ------------------------------------------------------------------ Hong Kong

TONG_SHOPS = [('金行', GOLD, CRIMSON, 'red'), ('酒家', CRIMSON, GOLD, 'pink'), ('茶', JADE, GOLD, None),
              ('藥房', WHITE, CRIMSON, 'green'), ('米', SAFFRON, CRIMSON, None), ('大酒家', CRIMSON, GOLD, 'red')]


class TongLau(Block):
    """A Hong Kong or Guangzhou tong lau of 1920-1970: shops behind an
    arcade over the pavement, verandahs above enclosed in steel windows or
    open on the wash, and signboards hung down the front in Chinese."""
    FLOORS = dict(row=4, tall=5, shop=3, cottage=2, hut=4, stall=1, hall=4, wide=4)
    H0, H1, PARA, HEAD = 64, 46, 16, 30

    def plan(self):
        self.bays = bays(self.x0, self.W, 44)
        a, b_ = self.bays[0]
        self.door_x, self.door_size = a + 16, (20, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall = s['wall']
        stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        for i in range(1, self.floors):
            t, b = self.floor(i)
            enclosed = s.get('enclosed', 0) > h2(i, 1, self.seed)
            slab(c, x0 - 2, b - 3, W + 4, wall)
            if enclosed:
                c.rect(x0 + 2, t + 8, W - 4, b - t - 22, s['frame'][3])
                for xx in range(x0 + 4, x1 - 6, 12):
                    op.glass(c, xx, t + 10, 10, b - t - 26)
                    self.panes.append((xx, t + 10, 10, b - t - 26, 'cool' if xx % 3 else 'warm',
                                       h2(xx, i, self.seed) < 0.6))
                c.rect(x0 + 2, b - 14, W - 4, 11, wall[2])
                c.rect(x0 + 2, b - 14, W - 4, 1, wall[0])
            else:
                for k, (a, b_) in enumerate(self.bays):
                    wx, ww = a + 6, b_ - a - 12
                    c.rect(wx, t + 6, ww, b - t - 9, ROOM[5])
                    for dx in (wx, wx + ww - 10):
                        c.rect(dx, t + 8, 10, b - t - 14, s['frame'][2])
                        op.glass(c, dx + 2, t + 10, 6, b - t - 22)
                    self.panes.append((wx + 10, t + 8, ww - 20, b - t - 18, 'warm', h2(k, i, self.seed) < 0.55))
                    if h2(k, i, self.seed + 3) < 0.5:
                        laundry(c, wx + 1, t + 9, ww - 2, self.seed + k + i * 5)
                railing(c, x0, b - 16, W, 13, s['grille'], 4)
                for xx in range(x0 + 2, x1 - 2, 8):
                    c.rect(xx, b - 12, 4, 4, s['grille'][1])
            for xx in (x0, x1 - 5):
                c.rect(xx, t, 5, b - t, wall[1])
                c.rect(xx + 4, t, 1, b - t, wall[4])
        # the arcade: piers in front, the shops in its shade
        t0 = self.floor(0)[0]
        ceil = t0 + 10
        c.rect(x0, t0, W, 10, wall[1])
        c.rect(x0, t0, W, 1, wall[0])
        c.rect(x0, t0 + 9, W, 1, wall[4])
        shade = [ROOM[3], ROOM[4]]
        for k, (a, b_) in enumerate(self.bays):
            c.rect(a, ceil, b_ - a, base - ceil, shade[0])
            c.rect(a, ceil, b_ - a, 4, shade[1])
            sx, sw = a + 8, b_ - a - 14
            word, bg, fg, neon = TONG_SHOPS[(k + self.seed + s.get('shift', 0)) % len(TONG_SHOPS)]
            if k == 0:
                c.rect(self.door_x - 10, base - 44, 20, 44, STEEL[4])
                for xx in range(self.door_x - 9, self.door_x + 10, 3):
                    c.rect(xx, base - 43, 1, 42, STEEL[2])
                interior(c, a + 30, ceil + 10, max(4, b_ - a - 34), base - ceil - 10, 'shelves', self.seed)
            else:
                interior(c, sx, ceil + 8, sw, base - ceil - 8, ['shelves', 'counter', 'racks'][k % 3], self.seed + k)
                self.panes.append((sx, ceil + 8, sw, base - ceil - 8, 'shop', True))
            sw = min(b_ - a - 6, 44)
            self.sign(a + (b_ - a) // 2 - sw // 2, t0 - 2, sw, 15, 'board')
        for xx in [a for a, _ in self.bays] + [x1 - 6]:
            raised(c, xx, ceil, 6, base - ceil, wall, 2)
            cast_right(c, xx + 6, ceil, base - ceil, 3)
        op.cast(c, x0, ceil, W, 3, 0.55)
        # vertical boards down the front
        if self.floors > 1:
            for j, (a, b_) in enumerate(self.bays[1:] if len(self.bays) > 1 else self.bays):
                if (j + self.seed) % 2:
                    continue
                word, bg, fg, neon = TONG_SHOPS[(j * 3 + self.seed + 1) % len(TONG_SHOPS)]
                vboard(self, b_ - 6, self.floor(1)[1] - 4 - (len(word) * 12 + 5), word, bg, fg, neon, f'v{j}',
                       'flicker' if j == 0 else 'steady')
        # roof
        self.coping(wall)
        y0 = self.deck(None, CONCRETE, wall, furnish=False)
        back = y0 + min(24, self.roof_depth - 8)
        if W >= 96:
            sx = x1 - 42
            unit(c, sx, back, 30, 16, 7, wall, top=TIN)
            for xx in range(sx + 2, sx + 29, 4):
                c.rect(xx, back - 23, 1, 7, TIN[3])
            c.rect(sx + 4, back - 13, 8, 13, CHOCOLATE[3])
            op.glass(c, sx + 16, back - 12, 9, 6)
            self.panes.append((sx + 16, back - 12, 9, 6, 'warm', True))
        cylinder(c, x0 + 12, back + 8, 12, 10, CONCRETE, lid=CONCRETE[4])
        mx = x0 + W // 2
        c.rect(mx, back - 30, 1, 28, INK[2])
        for j, w_ in enumerate((16, 10)):
            c.rect(mx - w_ // 2, back - 28 + j * 6, w_, 1, INK[2])
        if W >= 96:
            washline(self, x0 + 30, x1 - 48, top - 6)
        self.foot(CONCRETE)


# ------------------------------------------------------------------ the British high street

HIGH_SHOPS = [('CHEMIST', 'shelves', COBALT, WHITE), ('NEWSAGENT', 'books', CRIMSON, CREAM), ('BUTCHER', 'counter', JADE, CREAM),
              ('BAKER', 'bread', OXBLOOD, GOLD), ('BOOKMAKER', 'empty', INK, YELLOW), ('GREENGROCER', 'counter', GREEN, WHITE),
              ('TEA ROOM', 'counter', SAGE, OXBLOOD), ('IRONMONGER', 'shelves', MUSTARD, INK), ('FISH BAR', 'counter', AZURE, WHITE)]


class HighStreet(Block):
    """The British high street: a Victorian parade of brick over shopfronts
    with signwritten fascias between consoles, sashes under stone heads, a
    slate roof with its stacks on the party walls; or a 1960s precinct of
    concrete panels with a canopy over the walk."""
    FLOORS = dict(row=2, tall=3, shop=2, cottage=1, hut=2, stall=1, hall=3, wide=2)
    H0, H1, PARA, HEAD = 60, 46, 8, 44

    def plan(self):
        self.units = bays(self.x0, self.W, 72)
        a, b_ = self.units[0]
        self.door_x, self.door_size = b_ - 16, (20, 44)
        if self.s.get('kind') == 'precinct':
            self.para = 12

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        precinct = s.get('kind') == 'precinct'
        t0 = self.floor(0)[0]
        if precinct:
            panels(c, x0, top, W, t0 - top, CONCRETE, 32, 12, 2, self.seed)
            for i in range(1, self.floors):
                t, b = self.floor(i)
                c.rect(x0 + 4, t + 10, W - 8, 22, s['frame'][3])
                for xx in range(x0 + 6, x1 - 8, 16):
                    op.glass(c, xx, t + 12, 14, 18)
                    self.panes.append((xx, t + 12, 14, 18, 'cool', h2(xx, i, self.seed) < 0.5))
                c.rect(x0 + 4, t + 32, W - 8, 2, CONCRETE[1])
                op.cast(c, x0 + 4, t + 34, W - 8, 2, 0.7)
            self.coping(CONCRETE)
            self.deck(None, TAR, CONCRETE)
            unit(c, x0 + W // 3, top - 2, 18, 8, 5, DOVE, louvres=True)
        else:
            fm.brick(c, x0, top, W, t0 - top, s['wall'])
            for i in range(1, self.floors):
                t, b = self.floor(i)
                c.rect(x0, b - 4, W, 3, LIMESTONE[1])
                c.rect(x0, b - 4, W, 1, LIMESTONE[0])
                for a, b_ in self.units:
                    n = 2 if b_ - a < 90 else 3
                    for j in range(n):
                        cx = a + round((b_ - a) * (j + 0.5) / n)
                        sash(self, cx, b - 9, 16, 28, s['sash'], LIMESTONE,
                             arch=s['wall'] if s.get('arched') else None)
            # roof: slate at moderate depth, stacks on the party walls
            depth = round(self.roof_depth * 0.72)
            hip_roof(c, x0 - 1, x1 + 1, top, depth, SLATE)
            c.rect(x0 - 2, top - 2, W + 4, 2, s['wall'][4])
            for xx in [a for a, _ in self.units[1:]] + ([x0 + 10] if len(self.units) == 1 else []):
                sx = max(x0 + 6, min(x1 - 20, xx - 7))
                c.rect(sx, top - 30, 14, 26, s['wall'][2])
                c.rect(sx, top - 30, 14, 2, s['wall'][1])
                c.rect(sx + 13, top - 30, 1, 26, s['wall'][4])
                c.rect(sx - 1, top - 32, 16, 3, LIMESTONE[2])
                self.smoke.append([sx + 6, top - 38, 'chimney'])
                for j in range(3):
                    c.rect(sx + 1 + j * 4, top - 37, 3, 5, TERRACOTTA[2 + j % 2])
                    c.rect(sx + 1 + j * 4, top - 37, 3, 1, TERRACOTTA[1])
        # the shopfronts
        for k, (a, b_) in enumerate(self.units):
            word, goods, bg, fg = HIGH_SHOPS[(k * 2 + self.seed + s.get('shift', 0)) % len(HIGH_SHOPS)]
            fy = t0 + 2
            if precinct:
                box_sign(self, a + 4, fy, b_ - a - 8, 14, word, bg, fg)
            else:
                for px0 in (a, b_ - 6):
                    raised(c, px0, fy, 6, base - fy, s['pilaster'], 2)
                    raised(c, px0 - 1, fy - 1, 8, 6, s['pilaster'], 2)
                c.rect(a + 6, fy, b_ - a - 12, 15, bg[3])
                board(self, a + 6, fy, b_ - a - 12, 15, word, bg, fg)
                c.rect(a - 1, fy - 3, b_ - a + 2, 2, s['pilaster'][1])
            gy = fy + 17
            dx = b_ - 16
            shopfront(self, a + 6, gy, dx - 13 - a - 6, base - gy, s['pilaster'] if not precinct else ALU,
                      s['pilaster'] if not precinct else CONCRETE, goods, transom=8)
            c.rect(dx - 13, gy, 26, base - gy, ROOM[6])
            glass_door(self, dx, base, 20, base - gy - 8, s['pilaster'] if not precinct else ALU)
            if not precinct and goods in ('counter', 'bread') and k % 2 == 0:
                awning(c, a + 6, gy + 1, dx - 13 - a - 6, bg, WHITE, depth=8)
        if precinct:
            slab(c, x0 - 3, t0 - 1, W + 6, CONCRETE, 5)
        self.foot(CONCRETE)


# ------------------------------------------------------------------ Lagos

LAGOS_SHOPS = [('CHEMIST', COBALT, WHITE), ('GOD IS GOOD', SAFFRON, CRIMSON), ('CHOP BAR', CRIMSON, WHITE),
               ('TAILOR', JADE, WHITE), ('PHOTO', INK, YELLOW), ('PROVISIONS', TURQ, INK), ('BOUTIQUE', HOTPINK, WHITE),
               ('SPARE PARTS', ORANGE, INK)]


def breeze(c, x, y, w, h, r):
    """A balustrade of breeze blocks: 8px blocks, each pierced in a cross."""
    c.rect(x, y, w, h, r[2])
    for by in range(y, y + h - 7, 8):
        for bx in range(x, x + w - 7, 8):
            c.rect(bx, by, 8, 1, r[1])
            c.rect(bx, by, 1, 8, r[1])
            c.rect(bx + 7, by, 1, 8, r[4])
            c.rect(bx + 2, by + 3, 4, 2, ROOM[6])
            c.rect(bx + 3, by + 2, 2, 4, ROOM[6])
    c.rect(x, y, w, 2, r[0])
    op.cast(c, x, y + h, w, 2, 0.7)


class Storey(Block):
    """A Lagos or Accra storey-building of 1955-1990: painted render, a
    balcony along every floor behind breeze blocks, louvred glass, shops
    below with their names painted on the wall, under a hipped iron roof."""
    FLOORS = dict(row=3, tall=4, shop=2, cottage=2, hut=2, stall=1, hall=3, wide=3)
    H0, H1, PARA, HEAD = 58, 46, 6, 40

    def plan(self):
        self.units = bays(self.x0, self.W, 56)
        a, b_ = self.units[-1]
        self.door_x, self.door_size = b_ - 14, (20, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall = s['wall']
        stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for k, (a, b_) in enumerate(self.units):
                self.storey_window(a + 10, b_ - a - 20, t + 5, b - t - 12, k, i)
            slab(c, x0 - 3, b - 3, W + 6, CONCRETE)
            breeze(c, x0 - 2, b - 19, W + 4, 16, s['breeze'])
        t0 = self.floor(0)[0]
        for k, (a, b_) in enumerate(self.units):
            word, bg, fg = LAGOS_SHOPS[(k * 3 + self.seed + s.get('shift', 0)) % len(LAGOS_SHOPS)]
            c.rect(a, t0, b_ - a, base - t0, bg[2])
            stucco(c, a, t0, b_ - a, 18, bg, 2, self.seed + k)
            self.sign(a + 2, t0 + 2, b_ - a - 4, 14, 'paint')
            sx, sw = a + 5, b_ - a - (30 if a <= self.door_x < b_ else 10)
            interior(c, sx, t0 + 22, sw, base - t0 - 22, ['shelves', 'racks', 'counter'][(k + self.seed) % 3], self.seed + k)
            self.panes.append((sx, t0 + 22, sw, base - t0 - 22, 'shop', True))
            for lx in (sx - 3, sx + sw):
                c.rect(lx, t0 + 22, 3, base - t0 - 22, STEEL[2])
                for yy in range(t0 + 24, base, 4):
                    c.rect(lx, yy, 3, 1, STEEL[4])
        dx = self.door_x - 10
        c.rect(dx, base - 44, 20, 44, s['frame'][3])
        c.rect(dx + 2, base - 42, 16, 40, s['frame'][2])
        for yy in range(base - 40, base - 4, 6):
            c.rect(dx + 3, yy, 14, 1, s['frame'][4])
        slab(c, x0 - 4, t0 + 18, W + 8, TIN, 3)
        # a hipped iron roof over a thin eave, rust bleeding from its nails
        c.rect(x0 - 4, top - 2, W + 8, 3, wall[4])
        rd = round(self.roof_depth * 0.8)
        ridge = hip_roof(c, x0 - 4, x1 + 4, top - 1, rd, s["roof"])
        for xx in range(x0, x1, 5):
            if h2(xx, 2, self.seed) < 0.3:
                ry = top - 4 - int(h2(xx, 3, self.seed) * (rd - 8))
                L = 2 + int(h2(xx, 4, self.seed) * 5)
                c.rect(xx, ry, 2, L, RUST[3])
                c.rect(xx, ry, 1, L, RUST[2])
        # the overhead tank on its steel stand, standing through the roof
        if W >= 80:
            tx, tb = x1 - 30, top - 6
            for px in (tx + 1, tx + 15):
                c.rect(px, tb - 18, 2, 18, INK[3])
            for x_, y_ in line(tx + 3, tb - 16, tx + 14, tb - 3):
                c.p(x_, y_, INK[3])
            c.rect(tx - 1, tb - 20, 20, 2, INK[2])
            unit(c, tx, tb - 20, 18, 14, 6, s['tank'])
            for xx in range(tx + 4, tx + 16, 5):
                c.rect(xx, tb - 34, 1, 14, s['tank'][4])
            aerial(c, x0 + W // 3, ridge + 4, 24)
        self.foot(CONCRETE)

    def storey_window(self, wx, ww, wy, wh, k, i):
        """Glass louvres (nako) in a painted frame, a wire screen on one
        half, and the burglar-proof bars over the lot."""
        c, s = self.c, self.s
        fr = s['frame']
        c.rect(wx - 2, wy - 2, ww + 4, wh + 4, fr[2])
        c.rect(wx - 2, wy - 2, ww + 4, 1, fr[1])
        c.rect(wx, wy, ww, wh, ROOM[6])
        half = ww // 2
        for yy in range(wy + 1, wy + wh - 1, 3):
            c.rect(wx + 1, yy, ww - 2, 1, GLASS[1])
            c.rect(wx + 1, yy + 1, ww - 2, 1, GLASS[3])
        if h2(k, i, self.seed) < 0.5:
            for yy in range(wy, wy + wh):
                for xx in range(wx + half, wx + ww):
                    if (xx + yy) % 2 == 0:
                        c.p(xx, yy, DOVE[4])
        c.rect(wx + half, wy, 1, wh, fr[3])
        op.reveal(c, wx, wy, ww, wh, 2)
        bars = s.get('bars', INK)
        for xx in range(wx + 2, wx + ww - 1, 4):
            c.rect(xx, wy - 1, 1, wh + 2, bars[2])
        for yy in (wy + 3, wy + wh - 4):
            c.rect(wx - 1, yy, ww + 2, 1, bars[2])
        for xx in range(wx + 4, wx + ww - 3, 8):
            for d in range(-2, 3):
                c.p(xx + d, wy + wh // 2 + abs(d) - 1, bars[1])
        self.panes.append((wx + 1, wy + 1, ww - 2, wh - 2, 'warm', h2(k, i, self.seed + 1) < 0.6))


# ------------------------------------------------------------------ Havana

HABANA_SHOPS = [('BODEGA', 'shelves', SAFFRON, CRIMSON), ('FARMACIA', 'shelves', JADE, WHITE), ('CAFE', 'counter', CRIMSON, WHITE),
                ('BARBERIA', 'empty', COBALT, WHITE), ('PELETERIA', 'racks', INK, GOLD), ('DULCERIA', 'bread', HOTPINK, WHITE)]


def fanlight(c, cx, y, w, cols):
    """A mediopunto: the half-wheel of coloured glass over a Havana door."""
    r = w // 2
    for dy in range(r):
        for dx in range(-r, r + 1):
            d = math.hypot(dx, dy)
            if d <= r:
                if d > r - 1.5:
                    c.p(cx + dx, y + r - dy, WHITE[1])
                else:
                    a = math.atan2(dy, dx)
                    c.p(cx + dx, y + r - dy, cols[int(a / math.pi * len(cols)) % len(cols)][2])
    c.rect(cx - r, y + r, w + 1, 1, WHITE[2])


class Habana(Block):
    """Havana, 1900-1959: a pastel front over portales, the arcade that
    shades the pavement, tall shuttered doors above with coloured glass
    fans and iron balconies; or Art Deco, stepped and lettered."""
    FLOORS = dict(row=2, tall=3, shop=2, cottage=1, hut=2, stall=1, hall=3, wide=2)
    H0, H1, PARA, HEAD = 66, 54, 18, 22

    def plan(self):
        self.bays = bays(self.x0, self.W, 40)
        a, b_ = self.bays[0]
        self.door_x, self.door_size = (a + b_) // 2, (22, 46)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, deco = s['wall'], s.get('deco')
        stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        if not deco:
            peel(c, x0 + 2, top + 2, W - 4, self.floor(0)[0] - top - 4, wall, s['under'], self.seed, max(3, W // 24))
        cols = [CRIMSON, COBALT, SAFFRON, JADE]
        for i in range(1, self.floors):
            t, b = self.floor(i)
            c.rect(x0, b - 3, W, 3, wall[1])
            for k, (a, b_) in enumerate(self.bays):
                cx = (a + b_) // 2
                dw, dh = 18, 36
                dx, dy = cx - dw // 2, b - 6 - dh
                if deco:
                    c.rect(dx - 1, dy, dw + 2, dh, s['trim'][3])
                    op.glass(c, dx + 1, dy + 2, dw - 2, dh - 4)
                    for yy in range(dy + 8, dy + dh, 8):
                        c.rect(dx + 1, yy, dw - 2, 1, s['trim'][2])
                    self.panes.append((dx + 1, dy + 2, dw - 2, dh - 4, 'warm', h2(k, i, self.seed) < 0.55))
                else:
                    fanlight(c, cx, dy - 10, dw, cols[k % 2:] + cols[:k % 2])
                    c.rect(dx, dy, dw, dh, ROOM[6])
                    louvres(c, dx, dy, dw // 2, dh, s['shutter'])
                    if h2(k, i, self.seed) < 0.5:
                        louvres(c, dx + dw // 2, dy, dw // 2, dh, s['shutter'])
                    else:
                        self.panes.append((dx + dw // 2, dy, dw // 2, dh, 'warm', True))
                    op.reveal(c, dx, dy, dw, dh, 2)
                    slab(c, dx - 5, b - 6, dw + 10, wall, 3)
                    railing(c, dx - 5, b - 18, dw + 10, 12, INK)
                    for xx in range(dx - 4, dx + dw + 4, 3):
                        c.p(xx, b - 12 + (xx % 6 == 0), INK[1])
        # portales: arches across the pavement, shops in their shade
        t0 = self.floor(0)[0]
        spring = t0 + 18
        for k, (a, b_) in enumerate(self.bays):
            c.rect(a, t0 + 8, b_ - a, base - t0 - 8, ROOM[4])
            c.rect(a, t0 + 8, b_ - a, 6, ROOM[5])
            sx, sw = a + 9, b_ - a - 18
            if a <= self.door_x < b_:
                c.rect(self.door_x - 11, base - 46, 22, 46, s['shutter'][4])
                for yy in range(base - 44, base - 2, 6):
                    c.rect(self.door_x - 9, yy, 18, 4, s['shutter'][3])
                continue
            word, goods, bg, fg = HABANA_SHOPS[(k + self.seed + s.get('shift', 0)) % len(HABANA_SHOPS)]
            interior(c, sx, spring + 12, sw, base - spring - 12, goods, self.seed + k)
            self.panes.append((sx, spring + 12, sw, base - spring - 12, 'shop', True))
            board(self, sx - 2, spring, sw + 4, 10, word, bg, fg)
        for k, (a, b_) in enumerate(self.bays):
            r = (b_ - a) // 2 - 4
            cx = (a + b_) // 2
            for dx in range(-r - 4, r + 5):
                if abs(dx) > r:
                    continue
                dy = round(math.sqrt(max(0, r * r - dx * dx)) * 0.7)
                c.rect(cx + dx, t0, 1, spring - dy - t0 + 4, wall[2])
                c.p(cx + dx, spring - dy + 4, wall[4])
        for xx in [a for a, _ in self.bays] + [x1 - 7]:
            raised(c, xx, t0, 7, base - t0, wall, 2)
            c.rect(xx - 1, spring + 2, 9, 3, wall[1])
            cast_right(c, xx + 7, spring + 5, base - spring - 5, 3)
        c.rect(x0, t0, W, 3, wall[1])
        # top: a balustrade, or a stepped deco parapet with a name in neon
        if deco:
            mid = (x0 + x1) // 2
            for j, w_ in enumerate((W, W * 2 // 3, W // 3)):
                c.rect(mid - w_ // 2, top - j * 8, w_, 8, wall[1 + (j % 2)])
                c.rect(mid - w_ // 2, top - j * 8, w_, 1, wall[0])
            if self.floors > 1:
                nw = min(W - 16, 64)
                self.sign(mid - nw // 2, top + 3, nw, 14, 'neon')
        else:
            c.rect(x0, top - 10, W, 10, wall[1])
            for xx in range(x0 + 3, x1 - 3, 6):
                c.rect(xx, top - 8, 3, 8, wall[0])
                c.rect(xx + 2, top - 8, 1, 8, wall[3])
            c.rect(x0 - 1, top - 12, W + 2, 3, wall[0])
        y1 = top - (16 if deco else 10)
        y0 = self.deck(None, CONCRETE, wall, y=y1, furnish=False)
        # the azotea: a tank on its stand, the wash, and a loft of pigeons
        D = y1 - y0
        tx = x0 + 8
        c.rect(tx - 1, y0 + min(D - 4, 24) - 6, 18, 6, CONCRETE[3])
        c.rect(tx - 1, y0 + min(D - 4, 24) - 6, 18, 1, CONCRETE[1])
        cylinder(c, tx, y0 + min(D - 4, 24) - 6, 16, 14, DOVE, lid=DOVE[4])
        cast_right(c, tx + 16, y0 + min(D - 4, 24) - 24, 22, 3, 0.66)
        if W >= 96:
            lx = x1 - 34
            pigeon_loft(self, lx, y0 + min(D - 6, 32))
            if lx - tx >= 52:
                washline(self, tx + 24, lx - 6, y0 + min(D - 6, 30))
        self.foot(LIMESTONE)


# ------------------------------------------------------------------ California

MISSION_SHOPS = [('BOOKS', 'books', TERRA, OXBLOOD), ('CAFE', 'counter', JADE, CREAM), ('BAKERY', 'bread', SAFFRON, OXBLOOD),
                 ('FLORIST', 'shelves', HOTPINK, WHITE), ('RECORDS', 'racks', COBALT, WHITE), ('SURF SHOP', 'racks', TURQ, INK)]


class Mission(Block):
    """California's Spanish Colonial Revival, 1915-1940: white stucco, a
    pent roof of red barrel tile over arched shop windows, Malibu tile on
    the stallrisers, iron grilles and bracket signs; a tile-roofed tower on
    the larger ones."""
    FLOORS = dict(row=1, tall=2, shop=1, cottage=1, hut=1, stall=1, hall=2, wide=1)
    H0, H1, PARA, HEAD = 66, 48, 26, 40

    def plan(self):
        self.units = bays(self.x0, self.W, 64)
        a, b_ = self.units[0]
        self.door_x, self.door_size = b_ - 15, (20, 46)
        self.tower = self.form in ('hall', 'tall') and self.W >= 128

    def headroom(self):
        return (62 if self.form in ('hall', 'tall') else self.HEAD) + self.roof_depth - 14

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall = s['wall']
        stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        t0 = self.floor(0)[0]
        tile = MALIBU[self.seed % 3]
        if self.floors > 1:
            for i in range(1, self.floors):
                t, b = self.floor(i)
                for k, (a, b_) in enumerate(self.units):
                    for j in range(2):
                        cx = a + (b_ - a) * (j * 2 + 1) // 4
                        sy = b - 20
                        c.rect(cx - 7, sy - 26, 14, 26, ROOM[6])
                        op.glass(c, cx - 5, sy - 24, 10, 22)
                        op.reveal(c, cx - 7, sy - 26, 14, 26, 2)
                        self.panes.append((cx - 5, sy - 24, 10, 22, 'warm', h2(cx, i, self.seed) < 0.5))
                        c.rect(cx - 9, sy, 18, 2, s['iron'][2])
                        for xx in range(cx - 9, cx + 9, 3):
                            c.rect(xx, sy - 6, 1, 6, s['iron'][2])
                        c.rect(cx - 9, sy - 7, 18, 1, s['iron'][1])
        # the pent roof of barrel tile along the front
        py = t0 - 2
        fm.pantiles(c, x0 - 3, py - 14, W + 6, 14, TERRACOTTA)
        c.rect(x0 - 3, py, W + 6, 2, TERRACOTTA[4])
        op.cast(c, x0, py + 2, W, 4, 0.55)
        for k, (a, b_) in enumerate(self.units):
            word, goods, bg, fg = MISSION_SHOPS[(k + self.seed + s.get('shift', 0)) % len(MISSION_SHOPS)]
            dx = b_ - 15
            wx, ww = a + 6, dx - 12 - a - 6
            ay = t0 + 10
            r = ww // 2
            for xx in range(wx, wx + ww):
                d = xx - (wx + r)
                lift = round(math.sqrt(max(0, r * r - d * d)) * 0.45)
                c.rect(xx, ay + 10 - lift, 1, base - 10 - ay - 10 + lift, ROOM[6])
            interior(c, wx + 2, ay + 12, ww - 4, base - ay - 22, goods, self.seed + k)
            reflect(c, wx + 2, ay + 12, ww - 4, base - ay - 22, GLASS, k)
            op.reveal(c, wx, ay + 6, ww, base - ay - 16, 2)
            self.panes.append((wx + 2, ay + 12, ww - 4, base - ay - 22, 'shop', True))
            for xx in range(wx, wx + ww, 4):
                for yy in range(base - 10, base):
                    c.p(xx + (yy % 2), yy, tile[1 + ((xx // 4 + yy // 4) % 2)])
            c.rect(wx, base - 10, ww, 1, WHITE[1])
            c.rect(dx - 10, base - 46, 20, 46, s['door'][3])
            c.rect(dx - 8, base - 44, 16, 42, s['door'][2])
            for yy in (base - 40, base - 24):
                c.rect(dx - 6, yy, 12, 12, s['door'][3])
            c.rect(dx + 5, base - 24, 2, 3, GOLD[1])
            self.sign(wx + 2, ay, ww - 4, 9, 'paint')
            if k % 2 == 0 and ww > 30:
                bx = dx + 12
                c.rect(bx, t0 + 8, 10, 1, s['iron'][2])
                board(self, bx - 2, t0 + 11, 14, 12, word[0], bg, fg, s['iron'])
            self.lamp(dx, base - 52)
        # parapet: a curved mission gable over the middle, and maybe a tower
        self.deck(None, TAR, wall, y=top - 2)
        mid = (x0 + x1) // 2
        gw = min(W - 20, 72)
        for dx in range(-gw // 2, gw // 2):
            t = dx / (gw / 2)
            rise = round(14 * (1 - t * t) ** 0.6) + (6 if abs(dx) < 5 else 0)
            c.rect(mid + dx, top - rise, 1, rise, wall[2])
            c.p(mid + dx, top - rise, wall[0])
        c.rect(x0 - 1, top - 2, W + 2, 2, wall[1])
        c.rect(mid - 3, top - 14, 6, 6, tile[2])
        c.rect(mid - 2, top - 13, 4, 4, tile[1])
        if self.tower:
            tx = x1 - 34
            c.rect(tx, top - 40, 26, 40, wall[2])
            c.rect(tx, top - 40, 1, 40, wall[1])
            c.rect(tx + 25, top - 40, 1, 40, wall[4])
            for ox in (tx + 5, tx + 15):
                c.rect(ox, top - 34, 6, 12, ROOM[6])
                c.rect(ox, top - 36, 6, 2, ROOM[5])
            hip_roof(c, tx - 3, tx + 29, top - 40, 16, TERRACOTTA)
        self.foot(CONCRETE)


# ------------------------------------------------------------------ the walk-up

WALKUP_SHOPS = [('DELI', 'counter', CRIMSON, WHITE), ('GROCERY', 'shelves', JADE, WHITE), ('LAUNDROMAT', 'racks', AZURE, WHITE),
                ('PIZZA', 'counter', RED, WHITE), ('LIQUORS', 'shelves', INK, YELLOW), ('SHOE REPAIR', 'racks', OXBLOOD, CREAM)]


def fire_escape(c, x, w, floors, r=INK):
    """Platforms at each floor, ladders zigzagging between them."""
    for i, (t, b) in enumerate(floors):
        y = b - 8
        c.rect(x, y, w, 3, r[2])
        c.rect(x, y, w, 1, r[1])
        c.rect(x, y - 10, w, 1, r[1])
        for xx in range(x, x + w, 3):
            c.rect(xx, y - 10, 1, 10, r[3])
        op.cast(c, x, y + 3, w, 2, 0.6)
        if i + 1 < len(floors):
            ny = floors[i + 1][1] - 8
            ax, bx = (x + 3, x + w - 6) if i % 2 else (x + w - 6, x + 3)
            for x_, y_ in line(ax, y, bx, ny + 3):
                c.rect(x_, y_, 3, 1, r[2])


class Walkup(Block):
    """The New York walk-up of 1890-1930 and its brownstone neighbour: brick
    with stone lintels and a pressed-metal cornice, fire escapes down the
    front, a shop at the foot and a wooden tank on the roof; or brownstone
    with a high stoop."""
    FLOORS = dict(row=4, tall=5, shop=3, cottage=3, hut=4, stall=1, hall=5, wide=4)
    H0, H1, PARA, HEAD = 56, 44, 18, 40

    def plan(self):
        self.brown = self.s.get('kind') == 'brownstone'
        self.bays = bays(self.x0, self.W, 26)
        mid = self.bays[len(self.bays) // 2]
        self.door_x = (mid[0] + mid[1]) // 2 if not self.brown else self.bays[0][0] + 16
        self.door_size = (20, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        brown = self.brown
        wall = BROWNSTONE if brown else s['wall']
        if brown:
            stucco(c, x0, top, W, base - top, wall, 2, self.seed)
            for yy in range(top + 6, base, 9):
                c.rect(x0, yy, W, 1, wall[3])
        else:
            fm.brick(c, x0, top, W, base - top, wall)
        stone = LIMESTONE if not brown else BROWNSTONE
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for k, (a, b_) in enumerate(self.bays):
                cx = (a + b_) // 2
                sash(self, cx, b - 8, 14, 28, s['sash'], stone)
        if not brown and self.floors > 2 and W >= 96:
            span = self.bays[1][0] - 4, self.bays[2][1] + 4 if len(self.bays) > 2 else self.bays[-1][1]
            fire_escape(c, span[0], span[1] - span[0], [self.floor(i) for i in range(1, self.floors)])
        # cornice
        c.rect(x0 - 3, top, W + 6, 8, s['cornice'][2])
        c.rect(x0 - 3, top, W + 6, 1, s['cornice'][0])
        c.rect(x0 - 3, top + 7, W + 6, 1, s['cornice'][4])
        for xx in range(x0, x1, 12):
            raised(c, xx, top + 8, 4, 7, s['cornice'], 2)
        op.cast(c, x0, top + 15, W, 3, 0.6)
        t0 = self.floor(0)[0]
        if brown:
            dx = self.door_x
            for j in range(6):
                c.rect(dx - 13 - j, base - 18 + j * 3, 26 + 2 * j, 3, wall[1 + (j % 2)])
                c.rect(dx - 13 - j, base - 18 + j * 3, 26 + 2 * j, 1, wall[0])
            c.rect(dx - 10, base - 62, 20, 44, WOOD[3])
            c.rect(dx - 8, base - 60, 7, 40, WOOD[2])
            c.rect(dx + 1, base - 60, 7, 40, WOOD[2])
            raised(c, dx - 14, base - 68, 28, 6, wall, 2)
            for side in (-1, 1):
                for x_, y_ in line(dx + side * 14, base - 24, dx + side * 20, base - 4):
                    c.rect(x_, y_ - 8, 1, 8, INK[2])
            self.lamp(dx - 16, base - 52)
            for k, (a, b_) in enumerate(self.bays[1:]):
                cx = (a + b_) // 2
                sash(self, cx, base - 22, 14, 26, s['sash'], stone)
        else:
            c.rect(x0, t0, W, 4, s['cornice'][2])
            c.rect(x0, t0, W, 1, s['cornice'][1])
            dx = self.door_x
            for k, (a, b_) in enumerate(self.bays):
                if a <= dx < b_:
                    c.rect(dx - 10, base - 44, 20, 44, s['cornice'][3])
                    op.glass(c, dx - 7, base - 41, 14, 18)
                    c.rect(dx + 4, base - 20, 2, 3, GOLD[1])
                    self.lamp(dx, base - 48)
            left = [(a, b_) for a, b_ in self.bays if b_ <= dx - 10]
            right = [(a, b_) for a, b_ in self.bays if a >= dx + 10]
            for k, run in enumerate((left, right)):
                if not run:
                    continue
                a, b_ = run[0][0], run[-1][1]
                if b_ - a < 24:
                    continue
                word, goods, bg, fg = WALKUP_SHOPS[(k + self.seed + s.get('shift', 0)) % len(WALKUP_SHOPS)]
                box_sign(self, a + 3, t0 + 5, b_ - a - 6, 13, word, bg, fg)
                shopfront(self, a + 3, t0 + 20, b_ - a - 6, base - t0 - 20, s['cornice'], s['cornice'], goods, transom=0)
                if k == 0:
                    awning(c, a + 3, t0 + 21, b_ - a - 6, bg, WHITE, depth=7)
        y0 = self.deck(None, TAR, s['cornice'], y=top, clear=[(x0 + W * 2 // 3 - 12, x0 + W * 2 // 3 + 12)])
        if W >= 96:
            pr.water_tank(c, x0 + W * 2 // 3, y0 + min(30, self.roof_depth - 8) - 4, R=9, H=15, legs=9, ground=TAR)
        vent(c, x0 + 12, top - 4)
        self.foot(CONCRETE)


# ------------------------------------------------------------------ the roadside

class GasStation(Block):
    """A filling station of the sixties to eighties: a canopy on two posts
    over the pumps, the office and service bays beside it, and the price
    on a pole sign."""
    FLOORS = dict(row=1, tall=1, shop=1, cottage=1, hut=1, stall=1, hall=1, wide=1)
    H0, PARA, HEAD = 52, 8, 64

    def margins(self):
        return 0, 0

    def plan(self):
        W = self.W
        self.canopy = (self.x0, self.x0 + max(64, W * 11 // 20))
        self.door_x, self.door_size = self.canopy[1] + 18, (20, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        brand, ink = s['brand'], s['ink']
        a, b_ = self.canopy
        # office and bays
        ox = b_ + 4
        cmu(c, ox, top, x1 - ox, base - top, WHITE, 1)
        c.rect(ox, top, x1 - ox, 6, brand[2])
        c.rect(ox, top, x1 - ox, 1, brand[1])
        glass_door(self, self.door_x, base, 20, 40, ALU)
        if x1 - ox > 70:
            for bx in range(self.door_x + 16, x1 - 30, 34):
                c.rect(bx, base - 40, 30, 40, ALU[2])
                for yy in range(base - 38, base, 4):
                    c.rect(bx + 1, yy, 28, 1, ALU[3])
                op.glass(c, bx + 3, base - 32, 24, 5)
        if ox + 2 < self.door_x - 16:
            shopfront(self, ox + 2, base - 38, self.door_x - 14 - ox - 2, 38, ALU, WHITE, 'shelves', transom=0)
        self.deck(None, GRAVEL, WHITE)
        # the canopy, seen from above, on its posts
        cy = base - 48
        for px0 in (a + 8, b_ - 12):
            c.rect(px0, cy, 4, 48, WHITE[2])
            c.rect(px0, cy, 1, 48, WHITE[1])
        for k, px0 in enumerate(range(a + 18, b_ - 16, 22)):
            c.rect(px0, base - 22, 10, 22, brand[2])
            c.rect(px0, base - 22, 10, 1, brand[1])
            c.rect(px0 + 2, base - 19, 6, 5, INK[4])
            text(c, px0 + 2, base - 18, str(k + 1), YELLOW[1])
            c.rect(px0 + 10, base - 16, 2, 10, INK[3])
            c.rect(px0 - 2, base - 3, 14, 3, CONCRETE[2])
        c.rect(a - 4, cy - 18, b_ - a + 8, 12, WHITE[1])
        c.rect(a - 4, cy - 18, b_ - a + 8, 1, WHITE[0])
        c.rect(a - 4, cy - 6, b_ - a + 8, 8, brand[2])
        c.rect(a - 4, cy - 6, b_ - a + 8, 1, brand[1])
        c.rect(a - 4, cy + 1, b_ - a + 8, 1, brand[4])
        name = s['name']
        for lx in range(a + 6, b_ - 4, 14):
            self.lamp(lx, cy + 3, 'shop')
        op.cast(c, a - 4, cy + 2, b_ - a + 8, 6, 0.55)
        # the pole sign with the price
        px0 = a + 2
        c.rect(px0 + 7, cy - 60, 3, 42, STEEL[3])
        raised(c, px0, cy - 74, 18, 16, brand, 2)
        c.rect(px0 + 2, cy - 72, 14, 12, WHITE[1])
        text(c, px0 + 3, cy - 69, name[:3], brand[3])
        raised(c, px0, cy - 58, 18, 10, INK, 2)
        price = str(s.get('price', 119))
        text(c, px0 + 2, cy - 56, price, YELLOW[1])
        self.signs.append((px0 + 1, cy - 73, 16, 24))
        self.foot(CONCRETE)


class DriveIn(Block):
    """A burger drive-in of 1950-1975: a glass stand under an angled roof,
    walk-up windows, a striped fascia and a neon arrow on a pole."""
    FLOORS = dict(row=1, tall=1, shop=1, cottage=1, hut=1, stall=1, hall=1, wide=1)
    H0, PARA, HEAD = 50, 14, 70

    def plan(self):
        self.door_x, self.door_size = self.x0 + self.W // 2, (20, 42)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        col, ink = s['colour'], s['ink']
        c.rect(x0, top + self.para, W, base - top - self.para, WHITE[2])
        for xx in range(x0 + 4, x1 - 20, 22):
            c.rect(xx, base - 40, 18, 28, ALU[3])
            interior(c, xx + 2, base - 38, 14, 24, 'counter', self.seed + xx)
            self.panes.append((xx + 2, base - 38, 14, 24, 'shop', True))
            c.rect(xx - 1, base - 12, 20, 3, ALU[1])
        for xx in range(x0, x1):
            u = ((xx - x0) // 6) % 2
            c.rect(xx, base - 9, 1, 9, col[2] if u else WHITE[1])
        self.deck(self.roof_depth - 8, GRAVEL, WHITE, y=top + 1)
        # the angled roof, its underside lit
        for i in range(self.para):
            c.rect(x0 - 6 + i // 2, top + i, W + 12 - i, 1, col[1 if i < 4 else 2])
        c.rect(x0 - 6, top, W + 12, 1, col[0])
        self.sign(x0 + 2, top + 1, W - 4, 13, 'paint', 'diner')
        self.lamp(x0 + W // 4, top + self.para + 2, 'shop')
        self.lamp(x0 + 3 * W // 4, top + self.para + 2, 'shop')
        # the pole and its arrow
        px0 = x1 - 8
        c.rect(px0, top - 50, 3, 50, STEEL[3])
        c.rect(px0, top - 50, 1, 50, STEEL[1])
        aw = 40
        ax = px0 - aw + 6
        ay = top - 64
        raised(c, ax, ay, aw, 14, col, 2)
        c.rect(ax + 2, ay + 2, aw - 4, 10, ink[3])
        pts = [(ax + 4 + d, ay + 7) for d in range(aw - 14)]
        tip = ax + aw - 8
        for d in range(5):
            pts += [(tip - d, ay + 7 - d), (tip - d, ay + 7 + d)]
        self.tube(pts, s.get('neon', 'red'), 'arrow', 'blink')
        self.bulb_row([(ax + 1, yy) for yy in range(ay + 1, ay + 13, 3)] +
                      [(ax + aw - 2, yy) for yy in range(ay + 1, ay + 13, 3)], 'bulbs')
        self.foot(CONCRETE)


class Market(Block):
    """A supermarket of 1955-1990: a long low box, glass along the front with
    the week's specials pasted on it, big letters on the fascia, the carts
    nested by the door."""
    FLOORS = dict(row=1, tall=1, shop=1, cottage=1, hut=1, stall=1, hall=1, wide=1)
    H0, PARA, HEAD = 60, 26, 22

    def plan(self):
        self.door_x, self.door_size = self.x0 + self.W // 3, (24, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        face, ink = s['face'], s['ink']
        cmu(c, x0, top, W, base - top, s['wall'], 2)
        c.rect(x0 - 2, top, W + 4, self.para, face[2])
        c.rect(x0 - 2, top, W + 4, 1, face[1])
        c.rect(x0 - 2, top + self.para - 1, W + 4, 1, face[4])
        self.sign(x0 + 6, top + 4, W - 12, self.para - 8, 'paint', 'grocery')
        op.cast(c, x0, top + self.para, W, 3, 0.6)
        gy = top + self.para + 6
        shopfront(self, x0 + 4, gy, W - 8, base - gy, ALU, s['wall'], 'shelves', transom=0, pitch=20)
        for k, px0 in enumerate(range(x0 + 10, x1 - 20, 30)):
            if abs(px0 - self.door_x) < 24:
                continue
            c.rect(px0, gy + 6, 19, 12, WHITE[1])
            c.rect(px0 + 1, gy + 7, 17, 4, [RED, face, YELLOW][k % 3][2])
            text(c, px0 + 2, gy + 12, ['SALE', 'BUY', 'DEAL'][k % 3], RED[3])
        c.rect(self.door_x - 13, gy, 26, base - gy, ROOM[6])
        glass_door(self, self.door_x, base, 24, base - gy - 4, ALU)
        cx = self.door_x + 18
        for j in range(4):
            for x_, y_ in ((cx + j * 3, base - 12), (cx + j * 3 + 9, base - 12)):
                c.p(x_, y_, STEEL[1])
            c.rect(cx + j * 3, base - 12, 1, 10, STEEL[2])
        c.rect(cx, base - 12, 20, 1, STEEL[1])
        c.rect(cx, base - 6, 20, 1, STEEL[2])
        self.deck(None, GRAVEL, s['wall'], y=top)
        unit(c, x0 + W // 4, top - 2, 22, 9, 6, DOVE, fan=True)
        unit(c, x0 + 3 * W // 4 - 22, top - 2, 22, 9, 6, DOVE, fan=True)
        self.foot(CONCRETE)


# ------------------------------------------------------------------ the looks

NEW = {
    'cairo': (Cairo, 'Cairo apartment house', [
        dict(wall=SAND, shutter=WOOD, rail=INK), dict(kind='frame', wall=SAND, shutter=SAGE, rail=INK, shift=2),
        dict(wall=PEACH, shutter=JADE, rail=INK, shift=4)]),
    'tonglau': (TongLau, 'Hong Kong tong lau', [
        dict(wall=CREAM, frame=JADE, grille=JADE, enclosed=0.3), dict(wall=MINT, frame=STEEL, grille=CRIMSON, enclosed=0.6, shift=2),
        dict(wall=PALEBLUE, frame=ALU, grille=INK, enclosed=0.0, shift=4)]),
    'highstreet': (HighStreet, 'British high street', [
        dict(wall=BRICK, sash=WHITE, pilaster=SAGE), dict(wall=BUFF, sash=CREAM, pilaster=OXBLOOD, arched=True, shift=3),
        dict(wall=BRICK, sash=CREAM, pilaster=INK, arched=True, shift=1)]),
    'precinct': (HighStreet, 'Shopping precinct', [dict(kind='precinct', frame=ALU, shift=5)]),
    'storey': (Storey, 'Lagos storey-building', [
        dict(wall=SAND, frame=JADE, breeze=CONCRETE, roof=RUST, tank=DOVE),
        dict(wall=MINT, frame=COBALT, breeze=WHITE, roof=TIN, tank=COBALT, bars=CRIMSON, shift=2),
        dict(wall=PEACH, frame=CRIMSON, breeze=SAND, roof=IRONROOF['red'], tank=DOVE, shift=5)]),
    'habana': (Habana, 'Havana portales', [
        dict(wall=SKY, shutter=JADE, trim=WHITE, under=PEACH), dict(wall=SALMON, shutter=COBALT, trim=WHITE, under=SAND, shift=2),
        dict(wall=LILAC, trim=WHITE, shutter=WOOD, deco=True, shift=4)]),
    'mission': (Mission, 'California mission revival', [
        dict(wall=WHITE, iron=INK, door=WOOD, ink=OXBLOOD), dict(wall=CREAM, iron=INK, door=JADE, ink=JADE, shift=2),
        dict(wall=PEACH, iron=INK, door=OXBLOOD, ink=COBALT, shift=4)]),
    'walkup': (Walkup, 'New York walk-up', [
        dict(wall=BRICK, sash=WHITE, cornice=SAGE), dict(wall=BUFF, sash=CREAM, cornice=OXBLOOD, shift=2),
        dict(kind='brownstone', sash=CREAM, cornice=CHOCOLATE)]),
    'gas': (GasStation, 'Gas station', [
        dict(brand=RED, ink=WHITE, name='REGAL', price=119), dict(brand=COBALT, ink=YELLOW, name='STAR', price=109),
        dict(brand=GREEN, ink=WHITE, name='ACE', price=124)]),
    'drivein': (DriveIn, 'Burger drive-in', [
        dict(colour=CRIMSON, ink=YELLOW, neon='red'), dict(colour=TURQ, ink=WHITE, word='TACOS', neon='pink'),
        dict(colour=SAFFRON, ink=CRIMSON, word='DOGS', neon='blue')]),
    'market': (Market, 'Supermarket', [
        dict(wall=CREAM, face=RED, ink=WHITE, word='FOODS', neon='red'), dict(wall=WHITE, face=JADE, ink=WHITE, word='MARKET', neon='green'),
        dict(wall=BUFF, face=COBALT, ink=YELLOW, word='SAVE', neon='blue')]),
}
ABOUT = {
    'cairo': ('modern-stucco', 'A concrete apartment house over shops, with balconies, shutters and a pigeon loft on the roof.'),
    'tonglau': ('modern-stucco', 'A shop-house over an arcade, with verandahs above and signboards hung down the front.'),
    'highstreet': ('bengal-brick', 'A row of shops with signwritten fascias, flats above and a slate roof.'),
    'precinct': ('concrete-frame', 'A shopping precinct of concrete panels, a canopy over the walk.'),
    'storey': ('modern-stucco', 'A storey-building: shops below, balconies behind breeze blocks, an iron roof.'),
    'habana': ('modern-stucco', 'A pastel building over an arcade, with tall shuttered doors and iron balconies.'),
    'mission': ('white-plaster', 'A white stucco shop building under red barrel tile, with arched windows.'),
    'walkup': ('bengal-brick', 'A walk-up apartment house with fire escapes, a cornice and a shop below.'),
    'gas': ('concrete-frame', 'A gas station: pumps under a canopy, an office and service bays.'),
    'drivein': ('white-plaster', 'A drive-in burger stand with walk-up windows and a neon arrow.'),
    'market': ('concrete-frame', 'A supermarket with its specials in the windows.'),
}
FORMS = dict(cairo='row shop wide tall cottage hall', tonglau='row shop tall cottage hut', highstreet='row shop wide tall hall', precinct='row shop wide tall hall',
             storey='row shop wide tall hall', habana='row shop wide tall hall', mission='row shop wide tall cottage hall',
             walkup='row shop tall hall', gas='row wide hall', drivein='row shop cottage', market='row wide hall')
fmod.LOOKS.update(NEW)
fmod.ABOUT.update(ABOUT)
fmod.FORMS.update(FORMS)
fmod.register()

SHOW = {'cairo': [('row', 12), ('tall', 10), ('shop', 7)], 'tonglau': [('row', 12), ('tall', 7), ('hut', 4)],
        'highstreet': [('row', 12), ('wide', 16), ('shop', 7)], 'storey': [('row', 12), ('tall', 10), ('shop', 7)],
        'habana': [('row', 12), ('tall', 10), ('shop', 7)], 'mission': [('row', 12), ('hall', 17), ('cottage', 6)],
        'walkup': [('row', 12), ('tall', 10), ('shop', 7)], 'gas': [('wide', 16), ('row', 12)],
        'drivein': [('row', 12), ('cottage', 6)], 'market': [('wide', 16), ('row', 12)]}


def sheets(out, only=None):
    from art import front_family as ff
    looks = [k for k in NEW if not only or k in only]
    bands = []
    for k in looks:
        cls, label, colours = NEW[k]
        cells = [(f'{form} {n * 16}px', fmod.build(k, 0, form, n, 3)) for form, n in SHOW[k]]
        cells += [(f'colour {v}', fmod.build(k, v, SHOW[k][0][0], SHOW[k][0][1], 5 + v)) for v in range(1, len(colours))]
        bands.append((f'{k} · {label}', cells))
    ff.ab(out, bands, masters=False, zoom=2)
    h = fmod.house
    rows = [('Cairo, 1975', [h('cairo', v % 3, f, n, 10 + v) for v, (f, n) in enumerate(
                [('row', 12), ('tall', 9), ('shop', 7), ('row', 10), ('tall', 11)])]),
            ('Hong Kong, 1965', [h('tonglau', v % 3, f, n, 20 + v) for v, (f, n) in enumerate(
                [('row', 9), ('tall', 7), ('row', 8), ('tall', 6), ('row', 9), ('shop', 6)])]),
            ('Leeds, 1975', [h('highstreet', 0, 'row', 12, 30), h('highstreet', 1, 'wide', 14, 31),
                             h('highstreet', 2, 'row', 12, 32), h('highstreet', 0, 'shop', 7, 33)]),
            ('Lagos, 1980', [h('storey', v % 3, f, n, 40 + v) for v, (f, n) in enumerate(
                [('row', 11), ('tall', 9), ('shop', 7), ('row', 10)])]),
            ('Havana, 1955', [h('habana', 0, 'row', 12, 50), h('habana', 2, 'tall', 10, 51), h('habana', 1, 'row', 10, 52),
                              h('habana', 0, 'shop', 7, 53)]),
            ('Santa Barbara, 1985', [h('mission', 0, 'hall', 17, 60), h('mission', 1, 'row', 10, 61),
                                     h('drivein', 0, 'row', 10, 62), h('mission', 2, 'row', 12, 63)]),
            ('Brooklyn, 1975', [h('walkup', 0, 'tall', 10, 70), h('walkup', 2, 'row', 9, 71), h('walkup', 2, 'row', 9, 72),
                                h('walkup', 1, 'row', 12, 73)]),
            ('The roadside, 1985', [h('gas', 0, 'wide', 16, 80), h('market', 1, 'wide', 16, 81), h('drivein', 2, 'row', 10, 82)])]
    ff.street(out.replace('.png', '-street.png'), rows, zoom=2)
    ff.street(out.replace('.png', '-street-night.png'), rows, zoom=2, night=True)


if __name__ == '__main__':
    sheets(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/modern/ab4.png', sys.argv[2:] or None)
