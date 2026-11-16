"""Detached houses in their own gardens, 1850 on: the villa of a city's best
streets, and the suburb's houses after it. One family for every city that
built in the European manner, as the street looks are.

    .venv/bin/python scripts/art/front_homes.py out.png      # every look, form and colour beside the adult

The villa, 1850 to 1914: two storeys under a hipped roof, a wing brought
forward under its own gable or a tower, a bay window, a porch at the door.
In red brick with stone dressings and slate; in Italianate stucco under a low
tiled roof on brackets, with a tower; in painted weatherboard with a veranda
and a shingled gable. Built on the street looks' base, so it shares their
lamplight, wear and outline.
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


def siding(c, x, y, w, h, r):
    """Painted weatherboard: one value, each board's lower edge a line."""
    for yy in range(y, y + h):
        c.rect(x, yy, w, 1, r[3] if yy % 5 == 4 else r[1] if yy % 5 == 0 else r[2])


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
        c.rect(a + 3, base - 13, d - a - 3, 1, r[0])
        c.rect(a + 3, base - 12, d - a - 3, 1, r[3])
        for xx in range(a + 5, d - 1, 3):
            c.rect(xx, base - 11, 1, 8, r[2])
        c.rect(a + 3, base - 3, d - a - 3, 1, r[3])


# ------------------------------------------------------------------ the villa

