"""Detached houses in their own gardens, 1850 on: the villa of a city's best
streets, and the suburb's houses after it. One family for every city that
built in the European manner, as the street looks are.

    .venv/bin/python scripts/art/front_homes.py out.png [look ...]   # each colour and form beside the adult

villa, villa-stucco, villa-board, 1850-1914: two storeys under a hipped roof,
a wing brought forward under a gable or a tower, a bay window, a porch at the
door; a look for each wall, so a region builds its own. The seed picks its ornament: cresting, quoins, brick bands,
shutters, a balustrade.
suburban, 1900-1940: the villa's plan in brick and roughcast, a black and
white or tile-hung gable, a round-headed porch.
bungalow, 1905-1940: a storey and a half under one low roof, a porch on
tapered posts; gable to the street on a narrow lot, eave and dormer on a wide.
ranch, 1945-1975: one storey under a low hip, a picture window, a garage or
carport.
rendered, 1950-2000: two storeys in painted render, a balcony over the door,
shutter boxes, a garage in the ground floor.

All built on the street looks' base, so they share its lamplight, wear and
outline.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_modern as fmod  # noqa: E402
from art.front_modern import Block, cast_right  # noqa: E402
from art import front_europe as eu  # noqa: E402
from art.front_europe import brickwork, plaster, plinth, band, stack, slates, tiles_back, pane, sill, panel_door, \
    steps, fanlight, PORTLAND, GAUGED, WHITE, LEAD, IRON, SLATE, RED, STOCK, STUCCO, SHOP  # noqa: E402
from art.front_parts import column  # noqa: E402

TILE = ramp(34, 0.1, lift=-0.07)
SHINGLE = ramp(62, 0.03, lift=-0.14)
OCHRE = ramp(78, 0.075, lift=0.0)
SAGE = ramp(140, 0.04, lift=-0.01)
CREAM = ramp(88, 0.045, lift=0.04)
BUTTER = ramp(92, 0.07, lift=0.035)
# A step down the ladder: these roofs are seen whole, and pale slate glares.
DARKSLATE = SLATE[1:] + [SLATE[7]]
BUFF = ramp(84, 0.05, lift=0.02)


def siding(c, x, y, w, h, r):
    """Painted weatherboard: one value, each board's lower edge a line."""
    for yy in range(y, y + h):
        c.rect(x, yy, w, 1, r[3] if yy % 5 == 4 else r[1] if yy % 5 == 0 else r[2])


