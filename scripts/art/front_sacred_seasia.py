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
from art import front_stepped as st  # noqa: E402
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


def redent(c, x, y, w, h, r):
    """A redented wall square on: the corner pilasters a step lit on the
    left and a step shaded on the right, each re-entrant angle a dark line."""
    st.step_rect(c, x, y, 3, h, r, -1)
    st.step_rect(c, x + 3, y, 1, h, r, 2)
    st.step_rect(c, x + w - 4, y, 1, h, r, 2)
    st.step_rect(c, x + w - 3, y, 3, h, r, 1)
    st.step_rect(c, x + w - 1, y, 1, h, r, 1)


def cornice(c, x, y, w, r):
    """A moulding jutting from the wall: lit top, its face, a dark lip, and
    its shadow a step down the wall under it."""
    st.step_rect(c, x + 2, y + 4, w - 4, 2, r, 2)
    c.rect(x, y, w, 1, r[0]); c.rect(x, y + 1, w, 2, r[2]); c.rect(x, y + 3, w, 1, r[5])
    c.rect(x + w - 2, y + 1, 2, 2, r[4])


def flame_pediment(c, cx, y, half, r, rows=None):
    """A fronton over a door: nested pointed frames rising to a flame,
    each frame lit on its left limb."""
    rows = rows or half
    for j in range(rows):
        hw = round(half * (1 - j / rows) ** 0.8)
        if hw < 1:
            break
        for xx in range(cx - hw, cx + hw):
            edge = xx < cx - hw + 2 or xx >= cx + hw - 2
            q = (1 if xx < cx else 4) if edge else 2 if (j + 1) % 3 else 3
            c.p(xx, y - j, r[q])
    c.p(cx, y - rows, r[1]); c.p(cx - 1, y - rows + 1, r[1])


