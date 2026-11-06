"""Regional trees still missing from the world, drawn like the new tropical and
forest trees: leafy crowns painted over a voxel bake, conifers, palms and
rosette plants drawn directly."""
import math
import numpy as np

from art.voxel_trees import Tree, roots, bake
from art.tropical_trees import (Sprite, paintover, bands, blade, paddle, _rachis, _line,
                                LEAF, BARK, LEAF_IDS, BARK_IDS)


def _grown(model):
    def grow(seed, bare):
        t = Tree(seed, bare)
        model(t, t.rng)
        return t, dict(leaf=LEAF_IDS, bark=BARK_IDS, ragged=.3, bounds=[c for c, *_ in t.clumps])
    return grow


def _paint(model, seed, size, angle, pal, spacing=3.4, sparkle=.35, fruit=None):
    im = bake(_grown(model), seed, size, angle)
    sp = paintover(im, LEAF, BARK, seed, spacing=spacing, sparkle=sparkle)
    sp.pal = pal[:12] + (fruit[1] if fruit else [])
    outline = {**{k: 0 for k in LEAF}, **{k: 7 for k in BARK}}
    if fruit:
        glyph, tones, n, band = fruit[0], fruit[1], fruit[2], fruit[3]
        L, _ = bands(im)
        ys, xs = np.nonzero(L >= band)
        rng = np.random.default_rng(seed + 5)
        placed = []
        for _ in range(400):
            k = rng.integers(len(xs))
            x, y = xs[k], ys[k]
            if all(abs(x - px) > len(glyph[0]) + 2 or abs(y - py) > len(glyph) + 2 for px, py in placed):
                placed.append((x, y))
                sp.stamp(glyph, x - len(glyph[0]) // 2, y - len(glyph) // 2, {c: 12 + i for i, c in enumerate('oDMH')})
            if len(placed) == n:
                break
        outline.update({12 + i: 12 for i in range(len(tones))})
    return sp.image(outline)


def _masses(t, rng, centre, n, spread, r, flat, z0=0.0):
    for i in range(n):
        a = i * 2.39996 + rng.uniform(-.2, .2)
        d = spread * math.sqrt((i + .5) / n)
        t.clumps.append(((centre[0] + math.cos(a) * d, centre[1] + math.sin(a) * d * .85,
                          centre[2] + z0 + rng.uniform(-2, 2) - d * .15), r * rng.uniform(.85, 1.15), flat))


# --- Poplars -----------------------------------------------------------------

POPLAR_PAL = ['#0e2412', '#1a3c18', '#2a5a1e', '#3e7a24', '#5a982c', '#86b83c', '#c6dc72',
              '#2e2a24', '#4c463c', '#6c6656', '#908a74', '#b4ae96']


def _lombardy(t, rng):
    """Black poplar, Lombardy form: a tight column of upswept limbs."""
    t.limb((0, 0, 0), (0, 0, 1), 78, 3.4, 1.2, wobble=.015, segs=6)
    for i in range(17):
        z = 10 + i * 5 + rng.uniform(-1.5, 1.5)
        w = 7.5 * math.sin(math.pi * min(1, (z - 4) / 86) ** .8) + 2
        a = rng.uniform(0, 2 * math.pi)
        t.clumps.append(((math.cos(a) * w * .35, math.sin(a) * w * .35, z), w * rng.uniform(.75, .95), 1.3))


def _cottonwood(t, rng):
    """Cottonwood (and the spreading black poplar of rivers): a massive trunk
    forking low into big leaning limbs, a broad, open, ragged crown."""
    roots(t, 6)
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 16, 7, 6, wobble=.03)
    for i in range(4):
        a = i * math.pi / 2 + rng.uniform(-.4, .4)
        mid, _ = t.limb(fork, (math.cos(a) * .7, math.sin(a) * .7, 1), 26, 4.2, 2.6, wobble=.08)
        tip, _ = t.limb(mid, (math.cos(a) * .8, math.sin(a) * .8, .7), 18, 2.4, 1.2, wobble=.12)
        _masses(t, rng, tip, 4, 9, 10, .75)
        _masses(t, rng, mid, 2, 6, 9, .75, 6)


# --- Broadleaves of the Old World and the tropics ------------------------------

CHESTNUT_PAL = ['#0c2010', '#173818', '#245420', '#367026', '#4f8e2c', '#78ac3a', '#b8d266',
                '#2a1c14', '#46301e', '#64462c', '#86613c', '#a88052']
CATKIN = (["o", "D", "M", "H"], ['#8c7a2a', '#c8b448', '#e8da7a', '#f6f0b4'])


