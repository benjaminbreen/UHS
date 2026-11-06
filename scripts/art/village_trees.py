"""Landmark species: the trees a place plants by its well, its shrine or its
square. Grown in voxel_trees' Tree and baked the same way, so they share its
light, outline and flat bands."""
import math
import numpy as np

from art.voxel_trees import Tree, roots, bake, unit

JMAPLE_LEAF = ['#1d2e1c', '#2f4a22', '#4a6c28', '#6a8f2e', '#8fb03a', '#b5cc55', '#dbe58a']
JMAPLE_AUTUMN = ['#2e0d12', '#561620', '#86202a', '#b8302e', '#dc4c34', '#f07a44', '#fbb36a']
JMAPLE_BARK = ['#241c1c', '#40322f', '#5c4a44', '#7a665c', '#9a8676']
GINKGO_LEAF = ['#16301e', '#244a26', '#3a6a2c', '#58902f', '#7eb03c', '#a8cc5c', '#d4e690']
GINKGO_AUTUMN = ['#3a2a0a', '#6a4a0e', '#a07214', '#d4a01c', '#eec42c', '#f8e05a', '#fdf3a0']
GINKGO_BARK = ['#2a2622', '#463e36', '#64584c', '#847566', '#a29482']
CHERRY_LEAF = ['#1c2c1c', '#2c4624', '#42642a', '#5e8430', '#7ea43c', '#a6c25a', '#d0dc8a']
CHERRY_BLOSSOM = ['#5a3040', '#8a4a60', '#b46a84', '#d690a6', '#ecb4c4', '#f8d4de', '#fff0f4']
CHERRY_AUTUMN = ['#30140e', '#5a2214', '#8c3a1c', '#bc5a26', '#da8034', '#eeaa4e', '#f8d482']
CHERRY_BARK = ['#241618', '#40282a', '#5e3a3a', '#7e5048', '#9c6a5c']
BANYAN_LEAF = ['#0a2420', '#123a2a', '#1c5532', '#2a7036', '#418c3c', '#68a94c', '#a2c972']
BANYAN_BARK = ['#2a2826', '#4a4640', '#6c665c', '#8e877a', '#b0a998', '#cfc8b6']
PLANE_LEAF = ['#1c2e18', '#2e4b22', '#46692a', '#628a30', '#84aa3c', '#aac858', '#d2e288']
PLANE_AUTUMN = ['#33240f', '#5e4014', '#8b621e', '#b48a2c', '#ccaa40', '#e0c862', '#f0e29a']
PLANE_BARK = ['#3a3a30', '#5e5c4a', '#86836a', '#aeaa8a', '#d0caa8', '#e8e2c4']
CEIBA_LEAF = ['#16281a', '#243f22', '#385a2a', '#507832', '#6e963c', '#94b456', '#c0d27e']
CEIBA_BARK = ['#2c302a', '#4a5046', '#6a7262', '#8c9480', '#b0b6a0']
YEW_LEAF = ['#0a1814', '#11261c', '#193824', '#244b2c', '#346036', '#4c7a44', '#76985e']
YEW_BARK = ['#2a1410', '#4e2418', '#7a3a24', '#a2552f', '#c27a48']


def _out(yaw, tilt):
    return np.array([math.cos(yaw) * math.sin(tilt), math.sin(yaw) * math.sin(tilt), math.cos(tilt)])


def _bare_twigs(t, masses):
    for x, y, z, r, _ in masses:
        t.spray(np.array([x, y, z - 3]), 8, r * .35, r * .4, .7, lift=r * .3)


