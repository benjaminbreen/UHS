"""Mosques, temples and shrines of Africa and pharaonic Egypt, front-on:
the Sahelian banco mosque, the Swahili coral mosque, the Egyptian pylon
temple, the Asante shrine house, the Yoruba, Benin and Fon shrines, and the
forest's sacred grove. The contract is front_sacred's.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-africa.png africa
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_eave as ev  # noqa: E402
from art.front_africa import BANCO, BANCO_TOP, POLE, toron, pinnacle, mat_door  # noqa: E402
from art.front_house import bevel  # noqa: E402
from art.front_sacred import complete, arch_door, cone, drum, flag, ground_shadow, VOID, GOLD  # noqa: E402

WHITE = RAMPS['whitewash']
CORAL = ramp(62, 0.035, lift=-0.06)
LATERITE = ramp(30, 0.12, lift=-0.1)
RED_EARTH = ramp(34, 0.11, lift=-0.06)
INDIGO = ramp(262, 0.09, lift=-0.2)
CLOTH = ramp(95, 0.01, lift=0.06)
BRONZE = ramp(66, 0.1, lift=-0.12)
CEDAR = RAMPS['cedar']
PENNANT = ramp(26, 0.16, lift=-0.08)
LEAF = ramp(140, 0.09, lift=-0.16)
BARK = ramp(50, 0.035, lift=-0.12)
BOWL = ramp(245, 0.11, lift=-0.06)
STRAW = ev.TONES['straw-old']
GRASS = ramp(68, 0.07, lift=-0.03)


def egg(c, x, y):
    """An ostrich egg on a pinnacle's tip, as on the mosques of Djenné."""
    so.ellipse(c, x, y - 2, 2, 2.5, WHITE[1])
    c.p(x - 1, y - 3, WHITE[0]); c.p(x + 1, y - 1, WHITE[3])


