"""The monsoon street built in voxels: the arcaded shophouse and the
tin-roofed veranda house.

    .venv/bin/python scripts/art/city_tropic.py artifacts/gold/tropic.png

The shophouse is the Straits and South China type, c.1880-1950, from Penang
and Singapore to Hanoi, Bangkok and Xiamen: a covered five-foot way behind
tiled piers, louvred windows and rattan blinds above, laundry out on bamboo
poles, a shaped gable and a pantile roof between raised fire walls. The
veranda house stands on stumps under corrugated iron wherever the rain is
heavy, from Lagos and Nairobi to Brisbane, Kingston and Kuala Lumpur.
"""
from pathlib import Path
import random
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.voxel import h3  # noqa: E402
from art.voxel_kit import (  # noqa: E402
    GROUND, RATTAN, REDTIN, RUST, STOREY, TEAK, TILEWORK, TIN, VoxelBuilding,
)

PANTILE = ['#24110f', '#3c1c17', '#57291f', '#733829', '#8c4a35', '#a35f45', '#b87858', '#cc9570']
BAMBOO = ['#3a3418', '#5a5226', '#7c7236', '#9e944a', '#bcb462', '#d6d080']
LANTERN = ['#4a0a0e', '#8a1418', '#c42a22', '#ec5238', '#ff8a5a']
SACKING = ['#3a2e1e', '#5a4a30', '#7c6844', '#9e885a', '#bca674', '#d4c294']


