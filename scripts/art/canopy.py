"""Broadleaf trees grown from a branching skeleton. Foliage sits on the branch
tips and is lit as one mass, so a crown takes the shape of its limbs rather
than of a few ovals; the bare winter tree is the same skeleton with twigs.
Native pixels, opaque palette, light from the upper left."""
from PIL import Image
import math
import random

# Hue turns with value: teal in the shade, yellow in the light.
LEAF = ['#0f2e2a', '#1a4a34', '#276a36', '#3c8a33', '#62a937', '#95c646', '#c8df69']
WOOD = ['#2a1a16', '#4a2e20', '#6e4528', '#946233', '#b98445', '#d8ab62']
LIGHT = (-0.52, -0.66, 0.54)


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def skeleton(rng, base, height, levels, trunk_w, lean=0.0, spread=0.72):
    """Tapered segments (x0,y0,x1,y1,w0,w1,depth) and the tips they end in."""
    segs, tips = [], []

    def grow(x, y, ang, length, w, depth):
        # Two half-steps with a bend between them: limbs are never ruled lines.
        a1 = ang + rng.uniform(-0.16, 0.16)
        mx, my = x + math.sin(a1) * length * 0.5, y - math.cos(a1) * length * 0.5
        a2 = a1 + rng.uniform(-0.28, 0.28)
        ex, ey = mx + math.sin(a2) * length * 0.5, my - math.cos(a2) * length * 0.5
        wm, we = w * 0.86, w * 0.7
        segs.append((x, y, mx, my, w, wm, depth))
        segs.append((mx, my, ex, ey, wm, we, depth))
        if depth >= levels or we < 0.9:
            tips.append((ex, ey, depth, a2))
            return
        # The low forks keep a leader going up between the side limbs, or the
        # crown comes out as a flat table.
        n = 3 if depth < 2 else 2
        fan = [-1, 1] if n == 2 else [-1, rng.uniform(-0.2, 0.2), 1]
        for f in fan:
            side = abs(f) == 1
            child = a2 * 0.6 + f * (rng.uniform(0.45, 0.85) if side else 1) * spread + rng.uniform(-0.12, 0.12)
            child = max(-1.25, min(1.25, child))
            reach = rng.uniform(0.62, 0.8) if side else rng.uniform(0.85, 1.0)
            grow(ex, ey, child, length * reach, we * (0.9 if n == 2 else 0.8), depth + 1)

    grow(base[0], base[1], lean, height * 0.27, trunk_w, 0)
    return segs, tips


def roots(rng, base, trunk_w):
    out = []
    for side in (-1, 1, rng.choice((-0.35, 0.35))):
        ex = base[0] + side * trunk_w * rng.uniform(0.95, 1.3)
        ey = base[1] + trunk_w * rng.uniform(0.28, 0.45)
        out.append((base[0] + side * trunk_w * 0.2, base[1] - trunk_w * 0.5, ex, ey, trunk_w * 0.55, 1.0, 0))
    return out


