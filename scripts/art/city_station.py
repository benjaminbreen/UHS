"""Railway stations for the industrial city, drawn to the city kit's standard.

    .venv/bin/python scripts/art/city_station.py artifacts/station/sheet.png [terminus|town|modern|night]

A terminus of the high railway age, King's Cross to the Gare de l'Est: great
glazed arches at the ends of the train sheds, seen into, a clock tower, office
ranges ending in pavilions, and the sheds' vaults running back behind the
screen with a smoke louvre along each ridge.
"""
from pathlib import Path
import math
import sys

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.city_kit import (  # noqa: E402
    C, Oblique, BRICK, GLASS, GOLD, IRON, LIME, WARM_LIME, OAK, SLATE, INK, RED, CREAM,
    STOREY, glass, h2, mix, outline, rgba, sphere, lit_rooms,
)
from art.city_civic import (  # noqa: E402
    ZINC, DIAL, LEAD, COPPER, SOOT, arch, ashlar, brick, cornice, balustrade, return_,
)
from art.oblique_style import DRIFT, drift  # noqa: E402

# London stock: the yellow-grey brick that the smoke turned nearly black.
STOCK = ['#2a2024', '#4b3d38', '#6e5d4e', '#8e7b64', '#ab9676', '#c3ae8a', '#dac8a2']
# Station ironwork was painted: Brunswick green, and cream on the canopies.
IRONGREEN = ['#0c1a18', '#16302a', '#22463b', '#33604f', '#4c7e68', '#76a88c']
PAINT = ['#7d735f', '#a79b80', '#cdc1a0', '#e8dfc2', '#f7f1dc']
# Roof glass seen from above takes the sky; the soot lies along the ribs.
SKY_GLASS = ['#27323f', '#3e5163', '#5a7488', '#7e9aac', '#a9c2cc', '#d3e2e2']
# The shed seen through its screen: gloom lit by the gas and the day at the far end.
GLOOM = ['#15161f', '#20222e', '#2e3040', '#454656', '#6f6c6c', '#b8ae96']
GAS = ['#6a4418', '#b0782c', '#e2b35a', '#f8e2a0', '#fff6d8']


def arc_ring(c, cx, cy, r0, r1, col_fn, y_max=None):
    """Paint the ring r0 < d <= r1 about (cx, cy), above cy only."""
    for y in range(int(cy - r1) - 1, int(cy) + 1):
        for x in range(int(cx - r1) - 1, int(cx + r1) + 2):
            dx, dy = x + 0.5 - cx, cy - y
            d = math.hypot(dx, dy)
            if r0 < d <= r1 and dy >= 0:
                col = col_fn(x, y, d, math.atan2(dy, dx))
                if col is not None:
                    c.px(x, y, col)


def rivets(c, x0, x1, y, col, step=3):
    for x in range(x0, x1 + 1, step):
        c.px(x, y, col)


def clock_face(c, cx, cy, r, st, gilt=True):
    """A dial in a moulded stone ring: white enamel, a ring of minute dots,
    gilt hour marks. The hands are the game's, drawn to its hour."""
    c.ellipse(cx, cy, r + 3, r + 3, st[2])
    c.ellipse(cx - 0.5, cy - 0.5, r + 2.5, r + 2.5, st[6])
    c.ellipse(cx, cy, r + 2, r + 2, st[4])
    c.ellipse(cx, cy, r + 1, r + 1, GOLD[1] if gilt else IRON[1])
    c.ellipse(cx, cy, r, r, DIAL[1])
    c.ellipse(cx - 0.8, cy - 0.8, r - 1.5, r - 1.5, DIAL[2])
    for h in range(12):
        a = h * math.pi / 6
        for k in ((0.78, 0.92) if h % 3 == 0 else (0.86,)):
            x = cx + math.sin(a) * r * k
            y = cy - math.cos(a) * r * k
            c.px(int(x), int(y), DIAL[0] if not gilt or h % 3 else GOLD[0])
    c.px(int(cx), int(cy), DIAL[0])


def draw_hands(c, cx, cy, r, hour=10.17):
    """For the review sheet only; in the game the hands are live."""
    for frac, length, col in ((hour / 12, 0.5, DIAL[0]), ((hour % 1), 0.8, DIAL[0])):
        a = frac * 2 * math.pi
        for i in range(int(r * length * 2) + 1):
            t = i / 2
            c.px(int(cx + math.sin(a) * t), int(cy - math.cos(a) * t), col)


