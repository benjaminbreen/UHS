"""Temples, stupas and gurdwaras of South Asia, front-on.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-southasia.png southasia

Nagara and Dravida temples, the Jain temple, the stupa, the gurdwara and
the Newar pagoda, each from a spec (the Sri Lankan dagoba is in
front_sacred_ancient). The contract is in front_sacred.py.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_southasia as sa  # noqa: E402
from art.front_sacred import complete, arch_door, steps, flag, ground_shadow, VOID, GOLD  # noqa: E402

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


# ------------------------------------------------------------------ parts

def face(c, x, y, w, h, r, q=3):
    """A flat face: lit on its left edge, shaded on its right."""
    c.rect(x, y, w, h, r[q])
    c.rect(x, y, 1, h, r[max(0, q - 1)])
    c.rect(x + w - 1, y, 1, h, r[min(7, q + 1)])


def slab(c, x, y, w, r, top=None, lip=3):
    """A projecting cornice slab: its top seen from above, its lit lip, the
    shadow it throws on the wall below."""
    top = top or r
    c.rect(x, y - 2, w, 2, top[1])
    c.rect(x, y, w, lip, r[2])
    c.rect(x, y, w, 1, r[0])
    c.rect(x + w - 1, y, 1, lip, r[4])
    fp.cast_down(c, x + 1, x + w - 1, y + lip, 2, 0.32)


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


def wall_with_rathas(c, x, y, w, h, r, n=3):
    """A temple wall broken into offsets (rathas): the middle stands proud and
    lit, the recesses in shade, a niche in the middle offset."""
    face(c, x, y, w, h, r, 3)
    seg = w / (2 * n - 1)
    for k in range(2 * n - 1):
        x0 = round(x + k * seg)
        x1 = round(x + (k + 1) * seg)
        proud = k % 2 == 0
        c.rect(x0, y, x1 - x0, h, r[2 if proud else 4])
        c.rect(x0, y, 1, h, r[1 if proud else 5])
        c.rect(x1 - 1, y, 1, h, r[4 if proud else 5])
    for k in range(0, h, 9):
        c.rect(x, y + k, w, 1, r[1])
        c.rect(x, y + k + 1, w, 1, r[4])
    nw = max(6, round(seg) - 6)
    c.rect(x + w // 2 - nw // 2, y + 10, nw, h - 20, r[5])
    c.rect(x + w // 2 - nw // 2 + 2, y + 13, nw - 4, h - 26, r[6])
    c.rect(x + w // 2 - 2, y + 15, 4, h - 30, r[3])


def phamsana(c, cx, foot, w, tiers, r, top=None, th=8, kalasha=True):
    """A stepped pyramidal roof: slabs each narrower than the one below,
    a dark recess between, a bell and pot on top."""
    top = top or r
    y = foot
    for k in range(tiers):
        tw = round(w * (1 - 0.6 * k / max(1, tiers)))
        x = cx - tw // 2
        c.rect(x + 2, y - th, tw - 4, th - 4, r[5])
        c.rect(x + 2, y - th, tw - 4, 1, r[6])
        slab(c, x, y - 4, tw, r, top, 4)
        y -= th
    so.lathe(c, cx, y + 2, [(0, w * 0.12), (3, w * 0.16), (6, w * 0.14), (9, w * 0.06)], r, ribs=10)
    tip = y - 7
    if kalasha:
        so.lathe(c, cx, tip, [(0, 2), (3, 3.5), (6, 2.5), (8, 1), (10, 0.6)], GOLD)
    return tip - 9


def pillared(c, x, base, w, h, r, pitch=13):
    """An open porch: dark within, square pillars with brackets, a low
    seat-back wall either side of the way in."""
    c.rect(x, base - h, w, h, mix(VOID, r[6], 0.35))
    c.rect(x, base - h, w, 4, mix(VOID, r[6], 0.15))
    n = max(2, round(w / pitch))
    for k in range(n + 1):
        px = round(x + k * (w - 5) / n)
        c.rect(px, base - h, 5, h, r[3])
        c.rect(px, base - h, 1, h, r[1]); c.rect(px + 1, base - h, 1, h, r[2])
        c.rect(px + 4, base - h, 1, h, r[5])
        for yy in (base - h + 6, base - h + h // 2):
            c.rect(px, yy, 5, 2, r[1])
        c.rect(px - 2, base - h, 9, 2, r[2])
    gap = 26
    for sx, sw in ((x, w // 2 - gap // 2), (x + w // 2 + gap // 2, w // 2 - gap // 2)):
        c.rect(sx, base - 12, sw, 12, r[3])
        c.rect(sx, base - 12, sw, 2, r[1])
        c.rect(sx, base - 5, sw, 1, r[4])


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

NAGARA_LOOKS = {
    'buff': (BUFF, BUFF_TOP),
    'laterite': (LATERITE, LATERITE_TOP),
    'brick': (BRICK, LIME),
}


def nagara(spec, info):
    s = {**dict(size='medium', look='buff', jain=False), **spec}
    r, top = NAGARA_LOOKS[s['look']] if not s['jain'] else (MARBLE, MARBLE)
    size = s['size']
    W, ws, wall_h = {'small': (132, 66, 40), 'medium': (180, 78, 46), 'large': (236, 92, 52)}[size]
    if s['jain']:
        W += 40
    sh = {'small': 92, 'medium': 116, 'large': 140}[size] + (14 if s['look'] == 'laterite' else 0)
    jh = 15 if not s['jain'] else 21
    jd = {'small': 110, 'medium': 136, 'large': 170}[size]
    m = 18
    tall = jh + 30 + wall_h + sh + 46
    H = tall + 16
    c = C(W + 2 * m, H)
    L, cx = m, m + W // 2
    base = H - 6
    deck = base - jh
    shrine = deck - 16
    face_fn = moulded(r)
    if s['look'] == 'brick':
        def face_fn(c, x, y, w, h):
            fm.brick(c, x, y, w, h, r)
            for k in range(0, h, 8):
                c.rect(x, y + k, w, 1, LIME[2])
    so.box(c, L, base, W, jh, 36, face_fn, paving(top))
    if s['jain']:
        for side in (-1, 1):
            dx = cx + side * (W // 2 - 26)
            so.box(c, dx - 14, deck - 12, 28, 28, 24, r)
            wall_with_rathas(c, dx - 14, deck - 40, 28, 28, r, 2)
            sa.shikhara(c, dx, deck - 38, 28, 44, top)
    so.box(c, cx - ws // 2, shrine, ws, wall_h, 44, r, top)
    wall_with_rathas(c, cx - ws // 2, shrine - wall_h, ws, wall_h, r)
    sfoot = shrine - wall_h + 3
    sa.shikhara(c, cx, sfoot, ws + 2, sh, top)
    tip = sfoot - sh - 12
    if size == 'large' or s['jain']:
        for side in (-1, 1):
            sa.shikhara(c, cx + side * round(ws * 0.36), sfoot + 6, round(ws * 0.46), round(sh * 0.5), top)
        sa.shikhara(c, cx, sfoot + 10, round(ws * 0.62), round(sh * 0.62), top)
    if s['jain']:
        jain_flag(c, cx + 1, tip, 30)
    else:
        flag(c, cx + 1, tip + 2, 16, SAFFRON, w=11, fh=7)
    if size != 'small':
        mw = round(ws * 0.86)
        mfoot = deck - 9
        so.box(c, cx - mw // 2, mfoot, mw, 40, 30, r, top)
        face(c, cx - mw // 2, mfoot - 40, mw, 40, r, 3)
        for jx in (cx - mw // 2 + 8, cx + mw // 2 - 22):
            sa.jali(c, jx, mfoot - 30, 14, 16, r)
        if s['jain']:
            so.box(c, cx - mw // 2 - 2, mfoot - 40, mw + 4, 3, 30, r, top)
            so.dome(c, cx, mfoot - 52, mw // 3, top, kind='hemi', courses=3, drum=4)
            kalasha(c, cx, mfoot - 52 - 4 - mw // 3 - 1)
            for side in (-1, 1):
                sa.chhatri(c, cx + side * (mw // 2 - 4), mfoot - 44, 7, r, top, top)
        else:
            phamsana(c, cx, mfoot - 40, mw + 8, 5 if size == 'large' else 4, r, top, th=9)
    pw = {'small': 48, 'medium': 56, 'large': 62}[size]
    pfoot = deck - 2
    so.box(c, cx - pw // 2, pfoot, pw, 42, 18, r, top)
    pillared(c, cx - pw // 2, pfoot, pw, 42, r)
    if s['jain']:
        sa.surround(c, cx, pfoot - 20, 22, pfoot, r, band=2)
    phamsana(c, cx, pfoot - 42, pw + 10, 3, r, top, th=8)
    steps(c, cx, base, 34, 5, top)
    ground_shadow(c, L, L + W, base + 1, 3)
    label = 'Jain temple' if s['jain'] else 'Temple'
    return complete(c, info, L, W, base, cx, 40, jd, label=label)


def jain_flag(c, x, top, h):
    """The Jain temple's flag: red and white in long bands, on a gilt staff."""
    for yy in range(top - h, top):
        c.p(x, yy, GOLD[2]); c.p(x + 1, yy, GOLD[4])
    for k in range(16):
        dip = round(1.4 * math.sin(k / 16 * math.pi * 1.4))
        hh = max(3, 10 - k // 3)
        for j in range(hh):
            col = (RED if (j * 3 // hh) % 2 == 0 else WHITE)[2 if k < 10 else 3]
            c.p(x + 2 + k, top - h + 2 + j + dip, col)


# ------------------------------------------------------------------ dravida

def vimana(c, cx, foot, w, tiers, r, top, paint=None):
    """The shrine tower: a pilastered storey, then tiers each set back,
    every tier ringed with little pavilions, an octagonal domed cap."""
    h0 = 40
    so.box(c, cx - w // 2, foot, w, h0, w, r, top)
    face(c, cx - w // 2, foot - h0, w, h0, r, 3)
    for px in range(cx - w // 2 + 4, cx + w // 2 - 4, 10):
        c.rect(px, foot - h0 + 4, 3, h0 - 8, r[2]); c.rect(px + 2, foot - h0 + 4, 1, h0 - 8, r[4])
    c.rect(cx - 6, foot - h0 + 10, 12, 22, r[5]); c.rect(cx - 4, foot - h0 + 13, 8, 17, r[6])
    y = foot - h0
    for k in range(tiers):
        tw = round(w * (1 - 0.52 * k / tiers))
        x = cx - tw // 2
        slab(c, x - 2, y - 3, tw + 4, r, top, 3)
        th = 13
        c.rect(x, y - 3 - th, tw, th, r[4])
        c.rect(x, y - 3 - th, tw, 1, r[5])
        n = max(2, tw // 12)
        for j in range(n):
            px = round(x + 2 + j * (tw - 10) / max(1, n - 1))
            end = j in (0, n - 1)
            pw = 8
            col = paint[(j + k) % len(paint)] if paint else r
            c.rect(px, y - 3 - th + 4, pw, th - 4, col[3])
            c.rect(px, y - 3 - th + 4, 1, th - 4, col[2])
            c.rect(px + 2, y - 3 - th + 7, pw - 4, th - 9, col[5])
            if end:
                so.ellipse(c, px + 4, y - 3 - th + 3, 4.5, 3, col[2])
                c.rect(px + 1, y - 3 - th + 1, 6, 1, col[1])
            else:
                c.rect(px, y - 3 - th + 1, pw, 3, col[2])
                c.rect(px, y - 3 - th + 1, pw, 1, col[1])
        y -= th + 3
    gw = max(10, round(w * 0.3))
    c.rect(cx - gw // 2, y - 8, gw, 8, r[4])
    c.rect(cx - gw // 2, y - 8, 1, 8, r[2])
    R = max(8, round(w * 0.24))
    so.dome(c, cx, y - 6, R, top, kind='hemi', courses=0, ribs=8)
    kalasha(c, cx, y - 6 - R - 1, 1.3)
    return y - 6 - R - 14


def gopuram(c, cx, base, w, tiers, r, top, paint=None, stone=None, wash=False):
    """The gate tower: a stone storey with the doorway, then brick tiers
    tapering up, a barrel-vaulted crown with its row of pots."""
    stone = stone or r
    h0 = 54
    so.box(c, cx - w // 2, base, w, h0, 28, stone, top)
    face(c, cx - w // 2, base - h0, w, h0, stone, 3)
    for px in range(cx - w // 2 + 3, cx + w // 2 - 3, 9):
        if abs(px + 1 - cx) < 16:
            continue
        c.rect(px, base - h0 + 6, 3, h0 - 10, stone[2]); c.rect(px + 2, base - h0 + 6, 1, h0 - 10, stone[4])
    for k in range(0, h0, 13):
        c.rect(cx - w // 2, base - h0 + k, w, 1, stone[2])
    dw, dh = 22, 46
    c.rect(cx - dw // 2 - 3, base - dh - 4, dw + 6, dh + 4, stone[1])
    c.rect(cx - dw // 2, base - dh, dw, dh, VOID)
    c.rect(cx - dw // 2, base - dh, dw, 3, mix(VOID, stone[6], 0.4))
    c.rect(cx - dw // 2 - 3, base - dh - 4, dw + 6, 1, stone[0])
    y = base - h0
    th = 15
    body = r
    for k in range(tiers):
        tw = round(w * (1 - 0.42 * k / max(1, tiers)))
        x = cx - tw // 2
        band = paint[k % len(paint)] if paint else body
        slab(c, x - 2, y - 3, tw + 4, band if paint else body, top, 3)
        c.rect(x, y - 3 - th, tw, th, body[3])
        c.rect(x, y - 3 - th, 1, th, body[2]); c.rect(x + tw - 1, y - 3 - th, 1, th, body[4])
        n = max(3, tw // 10)
        for j in range(n):
            px = round(x + 3 + j * (tw - 9) / max(1, n - 1))
            c.rect(px - 1, y - 3 - th + 2, 6, th - 3, body[5])
            if paint:
                col = paint[(j * 3 + k) % len(paint)]
                c.rect(px, y - 3 - th + 4, 4, th - 7, col[2])
                c.rect(px + 1, y - 3 - th + 3, 2, 2, col[1])
                c.rect(px + 3, y - 3 - th + 4, 1, th - 7, col[4])
            else:
                c.rect(px + 1, y - 3 - th + 4, 2, th - 7, body[2])
        if wash and k % 2:
            c.rect(x, y - 4, tw, 1, OCHRE_RED[3])
        y -= th + 3
    tw = round(w * 0.58)
    sh = 13
    for k in range(sh):
        t = k / sh
        hw = tw / 2 + 3 - (1 - math.sqrt(max(0, 1 - (1 - t) ** 2))) * 0
        inset = round(3 * (1 - math.sqrt(max(0, 1 - ((sh - k) / sh) ** 2))) * 2)
        yy = y - k - 2
        for xx in range(round(cx - hw) + inset, round(cx + hw) - inset):
            u = (xx - cx) / hw
            q = 2 if k > sh * 0.55 else 3
            if u > 0.6:
                q += 1
            c.p(xx, yy, (paint[0] if paint else body)[q] if k > sh * 0.55 else body[q])
    for side in (-1, 1):
        ex = cx + side * (tw // 2 + 2)
        c.rect(ex - 2, y - sh + 1, 4, sh, body[2 if side < 0 else 4])
        c.rect(ex - 1 + side * 2, y - sh - 2, 2, 4, body[1])
    n = 5 if w < 90 else 7
    for j in range(n):
        kalasha(c, round(cx - tw / 2 + 4 + j * (tw - 8) / (n - 1)), y - sh, 1.0)
    return y - sh - 12


def dravida(spec, info):
    s = {**dict(size='medium', look='painted'), **spec}
    size, look = s['size'], s['look']
    W = {'small': 168, 'medium': 220, 'large': 288}[size]
    m = 14
    tiers_g = {'painted': {'small': 3, 'medium': 5, 'large': 7},
               'granite': {'small': 2, 'medium': 2, 'large': 3},
               'village': {'small': 2, 'medium': 3, 'large': 4}}[look][size]
    tiers_v = {'painted': {'small': 2, 'medium': 3, 'large': 3},
               'granite': {'small': 3, 'medium': 5, 'large': 7},
               'village': {'small': 2, 'medium': 2, 'large': 3}}[look][size]
    gw = {'small': 74, 'medium': 92, 'large': 116}[size] - (12 if look == 'granite' else 0)
    vw = {'small': 64, 'medium': 80, 'large': 100}[size] + (14 if look == 'granite' else 0)
    if look == 'painted':
        r, top, stone, paint = PASTEL, PASTEL, GRANITE, PAINT
    elif look == 'granite':
        r, top, stone, paint = GRANITE, GRANITE_TOP, GRANITE, None
    else:
        r, top, stone, paint = WHITE, WHITE, WHITE, None
    wall_h = 34
    court = {'small': 80, 'medium': 100, 'large': 124}[size]
    gH = 54 + tiers_g * 18 + 26
    vH = 40 + tiers_v * 16 + vw * 0.24 + 30
    H = max(gH, vH + wall_h + court * K) + 24
    H = round(H)
    c = C(W + 2 * m, H)
    L, R, cx = m, m + W, m + W // 2
    base = H - 6
    wtop = base - wall_h
    back = wtop - round(court * K)
    paving(COURT)(c, L, back, W, wtop - back)
    c.rect(L, back - 8, W, 8, (WHITE if look == 'village' else stone)[3])
    c.rect(L, back - 10, W, 2, (WHITE if look == 'village' else stone)[1])
    vfoot = back + round(court * K * 0.55)
    vr = {'painted': PASTEL, 'granite': GRANITE_TOP, 'village': WHITE}[look]
    vimana(c, cx, vfoot, vw if look != 'painted' else round(vw * 0.8), tiers_v, vr, vr, paint=paint)
    if look != 'painted':
        for yy in range(vfoot - 70, vfoot + 4):
            c.p(cx + vw // 2 + 10, yy, GOLD[2]); c.p(cx + vw // 2 + 11, yy, GOLD[4])
        for yy in range(vfoot - 70, vfoot, 9):
            c.rect(cx + vw // 2 + 9, yy, 4, 2, GOLD[1])
    wall_r = WHITE if look == 'village' else stone

    def wall_face(c, x, y, w, h):
        if look == 'village':
            for xx in range(x, x + w):
                c.rect(xx, y, 1, h, (OCHRE_RED if ((xx - x) // 7) % 2 else WHITE)[2 if (xx - x) % 7 else 3])
            c.rect(x, y, w, 2, WHITE[1])
        else:
            fm.ashlar(c, x, y, w, h, wall_r, 8, 22)
    so.box(c, L, base, W, wall_h, 8, wall_face, wall_r)
    for side_x in (L, R - 6):
        c.rect(side_x, back - 8, 6, wtop - back + 8, wall_r[2])
        c.rect(side_x, back - 8, 1, wtop - back + 8, wall_r[1])
    gopuram(c, cx, base, gw, tiers_g, r, top, paint=paint, stone=stone if look != 'village' else WHITE,
            wash=look == 'village')
    ground_shadow(c, L, R, base + 1, 3)
    return complete(c, info, L, W, base, cx, 46, round(court + 28), label='Temple')


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
    'nagara-temple': _scales('nagara', ('buff', 'laterite', 'brick'),
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