def _chestnut(t, rng):
    """Sweet chestnut: a short, stout bole with spiralling bark under a broad,
    dense, rounded crown of long toothed leaves."""
    roots(t, 6.5)
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 18, 7.5, 6, wobble=.03)
    for i in range(5):
        a = i * 2 * math.pi / 5 + rng.uniform(-.3, .3)
        tip, _ = t.limb(fork, (math.cos(a), math.sin(a), .8), 24, 4, 1.6, wobble=.08)
        _masses(t, rng, tip, 3, 7, 11, .8, 3)
    _masses(t, rng, fork + (0, 0, 30), 4, 10, 12, .8)


SAL_PAL = ['#102410', '#1c3e16', '#2e5c1c', '#447c22', '#64a02a', '#94c23e', '#d2e47a',
           '#2a2420', '#463c32', '#665848', '#8a7a62', '#ae9e82']


def _sal(t, rng):
    """Sal: a tall straight bole and an oval crown held high, the lower trunk
    clean of branches as in a sal forest."""
    top, _ = t.limb((0, 0, 0), (0, 0, 1), 64, 4.2, 2.4, wobble=.02, segs=5)
    for i in range(7):
        a = i * 2.39996 + rng.uniform(-.3, .3)
        z = 30 + i * 5
        tip, _ = t.limb((0, 0, z), (math.cos(a), math.sin(a), .7), 12 - i * .6, 2, .9, wobble=.08)
        t.clumps.append((tuple(tip + (0, 0, 2)), rng.uniform(8, 9.5), .9))
    t.clumps.append((tuple(top + (0, 0, 4)), 9, 1))


NEEM_PAL = ['#0e2610', '#184016', '#265e1c', '#3a7e20', '#58a026', '#86c036', '#c4e070',
            '#2c241c', '#4a3c2e', '#6a5642', '#8c7458', '#ae9474']


def _neem(t, rng):
    """Neem: a short trunk and a dense, rounded, fine-leaved crown, often
    wider than tall, the shade tree of every north Indian village."""
    roots(t, 5)
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 15, 5.5, 4.6, wobble=.04)
    for i in range(6):
        a = i * 2 * math.pi / 6 + rng.uniform(-.3, .3)
        tip, _ = t.limb(fork, (math.cos(a), math.sin(a), .9), 20, 3, 1.2, wobble=.1)
        _masses(t, rng, tip, 3, 6, 9, .75, 2)
    _masses(t, rng, fork + (0, 0, 24), 3, 8, 10, .8)


BREADFRUIT_PAL = ['#082014', '#103a1e', '#1a5626', '#28742c', '#3e9232', '#66b040', '#acd46e',
                  '#2a241c', '#46402e', '#665e44', '#8a805c', '#aea47a']
BREADFRUIT = ([".ooo.", "oMHHo", "oDMMo", "oDDMo", ".ooo."], ['#2e4210', '#86ac2c', '#b4d044', '#e4f088'])


def _breadfruit(t, rng):
    """Breadfruit: a straight grey trunk and a dense, tall-domed crown of
    huge, deeply lobed glossy leaves, round green fruit hanging in it."""
    roots(t, 5)
    top, _ = t.limb((0, 0, 0), (0, 0, 1), 26, 5, 3.6, wobble=.03)
    for i in range(6):
        a = i * 2 * math.pi / 6 + rng.uniform(-.3, .3)
        tip, _ = t.limb(top - (0, 0, 6), (math.cos(a), math.sin(a), .6), 18, 2.6, 1.2, wobble=.1)
        _masses(t, rng, tip, 2, 5, 9.5, .9, 3)
    _masses(t, rng, top + (0, 0, 16), 4, 9, 11, .95)


SHEA_PAL = ['#14240e', '#223c14', '#34561a', '#4a7220', '#66902a', '#90ae40', '#cad478',
            '#2a1e18', '#463226', '#644a36', '#866648', '#a8865e']


def _shea(t, rng):
    """Shea (karité): a short, crooked, thick-barked trunk and a dense round
    crown of leathery leaves bunched at the branch ends; kept in the fields
    when the bush is cleared."""
    roots(t, 4.5)
    fork, _ = t.limb((0, 0, 0), (rng.uniform(-.15, .15), 0, 1), 14, 5, 4, wobble=.08)
    for i in range(5):
        a = i * 2 * math.pi / 5 + rng.uniform(-.4, .4)
        tip, _ = t.limb(fork, (math.cos(a), math.sin(a), .7), 18, 2.8, 1.2, wobble=.16)
        _masses(t, rng, tip, 3, 5, 8, .8, 2)
    _masses(t, rng, fork + (0, 0, 20), 3, 6, 9, .8)


