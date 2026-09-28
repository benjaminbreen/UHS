"""The American infill kit built in voxels: the houses and the roadside strip.

    .venv/bin/python scripts/art/city_roadside.py artifacts/gold/roadside.png

Small lots, so small buildings: the ranch house, the craftsman bungalow, the
Cape Cod cottage and the two-family house with stacked porches; the corner
store, gas station, donut shop, stainless diner, drugstore, laundromat,
market, cafe, clinic, motel, garage and grocery of an American street from
the twenties to the nineties. The recipe's `business` picks the design; its
wall material colours the render and its variant the trim.
"""
from pathlib import Path
import random
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.voxel import h3, ramp_from  # noqa: E402
from art.voxel_kit import BRICK, CONCRETE, VoxelBuilding  # noqa: E402

SHINGLES = [['#141418', '#1f1f26', '#2c2c35', '#3b3b46', '#4c4c58', '#5f5f6b', '#75757f'],
            ['#1c1310', '#2c1d17', '#3e2920', '#52362a', '#674536', '#7d5846', '#946c58'],
            ['#101a16', '#18261f', '#22352b', '#2e4638', '#3c5947', '#4d6d58', '#62836c']]
SIDING = ['#e8e4d8', '#c9d8d0', '#e6d8b0', '#c8d2dc', '#e0c8b8', '#d8d0c0']
TRIMS = ['#f2efe6', '#2e4a3a', '#7a2a2a', '#26344e', '#f2efe6', '#5a4a3a']
STEEL = ['#2a2e36', '#4a505c', '#6e7684', '#98a0ac', '#c2c8d0', '#e4e8ec', '#f8fafc']
ENAMEL = [['#3a0a10', '#6a1018', '#9a1a22', '#c82a2e', '#e84c44'], ['#081a3a', '#10306a', '#1c4a9a', '#2e66c4', '#5288e0'],
          ['#0a2a22', '#12483a', '#1c6a54', '#2c8c70', '#4cae8c'], ['#3a2a06', '#6a4c0e', '#9a7218', '#c89a28', '#e8c04a']]
DOUGH = ['#3a2210', '#6a4020', '#9a6030', '#c48448', '#e0a868', '#f4cc92']
ICING = ['#4a1830', '#7a2848', '#b0406a', '#e060a0', '#f898c8', '#ffd0e8']
CAR = [['#2a0a0a', '#5a1414', '#8a2020', '#b83028', '#e04a3a'], ['#0a1a2a', '#14304e', '#1e4a78', '#2e66a0', '#5088c4'],
       ['#1a2a1a', '#2a4a2a', '#3c6a3c', '#529052', '#78b478']]
RUBBER = ['#0c0c10', '#16161c', '#222228', '#303038']
BUN = ['#4a2410', '#7a4018', '#b06a28', '#d8943c', '#f0bc62', '#fcdc96']
PATTY = ['#1c0e0a', '#341a10', '#4e2a18', '#6a3c22']
CHEESE = ['#6a4a06', '#b08a10', '#e8bc20', '#fce060']
LETTUCE = ['#10300c', '#1e5214', '#347a20', '#56a830']
WAFFLE = ['#4a2c10', '#7a4c1e', '#a8702e', '#cc9448', '#e8b868']
SCOOPS = [['#5a1a30', '#9a3050', '#d45a80', '#f890b0', '#ffc8d8'], ['#2a1408', '#4a2410', '#6a3818', '#8a5028', '#a86c40'],
          ['#1a4a34', '#2a7050', '#48a078', '#78c8a0', '#b0e8cc']]
VINYL = ['#060608', '#0e0e12', '#18181e', '#26262e', '#3a3a46']
BALL = ['#6a6860', '#a8a498', '#d8d4c8', '#f4f2ea', '#ffffff']
BASKET = ['#4a1a06', '#8a360c', '#c85a18', '#ec8030', '#ffa858']
CHAIR = ['#2a0608', '#5a0c12', '#8a141c', '#b82028', '#e04040']


