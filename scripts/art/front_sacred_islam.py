"""Mosques and madrasas of the Arab lands, the Maghrib and the Ottomans,
front-on, on the Persian courtyard form (front_persian.compound).

    .venv/bin/python scripts/art/front_islam.py artifacts/front-islam.png

Arab: a Mamluk or Levantine mosque of limestone in ablaq courses, a crested
parapet, a muqarnas portal, a carved stone dome over the mihrab and a
minaret in square, octagonal and round stages with a bulb on columns.
Maghrebi: whitewashed, ochre or pisé walls, the prayer hall's aisles under
parallel ridges of green glazed tile ending in gables on the court, a gate
under a tiled hood, a square minaret with lozenge panels, a tile band,
merlons and a lantern with its gilt balls.
Ottoman: a court behind a stone wall, a domed portico, the hall's lead
domes stepping up to the great dome, pencil minarets with balconies and
lead cones, the canopied ablution fountain in the court.
Madrasas in each of the three: cells round a court, the teaching iwan or
domed classroom across it.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as pr  # noqa: E402
from art import front_persian as pz  # noqa: E402
from art import front_westasia as wa  # noqa: E402

LIME, LIME_TOP, BASALT = wa.LIME, wa.LIME_TOP, wa.BASALT
RED = ramp(32, 0.085, lift=-0.04)
SAND = ramp(70, 0.05, lift=0.0)
WHITE, WHITE_TOP, GREEN = wa.WHITE, wa.WHITE_TOP, wa.GREEN
OCHRE = ramp(62, 0.075, lift=-0.02)
OCHRE_TOP = ramp(66, 0.06, lift=0.05)
PISE = ramp(48, 0.07, lift=-0.06)
PISE_TOP = ramp(52, 0.06, lift=0.02)
TEAL = ramp(200, 0.08, lift=-0.08)
STONE = ramp(78, 0.025, lift=0.05)
STONE_TOP = ramp(80, 0.02, lift=0.09)
BRICK = RAMPS['roman-brick']
LEAD = RAMPS['lead']
MARBLE = RAMPS['marble']
CEDAR = RAMPS['cedar']
GILT = fp.GOLD
# The dark of a lamplit hall seen through its arches and windows: painted
# only there, so the night frame can light it.
GLOOM = ramp(295, 0.04, lift=-0.06)
fm.glazes(GLOOM)


# ------------------------------------------------------------------ surfaces

def ablaq(light, dark, course=6, block=26, every=2):
    """Courses of light and dark stone in turn, broad and quiet: a lit arris
    on each course, a joint under it, few vertical joints."""
    def paint(c, x0, y0, w, h):
        for yy in range(y0, y0 + h):
            row, ly = (yy - y0) // course, (yy - y0) % course
            r = dark if row % every == every - 1 else light
            for xx in range(x0, x0 + w):
                lx = (xx - x0 + (row % 2) * block // 2) % block
                q = 0 if ly == 0 else 3 if ly == course - 1 or lx == 0 else 1 if r is light else 2
                c.p(xx, yy, r[q])
    return paint


def ashlar_of(r, course=8, block=20):
    return lambda c, x, y, w, h: fm.ashlar(c, x, y, w, h, r, course, block)


def wash_of(r):
    return lambda c, x, y, w, h: fm.kahgel(c, x, y, w, h, r)


def cloisonne(c, x0, y0, w, h):
    """Early Ottoman walling: a stone set in a frame of brick, a brick
    course between the stone courses, as at Bursa and Iznik."""
    for yy in range(y0, y0 + h):
        ly = (yy - y0) % 12
        for xx in range(x0, x0 + w):
            lx = (xx - x0) % 16
            if ly >= 10 or lx >= 14:
                q = 4 if ly == 11 or lx == 15 else 3
                c.p(xx, yy, BRICK[q])
            else:
                c.p(xx, yy, STONE[0] if ly == 0 else STONE[3] if ly == 8 else STONE[1])


# ------------------------------------------------------------------ arches and openings

def horseshoe(x, y, x0, spring, w):
    """A horseshoe arch: the circle carried below its widest point."""
    R = w / 2 + 1.5
    cx = x0 + w / 2
    oy = spring - R * 0.35
    if y >= spring:
        return x0 <= x < x0 + w
    return math.hypot(x + 0.5 - cx, y + 0.5 - oy) < R


SHAPES = {**fp.SHAPES, 'horseshoe': horseshoe}


def shape_top(shape, w):
    return round(w / 2 * 1.35 + 2) if shape == 'horseshoe' else fp.apex(shape, w)


def opening(c, cx, spring, w, bottom, shape, inside=GLOOM, lit_right=True):
    """A deep arched opening on to a lamplit hall: dark, its back a step
    lighter, the reveal on the left in deeper shade."""
    x0 = cx - w // 2
    test = SHAPES[shape]
    for yy in range(spring - shape_top(shape, w) - 2, bottom):
        for xx in range(x0, x0 + w):
            if test(xx, yy, x0, spring, w):
                lx = xx - x0
                q = 6 if lx < 3 or yy < spring - 1 else 5 if lit_right and lx > w - 4 else 5 if (yy - spring) % 9 == 0 else 4
                c.p(xx, yy, inside[min(7, q + 1)])


def voussoirs(c, cx, spring, w, band, shape, light, dark=None):
    """The ring of an arch: a lit outer edge, its stones in turn light and
    dark where the look is ablaq."""
    x0 = cx - w // 2 - band
    W = w + 2 * band
    test, inner = SHAPES[shape], SHAPES[shape]
    for yy in range(spring - shape_top(shape, W) - 2, spring + 1):
        for xx in range(x0, x0 + W):
            if test(xx, yy, x0, spring, W) and not inner(xx, yy, cx - w // 2, spring, w):
                a = math.atan2(spring - yy, xx + 0.5 - cx)
                r = dark if dark and int(a / math.pi * (w // 3 + 3)) % 2 else light
                outer = not test(xx, yy, x0 + 1, spring, W - 2)
                c.p(xx, yy, r[0] if outer else r[1] if xx < cx else r[2])


def grille_window(c, x, y, w, h, frame):
    """A grilled window in a stone frame: the iron over dark glass, a sill
    whose top we see, the frame's shadow on the wall below."""
    op.raised(c, x - 3, y - 3, w + 6, h + 6, frame, 1)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            iron = (xx - x) % 4 == 3 or (yy - y) % 5 == 4
            c.p(xx, yy, op.IRON[3] if iron else GLOOM[5 if xx - x > 1 else 6])
    c.rect(x - 4, y + h + 3, w + 8, 2, frame[0])
    op.cast(c, x - 3, y + h + 5, w + 6, 2, 0.7)


