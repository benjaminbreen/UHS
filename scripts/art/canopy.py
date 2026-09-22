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


def skeleton(rng, base, height, levels, trunk_w, lean=0.0, spread=0.72, trunk=0.27):
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

    grow(base[0], base[1], lean, height * trunk, trunk_w, 0)
    return segs, tips


def roots(rng, base, trunk_w, buttress=False):
    out = []
    if buttress:
        # Plank fins: they leave the trunk well above the ground and run out
        # further than the trunk is wide.
        for side in (-1.0, -0.45, 0.5, 1.0):
            sx, sy = base[0] + side * trunk_w * 0.25, base[1] - trunk_w * rng.uniform(1.5, 2.1)
            ex = base[0] + side * trunk_w * rng.uniform(1.35, 1.75)
            ey = base[1] + trunk_w * (0.32 if abs(side) == 1 else 0.42)
            mx, my = (sx + ex) / 2 - side * trunk_w * 0.18, (sy + ey) / 2 + trunk_w * 0.25
            out += [(sx, sy, mx, my, trunk_w * 0.5, trunk_w * 0.42, 0), (mx, my, ex, ey, trunk_w * 0.42, 1.2, 0)]
        return out
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


def clumps_for(rng, segs, tips, R, base_y, top_y, skirt=True):
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
        if skirt and y >= low:
            add(x + rng.uniform(-2, 2), y + R * rng.uniform(0.7, 1.1), R * rng.uniform(0.7, 0.95), R)
        if rng.random() < 0.7:
            add(x + rng.uniform(-R, R) * 0.8, y + rng.uniform(-R, R * 0.4) * 0.8, R * rng.uniform(0.6, 0.85))
    deepest = max(s[6] for s in segs)
    for x0, y0, x1, y1, _, _, depth in segs:
        if depth >= max(2, deepest - 1):
            add((x0 + x1) / 2 + rng.uniform(-2, 2), (y0 + y1) / 2, R * rng.uniform(0.75, 1.0), -R)
        elif depth >= (1 if skirt else 2):
            # Inner boughs carry leaves too, hung a little below the limb.
            add(x1, y1 + R * 0.5, R * rng.uniform(0.9, 1.15), -R * 0.5)
    return out