def japanese_maple(seed, bare=False, leaf=JMAPLE_LEAF):
    """Acer palmatum: two or three sinuous stems from one root, and the leaves
    in thin level tiers, so the crown is layered and seen through."""
    t = Tree(seed, bare)
    roots(t, 3)
    base = t.rng.uniform(0, 2 * math.pi)
    masses = []
    for k in range(3):
        yaw = base + k * 2.1 + t.rng.uniform(-.3, .3)
        tip, d = t.limb((0, 0, 2), _out(yaw, .38), 30, 2.8, 1.6, bend=(0, 0, -.25), wobble=.22, segs=5)
        for j in range(2):
            ty = yaw + (j - .5) * 1.5
            end, _ = t.limb(tip, _out(ty, 1.3), 18, 1.4, .6, bend=(0, 0, .05), wobble=.2, segs=3)
            masses.append((end[0], end[1], end[2], 8, .3))
        masses.append((tip[0] * .6, tip[1] * .6, tip[2] + 11, 9, .3))
    masses.append((0, 0, max(m[2] for m in masses) + 7, 7, .3))
    for x, y, z, r, flat in masses:
        if not bare:
            t.clumps.append(((x, y, z), r, flat))
            a = seed * .7 + x
            t.clumps.append(((x + math.cos(a) * r * .9, y + math.sin(a) * r * .8, z + .5), r * .6, flat))
    if bare:
        _bare_twigs(t, masses)
    return t, dict(leaf=leaf, bark=JMAPLE_BARK, ragged=.55, bounds=[m[:3] for m in masses])


def ginkgo(seed, bare=False, leaf=GINKGO_LEAF):
    """Ginkgo: one straight stem and short branches held stiffly upward, an
    open, rather lopsided column; the temple tree of China, Korea and Japan."""
    t = Tree(seed, bare)
    roots(t, 4)
    t.caps.append(((0, 0, 0), (0, 0, 96), 4.6, 1.2))
    masses = []
    z, yaw = 18.0, t.rng.uniform(0, 2 * math.pi)
    while z < 90:
        f = 1 - (z - 18) / 72
        yaw += 2.4 + t.rng.uniform(-.4, .4)
        length = 8 + 22 * f ** .8 * t.rng.uniform(.8, 1.15)
        tip, _ = t.limb((0, 0, z), _out(yaw, .95), length, 1.8, .7, bend=(0, 0, .15), wobble=.06, segs=2)
        masses.append((tip[0], tip[1], tip[2] + 1, 6 + 3 * f, .65))
        if length > 14:
            mid = np.array([0, 0, z]) + (tip - (0, 0, z)) * .55
            masses.append((mid[0], mid[1], mid[2] + 2, 5 + 2 * f, .65))
        z += t.rng.uniform(5, 8)
    masses.append((0, 0, 98, 6, .9))
    for x, y, z, r, flat in masses:
        if not bare:
            t.clumps.append(((x, y, z), r, flat))
    if bare:
        _bare_twigs(t, masses)
    return t, dict(leaf=leaf, bark=GINKGO_BARK, ragged=.35, bounds=[m[:3] for m in masses])


def cherry(seed, bare=False, leaf=CHERRY_LEAF):
    """Prunus serrulata: a short stem forks low into limbs held out like a
    vase, carrying a wide, airy crown."""
    t = Tree(seed, bare)
    roots(t, 4)
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 14, 4.4, 3.4, wobble=.08)
    base = t.rng.uniform(0, 2 * math.pi)
    masses = []
    for k in range(4):
        yaw = base + k * math.pi / 2 + t.rng.uniform(-.35, .35)
        tip, _ = t.limb(fork, _out(yaw, .85), 26, 2.6, 1.2, bend=(0, 0, .15), wobble=.12, segs=3)
        masses.append((tip[0], tip[1], tip[2] + 3, 11, .7))
        mid = np.asarray(fork) + (tip - fork) * .5
        masses.append((mid[0] * 1.1, mid[1] * 1.1, mid[2] + 8, 9, .7))
    masses.append((0, 0, fork[2] + 26, 11, .75))
    for i, (x, y, z, r, flat) in enumerate(masses):
        if not bare:
            t.clumps.append(((x, y, z), r, flat))
            a = i * 1.9
            t.clumps.append(((x + math.cos(a) * r * .8, y + math.sin(a) * r * .7, z + 1), r * .5, flat))
    if bare:
        _bare_twigs(t, masses)
    return t, dict(leaf=leaf, bark=CHERRY_BARK, ragged=.45, bounds=[m[:3] for m in masses])


