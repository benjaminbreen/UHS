"""Synagogues, Zoroastrian fire temples and the Polynesian sanctuaries.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-world.png world

Galilean basilica synagogues of the third to sixth centuries (Capernaum in
white limestone, Chorazin in basalt); the whitewashed court synagogues of
Ottoman Safed and Djerba and the stone ones of Salonica; the fortress
synagogue of Brody and the tiered wooden synagogues of Poland-Lithuania.
The Sasanian chahar taq, the walled fire house with its ambulatory, and
the stone tower of Naqsh-e Rostam; the Parsi agiary and atash behram.
The Hawaiian heiau, the Tahitian marae and the Maori meeting house.
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
from art import front_persian as persia  # noqa: E402
from art.front_sacred import complete, arch_door, steps, cone, flag, ground_shadow, VOID, GOLD  # noqa: E402

LIME = RAMPS['limestone']
BASALT = ramp(262, 0.02, lift=-0.17)
WHITE = RAMPS['whitewash']
BLUE = ramp(238, 0.1, lift=-0.08)
TILE = fp.tone_for('plain', 'tile-red')
LEAD = RAMPS['lead']
RENDER = ramp(72, 0.05, lift=0.0)
SHINGLE = fp.tone_for('shingle', 'shingle-silver')
PINE = ramp(48, 0.07, lift=-0.08)
RUBBLE = ramp(58, 0.035, lift=-0.04)
GYPSUM = ramp(85, 0.022, lift=0.04)
DARK_LIME = ramp(250, 0.015, lift=-0.2)
CREAM = ramp(78, 0.06, lift=0.03)
MANGALORE = ramp(36, 0.13, lift=-0.04)
LAVA = ramp(28, 0.018, lift=-0.16)
CORAL = ramp(82, 0.03, lift=0.02)
KAPA = ramp(88, 0.02, lift=0.06)
KOKOWAI = ramp(26, 0.14, lift=-0.1)
TOTARA = ramp(42, 0.07, lift=-0.12)
THATCH = RAMPS['thatch']
RAUPO = ramp(72, 0.07, lift=-0.04)
FIRE = ramp(48, 0.16, lift=0.04)
fm.glazes()


# ------------------------------------------------------------------ local parts

def face(c, x, y, w, h, kind, r):
    if kind == 'ashlar':
        fm.ashlar(c, x, y, w, h, r, 7, 16)
    elif kind == 'rubble':
        fm.rubble(c, x, y, w, h, r, GYPSUM)
    elif kind == 'render':
        fm.render(c, x, y, w, h, r)
    elif kind == 'logs':
        fm.logs(c, x, y, w, h, r)
    elif kind == 'boards':
        fm.boards(c, x, y, w, h, r)
    elif kind == 'mud':
        persia.wall(c, x, y, w, h)
    else:
        c.rect(x, y, w, h, r[2])


def gable_roof(c, cx, top, w, rise, D, tone):
    """A gable-front roof seen from above: the gable's outline carried back
    D px, the left slope lit and the right in shade, the ridge between."""
    half = w / 2 + 3
    for i in range(-int(half), int(half) + 1):
        y0 = top + round(abs(i) * rise / (w / 2)) - 2
        for d in range(0, D):
            yy = y0 - d
            left = i < 0
            q = 2 if left else 4
            if abs(i) % 5 == 4:
                q += 1
            if d < 2:
                q += 1
            if abs(i) < 1:
                q = 1
            c.p(cx + i, yy, tone[min(7, q)])
    for d in range(D):
        c.p(cx, top - 2 - d, tone[0])


def pediment(c, cx, foot, w, rise, kind, r, coping=True):
    """The gable wall itself, its coping lit on the left slope."""
    top = foot - rise
    for yy in range(top, foot):
        half = (yy - top) * (w / 2) / rise
        face(c, round(cx - half), yy, round(2 * half), 1, kind, r)
    if coping:
        for i in range(-w // 2 - 3, w // 2 + 4):
            yy = top + round(abs(i) * rise / (w / 2)) - 2
            for k, q in enumerate((0, 1, 3)):
                c.p(cx + i, yy + k, r[q if i < 0 else min(7, q + 2)])
        for i in range(-w // 2, w // 2):
            fp.shade(c, cx + i, top + round(abs(i) * rise / (w / 2)) + 2, 0.3)
    return top


def cornice(c, x, y, w, r, dentils=False):
    c.rect(x - 3, y, w + 6, 2, r[0])
    c.rect(x - 3, y + 2, w + 6, 2, r[2])
    c.rect(x - 3, y + 4, w + 6, 1, r[4])
    if dentils:
        for xx in range(x, x + w, 4):
            c.rect(xx, y + 5, 2, 2, r[3])
    fp.cast_down(c, x - 2, x + w + 3, y + 5 + (2 if dentils else 0), 3, 0.4)


def flat_roof(c, x, y, w, D, r, parapet=True):
    """A flat roof seen from above with its parapet's lit lip and its shadow."""
    ty = y - round(D * so.K)
    c.rect(x, ty, w, y - ty, r[2])
    for yy in range(ty, y, 5):
        c.rect(x + 2, yy, w - 4, 1, r[3])
    if parapet:
        c.rect(x, ty, w, 2, r[0]); c.rect(x, ty + 2, w, 1, r[3])
        c.rect(x, ty, 2, y - ty, r[1]); c.rect(x + w - 2, ty, 2, y - ty, r[3])
        for k in range(4):
            for xx in range(x + 2, x + w - 2):
                fp.shade(c, xx, ty + 3 + k, 0.28 * (1 - k / 4))
    c.rect(x - 1, y - 2, w + 2, 2, r[0])
    return ty


