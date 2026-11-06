"""Olive, spruce, beech and date palm, drawn the same two ways as the tropical
trees: broadleaf crowns painted over a voxel bake, palms and conifers drawn
directly as schematic shapes."""
import math
import numpy as np

from art.voxel_trees import Tree, roots, bake
from art.tropical_trees import (Sprite, paintover, bands, blade, _rachis, LEAF, BARK, LEAF_IDS, BARK_IDS)


OLIVE_PAL = [
    '#1a2418', '#2c3a28', '#45553a', '#62724c', '#82905e', '#a4ae7a', '#d0d4a6',
    '#2a2420', '#4a4038', '#6e6252', '#948670', '#bcae92',
]


def olive_model(seed, bare=False):
    """Olea europaea: a squat, twisted, often split trunk leaning two or three
    ways, and a crown broken into separate grey-green tufts with sky between."""
    t = Tree(seed, bare)
    rng = t.rng
    roots(t, 4)
    for k, a in enumerate(rng.uniform(0, 2 * math.pi) + np.array([0, 2.3, 4.3])[:2 + (seed % 2)]):
        base = np.array([math.cos(a) * 2, math.sin(a) * 2, 0])
        fork, d = t.limb(base, (math.cos(a) * .5, math.sin(a) * .5, 1), 20, 3.6, 2.4, bend=(-math.cos(a) * .5, -math.sin(a) * .5, 0), wobble=.14)
        for j in range(4):
            b = a + rng.uniform(-1.5, 1.5)
            tip, _ = t.limb(fork, (math.cos(b), math.sin(b), rng.uniform(.2, .8)), rng.uniform(12, 20), 1.8, .7, wobble=.18)
            t.clumps.append((tuple(tip + (0, 0, 2)), rng.uniform(4.5, 6.5), .8))
    return t, dict(leaf=LEAF_IDS, bark=BARK_IDS, ragged=.45, bounds=[c for c, *_ in t.clumps])


def olive(seed, angle):
    sp = paintover(bake(olive_model, seed, (92, 84), angle), LEAF, BARK, seed, spacing=2.6, sparkle=.5)
    sp.pal = OLIVE_PAL
    return sp.image({**{k: 0 for k in LEAF}, **{k: 7 for k in BARK}})


SPRUCE_PAL = [
    '#08161a', '#0e2426', '#163634', '#204a40', '#2e5e4c', '#447658', '#6a9468',
    '#241a14', '#3e2e22', '#5c4632',
]


def spruce(seed, H=124):
    """Picea abies: a narrow spire of drooping boughs, each sweeping down from
    the stem and lifting at the tip, the upper tiers hanging over the lower,
    the outline ragged where boughs of different length reach out."""
    W = 76
    sp = Sprite((W, H), SPRUCE_PAL)
    rng = np.random.default_rng(seed)
    cx = W / 2 + rng.uniform(-1, 1)
    top, base = 4, H - 12
    for y in range(top + 4, H - 2):
        w = .6 + 1.6 * (y - top) / (H - top)
        for x in range(int(cx - w), int(cx + w) + 1):
            sp.put(x, y, 8 + (x < cx))
    ramp = [0, 1, 2, 3, 4, 5, 6, 6]
    tiers = []
    y, gap = top + 5, 3.6
    while y < base - 2:
        tiers.append(y)
        gap *= 1.06
        y += gap + rng.uniform(-.8, .8)
    for i, ty in enumerate(reversed(tiers)):
        f = (ty - top) / (base - top)
        boughs = []
        for side in (-1, 1):
            for j in range(2):
                half = (4 + f * 30) * rng.uniform(.75, 1.05) * (1 if j == 0 else .7)
                drop = 2 + f * 9 + rng.uniform(-1, 1)
                y0 = ty + j * rng.uniform(1, 2.5)
                pts = []
                for st in np.linspace(0, 1, int(half * 1.6) + 2):
                    lift = 2.2 * max(0, st - .75) / .25
                    pts.append((cx + side * half * st, y0 + drop * math.sin(st * math.pi * .55) - lift))
                tf = 5 if side < 0 else 3
                boughs.append((j, pts, tf - j, max(1.6, 1.2 + f * 3)))
        # Boughs pointing at the viewer: short, hanging, darker.
        for k in range(int(1 + f * 3)):
            x0 = cx + rng.uniform(-f * 10, f * 10)
            pts = [(x0 + (x0 - cx) * .3 * st, ty + 1 + st * (3 + f * 6)) for st in np.linspace(0, 1, 8)]
            boughs.append((2, pts, 4 if x0 < cx else 3, 1.4 + f * 2))
        boughs.sort(key=lambda b: b[0])
        for k, (_, pts, tf, w) in enumerate(boughs):
            blade(sp, pts, tf, ramp, w, tooth=1.5, seed=seed * 100 + i * 10 + k)
    for y in range(top, top + 6):
        sp.put(cx, y, 4 if y > top + 1 else 6)
    return sp.image({**{k: 0 for k in range(7)}, **{k: 7 for k in (7, 8, 9)}})


