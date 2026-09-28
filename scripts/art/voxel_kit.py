"""What every voxel street building shares: the palettes, the materials, the
parts (windows, shutters, railings, balconies, shopfronts, awnings, doors,
rooftop furniture) and the render that turns a model into a model entry.

A building subclasses VoxelBuilding, says how tall it is (`ztop`) and builds
itself in `build`, reading `self.state` for anything that changes over the
day: a later render with a different state (shutters shut, awning rolled)
must draw every random choice in the same order, so only state decides.
"""
from pathlib import Path
import random
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.oblique_style import DRIFT  # noqa: E402
from art.voxel import Grid, K, h3, ramp_from, render  # noqa: E402

GROUND, STOREY = 54, 40

LIMESTONE = ['#2c2436', '#4b3f4b', '#6d5f5e', '#918070', '#b3a085', '#cfbc9b', '#e6d6b4', '#f7ecd0']
PORTLAND = ['#26242e', '#43404a', '#625e64', '#85807f', '#a8a29b', '#c8c2b6', '#e0dbcd', '#f2eee2']
PLINTH = ['#1f1b28', '#352e3a', '#4d4450', '#675c63', '#827478', '#9d8e8f']
GRANITE = ['#15141c', '#23222c', '#34323d', '#48454f', '#5f5b63', '#7a757b', '#99939a']
SLATE = ['#111120', '#1b1d31', '#272c45', '#363e5a', '#4a5472', '#626e8c', '#8390aa']
ZINC = ['#1e2130', '#2d3346', '#414a5f', '#586378', '#727e92', '#909bac', '#b4bdc8', '#d6dce2']
TAR = ['#14131a', '#1e1d25', '#2a2831', '#37343d', '#46424b', '#58535b', '#6d676e']
CONCRETE = ['#28272e', '#3f3d44', '#58555b', '#747075', '#918c8e', '#aea8a7', '#cac4c0', '#e2ddd6']
TIN = ['#1c2126', '#2c343b', '#3f4a52', '#56636b', '#6f7d84', '#8e9ba0', '#b2bcbe', '#d5dcdc']
RUST = ['#241210', '#3e1d16', '#5c2a1c', '#7c3b23', '#9a4e2c', '#b6673b', '#cd8552']
REDTIN = ['#240d10', '#3e1518', '#5a1f1f', '#772b26', '#93392f', '#ad4c3b', '#c6644b']
PANTILE = ['#2a1210', '#461c16', '#66281c', '#873623', '#a5472c', '#bf5e38', '#d57c4b', '#e8a068']
IRON = ['#0c0b15', '#161522', '#212133', '#2f3147', '#43475f', '#5d627a']
FRAME = ['#3f3a3c', '#6b6360', '#958a7f', '#bcb09f', '#dad0bc', '#eee7d6', '#faf6ec']
GLASS = ['#0b0f20', '#121a31', '#1b2946', '#283b5e', '#3b5478', '#577496', '#86a3be', '#bfd3e0']
LACE = ['#5c5a66', '#8a8894', '#b3b1b9', '#d4d2d6', '#ebe8e6', '#f8f5ef']
PAPER = [['#1c1420', '#2c1f2a', '#3f2c34', '#553b3e', '#6e4d4a', '#8a6356'],
         ['#121a1e', '#1b262a', '#27363a', '#35494a', '#465e5b', '#5b766f'],
         ['#1e1a14', '#2e281d', '#433a28', '#5a4e34', '#746643', '#908055']]
OAK = ['#1d1117', '#36201f', '#54332a', '#734a36', '#946645', '#b38658', '#cfa671']
TEAK = ['#1a100c', '#2e1c14', '#46291b', '#5f3923', '#7a4b2d', '#966139', '#b07b4a']
PAINT = {'green': ['#07120e', '#0c1d17', '#132b21', '#1c3b2c', '#28503a', '#39674b', '#4f805e'],
         'oxblood': ['#170910', '#280f17', '#3d1520', '#551d27', '#702832', '#8d3840', '#aa4f4f'],
         'navy': ['#080b18', '#0e1428', '#161f3c', '#202d52', '#2e3f6c', '#435688', '#5e72a4'],
         'teal': ['#061414', '#0b2222', '#123434', '#1a4746', '#255e5b', '#357874', '#4d938c'],
         'mustard': ['#241a06', '#3d2c0c', '#5a4212', '#7a5b1a', '#9a7626', '#b99238', '#d4ae52'],
         'cream': ['#4f4538', '#7a6e5c', '#a39680', '#c7bba0', '#e1d6bb', '#f2e9d2', '#fdf7e6']}
SHUTTERS = [['#101816', '#18241f', '#223329', '#2e4435', '#3e5844', '#526f56', '#6c8a6c'],
            ['#0f1420', '#18202f', '#233044', '#304259', '#41576f', '#577087', '#7690a3'],
            ['#1e1410', '#30201a', '#472f24', '#613f2e', '#7c533a', '#976b49', '#b28a62']]
