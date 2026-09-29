"""Broadleaf, acacia, spruce and cypress grown as voxels and rendered into the oblique view.

A tree is limbs (tapered capsules) and leaf clumps (flattened balls). Leaves
shade as the ball of their own clump, so a crown reads as the clumps a pixel
artist would draw; sun, occlusion and self-shadow come from the geometry.
Colours are the shipped sprites' own ramps, so the trees sit in the palette.
"""
import math
import numpy as np
from PIL import Image

from art.voxel import hexrgb, h3

K = 0.5
SUN = np.array([-.4, -.5, .8]) / np.linalg.norm([-.4, -.5, .8])
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 - .5

# Lifted from the hand-drawn broadleaf, acacia and spruce they replace.
BL_LEAF = ['#0f2e2a', '#1a4a34', '#276a36', '#3c8a33', '#62a937', '#95c646', '#c8df69']
BL_BARK = ['#2a1a16', '#4a2e20', '#6e4528', '#946233', '#b98445']
AC_LEAF = ['#1f2c14', '#344a1e', '#4d6a27', '#6a8b30', '#8daa3c', '#b0c454', '#d4dc80']
AC_BARK = ['#241a14', '#43302a', '#644a3c', '#856650', '#a5866a']
SP_LEAF = ['#0e2124', '#193e37', '#246049', '#397d58', '#659d6a', '#a4be86']
SP_BARK = ['#1a1614', '#302d2a', '#4a3a30', '#6a5040']
CYPRESS_LEAF = ['#0d1c18', '#152f24', '#1f472d', '#2b5f33', '#3c7a3a', '#5a9448', '#8bb166']
CYPRESS_BARK = ['#251b16', '#66493a', '#87664e']


def unit(v):
    v = np.asarray(v, float)
    return v / (np.linalg.norm(v) + 1e-9)


def rot(p, a):
    c, s = math.cos(a), math.sin(a)
    return (p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2])


class Tree:
    def __init__(self, seed, bare=False):
        self.rng = np.random.default_rng(seed)
        self.bare = bare
        self.caps = []    # (p0, p1, r0, r1)
        self.clumps = []  # (centre, r, flat)

    def limb(self, p, d, length, r0, r1, bend=(0, 0, 0), wobble=.15, segs=4):
        """A curved limb as a chain of capsules; returns its tip and heading."""
        p = np.asarray(p, float)
        d = unit(d)
        for i in range(segs):
            d = unit(d + np.asarray(bend) / segs + self.rng.normal(0, wobble, 3) * (1, 1, .4))
            q = p + d * length / segs
            self.caps.append((tuple(p), tuple(q), r0 + (r1 - r0) * i / segs, r0 + (r1 - r0) * (i + 1) / segs))
            p = q
        return p, d

    def spray(self, c, n, spread, r, flat, lift=0.0):
        """A cluster of leaf clumps around c; twigs in its place when bare."""
        # many small clumps, not a few big ones, so no single ball shows
        if not self.bare:
            n, r, spread = n * 3, r * .6, spread * 1.1
        for _ in range(n):
            o = np.clip(self.rng.normal(0, 1, 3), -1.7, 1.7) * spread * np.array([1, 1, flat])
            rr = r * self.rng.uniform(.75, 1.2)
            if self.bare:
                self.caps.append((tuple(c), tuple(np.asarray(c) + o * 1.2 + (0, 0, lift + rr * .5)), .6, .45))
            else:
                self.clumps.append((tuple(np.asarray(c) + o + (0, 0, lift)), rr, flat))


def roots(t, r):
    for k in range(5):
        a = k * 2 * math.pi / 5 + t.rng.uniform(-.4, .4)
        t.caps.append(((0, 0, r * 1.6), (math.cos(a) * r * 2.1, math.sin(a) * r * 2.1, 0), r * .55, r * .25))


