"""Trains, era by era: locomotives, coaches and wagons for the railway line.

    .venv/bin/python scripts/art/trains.py artifacts/trains/sheet.png [side|end|all]

Each vehicle is drawn two ways. Running along a row (east-west) it shows its
side, square on, with its roof leaning back as the buildings' roofs do; running
down a column (north-south) it shows its roof from above and, at the leading
end, its face. Sides are lit from above rather than from the west, so a
vehicle mirrors for the other direction without the sun changing sides.

Scale is the buildings', not the props': about 11px to the metre along the
track and 14 up, so a train of four coaches fits a town's platform. Wheels are
round at the vertical scale. Driving wheels and rods turn over four frames.
"""
from pathlib import Path
import math
import sys

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.city_kit import C, h2, mix, outline, rgba, sphere, INK  # noqa: E402

# Liveries, seven steps dark to light.
LIVERY = {
    'green': ['#0b1811', '#12291c', '#1a3d29', '#235337', '#306c47', '#468a5c', '#6aab7a'],
    'crimson': ['#1a090c', '#300f17', '#481521', '#621c2b', '#7e2735', '#9c3a42', '#bb5a58'],
    'black': ['#0a0b0e', '#121418', '#1a1d22', '#252930', '#333841', '#474e59', '#646c79'],
    'teak': ['#26120a', '#3f1d0e', '#5a2b14', '#763c1b', '#915024', '#ab6a34', '#c68a4c'],
    'chocolate': ['#1b0e0a', '#2c1710', '#3f2218', '#532e20', '#693d2a', '#835238', '#a06c4c'],
    'cream': ['#6a5e46', '#8a7d5e', '#a99c7a', '#c4b894', '#dacfac', '#ebe2c4', '#f7f0da'],
    'yellow': ['#3e2a08', '#60420c', '#855d12', '#a8781a', '#c69428', '#dcb244', '#eed070'],
    'pullman': ['#0c1510', '#142219', '#1d3124', '#27412f', '#33533c', '#48694e', '#658869'],
    'blue': ['#0b1628', '#122342', '#1a335e', '#23457a', '#315b96', '#4776b0', '#6a98ca'],
    'grey': ['#22252a', '#353a41', '#4b5159', '#636a73', '#7e858e', '#9aa1a9', '#b9bfc5'],
    'steel': ['#2a2e33', '#40464d', '#5a6168', '#777e86', '#979ea5', '#b8bec4', '#dde1e4'],
    'red': ['#2a0a0a', '#480f10', '#6a1616', '#8e1f1c', '#b02c24', '#cc4a38', '#e27458'],
    'white': ['#4a4f56', '#6c727a', '#90969e', '#b2b8bf', '#ced3d8', '#e3e7ea', '#f6f8f9'],
    'orange': ['#3a1706', '#5e250a', '#853610', '#ae4a17', '#d0632a', '#e5854a', '#f3ab78'],
    'sovietgreen': ['#0d1a14', '#152a20', '#1f3d2e', '#2a523d', '#39694f', '#528566', '#76a386'],
}
IRON = ['#0d0e11', '#17191d', '#22252b', '#30343b', '#434850', '#5d636c', '#80868f']
BRASS = ['#2a1e09', '#4b3711', '#6f541c', '#95742a', '#b4933d', '#d0b257', '#ecd88e']
COPPER = ['#2b1710', '#4a2818', '#6d3c22', '#91552c', '#b0723c', '#cb9556', '#e5bd80']
BUFFER_RED = ['#3a0c0c', '#6a1614', '#9a2420', '#c23a2c', '#dc5c44']
COAL = ['#0a0a0c', '#16161a', '#24242a', '#34343c']
GLASS = ['#0e141c', '#18222e', '#253446', '#3a5068', '#5e7a94', '#9ab4c6']
LAMP = ['#8a7a4e', '#e8d890', '#fff6d0']
SEAT = ['#5a2a2a', '#7a3a34']
FACE = ['#6a4630', '#b07a58', '#d8a882']
HATS = ['#1a1a20', '#3a2a20', '#5a4a3a', '#2a3044', '#7a6040']

TRACK_X = 11     # px per metre along the track
UP = 14          # px per metre upward
ROOF = 7         # the roof's lean back, px, for a coach seen side-on
FRAMES = 4


class Side:
    """A canvas for one vehicle seen side-on, front to the right. `base` is
    the rail's top at the near rail."""

    def __init__(self, length, height):
        self.w, self.h = length + 2, height + 2
        self.c = C(self.w, self.h)
        self.base = self.h - 2

    def px(self, x, y, col):
        self.c.px(x, y, col)

    def rect(self, x0, y0, x1, y1, col):
        self.c.rect(x0, y0, x1, y1, col)


def ramp_at(ramp, t):
    """Shade across a vertical rise: t 0 at the top (lit) to 1 underneath."""
    k = 5 if t < 0.12 else 4 if t < 0.35 else 3 if t < 0.65 else 2 if t < 0.88 else 1
    return ramp[k]


def wheel(c, cx, cy, r, frame, spokes=0, ramp=IRON, crank=None, weight=False, tyre=IRON):
    """A wheel: dark tyre, a lit rim on the upper left, spokes that turn with
    the frame, a boss; a driving wheel adds its balance weight and crank."""
    turn = frame * (math.pi * 2 / FRAMES) / max(1, spokes or 8) if spokes else 0
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            d = math.hypot(dx, dy)
            if d > r:
                continue
            if d > r - 1.3:
                col = tyre[4] if dy < -r * 0.3 else tyre[3] if dy < r * 0.4 else tyre[1]
            elif d > r - 2.3 and r > 5:
                col = ramp[2]
            elif d < max(1.2, r * 0.22):
                col = ramp[4] if dx + dy < 0 else ramp[2]
            else:
                col = ramp[0]
                if spokes:
                    a = math.atan2(dy, dx) + turn
                    step = math.pi * 2 / spokes
                    off = abs(((a % step) + step) % step - step / 2)
                    if off * d > step / 2 * d - 0.7:
                        col = ramp[3] if dy < 0 else ramp[2]
                else:
                    col = ramp[1] if d < r * 0.7 else ramp[2]
            c.px(x, y, col)
    if weight:
        a0 = frame * math.pi / 2 + math.pi
        for y in range(int(cy - r), int(cy + r) + 1):
            for x in range(int(cx - r), int(cx + r) + 1):
                dx, dy = x + 0.5 - cx, y + 0.5 - cy
                d = math.hypot(dx, dy)
                if r * 0.35 < d < r - 2.3:
                    da = abs((math.atan2(dy, dx) - a0 + math.pi) % (2 * math.pi) - math.pi)
                    if da < 0.55:
                        c.px(x, y, ramp[1] if dy > 0 else ramp[2])
    if not spokes and r <= 6:
        # A disc wheel shows it turns by one lit spot going round.
        a = frame * math.pi / 2
        c.px(int(cx + math.cos(a) * r * 0.5), int(cy + math.sin(a) * r * 0.5), ramp[4])


def crank_pin(cx, cy, r, frame, lead=0.0):
    a = frame * math.pi / 2 + lead
    return cx + math.cos(a) * r * 0.55, cy + math.sin(a) * r * 0.55


def rod(c, x0, y0, x1, y1, ramp, thick=2):
    n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for i in range(n + 1):
        t = i / max(1, n)
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        c.px(int(x), int(y), ramp[5])
        for k in range(1, thick):
            c.px(int(x), int(y) + k, ramp[3] if k < thick - 1 else ramp[1])


def lining(c, x0, x1, y, col):
    for x in range(x0, x1 + 1):
        c.px(x, y, col)


# ------------------------------------------------------------------ locomotives

