"""Mesoamerican temple pyramids and the Ancestral Puebloan kiva, front-on.
See front_sacred.py for the contract.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-americas.png americas

The Maya temple: a steep pyramid of plastered limestone in apron-moulded
tiers, painted red or left white, one stair up its face to a temple of
three doors under a roof comb (Tikal, Palenque, Copán). The Nahua temple:
talud tiers with a painted band at the head of each, and on the great ones
the twin shrines of the Templo Mayor, Tlaloc's banded blue and white and
Huitzilopochtli's red, each with its own stair. Small temples carry a
thatched shrine. The kiva: a round masonry chamber in Chacoan banded
veneer, its flat earth roof seen from above, the ladder out of the hatch.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, ramp, h2  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_stepped as st  # noqa: E402
from art.front_sacred import complete, ground_shadow, VOID  # noqa: E402

RED = ramp(28, 0.14, lift=-0.1)
LIME = ramp(84, 0.026, lift=0.03)
STONE = ramp(76, 0.036, lift=-0.04)
MAYA_BLUE = ramp(205, 0.075, lift=-0.02)
TLALOC = ramp(236, 0.1, lift=-0.04)
OCHRE = ramp(70, 0.1, lift=-0.02)
CLAY = ramp(40, 0.09, lift=-0.1)
WOOD = ramp(48, 0.07, lift=-0.1)
SANDSTONE = ramp(52, 0.06, lift=-0.04)
EARTH = ramp(56, 0.06, lift=-0.06)
MAYA_LOOKS = [dict(body=RED, band=LIME, shrine=RED, stair=LIME),
              dict(body=LIME, band=RED, shrine=RED, stair=LIME),
              dict(body=RED, band=MAYA_BLUE, shrine=RED, stair=STONE)]
NAHUA_LOOKS = [dict(body=LIME, band=RED, shrine=LIME, stair=LIME),
               dict(body=STONE, band=LIME, shrine=LIME, stair=LIME),
               dict(body=LIME, band=TLALOC, shrine=LIME, stair=STONE)]


# ------------------------------------------------------------------ parts

def skin(c, x, y, w, h, r, q):
    """Lime plaster in one value; bare limestone in its courses."""
    if r is STONE:
        st.coursed(c, x, y, w, h, r, q=q, course=4, block=10, foot=0, seed=x + y)
    else:
        st.plaster(c, x, y, w, h, r, q=q)


def maya_tier(c, x, y, w, h, body, band):
    """An apron-moulded tier: the lit lip, the apron in its band colour
    jutting, its shadow, the sunk body below; the corners turned."""
    skin(c, x, y, w, h, body, 3)
    c.rect(x, y, w, 1, band[0])
    c.rect(x, y + 1, w, 2, band[2])
    c.rect(x, y + 3, w, 1, body[5])
    c.rect(x, y + h - 1, w, 1, body[4])
    st.ends(c, x, y + 3, w, h - 3, body)
    st.ends(c, x, y + 1, w, 2, band)


def talud_tier(c, x, y, w, h, body, band):
    """A Nahua talud: the painted band (tablero) at its head over a dark
    reveal, then the battered slope, which catches the sky and is lit."""
    c.rect(x, y, w, 1, band[0])
    c.rect(x, y + 1, w, 3, band[2])
    c.rect(x, y + 4, w, 1, body[5])
    skin(c, x, y + 5, w, h - 5, body, 1)
    c.rect(x, y + 5 + (h - 5) // 2, w, (h - 5) - (h - 5) // 2, body[2])
    c.rect(x, y + h - 1, w, 1, body[3])
    st.ends(c, x, y + 1, w, h - 1, body)
    st.ends(c, x, y + 1, w, 3, band)


def tread(c, x, y, w, h, r):
    c.rect(x, y, w, h, r[1])
    c.rect(x, y + h - 1, w, 1, r[0])


def brazier(c, cx, by, overlays, big=False):
    """A clay brazier on its foot; its fire is an animated overlay."""
    w = 4 if big else 3
    rows = [(1,)] * 2 + [(2,)] + [(w,)] * 3 + [(w + 1,)]
    for k, (half,) in enumerate(rows):
        for dx in range(-half, half + 1):
            u = dx / max(1, half)
            c.p(cx + dx, by - k, CLAY[1] if u < -0.4 else CLAY[3] if u < 0.3 else CLAY[5])
    top = by - len(rows)
    for dx in range(-w, w + 1):
        c.p(cx + dx, top, CLAY[6] if dx % 2 else (196, 82, 34, 255))
    fw, fh = (9, 12) if big else (7, 9)
    overlays.append(['flame' if big else 'flame-small', cx - fw // 2, top - fh + 1])


def banner_pole(c, x, by, overlays):
    c.rect(x, by - 18, 1, 18, WOOD[3]); c.rect(x + 1, by - 17, 1, 17, WOOD[1])
    c.rect(x - 1, by - 18, 4, 1, WOOD[4]); c.p(x, by - 19, OCHRE[1])
    overlays.append(['banner', x + 1, by - 17])


def doorway(c, cx, by, w, h, frame):
    c.rect(cx - w // 2 - 2, by - h - 2, w + 4, h + 2, frame[1])
    c.rect(cx + w // 2, by - h - 2, 2, h + 2, frame[4])
    c.rect(cx - w // 2, by - h, w, h, VOID)
    c.rect(cx - w // 2, by - h, w, 1, frame[6])


def maya_temple(c, cx, by, w, look, comb=True):
    """The temple on the summit: three doors in a plastered wall, the medial
    moulding, a frieze with the mask of the god, a flat roof seen from
    above, and the openwork roof comb on its back wall."""
    sh, band = look['shrine'], look['band']
    c.rect(cx - w // 2 - 3, by - 3, w + 6, 3, sh[2]); c.rect(cx - w // 2 - 3, by - 3, w + 6, 1, sh[0])
    by -= 3
    bh, fh = 28, 12
    x = cx - w // 2
    top = by - bh - fh
    if comb:
        cw = round(w * 0.56)
        y = top - 3
        for k in range(3):
            ww, hh = cw - k * 4, 8
            x0 = cx - ww // 2
            y -= hh
            c.rect(x0, y, ww, hh, sh[2]); c.rect(x0, y, 2, hh, sh[1])
            c.rect(x0 + ww - 2, y, 2, hh, sh[4]); c.rect(x0, y, ww, 1, sh[0]); c.rect(x0, y + hh - 1, ww, 1, sh[5])
            for sx in range(x0 + 4, x0 + ww - 6, 6):
                c.rect(sx, y + 2, 3, 4, VOID); c.rect(sx, y + 2, 3, 1, sh[6])
        c.rect(cx - cw // 2 + 1, top - 3, cw - 2, 3, sh[4])
    c.rect(x - 2, top - 2, w + 4, 2, sh[0])
    skin(c, x, top, w, fh, sh, 2)
    st.ends(c, x, top, w, fh, sh)
    mx = cx - 7
    st.glyph(c, mx, top + 1, ('aaaaaaaaaaaaaa', 'abbbbbbbbbbbbc', 'ab.dd.bb.dd.bc', 'abbbbbaabbbbbc', '..bbbbaabbbb..',
                              '...e.e.e.e.e..'), {'a': band[0], 'b': band[2], 'c': band[4], 'd': VOID, 'e': band[5]})
    c.rect(x - 2, top + fh, w + 4, 1, band[0]); c.rect(x - 2, top + fh + 1, w + 4, 2, band[2])
    c.rect(x - 2, top + fh + 3, w + 4, 1, sh[6])
    skin(c, x, top + fh + 4, w, bh - 4, sh, 3)
    st.ends(c, x, top + fh + 4, w, bh - 4, sh)
    doorway(c, cx, by, 10, 22, sh)
    if w >= 44:
        for sx in (-1, 1):
            doorway(c, cx + sx * (w // 2 - 9), by, 6, 16, sh)
    return top - (26 if comb else 2), by


def thatch_shrine(c, cx, by, w, look, profile):
    """A small temple of plastered wattle with a hipped thatch roof, as the
    house painter lays it."""
    from art.front_meso import thatch, PROFILE
    sh = look['shrine']
    bh = 26
    x = cx - w // 2
    skin(c, x, by - bh, w, bh, sh, 2)
    st.ends(c, x, by - bh, w, bh, sh)
    c.rect(x, by - bh, w, 3, look['band'][2]); c.rect(x, by - bh + 3, w, 1, sh[5])
    doorway(c, cx, by, 10, 20, sh)
    thatch(c, x - 6, x + w + 6, by - bh, round(w * 0.55), round(w * 0.25), PROFILE[profile]['thatch'], 3)
    return by - bh - round(w * 0.55) - 4


def merlons(c, x0, x1, y, r):
    """Cut-shell merlons along a roof's head."""
    for mx in range(x0 + 1, x1 - 5, 7):
        st.glyph(c, mx, y - 6, ('.aab.', 'aabbc', 'abdbc', 'abbbc', 'bbbcc', 'bbccc'),
                 {'a': r[0], 'b': r[1], 'c': r[3], 'd': r[4]})


