"""Temples, stupas and gurdwaras of South Asia, front-on.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-southasia.png southasia

Nagara and Dravida temples, the Jain temple, the stupa, the gurdwara and
the Newar pagoda, each from a spec (the Sri Lankan dagoba is in
front_sacred_ancient). The contract is in front_sacred.py.
"""
from pathlib import Path
import math
import sys

import numpy as np

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_southasia as sa  # noqa: E402
from art.front_sacred import (complete, arch_door, steps, flag, ground_shadow, VOID, GOLD,  # noqa: E402
                              ink, bevel, masonry, ledge, post, storey_block, enclosure, front_wall,
                              framed_door, flagstaff, pot_row)

K = so.K
BUFF, BUFF_TOP = sa.BUFF, sa.BUFF_TOP
DARK_BUFF = ramp(60, 0.06, lift=-0.08)
LATERITE = ramp(36, 0.07, lift=-0.1)
LATERITE_TOP = ramp(40, 0.06, lift=-0.04)
BRICK = RAMPS['brick']
LIME = sa.CHUNA_TOP
MARBLE = ramp(95, 0.012, lift=0.06)
GRANITE = ramp(60, 0.025, lift=-0.06)
GRANITE_TOP = ramp(62, 0.022, lift=-0.01)
WHITE = sa.WHITE
SAFFRON = ramp(58, 0.15, lift=-0.02)
RED = ramp(26, 0.15, lift=-0.08)
OCHRE_RED = sa.GERU
WATER = ramp(222, 0.07, lift=-0.08)
TIMBER = ramp(42, 0.07, lift=-0.2)
NEWAR_TILE = ramp(30, 0.07, lift=-0.16)
PAINT = [ramp(245, 0.1, lift=-0.06), ramp(150, 0.09, lift=-0.04), ramp(15, 0.11, lift=-0.02), ramp(82, 0.12)]
PASTEL = ramp(85, 0.03, lift=0.04)
COURT = ramp(62, 0.05, lift=0.02)
MARIGOLD = ramp(38, 0.2, lift=0.02)


# ------------------------------------------------------------------ parts

def moulded(r, bands=(0, 2, 3, 5)):
    """A painter for a plinth or platform face: horizontal mouldings."""
    def paint(c, x, y, w, h):
        for k in range(h):
            q = 3
            m = k % 7
            if m == 0:
                q = 1
            elif m == 1:
                q = 2
            elif m == 5:
                q = 4
            c.rect(x, y + k, w, 1, r[q])
        c.rect(x, y, 1, h, r[2]); c.rect(x + w - 1, y, 1, h, r[5])
    return paint