BEECH_PAL = [
    '#0e2410', '#1a3e16', '#2c5c1c', '#447c22', '#64a02a', '#94c23a', '#d0e47a',
    '#3a3c3a', '#5e605a', '#83857c', '#a8aaa0', '#cfd0c4',
]
BEECH_AUTUMN = [
    '#2a1208', '#4e2008', '#7a3410', '#a44c14', '#c86c1c', '#e0962e', '#f4cc6a',
] + BEECH_PAL[7:]
TWIG = ['#4a4446', '#6a6260']
BEECH_WINTER = BEECH_PAL[:7] + ['#2e2e2c', '#454641', '#5c5e57', '#74766e', '#8c8e84']


def beech_model(seed, bare=False):
    """Fagus sylvatica: a smooth elephant-grey bole forking well up into
    steep limbs, and a tall dome of flat, layered sprays."""
    t = Tree(seed, bare)
    rng = t.rng
    roots(t, 5)
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 30, 5.4, 4.2, wobble=.02)
    for i in range(5):
        a = i * 2 * math.pi / 5 + rng.uniform(-.3, .3)
        mid, d = t.limb(fork, (math.cos(a) * .55, math.sin(a) * .55, 1), 22, 3, 1.8, wobble=.06)
        tip, _ = t.limb(mid, (math.cos(a) * .9, math.sin(a) * .9, .5), 14, 1.8, .8, wobble=.1)
        t.spray(mid, 3, 8, 10, .55, lift=4)
        t.spray(tip, 3, 7, 9, .55)
    t.spray(fork + (0, 0, 40), 3, 7, 11, .6)
    return t, dict(leaf=LEAF_IDS, bark=BARK_IDS, ragged=.3, bounds=[c for c, *_ in t.clumps])


def beech(seed, angle, season=''):
    im = bake(beech_model, seed, (124, 152), angle, bare=season == 'bare')
    sp = paintover(im, LEAF, BARK, seed, spacing=3.4, sparkle=.35)
    sp.pal = (BEECH_AUTUMN if season == 'autumn' else BEECH_WINTER if season == 'bare' else BEECH_PAL) + TWIG
    if season == 'bare':
        # Winter: a haze of fine twigs fills the crown the leaves had.
        crown = bands(bake(beech_model, seed, (124, 152), angle))[0] >= 0
        _, B = bands(im)
        rng = np.random.default_rng(seed)
        ys, xs = np.nonzero((B >= 0) & crown)
        cx = xs.mean()
        for _ in range(520):
            k = rng.integers(len(xs))
            x, y = float(xs[k]), float(ys[k])
            a = math.atan2(-1.2, (x - cx) / 20 + rng.normal(0, .6))
            for _ in range(int(rng.uniform(4, 11))):
                x, y = x + math.cos(a), y + math.sin(a)
                a += rng.normal(0, .35)
                if not (0 <= int(y) < crown.shape[0] and 0 <= int(x) < crown.shape[1]) or not crown[int(y), int(x)]:
                    break
                if sp.idx[int(y), int(x)] < 0:
                    sp.put(x, y, 12 + (rng.random() < .3))
    return sp.image({**{k: 0 for k in LEAF}, **{k: 7 for k in BARK}, 12: 12, 13: 12})


DATE_PAL = [
    '#101e18', '#1a3228', '#284836', '#3a6044', '#527a52', '#729866', '#9cb684', '#cad8aa',
    '#33220f', '#674419', '#9c722b', '#cda452',
    '#1e1610', '#3a2a1c', '#5a4228', '#7c5e38', '#a0804c', '#c4a46a',
    '#5a2a0a', '#a85414', '#e08a1e', '#f4bc3c',
]
DATE_STEM = list(range(12, 18))
DATE_FROND = list(range(8))
DEAD = [8, 8, 8, 9, 9, 10, 11, 11]


