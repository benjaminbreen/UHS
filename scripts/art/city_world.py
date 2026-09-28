"""The world's twentieth-century street, drawn to the city kit's standard.

    .venv/bin/python scripts/art/city_world.py artifacts/city-kit/world.png

One painter for the urban kit's modern bases: the commercial block, the
apartment house, the office, the walk-up with iron balconies, the arcaded
shophouse and the tin-roofed veranda house. They stand from Nairobi to
Buenos Aires and Shanghai, so each is a type, not a city: its colours come
from the recipe's wall material, its detail from the type.
"""
from pathlib import Path
import math
import random
import sys

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.city_kit import (  # noqa: E402
    C, GLASS, GOLD, IRON, OAK, INK, GREEN, TERRA, awn, glass, h2, iron_rail, mix, outline, rgba,
)
from art.oblique_style import DRIFT  # noqa: E402

G, S, TOP = 50, 38, 14
AWNINGS = [
    (('#8a1f2c', '#b8323a', '#d04a4a', '#e06a60'), ('#b9ad92', '#e8dec6', '#f6efdc', '#fff8e8')),
    (('#15302a', '#20483a', '#2f634c', '#468262'), ('#b9ad92', '#e8dec6', '#f6efdc', '#fff8e8')),
    (('#18203f', '#26335e', '#384a80', '#5670a4'), ('#b9ad92', '#e8dec6', '#f6efdc', '#fff8e8')),
    (('#6b4a1f', '#b08a3e', '#d8b25a', '#f0cf7a'), ('#9d917c', '#cfc4aa', '#efe6cf', '#fbf3e0')),
]
SHUTTER = ['#15302a', '#20483a', '#2f634c', '#468262', '#6aa47a']
CONCRETE = ['#34343c', '#55565c', '#7a7b7c', '#9d9c98', '#bdbab2', '#d8d4c8']
TIN = ['#3a2a28', '#6a4a3a', '#8a6a52', '#a8a49c', '#c8c6be', '#e2e0d8']
TILE = ['#2a1a1e', '#4e2a26', '#76382c', '#9a4c34', '#bc6a46', '#d88c62']


def ramp(wall):
    """The material's five wall tones stretched to seven, the shadow end
    cooled toward violet and the light end warmed."""
    dark, shade, base, light, hi = wall
    return [mix(mix(dark, '#2a2440', 0.4), INK, 0.35), mix(dark, '#3a3050', 0.25), shade, base, light, hi,
            mix(hi, '#fff6e0', 0.45)]


