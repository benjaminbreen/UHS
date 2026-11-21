"""Havelis and neighbourhood buildings of North India, Rajputana and the
Deccan, on the Persian courtyard form, in the looks of their eras; and the
rain-country houses of Bengal and Malabar on the eave-front house.

    .venv/bin/python scripts/art/front_southasia.py artifacts/front-monsoon.png monsoon

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

import numpy as np

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
from art import front_eave as ev  # noqa: E402
from art import front_seasia  # noqa: E402,F401  (registers the bamboo-mat wall)
from art.front_house import bevel  # noqa: E402

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


def niche(c, cx, bottom, w, h, r, q=2):
    """A carved arch niche (gavaksha) in a face of tone q: the rim lit along
    its curve, the hollow a step down with the rim's shadow inside its top."""
    rx = w / 2
    sy = bottom - h + rx
    for yy in range(bottom - h, bottom):
        for xx in range(round(cx - rx), round(cx + rx)):
            dx, dy = xx + 0.5 - cx, yy + 0.5 - sy
            d = math.hypot(dx, dy) if dy < 0 else abs(dx)
            if d > rx:
                continue
            if d > rx - 1:
                k = q - 2 if dy < 0 and dx < rx * 0.4 else q - 1 if dx < 0 else q + 1
            elif d > rx - 2.2 and dy < rx * 0.2:
                k = q + 3
            else:
                k = q + 2 if dy < 0 or yy < bottom - 2 else q + 1
            c.p(xx, yy, r[max(0, min(7, k))])


def amalaka(c, cx, foot, R, r):
    """The ribbed stone cushion that crowns a spire, seen from above: a flat
    disc on top, then the ribbed girth bulging out past it and rounding under
    to the foot. Ribs are lit on their left and follow the bulge. `foot` is
    the bottom row at the front. Returns the row the finial stands on."""
    rx, ry = R * 0.7, R * 0.27
    top = foot - R * 1.2
    dc = top + ry
    mid = dc + R * 0.45
    rb, ryb = R * 0.8, R * 0.28
    bc = foot - ryb
    nr = max(10, round(R * 0.6))
    cols = {}
    for xx in range(round(cx - R), round(cx + R)):
        x = xx + 0.5 - cx
        ax = abs(x)
        if ax >= R:
            continue
        if ax < rx:
            e = math.sqrt(1 - (x / rx) ** 2)
            t0, df = dc - ry * e, dc + ry * e
        else:
            t0 = df = mid - (mid - dc) * math.sqrt(max(0.0, 1 - ((ax - rx) / (R - rx)) ** 2))
        if ax < rb:
            b0 = bc + ryb * math.sqrt(1 - (x / rb) ** 2)
        else:
            b0 = mid + (bc - mid) * math.sqrt(max(0.0, 1 - ((ax - rb) / (R - rb)) ** 2))
        cols[xx] = (x, t0, df, b0)
    mask = {(xx, yy) for xx, (x, t0, df, b0) in cols.items() for yy in range(round(t0), round(b0))}
    span = {}
    for xx, yy in mask:
        span[yy] = max(span.get(yy, 0.0), abs(xx + 0.5 - cx) + 0.5)
    for xx, (x, t0, df, b0) in cols.items():
        for yy in range(round(t0), round(b0)):
            y = yy + 0.5
            if y < df:
                e = (x / rx) ** 2 + ((y - dc) / ry) ** 2
                q = 1
                if e > 0.62 and y > dc:
                    q = 0
                elif 0.3 < e < 0.48:
                    q = 2 if y > dc else 0
                elif e > 0.8:
                    q = 2
                c.p(xx, yy, r[q])
                continue
            wy = span[yy] + 0.5

            def rib(px):
                return math.floor((math.asin(max(-1.0, min(1.0, px / wy))) / math.pi + 0.5) * nr)
            u = x / R
            t = (y - df) / max(1.0, b0 - df)
            q = 2 if u < -0.45 else 3 if u < 0.35 else 4
            if y < mid:
                q -= 1
            elif t > 0.75:
                q += 1
            if rib(x) != rib(x + 1):
                q += 2
            elif rib(x) != rib(x - 1):
                q -= 1
            c.p(xx, yy, r[max(0, min(5, q))])
    for xx, yy in mask:
        if (xx, yy - 1) not in mask or (xx, yy + 1) not in mask or (xx + 1, yy) not in mask or (xx - 1, yy) not in mask:
            c.p(xx, yy, r[4] if yy < dc else r[5])
    return round(dc)


