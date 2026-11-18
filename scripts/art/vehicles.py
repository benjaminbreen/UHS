"""Conveyances: draught animals, the vehicles they pull, and room for a crew.

    .venv/bin/python scripts/art/vehicles.py artifacts/vehicles/sheet.png [model ...]
    .venv/bin/python scripts/art/vehicles.py build

The farm equipment is drawn without its animals. The runtime places the
kept animals alongside it, with their own coat and gait. The chariot keeps
its baked team. Each vehicle carries its own crew places. The
crew are not drawn here. The game seats its own people in those places, so a
charioteer who jumps down is the person who was driving. To let them sit in
the vehicle rather than on it, every frame ships as two layers, split by
depth around the crew: what is behind them, and what is in front.

Units are the rig's: 17 to the metre before voxel_rig.SCALE.
"""
from pathlib import Path
import math
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.voxel_rig import (  # noqa: E402
    SCALE, MATS, box, capsule, ellipsoid, horse_parts, harness, bridle, pose, tidy, wheel,
)
from art.voxel import render  # noqa: E402
from art.city_kit import outline  # noqa: E402
from art.oblique_style import DRIFT  # noqa: E402

MATS.update({
    'wood': ['#1e140e', '#34221a', '#4c3222', '#66442c', '#805a38', '#9c7448', '#b8905c'],
    'greywood': ['#1a1818', '#2c2a28', '#403c38', '#58524a', '#706a5e', '#8a8474', '#a49e8c'],
    'screen': ['#2a0e0c', '#4c1a14', '#72281c', '#983a26', '#b85234', '#d0704a'],
    'bronze': ['#2a1a0c', '#5a3a18', '#8a5c26', '#b88238', '#dca858', '#f4d08a'],
    'hay': ['#3a3014', '#5c4c1e', '#7e6a2a', '#a08a3a', '#bea650', '#d6c070', '#eadb98'],
    'sack': ['#3a3026', '#5a4c3a', '#7a6a52', '#9a886a', '#b6a684'],
    'thatch': ['#2a2012', '#46361c', '#644e28', '#826834', '#9e8444', '#b89e5a'],
    'rope': ['#3a2e1e', '#5c4a30', '#7e6844', '#9e865a'],
    'buffalo': ['#0e0e12', '#18181e', '#24242c', '#32323a', '#42424c', '#56565f', '#6e6e78'],
    'ox': ['#2a1410', '#44201a', '#643024', '#84442e', '#a45c3a', '#be784c', '#d49464'],
    'horn': ['#2a2622', '#4a443c', '#6e6558', '#968a78', '#bcb09a', '#dcd2bc'],
    'nose': ['#1a1216', '#2c2024', '#40302e', '#5a4440'],
})

# ------------------------------------------------------------------ species

# Equids are the horse warped: smaller, shorter in the leg, wider. A
# Shetland stands two-thirds a horse's height on legs shorter still.
EQUIDS = {
    'horse': dict(size=1.0, leg=1.0, width=1.0),
    'bronze-horse': dict(size=0.88, leg=0.96, width=0.95),
    'pony': dict(size=0.72, leg=0.82, width=1.18),
}
BELLY = 13.0


def warp(P, sp):
    """Points in a smaller or stockier equid's space to the horse's."""
    q = P / sp['size']
    q = q * np.array([1, 1 / sp['width'], 1])
    w = q[..., 2]
    lf = sp['leg']
    q[..., 2] = np.where(w < BELLY * lf, w / lf, w - BELLY * lf + BELLY)
    return q


def unwarp(p, sp):
    """A point on the horse back to the smaller or stockier animal."""
    u, v, w = p
    w = w * sp['leg'] if w < BELLY else w - BELLY + BELLY * sp['leg']
    return np.array([u, v * sp['width'], w]) * sp['size']


def equid(P, kind, gait, t, at, tack='bridle', marks=()):
    """An equid standing at `at` in the scene, with its tack: a bridle, or a
    draught harness of collar, pad and breeching as well."""
    sp = EQUIDS[kind]
    q = warp(P - at, sp)
    parts, a = horse_parts(q, gait, t, marks)
    parts += bridle(q, a)
    if tack == 'harness':
        parts += harness(q, a)
    k = sp['size'] * min(sp['leg'], sp['width'], 1)
    anchors = {n: unwarp(a[n], sp) + at for n in ('poll', 'muzzle', 'neck')}
    anchors['withers'] = unwarp(np.array([8.0, 0, 24.5]) + a['B'], sp) + at
    anchors['shoulder'] = lambda s, sp=sp, a=a: unwarp(np.array([9.5, s * 5.6, 18.5]) + a['B'], sp) + at
    return [(n, d * k) for n, d in parts], anchors


