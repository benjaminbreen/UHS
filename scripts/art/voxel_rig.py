"""Animals as posed voxel puppets, rendered in eight headings.

    .venv/bin/python scripts/art/voxel_rig.py artifacts/horse/sheet.png

A body is a signed distance field: ellipsoids for barrel, chest and croup,
tapered capsules for neck, head and legs, joined with a smooth union so the
seams read as muscle. A gait is the phase of each foot in the cycle and the
share of it spent on the ground; the foot plants and slides back through the
stance, lifts and swings forward, and each leg is solved to reach it. The
posed body is voxelised turned to each heading and cast by voxel.render with
the buildings' sun, so every direction is lit the same way.

Sizes are pixels at the props' scale, 17 to the metre: a horse of 15 hands
stands 25px at the withers and 40px nose to tail.
"""
from pathlib import Path
import math
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.voxel import Grid, render, ramp_from  # noqa: E402
from art.city_kit import outline, rgba  # noqa: E402


# Grown to the figure the game now draws, about 22px to the metre.
SCALE = 1.3


# ------------------------------------------------------------------ fields

def ellipsoid(p, c, r):
    q = (p - c) / r
    k = np.linalg.norm(q, axis=-1)
    return (k - 1) * np.min(r)


def capsule(p, a, b, ra, rb):
    """A cone-capsule from a (radius ra) to b (radius rb)."""
    pa, ba = p - a, b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[..., None] * ba, axis=-1) - (ra + (rb - ra) * h)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


# ------------------------------------------------------------------ gaits

# Foot phases in the cycle and the share of it on the ground. Left hind is
# the reference; a walk sets each foot down a quarter apart, lateral pairs
# leading; a trot moves diagonal pairs together.
GAITS = {
    'walk': dict(phase={'LH': 0.0, 'LF': 0.25, 'RH': 0.5, 'RF': 0.75}, duty=0.62, stride=11, lift=3.2, bob=0.6),
    'trot': dict(phase={'LH': 0.0, 'RF': 0.0, 'RH': 0.5, 'LF': 0.5}, duty=0.42, stride=15, lift=5.0, bob=1.2),
    # A transverse gallop, right lead: hind pair, then fore pair, then all
    # four off the ground.
    'gallop': dict(phase={'LH': 0.0, 'RH': 0.12, 'LF': 0.36, 'RF': 0.48}, duty=0.3, stride=22, lift=6.5, bob=1.6),
    'idle': dict(phase={'LH': 0.0, 'LF': 0.0, 'RH': 0.0, 'RF': 0.0}, duty=1.0, stride=0, lift=0, bob=0),
}


def foot(gait, leg, t):
    """Where a foot is, fore and aft of its hip, and how high: planted and
    sliding back through the stance, lifted and swung forward through the
    rest of the cycle."""
    g = GAITS[gait]
    ph = (t - g['phase'][leg]) % 1
    s, d = g['stride'], g['duty']
    if ph < d:
        return s / 2 - s * ph / d, 0.0
    q = (ph - d) / (1 - d)
    # Eased forward swing, the foot lifted highest early, as a horse picks
    # its foot up and then reaches.
    u = -s / 2 + s * (0.5 - 0.5 * math.cos(math.pi * q))
    return u, g['lift'] * math.sin(math.pi * q) ** 0.8 * (1.2 - 0.4 * q)


def two_bone(hip, target, l1, l2, bend):
    """Knee position for a leg from `hip` reaching `target` in the (u, w)
    plane; `bend` +1 folds the joint forward, -1 back."""
    du, dw = target[0] - hip[0], target[1] - hip[1]
    d = min(math.hypot(du, dw), l1 + l2 - 1e-3)
    a = math.atan2(dw, du)
    cosk = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
    k = math.acos(max(-1, min(1, cosk)))
    ang = a + bend * k
    return hip[0] + l1 * math.cos(ang), hip[1] + l1 * math.sin(ang)


# ------------------------------------------------------------------ horse

