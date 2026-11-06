"""The dryland, Andean and southern trees the regional mixes were missing:
mesquite, ombu, tamarisk and queñua painted over a voxel bake like the other
leafy trees; cardón, tree nopal, Joshua tree and protea drawn in the
succulent style; monkey puzzle and tree fern drawn directly; and the
regional grasses the flora names (spinifex, pampas grass, ichu, feather grass)."""
import math
import random
import numpy as np
from PIL import Image

from art.voxel_trees import roots
from art.tropical_trees import Sprite, frond, _rachis, _line
from art.world_trees import _paint, _masses, _pad
from art.succulents import _new, _put, _opaque, _stem, _pad as _cactus_pad, _flower, _leaf, CREAM
from art.shrubs import ramp


# --- Painted ------------------------------------------------------------------

MESQUITE_PAL = ['#1a2410', '#2a3a18', '#3e5422', '#56702c', '#728c38', '#98aa52', '#cad48a',
                '#1a1410', '#2e241c', '#463628', '#5e4a36', '#7a6246']


def _mesquite(t, rng):
    """Mesquite (and algarrobo): two or three crooked dark stems leaning out
    from the foot, a wide, low, airy crown of feathery leaves with sky
    through it."""
    for i in range(3):
        a = i * 2.1 + rng.uniform(-.3, .3)
        mid, _ = t.limb((0, 0, 0), (math.cos(a) * .55, math.sin(a) * .55, 1), 16, 3.2, 2.2, wobble=.18)
        for j in range(2):
            b = a + (j - .5) * 1.1 + rng.uniform(-.2, .2)
            tip, _ = t.limb(mid, (math.cos(b), math.sin(b), .45), 20, 2, .8, wobble=.2)
            _masses(t, rng, tip, 3, 7, 6.5, .55, 1)
    _masses(t, rng, (0, 0, 26), 3, 6, 6, .55)


OMBU_PAL = ['#08180c', '#103016', '#1a4a1e', '#286626', '#3c842e', '#62a43c', '#a6cc6a',
            '#2a2420', '#423830', '#5c4e42', '#786858', '#948470']


def _ombu(t, rng):
    """Ombú: the lone giant of the pampas, a soft wooden bole swollen into a
    great buttressed foot, short heavy limbs and a dark, dense, domed crown."""
    for k in range(6):
        a = k * 2 * math.pi / 6 + rng.uniform(-.3, .3)
        t.caps.append(((0, 0, 14), (math.cos(a) * 15, math.sin(a) * 15, 0), 8, 5))
    fork, _ = t.limb((0, 0, 0), (0, 0, 1), 26, 14, 9, wobble=.02)
    for i in range(5):
        a = i * 2 * math.pi / 5 + rng.uniform(-.3, .3)
        tip, _ = t.limb(fork, (math.cos(a), math.sin(a), .55), 22, 6, 3, wobble=.08)
        _masses(t, rng, tip, 3, 8, 12, .7, 4)
    _masses(t, rng, fork + (0, 0, 22), 4, 12, 13, .75)


TAMARISK_PAL = ['#263428', '#344836', '#465e46', '#5e7858', '#7a9470', '#9cb08c', '#ccd8b8',
                '#2a2018', '#46362a', '#62503c', '#806a50', '#9c8668']
TAMARISK_BLOOM = (["o", "D", "M", "H"], ['#8a4a5e', '#c07890', '#e0a4b4', '#f4d0d8'])


def _tamarisk(t, rng):
    """Tamarisk: many slender stems from one foot, arching out, carrying
    feathery plumes of scale leaves that hang at the tips."""
    for i in range(7):
        a = i * 2.39996 + rng.uniform(-.2, .2)
        mid, d = t.limb((0, 0, 0), (math.cos(a) * .55, math.sin(a) * .55, 1), 20, 2, 1.3, wobble=.12)
        tip, _ = t.limb(mid, (math.cos(a), math.sin(a), .35), 20, 1.3, .5, wobble=.15)
        for k in range(5):
            f = .45 + k * .14
            t.clumps.append((tuple(np.asarray(mid) * (1 - f) + np.asarray(tip) * f + (0, 0, 3 - k * 1.2)), rng.uniform(3.8, 4.8), 1.1))