def shingles(c, x, y, w, h, r):
    """Sawn shingles in courses, butts staggered."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            lx = (xx + (yy // 4 % 2) * 3) % 6
            c.p(xx, yy, r[4] if yy % 4 == 3 and lx in (0, 5) else r[3] if yy % 4 == 3 else r[1] if yy % 4 == 0 else r[2])


def roughcast(c, x, y, w, h, r, seed=0):
    """Roughcast as one value, a pebble's shadow here and there."""
    c.rect(x, y, w, h, r[1])
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if h2(xx // 2, yy, seed) < 0.03:
                c.p(xx, yy, r[2])


def shade(c, x, y, w, h, k=0.82):
    """Shadow over what is already drawn: under a porch roof, in a recess."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            q = c.g(xx, yy)
            if q[3]:
                c.p(xx, yy, (int(q[0] * k * 0.96), int(q[1] * k * 0.95), int(min(255, q[2] * k * 1.04)), 255))


# ------------------------------------------------------------------ parts

def hip(c, L, R, eave, depth, r, course=5, cut=8, inset=None):
    """A hipped roof from above: the front slope in courses, narrowing to the
    ridge; the hip on the left lit, the one on the right in shade."""
    inset = round(depth * 0.8) if inset is None else inset
    slates(c, L, R, eave - depth, eave, r, course, cut)
    for y in range(eave - depth, eave):
        k = round(inset * (eave - 1 - y) / max(1, depth - 1))
        for x in range(L, L + k):
            c.px[x, y] = (0, 0, 0, 0)
        for x in range(R - k, R):
            c.px[x, y] = (0, 0, 0, 0)
        if k < (R - L) // 2:
            c.p(L + k, y, r[1])
            c.p(L + k + 1, y, r[2])
            c.p(R - k - 1, y, r[6])
            c.p(R - k - 2, y, r[5])
    a, b = L + inset, R - inset
    c.rect(a, eave - depth - 2, b - a, 2, r[1])
    c.rect(a, eave - depth, b - a, 1, r[5])


def sash(b, cx, sill_y, w, h, frame, bars=1, on=None):
    """A plate-glass sash: one meeting rail, `bars` upright glazing bars."""
    c = b.c
    x, y = cx - w // 2, sill_y - h
    pane(c, x, y, w, h, cx, h2(cx, sill_y, b.seed + 7) < 0.3)
    c.rect(x, y, w, 2, frame[2])
    c.rect(x, y, 2, h, frame[1])
    c.rect(x + w - 2, y, 2, h, frame[3])
    c.rect(x, y + h - 2, w, 2, frame[2])
    mid = y + h // 2
    c.rect(x, mid - 1, w, 2, frame[0])
    c.rect(x, mid + 1, w, 1, frame[3])
    for k in range(1, bars + 1):
        c.rect(x + round(w * k / (bars + 1)), y, 1, h, frame[1])
    op.reveal(c, x, y, w, h, 3)
    b.panes.append((x + 2, y + 2, w - 4, h - 4, 'warm', h2(cx, sill_y, b.seed + 5) < 0.45 if on is None else on))
    return x, y


def casement(b, cx, sill_y, w, h, frame, lights=2, top=0, on=None):
    """Casements side by side, a row of small lights over them if `top`."""
    c = b.c
    x, y = cx - w // 2, sill_y - h
    pane(c, x, y, w, h, cx, h2(cx, sill_y, b.seed + 7) < 0.3)
    c.rect(x, y, w, 1, frame[2])
    c.rect(x, y, 1, h, frame[1])
    c.rect(x + w - 1, y, 1, h, frame[3])
    c.rect(x, y + h - 1, w, 1, frame[2])
    for k in range(1, lights):
        c.rect(x + round(w * k / lights), y, 1, h, frame[1])
    if top:
        c.rect(x, y + top, w, 1, frame[1])
    op.reveal(c, x, y, w, h, 2)
    b.panes.append((x + 1, y + 1, w - 2, h - 2, 'warm', h2(cx, sill_y, b.seed + 5) < 0.45 if on is None else on))
    return x, y


def rail(c, a, b, foot, r):
    """A balustrade of square balusters standing on `foot`."""
    c.rect(a, foot - 11, b - a, 1, r[0])
    c.rect(a, foot - 10, b - a, 1, r[3])
    for xx in range(a + 2, b - 1, 3):
        c.rect(xx, foot - 9, 1, 8, r[2])
    c.rect(a, foot - 1, b - a, 1, r[3])


def pier_post(c, cx, top, base, r, t, pw=11, ph=20):
    """A porch post tapering up from a brick pier."""
    x = cx - pw // 2
    brickwork(c, x, base - ph, pw, ph, r, 3, cx)
    c.rect(x, base - ph, 1, ph, r[1])
    c.rect(x + pw - 1, base - ph, 1, ph, r[5])
    c.rect(x - 1, base - ph - 2, pw + 2, 2, t[1])
    c.rect(x - 1, base - ph - 2, pw + 2, 1, t[0])
    n = base - ph - 2 - top
    for i in range(n):
        hw = 2 + (i * 2) // max(1, n)
        c.rect(cx - hw, top + i, 2 * hw + 1, 1, t[2])
        c.p(cx - hw, top + i, t[0])
        c.p(cx + hw, top + i, t[4])


def garage_door(c, x, y, w, h, r, rows=4, cols=4, lights=False):
    """An up-and-over door in panels, the lintel's shadow on it."""
    c.rect(x - 2, y - 2, w + 4, h + 2, r[3])
    c.rect(x, y, w, h, r[2])
    ph, pw = h / rows, w / cols
    for i in range(rows):
        for k in range(cols):
            px, py = x + round(k * pw) + 1, y + round(i * ph) + 1
            qw, qh = round((k + 1) * pw) - round(k * pw) - 2, round((i + 1) * ph) - round(i * ph) - 2
            if lights and i == 0:
                c.rect(px, py, qw, qh, eu.PANE[6])
                c.rect(px, py, qw, 1, eu.PANE[7])
            else:
                c.rect(px, py, qw, qh, r[1])
                c.rect(px, py + qh - 1, qw, 1, r[2])
                c.rect(px, py, qw, 1, r[0])
    op.cast(c, x, y, w, 3, 0.7)


def lintel(c, x, y, w, r):
    """A stone lintel: lit top, face, the line under it."""
    c.rect(x, y, w, 1, r[0])
    c.rect(x, y + 1, w, 4, r[2])
    c.rect(x, y + 5, w, 1, r[4])


def arch_head(c, cx, y, w, r, R=None):
    """A round stucco head over an opening `w` wide whose glass tops out at y."""
    R = R or w // 2
    for yy in range(y - R - 3, y):
        for xx in range(cx - R - 4, cx + R + 4):
            d = math.hypot(xx - cx + 0.5, y - yy)
            if R <= d < R + 3:
                c.p(xx, yy, r[0] if d >= R + 2 and xx < cx else r[1] if xx < cx else r[2])
            elif d < R:
                c.p(xx, yy, eu.PANE[7] if y - yy > R * 0.5 else eu.PANE[6])


def bay_window(b, cx, top, foot, w, floors, frame, stone, roof):
    """A canted bay standing out from the wall, `floors` storeys tall: a wide
    light between two splayed ones, panels under each, its own little roof;
    its shadow falls on the wall to its right."""
    c = b.c
    x = cx - w // 2
    side = 8
    c.rect(x, top, w, foot - top, stone[1])
    c.rect(x, top, side, foot - top, stone[0])
    c.rect(x + w - side, top, side, foot - top, stone[3])
    for yy in range(top, foot):
        c.p(x + side, yy, stone[3])
        c.p(x + w - side - 1, yy, stone[4])
    span = (foot - top) / floors
    for f in range(floors):
        t = round(top + f * span)
        sill_y = round(t + span * (0.72 if f < floors - 1 else 0.66))
        h = sill_y - t - 7
        for lx, lw, k in ((x + 2, side - 3, 6), (x + side + 3, w - 2 * side - 6, 0), (x + w - side + 1, side - 3, 7)):
            pane(c, lx, sill_y - h, lw, h, lx)
            if k:
                for yy in range(sill_y - h, sill_y):
                    for xx in range(lx, lx + lw):
                        q = c.g(xx, yy)
                        t2 = 1.12 if k == 6 else 0.82
                        c.p(xx, yy, (min(255, int(q[0] * t2)), min(255, int(q[1] * t2)), min(255, int(q[2] * t2)), 255))
            else:
                c.rect(lx, sill_y - h + h // 2 - 1, lw, 2, frame[0])
                c.rect(lx + lw // 2, sill_y - h, 1, h, frame[1])
                b.panes.append((lx + 1, sill_y - h + 1, lw - 2, h - 2, 'warm', h2(cx, f, b.seed + 3) < 0.6))
            c.rect(lx - 1, sill_y - h - 1, lw + 2, 1, frame[1])
            c.rect(lx - 1, sill_y, lw + 2, 1, frame[0])
        c.rect(x, sill_y + 1, w, 2, stone[1])
        c.rect(x, sill_y + 3, w, 1, stone[4])
        pt, pb = sill_y + 6, round(t + span) - 3
        if pb - pt >= 5:
            for px, pw in ((x + side + 3, w - 2 * side - 6),):
                c.rect(px, pt, pw, pb - pt, stone[3])
                c.rect(px + 1, pt + 1, pw - 2, pb - pt - 2, stone[2])
                c.rect(px + 1, pt + 1, pw - 2, 1, stone[1])
    # Its roof from above: a little hipped lead flat, lit along its front.
    for k in range(9):
        ins = max(0, 8 - k)
        c.rect(x + ins, top - 9 + k, w - 2 * ins, 1, roof[2] if k < 2 else roof[3] if k < 7 else roof[1] if k == 7 else roof[5])
        c.p(x + ins, top - 9 + k, roof[1])
        c.p(x + w - 1 - ins, top - 9 + k, roof[5])
    cast_right(c, x + w, top - 1, foot - top + 1, 4, 0.66)
    c.rect(x - 1, foot - 7, w + 2, 7, stone[3])
    c.rect(x - 1, foot - 7, w + 2, 1, stone[1])
    c.rect(x - 1, top - 1, w + 2, 1, stone[0])


def portico(b, cx, top, base, w, r, d=7):
    """A porch on two columns: its flat roof seen from above, the shadow under it."""
    c = b.c
    x = cx - w // 2
    c.rect(x - 2, top - 4, w + 4, 1, r[0])
    c.rect(x - 2, top - 3, w + 4, 3, r[1])
    c.rect(x - 2, top, w + 4, 2, r[2])
    c.rect(x - 1, top + 2, w + 2, 4, r[2])
    c.rect(x - 1, top + 6, w + 2, 1, r[4])
    op.cast(c, x + 2, top + 7, w - 4, 6, 0.6)
    for px in (x + d // 2 + 1, x + w - d // 2 - 1):
        column(c, px, top + 7, base, r, d, 'tuscan')


def veranda(b, L, R, top, base, door_x, r, roof):
    """A veranda across a front: its shed roof seen from above in courses,
    turned posts, a balustrade between them and steps at the door."""
    c = b.c
    slates(c, L - 3, R + 3, top - 10, top, roof, 5, 8)
    c.rect(L - 3, top - 11, R - L + 6, 1, roof[1])
    c.rect(L - 3, top, R - L + 6, 2, r[1])
    c.rect(L - 3, top + 2, R - L + 6, 1, r[4])
    op.cast(c, L, top + 3, R - L, 7, 0.58)
    n = max(2, round((R - L) / 26))
    posts = [L + round((R - L - 3) * k / n) for k in range(n + 1)]
    posts = [p for p in posts if abs(p + 1 - door_x) > 13] + [door_x - 15, door_x + 13]
    for px in sorted(set(posts)):
        if px < L or px > R - 3:
            continue
        c.rect(px, top + 3, 3, base - top - 3, r[2])
        c.rect(px, top + 3, 1, base - top - 3, r[0])
        c.rect(px + 2, top + 3, 1, base - top - 3, r[4])
        # a bracket each side under the plate
        for k in range(4):
            c.p(px - 1 - k, top + 3 + k, r[2])
            c.p(px + 3 + k, top + 3 + k, r[3])
    ps = sorted(set(p for p in posts if L <= p <= R - 3))
    for a, d in zip(ps, ps[1:]):
        if a < door_x < d:
            continue
        rail(c, a + 3, d, base - 2, r)


def gable(c, wl, wr, eave, g, roof, t, fill, depth=14, over=3, scallop=False):
    """A gable facing the street: its roof running back from it, both slopes
    showing; `fill(x, y, w)` paints the wall in the gable a row at a time;
    bargeboards along the rake, lit on top."""
    mid = (wl + wr) // 2
    half = (wr - wl) // 2 + over
    front = lambda x: eave - round(g * (1 - abs(x - mid) / half))
    tiles_back(c, wl - over, wr + over, front, depth, roof, mid)
    for yy in range(eave - g, eave):
        k = round(half * (yy - eave + g) / g)
        xa, xb = max(wl, mid - k), min(wr, mid + k)
        if xb > xa:
            fill(xa, yy, xb - xa)
    for xx in range(wl - over, wr + over + 1):
        yy = front(xx)
        c.p(xx, yy - 2, t[0])
        c.p(xx, yy - 1, t[1])
        c.p(xx, yy, t[2])
        c.p(xx, yy + 1, t[4])
        if scallop and xx % 3 == 0 and wl <= xx < wr:
            c.p(xx, yy + 1, t[2])
            c.p(xx, yy + 2, t[3])
            continue
        q = c.g(xx, yy + 2)
        if q[3] and wl <= xx < wr:
            c.p(xx, yy + 2, (int(q[0] * 0.7), int(q[1] * 0.7), int(q[2] * 0.76), 255))


def roundel(c, cx, cy, R, t):
    """A round light in a moulded ring."""
    for yy in range(cy - R, cy + R + 1):
        for xx in range(cx - R, cx + R):
            d = math.hypot(xx - cx + 0.5, yy - cy + 0.5)
            if d < R:
                c.p(xx, yy, (t[1] if xx < cx else t[3]) if d >= R - 1.5 else eu.PANE[7] if yy < cy else eu.PANE[6])


def cresting(c, a, b, y):
    """Iron cresting along a ridge: a rail and a spike every few pixels."""
    c.rect(a, y, b - a, 1, IRON[3])
    for xx in range(a + 1, b - 1, 4):
        c.rect(xx, y - 3, 1, 3, IRON[3])
        c.p(xx, y - 4, IRON[2])
        c.p(xx + 2, y - 1, IRON[4])


def quoins(c, x, top, base, r, right=False):
    """Dressed stones up a corner, long and short by turns."""
    for k, yy in enumerate(range(top, base - 6, 7)):
        w = 8 if k % 2 == 0 else 5
        xx = x - w if right else x
        c.rect(xx, yy, w, 6, r[1])
        c.rect(xx, yy, w, 1, r[0])
        c.rect(xx, yy + 6, w, 1, r[4])
        c.p(xx if right else xx + w - 1, yy + 3, r[3])


def balustrade(c, x, y, w, r):
    """A balustrade standing on the row above y: rail, balusters, plinth."""
    c.rect(x, y - 10, w, 1, r[0])
    c.rect(x, y - 9, w, 1, r[2])
    for xx in range(x + 2, x + w - 1, 3):
        c.rect(xx, y - 8, 1, 6, r[1])
        c.p(xx + 1, y - 6, r[3])
    c.rect(x, y - 2, w, 2, r[2])
    for px in (x, x + w - 3):
        c.rect(px, y - 11, 3, 11, r[1])
        c.rect(px + 2, y - 10, 1, 10, r[3])


# ------------------------------------------------------------------ the villa

class Home(Block):
    """A detached house on its lot: walls four pixels inside the footprint,
    the eaves reaching its edges."""
    HEAD = 34

    def site(self, s, form, cells, seed):
        self.s, self.form, self.seed = s, form or 'tall', seed
        self.W = cells * 16
        self.x0, self.x1 = 16, 16 + self.W
        self.L, self.R = self.x0 + 4, self.x1 - 4
        self.panes, self.signs, self.neon, self.bulbs, self.lamps = [], [], {}, {}, []
        self.overlays, self.smoke, self.shop_signs = [], [], []
        doors = s.get('doors') or [s['door']]
        self.paint_door = doors[int(h2(seed, 7, 77) * len(doors))]

    def stand(self, eave, base):
        self.eave, self.base = eave, base
        self.c = C(self.x1 + 16, base + 10)


class Villa(Home):
    HS = [56, 48]

    def __init__(self, s, form='tall', cells=10, seed=0):
        self.site(s, form, cells, seed)
        W = self.W
        self.hs = self.HS
        self.floors = 2
        self.depth = 30 if W < 130 else 36
        self.wing = None
        if W >= 96:
            ww = max(40, min(66, round((self.R - self.L) * 0.42)))
            self.wing = (self.L, self.L + ww) if seed % 2 == 0 else (self.R - ww, self.R)
        tower = bool(self.wing and s.get('tower'))
        self.gable = round((self.wing[1] - self.wing[0]) * 0.42) if self.wing and not tower else 0
        self.tower = 40 if tower else 0
        # What this house was finished with: the seed decides, so a street varies.
        on = lambda i, odds: h2(seed, i, 77) < odds
        self.o = dict(cresting=on(1, 0.55), quoins=on(2, 0.5), scallop=on(3, 0.6), rail=on(4, 0.55),
                      bands=on(5, 0.5), shutters=on(6, 0.45))
        eave = self.HEAD + max(self.depth, self.gable + 6, self.tower + (36 if s.get('cap') == 'mansard' else 20))
        self.stand(eave, eave + sum(self.hs))
        a, e = self.main()
        n = max(1, round((e - a) / 44))
        self.cols = [a + round((e - a) * (k + 0.5) / n) for k in range(n)]
        self.d = (0 if self.wing and self.wing[0] == self.L else n - 1) if self.wing else seed % n
        self.door_x, self.door_size = self.cols[self.d], (22, 46)

    def main(self):
        """The main block's walls, beside the wing."""
        if not self.wing:
            return self.L, self.R
        return (self.wing[1], self.R) if self.wing[0] == self.L else (self.L, self.wing[0])

    # ---------------------------------------------------------------- walls

    def wall(self, x, y, w, h):
        c, s = self.c, self.s
        if s['kind'] == 'brick':
            brickwork(c, x, y, w, h, s['wall'], 3, self.seed)
        elif s['kind'] == 'stucco':
            c.rect(x, y, w, h, s['wall'][1])
        else:
            siding(c, x, y, w, h, s['wall'])

    def paint(self):
        c, s = self.c, self.s
        L, R, eave, base = self.L, self.R, self.eave, self.base
        roof = s['roof']
        course, cut = (4, 6) if s['kind'] == 'stucco' or s.get('tiled') else (5, 8)
        a, e = self.main()
        hip(c, self.L if self.tower and a != L else self.x0, self.R if self.tower and e != R else self.x1,
            eave, self.depth, roof, course, cut)
        # Stacks stand on the roof, inside its outline.
        ridge = eave - self.depth
        for k, sx in enumerate([a + (e - a) // 4, e - (e - a) // 4] if e - a > 70 else [(a + e) // 2 + 14]):
            stack(self, sx, ridge + 10, 14, 16, s['stack'], 2, brick=s['kind'] != 'stucco', smoke=k == 0)
        if s['kind'] != 'clap' and self.o['cresting']:
            cresting(c, self.x0 + round(self.depth * 0.8) + 2, self.x1 - round(self.depth * 0.8) - 2, ridge - 3)
        self.wall(L, eave, R - L, base - eave)
        if s['kind'] == 'brick' and (s.get('bands') or self.o['bands']):
            # Bands of another brick at the sills, as the builders liked.
            for yy in (eave + self.hs[1] - 20, base - 28):
                brickwork(c, L, yy, R - L, 4, s.get('band', BUFF), 2, self.seed + 5)
        if s['kind'] != 'clap' and self.o['quoins']:
            q = PORTLAND if s['kind'] == 'brick' else s['trim']
            quoins(c, L, eave + 4, base - 8, q)
            quoins(c, R, eave + 4, base - 8, q, True)
        if self.wing:
            self.paint_wing()
        self.eaves(a, e)
        self.fronts(a, e)
        self.footing()
        self.entrance()
        self.foot(PORTLAND)

    def footing(self):
        c, L, R, base = self.c, self.L, self.R, self.base
        if self.s['kind'] != 'clap':
            plinth(c, L, base - 8, R - L, 8, PORTLAND)
        else:
            brickwork(c, L, base - 6, R - L, 6, RED, 4, self.seed)
            c.rect(L, base - 7, R - L, 1, self.s['trim'][1])

    def eaves(self, a, e):
        """The eave over the main block: a fascia, and what the look hangs under it."""
        c, s = self.c, self.s
        x, w = a - (3 if a == self.L else 0), e - a + (3 if a == self.L else 0) + (3 if e == self.R else 0)
        t = s['trim']
        y = self.eave
        if s['kind'] == 'stucco':
            # A deep eave on paired brackets over a plain frieze.
            c.rect(x - 1, y - 2, w + 2, 1, t[0])
            c.rect(x - 1, y - 1, w + 2, 3, t[1])
            c.rect(x, y + 2, w, 1, t[4])
            c.rect(a, y + 3, e - a, 8, t[2])
            for xx in range(a + 3, e - 4, 9):
                c.rect(xx, y + 3, 3, 6, t[1])
                c.rect(xx + 2, y + 4, 1, 5, t[4])
                c.rect(xx, y + 9, 2, 1, t[3])
            c.rect(a, y + 11, e - a, 1, t[4])
            op.cast(c, a, y + 12, e - a, 3, 0.66)
        else:
            c.rect(x, y - 1, w, 1, t[0])
            c.rect(x, y, w, 3, t[1])
            c.rect(x, y + 3, w, 1, t[4])
            op.cast(c, a, y + 4, e - a, 4, 0.6)
            if s['kind'] == 'brick':
                band(c, a, y + self.hs[1] - 3, e - a, PORTLAND, 3)

    def window(self, cx, sill_y, w, h, upper=False):
        c, s = self.c, self.s
        x, y = cx - w // 2, sill_y - h
        if s['kind'] == 'brick':
            lintel(c, x - 3, y - 6, w + 6, PORTLAND)
            sash(self, cx, sill_y, w, h, WHITE)
            sill(c, x - 3, sill_y, w + 6, PORTLAND)
        elif s['kind'] == 'stucco':
            op.raised(c, x - 3, y - 2, w + 6, h + 2, s['trim'], 1)
            arch_head(c, cx, y, w, s['trim'])
            sash(self, cx, sill_y, w, h, WHITE)
            if s.get('shutter') and self.o['shutters'] and w >= 18:
                eu.persiennes(c, x, y, w, h, s['shutter'])
            sill(c, x - 4, sill_y, w + 8, s['trim'])
            if upper:
                self.c.rect(x - 4, sill_y + 4, 3, 3, s['trim'][2])
                self.c.rect(x + w + 1, sill_y + 4, 3, 3, s['trim'][3])
        else:
            t = s['trim']
            op.raised(c, x - 3, y - 4, w + 6, h + 7, t, 1)
            c.rect(x - 4, y - 6, w + 8, 2, t[0])
            op.cast(c, x - 2, y - 4, w + 4, 2, 0.74)
            sash(self, cx, sill_y, w, h, t)
            cast_right(c, x + w + 3, y - 3, h + 5, 2, 0.76)

    def fronts(self, a, e):
        base, eave = self.base, self.eave
        up = eave + self.hs[1]
        for i, cx in enumerate(self.cols):
            self.window(cx, up - 8, 20, 30, True)
            if i != self.d:
                self.window(cx, base - 16, 20, 34)

    # ---------------------------------------------------------------- the wing

    def paint_wing(self):
        c, s = self.c, self.s
        wl, wr = self.wing
        eave, base = self.eave, self.base
        mid = (wl + wr) // 2
        left = wl == self.L
        t = s['trim']
        if self.tower:
            top = eave - self.tower
            self.wall(wl, top, wr - wl, eave - top)
            # Its low roof on brackets, then the top storey's paired lights.
            if s.get('cap') == 'mansard':
                # A slate cap with iron cresting, and a lead flat behind it.
                eu.mansard(c, wl - 2, wr + 2, top - 26, top, s['roof'], LEAD)
                c.rect(wl + 3, top - 30, wr - wl - 6, 3, LEAD[3])
                c.rect(wl + 3, top - 30, wr - wl - 6, 1, LEAD[1])
                cresting(c, wl + 4, wr - 4, top - 31)
                roundel(c, mid, top - 13, 6, t)
            else:
                hip(c, wl - 5, wr + 5, top, 14, s['roof'], 4, 6, 12)
            if self.o['quoins']:
                quoins(c, wl, top + 12, eave - 2, t)
                quoins(c, wr, top + 12, eave - 2, t, True)
            c.rect(wl - 4, top - 1, wr - wl + 8, 1, t[0])
            c.rect(wl - 4, top, wr - wl + 8, 3, t[1])
            c.rect(wl - 3, top + 3, wr - wl + 6, 1, t[4])
            for xx in range(wl + 2, wr - 3, 8):
                c.rect(xx, top + 4, 3, 5, t[1])
                c.rect(xx + 2, top + 5, 1, 4, t[4])
            op.cast(c, wl, top + 9, wr - wl, 3, 0.66)
            band(c, wl, eave - 2, wr - wl, t, 4)
            for cx in (mid - 9, mid + 9):
                self.round_light(cx, eave - 8, 10, 20)
            for cx in (mid - 10, mid + 10):
                self.round_light(cx, eave + self.hs[1] - 8, 12, 28)
            self.round_light(mid, base - 16, 22, 34)
        else:
            g = self.gable
            peak = eave - g
            gable(c, wl, wr, eave, g, s['roof'], t, self.gable_fill, scallop=self.o['scallop'])
            c.rect(mid - 1, peak - 9, 2, 9, t[1])
            c.rect(mid - 2, peak - 6, 4, 2, t[2])
            if g >= 24 and s.get('gable') != 'timber':
                roundel(c, mid, eave - 9, 5, t)
            bw = min(wr - wl - 8, 46)
            if s.get('bay') == 2 and wr - wl >= 50:
                bay_window(self, mid, eave + 12, base, bw, 2, WHITE,
                           s.get('bay_body', PORTLAND if s['kind'] == 'brick' else t), s.get('bay_roof', LEAD))
            else:
                bay_window(self, mid, eave + self.hs[1] + 10, base, bw, 1, WHITE, t, LEAD)
                self.pair(mid, eave + self.hs[1] - 8)
        # The wing stands forward: its lit corner, and its shadow on the main wall.
        if left:
            cast_right(c, wr, eave + 1, base - eave - 1, 4, 0.66)
        else:
            for yy in range(eave + 1, base):
                q = c.g(wl, yy)
                c.p(wl, yy, tuple(min(255, int(v * 1.08)) for v in q[:3]) + (255,))

    def pair(self, mid, sill_y):
        for cx in (mid - 11, mid + 11):
            self.window(cx, sill_y, 14, 30, True)

    def gable_fill(self, x, y, w):
        c, s = self.c, self.s
        if s['kind'] == 'clap':
            shingles(c, x, y, w, 1, s['gable'])
        else:
            self.wall(x, y, w, 1)

    def round_light(self, cx, sill_y, w, h):
        c, t = self.c, self.s['trim']
        x, y = cx - w // 2, sill_y - h
        op.raised(c, x - 2, y - 1, w + 4, h + 1, t, 1)
        arch_head(c, cx, y, w, t)
        sash(self, cx, sill_y, w, h, WHITE, 0 if w < 14 else 1)
        sill(c, x - 3, sill_y, w + 6, t)

    # ---------------------------------------------------------------- the door

    def entrance(self):
        c, s = self.c, self.s
        base, dx = self.base, self.door_x
        p = SHOP[self.paint_door]
        rise, dh = 6, 40
        dy = base - rise - dh
        t = s['trim']
        if s['kind'] == 'clap':
            a, e = self.main()
            veranda(self, a + 1, e - 1, self.eave + self.hs[1] + 6, base, dx, t, s['roof'])
            op.raised(c, dx - 14, dy - 10, 28, dh + 10, t, 1)
            pane(c, dx - 10, dy - 7, 21, 6)
            self.panes.append((dx - 10, dy - 7, 21, 6, 'warm', True))
            panel_door(c, dx - 10, dy, 21, dh, p)
            steps(c, dx, base, 26, 3, t)
            return
        if s['kind'] == 'stucco':
            R = 11
            c.rect(dx - R - 1, dy - R - 1, 2 * R + 2, R + 1, t[2])
            fanlight(c, dx, dy, R, t, WHITE)
            self.panes.append((dx - 8, dy - R + 2, 16, R - 2, 'warm', True))
            panel_door(c, dx - 10, dy, 21, dh, p)
            portico(self, dx, dy - R - 10, base - rise, 44, t, 8)
            if self.o['rail']:
                balustrade(c, dx - 23, dy - R - 14, 46, t)
        else:
            op.raised(c, dx - 14, dy - 12, 28, dh + 12, PORTLAND, 1)
            pane(c, dx - 10, dy - 8, 21, 7)
            c.rect(dx, dy - 8, 1, 7, WHITE[1])
            self.panes.append((dx - 10, dy - 8, 21, 7, 'warm', True))
            panel_door(c, dx - 10, dy, 21, dh, p)
            # A hood on brackets: its top face lit, the shadow under it.
            c.rect(dx - 19, dy - 20, 38, 1, PORTLAND[0])
            c.rect(dx - 19, dy - 19, 38, 3, PORTLAND[1])
            c.rect(dx - 18, dy - 16, 36, 2, PORTLAND[2])
            c.rect(dx - 17, dy - 14, 34, 1, PORTLAND[4])
            for px in (dx - 17, dx + 13):
                for k in range(6):
                    c.rect(px, dy - 13 + k, 4 - k // 2, 1, PORTLAND[2])
            op.cast(c, dx - 13, dy - 13, 26, 4, 0.64)
        steps(c, dx, base, 30 if s['kind'] == 'stucco' else 26, 3, PORTLAND)


# ------------------------------------------------------------------ the suburban house, 1900-1940

class Suburban(Villa):
    """The villa's plan built cheaper and lower: brick below, roughcast above,
    a gable in black and white or hung with tiles, casements with small
    lights over them, the door in a round-headed porch."""
    HS = [56, 46]

    def __init__(self, s, form='tall', cells=10, seed=0):
        super().__init__(s, form, cells, seed)
        self.o = dict.fromkeys(self.o, False)

    def wall(self, x, y, w, h):
        c, s = self.c, self.s
        split = self.eave + self.hs[1]
        if y < split:
            roughcast(c, x, y, w, min(h, split - y), s['upper'], self.seed)
        if y + h > split:
            brickwork(c, x, split, w, y + h - split, s['wall'], 3, self.seed) if s.get('ground') != 'rough' else \
                roughcast(c, x, split, w, y + h - split, s['wall'], self.seed)
            if s.get('tiled'):
                # A tile course throws the rain off the brick.
                c.rect(x, split - 1, w, 1, s['roof'][2])
                c.rect(x, split, w, 1, s['roof'][4])

    def gable_fill(self, x, y, w):
        c, s = self.c, self.s
        mid = (self.wing[0] + self.wing[1]) // 2
        if s['gable'] == 'timber':
            # Studs and a collar, black on white.
            c.rect(x, y, w, 1, s['upper'][0])
            if y == self.eave - 13:
                c.rect(x, y, w, 2, s['timber'][5])
            for xx in range(x, x + w):
                if abs(xx - mid) % 7 < 2:
                    c.p(xx, y, s['timber'][5 if abs(xx - mid) % 7 else 4])
        elif s['gable'] == 'tile':
            shingles(c, x, y, w, 1, s['roof'])
        else:
            roughcast(c, x, y, w, 1, s['upper'], self.seed)

    def window(self, cx, sill_y, w, h, upper=False):
        c, s = self.c, self.s
        w += 6
        h -= 4
        x, y = cx - w // 2, sill_y - h
        t = s['trim']
        if upper or s.get('ground') == 'rough':
            op.raised(c, x - 2, y - 2, w + 4, h + 4, t, 1)
        else:
            # A soldier course over the opening.
            for xx in range(x - 2, x + w + 2):
                c.rect(xx, y - 5, 1, 5, s['wall'][2 if xx % 3 else 4])
        casement(self, cx, sill_y, w, h, t, 3 if w >= 22 else 2, 7)
        if s.get('tiled'):
            c.rect(x - 2, sill_y, w + 4, 1, s['roof'][1])
            c.rect(x - 2, sill_y + 1, w + 4, 2, s['roof'][3])
            op.cast(c, x - 1, sill_y + 3, w + 2, 2, 0.74)
        else:
            sill(c, x - 2, sill_y, w + 4, t)

    def pair(self, mid, sill_y):
        self.window(mid, sill_y, 28, 30, True)

    def footing(self):
        c, L, R, base = self.c, self.L, self.R, self.base
        c.rect(L, base - 6, R - L, 1, self.s['wall'][4])
        brickwork(c, L, base - 5, R - L, 5, self.s['wall'] if self.s.get('ground') != 'rough' else RED, 4, self.seed)

    def entrance(self):
        c, s = self.c, self.s
        base, dx = self.base, self.door_x
        p = SHOP[self.paint_door]
        rise, dh, R = 4, 40, 15
        dy = base - rise - dh
        ring = s['wall'] if s.get('ground') != 'rough' else s['trim']
        # A round-headed porch: the arch in brick on edge, the door back in its shadow.
        for yy in range(dy - 6, base - rise):
            for xx in range(dx - R - 4, dx + R + 4):
                d = math.hypot(xx - dx + 0.5, min(0, yy - (dy + 8)))
                if d < R:
                    c.p(xx, yy, s['wall'][7])
                elif d < R + 4:
                    a = math.atan2(yy - (dy + 8), xx - dx + 0.5)
                    c.p(xx, yy, ring[4] if (yy > dy + 8 and yy % 4 == 0) or (yy <= dy + 8 and round(a * 9) % 2 == 0)
                        else ring[1] if xx < dx else ring[2])
        panel_door(c, dx - 10, dy + 4, 21, dh - 4, p)
        op.cast(c, dx - 10, dy + 4, 21, 4, 0.6)
        self.lamp(dx, dy - 2)
        steps(c, dx, base, 30, 2, PORTLAND)


# ------------------------------------------------------------------ the bungalow, 1905-1940

class Bungalow(Home):
    """A storey and a half under one broad low roof: a porch on tapered posts
    and brick piers, shingles in the gable, rafter ends showing. Narrow lots
    turn the gable to the street; wide ones the eave, with a dormer."""
    H1 = 56

    def __init__(self, s, form='tall', cells=10, seed=0):
        self.site(s, form, cells, seed)
        L, R = self.L, self.R
        self.floors = 1
        self.side = self.W >= 150
        self.g = 0 if self.side else round(((R - L) // 2 + 4) * 0.5)
        self.depth = 38 if self.side else 16
        eave = self.HEAD + self.g + self.depth
        self.stand(eave, eave + self.H1)
        pw = R - L if self.side else round((R - L) * 0.6)
        self.porch = (L, L + pw) if seed % 2 == 0 else (R - pw, R)
        self.door_x = (self.porch[0] + self.porch[1]) // 2
        self.door_size = (22, 46)

    def wall(self, x, y, w, h):
        c, s = self.c, self.s
        if s['kind'] == 'clap':
            siding(c, x, y, w, h, s['wall'])
        elif s['kind'] == 'shingle':
            shingles(c, x, y, w, h, s['wall'])
        elif s['kind'] == 'brick':
            brickwork(c, x, y, w, h, s['wall'], 3, self.seed)
        else:
            c.rect(x, y, w, h, s['wall'][1])

    def light(self, cx, sill_y, w, h, lights=3):
        c, t = self.c, self.s['trim']
        x, y = cx - w // 2, sill_y - h
        op.raised(c, x - 3, y - 3, w + 6, h + 6, t, 1)
        c.rect(x - 4, y - 5, w + 8, 2, t[0])
        casement(self, cx, sill_y, w, h, t, lights, 7 if h > 16 else 0)

    def paint(self):
        c, s = self.c, self.s
        L, R, eave, base = self.L, self.R, self.eave, self.base
        t, roof = s['trim'], s['roof']
        mid = (L + R) // 2
        pa, pb = self.porch
        dx, deck = self.door_x, base - 6
        fill = lambda x, y, w: shingles(c, x, y, w, 1, s['gable'])
        self.wall(L, eave, R - L, base - eave)
        brickwork(c, L, deck, R - L, 6, s['pier'], 4, self.seed)
        if self.side:
            ridge = eave - self.depth
            slates(c, self.x0, self.x1, ridge, eave, roof, 5, 8)
            c.rect(self.x0, ridge - 2, self.W, 2, roof[1])
            c.rect(self.x0, ridge, self.W, 1, roof[5])
            c.rect(self.x0, ridge, 1, self.depth, roof[1])
            c.rect(self.x1 - 1, ridge, 1, self.depth, roof[6])
            stack(self, R - 18 if self.seed % 2 else L + 18, ridge + 15, 14, 16, s['pier'], 2, brick=True)
            # A shed dormer: its wall in shingles, its roof from above.
            w, foot = 60, eave - 9
            x, top = mid - w // 2, eave - 23
            slates(c, x - 3, x + w + 3, top - 9, top, roof, 5, 8)
            c.rect(x - 3, top - 10, w + 6, 1, roof[1])
            shingles(c, x, top, w, foot - top, s['gable'])
            c.rect(x - 3, top, w + 6, 1, t[1])
            c.rect(x - 2, top + 1, w + 4, 1, t[4])
            op.cast(c, x, top + 2, w, 2, 0.7)
            for k in (-1, 0, 1):
                casement(self, mid + k * 18, foot - 1, 14, 9, t, 2)
            c.rect(x, foot, w, 1, roof[6])
            beam = eave
        else:
            half = (R - L) // 2 + 4
            gable(c, L, R, eave, self.g, roof, t, fill, self.depth, 4)
            sx = mid + round(half * 0.5) * (1 if pa == L else -1)
            stack(self, sx, eave - self.g // 2 - 3, 12, 12, s['pier'], 2, brick=True)
            gable(c, L, R, eave, self.g, roof, t, fill, 0, 4)
            # Purlin ends under the rake, and a light to the loft.
            for u in (-0.72, -0.36, 0, 0.36, 0.72):
                xx = mid + round(half * u)
                yy = eave - round(self.g * (1 - abs(xx - mid) / half)) + 2
                c.rect(xx - 1, yy, 3, 3, t[1])
                c.rect(xx - 1, yy + 3, 3, 1, t[5])
            self.light(mid + (5 if pa == L else -5), eave - 8, 14, 9, 2)
            c.rect(L, eave - 1, R - L, 1, t[0])
            c.rect(L, eave, R - L, 2, t[1])
            c.rect(L, eave + 2, R - L, 1, t[4])
            op.cast(c, L, eave + 3, R - L, 3, 0.68)
            beam = eave + 8
        # What the porch shelters, then its shade over all of it.
        p = SHOP[self.paint_door]
        dy = deck - 40
        op.raised(c, dx - 13, dy - 3, 26, 43, t, 1)
        panel_door(c, dx - 10, dy, 21, 40, p)
        pane(c, dx - 7, dy + 4, 15, 10)
        for xx in (dx - 3, dx + 2):
            c.rect(xx, dy + 4, 1, 10, p[2])
        self.panes.append((dx - 7, dy + 4, 15, 10, 'warm', True))
        if self.side:
            for cx in ((L + 11 + dx - 25) // 2, (dx + 25 + R - 11) // 2):
                self.light(cx, deck - 12, 32, 28)
        else:
            a, e = (pb, R) if pa == L else (L, pa)
            self.light((a + e) // 2, base - 18, min(e - a - 12, 34), 28)
        shade(c, pa, beam + 4, pb - pa, deck - beam - 4, 0.84)
        op.cast(c, pa, beam + 4, pb - pa, 6, 0.66)
        if not self.side:
            g = round(((pb - pa) // 2 + 2) * 0.45)
            gable(c, pa + 1, pb - 1, beam, g, roof, t, fill, 10, 3)
            pm = (pa + pb) // 2
            c.rect(pm - 4, beam - 8, 9, 5, t[4])
            for yy in (beam - 7, beam - 5):
                c.rect(pm - 3, yy, 7, 1, t[2])
        c.rect(pa - 2, beam - 1, pb - pa + 4, 1, t[0])
        c.rect(pa - 2, beam, pb - pa + 4, 3, t[1])
        c.rect(pa - 2, beam + 3, pb - pa + 4, 1, t[4])
        c.rect(pa, deck, pb - pa, 1, t[1])
        c.rect(pa, deck + 1, pb - pa, 5, t[3])
        c.rect(pa, deck + 5, pb - pa, 1, t[5])
        posts = [pa + 6, pb - 6] + ([dx - 21, dx + 21] if self.side else [])
        for a, e in zip(sorted(posts), sorted(posts)[1:]):
            for u, v in ((a + 6, min(e - 6, dx - 15)), (max(a + 6, dx + 15), e - 6)):
                if v - u >= 8 and not (u < dx < v):
                    rail(c, u, v, deck, t)
        for px in posts:
            pier_post(c, px, beam + 4, base, s['pier'], t)
        steps(c, dx, base, 22, 3, t)
        self.foot(PORTLAND)


# ------------------------------------------------------------------ the ranch house, 1945-1975

ASPHALT = [ramp(262, 0.012, lift=-0.2), ramp(60, 0.03, lift=-0.16), ramp(150, 0.028, lift=-0.15),
           ramp(30, 0.055, lift=-0.14)]
SLAB = fmod.CONCRETE


class Ranch(Home):
    """One storey, long and low under a hipped roof with deep eaves: a picture
    window, high bedroom windows with shutters that never shut, a wide low
    stack, and the car under the same roof or a flat one beside it."""
    H1 = 46

    def __init__(self, s, form='tall', cells=10, seed=0):
        self.site(s, form, cells, seed)
        L, R, W = self.L, self.R, self.W
        self.floors = 1
        self.garage = W >= 150
        self.car = 46 if self.garage else 30 if W >= 110 else 0
        self.left = seed % 2 == 0
        self.span = (L + self.car, R) if self.left else (L, R - self.car)
        a, e = self.span
        ws = e - a
        # From the end away from the car: the living room, the door, a bedroom.
        u = round(ws * (0.55 if ws >= 95 else 0.7))
        self.at = (lambda v: e - v) if self.left else (lambda v: a + v)
        self.door_x = self.at(u)
        self.door_size = (22, 44)
        self.live = (0, u - 14)
        self.bed = (u + 16, ws)
        self.depth = 26
        eave = self.HEAD + self.depth
        self.stand(eave, eave + self.H1)

    def wall(self, x, y, w, h):
        c, s = self.c, self.s
        sill_y = self.base - 17
        if s['kind'] == 'stucco':
            c.rect(x, y, w, h, s['wall'][1])
        elif s['kind'] == 'brick' or y >= sill_y:
            brickwork(c, x, y, w, h, s['brick'], 3, self.seed)
        else:
            siding(c, x, y, w, sill_y - y, s['wall'])
            brickwork(c, x, sill_y, w, y + h - sill_y, s['brick'], 3, self.seed)
            c.rect(x, sill_y - 1, w, 1, s['brick'][1])

    def paint(self):
        c, s = self.c, self.s
        L, R, eave, base = self.L, self.R, self.eave, self.base
        t, roof = s['trim'], s['roof']
        a, e = self.span
        at, dx = self.at, self.door_x
        ridge = eave - self.depth
        carport = self.car and not self.garage
        ra, rb = (a if carport and self.left else self.x0), (e if carport and not self.left else self.x1)
        hip(c, ra, rb, eave, self.depth, roof, 4, 10)
        stack(self, at(self.live[1] + 4), ridge + 15, 22, 11, s['brick'], 1, brick=True)
        self.wall(L, eave, R - L, base - eave)
        lo, hi = sorted((at(self.live[0]), at(self.live[1])))
        x0, x1 = (L if ra == self.x0 else a) - 3, (R if rb == self.x1 else e) + 3
        c.rect(x0, eave - 1, x1 - x0, 1, t[0])
        c.rect(x0, eave, x1 - x0, 2, t[1])
        c.rect(x0, eave + 2, x1 - x0, 1, t[4])
        op.cast(c, x0 + 3, eave + 3, x1 - x0 - 6, 5, 0.6)
        # The living room's window: a fixed light between two that open.
        w = min(44, hi - lo - 12)
        cx, sill_y = (lo + hi) // 2, base - 16
        x, y = casement(self, cx, sill_y, w, 26, t, 1)
        side = max(6, w // 5)
        for xx in (x + side, x + w - side - 1):
            c.rect(xx, y, 1, 26, t[1])
        for xx in (x + 1, x + w - side):
            c.rect(xx, y + 13, side - 1, 1, t[1])
        sill(c, x - 2, sill_y, w + 4, SLAB)
        if self.bed[1] - self.bed[0] >= 24:
            ba, bb = sorted((at(self.bed[0]), at(self.bed[1])))
            self.high((ba + bb) // 2, min(26, bb - ba - 14))
        if self.garage:
            ga = L if self.left else R - self.car
            garage_door(c, ga + 5, base - 34, 36, 32, t, 4, 4)
        elif carport:
            # A flat roof on two steel posts, the store at its back in shade.
            ca = L if self.left else e
            shade(c, ca, eave, self.car, base - eave, 0.62)
            c.rect(ca + 9, base - 38, 14, 36, t[5])
            c.rect(ca + 9, base - 38, 1, 36, t[4])
            fa, fb = (self.x0, a + 2) if self.left else (e - 2, self.x1)
            c.rect(fa, eave - 4, fb - fa, 8, fmod.FELT[3])
            c.rect(fa, eave - 4, fb - fa, 1, fmod.FELT[1])
            c.rect(fa, eave + 4, fb - fa, 1, t[0])
            c.rect(fa, eave + 5, fb - fa, 3, t[1])
            c.rect(fa, eave + 8, fb - fa, 1, t[4])
            op.cast(c, ca, eave + 9, self.car, 5, 0.7)
            px = fa + 3 if self.left else fb - 5
            c.rect(px, eave + 9, 2, base - eave - 9, IRON[3])
            c.rect(px, eave + 9, 1, base - eave - 9, IRON[1])
        c.rect(L, base - 3, R - L, 3, SLAB[3])
        c.rect(L, base - 3, R - L, 1, SLAB[1])
        # The door: a slab with three small lights stepping down it, a reeded light beside.
        p = SHOP[self.paint_door]
        dy = base - 2 - 40
        op.raised(c, dx - 16, dy - 3, 32, 43, t, 1)
        c.rect(dx - 13, dy, 21, 40, p[3])
        c.rect(dx - 13, dy, 1, 40, p[2])
        c.rect(dx - 13, dy, 21, 1, p[5])
        for k in range(3):
            c.rect(dx - 9 + k * 5, dy + 6 + k * 5, 4, 4, eu.PANE[5])
            c.rect(dx - 9 + k * 5, dy + 6 + k * 5, 4, 1, eu.PANE[7])
        c.rect(dx + 4, dy + 22, 2, 2, (232, 190, 96, 255))
        pane(c, dx + 9, dy, 5, 40)
        self.panes.append((dx + 9, dy, 5, 40, 'warm', True))
        steps(c, dx - 1, base, 34, 1, SLAB)
        self.foot(SLAB)

    def high(self, cx, w):
        """A bedroom window set high, shutters fixed open beside it."""
        c, s = self.c, self.s
        sill_y = self.base - 24
        x, y = casement(self, cx, sill_y, w, 14, s['trim'], 2)
        p = SHOP[s['door']]
        for sx in (x - 6, x + w + 1):
            c.rect(sx, y - 1, 5, 16, p[3])
            c.rect(sx, y - 1, 1, 16, p[2])
            for yy in range(y, y + 14, 2):
                c.rect(sx + 1, yy, 3, 1, p[4])
        sill(c, x - 1, sill_y, w + 2, SLAB)


# ------------------------------------------------------------------ the rendered house, 1950-2000

class Rendered(Home):
    """Two storeys in painted render under a low tiled roof: a balcony over
    the door, a shutter box on every window, a garage in the ground floor
    where the lot is wide."""
    HS = [50, 46]

    def __init__(self, s, form='tall', cells=10, seed=0):
        self.site(s, form, cells, seed)
        L, R = self.L, self.R
        self.floors = 2
        self.left = seed % 2 == 0
        self.garage = 44 if self.W >= 150 else 0
        a, e = (L + self.garage, R) if self.left else (L, R - self.garage)
        n = max(2, round((e - a) / 40))
        self.cols = [a + round((e - a) * (k + 0.5) / n) for k in range(n)]
        self.bay = (e - a) // n
        self.d = 0 if self.left else n - 1
        self.door_x, self.door_size = self.cols[self.d], (22, 44)
        self.depth = 26
        eave = self.HEAD + self.depth
        self.stand(eave, eave + sum(self.HS))

    def light(self, cx, sill_y, w, h, lights=2):
        """A window under its shutter box, the shutter part down in some."""
        c, s = self.c, self.s
        x, y = casement(self, cx, sill_y, w, h, s['frame'], lights)
        box = s['box']
        c.rect(x - 2, y - 5, w + 4, 5, box[2])
        c.rect(x - 2, y - 5, w + 4, 1, box[0])
        c.rect(x - 2, y - 1, w + 4, 1, box[4])
        down = int(h2(cx, sill_y, self.seed + 3) * 3) * (h // 4)
        for yy in range(y, y + down):
            c.rect(x + 1, yy, w - 2, 1, box[3] if (yy - y) % 3 == 2 else box[1])
        if sill_y < self.base - 6:
            sill(c, x - 2, sill_y, w + 4, s['trim'])

    def paint(self):
        c, s = self.c, self.s
        L, R, eave, base = self.L, self.R, self.eave, self.base
        t, roof, wall = s['trim'], s['roof'], s['wall']
        up = eave + self.HS[1]
        ridge = eave - self.depth
        if s.get('hip'):
            hip(c, self.x0, self.x1, eave, self.depth, roof, 4, 6)
        else:
            slates(c, self.x0, self.x1, ridge, eave, roof, 4, 6)
            c.rect(self.x0, ridge - 2, self.W, 2, roof[1])
            c.rect(self.x0, ridge, self.W, 1, roof[5])
            c.rect(self.x0, ridge, 2, self.depth, roof[1])
            c.rect(self.x1 - 2, ridge, 2, self.depth, roof[6])
        stack(self, self.cols[-1 if self.left else 0] + 8, ridge + 14, 12, 15, wall, 1)
        c.rect(L, eave, R - L, base - eave, wall[1])
        c.rect(L - 3, eave - 1, R - L + 6, 1, t[0])
        c.rect(L - 3, eave, R - L + 6, 2, t[2])
        c.rect(L - 3, eave + 2, R - L + 6, 1, t[4])
        op.cast(c, L, eave + 3, R - L, 4, 0.64)
        c.rect(L, base - 9, R - L, 9, wall[3])
        c.rect(L, base - 9, R - L, 1, wall[4])
        # The balcony runs over the door and the bay beside it.
        n, d = len(self.cols), self.d
        step = 1 if self.left else -1
        on = {d, d + step} if n > 2 or self.garage else {d}
        ends = sorted(self.cols[k] for k in on if 0 <= k < n)
        ba, bb = ends[0] - self.bay // 2 + 3, ends[-1] + self.bay // 2 - 3
        if self.garage:
            ba, bb = (L + 3, bb) if self.left else (ba, R - 3)
        for k, cx in enumerate(self.cols):
            if k == d:
                self.light(cx, up - 2, 20, 38)
            else:
                self.light(cx, up - 10, 24, 28)
            if k != d:
                self.light(cx, base - 16, 24, 26)
        if self.garage:
            ga = L if self.left else R - self.garage
            self.light(ga + self.garage // 2, up - 10, 24, 28)
            garage_door(c, ga + 4, base - 34, 36, 32, s['garage'], 4, 1 if s.get('boards') else 4)
        # The door: a glazed strip down it, a light beside, the balcony its porch.
        p = SHOP[self.paint_door]
        dx = self.door_x
        dy = base - 4 - 40
        op.raised(c, dx - 16, dy - 3, 32, 43, t, 2)
        c.rect(dx - 13, dy, 20, 40, p[3])
        c.rect(dx - 13, dy, 1, 40, p[2])
        pane(c, dx - 9, dy + 5, 5, 24)
        c.rect(dx + 3, dy + 21, 2, 3, WHITE[1])
        pane(c, dx + 8, dy, 6, 40)
        self.panes += [(dx - 9, dy + 5, 5, 24, 'warm', True), (dx + 8, dy, 6, 40, 'warm', True)]
        steps(c, dx - 1, base, 30, 2, SLAB)
        # The slab from above, its railing, its shadow on the wall under it.
        c.rect(ba, up - 3, bb - ba, 3, SLAB[1])
        c.rect(ba, up - 3, bb - ba, 1, SLAB[0])
        c.rect(ba, up, bb - ba, 3, SLAB[3])
        c.rect(ba, up + 3, bb - ba, 1, SLAB[5])
        op.cast(c, ba + 2, up + 4, bb - ba - 2, 6, 0.62)
        r = s['rail']
        if s.get('boards'):
            # Upright boards with a gap between, a rail along their tops.
            for xx in range(ba, bb):
                c.rect(xx, up - 16, 1, 15, r[5] if (xx - ba) % 5 == 4 else r[2] if (xx - ba) % 5 else r[1])
            c.rect(ba - 1, up - 18, bb - ba + 2, 2, r[1])
            c.rect(ba - 1, up - 16, bb - ba + 2, 1, r[4])
        else:
            c.rect(ba, up - 17, bb - ba, 1, r[1])
            c.rect(ba, up - 16, bb - ba, 1, r[3])
            for xx in range(ba, bb, 3):
                c.rect(xx, up - 15, 1, 12, r[2])
            for xx in (ba, bb - 2):
                c.rect(xx, up - 17, 2, 14, r[2])
        self.foot(SLAB)


# ------------------------------------------------------------------ the looks

DOORS = ['green', 'black', 'blue', 'oxblood', 'brown']
DUSK = ramp(238, 0.035, lift=-0.01)
UMBER = ramp(48, 0.06, lift=-0.16)
BARK = ramp(55, 0.05, lift=-0.2)
PEBBLE = ramp(80, 0.025, lift=-0.01)
BROWNTILE = ramp(40, 0.065, lift=-0.15)
MOSS = ramp(128, 0.04, lift=-0.1)
SALMON = ramp(32, 0.07, lift=0.0)
MINT = ramp(160, 0.035, lift=0.03)
ROSE = ramp(24, 0.04, lift=0.04)
PALEGREY = ramp(240, 0.008, lift=0.035)
ANTHRACITE = ramp(262, 0.012, lift=-0.22)
BROWN = SHOP['brown']
MAROON = ramp(22, 0.065, lift=-0.13)
NEW = {
    'villa': (Villa, 'Brick villa', [
        dict(kind='brick', wall=RED, roof=DARKSLATE, trim=WHITE, stack=RED, door='green', doors=DOORS, bay=2),
        dict(kind='brick', wall=STOCK, roof=DARKSLATE, trim=CREAM, stack=STOCK, door='black', doors=DOORS, bay=2,
             bands=True, band=RED),
        dict(kind='brick', wall=MAROON, roof=DARKSLATE, trim=CREAM, stack=MAROON, door='blue', doors=DOORS),
    ]),
    'villa-stucco': (Villa, 'Stucco villa', [
        dict(kind='stucco', wall=OCHRE, roof=TILE, trim=CREAM, stack=CREAM, door='brown', doors=DOORS, tower=True,
             shutter=eu.PERSIENNE[1]),
        dict(kind='stucco', wall=STUCCO, roof=DARKSLATE, trim=PORTLAND, stack=STUCCO, door='black', doors=DOORS,
             tower=True, cap='mansard', shutter=eu.PERSIENNE[0]),
        dict(kind='stucco', wall=ROSE, roof=TILE, trim=WHITE, stack=WHITE, door='green', doors=DOORS, tower=True,
             shutter=eu.PERSIENNE[2]),
    ]),
    'villa-board': (Villa, 'Weatherboard villa', [
        dict(kind='clap', wall=BUTTER, roof=SHINGLE, trim=WHITE, stack=RED, door='oxblood', doors=DOORS, gable=SAGE),
        dict(kind='clap', wall=DUSK, roof=DARKSLATE, trim=WHITE, stack=RED, door='oxblood', doors=DOORS, gable=CREAM),
        dict(kind='clap', wall=SAGE, roof=SHINGLE, trim=CREAM, stack=RED, door='brown', doors=DOORS, gable=BUTTER),
    ]),
    'suburban': (Suburban, 'Suburban house', [
        dict(kind='rough', wall=RED, upper=CREAM, roof=TILE, trim=WHITE, stack=RED, gable='timber', timber=BARK,
             door='green', doors=DOORS, bay=2, bay_body=CREAM, bay_roof=TILE, tiled=True),
        dict(kind='rough', wall=UMBER, upper=STUCCO, roof=BROWNTILE, trim=WHITE, stack=UMBER, gable='tile',
             door='oxblood', doors=DOORS, bay=2, bay_body=STUCCO, bay_roof=BROWNTILE, tiled=True),
        dict(kind='rough', ground='rough', wall=PEBBLE, upper=PEBBLE, roof=DARKSLATE, trim=WHITE, stack=RED,
             gable='plain', door='blue', doors=DOORS, bay=2, bay_body=PEBBLE, bay_roof=DARKSLATE),
        dict(kind='rough', wall=STOCK, upper=CREAM, roof=TILE, trim=CREAM, stack=STOCK, gable='timber', timber=UMBER,
             door='black', doors=DOORS, bay_body=CREAM, bay_roof=TILE, tiled=True),
    ]),
    'bungalow': (Bungalow, 'Bungalow', [
        dict(kind='clap', wall=SAGE, gable=MOSS, roof=SHINGLE, trim=CREAM, pier=RED, door='oxblood', doors=DOORS),
        dict(kind='shingle', wall=UMBER, gable=UMBER, roof=ASPHALT[2], trim=CREAM, pier=STOCK, door='green',
             doors=DOORS),
        dict(kind='stucco', wall=CREAM, gable=BARK, roof=BROWNTILE, trim=BARK, pier=RED, door='brown', doors=DOORS),
        dict(kind='clap', wall=BUTTER, gable=CREAM, roof=ASPHALT[0], trim=WHITE, pier=RED, door='blue', doors=DOORS),
    ]),
    'ranch': (Ranch, 'Ranch house', [
        dict(kind='wainscot', wall=WHITE, brick=SALMON, roof=ASPHALT[0], trim=WHITE, door='blue',
             doors=['blue', 'red', 'green']),
        dict(kind='brick', wall=CREAM, brick=BUFF, roof=ASPHALT[1], trim=CREAM, door='brown',
             doors=['brown', 'red', 'green']),
        dict(kind='stucco', wall=MINT, brick=RED, roof=ASPHALT[2], trim=WHITE, door='red',
             doors=['red', 'black', 'brown']),
        dict(kind='wainscot', wall=BUTTER, brick=RED, roof=ASPHALT[3], trim=WHITE, door='black',
             doors=['black', 'green', 'blue']),
    ]),
    'rendered': (Rendered, 'Rendered house', [
        dict(wall=STUCCO, roof=TILE, trim=PALEGREY, frame=BROWN, box=BROWN, rail=BROWN, garage=BROWN, boards=True,
             door='brown'),
        dict(wall=OCHRE, roof=TILE, trim=CREAM, frame=WHITE, box=PALEGREY, rail=IRON, garage=SHOP['green'],
             door='green', hip=True),
        dict(wall=PALEGREY, roof=ANTHRACITE, trim=WHITE, frame=WHITE, box=WHITE, rail=IRON, garage=WHITE,
             door='blue', doors=['blue', 'black', 'red']),
        dict(wall=ROSE, roof=BROWNTILE, trim=WHITE, frame=WHITE, box=PALEGREY, rail=WHITE, garage=BROWN,
             door='oxblood', hip=True),
    ]),
}
ABOUT = {
    'villa': ('bengal-brick', 'A brick villa in its own garden: a wing brought forward under a gable, a bay '
                              'window, a hooded door, and stacks with pots on a hipped slate roof.'),
    'villa-stucco': ('white-plaster', 'A stucco villa in the Italian manner: a tower, round-headed windows, a low '
                                     'roof on brackets and a columned porch.'),
    'villa-board': ('weatherboard', 'A weatherboard villa: a veranda across the front, a shingled gable over the '
                                 'bay, painted trim.'),
    'suburban': ('bengal-brick', 'A suburban house of 1900 to 1940: brick below and roughcast above under a tiled '
                                 'roof, a bay under a gable in black and white, a round-headed porch.'),
    'bungalow': ('weatherboard', 'A bungalow: a storey and a half under one broad low roof, a porch on tapered posts '
                              'and brick piers, shingles in the gable.'),
    'ranch': ('bengal-brick', 'A ranch house: one storey, long and low under a hipped roof with deep eaves, a '
                              'picture window, the car under the same roof.'),
    'rendered': ('white-plaster', 'A rendered house of 1950 to 2000: two storeys under a low tiled roof, a balcony '
                                 'over the door, shutter boxes, a garage in the ground floor.'),
}
FORMS = {k: 'cottage shop tall' for k in NEW}
fmod.LOOKS.update(NEW)
fmod.ABOUT.update(ABOUT)
fmod.FORMS.update(FORMS)
fmod.register()

SHOW = [('tall', 10), ('shop', 7), ('cottage', 6)]


def sheet(out, looks=(), zoom=2):
    """Every look in each colour at each of its forms, beside the adult."""
    from PIL import Image
    from art.reference import current_adult
    rows = []
    for look in looks or NEW:
        for v in range(len(NEW[look][2])):
            rows.append([fmod.house(look, v, form, n, 3 + v + k).build() for k, (form, n) in enumerate(SHOW)])
    pad = 14
    W = max(sum(i.width + pad for i in r) for r in rows) + 60
    H = sum(max(i.height for i in r) + pad for r in rows) + pad
    im = Image.new('RGBA', (W, H), (111, 143, 90, 255))
    y = pad
    man = current_adult()
    for r in rows:
        h = max(i.height for i in r)
        x = pad
        im.alpha_composite(man, (x, y + h - man.height - 9))
        x += man.width + 10
        for i in r:
            im.alpha_composite(i, (x, y + h - i.height))
            x += i.width + pad
        y += h + pad
    im.resize((W * zoom, H * zoom), Image.NEAREST).save(out)
    print(out, im.size)


if __name__ == '__main__':
    sheet(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'artifacts/homes.png'), sys.argv[2:])