def arch_window(c, cx, top, w, h, frame, fill='grille', shutter=None):
    """A round-headed opening in a lit frame: an iron grille on the dark,
    blue shutters, or a blind recess."""
    x0 = cx - w // 2
    f = fp.SHAPES['round']
    spring = top + w // 2
    for yy in range(top - 3, top + h + 1):
        for xx in range(x0 - 2, x0 + w + 2):
            if f(xx, yy, x0 - 2, spring, w + 4) and not f(xx, yy, x0, spring, w):
                c.p(xx, yy, frame[1] if xx < cx else frame[3])
    for yy in range(top, top + h):
        for xx in range(x0, x0 + w):
            if not f(xx, yy, x0, spring, w):
                continue
            lx = xx - x0
            if fill == 'shutter':
                col = shutter[2 if lx < w // 2 else 3]
                if lx in (0, w // 2) or (yy - top) % 4 == 0:
                    col = shutter[5]
            elif fill == 'blind':
                col = frame[5] if lx < 2 or yy < spring else frame[4]
            else:
                col = VOID if (lx % 3 and (yy - top) % 4) else mix(VOID, frame[4], 0.6)
                if yy < top + 2 or lx < 1:
                    col = VOID
            c.p(xx, yy, col)
    c.rect(x0 - 3, top + h, w + 6, 2, frame[0])
    fp.cast_down(c, x0 - 2, x0 + w + 3, top + h + 2, 2, 0.4)


def court_floor(c, x, y, w, D, r):
    """A paved court seen from above between a front wall and what stands
    behind it: flags in courses, darker under the far wall."""
    ty = y - round(D * so.K)
    for yy in range(ty, y):
        for xx in range(x, x + w):
            row = (yy - ty) // 4
            col = r[2] if ((xx + row * 5) % 12) else r[3]
            if (yy - ty) % 4 == 3:
                col = r[3]
            c.p(xx, yy, col)
    for k in range(5):
        for xx in range(x, x + w):
            fp.shade(c, xx, ty + k, 0.32 * (1 - k / 5))
    return ty


def front_wall(c, L, R, top, base, kind, r, coping=None):
    face(c, L, top, R - L, base - top, kind, r)
    cop = coping or r
    c.rect(L - 1, top - 3, R - L + 2, 2, cop[0]); c.rect(L - 1, top - 1, R - L + 2, 2, cop[2])
    fp.cast_down(c, L, R, top + 1, 3, 0.35)


def hood(c, cx, top, w, r, tone):
    """A small tiled hood over a court door on two stone brackets."""
    fp.roof_band(c, cx - w // 2, cx + w // 2, top, 8, 'plain', tone)
    for bx in (cx - w // 2 + 3, cx + w // 2 - 6):
        for k in range(5):
            c.rect(bx, top + 6 + k, 3 - k // 2, 1, r[2] if k < 3 else r[4])


def carved_band(c, x, y, w, r, motif='rosette'):
    """A carved lintel: a frieze of rosettes or a vine scroll in low relief."""
    c.rect(x, y, w, 6, r[2])
    c.rect(x, y, w, 1, r[0]); c.rect(x, y + 5, w, 1, r[4])
    if motif == 'rosette':
        for xx in range(x + 4, x + w - 3, 8):
            c.p(xx, y + 2, r[0]); c.p(xx - 1, y + 3, r[1]); c.p(xx + 1, y + 3, r[3]); c.p(xx, y + 4, r[4])
    else:
        for xx in range(x + 1, x + w - 1):
            yy = y + 3 + round(math.sin((xx - x) * 0.7))
            c.p(xx, yy, r[4]); c.p(xx, yy - 1, r[1])


# ------------------------------------------------------------------ synagogues

def synagogue(spec=None, info=None):
    s = {**dict(style='galilean', W=180, look=0), **(spec or {})}
    return {'galilean': galilean, 'sephardi': sephardi, 'stone': sephardi,
            'brody': brody, 'wooden': wooden}[s['style']](s, info)


def galilean(s, info):
    """A basilica facing Jerusalem: three doors in a stepped facade, pilasters,
    carved lintels, the arched Syrian gable over the great door."""
    W = s['W']
    r = BASALT if s['look'] == 1 else LIME
    wall_h = s.get('wall_h', 78)
    rise = round(W * 0.26)
    D = s.get('depth', 150)
    roof_d = min(30, round(D * so.K * 0.4))
    head = rise + roof_d + 10
    c = C(W + 40, head + wall_h + 22)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    eave = base - 8 - wall_h
    gable_roof(c, cx, eave - rise, W, rise, roof_d, TILE)
    face(c, x0, eave, W, base - 8 - eave, 'ashlar', r)
    pediment(c, cx, eave + 2, W, rise, 'ashlar', r)
    cornice(c, x0, eave, W, r, dentils=True)
    # Syrian gable: an arched window under an arched fronton in the gable.
    arch_window(c, cx, eave - rise + 18, 16, rise - 22, r, 'grille')
    for i in range(-14, 15):
        yy = eave - rise + 12 - round(math.sqrt(max(0, 196 - i * i)) * 0.5)
        c.p(cx + i, yy, r[0]); c.p(cx + i, yy + 1, r[3])
    pil = [x0 + 2, x0 + W - 8]
    side = s.get('doors', 3) == 3
    dw = 26
    sd = W // 4
    if side:
        pil += [cx - sd // 2 - 2 - 6, cx + sd // 2 + 2]
    for px in pil:
        fp.raised(c, px, eave + 6, 6, base - 8 - eave - 6, r, 2)
        c.rect(px - 1, eave + 6, 8, 3, r[0])
    door_top = base - 8 - 50
    carved_band(c, cx - dw // 2 - 6, door_top - 9, dw + 12, r)
    arch_door(c, cx, base - 8, dw, 50, r, 'square', band=3)
    if side:
        for sx in (cx - sd, cx + sd):
            carved_band(c, sx - 12, base - 8 - 40 - 8, 24, r, 'vine')
            arch_door(c, sx, base - 8, 16, 40, r, 'square', band=2)
            arch_window(c, sx, eave + 12, 12, 16, r, 'grille')
    steps(c, cx, base, W + 8, 2, r, rise=4)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 50, D)


def sephardi(s, info):
    """The prayer hall behind its walled court: flat roof and a low dome
    (whitewash, blue shutters) or a hipped tile roof (Ottoman stone)."""
    W = s['W']
    stone = s['style'] == 'stone'
    r = RAMPS['sandstone'] if stone else WHITE
    kind = 'ashlar' if stone else 'render'
    hall_h = s.get('hall_h', 62)
    court = s.get('court', 40)
    D = s.get('depth', 130)
    head = 70
    c = C(W + 40, head + hall_h + round(court * so.K) + 60)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    wall_top = base - 46
    court_back = wall_top - 3 - round(court * so.K)
    hall_top = court_back - hall_h
    hx0, hw = x0 + 10, W - 20
    if stone:
        fp.roof_band(c, hx0 - 6, hx0 + hw + 6, hall_top + 2, 34, 'plain', TILE, hip=0.7)
    else:
        flat_roof(c, hx0, hall_top + 2, hw, s.get('roof_d', 70), r)
        so.dome(c, cx, hall_top - 8, min(26, hw // 5), LEAD if s.get('lead') else WHITE, kind='hemi', courses=3)
        if s.get('domes', 1) > 1:
            for sx in (hx0 + 24, hx0 + hw - 24):
                so.dome(c, sx, hall_top - 4, 11, WHITE, kind='hemi', courses=2)
    face(c, hx0, hall_top + 2, hw, court_back - hall_top - 2, kind, r)
    c.rect(hx0, hall_top + 2, hw, 2, r[0])
    n = max(3, hw // 34)
    for k in range(n):
        wx = hx0 + round((k + 0.5) * hw / n)
        arch_window(c, wx, hall_top + 14, 12, 26, r if not stone else RAMPS['sandstone'],
                    'shutter' if not stone else 'grille', BLUE)
    court_floor(c, x0 + 2, wall_top - 3, W - 4, court, RAMPS['limestone'] if not stone else RAMPS['sandstone'])
    if s.get('tree', True):
        from art import front_props as pr
        pr.tree(c, x0 + W - 26, wall_top - 2, 'cypress' if stone else 'pomegranate', size=0.8)
    for yy in range(c.h):
        for xx in range(c.w):
            q = c.g(xx, yy)
            if q[3] and max(q[:3]) < 16:
                c.p(xx, yy, (34, 46, 36, 255))
    front_wall(c, x0, x0 + W, wall_top, base, kind, r, RAMPS['sandstone'])
    c.rect(x0, base - 6, W, 6, (RAMPS['sandstone'] if not stone else r)[3])
    c.rect(x0, base - 6, W, 1, (RAMPS['sandstone'] if not stone else r)[1])
    dw, dh = 22, 40
    door_wood = BLUE if not stone else RAMPS['oak']
    arch_door(c, cx, base, dw, dh, RAMPS['sandstone'], 'round', wood=door_wood, band=3)
    hood(c, cx, base - dh - 14, dw + 18, RAMPS['sandstone'], TILE)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, dh, D, roof='flat' if not stone else 'gable')


def brody(s, info):
    """The fortress synagogue: a tall square hall of rendered brick, high
    round-headed windows, buttressed corners, a Renaissance attic of blind
    arcades with a crested parapet hiding the roof."""
    W = s['W']
    r = RENDER
    wall_h = s.get('wall_h', 112)
    D = s.get('depth', 170)
    c = C(W + 40, wall_h + 70)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    top = base - wall_h
    attic = 24
    fp.roof_band(c, x0 + 6, x0 + W - 6, top + 4, 20, 'plain', TILE, hip=0.8)
    face(c, x0, top, W, wall_h, 'render', r)
    # attic: blind arcade and a crest of merlons
    c.rect(x0, top, W, attic, r[2])
    for ax in range(x0 + 4, x0 + W - 10, 13):
        for yy in range(top + 6, top + attic - 3):
            for xx in range(ax, ax + 9):
                if fp.rounded(xx, yy, ax, top + 10, 9):
                    c.p(xx, yy, r[4] if xx < ax + 2 else r[3])
    for mx in range(x0 - 1, x0 + W, 10):
        fp.raised(c, mx, top - 9, 6, 9, r, 1)
        c.rect(mx + 2, top - 12, 2, 3, r[1])
    cornice(c, x0, top + attic, W, r)
    n = max(3, (W - 30) // 40)
    for k in range(n):
        wx = x0 + 16 + round((k + 0.5) * (W - 32) / n)
        fp.window(c, 'roundhead', wx, top + attic + 16, 16, 44, r, seed=k, glass='clear')
    for bx in (x0 - 3, x0 + W - 7):
        fp.raised(c, bx, top + attic + 8, 10, wall_h - attic - 8, r, 2)
        for k in range(3):
            c.rect(bx - k, top + attic + 8 + k * 3 + 30, 10 + 2 * k, 1, r[1])
    c.rect(x0, base - 12, W, 12, r[4])
    c.rect(x0, base - 13, W, 1, r[1])
    arch_door(c, cx, base, 22, 44, RAMPS['sandstone'], 'round', band=4)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0 - 3, W + 6, base, cx, 44, D)


def wooden(s, info):
    """The wooden synagogue of the Polish-Lithuanian towns: a log hall under
    a tiered, broken roof of silver shingle, low galleries along the front."""
    W = s['W']
    r = PINE
    D = s.get('depth', 150)
    wall_h = s.get('wall_h', 64)
    c = C(W + 50, wall_h + 140)
    x0, base = 25, c.h - 6
    cx = x0 + W // 2
    top = base - wall_h
    tiers = s.get('tiers', 2)
    # the tiers rise from the back, the upper one smallest
    t2 = top - 30
    if tiers > 1:
        fp.roof_band(c, x0 + 26, x0 + W - 26, t2 - 22, 26, 'shingle', SHINGLE, hip=0.9)
        face(c, x0 + 34, t2 - 22, W - 68, 14, 'boards', r)
        fp.cast_down(c, x0 + 34, x0 + W - 34, t2 - 21, 3, 0.4)
    fp.roof_band(c, x0 - 6, x0 + W + 6, top, 34 if tiers > 1 else 44, 'shingle', SHINGLE, hip=0.5)
    face(c, x0, top + 4, W, wall_h - 4, 'logs', r)
    for k in range(2):
        wx = x0 + W // 4 + k * W // 2
        op.window(c, wx - 8, top + 14, 16, 22, frame='timber', infill='leaded')
    # the gallery: a lean-to on posts across the front
    gx0, gx1 = x0 + 8, x0 + W - 8
    gy = base - 46
    fp.roof_band(c, gx0 - 4, gx1 + 4, gy, 12, 'shingle', SHINGLE)
    for px in range(gx0, gx1, (gx1 - gx0) // 5):
        fp.raised(c, px, gy + 8, 4, base - gy - 8, r, 1)
    c.rect(gx0, base - 14, gx1 - gx0, 2, r[1]); c.rect(gx0, base - 12, gx1 - gx0, 1, r[4])
    arch_door(c, cx, base, 22, 40, r, 'square', wood=ramp(40, 0.06, lift=-0.16), band=2)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0 - 6, W + 12, base, cx, 40, D)


# ------------------------------------------------------------------ fire temples

def fire_altar(c, cx, base, r):
    """The fire on its stepped altar, glowing in the dark of the arch."""
    so.box(c, cx - 6, base, 12, 4, 6, r)
    so.box(c, cx - 3, base - 4, 6, 8, 4, r)
    so.box(c, cx - 7, base - 12, 14, 3, 8, r)
    for k in range(9):
        hw = max(0, 4 - k // 2)
        for i in range(-hw, hw + 1):
            c.p(cx + i, base - 16 - k, FIRE[1 if abs(i) < hw - 1 else 3])
    c.p(cx, base - 26, FIRE[0])


def chahar_taq(c, cx, base, w, h, r, kind, R=None, dome_r=None):
    """Four piers and four arches under a dome on squinches: the arch
    toward us opens on the fire."""
    D = round(w * 0.4)
    fy, ty = so.box(c, cx - w // 2, base, w, h, D, lambda c, x, y, ww, hh: face(c, x, y, ww, hh, kind, r),
                    lambda c, x, y, ww, hh: pebbles(c, x, y, ww, hh, r if kind != 'mud' else persia.TOP))
    aw = w - 22
    spring = fy + 8 + aw // 2
    for yy in range(fy + 8, base):
        for xx in range(cx - aw // 2, cx + aw // 2):
            if fp.rounded(xx, yy, cx - aw // 2, spring, aw):
                c.p(xx, yy, VOID if xx > cx - aw // 2 + 3 else mix(VOID, r[6], 0.5))
    for yy in range(fy + 5, base):
        for xx in range(cx - aw // 2 - 3, cx + aw // 2 + 3):
            if fp.rounded(xx, yy, cx - aw // 2 - 3, spring, aw + 6) and not fp.rounded(xx, yy, cx - aw // 2, spring, aw):
                c.p(xx, yy, r[1] if xx < cx else r[3])
    fire_altar(c, cx, base - 2, GYPSUM)
    R = R or w // 2 - 14
    so.lathe(c, cx, fy - 3, [(0, R + 3), (8, R + 2)], r, courses=4)
    so.dome(c, cx, fy - 11, R, dome_r or GYPSUM, kind='hemi', courses=5)
    return fy


def fire_temple(spec=None, info=None):
    s = {**dict(form='court', W=200, depth=150), **(spec or {})}
    W, D = s['W'], s['depth']
    form = s['form']
    if form == 'tower':
        return fire_tower(s, info)
    c = C(W + 40, 250 if W > 180 else 220)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    if form == 'court':
        r = RUBBLE
        tw = min(96, W - 60)
        wall_top = base - 30
        court_floor(c, x0 + 2, wall_top - 3, W - 4, 56, ramp(58, 0.04, lift=0.0))
        chahar_taq(c, cx, wall_top - 10, tw, 74, r, 'rubble')
        front_wall(c, x0, x0 + W, wall_top, base, 'rubble', r, GYPSUM)
        gw = 40
        so.box(c, cx - gw // 2, base, gw, 50, 20, lambda c, x, y, ww, hh: face(c, x, y, ww, hh, 'rubble', r), GYPSUM)
        arch_door(c, cx, base, 22, 40, GYPSUM, 'round', wood=persia.WOOD)
        door_h = 40
    else:
        # mud-brick ambulatory round the fire house, its door in the middle
        amb_h = 46
        fy, ty = so.box(c, x0, base, W, amb_h, D * 0.6, lambda c, x, y, ww, hh: persia.wall(c, x, y, ww, hh),
                        persia.TOP)
        for k in range(3):
            for xx in range(x0 + 2, x0 + W - 2):
                fp.shade(c, xx, fy - 1 - k, 0.18)
        for sx in (x0 + 26, x0 + W - 26):
            persia.dome(c, sx, fy - 12, 14)
        tw = min(84, W - 90)
        chahar_taq(c, cx, fy - 22, tw, 54, persia.WALL, 'mud', dome_r=persia.DOME)
        persia.brick(c, x0, base - 10, W, 10)
        c.rect(x0, base - 11, W, 1, persia.TOP[1])
        for k in range(3):
            wx = x0 + 18 + k * (W - 36) // 2
            if abs(wx - cx) > 30:
                persia.lattice_window(c, wx - 6, base - 34, 12, 10)
        arch_door(c, cx, base, 22, 40, persia.TOP, 'round', wood=persia.WOOD)
        door_h = 40
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, door_h, D, roof='dome')


def fire_tower(s, info):
    """A square stone tower on a stepped plinth, its walls set with blind
    windows of dark stone, a stair to the door halfway up."""
    tw = s.get('tower_w', 64)
    th = s.get('tower_h', 118)
    W = tw + 70
    c = C(W + 40, th + 70)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    for k in range(3):
        so.box(c, cx - tw // 2 - 14 + k * 5, base - k * 4, tw + 28 - k * 10, 4, 30, LIME)
    foot = base - 12
    fy, ty = so.box(c, cx - tw // 2, foot, tw, th, round(tw * 0.45), lambda c, x, y, ww, hh: fm.ashlar(c, x, y, ww, hh, LIME, 9, 16),
                    LIME)
    c.rect(cx - tw // 2 - 2, fy - 3, tw + 4, 3, LIME[0])
    fp.cast_down(c, cx - tw // 2, cx + tw // 2, fy, 3, 0.35)
    for row in range(3):
        for col in (-1, 1):
            wx = cx + col * (tw // 4) - 4
            wy = fy + 12 + row * 26
            c.rect(wx - 1, wy - 1, 10, 18, DARK_LIME[2])
            c.rect(wx, wy, 8, 16, DARK_LIME[4])
            c.rect(wx, wy, 8, 1, DARK_LIME[6])
    # the stair runs up the front to the door, which stands halfway up
    door_base = fy + th // 2 + 10
    so.box(c, cx - 14, door_base + 3, 28, 3, 10, LIME)
    for k in range((foot - door_base) // 4):
        y = foot - k * 4
        c.rect(cx - 12, y - 4, 24, 4, LIME[3]); c.rect(cx - 12, y - 4, 24, 1, LIME[1])
        c.rect(cx + 11, y - 4, 1, 4, LIME[5])
    arch_door(c, cx, door_base, 20, 38, DARK_LIME, 'square', leaf=False)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 38, max(96, tw + 40), roof='flat')


def fravahar(c, cx, cy, r):
    """The winged figure: a disc with a figure, wings of three feathered
    tiers spread either side, a forked tail below."""
    for side in (-1, 1):
        for k in range(3):
            ln = 16 - k * 4
            for j in range(ln):
                c.p(cx + side * (4 + j), cy - 1 + k * 2 - (j // 6), r[1 if k == 0 else 2])
                c.p(cx + side * (4 + j), cy + k * 2 - (j // 6), r[4])
    for k in range(5):
        c.p(cx - 2 - k // 2, cy + 6 + k, r[3]); c.p(cx + 2 + k // 2, cy + 6 + k, r[3])
    so.ellipse(c, cx + 0.5, cy + 1, 4, 3, r[2])
    c.rect(cx - 1, cy - 8, 3, 7, r[1]); c.rect(cx, cy - 10, 2, 2, r[1])


def guardian(c, x, base, r, flip=False):
    """A carved winged bull in relief on a panel, as on the Bombay agiaries."""
    w, h = 18, 28
    c.rect(x, base - h, w, h, r[3])
    c.rect(x, base - h, w, 1, r[1]); c.rect(x, base - h, 1, h, r[1])
    c.rect(x + w - 1, base - h, 1, h, r[5])
    body = [(3, 12, 12, 7), (12, 6, 4, 8), (4, 19, 2, 6), (11, 19, 2, 6)]
    for bx, by, bw, bh in body:
        for yy in range(by, by + bh):
            for xx in range(bx, bx + bw):
                xx2 = w - 1 - xx if flip else xx
                c.p(x + xx2, base - h + yy, r[2])
                if yy == by + bh - 1:
                    c.p(x + xx2, base - h + yy, r[5])
    for k in range(6):
        xx = 5 + k
        xx2 = w - 1 - xx if flip else xx
        c.p(x + xx2, base - h + 10 - k // 2, r[1]); c.p(x + xx2, base - h + 11 - k // 2, r[4])


def agiary(spec=None, info=None):
    s = {**dict(form='agiary', W=200, depth=140), **(spec or {})}
    W, D = s['W'], s['depth']
    c = C(W + 40, 210)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    if s['form'] == 'agiary':
        r = CREAM
        hw = W - 24
        hx = x0 + 12
        wall_top = base - 30
        top = wall_top - 6 - 86
        flat_roof(c, hx, top, hw, 60, r)
        face(c, hx, top, hw, wall_top - 6 - top, 'render', r)
        cornice(c, hx, top + 2, hw, r, dentils=True)
        pw = min(110, hw - 40)
        # the portico: four columns under an entablature carrying the emblem
        so.box(c, cx - pw // 2, top + 22, pw, 10, 16, r)
        fravahar(c, cx, top + 12, GOLD)
        for k in range(4):
            px = cx - pw // 2 + 8 + k * (pw - 16) // 3
            fp.column(c, px, top + 22, wall_top - 8, r, 8, 'ionic')
        guardian(c, cx - 33, wall_top - 10, r)
        guardian(c, cx + 15, wall_top - 10, r, flip=True)
        for wx in (hx + 16, hx + hw - 16):
            arch_window(c, wx, top + 26, 14, 30, r, 'shutter', ramp(150, 0.06, lift=-0.18))
        court_floor(c, x0 + 2, wall_top - 3, W - 4, 12, RAMPS['limestone'])
        front_wall(c, x0, cx - 18, wall_top, base, 'render', r)
        front_wall(c, cx + 18, x0 + W, wall_top, base, 'render', r)
        for gx in (cx - 22, cx + 16):
            fp.raised(c, gx, wall_top - 12, 6, base - wall_top + 12, r, 2)
            so.lathe(c, gx + 3, wall_top - 12, [(0, 3), (4, 3.5), (6, 1)], r)
        arch_door(c, cx, wall_top - 2, 22, 42, r, 'square', wood=ramp(40, 0.06, lift=-0.16))
        steps(c, cx, base, 34, 3, RAMPS['limestone'], rise=3)
        door_h = 42
    else:
        r = WHITE
        top = base - 76
        fp.roof_band(c, x0 - 6, x0 + W + 6, top + 2, 40, 'plain', MANGALORE, hip=0.6)
        face(c, x0, top + 6, W, base - top - 6, 'render', r)
        # a deep verandah on posts across the front
        vy = base - 50
        fp.roof_band(c, x0 + 6, x0 + W - 6, vy, 10, 'plain', MANGALORE)
        for k in range(6):
            px = x0 + 12 + k * (W - 28) // 5
            fp.raised(c, px, vy + 8, 4, base - vy - 12, WHITE, 1)
        for k in range(2):
            wx = x0 + W // 4 + k * W // 2
            arch_window(c, wx, top + 14, 12, 18, r, 'shutter', ramp(150, 0.06, lift=-0.18))
        c.rect(x0, base - 6, W, 6, RAMPS['sandstone'][3]); c.rect(x0, base - 6, W, 1, RAMPS['sandstone'][1])
        arch_door(c, cx, base - 6, 22, 38, WHITE, 'square', wood=ramp(40, 0.06, lift=-0.16))
        fravahar(c, cx, vy + 18, GOLD)
        door_h = 38
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, door_h, D, roof='flat' if s['form'] == 'agiary' else 'gable')


# ------------------------------------------------------------------ Polynesia

def lava_platform(c, x, base, w, h, D, r=LAVA, top=None):
    """Dry-laid stones: the face rubble, the top paved with smaller stones."""
    return so.box(c, x, base, w, h, D, lambda c, xx, yy, ww, hh: fm.rubble(c, xx, yy, ww, hh, r, r),
                  top or (lambda c, xx, yy, ww, hh: pebbles(c, xx, yy, ww, hh, r)))


def pebbles(c, x, y, w, h, r):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            k = h2(xx // 3, yy // 2, 7)
            c.p(xx, yy, r[1] if k < 0.2 else r[2] if k < 0.75 else r[3])
    c.rect(x, y, w, 1, r[1])


def hale(c, cx, base, w, h, tone=THATCH):
    """A small thatched house on the platform: a steep hipped roof that is
    nearly all of it, the low wall of lashed poles under it."""
    so.box(c, cx - w // 2, base, w, h // 3, 10, TOTARA)
    for xx in range(cx - w // 2, cx + w // 2, 3):
        c.rect(xx, base - h // 3, 1, h // 3, TOTARA[5])
    fp.roof_band(c, cx - w // 2 - 4, cx + w // 2 + 4, base - h // 3 + 2, h - h // 3, 'thatch', tone, hip=0.55)


def kii(c, x, base, h, r=TOTARA):
    """A carved image on its post: the crested head, the gaping mouth, arms
    on the belly, the legs bent."""
    c.rect(x, base - h, 6, h, r[3])
    c.rect(x, base - h, 2, h, r[2]); c.rect(x + 5, base - h, 1, h, r[5])
    ht = base - h
    for k in range(4):
        c.rect(x - 1 + k // 2, ht - 3 - k * 2, 8 - k, 2, r[2 if k % 2 else 3])
    c.rect(x + 1, ht + 4, 4, 2, VOID)
    c.p(x + 1, ht + 1, r[6]); c.p(x + 4, ht + 1, r[6])
    c.rect(x - 1, ht + 9, 8, 2, r[2]); c.rect(x, ht + 14, 6, 1, r[5])


def anuu(c, cx, base, h, w=18):
    """The oracle tower: a tapering frame of poles sheathed in white kapa,
    three floors, open at the very top."""
    for yy in range(base - h, base):
        t = (base - yy) / h
        hw = w / 2 * (1 - 0.45 * t)
        for xx in range(round(cx - hw), round(cx + hw) + 1):
            u = (xx - cx) / max(hw, 1)
            q = 1 if u < -0.4 else 2 if u < 0.3 else 3
            if (base - yy) % (h // 3) in (0, 1):
                q = 5
            c.p(xx, yy, KAPA[q])
        c.p(round(cx - hw) - 1, yy, TOTARA[3]); c.p(round(cx + hw) + 1, yy, TOTARA[5])
    for k in range(6):
        c.p(cx - 5 + k * 2, base - h - 2 - (k % 2), TOTARA[2])
    c.rect(cx - 6, base - h - 1, 13, 1, TOTARA[4])


def heiau(spec=None, info=None):
    s = {**dict(form='luakini', W=220, depth=150), **(spec or {})}
    W, D = s['W'], s['depth']
    luakini = s['form'] == 'luakini'
    c = C(W + 40, 240 if luakini else 170)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    if luakini:
        fy, ty = lava_platform(c, x0, base, W, 26, 96)
        mid = (fy + ty) // 2
        if s.get('tower', True):
            anuu(c, x0 + W - 50, mid + 4, 112, 22)
        hale(c, x0 + 66, ty + 18, 92, 66)
        for xx in range(x0 + 8, x0 + W - 8, 6):
            c.rect(xx, fy - 16, 2, 18, TOTARA[3]); c.p(xx, fy - 17, TOTARA[1])
        c.rect(x0 + 6, fy - 12, W - 12, 2, TOTARA[2])
        for k in range(5):
            kii(c, x0 + 16 + k * (W - 38) // 4, fy + 2, 40 - (k % 2) * 6)
    else:
        fy, ty = lava_platform(c, x0, base, W, 16, 80)
        fy2, ty2 = lava_platform(c, x0 + 24, fy - 6, W - 48, 16, 50)
        hale(c, cx - 14, ty2 + 14, 74, 54)
        for k in range(2):
            kii(c, x0 + 12 + k * (W - 30), fy + 2, 34)
        so.box(c, cx + 40, ty2 + 20, 10, 6, 8, CORAL)
    # the stone ramp up the front
    for k in range(4):
        c.rect(cx - 14 + k, base - 4 - k * 4 - 4, 28 - 2 * k, 4, LAVA[2 + k % 2])
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 40, D, doorless=True, roof='flat')


def unu(c, x, base, h, r=TOTARA):
    """A carved board: a plank with notched sides and a bird on its top."""
    c.rect(x, base - h, 5, h, r[3])
    c.rect(x, base - h, 1, h, r[1])
    for k in range(base - h + 4, base - 4, 6):
        c.p(x + 4, k, r[6]); c.p(x, k + 3, r[5])
    c.rect(x - 2, base - h - 3, 9, 3, r[2]); c.p(x + 6, base - h - 4, r[1]); c.p(x - 2, base - h - 4, r[4])


def marae(spec=None, info=None):
    s = {**dict(W=220, depth=170, tiers=5), **(spec or {})}
    W, D = s['W'], s['depth']
    c = C(W + 40, 140 + s['tiers'] * 11)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    # the court: a low enclosing wall, the paving seen from above
    fy, ty = so.box(c, x0, base, W, 8, min(D, 130), lambda c, x, y, ww, hh: fm.rubble(c, x, y, ww, hh, LAVA, LAVA),
                    lambda c, x, y, ww, hh: pebbles(c, x, y, ww, hh, LAVA))
    # the ahu at the back, stepped, dressed coral facing
    aw, tiers = W - 40, s['tiers']
    by = ty + 24
    for k in range(tiers):
        tw = aw - k * (aw // (tiers + 2))
        so.box(c, cx - tw // 2, by - k * 11, tw, 11, 14, lambda c, x, y, ww, hh: fm.ashlar(c, x, y, ww, hh, CORAL, 11, 16),
               CORAL)
    for k in range(4):
        unu(c, cx - aw // 2 + 14 + k * (aw - 28) // 3, by + 16, 34 + (k % 2) * 6)
    # upright backrests of the chiefs and priests in the court
    for k, (dx, dy) in enumerate(((-60, 30), (-24, 38), (30, 34), (66, 28))):
        if abs(dx) < W // 2 - 10:
            so.box(c, cx + dx, ty + dy + 10, 5, 12 + (k % 2) * 4, 3, LAVA)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 40, D, doorless=True, roof='flat')


def wharenui(spec=None, info=None):
    """The meeting house gable-on: the carved bargeboards meeting under the
    tekoteko, the porch deep under the roof, poupou panels down its sides,
    the door and window in the shaded front wall."""
    s = {**dict(W=150, depth=170, carved=True), **(spec or {})}
    W, D = s['W'], s['depth']
    carved = s['carved']
    wood = KOKOWAI if carved else TOTARA
    rise = round(W * 0.42)
    wall_h = 54
    roof_d = min(28, round(D * so.K * 0.35))
    c = C(W + 40, wall_h + rise + roof_d + 40)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    eave = base - wall_h
    top = eave - rise
    gable_roof(c, cx, top, W, rise, roof_d, fp.tone_for('thatch', 'reed') if carved else THATCH)
    # the porch: its back wall in shade under the roof
    pw = W - 18
    face(c, cx - pw // 2, top + 6, pw, base - top - 6, 'boards', RAUPO)
    for yy in range(top + 6, base):
        half = min(pw / 2, (yy - top - 6) * (W / 2) / rise)
        for xx in range(cx - pw // 2, cx + pw // 2):
            if abs(xx - cx) <= half:
                fp.shade(c, xx, yy, 0.38 if yy < eave + 10 else 0.25)
    if carved:
        # painted rafters (heke) in the porch ceiling, kowhaiwhai scrolls
        for i in range(-pw // 2 + 4, pw // 2 - 4, 6):
            yy0 = top + 8 + round(abs(i) * rise / (W / 2))
            for k in range(3):
                c.p(cx + i, yy0 + k, KAPA[2] if k == 1 else KOKOWAI[3])
    # door (left) and window (right) in the porch wall
    dx = cx - pw // 4
    arch_door(c, dx, base - 2, 18, 38, wood, 'square', wood=TOTARA, band=3)
    op.raised(c, cx + pw // 4 - 10, base - 40, 20, 14, wood, 2)
    c.rect(cx + pw // 4 - 7, base - 37, 14, 8, VOID)
    # poupou: the carved side panels of the porch (amo at the front)
    for side in (-1, 1):
        px = cx + side * (W // 2 - 6) - 4
        c.rect(px, eave - 6, 9, base - eave + 6, wood[3])
        c.rect(px, eave - 6, 2, base - eave + 6, wood[1])
        c.rect(px + 8, eave - 6, 1, base - eave + 6, wood[5])
        if carved:
            for k in range(3):
                fy0 = eave + 2 + k * 18
                c.rect(px + 2, fy0, 5, 3, wood[1])
                c.p(px + 3, fy0 + 1, KAPA[1]); c.p(px + 5, fy0 + 1, KAPA[1])
                c.rect(px + 3, fy0 + 5, 3, 2, VOID)
                for j in range(8):
                    c.p(px + 2 + j % 5, fy0 + 8 + j // 2, wood[4 if j % 2 else 2])
    # maihi: the bargeboards, thick and painted, meeting at the apex
    for i in range(-W // 2 - 4, W // 2 + 5):
        yy = top + round(abs(i) * rise / (W / 2)) - 3
        for k in range(6):
            q = (1, 2, 2, 3, 4, 5)[k] if i < 0 else (2, 3, 3, 4, 5, 6)[k]
            col = wood[q]
            if carved and k in (2, 3) and (i // 3) % 3 == 0:
                col = KAPA[1 if i < 0 else 2]
            c.p(cx + i, yy + k, col)
        fp.shade(c, cx + i, yy + 6, 0.3)
    # raparapa: the fingers at the bargeboards' feet
    for side in (-1, 1):
        for j in range(3):
            c.rect(cx + side * (W // 2 + 2 + j * 3) - (2 if side < 0 else 0), eave - 4 + j, 2, 5, wood[2])
    # tekoteko: the ancestor at the apex
    c.rect(cx - 4, top - 18, 9, 16, wood[2])
    c.rect(cx - 3, top - 24, 7, 6, wood[2])
    c.p(cx - 2, top - 22, KAPA[1]); c.p(cx + 2, top - 22, KAPA[1])
    c.rect(cx - 1, top - 19, 3, 1, VOID)
    c.rect(cx + 4, top - 18, 1, 16, wood[5])
    c.rect(cx - 4, top - 10, 9, 1, wood[4])
    so.box(c, x0 + 4, base, W - 8, 3, 8, RAMPS['sandstone'])
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0 - 4, W + 8, base, dx, 38, D)


# ------------------------------------------------------------------ catalogue

BUILDERS = {'synagogue': synagogue, 'fire-temple': fire_temple, 'agiary': agiary,
            'heiau': heiau, 'marae': marae, 'wharenui': wharenui}

S, M, L = 'small', 'medium', 'large'


def looks(kind, labels, desc, per_scale, **common):
    out = {}
    for scale, specs in per_scale.items():
        out[scale] = [(kind, {**common, **sp, 'label': labels[scale], 'description': desc}) for sp in specs]
    return out


SYN = {S: 'Synagogue', M: 'Synagogue', L: 'Great synagogue'}
FIRE_LABELS = {S: 'Fire shrine', M: 'Fire temple', L: 'Great fire temple'}
HOUSE = {S: 'Meeting house', M: 'Meeting house', L: 'Meeting house'}

SPECS = {
    'galilean-synagogue': looks('synagogue', SYN,
        'The synagogue, where the town reads the Law on the Sabbath and gathers to pray and hear it taught.', {
            S: [dict(style='galilean', W=140, look=0, doors=1, wall_h=66, depth=120),
                dict(style='galilean', W=140, look=1, doors=1, wall_h=66, depth=120)],
            M: [dict(style='galilean', W=180, look=0), dict(style='galilean', W=180, look=1)],
            L: [dict(style='galilean', W=232, look=0, wall_h=92, depth=190),
                dict(style='galilean', W=232, look=1, wall_h=92, depth=190)]}),
    'sephardi-synagogue': looks('synagogue', SYN,
        'The synagogue behind its court wall, where the community prays, reads the Law and keeps its school.', {
            S: [dict(style='sephardi', W=150, hall_h=54, depth=110), dict(style='stone', W=150, hall_h=54, depth=110)],
            M: [dict(style='sephardi', W=196), dict(style='stone', W=196)],
            L: [dict(style='sephardi', W=244, domes=3, hall_h=70, depth=170, lead=True),
                dict(style='stone', W=244, hall_h=70, depth=170)]}),
    'ashkenazi-synagogue': looks('synagogue', SYN,
        'The synagogue, the house of prayer and study at the heart of the Jewish town.', {
            S: [dict(style='wooden', W=150, tiers=1, wall_h=56, depth=120), dict(style='brody', W=140, wall_h=96, depth=130)],
            M: [dict(style='brody', W=180), dict(style='wooden', W=190, tiers=2)],
            L: [dict(style='brody', W=224, wall_h=124, depth=200), dict(style='wooden', W=236, tiers=2, wall_h=70, depth=190)]}),
    'fire-temple': looks("fire-temple", FIRE_LABELS,
        'The house of the sacred fire, which the priests keep burning day and night; the faithful pray before it.', {
            S: [dict(form='court', W=150, depth=120), dict(form='ambulatory', W=170, depth=120),
                dict(form='tower', tower_w=52, tower_h=100)],
            M: [dict(form='court', W=196), dict(form='ambulatory', W=210), dict(form='tower')],
            L: [dict(form='court', W=244, depth=190), dict(form='ambulatory', W=260, depth=190),
                dict(form='tower', tower_w=76, tower_h=136)]}),
    'parsi-fire-temple': looks('agiary', {S: 'Agiary', M: 'Agiary', L: 'Atash behram'},
        'The fire temple of the Parsi community, where the priests tend the fire and only Parsis may enter.', {
            S: [dict(form='agiary', W=170, depth=120), dict(form='plain', W=150, depth=110)],
            M: [dict(form='agiary', W=210), dict(form='plain', W=190)],
            L: [dict(form='agiary', W=250, depth=170), dict(form='plain', W=230, depth=170)]}),
    'heiau': looks('heiau', {S: 'Heiau', M: 'Heiau', L: 'Luakini heiau'},
        'The temple platform, where the priests make offerings and the chief consults the gods; it is kapu to commoners.', {
            S: [dict(form='terraced', W=170, depth=120)],
            M: [dict(form='luakini', W=210, tower=True), dict(form='terraced', W=210)],
            L: [dict(form='luakini', W=260, depth=190)]}),
    'marae': looks('marae', {S: 'Marae', M: 'Marae', L: 'Great marae'},
        'The sacred court of the lineage, where offerings are made before the stone platform of the gods and ancestors.', {
            S: [dict(W=170, depth=130, tiers=2)],
            M: [dict(W=214, tiers=3)],
            L: [dict(W=270, depth=200, tiers=6)]}),
    'wharenui': looks('wharenui', HOUSE,
        'The meeting house of the marae, carved as the body of an ancestor, where guests are welcomed and the tribe meets.', {
            S: [dict(W=124, depth=140, carved=False), dict(W=124, depth=140, carved=True)],
            M: [dict(W=150, carved=True), dict(W=150, carved=False)],
            L: [dict(W=184, depth=210, carved=True), dict(W=184, depth=210, carved=False)]}),
}