def nahua_shrine(c, cx, by, w, look, god):
    """A shrine of the Templo Mayor kind: a plastered room with its door,
    under a tall roof painted in the god's colours and crowned with
    cut-shell merlons: Tlaloc's banded blue and white, Huitzilopochtli's
    red with rows of white skulls."""
    sh = look['shrine']
    bh, rh = 26, 24
    x = cx - w // 2
    skin(c, x, by - bh, w, bh, sh, 2)
    st.ends(c, x, by - bh, w, bh, sh)
    doorway(c, cx, by, 10, 22, RED if god == 'huitz' else TLALOC if god == 'tlaloc' else sh)
    top = by - bh - rh
    rx, rw = x - 3, w + 6
    for xx in range(rx, rx + rw):
        u = (xx - rx) / rw
        q = 1 if u < 0.15 else 2 if u < 0.7 else 3
        if god == 'tlaloc':
            r = TLALOC if (xx - rx) // 4 % 2 else LIME
        elif god == 'huitz':
            r = RED
        else:
            r = look['band']
        c.rect(xx, top, 1, rh, r[q])
    if god == 'huitz':
        for j, yy in enumerate(range(top + 4, top + rh - 3, 6)):
            for xx in range(rx + 3 + (j % 2) * 3, rx + rw - 4, 6):
                st.glyph(c, xx, yy, ('ab.', 'dbd', '.b.'), {'a': LIME[0], 'b': LIME[1], 'd': RED[6]})
    c.rect(rx, top + rh, rw, 1, sh[6])
    c.rect(rx, top, rw, 1, sh[0])
    st.ends(c, rx, top, rw, rh, TLALOC if god == 'tlaloc' else RED if god == 'huitz' else look['band'])
    merlons(c, rx, rx + rw, top, LIME)
    return top - 6, by