def slate_roof(c, x0, x1, top, bottom, hip=0, ramp=SLATE, seed=0):
    """Slates seen steeply from above: courses every three rows, joints
    staggered, the lit hip at the left and a dark one at the right."""
    rise = bottom - top
    for y in range(top, bottom + 1):
        t = (bottom - y) / max(1, rise)
        a = round(hip * t)
        for x in range(x0 + a, x1 - a + 1):
            row = (y - top) // 3
            col = ramp[3]
            if (y - top) % 3 == 2:
                col = ramp[2]
            elif (x + (row % 2) * 3) % 6 == 0:
                col = ramp[2]
            elif h2(x // 6, row, seed) > 0.9:
                col = ramp[4]
            if hip and x - (x0 + a) < 2:
                col = ramp[5]
            elif hip and (x1 - a) - x < 2:
                col = ramp[1]
            c.px(x, y, col)


def cresting(c, x0, x1, y, col=IRON[1], hi=IRON[3]):
    """Cast-iron cresting along a ridge: fleurs on a rail."""
    c.hl(x0, x1, y, col)
    for x in range(x0 + 1, x1, 4):
        c.vl(x, y - 3, y - 1, col)
        c.px(x, y - 4, hi)
        c.px(x - 1, y - 2, col)
        c.px(x + 1, y - 2, col)


class Terminus(Oblique):
    """A terminus of the high railway age. Wide enough, it takes two train
    sheds either side of a clock tower, King's Cross; narrower, one shed whose
    arch carries the clock in its glazing, the Gare de l'Est."""

    def __init__(self, W=320, sd=16, seed=0, wall=STOCK, st=WARM_LIME, roof=SLATE, platform=False):
        self.seed, self.b, self.st, self.roof = seed, wall, st, roof
        self.ashlar = wall is st
        self.twin = W >= 280
        self.platform = platform
        self.pav = 30 if W >= 200 else 24
        self.tower = 40 if self.twin else 0
        rest = W - 2 * self.pav - self.tower
        self.range_w = max(18, (rest - (2 if self.twin else 1) * 96) // 2)
        self.span = (rest - 2 * self.range_w) // (2 if self.twin else 1)
        self.GROUND, self.FIRST = 58, 42
        wall_h = self.GROUND + self.FIRST + 6
        self.crown = self.span // 2 + 70
        up = (self.crown - wall_h) + 22 + 56 + (150 if self.twin else 40)
        super().__init__(W, wall_h, up, sd)
        self.lamps = []
        self.overlays = []
        self.clocks = []

    # ------------------------------------------------------------ layout
    def bays(self):
        """(kind, x0, x1) left to right."""
        x = 0
        out = []
        seq = ['pav', 'range', 'arch']
        seq += ['tower', 'arch'] if self.twin else []
        seq += ['range', 'pav']
        widths = {'pav': self.pav, 'range': self.range_w, 'arch': self.span, 'tower': self.tower}
        for k in seq:
            out.append((k, x, x + widths[k] - 1))
            x += widths[k]
        # Any slack goes to the right range so the pavilions stay square.
        k, a, b = out[-2]
        out[-2] = (k, a, b + self.W - x)
        k, a, b = out[-1]
        out[-1] = (k, a + self.W - x, self.W - 1)
        return out

    def fill(self, x0, x1, y0, y1, dark=0):
        if self.ashlar:
            ashlar(self.c, x0, x1, y0, y1, self.st, self.seed)
        else:
            brick(self.c, x0, x1, y0, y1, self.b, self.seed, dark)

    # ------------------------------------------------------------ render
    def render(self):
        c, H, W = self.c, self.H, self.W
        st = self.st
        self.cornice_y = H - 6 - self.GROUND - self.FIRST
        bays = self.bays()
        return_(c, W, [(self.cornice_y - 15, H - 1, mix(self.b[2], INK, 0.2))])
        for kind, x0, x1 in bays:
            if kind == 'arch':
                self.shed(x0, x1)
        for kind, x0, x1 in bays:
            if kind == 'range':
                self.range_(x0, x1)
        for kind, x0, x1 in bays:
            if kind == 'arch':
                self.arch_bay(x0, x1)
            elif kind == 'pav':
                self.pavilion(x0, x1, left=x0 == 0)
            elif kind == 'tower':
                self.clock_tower(x0, x1)
        # Plinth of granite the whole length.
        c.rect(0, H - 5, W - 1, H - 1, LIME[2])
        c.hl(0, W - 1, H - 5, LIME[4])
        c.hl(0, W - 1, H - 4, LIME[3])
        c.hl(0, W - 1, H - 1, LIME[1])
        for x in range(0, W, 13):
            c.vl(x, H - 4, H - 2, LIME[1])
        for kind, x0, x1 in bays:
            if kind == 'arch':
                self.marquise(x0 - 2, x1 + 2)
        self.door_x = W // 2
        return outline(c.im)

    # ------------------------------------------------------------ sheds
    def shed(self, x0, x1):
        """The train shed's vault running back from the screen: iron and
        glass in the middle, slate at the haunches, a smoke louvre along the
        ridge, the far end's curve for a skyline."""
        c = self.c
        span = x1 - x0 + 1
        rise = span // 5
        base = self.H - 6 - self.crown - 8
        depth = 56
        cx = x0 + span / 2
        for j in range(depth + rise + 1):
            y = base - j
            o = drift(j, depth + rise)
            for x in range(x0 - 2, x1 + 3):
                t = (x + 0.5 - (x0 - 2)) / (span + 4)
                # The far end's arch: the vault's top edge curves over.
                top = depth + rise * math.sin(math.pi * t)
                if j > top:
                    continue
                n = (t - 0.5) * 2
                light = 0.62 - 0.55 * n
                haunch = abs(n) > 0.62
                lantern = abs(x + 0.5 - cx) < 3
                if lantern:
                    # The smoke louvre along the ridge, blackened.
                    col = SOOT[2] if x + 0.5 < cx - 2 else SOOT[1] if x + 0.5 < cx + 2 else SOOT[0]
                    if j % 3 == 0:
                        col = LEAD[2]
                    c.px(x + drift(j, depth + rise), y, col)
                    continue
                if haunch:
                    ramp = self.roof
                    k = 5 if light > 0.95 else 4 if light > 0.7 else 3 if light > 0.4 else 2
                    col = ramp[k]
                    if (j % 3) == 2:
                        col = ramp[k - 1]
                else:
                    k = 4 if light > 0.85 else 3 if light > 0.55 else 2 if light > 0.3 else 1
                    col = SKY_GLASS[k]
                    if (x - x0) % 5 == 0:
                        col = SKY_GLASS[max(0, k - 2)]
                    if j % 9 == 0:
                        col = IRON[2]
                    elif j % 9 == 1:
                        col = SKY_GLASS[max(0, k - 1)]
                    # Soot settles either side of the louvre.
                    if abs(x + 0.5 - cx) < 12 and h2(x, j // 2, self.seed) < 0.45:
                        col = mix(col, SOOT[1], 0.5)
                if j == int(top) or j == int(top) - 1:
                    col = ZINC[4] if j == int(top) else ZINC[2]
                c.px(x + o, y, col)
        self.smoke = getattr(self, 'smoke', [])
        for f in (0.3, 0.7):
            j = int(top * f)
            self.smoke.append([int(cx) + drift(j, depth + rise), base - j - 8, 'vent'])

    # ------------------------------------------------------------ the arch
    def arch_bay(self, x0, x1):
        c, H, st, b = self.c, self.H, self.st, self.b
        span = x1 - x0 + 1
        pier = 9
        ox0, ox1 = x0 + pier, x1 - pier
        cx = (ox0 + ox1 + 1) / 2
        r = (ox1 - ox0 + 1) / 2
        spring = H - 6 - self.crown + int(r)
        top = H - 6 - self.crown - 20
        # The screen wall: brick (or ashlar) from the parapet to the ground.
        self.fill(x0, x1, top + 8, H - 6)
        # Parapet: a stepped gable following the arch, coped in stone.
        for x in range(x0, x1 + 1):
            t = abs(x + 0.5 - (x0 + span / 2)) / (span / 2)
            step = 0 if t < 0.18 else 4 if t < 0.5 else 8
            y = top + step
            for yy in range(y, top + 9):
                c.px(x, yy, mix(b[4], b[3], 0.3) if not self.ashlar else st[4])
            c.px(x, y, st[6])
            c.px(x, y + 1, st[5])
            c.px(x, y + 2, st[3])
        if (self.seed + x0) % 2 == 0:
            self.overlays.append(['pigeons', x0 + 10, top + 1])
        # A name band under the coping: gilt rules round a winged wheel.
        by = top + 12
        c.rect(ox0 + 4, by, ox1 - 4, by + 6, IRONGREEN[1])
        c.hl(ox0 + 4, ox1 - 4, by, GOLD[2])
        c.hl(ox0 + 4, ox1 - 4, by + 6, GOLD[1])
        mid = int(cx)
        for x in range(ox0 + 7, ox1 - 6):
            if abs(x - mid) > 9 and (x - ox0) % 4 < 3:
                c.px(x, by + 3, GOLD[3] if (x - ox0) % 4 == 0 else GOLD[2])
        sphere(c, mid + 0.5, by + 3, 3.2, GOLD)
        for s in (-1, 1):
            for i in range(6):
                c.px(mid + s * (4 + i), by + 2 - (i // 2) + 1, GOLD[3] if i < 3 else GOLD[2])
                c.px(mid + s * (4 + i), by + 3 - (i // 3) + 1, GOLD[1])
        # Buttressing piers either side, stone quoins, a cap.
        for px0 in (x0, x1 - pier + 1):
            self.fill(px0, px0 + pier - 1, top + 6, H - 6, dark=1)
            c.vl(px0, top + 6, H - 6, st[6] if not self.ashlar else st[5])
            for i, y in enumerate(range(spring - 50, H - 8, 8)):
                w = 7 if i % 2 else 4
                xa = px0 if px0 == x0 else px0 + pier - w
                c.rect(xa, y, xa + w - 1, y + 5, st[5])
                c.hl(xa, xa + w - 1, y, st[6])
                c.hl(xa, xa + w - 1, y + 5, st[2])
            c.rect(px0 - 1, top + 2, px0 + pier, top + 6, st[5])
            c.hl(px0 - 1, px0 + pier, top + 2, st[6])
            c.hl(px0 - 1, px0 + pier, top + 6, st[2])
            sphere(c, px0 + pier / 2, top - 1, 3, st, lo=2)
        self.interior(ox0, ox1, cx, r, spring)
        self.glazing(ox0, ox1, cx, r, spring)
        # Archivolt: voussoirs of stone and brick alternating, a keystone.
        def voussoir(x, y, d, ang):
            k = int((ang / math.pi) * 25)
            if d > r + 6:
                return st[2]
            if d > r + 5:
                return st[6] if ang > math.pi / 2 else st[4]
            poly = k % 2 == 0
            ramp = st if poly or self.ashlar else RED if False else b
            col = ramp[5] if ang > math.pi / 2 else ramp[4]
            if not poly and not self.ashlar:
                col = mix(RED[2], b[3], 0.35) if ang > math.pi / 2 else mix(RED[1], b[2], 0.35)
            if abs(((ang / math.pi) * 25) % 1) < 0.12:
                col = st[2]
            if d <= r + 1:
                col = st[3]
            return col
        arc_ring(c, cx, spring, r, r + 7, voussoir)
        for y in range(spring, H - 6):
            for dx, col in ((-1, st[5]), (0, st[3])):
                pass
        # Keystone: a carved head over the crown.
        ky = int(spring - r - 8)
        kx = int(cx)
        c.rect(kx - 4, ky, kx + 3, ky + 11, st[5])
        c.vl(kx - 4, ky, ky + 11, st[6])
        c.vl(kx + 3, ky + 1, ky + 11, st[2])
        c.hl(kx - 5, kx + 4, ky, st[6])
        c.hl(kx - 5, kx + 4, ky + 1, st[3])
        c.rect(kx - 2, ky + 4, kx + 1, ky + 8, st[4])
        c.px(kx - 1, ky + 5, st[2])
        c.px(kx + 1, ky + 5, st[2])
        c.hl(kx - 1, kx, ky + 7, st[3])
        # Imposts at the springing.
        for xa in (ox0 - 3, ox1 - 2):
            c.rect(xa, spring, xa + 5, spring + 3, st[5])
            c.hl(xa, xa + 5, spring, st[6])
            c.hl(xa, xa + 5, spring + 3, st[2])
        # The reveal: the thickness of the screen, lit on the right jamb.
        for y in range(spring + 4, H - 6):
            c.vl(ox0, y, y, st[2])
            c.px(ox0 + 1, y, mix(st[2], GLOOM[2], 0.5))
            c.px(ox1, y, st[4])
            c.px(ox1 - 1, y, st[3])

    def interior(self, ox0, ox1, cx, r, spring):
        """The shed through the glass: rib after rib of the roof receding
        straight back, each drawn a step higher, platform lamps down the
        length, and the daylight at the far end."""
        c, H = self.c, self.H
        floor = H - 6
        for y in range(int(spring - r), floor + 1):
            for x in range(ox0 + 2, ox1 - 1):
                dx, dy = x + 0.5 - cx, spring - y
                if dy > 0 and math.hypot(dx, dy) > r - 0.5:
                    continue
                t = (y - (spring - r)) / max(1, floor - (spring - r))
                k = 2 if t < 0.35 else 1 if t < 0.8 else 0
                c.px(x, y, GLOOM[k])
        # The far end: a bright arch of day, small and high up.
        fr = r * 0.4
        fy = spring - 12
        for y in range(int(fy - fr), int(fy) + 18):
            for x in range(int(cx - fr), int(cx + fr) + 1):
                dx, dy = x + 0.5 - cx, fy - y
                if (dy > 0 and math.hypot(dx, dy) > fr) or abs(dx) > fr:
                    continue
                c.px(x, y, GLOOM[5] if dy > fr * 0.35 else GLOOM[4])
        # Ribs: arches receding, ever higher and smaller, bolder near.
        for i in range(7, 0, -1):
            s = 1 - i * 0.085
            rr = r * s
            yy = spring - i * 3.2
            col = GLOOM[3] if i > 3 else GLOOM[4]
            arc_ring(c, cx, yy, rr - 1.2, rr, lambda x, y, d, a, col=col: col if y > spring - r + 1 and math.hypot(x + .5 - cx, spring - y) < r - 2 else None)
            for side in (-1, 1):
                x = int(cx + side * rr) - (1 if side > 0 else 0)
                c.vl(x, int(yy), int(yy + (floor - spring) * s * 0.6) + 8, col)
        # Tie rods across the springing.
        c.hl(ox0 + 2, ox1 - 2, spring - 2, GLOOM[3])
        # Platforms converging on the day, their lamps glowing.
        for side in (-1, 1):
            for i in range(5):
                s = 1 - i * 0.14
                x = int(cx + side * r * 0.42 * s)
                y = int(floor - 12 - i * 5)
                c.px(x, y, GAS[3])
                c.px(x, y + 1, GAS[1])
                c.vl(x, y + 2, y + 6, GLOOM[3])
                if y < floor - 46:
                    self.lamps.append((x, y, 1))
        # A haze of steam hanging under the roof.
        for y in range(int(spring - r * 0.7), int(spring + 6)):
            for x in range(ox0 + 2, ox1 - 1):
                dx, dy = x + 0.5 - cx, spring - y
                if dy > 0 and math.hypot(dx, dy) > r - 2:
                    continue
                n = math.sin(x * 0.21 + y * 0.13) + math.sin(x * 0.07 - y * 0.31) + 0.6 * math.sin(y * 0.5)
                if n > 1.35 and (x + y) % 2 == 0:
                    p = c.get(x, y)
                    c.px(x, y, mix(p, '#9a9ca0', 0.45))

    def glazing(self, ox0, ox1, cx, r, spring):
        """The screen: a fan of iron bars from a hub at the springing,
        three rings of transoms, a riveted girder across, and small-paned
        glazing down to the door heads. The panes take the sky at the top."""
        c, H = self.c, self.H
        hub_r = 9 if not self.twin else 6

        def pane(x, y, d, ang):
            deg = math.degrees(ang)
            if d > r - 2:
                return IRONGREEN[1] if d > r - 1 else IRONGREEN[3]
            if d <= hub_r + 1:
                return None
            # A bar is a line through the hub: one pixel wide at any radius.
            off = min(abs(math.radians(deg - a)) for a in range(0, 181, 12)) * d
            if off < 0.55:
                return IRONGREEN[1] if d > r * 0.42 else IRONGREEN[2]
            for ring in (0.42, 0.72):
                if abs(d - r * ring) < 0.6:
                    return IRONGREEN[1]
            p = c.get(x, y)
            # Clear glass with the sky's streaks in it; the shed shows through.
            if (x + y) % 13 in (0, 1) and d > r * 0.5:
                return mix(p, SKY_GLASS[4], 0.45)
            return mix(p, SKY_GLASS[2], 0.1)
        arc_ring(c, cx, spring, 0, r, pane)
        self.lamps.append(('lunette', cx, spring, r))
        if not self.twin:
            clock_face(c, cx, spring - 1, hub_r, self.st)
            self.clocks.append([cx, spring - 1, hub_r])
        else:
            c.ellipse(cx, spring, hub_r + 1, hub_r + 1, IRONGREEN[1])
            c.ellipse(cx - 0.5, spring - 0.5, hub_r - 1, hub_r - 1, IRONGREEN[3])
            sphere(c, cx, spring - 1, 3, GOLD)
        # The girder across the springing, riveted.
        gy = spring + 1
        c.rect(ox0 + 1, gy, ox1 - 1, gy + 4, IRONGREEN[2])
        c.hl(ox0 + 1, ox1 - 1, gy, IRONGREEN[4])
        c.hl(ox0 + 1, ox1 - 1, gy + 4, IRONGREEN[0])
        rivets(c, ox0 + 3, ox1 - 3, gy + 2, IRONGREEN[5])
        # Below it the lower screen: tall panes between iron mullions, to the
        # door heads.
        dh = H - 6 - 44
        for y in range(gy + 5, dh):
            for x in range(ox0 + 2, ox1 - 1):
                k = (x - ox0) % 9
                if k == 0:
                    c.px(x, y, IRONGREEN[2])
                elif (y - gy) % 12 == 0:
                    c.px(x, y, IRONGREEN[1])
                else:
                    p = c.get(x, y)
                    c.px(x, y, mix(p, SKY_GLASS[3], 0.1 if (x + y) % 11 else 0.45))
        # Doors: three pairs of panelled leaves under glazed fanlights, with
        # cast columns between.
        c.rect(ox0 + 1, dh, ox1 - 1, dh + 3, IRONGREEN[2])
        c.hl(ox0 + 1, ox1 - 1, dh, IRONGREEN[4])
        n = max(3, int((ox1 - ox0) // 24))
        wseg = (ox1 - ox0 - 2) / n
        for i in range(n):
            dx0 = int(ox0 + 2 + i * wseg + 3)
            dx1 = int(ox0 + 2 + (i + 1) * wseg - 3)
            self.door(dx0, dx1, dh + 4, H - 6, i)
            if i:
                colx = int(ox0 + 2 + i * wseg)
                c.rect(colx - 1, dh + 4, colx + 1, H - 6, IRONGREEN[3])
                c.vl(colx - 1, dh + 4, H - 6, IRONGREEN[5])
                c.vl(colx + 1, dh + 4, H - 6, IRONGREEN[1])
                c.hl(colx - 2, colx + 2, dh + 4, IRONGREEN[4])

    def door(self, x0, x1, y0, y1, i):
        c = self.c
        c.rect(x0, y0, x1, y1, OAK[1])
        glass(c, x0 + 1, y0 + 1, x1 - 1, y0 + 9, self.seed + i)
        c.hl(x0, x1, y0 + 10, OAK[3])
        mid = (x0 + x1) // 2
        for xa, xb in ((x0 + 1, mid - 1), (mid + 1, x1 - 1)):
            if xb - xa < 2:
                continue
            c.rect(xa, y0 + 12, xb, y0 + 21, OAK[2])
            c.hl(xa, xb, y0 + 12, OAK[3])
            c.rect(xa, y0 + 24, xb, y1 - 3, OAK[2])
            c.hl(xa, xb, y0 + 24, OAK[3])
            c.vl(xb, y0 + 12, y1 - 3, OAK[0])
        c.vl(mid, y0 + 11, y1, OAK[0])
        c.px(mid - 1, y0 + 22, GOLD[2])
        c.px(mid + 1, y0 + 22, GOLD[2])
        c.vl(x0, y0, y1, OAK[0])
        c.vl(x1, y0, y1, OAK[0])

    def marquise(self, x0, x1):
        """A glass-and-iron canopy over the doors, cantilevered on scrolled
        brackets: its sloping glass lit from the sky, a cream fascia with a
        fringe of cast drops, and its shadow on the screen below."""
        c, H = self.c, self.H
        y = H - 6 - 44
        depth = 8
        for j in range(depth):
            for x in range(x0 - j // 2, x1 + j // 2 + 1):
                col = SKY_GLASS[4] if (x - x0) % 6 else IRONGREEN[2]
                if j == 0:
                    col = IRONGREEN[1]
                c.px(x, y - depth + j, col)
        fy = y
        c.rect(x0 - 4, fy, x1 + 4, fy + 3, PAINT[3])
        c.hl(x0 - 4, x1 + 4, fy, PAINT[4])
        c.hl(x0 - 4, x1 + 4, fy + 3, PAINT[1])
        for x in range(x0 - 4, x1 + 5):
            k = (x - x0) % 4
            if k == 1:
                c.vl(x, fy + 4, fy + 6, IRONGREEN[2])
                c.px(x, fy + 7, IRONGREEN[4])
            elif k in (0, 2):
                c.px(x, fy + 4, IRONGREEN[1])
        # Shadow under the canopy on the doors.
        for yy in range(fy + 5, fy + 12):
            for x in range(x0 + 1, x1):
                if (x + yy) % 2 == 0 or yy < fy + 8:
                    p = c.get(x, yy)
                    if p[3]:
                        c.px(x, yy, mix(p, INK, 0.35))
        # Brackets: scrolls from the wall up under the canopy.
        for x in list(range(x0 + 6, x1 - 4, 24)) + [x1 - 6]:
            for i in range(8):
                c.px(x + i // 2, fy + 5 + i, IRONGREEN[3])
                c.px(x + i // 2 + 1, fy + 5 + i, IRONGREEN[1])
            c.px(x - 1, fy + 5, IRONGREEN[4])
        # Gas lanterns hung from the canopy's edge.
        for x in (x0 + 10, x1 - 10):
            c.vl(x, fy + 4, fy + 6, IRON[1])
            c.rect(x - 2, fy + 7, x + 2, fy + 12, IRON[1])
            c.rect(x - 1, fy + 8, x + 1, fy + 11, GAS[3])
            c.px(x - 1, fy + 8, GAS[4])
            c.hl(x - 3, x + 3, fy + 7, IRON[2])
            self.lamps.append((x, fy + 9, 2))

    # ------------------------------------------------------------ ranges
    def range_(self, x0, x1):
        """An office range: an arcade of booking hall windows below, round-
        headed windows above, a cornice and balustrade, a slate roof."""
        c, H, st = self.c, self.H, self.st
        cy = self.cornice_y
        self.fill(x0, x1, cy, H - 6)
        gy = H - 6 - self.GROUND
        # Band courses.
        c.rect(x0, gy - 3, x1, gy, st[5])
        c.hl(x0, x1, gy - 3, st[6])
        c.hl(x0, x1, gy, st[2])
        n = max(1, (x1 - x0 + 1) // 22)
        w = (x1 - x0 + 1) / n
        for i in range(n):
            ax = x0 + w * (i + 0.5)
            arch(c, ax, gy + 12, 16, H - 6, st, self.seed + i)
            self.round_window(int(ax) - 5, cy + 18, 10, 24)
        cornice(c, x0, x1, cy - 1, st)
        balustrade(c, x0, x1, cy - 10, st)
        slate_roof(c, x0 + 1, x1, cy - 34, cy - 11, hip=0, ramp=self.roof, seed=self.seed)
        c.hl(x0 + 1, x1, cy - 34, self.roof[5])
        cresting(c, x0 + 2, x1 - 1, cy - 35)
        # Dormers.
        for i in range(n):
            ax = int(x0 + w * (i + 0.5))
            self.dormer(ax, cy - 12)

    def round_window(self, x, y, w, h):
        """A round-headed sash in a moulded stone surround with a key."""
        c, st = self.c, self.st
        r = w / 2
        cx = x + r
        for yy in range(int(y - r - 3), y + h + 3):
            for xx in range(x - 3, x + w + 3):
                dy = y - yy
                d = math.hypot(xx + 0.5 - cx, dy) if dy > 0 else abs(xx + 0.5 - cx)
                if d <= r:
                    col = GLASS[2] if yy < y + h * 0.4 else GLASS[1]
                    if ((xx - x) + (yy - y)) % 9 in (3, 4) and yy < y + h * 0.7:
                        col = GLASS[3]
                    c.px(xx, yy, col)
                elif d <= r + 1.2:
                    c.px(xx, yy, '#e9e3d6')
                elif d <= r + 3 and yy <= y + h:
                    c.px(xx, yy, st[5] if xx < cx else st[4])
        c.vl(int(cx), y - 1, y + h - 1, '#e9e3d6')
        c.hl(x, x + w - 1, y + h // 2, '#e9e3d6')
        c.rect(x - 3, y + h, x + w + 2, y + h + 2, st[5])
        c.hl(x - 3, x + w + 2, y + h + 2, st[2])
        c.rect(int(cx) - 1, int(y - r - 4), int(cx) + 1, int(y - r), st[6])
        c.vl(int(cx) + 1, int(y - r - 3), int(y - r), st[3])

    def dormer(self, cx, bottom):
        c, st = self.c, self.st
        c.rect(cx - 5, bottom - 14, cx + 4, bottom, st[5])
        c.vl(cx - 5, bottom - 14, bottom, st[6])
        c.vl(cx + 4, bottom - 13, bottom, st[2])
        glass(c, cx - 3, bottom - 10, cx + 2, bottom - 2, self.seed + cx)
        c.vl(cx, bottom - 10, bottom - 2, '#e9e3d6')
        for i in range(7):
            c.hl(cx - 6 + i, cx + 5 - i, bottom - 15 - i, self.roof[4] if i < 2 else self.roof[3])
        c.px(cx - 1, bottom - 22, self.roof[5])

    # ------------------------------------------------------------ pavilions
    def pavilion(self, x0, x1, left):
        """A corner pavilion: an attic storey over the ranges, rusticated
        quoins, and a steep French roof crowned with iron."""
        c, H, st = self.c, self.H, self.st
        cy = self.cornice_y - 14
        self.fill(x0, x1, cy, H - 6)
        for i, y in enumerate(range(cy + 2, H - 8, 7)):
            for xa, w in ((x0, 7 if i % 2 else 4), (x1 - (7 if i % 2 else 4) + 1, 7 if i % 2 else 4)):
                c.rect(xa, y, xa + w - 1, y + 5, st[5])
                c.hl(xa, xa + w - 1, y, st[6])
                c.hl(xa, xa + w - 1, y + 5, st[2])
        cx = (x0 + x1) // 2
        gy = H - 6 - self.GROUND
        c.rect(x0, gy - 3, x1, gy, st[5])
        c.hl(x0, x1, gy - 3, st[6])
        c.hl(x0, x1, gy, st[2])
        arch(c, cx + 0.5, gy + 10, 18, H - 6, st, self.seed + 91, door=True)
        # A tripartite window over the door, then an oculus in the attic.
        self.round_window(cx - 5, gy - 34, 10, 24)
        for s in (-1, 1):
            c.rect(cx + s * 10 - 2, gy - 28, cx + s * 10 + 1, gy - 10, GLASS[1])
            c.rect(cx + s * 10 - 3, gy - 29, cx + s * 10 + 2, gy - 29, st[5])
            c.rect(cx + s * 10 - 3, gy - 9, cx + s * 10 + 2, gy - 8, st[5])
        cornice(c, x0 - 1, x1 + 1, cy - 1, st)
        oy = cy + 10
        c.ellipse(cx + 0.5, oy, 6, 6, st[5])
        c.ellipse(cx + 0.5, oy, 4, 4, GLASS[1])
        c.px(cx - 1, oy - 2, GLASS[3])
        c.hl(x0 + 2, x1 - 2, cy + 20, st[5])
        # The roof: a steep bellied pavilion roof in fish-scale slate.
        rt = cy - 42
        for y in range(rt, cy - 1):
            t = (cy - 1 - y) / (cy - 1 - rt)
            a = round(9 * t ** 1.3)
            for x in range(x0 + a, x1 - a + 1):
                row = (y - rt) // 3
                col = self.roof[3]
                if (x + (row % 2) * 2) % 4 == 0 or (y - rt) % 3 == 2:
                    col = self.roof[2]
                if x - (x0 + a) < 2:
                    col = self.roof[5]
                elif (x1 - a) - x < 2:
                    col = self.roof[1]
                c.px(x, y, col)
        c.hl(x0 + 9, x1 - 9, rt, ZINC[4])
        cresting(c, x0 + 9, x1 - 9, rt - 1)
        c.vl(cx, rt - 14, rt - 2, IRON[1])
        sphere(c, cx + 0.5, rt - 15, 1.8, GOLD)
        # A lucarne in the roof.
        self.dormer(cx, cy - 6)

    # ------------------------------------------------------------ tower
    def clock_tower(self, x0, x1):
        """A campanile: the shaft in brick with stone angles, the clock
        stage, an open belfry, a lead spire and the flag."""
        c, H, st = self.c, self.H, self.st
        cx = (x0 + x1 + 1) / 2
        ix = int(cx)
        top = H - 6 - self.crown - 90
        self.fill(x0 + 2, x1 - 2, top, H - 6, dark=0)
        for y in range(top, H - 6):
            c.px(x0 + 2, y, st[5])
            c.px(x0 + 3, y, st[4])
            c.px(x1 - 2, y, st[2])
            c.px(x1 - 3, y, st[3])
        # The tower's shadow on the shed screens either side.
        for y in range(top + 40, H - 6):
            for k in range(1, 4):
                p = c.get(x1 - 1 + k, y)
                if p[3]:
                    c.px(x1 - 1 + k, y, mix(p, INK, (0.4, 0.25, 0.12)[k - 1]))
        # The entrance: a round arch big enough for the carriages' passengers.
        gy = H - 6 - self.GROUND
        arch(c, cx, gy + 4, 22, H - 6, st, self.seed + 7, door=True)
        # Slit lights up the stair and a band of blind arcading.
        # A string course, then a pair of tall round-headed lights.
        c.rect(x0 + 2, gy - 4, x1 - 2, gy - 1, st[5])
        c.hl(x0 + 2, x1 - 2, gy - 4, st[6])
        c.hl(x0 + 2, x1 - 2, gy - 1, st[2])
        for lx in (ix - 8, ix + 2):
            self.round_window(lx, gy - 50, 6, 36)
        ay = gy - 76
        c.rect(x0 + 1, ay - 3, x1 - 1, ay, st[5])
        c.hl(x0 + 1, x1 - 1, ay - 3, st[6])
        for i in range(4):
            ax = x0 + 6 + i * 8
            c.rect(ax, ay + 2, ax + 3, ay + 10, mix(st[2], INK, 0.2))
            c.hl(ax, ax + 3, ay + 1, st[5])
        # Clock stage: stone, projecting, with the dial.
        ks = top + 6
        c.rect(x0, ks, x1, ks + 34, st[4])
        c.vl(x0, ks, ks + 34, st[6])
        c.vl(x1, ks, ks + 34, st[2])
        c.hl(x0, x1, ks + 34, st[2])
        c.hl(x0 - 1, x1 + 1, ks, st[6])
        c.hl(x0 - 1, x1 + 1, ks + 1, st[3])
        clock_face(c, cx - 0.5, ks + 18, 12, st)
        self.clocks.append([cx - 0.5, ks + 18, 12])
        for s in (-1, 1):
            sphere(c, cx + s * 16, ks + 4, 2, st)
        # Belfry: paired open arches under a cornice, then the spire.
        bt = ks - 30
        c.rect(x0 + 2, bt, x1 - 2, ks - 1, st[4])
        c.vl(x0 + 2, bt, ks - 1, st[6])
        for ax in (ix - 8, ix + 2):
            for y in range(bt + 8, ks - 3):
                for x in range(ax, ax + 6):
                    dy = bt + 11 - y
                    if dy > 0 and math.hypot(x + 0.5 - (ax + 3), dy) > 3:
                        continue
                    c.px(x, y, GLOOM[0] if x > ax + 1 else GLOOM[2])
            c.hl(ax, ax + 5, ks - 6, st[5])
            for x in range(ax, ax + 6, 2):
                c.vl(x, ks - 10, ks - 6, IRON[1])
        cornice(c, x0 - 2, x1 + 2, bt - 8, st)
        for x in (x0 - 2, x1 - 2):
            sphere(c, x + 2, bt - 11, 3, st, lo=2)
        # Spire: lead, with lucarnes, to a gilt finial and the pole.
        sb = bt - 9
        sh = 64
        for y in range(sb - sh, sb):
            t = (sb - y) / sh
            half = (x1 - x0) / 2 - 4 - t * ((x1 - x0) / 2 - 5)
            for x in range(int(cx - half), int(cx + half) + 1):
                f = (x + 0.5 - (cx - half)) / (2 * half + 0.01)
                col = LEAD[4] if f < 0.2 else LEAD[3] if f < 0.5 else LEAD[2] if f < 0.85 else LEAD[1]
                if (sb - y) % 7 == 0:
                    col = LEAD[1] if f > 0.5 else LEAD[2]
                c.px(x, y, col)
        for ly, lw in ((sb - 14, 5), (sb - 36, 3)):
            c.rect(ix - lw, ly - 7, ix + lw - 1, ly, LEAD[3])
            c.rect(ix - lw + 2, ly - 5, ix + lw - 3, ly, GLOOM[1])
            for i in range(lw + 1):
                c.hl(ix - lw + i, ix + lw - 1 - i, ly - 8 - i, LEAD[4] if i % 2 else LEAD[3])
        sphere(c, cx - 0.5, sb - sh - 2, 2.6, GOLD)
        c.vl(ix, sb - sh - 22, sb - sh - 4, IRON[1])
        self.overlays.append(['pennant', ix + 1, sb - sh - 22])

    def build(self):
        im = self.render()
        self.anchor_x = self.W // 2
        return im, self.glow(im)

    def glow(self, im):
        """After dark the sheds are gas-lit and the screens glow the whole
        height; the offices light by the room as the kit's houses do."""
        em = lit_rooms(im, self.seed)
        q = em.load()
        src = im.load()
        for lamp in self.lamps:
            if lamp[0] == 'lunette':
                _, cx, cy, r = lamp
                iron = {rgba(k)[:3] for k in IRONGREEN + GOLD + DIAL + OAK}
                floor = self.H - 6 - 46
                for y in range(int(cy - r), floor):
                    for x in range(int(cx - r) + 2, int(cx + r) - 1):
                        dx, dy = x + 0.5 - cx, cy - y
                        if dy > 0 and math.hypot(dx, dy) > r - 2:
                            continue
                        p = src[x, y]
                        if not p[3] or p[:3] in iron:
                            continue
                        # Brightest round the hub, where the gas hangs.
                        d = math.hypot(dx, dy) / r
                        k = 3 if d < 0.35 else 2 if d < 0.8 or dy < 0 or (x + y) % 2 else 1
                        q[x, y] = rgba(GAS[k])
            else:
                x, y, rr = lamp
                for dy in range(-rr, rr + 1):
                    for dx in range(-rr, rr + 1):
                        if dx * dx + dy * dy <= rr * rr and 0 <= x + dx < im.width and 0 <= y + dy < im.height:
                            if src[x + dx, y + dy][3]:
                                q[x + dx, y + dy] = rgba(GAS[4] if dx * dx + dy * dy <= 1 else GAS[2])
        return em


LEAF_D = ['#0e2019', '#173a24', '#23552b', '#3a7431', '#5b943a']
MAROON = ['#240c14', '#431622', '#62202c', '#83303a', '#a4464a']
ENAMEL = [('#1d3a78', '#f2eee0'), ('#8a1f24', '#f2eee0'), ('#1f5a3a', '#f2eee0'), ('#d8a020', '#231c22')]
MILK = ['#2e3038', '#565a64', '#7e848c', '#a6acb0', '#cdd2d2']


class TownStation(Oblique):
    """A town's station, 1850 to 1950: the station master's house under a
    gable with fretted bargeboards, a single-storey booking hall and waiting
    rooms, and the canopy along the front on cast brackets with its sawtooth
    valance, sheltering a bench, the churns and a barrow of trunks."""

    def __init__(self, W=160, sd=12, seed=0, wall=BRICK, st=WARM_LIME, roof=SLATE, paint=(MAROON, PAINT)):
        self.seed, self.b, self.st, self.roof = seed, wall, st, roof
        self.trim, self.cream = paint
        self.house = 58 if W < 200 else 62
        self.wing = W >= 200
        self.HOUSE = 54 + 44
        self.HALL = 64
        super().__init__(W, self.HOUSE + 6, 40 + 30, sd)
        self.lamps, self.overlays, self.clocks, self.smoke = [], [], [], []

    def render(self):
        c, H, W, b, st = self.c, self.H, self.W, self.b, self.st
        base = H - 6
        hx1 = self.house - 1
        wx0 = W - 40 if self.wing else W
        return_(c, W, [(base - (self.HALL + 30 if self.wing else self.HALL), H - 1, mix(b[2], INK, 0.2))])
        # The hall: a hipped slate roof and its stacks, drawn first so the
        # house's gable stands in front of it.
        hall_top = base - self.HALL
        rt = hall_top - 30
        slate_roof(c, hx1 - 6, wx0 + 6, rt, hall_top, hip=14, ramp=self.roof, seed=self.seed)
        c.hl(hx1 + 8, wx0 - 8, rt, self.roof[6])
        for sx in range(hx1 + 26, wx0 - 12, 40):
            self.stack(sx, rt + 10, 3)
        brick(c, hx1 + 1, wx0 - 1, hall_top, base, b, self.seed)
        c.rect(hx1 + 1, hall_top, wx0 - 1, hall_top + 3, st[5])
        c.hl(hx1 + 1, wx0 - 1, hall_top, st[6])
        c.hl(hx1 + 1, wx0 - 1, hall_top + 3, st[2])
        for x in range(hx1 + 3, wx0 - 1, 6):
            c.rect(x, hall_top + 4, x + 1, hall_top + 5, st[4])
        # Openings along the hall: doors and tall windows in turn.
        n = max(3, (wx0 - hx1) // 22)
        w = (wx0 - hx1 - 1) / n
        doors = {n // 2}
        if n >= 5:
            doors.add(n - 1)
        for i in range(n):
            ax = int(hx1 + 1 + w * (i + 0.5))
            if i in doors:
                self.door(ax, base, i)
            else:
                self.window(ax - 5, base - 44, 10, 26)
        self.door_x = int(hx1 + 1 + w * (n // 2 + 0.5))
        if self.wing:
            self.gable(wx0, W - 1, base - self.HALL - 26, 26, small=True)
        self.gable(0, hx1, base - self.HOUSE, 36, small=False)
        self.canopy(hx1 - 2, wx0 + (4 if self.wing else 0), base - 50)
        self.furniture(hx1, wx0, base)
        c.rect(0, H - 5, W - 1, H - 1, LIME[2])
        c.hl(0, W - 1, H - 5, LIME[4])
        c.hl(0, W - 1, H - 1, LIME[1])
        return outline(c.im)

    def stack(self, x, bottom, pots):
        c, b, st = self.c, self.b, self.st
        top = bottom - 24
        c.rect(x, top, x + 9, bottom, b[4])
        c.vl(x, top, bottom, b[5])
        c.vl(x + 9, top, bottom, b[2])
        for y in range(top + 3, bottom, 4):
            c.hl(x + 1, x + 8, y, b[3])
        c.rect(x - 1, top - 3, x + 10, top, st[5])
        c.hl(x - 1, x + 10, top - 3, st[6])
        c.hl(x - 1, x + 10, top, st[2])
        for k in range(pots):
            px_ = x + 1 + k * 3
            c.rect(px_, top - 8, px_ + 1, top - 4, '#b8663c')
            c.px(px_, top - 8, '#e0955e')
            c.px(px_ + 1, top - 5, '#7a3a24')
        self.smoke.append([x + 5, top - 9, 'chimney'])

    def gable(self, x0, x1, top, rise, small):
        """A front gable: brick, stone quoins, the bargeboard cut in a
        running fret with a finial and a pendant, a window in the peak."""
        c, b, st, H = self.c, self.b, self.st, self.H
        base = H - 6
        cx = (x0 + x1 + 1) / 2
        half = (x1 - x0 + 1) / 2
        if not small:
            # The house's stack rises from the ridge behind the gable.
            self.stack(int(x1) - 20, top - rise + 14, 2)
        brick(c, x0, x1, top, base, b, self.seed + 5)
        for y in range(top - rise, top + 1):
            t = (top - y) / rise
            a = half * t
            for x in range(int(x0 + a), int(x1 - a) + 1):
                c.px(x, y, b[4] if (y % 4) != 3 else b[3])
        # The roof's edge: slates showing past the bargeboards.
        for i in range(int(half) + 5):
            t = i / (half + 4)
            y = int(top + 3 - t * (rise + 3))
            for dy in range(0, 3):
                c.px(int(x0 - 4 + i), y - dy - 1, self.roof[4] if dy == 2 else self.roof[3])
                c.px(int(x1 + 4 - i), y - dy - 1, self.roof[2] if dy == 2 else self.roof[1])
        # Bargeboards: a cream plank with a run of drops cut below.
        for i in range(int(half) + 4):
            t = i / (half + 3)
            y = int(top + 3 - t * (rise + 3))
            for side, x in ((0, int(x0 - 3 + i)), (1, int(x1 + 3 - i))):
                c.px(x, y, self.cream[4] if not side else self.cream[2])
                c.px(x, y + 1, self.cream[3] if not side else self.cream[1])
                if i % 4 == 1:
                    c.px(x, y + 2, self.cream[2])
                    c.px(x, y + 3, self.cream[1])
                elif i % 4 in (0, 2):
                    c.px(x, y + 2, self.cream[1])
        c.vl(int(cx), top - rise - 8, top - rise + 4, self.cream[3])
        c.px(int(cx), top - rise - 9, self.cream[4])
        c.rect(int(cx) - 1, top - rise + 4, int(cx), top - rise + 7, self.cream[2])
        # Quoins.
        for i, y in enumerate(range(top + 2, base - 2, 7)):
            for xa, w in ((x0, 6 if i % 2 else 3), (x1 - (6 if i % 2 else 3) + 1, 6 if i % 2 else 3)):
                c.rect(xa, y, xa + w - 1, y + 5, st[5])
                c.hl(xa, xa + w - 1, y, st[6])
                c.hl(xa, xa + w - 1, y + 5, st[2])
        if small:
            self.window(int(cx) - 6, top - rise + 12, 12, 10, round_=True)
            self.window(int(cx) - 8, base - 44, 16, 26)
            return
        # The station master's house: a peak light, a pair of sashes, a
        # canted bay below.
        self.window(int(cx) - 3, top - rise + 14, 6, 12, round_=True)
        for dx in (-13, 5):
            self.window(int(cx) + dx, top + 10, 8, 20)
        c.rect(x0 + 2, top + 38, x1 - 2, top + 41, st[5])
        c.hl(x0 + 2, x1 - 2, top + 38, st[6])
        c.hl(x0 + 2, x1 - 2, top + 41, st[2])
        self.bay(int(cx), base)

    def bay(self, cx, base):
        """A canted bay: three lights, the side ones foreshortened and in
        shade, under a little lead roof."""
        c, b, st = self.c, self.b, self.st
        y0, y1 = base - 40, base - 8
        c.rect(cx - 16, y0 - 2, cx + 15, base, st[4])
        for x0, x1, dark in ((cx - 16, cx - 11, 0), (cx - 10, cx + 9, 0), (cx + 10, cx + 15, 1)):
            glass(c, x0 + 1, y0 + 2, x1 - 1, y1 - 2, self.seed + x0)
            if dark:
                for y in range(y0 + 2, y1 - 1):
                    for x in range(x0 + 1, x1):
                        c.px(x, y, mix(c.get(x, y), INK, 0.35))
            c.vl(x0, y0, y1, '#e9e3d6')
            c.hl(x0, x1, y0 + 12, '#e9e3d6')
        c.vl(cx, y0 + 12, y1 - 2, '#e9e3d6')
        c.rect(cx - 16, y1 - 1, cx + 15, base, st[4])
        c.hl(cx - 16, cx + 15, y1 - 1, st[6])
        brick(c, cx - 15, cx + 14, y1 + 1, base - 1, b, self.seed + 9)
        for i in range(5):
            c.hl(cx - 17 + i, cx + 16 - i, y0 - 3 - i, LEAD[3] if i else LEAD[4])
        c.hl(cx - 17, cx + 16, y0 - 2, LEAD[1])

    def window(self, x, y, w, h, round_=False):
        c, st, b = self.c, self.st, self.b
        c.rect(x - 1, y - 1, x + w, y + h, '#e9e3d6')
        glass(c, x, y, x + w - 1, y + h - 1, self.seed + x)
        c.hl(x, x + w - 1, y + h // 2, '#e9e3d6')
        c.vl(x + w // 2, y + h // 2, y + h - 1, '#e9e3d6')
        c.vl(x + w, y, y + h, '#9d99a0')
        # A polychrome head: stone and brick voussoirs.
        for i in range(-2, w + 2):
            rise = round(math.sin((i + 2) / (w + 3) * math.pi) * (4 if round_ else 2))
            c.px(x + i, y - 2 - rise, st[6] if (i // 2) % 2 else '#2a1a1e')
            c.px(x + i, y - 3 - rise, st[5] if (i // 2) % 2 else b[1])
            for yy in range(y - 1 - rise, y - 1):
                c.px(x + i, yy, st[4] if 0 > i or i >= w else GLASS[1])
        c.rect(x - 2, y + h, x + w + 1, y + h + 1, st[5])
        c.hl(x - 2, x + w + 1, y + h + 2, b[1])

    def door(self, ax, base, i):
        c = self.c
        x0, x1 = ax - 8, ax + 7
        top = base - 42
        c.rect(x0 - 2, top - 8, x1 + 2, base, self.st[4])
        c.vl(x0 - 2, top - 8, base, self.st[6])
        c.rect(x0, top - 6, x1, top - 1, GLASS[1])
        for x in range(x0, x1 + 1, 3):
            c.vl(x, top - 6, top - 1, '#e9e3d6')
        c.hl(x0, x1, top, '#e9e3d6')
        c.rect(x0, top + 1, x1, base, self.trim[2])
        c.vl(ax, top + 1, base, self.trim[0])
        for xa in (x0 + 2, ax + 2):
            c.rect(xa, top + 4, xa + 3, top + 16, self.trim[3])
            c.rect(xa, top + 20, xa + 3, base - 4, self.trim[3])
            c.vl(xa + 3, top + 4, base - 4, self.trim[1])
        c.px(ax - 2, top + 20, GOLD[2])
        c.px(ax + 2, top + 20, GOLD[2])

    def canopy(self, x0, x1, eave):
        """The platform canopy: boarded, sloping out from the wall on cast
        brackets, its edge a valance of cream boards cut to points."""
        c, H = self.c, self.H
        top = eave - 17
        for y in range(top, eave):
            t = (y - top) / (eave - top)
            for x in range(x0, x1 + 1):
                col = LEAD[4] if t < 0.2 else LEAD[3] if t < 0.7 else LEAD[2]
                if (x - x0) % 5 == 0:
                    col = LEAD[2] if t < 0.5 else LEAD[1]
                # Soot from the engines darkens the front edge.
                if t > 0.6 and h2(x // 3, y, self.seed) < 0.3:
                    col = SOOT[2]
                c.px(x, y, col)
        c.hl(x0, x1, top, LEAD[4])
        # The valance: a green rail, then the boards cut to a point each.
        c.hl(x0 - 1, x1 + 1, eave, self.trim[3])
        c.hl(x0 - 1, x1 + 1, eave + 1, self.trim[1])
        for x in range(x0 - 1, x1 + 2):
            k = (x - x0 + 1) % 4
            depth = (4, 6, 6, 4)[k] if False else (3, 5, 7, 5)[k]
            for yy in range(eave + 2, eave + 2 + depth):
                if yy - (eave + 2) >= depth - (1 if k in (0, 2) else 0) - (2 if k == 0 else 0):
                    continue
                col = self.cream[4] if k in (1, 2) else self.cream[3]
                if k == 3:
                    col = self.cream[1]
                c.px(x, yy, col)
        # Shadow thrown on the wall under it.
        for yy in range(eave + 3, eave + 14):
            for x in range(x0 + 2, x1 - 1):
                if yy < eave + 9 or (x + yy) % 2 == 0:
                    p = c.get(x, yy)
                    if p[3] and p != rgba(self.cream[4]) and p != rgba(self.cream[3]) and p != rgba(self.cream[1]):
                        c.px(x, yy, mix(p, INK, 0.3))
        # Cast brackets: a spandrel of scrolls between the wall and the edge.
        for x in range(x0 + 10, x1 - 6, 26):
            for i in range(10):
                c.px(x + 1, eave + 2 + i, self.trim[3])
                c.px(x + 2, eave + 2 + i, self.trim[1])
            for i in range(7):
                c.px(x - i // 2, eave + 2 + i, self.trim[3])
            c.px(x - 3, eave + 9, self.trim[4])
            sphere(c, x + 1.5, eave + 13, 1.4, IRON)
        # A clock hung under the middle of the canopy, and gas lamps.
        cx = self.door_x
        c.vl(cx, eave + 2, eave + 5, IRON[1])
        clock_face(c, cx + 0.5, eave + 12, 5, self.st, gilt=False)
        self.clocks.append([cx + 0.5, eave + 12, 5])
        for x in (x0 + 24, x1 - 24):
            c.vl(x, eave + 2, eave + 6, IRON[1])
            c.rect(x - 2, eave + 7, x + 2, eave + 13, IRON[1])
            c.rect(x - 1, eave + 8, x + 1, eave + 12, GAS[3])
            c.px(x - 1, eave + 8, GAS[4])
            c.hl(x - 3, x + 3, eave + 6, IRON[2])
            c.px(x, eave + 5, IRON[3])
            self.lamps.append((x, eave + 10, 2))
        # Hanging baskets between the lamps, in flower.
        for x in (x0 + 40, x1 - 40):
            if abs(x - cx) < 12:
                continue
            c.vl(x, eave + 2, eave + 6, IRON[1])
            sphere(c, x + 0.5, eave + 10, 4, LEAF_D)
            for k in range(7):
                fx = x + int(h2(k, 1, self.seed) * 8) - 4
                fy = eave + 7 + int(h2(k, 2, self.seed) * 6)
                c.px(fx, fy, (RED[3], GOLD[3], '#f0e8f0', '#c05a9a')[k % 4])
            for k in range(3):
                c.vl(x - 3 + k * 3, eave + 13, eave + 14 + k % 2, LEAF_D[2])

    def furniture(self, x0, x1, base):
        """What a platform keeps against its wall: a bench, enamel signs, the
        fire buckets, churns waiting for the milk train, a barrow of trunks."""
        c = self.c
        # Enamel signs on the wall between the openings.
        n = 0
        for x in range(x0 + 14, x1 - 20, 34):
            if abs(x - self.door_x) < 14:
                continue
            ground, fg = ENAMEL[(n + self.seed) % len(ENAMEL)]
            c.rect(x, base - 30, x + 9, base - 24, ground)
            c.hl(x, x + 9, base - 30, fg)
            c.hl(x + 2, x + 7, base - 27, fg)
            c.vl(x + 9, base - 29, base - 24, mix(ground, INK, 0.4))
            n += 1
        # Fire buckets on a rack.
        bx = x1 - 20
        c.hl(bx - 1, bx + 12, base - 30, OAK[3])
        for k in range(3):
            x = bx + k * 4
            c.rect(x, base - 28, x + 2, base - 24, RED[2])
            c.px(x, base - 28, RED[3])
            c.px(x + 2, base - 25, RED[1])
            c.hl(x, x + 2, base - 29, IRON[1])
        # A bench, slatted, with iron ends.
        bx = x0 + 8
        c.rect(bx, base - 12, bx + 22, base - 11, OAK[4])
        c.rect(bx, base - 19, bx + 22, base - 18, OAK[4])
        c.hl(bx, bx + 22, base - 16, OAK[3])
        c.hl(bx, bx + 22, base - 10, OAK[1])
        for x in (bx + 1, bx + 20):
            c.vl(x, base - 20, base - 1, IRONGREEN[1])
            c.vl(x + 1, base - 12, base - 1, IRONGREEN[2])
        # Churns by the far door.
        for k, x in enumerate((x1 - 36, x1 - 29, x1 - 32)):
            y = base - (1 if k < 2 else 3)
            for yy in range(y - 12, y + 1):
                t = yy - (y - 12)
                half = 3 if t > 3 else 2
                for xx in range(x - half, x + half + 1):
                    f = (xx - (x - half)) / (2 * half)
                    c.px(xx, yy, MILK[4] if f < 0.25 else MILK[3] if f < 0.55 else MILK[2] if f < 0.85 else MILK[1])
            c.hl(x - 3, x + 3, y - 6, MILK[1])
            c.hl(x - 2, x + 2, y - 13, MILK[2])
        # A four-wheeled barrow with a trunk and a hatbox.
        tx = x0 + 44
        if tx + 26 < x1 - 40:
            c.rect(tx, base - 8, tx + 24, base - 6, OAK[3])
            c.hl(tx, tx + 24, base - 8, OAK[4])
            for wx in (tx + 3, tx + 20):
                sphere(c, wx + 0.5, base - 3, 2.6, IRON)
            c.vl(tx + 24, base - 18, base - 6, OAK[2])
            c.rect(tx + 2, base - 18, tx + 15, base - 9, '#6a3a24')
            c.hl(tx + 2, tx + 15, base - 18, '#9a5e38')
            c.vl(tx + 6, base - 18, base - 9, GOLD[1])
            c.vl(tx + 11, base - 18, base - 9, GOLD[1])
            c.rect(tx + 16, base - 15, tx + 22, base - 9, '#2a4a6a')
            c.hl(tx + 16, tx + 22, base - 15, '#4a6a8a')

    build = Terminus.build
    glow = Terminus.glow


CONCRETE = ['#2c2c34', '#4a4a52', '#6c6b6e', '#8e8c8a', '#b0aca4', '#ccc7bc', '#e4dfd2']
TRAVERTINE = ['#3e3530', '#6a5e50', '#958670', '#b7a88c', '#d2c5a6', '#e7dcc0', '#f5eed8']
ALU = ['#3a4048', '#646c76', '#98a0a8', '#c4cad0', '#eef0f0']
BOARD = ['#101014', '#1c1c22', '#e8b830', '#f8e070']


class ModernStation(Oblique):
    """A station rebuilt after the war, Roma Termini to Euston: a glass
    concourse under a cantilevered concrete roof that rises in waves over the
    doors, an office slab behind in travertine with ribbon windows, and a
    clock on a pylon. Through the glass, the departures board."""

    def __init__(self, W=224, sd=14, seed=0, clad=TRAVERTINE, storeys=4):
        self.seed, self.clad, self.storeys = seed, clad, storeys
        self.HALL = 66
        self.slab = 14 + storeys * 26
        super().__init__(W, self.HALL + 6, self.slab + 40, sd)
        self.lamps, self.overlays, self.clocks, self.smoke = [], [], [], []

    def render(self):
        c, H, W = self.c, self.H, self.W
        base = H - 6
        cl = self.clad
        pylon = 20
        body1 = W - pylon - 4
        # The office slab behind the hall.
        sx0, sx1 = 10, body1 - 10
        stop = base - self.HALL - self.slab
        return_(c, W, [(base - self.HALL - 6, H - 1, CONCRETE[2])])
        c.rect(sx0, stop, sx1, base - self.HALL, cl[4])
        for s in range(self.storeys):
            y = stop + 10 + s * 26
            # Spandrel of travertine slabs, a ribbon of glass.
            for x in range(sx0, sx1 + 1):
                for yy in range(y, y + 12):
                    col = cl[4] if (x - sx0) % 16 else cl[3]
                    if yy == y:
                        col = cl[5]
                    c.px(x, yy, col)
            glass(c, sx0 + 2, y + 12, sx1 - 2, y + 25, self.seed + s)
            for x in range(sx0 + 2, sx1 - 1, 8):
                c.vl(x, y + 12, y + 25, ALU[2])
            c.hl(sx0, sx1, y + 25, ALU[3])
            # Blinds half-drawn here and there.
            for k in range((sx1 - sx0) // 8):
                if h2(k, s, self.seed) < 0.18:
                    x = sx0 + 3 + k * 8
                    c.rect(x, y + 13, x + 6, y + 16, '#cfc6ac')
                    c.hl(x, x + 6, y + 16, '#9d9480')
        # Fins of the same stone standing proud every other bay.
        for x in range(sx0 + 15, sx1 - 4, 16):
            c.rect(x, stop, x + 2, base - self.HALL, cl[5])
            c.vl(x, stop, base - self.HALL, cl[6])
            c.vl(x + 3, stop + 2, base - self.HALL, cl[2])
        c.rect(sx0 - 1, stop - 4, sx1 + 1, stop + 1, cl[5])
        c.hl(sx0 - 1, sx1 + 1, stop - 4, cl[6])
        c.hl(sx0 - 1, sx1 + 1, stop + 1, cl[2])
        # The slab's roof: plant rooms and a mast.
        for x0, w in ((sx0 + 20, 26), (sx1 - 60, 34)):
            c.rect(x0, stop - 14, x0 + w, stop - 5, CONCRETE[4])
            c.vl(x0, stop - 14, stop - 5, CONCRETE[5])
            c.vl(x0 + w, stop - 14, stop - 5, CONCRETE[2])
            for yy in range(stop - 12, stop - 6, 2):
                c.hl(x0 + 3, x0 + w - 3, yy, CONCRETE[2])
        # Shadow of the wave roof on the slab's foot.
        # The concourse: floor-to-roof glass on slender mullions, the hall
        # visible inside.
        gt = base - self.HALL + 16
        self.concourse(4, body1 - 4, gt, base)
        self.roof(0, body1, base - self.HALL, gt)
        self.pylon(body1 + 4, body1 + 4 + pylon - 1, base)
        c.rect(0, H - 5, W - 1, H - 1, CONCRETE[3])
        c.hl(0, W - 1, H - 5, CONCRETE[5])
        c.hl(0, W - 1, H - 1, CONCRETE[1])
        for x in range(0, W, 20):
            c.vl(x, H - 4, H - 2, CONCRETE[2])
        return outline(c.im)

    def concourse(self, x0, x1, top, base):
        c = self.c
        for y in range(top, base + 1):
            t = (y - top) / (base - top)
            for x in range(x0, x1 + 1):
                col = GLOOM[3] if t < 0.25 else GLOOM[2] if t < 0.7 else '#6e6a62' if t < 0.85 else '#8a8478'
                c.px(x, y, col)
        # Inside: ceiling lights in rows, the board, and people.
        for x in range(x0 + 6, x1 - 4, 10):
            c.hl(x, x + 4, top + 3, GAS[3])
            self.lamps.append((x + 2, top + 3, 1))
        bw = min(70, (x1 - x0) // 2)
        bx = (x0 + x1) // 2 - bw // 2
        by = top + 8
        c.rect(bx - 1, by - 1, bx + bw + 1, by + 17, ALU[1])
        c.rect(bx, by, bx + bw, by + 16, BOARD[0])
        for row in range(4):
            for k in range(0, bw - 2, 3):
                if h2(k // 6, row, self.seed) < 0.8:
                    c.hl(bx + 1 + k, bx + 2 + k, by + 2 + row * 4, BOARD[2] if k % 12 else BOARD[3])
        c.vl(bx + bw // 2, top, by - 1, ALU[1])
        self.overlays.append(['flapboard', bx + 1, by + 1])
        for i in range(9):
            px_ = x0 + 8 + int(h2(i, 3, self.seed) * (x1 - x0 - 16))
            ph = 12 + int(h2(i, 4, self.seed) * 5)
            col = ('#3a3040', '#6a2a2a', '#2a3a5a', '#5a4a30')[i % 4]
            c.rect(px_, base - ph, px_ + 2, base - 1, col)
            c.rect(px_, base - ph - 3, px_ + 2, base - ph - 1, '#c8a080' if i % 3 else '#6a4630')
        # Mullions and transoms, the glass catching the sky.
        for x in range(x0, x1 + 1):
            for y in range(top, base + 1):
                k = (x - x0) % 14
                if k == 0:
                    c.px(x, y, ALU[3])
                elif k == 1:
                    c.px(x, y, ALU[1])
                elif (y - top) in (22,):
                    c.px(x, y, ALU[2])
                elif ((x + 2 * y) % 29) == 0 and y < top + 20:
                    c.px(x, y, mix(c.get(x, y), SKY_GLASS[4], 0.5))
        # Revolving doors in the middle.
        mid = (x0 + x1) // 2
        self.door_x = mid
        for dx in (-22, 0, 22):
            cx = mid + dx
            c.rect(cx - 8, base - 26, cx + 7, base, ALU[2])
            c.rect(cx - 7, base - 25, cx + 6, base, GLOOM[2])
            c.vl(cx, base - 25, base, ALU[3])
            c.hl(cx - 7, cx + 6, base - 13, ALU[1])
            c.rect(cx - 9, base - 30, cx + 8, base - 27, ALU[3])
            c.hl(cx - 9, cx + 8, base - 27, ALU[1])

    def roof(self, x0, x1, top, gt):
        """The cantilever: one thin concrete lip the length of the hall, its
        ends swept up like a gull's wing, the top running back to the slab in
        shallow ribs lit from the left, the soffit's shadow on the glass."""
        c = self.c
        L = x1 - x0 + 1
        for x in range(x0 - 6, x1 + 7):
            t = (x - (x0 - 6)) / (L + 12)
            lift = round(9 * abs(2 * t - 1) ** 3)
            edge = gt - 6 - lift
            back = top - 4 - lift // 2
            for y in range(back, edge):
                u = (y - back) / max(1, edge - back)
                col = CONCRETE[4] if u < 0.5 else CONCRETE[5]
                if (x - x0) % 12 in (0, 1):
                    col = CONCRETE[3] if (x - x0) % 12 == 0 else CONCRETE[5]
                if u > 0.88:
                    col = CONCRETE[6]
                c.px(x, y, col)
            c.px(x, edge, CONCRETE[6])
            c.px(x, edge + 1, CONCRETE[4])
            c.px(x, edge + 2, CONCRETE[2])
            for y in range(edge + 3, gt + 6):
                p = c.get(x, y)
                if p[3]:
                    c.px(x, y, mix(p, INK, 0.45 if y < edge + 6 else 0.22))
        # The lettering strip, wordless: aluminium blocks on the lip.
        for x in range(x0 + L // 4, x1 - L // 4):
            if (x // 3) % 4:
                c.px(x, gt - 5, ALU[4] if (x // 3) % 4 == 1 else ALU[3])

    def pylon(self, x0, x1, base):
        """A clock on a concrete blade, tapering as it rises; the clock a
        square box set across its head."""
        c = self.c
        top = base - self.HALL - self.slab + 10
        cx = (x0 + x1 + 1) / 2
        for y in range(top, base + 1):
            t = (y - top) / (base - top)
            half = 3 + t * 3
            for x in range(int(cx - half), int(cx + half) + 1):
                f = (x + 0.5 - (cx - half)) / (2 * half)
                col = CONCRETE[5] if f < 0.3 else CONCRETE[4] if f < 0.7 else CONCRETE[2]
                if (y - top) % 24 == 23:
                    col = CONCRETE[2] if f < 0.7 else CONCRETE[1]
                c.px(x, y, col)
        cy = top + 4
        c.rect(int(cx) - 10, cy - 10, int(cx) + 9, cy + 9, CONCRETE[1])
        c.rect(int(cx) - 9, cy - 9, int(cx) + 8, cy + 8, '#f2f0e8')
        c.hl(int(cx) - 9, int(cx) + 8, cy + 8, '#c8c4b8')
        for h in range(12):
            a = h * math.pi / 6
            k = 6.5 if h % 3 else 6
            c.px(int(cx + math.sin(a) * k), int(cy - math.cos(a) * k), BOARD[0])
            if h % 3 == 0:
                c.px(int(cx + math.sin(a) * 7.5), int(cy - math.cos(a) * 7.5), BOARD[0])
        c.rect(int(cx) - 10, cy - 12, int(cx) + 9, cy - 11, CONCRETE[5])
        self.clocks.append([cx, cy, 7])

    build = Terminus.build
    glow = Terminus.glow


def station(kind, W, sd, seed, storeys, look):
    """The kit's view: a station by kind and look at a footprint's width."""
    if kind == 'terminus':
        wall = {'stock': STOCK, 'brick': BRICK, 'ashlar': WARM_LIME}[look]
        return Terminus(W=W, sd=sd, seed=seed, wall=wall, st=WARM_LIME)
    if kind == 'townstation':
        wall, paint = {'stock': (STOCK, (IRONGREEN, PAINT)), 'brick': (BRICK, (MAROON, PAINT)),
                       'green': (BRICK, (IRONGREEN, PAINT))}[look]
        return TownStation(W=W, sd=sd, seed=seed, wall=wall, paint=paint)
    return ModernStation(W=W, sd=sd, seed=seed, storeys=storeys,
                         clad=TRAVERTINE if look == 'travertine' else CONCRETE)


PIGEON = ['#2a2a34', '#565866', '#8a8c98', '#b4b6c0', '#6a8a7a', '#c86a5a']


def build_station_animations(sprites):
    """Four frames each: a swallowtail pennant, two pigeons on a coping, and
    a departures board whose flaps turn over a row at a time."""
    for f in range(4):
        im = Image.new('RGBA', (15, 9))
        c = C(15, 9)
        c.im, c.p = im, im.load()
        for x in range(14):
            wave = round(math.sin(x / 2.6 - f * math.pi / 2) * 1.2 * x / 13)
            half = 3 - x * 1.4 / 13
            for y in range(9):
                d = y - 4 - wave
                if abs(d) > half:
                    continue
                if x > 10 and abs(d) < (x - 10) * 0.7:
                    continue
                col = RED[2] if d < 0 else RED[1]
                if abs(d) > half - 1:
                    col = GOLD[2] if d < 0 else GOLD[1]
                c.px(x, y, col)
        sprites[f'animation-pennant-{f}'] = im
    for f in range(4):
        im = Image.new('RGBA', (14, 7))
        c = C(14, 7)
        c.im, c.p = im, im.load()
        for bx, peck, turn in ((1, f == 1, False), (8, False, f == 3)):
            c.rect(bx, 3, bx + 4, 5, PIGEON[2])
            c.hl(bx, bx + 4, 3, PIGEON[3])
            c.hl(bx + 1, bx + 4, 5, PIGEON[1])
            c.px(bx + 4, 4, PIGEON[0])
            c.px(bx + 5, 4, PIGEON[1])
            hx = bx - 1 if not turn else bx + 5
            hy = 3 if peck else 1
            c.rect(hx, hy, hx + 1, hy + 1, PIGEON[2])
            c.px(hx, hy + 1, PIGEON[4])
            c.px(hx - 1 if not turn else hx + 2, hy + 1, PIGEON[0])
            c.px(bx + 1, 6, PIGEON[5])
            c.px(bx + 3, 6, PIGEON[5])
        sprites[f'animation-pigeons-{f}'] = im
    for f in range(4):
        im = Image.new('RGBA', (69, 15))
        c = C(69, 15)
        c.im, c.p = im, im.load()
        c.rect(0, 0, 68, 14, BOARD[0])
        for row in range(4):
            for k in range(0, 66, 3):
                on = h2(k // 6, row, 7) < 0.8
                turning = row == f and (k // 3) % 4 == f % 4
                if turning:
                    c.hl(1 + k, 2 + k, 1 + row * 4, BOARD[1])
                    c.px(1 + k, 2 + row * 4, BOARD[2])
                elif on:
                    c.hl(1 + k, 2 + k, 1 + row * 4, BOARD[2] if k % 12 else BOARD[3])
        sprites[f'animation-flapboard-{f}'] = im


# ---------------------------------------------------------------- sheet

def make(out, zoom=3):
    from art.reference import current_adult_d
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    which = sys.argv[2] if len(sys.argv) > 2 else 'terminus'
    night = which.endswith('-night')
    which = which.replace('-night', '')
    builds = []
    if which == 'terminus':
        builds = [Terminus(W=224, sd=14, seed=1, wall=WARM_LIME, st=WARM_LIME, roof=SLATE),
                  Terminus(W=320, sd=16, seed=2, wall=STOCK, st=WARM_LIME, roof=SLATE),
                  Terminus(W=320, sd=16, seed=3, wall=BRICK, st=WARM_LIME, roof=SLATE)]
    elif which == 'town':
        builds = [TownStation(W=160, sd=12, seed=1), TownStation(W=224, sd=12, seed=2, wall=STOCK, paint=(IRONGREEN, PAINT)),
                  TownStation(W=160, sd=12, seed=3, wall=BRICK, paint=(IRONGREEN, PAINT))]
    elif which == 'modern':
        builds = [ModernStation(W=224, sd=14, seed=1, storeys=3), ModernStation(W=320, sd=16, seed=2, storeys=5),
                  ModernStation(W=320, sd=16, seed=3, clad=CONCRETE, storeys=6)]
    ims = []
    for b in builds:
        im, em = b.build()
        for cx, cy, r in b.clocks:
            cc = C(im.width, im.height)
            cc.im = im
            cc.p = im.load()
            draw_hands(cc, cx, cy, r)
        if night:
            from art.oblique_modern import night as dusk
            im = dusk(im, em)
        ims.append(im)
    pad = 12
    W = sum(i.width + adult.width + pad * 2 for i in ims) + pad
    H = max(i.height for i in ims) + 2 * pad
    sheet = Image.new('RGBA', (W, H), '#8f8e84' if not night else '#1a1c2a')
    x = pad
    for im in ims:
        sheet.alpha_composite(im, (x, H - pad - im.height))
        sheet.alpha_composite(adult, (x + im.width + 3, H - pad - adult.height))
        x += im.width + adult.width + pad * 2
    sheet.resize((W * zoom, H * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/station/sheet.png')
