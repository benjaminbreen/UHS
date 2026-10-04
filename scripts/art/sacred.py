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

# Mosques: a court with its fountain behind a gate, arcades down its sides,
# the prayer hall across the back on the qibla side, and a minaret. A style
# says how each region built that plan.
ASHLAR = ['#2a2628', '#46403e', '#665e56', '#8a806e', '#ab9f88', '#c8bca2', '#e0d4ba', '#f2e8d2']
SANDSTONE = ['#2c221c', '#4a382a', '#6c543c', '#8e7050', '#ad8c66', '#c8a87e', '#dec29a', '#efdab6']
BASALT = ['#121216', '#1c1c22', '#28282e', '#36363c', '#46464c', '#58585e', '#6c6c70']
WHITEWASH = ['#40362e', '#6c5e50', '#988a76', '#c2b49c', '#ded2bc', '#eee6d4', '#f8f4ea']
BUFF_BRICK = ['#2a1c14', '#46301e', '#66482c', '#86603a', '#a47c4c', '#be9864', '#d6b482']
LEAD = ['#181b22', '#262a34', '#363c48', '#4a525e', '#626c78', '#7e8892', '#a0a8b0']
GREEN_TILE = ['#061409', '#0b2412', '#12381c', '#1a5028', '#246a36', '#348648', '#4ea262']
TURQUOISE = ['#05202a', '#08323f', '#0c4a58', '#126474', '#1c8294', '#30a2b0', '#56c0c8', '#92dcdc']
COBALT = ['#080e26', '#0e1a48', '#16286c', '#20388e', '#3050ac', '#4c70c6', '#7896da']
MOSQUES = {
    # Ashlar under lead: a great dome on its drum over a square hall, half-domes
    # and turrets round it, a domed portico, pencil minarets with balconies and
    # lead cones, a court of small domes round a canopied şadırvan. Sinan's Istanbul.
    'ottoman': dict(wall=ASHLAR, roof=LEAD, hall='domed', minaret='pencil', court='domes', fountain='sadirvan'),
    # Stone in alternating courses, a flat-roofed hall of many columns with a
    # gabled transept and a dome over the mihrab bay, a square minaret in stages:
    # the Umayyad mosque of Damascus and the Mamluk mosques of Cairo and Aleppo.
    'arab': dict(wall=SANDSTONE, roof=SANDSTONE, hall='hypostyle', minaret='square', court='arcade', fountain='basin'),
    # Whitewash under green glazed tile, the aisles roofed in parallel gables,
    # a square minaret with its lozenge panels and lantern: Kairouan, Fez, Marrakesh.
    'maghrebi': dict(wall=WHITEWASH, roof=GREEN_TILE, hall='gables', minaret='maghrebi', court='arcade', fountain='basin'),
    # Brick faced in tile: an iwan on the court before an onion dome on a tall
    # drum, tiled minarets at its sides, a long pool in the court. Safavid Isfahan.
    'persian': dict(wall=BUFF_BRICK, roof=TURQUOISE, hall='iwan', minaret='paired', court='arcade', fountain='pool'),
}