POLYLEPIS_PAL = ['#0e1c14', '#16301c', '#204624', '#2e5e2c', '#467838', '#6a944a', '#a4bc76',
                 '#4a1a0c', '#7a2e14', '#a84a20', '#cc7038', '#e8a468']


def _polylepis(t, rng):
    """Queñua: the highest-growing trees in the world, a few twisted stems
    wrapped in peeling cinnamon bark, small dark crowns in tufts."""
    for i in range(3):
        a = i * 2.2 + rng.uniform(-.4, .4)
        mid, _ = t.limb((0, 0, 0), (math.cos(a) * .5, math.sin(a) * .5, 1), 18, 3.4, 2.4, wobble=.25)
        for j in range(2):
            b = a + (j - .5) * 1.4
            tip, _ = t.limb(mid, (math.cos(b) * .8, math.sin(b) * .8, .8), 14, 2, .9, wobble=.25)
            _masses(t, rng, tip, 2, 4, 6.5, .8, 2)
    _masses(t, rng, (0, 0, 30), 2, 4, 6.5, .85)


# --- Succulent style -------------------------------------------------------------

CARDON = ramp('#5c8c6a')


def cardon(seed, arms):
    """Cardón: the giant columnar cactus of Mexico, the Caribbean coasts and
    the Andean valleys, a short woody trunk lifting a crowd of ribbed
    columns, the outer ones curving out before turning up."""
    rng = random.Random(seed)
    im = _new(66, 108)
    bark = ramp('#7e6e52')
    cx = 33
    _stem(im, bark, (cx, 104), (cx, 82), 6.4, taper=.1)
    for y in range(84, 103, 3):
        _put(im, cx - 3 + y % 3, y, bark[1]); _put(im, cx + 2, y + 1, bark[2])
    cols = []
    for k in range(arms):
        u = (k + .5) / arms * 2 - 1 + rng.uniform(-.06, .06)
        top = 8 + abs(u) ** 1.3 * 30 + rng.uniform(-7, 7)
        x = cx + u * 27
        cols.append((abs(u), u, x, top, 84 - rng.uniform(0, 16) * abs(u)))
    ridges = []
    for _, u, x, top, by in sorted(cols, key=lambda c: -c[0]):
        base = (cx + u * 4, by)
        elbow = (x, by - 8 - abs(u) * 4)
        if abs(u) > .15:
            pts = [(base[0] + (elbow[0] - base[0]) * math.sin(s * math.pi / 2),
                    base[1] + (elbow[1] - base[1]) * (1 - math.cos(s * math.pi / 2))) for s in np.linspace(0, 1, 5)]
            for a, b in zip(pts, pts[1:]):
                _stem(im, CARDON, a, b, 3.6)
        ridges += _stem(im, CARDON, elbow if abs(u) > .15 else base, (x, top), 3.9 - abs(u) * .5, ribs=4)
    for x, y in ridges:
        if rng.random() < .22 and (x * 3 + y) % 4 == 0:
            _put(im, x, y, CREAM)
    for _, u, x, top, _ in cols:
        if rng.random() < .6:
            _flower(im, x, top + 1, ramp('#f2eedc'), '#d8b850')
    return im


NOPAL = ramp('#629a4e')