def d_shape(P, c, half_u, half_v, round_front):
    """Signed distance in the u-v plane to a floor rounded at its front."""
    u, v = P[..., 0] - c[0], P[..., 1] - c[1]
    back = np.maximum(np.abs(u + half_u * 0.3) - half_u * 0.7, np.abs(v) - half_v)
    front = np.hypot(np.maximum(u - half_u * 0.4, 0) / round_front, v / half_v) * half_v - half_v
    return np.minimum(back, np.maximum(front, -u - half_u * 0.3 + half_u * 0.4))


def chariot_car(P, c, floor, half_u, half_v, front_h, back_h, screen='screen'):
    """A war chariot's car: a floor, a breastwork high at the front falling
    toward the open back, a wooden rail along its top, handholds."""
    D = d_shape(P, c, half_u, half_v, 1.0)
    u = P[..., 0]
    top = floor + back_h + (front_h - back_h) * np.clip((u - (c[0] - half_u)) / (2 * half_u), 0, 1) ** 1.3
    wall = np.maximum(np.abs(D) - 0.55, np.maximum(P[..., 2] - top, floor - P[..., 2]))
    # Open at the back, where the crew mounts.
    wall = np.maximum(wall, -(u - (c[0] - half_u + 1.5)) * (np.abs(P[..., 1] - c[1]) < half_v * 0.6))
    return [
        (screen, wall),
        ('wood', np.maximum(D, np.abs(P[..., 2] - floor) - 0.5)),
        ('wood', np.maximum(np.abs(D) - 0.8, np.abs(P[..., 2] - top) - 0.55)),
    ]


def cart_bed(P, c, half, floor, sides, slatted=True, wood='wood'):
    """A cart's bed: plank floor, side rails on stakes or solid boards, a
    front board and a tailboard."""
    out = [(wood, box(P, c + np.array([0, 0, floor - c[2]]), (half[0], half[1], 0.6), 0.2))]
    for s in (-1, 1):
        y = c[1] + s * half[1]
        if slatted:
            for k, h in enumerate((sides * 0.45, sides)):
                out.append((wood, box(P, np.array([c[0], y, floor + h]), (half[0], 0.45, 0.5), 0.2)))
            for u in np.linspace(c[0] - half[0] + 0.8, c[0] + half[0] - 0.8, 5):
                out.append((wood, box(P, np.array([u, y, floor + sides / 2]), (0.45, 0.45, sides / 2), 0.1)))
        else:
            out.append((wood, box(P, np.array([c[0], y, floor + sides / 2]), (half[0], 0.5, sides / 2), 0.2)))
    for s in (-1, 1):
        out.append((wood, box(P, np.array([c[0] + s * half[0], c[1], floor + sides * 0.35]), (0.5, half[1], sides * 0.35), 0.2)))
    return out


def solid_wheel(P, hub, spin, r):
    """A tripartite disc wheel of the early ox-carts: three planks doweled."""
    du, dv, dw = P[..., 0] - hub[0], P[..., 1] - hub[1], P[..., 2] - hub[2]
    rad = np.hypot(du, dw)
    disc = np.maximum(rad - r, np.abs(dv) - 0.9)
    return [('wood', disc), ('greywood', np.maximum(np.abs(rad - r + 0.3) - 0.35, np.abs(dv) - 1.0)),
            ('wood', capsule(P, hub + np.array([0, -1.6, 0]), hub + np.array([0, 1.6, 0]), 1.6, 1.6))]


