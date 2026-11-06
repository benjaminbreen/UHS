"""Southeast Asian temples, front-on: the Siamese, Lanna and village wat,
the Burmese zedi, Khmer prasat, Cham kalan, Javanese candi and the Balinese
pura. See front_sacred.py for the contract.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-seasia.png seasia
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art.front_sacred import complete, steps, ground_shadow, VOID  # noqa: E402

WHITE = RAMPS['whitewash']
GILT = ramp(82, 0.14, lift=0.03)
RED_TILE = ramp(30, 0.15, lift=-0.06)
GREEN_TILE = ramp(155, 0.1, lift=-0.06)
ORANGE_TILE = ramp(55, 0.14, lift=-0.01)
TERRA = RAMPS['terracotta']
TEAK = ramp(42, 0.06, lift=-0.13)
LACQUER = ramp(22, 0.13, lift=-0.12)
BLACK_LAC = ramp(285, 0.025, lift=-0.1)
SAND_GREY = ramp(115, 0.022, lift=-0.04)
SAND_PINK = ramp(28, 0.07, lift=-0.01)
LATERITE = ramp(40, 0.1, lift=-0.1)
BRICK = RAMPS['brick']
ANDESITE = ramp(250, 0.014, lift=-0.08)
PARAS = ramp(100, 0.02, lift=0.0)
IJUK = ramp(285, 0.02, lift=-0.1)
STUCCO = ramp(70, 0.03, lift=0.02)
GRASS = ramp(130, 0.09, lift=-0.08)


def glyph(c, x, y, rows, pal):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch in pal:
                c.p(x + i, y + j, pal[ch])


def face(c, x, y, w, h, r, q=2):
    """A plane wall square on: lit left arris, shaded right edge."""
    c.rect(x, y, w, h, r[q])
    c.rect(x, y, 1, h, r[max(0, q - 1)])
    c.rect(x + w - 2, y, 2, h, r[q + 2])


def courses(c, x, y, w, h, r):
    """Brick laid calmly: a lit top row to each course, a mortar line under
    it, joints staggered, no tone noise."""
    for yy in range(y, y + h):
        k = (yy - y) % 5
        for xx in range(x, x + w):
            j = (xx - x + ((yy - y) // 5 % 2) * 5) % 10
            q = 4 if k == 4 else 2 if k == 0 else 3
            if j == 9 and k != 4:
                q = 4
            c.p(xx, yy, r[q])


def band(c, x, y, w, r, qs):
    for k, q in enumerate(qs):
        c.rect(x, y + k, w, 1, r[q])


def plinth(c, x, base, w, h, d, r, top=None):
    """A platform: its front face in courses, its top seen from above."""
    fy, ty = so.box(c, x, base, w, h, d, r, top)
    for yy in range(fy + 4, base, 5):
        c.rect(x + 1, yy, w - 2, 1, r[4])
    c.rect(x, fy, w, 1, r[1])
    return fy, ty


# ------------------------------------------------------------------ wat

LOOKS_WAT = {
    'siam': dict(tile=RED_TILE, border=GREEN_TILE, verge=GILT, pediment='gilt', drop=8, spread=14, wall=WHITE,
                 chedi='gilt', door=LACQUER),
    'lanna': dict(tile=TERRA, border=TEAK, verge=GILT, pediment='teak', drop=13, spread=18, wall=WHITE,
                  chedi='white', door=TEAK),
    'village': dict(tile=TERRA, border=TERRA, verge=TEAK, pediment='plain', drop=9, spread=14, wall=WHITE,
                    chedi='white', door=TEAK),
}


def gable(c, apx, eave, half, rise, depth, lk, wall_half, main=True):
    """A gable-front roof tier: two glazed slopes running back up the screen
    from the rake, the left lit, the right shaded, a border of another glaze
    round them; the pediment under the rake; the naga bargeboard along it
    with its fins and the hang hong hooks at the eaves; the chofa at the apex."""
    tile, border, verge = lk['tile'], lk['border'], lk['verge']
    L, R = apx - half, apx + half

    def rake(x):
        return round(eave - (half - abs(x + 0.5 - apx)) * rise / half)
    top = rake(apx)
    for x in range(L, R):
        yr = rake(x)
        left = x < apx
        u = abs(x + 0.5 - apx)
        for y in range(yr - depth, yr + 1):
            w = yr - y
            r = border if (u > half - 7 or w > depth - 4) else tile
            q = 2 if left else 4
            if round(u) % 6 == 0:
                q += 1
            elif (w + (round(u) // 6) * 3) % 6 == 0:
                q += 1
            c.p(x, y, r[min(6, q)])
    for y in range(top - depth, top + 1):
        for k, q in enumerate((1, 2, 3, 5)):
            c.p(apx - 2 + k, y, verge[q] if lk['pediment'] != 'plain' else tile[q])
    if main:
        for y in range(top + 2, eave + 1):
            for x in range(apx - wall_half, apx + wall_half):
                if y < rake(x) + 3:
                    continue
                inset = y - rake(x)
                kind = lk['pediment']
                if kind == 'plain':
                    col = TEAK[2 if (x - apx) % 7 else 4]
                elif inset < 6:
                    col = verge[2] if inset in (3, 4) else (LACQUER[4] if kind == 'gilt' else TEAK[4])
                else:
                    ground = LACQUER if kind == 'gilt' else TEAK
                    col = ground[4]
                    dx, dy = x - apx, y - top
                    if dx % 6 == 0 and dy % 6 == 3 or (dx % 6 == 3 and dy % 6 == 0):
                        col = verge[2]
                c.p(x, y, col)
        if lk['pediment'] != 'plain':
            my = top + (eave - top) * 3 // 5
            so.ellipse(c, apx, my, 7, 6, GILT[3])
            so.ellipse(c, apx - 1, my - 1, 5, 4, GILT[1])
            for k in range(5):
                c.p(apx, my - 6 - k, GILT[2])
        fp.cast_down(c, apx - wall_half, apx + wall_half, eave + 1, 3, 0.35)
    for x in range(L - 1, R + 1):
        y = rake(x)
        left = x < apx
        for k, q in enumerate((1, 2, 4) if left else (2, 3, 5)):
            c.p(x, y - 1 + k, verge[q])
        if (x - L) % 5 == 2 and abs(x - apx) > 6:
            c.p(x, y - 2, verge[1])
    for side in (-1, 1):
        ex = L - 1 if side < 0 else R
        for k, (dx, dy) in enumerate(((0, 0), (1, -1), (2, -2), (2, -3), (2, -4), (1, -5))):
            c.p(ex - side * 0 + side * dx, eave + dy, verge[2 if k < 3 else 1])
    if lk['pediment'] != 'plain':
        pts = [(0, -2), (0, -3), (1, -4), (1, -5), (2, -6), (2, -7), (3, -8), (3, -9), (4, -10), (5, -10), (6, -9)]
        for dx, dy in pts:
            c.p(apx + dx, top + dy, verge[1]); c.p(apx + dx - 1, top + dy, verge[3])
    return top


def chedi(c, cx, base, R, kind):
    """A bell chedi: square stepped base, round mouldings, the bell, a
    harmika and the ringed spire."""
    r = GILT if kind == 'gilt' else WHITE
    for k in range(3):
        w = round(R * 2.4) - k * 8
        so.box(c, cx - w // 2, base - k * 6, w, 6, w * 0.6, r)
    b = base - 18
    so.lathe(c, cx, b, [(0, R * 0.95), (4, R * 0.95), (4, R * 0.82), (8, R * 0.82), (8, R * 0.7), (11, R * 0.7),
                        (12, R * 0.68), (14, R * 0.74), (20, R * 0.78), (R * 0.9 + 12, R * 0.6),
                        (R * 1.25 + 12, R * 0.3), (R * 1.35 + 12, R * 0.2)], r)
    top = b - round(R * 1.35 + 12)
    so.box(c, cx - 5, top + 2, 10, 5, 8, r)
    tip = GILT
    so.lathe(c, cx, top - 4, [(0, 3.5), (R * 1.3, 0.6)], tip, courses=3)


def wat(spec, info):
    s = {**dict(look='siam', W=124, tiers=2, chedi=False, depth=150), **spec}
    lk = LOOKS_WAT[s['look']]
    W = s['W']
    over = 10
    half = W // 2 + over
    rise = round(half * (0.95 if s['look'] != 'lanna' else 0.8))
    sd = 46
    side = lk['spread'] * (s['tiers'] - 1) + 6
    chedi_w = 64 if s['chedi'] else 0
    x0 = 10 + side + 4
    wall_h = 54 if s['look'] != 'lanna' else 46
    plinth_h = 12
    base_y = 12 + sd + rise + wall_h + plinth_h + lk['drop'] * (s['tiers'] - 1) + 14
    Wc = x0 + W + side + 14 + chedi_w
    c = C(Wc, base_y + 8)
    base = base_y
    cx = x0 + W // 2
    if s['chedi']:
        chedi(c, x0 + W + side + chedi_w // 2 - 2, base - 26, 22, lk['chedi'])
    pw = W + 24
    plinth(c, cx - pw // 2, base, pw, plinth_h, 30, WHITE)
    floor = base - plinth_h
    eave = floor - wall_h
    face(c, x0, eave, W, wall_h, lk['wall'], 2)
    for px in (x0 + 6, x0 + W - 12, cx - 22, cx + 16):
        face(c, px, eave + 4, 6, wall_h - 4, lk['wall'], 1)
        band(c, px - 1, eave + 4, 8, GILT, (1, 3))
        band(c, px - 1, floor - 3, 8, lk['wall'], (3, 4, 5))
    for wx in (x0 + 16, x0 + W - 26):
        c.rect(wx, eave + 16, 10, 22, lk['door'][4])
        c.rect(wx + 4, eave + 16, 1, 22, GILT[3])
        band(c, wx - 1, eave + 38, 12, lk['wall'], (1, 4))
        for k in range(5):
            c.rect(wx + 5 - k, eave + 15 - (4 - k) * 2, 2 * k + 1 - 1 if k else 1, 2, GILT[2])
    dw, dh = 24, 42
    dx = cx - dw // 2
    c.rect(dx - 3, floor - dh - 3, dw + 6, dh + 3, GILT[2])
    c.rect(dx - 3, floor - dh - 3, 1, dh + 3, GILT[1])
    c.rect(dx, floor - dh, dw, dh, lk['door'][4])
    c.rect(cx - 1, floor - dh, 2, dh, lk['door'][6])
    for yy in range(floor - dh + 4, floor - 2, 9):
        c.rect(dx + 3, yy, 7, 6, GILT[3]); c.rect(cx + 3, yy, 7, 6, GILT[3])
        c.p(dx + 4, yy + 1, GILT[1]); c.p(cx + 4, yy + 1, GILT[1])
    for k in range(9):
        hw = max(0, (dw + 6) // 2 - k * 2 + 2)
        c.rect(cx - hw, floor - dh - 4 - k * 2, 2 * hw, 2, GILT[2 if k % 2 else 1])
    for t in range(s['tiers'] - 1, 0, -1):
        gable(c, cx, eave + lk['drop'] * t, half + lk['spread'] * t, rise + lk['spread'] * t, sd - 6 * t, lk,
              0, main=False)
    gable(c, cx, eave - 16, half - 6, rise - 2, sd - 16, lk, 0, main=False)
    gable(c, cx, eave, half, rise, sd - 16, lk, W // 2)
    sw = 40
    steps(c, cx, base, sw, 4, WHITE)
    for sdx in (-1, 1):
        nx = cx + sdx * (sw // 2 + 1)
        nag = GILT if s['look'] == 'siam' else GREEN_TILE if s['look'] == 'lanna' else WHITE
        for k in range(plinth_h + 2):
            c.p(nx, base - 2 - k, nag[2]); c.p(nx + sdx, base - 2 - k, nag[3])
        glyph(c, nx - 3 if sdx < 0 else nx - 3, base - plinth_h - 10,
              ('.a.a.', 'aabaa', 'abbba', '.bbb.', '..b..'), {'a': nag[1], 'b': nag[3]})
    ground_shadow(c, x0 - side, x0 + W + side, base)
    return complete(c, info, x0 - side, W + 2 * side + chedi_w, base + 1, cx, dh, s['depth'])


# ------------------------------------------------------------------ Burmese zedi

def zedi(c, cx, base, R, r, tip=GILT, corners=True):
    """The Burmese stupa: three square terraces, an octagonal plinth, the
    flared bell, mouldings, lotus petals, the banana bud and the hti."""
    y = base
    for k in range(3):
        w = round(R * 3.0) - k * round(R * 0.5)
        fy, ty = so.box(c, cx - w // 2, y, w, 9, w * 0.5, r)
        c.rect(cx - w // 2, fy + 3, w, 1, r[4])
        if corners and k == 2:
            for sx in (cx - w // 2 + 5, cx + w // 2 - 5):
                so.lathe(c, sx, fy, [(0, 4), (3, 4), (4, 3), (9, 2.5), (14, 0.5)], r)
                c.p(sx, fy - 15, tip[1])
        y = fy - 2
    prof = [(0, R * 1.05), (3, R * 1.05), (3, R * 0.95), (6, R * 0.95), (6, R * 0.88), (9, R * 0.88)]
    for i in range(13):
        t = i / 12
        prof.append((9 + t * R * 1.05, R * (0.9 - 0.42 * t ** 0.8 + 0.12 * (1 - t) ** 4)))
    z = 9 + R * 1.05
    for k in range(4):
        prof += [(z + k * 3, R * (0.46 - k * 0.05)), (z + k * 3 + 2.5, R * (0.43 - k * 0.05))]
    z += 12
    prof += [(z, R * 0.24), (z + 3, R * 0.3), (z + 6, R * 0.2)]
    so.lathe(c, cx, y, prof, r, courses=0)
    z += 6
    so.lathe(c, cx, y, [(z, R * 0.18), (z + R * 0.5, R * 0.24), (z + R * 1.1, 0.8)], tip, z0=0, courses=3)
    top = y - round(z + R * 1.1)
    for k in range(3):
        hw = 7 - k * 2
        c.rect(cx - hw, top + 6 - k * 4, 2 * hw + 1, 2, tip[2])
        c.rect(cx - hw, top + 6 - k * 4, hw, 1, tip[1])
    for k in range(6):
        c.p(cx, top - 2 - k, tip[1 if k % 2 else 2])
    return top


def chinthe(c, x, base, r, flip=False):
    rows = ('..aa..', '.abba.', '.abbc.', '..bbc.', '.abbbc', 'abbbbc', 'abbbcc', '.cc.cc')
    for j, row in enumerate(rows):
        for i, ch in enumerate(row[::-1] if flip else row):
            if ch != '.':
                c.p(x + i, base - 8 + j, {'a': r[1], 'b': r[2], 'c': r[4]}[ch])


def pyatthat(c, cx, top, w, tiers, wood, edge):
    """A pyatthat: stacked roofs, each smaller, gilt along the eaves, a hti on top."""
    y = top
    for k in range(tiers):
        ww = w - k * (w // (tiers + 1))
        th = 7
        for j in range(th):
            hw = ww // 2 - (th - j)
            c.rect(cx - hw, y - th + j, 2 * hw, 1, wood[2 if j < th - 2 else 4])
            c.p(cx - hw, y - th + j, wood[1])
        c.rect(cx - ww // 2, y, ww, 2, edge[2])
        for xx in range(cx - ww // 2, cx + ww // 2, 3):
            c.p(xx, y + 2, edge[3])
        c.rect(cx - ww // 4, y - th - 3, ww // 2, 3, wood[5])
        y -= th + 3
    for k in range(7):
        c.p(cx, y - k, GILT[1 if k % 2 else 2])
    return y


def pagoda(spec, info):
    s = {**dict(look='gilt', R=26, hall=False, depth=150), **spec}
    r = {'gilt': GILT, 'brick': ramp(45, 0.07, lift=-0.02), 'white': WHITE}[s['look']]
    R = s['R']
    W = round(R * 3.0) + 24
    hall_h = 70 if s['hall'] else 0
    H = 12 + round(R * 1.05 + 9 + 30 + R * 1.1) + 27 + 40 + (64 if s['hall'] else 0)
    c = C(W + 24, H + 12)
    base = H + 4
    cx = (W + 24) // 2
    back = base - (64 if s['hall'] else 0)
    zedi(c, cx, back, R, r, GILT if s['look'] != 'brick' else WHITE)
    w0 = round(R * 3.0)
    if not s['hall']:
        steps(c, cx, back, 26, 3, r)
        for side, fl in ((-1, False), (1, True)):
            chinthe(c, cx + side * 20 - 3, back, WHITE, fl)
        ground_shadow(c, cx - w0 // 2, cx + w0 // 2, back)
        return complete(c, info, cx - w0 // 2, w0, back + 1, cx, 0, s['depth'], doorless=True, roof='dome')
    hw = 52
    wood = ramp(30, 0.1, lift=-0.08)
    plinth(c, cx - hw // 2 - 6, base, hw + 12, 6, 20, WHITE)
    floor = base - 6
    ph = 46
    face(c, cx - hw // 2, floor - ph, hw, ph, wood, 3)
    for px in (cx - hw // 2, cx + hw // 2 - 5):
        face(c, px, floor - ph, 5, ph, ramp(30, 0.1, lift=-0.02), 1)
        band(c, px, floor - ph + 4, 5, GILT, (1, 3))
    c.rect(cx - 12, floor - 44, 24, 44, VOID)
    for k in range(5):
        c.rect(cx - 12 + k, floor - 44 + k, 24 - 2 * k, 1, GILT[2])
    pyatthat(c, cx, floor - ph, hw + 14, 4, ramp(30, 0.1, lift=-0.08), GILT)
    for side, fl in ((-1, False), (1, True)):
        chinthe(c, cx + side * (hw // 2 + 14) - 3, base, WHITE, fl)
    ground_shadow(c, cx - w0 // 2, cx + w0 // 2, base)
    return complete(c, info, cx - w0 // 2, w0, base + 1, cx, 44, s['depth'], leaf=False)


# ------------------------------------------------------------------ Khmer prasat

def tiered_tower(c, cx, foot, w, tiers, r, bud=True, horns=False, ratna=False, step=0.17, th=None):
    """A tower in false storeys: each tier a smaller copy, a band of lit
    and shaded faces with antefixes standing at its corners and centre."""
    y = foot
    th = th or max(8, w // 4)
    for k in range(tiers):
        ww = round(w * (1 - step * k))
        h = round(th * (1 - 0.08 * k))
        x = cx - ww // 2
        c.rect(x, y - h, ww, h, r[2])
        c.rect(x, y - h, 2, h, r[1])
        c.rect(cx - ww // 6, y - h, ww // 3, h, r[1])
        c.rect(cx + ww // 6, y - h, 2, h, r[4])
        c.rect(x + ww - 3, y - h, 3, h, r[4])
        c.rect(x, y - 2, ww, 2, r[5])
        c.rect(x - 1, y - h, ww + 2, 1, r[1])
        c.rect(cx - 2, y - h + 3, 4, h - 6, r[5])
        for ax in (x, cx - 2, x + ww - 4):
            if horns:
                for j in range(5):
                    c.p(ax + (1 if ax == x else 2) + (-1 if ax == x else 1 if ax > cx else 0) * (j // 2), y - h - j, r[1 if j < 3 else 2])
            elif ratna:
                so.lathe(c, ax + 2, y - h, [(0, 2.5), (3, 2.5), (5, 1.5), (7, 0.5)], r)
            else:
                glyph(c, ax, y - h - 5, ('.a..', 'aab.', 'abbc', 'bbcc'), {'a': r[1], 'b': r[2], 'c': r[4]})
        y -= h
    if bud:
        so.lathe(c, cx, y + 1, [(0, w * 0.2), (3, w * 0.24), (w * 0.22, w * 0.18), (w * 0.38, 1.0)], r, courses=3)
        y -= round(w * 0.38)
    return y


def prasat(c, cx, base, w, h_body, r, door=False, look=0):
    so.box(c, cx - w // 2 - 3, base, w + 6, 6, w * 0.6, r)
    fy = base - 6
    face(c, cx - w // 2, fy - h_body, w, h_body, r, 2)
    for px in (cx - w // 2 + 3, cx + w // 2 - 7):
        c.rect(px, fy - h_body, 4, h_body, r[1 if px < cx else 3])
    dw = max(10, w // 3)
    c.rect(cx - dw // 2 - 3, fy - h_body + 6, dw + 6, h_body - 6, r[1])
    c.rect(cx - dw // 2, fy - h_body + 12, dw, h_body - 12, VOID if door else r[4])
    if not door:
        for yy in range(fy - h_body + 14, fy - 2, 4):
            c.rect(cx - dw // 2 + 2, yy, dw - 4, 1, r[5])
    for k in range(5):
        c.rect(cx - dw // 2 - 3 + k, fy - h_body + 6 - k * 2, dw + 6 - 2 * k, 2, r[1 if k % 2 else 2])
    band(c, cx - w // 2 - 2, fy - h_body - 3, w + 4, r, (0, 1, 3))
    return tiered_tower(c, cx, fy - h_body - 3, w, 5, r, step=0.15, th=max(9, w // 4))


def gopura(c, cx, base, w, r, roof_r, wall_w):
    """The gateway in the enclosure: galleries either side, a cross-shaped
    stone roof in ribbed courses, the door under a pediment."""
    gh = 52
    c.rect(cx - wall_w // 2, base - 30, wall_w, 30, r[3])
    for yy in range(base - 26, base, 5):
        c.rect(cx - wall_w // 2, yy, wall_w, 1, r[4])
    band(c, cx - wall_w // 2, base - 33, wall_w, r, (1, 2, 4))
    face(c, cx - w // 2, base - gh, w, gh, r, 2)
    rr = roof_r
    for j in range(16):
        hw = w // 2 + 3 - j * 2
        for xx in range(cx - hw, cx + hw):
            c.p(xx, base - gh - j, rr[3 if (xx - cx) % 4 else 5] if xx < cx + hw - 4 else rr[5])
    c.rect(cx - w // 2 - 3, base - gh, w + 6, 2, rr[1])
    for k in range(4):
        c.rect(cx - 13 + k * 2, base - 46 - k * 3, 26 - k * 4, 3, r[1 if k % 2 else 2])
    c.rect(cx - 13, base - 44, 26, 44, r[1])
    c.rect(cx - 11, base - 42, 22, 42, VOID)
    fp.cast_down(c, cx - w // 2, cx + w // 2, base - gh + 1, 3, 0.3)
    return 42


KHMER = {0: (SAND_GREY, LATERITE), 1: (SAND_PINK, LATERITE), 2: (BRICK, LATERITE)}


def khmer(spec, info):
    s = {**dict(look=0, towers=1, depth=160), **spec}
    r, lat = KHMER[s['look']]
    n = s['towers']
    tw = {1: 44, 3: 40, 5: 42}[n]
    W = {1: 150, 3: 210, 5: 260}[n]
    H = 290 if n == 5 else 250 if n == 3 else 220
    c = C(W + 30, H)
    base = H - 6
    cx = (W + 30) // 2
    pb = base - 34
    for k in range(3):
        pw = W - 20 - k * 24
        plinth(c, cx - pw // 2, pb - k * 9, pw, 9, 40, lat)
    top = pb - 27
    if n == 5:
        for sx in (-1, 1):
            prasat(c, cx + sx * 44, top - 30, tw - 8, 34, r)
    if n >= 3:
        for sx in (-1, 1):
            prasat(c, cx + sx * (62 if n == 3 else 88), top, tw - 4, 38, r)
    prasat(c, cx, top - (14 if n > 1 else 0), tw + (10 if n > 1 else 0), 46, r)
    steps(c, cx, pb, 24, 9, lat)
    dh = gopura(c, cx, base, 54, r, r, W - 12)
    ground_shadow(c, cx - W // 2 + 6, cx + W // 2 - 6, base)
    return complete(c, info, cx - W // 2 + 6, W - 12, base + 1, cx, dh, s['depth'], leaf=False)


# ------------------------------------------------------------------ Cham kalan

def kalan(c, cx, base, w, h_body, r, stone):
    face(c, cx - w // 2, base - h_body, w, h_body, r, 3)
    courses(c, cx - w // 2 + 2, base - h_body, w - 4, h_body, r)
    for i in range(5):
        px = cx - w // 2 + 2 + i * (w - 8) // 4
        c.rect(px, base - h_body + 4, 4, h_body - 6, r[2 if px < cx else 3])
        c.rect(px, base - h_body + 4, 1, h_body - 6, r[1])
    band(c, cx - w // 2 - 2, base - h_body - 4, w + 4, r, (1, 2, 3, 5))
    top = tiered_tower(c, cx, base - h_body - 4, w - 4, 3, r, bud=False, horns=True, step=0.2, th=max(12, w // 3))
    so.lathe(c, cx, top + 1, [(0, w * 0.16), (w * 0.14, w * 0.14), (w * 0.24, 1)], stone)
    return top


def cham(spec, info):
    s = {**dict(w=44, h=70, second=False, depth=120), **spec}
    w, hb = s['w'], s['h']
    W = w + 50 + (w if s['second'] else 0)
    H = hb + round(w * 1.4) + 80
    c = C(W + 20, H)
    base = H - 6
    mx = (W + 20) // 2
    knoll = 16
    for yy in range(base - knoll, base + 1):
        t = (yy - (base - knoll)) / knoll
        hw = round((W // 2 + 6) * math.sqrt(t))
        for xx in range(mx - hw, mx + hw):
            c.p(xx, yy, GRASS[2 if xx < mx - hw // 3 else 3 if xx < mx + hw // 2 else 4])
        c.p(mx - hw, yy, GRASS[1])
    top = base - knoll + 3
    cx = W + 20 - 10 - (w + 50) // 2
    if s['second']:
        sx = 10 + (w - 10) // 2 + 4
        plinth(c, sx - (w - 10) // 2 - 4, top - 6, w - 2, 5, 20, BRICK)
        kalan(c, sx, top - 11, w - 10, hb - 18, BRICK, SAND_GREY)
    plinth(c, cx - w // 2 - 10, top, w + 20, 8, 30, BRICK)
    fb = top - 8
    kalan(c, cx, fb, w, hb, BRICK, SAND_GREY)
    vw = 28
    face(c, cx - vw // 2, fb - 46, vw, 46, BRICK, 2)
    face(c, cx - 13, fb - 43, 26, 43, SAND_GREY, 2)
    c.rect(cx - 10, fb - 40, 20, 40, VOID)
    for k in range(7):
        hw = vw // 2 + 1 - k * 2
        c.rect(cx - hw, fb - 49 - k * 3, 2 * hw, 3, BRICK[1 if k % 2 else 2])
        c.p(cx - hw - 1, fb - 50 - k * 3, BRICK[1]); c.p(cx + hw, fb - 50 - k * 3, BRICK[1])
    steps(c, cx, top + 3, 24, 1, BRICK)
    ground_shadow(c, cx - w // 2 - 10, cx + w // 2 + 10, fb)
    x0 = 10 if s['second'] else cx - w // 2 - 10
    return complete(c, info, x0, cx + w // 2 + 10 - x0, base + 1, cx, 40, s['depth'], leaf=False)


# ------------------------------------------------------------------ Javanese candi

def kala(c, cx, y, r):
    """The kala over the door: a lion face of bulging eyes and a toothed upper jaw."""
    glyph(c, cx - 7, y, ('..aaaaaaaaa...', '.abbbbbbbbbba.', 'abccbbbbbccbba', 'abcdcbbbcdcbb.',
                         'abbbbbbbbbbbb.', '.abbaabbaabba.', '.bdbdbdbdbdb..', '..b.b.b.b.b...'),
          {'a': r[1], 'b': r[2], 'c': r[0], 'd': r[5]})


def candi_tower(c, cx, base, w, r, body_h=40, door=True, roof_tiers=4):
    bh = 24
    for k in range(3):
        ww = w + 26 - k * 6
        so.box(c, cx - ww // 2, base - k * 8, ww, 8, ww * 0.5, r)
        c.rect(cx - ww // 2, base - k * 8 - 4, ww, 1, r[4])
    fy = base - bh
    face(c, cx - w // 2, fy - body_h, w, body_h, r, 2)
    for px in (cx - w // 2 + 4, cx + w // 2 - 8):
        c.rect(px, fy - body_h + 4, 4, body_h - 6, r[1 if px < cx else 3])
    if door:
        c.rect(cx - 10, fy - 38, 20, 38, VOID)
        for side in (-1, 1):
            c.rect(cx + side * 12 - (2 if side < 0 else 0), fy - 40, 3, 40, r[1])
        kala(c, cx, fy - body_h + 1, r)
    band(c, cx - w // 2 - 3, fy - body_h - 4, w + 6, r, (0, 1, 2, 4))
    return tiered_tower(c, cx, fy - body_h - 4, w - 2, roof_tiers, r, bud=True, ratna=True, step=0.16,
                        th=max(10, w // 4))


def bell_stupa(c, cx, by, R, r):
    so.lathe(c, cx, by, [(0, R), (2, R), (3, R * 0.95), (R * 0.9 + 3, R * 0.55), (R * 1.15 + 3, 1.5),
                         (R * 1.15 + 4, R * 0.3), (R * 1.15 + 7, R * 0.25), (R * 1.15 + 12, 0.5)], r)


def borobudur(c, cx, base, W, r):
    y = base
    for k in range(5):
        w = W - k * (W // 8)
        fy, ty = so.box(c, cx - w // 2, y, w, 10, w * 0.4, r)
        for xx in range(cx - w // 2 + 3, cx + w // 2 - 3, 7):
            c.rect(xx, fy - 3, 4, 3, r[2]); c.p(xx + 1, fy - 4, r[1])
        c.rect(cx - w // 2, fy + 4, w, 1, r[4])
        y = fy - round(w * 0.4 * so.K) + 6
    for k in range(3):
        w = W // 2 - k * (W // 9)
        so.lathe(c, cx, y, [(0, w // 2), (4, w // 2)], r)
        n = 7 - k * 2
        for i in range(n):
            a = math.pi * (0.1 + 0.8 * i / max(1, n - 1))
            bell_stupa(c, cx - round(math.cos(a) * w * 0.4), y - 4 + round(math.sin(a) * 2), 5, r)
        y -= 7
    bell_stupa(c, cx, y, 14, r)
    return y


def candi_bentar(c, cx, base, gap, h, w, r, top):
    """The split gate: a stepped tower cut down the middle, its two halves
    drawn apart, the cut faces plain."""
    for side in (-1, 1):
        x0 = cx + gap // 2 if side > 0 else cx - gap // 2 - w
        y = base
        for k in range(6):
            ww = w - k * (w // 7)
            hh = round(h * 0.42) if k == 0 else round(h * 0.12 * (1 - 0.1 * k))
            xx = x0 if side > 0 else x0 + w - ww
            c.rect(xx, y - hh, ww, hh, r[2])
            c.rect(xx, y - hh, ww, 1, top[1])
            c.rect(xx, y - 3, ww, 2, top[3])
            if side > 0:
                c.rect(xx, y - hh, 2, hh, r[4])
            else:
                c.rect(xx + ww - 2, y - hh, 2, hh, r[1])
            c.rect(xx + (ww - 3 if side > 0 else 0), y - hh, 3, hh, r[5] if side > 0 else r[3])
            if k == 0:
                courses(c, xx + 3, y - hh + 3, ww - 6, hh - 8, r)
            y -= hh
        so.lathe(c, x0 + (w // 6 if side > 0 else w - w // 6), y, [(0, 3), (5, 2), (8, 0.5)], top)


def candi(spec, info):
    s = {**dict(look='prambanan', size='medium', depth=160), **spec}
    look, size = s['look'], s['size']
    if look == 'borobudur':
        W = {'small': 150, 'medium': 200, 'large': 260}[size]
        H = W // 2 + 150
        c = C(W + 30, H)
        base = H - 6
        cx = (W + 30) // 2
        borobudur(c, cx, base, W, ANDESITE)
        steps(c, cx, base, 18, 6, ANDESITE)
        ground_shadow(c, cx - W // 2, cx + W // 2, base)
        return complete(c, info, cx - W // 2, W, base + 1, cx, 0, s['depth'], doorless=True, roof='dome')
    if look == 'prambanan':
        r = ANDESITE
        w = {'small': 48, 'medium': 56, 'large': 64}[size]
        W = w + 40 + (120 if size == 'large' else 70 if size == 'medium' else 0)
        H = 300 if size == 'large' else 270
        c = C(W + 20, H)
        base = H - 6
        cx = (W + 20) // 2
        if size == 'large':
            for sx in (-1, 1):
                candi_tower(c, cx + sx * 74, base - 30, w - 18, r, body_h=46, roof_tiers=3)
        if size == 'medium':
            for sx in (-1, 1):
                candi_tower(c, cx + sx * 56, base - 10, 26, r, body_h=22, door=False, roof_tiers=2)
        candi_tower(c, cx, base, w, r, body_h=54, roof_tiers=5 if size == 'large' else 4)
        steps(c, cx, base, 22, 8, r)
        ground_shadow(c, cx - W // 2, cx + W // 2, base)
        return complete(c, info, cx - W // 2, W, base + 1, cx, 38, s['depth'], leaf=False)
    r = BRICK
    W = {'small': 140, 'medium': 170, 'large': 200}[size]
    H = 250 if size != 'small' else 220
    c = C(W + 20, H)
    base = H - 6
    cx = (W + 20) // 2
    candi_tower(c, cx, base - 44, 40 if size == 'small' else 48, r, body_h=36, roof_tiers=4)
    gap = 26
    wh = 30
    for x in (cx - W // 2, cx + gap // 2 + 30):
        ww = W // 2 - gap // 2 - 30
        courses(c, x, base - wh, ww, wh, r)
        band(c, x - 1, base - wh - 3, ww + 2, PARAS, (0, 1, 3))
    candi_bentar(c, cx, base, gap, 100 if size != 'small' else 86, 32, r, PARAS)
    ground_shadow(c, cx - W // 2, cx + W // 2, base)
    return complete(c, info, cx - W // 2, W, base + 1, cx, 60, s['depth'], leaf=False)


# ------------------------------------------------------------------ Balinese pura

def meru(c, cx, base, w, tiers, wood=TEAK):
    """A meru: a stone base, a little shrine with red and gold doors, then
    the odd-numbered stack of black ijuk roofs on a timber core."""
    plinth(c, cx - w // 2 - 4, base, w + 8, 10, 20, PARAS)
    y = base - 10
    face(c, cx - w // 2 + 4, y - 18, w - 8, 18, wood, 2)
    c.rect(cx - 5, y - 15, 10, 15, LACQUER[3]); c.rect(cx - 5, y - 15, 10, 2, GILT[2])
    y -= 18
    for k in range(tiers):
        ww = round(w * (1.35 - 0.95 * k / max(1, tiers)))
        th = 7 if tiers > 5 else 9
        for j in range(th):
            hw = ww // 2 - (th - 1 - j)
            for xx in range(cx - hw, cx + hw):
                q = 3 if (xx - cx) % 2 else 4
                if xx > cx + hw // 2:
                    q += 1
                c.p(xx, y - th + j, IJUK[q])
            c.p(cx - hw, y - th + j, IJUK[2])
        c.rect(cx - ww // 2, y - 1, ww, 1, IJUK[6])
        fp.cast_down(c, cx - ww // 2 + 4, cx + ww // 2 - 4, y, 2, 0.25)
        y -= th
        c.rect(cx - 2, y - 2, 4, 2, wood[3])
        y -= 2
    so.lathe(c, cx, y + 1, [(0, 3), (3, 2), (6, 0.5)], GILT)
    return y


def pura(spec, info):
    s = {**dict(size='medium', depth=180), **spec}
    size = s['size']
    W = {'small': 160, 'medium': 210, 'large': 270}[size]
    merus = {'small': [(0.3, 3)], 'medium': [(0.25, 5), (0.72, 3)], 'large': [(0.22, 11), (0.5, 7), (0.78, 5)]}[size]
    H = 160 + max(t for _, t in merus) * 9
    c = C(W + 20, H)
    base = H - 6
    x0 = 10
    cx = x0 + W // 2
    back = base - 46
    for fx, t in merus:
        if abs(fx - 0.5) < 0.1:
            continue
        meru(c, x0 + round(W * fx), back, 30 if t < 7 else 36, t)
    for fx, t in merus:
        if abs(fx - 0.5) < 0.1:
            meru(c, x0 + round(W * fx), back - 10, 38, t)
    kw = 34
    face(c, cx - kw // 2, base - 104, kw, 70, BRICK, 3)
    courses(c, cx - kw // 2 + 3, base - 104, kw - 6, 70, BRICK)
    for k in range(5):
        c.rect(cx - kw // 2 + k * 3, base - 108 - k * 5, kw - k * 6, 5, PARAS[1 if k % 2 else 2])
    c.rect(cx - 7, base - 72, 14, 36, LACQUER[5]); c.rect(cx - 7, base - 74, 14, 2, GILT[2])
    c.rect(cx, base - 72, 1, 36, GILT[3])
    wh = 34
    c.rect(x0, base - wh, W, wh, BRICK[3])
    courses(c, x0, base - wh + 4, W, wh - 8, BRICK)
    band(c, x0 - 2, base - wh - 4, W + 4, PARAS, (0, 1, 2, 4))
    band(c, x0, base - 4, W, PARAS, (2, 3, 4, 5))
    kx = x0 + 6
    kh = 70
    face(c, kx, base - kh, 22, kh - wh, BRICK, 2)
    courses(c, kx + 2, base - kh, 18, kh - wh, BRICK)
    plinth(c, kx - 2, base - kh, 26, 4, 12, PARAS)
    for px in (kx + 1, kx + 18):
        c.rect(px, base - kh - 20, 3, 18, TEAK[2])
    c.rect(kx + 8, base - kh - 18, 6, 14, TEAK[4])
    for j in range(11):
        hw = 4 + j
        c.rect(kx + 11 - hw, base - kh - 31 + j, 2 * hw, 1, IJUK[2 if j == 0 else 3 if j < 9 else 5])
        c.p(kx + 11 - hw, base - kh - 31 + j, IJUK[2])
    gap = 30
    candi_bentar(c, cx, base, gap, 104 if size != 'small' else 90, 32, BRICK, PARAS)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base + 1, cx, 64, s['depth'], leaf=False)


# ------------------------------------------------------------------ catalogue

BUILDERS = {'wat': wat, 'zedi': pagoda, 'prasat': khmer, 'kalan': cham, 'candi': candi, 'pura': pura}

D_WAT = 'A monastery hall under tiers of glazed gables, where monks are ordained and the town brings offerings.'
D_ZEDI = 'A solid pagoda over relics of the Buddha, walked round clockwise with flowers and candles.'
D_KHMER = 'A temple-mountain of stone towers for the god of the king, entered by its gateway.'
D_CHAM = 'A brick tower over the shrine of Shiva, on its hill above the town.'
D_CANDI = 'A stone shrine on its terrace, its towers built as the mountain of the gods.'
D_PURA = 'The temple court: the split gate, the gateway beyond, and the tiered shrines of the gods.'


def _wat(scale, look):
    W = {'small': 104, 'medium': 124, 'large': 144}[scale]
    tiers = {'small': 2, 'medium': 2, 'large': 3}[scale] + (1 if look == 'lanna' else 0)
    return ('wat', dict(look=look, W=W, tiers=tiers, chedi=scale != 'small',
                        depth={'small': 120, 'medium': 150, 'large': 190}[scale],
                        label={'small': 'Wat', 'medium': 'Wat', 'large': 'Royal wat'}[scale],
                        description=D_WAT, roof='gable'))


SPECS = {
    'wat': {sc: [_wat(sc, lk) for lk in ('siam', 'lanna', 'village')] for sc in ('small', 'medium', 'large')},
    'burmese-pagoda': {sc: [('zedi', dict(look=lk, R={'small': 22, 'medium': 28, 'large': 32}[sc], hall=sc == 'large',
                                           depth={'small': 130, 'medium': 160, 'large': 200}[sc],
                                           label={'small': 'Pagoda', 'medium': 'Pagoda', 'large': 'Great pagoda'}[sc],
                                           description=D_ZEDI, roof='dome'))
                            for lk in ('gilt', 'brick', 'white')] for sc in ('small', 'medium', 'large')},
    'khmer-temple': {sc: [('prasat', dict(look=lk, towers={'small': 1, 'medium': 3, 'large': 5}[sc],
                                          depth={'small': 140, 'medium': 170, 'large': 200}[sc],
                                          label={'small': 'Prasat', 'medium': 'Temple', 'large': 'Temple-mountain'}[sc],
                                          description=D_KHMER, roof='flat'))
                          for lk in (0, 1, 2)] for sc in ('small', 'medium', 'large')},
    'cham-tower': {sc: [('kalan', dict(w={'small': 40, 'medium': 44, 'large': 50}[sc],
                                       h={'small': 62, 'medium': 70, 'large': 80}[sc], second=sc != 'small',
                                       depth={'small': 110, 'medium': 130, 'large': 150}[sc],
                                       label={'small': 'Kalan', 'medium': 'Temple', 'large': 'Great temple'}[sc],
                                       description=D_CHAM, roof='flat'))] for sc in ('small', 'medium', 'large')},
    'javanese-candi': {sc: [('candi', dict(look=lk, size=sc, depth={'small': 130, 'medium': 160, 'large': 200}[sc],
                                           label={'small': 'Candi', 'medium': 'Candi', 'large': 'Great candi'}[sc],
                                           description=D_CANDI, roof='flat'))
                            for lk in ('prambanan', 'borobudur', 'majapahit')] for sc in ('small', 'medium', 'large')},
    'balinese-pura': {sc: [('pura', dict(size=sc, depth={'small': 150, 'medium': 180, 'large': 200}[sc],
                                         label={'small': 'Pura', 'medium': 'Pura desa', 'large': 'Pura agung'}[sc],
                                         description=D_PURA, roof='flat'))] for sc in ('small', 'medium', 'large')},
}
