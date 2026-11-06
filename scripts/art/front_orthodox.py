"""Town houses of the Orthodox world: Byzantine and Rus.

    .venv/bin/python scripts/art/front_orthodox.py artifacts/front-orthodox.png

Byzantine (Constantinople, Thessalonike, Mystras, seventh to fifteenth
century): a ground storey of stone laced with bands of brick set in thick
mortar, the opus mixtum of the city walls and the churches; above it either
more of the same or a timber-framed upper room jettied over the street, as
the Mystras houses and the descriptions of the capital's lanes show. Small
round-headed windows with brick voussoirs, doors under a marble lintel with
a relieving arch, a low roof of curved tiles. On the large house a closed
timber balcony stands out on brackets.

Rus (Novgorod, Kyiv, Vladimir, tenth to seventeenth century): the izba, a
log room raised on its log basement (podklet), its gable to the street.
The logs cross at the corners, round ends standing out; small windows in
carved frames; a steep roof of boards or shingle gone silver, or thatch on a
poor house; carved bargeboards and the ridge log ending in a horse's head
over the gable. The door is in the entrance passage (seni) beside it, under
its own lower roof, as the excavated Novgorod yards and later houses have it.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_eave as ev  # noqa: E402
from art.front_house import bevel, roof_slope, ROOFS  # noqa: E402
from art.front_kit import outline, consolidate  # noqa: E402
from art.front_weather import weather  # noqa: E402

# ------------------------------------------------------------------ Byzantine

STONE = ramp(72, 0.045, lift=-0.04)
BRICK = ramp(36, 0.1, lift=-0.02)
MORTAR = ramp(70, 0.03, lift=0.02)
MARBLE = RAMPS['marble']
OAK = RAMPS['oak']


def opus_mixtum(c, x0, y0, w, h):
    """Courses of squared stone laced every so often with a band of thin
    bricks in thick mortar, the band running level through the wall."""
    fm.ashlar(c, x0, y0, w, h, STONE, 8, 20)
    band, gap = 9, 20
    y = y0 + 4
    while y + band <= y0 + h - 4:
        c.rect(x0, y - 1, w, 1, STONE[3])
        fm.brick(c, x0, y, w, band, BRICK, mortar=MORTAR)
        c.rect(x0, y, w, 1, MORTAR[2])
        y += band + gap


ev.WALL['opus-mixtum'] = opus_mixtum


def voussoirs(c, cx, spring, R, t=3, r=BRICK):
    """A round arch of bricks on edge, alternating tones, its extrados lit."""
    for yy in range(spring - R - t, spring + 1):
        for xx in range(cx - R - t, cx + R + t + 1):
            d = math.hypot(xx - cx + 0.5, yy - spring + 0.5)
            if R <= d < R + t and yy <= spring:
                ang = math.atan2(spring - yy, xx - cx)
                k = int(ang * 7) % 2
                col = r[2] if d >= R + t - 1 and xx <= cx else r[3 if k else 4]
                if d < R + 0.8:
                    col = r[5]
                c.p(xx, yy, col)


def arched_light(c, cx, top, w, h, paired=False):
    """A small round-headed window: the arch of bricks, the room dark in the
    deep reveal, a plaster sill; paired lights share a colonnette."""
    R = w // 2
    spring = top + R
    voussoirs(c, cx, spring, R)
    for yy in range(top, top + h):
        for xx in range(cx - R, cx + R):
            if yy < spring and math.hypot(xx - cx + 0.5, yy - spring + 0.5) >= R:
                continue
            c.p(xx, yy, (40, 30, 40, 255) if yy - top > 3 else (30, 22, 32, 255))
    for yy in range(top, top + h):
        for xx in range(cx - R, cx + R):
            if xx - (cx - R) < 2 and yy >= spring - 2:
                c.p(xx, yy, mix(c.g(xx, yy), (20, 14, 26, 255), 0.4))
    if paired:
        for yy in range(spring - 1, top + h):
            c.p(cx - 1, yy, MARBLE[1]); c.p(cx, yy, MARBLE[3])
        c.rect(cx - 2, spring - 2, 4, 2, MARBLE[2])
    op.raised(c, cx - R - 3, top + h, 2 * R + 6, 3, MARBLE, 1)
    op.cast(c, cx - R - 2, top + h + 3, 2 * R + 4, 2)


def lintel_door(c, cx, base, dw=22, dh=44):
    """A plank door under a marble lintel, a relieving arch of brick over the
    lintel with its lunette plastered."""
    dx = cx - dw // 2
    op.door_plank(c, dx, base - dh, dw, dh)
    ly = base - dh - 8
    R = dw // 2 + 5
    for yy in range(ly - R + 2, ly):
        for xx in range(cx - R, cx + R):
            if math.hypot(xx - cx + 0.5, yy - ly + 0.5) < R - 2:
                c.p(xx, yy, MORTAR[2] if yy > ly - R + 5 else MORTAR[3])
    voussoirs(c, cx, ly, R - 2, 4)
    op.raised(c, dx - 6, ly, dw + 12, 5, MARBLE, 1)
    op.cast(c, dx - 4, ly + 5, dw + 8, 2, 0.7)
    for k in range(3):
        c.rect(dx - 6 - k, base + k, dw + 12 + 2 * k, 1, MARBLE[k + 2])
    return dh


def balcony(c, cx, top, bottom, w, roof_r):
    """A closed timber balcony on the upper floor: board walls, a lattice
    light, a little tiled roof seen from above, struts under it to the wall."""
    x = cx - w // 2
    under = bottom + 10
    for k in range(3):
        sx = x + 4 + k * (w - 10) // 2
        for i in range(10):
            c.p(sx + (i if k == 0 else -i if k == 2 else 0), bottom + i, OAK[3])
            c.p(sx + 1 + (i if k == 0 else -i if k == 2 else 0), bottom + i, OAK[5])
    op.cast(c, x + 2, bottom + 1, w - 4, 4, 0.66)
    fm.boards(c, x, top, w, bottom - top, ramp(48, 0.07, lift=-0.08))
    bevel(c, x, top, 4, bottom - top, OAK, 3)
    bevel(c, x + w - 4, top, 4, bottom - top, OAK, 3)
    bevel(c, x - 2, bottom - 4, w + 4, 5, OAK, 3)
    lw, lh = w - 16, (bottom - top) * 3 // 5
    op.lattice(c, x + 8, top + 5, lw, lh)
    op.reveal(c, x + 8, top + 5, lw, lh, 2)
    bevel(c, x + 4, top + 5 + lh + 1, w - 8, 3, OAK, 3)
    for yy in range(top - 7, top + 2):
        fm.pantiles(c, x - 4, yy, w + 8, 1, roof_r)
    c.rect(x - 4, top + 1, w + 8, 1, roof_r[5])
    op.cast(c, x, top + 2, w, 3, 0.62)
    return under


def byzantine_openings(h):
    c, x0, W, s = h.c, h.x0, h.W, h.s
    n = max(2, W // 44)
    cols = [x0 + round(W * (k + 0.5) / n) for k in range(n)]
    door_col = n // 2 if n % 2 else n // 2 - (s['seed'] % 2)
    h.cols, h.door_col, h.sills = cols, door_col, []
    h.bay_col = 0 if door_col else len(cols) - 1
    for i, (top, ht, jet) in enumerate(h.floors):
        stone = s['storeys'][i] == 'opus-mixtum'
        for k, cx in enumerate(cols):
            if i == 0 and k == door_col:
                continue
            if i == 1 and s.get('balcony') and k == h.bay_col:
                continue
            if i == 0:
                arched_light(c, cx, top + 12, 12, 18)
                h.sills.append((cx - 9, top + 30, 18))
            elif stone:
                arched_light(c, cx, top + 10, 16 if W / n >= 44 else 12, 24, paired=W / n >= 44)
                h.sills.append((cx - 11, top + 34, 22))
            else:
                ww, wh = 16, ht - 24
                op.frame_timber(c, cx - ww // 2, top + 10, ww, wh, None)
                op.lattice(c, cx - ww // 2, top + 10, ww, wh)
                op.reveal(c, cx - ww // 2, top + 10, ww, wh, 2)
                h.sills.append((cx - ww // 2 - 6, top + 10 + wh + 5, ww + 12))
    cx = cols[door_col]
    h.door_x = cx
    h.door_h = lintel_door(c, cx, h.base)
    if s.get('balcony') and len(h.floors) > 1:
        top, ht, jet = h.floors[1]
        balcony(c, cols[h.bay_col], top + 16, top + ht + 6, min(54, W // len(cols) + 6), h.tone)


ev.OPENINGS['byzantine'] = byzantine_openings


def byzantine(spec=None, info=None):
    s = dict(W=140, size='medium', seed=0, roof='pantile', tone='pantile', wear=0.35)
    s.update(spec or {})
    size, seed = s['size'], s['seed']
    timber = seed % 2 == 0
    if size == 'small':
        storeys, heights = ['opus-mixtum'], [56]
    else:
        storeys = ['opus-mixtum', 'render' if timber else 'opus-mixtum']
        heights = [54, 48]
    hs = dict(W=s['W'], storeys=storeys, heights=heights, roof=s['roof'], tone=s['tone'],
              hip=size != 'small' and seed % 3 != 1, jetty=len(storeys) > 1 and timber,
              frame=timber, openings='byzantine', balcony=size == 'large', seed=seed, wear=s['wear'],
              plinth=None)
    h = ev.VernacularHouse(hs)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


# ------------------------------------------------------------------ Rus izba

LOG = ramp(56, 0.06, lift=-0.06)           # pine and spruce weathered grey-brown
LOG_OLD = ramp(62, 0.035, lift=-0.1)       # the basement logs, darker and greyer
END = ramp(66, 0.08, lift=0.02)            # the sawn and axed end grain, paler
CARVE = ramp(60, 0.07, lift=0.04)          # carved boards, fresh and pale
SILVER = [ramp(255, 0.015, lift=-0.04), ramp(60, 0.03, lift=-0.08), ramp(250, 0.02, lift=-0.1)]
STRAW_OLD = [ramp(70, 0.05, lift=-0.06), ramp(62, 0.045, lift=-0.1)]
D = 7


def log_wall(c, x0, y0, w, h, r, ext=4, phase=0):
    """Horizontal logs, each a cylinder lit on its upper face with moss and
    chinking dark between, running a little past the corner with a rounded
    end. Returns the course tops."""
    prof = (1, 2, 2, 3, 3, 4, 6)
    tops = []
    y = y0 + h - D
    while y > y0 - D:
        tops.append(y)
        y -= D
    for k, ly0 in enumerate(tops):
        e = ext + (k + phase) % 2
        for ly in range(D):
            yy = ly0 + ly
            if yy < y0:
                continue
            for xx in range(x0 - e, x0 + w + e):
                q = prof[ly]
                if 2 <= ly <= 4 and h2(xx // 13, k, 91) < 0.25 and xx % 13 < 6:
                    q += 1
                edge = min(xx - (x0 - e), x0 + w + e - 1 - xx)
                if edge == 0 and ly in (0, D - 1):
                    continue
                if edge == 0:
                    q = q + 1
                c.p(xx, yy, r[min(7, q)])
    return tops


def log_ends(c, x, tops, r, y0):
    """The side walls' logs ending at the corner: a column of round end
    discs, half a course off the front logs, rings lit on the upper left."""
    for t in tops:
        cy = t - D // 2
        if cy - 3 < y0:
            continue
        for yy in range(-4, 5):
            for xx in range(-4, 5):
                d = math.hypot(xx, yy)
                if d <= 3.3:
                    q = 1 if d < 1.2 else 3 if 1.9 < d < 2.5 else 2
                    if d > 2.7:
                        q = 4 if xx + yy > 0 else 2
                    c.p(x + xx, cy + yy, r[q])


def nalichnik(c, cx, top, w, h, r):
    """A small window in a carved frame: the board surround, a pointed crown
    over it cut with a row of holes, a shaped apron under the sill."""
    x = cx - w // 2
    for yy in range(top, top + h):
        for xx in range(x, x + w):
            c.p(xx, yy, op.GLASS[6] if yy - top > 2 else op.GLASS[7])
    for yy in range(top + 2, top + h - 1):
        c.p(cx, yy, OAK[4])
    for xx in range(x + 1, x + w - 1, 2):
        c.p(xx, top + h // 2, op.GLASS[5])
    op.raised(c, x - 3, top - 2, 3, h + 4, r, 2)
    op.raised(c, x + w, top - 2, 3, h + 4, r, 2)
    crown = w // 2 + 5
    for i in range(-crown, crown + 1):
        lift = round((crown - abs(i)) * 0.55)
        for k in range(4):
            col = r[1] if k == 0 else r[2] if k < 3 else r[4]
            c.p(cx + i, top - 3 - lift + k, col)
        for k in range(lift):
            c.p(cx + i, top - 3 - lift + 4 + k, r[2] if abs(i) < crown - 1 else r[3])
    for i in range(-crown + 3, crown - 2, 3):
        c.p(cx + i, top - 2, r[5])
    op.cast(c, x - 2, top + 1, w + 4, 2, 0.7)
    op.raised(c, x - 5, top + h, w + 10, 3, r, 1)
    for i in range(-(w // 2 + 2), w // 2 + 3):
        dip = 3 - abs(i) // 3 if abs(i) < 9 else 0
        for k in range(max(0, dip)):
            c.p(cx + i, top + h + 3 + k, r[3])
    op.cast(c, x - 4, top + h + 3 + 3, w + 8, 2)


def horse_head(c, x, y, r, face):
    """The ridge log's end carved as a horse's head looking out over the
    gable: neck rising from the ridge, the head bowed, an ear up."""
    rows = ['.....e.e..',
            '....hhhhh.',
            '...hhLhhhh',
            '..nhhhhhhh',
            '..nnh...hh',
            '.nnnn.....',
            '.nnnn.....',
            'nnnnn.....',
            'nnnnn.....',
            '.nnn......']
    pts = set()
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == '.':
                continue
            ii = i if face > 0 else 9 - i
            q = {'e': 3, 'h': 1 if j < 3 else 2, 'n': 1 if i < 2 else 3, 'L': 6}[ch]
            c.p(x + ii - 5, y + j, r[q])
            pts.add((x + ii - 5, y + j))
    for px, py in list(pts):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if (px + dx, py + dy) not in pts:
                c.p(px + dx, py + dy, r[6])


def bargeboard(c, x0, x1, apx, rake, r):
    """Carved boards along the rakes, their lower edge scalloped, a short
    hanging board under the apex."""
    for x in range(x0, x1 + 1):
        y = rake(x)
        left = x < apx
        rr = r if left else [mix(q, r[7], 0.18) for q in r]
        for k, idx in enumerate((1, 2, 3, 3, 4)):
            c.p(x, y + 1 + k, rr[idx])
        if (x - x0) % 6 in (2, 3):
            c.p(x, y + 6, rr[4])
        op.cast(c, x, y + 6 + ((x - x0) % 6 in (2, 3)), 1, 3, 0.6)
    py = rake(apx) + 5
    for yy in range(py, py + 14):
        for xx in range(apx - 3, apx + 4):
            q = 1 if xx == apx - 3 else 4 if xx == apx + 3 else 2
            if yy >= py + 11 and abs(xx - apx) > py + 13 - yy:
                continue
            c.p(xx, yy, r[q])
    for yy in range(py + 3, py + 11, 3):
        c.p(apx, yy, r[5])
    op.cast(c, apx + 4, py + 2, 2, 12, 0.7)


def izba(spec=None, info=None):
    s = dict(W=124, size='medium', seed=0, roof='shingle', wear=0.45)
    s.update(spec or {})
    size, seed, W = s['size'], s['seed'], s['W']
    sw = {'small': 30, 'medium': 34, 'large': 40}[size]
    mw = W - sw
    base_h = {'small': 12, 'medium': 18, 'large': 24}[size]
    room_h = {'small': 42, 'medium': 46, 'large': 50}[size]
    wall = base_h + room_h
    thatch = s['roof'] == 'thatch'
    rise = round(mw * (0.62 if thatch else 0.56))
    depth = 40 if size != 'large' else 46
    over = 8
    head = 14
    left_seni = seed % 2 == 0
    x0 = 16
    mx0 = x0 + (sw if left_seni else 0)
    mx1 = mx0 + mw
    sx0 = x0 if left_seni else mx1
    H = head + depth + rise + wall + 14
    c = C(x0 + W + 16, H)
    base = H - 5
    eave = base - wall
    apx = mx0 + mw // 2
    slope = rise / (mw / 2)

    def rake(x):
        return round(eave + 6 - (mw / 2 + over - abs(x - apx)) * slope)

    # the entrance passage: plank walls, a door at the ground, a lower roof
    seni_h = 56
    st = base - seni_h
    fm.boards(c, sx0, st, sw, seni_h, LOG)
    bevel(c, sx0, st, 4, seni_h, LOG, 2)
    bevel(c, sx0 + sw - 4, st, 4, seni_h, LOG, 2)
    dw, dh = 20, 42
    door_x = sx0 + sw // 2
    op.door_plank(c, door_x - dw // 2, base - dh, dw, dh)
    for k in range(2):
        c.rect(door_x - dw // 2 - 5, base + k, dw + 10, 1, LOG_OLD[3 + k])
    sr = STRAW_OLD[0] if thatch else SILVER[1]
    rl = sx0 - (6 if left_seni else 0)
    rr = sx0 + sw + (0 if left_seni else 6)
    for yy in range(st - 18, st + 2):
        if thatch:
            fm.thatch(c, rl, yy, rr - rl, 1, sr)
        else:
            fm.shingles(c, rl, yy, rr - rl, 1, sr, tw=8, th=6, mix_=False)
    c.rect(rl, st + 1, rr - rl, 1, sr[5]); c.rect(rl, st + 2, rr - rl, 1, sr[6])
    op.cast(c, sx0, st + 3, sw, 4, 0.62)

    # the gable wall: the basement, the room, the log gable
    gable_top = eave - rise
    log_wall(c, mx0, base - base_h, mw, base_h, LOG_OLD, ext=4, phase=1)
    tops = log_wall(c, mx0, gable_top, mw, wall - base_h + rise - 1, LOG, ext=4)
    for x in range(mx0 - 6, mx1 + 6):
        for y in range(gable_top, eave + 7):
            if y < rake(x) + 4:
                c.px[x, y] = (0, 0, 0, 0)
    corner_tops = [t for t in range(base, eave - 1, -D)]
    log_ends(c, mx0 - 2, corner_tops, END, eave + 3)
    log_ends(c, mx1 + 1, corner_tops, END, eave + 3)
    c.rect(mx0, base - base_h, mw, 1, LOG_OLD[6])
    # field stones under the corners
    for fx in (mx0 - 4, mx1 - 6, apx - 5):
        for yy in range(3):
            for xx in range(10):
                if (yy == 0 and xx in (0, 9)):
                    continue
                c.p(fx + xx, base + 1 + yy, RAMPS['granite'][2 + yy])
    # a low hatch into the basement
    if base_h >= 18:
        hx = mx0 + (mw - 14 if left_seni else 6)
        c.rect(hx, base - 12, 10, 9, (44, 32, 38, 255))
        bevel(c, hx - 2, base - 14, 14, 2, LOG_OLD, 2)
    # windows of the room, and a light in the gable
    n = 2 if size == 'small' else 3
    sills = []
    ww, wh = 12, 18
    wy = base - base_h - room_h + 12
    for k in range(n):
        wcx = mx0 + round(mw * (k + 0.5) / n)
        if n == 3 and k == 1 and size == 'medium':
            wcx = apx
        nalichnik(c, wcx, wy, ww, wh, CARVE)
        sills.append((wcx - ww // 2 - 5, wy + wh + 3, ww + 10))
    gy = rake(apx) + 26
    if eave - gy > 18:
        nalichnik(c, apx, gy, 10, 12, CARVE)

    # roof: two slopes running back from the rakes
    roof, shaded = set(), set()
    if thatch:
        tones = STRAW_OLD
        mat = 'thatch'
    else:
        tones = SILVER
        mat = 'shingle'
    roof_slope(c, apx, mx0 - over, rake, depth, 0, mat, roof, shaded, tones=tones)
    roof_slope(c, apx, mx1 + over, rake, depth, 1, mat, roof, shaded, tones=tones)
    bargeboard(c, mx0 - over, mx1 + over, apx, rake, CARVE)
    # the ridge log back along the top, and the horse's head over the gable
    ry0, ry1 = rake(apx) - depth - 1, rake(apx) + 1
    for y in range(ry0, ry1):
        for k, q in enumerate((5, 3, 2, 3, 5)):
            c.p(apx - 2 + k, y, LOG[q])
    horse_head(c, apx, ry1 - 11, LOG, 1 if seed % 3 else -1)
    weather(c, dict(roof=roof, roof_shade=shaded, eave_y=lambda x: rake(x),
                    walls={(x, y) for y in range(eave, base) for x in range(mx0, mx1)},
                    stone=set(), sills=sills, chimneys=[]), s['wear'], seed)
    outline(c)
    consolidate(c)
    if info is not None:
        info.update(x0=x0, W=W, base=base, door_x=door_x, door_h=dh)
    return c.im


BUILDERS = {'byzantine': byzantine, 'izba': izba}
STUDIES = [
    ('byz-small', 'byzantine', dict(W=100, size='small', seed=1)),
    ('byz-medium-timber', 'byzantine', dict(W=140, size='medium', seed=2)),
    ('byz-medium-stone', 'byzantine', dict(W=140, size='medium', seed=3)),
    ('byz-large', 'byzantine', dict(W=190, size='large', seed=4)),
    ('izba-small-thatch', 'izba', dict(W=100, size='small', roof='thatch', seed=1)),
    ('izba-medium', 'izba', dict(W=124, size='medium', seed=2)),
    ('izba-large', 'izba', dict(W=150, size='large', seed=5)),
]


if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    ims = [BUILDERS[kind](spec) for _, kind, spec in STUDIES]
    a = current_adult()
    W = sum(i.width + 8 for i in ims) + a.width + 10
    H = max(i.height for i in ims) + 8
    bg = Image.new('RGBA', (W, H), (214, 206, 186, 255))
    x = 4
    for im in ims:
        bg.alpha_composite(im, (x, H - 4 - im.height)); x += im.width + 8
    bg.alpha_composite(a, (x, H - 8 - a.height))
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-orthodox.png'
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    bg.resize((W * 2, H * 2), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
