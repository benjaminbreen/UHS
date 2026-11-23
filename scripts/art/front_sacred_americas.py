"""The Nahua temple pyramid and the Ancestral Puebloan kiva, front-on.
See front_sacred.py for the contract.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred-americas.png americas

The Nahua temple is drawn in front_meso_precinct.py; the Maya temple keeps
its older painter. The kiva: a round masonry chamber in Chacoan banded
veneer, its flat earth roof seen from above, the ladder out of the hatch.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, ramp, h2  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_stepped as st  # noqa: E402
from art.front_sacred import complete, ground_shadow, VOID  # noqa: E402
from art.front_meso_precinct import pyramid  # noqa: E402

SANDSTONE = ramp(52, 0.06, lift=-0.04)
EARTH = ramp(56, 0.06, lift=-0.06)
WOOD = ramp(48, 0.07, lift=-0.1)


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
