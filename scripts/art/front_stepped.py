"""Stepped stone: coursed and fitted masonry, paving and gravel seen from
above, tiered platforms and stairs, for temple platforms and pyramids.

    .venv/bin/python scripts/art/front_stepped.py artifacts/front-stepped.png

Every surface is drawn in ramp steps, never mixed: a course is one value
band (a lit arris, its body, a dark bed joint), a block now and then cut a
whole step lighter or darker. A tier's left end catches the light and its
right end rolls into shade by stepping the colours already laid along their
ramp (`step_rect`), so the palette stays the ramp's.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, h2  # noqa: E402

K = 0.5


def at(r, q):
    return r[max(0, min(len(r) - 1, q))]


def glyph(c, x, y, rows, pal, flip=False):
    """A hand-drawn small sprite: one character per pixel, '.' clear."""
    for j, row in enumerate(rows):
        for i, ch in enumerate(row[::-1] if flip else row):
            if ch in pal:
                c.p(x + i, y + j, pal[ch])


def step_rect(c, x, y, w, h, r, dk):
    """Move every pixel of ramp r in the rectangle dk steps along it."""
    idx = {tuple(col): i for i, col in enumerate(r)}
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            i = idx.get(tuple(c.g(xx, yy)))
            if i is not None:
                c.p(xx, yy, at(r, i + dk))


def ends(c, x, y, w, h, r, lit=2, shade=3):
    """A plane's turned ends: the left arris a step lit, the right a step
    and then two into shade."""
    step_rect(c, x, y, lit, h, r, -1)
    step_rect(c, x + w - shade, y, shade, h, r, 1)
    step_rect(c, x + w - 1, y, 1, h, r, 1)


def _cuts(n, unit, seed, row, fitted):
    out, at_, k = [], 0, 0
    if not fitted:
        at_ = -((row % 2) * unit // 2)
    while at_ < n:
        size = unit if not fitted else max(4, round(unit * (0.55 + 0.9 * h2(k, row, seed))))
        out.append((at_, at_ + size, k))
        at_ += size
        k += 1
    return out


def coursed(c, x, y, w, h, r, q=3, course=5, block=12, seed=0, fitted=False, foot=1, top=0):
    """Stone in courses, each a value band: lit arris, body, dark bed joint;
    head joints staggered, a whole block now and then a step off. `fitted`
    lays dry basalt of uneven blocks and course heights. The last `foot`
    courses step darker into the ground, the first `top` lighter."""
    rows, at_ = [], 0
    while at_ < h:
        ch = course if not fitted else course - 1 + round(2 * h2(len(rows), 3, seed))
        rows.append((at_, min(h, at_ + ch)))
        at_ += ch
    n = len(rows)
    for j, (r0, r1) in enumerate(rows):
        base = q + (1 if j >= n - foot else 0) - (1 if j < top else 0)
        for b0, b1, k in _cuts(w, block, seed + 7, j, fitted):
            v = h2(k, j, seed)
            t = base - 1 if v < 0.14 else base + 1 if v > 0.86 else base
            for xx in range(max(0, b0), min(w, b1)):
                for yy in range(r0, r1):
                    if yy == r1 - 1 and r1 - r0 > 2:
                        col = at(r, t + 2)
                    elif xx == b0 and b0 > 0:
                        col = at(r, t + 2)
                    elif yy == r0:
                        col = at(r, t - 1)
                    elif xx == b1 - 1:
                        col = at(r, t + 1)
                    else:
                        col = at(r, t)
                    c.p(x + xx, y + yy, col)


def plaster(c, x, y, w, h, r, q=2, seed=0, wear=0.0, stone=None):
    """A smooth lime skin in one value, the odd hairline of a course showing
    through, and where it has worn, patches of the stone (`stone`, a ramp)
    in courses under it."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            c.p(xx, yy, at(r, q))
    if stone is not None and wear:
        for k in range(int(w * h * wear / 90)):
            px = x + int(h2(k, 1, seed) * (w - 8))
            py = y + int(h2(k, 2, seed) * max(1, h - 4))
            pw, ph = 5 + int(h2(k, 3, seed) * 6), 3
            coursed(c, px, py, pw, ph, stone, q=q + 1, course=3, block=5, seed=seed + k)


