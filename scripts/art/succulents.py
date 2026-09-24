"""Cacti and other succulents, worldwide. Stems are shaded as lit capsules
(light from the upper left, as elsewhere), ribs run along each stem, spines
are a few pale pixels. Shrub-sized ones are `nature-shrub-<flora id>`; the
tall ones are trees. Shadows are baked from the silhouette by shadows.py."""
from PIL import Image
import math
import random
from art.shrubs import ramp
from art.canopy import rgb

L = (-0.55, -0.62, 0.56)


def _new(w, h):
    return Image.new('RGBA', (w, h))


def _put(im, x, y, c):
    x, y = int(round(x)), int(round(y))
    if 1 <= x < im.width - 1 and 1 <= y < im.height - 1:
        im.putpixel((x, y), rgb(c))


def _opaque(im, x, y):
    return 0 <= x < im.width and 0 <= y < im.height and im.getpixel((x, y))[3]


def _stem(im, pal, a, b, r, ribs=0, spine=None, rng=None, density=0.25, taper=0.0):
    """A capsule from a to b, radius r (shrinking by `taper` towards b).
    Returns ridge pixels, for spines and flowers."""
    (ax, ay), (bx, by) = a, b
    dx, dy = bx - ax, by - ay
    ln2 = dx * dx + dy * dy or 1
    ln = math.sqrt(ln2)
    ridges = []
    x0, x1 = int(min(ax, bx) - r - 2), int(max(ax, bx) + r + 2)
    y0, y1 = int(min(ay, by) - r - 2), int(max(ay, by) + r + 2)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / ln2))
            rr = r * (1 - taper * t)
            px, py = ax + dx * t, ay + dy * t
            ox, oy = x - px, y - py
            d = math.hypot(ox, oy)
            if d > rr + 0.35:
                continue
            nx, ny = ox / rr, oy / rr
            m = min(1.0, math.hypot(nx, ny))
            nz = math.sqrt(max(0.0, 1 - m * m))
            light = nx * L[0] + ny * L[1] + nz * L[2]
            tone = 1.6 + light * 4.2
            if ribs:
                # Signed offset across the stem, so ribs run along its length.
                side = (ox * -dy + oy * dx) / ln / rr
                ang = math.asin(max(-1.0, min(1.0, side)))
                f = (ang / math.pi + 0.5) * ribs
                frac = f - math.floor(f)
                if frac < 0.22:
                    tone -= 1.4
                elif 0.45 < frac < 0.7:
                    tone += 0.8
                    ridges.append((x, y))
            if d > rr - 0.9:
                tone = 0 if light < 0.35 else 1
            _put(im, x, y, pal[max(0, min(6, round(tone)))])
    if spine and rng:
        for x, y in ridges:
            if rng.random() < density and (x + y) % 3 == 0:
                _put(im, x, y, spine)
    return ridges


def _pad(im, pal, cx, cy, rx, ry, tilt, rng, areole, spine):
    """A prickly-pear pad: a flat oval, lit across its face, dotted with areoles."""
    c, s = math.cos(tilt), math.sin(tilt)
    for y in range(int(cy - max(rx, ry) - 1), int(cy + max(rx, ry) + 2)):
        for x in range(int(cx - max(rx, ry) - 1), int(cx + max(rx, ry) + 2)):
            u = ((x - cx) * c + (y - cy) * s) / rx
            v = (-(x - cx) * s + (y - cy) * c) / ry
            e = u * u + v * v
            if e > 1.05:
                continue
            gx, gy = (x - cx) / max(rx, ry), (y - cy) / max(rx, ry)
            light = 0.55 - gx * 0.45 - gy * 0.5 - e * 0.25
            tone = 2 + light * 3.2
            if e > 0.72:
                tone = 0 if gx + gy > -0.2 else 1
            elif e > 0.5 and gx + gy < -0.3:
                tone = 5
            _put(im, x, y, pal[max(0, min(6, round(tone)))])
    for i in range(-3, 4):
        for j in range(-3, 4):
            u, v = (i + (j % 2) * 0.5) * 0.3, j * 0.3
            if u * u + v * v > 0.6 or rng.random() < 0.25:
                continue
            x, y = cx + (u * rx) * c - (v * ry) * s, cy + (u * rx) * s + (v * ry) * c
            _put(im, x, y, areole)
            _put(im, x - 1, y - 1, spine)


