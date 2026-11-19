"""European city houses of 1700 to 1850, drawn front-on. A street frame is a
row of houses, each with its own width, storeys and colour, as the cities
were built: plot by plot.

    .venv/bin/python scripts/art/front_family.py euro out.png [paris london amsterdam]

Drawn as the casa family is: a calm wall of one value, few bays, and each
opening a deep object with a frame, a hood and a sill that throw shadows,
its glass dark so it reads as a hole in a bright wall. Houses are a storey
or two lower than the real ones so their parts stay big against the adult.

Paris before Haussmann: plaster over rubble on a stone plinth, painted timber
shopfronts under a low entresol, tall casements with iron guards and folded
persiennes, a slate mansard with plaster lucarnes. London: stock brick or
Regency stucco behind a parapet, sashes under gauged brick arches, a fanlit
door up three steps behind the area railings, bow-windowed shops, stacks
crowded with pots. Amsterdam: narrow brick canal houses under neck, bell,
step and cornice gables trimmed in sandstone, big white sashes, a hoist beam
at the top and a stoop at the door.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, h2, blob, mix  # noqa: E402
from art import front_openings as op  # noqa: E402
from art.front_modern import Block, interior, cast_right  # noqa: E402

SLATE = RAMPS['slate']
ZINC = RAMPS['zinc']
LEAD = ramp(250, 0.018, lift=-0.04)
IRON = op.IRON
WHITE = ramp(90, 0.012, lift=0.05)
POT = ramp(40, 0.11, lift=-0.04)
# A dark room behind old glass, with the sky's sheen on it.
PANE = ramp(262, 0.05, lift=-0.06)
fm.glazes(PANE)
CURTAIN = ramp(80, 0.03, lift=0.0)
# Paris plaster: lime and gypsum over rubble, cream, grey or buff.
PLATRE = ramp(84, 0.032, lift=0.035)
GRIS = ramp(88, 0.014, lift=0.0)
BUFF = ramp(72, 0.05, lift=0.01)
MOELLON = ramp(78, 0.03, lift=-0.08)
TUILE = ramp(36, 0.09, lift=-0.06)
PERSIENNE = [ramp(238, 0.022, lift=0.0), ramp(150, 0.045, lift=-0.06), ramp(85, 0.02, lift=0.02)]
# London: the yellow stock brick gone grey-brown with soot; red brick; stucco painted to look like Portland stone.
STOCK = ramp(76, 0.06, lift=-0.05)
RED = ramp(34, 0.1, lift=-0.05)
GAUGED = ramp(38, 0.1, lift=-0.04)
STUCCO = ramp(86, 0.028, lift=0.045)
PORTLAND = ramp(88, 0.02, lift=0.03)
# Amsterdam: hard-fired brick, sandstone trim, black glazed or red pantiles.
BAKSTEEN = [ramp(30, 0.085, lift=-0.11), ramp(36, 0.075, lift=-0.07), ramp(24, 0.07, lift=-0.16)]
ZANDSTEEN = ramp(82, 0.035, lift=0.03)
PAN = [ramp(262, 0.02, lift=-0.2), ramp(38, 0.11, lift=-0.06)]
SHOP = {'green': ramp(158, 0.07, lift=-0.2), 'black': ramp(270, 0.016, lift=-0.28),
        'blue': ramp(250, 0.07, lift=-0.16), 'oxblood': ramp(24, 0.1, lift=-0.2),
        'brown': ramp(46, 0.07, lift=-0.18), 'grey': ramp(220, 0.02, lift=-0.08),
        'red': ramp(28, 0.13, lift=-0.1)}


# ------------------------------------------------------------------ walls

def brickwork(c, x0, y0, w, h, r, q=3, seed=0):
    """Brick as one value: joints a step darker, the odd brick a step off."""
    def f(x, y):
        row, ly = y // 4, y % 4
        bx, lx = (x + (row % 2) * 4) // 8, (x + (row % 2) * 4) % 8
        if ly == 3 or lx == 7:
            return r[q + 1]
        k = h2(bx, row, seed + 41)
        return r[q - 1] if k < 0.03 else r[q + 1] if k > 0.96 else r[q]
    fm.fill(c, x0, y0, w, h, f)


def plaster(c, x, y, w, h, r, q=2, seed=0, under=MOELLON):
    """Plaster as one value, flaked here and there to the rubble behind,
    each flake's upper rim the lit edge of the coat."""
    c.rect(x, y, w, h, r[q])
    for k in range(int(w * h / 2400)):
        fx = x + 6 + int(h2(k, seed, 15) * max(1, w - 20))
        fy = y + 6 + int(h2(k, seed, 16) * max(1, h - 16))
        n = 4 + int(h2(k, seed, 17) * 5)
        for j, (off, ln) in enumerate(((1, n - 3), (0, n), (1, n - 2))):
            for i in range(max(1, ln)):
                c.p(fx + off + i, fy + j, under[4] if j == 0 or i == 0 else under[3])
            if j == 0:
                for i in range(max(1, ln)):
                    c.p(fx + off + i, fy - 1, r[max(0, q - 1)])


def plinth(c, x, y, w, h, r):
    """Dressed stone at the foot of the wall, its top lit, damp low down."""
    fm.ashlar(c, x, y, w, h, r, 6, 22)
    c.rect(x, y, w, 1, r[0])
    op.cast(c, x, y + 1, w, 1, 0.8)


def band(c, x, y, w, r, h=3):
    c.rect(x, y, w, 1, r[0])
    c.rect(x, y + 1, w, h - 1, r[2])
    c.rect(x, y + h - 1, w, 1, r[3])
    op.cast(c, x, y + h, w, 2, 0.7)


def cornice(c, x, y, w, r):
    """A cornice: its top seen from above, a lit cyma, modillions, and the
    shadow it throws three rows down the wall."""
    c.rect(x - 3, y - 3, w + 6, 1, r[0])
    c.rect(x - 3, y - 2, w + 6, 2, r[1])
    c.rect(x - 3, y, w + 6, 2, r[2])
    c.rect(x - 2, y + 2, w + 4, 1, r[4])
    for xx in range(x, x + w - 1, 5):
        c.rect(xx, y + 3, 3, 3, r[2])
        c.rect(xx, y + 3, 3, 1, r[1])
        c.rect(xx + 2, y + 4, 1, 2, r[4])
    c.rect(x, y + 6, w, 1, r[3])
    op.cast(c, x, y + 7, w, 4, 0.58)


# ------------------------------------------------------------------ roofs

def stack(b, cx, foot, w, h, r, pots, brick=False, smoke=True):
    """A party-wall stack: its face, a capping seen from above, its pots."""
    c = b.c
    x, top = cx - w // 2, foot - h
    if brick:
        brickwork(c, x, top, w, h, r, 3)
    else:
        c.rect(x, top, w, h, r[2])
    c.rect(x, top, 2, h, r[1])
    c.rect(x + w - 2, top, 2, h, r[4])
    c.rect(x - 1, top - 3, w + 2, 2, r[1])
    c.rect(x - 1, top - 3, w + 2, 1, r[0])
    c.rect(x - 1, top - 1, w + 2, 1, r[4])
    op.cast(c, x, top, w - 2, 2, 0.7)
    pitch = (w - 2) / pots
    for k in range(pots):
        px, ph = x + 1 + round(k * pitch + (pitch - 4) / 2), 5 + round(h2(cx, k, 71) * 4)
        py = top - 3 - ph
        c.rect(px, py, 4, ph, POT[3])
        c.rect(px, py, 1, ph, POT[2])
        c.rect(px + 3, py, 1, ph, POT[5])
        c.rect(px - 1, py, 6, 1, POT[1])
        c.rect(px, py + 1, 4, 1, POT[6])
    if smoke:
        b.smoke.append([x + 3, top - 12, 'chimney'])