# ------------------------------------------------------------------ pyramids

def pyramid(spec, info):
    s = {**dict(profile='maya', scale='medium', look=0), **spec}
    prof, scale = s['profile'], s['scale']
    maya = prof == 'maya'
    look = (MAYA_LOOKS if maya else NAHUA_LOOKS)[s['look']]
    fw, fh = s['footprint']
    W = fw * 16
    n, th = s['tiers'], s['tier_h']
    summit = s['summit']
    twin = summit == 'twin'
    H = n * (th + 2) + {'comb': 96, 'shrine': 84, 'twin': 80, 'thatch-shrine': 76}[summit] + 12
    c = C(W + 24, H)
    base = H - 6
    cx = (W + 24) // 2
    body, band = look['body'], look['band']
    top_w = round(W * (0.42 if maya else 0.55 if not twin else 0.7))
    plan = []
    for k in range(n):
        w = round((W - 6) - (W - 6 - top_w) * k / max(1, n - 1)) if n > 1 else W - 6
        plan.append((w, th, 2 if k < n - 1 else (14 if not twin else 16)))
    tier = maya_tier if maya else talud_tier
    out = st.tiers(c, cx, base, plan, lambda c, x, y, w, h, k: tier(c, x, y, w, h, body, band),
                   lambda c, x, y, w, h, k: tread(c, x, y, w, h, body), shadow=body)
    tx, fy, tw, tth, tt = out[-1]
    overlays = []
    stair_r = look['stair']
    sw = max(16, round(W * (0.2 if maya else 0.17)))
    centres = [cx] if not twin else [cx - tw // 4, cx + tw // 4]
    for sx in centres:
        st.stair(c, sx, base, fy, sw, stair_r, q=2, rise=4 if maya else 3, bal=body if maya else band, bal_w=4)
        if not maya and s.get('serpents'):
            for side in (-1, 1):
                hx = sx + side * (sw // 2 + 2) - 3
                st.glyph(c, hx, base - 6, ('.aab..', 'abbbbc', 'abdbbc', 'bbbbcc', '.e.e..'),
                         {'a': STONE[0], 'b': STONE[2], 'c': STONE[4], 'd': VOID, 'e': RED[2]})
    floor = tt + (tw * 0 + (12 if not twin else 13))
    if summit == 'comb':
        roof, door_by = maya_temple(c, cx, floor, min(tw - 8, 64), look)
    elif summit == 'thatch-shrine':
        roof = thatch_shrine(c, cx, floor, min(tw - 10, 40), look, prof)
        door_by = floor
    elif summit == 'twin':
        sw2 = tw // 2 - 14
        for sx, god in ((cx - tw // 4, 'tlaloc'), (cx + tw // 4, 'huitz')):
            roof, door_by = nahua_shrine(c, sx, floor, sw2, look, god)
    else:
        roof, door_by = (maya_temple(c, cx, floor, min(tw - 8, 56), look, comb=False) if maya
                         else nahua_shrine(c, cx, floor, min(tw - 10, 50), look, 'plain'))
    nb = s.get('braziers', 0)
    if nb:
        spots = [cx - 16, cx + 16] if not twin else [cx - 6, cx + 6]
        for bx in spots[:max(1, min(2, nb))]:
            brazier(c, bx, floor + 2, overlays)
        if nb >= 4:
            brazier(c, cx - W // 2 + 6, base, overlays, big=True)
            brazier(c, cx + W // 2 - 6, base, overlays, big=True)
    nbn = s.get('banners', 0)
    for bx in (tx + 3, tx + tw - 5)[:nbn]:
        banner_pole(c, bx, floor - 1, overlays)
    if nbn >= 4:
        for bx in (out[-2][0] + 4, out[-2][0] + out[-2][2] - 6):
            banner_pole(c, bx, out[-2][4] + 2, overlays)
    ground_shadow(c, cx - W // 2, cx + W // 2, base)
    door_x = cx if not twin else cx + tw // 4
    return complete(c, info, cx - W // 2, W, base + 1, door_x, 22, fh * 16, leaf=False, door_base=door_by,
                    door_width=10, summit_door=True, overlays=overlays, roof='flat')


# ------------------------------------------------------------------ kiva

def masonry(R, kind, seed):
    """Chacoan banded veneer for the lathe: courses of tabular sandstone
    with a band of thin chinking courses every few, block ends staggered.
    Rubble lays rounder stones without bands."""
    def surface(x, y, z, q):
        if kind == 'rubble':
            j = int(z // 3)
            s = (math.atan2(y, x) * R + j * 2.5) / 6
            if s % 1 < 0.18 or z % 3 < 0.6:
                return SANDSTONE[min(7, q + 2)]
            v = h2(int(s), j, seed)
            return SANDSTONE[max(0, min(7, q + (1 if v > 0.75 else -1 if v < 0.12 else 0)))]
        band = int(z // 2) % 4 == 3
        j = int(z // 2)
        s = (math.atan2(y, x) * R + (j % 2) * 3) / (3 if band else 7)
        if z % 2 < 0.5:
            return SANDSTONE[min(7, q + 1)]
        if s % 1 < 0.15:
            return SANDSTONE[min(7, q + 2)]
        return SANDSTONE[min(7, q + (1 if band else 0))]
    return surface


def roof(c, x, y, w, h, mask=None):
    """An earth roof on poles, seen from above: packed earth in two values,
    the line of a pole showing through every few rows."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if mask:
                mx, my, mr = mask
                if ((xx + 0.5 - mx) / mr) ** 2 + ((yy + 0.5 - my) / (mr * so.K)) ** 2 > 1:
                    continue
            q = 3 if (yy - y) % 4 == 3 else 2
            if h2(xx // 5, (yy - y) // 4, 9) > 0.8:
                q += 1
            c.p(xx, yy, EARTH[q])


def ladder(c, x, by, h, lean=4):
    for k in range(h):
        dx = round(lean * k / h)
        c.p(x + dx, by - k, WOOD[2]); c.p(x + dx + 1, by - k, WOOD[5])
        c.p(x + 7 + dx, by - k, WOOD[3]); c.p(x + 8 + dx, by - k, WOOD[6])
        if k % 5 == 3 and k < h - 4:
            c.rect(x + dx + 2, by - k, 5, 1, WOOD[2]); c.rect(x + dx + 2, by - k + 1, 5, 1, WOOD[6])
    c.p(x + lean, by - h, WOOD[1]); c.p(x + 7 + lean, by - h, WOOD[3])


def kiva(spec, info):
    """A great kiva at grade: the round wall of banded sandstone, the flat
    earth roof inside its rim, the hatch with its timber curb and the
    ladder poles standing up out of it; the ventilator shaft, or for the
    great kiva its antechamber, beside it."""
    s = {**dict(R=34, rise=18, kind='banded', vent=True, ante=False, footprint=(5, 5)), **spec}
    R, rise = s['R'], s['rise']
    fw, fh = s['footprint']
    W = fw * 16
    c = C(W + 24, rise + R + 64)
    base = c.h - 6
    cx = (W + 24) // 2
    by = base - round(R * so.K)
    if s['ante']:
        aw = round(R * 1.1)
        so.box(c, cx - aw // 2, by - round(R * so.K) + 6, aw, rise + 8, 24,
               lambda c, x, y, w, h: (st.coursed(c, x, y, w, h, SANDSTONE, q=3, course=4, block=9), st.ends(c, x, y, w, h, SANDSTONE)),
               lambda c, x, y, w, h: (roof(c, x, y, w, h), c.rect(x, y + h - 2, w, 2, SANDSTONE[1])))
    so.lathe(c, cx, by, [(0, R), (rise, R)], SANDSTONE, hollow=(R - 3, rise - 3), fill=(rise - 2, EARTH),
             surface=masonry(R, s['kind'], 5))
    roof(c, cx - R + 4, by - rise - round((R - 3) * so.K) + 2, 2 * R - 8, round((R - 3) * 2 * so.K) - 3,
         mask=(cx, by - rise + 1, R - 3))
    if s['vent']:
        vx = cx + round(R * 0.5)
        so.box(c, vx, base + 3, 14, rise - 8, 10,
               lambda c, x, y, w, h: (st.coursed(c, x, y, w, h, SANDSTONE, q=3, course=4, block=7),
                                      st.ends(c, x, y, w, h, SANDSTONE)),
               lambda c, x, y, w, h: (c.rect(x, y, w, h, SANDSTONE[1]), c.rect(x + 3, y + 1, w - 6, h - 2, VOID)))
    roof_y = by - rise + 1
    hx, hy = cx - 2, roof_y + 2
    c.rect(hx - 9, hy - 4, 18, 8, WOOD[3])
    c.rect(hx - 9, hy - 4, 18, 1, WOOD[1])
    c.rect(hx - 7, hy - 3, 14, 6, VOID)
    c.rect(hx + 8, hy - 3, 1, 7, WOOD[5])
    for k in range(6):
        a = math.pi * (0.15 + k * 0.14)
        bx = round(cx + (R - 1) * math.cos(a))
        c.rect(bx - 1, by + round((R - 1) * so.K * math.sin(a)) - rise + 2, 2, 2, WOOD[4])
    ladder(c, hx - 5, hy + 2, 34 + R // 4)
    ground_shadow(c, cx - R, cx + R, base)
    return complete(c, info, cx - W // 2, W, base + 1, cx, 0, fh * 16, doorless=True, roof='flat')


# ------------------------------------------------------------------ catalogue

BUILDERS = {'pyramid': pyramid, 'kiva': kiva}


def _meso():
    import json
    data = json.loads((ROOT / 'src/content/graphics/meso-landmarks.json').read_text())['temples']
    out = {}
    for prof, spec in data.items():
        if prof == 'maya':  # The old Maya temple stays: the user preferred it.
            continue
        rec = {}
        for scale, shape in spec['scales'].items():
            rec[scale] = [('pyramid', dict(profile=prof, scale=scale, look=look, footprint=shape['footprint'],
                                           tiers=shape['tiers'], tier_h=shape['tierHeight'] + (2 if prof == 'maya' else 3),
                                           summit=shape['summit'], braziers=shape.get('braziers', 0),
                                           banners=shape.get('banners', 0), serpents=shape.get('serpents', False),
                                           label=f"{spec['label']}",
                                           description='A plastered stepped platform with a stair to the shrine at its summit, '
                                                       'where braziers burn before the door.', roof='flat'))
                          for look in range(len(spec['looks']))]
        out[f'meso-temple-{prof}'] = rec
    return out


SPECS = _meso()

# Halls drawn here: the frame and its spec. The kiva keeps its hall recipe
# (footprint, entrance, label); only the painter changes.
HALLS = {
    'hall-kiva-small-0': ('kiva', dict(R=26, rise=14, vent=True, footprint=(4, 4))),
    'hall-kiva-medium-0': ('kiva', dict(R=34, rise=18, vent=True)),
    'hall-kiva-medium-1': ('kiva', dict(R=34, rise=16, vent=False)),
    'hall-kiva-medium-2': ('kiva', dict(R=34, rise=18, vent=True, kind='rubble')),
    'hall-kiva-large-0': ('kiva', dict(R=54, rise=24, vent=False, ante=True, footprint=(8, 8))),
}