HORSE = dict(
    withers=25, length=40,
    coat='#6a3f24', points='#1d1615', mane='#1a1414', hoof='#2c2622', blaze=None,
)
# Coats as hand-set ramps, shadow to highlight: a bay's body warm red-brown
# with violet in the shade, its points and mane near black.
COATS = {
    'bay': dict(coat=['#1f1219', '#34191b', '#4c231f', '#652f22', '#7e3f27', '#975531', '#b07044'],
                points=['#0f0b10', '#19131a', '#241c22', '#302629', '#40343a', '#56484c'],
                mane=['#0f0b10', '#19131a', '#241c22', '#302629', '#40343a', '#56484c']),
    'chestnut': dict(coat=['#2a1418', '#46201c', '#65301f', '#843f22', '#a0532b', '#b86c3a', '#cf8a52'],
                     points=['#2a1418', '#46201c', '#65301f', '#843f22', '#a0532b', '#b86c3a'],
                     mane=['#3a1a14', '#5a2a1a', '#7c3c20', '#9c5228', '#b86c36', '#d08a4c']),
    'grey': dict(coat=['#3a3844', '#57555e', '#76747a', '#95928f', '#b2aea6', '#ccc7bd', '#e2ddd2'],
                 points=['#26242c', '#3a3842', '#504e56', '#68656b', '#827e80', '#9c9896'],
                 mane=['#57555e', '#76747a', '#95928f', '#b2aea6', '#ccc7bd', '#e2ddd2']),
    'black': dict(coat=['#0c0a10', '#141119', '#1d1820', '#272128', '#332b31', '#433a3e', '#5a4f50'],
                  points=['#0c0a10', '#141119', '#1d1820', '#272128', '#332b31', '#433a3e'],
                  mane=['#0c0a10', '#141119', '#1d1820', '#272128', '#332b31', '#433a3e']),
    'dun': dict(coat=['#2e2320', '#4a3628', '#6a4e34', '#8a6840', '#a6824e', '#bf9c62', '#d6b67c'],
                points=['#141012', '#221a1a', '#302622', '#40342c', '#544536', '#6a5842'],
                mane=['#141012', '#221a1a', '#302622', '#40342c', '#544536', '#6a5842']),
}
HOOF = ['#141014', '#221c20', '#322a2c', '#453b3a', '#5a4f4a']
MUZZLE = ['#140e12', '#221820', '#32242a', '#443238', '#584248']
# Unit normals the grid's table holds: a Fibonacci sphere of 240.
_N = 240
_i = np.arange(_N) + 0.5
_phi = np.arccos(1 - 2 * _i / _N)
_th = math.pi * (1 + 5 ** 0.5) * _i
DIRS = np.stack([np.cos(_th) * np.sin(_phi), np.sin(_th) * np.sin(_phi), np.cos(_phi)], 1)

PARTS = ['coat', 'points', 'mane', 'hoof', 'muzzle', 'white']
WHITE = ['#6a6470', '#8c8690', '#aea8ac', '#cdc8c4', '#e6e1d8', '#f6f2ea']


