"""The Belle Epoque walk-up, built in voxels: the gold standard for the
street kit's modern blocks.

    .venv/bin/python scripts/art/city_walkup.py artifacts/gold/walkup.png

Shops and a carriage door in a rusticated ground floor; French windows with
pediments, shutters and curtains; wrought-iron balconies on the first and top
floors; a modillion cornice; a slate-and-zinc mansard with dormers; party-wall
stacks with their rows of pots, and a skylight over the stair. It stands from
Paris and Madrid to Buenos Aires, Montevideo and Mexico City between about
1860 and 1930. Colour comes from the recipe's wall material.
"""
from pathlib import Path
import math
import random
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.oblique_style import DRIFT  # noqa: E402
from art.voxel import Grid, K, h3, ramp_from, render  # noqa: E402

GROUND, STOREY = 54, 40
LIMESTONE = ['#2c2436', '#4b3f4b', '#6d5f5e', '#918070', '#b3a085', '#cfbc9b', '#e6d6b4', '#f7ecd0']
PLINTH = ['#1f1b28', '#352e3a', '#4d4450', '#675c63', '#827478', '#9d8e8f']
SLATE = ['#111120', '#1b1d31', '#272c45', '#363e5a', '#4a5472', '#626e8c', '#8390aa']
ZINC = ['#1e2130', '#2d3346', '#414a5f', '#586378', '#727e92', '#909bac', '#b4bdc8', '#d6dce2']
IRON = ['#0c0b15', '#161522', '#212133', '#2f3147', '#43475f', '#5d627a']
FRAME = ['#3f3a3c', '#6b6360', '#958a7f', '#bcb09f', '#dad0bc', '#eee7d6', '#faf6ec']
GLASS = ['#0b0f20', '#121a31', '#1b2946', '#283b5e', '#3b5478', '#577496', '#86a3be', '#bfd3e0']
SHUTTER = ['#101816', '#18241f', '#223329', '#2e4435', '#3e5844', '#526f56', '#6c8a6c']
LACE = ['#5c5a66', '#8a8894', '#b3b1b9', '#d4d2d6', '#ebe8e6', '#f8f5ef']
PAPER = [['#1c1420', '#2c1f2a', '#3f2c34', '#553b3e', '#6e4d4a', '#8a6356'],
         ['#121a1e', '#1b262a', '#27363a', '#35494a', '#465e5b', '#5b766f'],
         ['#1e1a14', '#2e281d', '#433a28', '#5a4e34', '#746643', '#908055']]
OAK = ['#1d1117', '#36201f', '#54332a', '#734a36', '#946645', '#b38658', '#cfa671']
PAINT = {'green': ['#07120e', '#0c1d17', '#132b21', '#1c3b2c', '#28503a', '#39674b', '#4f805e'],
         'oxblood': ['#170910', '#280f17', '#3d1520', '#551d27', '#702832', '#8d3840', '#aa4f4f'],
         'navy': ['#080b18', '#0e1428', '#161f3c', '#202d52', '#2e3f6c', '#435688', '#5e72a4']}
GILT = ['#3e2a10', '#644419', '#8f6727', '#b88e3e', '#dcb45e', '#f3d88a', '#fff2c0']
AWN_R = ['#2c0a14', '#4a101c', '#6c1823', '#91222b', '#b53338', '#d24c47', '#e8735e']
AWN_W = ['#4f4538', '#7a6e5c', '#a39680', '#c7bba0', '#e1d6bb', '#f2e9d2', '#fdf7e6']
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
BOTTLES = [['#10301c', '#1f5a34', '#3a8a50'], ['#3a1a0a', '#7a3a12', '#c07028'],
           ['#2a2a40', '#50507a', '#9090c0'], ['#401010', '#902020', '#d05040']]
# Wrought-iron infill, one panel between posts: a lozenge on a pair of bars.
RAIL = ['.#...#.',
        '#.#.#.#',
        '#..#..#',
        '#..#..#',
        '#.#.#.#',
        '.#...#.']


