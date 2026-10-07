"""Solids in the house projection, for anything a wall swatch cannot draw.

    .venv/bin/python scripts/art/front_solid.py artifacts/front-solid.png

The projection is Stardew's: a wall facing us is drawn square on, and
anything horizontal is seen from above at K of its depth. So a circle on the
ground is an ellipse half as tall as it is wide, a dome rises from an
elliptical foot and shows its crown, a pool shows its far inside wall above
its water, and anything that juts out shows its top. World coordinates: x
right, y back, z up; a solid stands at screen x `cx` with its foot's centre
on screen row `by`.

Three primitives cover the round and the boxy: `box` (a front face and its
top), `lathe` (any solid of revolution, ray-cast, coloured from a house
ramp by the shared light), and `recess` (a sunk opening: far wall, then
floor or water).
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, ramp, mix  # noqa: E402

K = 0.5
_L = (-0.55, -0.5, 0.68)
_n = math.sqrt(sum(v * v for v in _L))
LIGHT = tuple(v / _n for v in _L)
VOID = (36, 28, 38, 255)


def tone(n, bias=0.0):
    """A ramp index for a surface normal: stepped, as the house light is."""
    l = sum(a * b for a, b in zip(n, LIGHT)) + bias
    return 1 if l > 0.82 else 2 if l > 0.56 else 3 if l > 0.28 else 4 if l > 0.0 else 5 if l > -0.3 else 6


def _interp(profile, z):
    if z <= profile[0][0]:
        return profile[0][1]
    for (z0, r0), (z1, r1) in zip(profile, profile[1:]):
        if z <= z1:
            return r0 + (r1 - r0) * (z - z0) / max(1e-6, z1 - z0)
    return profile[-1][1]


def lathe(c, cx, by, profile, r, courses=0, ribs=0, hollow=None, fill=None, inside=None, z0=0.0, bias=0.0,
          rim=True, mask=None, surface=None):
    """A solid of revolution. `profile` is [(z, radius), ...] up from the foot.
    `courses` rings it every so many px of height and `ribs` divides it into
    so many gores, each a step darker at its joint. `hollow` = (radius at the
    top, floor z) cuts a cavity down from the top; `fill` = (z, ramp) fills
    it with water or grain to that level; `inside` colours the cavity walls.
    `z0` lifts the whole solid off the ground. `surface(x, y, z, tone)`
    optionally supplies a texture colour in the same world coordinates."""
    zmin, H = profile[0][0], profile[-1][0]
    Rm = max(rr for _, rr in profile)
    step = 0.25
    rin = hollow[0] if hollow else 0
    floor = hollow[1] if hollow else 0
    inner = inside or [mix(q, VOID, 0.55) for q in r]
    for sx in range(int(cx - Rm) - 1, int(cx + Rm) + 2):
        x = sx + 0.5 - cx
        if abs(x) > Rm:
            continue
        for sy in range(int(by - z0 - H - Rm * K) - 2, int(by - z0 + Rm * K) + 2):
            h0 = by - z0 - (sy + 0.5)
            prev = None
            y = -Rm - 1
            while y <= Rm + 1:
                z = h0 - K * y
                rho = math.hypot(x, y)
                state = None
                if zmin <= z <= H and rho <= _interp(profile, z):
                    state = 'solid'
                    if hollow and rho < rin and z > floor:
                        state = 'fill' if fill and z <= fill[0] else None
                        if state is None and prev == 'solid':
                            state = None
                if state:
                    if state == 'fill':
                        q = 2 if (x + y * 0.6) < -rin * 0.2 else 3
                        col = fill[1][q]
                    elif prev == 'above' or z >= H - step * K * 1.5:
                        q = tone((0, 0, 1), bias)
                        col = surface(x, y, z, q) if surface else r[q]
                        if rim and hollow and rho > rin - 1.2:
                            col = r[max(0, q - 1)]
                    elif prev == 'cavity':
                        n = (-x / max(rho, 1e-6), -y / max(rho, 1e-6), 0)
                        q = min(6, tone(n, bias) + 1)
                        col = inner[q]
                    else:
                        dr = (_interp(profile, z + 0.5) - _interp(profile, z - 0.5))
                        n = (x / max(rho, 1e-6), y / max(rho, 1e-6), -dr)
                        ln = math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2)
                        n = (n[0] / ln, n[1] / ln, n[2] / ln)
                        q = tone(n, bias)
                        if courses and abs((z - zmin) % courses) < 0.7 and z > zmin + 1:
                            q = min(7, q + 1)
                        if ribs:
                            a = (math.atan2(y, x) / (2 * math.pi) * ribs) % 1
                            if a < 0.12:
                                q = min(7, q + 1)
                        col = surface(x, y, z, q) if surface else r[q]
                    c.p(sx, sy, col)
                    if mask is not None:
                        mask.add((sx, sy))
                    break
                if z > H:
                    prev = 'above'
                elif hollow and rho < rin and z > floor and zmin <= z <= H:
                    prev = 'cavity'
                else:
                    prev = 'out'
                y += step


def sphere(c, cx, by, zc, R, r, squash=1.0, bias=0.0, mask=None):
    """A ball (a crown of leaves, a loaf, a fruit) centred zc above the ground."""
    n = max(6, int(R * 2))
    prof = [(zc - R * squash + 2 * R * squash * i / n,
             R * math.sqrt(max(0.0, 1 - ((2 * i / n) - 1) ** 2))) for i in range(n + 1)]
    lathe(c, cx, by, prof, r, bias=bias, mask=mask)


def dome(c, cx, by, R, r, z0=0, kind='hemi', courses=4, ribs=0, drum=0, lantern=None):
    """A dome on an elliptical foot. Kinds: hemi, pointed (the Persian
    double-shell profile), onion, beehive (mud-brick). `drum` raises it on a
    cylinder; `lantern` = (radius, height) stands a little one on the crown."""
    n = 16
    prof = []
    if drum:
        prof += [(0, R), (drum, R)]
    for i in range(n + 1):
        t = i / n
        if kind == 'pointed':
            zz, rr = t * R * 1.25, R * math.cos(t * math.pi / 2) ** 0.8
        elif kind == 'onion':
            zz, rr = t * R * 1.5, R * (1.12 * math.sin(math.pi * (0.12 + 0.88 * t)) ** 0.9) * (1 - t) ** 0.35
        elif kind == 'beehive':
            zz, rr = t * R * 1.05, R * (1 - t ** 1.6) ** 0.7
        else:
            zz, rr = t * R, R * math.sqrt(max(0.0, 1 - t * t))
        prof.append((drum + zz, max(0.0, rr)))
    lathe(c, cx, by, prof, r, courses=courses, ribs=ribs, z0=z0)
    if lantern:
        lr, lh = lantern
        top = prof[-1][0]
        lathe(c, cx, by, [(top - 3, lr), (top + lh, lr), (top + lh, lr + 1.5), (top + lh + 3, 0.5)], r, z0=z0)


def vault(c, cx, by, R, D, r, face=None, rings=7, z0=0):
    """A barrel vault lying along y, its springing on row `by` at the front:
    a half-cylinder of radius R running D back. Its curve takes the house
    light, its brick rings show as arches stepping back up the screen, and
    its front end is an arched face in the wall's colour."""
    face = face or r
    for sx in range(int(cx - R) - 1, int(cx + R) + 2):
        x = sx + 0.5 - cx
        if abs(x) > R:
            continue
        for sy in range(int(by - z0 - R - D * K) - 2, int(by - z0) + 1):
            h0 = by - z0 - (sy + 0.5)
            y = -1.0
            first = True
            while y <= D:
                z = h0 - K * y
                if 0 <= y and z >= 0 and x * x + z * z <= R * R:
                    if first or y < 0.6:
                        q = 2 if x < -R * 0.3 else 3 if x < R * 0.4 else 4
                        c.p(sx, sy, face[q])
                    else:
                        n = (x / R, 0, z / R)
                        q = tone(n)
                        if y % rings < 0.6:
                            q = min(7, q + 1)
                        c.p(sx, sy, r[q])
                    break
                first = False
                y += 0.25