def slates(c, L, R, y0, y1, r, course=5, cut=8):
    """A pitched roof from above: courses along the eave, lighter toward the
    eave, a dark lower lip on each course."""
    span = max(1, y1 - y0)
    for y in range(y0, y1):
        t = (y - y0) / span
        b = 4 if t < 0.3 else 3 if t < 0.75 else 2
        row, ly = (y - y0) // course, (y - y0) % course
        for x in range(L, R):
            lx = (x + (row % 2) * (cut // 2)) % cut
            k = h2((x + (row % 2) * (cut // 2)) // cut, row, 91)
            q = b + (1 if k > 0.88 else 0)
            col = r[min(7, q + 2)] if ly == course - 1 else r[q + 1] if lx == cut - 1 else r[q - 1] if ly == 0 else r[q]
            c.p(x, y, col)


def mansard(c, L, R, top, foot, r, z):
    """The steep lower slope of a mansard, nearly face on, in tall slates, a
    flare at its foot; the zinc roll at its break."""
    span = foot - top
    for y in range(top, foot):
        t = (y - top) / span
        b = 4 if t < 0.2 else 3 if t < 0.8 else 2
        ins = (foot - y) // 6
        flare = max(0, y - (foot - 4)) // 2
        row, ly = (y - top) // 6, (y - top) % 6
        for x in range(L + ins - flare, R - ins + flare):
            lx = (x + (row % 2) * 4) % 8
            k = h2((x + (row % 2) * 4) // 8, row, 93)
            q = b + (1 if k > 0.88 else 0)
            col = r[min(7, q + 2)] if ly == 5 else r[q + 1] if lx == 7 else r[q - 1] if ly == 0 else r[q]
            c.p(x, y, col)
    ins = span // 6
    c.rect(L + ins - 1, top - 2, R - L - 2 * ins + 2, 2, z[1])
    c.rect(L + ins - 1, top - 1, R - L - 2 * ins + 2, 1, z[4])


def tiles_back(c, L, R, front, depth, r, ridge, cover=None):
    """A roof whose ridge runs back from the street, from above: the left
    slope lit, the right in shade, a ridge cap. `front(x)` is where the roof
    meets the gable in front."""
    for x in range(L, R):
        f = front(x)
        left = x < ridge
        for y in range(f - depth, f + 1):
            base = 2 if left else 4
            if cover == 'lead':
                seam = abs(x - ridge) % 13
                col = r[base + 1] if seam == 0 else r[base - 1] if seam == 1 else r[base]
                if (f - y) % 25 == 24 and seam > 1:
                    col = mix(col, r[base + 1], .45)
            elif cover:
                course, lip = divmod(abs(x - ridge), 7)
                joint = (f - y + (course % 2) * 6) % 13
                col = r[base]
                if lip == 6: col = r[base + 1]
                elif lip == 0: col = mix(col, r[base - 1], .6)
                elif joint == 0: col = mix(col, r[base + 1], .65)
            else:
                u = (y - (f - depth)) % 4
                col = r[base + 2] if u == 3 else r[base + 1] if abs(x - ridge) % 6 == 0 else r[base]
            c.p(x, y, col)
    for y in range(front(ridge) - depth - 1, front(ridge) + 1):
        c.p(ridge - 1, y, r[1])
        c.rect(ridge, y, 2, 1, r[3])
        c.p(ridge + 2, y, r[5])


# ------------------------------------------------------------------ openings

def pane(c, x, y, w, h, seed=0, curtain=False):
    """Old glass over a dark room: shadow under the head, the sky's sheen in
    one diagonal, net curtains drawn to the sides in some."""
    g = PANE
    c.rect(x, y, w, h, g[6])
    c.rect(x, y, w, 3, g[7])
    for i in range(min(w, h) // 2):
        c.p(x + 2 + i, y + h - 4 - i, g[4])
        c.p(x + 3 + i, y + h - 4 - i, g[5])
    if curtain:
        for yy in range(y + 2, y + h):
            k = (yy - y) / h
            cw = 2 + round(2 * k)
            c.rect(x, yy, cw, 1, CURTAIN[2] if yy % 3 else CURTAIN[3])
            c.rect(x + w - cw, yy, cw, 1, CURTAIN[3] if yy % 3 else CURTAIN[4])


def sash_bars(c, x, y, w, h, f):
    """A sash's frame and glazing bars: six over six, the lower sash's meeting
    rail lit and in front."""
    c.rect(x, y, w, 2, f[2])
    c.rect(x, y, 2, h, f[1])
    c.rect(x + w - 2, y, 2, h, f[3])
    c.rect(x, y + h - 2, w, 2, f[2])
    mid = y + h // 2
    c.rect(x, mid - 1, w, 2, f[0])
    c.rect(x, mid + 1, w, 1, f[3])
    for k in (1, 2):
        c.rect(x + round(w * k / 3), y, 1, h, f[1])
    for yy in (y + (mid - y) // 2, mid + (y + h - mid) // 2):
        c.rect(x + 1, yy, w - 2, 1, f[1])


def casement_bars(c, x, y, w, h, f):
    """Two glazed leaves, three lights each, the meeting stile lit left."""
    c.rect(x, y, w, 2, f[2])
    c.rect(x, y, 2, h, f[1])
    c.rect(x + w - 2, y, 2, h, f[3])
    c.rect(x, y + h - 2, w, 2, f[2])
    m = x + w // 2
    c.rect(m - 1, y, 1, h, f[0])
    c.rect(m, y, 1, h, f[3])
    for k in (1, 2):
        c.rect(x + 1, y + round(h * k / 3), w - 2, 1, f[1])


def sill(c, x, y, w, r):
    """A stone sill: its top seen, its face, its shadow three rows deep."""
    c.rect(x, y, w, 1, r[0])
    c.rect(x, y + 1, w, 2, r[2])
    c.rect(x, y + 3, w, 1, r[4])
    op.cast(c, x + 1, y + 4, w - 2, 3, 0.64)


def hood(c, x, y, w, r):
    """A cornice over a window; y is the row it sits on."""
    c.rect(x - 1, y - 5, w + 2, 1, r[0])
    c.rect(x - 1, y - 4, w + 2, 2, r[1])
    c.rect(x, y - 2, w, 1, r[2])
    c.rect(x + 1, y - 1, w - 2, 1, r[4])
    op.cast(c, x + 1, y, w - 2, 3, 0.62)


def garde_corps(c, x, y, w, h):
    """A wrought-iron guard across the foot of a casement: rails, bars and a
    ring at the middle; its shadow on the glass."""
    i = IRON
    for xx in range(x, x + w):
        if (xx - x) % 3 == 0:
            c.rect(xx, y + 1, 1, h - 2, i[3])
    c.rect(x - 1, y, w + 2, 1, i[1])
    c.rect(x - 1, y + 1, w + 2, 1, i[4])
    c.rect(x, y + h - 1, w, 1, i[3])
    m, my = x + w // 2, y + h // 2
    for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, -1), (-1, 1), (1, 1)):
        c.p(m + dx, my + dy, i[2])


def persiennes(c, x, y, w, h, p, closed=False):
    """Louvred shutters, folded open against the wall either side or shut
    across the window: each louvre lit on its top edge."""
    def leaf(lx, lw, lit):
        c.rect(lx, y, lw, h, p[3])
        for yy in range(y + 3, y + h - 3, 3):
            c.rect(lx + 1, yy, lw - 2, 1, p[1] if lit else p[2])
            c.rect(lx + 1, yy + 1, lw - 2, 1, p[2] if lit else p[3])
            c.rect(lx + 1, yy + 2, lw - 2, 1, p[5])
        c.rect(lx, y, lw, 2, p[2])
        c.rect(lx, y, 1, h, p[1])
        c.rect(lx + lw - 1, y, 1, h, p[5])
        c.rect(lx, y + h - 2, lw, 2, p[4])
    if closed:
        leaf(x, w // 2, True)
        leaf(x + w // 2, w - w // 2, False)
        return
    leaf(x - 10, 8, True)
    leaf(x + w + 2, 8, False)
    cast_right(c, x + w + 10, y + 1, h - 1, 2, 0.7)


def fanlight(c, cx, y, R, frame, bars):
    """A half-round light over a door, its bars fanning out from a hub."""
    for yy in range(y - R, y):
        for xx in range(cx - R, cx + R):
            dx, dy = xx - cx + 0.5, y - yy
            d = math.hypot(dx, dy)
            if d > R:
                continue
            if d > R - 1.5:
                col = frame[1]
            elif d < 2.5:
                col = bars[2]
            else:
                a = math.degrees(math.atan2(dy, dx))
                col = bars[1] if min(a % 30, 30 - a % 30) < 30 / d * 0.9 else PANE[6 if dy > R * 0.4 else 5]
            c.p(xx, yy, col)


def panel_door(c, x, y, w, h, p):
    """A door of six fielded panels, each lit top-left, a brass knob."""
    c.rect(x, y, w, h, p[3])
    c.rect(x, y, 1, h, p[2])
    pw, ph = (w - 6) // 2, (h - 10) // 3
    for i in range(2):
        for j in range(3):
            px, py = x + 2 + i * (pw + 2), y + 2 + j * (ph + 2)
            c.rect(px, py, pw, ph, p[5])
            c.rect(px + 1, py + 1, pw - 2, ph - 2, p[2])
            c.rect(px + 1, py + 1, pw - 2, 1, p[1])
            c.rect(px + 1, py + 1, 1, ph - 2, p[1])
    c.rect(x + w - 5, y + h // 2, 2, 2, (232, 190, 96, 255))
    op.reveal(c, x, y, w, h, 3)


def steps(c, cx, base, w, n, r):
    for k in range(n):
        tw = w + 4 * (n - 1 - k)
        y = base - 2 * (k + 1)
        c.rect(cx - tw // 2, y, tw, 2, r[3])
        c.rect(cx - tw // 2, y, tw, 1, r[1])


def railings(c, L, R, base, h=16):
    """Area railings on a stone kerb: bars with spear heads, two rails, each
    bar's shadow on the wall behind."""
    i = IRON
    c.rect(L, base - 4, R - L, 4, PORTLAND[3])
    c.rect(L, base - 4, R - L, 1, PORTLAND[1])
    for x in range(L + 1, R - 1, 3):
        cast_right(c, x + 1, base - h + 1, h - 5, 1, 0.74)
        c.rect(x, base - h, 1, h - 4, i[3])
        c.p(x, base - h - 1, i[2])
        c.p(x, base - h - 2, i[1])
    for y in (base - h + 3, base - 8):
        c.rect(L, y, R - L, 1, i[2])
        c.rect(L, y + 1, R - L, 1, i[4])


def glazing(c, x, y, w, h, bars, cols, rows, goods, seed):
    """Shop glass in small panes over the shop inside."""
    interior(c, x, y, w, h, goods, seed)
    for k in range(1, cols):
        c.rect(x + round(w * k / cols), y, 1, h, bars[1])
    for k in range(1, rows):
        c.rect(x, y + round(h * k / rows), w, 1, bars[1])
    op.reveal(c, x, y, w, h, 3)


def shop_door(c, x, y, w, h, p):
    """A half-glazed shop door under a transom light."""
    op.raised(c, x - 2, y - 8, w + 4, h + 8, p, 2)
    pane(c, x, y - 6, w, 5)
    c.rect(x, y, w, h, p[3])
    pane(c, x + 3, y + 3, w - 6, h // 2 - 2)
    c.rect(x + 3, y + h // 2 + 5, w - 6, h // 2 - 8, p[2])
    c.rect(x + 3, y + h // 2 + 5, w - 6, 1, p[1])
    c.rect(x + w - 5, y + h // 2 + 1, 2, 2, (232, 190, 96, 255))
    op.reveal(c, x, y, w, h, 3)


def shop_glass(b, a, b_, gy, sill_y, base, p, bars, cols, rows):
    """A run of shop glass on its panelled stallriser."""
    c = b.c
    c.rect(a - 1, gy - 1, b_ - a + 2, sill_y - gy + 2, p[2])
    glazing(c, a, gy, b_ - a, sill_y - gy, bars, cols, rows, ('shelves', 'racks')[(b.seed + a) % 2], b.seed + a)
    b.panes.append((a, gy, b_ - a, sill_y - gy, 'warm', True))
    c.rect(a - 1, sill_y, b_ - a + 2, 2, p[1])
    c.rect(a - 1, sill_y, b_ - a + 2, 1, p[0])
    op.raised(c, a - 1, sill_y + 2, b_ - a + 2, base - sill_y - 2, p, 2)
    c.rect(a + 2, sill_y + 5, b_ - a - 4, base - sill_y - 8, p[4])
    c.rect(a + 3, sill_y + 6, b_ - a - 6, base - sill_y - 10, p[3])


def fascia(b, L, R, top, p, h=13):
    """A shop's fascia under its cornice: the game letters the board."""
    c = b.c
    c.rect(L - 2, top - 4, R - L + 4, 1, p[0])
    c.rect(L - 2, top - 3, R - L + 4, 2, p[1])
    c.rect(L - 1, top - 1, R - L + 2, 1, p[4])
    c.rect(L, top, R - L, h, p[3])
    c.rect(L, top, R - L, 1, p[5])
    c.rect(L, top + h - 1, R - L, 1, p[5])
    b.sign(L + 3, top + 2, R - L - 6, h - 4, 'board')


# ------------------------------------------------------------------ the row

class Row(Block):
    """A row of houses that fills one street frame. Each look plans its units
    (x, w, storey heights, bays, door) before any paint, so the door the game
    walks through is known from __init__."""
    HEAD = 60

    def __init__(self, s, form='row', cells=12, seed=0):
        self.s, self.form, self.seed = s, form or 'row', seed
        self.W = cells * 16
        self.x0, self.x1 = 16, 16 + self.W
        self.panes, self.signs, self.neon, self.bulbs, self.lamps = [], [], {}, {}, []
        self.overlays, self.smoke, self.shop_signs = [], [], []
        self.units = self.plan_units()
        self.base = self.headroom() + max(sum(u['hs']) for u in self.units)
        for u in self.units:
            u['top'] = self.base - sum(u['hs'])
        self.top = min(u['top'] for u in self.units)
        self.floors = max(len(u['hs']) for u in self.units)
        self.c = C(self.x1 + 16, self.base + 10)
        mid = self.x0 + self.W / 2
        main = min(self.units, key=lambda u: abs(u['door_x'] - mid))
        self.door_x, self.door_size = main['door_x'], (22, 46)

    def headroom(self):
        return self.HEAD

    def split(self, pref, lo):
        """Plot widths: as many as `pref` allows, none under `lo`."""
        n = max(1, round(self.W / pref))
        while n > 1 and self.W / n < lo:
            n -= 1
        cuts = [0] + [round(self.W * k / n + (h2(self.seed, k, 3) - 0.5) * 8) for k in range(1, n)] + [self.W]
        return [(self.x0 + a, b - a) for a, b in zip(cuts, cuts[1:])]

    @staticmethod
    def bays(x, w, pitch):
        n = max(1, round(w / pitch))
        return [x + round(w * (i + 0.5) / n) for i in range(n)]

    def colours(self, k):
        """Neighbours differ: the first plot takes the variant's colours, the
        others shift through the look's pool."""
        s = dict(self.s)
        if k:
            for key, pool in s.get('pool', {}).items():
                s[key] = pool[int(h2(self.seed, k, 17 + len(key)) * len(pool))]
        return s

    def floors_of(self, u):
        """(top, bottom) of each storey, the ground first."""
        out, y = [], self.base
        for h in u['hs']:
            out.append((y - h, y))
            y -= h
        return out

    def paint(self):
        for k, u in enumerate(self.units):
            self.paint_unit(u, self.colours(k))
        self.party_stacks()
        self.foot(self.s.get('foot', PORTLAND))

    def party_stacks(self):
        pass


# ------------------------------------------------------------------ Paris

class Paris(Row):
    """A Paris street before Haussmann: plaster houses on a stone plinth, a
    shop and its low entresol at the foot of each, a slate mansard on top."""
    HEAD = 80

    def plan_units(self):
        small = self.form in ('cottage', 'hut', 'stall')
        etages = dict(row=2, tall=3, wide=2, hall=2, shop=2, cottage=1, hut=1, stall=0).get(self.form, 2)
        out = []
        for k, (x, w) in enumerate(self.split(150 if self.W > 200 else 400, 110)):
            n = etages + (1 if self.form in ('row', 'hall') and len(self.split(150, 110)) > 1 and k % 2 else 0)
            hs = [60] + ([] if small else [32]) + [54, 50, 46][:n]
            cols = self.bays(x, w, 46) if self.form != 'stall' else [x + w // 2]
            grand = self.form == 'hall' and len(cols) % 2 == 1
            d = len(cols) // 2 if grand else (0 if (k + self.seed) % 2 else len(cols) - 1)
            out.append(dict(x=x, w=w, hs=hs, cols=cols, d=d, grand=grand, door_x=cols[d], entresol=not small))
        return out

    def paint_unit(self, u, s):
        c, base = self.c, self.base
        x, w, top, cols, wall = u['x'], u['w'], u['top'], u['cols'], s['wall']
        fl = self.floors_of(u)
        if self.form == 'stall':
            slates(c, x - 3, x + w + 3, top - 16, top, SLATE, 4, 7)
            c.rect(x - 3, top, w + 6, 2, ZINC[3])
            op.cast(c, x, top + 2, w, 4, 0.6)
        elif s['roof'] == 'tile':
            slates(c, x - 2, x + w + 2, top - 44, top - 2, s['tile'], 4, 6)
            c.rect(x - 2, top - 46, w + 4, 2, s['tile'][1])
            c.rect(x - 2, top - 45, w + 4, 1, s['tile'][3])
        else:
            mansard(c, x - 1, x + w + 1, top - 36, top - 2, SLATE, ZINC)
            fm.zinc(c, x + 5, top - 50, w - 10, 12, ZINC)
            c.rect(x + 5, top - 50, w - 10, 1, ZINC[0])
        plaster(c, x, top, w, base - top, wall, 2, self.seed + x)
        plinth(c, x, base - 10, w, 10, GRIS if wall is not GRIS else MOELLON)
        for t, b_ in fl[2 if u['entresol'] else 1:]:
            band(c, x, b_ - 3, w, wall, 4)
        if u['entresol']:
            band(c, x, fl[1][0] + 2, w, wall, 3)
        if self.form != 'stall':
            cornice(c, x, top, w, wall)
            for i, cx in enumerate(cols):
                if len(cols) > 3 and i % 2 and not u['grand']:
                    continue
                self.lucarne(cx, top - 4, wall)
        for f, (t, b_) in enumerate(fl[1:], 1):
            if u['entresol'] and f == 1:
                for cx in cols:
                    self.window(cx, b_ - 6, 18, 18, wall, guard=False, shut=None)
                continue
            first = f == (2 if u['entresol'] else 1)
            for cx in cols:
                self.window(cx, b_ - 7, 20, b_ - t - 18, wall, True, s['shutter'], hooded=first)
            if first and len(cols) >= 3 and (u['grand'] or h2(self.seed, x, 4) < 0.5):
                self.balcony(cols[1] - 16, cols[-2] + 16, b_ - 7, wall)
        self.ground(u, s)

    def window(self, cx, sill_y, w, h, wall, guard=True, shut=None, hooded=False):
        """A French window in a plaster architrave, its sill and, on the first
        floor, a cornice over it; an iron guard; persiennes either side."""
        c = self.c
        x, y = cx - w // 2, sill_y - h
        op.raised(c, x - 3, y - 3, w + 6, h + 3, wall, 1)
        cast_right(c, x + w + 3, y - 2, h + 2, 2, 0.74)
        closed = shut is not None and h2(cx, sill_y, self.seed) < 0.2
        if shut is not None:
            persiennes(c, x, y, w, h, shut, closed)
        if not closed:
            pane(c, x, y, w, h, cx + sill_y, h2(cx, sill_y, self.seed + 7) < 0.3)
            casement_bars(c, x, y, w, h, WHITE)
            op.reveal(c, x, y, w, h, 2)
            self.panes.append((x + 2, y + 2, w - 4, h - 4, 'warm', h2(cx, sill_y, self.seed + 3) < 0.45))
            if guard:
                garde_corps(c, x, sill_y - 11, w, 10)
        if hooded:
            hood(c, x - 4, y - 3, w + 8, wall)
        sill(c, x - 4, sill_y, w + 8, wall)

    def lucarne(self, cx, foot, wall):
        """A plaster dormer with a round-headed casement and a curved hood."""
        c = self.c
        w, h = 22, 32
        x, y = cx - w // 2, foot - h
        c.rect(x - 2, y - 3, w + 4, 4, SLATE[3])
        c.rect(x - 2, y - 3, w + 4, 1, SLATE[1])
        op.raised(c, x, y, w, h, wall, 1)
        for i in range(w + 4):
            lift = round(5 * math.sin(math.pi * i / (w + 3)))
            c.rect(x - 2 + i, y - lift, 1, lift + 3, wall[0] if i < (w + 4) // 2 else wall[2])
            c.p(x - 2 + i, y - lift - 1, ZINC[2])
        op.cast(c, x, y + 3, w, 2, 0.7)
        self.window(cx, foot - 5, 12, 18, wall, guard=False)
        op.cast(c, x - 1, foot, w + 2, 2, 0.66)

    def balcony(self, L, R, fy, wall):
        """A stone balcony on consoles across the middle bays, iron above."""
        c = self.c
        c.rect(L, fy - 1, R - L, 3, wall[1])
        c.rect(L, fy - 1, R - L, 1, wall[0])
        c.rect(L, fy + 2, R - L, 2, wall[3])
        for kx in range(L + 3, R - 4, 14):
            op.raised(c, kx, fy + 4, 4, 6, wall, 1)
        op.cast(c, L + 1, fy + 4, R - L - 2, 4, 0.62)
        garde_corps(c, L + 1, fy - 12, R - L - 2, 11)

    def ground(self, u, s):
        """A shopfront of painted timber across the bays, the house door in
        its own bay: a carriage arch on a grand house."""
        c, base = self.c, self.base
        x, w, cols, d = u['x'], u['w'], u['cols'], u['d']
        pitch = w / len(cols)
        gt = base - u['hs'][0]
        if self.form == 'stall':
            self.devanture(x + 3, x + w - 3, gt + 6, s, door=True)
            return
        dx = cols[d]
        if u['grand']:
            op.door_carriage(c, dx - 13, base - 52, 26, 52, 'green', s['wall'])
        else:
            op.raised(c, dx - 14, base - 54, 28, 54, s['wall'], 1)
            cast_right(c, dx + 14, base - 53, 53, 2, 0.74)
            panel_door(c, dx - 10, base - 44, 20, 44, SHOP[s['shop']])
            c.rect(dx - 10, base - 51, 20, 7, IRON[5])
            for xx in range(dx - 9, dx + 10, 3):
                c.rect(xx, base - 51, 1, 7, IRON[2])
                c.p(xx + 1, base - 48, IRON[2])
            op.reveal(c, dx - 10, base - 51, 20, 51, 2)
        for a, b_ in ((0, d - 1), (d + 1, len(cols) - 1)):
            if a > b_:
                continue
            L = round(cols[a] - pitch / 2) + (3 if a == 0 else 5)
            R = round(cols[b_] + pitch / 2) - (3 if b_ == len(cols) - 1 else 5)
            if R - L >= 26:
                self.devanture(L, R, gt + 6, s, door=R - L >= 60)

    def devanture(self, L, R, top, s, door=False):
        """A timber shopfront applied to the wall: cornice, fascia, pilasters,
        glass in a few big lights, a panelled stallriser."""
        c, base, p = self.c, self.base, SHOP[s['shop']]
        fascia(self, L, R, top, p)
        op.cast(c, L, top + 13, R - L, 3, 0.62)
        for px in (L, R - 5):
            op.raised(c, px, top + 13, 5, base - top - 13, p, 2)
            c.rect(px - 1, top + 13, 7, 2, p[1])
        gx0, gx1, gy, sl = L + 5, R - 5, top + 16, base - 14
        parts = [(gx0, gx1)]
        if door:
            dw = 18
            dx = gx1 - dw - 1 if (self.seed + L) % 2 else gx0 + 1
            shop_door(c, dx, gy + 8, dw, base - gy - 8, p)
            parts = [(gx0, dx - 3), (dx + dw + 3, gx1)]
        for a, b_ in parts:
            if b_ - a >= 10:
                shop_glass(self, a, b_, gy, sl, base, p, p, max(1, round((b_ - a) / 16)), 1)

    def party_stacks(self):
        if self.form == 'stall':
            return
        for k, u in enumerate(self.units):
            ends = (u['x'] + 12, u['x'] + u['w'] - 12) if k == len(self.units) - 1 else (u['x'] + 12,)
            for cx in ends:
                stack(self, cx, u['top'] - 40, 16, 18, self.s['wall'], 3, smoke=cx == ends[0])


# ------------------------------------------------------------------ London

class London(Row):
    """A London terrace: houses two or three windows wide, a parapet hiding
    the slates, stacks on the party walls, an area railed off in front."""
    HEAD = 60

    def plan_units(self):
        upper = dict(row=2, tall=3, wide=2, hall=2, shop=2, cottage=1, hut=1, stall=0).get(self.form, 2)
        hs = [58] + {0: [], 1: [50], 2: [56, 48], 3: [56, 50, 42]}[upper]
        out = []
        for k, (x, w) in enumerate(self.split(96, 64)):
            cols = self.bays(x, w, 44) if self.form != 'stall' else [x + w // 2]
            d = 0 if k % 2 == 0 else len(cols) - 1
            out.append(dict(x=x, w=w, hs=list(hs) if self.form != 'stall' else [58], cols=cols, d=d,
                            door_x=cols[d], shop=self.form in ('shop', 'stall') or
                            (self.form in ('row', 'hall') and h2(self.seed, k, 9) < 0.34)))
        return out

    def paint_unit(self, u, s):
        c, base = self.c, self.base
        x, w, top, cols = u['x'], u['w'], u['top'], u['cols']
        stucco = s['wall'] is STUCCO
        wall = s['wall']
        fl = self.floors_of(u)
        gt = fl[0][0]
        if self.form == 'stall':
            slates(c, x - 3, x + w + 3, top - 16, top, SLATE, 4, 7)
            c.rect(x - 3, top, w + 6, 2, LEAD[3])
            op.cast(c, x, top + 2, w, 4, 0.6)
        else:
            rt, rb = top - 28, top - 10
            mid = x + w // 2
            for yy in range(rt, rb):
                for xx in range(x + 1, x + w - 1):
                    left = xx < mid
                    q = 4 if left else 2
                    col = SLATE[q + 2] if (yy - rt + (xx - x) // 8) % 5 == 4 else SLATE[q - 1] if (xx - x) % 8 == 0 else SLATE[q]
                    c.p(xx, yy, col)
            c.rect(mid - 1, rt, 2, rb - rt, LEAD[4])
            c.p(mid - 1, rt, LEAD[2])
        if stucco:
            plaster(c, x, top, w, base - top, wall, 1, self.seed + x, PORTLAND)
            for yy in range(top + 12, gt, 12):
                c.rect(x, yy, w, 1, wall[2])
        else:
            brickwork(c, x, top, w, base - top, wall, 3, self.seed)
        if (stucco or s.get('stucco_ground')) and self.form != 'stall':
            c.rect(x, gt, w, base - gt, STUCCO[1])
            for yy in range(gt + 7, base - 2, 7):
                c.rect(x, yy, w, 1, STUCCO[3])
                c.rect(x, yy + 1, w, 1, STUCCO[0])
        if self.form != 'stall':
            if stucco:
                c.rect(x, top - 9, w, 9, wall[1])
            else:
                brickwork(c, x, top - 9, w, 9, wall, 3, self.seed)
            c.rect(x - 1, top - 12, w + 2, 1, PORTLAND[0])
            c.rect(x - 1, top - 11, w + 2, 2, PORTLAND[1])
            c.rect(x - 1, top - 9, w + 2, 1, PORTLAND[4])
            op.cast(c, x, top - 8, w, 2, 0.7)
            if stucco:
                cornice(c, x, top, w, PORTLAND)
            else:
                band(c, x, top, w, PORTLAND, 4)
            band(c, x, gt - 4, w, PORTLAND, 4)
        for f, (t, b_) in enumerate(fl[1:], 1):
            first = f == 1
            attic = f == len(fl) - 1 and len(fl) > 3
            wh = b_ - t - (8 if first else 20 if attic else 16)
            for cx in cols:
                self.window(cx, b_ - (6 if first else 8), 20, wh, wall, stucco, hooded=first and stucco)
                if first and not stucco and s.get('balconette'):
                    self.balconette(cx - 13, b_ - 6, 26)
            if first and stucco:
                if s.get('canopy'):
                    self.veranda(x + 3, x + w - 3, b_ - 6, t, s)
                else:
                    self.balconette(x + 2, b_ - 6, w - 4)
        self.ground(u, s, gt)

    def window(self, cx, sill_y, w, h, wall, stucco, hooded=False):
        """A sash set back in the wall: a gauged brick arch over it in brick,
        a moulded architrave in stucco; a stone sill under."""
        c = self.c
        x, y = cx - w // 2, sill_y - h
        if stucco:
            op.raised(c, x - 3, y - 3, w + 6, h + 3, wall, 0)
            cast_right(c, x + w + 3, y - 2, h + 2, 2, 0.74)
        else:
            for yy in range(y - 7, y):
                splay = (y - yy) // 2
                for xx in range(x - 1 - splay, x + w + 1 + splay):
                    t = (xx - cx + 0.5) / (w / 2)
                    joint = (xx - x + round(t * (y - yy) * 0.6)) % 4 == 0
                    c.p(xx, yy, GAUGED[4] if joint or yy == y - 1 else GAUGED[3])
            op.raised(c, cx - 2, y - 8, 5, 8, PORTLAND, 1)
        pane(c, x, y, w, h, cx, h2(cx, sill_y, self.seed + 7) < 0.3)
        sash_bars(c, x, y, w, h, WHITE)
        op.reveal(c, x, y, w, h, 3)
        self.panes.append((x + 2, y + 2, w - 4, h - 4, 'warm', h2(cx, sill_y, self.seed + 5) < 0.45))
        if hooded:
            hood(c, x - 4, y - 3, w + 8, wall)
        sill(c, x - 3, sill_y, w + 6, PORTLAND)

    def balconette(self, x, fy, w):
        c, i = self.c, IRON
        c.rect(x, fy, w, 1, PORTLAND[0])
        c.rect(x, fy + 1, w, 2, PORTLAND[2])
        op.cast(c, x + 1, fy + 3, w - 2, 3, 0.66)
        for xx in range(x + 1, x + w - 1, 3):
            c.rect(xx, fy - 9, 1, 9, i[3])
        c.rect(x, fy - 10, w, 1, i[1])
        c.rect(x, fy - 9, w, 1, i[4])
        for xx in range(x + 4, x + w - 3, 6):
            c.p(xx, fy - 6, i[1]); c.p(xx - 1, fy - 5, i[2]); c.p(xx + 1, fy - 5, i[2]); c.p(xx, fy - 4, i[1])

    def veranda(self, L, R, fy, top, s):
        """A Regency balcony under a tented canopy of painted lead."""
        c, p = self.c, SHOP[s.get('canopy', 'green')]
        self.balconette(L, fy, R - L)
        y0 = top + 2
        for k in range(10):
            sp = k // 3
            for xx in range(L - sp, R + sp):
                c.p(xx, y0 + k, p[1] if (xx - L) % 6 < 3 else p[2])
        c.rect(L - 3, y0 + 10, R - L + 6, 2, p[3])
        for xx in range(L - 3, R + 3, 3):
            c.p(xx, y0 + 12, p[4])
        op.cast(c, L, y0 + 12, R - L, 5, 0.58)
        for px in (L + 1, R - 2):
            c.rect(px, y0 + 12, 1, fy - y0 - 12, IRON[2])

    def ground(self, u, s, gt):
        c, base = self.c, self.base
        x, w, cols, d = u['x'], u['w'], u['cols'], u['d']
        if u['shop']:
            self.shopfront(x + 3, x + w - 3, gt + 7, s, u)
            return
        dx = cols[d]
        p = SHOP[s['door']]
        rise, dh, R = 6, 38, 11
        dy = base - rise - dh
        if s['wall'] is STUCCO or s.get('stucco_ground'):
            for px in (dx - 17, dx + 12):
                op.raised(c, px, dy - R - 2, 5, dh + R + 2, PORTLAND, 1)
            c.rect(dx - 19, dy - R - 7, 38, 1, PORTLAND[0])
            c.rect(dx - 19, dy - R - 6, 38, 3, PORTLAND[1])
            c.rect(dx - 18, dy - R - 3, 36, 1, PORTLAND[4])
            op.cast(c, dx - 16, dy - R - 2, 32, 3, 0.62)
            c.rect(dx - R - 1, dy - R - 1, 2 * R + 2, R + 1, PORTLAND[2])
            fanlight(c, dx, dy, R, PORTLAND, WHITE)
        else:
            for yy in range(dy - R - 7, dy):
                for xx in range(dx - R - 7, dx + R + 7):
                    dd = math.hypot(xx - dx + 0.5, dy - yy)
                    if R <= dd < R + 6:
                        a = math.degrees(math.atan2(dy - yy, xx - dx + 0.5))
                        c.p(xx, yy, GAUGED[4] if a % 15 < 2.4 else GAUGED[1] if dd >= R + 5 else GAUGED[2])
            op.raised(c, dx - 2, dy - R - 7, 5, 8, PORTLAND, 1)
            fanlight(c, dx, dy, R, WHITE, WHITE)
        panel_door(c, dx - 10, dy, 21, dh, p)
        self.panes.append((dx - 8, dy - R + 2, 16, R - 2, 'warm', True))
        steps(c, dx, base, 24, 3, PORTLAND)
        L, R_ = x + 1, x + w - 1
        if dx - 18 > L + 4:
            railings(c, L, dx - 16, base)
        if R_ > dx + 20:
            railings(c, dx + 16, R_, base)
        lx = dx + 18 if d == 0 else dx - 21
        c.rect(lx, dy - 10, 4, 7, (238, 214, 150, 255))
        c.rect(lx, dy - 10, 1, 7, (255, 238, 190, 255))
        c.rect(lx - 1, dy - 11, 6, 1, IRON[1])
        c.rect(lx, dy - 3, 4, 1, IRON[2])
        c.rect(lx + 1, dy - 2, 2, base - rise - dy + 2, IRON[3])
        self.lamp(lx + 1, dy - 7)
        for i, cx in enumerate(cols):
            if i != d:
                self.window(cx, base - 14, 20, 32, s['wall'] if s['wall'] is STUCCO else STUCCO,
                            s['wall'] is STUCCO or bool(s.get('stucco_ground')))

    def shopfront(self, L, R, top, s, u):
        """A Georgian shopfront: fascia and cornice on pilasters, a bow window
        of small panes, a door with a light over it."""
        c, base, p = self.c, self.base, SHOP[s['shop']]
        fascia(self, L, R, top, p)
        op.cast(c, L, top + 13, R - L, 3, 0.62)
        for px in (L, R - 5):
            op.raised(c, px, top + 13, 5, base - top - 13, p, 2)
            c.rect(px - 1, top + 13, 7, 2, p[1])
        dw = 18
        dx = R - 5 - dw - 2 if u['d'] else L + 7
        shop_door(c, dx, top + 24, dw, base - top - 24, p)
        a, b_ = (L + 7, dx - 5) if u['d'] else (dx + dw + 5, R - 7)
        if b_ - a < 14:
            return
        gy, sl = top + 20, base - 14
        cx = (a + b_) / 2
        for xx in range(a - 2, b_ + 2):
            t = (xx - cx) / ((b_ - a) / 2 + 2)
            dd = round(5 * math.sqrt(max(0.0, 1 - t * t)))
            for k in range(dd + 1):
                c.p(xx, gy - 3 + k, LEAD[1] if k < dd else LEAD[4])
            for k in range(dd + 1):
                c.p(xx, sl + k, p[1] if k == 0 else p[3])
        op.cast(c, a, gy + 3, b_ - a, 2, 0.7)
        shop_glass(self, a, b_, gy + 3, sl, base, p, WHITE, max(2, round((b_ - a) / 7)), 3)
        for k in range(4):
            cast_right(c, b_ - 4 + k, gy + 3, sl - gy - 3, 1, 0.84)

    def party_stacks(self):
        if self.form == 'stall':
            return
        edges = [self.units[0]['x'] + 10] + [u['x'] for u in self.units[1:]] + \
                [self.units[-1]['x'] + self.units[-1]['w'] - 10]
        for k, ex in enumerate(edges):
            near = [u for u in self.units if u['x'] - 1 <= ex <= u['x'] + u['w'] + 1]
            foot = min(u['top'] for u in near) - 16
            w = 16 if k in (0, len(edges) - 1) else 22
            stack(self, ex, foot, w, 22, self.s['stack'], max(2, (w - 2) // 5), brick=True, smoke=k % 2 == 0)


# ------------------------------------------------------------------ Amsterdam

GABLES = ('neck', 'bell', 'step', 'cornice')


class Amsterdam(Row):
    """A canal: narrow brick houses each under its own gable, windows as wide
    as the brick allows, a hoist beam at the top of each."""

    def plan_units(self):
        upper = dict(row=2, tall=3, wide=2, hall=2, shop=1, cottage=1, hut=1, stall=0).get(self.form, 2)
        out = []
        for k, (x, w) in enumerate(self.split(92, 60)):
            n = upper - (1 if upper >= 2 and h2(self.seed, k, 6) < 0.3 else 0)
            hs = [60] + [52, 48, 44][:n]
            cols = self.bays(x, w, 42) if self.form != 'stall' else [x + w // 2]
            kind = GABLES[int(h2(self.seed, k, 8) * 4)] if self.form != 'stall' else None
            if self.form in ('cottage', 'hut') and kind == 'cornice':
                kind = 'step'
            d = 0 if (k + self.seed) % 2 else len(cols) - 1
            out.append(dict(x=x, w=w, hs=hs, cols=cols, d=d, door_x=cols[d], gable=kind,
                            shop=self.form in ('shop', 'stall') or (k % 3 == 2)))
        return out

    def headroom(self):
        return max(self.gable_h(u) for u in self.units) + 24 if self.form != 'stall' else 24

    @staticmethod
    def gable_h(u):
        return round({'neck': 66, 'bell': 64, 'step': 60, 'cornice': 30, None: 0}[u['gable']] *
                     min(1.0, u['w'] / 84)) + 6

    def outline(self, u, y):
        """Half the gable's width at row y, or None above it."""
        w, top, kind = u['w'], u['top'], u['gable']
        H, gh = w / 2, self.gable_h(u) - 6
        t = (top - y) / gh
        if t < 0 or t > 1:
            return None
        N = max(10, round(w * 0.22))
        if kind == 'step':
            n = 4 if w >= 76 else 3
            return H - min(n, int(t * (n + 1))) * (H - 8) / n
        if kind == 'neck':
            if t < 0.36:
                return H
            if t < 0.84:
                return N
            return N + 2 - (t - 0.84) / 0.16 * (N + 2)
        if kind == 'bell':
            if t < 0.8:
                return N + (H - N) * (math.cos(math.pi * min(1, t / 0.8)) + 1) / 2
            return N * math.sqrt(max(0.0, 1 - ((t - 0.8) / 0.2) ** 2))
        return None

    def paint_unit(self, u, s):
        c, base = self.c, self.base
        x, w, top, cols, kind = u['x'], u['w'], u['top'], u['cols'], u['gable']
        brick, trim = s['wall'], ZANDSTEEN
        cx = x + w // 2
        gh = self.gable_h(u) - 6
        fl = self.floors_of(u)
        if self.form == 'stall':
            slates(c, x - 3, x + w + 3, top - 16, top, s['roof'], 4, 6)
            c.rect(x - 3, top, w + 6, 2, SHOP['brown'][4])
            op.cast(c, x, top + 2, w, 4, 0.6)
        elif kind == 'cornice':
            slates(c, x - 1, x + w + 1, top - 26, top - 3, s['roof'], 4, 7)
        else:
            def front(xx):
                return round(top - gh * 0.9 * (1 - abs(xx - cx + 0.5) / (w / 2)))
            tiles_back(c, x, x + w, front, 18, s['roof'], cx)
        brickwork(c, x, top, w, base - top, brick, 3, self.seed + x)
        if kind in ('neck', 'bell', 'step'):
            for y in range(top - gh, top):
                hw = self.outline(u, y)
                if hw is not None and hw >= 1:
                    brickwork(c, round(cx - hw), y, round(2 * hw), 1, brick, 3, self.seed + x)
            self.trim(u, trim, gh)
        elif kind == 'cornice':
            cornice(c, x, top, w, WHITE)
            self.dakkapel(cx, top - 4, s)
        plinth(c, x, base - 8, w, 8, trim)
        ww = min(24, round(w / len(cols)) - 14)
        for f, (t, b_) in enumerate(fl[1:], 1):
            band(c, x, b_ - 2, w, trim, 2)
            for cx_ in cols:
                self.window(cx_, b_ - 6, ww, b_ - t - 15, trim)
        if kind in ('neck', 'bell', 'step'):
            self.window(cx, top - 6, min(16, ww), 22, trim, small=True)
            self.hatch(cx, top - round(gh * (0.62 if kind != 'step' else 0.56)), s)
        self.ground(u, s, fl[0][0], ww)

    def trim(self, u, trim, gh):
        """Sandstone along the gable's edge, lit where it faces up; claw pieces
        and a crown on a neck gable."""
        c, x, w, top = self.c, u['x'], u['w'], u['top']
        cx = x + w // 2
        prev = None
        for y in range(top - gh - 1, top + 1):
            hw = self.outline(u, y)
            if hw is None or hw < 1:
                prev = None
                continue
            L, R = round(cx - hw), round(cx + hw)
            c.rect(L, y, 2, 1, trim[1])
            c.rect(R - 2, y, 2, 1, trim[3])
            for xx in range(L, R):
                if prev is None or xx < prev[0] or xx >= prev[1]:
                    c.p(xx, y - 1, trim[0]); c.p(xx, y, trim[1]); c.p(xx, y + 1, trim[3])
            prev = (L, R)
        if u['gable'] == 'neck':
            N = max(10, round(w * 0.22))
            sh = top - round(gh * 0.36)
            for side in (-1, 1):
                for k in range(16):
                    reach = round((w / 2 - N - 2) * (1 - k / 16) ** 1.6)
                    for j in range(reach):
                        c.p(cx + side * (N + 1 + j), sh - 1 - k, trim[1] if j < reach - 1 else trim[3])
                    if reach:
                        c.p(cx + side * (N + reach), sh - 1 - k, trim[4])
                c.rect(cx + side * (N + 3) - 1, sh - 7, 3, 3, trim[4])
                c.p(cx + side * (N + 3), sh - 6, trim[2])
            c.rect(cx - 2, top - gh - 4, 4, 4, trim[1])
            c.rect(cx - 2, top - gh - 4, 4, 1, trim[0])

    def window(self, cx, sill_y, w, h, trim, small=False):
        """A big sash in a white frame under a sandstone lintel."""
        c = self.c
        x, y = cx - w // 2, sill_y - h
        pane(c, x, y, w, h, cx, h2(cx, sill_y, self.seed + 7) < 0.35)
        sash_bars(c, x, y, w, h, WHITE)
        op.reveal(c, x, y, w, h, 2)
        op.raised(c, x - 3, y - 5, w + 6, 5, trim, 1)
        op.cast(c, x - 2, y, w + 4, 2, 0.68)
        if not small:
            sill(c, x - 2, sill_y, w + 4, trim)
        self.panes.append((x + 2, y + 2, w - 4, h - 4, 'warm', h2(cx, sill_y, self.seed) < 0.5))

    def hatch(self, cx, y, s):
        """The loft hatch under the hoist beam, the beam's end and its hook."""
        c, p = self.c, SHOP[s['shutter']]
        op.raised(c, cx - 7, y, 14, 16, p, 2)
        c.rect(cx, y + 1, 1, 14, p[5])
        b = SHOP['brown']
        c.rect(cx - 3, y - 10, 7, 6, b[3])
        c.rect(cx - 3, y - 10, 7, 1, b[1])
        c.rect(cx - 3, y - 10, 1, 6, b[2])
        op.cast(c, cx - 3, y - 4, 7, 3, 0.66)
        c.rect(cx, y - 4, 1, 3, IRON[2])
        c.p(cx + 1, y - 1, IRON[2])

    def dakkapel(self, cx, foot, s):
        """A dormer of white-painted boards with the hoist beam over its hatch."""
        c = self.c
        w, h = 20, 22
        x, y = cx - w // 2, foot - h
        c.rect(x - 2, y - 5, w + 4, 5, s['roof'][2])
        c.rect(x - 2, y - 5, w + 4, 1, s['roof'][0])
        op.raised(c, x, y, w, h, WHITE, 1)
        op.cast(c, x, y, w, 2, 0.7)
        self.hatch(cx, y + 6, s)

    def ground(self, u, s, gt, ww):
        """A stoop of stone steps to the door, the windows beside it shuttered
        over the souterrain's barred light; or a shop."""
        c, base = self.c, self.base
        x, w, cols, d = u['x'], u['w'], u['cols'], u['d']
        dx = cols[d]
        band(c, x, gt - 3, w, ZANDSTEEN, 4)
        if u['shop']:
            p = SHOP[s['shop']]
            L, R = x + 3, x + w - 3
            top = gt + 7
            fascia(self, L, R, top, p, 12)
            op.cast(c, L, top + 12, R - L, 3, 0.62)
            dw = 18
            ddx = R - dw - 3 if d else L + 3
            shop_door(c, ddx, top + 22, dw, base - top - 22, p)
            a, b_ = (L + 2, ddx - 5) if d else (ddx + dw + 5, R - 2)
            if b_ - a >= 10:
                shop_glass(self, a, b_, top + 15, base - 14, base, p, WHITE, max(2, round((b_ - a) / 9)), 2)
            return
        rise = 8
        p = SHOP[s['door']]
        op.raised(c, dx - 12, base - rise - 46, 24, 46, ZANDSTEEN, 1)
        cast_right(c, dx + 12, base - rise - 45, 45, 2, 0.74)
        pane(c, dx - 9, base - rise - 43, 18, 8)
        for k in range(1, 4):
            c.rect(dx - 9 + round(k * 4.5), base - rise - 43, 1, 8, WHITE[2])
        panel_door(c, dx - 9, base - rise - 34, 18, 34, p)
        self.panes.append((dx - 8, base - rise - 42, 16, 6, 'warm', True))
        sx0, sx1 = dx - 14, dx + 14
        c.rect(sx0, base - rise, sx1 - sx0, rise, ZANDSTEEN[3])
        c.rect(sx0, base - rise, sx1 - sx0, 2, ZANDSTEEN[1])
        c.rect(sx0, base - rise, sx1 - sx0, 1, ZANDSTEEN[0])
        side = 1 if d == 0 else -1
        edge = sx1 if side > 0 else sx0
        for k in range(4):
            yy = base - rise + 2 * k
            xx = edge + side * (1 + 3 * k) - (3 if side < 0 else 0)
            c.rect(xx, yy, 3, base - yy, ZANDSTEEN[3])
            c.rect(xx, yy, 3, 1, ZANDSTEEN[1])
        for xx in range(sx0, sx1, 3):
            c.rect(xx, base - rise - 9, 1, 9, IRON[3])
        c.rect(sx0, base - rise - 10, sx1 - sx0, 1, IRON[1])
        for i, cx in enumerate(cols):
            if i == d:
                continue
            self.window(cx, gt + 42, ww, 32, ZANDSTEEN)
            op.open_shutters(c, cx - ww // 2, gt + 10, ww, 32, s['shutter_paint'], leaf=7)
            c.rect(cx - ww // 2, base - 16, ww, 8, PANE[6])
            for xx in range(cx - ww // 2 + 1, cx + ww // 2, 3):
                c.rect(xx, base - 16, 1, 8, IRON[2])
            c.rect(cx - ww // 2, base - 16, ww, 1, IRON[1])

    def party_stacks(self):
        if self.form == 'stall':
            return
        for k, u in enumerate(self.units):
            if u['gable'] == 'cornice' or h2(self.seed, k, 31) < 0.5:
                continue
            gh = self.gable_h(u) - 6
            sx = u['x'] + 9 if k % 2 else u['x'] + u['w'] - 9
            stack(self, sx, u['top'] - round(gh * 0.3) - 6, 10, 10, self.s['wall'], 1, brick=True)


# ------------------------------------------------------------------ looks
# Dates and regions are chosen in src/content/graphics/.

LOOKS = {
    'paris': dict(
        cls=Paris, label='Paris house', wall='white-plaster', roof='slate',
        about='A Paris house before Haussmann: plaster over rubble on a stone plinth, a painted timber shopfront '
              'and a low entresol at its foot, tall casements behind iron guards with louvred persiennes, and a '
              'slate mansard lit by plaster dormers.',
        colours=[dict(wall=PLATRE, roof='mansard', shop='green', shutter=PERSIENNE[0]),
                 dict(wall=GRIS, roof='mansard', shop='oxblood', shutter=PERSIENNE[1]),
                 dict(wall=BUFF, roof='tile', tile=TUILE, shop='black', shutter=PERSIENNE[2])],
        pool=dict(wall=[PLATRE, GRIS, BUFF], shop=['green', 'oxblood', 'black', 'brown', 'blue'],
                  shutter=PERSIENNE)),
    'london': dict(
        cls=London, label='London terrace', wall='bengal-brick', roof='slate',
        about='A Georgian London terrace in grey-yellow stock brick or Regency stucco: sashes under arches of '
              'rubbed brick, a fanlit door up three steps behind the area railings, a parapet hiding the slates, '
              'and stacks crowded with pots on the party walls.',
        colours=[dict(wall=STOCK, door='black', shop='green', stack=STOCK, balconette=True),
                 dict(wall=RED, door='green', shop='black', stack=RED),
                 dict(wall=STUCCO, door='blue', shop='blue', stack=STOCK, canopy='green')],
        pool=dict(door=['black', 'green', 'blue', 'oxblood'], shop=['green', 'black', 'blue', 'brown'])),
    'amsterdam': dict(
        cls=Amsterdam, label='Canal house', wall='bengal-brick', roof='pantile',
        about='An Amsterdam canal house: narrow and deep in dark brick under a neck, bell or stepped gable '
              'trimmed in sandstone, big white sash windows, a hoist beam at the top for goods, and a stoop '
              'of stone steps up to the door.',
        colours=[dict(wall=BAKSTEEN[0], roof=PAN[0], door='green', shutter='green', shutter_paint='green',
                      shop='green'),
                 dict(wall=BAKSTEEN[1], roof=PAN[1], door='oxblood', shutter='oxblood', shutter_paint='oxblood',
                      shop='black'),
                 dict(wall=BAKSTEEN[2], roof=PAN[0], door='black', shutter='green', shutter_paint='green',
                      shop='brown')],
        pool=dict(wall=BAKSTEEN, roof=PAN, door=['green', 'oxblood', 'black', 'brown'])),
}


def house(look, variant=0, form='row', cells=12, seed=0):
    L = LOOKS[look]
    s = dict(L['colours'][variant % len(L['colours'])])
    s['pool'] = L.get('pool', {})
    return L['cls'](s, form, cells, seed)


from art import front_family  # noqa: E402

front_family.register('euro', {k: dict(label=L['label'], about=L['about'], wall=L['wall'], roof=L['roof'],
                                       variants=len(L['colours'])) for k, L in LOOKS.items()}, house)