STONE_PINE_PAL = ['#0a1c14', '#12301e', '#1c4626', '#285c2c', '#3a7434', '#548c40', '#88b05c',
                  '#30201c', '#52362a', '#76503a', '#9a6e4e', '#bc9068']


def _stone_pine(t, rng):
    """Stone pine: a tall bare trunk, often leaning or forked, under a broad,
    flat-topped umbrella crown."""
    lean = rng.uniform(-.15, .15)
    fork, _ = t.limb((0, 0, 0), (lean, 0, 1), 36, 4, 3, wobble=.03, segs=5)
    for i in range(6):
        a = i * 2 * math.pi / 6 + rng.uniform(-.3, .3)
        tip, _ = t.limb(fork, (math.cos(a), math.sin(a), .45), 30, 2.2, 1, wobble=.05)
        _masses(t, rng, tip + (0, 0, 3), 3, 7, 8, .38)
    _masses(t, rng, fork + (0, 0, 13), 4, 10, 9, .38)


AHUEHUETE_PAL = ['#0e1e12', '#18321a', '#244a22', '#34622a', '#4a7c34', '#6c9a46', '#a6c478',
                 '#2a1a14', '#482c20', '#6a422e', '#8e5c40', '#b27c58']


def _ahuehuete(t, rng):
    """Ahuehuete (Montezuma cypress): an enormous fluted, buttressed trunk
    splitting into heavy limbs, and a broad, ragged crown of feathery
    drooping sprays."""
    for k in range(7):
        a = k * 2 * math.pi / 7 + rng.uniform(-.2, .2)
        t.caps.append(((0, 0, 14), (math.cos(a) * 13, math.sin(a) * 13, 0), 4, 2))
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 24, 10, 8, wobble=.03)
    for i in range(5):
        a = i * 2 * math.pi / 5 + rng.uniform(-.3, .3)
        mid, _ = t.limb(fork, (math.cos(a) * .8, math.sin(a) * .8, 1), 22, 5, 3, wobble=.1)
        tip, _ = t.limb(mid, (math.cos(a), math.sin(a), .5), 16, 3, 1.4, wobble=.14)
        _masses(t, rng, tip, 3, 8, 9, .7, -1)
        _masses(t, rng, mid, 1, 4, 8, .7, 6)


# --- Drawn conifers --------------------------------------------------------

RED_CEDAR_PAL = ['#0c1e12', '#14301a', '#1e4620', '#2c5e26', '#40782c', '#5c9436', '#8eb456', '#c4d886',
                 '#2a120c', '#4e2416', '#783a22', '#a05634']
SUGI_PAL = ['#0a1a14', '#12281c', '#1a3a24', '#26502c', '#346834', '#4a803e', '#709c54', '#a6c07c',
            '#2c140e', '#502618', '#7a3c24', '#a45a36']