def box(c, x, by, w, h, d, front, top=None, z0=0, edge=True):
    """A block with its foot's front edge on row `by`: its front face w by h,
    its top face w by d*K above that. `front` and `top` are ramps or painters
    f(c, x, y, w, h). Returns (front_top_row, top_top_row)."""
    fy = by - z0 - h
    ty = fy - round(d * K)
    top = top or front
    if callable(top):
        top(c, x, ty, w, fy - ty)
    else:
        c.rect(x, ty, w, fy - ty, top[1])
        c.rect(x, ty, w, 1, top[2])
    if callable(front):
        front(c, x, fy, w, h)
    else:
        c.rect(x, fy, w, h, front[3])
    if edge:
        tr = top if not callable(top) else None
        col = tr[0] if tr else None
        if col:
            c.rect(x, fy - 1, w, 1, col)
    return fy, ty


def recess(c, x, by, w, d, depth, wall, floor, water=None):
    """A sunk opening at ground level: we see its far inside wall (depth px
    tall) and, in front of that, its floor or the water standing in it. Its
    left inside wall is in shadow."""
    top = by - round(d * K)
    wall_h = min(depth, by - top)
    if callable(wall):
        wall(c, x, top, w, wall_h)
    else:
        c.rect(x, top, w, wall_h, wall[4])
        c.rect(x, top, w, 1, wall[5])
    fy = top + wall_h
    if fy < by:
        if water:
            c.rect(x, fy, w, by - fy, water[3])
            c.rect(x, fy, w, 1, water[1])
            for xx in range(x + 3, x + w // 2):
                c.p(xx, fy + (by - fy) // 2, water[1])
        elif callable(floor):
            floor(c, x, fy, w, by - fy)
        else:
            c.rect(x, fy, w, by - fy, floor[3])
    for yy in range(top, by):
        for k in range(3):
            q = c.g(x + k, yy)
            if q[3]:
                c.p(x + k, yy, mix(q, (40, 30, 70, 255), 0.4 - k * 0.12))
    return top


def ellipse(c, cx, cy, rx, ry, col):
    for yy in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for xx in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if ((xx + 0.5 - cx) / rx) ** 2 + ((yy + 0.5 - cy) / ry) ** 2 <= 1:
                c.p(xx, yy, col)


def make(out, zoom=3):
    from PIL import Image
    from art.front_kit import outline
    from art.reference import current_adult
    W, H = 420, 120
    c = C(W, H)
    base = 108
    clay = RAMPS['tegula']
    mud = ramp(58, 0.06, lift=-0.06)
    stone = RAMPS['travertine']
    water = ramp(222, 0.08, lift=-0.08)
    dome(c, 40, base, 24, mud, kind='beehive')
    dome(c, 100, base, 22, RAMPS['kahgel'], kind='pointed', drum=10, lantern=(3, 5))
    dome(c, 160, base, 20, ramp(232, 0.1, lift=-0.08), kind='onion', drum=8, ribs=12)
    lathe(c, 215, base, [(0, 18), (10, 18), (12, 20), (14, 20)], stone, hollow=(17, 4), fill=(11, water))
    lathe(c, 215, base, [(0, 4), (24, 3), (26, 9), (29, 9)], stone, z0=0, hollow=(8, 26), fill=(28, water))
    lathe(c, 262, base, [(0, 9), (14, 9), (15, 10), (17, 10)], stone, hollow=(8, 0))
    lathe(c, 300, base, [(0, 0.5), (4, 4), (12, 8), (20, 8), (24, 5), (27, 2), (31, 2), (32, 3)], clay,
          hollow=(2, 26))
    for i, zc in enumerate((26, 20, 22)):
        sphere(c, 340 + (i - 1) * 9, base, zc, 9, ramp(132, 0.1, lift=-0.16))
    box(c, 365, base, 40, 20, 24, RAMPS['travertine'])
    recess(c, 300, base + 0, 1, 1, 1, stone, stone)
    outline(c)
    adult = current_adult()
    im = c.im.copy()
    im.alpha_composite(adult, (W - adult.width - 2, base - adult.height))
    bg = Image.new('RGBA', im.size, (214, 206, 186, 255))
    bg.alpha_composite(im)
    bg.resize((W * zoom, H * zoom), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-solid.png')