class WorldBlock:
    """Reads the urban kit's modern recipe: `modernStyle` (block, arcade,
    veranda), `modernRole`, stories, bays, footprint, facing and the base
    name, which picks the type."""

    def __init__(self, recipe, material):
        self.r, self.p = recipe, material
        self.seed = recipe['seed']
        self.rng = random.Random(self.seed)
        self.facing = recipe.get('facing', 'south')
        fw, fh = recipe['footprint']
        self.W = fw * 16
        self.stories = max(1, recipe.get('stories', 1))
        self.style = recipe.get('modernStyle', 'block')
        self.shop = recipe.get('modernRole') == 'shop'
        name = recipe.get('modernBase') or recipe.get('base') or ''
        self.kind = next((k for k in ('office', 'apartment', 'walkup', 'shophouse', 'kampung', 'shop')
                          if f'modern-{k}' in name), 'shop')
        if self.style == 'arcade':
            self.kind = 'shophouse'
        if self.style == 'veranda':
            self.kind = 'kampung'
        self.st = ramp(material['wall'])
        self.pitched = self.kind in ('shophouse', 'kampung')
        roof = 30 if self.pitched else 22
        self.wall = G + S * (self.stories - 1)
        self.H = roof + TOP + self.wall + 4
        self.w, self.h = self.W + DRIFT + 4, self.H
        self.c = C(self.w, self.h)
        self.bottom = self.h - 3
        self.anchor_x = self.W // 2
        self.door_x = self.W // 2
        self.sign_band = None
        self.sign_paint = ['#7d3a30', '#2f4a63', '#5b5a32', '#63402f', '#2f5750', '#6a3350'][
            (self.seed + len(name) + fw * 3) % 6]

    # ------------------------------------------------------------- shell
    def render(self):
        c, st, W = self.c, self.st, self.W
        b = self.bottom
        top = b - self.wall
        self.top = top
        self.cornice_y = top - TOP
        # The east return, a sliver in shade the height of the wall.
        for y in range(self.cornice_y, b + 1):
            for i in range(DRIFT):
                c.px(W + i, y - i // 2, mix(st[1], INK, 0.1 * i))
        self.walls(top, b)
        getattr(self, f'type_{self.kind}')(top, b)
        # A side or back wall still has a way in, where the leaf will hang.
        if self.facing != 'south':
            self.door(self.door_x, b, h=30, w=12, canopy=False)
        self.roof()
        c.hl(0, W - 1, b, st[0])
        c.hl(0, W - 1, b - 1, st[1])
        im = outline(c.im, soft=0.35, hard=0.6)
        # The contact line on the ground, soft.
        for x in range(W + DRIFT):
            im.putpixel((x, b + 1), (30, 34, 26, 150))
        self.occlusion = [0, self.cornice_y - 8, W + DRIFT, b - 1]
        self.im = im
        return im

    def walls(self, top, b):
        c, st, W = self.c, self.st, self.W
        c.rect(0, self.cornice_y, W - 1, b, st[3])
        # Render weathers in long streaks under each sill and a darker band
        # of splash at the foot, never in speckle.
        for x in range(W):
            for y in range(b - 8, b - 1):
                c.px(x, y, mix(st[3], st[2], 0.5 + 0.1 * (y - b + 8) / 7))
        c.vl(0, self.cornice_y, b, st[5])
        c.vl(1, self.cornice_y, b, st[4])

    def bays(self, n=None):
        n = n or max(1, self.r.get('bays', 3))
        pitch = (self.W - 12) / n
        return [int(6 + pitch * (k + 0.5)) for k in range(n)], pitch

    def floor_y(self, s):
        """Top of storey `s` (0 = ground)."""
        return self.bottom - G - S * s if s else self.bottom - G

    def band(self, y, lit=True):
        c, st = self.c, self.st
        c.hl(0, self.W - 1, y, st[5] if lit else st[4])
        c.hl(0, self.W - 1, y + 1, st[4])
        c.hl(0, self.W - 1, y + 2, st[1])

    # ------------------------------------------------------------- parts
    def sash(self, x, y, w, h, s, frame='#ede7da', shutters=False, balcony=False):
        c, st = self.c, self.st
        c.rect(x - 2, y - 2, x + w + 1, y + h + 1, st[4])
        c.vl(x - 2, y - 2, y + h + 1, st[5])
        c.vl(x + w + 1, y - 1, y + h + 1, st[2])
        c.rect(x - 1, y - 1, x + w, y + h, frame)
        glass(c, x, y, x + w - 1, y + h - 1, self.seed + x + s * 7,
              ['#d8cdb4', '#b4a78c'] if h2(x, s, self.seed) < 0.3 else None)
        c.hl(x, x + w - 1, y + h // 2, frame)
        c.vl(x + w // 2, y, y + h - 1, frame)
        c.rect(x - 3, y + h + 2, x + w + 2, y + h + 3, st[5])
        c.hl(x - 3, x + w + 2, y + h + 4, st[1])
        c.rect(x - 3, y - 5, x + w + 2, y - 3, st[5])
        c.hl(x - 3, x + w + 2, y - 5, st[6])
        c.hl(x - 3, x + w + 2, y - 2, st[2])
        if shutters:
            for sx, lit in ((x - 6, True), (x + w + 2, False)):
                c.rect(sx, y - 1, sx + 3, y + h, SHUTTER[2])
                for yy in range(y, y + h, 2):
                    c.hl(sx, sx + 3, yy, SHUTTER[3] if lit else SHUTTER[1])
                c.vl(sx + (0 if lit else 3), y - 1, y + h, SHUTTER[4] if lit else SHUTTER[0])
        if balcony:
            c.rect(x - 5, y + h - 1, x + w + 4, y + h + 1, st[5])
            c.hl(x - 5, x + w + 4, y + h + 2, st[1])
            iron_rail(c, x - 4, x + w + 3, y + h - 8, 8, pattern=0)
        # One room in four has a plant on the sill.
        if h2(x, s + 3, self.seed) < 0.25 and not balcony:
            for i in range(w - 2):
                c.px(x + 1 + i, y + h - 1 - int(h2(i, s, self.seed) * 2), GREEN[4] if i % 2 else GREEN[3])
            c.px(x + w // 2, y + h - 3, '#c8363c')

    def shopfront(self, x0, x1, y0, b, awning=True):
        """Plate glass between pilasters, a stall riser, a glazed door, the
        painted board the renderer letters, and an awning let down."""
        c, st = self.c, self.st
        paint = [mix(self.sign_paint, INK, 0.5), self.sign_paint, mix(self.sign_paint, '#ffffff', 0.15),
                 mix(self.sign_paint, '#ffffff', 0.35)]
        c.rect(x0, y0, x1, b - 2, paint[0])
        board = y0 + 2
        c.rect(x0 + 2, board, x1 - 2, board + 8, paint[1])
        c.hl(x0 + 2, x1 - 2, board, paint[3])
        c.hl(x0 + 2, x1 - 2, board + 8, paint[0])
        self.sign_band = [x0 + 3, board + 1, x1 - x0 - 5, 7]
        gy0, gy1 = board + 11, b - 9
        dw = 12
        dx = self.door_x - dw // 2
        glass(c, x0 + 3, gy0, x1 - 3, gy1, self.seed)
        for k in range(1, 3):
            mx = x0 + 3 + (x1 - x0 - 6) * k // 3
            if not (dx - 2 <= mx <= dx + dw + 1):
                c.vl(mx, gy0, gy1, paint[2])
        # Goods show as a shelf of colour at the foot of the glass.
        for x in range(x0 + 4, x1 - 3):
            if h2(x // 3, 1, self.seed) > 0.35:
                col = [GOLD[2], '#c8363c', GREEN[4], '#d8cdb4', '#5670a4'][int(h2(x // 3, 2, self.seed) * 5)]
                c.px(x, gy1 - 2, col)
                c.px(x, gy1 - 1, mix(col, INK, 0.3))
        c.rect(x0 + 3, gy1 + 1, x1 - 3, b - 3, paint[1])
        c.hl(x0 + 3, x1 - 3, gy1 + 1, paint[3])
        c.rect(dx - 1, gy0 - 1, dx + dw, b - 2, paint[0])
        glass(c, dx + 1, gy0 + 1, dx + dw - 2, b - 12, self.seed + 5)
        c.rect(dx + 1, b - 11, dx + dw - 2, b - 3, paint[1])
        c.px(dx + dw - 3, b - 14, GOLD[3])
        for px_ in (x0, x1 - 2):
            c.rect(px_, y0, px_ + 2, b - 2, st[4])
            c.vl(px_, y0, b - 2, st[6])
            c.vl(px_ + 2, y0, b - 2, st[2])
        if awning and self.facing == 'south':
            awn(c, x0 + 2, x1 - 2, gy0 - 1, AWNINGS[self.seed % len(AWNINGS)], drop=8)

    def door(self, cx, b, h=34, w=14, canopy=True):
        c, st = self.c, self.st
        x = cx - w // 2
        c.rect(x - 3, b - h - 4, x + w + 2, b - 2, st[4])
        c.vl(x - 3, b - h - 4, b - 2, st[6])
        c.vl(x + w + 2, b - h - 4, b - 2, st[2])
        c.rect(x, b - h, x + w - 1, b - 2, OAK[1])
        glass(c, x + 2, b - h + 2, x + w - 3, b - h + 14, self.seed + 9)
        c.rect(x + 2, b - h + 17, x + w - 3, b - 4, OAK[2])
        c.vl(cx, b - h, b - 2, OAK[0])
        c.px(cx - 2, b - h // 2, GOLD[3])
        if canopy:
            c.rect(x - 5, b - h - 8, x + w + 4, b - h - 6, CONCRETE[4])
            c.hl(x - 5, x + w + 4, b - h - 8, CONCRETE[5])
            c.hl(x - 5, x + w + 4, b - h - 5, INK)
            for xx in range(x - 4, x + w + 4):
                p = c.get(xx, b - h - 4)
                if p[3]:
                    c.px(xx, b - h - 4, mix(p, INK, 0.35))
        c.hl(x - 4, x + w + 3, b - 1, st[5])

    def cornice(self, y, deep=True):
        """A moulded cornice on brackets: lit crown, shadowed soffit, and the
        shadow it throws on the wall."""
        c, st, W = self.c, self.st, self.W
        c.rect(0, y, W - 1, y + 5, st[4])
        c.hl(0, W - 1, y, st[6])
        c.hl(0, W - 1, y + 1, st[5])
        c.hl(0, W - 1, y + 3, st[2])
        for x in range(2, W - 2, 7):
            c.rect(x, y + 4, x + 2, y + 7, st[5])
            c.px(x + 2, y + 5, st[2])
            c.px(x + 2, y + 6, st[2])
        c.hl(0, W - 1, y + 5, st[1])
        if deep:
            for x in range(W):
                p = c.get(x, y + 8)
                if p[3] and p[:3] == rgba(st[3])[:3]:
                    c.px(x, y + 8, st[2])

    # ------------------------------------------------------------- types
    def type_shop(self, top, b):
        """A commercial block: shops under a cornice, sashes in moulded
        surrounds, a parapet with a raised name panel."""
        c, st, W = self.c, self.st, self.W
        axes, pitch = self.bays()
        self.band(self.floor_y(0) - 3)
        if self.facing == 'south':
            self.shopfront(3, W - 4, self.floor_y(0), b)
        else:
            for ax in axes:
                self.sash(ax - 5, self.floor_y(0) + 12, 10, 22, 0)
        for s in range(1, self.stories):
            fy = self.floor_y(s)
            if s > 1:
                self.band(fy + S - 3, lit=False)
            for ax in axes:
                w = 10 if pitch < 26 else 12
                self.sash(ax - w // 2, fy + 10, w, 22, s)
        self.cornice(top - TOP + 2)
        self.parapet(top - TOP, name=True)

    def type_apartment(self, top, b):
        """An interwar apartment house in render: continuous sill bands,
        cantilevered balconies on the middle bays, a glazed stair strip."""
        c, st, W = self.c, self.st, self.W
        axes, pitch = self.bays()
        stair = axes[len(axes) // 2] if len(axes) >= 3 else None
        if self.facing == 'south' and self.shop:
            self.shopfront(3, W - 4, self.floor_y(0), b)
        else:
            for ax in axes:
                if ax != stair:
                    self.sash(ax - 6, self.floor_y(0) + 14, 12, 20, 0)
            if self.facing == 'south':
                self.door(stair or W // 2, b)
        for s in range(1, self.stories):
            fy = self.floor_y(s)
            c.rect(0, fy + S - 4, W - 1, fy + S - 2, st[4])
            c.hl(0, W - 1, fy + S - 4, st[6])
            c.hl(0, W - 1, fy + S - 1, st[1])
            for k, ax in enumerate(axes):
                if ax == stair:
                    continue
                edge = k in (0, len(axes) - 1)
                self.sash(ax - 7, fy + 9, 14, 20, s, balcony=not edge and self.r.get('balconies'))
        if stair:
            y0, y1 = self.floor_y(self.stories - 1) + 6, self.floor_y(0) - 6
            if y1 > y0:
                c.rect(stair - 5, y0 - 1, stair + 4, y1 + 1, st[1])
                glass(c, stair - 4, y0, stair + 3, y1, self.seed + 77)
                for y in range(y0 + 6, y1, 7):
                    c.hl(stair - 4, stair + 3, y, st[4])
        # A plain coping, the house's name in relief on a panel.
        c.rect(0, top - TOP + 6, W - 1, top - 1, st[4])
        c.hl(0, W - 1, top - TOP + 6, st[6])
        c.hl(0, W - 1, top - 1, st[1])
        c.hl(0, W - 1, top, st[2])

    def type_office(self, top, b):
        """An office of the thirties to sixties: a stone base, piers running
        the full height, spandrel panels between the storeys, an attic band
        and a flagstaff."""
        c, st, W = self.c, self.st, self.W
        stone = CONCRETE
        axes, pitch = self.bays(max(3, self.W // 18))
        gy = self.floor_y(0)
        c.rect(0, gy, W - 1, b, stone[4])
        for y in range(gy + 6, b, 8):
            c.hl(0, W - 1, y, stone[3])
        for s in range(1, self.stories):
            fy = self.floor_y(s)
            for ax in axes:
                x0, x1 = int(ax - pitch / 2) + 3, int(ax + pitch / 2) - 3
                glass(c, x0, fy + 4, x1, fy + S - 12, self.seed + ax + s)
                c.vl((x0 + x1) // 2, fy + 4, fy + S - 12, st[1])
                c.rect(x0, fy + S - 11, x1, fy + S - 3, mix(st[2], stone[2], 0.4))
                c.hl(x0, x1, fy + S - 11, st[4])
        for ax in [a - pitch / 2 for a in axes] + [axes[-1] + pitch / 2]:
            x = int(ax) - 2
            c.rect(x, self.floor_y(self.stories - 1), x + 4, gy, stone[4])
            c.vl(x, self.floor_y(self.stories - 1), gy, stone[5])
            c.vl(x + 4, self.floor_y(self.stories - 1), gy, stone[2])
        c.rect(0, gy - 4, W - 1, gy, stone[5])
        c.hl(0, W - 1, gy, stone[1])
        if self.facing == 'south':
            cx = W // 2
            c.rect(cx - 12, gy + 6, cx + 11, b - 2, stone[1])
            glass(c, cx - 11, gy + 7, cx + 10, b - 3, self.seed + 3)
            for x in (cx - 4, cx + 3):
                c.vl(x, gy + 7, b - 3, stone[4])
            c.rect(cx - 16, gy + 2, cx + 15, gy + 5, GOLD[1])
            c.hl(cx - 16, cx + 15, gy + 2, GOLD[3])
            self.sign_band = [cx - 14, gy + 3, 30, 2]
            for ax in axes:
                if abs(ax - cx) > 16:
                    glass(c, int(ax) - 6, gy + 10, int(ax) + 5, b - 10, self.seed + ax)
        else:
            for ax in axes:
                if abs(ax - self.door_x) > 12:
                    glass(c, int(ax) - 5, gy + 12, int(ax) + 4, b - 14, self.seed + ax)
        c.rect(0, top - TOP + 4, W - 1, top, stone[4])
        c.hl(0, W - 1, top - TOP + 4, stone[5])
        c.hl(0, W - 1, top, stone[1])
        for x in range(4, W - 4, 6):
            c.vl(x, top - TOP + 7, top - 3, stone[3])
        if self.W >= 128:
            fx = W - 14
            c.vl(fx, top - TOP - 30, top - TOP + 4, IRON[2])
            for x in range(10):
                for y in range(6):
                    c.px(fx + 1 + x, top - TOP - 30 + y + round(math.sin(x * 0.7)),
                         [self.sign_paint, '#e8e2d0'][((x // 5) + y // 3) % 2])

    def type_walkup(self, top, b):
        """A walk-up of the Americas' and Mediterranean's boom decades: tall
        windows each with its iron balcony and shutters, a heavy cornice, a
        balustraded parapet."""
        c, st, W = self.c, self.st, self.W
        axes, pitch = self.bays()
        self.band(self.floor_y(0) - 3)
        if self.facing == 'south' and self.shop:
            self.shopfront(3, W - 4, self.floor_y(0), b)
        else:
            for ax in axes:
                if abs(ax - self.door_x) > 12 or self.facing != 'south':
                    self.sash(ax - 5, self.floor_y(0) + 10, 10, 26, 0, shutters=True)
            if self.facing == 'south':
                self.door(self.door_x, b, canopy=False)
        for s in range(1, self.stories):
            fy = self.floor_y(s)
            for ax in axes:
                self.sash(ax - 5, fy + 6, 10, 26, s, shutters=pitch >= 22, balcony=True)
        self.cornice(top - TOP + 4)
        self.parapet(top - TOP - 4, name=False, balusters=True)

    def type_shophouse(self, top, b):
        """The arcaded shophouse of the treaty ports and Straits towns: a
        five-foot way behind piers, louvred shutters above, a shaped gable
        with the firm's name, a tile roof behind."""
        c, st, W = self.c, self.st, self.W
        axes, pitch = self.bays()
        gy = self.floor_y(0)
        # The covered way: piers, the deep shade behind, the shop in it.
        c.rect(0, gy, W - 1, b - 2, mix(st[1], INK, 0.3))
        for y in range(gy, b - 2):
            t = (y - gy) / (b - gy)
            c.hl(2, W - 3, y, mix(mix(st[1], INK, 0.4), st[2], t * 0.6))
        if self.facing == 'south':
            self.sign_band = [8, gy + 4, W - 16, 7]
            c.rect(6, gy + 3, W - 7, gy + 11, self.sign_paint)
            c.hl(6, W - 7, gy + 3, mix(self.sign_paint, '#ffffff', 0.35))
            for x in range(8, W - 8, 3):
                c.vl(x, gy + 16, b - 4, OAK[2] if x % 6 else OAK[1])
            c.hl(8, W - 9, gy + 15, OAK[3])
            for x in range(10, W - 10, 9):
                c.rect(x, b - 8, x + 4, b - 3, [GOLD[2], '#c8363c', GREEN[4]][x % 3])
        for k in range(len(axes) + 1):
            x = int(6 + pitch * k) - 3
            c.rect(x, gy, x + 5, b - 2, st[4])
            c.vl(x, gy, b - 2, st[6])
            c.vl(x + 5, gy, b - 2, st[2])
            c.rect(x - 1, gy, x + 6, gy + 2, st[5])
            c.rect(x - 1, b - 4, x + 6, b - 2, st[5])
        c.rect(0, gy - 5, W - 1, gy - 1, st[5])
        c.hl(0, W - 1, gy - 5, st[6])
        c.hl(0, W - 1, gy - 1, st[1])
        for s in range(1, self.stories):
            fy = self.floor_y(s)
            for ax in axes:
                self.sash(ax - 6, fy + 7, 12, 24, s, frame='#e0d8c4', shutters=True)
            if s > 1:
                self.band(fy + S - 3, lit=False)
        # A shaped parapet gable, stepped and scrolled, with its panel.
        py = top - TOP + 2
        c.rect(0, py, W - 1, top, st[4])
        c.hl(0, W - 1, py, st[6])
        c.hl(0, W - 1, top, st[1])
        cx = W // 2
        gw = min(W // 2 - 4, 30)
        for i in range(-gw, gw + 1):
            h = round(10 * math.cos(i / gw * math.pi / 2))
            for yy in range(py - h, py):
                c.px(cx + i, yy, st[5] if i < 0 else st[4])
            c.px(cx + i, py - h - 1, st[6] if i <= 0 else st[5])
        c.rect(cx - 9, py - 7, cx + 8, py - 1, mix(self.sign_paint, INK, 0.2))
        c.hl(cx - 9, cx + 8, py - 7, GOLD[2])
        c.hl(cx - 9, cx + 8, py - 1, GOLD[1])
        c.px(cx, py - 4, GOLD[3])

    def type_kampung(self, top, b):
        """A timber house or shop raised a step, boarded, shuttered, under a
        verandah roof of corrugated iron on turned posts."""
        c, st, W = self.c, self.st, self.W
        for y in range(self.cornice_y, b - 2):
            for x in range(W):
                k = (y - top) % 5
                c.px(x, y, st[4] if k == 0 else st[1] if k == 4 else st[3])
        axes, pitch = self.bays()
        for ax in axes:
            if abs(ax - self.door_x) > 10 or self.facing != 'south':
                self.sash(ax - 6, b - 36, 12, 18, 0, shutters=True)
            for s_ in range(1, self.stories):
                self.sash(ax - 6, self.floor_y(s_) + 10, 12, 18, s_, shutters=True)
        if self.facing == 'south':
            self.door(self.door_x, b, h=30, w=12, canopy=False)
            if self.shop:
                self.sign_band = [6, top + 3, W - 12, 7]
                c.rect(5, top + 2, W - 6, top + 10, self.sign_paint)
                c.hl(5, W - 6, top + 2, mix(self.sign_paint, '#ffffff', 0.35))
            # The verandah: posts and a lean-to of corrugated iron.
            vy = b - 44
            for x in range(W):
                for y in range(vy - 6, vy + 2):
                    k = x % 4
                    col = TIN[4] if k == 0 else TIN[3] if k < 3 else TIN[2]
                    if k and h2(x // 4, 2, self.seed) > 0.6 and y > vy - 3:
                        col = mix(col, TIN[1], 0.4)
                    c.px(x, y, col)
            c.hl(0, W - 1, vy + 2, TIN[0])
            for y in range(vy + 3, vy + 6):
                for x in range(W):
                    p = c.get(x, y)
                    if p[3]:
                        c.px(x, y, mix(p, INK, 0.3 - (y - vy - 3) * 0.08))
            for y in range(vy + 6, b - 3):
                for x in range(W):
                    p = c.get(x, y)
                    if p[3]:
                        c.px(x, y, mix(p, INK, 0.18))
            for x in range(4, W - 2, max(16, (W - 8) // 3)):
                c.rect(x, vy + 2, x + 2, b - 2, OAK[3])
                c.vl(x + 2, vy + 2, b - 2, OAK[1])
            c.rect(0, b - 3, W - 1, b - 1, OAK[2])
            c.hl(0, W - 1, b - 3, OAK[4])

    # ------------------------------------------------------------- tops
    def parapet(self, y, name=False, balusters=False):
        c, st, W = self.c, self.st, self.W
        c.rect(0, y, W - 1, y + 6, st[4])
        c.hl(0, W - 1, y, st[6])
        c.hl(0, W - 1, y + 1, st[5])
        c.hl(0, W - 1, y + 6, st[2])
        if balusters:
            for x in range(3, W - 3):
                k = (x - 3) % 4
                c.px(x, y + 3, st[5] if k == 1 else st[2] if k == 2 else st[1])
                c.px(x, y + 4, st[5] if k in (1, 2) else st[1])
        if name and W >= 90:
            cx = W // 2
            for i in range(-14, 15):
                h = 5 - abs(i) // 3 if abs(i) < 13 else 0
                for yy in range(y - h, y):
                    c.px(cx + i, yy, st[5] if i < 0 else st[4])
                c.px(cx + i, y - h - 1, st[6])
            c.rect(cx - 8, y + 2, cx + 7, y + 5, st[2])
            c.px(cx, y - 2, GOLD[2])

    def roof(self):
        """A flat roof seen from above over the parapet, with a stair
        bulkhead and a tank; a pitched one of tile or tin behind a gable."""
        c, st, W = self.c, self.st, self.W
        y0 = self.cornice_y - (30 if self.pitched else 22)
        y1 = self.cornice_y - 1
        if self.pitched:
            mat = TIN if self.kind == 'kampung' else TILE
            for y in range(y0 + 8, y1 + 1):
                t = (y - y0 - 8) / max(1, y1 - y0 - 8)
                inset = round((1 - t) * 6)
                for x in range(inset, W - inset + DRIFT):
                    k = x % 4
                    col = mat[4] if k == 0 else mat[3] if k < 3 else mat[2]
                    if mat is TILE and (y - y0) % 5 == 0:
                        col = mat[1]
                    # Rust runs down from the fixings in streaks.
                    if mat is TIN and (x % 4) and (y - y0 - 8) > 3 + h2(x // 4, 1, self.seed) * 30 \
                            and h2(x // 4, 0, self.seed + 1) > 0.55:
                        col = mix(col, mat[1], 0.4)
                    if c.get(x, y)[3] == 0:
                        c.px(x, y, col)
            c.hl(6, W - 7 + DRIFT, y0 + 8, mat[5])
            return
        # The roof deck from above: asphalt felt inside the parapet, its far
        # coping lit, the parapet's shadow along the near edge.
        deck = CONCRETE
        d0 = self.cornice_y - 12
        for y in range(d0, self.cornice_y):
            off = round((self.cornice_y - y) * DRIFT / 12)
            for x in range(off, W + off):
                if c.get(x, y)[3]:
                    continue
                if y == d0:
                    col = st[5]
                elif y == d0 + 1 or x - off < 2 or x - off > W - 3:
                    col = st[3]
                else:
                    col = mix(deck[1], deck[2], 0.5) if y > self.cornice_y - 4 else deck[2]
                c.px(x, y, col)
        # A stair bulkhead standing on the deck, and on a tall block a tank.
        if self.stories >= 2 and W >= 80:
            bx, by = W - 30, self.cornice_y - 4
            c.rect(bx, by - 12, bx + 15, by, st[4])
            c.vl(bx, by - 12, by, st[5])
            c.vl(bx + 15, by - 12, by, st[2])
            c.rect(bx + 5, by - 8, bx + 10, by, OAK[1])
            c.rect(bx - 1, by - 15, bx + 17, by - 13, st[5])
            c.hl(bx - 1, bx + 17, by - 15, st[6])
        if self.stories >= 3 and W >= 110:
            tx = 14
            ty = self.cornice_y - 6
            for x in (tx, tx + 12):
                c.vl(x, ty - 10, ty, IRON[1])
            c.hl(tx - 1, tx + 13, ty - 5, IRON[1])
            c.rect(tx - 2, ty - 24, tx + 14, ty - 10, OAK[2])
            for x in range(tx - 2, tx + 15, 3):
                c.vl(x, ty - 24, ty - 10, OAK[1])
            c.vl(tx - 2, ty - 24, ty - 10, OAK[4])
            for yy in (ty - 21, ty - 14):
                c.hl(tx - 2, tx + 14, yy, IRON[1])
            for i in range(5):
                c.hl(tx - 2 + i, tx + 14 - i, ty - 25 - i, OAK[3] if i % 2 else OAK[2])


def make(out, zoom=2):
    from art.review_sheet import recipes
    from art.reference import current_adult_d
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    all_r, painter, source = recipes()
    names = [n for n in all_r if all_r[n].get('modern') and not n.endswith(('-north', '-east', '-west'))
             and '-urban-' in n]
    cells = []
    for n in names:
        r = all_r[n]
        cells.append(painter(r)(r, source['materials'][r['wall']]).render())
    pad = 10
    rows, row, width = [], [], 0
    for im in cells:
        if width + im.width > 1400 and row:
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
        x = pad
        for im in r:
            sheet.alpha_composite(im, (x, y + rh - im.height))
            x += im.width + pad
        sheet.alpha_composite(adult, (x, y + rh - adult.height - 3))
        y += rh + pad
    sheet.resize((W * zoom, H * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/city-kit/world.png')