def figure(P, at, posture, child=False):
    """A stand-in for the crew, for the review sheet only: the game draws its
    own people in these places."""
    s = 0.7 if child else 1.0
    B = np.array(at, float)
    if posture == 'stand':
        hip, chest, head = B + np.array([0, 0, 15 * s]), B + np.array([0.2, 0, 22 * s]), B + np.array([0.4, 0, 26.5 * s])
        legs = [('k-lower', capsule(P, B + np.array([0, 1.2 * s, 0]), hip + np.array([0, 1.2 * s, 0]), 1.2 * s, 1.3 * s)),
                ('k-lower', capsule(P, B + np.array([0, -1.2 * s, 0]), hip + np.array([0, -1.2 * s, 0]), 1.2 * s, 1.3 * s))]
    else:
        hip, chest, head = B + np.array([0, 0, 2 * s]), B + np.array([0.2, 0, 9 * s]), B + np.array([0.4, 0, 13.5 * s])
        legs = [('k-lower', capsule(P, hip + np.array([0, sv * 1.2 * s, 0]), hip + np.array([4 * s, sv * 1.2 * s, -1]), 1.2 * s, 1.1 * s))
                for sv in (-1, 1)]
    return legs + [('k-coat', capsule(P, hip, chest, 2.3 * s, 2.4 * s)),
                   ('k-skin', ellipsoid(P, head, np.array([1.9, 1.7, 2.1]) * s))]


# Each model: its team, its gear, where its crew go. `crew` places are
# (u, v, w, posture, child) with the feet at w; `centre` is the point the
# sprite hangs from and the game moves along the road.
MODELS = {
    'hittite-chariot': dict(
        label='Hittite war chariot', centre=-10.0, gaits=('walk', 'trot'),
        crew=[(-26.8, 3.2, 9.8, 'stand', False), (-26.8, -3.4, 9.8, 'stand', False), (-32.8, 0.2, 9.8, 'stand', False)],
    ),
    'farm-cart-pony': dict(
        label='Farm cart and pony', centre=-9.0, gaits=('walk',),
        crew=[(-16.8, 2.6, 13.4, 'sit', False)],
    ),
    'ox-plough': dict(label='Ox plough', centre=-7.0, gaits=('walk',),
        crew=[(-31, 1, 0, 'walk', False)]),
    'buffalo-cart': dict(
        label='Buffalo cart', centre=-7.0, gaits=('walk',),
        crew=[(-15.8, 0.0, 15.0, 'sit', False), (-21.5, 2.6, 15.0, 'sit', True), (-24.2, -2.4, 15.0, 'sit', True)],
    ),
}