def _blob(im, pal, cx, cy, rx, ry, lit=0.55):
    for y in range(int(cy - ry - 1), int(cy + ry + 2)):
        for x in range(int(cx - rx - 1), int(cx + rx + 2)):
            u, v = (x - cx) / rx, (y - cy) / ry
            e = u * u + v * v
            if e > 1.02:
                continue
            nz = math.sqrt(max(0, 1 - e))
            light = u * L[0] + v * L[1] + nz * L[2]
            tone = 1.5 + light * 4.4 * lit / 0.55
            if e > 0.8:
                tone = 0 if light < 0.3 else 1
            _put(im, x, y, pal[max(0, min(6, round(tone)))])


def _flower(im, x, y, petal, centre, big=False):
    for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)) + (((-1, -1), (1, -1), (-1, 1), (1, 1)) if big else ()):
        _put(im, x + dx, y + dy, petal[4 if dx + dy < 0 else 3])
    _put(im, x, y, centre)


def _leaf(im, pal, base, tip, w, teeth=None, spots=None, rng=None):
    """A fleshy tapering leaf, lit on its upper-left edge."""
    (bx, by), (tx, ty) = base, tip
    n = int(max(abs(tx - bx), abs(ty - by)) * 2) + 1
    dx, dy = tx - bx, ty - by
    ln = math.hypot(dx, dy) or 1
    px, py = -dy / ln, dx / ln
    lit_side = 1 if px * L[0] + py * L[1] > 0 else -1
    for i in range(n + 1):
        t = i / n
        cx, cy = bx + dx * t, by + dy * t
        hw = w * (1 - t) ** 0.8
        k = -hw
        while k <= hw + 0.01:
            edge = abs(k) > hw - 0.8
            if edge:
                tone = 5 if (k > 0) == (lit_side > 0) else 0
            else:
                tone = 4 if (k > 0) == (lit_side > 0) else 2
                if abs(k) < 0.5:
                    tone = 3
            _put(im, cx + px * k, cy + py * k, pal[tone])
            k += 0.5
        if teeth and i % 5 == 3 and hw > 0.8:
            _put(im, cx + px * (hw + 1) * lit_side, cy + py * (hw + 1) * lit_side, teeth)
        if spots and rng and 0.15 < t < 0.7 and rng.random() < 0.18:
            _put(im, cx + px * rng.uniform(-hw * 0.6, hw * 0.6), cy + py * rng.uniform(-hw * 0.6, hw * 0.6), spots)
    _put(im, tx, ty, pal[0])


def _rng(name):
    return random.Random(sum(ord(c) * (i + 7) for i, c in enumerate(name)))


SAG = ramp('#4a8a54')
CREAM = '#efe6c4'


def saguaro(arms, seed):
    rng = random.Random(seed)
    im = _new(44, 90)
    parts = []
    for side, y_elbow, top in arms:
        x = 22 + side * 11
        parts.append(((22, y_elbow), (x, y_elbow), 3.4))
        parts.append(((x, y_elbow), (x, top), 3.6))
    order = sorted(parts, key=lambda p: -p[1][1])
    trunk = ((22, 84), (22, 10 + (0 if arms else 8)), 5.6)
    ridges = []
    for a, b, r in order:
        ridges += _stem(im, SAG, a, b, r, ribs=5)
    ridges += _stem(im, SAG, *trunk, ribs=8)
    for x, y in ridges:
        if rng.random() < 0.2 and (x * 3 + y) % 4 == 0:
            _put(im, x, y, CREAM)
    # Ragged, dry skin at the foot of an old column.
    for y in range(78, 86):
        for x in range(17, 28):
            if _opaque(im, x, y) and rng.random() < 0.25:
                _put(im, x, y, '#6e5a3a' if y > 81 else SAG[1])
    if arms:
        for x, y in ((20, 7), (23, 6), (25, 8)):
            _flower(im, x, y + 3, ramp('#f4f0e2'), '#e8c040')
    return im