class Villa(Block):
    HEAD = 34

    def __init__(self, s, form='tall', cells=10, seed=0):
        self.s, self.form, self.seed = s, form or 'tall', seed
        self.W = cells * 16
        self.x0, self.x1 = 16, 16 + self.W
        self.panes, self.signs, self.neon, self.bulbs, self.lamps = [], [], {}, {}, []
        self.overlays, self.smoke, self.shop_signs = [], [], []
        W = self.W
        # Walls stand four pixels inside the footprint; the eaves reach its edges.
        self.L, self.R = self.x0 + 4, self.x1 - 4
        self.hs = [56, 48]
        self.floors = 2
        self.depth = 30 if W < 130 else 36
        self.wing = None
        if W >= 96:
            ww = max(40, min(66, round((self.R - self.L) * 0.42)))
            self.wing = (self.L, self.L + ww) if seed % 2 == 0 else (self.R - ww, self.R)
        tower = bool(self.wing and s.get('tower'))
        self.gable = round((self.wing[1] - self.wing[0]) * 0.42) if self.wing and not tower else 0
        self.tower = 40 if tower else 0
        self.eave = self.HEAD + max(self.depth, self.gable + 6, self.tower + 20)
        self.base = self.eave + sum(self.hs)
        self.c = C(self.x1 + 16, self.base + 10)
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
        course, cut = (4, 6) if s['kind'] == 'stucco' else (5, 8)
        hip(c, self.x0, self.x1, eave, self.depth, roof, course, cut)
        a, e = self.main()
        # Stacks stand on the roof, inside its outline.
        ridge = eave - self.depth
        for k, sx in enumerate([a + (e - a) // 4, e - (e - a) // 4] if e - a > 70 else [(a + e) // 2 + 14]):
            stack(self, sx, ridge + 10, 14, 16, s['stack'], 2, brick=s['kind'] != 'stucco', smoke=k == 0)
        self.wall(L, eave, R - L, base - eave)
        if self.wing:
            self.paint_wing()
        self.eaves(a, e)
        self.fronts(a, e)
        if s['kind'] != 'clap':
            plinth(c, L, base - 8, R - L, 8, PORTLAND)
        else:
            brickwork(c, L, base - 6, R - L, 6, RED, 4, self.seed)
            c.rect(L, base - 7, R - L, 1, s['trim'][1])
        self.entrance()
        self.foot(PORTLAND)

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
            hip(c, wl - 5, wr + 5, top, 14, s['roof'], 4, 6, 12)
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
            half = (wr - wl) // 2 + 3
            # The wing's roof runs back to the main one, both slopes showing.
            tiles_back(c, wl - 3, wr + 3, lambda x: eave - round(g * (1 - abs(x - mid) / half)), 14, s['roof'], mid)
            for yy in range(peak, eave):
                k = round(half * (yy - peak) / g)
                xa, xb = max(wl, mid - k), min(wr, mid + k)
                if xb > xa:
                    self.gable_fill(xa, yy, xb - xa)
            # Bargeboards along the rake, lit on top, and a finial.
            for xx in range(wl - 3, wr + 4):
                yy = eave - round(g * (1 - abs(xx - mid) / half))
                c.p(xx, yy - 2, t[0])
                c.p(xx, yy - 1, t[1])
                c.p(xx, yy, t[2])
                c.p(xx, yy + 1, t[4])
                q = c.g(xx, yy + 2)
                if q[3] and wl <= xx < wr:
                    c.p(xx, yy + 2, (int(q[0] * 0.7), int(q[1] * 0.7), int(q[2] * 0.76), 255))
            c.rect(mid - 1, peak - 9, 2, 9, t[1])
            c.rect(mid - 2, peak - 6, 4, 2, t[2])
            # A round light in the gable.
            if g >= 24:
                cy = eave - 9
                for yy in range(cy - 5, cy + 6):
                    for xx in range(mid - 5, mid + 5):
                        d = math.hypot(xx - mid + 0.5, yy - cy + 0.5)
                        if d < 5:
                            c.p(xx, yy, (t[1] if xx < mid else t[3]) if d >= 3.6 else eu.PANE[7] if yy < cy else eu.PANE[6])
            bw = min(wr - wl - 8, 46)
            if s.get('bay') == 2 and wr - wl >= 50:
                bay_window(self, mid, eave + 12, base, bw, 2, WHITE, PORTLAND if s['kind'] == 'brick' else t, LEAD)
            else:
                bay_window(self, mid, eave + self.hs[1] + 10, base, bw, 1, WHITE, t, LEAD)
                for cx in (mid - 11, mid + 11):
                    self.window(cx, eave + self.hs[1] - 8, 14, 30, True)
        # The wing stands forward: its lit corner, and its shadow on the main wall.
        if left:
            cast_right(c, wr, eave + 1, base - eave - 1, 4, 0.66)
        else:
            c.rect(wl, eave + 1, 1, base - eave - 1, s['wall'][1])

    def gable_fill(self, x, y, w):
        c, s = self.c, self.s
        if s['kind'] == 'clap':
            # Fish-scale shingles in the gable.
            r = s['gable']
            for xx in range(x, x + w):
                row = y // 4
                lx = (xx + (row % 2) * 3) % 6
                c.p(xx, y, r[4] if y % 4 == 3 and lx in (0, 5) else r[3] if y % 4 == 3 else r[1] if y % 4 == 0 else r[2])
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
        p = SHOP[s['door']]
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


# ------------------------------------------------------------------ the looks

NEW = {
    'villa': (Villa, 'Villa', [
        dict(kind='brick', wall=RED, roof=DARKSLATE, trim=WHITE, stack=RED, door='green', bay=2),
        dict(kind='stucco', wall=OCHRE, roof=TILE, trim=CREAM, stack=CREAM, door='brown', tower=True),
        dict(kind='clap', wall=BUTTER, roof=SHINGLE, trim=WHITE, stack=RED, door='oxblood', gable=SAGE),
    ]),
}
ABOUT = {
    'villa': ('bengal-brick', 'A villa in its own garden: a wing brought forward under a gable or a tower, a bay '
                              'window, a porch at the door, and stacks with pots on a hipped roof.'),
}
FORMS = dict(villa='cottage shop tall')
fmod.LOOKS.update(NEW)
fmod.ABOUT.update(ABOUT)
fmod.FORMS.update(FORMS)
fmod.register()

SHOW = {'villa': [('tall', 10), ('shop', 7), ('cottage', 6)]}


def sheet(out, zoom=2):
    """Every look in each colour at each of its forms, beside the adult."""
    from PIL import Image
    from art.reference import current_adult
    rows = []
    for look, (cls, _, colours) in NEW.items():
        for v in range(len(colours)):
            rows.append([fmod.house(look, v, form, n, 3 + v + k).build() for k, (form, n) in enumerate(SHOW[look])])
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
    sheet(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'artifacts/homes.png'))