def steam_loco(spec, frame):
    """A tender engine, side-on, facing right. The spec gives its proportions
    in pixels and its period furniture: chimney, dome, cab, wheels, pilot."""
    s = dict(spec)
    L = s['length']
    tall = s['height']
    v = Side(L, tall)
    c, base = v.c, v.base
    body = LIVERY[s['livery']]
    line = s.get('line', LIVERY['cream'][5])
    fp = base - s['footplate']              # footplate top
    br = s['boiler_r']
    by = fp - br - s.get('pitch', 2)        # boiler centre line
    front = L - 4
    sb = s['smokebox']                      # smokebox length
    cab0 = s['cab_at']
    cab1 = cab0 + s['cab_len']
    # Frames and the valance under the footplate.
    c.rect(4, fp, front, fp + 3, body[2])
    c.hl(4, front, fp, body[5])
    c.hl(4, front, fp + 3, body[0])
    lining(c, 5, front - 1, fp + 2, line if s.get('lined') else body[3])
    c.rect(6, fp + 4, front - 4, base - 4, IRON[1])
    # Wheels: leading, driving (coupled), trailing.
    drivers = s['drivers']
    dr = s['driver_r']
    for x, r in s.get('carrying', []):
        wheel(c, x, base - r, r, frame, spokes=8 if r > 4 else 0)
    pins = []
    for i, x in enumerate(drivers):
        wheel(c, x, base - dr, dr, frame, spokes=s.get('spokes', 14), weight=True)
        pins.append(crank_pin(x, base - dr, dr, frame))
    # Splashers over the drivers on engines with inside cylinders.
    if s.get('splashers'):
        for x in drivers:
            for xx in range(int(x - dr - 1), int(x + dr + 2)):
                dy = math.sqrt(max(0, (dr + 1.5) ** 2 - (xx + 0.5 - x) ** 2))
                top = int(base - dr - dy)
                for yy in range(top, fp):
                    col = body[4] if yy == top else body[3]
                    if yy == top + 1 and s.get('lined'):
                        col = line
                    c.px(xx, yy, col)
            c.hl(int(x - dr), int(x + dr), fp - 1, BRASS[5] if s.get('brass_splash') else body[2])
    # Outside cylinders and motion.
    cyl = s.get('cylinder')
    if cyl:
        cx0 = front - s.get('cyl_back', 22)
        cy0 = base - dr - 4
        c.rect(cx0, cy0 - 5, cx0 + 11, cy0 + 4, body[3] if s.get('cyl_paint') else IRON[3])
        c.hl(cx0, cx0 + 11, cy0 - 5, body[5] if s.get('cyl_paint') else IRON[5])
        c.hl(cx0, cx0 + 11, cy0 + 4, IRON[1])
        c.vl(cx0, cy0 - 5, cy0 + 4, IRON[4])
        # Slide bars back from the cylinder, and the crosshead on them.
        px_, py_ = pins[0]
        bar1 = cx0 - 1
        bar0 = int(drivers[0] + dr + 2)
        c.hl(bar0, bar1, cy0 - 2, IRON[5])
        c.hl(bar0, bar1, cy0 + 1, IRON[3])
        # Where the crosshead sits: follows the crank's x.
        cross = int(px_ + (bar1 - bar0) * 0.5 + (px_ - drivers[0]) * 0.8)
        cross = max(bar0 + 1, min(bar1 - 3, bar0 + (bar1 - bar0) // 2 + int(px_ - drivers[0])))
        c.rect(cross, cy0 - 2, cross + 3, cy0 + 1, IRON[4])
        rod(c, cross + 1, cy0, px_, py_, IRON, 2)
    # Coupling rod between the drivers' crank pins.
    if len(pins) > 1:
        for (x0, y0), (x1, y1) in zip(pins, pins[1:]):
            rod(c, x0, y0 - 1, x1, y1 - 1, IRON, 2)
    for x, y in pins:
        c.px(int(x), int(y) - 1, BRASS[5])
    # Boiler: a cylinder lit from above, bands of brass or lining.
    bx0, bx1 = cab1, front - sb
    for x in range(bx0, bx1 + 1):
        for y in range(int(by - br), int(by + br) + 1):
            t = (y - (by - br)) / (2 * br)
            c.px(x, y, ramp_at(body, t))
    for x in s.get('bands', range(bx0 + 10, bx1 - 3, 14)):
        for y in range(int(by - br), int(by + br) + 1):
            c.px(x, y, BRASS[4] if s.get('brass_bands') else line if s.get('lined') else body[1])
    # Smokebox, black, its door ring proud at the front.
    for x in range(bx1, front + 1):
        for y in range(int(by - br - 1), int(by + br) + 1):
            t = (y - (by - br - 1)) / (2 * br + 1)
            c.px(x, y, ramp_at(IRON, t))
    c.vl(front, int(by - br), int(by + br), IRON[5])
    c.vl(front - 1, int(by - br), int(by + br), IRON[4])
    # Chimney.
    chim = s['chimney']
    cx = bx1 + sb // 2
    ch_top = s['chimney_top']
    if chim == 'flared':
        for y in range(ch_top, int(by - br)):
            t = (y - ch_top) / max(1, by - br - ch_top)
            half = 2.4 + (1 - t) * 0.6
            if y < ch_top + 4:
                half = 4.5 - (y - ch_top) * 0.4
            for x in range(int(cx - half), int(cx + half) + 1):
                f = (x + 0.5 - (cx - half)) / (2 * half)
                c.px(x, y, IRON[5] if f < 0.3 else IRON[3] if f < 0.7 else IRON[1])
        c.hl(int(cx - 4), int(cx + 4), ch_top, IRON[5])
    elif chim == 'copper':
        for y in range(ch_top, int(by - br)):
            half = 3 if y > ch_top + 4 else 4
            ramp = COPPER if y < ch_top + 4 else IRON
            for x in range(int(cx - half), int(cx + half) + 1):
                f = (x + 0.5 - (cx - half)) / (2 * half)
                c.px(x, y, ramp[5] if f < 0.3 else ramp[3] if f < 0.7 else ramp[1])
        c.hl(int(cx - 4), int(cx + 4), ch_top, COPPER[6])
    elif chim == 'balloon':
        for y in range(ch_top, int(by - br)):
            t = (y - ch_top)
            half = 6 - t * 0.35 if t < 12 else 2.5
            for x in range(int(cx - half), int(cx + half) + 1):
                f = (x + 0.5 - (cx - half)) / (2 * half)
                c.px(x, y, IRON[5] if f < 0.3 else IRON[3] if f < 0.7 else IRON[1])
        c.hl(int(cx - 6), int(cx + 6), ch_top, IRON[6])
        for x in range(int(cx - 5), int(cx + 6), 2):
            c.px(x, ch_top + 2, IRON[1])
    else:  # a short stovepipe or a lip, for big boilers
        for y in range(ch_top, int(by - br)):
            half = 3.5 if y > ch_top + 1 else 4.5
            for x in range(int(cx - half), int(cx + half) + 1):
                f = (x + 0.5 - (cx - half)) / (2 * half)
                c.px(x, y, IRON[5] if f < 0.3 else IRON[3] if f < 0.7 else IRON[1])
    s_out = [cx, ch_top]
    # Dome and safety valves.
    if s.get('dome'):
        dx = s['dome']
        dr_ = s.get('dome_r', 4)
        ramp = BRASS if s.get('brass_dome') else body
        for y in range(int(by - br - dr_ * 1.3), int(by - br) + 1):
            for x in range(int(dx - dr_ - 1), int(dx + dr_ + 2)):
                t = (by - br - y) / (dr_ * 1.3)
                half = dr_ * math.sqrt(max(0, 1 - t * t)) + (1 if t < 0.25 else 0)
                if abs(x + 0.5 - dx) <= half:
                    f = (x + 0.5 - (dx - half)) / (2 * half + 0.01)
                    c.px(x, y, ramp[6] if f < 0.25 and t > 0.3 else ramp[5] if f < 0.45 else ramp[3] if f < 0.8 else ramp[1])
    if s.get('valves'):
        vx = s['valves']
        c.rect(vx - 2, int(by - br - 5), vx + 2, int(by - br), BRASS[4])
        c.vl(vx - 2, int(by - br - 5), int(by - br), BRASS[6])
        c.vl(vx + 2, int(by - br - 5), int(by - br), BRASS[2])
        c.hl(vx - 1, vx + 1, int(by - br - 7), BRASS[5])
        c.px(vx, int(by - br - 8), BRASS[6])
    if s.get('bell'):
        bx_ = s['bell']
        c.vl(bx_, int(by - br - 4), int(by - br), IRON[3])
        sphere(c, bx_ + 0.5, by - br - 6, 2.4, BRASS, lo=1)
    if s.get('sandbox'):
        sx = s['sandbox']
        c.rect(sx - 3, int(by - br - 4), sx + 3, int(by - br), body[4])
        c.hl(sx - 3, sx + 3, int(by - br - 4), body[6])
    # Headlamp.
    if s.get('headlamp') == 'box':
        hx = front - 6
        hy = int(by - br - 4)
        c.rect(hx - 4, hy - 7, hx + 4, hy, IRON[3])
        c.hl(hx - 4, hx + 4, hy - 7, IRON[5])
        c.rect(hx + 3, hy - 5, hx + 5, hy - 2, LAMP[2])
        c.rect(hx - 5, hy - 9, hx + 5, hy - 8, IRON[2])
        s['lamp_at'] = [hx + 5, hy - 3]
    else:
        # A white lamp on the buffer beam.
        lx = front - 2
        c.rect(lx - 2, fp - 6, lx + 1, fp - 1, '#e8e4d8')
        c.px(lx - 2, fp - 6, '#ffffff')
        c.px(lx + 1, fp - 3, LAMP[2])
        s['lamp_at'] = [lx + 1, fp - 3]
    # Buffer beam and buffers, or a pilot.
    if s.get('pilot'):
        for i in range(10):
            y = fp + 1 + i
            x0 = front - 1 + i // 1
            for x in range(front - 2, x0 + 1):
                c.px(x, y, IRON[4] if (x + i) % 3 else IRON[2])
        c.hl(front - 2, front + 9, fp + 1, body[5] if s.get('pilot_paint') else IRON[5])
    else:
        c.rect(front - 1, fp - 1, front + 1, fp + 5, BUFFER_RED[2])
        c.vl(front - 1, fp - 1, fp + 5, BUFFER_RED[4])
        c.rect(front + 1, fp + 1, front + 3, fp + 3, IRON[4])
        c.px(front + 3, fp + 1, IRON[6])
    # The cab: side sheet with a window, a roof, the fireman's side open.
    ct = s['cab_top']
    if s.get('cab') == 'weatherboard':
        c.rect(cab1 - 2, ct + 6, cab1, fp, body[3])
        c.vl(cab1 - 2, ct + 6, fp, body[5])
        c.rect(cab1 - 1, ct + 9, cab1, ct + 13, GLASS[4])
        c.hl(cab0, cab1, fp - 3, BRASS[4])
        for x in (cab0 + 2,):
            c.vl(x, fp - 12, fp - 3, BRASS[3])
    elif s.get('cab') == 'wood':
        c.rect(cab0, ct + 3, cab1, fp, LIVERY['teak'][3])
        c.rect(cab0 + 3, ct + 6, cab1 - 3, ct + 14, GLASS[2])
        c.vl(cab0 + (cab1 - cab0) // 2, ct + 6, ct + 14, LIVERY['teak'][1])
        for y in range(ct + 17, fp, 3):
            c.hl(cab0 + 1, cab1 - 1, y, LIVERY['teak'][2])
        c.rect(cab0 - 2, ct, cab1 + 2, ct + 2, LIVERY['red'][3])
        c.hl(cab0 - 2, cab1 + 2, ct, LIVERY['red'][5])
    else:
        c.rect(cab0, ct + 3, cab1, fp, body[3])
        c.vl(cab0, ct + 3, fp, body[4])
        c.vl(cab1, ct + 3, fp, body[2])
        # The cut-out: the open side of the cab, dark inside.
        c.rect(cab0 + 3, ct + 6, cab0 + 8, fp - 1, IRON[1])
        c.rect(cab0 + 11, ct + 6, cab1 - 3, ct + 12, GLASS[3])
        c.hl(cab0 + 11, cab1 - 3, ct + 6, GLASS[5])
        if s.get('lined'):
            c.rect(cab0 + 10, ct + 15, cab1 - 2, fp - 3, body[3])
            for x in (cab0 + 10, cab1 - 2):
                c.vl(x, ct + 15, fp - 3, line)
            c.hl(cab0 + 10, cab1 - 2, ct + 15, line)
            c.hl(cab0 + 10, cab1 - 2, fp - 3, line)
        # A brass number plate, wordless.
        c.rect(cab0 + 12, ct + 17, cab1 - 4, ct + 20, BRASS[4])
        c.hl(cab0 + 12, cab1 - 4, ct + 17, BRASS[6])
        c.hl(cab0 + 13, cab1 - 5, ct + 19, BRASS[2])
        # Roof, leaning back.
        c.rect(cab0 - 1, ct, cab1 + 1, ct + 2, body[2])
        c.hl(cab0 - 1, cab1 + 1, ct, body[5])
        c.rect(cab0, ct - 3, cab1, ct - 1, IRON[4])
        c.hl(cab0, cab1, ct - 3, IRON[5])
    # Whistle, on top of the cab front.
    c.vl(cab1 + 1, int(by - br - 5), int(by - br), BRASS[4])
    c.px(cab1 + 1, int(by - br - 6), BRASS[6])
    # Handrail along the boiler.
    c.hl(bx0 + 2, bx1 - 1, int(by - br * 0.35), BRASS[5] if s.get('brass_rail') else IRON[5])
    v.smoke = s_out
    v.lamp = s['lamp_at']
    return v


def tender(spec, frame):
    """The tender: a tank with its coal heaped on top, lined like the engine,
    on four or six wheels (or two bogies)."""
    L = spec['tender']
    tall = spec['tender_h']
    v = Side(L, tall + 10)
    c, base = v.c, v.base
    body = LIVERY[spec['livery']]
    line = spec.get('line', LIVERY['cream'][5])
    fp = base - spec['footplate']
    top = fp - tall
    c.rect(2, fp, L - 2, fp + 3, body[2])
    c.hl(2, L - 2, fp, body[5])
    c.rect(4, fp + 4, L - 4, base - 4, IRON[1])
    wr = spec.get('tender_r', 5)
    for x in spec['tender_wheels']:
        wheel(c, x, base - wr, wr, frame, spokes=10 if wr > 5 else 0)
    if spec.get('tender_wood'):
        # An early tender: a wooden well, the fuel stacked above its sides.
        c.rect(2, top + 6, L - 2, fp - 1, LIVERY['teak'][3])
        for y in range(top + 8, fp, 3):
            c.hl(3, L - 3, y, LIVERY['teak'][2])
        c.hl(2, L - 2, top + 6, LIVERY['teak'][5])
        for x in range(4, L - 4):
            h = 3 + int(h2(x // 3, 1, 5) * 4)
            for y in range(top + 6 - h, top + 6):
                c.px(x, y, COAL[1 + (x + y) % 3] if not spec.get('logs') else LIVERY['teak'][(x // 3 + y) % 3 + 1])
        return v
    for x in range(2, L - 1):
        for y in range(top + 3, fp):
            t = (y - top - 3) / max(1, fp - top - 3)
            c.px(x, y, body[4] if t < 0.1 else body[3] if t < 0.8 else body[2])
    c.hl(2, L - 2, top + 3, body[5])
    if spec.get('lined'):
        c.rect(5, top + 6, L - 5, fp - 3, body[3])
        for x in (5, L - 5):
            c.vl(x, top + 6, fp - 3, line)
        c.hl(5, L - 5, top + 6, line)
        c.hl(5, L - 5, fp - 3, line)
    # Coal: a heap, darker in its hollows, lit on its crests.
    for x in range(3, L - 3):
        h = 3 + math.sin(x / L * math.pi) * 4 + h2(x // 2, 3, 2) * 2
        for y in range(int(top + 3 - h), top + 3):
            k = 3 if y == int(top + 3 - h) else 2 if (x * 3 + y) % 5 else 1
            c.px(x, y, COAL[k])
    # Toolbox and the water filler.
    c.rect(L - 12, top - 1, L - 6, top + 2, body[3])
    c.hl(L - 12, L - 6, top - 1, body[5])
    return v


# ------------------------------------------------------------------ coaches

def passengers(c, x0, x1, y0, y1, seed, faces=True):
    """Heads and shoulders at the windows, seen against the dim inside: a hat
    or bare head, a face, the shoulders of a coat. Some seats are empty."""
    x = x0 + 1
    while x + 3 <= x1:
        if h2(x, 3, seed) < 0.4:
            x += 4
            continue
        coat = HATS[int(h2(x, 6, seed) * 5)]
        skin = FACE[1 + int(h2(x, 4, seed) * 2)]
        top = y1 - 9 + int(h2(x, 2, seed) * 2)
        c.rect(x - 1, top + 6, x + 3, y1, coat)
        c.rect(x, top + 2, x + 2, top + 5, skin)
        c.px(x + 2, top + 4, FACE[0])
        hat = h2(x, 7, seed)
        if hat < 0.55:
            c.hl(x - 1, x + 3, top + 1, HATS[int(hat * 9) % 5])
            c.hl(x, x + 2, top, HATS[int(hat * 9) % 5])
        else:
            c.hl(x, x + 2, top + 1, ('#2a1a12', '#5a3a1a', '#8a6a3a')[int(hat * 7) % 3])
        x += 6
    return


def coach(spec, frame):
    """A coach side-on: underframe and wheels, a body of panels, doors and
    windows in the pattern of its period, a roof leaning back over it."""
    L = spec['length']
    bh = spec['body_h']
    v = Side(L, bh + ROOF + 18)
    c, base = v.c, v.base
    body = LIVERY[spec['livery']]
    upper = LIVERY[spec['upper']] if spec.get('upper') else body
    seed = spec.get('seed', 1)
    floor = base - spec.get('floor', 12)
    top = floor - bh
    # Underframe.
    c.rect(3, floor + 1, L - 3, floor + 4, IRON[2])
    c.hl(3, L - 3, floor + 1, IRON[4])
    wr = spec.get('wheel_r', 5)
    if spec.get('bogies'):
        for bx in (14, L - 15):
            c.rect(bx - 10, base - wr - 3, bx + 10, base - wr + 1, IRON[3])
            c.hl(bx - 10, bx + 10, base - wr - 3, IRON[5])
            for dx in (-6, 6):
                wheel(c, bx + dx, base - wr, wr, frame)
            if spec.get('bogies') == 3:
                wheel(c, bx, base - wr, wr, frame)
    else:
        n = spec.get('axles', 2)
        xs = [8 + i * (L - 16) / (n - 1) for i in range(n)]
        for x in xs:
            wheel(c, x, base - wr, wr, frame, spokes=8 if spec.get('spoked') else 0)
            # Axleguard and spring.
            c.rect(int(x) - 5, floor + 4, int(x) + 5, floor + 5, IRON[4])
            c.hl(int(x) - 4, int(x) + 4, floor + 6, IRON[3])
    # Buffers at both ends, or gangways.
    for x in (0, L - 1):
        c.rect(x, floor - 1, x + 1, floor + 2, IRON[4])
    if spec.get('open'):
        # An open third: a low wooden tub, passengers standing in it.
        wall = top + bh // 2
        c.rect(2, wall, L - 3, floor, LIVERY['teak'][3])
        for y in range(wall + 2, floor, 3):
            c.hl(3, L - 4, y, LIVERY['teak'][2])
        c.hl(2, L - 3, wall, LIVERY['teak'][5])
        for x in range(2, L - 3, 12):
            c.vl(x, wall, floor, LIVERY['teak'][1])
        for x in range(5, L - 7, 4):
            if h2(x, 9, seed) < 0.25:
                continue
            h = 11 + int(h2(x, 8, seed) * 4)
            coat = HATS[int(h2(x, 10, seed) * 5)]
            c.rect(x, wall - h + 4, x + 2, wall, coat)
            c.rect(x, wall - h + 1, x + 2, wall - h + 3, FACE[1 + int(h2(x, 4, seed) * 2)])
            c.hl(x - 1, x + 3, wall - h, HATS[int(h2(x, 7, seed) * 5)])
            if h2(x, 11, seed) < 0.3:
                c.rect(x, wall - h - 3, x + 2, wall - h - 1, HATS[0])
        return v
    # Body: lower panels in the main colour, the upper in its own.
    waist = top + int(bh * spec.get('waist', 0.45))
    for x in range(2, L - 2):
        for y in range(top, floor + 1):
            ramp = upper if y < waist else body
            t = (y - top) / max(1, floor - top)
            k = 4 if t < 0.08 else 3 if t < 0.9 else 2
            c.px(x, y, ramp[k])
    c.hl(2, L - 3, waist, mix(upper[3], body[3], 0.5))
    if spec.get('tumblehome'):
        for y in range(floor - 6, floor + 1):
            c.px(2 + (y - floor + 6) // 3, y, (0, 0, 0, 0))
            c.px(L - 3 - (y - floor + 6) // 3, y, (0, 0, 0, 0))
    pattern = spec['pattern']
    wy0 = top + spec.get('win_top', 5)
    wy1 = wy0 + spec.get('win_h', 12)
    if pattern == 'stage':
        # Three stagecoach bodies in a row, curved at the waist.
        n = 3
        w = (L - 6) / n
        for i in range(n):
            x0 = int(3 + i * w)
            x1 = int(3 + (i + 1) * w) - 1
            for x in range(x0, x1 + 1):
                f = (x - x0) / (x1 - x0)
                bulge = int(3 * math.sin(f * math.pi))
                for y in range(floor - 4 - bulge, floor + 1):
                    c.px(x, y, body[2])
                c.px(x, waist + 1, upper[5])
            c.vl(x0, top + 2, floor, upper[1])
            c.rect(x0 + 3, wy0, x0 + 8, wy1, GLASS[2])
            c.rect(x1 - 8, wy0, x1 - 3, wy1, GLASS[2])
            passengers(c, x0 + 3, x0 + 9, wy0, wy1, seed + i)
            dx0 = (x0 + x1) // 2 - 3
            c.rect(dx0, wy0 - 1, dx0 + 6, floor - 2, upper[2])
            c.rect(dx0 + 1, wy0, dx0 + 5, wy0 + 7, GLASS[3])
            c.px(dx0 + 5, waist + 4, BRASS[5])
        # Luggage on the roof, under a rail.
        for x in range(8, L - 8, 9):
            if h2(x, 12, seed) < 0.3:
                continue
            hh = 4 + int(h2(x, 13, seed) * 3)
            c.rect(x, top - ROOF + 2 - hh, x + 6, top - ROOF + 2, ('#6a3a24', '#3a4a2a', '#5a4a3a')[x % 3])
            c.hl(x, x + 6, top - ROOF + 2 - hh, '#8a6a4a')
    elif pattern == 'compartment':
        # Doors with droplights, a quarter-light either side.
        cw = spec.get('compartment', 18)
        n = max(2, (L - 8) // cw)
        w = (L - 8) / n
        for i in range(n):
            x0 = int(4 + i * w)
            dx = x0 + int(w) // 2 - 3
            c.rect(dx, top + 2, dx + 6, floor - 1, body[2])
            c.vl(dx, top + 2, floor - 1, body[1])
            c.vl(dx + 6, top + 2, floor - 1, body[4])
            c.rect(dx + 1, wy0, dx + 5, wy1 - 3, GLASS[2])
            c.hl(dx + 1, dx + 5, wy0, GLASS[4])
            c.px(dx + 5, waist + 4, BRASS[5])
            c.hl(dx + 2, dx + 4, waist + 2, BRASS[3])
            for qx in (x0 + 2, dx + 9):
                c.rect(qx, wy0, qx + 3, wy1, GLASS[2])
                c.hl(qx, qx + 3, wy0, GLASS[4])
                passengers(c, qx, qx + 4, wy0, wy1, seed + i * 7 + qx)
        # Panel beading.
        for x in range(4, L - 4, 3):
            c.px(x, floor - 4, body[5])
    else:
        # A corridor or saloon side: a row of wide windows, doors at the ends.
        ww = spec.get('win_w', 12)
        gap = spec.get('win_gap', 4)
        x = 12
        while x + ww < L - 12:
            c.rect(x, wy0, x + ww - 1, wy1, GLASS[2])
            for y in range(wy0, wy1 + 1):
                for xx in range(x, x + ww):
                    if (xx - x + y) % 13 in (1, 2) and y < wy0 + 6:
                        c.px(xx, y, GLASS[4])
            c.hl(x, x + ww - 1, wy0, GLASS[1])
            if spec.get('frames'):
                c.rect(x - 1, wy0 - 1, x + ww, wy0 - 1, upper[5])
                c.hl(x - 1, x + ww, wy1 + 1, upper[1])
            passengers(c, x, x + ww, wy0, wy1, seed + x)
            x += ww + gap
        for dx in (4, L - 11):
            c.rect(dx, top + 2, dx + 6, floor - 1, body[2] if not spec.get('steel') else body[3])
            c.vl(dx, top + 2, floor - 1, body[1])
            c.rect(dx + 1, wy0, dx + 5, wy0 + 7, GLASS[3])
            c.px(dx + 5, (top + floor) // 2 + 4, IRON[5] if spec.get('steel') else BRASS[5])
        if spec.get('stripe'):
            sr = LIVERY[spec['stripe']]
            c.hl(2, L - 3, wy1 + 3, sr[4])
            c.hl(2, L - 3, wy1 + 4, sr[3])
        if spec.get('fluted'):
            for y in range(wy1 + 3, floor, 2):
                c.hl(2, L - 3, y, body[5])
    # Lining along the waist and the cant rail.
    if spec.get('lined'):
        c.hl(2, L - 3, waist - 1, LIVERY['cream'][5] if spec['livery'] != 'cream' else BRASS[4])
    # The roof: a curve seen from the side, then its top leaning back.
    roof = LIVERY['grey'] if not spec.get('roof') else LIVERY[spec['roof']]
    kind = spec.get('roof_kind', 'arc')
    for x in range(1, L - 1):
        edge = x in (1, L - 2)
        for j in range(ROOF + 2):
            y = top - j
            if kind == 'arc':
                k = 5 if j == ROOF + 1 else 4 if j > ROOF - 2 else 3 if j > 2 else 2
            else:
                k = 4 if j > ROOF - 1 else 3
            if edge:
                k = max(1, k - 2)
            c.px(x, y, roof[k] if not (spec.get('steel') and kind == 'arc') else roof[k])
        if kind == 'clerestory' and 10 < x < L - 11:
            for j in range(ROOF + 2, ROOF + 6):
                c.px(x, top - j, roof[4] if j == ROOF + 5 else roof[3])
            if x % 6 in (0, 1, 2):
                c.px(x, top - ROOF - 3, GLASS[3])
                c.px(x, top - ROOF - 4, GLASS[4])
    c.hl(1, L - 2, top, roof[1])
    # Roof lamps (pot lamps) or ventilators along the top.
    for x in range(10, L - 10, spec.get('vent_every', 16)):
        y = top - ROOF - (5 if kind == 'clerestory' else 1)
        c.rect(x, y - 2, x + 2, y, roof[2])
        c.hl(x, x + 2, y - 2, roof[5])
    v.doors = [x for x in range(8, L - 8, max(12, L // 5))]
    return v


# ------------------------------------------------------------------ diesels

def bogie(c, cx, base, axles, frame, r=5, spring=IRON):
    """A bogie side-on: the sideframe cast in one piece, axleboxes over each
    wheel, coil springs between, a brake cylinder hung under."""
    span = (axles - 1) * 11
    x0, x1 = cx - span // 2 - 7, cx + span // 2 + 7
    for k in range(axles):
        wheel(c, cx - span // 2 + k * 11, base - r, r, frame)
    y = base - r - 4
    c.rect(x0, y, x1, y + 4, IRON[2])
    c.hl(x0, x1, y, IRON[4])
    c.hl(x0 + 1, x1 - 1, y + 4, IRON[1])
    for k in range(axles):
        ax = cx - span // 2 + k * 11
        c.rect(ax - 2, y + 1, ax + 2, y + 5, IRON[3])
        c.hl(ax - 2, ax + 2, y + 1, spring[5] if spring is not IRON else IRON[5])
    for k in range(axles - 1):
        sx = cx - span // 2 + k * 11 + 5
        for j in range(4):
            c.px(sx, y - 1 - j, IRON[5] if j % 2 else IRON[3])
            c.px(sx + 1, y - 1 - j, IRON[3] if j % 2 else IRON[5])


def diesel(spec, frame):
    """A diesel or electric engine side-on, front to the right: a body on two
    bogies, its end a flat cab, a rounded American nose or a modern wedge;
    louvres, panel seams, handrails, a roof that follows the body's line."""
    L = spec['length']
    bh = spec['body_h']
    v = Side(L, bh + ROOF + 22)
    c, base = v.c, v.base
    body = LIVERY[spec['livery']]
    second = LIVERY[spec['second']] if spec.get('second') else body
    roof = LIVERY[spec.get('roof', 'grey')]
    floor = base - 14
    top = floor - bh
    shape = spec.get('cab_shape', 'box')
    nose = spec.get('nose', 0) or (8 if shape == 'box' else 0)
    double = spec.get('double', shape == 'box')

    def cut(x):
        """Rows lost off the top of the body at column x, by the end's shape."""
        out = 0
        for d, n in ((L - 3 - x, nose), (x - 2, nose if double else 3)):
            if d >= n or n <= 0:
                continue
            f = 1 - d / n
            if shape == 'nose':
                out = max(out, int(bh * 0.55 * (1 - math.sqrt(max(0, 1 - f * f)))))
            elif shape == 'wedge':
                out = max(out, int(bh * 0.62 * f ** 1.4))
            else:
                out = max(out, int(3 * f))
        return out
    # Underframe, fuel tank, bogies.
    c.rect(6, floor + 1, L - 7, floor + 4, IRON[1])
    c.hl(6, L - 7, floor + 1, IRON[3])
    if spec.get('exhaust'):
        c.rect(L // 2 - 16, floor + 4, L // 2 + 16, floor + 9, IRON[2])
        c.hl(L // 2 - 16, L // 2 + 16, floor + 4, IRON[4])
        c.hl(L // 2 - 14, L // 2 + 14, floor + 7, IRON[1])
    axles = 3 if spec.get('coco') else 2
    for bx in (22, L - 23):
        bogie(c, bx, base, axles, frame)
    # The body, lit along its upper curve, livery bands laid on.
    band = spec.get('band', 0)
    for x in range(2, L - 2):
        t0 = top + cut(x)
        for y in range(t0, floor + 1):
            ramp = second if band and y > floor - band else body
            t = (y - top) / max(1, floor - top)
            k = 5 if y == t0 else 4 if t < 0.22 else 3 if t < 0.9 else 2
            c.px(x, y, ramp[k])
        c.px(x, floor, body[1])
        # Roof following the body's line, leaning back.
        for j in range(1, ROOF + 1):
            c.px(x + (1 if j > ROOF // 2 else 0), t0 - j, roof[5] if j == ROOF else roof[4] if j > ROOF - 3 else roof[3])
        c.px(x, t0 - 1, roof[1])
    if spec.get('stripe'):
        sr = LIVERY[spec['stripe']]
        yy = top + int(bh * 0.52)
        for x in range(2, L - 2):
            if yy > top + cut(x):
                c.px(x, yy, sr[5])
                c.px(x, yy + 1, sr[3])
    if spec.get('fluted'):
        for y in range(floor - band + 2, floor - 1, 2):
            c.hl(4, L - 5, y, second[5])
    # Panel seams and a handrail along the solebar.
    for x in range(30, L - 30, 26):
        for y in range(top + cut(x) + 3, floor - 1):
            c.px(x, y, mix(c.get(x, y), INK, 0.25))
    c.hl(10, L - 11, floor - 3, mix(body[5], '#ffffff', 0.2))
    # Louvre banks: a frame, slats catching the light.
    engine = spec.get('louvres', 3)
    x = 34
    w = (L - 76) // max(1, engine) - 6
    for i in range(engine):
        lx = x + i * (w + 6)
        c.rect(lx - 1, top + 6, lx + w, top + 20, body[1])
        for yy in range(top + 7, top + 20):
            c.hl(lx, lx + w - 1, yy, body[4] if (yy - top) % 3 == 0 else body[1] if (yy - top) % 3 == 1 else body[2])
    if spec.get('portholes'):
        for px_ in range(40, L - 40, 22):
            c.ellipse(px_, top + 13, 3.2, 3.2, second[1])
            c.ellipse(px_, top + 13, 2.2, 2.2, GLASS[3])
            c.px(px_ - 1, top + 12, GLASS[5])
    # Cabs: windscreen, side window, door and its handrail, lights.
    ends = [('front', L - 3)] + ([('back', 2)] if double else [])
    for end, ex in ends:
        s_ = -1 if end == 'front' else 1
        ln = nose if end == 'front' or double else 3
        # Side window and door just behind the cab end.
        dx = ex + s_ * (ln + 4)
        wx0, wx1 = sorted((dx, dx + s_ * 9))
        c.rect(wx0, top + 6, wx1, top + 14, IRON[1])
        c.rect(wx0 + 1, top + 7, wx1 - 1, top + 13, GLASS[2])
        c.hl(wx0 + 1, wx1 - 1, top + 7, GLASS[4])
        ddx = dx + s_ * 12
        d0, d1 = sorted((ddx, ddx + s_ * 7))
        for yy in range(top + 5, floor - 2):
            c.px(d0, yy, mix(c.get(d0, yy), INK, 0.35))
            c.px(d1, yy, mix(c.get(d1, yy), INK, 0.35))
        c.rect(d0 + 2, top + 8, d1 - 2, top + 13, GLASS[2])
        c.vl(d1 + (1 if s_ > 0 else -2), top + 10, floor - 4, mix(body[5], '#ffffff', 0.4))
        # Windscreen: on the slope of a nose or wedge, flat on a box.
        for x2 in range(min(ex, ex + s_ * ln), max(ex, ex + s_ * ln) + 1):
            t0 = top + cut(x2)
            d = abs(ex - x2)
            if shape == 'box':
                if d < ln - 1:
                    for yy in range(t0 + 3, t0 + 11):
                        c.px(x2, yy, GLASS[3] if yy > t0 + 4 else GLASS[5])
            else:
                if 0.35 * ln < d < 0.95 * ln:
                    for yy in range(t0 + 1, t0 + 7):
                        c.px(x2, yy, GLASS[2] if yy > t0 + 2 else GLASS[4])
        # Warning panel on the end below the screen, then the lamps.
        if spec.get('warning'):
            for x2 in range(min(ex, ex + s_ * (ln - 1)), max(ex, ex + s_ * (ln - 1)) + 1):
                for yy in range(top + cut(x2) + (12 if shape == 'box' else 8), floor - 1):
                    c.px(x2, yy, LIVERY['yellow'][4] if (x2 + yy) % 11 else LIVERY['yellow'][3])
        c.px(ex, floor - 6, LAMP[2] if end == 'front' else LIVERY['red'][5])
        c.px(ex - s_, floor - 6, LAMP[1] if end == 'front' else LIVERY['red'][4])
        c.rect(ex - 1 if s_ < 0 else ex, floor - 1, ex + 1 if s_ < 0 else ex + 2, floor + 2, IRON[4])
    if shape == 'nose' and spec.get('headlamp', True):
        hx = L - 3 - nose // 2
        c.ellipse(hx, top + cut(hx) + 2, 2.5, 2.5, IRON[3])
        c.px(hx, top + cut(hx) + 2, LAMP[2])
    # The emblem of the railway: wordless, as the signs are.
    emblem = spec.get('emblem')
    ex_ = L // 2 + 18
    ey = top + 27
    if emblem == 'arrow':
        for i in range(9):
            c.px(ex_ - 4 + i, ey, '#f4f4f0')
            c.px(ex_ - 4 + i, ey + 4, '#f4f4f0')
        for i in range(3):
            c.px(ex_ + 3 - i, ey - 1 - i, '#f4f4f0')
            c.px(ex_ - 3 + i, ey + 5 + i, '#f4f4f0')
        for i in range(5):
            c.px(ex_ - 2 + i, ey + 1 + i // 2, '#f4f4f0')
    elif emblem == 'star':
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                a = math.atan2(dy, dx)
                r = math.hypot(dx, dy)
                if r <= 1.2 + 2.2 * (0.5 + 0.5 * math.cos(5 * (a + math.pi / 2))):
                    c.px(ex_ + dx, ey + 2 + dy, LIVERY['red'][5] if dy < 0 else LIVERY['red'][4])
    elif emblem == 'warbonnet':
        for x2 in range(L - 3 - nose - 30, L - 2):
            d = (L - 3) - x2
            for yy in range(top + cut(x2), floor - band):
                edge = top + bh * 0.35 + (d - nose) * 0.25 if d > nose else top + cut(x2) + 6
                if yy > edge + 1:
                    c.px(x2, yy, LIVERY['red'][5] if yy < edge + 4 else LIVERY['red'][4])
                elif yy > edge:
                    c.px(x2, yy, LIVERY['yellow'][5])
    # Roof fittings: fans and the exhaust for a diesel, a pantograph for an
    # electric.
    if spec.get('pantograph'):
        px_ = L // 2 - 16
        c.rect(px_ - 7, top - ROOF - 2, px_ + 7, top - ROOF, IRON[3])
        for i in range(11):
            c.px(px_ - 6 + i, top - ROOF - 3 - i, IRON[5])
            c.px(px_ + 6 - i, top - ROOF - 3 - i, IRON[4])
        c.hl(px_ - 9, px_ + 9, top - ROOF - 14, IRON[5])
        c.hl(px_ - 9, px_ + 9, top - ROOF - 13, IRON[3])
    elif spec.get('exhaust'):
        for fx in range(40, L - 40, 28):
            c.rect(fx - 6, top - ROOF - 1, fx + 6, top - ROOF + 1, roof[1])
            c.hl(fx - 5, fx + 5, top - ROOF - 1, roof[4])
    v.smoke = [L // 2 + 8, top - ROOF - 1] if spec.get('exhaust') else None
    v.lamp = [L - 3, floor - 6]
    return v


# ------------------------------------------------------------------ wagons

def wagon(spec, frame):
    L = spec['length']
    v = Side(L, 44)
    c, base = v.c, v.base
    kind = spec['kind']
    body = LIVERY[spec['livery']]
    floor = base - 11
    c.rect(3, floor + 1, L - 3, floor + 3, IRON[2])
    wr = 5
    xs = (9, L - 10) if not spec.get('bogies') else (8, 18, L - 19, L - 9)
    for x in xs:
        wheel(c, x, base - wr, wr, frame, spokes=6 if spec.get('spoked') else 0)
    for x in (0, L - 1):
        c.rect(x, floor - 1, x + 1, floor + 2, IRON[4])
    if kind == 'coal':
        top = floor - 16
        for x in range(2, L - 2):
            for y in range(top, floor + 1):
                c.px(x, y, body[3] if (x - 2) % 7 else body[2])
        c.hl(2, L - 3, top, body[5])
        for y in range(top + 5, floor, 5):
            c.hl(2, L - 3, y, body[2])
        for x in range(3, L - 3):
            h = 2 + int(h2(x // 2, 1, spec.get('seed', 1)) * 3)
            for y in range(top - h, top):
                c.px(x, y, COAL[(x + y) % 3 + 1])
    elif kind == 'van':
        top = floor - 26
        for x in range(2, L - 2):
            for y in range(top, floor + 1):
                c.px(x, y, body[3] if (x - 2) % 4 else body[2])
        c.hl(2, L - 3, top, body[5])
        # Diagonal bracing and a sliding door.
        for i in range(0, floor - top):
            c.px(4 + i // 2, top + i, IRON[3])
            c.px(L - 5 - i // 2, top + i, IRON[3])
        c.rect(L // 2 - 6, top + 2, L // 2 + 6, floor - 1, body[2])
        c.hl(L // 2 - 8, L // 2 + 8, top + 2, IRON[4])
        roof = LIVERY['grey']
        for x in range(2, L - 2):
            for j in range(1, 5):
                c.px(x, top - j, roof[4] if j > 2 else roof[3])
    elif kind == 'tank':
        cy = floor - 10
        r = 9
        for x in range(4, L - 4):
            for y in range(cy - r, cy + r + 1):
                t = (y - (cy - r)) / (2 * r)
                c.px(x, y, ramp_at(body, t))
        for x in (4, L - 5):
            c.vl(x, cy - r + 2, cy + r - 2, body[1])
        c.rect(L // 2 - 3, cy - r - 4, L // 2 + 2, cy - r, body[3])
        c.hl(L // 2 - 3, L // 2 + 2, cy - r - 4, body[5])
        for x in (12, L - 13):
            c.vl(x, cy - r, cy + r, IRON[3])
    elif kind == 'brake':
        top = floor - 26
        c.rect(8, top, L - 3, floor, body[3])
        c.hl(8, L - 3, top, body[5])
        c.rect(2, floor - 4, 8, floor, body[3])
        c.rect(12, top + 5, 16, top + 11, GLASS[3])
        c.rect(L - 10, top + 5, L - 6, top + 11, GLASS[3])
        for x in range(8, L - 3):
            for j in range(1, 5):
                c.px(x, top - j, LIVERY['grey'][4] if j > 2 else LIVERY['grey'][3])
        # The stove's chimney.
        c.vl(L // 2, top - 9, top - 4, IRON[3])
        v.smoke = [L // 2, top - 10]
        c.px(L - 4, floor - 6, LIVERY['red'][5])
    elif kind == 'container':
        top = floor - 26
        for x0, x1, col in ((3, L // 2 - 1, spec.get('c1', 'blue')), (L // 2 + 1, L - 4, spec.get('c2', 'red'))):
            ramp = LIVERY[col]
            for x in range(x0, x1 + 1):
                for y in range(top, floor):
                    c.px(x, y, ramp[3] if (x - x0) % 3 else ramp[2])
            c.hl(x0, x1, top, ramp[5])
            c.vl(x0, top, floor - 1, ramp[1])
    return v


# ------------------------------------------------------------------ from above
#
# A train running down a column shows its roofs from above and, at its south
# end, a face. The vehicle's ground length runs the height of the roof strip;
# its face is as tall as its side view, so the two views stand the same height.

TW = 30


def profile(side):
    """Rows of a side view that hold anything: its height above the rail."""
    im = side.c.im
    box = im.getbbox()
    return side.base - box[1] + 1 if box else 40


def roof_strip(c, L, x0, x1, ramp, seed, vents=True, sliver=None, windows=None):
    """A roof from above: lit on its west edge, dark to the east, gutters
    along both, ventilators down the ridge, and the east side as a sliver."""
    for y in range(L):
        for x in range(x0, x1 + 1):
            f = (x - x0) / max(1, x1 - x0)
            k = 5 if f < 0.15 else 4 if f < 0.45 else 3 if f < 0.8 else 2
            c.px(x, y, ramp[k])
        c.px(x0, y, ramp[1])
        c.px(x1, y, ramp[0])
    for y in (0, L - 1):
        c.hl(x0, x1, y, ramp[1])
    if vents:
        cx = (x0 + x1) // 2
        for y in range(5, L - 5, 12):
            c.rect(cx - 1, y, cx + 1, y + 2, ramp[2])
            c.hl(cx - 1, cx + 1, y, ramp[6] if len(ramp) > 6 else ramp[5])
    if sliver:
        for y in range(L):
            for i in range(DRIFT_T):
                col = sliver[2 - (i > 0)]
                if windows and windows(y) and i == 0:
                    col = GLASS[1]
                c.px(x1 + 1 + i, y, col)


DRIFT_T = 2


def face_coach(c, top, H, spec, lamp=True):
    """A coach's end: the body in its livery, the gangway or end windows,
    buffers and coupling, the bogie or wheels under, a tail lamp."""
    body = LIVERY[spec['livery']]
    upper = LIVERY[spec['upper']] if spec.get('upper') else body
    roof = LIVERY[spec.get('roof', 'grey')]
    floor = top + H - spec.get('floor', 12)
    btop = floor - spec['body_h']
    waist = btop + int(spec['body_h'] * spec.get('waist', 0.45))
    x0, x1 = 1, TW - 2
    if spec.get('open'):
        btop = floor - spec['body_h'] // 2
    for y in range(btop, floor + 1):
        for x in range(x0, x1 + 1):
            ramp = upper if y < waist else body
            f = (x - x0) / (x1 - x0)
            c.px(x, y, ramp[4] if f < 0.2 else ramp[3] if f < 0.85 else ramp[2])
    if not spec.get('open'):
        # The roof's curve over the end.
        for j in range(ROOF + 1):
            inset = max(0, j - ROOF + 3)
            for x in range(x0 + inset, x1 - inset + 1):
                c.px(x, btop - j, roof[4] if j > ROOF - 2 else roof[3])
        if spec.get('bogies'):
            c.rect(TW // 2 - 4, btop + 3, TW // 2 + 3, floor - 1, IRON[1])
            for y in range(btop + 4, floor - 1, 3):
                c.hl(TW // 2 - 4, TW // 2 + 3, y, IRON[3])
        for wx in ((5, 9), (TW - 10, TW - 6)):
            c.rect(wx[0], btop + 6, wx[1], btop + 13, GLASS[2])
            c.hl(wx[0], wx[1], btop + 6, GLASS[4])
    else:
        for x in range(4, TW - 4, 5):
            c.rect(x, btop - 9, x + 2, btop - 1, HATS[x % 5])
            c.rect(x, btop - 12, x + 2, btop - 10, FACE[1])
    # Underframe, buffers, wheels seen end on.
    c.rect(x0, floor + 1, x1, floor + 3, IRON[2])
    for bx in (2, TW - 5):
        c.rect(bx, floor - 1, bx + 2, floor + 1, IRON[5])
    c.rect(TW // 2 - 1, floor + 1, TW // 2, floor + 4, IRON[4])
    for wx in (4, TW - 7):
        c.rect(wx, floor + 4, wx + 2, top + H - 1, IRON[1])
        c.vl(wx, floor + 4, top + H - 1, IRON[3])
    if lamp:
        c.rect(TW - 7, floor - 5, TW - 5, floor - 3, LIVERY['red'][4])
        c.px(TW - 7, floor - 5, LIVERY['red'][6])


def top_coach(spec, side):
    L = side.w - 2
    H = profile(side)
    im = Image.new('RGBA', (TW + DRIFT_T + 2, L + H))
    c = C(im.width, im.height)
    body = LIVERY[spec['livery']]
    roof = LIVERY[spec.get('roof', 'grey')]
    if spec.get('open'):
        # Open to the sky: a floor of boards, and the hats of those standing.
        for y in range(L):
            for x in range(1, TW - 1):
                c.px(x, y, LIVERY['teak'][3] if (x % 4) else LIVERY['teak'][2])
            c.px(1, y, LIVERY['teak'][5])
            c.px(TW - 2, y, LIVERY['teak'][1])
        seed = spec.get('seed', 1)
        for y in range(3, L - 3, 5):
            for x in range(4, TW - 5, 6):
                if h2(x, y, seed) < 0.35:
                    continue
                sphere(c, x + 1.5, y + 1.5, 2.2, ['#1a1a20', '#2a2a30', '#4a4a50', '#6a6a70'])
    else:
        vents = spec.get('roof_kind') != 'flat'
        roof_strip(c, L, 1, TW - 2, roof, spec.get('seed', 1), vents=vents, sliver=body,
                   windows=lambda y: (y % 9) in (2, 3, 4, 5))
        if spec.get('roof_kind') == 'clerestory':
            cx = TW // 2
            for y in range(10, L - 10):
                c.rect(cx - 4, y, cx + 3, y, roof[4])
                c.px(cx - 5, y, GLASS[3] if y % 6 < 3 else roof[2])
                c.px(cx + 4, y, roof[1])
        if spec.get('pattern') == 'stage':
            for x in range(4, TW - 4, 7):
                for y in range(6, L - 6, 9):
                    if h2(x, y, 3) < 0.4:
                        continue
                    c.rect(x, y, x + 5, y + 4, ('#6a3a24', '#3a4a2a', '#5a4a3a')[(x + y) % 3])
                    c.hl(x, x + 5, y, '#8a6a4a')
    face_coach(c, L, H, spec)
    c.im = outline(c.im)
    return c.im


def top_steam(spec, side, heading):
    """A tender engine from above, heading south (its smokebox face at the
    bottom) or north (its chimney at the top, the cab's back at the bottom)."""
    L = side.w - 2
    H = profile(side)
    body = LIVERY[spec['livery']]
    im = Image.new('RGBA', (TW + DRIFT_T + 2, L + H))
    c = C(im.width, im.height)
    south = heading == 's'
    row = (lambda x: x) if south else (lambda x: L - 1 - x)
    cx = TW // 2
    br = min(11, spec['boiler_r'])
    # Running boards the length of the engine.
    for x in range(L):
        y = row(x)
        c.hl(1, TW - 2, y, body[2] if not spec.get('pilot') else IRON[3])
        c.px(1, y, body[4])
        c.px(TW - 2, y, body[0])
    # Boiler: a cylinder lying along the column, lit on its west side.
    front = L - 4
    b0 = spec['cab_at'] + spec['cab_len']
    b1 = front - spec['smokebox']
    for x in range(b0, front + 1):
        y = row(x)
        ramp = body if x < b1 else IRON
        for xx in range(cx - br, cx + br + 1):
            f = (xx - (cx - br)) / (2 * br)
            k = 6 if 0.18 < f < 0.3 else 5 if f < 0.45 else 4 if f < 0.6 else 3 if f < 0.8 else 2
            c.px(xx, y, ramp[k])
        if x in spec.get('bands', range(b0 + 10, b1 - 3, 14)):
            c.hl(cx - br, cx + br, y, BRASS[4] if spec.get('brass_bands') else LIVERY['cream'][5] if spec.get('lined') else body[1])
    # Chimney, dome and valves as rings on the boiler's top.
    chim = b1 + spec['smokebox'] // 2
    rr = 6 if spec['chimney'] == 'balloon' else 4
    c.ellipse(cx, row(chim), rr, rr, IRON[4] if spec['chimney'] != 'copper' else COPPER[4])
    c.ellipse(cx, row(chim), rr - 1.5, rr - 1.5, COAL[0])
    if spec.get('dome'):
        sphere(c, cx, row(spec['dome']), spec.get('dome_r', 4) + 0.5, BRASS if spec.get('brass_dome') else body, lo=1)
    if spec.get('valves'):
        sphere(c, cx, row(spec['valves']), 2.2, BRASS, lo=2)
    if spec.get('bell'):
        sphere(c, cx, row(spec['bell']), 2.2, BRASS, lo=2)
    # The cab roof, or the open footplate of an early engine.
    for x in range(spec['cab_at'], b0):
        y = row(x)
        if spec.get('cab') == 'weatherboard':
            c.hl(2, TW - 3, y, COAL[2] if x < b0 - 2 else body[4])
        else:
            roofc = LIVERY['red'] if spec.get('cab') == 'wood' else body
            c.hl(1, TW - 2, y, roofc[4])
            c.px(1, y, roofc[6])
            c.px(TW - 2, y, roofc[1])
    # The face.
    top = L
    base = L + H - 1
    fp = base - spec['footplate']
    if south:
        by = fp - br - spec.get('pitch', 2)
        chim_top = top + spec['chimney_top'] - (side.h - 2 - H) + 0
        # Buffer beam and buffers.
        c.rect(1, fp - 1, TW - 2, fp + 5, BUFFER_RED[2] if not spec.get('pilot') else IRON[3])
        c.hl(1, TW - 2, fp - 1, BUFFER_RED[4] if not spec.get('pilot') else IRON[5])
        if spec.get('pilot'):
            for y in range(fp + 1, base - 1):
                for x in range(1, TW - 1):
                    if (x + y) % 3 == 0:
                        c.px(x, y, IRON[4])
        else:
            for bx in (2, TW - 6):
                c.rect(bx, fp + 1, bx + 3, fp + 3, IRON[5])
                c.px(bx, fp + 1, IRON[6])
        for wx in (4, TW - 7):
            c.rect(wx, fp + 5, wx + 2, base, IRON[1])
            c.vl(wx, fp + 5, base, IRON[3])
        # The smokebox front: a black disc with its door ring and handle.
        c.ellipse(cx, by, br + 1, br + 1, IRON[2])
        c.ellipse(cx, by, br, br, IRON[3])
        c.ellipse(cx - 0.5, by - 0.5, br - 3, br - 3, IRON[4])
        c.ellipse(cx, by, br - 4, br - 4, IRON[2])
        c.hl(cx - 3, cx + 3, int(by), IRON[5])
        c.px(cx, int(by), BRASS[5])
        # Chimney rising over it.
        ct = max(top, chim_top)
        for y in range(ct, int(by - br)):
            half = 3 if spec['chimney'] != 'balloon' or y > ct + 10 else 6 - (y - ct) * 0.3
            for x in range(int(cx - half), int(cx + half) + 1):
                f = (x + 0.5 - (cx - half)) / (2 * half)
                ramp = COPPER if spec['chimney'] == 'copper' and y < ct + 4 else IRON
                c.px(x, y, ramp[5] if f < 0.3 else ramp[3] if f < 0.7 else ramp[1])
        if spec.get('headlamp') == 'box':
            c.rect(cx - 4, int(by - br - 8), cx + 3, int(by - br - 1), IRON[3])
            c.rect(cx - 2, int(by - br - 6), cx + 1, int(by - br - 3), LAMP[2])
        else:
            for lx in (3, cx - 1):
                c.rect(lx, fp - 6, lx + 2, fp - 2, '#e8e4d8')
                c.px(lx + 1, fp - 4, LAMP[2])
        # Cylinders either side, if outside.
        if spec.get('cylinder'):
            for x0 in (0, TW - 4):
                c.rect(x0, fp + 1, x0 + 3, fp + 8, IRON[3])
                c.hl(x0, x0 + 3, fp + 1, IRON[5])
    else:
        # The back of the cab: its spectacle plates and the footplate.
        ct = top + max(0, spec['cab_top'] - (side.h - 2 - H))
        c.rect(1, ct, TW - 2, fp, body[3])
        c.hl(1, TW - 2, ct, body[5])
        c.rect(4, ct + 5, 10, ct + 11, GLASS[3])
        c.rect(TW - 11, ct + 5, TW - 5, ct + 11, GLASS[3])
        c.rect(1, fp, TW - 2, fp + 3, BUFFER_RED[2])
        for wx in (4, TW - 7):
            c.rect(wx, fp + 4, wx + 2, base, IRON[1])
    c.im = outline(c.im)
    return c.im


def top_tender(spec, side):
    L = side.w - 2
    H = profile(side)
    body = LIVERY[spec['livery']]
    im = Image.new('RGBA', (TW + DRIFT_T + 2, L + H))
    c = C(im.width, im.height)
    wood = spec.get('tender_wood')
    edge = LIVERY['teak'] if wood else body
    for y in range(L):
        c.hl(1, TW - 2, y, edge[3])
        c.px(1, y, edge[5])
        c.px(TW - 2, y, edge[1])
        c.px(2, y, edge[4])
    for y in range(3, L - 6):
        for x in range(4, TW - 4):
            k = 3 if h2(x // 2, y // 2, 4) > 0.7 else 2 if (x * 3 + y) % 5 else 1
            c.px(x, y, COAL[k] if not spec.get('logs') else LIVERY['teak'][(x // 3 + y // 4) % 3 + 1])
    c.rect(4, L - 6, TW - 5, L - 3, edge[4])
    c.ellipse(TW // 2, L - 4, 2, 2, IRON[2])
    top = L
    base = L + H - 1
    fp = base - spec['footplate']
    tt = fp - spec['tender_h']
    c.rect(1, tt + 3, TW - 2, fp, edge[3])
    c.hl(1, TW - 2, tt + 3, edge[5])
    for y in range(tt + 6, fp - 2, 2):
        c.px(TW // 2 - 2, y, IRON[4])
        c.px(TW // 2 + 2, y, IRON[4])
    c.rect(1, fp, TW - 2, fp + 4, BUFFER_RED[2])
    for bx in (2, TW - 6):
        c.rect(bx, fp + 1, bx + 3, fp + 3, IRON[5])
    for wx in (4, TW - 7):
        c.rect(wx, fp + 5, wx + 2, base, IRON[1])
    c.im = outline(c.im)
    return c.im


def top_diesel(spec, side):
    L = side.w - 2
    H = profile(side)
    body = LIVERY[spec['livery']]
    roof = LIVERY[spec.get('roof', 'grey')]
    im = Image.new('RGBA', (TW + DRIFT_T + 2, L + H))
    c = C(im.width, im.height)
    roof_strip(c, L, 1, TW - 2, roof, 1, vents=False, sliver=body)
    for y in range(20, L - 20, 14):
        c.ellipse(TW // 2, y, 5, 5, roof[1])
        c.ellipse(TW // 2, y, 4, 4, roof[2])
        for k in range(-3, 4):
            c.px(TW // 2 + k, y, roof[4])
            c.px(TW // 2, y + k, roof[4])
    if spec.get('pantograph'):
        y = L // 2 - 12
        for k in range(12):
            c.px(TW // 2 - 6 + k, y - k // 2, IRON[5])
            c.px(TW // 2 - 6 + k, y + k // 2, IRON[4])
        c.hl(3, TW - 4, y - 7, IRON[5])
    top = L
    base = L + H - 1
    floor = base - 13
    btop = floor - spec['body_h']
    for y in range(btop, floor + 1):
        for x in range(1, TW - 1):
            f = (x - 1) / (TW - 3)
            c.px(x, y, body[4] if f < 0.2 else body[3] if f < 0.85 else body[2])
    for j in range(ROOF + 1):
        inset = max(0, j - ROOF + 3)
        c.hl(1 + inset, TW - 2 - inset, btop - j, roof[4] if j > ROOF - 2 else roof[3])
    c.rect(3, btop + 5, TW // 2 - 2, btop + 13, GLASS[2])
    c.rect(TW // 2 + 1, btop + 5, TW - 4, btop + 13, GLASS[2])
    c.hl(3, TW - 4, btop + 5, GLASS[4])
    if spec.get('warning'):
        for y in range(btop + 16, floor):
            c.hl(1, TW - 2, y, LIVERY['yellow'][4])
    for lx in (3, TW - 6):
        c.rect(lx, floor - 5, lx + 2, floor - 3, LAMP[2])
    c.rect(1, floor + 1, TW - 2, floor + 4, IRON[2])
    for bx in (2, TW - 5):
        c.rect(bx, floor - 1, bx + 2, floor + 1, IRON[5])
    for wx in (4, TW - 7):
        c.rect(wx, floor + 5, wx + 2, base, IRON[1])
    c.im = outline(c.im)
    return c.im


def top_wagon(spec, side):
    L = side.w - 2
    H = profile(side)
    body = LIVERY[spec['livery']]
    im = Image.new('RGBA', (TW + DRIFT_T + 2, L + H))
    c = C(im.width, im.height)
    kind = spec['kind']
    if kind == 'coal':
        for y in range(L):
            c.hl(1, TW - 2, y, body[3])
            c.px(1, y, body[5])
            c.px(TW - 2, y, body[1])
        for y in range(2, L - 2):
            for x in range(3, TW - 3):
                c.px(x, y, COAL[(x * 3 + y) % 4 if h2(x, y, 2) < 0.8 else 3])
    elif kind == 'tank':
        for y in range(L):
            for x in range(4, TW - 4):
                f = (x - 4) / (TW - 9)
                c.px(x, y, body[5] if f < 0.3 else body[4] if f < 0.55 else body[3] if f < 0.8 else body[2])
        sphere(c, TW // 2, L // 2, 3, body, lo=1)
    elif kind == 'container':
        roof_strip(c, L // 2, 1, TW - 2, LIVERY[spec.get('c1', 'blue')], 1, vents=False)
        top2 = C(im.width, L - L // 2)
        roof_strip(top2, L - L // 2, 1, TW - 2, LIVERY[spec.get('c2', 'red')], 1, vents=False)
        c.blit(top2.im, 0, L // 2)
    else:
        roof_strip(c, L, 1, TW - 2, LIVERY['grey'], 1, vents=kind == 'brake', sliver=body)
    top = L
    base = L + H - 1
    floor = base - 11
    t = top + 2
    c.rect(1, t, TW - 2, floor, body[3])
    c.hl(1, TW - 2, t, body[5])
    c.rect(1, floor + 1, TW - 2, floor + 3, IRON[2])
    for bx in (2, TW - 5):
        c.rect(bx, floor - 1, bx + 2, floor + 1, IRON[5])
    for wx in (4, TW - 7):
        c.rect(wx, floor + 4, wx + 2, base, IRON[1])
    if kind == 'brake':
        c.rect(TW - 7, floor - 6, TW - 5, floor - 4, LIVERY['red'][4])
    c.im = outline(c.im)
    return c.im


# ------------------------------------------------------------------ catalogue
#
# Sets by period. Lengths and heights in pixels, drawn to the scale above.

def early_loco(**k):
    """A single-driver of the 1840s: a long thin boiler, a tall flared
    chimney, a polished dome, a weatherboard and no cab."""
    s = dict(length=86, height=80, footplate=15, boiler_r=9, pitch=3, smokebox=11,
             cab_at=4, cab_len=12, cab='weatherboard', cab_top=24,
             chimney='flared', chimney_top=4, dome=48, dome_r=5, brass_dome=True, valves=19,
             drivers=[45], driver_r=16, spokes=18, carrying=[(72, 7), (17, 7)],
             splashers=True, brass_splash=True, livery='green', lined=True,
             brass_bands=True, brass_rail=True,
             tender=46, tender_h=17, tender_wheels=[11, 35], tender_r=7, tender_wood=True)
    s.update(k)
    return s


def victorian_loco(**k):
    """A 4-4-0 of the 1880s: inside cylinders, the drivers under splashers,
    a copper-capped chimney, a brass dome, a proper cab, lined out."""
    s = dict(length=116, height=76, footplate=17, boiler_r=12, pitch=2, smokebox=16,
             cab_at=4, cab_len=23, cab_top=12,
             chimney='copper', chimney_top=10, dome=60, dome_r=6, brass_dome=True, valves=31,
             drivers=[40, 70], driver_r=15, spokes=18, carrying=[(97, 7), (109, 7)],
             splashers=True, livery='green', lined=True, brass_bands=False,
             tender=72, tender_h=24, tender_wheels=[12, 36, 60], tender_r=7)
    s.update(k)
    return s


def american_loco(**k):
    """An American 4-4-0 of the 1860s-70s: a diamond or balloon stack, a box
    headlamp, a bell, sand dome, wooden cab, pilot, outside cylinders."""
    s = dict(length=120, height=84, footplate=19, boiler_r=11, pitch=3, smokebox=16,
             cab_at=4, cab_len=25, cab='wood', cab_top=14,
             chimney='balloon', chimney_top=6, dome=56, dome_r=6, brass_dome=True, bell=74,
             sandbox=44, drivers=[42, 68], driver_r=15, spokes=18, carrying=[(95, 7), (107, 7)],
             cylinder=True, cyl_back=30, pilot=True, headlamp='box', livery='red',
             tender=74, tender_h=19, tender_wheels=[12, 24, 50, 62], tender_r=6, tender_wood=True, logs=True)
    s.update(k)
    return s


def big_loco(**k):
    """A 4-6-2 of the 1920s-40s: a big boiler pitched high, outside
    cylinders and motion, a short chimney and a spacious cab."""
    s = dict(length=152, height=80, footplate=21, boiler_r=15, pitch=1, smokebox=21,
             cab_at=4, cab_len=27, cab_top=10,
             chimney='lip', chimney_top=16, dome=78, dome_r=5, brass_dome=False, valves=46,
             drivers=[50, 76, 102], driver_r=15, spokes=20, carrying=[(23, 7), (124, 7), (137, 7)],
             cylinder=True, cyl_back=35, livery='green', lined=True,
             tender=84, tender_h=28, tender_wheels=[14, 30, 54, 70], tender_r=7)
    s.update(k)
    return s


STEAM_SETS = {
    'early': dict(loco=early_loco(),
                  coaches=[dict(length=64, body_h=30, livery='yellow', upper='yellow', pattern='stage',
                                roof='black', roof_kind='flat', axles=2, wheel_r=7, spoked=True, floor=15,
                                win_top=6, win_h=11),
                           dict(length=58, body_h=32, livery='teak', open=True, axles=2, wheel_r=7, spoked=True, floor=15)]),
    'victorian': dict(loco=victorian_loco(),
                      coaches=[dict(length=108, body_h=40, livery='teak', upper='teak', pattern='compartment',
                                    axles=3, wheel_r=6, lined=True, roof='grey', waist=0.42, floor=14, win_top=6, win_h=14, compartment=21),
                               dict(length=108, body_h=40, livery='chocolate', upper='cream', pattern='compartment',
                                    axles=3, wheel_r=6, lined=True, roof='grey', waist=0.42, floor=14, win_top=6, win_h=14, compartment=21)]),
    'american': dict(loco=american_loco(),
                     coaches=[dict(length=128, body_h=40, livery='yellow', upper='yellow', pattern='saloon',
                                   bogies=2, wheel_r=5, roof_kind='clerestory', roof='black', win_w=7, win_gap=3, win_top=7, win_h=14, floor=14,
                                   frames=True)]),
    'american-late': dict(loco=american_loco(livery='black', chimney='lip', chimney_top=12, cab=None, cab_top=10,
                                             tender_wood=False, lined=False),
                          coaches=[dict(length=140, body_h=42, livery='pullman', upper='pullman', pattern='saloon',
                                        bogies=3, wheel_r=5, roof_kind='clerestory', roof='black', win_w=8, win_gap=3, win_top=7, win_h=15, floor=14,
                                        frames=True)]),
    'edwardian': dict(loco=big_loco(),
                      coaches=[dict(length=144, body_h=42, livery='crimson', upper='crimson', pattern='saloon',
                                    bogies=2, wheel_r=5, lined=True, roof='grey', win_w=11, win_gap=5, frames=True, win_top=7, win_h=15, floor=14)]),
}


# Freight and the later sets. A set is what one railway ran in one period:
# its engine and the stock behind it. The game picks a set by date and region
# (src/core/railway.ts) and makes up each train from its parts.
def _coach(**k):
    s = dict(bogies=2, wheel_r=5, roof='grey', win_top=7, win_h=15, floor=14, body_h=42, pattern='saloon')
    s.update(k)
    return s


WAGONS_EARLY = [dict(length=46, kind='coal', livery='teak', spoked=True), dict(length=46, kind='van', livery='teak', spoked=True)]
WAGONS = [dict(length=48, kind='coal', livery='grey'), dict(length=48, kind='van', livery='chocolate'),
          dict(length=48, kind='tank', livery='black')]
WAGONS_LATE = [dict(length=100, kind='container', livery='grey', bogies=True, c1='blue', c2='red'),
               dict(length=100, kind='container', livery='grey', bogies=True, c1='green', c2='orange'),
               dict(length=60, kind='tank', livery='grey', bogies=True)]

SETS = {
    'early': dict(loco=early_loco(), coaches=STEAM_SETS['early']['coaches'], wagons=WAGONS_EARLY,
                  brake=dict(length=46, kind='brake', livery='teak', spoked=True)),
    'victorian': dict(loco=victorian_loco(), coaches=STEAM_SETS['victorian']['coaches'], wagons=WAGONS,
                      brake=dict(length=48, kind='brake', livery='grey')),
    'victorian-crimson': dict(loco=victorian_loco(livery='crimson', line=BRASS[5]),
                              coaches=[dict(STEAM_SETS['victorian']['coaches'][0], livery='crimson', upper='crimson')],
                              wagons=WAGONS, brake=dict(length=48, kind='brake', livery='grey')),
    'american': dict(loco=american_loco(), coaches=STEAM_SETS['american']['coaches'], wagons=WAGONS_EARLY,
                     brake=dict(length=48, kind='brake', livery='red', spoked=True)),
    'american-late': dict(loco=STEAM_SETS['american-late']['loco'], coaches=STEAM_SETS['american-late']['coaches'],
                          wagons=WAGONS, brake=dict(length=48, kind='brake', livery='red')),
    'edwardian': dict(loco=big_loco(), coaches=STEAM_SETS['edwardian']['coaches']
                      + [_coach(length=144, livery='teak', upper='teak', lined=True, win_w=11, win_gap=5, frames=True)],
                      wagons=WAGONS, brake=dict(length=48, kind='brake', livery='grey')),
    'interwar-black': dict(loco=big_loco(livery='black', lined=False),
                           coaches=[_coach(length=144, livery='chocolate', upper='cream', win_w=11, win_gap=5, frames=True)],
                           wagons=WAGONS, brake=dict(length=48, kind='brake', livery='grey')),
    'diesel': dict(loco=dict(diesel=True, length=164, body_h=46, livery='green', band=7, second='sovietgreen', stripe='cream',
                             exhaust=True, coco=True, warning=True, cab_shape='box', nose=9),
                   coaches=[_coach(length=150, livery='crimson', upper='cream', steel=True, win_w=11, win_gap=4)],
                   wagons=WAGONS, brake=dict(length=48, kind='brake', livery='grey')),
    'streamline-us': dict(loco=dict(diesel=True, length=150, body_h=50, livery='steel', second='steel', nose=30,
                                    exhaust=True, double=False, cab_shape='nose', emblem='warbonnet', portholes=True, louvres=2),
                          coaches=[_coach(length=150, livery='steel', upper='steel', steel=True, fluted=True, win_w=12, win_gap=4,
                                          stripe='red')],
                          wagons=WAGONS, brake=dict(length=48, kind='brake', livery='red')),
    'soviet': dict(loco=dict(diesel=True, length=164, body_h=48, livery='sovietgreen', band=8, second='red', stripe='yellow',
                             exhaust=True, coco=True, nose=14, cab_shape='nose', double=True, emblem='star', headlamp=True),
                   coaches=[_coach(length=150, livery='sovietgreen', upper='sovietgreen', steel=True, win_w=10, win_gap=5,
                                   stripe='yellow')],
                   wagons=WAGONS_LATE, brake=None),
    'blue': dict(loco=dict(diesel=True, length=160, body_h=46, livery='blue', warning=True, pantograph=True,
                           cab_shape='box', nose=9, emblem='arrow'),
                 coaches=[_coach(length=150, livery='blue', upper='white', steel=True, win_w=18, win_gap=3, waist=0.25)],
                 wagons=WAGONS_LATE, brake=None),
    'modern': dict(loco=dict(diesel=True, length=150, body_h=46, livery='white', second='blue', band=10, nose=34,
                             warning=True, double=False, stripe='red', cab_shape='wedge', louvres=1),
                   coaches=[_coach(length=150, livery='white', upper='white', steel=True, win_w=22, win_gap=3, waist=0.25,
                                   stripe='red', roof='grey')],
                   wagons=WAGONS_LATE, brake=None),
}


GAS_GLOW = ['#8a5a20', '#d89a48', '#f4c878', '#fff0c0']


def glow(im):
    """After dark: the carriages lit from inside, so the glass glows and the
    passengers stand against it; lamps at full strength, the tail lamp red."""
    out = Image.new('RGBA', im.size)
    src, q = im.load(), out.load()
    glass = {rgba(g)[:3]: k for k, g in enumerate(GLASS)}
    lamps = {rgba(LAMP[1])[:3], rgba(LAMP[2])[:3], rgba('#e8e4d8')[:3]}
    tail = {rgba(LIVERY['red'][4])[:3], rgba(LIVERY['red'][5])[:3], rgba(LIVERY['red'][6])[:3]}
    for y in range(im.height):
        for x in range(im.width):
            p = src[x, y]
            if not p[3]:
                continue
            rgb = p[:3]
            if rgb in glass and 1 <= glass[rgb] <= 4:
                q[x, y] = rgba(GAS_GLOW[1] if glass[rgb] == 1 else GAS_GLOW[2] if glass[rgb] < 4 else GAS_GLOW[3])
            elif rgb in lamps:
                q[x, y] = rgba(GAS_GLOW[3])
            elif rgb in tail:
                q[x, y] = rgba('#ff5040')
    return out


def signal(kind, clear):
    """A signal beside the line. A semaphore: a white wooden post with its
    finial and ladder, the red arm level at danger and dropped at clear, the
    spectacle glass swung over the lamp. A colour light: a slim post, a black
    head on a backboard, the red or the green lit."""
    W, H = 20, 76
    c = C(W, H)
    base = H - 2
    px_ = 10
    if kind == 'sem':
        post = ['#6a6860', '#a8a498', '#d8d4c8', '#f2efe6']
        c.rect(px_ - 1, 8, px_ + 1, base, post[2])
        c.vl(px_ - 1, 8, base, post[3])
        c.vl(px_ + 1, 8, base, post[0])
        c.rect(px_ - 3, base - 3, px_ + 3, base, IRON[3])
        # Finial and cap.
        c.rect(px_ - 2, 6, px_ + 2, 7, IRON[3])
        c.vl(px_, 2, 5, IRON[4])
        sphere(c, px_ + 0.5, 2, 1.5, IRON, lo=2)
        # Ladder up the right side.
        c.vl(px_ + 3, 14, base - 3, IRON[3])
        c.vl(px_ + 5, 14, base - 3, IRON[3])
        for y in range(16, base - 3, 3):
            c.hl(px_ + 3, px_ + 5, y, IRON[4])
        # The arm, pivoted on the post's left: level at danger, down at clear.
        ay = 12
        for i in range(12):
            dy = int(i * 0.8) if clear else 0
            x = px_ - 2 - i
            for k in range(3):
                col = LIVERY['red'][4] if not (7 <= i <= 8) else '#f2efe6'
                if k == 2:
                    col = LIVERY['red'][2] if not (7 <= i <= 8) else '#b8b4a8'
                c.px(x, ay + k + dy, col)
        # Spectacle: red glass at danger, green at clear, over the lamp.
        lamp_y = ay + 8
        c.rect(px_ + 2, lamp_y - 2, px_ + 4, lamp_y + 2, IRON[2])
        c.px(px_ + 3, lamp_y, '#ff5040' if not clear else '#50e878')
        c.px(px_ + 2, ay + 1, IRON[4])
    else:
        c.rect(px_, 20, px_ + 1, base, IRON[3])
        c.vl(px_, 20, base, IRON[5])
        c.rect(px_ - 4, 6, px_ + 5, 21, '#f2efe6')
        c.rect(px_ - 3, 7, px_ + 4, 20, IRON[1])
        for k, (cy, on_col, off_col) in enumerate(((10, '#50e878', '#1c3a28'), (16, '#ff5040', '#3a1c1c'))):
            lit = (k == 0) == clear
            c.ellipse(px_ + 0.5, cy + 0.5, 2.2, 2.2, on_col if lit else off_col)
            c.hl(px_ - 2, px_ + 3, cy - 3, IRON[3])
        c.rect(px_ - 3, base - 2, px_ + 4, base, IRON[3])
    return outline(c.im)


def _smoke(side, spec):
    """Where steam or exhaust leaves the vehicle, in its side view."""
    return getattr(side, 'smoke', None)


def build(out_dir, generated):
    """Every set's vehicles as atlas frames and a catalogue of their sizes,
    chimneys and doors, for the game's railway."""
    import json
    sprites, catalog = {}, {}
    for name, st in SETS.items():
        parts = {}

        def add(key, kind, spec, draw, top):
            frames = [draw(spec, f) for f in range(FRAMES)]
            for f, side in enumerate(frames):
                sprites[f'train-{name}-{key}-{f}'] = outline(side.c.im)
            side = frames[0]
            sprites[f'train-{name}-{key}-glow'] = glow(sprites[f'train-{name}-{key}-0'])
            tops = top(side)
            for suffix, im in tops.items():
                sprites[f'train-{name}-{key}-top{suffix}'] = im
                sprites[f'train-{name}-{key}-top{suffix}-glow'] = glow(im)
            parts[key] = {
                'kind': kind,
                'length': side.w - 2,
                'height': profile(side),
                'width': TW,
                'sideHeight': side.h,
                **({'smoke': _smoke(side, spec)} if _smoke(side, spec) else {}),
                **({'doors': side.doors} if getattr(side, 'doors', None) else {}),
                'steam': kind == 'steam',
            }
        loco = st['loco']
        if loco.get('diesel'):
            add('loco', 'diesel', loco, diesel, lambda sd: {'': top_diesel(loco, sd)})
        else:
            add('loco', 'steam', loco, steam_loco, lambda sd: {'-s': top_steam(loco, sd, 's'), '-n': top_steam(loco, sd, 'n')})
            add('tender', 'tender', loco, tender, lambda sd: {'': top_tender(loco, sd)})
        for i, cs in enumerate(st['coaches']):
            spec = dict(cs, seed=i + 1)
            add(f'coach{i}', 'coach', spec, coach, lambda sd, spec=spec: {'': top_coach(spec, sd)})
        for i, ws in enumerate(st['wagons']):
            add(f'wagon{i}', 'wagon', ws, wagon, lambda sd, ws=ws: {'': top_wagon(ws, sd)})
        if st.get('brake'):
            b = st['brake']
            add('brake', 'brake', b, wagon, lambda sd, b=b: {'': top_wagon(b, sd)})
        catalog[name] = parts
    for kind in ('sem', 'light'):
        for clear in (0, 1):
            im = signal(kind, clear)
            sprites[f'rail-signal-{kind}-{clear}'] = im
            g = Image.new('RGBA', im.size)
            src, q = im.load(), g.load()
            for y in range(im.height):
                for x in range(im.width):
                    if src[x, y][:3] in (rgba('#ff5040')[:3], rgba('#50e878')[:3]):
                        q[x, y] = src[x, y]
            sprites[f'rail-signal-{kind}-{clear}-glow'] = g
    from art.atlas import pack_atlas
    pack_atlas(sprites, out_dir, 'trains', 2048)
    (generated / 'trains.generated.json').write_text(json.dumps(catalog, indent=1))
    return sprites, catalog


def sheet(out, names=None, zoom=3):
    """Each set as a train on the line, beside the figure: engine, a coach,
    a wagon."""
    from art.reference import current_adult_d
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    rows = []
    for name, st in SETS.items():
        if names and name not in names:
            continue
        loco = st['loco']
        head = [diesel(loco, 0)] if loco.get('diesel') else [steam_loco(loco, 0), tender(loco, 0)]
        row = head + [coach(dict(cs, seed=i + 1), 0) for i, cs in enumerate(st['coaches'][:2])]
        row += [wagon(st['wagons'][0], 0)]
        rows.append([outline(v.c.im) for v in row])
    pad = 8
    W = max(sum(i.width for i in r) + adult.width + pad * 3 for r in rows)
    H = sum(max(i.height for i in r) + pad for r in rows) + pad
    im = Image.new('RGBA', (W, H), '#8f8e84')
    y = pad
    for r in rows:
        h = max(i.height for i in r)
        x = pad
        for part in reversed(r):
            im.alpha_composite(part, (x, y + h - part.height))
            x += part.width - 1
        im.alpha_composite(adult, (x + pad, y + h - adult.height - 2))
        y += h + pad
    im.resize((W * zoom, H * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent.parent
    if sys.argv[1:2] == ['build']:
        build(root / 'public/props', root / 'src/content/graphics')
    else:
        Path('artifacts/trains').mkdir(parents=True, exist_ok=True)
        sheet(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/trains/sheet.png', sys.argv[2:] or None)