def portal(c, cx, base, dw, dh, r, door=True):
    """A doorway in a projecting frame: colonnettes either side lit on
    their left, the lintel, a flame fronton over it; dark if it is a real
    door, else carved false leaves."""
    fx = cx - dw // 2 - 4
    c.rect(fx, base - dh - 4, dw + 8, dh + 4, r[1])
    c.rect(fx + dw + 6, base - dh - 4, 2, dh + 4, r[4])
    for px in (cx - dw // 2 - 3, cx + dw // 2 + 1):
        c.rect(px, base - dh, 2, dh, r[0]); c.rect(px + 1, base - dh, 1, dh, r[3])
    if door:
        c.rect(cx - dw // 2, base - dh, dw, dh, VOID)
        c.rect(cx - dw // 2, base - dh, dw, 2, r[6])
    else:
        c.rect(cx - dw // 2, base - dh, dw, dh, r[3])
        c.rect(cx, base - dh, 1, dh, r[5])
        for yy in range(base - dh + 3, base - 2, 4):
            c.rect(cx - dw // 2 + 1, yy, dw - 2, 1, r[4])
    c.rect(fx - 1, base - dh - 5, dw + 10, 2, r[0])
    flame_pediment(c, cx, base - dh - 6, dw // 2 + 5, r, rows=dw // 2 + 6)


def antefix(c, x, y, r):
    st.glyph(c, x, y - 5, ('.a.', 'aab', 'abc', 'abc', 'bbc'), {'a': r[0], 'b': r[2], 'c': r[4]})


def corncob(c, cx, foot, w, tiers, r, th):
    """The prasat's tower: false storeys narrowing on an ogee to a lotus bud;
    each lit left and shaded right, its ledge lit with a dark joint under,
    a niche at its middle, antefixes at its corners."""
    y, fixes = foot, []
    for k in range(tiers):
        t = k / tiers
        ww = round(w * (1 - 0.52 * t ** 1.2))
        h = max(5, round(th * (1 - 0.09 * k)))
        x = cx - ww // 2
        for xx in range(x, x + ww):
            u = (xx - x) / ww
            c.rect(xx, y - h, 1, h, r[1 if u < 0.2 else 2 if u < 0.6 else 3 if u < 0.86 else 4])
        c.rect(x, y - 1, ww, 1, r[5])
        c.rect(x - 1, y - h, ww + 2, 1, r[0])
        c.rect(cx - 2, y - h + 2, 4, h - 4, r[4]); c.rect(cx - 2, y - h + 2, 4, 1, r[5])
        fixes += [(x - 1, y - h), (x + ww - 2, y - h)]
        y -= h
    for fx, fy in fixes:
        antefix(c, fx, fy, r)
    bud = round(w * 0.42)
    so.lathe(c, cx, y + 2, [(0, w * 0.2), (bud * 0.25, w * 0.24), (bud * 0.7, w * 0.13), (bud, 0.6)], r,
             courses=3)
    return y - bud


def prasat(c, cx, base, w, h, r, door=False, tiers=5):
    """A sanctuary tower: plinth, redented body with its portal, cornice,
    then the corncob."""
    so.box(c, cx - w // 2 - 4, base, w + 8, 5, 18, r)
    fy = base - 5
    x = cx - w // 2
    st.coursed(c, x, fy - h, w, h, r, q=2, course=5, block=11, foot=0, seed=w)
    redent(c, x, fy - h, w, h, r)
    portal(c, cx, fy, max(10, w // 3), min(h - 10, 30), r, door)
    cornice(c, x - 2, fy - h - 4, w + 4, r)
    return corncob(c, cx, fy - h - 4, w - 2, tiers, r, max(8, w // 4))


def gallery(c, x, base, w, h, r):
    """The enclosing gallery: a wall of courses pierced by windows of turned
    balusters, under a stone roof corbelled in lit and shaded courses."""
    st.coursed(c, x, base - h, w, h, r, q=3, course=5, block=14, seed=3)
    for wx in range(x + 6, x + w - 12, 14):
        c.rect(wx, base - h + 7, 8, 11, VOID)
        c.rect(wx - 1, base - h + 6, 10, 1, r[1]); c.rect(wx - 1, base - h + 18, 10, 1, r[1])
        for bx in range(wx + 1, wx + 8, 2):
            c.rect(bx, base - h + 7, 1, 11, r[2])
    st.ends(c, x, base - h, w, h, r)
    for j, q in enumerate((5, 3, 2, 3, 1, 2, 0)):
        c.rect(x - 2 + j // 3, base - h - 1 - j, w + 4 - 2 * (j // 3), 1, r[q])


def gopura(c, cx, base, w, r, wall_w):
    """The gateway in the enclosure: galleries either side, the gate's body
    with its portal, its roof stepped in three stages to a lotus."""
    gallery(c, cx - wall_w // 2, base, wall_w, 24, r)
    gh = 44
    x = cx - w // 2
    st.coursed(c, x, base - gh, w, gh, r, q=2, course=5, block=11, seed=5)
    redent(c, x, base - gh, w, gh, r)
    portal(c, cx, base, 20, 38, r, True)
    y = base - gh
    for k in range(2):
        ww = w + 4 - k * 12
        cornice(c, cx - ww // 2, y - 4, ww, r)
        y -= 4
        ww -= 6
        for xx in range(cx - ww // 2, cx + ww // 2):
            u = (xx - cx + ww // 2) / ww
            c.rect(xx, y - 7, 1, 7, r[1 if u < 0.25 else 2 if u < 0.65 else 3])
        y -= 7
    so.lathe(c, cx, y + 2, [(0, 3), (2, 4), (6, 2), (9, 0.5)], r, courses=3)
    return 38


def laterite_face(c, x, y, w, h, lat, r, seed=0):
    st.coursed(c, x, y + 3, w, h - 3, lat, q=3, course=6, block=15, seed=seed)
    st.ends(c, x, y + 3, w, h - 3, lat)
    c.rect(x, y, w, 1, r[0]); c.rect(x, y + 1, w, 1, r[2]); c.rect(x, y + 2, w, 1, r[4])


KH_SAND = ramp(70, 0.042, lift=-0.03)
KH_PINK = ramp(30, 0.07, lift=-0.01)
KH_LATERITE = ramp(40, 0.085, lift=-0.08)
KHMER = {0: (KH_SAND, KH_LATERITE), 1: (KH_PINK, KH_LATERITE), 2: (BRICK, KH_LATERITE)}


def khmer(spec, info):
    """A temple-mountain: laterite terraces with sandstone copings stepping
    up behind the enclosure gallery, a steep stair to the top, and the
    sanctuary towers on it, one, three in a row, or five in a quincunx."""
    s = {**dict(look=0, towers=1, depth=160), **spec}
    r, lat = KHMER[s['look']]
    n = s['towers']
    W = {1: 150, 3: 210, 5: 260}[n]
    H = {1: 250, 3: 272, 5: 312}[n]
    c = C(W + 30, H)
    base = H - 6
    cx = (W + 30) // 2
    steps_n = 3
    plan = [(W - 24 - k * (28 if n > 1 else 22), 16, 5 if k < steps_n - 1 else 22) for k in range(steps_n)]

    def top(c, x, y, w, h, k):
        st.paving(c, x, y, w, h, r, q=1, slab=16, row=4, seed=k)
    out = st.tiers(c, cx, base - 18, plan, lambda c, x, y, w, h, k: laterite_face(c, x, y, w, h, lat, r, seed=k),
                   top, shadow=r)
    tx, fy, tw, th, tt = out[-1]
    st.stair(c, cx, base - 18, fy - 2, 20, r, q=2, rise=3, bal=r, bal_w=3)
    tw_main = {1: 46, 3: 44, 5: 46}[n]
    if n == 5:
        for sx in (-1, 1):
            prasat(c, cx + sx * (tw // 2 - 36), tt + 4, 28, 24, r, tiers=4)
        so.box(c, cx - 36, tt + 18, 72, 6, 12, r)
        prasat(c, cx, tt + 12, tw_main, 36, r, door=True, tiers=5)
        for sx in (-1, 1):
            prasat(c, cx + sx * (tw // 2 - 14), fy + 2, 30, 28, r, tiers=4)
    elif n == 3:
        for sx in (-1, 1):
            prasat(c, cx + sx * 56, tt + 18, 34, 30, r, tiers=4)
        prasat(c, cx, tt + 20, tw_main, 36, r, door=True, tiers=5)
    else:
        prasat(c, cx, tt + 20, tw_main, 36, r, door=True, tiers=5)
    dh = gopura(c, cx, base, 44 if n > 1 else 38, r, W - 12)
    ground_shadow(c, cx - W // 2 + 6, cx + W // 2 - 6, base)
    return complete(c, info, cx - W // 2 + 6, W - 12, base + 1, cx, dh, s['depth'], leaf=False, door_width=22)


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

# Merapi andesite weathers to a warm grey; Majapahit built in red brick.
ANDESITE_W = ramp(64, 0.024, lift=-0.05)
MOSS = ramp(118, 0.05, lift=-0.08)


def kala(c, cx, y, r):
    """The kala over the door: a lion face of bulging eyes, a broad nose and
    a toothed upper jaw, no lower jaw."""
    st.glyph(c, cx - 8, y, ('...aaaaaaaaaa...', '..abbbbbbbbbbc..', '.abaabbbbbbaabc.', 'abadbcbaabbadbcc',
                            'abbbbbbaabbbbbcc', '.abbbbabbcbbbbc.', '..bebebebebebc..', '...e.e.e.e.e....'),
             {'a': r[0], 'b': r[2], 'c': r[4], 'd': VOID, 'e': r[5]})


def ratna(c, cx, by, R, r):
    """A ratna finial: a bell on a cushion, a ring, the spike."""
    so.lathe(c, cx, by, [(0, R * 0.7), (R * 0.35, R), (R * 0.9, R * 0.8), (R * 1.4, R * 0.35), (R * 1.5, R * 0.45),
                         (R * 2.3, 0.5)], r)


def relief(c, x, y, w, h, r, panel=13):
    """A base course of relief panels, each sunk a step inside a lit frame,
    a figure in it picked out in light."""
    st.coursed(c, x, y, w, h, r, q=3, course=5, block=12, foot=1)
    for k, px in enumerate(range(x + 5, x + w - panel - 2, panel + 5)):
        c.rect(px, y + 2, panel, h - 4, r[4])
        c.rect(px, y + 2, panel, 1, r[5]); c.rect(px, y + h - 3, panel, 1, r[2])
        c.rect(px + panel - 1, y + 2, 1, h - 4, r[2])
        fx = px + 3 + (k % 3) * 2
        c.rect(fx, y + 4, 2, h - 8, r[2]); c.p(fx, y + 3, r[2]); c.rect(fx + 2, y + 5, 1, 2, r[2])
    st.ends(c, x, y, w, h, r)


def niche(c, cx, base, w, h, r):
    """A niche in the wall with a figure standing in its shade."""
    c.rect(cx - w // 2 - 2, base - h - 2, w + 4, h + 2, r[1])
    c.rect(cx - w // 2, base - h, w, h, r[5])
    c.rect(cx - 1, base - h + 3, 3, h - 3, r[3]); c.rect(cx - 1, base - h + 1, 3, 2, r[2])
    c.rect(cx - w // 2 - 3, base - h - 4, w + 6, 2, r[0])


def candi_shrine(c, cx, base, w, r, body_h=52, tiers=3, door=True, kaki=14):
    """One candi: the foot (kaki) carved in relief panels with its stair,
    the body (tubuh) redented, the door under its kala, and the roof (atap)
    in shrinking storeys ringed with ratna finials. Returns the door's foot."""
    kw = w + 26
    so.box(c, cx - kw // 2, base, kw, kaki, kw * 0.3, r,
           lambda c, x, y, ww, hh: st.paving(c, x, y, ww, hh, r, q=1, slab=12, row=3))
    relief(c, cx - kw // 2, base - kaki, kw, kaki, r)
    fy = base - kaki
    x = cx - w // 2
    st.coursed(c, x, fy - body_h, w, body_h, r, q=2, course=5, block=10, foot=0, seed=w)
    redent(c, x, fy - body_h, w, body_h, r)
    if door:
        dw, dh = 14, 38
        c.rect(cx - dw // 2 - 3, fy - dh - 3, dw + 6, dh + 3, r[1])
        c.rect(cx + dw // 2 + 1, fy - dh - 3, 2, dh + 3, r[4])
        c.rect(cx - dw // 2, fy - dh, dw, dh, VOID)
        kala(c, cx, fy - dh - 11, r)
        if w >= 54:
            for sx in (-1, 1):
                niche(c, cx + sx * (w // 2 - 11), fy - 14, 9, 22, r)
        st.stair(c, cx, base, fy, 14, r, q=2, rise=3, bal=r, bal_w=3)
    else:
        niche(c, cx, fy - 8, 10, 22, r)
    cornice(c, x - 3, fy - body_h - 4, w + 6, r)
    y = fy - body_h - 4
    finials = []
    for k in range(tiers):
        ww = round(w * (0.9 - 0.6 * k / tiers))
        h = max(8, 14 - k)
        tx = cx - ww // 2
        for xx in range(tx, tx + ww):
            u = (xx - tx) / ww
            c.rect(xx, y - h, 1, h, r[1 if u < 0.2 else 2 if u < 0.6 else 3 if u < 0.86 else 4])
        c.rect(cx - 3, y - h + 2, 6, h - 3, r[4]); c.rect(cx - 3, y - h + 2, 6, 1, r[5])
        c.rect(tx - 1, y - h - 1, ww + 2, 1, r[0]); c.rect(tx, y - 1, ww, 1, r[5])
        finials += [(tx + 2, y - h - 1), (tx + ww - 3, y - h - 1)]
        y -= h + 1
    for fx, fy_ in finials:
        ratna(c, fx, fy_ + 1, 3, r)
    ratna(c, cx, y + 2, max(5, w // 9), r)
    return fy


def bell_stupa(c, cx, by, R, r, lattice=True):
    """A bell stupa on its lotus cushion; the Borobudur ones are cut through
    in a lattice of diamond holes."""
    so.lathe(c, cx, by, [(0, R), (1.5, R), (2, R * 0.95), (R * 0.9 + 2, R * 0.6), (R * 1.15 + 2, 1.5),
                         (R * 1.15 + 3, R * 0.32), (R * 1.15 + 6, R * 0.28), (R * 1.15 + 10, 0.5)], r)
    if lattice:
        for row in range(2):
            yy = by - 3 - row * 3
            for xx in range(cx - R + 2 + row, cx + R - 2, 3):
                c.p(xx, yy, VOID if xx < cx + R // 2 else r[6])


def borobudur(c, cx, base, W, r):
    """The stepped terraces: five square galleries, each faced with relief
    panels and crowned with a balustrade of niches; then three round
    terraces ringed with lattice stupas; the great bell stupa on top."""
    n = 5
    plan = [(W - k * (W // 9), 12, 4) for k in range(n)]
    plan[-1] = (plan[-1][0], 12, 12)

    def top(c, x, y, w, h, k):
        st.paving(c, x, y, w, h, r, q=1, slab=12, row=3, seed=k)
    out = st.tiers(c, cx, base, plan, lambda c, x, y, w, h, k: relief(c, x, y, w, h, r, panel=11), top, shadow=r)
    for x, fy, w, h, tt in out:
        for nx in range(x + 2, x + w - 4, 8):
            st.glyph(c, nx, fy - 5, ('..a..', '.abb.', 'abbbc', 'adddc'), {'a': r[0], 'b': r[2], 'c': r[4], 'd': r[5]})
    st.stair(c, cx, base, out[-1][1], 14, r, q=2, rise=3)
    tx, fy, tw, th, tt = out[-1]
    y = fy - 2
    for k in range(3):
        R = tw // 2 - 8 - k * (tw // 8)
        y = round_tier(c, cx, y, R, 5, 4, r)
        m = 7 - k * 2
        for i in range(m):
            a = math.pi * (0.08 + 0.84 * i / max(1, m - 1))
            bell_stupa(c, cx - round(math.cos(a) * (R - 5)), y + 3 + round(math.sin(a) * 2), 5, r)
        y -= 1
    bell_stupa(c, cx, y + 2, max(12, tw // 7), r, lattice=False)
    return y


def round_tier(c, cx, by, R, h, ry, r):
    """A round terrace at the house's shallow depth: its curved face banded
    lit to shaded across, its top a thin lit ellipse. Returns the top's
    front row."""
    for yy in range(by - h, by):
        for xx in range(cx - R, cx + R):
            u = (xx - cx + R) / (2 * R)
            q = 1 if u < 0.2 else 2 if u < 0.55 else 3 if u < 0.85 else 4
            if yy == by - 1:
                q += 1
            c.p(xx, yy, r[q])
    top = by - h
    for dy in range(-2 * ry, 1):
        t = 1 - ((dy + ry) / ry) ** 2
        if t < 0:
            continue
        hw = round(R * math.sqrt(t))
        c.rect(cx - hw, top + dy, 2 * hw, 1, r[0] if dy == 0 else r[1])
    return top - ry


def paduraksa(c, cx, base, w, r, body_h=58, tiers=6):
    """A roofed brick gate of Majapahit, as at Bajang Ratu: a stepped foot,
    the body with its narrow door under a kala, and the roof stepping up
    in cornices to a square tip."""
    kw = w + 12
    for k in range(3):
        bw = kw - k * 4
        st.coursed(c, cx - bw // 2, base - 5 * (k + 1), bw, 5, r, q=3, course=5, block=8, seed=k)
        c.rect(cx - bw // 2, base - 5 * (k + 1), bw, 1, r[1])
    st.ends(c, cx - kw // 2, base - 15, kw, 15, r)
    fy = base - 15
    x = cx - w // 2
    st.coursed(c, x, fy - body_h, w, body_h, r, q=3, course=4, block=8, foot=0, seed=w)
    redent(c, x, fy - body_h, w, body_h, r)
    dw, dh = 14, 40
    c.rect(cx - dw // 2 - 3, fy - dh - 3, dw + 6, dh + 3, r[2])
    c.rect(cx + dw // 2 + 1, fy - dh - 3, 2, dh + 3, r[5])
    c.rect(cx - dw // 2, fy - dh, dw, dh, VOID)
    kala(c, cx, fy - dh - 11, r)
    st.stair(c, cx, base, fy, 16, r, q=3, rise=3)
    y = fy - body_h
    for k in range(tiers):
        ww = round(w * (1.04 - 0.13 * k))
        cornice(c, cx - ww // 2 - 1, y - 4, ww + 2, r)
        y -= 4
        h = 7 if k < tiers - 1 else 5
        for xx in range(cx - ww // 2 + 2, cx + ww // 2 - 2):
            u = (xx - cx + ww // 2) / ww
            c.rect(xx, y - h, 1, h, r[2 if u < 0.25 else 3 if u < 0.65 else 4])
        for ex in (cx - ww // 2 + 2, cx + ww // 2 - 5):
            c.rect(ex, y - h - 3, 3, 3, r[1]); c.p(ex + 2, y - h - 1, r[4])
        y -= h
    c.rect(cx - 3, y - 8, 6, 8, r[2]); c.rect(cx - 3, y - 8, 6, 1, r[0]); c.rect(cx + 2, y - 7, 1, 7, r[4])
    return fy


def brick_wall(c, x, base, w, h, r):
    st.coursed(c, x, base - h, w, h, r, q=3, course=4, block=8, seed=x)
    st.ends(c, x, base - h, w, h, r)
    for j, q in enumerate((5, 2, 1, 0)):
        c.rect(x - 1 + (j // 2), base - h - 1 - j, w + 2 - 2 * (j // 2), 1, r[q])


def candi(spec, info):
    s = {**dict(look='prambanan', size='medium', depth=160), **spec}
    look, size = s['look'], s['size']
    if look == 'borobudur':
        W = {'small': 150, 'medium': 200, 'large': 260}[size]
        H = W // 2 + 150
        c = C(W + 30, H)
        base = H - 6
        cx = (W + 30) // 2
        borobudur(c, cx, base, W, ANDESITE_W)
        ground_shadow(c, cx - W // 2, cx + W // 2, base)
        return complete(c, info, cx - W // 2, W, base + 1, cx, 0, s['depth'], doorless=True, roof='dome')
    if look == 'prambanan':
        r = ANDESITE_W
        w = {'small': 50, 'medium': 56, 'large': 64}[size]
        W = w + 40 + (120 if size == 'large' else 70 if size == 'medium' else 0)
        H = 300 if size == 'large' else 270
        c = C(W + 20, H)
        base = H - 6
        cx = (W + 20) // 2
        if size == 'large':
            for sx in (-1, 1):
                candi_shrine(c, cx + sx * 76, base - 26, 40, r, body_h=40, tiers=4, door=False, kaki=10)
        if size == 'medium':
            for sx in (-1, 1):
                candi_shrine(c, cx + sx * 56, base - 4, 26, r, body_h=30, tiers=3, door=False, kaki=8)
        fy = candi_shrine(c, cx, base, w, r, body_h=60, tiers={'small': 4, 'medium': 4, 'large': 5}[size], kaki=16)
        ground_shadow(c, cx - W // 2, cx + W // 2, base)
        return complete(c, info, cx - W // 2, W, base + 1, cx, 38, s['depth'], leaf=False, door_base=fy,
                        door_width=14)
    r = BRICK
    W = {'small': 140, 'medium': 170, 'large': 200}[size]
    H = 250 if size != 'small' else 220
    c = C(W + 20, H)
    base = H - 6
    cx = (W + 20) // 2
    gw = 40 if size == 'small' else 46
    for x in (cx - W // 2, cx + gw // 2 + 6):
        brick_wall(c, x, base, W // 2 - gw // 2 - 6, 28, r)
    fy = paduraksa(c, cx, base, gw, r, body_h=58 if size != 'small' else 52, tiers=6 if size == 'large' else 5)
    ground_shadow(c, cx - W // 2, cx + W // 2, base)
    return complete(c, info, cx - W // 2, W, base + 1, cx, 40, s['depth'], leaf=False, door_base=fy, door_width=14)


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
