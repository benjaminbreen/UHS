"""Temples of the ancient Near East, Egypt, Iran, Sri Lanka and the
platform builders of the Americas, front-on.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-ancient.png ancient

The Hittite temple of Hattusa, the niched mud-brick temple and the ziggurat
of Sumer and Babylon, the Egyptian pylon temple, the Sasanian chahar taq,
the stepped platforms of the Mississippi and the Andes, and the Sri Lankan
dagoba. The contract is front_sacred's.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_openings as op  # noqa: E402
from art.front_mudbrick import date_palm  # noqa: E402
from art.front_sacred import complete, arch_door, ground_shadow, VOID, GOLD  # noqa: E402
from art.front_kit import consolidate  # noqa: E402

K = so.K
MUD = ramp(66, 0.062, lift=0.01)
MUD_RED = ramp(44, 0.075, lift=-0.02)
PAVE = ramp(60, 0.045, lift=0.04)
BAKED = ramp(46, 0.08, lift=-0.07)
WHITE = RAMPS['whitewash']
LIME = RAMPS['limestone']
GREY = ramp(80, 0.022, lift=-0.02)
SAND = RAMPS['sandstone']
OAK = RAMPS['oak']
CEDAR = RAMPS['cedar']
LAPIS = ramp(262, 0.1, lift=-0.16)
PENNANT = ramp(26, 0.16, lift=-0.06)
PAINT_RED = ramp(30, 0.13, lift=-0.06)
PAINT_BLUE = ramp(240, 0.09, lift=-0.06)
PAINT_GOLD = ramp(76, 0.11, lift=0.0)
ANDESITE = ramp(70, 0.018, lift=-0.06)
EARTH = ramp(52, 0.06, lift=-0.1)
GRASS = ramp(128, 0.07, lift=-0.08)
ADOBE = RAMPS['adobe']
FIRE = ramp(48, 0.16, lift=0.04)
GYPSUM = ramp(85, 0.022, lift=0.04)
RUBBLE = ramp(58, 0.035, lift=-0.04)
TILE = fp.tone_for('plain', 'tile-red')


# ------------------------------------------------------------------ surfaces

def courses(r, course=4, length=10, q=3, seed=0, contrast=1):
    """Brick or block courses: the joint a step down, a brick here and there
    a step lighter or darker, never pixel noise."""
    def at(x, y, k=q):
        row = y // course
        if y % course == course - 1:
            return r[min(7, k + contrast)]
        off = (length // 2) * (row % 2)
        if (x + off) % length == 0:
            return r[min(7, k + contrast)]
        t = h2((x + off) // length, row, seed)
        return r[k - 1] if t > 0.88 else r[min(7, k + 1)] if t < 0.06 else r[k]
    return at


def plastered(r, q=3, seed=0):
    """Mud or lime plaster: one tone, a few short trowel strokes a step
    lighter or darker."""
    def at(x, y, k=q):
        t = h2((x + 3 * (y % 2)) // 4, y, seed)
        return r[k - 1] if t > 0.975 else r[min(7, k + 1)] if t < 0.02 else r[k]
    return at


def paint(c, x, y, w, h, at):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            c.p(xx, yy, at(xx, yy))


def face(r, at=None, q=3):
    """A front face painter: the texture `at`, lit down its left edge, rolled
    into shade at its right."""
    def f(c, x, y, w, h):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                col = at(xx, yy) if at else r[q]
                if xx == x:
                    col = r[q - 1]
                elif xx >= x + w - 2:
                    col = r[min(7, q + 1)]
                c.p(xx, yy, col)
    return f


def top(r, q=1, back=3):
    """A horizontal surface from above: a lit front lip, the body a step
    down, and a band of shade along its back edge."""
    def f(c, x, y, w, h):
        c.rect(x, y, w, h, r[q + 1])
        c.rect(x, y + h - 2, w, 2, r[q])
        if h > 4:
            c.rect(x, y, w, 1, r[back])
    return f


def niched(r, at, pitch=12, recess=5, q=3):
    """Mesopotamian buttresses and recesses: each recess shaded on its left
    jamb, lit on its right, a deeper slot down its middle."""
    def f(c, x, y, w, h):
        for xx in range(x, x + w):
            p = (xx - x - pitch // 2) % pitch
            for yy in range(y, y + h):
                col = at(xx, yy)
                if p < recess:
                    k = q + 1 if p > 0 else q + 3
                    if p == recess - 1:
                        k = q - 1
                    elif recess > 4 and p == recess // 2:
                        k = q + 2
                    col = r[k]
                c.p(xx, yy, col)
        c.rect(x, y, 1, h, r[q - 1])
        c.rect(x + w - 2, y, 2, h, r[q + 1])
    return f


def merlons(c, x0, x1, y, r, kind='stepped', w=10, gap=3, q=3):
    """A crest of merlons on a wall top, each seen square on with its top lit:
    stepped (Mesopotamian) or square (Hittite). They stand on the wall's
    walk, a lit strip seen from above between them."""
    c.rect(x0, y - 3, x1 - x0, 3, r[q - 1])
    c.rect(x0, y - 3, x1 - x0, 1, r[q])
    y -= 3
    n = max(1, (x1 - x0 + gap) // (w + gap))
    span = n * (w + gap) - gap
    sx = x0 + (x1 - x0 - span) // 2
    for i in range(n):
        mx = sx + i * (w + gap)
        if kind == 'stepped':
            for k, ins in enumerate((0, 2, 4)):
                yy = y - 3 * (k + 1)
                if w - 2 * ins < 2:
                    break
                c.rect(mx + ins, yy, w - 2 * ins, 3, r[q])
                c.rect(mx + ins, yy, w - 2 * ins, 1, r[q - 2])
                c.rect(mx + w - ins - 1, yy + 1, 1, 2, r[q + 1])
        else:
            c.rect(mx, y - 7, w, 7, r[q])
            c.rect(mx, y - 7, w, 2, r[q - 2])
            c.rect(mx + w - 1, y - 5, 1, 5, r[q + 1])


def socle(c, x0, x1, base, h, r, q=4):
    """A footing of burnt brick or stone a step darker than the wall, its top
    course lit."""
    at = courses(r, 3, 8, q, 7)
    paint(c, x0, base - h, x1 - x0, h, at)
    c.rect(x0, base - h, x1 - x0, 1, r[q - 2])


def coping(c, x0, x1, y, r, d=4):
    """A wall's top seen from above: lit, with its front arris."""
    c.rect(x0, y - d, x1 - x0, d, r[1])
    c.rect(x0, y - d, x1 - x0, 1, r[2])
    c.rect(x0, y - 1, x1 - x0, 1, r[0])


def deck(c, x0, x1, y, d, r, parapet=3):
    """A flat roof from above: a lit parapet round it, the deck a step
    darker, shade under the back and left parapets."""
    t = y - d
    c.rect(x0, t, x1 - x0, d, r[2])
    c.rect(x0 + parapet, t + parapet, x1 - x0 - 2 * parapet, d - 2 * parapet, r[3])
    c.rect(x0 + parapet, t + parapet, x1 - x0 - 2 * parapet, 2, r[4])
    c.rect(x0 + parapet, t + parapet, 2, d - 2 * parapet, r[4])
    c.rect(x0, y - 2, x1 - x0, 2, r[1])
    c.rect(x0, t, x1 - x0, 1, r[1])
    return t


