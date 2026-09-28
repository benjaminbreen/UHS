"""Meiji and Taisho Tokyo, drawn to the city kit's standard.

    .venv/bin/python scripts/art/city_japan.py artifacts/city-kit/japan.png

The merchant house (machiya) with its pent roof, lattice and noren; the
fireproof storehouse-shop (dozo-zukuri) in black plaster; the lane tenement
(nagaya); and the Ginza's brick rows with their colonnades. All face the
street with their eaves, in the oblique view the rest of the kit uses.
"""
from pathlib import Path
import math
import sys

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from art.city_kit import (  # noqa: E402
    C, Oblique, BRICK, GLASS, GOLD, IRON, INK, GREEN, LEAF, BARK, glass, h2, mix, outline, sphere,
)
from art.oblique_style import DRIFT  # noqa: E402

KAWARA = ['#16181f', '#22262f', '#323843', '#454d5a', '#5d6674', '#7a8492', '#9ea8b4']
CEDAR = ['#1a1012', '#2c1a16', '#43261c', '#5c3624', '#784a30', '#96643f']
BENGARA = ['#2a0e10', '#4a1a18', '#6e2a20', '#8c3a28', '#a85036', '#c4704c']
PLASTER = ['#6a6258', '#9c9484', '#c4bca8', '#ddd6c2', '#eee8d6', '#faf5e6']
KURO = ['#0e0e14', '#18181f', '#24242c', '#34343e', '#4a4a56']
INDIGO = ['#0e1630', '#1a2850', '#263c74', '#3a5494', '#e8e4d8']
NOREN = [INDIGO, ['#2a1414', '#4a1e1e', '#6e2828', '#8e3a34', '#efe6d2'],
         ['#14261e', '#1e3c2e', '#2a5642', '#3a7058', '#efe6d2'], ['#2a2410', '#4a3e1a', '#6e5a26', '#8e7634', '#efe6d2']]
STONE = ['#3a3a40', '#5a5a5e', '#7e7c78', '#a09c94', '#c2bdb2', '#dcd6c8']
RED_LANTERN = ['#5a1014', '#9a1e22', '#d0342e', '#f07050', '#fcd8a0']


def kawara_slope(c, x0, x1, y_eave, y_ridge, drift=DRIFT, hip=0):
    """A tiled slope seen from the street and above: the rolled cover tiles
    run down the slope as lit ridges between channels, a course line every
    few rows, the eave row finished with round end tiles."""
    rows = y_eave - y_ridge
    for y in range(y_ridge, y_eave + 1):
        t = (y_eave - y) / max(1, rows)
        off = round(t * drift)
        inset = round(t * hip)
        for x in range(x0 + inset + off, x1 - inset + off + 1):
            k = (x - off) % 5
            col = KAWARA[4] if k == 0 else KAWARA[3] if k in (1, 4) else KAWARA[2]
            if (y_eave - y) % 6 == 5:
                col = KAWARA[1] if k else KAWARA[3]
            if t > 0.75:
                col = mix(col, KAWARA[5], 0.25)
            c.px(x, y, col)
    for x in range(x0, x1 + 1):
        k = x % 5
        c.px(x, y_eave, KAWARA[5] if k == 0 else KAWARA[3])
        c.px(x, y_eave + 1, KAWARA[1] if k != 0 else KAWARA[2])
        c.px(x, y_eave + 2, INK if k in (2, 3) else KAWARA[0])
    return round(drift)


def ridge(c, x0, x1, y, heavy=False, white=False):
    """The ridge: stacked flat tiles, a round cap, and onigawara standing
    at each end, lit on the west."""
    h = 5 if heavy else 3
    body = PLASTER[4] if white else KAWARA[3]
    for i in range(h):
        c.hl(x0 + 2, x1 - 2, y - i, KAWARA[4] if i == h - 1 else body if white and i < h - 1 else KAWARA[2 + (i % 2)])
    c.hl(x0 + 2, x1 - 2, y - h, KAWARA[5])
    for ex, lit in ((x0, True), (x1 - 4, False)):
        w = 6 if heavy else 5
        hh = 9 if heavy else 6
        for yy in range(y - hh, y + 1):
            for xx in range(ex, ex + w):
                f = (xx - ex) / w
                col = KAWARA[5] if f < 0.35 and lit else KAWARA[3] if f < 0.7 else KAWARA[1]
                if yy == y - hh:
                    col = KAWARA[6]
                c.px(xx, yy, col)
        # The horn at its top curls outward.
        c.px(ex - 1 if lit else ex + w, y - hh - 1, KAWARA[5] if lit else KAWARA[3])
        c.px(ex - 2 if lit else ex + w + 1, y - hh - 2, KAWARA[5] if lit else KAWARA[3])