def broadleaf(seed, bare=False):
    t = Tree(seed, bare)
    roots(t, 5)
    top, d = t.limb((0, 0, 0), (0, 0, 1), 14, 6, 5, wobble=.06)

    def grow(p, d, length, r, depth):
        tip, hd = t.limb(p, d, length, r, r * .62, bend=(0, 0, .12), wobble=.12, segs=3)
        if depth == 0:
            t.spray(tip + hd * 3, 10, 7, 5.4, .72, lift=1)
            return
        base = t.rng.uniform(0, 2 * math.pi)
        n = 3 if depth > 1 else 2
        for k in range(n):
            yaw = base + k * 2 * math.pi / n + t.rng.uniform(-.5, .5)
            tilt = t.rng.uniform(.8, 1.25)
            nd = unit(hd * .35 + np.array([math.cos(yaw) * math.sin(tilt), math.sin(yaw) * math.sin(tilt), math.cos(tilt)]))
            grow(tip, nd, length * t.rng.uniform(.62, .8), r * .62, depth - 1)
        if depth == 1:
            t.spray(tip, 4, 5, 5, .72)

    grow(top, d, 24, 5, 3)
    return t, dict(leaf=BL_LEAF, bark=BL_BARK, ragged=.35)


def broadleaf_large(seed, bare=False):
    """An open-grown giant: a short bole splits into heavy limbs that splay,
    fork again, and carry the crown wider than it is tall."""
    t = Tree(seed, bare)
    roots(t, 7)
    top, _ = t.limb((0, 0, 0), (0, 0, 1), 20, 8, 6.5, wobble=.04)

    def grow(p, d, length, r, depth):
        tip, hd = t.limb(p, d, length, r, r * .65, bend=(0, 0, .1), wobble=.12, segs=4)
        if depth == 0:
            t.spray(tip + (0, 0, 2), 6, 5, 5, .65)
            return
        for k in range(2):
            yaw = math.atan2(hd[1], hd[0]) + (k - .5) * t.rng.uniform(.9, 1.5)
            tilt = t.rng.uniform(.7, 1.05)
            nd = unit(np.array([math.cos(yaw) * math.sin(tilt), math.sin(yaw) * math.sin(tilt), math.cos(tilt)]))
            grow(tip, nd, length * t.rng.uniform(.62, .78), r * .62, depth - 1)
        t.spray(tip + (0, 0, 3), 3, 4, 4.5, .65)

    base = t.rng.uniform(0, 2 * math.pi)
    for k in range(4):
        yaw = base + k * math.pi / 2 + t.rng.uniform(-.35, .35)
        tilt = t.rng.uniform(.6, .85)
        grow(top, (math.cos(yaw) * math.sin(tilt), math.sin(yaw) * math.sin(tilt), math.cos(tilt)),
             t.rng.uniform(22, 28), 4.6, 2)
    t.spray(top + (0, 0, 38), 6, 7, 5, .65)
    return t, dict(leaf=BL_LEAF, bark=BL_BARK, ragged=.35)


def acacia(seed, bare=False):
    """Umbrella thorn: thin limbs fork up and out, each ending in a flat pad."""
    t = Tree(seed, bare)
    roots(t, 3)
    top, d = t.limb((0, 0, 0), (.12, 0, 1), 26, 3.4, 2.6, wobble=.1)

    def grow(p, d, length, r, depth):
        tip, hd = t.limb(p, d, length, r, r * .65, bend=(0, 0, .2), wobble=.1, segs=3)
        if depth == 0:
            for _ in range(7):
                o = t.rng.normal(0, 1, 3) * (6, 6, .6)
                t.clumps.append((tuple(tip + o + (0, 0, 2)), t.rng.uniform(5, 7), .3))
            return
        base = t.rng.uniform(0, 2 * math.pi)
        n = 3 if depth > 1 else 2
        for k in range(n):
            yaw = base + k * 2 * math.pi / n + t.rng.uniform(-.4, .4)
            tilt = t.rng.uniform(.95, 1.3)
            nd = unit(hd * .1 + np.array([math.cos(yaw) * math.sin(tilt), math.sin(yaw) * math.sin(tilt), math.cos(tilt)]))
            grow(tip, nd, length * t.rng.uniform(.75, .95), r * .65, depth - 1)

    grow(top, d, 26, 2.6, 2)
    return t, dict(leaf=AC_LEAF, bark=AC_BARK, ragged=.4)