def horse_field(P, gait, t, coat='bay', marks=()):
    """Distance to the horse and which part is nearest, over points P (N x 3)
    in the horse's own frame: u forward, v to its left, w up."""
    P = P / SCALE
    g = GAITS[gait]
    bob, nod = motion(gait, t)
    B = np.array([0, 0, bob])
    parts = []
    body = ellipsoid(P, np.array([0, 0, 18.5]) + B, np.array([10.5, 5.8, 5.8]))
    body = smin(body, ellipsoid(P, np.array([8.5, 0, 18.8]) + B, np.array([5.2, 5.2, 6.4])), 2.5)
    body = smin(body, ellipsoid(P, np.array([-8.5, 0, 19.6]) + B, np.array([6.0, 5.9, 6.4])), 2.5)
    # Withers rise over the shoulder into the neck.
    neck_a = np.array([10.5, 0, 22.5]) + B
    neck_b = np.array([15.5, 0, 31.0 + nod]) + B
    body = smin(body, capsule(P, neck_a, neck_b, 4.2, 2.6), 2.0)
    poll = np.array([16.5, 0, 33.0 + nod]) + B
    muzzle = np.array([21.0, 0, 25.5 + nod * 1.3]) + B
    head = capsule(P, poll, muzzle, 3.0, 2.2)
    head = smin(head, ellipsoid(P, poll + np.array([0.8, 0, -2.4]), np.array([2.6, 2.1, 2.4])), 1.2)
    body = smin(body, head, 1.2)
    parts.append(('coat', body))
    parts.append(('muzzle', capsule(P, muzzle + np.array([-1.2, 0, 0.6]), muzzle, 2.0, 2.05)))
    if 'blaze' in marks:
        # A white stripe down the face, a hair proud of it so it wins.
        face = (muzzle - poll) / np.linalg.norm(muzzle - poll)
        out = np.array([face[2], 0, -face[0]]) * -1
        parts.append(('white', capsule(P, poll + face * 1.5 + out * 2.3, muzzle - face * 1.4 + out * 1.9, 0.9, 0.8)))
    for s in (-1, 1):
        ear = capsule(P, poll + np.array([-0.4, s * 1.1, 0.8]), poll + np.array([-0.6, s * 1.5, 3.2]), 0.8, 0.35)
        parts.append(('coat', ear))
    # Mane along the crest of the neck, forelock between the ears.
    crest = capsule(P, neck_a + np.array([-1.5, 0, 4.2]), neck_b + np.array([-0.8, 0, 2.2]), 1.3, 1.0)
    parts.append(('mane', crest))
    # Tail: set on high, falling and swinging with the stride.
    sway = math.sin(2 * math.pi * t) * (2.2 if gait == 'idle' else 1.2)
    dock = np.array([-13.5, 0, 22.5]) + B
    tip = np.array([-16.0, sway, 9.5]) + B
    parts.append(('mane', capsule(P, dock, dock + np.array([-2.2, sway * 0.4, -5]), 1.3, 1.9)))
    parts.append(('mane', capsule(P, dock + np.array([-2.2, sway * 0.4, -5]), tip, 1.9, 1.3)))
    # Legs: hip or shoulder, the joint solved to reach the foot, the cannon
    # to the fetlock, the pastern and hoof.
    for leg, (hu, hw, bend, l1, l2) in {
        'LF': (8.5, 14.5, -1, 6.5, 6.8), 'RF': (8.5, 14.5, -1, 6.5, 6.8),
        'LH': (-9.0, 16.0, 1, 7.8, 7.4), 'RH': (-9.0, 16.0, 1, 7.8, 7.4),
    }.items():
        v = 3.2 if leg[0] == 'L' else -3.2
        fu, fh = foot(gait, leg, t)
        hip = (hu, hw + bob)
        fet = (hu + fu + (1.2 if leg[1] == 'F' else 0.6), fh + 2.6)
        # A foreleg folds at the knee under the forearm; a hind leg's hock
        # points back.
        knee = two_bone(hip, fet, l1, l2, 1 if leg[1] == 'F' else -1)
        H = np.array([hip[0], v, hip[1]])
        K = np.array([knee[0], v, knee[1]])
        F = np.array([fet[0], v, fet[1]])
        toe = np.array([fet[0] + 1.1, v, fh + 0.7])
        upper = capsule(P, H + np.array([0, 0, 2.5]), K, 2.6 if leg[1] == 'F' else 3.2, 1.35)
        parts.append(('coat', upper))
        low = 'white' if leg in marks else 'points'
        parts.append(('points', capsule(P, K, F, 1.5, 1.15)))
        if low == 'white':
            parts.append(('white', capsule(P, F + np.array([0, 0, 2.2]), F, 1.35, 1.25)))
        parts.append((low, capsule(P, F, toe, 1.1, 1.1)))
        parts.append(('hoof', capsule(P, toe + np.array([0, 0, -0.2]), toe + np.array([0.2, 0, -0.9]), 1.25, 1.35)))
    names = [n for n, _ in parts]
    D = np.stack([d for _, d in parts], 0)
    near = np.argmin(D, 0)
    # The coat's own smooth join is already in 'coat'; the rest meet it hard.
    return D.min(0) * SCALE, np.array([PARTS.index(n) for n in names])[near]


