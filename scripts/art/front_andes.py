"""Houses of the Andes under Inca rule.

    .venv/bin/python scripts/art/front_andes.py artifacts/front-andes.png

Highland: fieldstone laid in clay (pirca) under a steep roof of ichu grass,
one trapezoidal doorway, a niche or two in the wall. Cusco: the same house in
fitted ashlar, the blocks pillowed at their edges and every joint tight, the
doorway double-jambed as the high-status buildings were. Doorways and niches
narrow toward their lintels; there are no windows, and the door is a cloth
or a hide hung in the opening.

North coast (Caral to Chimu): adobe brick under mud plaster, a band painted
round the room, a flat roof, and beside the closed room an open one shaded
by cane matting on algarrobo posts, where most of the day's work was done.
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

# ------------------------------------------------------------------ north coast

def moche(spec=None, info=None):
    """A north-coast adobe house: the closed room with its painted band and a
    mat hung in the doorway, and beside it the open room under a cane-mat
    roof on posts, its back wall and floor in the mat's shade."""
    from art import front_mudbrick as mb
    from art.front_materials import C
    from art.front_kit import finish, consolidate
    s = dict(W=150, seed=0)
    s.update(spec or {})
    W, seed = s['W'], s['seed']
    pal = [mb._rgb(q) for q in ('#46362a', '#6e5844', '#968066', '#b8a286', '#d2bea2', '#e6d6bc')]
    cane = mb.PAL['straw-old']
    wood = mb.PAL['wood']
    band = mb.PAL['paint-red'] if seed % 2 == 0 else mb.PAL['ochre']
    hw, depth, mx = 48, 26, 12
    c = C(W + 2 * mx, hw + depth + 30)
    x0, x1, base = mx, mx + W, c.h - 4
    side = 1 if seed % 2 == 0 else -1
    cw = round(W * 0.56)
    rx0, rx1 = (x0, x0 + cw) if side > 0 else (x1 - cw, x1)
    ox0, ox1 = (rx1, x1) if side > 0 else (x0, rx0)

    # The open room first, so the closed room's wall stands over its edge.
    oh = hw - 6
    otop = base - oh
    mb.wall(c, ox0, ox1, otop, base, pal, mb.plaster(seed + 3), seed=seed + 3)
    for y in range(otop, base + 1):
        for x in range(ox0, ox1):
            fp_shade(c, x, y, 0.3 if y < base - 6 else 0.15)
    for x in range(ox0, ox1):
        for y in range(base - 5, base + 1):
            c.p(x, y, mb.P(pal, 3 if y > base - 5 else 4))
    mb.jar(c, ox0 + (ox1 - ox0) // 3, base - 1, 4, 11)
    md = 14
    mtop = otop - md
    for x in range(ox0 - 2, ox1 + 2):
        for y in range(mtop, otop + 1):
            k = 4 if (x - ox0) % 3 else 3
            if y == mtop:
                k = 3
            elif y >= otop - 1:
                k = 2 if y == otop - 1 else 1
            elif h2(x, y // 4, seed + 7) > 0.92:
                k -= 1
            c.p(x, y, cane[k])
    for x in range(ox0 - 2, ox1 + 2, 2):
        c.p(x, otop + 1, cane[2])
    posts = [ox0 + 2, (ox0 + ox1) // 2, ox1 - 5] if ox1 - ox0 > 56 else [ox0 + 2, ox1 - 5]
    if side > 0:
        posts = posts[1:]
    else:
        posts = posts[:-1]
    for px in posts:
        for y in range(otop + 1, base + 1):
            c.p(px, y, wood[4]); c.p(px + 1, y, wood[3]); c.p(px + 2, y, wood[1])
        c.rect(px - 1, otop + 1, 5, 2, wood[2])

    # The closed room.
    top = base - hw
    mb.wall(c, rx0, rx1, top, base, pal, mb.plaster(seed), seed=seed)
    by0 = top + 14
    for x in range(rx0, rx1):
        c.p(x, by0, band[4]); c.p(x, by0 + 5, band[1])
        for y in range(by0 + 1, by0 + 5):
            step = (x - rx0) % 12
            up = step < 6
            k = 4 if (up and y < by0 + 3) or (not up and y >= by0 + 3) else 2
            c.p(x, y, band[k])
    mb.deck(c, rx0, rx1, top, depth, pal, seed, pal)
    mb.beams(c, rx0, rx1, top + 7, pal, 13, seed)
    dcx = rx0 + round(cw * (0.4 if side > 0 else 0.6))
    info_ = mb.door(c, dcx, base - 2, 18, 38, pal, 'mat', lintel='log')
    if cw > 70:
        mb.window(c, rx1 - 20 if side > 0 else rx0 + 8, top + 24, 10, 8, pal, 'lattice')
    mb.mat(c, rx0 + 8, top - depth + 10, min(22, cw - 20), 5, grain=mb.PAL['date'] if seed % 3 else None)
    finish(c)
    consolidate(c, rare=3)
    if info is not None:
        info.update(x0=x0, W=W, base=base, door_x=dcx, door_h=info_['door_h'], leaf=False)
    return c.im


def fp_shade(c, x, y, k):
    from art import front_parts as fp
    fp.shade(c, x, y, k)


BUILDERS = {'andes': andes, 'moche': moche}
STUDIES = [
    ('highland', 'andes', {}),
    ('highland-small', 'andes', dict(W=92, seed=2)),
    ('cusco', 'andes', dict(W=160, storeys=['inca'], heights=[56], seed=3, wear=0.15)),
    ('moche', 'moche', {}),
    ('moche-small', 'moche', dict(W=110, seed=1)),
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
