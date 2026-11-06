"""Mesoamerican houses front-on: thatched jacales, flat-roofed calli, and the
household granary and sweat bath.

    .venv/bin/python scripts/art/front_meso.py artifacts/meso/sheet.png [study ...]

Maya (lowlands): the na, a house with rounded ends under a steep palm-thatch
roof, its walls of daub over stone, limewashed with a red dado, on a low
stone platform; the stone house of a town, with a medial moulding, T-shaped
vents (the ik' sign) and, on the largest, a pierced roof comb. Nahua (Basin
of Mexico): square-ended jacales of cane or daub under zacate grass thatch;
flat-roofed calli of adobe, plastered, with stepped or spiral merlons and a
stepped-fret frieze; a noble house fronted by a pillared portico on a
platform and stair. Both: doorways hung with cloth or a mat, not hinged
doors; a shade ramada at one end; the cuexcomatl, a bellied clay granary
under a thatched cap; the temazcal, a domed sweat bath with its firebox.

Palettes are each profile's own, from regional-houses.json. The flat roof is
front_mudbrick's: a thick lit ledge, a shadow band under it, a deck sunk
inside parapets.
"""
from pathlib import Path
import json
import math
import random
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, h2  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402
from art.front_huts import _rgb, turn, DARK, DOORWAY  # noqa: E402
from art.front_mudbrick import deck, jar, mat, ladder, P, PAL as MB  # noqa: E402

_PROF = json.loads((ROOT / 'src/content/graphics/regional-houses.json').read_text())['profiles']
# Zapotec (Oaxaca) and Purépecha (Michoacán) palettes, used until
# regional-houses.json carries its own for them.
_PALETTES = {
    'zapotec': {
        'plaster': ['#3d3438', '#6c625e', '#9f9488', '#cdc0a8', '#e9dcc0', '#faf0da'],
        'red': ['#3a1418', '#6a1e22', '#9a2e2a', '#c4462e', '#de6e42', '#f09a66'],
        'stone': ['#2a2422', '#4a403a', '#6e6254', '#948470', '#b6a68c', '#d2c4aa'],
        'adobe': ['#3a2a24', '#624434', '#8a6446', '#ae845e', '#cca478', '#e4c296'],
        'ochre': ['#3d2a24', '#6c462e', '#9e6838', '#c88e48', '#e2b25e', '#f4d488'],
        'thatch': ['#2e2219', '#523a20', '#7e5e2a', '#aa863a', '#d0ac52', '#ecd282'],
        'thatch-old': ['#2a2420', '#4a3e30', '#6e6046', '#928462', '#b2a47e', '#cec29e'],
        'timber': ['#2a1b16', '#4a3020', '#70492c', '#98683c', '#bd8c52', '#dcb277'],
        'accent': ['#2a1430', '#4a2448', '#6e3a62', '#94567e', '#b87a9c', '#d8a6be'],
    },
    'purepecha': {
        'plaster': ['#3a3436', '#68605c', '#9a9086', '#c8bea8', '#e4dac2', '#f6eedc'],
        'red': ['#3a1418', '#6a1e22', '#9a2e2a', '#c4462e', '#de6e42', '#f09a66'],
        'stone': ['#262424', '#444040', '#666058', '#8a8274', '#aca290', '#cac0ac'],
        'adobe': ['#3a2a24', '#624434', '#8a6446', '#ae845e', '#cca478', '#e4c296'],
        'ochre': ['#3d2a24', '#6c462e', '#9e6838', '#c88e48', '#e2b25e', '#f4d488'],
        'thatch': ['#2a201a', '#4a3424', '#6e4e32', '#946c44', '#b68c5a', '#d2ac78'],
        'thatch-old': ['#262220', '#423a34', '#62584c', '#847866', '#a49882', '#c2b8a2'],
        'timber': ['#24170f', '#422a1a', '#644026', '#885a34', '#a87646', '#c6965e'],
        'accent': ['#16263a', '#24405c', '#345e7e', '#4c80a0', '#70a2be', '#a0c6da'],
    },
}
PROFILE = {p: {k: [_rgb(c) for c in v] for k, v in (_PROF.get(p, {}).get('palette') or _PALETTES[p]).items()}
           for p in ('maya', 'nahua', 'zapotec', 'purepecha')}
CLAY = MB['clay']
EARTH = MB['dung']
HW = 54
DOOR = (12, 37)


def fringe(c, x0, x1, y, pal):
    """The shade under a thatched eave: a dark band, then a row where the
    straw ends and the wall alternate."""
    for x in range(x0, x1):
        c.p(x, y, P(pal, 0)); c.p(x, y + 1, P(pal, 1))
        if x % 2:
            c.p(x, y + 2, P(pal, 1))
        q = c.g(x, y + 3)
        if q[3]:
            c.p(x, y + 3, tuple(round(q[j] * 0.88) for j in range(3)) + (255,))


def shade(c, x0, x1, y, rows=(0.6, 0.74, 0.88)):
    """Darken the rows under an overhang, where they are already painted."""
    for i, f in enumerate(rows):
        for x in range(x0, x1):
            q = c.g(x, y + i)
            if q[3]:
                c.p(x, y + i, tuple(round(q[j] * f) for j in range(3)) + (255,))


# ------------------------------------------------------------------ walls