def court(c, x0, x1, y, d, r, flag_w=10, flag_h=3, seed=0):
    """A paved court from above: flags in courses, shade thrown back onto it
    by the wall in front and right by the wall on its left."""
    t = y - d
    for yy in range(t, y):
        row = (yy - t) // flag_h
        for xx in range(x0, x1):
            j = (xx - x0 + (row % 2) * (flag_w // 2)) % flag_w
            q = 2 if h2((xx - x0 + (row % 2) * (flag_w // 2)) // flag_w, row, seed) > 0.25 else 3
            if (yy - t) % flag_h == flag_h - 1 or j == 0:
                q = 3 if q == 2 else 4
            c.p(xx, yy, r[q])
    for k in range(3):
        for xx in range(x0, x1):
            fp.shade(c, xx, y - 1 - k, 0.3 - k * 0.1)
        for yy in range(t, y):
            fp.shade(c, x0 + k, yy, 0.3 - k * 0.1)
    return t


def door(c, cx, base, w, h, frame, wood=CEDAR, leaf=True, studs=False):
    """A tall door in a deep reveal under a lintel, its leaves in boards."""
    x0 = cx - w // 2
    c.rect(x0 - 3, base - h - 4, w + 6, 4, frame[1])
    c.rect(x0 - 3, base - h - 4, w + 6, 1, frame[0])
    c.rect(x0 - 3, base - h - 1, w + 6, 1, frame[4])
    for yy in range(base - h, base):
        for xx in range(x0, x0 + w):
            lx = xx - x0
            if not leaf:
                col = VOID
            else:
                col = wood[3] if lx % 5 else wood[4]
                if lx in (w // 2 - 1, w // 2):
                    col = wood[5]
                if studs and (yy - base + h) % 9 == 4 and lx % 5 == 2:
                    col = GOLD[2]
            c.p(xx, yy, col)
    op.reveal(c, x0, base - h, w, h, 3)


# ------------------------------------------------------------------ terraces and stairs

def flight(c, cx, foot, head, w, r, cheek=None, cheek_w=4, rise=4):
    """A straight stair seen square on climbing away from us: each tread a
    lit band, each riser a step darker, between cheek walls whose tops are lit.
    Shade falls off the right cheek onto what lies beside it."""
    x0 = cx - w // 2
    y = foot
    while y > head:
        h = min(rise, y - head)
        c.rect(x0, y - h, w, h, r[3])
        c.rect(x0, y - h, w, 1, r[1])
        if h > 2:
            c.rect(x0, y - h + 1, w, 1, r[2])
        c.rect(x0, y - 1, w, 1, r[4])
        y -= h
    if cheek:
        for xx, side in ((x0 - cheek_w, -1), (x0 + w, 1)):
            for yy in range(head - 2, foot):
                for i in range(cheek_w):
                    q = 1 if i == 0 else 2 if side < 0 or i < cheek_w - 1 else 4
                    c.p(xx + i, yy, cheek[q])
            c.rect(xx, head - 2, cheek_w, 2, cheek[0])
        fp.cast_right(c, x0 + w + cheek_w, head, foot, 3, 0.3)
    return x0


# ------------------------------------------------------------------ Mesopotamia

MESO_LOOKS = {
    # sun-dried brick under mud plaster; burnt brick laid in bitumen; the
    # gypsum-whitewashed temple of Uruk
    'plaster': dict(r=MUD, at=lambda r, s: plastered(r, 3, s), q=3),
    'baked': dict(r=BAKED, at=lambda r, s: courses(r, 3, 8, 3, s), q=3),
    'white': dict(r=WHITE, at=lambda r, s: plastered(r, 2, s), q=2),
}


def side_stair(c, x_foot, base, head, r, side, q=3, rise=3, run=4, w=12):
    """A stair climbing the face sideways from its foot toward the middle:
    a solid flight against the wall, its treads lit, a parapet along it."""
    n = (base - head) // rise
    for k in range(n + 1):
        for i in range(run):
            xx = x_foot + side * (k * run + i)
            ty = base - k * rise - rise
            c.rect(xx, ty, 1, base - ty, r[q])
            c.p(xx, ty, r[q - 2])
            c.p(xx, ty + 1, r[q - 1])
            c.rect(xx, ty - 4, 1, 3, r[q - 1] if side > 0 else r[q])
            c.p(xx, ty - 4, r[q - 2])


def ziggurat(c, cx, base, W, r, at, q, seed):
    """Three niched terraces, a stair straight up the middle with two more
    climbing the face to meet it at a gatehouse, and the high shrine."""
    widths = [W, round(W * 0.7), round(W * 0.44)]
    rise = [36, 26, 20]
    sb = 30
    y = base
    rows = []
    for k in range(3):
        rows.append((y - rise[k], y))
        y -= rise[k] + round(sb * K)
    for k in (2, 1, 0):
        w = widths[k]
        ft, fb = rows[k]
        tt = ft - round(sb * K)
        top(r, q - 2)(c, cx - w // 2, tt, w, ft - tt)
        niched(r, at, 14, 5, q)(c, cx - w // 2, ft, w, fb - ft)
        c.rect(cx - w // 2, ft, w, 1, r[q - 2])
        for xx in range(cx - w // 2, cx + w // 2):
            fp.shade(c, xx, fb, 0.25)
        if k == 2:
            sw, sh = round(w * 0.56), 22
            sb_ = tt + round(sb * K * 0.7)
            fy, ty = so.box(c, cx - sw // 2, sb_, sw, sh, 12, niched(r, at, 8, 3, q), top(r, q - 2))
            merlons(c, cx - sw // 2, cx + sw // 2, ty + 2, r, w=6, gap=2, q=q)
            door(c, cx, sb_, 8, 14, r, leaf=False)
            c.rect(cx - 3, sb_ - 20, 6, 2, LAPIS[2])
    flight(c, cx, base, rows[2][1] + 1, 18, r, r, 4)
    for sd in (-1, 1):
        side_stair(c, cx + sd * (W // 2 - 8), base, rows[0][0] + 2, r, -sd, q)
    gy = rows[0][0]
    so.box(c, cx - 17, gy + 3, 34, 14, 10, face(r, at, q), top(r, q - 2))
    door(c, cx, gy + 3, 10, 11, r, leaf=False)
    return rows


def mesopotamian(spec=None, info=None):
    s = {**dict(size='medium', look='plaster', W=256, seed=3), **(spec or {})}
    size, W = s['size'], s['W']
    L = MESO_LOOKS[s['look']]
    r, q = L['r'], L['q']
    at = L['at'](r, s['seed'])
    big = size == 'large'
    EH = {'small': 40, 'medium': 44, 'large': 46}[size]
    cd = {'small': 34, 'medium': 44, 'large': 40}[size]
    TH = {'small': 46, 'medium': 56, 'large': 0}[size]
    H = EH + cd + (TH + 40 if not big else 160) + 16
    c = C(W + 24, H)
    x0, base = 12, H - 4
    cx = x0 + W // 2
    wall_top = base - EH
    ct = wall_top - cd
    side = 8
    court(c, x0 + side, x0 + W - side, wall_top - 4, cd - 4, PAVE, 12, 4, s['seed'])
    for sx in (x0, x0 + W - side):
        c.rect(sx, ct, side, cd, r[q - 2]); c.rect(sx, ct, side, 1, r[q - 1])
        c.rect(sx + side - 1, ct, 1, cd, r[q - 1])
    if big:
        ziggurat(c, cx, ct + 14, round(W * 0.66), r, at, q, s['seed'])
    else:
        TW = round(W * (0.6 if size == 'medium' else 0.7))
        tb = ct + 10
        fy, ty = so.box(c, cx - TW // 2, tb, TW, TH, 30, niched(r, at, 12, 4, q),
                        lambda c, x, y, w, h: deck(c, x, x + w, y + h, h, r))
        merlons(c, cx - TW // 2, cx + TW // 2, ty + 3, r, w=8, gap=2, q=q)
        socle(c, cx - TW // 2, cx + TW // 2, tb, 6, BAKED if s['look'] != 'baked' else BAKED, 4)
        gw = 36
        fy, ty = so.box(c, cx - gw // 2, tb, gw, TH + 10, 8, niched(r, at, 9, 3, q), top(r, q - 2))
        merlons(c, cx - gw // 2, cx + gw // 2, ty + 2, r, w=6, gap=2, q=q)
        # the door stepped back in three reveals, a glazed plaque over it
        for k, ins in enumerate((0, 3, 6)):
            c.rect(cx - 11 + ins, tb - 36 + ins, 22 - 2 * ins, 36 - ins, r[q + 1 + k])
            c.rect(cx - 11 + ins, tb - 36 + ins, 1, 36 - ins, r[q + 2 + k])
        door(c, cx, tb, 10, 28, r, leaf=False)
        c.rect(cx - 4, tb - 34, 8, 3, LAPIS[2]); c.rect(cx - 4, tb - 34, 8, 1, LAPIS[1])
    for px in (x0 + W // 7 + 4, x0 + W - W // 7 - 4):
        date_palm(c, px, wall_top - 10, 46 if not big else 52)
    niched(r, at, 14, 5, q)(c, x0, wall_top, W, EH)
    socle(c, x0, x0 + W, base, 8, BAKED, 4 if s['look'] != 'baked' else 5)
    c.rect(x0, wall_top, W, 1, r[q - 2])
    merlons(c, x0, x0 + W, wall_top, r, w=12, gap=2, q=q)
    fp.cast_down(c, x0, x0 + W, wall_top + 1, 2, 0.25)
    tw, gw = 26, 24
    for sd in (-1, 1):
        tx = cx + sd * (gw // 2 + tw // 2) - tw // 2
        fy, ty = so.box(c, tx, base, tw, EH + 20, 12, niched(r, at, 9, 3, q), top(r, q - 2))
        merlons(c, tx, tx + tw, ty + 1, r, w=6, gap=4, q=q)
        socle(c, tx, tx + tw, base, 8, BAKED, 4 if s['look'] != 'baked' else 5)
    so.box(c, cx - gw // 2, base, gw, EH + 8, 12, face(r, at, q), top(r, q - 2))
    door(c, cx, base, gw - 6, 40, r, studs=True)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 40, 2 * (cd + EH) + 40, roof='flat')


# ------------------------------------------------------------------ the Hittites

def cyclopean(r, q=3, seed=0):
    """Big polygonal blocks fitted without mortar, as in the socles of
    Hattusa: each block lit along its top and left, its joints slanting."""
    def f(c, x0, y0, w, h):
        y, i = y0, 0
        while y < y0 + h:
            rh = 8 + int(h2(i, 3, seed) * 4)
            joints, x, j = [], x0 - int(h2(i, 4, seed) * 14), 0
            while x < x0 + w + 30:
                joints.append((x, (h2(i, j, seed + 1) - 0.5) * 0.9))
                x += 14 + int(h2(i, j, seed + 2) * 14)
                j += 1
            for yy in range(y, min(y0 + h, y + rh)):
                ly = yy - y
                edges = [round(jx + sl * ly) for jx, sl in joints]
                k = 0
                for xx in range(x0, x0 + w):
                    while k + 1 < len(edges) and edges[k + 1] <= xx:
                        k += 1
                    lx = xx - edges[k]
                    t = h2(i, k, seed + 3)
                    b = q if t < 0.6 else q - 1 if t < 0.8 else q + 1
                    if lx == 0 or ly == rh - 1:
                        col = r[min(7, q + 3)]
                    elif ly == 0:
                        col = r[b - 2]
                    elif ly == 1 or lx == 1:
                        col = r[b - 1]
                    elif ly == rh - 2 or (k + 1 < len(edges) and edges[k + 1] - xx == 1):
                        col = r[b + 1]
                    else:
                        col = r[b]
                    c.p(xx, yy, col)
            y += rh
            i += 1
    return f


def parabola(x, y, x0, top, w, spring):
    if not x0 <= x < x0 + w:
        return False
    if y >= spring:
        return True
    u = (x + 0.5 - x0 - w / 2) / (w / 2)
    return y >= top + (spring - top) * u * u


def timber_band(c, x0, x1, y, h=3):
    c.rect(x0, y, x1 - x0, h, OAK[3])
    c.rect(x0, y, x1 - x0, 1, OAK[1])
    for xx in range(x0 + 6, x1, 18):
        c.rect(xx, y, 2, h, OAK[4])
    fp.cast_down(c, x0, x1, y + h, 2, 0.28)


def hittite_window(c, cx, top, w, h, frame):
    """A wide window low in the wall, framed in timber, a wooden grille
    in it."""
    x0 = cx - w // 2
    c.rect(x0 - 2, top - 2, w + 4, h + 4, OAK[2])
    c.rect(x0 - 2, top - 2, w + 4, 1, OAK[1])
    for yy in range(top, top + h):
        for xx in range(x0, x0 + w):
            c.p(xx, yy, VOID if (xx - x0) % 4 and (yy - top) % 5 else OAK[4])
    op.reveal(c, x0, top, w, h, 2)
    c.rect(x0 - 3, top + h + 2, w + 6, 2, frame[1])


LION = ["..####..",
        ".######.",
        "##.##.##",
        "########",
        ".######.",
        ".#.##.#.",
        "..####..",
        "...##..."]


def lion(c, x, y, r, flip=False):
    """A lion's forepart carved out of a gate jamb."""
    for j, row in enumerate(LION):
        for i, ch in enumerate(row):
            xx = x + (7 - i if flip else i)
            if ch == '#':
                c.p(xx, y + j, r[1 if j < 2 else 2 if i < 4 else 3])
            elif 1 < j < 6 and 0 < i < 7:
                c.p(xx, y + j, r[5])


HITTITE_LOOKS = {
    'red': dict(wall=MUD_RED, stone=LIME, q=3),
    'buff': dict(wall=MUD, stone=GREY, q=3),
    'pale': dict(wall=WHITE, stone=SAND, q=2),
}


def hittite(spec=None, info=None):
    s = {**dict(size='medium', look='red', W=288, seed=5), **(spec or {})}
    size, W = s['size'], s['W']
    L = HITTITE_LOOKS[s['look']]
    r, st, q = L['wall'], L['stone'], L['q']
    at = plastered(r, q, s['seed'])
    wf = face(r, at, q)
    roof = lambda c, x, y, w, h: deck(c, x, x + w, y + h, h, r)  # noqa: E731
    EH = {'small': 46, 'medium': 50, 'large': 54}[size]
    cd = {'small': 34, 'medium': 44, 'large': 50}[size]
    CH = {'small': 52, 'medium': 62, 'large': 70}[size]
    sh = 16
    H = EH + cd + CH + 60
    c = C(W + 24, H)
    x0, base = 12, H - 4
    cx = x0 + W // 2
    wall_top = base - EH
    ct = wall_top - cd
    side = 8
    court(c, x0 + side, x0 + W - side, wall_top - 6, cd - 6, st, 14, 4, s['seed'])
    for sx in (x0, x0 + W - side):
        c.rect(sx, ct, side, cd, r[q - 2]); c.rect(sx + side - 1, ct, 1, cd, r[q - 1])
    # the god's house, to the right of the court as at the Great Temple,
    # its tall windows low in the wall
    CW = round(W * 0.5)
    ccx = cx + round(W * 0.12)
    cb = ct + 14
    fy, ty = so.box(c, ccx - CW // 2, cb, CW, CH, 34, wf, roof)
    cyclopean(st, 3, s['seed'])(c, ccx - CW // 2, cb - sh, CW, sh)
    timber_band(c, ccx - CW // 2, ccx + CW // 2, cb - sh - 3)
    timber_band(c, ccx - CW // 2, ccx + CW // 2, fy + 8)
    merlons(c, ccx - CW // 2, ccx + CW // 2, ty + 3, r, 'square', 8, 4, q)
    nwin = 3 if size != 'small' else 2
    for k in range(nwin):
        hittite_window(c, round(ccx - CW // 2 + (k + 0.5) * CW / nwin), fy + 16, 14, 18, st)
    # the pillared hall across the back of the court
    PW = round(W * 0.56)
    pcx = cx - round(W * 0.16)
    pb = ct + 18
    ph = 36
    py = pb - ph
    deck(c, pcx - PW // 2, pcx + PW // 2, py, 16, r)
    c.rect(pcx - PW // 2, py, PW, ph, mix(VOID, r[6], 0.5))
    c.rect(pcx - PW // 2, py, PW, 4, OAK[2]); c.rect(pcx - PW // 2, py, PW, 1, OAK[1])
    c.rect(pcx - PW // 2, py + 4, PW, 3, VOID)
    n = max(4, PW // 22)
    for k in range(n):
        px = round(pcx - PW // 2 + 4 + k * (PW - 12) / (n - 1))
        c.rect(px, py + 4, 7, ph - 6, st[2]); c.rect(px, py + 4, 2, ph - 6, st[1])
        c.rect(px + 6, py + 4, 1, ph - 6, st[4])
        c.rect(px - 1, pb - 3, 9, 3, st[1]); c.rect(px - 1, pb - 1, 9, 1, st[3])
    fp.cast_down(c, pcx - PW // 2, pcx + PW // 2, py + 4, 3, 0.35)
    # the front range of storerooms on its stone socle
    wf(c, x0, wall_top, W, EH)
    cyclopean(st, 3, s['seed'] + 1)(c, x0, base - sh, W, sh)
    timber_band(c, x0, x0 + W, base - sh - 3)
    timber_band(c, x0, x0 + W, wall_top + 6)
    merlons(c, x0, x0 + W, wall_top, r, 'square', 9, 3, q)
    nw = 6 if size != 'small' else 4
    for k in range(nw):
        wx = round(x0 + 20 + k * (W - 40) / (nw - 1))
        if abs(wx - cx) > 40:
            c.rect(wx - 4, wall_top + 16, 8, 8, VOID)
            c.rect(wx - 5, wall_top + 15, 10, 1, OAK[2]); c.rect(wx - 5, wall_top + 24, 10, 2, OAK[3])
    # the gatehouse, standing forward, its parabolic arch on monolith jambs
    gw = 56
    fy, ty = so.box(c, cx - gw // 2, base, gw, EH + 20, 16, wf, roof)
    cyclopean(st, 3, s['seed'] + 2)(c, cx - gw // 2, base - sh - 6, gw, sh + 6)
    timber_band(c, cx - gw // 2, cx + gw // 2, fy + 6)
    merlons(c, cx - gw // 2, cx + gw // 2, ty + 3, r, 'square', 8, 4, q)
    aw, ah = 26, 46
    ax = cx - aw // 2
    for yy in range(base - ah - 6, base):
        for xx in range(ax - 6, ax + aw + 6):
            if parabola(xx, yy, ax - 6, base - ah - 6, aw + 12, base - 22) and not parabola(xx, yy, ax, base - ah, aw, base - 18):
                c.p(xx, yy, st[1] if xx < ax - 3 else st[4] if xx >= ax + aw + 3 else st[2])
    for yy in range(base - ah, base):
        for xx in range(ax, ax + aw):
            if parabola(xx, yy, ax, base - ah, aw, base - 18):
                lx = xx - ax
                col = OAK[5] if lx in (aw // 2 - 1, aw // 2) else OAK[3] if lx % 5 else OAK[4]
                c.p(xx, yy, VOID if yy < base - ah + 10 else col)
    op.reveal(c, ax, base - ah, aw, ah, 2)
    lion(c, ax - 10, base - 30, st)
    lion(c, ax + aw + 2, base - 30, st, flip=True)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, ah - 4, 2 * (cd + EH) + 40, roof='flat')


# ------------------------------------------------------------------ Egypt

KING = ["......##........",
        ".....####.......",
        "......##....#...",
        "....######.##...",
        "...#.####.##....",
        "..#..####.......",
        ".#...####.......",
        "....######......",
        "....##..##......",
        "...##....##.....",
        "...#......#.....",
        "..##......##...."]
GOD = ["......#.........",
       ".....###........",
       ".....###........",
       "......#.........",
       "....#####.......",
       "...#.###.#......",
       "..#..###..#.....",
       ".....###........",
       ".....###........",
       ".....#.#........",
       ".....#.#........",
       "....##.##......."]


def relief(c, x, y, pattern, r, ink, s=2):
    """Sunk relief: the figure cut a step darker, its upper edges catching no
    light (they are the cut's shaded lip), painted in one colour."""
    for j, row in enumerate(pattern):
        for i, ch in enumerate(row):
            if ch != '#':
                continue
            c.rect(x + i * s, y + j * s, s, s, ink)
            if j == 0 or pattern[j - 1][i] != '#':
                c.rect(x + i * s, y + j * s, s, 1, r[5])
            if i == 0 or row[i - 1] != '#':
                c.rect(x + i * s, y + j * s, 1, s, r[5])


def battered(c, cx, top, base, w0, w1, at, r, q):
    """A tower whose face leans back as it rises: the face square on, its
    sides tapering, a torus roll down each edge."""
    for yy in range(top, base):
        t = (yy - top) / max(1, base - top - 1)
        half = (w1 + (w0 - w1) * t) / 2
        L, R = round(cx - half), round(cx + half)
        for xx in range(L, R):
            c.p(xx, yy, at(xx, yy))
        c.p(L, yy, r[q - 2]); c.p(L + 1, yy, r[q - 1])
        c.p(R - 2, yy, r[q + 1]); c.p(R - 1, yy, r[q + 2])
    return round(cx - w1 / 2), round(cx + w1 / 2)


def cavetto(c, x0, x1, y, r, q, paint=None, d=10):
    """The Egyptian cornice: a torus roll, the hollow gorge flaring out above
    it in upright leaves, a lit fillet, and the roof seen from above."""
    c.rect(x0 - 1, y, x1 - x0 + 2, 2, r[q - 1]); c.rect(x0 - 1, y + 1, x1 - x0 + 2, 1, r[q + 1])
    for k in range(8):
        ins = 5 - (k * 5) // 8
        yy = y - 1 - k
        for xx in range(x0 - ins, x1 + ins):
            leaf = (xx - x0) % 4
            if paint and k < 6:
                col = paint[(xx - x0) // 4 % len(paint)][2 if leaf < 2 else 3]
            else:
                col = r[q - 1 if leaf < 2 else q]
            if k > 5:
                col = r[q - 2] if k == 7 else r[q - 1]
            c.p(xx, yy, col)
    t = y - 9
    c.rect(x0 - 5, t - round(d * K), x1 - x0 + 10, round(d * K), r[q - 2])
    c.rect(x0 - 5, t - round(d * K), x1 - x0 + 10, 1, r[q - 1])
    fp.cast_down(c, x0, x1, y + 2, 3, 0.35)
    return t - round(d * K)


def mast(c, x, base, h, top_y):
    """A cedar flagstaff standing in its niche, clamped to the tower, a long
    pennant at its head."""
    for yy in range(top_y, base):
        c.p(x, yy, CEDAR[2]); c.p(x + 1, yy, CEDAR[4])
    for k in range(3):
        cy = base - 30 - k * ((base - top_y) // 4)
        c.rect(x - 2, cy, 6, 2, CEDAR[3]); c.rect(x - 2, cy, 6, 1, CEDAR[1])
    for k in range(12):
        dip = round(1.4 * math.sin(k / 3))
        c.rect(x + 2 + k, top_y + 2 + dip, 1, max(2, 4 - k // 4), PENNANT[2 if k < 6 else 3])
    c.p(x, top_y - 1, GOLD[1]); c.p(x + 1, top_y - 1, GOLD[2])


PYLON_LOOKS = {
    'sandstone': dict(r=SAND, q=3, paint=[PAINT_BLUE, SAND]),
    'limestone': dict(r=LIME, q=2, paint=[PAINT_BLUE, PAINT_RED, LIME]),
    'mudbrick': dict(r=ADOBE, q=3, paint=None),
}


def pylon(spec=None, info=None):
    s = {**dict(size='medium', look='sandstone', W=232, seed=2), **(spec or {})}
    size, W = s['size'], s['W']
    LK = PYLON_LOOKS[s['look']]
    r, q, paint_ = LK['r'], LK['q'], LK['paint']
    mud = s['look'] == 'mudbrick'
    gate_r, gq = (SAND, 3) if mud else (r, q)
    at = courses(r, 4, 12, q, s['seed']) if mud else courses(r, 8, 22, q, s['seed'])
    gat = courses(gate_r, 8, 22, gq, s['seed'] + 1)
    ph = {'small': 84, 'medium': 110, 'large': 134}[size]
    H = ph + 70
    c = C(W + 40, H)
    x0, base = 20, H - 6
    cx = x0 + W // 2
    gw = {'small': 40, 'medium': 46, 'large': 52}[size]
    tw = (W - gw) // 2 + 4
    gh = round(ph * 0.68)
    # the hypostyle hall behind, its roof of slabs and raised clerestory nave
    hw = round(W * 0.62)
    hb = base - 30
    hall_h = gh - 6
    roof_d = 70
    fy, ty = so.box(c, cx - hw // 2, hb, hw, hall_h, roof_d, face(r, at, q), top(r, q - 2))
    for xx in range(cx - hw // 2, cx + hw // 2, 14):
        c.rect(xx, ty, 1, fy - ty, r[q - 1])
    nw = round(hw * 0.4)
    nfy, nty = so.box(c, cx - nw // 2, hb - 20, nw, hall_h + 14, roof_d - 20, face(r, at, q), top(r, q - 2))
    for k in range(5):
        gx = cx - nw // 2 + 4 + k * (nw - 8) // 5
        c.rect(gx, nfy + 3, (nw - 8) // 5 - 3, 8, VOID)
        for xx in range(gx + 1, gx + (nw - 8) // 5 - 3, 3):
            c.rect(xx, nfy + 3, 1, 8, r[q + 1])
    # the gate between the towers
    so.box(c, cx - gw // 2 - 6, base, gw + 12, gh, 16, face(gate_r, gat, gq), top(gate_r, gq - 2))
    cavetto(c, cx - gw // 2 - 4, cx + gw // 2 + 4, base - gh + 10, gate_r, gq, paint_, d=16)
    for k in range(-11, 12):
        c.p(cx + k, base - gh + 16 + abs(k) // 4, PAINT_GOLD[2] if k < 0 else PAINT_GOLD[3])
        c.p(cx + k, base - gh + 17 + abs(k) // 4, PAINT_BLUE[3] if abs(k) > 3 else PAINT_GOLD[3])
    so.ellipse(c, cx, base - gh + 16, 2.6, 2.6, PAINT_RED[2])
    dw, dh = 22, 54
    c.rect(cx - dw // 2 - 4, base - dh - 4, dw + 8, dh + 4, gate_r[gq - 1])
    c.rect(cx - dw // 2 - 4, base - dh - 4, dw + 8, 1, gate_r[gq - 2])
    door(c, cx, base, dw, dh, gate_r, CEDAR)
    # the two towers
    for sd in (-1, 1):
        tcx = cx + sd * (gw // 2 + tw // 2 - 2)
        L, R = battered(c, tcx, base - ph, base, tw, tw - 14, at, r, q)
        cavetto(c, L, R, base - ph + 9, r, q, paint_, d=18)
        if not mud:
            c.rect(L + 2, base - ph + 10, R - L - 4, 1, r[q - 1])
        # niches for the flagstaffs on the side toward the gate
        nx = [R - 16, R - 30] if sd < 0 else [L + 14, L + 28]
        for k, x in enumerate(nx[: 1 if size == 'small' else 2]):
            ntop = base - ph + 20
            c.rect(x - 3, ntop, 8, ph - 20, r[q + 2])
            c.rect(x - 3, ntop, 2, ph - 20, r[q + 3])
            c.rect(x + 4, ntop, 1, ph - 20, r[q - 1])
            c.rect(x - 3, ntop, 8, 1, r[q + 3])
            mast(c, x, base, ph + 26 - k * 6, base - ph - 26 + k * 6)
        fx = L + 8 if sd < 0 else R - 40
        ink = (PAINT_BLUE if sd < 0 else PAINT_RED)[3] if paint_ else r[q + 2]
        relief(c, fx, base - ph + 32, KING if sd < 0 else GOD, r, ink)
        if size != 'small':
            relief(c, fx + (4 if sd < 0 else -4), base - ph + 66, GOD if sd < 0 else KING, r, ink)
    if size == 'large':
        for sd in (-1, 1):
            ox = cx + sd * (gw // 2 + 20)
            oh = round(ph * 0.92)
            so.box(c, ox - 8, base + 2, 16, 6, 10, GREY, top(GREY, 1))
            granite = ramp(28, 0.06, lift=-0.04)
            for yy in range(base - 4 - oh, base - 4):
                t = (yy - (base - 4 - oh)) / oh
                hw_ = 3.5 + 2.5 * t
                for xx in range(round(ox - hw_), round(ox + hw_)):
                    c.p(xx, yy, granite[1 if xx < ox - hw_ + 2 else 2 if xx < ox + hw_ - 2 else 4])
            for yy in range(base - oh + 6, base - 20, 6):
                c.p(ox, yy, granite[4]); c.p(ox, yy + 2, granite[4])
            for k in range(7):
                c.rect(ox - k // 2 - 1, base - 4 - oh - 7 + k, k + 2, 1, GOLD[1 if k < 4 else 2])
    so.box(c, x0 - 4, base + 4, W + 8, 4, 10, gate_r, top(gate_r, gq - 2))
    ground_shadow(c, x0 - 4, x0 + W + 4, base + 4)
    complete(c, info, x0 - 4, W + 8, base + 4, cx, dh, roof_d + 60, roof='flat')
    # the painted cornice leaves single odd tones the usual reach misses
    consolidate(c, rare=3, reach=90)
    return c.im


# ------------------------------------------------------------------ Iran

def ellipse_arch(x, y, x0, spring, w, rise):
    """The Sasanian arch: a half ellipse taller than it is wide."""
    if not x0 <= x < x0 + w:
        return False
    if y >= spring:
        return True
    u = (x + 0.5 - x0 - w / 2) / (w / 2)
    return (spring - y) <= rise * math.sqrt(max(0.0, 1 - u * u))


def atashdan(c, cx, base, r):
    """The fire altar: a stepped foot, a square shaft, a stepped crown and
    the fire burning in its bowl."""
    for k, w in enumerate((16, 12)):
        so.box(c, cx - w // 2, base - 3 * k, w, 3, 6, r, top(r, 1))
    so.box(c, cx - 4, base - 6, 8, 10, 4, face(r, None, 3), top(r, 1))
    for k, w in enumerate((10, 14)):
        so.box(c, cx - w // 2, base - 16 - 3 * k, w, 3, 6, r, top(r, 1))
    fy = base - 25
    for k in range(12):
        hw = max(0, round(5 - k * 0.45))
        for i in range(-hw, hw + 1):
            q = 1 if abs(i) < hw - 2 and k < 7 else 2 if abs(i) < hw else 4
            c.p(cx + i + (1 if k > 8 else 0), fy - k, FIRE[q])
    c.p(cx + 1, fy - 12, FIRE[1])


def rubble_face(r, plaster=GYPSUM, line=None):
    """Rubble masonry with gypsum render still on it above `line`, fallen
    away below in ragged patches."""
    def f(c, x, y, w, h):
        from art import front_materials as fm
        fm.rubble(c, x, y, w, h, r, plaster)
        if line is None:
            return
        for xx in range(x, x + w):
            cut = y + line + round(4 * math.sin(xx * 0.21) + 3 * h2(xx // 5, 1, 9))
            for yy in range(y, min(y + h, cut)):
                c.p(xx, yy, plaster[2] if xx > x and xx < x + w - 2 else plaster[3])
            c.p(xx, min(y + h - 1, cut), plaster[3])
    return f


def chahartaq(c, cx, base, w, h, r, beyond, solid=False):
    """Four piers and four arches under a dome on squinches. Through the
    front arch the fire on its altar and, through the back arch, daylight."""
    D = w // 2
    fy, ty = so.box(c, cx - w // 2, base, w, h, D, rubble_face(r, GYPSUM, h // 3),
                    lambda c, x, y, ww, hh: (c.rect(x, y, ww, hh, GYPSUM[2]), c.rect(x, y + hh - 2, ww, 2, GYPSUM[1]),
                                             c.rect(x, y, ww, 1, GYPSUM[3])))
    aw = round(w * 0.62)
    rise = round(aw * 0.62)
    spring = base - h + 8 + rise
    ax = cx - aw // 2
    for yy in range(spring - rise - 4, base):
        for xx in range(ax - 4, ax + aw + 4):
            if ellipse_arch(xx, yy, ax - 4, spring, aw + 8, rise + 4) and not ellipse_arch(xx, yy, ax, spring, aw, rise):
                c.p(xx, yy, GYPSUM[1] if xx < cx - 2 else GYPSUM[3])
    for yy in range(spring - rise, base):
        for xx in range(ax, ax + aw):
            if not ellipse_arch(xx, yy, ax, spring, aw, rise):
                continue
            col = VOID if solid else mix(VOID, r[5], 0.35)
            c.p(xx, yy, col)
    if not solid:
        # the back arch, lower in the dark, daylight and the far wall in it
        bw, br = round(aw * 0.5), round(rise * 0.5)
        bs = base - 12
        bsp = bs - round((h - 8) * 0.5) + br
        wall_y = bs - 14
        for yy in range(bsp - br, bs):
            for xx in range(cx - bw // 2, cx + bw // 2):
                if ellipse_arch(xx, yy, cx - bw // 2, bsp, bw, br):
                    col = beyond[1] if yy >= wall_y + 6 else r[3] if yy >= wall_y else GYPSUM[1]
                    if yy == wall_y:
                        col = GYPSUM[2]
                    c.p(xx, yy, col)
        floor = mix(GYPSUM[4], VOID, 0.35)
        c.rect(ax, bs, aw, base - bs, floor)
        for yy in range(bs, base):
            c.rect(ax, yy, 6 + (yy - bs) // 2, 1, mix(GYPSUM[3], VOID, 0.2))
        atashdan(c, cx, base - 3, GYPSUM)
    # the zone of squinches, an octagon, then the dome
    R = round(w * 0.38)
    dby = ty + round(D * K * 0.55)
    c.rect(cx - w // 2 - 1, fy, w + 2, 2, GYPSUM[1])
    c.rect(cx - w // 2 - 1, fy + 2, w + 2, 1, GYPSUM[3])
    fp.cast_down(c, cx - w // 2, cx + w // 2, fy + 3, 2, 0.3)
    so.lathe(c, cx, dby, [(0, R + 1), (8, R + 1)], GYPSUM, ribs=8)
    so.dome(c, cx, dby - 8, R, GYPSUM, kind='hemi', courses=0)
    return fy


def fire_temple(spec=None, info=None):
    s = {**dict(form='court', size='medium', W=196), **(spec or {})}
    if s['form'] == 'tower':
        from art.front_sacred_world import fire_tower
        return fire_tower(s, info)
    size, W = s['size'], s['W']
    cw = {'small': 70, 'medium': 86, 'large': 104}[size]
    ch = {'small': 60, 'medium': 72, 'large': 86}[size]
    H = ch + round(cw * 1.25) + 40
    c = C(W + 40, H)
    x0, base = 20, H - 6
    cx = x0 + W // 2
    r = RUBBLE
    if s['form'] == 'court':
        # the enclosure behind, its court paved, the fire house on a stepped plinth
        wb = base - 22
        court(c, x0 + 6, x0 + W - 6, wb - 26, 30, GYPSUM, 16, 5, 4)
        for sx in (x0, x0 + W - 6):
            c.rect(sx, wb - 56, 6, 30, GYPSUM[2])
        for L, R in ((x0, cx - cw // 2 - 10), (cx + cw // 2 + 10, x0 + W)):
            rubble_face(r, GYPSUM, 8)(c, L, wb - 26, R - L, 26)
            coping(c, L - 1, R + 1, wb - 26, GYPSUM, 3)
            fp.cast_down(c, L, R, wb - 26, 2, 0.3)
        for k in range(3):
            pw = cw + 36 - k * 10
            so.box(c, cx - pw // 2, base - 4 * k, pw, 4, 10, GYPSUM, top(GYPSUM, 1))
        foot = base - 12
        chahartaq(c, cx, foot, cw, ch, r, ramp(150, 0.05, lift=0.0))
        door_h = ch - 10
    else:
        # the walled fire house: an ambulatory of mud brick round the fire
        # chamber, its dome rising out of the middle
        amb_h = {'small': 46, 'medium': 50, 'large': 56}[size]
        aat = plastered(MUD, 3, 6)
        fy, ty = so.box(c, x0, base, W, amb_h, 90, face(MUD, aat, 3), lambda c, x, y, w, h: deck(c, x, x + w, y + h, h, MUD))
        chahartaq(c, cx, fy - 14, cw - 10, ch - 26, MUD, MUD, solid=True)
        socle(c, x0, x0 + W, base, 8, BAKED, 4)
        for sd in (-1, 1):
            for k in range(2):
                wx = cx + sd * (36 + k * (W // 2 - 50) // 2 + 10)
                c.rect(wx - 4, fy + 10, 8, 14, VOID)
                c.rect(wx - 5, fy + 9, 10, 1, MUD[1]); c.rect(wx - 5, fy + 24, 10, 2, MUD[2])
        arch_door(c, cx, base, 22, 40, MUD, 'round', wood=CEDAR)
        door_h = 40
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, door_h, {'small': 120, 'medium': 150, 'large': 190}[size], roof='dome')


# ------------------------------------------------------------------ the Americas

def cutstone(r, q=3, seed=0, course=6, block=16):
    """Dressed stone in courses: each block's top arris lit, its foot a step
    darker, the joints cut deep, the odd block from a lighter or darker bed."""
    def at(x, y):
        row, ly = y // course, y % course
        off = (row * 7) % block
        lx = (x + off) % block
        if ly == course - 1 or lx == 0:
            return r[min(7, q + 2)]
        t = h2((x + off) // block, row, seed)
        b = q - 1 if t > 0.82 else q + 1 if t < 0.12 else q
        if ly == 0:
            return r[b - 1]
        if ly == course - 2 or lx == block - 1:
            return r[min(7, b + 1)]
        return r[b]
    return at


def fret(c, x0, x1, y, h, ink, ground):
    """A painted band of stepped frets, as on the platforms of the north coast."""
    c.rect(x0, y, x1 - x0, h, ground[2])
    for xx in range(x0, x1):
        p = (xx - x0) % 12
        lv = (0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0)[p]
        c.rect(xx, y + h - 2 - lv * (h - 3) // 2, 1, 2 + lv * (h - 3) // 2, ink[3])
    c.rect(x0, y, x1 - x0, 1, ground[1]); c.rect(x0, y + h - 1, x1 - x0, 1, ground[4])


def summit_house(c, cx, by, w, h, wall, roof='thatch', door_frame=None):
    """The house of the god on the summit: a room with a trapezoidal door
    under a steep hipped thatch, or a flat roof with a painted band."""
    fy, ty = so.box(c, cx - w // 2, by, w, h, 10, face(wall, None, 2), top(wall, 1))
    if roof == 'thatch':
        rise = round(w * 0.55)
        fp.roof_band(c, cx - w // 2 - 4, cx + w // 2 + 4, fy + 2, rise, 'thatch', fp.tone_for('thatch', None), hip=0.55)
    else:
        fret(c, cx - w // 2, cx + w // 2, fy, 7, PAINT_RED, wall)
    dw, dh = 10, min(h - 6, 16)
    for k in range(dh):
        ins = (dh - k) // 6
        c.rect(cx - dw // 2 + ins, by - dh + k, dw - 2 * ins, 1, VOID)
    if door_frame:
        c.rect(cx - dw // 2 - 2, by - dh - 2, dw + 4, 2, door_frame[1])


PLATFORM_LOOKS = {
    'andesite': dict(r=ANDESITE, q=3, paint=False, house='thatch', wall=ADOBE),
    'painted': dict(r=ramp(70, 0.05, lift=0.02), q=2, paint=True, house='flat', wall=ramp(70, 0.05, lift=0.02)),
    'limestone': dict(r=GREY, q=3, paint=False, house='thatch', wall=WHITE),
}


def stepped_platform(spec=None, info=None):
    s = {**dict(size='medium', look='andesite', seed=13), **(spec or {})}
    size = s['size']
    if size == 'small':
        return earth_mound(s, info)
    LK = PLATFORM_LOOKS[s['look']]
    r, q = LK['r'], LK['q']
    W = {'medium': 160, 'large': 224}[size]
    n = {'medium': 4, 'large': 6}[size]
    rise = {'medium': 17, 'large': 17}[size]
    step_in = {'medium': 14, 'large': 14}[size]
    sb = 12
    H = n * (rise + round(sb * K)) + 90
    c = C(W + 24, H)
    x0, base = 12, H - 4
    cx = x0 + W // 2
    at = cutstone(r, q, s['seed'])
    rows = []
    y = base
    for k in range(n):
        rows.append((y - rise, y))
        y -= rise + round(sb * K)
    summit = rows[-1][0]
    for k in reversed(range(n)):
        w = W - 2 * step_in * k
        ft, fb = rows[k]
        tt = ft - round((sb if k < n - 1 else 26) * K)
        top(r, q - 2, q)(c, cx - w // 2, tt, w, ft - tt)
        face(r, at, q)(c, cx - w // 2, ft, w, fb - ft)
        if LK['paint']:
            fret(c, cx - w // 2, cx + w // 2, ft + 4, 8, PAINT_RED if k % 2 else PAINT_GOLD, r)
        c.rect(cx - w // 2, ft, w, 1, r[q - 2])
        for xx in range(cx - w // 2, cx + w // 2):
            fp.shade(c, xx, fb, 0.25)
    hw = W - 2 * step_in * (n - 1)
    summit_house(c, cx, summit - 6, round(hw * 0.6), 26, LK['wall'], LK['house'], r)
    sw = {'medium': 22, 'large': 30}[size]
    flight(c, cx, base, summit, sw, r, r, 5)
    if size == 'large':
        c.rect(cx - 2, summit - 2, 4, base - summit + 2, r[q - 1])
        c.rect(cx + 1, summit - 2, 1, base - summit + 2, r[q + 1])
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 0, W, doorless=True, roof='gable')


def earth_mound(s, info):
    """A Mississippian platform mound: a grassed earthen pyramid, its flat
    top carrying the temple under its steep thatch, a stair of logs set in
    the slope."""
    W = 112
    H = 120
    c = C(W + 24, H)
    x0, base = 12, H - 4
    cx = x0 + W // 2
    mh, top_w = 34, 70
    tt = base - mh - 18
    # the flat top, beaten earth ringed with grass
    c.rect(cx - top_w // 2, tt, top_w, 18, EARTH[2])
    c.rect(cx - top_w // 2, tt + 15, top_w, 3, GRASS[2])
    c.rect(cx - top_w // 2, tt, top_w, 2, GRASS[3])
    # the slope toward us, seen half from above: grass in stepped bands
    for yy in range(base - mh, base):
        t = (yy - (base - mh)) / mh
        half = top_w / 2 + t * (W - top_w) / 2
        L, R = round(cx - half), round(cx + half)
        band = 1 if t < 0.35 else 2 if t < 0.75 else 3
        for xx in range(L, R):
            q = band
            if xx < L + 3:
                q = max(0, band - 1)
            elif xx > R - 5:
                q = band + 1
            if h2(xx // 3, yy, s.get('seed', 13)) > 0.94:
                q = min(7, q + 1)
            c.p(xx, yy, GRASS[q])
    flight(c, cx, base, base - mh - 1, 14, OAK, EARTH, 3, rise=3)
    summit_house(c, cx, tt + 12, 40, 22, ramp(60, 0.05, lift=-0.02), 'thatch')
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 0, W, doorless=True, roof='gable')


# ------------------------------------------------------------------ Sri Lanka

DAGOBA_WHITE = ramp(95, 0.012, lift=0.07)
OLD_BRICK = ramp(36, 0.075, lift=-0.1)
GNEISS = ramp(64, 0.03, lift=-0.02)


def moonstone(c, cx, by, R):
    """The half-round stone at a stair's foot, cut in rings: a band of
    flame, a band of beasts, a lotus at the heart."""
    bands = [(R, GNEISS[3]), (R - 2, GNEISS[1]), (R - 4, GNEISS[4]), (R - 7, GNEISS[2]), (R - 9, GNEISS[1]),
             (R - 12, PAINT_GOLD[3]), (R - 14, GNEISS[1])]
    for rr, col in bands:
        if rr <= 1:
            continue
        for yy in range(by - round(rr * K) - 1, by + 1):
            for xx in range(cx - rr, cx + rr + 1):
                if ((xx + 0.5 - cx) / rr) ** 2 + ((yy + 0.5 - by) / (rr * K)) ** 2 <= 1 and yy <= by:
                    c.p(xx, yy, col)
    for xx in range(cx - R + 4, cx + R - 3, 3):
        d = ((xx - cx) / (R - 5.5))
        if abs(d) < 1:
            c.p(xx, by - round((R - 5.5) * K * math.sqrt(1 - d * d)), GNEISS[5])


def guardstone(c, x, base, r):
    """The upright slab beside a stair, its top rounded."""
    c.rect(x, base - 12, 6, 12, r[2])
    c.rect(x + 1, base - 14, 4, 2, r[1])
    c.rect(x, base - 12, 1, 12, r[1]); c.rect(x + 5, base - 12, 1, 12, r[4])
    c.rect(x + 2, base - 9, 2, 5, r[3])


def stupa(c, cx, by, R, r):
    """The dagoba: three basal rings, the bell dome, the square harmika and
    the ringed spire with its gilt pinnacle. Returns the top row."""
    for k, dr in enumerate((R + 12, R + 8, R + 4)):
        so.lathe(c, cx, by - k * 5, [(0, dr), (5, dr)], r)
    b = by - 15
    prof = [(i / 14 * R * 1.02, R * (1 - (i / 14) ** 2.4) ** 0.5) for i in range(15)]
    so.lathe(c, cx, b, prof, r)
    crown = b - round(R * 1.02) + round(R * 0.12)
    hw = max(12, R // 2)
    so.box(c, cx - hw // 2, crown + 2, hw, 9, hw, face(r, None, 2), top(r, 1))
    c.rect(cx - hw // 2 - 2, crown - 7 - round(hw * K), hw + 4, 2, r[1])
    c.rect(cx - hw // 2 - 2, crown - 5 - round(hw * K), hw + 4, 1, r[3])
    sp = round(R * 1.1)
    st = crown - 5 - round(hw * K)
    so.lathe(c, cx, st, [(0, hw * 0.32), (sp * 0.78, 1.6)], r, courses=4)
    so.lathe(c, cx, st - round(sp * 0.78), [(0, 1.8), (sp * 0.22, 0.5)], GOLD)
    so.lathe(c, cx, st - round(sp * 0.78) + 2, [(0, 2.6), (3, 2.6)], GOLD)
    return st - sp


def image_house(c, cx, base, w, wall, brick):
    """The image house where the Buddha sits: a white room on a moulded
    plinth under a hipped roof of tiles, its door over a moonstone."""
    h = 50
    so.box(c, cx - w // 2 - 3, base, w + 6, 6, 8, GNEISS, top(GNEISS, 1))
    fy, ty = so.box(c, cx - w // 2, base - 6, w, h, 12, face(wall, plastered(wall, 2, 4), 2), top(wall, 1))
    fp.roof_band(c, cx - w // 2 - 6, cx + w // 2 + 6, fy + 2, round(w * 0.42), 'plain', TILE, hip=0.45)
    door(c, cx, base - 6, 18, 38, wall, CEDAR)
    if brick:
        for xx in range(cx - w // 2, cx + w // 2):
            for yy in range(base - 30, base - 6):
                if h2(xx // 6, yy // 3, 21) > 0.93 and abs(xx - cx) > 14:
                    c.p(xx, yy, OLD_BRICK[3])
    return fy


def sand(c, x, y, w, h):
    """The terrace's white sand, raked: one light tone, a few faint drag
    lines, shade along its back."""
    r = ramp(66, 0.05, lift=0.02)
    c.rect(x, y, w, h, r[1])
    for yy in range(y + 3, y + h - 2, 5):
        for xx in range(x + 2, x + w - 2):
            if h2(xx // 7, yy, 3) > 0.55:
                c.p(xx, yy, r[2])
    c.rect(x, y, w, 2, r[3])
    c.rect(x, y + h - 2, w, 2, r[0])


def dagoba(spec=None, info=None):
    s = {**dict(size='medium', look='white'), **(spec or {})}
    size = s['size']
    white = s['look'] == 'white'
    r = DAGOBA_WHITE if white else OLD_BRICK
    R = {'small': 24, 'medium': 34, 'large': 42}[size]
    shrine = size != 'small'
    W = {'small': 128, 'medium': 232, 'large': 280}[size]
    H = round(R * 2.3) + R + 70 + (round(R * 1.5) if size != "small" else 0)
    c = C(W + 24, H)
    x0, base = 12, H - 4
    th = 10
    if not shrine:
        # a vatadage: the small dagoba ringed by pillars on a round terrace
        cx = x0 + W // 2
        TR = R + 26
        so.lathe(c, cx, base - 2, [(0, TR + 4), (th, TR + 4)], GNEISS)
        ring = [(math.cos(a), math.sin(a)) for a in (i * math.pi / 8 for i in range(16))]
        by = base - 2 - th
        def pill(u, v):
            px, py = round(cx + u * (TR - 2)), round(by - v * (TR - 2) * K)
            c.rect(px - 2, py - 30, 4, 30, GNEISS[2])
            c.rect(px - 2, py - 30, 1, 30, GNEISS[1])
            c.rect(px + 1, py - 30, 1, 30, GNEISS[4])
            c.rect(px - 3, py - 33, 6, 3, GNEISS[1]); c.rect(px - 3, py - 31, 6, 1, GNEISS[3])
        for u, v in ring:
            if v > 0.05:
                pill(u, v)
        stupa(c, cx, by - 4, R, r)
        for u, v in ring:
            if v <= 0.05:
                pill(u, v)
        flight(c, cx, base, by, 16, GNEISS, GNEISS, 3, rise=3)
        moonstone(c, cx, base + 2, 16)
        ground_shadow(c, x0, x0 + W, base)
        return complete(c, info, x0, W, base, cx, 0, W, doorless=True, label='Dagoba')
    # the dagoba on its square terrace, the image house beside it on the same
    # terrace, each reached by its own stair over a moonstone
    tw = W - 6
    tcx = x0 + 3 + tw // 2
    by = base - th
    td = round(R * 3.0)
    so.box(c, tcx - tw // 2, base, tw, th, td, face(GNEISS, cutstone(GNEISS, 2, 5, 5, 14), 2),
           sand)
    # the low wall round the terrace, seen across its far side
    bw = by - round(td * K)
    c.rect(tcx - tw // 2, bw - 8, tw, 8, GNEISS[2])
    c.rect(tcx - tw // 2, bw - 10, tw, 2, GNEISS[1])
    for xx in range(tcx - tw // 2 + 6, tcx + tw // 2, 12):
        c.rect(xx, bw - 7, 1, 7, GNEISS[3])
    cx = x0 + R + 34
    stupa(c, cx, by - round(td * K * 0.5), R, r)
    hx = x0 + W - 46
    image_house(c, hx, by - 2, 58 if size == 'medium' else 66, DAGOBA_WHITE, not white)
    for sx, sw in ((cx, 18), (hx, 16)):
        flight(c, sx, base, by - 1, sw, GNEISS, GNEISS, 3, rise=3)
        moonstone(c, sx, base + 3, sw // 2 + 7)
        guardstone(c, sx - sw // 2 - 11, base, GNEISS)
        guardstone(c, sx + sw // 2 + 5, base, GNEISS)
    ground_shadow(c, x0, x0 + W, base)
    complete(c, info, x0, W, base, hx, 38, W, label='Dagoba')
    return c.im


# ------------------------------------------------------------------ registry

BUILDERS = {'mesopotamian': mesopotamian, 'hittite': hittite, 'pylon-temple': pylon, 'fire-temple': fire_temple,
            'stepped-platform': stepped_platform, 'dagoba': dagoba}

S, M, L_ = 'small', 'medium', 'large'
MESO_DESC = ('A walled temple precinct: a gate between towers, a court with its palms and altar, '
             'and the house of the god, its mud-brick front set with buttresses and niches.')
ZIG_DESC = ('The temple precinct under its ziggurat: a stepped mountain of brick with the high shrine '
            'of the god at its summit, climbed by three stairs.')

HIT_DESC = ('A walled temple precinct of the Hittites: a gatehouse into a paved court, a pillared hall across it, '
            'and the house of the god on its stone socle, lit by tall windows.')

PY_DESC = "A god's house behind its gateway towers; only the priests go beyond the first court."

FIRE_DESC = 'The house of the sacred fire, which the priests keep burning day and night; the faithful pray before it.'
FIRE_FORMS = {S: [dict(form='court', W=150), dict(form='ambulatory', W=170), dict(form='tower', tower_w=52, tower_h=100)],
              M: [dict(form='court', W=196), dict(form='ambulatory', W=210), dict(form='tower')],
              L_: [dict(form='court', W=244), dict(form='ambulatory', W=260), dict(form='tower', tower_w=76, tower_h=136)]}

PLAT_DESC = {S: 'An earthen platform mound with a stair of logs up its face and a temple on its flat top.',
             M: 'A stepped platform of dressed stone, a stair up its face to the shrine on its summit.',
             L_: 'A great stepped platform of dressed stone, a broad stair up its face to the shrine on its summit.'}

DAG_DESC = 'A dagoba: a white bell-shaped dome over relics, and the image house where the Buddha sits.'

SPECS = {
    'dagoba': {
        z: [('dagoba', dict(size=z, look=lk, roof='dome', description=DAG_DESC,
                            label={S: 'Dagoba', M: 'Dagoba', L_: 'Great dagoba'}[z])) for lk in ('white', 'brick')]
        for z in (S, M, L_)},
    'stepped-platform': {
        z: [('stepped-platform', dict(size=z, look=lk, seed=13 + i, roof='gable', description=PLAT_DESC[z],
                                      label={S: 'Platform mound', M: 'Temple platform', L_: 'Temple pyramid'}[z]))
            for i, lk in enumerate(('andesite', 'painted', 'limestone'))]
        for z in (S, M, L_)},
    'fire-temple': {
        z: [('fire-temple', dict(f, size=z, label={S: 'Fire shrine', M: 'Fire temple', L_: 'Great fire temple'}[z],
                                 description=FIRE_DESC)) for f in FIRE_FORMS[z]]
        for z in (S, M, L_)},
    'pylon-temple': {
        z: [('pylon-temple', dict(size=z, look=lk, W={S: 168, M: 232, L_: 296}[z], seed=2 + i,
                                  label={S: 'Shrine', M: 'Temple', L_: 'Great temple'}[z], description=PY_DESC, roof='flat'))
            for i, lk in enumerate(('sandstone', 'limestone', 'mudbrick'))]
        for z in (S, M, L_)},
    'hittite-temple': {
        z: [('hittite', dict(size=z, look=lk, W={S: 208, M: 288, L_: 352}[z], seed=5 + i,
                             label='Temple precinct' if z != L_ else 'Great temple', description=HIT_DESC, roof='flat'))
            for i, lk in enumerate(('red', 'buff', 'pale'))]
        for z in (S, M, L_)},
    'mesopotamian-temple': {
        z: [('mesopotamian', dict(size=z, look=lk, W={S: 192, M: 256, L_: 320}[z], seed=3 + i,
                                  label='Ziggurat' if z == L_ else 'Temple precinct',
                                  description=ZIG_DESC if z == L_ else MESO_DESC, roof='flat'))
            for i, lk in enumerate(('plaster', 'baked', 'white'))]
        for z in (S, M, L_)},
}