def arched_light(c, cx, top, w, h, frame, shape='pointed', band=2):
    """A window under an arch: a stone ring, dark glass behind a grille."""
    spring = top + shape_top(shape, w)
    voussoirs(c, cx, spring, w, band, shape, frame)
    test = SHAPES[shape]
    x0 = cx - w // 2
    for yy in range(top - 1, top + h):
        for xx in range(x0, x0 + w):
            if test(xx, yy, x0, spring, w):
                c.p(xx, yy, GLOOM[4] if (xx - x0) % 3 == 2 and yy > spring else GLOOM[6])
    c.rect(x0 - band, top + h, w + 2 * band, 2, frame[0])


def muqarnas(c, cx, spring, w, shape, r):
    """The hood of a portal's recess: tiers of little niches stepping out,
    each lit on its lower lip and dark in its cup, fewer at each tier up."""
    x0 = cx - w // 2
    test = SHAPES[shape]
    top = spring - shape_top(shape, w)
    tier = 5
    for yy in range(top - 1, spring + 3):
        j = (spring + 3 - yy) // tier
        ly = (spring + 3 - yy) % tier
        cell = 6
        off = (j % 2) * cell // 2
        for xx in range(x0, x0 + w):
            if not test(xx, yy, x0, spring, w):
                continue
            lx = (xx - x0 + off) % cell
            q = 1 if ly == 0 else 5 if ly == tier - 1 and lx in (2, 3) else 4 if lx in (0, cell - 1) or ly == tier - 1 else 3
            if xx < x0 + 2:
                q = min(7, q + 1)
            c.p(xx, yy, r[q])


def joggled_lintel(c, cx, y, w, light, dark, h=6):
    """A lintel of interlocking light and dark voussoirs, as over Mamluk doors."""
    x0 = cx - w // 2
    for xx in range(x0, x0 + w):
        k = (xx - x0) // 4
        r = dark if k % 2 else light
        for yy in range(y, y + h):
            notch = (yy - y) in (2, 3) and (xx - x0) % 4 == 0
            c.p(xx, yy, (light if k % 2 else dark)[1] if notch else r[0 if yy == y else 1 if yy < y + h - 1 else 3])


def cresting(c, L, R, y, r, kind='trefoil'):
    """Merlons along a wall head: Mamluk trefoils, or the stepped Maghrebi
    merlon, each lit on the left and with its shadow on the right."""
    step = 8 if kind == 'trefoil' else 10
    for x in range(L + 1, R - 5, step):
        if kind == 'trefoil':
            rows = [(1, 4), (0, 5), (0, 5), (1, 4), (0, 5), (0, 5), (0, 5)]
        else:
            rows = [(3, 4), (2, 5), (2, 5), (1, 6), (1, 6), (0, 7), (0, 7)]
        for k, (a, b) in enumerate(rows):
            yy = y - len(rows) + k
            for xx in range(x + a, x + b + 1):
                c.p(xx, yy, r[0] if k == 0 or xx == x + a else r[3] if xx == x + b else r[1])


# ------------------------------------------------------------------ domes and minarets

def ground_cast(c, cx, by, R, k=0.32):
    for yy in range(by - 2, by + round(R * so.K) + 5):
        for xx in range(cx - R + 2, cx + R + 8):
            if ((xx - cx - 5) / (R + 2)) ** 2 + ((yy - by - 2) / (R * so.K + 2)) ** 2 <= 1:
                fp.shade(c, xx, yy, k)


def alem(c, cx, y, r=GILT, crescent=True):
    """A gilt finial: a rod, a ball, and a crescent on the tip."""
    c.rect(cx, y - 6, 1, 6, r[3])
    c.p(cx - 1, y - 7, r[1]); c.p(cx, y - 7, r[0]); c.p(cx, y - 8, r[2])
    if crescent:
        c.p(cx - 1, y - 11, r[1]); c.p(cx - 1, y - 10, r[1]); c.p(cx, y - 9, r[2]); c.p(cx + 1, y - 11, r[2])


def carved_dome(c, cx, by, R, drum, r, z0=0):
    """A Mamluk stone dome: a stepped zone of transition, a drum with its
    windows, and a tall dome carved in a zigzag of ribs."""
    zt = z0
    for k in (0, 1):
        so.lathe(c, cx, by, [(zt + 4 * k, R + 2 - k), (zt + 4 * k + 4, R + 2 - k)], r)
    zd = zt + 8
    so.lathe(c, cx, by, [(zd, R), (zd + drum, R)], r)
    for i in range(-2, 3):
        x = round(cx + i * R * 0.36)
        top = by - zd - drum + 3
        c.rect(x - 1, top, 3, drum - 5, GLOOM[6]); c.p(x, top - 1, GLOOM[6])
        c.p(x - 2, top, r[0])

    def carve(x, y, z, q):
        a = math.atan2(y, x) / (2 * math.pi) * 28
        zig = abs(((z - zd) / 5) % 2 - 1)
        return r[min(7, q + 1)] if (a + zig) % 1 < 0.3 else r[q]
    n = 16
    prof = []
    for i in range(n + 1):
        t = i / n
        prof.append((zd + drum + t * R * 1.3, max(0.0, R * math.cos(t * math.pi / 2) ** 0.75)))
    so.lathe(c, cx, by, prof, r, surface=carve)
    alem(c, cx, by - round(prof[-1][0]))