def pent(c, x0, x1, y, depth=6):
    """The pent roof (hisashi) between the storeys: a short tiled slope on
    brackets, its shadow on the shop front below."""
    for i in range(depth):
        yy = y - depth + i
        for x in range(x0 - 2 + (depth - i) // 3, x1 + 3):
            k = x % 5
            col = KAWARA[4] if k == 0 else KAWARA[3] if k in (1, 4) else KAWARA[2]
            if i == depth - 1:
                col = KAWARA[5] if k == 0 else KAWARA[4]
            c.px(x, yy, col)
    c.hl(x0 - 2, x1 + 2, y, KAWARA[1])
    c.hl(x0 - 2, x1 + 2, y + 1, INK)
    for x in range(x0, x1 + 1):
        for k in range(2, 5):
            p = c.get(x, y + k)
            if p[3]:
                c.px(x, y + k, mix(p, INK, 0.5 - k * 0.1))


def lattice(c, x0, x1, y0, y1, wood=CEDAR, fine=True):
    """Koshi: vertical slats close-set before paper screens, lit on the
    left of each slat, the paper glowing faintly between."""
    step = 2 if fine else 3
    for x in range(x0, x1 + 1):
        k = (x - x0) % step
        for y in range(y0, y1 + 1):
            if k == 0:
                col = wood[4]
            elif k == 1 and step == 3:
                col = wood[2]
            else:
                col = mix(PLASTER[3], wood[1], 0.55)
            c.px(x, y, col)
    for y in (y0, y1, y0 + (y1 - y0) // 2):
        c.hl(x0, x1, y, wood[2])
    c.hl(x0, x1, y0 - 1, wood[5])


def noren(c, x0, x1, y, h, ramp, seed):
    """A split curtain across the shop mouth: panels in the house colour,
    a white device on the middle panel, the hem lifting in the draught."""
    n = max(2, (x1 - x0 + 1) // 6)
    pw = (x1 - x0 + 1) / n
    for k in range(n):
        a, b = int(x0 + k * pw), int(x0 + (k + 1) * pw) - 1
        lift = int(h2(k, 3, seed) * 2)
        for x in range(a, b + 1):
            for yy in range(y, y + h - lift):
                f = (x - a) / max(1, b - a)
                col = ramp[3] if f < 0.3 else ramp[2] if f < 0.85 else ramp[1]
                if yy == y:
                    col = ramp[1]
                c.px(x, yy, col)
        c.px(b, y + h - lift - 1, ramp[0])
        if k == n // 2:
            cx, cy = (a + b) // 2, y + h // 2 - 1
            c.ellipse(cx + 0.5, cy, 2.2, 2.2, ramp[4])
            c.px(cx, cy, ramp[2])
    c.hl(x0 - 1, x1 + 1, y - 1, CEDAR[4])


def glyphs(c, x, y0, y1, ink, seed):
    """Brushed strokes read as characters without being any: a column of
    small blocks of two or three strokes each."""
    y = y0
    k = 0
    while y + 4 <= y1:
        r = h2(k, 1, seed)
        c.hl(x, x + 3, y, ink)
        if r > 0.3:
            c.vl(x + 1 + int(r * 2), y, y + 3, ink)
        if r < 0.6:
            c.hl(x, x + 3, y + 2, ink)
        c.px(x + (3 if r > 0.5 else 0), y + 3, ink)
        y += 6
        k += 1


def kanban(c, x, y, h, seed, board=None):
    """An upright signboard on its own feet, lacquered, lettered in gold or
    black, with a small tiled cap."""
    board = board or [CEDAR, KURO][seed % 2]
    c.rect(x, y, x + 6, y + h, board[2])
    c.vl(x, y, y + h, board[4])
    c.vl(x + 6, y, y + h, board[0])
    glyphs(c, x + 2, y + 3, y + h - 3, GOLD[2] if board is KURO else PLASTER[5], seed)
    for i in range(3):
        c.hl(x - 2 + i, x + 8 - i, y - 1 - i, KAWARA[3 + (i == 2)])
    c.vl(x + 1, y + h + 1, y + h + 5, CEDAR[1])
    c.vl(x + 5, y + h + 1, y + h + 5, CEDAR[1])


def chochin(c, x, y, ramp=RED_LANTERN):
    """A paper lantern hung under the eave: a ribbed barrel, black caps."""
    c.hl(x - 1, x + 3, y, INK)
    for i in range(7):
        w = 3 if i in (0, 6) else 4
        for xx in range(x - (w - 2), x + w):
            f = (xx - x + 2) / 5
            col = ramp[3] if f < 0.4 else ramp[2] if f < 0.8 else ramp[1]
            if i % 2 == 0:
                col = mix(col, ramp[0], 0.3)
            c.px(xx, y + 1 + i, col)
    c.px(x, y + 3, ramp[4])
    c.hl(x - 1, x + 3, y + 8, INK)
    c.vl(x + 1, y - 3, y - 1, INK)


class Machiya(Oblique):
    """A two-storey merchant house on the street: a low upper storey with
    slatted plaster windows (mushiko-mado), a tiled pent roof, the shop open
    below behind noren or closed with lattice, firewalls (udatsu) on the
    party walls, the main roof with its ridge and onigawara."""

    def __init__(self, W=96, sd=12, seed=0, shop=True, wood=CEDAR, upper='mushiko'):
        self.seed, self.shop, self.wood, self.upper = seed, shop, wood, upper
        wall = 52 + 30
        super().__init__(W, wall, 34, sd)

    def render(self):
        W, H, c, wd = self.W, self.H, self.c, self.wood
        b = H - 3
        g_top = b - 52
        u_top = g_top - 30
        eave = u_top - 2
        ridge_y = eave - 22
        # Right return in shade under the roof.
        for y in range(ridge_y + 6, b + 1):
            for i in range(DRIFT):
                c.px(W + i, y - i // 2, mix(wd[1], INK, 0.1 * i))
        # Main roof, eaves to the street.
        kawara_slope(c, -2, W + 1, eave, ridge_y)
        ridge(c, 0 + DRIFT, W + DRIFT - 1, ridge_y + 1, heavy=W >= 96)
        # Upper storey: plaster between posts, the slatted windows.
        c.rect(0, u_top, W - 1, g_top - 1, PLASTER[3])
        for y in range(u_top, u_top + 3):
            c.hl(0, W - 1, y, mix(PLASTER[3], INK, 0.35 - (y - u_top) * 0.1))
        posts = list(range(0, W, 24)) + [W - 3]
        for x in posts:
            c.rect(x, u_top, x + 2, g_top - 1, wd[3])
            c.vl(x, u_top, g_top - 1, wd[5])
            c.vl(x + 2, u_top, g_top - 1, wd[1])
        c.rect(0, g_top - 4, W - 1, g_top - 1, wd[3])
        c.hl(0, W - 1, g_top - 4, wd[5])
        for k in range(len(posts) - 1):
            a, bb = posts[k] + 5, posts[k + 1] - 3
            if bb - a < 8:
                continue
            if self.upper == 'mushiko':
                # Plaster-coated bars, thick and rounded, the dark between.
                for x in range(a, bb + 1):
                    kk = (x - a) % 4
                    for y in range(u_top + 8, g_top - 8):
                        c.px(x, y, PLASTER[4] if kk == 0 else PLASTER[2] if kk == 1 else mix(INK, wd[1], 0.4))
                c.hl(a - 1, bb + 1, u_top + 7, PLASTER[5])
                c.hl(a - 1, bb + 1, g_top - 8, PLASTER[1])
            else:
                lattice(c, a, bb, u_top + 7, g_top - 8, wd)
        # Firewalls on the party walls, plaster, capped with tile.
        for x in (0, W - 5):
            c.rect(x, eave - 14, x + 4, g_top - 1, PLASTER[4])
            c.vl(x, eave - 14, g_top - 1, PLASTER[5])
            c.vl(x + 4, eave - 14, g_top - 1, PLASTER[2])
            for i in range(3):
                c.hl(x - 1 - (i == 2), x + 5 + (i == 2), eave - 15 - i, KAWARA[3 + (i == 1)])
            c.px(x + 2, eave - 18, KAWARA[5])
        if self.shop:
            # A signboard hung flat on the upper storey, lettered in the
            # house's colour.
            kx = W - 18 if W >= 90 else W - 14
            c.rect(kx, u_top + 5, kx + 6, g_top - 6, CEDAR[4] if self.seed % 2 else KURO[2])
            c.vl(kx, u_top + 5, g_top - 6, CEDAR[5] if self.seed % 2 else KURO[4])
            glyphs(c, kx + 2, u_top + 8, g_top - 9, KURO[0] if self.seed % 2 else GOLD[2], self.seed)
        pent(c, 0, W - 1, g_top + 1)
        # Ground floor.
        c.rect(0, g_top + 2, W - 1, b, wd[2])
        c.rect(0, b - 3, W - 1, b, STONE[3])
        c.hl(0, W - 1, b - 3, STONE[5])
        c.hl(0, W - 1, b, STONE[1])
        for x in posts:
            c.rect(x, g_top + 2, x + 2, b - 4, wd[3])
            c.vl(x, g_top + 2, b - 4, wd[5])
        mouth = (posts[0] + 3, posts[-1] - 1) if len(posts) <= 3 else (posts[1] + 3, posts[-2] - 1)
        # The shop's mouth: the dark of the store, goods at its edge, noren.
        if self.shop:
            x0, x1 = mouth
            for y in range(g_top + 3, b - 4):
                t = (y - g_top) / (b - g_top)
                c.hl(x0, x1, y, mix(INK, wd[1], 0.3 + 0.4 * t))
            c.rect(x0, b - 12, x1, b - 5, wd[4])
            c.hl(x0, x1, b - 12, wd[5])
            for x in range(x0 + 2, x1 - 2, 4):
                col = [GOLD[2], '#c8363c', GREEN[4], PLASTER[4], '#5670a4'][int(h2(x, 5, self.seed) * 5)]
                c.rect(x, b - 16, x + 2, b - 13, col)
                c.hl(x, x + 2, b - 16, mix(col, '#ffffff', 0.3))
            noren(c, x0, x1, g_top + 4, 16, NOREN[self.seed % len(NOREN)], self.seed)
            self.door_x = (x0 + x1) // 2
        else:
            self.door_x = W // 2
        for k in range(len(posts) - 1):
            a, bb = posts[k] + 3, posts[k + 1] - 1
            if self.shop and a >= mouth[0] - 1 and bb <= mouth[1] + 1:
                continue
            lattice(c, a, bb, g_top + 6, b - 5, wd)
        if not self.shop:
            x = self.door_x - 7
            c.rect(x, g_top + 8, x + 13, b - 4, wd[1])
            lattice(c, x + 1, x + 12, g_top + 9, b - 5, wd, fine=False)
        chochin(c, posts[0] + 6 if len(posts) > 2 else 6, g_top + 4)
        return outline(c.im, soft=0.35, hard=0.65)


class Dozo(Oblique):
    """The storehouse-shop of the Nihonbashi merchants: walls of black
    lacquered plaster a foot thick against fire, heavy stepped shutters, a
    massive ridge with towering onigawara and a roof signboard."""

    def __init__(self, W=112, sd=12, seed=0):
        self.seed = seed
        super().__init__(W, 88, 50, sd)

    def render(self):
        W, H, c = self.W, self.H, self.c
        b = H - 3
        top = b - 88
        g_top = b - 50
        eave = top - 2
        ridge_y = eave - 24
        for y in range(ridge_y + 6, b + 1):
            for i in range(DRIFT):
                c.px(W + i, y - i // 2, mix(KURO[1], INK, 0.1 * i))
        kawara_slope(c, -3, W + 2, eave, ridge_y)
        ridge(c, 0 + DRIFT, W + DRIFT - 1, ridge_y + 1, heavy=True, white=True)
        # A great signboard on the roof, framed and lettered in gold.
        sx0, sx1 = W // 2 - 20, W // 2 + 20
        c.rect(sx0, ridge_y - 22, sx1, ridge_y - 8, KURO[2])
        c.rect(sx0 + 2, ridge_y - 20, sx1 - 2, ridge_y - 10, KURO[1])
        c.hl(sx0, sx1, ridge_y - 22, KURO[4])
        for k in range(4):
            gx = sx0 + 5 + k * 9
            r_ = [h2(k, i, self.seed) for i in range(5)]
            c.hl(gx, gx + 4, ridge_y - 18, GOLD[3])
            if r_[0] > 0.3:
                c.vl(gx + 1 + int(r_[1] * 3), ridge_y - 18, ridge_y - 12, GOLD[2])
            if r_[2] > 0.4:
                c.hl(gx + int(r_[3] * 2), gx + 4, ridge_y - 15, GOLD[3])
            if r_[4] > 0.5:
                c.px(gx, ridge_y - 13, GOLD[2])
                c.px(gx + 4, ridge_y - 12, GOLD[2])
            c.hl(gx, gx + 4, ridge_y - 12, GOLD[2] if r_[1] > 0.5 else GOLD[1])
        for x in (sx0 + 4, sx1 - 4):
            c.vl(x, ridge_y - 8, ridge_y, KURO[1])
        # Black plaster walls, burnished: a sheen down the left of each panel.
        c.rect(0, top, W - 1, b, KURO[2])
        for x in range(W):
            f = (x % 32) / 32
            for y in range(top, g_top):
                c.px(x, y, KURO[3] if f < 0.12 else KURO[2] if f < 0.85 else KURO[1])
        # White plaster mouldings under the eave, stepped in three.
        for i, col in enumerate((PLASTER[5], PLASTER[3], PLASTER[4], PLASTER[2])):
            c.hl(0, W - 1, top + i * 2, col)
            c.hl(0, W - 1, top + i * 2 + 1, col)
        # Upper windows: small, deep, behind thick stepped shutters.
        n = max(2, W // 32)
        for k in range(n):
            cx = int((k + 0.5) * W / n)
            y = top + 16
            c.rect(cx - 8, y - 2, cx + 7, y + 17, PLASTER[3])
            c.rect(cx - 6, y, cx + 5, y + 15, INK)
            for x in range(cx - 5, cx + 5, 2):
                c.vl(x, y + 1, y + 14, IRON[2])
            for s in (-1, 1):
                sx = cx - 15 if s < 0 else cx + 8
                c.rect(sx, y - 3, sx + 6, y + 18, KURO[3])
                for step in range(3):
                    c.vl(sx + (6 - step if s < 0 else step), y - 3 + step, y + 18 - step, KURO[4] if s < 0 else KURO[1])
        pent(c, 0, W - 1, g_top + 1, depth=7)
        # The shop front: the heavy doors drawn back, the store open.
        c.rect(0, g_top + 2, W - 1, b, KURO[1])
        c.rect(0, b - 3, W - 1, b, STONE[3])
        c.hl(0, W - 1, b - 3, STONE[5])
        x0, x1 = 10, W - 11
        for y in range(g_top + 4, b - 4):
            t = (y - g_top) / 50
            c.hl(x0, x1, y, mix(INK, CEDAR[1], 0.3 + 0.4 * t))
        c.rect(x0, b - 13, x1, b - 5, CEDAR[4])
        c.hl(x0, x1, b - 13, CEDAR[5])
        for x in range(x0 + 3, x1 - 4, 6):
            c.rect(x, b - 18, x + 3, b - 14, [GOLD[2], PLASTER[4], '#8e3a34', GREEN[4]][int(h2(x, 1, self.seed) * 4)])
        noren(c, x0, x1, g_top + 5, 15, NOREN[(self.seed + 1) % len(NOREN)], self.seed)
        for sx in (0, W - 9):
            c.rect(sx, g_top + 3, sx + 8, b - 4, KURO[3])
            c.vl(sx + (8 if sx == 0 else 0), g_top + 3, b - 4, KURO[4])
        kanban(c, W - 16, b - 34, 26, self.seed, KURO)
        self.door_x = W // 2
        return outline(c.im, soft=0.3, hard=0.55)


class Nagaya(Oblique):
    """A single-storey lane tenement: a row of units each with its lattice
    sliding door and a small barred window, board walls, a tiled roof, a
    rain barrel and pot plants on the step."""

    def __init__(self, W=160, sd=12, seed=0):
        self.seed = seed
        super().__init__(W, 44, 26, sd)

    def render(self):
        W, H, c = self.W, self.H, self.c
        b = H - 3
        top = b - 44
        eave = top
        ridge_y = eave - 18
        for y in range(ridge_y + 4, b + 1):
            for i in range(DRIFT):
                c.px(W + i, y - i // 2, mix(CEDAR[1], INK, 0.1 * i))
        kawara_slope(c, -2, W + 1, eave, ridge_y)
        ridge(c, DRIFT, W + DRIFT - 1, ridge_y + 1)
        # Weathered board walls: long boards, each its own shade of grey.
        for y in range(top + 3, b - 2):
            row = (y - top - 3) // 4
            for x in range(W):
                v = h2(x // 30 + row, row, self.seed)
                col = CEDAR[2] if v < 0.5 else mix(CEDAR[2], '#6a6460', 0.35)
                if (y - top - 3) % 4 == 3:
                    col = CEDAR[1]
                c.px(x, y, col)
        c.rect(0, b - 3, W - 1, b, STONE[2])
        c.hl(0, W - 1, b - 3, STONE[4])
        units = max(2, W // 32)
        uw = W / units
        for k in range(units):
            ux = int(k * uw)
            c.rect(ux, top + 3, ux + 2, b - 3, CEDAR[4])
            c.vl(ux, top + 3, b - 3, CEDAR[5])
            dx = ux + 5
            c.rect(dx, top + 9, dx + 11, b - 4, CEDAR[1])
            lattice(c, dx + 1, dx + 10, top + 10, b - 5, CEDAR, fine=False)
            wx = ux + int(uw) - 14
            c.rect(wx, top + 12, wx + 9, top + 22, PLASTER[3])
            for x in range(wx + 1, wx + 9, 2):
                c.vl(x, top + 13, top + 21, CEDAR[2])
            # Pots on the step: the lane's gardens.
            if h2(k, 2, self.seed) < 0.7:
                px_ = ux + 18
                c.rect(px_, b - 8, px_ + 4, b - 4, '#9a4c34')
                c.hl(px_, px_ + 4, b - 8, '#c8704c')
                sphere(c, px_ + 2.5, b - 11, 3, LEAF, lo=1, hi=5)
            if h2(k, 3, self.seed) < 0.35:
                bx = ux + int(uw) - 4
                c.rect(bx - 3, b - 12, bx + 2, b - 4, CEDAR[3])
                for yy in (b - 11, b - 6):
                    c.hl(bx - 3, bx + 2, yy, IRON[2])
                c.hl(bx - 3, bx + 2, b - 12, '#3a5a6e')
        c.hl(0, W - 1, top + 3, INK)
        c.hl(0, W - 1, top + 4, mix(CEDAR[1], INK, 0.4))
        self.door_x = int(uw / 2)
        return outline(c.im, soft=0.35, hard=0.6)


class GinzaBrick(Oblique):
    """A Ginza bricktown row of the 1870s: two storeys of red brick, a
    colonnade of slim columns along the footway carrying a balcony, tall
    sashes with green shutters, a Japanese tile roof with brick stacks."""

    def __init__(self, W=160, sd=12, seed=0):
        self.seed = seed
        super().__init__(W, 50 + 40, 34, sd)

    def render(self):
        from art.city_kit import TownHouse, LIME
        W, H, c = self.W, self.H, self.c
        b = H - 3
        top = b - 90
        g_top = b - 50
        eave = top - 1
        ridge_y = eave - 20
        for y in range(ridge_y + 6, b + 1):
            for i in range(DRIFT):
                c.px(W + i, y - i // 2, mix(BRICK[1], INK, 0.1 * i))
        kawara_slope(c, -2, W + 1, eave, ridge_y, hip=10)
        ridge(c, 12 + DRIFT, W - 12 + DRIFT, ridge_y + 1)
        for sx in (18, W - 30):
            c.rect(sx, ridge_y - 10, sx + 9, eave - 4, BRICK[3])
            c.vl(sx, ridge_y - 10, eave - 4, BRICK[5])
            c.vl(sx + 9, ridge_y - 10, eave - 4, BRICK[1])
            c.rect(sx - 1, ridge_y - 12, sx + 10, ridge_y - 10, LIME[4])
        TownHouse.brickwork(None, c, 0, top, W - 1, b - 3, BRICK, self.seed)
        c.rect(0, top, W - 1, top + 3, LIME[5])
        c.hl(0, W - 1, top + 3, LIME[2])
        bays = max(3, W // 26)
        pitch = W / bays
        for k in range(bays):
            cx = int((k + 0.5) * pitch)
            y = top + 10
            c.rect(cx - 6, y - 1, cx + 5, y + 22, '#ede7da')
            glass(c, cx - 5, y, cx + 4, y + 21, self.seed + k)
            c.hl(cx - 5, cx + 4, y + 10, '#ede7da')
            for sx in (cx - 10, cx + 6):
                c.rect(sx, y - 1, sx + 3, y + 22, GREEN[2])
                for yy in range(y, y + 22, 2):
                    c.hl(sx, sx + 3, yy, GREEN[3])
            c.rect(cx - 7, y - 4, cx + 6, y - 2, LIME[4])
            c.hl(cx - 7, cx + 6, y - 4, LIME[5])
        # Balcony over the colonnade.
        by = g_top - 2
        c.rect(0, by, W - 1, by + 3, LIME[4])
        c.hl(0, W - 1, by, LIME[5])
        c.hl(0, W - 1, by + 3, LIME[1])
        for x in range(0, W, 3):
            c.vl(x, by - 7, by - 1, IRON[1])
        c.hl(0, W - 1, by - 8, IRON[2])
        # The colonnade: slim columns, the shade of the footway behind.
        for y in range(by + 4, b - 3):
            t = (y - by) / (b - by)
            c.hl(0, W - 1, y, mix(mix(BRICK[1], INK, 0.45), BRICK[2], t * 0.5))
        for k in range(bays):
            cx = int((k + 0.5) * pitch)
            glass(c, cx - 8, by + 12, cx + 7, b - 8, self.seed + 30 + k)
            c.rect(cx - 9, by + 11, cx + 8, by + 11, CEDAR[3])
            c.rect(cx - 9, b - 7, cx + 8, b - 4, CEDAR[3])
        for k in range(bays + 1):
            x = int(k * pitch) - 2 if 0 < k < bays else (0 if k == 0 else W - 4)
            for i, col in enumerate((LIME[5], LIME[4], LIME[3], LIME[2])):
                c.vl(x + i, by + 6, b - 4, col)
            c.rect(x - 1, by + 4, x + 4, by + 5, LIME[5])
            c.rect(x - 1, b - 5, x + 4, b - 3, LIME[4])
        c.rect(0, b - 2, W - 1, b, STONE[3])
        c.hl(0, W - 1, b - 2, STONE[5])
        chochin(c, int(pitch) + 6, by + 5, RED_LANTERN)
        self.door_x = int(pitch * (bays // 2) + pitch / 2)
        return outline(c.im, soft=0.35, hard=0.6)


def willow(seed=0):
    """A weeping willow, as the Ginza planted them: a leaning trunk, a crown
    of long hanging lobes shaded as one mass lit from the west, a fringe of
    strands at the hem, and the iron guard at its foot."""
    W, Hh = 58, 90
    c = C(W, Hh)
    base = Hh - 1
    cx = W // 2
    for y in range(base - 46, base - 1):
        lean = (base - y) // 14
        for x in range(cx - 2 + lean, cx + 2 + lean):
            c.px(x, y, BARK[3] if x == cx - 2 + lean else BARK[2] if x < cx + 1 + lean else BARK[1])
    for i in range(5):
        c.px(cx - 3 - i, base - 44 + i, BARK[2])
        c.px(cx + 4 + i, base - 46 + i, BARK[1])
    c.ellipse(cx + 1, base - 1, 8, 2.2, IRON[1])
    for x in range(cx - 7, cx + 9, 2):
        c.vl(x, base - 4, base - 1, IRON[2])
    c.hl(cx - 7, cx + 8, base - 4, IRON[3])
    top = base - 80
    lobes = []
    for k in range(9):
        lx = cx + 2 + (k - 4) * 5.2 + (h2(k, 1, seed) - 0.5) * 3
        ly = top + 6 + ((k - 4) / 4) ** 2 * 16 + h2(k, 2, seed) * 2
        length = 34 + h2(k, 3, seed) * 14 - abs(k - 4) * 2
        lobes.append((lx, ly, length, 3.6 + h2(k, 4, seed) * 1.4))
    # Back lobes first, darker; front lobes carry the light.
    for back in (True, False):
        for k, (lx, ly, length, r) in enumerate(lobes):
            if (k % 2 == 0) != back:
                continue
            for i in range(int(length)):
                t = i / length
                # Rounded at the head, full at the shoulder, thinning below.
                w = r * (math.sqrt(t / 0.12) if t < 0.12 else 1 - 0.5 * (t - 0.12)) * 1.3
                y = int(ly + i)
                sway = math.sin(t * 2.2 + k) * 1.2
                for x in range(int(lx + sway - w), int(lx + sway + w) + 1):
                    f = (x - (lx + sway - w)) / max(1, 2 * w)
                    light = (1 - f) * 0.7 + (1 - t) * 0.5 + (0 if back else 0.3) - (x - cx) / W * 0.6
                    shade = 5 if light > 1.2 else 4 if light > 0.85 else 3 if light > 0.5 else 2 if light > 0.25 else 1
                    if (x + y * 3) % 7 == 0 and shade > 2:
                        shade -= 1
                    c.px(x, y, LEAF[shade])
            # A fringe of loose strands below each lobe.
            for j in range(3):
                sx = int(lx + (j - 1) * r * 0.5)
                for i in range(int(length), int(length + 4 + h2(k, j, seed) * 6)):
                    c.px(sx + (1 if i % 5 == 0 else 0), int(ly + i), LEAF[3 if back else 4])
    return outline(c.im, soft=0.3, hard=0.5)


def pole(seed=0):
    """A timber telegraph and power pole of the Meiji street: two cross-arms
    of white insulators, a transformer can, the wires cut short either side."""
    c = C(34, 96)
    b = 95
    x = 16
    for y in range(b - 88, b + 1):
        c.px(x, y, BARK[3])
        c.px(x + 1, y, BARK[2])
        c.px(x + 2, y, BARK[1])
    for ay in (b - 84, b - 74):
        c.hl(x - 12, x + 14, ay, CEDAR[3])
        c.hl(x - 12, x + 14, ay + 1, CEDAR[1])
        for ix in range(x - 11, x + 14, 5):
            c.px(ix, ay - 1, PLASTER[5])
            c.px(ix, ay - 2, PLASTER[4])
    c.rect(x + 3, b - 64, x + 8, b - 56, IRON[2])
    c.vl(x + 3, b - 64, b - 56, IRON[3])
    c.hl(x + 3, x + 8, b - 65, IRON[1])
    for ay in (b - 86, b - 76):
        for side in (0, 33):
            c.px(side, ay + 2, IRON[0])
    c.vl(x - 1, b - 20, b - 12, PLASTER[4])
    return outline(c.im, soft=0.3, hard=0.55)


def rickshaw(seed=0):
    """A jinrikisha at rest, shafts down: a black hood folded back over a red
    seat, a tall spoked wheel."""
    c = C(46, 34)
    b = 33
    c.rect(10, b - 22, 26, b - 12, KURO[2])
    c.rect(12, b - 20, 24, b - 14, '#8e2a2e')
    c.hl(12, 24, b - 20, '#b8404a')
    for i in range(10):
        c.hl(8 + i // 3, 26, b - 23 - i, KURO[3] if i % 2 else KURO[2])
    c.hl(8, 26, b - 33, KURO[4])
    for i in range(20):
        c.px(26 + i, b - 12 + i // 3, CEDAR[4])
        c.px(26 + i, b - 11 + i // 3, CEDAR[2])
    cx, cy, r = 18, b - 9, 9
    for a in range(0, 360, 6):
        t = math.radians(a)
        c.px(round(cx + math.cos(t) * r), round(cy + math.sin(t) * r), KURO[1])
    for a in range(0, 180, 30):
        t = math.radians(a)
        for d in range(-r + 1, r):
            c.px(round(cx + math.cos(t) * d), round(cy + math.sin(t) * d), CEDAR[3])
    sphere(c, cx + 0.5, cy, 1.6, IRON)
    return outline(c.im, soft=0.3, hard=0.55)


def make(out, zoom=2):
    from art.reference import current_adult_d
    adult = current_adult_d()
    adult = adult[0] if isinstance(adult, tuple) else adult
    ims = [Machiya(W=80, seed=1).render(), Machiya(W=96, seed=2, wood=BENGARA).render(),
           Machiya(W=112, seed=3, shop=False, upper='lattice').render(), Dozo(W=112, seed=4).render(),
           Nagaya(W=160, seed=5).render(), GinzaBrick(W=176, seed=6).render(),
           willow(1), pole(), rickshaw()]
    pad = 10
    W = sum(i.width + pad for i in ims) + adult.width + 2 * pad
    H = max(i.height for i in ims) + 2 * pad
    sheet = Image.new('RGBA', (W, H), '#a09a88')
    x = pad
    for im in ims:
        sheet.alpha_composite(im, (x, H - pad - im.height))
        x += im.width + pad
    sheet.alpha_composite(adult, (x, H - pad - adult.height))
    sheet.resize((W * zoom, H * zoom), Image.NEAREST).save(out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/city-kit/japan.png')