class MosqueParts:
    """Round parts lit as round: a dome, a drum or a cone is filled sector by
    sector, each sector with its own normal. Normals are shared by direction,
    since the grid holds at most 255 of them."""

    def nid(self, v):
        key = tuple(round(c, 2) for c in v)
        cache = self.__dict__.setdefault('_nids', {})
        if cache.get('grid') is not self.g:
            cache.clear()
            cache['grid'] = self.g
        if key not in cache:
            cache[key] = self.g.normal(v)
        return cache[key]

    def dome(self, cx, cy, z0, r, h, mat, onion=False):
        g = self.g
        A, E = 16, 6
        for a in range(A):
            a0, a1 = -math.pi + a * 2 * math.pi / A, -math.pi + (a + 1) * 2 * math.pi / A
            for e in range(E):
                e0, e1 = e * (math.pi / 2) / E, (e + 1) * (math.pi / 2) / E
                am, em = (a0 + a1) / 2, (e0 + e1) / 2
                nid = self.nid([math.cos(am) * math.cos(em), math.sin(am) * math.cos(em), math.sin(em)])

                def pred(X, Y, Z, a0=a0, a1=a1, e0=e0, e1=e1):
                    dx, dy, dz = X + 0.5 - cx, Y + 0.5 - cy, Z + 0.5 - z0
                    t = np.clip(dz / h, 0, 1)
                    if onion:
                        rad = np.where(t < 0.35, r * (1 + 0.16 * np.sin(t / 0.35 * np.pi / 2)),
                                       r * 1.16 * np.cos(np.clip((t - 0.35) / 0.65, 0, 1) * np.pi / 2) ** 0.75)
                        inside = (dx * dx + dy * dy <= rad * rad) & (dz >= 0) & (dz <= h)
                    else:
                        inside = (dx * dx + dy * dy) / (r * r) + (dz * dz) / (h * h) <= 1
                        inside &= dz >= 0
                    ang = np.arctan2(dy, dx)
                    el = np.arctan2(dz / h, np.sqrt(dx * dx + dy * dy) / r)
                    return inside & (ang >= a0) & (ang < a1) & (el >= e0) & (el < e1)
                self.fill(int(cx - r * 1.2) - 1, int(cx + r * 1.2) + 2, int(cy - r * 1.2) - 1, int(cy + r * 1.2) + 2,
                          z0, int(z0 + h) + 2, pred, mat, nid)

    def drum(self, cx, cy, z0, z1, r, mat, cone=False):
        """A cylinder, or with `cone` a cone narrowing to a point at z1."""
        g = self.g
        A = 16
        for a in range(A):
            a0, a1 = -math.pi + a * 2 * math.pi / A, -math.pi + (a + 1) * 2 * math.pi / A
            am = (a0 + a1) / 2
            tilt = round((r / max(1, z1 - z0)) if cone else 0, 1)
            nid = self.nid([math.cos(am), math.sin(am), tilt])

            def pred(X, Y, Z, a0=a0, a1=a1):
                dx, dy = X + 0.5 - cx, Y + 0.5 - cy
                rad = r * (1 - (Z + 0.5 - z0) / (z1 - z0)) if cone else r
                ang = np.arctan2(dy, dx)
                return (dx * dx + dy * dy <= rad * rad) & (ang >= a0) & (ang < a1)
            self.fill(int(cx - r) - 1, int(cx + r) + 2, int(cy - r) - 1, int(cy + r) + 2, z0, z1, pred, mat, nid)

    def arch(self, x0, x1, y0, y1, z0, spring, rise):
        """Cut a pointed arch through a wall facing the viewer."""
        mid, half = (x0 + x1) / 2, (x1 - x0) / 2
        for x in range(x0, x1):
            u = abs(x + 0.5 - mid) / half
            self.cut(x, x + 1, y0, y1, z0, spring + int(rise * (1 - u) ** 0.6))

    def mosque(self, st):
        g, W, D = self.g, self.W, self.D
        look = self.r.get('look', 0)
        course = self.tex['course']
        ablaq = st is MOSQUES['arab'] and look != 1
        wall = g.mat(st['wall'], tex=(lambda i: 2.0 * ((i['z'] // 4) % 2) - 1.4) if ablaq else (lambda i: course(i) * 0.5), bias=-0.1)
        trim = g.mat(st['wall'], bias=0.6)
        plain = g.mat(st['wall'], bias=0.2)
        roof = g.mat(st['roof'], tex=lambda i: -0.7 * (i['x'] % 6 == 0), bias=0.1)
        tiles = g.mat(st['roof'], tex=lambda i: 0.9 * (i['y'] % 4 == 0) - 0.5 * (i['x'] % 5 == 0), bias=0.0)
        lead = g.mat(LEAD, bias=0.3)
        pave = g.mat(PAVING if st['wall'] is not WHITEWASH else ASHLAR, tex=lambda i: -0.9 * ((i['x'] % 9 == 0) | (i['y'] % 9 == 0)), bias=0.4)
        dark = g.mat(['#0c0a10', '#16121a', '#201a22'])
        door = g.mat(OAK, bias=-0.2)
        gilt = g.mat(GILT, bias=0.5)
        marble = g.mat(['#3a3a40', '#5e5e64', '#86868a', '#acaaa8', '#cecac4', '#ece8e0'], bias=0.6)
        water = g.mat(['#0e1e2c', '#16324a', '#1e4c68', '#2c6a84', '#4a8ca0', '#6eaab8'], bias=0.5)
        tile = g.mat(COBALT if look == 2 else TURQUOISE, tex=lambda i: 1.2 * (((i['x'] // 3) + (i['z'] // 3)) % 2) - 0.6, bias=0.0)
        dome_mat = g.mat(COBALT if (st['hall'] == 'iwan' and look == 2) else st['roof'] if st['hall'] in ('iwan', 'domed') else LEAD,
                         tex=(lambda i: 0.8 * (((i['x'] // 4) + (i['z'] // 3)) % 2) - 0.3) if st['hall'] == 'iwan' else None, bias=0.3)
        t, H = 6, 26
        cx = W // 2
        hy0 = int(D * 0.5)
        # The court, its enclosure and the gate.
        self.box(0, W, 0, D, 0, 1, pave)
        for x0, x1, y0, y1 in ((0, W, 0, t), (0, t, 0, hy0), (W - t, W, 0, hy0)):
            self.box(x0, x1, y0, y1, 0, H, wall)
            self.box(x0, x1, y0, y1, H, H + 2, trim)
        gw, gh = 18, 40
        self.box(cx - gw // 2 - 8, cx + gw // 2 + 8, -6, t + 2, 0, gh, wall)
        self.box(cx - gw // 2 - 8, cx + gw // 2 + 8, -6, t + 2, gh, gh + 2, trim)
        if st['hall'] == 'iwan':
            self.box(cx - gw // 2 - 6, cx + gw // 2 + 6, -7, -6, 4, gh - 2, tile)
        self.arch(cx - gw // 2, cx + gw // 2, -7, t + 3, 0, gh - 16, 10)
        self.box(cx - gw // 2, cx + gw // 2, t + 2, t + 3, 0, 22, door)
        if st['minaret'] == 'maghrebi':
            # A tiled hood over the gate.
            for k in range(6):
                self.box(cx - gw // 2 - 8 + k, cx + gw // 2 + 8 - k, -10, -6 + k, gh + 2 + k, gh + 3 + k, tiles)
        # Arcades down the sides of the court.
        ad = 14
        for x0 in (t, W - t - ad):
            self.box(x0, x0 + ad, t, hy0, H - 4, H, plain)
            face = x0 + ad - 1 if x0 == t else x0
            for y in range(t + 4, hy0 - 6, 14):
                self.box(face, face + 1, y, y + 3, 0, H - 4, plain)
                if st['court'] == 'domes':
                    self.dome(x0 + ad / 2, y + 7, H, 6, 6, lead)
        # The fountain.
        fx, fy = cx, int(hy0 * 0.52)
        if st['fountain'] == 'pool':
            self.box(cx - 24, cx + 24, fy - 8, fy + 8, 0, 3, marble)
            self.box(cx - 22, cx + 22, fy - 6, fy + 6, 2, 3, water)
        else:
            self.drum(fx, fy, 0, 5, 8, marble)
            self.drum(fx, fy, 4, 5, 6.5, water)
            if st['fountain'] == 'sadirvan':
                for k in range(8):
                    a = k * math.pi / 4
                    px, py = int(fx + math.cos(a) * 7), int(fy + math.sin(a) * 7)
                    self.box(px, px + 1, py, py + 1, 5, 18, marble)
                self.drum(fx, fy, 18, 20, 11, lead)
                self.drum(fx, fy, 20, 30, 11, lead, cone=True)
            else:
                self.drum(fx, fy, 5, 9, 2, marble)
        # The prayer hall across the back.
        hx0, hx1 = 4, W - 4
        hz = {'domed': 40, 'hypostyle': 34, 'gables': 30, 'iwan': 38}[st['hall']]
        # The hall's own roof: lead round the domes, a rolled earth terrace, or brick.
        terrace = g.mat({'domed': LEAD, 'hypostyle': MUDBRICK, 'gables': st['wall'], 'iwan': BUFF_BRICK}[st['hall']],
                        tex=lambda i: 0.7 * (((i['x'] // 9) + (i['y'] // 7)) % 3 == 0) - 0.6 * (i['y'] % 11 == 0), bias=-0.4)
        self.box(hx0, hx1, hy0, D - 2, 0, hz, wall)
        self.box(hx0, hx1, hy0, D - 2, hz, hz + 2, terrace)
        self.box(hx0, hx1, hy0, hy0 + 2, hz, hz + 2, trim)
        for x in range(hx0 + 8, hx1 - 8, 12):
            if abs(x + 2 - cx) < 22:
                continue
            self.arch(x, x + 5, hy0 - 1, hy0 + 2, 10, 20, 5)
            self.box(x, x + 5, hy0 + 1, hy0 + 2, 10, 26, dark)
        hall_w, hall_d = hx1 - hx0, D - 2 - hy0
        hcy = hy0 + hall_d / 2
        if st['hall'] == 'domed':
            # A portico of small domes before the door, the great dome on its drum, half-domes and turrets.
            self.box(hx0 + 10, hx1 - 10, hy0 - 16, hy0, 0, 2, marble)
            for x in range(hx0 + 14, hx1 - 14, 16):
                self.box(x, x + 3, hy0 - 15, hy0 - 12, 2, 24, marble)
            self.box(hx0 + 10, hx1 - 10, hy0 - 16, hy0, 24, 28, plain)
            for x in range(hx0 + 22, hx1 - 14, 16):
                self.dome(x, hy0 - 8, 28, 7, 6, lead)
            R = min(hall_w * 0.26, hall_d * 0.44)
            self.drum(cx, hcy, hz, hz + 12, R + 1, plain)
            for k in range(16):
                a = k * math.pi / 8
                wx, wy = cx + math.cos(a) * (R + 1), hcy + math.sin(a) * (R + 1)
                if wy < hcy:
                    self.box(int(wx), int(wx) + 2, int(wy) - 1, int(wy), hz + 4, hz + 9, dark)
            self.dome(cx, hcy, hz + 12, R, R * 0.8, lead)
            for s in (-1, 1):
                self.dome(cx + s * (R + R * 0.55), hcy, hz + 2, R * 0.5, R * 0.42, lead)
                for sy in (-1, 1):
                    self.drum(cx + s * (R + 2), hcy + sy * (R * 0.7), hz + 2, hz + 14, 3, plain)
                    self.drum(cx + s * (R + 2), hcy + sy * (R * 0.7), hz + 14, hz + 20, 3, lead, cone=True)
            self.box(int(cx), int(cx) + 1, int(hcy), int(hcy) + 1, int(hz + 12 + R * 0.8), int(hz + 20 + R * 0.8), gilt)
        elif st['hall'] == 'hypostyle':
            # Crenellated flat roof, a gabled transept down the middle, a dome before the mihrab.
            for x in range(hx0, hx1, 7):
                self.box(x, x + 4, hy0, hy0 + 3, hz + 2, hz + 6, trim)
            tw = 36
            self.box(cx - tw // 2, cx + tw // 2, hy0 - 4, D - 2, 0, hz + 4, wall)
            for k in range(tw // 2):
                self.box(cx - tw // 2 + k, cx + tw // 2 - k, hy0 - 3, D - 2, hz + 4 + k, hz + 5 + k, lead)
                self.box(cx - tw // 2 + k, cx + tw // 2 - k, hy0 - 4, hy0 - 3, hz + 4 + k, hz + 5 + k, wall)
            self.arch(cx - 9, cx + 9, hy0 - 5, hy0 + 2, 0, 22, 9)
            self.arch(cx - 4, cx + 4, hy0 - 5, hy0 - 3, hz + 6, hz + 10, 3)
            dy = int(hy0 + hall_d * 0.62)
            self.drum(cx, dy, hz + 4, hz + 22, 17, plain)
            for k in range(8):
                a = math.pi + k * math.pi / 7
                self.box(int(cx + math.cos(a) * 17), int(cx + math.cos(a) * 17) + 2, int(dy + math.sin(a) * 17) - 1, int(dy + math.sin(a) * 17), hz + 12, hz + 18, dark)
            self.dome(cx, dy, hz + 22, 16, 15, lead)
            self.box(cx, cx + 1, dy, dy + 1, hz + 37, hz + 43, gilt)
        elif st['hall'] == 'gables':
            # Parallel aisles, each under its own ridge of green glazed tile.
            for x in range(hx0, hx1, 22):
                for k in range(11):
                    self.box(x + k, x + 22 - k, hy0, D - 2, hz + 2 + k, hz + 3 + k, tiles)
            self.box(cx - 10, cx + 10, hy0 - 4, hy0, 0, hz + 6, wall)
            for k in range(8):
                self.box(cx - 12 + k, cx + 12 - k, hy0 - 8, hy0, hz + 6 + k, hz + 7 + k, tiles)
            self.arch(cx - 7, cx + 7, hy0 - 5, hy0 + 1, 0, 16, 9)
        else:
            # The iwan: a tiled portal standing above the hall, an onion dome behind.
            pw, ph = 46, hz + 34
            self.box(cx - pw // 2, cx + pw // 2, hy0 - 6, hy0 + 8, 0, ph, wall)
            self.box(cx - pw // 2 + 2, cx + pw // 2 - 2, hy0 - 7, hy0 - 6, 2, ph - 2, tile)
            self.arch(cx - pw // 2 + 8, cx + pw // 2 - 8, hy0 - 8, hy0 + 4, 0, ph - 20, 14)
            self.box(cx - pw // 2 + 8, cx + pw // 2 - 8, hy0 + 3, hy0 + 4, 0, ph - 18, tile)
            self.box(cx - 6, cx + 6, hy0 + 2, hy0 + 3, 0, 22, door)
            R = min(hall_w * 0.2, hall_d * 0.36)
            self.drum(cx, hcy + 6, hz, hz + 26, R, tile)
            self.dome(cx, hcy + 6, hz + 26, R, R * 1.5, dome_mat, onion=True)
            self.box(int(cx), int(cx) + 1, int(hcy + 6), int(hcy + 6) + 1, int(hz + 26 + R * 1.5), int(hz + 34 + R * 1.5), gilt)
        # The minaret.
        top = self.ztop() - 6
        if st['minaret'] == 'pencil':
            n = 1 if W < 230 else 2 if W < 280 else 4
            spots = [(hx0 + 10, hy0 - 4), (hx1 - 10, hy0 - 4), (hx0 + 10, D - 8), (hx1 - 10, D - 8)][:n]
            for mx, my in spots:
                h = top - 26 - (0 if my < hy0 else 10)
                self.drum(mx, my, 0, h, 4.2, plain)
                for bz in ([int(h * 0.7)] if n == 1 else [int(h * 0.6), int(h * 0.8)]):
                    self.drum(mx, my, bz, bz + 2, 6.5, trim)
                self.drum(mx, my, h, h + 24, 4.6, lead, cone=True)
                self.box(int(mx), int(mx) + 1, int(my), int(my) + 1, h + 22, h + 28, gilt)
        elif st['minaret'] == 'paired':
            for s in (-1, 1):
                mx, my = cx + s * 28, hy0 - 2
                h = top - 14
                self.drum(mx, my, 0, h, 4.4, tile)
                self.drum(mx, my, int(h * 0.82), int(h * 0.82) + 3, 6.5, wall)
                self.dome(mx, my, h, 4.4, 6, dome_mat)
        else:
            # A square tower in stages at the front corner of the court.
            mw = 22 if st['minaret'] == 'maghrebi' else 14
            mx0, my0 = (t + 2, -2) if st['minaret'] == 'maghrebi' else (hx0 + 2, hy0 - 16)
            h = top - (24 if st['minaret'] == 'maghrebi' else 26)
            self.box(mx0, mx0 + mw, my0, my0 + mw, 0, h, wall if st['minaret'] == 'square' else plain)
            if st['minaret'] == 'maghrebi':
                # Lozenge panels in carved brick and tile, and paired windows, stage over stage.
                for z in range(int(h * 0.22), h - 14, 26):
                    for k in range(6):
                        self.box(mx0 + 4 + k, mx0 + mw - 4 - k, my0 - 1, my0, z + 12 - k * 2, z + 13 - k * 2, tile)
                        self.box(mx0 + 4 + k, mx0 + mw - 4 - k, my0 - 1, my0, z + 12 + k * 2, z + 13 + k * 2, tile)
                    self.arch(mx0 + 8, mx0 + 10, my0 - 1, my0 + 2, z, z + 6, 2)
                    self.arch(mx0 + 12, mx0 + 14, my0 - 1, my0 + 2, z, z + 6, 2)
                self.box(mx0, mx0 + mw, my0 - 1, my0 + mw, h - 6, h - 2, tile)
                for x in range(mx0, mx0 + mw, 4):
                    self.box(x, x + 2, my0, my0 + mw, h, h + 4, plain)
                self.box(mx0 + 4, mx0 + mw - 4, my0 + 4, my0 + mw - 4, h, h + 14, plain)
                self.dome(mx0 + mw / 2, my0 + mw / 2, h + 14, 3.5, 4, tiles)
                for k, z in enumerate((h + 20, h + 23, h + 25)):
                    self.drum(mx0 + mw / 2, my0 + mw / 2, z, z + 2, 1.5 - k * 0.3, gilt)
            else:
                for z in (int(h * 0.45), int(h * 0.75)):
                    self.box(mx0 - 1, mx0 + mw + 1, my0 - 1, my0 + mw + 1, z, z + 2, trim)
                self.arch(mx0 + 3, mx0 + mw - 3, my0 - 1, my0 + 1, h - 18, h - 10, 4)
                self.box(mx0 - 1, mx0 + mw + 1, my0 - 1, my0 + mw + 1, h, h + 2, trim)
                self.drum(mx0 + mw / 2, my0 + mw / 2, h + 2, h + 12, 4, plain)
                self.dome(mx0 + mw / 2, my0 + mw / 2, h + 12, 4.5, 6, lead, onion=True)
                self.box(mx0 + mw // 2, mx0 + mw // 2 + 1, my0 + mw // 2, my0 + mw // 2 + 1, h + 18, h + 24, gilt)
        self.door_x = self.sx0 + cx
        self.front = -6


class VoxelTemple(VoxelBuilding, MosqueParts):
    """A walled precinct, its gate in the front wall; or a mosque."""

    def ztop(self):
        return 90 + self.W // 6 if self.r.get('style') in MOSQUES else 66

    def build(self):
        if self.r.get('style') in MOSQUES:
            return self.mosque(MOSQUES[self.r['style']])
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
                    **({'shadowFrame': f'religious-{style}-temple-{scale}-0'} if look else {}),
                    'religious': True, 'family': f'{style}-temple', 'recipe': f'{style}-temple',
                }
    walls = {'ottoman': 'field-stone', 'arab': 'field-stone', 'maghrebi': 'white-plaster', 'persian': 'bengal-brick'}
    for style in MOSQUES:
        for scale, fp in {'small': [12, 10], 'medium': [15, 12], 'large': [18, 14]}.items():
            for look in range(3):
                out[f'religious-{style}-mosque-{scale}-{look}'] = {
                    'label': {'small': 'Mosque', 'medium': 'Mosque', 'large': 'Great mosque'}[scale], 'footprint': fp,
                    'entrance': [fp[0] // 2, fp[1]], 'wall': walls[style], 'roof': 'flat', 'roofMaterial': 'tar',
                    'attachments': [], 'opening': 'door', 'height': 90 + fp[0] * 16 // 6,
                    'description': 'A mosque: a gate into a court with its fountain for ablution, arcades down its sides, the prayer hall across the back facing Mecca, and the minaret the call to prayer is given from.',
                    'sacredVoxel': style, 'style': style, 'look': look, 'seed': 600 + look * 7 + len(out), 'stories': 1,
                    **({'shadowFrame': f'religious-{style}-mosque-{scale}-0'} if look else {}),
                    'religious': True, 'family': f'{style}-mosque', 'recipe': f'{style}-mosque',
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