def paving(c, x, y, w, h, r, q=1, slab=14, row=3, seed=0, lip=True):
    """Flags seen from above: rows foreshortened to `row` px, joints a step
    down, a slab now and then a step off; the front edge lit."""
    for j in range(0, h, row):
        for b0, b1, k in _cuts(w, slab, seed, j // row, True):
            v = h2(k, j, seed + 3)
            t = q + (1 if v > 0.8 else 0)
            for xx in range(max(0, b0), min(w, b1)):
                for yy in range(j, min(h, j + row)):
                    joint = yy == j + row - 1 or (xx == b0 and b0 > 0)
                    c.p(x + xx, y + yy, at(r, t + 1) if joint else at(r, t))
    if lip:
        c.rect(x, y + h - 1, w, 1, at(r, q - 1))


def gravel(c, x, y, w, h, r, q=2, seed=0, quiet=False):
    """A floor of small water-worn stones (Hawaiian ʻiliʻili), seen from
    above: each stone a lit pixel over a dark one, in loose staggered rows."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            c.p(xx, yy, at(r, q + 1))
    shape = ('.ab.', 'abbc', '.cc.')
    for j in range(0, h - 2, 3):
        for i in range(-2, w, 4):
            sx = i + (2 if j // 3 % 2 else 0)
            t = q - (1 if h2(i, j, seed) > 0.75 else 0)
            for dy, row in enumerate(shape):
                for dx, ch in enumerate(row):
                    if ch != '.' and 0 <= sx + dx < w:
                        if quiet and ch == 'c':
                            continue
                        c.p(x + sx + dx, y + j + dy, at(r, t - 1 if ch == 'a' else t if ch == 'b' else t + 1))


def tiers(c, cx, base, plan, face, top, shadow=True):
    """A stepped platform or pyramid, front-on. `plan` is [(w, h, tread)]
    bottom to top: each tier's front face h tall and, above it, as much of
    its top as shows before the next tier (tread px; the last tier's tread
    is the summit). face(c, x, y, w, h, k) and top(c, x, y, w, h, k) paint
    tier k. Each upper tier throws a short shadow right across the tread
    below it (shadow = the ramp the treads are in). Returns [(x, face_top,
    w, h, tread_top)] for each tier."""
    out, by = [], base
    for k, (w, h, tread) in enumerate(plan):
        x = cx - w // 2
        fy = by - h
        top(c, x, fy - tread, w, tread, k)
        face(c, x, fy, w, h, k)
        out.append((x, fy, w, h, fy - tread))
        by = fy - tread
    if shadow:
        for k in range(1, len(out)):
            x, fy, w, h, _ = out[k]
            lx, lfy, lw, lh, lt = out[k - 1]
            right = x + w
            n = min(4, lx + lw - right)
            if n > 0:
                step_rect(c, right, lt, n, lfy - lt, shadow, 2)
    return out


def stair(c, cx, foot, head, w, r, q=2, rise=4, bal=None, bal_w=5, bal_q=None):
    """A straight flight from `foot` up to `head`, seen from above at K: each
    step a lit tread row over its riser, the riser's foot in shadow, the
    right end turned into shade. `bal` (a ramp) adds balustrades (alfardas)
    either side, lit on their sloping tops; the left one throws its shadow
    across the treads beside it."""
    x0 = cx - w // 2
    y = foot
    while y - rise >= head - rise + 1:
        top = y - rise
        for yy in range(top, y):
            k = yy - top
            col = at(r, q - 1) if k == 0 else at(r, q + 2) if k == rise - 1 else at(r, q + 1)
            c.rect(x0, yy, w, 1, col)
        y = top
    if y > head:
        c.rect(x0, head, w, y - head, at(r, q - 1))
    ends(c, x0, head, w, foot - head, r, lit=1, shade=2)
    if bal is not None:
        bq = q if bal_q is None else bal_q
        for side in (-1, 1):
            bx = x0 - bal_w if side < 0 else x0 + w
            for yy in range(head - 2, foot):
                for i in range(bal_w):
                    t = bq - 1 if i == 0 else bq + 2 if i == bal_w - 1 else bq
                    if side > 0 and i == 0:
                        t = bq - 1
                    c.p(bx + i, yy, at(bal, t))
            c.rect(bx, head - 3, bal_w, 1, at(bal, bq - 2))
        step_rect(c, x0, head, 2, foot - head, r, 2)


def sheet(out, zoom=3):
    from PIL import Image
    from art.front_kit import finish
    from art.front_materials import ramp
    W, H = 420, 170
    c = C(W, H)
    basalt = ramp(262, 0.02, lift=-0.17)
    lime = RAMPS['limestone']
    coursed(c, 10, 20, 90, 40, basalt, q=3, course=6, block=14, fitted=True, seed=2)
    coursed(c, 110, 20, 90, 40, lime, q=2, course=5, block=12)
    paving(c, 210, 20, 90, 40, lime, q=1)
    gravel(c, 310, 20, 90, 40, basalt, q=2)
    plan = [(150, 14, 6), (128, 13, 6), (106, 12, 6), (84, 12, 16)]
    tiers(c, 110, 160, plan, lambda c, x, y, w, h, k: (coursed(c, x, y, w, h, lime, q=2, course=4, block=10, seed=k),
                                                      ends(c, x, y, w, h, lime)),
          lambda c, x, y, w, h, k: paving(c, x, y, w, h, lime, q=1, seed=k), shadow=lime)
    stair(c, 110, 160, 160 - 51 - 18, 22, lime, q=2, bal=lime, bal_w=4)
    finish(c)
    bg = Image.new('RGBA', (W, H), (122, 128, 104, 255))
    bg.alpha_composite(c.im)
    bg.resize((W * zoom, H * zoom), Image.NEAREST).convert('RGB').save(out)
    print('wrote', out)


if __name__ == '__main__':
    sheet(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-stepped.png')
