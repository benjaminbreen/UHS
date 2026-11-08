"""Synagogues, Zoroastrian fire temples and the Polynesian sanctuaries.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-world.png world

Galilean basilica synagogues of the third to sixth centuries (Capernaum in
white limestone, Chorazin in basalt); the whitewashed court synagogues of
Ottoman Safed and Djerba and the stone ones of Salonica; the fortress
synagogue of Brody and the tiered wooden synagogues of Poland-Lithuania.
The stone tower of Naqsh-e Rostam (drawn for front_sacred_ancient's fire
temples); the Parsi agiary and atash behram.
The Hawaiian heiau, the Tahitian marae and the Maori meeting house.
Monks Mound at Cahokia.
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
from art import front_stepped as st  # noqa: E402
from art import front_persian as persia  # noqa: E402
from art import front_persian as pz  # noqa: E402
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
GYPSUM = ramp(85, 0.022, lift=0.04)
DARK_LIME = ramp(250, 0.015, lift=-0.2)
CREAM = ramp(78, 0.06, lift=0.03)
MANGALORE = ramp(36, 0.13, lift=-0.04)
CORAL = ramp(82, 0.03, lift=0.02)
KAPA = ramp(88, 0.02, lift=0.06)
KOKOWAI = ramp(26, 0.14, lift=-0.1)
TOTARA = ramp(42, 0.07, lift=-0.12)
THATCH = RAMPS['thatch']
RAUPO = ramp(72, 0.07, lift=-0.04)
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
    """The Sephardi court synagogue, on the courtyard form of the houses
    round it: a street wall with the door under a tiled hood and a carved
    plaque over it; the court with its laver for washing the hands; across
    it the prayer hall's face, the women's gallery behind lattice above.
    Whitewash, blue shutters and a low lime dome (Safed, Djerba), or Ottoman
    stone under a hipped tile roof (Salonica)."""
    from art import front_props as pr
    W = s['W']
    stone = s['style'] == 'stone'
    r = RAMPS['sandstone'] if stone else WHITE
    top = RAMPS['limestone'] if stone else ramp(92, 0.01, lift=0.1)
    hall_h = s.get('hall_h', 62)
    D = s.get('depth', 130)
    big = W > 200
    sp = dict(W=W, wing=max(26, W // 7), street=60, front=14, court=max(54, D // 2), far=22 if stone else 24,
              face=hall_h - 4, portal=0.5)
    wall = (lambda c, x, y, w, h: fm.ashlar(c, x, y, w, h, r, 8, 20)) if stone else \
        (lambda c, x, y, w, h: fm.render(c, x, y, w, h, r))
    shutter = BLUE if not stone else RAMPS['oak']

    def hall_face(c, L, R, ftop, h):
        wall(c, L, ftop, R - L, h)
        cx = (L + R) // 2
        n = max(2, (R - L) // 30)
        span = (R - L) / n
        for k in range(n):
            wx = round(L + (k + 0.5) * span)
            # the women's gallery, behind lattice under a little hood
            op.raised(c, wx - 8, ftop + 5, 16, 14, r, 1)
            op.lattice(c, wx - 6, ftop + 7, 12, 10)
            c.rect(wx - 9, ftop + 3, 18, 2, top[0])
            fp.cast_down(c, wx - 8, wx + 8, ftop + 5, 2, 0.4)
            if abs(wx - cx) > 14:
                arch_window(c, wx, ftop + h - 30, 10, 22, r, 'shutter' if not stone else 'grille', shutter)
        dw = 18
        arch_door(c, cx, ftop + h, dw, 26, top, 'round', wood=shutter, band=2)
        c.rect(L, ftop, R - L, 1, top[0])
        so.box(c, L, ftop + h + 4, R - L, 3, 8, top)

    def court(c, L, R, ctop, face_h, front, face=None, trees=True):
        floor = ctop + face_h + 4
        for yy in range(floor, front):
            for xx in range(L, R):
                i, j = (xx - L) // 14, (yy - floor) // 7
                q = 1 if (i + j) % 2 else 2
                c.p(xx, yy, top[q + 1] if (yy - floor) % 7 == 6 else top[q])
        hall_face(c, L, R, ctop, face_h)
        cy = (floor + front) // 2 + 6
        # the laver: a stone basin and its spout, for washing the hands before prayer
        so.box(c, L + 10, cy + 6, 22, 9, 8, RAMPS['marble'])
        c.rect(L + 14, cy - 1, 14, 2, pr.WATER[2])
        c.rect(L + 20, cy - 8, 2, 5, RAMPS['marble'][2])
        pr.tree(c, R - 18, front - 4, 'cypress' if stone else 'lemon', 0.8 if not stone else 0.7)
        pz.court_shade(c, L, R, ctop, floor, front)

    def roof(c, g):
        cx = (g['L'] + g['R']) // 2
        if stone:
            fp.roof_band(c, g['CL'] - 8, g['CR'] + 8, g['court_top'] + 1, g['court_top'] - g['B'] + 8, 'plain',
                         TILE, hip=0.7)
            return
        R0 = min(22, (g['CR'] - g['CL']) // 5)
        pz.dome(c, cx, g['B'] + 12, R0)
        if s.get('domes', 1) > 1:
            for sx in (g['L'] + g['wing'] // 2, g['R'] - g['wing'] // 2):
                pz.dome(c, sx, g['court_front'] - 14, 9)

    def door(c, pcx, base, g):
        dw, dh = 22, 40
        arch_door(c, pcx, base, dw, dh, RAMPS['sandstone'] if not stone else RAMPS['limestone'], 'round',
                  wood=shutter, band=3)
        hood(c, pcx, base - dh - 10, dw + 18, RAMPS["sandstone"], TILE)
        # a carved plaque by the door, its lines of Hebrew too small to read
        px, py = pcx + dw // 2 + 10, base - dh + 2
        op.raised(c, px, py, 24, 12, RAMPS['marble'], 1)
        for k in range(3):
            for xx in range(px + 3, px + 21):
                if (xx * 7 + k * 3) % 5:
                    c.p(xx, py + 3 + k * 3, RAMPS['marble'][4])

    def windows(c, g):
        for wx in (g['L'] + 18, g['R'] - 30):
            if abs(wx + 6 - g['pcx']) > 34:
                op.raised(c, wx - 2, g['E'] + 10, 16, 14, r, 1)
                op.grille(c, wx, g['E'] + 12, 12, 10)

    ramps = dict(WALL=r, TOP=top, PAVE=top, WALL_FN=wall, BRICK=RAMPS['sandstone'],
                 DOME=LEAD if s.get('lead') else top)
    with pz.materials(**ramps):
        im = pz.compound(sp, info, None, roof, door, head=40 if not stone else 36, windows=windows, court_fn=court)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] and max(px[x, y][:3]) < 16:
                px[x, y] = (34, 46, 36, 255)
    if info is not None:
        info.update(door_h=40, depth=D)
    return im


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

def pebbles(c, x, y, w, h, r):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            k = h2(xx // 3, yy // 2, 7)
            c.p(xx, yy, r[1] if k < 0.2 else r[2] if k < 0.75 else r[3])
    c.rect(x, y, w, 1, r[1])


# Hawaiian basalt and ʻōhiʻa wood, Tahitian coral limestone.
LAVA = ramp(40, 0.024, lift=-0.09)
OHIA = ramp(38, 0.08, lift=-0.1)
PILI = [THATCH[7], THATCH[6], THATCH[5], THATCH[3], THATCH[2], THATCH[1]]
BANANA = ramp(95, 0.13, lift=0.04)
LEAF = ramp(140, 0.1, lift=-0.06)
PIG = ramp(30, 0.05, lift=-0.08)


def basalt_face(c, x, y, w, h, q=3, seed=0):
    st.coursed(c, x, y, w, h, LAVA, q=q, course=6, block=13, seed=seed, fitted=True)
    st.ends(c, x, y, w, h, LAVA)


def platform(c, cx, base, plan, top, seed=0):
    """Dry-laid basalt in battered courses: each course a fitted face, the
    ledge above it lit; the last tier's top painted by top(c, x, y, w, h)."""
    def face_k(c, x, y, w, h, k):
        basalt_face(c, x, y, w, h, q=3 if k else 4, seed=seed + k)

    def top_k(c, x, y, w, h, k):
        if k == len(plan) - 1 or h > 6:
            top(c, x, y, w, h)
        else:
            c.rect(x, y, w, h, LAVA[1])
            c.rect(x, y + h - 1, w, 1, LAVA[0])
    return st.tiers(c, cx, base, plan, face_k, top_k, shadow=LAVA)


