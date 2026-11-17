"""Shop-houses and lane houses of the South China Sea, 1820 to 1965: the
street of George Town, Malacca, Singapore, Batavia and Bangkok's Chinese
town, and the lane rows of Shanghai.

    .venv/bin/python scripts/art/front_straits.py out.png [look ...]   # each colour and form beside the adult

A frame is a row of units built together, each owner's own colour wash on
his own front. Every unit stands on two piers over the covered walk; in its
shade is a shop open to the street or a house door between two barred
windows.

shophouse, 1820-1900: a plain front, two or three tall shuttered windows, a
tiled roof whose eave is the top of the wall.
shophouse-late, 1895-1940: pilasters, a fanlight of coloured glass over each
window, a band of tiles under them, a frieze of plaster flowers.
shophouse-deco, 1930-1965: a band of steel windows under a concrete eyebrow,
grooves across the front, a stepped parapet with its year.
lilong, 1870-1949: the Shanghai lane row. A brick wall to the lane with a
stone-framed gate of black doors under a pediment, the upper floor's windows
over it, a grey tiled roof with a dormer.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import ramp, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_modern as fmod  # noqa: E402
from art.front_modern import Block, cast_right, stucco, interior, text, text_w  # noqa: E402
from art import front_europe as eu  # noqa: E402
from art.front_europe import brickwork, persiennes, WHITE, PORTLAND  # noqa: E402
from art import front_iberia as ib  # noqa: E402

WASH = dict(
    lime=ramp(88, 0.02, lift=0.05), cream=ramp(88, 0.05, lift=0.04), yellow=ramp(92, 0.085, lift=0.03),
    mint=ramp(160, 0.045, lift=0.03), sky=ramp(232, 0.045, lift=0.03), pink=ramp(18, 0.05, lift=0.03),
    ochre=ramp(75, 0.085, lift=-0.02), grey=ramp(240, 0.008, lift=-0.02), jade=ramp(170, 0.06, lift=-0.03))
PAINT = dict(jade=ramp(165, 0.075, lift=-0.14), teal=ramp(200, 0.06, lift=-0.14), wood=ramp(50, 0.06, lift=-0.18),
             blue=ramp(245, 0.07, lift=-0.14), red=ramp(25, 0.11, lift=-0.14))
TEAK = ramp(48, 0.07, lift=-0.2)
CLAY = ramp(40, 0.1, lift=-0.08)
GREYTILE = ramp(250, 0.012, lift=-0.14)
GREYBRICK = ramp(245, 0.012, lift=-0.1)
REDBRICK = ramp(30, 0.09, lift=-0.08)
GRANITE = ramp(80, 0.012, lift=-0.02)
ROOM = fmod.ROOM


def roof_tiles(c, L, R, top, eave, r):
    """Chinese pan tiles from above: rolls running down the slope, a lip to each course."""
    for y in range(top, eave):
        t = (y - top) / max(1, eave - top)
        b = 4 if t < 0.25 else 3 if t < 0.75 else 2
        for x in range(L, R):
            lx, ly = x % 4, (y - top) % 5
            c.p(x, y, r[min(7, b + 2)] if lx == 3 else r[b + 1] if ly == 4 else r[b - 1] if lx == 1 else r[b])
    c.rect(L, top - 2, R - L, 2, r[1])
    c.rect(L, top, R - L, 1, r[5])


def shutter_window(b, cx, sill_y, w, h, paint, trim, mode):
    """A tall window behind louvred shutters: shut, or folded back on a dark room."""
    c = b.c
    x, y = cx - w // 2, sill_y - h
    c.rect(x - 1, y - 1, w + 2, h + 1, trim[2])
    c.rect(x, y, w, h, ROOM[6])
    if mode == 'shut':
        persiennes(c, x, y, w, h, paint, True)
    else:
        # A rail across the opening, the leaves folded back against the wall.
        c.rect(x, sill_y - 12, w, 1, trim[1])
        for xx in range(x + 1, x + w, 3):
            c.rect(xx, sill_y - 11, 1, 10, trim[2])
        for lx in (x - 5, x + w + 1):
            c.rect(lx, y, 4, h, paint[3])
            c.rect(lx, y, 1, h, paint[1])
            for yy in range(y + 2, y + h - 1, 3):
                c.rect(lx + 1, yy, 3, 1, paint[2])
        b.panes.append((x, y, w, h, 'warm', h2(cx, sill_y, b.seed + 9) < 0.6))
    c.rect(x - 2, sill_y, w + 4, 1, trim[0])
    c.rect(x - 2, sill_y + 1, w + 4, 1, trim[3])
    op.cast(c, x - 1, sill_y + 2, w + 2, 2, 0.74)


def fan(c, cx, y, R, trim, seed):
    """A half-round light over a window, its panes in coloured glass."""
    glass = [(196, 150, 60, 255), (70, 130, 110, 255), (150, 70, 60, 255), (70, 100, 150, 255)]
    for yy in range(y - R - 1, y):
        for xx in range(cx - R - 1, cx + R + 1):
            d = math.hypot(xx + 0.5 - cx, yy + 0.5 - y)
            if d <= R + 1:
                a = math.atan2(y - yy, xx + 0.5 - cx)
                k = int(a / (math.pi / 4))
                c.p(xx, yy, trim[1] if d > R or abs(a / (math.pi / 4) - round(a / (math.pi / 4))) < 0.12 else glass[(k + seed) % 4])


class Shophouse(Block):
    """A row of shop-houses over a covered walk, each unit in its own wash."""
    FLOORS = dict(row=2, tall=3, shop=2, cottage=2, hut=2, stall=2, hall=3, wide=2)
    H0, H1, PARA, HEAD = 58, 46, 6, 30
    DEPTH = dict(row=32, tall=32, wide=34, hall=34, shop=30, cottage=30, hut=28, stall=24)

    def plan(self):
        n = max(1, round(self.W / 50))
        self.units = [(self.x0 + round(self.W * k / n), self.x0 + round(self.W * (k + 1) / n)) for k in range(n)]
        a, e = self.units[0]
        self.door_x, self.door_size = (a + e) // 2, (22, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        era = s['era']
        washes, paints = s['wash'], s['paint']
        self.washes = [WASH[washes[int(h2(self.seed, k, 3) * len(washes) + k) % len(washes)]] for k in range(len(self.units))]
        for k, (a, e) in enumerate(self.units):
            paint = PAINT[paints[int(h2(self.seed, k, 5) * len(paints)) % len(paints)]]
            self.unit(k, a, e, self.washes[k], paint)
        # The roof: tiles over each unit, the party walls standing through it.
        back = top - self.roof_depth
        if era == 'deco':
            self.deck(None, fmod.TAR, WASH['grey'], furnish=False)
            for k, (a, e) in enumerate(self.units):
                # A stepped parapet against the roof, its year on a plaque.
                wall = self.washes[k]
                mid, ph = (a + e) // 2, 12
                c.rect(a + 2, top - ph, e - a - 4, ph, wall[2])
                c.rect(a + 2, top - ph, e - a - 4, 1, wall[0])
                c.rect(mid - 11, top - ph - 7, 22, 7, wall[2])
                c.rect(mid - 11, top - ph - 7, 22, 1, wall[0])
                c.rect(mid - 11, top - ph - 7, 1, 7, wall[1])
                c.rect(mid + 10, top - ph - 7, 1, 7, wall[4])
                c.rect(mid - 1, top - ph - 15, 3, 8, wall[1])
                c.rect(mid + 1, top - ph - 15, 1, 8, wall[4])
                year = str(1928 + int(h2(self.seed, k, 9) * 28))
                text(c, mid - text_w(year) // 2, top - ph + 3, year, wall[5])
        else:
            roof_tiles(c, x0, x1, back, top, s.get('roof', CLAY))
            op.cast(c, x0, top + (4 if era == 'late' else 0), W, 3, 0.62)
        for xx in [a for a, _ in self.units] + [x1]:
            c.rect(xx - 2, back - 3, 4, self.roof_depth + 3, WHITE[2])
            c.rect(xx - 2, back - 3, 1, self.roof_depth + 3, WHITE[0])
            c.rect(xx + 1, back - 3, 1, self.roof_depth + 3, WHITE[4])
        self.foot(GRANITE)

    def unit(self, k, a, e, wall, paint):
        c, s = self.c, self.s
        base, top, era = self.base, self.top, s['era']
        trim = WHITE
        w = e - a
        mid = (a + e) // 2
        stucco(c, a, top, w, base - top, wall, 2, self.seed + k)
        n = 3 if w >= 52 else 2
        cols = [a + 5 + round((w - 10) * (j + 0.5) / n) for j in range(n)]
        for i in range(1, self.floors):
            t, b = self.floor(i)
            sill_y = b - 7
            if era == 'deco':
                # One band of steel windows under a concrete eyebrow, grooves below.
                bw, bh = w - 16, 22
                bx, by = a + 8, sill_y - bh - 4
                c.rect(bx - 1, by - 1, bw + 2, bh + 2, trim[3])
                op.glass(c, bx, by, bw, bh)
                for xx in range(bx + 6, bx + bw - 2, 7):
                    c.rect(xx, by, 1, bh, trim[2])
                c.rect(bx, by + 7, bw, 1, trim[2])
                self.panes.append((bx, by, bw, bh, 'warm', h2(mid, i, self.seed) < 0.6))
                c.rect(bx - 4, by - 5, bw + 8, 1, trim[0])
                c.rect(bx - 4, by - 4, bw + 8, 2, trim[1])
                c.rect(bx - 3, by - 2, bw + 6, 1, trim[4])
                op.cast(c, bx - 2, by - 1, bw + 4, 3, 0.66)
                for yy in (sill_y, sill_y + 2, sill_y + 4):
                    c.rect(a + 5, yy, w - 10, 1, wall[3])
                continue
            if era == 'late':
                # A band of glazed tiles under the windows.
                for xx in range(a + 6, e - 6, 4):
                    c.rect(xx, sill_y + 2, 3, 3, PAINT['jade' if (xx // 4) % 2 else 'red'][2])
                    c.p(xx, sill_y + 2, trim[1])
            for j, cx in enumerate(cols):
                mode = 'shut' if h2(cx, i, self.seed + 2) < 0.45 else 'open'
                wh = 26 if era == 'late' else 30
                shutter_window(self, cx, sill_y, 10, wh, paint, trim, mode)
                if era == 'late':
                    fan(c, cx, sill_y - wh - 2, 5, trim, self.seed + j)
            if era == 'late':
                # Pilasters between the windows, a capital to each.
                for px in [a + 3] + [(p + q) // 2 - 1 for p, q in zip(cols, cols[1:])] + [e - 6]:
                    c.rect(px, t + 8, 3, b - t - 10, trim[1])
                    c.rect(px + 2, t + 8, 1, b - t - 10, trim[4])
                    c.rect(px - 1, t + 6, 5, 2, trim[0])
                    c.rect(px - 1, t + 8, 5, 1, trim[4])
            c.rect(a, b - 1, w, 1, trim[1])
            c.rect(a, b, w, 1, trim[4])
        # The head of the wall.
        if era == 'late':
            c.rect(a, top, w, 2, trim[0])
            c.rect(a, top + 2, w, 5, wall[2])
            for xx in range(a + 6, e - 5, 8):
                c.rect(xx, top + 3, 3, 3, trim[1])
                c.p(xx + 1, top + 4, PAINT['red'][2])
            c.rect(a, top + 7, w, 1, trim[4])
        elif era == 'deco':
            c.rect(a, top, w, 2, wall[0])
            c.rect(a, top + 2, w, 1, wall[4])
        # The covered walk: a beam on two piers, the front in its shade.
        t0 = self.floor(0)[0]
        ceil = t0 + 10
        c.rect(a, t0, w, 10, wall[1])
        c.rect(a, t0, w, 1, trim[0])
        c.rect(a, t0 + 9, w, 1, wall[4])
        c.rect(a + 7, ceil, w - 14, base - ceil, ROOM[4])
        c.rect(a + 7, ceil, w - 14, 5, ROOM[5])
        shop = h2(self.seed, k, 21) < s.get('shops', 0.55) and k != 0
        fx, fw = a + 9, w - 18
        if shop:
            interior(c, fx, ceil + 8, fw, base - ceil - 8, ['shelves', 'counter', 'racks'][(k + self.seed) % 3], self.seed + k)
            self.panes.append((fx, ceil + 8, fw, base - ceil - 8, 'shop', True))
            for lx in (fx - 1, fx + fw - 3):
                c.rect(lx, ceil + 6, 4, base - ceil - 6, TEAK[3])
                c.rect(lx, ceil + 6, 1, base - ceil - 6, TEAK[2])
            self.sign(a + 8, t0 - 1, w - 16, 12, 'board')
        else:
            # A house: the door between two barred windows, a vent over each.
            back = wall[4]
            c.rect(fx, ceil + 5, fw, base - ceil - 5, back)
            dy = base - 40
            c.rect(mid - 9, dy, 18, 40, TEAK[4])
            for lx in (mid - 9, mid):
                c.rect(lx + 1, dy + 1, 7, 38, TEAK[3])
                c.rect(lx + 2, dy + 3, 5, 14, TEAK[2])
                c.rect(lx + 2, dy + 20, 5, 16, TEAK[2])
            c.rect(mid - 9, dy, 18, 1, TEAK[1])
            # The half doors that keep the street out and let the air in.
            for lx in (mid - 9, mid):
                c.rect(lx + 1, base - 22, 8, 20, paint[2])
                c.rect(lx + 1, base - 22, 8, 1, paint[0])
                c.rect(lx + 3, base - 18, 4, 5, paint[3])
            for wx in (fx + 2, fx + fw - 9):
                if abs(wx + 3 - mid) < 13:
                    continue
                c.rect(wx, base - 34, 7, 20, ROOM[6])
                for xx in range(wx + 1, wx + 7, 2):
                    c.rect(xx, base - 34, 1, 20, TEAK[2])
                c.rect(wx - 1, base - 35, 9, 1, trim[2])
                c.rect(wx - 1, base - 14, 9, 1, trim[1])
                self.panes.append((wx, base - 34, 7, 20, 'warm', h2(wx, k, self.seed) < 0.5))
            for vx in (mid - 3,):
                c.rect(vx, dy - 7, 7, 4, ROOM[6])
                c.rect(vx, dy - 5, 7, 1, TEAK[2])
        # The walk's tiled floor, then the piers standing in the light.
        for xx in range(a + 7, e - 7, 4):
            c.rect(xx, base - 3, 4, 3, CLAY[2] if (xx // 4) % 2 else WASH['cream'][2])
        for px in (a, e - 7):
            op.raised(c, px, ceil, 7, base - ceil, wall, 2)
            c.rect(px - 1 if px == a else px, ceil, 8, 2, trim[1])
            c.rect(px, base - 6, 7, 6, wall[3])
            cast_right(c, px + 7, ceil + 2, base - ceil - 2, 3, 0.7)
        op.cast(c, a + 7, ceil, w - 14, 3, 0.6)
        # The party wall's end, the height of the front.
        c.rect(a, top, 2, t0 - top, trim[1])
        c.rect(e - 2, top, 2, t0 - top, trim[3])


class Lilong(Block):
    """A Shanghai lane row: brick to the lane, a stone gate with black doors
    under its pediment, the upper floor's windows over it, grey tiles."""
    FLOORS = dict(row=2, tall=3, shop=2, cottage=2, hut=2, stall=2, hall=2, wide=2)
    H0, H1, PARA, HEAD = 60, 44, 4, 30
    DEPTH = Shophouse.DEPTH

    def plan(self):
        n = max(1, round(self.W / 52))
        self.units = [(self.x0 + round(self.W * k / n), self.x0 + round(self.W * (k + 1) / n)) for k in range(n)]
        a, e = self.units[0]
        self.door_x, self.door_size = (a + e) // 2, (22, 44)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, band, trim = s['wall'], s['band'], s.get('trim', GRANITE)
        render = s.get('render')
        if render:
            stucco(c, x0, top, W, base - top, wall, 2, self.seed)
        else:
            brickwork(c, x0, top, W, base - top, wall, 3, self.seed)
        t0 = self.floor(0)[0]
        for i in range(1, self.floors):
            t, b = self.floor(i)
            if not render:
                for yy in (b - 6, t + 10):
                    brickwork(c, x0, yy, W, 3, band, 2, self.seed + i)
        for k, (a, e) in enumerate(self.units):
            w, mid = e - a, (a + e) // 2
            for i in range(1, self.floors):
                t, b = self.floor(i)
                n = 2 if w < 56 else 3
                for j in range(n):
                    cx = a + 6 + round((w - 12) * (j + 0.5) / n)
                    x, y = cx - 6, b - 8 - 26
                    c.rect(x - 1, y - 1, 14, 28, trim[2])
                    if render:
                        op.glass(c, x, y, 12, 26)
                        c.rect(x + 6, y, 1, 26, WHITE[2])
                        c.rect(x, y + 8, 12, 1, WHITE[2])
                    else:
                        c.rect(x, y, 12, 26, ROOM[6])
                        persiennes(c, x, y, 12, 26, s['paint'], h2(cx, i, self.seed) < 0.5)
                    self.panes.append((x, y, 12, 26, 'warm', h2(cx, i, self.seed + 4) < 0.55))
                    # A brick arch over each, a stone sill under.
                    for xx in range(x - 2, x + 14):
                        c.rect(xx, y - 4, 1, 3, band[2 if xx % 3 else 4] if not render else trim[2])
                    c.rect(x - 2, b - 8, 16, 1, trim[0])
                    c.rect(x - 2, b - 7, 16, 1, trim[3])
            # The gate: a stone frame, black leaves with their rings, a pediment over the lintel.
            gw, gh = 24, 42
            gx, gy = mid - gw // 2, base - gh
            c.rect(gx - 4, gy - 4, gw + 8, gh + 4, trim[2])
            c.rect(gx - 4, gy - 4, gw + 8, 1, trim[0])
            c.rect(gx - 4, gy - 4, 1, gh + 4, trim[1])
            c.rect(gx + gw + 3, gy - 4, 1, gh + 4, trim[4])
            INK = fmod.INK
            c.rect(gx, gy, gw, gh, INK[4])
            c.rect(gx, gy, gw // 2, gh, INK[3])
            c.rect(gx + gw // 2, gy, 1, gh, INK[6])
            c.rect(gx, gy, gw, 2, INK[6])
            for rx in (gx + gw // 2 - 4, gx + gw // 2 + 3):
                c.rect(rx, gy + gh // 2, 2, 2, (214, 170, 80, 255))
            curved = (k + self.seed) % 2 == 0
            for i in range(-gw // 2 - 4, gw // 2 + 5):
                tt = abs(i) / (gw / 2 + 4)
                up = round(11 * (math.sqrt(max(0.0, 1 - tt * tt)) if curved else 1 - tt))
                c.rect(mid + i, gy - 5 - up, 1, up + 1, band[2] if not render else wall[3])
                c.p(mid + i, gy - 5 - up, trim[0])
                c.p(mid + i, gy - 4 - up, trim[1])
            c.rect(mid - 3, gy - 10, 6, 3, trim[1])
            c.rect(gx - 5, gy - 5, gw + 10, 1, trim[0])
            op.cast(c, gx, gy + 2, gw, 3, 0.7)
            c.rect(gx - 2, base - 2, gw + 4, 2, trim[1])
            # The lane wall's coping at the first floor.
            c.rect(a, t0 - 1, w, 1, trim[0])
            c.rect(a, t0, w, 2, trim[2])
            c.rect(a, t0 + 2, w, 1, trim[4])
            c.rect(a, top, 2, base - top, trim[1])
            c.rect(e - 2, top, 2, base - top, trim[4])
        back = top - self.roof_depth
        roof_tiles(c, x0, x1, back, top, s.get('roof', GREYTILE))
        op.cast(c, x0, top, W, 3, 0.62)
        for k, (a, e) in enumerate(self.units):
            mid = (a + e) // 2
            # A dormer for the loft.
            dy = top - 9
            c.rect(mid - 8, dy - 9, 16, 9, wall[2] if render else band[2])
            op.glass(c, mid - 6, dy - 7, 12, 6)
            self.panes.append((mid - 6, dy - 7, 12, 6, 'warm', h2(mid, 7, self.seed) < 0.4))
            roof_tiles(c, mid - 10, mid + 10, dy - 15, dy - 9, s.get('roof', GREYTILE))
        for xx in [a for a, _ in self.units] + [x1]:
            c.rect(xx - 2, back - 3, 4, self.roof_depth + 3, trim[2])
            c.rect(xx - 2, back - 3, 1, self.roof_depth + 3, trim[0])
            c.rect(xx + 1, back - 3, 1, self.roof_depth + 3, trim[4])
        self.foot(GRANITE)


PASTEL = ['lime', 'cream', 'yellow', 'mint', 'sky', 'pink']
NEW = {
    'shophouse': (Shophouse, 'Shop-house row', [
        dict(era='early', wash=['lime', 'cream', 'ochre'], paint=['wood', 'jade']),
        dict(era='early', wash=['lime', 'yellow', 'sky'], paint=['teal', 'wood']),
        dict(era='early', wash=['cream', 'lime', 'mint'], paint=['jade', 'blue'], roof=GREYTILE),
    ]),
    'shophouse-late': (Shophouse, 'Shop-house row', [
        dict(era='late', wash=PASTEL, paint=['jade', 'teal', 'wood'], para=10),
        dict(era='late', wash=['cream', 'yellow', 'pink', 'lime'], paint=['blue', 'jade'], para=10),
        dict(era='late', wash=['mint', 'sky', 'lime', 'jade'], paint=['wood', 'red'], para=10),
    ]),
    'shophouse-deco': (Shophouse, 'Shop-house row', [
        dict(era='deco', wash=['grey', 'cream', 'lime'], paint=['teal'], para=4),
        dict(era='deco', wash=['cream', 'mint', 'yellow'], paint=['jade'], para=4),
        dict(era='deco', wash=['grey', 'sky', 'pink'], paint=['blue'], para=4),
    ]),
    'lilong': (Lilong, 'Lane house row', [
        dict(wall=GREYBRICK, band=REDBRICK, paint=PAINT['wood']),
        dict(wall=REDBRICK, band=GREYBRICK, paint=PAINT['jade']),
        dict(wall=WASH['ochre'], band=WASH['cream'], paint=PAINT['teal'], render=True, roof=CLAY),
    ]),
}
ABOUT = {
    'shophouse': ('white-plaster', 'A row of shop-houses over a covered walk: tall shuttered windows above, a shop '
                                   'or a house door in the shade below, a tiled roof.'),
    'shophouse-late': ('white-plaster', 'A row of shop-houses with pilasters, coloured fanlights, a band of glazed '
                                        'tiles and a frieze of plaster flowers over the covered walk.'),
    'shophouse-deco': ('modern-stucco', 'A row of shop-houses with steel windows under concrete eyebrows and a '
                                        'stepped parapet carrying its year.'),
    'lilong': ('bengal-brick', 'A lane row of brick houses, each behind a stone-framed gate of black doors, with '
                               'shuttered windows above and a grey tiled roof.'),
}
FORMS = {k: 'row shop tall cottage hut' for k in NEW}
fmod.LOOKS.update(NEW)
fmod.ABOUT.update(ABOUT)
fmod.FORMS.update(FORMS)
fmod.register()

SHOW = [('row', 12), ('tall', 10), ('shop', 7), ('hut', 4)]


def sheet(out, looks=(), zoom=2):
    """Every look in each colour at each of its forms, beside the adult."""
    from PIL import Image
    from art.reference import current_adult
    rows = []
    for look in looks or NEW:
        for v in range(len(NEW[look][2])):
            rows.append([fmod.house(look, v, form, n, 3 + v + k).build() for k, (form, n) in enumerate(SHOW)])
    pad = 14
    W = max(sum(i.width - 32 + pad for i in r) for r in rows) + 60
    H = sum(max(i.height for i in r) + pad for r in rows) + pad
    im = Image.new('RGBA', (W, H), (190, 172, 140, 255))
    y = pad
    man = current_adult()
    for r in rows:
        h = max(i.height for i in r)
        x = pad
        im.alpha_composite(man, (x, y + h - man.height - 9))
        x += man.width + 2
        for i in r:
            im.alpha_composite(i, (x, y + h - i.height))
            x += i.width - 32 + pad
        y += h + pad
    im.resize((W * zoom, H * zoom), Image.NEAREST).save(out)
    print(out, im.size)


if __name__ == '__main__':
    sheet(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'artifacts/straits.png'), sys.argv[2:])