def spruce(seed, bare=False):
    t = Tree(seed, bare)
    roots(t, 2.6)
    height = 96
    t.caps.append(((0, 0, 0), (0, 0, height), 3.2, .6))
    rng = t.rng
    z = 14.0
    while z < height - 6:
        f = (height - z) / height
        w = 3 + 30 * f ** .9 * rng.uniform(.8, 1.15)
        n = rng.integers(5, 8)
        for k in range(n):
            if rng.random() < .12:
                continue  # a lost branch leaves a gap to see the trunk through
            a = k * 2 * math.pi / n + rng.uniform(-.3, .3) + z * 1.3
            out = np.array([math.cos(a), math.sin(a), .15])
            tip, _ = t.limb((0, 0, z), out, w, .8, .4, bend=(0, 0, -.9), wobble=.08, segs=3)
            for s in np.linspace(.35, 1, 4):
                c = np.array([0, 0, z]) + (tip - (0, 0, z)) * s + (0, 0, .8)
                t.clumps.append((tuple(c), 2.6 + 2.4 * s * (.5 + f), .42))
        z += rng.uniform(5, 7.5)
    t.clumps.append(((0, 0, height - 5), 2.2, 2.2))
    return t, dict(leaf=SP_LEAF, bark=SP_BARK, ragged=.25)


def cypress(seed, bare=False):
    """Italian cypress: a tight flame of foliage around a hidden stem."""
    t = Tree(seed, bare)
    t.caps.append(((0, 0, 0), (0, 0, 100), 2.4, .6))
    for z in np.arange(8, 104, 3.2):
        w = 8.5 * math.sin(math.pi * min(1, (z + 6) / 112)) ** .8 + .8
        for _ in range(3):
            a = t.rng.uniform(0, 2 * math.pi)
            rr = w * t.rng.uniform(.2, .6)
            t.clumps.append(((math.cos(a) * rr, math.sin(a) * rr, z), max(2, w * .7), 1.4))
    return t, dict(leaf=CYPRESS_LEAF, bark=CYPRESS_BARK, ragged=.3)


def _scaled(tree, ang, s):
    caps = [(rot(np.multiply(a, s), ang), rot(np.multiply(b, s), ang), max(.55, r0 * s), max(.45, r1 * s))
            for a, b, r0, r1 in tree.caps]
    clumps = [(rot(np.multiply(c, s), ang), max(1.6, r * s), f) for c, r, f in tree.clumps]
    return caps, clumps


