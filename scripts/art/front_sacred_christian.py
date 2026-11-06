"""Eastern churches front-on: Byzantine, Rus and Muscovite, Georgian and
Armenian, Orthodox monasteries, Ethiopian round and rock-hewn churches,
Coptic and Nubian churches. Specs and frames: see front_sacred.py.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-christian.png christian
"""
import math

from art import front_materials as fm
from art.front_materials import C, RAMPS, ramp, mix, h2
from art import front_solid as so
from art import front_parts as fp
from art.front_sacred import complete, arch_door, cone, ground_shadow, VOID, GOLD

K = so.K
WOOD = RAMPS['oak']
TONE = {
    'byz-stone': ramp(72, 0.045, lift=0.02),
    'byz-brick': ramp(36, 0.11, lift=-0.03),
    'white-stone': ramp(85, 0.025, lift=0.04),
    'whitewash': RAMPS['whitewash'],
    'logs': ramp(46, 0.065, lift=-0.1),
    'red': ramp(26, 0.14, lift=-0.17),
    'gsand': ramp(76, 0.065, lift=0.01),
    'tufa': ramp(26, 0.055, lift=-0.02),
    'basalt': ramp(265, 0.02, lift=-0.1),
    'mud': ramp(60, 0.06, lift=0.0),
    'nubian': ramp(50, 0.08, lift=-0.04),
    'egypt': ramp(80, 0.05, lift=0.02),
    'granite': ramp(40, 0.045, lift=-0.06),
    'athos': ramp(70, 0.03, lift=-0.04),
    'athos-red': ramp(26, 0.12, lift=-0.1),
    'rock': ramp(30, 0.07, lift=-0.06),
    'aksum': ramp(58, 0.04, lift=-0.04),
}
METAL = {
    'gold': GOLD, 'lead': RAMPS['lead'], 'tile': RAMPS['terracotta'], 'green': ramp(160, 0.075, lift=-0.06),
    'blue': ramp(250, 0.09, lift=-0.06), 'silver': ramp(240, 0.012, lift=-0.04), 'shingle': ramp(44, 0.05, lift=-0.08),
    'stone': ramp(76, 0.04, lift=-0.03), 'whitewash': RAMPS['whitewash'], 'brick': ramp(40, 0.1, lift=-0.04),
    'tufa': ramp(26, 0.055, lift=-0.06), 'basalt': ramp(265, 0.02, lift=-0.12), 'gsand': ramp(76, 0.06, lift=-0.05),
    'thatch': RAMPS['thatch'],
}
fm.glazes()


# ------------------------------------------------------------------ walls