def gold_pot(c, cx, y, s=1.0):
    """The gilt finial: a round ball, lit at its upper left, with a bud on
    it. `y` is the row it stands on. Returns the bud's top row."""
    R = 2.6 * s + 0.6
    cy = y - R
    g = fp.GOLD
    for yy in range(round(cy - R) - 1, round(cy + R) + 1):
        for xx in range(round(cx - R) - 1, round(cx + R) + 1):
            dx, dy = (xx + 0.5 - cx) / R, (yy + 0.5 - cy) / R
            d = dx * dx + dy * dy
            if d > 1:
                continue
            l = -0.6 * dx - 0.6 * dy + 0.5 * math.sqrt(1 - d)
            q = 0 if l > 0.75 else 1 if l > 0.4 else 2 if l > 0.0 else 3 if l > -0.35 else 4
            c.p(xx, yy, g[q])
    top = round(cy - R)
    c.p(cx, top - 1, g[1]); c.p(cx - 1, top, g[2]); c.p(cx, top - 2, g[2])
    return top - 2


class Latina:
    """A Nagara spire as a solid for `so.carve`: storeys stepping in up a
    bullet curve. The middle offset (bhadra) and the next (prati) rise as
    smooth columns; the corners (karna) are blocks parted by recessed
    joints, so every storey shows its top. Faces seen are kept by band so
    the niches can be drawn on them by hand."""

    def __init__(self, x, yc, z0, a, h, pitch=13, crown=0.5):
        self.x, self.yc, self.z0, self.a, self.h = x, yc, z0, a, h
        self.crown = crown
        self.n = max(4, round(h / pitch))
        self.pitch = h / self.n
        self.p = max(2.0, a * 0.07)
        self.faces = {}

    def half(self, k):
        return self.a * (1 - (1 - self.crown) * (k / self.n) ** 1.4)

    def occ(self, X, Y, Z):
        zz = Z - self.z0
        k = np.floor(zz / self.pitch)
        v = zz - k * self.pitch
        a = self.half(np.clip(k, 0, self.n))
        aa = np.where(v >= self.pitch - 2.5, a - 3.5, a)
        x, y, p = np.abs(X - self.x), np.abs(Y - self.yc), self.p
        body = (x < 0.3 * a) & (y < 0.85 * a + 2 * p)
        body |= (x < 0.64 * a) & (y < 0.85 * a + p)
        body |= (x < aa) & (y < 0.85 * aa)
        body &= (zz >= 0) & (zz < self.h)
        a1 = self.half(self.n) + 2
        cap = (zz >= self.h) & (zz < self.h + 4) & (x < a1) & (y < 0.85 * a1)
        return body | cap

    def paint(self, face, x, y, z):
        zz = z - self.z0
        if zz >= self.h:
            return (1 if x < self.x else 2) if face == 0 else 2
        k = math.floor(zz / self.pitch)
        v = zz - k * self.pitch
        a = self.half(min(k, self.n))
        u = x - self.x
        band = 'b' if abs(u) < 0.3 * a else 'p' if abs(u) < 0.64 * a else 'k'
        right = u > 0
        if face == 0:
            return 1 if u < 0.3 * a else 2
        self.faces.setdefault(band, set()).add((round(x - 0.5), round(z + so.K * y + 0.5)))
        if band == 'b':
            return 0 if u < -0.3 * a + 1 else 1
        q = 1 + 2 * right if band == 'k' else 1 + right
        if band == 'p':
            return q
        if v >= self.pitch - 2.5:
            return q + 2
        if v >= self.pitch - 4.5:
            return q - 1
        if abs(u) > a - 1.5:
            return 0 if not right else 4
        return q

    def dress(self, c, cx, base, stone):
        """The carving the solid cannot carry, drawn by hand on the faces
        `so.carve` showed: an arch niche up the bhadra on every storey, small
        niches on the prati of a big spire, then the amalaka and its gilt pot.
        Returns the pot's top as (x, y)."""
        def at(x, y, z):
            return round(cx + x), round(base - z - so.K * y)
        bk = Clip(c, cx, base, self.faces.get('b', set()))
        pk = Clip(c, cx, base, self.faces.get('p', set()))
        for k in range(self.n):
            a = self.half(k)
            z0 = self.z0 + k * self.pitch
            _, nb = at(self.x, self.yc - 0.85 * a - 2 * self.p, z0)
            niche(bk, round(cx + self.x), nb - 1, round(0.6 * a * 0.78) | 1, round(self.pitch * 0.85), stone, 1)
            if a < 30:
                continue
            _, npb = at(self.x, self.yc - 0.85 * a - self.p, z0)
            for side in (-1, 1):
                niche(pk, round(cx + self.x + side * 0.47 * a), npb - 4, 5, 7, stone, 1 if side < 0 else 2)
        R = (self.half(self.n) + 2) * 0.92
        fx, fy = at(self.x, self.yc - R * 0.35, self.h + self.z0 + 5)
        seat = amalaka(c, fx, fy, R, stone)
        return fx, gold_pot(c, fx, seat + 1, max(1.0, R / 16))

    def carve(self, c, cx, base, stone, top):
        """This spire alone, standing on `base`. Returns the pot's top."""
        a = self.a + 4
        so.carve(c, cx, base, self.x - a, self.x + a, self.yc - a, self.yc + a, self.z0 + self.h + 10,
                 lambda X, Y, Z: self.occ(X, Y, Z).astype(int),
                 lambda m, face, x, y, z: (1 if face == 0 else 0, self.paint(face, x, y, z)), [stone, top])
        return self.dress(c, cx, base, stone)