def paint_leaves(size, clumps, rng, R, tuft=0.37, gaps=0.1, leafy=False, shade=0.0, needle=False):
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
                d = math.hypot(dx, dy * (1.9 if needle else 1.0))
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
        value[(px, py)] = v - shade
    # Leaf tufts. The masses above give the crown its form; the tufts give it
    # leaves. Each takes one base tone from the light where it sits and is
    # drawn in three steps round it, with a dark underside and dark gaps
    # between neighbours, so the crown is crisp clusters rather than a cloud.
    tr = max(2.5, R * tuft)
    step = tr * (1.3 if leafy else 1.7 if needle else 1.45)
    tufts = []
    y = min(ys) - tr
    row = 0
    while y < max(ys) + tr:
        x = min(xs) - tr + (step / 2 if row & 1 else 0)
        while x < max(xs) + tr:
            cx, cy = x + rng.uniform(-1, 1) * step * 0.3, y + rng.uniform(-1, 1) * step * 0.3
            # Some places stay empty: dark pockets where you see into the crown.
            if (int(cx), int(cy)) in value and rng.random() > gaps:
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
                rib = False
                if needle:
                    # A flat sprig, wide and shallow, fringed underneath.
                    re = r * (1.7 if abs(dx) > abs(dy) else 0.75)
                    th = math.atan2(dy, dx * 0.45)
                    re *= 1 + (0.22 * max(0.0, math.sin(th)) * math.sin(9 * th + ph))
                    d = math.hypot(dx * 0.6, dy * 1.3)
                    if d > re:
                        continue
                elif leafy:
                    # One big leaf: a pointed blade hanging out and down from
                    # the middle of the crown, with a lit midrib.
                    turn = math.atan2((cy - gy) * 0.6 + gry * 0.55, cx - gx) + (ph - 3.15) * 0.22
                    ux, uy = math.cos(turn), math.sin(turn)
                    a, b = dx * ux + dy * uy, dy * ux - dx * uy
                    la = r * 1.25
                    lb = r * 0.8 * (1 - 0.6 * max(0.0, a / la) ** 2)
                    q = math.hypot(a / la, b / max(0.3, lb))
                    if q > 1:
                        continue
                    d, re = q * r, r
                    rib = abs(b) < 0.55 and -0.5 * la < a < 0.85 * la
                else:
                    re = r * (1 + 0.16 * math.sin(3 * math.atan2(dy, dx) + ph)) * (0.85 if dy > 0 else 1)
                    d = math.hypot(dx, dy)
                    if d > re:
                        continue
                # Lower tufts overlap the ones above them, like shingles.
                z = math.sqrt(1 - (d / re) ** 2) * r + cy * 0.22 + pr
                if (px, py) not in own or own[(px, py)][0] < z:
                    own[(px, py)] = (z, dx / re, dy / re, ti, d / re, math.atan2(dy, dx), rib)
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
        _, nx, ny, ti, dn, th, rib = o
        b = base_of(ti)
        l = nx * LIGHT[0] + ny * LIGHT[1]
        under = own.get((p[0] + 1, p[1] + 1)) or own.get((p[0], p[1] + 1))
        if under and under[3] != ti and l < 0.1:
            tones[p] = max(1, b - 2)
        elif rib:
            tones[p] = min(5, b + 1)
        elif needle and ny > 0.2 and dn > 0.45:
            tones[p] = max(1, b - 1) if math.sin(11 * th + tufts[ti][3]) > 0 else max(1, b - 2)
        elif not leafy and not needle and ny > 0.1 and dn > 0.55 and math.sin(7 * th + tufts[ti][3]) > 0.55:
            # Nicks along the hanging edge: the tuft ends in leaf points.
            tones[p] = max(1, b - 2)
        else:
            tones[p] = max(1, min(6, b + (1 if l > 0.42 else 0 if l > -0.3 else -1)))
    # Leaves break the silhouette: sprigs out, nicks in. A sprig is a 2x2
    # block attached to the edge, never a detached pixel.
    edge = [p for p in tones if any((p[0] + a, p[1] + b) not in tones for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    rng.shuffle(edge)
    for (x, y) in edge[: len(edge) // 7]:
        ox = -1 if (x - 1, y) not in tones else 1 if (x + 1, y) not in tones else 0
        oy = -1 if (x, y - 1) not in tones else 1 if (x, y + 1) not in tones else 0
        if rng.random() < 0.6:
            for a, b in ((0, 0), (1, 0), (0, 1), (1, 1)):
                q = (x + ox + a - (1 if ox < 0 else 0), y + oy + b - (1 if oy < 0 else 0))
                if 2 <= q[0] < W - 2 and 2 <= q[1] < H - 2:
                    tones.setdefault(q, tones[(x, y)])
        else:
            tones.pop((x, y), None)
    # No stray pixels: a leaf mass smaller than a tuft is a fragment and goes.
    seen = set()
    for start in list(tones):
        if start in seen:
            continue
        comp, stack = [], [start]
        seen.add(start)
        while stack:
            x, y = stack.pop()
            comp.append((x, y))
            for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if q in tones and q not in seen:
                    seen.add(q)
                    stack.append(q)
        if len(comp) < tr * tr * 2:
            for p in comp:
                del tones[p]
    # Selective outline: deepest tone under and to the right, a tone up where
    # the light lands, so the crown is held without a ruled black ring.
    for p in [p for p in tones if any((p[0] + a, p[1] + b) not in tones for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))]:
        lit = (p[0] - 1, p[1]) not in tones or (p[0], p[1] - 1) not in tones
        shaded = (p[0] + 1, p[1]) not in tones or (p[0], p[1] + 1) not in tones
        tones[p] = 0 if shaded or not lit else 1
    return tones


def tree(size, seed, levels, trunk_w, R, lean=0.0, spread=0.72, bare=False, leaf=None, wood=None,
         trunk=0.27, tuft=0.37, gaps=0.1, leafy=False, buttress=False, lianas=0, blossom=None,
         skirt=True, shade=0.0):
    """One tree. `bare` keeps the skeleton of the leafed tree with the same
    seed and adds twigs in place of leaves."""
    W, H = size
    base = (W // 2, H - 3 - int(trunk_w * 0.5))
    height = H - 8
    pad = R * 1.5 + 3
    # Same seed, same tree: measure it once, then grow it to fit the canvas.
    _, tips = skeleton(random.Random(seed), base, height, levels, trunk_w, lean, spread, trunk)
    scale = min(
        (base[1] - pad) / max(1.0, base[1] - min(y for _, y, *_ in tips)),
        (W / 2 - pad) / max(1.0, max(abs(x - base[0]) for x, *_ in tips)),
    )
    rng = random.Random(seed)
    segs, tips = skeleton(rng, base, height * scale, levels, trunk_w, lean, spread, trunk)
    top = min(y for _, y, *_ in tips)
    im = Image.new('RGBA', size)
    leaf, wood = leaf or LEAF, wood or WOOD
    wood_segs = segs + roots(rng, base, trunk_w, buttress)
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
            im.putpixel(p, rgb(wood[t]))
    if not bare:
        lrng = random.Random(seed + 3)
        clumps = clumps_for(lrng, segs, tips, R, base[1], top, skirt)
        tones = paint_leaves(size, clumps, lrng, R, tuft, gaps, leafy, shade)
        for p, t in tones.items():
            im.putpixel(p, rgb(leaf[t]))
        if lianas:
            # Vines hang from the underside of the crown, clear of the trunk.
            under = {}
            for (x, y) in tones:
                under[x] = max(under.get(x, 0), y)
            cols = [x for x in under if abs(x - base[0]) > trunk_w and under[x] < base[1] - 12]
            for x in lrng.sample(sorted(cols), min(lianas, len(cols))):
                for k in range(1, lrng.randrange(8, 22)):
                    y = under[x] + k
                    if y >= base[1] - 4 or im.getpixel((x, y))[3]:
                        break
                    im.putpixel((x, y), rgb(leaf[1]))
                    if k % 4 == 2:
                        im.putpixel((x + (1 if k % 8 == 2 else -1), y), rgb(leaf[3]))
        if blossom:
            # Pale flower sprays standing on the lit top of the crown.
            lit = sorted(p for p, t in tones.items() if t >= 4 and p[1] < top + (base[1] - top) * 0.3)
            lrng.shuffle(lit)
            placed = []
            for (x, y) in lit:
                if len(placed) >= 14:
                    break
                if any(abs(x - a) + abs(y - b) < 7 for a, b in placed):
                    continue
                placed.append((x, y))
                for dx, dy, c in ((0, 0, 0), (1, -1, 0), (-1, -1, 1), (0, -2, 0), (2, 0, 1), (1, 1, 1), (-1, 1, 1), (1, -3, 0)):
                    q = (x + dx, y + dy)
                    if q in tones:
                        im.putpixel(q, rgb(blossom[c]))
    return im


TROPIC_LEAF = ['#0b2a24', '#124636', '#1c663a', '#2f8a38', '#52ab3a', '#86c944', '#c0e266']
TROPIC_WOOD = ['#2a1f1a', '#4d3a2c', '#73583f', '#987a56', '#bb9d72', '#d9c091']
TEAK_LEAF = ['#1c3324', '#2f5430', '#47763a', '#64963f', '#88b348', '#b0cc5c', '#dbe489']
TEAK_WOOD = ['#2a2622', '#4a4239', '#6c6152', '#8f8370', '#b0a48e', '#cdc3ab']


def tropical_broadleaf():
    """Rainforest canopy tree: plank buttresses, a clear bole, a broad crown of
    big dark leaves, vines hanging under it."""
    return tree((120, 136), 8, 4, 13, 10, spread=0.95, leaf=TROPIC_LEAF, wood=TROPIC_WOOD, trunk=0.4,
                tuft=0.5, gaps=0.12, leafy=True, buttress=True, lianas=5, skirt=False, shade=0.16)


def teak():
    """Tectona grandis: a tall straight grey bole, a narrow open crown of very
    large pale leaves, cream flower sprays standing on top."""
    return tree((88, 136), 8, 4, 10, 8, spread=0.5, leaf=TEAK_LEAF, wood=TEAK_WOOD, trunk=0.46,
                tuft=0.62, gaps=0.2, leafy=True, blossom=('#f6efd6', '#cdc48e'), skirt=False, shade=0.1)


PINE_LEAF = ['#0c221f', '#143a2e', '#1e5636', '#2c733a', '#3f8e42', '#62a850', '#95c26a']
PINE_WOOD = ['#2c1a14', '#5a2f22', '#8a4a2e', '#b46b3c', '#d3925a', '#eab97c']


def conifer(size, seed, R, umbrella=True, bare_trunk=0.42, leaf=None, wood=None, whorls=None,
            trunk_w=None, pad=1.0, spire=False, fluted=False):
    """A pine with a straight bole and whorls of limbs that bend up to carry
    flat needle pads, an open umbrella crown when `umbrella`. Every seed is a
    different tree: limb count, reach and pad placement all roll."""
    W, H = size
    rng = random.Random(seed)
    base = (W // 2, H - 4)
    top = 10 + rng.randrange(0, 8)
    lean = rng.uniform(-0.08, 0.08)
    segs = []
    leaf, wood = leaf or PINE_LEAF, wood or PINE_WOOD
    x, y, w = base[0], base[1], trunk_w or R * 1.05
    pts = [(x, y)]
    n = 5
    for i in range(1, n + 1):
        x += math.sin(lean) * (base[1] - top) / n + rng.uniform(-1.2, 1.2)
        y = base[1] - (base[1] - top) * i / n
        pts.append((x, y))
    for i in range(n):
        segs.append((*pts[i], *pts[i + 1], w * (1 - 0.13 * i), w * (1 - 0.13 * (i + 1)), 0))
    pads = []
    whorls = whorls or 3 + rng.randrange(0, 2)
    for k in range(whorls):
        t = bare_trunk + (0.92 - bare_trunk) * k / max(1, whorls - 1) + rng.uniform(-0.05, 0.05)
        heavy = rng.choice((-1, 1))
        py = base[1] - (base[1] - top) * t
        px = pts[0][0] + (pts[-1][0] - pts[0][0]) * t
        sides = [-1, 1] if rng.random() < 0.6 else [-1, 1, rng.choice((-0.35, 0.35))]
        for side in sides:
            reach = (W / 2 - R * 1.4) * (1 - (0.85 if spire else 0.45) * t) * rng.uniform(0.85, 1.0 if side == heavy else 0.6)
            rise = H * (0.2 if umbrella else 0.06) * rng.uniform(0.7, 1.2) * (1 - 0.5 * t)
            mx, my = px + side * reach * 0.5, py - rise * 0.2
            ex, ey = px + side * reach, py - rise
            lw = w * 0.42 * (1 - 0.4 * t)
            segs += [(px, py, mx, my, lw, lw * 0.75, 1), (mx, my, ex, ey, lw * 0.75, 1.4, 1)]
            # A wide flat pad on the limb end, a smaller one half way out.
            pads.append((ex, ey - 1, R * pad * rng.uniform(1.0, 1.25) * (1 - 0.35 * t if spire else 1), 1.0))
            if reach > R * 2.2:
                pads.append((mx + side * 3, my - 3, R * rng.uniform(0.7, 0.9), 0.5))
    pads.append((pts[-1][0], pts[-1][1] + 3, R * (0.7 if spire else 1.2) * rng.uniform(0.95, 1.1), 1.4))
    im = Image.new('RGBA', size)
    if fluted:
        # Buttressed foot: the bole flares into ridges at the ground.
        for side in (-1.0, -0.4, 0.45, 1.0):
            segs.append((base[0] + side * w * 0.2, base[1] - w * 1.6, base[0] + side * w * 0.95, base[1] + 1, w * 0.45, 1.5, 0))
    for p, t in paint_wood(size, segs, random.Random(seed + 2)).items():
        if 1 <= p[0] < W - 1 and 1 <= p[1] < H - 1:
            im.putpixel(p, rgb(wood[t]))
    lrng = random.Random(seed + 3)
    clumps = []
    for x, y, r, zb in pads:
        # Three clumps side by side make a plate, not a ball.
        for ox in (-r * 0.9, 0, r * 0.9):
            clumps.append((x + ox + lrng.uniform(-1, 1), y + lrng.uniform(-1, 1), r * lrng.uniform(0.85, 1.05),
                           (y / H) * R * 2.2 + zb * R + lrng.uniform(0, R * 0.5),
                           (lrng.uniform(0, 6.3), lrng.uniform(0, 6.3), 0.05, 0.03)))
    tones = paint_leaves(size, clumps, lrng, R, tuft=0.48, gaps=0.05, needle=True, shade=0.22)
    for p, t in tones.items():
        im.putpixel(p, rgb(leaf[t]))
    return im


MAPLE_LEAF = ['#22331f', '#365429', '#4f7a31', '#6f9c3a', '#95bd48', '#bcd65c', '#e0eb88']
MAPLE_WOOD = ['#2b2320', '#4a3a33', '#6a5449', '#8c7262', '#ad927d', '#cdb59a']
MAPLE_AUTUMN = [
    ['#3a1a10', '#6b2414', '#a3341a', '#d04f1e', '#ee7c2a', '#f7a63a', '#fbd267'],
    ['#3f1512', '#74201c', '#a82a22', '#d3402a', '#ea6a34', '#f39a4a', '#f8c878'],
    ['#3d2410', '#6e3d12', '#a35d16', '#d38a1f', '#ecb22a', '#f5d24a', '#fbe98a'],
]


def maple(seed, autumn=None, bare=False):
    """Acer: short trunk, broad dome, low-hanging outer boughs. Autumn ramps
    run from a deep shadow red or brown up to a lit yellow."""
    leaf = MAPLE_AUTUMN[autumn] if autumn is not None else MAPLE_LEAF
    return tree((96, 112), seed, 4, 11, 9.5, spread=0.85, leaf=leaf, wood=MAPLE_WOOD, trunk=0.22,
                tuft=0.34, gaps=0.08, bare=bare)


REDWOOD_LEAF = ['#0b1f1c', '#123328', '#1a4a30', '#266336', '#357d3e', '#529a4c', '#7fb668']
REDWOOD_WOOD = ['#2a1410', '#4e2418', '#7a3a24', '#a2552f', '#c27a48', '#dba36a']
FIR_LEAF = ['#0c1d1c', '#142f2c', '#1d4838', '#2a6142', '#3d7f4e', '#5f9e5e', '#8fbd7c']
FIR_WOOD = ['#241c18', '#3f312a', '#5c4a3e', '#7b6553', '#9a836c', '#b8a288']
CEDAR_LEAF = ['#0e1f1e', '#17352f', '#22503d', '#2f6a46', '#43864f', '#69a463', '#9cc283']
CYPRESS_LEAF = ['#0d1c18', '#152f24', '#1f472d', '#2b5f33', '#3c7a3a', '#5a9448', '#8bb166']
OAK_LEAF = ['#1e2f1a', '#324f25', '#4a722d', '#659334', '#87b040', '#acc955', '#d3df7e']
OAK_WOOD = ['#251b16', '#463328', '#66493a', '#87664e', '#a88a6a', '#c8ac88']
OAK_AUTUMN = ['#33200f', '#5e3814', '#8b561b', '#b47a25', '#d1a033', '#e4c14e', '#f2dd82']
OLIVE_LEAF = ['#1f2d24', '#334634', '#4b6247', '#65805b', '#849c74', '#a5b892', '#c8d3b0']
OLIVE_WOOD = ['#2a2620', '#4a443a', '#6c6556', '#8d8574', '#aca591', '#c9c2ae']
ACACIA_LEAF = ['#1f2c14', '#344a1e', '#4d6a27', '#6a8b30', '#8daa3c', '#b0c454', '#d4dc80']
ACACIA_WOOD = ['#241a14', '#43302a', '#644a3c', '#856650', '#a5866a', '#c2a688']


def redwood(seed):
    """Sequoia: a huge fluted red bole, bare for most of its height, then
    short sparse pads that narrow to a spire."""
    return conifer((112, 240), seed, 7, umbrella=False, bare_trunk=0.34, leaf=REDWOOD_LEAF, wood=REDWOOD_WOOD,
                   whorls=6, trunk_w=15, pad=0.9, spire=True, fluted=True)


def douglas_fir(seed):
    """A tall narrow spire of drooping pads on a straight grey trunk."""
    return conifer((80, 176), seed, 7, umbrella=False, bare_trunk=0.14, leaf=FIR_LEAF, wood=FIR_WOOD,
                   whorls=8, trunk_w=7, pad=1.1, spire=True)


def cedar(seed):
    """Cedar of Lebanon: wide level plates of needle on long horizontal limbs,
    the top flattened with age."""
    return conifer((128, 120), seed, 8, umbrella=False, bare_trunk=0.3, leaf=CEDAR_LEAF, wood=OAK_WOOD,
                   whorls=4, trunk_w=12, pad=1.3)


def cypress(seed):
    """Italian cypress: one dark column, no visible limbs."""
    W, H = 32, 112
    rng = random.Random(seed)
    im = Image.new('RGBA', (W, H))
    base = (W // 2, H - 4)
    segs = [(base[0], base[1], base[0] + rng.uniform(-1, 1), H * 0.12, 4.0, 1.2, 0)]
    for p, t in paint_wood((W, H), segs, rng).items():
        im.putpixel(p, rgb(OAK_WOOD[t]))
    clumps = []
    y = base[1] - 4
    while y > 10:
        t = (y - 10) / (base[1] - 14)
        r = 2.2 + 4.2 * math.sin(min(1.0, t * 1.15) * math.pi * 0.5) * (0.9 if t > 0.85 else 1)
        clumps.append((base[0] + rng.uniform(-1.2, 1.2), y, r, (1 - t) * 6 + rng.uniform(0, 2),
                       (rng.uniform(0, 6.3), rng.uniform(0, 6.3), 0.06, 0.03)))
        y -= 3
    tones = paint_leaves((W, H), clumps, rng, 4, tuft=0.55, gaps=0.04, needle=True, shade=0.25)
    for p, t in tones.items():
        im.putpixel(p, rgb(CYPRESS_LEAF[t]))
    return im


def oak(seed, autumn=False, bare=False):
    """Quercus: a stout short trunk and a wide crooked crown, wider than tall."""
    return tree((112, 104), seed, 4, 13, 9, spread=1.05, leaf=OAK_AUTUMN if autumn else OAK_LEAF,
                wood=OAK_WOOD, trunk=0.2, tuft=0.36, gaps=0.09, bare=bare)


def olive(seed):
    """Olea: a gnarled pale trunk that leans, a loose silver-grey crown."""
    return tree((72, 72), seed, 3, 8, 6, lean=random.Random(seed).uniform(-0.25, 0.25), spread=1.0,
                leaf=OLIVE_LEAF, wood=OLIVE_WOOD, trunk=0.3, tuft=0.4, gaps=0.18, shade=0.12)


def acacia(seed):
    """Umbrella thorn: limbs fan out from a tall clear bole and stop at one
    level, a flat plate of fine leaf spread across the top."""
    W, H = 112, 108
    rng = random.Random(seed)
    base = (W // 2, H - 8)
    lean = rng.uniform(-0.1, 0.1)
    _, probe = skeleton(random.Random(seed), base, H - 8, 3, 9, lean, 1.35, 0.42)
    scale = min((base[1] - 16) / max(1.0, base[1] - min(y for _, y, *_ in probe)),
                (W / 2 - 10) / max(1.0, max(abs(x - base[0]) for x, *_ in probe)))
    rng = random.Random(seed)
    segs, tips = skeleton(rng, base, (H - 8) * scale, 3, 9, lean, 1.35, 0.42)
    im = Image.new('RGBA', (W, H))
    for p, t in paint_wood((W, H), segs + roots(rng, base, 9), rng).items():
        im.putpixel(p, rgb(ACACIA_WOOD[t]))
    top = min(y for _, y, *_ in tips)
    level = top + 9
    clumps = []
    for x, y, *_ in tips:
        for ox in (-7, 0, 7):
            clumps.append((x + ox + rng.uniform(-1, 1), level + rng.uniform(-3, 3), 9 * rng.uniform(0.85, 1.1),
                           rng.uniform(0, 4), (rng.uniform(0, 6.3), rng.uniform(0, 6.3), 0.06, 0.04)))
    tones = paint_leaves((W, H), clumps, rng, 9, tuft=0.36, gaps=0.14, needle=True, shade=0.05)
    for p, t in tones.items():
        im.putpixel(p, rgb(ACACIA_LEAF[t]))
    return im