def paint_wood(size, segs, rng):
    """Stamp discs along each segment into a height field, then light it as
    a cylinder. Returns {(x,y): tone}."""
    W, H = size
    best = {}
    for x0, y0, x1, y1, w0, w1, _ in segs:
        steps = max(2, int(math.hypot(x1 - x0, y1 - y0) * 2))
        for i in range(steps + 1):
            t = i / steps
            cx, cy, r = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, max(0.5, (w0 + (w1 - w0) * t) / 2)
            for py in range(int(cy - r - 1), int(cy + r + 2)):
                for px in range(int(cx - r - 1), int(cx + r + 2)):
                    if not (0 <= px < W and 0 <= py < H):
                        continue
                    dx, dy = px + 0.5 - cx, py + 0.5 - cy
                    d2 = dx * dx + dy * dy
                    if d2 > r * r + 0.2:
                        continue
                    z = math.sqrt(max(0.0, r * r - d2))
                    if (px, py) not in best or best[(px, py)][0] < z + r:
                        best[(px, py)] = (z + r, dx / (r + 0.5), dy / (r + 0.5), r)
    tones = {}
    for (px, py), (_, nx, ny, r) in best.items():
        if r < 1.1:
            tones[(px, py)] = 2 if r < 0.8 else 1
            continue
        v = nx * LIGHT[0] * 1.5 + ny * LIGHT[1] * 0.35
        tone = 4 if v > 0.42 else 3 if v > 0.08 else 2 if v > -0.38 else 1
        # Bark: broken vertical furrows on the thick wood only.
        if r > 2.4 and (px * 7 + (py // 5) * 3) % 4 == 0 and rng.random() < 0.7:
            tone = max(1, tone - 1)
        if r > 3 and tone == 4 and (py + px) % 7 == 0:
            tone = 5
        tones[(px, py)] = tone
    for (px, py) in list(tones):
        if any((px + a, py + b) not in best for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))) and best[(px, py)][3] >= 1.6:
            tones[(px, py)] = 0
    return tones


