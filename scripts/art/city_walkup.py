"""The Belle Epoque walk-up, built in voxels.

    .venv/bin/python scripts/art/city_walkup.py artifacts/gold/walkup.png

Shops and a carriage door in a rusticated ground floor; French windows with
pediments, shutters and curtains; wrought-iron balconies on the first and top
floors; a modillion cornice. Three storeys and more carry a slate-and-zinc
mansard with dormers and party-wall stacks; a lower house has a flat roof
terrace behind a balustrade, as in Seville, Buenos Aires or Mexico City, and
iron grilles on its street windows. It stands from Paris and Madrid to Buenos
Aires, Montevideo and Mexico City between about 1860 and 1930. Colour comes
from the recipe's wall material.
"""
from pathlib import Path
import random
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.voxel import h3  # noqa: E402
from art.voxel_kit import (  # noqa: E402
    GROUND, STOREY, SLATE, ZINC, BRICK, VoxelBuilding,
)

BALDOSA = ['#2e1512', '#4c2119', '#6e3122', '#8f432c', '#aa5838', '#c27048', '#d88c60']


class VoxelWalkup(VoxelBuilding):
    """Reads the urban kit recipe: footprint, stories, bays, seed, facing,
    `modernRole`. The ground floor is shops when the lot faces the street."""

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.top = GROUND + STOREY * (self.stories - 1)
        self.mansard = self.stories >= 3

    def ztop(self):
        return self.top + (62 if self.mansard else 40)

    def materials(self):
        super().materials()
        g = self.g

        def slate_tex(i):
            course = (i['z'] - self.top - 10) // 3
            joint = ((i['z'] - self.top - 10) % 3 == 0)
            stagger = (i['x'] + course * 3) % 7 == 0
            tone = h3(i['x'] // 7, course, 0, self.seed) - 0.5
            return -1.0 * joint - 0.7 * stagger + tone * 0.9

        def zinc_tex(i):
            u = i['x'] % 6
            return 1.0 * (u == 3) - 0.8 * (u == 4)

        def baldosa(i):
            return -1.2 * ((i['x'] % 6 == 0) | (i['y'] % 8 == 0)) + (h3(i['x'] // 6, i['y'] // 8, 5, self.seed) - 0.5)

        self.SLATE = g.mat(SLATE, tex=slate_tex, bias=-0.4)
        self.ZINC = g.mat(ZINC, tex=zinc_tex, bias=-2.5)
        self.ZROLL = g.mat(ZINC, bias=-1.2)
        self.STACK = g.mat(self.wall_ramp, tex=self.tex['stone'], bias=-0.8)
        self.BALDOSA = g.mat(BALDOSA, tex=baldosa, bias=-1.9)
        self.BRICK = g.mat(BRICK, tex=self.tex['course'])

    def build(self):
        self.mass()
        self.ground_floor()
        for s in range(1, self.stories):
            self.storey(s)
        self.cornice()
        if self.mansard:
            self.roof()
        else:
            self.terrace()
        self.pipe(self.W - 5, self.top + 5)

    def mass(self):
        W, D = self.W, self.D
        self.box(0, W, 0, D, 0, self.top, self.STONE)
        for s in range(self.stories):
            f = 0 if s == 0 else GROUND + STOREY * (s - 1)
            self.rooms(f, GROUND if s == 0 else STOREY)

    # ----------------------------------------------------------- the street
    def life(self):
        rng = random.Random(self.seed + 71)
        upper = range(1, self.stories)
        leaners = self.leaners(3, rng, upper)
        specs = [self.lean_out(w, rng) for w in leaners[:2]]
        specs += [self.curtain_twitch(w) for w in leaners[2:]]
        rest = [w for w in self.windows if w['storey'] in upper and w not in leaners]
        specs += [self.night_shutters(w, rng) for w in rng.sample(rest, min(3, len(rest)))]
        specs += self.shop_life()
        if not self.mansard:
            specs.append({'k': 'loop', 'states': [{'wind': p} for p in range(4)], 'ms': 280})
        return specs

    def ground_floor(self):
        W = self.W
        # Channelled rustication: a groove every seventh course.
        for z in range(10, GROUND - 6, 7):
            self.cut(0, W, 0, 1, z, z + 1)
        self.box(0, W, -1, 0, 0, 5, self.PLINTH)
        self.box(0, W, -1, 0, GROUND - 7, GROUND - 1, self.ORN)
        self.box(0, W, -2, 0, GROUND - 2, GROUND, self.ORN)
        pitch = W / self.bays
        door_bay = max(0, self.bays - 2) if self.bays >= 3 else self.bays - 1
        self.door_ax = int(pitch * (door_bay + 0.5))
        stocks = ['cafe', 'grocer', 'draper', 'hardware', 'pharmacy']
        if self.shops:
            if door_bay > 0:
                self.sign_band = self.shopfront(5, int(pitch * door_bay) - 5, self.pick(['green', 'navy', 'teal'], 2),
                                                stock=self.pick(stocks[:4], 3), awning=self.seed % 4)
            if door_bay < self.bays - 1:
                band = self.shopfront(int(pitch * (door_bay + 1)) + 3, W - 5, self.pick(['oxblood', 'mustard'], 4),
                                      stock=self.pick(['pharmacy', 'draper', 'grocer'], 5), door='left')
                self.sign_band = self.sign_band or band
        else:
            for k in range(self.bays):
                if k != door_bay:
                    ax = int(pitch * (k + 0.5))
                    self.window(ax - 7, ax + 7, 12, 44, kind='casement', shutters='reveal')
                    self.reja(ax - 7, ax + 7, 12, 44)
        self.carriage_door(self.door_ax)

    def reja(self, x0, x1, z0, z1):
        """The iron cage a street window wears from Seville to Lima: bars
        standing proud of the wall on a projecting sill, a cresting on top."""
        self.box(x0 - 2, x1 + 2, -4, 0, z0 - 2, z0, self.ORN)
        for x in range(x0 - 1, x1 + 1, 2):
            self.box(x, x + 1, -3, -2, z0, z1 + 1, self.IRON)
        for z in (z0 + 8, z1 - 8):
            self.box(x0 - 1, x1 + 1, -3, -2, z, z + 1, self.IRON)
        self.box(x0 - 1, x1 + 1, -3, 0, z1 + 1, z1 + 2, self.IRON)
        ax = (x0 + x1) / 2
        self.fill(x0 - 1, x1 + 1, -3, -2, z1 + 2, z1 + 6,
                  lambda X, Y, Z: ((X + 0.5 - ax) ** 2 / ((x1 - x0) / 2) ** 2 + (Z - z1 - 2) ** 2 / 16 <= 1)
                  & ((X + Z) % 3 == 0), self.IRON)

    def carriage_door(self, ax):
        x0, x1 = ax - 10, ax + 10
        spring, r = 34, 10
        arch = lambda X, Y, Z: (Z < spring) | ((X + 0.5 - ax) ** 2 + (Z + 0.5 - spring) ** 2 <= r * r)
        self.fill(x0 - 3, x1 + 3, -1, 0, 1, spring + r + 3,
                  lambda X, Y, Z: ~((Z < spring) & (X >= x0) & (X < x1)) &
                  ((X + 0.5 - ax) ** 2 + (Z + 0.5 - spring) ** 2 <= (r + 3) ** 2) & (Z >= spring - 1), self.ORN)
        self.fill(x0, x1, -1, 6, 1, spring + r, arch, 0)
        self.fill(x0, x1, 6, 9, 1, spring + r, arch, self.DOOR)
        # Raised panels on both leaves, the wicket in the right-hand one.
        for lx in (x0 + 2, ax + 2):
            self.box(lx, lx + 6, 5, 6, 4, 14, self.DOOR)
            self.box(lx, lx + 6, 5, 6, 17, 30, self.DOOR)
        self.cut(ax, ax + 1, 5, 7, 1, spring)
        self.cut(ax, x1, 6, 7, 25, 26)
        self.box(ax - 2, ax - 1, 5, 6, 18, 21, self.BRASS)
        self.box(ax + 1, ax + 2, 5, 6, 18, 21, self.BRASS)
        # Fanlight: glass behind a sunburst of iron.
        self.fill(x0, x1, 6, 7, spring, spring + r, arch, self.GLASS)
        self.fill(x0, x1, 5, 6, spring, spring + r,
                  lambda X, Y, Z: arch(X, Y, Z) & (((np.degrees(np.arctan2(Z + 0.5 - spring, X + 0.5 - ax)) + 11) % 30 < 4)
                                                   | ((X + 0.5 - ax) ** 2 + (Z + 0.5 - spring) ** 2 < 9)), self.IRON)
        self.box(x0, x1, 5, 6, spring - 1, spring, self.DOOR)
        self.box(ax - 2, ax + 2, -2, 0, spring + r - 1, spring + r + 5, self.ORN)
        self.box(x0 - 4, x1 + 4, -4, 0, 0, 1, self.PLINTH)
        self.cut(x0, x1, -1, 0, 1, 5)
        self.door_x = self.sx0 + ax + 5
        self.lantern(x1 + 5, 30)
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
            x0, x1 = ax - 7, ax + 7
            z0 = f + 3
            self.window(x0, x1, z0, z0 + h, storey=s)
            self.head(ax, x0, x1, z0 + h, 'pediment' if s == 1 else 'hood' if not top else 'key', k % 2 == 1)
            if not balcony:
                self.box(x0 - 2, x1 + 2, -3, 0, z0 - 2, z0, self.ORN)
                self.railing(x0 - 1, x1 + 1, -2, z0, 9)
        if not balcony:
            self.box(0, W, -1, 0, f, f + 2, self.ORN)
            self.box(0, W, -1, 0, f + STOREY - 2, f + STOREY, self.ORN)

    def head(self, ax, x0, x1, z1, kind, segmental):
        w = x1 - x0
        if kind == 'pediment':
            # A raking cornice proud of a recessed tympanum, on a flat one.
            half = w / 2 + 4
            if segmental:
                outer = lambda X, Z: ((X + 0.5 - ax) / half) ** 2 + ((Z - z1 - 3.5) / 7) ** 2 <= 1
                inner = lambda X, Z: ((X + 0.5 - ax) / (half - 2)) ** 2 + ((Z - z1 - 3.5) / 5) ** 2 <= 1
            else:
                outer = lambda X, Z: (Z - z1 - 4) * 1.6 <= half - np.abs(X + 0.5 - ax)
                inner = lambda X, Z: (Z - z1 - 4) * 1.6 <= half - 3.2 - np.abs(X + 0.5 - ax)
            self.fill(x0 - 5, x1 + 5, -3, 0, z1 + 4, z1 + 12, lambda X, Y, Z: outer(X, Z) & ~inner(X, Z), self.ORN)
            self.fill(x0 - 5, x1 + 5, -1, 0, z1 + 4, z1 + 12, lambda X, Y, Z: inner(X, Z), self.STONE)
            self.box(x0 - 5, x1 + 5, -3, 0, z1 + 2, z1 + 4, self.ORN)
            self.box(x0 - 5, x1 + 5, -4, -2, z1 + 3, z1 + 4, self.ORN)
        elif kind == 'hood':
            self.box(x0 - 4, x1 + 4, -3, 0, z1 + 2, z1 + 5, self.ORN)
            self.box(x0 - 4, x1 + 4, -4, -2, z1 + 4, z1 + 5, self.ORN)
            for cx in (x0 - 3, x1 + 1):
                self.box(cx, cx + 2, -2, 0, z1 - 4, z1 + 2, self.ORN)
        else:
            self.box(ax - 2, ax + 2, -2, 0, z1 - 2, z1 + 4, self.ORN)

    def balcony(self, x0, x1, f):
        self.box(x0, x1, -6, 0, f, f + 3, self.ORN)
        self.box(x0 - 1, x1 + 1, -7, -5, f + 2, f + 3, self.ORN)
        pitch = self.W / self.bays
        for k in range(self.bays + 1):
            cx = min(max(int(pitch * k) - 1, x0 + 1), x1 - 3)
            self.fill(cx, cx + 3, -6, 0, f - 9, f, lambda X, Y, Z: Y >= -1 - (Z - (f - 9)) * 0.55, self.ORN)
        self.railing(x0 + 1, x1 - 1, -6, f + 3, 10)
        for x in (x0, x1 - 1):
            self.railing(x, x + 1, -6, f + 3, 10, along_y=True)
        rng = random.Random(self.seed * 3 + f)
        for k in range(self.bays):
            if rng.random() < 0.55:
                bx = int(pitch * (k + 0.5)) - 6 + rng.randint(-2, 2)
                self.flowers(bx, bx + 12, -5, -2, f + 3, n=50, rng=rng)

    # --------------------------------------------------------------- the top
    def cornice(self):
        W, t = self.W, self.top
        self.box(0, W, -1, 0, t - 8, t, self.ORN)
        self.box(0, W, -2, 0, t, t + 2, self.ORN)
        for x in range(1, W - 1, 5):
            self.fill(x, x + 2, -7, 0, t + 1, t + 5, lambda X, Y, Z: Y >= -7 + (t + 4 - Z) * 1.2, self.ORN)
        self.box(0, W, -8, 0, t + 5, t + 8, self.ORN)
        self.box(0, W, -7, 0, t + 8, t + 10, self.ORN)
        if self.mansard:
            self.box(0, W, -8, -6, t + 10, t + 11, self.ZROLL)
            self.box(0, W, -6, 2, t + 9, t + 10, self.ZINC)

    def terrace(self):
        """A flat roof of tiles inside a balustrade: a stair hut, a tank,
        washing out, plants in tins."""
        W, D, t = self.W, self.D, self.top + 10
        rng = random.Random(self.seed + 21)
        self.box(0, W, 0, D, self.top, t, self.STONE)
        self.box(2, W - 2, 2, D - 2, t - 1, t, self.BALDOSA)
        # Balustrade: plinth, vase balusters in pairs of voxels, a coping, and
        # solid dies over the bay lines.
        self.box(0, W, -6, 2, t, t + 2, self.ORN)
        for x in range(1, W - 1):
            if x % 4 in (1, 2):
                self.box(x, x + 1, -5, -3, t + 2, t + 9, self.ORN)
                self.box(x, x + 1, -6, -2, t + 4, t + 6, self.ORN)
        pitch = W / self.bays
        for k in range(self.bays + 1):
            x = min(max(int(pitch * k) - 2, 0), W - 5)
            self.box(x, x + 5, -6, -1, t + 2, t + 10, self.ORN)
            if k in (0, self.bays):
                self.fill(x, x + 5, -6, -1, t + 12, t + 18,
                          lambda X, Y, Z, x=x: (X + 0.5 - x - 2.5) ** 2 + (Y + 3.5) ** 2 + (Z - t - 14) ** 2 * 0.6 <= 6,
                          self.ORN)
                self.box(x + 1, x + 4, -5, -2, t + 10, t + 12, self.ORN)
        self.box(0, W, -7, 0, t + 9, t + 11, self.ORN)
        for y in (2, D - 3):
            self.box(0, W, y, y + 1, t, t + 8, self.STONE)
        for x in (0, W - 2):
            self.box(x, x + 2, 0, D, t, t + 8, self.STONE)
        self.stairhead(W - 28, D // 2 - 4, t)
        self.tank(10, D - 24, t, w=12, d=12, h=9, legs=5)
        self.laundry(12, W - 36, D // 2 - 14, t, rng=rng)
        for x in range(6, W - 32, 17):
            if rng.random() < 0.7:
                self.potted(x, 5, t, tall=rng.randint(5, 10), rng=rng)
        self.chimney(W // 2 + 6, D - 20, t, w=8, d=7, h=10, pots=2)

    def roof(self):
        W, D = self.W, self.D
        b = self.top + 10
        lower, run = 30, 12
        brk = b + lower
        ridge = 8
        front = self.g.normal((0, -lower, run))
        back = self.g.normal((0, lower, run))
        inner = D - 2 * (run + 1)
        up_f = self.g.normal((0, -ridge, inner / 2))
        up_b = self.g.normal((0, ridge, inner / 2))
        mid = D / 2

        def slope_y(Z):
            return 1 + (Z - b) * run / lower

        self.fill(0, W, 1, D, b, brk, lambda X, Y, Z: (Y >= slope_y(Z)) & (Y <= D - 1 - (Z - b) * run / lower),
                  self.SLATE, front)
        self.fill(0, W, 1, D, b, brk, lambda X, Y, Z: Y > mid, self.SLATE, back)
        top = lambda Y: brk + ridge * (1 - np.abs(Y + 0.5 - mid) / (mid - run - 1))
        self.fill(0, W, run + 1, D - run - 1, brk, brk + ridge + 1, lambda X, Y, Z: Z < top(Y), self.ZINC, up_f)
        self.fill(0, W, int(mid), D - run - 1, brk, brk + ridge + 1, lambda X, Y, Z: Z < top(Y), self.ZINC, up_b)
        self.box(0, W, run, run + 2, brk - 1, brk + 1, self.ZROLL)
        pitch = W / self.bays
        for k in range(self.bays):
            self.dormer(int(pitch * (k + 0.5)), b)
        self.skylight(int(pitch * (self.bays // 2)) - 10, int(mid) - 14, brk)
        # Party walls stand proud of the roof and carry the flues.
        rng = random.Random(self.seed + 9)
        for x0 in (0, W - 7):
            self.fill(x0, x0 + 7, 0, D, b, brk + 30,
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
                        if rng.random() < 0.25:
                            self.pots.append((px + 1, y + 1, brk + 21, 'chimney'))

    def dormer(self, ax, b):
        x0, x1 = ax - 8, ax + 8
        z0, z1 = b + 3, b + 26
        yf = 4
        self.box(x0, x1, yf, 24, z0, z1, self.ZINC)
        self.box(x0 + 1, x1 - 1, yf - 1, yf + 2, z0, z1, self.ORN)
        self.box(x0 - 1, x1 + 1, yf - 2, yf + 1, z0 - 1, z0 + 1, self.ORN)
        self.box(x0 + 1, x1 - 1, yf + 3, yf + 12, z0 + 1, z1 - 1, self.PAPER[self.seed % 3])
        self.box(x0 + 2, x1 - 2, yf + 3, yf + 11, z0 + 1, z0 + 2, self.FLOOR)
        self.cut(x0 + 2, x1 - 2, yf + 3, yf + 10, z0 + 2, z1 - 2)
        front, self.front = self.front, yf - 1
        self.window(ax - 4, ax + 4, z0 + 3, z1 - 3, depth=3, shutters=None, curtains=0.5,
                    storey=self.stories, surround=False, sill=False)
        self.front = front
        self.fill(x0 - 1, x1 + 1, yf - 2, yf + 1, z1, z1 + 6,
                  lambda X, Y, Z: ((X + 0.5 - ax) / 9.5) ** 2 + ((Z + 0.5 - z1) / 6) ** 2 <= 1, self.ORN)
        self.fill(x0, x1, yf + 1, 26, z1, z1 + 5,
                  lambda X, Y, Z: ((X + 0.5 - ax) / 8.5) ** 2 + ((Z + 0.5 - z1) / 5) ** 2 <= 1, self.ZINC)

    def skylight(self, x0, y0, brk):
        x1, y1 = x0 + 20, y0 + 22
        self.box(x0, x1, y0, y1, brk, brk + 12, self.ZINC)
        cy = (y0 + y1) / 2
        ridge = lambda Y: 6 * (1 - np.abs(Y + 0.5 - cy) / ((y1 - y0) / 2))
        self.fill(x0 + 1, x1 - 1, y0 + 1, y1 - 1, brk + 12, brk + 18, lambda X, Y, Z: Z < brk + 12 + ridge(Y), self.SKY)
        self.fill(x0, x1, y0, y1, brk + 12, brk + 19,
                  lambda X, Y, Z: ((X - x0) % 4 == 0) & (Z < brk + 13 + ridge(Y)), self.IRON)
        self.box(x0, x1, int(cy), int(cy) + 1, brk + 17, brk + 19, self.ZROLL)
        self.box(x0 + 1, x1 - 1, y0 + 1, y1 - 1, brk - 20, brk + 12, 0)
        self.box(x0 + 1, x1 - 1, y0 + 1, y1 - 1, brk - 21, brk - 20, self.CHECK)


def demo_recipe(**k):
    r = {'footprint': [8, 7], 'stories': 4, 'bays': 4, 'seed': 7, 'facing': 'south', 'modernRole': 'shop',
         'limestone': True}
    r.update(k)
    return r


def night(b):
    dark = np.array(b.im).astype(float)
    dark[..., :3] *= np.array([0.30, 0.34, 0.52])
    im = Image.fromarray(dark.astype(np.uint8))
    im.alpha_composite(b.glow)
    return im


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
    for wall, seed, fp, st, bays, role in (('modern-sky', 3, [8, 6], 2, 3, 'home'),
                                            ('modern-mint', 12, [5, 5], 1, 2, 'shop'),
                                            ('modern-ochre', 5, [11, 7], 2, 4, 'shop')):
        cells.append(VoxelWalkup(demo_recipe(seed=seed, limestone=False, footprint=fp, stories=st, bays=bays,
                                             modernRole=role), mats[wall]).render())
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


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/gold/walkup.png')
