"""Havelis and neighbourhood buildings of North India, Rajputana and the
Deccan, on the Persian courtyard form, in the looks of their eras.

    .venv/bin/python scripts/art/front_southasia.py artifacts/front-southasia.png

North Indian (Mughal Delhi and Agra, sixteenth to eighteenth century): lime
plaster over thin lakhori brick, red sandstone for plinths, gateways and the
dalan's piers; a chhajja on brackets between the storeys, jharokhas over the
gate, jali screens, cusped arches; a flat terrace with a stair head, water
jars and, on a rich house, chhatris at the street corners. The court holds a
raised platform with a tulsi plant or a small tank, and a neem.

Early North Indian (to about 1200): exposed fired brick or lime over it, a
flat stone lintel on every opening, timber balconies, no domes. Sultanate
(1200 to 1526): grey quartzite rubble or whitewash, red sandstone dressings,
the pointed arch, no jharokha. Rajput: golden sandstone ashlar (Jaisalmer),
white lime (Udaipur) or the rose wash of Jaipur, a jharokha at every upper
window, chhatris on the roof.

Each look has several colourways; a frame takes one by its `tone`.

Deccan (the Maratha wada, seventeenth and eighteenth century): basalt plinth
and gateway under lime plaster, a teak-pillared veranda round the court,
small barred windows, no jharokha.

The small buildings: a granary with clay bins on its roof, a weaver's shed
with a pit loom under its chhajja, a market pavilion of three arches, and a
shrine under a curved shikhara.
"""
from pathlib import Path
import math
import re
import sys
import zlib

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, glazes  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as pr  # noqa: E402
from art import front_persian as pz  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402

CHUNA = ramp(76, 0.045, lift=0.04)
CHUNA_TOP = ramp(74, 0.045, lift=0.04)
REDSTONE = ramp(30, 0.1, lift=-0.04)
REDSTONE_TOP = ramp(34, 0.085, lift=0.03)
GERU = ramp(30, 0.12, lift=-0.12)
DECCAN = ramp(66, 0.04, lift=0.0)
DECCAN_TOP = ramp(68, 0.04, lift=0.02)
BASALT = ramp(265, 0.018, lift=-0.24)
BASALT_TOP = ramp(265, 0.015, lift=-0.12)
TEAK = ramp(48, 0.08, lift=-0.14)
MUD = ramp(56, 0.07, lift=-0.02)
GRAIN = [ramp(85, 0.13, lift=0.02), ramp(28, 0.16, lift=-0.06), ramp(70, 0.08, lift=0.0)]
# The room behind a jali: lamplit after dark.
HOLE = [(54, 36, 48, 255), (66, 44, 52, 255)]
glazes(HOLE)
DARK = (44, 32, 42, 255)

PILA = ramp(82, 0.085, lift=0.01)
WHITE = ramp(95, 0.012, lift=0.07)
ROSE = ramp(22, 0.05, lift=0.03)
PINK = ramp(30, 0.1, lift=-0.02)
BUFF = ramp(64, 0.06, lift=0.0)
BUFF_TOP = ramp(66, 0.05, lift=0.05)
GOLDEN = ramp(74, 0.095, lift=0.0)
GOLDEN_TOP = ramp(76, 0.08, lift=0.05)
QUARTZITE = ramp(255, 0.02, lift=-0.08)
EARTH_TOP = ramp(58, 0.05, lift=0.02)