def motion(gait, t):
    """The body's drop at each footfall and the head's nod: two beats to a
    stride at the walk and trot, one heave at the gallop, a slow breath and
    toss of the head standing."""
    g = GAITS[gait]
    if gait == 'gallop':
        return -g['bob'] * (0.5 + 0.5 * math.cos(2 * math.pi * (t - 0.15))), 1.6 * math.sin(2 * math.pi * t)
    if gait == 'idle':
        return 0.0, 0.5 * math.sin(2 * math.pi * t)
    return -g['bob'] * abs(math.sin(2 * math.pi * t * 2)), math.sin(2 * math.pi * t * 2) * (0.9 if gait == 'walk' else 0.4)


def pose(animal, gait, t, heading, coat='bay', marks=(), size=(84, 84, 58)):
    """Voxelise the animal in its pose, turned to `heading` degrees (0 east,
    90 away from the viewer, 270 toward), into a Grid centred on the origin."""
    X, Y, Z = size
    g = Grid(-X // 2, X // 2, -Y // 2, Y // 2, Z)
    xs, ys, zs = np.meshgrid(np.arange(-X // 2, X // 2) + 0.5, np.arange(-Y // 2, Y // 2) + 0.5,
                             np.arange(Z) + 0.5, indexing='ij')
    th = math.radians(heading)
    u = xs * math.cos(th) + ys * math.sin(th)
    v = -xs * math.sin(th) + ys * math.cos(th)
    P = np.stack([u, v, zs], -1).reshape(-1, 3)
    d, part = horse_field(P, gait, t, coat, marks)
    c = COATS[coat]
    mats = {
        'coat': g.mat(c['coat']),
        'points': g.mat(c['points']),
        'mane': g.mat(c['mane']),
        'hoof': g.mat(HOOF),
        'muzzle': g.mat(MUZZLE),
        'white': g.mat(WHITE),
    }
    lut = np.array([mats[n] for n in PARTS], np.uint8)
    solid = (d <= 0).reshape(X, Y, Z)
    g.m[solid] = lut[part.reshape(X, Y, Z)][solid]
    # Smooth normals from the field's gradient, on the surface only, snapped
    # to the table: shading follows the body's curve, not the voxel steps.
    pad = np.pad(solid, 1)
    inner = pad[2:, 1:-1, 1:-1] & pad[:-2, 1:-1, 1:-1] & pad[1:-1, 2:, 1:-1] & pad[1:-1, :-2, 1:-1] \
        & pad[1:-1, 1:-1, 2:] & pad[1:-1, 1:-1, :-2]
    surf = solid & ~inner
    Ps = P[surf.reshape(-1)]
    e = 0.6
    grad = np.stack([horse_field(Ps + np.eye(3)[k] * e, gait, t, coat, marks)[0] - horse_field(Ps - np.eye(3)[k] * e, gait, t, coat, marks)[0]
                     for k in range(3)], 1)
    grad /= np.linalg.norm(grad, axis=1, keepdims=True) + 1e-9
    world = np.stack([grad[:, 0] * math.cos(th) - grad[:, 1] * math.sin(th),
                      grad[:, 0] * math.sin(th) + grad[:, 1] * math.cos(th), grad[:, 2]], 1)
    base = len(g.normals)
    for dvec in DIRS:
        g.normal(dvec)
    g.n[surf] = (base + np.argmax(world @ DIRS.T, 1)).astype(np.uint8)
    return g


def tidy(im):
    """Pixel-art cleanup: a pixel that matches none of its four neighbours,
    where three or more of them agree, takes their colour. What the normal
    table leaves as speckle becomes clean bands."""
    a = np.array(im)
    out = a.copy()
    H, W = a.shape[:2]
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if not a[y, x, 3]:
                continue
            n = [tuple(a[y + dy, x + dx]) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            if any(q[3] == 0 for q in n) or tuple(a[y, x]) in n:
                continue
            best = max(set(n), key=n.count)
            if n.count(best) >= 3:
                out[y, x] = best
    return Image.fromarray(out)


def frame(animal, gait, t, heading, coat='bay', marks=()):
    """One sprite: the posed grid cast into the oblique view, tidied,
    outlined."""
    g = pose(animal, gait, t, heading, coat, marks)
    X, Y, Z = g.m.shape
    W, H = 96, 84
    img, buf = render(g, W, H, W // 2, H - 4, Y, ambient=0.36, sun=0.86)
    im = Image.fromarray(img, 'RGBA')
    im = tidy(im)
    eye(im, buf, gait, t, heading)
    return outline(im, soft=0.6, hard=0.85)


def eye(im, buf, gait, t, heading):
    """A dark eye on whichever side of the head shows: the pixel whose
    surface lies nearest the eye's place on the skull."""
    th = math.radians(heading)
    bob, nod = motion(gait, t)
    coords = buf['coords'].astype(float)
    hit = coords[..., 0] > -1e8
    for s in (-1, 1):
        u, v, w = 17.8 * SCALE, s * 2.2 * SCALE, (31.2 + nod + bob) * SCALE
        p = np.array([u * math.cos(th) - v * math.sin(th), u * math.sin(th) + v * math.cos(th), w])
        d = np.linalg.norm(coords + 0.5 - p, axis=-1)
        d[~hit | (buf['level'] < 0)] = 1e9
        y, x = np.unravel_index(np.argmin(d), d.shape)
        if d[y, x] < 1.5:
            im.putpixel((int(x), int(y)), rgba('#0c080a'))


def sheet(out, zoom=4):
    heads = [0, 315, 270, 225, 180, 135, 90, 45]
    rows = []
    for gait, coat, marks in (('walk', 'bay', ('blaze', 'LH', 'RH')), ('trot', 'grey', ())):
        for h in heads:
            rows.append([frame('horse', gait, i / 8, h, coat, marks) for i in range(8)])
    # The hand-drawn horse beside, for comparison.
    import json
    root = Path(__file__).resolve().parent.parent.parent
    a = Image.open(root / 'public/fauna-c/atlas.png')
    f = json.load(open(root / 'public/fauna-c/atlas.json'))['frames']
    old = []
    for d in ('east', 'south', 'west', 'north'):
        fr = f[f'faunac-horse-wander-{d}-0']['frame']
        old.append(a.crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h'])))
    cw, ch = 96, 84
    im = Image.new('RGBA', (cw * 9, ch * (len(rows) + 1)), '#8f8e84')
    for r, row in enumerate(rows):
        for c, fr in enumerate(row):
            im.alpha_composite(fr, (c * cw, r * ch))
    for c, o in enumerate(old):
        im.alpha_composite(o, (c * cw + 16, len(rows) * ch + ch - o.height - 4))
    im.resize((im.width * zoom, im.height * zoom), Image.NEAREST).save(out)


# Facing 0 is north (away from the viewer), counted clockwise in eighths, as
# the characters face; heading is degrees anticlockwise from east.
FACINGS = {f: (90 - f * 45) % 360 for f in range(8)}


def build(out_dir):
    """The ridden horse's sheet: eight facings, four gaits, eight frames,
    a bay with a blaze and two white hind socks."""
    from art.atlas import pack_atlas
    sprites = {}
    for gait in ('idle', 'walk', 'trot', 'gallop'):
        for f, h in FACINGS.items():
            for i in range(8):
                im = frame('horse', gait, i / 8, h, 'bay', ('blaze', 'LH', 'RH'))
                im.info['anchor'] = (im.width // 2, im.height - 4)
                sprites[f'vhorse-{gait}-{f}-{i}'] = im
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    pack_atlas(sprites, Path(out_dir), 'horse', 2048)


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent.parent
    if sys.argv[1:2] == ['build']:
        build(root / 'public/fauna-v')
    else:
        Path('artifacts/horse').mkdir(parents=True, exist_ok=True)
        sheet(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/horse/sheet.png')