def banyan(seed, bare=False):
    """Ficus benghalensis: a stout bole, limbs running out level, and roots
    let down from them that thicken into pillars; the village's meeting tree."""
    t = Tree(seed, bare)
    roots(t, 8)
    top, _ = t.limb((0, 0, 0), (0, 0, 1), 26, 9, 7.5, wobble=.04)
    base = t.rng.uniform(0, 2 * math.pi)
    masses = []
    for k in range(5):
        yaw = base + k * 2 * math.pi / 5 + t.rng.uniform(-.3, .3)
        tip, d = t.limb(top, _out(yaw, 1.3), 40, 4.2, 2, bend=(0, 0, -.05), wobble=.06, segs=4)
        for s in (.35, .55, .75, .95):
            p = np.asarray(top) + (tip - top) * s
            r = t.rng.uniform(.6, 1.9)
            foot = 0 if r > 1 else p[2] * t.rng.uniform(.25, .6)
            t.caps.append((tuple(p), (p[0] + t.rng.uniform(-1, 1), p[1] + t.rng.uniform(-1, 1), foot), r * .7, r))
        masses.append((tip[0], tip[1], tip[2] + 6, 15, .55))
        mid = np.asarray(top) + (tip - top) * .5
        masses.append((mid[0], mid[1], mid[2] + 12, 15, .55))
    masses.append((0, 0, top[2] + 16, 16, .6))
    for x, y, z, r, flat in masses:
        t.clumps.append(((x, y, z), r, flat))
        t.clumps.append(((x * .9, y * .9, z + 5), r * .6, flat))
    return t, dict(leaf=BANYAN_LEAF, bark=BANYAN_BARK, ragged=.3, bounds=[m[:3] for m in masses])


def plane(seed, bare=False, leaf=PLANE_LEAF):
    """Platanus orientalis, the chinar: a massive pale bole that sheds its bark
    in patches, forking into heavy limbs under a broad dome."""
    t = Tree(seed, bare)
    roots(t, 7)
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 20, 8, 6.5, wobble=.04)
    base = t.rng.uniform(0, 2 * math.pi)
    masses = []
    for k in range(5):
        yaw = base + k * 2 * math.pi / 5 + t.rng.uniform(-.25, .25)
        tip, _ = t.limb(fork, _out(yaw, .9), 36, 4.6, 2, bend=(0, 0, .18), wobble=.08, segs=3)
        masses.append((tip[0], tip[1], tip[2] + 4, 13, .72))
        side = np.asarray(fork) + (tip - fork) * .5
        masses.append((side[0], side[1], side[2] + 10, 12, .72))
    masses.append((0, 0, fork[2] + 34, 13, .72))
    for i, (x, y, z, r, flat) in enumerate(masses):
        if not bare:
            t.clumps.append(((x, y, z), r, flat))
            a = i * 2.1
            t.clumps.append(((x + math.cos(a) * r * .7, y + math.sin(a) * r * .6, z + 2), r * .55, flat))
    if bare:
        _bare_twigs(t, masses)
    return t, dict(leaf=leaf, bark=PLANE_BARK, ragged=.25, mottle=.55, bounds=[m[:3] for m in masses])