def _voxelize(caps, clumps, look, ang, seed, W, D, Hz):
    """Material (0 air, 1 bark, 2 leaf) and each leaf voxel's clump normal.
    x runs across the sprite, y back from the viewer, z up."""
    g = np.zeros((W, D, Hz), np.uint8)
    cn = np.zeros((W, D, Hz, 3), np.float32)
    best = np.full((W, D, Hz), 9.0, np.float32)
    X, Y, Z = np.meshgrid(np.arange(W) - W / 2, np.arange(D) - D / 2, np.arange(Hz), indexing='ij')
    off = (W // 2, D // 2, 0)

    def box(c, r):
        return tuple(slice(max(0, int(math.floor(c[i] - r)) + off[i]),
                           max(0, min(g.shape[i], int(math.ceil(c[i] + r)) + 1 + off[i]))) for i in range(3))

    for i, (c, r, flat) in enumerate(clumps):
        sl = box(c, r * 1.3)
        dx, dy, dz = X[sl] - c[0], Y[sl] - c[1], (Z[sl] - c[2]) / flat
        d = np.sqrt(dx * dx + dy * dy + dz * dz) / r
        # a ragged rim, keyed to the unrotated tree so the same leaves poke out at any angle
        ux, uy, _ = rot((X[sl], Y[sl], 0), -ang)
        # tufts a few voxels across on top of single-leaf grain
        rim = h3(np.round(ux / 3), np.round(uy / 3), Z[sl] // 3, seed + i) * .6 + h3(np.round(ux), np.round(uy), Z[sl], seed + i) * .4 - .5
        m = (d < 1 + rim * look['ragged']) & (d < best[sl])
        g[sl][m] = 2
        best[sl][m] = d[m]
        nn = np.stack([dx, dy, dz * flat * 1.6], -1)
        nn /= np.linalg.norm(nn, axis=-1, keepdims=True) + 1e-6
        cn[sl][m] = nn[m]
    for a, b, r0, r1 in caps:
        a, b = np.asarray(a), np.asarray(b)
        ab = b - a
        L = max(ab @ ab, 1e-6)
        sa, sb = box(a, r0 + 1), box(b, r0 + 1)
        sl = tuple(slice(min(p.start, q.start), max(p.stop, q.stop)) for p, q in zip(sa, sb))
        px, py, pz = X[sl], Y[sl], Z[sl]
        t = np.clip(((px - a[0]) * ab[0] + (py - a[1]) * ab[1] + (pz - a[2]) * ab[2]) / L, 0, 1)
        dist = np.sqrt((px - a[0] - t * ab[0]) ** 2 + (py - a[1] - t * ab[1]) ** 2 + (pz - a[2] - t * ab[2]) ** 2)
        g[sl][dist <= r0 + (r1 - r0) * t + .35] = 1
    return g, cn


def _blur(a, r):
    out = a.astype(np.float32)
    for ax in range(3):
        acc = np.zeros_like(out)
        for k in range(-r, r + 1):
            acc += np.roll(out, k, ax)
        out = acc / (2 * r + 1)
    return out


def _render(g, cn, look, W, H, base):
    solid = g > 0
    D = g.shape[1]
    gx, gy, gz = np.gradient(_blur(solid, 1))
    occ = 1 - np.clip(_blur(solid, 3) * 1.7 - .3, 0, 1)
    idx = np.argwhere(solid)
    x, y, z = idx.T
    mat = g[x, y, z]
    leaf = mat == 2
    nrm = -np.stack([gx[x, y, z], gy[x, y, z], gz[x, y, z]], 1)
    nrm = np.nan_to_num(nrm / (np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-6))
    # the crown's overall form leads; each clump only nudges it
    bx, by, bz = np.gradient(_blur(solid, 4))
    big = -np.stack([bx[x[leaf], y[leaf], z[leaf]], by[x[leaf], y[leaf], z[leaf]], bz[x[leaf], y[leaf], z[leaf]]], 1)
    big /= np.linalg.norm(big, axis=1, keepdims=True) + 1e-6
    mix = big * .6 + cn[x[leaf], y[leaf], z[leaf]] * .2 + nrm[leaf] * .2
    nrm[leaf] = mix / (np.linalg.norm(mix, axis=1, keepdims=True) + 1e-6)
    lit = np.ones(len(idx), np.float32)
    pos = idx.astype(np.float32) + SUN * 2
    for _ in range(70):
        pos += SUN * 1.4
        p = np.round(pos).astype(int)
        ok = (p >= 0).all(1) & (p[:, 0] < g.shape[0]) & (p[:, 1] < D) & (p[:, 2] < g.shape[2])
        hit = np.zeros(len(idx), bool)
        hit[ok] = solid[p[ok, 0], p[ok, 1], p[ok, 2]]
        lit[hit] *= .6  # leaves let some light through
    val = .42 * (.35 + .65 * occ[x, y, z]) + .72 * np.clip(nrm @ SUN, 0, 1) * lit + .14 * np.clip(nrm[:, 2], 0, 1)
    val[~leaf] += (h3(np.round(np.arctan2(y - D / 2, x - W / 2) * 5), 0, z // 4, 3)[~leaf] - .5) * .18
    sx = x
    sy = (base - z - (y - D / 2) * K).astype(int)
    # leaf-scale flecks, so a lit face breaks into leaves rather than a smooth ball
    val[leaf] += (h3(x[leaf] // 2, y[leaf] // 2, z[leaf] // 2, 11) - .5) * .3 + (h3(x[leaf], y[leaf], z[leaf], 12) - .5) * .12
    val = val + BAYER[sy % 4, sx % 4] * .09  # dither only where two bands meet
    leafR = np.array([hexrgb(c) for c in look['leaf']], float)
    barkR = np.array([hexrgb(c) for c in look['bark']], float)
    nl, nb = len(leafR), len(barkR)
    kl = np.clip((np.clip(val * .78, 0, 1) ** 1.35 * nl).astype(int), 1, nl - 1)
    kb = np.clip((np.clip(val * .8, 0, 1) ** 1.2 * nb).astype(int), 0, nb - 1)
    col = np.where(leaf[:, None], leafR[kl], barkR[kb])
    img = np.zeros((H, W, 3))
    dep = np.full((H, W), 1e9)
    kind = np.zeros((H, W), np.uint8)
    ok = (sx >= 0) & (sx < W) & (sy >= 0) & (sy < H)
    order = np.argsort(-y, kind='stable')
    order = order[ok[order]]
    img[sy[order], sx[order]] = col[order]
    dep[sy[order], sx[order]] = y[order]
    kind[sy[order], sx[order]] = mat[order]
    alpha = kind > 0
    # dark seams where a clump stands well in front of the one behind it
    seam = alpha & (kind == 2) & ((((np.roll(dep, 1, 0) - dep) > 10) & np.roll(alpha, 1, 0))
                                  | (((np.roll(dep, 1, 1) - dep) > 10) & np.roll(alpha, 1, 1)))
    img[seam] = leafR[0]
    pad = np.pad(alpha, 1)
    below, above = pad[2:, 1:-1], pad[:-2, 1:-1]
    right, left = pad[1:-1, 2:], pad[1:-1, :-2]
    edge = (below | above | right | left) & ~alpha
    img[edge] = leafR[0]
    # selective outline: softer where the edge faces the sun, up and left
    img[edge & (below | right) & ~above & ~left] = leafR[1]
    a = (alpha | edge).astype(np.uint8) * 255
    return Image.fromarray(np.dstack([np.clip(img, 0, 255).astype(np.uint8), a]), 'RGBA')


def bake(grow, seed, size, angle=0.0, bare=False):
    """One tree fitted to a canvas of `size`, trunk foot at bottom centre."""
    W, H = size
    tree, look = grow(seed, bare)
    ang = math.radians(angle)
    pts = [p for c in tree.caps for p in c[:2]] + [c for c, *_ in tree.clumps]
    xr = max(math.hypot(p[0], p[1]) for p in pts) + 6
    zt = max(p[2] for p in pts) + 6
    s = min((W / 2 - 3) / xr, (H - 6) / (zt + xr * K))
    while True:
        caps, clumps = _scaled(tree, ang, s)
        D = int(2 * xr * s) + 6
        g, cn = _voxelize(caps, clumps, look, ang, seed, W, D, H)
        _, y, z = np.nonzero(g)
        # the nearest root sits on the canvas's foot row
        im = _render(g, cn, look, W, H, H - 3 - int(np.max(-z - (y - D / 2) * K)))
        bb = im.getbbox()
        if bb and bb[0] > 0 and bb[1] > 0 and bb[2] < W and bb[3] < H:
            return im
        s *= .94


# canvas, generator, (seed, angle) per variant; seeds chosen by eye
BROADLEAF = {
    'sapling': ((48, 64), broadleaf, [(21, 0), (22, 140), (23, 250)]),
    'young': ((72, 96), broadleaf, [(4, 60), (6, 200), (8, 300)]),
    'mature': ((112, 144), broadleaf, [(4, 0), (12, 120), (15, 240)]),
    'giant': ((144, 192), broadleaf_large, [(9, 0), (9, 120), (17, 240)]),
}


def _named(stem, i):
    return stem if i == 0 else f'{stem}-{i + 1}'


def voxel_trees():
    out = {}
    for age, (size, grow, variants) in BROADLEAF.items():
        for i, (seed, ang) in enumerate(variants):
            name = _named(f'nature-broadleaf-{age}', i)
            out[name] = bake(grow, seed, size, ang)
            out[f'{name}-bare'] = bake(grow, seed, size, ang, bare=True)
    for i, (seed, ang) in enumerate([(7, 0), (7, 130), (19, 250)]):
        out[_named('nature-acacia', i)] = bake(acacia, seed, (112, 108), ang)
    for i, (seed, ang) in enumerate([(3, 0), (11, 120), (14, 240)]):
        out[_named('nature-boreal-spruce', i)] = bake(spruce, seed, (64, 96), ang)
    for i, (seed, ang) in enumerate([(1, 0), (2, 120), (3, 240)]):
        out[_named('nature-cypress', i)] = bake(cypress, seed, (32, 112), ang)
    return out
