"""Narrow insulae, configurable watchtowers and deity shrines.

    .venv/bin/python scripts/art/front_classical.py artifacts/classical-native

Specs and entrance metadata use the existing FrontAncientPainter contract.
Regional presets are shared with the settlement planner.
"""
from pathlib import Path
import json
import math
import sys
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, h2
from art import front_materials as fm
from art import front_openings as op
from art import front_goods as fg
from art import front_props as shared_props
from art.front_weather import weather
from art.front_house import roof_slope, GableHouse, ROOFS
from art import front_parts as fp
from art import front_solid as so
from art.front_house import bevel
from art.front_kit import finish, consolidate
from art import front_classical_props as pr
from art.front_style import FIGURE, DOOR, UPPER, GROUND

STONE = RAMPS['travertine']
WOOD = RAMPS['oak']
TILE = RAMPS['tegula']
BRICK = RAMPS['roman-brick']
RED = RAMPS['pompeian-red']
VOID = (39, 30, 43, 255)
DEITIES = ('athena', 'isis', 'hadad')


def shadow(c, x, y, w, h, steps=1):
    fg.dim(c, x, y, w, h, steps)


def cornice(c, x, y, w, r=STONE, dentils=False):
    shadow(c, x + 2, y + 6, w - 2, 3, 2)
    pr.band(c, x - 2, y, w + 4, r, (1, 0, 1, 2, 3, 5))
    if dentils:
        for xx in range(x + 2, x + w - 3, 6):
            c.rect(xx, y + 5, 3, 2, r[2]); c.p(xx + 2, y + 6, r[4])


def brickwork(c, x, y, w, h, seed=0):
    fm.testaceum(c, x, y, w, h)


def plaster(c, x, y, w, h, material='plaster-ochre', wear=0.4, seed=1):
    r = RAMPS[material]
    layer = C(w, h)
    fm.render(layer, 0, 0, w, h, r)
    if wear > 0:
        brick = C(w, h)
        fm.testaceum(brick, 0, 0, w, h)
        for side in (0, 1):
            mask = C(w, h)
            px = w - 3 if side else 2
            py = 8 + int(h2(side, h, seed) * (h - 18))
            fm.blob(mask, px, py, 3 + wear * 5, 5 + wear * 8, BRICK[3], seed + side)
            for yy in range(h):
                for xx in range(w):
                    if mask.g(xx, yy)[3]:
                        layer.p(xx, yy, brick.g(xx, yy))
    shadow(layer, w - 3, 0, 3, h)
    c.im.alpha_composite(layer.im, (x, y))
    c.px = c.im.load()


def material_wall(c, x, y, w, h, texture, colour):
    layer = C(w, h)
    r = RAMPS[colour]
    if texture in ('adobe', 'kahgel', 'whitewash', 'boards', 'rubble', 'stucco', 'testaceum', 'brick'):
        getattr(fm, texture)(layer, 0, 0, w, h, r)
    else:
        fp.wall(layer, 0, 0, w, h, texture, r)
    c.im.alpha_composite(layer.im, (x, y))
    c.px = c.im.load()


def colour(name):
    return RAMPS[name] if name in RAMPS else op.PAINT[name]


def roof(c, x, eave, w, depth=104, rise=None, material='tegula', seed=0, cover='imbrex'):
    half, cx = w // 2, x + w // 2
    rise = rise or round(w * 0.29)
    back = round(depth * so.K)
    rake = lambda xx: eave - round((half - abs(xx - cx)) * rise / half)
    tones = None if material == 'tegula' and cover == 'imbrex' else [RAMPS[material]]
    roof_slope(c, cx, x, rake, back, 0, cover, tones=tones)
    roof_slope(c, cx, x + w, rake, back, 1, cover, tones=tones)
    ridge = 'thatch' if cover == 'thatch' else 'lead' if cover == 'slate' else 'cap'
    GableHouse.ridge(SimpleNamespace(c=c), cx, rake(cx) - back - 1, rake(cx) + 2, ridge)
    r = RAMPS[material]
    for xx in range(x, x + w + 1):
        yy = rake(xx)
        for k, q in enumerate((1, 2, 4)):
            c.p(xx, yy + k, r[min(7, q + (xx > cx))])
    return cx, rise, back


def gable(c, x, eave, w, material='plaster-ochre', roof_material='tegula'):
    r = RAMPS[material]
    cx, half = x + w // 2, w // 2
    rise = round((w + 16) * 0.29)
    tex = C(w, rise + 6)
    fm.render(tex, 0, 0, w, tex.h, r)
    for xx in range(x, x + w):
        top = eave - round((half + 8 - abs(xx - cx)) * rise / (half + 8)) + 4
        for yy in range(top, eave + 2):
            c.p(xx, yy, tex.g(xx - x, yy - eave + rise))
        shadow(c, xx, top, 1, 4, 2)
    shadow(c, x, eave - 1, w, 3)


def opening(c, x, y, w, h, r=STONE, shutter='open', seed=0):
    op.frame_roman(c, x, y, w, h, None, r)
    op.INFILLS['boards' if shutter == 'closed' else 'open'](c, x, y, w, h, 'oak')
    op.reveal(c, x, y, w, h, 2)
    if shutter == 'open':
        op.open_shutters(c, x, y, w, h, 'oak', 6)