def paving(r):
    def paint(c, x, y, w, h):
        for k in range(h):
            c.rect(x, y + k, w, 1, r[2] if k % 8 else r[3])
            if k % 8:
                for xx in range(x + (k // 8 % 2) * 9, x + w, 18):
                    c.p(xx, y + k, r[3])
        c.rect(x, y, w, 1, r[1])
    return paint


def kalasha(c, cx, y, s=1.0):
    so.lathe(c, cx, y, [(0, 2 * s), (3 * s, 3.5 * s), (6 * s, 2.5 * s), (8 * s, 1), (10 * s, 0.6)], GOLD)


def chhatra(c, cx, top, n, r, w=12, gap=5, pole=GOLD):
    """Stone parasols stacked on a mast, smaller as they rise."""
    for yy in range(top - n * gap - 4, top):
        c.p(cx, yy, pole[3]); c.p(cx + 1, yy, pole[5])
    for k in range(n):
        y = top - 2 - k * gap
        hw = max(3, w // 2 - k * 2)
        for j in range(3):
            ww = hw - (2 - j)
            c.rect(cx - ww, y - 2 + j, 2 * ww + 2, 1, r[1 + j])
        c.rect(cx - hw, y + 1, 2 * hw + 2, 1, r[5])


def harmika(c, cx, by, w, r):
    so.box(c, cx - w // 2, by, w, 7, w, r)
    for xx in range(cx - w // 2, cx + w // 2, 3):
        c.p(xx, by - 4, r[5])
    c.rect(cx - w // 2 - 1, by - 8, w + 2, 2, r[1])


def railing(c, cx, by, R, h, r, gap=0):
    """A vedika: a ring of posts and three cross-bars round a stupa, its
    front half drawn over what stands inside it."""
    for xx in range(round(cx - R), round(cx + R) + 1):
        dx = xx + 0.5 - cx
        if abs(dx) > R:
            continue
        if gap and abs(dx) < gap:
            continue
        foot = by + round(K * math.sqrt(max(0, R * R - dx * dx)))
        t = dx / R
        lit = t < -0.3
        post = (xx - round(cx)) % 6 in (0, 1)
        for k in range(h):
            yy = foot - k
            if post:
                q = 1 if (xx - round(cx)) % 6 == 0 else 3
            else:
                q = 2 if k in (3, 7, 11, 4, 8, 12) and k < h - 2 else 5
            if not lit:
                q = min(7, q + 1)
            c.p(xx, yy, r[q])
        c.p(xx, foot - h, r[1]); c.p(xx, foot - h + 1, r[2])


def torana(c, cx, base, w, h, r):
    """A Sanchi gateway: two square posts, three architraves with scrolled
    ends reaching past them, the wheel of the law on top."""
    for px in (cx - w // 2, cx + w // 2 - 6):
        c.rect(px, base - h, 6, h, r[2])
        c.rect(px, base - h, 1, h, r[1]); c.rect(px + 5, base - h, 1, h, r[4])
        for yy in range(base - h + 4, base - 6, 8):
            c.rect(px + 1, yy, 4, 1, r[4])
    for k in range(3):
        y = base - h - 2 - k * 9
        bw = w + 14
        for xx in range(cx - bw // 2, cx + bw // 2):
            sag = 1 if abs(xx - cx) < bw * 0.3 else 0
            c.p(xx, y + sag, r[1]); c.p(xx, y + 1 + sag, r[2]); c.p(xx, y + 2 + sag, r[2]); c.p(xx, y + 3 + sag, r[4])
        for side in (-1, 1):
            ex = cx + side * (bw // 2)
            c.rect(ex - (2 if side > 0 else 0), y - 1, 2, 5, r[1 if side < 0 else 3])
            c.p(ex - (2 if side > 0 else 0) + (1 if side > 0 else 0), y + 2, r[5])
        if k < 2:
            for px in (cx - w // 2 + 2, cx - 3, cx + 2, cx + w // 2 - 4):
                c.rect(px, y - 5, 2, 5, r[3])
    wy = base - h - 2 - 2 * 9 - 7
    so.ellipse(c, cx, wy, 4.5, 4.5, r[1])
    so.ellipse(c, cx, wy, 2.5, 2.5, r[4])
    c.p(cx - 1, wy - 1, r[1])
    for side in (-1, 1):
        c.rect(cx + side * (w // 2) - 1, wy + 1, 3, 4, r[2])


def lion(c, cx, by, r, side):
    """A seated stone guardian lion, facing out from the stair."""
    c.rect(cx - 3, by - 5, 7, 5, r[3])
    c.rect(cx - 3, by - 5, 7, 1, r[1])
    hx = cx + (2 if side > 0 else -3)
    c.rect(hx - 1, by - 10, 5, 5, r[2])
    c.rect(hx - 1, by - 10, 5, 1, r[1])
    c.p(hx + (3 if side > 0 else -1), by - 8, r[5])
    c.rect(cx - 4, by, 9, 2, r[4])


# ------------------------------------------------------------------ nagara

PEACH = ramp(42, 0.07, lift=0.03)
TEMPLE_BRICK = ramp(32, 0.09, lift=-0.05)

NAGARA_LOOKS = {
    'buff': dict(stone=BUFF, top=BUFF_TOP, hall=PEACH, flag='saffron'),
    'laterite': dict(stone=LATERITE, top=LATERITE_TOP, hall=LATERITE, flag='red'),
    'brick': dict(stone=TEMPLE_BRICK, top=LIME, hall=TEMPLE_BRICK, flag='yellow'),
    'white': dict(stone=sa.CHUNA, top=sa.CHUNA_TOP, hall=PEACH, flag='red'),
    'jain': dict(stone=MARBLE, top=MARBLE, hall=MARBLE, flag='jain'),
}


def jali_screen(c, x, y, w, h, r):
    """A pierced stone screen in its frame: a diamond lattice over shadow."""
    c.rect(x, y, w, h, r[2])
    c.rect(x, y, w, 1, r[1]); c.rect(x, y, 1, h, r[1])
    c.rect(x, y + h - 1, w, 1, r[4]); c.rect(x + w - 1, y, 1, h, r[4])
    for yy in range(y + 2, y + h - 2):
        for xx in range(x + 2, x + w - 2):
            i, j = xx - x, yy - y
            hole = (i + j) % 3 and (i - j) % 3
            c.p(xx, yy, r[5] if hole else r[2])
    c.rect(x + 2, y + 2, w - 4, 1, r[4])


def toran(c, x0, x1, y):
    """A string of marigolds swagged under a lintel."""
    for xx in range(x0, x1):
        u = (xx - x0) % 10
        sag = round(2.2 * math.sin(math.pi * u / 10))
        c.p(xx, y + sag, MARIGOLD[2] if xx % 2 else MARIGOLD[3])
        if u == 0:
            c.p(xx, y + 1, MARIGOLD[1]); c.p(xx, y + 2, MARIGOLD[3])


def pillar(c, x, top, bottom, r):
    """A round porch pillar: a lit shaft on a moulded base under a cushion
    capital, banded at the middle."""
    c.rect(x + 1, top, 5, bottom - top, r[2])
    c.rect(x + 1, top, 1, bottom - top, r[1]); c.rect(x + 2, top, 1, bottom - top, r[0])
    c.rect(x + 5, top, 1, bottom - top, r[4])
    for y, w, q in ((top, 7, 1), (top + 1, 7, 2), (top + 2, 7, 3), (bottom - 3, 7, 1), (bottom - 2, 7, 2), (bottom - 1, 7, 3)):
        c.rect(x, y, w, 1, r[q])
    c.rect(x + 6, top, 1, 3, r[4]); c.rect(x + 6, bottom - 3, 1, 3, r[4])
    mid = (top + bottom) // 2
    c.rect(x + 1, mid, 5, 1, r[1]); c.rect(x + 1, mid + 1, 5, 1, r[3])


def nagara(spec, info):
    """A Nagara temple drawn as solids in the house projection, so every top
    shows and walls stay square on: the jagati platform with a moulded edge,
    the hall (mandapa) with its pillared porch and stepped roof, and behind
    it the curved spire (latina), with three more spires before it on a great
    temple. The carving, pillars, jali, amalaka and finials are drawn by hand
    on the solids, and the flag flies as an overlay."""
    s = {**dict(size='medium', look='buff'), **spec}
    size = s['size']
    lk = NAGARA_LOOKS['jain' if s.get('jain') else s['look']]
    stone, top, hall = lk['stone'], lk['top'], lk['hall']
    cluster = size == 'large' or s.get('jain')
    W = {'small': 132, 'medium': 180, 'large': 236}[size] + (24 if s.get('jain') and size != 'large' else 0)
    jd = {'small': 110, 'medium': 136, 'large': 170}[size]
    ph = {'small': 16, 'medium': 18, 'large': 20}[size]
    a0 = {'small': 52, 'medium': 62, 'large': 66}[size]
    peak = {'small': 240, 'medium': 268, 'large': 330}[size]
    Dp = 2 * jd + 16
    yc = Dp - 0.85 * a0 - 6
    Hs = peak - ph - K * yc
    mw = round({'small': 0.74, 'medium': 0.66, 'large': 0.62}[size] * W)
    mh = {'small': 40, 'medium': 44, 'large': 48}[size]
    ym0 = {'small': 24, 'medium': 28, 'large': 32}[size]
    pw = round(mw * 0.6)
    yb = ym0 + {'small': 44, 'medium': 52, 'large': 60}[size]
    nt = {'small': 3, 'medium': 4, 'large': 4}[size]
    sx_, sy_ = 9, 12
    zt = ph + mh
    spires = [sa.Latina(0, yc, ph, a0, Hs)]
    if cluster:
        for side in (-1, 1):
            spires.append(sa.Latina(side * a0 * 1.02, yc - a0 * 0.75, ph, a0 * 0.43, Hs * 0.64, pitch=15, crown=0.4))
        spires.append(sa.Latina(0, yc - a0 * 1.1, ph, a0 * 0.44, Hs * 0.7, pitch=15, crown=0.4))
    npil = 4 if size == 'small' else 6
    pil = [(-pw / 2 + 3 + i * (pw - 11) / (npil - 1)) for i in range(npil)]
    sw, rc = 28, 6
    brick_face = s['look'] == 'brick' or size == 'large'

    def solid(X, Y, Z):
        m = np.zeros(X.shape, int)
        ax = np.abs(X)
        # The platform's corners are rounded in plan; its coping overhangs
        # a recessed face that stands on a plinth course.
        inset = np.where((Z >= ph - 5) | (Z < 3), 0.0, 2.0)
        hw_, y0 = W / 2 - inset, inset
        cdx = np.maximum(ax - (hw_ - rc), 0)
        cdy = np.maximum(np.maximum(y0 + rc - Y, Y - (Dp - rc)), 0)
        plinth = (ax <= hw_) & (Y >= y0) & (Y <= Dp) & (Z >= 0) & (Z < ph) & (cdx ** 2 + cdy ** 2 <= rc ** 2)
        stair = (ax < sw / 2) & (Y < 32) & (Z >= np.ceil(np.maximum(Y, 0.01) / 8) * (ph / 4))
        m[plinth & ~stair] = 1
        hallb = (ax <= mw / 2) & (Y >= ym0) & (Y <= yb) & (Z >= ph) & (Z < zt - 5)
        porch = (ax < pw / 2) & (Y < ym0 + 14) & (Z >= ph + 4) & (Z < zt - 12)
        ent = (ax < pw / 2 + 4) & (Y >= ym0 - 3) & (Y <= yb) & (Z >= zt - 12) & (Z < zt - 5)
        cor = (ax < mw / 2 + 2) & (Y >= ym0 - 4) & (Y <= yb + 2) & (Z >= zt - 5) & (Z < zt)
        roof = np.zeros(X.shape, bool)
        for i in range(nt):
            hx, fy, z0 = mw / 2 - 4 - i * sx_, ym0 + 4 + i * sy_, zt + i * 7
            by_ = yb - i * sy_ * 0.6
            roof |= (ax < hx) & (Y >= fy) & (Y <= by_) & (Z >= z0) & (Z < z0 + 4)
            roof |= (ax < hx + 2) & (Y >= fy - 2) & (Y <= by_ + 2) & (Z >= z0 + 4) & (Z < z0 + 7)
        m[(hallb & ~porch) | ent | cor | roof] = 3
        for i, sp in enumerate(spires):
            o = sp.occ(X, Y, Z) & (m == 0)
            m[o] = 10 + i
        sf = spires[-1]
        fy = sf.yc - 0.85 * sf.a - 2 * sf.p
        sk_w, sk_z0, sk_h = sf.a * 0.62, zt + 2, sf.h * 0.34
        dz = Z - (sk_z0 + sk_h - sk_w / 2)
        archd = np.where(dz > 0, np.hypot(X, dz), ax)
        suk = (archd < sk_w / 2) & (Y >= fy - 6) & (Y < fy + 2) & (Z >= sk_z0) & (Z < sk_z0 + sk_h)
        niche = (archd < sk_w / 2 - 4) & (Y < fy - 3) & (Z >= sk_z0 + 6)
        figure = (ax < 2.5) & (Z >= sk_z0 + 6) & (Z < sk_z0 + 6 + sk_h * 0.36) & (Y >= fy - 3) & (Y < fy)
        m[suk & ~niche] = 6
        m[figure & suk] = 7
        return m

    def paint(m, face, x, y, z):
        if m == 1:
            if face == 0:
                if y < 2 or abs(x) > W / 2 - 2:
                    return 1, 0
                u = (x + (9 if int(y // 22) % 2 else 0)) % 18
                return 1, (2 if ((u < 0.6 and y % 22 > 3) or (y % 22 < 0.6 and u > 3)) else 1)
            if z >= ph - 5:
                return 0, 1 if z >= ph - 2 else 2
            if z < 3:
                return 0, 4
            if brick_face:
                return 3, (4 if (z % 4 < 1 or (x + (3 if int(z // 4) % 2 else 0)) % 7 < 1) else 3)
            return 0, 3
        if m == 3:
            if face == 0:
                return 2, 1
            if abs(x) < pw / 2 and y > ym0 + 10 and ph + 4 <= z < zt - 12:
                return 2, 7 if z > zt - 16 else 6
            if z < ph + 4:
                return 2, 2 if z > ph + 3 else 3
            if z >= zt - 12:
                return 2, 1 if z % 7 > 5.5 else 2
            u = (x + (9 if int(z // 8) % 2 else 0)) % 18
            return 2, 3 if (z % 8 < 0.8 or u < 0.8) else 2
        if m == 6:
            return 0, 1 if face == 0 else 2
        if m == 7:
            return 0, 1
        return (1 if face == 0 else 0), spires[m - 10].paint(face, x, y, z)

    mg = 16
    H = int(peak + 70)
    c = C(W + 2 * mg, H)
    cx, base = mg + W // 2, H - 4
    so.carve(c, cx, base, -W / 2 - 4, W / 2 + 4, -2, Dp + 60, peak + 10, solid, paint, [stone, top, hall, BRICK])

    def at(x, y, z):
        return round(cx + x), round(base - z - K * y)
    _, wtop = at(0, ym0, zt - 16)
    _, wbot = at(0, ym0, ph + 6)
    jw = max(10, round((mw - pw) / 2) - 8)
    for side in (-1, 1):
        jx = round(cx + side * (pw / 2 + (mw - pw) / 4)) - jw // 2
        jali_screen(c, jx, wtop, jw, min(16, wbot - wtop), hall)
    _, ptop = at(0, ym0, zt - 12)
    _, pbot = at(0, ym0, ph + 4)
    for px in pil:
        pillar(c, round(cx + px) - 1, ptop, pbot, hall)
    toran(c, round(cx - pw / 2) + 1, round(cx + pw / 2) - 1, ptop + 1)
    for sp in reversed(spires):
        flown = sp.dress(c, cx, base, stone)
    zr = zt + nt * 7
    yr = (ym0 + 4 + (nt - 1) * sy_ + yb - (nt - 1) * sy_ * 0.6) / 2
    dx, dy = at(0, yr, zr)
    R = mw * 0.13
    so.dome(c, dx, dy + 1, R, hall, kind='hemi', courses=0, ribs=8)
    sa.gold_pot(c, dx, round(dy - R), 0.8)
    ex, ey = at(0, ym0 - 3, zt)
    sa.gold_pot(c, ex, ey, 0.75)
    flag(c, flown[0], flown[1] + 1, 22, lk['flag'], info=info)
    label = 'Jain temple' if s.get('jain') else 'Temple'
    return complete(c, info, mg, W, base, cx, pbot - ptop, jd, label=label, door_base=pbot,
                    door_width=round(pw) - 8, leaf=False)


# ------------------------------------------------------------------ dravida

def tier_face(c, x, foot, w, h, r, q):
    """The storey behind a ledge: a recessed face, its ends turned (lit on
    the left, shaded on the right), a dark window on the axis with its sill."""
    fy = foot - h
    c.rect(x, fy, w, h, r[q])
    c.rect(x, fy, 2, h, r[q - 1]); c.rect(x + w - 2, fy, 2, h, r[q + 1])
    c.rect(x + 2, foot - 1, w - 4, 1, r[q + 1])
    cx = x + w // 2
    c.rect(cx - 3, fy + 4, 6, h - 6, VOID)
    c.rect(cx - 3, fy + 4, 6, 1, mix(VOID, r[5], 0.45))
    c.rect(cx - 4, foot - 2, 8, 1, r[q - 1])
    e = ink(r)
    c.rect(x - 1, fy, 1, h, e); c.rect(x + w, fy, 1, h, e)


def pair(c, x, foot, h, a, b):
    """Two figures with a garland slung between them, standing on a deck."""
    post(c, x, foot, h, a)
    post(c, x + 9, foot, h, a)
    y = foot - h + 3
    c.rect(x + 4, y, 5, 1, b[1]); c.rect(x + 4, y + 1, 5, 1, b[2]); c.rect(x + 4, y + 2, 5, 1, b[4])
    c.rect(x + 4, y - 1, 5, 1, b[5]); c.rect(x + 4, y + 3, 5, 1, b[5])


def kuta(c, x, foot, r):
    """A little domed pavilion on a deck: the plain tiers' ornament."""
    post(c, x, foot, 7, r)
    so.ellipse(c, x + 2, foot - 8, 3, 2, r[1])
    c.p(x + 1, foot - 9, r[0])


def tiers(c, cx, y, w0, w1, n, r, top, paint=None, fh=16, dh=11, inset=6):
    """Storeys of a Dravida tower as Stardew would stack them: each a ledge
    seen from above with the storey's recessed face standing at its back and
    figures (or little pavilions) standing on the deck in front of it, the
    next ledge's lip shading the face's top. `y` is the row under the first
    ledge's lip. Returns (row under the next lip, width of the last ledge)."""
    lw = w0
    for k in range(n):
        lw = round(w0 - (w0 - w1) * k / max(1, n - 1))
        x = cx - lw // 2
        ty = ledge(c, x, y, lw, dh, r, top)
        if k:
            fp.cast_down(c, fx, fx + fw, y + 1, 2, 0.32)
        fw = lw - 2 * inset
        fx = cx - fw // 2
        tier_face(c, fx, ty + 3, fw, fh, r, 2 if paint else 3)
        foot = y - 5
        spots = [(cx - round(fw * 0.27) - 6, True), (cx + round(fw * 0.27) - 7, True),
                 (fx + 2, False), (fx + fw - 6, False)]
        for j, (px, double) in enumerate(spots):
            if paint:
                a, b = paint[(j + k) % len(paint)], paint[(j + k + 1) % len(paint)]
                pair(c, px, foot, 9, a, b) if double else post(c, px, foot, 9, a)
            elif not double or fw > 70:
                kuta(c, px + (2 if double else 0), foot, r)
        y = ty + 3 - fh + 4
    fp.cast_down(c, fx, fx + fw, y + 1, 2, 0.32)
    return y, lw


def grooved(r):
    """The granite ground storey: pilasters cut as grooves, a band at the foot."""
    def paint(c, x, y, w, h):
        bevel(c, x, y, w, h, r, 3)
        for px in list(range(x + 6, x + w // 2 - 16, 9)) + list(range(x + w - 8, x + w // 2 + 16, -9)):
            c.rect(px, y + 6, 1, h - 12, r[4]); c.rect(px + 1, y + 6, 1, h - 12, r[2])
        c.rect(x, y + h - 6, w, 1, r[2]); c.rect(x, y + h - 5, w, 1, r[4])
    return paint


def gopuram(c, cx, base, w, n, r, top, stone, paint=None, pots=5):
    """The gate tower: a granite storey round a framed doorway, then the
    stucco storeys on their ledges, the crown with its horseshoe gable and
    its row of pots on the last deck."""
    h0 = 54
    fy = base - h0
    grooved(stone)(c, cx - w // 2, fy, w, h0)
    e = ink(stone)
    c.rect(cx - w // 2 - 1, fy, 1, h0, e); c.rect(cx + w // 2 - w % 2 + 1, fy, 1, h0, e)
    framed_door(c, cx, base, 20, 40, stone)
    y, lw = tiers(c, cx, fy + 3, w + 8, round(w * 0.62), n, r, top, paint)
    cw = lw - 14
    gr = paint[2] if paint else r
    ty = ledge(c, cx - (cw + 8) // 2, y, cw + 8, 8, r, top)
    if True:
        fp.cast_down(c, cx - cw // 2, cx + cw // 2, y + 1, 2, 0.32)
    tier_face(c, cx - cw // 2, ty + 3, cw, 16, r, 3)
    gy = ty + 3 - 16
    for yy in range(gy + 2, ty + 3):
        for xx in range(cx - 7, cx + 7):
            dx, dy = xx + 0.5 - cx, yy + 0.5 - (gy + 9)
            if dy > 0 or dx * dx + dy * dy <= 49:
                rim = (abs(dx) > 5.5) if dy > 0 else dx * dx + dy * dy > 30
                c.p(xx, yy, gr[1] if rim and dx < 0 else gr[3] if rim else gr[2])
    c.rect(cx - 3, gy + 9, 6, ty + 3 - gy - 9, gr[5])
    cty = ledge(c, cx - (cw + 6) // 2, gy + 4, cw + 6, 9, r, top)
    fp.cast_down(c, cx - cw // 2, cx + cw // 2, gy + 5, 2, 0.3)
    pot_row(c, cx, gy - 2, cw - 6, pots)
    return cty - 20


def vimana(c, cx, foot, w, n, r, top, paint=None, dome=None):
    """The shrine tower over the god: storeys on their ledges, a neck and the
    ribbed dome with its pot."""
    y, lw = tiers(c, cx, foot, w, round(w * 0.55), n, r, top, paint, fh=16, dh=10)
    nw = round(lw * 0.5)
    ty = ledge(c, cx - (nw + 8) // 2, y, nw + 8, 6, r, top)
    tier_face(c, cx - nw // 2, ty + 3, nw, 8, r, 3)
    R = round(lw * 0.38)
    so.dome(c, cx, ty - 2, R, dome or top, kind='hemi', courses=0, ribs=10)
    kalasha(c, cx, ty - 2 - R - 1, 1.4)
    return ty - R - 18


def cloister(r):
    """The back wall's inner face: the pillared walk along it, a beam over
    square piers, dark bays with light on their floor."""
    def paint(c, x, y, w, h):
        bevel(c, x, y, w, h, r, 3)
        for px in range(x + 5, x + w - 8, 12):
            c.rect(px, y + 4, 8, h - 6, VOID)
            c.rect(px, y + 4, 8, 1, mix(VOID, r[5], 0.4))
            c.p(px, y + 4, r[3]); c.p(px + 7, y + 4, r[3])
            c.rect(px, y + h - 3, 8, 1, mix(VOID, r[4], 0.45))
        c.rect(x, y + 3, w, 1, r[4])
    return paint


def dravida(spec, info):
    s = {**dict(size='medium', look='painted'), **spec}
    size, look = s['size'], s['look']
    W = {'small': 168, 'medium': 220, 'large': 288}[size]
    m = 14
    n_g = {'painted': {'small': 3, 'medium': 4, 'large': 6},
           'granite': {'small': 2, 'medium': 2, 'large': 3},
           'village': {'small': 2, 'medium': 3, 'large': 3}}[look][size]
    n_v = {'granite': {'small': 3, 'medium': 4, 'large': 5},
           'village': {'small': 3, 'medium': 3, 'large': 4}}.get(look, {}).get(size, 0)
    gw = round(W * 0.46)
    vw = round(W * {'painted': 0.4, 'granite': 0.6, 'village': 0.36}[look])
    if look == 'painted':
        r, top, stone, paint, vr, dome = PASTEL, PASTEL, GRANITE, PAINT, None, None
    elif look == 'granite':
        r, top, stone, paint, vr, dome = GRANITE, GRANITE_TOP, GRANITE, None, BUFF, BUFF_TOP
    else:
        r, top, stone, paint, vr, dome = WHITE, WHITE, WHITE, None, WHITE, GRANITE_TOP
    wall_r = WHITE if look == 'village' else GRANITE_TOP
    wall_h, back_h = 30, 20
    court = {'small': 84, 'medium': 104, 'large': 128}[size]
    c = C(W + 2 * m, 720)
    L, R, cx = m, m + W, m + W // 2
    base = c.h - 6

    def stripes(c, x, y, w, h):
        for xx in range(x, x + w):
            c.rect(xx, y, 1, h, (OCHRE_RED if ((xx - x) // 8) % 2 else WHITE)[2 if (xx - x) % 8 else 3])
        c.rect(x, y, w, 1, WHITE[1]); c.rect(x, y + h - 1, w, 1, WHITE[4])
    g = enclosure(c, L, R, base, wall_h, court, back_h, wall_r, wall_r, masonry(COURT, 14, 7, 2),
                  inner=cloister(wall_r))
    vtop = g['top']
    # Madurai's gate towers hide the shrine behind them; elsewhere it rises over the gate.
    if n_v:
        vfoot = g['back'] + round(court * 0.55)
        vtop = vimana(c, cx, vfoot, vw, n_v, vr, vr, dome=dome)
        for k in range(5):
            for xx in range(cx - vw // 2 + 4, cx + vw // 2 + 10):
                fp.shade(c, xx, vfoot + 1 + k, 0.28 * (1 - k / 5))
    flagstaff(c, cx + gw // 2 + 30, g['fc'] - 8, 50, wall_r)
    front_wall(c, L, R, base, wall_h, stripes if look == 'village' else masonry(wall_r, 16, 8, 2),
               wall_r, wall_r)
    gtop = gopuram(c, cx, base, gw, n_g, r, top, stone if look != 'village' else WHITE, paint,
                   pots=5 if size != 'large' else 7)
    ground_shadow(c, L, R, base + 1, 3)
    crop = max(0, min(gtop, vtop, g['top']) - 4)
    c.im = c.im.crop((0, crop, c.w, c.h))
    c.im.info['glass'] = c.glass
    c.px = c.im.load()
    c.h -= crop
    return complete(c, info, L, W, base - crop, cx, 40, round(court + 28), label='Temple')


# ------------------------------------------------------------------ stupa

def stupa_body(c, cx, by, R, r, top, drum_h=12, anda=None, chhatras=3):
    """Drum, hemispherical dome, harmika and parasols."""
    so.lathe(c, cx, by, [(0, R), (drum_h, R), (drum_h, R - 3), (drum_h + 2, R - 3)], r, courses=4)
    A = anda or R - 4
    n = 14
    prof = [(drum_h + 2 + A * 0.9 * i / n, A * math.sqrt(max(0.0, 1 - (i / n) ** 2))) for i in range(n + 1)]
    so.lathe(c, cx, by, prof, top, courses=0)
    crown = by - drum_h - 2 - round(A * 0.9) + round(A * 0.18)
    harmika(c, cx, crown + 4, max(10, R // 3), r)
    chhatra(c, cx, crown - 8, chhatras, r, w=max(12, R // 2))
    return crown - 8 - chhatras * 5 - 4


def stupa(spec, info):
    s = {**dict(size='medium', look='sanchi'), **spec}
    size, look = s['size'], s['look']
    R = {'small': 30, 'medium': 40, 'large': 48}[size]
    vihara = look == 'vihara' and size != 'small'
    W = 2 * R + 56 + (110 if vihara else 0)
    m = 14
    H = round(R * 0.9 + R * K + 120 + (30 if look != 'sanchi' else 0))
    c = C(W + 2 * m, H)
    L = m
    base = H - 6
    cx = L + R + 28 if vihara else L + W // 2
    if look == 'sanchi':
        r, top = BUFF, BUFF_TOP
        by = base - round(R * K) - 26
        so.lathe(c, cx, by + 8, [(0, R + 14), (2, R + 14)], top)
        tip = stupa_body(c, cx, by, R, r, top, drum_h=14)
        railing(c, cx, by + 8, R + 12, 13, r)
        torana(c, cx, base - 1, 30, 36, DARK_BUFF)
        door_h, depth, doorless = 40, 2 * R + 30, False
    else:
        r, top = (BRICK, WHITE)
        tb = base
        for k, (tw, th) in enumerate(((2 * R + 40, 14), (2 * R + 22, 12))):
            def tface(c, x, y, w, h):
                fm.render(c, x, y, w, h, WHITE)
                fm.brick(c, x, y + h - 4, w, 4, BRICK)
                for px in range(x + 6, x + w - 4, 12):
                    c.rect(px, y + 2, 3, h - 6, WHITE[3])
            so.box(c, cx - tw // 2, tb, tw, th, 24, tface, LIME)
            tb -= th + 6
        by = tb - round(R * K * 0.5)
        tip = stupa_body(c, cx, by, R, WHITE, WHITE, drum_h=10, chhatras=5)
        steps(c, cx, base, 22, 8, WHITE, rise=3)
        door_h, depth, doorless = 0, 2 * R + 50, True
    if vihara:
        vx = cx + R + 30
        vw = W - (vx - L) - 4
        vb = base - 4
        so.box(c, vx, vb, vw, 46, 40, lambda c, x, y, w, h: fm.brick(c, x, y, w, h, BRICK), LIME)
        ft = vb - 46
        fp.parapet(c, vx, ft, vw, LIME, 'plain')
        for xx in range(vx + 8, vx + vw - 10, 14):
            if abs(xx + 3 - (vx + vw // 2)) > 18:
                c.rect(xx - 1, vb - 34, 8, 14, BRICK[1])
                c.rect(xx, vb - 33, 6, 12, VOID)
        dx = vx + vw // 2
        arch_door(c, dx, vb, 22, 44, WHITE, 'round', leaf=True)
        door_h, doorless = 44, False
        cxd = dx
    else:
        cxd = cx
    ground_shadow(c, L, L + W, base + 1, 3)
    label = 'Monastery' if size == 'large' else 'Stupa'
    return complete(c, info, L, W, base, cxd, door_h, depth, doorless=doorless, leaf=False if not vihara else True,
                    label=label)


# ------------------------------------------------------------------ gurdwara

def gilt_dome(c, cx, by, R, drum=6):
    """The gurdwara's ribbed lotus dome in gilt copper, its petals at the
    foot, a kalash on top."""
    so.dome(c, cx, by, R, GOLD, kind='onion', courses=0, ribs=14, drum=drum)
    top = by - drum - round(R * 1.5)
    kalasha(c, cx, top + 2, 1.2)
    for a in range(-5, 6):
        px = cx + round(a * R / 5.4)
        c.rect(px - 1, by - drum - 3, 3, 3, GOLD[1 if a < 0 else 3])
    return top - 10


def khanda_flag(c, x, base, h):
    """The Nishan Sahib: a tall staff clad in saffron cloth, its pennant, and
    the khanda at the top."""
    for yy in range(base - h, base):
        c.p(x, yy, SAFFRON[2]); c.p(x + 1, yy, SAFFRON[4])
    for yy in range(base - h + 6, base, 5):
        c.p(x, yy, SAFFRON[1])
    so.box(c, x - 5, base + 1, 12, 5, 10, WHITE)
    for k in range(18):
        dip = round(1.5 * math.sin(k / 18 * math.pi * 1.5))
        hh = max(2, 12 - k * 12 // 22)
        for j in range(hh):
            c.p(x + 2 + k, base - h + 4 + j + dip, SAFFRON[2 if j < hh // 2 else 3])
    c.rect(x, base - h - 8, 2, 8, GOLD[1])
    for side in (-1, 1):
        c.p(x + (side if side > 0 else -1) * 2, base - h - 5, GOLD[2]); c.p(x + (3 if side > 0 else -2), base - h - 3, GOLD[2])
    so.ellipse(c, x + 1, base - h - 4, 3, 2, GOLD[3])
    c.rect(x, base - h - 8, 2, 8, GOLD[1])


def gurdwara(spec, info):
    s = {**dict(size='medium'), **spec}
    size = s['size']
    m = 16
    if size == 'large':
        return harmandir(spec, info)
    W = {'small': 150, 'medium': 200}[size]
    hall_h = 54
    H = hall_h + 14 + 130
    c = C(W + 2 * m + 24, H)
    L, cx = m, m + W // 2
    base = H - 6
    plinth = 8
    so.box(c, L - 4, base, W + 8, plinth, 60, moulded(MARBLE), MARBLE)
    foot = base - plinth
    so.box(c, L, foot, W, hall_h, 70, lambda c, x, y, w, h: fm.render(c, x, y, w, h, WHITE), WHITE)
    ftop = foot - hall_h
    R = {'small': 24, 'medium': 30}[size]
    gilt_dome(c, cx, ftop - 12, R, drum=8)
    for side in (-1, 1):
        sa.chhatri(c, cx + side * (W // 2 - 14), ftop - 3, 9, WHITE, WHITE, GOLD)
    if size == 'medium':
        for side in (-1, 1):
            sa.chhatri(c, cx + side * (R + 22), ftop - 16, 7, WHITE, WHITE, GOLD)
    sa.chhajja(c, L, L + W, ftop + 4, WHITE)
    fp.parapet(c, L, ftop, W, WHITE, 'plain')
    n = 2 if size == 'small' else 3
    for k in range(n):
        for side in (-1, 1):
            ax = cx + side * (34 + k * 26)
            if L + 12 < ax < L + W - 12:
                sa.surround(c, ax, foot - 22, 14, foot - 6, WHITE, band=2)
                sa.recess(c, ax, foot - 22, 14, foot - 6, WHITE)
    sa.surround(c, cx, foot - 22, 24, foot, MARBLE, band=3)
    sa.recess(c, cx, foot - 22, 24, foot, WHITE)
    c.rect(cx - 12, foot - 4, 24, 4, MARBLE[3])
    khanda_flag(c, L + W + 10, base - 2, 118)
    ground_shadow(c, L, L + W + 16, base + 1, 3)
    return complete(c, info, L, W + 20, base, cx, 42, 90, label='Gurdwara')


def harmandir(spec, info):
    """The gilded shrine standing in its tank, the causeway out to it."""
    m = 16
    W = 280
    H = 250
    c = C(W + 2 * m, H)
    L, cx = m, m + W // 2
    base = H - 6
    so.box(c, L, base, W, 6, 200, MARBLE, lambda c, x, y, w, h: paving(MARBLE)(c, x, y, w, h))
    top = base - 6
    so.recess(c, L + 10, top - 6, W - 20, 150, 6, MARBLE, MARBLE, water=WATER)
    for yy in range(top - 80, top - 6, 7):
        for xx in range(L + 18, L + W - 18, 23):
            c.rect(xx + (yy // 7) % 3 * 5, yy, 6, 1, WATER[1])
    c.rect(cx - 9, top - 74, 18, 68, MARBLE[2])
    c.rect(cx - 9, top - 74, 1, 68, MARBLE[1]); c.rect(cx + 8, top - 74, 1, 68, MARBLE[4])
    for yy in range(top - 74, top - 6, 8):
        c.p(cx - 10, yy, GOLD[2]); c.p(cx + 9, yy, GOLD[2])
    sfoot = top - 74
    sw = 92
    so.box(c, cx - sw // 2, sfoot, sw, 30, 60, moulded(MARBLE), MARBLE)
    ftop = sfoot - 30
    so.box(c, cx - sw // 2 + 4, ftop, sw - 8, 34, 54, GOLD, GOLD)
    for ax in range(cx - sw // 2 + 14, cx + sw // 2 - 8, 16):
        sa.surround(c, ax, ftop - 12, 9, ftop - 3, GOLD, band=1)
        sa.recess(c, ax, ftop - 12, 9, ftop - 3, GOLD)
    utop = ftop - 34
    fp.parapet(c, cx - sw // 2 + 4, utop, sw - 8, GOLD, 'plain')
    gilt_dome(c, cx, utop - 10, 20, drum=6)
    for side in (-1, 1):
        sa.chhatri(c, cx + side * (sw // 2 - 8), utop - 2, 6, GOLD, GOLD, GOLD)
    sa.surround(c, cx, sfoot - 8, 18, sfoot, GOLD, band=2)
    sa.recess(c, cx, sfoot - 8, 18, sfoot, GOLD)
    c.rect(cx - 9, sfoot - 1, 18, 1, MARBLE[1])
    khanda_flag(c, L + 2, base - 1, 140)
    return complete(c, info, L, W, base, cx, 40, 200, label='Gurdwara')


# ------------------------------------------------------------------ newar

def newar(spec, info):
    s = {**dict(size='medium'), **spec}
    size = s['size']
    roofs = {'small': 2, 'medium': 3, 'large': 5}[size]
    plinths = {'small': 2, 'medium': 3, 'large': 5}[size]
    w0 = {'small': 64, 'medium': 74, 'large': 82}[size]
    W = w0 + 2 * 28 + plinths * 12
    m = 16
    H = plinths * 10 + 50 + roofs * 34 + 60
    c = C(W + 2 * m, H)
    L, cx = m, m + W // 2
    base = H - 6
    brick = RAMPS['brick-dark']
    y = base
    for k in range(plinths):
        pw = W - k * 12
        so.box(c, cx - pw // 2, y, pw, 9, 16, lambda c, x, y, w, h: fm.brick(c, x, y, w, h, brick),
               [brick[1], brick[3], brick[2]] + list(brick[3:]))
        y -= 9 + 3
    deck = y + 3
    for k in range(plinths):
        sy = base - k * 12
        for side in (-1, 1):
            lion(c, cx + side * 20, sy - 9, RAMPS['sandstone'], side)
    steps(c, cx, base, 26, plinths * 4, RAMPS['sandstone'], rise=3)
    tone = NEWAR_TILE
    bw = w0
    wh = 48
    so.box(c, cx - bw // 2, deck, bw, wh, bw, lambda c, x, y, w, h: fm.brick(c, x, y, w, h, brick), brick)
    yy = deck - wh
    for dx in (-22, 0, 22) if size != 'small' else (-14, 14):
        dw = 16
        c.rect(cx + dx - dw // 2 - 3, deck - 42, dw + 6, 42, TIMBER[2])
        c.rect(cx + dx - dw // 2 - 3, deck - 42, dw + 6, 1, TIMBER[0])
        c.rect(cx + dx - dw // 2 - 6, deck - 46, dw + 12, 4, TIMBER[1])
        for k in range(0, 40, 4):
            c.rect(cx + dx - dw // 2, deck - 39 + k, dw, 2, TIMBER[5 if k % 8 else 6])
        c.rect(cx + dx - dw // 2, deck - 39, dw, 39, mix(VOID, TIMBER[6], 0.3)) if dx == 0 or size == 'small' else None
    door_x = cx if size != 'small' else cx - 14
    for k in range(roofs):
        rw = bw + 44 - k * 8
        if k:
            sw = bw - k * 10
            c.rect(cx - sw // 2, yy - 18, sw, 18, brick[3])
            for xx in range(cx - sw // 2 + 4, cx + sw // 2 - 4, 10):
                c.rect(xx, yy - 14, 6, 10, TIMBER[5]); c.rect(xx, yy - 14, 6, 1, TIMBER[2])
            yy -= 18
        for side in (-1, 1):
            for j in range(4):
                sx = cx + side * (bw // 2 - 4 - k * 5 - j * 9)
                for t in range(12):
                    c.p(sx + side * (t // 2), yy - 2 + t // 3 - 3, TIMBER[3 if side < 0 else 4])
        cover = tone if k < roofs - 1 or size == 'small' else GOLD
        px, ridge = fp.roof_band(c, cx - rw // 2, cx + rw // 2, yy, 20, 'plain', cover, hip=0.62)
        for xx in range(cx - rw // 2, cx + rw // 2, 3):
            c.p(xx, yy + 7, GOLD[2])
        yy = ridge - 2
    so.lathe(c, cx, yy + 6, [(0, 7), (6, 6), (10, 3), (16, 2.5), (20, 1), (26, 0.5)], GOLD, courses=4)
    ground_shadow(c, L, L + W, base + 1, 3)
    return complete(c, info, L, W, base, door_x, 39 if size != 'small' else 39, W, label='Temple')


# ------------------------------------------------------------------ catalogue

BUILDERS = {
    'nagara': nagara,
    'dravida': dravida,
    'stupa': stupa,
    'gurdwara': gurdwara,
    'newar': newar,
}


def _scales(kind, looks, describe, labels=None, roof='gable', **extra):
    out = {}
    for size in ('small', 'medium', 'large'):
        out[size] = [(kind, dict(size=size, look=lk, description=describe, roof=roof,
                                 **({'label': labels[size]} if labels else {}), **extra)) for lk in looks]
    return out


SPECS = {
    'nagara-temple': _scales('nagara', ('buff', 'laterite', 'brick', 'white'),
                             'A temple on its platform: the pillared porch, the hall, and the curved tower over the god\'s shrine.',
                             {'small': 'Shrine', 'medium': 'Temple', 'large': 'Great temple'}),
    'dravida-temple': _scales('dravida', ('painted', 'granite', 'village'),
                              'A walled temple: the gate tower over the way in, and the shrine tower of the god inside.',
                              {'small': 'Temple', 'medium': 'Temple', 'large': 'Great temple'}),
    'jain-temple': {size: [('nagara', dict(size=size, look='buff', jain=True, label='Jain temple',
                                           description='A marble Jain temple: a cluster of towers over the shrine of a Tirthankara, a domed hall before it.'))]
                    for size in ('small', 'medium', 'large')},
    'stupa': _scales('stupa', ('sanchi', 'brick', 'vihara'),
                     'A stupa: a dome over relics of the Buddha, walked round by pilgrims.',
                     {'small': 'Stupa', 'medium': 'Stupa', 'large': 'Monastery'}, roof='dome'),
    'gurdwara': {size: [('gurdwara', dict(size=size, label='Gurdwara', roof='dome',
                                          description='A gurdwara: the hall where the Guru Granth Sahib is read, open to all, with its kitchen for anyone who comes.'))]
                 for size in ('small', 'medium', 'large')},
    'newar-temple': {size: [('newar', dict(size=size, label='Temple',
                                           description='A pagoda temple of the Kathmandu valley: brick and carved timber under tiered roofs.'))]
                     for size in ('small', 'medium', 'large')},
}