def clumps_for(rng, segs, tips, R, base_y, top_y):
    """Leaf masses: one on every tip, more along the outer limbs, a few deep
    ones to close the middle. (x, y, r, z, lobes)"""
    out = []

    def add(x, y, r, zbias=0.0):
        yn = (y - top_y) / max(1.0, base_y - top_y)
        lobes = (rng.uniform(0, 6.3), rng.uniform(0, 6.3), rng.uniform(0.08, 0.17), rng.uniform(0.05, 0.11))
        out.append((x, y - r * 0.35, r, yn * R * 2.2 + rng.uniform(0, R * 0.7) + zbias, lobes))

    low = sorted(y for _, y, *_ in tips)[len(tips) // 2]
    for x, y, *_ in tips:
        add(x, y, R * rng.uniform(0.85, 1.2))
        # The lowest boughs hang: a skirt of leaves below them hides the fork.
        if y >= low:
            add(x + rng.uniform(-2, 2), y + R * rng.uniform(0.7, 1.1), R * rng.uniform(0.7, 0.95), R)
        if rng.random() < 0.7:
            add(x + rng.uniform(-R, R) * 0.8, y + rng.uniform(-R, R * 0.4) * 0.8, R * rng.uniform(0.6, 0.85))
    deepest = max(s[6] for s in segs)
    for x0, y0, x1, y1, _, _, depth in segs:
        if depth >= max(2, deepest - 1):
            add((x0 + x1) / 2 + rng.uniform(-2, 2), (y0 + y1) / 2, R * rng.uniform(0.75, 1.0), -R)
        elif depth >= 1:
            # Inner boughs carry leaves too, hung a little below the limb.
            add(x1, y1 + R * 0.5, R * rng.uniform(0.9, 1.15), -R * 0.5)
    return out


def paint_leaves(size, clumps, rng, R):
    W, H = size
    field = {}
    for idx, (cx, cy, r, zb, (p1, p2, a1, a2)) in enumerate(clumps):
        for py in range(int(cy - r * 1.35), int(cy + r * 1.35) + 1):
            for px in range(int(cx - r * 1.35), int(cx + r * 1.35) + 1):
                if not (2 <= px < W - 2 and 2 <= py < H - 2):
                    continue
                dx, dy = px + 0.5 - cx, py + 0.5 - cy
                th = math.atan2(dy, dx)
                # Lobed, slightly wide, flatter underneath: not a circle.
                re = r * (1 + a1 * math.sin(3 * th + p1) + a2 * math.sin(5 * th + p2))
                re *= 1.12 if abs(math.cos(th)) > 0.7 else 1.0
                if dy > 0:
                    re *= 0.86
                d = math.hypot(dx, dy)
                if d > re:
                    continue
                zc = math.sqrt(max(0.0, 1 - (d / re) ** 2))
                z = zb + zc * r
                if (px, py) not in field or field[(px, py)][0] < z:
                    field[(px, py)] = (z, dx / re, dy / re, zc, idx)
    if not field:
        return {}
    xs = [p[0] for p in field]
    ys = [p[1] for p in field]
    gx, gy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    grx, gry = (max(xs) - min(xs)) / 2 + 1, (max(ys) - min(ys)) / 2 + 1
    value = {}
    for (px, py), (z, nx, ny, nz, idx) in field.items():
        local = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]
        ux, uy = (px - gx) / grx, (py - gy) / gry
        uz = math.sqrt(max(0.0, 1 - ux * ux - uy * uy))
        whole = ux * LIGHT[0] + uy * LIGHT[1] + uz * LIGHT[2]
        v = local * 0.8 + whole * 0.9 - 0.06
        # A mass nearer the light that stands well in front casts onto this one.
        for k in (1, 2, 3, 5):
            n = field.get((px - k, py - k)) or field.get((px, py - k))
            if n and n[4] != idx and n[0] - z > R * 0.4:
                v -= 0.42 if k < 3 else 0.2
                break
        value[(px, py)] = v
    # Leaf tufts. The masses above give the crown its form; the tufts give it
    # leaves. Each takes one base tone from the light where it sits and is
    # drawn in three steps round it, with a dark underside and dark gaps
    # between neighbours, so the crown is crisp clusters rather than a cloud.
    tr = max(2.5, R * 0.37)
    step = tr * 1.45
    tufts = []
    y = min(ys) - tr
    row = 0
    while y < max(ys) + tr:
        x = min(xs) - tr + (step / 2 if row & 1 else 0)
        while x < max(xs) + tr:
            cx, cy = x + rng.uniform(-1, 1) * step * 0.3, y + rng.uniform(-1, 1) * step * 0.3
            # Some places stay empty: dark pockets where you see into the crown.
            if (int(cx), int(cy)) in value and rng.random() > 0.1:
                tufts.append((cx, cy, tr * rng.uniform(0.72, 1.4), rng.uniform(0, 6.3), rng.uniform(0, 1.5)))
            x += step
        y += step * 0.85
        row += 1
    own = {}
    for ti, (cx, cy, r, ph, pr) in enumerate(tufts):
        for py in range(int(cy - r - 1), int(cy + r + 2)):
            for px in range(int(cx - r - 1), int(cx + r + 2)):
                if (px, py) not in value:
                    continue
                dx, dy = px + 0.5 - cx, py + 0.5 - cy
                re = r * (1 + 0.16 * math.sin(3 * math.atan2(dy, dx) + ph)) * (0.85 if dy > 0 else 1)
                d = math.hypot(dx, dy)
                if d > re:
                    continue
                # Lower tufts overlap the ones above them, like shingles.
                z = math.sqrt(1 - (d / re) ** 2) * r + cy * 0.22 + pr
                if (px, py) not in own or own[(px, py)][0] < z:
                    own[(px, py)] = (z, dx / re, dy / re, ti, d / re, math.atan2(dy, dx))
    # Unleaved rim pixels go: the silhouette is then made of leaf tufts.
    for _ in range(3):
        for p in [p for p in value if p not in own and any((p[0] + a, p[1] + b) not in value for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))]:
            del value[p]
    def base_of(ti):
        v = value[(int(tufts[ti][0]), int(tufts[ti][1]))]
        return 5 if v > 0.78 else 4 if v > 0.5 else 3 if v > 0.2 else 2
    tones = {}
    for p in value:
        o = own.get(p)
        if not o:
            tones[p] = 1
            continue
        _, nx, ny, ti, dn, th = o
        b = base_of(ti)
        l = nx * LIGHT[0] + ny * LIGHT[1]
        under = own.get((p[0] + 1, p[1] + 1)) or own.get((p[0], p[1] + 1))
        if under and under[3] != ti and l < 0.1:
            tones[p] = max(1, b - 2)
        elif ny > 0.1 and dn > 0.55 and math.sin(7 * th + tufts[ti][3]) > 0.55:
            # Nicks along the hanging edge: the tuft ends in leaf points.
            tones[p] = max(1, b - 2)
        else:
            tones[p] = max(1, min(6, b + (1 if l > 0.42 else 0 if l > -0.3 else -1)))
    # Leaves break the silhouette: sprigs out, nicks in.
    edge = [p for p in tones if any((p[0] + a, p[1] + b) not in tones for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    rng.shuffle(edge)
    for (x, y) in edge[: len(edge) // 7]:
        ox = -1 if (x - 1, y) not in tones else 1 if (x + 1, y) not in tones else 0
        oy = -1 if (x, y - 1) not in tones else 1 if (x, y + 1) not in tones else 0
        if rng.random() < 0.6:
            for a, b in ((0, 0), (1, 0), (0, 1), (1, 1), (-1, 0)):
                q = (x + ox * 2 + a, y + oy * 2 + b)
                if 2 <= q[0] < W - 2 and 2 <= q[1] < H - 2:
                    tones.setdefault(q, tones[(x, y)])
        else:
            tones.pop((x, y), None)
    # Selective outline: deepest tone under and to the right, a tone up where
    # the light lands, so the crown is held without a ruled black ring.
    for p in [p for p in tones if any((p[0] + a, p[1] + b) not in tones for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))]:
        lit = (p[0] - 1, p[1]) not in tones or (p[0], p[1] - 1) not in tones
        shaded = (p[0] + 1, p[1]) not in tones or (p[0], p[1] + 1) not in tones
        tones[p] = 0 if shaded or not lit else 1
    return tones


def tree(size, seed, levels, trunk_w, R, lean=0.0, spread=0.72, bare=False):
    """One tree. `bare` keeps the skeleton of the leafed tree with the same
    seed and adds twigs in place of leaves."""
    W, H = size
    base = (W // 2, H - 3 - int(trunk_w * 0.5))
    height = H - 8
    pad = R * 1.5 + 3
    # Same seed, same tree: measure it once, then grow it to fit the canvas.
    _, tips = skeleton(random.Random(seed), base, height, levels, trunk_w, lean, spread)
    scale = min(
        (base[1] - pad) / max(1.0, base[1] - min(y for _, y, *_ in tips)),
        (W / 2 - pad) / max(1.0, max(abs(x - base[0]) for x, *_ in tips)),
    )
    rng = random.Random(seed)
    segs, tips = skeleton(rng, base, height * scale, levels, trunk_w, lean, spread)
    top = min(y for _, y, *_ in tips)
    im = Image.new('RGBA', size)
    wood_segs = segs + roots(rng, base, trunk_w)
    if bare:
        trng = random.Random(seed + 1)

        def twig(x, y, ang, ln, left):
            a = ang + trng.uniform(-0.25, 0.25)
            ex, ey = x + math.sin(a) * ln, y - math.cos(a) * ln
            wood_segs.append((x, y, ex, ey, 1.3 if left > 1 else 1.0, 1.0 if left > 1 else 0.6, 9))
            if left:
                for f in (-1, 1):
                    twig(ex, ey, a * 0.8 + f * trng.uniform(0.3, 0.7), ln * 0.72, left - 1)

        for x, y, _, ang in tips:
            for f in (-1, 1):
                twig(x, y, ang * 0.8 + f * trng.uniform(0.25, 0.6), R * 0.9, 1)
    for p, t in paint_wood(size, wood_segs, random.Random(seed + 2)).items():
        if 1 <= p[0] < W - 1 and 1 <= p[1] < H - 1:
            im.putpixel(p, rgb(WOOD[t]))
    if not bare:
        lrng = random.Random(seed + 3)
        clumps = clumps_for(lrng, segs, tips, R, base[1], top)
        for p, t in paint_leaves(size, clumps, lrng, R).items():
            im.putpixel(p, rgb(LEAF[t]))
    return im