class Clip:
    """A canvas that only takes pixels on the faces given, as (x, height
    above the base) pairs: hand-drawn carving laid on a carved solid."""

    def __init__(self, c, cx, base, keep):
        self.c, self.cx, self.base, self.keep = c, cx, base, keep

    def p(self, x, y, col):
        if (x - self.cx, self.base - y) in self.keep:
            self.c.p(x, y, col)


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
        a = (g['W'] - 48) / 2
        Latina(0, 0.85 * a + 6, 0, a, 96).carve(c, cx, g['E'] + 4, s, rg['stone_top'])
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
        c, g = block(rg, W, 34, 16, head=132)
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



# ------------------------------------------------------------------ monsoon country

# Bengal: houses of mud, bamboo mat or thin brick on a raised earth plinth,
# under the chala roof, thatch or tile, whose ridge and eaves bend down at
# the ends to shed the rain; a veranda on posts across the front. Malabar:
# laterite walls under steep hipped roofs of tile, a small carved gable
# (mukhappu) at each end of the ridge, a veranda, wooden-barred windows.

LATERITE = ramp(36, 0.1, lift=-0.06)
BENGAL_BRICK = ramp(32, 0.12, lift=-0.04)
TERRACOTTA = ramp(40, 0.13, lift=-0.06)
BAMBOO_POST = ramp(70, 0.07, lift=-0.06)


def mud(c, x, y, w, h):
    fm.kahgel(c, x, y, w, h, MUD)


def laterite(c, x0, y0, w, h, r=LATERITE):
    """Laterite blocks, cut from the ground while soft: big red blocks in
    courses, pitted all over with small dark holes."""
    fm.ashlar(c, x0, y0, w, h, r, 9, 22)
    for yy in range(y0, y0 + h):
        for xx in range(x0, x0 + w):
            if fm.h2(xx, yy, 611) < 0.06:
                c.p(xx, yy, r[5])


def limed_laterite(c, x0, y0, w, h):
    fm.render(c, x0, y0, w, h, WHITE)
    for yy in range(y0 + h - 12, y0 + h):
        for xx in range(x0, x0 + w):
            c.p(xx, yy, LATERITE[3] if fm.h2(xx, yy, 612) > 0.08 else LATERITE[5])