def ceiba(seed, bare=False):
    """Ceiba pentandra: a tall clean column on plank buttresses, the limbs
    thrown out level at the top under a flat crown; the Maya world tree and the
    West African palaver tree."""
    t = Tree(seed, bare)
    for k in range(5):
        a = k * 2 * math.pi / 5 + t.rng.uniform(-.3, .3)
        for h in (.0, 1.5, 3.0):
            t.caps.append(((math.cos(a) * 2, math.sin(a) * 2, 16 - h * 3), (math.cos(a) * 13, math.sin(a) * 13, h * .5), 2.2, 1.4))
    top, _ = t.limb((0, 0, 0), (0, 0, 1), 72, 6.5, 4.2, wobble=.025)
    base = t.rng.uniform(0, 2 * math.pi)
    masses = []
    for tier, (z, length) in enumerate([(top[2] - 10, 34), (top[2], 26)]):
        for k in range(4):
            yaw = base + k * math.pi / 2 + tier * .8 + t.rng.uniform(-.3, .3)
            tip, _ = t.limb((0, 0, z), _out(yaw, 1.32), length, 2.8, 1.4, bend=(0, 0, .08), wobble=.06, segs=3)
            masses.append((tip[0], tip[1], tip[2] + 3, 12, .38))
            mid = np.array([0, 0, z]) + (tip - (0, 0, z)) * .5
            masses.append((mid[0], mid[1], mid[2] + 5, 10, .38))
    masses.append((0, 0, top[2] + 6, 12, .4))
    for x, y, z, r, flat in masses:
        t.clumps.append(((x, y, z), r, flat))
    return t, dict(leaf=CEIBA_LEAF, bark=CEIBA_BARK, ragged=.35, bounds=[m[:3] for m in masses])


def yew(seed, bare=False):
    """Taxus baccata: a short fluted trunk soon hidden in a dense, dark,
    broad-domed crown; the churchyard tree of Britain and Ireland."""
    t = Tree(seed, bare)
    roots(t, 5)
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 16, 7, 6, wobble=.05)
    masses = []
    for k in range(6):
        yaw = k * 2 * math.pi / 6 + t.rng.uniform(-.3, .3)
        tip, _ = t.limb(fork, _out(yaw, 1.0), 24, 3.2, 1.6, bend=(0, 0, .1), wobble=.1, segs=3)
        masses.append((tip[0], tip[1], tip[2] + 3, 11, .8))
        mid = np.asarray(fork) + (tip - fork) * .5
        masses.append((mid[0], mid[1], mid[2] + 11, 11, .8))
    masses.append((0, 0, fork[2] + 24, 12, .85))
    for x, y, z, r, flat in masses:
        t.clumps.append(((x, y, z), r, flat))
    return t, dict(leaf=YEW_LEAF, bark=YEW_BARK, ragged=.4, bounds=[m[:3] for m in masses])


def _variants(stem, model, size, seeds, seasons=()):
    """Base and seasonal frames per variant: nature-x, nature-x-autumn,
    nature-x-2, nature-x-2-bare, as season-art names them."""
    out = {}
    for i, (seed, ang) in enumerate(seeds):
        name = stem if i == 0 else f'{stem}-{i + 1}'
        out[name] = bake(model, seed, size, ang)
        for season, leaf in seasons:
            if season == 'bare':
                out[f'{name}-bare'] = bake(model, seed, size, ang, bare=True)
            else:
                out[f'{name}-{season}'] = bake(lambda s, b, leaf=leaf: model(s, b, leaf=leaf), seed, size, ang)
    return out


def village_trees():
    return {
        **_variants('nature-japanese-maple', japanese_maple, (96, 88), [(3, 0), (5, 140)],
                    [('autumn', JMAPLE_AUTUMN), ('bare', None)]),
        **_variants('nature-ginkgo', ginkgo, (80, 128), [(2, 0), (6, 150)],
                    [('autumn', GINKGO_AUTUMN), ('bare', None)]),
        **_variants('nature-cherry', cherry, (104, 88), [(4, 0), (9, 130)],
                    [('spring', CHERRY_BLOSSOM), ('autumn', CHERRY_AUTUMN), ('bare', None)]),
        **_variants('nature-banyan', banyan, (176, 120), [(1, 0), (8, 160)]),
        **_variants('nature-plane', plane, (128, 136), [(2, 0), (7, 140)],
                    [('autumn', PLANE_AUTUMN), ('bare', None)]),
        **_variants('nature-ceiba', ceiba, (152, 152), [(3, 0), (5, 130)]),
        **_variants('nature-yew', yew, (104, 88), [(1, 0), (4, 150)]),
    }
