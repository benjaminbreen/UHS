"""Black tents of goat and yak hair, front-on.

    .venv/bin/python scripts/art/front_tents.py artifacts/front-tents.png

Bedouin (bayt al-sha'r, Arabia and the Syrian desert) and the black tents of
the Zagros and the Maghreb: a roof of woven goat-hair strips sewn edge to
edge, lifted on a row of poles so it sags between them, guyed out to pegs on
long ropes; by day the front wall is left off and the tent stands open to the
south, the patterned curtain that divides the men's side from the women's
showing at its front end. Tibetan nomads' ba: the same cloth in yak hair,
steeper, its roof hauled up over poles standing outside the tent, a slit along
the ridge for the smoke.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, h2  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402
from art.front_huts import PAL as HUT, BUILDERS as HUT_BUILDERS, _rgb, DARK  # noqa: E402

PAL = dict(HUT)
PAL.update({k: [_rgb(c) for c in v] for k, v in {
    'goat': ['#1e1816', '#2c2420', '#3c312a', '#4e4136', '#665644', '#806e56'],
    'yak': ['#1c1a1a', '#2a2624', '#3a3430', '#4c443c', '#625849', '#7a6e5a'],
    'inside': ['#191317', '#221a1c', '#2c2224', '#3a2e2c', '#4a3c36', '#5c4c42'],
    'qata': ['#3a1210', '#6a1e16', '#9c3020', '#c4442a', '#d8623a', '#e88a58'],
    'rug': ['#2e1418', '#521e22', '#7a2c2a', '#a03e30', '#c45e3c', '#de8650'],
}.items()})


def black_tent(s):
    look = s.get('look', 'bedouin')
    tib = look == 'tibetan'
    W = s['W']
    cloth = PAL['yak' if tib else 'goat']
    bays = max(2, round(W / (44 if tib else 36)))
    eave_h = 34 if not tib else 30
    depth = 17 if not tib else 24
    mx = 24
    c = C(W + 2 * mx, eave_h + depth + 22)
    x0, x1, base = mx, mx + W, c.h - 4
    poles = [round(x0 + k * W / bays) for k in range(bays + 1)]
    sag = 5 if not tib else 3

    def drop(x):
        """How far the cloth hangs below its pole heads at x."""
        for a, b in zip(poles, poles[1:]):
            if a <= x <= b:
                t = (x - a) / max(1, b - a)
                return round(sag * math.sin(math.pi * t) ** 0.8)
        return 0

    def lean(x):
        """Which way the cloth faces at x: down toward the sag, or up to a pole."""
        for a, b in zip(poles, poles[1:]):
            if a <= x <= b:
                t = (x - a) / max(1, b - a)
                return -1 if t < 0.42 else 1 if t > 0.58 else 0
        return 0

    def eave(x):
        return base - eave_h + drop(x)

    def ridge(x):
        return base - eave_h - depth + round(drop(x) * 0.6)

    # Inside: the shade under the roof, the back wall's strips, rugs on the floor.
    ins = PAL['inside']
    for x in range(x0, x1):
        for y in range(eave(x), base + 1):
            k = 0 if y < eave(x) + 5 else 1 if y < base - 14 else 2
            if (x - x0) % 9 == 0 and y < base - 14:
                k += 1
            c.p(x, y, ins[k])
    rug = PAL['rug']
    for x in range(x0 + 4, x1 - 4):
        for y in range(base - 5, base + 1):
            q = 3 if (x // 4 + y) % 4 else 4
            if y == base - 5:
                q = 1
            c.p(x, y, rug[q] if h2(x // 22, 1, s['seed']) > 0.3 else PAL['hide-pale'][2 + (x // 3 + y) % 2])

    # The dividing curtain's front end, woven in red and pale bands.
    qx = poles[bays // 2 + (1 if bays > 3 and s['seed'] % 2 else 0)] - 5
    q = PAL['qata']
    pale = PAL['hide-pale']
    for y in range(eave(qx) + 2, base - 1):
        for x in range(qx, qx + 10):
            ly = (y - eave(qx) - 2) % 12
            band = 0 if ly < 5 else 1 if ly < 7 else 2 if ly < 11 else 1
            col = q[3] if band == 0 else pale[4] if band == 1 else PAL['inside'][3]
            if band == 0 and abs(x - qx - 4.5) + abs(ly - 2) < 2.5:
                col = pale[5]
            if x == qx + 9:
                col = q[1] if band == 0 else pale[2] if band == 1 else PAL['inside'][1]
            c.p(x, y, col)

    # Poles, lit against the dark inside.
    wood = PAL['wood']
    for i, px in enumerate(poles):
        top = eave(px) - (2 if not tib else 0)
        for y in range(top, base + 1):
            c.p(px - 1, y, wood[3]); c.p(px, y, wood[4]); c.p(px + 1, y, wood[1])

    # The roof: strips run across the tent, each lit along its upper selvage;
    # the cloth either side of a pole head turns toward or away from the light.
    seam = 5
    for x in range(x0 - 2, x1 + 2):
        xx = min(max(x, x0), x1 - 1)
        top, bot = ridge(xx), eave(xx)
        slope = -lean(xx)
        for y in range(top, bot + 1):
            row = (y - top) // seam
            k = 3 if row % 2 == 0 else 2
            if (y - top) % seam == 0:
                k += 1
            if slope > 0:
                k -= 1
            elif slope < 0:
                k += 1
            if y == top:
                k = 4
            if tib and abs(y - top - 2) <= 1 and x0 + 10 < x < x1 - 10:
                k = 0
            c.p(x, y, cloth[max(0, min(5, k))])
        for y in (bot + 1, bot + 2):
            c.p(x, y, cloth[1])
    # The ends hang down to the ground as side walls.
    for side, edge in ((-1, x0), (1, x1)):
        for y in range(eave(edge) - 2, base + 1):
            t = (y - eave(edge) + 2) / max(1, base - eave(edge) + 2)
            spread = round(3 + t * 5)
            for k in range(spread):
                x = edge + side * k if side > 0 else edge - k - 1
                col = cloth[2 if side < 0 else 1] if (y // seam) % 2 else cloth[3 if side < 0 else 1]
                c.p(x, y, col)
    # Guy ropes from the pole heads out to the pegs.
    rope = PAL['rope']
    lines = [(poles[0], -1), (poles[-1], 1)] if not tib else [(p, -1 if i <= bays // 2 else 1) for i, p in enumerate(poles)]
    for px, side in lines:
        ax, ay = px, ridge(px) + (2 if not tib else -2)
        gx = (x0 - 20 if side < 0 else x1 + 20) if not tib else px + side * (20 + abs(px - (x0 + x1) // 2) // 3)
        gx = max(2, min(c.w - 3, gx))
        n = max(1, abs(gx - ax))
        for k in range(n + 1):
            x = ax + side * k
            y = round(ay + (base - 1 - ay) * (k / n) ** 1.3)
            if c.g(x, y)[3] == 0 or y < ridge(min(max(x, x0), x1 - 1)):
                c.p(x, y, rope[2])
        c.rect(gx, base - 3, 1, 4, wood[2]); c.p(gx, base - 3, wood[4])
    if tib:
        # The poles outside the tent the roof is hauled up over.
        for px in (x0 + W // 4, x1 - W // 4):
            for y in range(ridge(px) - 10, ridge(px)):
                c.p(px, y, wood[3]); c.p(px + 1, y, wood[1])
    door = (poles[0] + poles[1]) // 2 if qx > poles[1] else (poles[-2] + poles[-1]) // 2
    return c, dict(x0=x0, W=W, base=base, door_x=door, door_h=eave_h - sag, door_width=20,
                   smoke=[[(x0 + x1) // 2, ridge((x0 + x1) // 2) - 2, 'vent']] if tib else [])


def built(fn, defaults):
    def make(spec=None, info=None):
        s = dict(seed=0)
        s.update(defaults)
        s.update(spec or {})
        c, i = fn(s)
        i.setdefault('leaf', False)
        finish(c)
        consolidate(c, rare=3)
        if info is not None:
            info.update(i)
        return c.im
    return make


BUILDERS = {'black-tent': built(black_tent, dict(W=120))}
HUT_BUILDERS.update(BUILDERS)
STUDIES = [
    ('bedouin', 'black-tent', dict(W=150)),
    ('bedouin-small', 'black-tent', dict(W=86, seed=1)),
    ('tibetan', 'black-tent', dict(W=96, look='tibetan')),
]


if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    ims = [BUILDERS[kind](spec) for _, kind, spec in STUDIES]
    a = current_adult()
    W = sum(i.width + 8 for i in ims) + a.width + 10
    H = max(i.height for i in ims) + 8
    bg = Image.new('RGBA', (W, H), (206, 186, 146, 255))
    x = 4
    for im in ims:
        bg.alpha_composite(im, (x, H - 4 - im.height)); x += im.width + 8
    bg.alpha_composite(a, (x, H - 8 - a.height))
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-tents.png'
    bg.resize((W * 3, H * 3), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
