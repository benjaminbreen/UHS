"""The city centre of 1850 to 1914, where it was built in the British and
American manner: what stands downtown before the steel frame. Paris and
Vienna keep the immeuble; the shop parade is the high street's.

    .venv/bin/python scripts/art/front_victorian.py out.png [look ...]   # each colour and form beside the adult

chambers: offices, a bank or an insurance company behind one front. A
channelled ground floor with a round-headed door, two or three storeys of
windows dressed as the style has them, a cornice and a balustrade against the
sky. In Portland stone with pediments, in sandstone as a palazzo, in red brick
and terracotta, in banded brick with pointed arches, or in stone gone black
with soot. The seed picks what stands on the parapet and whether the ground
floor is let as shops.
emporium: a department store or a wholesale warehouse. Plate glass between
piers at the street, then the floors above under one great arch to each bay,
iron panels where a floor crosses it, a row of small lights under the cornice
where there is an attic, and a lantern over the light well.
pub: the public house of a shop street. A front of glazed tile, etched glass
and lanterns under two storeys of brick and a gable with its roundel.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import ramp, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_modern as fmod  # noqa: E402
from art.front_modern import Block, cast_right, shopfront, glass_door, awning  # noqa: E402
from art import front_europe as eu  # noqa: E402
from art.front_europe import brickwork, stack, panel_door, steps, fanlight, PORTLAND, WHITE, LEAD, RED, STOCK, \
    SHOP  # noqa: E402
from art.front_homes import balustrade, BUFF  # noqa: E402

SANDSTONE = ramp(70, 0.055, lift=-0.03)
TERRACOTTA = ramp(58, 0.075, lift=0.0)
SOOT = ramp(75, 0.018, lift=-0.17)
GRIT = ramp(70, 0.03, lift=-0.09)
ROOFLEAD = LEAD[2:] + [LEAD[7], LEAD[7]]


# ------------------------------------------------------------------ parts

def rustic(c, x, y, w, h, r, course=8, block=24):
    """Channelled masonry: each course a cushion lit along its top, the joint
    under it a line of shadow."""
    for yy in range(y, y + h):
        ly, row = (yy - y) % course, (yy - y) // course
        for xx in range(x, x + w):
            lx = (xx - x + (row % 2) * (block // 2)) % block
            c.p(xx, yy, r[5] if ly == course - 1 else r[4] if lx == 0 else r[1] if ly == 0 else
                r[3] if ly == course - 2 else r[2])


def light(b, cx, sill_y, w, h, frame, head='flat', ring=None, alt=None, on=None):
    """A sash under a flat, round or pointed head, in a ring of stone where
    the head is arched; `alt` lays every other voussoir in a second stone.
    Returns the top of the opening, ring and all."""
    c = b.c
    x, R = cx - w // 2, w / 2
    rise = 0 if head == 'flat' else round(R) if head == 'round' else round(w * 0.82)
    spring = sill_y - h + rise

    def inside(px, py, grow=0):
        if py >= spring:
            return x - grow <= px < x + w + grow
        if head == 'round':
            return math.hypot(px + 0.5 - cx, py + 0.5 - spring) <= R + grow
        if head == 'point':
            return max(math.hypot(px + 0.5 - x, py + 0.5 - spring),
                       math.hypot(px + 0.5 - (x + w), py + 0.5 - spring)) <= w + grow
        return False

    top = sill_y - h
    box = [(px, py) for py in range(top - 4, sill_y) for px in range(x - 4, x + w + 4)]
    keep = {q: c.g(*q) for q in box if not inside(*q)}
    op.glass(c, x, top, w, h)
    for q, v in keep.items():
        if top <= q[1] and x <= q[0] < x + w:
            c.p(*q, v)
    for px, py in box:
        if inside(px, py):
            if not all(inside(px + dx, py + dy) for dx, dy in ((1, 0), (-1, 0), (0, -1))):
                c.p(px, py, frame[2] if px > cx else frame[1])
        elif ring is not None and rise and py < spring + 2 and inside(px, py, 3):
            a = math.atan2(spring - py, px + 0.5 - cx)
            r = alt if alt is not None and int(a / (math.pi / 11) + 20) % 2 else ring
            c.p(px, py, r[0] if not inside(px, py - 1, 3) else r[1] if px < cx else r[3] if alt is None else r[2])
    mid = (spring + sill_y) // 2 if rise else top + h // 2
    c.rect(x + 1, mid - 1, w - 2, 2, frame[1])
    c.rect(x + 1, mid + 1, w - 2, 1, frame[4])
    if rise:
        c.rect(x + 1, spring, w - 2, 1, frame[2])
    if w >= 18:
        c.rect(cx, spring + 1, 1, sill_y - spring - 1, frame[2])
    c.rect(x, sill_y - 1, w, 1, frame[3])
    op.reveal(c, x + 1, spring + 1, w - 2, sill_y - spring - 2, 2)
    b.panes.append((x + 1, spring, w - 2, sill_y - spring - 1, 'warm', h2(cx, sill_y, b.seed + 9) < 0.5 if on is None else on))
    return top - (3 if ring is not None and rise else 0)


def ledge(c, x, y, w, r, d=3):
    """A stone sill or string course: its top seen, its face, its shadow."""
    c.rect(x, y, w, 1, r[0])
    c.rect(x, y + 1, w, d - 1, r[2])
    c.rect(x, y + d, w, 1, r[4])
    op.cast(c, x + 1, y + d + 1, w - 2, 2, 0.72)


def pediment(c, cx, y, w, r, curved=False):
    """A pediment on the row above y: its raking or segmental top, the shadow in its tympanum."""
    half = w // 2
    rise = max(5, w // 4)
    for i in range(-half, half + 1):
        t = abs(i) / half
        up = round(rise * (math.sqrt(max(0.0, 1 - t * t)) if curved else 1 - t))
        for k in range(up + 1):
            c.p(cx + i, y - 2 - k, r[0] if k == up else r[1] if k >= up - 1 else r[3] if i > 0 else r[2])
    c.rect(cx - half - 1, y - 2, w + 3, 1, r[0])
    c.rect(cx - half - 1, y - 1, w + 3, 1, r[2])
    c.rect(cx - half, y, w + 1, 1, r[4])
    op.cast(c, cx - half + 1, y + 1, w - 1, 2, 0.74)


def cornice(c, x, y, w, r, over=3):
    """A cornice from y down: its top lit, a fascia, dentils in its shadow."""
    c.rect(x - over, y, w + 2 * over, 1, r[0])
    c.rect(x - over, y + 1, w + 2 * over, 3, r[1])
    c.rect(x - over + 1, y + 4, w + 2 * over - 2, 1, r[3])
    c.rect(x, y + 5, w, 3, r[4])
    for xx in range(x + 1, x + w - 2, 4):
        c.rect(xx, y + 5, 2, 2, r[1])
    op.cast(c, x, y + 8, w, 3, 0.66)


def urn(c, cx, y, r):
    """An urn standing on the row above y."""
    for k, hw in enumerate((1, 2, 3, 3, 2, 1, 2)):
        yy = y - 1 - k
        c.rect(cx - hw, yy, 2 * hw + 1, 1, r[2])
        c.p(cx - hw, yy, r[0])
        c.p(cx + hw, yy, r[4])
    c.p(cx, y - 9, r[1])
    c.p(cx, y - 8, r[1])


# ------------------------------------------------------------------ chambers

class Chambers(Block):
    """Offices behind one grand front: a channelled ground floor, dressed
    windows above, a cornice and balustrade, stacks and a lantern on the leads."""
    FLOORS = dict(row=3, tall=4, wide=3, hall=3, shop=2, cottage=2, hut=2, stall=2)
    H0, H1, PARA, HEAD = 64, 48, 16, 30
    DEPTH = dict(row=40, tall=40, wide=46, hall=46, shop=34, cottage=30, hut=28, stall=24)

    def plan(self):
        W, sd = self.W, self.seed
        # Three bays or five between the end piers, so the front has a middle.
        n = 5 if W >= 192 else 3
        self.pitch = (W - 14) / n
        self.bays = [self.x0 + 7 + round(self.pitch * (k + 0.5)) for k in range(n)]
        on = lambda i, odds: h2(sd, i, 31) < odds
        self.d = n // 2 if on(1, 0.6) else 0 if on(6, 0.5) else n - 1
        self.door_x, self.door_size = self.bays[self.d], (22, 46)
        self.o = dict(pediment=on(2, 0.55) and W >= 96, urns=on(3, 0.55), shops=on(4, 0.45), curved=on(5, 0.5),
                      balcony=on(7, 0.6))

    def window(self, cx, sill_y, w, h, i, k):
        """One light of an upper floor in the dress of the style; returns its top."""
        c, s = self.c, self.s
        stone, style = s['stone'], s['style']
        head = dict(classical='flat', round='round', gothic='point')[style]
        if style == 'classical':
            op.raised(c, cx - w // 2 - 3, sill_y - h - 3, w + 6, h + 3, stone, 1)
        y = light(self, cx, sill_y, w, h, s.get('frame', WHITE), head, stone, s.get('alt'))
        if style == 'classical' and i == 1:
            pediment(c, cx, y - 4, w + 12, stone, self.o['curved'] and k % 2 == 1)
        elif style == 'classical':
            c.rect(cx - 2, y - 6, 5, 5, stone[1])
            c.rect(cx - 2, y - 6, 5, 1, stone[0])
            c.rect(cx - 2, y - 1, 5, 1, stone[4])
        return y

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, stone, style, frame = s['wall'], s['stone'], s['style'], s.get('frame', WHITE)
        g0 = self.floor(0)[0]
        n, mid_bay, half = len(self.bays), len(self.bays) // 2, round(self.pitch / 2)
        if s.get('brick'):
            brickwork(c, x0, top, W, g0 - top, wall, 3, self.seed)
        else:
            fm.ashlar(c, x0, top, W, g0 - top, wall, 8, 22)
        # The ends stand forward as piers from the ground to the cornice, and
        # the middle bay between two more.
        mx = self.bays[mid_bay]
        for px, pw in ((x0, 7), (x1 - 7, 7), (mx - half, 4), (mx + half - 4, 4)):
            op.raised(c, px, top + 8, pw, g0 - top - 8, stone, 1 if s.get('brick') else 2)
            cast_right(c, px + pw, top + 11, g0 - top - 11, 2, 0.8)
        cornice(c, x0, top, W, stone)
        for i in range(1, self.floors):
            t, b = self.floor(i)
            last, sill_y = i == self.floors - 1 and self.floors > 2, b - 9
            h = 26 if last else 34
            if s.get('bands'):
                for yy in (sill_y + 4, sill_y - h + 16):
                    brickwork(c, x0 + 7, yy, W - 14, 3, s['bands'], 2, self.seed + i)
            ends = []
            for k, cx in enumerate(self.bays):
                # A pair where the bay is wide, one broad light in the middle bay.
                if k == mid_bay:
                    lights = [(cx, 22)]
                elif self.pitch >= 44:
                    lights = [(cx - 10, 14), (cx + 10, 14)]
                else:
                    lights = [(cx, 18)]
                for lx, w in lights:
                    self.window(lx, sill_y, w, h, i, k)
                a, e = lights[0][0] - lights[0][1] // 2 - 4, lights[-1][0] + lights[-1][1] // 2 + 4
                ends.append((a, e))
                ledge(c, a, sill_y, e - a, stone, 2)
                if k == mid_bay and i == 1 and self.o['balcony']:
                    # A balcony on brackets under the middle window.
                    balustrade(c, a - 3, sill_y + 1, e - a + 6, stone)
                    c.rect(a - 4, sill_y + 1, e - a + 8, 1, stone[0])
                    c.rect(a - 4, sill_y + 2, e - a + 8, 3, stone[2])
                    c.rect(a - 3, sill_y + 5, e - a + 6, 1, stone[4])
                    for bx in (a - 1, e - 3):
                        c.rect(bx, sill_y + 6, 4, 4, stone[2])
                        c.rect(bx + 1, sill_y + 10, 2, 2, stone[3])
                    op.cast(c, a - 2, sill_y + 6, e - a + 4, 4, 0.66)
            if style != 'classical':
                # The arches spring from a course that runs the width of the front.
                ys = sill_y - h + (7 if style == 'round' else 12)
                for (_, a), (e, _) in zip([(0, x0 + 7)] + ends, ends + [(x1 - 7, 0)]):
                    if e - a > 2:
                        c.rect(a, ys, e - a, 1, stone[1])
                        c.rect(a, ys + 1, e - a, 1, stone[4])
        # The ground floor: its own cornice, then channelled stone.
        rustic(c, x0, g0, W, base - g0, s.get('ground', stone))
        ledge(c, x0 - 1, g0, W + 2, stone, 4)
        ground = s.get('ground', stone)
        dx = self.door_x
        for k, cx in enumerate(self.bays):
            if k == self.d:
                continue
            if self.o['shops']:
                a, e = cx - half + 5, cx + half - 5
                self.sign(a, g0 + 8, e - a, 12, 'board')
                shopfront(self, a, g0 + 22, e - a, base - g0 - 22, SHOP[s['door']], ground, 'shelves')
            else:
                for lx in ((cx - 11, cx + 11) if self.pitch >= 50 else (cx,)):
                    w = 18 if self.pitch >= 50 else 22
                    y = light(self, lx, base - 14, w, 40, frame, 'round', ground)
                    c.rect(lx - 2, y - 2, 5, 6, ground[1])
                    c.rect(lx - 2, y + 4, 5, 1, ground[4])
                    ledge(c, lx - w // 2 - 3, base - 14, w + 6, ground, 3)
        # The door in its arch, up two steps, a lamp either side.
        dy = base - 4 - 40
        c.rect(dx - 12, dy - 12, 24, 52, ground[6])
        fanlight(c, dx, dy, 11, ground, WHITE)
        self.panes.append((dx - 8, dy - 9, 16, 8, 'warm', True))
        panel_door(c, dx - 11, dy, 22, 40, SHOP[s['door']])
        c.rect(dx, dy, 1, 40, SHOP[s['door']][6])
        for px, py in [(px, py) for py in range(dy - 16, dy + 1) for px in range(dx - 16, dx + 16)]:
            d = math.hypot(px + 0.5 - dx, py + 0.5 - dy)
            if 12 <= d < 15.5 and py < dy:
                a = math.atan2(dy - py, px + 0.5 - dx)
                c.p(px, py, ground[0] if d >= 14.5 else ground[1 if int(a / (math.pi / 9) + 20) % 2 else 3])
        for lx in (dx - 19, dx + 19):
            c.rect(lx - 1, dy + 8, 3, 5, eu.IRON[3])
            c.p(lx, dy + 10, (250, 226, 150, 255))
            self.lamp(lx, dy + 10)
        steps(c, dx, base, 28, 2, stone)
        # The leads behind the balustrade.
        self.deck(None, ROOFLEAD, stone, furnish=False)
        back = top - self.roof_depth
        for k, sx in enumerate([x0 + 18, x1 - 18] if W >= 112 else [x1 - 18]):
            stack(self, sx, back + 24, 16, 16, wall if s.get('brick') else stone, 3, brick=bool(s.get('brick')), smoke=k == 0)
        if W >= 112:
            fmod.skylight(c, (x0 + x1) // 2 - 12, top - 6, 24, 12)
        balustrade(c, x0, top, W, stone)
        mid = (x0 + x1) // 2
        if self.o['pediment']:
            pw = min(72, W - 44)
            c.rect(mid - pw // 2, top - 12, pw, 12, stone[2])
            c.rect(mid - pw // 2, top - 12, pw, 1, stone[0])
            pediment(c, mid, top - 12, pw, stone)
            c.rect(mid - 9, top - 9, 18, 7, stone[3])
            c.rect(mid - 8, top - 8, 16, 5, stone[1])
        if self.o['urns']:
            for ux in (x0 + 1, x1 - 2) + ((mid - 36, mid + 36) if self.o['pediment'] and W >= 150 else ()):
                urn(c, ux, top - 11, stone)
        self.foot(stone)


# ------------------------------------------------------------------ the emporium

class Emporium(Block):
    """A store or warehouse of iron and plate glass: display windows at the
    street, a great arch to each bay over the floors above, an attic of small
    lights where there is a fourth, a lantern over the light well."""
    FLOORS = dict(row=3, tall=4, wide=3, hall=4, shop=2, cottage=2, hut=2, stall=2)
    H0, H1, PARA, HEAD = 66, 44, 18, 30
    DEPTH = Chambers.DEPTH

    def plan(self):
        W, sd = self.W, self.seed
        n = max(2, round((W - 12) / 50))
        self.pitch = (W - 6) / n
        self.bays = [self.x0 + 3 + round(self.pitch * (k + 0.5)) for k in range(n)]
        self.d = n // 2 if n % 2 else (n // 2 - 1 if h2(sd, 1, 37) < 0.5 else n // 2)
        self.door_x, self.door_size = self.bays[self.d], (24, 46)
        on = lambda i, odds: h2(sd, i, 37) < odds
        self.o = dict(attic=on(2, 0.6) and W >= 96, urns=on(3, 0.5), awnings=on(4, 0.6))

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        pier, stone, iron, frame = s['pier'], s['stone'], SHOP[s['iron']], s.get('frame', WHITE)
        g0 = self.floor(0)[0]
        half = round(self.pitch / 2)
        if s.get('brick'):
            brickwork(c, x0, top, W, base - top, pier, 3, self.seed)
        else:
            fm.ashlar(c, x0, top, W, base - top, pier, 8, 22)
        cornice(c, x0, top, W, stone)
        aw = round(self.pitch) - 14
        arcade = self.floors >= 4
        up = self.floors - (1 if arcade else 0)
        if self.floors > 1:
            # One arch to a bay over every floor but the attic.
            sill_y, head = self.floor(1)[1] - 8, self.floor(up - 1)[0] + 9
            for cx in self.bays:
                light(self, cx, sill_y, aw, sill_y - head, frame, 'round', stone)
                for mx in (cx - aw // 6, cx + aw // 6):
                    c.rect(mx, head + aw // 2 + 1, 1, sill_y - head - aw // 2 - 2, frame[2])
                # Where a floor crosses the arch, an iron panel with a boss.
                for i in range(2, up):
                    fy = self.floor(i)[1]
                    c.rect(cx - aw // 2 + 1, fy - 6, aw - 2, 11, iron[3])
                    c.rect(cx - aw // 2 + 1, fy - 6, aw - 2, 1, iron[1])
                    c.rect(cx - aw // 2 + 1, fy + 4, aw - 2, 1, iron[5])
                    for bx in (cx - aw // 4, cx + aw // 4):
                        c.rect(bx - 2, fy - 3, 5, 5, iron[2])
                        c.p(bx, fy - 1, iron[0])
                ledge(c, cx - aw // 2 - 3, sill_y, aw + 6, stone, 3)
                c.rect(cx - 3, head - 4, 7, 7, stone[1])
                c.rect(cx - 3, head - 4, 7, 1, stone[0])
                c.rect(cx - 3, head + 3, 7, 1, stone[4])
        if arcade:
            t, b = self.floor(self.floors - 1)
            ledge(c, x0 + 4, b - 4, W - 8, stone, 2)
            for cx in self.bays:
                for lx in (cx - 12, cx, cx + 12):
                    light(self, lx, b - 5, 9, 24, frame, 'round', stone)
        # Piers the height of the front, standing forward of the glass.
        for px in [x0] + [round(x0 + 3 + self.pitch * k) - 3 for k in range(1, len(self.bays))] + [x1 - 6]:
            op.raised(c, px, top + 8, 6, base - top - 8, stone if s.get('brick') else pier, 1 if s.get('brick') else 2)
            cast_right(c, px + 6, top + 11, base - top - 11, 2, 0.8)
            c.rect(px - 1, g0 - 2, 8, 5, stone[1])
            c.rect(px - 1, g0 - 2, 8, 1, stone[0])
            c.rect(px - 1, g0 + 3, 8, 1, stone[4])
        # The street: a fascia in iron, the windows under it, the doors in the middle.
        for k, cx in enumerate(self.bays):
            a, e = cx - half + 4, cx + half - 4
            c.rect(a, g0 + 4, e - a, 15, iron[3])
            c.rect(a, g0 + 4, e - a, 1, iron[1])
            if k == self.d:
                dx = cx
                c.rect(a, g0 + 19, e - a, base - g0 - 19, fmod.ROOM[6])
                glass_door(self, dx, base, 24, 44, iron)
                for sx, sw in ((a, dx - 13 - a), (dx + 13, e - dx - 13)):
                    if sw >= 7:
                        shopfront(self, sx, g0 + 19, sw, base - g0 - 19, iron, iron, 'shelves', transom=0)
                # A lamp over the doors.
                c.rect(dx - 2, g0 + 8, 5, 7, eu.IRON[3])
                c.rect(dx - 1, g0 + 9, 3, 5, (250, 226, 150, 255))
                self.lamp(dx, g0 + 11)
                continue
            if k % 2 == (self.d + 1) % 2 or len(self.bays) < 3:
                self.sign(a + 3, g0 + 6, e - a - 6, 11, 'board')
            shopfront(self, a, g0 + 19, e - a, base - g0 - 19, iron, iron, 'shelves', transom=7)
            if self.o['awnings'] and s.get('awning'):
                awning(c, a + 1, g0 + 20, e - a - 2, s['awning'], WHITE, depth=8)
        self.deck(None, ROOFLEAD, stone, furnish=False)
        back = top - self.roof_depth
        stack(self, x1 - 18, back + 24, 16, 16, pier if s.get('brick') else stone, 3, brick=bool(s.get('brick')))
        mid = (x0 + x1) // 2
        lw = min(56, W - 70)
        if lw >= 24:
            fmod.skylight(c, mid - lw // 2, top - 5, lw, 14)
        # A solid parapet, panelled, and a taller piece over the middle.
        c.rect(x0, top - 9, W, 9, stone[2])
        c.rect(x0, top - 9, W, 1, stone[0])
        c.rect(x0, top - 8, W, 1, stone[1])
        for px in range(x0 + 5, x1 - 20, 22):
            c.rect(px, top - 6, 16, 4, stone[3])
            c.rect(px + 1, top - 5, 14, 2, stone[2])
        if self.o['attic']:
            pw = min(64, W - 40)
            c.rect(mid - pw // 2, top - 20, pw, 20, stone[2])
            c.rect(mid - pw // 2, top - 20, pw, 1, stone[0])
            c.rect(mid - pw // 2, top - 20, 1, 20, stone[1])
            c.rect(mid + pw // 2 - 1, top - 20, 1, 20, stone[4])
            pediment(c, mid, top - 20, pw, stone, True)
            c.rect(mid - pw // 2 + 6, top - 15, pw - 12, 10, stone[3])
            c.rect(mid - pw // 2 + 7, top - 14, pw - 14, 8, stone[1])
        if self.o['urns']:
            for ux in (x0 + 2, x1 - 3):
                urn(c, ux, top - 9, stone)
        self.foot(stone)


# ------------------------------------------------------------------ the pub

def etched(c, x, y, w, h):
    """Etched glass: the pane frosted, a border and a lozenge cut clear."""
    g = op.GLASS
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            edge = xx in (x + 1, x + w - 2) or yy in (y + 1, y + h - 2)
            loz = abs(xx - x - w // 2) + abs(yy - y - h // 2) * 2 in (h - 6, h - 7)
            c.p(xx, yy, g[4] if edge or loz else g[1] if (xx + yy) % 9 == 0 else g[2])


class Pub(Block):
    """A public house: glazed tile and etched glass at the street, a lantern
    on a bracket, brick above under a gable that carries its roundel."""
    FLOORS = dict(row=3, tall=3, wide=3, hall=3, shop=3, cottage=2, hut=2, stall=2)
    H0, H1, PARA, HEAD = 64, 46, 10, 38
    DEPTH = dict(row=36, tall=36, wide=40, hall=40, shop=34, cottage=30, hut=28, stall=24)

    def plan(self):
        W, sd = self.W, self.seed
        self.door_x = self.x0 + 22 if h2(sd, 1, 41) < 0.5 else self.x1 - 22
        self.door_size = (22, 46)
        self.n = 3 if W >= 144 else 2
        self.o = dict(curved=h2(sd, 2, 41) < 0.5, pots=h2(sd, 3, 41) < 0.5)

    def paint(self):
        c, s = self.c, self.s
        x0, x1, W, base, top = self.x0, self.x1, self.W, self.base, self.top
        wall, stone, tile, frame = s['wall'], s['stone'], s['tile'], s.get('frame', WHITE)
        brick = s.get('brick', True)
        g0 = self.floor(0)[0]
        mid = (x0 + x1) // 2
        if brick:
            brickwork(c, x0, top, W, g0 - top, wall, 3, self.seed)
        else:
            c.rect(x0, top, W, g0 - top, wall[1])
        for px in (x0, x1 - 6):
            op.raised(c, px, top + 6, 6, g0 - top - 6, stone, 1)
        cornice(c, x0, top, W, stone, 2)
        bays = [x0 + 6 + round((W - 12) * (k + 0.5) / self.n) for k in range(self.n)]
        for i in range(1, self.floors):
            t, b = self.floor(i)
            for cx in bays:
                op.raised(c, cx - 12, b - 9 - 35, 24, 35, stone, 1)
                y = light(self, cx, b - 9, 18, 32, frame)
                if i == 1:
                    pediment(c, cx, y - 4, 28, stone, self.o['curved'])
                ledge(c, cx - 13, b - 9, 26, stone, 2)
        # The pub front: tiled piers, a fascia, etched windows, the door at one end.
        c.rect(x0, g0, W, base - g0, tile[3])
        ledge(c, x0 - 1, g0, W + 2, stone, 3)
        fy = g0 + 5
        c.rect(x0, fy, W, 14, tile[4])
        c.rect(x0, fy, W, 1, tile[2])
        c.rect(x0, fy + 13, W, 1, tile[6])
        self.sign(x0 + 10, fy + 1, W - 20, 12, 'board')
        dx = self.door_x
        gy = fy + 16
        marks = [x0, x1 - 7, dx - 18, dx + 11] + [x0 + round((W - 7) * k / (self.n + 1)) for k in range(1, self.n + 1)]
        piers = []
        for q in marks:
            if all(abs(q - o) >= 16 for o in piers):
                piers.append(q)
        piers.sort()
        for a, e in zip(piers, piers[1:]):
            a += 7
            if a <= dx <= e:
                dy = base - 4 - 40
                c.rect(a, gy, e - a, base - gy, fmod.ROOM[6])
                panel_door(c, dx - 10, dy, 21, 40, SHOP[s['door']])
                op.glass(c, dx - 7, dy + 4, 15, 12)
                op.glass(c, dx - 10, gy + 2, 21, dy - gy - 4)
                self.panes += [(dx - 7, dy + 4, 15, 12, 'warm', True), (dx - 10, gy + 2, 21, dy - gy - 4, 'warm', True)]
                continue
            if e - a < 10:
                c.rect(a, gy, e - a, base - gy, tile[3])
                continue
            gh = base - gy - 16
            c.rect(a, gy, e - a, base - gy, tile[5])
            op.glass(c, a + 2, gy + 2, e - a - 4, gh)
            etched(c, a + 2, gy + 2 + gh // 3, e - a - 4, gh - gh // 3)
            c.rect(a + 2, gy + 2 + gh // 3, e - a - 4, 1, tile[2])
            self.panes.append((a + 2, gy + 2, e - a - 4, gh, 'warm', True))
            op.reveal(c, a + 2, gy + 2, e - a - 4, gh, 2)
            # The stallriser in tile, a lozenge to each panel.
            c.rect(a, base - 13, e - a, 13, tile[3])
            c.rect(a, base - 13, e - a, 1, tile[1])
            for lx in range(a + 7, e - 5, 11):
                for d in range(4):
                    c.rect(lx - d, base - 10 + d, 2 * d + 1, 1, tile[1])
                    c.rect(lx - d, base - 3 - d, 2 * d + 1, 1, tile[2])
        for px in piers:
            op.raised(c, px, gy - 1, 7, base - gy + 1, tile, 2)
            c.rect(px + 2, gy + 4, 3, base - gy - 10, tile[1])
            c.rect(px - 1, gy - 1, 9, 2, tile[1])
        # Lanterns on brackets over the fascia.
        for lx in ([mid] if W < 128 else [x0 + W // 4, x1 - W // 4]):
            c.rect(lx - 4, g0 - 13, 9, 1, eu.IRON[3])
            c.rect(lx, g0 - 13, 1, 3, eu.IRON[3])
            c.rect(lx - 3, g0 - 10, 7, 9, eu.IRON[4])
            c.rect(lx - 2, g0 - 9, 5, 7, (250, 226, 150, 255))
            c.rect(lx - 4, g0 - 11, 9, 1, eu.IRON[2])
            self.lamp(lx, g0 - 6)
        steps(c, dx, base, 26, 2, stone)
        # A slate roof behind the gable, its stacks on the party walls.
        back = top - self.roof_depth
        eu.slates(c, x0, x1, back, top, s['roof'], 5, 8)
        c.rect(x0, back - 2, W, 2, s['roof'][1])
        c.rect(x0, back, W, 1, s['roof'][5])
        for k, sx in enumerate((x0 + 10, x1 - 10)):
            stack(self, sx, back + 18, 14, 18, wall, 3 if self.o['pots'] else 2, brick=brick, smoke=k == 0)
        gw = min(60, W - 44)
        for i in range(-gw // 2, gw // 2 + 1):
            t = abs(i) / (gw / 2)
            up = round(22 * (math.cos(t * math.pi / 2) ** 0.7 if self.o['curved'] else 1 - t)) + 6
            c.rect(mid + i, top - up, 1, up, wall[2] if brick else wall[1])
            c.p(mid + i, top - up, stone[0])
            c.p(mid + i, top - up + 1, stone[1])
            c.p(mid + i, top - up + 2, stone[3])
        for yy in range(top - 17, top - 3):
            for xx in range(mid - 7, mid + 7):
                d = math.hypot(xx + 0.5 - mid, yy + 0.5 - (top - 10))
                if d < 6.5:
                    c.p(xx, yy, stone[0] if d >= 5.5 and yy < top - 10 else stone[3] if d >= 5.5 else s['emblem'][3 if d > 3 else 1])
        self.foot(stone)


# ------------------------------------------------------------------ the looks

TILE_OX = ramp(22, 0.1, lift=-0.14)
TILE_GREEN = ramp(160, 0.075, lift=-0.15)
TILE_BLACK = ramp(280, 0.02, lift=-0.24)
AWN = dict(green=ramp(155, 0.07, lift=-0.08), red=ramp(25, 0.12, lift=-0.06), navy=ramp(255, 0.06, lift=-0.14))
NEW = {
    'chambers': (Chambers, 'Chambers', [
        dict(wall=PORTLAND, stone=PORTLAND, style='classical', door='black'),
        dict(wall=SANDSTONE, stone=SANDSTONE, style='round', door='green'),
        dict(wall=RED, stone=TERRACOTTA, style='round', door='oxblood', brick=True, ground=TERRACOTTA),
        dict(wall=STOCK, stone=PORTLAND, style='gothic', door='blue', brick=True, alt=RED, bands=RED),
        dict(wall=SOOT, stone=GRIT, style='classical', door='black', ground=SOOT),
    ]),
    'emporium': (Emporium, 'Emporium', [
        dict(pier=PORTLAND, stone=PORTLAND, iron='green', awning=AWN['green']),
        dict(pier=RED, stone=TERRACOTTA, iron='black', brick=True, awning=AWN['red']),
        dict(pier=STOCK, stone=GRIT, iron='oxblood', brick=True),
        dict(pier=SANDSTONE, stone=SANDSTONE, iron='brown', awning=AWN['navy']),
    ]),
    'pub': (Pub, 'Public house', [
        dict(wall=RED, stone=PORTLAND, tile=TILE_OX, roof=eu.SLATE, door='black', emblem=fmod.GOLD),
        dict(wall=STOCK, stone=BUFF, tile=TILE_GREEN, roof=eu.SLATE, door='oxblood', emblem=fmod.GOLD),
        dict(wall=eu.STUCCO, stone=PORTLAND, tile=TILE_BLACK, roof=eu.SLATE, door='green', emblem=fmod.GOLD,
             brick=False),
    ]),
}
ABOUT = {
    'chambers': ('bengal-brick', 'Offices, a bank or an insurance company behind one grand front: a channelled '
                                 'ground floor with a round-headed door, dressed windows above, a cornice and a '
                                 'balustrade against the sky.'),
    'emporium': ('bengal-brick', 'A department store or warehouse of iron and plate glass: display windows at '
                                 'the street, a great arch to each bay above, a lantern over the light well.'),
    'pub': ('bengal-brick', 'A public house: glazed tile, etched glass and a lantern at the street, brick above '
                            'under a gable with its roundel.'),
}
FORMS = dict(chambers='row shop wide tall hall', emporium='row wide tall hall', pub='shop cottage tall')
fmod.LOOKS.update(NEW)
fmod.ABOUT.update(ABOUT)
fmod.FORMS.update(FORMS)
fmod.register()

SHOWS = dict(pub=[('tall', 10), ('shop', 7), ('cottage', 6)], emporium=[('wide', 16), ('row', 12), ('tall', 10)])
SHOW = [('wide', 16), ('row', 12), ('tall', 10), ('shop', 7)]


def sheet(out, looks=(), zoom=2):
    """Every look in each colour at each of its forms, beside the adult."""
    from PIL import Image
    from art.reference import current_adult
    rows = []
    for look in looks or NEW:
        for v in range(len(NEW[look][2])):
            rows.append([fmod.house(look, v, form, n, 3 + v + k).build()
                         for k, (form, n) in enumerate(SHOWS.get(look, SHOW))])
    pad = 14
    W = max(sum(i.width - 32 + pad for i in r) for r in rows) + 60
    H = sum(max(i.height for i in r) + pad for r in rows) + pad
    im = Image.new('RGBA', (W, H), (176, 164, 140, 255))
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
    sheet(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'artifacts/victorian.png'), sys.argv[2:])