class VoxelWalkup:
    """Reads the urban kit recipe: footprint, stories, bays, seed, facing,
    `modernRole`. The ground floor is shops when the lot faces the street."""

    def __init__(self, recipe, material):
        self.r = recipe
        self.seed = recipe.get('seed', 7)
        self.rng = random.Random(self.seed)
        fw, fh = recipe['footprint']
        self.W, self.D = fw * 16, fh * 16
        self.stories = max(2, recipe.get('stories', 4))
        self.bays = max(2, recipe.get('bays', 4))
        self.facing = recipe.get('facing', 'south')
        self.shops = self.facing == 'south' and recipe.get('modernRole', 'shop') == 'shop'
        wall = material.get('wall') if material else None
        self.stone = LIMESTONE if not wall or recipe.get('limestone') else ramp_from(wall[2])
        self.top = GROUND + STOREY * (self.stories - 1)
        self.sign_paint = ['#1c3b2c', '#551d27', '#202d52'][self.seed % 3]
        self.sign_band = None
        self.smoke = []
        self.windows = []

    # ------------------------------------------------------------ materials
    def materials(self):
        g = self.g
        weather = self.weather

        def stone_tex(i):
            out = np.zeros(len(i['x']))
            front = i['face'] == 1
            xs, zs = np.clip(i['x'], 0, self.W - 1), np.clip(i['z'], 0, weather.shape[1] - 1)
            out -= weather[xs, zs] * front
            return out

        def slate_tex(i):
            course = (i['z'] - 184) // 3
            joint = ((i['z'] - 184) % 3 == 0)
            stagger = (i['x'] + course * 3) % 7 == 0
            tone = h3(i['x'] // 7, course, 0, self.seed) - 0.5
            return -1.0 * joint - 0.7 * stagger + tone * 0.9

        def zinc_tex(i):
            u = i['x'] % 6
            return 1.0 * (u == 3) - 0.8 * (u == 4)

        def louvre(i):
            return -1.0 * (i['z'] % 2 == 1)

        def checker(i):
            return np.where(((i['x'] // 3) + (i['y'] // 2)) % 2 == 0, 2.2, -2.4)

        def course(i):
            return -1.0 * (i['z'] % 4 == 0) - 0.6 * ((i['x'] + (i['z'] // 4) * 3) % 6 == 0)

        self.STONE = g.mat(self.stone, tex=stone_tex, bias=-0.35)
        self.ORN = g.mat(self.stone, tex=stone_tex, bias=-0.1)
        self.PLINTH = g.mat(PLINTH, bias=-0.2)
        self.SLATE = g.mat(SLATE, tex=slate_tex, bias=-0.4)
        self.ZINC = g.mat(ZINC, tex=zinc_tex, bias=-2.5)
        self.ZROLL = g.mat(ZINC, bias=-1.2)
        self.IRON = g.mat(IRON, bias=0.1)
        self.FRAME = g.mat(FRAME, bias=-0.3)
        self.GLASS = g.mat(GLASS, glass=True)
        self.SKY = g.mat(GLASS, glass=True, bias=1.8)
        self.SHOPGLASS = g.mat(GLASS, glass=True, depth=30)
        self.SHUT = g.mat(SHUTTER, tex=louvre, bias=0.2)
        self.LACE = g.mat(LACE, bias=0.4)
        self.PAPER = [g.mat(p, bias=0.6) for p in PAPER]
        self.FLOOR = g.mat(OAK, bias=0.3)
        self.CHECK = g.mat(MARBLE, tex=checker, bias=0.4)
        self.MARBLE = g.mat(MARBLE, bias=0.5)
        self.OAK = g.mat(OAK, bias=-0.2)
        self.DOOR = g.mat(OAK, bias=-1.4)
        self.PAINT = {k: g.mat(v, bias=-0.3) for k, v in PAINT.items()}
        self.GILT = g.mat(GILT, bias=0.3)
        self.AWN = [g.mat(AWN_R, bias=-0.2), g.mat(AWN_W, bias=-0.6)]
        self.TERRA = g.mat(TERRA, bias=-0.8)
        self.BRICK = g.mat(BRICK, tex=course)
        self.STACK = g.mat(self.stone, tex=stone_tex, bias=-0.8)
        self.LEAF = g.mat(LEAF, bias=0.2)
        self.FLOWER = g.mat(FLOWER, bias=0.5)
        self.CARBOY = [g.mat(c, bias=0.6) for c in CARBOY]
        self.BRASS = g.mat(BRASS, bias=0.2)
        self.GLOBE = g.mat(GLOBE, bias=1.5, lamp=True)
        self.PIPE = g.mat(PIPE)
        self.SOOT = g.mat(SOOT)
        self.NAVY = g.mat(PAINT['navy'], bias=0.8)
        self.BOTTLE = [g.mat(b, bias=0.8) for b in BOTTLES]

    # ------------------------------------------------------------ geometry
    def render(self):
        W, D = self.W, self.D
        self.ztop = self.top + 62
        self.g = g = Grid(-6, W + 8, -18, D + 2, self.ztop + 2)
        self.weather = np.zeros((W, self.ztop + 2))
        self.sx0 = 6
        width = W + 14 + DRIFT
        height = int(self.ztop + K * D) + 7
        self.base = base = height - 2
        self.materials()
        self.mass()
        self.ground_floor()
        for s in range(1, self.stories):
            self.storey(s)
        self.cornice()
        self.roof()
        self.pipe()
        self.shade_weather()
        img, buf = render(g, width, height, self.sx0, base, D)
        self.buf = buf
        im = Image.fromarray(img, 'RGBA')
        im = self.outline(im)
        self.im, self.w, self.h = im, width, height
        self.bottom = height - 3
        self.anchor_x = self.sx0 + W // 2
        self.occlusion = [0, 0, width, self.bottom - 1]
        self.glow = self.night(img, buf)
        self.smoke = [[self.sx0 + x + round(y * DRIFT / D), base - z - round(K * y), 'chimney']
                      for x, y, z in self.pots[::4]]
        return im

    def box(self, x0, x1, y0, y1, z0, z1, m, n=0):
        self.g.box(x0, x1, y0, y1, z0, z1, m, n)

    def cut(self, x0, x1, y0, y1, z0, z1):
        self.g.box(x0, x1, y0, y1, z0, z1, 0)

    def mass(self):
        W, D = self.W, self.D
        self.box(0, W, 0, D, 0, self.top, self.STONE)
        # Each floor's rooms, papered, behind a four-voxel front wall.
        for s in range(self.stories):
            f = 0 if s == 0 else GROUND + STOREY * (s - 1)
            h = GROUND if s == 0 else STOREY
            paper = self.PAPER[(self.seed + s) % 3]
            self.box(1, W - 1, 4, 34, f, f + h, paper)
            self.box(1, W - 1, 4, 34, f, f + 1, self.FLOOR)
            self.cut(2, W - 2, 4, 32, f + 1, f + h - 3)

    # ----------------------------------------------------------- the street
    def ground_floor(self):
        W = self.W
        # Channelled rustication: a groove every seventh course.
        for z in range(10, GROUND - 6, 7):
            self.cut(0, W, 0, 1, z, z + 1)
        self.box(0, W, -1, 0, 0, 4, self.PLINTH)
        self.box(0, W, -1, 0, 4, 5, self.PLINTH)
        # The entablature over the shops and the first-floor balcony on it.
        self.box(0, W, -1, 0, GROUND - 7, GROUND - 1, self.ORN)
        self.box(0, W, -2, 0, GROUND - 2, GROUND, self.ORN)
        pitch = W / self.bays
        door_bay = self.bays - 2 if self.bays >= 3 else self.bays - 1
        self.door_ax = int(pitch * (door_bay + 0.5))
        if self.shops:
            a = self.shopfront(5, int(pitch * door_bay) - 5, 'green', awning=True, cafe=True)
            if door_bay < self.bays - 1:
                self.shopfront(int(pitch * (door_bay + 1)) + 3, W - 5, 'oxblood', pharmacy=True)
            self.sign_band = a
        else:
            for k in range(self.bays):
                if k != door_bay:
                    self.window(int(pitch * (k + 0.5)), 14, 34, 12, 0)
        self.carriage_door(self.door_ax)

    def shopfront(self, x0, x1, paint, awning=False, cafe=False, pharmacy=False):
        g, P = self.g, self.PAINT[paint]
        top = GROUND - 18
        self.cut(x0, x1, 0, 6, 3, top)
        # Shop interior: floor, back counter, shelves of stock.
        self.box(x0, x1, 6, 34, 1, 3, self.CHECK if cafe else self.FLOOR)
        self.cut(x0 + 1, x1 - 1, 6, 30, 3, top)
        self.box(x0, x1, 30, 32, 3, top, P)
        rng = random.Random(self.seed + x0)
        for sz in range(16, top - 6, 6):
            self.box(x0 + 2, x1 - 2, 28, 30, sz, sz + 1, self.OAK)
            for x in range(x0 + 3, x1 - 3, 2):
                if rng.random() < 0.8:
                    b = rng.choice(self.BOTTLE)
                    self.box(x, x + 1, 27, 28, sz + 1, sz + 2 + rng.randint(1, 3), b)
        self.box(x0 + 4, x1 - 4, 22, 25, 3, 13, self.OAK)
        self.box(x0 + 3, x1 - 3, 21, 25, 13, 14, self.MARBLE if cafe else self.OAK)
        if cafe:
            for tx in range(x0 + 6, x1 - 6, 11):
                self.box(tx + 2, tx + 3, 9, 10, 3, 12, self.IRON)
                self.box(tx, tx + 5, 8, 11, 12, 13, self.MARBLE)
                self.box(tx - 3, tx - 1, 9, 10, 3, 11, self.OAK)
                self.box(tx - 3, tx - 2, 9, 10, 11, 16, self.OAK)
        for lx in range(x0 + 8, x1 - 6, 16):
            self.box(lx + 1, lx + 2, 11, 12, top - 7, top - 1, self.BRASS)
            self.box(lx, lx + 3, 10, 13, top - 11, top - 7, self.GLOBE)
        if pharmacy:
            for k, cx in enumerate((x0 + 6, x1 - 7)):
                self.box(cx, cx + 1, 8, 9, 11, 16, self.BRASS)
                g.fill(cx - 3, cx + 4, 6, 12, 16, 23,
                       lambda X, Y, Z, cx=cx: (X - cx) ** 2 + ((Y - 8.5) * 1.3) ** 2 + (Z - 19) ** 2 <= 10,
                       self.CARBOY[k])
        # The front: pilasters, stall riser, plate glass on slim bars, fascia.
        self.box(x0, x1, 5, 6, 11, top - 1, self.SHOPGLASS)
        for bx in range(x0 + 3, x1 - 3, 12)[1:]:
            self.box(bx, bx + 1, 4, 6, 11, top - 1, P)
        self.box(x0, x1, 4, 6, 3, 11, P)
        self.box(x0 + 2, x1 - 2, 3, 4, 5, 10, P)
        self.box(x0, x1, 4, 6, top - 2, top, P)
        door = x1 - 13 if cafe else x0 + 3
        self.cut(door, door + 10, 3, 7, 3, top - 2)
        self.box(door, door + 10, 6, 7, 3, top - 2, P)
        self.box(door + 1, door + 9, 5, 6, 14, top - 4, self.SHOPGLASS)
        self.box(door + 1, door + 9, 5, 6, 4, 13, P)
        self.box(door + 7, door + 8, 4, 5, 18, 20, self.BRASS)
        for px in (x0, x1 - 3):
            self.box(px, px + 3, -1, 2, 3, top, P)
            self.box(px - 1, px + 4, -2, 2, top - 3, top, P)
        # The sign board: lipped top and bottom, a gilt rule inside each lip,
        # six clear rows between for the lettering the scene paints on.
        self.box(x0 - 1, x1 + 1, -2, 1, top, GROUND - 7, P)
        self.box(x0 - 2, x1 + 2, -3, 1, top, top + 1, P)
        self.box(x0 - 2, x1 + 2, -3, 1, GROUND - 8, GROUND - 7, P)
        self.box(x0 + 1, x1 - 1, -3, -2, top + 1, top + 2, self.GILT)
        self.box(x0 + 1, x1 - 1, -3, -2, GROUND - 9, GROUND - 8, self.GILT)
        band = [self.sx0 + x0 + 2, self.base - (GROUND - 11), x1 - x0 - 4, 6]
        if awning:
            self.awning(x0 + 1, x1 - 1, top)
        return band

    def base_row(self, z, y=0):
        """Sprite row of the top of voxel row z - 1 on a face at depth y."""
        return self.base - z - round(K * y)

    def awning(self, x0, x1, z):
        g = self.g
        n = g.normal((0, -0.45, 1))
        reach = 14
        for x in range(x0, x1):
            m = self.AWN[((x - x0) // 4) % 2]
            g.fill(x, x + 1, -reach, 1, z - 9, z + 1,
                   lambda X, Y, Z: (Z <= z + Y * 6 / reach) & (Z >= z + Y * 6 / reach - 1.5), m, n)
            k = (x - x0) % 6
            drop = 4 if k in (1, 2, 3, 4) else 3
            self.box(x, x + 1, -reach, -reach + 1, z - 6 - drop + 3, z - 6, m)
        for x in (x0, x1 - 1):
            g.fill(x, x + 1, -reach, 0, z - 14, z,
                   lambda X, Y, Z: np.abs(Z - (z - 13 - Y * 7 / reach)) < 0.8, self.IRON)

    def carriage_door(self, ax):
        g = self.g
        x0, x1 = ax - 10, ax + 10
        spring, r = 34, 10
        arch = lambda X, Y, Z: (Z < spring) | ((X + 0.5 - ax) ** 2 + (Z + 0.5 - spring) ** 2 <= r * r)
        g.fill(x0 - 3, x1 + 3, -1, 0, 1, spring + r + 3,
               lambda X, Y, Z: ~((Z < spring) & (X >= x0) & (X < x1)) &
               ((X + 0.5 - ax) ** 2 + (Z + 0.5 - spring) ** 2 <= (r + 3) ** 2) & (Z >= spring - 1), self.ORN)
        g.fill(x0, x1, -1, 6, 1, spring + r, arch, 0)
        g.fill(x0, x1, 6, 9, 1, spring + r, arch, self.DOOR)
        # Raised panels on both leaves, the wicket in the right-hand one.
        for lx in (x0 + 2, ax + 2):
            self.box(lx, lx + 6, 5, 6, 4, 14, self.DOOR)
            self.box(lx, lx + 6, 5, 6, 17, 30, self.DOOR)
        self.cut(ax, ax + 1, 5, 7, 1, spring)
        self.cut(ax, x1, 6, 7, 25, 26)
        self.box(ax - 2, ax - 1, 5, 6, 18, 21, self.BRASS)
        self.box(ax + 1, ax + 2, 5, 6, 18, 21, self.BRASS)
        # Fanlight: glass behind a sunburst of iron.
        g.fill(x0, x1, 6, 7, spring, spring + r, arch, self.GLASS)
        g.fill(x0, x1, 5, 6, spring, spring + r,
               lambda X, Y, Z: arch(X, Y, Z) & (((np.degrees(np.arctan2(Z + 0.5 - spring, X + 0.5 - ax)) + 11) % 30 < 4)
                                                | ((X + 0.5 - ax) ** 2 + (Z + 0.5 - spring) ** 2 < 9)), self.IRON)
        self.box(x0, x1, 5, 6, spring - 1, spring, self.DOOR)
        self.box(ax - 2, ax + 2, -2, 0, spring + r - 1, spring + r + 5, self.ORN)
        self.box(x0 - 4, x1 + 4, -4, 0, 0, 1, self.PLINTH)
        self.cut(x0, x1, -1, 0, 1, 5)
        self.door_x = self.sx0 + ax + 5
        # Lantern on a bracket, and the house number.
        lx = x1 + 5
        self.box(lx, lx + 1, -5, 0, 38, 39, self.IRON)
        self.box(lx - 1, lx + 2, -6, -3, 30, 31, self.IRON)
        self.box(lx - 1, lx + 2, -6, -3, 31, 36, self.GLOBE)
        self.box(lx - 2, lx + 3, -7, -2, 36, 37, self.IRON)
        self.box(lx, lx + 1, -5, -4, 37, 39, self.IRON)
        self.box(x0 - 7, x0 - 4, -1, 0, 36, 38, self.NAVY)

    # ------------------------------------------------------------ the floors
    def storey(self, s):
        W = self.W
        f = GROUND + STOREY * (s - 1)
        pitch = W / self.bays
        top = s == self.stories - 1
        balcony = s == 1 or top
        h = 27 if s == 1 else 25 if not top else 23
        if balcony:
            self.balcony(3, W - 6, f)
        for k in range(self.bays):
            ax = int(pitch * (k + 0.5))
            self.window(ax, 14, h, f + 3, s, head='pediment' if s == 1 else 'hood' if not top else 'key',
                        segmental=k % 2 == 1, balconette=not balcony)
        if not balcony:
            self.box(0, W, -1, 0, f, f + 2, self.ORN)
            self.box(0, W, -1, 0, f + STOREY - 2, f + STOREY, self.ORN)

    def window(self, ax, w, h, z0, s, head='key', segmental=False, balconette=False):
        g, rng = self.g, self.rng
        x0, x1 = ax - w // 2, ax + w // 2
        z1 = z0 + h
        self.windows.append((x0, x1, z0, z1))
        # Architrave and sill.
        self.box(x0 - 2, x1 + 2, -1, 0, z0 - 1, z1 + 2, self.ORN)
        self.box(x0 - 3, x1 + 3, -2, 0, z0 - 2, z0, self.ORN)
        self.cut(x0, x1, -2, 4, z0, z1)
        self.box(x0 - 1, x1 + 1, 0, 3, z0 - 1, z0, self.ORN)
        # Two casement leaves, three panes each, a transom light over.
        self.box(x0, x1, 3, 4, z0, z1, self.GLASS)
        fr = self.FRAME
        self.box(x0, x1, 2, 4, z0, z0 + 1, fr)
        self.box(x0, x1, 2, 4, z1 - 1, z1, fr)
        self.box(x0, x0 + 1, 2, 4, z0, z1, fr)
        self.box(x1 - 1, x1, 2, 4, z0, z1, fr)
        self.box(ax - 1, ax + 1, 2, 4, z0, z1, fr)
        tr = z1 - max(6, h // 4)
        self.box(x0, x1, 2, 4, tr, tr + 1, fr)
        for zz in range(z0 + (tr - z0) // 3, tr - 2, (tr - z0) // 3):
            self.box(x0, x1, 3, 4, zz, zz + 1, fr)
        state = rng.random()
        if state < 0.22 and s:
            self.box(x0, x1, 1, 2, z0, z1, self.SHUT)
            self.box(ax, ax + 1, 1, 2, z0, z1, fr)
        elif state < 0.45 and s:
            side = (x0, ax) if rng.random() < 0.5 else (ax, x1)
            self.box(side[0], side[1], 1, 2, z0, z1, self.SHUT)
        elif rng.random() < 0.7:
            lace = self.LACE
            tie = z0 + h // 3
            for zz in range(z0, tr):
                spread = 3 if zz > tie else 2
                self.box(x0 + 1, x0 + 1 + spread, 4, 5, zz, zz + 1, lace)
                self.box(x1 - 1 - spread, x1 - 1, 4, 5, zz, zz + 1, lace)
        # Heads.
        if head == 'pediment':
            # A raking cornice proud of a recessed tympanum, on a flat one.
            half = w / 2 + 4
            if segmental:
                outer = lambda X, Z: ((X + 0.5 - ax) / half) ** 2 + ((Z - z1 - 3.5) / 7) ** 2 <= 1
                inner = lambda X, Z: ((X + 0.5 - ax) / (half - 2)) ** 2 + ((Z - z1 - 3.5) / 5) ** 2 <= 1
            else:
                outer = lambda X, Z: (Z - z1 - 4) * 1.6 <= half - np.abs(X + 0.5 - ax)
                inner = lambda X, Z: (Z - z1 - 4) * 1.6 <= half - 3.2 - np.abs(X + 0.5 - ax)
            g.fill(x0 - 5, x1 + 5, -3, 0, z1 + 4, z1 + 12, lambda X, Y, Z: outer(X, Z) & ~inner(X, Z), self.ORN)
            g.fill(x0 - 5, x1 + 5, -1, 0, z1 + 4, z1 + 12, lambda X, Y, Z: inner(X, Z), self.STONE)
            self.box(x0 - 5, x1 + 5, -3, 0, z1 + 2, z1 + 4, self.ORN)
            self.box(x0 - 5, x1 + 5, -4, -2, z1 + 3, z1 + 4, self.ORN)
        elif head == 'hood':
            self.box(x0 - 4, x1 + 4, -3, 0, z1 + 2, z1 + 5, self.ORN)
            self.box(x0 - 4, x1 + 4, -4, -2, z1 + 4, z1 + 5, self.ORN)
            for cx in (x0 - 3, x1 + 1):
                self.box(cx, cx + 2, -2, 0, z1 - 4, z1 + 2, self.ORN)
        else:
            self.box(ax - 2, ax + 2, -2, 0, z1 - 2, z1 + 4, self.ORN)
        if balconette:
            self.box(x0 - 2, x1 + 2, -3, 0, z0 - 2, z0, self.ORN)
            self.railing(x0 - 1, x1 + 1, -2, z0, 9)

    def balcony(self, x0, x1, f):
        g = self.g
        self.box(x0, x1, -6, 0, f, f + 3, self.ORN)
        self.box(x0 - 1, x1 + 1, -7, -5, f + 2, f + 3, self.ORN)
        pitch = self.W / self.bays
        for k in range(self.bays + 1):
            cx = min(max(int(pitch * k) - 1, x0 + 1), x1 - 3)
            g.fill(cx, cx + 3, -6, 0, f - 9, f,
                   lambda X, Y, Z: Y >= -1 - (Z - (f - 9)) * 0.55, self.ORN)
        self.railing(x0 + 1, x1 - 1, -6, f + 3, 10)
        for x in (x0, x1 - 1):
            self.railing(x, x + 1, -6, f + 3, 10, along_y=True)
        # Geraniums in a few boxes, and a chair put out.
        rng = random.Random(self.seed * 3 + f)
        for k in range(self.bays):
            if rng.random() < 0.55:
                ax = int(pitch * (k + 0.5))
                bx = ax - 6 + rng.randint(-2, 2)
                self.box(bx, bx + 12, -5, -3, f + 3, f + 6, self.TERRA)
                for i in range(50):
                    x = bx + rng.randint(0, 11)
                    y = rng.randint(-5, -3)
                    z = f + 6 + rng.randint(0, 3)
                    self.box(x, x + 1, y, y + 1, z, z + 1, self.FLOWER if rng.random() < 0.3 else self.LEAF)

    def railing(self, x0, x1, y, z0, h, along_y=False):
        g = self.g
        ph = len(RAIL)
        if along_y:
            self.box(x0, x1, y, 0, z0 + h - 1, z0 + h, self.IRON)
            for yy in range(y, 0, 2):
                self.box(x0, x1, yy, yy + 1, z0, z0 + h, self.IRON)
            return
        self.box(x0, x1, y - 1, y + 1, z0 + h - 1, z0 + h, self.IRON)
        self.box(x0, x1, y, y + 1, z0 + h - 2, z0 + h - 1, self.IRON)
        self.box(x0, x1, y, y + 1, z0, z0 + 1, self.IRON)
        for x in range(x0, x1):
            u = (x - x0) % 8
            if u == 0:
                self.box(x, x + 1, y, y + 1, z0, z0 + h, self.IRON)
                continue
            for v in range(ph):
                zz = z0 + 1 + (h - 3 - ph) // 2 + v
                if RAIL[ph - 1 - v][u - 1] == '#':
                    self.box(x, x + 1, y, y + 1, zz, zz + 1, self.IRON)

    # --------------------------------------------------------------- the top
    def cornice(self):
        W, t = self.W, self.top
        self.box(0, W, -1, 0, t - 8, t, self.ORN)
        self.box(0, W, -2, 0, t, t + 2, self.ORN)
        for x in range(1, W - 1, 5):
            self.g.fill(x, x + 2, -7, 0, t + 1, t + 5,
                        lambda X, Y, Z: Y >= -7 + (t + 4 - Z) * 1.2, self.ORN)
        self.box(0, W, -8, 0, t + 5, t + 8, self.ORN)
        self.box(0, W, -7, 0, t + 8, t + 10, self.ORN)
        self.box(0, W, -8, -6, t + 10, t + 11, self.ZROLL)
        self.box(0, W, -6, 2, t + 9, t + 10, self.ZINC)

    def roof(self):
        g, W, D = self.g, self.W, self.D
        b = self.top + 10
        lower, run = 30, 12
        brk = b + lower
        ridge = 8
        front = g.normal((0, -lower, run))
        back = g.normal((0, lower, run))
        inner = D - 2 * (run + 1)
        up_f = g.normal((0, -ridge, inner / 2))
        up_b = g.normal((0, ridge, inner / 2))
        mid = D / 2

        def slope_y(Z):
            return 1 + (Z - b) * run / lower

        g.fill(0, W, 1, D, b, brk, lambda X, Y, Z: (Y >= slope_y(Z)) & (Y <= D - 1 - (Z - b) * run / lower),
               self.SLATE, front)
        g.fill(0, W, 1, D, b, brk, lambda X, Y, Z: Y > mid, self.SLATE, back)
        # The zinc upper roof, its standing seams, and the roll at the break.
        top = lambda Y: brk + ridge * (1 - np.abs(Y + 0.5 - mid) / (mid - run - 1))
        g.fill(0, W, run + 1, D - run - 1, brk, brk + ridge + 1, lambda X, Y, Z: Z < top(Y), self.ZINC, up_f)
        g.fill(0, W, int(mid), D - run - 1, brk, brk + ridge + 1, lambda X, Y, Z: Z < top(Y), self.ZINC, up_b)
        self.box(0, W, run, run + 2, brk - 1, brk + 1, self.ZROLL)
        pitch = W / self.bays
        for k in range(self.bays):
            self.dormer(int(pitch * (k + 0.5)), b, slope_y)
        self.skylight(int(pitch * (self.bays // 2)) - 10, int(mid) - 14, brk, top)
        # Party walls stand proud of the roof and carry the flues.
        self.pots = []
        for x0 in (0, W - 7):
            g.fill(x0, x0 + 7, 0, D, b, brk + 30,
                   lambda X, Y, Z: (Y >= slope_y(Z) - 2) & (Y <= D + 1 - (Z - b) * run / lower)
                   & (Z <= brk + 3 + ridge * (1 - np.abs(Y + 0.5 - mid) / (mid - run - 1))), self.STACK)
            sx = min(x0, W - 10)
            for y0, y1 in ((run + 8, run + 30), (D - run - 30, D - run - 8)):
                self.box(sx, sx + 10, y0, y1, brk, brk + 14, self.STACK)
                self.box(sx, sx + 10, y0, y1, brk + 10, brk + 14, self.BRICK)
                self.box(sx - 1, sx + 11, y0 - 1, y1 + 1, brk + 14, brk + 16, self.STACK)
                for y in range(y0 + 1, y1 - 3, 6):
                    for px in (sx + 1, sx + 6):
                        self.box(px, px + 3, y, y + 3, brk + 16, brk + 21, self.TERRA)
                        self.box(px - 1, px + 4, y, y + 3, brk + 19, brk + 20, self.TERRA)
                        self.box(px + 1, px + 2, y + 1, y + 2, brk + 18, brk + 21, self.SOOT)
                        self.pots.append((px + 1, y + 1, brk + 21))

    def dormer(self, ax, b, slope_y):
        g = self.g
        x0, x1 = ax - 8, ax + 8
        z0, z1 = b + 3, b + 26
        yf = 4
        self.box(x0, x1, yf, 24, z0, z1, self.ZINC)
        self.box(x0 + 1, x1 - 1, yf - 1, yf + 2, z0, z1, self.ORN)
        self.box(x0 - 1, x1 + 1, yf - 2, yf + 1, z0 - 1, z0 + 1, self.ORN)
        self.box(ax - 4, ax + 4, yf - 1, yf + 8, z0 + 3, z1 - 3, 0)
        self.box(ax - 4, ax + 4, yf + 2, yf + 3, z0 + 3, z1 - 3, self.GLASS)
        self.box(ax - 4, ax + 4, yf + 1, yf + 3, z0 + 3, z0 + 4, self.FRAME)
        self.box(ax - 4, ax + 4, yf + 1, yf + 3, z1 - 4, z1 - 3, self.FRAME)
        self.box(ax - 1, ax + 1, yf + 1, yf + 3, z0 + 3, z1 - 3, self.FRAME)
        self.box(ax - 4, ax - 3, yf + 1, yf + 3, z0 + 3, z1 - 3, self.FRAME)
        self.box(ax + 3, ax + 4, yf + 1, yf + 3, z0 + 3, z1 - 3, self.FRAME)
        self.box(ax - 4, ax + 4, yf + 1, yf + 3, z0 + 12, z0 + 13, self.FRAME)
        self.box(x0 + 1, x1 - 1, yf + 3, yf + 12, z0 + 1, z1 - 1, self.PAPER[self.seed % 3])
        self.box(x0 + 2, x1 - 2, yf + 3, yf + 11, z0 + 1, z0 + 2, self.FLOOR)
        self.cut(x0 + 2, x1 - 2, yf + 3, yf + 10, z0 + 2, z1 - 2)
        # A segmental pediment over it and a zinc cap back to the roof.
        g.fill(x0 - 1, x1 + 1, yf - 2, yf + 1, z1, z1 + 6,
               lambda X, Y, Z: ((X + 0.5 - ax) / 9.5) ** 2 + ((Z + 0.5 - z1) / 6) ** 2 <= 1, self.ORN)
        g.fill(x0, x1, yf + 1, 26, z1, z1 + 5,
               lambda X, Y, Z: ((X + 0.5 - ax) / 8.5) ** 2 + ((Z + 0.5 - z1) / 5) ** 2 <= 1, self.ZINC)

    def skylight(self, x0, y0, brk, top):
        g = self.g
        x1, y1 = x0 + 20, y0 + 22
        self.box(x0, x1, y0, y1, brk, brk + 12, self.ZINC)
        cx = (y0 + y1) / 2
        g.fill(x0 + 1, x1 - 1, y0 + 1, y1 - 1, brk + 12, brk + 18,
               lambda X, Y, Z: Z < brk + 12 + 6 * (1 - np.abs(Y + 0.5 - cx) / ((y1 - y0) / 2)), self.SKY)
        g.fill(x0, x1, y0, y1, brk + 12, brk + 19,
               lambda X, Y, Z: ((X - x0) % 4 == 0) & (Z < brk + 13 + 6 * (1 - np.abs(Y + 0.5 - cx) / ((y1 - y0) / 2))),
               self.IRON)
        self.box(x0, x1, int(cx), int(cx) + 1, brk + 17, brk + 19, self.ZROLL)
        self.box(x0 + 1, x1 - 1, y0 + 1, y1 - 1, brk - 20, brk + 12, 0)
        self.box(x0 + 1, x1 - 1, y0 + 1, y1 - 1, brk - 21, brk - 20, self.CHECK)

    def pipe(self):
        W = self.W
        x = W - 5
        self.box(x, x + 2, -2, 0, 1, self.top + 5, self.PIPE)
        self.box(x - 1, x + 3, -3, 0, self.top - 6, self.top, self.PIPE)
        for z in range(20, self.top - 6, 30):
            self.box(x - 1, x + 3, -3, 0, z, z + 1, self.PIPE)
        self.box(x - 1, x + 3, -3, 0, 1, 3, self.PIPE)

    def shade_weather(self):
        """Rain streaks run down from each sill and grime gathers at the foot."""
        rng = random.Random(self.seed + 11)
        wmap = self.weather
        for x0, x1, z0, z1 in self.windows:
            for x in range(x0 - 2, x1 + 2):
                if 0 <= x < self.W and rng.random() < 0.45:
                    n = rng.randint(4, 16)
                    wmap[x, max(0, z0 - 3 - n):z0 - 3] = 1
        wmap[:, 0:9] = np.maximum(wmap[:, 0:9], (np.arange(self.W)[:, None] * 7 % 5 < 2) * 1.0)

    # --------------------------------------------------------------- output
    def outline(self, im):
        a = np.array(im)
        alpha = a[..., 3] > 0
        ink = np.array([18, 12, 28])
        out = a.copy()
        h, w = alpha.shape
        pad = np.pad(alpha, 1)
        right = alpha & ~pad[1:-1, 2:]
        below = alpha & ~pad[2:, 1:-1]
        left = alpha & ~pad[1:-1, :-2]
        above = alpha & ~pad[:-2, 1:-1]
        dark = right | below
        lit = (left | above) & ~dark
        out[dark, :3] = (a[dark, :3] * 0.3 + ink * 0.7).astype(np.uint8)
        out[lit, :3] = (a[lit, :3] * 0.6 + ink * 0.4).astype(np.uint8)
        img = Image.fromarray(out, 'RGBA')
        for x in range(self.sx0, self.sx0 + self.W + DRIFT):
            img.putpixel((x, h - 2), (30, 34, 26, 150))
        return img

    def night(self, img, buf):
        """Rooms lit after dark: some windows' dark glass, and every lamp."""
        h, w = buf['glass'].shape
        glow = np.zeros((h, w, 4), np.uint8)
        lamp = np.isin(buf['mat'], [i for i, m in enumerate(self.g.mats) if m and m.lamp])
        coords = buf['coords']
        rng = random.Random(self.seed + 5)
        lit = {}
        for y in range(h):
            for x in range(w):
                if buf['glass'][y, x]:
                    key = (x // 7, (y - 0) // 36)
                    if key not in lit:
                        lit[key] = rng.random() < 0.55
                    if lit[key]:
                        warm = (255, 200, 110, 230) if (x + y) % 5 else (255, 226, 160, 240)
                        glow[y, x] = warm
        glow[lamp] = (255, 238, 180, 255)
        return Image.fromarray(glow, 'RGBA')


def demo_recipe(**k):
    r = {'footprint': [8, 7], 'stories': 4, 'bays': 4, 'seed': 7, 'facing': 'south', 'modernRole': 'shop',
         'limestone': True}
    r.update(k)
    return r


def make(out, zoom=2):
    """Limestone by day and by night, then the recipe colourways."""
    import json
    from art.reference import current_adult_d
    root = Path(__file__).resolve().parent.parent.parent
    mats = json.loads((root / 'src/content/graphics/buildings.json').read_text())['materials']
    mats.update(json.loads((root / 'src/content/graphics/urban.json').read_text()).get('materials', {}))
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    lime = VoxelWalkup(demo_recipe(), None)
    cells = [lime.render(), night(lime)]
    for wall, seed in (('modern-sky', 3), ('modern-mint', 12), ('modern-ochre', 5)):
        cells.append(VoxelWalkup(demo_recipe(seed=seed, limestone=False), mats[wall]).render())
    pad = 10
    W = sum(c.width for c in cells) + pad * (len(cells) + 1) + adult.width + pad
    H = max(c.height for c in cells) + pad * 2
    sheet = Image.new('RGBA', (W, H), '#8f8e84')
    sheet.alpha_composite(Image.new('RGBA', (W, pad + 2), '#7b747c'), (0, H - pad - 2))
    x = pad
    for c in cells:
        sheet.alpha_composite(c, (x, H - pad - c.height))
        x += c.width + pad
    sheet.alpha_composite(adult, (x, H - pad - adult.height - 2))
    sheet.resize((W * zoom, H * zoom), Image.NEAREST).save(out)
    cells[0].save(str(out).replace('.png', '-1x.png'))


def night(b):
    dark = np.array(b.im).astype(float)
    dark[..., :3] *= np.array([0.30, 0.34, 0.52])
    im = Image.fromarray(dark.astype(np.uint8))
    im.alpha_composite(b.glow)
    return im


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/gold/walkup.png')