class Roadside(VoxelBuilding):

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.business = recipe.get('business', 'residential')
        self.variant = int(recipe.get('variant', 0))
        # Every design here carries its own identity whichever way the lot
        # faces; only the door moves.
        self.shops = self.business != 'residential' and self.business != 'residential duplex'
        self.street = True

    def ztop(self):
        return 128

    def materials(self):
        super().materials()
        g = self.g
        v = self.variant
        siding = ramp_from(SIDING[(v + self.seed) % len(SIDING)])
        self.SIDING = g.mat(siding, tex=self.tex['board'], bias=-0.4)
        self.TRIM = g.mat(ramp_from(TRIMS[v % len(TRIMS)]), bias=-0.2)
        self.SHINGLE = g.mat(SHINGLES[(v + self.seed) % 3], bias=-0.7,
                             tex=lambda i: -1.0 * (i['z'] % 3 == 0) + (h3(i['x'] // 4, i['z'] // 3, 1, self.seed) - 0.5) * 0.6)
        self.BRICKW = g.mat(BRICK, tex=self.tex['course'], bias=-0.4)
        self.STEEL = g.mat(STEEL, bias=-0.3, tex=lambda i: 1.0 * (i['z'] % 3 == 0) - 0.6 * (i['z'] % 3 == 2))
        self.ENAMEL = g.mat(ENAMEL[v % len(ENAMEL)], bias=0.2)
        self.WHITE = g.mat(ramp_from('#ecebe4'), bias=-0.2)
        self.FELT = g.mat(['#2a2830', '#3a3740', '#4d4a52', '#625e65', '#78737a', '#8f898e', '#a9a2a5'], bias=-1.0)
        self.GLASSBLOCK = g.mat(['#2c3a40', '#46585c', '#63797a', '#86a09c', '#a9c4bd', '#cae2d8', '#e8f6ee'], bias=0.1,
                                tex=lambda i: -1.0 * ((i['x'] % 3 == 0) | (i['z'] % 3 == 0)))
        self.DOUGH = g.mat(DOUGH, bias=0.1)
        self.ICING = g.mat(ICING, bias=0.2)
        self.RUBBER = g.mat(RUBBER)
        self.CARS = [g.mat(c, bias=0.3) for c in CAR]
        self.NEON = g.mat(['#6a1020', '#c0203a', '#ff4a5a', '#ff9aa0'], bias=1.5, lamp=True)
        self.SHRUB = g.mat(['#0e2019', '#173a24', '#23552b', '#2f6a30', '#3f7f36'], bias=0.1,
                           tex=lambda i: (h3(i['x'], i['y'], i['z'], 5) - 0.5) * 1.6)
        self.CONCRETE = g.mat(CONCRETE, bias=-0.4)
        self.BUN = g.mat(BUN, bias=0.1)
        self.PATTY = g.mat(PATTY, bias=0.2)
        self.CHEESE = g.mat(CHEESE, bias=0.4)
        self.LETTUCE = g.mat(LETTUCE, bias=0.4)
        self.WAFFLE = g.mat(WAFFLE, bias=0.2, tex=lambda i: -1.0 * (((i['x'] + i['z']) % 4 == 0) | ((i['x'] - i['z']) % 4 == 0)))
        self.SCOOPS = [g.mat(c, bias=0.3) for c in SCOOPS]
        self.VINYL = g.mat(VINYL, bias=0.4, tex=lambda i: 1.0 * ((i['x'] * 7 + i['z'] * 3) % 11 == 0))
        self.BALL = g.mat(BALL, bias=-0.2)
        self.BASKET = g.mat(BASKET, bias=0.2)
        self.CHAIR = g.mat(CHAIR, bias=0.3)
        self.RED = g.mat(['#3a0608', '#7a0e14', '#b81c22', '#e8383a', '#ff7068'], bias=0.3)
        self.CHECKCLOTH = g.mat(['#3a0608', '#7a0e14', '#b81c22', '#e8383a', '#ff7068'], bias=0.3,
                                tex=lambda i: np.where(((i['x'] // 2) + (i['y'] // 2)) % 2 == 0, 3.0, 0))
        self.OVEN = g.mat(['#6a1a04', '#b83a08', '#f07018', '#ffb040'], bias=1.5, lamp=True)
        self.BLUE = g.mat(['#060e2a', '#0e1e56', '#1a3290', '#2e50c0', '#5c80e8'], bias=0.3)

    def life(self):
        rng = random.Random(self.seed + 71)
        specs = []
        if not self.shops:
            leaners = self.leaners(2, rng)
            specs += [self.lean_out(w, rng) for w in leaners[:1]] + [self.curtain_twitch(w) for w in leaners[1:]]
        elif self.business not in ('motel', 'gas station', 'auto workshop', 'tire shop', 'burger drive-in'):
            specs += self.shop_life()
        if self.business == 'barber shop':
            specs.append({'k': 'loop', 'states': [{'spin': p} for p in range(4)], 'ms': 160})
        if self.business == 'motel':
            specs.append({'k': 'loop', 'states': [{'neon': p} for p in range(4)], 'ms': 180, 'night': True})
            leaners = self.leaners(1, rng)
            specs += [self.curtain_twitch(w) for w in leaners]
        return specs

    def build(self):
        getattr(self, {
            'residential': 'home', 'residential duplex': 'duplex', 'corner store': 'store',
            'gas station': 'gas', 'donut shop': 'donuts', 'diner': 'diner', 'pharmacy': 'drugstore',
            'laundromat': 'laundromat', 'neighborhood market': 'market', 'cafe': 'cafe', 'clinic': 'clinic',
            'motel': 'motel', 'auto workshop': 'garage', 'grocery': 'grocery',
            'burger drive-in': 'burgers', 'ice cream stand': 'ice_cream', 'music shop': 'music',
            'sporting goods': 'sports', 'tire shop': 'tires', 'barber shop': 'barber', 'pizzeria': 'pizzeria',
        }.get(self.business, 'store'))()

    # ------------------------------------------------------------ parts
    def roof(self, x0, x1, y0, y1, z, pitch, kind='hip', over=3, m=None):
        """Hip, side gable (ridge along the street) or front gable, shingled,
        with its overhang; gable ends are filled with the wall behind."""
        m = m or self.SHINGLE
        X0, X1, Y0, Y1 = x0 - over, x1 + over, y0 - over, y1 + over
        faces = {
            'front': (0, -1), 'back': (0, 1), 'left': (-1, 0), 'right': (1, 0)}
        dist = {'front': lambda X, Y: Y + 0.5 - Y0, 'back': lambda X, Y: Y1 - Y - 0.5,
                'left': lambda X, Y: X + 0.5 - X0, 'right': lambda X, Y: X1 - X - 0.5}
        use = {'hip': list(faces), 'side': ['front', 'back'], 'front': ['left', 'right']}[kind]
        h = lambda X, Y: np.minimum.reduce([dist[f](X, Y) for f in use]) * pitch
        rise = int(min((X1 - X0) if kind != 'side' else 999, (Y1 - Y0) if kind != 'front' else 999) / 2 * pitch) + 2
        for f in use:
            dx, dy = faces[f]
            n = self.g.normal((dx * pitch, dy * pitch, 1))
            others = [o for o in use if o != f]
            self.fill(X0, X1, Y0, Y1, z, z + rise + 1,
                      lambda X, Y, Z, f=f, others=others: (Z < z + h(X, Y))
                      & np.logical_and.reduce([dist[f](X, Y) <= dist[o](X, Y) for o in others]), m, n)
        if kind == 'side':
            for x in (x0, x1 - 1):
                self.fill(x, x + 1, y0, y1, z, z + rise,
                          lambda X, Y, Z: Z < z + np.minimum(Y + 0.5 - Y0, Y1 - Y - 0.5) * pitch - 1.5, self.wallm)
        if kind == 'front':
            self.fill(x0, x1, y0, y0 + 1, z, z + rise,
                      lambda X, Y, Z: Z < z + np.minimum(X + 0.5 - X0, X1 - X - 0.5) * pitch - 1.5, self.wallm)
        return rise

    def shrubs(self, x0, x1, y=-4):
        rng = random.Random(self.seed + x0)
        for x in range(x0, x1 - 3, 5):
            r = rng.uniform(2.2, 3.4)
            cx = x + 2.5
            self.fill(x, x + 6, y - 1, y + 5, 0, 8,
                      lambda X, Y, Z, cx=cx, r=r: (X + 0.5 - cx) ** 2 + (Y + 0.5 - y - 2) ** 2 + ((Z - 2) * 1.2) ** 2 <= r * r,
                      self.SHRUB)

    def stoop(self, x0, x1, h=4, depth=6):
        for k in range(h // 2):
            self.box(x0, x1, -depth + k * 2, 0, 0, (k + 1) * 2, self.CONCRETE)

    def plain_door(self, ax, z=0, m=None, glass=True):
        m = m or self.TRIM
        self.box(ax - 7, ax + 7, -1, 0, z, z + 32, self.TRIM)
        self.cut(ax - 5, ax + 5, -1, 3, z, z + 29)
        self.box(ax - 5, ax + 5, 3, 4, z, z + 29, self.PAINT[self.pick(['oxblood', 'navy', 'green', 'teal'], 4)])
        if glass:
            self.box(ax - 3, ax + 3, 2, 3, z + 18, z + 26, self.GLASS)
        self.box(ax + 3, ax + 4, 2, 3, z + 13, z + 15, self.BRASS)
        self.door_x = self.sx0 + ax

    def flat_top(self, t, parapet=6, wall=None, sign=False):
        W, D = self.W, self.D
        wall = wall or self.wallm
        self.box(2, W - 2, 2, D - 2, t - 1, t, self.FELT)
        for x0, x1, y0, y1 in ((0, W, 0, 2), (0, W, D - 2, D), (0, 2, 0, D), (W - 2, W, 0, D)):
            self.box(x0, x1, y0, y1, t, t + parapet, wall)
        self.box(-1, W + 1, -1, 3, t + parapet, t + parapet + 1, self.TRIM)
        for x0, x1, y0, y1 in ((-1, W + 1, D - 3, D), (-1, 3, 0, D), (W - 3, W + 1, 0, D)):
            self.box(x0, x1, y0, y1, t + parapet, t + parapet + 1, self.TRIM)
        rng = random.Random(self.seed + 13)
        if W >= 64 and D >= 48:
            # What stands on a shop roof: a condenser, a vent, a hatch.
            x = int(W * 0.6)
            self.box(x, x + 12, D // 2, D // 2 + 10, t, t + 8, self.STEEL)
            self.fill(x + 2, x + 10, D // 2 + 1, D // 2 + 9, t + 8, t + 9,
                      lambda X, Y, Z: (X + 0.5 - x - 6) ** 2 + (Y + 0.5 - D // 2 - 5) ** 2 <= 12, self.IRON)
            self.box(int(W * 0.25), int(W * 0.25) + 8, D - 18, D - 10, t, t + 3, self.STEEL)
            vx = 8 + rng.randint(0, 10)
            self.box(vx, vx + 2, D // 2, D // 2 + 2, t, t + 7, self.PIPE)
        if sign:
            # A sign board standing on the front parapet, lettered at runtime.
            self.box(4, W - 4, -1, 1, t + parapet - 2, t + parapet + 9, self.ENAMEL)
            self.box(3, W - 3, -2, 1, t + parapet + 9, t + parapet + 10, self.WHITE)
            self.box(3, W - 3, -2, 1, t + parapet - 3, t + parapet - 2, self.WHITE)
            self.sign_band = [self.sx0 + 5, self.base - (t + parapet + 8) - 1, W - 10, 6]

    def storefront(self, x0, x1, z0, z1, frame=None, depth=3):
        fr = frame or self.TRIM
        f = self.front
        self.shops_x.append((x0, x1))
        self.cut(x0, x1, f - 1, f + depth + 1, z0, z1)
        self.box(x0, x1, f + depth, f + depth + 1, z0, z1, self.SHOPGLASS)
        self.box(x0, x1, f + depth - 1, f + depth + 1, z0, z0 + 1, fr)
        self.box(x0, x1, f + depth - 1, f + depth + 1, z1 - 1, z1, fr)
        for x in range(x0, x1, 12):
            self.box(x, x + 1, f + depth - 1, f + depth + 1, z0, z1, fr)
        self.box(x1 - 1, x1, f + depth - 1, f + depth + 1, z0, z1, fr)
        self.box(x0 + 1, x1 - 1, f + depth + 1, f + 30, 0, 1, self.CHECK)
        if x0 in self.state.get('closed', ()):
            self.grille(x0, x1, f, z0, z1)

    def interior(self, x0, x1, f=0, h=40):
        self.front, keep = 0, self.front
        self.rooms(f, h, x0=x0, x1=x1)
        self.front = keep

    # ------------------------------------------------------------ homes
    def home(self):
        if self.r.get('roofStyle') == 'hip':
            return self.ranch()
        return self.bungalow() if self.W >= 96 else self.cape()

    def ranch(self):
        """Long and low under a hipped roof: brick to the sills, siding above,
        a picture window, the door on a stoop, a garage at the end, shrubs,
        and the mailbox on its post by the drive."""
        W, D = self.W, self.D
        wall = 30
        self.wallm = self.SIDING
        self.box(0, W, 0, D, 0, wall, self.SIDING)
        self.box(0, W, -1, 0, 0, 12, self.BRICKW)
        self.interior(1, W - 30, 0, wall)
        self.window(5, 35, 12, 26, kind='plate', shutters=None, curtains=0.9, surround=False, frame=self.TRIM)
        for x in (14, 25):
            self.box(x, x + 1, 2, 4, 12, 26, self.TRIM)
        self.window(W - 58, W - 46, 14, 26, kind='sash', shutters='hinged', curtains=0.8, surround=False,
                    frame=self.TRIM)
        ax = W - 40
        self.plain_door(ax, 1)
        self.stoop(ax - 7, ax + 7, h=2, depth=4)
        self.box(ax - 10, ax - 9, -2, 0, 20, 24, self.GLOBE)
        self.lamps.append((ax - 10, -2, 22))
        # The garage: a panelled up-and-over door, the drive before it.
        gx0, gx1 = W - 28, W - 3
        self.box(gx0 - 2, gx1 + 2, -1, 0, 0, 27, self.TRIM)
        self.cut(gx0, gx1, -1, 2, 1, 25)
        self.box(gx0, gx1, 2, 3, 1, 25, self.WHITE)
        for z in range(6, 25, 6):
            self.box(gx0, gx1, 1, 2, z, z + 1, self.WHITE)
        for x in range(gx0 + 4, gx1, 6):
            self.box(x, x + 1, 1, 2, 1, 25, self.WHITE)
        self.box(gx0, gx1, -14, 0, 0, 1, self.CONCRETE)
        self.box(gx0 - 6, gx0 - 4, -12, -10, 0, 16, self.WHITE)
        self.box(gx0 - 8, gx0 - 2, -13, -9, 16, 20, self.ENAMEL)
        self.shrubs(1, 38)
        self.shrubs(W - 60, W - 45)
        self.roof(0, W, 0, D, wall, 0.4, 'hip', over=4)
        self.chimney(28, D // 2 + 2, wall + 6, w=7, d=6, h=12, pots=0, m=self.BRICKW)
        self.pots.append((31, D // 2 + 5, wall + 19, 'chimney'))
        self.door_x = self.sx0 + ax

    def bungalow(self):
        """A craftsman bungalow: a porch let in under the roof on tapered
        posts over brick piers, rafter tails at the eaves, a shed dormer."""
        W, D = self.W, self.D
        wall, porch = 34, 12
        self.wallm = self.SIDING
        self.box(0, W, porch, D, 0, wall, self.SIDING)
        self.box(0, W, 0, porch, 0, 4, self.CONCRETE)
        self.front = porch
        self.interior(1, W - 1, 0, wall)
        self.front = porch
        self.window(6, 20, 10, 26, kind='sash', shutters=None, curtains=0.8, surround=False, frame=self.TRIM)
        self.window(W - 20, W - 6, 10, 26, kind='sash', shutters=None, curtains=0.8, surround=False, frame=self.TRIM)
        self.front = 0
        ax = W // 2
        self.box(ax - 7, ax + 7, porch - 1, porch, 4, 32, self.TRIM)
        self.cut(ax - 5, ax + 5, porch - 1, porch + 3, 4, 30)
        self.box(ax - 5, ax + 5, porch + 3, porch + 4, 4, 30, self.PAINT[self.pick(['green', 'oxblood', 'teal'], 2)])
        self.box(ax - 3, ax + 3, porch + 2, porch + 3, 22, 28, self.GLASS)
        self.door_x = self.sx0 + ax
        self.door_ground = self.base - 1 - porch // 2
        for x in (1, W - 7):
            self.box(x, x + 6, 0, 6, 4, 14, self.BRICKW)
            self.fill(x, x + 6, 0, 6, 14, wall, lambda X, Y, Z, x=x: np.abs(X + 0.5 - x - 3) <= 2.2 - (Z - 14) * 0.04,
                      self.TRIM)
        for x0, x1 in ((7, ax - 8), (ax + 8, W - 7)):
            self.box(x0, x1, 1, 2, 12, 14, self.TRIM)
            for x in range(x0, x1, 3):
                self.box(x, x + 1, 1, 2, 4, 12, self.TRIM)
        self.stoop(ax - 8, ax + 8, h=4, depth=5)
        rise = self.roof(0, W, 0, D, wall, 0.55, 'side', over=4)
        for x in range(-4, W + 4, 4):
            self.box(x, x + 1, -5, -3, wall - 1, wall, self.TRIM)
        # The shed dormer on the front slope.
        dz = wall + int(10 * 0.55) + 2
        self.box(ax - 14, ax + 14, 6, 18, wall, dz + 12, self.SIDING)
        self.box(ax - 16, ax + 16, 3, 20, dz + 12, dz + 14, self.SHINGLE)
        for k in range(3):
            x0 = ax - 12 + k * 9
            self.window(x0, x0 + 6, dz + 2, dz + 10, kind='plate', shutters=None, curtains=0.4, surround=False,
                        sill=False, frame=self.TRIM, storey=1)
        self.chimney(W - 10, D // 2 + 4, wall + rise - 10, w=6, d=6, h=14, pots=0, m=self.BRICKW)
        self.pots.append((W - 7, D // 2 + 7, wall + rise + 5, 'chimney'))

    def cape(self):
        """The Cape Cod cottage: a storey and a half under a steep side gable,
        two dormers, the door in the middle between shuttered windows."""
        W, D = self.W, self.D
        wall = 32
        self.wallm = self.SIDING
        self.box(0, W, 0, D, 0, wall, self.SIDING)
        self.box(0, W, -1, 0, 0, 3, self.CONCRETE)
        self.interior(1, W - 1, 0, wall)
        ax = W // 2
        for x0 in (4, W - 14):
            self.window(x0, x0 + 10, 10, 26, kind='sash', shutters='hinged', curtains=0.8, surround=False,
                        frame=self.TRIM)
        self.plain_door(ax, 1)
        self.box(ax - 8, ax + 8, -3, 0, 32, 34, self.TRIM)
        self.stoop(ax - 7, ax + 7, h=2, depth=4)
        self.shrubs(1, 11)
        self.shrubs(W - 12, W - 1)
        rise = self.roof(0, W, 0, D, wall, 0.95, 'side', over=2)
        for dx in (-12, 12):
            x0 = ax + dx - 6
            yz = 9
            z0 = wall + int(yz * 0.95) - 2
            self.box(x0, x0 + 12, yz - 2, yz + 12, wall, z0 + 14, self.SIDING)
            self.window(x0 + 3, x0 + 9, z0 + 2, z0 + 12, kind='sash', shutters=None, curtains=0.6, surround=False,
                        sill=False, frame=self.TRIM, storey=1)
            self.fill(x0 - 1, x0 + 13, yz - 3, yz + 14, z0 + 13, z0 + 21,
                      lambda X, Y, Z, x0=x0, z0=z0: Z < z0 + 13 + np.minimum(X + 0.5 - x0 + 1, x0 + 13 - X - 0.5) * 1.1,
                      self.SHINGLE, self.g.normal((0, -0.2, 1)))
        self.chimney(W - 8, D // 2 - 3, wall + rise - 12, w=6, d=6, h=16, pots=0, m=self.BRICKW)
        self.pots.append((W - 5, D // 2, wall + rise + 5, 'chimney'))

    def duplex(self):
        """A two-family house of the northeastern mill towns: stacked porches
        on turned posts beside a bay, clapboard, a front gable."""
        W, D = self.W, self.D
        f1 = 40
        wall = 76
        porch = 10
        self.wallm = self.SIDING
        pw = W // 2
        self.box(0, W, 0, D, 0, wall, self.SIDING)
        self.box(0, pw, 0, porch, 0, wall, 0)
        self.box(0, W, -1, 0, 0, 4, self.CONCRETE)
        self.interior(pw + 1, W - 1, 0, 38)
        self.interior(pw + 1, W - 1, f1, 36)
        # The bay: three canted windows a storey each.
        for z in (0, f1):
            self.box(pw + 2, W - 2, -5, 0, z + 4, z + 34, self.SIDING)
            self.front = -5
            self.window(pw + 7, W - 7, z + 10, z + 28, kind='sash', shutters=None, curtains=0.7, surround=False,
                        frame=self.TRIM, storey=z // 40)
            self.front = 0
            self.box(pw + 1, W - 1, -6, 1, z + 34, z + 36, self.TRIM)
        for z in (0, f1):
            self.box(0, pw, 0, porch, z, z + 3, self.TRIM if z else self.CONCRETE)
            for x in (1, pw - 3):
                self.box(x, x + 2, 0, 2, z + 3, z + 38, self.TRIM)
            self.box(3, pw - 3, 0, 1, z + 14, z + 15, self.TRIM)
            for x in range(3, pw - 3, 2):
                self.box(x, x + 1, 0, 1, z + 3, z + 14, self.TRIM)
            self.front = porch
            self.plain_door(pw // 2, z + 3)
            self.front = 0
        self.door_ground = self.base - 1 - porch // 2 - 3
        self.box(0, pw, 0, porch, f1 * 2 - 4, f1 * 2 - 2, self.TRIM)
        self.roof(0, W, 0, D, wall, 0.62, 'front', over=2)
        self.window(W // 2 - 5, W // 2 + 5, wall + 4, wall + 16, kind='sash', shutters=None, curtains=0.5,
                    surround=False, sill=False, frame=self.TRIM, storey=2)
        self.chimney(W - 12, D - 10, wall + 10, w=6, d=5, h=16, pots=0, m=self.BRICKW)
        self.pots.append((W - 9, D - 8, wall + 27, 'chimney'))

    # ------------------------------------------------------------ the strip
    def box_shop(self, wall, m, z1=34, sign=True, parapet=6):
        """A one-storey shop: plinth, a glazed front the width of the lot, a
        door, a flat roof behind a signed parapet."""
        W, D = self.W, self.D
        self.wallm = m
        self.box(0, W, 0, D, 0, wall, m)
        self.box(0, W, -1, 0, 0, 3, self.CONCRETE)
        self.interior(1, W - 1, 0, wall)
        self.storefront(3, W - 3, 4, z1)
        self.flat_top(wall, parapet, m, sign=sign)

    def shop_door(self, ax, z1=30):
        f = self.front
        self.cut(ax - 5, ax + 5, f - 1, f + 5, 1, z1)
        self.box(ax - 5, ax + 5, f + 4, f + 5, 1, z1, self.SHOPGLASS)
        for x in (ax - 5, ax + 4):
            self.box(x, x + 1, f + 3, f + 5, 1, z1, self.CHROME)
        self.box(ax - 5, ax + 5, f + 3, f + 5, z1 - 1, z1, self.CHROME)
        self.box(ax - 3, ax + 3, f + 3, f + 4, 14, 15, self.CHROME)
        self.door_x = self.sx0 + ax

    def awning_over(self, x0, x1, z, k=None):
        self.awning(x0, x1, z, self.AWN[(self.seed + self.variant) % 4 if k is None else k], reach=10, drop=5)

    def store(self):
        W = self.W
        self.box_shop(40, self.BRICKW, z1=30)
        self.shop_door(W - 10)
        self.awning_over(1, W - 1, 32)
        # An ice chest and a paper box on the pavement.
        self.box(3, 13, -6, -1, 0, 9, self.WHITE)
        self.box(4, 12, -5, -2, 9, 10, self.ENAMEL)
        self.box(15, 20, -5, -2, 0, 10, self.PAINT['navy'])
        self.box(15, 20, -5, -4, 6, 9, self.GLASS)

    def drugstore(self):
        W = self.W
        self.box_shop(42, self.BRICKW, z1=32)
        self.shop_door(8)
        self.box(12, W - 3, 4, 8, 0, 1, self.CHECK)
        # A blade sign on a bracket, lit, and a clock.
        self.box(W - 6, W - 5, -8, 0, 36, 37, self.IRON)
        self.box(W - 7, W - 4, -8, -6, 24, 36, self.ENAMEL)
        self.box(W - 7, W - 4, -9, -8, 25, 35, self.NEON)
        self.lamps.append((W - 6, -8, 30))
        self.fill(3, 11, -2, 0, 33, 41, lambda X, Y, Z: (X + 0.5 - 7) ** 2 + (Z + 0.5 - 37) ** 2 <= 13, self.WHITE)
        self.box(6, 7, -3, -2, 37, 40, self.IRON)
        self.box(7, 9, -3, -2, 37, 38, self.IRON)

    def market(self):
        W = self.W
        self.box_shop(40, self.STONE, z1=30)
        self.shop_door(W // 2)
        self.awning_over(1, W - 1, 33)
        rng = random.Random(self.seed + 3)
        for x0 in (3, W - 25):
            for k, zz in enumerate((6, 10)):
                yy = -8 + k * 3
                self.box(x0, x0 + 22, yy, yy + 3, zz - 6 + k * 4, zz, self.OAK)
                for x in range(x0, x0 + 22):
                    self.box(x, x + 1, yy, yy + 3, zz, zz + 1 + (x % 2), self.GOODS[(x // 4 + k + rng.randint(0, 1)) % 5])

    def cafe(self):
        W = self.W
        self.box_shop(40, self.STONE, z1=30)
        self.shop_door(10)
        self.awning_over(1, W - 1, 33, k=self.variant % 4)
        for tx in (W - 28, W - 14):
            self.box(tx + 2, tx + 3, -6, -5, 0, 9, self.IRON)
            self.fill(tx - 1, tx + 6, -9, -2, 9, 10, lambda X, Y, Z, tx=tx: (X + 0.5 - tx - 2.5) ** 2 + (Y + 5.5) ** 2 <= 10,
                      self.WHITE)
            for cx in (tx - 3, tx + 7):
                self.box(cx, cx + 2, -6, -4, 0, 6, self.IRON)
                self.box(cx, cx + 2, -4, -3, 6, 11, self.IRON)

    def laundromat(self):
        """Plate glass onto rows of machines, round doors facing the street."""
        W = self.W
        self.box_shop(40, self.STONE, z1=32)
        self.shop_door(8)
        for x in range(16, W - 6, 9):
            self.box(x, x + 8, 10, 18, 1, 13, self.WHITE)
            self.fill(x + 1, x + 7, 9, 10, 3, 11, lambda X, Y, Z, x=x: (X + 0.5 - x - 4) ** 2 + (Z + 0.5 - 7) ** 2 <= 7,
                      self.GLASS)
            self.box(x, x + 8, 10, 18, 13, 14, self.CHROME)
            self.box(x, x + 8, 12, 18, 16, 28, self.WHITE)
            self.fill(x + 1, x + 7, 11, 12, 18, 26, lambda X, Y, Z, x=x: (X + 0.5 - x - 4) ** 2 + (Z + 0.5 - 22) ** 2 <= 7,
                      self.GLASS)
        for x in range(10, W - 6, 12):
            self.box(x, x + 8, 12, 14, 36, 37, self.GLOBE)
            self.lamps.append((x + 4, 13, 36))

    def clinic(self):
        """Mid-century and flat-roofed: a glass-block panel, a slab canopy
        over a ramp, a cross on a blade."""
        W, D = self.W, self.D
        self.box_shop(40, self.WHITE, z1=32, parapet=4)
        self.box(3, 15, -1, 1, 4, 34, self.GLASSBLOCK)
        self.shop_door(W - 12)
        self.box(W - 24, W, -12, 0, 34, 36, self.WHITE)
        for x in (W - 23, W - 3):
            self.box(x, x + 2, -12, -10, 0, 34, self.CHROME)
        for k in range(4):
            self.box(W - 22, W - 2, -12 + k * 3, -9 + k * 3, 0, 1 + k // 2, self.CONCRETE)
        self.box(18, 20, -6, 0, 38, 39, self.IRON)
        self.box(17, 25, -8, -6, 30, 38, self.WHITE)
        self.box(20, 22, -9, -8, 31, 37, self.NEON)
        self.box(18, 24, -9, -8, 33, 35, self.NEON)
        self.lamps.append((21, -9, 34))

    def grocery(self):
        """A self-service grocery: a glass front the width of the lot under a
        steel canopy, the name on the parapet, carts nested by the door."""
        W, D = self.W, self.D
        self.box_shop(44, self.STONE, z1=34, parapet=10)
        self.shop_door(W // 2)
        rng = random.Random(self.seed + 7)
        for x in range(8, W - 8, 10):
            if abs(x - W // 2) > 8:
                self.box(x, x + 8, 12, 16, 1, 18, self.OAK)
                for z in (6, 12, 17):
                    for xx in range(x, x + 8):
                        self.box(xx, xx + 1, 11, 12, z, z + 2, self.GOODS[(xx // 2 + z + rng.randint(0, 2)) % 6])
        self.box(0, W, -10, 0, 36, 38, self.ENAMEL)
        self.box(-1, W + 1, -11, -9, 35, 39, self.WHITE)
        for x in (1, W - 3):
            self.box(x, x + 2, -10, -8, 0, 36, self.CHROME)
        for i, x in enumerate(range(6, 30, 5)):
            self.box(x, x + 6, -6, -2, 6, 12, self.CHROME)
            self.box(x + 1, x + 5, -5, -3, 7, 11, 0)
            for wx in (x, x + 5):
                self.box(wx, wx + 1, -6, -5, 0, 6, self.CHROME)

    def donuts(self):
        """A box of glass, and a donut on a pole by the door, iced and lit."""
        W, D = self.W, self.D
        self.box_shop(34, self.WHITE, z1=28, sign=True, parapet=4)
        self.shop_door(W // 2 - 8)
        px = W - 8
        self.box(px, px + 2, -6, -4, 0, 52, self.IRON)
        cx, cz, R, r = px + 1, 58, 7, 3
        torus = lambda X, Y, Z: (np.hypot(X + 0.5 - cx, Z + 0.5 - cz) - R) ** 2 + (Y + 5.5) ** 2 <= r * r
        self.fill(cx - R - r, cx + R + r + 1, -9, -1, cz - R - r, cz + R + r + 1, torus, self.DOUGH)
        self.fill(cx - R - r, cx + R + r + 1, -9, -1, cz - R - r, cz + R + r + 1,
                  lambda X, Y, Z: torus(X, Y, Z) & (Y + 5.5 < -r * 0.2) & (Z + 0.5 - cz > -R * 0.3), self.ICING)
        self.lamps.append((cx, -8, cz))

    def diner(self):
        """A stainless diner car: fluted steel, an enamel band under a ribbon
        of windows, a barrel roof, a glass-block vestibule at the door."""
        W, D = self.W, self.D
        self.wallm = self.STEEL
        body = 34
        y0 = 4
        self.box(0, W, y0, D, 0, body, self.STEEL)
        self.box(0, W, y0 - 1, D, 0, 4, self.CONCRETE)
        self.front = y0
        self.interior(1, W - 1, 0, body)
        self.box(0, W, y0 - 1, y0, 5, 12, self.ENAMEL)
        self.cut(3, W - 3, y0 - 1, y0 + 4, 14, 27)
        self.box(3, W - 3, y0 + 3, y0 + 4, 14, 27, self.SHOPGLASS)
        for x in range(3, W - 3, 6):
            self.box(x, x + 1, y0 + 2, y0 + 4, 14, 27, self.CHROME)
        self.box(3, W - 3, y0 + 8, y0 + 12, 1, 12, self.ENAMEL)
        self.box(3, W - 3, y0 + 8, y0 + 12, 12, 13, self.CHROME)
        for x in range(6, W - 6, 6):
            self.box(x, x + 2, y0 + 6, y0 + 8, 1, 14, self.CHROME)
        self.front = 0
        # The vestibule, glass block and a door.
        ax = W - 14 if W >= 64 else W // 2 + 6
        self.box(ax - 7, ax + 7, -4, y0, 0, 32, self.GLASSBLOCK)
        self.cut(ax - 4, ax + 4, -5, y0 + 1, 1, 26)
        self.box(ax - 4, ax + 4, y0, y0 + 1, 1, 26, self.SHOPGLASS)
        self.box(ax - 8, ax + 8, -5, y0, 32, 34, self.STEEL)
        self.door_x = self.sx0 + ax
        # A barrel roof along the car, the sign across its front.
        n = [self.g.normal((0, -np.sin(a), np.cos(a))) for a in np.linspace(-1.2, 1.2, 7)]
        cy, r = (y0 + D) / 2, (D - y0) / 2 + 1
        for k in range(7):
            ya = y0 - 1 + k * (D - y0 + 2) / 7
            yb = y0 - 1 + (k + 1) * (D - y0 + 2) / 7
            self.fill(-1, W + 1, int(ya), int(np.ceil(yb)), body, body + 12,
                      lambda X, Y, Z: (Y + 0.5 >= ya) & (Y + 0.5 < yb) &
                      ((Z - body) <= np.sqrt(np.maximum(0, r * r - (Y + 0.5 - cy) ** 2)) * 0.5), self.STEEL, n[6 - k])
        self.box(3, W - 3, y0 - 2, y0, body - 1, body + 7, self.ENAMEL)
        self.box(2, W - 2, y0 - 3, y0, body + 7, body + 8, self.CHROME)
        self.sign_band = [self.sx0 + 4, self.base - (body + 6) - round(0.5 * (y0 - 2)) - 1, W - 8, 6]
        self.vent_hood = None

    def gas(self):
        """An oblong box of white enamel: the office in glass, service bays
        with glazed doors, a coloured band for the name. Pumps stand on an
        island, and a big station puts a canopy over them."""
        W, D = self.W, self.D
        big = W >= 112
        y0 = 30 if big else 20
        self.wallm = self.WHITE
        self.box(0, W, y0, D, 0, 38, self.WHITE)
        self.front = y0
        self.interior(1, W - 1, 0, 36)
        self.box(0, W, y0 - 1, y0, 0, 3, self.CONCRETE)
        split = 40
        self.storefront(3, split - 2, 4, 30, frame=self.CHROME)
        self.shop_door(split - 8)
        bays = [(split + 2, W - 3)] if not big else [(split + 2, split + 36), (split + 40, W - 3)]
        for k, (b0, b1) in enumerate(bays):
            self.cut(b0, b1, y0 - 1, y0 + 20, 1, 30)
            self.box(b0, b1, y0 + 20, y0 + 22, 1, 30, self.PAPER[1])
            self.box(b0, b1, y0, y0 + 20, 0, 1, self.CONCRETE)
            if k == 0:
                self.car(b0 + 4, y0 + 4, 0)
                self.box(b0 + 2, b1 - 2, y0 - 1, y0 + 1, 28, 30, self.STEEL)
            else:
                for z in range(2, 30, 4):
                    self.box(b0, b1, y0, y0 + 1, z, z + 3, self.STEEL)
                    self.box(b0 + 1, b1 - 1, y0, y0 + 1, z + 1, z + 2, self.GLASS)
        self.front = 0
        self.box(-1, W + 1, y0 - 2, y0 + 2, 38, 44, self.ENAMEL)
        self.box(-1, W + 1, y0 - 3, y0 + 2, 44, 45, self.WHITE)
        self.box(-1, W + 1, y0 - 3, y0 + 2, 37, 38, self.WHITE)
        self.box(0, W, y0 + 2, D, 38, 41, self.WHITE)
        self.box(2, W - 2, y0 + 4, D - 2, 40, 41, self.FELT)
        self.box(W // 2, W // 2 + 10, y0 + 12, y0 + 20, 41, 46, self.STEEL)
        self.sign_band = [self.sx0 + 3, self.base - 43 - round(0.5 * (y0 - 2)) - 1, W - 6, 5]
        self.box(0, W, 0, y0, 0, 1, self.CONCRETE)
        # The island and its pumps, a lit globe on each.
        iy = 6 if not big else 8
        self.box(8, W - 8, iy, iy + 6, 1, 3, self.CONCRETE)
        for px in range(14, W - 14, 26 if big else 40):
            self.box(px, px + 6, iy + 1, iy + 5, 3, 19, self.ENAMEL)
            self.box(px + 1, px + 5, iy, iy + 1, 11, 16, self.WHITE)
            self.fill(px, px + 6, iy + 1, iy + 5, 19, 25,
                      lambda X, Y, Z, px=px: (X + 0.5 - px - 3) ** 2 + (Y - iy - 2.5) ** 2 + (Z - 22) ** 2 <= 8,
                      self.GLOBE)
            self.lamps.append((px + 3, iy + 3, 22))
        if big:
            self.box(0, W, -4, y0, 50, 53, self.WHITE)
            self.box(-1, W + 1, -5, -3, 49, 55, self.ENAMEL)
            for x in (8, W - 11):
                self.box(x, x + 3, iy + 1, iy + 4, 3, 50, self.WHITE)
            for x in range(10, W - 8, 14):
                self.box(x, x + 4, 10, 12, 49, 50, self.GLOBE)
                self.lamps.append((x + 2, 11, 49))
            self.car(W - 58, -12, 0, m=self.CARS[(self.seed + 1) % 3])

    def car(self, x, y, z, m=None):
        m = m or self.CARS[self.seed % 3]
        self.box(x + 1, x + 21, y, y + 10, z + 3, z + 9, m)
        self.box(x + 5, x + 16, y + 1, y + 9, z + 9, z + 14, m)
        self.box(x + 6, x + 15, y, y + 1, z + 10, z + 13, self.GLASS)
        for wx in (x + 3, x + 16):
            self.fill(wx, wx + 4, y - 1, y + 11, z, z + 5,
                      lambda X, Y, Z, wx=wx: (X + 0.5 - wx - 2) ** 2 + (Z + 0.5 - z - 2.5) ** 2 <= 5, self.RUBBER)
        self.box(x, x + 2, y + 2, y + 8, z + 5, z + 7, self.CHROME)

    def garage(self):
        """A repair shop: one roller door up on a car on the lift, the other
        down, the office glazed, tyres and drums by the wall."""
        W, D = self.W, self.D
        self.wallm = self.CONCRETE
        self.box(0, W, 0, D, 0, 40, self.CONCRETE)
        self.interior(1, W - 1, 0, 40)
        self.box(0, W, -1, 0, 0, 3, self.CONCRETE)
        for k, (b0, b1) in enumerate(((3, 33), (36, 66))):
            self.cut(b0, b1, -1, 36, 1, 32)
            self.box(b0, b1, 36, 38, 1, 32, self.PAPER[1])
            self.box(b0, b1, -1, 1, 32, 34, self.STEEL)
            self.box(b0, b1, 1, 36, 0, 1, self.CONCRETE)
            if k == 0:
                self.box(b0 + 6, b0 + 8, 14, 18, 1, 10, self.ENAMEL)
                self.box(b0 + 18, b0 + 20, 14, 18, 1, 10, self.ENAMEL)
                self.car(b0 + 3, 11, 10)
                for z in range(3, 30, 6):
                    self.box(b1 - 3, b1 - 1, 34, 36, z, z + 1, self.IRON)
            else:
                for z in range(1, 32, 3):
                    self.box(b0, b1, 1, 2, z, z + 2, self.STEEL)
        self.box(W - 26, W - 4, -1, 1, 4, 30, self.GLASS)
        self.box(W - 26, W - 4, -1, 1, 30, 32, self.TRIM)
        self.box(W - 16, W - 15, -1, 1, 4, 30, self.TRIM)
        self.shop_door(W - 10)
        self.flat_top(40, 4, self.CONCRETE, sign=True)
        for k in range(4):
            self.fill(W - 13, W - 5, -8, 0, k * 3, k * 3 + 3,
                      lambda X, Y, Z: np.abs(np.hypot(X + 0.5 - W + 9, Y + 0.5 + 4) - 2.8) < 1.3, self.RUBBER)
        for x in (W - 24, W - 18):
            self.fill(x, x + 5, -7, -2, 0, 9, lambda X, Y, Z, x=x: (X + 0.5 - x - 2.5) ** 2 + (Y + 4.5) ** 2 <= 6,
                      self.ENAMEL)

    def motel(self):
        """Two floors of rooms off an open gallery, an iron stair at the end,
        the office in glass at the other, and the sign on its pole, lit."""
        W, D = self.W, self.D
        y0 = 12
        f1 = 38
        self.wallm = self.WHITE
        self.box(0, W, y0, D, 0, 2 * f1, self.STONE)
        door = self.PAINT[self.pick(['teal', 'oxblood', 'mustard'], 5)]
        for f in (0, f1):
            self.front = y0
            self.interior(1, W - 1, f, 36)
            self.front = y0
            for k, ax in enumerate(range(34, W - 8, 30)):
                self.window(ax - 20, ax - 8, f + 14, f + 28, kind='plate', shutters=None, curtains=0.95,
                            surround=False, sill=False, frame=self.TRIM, storey=f // f1)
                self.box(ax - 4, ax + 6, y0, y0 + 1, f + 2, f + 30, door)
                self.box(ax + 3, ax + 4, y0 - 1, y0, f + 15, f + 17, self.BRASS)
                self.box(ax, ax + 2, y0 - 1, y0, f + 24, f + 27, self.WHITE)
                self.box(ax - 6, ax - 5, y0 - 2, y0 - 1, f + 31, f + 33, self.GLOBE)
                self.lamps.append((ax - 6, y0 - 2, f + 32))
            self.front = 0
        # The office: glass on the ground floor at the left, a bell inside.
        self.front = y0
        self.storefront(2, 10, 4, 32, frame=self.CHROME, depth=2)
        self.front = 0
        self.door_x = self.sx0 + 35
        self.door_ground = self.base - 1 - y0 // 2
        # The gallery slab, posts and rail; the stair down at the right.
        self.box(0, W, 0, y0, f1 - 2, f1, self.CONCRETE)
        self.box(0, W, 0, y0, 0, 2, self.CONCRETE)
        for x in range(1, W - 1, 30):
            self.box(x, x + 2, 0, 2, 2, 2 * f1 + 2, self.IRON)
        self.box(W - 3, W - 1, 0, 2, 2, 2 * f1 + 2, self.IRON)
        self.railing(1, W - 14, 0, f1, 10, pattern='bars')
        for k in range(18):
            self.box(W - 13, W - 1, 1, 3, f1 - 2 - k * 2, f1 - k * 2, self.CONCRETE)
        self.box(W - 13, W - 1, 0, 1, 2, f1 + 10, self.IRON)
        self.box(0, W, -2, y0 + 2, 2 * f1, 2 * f1 + 2, self.CONCRETE)
        self.flat_top(2 * f1, 3, self.STONE, sign=False)
        self.box(12, 20, -3, 0, 0, 12, self.WHITE)
        self.box(13, 19, -4, -3, 6, 10, self.ENAMEL)
        self.car(40, -14, 0)
        # The pole sign: a painted board with an arrow of lamps.
        px = 4
        self.box(px, px + 2, -8, -6, 0, 2 * f1 + 18, self.IRON)
        self.box(px - 2, px + 26, -9, -5, 2 * f1 + 10, 2 * f1 + 24, self.ENAMEL)
        self.box(px - 3, px + 27, -10, -4, 2 * f1 + 24, 2 * f1 + 25, self.WHITE)
        self.box(px - 3, px + 27, -10, -4, 2 * f1 + 9, 2 * f1 + 10, self.WHITE)
        chase = self.state.get('neon')
        for i in range(8):
            lit = chase is None or (i - chase) % 4 < 2
            self.box(px + 1 + i * 3, px + 2 + i * 3, -10, -9, 2 * f1 + 6 - (i % 2), 2 * f1 + 7 - (i % 2),
                     self.NEON if lit else self.IRON)
        self.lamps.append((px + 12, -10, 2 * f1 + 6))
        self.sign_band = [self.sx0 + px, self.base - (2 * f1 + 21) - 5, 24, 6]


    # ------------------------------------------------------------ the sign shops
    def pole(self, x, y, z1, w=2):
        self.box(x, x + w, y, y + w, 0, z1, self.IRON)
        self.box(x - 1, x + w + 1, y - 1, y + w + 1, 0, 2, self.CONCRETE)

    def burgers(self):
        """A drive-in: a glass counter under an upswept roof, a canopy on
        raked posts where the tray comes out to the car, and a burger on a
        pole as tall as the building."""
        W, D = self.W, self.D
        y0 = 26
        self.wallm = self.WHITE
        self.box(0, W, y0, D, 0, 32, self.WHITE)
        self.front = y0
        self.interior(1, W - 1, 0, 32)
        self.box(0, W, y0 - 1, y0, 0, 3, self.CONCRETE)
        self.storefront(24, W - 4, 4, 28, frame=self.CHROME)
        self.shop_door(16)
        self.box(0, W, y0 - 1, y0, 28, 32, self.ENAMEL)
        self.front = 0
        # The roof sweeps up toward the street like a wing.
        n = self.g.normal((0, -0.35, 1))
        self.fill(-2, W + 2, y0 - 12, D + 1, 32, 48,
                  lambda X, Y, Z: np.abs(Z - (32 + (D - Y) * 0.2)) < 1.2, self.RED, n)
        self.box(-2, W + 2, y0 - 13, y0 - 11, 36, 40, self.WHITE)
        self.sign_band = [self.sx0 + 26, self.base - 39 - round(0.5 * (y0 - 13)) - 1, W - 30, 5]
        # The carhop canopy on V posts, a car pulled in under it.
        self.box(20, W - 2, 0, y0 - 10, 34, 36, self.WHITE)
        self.box(20, W - 2, -1, 1, 33, 37, self.RED)
        for x in (26, W - 10):
            for dx in (-3, 3):
                self.fill(x - 4, x + 5, 2, 5, 1, 34,
                          lambda X, Y, Z, x=x, dx=dx: np.abs(X + 0.5 - x - dx * (Z / 34)) < 0.9, self.CHROME)
            self.box(x - 1, x + 2, 2, 5, 30, 33, self.GLOBE)
            self.lamps.append((x, 3, 31))
        self.car(34, 4, 0)
        self.box(58, 66, 4, 8, 12, 13, self.CHROME)
        # The burger: bun, lettuce, cheese, patty, bun, on its pole.
        cx, cz = 9, 70
        self.pole(cx - 1, -4, cz - 10)
        bun = lambda X, Y, dz, r: (X + 0.5 - cx) ** 2 + ((Y + 3) * 1.3) ** 2 + (dz) ** 2 <= r * r
        self.fill(cx - 12, cx + 13, -12, 6, cz - 12, cz - 7,
                  lambda X, Y, Z: bun(X, Y, 0, 10) & (Z >= cz - 12), self.BUN)
        self.fill(cx - 12, cx + 13, -12, 6, cz - 7, cz - 4, lambda X, Y, Z: bun(X, Y, 0, 11), self.PATTY)
        self.fill(cx - 12, cx + 13, -13, 6, cz - 4, cz - 3,
                  lambda X, Y, Z: bun(X, Y, 0, 11.5) & ((X + Y) % 5 != 0), self.CHEESE)
        self.fill(cx - 13, cx + 14, -13, 7, cz - 3, cz - 2,
                  lambda X, Y, Z: bun(X, Y, 0, 12) & ((X * 3 + Y) % 4 != 0), self.LETTUCE)
        self.fill(cx - 12, cx + 13, -12, 6, cz - 2, cz + 9,
                  lambda X, Y, Z: (X + 0.5 - cx) ** 2 + ((Y + 3) * 1.3) ** 2 + ((Z - cz + 2) * 1.1) ** 2 <= 110,
                  self.BUN)
        rng = random.Random(self.seed)
        for _ in range(9):
            x, z = cx + rng.randint(-7, 7), cz + rng.randint(3, 7)
            self.box(x, x + 1, -12, -11, z, z + 1, self.CHEESE)
        self.door_x = self.sx0 + 16
        self.door_ground = self.base - 1 - y0 // 2

    def ice_cream(self):
        """A walk-up stand: two service windows under a striped canopy, and
        on the roof a cone with three scoops and a cherry."""
        W, D = self.W, self.D
        self.box_shop(34, self.WHITE, z1=28, sign=True, parapet=4)
        for x0 in (6, W - 26):
            self.box(x0, x0 + 20, -3, 0, 12, 14, self.CHROME)
        self.shop_door(W // 2)
        self.awning_over(1, W - 1, 30, k=0)
        cx, cy = W / 2, D / 2 + 4
        base = 38
        self.fill(int(cx) - 8, int(cx) + 9, int(cy) - 8, int(cy) + 9, base, base + 22,
                  lambda X, Y, Z: (X + 0.5 - cx) ** 2 + (Y + 0.5 - cy) ** 2 <= ((Z - base) * 0.34) ** 2, self.WAFFLE)
        for k, (dz, r) in enumerate(((26, 8.5), (35, 7.5), (43, 6.2))):
            m = self.SCOOPS[(k + self.seed) % 3]
            self.fill(int(cx) - 10, int(cx) + 11, int(cy) - 10, int(cy) + 11, base + dz - 9, base + dz + 9,
                      lambda X, Y, Z, dz=dz, r=r: (X + 0.5 - cx) ** 2 + (Y + 0.5 - cy) ** 2 + ((Z - base - dz) * 1.15) ** 2 <= r * r,
                      m)
        self.fill(int(cx) - 3, int(cx) + 4, int(cy) - 3, int(cy) + 4, base + 48, base + 53,
                  lambda X, Y, Z: (X + 0.5 - cx) ** 2 + (Y + 0.5 - cy) ** 2 + (Z - base - 50) ** 2 <= 5, self.RED)
        self.box(int(cx), int(cx) + 1, int(cy), int(cy) + 1, base + 52, base + 56, self.LETTUCE)
        self.box(3, 13, -6, -1, 0, 8, self.WHITE)
        self.box(3, 13, -6, -1, 8, 9, self.BLUE)

    def music(self):
        """Guitars in the window, a drum kit and record racks behind, a
        record on the roof as wide as the shop."""
        W, D = self.W, self.D
        self.box_shop(40, self.BRICKW, z1=32)
        self.shop_door(W - 12)
        rng = random.Random(self.seed + 2)
        colours = [self.RED, self.BUN, self.BLUE, self.VINYL]
        for k, x in enumerate(range(8, W - 20, 9)):
            m = colours[k % 4]
            self.box(x + 2, x + 3, 6, 7, 18, 30, self.OAK)
            self.fill(x - 1, x + 6, 6, 8, 5, 19,
                      lambda X, Y, Z, x=x: ((X + 0.5 - x - 2.5) ** 2 + ((Z - 9) * 1.1) ** 2 <= 9)
                      | ((X + 0.5 - x - 2.5) ** 2 + ((Z - 15) * 1.2) ** 2 <= 5), m)
            self.box(x + 2, x + 3, 5, 6, 9, 16, self.IRON)
        for x in range(8, W - 20, 4):
            self.box(x, x + 3, 22, 24, 1, 10, rng.choice(self.GOODS))
            self.box(x, x + 3, 24, 26, 1, 12, self.OAK)
        self.fill(W - 30, W - 20, 12, 20, 1, 9, lambda X, Y, Z: (X + 0.5 - W + 25) ** 2 + ((Y - 15.5) * 1.2) ** 2 <= 12,
                  self.RED)
        # The record: a black disc stood on the roof, grooves, a red label.
        cx, cz, R = W / 2, 40 + 6 + 20, 19
        disc = lambda X, Z: (X + 0.5 - cx) ** 2 + (Z + 0.5 - cz) ** 2
        for x in (int(cx) - 8, int(cx) + 7):
            self.box(x, x + 1, D // 2, D // 2 + 1, 40, cz - 12, self.IRON)
        self.fill(int(cx - R), int(cx + R) + 1, D // 2 - 1, D // 2 + 1, cz - R, cz + R + 1,
                  lambda X, Y, Z: disc(X, Z) <= R * R, self.VINYL)
        self.fill(int(cx - R), int(cx + R) + 1, D // 2 - 2, D // 2 - 1, cz - R, cz + R + 1,
                  lambda X, Y, Z: disc(X, Z) <= 30, self.RED)
        self.fill(int(cx - R), int(cx + R) + 1, D // 2 - 3, D // 2 - 2, cz - R, cz + R + 1,
                  lambda X, Y, Z: disc(X, Z) <= 1.5, self.VINYL)

    def sports(self):
        """Bikes, skis and balls in the window; a baseball and a bat on a
        pole by the door."""
        W, D = self.W, self.D
        self.box_shop(40, self.STONE, z1=32)
        self.shop_door(12)
        self.awning_over(22, W - 2, 34)
        for x in (26, 46):
            for wx in (x, x + 11):
                self.fill(wx - 5, wx + 5, 7, 8, 1, 12,
                          lambda X, Y, Z, wx=wx: np.abs(np.hypot(X + 0.5 - wx, Z + 0.5 - 6) - 4.2) < 0.8, self.IRON)
            self.box(x, x + 12, 7, 8, 8, 9, self.RED)
            self.box(x + 5, x + 6, 7, 8, 6, 13, self.RED)
        for k, x in enumerate(range(W - 26, W - 6, 4)):
            self.box(x, x + 2, 12, 13, 1, 30, [self.RED, self.BLUE, self.CHEESE, self.WHITE, self.RED][k % 5])
        for k, x in enumerate(range(26, W - 30, 7)):
            self.fill(x, x + 6, 9, 15, 20, 26, lambda X, Y, Z, x=x: (X + 0.5 - x - 3) ** 2 + (Y - 11.5) ** 2 + (Z - 23) ** 2 <= 8,
                      [self.BASKET, self.BALL][k % 2])
        # The baseball on its pole, stitched, and a bat across.
        cx, cz, r = W - 6, 64, 9
        self.pole(cx - 1, -5, cz - r)
        self.fill(cx - r, cx + r + 1, -5 - r, -5 + r, cz - r, cz + r + 1,
                  lambda X, Y, Z: (X + 0.5 - cx) ** 2 + (Y + 4.5) ** 2 + (Z + 0.5 - cz) ** 2 <= r * r, self.BALL)
        for sgn in (-1, 1):
            self.fill(cx - r, cx + r + 1, -5 - r - 1, -4, cz - r, cz + r + 1,
                      lambda X, Y, Z, sgn=sgn: (np.abs((X + 0.5 - cx) * sgn - 4 - ((Z + 0.5 - cz) / r) ** 2 * 3) < 0.8)
                      & ((X + 0.5 - cx) ** 2 + (Y + 4.5) ** 2 + (Z + 0.5 - cz) ** 2 <= (r + 0.8) ** 2)
                      & ((Z + X) % 2 == 0) & (Y + 4.5 < -r * 0.3), self.RED)
        self.fill(cx - 22, cx + 2, -9, -6, cz - 18, cz - 2,
                  lambda X, Y, Z: np.abs((Z - cz + 18) - (X - cx + 22) * 0.66) < 1.3 + (X - cx + 22) * 0.05, self.BUN)

    def tires(self):
        """Tire and auto service: two bays, a car up on the lift, tires
        stacked by the door, and one stood on the roof with a white wall."""
        W, D = self.W, self.D
        self.wallm = self.CONCRETE
        self.box(0, W, 0, D, 0, 40, self.CONCRETE)
        self.interior(1, W - 1, 0, 40)
        self.box(0, W, -1, 0, 0, 3, self.CONCRETE)
        for k, (b0, b1) in enumerate(((30, 64), (68, W - 4))):
            self.cut(b0, b1, -1, 36, 1, 32)
            self.box(b0, b1, 36, 38, 1, 32, self.PAPER[1])
            self.box(b0, b1, -1, 1, 32, 34, self.STEEL)
            self.box(b0, b1, 1, 36, 0, 1, self.CONCRETE)
            if k == 0:
                self.box(b0 + 6, b0 + 8, 14, 18, 1, 12, self.ENAMEL)
                self.box(b0 + 24, b0 + 26, 14, 18, 1, 12, self.ENAMEL)
                self.car(b0 + 5, 11, 12, m=self.CARS[(self.seed + 2) % 3])
            else:
                for x in range(b0 + 3, b1 - 6, 7):
                    for z in (0, 3, 6):
                        self.fill(x, x + 6, 20, 26, z, z + 3,
                                  lambda X, Y, Z, x=x: np.abs(np.hypot(X + 0.5 - x - 3, Y - 22.5) - 2.2) < 1.1, self.RUBBER)
        self.storefront(3, 26, 4, 30, frame=self.CHROME)
        self.shop_door(20)
        self.flat_top(40, 4, self.CONCRETE, sign=True)
        for sx in (4, 12):
            for k in range(5):
                self.fill(sx, sx + 7, -8, -1, k * 3, k * 3 + 3,
                          lambda X, Y, Z, sx=sx: np.abs(np.hypot(X + 0.5 - sx - 3.5, Y + 4.5) - 2.6) < 1.3, self.RUBBER)
        self.box(W - 3, W - 1, -4, -2, 0, 16, self.RED)
        self.box(W - 4, W, -5, -1, 16, 18, self.RED)
        # The tire on the roof: a black ring on its tread, a white wall, a hub.
        cx, cz, R = W / 2 + 10, 40 + 4 + 18, 17
        ring = lambda X, Z: np.hypot(X + 0.5 - cx, Z + 0.5 - cz)
        y = D // 2
        self.fill(int(cx - R), int(cx + R) + 1, y - 3, y + 3, cz - R, cz + R + 1,
                  lambda X, Y, Z: (ring(X, Z) <= R) & (ring(X, Z) > R - 7), self.RUBBER)
        self.fill(int(cx - R), int(cx + R) + 1, y - 4, y - 3, cz - R, cz + R + 1,
                  lambda X, Y, Z: (ring(X, Z) <= R - 3) & (ring(X, Z) > R - 5), self.WHITE)
        self.fill(int(cx - R), int(cx + R) + 1, y - 3, y + 1, cz - R, cz + R + 1,
                  lambda X, Y, Z: ring(X, Z) <= R - 7, self.CHROME)
        self.fill(int(cx - R), int(cx + R) + 1, y - 5, y - 3, cz - R, cz + R + 1,
                  lambda X, Y, Z: ring(X, Z) <= 3, self.CHROME)
        for dx in (-9, 9):
            self.box(int(cx + dx), int(cx + dx) + 2, y - 1, y + 1, 44, cz - R + 3, self.IRON)

    def barber(self):
        """A narrow shop: the red chair before a mirror, and the striped pole
        by the door under its glass globe."""
        W, D = self.W, self.D
        self.box_shop(40, self.BRICKW, z1=32)
        self.shop_door(W - 12)
        for cx in (14, 30):
            self.box(cx - 4, cx + 4, 12, 18, 1, 4, self.CHROME)
            self.box(cx - 4, cx + 4, 12, 18, 4, 12, self.CHAIR)
            self.box(cx - 4, cx + 4, 17, 19, 12, 22, self.CHAIR)
            self.box(cx - 5, cx - 4, 12, 18, 10, 14, self.CHROME)
            self.box(cx + 4, cx + 5, 12, 18, 10, 14, self.CHROME)
            self.box(cx - 7, cx + 7, 26, 27, 14, 30, self.SKY)
        cx, cy, r = 4, -4, 2.6
        self.box(2, 7, -7, -1, 4, 5, self.CHROME)
        spin = self.state.get('spin', 0) * 1.5
        stripe = lambda X, Y, Z, k: ((Z + spin + np.degrees(np.arctan2(Y + 0.5 - cy, X + 0.5 - cx)) / 30) % 6 // 2) == k
        cyl = lambda X, Y: (X + 0.5 - cx) ** 2 + (Y + 0.5 - cy) ** 2 <= r * r
        for k, m in enumerate((self.RED, self.WHITE, self.BLUE)):
            self.fill(1, 8, -8, 0, 5, 26, lambda X, Y, Z, k=k: cyl(X, Y) & stripe(X, Y, Z, k), m)
        self.box(2, 7, -7, -1, 26, 27, self.CHROME)
        self.fill(1, 8, -8, 0, 27, 32, lambda X, Y, Z: (X + 0.5 - cx) ** 2 + (Y + 0.5 - cy) ** 2 + (Z - 29) ** 2 <= 7,
                  self.GLOBE)
        self.lamps.append((cx, cy, 29))
        self.barber_pole = (cx, cy)

    def pizzeria(self):
        """Checked cloths in the window, the oven glowing at the back, and a
        slice propped on the parapet."""
        W, D = self.W, self.D
        self.box_shop(40, self.BRICKW, z1=32)
        self.shop_door(W - 12)
        self.awning(1, W - 1, 34, [self.RED, self.WHITE], reach=10, drop=5)
        for tx in (10, 30):
            self.box(tx + 3, tx + 4, 9, 10, 1, 10, self.IRON)
            self.fill(tx - 1, tx + 9, 6, 14, 10, 11, lambda X, Y, Z: True, self.CHECKCLOTH)
        self.box(W // 2 - 10, W // 2 + 10, 26, 30, 1, 18, self.BRICK)
        self.fill(W // 2 - 6, W // 2 + 6, 25, 27, 4, 14, lambda X, Y, Z: (X + 0.5 - W // 2) ** 2 / 36 + (Z - 4) ** 2 / 100 <= 1,
                  self.OVEN)
        self.lamps.append((W // 2, 25, 8))
        # The slice, tip down on the sign board: cheese in its crust, pepperoni.
        cx, z0 = W - 22, 55
        tri = lambda X, Z: (Z >= z0) & (np.abs(X + 0.5 - cx) <= (Z - z0) * 0.62)
        self.fill(cx - 16, cx + 17, -3, -1, z0, z0 + 24, lambda X, Y, Z: tri(X, Z) & (Z < z0 + 21), self.CHEESE)
        self.fill(cx - 17, cx + 18, -4, -1, z0 + 20, z0 + 25,
                  lambda X, Y, Z: np.abs(X + 0.5 - cx) <= (Z - z0) * 0.64 + 1, self.BUN)
        rng = random.Random(self.seed + 4)
        for _ in range(7):
            z = rng.randint(z0 + 6, z0 + 18)
            x = int(cx + rng.uniform(-0.45, 0.45) * (z - z0))
            self.box(x - 1, x + 2, -4, -3, z - 1, z + 2, self.RED)


def make(out, zoom=2):
    from art.review_sheet import recipes
    from art.reference import current_adult_d
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    all_r, _, source = recipes()
    names = [n for n in all_r if n.startswith('candidate-modern') and not n.endswith(('-north', '-east', '-west'))]
    cells = [Roadside(all_r[n], source['materials'][all_r[n]['wall']]).render() for n in names]
    pad = 8
    rows, row, width = [], [], 0
    for im in cells:
        if width + im.width > 820 and row:
            rows.append(row)
            row, width = [], 0
        row.append(im)
        width += im.width + pad
    rows.append(row)
    W = max(sum(i.width + pad for i in r) for r in rows) + adult.width + 3 * pad
    H = sum(max(i.height for i in r) + pad for r in rows) + pad
    sheet = Image.new('RGBA', (W, H), '#8f8e84')
    y = pad
    for r in rows:
        rh = max(i.height for i in r)
        sheet.alpha_composite(Image.new('RGBA', (W, 5), '#7b747c'), (0, y + rh - 3))
        x = pad
        for im in r:
            sheet.alpha_composite(im, (x, y + rh - im.height))
            x += im.width + pad
        sheet.alpha_composite(adult, (x, y + rh - adult.height - 2))
        y += rh + pad
    sheet.resize((W * zoom, H * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/gold/roadside.png')