def wall(c, x0, x1, top, base, pal, style, seed, apse=0, dado=None):
    """A wall face. `apse` rounds its ends: the columns there turn away,
    lit on the left and in shade on the right, as a curved wall does.
    Styles: daub (limewashed), cane (upright poles bound with withes),
    daub-stone (rubble below, daub above), adobe (blocks)."""
    wood = pal['timber']
    for x in range(x0, x1):
        e = 0
        if apse:
            if x - x0 < apse:
                e = -(1 - (x - x0) / apse)
            elif x1 - 1 - x < apse:
                e = 1 - (x1 - 1 - x) / apse
        for y in range(top, base + 1):
            k = 3
            if style == 'cane':
                pole = (x - x0) % 3
                k = (2, 4, 3)[pole]
                col = wood[max(0, min(5, k + (1 if e < -0.3 else -1 if e > 0.3 else 0)))]
                if h2((x - x0) // 9, (y - top) // 7, seed) > 0.8:
                    col = P(pal['adobe'], 3 if pole else 2)
                c.p(x, y, col)
                continue
            if style == 'adobe':
                course = (y - top) // 6
                if (y - top) % 6 == 5 or (x - x0 + (course % 2) * 8) % 16 == 0:
                    k = 2
            elif style == 'daub-stone' and y > top + (base - top) * 0.55:
                k = stone_at(x - x0, y - top, seed)
            elif h2((x + 2 * (y % 3)) // 3, y, seed) > 0.985:
                k = 2
            if e < -0.55:
                k += 2
            elif e < -0.15:
                k += 1
            elif e > 0.7:
                k -= 2
            elif e > 0.25:
                k -= 1
            src = pal['stone'] if style == 'daub-stone' and y > top + (base - top) * 0.55 else pal['wall']
            c.p(x, y, P(src, k))
    if style == 'cane':
        for t in (0.3, 0.68):
            y = top + round((base - top) * t)
            c.rect(x0, y, x1 - x0, 1, wood[4]); c.rect(x0, y + 1, x1 - x0, 1, wood[1])
    if dado and style != 'cane':
        for x in range(x0, x1):
            e = (x - x0 < apse and -1) or (x1 - 1 - x < apse and 1) or 0
            for y in range(base - 11, base - 4):
                k = 4 if y == base - 11 else 3
                c.p(x, y, P(dado, k + (1 if e < 0 else -1 if e > 0 else 0)))
            c.p(x, base - 2, P(pal['wall'], 1))
            if x % 4 == 1:
                c.p(x, base - 1, P(pal['wall'], 2))
    damp = pal['wall'] if style != 'cane' else wood
    for x in range(x0, x1):
        if not dado:
            for y in range(base - 2 - int(h2(x // 3, 2, seed) * 3), base + 1):
                q = c.g(x, y)
                c.p(x, y, tuple(round(q[j] * 0.84) for j in range(3)) + (255,))


def stone_at(x, y, seed):
    gx, gy = (x + (y // 5) * 4) // 8, y // 5
    if y % 5 == 4 or (x + (y // 5) * 4) % 8 == 0:
        return 1
    return 3 + (1 if h2(gx, gy, seed) > 0.6 else 0) - (1 if h2(gx, gy, seed + 1) > 0.85 else 0)


def platform(c, x0, x1, base, h, pal, stairs_at=None, seed=0, finish=None):
    """A plastered platform: its top lit in two rows, its face plain with a
    course line along it and a few worn spots; a stair cut in before the
    door, each tread lit."""
    st = finish or pal['plaster']
    for x in range(x0, x1):
        end = x1 - x < 3
        c.p(x, base - h - 2, st[5]); c.p(x, base - h - 1, st[4] if not end else st[3])
        for y in range(base - h, base + 1):
            k = 4 if y < base - h + 2 else 3
            if h >= 8 and y > base - h + 1 and (y - base + h) % 4 == 1:
                k = 2
            elif h >= 8 and y > base - h + 1 and (x + 7 * ((y - base + h) // 4)) % 14 == 0:
                k = 2
            elif y == base - h // 2 and 4 < h < 8:
                k = 2
            if h2(x // 2, y, seed + 11) > 0.93:
                k -= 1
            c.p(x, y, P(st, k - (1 if end else 0)))
        c.p(x, base + 1, st[1])
    if stairs_at is not None and h >= 6:
        n = max(2, h // 3)
        for i in range(n):
            w = 22 + 4 * i
            sy = base - h + i * (h // n)
            c.rect(stairs_at - w // 2, sy - 1, w, 2, st[5])
            c.rect(stairs_at - w // 2, sy + 1, w, h // n - 1, st[3])
            c.rect(stairs_at + w // 2 - 1, sy - 1, 1, h // n + 1, st[2])

def thatch(c, x0, x1, eave, H, inset, pal, seed, apse=False, crest=True):
    """A hipped thatch roof from the front, as the old sprites laid it: rows
    of short straw dashes in three tones, each row lit along its belly and
    dark along its foot, a dithered row easing between them; the left hip
    lit and the right in shade, divided from the front slope by a line; a
    ridge of knots; under the eave, a dark band and a fringe of straw ends."""
    mid = (x0 + x1) / 2

    def edge(t):
        return inset * (t ** 0.8 if apse else t)

    for j in range(H):
        t = j / H
        y = eave - j
        L, R = x0 + edge(t), x1 - edge(t)
        hipw = (inset + 3) * (1 - t)
        for x in range(math.floor(L), math.ceil(R)):
            if x - L < hipw and x < mid:
                face, k = 'L', 4
            elif R - x < hipw * 1.2 and x > mid:
                face, k = 'R', 2
            else:
                face, k = 'F', 3
            course = j // 3
            row = j % 3
            k += (-1, 0, 1)[row]
            if row == 0 and (x + course) % 2:
                k += 1
            dash = h2((x + course * 5) // (2 + course % 3), course * 31 + 7, seed) if row < 2 else 0.5
            if dash > 0.84:
                k -= 1
            elif dash < 0.1:
                k += 1
            if face == 'F' and t > 0.86:
                k += 1
            c.p(x, y, P(pal, k))
        if hipw > 1:
            lx, rx = math.floor(L + hipw), math.ceil(R - hipw * 1.2)
            if lx < mid:
                c.p(lx, y, pal[5])
            if rx > mid:
                c.p(rx, y, pal[1])
    for x in range(x0, x1):
        c.p(x, eave + 1, pal[1])
        c.p(x, eave + 2, pal[0] if x % 2 else pal[1])
    for x in (x0, x1 - 1):
        c.rect(x, eave - 1, 1, 4, pal[0])
    if crest:
        rL, rR = round(x0 + edge(1)), round(x1 - edge(1))
        top = eave - H
        c.rect(rL, top - 1, rR - rL, 2, pal[1]); c.rect(rL, top - 2, rR - rL, 1, pal[3])
        for x in range(rL + 2, rR - 2, 6):
            c.rect(x, top - 4, 2, 2, pal[4]); c.p(x + 1, top - 3, pal[2])

def doorway(c, cx, base, w, h, wall_pal, cloth, frame, pal, side=1, band=None):
    """A doorway as the old sprites drew it: square jambs lit inside, a
    slab lintel lit along its top, a painted band across the head of the
    opening with a row of dots, the room dark behind. A cloth hangs in some,
    drawn aside to one jamb. `frame`: timber, moulded, red-frame or
    fret-lintel."""
    x = cx - w // 2
    tim, st, red = pal['timber'], pal['stone'], pal['red']
    jamb = {'timber': tim, 'red-frame': red}.get(frame, wall_pal)
    c.rect(x - 2, base - h - 1, w + 4, h + 2, P(jamb, 1))
    c.rect(x - 1, base - h, 1, h + 1, P(jamb, 2)); c.rect(x + w, base - h, 2, h + 1, P(jamb, 4 if jamb is wall_pal else 3))
    c.rect(x, base - h, w, h + 1, DARK)
    for yy in range(base - h + 6, base, 3):
        c.p(x + 1, yy, DOORWAY)
    band = band or pal['accent']
    c.rect(x, base - h, w, 4, band[3]); c.rect(x, base - h, w, 1, band[4]); c.rect(x, base - h + 3, w, 1, band[1])
    for dx in range(x + 2, x + w - 1, 4):
        c.p(dx, base - h + 1, red[3] if band is not red else pal['plaster'][5])
    if cloth is not None:
        span = w // 2
        xs = range(x, x + span) if side < 0 else range(x + w - span, x + w)
        for yy in range(base - h + 4, base - 2):
            for xx in xs:
                c.p(xx, yy, cloth[(2, 3, 2, 1)[(xx - x) % 4]])
    lw = w + 10
    if frame == 'red-frame':
        slab = red
    elif frame == 'timber':
        slab = tim
    else:
        slab = st
    c.rect(cx - lw // 2, base - h - 5, lw, 4, slab[3]); c.rect(cx - lw // 2, base - h - 5, lw, 1, slab[5])
    c.rect(cx - lw // 2, base - h - 2, lw, 1, slab[1])
    if frame == 'fret-lintel':
        fret(c, cx - lw // 2 + 2, base - h - 4, lw - 4, 2, red[3], slab[3])
    if frame == 'moulded':
        c.rect(cx - lw // 2 - 2, base - h - 7, lw + 4, 2, st[5]); c.rect(cx - lw // 2 - 2, base - h - 5, lw + 4, 1, st[2])
    c.rect(x - 3, base, w + 6, 2, st[4]); c.rect(x - 3, base, w + 6, 1, st[5])
    return dict(door_x=cx, door_h=h, door_width=w, door_base=base, leaf=False)

def fret(c, x, y, w, h, fg, bg):
    """The stepped fret, xicalcoliuhqui: a hook and a step, repeating."""
    unit = ('#####...', '#...#...', '#.#.#..#', '#.#...##', '#.######')
    for yy in range(h):
        row = unit[min(len(unit) - 1, yy * len(unit) // max(1, h))]
        for xx in range(w):
            c.p(x + xx, y + yy, fg if row[xx % 8] == '#' else bg)


def t_vent(c, cx, y, pal):
    """The Maya T-shaped vent, the ik' sign, sunk in the wall."""
    for dx, dy, ww, hh in ((-4, 0, 9, 3), (-1, 3, 3, 6)):
        c.rect(cx + dx - 1, y + dy - 1, ww + 2, hh + 2, P(pal['wall'], 1))
    for dx, dy, ww, hh in ((-4, 0, 9, 3), (-1, 3, 3, 6)):
        c.rect(cx + dx, y + dy, ww, hh, DARK)
    c.rect(cx + 2, y + 3, 1, 7, P(pal['wall'], 4)); c.rect(cx + 5, y, 1, 4, P(pal['wall'], 4))


def vent(c, cx, y, pal):
    c.rect(cx - 4, y - 1, 9, 9, P(pal['wall'], 1)); c.rect(cx - 3, y, 7, 7, DARK)
    c.rect(cx + 4, y, 1, 8, P(pal['wall'], 4)); c.rect(cx - 4, y + 8, 9, 1, P(pal['wall'], 5))


# ------------------------------------------------------------------ things

def ramada(c, x0, x1, base, roof_y, pal, seed, side):
    """A shade ramada at the house's end: four posts, a lean-to of thatch,
    a packed-earth floor under it in shade, a grinding stone on it."""
    tim = pal['timber']
    c.rect(x0, base - 3, x1 - x0, 4, EARTH[2]); c.rect(x0, base - 3, x1 - x0, 1, EARTH[3])
    for px in (x0 + 2, x1 - 4) if side > 0 else (x0 + 2, x1 - 4):
        c.rect(px, roof_y, 2, base - roof_y, tim[3]); c.rect(px + 1, roof_y, 1, base - roof_y, tim[1])
    thatch(c, x0 - 3, x1 + 3, roof_y, 10, 3, pal['thatch'], seed + 5, crest=False)
    metate(c, (x0 + x1) // 2 - 4, base - 3, pal)


def metate(c, x, by, pal):
    """A three-legged grinding stone with its hand stone on it."""
    st = pal['stone']
    c.rect(x, by - 4, 11, 3, st[4]); c.rect(x, by - 4, 11, 1, st[5]); c.rect(x + 10, by - 4, 1, 3, st[2])
    c.rect(x + 1, by - 1, 2, 2, st[2]); c.rect(x + 8, by - 1, 2, 2, st[1])
    c.rect(x + 3, by - 6, 6, 2, st[3]); c.rect(x + 3, by - 6, 6, 1, st[5])


def maize(c, x, y, n):
    """Ears of maize hung in a string under the eave to dry."""
    corn = MB['date']
    for i in range(n):
        cx = x + i * 4
        c.p(cx + 1, y, MB['straw'][3])
        for k in range(5):
            c.p(cx, y + 1 + k, corn[4 if k < 3 else 3]); c.p(cx + 1, y + 1 + k, corn[3 if k < 3 else 2])
            c.p(cx + 2, y + 1 + k, corn[2])


# ------------------------------------------------------------------ houses

def door_at(s, x0, hx0, hx1):
    """The door at the recipe's entrance cell, kept clear of the corners."""
    return max(hx0 + 14, min(hx1 - 14, x0 + s['slot'] * 16 + 8))


def jacal(s):
    p = PROFILE[s['profile']]
    maya = s['profile'] == 'maya'
    W, seed, size = s['W'], s['seed'], s['size']
    pal = dict(p, wall=p[{'lime': 'plaster', 'ochre-wash': 'ochre', 'bare-adobe': 'adobe', 'red': 'red'}[s['finish']]])
    roof = p['thatch-old'] if s['old'] else p['thatch']
    JH = 50 + s['lift']
    H = round(42 * (0.98 if maya else 0.86)) + (4 if size == 'large' else 0)
    ph = (3 if maya else 0) + (7 if size == 'large' and maya else 0)
    c = C(W + 20, JH + H + ph + 18)
    x0, base = 10, c.h - 4
    info = dict(x0=x0, W=W, base=base)
    side = 1 if s['ramada'] or seed % 2 else -1
    ram = 26 if s['ramada'] else 0
    hx0, hx1 = (x0 + ram, x0 + W) if side > 0 else (x0, x0 + W - ram)
    span = hx1 - hx0
    dcx = door_at(s, x0, hx0, hx1)
    if ph:
        platform(c, x0 + (2 if not ram else 0), x0 + W - (2 if not ram else 0), base, ph, p,
                 stairs_at=dcx if size == 'large' else None, seed=seed)
    wb = base - ph
    apse = 4 if maya else 0
    style = 'cane' if s['wall'] == 'cane' else ('adobe' if s['finish'] == 'bare-adobe' else s['wall'])
    wall(c, hx0 + 2, hx1 - 2, wb - JH, wb, pal, style, seed, apse,
         p['red'] if s['dado'] and s['finish'] in ('lime', 'ochre-wash') else None)
    eave = wb - JH + 3
    fringe(c, hx0 + 2, hx1 - 2, eave + 3, pal['wall'] if style != 'cane' else p['timber'])
    thatch(c, hx0 - 7, hx1 + 7, eave, H, round(span * 0.1) + (8 if maya else 5), roof, seed, apse=maya)
    cloth = (p['accent'] if seed % 2 else p['red']) if s['cloth'] else None
    info.update(doorway(c, dcx, wb - 1, DOOR[0], DOOR[1], pal['wall'] if style != 'cane' else p['timber'],
                        cloth, s['frame'], p, side=-side, band=p['accent'] if maya else p['red']))
    if ram:
        rx0, rx1 = (x0, x0 + ram + 2) if side > 0 else (x0 + W - ram - 2, x0 + W)
        ramada(c, rx0, rx1, base, wb - 30, p, seed, side)
    if size != 'small' and not ram:
        jx = x0 + W - 4 if side > 0 else x0 + 4
        jar(c, jx, base, 4, 10, CLAY)
    info['smoke'] = [[round((hx0 + hx1) / 2), eave - H - 4, 'vent']]
    return c, info


def calli(s):
    p = PROFILE[s['profile']]
    maya = s['profile'] == 'maya'
    zap = s['profile'] == 'zapotec'
    W, seed, size = s['W'], s['seed'], s['size']
    finish_ = s['finish']
    pal = dict(p, wall=p[{'lime': 'plaster', 'ochre-wash': 'ochre', 'bare-adobe': 'adobe', 'red': 'red'}[finish_]])
    big = size == 'large'
    ph = (10 if big else 3 if maya else 6 if zap else 0)
    upper = 22 if maya and big else 0
    comb = 28 if maya and big and s['crest'] == 'comb' else 0
    depth = 26 if not big else 30
    c = C(W + 20, HW + upper + depth + comb + ph + 30)
    x0, base = 10, c.h - 4
    info = dict(x0=x0, W=W, base=base)
    side = 1 if s['ramada'] or seed % 2 else -1
    ram = 26 if s['ramada'] else 0
    hx0, hx1 = (x0 + ram, x0 + W) if side > 0 else (x0, x0 + W - ram)
    span = hx1 - hx0
    dcx = hx0 + span // 2 if big else door_at(s, x0, hx0, hx1)
    if ph:
        platform(c, x0, x0 + W, base, ph, p, stairs_at=dcx if big else None, seed=seed)
    wb = base - ph
    top = wb - HW - upper
    style = 'adobe' if finish_ == 'bare-adobe' else ('daub-stone' if s['wall'] == 'daub-stone' and not big else 'daub')
    wall(c, hx0, hx1, top, wb, pal, style, seed, 0,
         p['red'] if s['dado'] and finish_ in ('lime', 'ochre-wash') else None)
    if upper:
        mould(c, hx0 - 2, hx1 + 2, wb - HW, p['stone'])
        band_y = top + 9
        fret(c, hx0 + 2, band_y, span - 4, 8, P(p['stone'], 2), P(pal['wall'], 4))
        c.rect(hx0 + 2, band_y - 1, span - 4, 1, P(pal['wall'], 5)); c.rect(hx0 + 2, band_y + 8, span - 4, 1, P(pal['wall'], 2))
        if s['upper'] == 'masks':
            mask(c, dcx - 11, top + 6, p)
    eave = top
    deck_top = deck(c, hx0, hx1, eave, depth, p['plaster'], seed, pal['wall'], ledge=8, speck=0.985)
    if s['frieze'] == 'fret':
        fret(c, hx0, eave + 2, span, 5, p['red'][3], P(pal['wall'], 4))
    elif s['frieze'] == 'disks':
        for x in range(hx0 + 4, hx1 - 4, 9):
            c.rect(x, eave + 2, 5, 4, p['accent'][2]); c.rect(x + 1, eave + 2, 3, 1, p['accent'][4])
            c.p(x + 2, eave + 3, p['accent'][5])
    elif s['frieze'] == 'bands':
        c.rect(hx0 - 1, eave + 3, span + 2, 2, p['red'][3]); c.rect(hx0 - 1, eave + 3, span + 2, 1, p['red'][4])
    if s['parapet'] in ('stepped', 'snail') or (upper and not comb):
        merlons(c, hx0, hx1, eave - 1, pal['wall'], s['parapet'] if s['parapet'] != 'moulding' else 'stepped')
    elif s['parapet'] == 'double-moulding':
        mould(c, hx0 - 1, hx1 + 1, eave + 12, pal['wall'])
    # Openings: Maya T vents, Nahua square vents, set high either side of the door.
    vy = wb - HW + 12
    for vx in (dcx - 30, dcx + 30) if span > 90 else (dcx + side * 26,):
        if hx0 + 8 < vx < hx1 - 8 and not zap:
            (t_vent if maya else vent)(c, vx, vy, pal)
    if zap:
        info.update(mitla(c, hx0, hx1, wb, dcx, pal, p, big, seed))
    elif (big and not maya) or s['colonnade']:
        info.update(portico(c, hx0 + 8, hx1 - 8, wb, wb - HW + 8, pal, p, dcx, seed))
    else:
        cloth = (p['accent'] if seed % 2 else p['red']) if s['cloth'] else None
        info.update(doorway(c, dcx, wb - 1, DOOR[0], DOOR[1], pal['wall'], cloth, s['frame'], p, side=-side))
    if ram:
        rx0, rx1 = (x0, x0 + ram + 2) if side > 0 else (x0 + W - ram - 2, x0 + W)
        ramada(c, rx0, rx1, base, wb - 30, p, seed, side)
    life(c, s, hx0, hx1, deck_top, eave, comb, p, info)
    return c, info


def mitla(c, x0, x1, base, dcx, pal, p, big, seed):
    """The Zapotec front, as at Mitla and Lambityeco: stone jambs and a great
    lintel, panels of stepped fret (greca) set in a stone frame over the
    doorway, and on a lord's house a long fret band across the whole front
    and three doorways."""
    st = p['stone']
    doors = (dcx - 44, dcx, dcx + 44) if big and x1 - x0 > 130 else (dcx,)
    top = base - HW
    if big:
        y = top + 6
        c.rect(x0 + 2, y - 2, x1 - x0 - 4, 14, P(st, 2))
        c.rect(x0 + 2, y - 2, x1 - x0 - 4, 1, P(st, 5)); c.rect(x0 + 2, y + 11, x1 - x0 - 4, 1, P(st, 1))
        n = max(2, (x1 - x0 - 8) // 34)
        pw = (x1 - x0 - 8) // n
        for i in range(n):
            px = x0 + 4 + i * pw
            c.rect(px, y, pw - 3, 10, P(st, 1))
            fret(c, px + 1, y + 1, pw - 5, 8, P(st, 4), P(st, 1))
        shade(c, x0 + 2, x1 - 2, y + 12, (0.7, 0.86))
    info = None
    for i, dx in enumerate(doors):
        got = doorway(c, dx, base - 1, DOOR[0], DOOR[1], pal['wall'], p['accent'] if (seed + i) % 2 else None,
                      'moulded', p, side=1, band=p['red'])
        info = info or got
        if dx == dcx:
            info = got
        if not big:
            pw = DOOR[0] + 16
            py = base - 1 - DOOR[1] - 18
            c.rect(dx - pw // 2 - 1, py - 1, pw + 2, 12, P(st, 5))
            c.rect(dx - pw // 2, py, pw, 10, P(st, 1))
            fret(c, dx - pw // 2 + 1, py + 1, pw - 2, 8, P(st, 4), P(st, 1))
            c.rect(dx - pw // 2 - 1, py + 10, pw + 2, 1, P(st, 1))
            shade(c, dx - pw // 2, dx + pw // 2, py + 11, (0.72, 0.88))
    return info


def mould(c, x0, x1, y, pal):
    """A projecting moulding: its top lit, its face, a shadow under it."""
    c.rect(x0, y - 2, x1 - x0, 2, pal[5]); c.rect(x0, y, x1 - x0, 3, pal[3]); c.rect(x0, y + 3, x1 - x0, 1, pal[1])
    shade(c, x0 + 2, x1 - 2, y + 4, (0.66, 0.84))


def mask(c, x, y, p):
    """A stucco mask of the rain god over the door: a lit brow, square eyes
    with dark pupils, earspools, the long nose curling down, teeth."""
    st, red = p['stone'], p['red']
    c.rect(x, y, 22, 18, st[3]); c.rect(x, y, 22, 1, st[5]); c.rect(x + 21, y, 1, 18, st[1])
    c.rect(x + 1, y + 1, 20, 3, st[4]); c.rect(x + 1, y + 3, 20, 1, st[2])
    for ex in (x + 3, x + 13):
        c.rect(ex, y + 5, 6, 5, st[5]); c.rect(ex + 1, y + 6, 4, 3, st[1]); c.rect(ex + 2, y + 7, 2, 2, DARK)
    for ex in (x - 3, x + 22):
        c.rect(ex, y + 6, 3, 6, st[4]); c.p(ex + 1, y + 8, st[1]); c.p(ex + 1, y + 9, st[1])
    c.rect(x + 9, y + 4, 4, 9, st[4]); c.rect(x + 12, y + 4, 1, 9, st[2])
    c.rect(x + 7, y + 12, 6, 2, st[4]); c.rect(x + 7, y + 11, 2, 2, st[3])
    c.rect(x + 5, y + 14, 12, 3, red[2])
    for tx in range(x + 6, x + 16, 3):
        c.rect(tx, y + 14, 2, 2, st[5])


def merlons(c, x0, x1, y, pal, kind):
    """Merlons along the parapet: stepped like a temple, or curled like a
    cut shell (the 'snail' of Tenochtitlan's roofs)."""
    for mx in range(x0 + 3, x1 - 8, 11):
        if kind == 'stepped':
            for i, (dx, w) in enumerate(((0, 8), (1, 6), (2, 4))):
                yy = y - 3 * (i + 1)
                c.rect(mx + dx, yy, w, 3, P(pal, 4)); c.rect(mx + dx, yy, w, 1, P(pal, 5))
                c.rect(mx + dx + w - 1, yy, 1, 3, P(pal, 2))
        else:
            for dy in range(9):
                r = 4 if dy > 2 else [2, 3, 4][dy]
                for dx in range(-r, r):
                    c.p(mx + 4 + dx, y - 9 + dy, P(pal, 5 if dx < -1 else 4 if dx < 2 else 2))
            c.rect(mx + 3, y - 6, 3, 2, P(pal, 1)); c.p(mx + 5, y - 5, P(pal, 3))


def portico(c, x0, x1, base, top, pal, p, dcx, seed):
    """A noble house's portico: square pillars before a shaded hall, the
    doorway dark in its back wall."""
    wp = pal['wall']
    c.rect(x0, top, x1 - x0, base - top + 1, P(wp, 1))
    c.rect(x0, top, x1 - x0, 5, P(wp, 0))
    c.rect(x0, base - 4, x1 - x0, 5, P(p['stone'], 2))
    info = doorway(c, dcx, base - 4, DOOR[0], DOOR[1], wp, p['accent'], 'red-frame', p)
    n = max(4, (x1 - x0) // 22)
    for i in range(n):
        px = x0 + round(i * (x1 - x0 - 8) / (n - 1))
        if abs(px + 4 - dcx) < 12:
            continue
        c.rect(px, top, 8, base - top + 1, P(wp, 3)); c.rect(px, top, 2, base - top + 1, P(wp, 4))
        c.rect(px + 7, top, 1, base - top + 1, P(wp, 1))
        c.rect(px - 1, base - 9, 10, 9, P(p['red'], 3)); c.rect(px - 1, base - 9, 10, 1, P(p['red'], 4))
        c.rect(px - 1, top, 10, 3, P(wp, 5))
    return info


def life(c, s, x0, x1, deck_top, eave, comb, p, info):
    """The roof's use: maize or chilies on mats, jars, the ladder's head; on
    the largest Maya house, a pierced roof comb."""
    seed = s['seed']
    mid = (deck_top + eave) // 2
    if comb:
        cw = (x1 - x0) // 3
        cx = (x0 + x1) // 2
        cb = deck_top + 10
        body = p['red'] if seed % 2 else p['plaster']
        for y in range(cb - comb, cb):
            t = (cb - y) / comb
            half = round(cw / 2 * (1 - 0.35 * t))
            for x in range(cx - half, cx + half):
                k = 4 if x - (cx - half) < 2 else 2 if cx + half - x < 3 else 3
                c.p(x, y, P(body, k))
        for row, hy in enumerate((cb - comb + 5, cb - comb // 2 + 3)):
            half = round(cw / 2 * (1 - 0.35 * (cb - hy) / comb)) - 4
            for hx in range(cx - half + (2 if row else 0), cx + half - 2, 5):
                c.rect(hx, hy, 2, 8, (0, 0, 0, 0)); c.rect(hx + 2, hy, 1, 8, P(body, 4)); c.rect(hx, hy + 8, 3, 1, P(body, 5))
                c.rect(hx - 1, hy, 1, 8, P(body, 1))
        top_half = round(cw / 2 * 0.65)
        c.rect(cx - top_half - 1, cb - comb - 2, 2 * top_half + 2, 2, P(body, 5))
        c.rect(cx - top_half - 1, cb - comb, 2 * top_half + 2, 1, P(body, 1))
        c.rect(cx - top_half, cb - comb + 1, 2 * top_half, 2, P(p['red'] if body is not p['red'] else p['accent'], 3))
        info['smoke'] = []
        return
    w = x1 - x0
    if s['feature'] == 'mat' or w > 100:
        crop = MB['date'] if seed % 2 else MB['straw']
        mat(c, x0 + 10, mid - 2, min(22, w // 3), 6, grain=crop)
    if s['feature'] == 'jars' or w > 100:
        jar(c, x1 - 14, eave - 6, 3, 8, CLAY); jar(c, x1 - 22, eave - 6, 3, 7, CLAY)
    lx = x1 - 30 if seed % 2 else x0 + 22
    ladder(c, lx, deck_top - 8, eave - 6, 0, p['timber'])
    info['smoke'] = [[(x0 + x1) // 2, deck_top - 4, 'vent']]


def service(s):
    """The cuexcomatl, a bellied clay granary under a thatched cap, a smaller
    one beside it; or the temazcal, a domed sweat bath with a low door and a
    firebox built against its side."""
    p = PROFILE[s['profile']]
    W, seed = s['W'], s['seed']
    c = C(W + 20, 96)
    x0, base = 10, c.h - 4
    info = dict(x0=x0, W=W, base=base)
    platform(c, x0, x0 + W, base, 4, p, seed=seed)
    gb = base - 4
    if s['kind'] == 'granary':
        for cx, R, H in ((x0 + W * 0.66, 15, 44), (x0 + W * 0.26, 10, 30)):
            cx = round(cx)
            turn(c, cx, gb, H, lambda z, R=R, H=H: R * (0.5 + 0.55 * math.sin(math.pi * min(1, z / H * 0.92 + 0.05))), p['adobe'])
            for yy in (gb - H // 3, gb - 2 * H // 3):
                for x in range(cx - R, cx + R + 1):
                    if c.g(x, yy)[3]:
                        c.p(x, yy, P(p['adobe'], 1))
            capH = round(R * 1.1)
            turn(c, cx, gb - H + 3, capH, lambda z, R=R, capH=capH: (R + 3) * (1 - z / capH) + 0.5, p['thatch'])
            for x in range(cx - R - 3, cx + R + 4):
                hang = int(h2(x, 3, seed) * 3)
                for k in range(hang):
                    c.p(x, gb - H + 4 + k, p['thatch'][1])
            c.rect(cx - 1, gb - H + 3 - capH - 3, 2, 4, p['timber'][2])
        dx = x0 + round(W * 0.66)
        c.rect(dx - 4, gb - 18, 8, 8, DARK); c.rect(dx - 5, gb - 19, 10, 1, p['timber'][3])
        info.update(door_x=dx, door_h=8, door_width=8, door_base=gb - 10, leaf=False, doorless=False)
    else:
        R, H = W * 0.36, 30
        cx = x0 + round(W * 0.42)
        turn(c, cx, gb, H, lambda z: R * math.sqrt(max(0.0, 1 - (z / H) ** 2)) + 0.6, p['plaster'])
        for i in range(3):
            y = gb - 6 - i * 8
            for x in range(round(cx - R), round(cx + R)):
                if c.g(x, y)[3] and h2(x // 3, i, seed) > 0.4:
                    c.p(x, y, P(p['plaster'], 2))
        fx = x0 + W - 10
        c.rect(fx - 7, gb - 14, 14, 15, P(p['stone'], 3)); c.rect(fx - 7, gb - 14, 14, 2, P(p['stone'], 5))
        c.rect(fx + 6, gb - 14, 1, 15, P(p['stone'], 1))
        c.rect(fx - 3, gb - 8, 6, 6, DARK); c.rect(fx - 3, gb - 8, 6, 1, P(p['stone'], 1))
        for k in range(6):
            c.p(fx - 1 + (k % 2), gb - 15 - k, P(p['stone'], 1))
        dx = cx - 2
        c.rect(dx - 7, gb - 17, 14, 18, P(p['plaster'], 0))
        c.rect(dx - 6, gb - 16, 12, 17, DARK)
        for yy in range(gb - 16, gb - 4):
            for xx in range(dx - 6, dx + 1):
                c.p(xx, yy, p['accent'][(2, 3, 4)[(xx - dx) % 3]])
        info.update(door_x=dx, door_h=17, door_width=12, door_base=gb, leaf=False)
        info['smoke'] = [[fx, gb - 22, 'vent']]
    return c, info


def shingles(c, x0, x1, eave, H, inset, pal, seed):
    """A steep hipped roof of tejamanil, split pine shingles: short courses
    of upright shingles, each course lit along its butt and dark under it;
    the left hip lit, the right in shade; a ridge board along the top."""
    mid = (x0 + x1) / 2
    for j in range(H):
        t = j / H
        y = eave - j
        L, R = x0 + inset * t, x1 - inset * t
        hipw = (inset + 3) * (1 - t)
        course, row = j // 4, j % 4
        for x in range(math.floor(L), math.ceil(R)):
            face = 'L' if x - L < hipw and x < mid else 'R' if R - x < hipw * 1.2 and x > mid else 'F'
            k = {'L': 4, 'R': 2, 'F': 3}[face]
            # rows from the butt up: lit butt, body, body, the shadow of the course above
            k += (1, 0, 0, -2)[row]
            sx = (x + (course % 2) * 2) % 4
            if sx == 3 and row < 3:
                k -= 1
            elif sx == 0 and row in (1, 2) and h2(x // 4, course, seed) > 0.5:
                k += 1
            c.p(x, y, P(pal, k))
        if hipw > 1:
            lx, rx = math.floor(L + hipw), math.ceil(R - hipw * 1.2)
            if lx < mid:
                c.p(lx, y, pal[4])
            if rx > mid:
                c.p(rx, y, pal[1])
    for x in range(x0, x1):
        c.p(x, eave + 1, pal[4]); c.p(x, eave + 2, pal[1])
    rL, rR = round(x0 + inset), round(x1 - inset)
    top = eave - H
    c.rect(rL - 1, top - 2, rR - rL + 2, 2, pal[4]); c.rect(rL - 1, top, rR - rL + 2, 1, pal[1])


def boards(c, x0, x1, top, base, pal, seed):
    """Fitted horizontal boards, each lit along its top edge; at the
    corners the board ends stand out, notched over one another."""
    for y in range(top, base + 1):
        ly = (y - top) % 6
        for x in range(x0, x1):
            k = 4 if ly == 0 else 1 if ly == 5 else 3
            if ly in (2, 3) and h2(x // 3, (y - top) // 6 * 5 + ly, seed) > 0.93:
                k = 2
            c.p(x, y, P(pal, k))
    for x in (x0 - 3, x1 - 1):
        for y in range(top, base + 1):
            ly = (y - top) % 6
            for i in range(4):
                c.p(x + i, y, P(pal, 5 if ly == 0 else 1 if ly == 5 else 4 - (i > 2)))


def troje(s):
    """The Purépecha troje of the Meseta: a house of fitted pine boards on a
    stone footing, a tall hipped roof of shingles, and across the front a
    porch whose beam rests on carved brackets over its posts."""
    p = PROFILE[s['profile']]
    W, seed, size = s['W'], s['seed'], s['size']
    tim, roof, st = p['timber'], (p['thatch-old'] if s['old'] else p['thatch']), p['stone']
    JH = 50
    H = 34 + (6 if size != 'small' else 0)
    ph = 5
    c = C(W + 24, JH + H + ph + 16)
    x0, base = 12, c.h - 4
    info = dict(x0=x0, W=W, base=base)
    platform(c, x0 - 2, x0 + W + 2, base, ph, p, seed=seed, finish=st)
    wb = base - ph
    top = wb - JH
    porch = 14 if size != 'small' else 0
    boards(c, x0 + 2, x0 + W - 2, top, wb, tim, seed)
    dcx = door_at(s, x0, x0, x0 + W)
    # the door: boards in a carved frame, a lintel cut in steps
    x = dcx - DOOR[0] // 2 - 2
    dw = DOOR[0] + 4
    c.rect(x - 3, wb - DOOR[1] - 4, dw + 6, DOOR[1] + 4, P(tim, 1))
    for xx in range(x, x + dw):
        for yy in range(wb - DOOR[1], wb):
            c.p(xx, yy, P(tim, 2 if (xx - x) % 4 == 0 else 3))
    c.rect(x + dw - 4, wb - DOOR[1] // 2, 2, 2, P(st, 5))
    for i in range(3):
        c.rect(x - 4 - i * 2, wb - DOOR[1] - 6 - i * 2, dw + 8 + i * 4, 2, P(tim, 4 - i % 2))
    info.update(door_x=dcx, door_h=DOOR[1], door_width=dw, door_base=wb, leaf=True)
    if W > 70:
        wx = dcx + (30 if dcx < x0 + W // 2 else -30)
        c.rect(wx - 7, top + 14, 14, 12, DARK)
        c.rect(wx - 8, top + 13, 16, 1, P(tim, 5)); c.rect(wx - 8, top + 26, 16, 2, P(tim, 4))
        c.rect(wx - 1, top + 14, 2, 12, P(tim, 3))
    eave = top - porch // 2
    if porch:
        # the porch: the wall behind in shade, posts with carved zapatas
        shade(c, x0 + 2, x0 + W - 2, top, (0.6, 0.66, 0.72, 0.78) + (0.86,) * (wb - top - 4))
        by = top + 2
        c.rect(x0 - 4, by - 4, W + 8, 5, P(tim, 3)); c.rect(x0 - 4, by - 4, W + 8, 1, P(tim, 5))
        c.rect(x0 - 4, by + 1, W + 8, 1, P(tim, 1))
        for xx in range(x0 - 2, x0 + W + 2, 6):
            c.p(xx, by - 2, P(tim, 1)); c.p(xx + 1, by - 2, P(tim, 5))
        n = max(2, W // 34)
        for i in range(n + 1):
            px = x0 + round(i * (W - 6) / n)
            if abs(px + 3 - dcx) < 14 or (W > 70 and abs(px + 3 - (dcx + (30 if dcx < x0 + W // 2 else -30))) < 12):
                continue
            c.rect(px, by + 2, 6, wb - by - 2, P(tim, 4)); c.rect(px, by + 2, 2, wb - by - 2, P(tim, 5))
            c.rect(px + 5, by + 2, 1, wb - by - 2, P(tim, 2))
            for k in range(4):  # the zapata, a bracket cut in steps, lit on top and in shadow under
                w = 18 - 3 * k
                c.rect(px + 3 - w // 2, by + 2 + k * 2, w, 1, P(tim, 5))
                c.rect(px + 3 - w // 2, by + 3 + k * 2, w, 1, P(tim, 2))
            shade(c, px - 6, px + 12, by + 10, (0.8,))
            c.rect(px - 1, wb - 3, 8, 3, P(st, 4))
    shingles(c, x0 - 8, x0 + W + 8, eave, H, round(W * 0.16) + 6, roof, seed)
    shade(c, x0, x0 + W, eave + 3, (0.6, 0.74, 0.88))
    info['smoke'] = [[x0 + W // 2, eave - H - 2, 'vent']]
    return c, info


def built(fn):
    def make(spec=None, info=None):
        s = dict(profile='maya', size='medium', W=96, seed=1, finish='lime', wall='daub', frame='timber',
                 dado=True, ramada=False, old=False, parapet='plain', frieze=None, feature='none', kind='granary',
                 slot=3, lift=0, cloth=False, crest='comb', upper='masks', colonnade=False)
        s.update(spec or {})
        c, i = fn(s)
        finish(c)
        consolidate(c, rare=3)
        if info is not None:
            info.update(i)
        return c.im
    return make


BUILDERS = {'jacal': built(jacal), 'calli': built(calli), 'meso-service': built(service), 'troje': built(troje)}

def spec(r):
    """A recipe's choices, drawn as oblique_meso drew them so each frame keeps
    its look: finish, frame, parapet, frieze, weathering, ramada."""
    rng = random.Random(r['seed'] + 509)
    pick = lambda key: rng.choice(r.get(key) or [None])
    maya = r['regionalProfile'] == 'maya'
    size, tier = r.get('goldScale', 'medium'), r.get('wealthTier', 1)
    kind = {'meso-jacal': 'jacal', 'meso-terrace': 'calli'}.get(r['regionalHouse'], 'meso-service')
    if r['regionalProfile'] == 'purepecha' and kind != 'meso-service':
        kind = 'troje'
    fw = r['footprint'][0]
    rich = tier >= 2 or (tier == 1 and rng.random() < .55)
    finish = r.get('surfaceTreatments', ['lime'])[0]
    if tier >= 2:
        finish = 'red' if maya and kind == 'calli' and r['goldVariant'] % 2 == 0 else 'lime'
    dado = bool(r.get('dado')) and finish in ('lime', 'ochre-wash') and rng.random() < .8
    parapet = pick('parapetStyles') if rich else (r.get('parapetStyles') or ['plain'])[0]
    frieze = pick('friezes') if (tier >= 2 or rich and size != 'small') else None
    frames = r.get('doorFrames', ['timber'])
    frame = frames[min(len(frames) - 1, rng.randrange(tier + 1))]
    wall = pick('wallStyles')
    pick('thatchForms')
    feature = pick('roofFeatures') or 'none'
    old = tier == 0 and rng.random() < .6
    cloth = rng.randrange(3) > 0
    crest = 'comb' if r.get('goldVariant', 0) % 2 == 0 else 'merlons'
    upper = rng.choice(['masks', 'fret'])
    slot = r['entrance'][0]
    ramada = kind not in ('meso-service', 'troje') and size != 'large' and fw >= 5 and slot >= 2 and rng.random() < .5
    return kind, dict(profile=r['regionalProfile'], size=size, W=fw * 16, seed=r['seed'] % 997, finish=finish,
                      wall=wall, frame=frame, dado=dado, ramada=ramada, old=old, parapet=parapet, frieze=frieze,
                      feature=feature, kind=r.get('serviceStyle', 'granary'), slot=slot, lift=rng.choice([0, 0, 2, 4]),
                      cloth=cloth, crest=crest, upper=upper,
                      colonnade=maya and kind == 'calli' and size == 'medium' and tier >= 1)


def recipes():
    from art.regional_houses import regional_house_recipes
    source = json.loads((ROOT / 'src/content/graphics/buildings.json').read_text())
    return {n: r for n, r in regional_house_recipes(ROOT, source).items() if r.get('regionalHouse', '').startswith('meso-')}


STUDIES = [(n, *spec(r)) for n, r in sorted(recipes().items(), key=lambda kv: (kv[0].split('-')[1], kv[1]['footprint'][0], kv[0]))]
# Until regional-houses.json lists them, the new profiles' frames are shown
# from hand-written specs at the families' footprints.
_HAVE = {n.split('-')[2] for n, _, _ in STUDIES}
_NEW = dict(seed=7, finish='lime', wall='daub-stone', frame='moulded', parapet='plain', frieze=None, cloth=True)
STUDIES += [(n, k, dict(_NEW, **sp)) for n, k, sp in (
    ('meso-jacal-zapotec-small-0', 'jacal', dict(profile='zapotec', size='small', W=48, slot=1, old=True, wall='cane',
                                                 frame='timber', dado=False)),
    ('meso-jacal-zapotec-medium-0', 'jacal', dict(profile='zapotec', size='medium', W=96, slot=3, finish='bare-adobe',
                                                  frame='timber', dado=False, ramada=True)),
    ('meso-terrace-zapotec-small-0', 'calli', dict(profile='zapotec', size='small', W=80, slot=2, finish='lime')),
    ('meso-terrace-zapotec-medium-0', 'calli', dict(profile='zapotec', size='medium', W=128, slot=4, finish='red',
                                                    frieze='bands')),
    ('meso-terrace-zapotec-large-0', 'calli', dict(profile='zapotec', size='large', W=160, slot=5)),
    ('meso-jacal-purepecha-small-0', 'troje', dict(profile='purepecha', size='small', W=64, slot=1)),
    ('meso-jacal-purepecha-medium-0', 'troje', dict(profile='purepecha', size='medium', W=96, slot=2, seed=3)),
    ('meso-jacal-purepecha-large-0', 'troje', dict(profile='purepecha', size='large', W=128, slot=4, seed=4,
                                                   old=True)),
    ('meso-service-zapotec-small-0', 'meso-service', dict(profile='zapotec', size='small', W=48, kind='granary')),
    ('meso-service-purepecha-small-0', 'meso-service', dict(profile='purepecha', size='small', W=48,
                                                            kind='sweatbath')),
) if n.split('-')[2] not in _HAVE]


def game_recipes(recipes):
    """Redraw the Mesoamerican houses front-on, each from its own recipe,
    the entrance under the painted door."""
    import re
    for name, r in list(recipes.items()):
        if not re.match(r'meso-(jacal|terrace|service)-(maya|nahua|zapotec|purepecha)-(small|medium|large)-\d+$', name):
            continue
        kind, sp = spec(r)
        info = {}
        BUILDERS[kind](sp, info)
        fw, fh = r['footprint']
        r = {k: v for k, v in r.items() if k not in ('oblique', 'roofVoid')}
        r.update(entrance=[max(0, min(fw - 1, (info['door_x'] - info['x0']) // 16)), fh],
                 frontAncient=(kind, sp), front=True)
        recipes[name] = r


def sheet(names, out):
    from PIL import Image
    from art.reference import current_adult
    groups = [[n for n, _, _ in STUDIES if n.startswith(g)] for g in
              ('meso-jacal-maya', 'meso-jacal-nahua', 'meso-terrace-maya', 'meso-terrace-nahua', 'meso-jacal-zapotec',
               'meso-terrace-zapotec', 'meso-jacal-purepecha', 'meso-service')]
    rows = [[BUILDERS[k](sp) for n, k, sp in STUDIES if n in g and (not names or n in names)] for g in groups]
    rows = [r for r in rows if r]
    a = current_adult()
    W = max(sum(i.width + 6 for i in r) for r in rows) + a.width + 12
    H = sum(max(i.height for i in r) + 8 for r in rows)
    bg = Image.new('RGBA', (W, H), (132, 150, 98, 255))
    y = 0
    for r in rows:
        h = max(i.height for i in r)
        x = 4
        for im in r:
            bg.alpha_composite(im, (x, y + h - im.height)); x += im.width + 6
        bg.alpha_composite(a, (x, y + h - 6 - a.height))
        y += h + 8
    bg.resize((W * 3, H * 3), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    sheet(sys.argv[2:], sys.argv[1] if len(sys.argv) > 1 else 'artifacts/meso/sheet.png')