def organ_pipe(id_):
    rng = _rng(id_)
    pal = ramp('#4f8a5a')
    im = _new(46, 58)
    stems = [(-15, 30), (-10, 14), (-5, 8), (0, 4), (6, 10), (11, 18), (16, 28)]
    for k, (dx, top) in enumerate(sorted(stems, key=lambda s: -s[1])):
        bx = 23 + dx * 0.3
        tx = 23 + dx
        _stem(im, pal, (bx, 54), (tx, top + 4), 2.9 if abs(dx) > 10 else 3.3, ribs=4, spine=CREAM, rng=rng, density=0.3)
    for dx, top in stems[1:6:2]:
        _flower(im, 23 + dx, top + 2, ramp('#e8a0b8'), '#f4e6a0')
    return im


def cardon_andino(id_):
    rng = _rng(id_)
    pal = ramp('#5f8a68')
    im = _new(34, 60)
    _stem(im, pal, (17, 42), (24, 40), 3.2)
    _stem(im, pal, (24, 40), (27, 34), 3.3)
    _stem(im, pal, (27, 36), (27, 20), 3.4, ribs=5, spine='#f4f0e6', rng=rng, density=0.55)
    _stem(im, pal, (17, 56), (17, 8), 5, ribs=9, spine='#f4f0e6', rng=rng, density=0.55)
    for x in range(13, 21):
        for y in range(5, 11):
            if _opaque(im, x, y) and rng.random() < 0.5:
                _put(im, x, y, '#e8e0cc')
    _flower(im, 16, 7, ramp('#f6f2ea'), '#e0c060', big=True)
    return im


def prickly_pear(id_, fruit='#b8285a', flower=None):
    rng = _rng(id_)
    pal = ramp('#5f9a4c')
    im = _new(44, 36)
    pads = [(12, 22, 7, 9, -0.5), (31, 23, 7, 9, 0.45), (21, 18, 8, 11, 0.05),
            (9, 11, 5, 7, -0.7), (28, 9, 5.5, 7, 0.4), (19, 6, 4.5, 5.5, -0.1), (22, 29, 7, 5, 0)]
    for cx, cy, rx, ry, tilt in pads:
        _pad(im, pal, cx, cy, rx, ry, tilt, rng, pal[1], CREAM)
    tops = [(7, 5), (11, 5), (26, 3), (30, 3), (19, 1), (32, 15)]
    fr = ramp(fruit)
    for x, y in tops:
        if flower and rng.random() < 0.5:
            _flower(im, x, y + 1, ramp(flower), '#c86020', big=True)
        else:
            _put(im, x, y + 1, fr[3]); _put(im, x + 1, y + 1, fr[2]); _put(im, x, y + 2, fr[2]); _put(im, x + 1, y + 2, fr[1])
            _put(im, x, y, fr[5])
    return im


