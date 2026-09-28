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

WHITE = ['#6a6470', '#8c8690', '#aea8ac', '#cdc8c4', '#e6e1d8', '#f6f2ea']
# Fixed materials by part name. A coat's own parts come from COATS.
MATS = {
    'hoof': HOOF, 'muzzle': MUZZLE, 'white': WHITE,
    'leather': ['#120c0e', '#1e1416', '#2c1e1e', '#3c2a26', '#503a30', '#664c3c'],
    'saddle': ['#24140e', '#3c2214', '#58341c', '#744826', '#905e32', '#aa7842', '#c49458'],
    'brass': ['#3a2a10', '#6a4c1c', '#9a7428', '#c49c3c', '#e2c060', '#f6e29a'],
    # Coachbuilders' bottle green, lacquered nearly black in the shade.
    'lacquer': ['#070d0c', '#0c1814', '#12241c', '#1a3326', '#244532', '#325c42', '#467656'],
    'lining': ['#3a0c10', '#5c1418', '#80201e', '#a02e26', '#c04234', '#d85a44'],
    'wheel': ['#2a0c10', '#4a1216', '#6c1c1c', '#902a24', '#b23c2e', '#cc5a42', '#e07a5a'],
    'iron': ['#101014', '#1c1c22', '#2a2a32', '#3a3a44', '#4e4e5a', '#686874'],
    'glass': ['#141a26', '#1e2838', '#2c3c52', '#44607a', '#6e90a8', '#a8c4d0'],
    'seat': ['#2a1010', '#441a18', '#602822', '#7c3a2e', '#94503c'],
    'cabby': ['#1a1614', '#2a221e', '#3c302a', '#4e3e34', '#624e40', '#7a6250'],
    'topper': ['#08080a', '#121216', '#1c1c22', '#28282e', '#36363e', '#48484e'],
    'skin': ['#3a2020', '#6a3c30', '#9a5e46', '#c07c5c', '#d89a78', '#ecbc9a'],
    'passenger': ['#0e0e16', '#181824', '#242434', '#323246', '#44445c', '#5a5a72'],
    'lamp': ['#6a4418', '#b0782c', '#e2b35a', '#f8e2a0', '#fff6d8'],
}
# The rider's regions, drawn in neutral greys and recoloured in the game from
# the character's own skin, hair, clothes and hat.
KEYS = ['k-skin', 'k-hair', 'k-coat', 'k-lower', 'k-boot', 'k-hat']
NEUTRAL = ['#202020', '#3a3a3a', '#555555', '#707070', '#8c8c8c', '#a8a8a8', '#c4c4c4']
for _k in KEYS:
    MATS[_k] = NEUTRAL
GLASSY = {'glass'}
NAMES = []


def _id(name):
    if name not in NAMES:
        NAMES.append(name)
    return NAMES.index(name)


def solve(parts):
    """Nearest part and the distance to the union, over the points."""
    D = np.stack([d for _, d in parts], 0)
    ids = np.array([_id(n) for n, _ in parts])
    return D.min(0), ids[np.argmin(D, 0)]


def horse_parts(P, gait, t, marks=()):
    """The horse's parts over points P (N x 3) in its own frame, u forward,
    v to its left, w up, in unscaled units; and the anchors its tack and
    rider hang from."""
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
    return parts, dict(B=B, poll=poll, muzzle=muzzle, neck=neck_a, bob=bob, nod=nod)


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


