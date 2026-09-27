"""Civic landmarks for the industrial city, drawn to the city kit's standard.

    .venv/bin/python scripts/art/city_civic.py artifacts/city-kit/civic.png

A hotel de ville of the Third Republic and its cousins across Europe: a
rusticated arcade, a piano nobile of pedimented windows between pilasters, a
balustraded cornice and a slate mansard, with pavilions that break forward at
the ends and a centre that rises to a clock and a belfry.
"""
from pathlib import Path
import math
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.city_kit import (  # noqa: E402
    C, Oblique, TownHouse, BRICK, GLASS, GOLD, IRON, LIME, WARM_LIME, OAK, SLATE, INK,
    STOREY, french_window, glass, h2, mix, outline, rgba, sphere,
)

ZINC = ['#2c3038', '#4a525c', '#6d7680', '#98a2aa', '#c4ccd0']
DIAL = ['#2a2630', '#e9e4d4', '#fbf6e8']
BANNERS = [('#8e2a2e', '#e8d9a8'), ('#27406e', '#e8d9a8'), ('#2d5a3e', '#e8d9a8'), ('#6a2a5a', '#e8d9a8')]

BAY = 24
ARCADE = 58
NOBILE = 50
SECOND = 40
CORNICE = 11
BALUSTRADE = 9
MANSARD = 36


def rustication(c, x0, x1, y0, y1, st, seed):
    """Banded ashlar: deep channels every six rows, the stone below each lit,
    head joints staggered and only every other block cut."""
    for y in range(y0, y1 + 1):
        k = (y - y0) % 6
        for x in range(x0, x1 + 1):
            if k == 0:
                col = st[1]
            elif k == 1:
                col = st[5]
            elif k == 5:
                col = st[3]
            else:
                col = st[4]
            row = (y - y0) // 6
            if 1 <= k <= 4 and (x + row * 11) % 22 == 0:
                col = st[2] if k > 1 else st[3]
            c.px(x, y, col)