# A wash is (how the wall is laid, its ramp, the roof's ramp); a look picks
# one of its washes and one of its stones by the frame's tone.
LOOKS = {
    'early-north-indian': dict(washes=[('brick', RAMPS['brick'], EARTH_TOP), ('render', CHUNA, CHUNA_TOP),
                                       ('brick', RAMPS['roman-brick'], EARTH_TOP)],
                               stones=[(BUFF, BUFF_TOP)], arch='square', balcony='timber', chhatri=False, wood=TEAK,
                               pave=ramp(40, 0.07, lift=-0.02), domed=False),
    'sultanate': dict(washes=[('rubble', QUARTZITE, CHUNA_TOP), ('render', WHITE, CHUNA_TOP),
                              ('render', CHUNA, CHUNA_TOP)],
                      stones=[(REDSTONE, REDSTONE_TOP), (BUFF, BUFF_TOP)], arch='persian', balcony=None,
                      chhatri=False, wood=RAMPS['oak'], pave=ramp(255, 0.015, lift=-0.02), domed=True),
    'north-indian': dict(washes=[('render', CHUNA, CHUNA_TOP), ('render', PILA, CHUNA_TOP),
                                 ('render', WHITE, CHUNA_TOP), ('render', ROSE, CHUNA_TOP)],
                         stones=[(REDSTONE, REDSTONE_TOP), (REDSTONE, REDSTONE_TOP), (BUFF, BUFF_TOP)],
                         arch='cusped', balcony='dome', chhatri=True, wood=RAMPS['oak'],
                         pave=ramp(34, 0.06, lift=0.02), domed=True),
    'rajput': dict(washes=[('ashlar', GOLDEN, GOLDEN_TOP), ('render', WHITE, CHUNA_TOP),
                           ('render', PINK, ROSE), ('ashlar', GOLDEN, GOLDEN_TOP)],
                   stones=[(GOLDEN, GOLDEN_TOP)], arch='cusped', balcony='dome', every=True, chhatri=True,
                   wood=RAMPS['oak'], pave=ramp(70, 0.06, lift=0.0), domed=False),
    'deccan': dict(washes=[('render', DECCAN, DECCAN_TOP), ('render', WHITE, DECCAN_TOP),
                           ('render', PILA, DECCAN_TOP)],
                   stones=[(BASALT, BASALT_TOP)], arch='square', balcony=None, chhatri=False, wood=TEAK,
                   pave=ramp(265, 0.015, lift=-0.04), domed=False),
}
LAYS = {'render': fm.render, 'brick': fm.brick, 'rubble': fm.rubble,
        'ashlar': lambda c, x, y, w, h, r: fm.ashlar(c, x, y, w, h, r, 8, 20)}