GILT = ['#3e2a10', '#644419', '#8f6727', '#b88e3e', '#dcb45e', '#f3d88a', '#fff2c0']
AWNINGS = [(['#2c0a14', '#4a101c', '#6c1823', '#91222b', '#b53338', '#d24c47', '#e8735e'],
            ['#4f4538', '#7a6e5c', '#a39680', '#c7bba0', '#e1d6bb', '#f2e9d2', '#fdf7e6']),
           (['#07120e', '#0c1d17', '#132b21', '#1c3b2c', '#28503a', '#39674b', '#4f805e'],
            ['#4f4538', '#7a6e5c', '#a39680', '#c7bba0', '#e1d6bb', '#f2e9d2', '#fdf7e6']),
           (['#080b18', '#0e1428', '#161f3c', '#202d52', '#2e3f6c', '#435688', '#5e72a4'],
            ['#4f4538', '#7a6e5c', '#a39680', '#c7bba0', '#e1d6bb', '#f2e9d2', '#fdf7e6']),
           (['#241a06', '#3d2c0c', '#5a4212', '#7a5b1a', '#9a7626', '#b99238', '#d4ae52'],
            ['#3a2a1a', '#5e452c', '#86653f', '#a88352', '#c7a268', '#dfbf86', '#f0d9a8'])]
TERRA = ['#2a1618', '#4a2320', '#6c3526', '#8e4a32', '#ab6444', '#c4825c', '#daa27c']
BRICK = ['#261522', '#4d2128', '#7a3130', '#9c4535', '#b85c41', '#d27d58', '#e8a27a']
LEAF = ['#0e2019', '#173a24', '#23552b', '#3a7431', '#5b943a', '#86b546']
FLOWER = ['#3a0a18', '#6e1226', '#a81c32', '#d8323e', '#f25a55', '#ff8f7a']
CARBOY = [['#2a0610', '#5a0c1c', '#8e1428', '#c41e32', '#ec4a4a', '#ff9a8a'],
          ['#041a14', '#0a3324', '#10523a', '#1a7a52', '#34a66e', '#8ee0a8']]
MARBLE = ['#2a2832', '#44424c', '#66646c', '#8f8c92', '#b6b3b5', '#d8d5d3', '#f0eeea']
BRASS = ['#3e2a10', '#6b4a1f', '#a07a34', '#d0aa55', '#f0d282']
GLOBE = ['#8a7e6a', '#c9bc98', '#efe2b8', '#fff6d8']
PIPE = ['#15151f', '#22232f', '#333542', '#474a58', '#5f6371', '#7c808c']
SOOT = ['#0b0a10', '#16131a', '#211c24']
RATTAN = ['#2a1c10', '#453018', '#654822', '#86622f', '#a67e40', '#c29c58', '#dbbb78']
TILEWORK = [['#0a1a2c', '#12304e', '#1d4c76', '#2e6a9c', '#4a8cbe', '#7cb2d8', '#b8d8ec'],
            ['#08201a', '#10382c', '#1a5642', '#27775a', '#3d9876', '#65b898', '#a0d8bc']]
LINEN = [['#5c5a66', '#8a8894', '#b3b1b9', '#d4d2d6', '#ebe8e6', '#f8f5ef'],
         ['#1a2a4a', '#27406c', '#355a90', '#4b78ad', '#6d98c6', '#98badc'],
         ['#4a1420', '#72202e', '#9a3040', '#be4654', '#d86a70', '#eca09c'],
         ['#4a3a10', '#72591a', '#9a7a28', '#bc9a3c', '#d6b85a', '#ecd48a']]
GOODS = [['#10301c', '#1f5a34', '#3a8a50'], ['#3a1a0a', '#7a3a12', '#c07028'],
         ['#2a2a40', '#50507a', '#9090c0'], ['#401010', '#902020', '#d05040'],
         ['#403010', '#907020', '#d8b040'], ['#303030', '#707070', '#c0c0b8']]
# Wrought iron between posts, bottom row last.
RAILS = {'scroll': ['.#...#.', '#.#.#.#', '#..#..#', '#..#..#', '#.#.#.#', '.#...#.'],
         'hoop': ['..###..', '.#...#.', '#.....#', '#.....#', '.#...#.', '..###..'],
         'bars': ['#.#.#.#', '#.#.#.#', '#.#.#.#', '#.#.#.#', '#.#.#.#', '#.#.#.#']}