def mud_plinth(wall_r, plinth_r=MUD):
    """Mud-plaster or limewashed rural wall over a darker beaten-earth or stone plinth."""
    def paint(c, x0, y0, w, h):
        fm.kahgel(c, x0, y0, w, h, wall_r) if wall_r is MUD else fm.render(c, x0, y0, w, h, wall_r)
        ph = min(10, max(6, h // 5))
        for yy in range(y0 + h - ph, y0 + h):
            for xx in range(x0, x0 + w):
                q = 3 if yy == y0 + h - ph else (5 if fm.h2(xx, yy, 619) < 0.14 else 4)
                c.p(xx, yy, plinth_r[q])
    return paint


ev.WALL.update({'sa-mud': mud, 'sa-brick': lambda c, x, y, w, h: fm.brick(c, x, y, w, h, BENGAL_BRICK),
                'sa-whitewash': lambda c, x, y, w, h: fm.render(c, x, y, w, h, WHITE),
                'sa-laterite': laterite, 'sa-limed-laterite': limed_laterite,
                'sa-chuna-plinth': mud_plinth(CHUNA, MUD),
                'sa-ochre-plinth': mud_plinth(PILA, MUD),
                'sa-deccan-plinth': mud_plinth(DECCAN, BASALT),
                'sa-mud-plinth': mud_plinth(MUD, ramp(46, 0.06, lift=-0.12))})
ev.TONES.update({'bengal-tile': ramp(34, 0.11, lift=-0.06), 'malabar-tile': ramp(38, 0.12, lift=-0.04),
                 'malabar-old': ramp(30, 0.07, lift=-0.14)})


def terracotta_band(c, x0, x1, y):
    """A frieze of moulded terracotta plaques set in a brick wall."""
    for xx in range(x0, x1):
        for k in range(6):
            q = 2 if k == 0 else 5 if k == 5 else 3
            if (xx - x0) % 8 in (0, 7) and 0 < k < 5:
                q = 5
            elif (xx - x0) % 8 in (3, 4) and k in (2, 3):
                q = 1
            c.p(xx, y + k, TERRACOTTA[q])


def bengal_openings(h):
    """A plank door in the middle; either side a small window of wooden bars;
    on brick, a terracotta frieze over the openings."""
    c, x0, W, top = h.c, h.x0, h.W, h.floors[0][0]
    cx = x0 + W // 2
    h.door_x, h.door_h = cx, 40
    if h.s['storeys'][0] == 'sa-brick':
        terracotta_band(c, x0, x0 + W, top + 6)
    op.door_plank(c, cx - 10, h.base - 40, 20, 40)
    for i, (ftop, fh, _) in enumerate(h.floors):
        for wx in (x0 + W // 5, x0 + W - W // 5) if W > 110 else ():
            wy = ftop + (16 if i == 0 else 10)
            op.frame_timber(c, wx - 8, wy, 16, 14, None)
            op.lattice(c, wx - 8, wy, 16, 14)
            op.reveal(c, wx - 8, wy, 16, 14, 2)
            h.sills.append((wx - 12, wy + 16, 24))


def malabar_openings(h):
    c, x0, W = h.c, h.x0, h.W
    cx = x0 + W // 2
    h.door_x, h.door_h = cx, 40
    op.door_panel(c, cx - 11, h.base - 40, 22, 40, 'oak')
    for i, (ftop, fh, _) in enumerate(h.floors):
        n = 2 if W < 180 else 4
        for k in range(n):
            wx = round(x0 + W * (k + 0.5 + (k >= n // 2)) / (n + 1))
            if i == 0 and abs(wx - cx) < 24:
                continue
            wy = ftop + (14 if i == 0 else 8)
            ww, wh = 18, min(20, fh - 22)
            op.frame_timber(c, wx - ww // 2, wy, ww, wh, None)
            op.lattice(c, wx - ww // 2, wy, ww, wh)
            op.reveal(c, wx - ww // 2, wy, ww, wh, 2)
            h.sills.append((wx - 12, wy + wh + 2, 24))


ev.OPENINGS.update({'sa-bengal': bengal_openings, 'sa-malabar': malabar_openings})


class Chala(ev.VernacularHouse):
    """The eave-front house with its roof bent: ridge and eaves curve down
    toward the ends, as Bengal roofs do; and for Malabar a hipped roof with
    a carved gable at each end of its ridge."""

    def roof(self):
        bend = self.s.get('bend', 0)
        before = self.c.im.copy() if bend else None
        super().roof()
        if self.s.get('mukhappu'):
            self.mukhappu()
        if self.s.get('kalasha'):
            cx = self.x0 + self.W // 2
            so.lathe(self.c, cx, self.top - 1, [(0, 3), (3, 4), (6, 3), (8, 1.5), (12, 0.5)], pz.BRASS)
        if not bend:
            return
        after = self.c.im.copy()
        pb, pa = before.load(), after.load()
        self.c.im.paste(before)
        L, R = self.x0 - self.over - 1, self.x0 + self.W + self.over + 1
        moved = set()
        for x in range(max(0, L), min(self.c.w, R)):
            t = (x - L + 0.5) / (R - L)
            d = round(bend * (2 * t - 1) ** 2)
            for y in range(self.c.h - 1, -1, -1):
                if pa[x, y] != pb[x, y]:
                    self.c.px[x, y + d] = pa[x, y] if y + d < self.c.h else None
                    moved.add((x, y + d))
        self.roof_px = {(x, y + round(bend * (2 * (x - L + 0.5) / (R - L) - 1) ** 2)) for x, y in self.roof_px}

    def mukhappu(self):
        """A small gable of carved boards in the hip at each end of the
        ridge, its finial on top, its lattice dark."""
        c, r = self.c, RAMPS['oak']
        ins = round(self.rise * 0.55)
        for cx in (self.x0 - self.over + ins + 6, self.x0 + self.W + self.over - ins - 6):
            for k in range(12):
                for i in range(-k // 2 - 1, k // 2 + 2):
                    edge = abs(i) >= k // 2
                    c.p(cx + i, self.top - 6 + k, r[2] if edge else (r[6] if (i + k) % 2 else r[4]))
            c.rect(cx, self.top - 10, 1, 4, r[3])


def chala(spec=None, info=None):
    s = dict(W=192, storeys=['sa-mud'], heights=[50], roof='thatch', tone='straw-old', hip=False, bend=7, saddle=0,
             gallery=True, openings='sa-bengal', seed=0, wear=0.35)
    s.update(spec or {})
    h = Chala(s)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


def nalukettu(spec=None, info=None):
    s = dict(W=192, storeys=['sa-laterite'], heights=[52], roof='plain', tone='malabar-tile', hip=True, bend=0,
             mukhappu=True, gallery=True, openings='sa-malabar', seed=0, wear=0.4)
    s.update(spec or {})
    h = Chala(s)
    h.post = TEAK
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


MONSOON = {
    # walls, roof, roof tones; a tone picks one of each
    'bengali': dict(walls=['sa-mud', 'sawali', 'sa-brick', 'sa-whitewash'], roofs=['thatch', 'thatch', 'plain'],
                    tones=['straw-old', 'reed', 'bengal-tile'], large=['sa-brick', 'sa-whitewash']),
    'malabar': dict(walls=['sa-laterite', 'sa-limed-laterite', 'sa-laterite'], roofs=['plain'],
                    tones=['malabar-tile', 'malabar-old', 'tile-brown'], large=['sa-laterite', 'sa-limed-laterite']),
}


def monsoon_house(look, spec=None, info=None):
    m = MONSOON[look]
    s = dict(spec or {})
    tone = s.pop('tone', 0)
    large = s.pop('large', False)
    walls = m['large'] if large else m['walls']
    roof_i = tone % len(m['tones'])
    roof = m['roofs'][roof_i % len(m['roofs'])] if look == 'bengali' else 'plain'
    if large and look == 'bengali':
        roof, roof_i = 'plain', 2
    s.update(storeys=[walls[tone % len(walls)]] * (2 if large else 1), roof=roof, tone=m['tones'][roof_i],
             seed=tone, rise=(48 if large else 40) if look == 'bengali' else (58 if large else 48))
    if large:
        s.setdefault('heights', [52, 44])
        if look == 'malabar':
            s['storeys'] = [s['storeys'][0], 'teak']
    return (chala if look == 'bengali' else nalukettu)(s, info)


def monsoon_service(look, kind, spec=None, info=None):
    """The small buildings of rain country, all under the region's roof."""
    s = dict(spec or {})
    tone = s.pop('tone', 0)
    m = MONSOON[look]
    W = s.get('W', 112)
    if kind == 'granary' and look == 'bengali':
        return gola(W, tone, info)
    if kind == 'shrine' and look == 'malabar':
        return sreekovil(W, tone, info)
    base = dict(W=W - 16, seed=tone, tone=m['tones'][tone % len(m['tones'])], heights=[46], rise=34)
    if look == 'bengali':
        base['roof'] = m['roofs'][tone % len(m['roofs'])]
    if kind == 'shrine':
        base.update(storeys=['sa-brick'], roof='plain', tone='bengal-tile', gallery=False, bend=9, kalasha=True)
        return chala(base, info)
    if kind in ('workshop', 'pavilion'):
        base.update(storeys=['open-' + kind], gallery=False, openings='sa-open')
        return (chala if look == 'bengali' else nalukettu)(dict(base, mukhappu=False), info)
    base.update(storeys=[m['walls'][tone % len(m['walls'])]], gallery=False)
    return (chala if look == 'bengali' else nalukettu)(dict(base, mukhappu=False), info)


def open_shed(kind):
    """An open shed: the roof on posts, the dark under it, and in it a pit
    loom or baskets of grain and spice."""
    def paint(c, x, y, w, h):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                c.p(xx, yy, (62, 46, 52, 255) if yy < y + 10 else (78, 58, 58, 255))
        base = y + h
        if kind == 'open-workshop':
            beam = base - 14
            for xx in range(x + 14, x + w - 14):
                c.p(xx, beam, TEAK[2]); c.p(xx, beam + 1, TEAK[4])
            for xx in range(x + 16, x + w - 16, 3):
                for yy in range(y + 8, beam):
                    c.p(xx + (beam - yy) // 10, yy, (232, 222, 196, 255) if yy % 3 else (206, 194, 168, 255))
        else:
            for k, xx in enumerate(range(x + 14, x + w - 10, 16)):
                pr.pot(c, xx, base - 1, 'basket', RAMPS['thatch'], fill=GRAIN[k % 3], scale=0.7)
        n = max(2, w // 40)
        for k in range(n + 1):
            px = round(x + k * (w - 5) / n)
            bevel(c, px, y, 5, h, BAMBOO_POST, 2)
    return paint


def open_openings(h):
    h.door_x, h.door_h = h.x0 + h.W // 2, 40


def rural_openings(h):
    """A rural plank door with a dark timber lintel; one small barred window on
    small cottages, two on medium farmhouses, and a clay water pot at the edge."""
    c, x0, W, top = h.c, h.x0, h.W, h.floors[0][0]
    cx = x0 + W // 2
    dw, dh = (18, 38) if W < 110 else (20, 40)
    h.door_x, h.door_h = cx, dh
    op.door_plank(c, cx - dw // 2, h.base - dh, dw, dh)
    # Timber lintel over the rural door.
    bevel(c, cx - dw // 2 - 3, h.base - dh - 4, dw + 6, 4, TEAK, 1)
    op.reveal(c, cx - dw // 2, h.base - dh, dw, dh, 2)
    wy = top + 14
    if W >= 110:
        for wx in (x0 + W // 5, x0 + W - W // 5):
            if abs(wx - cx) < 22:
                continue
            op.frame_timber(c, wx - 7, wy, 14, 12, None)
            op.lattice(c, wx - 7, wy, 14, 12)
            op.reveal(c, wx - 7, wy, 14, 12, 2)
            h.sills.append((wx - 10, wy + 14, 20))
    elif h.s.get('seed', 0) % 2 == 0 and W >= 80:
        wx = x0 + W - 20
        if abs(wx - cx) >= 18:
            op.frame_timber(c, wx - 5, wy + 2, 10, 10, None)
            op.lattice(c, wx - 5, wy + 2, 10, 10)
            op.reveal(c, wx - 5, wy + 2, 10, 10, 2)
    # A clay water pot (matka) beside the threshold.
    px = x0 + 12 if h.s.get('seed', 0) % 2 == 0 else x0 + W - 12
    if abs(px - cx) >= dw // 2 + 6:
        pr.pot(c, px, h.base - 1, 'jug', TERRACOTTA, scale=0.9)


ev.WALL.update({'open-workshop': open_shed('open-workshop'), 'open-pavilion': open_shed('open-pavilion')})
ev.OPENINGS.update({'sa-open': open_openings, 'sa-rural': rural_openings})


# Rural and modest South Asian dwellings by look: (walls, roofs, roof tones, flat_variants).
RURAL = {
    'north-indian': dict(walls=['sa-mud-plinth', 'sa-chuna-plinth', 'sa-mud-plinth'],
                         roofs=['thatch', 'plain', 'thatch'],
                         tones=['straw-old', 'bengal-tile', 'reed'], flat=(2,)),
    'early-north-indian': dict(walls=['sa-mud-plinth', 'sa-brick', 'sa-chuna-plinth'],
                               roofs=['thatch', 'thatch', 'plain'],
                               tones=['straw-old', 'reed', 'bengal-tile'], flat=()),
    'sultanate': dict(walls=['sa-chuna-plinth', 'sa-mud-plinth', 'sa-deccan-plinth'],
                      roofs=['thatch', 'plain', 'thatch'],
                      tones=['reed', 'tile-brown', 'straw-old'], flat=(2,)),
    'rajput': dict(walls=['sa-ochre-plinth', 'sa-chuna-plinth', 'sa-mud-plinth'],
                   roofs=['thatch', 'thatch', 'thatch'],
                   tones=['straw-old', 'reed', 'straw-old'], flat=(0, 1)),
    'deccan': dict(walls=['sa-deccan-plinth', 'sa-mud-plinth', 'sa-deccan-plinth'],
                   roofs=['plain', 'thatch', 'plain'],
                   tones=['tile-brown', 'straw-old', 'bengal-tile'], flat=(2,)),
    'bengali': dict(walls=['sa-mud', 'sawali', 'sa-mud-plinth'],
                    roofs=['thatch', 'thatch', 'plain'],
                    tones=['straw-old', 'reed', 'bengal-tile'], flat=(), bend=5),
    'malabar': dict(walls=['sa-laterite', 'sa-mud-plinth', 'sa-limed-laterite'],
                    roofs=['thatch', 'plain', 'plain'],
                    tones=['straw-old', 'malabar-tile', 'malabar-old'], flat=(), hip=True),
}


def flat_rural_house(look, W, medium, v, tone, info):
    """A modest single-storey flat-roofed village house (kothi / dhaba) in
    beaten earth or lime-washed mudbrick: low parapet, timber lintel door,
    small barred windows, clay pots — no courtyard, jharokha or chhatri."""
    rg = resolve(look if look in LOOKS else 'north-indian', tone)
    wall_r = MUD if (v % 3 == 0 and look != 'rajput') else (PILA if look == 'rajput' and v == 0 else rg['wall'])
    top_r = EARTH_TOP if wall_r is MUD else rg['top']
    plinth_r = BASALT if look == 'deccan' else MUD
    wall_fn_rural = (lambda c, x, y, w, h: fm.kahgel(c, x, y, w, h, wall_r)) if wall_r is MUD else (
        lambda c, x, y, w, h: fm.render(c, x, y, w, h, wall_r))
    rg_rural = dict(rg, wall=wall_r, top=top_r, stone=plinth_r)
    wall_h = 54 if medium else 48
    depth = 34 if medium else 26
    c, g = block(rg_rural, W, wall_h, depth, head=14)
    L, R, B, E, base = g['L'], g['R'], g['B'], g['E'], g['base']
    # Beaten-earth or stone plinth along the wall foot.
    ph = 8
    for yy in range(base - ph, base):
        for xx in range(L, R):
            c.p(xx, yy, plinth_r[3 if yy == base - ph else (5 if fm.h2(xx, yy, 623) < 0.14 else 4)])
    # Timber roof-beam ends (rafters) projecting just under the parapet.
    for bx in range(L + 8, R - 6, 12):
        c.rect(bx, E + 2, 3, 3, TEAK[4])
        c.p(bx, E + 2, TEAK[2])
    # Plank door with timber lintel.
    cx = (L + R) // 2 + ((-8, 0, 8)[v % 3] if medium else 0)
    dw, dh = (20, 40) if medium else (18, 38)
    op.door_plank(c, cx - dw // 2, base - dh, dw, dh)
    bevel(c, cx - dw // 2 - 3, base - dh - 4, dw + 6, 4, TEAK, 1)
    op.reveal(c, cx - dw // 2, base - dh, dw, dh, 2)
    # Small shuttered/barred windows (two on medium, one high vent or window on small).
    if medium:
        for wx in (L + 22, R - 22):
            if abs(wx - cx) < 24:
                continue
            wy = E + 16
            op.frame_timber(c, wx - 7, wy, 14, 13, None)
            op.lattice(c, wx - 7, wy, 14, 13)
            op.reveal(c, wx - 7, wy, 14, 13, 2)
    else:
        for vx in (L + 16, R - 16):
            if abs(vx - cx) < 18:
                continue
            c.rect(vx - 3, E + 12, 6, 5, DARK)
            c.rect(vx - 3, E + 11, 6, 1, TEAK[3])
    # Clay water pot at the threshold and a storage jar on the flat roof.
    px = L + 12 if cx >= (L + R) // 2 else R - 12
    if abs(px - cx) >= dw // 2 + 6:
        pr.pot(c, px, base - 1, 'jug', TERRACOTTA, scale=0.9)
    if medium:
        pr.pot(c, L + 22, B + 28, 'pithos', MUD, scale=0.6)
    if info is not None:
        info.update(x0=L, W=W, base=base, door_x=cx, door_h=dh)
    finish(c)
    consolidate(c, rare=4)
    return c.im


def rural_house(look, spec=None, info=None):
    """A modest single-storey South Asian village cottage (small) or farmhouse
    with veranda / flat mud terrace (medium)."""
    s = dict(spec or {})
    tone = s.pop('tone', 0)
    v = s.pop('v', 0)
    medium = s.pop('medium', False)
    W = s.get('W', 144 if medium else 96)
    r = RURAL[look]
    if v in r['flat']:
        return flat_rural_house(look, W, medium, v, tone, info)
    roof = r['roofs'][v % len(r['roofs'])]
    roof_tone = r['tones'][v % len(r['tones'])]
    wall = r['walls'][(v + tone) % len(r['walls'])]
    cfg = dict(
        W=W,
        storeys=[wall],
        heights=[50 if medium else 46],
        roof=roof,
        tone=roof_tone,
        hip=r.get('hip', False),
        bend=r.get('bend', 0),
        saddle=0,
        gallery=medium,
        mukhappu=False,
        openings='sa-rural',
        rise=36 if medium else 30,
        seed=tone * 7 + v,
        wear=0.35,
    )
    h = Chala(cfg)
    h.post = TEAK if look in ('deccan', 'malabar') else BAMBOO_POST
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


def gola(W, tone, info):
    """A Bengal granary (gola): a round bin of mud on a plinth, under a
    conical thatch hat, a small hatch high in its side."""
    c = C(W + 24, 132)
    cx, by = (W + 24) // 2, 126
    so.box(c, cx - 30, by, 60, 8, 20, ramp(52, 0.06, lift=-0.08))
    so.lathe(c, cx, by - 8, [(0, 22), (6, 24), (40, 24), (44, 22)], MUD, courses=8)
    c.rect(cx - 5, by - 44, 10, 10, DARK)
    so.lathe(c, cx, by - 50, [(0, 32), (4, 28), (30, 8), (40, 1)], ev.TONES[('straw-old', 'reed')[tone % 2]], courses=4)
    for k in range(3):
        c.p(cx, by - 92 - k, TEAK[2])
    if info is not None:
        info.update(x0=12, W=W, base=by, door_x=cx, door_h=36)
    finish(c)
    consolidate(c, rare=4)
    return c.im


def sreekovil(W, tone, info):
    """A Kerala shrine (sreekovil): a round laterite cella on a moulded
    plinth, under a conical tiled roof in two tiers, a copper finial."""
    c = C(W + 24, 150)
    cx, by = (W + 24) // 2, 144
    tile = ev.TONES[('malabar-tile', 'malabar-old')[tone % 2]]
    so.lathe(c, cx, by, [(0, 34), (6, 34), (7, 31), (10, 31)], LATERITE)
    so.lathe(c, cx, by - 10, [(0, 26), (34, 26)], WHITE if tone % 3 == 1 else LATERITE, courses=0)
    c.rect(cx - 7, by - 38, 14, 26, DARK)
    op.door_panel(c, cx - 6, by - 36, 12, 24, 'oak')
    so.lathe(c, cx, by - 44, [(0, 40), (3, 37), (14, 20), (16, 19)], tile, courses=4)
    so.lathe(c, cx, by - 60, [(0, 24), (3, 22), (18, 6), (22, 1)], tile, courses=3)
    so.lathe(c, cx, by - 82, [(0, 2), (3, 3), (6, 2), (10, 0.5)], pz.BRASS)
    if info is not None:
        info.update(x0=12, W=W, base=by, door_x=cx, door_h=36)
    finish(c)
    consolidate(c, rare=4)
    return c.im

HOUSE_RE = re.compile(r'southasian-house-(%s)-(small|medium)-(\d+)$'
                      % '|'.join(sorted(RURAL, key=len, reverse=True)))
MONSOON_RE = re.compile(r'southasian-(monsoon|service)-(bengali|malabar)-(small|medium|large)-(\d+)$')
LOOK_RE = re.compile(r'southasian-(courtyard|service)-(%s)-(small|medium|large)-(\d+)$'
                     % '|'.join(sorted(LOOKS, key=len, reverse=True)))


def spec_for(base, nw):
    """The builder and spec for a southasian-{house,courtyard,monsoon,service}
    frame in one of the looks drawn here, or None."""
    m = HOUSE_RE.match(base)
    if m:
        look, size, v = m.group(1), m.group(2), int(m.group(3))
        tone = v + zlib.crc32(base.encode()) % 5
        return 'sa-house', dict(look=look, W=nw * 16, medium=size == 'medium', v=v, tone=tone)
    m = MONSOON_RE.match(base)
    if m:
        family, look, size, v = m.group(1), m.group(2), m.group(3), int(m.group(4))
        tone = v + zlib.crc32(base.encode()) % 5
        if family == 'service':
            return 'sa-monsoon-service', dict(look=look, kind=SERVICES[v % 4], W=nw * 16, tone=tone)
        return 'sa-monsoon', dict(look=look, W=nw * 16, tone=tone, large=size == 'large')
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
    'sa-house': lambda s, i: rural_house(s['look'], {k: v for k, v in s.items() if k != 'look'}, i),
    'sa-monsoon': lambda s, i: monsoon_house(s['look'], {k: v for k, v in s.items() if k != 'look'}, i),
    'sa-monsoon-service': lambda s, i: monsoon_service(s['look'], s['kind'],
                                                       {k: v for k, v in s.items() if k not in ('look', 'kind')}, i),
    'sa-haveli': lambda s, i: haveli(s['look'], {k: v for k, v in s.items() if k != 'look'}, i),
    'sa-service': lambda s, i: service(s['look'], s['kind'], {k: v for k, v in s.items() if k not in ('look', 'kind')},
                                       i),
}


if __name__ == '__main__':
    from PIL import Image, ImageDraw
    from art.reference import current_adult
    medium = dict(W=208, wing=41, street=100, front=18, court=70, far=20, face=52, portal=0.36)
    mode = sys.argv[2] if len(sys.argv) > 2 else ''
    a = current_adult()
    if mode == 'ab':
        # A/B sheet: each South Asian look shows A (existing smallest residential)
        # beside B (new southasian-house small 4x3 and medium 6x4 variants).
        labeled = []
        for look in ('north-indian', 'rajput', 'deccan', 'sultanate', 'early-north-indian', 'bengali', 'malabar'):
            before = (monsoon_house(look, dict(W=192, tone=0)) if look in MONSOON
                      else haveli(look, dict(medium, v=0, tone=0)))
            smalls = [rural_house(look, dict(W=96, medium=False, v=v, tone=v)) for v in range(3)]
            meds = [rural_house(look, dict(W=144, medium=True, v=v, tone=v)) for v in range(3)]
            labeled.append((f'{look}  |  A: existing residential   ->   B: new southasian-house (3 small + 3 medium)',
                            [before, None, *smalls, *meds]))
        W = max(sum((i.width + 8 if i else 22) for i in imgs) for _, imgs in labeled) + a.width + 16
        H = sum(max(i.height for i in imgs if i) + 26 for _, imgs in labeled) + 8
        bg = Image.new('RGBA', (W, H), (196, 184, 156, 255))
        draw = ImageDraw.Draw(bg)
        y = 6
        for title, imgs in labeled:
            draw.text((8, y), title, fill=(44, 32, 42, 255))
            y += 16
            h = max(i.height for i in imgs if i)
            x = 8
            for im in imgs:
                if im is None:
                    draw.line([(x + 8, y + 4), (x + 8, y + h - 4)], fill=(120, 96, 86, 255), width=2)
                    x += 22
                    continue
                bg.alpha_composite(im, (x, y + h - im.height))
                x += im.width + 8
            bg.alpha_composite(a, (x, y + h - 4 - a.height))
            y += h + 10
        out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/southasian-house-ab.png'
        bg.convert('RGB').save(out)
        print(f'wrote {out}')
        sys.exit(0)
    rows = []
    for look, lk in LOOKS.items():
        rows.append([haveli(look, dict(medium, v=t, tone=t)) for t in range(len(lk['washes']))])
        rows.append([haveli(look, dict(tone=1))] + [service(look, k, dict(v=v, tone=v)) for v, k in enumerate(SERVICES)])
    if mode == 'monsoon':
        rows = []
        for look in MONSOON:
            rows.append([monsoon_house(look, dict(W=192, tone=t)) for t in range(4)] +
                        [monsoon_house(look, dict(W=256, tone=t, large=True)) for t in range(2)])
            rows.append([monsoon_service(look, k, dict(tone=v)) for v, k in enumerate(SERVICES)])
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