def conifer(seed, pal, W, H, droop, sprays, flare, round_top=False):
    """A drawn conifer of drooping boughs, upper tiers over lower. `sprays`
    hangs lacy pendants under each bough (red cedar); `round_top` gives the
    blunt, tufted crown of sugi; `flare` widens the foot."""
    sp = Sprite((W, H), pal)
    rng = np.random.default_rng(seed)
    cx = W / 2 + rng.uniform(-1, 1)
    top, base = 4, H - 18
    for y in range(int(top + (H - top) * .5), H - 2):
        f = (y - top) / (H - top)
        w = .8 + 2.2 * f + flare * max(0, f - .9) / .1
        for x in range(int(cx - w), int(cx + w) + 1):
            u = (x - cx) / max(w, 1)
            sp.put(x, y, 8 + (2 if u < -.3 else 1 if u < .35 else 0) + ((y // 3 + x) % 4 == 0))
    ramp = list(range(8))
    tiers, y, gap = [], top + 5, 4.2
    while y < base:
        tiers.append(y)
        gap *= 1.05
        y += gap + rng.uniform(-.8, .8)
    for i, ty in enumerate(reversed(tiers)):
        f = (ty - top) / (base - top)
        shape = math.sin(min(1, f * (1.6 if round_top else 1.15)) * math.pi / 2) if round_top else f
        boughs = []
        for side in (-1, 1):
            for j in range(2):
                half = (5 + shape * (W / 2 - 9)) * rng.uniform(.75, 1.05) * (1 if j == 0 else .7)
                drop = droop * (2 + f * 8) + rng.uniform(-1, 1)
                y0 = ty + j * rng.uniform(1, 2.5)
                pts = []
                for st in np.linspace(0, 1, int(half * 1.6) + 2):
                    lift = 2.4 * max(0, st - .78) / .22
                    pts.append((cx + side * half * st, y0 + drop * math.sin(st * math.pi * .55) - lift))
                boughs.append((j, pts, (5 if side < 0 else 4) - j, max(1.8, 1.4 + f * 3)))
                if sprays:
                    for st in (.45, .7, .92):
                        px, py = pts[int(st * (len(pts) - 1))]
                        hang = [(px + side * k * .25, py + k) for k in np.linspace(0, 3 + f * 5, 7)]
                        boughs.append((1.5, hang, 3, 1.4))
        boughs.sort(key=lambda b: b[0])
        for k, (_, pts, tf, w) in enumerate(boughs):
            blade(sp, pts, tf, ramp, w, tooth=1.4 if not round_top else 3.0, seed=seed * 100 + i * 10 + k)
    for y in range(top, top + 6):
        sp.put(cx, y, 5 if y > top + 1 else 7)
    return sp.image({**{k: 0 for k in range(8)}, **{k: 8 for k in range(8, 12)}})


# --- Casuarina -------------------------------------------------------------

CASUARINA_PAL = ['#0e1c16', '#182c20', '#22402a', '#305434', '#426a40', '#5c8452', '#86a470',
                 '#2a221e', '#463a30', '#665646', '#8a785e']


def casuarina(seed):
    """Casuarina (she-oak, ironwood): a straight grey trunk, open tiers of
    thin branches, and from each a weeping tuft of fine jointed twigs that
    reads like hanging pine needles."""
    W, H = 96, 140
    sp = Sprite((W, H), CASUARINA_PAL)
    rng = np.random.default_rng(seed)
    cx = W / 2
    top = 14
    for y in range(top, H - 2):
        f = (y - top) / (H - top)
        w = 1 + 2 * f
        for x in range(int(cx - w), int(cx + w) + 1):
            sp.put(x, y, 7 + (2 if x < cx - .5 else 1 if x < cx + 1 else 0))
    tufts = []
    for i in range(11):
        y0 = top + 6 + i * 7 + rng.uniform(-2, 2)
        f = (y0 - top) / 90
        side = -1 if i % 2 else 1
        reach = (8 + 26 * math.sin(min(1, f * 1.3) * math.pi * .8)) * rng.uniform(.8, 1.1)
        arm = _line((cx, y0), (cx + side * reach, y0 - 4 - rng.uniform(0, 4)))
        for x, y in arm:
            sp.put(x, y, 8)
        tufts.append(arm[len(arm) // 2])
        tufts.append(arm[-1])
    tufts.append((cx, top))
    tufts.sort(key=lambda p: p[1])
    for (tx, ty) in tufts:
        n = int(rng.integers(12, 18))
        for k in range(n):
            x0 = tx + rng.uniform(-7, 7)
            y0 = ty - rng.uniform(0, 4)
            L = rng.uniform(7, 14)
            lit = x0 < tx
            for d in range(int(L)):
                t = d / L
                x = x0 + (x0 - tx) * .08 * d
                y = y0 + d
                tone = 2 + (lit and t < .5) + (t < .25) + (k % 3 == 0)
                sp.put(x, y, min(6, tone + (lit and k % 4 == 0)))
        for k in range(10):
            sp.put(tx + rng.uniform(-6, 6), ty - rng.uniform(1, 4), 5 + (k % 3 == 0))
    return sp.image({**{k: 0 for k in range(7)}, **{k: 7 for k in range(7, 11)}})


# --- Pandanus --------------------------------------------------------------

PANDANUS_PAL = ['#0e2014', '#18341c', '#244c24', '#32662c', '#468236', '#62a040', '#8cc05a', '#c4e08a',
                '#3a2e22', '#5a4a36', '#7e6a4c', '#a48c66',
                '#7a3a0a', '#c06418', '#ec9a2c', '#f8d064']


def pandanus(seed):
    """Pandanus (screw pine): a forked trunk propped on stilt roots, each arm
    ending in a spiral tuft of long, saw-edged strap leaves that arch and
    hang, and a big segmented fruit like a pineapple under one tuft."""
    W, H = 112, 120
    sp = Sprite((W, H), PANDANUS_PAL)
    rng = np.random.default_rng(seed)
    foot = (W / 2, H - 3)
    bark = [8, 9, 10, 11]

    def wood(pts, w):
        for i, (x, y) in enumerate(pts):
            for dx in range(-int(w), int(w) + 1):
                sp.put(x + dx, y, bark[2 if dx < 0 else 1 if dx == 0 else 0] + (i % 5 == 0))

    for k in (-1, -.4, .5, 1):
        wood(_line((foot[0] + k * 12, foot[1]), (foot[0] + k * 2, foot[1] - 20 - abs(k) * 4)), .6)
    fork = (foot[0] + rng.uniform(-3, 3), foot[1] - 44)
    wood(_line((foot[0], foot[1] - 16), fork), 2.2)
    tips = []
    for side in (-1, 1, rng.choice([-1, 1]) * .2):
        tip = (fork[0] + side * rng.uniform(14, 22), fork[1] - rng.uniform(14, 24))
        wood(_line(fork, tip), 1.5)
        tips.append(tip)
    tips.sort(key=lambda p: p[1])
    for n, (tx, ty) in enumerate(tips):
        leaves = []
        for j in range(12):
            yaw = j * 2.39996 + rng.uniform(-.1, .1)
            age = j % 3 / 2
            depth = math.sin(yaw)
            pts = _rachis((tx, ty), yaw, 1.0 - age * 1.3, rng.uniform(18, 24), .6 + age * .8)
            tf = int(np.clip(round(4.4 - depth * 1.1 - math.cos(yaw) * .5), 2, 6))
            leaves.append((depth, pts, tf))
        leaves.sort(key=lambda l: -l[0])
        for k, (depth, pts, tf) in enumerate(leaves):
            blade(sp, pts, tf, list(range(8)), 2.2, tooth=1.2, seed=seed * 80 + n * 20 + k)
        if n == len(tips) - 1:
            fx, fy = tx + 2, ty + 6
            for y in range(9):
                for x in range(-3, 4):
                    if (x / 3.6) ** 2 + ((y - 4) / 4.8) ** 2 <= 1:
                        sp.put(fx + x, fy + y, 12 + ((x + y) % 2) + (x < 0) + (y < 3))
    return sp.image({**{k: 0 for k in range(8)}, **{k: 8 for k in range(8, 12)}, **{k: 12 for k in range(12, 16)}})


# --- Doum palm -------------------------------------------------------------

DOUM_PAL = ['#14201a', '#203424', '#2e4a30', '#40623c', '#567c4a', '#74985e', '#9cb67e', '#c8d6a6',
            '#2c2620', '#4a4236', '#6c624e', '#928668', '#b8ac8a',
            '#5a2e12', '#9a5a22', '#d08a3a']


def doum_palm(seed):
    """Doum palm: the palm that branches. The grey stem forks and forks
    again, each arm topped with a fan of stiff, split fan leaves, and
    clusters of glossy brown fruit hang under the crowns."""
    W, H = 132, 136
    sp = Sprite((W, H), DOUM_PAL)
    rng = np.random.default_rng(seed)
    bark = [8, 9, 10, 11, 12]

    def stem(a, b, w):
        for i, (x, y) in enumerate(_line(a, b)):
            for dx in range(-int(w), int(w) + 1):
                u = dx / max(w, 1)
                sp.put(x + dx, y, bark[3 if u < -.3 else 2 if u < .4 else 1] - (i % 4 == 0))

    base = (W / 2, H - 3)
    fork = (base[0] + rng.uniform(-3, 3), H - 52)
    stem(base, fork, 3)
    crowns = []
    for s1 in (-1, 1):
        f2 = (fork[0] + s1 * rng.uniform(16, 22), fork[1] - rng.uniform(20, 28))
        stem(fork, f2, 2.4)
        if rng.random() < .7:
            for s2 in (-1, 1):
                tip = (f2[0] + s2 * rng.uniform(12, 17), f2[1] - rng.uniform(12, 18))
                stem(f2, tip, 1.8)
                crowns.append(tip)
        else:
            tip = (f2[0] + s1 * 3, f2[1] - 16)
            stem(f2, tip, 1.8)
            crowns.append(tip)
    crowns.sort(key=lambda p: p[1])
    for n, (tx, ty) in enumerate(crowns):
        for j in range(3):
            fx, fy = tx + rng.uniform(-4, 4), ty + 4 + rng.uniform(0, 2)
            sp.put(fx, fy, 14); sp.put(fx + 1, fy, 15); sp.put(fx, fy + 1, 13)
        fans = []
        for j in range(5):
            yaw = j * 2.39996 + rng.uniform(-.2, .2)
            age = j % 3 / 2
            pet = _rachis((tx, ty), yaw, 1.0 - age * 1.1, 6, .3)
            fans.append((math.sin(yaw), pet, age))
        fans.sort(key=lambda f: -f[0])
        for k, (depth, pet, age) in enumerate(fans):
            for x, y in pet:
                sp.put(x, y, 3)
            (ex, ey), (px, py) = pet[-1], pet[-2]
            head = math.atan2(ey - py, ex - px)
            tf = int(np.clip(round(4.6 - depth * 1.2 - age), 2, 6))
            span = 1.1 + .5 * abs(math.cos(head))
            for i in range(-6, 7):
                a = head + i / 6 * span
                L = 11 - abs(i) * .35 + rng.uniform(-1, 1)
                lit = (math.cos(a) < 0) + (math.sin(a) < -.3)
                for d in np.linspace(0, L, int(L * 2)):
                    x, y = ex + math.cos(a) * d, ey + math.sin(a) * d * .8
                    if d < 3.5:
                        for e in (-1, 0, 1):
                            sp.put(x + e, y, tf - 1)
                    tone = tf + lit - (d > L * .75) - (i % 2 == 0 and d > 4)
                    if d > L - 2 and i % 2:
                        sp.put(x + math.cos(a + .3), y + math.sin(a + .3), tone - 1)
                    sp.put(x, y, int(np.clip(tone, 1, 7)))
    return sp.image({**{k: 0 for k in range(8)}, **{k: 8 for k in range(8, 13)}, **{k: 13 for k in (13, 14, 15)}})


# --- Enset -----------------------------------------------------------------

ENSET_PAL = ['#0e2410', '#1a3e16', '#2a5a1e', '#3e7826', '#589630', '#7cb240', '#acd06a', '#dcec9e',
             '#4a1010', '#7a1c18', '#a83224',
             '#2a3418', '#46552a', '#66763c', '#889650']


def enset(seed):
    """Enset (false banana): the Ethiopian highland staple, a swollen
    pseudostem under a tall upright vase of huge paddle leaves with red
    midribs, no fruit bunch, grown round every homestead."""
    W, H = 120, 150
    sp = Sprite((W, H), ENSET_PAL)
    rng = np.random.default_rng(seed)
    foot = W / 2 + rng.uniform(-2, 2)
    top = (foot, H - 40)
    for y in range(int(top[1]), H - 2):
        t = (y - top[1]) / (H - 2 - top[1])
        hw = 4 + 6 * math.sin(min(1, t * 1.1) * math.pi * .6)
        for x in range(int(round(foot - hw)), int(round(foot + hw)) + 1):
            u = (x - foot) / hw
            k = 3 if u < -.4 else 2 if u < .35 else 1
            if abs(u) > .55 and (y // 5 + int(u * 3)) % 3 == 0:
                k -= 1
            sp.put(x, y, 11 + k)
            if abs(u - .5) < .08 or abs(u + .2) < .06:
                sp.put(x, y, 9)
    leaves = []
    yaw0 = rng.uniform(0, 2 * math.pi)
    for i in range(9):
        yaw = yaw0 + i * 2.39996 + rng.uniform(-.1, .1)
        yaw -= .4 * math.sin(2 * yaw)
        off = (yaw + math.pi / 2 + math.pi) % (2 * math.pi) - math.pi
        if abs(off) < .6:
            yaw += math.copysign(.6, off) - off
        age = i / 8
        depth = math.sin(yaw)
        tf = int(np.clip(round(4 - depth * 1.1 - math.cos(yaw) * .5 + (1 - age) * .5), 2, 6))
        L = rng.uniform(66, 76) * (1 + .3 * min(0, depth))
        leaves.append((depth, _rachis(top, yaw, 1.32 - age * .4, L, .12 + age * .45), tf))
    leaves.sort(key=lambda l: -l[0])
    for k, (depth, pts, tf) in enumerate(leaves):
        paddle(sp, pts, tf, list(range(8)), 6.5, 1 + k % 3, seed * 40 + k, stalk=.1, rib=0)
        n = len(pts)
        for j, (x, y) in enumerate(pts[:int(n * .94)]):
            sp.put(x, y, 10 if j < n * .5 else 9)
    return sp.image({**{k: 0 for k in range(8)}, **{k: 8 for k in (8, 9, 10)}, **{k: 11 for k in range(11, 15)}})


# --- Grass tree ------------------------------------------------------------

GRASSTREE_PAL = ['#0e1c10', '#1a3218', '#2a4c22', '#3e682c', '#58863a', '#7ea452', '#b2c47c',
                 '#3a3022', '#6a5a3a', '#9a8a5e', '#c6b88a',
                 '#0c0a0a', '#1e1a18', '#34302a',
                 '#4a3a20', '#e8dcb0']


def grass_tree(seed):
    """Xanthorrhoea: a short black fire-scorched trunk under a fountain of
    fine grassy leaves, green on top and a dry straw skirt hanging below,
    and a tall spear of a flower spike."""
    W, H = 84, 116
    sp = Sprite((W, H), GRASSTREE_PAL)
    rng = np.random.default_rng(seed)
    cx = W / 2 + rng.uniform(-1, 1)
    top = H - 36
    for y in range(top, H - 2):
        w = 4 + (y > H - 6) * 1
        for x in range(int(cx - w), int(cx + w) + 1):
            u = (x - cx) / w
            sp.put(x, y, 11 + (u < -.2) + (u < -.6) * 0 + ((x * 3 + y) % 5 == 0))
    for y in range(top - 52, top - 12):
        sp.put(cx, y, 14)
        sp.put(cx + 1, y, 14 if y < top - 46 else 13)
        if y > top - 46 and (y + seed) % 2 == 0:
            sp.put(cx - (y % 4 == 0), y, 15)
    strands = []
    for k in range(240):
        a = rng.uniform(0, 2 * math.pi)
        dead = k < 70
        up = rng.uniform(-1.3, -.6) if dead else rng.uniform(-.2, 1.45)
        L = rng.uniform(12, 20) if dead else rng.uniform(16, 25)
        strands.append((math.sin(a) - 3 * dead, a, up, L))
    strands.sort(key=lambda s: -s[0])
    for depth, a, up, L in strands:
        dead = depth < -2
        depth += 3 * dead
        x, y = cx, top - (2 if dead else 6)
        dx, dy = math.cos(a) * math.cos(up), -math.sin(up) - math.sin(a) * .3 * math.cos(up)
        for d in range(int(L)):
            x += dx
            y += dy
            dy += .07
            t = d / L
            if dead:
                k = 7 + (t > .3) + (dx < 0) + (t > .7)
            else:
                k = 2 + (dx < -.2) + (t > .4) + (depth < 0) + (t > .8)
            sp.put(x, y, min(10, k) if dead else min(6, k))
    return sp.image({**{k: 0 for k in range(7)}, **{k: 7 for k in range(7, 11)}, **{k: 11 for k in (11, 12, 13)}, 14: 11, 15: 14})


def sugi(seed, H):
    """Sugi (Japanese cedar): a straight red trunk and a narrow spire of
    short branches, each ending in a dense rounded tuft of awl needles, so
    the crown reads lumpy rather than tiered like a spruce."""
    W = 64
    sp = Sprite((W, H), SUGI_PAL)
    rng = np.random.default_rng(seed)
    cx = W / 2 + rng.uniform(-1, 1)
    top = 5
    for y in range(int(top + (H - top) * .4), H - 2):
        f = (y - top) / (H - top)
        w = 1 + 2.2 * f + 2 * max(0, f - .93) / .07
        for x in range(int(cx - w), int(cx + w) + 1):
            u = (x - cx) / max(w, 1)
            sp.put(x, y, 8 + (2 if u < -.3 else 1 if u < .35 else 0) + ((y // 3 + x) % 4 == 0))
    base = H - 22
    tufts = []
    y = top + 3
    while y < base:
        f = (y - top) / (base - top)
        half = 3 + (W / 2 - 10) * math.sin(min(1, f * 1.25) * math.pi / 2)
        n = 1 if f < .08 else 2 if f < .3 else 3
        for j in range(n):
            u = (j + .5) / n * 2 - 1 if n > 1 else 0
            for side in ((-1, 1) if n > 1 else (0,)):
                x = cx + side * half * (.45 + .55 * abs(u)) * rng.uniform(.85, 1.05) if side else cx
                tufts.append((y + rng.uniform(-1, 1) + (n - 1 - abs(u)) * .8, x, 3.2 + f * 3.4, 2.4 + f * 1.6))
        if n > 1:
            tufts.append((y + 1.5, cx + rng.uniform(-1, 1), 3.4 + f * 4, 2.6 + f * 1.6))
        y += 3.2 + f * 3.5
    tufts.sort(key=lambda t: t[0])
    for ty, tx, rx, ry in tufts:
        if abs(tx - cx) > 2:
            for x, y in _line((cx, ty + ry * .8), (tx, ty + ry * .3)):
                sp.put(x, y, 9)
    for k, (ty, tx, rx, ry) in enumerate(tufts):
        for y in range(int(ty - ry - 1), int(ty + ry + 3)):
            for x in range(int(tx - rx - 1), int(tx + rx + 2)):
                u, v = (x - tx) / rx, (y - ty) / ry
                edge = 1 + .22 * math.sin(x * 2.1 + y * 1.3 + k)
                if u * u + v * v > edge:
                    if v > .5 and abs(u) < .8 and (x + k) % 2 == 0 and u * u + (v - .6) ** 2 < 1.3:
                        sp.put(x, y, 1)
                    continue
                lit = -v * .9 - u * .5 + (.35 if (x * 3 + y * 2 + k) % 5 == 0 else 0)
                sp.put(x, y, 2 + int(np.clip(round(lit * 1.8 + 1.4), 0, 5)))
    for y in range(top - 2, top + 2):
        sp.put(cx, y, 5)
    return sp.image({**{k: 0 for k in range(8)}, **{k: 8 for k in range(8, 12)}})


def drawn_trees():
    return {
        'nature-red-cedar': conifer(3, RED_CEDAR_PAL, 100, 156, 1.5, True, 6),
        'nature-red-cedar-2': conifer(8, RED_CEDAR_PAL, 100, 148, 1.5, True, 6),
        'nature-sugi': sugi(2, 140),
        'nature-sugi-2': sugi(6, 126),
        'nature-casuarina': casuarina(3),
        'nature-casuarina-2': casuarina(9),
        'nature-pandanus': pandanus(2),
        'nature-pandanus-2': pandanus(7),
        'nature-doum-palm': doum_palm(3),
        'nature-doum-palm-2': doum_palm(8),
        'nature-enset': enset(4),
        'nature-enset-2': enset(10),
        'nature-grass-tree': grass_tree(2),
        'nature-grass-tree-2': grass_tree(5),
    }


def _pad(im):
    from PIL import Image
    out = Image.new('RGBA', (im.width + 4, im.height + 3))
    out.paste(im, (2, 2))
    return out


def leafy_trees():
    return {
        'nature-lombardy-poplar': _paint(_lombardy, 2, (52, 144), 0, POPLAR_PAL, 2.8),
        'nature-lombardy-poplar-2': _paint(_lombardy, 7, (52, 136), 90, POPLAR_PAL, 2.8),
        'nature-cottonwood': _paint(_cottonwood, 3, (148, 144), 0, POPLAR_PAL, 3.8),
        'nature-cottonwood-2': _paint(_cottonwood, 8, (148, 144), 130, POPLAR_PAL, 3.8),
        'nature-chestnut': _paint(_chestnut, 4, (124, 120), 0, CHESTNUT_PAL, 3.4, fruit=(["H", "M", "M", "D"], CATKIN[1], 10, 4)),
        'nature-chestnut-2': _paint(_chestnut, 9, (124, 120), 140, CHESTNUT_PAL, 3.4),
        'nature-sal': _paint(_sal, 2, (96, 152), 0, SAL_PAL, 3.2),
        'nature-sal-2': _paint(_sal, 6, (96, 152), 120, SAL_PAL, 3.2),
        'nature-neem': _paint(_neem, 3, (108, 104), 0, NEEM_PAL, 2.6, .45),
        'nature-neem-2': _paint(_neem, 7, (108, 104), 150, NEEM_PAL, 2.6, .45),
        'nature-breadfruit': _paint(_breadfruit, 5, (104, 116), 0, BREADFRUIT_PAL, 4.2, .5, fruit=(BREADFRUIT[0], BREADFRUIT[1], 6, 2)),
        'nature-breadfruit-2': _paint(_breadfruit, 8, (104, 116), 140, BREADFRUIT_PAL, 4.2, .5, fruit=(BREADFRUIT[0], BREADFRUIT[1], 5, 2)),
        'nature-shea': _paint(_shea, 2, (100, 96), 0, SHEA_PAL, 3.2),
        'nature-shea-2': _paint(_shea, 5, (100, 96), 120, SHEA_PAL, 3.2),
        'nature-stone-pine': _paint(_stone_pine, 3, (124, 128), 0, STONE_PINE_PAL, 2.8, .25),
        'nature-stone-pine-2': _paint(_stone_pine, 6, (124, 128), 110, STONE_PINE_PAL, 2.8, .25),
        'nature-ahuehuete': _paint(_ahuehuete, 2, (152, 144), 0, AHUEHUETE_PAL, 2.6, .3),
        'nature-ahuehuete-2': _paint(_ahuehuete, 5, (152, 144), 130, AHUEHUETE_PAL, 2.6, .3),
    }


def world_trees():
    return {name: _pad(im) for name, im in {**leafy_trees(), **drawn_trees()}.items()}
