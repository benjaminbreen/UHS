"""Houses of the Andes under Inca rule.

    .venv/bin/python scripts/art/front_andes.py artifacts/front-andes.png

Highland: fieldstone laid in clay (pirca) under a steep roof of ichu grass,
one trapezoidal doorway, a niche or two in the wall. Cusco: the same house in
fitted ashlar, the blocks pillowed at their edges and every joint tight, the
doorway double-jambed as the high-status buildings were. Doorways and niches
narrow toward their lintels; there are no windows, and the door is a cloth
or a hide hung in the opening.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import ramp, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_eave as ev  # noqa: E402

FIELD = ramp(78, 0.03, lift=-0.04)
CLAY = ramp(52, 0.06, lift=-0.06)
ASHLAR = ramp(96, 0.022, lift=0.02)
ICHU = ramp(64, 0.065, lift=-0.02)
DARK = (40, 30, 38, 255)


def pirca(c, x0, y0, w, h):
    fm.rubble(c, x0, y0, w, h, FIELD, CLAY)


def inca(c, x0, y0, w, h):
    """Fitted ashlar in courses that shrink upward, each block pillowed: lit
    along its top and left, dark at its foot and right, its corners eased."""
    y, row = y0 + h, 0
    while y > y0:
        ch = max(8, 14 - row) - int(h2(row, 1, 67) * 3)
        top = max(y0, y - ch)
        x = x0 - int(h2(row, 0, 61) * 16)
        while x < x0 + w:
            bw = 12 + int(h2(x, row, 63) * 20)
            face = 2 + (h2(x, row, 65) > 0.62)
            for yy in range(top, y):
                for xx in range(max(x0, x), min(x0 + w, x + bw)):
                    a, b, A, B = xx - x, yy - top, x + bw - 1 - xx, y - 1 - yy
                    if (a + b < 2) or (A + b < 2) or (a + B < 2) or (A + B < 2) or A == 0 or B == 0:
                        col = ASHLAR[6]
                    elif min(a, b) == 0:
                        col = ASHLAR[face - 1]
                    elif B == 1 or A == 1:
                        col = ASHLAR[face + 2]
                    elif B == 2 or A == 2:
                        col = ASHLAR[face + 1]
                    else:
                        col = ASHLAR[face]
                    c.p(xx, yy, col)
            x += bw
        y, row = top, row + 1


ev.WALL['pirca'] = pirca
ev.WALL['inca'] = inca


def trapezoid(c, cx, base, wb, wt, h, fill, rim=None):
    for k in range(h):
        half = (wb + (wt - wb) * k / max(1, h - 1)) / 2
        for xx in range(round(cx - half), round(cx + half)):
            c.p(xx, base - 1 - k, fill(xx, base - 1 - k, k))
        if rim:
            c.p(round(cx - half) - 1, base - 1 - k, rim[1])
            c.p(round(cx + half), base - 1 - k, rim[4])
    if rim:
        half = wt / 2
        for xx in range(round(cx - half) - 1, round(cx + half) + 1):
            c.p(xx, base - h - 1, rim[4]); c.p(xx, base - h - 2, rim[1])


def andes_openings(h):
    """A trapezoidal doorway, double-jambed in fine work, and trapezoidal
    niches in the wall either side."""
    c, x0, W, base = h.c, h.x0, h.W, h.base
    fine = h.s['storeys'][0] == 'inca'
    r = ASHLAR if fine else FIELD
    cx = x0 + W // 2 + (0 if fine or W < 110 else -W // 6)
    h.door_x, h.door_h = cx, 44
    if fine:
        trapezoid(c, cx, base, 34, 25, 51, lambda x, y, k: r[5] if x > cx + 10 else r[4], r)
    trapezoid(c, cx, base, 24, 17, 44,
              lambda x, y, k: DARK if x > cx - 8 or k > 40 else (58, 44, 50, 255), r)
    for nx in ([cx - W // 3, cx + W // 3] if W >= 140 else [cx + (W // 3 if cx < x0 + W // 2 + 1 else -W // 3)]):
        if x0 + 10 < nx < x0 + W - 10:
            trapezoid(c, nx, base - 16, 15, 9, 21, lambda x, y, k: DARK if x > nx - 3 else (64, 50, 54, 255), r)
            op.cast(c, nx - 5, base - 15, 11, 2, 0.75)


ev.OPENINGS['andes'] = andes_openings


def andes(spec=None, info=None):
    s = dict(W=124, storeys=['pirca'], heights=[52], roof='thatch', tone='ichu', hip=False, openings='andes',
             seed=0, wear=0.3)
    s.update(spec or {})
    h = ev.VernacularHouse(s)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


ev.TONES['ichu'] = ICHU
BUILDERS = {'andes': andes}
STUDIES = [
    ('highland', 'andes', {}),
    ('highland-small', 'andes', dict(W=92, seed=2)),
    ('cusco', 'andes', dict(W=160, storeys=['inca'], heights=[56], seed=3, wear=0.15)),
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
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-andes.png'
    bg.resize((W * 2, H * 2), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