def wall(c, kind, x, y, w, h, seed=0):
    r = TONE.get(kind)
    if kind == 'cloisonne':
        st, br = TONE['byz-stone'], TONE['byz-brick']
        for yy in range(y, y + h):
            ly = (yy - y) % 10
            for xx in range(x, x + w):
                if ly >= 7:
                    col = br[2] if ly == 7 else br[3] if ly == 8 else br[4]
                else:
                    row = (yy - y) // 10
                    lx = (xx - x + (row % 2) * 7) % 15
                    if lx >= 13:
                        col = br[3] if lx == 13 else br[4]
                    else:
                        col = st[1] if ly == 0 else st[2] if lx < 6 else st[3] if ly < 6 else st[4]
                c.p(xx, yy, col)
    elif kind == 'banded':
        st, br = TONE['gsand'], TONE['byz-brick']
        for yy in range(y, y + h):
            ly = (yy - y) % 9
            for xx in range(x, x + w):
                if ly >= 6:
                    col = br[2] if ly == 6 else br[3] if ly == 7 else br[5]
                else:
                    lx = (xx - x + ((yy - y) // 9 % 2) * 9) % 18
                    col = st[4] if lx == 17 else st[1] if ly == 0 else st[2] if lx < 8 else st[3]
                c.p(xx, yy, col)
    elif kind == 'aksumite':
        st = TONE['aksum']
        fm.rubble(c, x, y, w, h, st, ramp(60, 0.03, lift=-0.02))
        for yy in range(y + 10, y + h - 4, 15):
            c.rect(x, yy, w, 4, WOOD[3]); c.rect(x, yy, w, 1, WOOD[1]); c.rect(x, yy + 4, w, 1, mix(st[5], WOOD[6], 0.5))
    elif kind in ('whitewash', 'mudwash'):
        fm.whitewash(c, x, y, w, h, TONE['whitewash'], TONE['mud'] if kind == 'mudwash' else None)
    elif kind in ('plaster',):
        fm.render(c, x, y, w, h, TONE['whitewash'])
    elif kind == 'red':
        fm.render(c, x, y, w, h, TONE['red'])
    elif kind == 'athos-red':
        fm.render(c, x, y, w, h, TONE['athos-red'])
    elif kind == 'logs':
        fm.logs(c, x, y, w, h, TONE['logs'], 6)
    elif kind == 'mud':
        fm.adobe(c, x, y, w, h, TONE['mud'])
    elif kind == 'nubian':
        fm.brick(c, x, y, w, h, TONE['nubian'])
    elif kind in ('athos', 'granite'):
        fm.rubble(c, x, y, w, h, r, ramp(70, 0.02, lift=0.0))
    else:
        fm.ashlar(c, x, y, w, h, r, 8, 17)


def trim_of(kind):
    return {'cloisonne': TONE['byz-stone'], 'banded': TONE['gsand'], 'red': TONE['whitewash'],
            'logs': TONE['logs'], 'mudwash': TONE['whitewash'], 'plaster': TONE['whitewash'],
            'athos-red': TONE['athos'], 'aksumite': TONE['aksum']}.get(kind, TONE.get(kind, TONE['whitewash']))


def win(c, cx, top, w, h, frame, shape='round'):
    """A small arched window: the frame lit upper left, the dark within."""
    x0 = cx - w // 2
    test = fp.SHAPES[shape]
    spring = top + fp.apex(shape, w)
    for yy in range(top - 2, top + h + 2):
        for xx in range(x0 - 2, x0 + w + 2):
            if test(xx, yy, x0 - 2, spring, w + 4) and not test(xx, yy, x0, spring, w):
                c.p(xx, yy, frame[1] if xx < cx else frame[3])
    for yy in range(top, top + h):
        for xx in range(x0, x0 + w):
            if test(xx, yy, x0, spring, w):
                c.p(xx, yy, mix(VOID, frame[6], 0.3) if xx < x0 + 2 or yy < spring else VOID)
    c.rect(x0 - 2, top + h, w + 4, 1, frame[0])
    fp.cast_down(c, x0 - 1, x0 + w + 2, top + h + 1, 2, 0.3)


def cross_win(c, cx, cy, frame):
    """A cross pierced through the wall, as at Lalibela."""
    for dx, dy, ww, hh in ((-1, -7, 3, 15), (-6, -2, 13, 4)):
        c.rect(cx + dx - 1, cy + dy - 1, ww + 2, hh + 2, frame[1])
    for dx, dy, ww, hh in ((-1, -7, 3, 15), (-6, -2, 13, 4)):
        c.rect(cx + dx, cy + dy, ww, hh, VOID)


def ocross(c, x, y, metal=GOLD, h=14):
    """The Orthodox cross on a dome: a short title bar, the arms, the slanted
    foot-bar."""
    c.rect(x, y - h, 1, h, metal[2]); c.rect(x + 1, y - h, 1, h, metal[4])
    c.rect(x - 2, y - h + 2, 5, 1, metal[1])
    c.rect(x - 4, y - h + 5, 9, 1, metal[1]); c.rect(x - 4, y - h + 6, 9, 1, metal[4])
    for k in range(-3, 4):
        c.p(x + k, y - h + 10 - k // 2, metal[2])


def lcross(c, x, y, metal=GOLD, h=11):
    c.rect(x, y - h, 2, h, metal[2]); c.rect(x + 1, y - h, 1, h, metal[4])
    c.rect(x - 3, y - h + 3, 8, 2, metal[1]); c.rect(x - 3, y - h + 4, 8, 1, metal[3])


# ------------------------------------------------------------------ domes and towers

def dome_top(kind, R):
    return {'hemi': R, 'pointed': R * 1.25, 'onion': R * 1.5, 'helmet': R * 1.2, 'beehive': R * 1.05}.get(kind, R)


def cupola(c, cx, by, d, trim, seed=0):
    """A dome on its drum. d: R, drum, kind, metal, windows, ribs, faces."""
    R, dh = d['R'], d.get('drum', 0)
    kind, metal = d.get('kind', 'hemi'), METAL[d.get('metal', 'lead')]
    if dh:
        dr = d.get('dr', R + 2 if kind == 'hemi' else R - 1 if kind == 'onion' else R)
        dk = TONE.get(d.get('drum_tone', ''), trim)
        so.lathe(c, cx, by, [(0, dr), (dh, dr)], dk, ribs=d.get('faces', 0))
        nwin = d.get('windows', 0)
        for k in range(nwin):
            a = math.pi * (0.2 + 0.6 * (k + 0.5) / nwin)
            wx = cx - round(dr * 0.86 * math.cos(a))
            wh = min(14, dh - 8)
            win(c, wx, by - dh + 4, 3 if dr < 14 else 4, wh, dk)
        top = by - dh
        if d.get('scallop'):
            for xx in range(cx - dr, cx + dr + 1):
                u = (xx - cx + dr) % 7
                yy = top + round(dr * K * math.sqrt(max(0, 1 - ((xx - cx) / (dr + 0.5)) ** 2))) - 1
                c.p(xx, yy - (1 if u in (2, 3, 4) else 0), dk[1] if u in (2, 3, 4) else dk[4])
                c.p(xx, yy + 1, dk[5])
        so.lathe(c, cx, by, [(dh - 1, dr + 1.5), (dh + 1, dr + 1.5)], dk, rim=False)
    if kind == 'helmet':
        prof = [(dh + 1 + t / 16 * R * 1.2, R * math.cos(t / 16 * math.pi / 2) ** 0.75) for t in range(17)]
        so.lathe(c, cx, by, prof, metal, ribs=d.get('ribs', 0))
    elif kind == 'cone':
        so.lathe(c, cx, by, [(dh, R + 2), (dh + 2, R + 2), (dh + R * 1.5, 0.6)], metal, ribs=d.get('ribs', 12))
    elif kind == 'tent':
        so.lathe(c, cx, by, [(dh, R + 2), (dh + 3, R + 1.5), (dh + R * 2.6, 1)], metal, ribs=8, courses=6)
    else:
        so.dome(c, cx, by, R, metal, z0=dh + 1, kind=kind, courses=d.get('courses', 4 if kind == 'hemi' else 0),
                ribs=d.get('ribs', 0))
    if d.get('stars'):
        for k in range(9):
            sx = cx - R // 2 + round(h2(k, 1, seed) * R)
            sy = by - dh - round(dome_top(kind, R) * (0.3 + 0.5 * h2(k, 2, seed)))
            c.p(sx, sy, GOLD[0])
    tip = by - dh - 1 - round(dome_top(kind, R if kind != 'cone' else R * 1.25))
    if kind == 'tent':
        tip = by - dh - round(R * 2.6)
    if d.get('onion_cap'):
        oc = METAL[d.get('cap_metal', d.get('metal', 'lead'))]
        so.lathe(c, cx, tip + 4, [(0, 1.5), (3, 1.5)], oc)
        so.dome(c, cx, tip + 1, d['onion_cap'], oc, kind='onion', courses=0)
        tip -= round(d['onion_cap'] * 1.5) + 1
    cr = d.get('cross', 'orthodox')
    if cr == 'orthodox':
        ocross(c, cx, tip + 1)
    elif cr == 'latin':
        lcross(c, cx, tip + 1, METAL['stone'] if d.get('metal') in ('stone', 'tufa', 'basalt', 'gsand') else GOLD)
    elif cr == 'eggs':
        c.rect(cx, tip - 18, 1, 19, GOLD[3])
        for k in range(3):
            so.sphere(c, cx, tip - 2 - k * 5, 0, 2.2, RAMPS['whitewash'])
        lcross(c, cx, tip - 16, GOLD, 9)
    return tip


def zakomary(c, x0, x1, eave, n, wall_kind, cap, tall=None, keel=False, seed=0):
    """Round-headed gable ends along the wall head, each capped in metal;
    `tall` raises one, `keel` points them into kokoshniki."""
    bw = (x1 - x0) / n
    tr = trim_of(wall_kind)
    for i in range(n):
        a, b = round(x0 + i * bw), round(x0 + (i + 1) * bw)
        w = b - a
        rise = w // 2 if not keel else round(w * 0.75)
        if tall is not None and i == tall:
            rise = round(rise * 1.45)
        mask = []
        for yy in range(eave - rise - 4, eave):
            for xx in range(a, b):
                t = (xx - a + 0.5) / w * 2 - 1
                prof = math.sqrt(max(0, 1 - t * t)) if not keel else min(1.0, (1 - abs(t)) * 1.2) ** 0.8
                if keel and abs(t) < 0.12:
                    prof += 0.12 * (1 - abs(t) / 0.12)
                top = eave - prof * rise
                if yy >= top:
                    mask.append((xx, yy, top))
        tmp = C(w, rise + 4)
        wall(tmp, wall_kind, 0, 0, w, rise + 4, seed + i)
        for xx, yy, _ in mask:
            c.p(xx, yy, tmp.g(xx - a, yy - (eave - rise - 4)))
        for xx, yy, top in mask:
            d = yy - top
            if d < 4:
                c.p(xx, yy, cap[1 if d < 1 else 2 if xx < (a + b) // 2 else 4] if d < 3 else cap[5])
            elif d < 6 and keel:
                c.p(xx, yy, tr[1] if d == 4 else tr[3])
        if keel and rise > 14:
            win(c, (a + b) // 2, eave - rise // 2 - 2, 5, rise // 2 - 2, tr)
    return eave


def roof_strip(c, cx, w, eave, back, cover):
    """The roof of a cross arm running back from its gable, tiles in courses
    running up the screen, lit on the left half."""
    r = METAL[cover]
    for yy in range(eave - back, eave):
        for xx in range(cx - w // 2, cx + w // 2):
            lx = (xx - cx + w // 2) % 6
            q = 2 if xx < cx else 4
            if lx == 5:
                q += 1
            if (eave - yy) % 7 == 0:
                q += 1
            c.p(xx, yy, r[min(7, q)])


def arched_gable(c, cx, eave, w, wall_kind, cap, inner='tribelon', seed=0):
    zakomary(c, cx - w // 2, cx + w // 2, eave, 1, wall_kind, cap, seed=seed)
    tr = trim_of(wall_kind)
    r = w // 2
    if inner == 'tribelon':
        for k, dx in enumerate((-9, 0, 9)):
            win(c, cx + dx, eave - r // 2 - (4 if dx == 0 else 0), 5, r // 2 + (4 if dx == 0 else 0), tr)
    elif inner == 'rosette':
        so.ellipse(c, cx, eave - r // 2, 6, 6, tr[1])
        so.ellipse(c, cx, eave - r // 2, 4, 4, VOID)
        for a in range(0, 360, 45):
            c.p(cx + round(3 * math.cos(math.radians(a))), eave - r // 2 + round(3 * math.sin(math.radians(a))), tr[2])


def tri_gable(c, cx, eave, w, rise, wall_kind, cap, seed=0):
    """A steep stone gable, its slabs coping the rakes, a cross carved in it."""
    tr = trim_of(wall_kind)
    tmp = C(w, rise)
    wall(tmp, wall_kind, 0, 0, w, rise, seed)
    for yy in range(eave - rise - 4, eave):
        half = (yy - (eave - rise)) / rise * (w / 2)
        for xx in range(cx - w // 2 - 3, cx + w // 2 + 3):
            d = half - abs(xx + 0.5 - cx)
            if d < -3:
                continue
            if d < 0:
                c.p(xx, yy, cap[1 if xx < cx else 4] if d > -2 else cap[5])
            elif d < 1:
                c.p(xx, yy, cap[3])
            else:
                c.p(xx, yy, tmp.g(xx - (cx - w // 2), yy - (eave - rise)))
    cy = eave - rise // 2 + 2
    for dx, dy, ww, hh in ((-1, -8, 3, 16), (-6, -3, 13, 3)):
        c.rect(cx + dx, cy + dy, ww, hh, tr[1])
        c.rect(cx + dx + 1, cy + dy + hh, ww, 1, tr[4])


def bell_gable(c, x, eave, w, wall_kind):
    """An open bell gable on the wall head: one arch, its bell, a cross."""
    tr = trim_of(wall_kind)
    h = 30
    wall(c, wall_kind, x, eave - h, w, h + 2)
    for yy in range(eave - h - 6, eave - h):
        half = (yy - (eave - h - 6)) / 6 * (w / 2)
        for xx in range(x, x + w):
            if abs(xx + 0.5 - x - w / 2) <= half:
                c.p(xx, yy, tr[1] if xx < x + w // 2 else tr[3])
    win(c, x + w // 2, eave - h + 5, w - 10, 18, tr)
    so.lathe(c, x + w // 2, eave - h + 19, [(0, 4), (4, 3.5), (8, 1.5)], GOLD)
    lcross(c, x + w // 2 - 1, eave - h - 6, tr)


def bell_tower(c, cx, base, w, h, wall_kind, roof, seed=0, onion=None, top='tent'):
    """A square bell tower: shaft, an open belfry stage, a tent or pyramid
    roof, an onion and a cross."""
    tr = trim_of(wall_kind)
    x = cx - w // 2
    wall(c, wall_kind, x, base - h, w, h, seed)
    fp.lesene(c, x, base - h, base, tr, 3); fp.lesene(c, x + w - 3, base - h, base, tr, 3)
    by = base - h
    stage = 26
    wall(c, wall_kind, x + 2, by - stage, w - 4, stage, seed + 1)
    for k in range(2):
        win(c, x + 6 + k * (w - 12) // 2 + (w - 16) // 4, by - stage + 5, (w - 16) // 2 - 2, 17, tr)
        so.lathe(c, x + 6 + k * (w - 12) // 2 + (w - 16) // 4, by - stage + 17, [(0, 3), (3, 2.6), (6, 1)], GOLD)
    fp.string_course(c, x, by - 2, w, tr)
    fp.string_course(c, x + 1, by - stage - 2, w - 2, tr)
    rr = METAL[roof]
    foot = by - stage - 1
    if top == 'tent':
        so.lathe(c, cx, foot + round(w / 2 * K), [(0, w / 2 + 1), (w * 1.3, 0.8)], rr, ribs=8, courses=7)
        tip = foot + round(w / 2 * K) - round(w * 1.3)
    else:
        so.lathe(c, cx, foot + round(w / 2 * K), [(0, w / 2 + 1), (w * 0.55, 0.8)], rr, ribs=4)
        tip = foot + round(w / 2 * K) - round(w * 0.55)
    if onion:
        so.dome(c, cx, tip + 3, onion, METAL['gold'], kind='onion', courses=0)
        tip -= round(onion * 1.5)
    ocross(c, cx, tip + 1)


# ------------------------------------------------------------------ the church

def draw_church(c, x0, base, s):
    """One church front: wall, its head (cross gables, zakomary, kokoshniki,
    eaves, parapet), domes behind, door and windows, porch and bells. Returns
    (door_x, door_h)."""
    W, wh, wk = s['W'], s['wall_h'], s['wall']
    tr = trim_of(wk)
    cap = METAL[s.get('cap', 'lead')]
    cx = x0 + W // 2
    eave = base - wh
    top = s.get('top', 'eave')
    seed = s.get('seed', 0)
    if top in ('eave', 'klet'):
        cover = s.get('cover', 'plain')
        fp.roof_band(c, x0 - 5, x0 + W + 5, eave, s.get('rise', 28), cover, METAL.get(s.get('tone')) or fp.tone_for(cover, s.get('tone')),
                     hip=s.get('hip', 0.0))
    elif top in ('cross', 'tri'):
        side = s.get('rise', 18)
        cover = s.get('cover', 'plain')
        fp.roof_band(c, x0 - 4, x0 + W + 4, eave, side, cover, fp.tone_for(cover, s.get('tone')), hip=0.5)
        if top == 'cross':
            gw = s.get('gable_w', min(W // 2, 70))
            roof_strip(c, cx, gw - 14, eave - gw // 2 + 2, s.get('strip', 10), s.get('cap', 'tile'))
    elif top in ('zakomary', 'trefoil', 'kokoshnik'):
        fp.roof_band(c, x0 + 2, x0 + W - 2, eave - 6, s.get('rise', 30), 'lead', cap, hip=0.25)
    elif top in ('flat', 'cavetto'):
        rt = TONE.get(s.get('roof_tone', ''), tr)
        back = s.get('back', 30)
        c.rect(x0, eave - back, W, back, rt[2])
        for yy in range(eave - back, eave, 6):
            c.rect(x0, yy, W, 1, rt[3])
        c.rect(x0, eave - back, W, 1, rt[1])
    # domes behind the wall head, farthest first
    for d in sorted(s.get('domes', []), key=lambda d: -d.get('back', 14)):
        cupola(c, cx + d.get('dx', 0), eave - d.get('back', 14) - d.get('z', 0), d, tr, seed)
    if s.get('tower') and s['tower'].get('behind'):
        t = s['tower']
        bell_tower(c, cx + t['dx'], eave - t.get('back', 10), t['w'], t['h'], wk, t.get('roof', 'green'), seed,
                   t.get('onion'), t.get('top', 'tent'))
    wall(c, wk, x0, eave, W, wh, seed)
    if top == 'cross':
        gw = s.get('gable_w', min(W // 2, 70))
        arched_gable(c, cx, eave, gw, wk, cap, s.get('gable_inner', 'tribelon'), seed)
        for side in (-1, 1):
            if s.get('side_gables'):
                arched_gable(c, cx + side * (gw // 2 + s['side_gables'] // 2), eave, s['side_gables'], wk, cap,
                             'none', seed + 3)
    elif top == 'tri':
        gw = s.get('gable_w', W // 2)
        tri_gable(c, cx, eave, gw, round(gw * 0.5), wk, cap, seed)
    elif top == 'zakomary':
        zakomary(c, x0, x0 + W, eave, s.get('bays', 3), wk, cap, seed=seed)
    elif top == 'trefoil':
        zakomary(c, x0, x0 + W, eave, 3, wk, cap, tall=1, seed=seed)
    elif top == 'kokoshnik':
        n = s.get('bays', 3)
        zakomary(c, x0 + W // 6, x0 + W - W // 6, eave - 18, max(1, n - 1), wk, cap, keel=True, seed=seed + 5)
        zakomary(c, x0, x0 + W, eave, n, wk, cap, keel=True, seed=seed)
    elif top == 'flat':
        fp.parapet(c, x0, eave, W, tr, 'plain')
    elif top == 'cavetto':
        for k in range(8):
            out = round(k * k / 12)
            c.rect(x0 - out, eave - 8 + k, W + 2 * out, 1, tr[(1, 1, 2, 2, 3, 3, 4, 2)[k]])
        c.rect(x0 - 6, eave - 10, W + 12, 2, tr[0])
        fp.cast_down(c, x0, x0 + W, eave, 4, 0.4)
    # pilasters and courses
    n = s.get('pilasters', 0)
    if n:
        for i in range(n + 1):
            px = round(x0 + i * (W - 5) / n)
            fp.lesene(c, px, eave + 2, base - 4, tr, 5)
    if s.get('arcade_band'):
        y = eave + wh // 2 - 6
        fp.string_course(c, x0, y + 9, W, tr)
        for xx in range(x0 + 6, x0 + W - 6, 8):
            for a in range(0, 181, 20):
                t = math.radians(a)
                c.p(xx + 3 + round(math.cos(t) * 3), y + 3 - round(math.sin(t) * 3), tr[4])
            c.rect(xx, y + 3, 1, 6, tr[1]); c.rect(xx + 1, y + 3, 1, 6, tr[4])
    if s.get('dentils'):
        for y in (eave + 3, base - wh // 3):
            for xx in range(x0, x0 + W):
                c.p(xx, y, tr[1] if (xx // 2) % 2 else TONE['byz-brick'][5])
                c.p(xx, y + 1, TONE['byz-brick'][3] if (xx // 2) % 2 else TONE['byz-brick'][5])
    if s.get('rosettes'):
        for k, rx in enumerate((x0 + W // 4, x0 + 3 * W // 4)):
            ry = eave + 14
            so.ellipse(c, rx, ry, 6, 6, tr[1])
            for a in range(0, 360, 30):
                c.p(rx + round(4 * math.cos(math.radians(a))), ry + round(4 * math.sin(math.radians(a))), TONE['byz-brick'][3])
            c.rect(rx - 1, ry - 1, 2, 2, TONE['byz-brick'][4])
    # windows
    wsh = s.get('win_shape', 'round')
    nw = s.get('windows', 2)
    wh_ = s.get('win_h', 22)
    wy = eave + max(8, (wh - wh_ - 44) // 2 + 6) if wh > 70 else eave + 8
    for i in range(nw):
        wx = round(x0 + W * (i + 0.5) / nw)
        if abs(wx - cx) < 22:
            continue
        if s.get('frames') == 'aksumite':
            aks_frame(c, wx, wy, 10, wh_)
        win(c, wx, wy, s.get('win_w', 7), wh_, tr, wsh)
        if s.get('nalichnik'):
            x1 = wx - 6
            for k in range(6):
                c.rect(x1 + k, wy - 4 - k // 2, 12 - 2 * k, 1, tr[1] if k < 5 else tr[2])
            c.rect(x1 - 1, wy - 3, 14, 1, tr[3])
            c.rect(x1, wy + wh_ + 2, 12, 2, tr[1])
    if s.get('cross_windows'):
        for wx in (x0 + W // 5, x0 + 4 * W // 5):
            cross_win(c, wx, eave + 18, tr)
    # porch, door
    door_w, door_h = 22, s.get('door_h', 44)
    if s.get('porch'):
        p = s['porch']
        pw, ph = p['w'], p['h']
        px = cx - pw // 2
        fp.roof_band(c, px - 4, px + pw + 4, base - ph, p.get('rise', 14), p.get('cover', 'plain'),
                     fp.tone_for(p.get('cover', 'plain'), p.get('tone')), hip=0.4)
        wall(c, wk, px, base - ph, pw, ph, seed + 9)
        bays = p.get('bays', 3)
        bw = pw // bays
        for i in range(bays):
            bx = px + i * bw + bw // 2
            if bx == cx or abs(bx - cx) < bw // 2:
                continue
            win(c, bx, base - ph + 10, bw - 10, ph - 12, tr)
    if s.get('frames') == 'aksumite':
        aks_frame(c, cx, base - door_h, door_w + 4, door_h)
    arch_door(c, cx, base, door_w, door_h, tr, s.get('door', 'round'), band=3)
    if s.get('icon', True) and not s.get('porch'):
        y = base - door_h - 14
        if y > eave + 4:
            c.rect(cx - 6, y, 12, 10, tr[1])
            c.rect(cx - 5, y + 1, 10, 8, GOLD[3]); c.rect(cx - 3, y + 2, 6, 6, ramp(30, 0.1, lift=-0.1)[3])
            so.ellipse(c, cx, y + 4, 2, 2, GOLD[1])
    if s.get('bell_gable'):
        side = s['bell_gable']
        bell_gable(c, x0 + 6 if side < 0 else x0 + W - 30, eave + 2, 24, wk)
    if s.get('tower') and not s['tower'].get('behind'):
        t = s['tower']
        bell_tower(c, cx + t['dx'], base, t['w'], t['h'], wk, t.get('roof', 'green'), seed, t.get('onion'),
                   t.get('top', 'tent'))
    fp.plinth(c, x0, base - 6, W, tr) if s.get('plinth', True) else None
    return cx, door_h


def aks_frame(c, cx, top, w, h):
    """An Aksumite timber frame: its corner beams' square ends, the 'monkey
    heads', standing proud of the wall."""
    x0 = cx - w // 2 - 4
    for xx in (x0, x0 + w + 4):
        c.rect(xx, top - 4, 4, h + 6, WOOD[3]); c.rect(xx, top - 4, 1, h + 6, WOOD[1])
    for yy in (top - 4, top + h - 1):
        c.rect(x0, yy, w + 8, 4, WOOD[3]); c.rect(x0, yy, w + 8, 1, WOOD[1])
    for xx in (x0 - 3, x0 + w + 6):
        for yy in (top - 5, top + h - 2):
            c.rect(xx, yy, 5, 5, WOOD[2]); c.rect(xx + 1, yy + 1, 3, 3, WOOD[4]); c.p(xx, yy, WOOD[0])


def canvas(W, head, extra=60):
    """A canvas tall enough for the head; trimmed to its content at the end."""
    H = head + 40
    c = C(W + extra, H)
    return c, extra // 2, H - 4


def done(c, info, x0, W, base, door_x, door_h, depth, **extra):
    im = complete(c, info, x0, W, base + 1, door_x, door_h, depth, **extra)
    box = im.getbbox()
    if box and box[1] > 0:
        im = im.crop((0, box[1], im.width, im.height))
        if info is not None:
            info['base'] -= box[1]
    return im


def church(spec=None, info=None):
    s = dict(spec or {})
    W = s['W']
    c, x0, base = canvas(W, s.get('head', 300))
    if s.get('ground'):
        so.box(c, x0 - 6, base + 1, W + 12, 4, 12, TONE['athos'] if s['ground'] == 'stone' else TONE['byz-stone'])
    dx, dh = draw_church(c, x0, base - (3 if s.get('ground') else 0), s)
    ground_shadow(c, x0, x0 + W, base + 1, 2, 0.2)
    return done(c, info, x0, W, base, dx, dh, s.get('depth', 140))


# ------------------------------------------------------------------ special forms

def kizhi(spec=None, info=None):
    """A log church whose octagons rise in tiers, every roof crowned with
    aspen-shingle onions: Kizhi's Transfiguration church."""
    s = dict(spec or {})
    W = s['W']
    c, x0, base = canvas(W, 320)
    cx = x0 + W // 2
    logs = TONE['logs']
    sil = METAL['silver']
    wh = 64
    eave = base - wh
    fp.roof_band(c, x0 - 4, x0 + W + 4, eave, 26, 'shingle', sil, hip=0.5)
    tiers = [(W * 0.36, 34, 0), (W * 0.27, 30, 1), (W * 0.18, 26, 2)]
    by = eave - 16
    onions = []
    for i, (hw, th, k) in enumerate(tiers):
        so.lathe(c, cx, by, [(0, hw), (th, hw)], logs, ribs=8, courses=7)
        so.lathe(c, cx, by, [(th, hw + 4), (th + 3, hw + 3), (th + 9, hw * 0.6)], sil, ribs=8)
        for a in (-0.8, 0.8, -0.45, 0.45):
            onions.append((cx + round(a * hw), by - th - 4 + (4 if abs(a) > 0.7 else 0), 7 - k))
        by -= th + 10
    onions.sort(key=lambda o: o[1])
    so.lathe(c, cx, by + 10, [(0, 6), (12, 6)], logs)
    tip = None
    for ox, oy, R in onions:
        so.lathe(c, ox, oy + 2, [(0, R * 0.55), (6, R * 0.55)], logs)
        so.dome(c, ox, oy - 4, R, sil, kind='onion', courses=0)
        ocross(c, ox, oy - 4 - round(R * 1.5))
    so.dome(c, cx, by - 2, 11, sil, kind='onion', courses=0)
    ocross(c, cx, by - 2 - 16 - 1)
    wall(c, 'logs', x0, eave, W, wh)
    for k in range(4):
        wx = x0 + 18 + k * (W - 36) // 3
        if abs(wx - cx) > 20:
            win(c, wx, eave + 14, 7, 16, logs, 'square')
    arch_door(c, cx, base, 22, 44, logs, 'square')
    fp.roof_band(c, cx - 22, cx + 22, base - 50, 12, 'shingle', sil, hip=0.5)
    return done(c, info, x0, W, base, cx, 44, s.get('depth', 170))


def cyl(c, cx, cy, R, H, r, top=None):
    """A drum square to us, quick: its face shaded by the turn of the wall,
    its top an ellipse seen from above. cy is the foot's centre row."""
    top = top or r
    for x in range(-R, R + 1):
        u = x / (R + 0.5)
        f = math.sqrt(max(0.0, 1 - u * u))
        yb = cy + round(f * R * K)
        yt = cy - H + round(f * R * K)
        q = so.tone((u, -f, 0.0))
        for yy in range(yt, yb + 1):
            c.p(cx + x, yy, r[q])
        for yy in range(cy - H - round(f * R * K), yt):
            c.p(cx + x, yy, top[2 if u < 0.3 else 3])


def thatch_cone(c, cx, foot, R, H, r, seed=0):
    """A conical thatched roof: courses round it, strands down it, lit on the
    left. `foot` is the row of its eave ellipse's centre."""
    apex = foot - H
    for yy in range(apex, foot + round(R * K) + 1):
        t = (yy - apex) / H
        hw = R * min(1.0, t)
        if t > 1:
            hw = R * math.sqrt(max(0.0, 1 - ((yy - foot) / (R * K)) ** 2))
        for xx in range(round(cx - hw), round(cx + hw) + 1):
            u = (xx - cx) / max(1.0, hw)
            q = 2 if u < -0.45 else 3 if u < 0.25 else 4 if u < 0.7 else 5
            if (yy - apex) % 8 == 7:
                q += 1
            elif (yy - apex) % 8 == 0:
                q -= 1
            elif h2(xx // 2, (yy - apex) // 8, seed) < 0.18:
                q += 1
            c.p(xx, yy, r[max(0, min(7, q))])
    for xx in range(round(cx - R), round(cx + R) + 1):
        u = (xx - cx) / R
        yy = foot + round(math.sqrt(max(0.0, 1 - u * u)) * R * K)
        for k, q in enumerate((5, 6)):
            c.p(xx, yy + 1 + k, r[q])


def round_church(spec=None, info=None):
    """The Ethiopian round church: a whitewashed drum within a ring of posts
    under one great thatched cone, a brass cross with ostrich eggs on top."""
    s = dict(spec or {})
    W = s['W']
    Rr = W // 2 - 6
    R = Rr - s.get('veranda', 16)
    wh = s.get('wall_h', 50)
    c, x0, base = canvas(W, 260, 40)
    cx = x0 + W // 2
    cy = base - round((Rr + 4) * K) - 1
    stone = TONE['athos']
    cyl(c, cx, cy, Rr + 4, 5, stone)
    wr = TONE['whitewash'] if s.get('wash', True) else TONE['mud']
    cyl(c, cx, cy - 5, R, wh, wr)
    front = cy - 5 + round(R * K)
    door_h = 42
    for yy in range(front - door_h, front):
        for xx in range(cx - 10, cx + 10):
            c.p(xx, yy, WOOD[3 if (xx - cx) % 5 else 5] if xx not in (cx - 1, cx) else WOOD[6])
    c.rect(cx - 13, front - door_h - 3, 26, 3, WOOD[1]); c.rect(cx - 13, front - door_h, 3, door_h, WOOD[2])
    c.rect(cx + 10, front - door_h, 3, door_h, WOOD[4])
    for wx in (cx - R // 2 - 6, cx + R // 2 + 2):
        c.rect(wx - 1, front - wh + 9, 7, 12, WOOD[2]); c.rect(wx, front - wh + 10, 5, 10, VOID)
    th = METAL['thatch']
    H = s.get('roof_h', round(Rr * 1.1))
    foot = cy - 5 - wh + 4
    # the veranda's shade under the eave
    for yy in range(foot, front + 2):
        for xx in range(cx - Rr, cx + Rr):
            q = c.g(xx, yy)
            if q[3]:
                c.p(xx, yy, mix(q, (40, 30, 70, 255), 0.2 if yy < foot + 14 else 0.08))
    thatch_cone(c, cx, foot, Rr + 3, H, th, s.get('seed', 3))
    eave = foot + round((Rr + 3) * K)
    for k in range(9):
        a = math.pi * (0.06 + 0.88 * k / 8)
        px = cx - round((Rr - 2) * math.cos(a))
        py = cy + round((Rr - 2) * math.sin(a) * K)
        if abs(px - cx) < 15:
            continue
        top = foot + round((Rr - 2) * math.sin(a) * K) + 2
        for yy in range(top, py + 1):
            c.p(px, yy, WOOD[2]); c.p(px + 1, yy, WOOD[3]); c.p(px + 2, yy, WOOD[5])
    tip = foot - H
    c.rect(cx, tip - 20, 1, 22, GOLD[3])
    for k in range(3):
        so.ellipse(c, cx + 0.5, tip - 3 - k * 5, 2.4, 2.2, RAMPS['whitewash'][1 if k % 2 else 2])
        c.p(cx + 1, tip - 2 - k * 5, RAMPS['whitewash'][4])
    lcross(c, cx, tip - 17, GOLD, 10)
    for k in range(5):
        c.p(cx - 4 + k * 2, tip - 20 + (k % 2), GOLD[1])
    return done(c, info, x0, W, base, cx, door_h, s.get('depth', W))


def rock_church(spec=None, info=None):
    """A church cut down into the rock at Lalibela: the trench round it, its
    carved face rising from the trench floor, its roof flush with the rock
    and carved with a cross."""
    s = dict(spec or {})
    W = s['W']
    cw = s.get('church_w', W - 56)
    c, x0, base = canvas(W, 200, 30)
    cx = x0 + W // 2
    rock = TONE['rock']
    face_h = s.get('face_h', 64)
    cd = s.get('church_d', 90)
    far = 30
    total = round((face_h / K) + cd + far + 40)
    back_y = base - round(total * K)
    # the rock round the trench, seen from above
    for yy in range(back_y, base):
        for xx in range(x0, x0 + W):
            q = 2 if h2(xx // 9, yy // 5, 7) > 0.2 else 3
            c.p(xx, yy, rock[q])
    trench_top = base - round((face_h / K + cd + far) * K)
    tx0, tx1 = cx - cw // 2 - 22, cx + cw // 2 + 22
    for yy in range(trench_top, base):
        for xx in range(tx0, tx1):
            c.p(xx, yy, rock[5] if yy < trench_top + face_h else rock[4])
    for yy in range(trench_top, base):
        for k in range(4):
            c.p(tx0 + k, yy, mix(c.g(tx0 + k, yy), (40, 30, 70, 255), 0.35 - k * 0.08))
    c.rect(tx0, trench_top - 1, tx1 - tx0, 1, rock[1])
    # the church: roof flush with the rock, face going down to the floor
    ctop = base - face_h - round(cd * K)
    fy = base - face_h
    c.rect(cx - cw // 2, ctop, cw, fy - ctop, rock[2])
    c.rect(cx - cw // 2, ctop, cw, 1, rock[1])
    arm = cw // 5
    cyy = (ctop + fy) // 2
    for (ax, ay, aw, ah) in ((cx - arm // 2, ctop + 3, arm, fy - ctop - 6), (cx - cw // 2 + 8, cyy - 3, cw - 16, 7)):
        for k in range(2):
            c.rect(ax - k, ay - k, aw + 2 * k, ah + 2 * k, rock[1] if k else rock[3]) if False else None
        c.rect(ax, ay, aw, ah, rock[1]); c.rect(ax + 1, ay + ah, aw, 1, rock[4]); c.rect(ax + aw, ay + 1, 1, ah, rock[4])
    wall(c, 'rock', cx - cw // 2, fy, cw, face_h)
    for xx in range(cx - cw // 2, cx + cw // 2):
        for yy in range(fy, base):
            if (yy - fy) % 18 == 0:
                c.p(xx, yy, rock[1])
            elif (yy - fy) % 18 == 1:
                c.p(xx, yy, rock[4])
    for wx in (cx - cw // 3, cx + cw // 3):
        aks_frame(c, wx, fy + 8, 8, 14)
        win(c, wx, fy + 8, 6, 14, rock)
    for wx in (cx - cw // 6, cx + cw // 6):
        cross_win(c, wx, fy + 14, rock)
    arch_door(c, cx, base, 20, 40, rock, 'round', band=3)
    for yy in range(fy, base):
        c.p(cx + cw // 2, yy, rock[5])
    return done(c, info, x0, W, base, cx, 40, total)


def monastery(spec=None, info=None):
    """A walled monastery: the church rising behind the enclosure wall, the
    gate through a tower in front."""
    s = dict(spec or {})
    W = s['W']
    c, x0, base = canvas(W, 320, 40)
    cx = x0 + W // 2
    wk = s['enclosure']
    tr = trim_of(wk)
    ch = dict(s['church'])
    cw = ch['W']
    gap = 64
    draw_church(c, cx - cw // 2, base - gap, ch)
    wh = s.get('wall_h', 58)
    top = base - wh
    # the wall walk seen from above, then the wall face
    c.rect(x0, top - 7, W, 7, tr[2]); c.rect(x0, top - 7, W, 1, tr[1])
    wall(c, wk, x0, top, W, wh, 3)
    fp.parapet(c, x0, top, W, tr, s.get('parapet', 'plain'))
    if s.get('balconies'):
        for bx in (x0 + 14, x0 + W - 58):
            for yy in range(top + 6, top + 26):
                for xx in range(bx, bx + 42):
                    c.p(xx, yy, WOOD[2 if (xx - bx) % 6 else 4])
            for k in range(3):
                win(c, bx + 8 + k * 13, top + 9, 6, 12, WOOD, 'square')
            c.rect(bx - 2, top + 3, 46, 3, s.get('roof_tone') and METAL[s['roof_tone']][2] or WOOD[1])
            fp.cast_down(c, bx, bx + 42, top + 26, 3, 0.4)
            for k in range(4):
                c.rect(bx + k * 13 + 1, top + 26, 2, 6, WOOD[4])
    for side in (-1, 1):
        if s.get('corner_towers'):
            tx = x0 + 4 if side < 0 else x0 + W - 30
            wall(c, wk, tx, top - 22, 26, wh + 22, 7)
            so.lathe(c, tx + 13, top - 22 + 7, [(0, 15), (30, 0.6)], METAL[s.get('tower_roof', 'green')], ribs=8)
    gw, gh = s.get('gate_w', 44), wh + s.get('gate_up', 30)
    gx = cx - gw // 2
    wall(c, wk, gx, base - gh, gw, gh, 5)
    fp.lesene(c, gx, base - gh, base, tr, 3); fp.lesene(c, gx + gw - 3, base - gh, base, tr, 3)
    gt = s.get('gate_top', 'pyramid')
    if gt == 'pyramid':
        fp.pyramid(c, gx - 2, base - gh, gw + 4, METAL[s.get('roof_tone', 'tile')], h=22)
    elif gt == 'onion':
        so.lathe(c, cx, base - gh + 3, [(0, 10), (10, 10)], tr)
        so.dome(c, cx, base - gh - 6, 10, GOLD, kind='onion', courses=0)
        ocross(c, cx, base - gh - 6 - 16)
    elif gt == 'crenel':
        fp.parapet(c, gx, base - gh, gw, tr, 'crenel')
    win(c, cx, base - gh + 8, 10, 14, tr)
    arch_door(c, cx, base, 24, 46, tr, 'round', band=4)
    fp.plinth(c, x0, base - 6, W, tr)
    return done(c, info, x0, W, base, cx, 46, s.get('depth', 220))


BUILDERS = {'church': church, 'kizhi': kizhi, 'round-church': round_church, 'rock-church': rock_church,
            'monastery': monastery}


# ------------------------------------------------------------------ specs

def _d(dx, R, drum, kind='hemi', metal='lead', back=14, **kw):
    return dict(dx=dx, R=R, drum=drum, kind=kind, metal=metal, back=back, **kw)


def byzantine(scale, look):
    W = {'small': 140, 'medium': 196, 'large': 260}[scale]
    wall_kind = ('cloisonne', 'banded', 'whitewash')[look]
    cap = ('tile', 'tile', 'tile')[look]
    s = dict(W=W, wall_h={'small': 58, 'medium': 70, 'large': 76}[scale], wall=wall_kind, cap=cap,
             cover='plain', tone='tile-red', windows=4, win_h=20, seed=11 + look, depth=W * 0.75)
    big = dict(R={'small': 14, 'medium': 20, 'large': 24}[scale], drum={'small': 30, 'medium': 34, 'large': 40}[scale],
               windows=6 if scale != 'small' else 4, scallop=look == 0, faces=8 if look < 2 else 0,
               metal='tile' if look != 1 else 'lead', back=20)
    if look == 2:
        s.update(top='eave', rise=24, windows=3, bell_gable=-1, icon=True)
        big.update(R=big['R'] - 4, drum=big['drum'] // 2, metal='tile', back=26)
        s['domes'] = [_d(0, **{k: v for k, v in big.items() if k not in ('dx',)})] if scale != 'small' else []
        if scale == 'large':
            s['porch'] = dict(w=110, h=46, bays=3)
        return s
    s.update(top='cross', gable_w={'small': 60, 'medium': 74, 'large': 84}[scale], dentils=look == 0,
             rosettes=look == 1, gable_inner='tribelon' if look == 0 else 'rosette', strip=7)
    s['domes'] = [dict(dx=0, **big)]
    if scale == 'small':
        s.update(gable_w=W - 60)
    if scale == 'large':
        for dx in (-W // 3, W // 3):
            s['domes'].insert(0, dict(dx=dx, R=13, drum=22, windows=4, faces=8, metal=big['metal'], back=34,
                                      scallop=look == 0))
        s['side_gables'] = 40
        s['porch'] = dict(w=150, h=50, bays=5, cover='plain', tone='tile-red')
    return s


def rus(scale, look):
    W = {'small': 136, 'medium': 180, 'large': 240}[scale]
    if look == 2:
        s = dict(W=W, wall_h=60, wall='logs', top='eave', cover='shingle', tone='shingle', rise=36, windows=3,
                 win_shape='square', win_h=16, door='square', plinth=False, icon=False, depth=W * 0.7)
        tent = dict(R=16 if scale != 'large' else 20, drum=22, kind='tent', metal='shingle', drum_tone='logs',
                    onion_cap=6, cap_metal='shingle', back=24, faces=8)
        s['domes'] = [dict(dx=0, **tent)]
        if scale == 'large':
            s['domes'] += [dict(dx=dx, R=7, drum=8, kind='onion', metal='shingle', drum_tone='logs', back=18)
                           for dx in (-W // 3, W // 3)]
        return s
    wall_kind = 'white-stone' if look == 0 else 'plaster'
    s = dict(W=W, wall_h={'small': 66, 'medium': 80, 'large': 86}[scale], wall=wall_kind,
             top='zakomary' if look == 0 else 'trefoil', bays=3, cap='lead' if look else 'gold',
             pilasters=3 if look == 0 else 0, arcade_band=look == 0, windows=3 if look == 0 else 2,
             win_w=5, win_h=22, depth=W * 0.8)
    metal = 'gold' if look == 0 else 'lead'
    big = dict(R={'small': 13, 'medium': 17, 'large': 19}[scale], drum={'small': 26, 'medium': 34, 'large': 38}[scale],
               kind='helmet', metal=metal, windows=4, back=22, ribs=0)
    s['domes'] = [dict(dx=0, **big)]
    if scale == 'large':
        for dx in (-W // 3, W // 3):
            s['domes'].insert(0, dict(dx=dx, R=11, drum=24, kind='helmet', metal=metal, windows=3, back=34))
    return s


def muscovite(scale, look):
    W = {'small': 140, 'medium': 190, 'large': 250}[scale]
    if look == 1:
        if scale == 'large':
            return dict(W=W, depth=W * 0.8)
        s = rus(scale, 2)
        s['domes'][0].update(metal='shingle', onion_cap=7, R=18)
        return s
    wall_kind = 'red' if look == 0 else 'whitewash'
    s = dict(W=W, wall_h={'small': 60, 'medium': 70, 'large': 74}[scale], wall=wall_kind, top='kokoshnik',
             bays=3 if scale != 'large' else 4, cap='green' if look == 0 else 'lead', windows=4, win_h=20,
             nalichnik=True, pilasters=0, depth=W * 0.8)
    onion_metal = 'gold' if look == 0 else 'blue'
    big = dict(R={'small': 12, 'medium': 16, 'large': 18}[scale], drum={'small': 20, 'medium': 26, 'large': 30}[scale],
               kind='onion', metal=onion_metal, windows=3, back=30, stars=look == 2)
    s['domes'] = [dict(dx=0, **big)]
    if scale != 'small':
        for dx in (-W // 4, W // 4):
            s['domes'].insert(0, dict(dx=dx, R=10, drum=18, kind='onion', back=40, windows=2,
                                      metal='green' if look == 0 else 'blue', stars=look == 2))
    if scale == 'large':
        s['tower'] = dict(dx=-W // 2 + 2, w=34, h=86, roof='green', onion=6, behind=look == 2, back=6)
        s['W'] = W
    elif look == 2 and scale == 'medium':
        s['tower'] = dict(dx=W // 2 + 4, w=30, h=70, roof='green', onion=5, behind=True, back=4)
    return s


def caucasian(scale, look):
    W = {'small': 132, 'medium': 176, 'large': 228}[scale]
    wall_kind = ('gsand', 'tufa', 'basalt')[look]
    cap = ('gsand', 'tufa', 'basalt')[look]
    s = dict(W=W, wall_h={'small': 60, 'medium': 74, 'large': 84}[scale], wall=wall_kind, cap=cap, top='tri',
             cover='slate', tone='stone-slate' if look != 2 else 'slate-blue', gable_w={'small': 64, 'medium': 80, 'large': 96}[scale],
             windows=4, win_w=6, win_h=22, arcade_band=look == 0, depth=W * 0.8, icon=False)
    s['domes'] = [dict(dx=0, R={'small': 13, 'medium': 17, 'large': 21}[scale], drum={'small': 42, 'medium': 56, 'large': 66}[scale],
                       kind='cone', metal=cap, drum_tone=wall_kind, windows=4, faces=12 if look == 1 else 16,
                       back=26, cross='latin', ribs=12 if look == 1 else 16)]
    return s


def monastery_spec(scale, look):
    W = {'small': 180, 'medium': 240, 'large': 300}[scale]
    if look == 0:
        ch = byzantine('medium' if scale != 'small' else 'small', 0)
        ch.update(wall='athos-red', dentils=False, W=min(ch['W'], W - 70))
        return dict(W=W, enclosure='athos', church=ch, balconies=True, gate_top='pyramid', roof_tone='tile',
                    depth=W * 0.9)
    if look == 1:
        ch = muscovite('medium' if scale == 'large' else 'small', 2)
        ch['W'] = min(ch['W'], W - 80)
        ch.pop('tower', None)
        for d in ch['domes']:
            d['metal'] = 'gold'
            d['stars'] = False
        return dict(W=W, enclosure='whitewash', church=ch, corner_towers=True, tower_roof='green', gate_top='onion',
                    gate_up=34, depth=W * 0.9)
    ch = byzantine('small', 2)
    ch.update(W=min(150, W - 60), wall='granite', bell_gable=0, top='eave', cover='lead', tone=None)
    ch['domes'] = []
    return dict(W=W, enclosure='granite', church=ch, gate_top='crenel', parapet='crenel', wall_h=70, gate_up=26,
                depth=W * 0.9)


def ethiopian(scale, look):
    W = {'small': 150, 'medium': 196, 'large': 248}[scale]
    if look == 0:
        return dict(W=W, wall_h={'small': 46, 'medium': 52, 'large': 58}[scale], veranda=16 if scale != 'small' else 12,
                    wash=scale != 'small', depth=W)
    if look == 1:
        return dict(W=W, church_w=W - 56, face_h={'small': 58, 'medium': 64, 'large': 72}[scale], church_d=round(W * 0.45))
    return dict(W=W, wall_h={'small': 62, 'medium': 72, 'large': 80}[scale], wall='aksumite', top='eave',
                cover='thatch', tone='straw-old', rise=30, windows=4, win_shape='square', win_w=7, win_h=14,
                frames='aksumite', door='square', icon=False, depth=W * 0.7,
                domes=[] if scale != 'large' else [dict(dx=0, R=0.1, drum=0, kind='hemi', cross='eggs', back=30)])


def coptic(scale, look):
    W = {'small': 140, 'medium': 192, 'large': 250}[scale]
    if look == 0:
        s = dict(W=W, wall_h={'small': 58, 'medium': 64, 'large': 70}[scale], wall='mudwash', top='flat', back=26,
                 roof_tone='whitewash', windows=4, win_w=5, win_h=14, depth=W * 0.75)
        n = {'small': 2, 'medium': 3, 'large': 4}[scale]
        s['domes'] = [dict(dx=round((i - (n - 1) / 2) * (W - 40) / n), R=11 if i in (0, n - 1) else 13, drum=0,
                           metal='whitewash', drum_tone='whitewash', back=back, cross='latin', courses=0)
                      for back in (28, 12) for i in range(n)]
        if scale != 'small':
            s['tower'] = dict(dx=-W // 2 + 18, w=30, h=72, roof='whitewash', top='pyramid', behind=True, back=4)
        return s
    if look == 1:
        s = dict(W=W, wall_h={'small': 56, 'medium': 64, 'large': 70}[scale], wall='nubian', top='flat', back=22,
                 roof_tone='nubian', windows=3, win_w=6, win_h=16, depth=W * 0.75)
        s['domes'] = [dict(dx=0, R={'small': 18, 'medium': 24, 'large': 28}[scale], drum=8, metal='brick',
                           drum_tone='nubian', back=22, cross='latin', courses=3, kind='beehive')]
        if scale != 'small':
            s['domes'] += [dict(dx=dx, R=12, drum=4, metal='brick', drum_tone='nubian', back=14, cross='none',
                                kind='beehive', courses=3) for dx in (-W // 3, W // 3)]
        return s
    return dict(W=W, wall_h={'small': 66, 'medium': 80, 'large': 92}[scale], wall='egypt', top='cavetto', back=30,
                roof_tone='egypt', windows=5, win_w=6, win_h=14, win_shape='square', depth=W * 0.75, icon=False,
                domes=[])


LABELS = {
    'byzantine-church': ('Chapel', 'Church', 'Cathedral'),
    'rus-church': ('Church', 'Church', 'Cathedral'),
    'muscovite-church': ('Church', 'Church', 'Cathedral'),
    'caucasian-church': ('Church', 'Church', 'Cathedral'),
    'orthodox-monastery': ('Skete', 'Monastery', 'Lavra'),
    'ethiopian-church': ('Church', 'Church', 'Cathedral'),
    'coptic-church': ('Church', 'Church', 'Cathedral'),
}
ABOUT = {
    'byzantine-church': 'An Orthodox church under a dome on a drum, its walls laid in bands of stone and brick.',
    'rus-church': 'An Orthodox church of the Rus, its rounded gables along the wall head and a helmet dome on its drum.',
    'muscovite-church': 'An Orthodox church of Muscovy, crowned with onion domes over tiers of pointed gables.',
    'caucasian-church': 'A Georgian or Armenian church of dressed stone, its tall drum capped by a stone cone.',
    'orthodox-monastery': 'An Orthodox monastery behind its wall, the church rising inside and the gate under a tower.',
    'ethiopian-church': 'An Ethiopian church where the tabot, the consecrated altar tablet, is kept.',
    'coptic-church': 'A Coptic or Nubian church, its sanctuary under domes behind thick walls.',
}


def _entry(recipe, scale, kind, spec):
    i = ('small', 'medium', 'large').index(scale)
    spec = dict(spec, label=LABELS[recipe][i], description=ABOUT[recipe])
    spec['depth'] = round(spec.get('depth', 140))
    return kind, spec


def _specs():
    out = {}
    fns = {'byzantine-church': byzantine, 'rus-church': rus, 'muscovite-church': muscovite,
           'caucasian-church': caucasian, 'orthodox-monastery': monastery_spec, 'ethiopian-church': ethiopian,
           'coptic-church': coptic}
    for recipe, fn in fns.items():
        out[recipe] = {}
        for scale in ('small', 'medium', 'large'):
            looks = []
            for look in range(3):
                spec = fn(scale, look)
                if recipe == 'orthodox-monastery':
                    kind = 'monastery'
                elif recipe == 'ethiopian-church':
                    kind = ('round-church', 'rock-church', 'church')[look]
                elif recipe == 'muscovite-church' and look == 1 and scale == 'large':
                    kind = 'kizhi'
                else:
                    kind = 'church'
                looks.append(_entry(recipe, scale, kind, spec))
            out[recipe][scale] = looks
    return out


SPECS = _specs()