def date_palm(seed):
    """Phoenix dactylifera: a tall slim stem scaled with old leaf bases, a
    crown of stiff blue-grey fronds held up and out, hanging orange strings of
    dates under the crown, and an offshoot at the foot."""
    W, H = 144, 164
    sp = Sprite((W, H), DATE_PAL)
    rng = np.random.default_rng(seed)
    foot = W / 2 + rng.uniform(-2, 2)
    top = (foot + rng.uniform(-6, 6), 44)
    for y in range(int(top[1]) - 2, H - 2):
        t = (y - top[1]) / (H - 2 - top[1])
        x0 = top[0] + (foot - top[0]) * max(0, t) ** 1.4
        hw = 3.6 + 1.2 * max(0, t - .9) / .1
        row, ly = int((y + 40) // 4), (y + 40) % 4
        for x in range(int(round(x0 - hw)), int(round(x0 + hw)) + 1):
            u = (x - x0) / hw
            k = 4 if u < -.45 else 3 if u < .3 else 2
            lx = (x - x0 + 20 + 2 * (row % 2)) % 4
            c = abs(lx - 1.5)
            if c > 2.2 - ly * .6:
                k -= 2
            elif ly == 0:
                k += 1
            sp.put(x, y, DATE_STEM[max(0, min(5, k))])
    # An offshoot: a small fan of fronds at the foot.
    side = rng.choice([-1, 1])
    for yaw in (.4, 1.2, 2.0, 2.8):
        blade(sp, _rachis((foot + side * 8, H - 4), yaw, .9, 14, .4), 4, DATE_FROND, 2.6, tooth=2.2, seed=seed + int(yaw * 10))
    fronds = []
    yaw0 = rng.uniform(0, 2 * math.pi)
    for i in range(18):
        yaw = yaw0 + i * 2.39996 + rng.uniform(-.1, .1)
        off = (yaw + math.pi / 2 + math.pi) % (2 * math.pi) - math.pi
        if abs(off) < .5:
            yaw += math.copysign(.5, off) - off
        age = (i % 4) / 3
        depth = math.sin(yaw)
        tf = int(np.clip(round(3.8 - math.cos(yaw) * .7 + (1 - age) * .5 - depth * 1.1), 2, 6))
        L = rng.uniform(52, 60) * (1 + .25 * min(0, depth))
        fronds.append((depth, _rachis(top, yaw, 1.15 - age * 1.15, L, .25 + age * .55), tf, DATE_FROND, 4.8))
    for i in range(3):
        yaw = yaw0 + 1 + i * 2.1
        fronds.append((math.sin(yaw) + 1.5, _rachis((top[0], top[1] + 4), yaw, -1.2, 22, .05), 3, DEAD, 3))
    fronds.sort(key=lambda f: -f[0])
    for k, (depth, pts, tf, ramp, width) in enumerate(fronds):
        blade(sp, pts, tf, ramp, width, tooth=2.0, seed=seed * 60 + k)
    # Date strings hang in arcs from the heart of the crown.
    for s in (-1, 1):
        for j in range(5):
            x0 = top[0] + s * (3 + j * 1.6)
            for d in range(10 + j):
                x = x0 + s * d * .25
                y = top[1] + 3 + d
                sp.put(x, y, 18 + (d % 3 == 0) + (j % 2) + (d < 3))
    return sp.image({**{k: 0 for k in DATE_FROND}, **{k: 8 for k in range(8, 12)}, **{k: 12 for k in DATE_STEM},
                     **{k: 18 for k in range(18, 22)}})


def forest_trees():
    return {
        'nature-olive': olive(1, 0),
        'nature-olive-2': olive(4, 130),
        'nature-olive-3': olive(6, 250),
        'nature-boreal-spruce': spruce(2),
        'nature-boreal-spruce-2': spruce(7, 112),
        'nature-boreal-spruce-3': spruce(12, 104),
        'nature-beech': beech(3, 0),
        'nature-beech-autumn': beech(3, 0, 'autumn'),
        'nature-beech-bare': beech(3, 0, 'bare'),
        'nature-beech-2': beech(8, 140),
        'nature-beech-2-autumn': beech(8, 140, 'autumn'),
        'nature-beech-2-bare': beech(8, 140, 'bare'),
        'nature-date-palm': date_palm(3),
        'nature-date-palm-2': date_palm(9),
    }