def lead_dome(c, cx, by, R, z0=0, drum=0, windows=0, finial=True, ribs=0):
    """A lead dome, its sheets run in courses round it, on a drum pierced
    with arched windows if it has one."""
    if drum:
        so.lathe(c, cx, by, [(z0, R + 1), (z0 + drum, R + 1)], STONE)
        for k in range(windows):
            a = math.pi * (0.15 + 0.7 * (k + 0.5) / windows)
            wx = cx - round((R + 1) * math.cos(a))
            top = by - z0 - drum + 3
            c.rect(wx - 1, top, 2, drum - 5, GLOOM[6])
            c.p(wx - 2, top + drum - 5, STONE[0])
        so.lathe(c, cx, by, [(z0 + drum, R + 2), (z0 + drum + 2, R + 2)], STONE)
    so.dome(c, cx, by, R, LEAD, z0=z0 + drum + (2 if drum else 0), kind='hemi', courses=max(3, R // 4), ribs=ribs)
    if finial:
        alem(c, cx, by - z0 - drum - (2 if drum else 0) - R, crescent=R > 14)


def pencil_minaret(c, cx, by, h, r=STONE, balconies=1):
    """An Ottoman minaret: a square base, a slender many-sided shaft, a
    balcony on a corbelled ring for each call, a tall lead cone."""
    so.box(c, cx - 7, by + 4, 14, 18, 14, r, STONE_TOP)
    base = by - 18
    zc = h * 0.82
    so.lathe(c, cx, base, [(0, 5.5), (zc, 4.8)], r, ribs=10)
    for k in range(balconies):
        z = h * (0.62 - 0.17 * (balconies - 1 - k))
        so.lathe(c, cx, base, [(z - 4, 5), (z, 8), (z + 3, 8)], r, courses=2)
        so.lathe(c, cx, base, [(z + 3, 7.5), (z + 3.5, 7.5)], r)
    so.lathe(c, cx, base, [(zc, 5.5), (zc + 2, 5.5), (h + 10, 0.4)], LEAD, courses=6)
    alem(c, cx, base - h - 10, crescent=False)


def mamluk_minaret(c, cx, by, h, light, dark=None, h1=None, w=22):
    """A Cairene minaret standing from the street: a square shaft, a
    muqarnas balcony, an octagon, a second balcony, a round stage, and the
    bulb on its columns."""
    h1 = h1 or round(h * 0.4)
    face = ablaq(light, dark, 6, 30, 3) if dark else ashlar_of(light, 7, 18)

    def shaft(c, x0, y0, w0, h0):
        face(c, x0, y0, w0, h0)
        for k in range(2):
            ly = y0 + 10 + k * 30
            if ly + 20 < y0 + h0 - 50:
                arched_light(c, x0 + w0 // 2, ly, 6, 14, light, 'pointed', 2)
    fy, ty = so.box(c, cx - w // 2, by, w, h1, w, shaft, light)
    c.rect(cx - w // 2, ty, w, fy - ty, light[1])
    b = (fy + ty) // 2 + h1
    z = h1
    r8 = w * 0.4
    for k in range(3):
        so.lathe(c, cx, b, [(z - 4 + k * 2, r8 + k * 1.2), (z - 2 + k * 2, r8 + k * 1.2 + 0.8)], light)
    so.lathe(c, cx, b, [(z + 2, r8 + 4), (z + 5, r8 + 4)], light)
    h2_ = round(h * 0.68)
    so.lathe(c, cx, b, [(z + 5, r8), (h2_, r8)], light, ribs=8)
    for k in (-1, 1):
        arched_light(c, cx + k * 3, b - h2_ + 10, 2, 10, light, 'pointed', 0)
    for k in range(2):
        so.lathe(c, cx, b, [(h2_ - 3 + k * 2, r8 - 1 + k * 1.3), (h2_ - 1 + k * 2, r8 + k * 1.3 + 0.8)], light)
    so.lathe(c, cx, b, [(h2_ + 1, r8 + 3), (h2_ + 4, r8 + 3)], light)
    h3 = round(h * 0.84)
    so.lathe(c, cx, b, [(h2_ + 4, r8 - 1.5), (h3, r8 - 1.5)], light)
    so.lathe(c, cx, b, [(h3, r8), (h3 + 2, r8)], light)
    so.lathe(c, cx, b, [(h3 + 2, r8 - 2), (h3 + 11, r8 - 2)], light)
    for k in (-3, 1):
        c.rect(cx + k, b - h3 - 10, 2, 6, GLOOM[6])
    so.lathe(c, cx, b, [(h3 + 11, r8 - 1), (h3 + 14, r8), (h3 + 17, r8 - 1), (h3 + 20, 3), (h3 + 24, 0.6)], light)
    alem(c, cx, b - h3 - 24)
    fp.cast_right(c, cx + w // 2, fy + 2, by, 5, 0.3)


def lozenge_panel(c, x, y, w, h, r):
    """Darj wa ktaf: a net of lozenges cut in the stone, lit on their upper
    left edges, in a raised frame."""
    op.raised(c, x - 2, y - 2, w + 4, h + 4, r, 1)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            u, v = (xx - x) % 8, (yy - y) % 12
            d = abs(u - 4) * 1.5 - abs(v - 6) * 1.0
            if abs(d) < 0.8:
                c.p(xx, yy, r[3])
            elif abs(d + 1.3) < 0.8:
                c.p(xx, yy, r[0])
            else:
                c.p(xx, yy, r[2] if d > 0 else r[1])


def tile_band(c, x, y, w, h, colours=(GREEN, TEAL, WHITE)):
    """A frieze of glazed tile in a little four-point star repeat."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            u, v = (xx - x) % 6, (yy - y) % h
            r = colours[((xx - x) // 6) % 2] if abs(u - 3) + abs(v - h // 2) <= 2 else colours[2]
            c.p(xx, yy, r[1] if v == 0 else r[3] if v == h - 1 else r[2])


def maghrebi_minaret(c, x, base, w, h, wall, top, tile=GREEN):
    """A square Almohad or Marinid minaret: two zones of lozenge panels round
    arched lights, a tile band under merlons, a lantern with a green tiled
    cap and three gilt balls."""
    def face(c, x0, y0, w0, h0):
        wall(c, x0, y0, w0, h0)
        pw = w0 - 10
        for k, zy in enumerate((y0 + 18, y0 + 18 + (h0 - 40) // 2)):
            ph = (h0 - 54) // 2
            lozenge_panel(c, x0 + 5, zy, pw, ph, top)
            arched_light(c, x0 + w0 // 2, zy + ph // 2 - 6, 6, 14, top, 'horseshoe', 1)
        tile_band(c, x0 + 2, y0 + 6, w0 - 4, 6, (tile, TEAL, WHITE))
    fy, ty = so.box(c, x, base, w, h, w, face, top)
    c.rect(x, ty, w, fy - ty, top[1])
    c.rect(x, ty, w, 1, top[0])
    cresting(c, x, x + w, ty + 3, top, 'stepped')
    cresting(c, x + 2, x + w - 2, fy + 1, top, 'stepped')
    lw = w // 2
    lx = x + (w - lw) // 2
    ly = (fy + ty) // 2 + 2

    def lantern(c, x0, y0, w0, h0):
        wall(c, x0, y0, w0, h0)
        arched_light(c, x0 + w0 // 2, y0 + 3, 4, h0 - 6, top, 'horseshoe', 1)
    lfy, lty = so.box(c, lx, ly, lw, 18, lw, lantern, top)
    rise = 7
    for k in range(rise + 3):
        half = max(0, lw // 2 + 1 - k * (lw // 2 + 1) // rise)
        for xx in range(lx + lw // 2 - half, lx + lw // 2 + half):
            c.p(xx, lfy - 1 - k, tile[1 if xx < lx + lw // 2 else 3] if (xx - lx) % 3 else tile[2])
    cx = lx + lw // 2
    tip = lfy - rise - 3
    c.rect(cx, tip - 18, 1, 18, GILT[3])
    for k, rr in enumerate((2.6, 2.0, 1.5)):
        y = tip - 4 - k * 5
        so.ellipse(c, cx, y, rr, rr, GILT[2]); c.p(cx - 1, y - 1, GILT[0])
    fp.cast_right(c, x + w, fy + 4, base, 5, 0.3)
    return fy, ty


def green_gable(c, cx, foot, w, rise, D, tile=GREEN, wall=WHITE):
    """One aisle's roof seen end on: its gable wall square to us, and above
    it the two slopes of green glazed tile running back D rows, the left
    slope lit, the right in shade, tiles in rows down each slope, a lit
    verge along the front and a ridge cap down the middle."""
    half = w // 2
    for i in range(-half, half + 1):
        yf = foot - rise + round(abs(i) * rise / half)
        left = i < 0
        for d in range(D):
            yy = yf - d
            # channel tiles run down the slope, so on screen across it, one every 4 rows back
            q = 2 if left else 4
            ph = (d - 2) % 4
            if ph == 0:
                q -= 1
            elif ph == 3:
                q += 1
            elif abs(i) % 7 == 6:
                q += 1
            if d < 2:
                q = 1 if left else 3
            if abs(i) < 1:
                q = 1 if d % 3 else 2
            c.p(cx + i, yy, tile[min(7, q)])
        for yy in range(yf + 1, foot):
            q = 1 if left else 2
            c.p(cx + i, yy, wall[q] if yy > yf + 2 else wall[4])
    for i in range(-half, half + 1):
        yf = foot - rise + round(abs(i) * rise / half)
        c.p(cx + i, yf, tile[0] if i < 0 else tile[2])


def tiled_hood(c, cx, y, w, tile=GREEN, wood=CEDAR):
    """A little pent roof of green tile over a gate, on carved cedar brackets."""
    for k in range(8):
        for xx in range(cx - w // 2 + 4 - k // 2, cx + w // 2 - 4 + k // 2):
            q = 2 if (xx - cx) % 4 else 4
            if k == 7:
                q = 1
            c.p(xx, y + k, tile[q])
    c.rect(cx - w // 2, y + 8, w, 2, wood[2]); c.rect(cx - w // 2, y + 10, w, 1, wood[4])
    for bx in range(cx - w // 2 + 2, cx + w // 2 - 2, 6):
        c.rect(bx, y + 11, 3, 3, wood[3]); c.p(bx, y + 11, wood[1])
    fp.cast_down(c, cx - w // 2, cx + w // 2, y + 11, 4, 0.36)


# ------------------------------------------------------------------ courts

def flags(r, size=16):
    """A court floor of big square flags in two quiet tones, as marble is
    laid: no running bond, which would read as a wall."""
    def paint(c, L, R, y0, y1):
        for yy in range(y0, y1):
            for xx in range(L, R):
                i, j = (xx - L) // size, (yy - y0) // (size // 2)
                edge = (yy - y0) % (size // 2) == size // 2 - 1
                q = 1 if (i + j) % 2 else 2
                c.p(xx, yy, r[q + 1] if edge else r[q])
    return paint


def arcade(c, L, R, top, h, wall, shape, frame, dark=None, bay=30, columns=None, crest=None):
    """A court face of arches on columns or piers: each bay a deep opening
    on the lamplit hall, its ring lit, a walk along its foot."""
    wall(c, L, top, R - L, h)
    n = max(2, round((R - L - 6) / bay))
    span = (R - L) / n
    for i in range(n):
        cx = round(L + (i + 0.5) * span)
        rw = round(span) - 8
        spring = top + 6 + shape_top(shape, rw)
        opening(c, cx, spring, rw, top + h, shape)
        voussoirs(c, cx, spring, rw, 3, shape, frame, dark)
        if columns:
            for side in (-1, 1):
                px = cx + side * (rw // 2 + 2) - 1
                if L + 2 < px < R - 3:
                    c.rect(px, spring, 3, top + h - spring, columns[1])
                    c.p(px + 2, spring, columns[3])
                    c.rect(px - 1, spring - 1, 5, 2, columns[0])
    c.rect(L, top, R - L, 1, frame[0])
    if crest:
        cresting(c, L, R, top + 1, crest, 'trefoil' if shape != 'horseshoe' else 'stepped')
    so.box(c, L, top + h + 4, R - L, 3, 8, frame)
    return n, span


def court_of(paving, centre):
    def draw(c, L, R, top, face_h, front, face=None, trees=True):
        floor = top + face_h + 4
        paving(c, L, R, floor, front)
        face(c, L, R, top, face_h)
        centre(c, (L + R) // 2, (floor + front) // 2 + 6, L, R, floor, front)
        pz.court_shade(c, L, R, top, floor, front)
    return draw


def kiosk(c, cx, by, R, roof, stone, eaves=False):
    """The ablution fountain: an octagonal basin, posts at its corners, and
    over it a small dome (Arab) or a broad lead canopy (Ottoman)."""
    H = 22
    posts = [(round(R * 0.7 * math.cos(a)), round(R * 0.7 * math.sin(a) * so.K))
             for a in (math.pi * k / 4 + math.pi / 8 for k in range(8))]

    def post(dx, dy):
        x, foot = cx + dx, by + dy - 9
        c.rect(x - 1, foot - H + 9, 1, H - 9, stone[1])
        c.rect(x, foot - H + 9, 1, H - 9, stone[3])
    for dx, dy in posts:
        if dy < 0:
            post(dx, dy)
    so.lathe(c, cx, by, [(0, R), (6, R), (7, R + 1), (9, R + 1)], stone, hollow=(R - 1, 3), fill=(7, pr.WATER),
             ribs=8)
    for k in range(5):
        c.p(cx, by - 9 - k * 2, pr.WATER[0 if k % 2 else 1])
    for dx, dy in posts:
        if dy >= 0:
            post(dx, dy)
    if eaves:
        so.lathe(c, cx, by, [(H, R + 6), (H + 2, R + 6), (H + 11, 4), (H + 13, 0.5)], roof, courses=3)
        alem(c, cx, by - H - 13, crescent=False)
    else:
        so.lathe(c, cx, by, [(H, R + 1), (H + 3, R + 1)], stone)
        so.dome(c, cx, by, R - 1, roof, z0=H + 3, kind='hemi', courses=0, ribs=12)
        alem(c, cx, by - H - 3 - R, crescent=False)


# ------------------------------------------------------------------ the Arab mosque

ARAB = {
    # Mamluk Cairo or Damascus: white limestone and black basalt.
    'ablaq': dict(light=LIME, dark=BASALT, top=LIME_TOP),
    # Mamluk Cairo's red and white courses.
    'red': dict(light=LIME, dark=RED, top=LIME_TOP),
    # Older and plainer: one warm limestone, the ablaq only at the portal.
    'plain': dict(light=SAND, dark=None, top=ramp(72, 0.04, lift=0.08)),
}


def arab_portal(c, cx, base, h, w, light, dark, top):
    """A Mamluk portal: a tall block proud of the wall and over its cresting,
    the recess under a trefoil-pointed hood of muqarnas, a joggled lintel
    over the bronze-plated door, a stone bench either side."""
    foot = base + 4
    face = ablaq(light, dark or BASALT, 6)
    fy, ty = so.box(c, cx - w // 2, foot, w, h, 8, face, top)
    c.rect(cx - w // 2, ty, w, fy - ty, top[1]); c.rect(cx - w // 2, ty, w, 1, top[0])
    cresting(c, cx - w // 2, cx + w // 2, ty + 2, top)
    rw = w - 18
    spring = fy + 12 + shape_top('pointed', rw)
    for yy in range(spring, foot):
        for xx in range(cx - rw // 2, cx + rw // 2):
            lx = xx - cx + rw // 2
            c.p(xx, yy, light[4] if lx < 4 else light[3] if lx < rw - 3 else light[2])
    muqarnas(c, cx, spring, rw, 'pointed', light)
    voussoirs(c, cx, spring, rw, 3, 'pointed', light, dark or BASALT)
    dw, dh = 22, 40
    joggled_lintel(c, cx, foot - dh - 8, dw + 8, light, dark or BASALT)
    op.door_studded(c, cx - dw // 2, foot - dh, dw, dh, wood=pz.WOOD, studs=GILT)
    for k in range(3):
        c.rect(cx - dw // 2 - 1, foot - dh + 6 + k * 12, dw + 2, 1, GILT[3])
    for side in (-1, 1):
        bx = cx - rw // 2 if side < 0 else cx + dw // 2 + 4
        so.box(c, bx, foot, rw // 2 - dw // 2 - 4, 8, 8, top)
    fp.cast_right(c, cx + w // 2, fy + 3, foot, 4, 0.32)
    return dh


def arab_mosque(spec=None, info=None):
    s = {**dict(W=288, wing=46, street=64, front=20, court=96, far=44, face=46, portal=0.62, look='ablaq',
                size='medium'), **(spec or {})}
    lk = ARAB[s['look']]
    light, dark, top = lk['light'], lk['dark'], lk['top']
    W = s['W']
    big = s['size'] != 'small'
    R = {'small': 22, 'medium': 30, 'large': 36}[s['size']]
    mh = {'small': 170, 'medium': 214, 'large': 244}[s['size']]
    wall = ablaq(light, dark, 7, 30, 3) if dark else ashlar_of(light, 8, 22)

    def face(c, L, Rr, top_, h):
        arcade(c, L, Rr, top_, h, ashlar_of(light, 8, 22), 'pointed', light, dark, bay=30, columns=MARBLE,
               crest=top)

    def centre(c, cx, cy, L, Rr, floor, front):
        kiosk(c, cx, cy + 6, 13 if big else 10, SAND, light)

    def roof(c, g):
        cx = (g['L'] + g['R']) // 2
        carved_dome(c, cx, g['B'] + 6, R, 10, SAND if light is LIME else light)
        if big:
            for x in (g['L'] + g['wing'] // 2, g['R'] - g['wing'] // 2):
                pz.dome(c, x, g['court_front'] - 18, min(11, g['wing'] // 2 - 8))

    at = {}

    def windows(c, g):
        L, R_, E, base = g['L'], g['R'], g['E'], g['base']
        cresting(c, L, R_, E + 1, top)
        for wx in (L + 46, L + 82, R_ - 72, R_ - 36):
            if abs(wx + 7 - g['pcx']) > 50 and L + 40 < wx < R_ - 20:
                for k in range(E + 8, base - 6):
                    for xx in range(wx - 4, wx + 18):
                        fp.shade(c, xx, k, 0.12 if xx > wx - 2 else 0.25)
                grille_window(c, wx, base - 40, 14, 18, top)
                arched_light(c, wx + 7, E + 14, 10, 18, top, 'pointed')

    def door(c, pcx, base, g):
        at['dh'] = arab_portal(c, pcx, base, s['street'] + 22, 58, light, dark, top)
        mamluk_minaret(c, g['L'] + 18, base, mh, light, dark, h1=s['street'] + 30, w=26)

    head = max(mh + 34 - s['street'] - s['front'] - s['court'] - s['far'], round(R * 1.3) + 40)
    with pz.materials(WALL=light, TOP=top, BRICK=dark or light, PAVE=light, WALL_FN=wall, FAIENCE=light):
        im = pz.compound(s, info, face, roof, door, head=head, windows=windows,
                         court_fn=court_of(flags(light), centre))
    if info is not None:
        info.update(door_h=at['dh'], door_width=22)
    return im


# ------------------------------------------------------------------ the Maghrebi mosque

MAGHREB = {
    'white': dict(wall=WHITE, top=WHITE_TOP, tower=WHITE, tile=GREEN),
    'ochre': dict(wall=OCHRE, top=OCHRE_TOP, tower=OCHRE, tile=GREEN),
    'pise': dict(wall=PISE, top=PISE_TOP, tower=PISE, tile=GREEN),
}


def maghrebi_mosque(spec=None, info=None):
    s = {**dict(W=288, wing=40, street=62, front=20, court=96, far=40, face=44, portal=0.5, look='white',
                size='medium'), **(spec or {})}
    lk = MAGHREB[s['look']]
    wallr, top, tile = lk['wall'], lk['top'], lk['tile']
    W = s['W']
    big = s['size'] != 'small'
    th = {'small': 150, 'medium': 196, 'large': 226}[s['size']]
    tw = {'small': 28, 'medium': 34, 'large': 38}[s['size']]
    wall = wash_of(wallr)

    def face(c, L, R, top_, h):
        arcade(c, L, R, top_, h, wall, 'horseshoe', top, bay=28)
        for yy in range(top_ + h - 7, top_ + h):
            for xx in range(L, R):
                if c.g(xx, yy)[:3] != GLOOM[5][:3] and c.g(xx, yy) not in GLOOM:
                    z = wa.ZELLIGE[((xx - L) // 3 + (yy - top_) // 3) % 4]
                    c.p(xx, yy, z[2] if (xx % 3 and yy % 3) else z[4])

    def centre(c, cx, cy, L, R, floor, front):
        pr.fountain(c, cx, cy + 4, 'basin', wa.ZELLIGE[2], R=12 if big else 9)
        if big:
            for x in (L + 18, R - 18):
                pr.tree(c, x, front - 6, 'orange', 0.75)

    def roof(c, g):
        L, R = g['L'] + 3, g['R'] - 3
        n = max(3, round((R - L) / 40)) | 1
        aw = (R - L) / n
        D = g['court_top'] - g['B'] - 12
        for i in range(n):
            cx = round(L + (i + 0.5) * aw)
            green_gable(c, cx, g['court_top'] - 1, round(aw) - 1, 14, D, tile, wallr)
        if big:
            # the raised nave to the mihrab, a ridge higher than the rest
            cx = (g['L'] + g['R']) // 2
            green_gable(c, cx, g['court_top'] - 1, round(aw) + 4, 20, D + 4, tile, wallr)
        wa.green_coping(c, g['CL'] - 3, g['court_top'] - 3, g['CR'] + 3, g['court_front'] + 3)

    at = {}

    def windows(c, g):
        wa.green_coping(c, g['L'], g['E'] - 2, g['R'], g['E'] + 1)
        for wx in (g['L'] + 56, g['L'] + 92, g['R'] - 80, g['R'] - 44):
            if abs(wx + 5 - g['pcx']) > 44 and g['L'] + 50 < wx:
                grille_window(c, wx, g['base'] - 44, 10, 12, top)

    def door(c, pcx, base, g):
        dw, dh = 28, 48
        wa.horseshoe_door(c, pcx, base, dw, dh)
        tiled_hood(c, pcx, base - dh - 30, dw + 28, tile)
        at['dh'] = dh
        mx = g['L'] + 8 if big else g['R'] - tw - 8
        maghrebi_minaret(c, mx, base, tw, th, wall, top, tile)

    head = max(th - s['street'] - s['front'] - s['court'] - s['far'] + 46, 40)
    with pz.materials(WALL=wallr, TOP=top, PAVE=ramp(150, 0.04, lift=0.0), WALL_FN=wall, BRICK=top):
        im = pz.compound(s, info, face, roof, door, head=head, windows=windows,
                         court_fn=court_of(lambda c, L, R, y0, y1: wa.paving(c, L, R, y0, y1, 'zellige'), centre))
    if info is not None:
        info.update(door_h=at['dh'], door_width=26)
    return im


# ------------------------------------------------------------------ the Ottoman mosque

OTTOMAN = {
    'ashlar': dict(wall=ashlar_of(STONE, 8, 22), arch=STONE, voussoir=None),
    'rendered': dict(wall=wash_of(WHITE), arch=STONE, voussoir=None),
    'cloisonne': dict(wall=cloisonne, arch=STONE, voussoir=BRICK),
}


def ottoman_mosque(spec=None, info=None):
    s = {**dict(W=288, wing=44, street=58, front=26, court=86, far=30, face=40, portal=0.5, look='ashlar',
                size='medium'), **(spec or {})}
    lk = OTTOMAN[s['look']]
    W = s['W']
    size = s['size']
    R = {'small': 30, 'medium': 40, 'large': 50}[size]
    mh = {'small': 118, 'medium': 146, 'large': 168}[size]
    hall_h = {'small': 26, 'medium': 32, 'large': 38}[size]
    at = {}

    def face(c, L, Rr, top_, h):
        n, span = arcade(c, L, Rr, top_, h, lk['wall'], 'pointed', STONE, lk['voussoir'], bay=34, columns=MARBLE)
        at.update(n=n, span=span, L=L)

    def centre(c, cx, cy, L, Rr, floor, front):
        kiosk(c, cx, cy + 6, 13 if size != 'small' else 10, LEAD, STONE, eaves=True)
        if size == 'large':
            for x in (L + 16, Rr - 16):
                pr.tree(c, x, front - 4, 'cypress', 0.8)

    def roof(c, g):
        cx = (g['L'] + g['R']) // 2
        hw = min(g['CR'] - g['CL'] + 24, 2 * R + 40)
        hx = cx - hw // 2
        hfy, hty = so.box(c, hx, g['court_top'], hw, hall_h, 30, lk['wall'], STONE_TOP)
        for k in range(4):
            wx = round(hx + (k + 0.5) * hw / 4)
            arched_light(c, wx, hfy + 6, 7, hall_h - 12, STONE, 'pointed', 1)
        hb = (hfy + hty) // 2 + 2
        for side in (-1, 1):
            tx = hx + 6 if side < 0 else hx + hw - 6
            so.lathe(c, tx, hty + 4, [(0, 4), (10, 4), (11, 5), (12, 5), (20, 0.5)], STONE)
            so.lathe(c, tx, hty + 4, [(12, 4.5), (20, 0.5)], LEAD)
        sr = round(R * 0.62)
        for side in (-1, 1):
            lead_dome(c, cx + side * round(R * 0.95), hb + 2, sr, z0=2, finial=False)
        lead_dome(c, cx, hb - 2, R, z0=4, drum=10, windows=9)
        lead_dome(c, cx, hfy - 3, round(R * 0.66), z0=0, finial=False)
        for side in (-1, 1):
            tx = hx + 6 if side < 0 else hx + hw - 6
            so.lathe(c, tx, hfy - 2, [(0, 4), (8, 4), (9, 5), (10, 5), (18, 0.5)], STONE)
            so.lathe(c, tx, hfy - 2, [(10, 4.5), (18, 0.5)], LEAD)
        for i in range(at['n']):
            x = round(at['L'] + (i + 0.5) * at['span'])
            if abs(x - cx) > R * 0.6 or size == 'small':
                lead_dome(c, x, g['court_top'] + 2, min(13, round(at['span']) // 2 - 3), finial=False)
        for wx in (g['L'] + g['wing'] // 2, g['R'] - g['wing'] // 2):
            for y in (g['court_top'] + 26, g['court_front'] - 16):
                if size == 'large':
                    lead_dome(c, wx, y, min(11, g['wing'] // 2 - 7), finial=False)
        sides = (-1, 1) if size != 'small' else (1,)
        for side in sides:
            mx = g['CL'] - 9 if side < 0 else g['CR'] + 9
            pencil_minaret(c, mx, g['court_front'] + 2, mh, STONE, balconies=1 if size == 'small' else 2)

    def windows(c, g):
        for wx in (g['L'] + 22, g['L'] + 60, g['R'] - 76, g['R'] - 38):
            if abs(wx + 7 - g['pcx']) > 44 and g['L'] < wx < g['R'] - 20:
                grille_window(c, wx, g['base'] - 38, 14, 16, STONE)
                arched_light(c, wx + 7, g['base'] - 58, 10, 12, STONE, 'pointed')

    def door(c, pcx, base, g):
        w = 54
        foot = base + 4
        fy, ty = so.box(c, pcx - w // 2, foot, w, s['street'] + 18, 8, ashlar_of(MARBLE, 7, 18), STONE_TOP)
        c.rect(pcx - w // 2, ty, w, fy - ty, STONE_TOP[1]); c.rect(pcx - w // 2, ty, w, 1, STONE_TOP[0])
        rw = w - 16
        spring = fy + 10 + shape_top('pointed', rw)
        for yy in range(spring, foot):
            for xx in range(pcx - rw // 2, pcx + rw // 2):
                lx = xx - pcx + rw // 2
                c.p(xx, yy, MARBLE[4] if lx < 4 else MARBLE[3])
        muqarnas(c, pcx, spring, rw, 'pointed', MARBLE)
        voussoirs(c, pcx, spring, rw, 3, 'pointed', MARBLE, lk['voussoir'])
        dw, dh = 22, 40
        op.door_studded(c, pcx - dw // 2, foot - dh, dw, dh, wood=pz.WOOD, studs=GILT)
        fp.cast_right(c, pcx + w // 2, fy + 3, foot, 4, 0.32)
        at['dh'] = dh

    head = max(mh + 30 - s['front'] - s['court'] - s['far'] - s['face'] // 2, hall_h + 2 * R + 16 - s['far'])
    with pz.materials(WALL=STONE, TOP=STONE_TOP, PAVE=MARBLE, WALL_FN=lk['wall'], BRICK=STONE, FAIENCE=STONE):
        im = pz.compound(s, info, face, roof, door, head=head, windows=windows,
                         court_fn=court_of(flags(MARBLE, 14), centre))
    if info is not None:
        info.update(door_h=at['dh'], door_width=22)
    return im


# ------------------------------------------------------------------ madrasas

def madrasa(spec=None, info=None):
    """Students' cells round a court, the teaching hall across it: the
    Ottoman medrese under rows of little lead domes with its domed classroom,
    the Mamluk madrasa with its great iwan, the Marinid madrasa with cedar
    screens over zellige and its green-tiled roofs."""
    s = {**dict(W=240, wing=40, street=58, front=18, court=88, far=26, face=50, portal=0.5, look='ottoman'),
         **(spec or {})}
    look = s['look']
    at = {}
    small = s['W'] < 180

    def cells(c, L, R, top_, h, wall, frame, shape, lights=True):
        wall(c, L, top_, R - L, h)
        n = max(2, (R - L) // 22)
        span = (R - L) / n
        for i in range(n):
            cx = round(L + (i + 0.5) * span)
            if look == 'maghrebi':
                c.rect(cx - 6, top_ + 6, 12, 14, CEDAR[3])
                op.mashrabiya(c, cx - 5, top_ + 7, 10, 12)
            else:
                arched_light(c, cx, top_ + 8, 8, 12, frame, shape, 1)
            op.door_plank(c, cx - 6, top_ + h - 22, 12, 22) if lights else None
        so.box(c, L, top_ + h + 4, R - L, 3, 8, frame)

    if look == 'ottoman':
        wall, frame, top, shape = ashlar_of(STONE, 8, 22), STONE, STONE_TOP, 'pointed'
    elif look == 'mamluk':
        wall, frame, top, shape = ablaq(LIME, BASALT, 7, 30, 3), LIME, LIME_TOP, 'pointed'
    else:
        wall, frame, top, shape = wash_of(WHITE), WHITE_TOP, WHITE_TOP, 'horseshoe'

    def face(c, L, R, top_, h):
        cx = (L + R) // 2
        iw = min(70, (R - L) // 3 + 8)
        if look == 'ottoman':
            arcade(c, L, R, top_, h, wall, 'pointed', STONE, None, bay=30, columns=MARBLE)
        else:
            cells(c, L, R, top_, h, wall if look != 'mamluk' else ashlar_of(LIME, 8, 22), frame, shape)
        if look == 'maghrebi':
            for yy in range(top_ + h - 8, top_ + h):
                for xx in range(L, R):
                    z = wa.ZELLIGE[((xx - L) // 3 + (yy - top_) // 3) % 4]
                    c.p(xx, yy, z[2] if (xx % 3 and yy % 3) else z[4])
            wa.green_coping(c, L, top_, R, top_ + 3)
        if look != 'ottoman' and not small:
            foot = top_ + h
            fy, ty = so.box(c, cx - iw // 2, foot + 3, iw, h + 16, 6, wall if look == 'mamluk' else wash_of(WHITE),
                            top)
            c.rect(cx - iw // 2, ty, iw, fy - ty, top[1])
            if look == 'mamluk':
                # the teaching iwan: a deep vault open to the court, lit on its right
                rw = iw - 20
                spring = fy + 10 + shape_top('persian', rw)
                pz.vault(c, cx, spring, rw, foot)
                voussoirs(c, cx, spring, rw, 3, 'persian', frame, BASALT)
            else:
                rw = iw - 28
                spring = fy + 12 + shape_top(shape, rw)
                opening(c, cx, spring, rw, foot, shape)
                voussoirs(c, cx, spring, rw, 3, shape, frame)
                op.door_plank(c, cx - 8, foot - 24, 16, 24)
            if look != 'mamluk':
                tile_band(c, cx - iw // 2 + 3, fy + 2, iw - 6, 5)
            at['iwan'] = (cx, ty)

    def centre(c, cx, cy, L, R, floor, front):
        if look == 'ottoman':
            kiosk(c, cx, cy + 6, 9, LEAD, STONE, eaves=True)
        elif look == 'mamluk':
            pr.fountain(c, cx, cy + 4, 'basin', LIME, R=10)
        else:
            pr.fountain(c, cx, cy + 4, 'basin', wa.ZELLIGE[2], R=10)
        if not small and look != 'ottoman':
            for x in (L + 16, R - 16):
                pr.tree(c, x, front - 6, 'orange' if look == 'maghrebi' else 'lemon', 0.7)

    def roof(c, g):
        L, R, wing = g['L'], g['R'], g['wing']
        if look == 'ottoman':
            r = min(10, wing // 2 - 7)
            for x in (L + wing // 2, R - wing // 2):
                for y in range(g['court_top'] + 18, g['court_front'] - 8, 22):
                    lead_dome(c, x, y, r, finial=False)
                    so.box(c, x + r - 2, y - r + 2, 3, 6, 3, BRICK)
            lead_dome(c, (L + R) // 2, g['B'] + 6, min(26, (g['CR'] - g['CL']) // 4), drum=8, windows=6)
        elif look == 'mamluk':
            if not small:
                carved_dome(c, R - 30, g['B'] + 16, 16, 6, SAND)
        else:
            n = max(3, round((g['CR'] - g['CL']) / 28))
            aw = (g['CR'] - g['CL']) / n
            D = g['court_top'] - g['B'] - 4
            for i in range(n):
                green_gable(c, round(g['CL'] + (i + 0.5) * aw), g['court_top'] - 1, round(aw) - 1, 10, D, GREEN,
                            WHITE)
            wa.green_coping(c, g['CL'] - 3, g['court_top'] - 3, g['CR'] + 3, g['court_front'] + 3)

    def windows(c, g):
        if look == 'mamluk':
            cresting(c, g['L'], g['R'], g['E'] + 1, LIME_TOP)
        if look == 'maghrebi':
            wa.green_coping(c, g['L'], g['E'] - 2, g['R'], g['E'] + 1)
        for wx in (g['L'] + 20, g['R'] - 34):
            if abs(wx + 7 - g['pcx']) > 40:
                grille_window(c, wx, g['base'] - 40, 12, 14, frame if look != 'maghrebi' else WHITE_TOP)

    def door(c, pcx, base, g):
        if look == 'mamluk':
            at['dh'] = arab_portal(c, pcx, base, s['street'] + 18, 52, LIME, BASALT, LIME_TOP)
        elif look == 'maghrebi':
            wa.horseshoe_door(c, pcx, base, 24, 42)
            tiled_hood(c, pcx, base - 42 - 28, 52)
            at['dh'] = 42
        else:
            w = 50
            foot = base + 4
            fy, ty = so.box(c, pcx - w // 2, foot, w, s['street'] + 14, 8, ashlar_of(MARBLE, 7, 18), STONE_TOP)
            c.rect(pcx - w // 2, ty, w, fy - ty, STONE_TOP[1])
            rw = w - 16
            spring = fy + 8 + shape_top('pointed', rw)
            for yy in range(spring, foot):
                for xx in range(pcx - rw // 2, pcx + rw // 2):
                    c.p(xx, yy, MARBLE[4] if xx - pcx + rw // 2 < 4 else MARBLE[3])
            muqarnas(c, pcx, spring, rw, 'pointed', MARBLE)
            voussoirs(c, pcx, spring, rw, 3, 'pointed', MARBLE)
            op.door_studded(c, pcx - 10, foot - 38, 20, 38, wood=pz.WOOD, studs=GILT)
            fp.cast_right(c, pcx + w // 2, fy + 3, foot, 4, 0.32)
            at['dh'] = 38

    ramps = {'ottoman': dict(WALL=STONE, TOP=STONE_TOP, PAVE=MARBLE, WALL_FN=wall, BRICK=STONE),
             'mamluk': dict(WALL=LIME, TOP=LIME_TOP, PAVE=LIME, WALL_FN=wall, BRICK=BASALT),
             'maghrebi': dict(WALL=WHITE, TOP=WHITE_TOP, PAVE=WHITE, WALL_FN=wall, BRICK=WHITE_TOP)}[look]
    paving = (lambda c, L, R, y0, y1: wa.paving(c, L, R, y0, y1, 'zellige')) if look == 'maghrebi' else \
        flags(MARBLE if look == 'ottoman' else LIME)
    head = 64 if look == 'ottoman' else 44
    with pz.materials(**ramps):
        im = pz.compound(s, info, face, roof, door, head=head, windows=windows, court_fn=court_of(paving, centre))
    if info is not None:
        info.update(door_h=at['dh'], door_width=22)
    return im


def _sized(fn):
    """A builder for the game: basalt's and cypress's deepest steps lifted
    off black, and for front_sacred's catalogue the plan's depth, so the
    footprint keeps the old frames' rows."""
    def build(spec, info):
        im = fn(spec, info)
        px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                q = px[x, y]
                if q[3] and max(q[:3]) < 14:
                    px[x, y] = GLOOM[7]
        if info is not None and 'rows' in spec:
            info['depth'] = spec['rows'] * 16
        return im
    return build


BUILDERS = {'arab-mosque': _sized(arab_mosque), 'maghrebi-mosque': _sized(maghrebi_mosque),
            'ottoman-mosque': _sized(ottoman_mosque), 'islamic-madrasa': _sized(madrasa)}

MOSQUE_LOOKS = {'arab-mosque': ('ablaq', 'red', 'plain'), 'maghrebi-mosque': ('white', 'ochre', 'pise'),
                'ottoman-mosque': ('ashlar', 'rendered', 'cloisonne')}
MADRASA_LOOKS = ('ottoman', 'mamluk', 'maghrebi')
LABELS = {'small': 'Mosque', 'medium': 'Friday mosque', 'large': 'Great mosque'}
ABOUT = ('A mosque: a gate into a court with its fountain for ablution, arcades round it, the prayer hall '
         'across the back facing Mecca, and the minaret the call to prayer is given from.')
# The old frames' footprints, widened as the Persian mosque's are (front_ancient.spec_for).
CELLS = {'small': (14, 10), 'medium': (18, 12), 'large': (22, 14)}


def mosque_spec(recipe, size, look):
    nw, fh = CELLS[size]
    return recipe, dict(W=nw * 16, look=MOSQUE_LOOKS[recipe][look % 3], size=size, court=max(80, fh * 8), rows=fh,
                        label=LABELS[size], description=ABOUT, roof='flat')


def madrasa_spec(look, nw, fh):
    W = nw * 16
    return 'islamic-madrasa', dict(W=W, look=MADRASA_LOOKS[look % 3], wing=max(34, W // 6), court=max(70, fh * 10))


SPECS = {k: {z: [mosque_spec(k, z, l) for l in range(3)] for z in CELLS} for k in MOSQUE_LOOKS}

STUDIES = [(f'{k}-{z}-{l}', *mosque_spec(k, z, l)) for k in MOSQUE_LOOKS for z in CELLS for l in range(3)] + \
          [(f'madrasa-{z}-{l}', *madrasa_spec(l, n, fh)) for z, n, fh in (('small', 9, 5), ('medium', 16, 9),
                                                                          ('large', 20, 11)) for l in range(3)]


if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    want = sys.argv[2:]
    items = [(n, k, sp) for n, k, sp in STUDIES if not want or any(w in n for w in want)]
    ims = []
    for n, k, sp in items:
        info = {}
        ims.append(BUILDERS[k](sp, info))
    a = current_adult()
    cols = 3
    rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
    W = max(sum(i.width + 8 for i in r) for r in rows) + a.width + 10
    H = sum(max(i.height for i in r) + 8 for r in rows)
    bg = Image.new('RGBA', (W, H), (122, 128, 104, 255))
    y = 0
    for r in rows:
        h = max(i.height for i in r)
        x = 4
        for im in r:
            bg.alpha_composite(im, (x, y + h - im.height)); x += im.width + 8
        bg.alpha_composite(a, (x, y + h - a.height - 4))
        y += h + 8
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-islam.png'
    bg.convert('RGB').save(out)
    print(f'wrote {out}')