def pose(scene, heading, coat='bay', size=(84, 84, 58), centre=0.0):
    """Voxelise a scene -- a function from points in its own unscaled frame to
    named parts -- turned to `heading` degrees (0 east, 90 away from the
    viewer, 270 toward) about the point `centre` units along it."""
    X, Y, Z = size
    g = Grid(-X // 2, X // 2, -Y // 2, Y // 2, Z)
    xs, ys, zs = np.meshgrid(np.arange(-X // 2, X // 2) + 0.5, np.arange(-Y // 2, Y // 2) + 0.5,
                             np.arange(Z) + 0.5, indexing='ij')
    th = math.radians(heading)
    u = xs * math.cos(th) + ys * math.sin(th)
    v = -xs * math.sin(th) + ys * math.cos(th)
    P = np.stack([u, v, zs], -1).reshape(-1, 3) / SCALE + np.array([centre, 0, 0])
    d, part = solve(scene(P))
    d = d * SCALE
    mats = {}
    for i, name in enumerate(NAMES):
        ramp = COATS[coat].get(name) or MATS[name]
        mats[i] = g.mat(ramp, glass=name in GLASSY, depth=40)
    lut = np.zeros(max(len(NAMES), 1), np.uint8)
    for i, m in mats.items():
        lut[i] = m
    solid = (d <= 0).reshape(X, Y, Z)
    g.m[solid] = lut[part.reshape(X, Y, Z)][solid]
    # Smooth normals from the field's gradient, on the surface only, snapped
    # to the table: shading follows the body's curve, not the voxel steps.
    pad = np.pad(solid, 1)
    inner = pad[2:, 1:-1, 1:-1] & pad[:-2, 1:-1, 1:-1] & pad[1:-1, 2:, 1:-1] & pad[1:-1, :-2, 1:-1] \
        & pad[1:-1, 1:-1, 2:] & pad[1:-1, 1:-1, :-2]
    surf = solid & ~inner
    Ps = P[surf.reshape(-1)]
    e = 0.5 / SCALE
    near = lambda Q: np.stack([d for _, d in scene(Q)], 0).min(0)
    grad = np.stack([near(Ps + np.eye(3)[k] * e) - near(Ps - np.eye(3)[k] * e) for k in range(3)], 1)
    grad /= np.linalg.norm(grad, axis=1, keepdims=True) + 1e-9
    world = np.stack([grad[:, 0] * math.cos(th) - grad[:, 1] * math.sin(th),
                      grad[:, 0] * math.sin(th) + grad[:, 1] * math.cos(th), grad[:, 2]], 1)
    base = len(g.normals)
    for dvec in DIRS:
        g.normal(dvec)
    g.n[surf] = (base + np.argmax(world @ DIRS.T, 1)).astype(np.uint8)
    g.names = {m: NAMES[i] for i, m in mats.items()}
    return g


def horse_scene(gait, t, marks=()):
    return lambda P: horse_parts(P, gait, t, marks)[0]


def box(P, c, h, r=0.0):
    """A box with half-extents h, its edges rounded by r."""
    q = np.abs(P - c) - (np.asarray(h) - r)
    return np.linalg.norm(np.maximum(q, 0), axis=-1) + np.minimum(q.max(-1), 0) - r


def shell(outer, inner):
    return np.maximum(outer, -inner)


# ------------------------------------------------------------------ riding

def bridle(P, a, reins_to=None):
    """Cheekpieces and noseband, and the reins from the bit to the hands."""
    poll, muzzle = a['poll'], a['muzzle']
    out = []
    for s in (-1, 1):
        bit = muzzle + np.array([-1.6, s * 1.9, 0.2])
        out.append(('leather', capsule(P, poll + np.array([-0.6, s * 2.3, -0.6]), bit, 0.45, 0.45)))
        out.append(('brass', ellipsoid(P, bit, np.array([0.6, 0.6, 0.6]))))
        if reins_to is not None:
            out.append(('leather', capsule(P, bit, reins_to[s], 0.42, 0.42)))
    out.append(('leather', capsule(P, muzzle + np.array([-1.4, 2.2, 0.9]), muzzle + np.array([-1.4, -2.2, 0.9]), 0.5, 0.5)))
    return out


def saddle(P, a):
    B = a['B']
    return [
        ('saddle', ellipsoid(P, np.array([0.4, 0, 24.9]) + B, np.array([4.2, 5.9, 1.2]))),
        ('saddle', ellipsoid(P, np.array([-3.2, 0, 25.9]) + B, np.array([1.1, 4.0, 1.2]))),
        ('saddle', ellipsoid(P, np.array([3.6, 0, 25.6]) + B, np.array([1.0, 2.6, 1.3]))),
        ('saddle', ellipsoid(P, np.array([0.6, 5.8, 21.8]) + B, np.array([3.0, 0.6, 3.2]))),
        ('saddle', ellipsoid(P, np.array([0.6, -5.8, 21.8]) + B, np.array([3.0, 0.6, 3.2]))),
        ('leather', shell(ellipsoid(P, np.array([2.4, 0, 18.6]) + B, np.array([1.0, 6.4, 6.4])),
                          ellipsoid(P, np.array([2.4, 0, 18.6]) + B, np.array([2.0, 5.9, 5.9])))),
    ]


def rider(P, a, hat=True, key=True, lean=0.0, bench=False):
    """A figure sitting astride: seat in the saddle, back upright, hands
    forward on the reins, legs down the horse's sides to the stirrups.
    `key` draws it in the recolourable regions; otherwise as a cabman."""
    B = a['B'] + np.array([lean, 0, 0])
    k = (lambda n: 'k-' + n) if key else (lambda n: {'skin': 'skin', 'hair': 'topper', 'coat': 'cabby', 'lower': 'cabby',
                                                     'boot': 'topper', 'hat': 'topper'}[n])
    out = [
        (k('lower'), ellipsoid(P, np.array([0, 0, 26.7]) + B, np.array([2.4, 2.8, 1.8]))),
        (k('coat'), capsule(P, np.array([-0.2, 0, 27.6]) + B, np.array([0.6 + lean * 0.4, 0, 33.2]) + B, 2.5, 2.3)),
        (k('coat'), ellipsoid(P, np.array([0.5, 0, 32.8]) + B, np.array([1.7, 3.1, 1.5]))),
        (k('skin'), capsule(P, np.array([0.6, 0, 34.0]) + B, np.array([0.7, 0, 35.3]) + B, 1.0, 1.0)),
        (k('skin'), ellipsoid(P, np.array([0.9, 0, 36.9]) + B, np.array([2.0, 1.8, 2.2]))),
        (k('hair'), ellipsoid(P, np.array([0.2, 0, 37.7]) + B, np.array([2.0, 1.95, 1.7]))),
    ]
    if hat:
        out += [
            (k('hat'), ellipsoid(P, np.array([0.8, 0, 38.9]) + B, np.array([3.0, 2.8, 0.45]))),
            (k('hat'), capsule(P, np.array([0.8, 0, 38.9]) + B, np.array([0.8, 0, 41.0]) + B, 1.8, 1.7)),
        ]
    hands = {}
    for s in (-1, 1):
        sh = np.array([0.4, s * 2.8, 32.4]) + B
        el = np.array([1.6, s * 3.0, 29.3]) + B
        hd = np.array([4.4, s * 1.5, 29.0]) + B
        hands[s] = hd
        hip = np.array([0, s * 2.0, 26.2]) + B
        # Astride, the knees round the horse's sides; on a bench, together,
        # the feet down on the board below.
        kn = np.array([2.2, s * 1.9, 26.4]) + B if bench else np.array([2.8, s * 6.3, 22.8]) + B
        an = np.array([-0.8, s * 2.0, 21.2]) + B if bench else np.array([1.6, s * 6.6, 17.4]) + B
        out += [
            (k('coat'), capsule(P, sh, el, 0.95, 0.9)),
            (k('coat'), capsule(P, el, hd, 0.85, 0.8)),
            (k('skin'), ellipsoid(P, hd, np.array([0.9, 0.8, 0.9]))),
            (k('lower'), capsule(P, hip, kn, 1.35, 1.15)),
            (k('lower'), capsule(P, kn, an + np.array([0, 0, 2]), 1.05, 0.95)),
            (k('boot'), capsule(P, an + np.array([0, 0, 2]), an, 1.0, 0.95)),
            (k('boot'), capsule(P, an, an + np.array([1.6, -s * 0.2, -0.6]), 0.95, 0.9)),
        ]
    return out, hands


def ridden_scene(gait, t, hat=True, marks=('blaze', 'LH', 'RH'), with_rider=True):
    def scene(P):
        parts, a = horse_parts(P, gait, t, marks)
        lean = {'gallop': 1.4, 'trot': 0.5}.get(gait, 0.0)
        figure, hands = rider(P, a, hat, lean=lean)
        parts += saddle(P, a) + bridle(P, a, hands)
        if with_rider:
            parts += figure
        return parts
    return scene


# ------------------------------------------------------------------ hansom

def harness(P, a):
    """Collar and hames, the pad on the back with its terrets, the breeching
    round the quarters, blinkers."""
    B = a['B']
    c = np.array([11.0, 0, 23.2]) + B
    q = np.array([-11.2, 0, 19.6]) + B
    out = [
        ('leather', shell(ellipsoid(P, c, np.array([2.1, 5.7, 6.6])), ellipsoid(P, c, np.array([3.2, 4.3, 5.2])))),
        ('leather', ellipsoid(P, np.array([1.4, 0, 24.6]) + B, np.array([2.6, 6.0, 1.2]))),
        ('leather', np.maximum(shell(ellipsoid(P, q + np.array([2.7, 0, 0]), np.array([6.6, 6.5, 6.9])),
                                     ellipsoid(P, q + np.array([2.7, 0, 0]), np.array([6.1, 6.0, 6.4]))),
                               np.abs(P[..., 0] - q[0]) - 0.7)),
    ]
    for s in (-1, 1):
        out += [
            ('brass', capsule(P, c + np.array([0.9, s * 3.4, 3.4]), c + np.array([1.3, s * 3.6, 6.4]), 0.5, 0.45)),
            ('brass', ellipsoid(P, np.array([1.4, s * 2.0, 26.0]) + B, np.array([0.6, 0.6, 0.7]))),
            ('leather', ellipsoid(P, a['poll'] + np.array([1.1, s * 2.6, -2.2]), np.array([1.3, 0.45, 1.2]))),
        ]
    return out


def wheel(P, hub, spin, r=12.4, spokes=12):
    """A carriage wheel in the u-w plane at the hub's v: iron tyre, a painted
    felloe, turned spokes, a hub. `spin` in radians."""
    du, dv, dw = P[..., 0] - hub[0], P[..., 1] - hub[1], P[..., 2] - hub[2]
    rad = np.hypot(du, dw)
    flat = np.abs(dv) - 0.55
    out = [
        ('iron', np.maximum(np.abs(rad - (r - 0.35)) - 0.4, flat)),
        ('wheel', np.maximum(np.abs(rad - (r - 1.3)) - 0.6, flat)),
        ('iron', capsule(P, hub + np.array([0, -1.4, 0]), hub + np.array([0, 1.4, 0]), 1.4, 1.4)),
    ]
    for k in range(spokes):
        ang = spin + 2 * math.pi * k / spokes
        tip = hub + np.array([math.cos(ang) * (r - 1.6), 0, math.sin(ang) * (r - 1.6)])
        out.append(('wheel', capsule(P, hub, tip, 0.5, 0.42)))
    return out


def hansom_scene(gait, t, marks=()):
    """A hansom cab: the patent safety cab of 1834, two great wheels under
    a body slung low between them, folding doors and a glass at the front,
    the cabman perched behind and above on the dickey with the reins passing
    over the roof. The horse in collar, pad and breeching between the shafts."""
    stride = GAITS[gait]['stride']
    # Two spokes' turn a stride, so the loop closes on itself.
    spin = -2 * math.pi * 2 / 12 * t

    def scene(P):
        parts, a = horse_parts(P, gait, t, marks)
        parts += harness(P, a)
        ax = np.array([-24.0, 0, 12.6])
        for s in (-1, 1):
            parts += wheel(P, ax + np.array([0, s * 7.8, 0]), spin)
        parts.append(('iron', capsule(P, ax + np.array([0, -7.2, 0]), ax + np.array([0, 7.2, 0]), 0.6, 0.6)))
        # The body: a lacquered shell, its inside open to the glass.
        bc = np.array([-25.0, 0, 23.0])
        outer = box(P, bc, (5.4, 5.0, 8.0), 1.2)
        inner = box(P, bc + np.array([0.6, 0, 0.8]), (4.6, 4.3, 7.2), 0.6)
        glass = box(P, np.array([-19.7, 0, 27.0]), (0.35, 3.8, 3.2))
        side = [box(P, np.array([-26.2, s * 5.0, 27.4]), (1.8, 0.35, 2.0)) for s in (-1, 1)]
        body = np.maximum(shell(outer, inner), -(glass - 0.4))
        for w_ in side:
            body = np.maximum(body, -(w_ - 0.4))
        parts.append(('lacquer', body))
        parts.append(('glass', glass))
        for w_ in side:
            parts.append(('glass', w_))
        # Folding doors, the dash and the footboard.
        parts.append(('lacquer', box(P, np.array([-19.4, 0, 18.4]), (0.45, 4.5, 3.4), 0.3)))
        parts.append(('lacquer', box(P, np.array([-18.4, 0, 15.2]), (1.4, 4.7, 0.6), 0.3)))
        # Red lining round the side panels.
        for s in (-1, 1):
            y = s * 5.05
            for (u0, w0), (u1, w1) in (((-29.4, 17.2), (-21.0, 17.2)), ((-21.0, 17.2), (-21.0, 24.6)),
                                       ((-29.4, 17.2), (-29.4, 24.6)), ((-29.4, 24.6), (-21.0, 24.6))):
                parts.append(('lining', capsule(P, np.array([u0, y, w0]), np.array([u1, y, w1]), 0.32, 0.32)))
        # Roof, sweeping back to the dickey.
        parts.append(('lacquer', ellipsoid(P, np.array([-26.4, 0, 31.3]), np.array([7.2, 5.6, 1.6]))))
        parts.append(('iron', capsule(P, np.array([-30.4, 0, 30.6]), np.array([-32.6, 0, 33.2]), 0.5, 0.5)))
        parts.append(('seat', box(P, np.array([-32.8, 0, 33.8]), (1.8, 2.5, 0.6), 0.3)))
        # Lamps at the front corners.
        for s in (-1, 1):
            lc = np.array([-18.9, s * 5.5, 27.4])
            parts.append(('lacquer', box(P, lc, (0.9, 0.9, 1.3), 0.3)))
            parts.append(('lamp', box(P, lc + np.array([0.7, 0, 0]), (0.3, 0.6, 0.8))))
            parts.append(('brass', ellipsoid(P, lc + np.array([0, 0, 1.6]), np.array([0.7, 0.7, 0.5]))))
        # Shafts from the body's front to the tugs at the pad.
        for s in (-1, 1):
            parts.append(('lacquer', capsule(P, np.array([-18.6, s * 5.6, 16.6]), np.array([10.5, s * 5.6, 19.2]) + a['B'], 0.55, 0.45)))
        # The cabman: perched on the dickey in greatcoat and top hat, reins in
        # hand, the whip in its socket.
        cab = dict(B=np.array([-32.4, 0, 8.2]))
        man = []
        parts.append(('lacquer', box(P, np.array([-33.2, 0, 28.6]), (1.4, 2.8, 0.4), 0.2)))
        for n, d in rider(P, cab, hat=True, key=False, bench=True)[0]:
            man.append((n, d))
        parts += [(n, d) for n, d in man]
        hands = {s: np.array([-27.9, s * 1.5, 37.2]) for s in (-1, 1)}
        for s in (-1, 1):
            bit = a['muzzle'] + np.array([-1.6, s * 1.9, 0.2])
            parts.append(('leather', capsule(P, hands[s], np.array([-19.5, s * 2.0, 33.4]), 0.4, 0.4)))
            parts.append(('leather', capsule(P, np.array([-19.5, s * 2.0, 33.4]), bit, 0.4, 0.4)))
        parts.append(('iron', capsule(P, np.array([-30.2, -2.8, 34.4]), np.array([-25.0, -3.4, 47.0]), 0.35, 0.3)))
        # A fare inside, in the gloom behind the glass.
        parts += [
            ('passenger', capsule(P, np.array([-26.0, 0, 18.5]), np.array([-25.4, 0, 24.8]), 2.3, 2.1)),
            ('skin', ellipsoid(P, np.array([-24.9, 0, 27.2]), np.array([1.7, 1.6, 1.9]))),
            ('topper', capsule(P, np.array([-24.9, 0, 28.8]), np.array([-24.9, 0, 30.4]), 1.5, 1.4)),
        ]
        parts += bridle(P, a)
        return parts
    return scene


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
    g = pose(horse_scene(gait, t, marks), heading, coat)
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
# The anchor sits 112px down; the canvas runs on below it for a team coming
# toward the viewer.
CAB = dict(size=(104, 104, 70), centre=-7, W=150, H=148, base=112)


def finish(img, buf, gait=None, t=0, heading=0):
    im = tidy(Image.fromarray(img))
    if gait:
        eye(im, buf, gait, t, heading)
    return outline(im, soft=0.6, hard=0.85)


def rider_layer(scene, heading):
    """The rider's visible pixels as keys the game recolours: red is the
    region times 32 plus the shade, the outline taken off the shade."""
    g = pose(scene, heading)
    X, Y, Z = g.m.shape
    img, buf = render(g, 96, 84, 48, 80, Y, ambient=0.36, sun=0.86)
    keys = {m: KEYS.index(n) for m, n in g.names.items() if n in KEYS}
    mat, level = buf['mat'], buf['level']
    alpha = img[..., 3] > 0
    out = np.zeros_like(img)
    H, W = alpha.shape
    for y in range(H):
        for x in range(W):
            k = keys.get(int(mat[y, x]))
            if k is None or level[y, x] < 0:
                continue
            gone = lambda dx, dy: not (0 <= x + dx < W and 0 <= y + dy < H) or not alpha[y + dy, x + dx]
            lv = int(level[y, x]) - (2 if gone(1, 0) or gone(0, 1) else 1 if gone(-1, 0) or gone(0, -1) else 0)
            out[y, x] = (k * 32 + max(0, lv), 0, 0, 255)
    return Image.fromarray(out)


def build(out_dir):
    """The ridden horse, its two riders as recolourable keys, the bare horse
    and the hansom cab: eight facings, their gaits, eight frames each."""
    from art.atlas import pack_atlas
    sprites = {}
    for gait in ('idle', 'walk', 'trot', 'gallop'):
        for f, h in FACINGS.items():
            for i in range(8):
                t = i / 8
                base = pose(ridden_scene(gait, t, with_rider=False), h)
                img, buf = render(base, 96, 84, 48, 80, base.m.shape[1], ambient=0.36, sun=0.86)
                im = finish(img, buf, gait, t, h)
                im.info['anchor'] = (48, 80)
                sprites[f'vhorse-ride-{gait}-{f}-{i}'] = im
                for hat in ('hat', 'bare'):
                    key = rider_layer(ridden_scene(gait, t, hat=hat == 'hat'), h)
                    key.info['anchor'] = (48, 80)
                    sprites[f'vrider-{hat}-{gait}-{f}-{i}'] = key
    for gait in ('walk', 'trot'):
        for f, h in FACINGS.items():
            for i in range(8):
                t = i / 8
                g = pose(hansom_scene(gait, t), h, size=CAB['size'], centre=CAB['centre'])
                img, buf = render(g, CAB['W'], CAB['H'], CAB['W'] // 2, CAB['base'], g.m.shape[1], ambient=0.36, sun=0.86)
                im = finish(img, buf)
                im.info['anchor'] = (CAB['W'] // 2, CAB['base'])
                sprites[f'vcab-hansom-{gait}-{f}-{i}'] = im
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    pack_atlas(sprites, Path(out_dir), 'horse', 2048)


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent.parent
    if sys.argv[1:2] == ['build']:
        build(root / 'public/fauna-v')
    else:
        Path('artifacts/horse').mkdir(parents=True, exist_ok=True)
        sheet(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/horse/sheet.png')
