"""Sacred precincts built in voxels: a temple in its walled court.

    .venv/bin/python scripts/art/sacred.py artifacts/sacred/sheet.png [style ...]

A precinct is the same plan in every tradition that walled its gods in: an
enclosure with a gate, a paved court with an altar or a basin, storerooms
along the walls, and the god's house at the back. A style says how that plan
was built -- what the walls are made of and how they end, what the gate
looks like, whether the house has a portico -- so a new tradition is a new
row in STYLES, not new code.

The precinct is a warded place: the game keeps its guards on watch over it.
"""
from pathlib import Path
import math
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.voxel_kit import VoxelBuilding, OAK, GRANITE  # noqa: E402
from art.voxel import ramp_from  # noqa: E402

MUDBRICK = ['#35251f', '#56402f', '#795a40', '#9a7652', '#b69264', '#cead7a', '#e2c796']
RED_MUDBRICK = ['#3a2220', '#5e3629', '#824a34', '#a2623f', '#bc7b4f', '#d29664', '#e4b27e']
LIMESTONE = ['#2a2830', '#45424a', '#625e64', '#817b7e', '#a09a98', '#bdb6b0', '#d6d0c6']
PAVING = ['#3a3430', '#56504a', '#746c62', '#928878', '#ada290', '#c6bca6']
PALM = ['#0e1e14', '#18321e', '#244a28', '#346432', '#4a7e3a', '#669a48']
TRUNK = ['#2a2018', '#44342a', '#5e4a3a', '#7a624c', '#947a5e']
GILT = ['#3e2a10', '#644419', '#8f6727', '#b88e3e', '#dcb45e', '#f3d88a']
LAPIS = ['#0a1230', '#12204e', '#1c3274', '#2a4a9a', '#4468b8', '#6a8cd0']

STYLES = {
    # Mud brick niched and buttressed, the walls stepped at the top, a gate
    # between towers, a house with a niched front: Kassite and Old
    # Babylonian temples, Assur and Nippur.
    'mesopotamian': dict(wall=MUDBRICK, socle=None, niches=True, merlons='stepped', gate='towers',
                         portico=False, court='palms', door=LAPIS),
    # A dressed-stone socle under mud brick and timber, flat roofs, square
    # merlons, a gate under a parabolic arch flanked by lions, a pillared
    # portico before the house: the temples of Hattusa.
    'hittite': dict(wall=RED_MUDBRICK, socle=LIMESTONE, niches=False, merlons='square', gate='lions',
                    portico=True, court='basin', door=OAK),
}


