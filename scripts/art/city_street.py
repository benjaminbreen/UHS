"""The twentieth-century street built in voxels: the commercial block, the
moderne apartment house and the office.

    .venv/bin/python scripts/art/city_street.py artifacts/gold/street.png

Each is a type, not a city: they stand from Nairobi and Bombay to Havana,
Buenos Aires and Shanghai between about 1900 and 1960, so colour comes from
the recipe's wall material and variety from the seed.
"""
from pathlib import Path
import random
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.voxel import h3, ramp_from  # noqa: E402
from art.voxel_kit import (  # noqa: E402
    BRICK, GLASS, GROUND, PORTLAND, LIMESTONE, STOREY, VoxelBuilding,
)

GLASSBLOCK = ['#2c3a40', '#46585c', '#63797a', '#86a09c', '#a9c4bd', '#cae2d8', '#e8f6ee']
BRONZE = ['#1a120c', '#2e2014', '#47321e', '#624628', '#7f5e36', '#9d7a48', '#bc9a62']
CEDAR = ['#1e140f', '#33221a', '#4b3324', '#654630', '#80593c', '#9a6f4c', '#b38860']
FLAGS = [['#4a0a14', '#8e1624', '#c82234', '#e84a50'], ['#0a1a4a', '#16307a', '#2448a8', '#4a70cc']]