def tree_nopal(seed, flower):
    """The tree nopal of Mexican villages: a scaly woody trunk, and pads
    budding off pads into a rounded crown, ripe red tunas on the rims."""
    rng = random.Random(seed)
    im = _new(64, 72)
    bark = ramp('#8a7656')
    cx = 32
    _stem(im, bark, (cx, 69), (cx, 46), 4.2, taper=.15)
    _stem(im, bark, (cx, 52), (cx - 9, 40), 2.6)
    _stem(im, bark, (cx, 50), (cx + 10, 41), 2.6)
    for y in range(48, 68, 3):
        _put(im, cx - 2 + (y // 3) % 3, y, bark[1]); _put(im, cx + 1, y + 1, bark[4])
    pads, tips = [], []

    def grow(x, y, ang, size, depth):
        rx, ry = 4.6 * size, 7.2 * size
        cx_, cy_ = x + math.sin(ang) * ry * .8, y - math.cos(ang) * ry * .8
        pads.append((cy_, cx_, rx, ry, ang))
        if depth:
            for d in (-.55, .5) if depth > 1 or rng.random() < .7 else (rng.choice((-.5, .5)),):
                ex, ey = cx_ + math.sin(ang) * ry * .8, cy_ - math.cos(ang) * ry * .8
                grow(ex, ey, ang + d + rng.uniform(-.15, .15), size * .9, depth - 1)
        else:
            tips.append((cx_ + math.sin(ang) * ry, cy_ - math.cos(ang) * ry))

    grow(cx - 9, 41, -.45, 1, 2)
    grow(cx + 10, 42, .45, 1, 2)
    grow(cx, 45, 0, 1.05, 2)
    for cy_, cx_, rx, ry, ang in sorted(pads, key=lambda p: -p[0]):
        _cactus_pad(im, NOPAL, cx_, cy_, rx, ry, ang, rng, NOPAL[1], CREAM)
    fr = ramp('#c8303a')
    for x, y in tips:
        if flower and rng.random() < .5:
            _flower(im, x, y, ramp('#f0d040'), '#c86020', big=True)
        else:
            _put(im, x, y, fr[3]); _put(im, x + 1, y, fr[2]); _put(im, x, y + 1, fr[2]); _put(im, x + 1, y + 1, fr[1]); _put(im, x, y - 1, fr[5])
    return im


def joshua_tree(seed):
    """Joshua tree: a shaggy trunk thatched with dead leaves, forking at
    awkward angles into arms that end in bristling balls of stiff
    dagger leaves, a cream flower cluster on a few."""
    rng = random.Random(seed)
    im = _new(80, 92)
    bark = ramp('#7a6a54')
    leaf = ramp('#7a9a4a')
    tips = []

    def arm(x, y, ang, ln, w, depth):
        nx, ny = x + math.sin(ang) * ln, y - math.cos(ang) * ln
        _stem(im, bark, (x, y), (nx, ny), w)
        for k in range(int(ln)):
            px, py = x + (nx - x) * k / ln, y + (ny - y) * k / ln
            if (k + depth) % 2 == 0:
                _put(im, px + rng.uniform(-w, w) * .6, py, bark[1] if rng.random() < .6 else bark[4])
        if depth:
            spread = rng.uniform(.5, .8)
            arm(nx, ny, ang - spread + rng.uniform(-.1, .1), ln * rng.uniform(.65, .85), w * .78, depth - 1)
            if rng.random() < .8:
                arm(nx, ny, ang + spread + rng.uniform(-.1, .1), ln * rng.uniform(.65, .85), w * .78, depth - 1)
        else:
            tips.append((nx, ny))

    _stem(im, bark, (40, 89), (40, 58), 4.4, taper=.1)
    arm(40, 60, -.35 + rng.uniform(-.1, .1), 16, 3.2, 2)
    arm(40, 60, .4 + rng.uniform(-.1, .1), 14, 3.0, 2)
    for x, y in sorted(tips, key=lambda p: p[1]):
        for k in range(16):
            a = k / 16 * 2 * math.pi + rng.uniform(-.1, .1)
            up = math.sin(a)
            ln = 7 if up < .3 else 5.4
            _leaf(im, leaf, (x, y), (x + math.cos(a) * ln, y - up * ln * .9 - 1), 1.3)
        _put(im, x, y - 1, leaf[6]); _put(im, x - 1, y, leaf[5])
    for x, y in rng.sample(tips, min(2, len(tips))):
        for dx, dy in ((0, -6), (-1, -5), (1, -5), (0, -5), (0, -4)):
            _put(im, x + dx, y + dy, '#efe6c4' if dy < -4 else '#c8bc8a')
    return im


def protea(seed):
    """King protea and sugarbush: a woody fynbos shrub with leathery
    grey-green leaves and big cup-shaped pink flower heads."""
    rng = random.Random(seed)
    im = _new(46, 42)
    bark = ramp('#6a4e3a')
    leaf = ramp('#6e9070')
    pink = ramp('#d06a7e')
    heads = []
    for k in range(5):
        a = -1.1 + k * .55 + rng.uniform(-.1, .1)
        x, y = 23 + math.sin(a) * 15, 36 - math.cos(a) * 18
        _stem(im, bark, (23, 40), (x, y), 1.2)
        for j in range(5):
            s = .35 + j * .13
            px, py = 23 + (x - 23) * s, 40 + (y - 40) * s
            side = 1 if j % 2 else -1
            _leaf(im, leaf, (px, py), (px + side * 4 + math.sin(a) * 2, py - 3), 1.4)
        heads.append((x, y))
    for x, y in sorted(heads, key=lambda p: p[1]):
        for dy in range(-4, 3):
            hw = 3.6 - abs(dy + 1) * .45
            for dx in np.arange(-hw, hw + .1, .5):
                tone = 4 if dx < 0 else 3
                if abs(dx) > hw - .8:
                    tone = 1
                if dy < -2 and abs(dx) < hw - 1:
                    tone = 5
                _put(im, x + dx, y + dy, pink[tone])
        for dx in (-1, 0, 1):
            _put(im, x + dx, y - 3, '#efe2c8')
        _put(im, x, y - 4, '#f8f0dc')
    return im


# --- Drawn ---------------------------------------------------------------------

ARAUCARIA_PAL = ['#0a1a10', '#122a18', '#1c3e20', '#28542a', '#386c34', '#4e8640', '#74a45a', '#a8c884',
                 '#2a2622', '#46403a', '#665e54', '#8a8072']


def araucaria(seed, candelabra=False):
    """Monkey puzzle and Paraná pine: a tall clean grey trunk and whorls of
    rope-thick branches clad all round in overlapping scale leaves, level
    then turning up at the tips; the monkey puzzle domed, the Paraná pine a
    flat-topped candelabra on top of a bare stem."""
    W, H = 104, 156
    sp = Sprite((W, H), ARAUCARIA_PAL)
    rng = np.random.default_rng(seed)
    cx, top = W / 2, 10
    for y in range(top, H - 2):
        f = (y - top) / (H - top)
        w = 1.4 + 2.6 * f + 2 * max(0, f - .94) / .06
        for x in range(int(cx - w), int(cx + w) + 1):
            u = (x - cx) / max(w, 1)
            k = 8 + (2 if u < -.3 else 1 if u < .4 else 0)
            if (y + int(u * 2)) % 6 == 0:
                k = 8
            sp.put(x, y, k)
    if candelabra:
        whorls = [(top + 14 + i * 7, 18 + i * 9) for i in range(5)]
    else:
        whorls = [(top + 6 + i * 8, 8 + 34 * math.sin(min(1, (i + 1) / 6) * math.pi / 2) - max(0, i - 5) * 3) for i in range(8)]
    ramp_ = list(range(8))
    for i, (wy, reach) in enumerate(reversed(whorls)):
        branches = []
        for j in range(6):
            yaw = j * 2 * math.pi / 6 + i * .5 + rng.uniform(-.15, .15)
            depth = math.sin(yaw)
            r = reach * rng.uniform(.85, 1.05)
            pts = []
            for s in np.linspace(0, 1, int(r * 1.4) + 2):
                h = r * s
                lift = (r * .35 if candelabra else 6) * max(0, s - .55) ** 2 / .2
                droop = -(2.5 + h * .12) * math.sin(s * math.pi) if not candelabra else 0
                pts.append((cx + h * math.cos(yaw), wy - lift - droop - h * depth * .45))
            branches.append((depth, pts))
        branches.sort(key=lambda b: -b[0])
        for depth, pts in branches:
            tf = int(np.clip(round(4.4 - depth * 1.2), 2, 6))
            n = len(pts)
            for k, (x, y) in enumerate(pts):
                tw = 2.1 if k > 2 else 1.4
                for d in np.arange(-tw, tw + .1, .5):
                    edge = abs(d) > tw - .6
                    t = tf - 2 if edge else tf - (d > 0) + ((k + int(d * 2)) % 3 == 0)
                    sp.put(x, y + d, ramp_[int(np.clip(t, 0, 7))])
            ex, ey = pts[-1]
            sp.put(ex, ey - 1, ramp_[min(7, tf + 2)])
    if not candelabra:
        for y in range(top - 3, top + 3):
            sp.put(cx, y, 5 if y > top - 1 else 6)
    return sp.image({**{k: 0 for k in range(8)}, **{k: 8 for k in range(8, 12)}})


FERN_PAL = ['#0a2010', '#123418', '#1c4c20', '#286a26', '#3a8a2e', '#58a838', '#88c656', '#c4e48c',
            '#1c140e', '#2e2218', '#463424', '#5e4a32',
            '#4a3a22', '#6e5630', '#94784a']


def tree_fern(seed, H=112):
    """Tree fern (ponga, mamaku, hāpu'u): a slim trunk shaggy with old frond
    bases, a skirt of dead brown fronds, and a crown of long, finely cut
    arching fronds with fiddleheads uncurling at the centre."""
    W = 104
    sp = Sprite((W, H), FERN_PAL)
    rng = np.random.default_rng(seed)
    cx = W / 2 + rng.uniform(-2, 2)
    top = (cx, 30)
    lean = rng.uniform(-.06, .06)
    for y in range(int(top[1]), H - 2):
        x0 = cx + (y - top[1]) * lean
        w = 2.6 + (y > H - 10) * 1
        for x in range(int(x0 - w), int(x0 + w) + 1):
            u = (x - x0) / w
            k = 8 + (u > -.3) + (u > .4) * 0 + ((x * 2 + y * 3) % 5 == 0)
            if (y + int(u * 3)) % 4 == 0:
                k = 8
            sp.put(x, y, min(11, k))
    dead = [12, 13, 14]
    for j in range(7):
        yaw = j * 2 * math.pi / 7 + rng.uniform(-.2, .2)
        pts = _rachis((top[0], top[1] + 4), yaw, -1.15, rng.uniform(14, 20), .2)
        for k, (x, y) in enumerate(pts):
            sp.put(x, y, dead[1])
            if k % 2 == 0 and k > 2:
                for s in (-1, 1):
                    sp.put(x + s, y + 1, dead[(k // 2) % 3])
                    sp.put(x + s * 2, y + 2, dead[0])
    fronds = []
    for j in range(11):
        yaw = j * 2.39996 + rng.uniform(-.1, .1)
        off = (yaw + math.pi / 2 + math.pi) % (2 * math.pi) - math.pi
        if abs(off) < .45:
            yaw += math.copysign(.45, off) - off
        age = (j % 3) / 2
        depth = math.sin(yaw)
        tf = int(np.clip(round(4.6 - depth * 1.1 - math.cos(yaw) * .4 - age * .4), 2, 6))
        fronds.append((depth, _rachis(top, yaw, .95 - age * .7, rng.uniform(30, 38), .55 + age * .55), tf))
    fronds.sort(key=lambda f: -f[0])
    for k, (depth, pts, tf) in enumerate(fronds):
        frond(sp, pts, tf, list(range(8)), 6.5, seed * 31 + k, comb=2, upper=.6, hang=.35)
    for a in (-.5, .6):
        x0, y0 = top[0] + a * 4, top[1] - 4
        for t in np.linspace(0, 4.5, 14):
            r = 2.6 * (1 - t / 6)
            sp.put(x0 + math.cos(t + a) * r, y0 - math.sin(t + a) * r - t * .6, 6)
    return sp.image({**{k: 0 for k in range(8)}, **{k: 8 for k in range(8, 12)}, **{k: 12 for k in (12, 13, 14)}})


# --- Grasses ----------------------------------------------------------------

def _hexa(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def _blade(px, depth, x0, y0, ang, length, bend, ci, rng, width=1):
    """A blade from its foot along a bending arc; each pixel keeps the nearest
    (front-most) blade's shade."""
    steps = int(length * 2)
    x, y = x0, y0
    for k in range(steps + 1):
        t = k / steps
        a = ang + bend * t * t
        x += math.cos(a) * .5
        y -= math.sin(a) * .5
        c = ci(t)
        for w in range(width):
            ix, iy = int(round(x)) + w, int(round(y))
            if 0 <= iy < px.shape[0] and 0 <= ix < px.shape[1] and depth >= px[iy, ix, 1]:
                px[iy, ix] = (c, depth)
    return x, y


def _finish(px, pal, outline, loose=None, front=False):
    h, w = px.shape[:2]
    im = Image.new('RGBA', (w + 2, h + 2))
    on = px[:, :, 0] >= 0
    for y in range(h):
        for x in range(w):
            if on[y, x]:
                im.putpixel((x + 1, y + 1), _hexa(pal[px[y, x, 0]]))
    if outline:
        o = _hexa(outline)
        a = np.array(im)[:, :, 3] > 0
        for y in range(h + 2):
            for x in range(w + 2):
                if a[y, x]:
                    continue
                if any(0 <= y + dy < h + 2 and 0 <= x + dx < w + 2 and a[y + dy, x + dx]
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    # Blade tips against the sky stay unoutlined.
                    if (y + 1 < h + 2 and a[y + 1, x]) or y >= (h + 2) * .45:
                        im.putpixel((x, y), o)
    if loose is not None:
        for y in range(h):
            for x in range(w):
                if loose[y, x, 0] < 0:
                    continue
                cur = im.getpixel((x + 1, y + 1))
                if front or cur[3] == 0 or (outline and cur == _hexa(outline)):
                    im.putpixel((x + 1, y + 1), _hexa(pal[loose[y, x, 0]]))
    return im


def _canvas(w, h):
    return np.full((h, w, 2), -1, dtype=np.int32)


SPINIFEX = ['#3e4a2a', '#56653a', '#728246', '#909c56', '#b4b46c', '#d6c88a', '#a88a4a', '#7a6034']


def spinifex(seed, ring=False):
    """Spinifex: a low, stiff, grey-green hummock of needle leaves bristling
    out in every direction, straw-tipped; old clumps die in the middle and
    grow on as a ring."""
    rng = random.Random(seed)
    W, H = 38, 22
    px = _canvas(W, H)
    cx, base = W / 2, H - 2
    blades = []
    for i in range(170):
        u = rng.uniform(-1, 1)
        if ring and abs(u) < .32 and rng.random() < .8:
            continue
        fx = cx + u * 11 + rng.uniform(-1, 1)
        ang = math.pi / 2 - u * 1.25 + rng.uniform(-.35, .35)
        length = (11 - abs(u) * 5) * rng.uniform(.65, 1.15)
        front = rng.random()
        blades.append((front, fx, ang, length))
    blades.sort()
    for front, fx, ang, length in blades:
        d = int(front * 100)
        shade = 1 + int(front * 3.2)
        tip = 5 if rng.random() < .55 else 6
        _blade(px, d, fx, base, ang, length, rng.uniform(-.1, .1),
               lambda t, s=shade, tp=tip: 0 if t < .12 else (tp if t > .82 else min(4, s + int(t * 1.6))), rng)
    if ring:
        for x in range(int(cx - 4), int(cx + 5)):
            if px[base, x, 0] < 0 or rng.random() < .5:
                px[base, x] = (7 if rng.random() < .5 else 6, 0)
    return _finish(px, SPINIFEX, '#2a2c1a')


PAMPAS = ['#2c3a22', '#40522c', '#566c36', '#728a44', '#94a85a', '#b8c27c',
          '#a89a7a', '#d2c6a6', '#ece2c6', '#fbf6e6', '#8a7a5a']


def pampas(seed):
    """Pampas grass: a big fountain of long, arching, grey-green leaves, and
    above it tall straight stems carrying silvery-cream feather plumes."""
    rng = random.Random(seed)
    W, H = 48, 64
    px, loose = _canvas(W, H), _canvas(W, H)
    cx, base = W / 2, H - 2
    leaves = []
    for i in range(34):
        side = rng.choice((-1, 1))
        u = rng.random()
        ang = math.pi / 2 - side * (.04 + u * .4)
        leaves.append((rng.random(), cx + side * u * 3, ang, rng.uniform(20, 32), -side * rng.uniform(1.1, 2.0)))
    leaves.sort()
    n = rng.randint(6, 8)
    stems = []
    for i in range(n):
        u = (i + .5) / n * 2 - 1 + rng.uniform(-.08, .08)
        top = base - rng.uniform(42, 56) * (1 - abs(u) * .2)
        stems.append((cx + u * 2, cx + u * 15, top))
    for x0, x1, top in stems:
        L = base - top
        for k in range(int(L) - 2):
            t = k / L
            loose[int(base - k), int(round(x0 + (x1 - x0) * t))] = (6 if t < .7 else 7, 20)
    for front, fx, ang, length, bend in leaves:
        s = 1 + int(front * 4)
        _blade(px, 30 + int(front * 70), fx, base, ang, length, bend,
               lambda t, s=s, lit=rng.random() < .3: 0 if t < .1 else min(5, s + (1 if lit and .3 < t < .75 else 0)), rng)
    for x0, x1, top in stems:
        plen = rng.uniform(11, 14)
        lean = 1 if x1 > cx else -1
        for k in range(int(plen)):
            t = k / plen
            wdt = math.sin(math.pi * min(1, .15 + t * 1.05)) * 1.9 + .3
            yy = int(top + k)
            nod = (1 - t) ** 2.5 * 2.5 * lean
            for dx in range(-3, 4):
                if abs(dx) > wdt + rng.uniform(-.4, .4):
                    continue
                xx = int(round(x1 + nod + dx))
                if 0 <= xx < W and 0 <= yy < H:
                    c = 9 if dx < 0 else (8 if dx == 0 else 7)
                    if rng.random() < .1:
                        c = 6
                    loose[yy, xx] = (c, 110)
    return _finish(px, PAMPAS, '#232c1a', loose)


ICHU = ['#4a3c1c', '#6e5a28', '#927634', '#b49444', '#d0b25a', '#e6cc7e', '#f2e2a6', '#6a6a34']


def ichu(seed):
    """Ichu: the puna's bunchgrass, a dense round tussock of fine, stiff,
    straw-gold leaves standing up and fanning out, greener at the heart."""
    rng = random.Random(seed)
    W, H = 32, 30
    px = _canvas(W, H)
    cx, base = W / 2, H - 2
    blades = []
    for i in range(150):
        u = rng.gauss(0, .45)
        u = max(-1, min(1, u))
        fx = cx + u * 6
        ang = math.pi / 2 - u * 1.05 + rng.uniform(-.2, .2)
        blades.append((rng.random(), fx, ang, (24 - abs(u) * 10) * rng.uniform(.7, 1.05), -u * rng.uniform(.2, .6)))
    blades.sort()
    for front, fx, ang, length, bend in blades:
        s = 1 + int(front * 3.5)
        heart = rng.random() < .12
        _blade(px, int(front * 100), fx, base, ang, length, bend,
               lambda t, s=s, h=heart: 0 if t < .08 else (7 if h and t < .5 else min(6, s + int(t * 2.2))), rng)
    return _finish(px, ICHU, '#33281a')


FEATHER = ['#36402a', '#4c5a36', '#667444', '#86905a', '#a8ae7a', '#d4d4b4', '#eceadc', '#fbfaf2']


def feather_grass(seed):
    """Feather grass: a narrow grey-green tuft from which long silky awns
    arch out and over like silver hair, pale against the steppe."""
    rng = random.Random(seed)
    W, H = 40, 28
    px, loose = _canvas(W, H), _canvas(W, H)
    cx, base = W / 2, H - 2
    for i in range(60):
        u = rng.gauss(0, .4)
        front = rng.random()
        _blade(px, int(front * 60), cx + u * 3, base, math.pi / 2 - u * .9 + rng.uniform(-.2, .2),
               rng.uniform(8, 13), -u * .5, lambda t, s=1 + int(front * 3): 0 if t < .1 else min(4, s + int(t * 1.5)), rng)
    for i in range(20):
        side = rng.choice((-1, 1))
        front = rng.random()
        x0 = cx + side * rng.uniform(0, 1.5)
        ang = math.pi / 2 - side * rng.uniform(0, .6)
        x, y = _blade(loose, 60, x0, base - rng.uniform(6, 9), ang, rng.uniform(3, 6), 0, lambda t: 3, rng)
        _blade(loose, 61 + int(front * 39), x, y, ang, rng.uniform(8, 20), -side * rng.uniform(1.2, 3.6),
               lambda t, c=7 if front > .5 else 6: c if t < .8 else 5, rng)
    return _finish(px, FEATHER, '#283020', loose, front=True)


def world_plants():
    return {name: _pad(im) for name, im in {
        'nature-mesquite': _paint(_mesquite, 3, (112, 92), 0, MESQUITE_PAL, 2.6, .3),
        'nature-mesquite-2': _paint(_mesquite, 8, (112, 92), 120, MESQUITE_PAL, 2.6, .3),
        'nature-ombu': _paint(_ombu, 2, (156, 132), 0, OMBU_PAL, 4, .4),
        'nature-ombu-2': _paint(_ombu, 6, (156, 132), 140, OMBU_PAL, 4, .4),
        'nature-tamarisk': _paint(_tamarisk, 4, (88, 88), 0, TAMARISK_PAL, 2.4, .2),
        'nature-tamarisk-2': _paint(_tamarisk, 9, (88, 88), 120, TAMARISK_PAL, 2.4, .2, fruit=(["oM", "MH", "oM"], TAMARISK_BLOOM[1], 24, 2)),
        'nature-polylepis': _paint(_polylepis, 3, (80, 80), 0, POLYLEPIS_PAL, 2.6, .25),
        'nature-polylepis-2': _paint(_polylepis, 7, (80, 80), 120, POLYLEPIS_PAL, 2.6, .25),
        'nature-columnar-cactus': cardon(3, 7),
        'nature-columnar-cactus-2': cardon(8, 5),
        'nature-prickly-pear': tree_nopal(2, False),
        'nature-prickly-pear-2': tree_nopal(5, True),
        'nature-joshua-tree': joshua_tree(3),
        'nature-joshua-tree-2': joshua_tree(11),
        'nature-araucaria': araucaria(3),
        'nature-araucaria-2': araucaria(5, candelabra=True),
        'nature-tree-fern': tree_fern(3),
        'nature-tree-fern-2': tree_fern(8, 104),
        'nature-protea': protea(2),
        'nature-protea-2': protea(7),
        'nature-shrub-spinifex': spinifex(3),
        'nature-shrub-spinifex-2': spinifex(8, ring=True),
        'nature-shrub-pampas-grass': pampas(2),
        'nature-shrub-pampas-grass-2': pampas(7),
        'nature-shrub-ichu': ichu(3),
        'nature-shrub-ichu-2': ichu(9),
        'nature-shrub-feather-grass': feather_grass(2),
        'nature-shrub-feather-grass-2': feather_grass(6),
    }.items()}