class VoxelTemple(VoxelBuilding):
    """A walled precinct, its gate in the front wall."""

    def ztop(self):
        return 66

    def build(self):
        st = STYLES[self.r.get('style', 'mesopotamian')]
        g, W, D = self.g, self.W, self.D
        rng = self.rng
        course = self.tex['course']
        wall = g.mat(st['wall'], tex=lambda i: course(i) * 0.6, bias=-0.2)
        trim = g.mat(st['wall'], bias=0.4)
        socle = g.mat(st['socle'], tex=lambda i: -1.1 * ((i['z'] % 6 == 0) | ((i['x'] + (i['z'] // 6) * 7) % 14 == 0)),
                      bias=0.1) if st['socle'] else None
        pave = g.mat(PAVING, tex=lambda i: -0.9 * ((i['x'] % 8 == 0) | (i['y'] % 8 == 0)), bias=0.3)
        timber = g.mat(OAK, bias=-0.3)
        dark = g.mat(['#0c0a10', '#16121a', '#201a22'])
        door = g.mat(st['door'], bias=0.0)
        gilt = g.mat(GILT, bias=0.3)
        stone = g.mat(LIMESTONE, bias=0.2)
        t, H = 7, 36
        cx = W // 2

        def block(x0, x1, y0, y1, z1, z0=0):
            """Walling to height z1, on a stone socle where the style has one."""
            self.box(x0, x1, y0, y1, z0, z1, wall)
            if socle:
                self.box(x0, x1, y0, y1, z0, min(z1, 12), socle)

        def crest(x0, x1, y0, y1, z):
            """Merlons along a wall top: stepped or square, a gap between."""
            along_x = (x1 - x0) >= (y1 - y0)
            n0, n1 = (x0, x1) if along_x else (y0, y1)
            for a in range(n0, n1, 7):
                if st['merlons'] == 'stepped':
                    for k, (lo, hi) in enumerate(((0, 5), (1, 4), (2, 3))):
                        if along_x:
                            self.box(a + lo, a + hi, y0, y1, z + k * 2, z + k * 2 + 2, trim)
                        else:
                            self.box(x0, x1, a + lo, a + hi, z + k * 2, z + k * 2 + 2, trim)
                else:
                    if along_x:
                        self.box(a, a + 4, y0, y1, z, z + 5, trim)
                    else:
                        self.box(x0, x1, a, a + 4, z, z + 5, trim)

        # Court paving.
        self.box(0, W, 0, D, 0, 1, pave)
        # The enclosure.
        block(0, W, 0, t, H)
        block(0, W, D - t, D, H)
        block(0, t, 0, D, H)
        block(W - t, W, 0, D, H)
        for x0, x1, y0, y1 in ((0, W, 0, t), (0, W, D - t, D), (0, t, 0, D), (W - t, W, 0, D)):
            self.box(x0, x1, y0, y1, H, H + 1, trim)
            crest(x0, x1, y0, y1, H + 1)
        # A niched and buttressed front, or a plain one with timber courses.
        if st['niches']:
            for x in range(4, W - 4, 14):
                if abs(x + 3 - cx) < 30:
                    continue
                self.box(x, x + 6, -2, 0, 1, H, wall)
                self.cut(x + 9, x + 11, 0, 1, 6, H - 5)
                self.cut(x + 8, x + 12, 0, 1, H - 8, H - 5)
        else:
            for z in (14, 26):
                self.box(0, W, -1, 0, z, z + 2, timber)
        # The gate between its towers.
        gw = 20
        for s in (-1, 1):
            tx0 = cx + s * (gw // 2) + (0 if s > 0 else -14)
            block(tx0, tx0 + 14, -8, t + 5, H + 14)
            self.box(tx0, tx0 + 14, -8, t + 5, H + 14, H + 15, trim)
            crest(tx0, tx0 + 14, -8, -2, H + 15)
        self.cut(cx - gw // 2, cx + gw // 2, -8, t + 6, 1, 46)
        if st['gate'] == 'lions':
            # A parabolic arch closed over the passage, lions at the jambs.
            for x in range(cx - gw // 2, cx + gw // 2):
                f = (x + 0.5 - cx) / (gw / 2)
                top = int(46 - 16 * f * f)
                self.box(x, x + 1, -8, t + 6, top, 50, socle or wall)
            for s in (-1, 1):
                lx = cx + s * (gw // 2 + 3)
                self.fill(lx - 6, lx + 6, -16, -6, 16, 34,
                          lambda X, Y, Z, lx=lx: ((X - lx) / 4.2) ** 2 + ((Y + 11) / 5.0) ** 2 + ((Z - 25) / 7.0) ** 2 <= 1,
                          stone)
                self.fill(lx - 6, lx + 6, -20, -12, 20, 32,
                          lambda X, Y, Z, lx=lx: ((X - lx) / 3.4) ** 2 + ((Y + 15) / 3.4) ** 2 + ((Z - 26) / 4.2) ** 2 <= 1,
                          stone)
                self.box(lx - 1, lx + 1, -19, -18, 27, 28, dark)
        else:
            self.box(cx - gw // 2 - 1, cx + gw // 2 + 1, -8, -5, 46, 50, timber)
        # Leaves standing open against the passage walls.
        for s in (-1, 1):
            x = cx + s * (gw // 2 - 1) - (1 if s > 0 else 0)
            self.box(x, x + 1, -2, 10, 1, 44, door)
            self.box(x, x + 1, 2, 3, 20, 22, gilt)
        # Storerooms along the side walls, their doors on the court.
        for x0 in (t, W - t - 26):
            self.box(x0, x0 + 26, t + 10, int(D * 0.5), 0, 22, wall)
            self.box(x0, x0 + 26, t + 10, int(D * 0.5), 22, 24, trim)
            face = x0 + 26 if x0 == t else x0 - 1
            for y in range(t + 16, int(D * 0.5) - 6, 14):
                self.cut(face, face + 1, y, y + 6, 1, 14)
        # The god's house at the back of the court.
        hx0, hx1 = int(W * 0.22), int(W * 0.78)
        hy0 = int(D * 0.55)
        block(hx0, hx1, hy0, D - t, 54)
        # A roof of packed mud over reed and beams, rolled after rain: patches
        # of fresh plaster, a hatch to the stair, spouts to throw off the rain.
        roof = g.mat(st['wall'], tex=lambda i: 0.9 * (((i['x'] // 9) + (i['y'] // 7)) % 3 == 0) - 0.6 * (i['y'] % 11 == 0),
                     bias=0.2)
        self.box(hx0, hx1, hy0, D - t, 54, 56, roof)
        self.box(hx0 + 8, hx0 + 18, hy0 + 10, hy0 + 18, 56, 57, dark)
        self.box(hx0 + 7, hx0 + 19, hy0 + 9, hy0 + 10, 56, 58, timber)
        for x in range(hx0 + 10, hx1 - 6, 24):
            self.box(x, x + 3, hy0 - 4, hy0, 50, 52, timber)
        crest(hx0, hx1, hy0, hy0 + 3, 56)
        if st['niches']:
            for x in range(hx0 + 4, hx1 - 4, 10):
                self.cut(x, x + 2, hy0, hy0 + 1, 6, 48)
        self.cut(cx - 8, cx + 8, hy0, hy0 + 3, 1, 32)
        self.box(cx - 8, cx + 8, hy0 + 3, hy0 + 4, 1, 32, dark)
        self.box(cx - 9, cx + 9, hy0 - 1, hy0, 32, 36, gilt if st['niches'] else timber)
        if st['portico']:
            for x in range(hx0 + 6, hx1 - 4, 16):
                self.box(x, x + 5, hy0 - 16, hy0 - 11, 1, 40, stone)
            self.box(hx0 + 2, hx1 - 2, hy0 - 18, hy0, 40, 43, timber)
            self.box(hx0 + 2, hx1 - 2, hy0 - 18, hy0, 43, 45, trim)
        # The court: an altar before the house; a basin, or palms.
        self.box(cx - 6, cx + 6, int(D * 0.38), int(D * 0.38) + 8, 1, 9, stone)
        self.box(cx - 7, cx + 7, int(D * 0.38) - 1, int(D * 0.38) + 9, 9, 10, stone)
        if st['court'] == 'palms':
            trunk = g.mat(TRUNK, tex=lambda i: -0.8 * (i['z'] % 3 == 0))
            leaf = g.mat(PALM, bias=0.3)
            for px, py in ((int(W * 0.3), int(D * 0.3)), (int(W * 0.7), int(D * 0.26))):
                self.box(px - 1, px + 2, py - 1, py + 2, 1, 58, trunk)
                for k in range(10):
                    a = k * math.pi / 5 + 0.3
                    for r in range(1, 20):
                        x = px + int(math.cos(a) * r)
                        y = py + int(math.sin(a) * r * 0.9)
                        z = 58 + int(4 - (r - 5) ** 2 / 14)
                        self.box(x, x + 2, y, y + 2, z, z + 2, leaf)
                for k in range(4):
                    self.box(px - 2 + k, px - 1 + k, py + 1, py + 2, 52, 55, g.mat(['#3a1a0a', '#6a3414', '#9a5020', '#c06c2c']))
        else:
            water = g.mat(['#0e1e2c', '#16324a', '#1e4c68', '#2c6a84', '#4a8ca0'], bias=0.4)
            bx, by = int(W * 0.3), int(D * 0.3)
            self.box(bx - 8, bx + 8, by - 5, by + 5, 1, 5, stone)
            self.box(bx - 6, bx + 6, by - 3, by + 3, 4, 5, water)
        # The gate's centre, in sprite pixels, where the door leaf hangs.
        self.door_x = self.sx0 + cx
        self.front = -8

    def life(self):
        return []


def recipe(style, footprint, seed, facing='south'):
    return dict(footprint=footprint, seed=seed, style=style, facing=facing, stories=1)


def sacred_recipes():
    """The precincts as building recipes, by the names the religious rules'
    `recipe` keys make: religious-<recipe>-<scale>-<look>."""
    out = {}
    sizes = {'small': [14, 12], 'medium': [18, 14], 'large': [22, 16]}
    labels = {'mesopotamian': 'Temple precinct', 'hittite': 'Temple precinct'}
    for style in STYLES:
        for scale, fp in sizes.items():
            for look in range(3):
                out[f'religious-{style}-temple-{scale}-{look}'] = {
                    'label': labels[style], 'footprint': fp, 'entrance': [fp[0] // 2, fp[1]],
                    'wall': 'mud-plaster' if style == 'mesopotamian' else 'field-stone', 'roof': 'flat', 'roofMaterial': 'tar',
                    'attachments': [], 'opening': 'door', 'height': 66,
                    'description': 'A walled temple precinct: a gate in the enclosure, a paved court with its altar, storerooms along the walls and the house of the god at the back.',
                    'sacredVoxel': style, 'style': style, 'seed': 400 + look * 7 + len(out), 'stories': 1,
                    'religious': True, 'family': f'{style}-temple', 'recipe': f'{style}-temple',
                }
    return out


def make(out, styles=None, zoom=2):
    styles = styles or list(STYLES)
    ims = [VoxelTemple(recipe(s, [18, 14], 11), None).render() for s in styles]
    W = sum(i.width + 12 for i in ims) + 12
    H = max(i.height for i in ims) + 24
    sheet = Image.new('RGBA', (W, H), '#8f8e84')
    x = 12
    for im in ims:
        sheet.alpha_composite(im, (x, H - 12 - im.height))
        x += im.width + 12
    sheet.resize((W * zoom, H * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    Path('artifacts/sacred').mkdir(parents=True, exist_ok=True)
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/sacred/sheet.png', sys.argv[2:] or None)