def cholla(id_):
    """Teddy-bear cholla: a dark, dead-jointed trunk under a dense head of
    short joints whose spines glow straw-gold against the light."""
    rng = _rng(id_)
    pal = ramp('#a4a86a')
    dead = ramp('#4a3a2e')
    im = _new(30, 40)
    _stem(im, dead, (15, 37), (15, 20), 3)
    for y in range(24, 36, 2):
        _put(im, 13 + y % 3, y, dead[3])
    joints = []
    for _ in range(26):
        x, y = rng.gauss(15, 4.2), rng.gauss(14, 4.5)
        if not (3 < x < 27 and 3 < y < 26):
            continue
        a = rng.uniform(-0.9, 0.9) + (x - 15) * 0.05
        joints.append(((x, y + 2), (x + math.sin(a) * 4, y + 2 - math.cos(a) * 4)))
    for a, b in sorted(joints, key=lambda j: j[0][1]):
        _stem(im, pal, a, b, 2.6)
    # Repaint the head as one fuzzy mass: the spines, not the joints, are what
    # the eye sees, with a dark notch where joints overlap.
    head = {(x, y) for y in range(28) for x in range(im.width) if _opaque(im, x, y)}
    for x, y in head:
        edge = any((x + dx, y + dy) not in head for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        lit = (15 - x) * 0.08 + (14 - y) * 0.09 + rng.uniform(-0.5, 0.5)
        if edge:
            t = 4 if lit > 0.2 else 1 if lit > -0.4 else 0
        else:
            t = 5 if lit > 0.5 else 4 if lit > -0.1 else 3 if lit > -0.7 else 2
            if lit > 0 and rng.random() < 0.18:
                t = 6
        if not edge and im.getpixel((x, y))[:3] == rgb(pal[0]) and rng.random() < 0.5:
            t = 1
        _put(im, x, y, pal[t])
    for x, y in head:
        if (x + 1, y) not in head and rng.random() < 0.5:
            _put(im, x + 1, y, pal[3])
        if (x, y - 1) not in head and rng.random() < 0.5:
            _put(im, x, y - 1, pal[5])
    for x in (5, 24, 26):
        _blob(im, pal, x, 36, 1.8, 1.3)
    return im


def barrel(id_):
    rng = _rng(id_)
    pal = ramp('#4f8a56')
    im = _new(24, 28)
    for y in range(4, 26):
        for x in range(2, 22):
            u, v = (x - 12) / 8.5, (y - 15.5) / 10.5
            e = u * u + v * v
            if e > 1 or y < 5:
                continue
            nz = math.sqrt(1 - e)
            light = u * L[0] + v * L[1] + nz * L[2]
            f = ((math.asin(max(-1, min(1, u))) / math.pi + 0.5) * 11) % 1
            tone = 1.6 + light * 4.2 + (-1.4 if f < 0.2 else 0.7 if 0.45 < f < 0.7 else 0)
            if e > 0.82:
                tone = 0 if light < 0.35 else 1
            _put(im, x, y, pal[max(0, min(6, round(tone)))])
            if 0.45 < f < 0.7 and y % 3 == 0 and e < 0.8:
                _put(im, x, y, '#c85a3a' if rng.random() < 0.6 else '#e8c0a0')
    fl = ramp('#e8a030')
    for x in (8, 11, 14, 16):
        _put(im, x, 4, fl[4]); _put(im, x + 1, 4, fl[3]); _put(im, x, 5, fl[2])
    _put(im, 12, 3, '#f4e070')
    return im


def hedgehog(id_):
    rng = _rng(id_)
    pal = ramp('#5a8a4c')
    im = _new(28, 20)
    for dx, h in sorted([(-7, 7), (-2, 10), (4, 9), (9, 6), (1, 5)], key=lambda s: s[1]):
        _stem(im, pal, (14 + dx, 17), (14 + dx, 17 - h), 2.8, ribs=4, spine='#e8dcc0', rng=rng, density=0.6)
    fl = ramp('#d0408a')
    for x, y in ((12, 5), (18, 7), (7, 9)):
        _flower(im, x, y, fl, '#f0d040', big=True)
    return im


def ocotillo(id_):
    rng = _rng(id_)
    stem = ramp('#6e6a4e')
    leaf = ramp('#6a9a3a')
    im = _new(44, 54)
    for k in range(13):
        a = -0.62 + 1.24 * k / 12 + rng.uniform(-0.05, 0.05)
        ln = rng.uniform(36, 49)
        pts = [(22 + math.sin(a) * ln * (t / 40) * (1 + 0.25 * t / 40), 51 - math.cos(a) * ln * t / 40) for t in range(41)]
        for i, (x, y) in enumerate(pts):
            _put(im, x, y, stem[2 if a > 0 else 3])
            if i < 14:
                _put(im, x + 1, y, stem[1])
            if 8 <= i <= 36 and i % 4 == 0:
                _put(im, x - 1, y, leaf[4]); _put(im, x + 1, y - 1, leaf[2])
        x, y = pts[-1]
        _put(im, x, y, '#e04a2a'); _put(im, x, y - 1, '#f07a3a'); _put(im, x + (1 if a > 0 else -1), y - 2, '#c8321e')
    return im


def aloe(id_, leaf='#6a9a78', flower='#e8602a', stalks=2, trunk=0, n=13):
    rng = _rng(id_)
    pal = ramp(leaf)
    im = _new(40, 44 + trunk)
    by = im.height - 5 - trunk
    if trunk:
        _stem(im, ramp('#6a5a44'), (20, im.height - 3), (20, by + 2), 3)
        # A skirt of dead leaves down the trunk.
        for y in range(by + 2, im.height - 6, 2):
            _put(im, 17, y, '#8a7050'); _put(im, 23, y + 1, '#6a5438')
    fl = ramp(flower)
    for k in range(stalks):
        sx = 20 + (k * 2 - stalks + 1) * 4
        top = by - 30 + rng.randrange(0, 5)
        for y in range(top + 7, by - 4):
            _put(im, sx + (y - by) * 0.08 * (k * 2 - stalks + 1), y, pal[1])
        for i in range(10):
            y = top + i
            w = max(0, 1 - abs(i - 3) // 3)
            for x in range(-w - 1, w + 2):
                _put(im, sx + x, y, fl[4 if x < 0 else 2 if x > 0 else 3] if i < 7 else fl[5])
            _put(im, sx - w - 1, y, fl[1] if i % 2 else fl[3])
    leaves = []
    for i in range(n):
        a = -1.35 + 2.7 * i / (n - 1) + rng.uniform(-0.06, 0.06)
        ln = rng.uniform(11, 15) * (1 - abs(a) * 0.12)
        leaves.append(a)
    for a in sorted(leaves, key=lambda a: -abs(a)):
        ln = 13 * (1 - abs(a) * 0.15)
        tip = (20 + math.sin(a) * ln * 1.2, by - math.cos(a) * ln * 0.9 + abs(a) * 3)
        _leaf(im, pal, (20 + math.sin(a) * 2, by), tip, 3.4, teeth=ramp('#e0a080')[4], spots=pal[6], rng=rng)
    return im


def desert_rose(id_):
    rng = _rng(id_)
    bark = ramp('#a89478')
    leaf = ramp('#4f8a3a')
    fl = ramp('#e0507a')
    im = _new(38, 34)
    _blob(im, bark, 19, 25, 9, 6.5)
    for a, b in (((13, 22), (6, 10)), ((19, 20), (18, 6)), ((25, 22), (31, 11)), ((22, 21), (26, 8))):
        _stem(im, bark, a, b, 2.6, taper=0.35)
    for x, y in ((6, 10), (18, 6), (31, 11), (26, 8)):
        for dx, dy in ((-3, -1), (3, -1), (-2, -3), (2, -3), (0, -4)):
            _leaf(im, leaf, (x, y), (x + dx, y + dy), 1.2)
        _flower(im, x + rng.choice((-1, 1)), y - 2, fl, '#f6e0e8', big=True)
    return im


def welwitschia(id_):
    rng = _rng(id_)
    pal = ramp('#6a7a4a')
    dry = ramp('#8a6a4a')
    im = _new(52, 22)
    for side in (-1, 1):
        for strip in range(5):
            y0 = 12 + strip - 2
            x = 26 + side * 3
            y = y0
            for i in range(15 + rng.randrange(0, 5)):
                x += side
                y += rng.choice((0, 0, 0, 1 if strip > 2 else -1 if strip < 2 else 0))
                t = pal if i < 11 else dry
                _put(im, x, y, t[5 if strip == 0 else 3 if strip < 3 else 2])
                _put(im, x, y + 1, t[1])
    _blob(im, ramp('#5a4a38'), 26, 13, 5, 3)
    for x in (23, 27, 29):
        _put(im, x, 10, '#b84a3a'); _put(im, x, 11, '#8a2a24')
    return im


def spurge_mound(id_, leaf='#6a9a5a', flower='#e8d040'):
    """Resin spurge: a dome of upright four-angled stems."""
    rng = _rng(id_)
    pal = ramp(leaf)
    im = _new(40, 30)
    stems = [(x, 8 + (abs(x - 20) ** 1.6) * 0.18 + rng.uniform(-1, 1)) for x in range(5, 36, 3)]
    for x, top in sorted(stems, key=lambda s: -abs(s[0] - 20)):
        _stem(im, pal, (20 + (x - 20) * 0.8, 27), (x, top), 1.8, ribs=2)
        _put(im, x, top - 1, flower)
    return im


def spurge_pencil(id_):
    """A clump of leafless ribbed spurge stems, branching upward."""
    rng = _rng(id_)
    pal = ramp('#7a9a4a')
    im = _new(40, 48)
    segs = []
    def grow(x, y, ang, ln, depth):
        nx, ny = x + math.sin(ang) * ln, y - math.cos(ang) * ln
        segs.append(((x, y), (nx, ny), 1.8 + depth * 0.5))
        if depth:
            grow(nx, ny, ang - 0.35 + rng.uniform(-0.1, 0.1), ln * 0.75, depth - 1)
            grow(nx, ny, ang * 0.3 + 0.2 + rng.uniform(-0.1, 0.1), ln * 0.8, depth - 1)
    for ang in (-0.35, 0.05, 0.4):
        grow(20, 45, ang, 14, 2)
    for a, b, r in sorted(segs, key=lambda s: -s[1][1]):
        _stem(im, pal, a, b, r, ribs=3, spine='#3a3a2a', rng=rng, density=0.3)
    return im


def pigface(id_):
    rng = _rng(id_)
    pal = ramp('#5a9a4a')
    im = _new(40, 18)
    for k in range(34):
        x, y = rng.uniform(5, 35), rng.uniform(7, 15)
        if ((x - 20) / 16) ** 2 + ((y - 11) / 5) ** 2 > 1:
            continue
        a = rng.uniform(-1.2, 1.2)
        _leaf(im, pal, (x, y + 2), (x + math.sin(a) * 4, y - math.cos(a) * 3), 1.1)
        if rng.random() < 0.15:
            _put(im, x + 2, y - 2, '#b8283a')
    fl = ramp('#d8409a')
    for x, y in ((11, 7), (22, 5), (29, 8), (17, 11)):
        _flower(im, x, y, fl, '#f4d840', big=True)
    return im


def houseleek(id_):
    rng = _rng(id_)
    pal = ramp('#6a9a5a')
    tip = '#a03a5a'
    im = _new(34, 20)
    for cx, cy, r in ((9, 11, 6), (22, 10, 7.5), (15, 15, 4.5), (28, 15, 4)):
        n = 10
        for i in range(n):
            a = i / n * math.tau + rng.uniform(-0.1, 0.1)
            x, y = cx + math.cos(a) * r, cy + math.sin(a) * r * 0.55
            _leaf(im, pal, (cx, cy), (x, y), 2.2)
            _put(im, x, y, tip)
        _put(im, cx, cy, pal[5]); _put(im, cx - 1, cy, pal[4])
    return im


def woolly_cushion(id_):
    rng = _rng(id_)
    wool = ramp('#d8d4c8')
    im = _new(40, 22)
    for cx, cy in sorted([(8, 15), (14, 11), (21, 9), (28, 11), (33, 15), (12, 17), (20, 15), (27, 17)], key=lambda p: p[1]):
        _blob(im, wool, cx, cy, 4.2, 3.6)
        for _ in range(3):
            _put(im, cx + rng.randint(-2, 2), cy + rng.randint(-2, 1), '#d8a040')
    for x, y in ((14, 7), (28, 7)):
        _flower(im, x, y, ramp('#d83a3a'), '#f0c040')
    return im


def candelabra():
    rng = random.Random(41)
    pal = ramp('#4f7a4a')
    bark = ramp('#6e6a5a')
    im = _new(72, 84)
    _stem(im, bark, (36, 81), (36, 50), 4.6)
    arms = []
    for k in range(9):
        a = -1.1 + 2.2 * k / 8
        x0 = 36 + math.sin(a) * 4
        el = (36 + math.sin(a) * (12 + abs(a) * 12), 52 - math.cos(a) * 10 + abs(a) * 6)
        top = 6 + a * a * 16 + rng.uniform(-2, 3)
        arms.append(((x0, 50), el, top))
    for (x0, y0), (ex, ey), top in sorted(arms, key=lambda s: abs(s[1][0] - 36)):
        _stem(im, bark, (x0, y0), (ex, ey), 2.8)
        # Segments pinch where a season's growth began.
        y = ey
        while y > top:
            ny = max(top, y - rng.uniform(8, 11))
            _stem(im, pal, (ex, y), (ex, ny), 3, ribs=2, spine='#2a3a24', rng=rng, density=0.25)
            y = ny
        _put(im, ex, top - 1, '#c8b040')
    return im


def quiver_tree():
    rng = random.Random(43)
    bark = ramp('#c8a860')
    pal = ramp('#8aa8a0')
    im = _new(64, 78)
    _stem(im, bark, (32, 75), (32, 44), 6, taper=0.3)
    for y in range(46, 74, 3):
        _put(im, 30 + y % 2, y, bark[1]); _put(im, 31, y + 1, bark[2])
    tips = []
    def fork(x, y, ang, ln, w, depth):
        nx, ny = x + math.sin(ang) * ln, y - math.cos(ang) * ln
        _stem(im, bark, (x, y), (nx, ny), w)
        if depth:
            fork(nx, ny, ang - 0.4, ln * 0.8, w * 0.72, depth - 1)
            fork(nx, ny, ang + 0.4, ln * 0.8, w * 0.72, depth - 1)
        else:
            tips.append((nx, ny))
    fork(32, 44, -0.5, 10, 3.4, 3)
    fork(32, 44, 0.5, 10, 3.4, 3)
    for x, y in sorted(tips, key=lambda p: p[1]):
        for a in (-1.2, -0.7, -0.25, 0.25, 0.7, 1.2, -0.45, 0.45, 0):
            _leaf(im, pal, (x, y), (x + math.sin(a) * 5, y - math.cos(a) * 4 + abs(a) * 2), 1.6)
        _put(im, x, y - 1, pal[6])
    return im


def succulent_shrubs():
    return {
        'nature-shrub-prickly-pear': prickly_pear('prickly-pear', flower='#f0d040'),
        'nature-shrub-nopal': prickly_pear('nopal', fruit='#c83a2a'),
        'nature-shrub-cholla': cholla('cholla'),
        'nature-shrub-barrel-cactus': barrel('barrel-cactus'),
        'nature-shrub-hedgehog-cactus': hedgehog('hedgehog-cactus'),
        'nature-shrub-ocotillo': ocotillo('ocotillo'),
        'nature-shrub-organ-pipe': organ_pipe('organ-pipe'),
        'nature-shrub-pasacana': cardon_andino('pasacana'),
        'nature-shrub-woolly-cushion': woolly_cushion('woolly-cushion'),
        'nature-shrub-aloe-vera': aloe('aloe-vera', flower='#f0c040', stalks=1, n=9),
        'nature-shrub-cape-aloe': aloe('cape-aloe', leaf='#7a9a70', stalks=3, trunk=10, n=11),
        'nature-shrub-desert-rose': desert_rose('desert-rose'),
        'nature-shrub-welwitschia': welwitschia('welwitschia'),
        'nature-shrub-resin-spurge': spurge_mound('resin-spurge'),
        'nature-shrub-leafless-spurge': spurge_pencil('leafless-spurge'),
        'nature-shrub-pigface': pigface('pigface'),
        'nature-shrub-sour-fig': pigface('sour-fig'),
        'nature-shrub-houseleek': houseleek('houseleek'),
    }


def succulent_trees():
    return {
        'nature-saguaro': saguaro([(-1, 50, 30), (1, 42, 24)], 1),
        'nature-saguaro-2': saguaro([], 2),
        'nature-saguaro-3': saguaro([(-1, 56, 36), (1, 46, 26), (1, 62, 44)], 3),
        'nature-candelabra-spurge': candelabra(),
        'nature-quiver-tree': quiver_tree(),
    }