class VoxelBuilding:
    """The frame every street building is built in. Subclasses set `ztop`
    and `build`; the rest is parts."""

    front = 0
    voxel = True

    def __init__(self, recipe, material):
        self.r = recipe
        self.seed = recipe.get('seed', 7)
        fw, fh = recipe['footprint']
        self.W, self.D = fw * 16, fh * 16
        self.stories = max(1, recipe.get('stories', 1))
        self.bays = max(1, recipe.get('bays', 1))
        self.facing = recipe.get('facing', 'south')
        self.street = self.facing == 'south'
        self.shops = self.street and recipe.get('modernRole', 'home') == 'shop'
        self.material = material
        wall = material.get('wall') if material else None
        self.wall_ramp = LIMESTONE if not wall or recipe.get('limestone') else ramp_from(wall[2])
        self.sign_paint = ['#1c3b2c', '#551d27', '#202d52'][self.seed % 3]
        self.state = {}

    def pick(self, options, salt=0):
        return options[(self.seed * 7 + salt * 13) % len(options)]

    def ztop(self):
        raise NotImplementedError

    def build(self):
        raise NotImplementedError

    # ------------------------------------------------------------ materials
    def materials(self):
        g = self.g
        weather = self.weather
        W = self.W

        def stone_tex(i):
            front = i['face'] == 1
            xs = np.clip(i['x'], 0, W - 1)
            zs = np.clip(i['z'], 0, weather.shape[1] - 1)
            return -weather[xs, zs] * front

        def louvre(i):
            return -1.0 * (i['z'] % 2 == 1)

        def checker(i):
            return np.where(((i['x'] // 3) + (i['y'] // 2)) % 2 == 0, 2.2, -2.4)

        def course(i):
            return -1.0 * (i['z'] % 4 == 0) - 0.6 * ((i['x'] + (i['z'] // 4) * 3) % 6 == 0)

        def tar_tex(i):
            return (h3(i['x'] // 5, i['y'] // 7, 3, self.seed) - 0.5) * 0.9 + 0.8 * (i['x'] % 23 == 0)

        def corrugated(i):
            u = i['x'] % 3
            return 1.0 * (u == 0) - 0.9 * (u == 2)

        def board(i):
            return -1.2 * (i['z'] % 5 == 0) + 0.6 * (i['z'] % 5 == 1)

        self.tex = {'stone': stone_tex, 'louvre': louvre, 'course': course, 'corrugated': corrugated,
                    'board': board}
        self.STONE = g.mat(self.wall_ramp, tex=stone_tex, bias=-0.35)
        self.ORN = g.mat(self.wall_ramp, tex=stone_tex, bias=-0.1)
        self.PLINTH = g.mat(PLINTH, bias=-0.2)
        self.GRANITE = g.mat(GRANITE, bias=0.2)
        self.IRON = g.mat(IRON, bias=0.1)
        self.FRAME = g.mat(FRAME, bias=-0.3)
        self.GLASS = g.mat(GLASS, glass=True)
        self.SKY = g.mat(GLASS, glass=True, bias=1.8)
        self.SHOPGLASS = g.mat(GLASS, glass=True, depth=30)
        self.PRISM = g.mat(['#1c2430', '#2e3c46', '#48585e', '#6a7a78', '#93a39a', '#bccab8', '#dfe8d6'], bias=0.2)
        self.CHROME = g.mat(['#2a2c36', '#565a66', '#8a90a0', '#c0c6d2', '#eef2f8'], bias=0.6)
        self.SHUT = g.mat(self.pick(SHUTTERS, 1), tex=louvre, bias=0.2)
        self.LACE = g.mat(LACE, bias=0.4)
        self.PAPER = [g.mat(p, bias=0.6) for p in PAPER]
        self.FLOOR = g.mat(OAK, bias=0.3)
        self.CHECK = g.mat(MARBLE, tex=checker, bias=0.4)
        self.MARBLE = g.mat(MARBLE, bias=0.5)
        self.OAK = g.mat(OAK, bias=-0.2)
        self.DOOR = g.mat(OAK, bias=-1.4)
        self.PAINT = {k: g.mat(v, bias=-0.3) for k, v in PAINT.items()}
        self.GILT = g.mat(GILT, bias=0.3)
        self.AWN = [[g.mat(a, bias=-0.2), g.mat(b, bias=-0.6)] for a, b in AWNINGS]
        self.TERRA = g.mat(TERRA, bias=-0.8)
        self.POT = g.mat(TERRA, bias=0.2)
        self.BRICK = g.mat(BRICK, tex=course)
        self.LEAF = g.mat(LEAF, bias=0.2)
        self.FLOWER = g.mat(FLOWER, bias=0.5)
        self.CARBOY = [g.mat(c, bias=0.6) for c in CARBOY]
        self.BRASS = g.mat(BRASS, bias=0.2)
        self.GLOBE = g.mat(GLOBE, bias=1.5, lamp=True)
        self.PIPE = g.mat(PIPE)
        self.SOOT = g.mat(SOOT)
        self.NAVY = g.mat(PAINT['navy'], bias=0.8)
        self.GOODS = [g.mat(b, bias=0.8) for b in GOODS]
        self.TAR = g.mat(TAR, tex=tar_tex, bias=-1.2)
        self.CONCRETE = g.mat(CONCRETE, bias=-0.6)
        self.TIN = g.mat(TIN, tex=corrugated, bias=-1.4)
        self.LINEN = [g.mat(c, bias=0.2) for c in LINEN]
        self.ZINC = g.mat(ZINC, bias=-1.6)

    # ------------------------------------------------------------ render
    def render(self, **state):
        self.state = state
        self.rng = random.Random(self.seed)
        self.windows, self.lamps, self.pots = [], [], []
        self.sign_band = None
        W, D = self.W, self.D
        zt = self.ztop()
        self.g = Grid(-8, W + 10, -26, D + 2, zt + 2)
        self.weather = np.zeros((W, zt + 2))
        self.sx0 = 8
        width = W + 18 + DRIFT
        height = int(zt + K * D) + 7
        self.base = height - 2
        self.materials()
        self.build()
        self.streaks()
        img, buf = render(self.g, width, height, self.sx0, self.base, D)
        self.buf = buf
        im = self.outline(Image.fromarray(img))
        self.im, self.w, self.h = im, width, height
        self.bottom = height - 3
        self.anchor_x = self.sx0 + W // 2
        self.occlusion = [0, 0, width, self.bottom - 1]
        self.glow = self.night(buf)
        self.smoke = [[self.sx0 + x + round(y * DRIFT / D), self.base - z - round(K * y), kind]
                      for x, y, z, kind in self.pots]
        return im

    def screen(self, x, y, z):
        """Sprite pixel of world voxel (x, y, z)'s front face."""
        return self.sx0 + x + round(y * DRIFT / self.D), self.base - 1 - z - round(K * y)

    def box(self, x0, x1, y0, y1, z0, z1, m, n=0):
        self.g.box(x0, x1, y0, y1, z0, z1, m, n)

    def cut(self, x0, x1, y0, y1, z0, z1):
        self.g.box(x0, x1, y0, y1, z0, z1, 0)

    def fill(self, *a, **k):
        self.g.fill(*a, **k)

    # ------------------------------------------------------------ interiors
    def rooms(self, f, h, x0=1, x1=None, y0=None, deep=30):
        """A papered room behind a four-voxel wall, floored, open to the front
        so windows cut into it look in."""
        x1 = self.W - 1 if x1 is None else x1
        y0 = self.front + 4 if y0 is None else y0
        paper = self.PAPER[(self.seed + f) % 3]
        self.box(x0, x1, y0, y0 + deep + 2, f, f + h, paper)
        self.box(x0, x1, y0, y0 + deep + 2, f, f + 1, self.FLOOR)
        self.cut(x0 + 1, x1 - 1, y0, y0 + deep, f + 1, f + h - 3)

    # ------------------------------------------------------------ openings
    def window(self, x0, x1, z0, z1, kind='casement', depth=3, shutters='reveal', curtains=0.7,
               storey=0, surround=True, sill=True, frame=None):
        """An opening with its joinery and what hangs in it. Returns its
        index in `self.windows`, which state keys use."""
        y = self.front
        rng = self.rng
        i = len(self.windows)
        roll, side, lace = rng.random(), rng.random(), rng.random()
        fr = frame or self.FRAME
        ax = (x0 + x1) // 2
        if surround:
            self.box(x0 - 2, x1 + 2, y - 1, y, z0 - 1, z1 + 2, self.ORN)
        if sill:
            self.box(x0 - 3, x1 + 3, y - 2, y, z0 - 2, z0, self.ORN)
        self.cut(x0, x1, y - 3, y + depth + 1, z0, z1)
        self.box(x0 - 1, x1 + 1, y, y + depth, z0 - 1, z0, self.ORN)
        gy = y + depth
        self.box(x0, x1, gy, gy + 1, z0, z1, self.GLASS)
        f0, f1 = gy - 1, gy + 1
        self.box(x0, x1, f0, f1, z0, z0 + 1, fr)
        self.box(x0, x1, f0, f1, z1 - 1, z1, fr)
        self.box(x0, x0 + 1, f0, f1, z0, z1, fr)
        self.box(x1 - 1, x1, f0, f1, z0, z1, fr)
        h = z1 - z0
        if kind == 'casement':
            self.box(ax - 1, ax + 1, f0, f1, z0, z1, fr)
            tr = z1 - max(6, h // 4)
            self.box(x0, x1, f0, f1, tr, tr + 1, fr)
            step = max(4, (tr - z0) // 3)
            for zz in range(z0 + step, tr - 2, step):
                self.box(x0, x1, gy, gy + 1, zz, zz + 1, fr)
        elif kind == 'sash':
            mid = z0 + h // 2
            self.box(x0, x1, f0, f1, mid, mid + 1, fr)
            self.box(ax, ax + 1, gy, gy + 1, z0, z1, fr)
        elif kind == 'steel':
            for zz in range(z0 + 4, z1 - 1, 4):
                self.box(x0, x1, gy, gy + 1, zz, zz + 1, fr)
            self.box(ax, ax + 1, gy, gy + 1, z0, z1, fr)
            self.box(x0, x1, f0, f1, z0 + (h * 2) // 3, z0 + (h * 2) // 3 + 1, fr)
        elif kind == 'chicago':
            third = max(4, (x1 - x0) // 4)
            for xx in (x0 + third, x1 - third - 1):
                self.box(xx, xx + 1, f0, f1, z0, z1, fr)
            self.box(x0, x0 + third, gy, gy + 1, z0 + h // 2, z0 + h // 2 + 1, fr)
            self.box(x1 - third, x1, gy, gy + 1, z0 + h // 2, z0 + h // 2 + 1, fr)
        elif kind == 'fanlight':
            tr = z1 - 6
            self.box(x0, x1, f0, f1, tr, tr + 1, fr)
            self.box(ax, ax + 1, f0, f1, z0, tr, fr)
            for k in range(-2, 3):
                self.box(ax + k * 2, ax + k * 2 + 1, gy, gy + 1, tr + 1, z1 - 1, fr)
        record = {'i': i, 'x0': x0, 'x1': x1, 'z0': z0, 'z1': z1, 'y': gy, 'storey': storey}
        self.windows.append(record)
        shut = self.state.get('shut', {}).get(i)
        if shutters == 'reveal':
            closed = 'both' if roll < 0.2 else ('left' if side < 0.5 else 'right') if roll < 0.42 else None
            if shut is not None:
                closed = shut
            if closed in ('both', 'left'):
                self.box(x0, ax + (1 if closed == 'both' else 0), y + 1, y + 2, z0, z1, self.SHUT)
            if closed in ('both', 'right'):
                self.box(ax, x1, y + 1, y + 2, z0, z1, self.SHUT)
            if closed == 'both':
                self.box(ax, ax + 1, y + 1, y + 2, z0, z1, fr)
            record['closed'] = closed
        elif shutters == 'hinged':
            # Louvred leaves folded back flat against the wall either side, or
            # swung shut across the opening.
            closed = roll < 0.25 if shut is None else shut == 'both'
            leaf = (x1 - x0 + 1) // 2
            if closed:
                self.box(x0, x1, y - 1, y, z0, z1, self.SHUT)
                self.box(ax, ax + 1, y - 1, y, z0, z1, fr)
            else:
                self.box(x0 - 2 - leaf, x0 - 2, y - 1, y, z0, z1, self.SHUT)
                self.box(x1 + 2, x1 + 2 + leaf, y - 1, y, z0, z1, self.SHUT)
            record['closed'] = 'both' if closed else None
        if not record.get('closed') and lace < curtains:
            tie = z0 + h // 3
            for zz in range(z0, z1 - 3):
                spread = 3 if zz > tie else 2
                self.box(x0 + 1, x0 + 1 + spread, gy + 1, gy + 2, zz, zz + 1, self.LACE)
                self.box(x1 - 1 - spread, x1 - 1, gy + 1, gy + 2, zz, zz + 1, self.LACE)
        return i

    def railing(self, x0, x1, y, z0, h, pattern='scroll', along_y=False, m=None):
        m = m or self.IRON
        if along_y:
            self.box(x0, x1, y, self.front, z0 + h - 1, z0 + h, m)
            for yy in range(y, self.front, 2):
                self.box(x0, x1, yy, yy + 1, z0, z0 + h, m)
            return
        if pattern == 'pipe':
            # Streamline tube rails, three of them, on thin standards.
            for zz in (z0 + h - 1, z0 + h - 4, z0 + h - 7):
                self.box(x0, x1, y, y + 1, zz, zz + 1, m)
            for x in range(x0, x1, 10):
                self.box(x, x + 1, y, y + 1, z0, z0 + h, m)
            return
        rows = RAILS[pattern]
        ph = len(rows)
        self.box(x0, x1, y - 1, y + 1, z0 + h - 1, z0 + h, m)
        self.box(x0, x1, y, y + 1, z0 + h - 2, z0 + h - 1, m)
        self.box(x0, x1, y, y + 1, z0, z0 + 1, m)
        for x in range(x0, x1):
            u = (x - x0) % 8
            if u == 0:
                self.box(x, x + 1, y, y + 1, z0, z0 + h, m)
                continue
            for v in range(ph):
                zz = z0 + 1 + (h - 3 - ph) // 2 + v
                if rows[ph - 1 - v][u - 1] == '#':
                    self.box(x, x + 1, y, y + 1, zz, zz + 1, m)

    def flowers(self, x0, x1, y0, y1, z, n=None, rng=None):
        rng = rng or self.rng
        self.box(x0, x1, y0, y1, z, z + 3, self.TERRA)
        for _ in range(n or (x1 - x0) * 4):
            x = rng.randint(x0, x1 - 1)
            y = rng.randint(y0, y1 - 1)
            zz = z + 3 + rng.randint(0, 3)
            self.box(x, x + 1, y, y + 1, zz, zz + 1, self.FLOWER if rng.random() < 0.3 else self.LEAF)

    def potted(self, x, y, z, tall=10, rng=None):
        rng = rng or self.rng
        self.box(x, x + 4, y, y + 3, z, z + 4, self.POT)
        for _ in range(tall * 3):
            dx, dy = rng.randint(-2, 5), rng.randint(-1, 3)
            zz = z + 4 + rng.randint(0, tall)
            if abs(dx - 1.5) <= 2.5 + (zz - z) * 0.2:
                self.box(x + dx, x + dx + 1, y + dy, y + dy + 1, zz, zz + 1, self.LEAF)

    # ------------------------------------------------------------ the street
    def shopfront(self, x0, x1, paint, stock='grocer', top=None, awning=None, door='right', transom=False,
                  trim=None):
        """A shop let into the ground floor: interior and stock, plate glass
        on slim bars over a riser, a door, and the sign board the scene
        letters. Returns the board's sprite rect."""
        P = self.PAINT[paint]
        f = self.front
        top = GROUND - 18 if top is None else top
        self.cut(x0, x1, f, f + 6, 3, top)
        self.box(x0, x1, f + 6, f + 34, 1, 3, self.CHECK if stock == 'cafe' else self.FLOOR)
        self.cut(x0 + 1, x1 - 1, f + 6, f + 30, 3, top)
        self.box(x0, x1, f + 30, f + 32, 3, top, P)
        self.stock(x0, x1, f, top, stock)
        for lx in range(x0 + 8, x1 - 6, 16):
            self.box(lx + 1, lx + 2, f + 11, f + 12, top - 7, top - 1, self.BRASS)
            self.box(lx, lx + 3, f + 10, f + 13, top - 11, top - 7, self.GLOBE)
        self.box(x0, x1, f + 5, f + 6, 11, top - 1, self.SHOPGLASS)
        for bx in range(x0 + 3, x1 - 3, 12)[1:]:
            self.box(bx, bx + 1, f + 4, f + 6, 11, top - 1, P)
        if transom:
            # A band of small lights over the display, prism glass that
            # throws daylight to the back of the shop.
            self.box(x0, x1, f + 4, f + 6, top - 9, top - 8, P)
            self.box(x0 + 1, x1 - 1, f + 5, f + 6, top - 8, top - 2, self.PRISM)
            for bx in range(x0 + 3, x1 - 2, 3):
                self.box(bx, bx + 1, f + 5, f + 6, top - 8, top - 2, P)
        self.box(x0, x1, f + 4, f + 6, 3, 11, P)
        self.box(x0 + 2, x1 - 2, f + 3, f + 4, 5, 10, P)
        self.box(x0, x1, f + 4, f + 6, top - 2, top, P)
        if door:
            dx = x1 - 13 if door == 'right' else x0 + 3 if door == 'left' else (x0 + x1) // 2 - 5
            self.cut(dx, dx + 10, f + 3, f + 7, 3, top - 2)
            self.box(dx, dx + 10, f + 6, f + 7, 3, top - 2, P)
            self.box(dx + 1, dx + 9, f + 5, f + 6, 14, top - 4, self.SHOPGLASS)
            self.box(dx + 1, dx + 9, f + 5, f + 6, 4, 13, P)
            self.box(dx + 7, dx + 8, f + 4, f + 5, 18, 20, self.BRASS)
            self.shop_door = self.sx0 + dx + 5
        for px in (x0, x1 - 3):
            self.box(px, px + 3, f - 1, f + 2, 3, top, P)
            self.box(px - 1, px + 4, f - 2, f + 2, top - 3, top, P)
        # The board: lipped, a gilt rule inside each lip, six clear rows
        # between for the lettering the scene paints on.
        bt = top + 11
        self.box(x0 - 1, x1 + 1, f - 2, f + 1, top, bt, P)
        self.box(x0 - 2, x1 + 2, f - 3, f + 1, top, top + 1, P)
        self.box(x0 - 2, x1 + 2, f - 3, f + 1, bt - 1, bt, P)
        rule = trim or self.GILT
        self.box(x0 + 1, x1 - 1, f - 3, f - 2, top + 1, top + 2, rule)
        self.box(x0 + 1, x1 - 1, f - 3, f - 2, bt - 2, bt - 1, rule)
        band = [self.sx0 + x0 + 2, self.base - (bt - 3) - round(K * f), x1 - x0 - 4, 6]
        if awning is not None and not self.state.get('awnings_up'):
            self.awning(x0 + 1, x1 - 1, top, self.AWN[awning])
        elif awning is not None:
            # Rolled up into its box under the board.
            self.box(x0 + 1, x1 - 1, f - 3, f, top - 3, top, self.AWN[awning][0])
        return band

    def stock(self, x0, x1, f, top, kind):
        rng = random.Random(self.seed + x0)
        shelf = self.OAK
        for sz in range(16, top - 6, 6):
            self.box(x0 + 2, x1 - 2, f + 28, f + 30, sz, sz + 1, shelf)
            for x in range(x0 + 3, x1 - 3, 2):
                if rng.random() < 0.8:
                    self.box(x, x + 1, f + 27, f + 28, sz + 1, sz + 2 + rng.randint(1, 3), rng.choice(self.GOODS))
        self.box(x0 + 4, x1 - 4, f + 22, f + 25, 3, 13, self.OAK)
        self.box(x0 + 3, x1 - 3, f + 21, f + 25, 13, 14, self.MARBLE if kind == 'cafe' else self.OAK)
        if kind == 'cafe':
            for tx in range(x0 + 6, x1 - 6, 11):
                self.box(tx + 2, tx + 3, f + 9, f + 10, 3, 12, self.IRON)
                self.box(tx, tx + 5, f + 8, f + 11, 12, 13, self.MARBLE)
                self.box(tx - 3, tx - 1, f + 9, f + 10, 3, 11, self.OAK)
                self.box(tx - 3, tx - 2, f + 9, f + 10, 11, 16, self.OAK)
        elif kind == 'pharmacy':
            for k, cx in enumerate((x0 + 6, x1 - 7)):
                self.box(cx, cx + 1, f + 8, f + 9, 11, 16, self.BRASS)
                self.fill(cx - 3, cx + 4, f + 6, f + 12, 16, 23,
                          lambda X, Y, Z, cx=cx: (X - cx) ** 2 + ((Y - f - 8.5) * 1.3) ** 2 + (Z - 19) ** 2 <= 10,
                          self.CARBOY[k])
        elif kind == 'grocer':
            # Tiers of produce in crates just behind the glass.
            for k, zz in enumerate((11, 15, 19)):
                yy = f + 7 + k * 2
                self.box(x0 + 2, x1 - 2, yy, yy + 2, zz - 1, zz, self.OAK)
                for x in range(x0 + 2, x1 - 2):
                    if rng.random() < 0.85:
                        c = self.GOODS[(x // 5 + k) % 5]
                        self.box(x, x + 1, yy, yy + 2, zz, zz + 1 + (x % 2), c)
        elif kind == 'draper':
            # Bolts of cloth stood on end in the window.
            for x in range(x0 + 3, x1 - 3, 3):
                c = self.LINEN[rng.randrange(4)]
                self.box(x, x + 2, f + 8, f + 10, 11, 11 + rng.randint(8, 14), c)
        elif kind == 'hardware':
            for x in range(x0 + 4, x1 - 4, 6):
                self.box(x, x + 4, f + 8, f + 11, 11, 11 + rng.randint(3, 7), rng.choice(self.GOODS[3:]))
                self.box(x + 1, x + 2, f + 7, f + 8, 20, 30, self.IRON)

    def awning(self, x0, x1, z, stripes, reach=14, drop=6):
        n = self.g.normal((0, -drop / reach, 1))
        f = self.front
        for x in range(x0, x1):
            m = stripes[((x - x0) // 4) % 2]
            self.fill(x, x + 1, f - reach, f + 1, z - drop - 3, z + 1,
                      lambda X, Y, Z: (Z <= z + (Y - f) * drop / reach) & (Z >= z + (Y - f) * drop / reach - 1.5),
                      m, n)
            k = (x - x0) % 6
            d = 4 if k in (1, 2, 3, 4) else 3
            self.box(x, x + 1, f - reach, f - reach + 1, z - drop - d + 3, z - drop, m)
        for x in (x0, x1 - 1):
            self.fill(x, x + 1, f - reach, f, z - 14, z,
                      lambda X, Y, Z: np.abs(Z - (z - 13 - (Y - f) * 7 / reach)) < 0.8, self.IRON)

    def canopy(self, x0, x1, z, reach=12, m=None, rods=True, lamps=False):
        """A flat canopy cantilevered over the pavement, hung from the wall on
        tie rods, its fascia a lip at the front."""
        m = m or self.PAINT['green']
        f = self.front
        self.box(x0, x1, f - reach, f, z, z + 2, m)
        self.box(x0, x1, f - reach, f - reach + 1, z - 1, z + 3, m)
        if rods:
            for x in range(x0 + 2, x1 - 1, 16):
                self.fill(x, x + 1, f - reach, f, z + 2, z + 14,
                          lambda X, Y, Z: np.abs(Z - (z + 2 + (Y - f + reach) * 12 / reach)) < 0.8, self.IRON)
        if lamps:
            for x in range(x0 + 6, x1 - 4, 12):
                self.box(x, x + 2, f - reach // 2, f - reach // 2 + 2, z - 1, z, self.GLOBE)
                self.lamps.append((x, f - reach // 2, z - 1))

    def lantern(self, x, z, reach=5):
        f = self.front
        self.box(x, x + 1, f - reach, f, z + 8, z + 9, self.IRON)
        self.box(x - 1, x + 2, f - reach - 1, f - reach + 2, z, z + 1, self.IRON)
        self.box(x - 1, x + 2, f - reach - 1, f - reach + 2, z + 1, z + 6, self.GLOBE)
        self.box(x - 2, x + 3, f - reach - 2, f - reach + 3, z + 6, z + 7, self.IRON)
        self.box(x, x + 1, f - reach, f - reach + 1, z + 7, z + 9, self.IRON)
        self.lamps.append((x, f - reach, z + 3))

    def pipe(self, x, z1, z0=1):
        f = self.front
        self.box(x, x + 2, f - 2, f, z0, z1, self.PIPE)
        self.box(x - 1, x + 3, f - 3, f, z1 - 6, z1, self.PIPE)
        for z in range(z0 + 19, z1 - 6, 30):
            self.box(x - 1, x + 3, f - 3, f, z, z + 1, self.PIPE)
        self.box(x - 1, x + 3, f - 3, f, z0, z0 + 2, self.PIPE)

    # ------------------------------------------------------------ the roof
    def tank(self, x, y, z, w=12, d=10, h=10, legs=6):
        """A galvanised or timber water tank on a steel stand."""
        for lx in (x, x + w - 1):
            for ly in (y, y + d - 1):
                self.box(lx, lx + 1, ly, ly + 1, z, z + legs, self.IRON)
        self.box(x, x + w, y, y + d, z + legs - 1, z + legs, self.IRON)
        cx, cy, r = x + w / 2, y + d / 2, min(w, d) / 2
        self.fill(x, x + w, y, y + d, z + legs, z + legs + h,
                  lambda X, Y, Z: ((X + 0.5 - cx) ** 2 + ((Y + 0.5 - cy) * w / d) ** 2) <= r * r, self.TIN)
        self.fill(x - 1, x + w + 1, y - 1, y + d + 1, z + legs + h, z + legs + h + 3,
                  lambda X, Y, Z: ((X + 0.5 - cx) ** 2 + ((Y + 0.5 - cy) * w / d) ** 2)
                  <= (r + 0.5 - (Z - z - legs - h) * 1.6) ** 2, self.ZINC)

    def stairhead(self, x, y, z, w=16, d=14, h=14):
        self.box(x, x + w, y, y + d, z, z + h, self.STONE)
        self.box(x - 1, x + w + 1, y - 1, y + d + 1, z + h, z + h + 2, self.ORN)
        self.box(x + 3, x + 10, y - 1, y, z, z + 10, self.DOOR)
        self.box(x + 8, x + 9, y - 2, y - 1, z + 4, z + 6, self.BRASS)

    def laundry(self, x0, x1, y, z, rng=None):
        """A line between two posts and what is pegged on it."""
        rng = rng or self.rng
        for x in (x0, x1 - 1):
            self.box(x, x + 1, y, y + 1, z, z + 14, self.PIPE)
        self.box(x0, x1, y, y + 1, z + 13, z + 14, self.PIPE)
        x = x0 + 2
        while x < x1 - 4:
            w = rng.randint(3, 6)
            if x + w > x1 - 2:
                break
            if rng.random() < 0.8:
                c = rng.choice(self.LINEN)
                self.box(x, x + w, y, y + 1, z + 13 - rng.randint(4, 8), z + 13, c)
            x += w + 1

    def chimney(self, x, y, z, w=6, d=6, h=12, pots=1, m=None):
        m = m or self.BRICK
        self.box(x, x + w, y, y + d, z, z + h, m)
        self.box(x - 1, x + w + 1, y - 1, y + d + 1, z + h, z + h + 1, self.STONE)
        for k in range(pots):
            px = x + 1 + k * 3
            self.box(px, px + 2, y + 2, y + 4, z + h + 1, z + h + 5, self.TERRA)
            self.pots.append((px + 1, y + 3, z + h + 5, 'chimney'))

    # ------------------------------------------------------------ output
    def streaks(self):
        """Rain runs down from each sill and grime gathers at the foot."""
        rng = random.Random(self.seed + 11)
        w = self.weather
        for win in self.windows:
            for x in range(win['x0'] - 2, win['x1'] + 2):
                if 0 <= x < self.W and rng.random() < 0.45:
                    n = rng.randint(4, 16)
                    w[x, max(0, win['z0'] - 3 - n):max(0, win['z0'] - 3)] = 1
        w[:, 0:9] = np.maximum(w[:, 0:9], (np.arange(self.W)[:, None] * 7 % 5 < 2) * 1.0)

    def outline(self, im):
        a = np.array(im)
        alpha = a[..., 3] > 0
        ink = np.array([18, 12, 28])
        out = a.copy()
        h, w = alpha.shape
        pad = np.pad(alpha, 1)
        dark = alpha & (~pad[1:-1, 2:] | ~pad[2:, 1:-1])
        lit = alpha & (~pad[1:-1, :-2] | ~pad[:-2, 1:-1]) & ~dark
        out[dark, :3] = (a[dark, :3] * 0.3 + ink * 0.7).astype(np.uint8)
        out[lit, :3] = (a[lit, :3] * 0.6 + ink * 0.4).astype(np.uint8)
        img = Image.fromarray(out)
        for x in range(self.sx0, self.sx0 + self.W + DRIFT):
            img.putpixel((x, h - 2), (30, 34, 26, 150))
        return img

    def night(self, buf):
        """Rooms lit after dark, a window at a time, and every lamp."""
        h, w = buf['glass'].shape
        glow = np.zeros((h, w, 4), np.uint8)
        lamp = np.isin(buf['mat'], [i for i, m in enumerate(self.g.mats) if m and m.lamp])
        rng = random.Random(self.seed + 5)
        lit = [rng.random() < 0.55 for _ in self.windows]
        panes = buf['gmat'] == self.GLASS
        for win, on in zip(self.windows, lit):
            win['lit'] = on
            if not on:
                continue
            x0, y0 = self.screen(win['x0'], win['y'], win['z1'] - 1)
            x1, y1 = self.screen(win['x1'] - 1, win['y'], win['z0'])
            box = panes[y0 - 1:y1 + 2, x0 - 1:x1 + 2]
            ys, xs = np.nonzero(box)
            for yy, xx in zip(ys + y0 - 1, xs + x0 - 1):
                glow[yy, xx] = (255, 200, 110, 230) if (xx + yy) % 5 else (255, 226, 160, 240)
        glow[buf['gmat'] == self.SHOPGLASS] = (255, 214, 140, 235)
        glow[lamp] = (255, 238, 180, 255)
        return Image.fromarray(glow)