def model_parts(name, gait, t, P, crew=False):
    parts = []
    if name == 'hittite-chariot':
        spokes, r = 6, 8.6
        for s, coat_shift in ((-1, 0.0), (1, 0.25)):
            p, a = equid(P, 'bronze-horse', gait, (t + coat_shift) % 1, np.array([0.0, s * 8.6, 0.0]))
            parts += p
            if s == -1:
                left = a
            else:
                right = a
        # The yoke across both necks on its saddles; the pole to the car.
        yw = (left['withers'] + right['withers']) / 2
        yoke = [left['withers'] + np.array([1.0, 0, 1.0]), right['withers'] + np.array([1.0, 0, 1.0])]
        parts.append(('wood', capsule(P, yoke[0] + np.array([0, -3, 0]), yoke[1] + np.array([0, 3, 0]), 0.8, 0.8)))
        for y in yoke:
            parts.append(('bronze', ellipsoid(P, y + np.array([0, 0, 1.0]), np.array([0.8, 0.8, 1.2]))))
        parts.append(('wood', capsule(P, np.array([-22.7, 0, 9.0]), np.array([yw[0] + 1.0, 0, yw[2] + 1.0]), 0.8, 0.6)))
        hub = np.array([-29.8, 0, r])
        spin = -2 * math.pi * 2 / spokes * t
        for s in (-1, 1):
            parts += [(n if n != 'wheel' else 'wood', d) for n, d in wheel(P, hub + np.array([0, s * 10.8, 0]), spin, r=r, spokes=spokes)]
            parts.append(('bronze', capsule(P, hub + np.array([0, s * 11.8, 0]), hub + np.array([0, s * 12.6, 0]), 1.0, 0.8)))
        parts.append(('wood', capsule(P, hub + np.array([0, -10.8, 0]), hub + np.array([0, 10.8, 0]), 0.6, 0.6)))
        parts += chariot_car(P, np.array([-29.8, 0, 0]), 9.6, 6.6, 9.4, 15.0, 5.0)
        # Quivers slung at the car's sides, bronze-mounted.
        for s in (-1, 1):
            parts.append(('screen', capsule(P, np.array([-25.4, s * 9.9, 13.0]), np.array([-29.2, s * 9.9, 23.0]), 0.9, 1.1)))
    elif name == 'farm-cart-pony':
        P = P * np.array([1, 0.78, 1])
        r, spokes = 9.6, 10
        hub = np.array([-22.6, 0, r])
        spin = -2 * math.pi * 2 / spokes * t
        for s in (-1, 1):
            parts += [(n if n != 'wheel' else 'greywood', d) for n, d in wheel(P, hub + np.array([0, s * 9.2, 0]), spin, r=r, spokes=spokes)]
            parts.append(('greywood', capsule(P, np.array([-15.2, s * 5.2, 12.2]), np.array([4, s * 4.2, 14]), 0.65, 0.55)))
        parts.append(('iron', capsule(P, hub + np.array([0, -9.2, 0]), hub + np.array([0, 9.2, 0]), 0.6, 0.6)))
        parts += cart_bed(P, np.array([-23.0, 0, 0]), (7.6, 8.2), 12.6, 5.4, wood='greywood')
        parts.append(('hay', ellipsoid(P, np.array([-25.5, 0, 16.0]), np.array([5.0, 6.8, 3.6]))))
        parts.append(('sack', ellipsoid(P, np.array([-20.2, -3.4, 14.8]), np.array([1.8, 1.6, 2.2]))))
        parts.append(('sack', ellipsoid(P, np.array([-20.4, -0.2, 14.6]), np.array([1.8, 1.6, 2.0]))))
    elif name == 'buffalo-cart':
        P = P * np.array([1, 0.76, 1])
        r, spokes = 11.6, 14
        hub = np.array([-24.2, 0, r])
        spin = -2 * math.pi * 2 / spokes * t
        for s in (-1, 1):
            parts += [(n if n != 'wheel' else 'wood', d) for n, d in wheel(P, hub + np.array([0, s * 9.4, 0]), spin, r=r, spokes=spokes)]
        parts.append(('wood', capsule(P, hub + np.array([0, -9.4, 0]), hub + np.array([0, 9.4, 0]), 0.7, 0.7)))
        # The yoke across the neck before the hump, the shafts back from it
        # to the bed, lashed.
        yk = np.array([5, 0, 19])
        parts.append(('wood', capsule(P, yk + np.array([0, -7.2, 0]), yk + np.array([0, 7.2, 0]), 0.8, 0.8)))
        for s in (-1, 1):
            parts.append(('wood', capsule(P, yk + np.array([0, s * 5.8, 0]), np.array([-15.8, s * 5.6, 14.6]), 0.7, 0.7)))
            parts.append(('rope', capsule(P, yk + np.array([0, s * 3.2, 0.6]), yk + np.array([-0.4, s * 3.2, -6.0]), 0.4, 0.4)))
        parts += cart_bed(P, np.array([-24.0, 0, 0]), (8.2, 6.8), 14.6, 3.6, slatted=False)
        # An arched roof of palm thatch over the back of the bed.
        u = P[..., 0]
        arch = np.hypot(P[..., 1], P[..., 2] - 15.0) - 7.6
        roof = np.maximum(np.abs(arch) - 0.8, np.maximum(u - (-19.0), -32.0 - u))
        roof = np.maximum(roof, 15.0 - P[..., 2])
        parts.append(('thatch', roof))
        for uu in (-19.0, -32.0):
            parts.append(('wood', np.maximum(np.abs(arch + 0.2) - 0.5, np.maximum(np.abs(u - uu) - 0.5, 15.0 - P[..., 2]))))
    elif name == 'ox-plough':
        def timber(start, end, thick, tip):
            return ('wood', capsule(P, np.array(start), np.array(end), thick, tip))
        parts += [timber((5, -16, 20), (5, 16, 20), 1.2, 1.2),
                  timber((5, 0, 20), (-22, 0, 4), 0.85, 1.3),
                  timber((-16, 0, 1), (-29, 0, 15), 1.4, 0.8),
                  ('iron', capsule(P, np.array([-13, 0, 0.9]), np.array([-21, 0, 2]), 0.5, 1.6))]
    if crew:
        for (cu, cv, cw, posture, child) in MODELS[name]['crew']:
            parts += figure(P, (cu, cv, cw), posture, child)
    return parts


def scene(name, gait, t, crew=False):
    return lambda P: model_parts(name, gait, t, P, crew)


GRID = (112, 112, 64)
W, H, BASE = 160, 150, 112