def iliili(c, x, y, w, h):
    st.gravel(c, x, y, w, h, LAVA, q=1, quiet=True)
    c.rect(x, y + h - 1, w, 1, LAVA[0])


def stone_stair(c, cx, foot, head, w, r=LAVA):
    st.stair(c, cx, foot, head, w, r, q=2, rise=4)
    for yy in range(head, foot):
        c.p(cx - w // 2 - 1, yy, r[5]); c.p(cx + w // 2, yy, r[6])


def hale(c, cx, base, w, seed=0):
    """A thatched house: walls of lashed pili grass, a steep hipped roof
    that is most of it, the door a low dark opening."""
    from art.front_meso import thatch
    wh = 13
    x0 = cx - w // 2
    for yy in range(base - wh, base):
        for xx in range(x0 + 2, x0 + w - 2):
            k = 3 if (xx - x0) % 3 else 4
            if xx > x0 + w - 8:
                k += 1
            if (base - yy) in (4, 9):
                k = 2
            c.p(xx, yy, THATCH[k])
    dx = cx - 4
    c.rect(dx, base - 11, 9, 11, VOID)
    c.rect(dx - 1, base - 12, 11, 1, OHIA[2])
    thatch(c, x0, x0 + w, base - wh, round(w * 0.5), round(w * 0.22), PILI, seed)
    fp.cast_down(c, x0 + 2, x0 + w - 2, base - wh + 3, 2, 0.3)


KII = ('...ab....',
       '..aabc...',
       '.aabbbc..',
       '.abbbbcc.',
       'aabbbbbcc',
       '.abbbbbc.',
       '..abbbc..',
       '.aabbbcc.',
       'abdbbbdbc',
       'abbbbbbbc',
       'abddddddc',
       'abdbbbbdc',
       'abddddddc',
       '.abbbbbc.',
       '..abbbc..',
       '.aabbbcc.',
       'aab.b.bcc',
       'ab.abc.cc',
       'ab.abc.cc',
       '.a.abc.c.',
       '...abc...',
       '..aabcc..',
       '.ab...bc.',
       'ab.....bc',
       'aab...bcc')


def kii(c, x, base, h, r=OHIA, flip=False):
    """A carved image (kiʻi akua) on its post: the tall crest, the gaping
    figure-eight mouth, arms bent, knees bent."""
    post = max(0, h - len(KII))
    c.rect(x + 1, base, 8, 1, LAVA[5])
    st.glyph(c, x, base - h, KII, {'a': r[1], 'b': r[3], 'c': r[5], 'd': VOID}, flip)
    c.rect(x + 3, base - post, 3, post, r[3])
    c.rect(x + 3, base - post, 1, post, r[2]); c.rect(x + 5, base - post, 1, post, r[5])


def lele(c, x, base, w=16, h=24):
    """The offering stand: a platform of poles on four posts, a pig, a
    bunch of bananas and a coconut laid on it."""
    for px in (x, x + w - 2):
        c.rect(px + 3, base - h - 4, 2, h, OHIA[4])
    for px in (x, x + w - 2):
        c.rect(px, base - h, 2, h, OHIA[2]); c.p(px + 1, base - 1, OHIA[4])
    c.rect(x - 1, base - h - 2, w + 6, 3, OHIA[3]); c.rect(x - 1, base - h - 2, w + 6, 1, OHIA[1])
    st.glyph(c, x + 1, base - h - 7, ('..aabb...e', '.abbbbbc.f', 'abbbbbbbcf', '.cc..cc...'),
             {'a': PIG[3], 'b': PIG[5], 'c': PIG[6], 'e': LEAF[2], 'f': LEAF[4]})
    st.glyph(c, x + w - 3, base - h - 7, ('ab.', 'aab', 'abb', 'bbc'), {'a': BANANA[1], 'b': BANANA[3], 'c': BANANA[5]})


def anuu(c, cx, base, h, w=22):
    """The oracle tower: a tapering frame of poles sheathed in white kapa,
    three floors, the frame open at the very top."""
    open_h = h // 6
    body = h - open_h
    for yy in range(base - body, base):
        t = (base - yy) / h
        hw = round(w / 2 * (1 - 0.4 * t))
        L, R = cx - hw, cx + hw
        floor = (base - yy) % (body // 3)
        for xx in range(L, R + 1):
            u = (xx - L) / max(1, R - L)
            q = 0 if u < 0.3 else 1 if u < 0.68 else 3
            if floor == 0:
                q = 5
            elif floor == 1:
                q = max(0, q - 1)
            c.p(xx, yy, KAPA[q])
        c.p(L - 1, yy, OHIA[2]); c.p(R + 1, yy, OHIA[4])
    top = base - h
    hw = round(w / 2 * 0.6)
    for xx in (cx - hw - 1, cx - 1, cx + hw):
        c.rect(xx, top, 2, open_h, OHIA[2] if xx < cx else OHIA[4])
    for yy in (top, top + open_h // 2):
        c.rect(cx - hw - 2, yy, 2 * hw + 4, 1, OHIA[3])
    for k in range(3):
        c.p(cx - hw - 1 + k * hw, top - 2, OHIA[1]); c.p(cx - hw - 1 + k * hw, top - 1, OHIA[2])


def fence(c, x0, x1, y, h=20, gap=4):
    """A fence of ʻōhiʻa poles, a lashed rail across them near the top."""
    for x in range(x0, x1, gap):
        c.rect(x, y - h, 2, h, OHIA[3]); c.p(x, y - h, OHIA[1]); c.p(x + 1, y - h, OHIA[2])
        c.rect(x, y - h + 1, 1, h - 1, OHIA[2])
    c.rect(x0 - 1, y - h + 4, x1 - x0 + 1, 2, OHIA[4]); c.rect(x0 - 1, y - h + 4, x1 - x0 + 1, 1, OHIA[2])


def heiau(spec=None, info=None):
    """The heiau as Webber and the early missionaries drew it: a platform
    of fitted basalt, its top paved with water-worn stones, a pole fence
    round the court, the thatched house of the priests, and on the luakini
    the white oracle tower with the carved images before it."""
    s = {**dict(form='luakini', W=220, depth=150), **(spec or {})}
    W, D = s['W'], s['depth']
    luakini = s['form'] == 'luakini'
    c = C(W + 40, 236 if luakini else 170)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    if luakini:
        out = platform(c, cx, base, [(W, 14, 3), (W - 6, 12, 3), (W - 12, 11, 56)], iliili, seed=3)
    else:
        out = platform(c, cx, base, [(W, 13, 3), (W - 6, 11, 30), (W - 70, 12, 3), (W - 76, 10, 36)],
                       iliili, seed=5)
    tx, fy, tw, th, tt = out[-1]
    if luakini:
        fence(c, tx + 4, tx + tw - 4, tt + 10, 22)
        hale(c, tx + 50, tt + 34, 74, seed=2)
        ax = tx + tw - 46
        if s.get('tower', True):
            anuu(c, ax, tt + 30, 104 + (W - 210) // 4, 24)
        lele(c, ax - 44, tt + 38)
        for k, (dx, hh) in enumerate(((-30, 30), (-14, 34), (14, 34), (30, 30))):
            kii(c, ax + dx - 4, fy - 2, hh, flip=dx > 0)
    else:
        lx, lfy, lw, lh, lt = out[1]
        fence(c, tx + 4, tx + tw - 4, tt + 8, 18)
        hale(c, cx - 6, tt + 30, 64, seed=4)
        lele(c, x0 + 22, lfy - 4, 14, 20)
        for xx, fl in ((x0 + 8, False), (x0 + W - 18, True)):
            kii(c, xx, lfy - 2, 34, flip=fl)
    stone_stair(c, cx, base, out[-1][1] if not luakini else fy, 22)
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 40, D, doorless=True, roof='flat')


def unu(c, x, base, h, r=TOTARA):
    """A carved board (unu) on the ahu: a broad plank cut through in
    notches and lozenges, a bird standing on its top."""
    w = 7
    c.rect(x, base - h, w, h, r[3])
    c.rect(x, base - h, 1, h, r[1]); c.rect(x + w - 1, base - h, 1, h, r[5])
    for k in range(base - h + 4, base - 6, 6):
        st.glyph(c, x, k, ('a.....c', 'ab.d.cc', 'a.....c'), {'a': r[2], 'b': r[1], 'c': r[5], 'd': VOID})
    st.glyph(c, x - 2, base - h - 6, ('....ab...', '..aabbc..', '.abbbbbcc', 'ab.bbc...', '...c.c...', '..rrrrr..'),
             {'a': r[1], 'b': r[3], 'c': r[5], 'r': r[4]})


def coral_face(c, x, y, w, h, q=2, seed=0):
    st.coursed(c, x, y, w, h, CORAL, q=q, course=5, block=15, seed=seed, foot=0)
    st.ends(c, x, y, w, h, CORAL)


def backrest(c, x, base, h, r=LAVA):
    """An upright stone in the court where a chief or priest sat: a slab
    lit on its face and top, its shadow on the paving to the right."""
    st.glyph(c, x, base - h, ('.aab.', 'abbbc') + ('abbbc',) * (h - 3) + ('bbbcc',),
             {'a': r[0], 'b': r[2], 'c': r[4]})
    c.rect(x + 5, base - 3, 3, 3, r[3]); c.rect(x + 1, base, 6, 1, r[4])


def court(c, x, y, w, h):
    """The court seen from above: big basalt flags, a kerb of the low wall
    round its sides and back."""
    st.paving(c, x, y, w, h, LAVA, q=3, slab=19, row=5, seed=4, lip=False)
    for xx, ww in ((x, 4), (x + w - 4, 4)):
        c.rect(xx, y, ww, h, LAVA[2]); c.rect(xx, y, 1, h, LAVA[0] if xx == x else LAVA[1])
    c.rect(x, y, w, 3, LAVA[2]); c.rect(x, y, w, 1, LAVA[0])
    c.rect(x, y + h - 2, w, 2, LAVA[1]); c.rect(x, y + h - 1, w, 1, LAVA[0])


def marae(spec=None, info=None):
    """The Society Islands marae: a paved court inside a low stone wall,
    the ahu across its back stepped up in squared coral blocks on a basalt
    footing, carved unu boards along its top, upright stones in the court
    where chiefs and priests sat, and the offering stand."""
    s = {**dict(W=220, depth=170, tiers=5), **(spec or {})}
    W, D = s['W'], s['depth']
    n = s['tiers']
    c = C(W + 40, 112 + n * 13)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    deep = min(D, 140) // 3
    st.tiers(c, cx, base, [(W, 8, deep)],
             lambda c, x, y, w, h, k: basalt_face(c, x, y, w, h, q=3, seed=1),
             lambda c, x, y, w, h, k: court(c, x, y, w, h))
    ty = base - 8 - deep
    aw = W - 44
    plan = [(aw, 6, 2)] + [(aw - 8 - k * (aw // (n + 3)), 9, 3 if k < n - 1 else 7) for k in range(n)]

    def face(c, x, y, w, h, k):
        if k == 0:
            basalt_face(c, x, y, w, h, q=4, seed=9)
        else:
            coral_face(c, x, y, w, h, q=3, seed=k)

    def top(c, x, y, w, h, k):
        r = CORAL if k else LAVA
        c.rect(x, y, w, h, r[1])
        c.rect(x, y + h - 1, w, 1, r[0])
    ahu = st.tiers(c, cx, ty + 12, plan, face, top, shadow=CORAL)
    tx, fy, tw, th, tt = ahu[-1]
    for k in range(4):
        unu(c, tx + 6 + k * (tw - 19) // 3, tt + 5, 26 + (k % 2) * 6)
    for fx, dy, hh in ((0.12, 22, 13), (0.26, 30, 11), (0.74, 30, 12), (0.88, 22, 11)):
        backrest(c, x0 + round(W * fx), ty + dy, hh)
    lele(c, x0 + W - 34, ty + deep - 4, 14, 20)
    stone_stair(c, cx, base, base - 8, 20)
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


SWARD = ramp(128, 0.085, lift=-0.07)
CLAY = ramp(52, 0.075, lift=-0.08)


def terrace(c, x0, x1, base, face, top, seed, slope=8):
    """One stage of an earthen mound: its grassed front slope, the ends
    battered in by `slope`, its level top seen from above with rounded back
    corners; lit on the left, in shade on the right."""
    for j in range(face + top):
        y = base - 1 - j
        on_top = j >= face
        inset = round(min(j, face) * slope / face)
        if on_top:
            back = j - face
            inset += round(max(0, back - top + 6) ** 2 / 6)
        L, R = x0 + inset, x1 - inset
        for x in range(L, R):
            if on_top:
                k = 2 if j == face else 3
            else:
                k = 5 if j < 3 else 3 if j == face - 1 else 4
            e = round(slope * 0.9) + 2
            if x - L < e:
                k = max(0, k - 1)
            elif R - x <= e:
                k = min(6, k + 2)
            if h2(x // 2, y // 3, seed) > 0.9 and (y - base) % 3 == 0:
                k = max(0, k - 1)
            elif h2(x // 3, y // 2, seed + 1) < 0.05:
                k = min(6, k + 1)
            c.p(x, y, SWARD[k])
    return base - face, base - face - top, x0 + slope, x1 - slope


def earth_flight(c, cx, foot, head, w0, w1, rise=4, logs=False):
    """Steps cut in the earth up a slope, wider at the foot: each tread lit,
    each riser in shade, faced with a log where the climb is steep."""
    n = max(1, (foot - head) // rise)
    for i in range(n):
        y = foot - (i + 1) * rise
        w = round(w0 + (w1 - w0) * i / max(1, n - 1))
        x = cx - w // 2
        c.rect(x, y, w, rise, CLAY[3])
        c.rect(x, y, w, 1, CLAY[1])
        if logs:
            c.rect(x, y + rise - 2, w, 1, TOTARA[3]); c.rect(x, y + rise - 1, w, 1, TOTARA[5])
        else:
            c.rect(x, y + rise - 1, w, 1, CLAY[5])
        c.rect(x, y, 2, rise, CLAY[2]); c.rect(x + w - 2, y, 2, rise, CLAY[5])
        c.p(x - 1, y + rise - 1, SWARD[5]); c.p(x + w, y + rise - 1, SWARD[6])


def great_mound(spec=None, info=None):
    """Monks Mound at Cahokia, raised about 900 to 1200: a terraced platform
    of basket-loaded earth some 30 m high, grassed, the broad first terrace
    on the plaza side reached by a ramp, steps on up the main slope, and on
    the summit the great timber-and-thatch hall of the paramount chief inside
    a post fence."""
    from art import front_huts
    s = {**dict(W=272, depth=190, seed=11), **(spec or {})}
    W, D, seed = s['W'], s['depth'], s['seed']
    c = C(W + 40, 240)
    x0, base = 20, c.h - 6
    cx = x0 + W // 2
    f1, t1, l1, r1 = terrace(c, x0, x0 + W, base, 20, 30, seed, slope=12)
    f2, t2, l2, r2 = terrace(c, l1 + 8, r1 - 8, t1 + 4, 36, 10, seed + 1, slope=16)
    f3, t3, l3, r3 = terrace(c, l2 + 22, r2 - 22, t2 + 3, 14, 38, seed + 2, slope=8)
    # the ramp up from the plaza, the path worn across the first terrace,
    # then the steps on up the main slope and the summit
    earth_flight(c, cx, base, f1, 46, 34)
    for y in range(t1 + 4, f1):
        w = 30 - (f1 - y) // 4
        c.rect(cx - w // 2, y, w, 1, CLAY[2 if y > f1 - 3 else 3])
    earth_flight(c, cx, t1 + 4, f2, 26, 20, rise=4, logs=True)
    c.rect(cx - 9, t2 + 3, 18, f2 - t2 - 3, CLAY[3])
    earth_flight(c, cx, t2 + 3, f3, 18, 16, rise=3, logs=True)
    hall_info = {}
    hall = front_huts.BUILDERS['mississippian'](dict(W=118, hip=True, seed=4), hall_info)
    hb = t3 + 26
    hx = cx - hall.width // 2
    # the post fence round the summit, open where the steps arrive
    fl, fr = l3 + 4, r3 - 6

    def post(x, y):
        c.rect(x, y - 9, 2, 9, TOTARA[3]); c.p(x, y - 9, TOTARA[1]); c.p(x + 1, y - 1, TOTARA[5])
    for x in range(fl, fr + 1, 5):
        post(x, t3 + 8)
    for y in range(t3 + 12, f3 - 2, 4):
        post(fl, y); post(fr, y)
    c.im.alpha_composite(hall, (hx, hb - hall_info['base']))
    for x in range(fl, fr + 1, 5):
        if abs(x + 1 - cx) >= 12:
            post(x, f3 - 1)
    for a, b in ((fl, cx - 12), (cx + 12, fr + 2)):
        c.rect(a, f3 - 7, b - a, 1, TOTARA[2])
    ground_shadow(c, x0, x0 + W, base)
    return complete(c, info, x0, W, base, cx, 40, D, doorless=True, roof='flat')


# ------------------------------------------------------------------ catalogue

BUILDERS = {'synagogue': synagogue, 'agiary': agiary,
            'heiau': heiau, 'marae': marae, 'wharenui': wharenui, 'great-mound': great_mound}

S, M, L = 'small', 'medium', 'large'


def looks(kind, labels, desc, per_scale, **common):
    out = {}
    for scale, specs in per_scale.items():
        out[scale] = [(kind, {**common, **sp, 'label': labels[scale], 'description': desc}) for sp in specs]
    return out


SYN = {S: 'Synagogue', M: 'Synagogue', L: 'Great synagogue'}
HOUSE = {S: 'Meeting house', M: 'Meeting house', L: 'Meeting house'}

SPECS = {
    'mississippian-great-mound': {L: [('great-mound', dict(
        label='Great mound',
        description='The great earthen mound, with the chief\'s hall on its summit. Priests and chiefs climb it for ceremonies that the whole town gathers below to watch.'))]},
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