def arch(c, cx, y, w, rise=9, r=BRICK):
    op.head_arch(c, cx - w // 2, y + 3, w, 44)


def door(c, cx, by, w=22, h=44):
    op.door_studded(c, cx - w // 2, by - h, w, h)
    fp.sill(c, cx - w // 2, w, by + 1, STONE)


def balcony(c, x, by, w):
    shadow(c, x, by + 5, w, 5, 2)
    for xx in (x + 5, x + w // 2 - 2, x + w - 10):
        for k in range(8):
            c.rect(xx + min(3, k // 2), by + k, max(1, 6 - k // 2), 1, STONE[2 if k < 4 else 3])
    pr.band(c, x - 2, by - 3, w + 4, STONE, (1, 0, 1, 2, 4))
    for xx in range(x, x + w, 7):
        bevel(c, xx, by - 15, 2, 12, WOOD, 3)
    pr.band(c, x - 2, by - 17, w + 4, WOOD, (1, 2, 4))
    pr.band(c, x, by - 9, w, WOOD, (2, 4))


def insula(spec=None, info=None):
    s = {**dict(width=96, storeys=3, roof_depth=104, wall='plaster-ochre', roof='tegula',
                seed=21, wear=0.6, balcony=True, shop=True), **(spec or {})}
    n, w = s['storeys'], s['width']
    if n not in (1, 2, 3):
        raise ValueError('insula storeys must be 1, 2 or 3')
    wall_h = GROUND + (n - 1) * UPPER
    top = round(s['roof_depth'] * so.K) + round((w + 16) * 0.29) + 10
    base, x = top + wall_h, 17
    c = C(w + 35, base + 9)
    plaster(c, x, top, w, wall_h, s['wall'], s['wear'], s['seed'])
    c.rect(x, base - 19, w, 13, RED[3]); c.rect(x, base - 19, w, 1, RED[2])
    pr.ashlar(c, x, base - 6, w, 6, STONE, 6, 16, s['seed'])
    for floor in range(1, n):
        y = base - GROUND - floor * UPPER
        for bay in range(2):
            cx = x + round(w * (0.25 + bay * 0.5))
            state = 'closed' if h2(bay, floor, s['seed']) > 0.6 else 'open'
            opening(c, cx - 8, y + 13, 16, 25, shutter=state, seed=s['seed'])
        cornice(c, x, y + UPPER - 3, w, STONE)
    if s['balcony'] and n > 1:
        balcony(c, x + 8, base - GROUND + 2, w - 16)
    entrance = x + round(w * 0.74)
    door(c, entrance, base, *DOOR)
    arch(c, entrance, base - DOOR[1] - 4, DOOR[0] + 4, 7)
    if s['shop']:
        sx, sw = x + 7, max(25, round(w * 0.42))
        sy = base - 45
        c.rect(sx - 2, sy - 2, sw + 4, 47, STONE[4])
        c.rect(sx, sy, sw, 44, VOID)
        for xx in (sx + sw - 2,):
            bevel(c, xx, sy, 2, 44, WOOD, 4)
        for shelf_y in (base - 24, base - 8):
            for k, px in enumerate(range(sx + 7, sx + sw - 3, 10)):
                pr.amphora(c, px, shelf_y - 2, size=0.55, kind='jug' if k % 2 else 'oil')
            pr.band(c, sx + 2, shelf_y, sw - 4, WOOD, (2, 4))
        arch(c, sx + sw // 2, sy - 3, sw, 9)
        pr.band(c, sx - 2, base + 1, sw + 4, STONE, (1, 2, 4))
    else:
        opening(c, x + 14, base - 40, 18, 25, shutter='closed')
    gable(c, x, top, w, s['wall'], s['roof'])
    # The front gable is below the rake; the two roof planes continue behind it.
    roof(c, x - 8, top - 2, w + 16, s['roof_depth'], material=s['roof'], seed=s['seed'])
    cornice(c, x, top + 1, w, STONE, True)
    return complete(c, info, x, w, base, entrance, DOOR[1], roof_depth=s['roof_depth'])


def wrapped_texture(texture, ramps, height, seed=0):
    choices = [q for r in ramps for q in r]
    lookup = {}
    for q in set(texture.im.getdata()):
        best = min(choices, key=lambda p: sum((p[i] - q[i]) ** 2 for i in range(3)))
        r = next(r for r in ramps if best in r)
        lookup[q] = r, r.index(best)

    def surface(x, y, z, light):
        angle = (math.atan2(y, x) + math.pi) / math.tau
        u = (round(angle * texture.w) + seed * 7) % texture.w
        v = max(0, min(texture.h - 1, round(height - z)))
        r, q = lookup[texture.g(u, v)]
        return r[max(0, min(7, q + light - 3))]
    return surface


def rounded_opening(c, cx, top, w, h, r=STONE):
    x = cx - w // 2
    spring = fp.surround(c, x, top, w, h, 'round', r, depth=3)
    for yy in range(top, top + h):
        for xx in range(x, x + w):
            if fp.rounded(xx, yy, x, spring, w):
                c.p(xx, yy, VOID)
    c.rect(x + w - 2, spring, 2, max(1, top + h - spring), r[4])
    fp.sill(c, x, w, top + h, r)


def banner(c, cx, top, w=16, h=52, emblem='laurel', cloth='pompeian-red', trim='bronze'):
    gold = pr.BRONZE if trim == 'bronze' else colour(trim)
    fabric = colour(cloth)
    pr.band(c, cx - w // 2 - 3, top - 2, w + 6, gold, (1, 3))
    for xx in (cx - w // 2 - 4, cx + w // 2 + 3):
        so.ellipse(c, xx, top - 2, 2, 2, gold[2])
    for yy in range(top, top + h):
        for xx in range(cx - w // 2, cx + w // 2):
            u = xx - cx + w // 2
            q = 4 if u in (0, w - 1) else 2 if u in (2, w - 4) else 3
            c.p(xx, yy, fabric[q])
    for xx in (cx - w // 2 + 1, cx + w // 2 - 2):
        c.rect(xx, top + 2, 1, h - 3, gold[2])
    for xx in range(cx - w // 2, cx + w // 2):
        c.p(xx, top + h - 1, gold[2]); c.p(xx, top + h + (xx % 2), gold[3])
    cy = top + h // 2
    if emblem == 'laurel':
        for side in (-1, 1):
            for i in range(5):
                xx = cx + side * (4 - abs(i - 2))
                yy = cy - 5 + i * 2
                c.p(xx, yy, gold[1]); c.p(xx + side, yy - 1, gold[2])
        pr.line(c, cx - 2, cy + 5, cx + 2, cy + 5, gold[2])
    else:
        for a in range(0, 360, 45):
            t = math.radians(a)
            c.p(cx + math.cos(t) * 4, cy + math.sin(t) * 4, gold[1])
        so.ellipse(c, cx, cy, 2, 2, gold[2])


def ring(c, cx, by, profile, r, R):
    layer = C(c.w, c.h)
    so.lathe(layer, cx, by, profile, r)
    # The cylinder hides the back half of each projecting ring.
    top = profile[-1][0]
    for xx in range(max(0, int(cx - R - 5)), min(c.w, int(cx + R + 6))):
        cutoff = by - top + so.K * math.sqrt(max(0, R * R - (xx - cx) ** 2))
        for yy in range(max(0, int(cutoff)), min(c.h, round(by - profile[0][0] + R * so.K + 2))):
            q = layer.g(xx, yy)
            if q[3]:
                c.p(xx, yy, q)


def tower_opening(c, cx, top, kind, dress, seed=0):
    if kind == 'none':
        return
    if kind == 'round':
        rounded_opening(c, cx, top, 8, 15, dress)
    elif kind == 'slit':
        fp.surround(c, cx - 2, top, 4, 19, 'square', dress, 2)
        c.rect(cx - 2, top, 4, 19, VOID)
    else:
        fp.window(c, kind, cx, top, 10, 20, dress, seed=seed, glass='clear')


def tower_door(c, cx, base, spec, dress):
    w, h = 24, 44
    shape = spec['door_shape']
    y = base - h - 3
    spring = fp.surround(c, cx - w // 2, y - 6, w, h + 7, shape, dress, 4)
    layer = C(c.w, c.h)
    if spec['door'] == 'studded':
        op.door_studded(layer, cx - w // 2, y - 6, w, h + 6, RAMPS[spec['wood']])
    else:
        op.DOORS[spec['door']][0](layer, cx - w // 2, y - 6, w, h + 6)
        if spec['wood'] != 'oak':
            for yy in range(y - 6, base):
                for xx in range(cx - w // 2, cx + w // 2):
                    q = layer.g(xx, yy)
                    if q in WOOD:
                        layer.p(xx, yy, RAMPS[spec['wood']][WOOD.index(q)])
    for yy in range(y - 6, base - 3):
        for xx in range(cx - w // 2, cx + w // 2):
            if fp.SHAPES[shape](xx, yy, cx - w // 2, spring, w):
                c.p(xx, yy, layer.g(xx, yy))
    fp.sill(c, cx - w // 2, w, base - 2, dress)


def round_roof(c, cx, top, R, height, form, cover, material, dress, seed, battlements=False):
    rr = R + 8
    r = RAMPS[material]
    if form in ('flat', 'battlement'):
        so.lathe(c, cx, top, [(0, R + 2), (7, R + 2)], dress,
                 hollow=(R - 4, -1), inside=dress)
        if form == 'battlement' or battlements:
            parts = []
            for i in range(14):
                angle = math.tau * i / 14
                xx, yy = cx + math.cos(angle) * (R - 1), top - math.sin(angle) * (R - 1) * so.K
                parts.append((yy, xx))
            for yy, xx in sorted(parts):
                so.box(c, round(xx) - 3, round(yy), 7, 10, 7, dress, z0=7)
        return
    if form == 'dome':
        so.dome(c, cx, top, R + 3, r, kind='hemi', courses=0)
        return
    texture = C(round(math.tau * rr), height + 3)
    painter = {'imbrex': fm.imbrex, 'plain': fm.plain_tiles, 'pantile': fm.pantiles,
               'slate': fm.slate, 'shingle': fm.shingles, 'thatch': fm.thatch, 'lead': fm.zinc}[cover]
    painter(texture, 0, 0, texture.w, texture.h, r)
    so.lathe(c, cx, top, [(0, rr), (3, rr), (height, 2)], r,
             surface=wrapped_texture(texture, [r], height, seed))
    so.lathe(c, cx, top, [(height - 1, 3), (height + 2, 2), (height + 5, 1)], pr.BRONZE)


def tower(spec=None, info=None):
    s = {**dict(width=84, storeys=3, roof_depth=96, wall='render', roof='tegula',
                seed=8, wear=0.4, shape='round', banner=True, cloth='pompeian-red', trim='bronze',
                wall_texture='render', dress='travertine', base_stone='travertine', roof_form='cone',
                cover='imbrex', door='studded', door_shape='round', wood='oak', window='round', turret=False), **(spec or {})}
    if s['shape'] == 'square':
        return square_tower(s, info)
    n, w = s['storeys'], s['width']
    if n not in (1, 2, 3):
        raise ValueError('tower storeys must be 1, 2 or 3')
    R, H = w // 2, GROUND + (n - 1) * UPPER
    roof_h, roof_R = round(R * 0.9), R + 8
    top = roof_h + round(roof_R * so.K) + 12
    by = top + H
    base = by + round(R * so.K) + 3
    c = C(w + (60 if s['turret'] else 40), base + 10)
    cx = c.w // 2
    wall = RAMPS[s['wall']]
    dress, foot = RAMPS[s['dress']], RAMPS[s['base_stone']]
    texture = C(round(math.tau * R), H + 2)
    material_wall(texture, 0, 0, texture.w, H + 2, s['wall_texture'], s['wall'])
    under = C(texture.w, texture.h)
    fm.ashlar(under, 0, 0, under.w, under.h, foot, 11, 23)
    for k in range(6):
        mask = C(texture.w, texture.h)
        xx = round(h2(k, 0, s['seed']) * texture.w)
        yy = round(16 + h2(k, 1, s['seed']) * max(1, H - 43))
        fm.blob(mask, xx, yy, 4, 7, STONE[2], k)
        for py in range(max(0, yy - 8), min(texture.h, yy + 9)):
            for px in range(max(0, xx - 5), min(texture.w, xx + 6)):
                if mask.g(px, py)[3]:
                    texture.p(px, py, under.g(px, py))
    fm.ashlar(texture, 0, H - 30, texture.w, 32, foot, 9, 17)
    so.lathe(c, cx, by, [(0, R), (H, R)], wall,
             surface=wrapped_texture(texture, [wall, foot], H, s['seed']))
    ring(c, cx, by, [(0, R + 2), (3, R + 2), (5, R)], foot, R)
    ring(c, cx, by, [(H - 31, R + 1), (H - 28, R + 1)], dress, R)
    if n > 1:
        for dx in (-21, 0, 21):
            curve = round(so.K * math.sqrt(R * R - dx * dx))
            tower_opening(c, cx + dx, top + curve + 8, s['window'], dress, s['seed'])
        ring(c, cx, by, [(H - 48, R + 1), (H - 44, R + 1)], pr.BRONZE, R)
    if n == 3 and s['banner']:
        banner(c, cx, base - 116, 25, 48, cloth=s['cloth'], trim=s['trim'])
    dh = 44
    tower_door(c, cx, base, s, dress)
    ring(c, cx, by, [(H - 3, R + 3), (H, R + 3), (H + 2, R + 1)], dress, R)
    round_roof(c, cx, top, R, roof_h, s['roof_form'], s['cover'], s['roof'], dress, s['seed'])
    if s['turret'] and n > 1:
        tx, ty = cx + R - 2, top + 13
        so.lathe(c, tx, ty, [(0, 10), (30, 10)], dress)
        tower_opening(c, tx, ty - 24, 'slit', dress)
        round_roof(c, tx, ty - 30, 9, 14, 'cone', s['cover'], s['roof'], dress, s['seed'])
    walls = {(xx, yy) for yy in range(top + 30, base - 7) for xx in range(cx - R + 3, cx + R - 2)}
    stone = {(xx, yy) for yy in range(base - 20, base - 3) for xx in range(cx - R + 4, cx + R - 3)}
    weather(c, dict(walls=walls, stone=stone, sills=[(cx - 14, base - 1, 28)]), s['wear'], s['seed'])
    return complete(c, info, cx - R - 2, w + 4, base + 1, cx, dh, roof_depth=s['roof_depth'],
                    door_base=base - 3, door_width=24)


def square_tower(spec=None, info=None):
    s = {**dict(width=76, storeys=3, roof_depth=96, wall='sandstone', roof='tegula',
                seed=8, wear=0.35, gallery=True), **(spec or {})}
    n, w = s['storeys'], s['width']
    if n not in (1, 2, 3):
        raise ValueError('tower storeys must be 1, 2 or 3')
    top = round(s['roof_depth'] * so.K) + round((w + 20) * 0.29) + 10
    base, x = top + GROUND + (n - 1) * UPPER, 20
    c = C(w + 41, base + 9)
    r = RAMPS[s['wall']]
    material_wall(c, x, top, w, base - top, s['wall_texture'], s['wall'])
    for edge in (x, x + w - 8):
        for yy in range(top + 8, base - 8, 16):
            pr.ashlar(c, edge, yy, 8, 8, STONE, 8, 8, s['seed'])
    pr.ashlar(c, x - 3, base - 9, w + 6, 9, STONE, 9, 20, s['seed'])
    pr.band(c, x - 5, base - 11, w + 10, STONE, (0, 1, 3))
    for floor in range(1, n):
        yy = base - GROUND - (floor - 1) * UPPER
        brickwork(c, x, yy - 5, w, 6, s['seed'])
        pr.band(c, x, yy + 1, w, r, (1, 3))
        if not (floor == n - 1 and s['gallery']):
            tower_opening(c, x + w // 2, yy - 38, s['window'], RAMPS[s['dress']], s['seed'])
    if s['gallery'] and n > 1:
        gt, gh = top + 9, 25 if n > 1 else 15
        c.rect(x + 7, gt, w - 14, gh, WOOD[7])
        c.rect(x + 10, gt + 3, w - 20, gh - 4, VOID)
        for xx in (x + 8, x + w // 2 - 2, x + w - 12):
            bevel(c, xx, gt, 4, gh + 5, WOOD, 3)
        pr.band(c, x + 4, gt - 3, w - 8, WOOD, (1, 2, 4))
        so.box(c, x + 2, gt + gh + 5, w - 4, 10, 8, r)
        pr.ashlar(c, x + 2, gt + gh - 4, w - 4, 9, r, 9, 16, s['seed'])
        cornice(c, x, gt + gh + 5, w, STONE)
    tower_door(c, x + w // 2, base, s, RAMPS[s['dress']])
    if s['roof_form'] in ('flat', 'battlement'):
        so.box(c, x, top, w, 3, s['roof_depth'], r)
        fp.parapet(c, x, top - round(s['roof_depth'] * so.K), w, r, 'crenel' if s['roof_form'] == 'battlement' else 'plain')
        fp.battlements(c, x, top, w, r, pinnacles=False, turret=s['turret'])
    elif s['roof_form'] == 'dome':
        so.box(c, x, top, w, 3, s['roof_depth'], r)
        so.dome(c, x + w // 2, top - 5, w // 2, RAMPS[s['roof']], kind='hemi', courses=0)
    else:
        gable(c, x, top, w, s['wall'])
        roof(c, x - 10, top - 2, w + 20, s['roof_depth'], material=s['roof'], seed=s['seed'], cover=s['cover'])
        pr.band(c, x - 1, top + 1, w + 2, WOOD, (2, 3, 5))
    return complete(c, info, x - 5, w + 10, base, x + w // 2, DOOR[1], roof_depth=s['roof_depth'],
                    door_base=base - 3, door_width=24)


def sculpture(c, cx, by, deity='athena', material='marble'):
    from art.city_kit import C as FigureCanvas
    from art.props_b.monuments import standing
    if deity not in DEITIES:
        raise ValueError(f'unknown sculpture {deity}')
    r = pr.BRONZE if material == 'bronze' else RAMPS[material]
    layer = FigureCanvas(c.w, c.h)
    palette = ['#%02x%02x%02x' % q[:3] for q in reversed(r[:7])]
    standing(layer, cx, by, 0.46, palette, pose='raise' if deity == 'hadad' else 'chest', robe=True)
    c.im.alpha_composite(layer.im)
    c.px = c.im.load()
    head = by - 44
    if deity == 'athena':
        so.ellipse(c, cx, head - 1, 4, 2, r[2])
        pr.line(c, cx - 2, head - 4, cx + 2, head - 6, r[1])
        c.rect(cx + 2, head - 6, 2, 5, r[4])
        pr.line(c, cx - 11, head - 5, cx - 11, by - 1, r[3])
        c.p(cx - 11, head - 7, r[1]); c.p(cx - 12, head - 6, r[2])
        so.ellipse(c, cx + 7, by - 13, 6, 9, r[4])
        so.ellipse(c, cx + 6.5, by - 14, 4.5, 7, r[2])
        so.ellipse(c, cx + 7, by - 13, 2, 3, r[1])
    elif deity == 'isis':
        so.ellipse(c, cx, head - 5, 3, 3, r[2])
        for side in (-1, 1):
            pr.line(c, cx + side * 4, head - 1, cx + side * 5, head - 6, r[3])
            pr.line(c, cx + side * 5, head - 6, cx + side * 2, head - 10, r[1 if side < 0 else 4])
        pr.line(c, cx - 7, head + 22, cx - 9, head + 9, r[3])
        so.ellipse(c, cx - 9, head + 7, 2.5, 3.5, r[3])
        so.ellipse(c, cx - 9, head + 7, 1.2, 2.2, VOID)
    else:
        for yy in range(8):
            half = 1 + yy // 3
            c.rect(cx - half, head - 7 + yy, half * 2 + 1, 1, r[2 if yy % 3 else 4])
        pr.line(c, cx + 12, head - 10, cx + 12, head + 2, r[3])
        c.rect(cx + 10, head - 13, 5, 6, r[3])
        pr.line(c, cx - 9, head + 15, cx - 9, by - 2, r[3])
        for dy in (12, 16, 20):
            pr.line(c, cx - 10, head + dy, cx - 7, head + dy - 2, r[1])


def shrine(spec=None, info=None):
    s = {**dict(width=144, roof_depth=100, deity='athena', stone='travertine', sculpture='marble',
                order='ionic', roof='tegula', seed=9, paint=True, plants=True, roof_form='gable',
                cover='imbrex', cloth='pompeian-red', trim='bronze', accent='pompeian-red',
                wall='render', wall_texture='render', banners=True), **(spec or {})}
    w, x = s['width'], 26
    r = RAMPS[s['stone']]
    pw = w - 36
    rise, back = round((pw + 16) * 0.29), round(s['roof_depth'] * so.K)
    eave = rise + back + 15
    col_top, floor = eave + 16, eave + 94
    base = floor + 22
    c = C(w + 53, base + 11)
    cx = x + w // 2
    material_wall(c, x + 3, eave - 2, w - 6, floor - eave + 2, s['wall_texture'], s['wall'])
    accent = colour(s['accent'])
    pr.ashlar(c, x + 3, floor - 21, w - 6, 25, r, 8, 17, s['seed'])
    if s['paint']:
        c.rect(x + 3, floor - 31, w - 6, 16, accent[3])
        pr.band(c, x + 3, floor - 32, w - 6, accent, (2, 4))
    aw = pw - 28
    pr.ashlar(c, cx - aw // 2, col_top + 3, aw, floor - col_top, r, 9, 18, s['seed'], shade=3)
    c.rect(cx - aw // 2, col_top + 3, 3, floor - col_top - 3, r[6])
    c.rect(cx - aw // 2, col_top + 3, aw, 5, r[6])
    c.rect(cx + aw // 2 - 3, col_top + 7, 3, floor - col_top - 7, r[5])
    so.box(c, cx - aw // 2, floor + 1, aw, 18, 3, r)
    so.box(c, cx - 11, floor - 3, 22, 12, 10, r)
    pr.band(c, cx - 13, floor - 14, 26, r, (0, 1, 2, 4))
    sculpture(c, cx, floor - 16, s['deity'], s['sculpture'])
    for side in (-1, 1):
        pr.lamp(c, cx + side * 25, floor - 1)
    shadow(c, x + 4, col_top, w - 8, 7, 2)
    for cc in (cx - pw // 2 + 13, cx + pw // 2 - 13):
        so.box(c, cc - 9, floor + 5, 18, 14, 13, r)
        fp.column(c, cc, col_top - 1, floor - 9, r, 12, s['order'])
        so.lathe(c, cc, floor - 6, [(0, 8), (2, 9), (4, 8), (6, 7)], r)
        if s['order'] == 'ionic':
            for side in (-1, 1):
                so.ellipse(c, cc + side * 5, col_top + 4, 3, 3, r[3])
                so.ellipse(c, cc + side * 5 - 0.5, col_top + 3.5, 2, 2, r[0])
                c.p(cc + side * 5, col_top + 4, r[4])
    if s['banners']:
        for side in (-1, 1):
            banner(c, x + 13 if side < 0 else x + w - 13, col_top + 8, 16, 57,
                   'laurel' if s['deity'] == 'athena' else 'sun', s['cloth'], s['trim'])
    for k in range(4):
        sw = pw - 22 + k * 8
        sx = cx - sw // 2
        pr.band(c, sx, floor + 2 + k * 5, sw, r, (0, 1, 2, 3, 4))
        for xx in range(sx + 16, sx + sw - 8, 24):
            c.p(xx, floor + 4 + k * 5, r[3]); c.p(xx + 1, floor + 5 + k * 5, r[3])
    for side in (-1, 1):
        cc = x + 10 if side < 0 else x + w - 10
        so.box(c, cc - 11, base - 2, 22, 15, 16, r)
        pr.ashlar(c, cc - 11, base - 15, 22, 13, r, 7, 12, s['seed'])
    if s['roof_form'] == 'gable':
        roof(c, x - 5, eave - 9, w + 10, s['roof_depth'] - 18, rise=22, material=s['roof'], cover=s['cover'])
        gable(c, cx - pw // 2, eave, pw, s['stone'])
        roof(c, cx - pw // 2 - 8, eave - 2, pw + 16, s['roof_depth'], material=s['roof'], cover=s['cover'])
        for xx in range(cx - pw // 2 - 8, cx + pw // 2 + 9):
            yy = eave - 2 - round(((pw + 16) / 2 - abs(xx - cx)) * rise / ((pw + 16) / 2))
            for k, q in enumerate((0, 1, 2, 4)):
                c.p(xx, yy + 3 + k, r[q])
    elif s['roof_form'] == 'hip':
        fp.roof_band(c, x - 5, x + w + 5, eave, 46, s['cover'], RAMPS[s['roof']], hip=0.6)
    else:
        so.box(c, x - 4, eave + 2, w + 8, 5, s['roof_depth'], r,
               lambda c, x, y, w, h: fm.ashlar(c, x, y, w, h, r, 7, 19))
        fp.parapet(c, x - 4, eave - back, w + 8, r, 'plain')
        if s['roof_form'] == 'dome':
            so.dome(c, cx, eave - 7, pw // 3, RAMPS[s['roof']], kind='hemi', courses=0)
        fp.parapet(c, x - 4, eave, w + 8, r, 'plain')
    cornice(c, cx - pw // 2 - 2, eave + 2, pw + 4, r, True)
    pr.band(c, cx - pw // 2, eave + 9, pw, r, (1, 2, 2, 3, 3, 3, 4, 5))
    if s['roof_form'] == 'gable':
        for side in (-1, 1):
            for i in range(6):
                xx = cx + side * (8 - i // 2)
                yy = eave - 18 + i * 2
                pr.line(c, xx, yy, xx + side * 3, yy - 2, r[0 if side < 0 else 2])
                c.p(xx + side * 3, yy - 1, r[4])
        pr.line(c, cx - 4, eave - 7, cx + 4, eave - 7, r[2])
    if s['plants']:
        for cc in (x - 12, x + w + 12):
            shared_props.pot(c, cc, base + 2, 'flowerpot', pr.CLAY, scale=1.5)
            shared_props.tree(c, cc, base - 10, 'cypress', size=0.95)
        for cc in (x + 11, x + w - 11):
            shared_props.pot(c, cc, base + 4, 'flowerpot', pr.CLAY, scale=1.15)
            shared_props.shrub(c, cc, base - 6, R=7)
        for yy in range(floor - 48, base + 6):
            for xx in range(c.w):
                if c.g(xx, yy)[3] and max(c.g(xx, yy)[:3]) < 14:
                    c.p(xx, yy, shared_props.LEAF_DARK[5])
    return complete(c, info, x - 22 if s['plants'] else x - 3,
                    w + 44 if s['plants'] else w + 6, base + 1, cx, 56, roof_depth=s['roof_depth'], doorless=True)


def complete(c, info, x, w, base, door_x, door_h, **extra):
    finish(c)
    consolidate(c, rare=5, reach=35)
    if info is not None:
        info.update(x0=x, W=w, base=base, door_x=door_x, door_h=door_h, **extra)
    return c.im


def cached(builder):
    images = {}

    def paint(spec=None, info=None):
        key = json.dumps(spec or {}, sort_keys=True)
        if key not in images:
            metadata = {}
            images[key] = builder(spec, metadata), metadata
        im, metadata = images[key]
        if info is not None:
            info.update(metadata)
        return im
    return paint


BUILDERS = {name: cached(builder) for name, builder in
            [('classical-insula', insula), ('classical-tower', tower), ('classical-shrine', shrine)]}


def game_recipes(recipes):
    styles = json.loads((ROOT / 'src/content/graphics/mediterranean-buildings.json').read_text())['styles']
    house = recipes['house-roman-ob-0']
    temple = recipes['religious-mesopotamian-temple-small-0']
    for look, parts in styles.items():
        for n in (1, 2, 3):
            spec = dict(parts['tower'], storeys=n, seed=31 + n)
            info = {}
            im = BUILDERS['classical-tower'](spec, info)
            fw, fh = math.ceil(info['W'] / 16), math.ceil(info['roof_depth'] / 16)
            recipes[f'house-watchtower-{look}-{n}'] = {
                **{k: v for k, v in house.items() if k not in ('shadowFrame', 'frontAncient', 'roofVoid')},
                'label': 'Storehouse' if n == 1 else 'Watchtower', 'family': 'watchtower',
                'description': 'A round or square storehouse.' if n == 1 else 'A watchtower beside the town gate, with a stair to its upper lookout.',
                'front': True, 'frontClassical': True, 'frontAncient': ('classical-tower', spec),
                'footprint': [fw, fh], 'entrance': [fw // 2, fh], 'height': im.height,
                'roof': 'flat' if spec.get('roof_form') == 'battlement' else 'gable'}
        if 'shrine' in parts:
            for form, n in ((None, 2), ('row', 2), ('tall', 3), ('shop', 1), ('cottage', 1)):
                spec = dict(storeys=n, seed=17, wall='whitewash' if look == 'egypt' else 'plaster-ochre')
                info = {}
                im = BUILDERS['classical-insula'](spec, info)
                fw, fh = math.ceil(info['W'] / 16), math.ceil(info['roof_depth'] / 16)
                name = f'house-classical-insula-{look}-0' + (f'-urban-{form}' if form else '')
                recipes[name] = {
                    **{k: v for k, v in house.items() if k not in ('shadowFrame', 'frontAncient', 'roofVoid')},
                    'label': 'Insula', 'description': 'A narrow street-front house, with rented rooms above a shop.',
                    'front': True, 'frontClassical': True, 'frontAncient': ('classical-insula', spec),
                    'footprint': [fw, fh], 'entrance': [(info['door_x'] - info['x0']) // 16, fh],
                    'height': im.height, 'roof': 'gable'}
        if 'shrine' not in parts:
            continue
        for scale, width in (('small', 144), ('medium', 160), ('large', 184)):
            spec = dict(parts['shrine'], width=width, seed=41, plants=scale != 'large')
            info = {}
            im = BUILDERS['classical-shrine'](spec, info)
            fw, fh = math.ceil(info['W'] / 16), math.ceil(info['roof_depth'] / 16)
            recipes[f'religious-mediterranean-shrine-{scale}-{look}'] = {
                **{k: v for k, v in temple.items() if k not in ('shadowFrame', 'sacredVoxel', 'style', 'roofVoid')},
                'label': 'Shrine', 'description': 'A small cult shrine: the sacred image under its porch, lamps and offerings before it.',
                'family': 'mediterranean-shrine', 'recipe': 'mediterranean-shrine', 'religious': True,
                'front': True, 'frontClassical': True, 'frontAncient': ('classical-shrine', spec),
                'footprint': [fw, fh], 'entrance': [fw // 2, fh], 'height': im.height,
                'roof': 'flat' if spec.get('roof_form') == 'flat' else 'gable'}


def candidate_recipes(template):
    recipes = {}
    for name, label, kind, spec in studies():
        info = {}
        im = BUILDERS[kind](spec, info)
        fw = math.ceil(info['W'] / 16)
        fh = math.ceil(info['roof_depth'] / 16)
        recipes[f'classical-{name}'] = {
            **{k: v for k, v in template.items() if k not in ('shadowFrame', 'sacredVoxel', 'frontHouse', 'frontCivic')},
            'label': label, 'family': kind, 'candidate': True, 'front': True,
            'roof': 'gable', 'roofMaterial': 'tile', 'wall': 'lime-plaster',
            'footprint': [fw, fh], 'entrance': [min(fw - 1, (info['door_x'] - info['x0']) // 16), fh], 'height': im.height,
            'frontAncient': (kind, spec)}
    return recipes


def studies():
    for n, deity in zip((3, 2, 1), DEITIES):
        yield f'insula-{n}', f'Insula / {n} storeys', 'classical-insula', dict(storeys=n, seed=21)
        yield f'tower-{n}', f'Watchtower / {n} storeys', 'classical-tower', dict(storeys=n, seed=8)
        sculpture_material = {'athena': 'marble', 'isis': 'granite', 'hadad': 'bronze'}[deity]
        yield f'shrine-{deity}', f'Shrine / {deity.title()}', 'classical-shrine', dict(deity=deity, sculpture=sculpture_material)


def regional_studies():
    styles = json.loads((ROOT / 'src/content/graphics/mediterranean-buildings.json').read_text())['styles']
    for name, parts in styles.items():
        for n in (3, 1):
            yield f'{name}-tower-{n}', f'{name.title()} / {n} storeys', 'classical-tower', dict(parts['tower'], storeys=n)
        if 'shrine' in parts:
            yield f'{name}-shrine', f'{name.title()} shrine', 'classical-shrine', parts['shrine']


def make(out):
    from art.front_review import sheet
    from art.front_audit import image_faults
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    items, records, faults = [], {}, []
    for name, label, kind, spec in studies():
        info = {}
        im = BUILDERS[kind](spec, info)
        im.save(out / f'{name}.png')
        items.append((label, im))
        records[name] = {'builder': kind, 'spec': spec, 'size': im.size, 'entrance': info}
        faults.extend(image_faults(name, im))
    sheet(items, out / 'buildings-contact-sheet.png', masters=False, columns=3)
    sheet([items[0], items[1], items[2]], out / 'gold-master-comparison.png')
    props = []
    for name in pr.PROPS:
        im = pr.sprite(name)
        im.save(out / f'prop-{name}.png')
        props.append((name.replace('-', ' ').title(), im))
        faults.extend(image_faults(name, im))
    sheet(props, out / 'props-contact-sheet.png', zoom=4, masters=False, columns=4)
    variants, by_name = [], {}
    for name, label, kind, spec in regional_studies():
        info = {}
        im = BUILDERS[kind](spec, info)
        im.save(out / f'{name}.png')
        variants.append((label, im))
        by_name[name] = (label, im)
        faults.extend(image_faults(name, im))
        records[name] = {'builder': kind, 'spec': spec, 'size': im.size, 'entrance': info}
    sheet(variants, out / 'procedural-variants.png', masters=False, columns=4)
    names = ['roman-tower-3', 'anatolia-tower-3', 'maghreb-tower-3', 'western-tower-3',
             'roman-tower-1', 'iran-tower-1', 'timber-tower-1', 'greek-tower-1',
             'roman-shrine', 'egypt-shrine', 'levant-shrine', 'greek-shrine']
    sheet([by_name[n] for n in names], out / 'game-variants-contact-sheet.png', zoom=2, masters=False, columns=4)
    (out / 'sprites.json').write_text(json.dumps({'figureHeight': FIGURE, 'buildings': records,
                                                'props': list(pr.PROPS)}, indent=2) + '\n')
    if faults:
        raise RuntimeError('\n'.join(faults))
    print(f'classical art: {len(records)} building studies, 12 props; pixel audit clean')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/classical-native')