def crew_screen(name, heading):
    """Where each crew place lands in the sprite, relative to its anchor, and
    how near the viewer it is (world y; smaller is nearer)."""
    m = MODELS[name]
    th = math.radians(heading)
    out = []
    for (u, v, w, posture, child) in m['crew']:
        x = ((u - m['centre']) * math.cos(th) - v * math.sin(th)) * SCALE
        y = ((u - m['centre']) * math.sin(th) + v * math.cos(th)) * SCALE
        z = w * SCALE
        out.append([round(x + y * DRIFT / GRID[1], 1), round(-z - 0.5 * y, 1), round(y, 2), posture, child])
    return out


def layers(name, gait, t, heading, crew=False):
    """Back and front layers, split at the crew's mean depth: a voxel nearer
    the viewer than they are is drawn over them."""
    m = MODELS[name]
    g = pose(scene(name, gait, t, crew), heading, size=GRID, centre=m['centre'])
    img, buf = render(g, W, H, W // 2, BASE, g.m.shape[1], ambient=0.36, sun=0.86)
    full = outline(tidy(Image.fromarray(img)), soft=0.6, hard=0.85)
    if crew:
        return full, full
    depth = np.mean([c[2] for c in crew_screen(name, heading)])
    near = (buf['coords'][..., 1] + 0.5 < depth) & (buf['level'] >= 0)
    a = np.array(full)
    front, back = a.copy(), a.copy()
    front[~near] = 0
    back[near] = 0
    return Image.fromarray(back), Image.fromarray(front)


def furrows():
    strip = Image.new('RGBA', (16, 16))
    for x in range(16):
        for y, colour in enumerate(('#785539', '#9b7450', '#503c30', '#48372d', '#685039', '#846146')):
            strip.putpixel((x, 6 + y + int(x in (3, 4, 11))), tuple(bytes.fromhex(colour[1:])) + (255,))
    mud = Image.new('RGBA', (16, 16))
    for x in range(16):
        offset = round(1.4 * math.sin(x * math.tau / 16))
        for y, rgba in enumerate(((92, 111, 97, 130), (107, 100, 74, 200), (87, 82, 63, 220), (79, 77, 60, 210), (99, 101, 81, 180), (109, 139, 127, 140))):
            mud.putpixel((x, 5 + y + offset), rgba)
    return {'vv-furrow-x': strip, 'vv-furrow-y': strip.transpose(Image.Transpose.TRANSPOSE),
            'vv-puddled-x': mud, 'vv-puddled-y': mud.transpose(Image.Transpose.TRANSPOSE)}


def build(out_dir, generated):
    import json
    from art.atlas import pack_atlas
    from art.voxel_rig import FACINGS
    sprites, catalog = {}, {}
    for name, m in MODELS.items():
        for gait in m['gaits']:
            for f, h in FACINGS.items():
                for i in range(8):
                    back, front = layers(name, gait, i / 8, h)
                    for layer, im in (('back', back), ('front', front)):
                        im.info['anchor'] = (W // 2, BASE)
                        sprites[f'vv-{name}-{gait}-{f}-{i}-{layer}'] = im
        catalog[name] = {
            'label': m['label'], 'gaits': list(m['gaits']), 'size': [W, H], 'anchor': [W // 2, BASE],
            # Per facing: [dx, dy, depth, posture, child] for each crew place.
            'crew': {str(f): crew_screen(name, h) for f, h in FACINGS.items()},
        }
    sprites.update(furrows())
    pack_atlas(sprites, Path(out_dir), 'vehicles', 2048)
    (generated / 'conveyances.generated.json').write_text(json.dumps(catalog, indent=1))


def sheet(out, names=None, zoom=3):
    from art.voxel_rig import FACINGS
    names = names or list(MODELS)
    rows = []
    for name in names:
        row = []
        for f in (2, 3, 4, 5, 0):
            # The vehicle alone: the game puts its own people in the crew places.
            back, front = layers(name, 'walk', 0.25, FACINGS[f])
            im = back.copy()
            im.alpha_composite(front)
            row.append(im)
        rows.append(row)
    im = Image.new('RGBA', (W * 5, H * len(rows)), '#7d8c5e')
    for r, row in enumerate(rows):
        for c, fr in enumerate(row):
            im.alpha_composite(fr, (c * W, r * H))
    im.resize((im.width * zoom, im.height * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent.parent
    if sys.argv[1:2] == ['build']:
        build(root / 'public/fauna-v', root / 'src/content/graphics')
    else:
        Path('artifacts/vehicles').mkdir(parents=True, exist_ok=True)
        sheet(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/vehicles/sheet.png', sys.argv[2:] or None)