class Shophouse(VoxelBuilding):
    front = 0

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.top = GROUND + STOREY * (self.stories - 1)
        self.walk = 16 if self.W >= 64 else 12

    def ztop(self):
        return int(self.top + 16 + self.D // 2 * 0.45 + 10)

    def materials(self):
        super().materials()
        g = self.g

        def pantile(i):
            u = i['x'] % 5
            course = (i['y'] // 3) % 2
            return 1.0 * (u == 1) - 1.1 * (u == 4) - 0.8 * (((i['y'] + i['x'] // 5) % 6 == 0) & (u != 1)) \
                + (h3(i['x'] // 5, i['y'] // 6, 7, self.seed) - 0.5) * 0.4 + 0 * course

        self.TILE = g.mat(PANTILE, tex=pantile, bias=-1.3)
        self.RIDGE = g.mat(PANTILE, bias=-0.6)
        self.TILES = g.mat(self.pick(TILEWORK, 2), bias=0.2,
                           tex=lambda i: 1.0 * ((i['x'] + i['z']) % 4 == 0) - 1.0 * ((i['x'] - i['z']) % 4 == 2))
        self.RATTAN = g.mat(RATTAN, bias=0.1, tex=lambda i: -1.0 * (i['z'] % 2 == 0))
        self.BAMBOO = g.mat(BAMBOO, bias=0.2)
        self.LANTERN = g.mat(LANTERN, bias=0.8, lamp=True)
        self.TEAK = g.mat(TEAK, bias=-0.2, tex=lambda i: -0.8 * (i['x'] % 4 == 0))
        self.SACK = g.mat(SACKING, bias=0.1)
        self.CARTOUCHE = g.mat(self.pick([['#240808', '#4a1010', '#7a1a18', '#a82820', '#d04030', '#f06a48'],
                                          ['#081a10', '#10301c', '#1a4a2c', '#28683e', '#3c8a56', '#5aac72']], 5),
                               bias=0.4)

    def build(self):
        W, D, t = self.W, self.D, self.top
        self.box(0, W, 0, D, 0, t, self.STONE)
        for s in range(1, self.stories):
            self.rooms(GROUND + STOREY * (s - 1), STOREY)
        pitch = W / self.bays
        self.axes = [int(pitch * (k + 0.5)) for k in range(self.bays)]
        self.arcade()
        for s in range(1, self.stories):
            self.upper(s)
        self.crown()
        self.roof()
        self.pipe(W - 3, t)

    def life(self):
        rng = random.Random(self.seed + 71)
        leaners = self.leaners(2, rng, range(1, self.stories))
        specs = [self.lean_out(w, rng) for w in leaners]
        specs += self.shop_life()
        specs.append({'k': 'loop', 'states': [{'wind': p} for p in range(4)], 'ms': 300})
        return specs

    def arcade(self):
        """The five-foot way: piers carrying the floor above on shallow
        arches, the shop set back behind, lanterns hung from the soffit."""
        W, A = self.W, self.walk
        pitch = W / self.bays
        top = GROUND - 8
        self.cut(0, W, 0, A, 1, top)
        self.box(0, W, 0, A, 0, 1, self.CHECK)
        self.front = A
        self.rooms(0, GROUND, y0=A + 4)
        if self.shops or self.street:
            band = self.shopfront(3, W - 3, self.pick(['green', 'teal', 'oxblood', 'navy'], 3),
                                  stock=self.pick(['grocer', 'draper', 'hardware'], 4), top=top - 4,
                                  door='middle' if W >= 64 else 'right')
            if self.shops:
                self.goods(A)
        else:
            self.box(0, W, A, A + 4, 1, top, self.STONE)
        self.front = 0
        # Piers with tiled dados, arches between them, a beam for the sign.
        for k in range(self.bays + 1):
            x = min(max(int(pitch * k) - 3, 0), W - 6)
            self.box(x, x + 6, 0, 4, 0, top, self.STONE)
            self.box(x - 1, x + 7, -1, 4, 0, 3, self.PLINTH)
            self.box(x, x + 6, -1, 0, 3, 18, self.TILES)
            self.box(x - 1, x + 7, -1, 4, top - 4, top - 2, self.ORN)
        for k in range(self.bays):
            x0, x1 = int(pitch * k) + 3, int(pitch * (k + 1)) - 3
            ax, half = (x0 + x1) / 2, (x1 - x0) / 2
            self.fill(x0, x1, 0, 4, top - 8, top,
                      lambda X, Y, Z: ((X + 0.5 - ax) / half) ** 2 + ((top - 8 - Z - 0.5) / 7) ** 2 >= 1, self.STONE)
            if k * 3 % 2 == 0 or self.bays == 1:
                lx = int(ax)
                self.box(lx, lx + 1, A // 2, A // 2 + 1, top - 12, top, self.IRON)
                self.fill(lx - 3, lx + 4, A // 2 - 3, A // 2 + 4, top - 19, top - 12,
                          lambda X, Y, Z: (X + 0.5 - lx - 0.5) ** 2 + (Y + 0.5 - A // 2 - 0.5) ** 2
                          + ((Z + 0.5 - top + 15.5) * 0.8) ** 2 <= 9, self.LANTERN)
                self.box(lx - 1, lx + 2, A // 2 - 1, A // 2 + 2, top - 20, top - 19, self.GILT)
                self.lamps.append((lx, A // 2, top - 16))
        self.box(0, W, -1, 4, top, GROUND, self.ORN)
        self.box(0, W, -2, 0, top + 1, GROUND - 1, self.PAINT[self.pick(['green', 'navy', 'oxblood'], 6)])
        self.box(1, W - 1, -3, -2, top + 2, top + 3, self.GILT)
        self.box(1, W - 1, -3, -2, GROUND - 3, GROUND - 2, self.GILT)
        self.sign_band = [self.sx0 + 3, self.base - (GROUND - 4) + 1, W - 6, 5]
        self.door_x = self.shop_door if self.street else self.sx0 + W // 2
        self.door_ground = self.base - 1 - round(0.5 * A)

    def goods(self, A):
        """Sacks, jars and baskets put out under the arcade."""
        rng = random.Random(self.seed + 17)
        x = 6
        while x < self.W - 14:
            kind = rng.random()
            y = A - 7 + rng.randint(0, 2)
            if kind < 0.4:
                for dx in (0, 5):
                    self.fill(x + dx, x + dx + 5, y, y + 5, 1, 9,
                              lambda X, Y, Z, x0=x + dx: ((X + 0.5 - x0 - 2.5) ** 2 + (Y + 0.5 - y - 2.5) ** 2)
                              <= (2.8 - max(0, 0)) ** 2 - (Z > 7) * 2, self.SACK)
                    self.box(x + dx + 1, x + dx + 4, y + 1, y + 4, 8, 9, rng.choice(self.GOODS))
                x += 12
            elif kind < 0.7:
                self.fill(x, x + 7, y, y + 7, 1, 11,
                          lambda X, Y, Z, x0=x: ((X + 0.5 - x0 - 3.5) ** 2 + (Y + 0.5 - y - 3.5) ** 2)
                          <= (3.4 - np.abs(Z - 5.5) * 0.25) ** 2, self.POT)
                x += 10
            else:
                self.box(x, x + 8, y, y + 6, 1, 6, self.RATTAN)
                self.box(x + 1, x + 7, y + 1, y + 5, 6, 7, rng.choice(self.GOODS))
                x += 11

    def upper(self, s):
        W = self.W
        f = GROUND + STOREY * (s - 1)
        pitch = W / self.bays
        rng = random.Random(self.seed * 11 + s)
        self.box(0, W, -1, 0, f + STOREY - 4, f + STOREY - 2, self.ORN)
        for k, ax in enumerate(self.axes):
            pair = [(ax - 12, ax - 3), (ax + 3, ax + 12)] if pitch >= 40 else [(ax - 5, ax + 5)]
            for x0, x1 in pair:
                z0, z1 = f + 5, f + 31
                i = self.window(x0, x1, z0, z1, kind='fanlight', storey=s, curtains=0.3)
                self.box(x0 - 2, x1 + 2, -2, 0, z1 + 2, z1 + 4, self.ORN)
                self.box(x0, x1, -1, 0, z1 + 4, z1 + 6, self.CARTOUCHE)
                if rng.random() < 0.35:
                    self.blind(x0, x1, z0, z1, rng)
            if rng.random() < 0.45:
                self.pole(pair[0][0] + 6, pair[-1][1] - 6, f + 5, rng)
        for k in range(self.bays + 1):
            x = min(max(int(pitch * k) - 2, 0), W - 4)
            self.box(x, x + 4, -2, 0, f, f + STOREY - 4, self.ORN)
            self.box(x - 1, x + 5, -3, 0, f + STOREY - 8, f + STOREY - 5, self.ORN)

    def blind(self, x0, x1, z0, z1, rng):
        """A rattan chick let down over the window and propped out at the
        foot, rolled at the head."""
        drop = rng.randint((z1 - z0) // 2, z1 - z0 - 4)
        self.fill(x0 - 1, x1 + 1, -6, 0, z1 - drop, z1,
                  lambda X, Y, Z: np.abs(Y + 0.5 - (-1 - (z1 - Z) * 4 / drop)) < 0.9, self.RATTAN)
        self.box(x0 - 1, x1 + 1, -3, -1, z1, z1 + 2, self.RATTAN)

    def pole(self, x0, x1, z0, rng):
        """A bamboo pole on two brackets along the front, the washing on it."""
        z = z0 + 18
        a, b = max(1, x0 - 8), min(self.W - 1, x1 + 8)
        for x in (a, b - 1):
            self.box(x, x + 1, -7, 0, z, z + 1, self.IRON)
        self.box(a, b, -7, -6, z, z + 1, self.BAMBOO)
        x = a + 2
        while x < b - 3:
            w = rng.randint(3, 6)
            if x + w > b - 1:
                break
            if rng.random() < 0.8:
                self.hang(x, x + w, -7, z, rng.randint(5, 10), rng.choice(self.LINEN))
            x += w + 1

    def crown(self):
        W, t = self.W, self.top
        self.box(0, W, -2, 0, t - 2, t + 1, self.ORN)
        self.box(0, W, -3, 0, t + 1, t + 3, self.ORN)
        self.box(0, W, -1, 3, t + 3, t + 8, self.STONE)
        self.box(0, W, -2, 3, t + 8, t + 9, self.ORN)
        # A shaped gable: scrolls rising to a plaque, a pediment over it.
        if W >= 64:
            cx = W / 2
            half = min(W // 3, 34)
            h = 14
            prof = lambda X: h * np.clip(1 - (np.abs(X + 0.5 - cx) / half) ** 1.6, 0, 1)
            self.fill(int(cx - half), int(cx + half) + 1, -1, 3, t + 9, t + 9 + h,
                      lambda X, Y, Z: Z - t - 9 < prof(X), self.STONE)
            self.fill(int(cx - half), int(cx + half) + 1, -2, 3, t + 9, t + 11 + h,
                      lambda X, Y, Z: np.abs(Z - t - 9 - prof(X)) < 1.1, self.ORN)
            self.box(int(cx - 12), int(cx + 12), -2, 0, t + 10, t + 18, self.ORN)
            self.box(int(cx - 10), int(cx + 10), -3, -1, t + 11, t + 17, self.CARTOUCHE)
            self.box(int(cx - 8), int(cx + 8), -4, -2, t + 13, t + 15, self.GILT)
            for x in (int(cx - half) - 2, int(cx + half) - 2):
                self.fill(x, x + 5, -3, 2, t + 9, t + 15,
                          lambda X, Y, Z, x=x: (X + 0.5 - x - 2.5) ** 2 + (Y + 0.5) ** 2 + (Z - t - 12) ** 2 <= 6,
                          self.ORN)

    def roof(self):
        """Pantile to a ridge along the street, a rounded cap on it, fire
        walls standing proud at either end with their ends swept up."""
        W, D, t = self.W, self.D, self.top
        mid = D / 2
        rise = mid * 0.45
        e = t + 8
        slope = lambda Y: e + rise * (1 - np.abs(Y + 0.5 - mid) / (mid - 2))
        nf = self.g.normal((0, -rise, mid))
        nb = self.g.normal((0, rise, mid))
        self.fill(0, W, 2, int(mid), t, int(e + rise) + 2, lambda X, Y, Z: Z < slope(Y), self.TILE, nf)
        self.fill(0, W, int(mid), D, t, int(e + rise) + 2, lambda X, Y, Z: Z < slope(Y), self.TILE, nb)
        self.fill(0, W, int(mid) - 2, int(mid) + 3, int(e + rise) - 2, int(e + rise) + 3,
                  lambda X, Y, Z: (Y + 0.5 - mid) ** 2 + (Z + 0.5 - e - rise) ** 2 * 1.2 <= 5, self.RIDGE)
        self.box(0, W, 1, 3, e - 1, e + 1, self.RIDGE)
        for x0 in (0, W - 4):
            self.fill(x0, x0 + 4, 0, D, t, int(e + rise) + 8,
                      lambda X, Y, Z: (Z < slope(Y) + 4) & (Y >= 1), self.STONE)
            self.fill(x0 - 1, x0 + 5, 0, D, t, int(e + rise) + 9,
                      lambda X, Y, Z: (np.abs(Z - slope(Y) - 4) < 1) & (Y >= 1), self.ORN)
            self.fill(x0 - 1, x0 + 5, -3, 4, e, e + 10,
                      lambda X, Y, Z: (Y + 0.5 - 2) ** 2 + (Z + 0.5 - e - 6) ** 2 <= 9, self.ORN)
        if self.W >= 64:
            self.chimney(W // 3, int(mid) + 8, int(slope(mid + 8)) - 4, w=6, d=6, h=10, pots=1, m=self.STONE)


class VerandaHouse(VoxelBuilding):
    """Weatherboard on stumps behind a veranda: posts with fretwork heads, a
    cross-braced rail, a bullnosed iron roof over it and a hipped one over
    the house, shutters folded back, a tank on a stand at the side. As a shop
    the veranda carries the board and the stock; as a stall it is only the
    roof on posts."""

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.floor = 10
        self.V = 20 if self.D >= 48 else 12
        self.wall_h = 44
        self.top = self.floor + self.wall_h + STOREY * (self.stories - 1)
        self.stall = self.D <= 32
        self.tanked = self.W >= 80 and not self.stall
        self.body_w = self.W - 22 if self.tanked else self.W

    def ztop(self):
        return int(self.top + (self.D - self.V) // 2 * 0.55 + 20)

    def materials(self):
        super().materials()
        g = self.g
        self.BOARD = g.mat(self.wall_ramp, tex=self.tex['board'], bias=-0.3)
        self.TIMBER = g.mat(self.pick([['#1a120e', '#2c2018', '#443226', '#5e4634', '#7a5c44', '#967656', '#b0926e'],
                                       ['#2a2826', '#48443e', '#6a645a', '#8e8678', '#b0a896', '#cec6b2', '#e6dfcc']], 3),
                              bias=0.1)
        roof = self.pick([REDTIN, TIN, RUST, TIN], 4)

        def iron(i):
            u = i['x'] % 3
            streak = (h3(i['x'] // 3, 0, 9, self.seed) < 0.25) & (u != 0)
            return 1.0 * (u == 0) - 0.9 * (u == 2) - 0.8 * streak
        self.IRONROOF = g.mat(roof, tex=iron, bias=-1.7)
        self.IRONV = g.mat(roof, tex=iron, bias=-1.4)
        self.RUSTY = g.mat(RUST, tex=iron, bias=-1.0)
        self.SACK = g.mat(SACKING, bias=0.1)
        self.TANK = g.mat(TIN, bias=-1.2, tex=lambda i: 1.0 * (i['z'] % 3 == 0) - 0.8 * (i['z'] % 3 == 2))

    def build(self):
        if self.stall:
            return self.roadside()
        W, D, V, fl = self.W, self.D, self.V, self.floor
        bw = self.body_w
        # Stumps and the floor they carry.
        for x in range(2, bw - 2, 12):
            for y in range(2, D - 2, 14):
                self.box(x, x + 3, y, y + 3, 0, fl - 2, self.TIMBER)
        self.box(0, bw, 0, D, fl - 2, fl, self.TIMBER)
        self.box(0, bw, V, D, fl, self.top, self.BOARD)
        for s in range(self.stories):
            f = fl + (0 if s == 0 else self.wall_h + STOREY * (s - 1))
            h = self.wall_h if s == 0 else STOREY
            self.front = V
            self.rooms(f, h, x1=bw - 1)
        self.front = V
        self.house_front()
        self.front = 0
        self.veranda()
        self.roof()
        if self.tanked:
            self.water_tank()
        self.box(0, bw, -1, 0, 0, fl - 2, self.TIMBER)
        for x in range(0, bw, 3):
            for z in range(0, fl - 2):
                if (x + z) % 6 in (1, 2, 4):
                    self.cut(x, x + 1, -1, 0, z, z + 1)

    def life(self):
        rng = random.Random(self.seed + 71)
        leaners = self.leaners(2, rng)
        return [self.lean_out(w, rng) for w in leaners[:1]] + [self.curtain_twitch(w) for w in leaners[1:]]

    def house_front(self):
        bw, V, fl = self.body_w, self.V, self.floor
        n = max(1, round(bw / 36))
        pitch = bw / n
        door_k = n // 2
        rng = random.Random(self.seed + 3)
        for s in range(self.stories):
            f = fl + (0 if s == 0 else self.wall_h + STOREY * (s - 1))
            for k in range(n):
                ax = int(pitch * (k + 0.5))
                if s == 0 and k == door_k:
                    self.door(ax, f)
                    continue
                x0, x1 = ax - 5, ax + 5
                self.window(x0, x1, f + 10, f + 32, kind='casement', shutters='hinged', curtains=0.5,
                            surround=False, storey=s, frame=self.FRAME)
                # A sunhood of iron on two brackets.
                self.fill(x0 - 2, x1 + 2, V - 6, V, f + 33, f + 37,
                          lambda X, Y, Z: np.abs(Z - (f + 36 + (Y - V) * 3 / 6)) < 0.8, self.IRONV)
        if self.shops:
            self.sign_band = None

    def door(self, ax, f):
        V = self.V
        x0, x1 = ax - 7, ax + 7
        self.box(x0 - 2, x1 + 2, V - 1, V, f, f + 38, self.TIMBER)
        self.cut(x0, x1, V - 1, V + 4, f, f + 36)
        if self.shops:
            # Double doors folded open onto a shop of shelves.
            self.box(x0 - 7, x0 - 1, V - 1, V, f, f + 34, self.TIMBER)
            self.box(x1 + 1, x1 + 7, V - 1, V, f, f + 34, self.TIMBER)
            for z in range(f + 8, f + 34, 7):
                self.box(x0 + 1, x1 - 1, V + 20, V + 22, z, z + 1, self.OAK)
                for x in range(x0 + 1, x1 - 1, 2):
                    self.box(x, x + 1, V + 19, V + 20, z + 1, z + 4, self.GOODS[(x + z) % 6])
            self.box(x0, x1, V + 22, V + 24, f, f + 36, self.OAK)
        else:
            self.box(x0, x1, V + 3, V + 4, f, f + 30, self.PAINT[self.pick(['green', 'teal', 'navy', 'oxblood'], 5)])
            self.box(x0 + 2, x1 - 2, V + 2, V + 3, f + 4, f + 14, self.PAINT[self.pick(['green', 'teal', 'navy', 'oxblood'], 5)])
            self.box(x0 + 2, x1 - 2, V + 2, V + 3, f + 16, f + 27, self.PAINT[self.pick(['green', 'teal', 'navy', 'oxblood'], 5)])
            self.box(x0, x1, V + 3, V + 4, f + 31, f + 36, self.GLASS)
            self.box(ax, ax + 1, V + 2, V + 3, f + 31, f + 36, self.FRAME)
        self.door_x = self.sx0 + ax
        self.door_ground = self.base - 1 - round(0.5 * V) - f + 1

    def veranda(self):
        bw, V, fl = self.body_w, self.V, self.floor
        vh = fl + 36
        posts = list(range(1, bw - 2, max(18, (bw - 4) // max(1, round(bw / 26)))))
        if posts[-1] < bw - 5:
            posts.append(bw - 4)
        door_ax = self.door_x - self.sx0
        self.box(0, bw, 0, V, fl - 2, fl, self.TIMBER)
        for s in range(self.stories):
            f = fl + (0 if s == 0 else self.wall_h + STOREY * (s - 1))
            h = self.wall_h if s == 0 else STOREY
            for x in posts:
                self.box(x, x + 3, 0, 3, f, f + h - 6, self.TIMBER)
                # Fretwork heads between the posts.
            for a, b in zip(posts, posts[1:]):
                for x in range(a + 3, b):
                    for z in range(f + h - 12, f + h - 6):
                        u = (x - a - 3, z - (f + h - 12))
                        if (u[0] + u[1]) % 4 == 0 or (u[0] - u[1]) % 4 == 0 or u[1] == 5:
                            self.box(x, x + 1, 0, 1, z, z + 1, self.FRAME)
                # The rail: cross-braced between a top and bottom rail.
                if s > 0 or not (a < door_ax < b):
                    self.box(a + 3, b, 0, 1, f + 12, f + 14, self.FRAME)
                    self.box(a + 3, b, 0, 1, f + 1, f + 2, self.FRAME)
                    span = b - a - 3
                    for x in range(a + 3, b):
                        u = (x - a - 3) / max(1, span)
                        for z in (round(f + 2 + u * 10), round(f + 12 - u * 10)):
                            self.box(x, x + 1, 0, 1, z, z + 1, self.FRAME)
            if s:
                self.box(0, bw, 0, V, f - 2, f, self.TIMBER)
        # Steps up to the door.
        for k in range(3):
            self.box(door_ax - 7, door_ax + 7, -6 + k * 2, -4 + k * 2, 0, (k + 1) * 3, self.TIMBER)
        # The bullnose: iron sheets curved down over the veranda from the wall.
        top = self.top
        n = [self.g.normal((0, -np.sin(a), np.cos(a))) for a in np.linspace(0.15, 1.3, 12)]
        R = 8

        def bull(Y):
            yy = np.clip(Y + 0.5, -1, V)
            flat = top + 4 - (V - yy) * 0.12
            d = np.clip(R - (yy + 1), 0, R)
            return flat - (R - np.sqrt(np.maximum(0, R * R - d * d)))
        for k, (y0, y1) in enumerate(zip(np.linspace(-1, V, 13)[:-1], np.linspace(-1, V, 13)[1:])):
            nk = n[11 - min(11, int((1 - (y0 + 1) / (V + 1)) * 11))] if y0 < R else self.g.normal((0, -0.12, 1))
            self.fill(-1, bw + 1, int(np.floor(y0)), int(np.ceil(y1)), int(top - R - 4), int(top + 6),
                      lambda X, Y, Z: (Z <= bull(Y)) & (Z > bull(Y) - 1.6), self.IRONV, nk)
        if self.shops:
            self.box(0, bw, -1, 1, top - 8, top - 1, self.PAINT[self.pick(['navy', 'green', 'oxblood', 'mustard'], 8)])
            self.sign_band = [self.sx0 + 3, self.base - (top - 2) + 1, bw - 6, 5]
            self.stock_out()

    def stock_out(self):
        """Sacks, tins and a bicycle out on the veranda."""
        rng = random.Random(self.seed + 29)
        fl, V = self.floor, self.V
        door_ax = self.door_x - self.sx0
        for x in range(4, self.body_w - 8, 9):
            if abs(x - door_ax) < 11:
                continue
            if rng.random() < 0.6:
                self.fill(x, x + 6, 5, 11, fl, fl + 9,
                          lambda X, Y, Z, x0=x: (X + 0.5 - x0 - 3) ** 2 + (Y + 0.5 - 8) ** 2 <= 8 - (Z > fl + 7) * 3,
                          self.SACK)
            else:
                for dz in (0, 4):
                    self.box(x, x + 5, 6, 10, fl + dz, fl + dz + 4, rng.choice(self.GOODS))
        bx = self.body_w - 20
        for cx in (bx, bx + 11):
            self.fill(cx - 4, cx + 5, 4, 5, fl, fl + 9,
                      lambda X, Y, Z, cx=cx: np.abs(np.hypot(X + 0.5 - cx - 0.5, Z + 0.5 - fl - 4.5) - 3.8) < 0.7,
                      self.IRON)
        self.box(bx, bx + 12, 4, 5, fl + 7, fl + 8, self.PAINT['oxblood'])
        self.box(bx + 6, bx + 7, 4, 5, fl + 4, fl + 11, self.PAINT['oxblood'])
        self.box(bx + 9, bx + 13, 4, 5, fl + 11, fl + 12, self.IRON)

    def roof(self):
        """Hipped iron over the house: ridge along the street, hips at the
        ends, a ridge cap, a whirlybird and a flue."""
        bw, D, V, t = self.body_w, self.D, self.V, self.top
        depth = D - V
        mid = V + depth / 2
        pitch = 0.55
        hip = lambda X, Y: np.minimum(np.minimum(Y + 0.5 - V + 2, D + 1 - Y - 0.5),
                                      np.minimum(X + 0.5 + 2, bw + 2 - X - 0.5)) * pitch
        rise = (depth / 2 + 2) * pitch
        nf, nb = self.g.normal((0, -pitch, 1)), self.g.normal((0, pitch, 1))
        self.fill(-2, bw + 2, V - 2, int(mid), t, int(t + rise) + 2, lambda X, Y, Z: Z < t + hip(X, Y), self.IRONROOF, nf)
        self.fill(-2, bw + 2, int(mid), D + 1, t, int(t + rise) + 2, lambda X, Y, Z: Z < t + hip(X, Y), self.IRONROOF, nb)
        self.fill(-2, bw + 2, V - 2, D + 1, t, int(t + rise) + 3,
                  lambda X, Y, Z: (np.abs(Z - t - hip(X, Y)) < 1) & (np.abs(Y + 0.5 - mid) < 1.2)
                  & (hip(X, Y) >= rise - 3), self.ZINC)
        wx, wy = int(bw * 0.62), int(mid) - 2
        wz = int(t + hip(np.array(wx), np.array(wy)))
        self.fill(wx - 3, wx + 4, wy - 3, wy + 4, wz, wz + 6,
                  lambda X, Y, Z: (X + 0.5 - wx - 0.5) ** 2 + (Y + 0.5 - wy - 0.5) ** 2
                  <= (3.2 - np.abs(Z - wz - 3) * 0.3) ** 2, self.ZINC)
        fx = int(bw * 0.3)
        fz = int(t + hip(np.array(fx), np.array(int(mid) + 6)))
        self.box(fx, fx + 2, int(mid) + 6, int(mid) + 8, fz - 2, fz + 10, self.PIPE)
        self.box(fx - 1, fx + 3, int(mid) + 5, int(mid) + 9, fz + 10, fz + 11, self.PIPE)
        self.pots.append((fx + 1, int(mid) + 7, fz + 11, 'chimney'))

    def water_tank(self):
        W, V, D = self.W, self.V, self.D
        x0 = self.body_w + 3
        cx, cy, r = x0 + 8, V + 18, 8
        for dx in (-6, 5):
            for dy in (-6, 5):
                self.box(cx + dx, cx + dx + 2, cy + dy, cy + dy + 2, 0, 16, self.TIMBER)
        self.box(cx - 8, cx + 9, cy - 8, cy + 9, 16, 18, self.TIMBER)
        cyl = lambda X, Y: (X + 0.5 - cx - 0.5) ** 2 + (Y + 0.5 - cy - 0.5) ** 2
        self.fill(cx - r, cx + r + 1, cy - r, cy + r + 1, 18, 38, lambda X, Y, Z: cyl(X, Y) <= r * r, self.TANK)
        self.fill(cx - r - 1, cx + r + 2, cy - r - 1, cy + r + 2, 38, 43,
                  lambda X, Y, Z: cyl(X, Y) <= (r + 0.8 - (Z - 38) * 1.7) ** 2, self.TANK)
        self.box(cx - 6, cx - 4, cy - 12, cy - 6, 30, 32, self.PIPE)
        self.box(cx - 6, cx - 4, cy - 12, cy - 10, 18, 30, self.PIPE)

    def roadside(self):
        """A stall: an iron skillion on four posts over a counter of stock."""
        W, D = self.W, self.D
        rng = random.Random(self.seed + 5)
        for x in (1, W - 4):
            for y in (1, D - 4):
                self.box(x, x + 3, y, y + 3, 0, 44 if y < D // 2 else 50, self.TIMBER)
        n = self.g.normal((0, -0.2, 1))
        self.fill(-2, W + 2, -4, D + 1, 40, 56, lambda X, Y, Z: np.abs(Z - (44 + (Y + 4) * 0.2)) < 1, self.IRONROOF, n)
        self.box(2, W - 2, 4, 12, 0, 18, self.TIMBER)
        self.box(1, W - 1, 3, 13, 18, 20, self.TIMBER)
        for x in range(3, W - 5, 5):
            c = rng.choice(self.GOODS)
            self.fill(x, x + 5, 5, 11, 20, 25,
                      lambda X, Y, Z, x0=x: (X + 0.5 - x0 - 2.5) ** 2 + (Y + 0.5 - 8) ** 2 + (Z - 20) ** 2 * 1.5 <= 7, c)
        self.box(3, W - 3, D - 8, D - 5, 0, 30, self.TIMBER)
        for z in range(8, 30, 7):
            for x in range(4, W - 4, 3):
                self.box(x, x + 2, D - 9, D - 8, z, z + 3, self.GOODS[(x + z) % 6])
        self.box(1, W - 1, -4, -2, 38, 43, self.PAINT[self.pick(['navy', 'green', 'oxblood'], 8)])
        self.sign_band = [self.sx0 + 3, self.base - 42 - 2, W - 6, 5] if self.shops else None
        self.door_x = self.sx0 + W // 2


KINDS = {'modern-shophouse': Shophouse, 'modern-kampung': VerandaHouse}


def make(out, zoom=2):
    from art.review_sheet import recipes
    from art.reference import current_adult_d
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    all_r, _, source = recipes()
    rows = []
    for base, cls in KINDS.items():
        row = []
        for form in ('stall', 'hut', 'cottage', 'shop', 'row', 'wide', 'tall'):
            r = all_r.get(f'{base}-urban-{form}')
            if r:
                row.append(cls(r, source['materials'][r['wall']]).render())
        rows.append(row)
    pad = 10
    W = max(sum(c.width + pad for c in row) for row in rows) + adult.width + pad * 2
    H = sum(max(c.height for c in row) + pad for row in rows) + pad
    sheet = Image.new('RGBA', (W, H), '#8f8e84')
    y = pad
    for row in rows:
        rh = max(c.height for c in row)
        sheet.alpha_composite(Image.new('RGBA', (W, 6), '#7b747c'), (0, y + rh - 3))
        x = pad
        for c in row:
            sheet.alpha_composite(c, (x, y + rh - c.height))
            x += c.width + pad
        sheet.alpha_composite(adult, (x, y + rh - adult.height - 2))
        y += rh + pad
    sheet.resize((W * zoom, H * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/gold/tropic.png')