def resolve(look, tone=0):
    """The look's fixed choices and the colourway its tone picks."""
    lk = LOOKS[look]
    lay, wall, top = lk['washes'][tone % len(lk['washes'])]
    stone, stone_top = lk['stones'][(tone // 2) % len(lk['stones'])]
    shape = {'cusped': cusped, 'persian': fp.persian, 'square': fp.square}[lk['arch']]
    return dict(lk, lay=lay, wall=wall, top=top, stone=stone, stone_top=stone_top, shape=shape,
                arched=lk['arch'] != 'square')


# ------------------------------------------------------------------ parts

def cusped(x, y, x0, spring, w):
    """The Mughal multifoil arch: five lobes round a pointed head."""
    if y >= spring:
        return x0 <= x < x0 + w
    if not fp.persian(x, y, x0, spring, w):
        return False
    r, cx, px, py = w / 2, x0 + w / 2, x + 0.5, y + 0.5
    if math.hypot(px - cx, py - spring) < r * 0.5:
        return True
    for k in range(5):
        a = math.pi * k / 4
        if math.hypot(px - cx - math.cos(a) * r * 0.6, py - spring + math.sin(a) * r * 0.6) < r * 0.42:
            return True
    return abs(px - cx) < 1 and py > spring - r * 1.2


def recess(c, cx, spring, w, bottom, r, shape=cusped):
    """An arched opening into shade: lit on the right where the sun reaches
    in, darkest under the head."""
    x0 = cx - w // 2
    for yy in range(spring - w, bottom):
        for xx in range(x0, x0 + w):
            if shape(xx, yy, x0, spring, w):
                t = (xx - x0) / w
                q = 6 if yy < spring + 4 else 5 if t < 0.6 else 4
                c.p(xx, yy, r[q])


def surround(c, cx, spring, w, bottom, r, band=3, shape=cusped):
    """A stone frame round an arch, lit on its outer edge."""
    x0 = cx - w // 2 - band
    for yy in range(spring - w - band, bottom):
        for xx in range(x0, x0 + w + 2 * band):
            if shape(xx, yy, x0, spring, w + 2 * band) and not shape(xx, yy, cx - w // 2, spring, w):
                c.p(xx, yy, r[1] if not shape(xx, yy, x0 + 1, spring, w + 2 * band - 2) else r[2])


def jali(c, x, y, w, h, r):
    """A pierced stone screen: a diamond lattice, the room dark beyond."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = xx - x, yy - y
            stone = (a + b) % 4 == 0 or (a - b) % 4 == 0
            c.p(xx, yy, (r[2] if (a + b) % 4 == 0 else r[3]) if stone else HOLE[b % 2])
    op.reveal(c, x, y, w, h, 1)


def jali_window(c, x, y, w, h, r, wall):
    """A small window of jali in a raised stone frame, its sill lit."""
    op.raised(c, x - 2, y - 2, w + 4, h + 4, r, 2)
    jali(c, x, y, w, h, r)
    c.rect(x - 3, y + h + 2, w + 6, 1, r[0])
    op.cast(c, x - 2, y + h + 3, w + 4, 2, 0.7)


def chhajja(c, x0, x1, y, r, bracket=26):
    """A chhajja: a thin stone eave sloping out from the wall on brackets.
    We see its sloping top, its lit lip, and the shadow it throws."""
    op.cast(c, x0, y + 3, x1 - x0, 7, 0.55)
    for xx in range(x0 - 3, x1 + 3):
        for k, q in enumerate((1, 1, 2, 0, 3, 5)):
            c.p(xx, y - 3 + k, r[q])
    n = max(2, (x1 - x0) // bracket)
    for i in range(n + 1):
        bx = round(x0 + 2 + i * (x1 - x0 - 6) / n)
        for k, wd in enumerate((4, 4, 3, 3, 2)):
            for j in range(wd):
                c.p(bx + j, y + 3 + k, r[2] if j == 0 else r[5] if j == wd - 1 else r[3])


def chhatri(c, cx, by, R, r, top, dome_r):
    """A chhatri: a domed kiosk on four posts, standing on the terrace."""
    for yy in range(by - 2, by + 8):
        for xx in range(cx - R, cx + R + 10):
            if ((xx - cx - 6) / (R + 4)) ** 2 + ((yy - by - 2) / 6) ** 2 <= 1:
                fp.shade(c, xx, yy, 0.3)
    so.box(c, cx - R - 2, by, 2 * R + 4, 3, 2 * R, top)
    ph = R + 8
    for yy in range(by - 3 - ph, by - 3):
        for xx in range(cx - R + 3, cx + R - 3):
            c.p(xx, yy, r[6] if yy < by - ph + 2 else r[5])
    for px in (cx - R, cx + R - 3, cx - 1):
        for yy in range(by - 3 - ph, by - 3):
            c.p(px, yy, r[1]); c.p(px + 1, yy, r[2]); c.p(px + 2, yy, r[4])
    sy = by - 3 - ph
    so.box(c, cx - R - 4, sy, 2 * R + 8, 3, 2 * R + 4, r)
    so.dome(c, cx, sy - 3 - round(R * so.K), R - 1, dome_r, kind='hemi', courses=2)
    tip = sy - 3 - round(R * so.K) - R
    for k in range(5):
        c.p(cx, tip - k, r[1] if k % 2 else r[3])


def jharokha(c, cx, sill, w, rg):
    """A jharokha: a balcony window on corbels, an arch over a low jali, a
    domed canopy, its shadow down the wall to the right. The early timber
    balcony has a lintel and a sloping board canopy instead."""
    timber = rg['balcony'] == 'timber'
    s, st = (rg['wood'], rg['wood']) if timber else (rg['stone'], rg['stone_top'])
    for k, wd in enumerate((w, w - 6, w - 12)):
        c.rect(cx - wd // 2, sill + 3 + k * 3, wd, 3, s[2 + k])
    op.cast(c, cx - w // 2, sill + 12, w, 4, 0.6)
    so.box(c, cx - w // 2 - 2, sill + 3, w + 4, 3, 6, s, st)
    h = 28
    c.rect(cx - w // 2, sill - h, w, h, s[2])
    recess(c, cx, sill - h + 12, w - 8, sill, s, shape=rg['shape'])
    jali(c, cx - w // 2 + 4, sill - 8, w - 8, 8, s)
    for px in (cx - w // 2, cx + w // 2 - 3):
        c.rect(px, sill - h, 1, h, s[1]); c.rect(px + 2, sill - h, 1, h, s[4])
    if timber:
        chhajja(c, cx - w // 2 - 2, cx + w // 2 + 2, sill - h, s, bracket=w)
        fp.cast_right(c, cx + w // 2 + 4, sill - h, sill + 12, 4, 0.3)
        return
    so.box(c, cx - w // 2 - 4, sill - h, w + 8, 3, 10, s, st)
    so.dome(c, cx, sill - h - 6, w // 2 - 2, st, kind='hemi', courses=2)
    for k in range(4):
        c.p(cx, sill - h - 6 - (w // 2 - 2) - k, s[1 if k % 2 else 3])
    fp.cast_right(c, cx + w // 2 + 4, sill - h, sill + 12, 4, 0.3)


def platform(c, x, by, w, r, top, h=6, d=8):
    so.box(c, x, by, w, h, d, r, top)


def wall_fn(rg):
    return lambda c, x, y, w, h: LAYS[rg['lay']](c, x, y, w, h, rg['wall'])


# ------------------------------------------------------------------ havelis

def street_face(rg):
    """The haveli's street wall: jali lights high in the ground storey, a
    chhajja between the storeys, the upper storey's arched windows, and over
    the gate a jharokha where the region builds them."""
    def draw(c, g):
        L, R, E, base, pcx, small = g['L'], g['R'], g['E'], g['base'], g['pcx'], g['small']
        s = rg['stone']
        upper = base - 56
        gate = 30 if not small else 20
        for x in range(L + 14, R - 24, 34):
            if abs(x + 6 - pcx) > gate + 10:
                if rg['arched']:
                    jali_window(c, x, base - 42, 12, 12, s, rg['wall'])
                elif (x - L) % 68 < 34:
                    op.raised(c, x - 2, base - 44, 16, 16, s, 2)
                    op.grille(c, x, base - 42, 12, 12)
        storey = upper - E
        for x in range(L + 18, R - 24, 40):
            if rg['balcony'] and abs(x + 8 - pcx) < 24:
                continue
            wy = upper - storey + 12
            wh = min(22, storey - 18)
            if rg.get('every'):
                continue
            if rg['arched']:
                op.raised(c, x - 2, wy - 4, 20, wh + 6, s, 2)
                recess(c, x + 8, wy + 6, 16, wy + wh, s, shape=rg['shape'])
                jali(c, x, wy + wh - 7, 16, 7, s)
            elif (x - L) % 80 < 40:
                op.raised(c, x - 2, wy - 2, 18, wh + 4, s, 2)
                op.open_shutters(c, x, wy, 14, wh, paint='green', leaf=6)
            c.rect(x - 3, wy + wh + 2, 22, 1, s[0])
        chhajja(c, L, R, upper, s)
        if not small:
            chhajja(c, L, R, E + 6, rg['top'], bracket=34)
        if rg.get('every'):
            for x in range(L + 26, R - 20, 46):
                if abs(x - pcx) > 30:
                    jharokha(c, x, upper - 8, 20, rg)
        if rg['balcony']:
            jharokha(c, pcx, upper - 8, 28 if not small else 22, rg)
    return draw


def gateway(rg):
    """The street door: a cusped arch in a stone frame proud of the wall, a
    studded door deep in it, a platform either side to sit on."""
    def draw(c, cx, base, g):
        s, st = rg['stone'], rg['stone_top']
        w = 54 if not g['small'] else 44
        h = 52 if not g['small'] else 50
        op.raised(c, cx - w // 2, base - h, w, h, s, 2)
        rw = w - 14
        spring = base - h + 12 + rw // 3
        if rg['arched']:
            surround(c, cx, spring, rw, base, s, shape=rg['shape'])
            recess(c, cx, spring, rw, base, s, shape=rg['shape'])
        else:
            c.rect(cx - rw // 2 - 3, base - h + 8, rw + 6, 4, rg['wood'][2])
            c.rect(cx - rw // 2 - 3, base - h + 12, rw + 6, 1, rg['wood'][5])
            recess(c, cx, base - h + 13, rw, base, s, shape=fp.square)
        op.door_studded(c, cx - 10, base - 36, 20, 36, wood=rg['wood'], studs=pz.BRASS)
        for side in (-1, 1):
            x = cx - w // 2 - 22 if side < 0 else cx + w // 2 + 2
            platform(c, x, base + 3, 20, s, st, h=7, d=10)
        so.box(c, cx - w // 2 + 2, base + 3, w - 4, 3, 6, st)
        fp.cast_right(c, cx + w // 2, base - h, base, 4, 0.3)
    return draw


def dalan(rg):
    """The far range across the court: a dalan of cusped arches on stone
    piers (teak posts in the Deccan) under a chhajja, the upper storey
    above it, a plinth with water pots along its foot."""
    def draw(c, L, R, top, h):
        s, st, wd = rg['stone'], rg['stone_top'], rg['wood']
        wall_fn(rg)(c, L, top, R - L, h)
        foot = top + h
        n = 3 if R - L < 150 else 5
        bay = (R - L - 8) / n
        ah = 32
        c.rect(L + 2, foot - ah, R - L - 4, ah, s[2] if rg['arched'] else wd[6])
        for i in range(n):
            cx = round(L + 4 + (i + 0.5) * bay)
            if rg['arched']:
                recess(c, cx, foot - ah + 14, round(bay) - 8, foot, s, shape=rg['shape'])
            else:
                fm.render(c, cx - round(bay) // 2 + 3, foot - ah + 3, round(bay) - 6, ah - 3, rg['wall'])
                op.cast(c, cx - round(bay) // 2 + 3, foot - ah + 3, round(bay) - 6, ah - 3, 0.45)
                op.door_plank(c, cx - 7, foot - 26, 14, 26)
        if not rg['arched']:
            for i in range(n + 1):
                px = round(L + 2 + i * bay)
                c.rect(px, foot - ah, 4, ah, wd[3]); c.rect(px, foot - ah, 1, ah, wd[1])
                c.rect(px - 2, foot - ah, 8, 3, wd[2]); c.rect(px - 2, foot - ah + 3, 8, 1, wd[5])
            c.rect(L + 2, foot - ah, R - L - 4, 3, wd[2])
        chhajja(c, L + 2, R - 2, foot - ah - 3, s if rg['arched'] else wd)
        for x in range(L + 14, R - 18, 30):
            if foot - ah - 22 > top + 2:
                jali(c, x, foot - ah - 20, 10, 9, s)
        so.box(c, L, foot + 4, R - L, 3, 8, st)
        for x in (L + 10, R - 12):
            pr.pot(c, x, foot + 2, 'pithos', pr.CLAY, scale=0.5)
    return draw


def court_of(rg, v):
    def draw(c, L, R, top, face_h, front, face=None, trees=True):
        floor = top + face_h + 4
        p = rg['pave']
        for yy in range(floor, front):
            for xx in range(L, R):
                row = (yy - floor) // 7
                j = (xx - L + (row % 2) * 9) % 18
                c.p(xx, yy, p[3] if j == 0 or (yy - floor) % 7 == 6 else p[2])
        dalan(rg)(c, L, R, top, face_h)
        cx, mid = (L + R) // 2, (floor + front) // 2 + 6
        if v % 2 == 0:
            so.box(c, cx - 9, mid + 6, 18, 8, 14, rg['stone'], rg['stone_top'])
            pr.pot(c, cx, mid - 6, 'flowerpot', rg['stone'])
            pr.shrub(c, cx, mid - 14, 5)
        else:
            so.recess(c, cx - 16, mid + 8, 32, 18, 5, rg['stone'], rg['stone'], water=pr.WATER)
            for xx in range(cx - 18, cx + 18):
                c.p(xx, mid + 8, rg['stone_top'][1])
        if trees:
            pr.tree(c, L + 18, front - 4, 'fig', 0.9, fruit=False)
        pz.court_shade(c, L, R, top, floor, front)
    return draw


def terrace(rg, v):
    """What stands on the roof: a stair head, water jars, and chhatris at the
    street corners of a rich house."""
    def draw(c, g):
        L, R, B, E, wing = g['L'], g['R'], g['B'], g['E'], g['wing']
        x = R - wing + 4
        fy, ty = so.box(c, x, B + 32, min(26, wing - 8), 20, 16, rg['wall'], rg['top'])
        c.rect(x + 7, fy + 6, 9, 14, DARK)
        fp.cast_right(c, x + min(26, wing - 8), ty, B + 32, 5, 0.3)
        for k in range(2 + v % 2):
            pr.pot(c, L + 12 + k * 9, B + 30 + (k % 2) * 3, 'pithos', pr.CLAY, scale=0.45)
        if rg['chhatri'] and not g['small']:
            for cx in (L + wing // 2, R - wing // 2):
                chhatri(c, cx, E - 8, 11, rg['stone'], rg['stone_top'], rg['top'])
    return draw


def haveli(look, spec=None, info=None):
    """A courtyard house in the look, its size from the spec's width."""
    s = {**dict(W=304, wing=58, street=112, front=24, court=96, far=26, face=60, portal=0.5, v=0, tone=0),
         **(spec or {})}
    rg = resolve(look, s['tone'])
    with pz.materials(WALL=rg['wall'], TOP=rg['top'], BRICK=rg['stone'], DOME=rg['top'], PAVE=rg['pave'],
                      WALL_FN=wall_fn(rg)):
        return pz.compound(s, info, roof=terrace(rg, s['v']), door=gateway(rg), court_fn=court_of(rg, s['v']),
                           windows=street_face(rg), head=68)


# ------------------------------------------------------------------ small buildings

def block(rg, W, wall_h, depth, head=40):
    """A flat-roofed block: the canvas, its roof behind parapets, its wall."""
    H = wall_h + depth + head
    c = C(W + 24, H)
    L, R = 12, 12 + W
    base = H - 4
    E = base - wall_h
    B = E - depth
    with pz.materials(WALL=rg['wall'], TOP=rg['top'], BRICK=rg['stone'], WALL_FN=wall_fn(rg)):
        pz.roof_slab(c, L, R, B, E)
        pz.street_wall(c, L, R, E, base)
    return c, dict(L=L, R=R, B=B, E=E, base=base, W=W)


def granary(c, g, rg):
    """Clay bins on the roof, a small door up a flight of steps."""
    L, R, B, E, base = g['L'], g['R'], g['B'], g['E'], g['base']
    for k, x in enumerate(range(L + 20, R - 14, 26)):
        so.lathe(c, x, B + 26 + (k % 2) * 4, [(0, 7), (8, 10), (18, 9), (22, 5), (24, 5.5)], MUD, courses=6,
                 hollow=(4, 20))
    dx = L + g['W'] // 3
    c.rect(dx - 8, base - 40, 16, 26, DARK)
    op.door_plank(c, dx - 7, base - 39, 14, 25)
    op.reveal(c, dx - 8, base - 40, 16, 26, 2)
    for k in range(3):
        so.box(c, dx - 12 + k * 0, base + 3 - k * 4 + 0, 24, 4, 6 - k * 2, rg['stone'], rg['stone_top'])
    for x in (R - 40, R - 24):
        for k in range(4):
            for i in range(-k, k + 1):
                c.p(x + i, base - 40 + k, DARK)
    return dx


def workshop(c, g, rg):
    """A weaver's shed open to the street: a pit loom under the chhajja, its
    warp running from the breast beam back to the far wall."""
    L, R, E, base = g['L'], g['R'], g['E'], g['base']
    wd = rg['wood']
    x0, x1, top = L + 10, R - 10, base - 40
    for yy in range(top, base - 10):
        for xx in range(x0, x1):
            c.p(xx, yy, rg['stone'][6] if yy < top + 8 else rg['stone'][5])
    beam = base - 22
    for xx in range(x0 + 10, x1 - 10):
        c.p(xx, beam, wd[2]); c.p(xx, beam + 1, wd[4])
    for xx in range(x0 + 12, x1 - 12, 3):
        for yy in range(top + 6, beam):
            c.p(xx + (beam - yy) // 10, yy, (232, 222, 196, 255) if yy % 3 else (206, 194, 168, 255))
    for xx in range(x0 + 14, x1 - 14):
        c.p(xx, beam - 12, wd[3])
    for px in (x0, (x0 + x1) // 2 - 2, x1 - 4):
        c.rect(px, top, 4, base - 10 - top, wd[3]); c.rect(px, top, 1, base - 10 - top, wd[1])
    chhajja(c, L, R, top - 3, rg['stone'])
    jali(c, (L + R) // 2 - 10, E + 8, 20, 6, rg['stone'])
    return (x0 + x1) // 2


def pavilion(c, g, rg, v):
    """A market pavilion: three cusped arches on a plinth, baskets of grain
    and spice set out under them."""
    L, R, base = g['L'], g['R'], g['base']
    s = rg['stone']
    top = base - 42
    bay = (R - L - 8) / 3
    c.rect(L + 2, top, R - L - 4, base - 10 - top, s[2])
    for i in range(3):
        cx = round(L + 4 + (i + 0.5) * bay)
        recess(c, cx, top + 16, round(bay) - 8, base - 10, s, shape=rg['shape'] if rg['arched'] else cusped)
        for k in range(2):
            pr.pot(c, cx - 6 + k * 12, base - 11, 'basket', RAMPS['thatch'], fill=GRAIN[(i + k + v) % 3], scale=0.7)
    chhajja(c, L, R, top - 3, s)
    return (L + R) // 2


def shikhara(c, cx, foot, w, h, r):
    """A curved Nagara tower over the shrine: its courses stepping in as it
    rises, lit on the left, an amalaka and a kalasha on top."""
    for yy in range(foot - h, foot):
        t = (foot - yy) / h
        hw = w / 2 * (1 - 0.55 * t ** 1.8)
        for xx in range(round(cx - hw), round(cx + hw)):
            u = (xx - cx) / hw
            q = 1 if u < -0.55 else 2 if u < 0.1 else 3 if u < 0.6 else 4
            if (foot - yy) % 6 == 0:
                q = min(7, q + 2)
            elif (foot - yy) % 6 == 1:
                q = max(0, q - 1)
            if abs(u) < 0.18:
                q = max(0, q - 1)
            elif abs(abs(u) - 0.42) < 0.06:
                q = min(7, q + 2)
            c.p(xx, yy, r[q])
    top = foot - h
    so.lathe(c, cx, top + 2, [(0, w * 0.18), (2, w * 0.24), (5, w * 0.24), (7, w * 0.16)], r, ribs=12)
    so.lathe(c, cx, top - 5, [(0, 2), (3, 4), (6, 3), (8, 1.5), (10, 1)], pz.BRASS)


def shrine(c, g, rg, tone):
    """A temple under its shikhara, or where the look builds domes and the
    tone falls so, a saint's tomb (dargah) under a dome on a drum."""
    L, R, base = g['L'], g['R'], g['base']
    cx = (L + R) // 2
    s = rg['stone']
    if rg['domed'] and tone % 2:
        R0 = g['W'] // 2 - 32
        so.dome(c, cx, g['E'] - 4, R0, rg['top'], kind='hemi', courses=0, drum=12)
        tip = g['E'] - 4 - 12 - R0 - 1
        so.lathe(c, cx, tip, [(0, 2), (3, 3), (6, 2), (9, 1)], pz.BRASS)
    else:
        shikhara(c, cx, g['E'] + 4, g['W'] - 58, 72, rg['stone_top'])
    shape = rg['shape'] if rg['arched'] else cusped
    surround(c, cx, base - 28, 20, base - 8, s, shape=shape)
    recess(c, cx, base - 28, 20, base - 8, s, shape=shape)
    for k in range(3):
        so.box(c, cx - 16 - k * 3, base + 3 - k * 3, 32 + k * 6, 3, 6, s, rg['stone_top'])
    return cx


SERVICES = ('granary', 'workshop', 'pavilion', 'shrine')


def service(look, kind, spec=None, info=None):
    """One of the small neighbourhood buildings, at the spec's width."""
    s = {**dict(W=112, v=0, tone=0), **(spec or {})}
    rg = resolve(look, s['tone'])
    W = s['W']
    if kind == 'shrine':
        c, g = block(rg, W, 34, 16, head=78)
        dx = shrine(c, g, rg, s['tone'])
    elif kind == 'pavilion':
        c, g = block(rg, W, 52, 30)
        dx = pavilion(c, g, rg, s['v'])
    elif kind == 'workshop':
        c, g = block(rg, W, 54, 30)
        dx = workshop(c, g, rg)
    else:
        c, g = block(rg, W, 50, 34, head=36)
        dx = granary(c, g, rg)
    if info is not None:
        info.update(x0=g['L'], W=W, base=g['base'], door_x=dx, door_h=36)
    finish(c)
    consolidate(c, rare=4)
    return c.im


LOOK_RE = re.compile(r'southasian-(courtyard|service)-(%s)-(small|medium|large)-(\d+)$'
                     % '|'.join(sorted(LOOKS, key=len, reverse=True)))


def spec_for(base, nw):
    """The builder and spec for a southasian-{courtyard,service} frame in one
    of the looks drawn here, or None."""
    m = LOOK_RE.match(base)
    if not m:
        return None
    family, look, size, v = m.group(1), m.group(2), m.group(3), int(m.group(4))
    W = nw * 16
    tone = v + zlib.crc32(base.encode()) % 5
    if family == 'service':
        return 'sa-service', dict(look=look, kind=SERVICES[v % 4], W=W, v=v, tone=tone)
    if size == 'medium':
        return 'sa-haveli', dict(look=look, W=W, wing=max(36, W // 5), street=100, front=18, court=70, far=20,
                                 face=52, portal=0.36 + 0.14 * (v % 2), v=v, tone=tone)
    return 'sa-haveli', dict(look=look, W=W, wing=round(W * 0.19), portal=0.5, v=v, tone=tone)


BUILDERS = {
    'sa-haveli': lambda s, i: haveli(s['look'], {k: v for k, v in s.items() if k != 'look'}, i),
    'sa-service': lambda s, i: service(s['look'], s['kind'], {k: v for k, v in s.items() if k not in ('look', 'kind')},
                                       i),
}


if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    medium = dict(W=208, wing=41, street=100, front=18, court=70, far=20, face=52, portal=0.36)
    rows = []
    for look, lk in LOOKS.items():
        rows.append([haveli(look, dict(medium, v=t, tone=t)) for t in range(len(lk['washes']))])
        rows.append([haveli(look, dict(tone=1))] + [service(look, k, dict(v=v, tone=v)) for v, k in enumerate(SERVICES)])
    a = current_adult()
    W = max(sum(i.width + 8 for i in r) for r in rows) + a.width + 10
    H = sum(max(i.height for i in r) + 8 for r in rows)
    bg = Image.new('RGBA', (W, H), (196, 184, 156, 255))
    y = 0
    for r in rows:
        h = max(i.height for i in r)
        x = 4
        for im in r:
            bg.alpha_composite(im, (x, y + h - im.height)); x += im.width + 8
        bg.alpha_composite(a, (x, y + h - 4 - a.height))
        y += h + 8
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-southasia.png'
    bg.convert('RGB').save(out)
    print(f'wrote {out}')