def ashlar(c, x0, x1, y0, y1, st, seed):
    """Smooth dressed stone: fine courses a half-step down, broad weathering
    that darkens toward the ground."""
    for y in range(y0, y1 + 1):
        course = (y - y0) % 8 == 7
        for x in range(x0, x1 + 1):
            col = st[4]
            if course:
                col = mix(st[4], st[3], 0.6)
            elif (x + ((y - y0) // 8) * 13) % 26 == 0:
                col = mix(st[4], st[3], 0.45)
            elif h2(x // 13, (y - y0) // 8, seed) > 0.88:
                col = mix(st[4], st[5], 0.35)
            c.px(x, y, col)


def pilaster(c, x, y0, y1, st, w=4):
    """A flat pilaster: lit left arris, its face, a shadow down the right, a
    capital and a base a pixel proud of the shaft."""
    c.rect(x, y0, x + w - 1, y1, st[5])
    c.vl(x, y0, y1, st[6])
    c.vl(x + w - 1, y0, y1, st[2])
    c.vl(x + w, y0 + 3, y1, mix(st[4], st[2], 0.55))
    for i, col in enumerate((st[6], st[5], st[3])):
        c.hl(x - 1, x + w, y0 + i, col)
    c.hl(x - 1, x + w, y1 - 1, st[5])
    c.hl(x - 1, x + w, y1, st[2])


def cornice(c, x0, x1, y, st, deep=True):
    """Crown moulding over dentils and modillions; its soffit throws a band
    of shadow onto the frieze below."""
    c.rect(x0, y, x1, y + CORNICE - 1, st[4])
    c.hl(x0, x1, y, st[6])
    c.hl(x0, x1, y + 1, st[5])
    c.hl(x0, x1, y + 2, st[3])
    c.hl(x0, x1, y + 3, st[5])
    for x in range(x0, x1 + 1):
        if (x - x0) % 8 in (0, 1, 2):
            c.px(x, y + 4, st[5])
            c.px(x, y + 5, st[4] if (x - x0) % 8 < 2 else st[2])
        else:
            c.px(x, y + 4, st[2])
            c.px(x, y + 5, st[1])
        c.px(x, y + 6, st[5] if (x - x0) % 3 else st[2])
    c.hl(x0, x1, y + 7, st[3])
    c.hl(x0, x1, y + 8, st[5])
    c.hl(x0, x1, y + 9, st[2])
    c.hl(x0, x1, y + 10, st[1])
    if deep:
        for x in range(x0, x1 + 1):
            p = c.get(x, y + 11)
            if p[3]:
                c.px(x, y + 11, mix(p, st[1], 0.5))
                q = c.get(x, y + 12)
                if q[3] and (x + y) % 2:
                    c.px(x, y + 12, mix(q, st[1], 0.3))


def balustrade(c, x0, x1, y, st):
    """Coping, turned balusters in the shade of the rail, a plinth rail."""
    h = BALUSTRADE
    c.hl(x0, x1, y, st[6])
    c.hl(x0, x1, y + 1, st[4])
    c.hl(x0, x1, y + 2, st[2])
    for x in range(x0, x1 + 1):
        k = (x - x0) % 4
        for yy in range(y + 3, y + h - 2):
            t = yy - (y + 3)
            bulge = 1 if 1 <= t <= 2 else 0
            if k == 1 or (k == 2 and bulge):
                c.px(x, yy, st[5] if k == 1 else st[3])
            elif k == 0 and bulge:
                c.px(x, yy, st[4])
            else:
                c.px(x, yy, (0, 0, 0, 0))
    c.hl(x0, x1, y + h - 2, st[5])
    c.hl(x0, x1, y + h - 1, st[3])
    for x in (x0, x1 - 3):
        c.rect(x, y, x + 3, y + h - 1, st[5])
        c.vl(x + 3, y + 1, y + h - 1, st[2])
        c.hl(x, x + 3, y, st[6])


def arch(c, cx, top, w, bottom, st, seed, door=False):
    """A round-headed arcade opening: rusticated voussoirs and a keystone, a
    deep reveal in shade, and glazed doors in the gloom beyond."""
    r = w / 2
    spring = top + int(r)
    x0, x1 = int(cx - r), int(cx + r) - 1
    for y in range(top - 4, bottom + 1):
        for x in range(x0 - 4, x1 + 5):
            dx = x + 0.5 - cx
            if y < spring:
                dy = spring - y
                d = math.hypot(dx, dy)
                if r - 0.5 < d <= r + 3.5:
                    ang = math.atan2(dy, dx)
                    joint = abs(((ang / math.pi) * 7) % 1 - 0.5) > 0.44
                    c.px(x, y, st[2] if joint else st[6] if dx < 0 else st[4])
                    if d > r + 2.5:
                        c.px(x, y, st[2])
    for y in range(top, bottom + 1):
        for x in range(x0, x1 + 1):
            dx = x + 0.5 - cx
            if y < spring and math.hypot(dx, spring - y) > r - 0.5:
                continue
            depth = (y - top) / max(1, bottom - top)
            col = mix(st[1], st[2], 0.2 + 0.3 * depth)
            if x - x0 < 3:
                col = mix(st[3], st[2], (x - x0) / 3)
            elif y - top < 4 and y < spring:
                col = mix(col, INK, 0.3)
            c.px(x, y, col)
    iw = int(r) - 3
    gx0, gx1 = int(cx) - iw, int(cx) + iw - 1
    gy0 = spring - 1
    for y in range(top + 3, gy0):
        for x in range(gx0, gx1 + 1):
            d = math.hypot(x + 0.5 - cx, spring - y)
            if d <= r - 3:
                ang = math.degrees(math.atan2(spring - y, x + 0.5 - cx))
                spoke = min(abs(ang - a) for a in (30, 60, 90, 120, 150)) < 6
                c.px(x, y, OAK[1] if spoke or d > r - 4 else GLASS[3] if spring - y > 3 else GLASS[2])
    c.hl(gx0, gx1, gy0 - 1, OAK[1])
    if door:
        c.rect(gx0, gy0, gx1, bottom, OAK[1])
        for x in range(gx0, gx1 + 1):
            if (x - gx0) % 4 == 0:
                c.vl(x, gy0, bottom, OAK[0])
        glass(c, gx0 + 2, gy0 + 3, gx1 - 2, gy0 + 16, seed)
        c.vl(int(cx) - 1, gy0, bottom, OAK[0])
        c.px(int(cx) - 3, gy0 + 22, GOLD[2])
        c.px(int(cx) + 2, gy0 + 22, GOLD[2])
    else:
        glass(c, gx0, gy0, gx1, bottom - 8, seed)
        for x in (gx0 + (gx1 - gx0) // 3, gx0 + 2 * (gx1 - gx0) // 3):
            c.vl(x, gy0, bottom - 8, mix(OAK[1], INK, 0.3))
        c.rect(gx0, bottom - 7, gx1, bottom, mix(OAK[1], INK, 0.3))
    for y in range(top - 4, top + 2):
        for x in range(int(cx) - 2, int(cx) + 2):
            c.px(x, y, st[6] if x < cx - 1 else st[5])
    c.hl(int(cx) - 2, int(cx) + 1, top + 2, st[2])


def dormer(c, cx, bottom, st, seed, round_=False):
    """A stone aedicule dormer with a segmental head, or an oeil-de-boeuf."""
    if round_:
        r = 6
        cy = bottom - 9
        c.ellipse(cx, cy, r + 3, r + 3, st[5])
        c.ellipse(cx + 0.7, cy + 0.7, r + 2, r + 2, st[3])
        c.ellipse(cx, cy, r + 2, r + 2, st[5])
        c.ellipse(cx, cy, r, r, GLASS[1])
        c.ellipse(cx - 1, cy - 1, r - 2, r - 2, GLASS[2])
        c.px(int(cx) - 2, int(cy) - 3, GLASS[4])
        c.rect(int(cx) - 1, int(cy - r - 4), int(cx) + 1, int(cy - r - 1), st[6])
        return
    w, h = 12, 22
    x0 = cx - w // 2
    top = bottom - h
    c.rect(x0 - 3, top, x0 + w + 2, bottom, st[5])
    c.vl(x0 - 3, top, bottom, st[6])
    c.vl(x0 + w + 2, top + 2, bottom, st[2])
    c.rect(x0, top + 5, x0 + w - 1, bottom - 2, '#e9e3d6')
    glass(c, x0 + 1, top + 6, x0 + w - 2, bottom - 3, seed)
    c.vl(cx, top + 6, bottom - 3, '#e9e3d6')
    c.hl(x0 + 1, x0 + w - 2, top + 11, '#e9e3d6')
    for i in range(w + 8):
        t = i / (w + 7)
        y = top - round(math.sin(t * math.pi) * 5)
        c.px(x0 - 4 + i, y - 1, st[6])
        c.px(x0 - 4 + i, y, st[5])
        for yy in range(y + 1, top + 3):
            c.px(x0 - 4 + i, yy, st[4])
    c.hl(x0 - 4, x0 + w + 3, top + 3, st[2])
    c.rect(x0 + w + 3, top + 2, x0 + w + 4, bottom, SLATE[1])


def return_(c, x, bands):
    """The building's east face, turned almost away: a strip DRIFT wide
    beside the front's right edge, its top level with whatever roof or
    parapet stands over it. `bands` is [(y0, y1, colour)] top down."""
    from art.oblique_style import DRIFT
    for y0, y1, col in bands:
        for y in range(y0, y1 + 1):
            for i in range(DRIFT):
                c.px(x + i, y, mix(col, INK, 0.12 * i))


class HotelDeVille(Oblique):
    """The town hall of a boulevard-age city, from a sub-prefecture's five
    bays to a capital's thirteen with pavilions and a campanile."""

    def __init__(self, W=256, sd=14, seed=0, stone=WARM_LIME, storeys=3):
        self.seed, self.stone = seed, stone
        n = (W - 8) // BAY
        if n % 2 == 0:
            n -= 1
        self.n = n
        self.mx = (W - n * BAY) // 2
        self.ends = 2 if n >= 13 else 1 if n >= 9 else 0
        self.centre = 3 if n >= 9 else 1
        self.storeys = storeys
        wall = ARCADE + NOBILE + (SECOND if storeys >= 3 else 0)
        self.belfry = 70 if n >= 13 else 52 if n >= 9 else 34
        super().__init__(W, wall, CORNICE + MANSARD + 28 + self.belfry, sd)

    def bays(self):
        return [self.mx + k * BAY + BAY // 2 for k in range(self.n)]

    def span(self, ks):
        axes = self.bays()
        return axes[ks[0]] - BAY // 2, axes[ks[-1]] + BAY // 2 - 1

    def render(self):
        W, H, c, st, sd = self.W, self.H, self.c, self.stone, self.sd
        n, e, m = self.n, self.ends, self.centre
        axes = self.bays()
        wall_top = H - self.wall
        cor = wall_top - CORNICE
        T = cor - MANSARD
        mid = n // 2
        centre = list(range(mid - m // 2, mid + m // 2 + 1))
        ends = [list(range(0, e)), list(range(n - e, n))] if e else []
        pav = set(centre) | {k for g in ends for k in g}

        return_(c, W, [(T, cor - 1, SLATE[1]), (cor, wall_top - 1, st[3]), (wall_top, H - 1, st[2])])

        # Mansard over the wings, bellied: steep at the eave, easing at the top.
        for y in range(T, cor):
            t = (cor - y) / MANSARD
            inset = round(6 * t ** 1.6)
            for x in range(inset, W - inset // 3):
                row = (y - T) // 3
                col = SLATE[3]
                if (y - T) % 3 == 2:
                    col = SLATE[2]
                elif (x + (row % 2) * 3) % 6 == 0:
                    col = SLATE[2]
                elif (x + (row % 2) * 3) % 6 == 1 and t > 0.5:
                    col = SLATE[4]
                if x == inset:
                    col = SLATE[5]
                c.px(x, y, col)
        c.hl(4, W - 3, T, ZINC[4])
        c.hl(4, W - 3, T + 1, ZINC[2])
        for x in range(6, W - 4, 5):
            c.vl(x, T - 3, T - 1, IRON[1])
            c.px(x, T - 4, IRON[3])
        c.hl(6, W - 5, T - 2, IRON[1])

        # Walls: ashlar above a rusticated arcade.
        gy = H - ARCADE
        ashlar(c, 0, W - 1, wall_top, gy - 1, st, self.seed)
        rustication(c, 0, W - 1, gy, H - 6, st, self.seed)
        c.rect(0, H - 5, W - 1, H - 1, st[3])
        c.hl(0, W - 1, H - 5, st[5])
        c.hl(0, W - 1, H - 1, st[1])
        # A projecting pavilion is lit on its west face and throws a band of
        # shade on the recessed wing east of it.
        for g in [centre] + ends:
            x0, x1 = self.span(g)
            pass
        # The wings stand back from the pavilions, a half-step darker.
        for x in range(W):
            k = (x - self.mx) // BAY
            if 0 <= k < n and k in pav:
                continue
            for y in range(wall_top, H - 5):
                p = c.get(x, y)
                c.px(x, y, mix(p, st[2], 0.14))
        # Stringcourse and balcony slab between arcade and piano nobile.
        c.rect(0, gy - 5, W - 1, gy - 1, st[5])
        c.hl(0, W - 1, gy - 5, st[6])
        c.hl(0, W - 1, gy - 2, st[3])
        c.hl(0, W - 1, gy - 1, st[1])
        for x in range(1, W - 1, 3):
            c.px(x, gy, st[2])

        # Arcade.
        for k, ax in enumerate(axes):
            door = k in centre
            arch(c, ax + 0.5, gy + 12, 18, H - 6, st, self.seed + k, door=door)

        # Piano nobile: tall casements under alternating pediments, a
        # balconette to each, pilasters between the bays.
        ny = gy - 5 - NOBILE
        for k, ax in enumerate(axes):
            wx, ww, wh = ax - 6, 12, 30
            wy = ny + 12
            french_window(c, wx, wy, ww, wh, st, self.seed + k * 3, curtain=h2(k, 1, self.seed) < 0.5)
            if k in pav:
                self.round_head(wx, wy, ww)
            else:
                self.window_head(wx, wy, ww, False, k % 2 == 1)
            c.rect(wx - 3, wy + wh + 2, wx + ww + 2, wy + wh + 3, st[5])
            c.hl(wx - 3, wx + ww + 2, wy + wh + 4, st[1])
            for x in range(wx - 2, wx + ww + 2, 3):
                c.vl(x, wy + wh - 6, wy + wh + 1, IRON[1])
            c.hl(wx - 2, wx + ww + 1, wy + wh - 7, IRON[2])
            c.hl(wx - 2, wx + ww + 1, wy + wh - 3, IRON[1])
        for k in range(n + 1):
            x = self.mx + k * BAY - 2
            paired = (k in pav) != ((k - 1) in pav) or k in (0, n)
            y1 = gy - 6
            y0 = ny + 3 if self.storeys < 3 else ny + 3 - SECOND
            if not paired:
                pilaster(c, x, y0, y1, st)
        for g in [centre] + ends:
            x0, x1 = self.span(g)
            self.quoins(x0 - 2, x1 + 2, (ny + 3 if self.storeys < 3 else ny + 3 - SECOND), gy - 6)

        x0c, x1c = self.span(centre)
        c.rect(x0c - 2, ny + NOBILE - 6, x1c + 2, ny + NOBILE - 4, st[5])
        c.hl(x0c - 2, x1c + 2, ny + NOBILE - 6, st[6])
        c.hl(x0c - 2, x1c + 2, ny + NOBILE - 3, st[1])
        for x in range(x0c - 1, x1c + 2, 3):
            c.vl(x, ny + NOBILE - 13, ny + NOBILE - 7, IRON[1])
        c.hl(x0c - 1, x1c + 1, ny + NOBILE - 14, IRON[2])
        c.hl(x0c - 1, x1c + 1, ny + NOBILE - 10, IRON[1])
        for k in range(centre[0], centre[-1] + 2):
            x = self.mx + k * BAY - 3
            self.column(x, ny + 2, gy - 7)

        # Second storey: shorter windows with keystone heads.
        if self.storeys >= 3:
            sy = ny - SECOND
            c.rect(0, ny - 2, W - 1, ny, st[5])
            c.hl(0, W - 1, ny - 2, st[6])
            c.hl(0, W - 1, ny, st[2])
            for k, ax in enumerate(axes):
                wx, wy = ax - 5, sy + 10
                french_window(c, wx, wy, 10, 22, st, self.seed + 40 + k)
                c.rect(wx - 3, wy - 5, wx + 12, wy - 3, st[5])
                c.hl(wx - 3, wx + 12, wy - 5, st[6])
                c.hl(wx - 3, wx + 12, wy - 2, st[2])
                c.rect(ax - 2, wy - 7, ax + 1, wy - 2, st[6])
                c.vl(ax + 1, wy - 6, wy - 2, st[3])

        # Cornice and balustrade over the wings; pavilions rise past them.
        cornice(c, 0, W - 1, cor, st)
        for k0, k1 in self.runs([k for k in range(n) if k not in pav]):
            x0, x1 = self.span(list(range(k0, k1 + 1)))
            balustrade(c, x0, x1, cor - BALUSTRADE + 1, st)
        for g in ends:
            self.pavilion_roof(*self.span(g), cor, T)
        self.centre_pavilion(*self.span(centre), cor, T, wall_top)

        # Dormers on the wing axes.
        for k, ax in enumerate(axes):
            if k not in pav:
                dormer(c, ax, cor - 2, st, self.seed + k)

        # Lamps on pedestals either side of the doors, and a flight of steps.
        x0, x1 = self.span(centre)
        for i in range(3):
            y = H - 5 + i * 2
            c.rect(x0 + 4 - i * 2, y, x1 - 4 + i * 2, y + 1, st[4])
            c.hl(x0 + 4 - i * 2, x1 - 4 + i * 2, y, st[6])
        self.door_x = (x0 + x1) // 2 + 1
        return outline(c.im)

    def quoins(self, x0, x1, y0, y1):
        """Long and short rusticated blocks turning each pavilion's corners,
        lit on the west, shaded on the east, and the pavilion's own shadow
        thrown on the wing beside it."""
        c, st = self.c, self.stone
        for i, y in enumerate(range(y0 + 2, y1 - 4, 7)):
            for left in (True, False):
                w = 8 if (i % 2) == left else 5
                xa = x0 if left else x1 - w + 1
                c.rect(xa, y, xa + w - 1, y + 5, st[5])
                c.hl(xa, xa + w - 1, y, st[6])
                c.hl(xa, xa + w - 1, y + 5, st[2])
                c.vl(xa + w - 1 if left else xa, y, y + 5, st[3] if left else st[6])
        for y in range(y0, y1):
            for k in range(1, 4):
                x = x1 + k
                q = c.get(x, y)
                if q[3] and x < self.W:
                    c.px(x, y, mix(q, st[1], (0.5, 0.3, 0.15)[k - 1]))
        for y in range(y0, y1):
            c.px(x0, y, st[6])

    @staticmethod
    def runs(ks):
        out, start = [], None
        for i, k in enumerate(ks):
            if start is None:
                start = k
            if i == len(ks) - 1 or ks[i + 1] != k + 1:
                out.append((start, k))
                start = None
        return out

    def column(self, x, y0, y1):
        """An engaged column, shaded round: lit left of centre, the shadow
        side darkest at the right, fluting as two faint lines, a capital."""
        c, st = self.c, self.stone
        ramp = [st[2], st[3], st[5], st[6], st[5], st[4], st[3], st[2]]
        for i, col in enumerate(ramp):
            c.vl(x + i - 1, y0 + 4, y1 - 3, col)
        for i in (2, 5):
            for y in range(y0 + 6, y1 - 4, 2):
                c.px(x + i - 1, y, mix(ramp[i], st[1], 0.3))
        c.rect(x - 3, y0, x + 8, y0 + 3, st[5])
        c.hl(x - 3, x + 8, y0, st[6])
        c.hl(x - 2, x + 7, y0 + 3, st[2])
        for xx in (x - 3, x + 7):
            c.px(xx, y0 + 1, st[3])
        c.rect(x - 2, y1 - 2, x + 7, y1, st[5])
        c.hl(x - 2, x + 7, y1, st[2])

    def round_head(self, x, y, w):
        """A pavilion window rises into a glazed semicircle under an
        archivolt with a carved keystone and garlands in the spandrels."""
        c, st = self.c, self.stone
        r = w / 2 + 0.5
        cx = x + w / 2 - 0.5
        for yy in range(int(y - r - 4), y + 1):
            for xx in range(x - 4, x + w + 4):
                d = math.hypot(xx + 0.5 - cx - 0.5, y - yy)
                if yy > y:
                    continue
                if d <= r - 1:
                    ang = math.degrees(math.atan2(y - yy, xx + 0.5 - cx - 0.5))
                    spoke = min(abs(ang - a) for a in (45, 90, 135)) < 8
                    c.px(xx, yy, '#e9e3d6' if spoke or d > r - 2 else GLASS[3] if y - yy > 3 else GLASS[2])
                elif d <= r + 2:
                    c.px(xx, yy, st[6] if xx < cx else st[4])
                elif d <= r + 3:
                    c.px(xx, yy, st[2])
        c.hl(x, x + w - 1, y, '#e9e3d6')
        k = int(cx)
        c.rect(k - 1, int(y - r - 5), k + 2, int(y - r), st[6])
        c.vl(k + 2, int(y - r - 4), int(y - r), st[3])
        for s_ in (-1, 1):
            for i in range(5):
                gx = int(cx + s_ * (r + 3 + i * 0.6))
                gy_ = int(y - r + 1 + i)
                c.px(gx, gy_, '#8fa87a' if i % 2 else st[5])

    def window_head(self, x, y, w, pav, segmental):
        """Triangular and segmental pediments on consoles; a pavilion's are
        richer, with a carved cartouche in the tympanum."""
        c, st = self.c, self.stone
        x0, x1 = x - 4, x + w + 3
        c.rect(x0, y - 5, x1, y - 3, st[5])
        c.hl(x0, x1, y - 5, st[6])
        c.hl(x0, x1, y - 2, st[1])
        for cx in (x0 + 1, x1 - 1):
            c.vl(cx, y - 2, y + 4, st[5])
            c.vl(cx + 1, y - 2, y + 4, st[2])
        half = (x1 - x0) / 2
        rise = 7 if pav else 5
        for i in range(x1 - x0 + 1):
            t = i / (x1 - x0)
            h = round(math.sin(t * math.pi) * rise) if segmental else round((1 - abs(2 * t - 1)) * rise)
            for yy in range(y - 5 - h, y - 5):
                c.px(x0 + i, yy, st[4] if i > half else st[5])
            c.px(x0 + i, y - 6 - h, st[6] if i <= half else st[5])
        if pav:
            cx = int(x0 + half)
            c.rect(cx - 2, y - 9, cx + 2, y - 6, st[3])
            c.px(cx, y - 8, GOLD[2])
            c.px(cx - 1, y - 7, st[5])

    def pavilion_roof(self, x0, x1, cor, T):
        """A pavilion's own steep roof, taller than the mansard, with a round
        dormer, iron cresting and finials at the corners."""
        c = self.c
        top = T - 16
        for y in range(top, cor):
            t = (y - top) / (cor - top)
            inset = round((1 - t) * 7)
            for x in range(x0 + inset, x1 - inset + 1):
                row = (y - top) // 3
                col = SLATE[3]
                if (y - top) % 3 == 2:
                    col = SLATE[2]
                elif (x + (row % 2) * 3) % 6 == 0:
                    col = SLATE[2]
                if x - (x0 + inset) < 2:
                    col = SLATE[5] if x == x0 + inset else SLATE[4]
                elif x1 - inset - x < 2:
                    col = SLATE[1]
                c.px(x, y, col)
        c.hl(x0 + 7, x1 - 7, top, ZINC[4])
        c.hl(x0 + 7, x1 - 7, top + 1, ZINC[2])
        for x in range(x0 + 8, x1 - 7, 3):
            c.vl(x, top - 4, top - 1, IRON[1])
            c.px(x, top - 5, IRON[3])
        for x in (x0 + 7, x1 - 7):
            c.vl(x, top - 9, top - 1, IRON[1])
            sphere(c, x + 0.5, top - 10, 1.8, ZINC)
        dormer(self.c, (x0 + x1) // 2, cor - 4, self.stone, self.seed, round_=True)

    def centre_pavilion(self, x0, x1, cor, T, wall_top):
        """Pediment with a carved tympanum, an attic with the clock, a steep
        roof and the belfry over all."""
        c, st = self.c, self.stone
        cx = (x0 + x1) // 2
        # Attic storey with the clock, standing on the main cornice.
        at = cor - 22
        c.rect(x0 + 2, at, x1 - 2, cor - 1, st[4])
        c.vl(x0 + 2, at, cor - 1, st[6])
        c.vl(x1 - 2, at, cor - 1, st[2])
        # Pediment across the whole pavilion.
        pw = x1 - x0
        prise = max(14, pw // 4)
        py = at
        for i in range(pw + 7):
            t = i / (pw + 6)
            h = round((1 - abs(2 * t - 1)) * prise)
            x = x0 - 3 + i
            for yy in range(py - h, py + 1):
                c.px(x, yy, st[4] if t > 0.5 else st[5])
            c.px(x, py - h - 1, st[6] if t <= 0.5 else st[5])
            c.px(x, py - h - 2, st[5] if t <= 0.5 else st[3])
            c.px(x, py - h, st[3])
        for i in range(4, pw + 3):
            t = i / (pw + 6)
            h = round((1 - abs(2 * t - 1)) * prise) - 4
            for yy in range(py - h, py - 1):
                if h > 0:
                    c.px(x0 - 3 + i, yy, mix(st[3], st[2], 0.3))
        c.hl(x0 - 3, x1 + 3, py, st[6])
        c.hl(x0 - 3, x1 + 3, py + 1, st[3])
        c.hl(x0 - 3, x1 + 3, py + 2, st[1])
        # A relief in the tympanum: a seated figure with a wreath each side.
        ty = py - 2
        lit = [st[2], st[4], st[5], st[6]]
        # An escutcheon under a crown, and a reclining figure either side.
        c.rect(cx - 4, ty - 11, cx + 4, ty - 3, st[5])
        c.vl(cx - 4, ty - 11, ty - 3, st[6])
        c.vl(cx + 4, ty - 11, ty - 3, st[2])
        for i in range(4):
            c.hl(cx - 3 + i, cx + 3 - i, ty - 3 + i // 2, st[5])
        c.rect(cx - 2, ty - 9, cx + 2, ty - 6, GOLD[1])
        c.px(cx, ty - 8, GOLD[3])
        for x in (cx - 4, cx, cx + 4):
            c.px(x, ty - 13, GOLD[2])
        c.hl(cx - 4, cx + 4, ty - 12, GOLD[1])
        for s_ in (-1, 1):
            hx = cx + s_ * 9
            sphere(c, hx + 0.5, ty - 6, 1.8, lit)
            for i in range(10):
                x = hx + s_ * i
                y = ty - 4 + min(3, i // 3)
                c.px(x, y, st[5] if s_ < 0 else st[4])
                c.px(x, y + 1, st[2])
        # Clock in the attic, a gilt ring round a white dial.
        ky = (at + cor) // 2 + 2
        c.ellipse(cx + 0.5, ky, 8.5, 8.5, GOLD[1])
        c.ellipse(cx + 0.5, ky, 7.5, 7.5, GOLD[2])
        c.ellipse(cx + 0.5, ky, 6.5, 6.5, DIAL[1])
        c.ellipse(cx, ky - 0.5, 5, 5, DIAL[2])
        for a in range(12):
            r = math.radians(a * 30)
            c.px(round(cx + 0.5 + math.sin(r) * 5.5 - 0.5), round(ky - math.cos(r) * 5.5), DIAL[0])
        c.vl(cx, ky - 4, ky, DIAL[0])
        for i in range(4):
            c.px(cx + i, ky + i // 2, DIAL[0])
        c.hl(cx - 7, cx + 8, ky - 9, GOLD[3])
        # Steep roof behind the pediment.
        top = T - 22
        for y in range(top, py - prise):
            t = (y - top) / max(1, py - prise - top)
            inset = round((1 - t) * 9)
            for x in range(x0 + inset, x1 - inset + 1):
                row = (y - top) // 3
                col = SLATE[3] if (y - top) % 3 != 2 else SLATE[2]
                if (x + (row % 2) * 3) % 6 == 0:
                    col = SLATE[2]
                if x - (x0 + inset) < 2:
                    col = SLATE[5]
                elif x1 - inset - x < 2:
                    col = SLATE[1]
                if c.get(x, y)[3] == 0 or y < py - prise:
                    c.px(x, y, col)
        c.hl(x0 + 9, x1 - 9, top, ZINC[4])
        self.campanile(cx, top)

    def campanile(self, cx, base):
        """A square stone lantern with arched openings, a lead dome, a lantern
        of its own and a banner on the staff."""
        c, st = self.c, self.stone
        B = self.belfry
        w = 14 if B >= 52 else 10
        x0, x1 = cx - w, cx + w
        y1 = base
        y0 = base - int(B * 0.45)
        c.rect(x0, y0, x1, y1, st[4])
        c.vl(x0, y0, y1, st[6])
        c.vl(x1, y0, y1, st[2])
        c.vl(x1 + 1, y0 + 1, y1, st[1])
        openings = 2 if w >= 14 else 1
        for i in range(openings):
            ox = x0 + (i + 1) * (2 * w) // (openings + 1)
            r = 3
            for y in range(y0 + 5, y1 - 4):
                for x in range(ox - r, ox + r + 1):
                    if y < y0 + 5 + r and math.hypot(x + 0.5 - ox - 0.5, y0 + 5 + r - y) > r + 0.3:
                        continue
                    c.px(x, y, INK if x > ox - r + 1 else st[1])
            c.hl(ox - 3, ox + 3, y1 - 4, st[6])
        c.rect(x0 - 2, y0 - 3, x1 + 2, y0, st[5])
        c.hl(x0 - 2, x1 + 2, y0 - 3, st[6])
        c.hl(x0 - 2, x1 + 2, y0, st[2])
        for x in range(x0 - 1, x1 + 2, 3):
            c.px(x, y0 - 4, st[5])
        dr = w + 1
        dy = y0 - 4
        for y in range(dy - dr, dy + 1):
            for x in range(cx - dr, cx + dr + 1):
                d = ((x + 0.5 - cx) / dr) ** 2 + ((y + 0.5 - dy) / dr) ** 2
                if d <= 1:
                    nx = (x + 0.5 - cx) / dr
                    ny = (y + 0.5 - dy) / dr
                    l = -0.6 * nx - 0.7 * ny + 0.4
                    k = 4 if l > 0.55 else 3 if l > 0.2 else 2 if l > -0.15 else 1
                    if (x - cx) % 4 == 0 and k > 1:
                        k -= 1
                    c.px(x, y, ZINC[k])
        ly = dy - dr - 1
        c.rect(cx - 3, ly - 8, cx + 3, ly, st[5])
        c.vl(cx + 3, ly - 8, ly, st[2])
        c.rect(cx - 1, ly - 6, cx + 1, ly - 2, INK)
        sphere(c, cx + 0.5, ly - 10, 3, ZINC)
        c.vl(cx, ly - 26, ly - 13, IRON[1])
        field, device = BANNERS[self.seed % len(BANNERS)]
        for x in range(11):
            for y in range(7):
                wave = round(math.sin((x + 1) * 0.55))
                col = field if not (3 <= y <= 4 and 4 <= x <= 6) else device
                if y == 0:
                    col = mix(col, '#ffffff', 0.25)
                elif y == 6:
                    col = mix(col, INK, 0.3)
                c.px(cx + 1 + x, ly - 26 + y + wave, col)

    def lamp(self, x, base):
        """A bronze candelabrum of three lanterns on a stone pedestal."""
        c, st = self.c, self.stone
        c.rect(x - 2, base - 8, x + 3, base, st[5])
        c.vl(x - 2, base - 8, base, st[6])
        c.vl(x + 3, base - 8, base, st[2])
        c.hl(x - 3, x + 4, base - 9, st[6])
        c.vl(x, base - 30, base - 10, IRON[1])
        c.vl(x + 1, base - 30, base - 10, IRON[0])
        c.hl(x - 5, x + 6, base - 28, IRON[1])
        for lx in (x - 5, x, x + 5):
            c.rect(lx, base - 35, lx + 2, base - 30, '#f2dea0')
            c.px(lx, base - 35, '#fbf0c8')
            c.hl(lx - 1, lx + 3, base - 36, IRON[1])
            c.px(lx + 1, base - 37, IRON[2])


COPPER = ['#16302c', '#22473e', '#336552', '#4b8a6c', '#76b08c', '#a9d4ae']
BRONZE = ['#3a2616', '#6b4a24', '#a07a36', '#d8b25a', '#f6e39c']
MARBLE = ['#4a3e48', '#7e7378', '#b5aca6', '#d8d0c4', '#efe8da', '#fbf7ee']


def column(c, x, y0, y1, st, w=6, ramp=None):
    """A free-standing column shaded as a cylinder, with a Corinthian-ish
    capital of two leaf rows and an Attic base."""
    ramp = ramp or [st[1], st[2], st[4], st[6], st[5], st[4], st[3], st[2]]
    n = len(ramp)
    for i in range(w):
        col = ramp[min(n - 1, int(i * n / w))]
        c.vl(x + i, y0 + 5, y1 - 3, col)
    for y in range(y0 + 7, y1 - 4, 2):
        c.px(x + w // 2, y, mix(ramp[n // 2], st[1], 0.25))
    c.rect(x - 2, y0, x + w + 1, y0 + 4, st[5])
    c.hl(x - 2, x + w + 1, y0, st[6])
    for xx in range(x - 2, x + w + 2, 2):
        c.px(xx, y0 + 2, st[3])
        c.px(xx + 1, y0 + 3, st[6])
    c.hl(x - 1, x + w, y0 + 4, st[2])
    c.rect(x - 2, y1 - 2, x + w + 1, y1, st[5])
    c.hl(x - 2, x + w + 1, y1 - 2, st[6])
    c.hl(x - 2, x + w + 1, y1, st[2])


def gilt_figure(c, x, base, s=1):
    """A gilt allegory standing on the roof: a winged figure, one arm up."""
    g = BRONZE
    c.rect(x - 2, base - 4, x + 3, base, g[1])
    c.hl(x - 2, x + 3, base - 4, g[3])
    for y in range(base - 17, base - 4):
        w = 1 + (y - (base - 17)) // 5
        c.hl(x - w + 1, x + w, y, g[3] if y < base - 10 else g[2])
        c.px(x + w, y, g[1])
    sphere(c, x + 0.5, base - 19, 1.8, g[1:])
    c.vl(x - 1 if s > 0 else x + 2, base - 25, base - 16, g[3])
    for i in range(5):
        c.px(x + s * (3 + i // 2), base - 14 - i, g[2])
        c.px(x - s * (2 + i // 2), base - 13 - i, g[1])


class OperaHouse(Oblique):
    """A boulevard-age opera: a podium of steps, an arcaded loggia, a giant
    order of paired columns, a gilt attic and a copper dome over the hall."""

    def __init__(self, W=256, sd=14, seed=0, stone=WARM_LIME):
        self.seed, self.stone = seed, stone
        self.n = max(3, ((W - 40) // 26) | 1)
        wall = 14 + 44 + 62 + 22
        self.dome = 58 if W >= 256 else 40
        super().__init__(W, wall, 30 + self.dome, sd)

    def render(self):
        W, H, c, st, sd = self.W, self.H, self.c, self.stone, self.sd
        n = self.n
        wall_top = H - self.wall
        pod = H - 14
        loggia = pod - 44
        order = loggia - 62
        attic = order - 22
        pw = 30 if W >= 256 else 20
        bw = (W - 2 * pw) / n
        axes = [pw + bw * (k + 0.5) for k in range(n)]

        return_(c, W, [(attic - 16, H - 1, st[2])])

        # Copper roof over the auditorium, the dome over the stage behind.
        self.dome_(W // 2, attic - 26)
        for y in range(attic - 30, attic):
            t = (attic - y) / 30
            inset = round(12 * t)
            for x in range(pw + inset, W - pw - inset):
                # Standing seams run down the slope, weathered paler at the top.
                k = (x - pw) % 7
                col = COPPER[4] if k == 0 else COPPER[2] if k == 1 else COPPER[3] if t > 0.4 else mix(COPPER[3], COPPER[2], 0.5)
                if x - (pw + inset) < 2:
                    col = COPPER[4]
                c.px(x, y, col)
        c.hl(pw + 12, W - pw - 13, attic - 30, COPPER[5])
        gilt_figure(c, W // 2 - 1, attic - 30, 1)

        # Attic: a band of gilt masks and garlands under a crowning cornice.
        c.rect(0, attic, W - 1, order - 1, st[4])
        c.hl(0, W - 1, attic, st[6])
        c.hl(0, W - 1, attic + 1, st[5])
        c.hl(0, W - 1, attic + 3, st[2])
        for k, ax in enumerate(axes):
            x = int(ax)
            sphere(c, x + 0.5, attic + 11, 3.2, BRONZE[1:])
            c.px(x - 1, attic + 10, BRONZE[0])
            c.px(x + 1, attic + 10, BRONZE[0])
            for s_ in (-1, 1):
                for i in range(8):
                    gx = x + s_ * (5 + i)
                    gy = attic + 9 + round(math.sin(i / 7 * math.pi) * 3)
                    c.px(gx, gy, '#6f9a58' if i % 2 else '#4e7a40')
                    c.px(gx, gy + 1, BRONZE[2] if i in (0, 7) else st[3])
        c.hl(0, W - 1, order - 3, st[5])
        c.hl(0, W - 1, order - 2, st[3])
        c.hl(0, W - 1, order - 1, st[1])

        # The giant order: paired columns before a loggia of tall windows,
        # the wall behind in deep shade.
        c.rect(0, order, W - 1, loggia - 1, st[3])
        for y in range(order, loggia):
            t = (y - order) / 62
            for x in range(pw, W - pw):
                c.px(x, y, mix(st[2], st[1], 0.4 * (1 - t)))
        for k, ax in enumerate(axes):
            x = int(ax)
            french_window(c, x - 6, order + 18, 12, 30, st, self.seed + k)
            c.ellipse(x + 0.5, order + 10, 5, 5, st[5])
            c.ellipse(x + 0.5, order + 10, 3.5, 3.5, MARBLE[3])
            sphere(c, x + 0.5, order + 10, 3, MARBLE[1:])
            for xx in range(x - 7, x + 8, 3):
                c.vl(xx, order + 42, order + 47, IRON[1])
            c.hl(x - 7, x + 7, order + 41, IRON[2])
        for k in range(n + 1):
            x = int(pw + bw * k)
            for dx in (-7, 2):
                column(c, x + dx, order + 2, loggia - 2, st, w=5)
        for x0, x1 in ((0, pw - 1), (W - pw, W - 1)):
            ashlar(c, x0, x1, order, loggia - 1, st, self.seed)
            c.vl(x0, order, loggia - 1, st[6])
            c.vl(x1, order, loggia - 1, st[2])
            self.niche(x0 + (x1 - x0) // 2, order + 10)
        cornice(c, 0, W - 1, order - CORNICE + 1, st, deep=False)
        for x0, x1 in ((0, pw - 1), (W - pw, W - 1)):
            self.crown(x0, x1, attic)

        # Loggia: an arcade over the entrances, rusticated, lamps between.
        rustication(c, 0, W - 1, loggia, pod - 1, st, self.seed)
        c.rect(0, loggia, W - 1, loggia + 4, st[5])
        c.hl(0, W - 1, loggia, st[6])
        c.hl(0, W - 1, loggia + 4, st[2])
        for k, ax in enumerate(axes):
            arch(c, ax, loggia + 9, 20, pod - 1, st, self.seed + k, door=True)
        for k in range(1, n):
            x = int(pw + bw * k)
            c.vl(x, loggia + 14, loggia + 26, IRON[1])
            sphere(c, x + 0.5, loggia + 12, 2.2, ['#8a5a26', '#d49a48', '#f2c774', '#fde7a8'])

        # Podium: a flight of steps the width of the front, and its cheeks.
        steps = 6
        for i in range(steps):
            y = pod + i * 2 + 2
            c.rect(pw - 2 - i * 2, y, W - pw + 1 + i * 2, y + 1, st[4])
            c.hl(pw - 2 - i * 2, W - pw + 1 + i * 2, y, st[6])
        for x0, x1 in ((0, pw - 3), (W - pw + 2, W - 1)):
            c.rect(x0, pod, x1, H - 1, st[3])
            c.hl(x0, x1, pod, st[6])
            c.hl(x0, x1, pod + 1, st[5])
            for y in range(pod + 5, H, 5):
                c.hl(x0, x1, y, st[2])
            self.candelabrum((x0 + x1) // 2, pod)
        c.hl(0, W - 1, H - 1, st[1])
        self.door_x = W // 2
        return outline(c.im)

    def crown(self, x0, x1, attic):
        """An end pavilion rises past the attic into a segmental pediment
        with a round window, and a gilt group stands on its apex."""
        c, st = self.c, self.stone
        top = attic - 16
        ashlar(c, x0, x1, top, attic + 21, st, self.seed + 5)
        c.vl(x0, top, attic + 21, st[6])
        c.vl(x1, top, attic + 21, st[2])
        w = x1 - x0
        for i in range(w + 5):
            t = i / (w + 4)
            h = round(math.sin(t * math.pi) * 9)
            x = x0 - 2 + i
            for yy in range(top - h, top + 1):
                c.px(x, yy, st[5] if t < 0.5 else st[4])
            c.px(x, top - h - 1, st[6] if t < 0.5 else st[5])
            c.px(x, top - h, st[3])
        c.hl(x0 - 2, x1 + 2, top + 1, st[6])
        c.hl(x0 - 2, x1 + 2, top + 2, st[2])
        cx = (x0 + x1) // 2
        c.ellipse(cx + 0.5, top + 11, 5.5, 5.5, st[6])
        c.ellipse(cx + 0.5, top + 11, 4, 4, GLASS[1])
        c.ellipse(cx, top + 10, 2.5, 2.5, GLASS[2])
        gilt_figure(c, cx, top - 9, 1 if x0 == 0 else -1)

    def niche(self, x, y):
        """A statue in a round-headed niche on the end bays."""
        c, st = self.c, self.stone
        for yy in range(y, y + 36):
            for xx in range(x - 6, x + 7):
                if yy < y + 6 and math.hypot(xx + 0.5 - x - 0.5, y + 6 - yy) > 6:
                    continue
                c.px(xx, yy, mix(st[2], st[1], 0.3 + 0.4 * (xx - x + 6) / 12))
        m = MARBLE
        sphere(c, x + 0.5, y + 8, 2.4, m[1:])
        for yy in range(y + 11, y + 32):
            w = 2 + (yy - y - 11) // 7
            c.hl(x - w + 1, x + w, yy, m[4] if yy < y + 20 else m[3])
            c.px(x + w, yy, m[1])
        c.rect(x - 5, y + 32, x + 6, y + 35, st[5])
        c.hl(x - 5, x + 6, y + 32, st[6])

    def candelabrum(self, x, base):
        c = self.c
        c.vl(x, base - 32, base - 1, BRONZE[1])
        c.vl(x + 1, base - 32, base - 1, BRONZE[0])
        c.rect(x - 2, base - 4, x + 3, base - 1, BRONZE[2])
        c.hl(x - 5, x + 6, base - 28, BRONZE[2])
        for lx in (x - 5, x, x + 5):
            sphere(c, lx + 1, base - 32, 2.3, ['#8a5a26', '#d49a48', '#f2c774', '#fde7a8'])

    def dome_(self, cx, base):
        """The stage-house dome, ribbed copper, a lantern and a gilt lyre."""
        c = self.c
        r = self.dome // 2 + 6
        ry = self.dome * 0.55
        for y in range(int(base - ry), base + 1):
            for x in range(cx - r, cx + r + 1):
                nx = (x + 0.5 - cx) / r
                ny = (y + 0.5 - base) / ry
                if nx * nx + ny * ny > 1:
                    continue
                l = -0.6 * nx - 0.6 * ny + 0.2
                k = 5 if l > 0.75 else 4 if l > 0.45 else 3 if l > 0.1 else 2 if l > -0.25 else 1
                if abs(((x - cx) * 6 / r) % 1) < 0.12 and k > 1:
                    k -= 1
                c.px(x, y, COPPER[k])
        top = int(base - ry)
        c.rect(cx - 3, top - 9, cx + 3, top, WARM_LIME[4])
        c.vl(cx + 3, top - 9, top, WARM_LIME[2])
        sphere(c, cx + 0.5, top - 11, 3, COPPER[1:])
        for i in range(8):
            c.px(cx - 2 + round(math.sin(i / 7 * math.pi) * -2), top - 15 - i, BRONZE[3])
            c.px(cx + 3 - round(math.sin(i / 7 * math.pi) * -2), top - 15 - i, BRONZE[2])
        c.hl(cx - 3, cx + 4, top - 14, BRONZE[3])
        c.vl(cx, top - 22, top - 15, BRONZE[3])


LEAD = ['#23262e', '#3a3f4a', '#555c68', '#767e8a', '#a0a8b0']
RED_SAND = ['#2c1620', '#5a2a2a', '#8a4638', '#a95e48', '#c67c60', '#e09c7c', '#f2c2a2']
GREY_STONE = ['#26242e', '#48464e', '#6e6c70', '#918e8c', '#b1ada6', '#cdc8bc', '#e6e0d2']
STAINED = ['#2a3a6a', '#8a2a3a', '#c8a040', '#3a6a4a', '#5a3a7a']


def lancet(c, x, y, w, h, st, seed, tracery=True):
    """A pointed window: a chamfered stone reveal, stained glass in leaded
    lights, and in a wide one a mullion and a quatrefoil in the head."""
    cx = x + w / 2
    head = int(w * 0.9)
    for yy in range(y - 2, y + h + 2):
        for xx in range(x - 2, x + w + 2):
            if yy < y + head:
                t = (y + head - yy) / (head + 2)
                half = (w / 2 + 2) * math.sqrt(max(0, 1 - t * t)) if t <= 1 else -1
                half = (w / 2 + 2) * (1 - t ** 1.6)
                if abs(xx + 0.5 - cx) > half:
                    continue
            c.px(xx, yy, st[5] if xx < cx else st[3])
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if yy < y + head:
                t = (y + head - yy) / head
                half = (w / 2) * (1 - t ** 1.6)
                if abs(xx + 0.5 - cx) > half:
                    continue
            k = int(h2(xx // 2, yy // 3, seed) * len(STAINED))
            col = mix(STAINED[k], INK, 0.45)
            if (yy - y) % 4 == 0 or (xx - x) % 3 == 0:
                col = mix(INK, st[1], 0.5)
            elif yy < y + h // 3 and h2(xx, yy, seed + 1) > 0.75:
                col = mix(STAINED[k], '#ffffff', 0.15)
            c.px(xx, yy, col)
    if tracery and w >= 8:
        c.vl(int(cx), y + head, y + h - 1, st[4])
        c.ellipse(cx, y + head - 1, 2.2, 2.2, st[4])
        c.px(int(cx), y + head - 1, mix(STAINED[0], INK, 0.4))
    c.hl(x - 2, x + w + 1, y + h, st[5])
    c.hl(x - 2, x + w + 1, y + h + 1, st[2])


def buttress(c, x, y0, y1, st, w=6):
    """A stepped buttress: two offsets with sloped weatherings, lit west,
    its shadow on the wall east of it."""
    for x_ in range(x, x + w):
        c.vl(x_, y0, y1, st[4])
    c.vl(x, y0, y1, st[6])
    c.vl(x + w - 1, y0, y1, st[2])
    for yy in range(y0 + 4, y1):
        p = c.get(x + w, yy)
        if p[3]:
            c.px(x + w, yy, mix(p, st[1], 0.35))
            q = c.get(x + w + 1, yy)
            if q[3]:
                c.px(x + w + 1, yy, mix(q, st[1], 0.18))
    for f in (0.35, 0.7):
        yy = int(y0 + (y1 - y0) * f)
        c.hl(x - 1, x + w, yy, st[6])
        c.hl(x - 1, x + w, yy + 1, st[3])
    for i in range(4):
        c.hl(x + i // 2, x + w - 1 - i // 2, y0 - i, st[5] if i < 3 else st[6])


def pinnacle(c, x, base, h, st):
    """A crocketed pinnacle: a shaft, a gablet, a spirelet with knops up its
    edges and a finial."""
    c.rect(x - 2, base - 8, x + 2, base, st[4])
    c.vl(x - 2, base - 8, base, st[6])
    c.vl(x + 2, base - 8, base, st[2])
    for i in range(h):
        y = base - 9 - i
        w = max(0, 2 - i * 3 // h)
        c.hl(x - w, x + w, y, st[5] if i < h - 2 else st[6])
        c.px(x + w, y, st[3])
        if i % 3 == 1 and w:
            c.px(x - w - 1, y, st[5])
            c.px(x + w + 1, y, st[3])
    c.px(x, base - 10 - h, st[6])
    c.px(x, base - 11 - h, st[5])


class GothicChurch(Oblique):
    """A parish church seen from the south: a west tower and spire, the
    nave's buttressed flank with its aisle and clerestory, a transept gable
    over the south door, and the apse turning away at the east end."""

    def __init__(self, W=224, sd=14, seed=0, stone=GREY_STONE, spire='broach', roof=LEAD):
        self.seed, self.stone, self.spire_kind, self.roofc = seed, stone, spire, roof
        self.big = W >= 200
        self.chapel = W < 150
        aisle = 36
        self.clere = 0 if self.chapel else 28
        self.rise = 30 if self.chapel else 38
        wall = aisle + self.clere
        self.tower_h = 90 if self.chapel else 130 if not self.big else 150
        super().__init__(W, wall, max(self.rise + 10, self.tower_h - wall + 20), sd)
        self.aisle = aisle

    def render(self):
        W, H, c, st, sd = self.W, self.H, self.c, self.stone, self.sd
        tw = 30 if self.chapel else 40 if not self.big else 48
        apse = 22 if self.chapel else 30
        nave0, nave1 = tw - 2, W - apse
        eave = H - self.wall
        ridge = eave - self.rise


        # Nave roof: steep lead or slate, seen from above and in front, its
        # ridge with a line of cresting.
        R = self.roofc
        # The nave roof hips down over the apse at its east end, so no cut
        # roof end stands in the air.
        hip = 18
        for y in range(ridge, eave + 2):
            t = (y - ridge) / (eave + 2 - ridge)
            end = nave1 + 2 - round((1 - t) * hip)
            for x in range(nave0, end + 1):
                if R is LEAD:
                    k = (x - nave0) % 9
                    col = R[3] if k == 0 else R[1] if k == 8 else R[2] if t > 0.5 else mix(R[2], R[3], 0.4)
                else:
                    row = (y - ridge) // 3
                    col = R[3] if (y - ridge) % 3 != 2 else R[2]
                    if (x + (row % 2) * 3) % 6 == 0:
                        col = R[2]
                c.px(x, y, col)
        c.hl(nave0, nave1 + 2 - hip, ridge, R[4])
        for y in range(ridge, eave + 2):
            t = (y - ridge) / (eave + 2 - ridge)
            c.px(nave1 + 2 - round((1 - t) * hip), y, R[1])
        for x in range(nave0 + 2, nave1 - hip, 4):
            c.px(x, ridge - 1, R[3])
            c.px(x + 1, ridge - 2, R[4])
        c.hl(nave0, nave1 + 2, eave + 2, st[2])

        # The clerestory, the aisle roof leaning against it, the aisle wall.
        ay = H - self.aisle
        if self.clere:
            ashlar(c, nave0, nave1, eave + 3, ay - 9, st, self.seed)
            c.hl(nave0, nave1, eave + 3, st[2])
            for x in range(nave0, nave1 + 1):
                for yy in range(ay - 9, ay):
                    k = (x - nave0) % 9
                    c.px(x, yy, R[3] if k == 0 else R[2] if yy > ay - 5 else R[3])
            c.hl(nave0, nave1, ay - 9, R[4])
        ashlar(c, nave0, nave1, ay, H - 6, st, self.seed + 1)
        c.rect(nave0, H - 5, nave1, H - 1, st[3])
        c.hl(nave0, nave1, H - 5, st[5])
        c.hl(nave0, nave1, H - 1, st[1])
        c.hl(nave0, nave1, ay, st[6])
        c.hl(nave0, nave1, ay + 1, st[3])

        bay = 22
        n = max(2, (nave1 - nave0) // bay)
        bay = (nave1 - nave0) / n
        mid = n // 2
        tr0 = nave0 + mid * bay
        tr1 = tr0 + bay
        for k in range(n):
            bx = nave0 + k * bay
            if not self.chapel and bx <= tr0 < bx + bay:
                continue
            lancet(c, int(bx + bay / 2 - 4), ay + 7, 8, self.aisle - 16, st, self.seed + k)
            if self.clere:
                lancet(c, int(bx + bay / 2 - 3), eave + 7, 6, self.clere - 16, st, self.seed + 20 + k, tracery=False)
        for k in range(n + 1):
            bx = int(nave0 + k * bay) - 3
            buttress(c, bx, ay - 2, H - 6, st)
            if self.clere and self.big and 0 < k < n:
                self.flyer(bx + 3, ay - 2, eave + 8)
            if self.clere:
                pinnacle(c, bx + 3, ay - 3, 6, st)

        if not self.chapel:
            self.transept(int(tr0), int(tr1), ridge, H)
        else:
            self.door_x = int(nave0 + bay * mid + bay / 2)
            self.porch(self.door_x, H)
        self.apse_(nave1, W - 1, eave, H)
        self.tower(0, tw, H)
        return outline(c.im)

    def flyer(self, x, foot, head):
        """A flying buttress: a half-arch from the aisle pier up to the
        clerestory wall, its top edge lit."""
        c, st = self.c, self.stone
        for i in range(10):
            t = i / 9
            y = int(foot - 6 - (foot - 6 - head) * math.sin(t * math.pi / 2))
            xx = x + i
            c.px(xx, y, st[6])
            c.px(xx, y + 1, st[4])
            c.px(xx, y + 2, st[2])

    def transept(self, x0, x1, ridge, H):
        """The south transept's gable over the door: a rose window, a gablet
        of blind arcading, pinnacles at its shoulders."""
        c, st = self.c, self.stone
        x0 -= 4
        x1 += 4
        top = ridge - 6
        gable_foot = H - self.wall + 4
        ashlar(c, x0, x1, gable_foot, H - 6, st, self.seed + 7)
        c.vl(x0, gable_foot, H - 6, st[6])
        c.vl(x1, gable_foot, H - 6, st[2])
        c.rect(x0, H - 5, x1, H - 1, st[3])
        c.hl(x0, x1, H - 5, st[5])
        half = (x1 - x0) / 2
        for i in range(x1 - x0 + 1):
            t = abs(i - half) / half
            y = int(top + (gable_foot - top) * t)
            for yy in range(y, gable_foot):
                c.px(x0 + i, yy, st[4] if i < half else st[3])
            c.px(x0 + i, y, st[6] if i < half else st[5])
            c.px(x0 + i, y + 1, st[5] if i < half else st[3])
        for x_ in (x0, x1):
            pinnacle(c, x_, gable_foot + 2, 8, st)
        c.vl(int(x0 + half), top - 8, top, st[5])
        c.hl(int(x0 + half) - 2, int(x0 + half) + 2, top - 5, st[5])
        cx = x0 + half + 0.5
        ry = gable_foot + 8
        R = min(11, half - 5)
        c.ellipse(cx, ry, R + 2, R + 2, st[5])
        c.ellipse(cx + 0.6, ry + 0.6, R + 1, R + 1, st[2])
        c.ellipse(cx, ry, R + 1, R + 1, st[4])
        for y in range(int(ry - R), int(ry + R) + 1):
            for x in range(int(cx - R), int(cx + R) + 1):
                dx, dy = x + 0.5 - cx, y + 0.5 - ry
                d = math.hypot(dx, dy)
                if d > R:
                    continue
                ang = (math.degrees(math.atan2(dy, dx)) + 360) % 30
                if d < 2.5:
                    col = STAINED[2]
                elif ang < 3 or abs(d - R * 0.55) < 0.7:
                    col = st[4]
                else:
                    col = mix(STAINED[int(d / R * 3 + ang / 10) % len(STAINED)], INK, 0.35)
                c.px(x, y, col)
        self.door_x = int(x0 + half)
        self.porch(self.door_x, H)

    def porch(self, cx, H):
        """A pointed doorway of several orders, a carved tympanum, oak doors
        with iron strap hinges."""
        c, st = self.c, self.stone
        top = H - 36
        for order in range(3, -1, -1):
            w = 9 + order * 2
            for y in range(top - order * 2, H - 5):
                for x in range(cx - w, cx + w + 1):
                    if y < top + 8:
                        t = (top + 8 - y) / (8 + order * 2)
                        if abs(x + 0.5 - cx) > w * (1 - t ** 1.5):
                            continue
                    c.px(x, y, (st[6] if x < cx else st[4]) if order % 2 else (st[3] if x < cx else st[2]))
        w = 8
        for y in range(top, H - 5):
            for x in range(cx - w, cx + w + 1):
                if y < top + 8:
                    t = (top + 8 - y) / 8
                    if abs(x + 0.5 - cx) > w * (1 - t ** 1.5):
                        continue
                if y < top + 10:
                    c.px(x, y, st[3] if (x + y) % 3 else st[5])
                else:
                    k = (x - cx + w) % 4
                    c.px(x, y, OAK[3] if k == 0 else OAK[2] if k < 3 else OAK[1])
        c.hl(cx - w, cx + w, top + 10, st[1])
        for y in (top + 15, top + 25):
            c.hl(cx - w + 1, cx - 2, y, IRON[1])
            c.hl(cx + 2, cx + w - 1, y, IRON[1])
        c.vl(cx, top + 10, H - 6, OAK[0])
        c.hl(cx - 12, cx + 12, H - 5, st[6])

    def apse_(self, x0, x1, eave, H):
        """The east end turns away in three faces, each darker than the
        last, under a conical roof."""
        c, st = self.c, self.stone
        faces = [(x0, x0 + 9, st[4]), (x0 + 10, x0 + 18, st[3]), (x0 + 19, x1 - 2, st[2])]
        top = H - self.aisle - self.clere // 2
        for i, (a, b, col) in enumerate(faces):
            for x in range(a, b + 1):
                for y in range(top, H - 5):
                    c.px(x, y, col if (y - top) % 8 != 7 else mix(col, st[1], 0.3))
            if i < 2:
                lancet(c, (a + b) // 2 - 2, top + 8, 5, H - top - 20, st, self.seed + 40 + i, tracery=False)
            c.vl(a, top, H - 5, st[6] if i == 0 else st[3])
        c.rect(x0, H - 5, x1 - 2, H - 1, st[2])
        R = self.roofc
        for y in range(top - 18, top + 1):
            t = (top - y) / 18
            a = x0 + int(t * 12)
            b = x1 - 2 - int(t * 6)
            for x in range(a, b + 1):
                f = (x - a) / max(1, b - a)
                c.px(x, y, R[3] if f < 0.3 else R[2] if f < 0.7 else R[1])
        c.hl(x0, x1 - 2, top, st[2])

    def tower(self, x0, tw, H):
        """A west tower of three stages under a spire: buttressed corners,
        a clock, louvred belfry lancets, a pierced parapet and pinnacles."""
        c, st = self.c, self.stone
        x1 = x0 + tw - 1
        th = self.tower_h - (0 if self.spire_kind == 'none' else (48 if self.big else 36 if not self.chapel else 28))
        top = H - th
        ashlar(c, x0, x1, top, H - 6, st, self.seed + 3)
        c.vl(x0, top, H - 6, st[6])
        c.vl(x1, top, H - 6, st[2])
        c.rect(x0, H - 5, x1, H - 1, st[3])
        c.hl(x0, x1, H - 5, st[5])
        for bx in (x0, x1 - 4):
            for x in range(bx, bx + 5):
                c.vl(x, top + 6, H - 6, st[5] if x == bx else st[4] if x < bx + 4 else st[2])
            for f in (0.3, 0.55, 0.8):
                yy = int(top + (H - top) * f)
                c.hl(bx - 1, bx + 5, yy, st[6])
                c.hl(bx - 1, bx + 5, yy + 1, st[2])
        for f in (0.35, 0.62):
            yy = int(top + (H - top) * f)
            c.hl(x0, x1, yy, st[5])
            c.hl(x0, x1, yy + 1, st[2])
        cx = (x0 + x1) // 2
        lancet(c, cx - 4, int(top + (H - top) * 0.7), 8, int((H - top) * 0.2), st, self.seed + 9)
        ky = int(top + (H - top) * 0.47)
        c.ellipse(cx + 0.5, ky, 6.5, 6.5, GOLD[1])
        c.ellipse(cx + 0.5, ky, 5.5, 5.5, DIAL[0])
        c.ellipse(cx, ky - 0.5, 4.5, 4.5, '#2a3a5a')
        c.vl(cx, ky - 4, ky, GOLD[3])
        c.hl(cx, cx + 3, ky, GOLD[3])
        for i in range(12):
            a = math.radians(i * 30)
            c.px(round(cx + math.sin(a) * 4.5), round(ky - math.cos(a) * 4.5), GOLD[2])
        for k in range(2 if tw >= 40 else 1):
            lx = cx - 7 + k * 10 if tw >= 40 else cx - 3
            ly = top + 10
            lancet(c, lx, ly, 6, 18, st, self.seed + 11 + k, tracery=False)
            for y in range(ly + 6, ly + 18, 2):
                c.hl(lx, lx + 5, y, st[2])
        c.rect(x0 - 1, top - 5, x1 + 1, top, st[5])
        c.hl(x0 - 1, x1 + 1, top - 5, st[6])
        c.hl(x0 - 1, x1 + 1, top, st[2])
        for x in range(x0 + 1, x1, 4):
            c.rect(x, top - 4, x + 1, top - 2, mix(st[1], INK, 0.3))
        for x_ in (x0 + 1, x1 - 1):
            pinnacle(c, x_, top - 5, 10, st)
        if self.spire_kind != 'none':
            self.spire(x0 + 5, x1 - 5, top - 5)

    def spire(self, x0, x1, base):
        """An octagonal stone spire seen straight on: two faces, the west one
        lit, courses banding it and a lucarne low on each face, a cross."""
        c, st = self.c, self.stone
        h = self.tower_h - (H := 0) if False else (48 if self.big else 36 if not self.chapel else 28) + 12
        cx = (x0 + x1) / 2
        for y in range(base - h, base + 1):
            t = (base - y) / h
            half = (x1 - x0) / 2 * (1 - t)
            for x in range(int(cx - half), int(cx + half) + 1):
                col = st[5] if x < cx - 0.5 else st[3]
                if (base - y) % 6 == 0:
                    col = st[4] if x < cx else st[2]
                if abs(x + 0.5 - cx) < 0.8:
                    col = st[6]
                c.px(x, y, col)
        for s_ in (-1, 1):
            lx = int(cx + s_ * (x1 - x0) / 4) - 1
            ly = base - h // 5
            c.rect(lx, ly - 5, lx + 3, ly, st[1])
            for i in range(3):
                c.hl(lx - 1 + i, lx + 4 - i, ly - 6 - i, st[5] if s_ < 0 else st[3])
        c.vl(int(cx), base - h - 8, base - h, IRON[1])
        c.hl(int(cx) - 2, int(cx) + 2, base - h - 5, IRON[1])
        c.px(int(cx), base - h - 9, GOLD[3])


SOOT = ['#1a1418', '#2e2428', '#463a3a']
DARK_BRICK = ['#1e1020', '#3a1a22', '#5e2a2a', '#7a3a32', '#924a3c', '#aa6048', '#c47e5e']


def brick(c, x0, x1, y0, y1, b, seed, dark=0):
    TownHouse.brickwork(None, c, x0, y0, x1, y1, b, seed, dark)


def segmental(c, x, y, w, h, b, stone, seed, lit=False):
    """A mill window: a gauged-brick segmental head with a stone key, a
    stone sill, small-paned iron glazing with the odd pane replaced."""
    for i in range(-2, w + 2):
        rise = round(math.sin((i + 2) / (w + 3) * math.pi) * 2)
        c.px(x + i, y - 2 - rise, b[5] if i % 2 else b[4])
        c.px(x + i, y - 3 - rise, b[2])
        for yy in range(y - 1 - rise, y):
            c.px(x + i, yy, b[1] if 0 <= i < w else b[3])
    c.rect(x + w // 2 - 1, y - 6, x + w // 2 + 1, y - 2, stone[5])
    c.vl(x + w // 2 + 1, y - 5, y - 2, stone[3])
    c.rect(x, y, x + w - 1, y + h - 1, IRON[1])
    for yy in range(y + 1, y + h - 1):
        for xx in range(x + 1, x + w - 1):
            if (xx - x) % 3 == 0 or (yy - y) % 4 == 0:
                c.px(xx, yy, IRON[1])
            else:
                pane = h2((xx - x) // 3, (yy - y) // 4, seed)
                col = GLASS[3] if pane > 0.85 else GLASS[2] if yy < y + h // 2 else GLASS[1]
                if pane < 0.06:
                    col = OAK[2]
                c.px(xx, yy, col)
    c.rect(x - 2, y + h, x + w + 1, y + h + 1, stone[5])
    c.hl(x - 2, x + w + 1, y + h + 2, b[1])


class Mill(Oblique):
    """A brick mill or works range of the 1880s: storeys of segmental
    windows between pilaster strips, a corbel table, loopholes and a hoist at
    one end, a stair tower with a tank, an arched cart way, a tall stack."""

    def __init__(self, W=224, sd=14, seed=0, storeys=3, b=BRICK):
        self.seed, self.storeys, self.b = seed, storeys, b
        self.st = WARM_LIME
        wall = 12 + STOREY * storeys + 8
        self.rise = 80 + 12 * storeys
        super().__init__(W + 26, wall, self.rise + 14, sd)
        self.body = W

    def render(self):
        c, b, st, sd, H = self.c, self.b, self.st, self.sd, self.H
        W = self.body
        tw = 26
        x0, x1 = tw, tw + W - 1
        wall_top = H - self.wall
        return_(c, x1 + 1, [(wall_top - 10, wall_top - 1, SLATE[1]), (wall_top, H - 1, b[2])])
        self.stack_(x1 - 30, wall_top)

        # A low slate roof behind a brick parapet.
        for y in range(wall_top - 10, wall_top):
            for x in range(x0 + 2, x1 + 1):
                row = (y - wall_top) // 3
                c.px(x, y, SLATE[2] if (y % 3 == 0 or (x + (row % 2) * 3) % 6 == 0) else SLATE[3])
        c.hl(x0 + 2, x1, wall_top - 10, SLATE[5])
        brick(c, x0, x1, wall_top, H - 6, b, self.seed)
        # Corbel table under a stone coping.
        c.rect(x0, wall_top, x1, wall_top + 2, st[5])
        c.hl(x0, x1, wall_top, st[6])
        c.hl(x0, x1, wall_top + 2, st[2])
        for x in range(x0, x1 + 1):
            k = (x - x0) % 6
            c.px(x, wall_top + 3, b[5] if k < 3 else b[2])
            c.px(x, wall_top + 4, b[4] if k < 2 else b[1] if k < 4 else b[3])
            c.px(x, wall_top + 5, b[1] if k == 3 else b[3])
        c.rect(x0, H - 5, x1, H - 1, SOOT[2])
        c.hl(x0, x1, H - 5, st[4])
        c.hl(x0, x1, H - 1, SOOT[0])

        bay = 20
        n = (W - 8) // bay
        mx = x0 + (W - n * bay) // 2
        hoist = n - 1
        for k in range(n + 1):
            px_ = mx + k * bay - 2
            for x in range(px_, px_ + 4):
                c.vl(x, wall_top + 6, H - 6, b[5] if x == px_ else b[4] if x < px_ + 3 else b[2])
        for s in range(self.storeys):
            fy = H - 12 - STOREY * (s + 1)
            if s:
                c.hl(x0, x1, fy + STOREY + 1, st[5])
                c.hl(x0, x1, fy + STOREY + 2, b[1])
            for k in range(n):
                ax = mx + k * bay + bay // 2
                if k == hoist:
                    self.loophole(ax, fy, s)
                elif s == 0 and k == n // 2:
                    continue
                else:
                    segmental(c, ax - 6, fy + 12, 12, STOREY - 18, b, st, self.seed + k * 7 + s)
        self.cartway(mx + (n // 2) * bay + bay // 2, H)
        self.name_band(mx + bay, mx + (n - 1) * bay, wall_top + 7)
        self.tower(0, tw, H, wall_top)
        self.door_x = mx + (n // 2) * bay + bay // 2
        return outline(c.im)

    def loophole(self, ax, fy, s):
        """A stack of loading doors, one a storey, the top one under a hoist
        beam with its pulley and a rope down to a hanging bale."""
        c, b, st = self.c, self.b, self.st
        y = fy + 8
        c.rect(ax - 7, y - 1, ax + 6, fy + STOREY - 1, st[4])
        c.rect(ax - 6, y, ax + 5, fy + STOREY - 2, OAK[1])
        for x in range(ax - 6, ax + 6):
            if (x - ax) % 3 == 0:
                c.vl(x, y, fy + STOREY - 2, OAK[0])
        c.vl(ax - 1, y, fy + STOREY - 2, OAK[0])
        c.hl(ax - 6, ax + 5, y + 6, IRON[1])
        c.hl(ax - 6, ax + 5, fy + STOREY - 6, IRON[1])
        c.hl(ax - 8, ax + 7, fy + STOREY - 1, st[5])
        if s == self.storeys - 1:
            c.rect(ax - 2, fy + 2, ax + 12, fy + 4, OAK[2])
            c.hl(ax - 2, ax + 12, fy + 2, OAK[4])
            sphere(c, ax + 11.5, fy + 6, 1.6, IRON)
            c.vl(ax + 11, fy + 7, fy + STOREY + 14, '#b8a67a')
            c.rect(ax + 8, fy + STOREY + 15, ax + 14, fy + STOREY + 22, '#c8b48a')
            c.hl(ax + 8, ax + 14, fy + STOREY + 18, '#8a7650')

    def cartway(self, ax, H):
        """A round-arched cart entrance in rubbed brick with a timber gate."""
        c, b, st = self.c, self.b, self.st
        r = 10
        top = H - 6 - 34
        for y in range(top - 4, H - 5):
            for x in range(ax - r - 4, ax + r + 4):
                dy = top + r - y
                d = math.hypot(x + 0.5 - ax, dy) if dy > 0 else abs(x + 0.5 - ax)
                if dy > 0 and r < d <= r + 4:
                    c.px(x, y, b[5] if (int(math.degrees(math.atan2(dy, x + .5 - ax))) // 12) % 2 else b[3])
                elif (dy <= 0 and abs(x + 0.5 - ax) <= r) or (dy > 0 and d <= r):
                    k = (x - ax + r) % 4
                    c.px(x, y, OAK[3] if k == 0 else OAK[2] if k < 3 else OAK[1])
        c.vl(ax, top + r, H - 6, OAK[0])
        c.rect(ax - 2, top - 5, ax + 1, top - 1, st[5])

    def name_band(self, x0, x1, y):
        """A painted sign board the length of the range: a ground colour, a
        fine border and, in place of words, gilt rules round a device."""
        c = self.c
        field = ['#26402e', '#2a3656', '#4a2a2a'][self.seed % 3]
        c.rect(x0, y, x1, y + 6, field)
        c.hl(x0, x1, y, '#d8c89a')
        c.hl(x0, x1, y + 6, '#d8c89a')
        cx = (x0 + x1) // 2
        for x in range(x0 + 3, x1 - 2):
            if abs(x - cx) > 8 and (x - x0) % 4 < 3:
                c.px(x, y + 3, '#e8d9a8')
        sphere(c, cx + 0.5, y + 3, 2.6, GOLD)

    def tower(self, x0, tw, H, wall_top):
        """The stair tower: taller than the range, slit lights up the stair,
        a clock, a cast-iron water tank under a pyramid roof."""
        c, b, st = self.c, self.b, self.st
        x1 = x0 + tw - 1
        top = wall_top - 26
        brick(c, x0, x1, top, H - 6, b, self.seed + 3, dark=1)
        c.vl(x0, top, H - 6, b[4])
        c.rect(x0, H - 5, x1, H - 1, SOOT[2])
        cx = (x0 + x1) // 2
        for y in range(top + 30, H - 20, 18):
            c.rect(cx - 1, y, cx + 1, y + 8, INK)
            c.hl(cx - 3, cx + 3, y - 2, st[5])
        c.rect(cx - 4, H - 30, cx + 3, H - 6, OAK[1])
        c.hl(cx - 6, cx + 5, H - 32, st[5])
        c.rect(x0 - 1, top - 3, x1 + 1, top, st[5])
        c.hl(x0 - 1, x1 + 1, top - 3, st[6])
        ky = top + 12
        c.ellipse(cx + 0.5, ky, 6, 6, st[5])
        c.ellipse(cx + 0.5, ky, 5, 5, DIAL[1])
        c.vl(cx, ky - 4, ky, DIAL[0])
        c.hl(cx, cx + 3, ky, DIAL[0])
        c.rect(x0 + 1, top - 16, x1 - 1, top - 4, IRON[2])
        for x in range(x0 + 2, x1 - 1, 4):
            c.vl(x, top - 15, top - 5, IRON[1])
        c.hl(x0 + 1, x1 - 1, top - 16, IRON[3])
        for i in range(10):
            c.hl(x0 + 1 + i, x1 - 1 - i, top - 17 - i, SLATE[3] if i % 2 else SLATE[2])
            c.px(x0 + 1 + i, top - 17 - i, SLATE[5])
        c.vl(cx, top - 32, top - 27, IRON[1])

    def stack_(self, x, wall_top):
        """A tapering stack of engineering brick: a plinth, iron bands, a
        corbelled and banded cap blackened by the smoke."""
        c, b = self.c, DARK_BRICK
        base = wall_top + 4
        top = wall_top - self.rise
        for y in range(top, base):
            t = (y - top) / (base - top)
            half = 5 + t * 4
            for xx in range(int(x - half), int(x + half) + 1):
                f = (xx - (x - half)) / (2 * half)
                col = b[5] if f < 0.25 else b[4] if f < 0.55 else b[3] if f < 0.8 else b[2]
                if (y - top) % 4 == 3:
                    col = mix(col, b[1], 0.4)
                if y - top < 14:
                    col = mix(col, SOOT[1], 0.5 * (1 - (y - top) / 14))
                c.px(xx, y, col)
        for y in range(top + 30, base, 26):
            t = (y - top) / (base - top)
            half = 5 + t * 4
            c.hl(int(x - half) - 1, int(x + half) + 1, y, IRON[2])
        for i, w in enumerate((8, 9, 9, 8, 7)):
            c.hl(x - w, x + w, top - 1 - i, SOOT[1] if i > 2 else b[5] if i == 1 else b[3])
        c.hl(x - 6, x + 6, top - 6, SOOT[0])
        self.smoke = [[x, top - 8, 'chimney']]


class Institute(Oblique):
    """A workers' institute or union hall of about 1890: red brick with stone
    dressings, a meeting hall lit by tall round-headed windows over a ground
    floor of reading rooms, a pedimented doorcase up a flight of steps, a
    painted name band and a ventilating lantern on the ridge."""

    def __init__(self, W=192, sd=12, seed=0, b=BRICK):
        self.seed, self.b, self.st = seed, b, WARM_LIME
        wall = 12 + 34 + 52 + 12
        super().__init__(W, wall, 34 + 30, sd)

    def render(self):
        W, H, c, b, st = self.W, self.H, self.c, self.b, self.st
        wall_top = H - self.wall
        ground = H - 12 - 34
        rise = 26
        ridge = wall_top - rise
        return_(c, W, [(wall_top - 4, H - 1, b[2])])
        # A slate roof, hipped at both ends so its silhouette slopes clean.
        for y in range(ridge, wall_top + 1):
            t = (y - ridge) / rise
            a = round((1 - t) * 20)
            for x in range(a - 2, W + 2 - a):
                row = (y - ridge) // 3
                col = SLATE[3] if (y - ridge) % 3 != 2 else SLATE[2]
                if (x + (row % 2) * 3) % 6 == 0:
                    col = SLATE[2]
                if x - (a - 2) < 2:
                    col = SLATE[5]
                elif (W + 1 - a) - x < 2:
                    col = SLATE[1]
                c.px(x, y, col)
        c.hl(18, W - 19, ridge, SLATE[6])
        cx = W // 2
        # The lantern: louvred timber on the ridge under a lead cap and vane.
        c.rect(cx - 7, ridge - 14, cx + 7, ridge, '#e9e3d6')
        for y in range(ridge - 12, ridge - 1, 2):
            c.hl(cx - 5, cx + 5, y, '#8a8680')
        c.vl(cx - 7, ridge - 14, ridge, '#ffffff')
        c.vl(cx + 7, ridge - 14, ridge, '#a8a49c')
        for i in range(7):
            c.hl(cx - 8 + i, cx + 8 - i, ridge - 15 - i, LEAD[3] if i % 2 else LEAD[2])
        # A weathervane: an arrow over the four points.
        c.vl(cx, ridge - 30, ridge - 22, IRON[1])
        c.hl(cx - 4, cx + 4, ridge - 28, IRON[1])
        c.px(cx + 3, ridge - 29, IRON[1])
        c.px(cx + 3, ridge - 27, IRON[1])
        c.hl(cx - 5, cx - 3, ridge - 29, IRON[1])
        # Brick walls, stone bands and a stone eaves cornice on brackets.
        brick(c, 0, W - 1, wall_top, H - 6, b, self.seed)
        c.rect(0, wall_top, W - 1, wall_top + 3, st[5])
        c.hl(0, W - 1, wall_top, st[6])
        c.hl(0, W - 1, wall_top + 3, st[2])
        for x in range(2, W - 2, 8):
            c.rect(x, wall_top + 4, x + 2, wall_top + 6, st[4])
            c.px(x + 2, wall_top + 5, st[2])
        c.rect(0, ground - 4, W - 1, ground, st[5])
        c.hl(0, W - 1, ground - 4, st[6])
        c.hl(0, W - 1, ground, st[2])
        c.rect(0, H - 12, W - 1, H - 1, st[3])
        c.hl(0, W - 1, H - 12, st[5])
        for y in range(H - 8, H, 4):
            c.hl(0, W - 1, y, st[2])
        for x in (0, W - 5):
            for i, y in enumerate(range(wall_top + 8, H - 12, 7)):
                w = 5 if i % 2 else 3
                xa = x if x == 0 else W - w
                c.rect(xa, y, xa + w - 1, y + 5, st[4])
                c.hl(xa, xa + w - 1, y, st[6])
                c.hl(xa, xa + w - 1, y + 5, st[2])
        # The hall: tall round-headed windows with stone archivolts.
        n = max(3, (W - 40) // 26)
        pitch = (W - 20) / n
        axes = [int(10 + pitch * (k + 0.5)) for k in range(n)]
        mid = n // 2
        for k, ax in enumerate(axes):
            if abs(ax - W // 2) < 22:
                continue
            wy = wall_top + 18
            french_window(c, ax - 6, wy, 12, 26, st, self.seed + k)
            r = 6.5
            for yy in range(int(wy - r - 3), wy):
                for xx in range(ax - 9, ax + 9):
                    d = math.hypot(xx + 0.5 - ax, wy - yy)
                    if d <= r - 0.5:
                        c.px(xx, yy, GLASS[2] if (xx + yy) % 5 else '#e9e3d6')
                    elif d <= r + 2:
                        c.px(xx, yy, st[6] if xx < ax else st[4])
            c.rect(ax - 2, int(wy - r - 3), ax + 1, int(wy - r + 1), st[6])
            c.rect(ax - 8, wy + 27, ax + 7, wy + 28, st[5])
            # Reading rooms below: sashes under flat stone lintels.
            sy = ground + 8
            c.rect(ax - 6, sy - 1, ax + 5, sy + 18, '#ede7da')
            glass(c, ax - 5, sy, ax + 4, sy + 17, self.seed + 30 + k)
            c.hl(ax - 5, ax + 4, sy + 8, '#ede7da')
            c.rect(ax - 8, sy - 4, ax + 7, sy - 2, st[5])
            c.hl(ax - 8, ax + 7, sy - 4, st[6])
            c.rect(ax - 7, sy + 19, ax + 6, sy + 20, st[5])
        # The name band across the front, in place of words a gilt device.
        c.rect(12, wall_top + 8, W - 13, wall_top + 13, '#7a2a2a')
        c.hl(12, W - 13, wall_top + 8, '#e8d9a8')
        c.hl(12, W - 13, wall_top + 13, '#e8d9a8')
        for x in range(16, W - 16):
            if abs(x - cx) > 8 and x % 4 < 3:
                c.px(x, wall_top + 10, '#e8d9a8')
        sphere(c, cx + 0.5, wall_top + 10.5, 2.8, GOLD)
        # Doorcase: pilasters, a pediment, a fanlight, double doors up steps.
        dx0, dx1 = cx - 13, cx + 12
        top = ground - 30
        c.rect(dx0, top, dx1, H - 12, st[4])
        pilaster(c, dx0, top + 4, H - 12, st)
        pilaster(c, dx1 - 3, top + 4, H - 12, st)
        for i in range(dx1 - dx0 + 9):
            t = i / (dx1 - dx0 + 8)
            h = round((1 - abs(2 * t - 1)) * 9)
            x = dx0 - 4 + i
            for yy in range(top - h, top + 1):
                c.px(x, yy, st[5] if t < 0.5 else st[4])
            c.px(x, top - h - 1, st[6] if t <= 0.5 else st[5])
        c.hl(dx0 - 4, dx1 + 4, top + 1, st[6])
        c.hl(dx0 - 4, dx1 + 4, top + 2, st[2])
        sphere(c, cx + 0.5, top - 3, 2.2, GOLD)
        french_window(c, cx - 7, top + 8, 14, 16, st, self.seed + 3)
        c.rect(cx - 8, ground + 4, cx + 7, H - 13, OAK[1])
        for x in range(cx - 7, cx + 7):
            c.vl(x, ground + 5, H - 13, OAK[3] if (x - cx) % 3 == 0 else OAK[2])
        c.vl(cx - 1, ground + 4, H - 13, OAK[0])
        for y in (ground + 12, ground + 26):
            c.hl(cx - 6, cx + 5, y, OAK[1])
        c.px(cx - 3, ground + 18, GOLD[2])
        c.px(cx + 2, ground + 18, GOLD[2])
        for i in range(4):
            y = H - 12 + i * 3
            c.rect(dx0 - 2 - i * 2, y, dx1 + 2 + i * 2, y + 2, st[4])
            c.hl(dx0 - 2 - i * 2, dx1 + 2 + i * 2, y, st[6])
        self.door_x = cx
        return outline(c.im)


def make(out, zoom=3):
    from art.reference import current_adult_d
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    which = sys.argv[2] if len(sys.argv) > 2 else 'hotel'
    if which == 'institute':
        ims = [Institute(W=w, sd=sd, seed=s).render() for w, sd, s in ((144, 12, 1), (192, 12, 2), (256, 14, 3))]
    elif which == 'mill':
        ims = [Mill(W=w, sd=sd, seed=s, storeys=st).render() for w, sd, s, st in ((160, 12, 1, 2), (224, 14, 2, 3), (288, 16, 3, 4))]
    elif which == 'church':
        ims = [GothicChurch(W=w, sd=sd, seed=s, stone=stone, spire=sp, roof=rf).render()
               for w, sd, s, stone, sp, rf in ((128, 12, 1, WARM_LIME, 'broach', SLATE), (224, 14, 2, GREY_STONE, 'broach', LEAD),
                                               (320, 16, 3, RED_SAND, 'broach', SLATE))]
    elif which == 'opera':
        ims = [OperaHouse(W=w, sd=sd, seed=s).render() for w, sd, s in ((176, 12, 1), (256, 14, 2), (352, 16, 3))]
    else:
        ims = [HotelDeVille(W=w, sd=sd, seed=s, storeys=st, stone=stone).render()
               for w, sd, s, st, stone in ((192, 12, 1, 2, WARM_LIME), (256, 14, 2, 3, LIME), (352, 16, 3, 3, WARM_LIME))]
    pad = 12
    W = sum(i.width + adult.width + pad * 2 for i in ims) + pad
    H = max(i.height for i in ims) + 2 * pad
    sheet = Image.new('RGBA', (W, H), '#8f8e84')
    x = pad
    for im in ims:
        sheet.alpha_composite(im, (x, H - pad - im.height))
        sheet.alpha_composite(adult, (x + im.width + 3, H - pad - adult.height))
        x += im.width + adult.width + pad * 2
    sheet.resize((W * zoom, H * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/city-kit/civic.png')