def flat_roof(r, seed=0, vents=None, lit=1):
    """A packed-earth or lime roof seen from above: a step lighter than the
    wall below it, soft speckle, a lit back edge and a shaded front lip."""
    def paint(c, x, y, w, h):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                c.p(xx, yy, r[lit] if h2(xx // 3, yy // 2, seed) > 0.12 else r[lit + 1])
        c.rect(x, y, w, 1, r[0])
        c.rect(x, y + h - 2, w, 2, r[lit + 2])
        if vents:
            vents(c, x, y, w, h)
    return paint


def wall_of(fn, r, **kw):
    return lambda c, x, y, w, h: fn(c, x, y, w, h, r, **kw)


def batter(c, cx, top, base, w0, w1, r, tex=None, side=0.3):
    """A battered block, wider at the foot: its face lit, a strip of the
    right side in shade, as the tower narrows."""
    for yy in range(top, base):
        t = (yy - top) / max(1, base - top - 1)
        half = (w1 + (w0 - w1) * t) / 2
        L, R = round(cx - half), round(cx + half)
        for xx in range(L, R):
            q = 1 if xx - L < 2 else 4 if R - xx <= max(2, round(half * side * 0.4)) else 2
            col = tex(xx, yy, q) if tex else r[q]
            c.p(xx, yy, col)


# ------------------------------------------------------------------ the Sahel

def sahel_mosque(spec=None, info=None):
    s = {**dict(W=210, wall=66, depth=120, towers=3, look='djenne', seed=3), **(spec or {})}
    W, wh, D, look = s['W'], s['wall'], s['depth'], s['look']
    white = look == 'larabanga'
    wall_r = WHITE if white else BANCO
    top_r = BANCO_TOP
    tower_h = {'djenne': 74, 'timbuktu': 0, 'larabanga': 44}[look]
    head = round(D * so.K) + tower_h + 60
    L = 24
    base = head + wh + 18
    c = C(W + 2 * L, base + 8)
    R = L + W
    wb = base - 12

    # the platform the mosque stands on
    so.box(c, L - 12, base, W + 24, 10, 18, BANCO, BANCO_TOP)

    def vents(c, x, y, w, h):
        # the lidded clay pots that light and air the hall below
        for j, yy in enumerate(range(y + 12, y + h - 8, 20)):
            for xx in range(x + 20 + (j % 2) * 18, x + w - 16, 36):
                so.lathe(c, xx, yy, [(0, 3), (3, 3), (4, 1.5)], BANCO, hollow=(1.5, 2))

    so.box(c, L, wb, W, wh, D, wall_of(fm.kahgel, wall_r) if not white else wall_of(fm.render, wall_r),
           flat_roof(top_r, 7, None if look == 'timbuktu' else vents))
    top = wb - wh
    if white:
        c.rect(L, wb - 9, W, 9, BANCO[4]); c.rect(L, wb - 9, W, 1, BANCO[3])

    if look == 'timbuktu':
        # one minaret on the roof, a truncated pyramid bristling with toron
        mx = L + round(W * 0.68)
        mb = top - round(D * so.K * 0.45)
        mh = {'small': 70, 'medium': 92, 'large': 116}[s['size']]
        w0, w1 = 46 if s['size'] != 'small' else 36, 18
        batter(c, mx, mb - mh, mb, w0, w1, BANCO_TOP)
        so.box(c, mx - w1 // 2 - 1, mb - mh + 1, w1 + 2, 1, 10, BANCO_TOP)
        pinnacle(c, mx, mb - mh - 3, 10, 9)
        for k, yy in enumerate(range(mb - mh + 8, mb - 4, 9)):
            t = (yy - (mb - mh)) / mh
            half = round((w1 + (w0 - w1) * t) / 2) - 4
            toron(c, mx - half - 4, mx + half + 4, yy, step=8)
        # low parapet of little merlons
        for xx in range(L + 3, R - 4, 9):
            pinnacle(c, xx + 3, top + 1, 6, 6)
        buttresses = [L + k * (W - 10) // 5 for k in range(6)]
    else:
        n = max(6, W // 16)
        buttresses = [round(L + k * (W - 9) / (n - 1)) for k in range(n)]

    towers = []
    if s['towers']:
        nt = s['towers']
        fr = {1: (0.5,), 2: (0.1, 0.9), 3: (0.14, 0.5, 0.86)}[nt]
        tw = s.get('tower_w', 32)
        towers = [round(L + f * W) for f in fr]
    door = s.get('door', 0.32)
    door_x = round(L + door * W)
    skip = [(t - 26, t + 26) for t in towers] + [(door_x - 22, door_x + 22)]

    # engaged pilasters, each ending in a pinnacle over the parapet
    for x in buttresses:
        if any(a - 4 <= x + 4 <= b + 4 for a, b in skip):
            continue
        for yy in range(top - 4, wb):
            for i in range(8):
                q = 1 if i < 2 else 2 if i < 5 else 4
                c.p(x + i, yy, (wall_r if white else BANCO)[q])
        op.cast(c, x + 8, top + 8, 3, wb - top - 14, 0.74)
        pinnacle(c, x + 4, top - 3, 7, 12 if look != 'timbuktu' else 8)
        if look == 'djenne':
            egg(c, x + 4, top - 15)
    for i, y in enumerate(range(top + 14, wb - 12, 18)):
        toron(c, L, R, y, step=13, skip=skip)

    for tx in towers:
        th = wh + tower_h
        ttop = wb - th
        tw = s.get('tower_w', 32)
        batter(c, tx, ttop, wb, tw + 6, tw - 2, wall_r)
        if white:
            c.rect(tx - tw // 2 - 3, wb - 9, tw + 6, 9, BANCO[4])
        op.cast(c, tx + tw // 2 + 3, ttop + 16, 4, th - 26, 0.72)
        for rib in (-tw // 4, tw // 4):
            for yy in range(ttop - 4, wb - 6):
                c.p(tx + rib - 1, yy, wall_r[1]); c.p(tx + rib, yy, wall_r[2]); c.p(tx + rib + 1, yy, wall_r[3])
        for yy in range(ttop + 10, wb - 10, 12):
            toron(c, tx - tw // 2 - 4, tx + tw // 2 + 4, yy, step=9)
        so.box(c, tx - tw // 2 + 1, ttop + 2, tw - 2, 2, 8, top_r)
        for k, dx in enumerate((-tw // 4, 0, tw // 4)):
            ph = 26 if dx == 0 else 18
            pinnacle(c, tx + dx, ttop - (6 if dx else 2), 11 if dx == 0 else 9, ph)
            if look == 'djenne':
                egg(c, tx + dx, ttop - (6 if dx else 2) - ph)

    # the entrance bay and its studded door
    op.raised(c, door_x - 16, wb - 50, 32, 50, top_r, 2)
    op.door_studded(c, door_x - 11, wb - 44, 22, 44, wood=CEDAR, studs=RAMPS['granite'])
    pinnacle(c, door_x - 13, wb - 50, 6, 9); pinnacle(c, door_x + 13, wb - 50, 6, 9)
    so.box(c, door_x - 18, wb + 3, 36, 3, 6, BANCO_TOP)
    ground_shadow(c, L - 12, R + 12, base)
    return complete(c, info, L - 12, W + 24, base, door_x, 44, D + 18, roof='flat')


WASHES_WHITE = ramp(80, 0.02, lift=0.04)


# ------------------------------------------------------------------ the Swahili coast

def coral_wall(c, x, y, w, h):
    fm.whitewash(c, x, y, w, h, WHITE, CORAL)


def merlons(c, L, R, y, r=WHITE):
    """Stepped merlons along a parapet: three courses each, the lit side left."""
    for x in range(L, R - 8, 12):
        for k, ww in enumerate((9, 5, 2)):
            c.rect(x + (9 - ww) // 2, y - 3 * (k + 1), ww, 3, r[1])
            c.rect(x + (9 - ww) // 2 + ww - 1, y - 3 * (k + 1), 1, 3, r[3])
        c.rect(x, y - 3, 9, 1, r[0])


def carved_door(c, cx, base, w=26, h=50):
    """A carved coral door frame round a heavy Swahili door: herringbone bands
    down the jambs, a lintel with a rosette, brass bosses on the leaves."""
    x0 = cx - w // 2
    fw = 7
    for yy in range(base - h - fw, base):
        for xx in range(x0 - fw, x0 + w + fw):
            if x0 <= xx < x0 + w and yy >= base - h:
                continue
            band = (xx - x0 + fw) if xx < x0 else (x0 + w + fw - 1 - xx) if xx >= x0 + w else (yy - base + h + fw)
            q = 1 if band in (0, fw - 1) else 2 if (xx + yy) % 4 < 2 else 3
            c.p(xx, yy, CORAL[q])
    for k in range(5):
        c.p(cx - 2 + k, base - h - 4, CORAL[4]); c.p(cx, base - h - 6 + k, CORAL[4])
    op.door_studded(c, x0, base - h, w, h, wood=ramp(40, 0.07, lift=-0.18), studs=RAMPS['granite'])


def pillar_tomb(c, cx, base, H=96):
    """A pillar tomb: the grave's walled enclosure, and over it a tall
    pillar set with imported porcelain bowls."""
    so.box(c, cx - 26, base, 52, 12, 30, wall_of(fm.whitewash, WHITE, under=CORAL), flat_roof(WHITE, 5))
    pb = base - 12 - 8
    so.lathe(c, cx, pb, [(0, 9), (5, 9), (6, 7), (H, 6), (H + 2, 8), (H + 6, 4), (H + 10, 0.5)], WHITE, ribs=8)
    for k, z in enumerate(range(16, H - 6, 16)):
        y = pb - z
        so.ellipse(c, cx, y, 2.6, 2.6, BOWL[1])
        so.ellipse(c, cx, y, 1.5, 1.5, BOWL[3])
        c.p(cx - 1, y - 1, WHITE[0])


def swahili_mosque(spec=None, info=None):
    s = {**dict(W=200, wall=54, depth=130, look='kilwa', bays=4, seed=5), **(spec or {})}
    W, wh, D, look = s['W'], s['wall'], s['depth'], s['look']
    extra = 70 if look == 'tomb' else 0
    L = 20
    base = round(D * so.K) + wh + 74
    c = C(W + extra + 2 * L, base + 8)
    R = L + W
    wb = base - 4

    def roof_top(c, x, y, w, h):
        flat_roof(WHITE, 11, lit=0)(c, x, y, w, h)
        for yy in range(y + 8, y + h - 4, 12):
            for xx in range(x + 4, x + w - 4, 3):
                c.p(xx, yy, WHITE[2])

    so.box(c, L, wb, W, wh, D, coral_wall, roof_top)
    top = wb - wh
    roof_back = top - round(D * so.K)
    if look == 'kilwa':
        # rows of little domes and barrel vaults over the bays of the hall
        rows = 3
        for j in range(rows):
            y = roof_back + 12 + j * (top - roof_back - 14) // rows
            n = max(3, W // 34)
            for i in range(n):
                x = round(L + (i + 0.5) * W / n)
                if (i + j) % 2 and s['size'] != 'small':
                    so.vault(c, x, y + 6, 11, 18, WHITE, rings=5)
                else:
                    so.dome(c, x, y + 6, 10, WHITE, courses=0)
        if s['size'] == 'large':
            so.dome(c, L + W // 2, top - 6, 20, WHITE, kind='hemi', courses=0, ribs=14, drum=4)
    else:
        merlons(c, L, R, top + 1)
        for xx in (L + 8, R - 14):
            c.rect(xx, top + 4, 6, 3, CORAL[3]); c.rect(xx, top + 7, 2, 4, CORAL[4])

    # the arcade of the prayer hall's front
    bays = s['bays']
    door_x = L + W // 2
    for i in range(bays):
        bx = round(L + (i + 0.5) * W / bays)
        if abs(bx - door_x) < 18:
            continue
        arch_door(c, bx, wb, 18, 42, CORAL, shape='pointed', leaf=False)
    if look == 'kilwa':
        arch_door(c, door_x, wb, 22, 46, CORAL, shape='pointed')
        dh = 46
    else:
        carved_door(c, door_x, wb, 24, 48)
        dh = 48
    # the cistern and its step by the door, where the town washes
    so.box(c, door_x + 18, base + 2, 22, 7, 12, WHITE)
    c.rect(door_x + 20, base - 12, 18, 2, ramp(220, 0.06, lift=-0.18)[3])
    so.box(c, L - 6, base + 2, W + 12, 3, 8, WHITE)
    if look == 'tomb':
        pillar_tomb(c, R + 40, base + 2, 84 if s['size'] != 'large' else 104)
    ground_shadow(c, L - 6, R + extra, base + 2)
    return complete(c, info, L - 6, W + 12 + extra, base + 2, door_x, dh, D + 10, roof='flat')


# ------------------------------------------------------------------ pharaonic Egypt

# A king smiting, a god holding out the sign of life: sunk relief, two
# rows of pixels per figure row.
KING = ["....##......",
        "...####.....",
        "....##..##..",
        "..######.#..",
        ".#.####..#..",
        "#..####.....",
        "...####.....",
        "...####.....",
        "...#..#.....",
        "...#..#.....",
        "..##..##....",
        "............"]
GOD = [".....#......",
       "....###.....",
       "....###.....",
       "...#####....",
       "..#.###.#...",
       ".##.###.....",
       "....###.....",
       "....###.....",
       "....#.#.....",
       "....#.#.....",
       "...##.##....",
       "............"]


def relief(c, x, y, pattern, r, paint=None, s=2):
    for j, row in enumerate(pattern):
        for i, ch in enumerate(row):
            if ch != '#':
                continue
            col = paint[(i + j) % len(paint)][3] if paint else r[4]
            for dy in range(s):
                for dx in range(s):
                    c.p(x + i * s + dx, y + j * s + dy, col)
            if j and pattern[j - 1][i] != '#':
                c.rect(x + i * s, y + j * s, s, 1, r[5])


def gorge(c, x, top, w, r, painted=None):
    """The cavetto cornice: a lit lip, the concave band in vertical leaves,
    the rounded torus under it, and the band's shadow."""
    c.rect(x - 4, top, w + 8, 2, r[1])
    for k in range(7):
        ins = 4 - (k * 4) // 7
        for xx in range(x - ins, x + w + ins):
            leaf = (xx - x) % 4
            q = 3 if leaf < 2 else 4
            if painted and k > 1:
                col = painted[(xx - x) // 4 % len(painted)][2 + (leaf > 1)]
            else:
                col = r[q + (k > 4)]
            c.p(xx, top + 2 + k, col)
    c.rect(x - 1, top + 9, w + 2, 2, r[1]); c.rect(x - 1, top + 11, w + 2, 1, r[4])
    op.cast(c, x, top + 12, w, 3, 0.7)


def pylon_tower(c, cx, top, base, w, r, tex, paint, flip):
    w1 = w - 12
    batter(c, cx, top, base, w, w1, r, tex)
    # the torus moulding down the battered edges
    for yy in range(top, base):
        t = (yy - top) / max(1, base - top - 1)
        half = (w1 + (w - w1) * t) / 2
        c.p(round(cx - half), yy, r[0]); c.p(round(cx - half) + 1, yy, r[1])
        c.p(round(cx + half) - 1, yy, r[5])
    gorge(c, round(cx - w1 / 2), top - 13, w1, r, paint)
    so.box(c, round(cx - w1 / 2) - 4, top - 12, w1 + 8, 1, 18, r)
    # the flagstaff niches on the side toward the gate
    nx = round(cx + (w1 / 2 - 10) * (1 if flip else -1))
    for yy in range(top + 6, base):
        c.p(nx - 2, yy, r[5]); c.p(nx - 1, yy, r[5]); c.p(nx, yy, r[6]); c.p(nx + 1, yy, r[4])
    fh = base - top + 40
    for yy in range(base - fh, base):
        c.p(nx - 1, yy, CEDAR[2]); c.p(nx, yy, CEDAR[4])
    for k in range(3):
        c.rect(nx - 3, top + 14 + k * 22, 6, 2, CEDAR[3])
    flag(c, nx - 1, base, fh, PENNANT, w=10, fh=7)
    fx = round(cx - 14) if not flip else round(cx - 10)
    relief(c, fx, top + 22, KING if not flip else GOD, r, paint)
    relief(c, fx + 4, top + 58, GOD if not flip else KING, r, paint) if base - top > 90 else None


def obelisk(c, cx, base, H, r):
    so.box(c, cx - 8, base, 16, 5, 10, r)
    b = base - 5
    for yy in range(b - H, b):
        t = (yy - (b - H)) / H
        half = 3.5 + 3 * t
        for xx in range(round(cx - half), round(cx + half)):
            c.p(xx, yy, r[1] if xx < cx - half + 2 else r[2] if xx < cx + half - 2 else r[4])
    for yy in range(b - H + 8, b - 6, 4):
        c.p(cx - 1, yy, r[4]); c.p(cx, yy + 1, r[5])
    for k in range(7):
        for xx in range(cx - k // 2 - 1, cx + k // 2 + 1):
            c.p(xx, b - H - 7 + k, GOLD[1] if xx < cx else GOLD[3])


def pylon_temple(spec=None, info=None):
    s = {**dict(W=220, pylon=100, look='sandstone', obelisks=False, seed=2), **(spec or {})}
    look, W, ph = s['look'], s['W'], s['pylon']
    r = {'sandstone': RAMPS['sandstone'], 'limestone': RAMPS['limestone'], 'mudbrick': RAMPS['adobe']}[look]
    frame = RAMPS['sandstone'] if look == 'mudbrick' else r
    paint = [ramp(25, 0.13, lift=-0.06), ramp(250, 0.1, lift=-0.1), ramp(85, 0.12, lift=0.0)] if look == 'limestone' else None
    D = s.get('depth', 160)
    hall_h = round(ph * 0.62)
    L = 18
    base = round(D * so.K) + hall_h + 40 + max(0, ph - hall_h - round(D * so.K) + 60)
    c = C(W + 2 * L, base + 10)
    cx = L + W // 2

    def tex(xx, yy, q):
        if look == 'mudbrick':
            row = yy // 4
            joint = yy % 4 == 3 or (xx + (row % 2) * 5) % 10 == 9
            return r[min(7, q + 1)] if joint else r[q]
        joint = yy % 9 == 8 or (xx + (yy // 9 % 2) * 11) % 22 == 21
        return r[min(7, q + 1)] if joint else r[q]

    # the hypostyle hall behind, its roof slabs and a raised nave
    hw = W - 40
    def hall_roof(c, x, y, w, h):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                c.p(xx, yy, r[2] if (xx - x) % 16 else r[3])
        c.rect(x, y, w, 1, r[1])
    so.box(c, cx - hw // 2, base - 30, hw, hall_h, D - 40, lambda c, x, y, w, h: fm.fill(c, x, y, w, h, lambda a, b: tex(a, b, 3)), hall_roof)
    so.box(c, cx - hw // 6, base - 40, hw // 3, hall_h + 14, D - 60, lambda c, x, y, w, h: fm.fill(c, x, y, w, h, lambda a, b: tex(a, b, 3)), hall_roof)

    tw = (W - 40) // 2
    gw = 44
    for side in (-1, 1):
        tcx = cx + side * (gw // 2 + tw // 2 - 4)
        pylon_tower(c, tcx, base - ph, base, tw, r, tex, paint, side < 0)
    # the gate between the towers, a little lower, in dressed stone
    gt = base - round(ph * 0.66)
    so.box(c, cx - gw // 2, base, gw, base - gt, 16, lambda c, x, y, w, h: fm.fill(c, x, y, w, h, lambda a, b: tex(a, b, 2) if look != 'mudbrick' else frame[2]), frame)
    gorge(c, cx - gw // 2 + 3, gt - 12, gw - 6, frame, paint)
    dw, dh = 24, 52
    op.raised(c, cx - dw // 2 - 4, base - dh - 4, dw + 8, dh + 4, frame, 2)
    for yy in range(base - dh, base):
        for xx in range(cx - dw // 2, cx + dw // 2):
            lx = xx - cx + dw // 2
            c.p(xx, yy, CEDAR[5] if lx in (0, dw // 2) else CEDAR[3] if lx % 4 else CEDAR[4])
    op.reveal(c, cx - dw // 2, base - dh, dw, dh, 3)
    # a winged disc over the door
    for k in range(-9, 10):
        c.p(cx + k, base - dh - 9 + abs(k) // 4, GOLD[2] if k < 0 else GOLD[3])
    so.ellipse(c, cx, base - dh - 9, 2.5, 2.5, PENNANT[2])
    if s['obelisks']:
        for side in (-1, 1):
            obelisk(c, cx + side * (gw // 2 + 18), base + 6, round(ph * 1.05), ramp(28, 0.06, lift=-0.04))
    so.box(c, L - 4, base + 6, W + 8, 6, 12, frame)
    ground_shadow(c, L - 4, L + W + 4, base + 6)
    return complete(c, info, L - 4, W + 8, base + 6, cx, dh, D, roof='flat')


# ------------------------------------------------------------------ shrine houses

def painted_earth(lower, upper=None, split=0.42, motif=None):
    """A wall in two parts: polished earth below, a lighter wash above, and a
    painted or relief band at the join."""
    def paint(c, x, y, w, h):
        cut = y + round(h * (1 - split))
        if upper:
            fm.render(c, x, y, w, cut - y, upper)
        for yy in range(cut if upper else y, y + h):
            for xx in range(x, x + w):
                c.p(xx, yy, lower[2] if (yy - cut) % 7 else lower[3])
        c.rect(x, cut, w, 1, lower[1])
        if motif:
            motif(c, x, y, w, h, cut)
    return paint


def scrolls(c, x, y, w, h, cut):
    """Asante relief: spirals and interlace raised in the white plaster."""
    for cx in range(x + 10, x + w - 8, 18):
        cy = y + (cut - y) // 2 + 2
        for a in range(0, 330, 15):
            rr = 2 + a / 110
            px = round(cx + math.cos(math.radians(a)) * rr)
            py = round(cy + math.sin(math.radians(a)) * rr * 0.9)
            c.p(px, py, WHITE[0] if a % 180 < 90 else WHITE[4])
        c.rect(cx + 5, cy - 6, 1, 12, WHITE[3]); c.rect(cx + 6, cy - 6, 1, 12, WHITE[0])
    c.rect(x, cut - 4, w, 1, WHITE[0]); c.rect(x, cut - 3, w, 1, WHITE[4])


def yoruba_band(c, x, y, w, h, cut):
    """White zigzags and indigo dots painted across the earth wall."""
    my = cut + (y + h - cut) // 2 - 2
    for xx in range(x + 1, x + w - 1):
        k = (xx - x) % 8
        yy = my - (k if k < 4 else 8 - k)
        c.p(xx, yy, CLOTH[1]); c.p(xx, yy + 1, CLOTH[2])
    for xx in range(x + 4, x + w - 3, 8):
        so.ellipse(c, xx, my + 6, 1.5, 1.5, INDIGO[2])
        so.ellipse(c, xx + 4, my - 8, 1.2, 1.2, INDIGO[2])


def benin_ribs(c, x, y, w, h, cut):
    """Benin's polished red walls, ribbed in horizontal ridges."""
    for yy in range(y + 4, y + h - 3, 6):
        c.rect(x, yy, w, 1, LATERITE[1]); c.rect(x, yy + 1, w, 1, LATERITE[4])


def serpent(c, x, y, w, h, cut):
    """Dan, the rainbow serpent, painted round the Fon temple's wall."""
    cols = [ramp(25, 0.14, lift=-0.04), ramp(85, 0.13, lift=0.02), ramp(150, 0.1, lift=-0.08), ramp(250, 0.1, lift=-0.08)]
    my = y + h // 2 - 4
    for xx in range(x + 4, x + w - 4):
        yy = my + round(4 * math.sin((xx - x) / 7))
        for k, col in enumerate(cols):
            c.p(xx, yy + k, col[2])
    hx = x + w - 6
    so.ellipse(c, hx, my + round(4 * math.sin((hx - x) / 7)) + 1, 3, 2.5, cols[0][3])
    for k, fx in enumerate((x + 10, x + w // 2 - 6)):
        relief(c, fx, y + 6, GOD if k else KING, WHITE, [ramp(30, 0.12, lift=-0.1)], s=1)


ev.WALL['sacred-asante'] = painted_earth(LATERITE, WHITE, 0.4, scrolls)
ev.WALL['sacred-yoruba'] = painted_earth(RED_EARTH, None, 1.0, yoruba_band)
ev.WALL['sacred-benin'] = painted_earth(LATERITE, None, 1.0, benin_ribs)
ev.WALL['sacred-fon'] = painted_earth(WHITE, WHITE, 0.25, serpent)


def asante_open(h):
    """The god's room open to the court: a raised floor, the shrine's brass
    pan on its stool against the shadowed back wall, two pillars."""
    c, x0, W, base = h.c, h.x0, h.W, h.base
    cx = x0 + W // 2
    ow = W - 36
    top = h.eave + 6
    floor = base - 14
    for yy in range(top, floor):
        for xx in range(cx - ow // 2, cx + ow // 2):
            c.p(xx, yy, WHITE[5] if yy < floor - 16 else LATERITE[5])
    for xx in range(cx - ow // 2 + 6, cx + ow // 2 - 6, 8):
        for yy in range(top + 6, top + 16):
            if (xx + yy) % 4 == 0:
                c.p(xx, yy, VOID); c.p(xx + 1, yy, VOID)
    op.cast(c, cx - ow // 2, top, ow, 10, 0.6)
    so.box(c, cx - 7, floor - 2, 14, 6, 8, CEDAR)
    so.lathe(c, cx, floor - 8, [(0, 4), (3, 7), (5, 7)], BRONZE, hollow=(6, 3))
    so.box(c, cx - ow // 2, base, ow, 14, 10, LATERITE)
    for px in (cx - ow // 2 - 2, cx + ow // 2 - 6):
        bevel(c, px, top - 2, 8, base - top + 2, WHITE, 2)
        c.rect(px, base - 16, 8, 16, LATERITE[2]); c.rect(px, base - 16, 8, 1, LATERITE[1])
    for sx in (cx - 16, cx + 16):
        c.rect(sx - 2, floor + 2, 4, 1, LATERITE[1])
    h.door_x, h.door_h = cx, floor - top


def cloth_door(h):
    """A low doorway hung with white cloth, the shrine's colour."""
    c, x0, W, base = h.c, h.x0, h.W, h.base
    cx = x0 + W // 2
    dw, dh = 20, 40
    op.raised(c, cx - dw // 2 - 3, base - dh - 3, dw + 6, dh + 3, h.s.get('frame_r', RED_EARTH), 2)
    c.rect(cx - dw // 2, base - dh, dw, dh, VOID)
    for yy in range(base - dh, base - 8):
        for xx in range(cx - dw // 2, cx + dw // 2):
            fold = (xx - cx) % 5
            c.p(xx, yy, CLOTH[1 if fold < 2 else 2 if fold < 4 else 3])
    c.rect(cx - dw // 2, base - dh, dw, 2, CLOTH[0])
    op.reveal(c, cx - dw // 2, base - dh, dw, dh, 2)
    h.door_x, h.door_h = cx, dh


ev.OPENINGS['sacred-asante'] = asante_open
ev.OPENINGS['sacred-cloth'] = cloth_door


class ShrineHouse(ev.VernacularHouse):
    """The eave-front thatched house with a veranda of carved figure posts
    in place of plain ones."""

    def gallery(self):
        c, x0 = self.c, self.x0
        op.cast(c, x0, self.eave, self.W, 18, 0.55)
        self.eave += 12
        n = max(2, round(self.W / 38))
        for k in range(n + 1):
            px = round(x0 + 2 + k * (self.W - 9) / n)
            if abs(px - self.door_x) < 16:
                continue
            figure_post(c, px, self.eave + 4, self.base)
        so.box(c, x0 - 4, self.base + 3, self.W + 8, 4, 6, RED_EARTH)


def figure_post(c, x, top, base):
    """A carved veranda post: a kneeling figure holding the beam on its head,
    painted in white and indigo, on a plain shaft."""
    w = ramp(40, 0.08, lift=-0.16)
    bevel(c, x, top, 6, base - top, w, 2)
    fy = top + 4
    so.ellipse(c, x + 3, fy + 3, 3.2, 3.5, w[3])
    c.p(x + 2, fy + 2, w[1]); c.p(x + 3, fy + 4, w[6])
    c.rect(x - 1, fy + 7, 8, 3, w[2]); c.rect(x - 1, fy + 9, 8, 1, w[4])
    c.rect(x + 1, fy + 10, 4, 8, w[3]); c.rect(x + 1, fy + 10, 1, 8, w[1])
    c.rect(x - 1, fy + 12, 2, 5, INDIGO[2]); c.rect(x + 5, fy + 12, 2, 5, INDIGO[3])
    c.rect(x, fy + 18, 6, 2, CLOTH[1])


def shrine_house(spec, gallery=None):
    cls = ShrineHouse if gallery == 'figures' else ev.VernacularHouse
    h = cls({**spec, 'gallery': bool(gallery)})
    h.post = POLE
    h.walls()
    h.openings()
    if gallery:
        h.gallery()
    h.roof()
    return h


def turret(c, cx, foot, w, h):
    """Benin's palace turret: a tall square pyramid of shingles, a cast brass
    bird on its point."""
    t = ramp(44, 0.06, lift=-0.14)
    for yy in range(foot - h, foot):
        k = (yy - (foot - h)) / h
        half = w / 2 * k
        for xx in range(round(cx - half), round(cx + half) + 1):
            col = t[2] if xx < cx - half * 0.2 else t[4]
            if (yy - foot) % 4 == 0:
                col = t[5] if xx >= cx - half * 0.2 else t[3]
            c.p(xx, yy, col)
    b = foot - h
    for k, (dx, dy) in enumerate(((0, 0), (1, -1), (2, -1), (3, -2), (-1, -1), (-2, -1), (4, -3), (0, -2), (1, -2))):
        c.p(cx + dx, b + dy - 2, BRONZE[2 if k % 2 else 3])
    c.rect(cx, b - 2, 1, 3, BRONZE[4])


def stake_fence(c, L, R, base, gap, r=POLE, h=16, cloths=True):
    for k, xx in enumerate(range(L, R, 6)):
        if gap[0] <= xx <= gap[1]:
            continue
        hh = h + (k % 3) - 1
        c.rect(xx, base - hh, 3, hh, r[3]); c.rect(xx, base - hh, 1, hh, r[1]); c.rect(xx + 2, base - hh, 1, hh, r[5])
        c.p(xx + 1, base - hh - 1, r[2])
        if cloths and k % 5 == 2:
            c.rect(xx - 1, base - hh + 4, 5, 3, CLOTH[1]); c.p(xx + 3, base - hh + 7, CLOTH[2])
    for yy in (base - h + 4, base - 5):
        for xx in range(L, R):
            if not gap[0] <= xx <= gap[1]:
                c.p(xx, yy, r[2])


def shrine_compound(spec=None, info=None):
    s = {**dict(look='yoruba', W=130, size='medium', seed=4), **(spec or {})}
    look, W = s['look'], s['W']
    wall = {'yoruba': 'sacred-yoruba', 'benin': 'sacred-benin', 'fon': 'sacred-fon', 'asante': 'sacred-asante'}[look]
    tone = {'yoruba': 'straw-old', 'benin': 'straw-old', 'fon': 'straw', 'asante': 'reed'}[look]
    hs = dict(W=W, storeys=[wall], heights=[s.get('wall', 52)], roof='thatch', tone=tone, hip=True,
              openings='sacred-asante' if look == 'asante' else 'sacred-cloth', seed=s['seed'], wear=0.35,
              rise=s.get('rise'))
    main = shrine_house(hs, 'figures' if look == 'yoruba' else None)
    side = None
    if s.get('wings'):
        side = shrine_house(dict(hs, W=s['wings'], heights=[44], openings='sacred-cloth' if look != 'asante' else 'sacred-cloth',
                                 rise=None), None)
    fence = 34 if look == 'fon' and s['size'] != 'small' else 0
    wings = (side.c.w - 30) if side else 0
    cw = main.c.w + 2 * wings + 20
    lift = 16 if side else 0
    ch = max(main.c.h + lift, side.c.h if side else 0) + 6 + (fence and 4)
    c = C(cw, ch + fence // 3)
    mx = wings + 10
    base = ch - 6
    if look == 'benin':
        turret(main.c, main.x0 + main.W // 2, main.eave - main.rise + 14, 34 if s['size'] != 'small' else 26,
               main.rise + 26)
    c.im.alpha_composite(main.c.im, (mx, base - lift - main.base))
    if side:
        # the court's side ranges, set forward of the god's room
        sx0 = 6
        c.im.alpha_composite(side.c.im, (sx0 - 10, base - side.base))
        c.im.alpha_composite(side.c.im.transpose(0), (cw - side.c.w + 4, base - side.base))
    door_x = mx + main.door_x
    if lift:
        for yy in range(base - lift + 2, base):
            for xx in range(mx + main.x0 - 2, mx + main.x0 + main.W + 2):
                if not c.g(xx, yy)[3]:
                    c.p(xx, yy, LATERITE[3] if h2(xx // 2, yy, 9) > 0.15 else LATERITE[4])
    if fence:
        stake_fence(c, 6, cw - 6, base + fence // 3, (door_x - 14, door_x + 14))
    so.lathe(c, door_x + 22, base, [(0, 3), (4, 5), (8, 4), (9, 3)], RAMPS['terracotta'], hollow=(3, 6))
    ground_shadow(c, 4, cw - 4, base)
    return complete(c, info, 4, cw - 8, base + fence // 3, door_x, main.door_h, s.get('depth', 110), roof='gable')


# ------------------------------------------------------------------ the sacred grove

def great_tree(c, cx, by, s=1.0, kind='ceiba'):
    """A silk-cotton or iroko tree: a buttressed trunk and a wide crown."""
    so.lathe(c, cx, by, [(0, 9 * s), (4 * s, 5 * s), (12 * s, 3.6 * s), (46 * s, 3 * s)], BARK, ribs=6)
    for side in (-1, 1):
        for k in range(int(10 * s)):
            c.p(cx + side * (4 * s + k), by - 2 - (10 * s - k) // 3, BARK[2 if side < 0 else 5])
    clumps = [(0, -2, 56, 24), (-24, 2, 48, 18), (24, 0, 50, 19), (-10, 6, 64, 16), (14, 5, 66, 16)]
    for dx, dy, zc, R in sorted(clumps, key=lambda q: -q[1]):
        so.sphere(c, cx + dx * s, by + dy * s * so.K, zc * s, R * s, LEAF, squash=0.7)


def round_hut(c, cx, by, R=20, H=26, roof=STRAW, door=True):
    drum(c, cx, by, R, H, RED_EARTH)
    cone(c, cx, by, R + 6, R * 1.6, roof, courses=4, z0=H - 2)
    if door:
        c.rect(cx - 7, by - 24, 14, 22, VOID)
        c.rect(cx - 7, by - 24, 14, 2, RED_EARTH[5])


def sacred_grove(spec=None, info=None):
    s = {**dict(W=200, trees=2, size='medium', seed=6), **(spec or {})}
    W = s['W']
    base = 236
    c = C(W + 40, base + 10)
    cx = 20 + W // 2
    spots = {1: [(cx + 26, base - 34)], 2: [(cx - 46, base - 38), (cx + 50, base - 30)],
             3: [(cx - 74, base - 36), (cx + 6, base - 50), (cx + 80, base - 30)]}[s['trees']]
    for tx, ty in sorted(spots, key=lambda q: q[1]):
        great_tree(c, tx, ty, 1.45 if s['size'] != 'small' else 1.1)
    hx = cx - (20 if s['trees'] == 1 else 0)
    round_hut(c, hx, base - 10, 18, 24, STRAW, door=False)
    # the shrine's opening, low, with a white cloth and an offering pot
    c.rect(hx - 6, base - 30, 12, 18, VOID)
    for yy in range(base - 30, base - 18):
        c.rect(hx - 6, yy, 12, 1, CLOTH[1 + (yy % 3 == 0)])
    so.lathe(c, hx + 16, base - 4, [(0, 3), (4, 5), (8, 4), (9, 3)], RAMPS['terracotta'], hollow=(3, 6))
    so.lathe(c, hx - 18, base - 2, [(0, 2.5), (3, 4), (6, 3), (7, 2.5)], RAMPS['terracotta'], hollow=(2.5, 4))
    if s['size'] != 'small':
        stake_fence(c, 26, 20 + W - 6, base + 4, (hx - 16, hx + 16))
    ground_shadow(c, 20, 20 + W, base + 4)
    return complete(c, info, 20, W, base + 4, hx, 40, s.get('depth', 140), doorless=True, roof='gable')


BUILDERS = {'sahel-mosque': sahel_mosque, 'swahili-mosque': swahili_mosque, 'pylon-temple': pylon_temple,
            'shrine-compound': shrine_compound, 'sacred-grove': sacred_grove}

M = dict(label='Mosque', description='A small mosque of plastered mud, where the quarter prays.')
FM = dict(label='Friday mosque', description='The Friday mosque, where the town gathers for the noon prayer on Fridays.')
GM = dict(label='Great mosque', description='The great mosque, its walls replastered by the whole town every year.')
SW = dict(description='A mosque of coral stone and lime, cool inside, with a cistern at the door for washing.')
PY = dict(description="A god's house behind its gateway towers; only the priests go beyond the first court.")
OR = dict(description='The shrine house of a god, where offerings are brought and the priest keeps the god\'s things.')


def _sahel(look, size, **kw):
    lab = {'small': M, 'medium': FM, 'large': GM}[size]
    W = {'small': 160, 'medium': 214, 'large': 280}[size]
    wall = {'small': 54, 'medium': 64, 'large': 78}[size]
    towers = {'djenne': {'small': 1, 'medium': 3, 'large': 3}, 'timbuktu': {'small': 0, 'medium': 0, 'large': 0},
              'larabanga': {'small': 2, 'medium': 2, 'large': 2}}[look][size]
    tw = {'djenne': 32 if size != 'small' else 28, 'timbuktu': 30, 'larabanga': 26}[look]
    return ('sahel-mosque', dict(lab, W=W, wall=wall, depth=110 + 30 * ('small', 'medium', 'large').index(size),
                                 towers=towers, tower_w=tw, look=look, size=size, roof='flat',
                                 door=0.32 if towers != 1 else 0.24, **kw))


def _swahili(look, size):
    lab = {'small': M, 'medium': FM, 'large': GM}[size]
    W = {'small': 150, 'medium': 200, 'large': 260}[size]
    return ('swahili-mosque', dict(lab, **SW, W=W, wall=50 + 4 * ('small', 'medium', 'large').index(size),
                                   depth=110 + 30 * ('small', 'medium', 'large').index(size), look=look, size=size,
                                   bays=3 if size == 'small' else 4 if size == 'medium' else 6, roof='flat'))


def _pylon(look, size):
    lab = {'small': 'Shrine', 'medium': 'Temple', 'large': 'Great temple'}[size]
    return ('pylon-temple', dict(PY, label=lab, look=look, W={'small': 160, 'medium': 220, 'large': 290}[size],
                                 pylon={'small': 76, 'medium': 104, 'large': 130}[size],
                                 depth={'small': 120, 'medium': 160, 'large': 200}[size],
                                 obelisks=size == 'large', roof='flat'))


def _shrine(look, size, label):
    W = {'small': 96, 'medium': 120, 'large': 140}[size]
    wings = 0 if size == 'small' or look not in ('asante',) else (64 if size == 'medium' else 76)
    return ('shrine-compound', dict(OR, label=label, look=look, size=size, W=W, wings=wings,
                                    wall=50 if look != 'asante' else 58, rise=58 if look == 'asante' else None,
                                    depth=100 + 20 * ('small', 'medium', 'large').index(size), seed=3 + len(look)))


SIZES = ('small', 'medium', 'large')
SPECS = {
    'sahel-mosque': {z: [_sahel(l, z) for l in ('djenne', 'timbuktu', 'larabanga')] for z in SIZES},
    'swahili-mosque': {z: [_swahili(l, z) for l in ('kilwa', 'lamu', 'tomb')] for z in SIZES},
    'pylon-temple': {z: [_pylon(l, z) for l in ('sandstone', 'limestone', 'mudbrick')] for z in SIZES},
    'asante-shrine': {z: [_shrine('asante', z, 'Shrine house' if z != 'large' else 'Great shrine')] for z in SIZES},
    'yoruba-shrine': {z: [_shrine(l, z, 'Shrine') for l in ('yoruba', 'benin', 'fon')] for z in SIZES},
    'sacred-grove': {z: [('sacred-grove', dict(label='Shrine' if z == 'small' else 'Sacred grove', size=z,
                                               description='Old trees no one may cut, round the shrine of the spirit who lives there.',
                                               W={'small': 140, 'medium': 210, 'large': 270}[z],
                                               trees={'small': 1, 'medium': 2, 'large': 3}[z],
                                               depth={'small': 110, 'medium': 150, 'large': 180}[z]))] for z in SIZES},
}