class FlatRoofed(VoxelBuilding):
    """A block whose roof is a deck behind a parapet, with what stands on it."""

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.top = GROUND + STOREY * (self.stories - 1)

    def materials(self):
        super().materials()
        g = self.g
        self.FELT = g.mat(['#2a2830', '#3a3740', '#4d4a52', '#625e65', '#78737a', '#8f898e', '#a9a2a5'], bias=-1.0,
                          tex=lambda i: 0.9 * (i['x'] % 16 == 0) - 0.9 * (i['x'] % 16 == 1)
                          + (h3(i['x'] // 16, i['y'] // 24, 2, self.seed) - 0.5) * 0.8)
        self.ROOFTILE = g.mat(['#3a3a40', '#58565a', '#78757a', '#99959a', '#b8b3b4', '#d2cdca', '#e8e3dd'], bias=-0.9,
                              tex=lambda i: -1.0 * ((i['x'] % 8 == 0) | (i['y'] % 12 == 0))
                              + (h3(i['x'] // 8, i['y'] // 12, 4, self.seed) - 0.5) * 0.7)
        self.GRAVEL = g.mat(['#3a3530', '#524b44', '#6b635a', '#857c71', '#a09689', '#bab0a2', '#d0c6b8'], bias=-0.9,
                            tex=lambda i: (h3(i['x'], i['y'], i['z'], self.seed) - 0.5) * 1.3)
        self.FLAG = [self.g.mat(FLAGS[self.seed % 2], bias=0.3), self.g.mat(['#8a8894', '#c4c2c8', '#ebe8e6', '#fbf8f2'], bias=0.3)]

    def deck(self, t, wall, low=5, m=None):
        W, D = self.W, self.D
        self.box(3, W - 3, 3, D - 3, t - 1, t, m or self.FELT)
        for x0, x1, y0, y1 in ((0, 3, 0, D), (W - 3, W, 0, D), (0, W, D - 3, D)):
            self.box(x0, x1, y0, y1, t, t + low, wall)
            self.box(x0, x1, y0, y1, t + low, t + low + 1, self.ORN)

    def skylight(self, x, y, z, w=16, d=14):
        """A hipped glass light on an upstand."""
        self.box(x, x + w, y, y + d, z, z + 4, self.CONCRETE)
        cy, cx = y + d / 2, x + w / 2
        hip = lambda X, Y: np.minimum(np.minimum(X + 0.5 - x, x + w - X - 0.5), np.minimum(Y + 0.5 - y, y + d - Y - 0.5))
        self.fill(x, x + w, y, y + d, z + 4, z + 10, lambda X, Y, Z: Z < z + 4 + hip(X, Y) * 0.8, self.SKY)
        self.fill(x, x + w, y, y + d, z + 4, z + 11,
                  lambda X, Y, Z: ((X - x) % 4 == 0) & (Z < z + 5 + hip(X, Y) * 0.8), self.IRON)
        self.box(x + 1, x + w - 1, y + 1, y + d - 1, z - 30, z + 4, 0)

    def vent(self, x, y, z):
        self.box(x, x + 2, y, y + 2, z, z + 6, self.PIPE)
        self.fill(x - 2, x + 4, y - 2, y + 4, z + 6, z + 9,
                  lambda X, Y, Z: (X + 0.5 - x - 1) ** 2 + (Y + 0.5 - y - 1) ** 2 <= (3.2 - (Z - z - 6)) ** 2,
                  self.ZINC)

    def finial(self, x, y, z, m=None):
        m = m or self.ORN
        self.box(x - 1, x + 2, y - 1, y + 2, z, z + 2, m)
        self.fill(x - 2, x + 3, y - 2, y + 3, z + 2, z + 7,
                  lambda X, Y, Z: (X + 0.5 - x - 0.5) ** 2 + (Y + 0.5 - y - 0.5) ** 2 + (Z + 0.5 - z - 4.5) ** 2 <= 5.5, m)


class CommercialBlock(FlatRoofed):
    """The main street's commercial block: shops with prism-glass transoms
    under a canopy or awnings; sashes under brick arches or render hoods; a
    corbel table and pressed-metal cornice; a parapet raised to a name panel
    between ball finials; a tar roof with its tank, light and vent. One
    storey makes it a false-fronted shop, the parapet stood up as a sign."""

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.brick = self.stories > 1 and self.seed % 3 != 0
        self.parapet = 20 if self.stories == 1 else 10

    def ztop(self):
        return self.top + self.parapet + 36

    def materials(self):
        super().materials()
        self.BRICKW = self.g.mat(BRICK, tex=self.tex['course'], bias=-0.5)
        self.METAL = self.PAINT[self.pick(['green', 'oxblood', 'navy', 'cream', 'teal'], 6)]

    def build(self):
        W, D, t = self.W, self.D, self.top
        wall = self.BRICKW if self.brick else self.STONE
        self.wallm = wall
        self.box(0, W, 0, D, 0, t, wall)
        self.rooms(0, GROUND)
        for s in range(1, self.stories):
            self.rooms(GROUND + STOREY * (s - 1), STOREY)
        self.ground()
        for s in range(1, self.stories):
            self.upper(s)
        self.crown()
        self.roof()
        self.pipe(W - 4, t + 2)

    def life(self):
        rng = random.Random(self.seed + 71)
        leaners = self.leaners(3, rng, range(1, self.stories))
        specs = [self.lean_out(w, rng) for w in leaners[:2]] + [self.curtain_twitch(w) for w in leaners[2:]]
        specs += self.shop_life()
        if self.washing:
            specs.append({'k': 'loop', 'states': [{'wind': p} for p in range(4)], 'ms': 280})
        return specs

    def ground(self):
        W = self.W
        self.box(0, W, -1, 0, 0, 4, self.PLINTH)
        self.box(0, W, -1, 0, GROUND - 7, GROUND - 1, self.ORN)
        self.box(0, W, -2, 0, GROUND - 2, GROUND, self.ORN)
        self.door_x = self.sx0 + W // 2
        stocks = ['grocer', 'draper', 'hardware', 'pharmacy', 'cafe']
        paints = ['green', 'oxblood', 'navy', 'teal', 'mustard']
        if not self.shops:
            pitch = W / self.bays
            door = self.bays // 2
            for k in range(self.bays):
                ax = int(pitch * (k + 0.5))
                if k == door:
                    self.street_door(ax)
                else:
                    self.window(ax - 6, ax + 6, 14, 40, kind='sash', shutters=None)
            return
        stair = self.stories > 1 and W >= 80
        if W >= 112:
            mid = W // 2
            spans = [(4, mid - 10), (mid + 10, W - 4)]
            door = mid
        elif stair:
            spans = [(4, W - 24)]
            door = W - 14
        else:
            spans = [(4, W - 4)]
            door = None
        canopy = self.seed % 3 == 0 and self.street
        for k, (x0, x1) in enumerate(spans):
            band = self.shopfront(x0, x1, self.pick(paints, 7 + k), stock=self.pick(stocks, 9 + k * 3),
                                  awning=None if canopy else (self.seed + k) % 4, transom=True,
                                  door='left' if k == 1 else 'right')
            if k == 0:
                self.sign_band = band
            for cx in (x0 - 3, x1):
                self.box(cx, cx + 3, -2, 0, 3, GROUND - 7, self.METAL)
                self.box(cx - 1, cx + 4, -3, 0, GROUND - 10, GROUND - 7, self.METAL)
                self.box(cx - 1, cx + 4, -3, 0, 3, 6, self.METAL)
        if door is not None:
            self.street_door(door)
        else:
            self.door_x = self.shop_door
        if canopy:
            self.canopy(1, W - 1, GROUND - 5, reach=12, m=self.METAL, lamps=True)

    def street_door(self, ax):
        """The street door to the stairs: panelled, a transom light over,
        a plaque beside."""
        x0, x1 = ax - 6, ax + 6
        self.box(x0 - 2, x1 + 2, -1, 0, 1, 44, self.ORN)
        self.cut(x0, x1, -1, 5, 1, 42)
        self.box(x0, x1, 5, 7, 1, 42, self.DOOR)
        self.box(x0 + 2, x1 - 2, 4, 5, 4, 16, self.DOOR)
        self.box(x0 + 2, x1 - 2, 4, 5, 19, 30, self.DOOR)
        self.box(x0, x1, 4, 5, 32, 33, self.DOOR)
        self.box(x0 + 1, x1 - 1, 5, 6, 33, 41, self.GLASS)
        self.box(x0, x1, 5, 6, 37, 38, self.DOOR)
        self.box(x1 - 3, x1 - 2, 3, 4, 17, 19, self.BRASS)
        self.box(x1 + 3, x1 + 5, -1, 0, 30, 33, self.BRASS)
        self.door_x = self.sx0 + ax

    def upper(self, s):
        W = self.W
        f = GROUND + STOREY * (s - 1)
        pitch = W / self.bays
        top = s == self.stories - 1
        self.box(0, W, -1, 0, f + 6, f + 8, self.ORN)
        self.box(0, W, -2, 0, f + 6, f + 7, self.ORN)
        for k in range(self.bays):
            ax = int(pitch * (k + 0.5))
            pairs = [(ax - 12, ax - 2), (ax + 2, ax + 12)] if pitch >= 40 else [(ax - 6, ax + 6)]
            z0, z1 = f + 8, f + (30 if not top else 29)
            for x0, x1 in pairs:
                self.window(x0, x1, z0, z1, kind='sash', shutters=None, curtains=0.6, storey=s,
                            surround=not self.brick, sill=False)
                self.arch(x0, x1, z1)
        # Brick pilasters between the bays, a course proud.
        for k in range(self.bays + 1):
            x = min(max(int(pitch * k) - 2, 0), W - 4)
            self.box(x, x + 4, -1, 0, GROUND, self.top - 8, self.wallm)

    def arch(self, x0, x1, z1):
        ax = (x0 + x1) / 2
        half = (x1 - x0) / 2
        if self.brick:
            self.fill(x0 - 2, x1 + 2, -1, 0, z1, z1 + 6,
                      lambda X, Y, Z: (((X + 0.5 - ax) / (half + 2)) ** 2 + ((Z - z1 + 0.5) / 5) ** 2 <= 1)
                      & ~((((X + 0.5 - ax) / half) ** 2 + ((Z - z1 + 0.5) / 3) ** 2 <= 1) & (Z < z1 + 2)), self.ORN)
            self.fill(x0, x1, -1, 4, z1, z1 + 3,
                      lambda X, Y, Z: ((X + 0.5 - ax) / half) ** 2 + ((Z - z1 + 0.5) / 3) ** 2 <= 1, 0)
            self.box(int(ax) - 1, int(ax) + 1, -2, 0, z1 + 2, z1 + 6, self.ORN)
        else:
            self.box(x0 - 3, x1 + 3, -3, 0, z1 + 1, z1 + 3, self.ORN)
            self.box(x0 - 3, x1 + 3, -2, 0, z1 + 3, z1 + 4, self.ORN)

    def crown(self):
        W, t = self.W, self.top
        P = self.parapet
        wall = self.wallm
        if self.stories > 1:
            self.box(0, W, -1, 0, t - 8, t - 5, self.ORN)
            for x in range(0, W, 4):
                self.box(x, x + 2, -1, 0, t - 5, t - 2, wall)
            self.box(0, W, -2, 0, t - 2, t, wall)
            self.box(0, W, -5, 0, t, t + 3, self.METAL)
            self.box(0, W, -6, 0, t + 3, t + 5, self.METAL)
            pitch = W / self.bays
            for k in range(self.bays + 1):
                x = min(max(int(pitch * k) - 1, 0), W - 3)
                self.fill(x, x + 3, -5, 0, t - 8, t, lambda X, Y, Z: Y >= -5 + (t - 1 - Z) * 0.7, self.METAL)
            base = t + 5
        else:
            self.box(0, W, -2, 0, t, t + 3, self.ORN)
            base = t + 3
        self.box(0, W, 0, 3, base, t + P, wall)
        self.box(0, W, -1, 0, base + 2, t + P - 2, wall)
        self.box(0, W, -2, 3, t + P, t + P + 2, self.ORN)
        # The raised centre and its name panel.
        cx = W / 2
        half = max(10, W // 4)
        rise = 8 if W >= 64 else 5
        self.fill(int(cx - half), int(cx + half) + 1, 0, 3, t + P, t + P + rise + 2,
                  lambda X, Y, Z: (Z - t - P) * (half / rise) <= half - np.abs(X + 0.5 - cx) + 1, wall)
        self.fill(int(cx - half) - 1, int(cx + half) + 2, -2, 3, t + P + 1, t + P + rise + 3,
                  lambda X, Y, Z: np.abs((Z - t - P - 1) * (half / rise) - (half - np.abs(X + 0.5 - cx) + 1)) < 1.4,
                  self.ORN)
        pw = min(half, 18)
        self.box(int(cx - pw), int(cx + pw), -2, 0, base + 3, t + P - 3, self.ORN)
        self.box(int(cx - pw) + 2, int(cx + pw) - 2, -1, 0, base + 4, t + P - 4, wall)
        for x in (1, W - 4):
            self.finial(x, 0, t + P + 2)

    def roof(self):
        W, D, t = self.W, self.D, self.top
        self.deck(t, self.wallm)
        rng = random.Random(self.seed + 31)
        if W >= 80:
            self.tank(W - 30, D - 28, t, w=14, d=12, h=11, legs=7)
        if W >= 64:
            self.skylight(int(W * 0.25), D // 2 - 6, t)
        self.vent(W // 2 + 6, D // 3, t)
        self.chimney(6, D - 14, t, w=7, d=6, h=11, pots=2, m=self.BRICK)
        if self.stories > 1 and W >= 112:
            self.stairhead(W // 2 - 2, D // 2 + 6, t)
        self.washing = rng.random() < 0.5 and W >= 96
        if self.washing:
            self.laundry(10, W // 2 - 8, D - 18, t, rng=rng)


class ModerneApartment(FlatRoofed):
    """The apartment house of the interwar boom from Tel Aviv and Bombay's
    Marine Drive to Havana, Napier and Shanghai: smooth render with speed
    lines, rounded balconies with tube rails, eyebrow hoods over steel
    windows, a stair tower lit by glass block that rises above the parapet
    to a stepped crown and a flagstaff, and a roof of washing and tanks."""

    def ztop(self):
        return self.top + 56

    def materials(self):
        super().materials()
        self.GLASSBLOCK = self.g.mat(GLASSBLOCK, bias=0.2, lamp=False,
                                     tex=lambda i: -1.0 * ((i['x'] % 3 == 0) | (i['z'] % 3 == 0)))
        self.ACCENT = self.g.mat(ramp_from(self.pick(['#e8e2d2', '#d6b24a', '#b8505a', '#3a7a8a'], 4)), bias=-0.2)
        self.WHITE = self.g.mat(ramp_from('#e6e0d0'), bias=-0.2)

    def build(self):
        W, D, t = self.W, self.D, self.top
        self.box(0, W, 0, D, 0, t, self.STONE)
        self.rooms(0, GROUND)
        for s in range(1, self.stories):
            self.rooms(GROUND + STOREY * (s - 1), STOREY)
        pitch = W / self.bays
        self.tower = self.bays // 2 if self.bays >= 3 else None
        self.axes = [int(pitch * (k + 0.5)) for k in range(self.bays)]
        self.ground()
        for s in range(1, self.stories):
            self.upper(s)
        self.lines()
        if self.tower is not None:
            self.stair_tower(self.axes[self.tower])
        self.crown()
        self.pipe(W - 4, t + 2)

    def life(self):
        rng = random.Random(self.seed + 71)
        leaners = self.leaners(2, rng, range(1, self.stories))
        specs = [self.lean_out(w, rng) for w in leaners[:1]] + [self.curtain_twitch(w) for w in leaners[1:]]
        specs += self.shop_life()
        specs.append({'k': 'loop', 'states': [{'wind': p} for p in range(4)], 'ms': 280})
        return specs

    def lines(self):
        """Three speed lines at every floor, stopped short of the tower."""
        W = self.W
        for s in range(self.stories):
            f = GROUND + STOREY * (s - 1) if s else GROUND
            for dz in (-3, -6):
                self.cut(0, W, 0, 1, f + dz, f + dz + 1)

    def ground(self):
        W = self.W
        self.box(0, W, -1, 0, 0, 5, self.PLINTH)
        door_k = self.tower if self.tower is not None else self.bays - 1
        for k, ax in enumerate(self.axes):
            if k == door_k:
                self.entrance(ax)
            elif self.shops:
                pitch = W / self.bays
                x0 = max(4, int(ax - pitch / 2) + 4)
                x1 = min(W - 4, int(ax + pitch / 2) - 4)
                band = self.shopfront(x0, x1, self.pick(['navy', 'teal', 'oxblood'], 3 + k), trim=self.CHROME,
                                      stock=self.pick(['draper', 'pharmacy', 'cafe', 'grocer'], 5 + k),
                                      awning=(self.seed + k) % 4 if k % 2 == 0 else None)
                self.sign_band = self.sign_band or band
            else:
                self.window(ax - 10, ax + 10, 14, 38, kind='steel', shutters=None, curtains=0.5, sill=True,
                            surround=False, frame=self.WHITE)
                self.eyebrow(ax - 10, ax + 10, 38)

    def entrance(self, ax):
        x0, x1 = ax - 8, ax + 8
        self.box(x0 - 3, x1 + 3, -2, 0, 0, 46, self.ACCENT)
        self.cut(x0, x1, -2, 6, 1, 40)
        self.box(x0, x1, 6, 7, 1, 40, self.GLASS)
        for x in (x0, ax - 1, ax, x1 - 1):
            self.box(x, x + 1, 5, 7, 1, 40, self.CHROME)
        for z in (1, 14, 30, 39):
            self.box(x0, x1, 5, 7, z, z + 1, self.CHROME)
        self.box(ax - 3, ax - 1, 4, 5, 16, 22, self.CHROME)
        self.box(ax + 1, ax + 3, 4, 5, 16, 22, self.CHROME)
        # A half-disc canopy, and the house's name panel over it.
        self.fill(x0 - 8, x1 + 8, -12, 0, 42, 45, lambda X, Y, Z: (X + 0.5 - ax) ** 2 + (Y * 1.4) ** 2 <= 16 ** 2,
                  self.WHITE)
        self.fill(x0 - 8, x1 + 8, -12, 0, 41, 42, lambda X, Y, Z: (X + 0.5 - ax) ** 2 + (Y * 1.4) ** 2 <= 14 ** 2,
                  self.WHITE)
        self.box(ax - 1, ax + 1, -6, -5, 38, 41, self.GLOBE)
        self.lamps.append((ax, -6, 39))
        self.box(x0 - 3, x1 + 3, 0, 1, 0, 1, self.MARBLE)
        self.box(x0 - 5, x1 + 5, -4, 0, 0, 1, self.MARBLE)
        self.door_x = self.sx0 + ax
        # Portholes either side.
        for px in (x0 - 9, x1 + 9):
            self.porthole(px, 26, 4)

    def porthole(self, cx, cz, r):
        ring = lambda X, Z, rr: (X + 0.5 - cx) ** 2 + (Z + 0.5 - cz) ** 2 <= rr * rr
        self.fill(cx - r - 2, cx + r + 2, -1, 0, cz - r - 2, cz + r + 2, lambda X, Y, Z: ring(X, Z, r + 1.5), self.ACCENT)
        self.fill(cx - r - 1, cx + r + 1, -2, 4, cz - r - 1, cz + r + 1, lambda X, Y, Z: ring(X, Z, r), 0)
        self.fill(cx - r - 1, cx + r + 1, 3, 4, cz - r - 1, cz + r + 1, lambda X, Y, Z: ring(X, Z, r), self.GLASS)
        self.box(cx - r, cx + r, 2, 3, cz, cz + 1, self.WHITE)
        self.box(cx, cx + 1, 2, 3, cz - r, cz + r, self.WHITE)

    def eyebrow(self, x0, x1, z):
        self.box(x0 - 3, x1 + 3, -5, 0, z + 1, z + 2, self.WHITE)
        self.box(x0 - 3, x1 + 3, -5, -4, z, z + 1, self.WHITE)

    def upper(self, s):
        W = self.W
        f = GROUND + STOREY * (s - 1)
        pitch = W / self.bays
        rng = random.Random(self.seed * 5 + s)
        for k, ax in enumerate(self.axes):
            if k == self.tower:
                continue
            x0 = max(3, int(ax - pitch / 2) + 5)
            x1 = min(W - 3, int(ax + pitch / 2) - 5)
            self.window(x0, x1, f + 8, f + 30, kind='steel', shutters=None, curtains=0.55, storey=s,
                        surround=False, frame=self.WHITE)
            self.eyebrow(x0, x1, f + 30)
            edge = k in (0, self.bays - 1)
            if (s % 2 == 1 or edge) and (s > 0):
                self.balcony(x0 - 4, x1 + 4, f, rng, round_left=k == 0, round_right=k == self.bays - 1)

    def balcony(self, x0, x1, f, rng, round_left, round_right):
        x0, x1 = max(0, x0), min(self.W, x1)
        r = 7
        rl = r if round_left else 0.01
        rr = r if round_right else 0.01

        def plan(X, Y, Z, inset=0.0):
            cx = np.clip(X + 0.5, x0 + rl, x1 - rr)
            rad = np.where(X + 0.5 < x0 + rl, rl, np.where(X + 0.5 > x1 - rr, rr, r)) - inset
            dy = np.minimum(0, Y + 0.5 - (-r + 0.5))
            inside = ((X + 0.5 - cx) ** 2 + dy ** 2 <= rad ** 2) & (Y >= -8 + inset) & (Y < 0)
            return inside & (X + 0.5 >= x0 + inset) & (X + 0.5 <= x1 - inset)

        self.fill(x0, x1, -8, 0, f + 1, f + 4, plan, self.WHITE)
        # A solid parapet of render, speed-lined, and a tube rail over it.
        self.fill(x0, x1, -8, 0, f + 4, f + 11, lambda X, Y, Z: plan(X, Y, Z) & ~plan(X, Y, Z, 1.2), self.STONE)
        self.fill(x0, x1, -8, 0, f + 7, f + 8, lambda X, Y, Z: plan(X, Y, Z) & ~plan(X, Y, Z, 1.2), self.ACCENT)
        self.fill(x0, x1, -8, 0, f + 13, f + 14, lambda X, Y, Z: plan(X, Y, Z) & ~plan(X, Y, Z, 1.0), self.CHROME)
        for x in range(x0 + 2, x1 - 1, 9):
            self.box(x, x + 1, -7, -6, f + 11, f + 13, self.CHROME)
        if rng.random() < 0.6:
            self.potted(x1 - 9, -6, f + 4, tall=rng.randint(6, 12), rng=rng)
        if rng.random() < 0.35:
            c = rng.choice(self.LINEN)
            self.box(x0 + 4, x0 + 12, -8, -7, f + 8, f + 14, c)

    def stair_tower(self, ax):
        t = self.top
        x0, x1 = ax - 9, ax + 9
        self.box(x0, x1, -3, 0, 0, t + 18, self.STONE)
        self.box(x0 - 1, x1 + 1, -3, 0, t + 18, t + 20, self.WHITE)
        self.box(x0 + 3, x1 - 3, -3, 0, t + 20, t + 24, self.STONE)
        self.box(x0 + 2, x1 - 2, -3, 0, t + 24, t + 25, self.WHITE)
        self.box(x0 + 6, x1 - 6, -3, 0, t + 25, t + 28, self.STONE)
        self.box(x0, x1, 0, 16, t, t + 18, self.STONE)
        self.box(x0 + 3, x1 - 3, 0, 13, t + 18, t + 24, self.STONE)
        self.box(x0 - 1, x1 + 1, -3, 17, t + 18, t + 19, self.WHITE)
        # Glass block the height of the stair, and a fin either side.
        self.box(x0 + 4, x1 - 4, -4, -2, GROUND + 4, t + 10, self.GLASSBLOCK)
        for x in (x0 + 2, x1 - 3):
            self.box(x, x + 1, -6, -3, GROUND, t + 16, self.WHITE)
        if self.stories < 4 and self.seed % 3:
            return
        self.box(ax - 1, ax, -2, -1, t + 28, t + 52, self.PIPE)
        self.flagged = True
        phase = self.state.get('wind', 0) * np.pi / 2
        for i in range(10):
            wave = round(np.sin(i * 0.8 - phase) * min(1, i / 3))
            for z in range(6):
                self.box(ax + i, ax + i + 1, -2 + wave, -1 + wave, t + 45 + z - (i > 6 and phase > 2),
                         t + 46 + z - (i > 6 and phase > 2), self.FLAG[(i // 5 + z // 3) % 2])

    def crown(self):
        W, D, t = self.W, self.D, self.top
        self.box(0, W, -2, 3, t, t + 7, self.STONE)
        self.box(0, W, -3, 3, t + 7, t + 8, self.WHITE)
        self.cut(0, W, -2, -1, t + 3, t + 4)
        self.deck(t, self.STONE, low=7, m=self.ROOFTILE)
        for y in (0, D - 3):
            self.box(0, W, y, y + 1, t + 11, t + 12, self.CHROME)
        for x in range(2, W, 12):
            self.box(x, x + 1, 1, 2, t + 8, t + 12, self.CHROME)
        rng = random.Random(self.seed + 41)
        self.laundry(6, W // 2 - 12, D // 2 - 10, t, rng=rng)
        if W >= 96:
            self.laundry(W // 2 + 12, W - 8, D // 2 - 2, t, rng=rng)
        self.tank(W - 22, D - 24, t, w=12, d=10, h=9, legs=4)
        self.tank(6, D - 22, t, w=10, d=9, h=8, legs=4)
        for x in range(8, W - 8, 21):
            if rng.random() < 0.6:
                self.potted(x, 5, t, tall=rng.randint(6, 12), rng=rng)


class OfficeBlock(FlatRoofed):
    """The office of the twenties to the fifties, stripped classical: a
    granite plinth and a stone base with a revolving door under a bronze
    marquee; stone piers the full height between Chicago windows in bronze,
    spandrels recessed between the floors; an attic over a belt cornice;
    on the roof the lift house, a cedar water tower and a flagstaff."""

    def ztop(self):
        return self.top + 60

    def materials(self):
        super().materials()
        g = self.g
        stone = self.pick([PORTLAND, LIMESTONE, ramp_from('#b49a86')], 2)
        self.STONE = g.mat(stone, tex=self.tex['stone'], bias=-0.35)
        self.ORN = g.mat(stone, tex=self.tex['stone'], bias=-0.05)
        self.SPANDREL = g.mat(stone, bias=-1.4, tex=lambda i: 0.9 * ((i['x'] % 4 == 1) & (i['z'] % 4 == 1)))
        wall = (self.material or {}).get('wall')
        glass = GLASS if not wall else [wall[0], wall[0], wall[1], wall[1], wall[2], wall[2], wall[3], wall[4]]
        self.GLASS = g.mat(glass, glass=True)
        self.BRONZE = g.mat(BRONZE, bias=0.3)
        self.CEDAR = g.mat(CEDAR, bias=-0.2, tex=lambda i: -1.0 * (i['x'] % 3 == 0) - 0.8 * (i['z'] % 6 == 0))

    def build(self):
        W, D, t = self.W, self.D, self.top
        self.box(0, W, 0, D, 0, t, self.STONE)
        self.rooms(0, GROUND)
        for s in range(1, self.stories):
            self.rooms(GROUND + STOREY * (s - 1), STOREY)
        pitch = W / self.bays
        self.axes = [int(pitch * (k + 0.5)) for k in range(self.bays)]
        self.ground()
        for s in range(1, self.stories):
            self.upper(s)
        self.piers()
        self.crown()
        self.roof()

    def ground(self):
        W = self.W
        self.box(0, W, -2, 0, 0, 7, self.GRANITE)
        for z in range(13, GROUND - 8, 7):
            self.cut(0, W, 0, 1, z, z + 1)
        self.box(0, W, -1, 0, GROUND - 8, GROUND, self.ORN)
        self.box(0, W, -3, 0, GROUND - 2, GROUND, self.ORN)
        mid = self.bays // 2
        for k, ax in enumerate(self.axes):
            if k == mid:
                self.entrance(ax)
            elif self.shops:
                self.window(ax - 10, ax + 10, 10, GROUND - 12, kind='plate', shutters=None, curtains=0,
                            surround=False, frame=self.BRONZE, depth=4)
                self.box(ax - 11, ax + 11, -2, 0, GROUND - 12, GROUND - 10, self.BRONZE)
            else:
                self.window(ax - 8, ax + 8, 12, GROUND - 14, kind='sash', shutters=None, curtains=0.3,
                            frame=self.BRONZE)

    def entrance(self, ax):
        x0, x1 = ax - 12, ax + 12
        # A recess to a bronze screen, a marble lobby lit beyond it, and a
        # revolving door standing forward in a glass drum.
        self.cut(x0, x1, -2, 8, 1, GROUND - 10)
        self.box(x0, x1, 1, 8, 0, 1, self.MARBLE)
        self.box(x0 - 1, x1 + 1, 30, 34, 1, GROUND - 10, self.BRONZE)
        self.box(x0 + 2, x1 - 2, 8, 30, 0, 1, self.CHECK)
        self.box(x0, x1, 8, 9, 1, GROUND - 10, self.SHOPGLASS)
        for x in range(x0, x1 + 1, 6):
            self.box(min(x, x1 - 1), min(x, x1 - 1) + 1, 7, 9, 1, GROUND - 10, self.BRONZE)
        for z in (1, 32, GROUND - 11):
            self.box(x0, x1, 7, 9, z, z + 1, self.BRONZE)
        self.box(ax - 4, ax + 4, 26, 29, 12, 18, self.GLOBE)
        self.lamps.append((ax, 27, 14))
        cy, r = 7, 6
        drum = lambda X, Y: (X + 0.5 - ax) ** 2 + (Y + 0.5 - cy) ** 2
        self.fill(ax - r, ax + r, cy - r, cy, 1, 30,
                  lambda X, Y, Z: (drum(X, Y) <= r * r) & (drum(X, Y) > (r - 1.2) ** 2), self.SHOPGLASS)
        self.fill(ax - r, ax + r, cy - r, cy, 1, 30,
                  lambda X, Y, Z: (drum(X, Y) <= r * r) & (drum(X, Y) > (r - 1.2) ** 2) & (np.abs(X + 0.5 - ax) > r - 1.5),
                  self.BRONZE)
        self.fill(ax - r - 1, ax + r + 1, cy - r - 1, cy + r + 1, 30, 33,
                  lambda X, Y, Z: drum(X, Y) <= (r + 1) ** 2, self.BRONZE)
        self.box(ax, ax + 1, cy - 1, cy, 1, 30, self.BRONZE)
        # A bronze marquee lit from beneath, the name on its fascia.
        self.box(x0 - 4, x1 + 4, -10, 0, GROUND - 12, GROUND - 9, self.BRONZE)
        self.box(x0 - 4, x1 + 4, -11, -9, GROUND - 13, GROUND - 7, self.BRONZE)
        for x in range(x0, x1, 6):
            self.box(x, x + 2, -6, -4, GROUND - 13, GROUND - 12, self.GLOBE)
            self.lamps.append((x, -5, GROUND - 13))
        self.sign_band = [self.sx0 + x0 - 2, self.base - (GROUND - 8) + 5, x1 - x0 + 4, 5]
        self.door_x = self.sx0 + ax

    def upper(self, s):
        f = GROUND + STOREY * (s - 1)
        pitch = self.W / self.bays
        attic = s == self.stories - 1 and self.stories >= 4
        for ax in self.axes:
            x0, x1 = int(ax - pitch / 2) + 5, int(ax + pitch / 2) - 5
            if attic:
                self.window(x0 + 3, x1 - 3, f + 10, f + 26, kind='sash', shutters=None, curtains=0.4, storey=s,
                            frame=self.BRONZE, sill=False)
                continue
            self.window(x0, x1, f + 6, f + 30, kind='chicago', shutters=None, curtains=0.35, storey=s,
                        surround=False, sill=False, frame=self.BRONZE)
            self.box(x0, x1, 0, 2, f + 30, f + STOREY + 6, self.SPANDREL)
            self.cut(x0, x1, -1, 0, f + 30, f + STOREY + 6)
            self.box(x0, x1, 0, 1, f + 30, f + STOREY + 6, self.SPANDREL)
        if attic:
            self.box(0, self.W, -3, 0, f - 2, f + 2, self.ORN)
            self.box(0, self.W, -4, 0, f + 1, f + 2, self.ORN)

    def piers(self):
        W, t = self.W, self.top
        pitch = W / self.bays
        end = t - (STOREY + 2 if self.stories >= 4 else 8)
        for k in range(self.bays + 1):
            x = min(max(int(pitch * k) - 3, 0), W - 6)
            self.box(x, x + 6, -2, 0, GROUND, end, self.ORN)
            self.box(x - 1, x + 7, -3, 0, end - 3, end, self.ORN)

    def crown(self):
        W, t = self.W, self.top
        self.box(0, W, -1, 0, t - 8, t, self.ORN)
        for x in range(0, W, 3):
            self.box(x, x + 2, -3, 0, t - 3, t - 1, self.ORN)
        self.box(0, W, -6, 0, t, t + 3, self.ORN)
        self.box(0, W, -7, 0, t + 3, t + 4, self.ORN)
        self.box(0, W, -2, 3, t + 4, t + 11, self.STONE)
        self.box(0, W, -3, 3, t + 11, t + 12, self.ORN)
        self.deck(t, self.STONE, low=10, m=self.GRAVEL)

    def roof(self):
        W, D, t = self.W, self.D, self.top
        # Lift house with louvres, the stair beside it.
        lx, ly = W // 2 - 14, D // 2
        self.box(lx, lx + 24, ly, ly + 20, t, t + 18, self.STONE)
        self.box(lx - 1, lx + 25, ly - 1, ly + 21, t + 18, t + 20, self.ORN)
        for z in range(t + 6, t + 15, 2):
            self.box(lx + 4, lx + 12, ly - 1, ly, z, z + 1, self.PIPE)
        self.box(lx + 15, lx + 21, ly - 1, ly, t, t + 12, self.DOOR)
        if self.stories >= 3 or self.seed % 2:
            self.water_tower(W, D, t)
        self.skylight(8, D // 2 - 4, t, w=14, d=12)
        self.vent(W // 2 + 16, D // 3, t)
        if self.stories >= 4:
            self.flag(lx + 3, ly + 3, t + 20)

    def life(self):
        if self.stories >= 4:
            return [{'k': 'loop', 'states': [{'wind': p} for p in range(4)], 'ms': 240}]
        return []

    def flag(self, fx, fy, z):
        self.box(fx, fx + 1, fy, fy + 1, z, z + 38, self.PIPE)
        phase = self.state.get('wind', 0) * np.pi / 2
        for i in range(12):
            wave = round(np.sin(i * 0.7 - phase) * min(1, i / 3))
            for dz in range(7):
                self.box(fx + 1 + i, fx + 2 + i, fy + wave, fy + 1 + wave, z + 30 + dz, z + 31 + dz,
                         self.FLAG[(dz // 4) % 2])

    def water_tower(self, W, D, t):
        """The cedar tank on its steel stand, hooped, under a cone."""
        tx, ty, r = W - 24 if W >= 96 else W - 20, D - 34, 8 if W >= 96 else 6
        legs = 12
        for dx in (-r + 1, r - 2):
            for dy in (-r + 1, r - 2):
                self.box(tx + dx, tx + dx + 1, ty + dy, ty + dy + 1, t, t + legs, self.IRON)
        self.box(tx - r, tx + r, ty - r, ty + r, t + legs - 1, t + legs, self.IRON)
        cyl = lambda X, Y: (X + 0.5 - tx) ** 2 + (Y + 0.5 - ty) ** 2
        self.fill(tx - r, tx + r, ty - r, ty + r, t + legs, t + legs + 16, lambda X, Y, Z: cyl(X, Y) <= r * r, self.CEDAR)
        for z in (t + legs + 3, t + legs + 9, t + legs + 14):
            self.fill(tx - r - 1, tx + r + 1, ty - r - 1, ty + r + 1, z, z + 1,
                      lambda X, Y, Z: cyl(X, Y) <= (r + 0.6) ** 2, self.IRON)
        self.fill(tx - r - 1, tx + r + 1, ty - r - 1, ty + r + 1, t + legs + 16, t + legs + 24,
                  lambda X, Y, Z: cyl(X, Y) <= (r + 1 - (Z - t - legs - 16) * (r + 1) / 8) ** 2, self.CEDAR)


KINDS = {'modern-shop': CommercialBlock, 'modern-apartment': ModerneApartment, 'modern-office': OfficeBlock}


def make(out, zoom=2):
    import json
    from art.review_sheet import recipes
    from art.reference import current_adult_d
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    all_r, _, source = recipes()
    rows = []
    for base, cls in KINDS.items():
        row = []
        for form in ('stall', 'hut', 'cottage', 'shop', 'row', 'wide', 'tall', 'midrise', 'office'):
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
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/gold/street.png')
